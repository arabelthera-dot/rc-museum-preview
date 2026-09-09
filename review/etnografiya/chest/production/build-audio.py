from pathlib import Path
import re,asyncio,json,subprocess,sys
import edge_tts
p=Path(__file__).resolve().parents[1]; out=p/'media'
a=(p/'production/audioguide.md').read_text().split('## Текст записи')[1].split('## Опоры')[0]
a='\n\n'.join(x for x in a.split('\n\n') if x.strip() and not x.lstrip().startswith(('#','[')))
(out/'audioguide.txt').write_text(a)
v='Снаружи — ларец. Перед тобой русская вещь тысяча семьсот пятидесятого года. Крышка скрывает её устройство. Железные полосы делят поверхность на клетки. Внутри клеток — ажурные розетки. Твёрдый металл становится узором. На замочной пластине сохранились год и имя Ивана Чупятова. Но одного имени недостаточно, чтобы восстановить биографию человека. Теперь сменим ракурс. За крышкой — отдельные ящики. Девять отделений. Восемь ящиков. Посмотри на пустое место справа вверху. У рядов разная высота. Можно увидеть, как распределено пространство, даже не зная, что здесь хранили. Вернём общий вид. Крышка снова закрыта, но теперь за ней ты можешь мысленно разместить увиденные ящики. Так раскрывается работа русского мастера: одна вещь соединяет наружную отделку и внутренний порядок. Рассмотри детали на странице музея. Поддержи проект Русская цивилизация.'
(out/'video-narration.txt').write_text(v)
async def one(text,name):
 await edge_tts.Communicate(text,'ru-RU-DmitryNeural',rate='-5%').save(str(out/name))
 print(name,'done',flush=True)
async def main():await asyncio.gather(one(a,'audioguide.mp3'),one(v,'video-voice.mp3'))
asyncio.run(main())
