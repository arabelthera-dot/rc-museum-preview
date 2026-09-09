from pathlib import Path
import asyncio,edge_tts,json,subprocess,re
p=Path(__file__).resolve().parents[1]/'media';tmp=Path('/tmp/chest-video-full');tmp.mkdir(exist_ok=True)
async def voice():
 await edge_tts.Communicate((p/'video-narration.txt').read_text(),'ru-RU-DmitryNeural',rate='-5%').save(str(p/'video-voice.mp3'),str(tmp/'speech.jsonl'))
asyncio.run(voice())
def time(s):
 ms=round(s*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
lines=['WEBVTT',''];events=[json.loads(l) for l in (tmp/'speech.jsonl').read_text().splitlines()]
for e in events:
 if e['type'].endswith('Boundary'):
  lines.extend([time(e['offset']/1e7)+' --> '+time((e['offset']+e['duration'])/1e7),e['text'],''])
(p/'chest-film.vtt').write_text('\n'.join(lines))
dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(p/'video-voice.mp3')]))
# Existing common renderer places titles over photographs. Here the photograph and captions use disjoint zones, as required by the current museum canon.
scenes=[('chest',15,'Снаружи — ларец'),('lock',18,'Дата и имя на металле'),('drawers',22,'Внутренний вид того же ларца'),('chest',max(6,dur-55),'Отделка и устройство одной вещи'),('chest',6,'Русская цивилизация · Музей русских вещей и мастерства')]
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
for i,(photo,seconds,title) in enumerate(scenes):
 (tmp/f'title{i}.txt').write_text(title)
 vf=f"scale=1600:780:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:25:color=0x060c17,drawtext=fontfile={font}:textfile={tmp}/title{i}.txt:fontcolor=0xc9a84c:fontsize=32:x=(w-tw)/2:y=850"
 cmd=['ffmpeg','-v','error','-y','-loop','1','-i',str(p/(photo+'.jpeg')),'-t',str(seconds),'-vf',vf,'-r','25','-c:v','libx264','-threads','3','-preset','ultrafast','-crf','25','-tune','stillimage','-pix_fmt','yuv420p',str(tmp/f'{i}.mp4')]
 subprocess.run(cmd,check=True);print('scene',i,'done',flush=True)
(tmp/'concat.txt').write_text(''.join("file '"+str(tmp/f'{i}.mp4')+"'\n" for i in range(len(scenes))))
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(tmp/'concat.txt'),'-i',str(p/'video-voice.mp3'),'-vf',f"subtitles={p}/chest-film.vtt:force_style='FontName=DejaVu Sans,FontSize=12,Alignment=2,MarginV=12,Outline=0'",'-c:v','libx264','-threads','3','-preset','fast','-crf','25','-c:a','aac','-ar','48000','-ac','2','-af','apad=pad_dur=6','-t',str(dur+6),'-movflags','+faststart',str(p/'chest-film.mp4')],check=True)
print('FILM DONE',dur+6,(p/'chest-film.mp4').stat().st_size,flush=True)
