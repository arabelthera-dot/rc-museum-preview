from pathlib import Path
import asyncio,edge_tts,subprocess,json,textwrap
p=Path(__file__).resolve().parents[1];m=p/'media';tmp=Path('/tmp/chest-film-v2');tmp.mkdir(exist_ok=True)
scenes=[
('chest',None,'Одна крышка. Что за ней?','Одна крышка скрывает всё. Попробуй угадать: сколько отделений внутри этого ларца?'),
('drawers',None,'Девять мест. Восемь ящиков.','Вот внутренний вид. Мест девять, а ящиков восемь. Найди, где числа расходятся.'),
('drawers','crop=310:310:525:70','Справа вверху — пустое место','Посмотри вправо и вверх. Одно отделение пустует. Его границы видны и без ящика.'),
('drawers','crop=835:190:0:135','Рамка делит пространство','Теперь веди взгляд вдоль горизонтальной рамки. Она отделяет один ряд от другого.'),
('drawers','crop=835:260:0:315','Высота рядов различается','Сравни верх и низ. У рядов разная высота: внутреннее пространство не разделено поровну.'),
('drawers','crop=420:320:0:180','Кольцо лежит на фасаде','Кольцо на деревянном фасаде даёт руке зацепку. Так маленькая деталь помогает пользоваться вещью.'),
('chest','crop=500:350:80:90','Снаружи — другой порядок','Снаружи порядок другой. Железные полосы делят крышку на клетки, а в клетках повторяется узор.'),
('drawers',None,'Форма видна. Содержимое неизвестно.','Устройство можно рассмотреть. Но фотография не расскажет, что именно хранил здесь владелец.'),
('chest',None,'Русская вещь. 1750 год.','Русский мастер соединил прочный корпус, внутренний порядок и ажурную отделку. Всё это сохранила одна вещь.'),
('drawers',None,'Собери внутренний вид сам','Теперь восстанови фотографию на странице. Соедини рамку и ряды. Поддержи проект Русская цивилизация.')]
sem=asyncio.Semaphore(3)
async def voice(i,t):
 async with sem:await edge_tts.Communicate(t,'ru-RU-DmitryNeural',rate='+0%').save(str(tmp/f'{i}.mp3'))
async def main():await asyncio.gather(*(voice(i,x[3]) for i,x in enumerate(scenes)))
asyncio.run(main())
def tm(t):
 n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02}.{n%1000:03}'
vtt=['WEBVTT',''];offset=0
for i,(photo,crop,title,speech) in enumerate(scenes):
 dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(tmp/f'{i}.mp3')]))+.7;dur=max(dur,6)
 (tmp/f'title{i}.txt').write_text('\n'.join(textwrap.wrap(title,30)))
 filt=(crop+',' if crop else '')+'scale=860:660:force_original_aspect_ratio=decrease,pad=900:1000:(ow-iw)/2:20:color=0x060c17'+f",drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile={tmp}/title{i}.txt:fontcolor=0xe4c97a:fontsize=42:line_spacing=12:x=(w-tw)/2:y=720"
 subprocess.run(['ffmpeg','-v','error','-y','-loop','1','-i',str(m/(photo+'.jpeg')),'-i',str(tmp/f'{i}.mp3'),'-t',str(dur),'-vf',filt,'-r','15','-c:v','libx264','-threads','2','-preset','ultrafast','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-af','apad','-ar','48000','-ac','2',str(tmp/f'{i}.mp4')],check=True)
 vtt += [tm(offset)+' --> '+tm(offset+dur-.2),speech,''];offset+=dur;print('scene',i,flush=True)
(tmp/'concat.txt').write_text(''.join("file '"+str(tmp/f'{i}.mp4')+"'\n" for i in range(len(scenes))))
(m/'chest-film.vtt').write_text('\n'.join(vtt));(m/'video-narration.txt').write_text('\n\n'.join(x[3] for x in scenes))
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(tmp/'concat.txt'),'-c','copy','-movflags','+faststart',str(m/'chest-film.mp4')],check=True)
(p/'production/film-v2.json').write_text(json.dumps({'duration':offset,'scenes':scenes,'sound':'Синтезированный рассказ. Звук музейной вещи не записан и не имитируется; предметное доказательство — сопоставление участков фотографии.','roles':'Видео — зрительная загадка; аудиогид — неспешный маршрут взгляда по материалам.'},ensure_ascii=False,indent=2))
# Replace film transcript from this single source.
s=(p/'full-source.html').read_text();import re
s=re.sub(r'(<summary>Прочитать текст ролика</summary>)<p>[\s\S]*?</p>',lambda z:z[1]+''.join('<p>'+x[3]+'</p>' for x in scenes),s,count=1);s=s.replace('<h2>Снаружи — ларец</h2>','<h2>Девять мест. Восемь ящиков.</h2>');(p/'full-source.html').write_text(s)
print('duration',offset,flush=True)
