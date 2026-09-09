"""Recompose the existing documentary film; preserve photos and recorded narration.

The generic make-day-video.py recolours photographs and overlays captions on them.
This adapter preserves the source colour and keeps all type in a separate band.
Voice masters: video-studio/things/chest-1750/voice (outside Git).
"""
from pathlib import Path
import json, subprocess, textwrap, math, hashlib, concurrent.futures

P=Path(__file__).resolve().parents[1]
M=P/'media'
STUDIO=Path('/home/agent/projects/russian-civilization/video-studio/things/chest-1750')
B=STUDIO/'build'; B.mkdir(parents=True,exist_ok=True)
scenes=json.loads((P/'production/film-v2.json').read_text())['scenes']
SHORT=[0,1,2,9]
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def run(args):
 subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def probe(f):
 return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)]))
def stamp(t):
 n=round(t*100);return f'{n//360000:01}:{n//6000%60:02}:{n//100%60:02}.{n%100:02}'
durations=[math.ceil((float(probe(STUDIO/'voice'/f'{i}.mp3')['format']['duration'])+.7)*25)/25 for i in range(len(scenes))]
def render(fmt):
 vertical=fmt=='vertical';w,h=(1080,1920) if vertical else (1920,1080)
 ids=SHORT if vertical else list(range(len(scenes)))
 total=sum(durations[i] for i in ids)
 # Two-pass target budget; no manual recompression after render.
 limit=15 if vertical else 25
 bitrate=int(limit*1024*1024*8*.84/total-160000)
 parts=[];timeline=[];offset=0
 for i in ids:
  photo,crop,title,speech=scenes[i];dur=durations[i]
  titlefile=B/f'{fmt}-{i}-title.txt';titlefile.write_text('\n'.join(textwrap.wrap(title,32 if vertical else 65)))
  ass=B/f'{fmt}-{i}.ass'
  asslines=['[Script Info]',f'PlayResX: {w}',f'PlayResY: {h}','[V4+ Styles]',
   'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
   f'Style: Default,DejaVu Sans,{42 if vertical else 40},&H00F5EEE8,&H00F5EEE8,&H00170C06,&H00170C06,0,0,0,0,100,100,0,0,1,0,0,8,60,60,{1280 if vertical else 850},1',
   '[Events]','Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
  # Full speech in short successive cues, weighted to the existing voice duration.
  chunks=textwrap.wrap(speech,64 if vertical else 88)
  voice=float(probe(STUDIO/'voice'/f'{i}.mp3')['format']['duration'])
  acc=0;weight=sum(len(c) for c in chunks)
  for chunk in chunks:
   end=acc+voice*len(chunk)/weight
   lines='\\N'.join(textwrap.wrap(chunk,35 if vertical else 75))
   asslines.append(f'Dialogue: 0,{stamp(acc)},{stamp(end)},Default,,0,0,0,,{lines}')
   acc=end
  ass.write_text('\n'.join(asslines))
  visual=(crop+',' if crop else '')+f'scale={960 if vertical else 1500}:{930 if vertical else 670}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:{100 if vertical else 50}:color=0x060c17'
  title_y='1228-th' if vertical else '760'
  vf=visual+f",drawtext=fontfile={FONT}:textfile={titlefile}:fontcolor=0xe4c97a:fontsize={49 if vertical else 56}:line_spacing=10:x=(w-tw)/2:y={title_y},ass={ass}"
  brand=B/'brand.txt';brand.write_text('Русская цивилизация · Музей русских вещей и мастерства')
  vf+=f",drawtext=fontfile={FONT}:textfile={brand}:fontcolor=0xc6d8e8:fontsize={23 if vertical else 30}:x=(w-tw)/2:y={35 if vertical else 1010}"
  dest=B/f'{fmt}-{i}.mp4';log=B/f'pass-{fmt}-{i}'
  common=['ffmpeg','-v','error','-y','-loop','1','-framerate','25','-i',str(M/(photo+'.jpeg')),'-i',str(STUDIO/'voice'/f'{i}.mp3'),'-t',str(dur),'-vf',vf,'-r','25','-c:v','libx264','-threads','2','-preset','veryfast','-b:v',str(bitrate),'-pix_fmt','yuv420p','-passlogfile',str(log)]
  run(common+['-pass','1','-an','-f','null','/dev/null'])
  run(common+['-pass','2','-c:a','aac','-b:a','160k','-af','apad','-ar','48000','-ac','2',str(dest)])
  parts.append(dest);timeline.append({'scene':i,'start':offset,'end':offset+dur,'text':speech,'short':i in SHORT});offset+=dur
  print(fmt,'scene',i,flush=True)
 concat=B/f'{fmt}-concat.txt';concat.write_text(''.join(f"file '{f}'\n" for f in parts))
 out=M/('chest-film-v3-9x16.mp4' if vertical else 'chest-film-v3.mp4')
 run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(concat),'-c','copy','-movflags','+faststart',str(out)])
 data=probe(out);v=next(x for x in data['streams'] if x['codec_type']=='video');a=next(x for x in data['streams'] if x['codec_type']=='audio');seconds=float(data['format']['duration'])
 assert (v['width'],v['height'],v['r_frame_rate'],v['pix_fmt'])==(w,h,'25/1','yuv420p')
 assert a['sample_rate']=='48000' and a['channels']==2
 assert (35<=seconds<=45) if vertical else (60<=seconds<=90)
 assert out.stat().st_size<=limit*1024*1024
 raw=out.read_bytes();assert raw.index(b'moov')<raw.index(b'mdat')
 poster=out.with_suffix('.jpg');run(['ffmpeg','-v','error','-y','-ss','1','-i',str(out),'-frames:v','1',str(poster)])
 return fmt,{'path':out.name,'width':w,'height':h,'fps':25,'duration':seconds,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'timeline':timeline,'burned_speech':True,'caption_band':[1280,1400] if vertical else [850,970],'title_bottom':1228 if vertical else 830}

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 result=dict(pool.map(render,['horizontal','vertical']))
(P/'production/film-standard.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({k:{x:v[x] for x in ['width','height','fps','duration','bytes']} for k,v in result.items()}),flush=True)
