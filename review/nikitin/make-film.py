from PIL import Image
from pathlib import Path
import json,subprocess,re
r=Path(__file__).resolve().parents[2]/'muzei/pervoprohodcy/nikitin';a=json.load(open(r/'audio.json'));dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(r/'voice-6.mp3')]))
files=['atlas-preview.jpg','volga.jpg','hormuz.jpg','bidar.jpg','baku.jpg','trabzon.jpg','book.jpg'];out=Path('/tmp/nikitin-film');out.mkdir(exist_ok=True)
for i,f in enumerate(files):
 im=Image.open(r/f).convert('RGB');w,h=im.size;target=16/9
 if w/h>target:
  nw=int(h*target);im=im.crop(((w-nw)//2,0,(w+nw)//2,h))
 else:
  nh=int(w/target);y=int((h-nh)*(.36 if i==0 else .5));im=im.crop((0,y,w,y+nh))
 im.resize((1280,720)).save(out/f'{i}.jpg',quality=90)
 if i==0:im.resize((1280,720)).save(r/'film-poster.jpg',quality=88)
 subprocess.run(['ffmpeg','-y','-v','error','-loop','1','-i',str(out/f'{i}.jpg'),'-vf',"zoompan=z='min(zoom+0.00025,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=20,fade=t=in:st=0:d=0.5",'-t',str(dur/7),'-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p',str(out/f'{i}.mp4')],check=True)
 print('frame',i,flush=True)
(out/'concat.txt').write_text(''.join(f"file '{i}.mp4'\n" for i in range(7)))
subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(out/'concat.txt'),'-i',str(r/'voice-6.mp3'),'-c:v','copy','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',str(r/'film.mp4')],check=True)
# Captions keep the complete narration accessible.
sent=re.split(r'(?<=[.!?])\s+',a['film']);total=sum(len(s) for s in sent);t=0;vtt='WEBVTT\n\n'
def ts(x):return f'{int(x)//3600:02}:{int(x)//60%60:02}:{x%60:06.3f}'
for i,s in enumerate(sent):
 e=t+len(s)/total*dur;vtt+=f'{i+1}\n{ts(t)} --> {ts(e)}\n{s}\n\n';t=e
(r/'film.vtt').write_text(vtt)
print('film',round(dur,2),'seconds',flush=True)
