#!/usr/bin/env python3
# Аудиогид «Горе от ума» — Грибоедов, запрет, списки, Пушкин, премьера после смерти автора.
# Голос мужской, документальный комментарий (museum-literatura).
# edge-tts рвётся на длинном тексте одним вызовом — синтез по абзацам, склейка байтов mp3.
import asyncio
import os
import json

import edge_tts
from mutagen.mp3 import MP3

OUT = os.path.dirname(os.path.abspath(__file__))
VOICE = "ru-RU-DmitryNeural"
RATE = "-6%"
MP3_PATH = f"{OUT}/../audio-guide-gore-ot-uma-griboedov-ru.mp3"

PARTS = [
    ("intro", "Александр Грибоедов. «Горе от ума». Комедия, завершённая в тысяча восемьсот двадцать четвёртом году."),
    ("zapret", "Цензура запретила печатать пьесу целиком. Пятнадцатого декабря тысяча восемьсот двадцать "
               "четвёртого года в альманахе «Русская Талия» вышел только отрывок, с сокращениями — "
               "единственная публикация при жизни автора."),
    ("spiski", "Запрет не остановил пьесу. Она разошлась по России в рукописных списках, их переписывали "
               "от руки тысячи раз. Критик Ксенофонт Полевой писал: где и у кого нет рукописного "
               "«Горя от ума»?"),
    ("pushkin", "Александр Пушкин прочитал комедию в списке и в конце января тысяча восемьсот двадцать "
                "пятого года написал Александру Бестужеву из Михайловского: о стихах я не говорю — "
                "половина должны войти в пословицу."),
    ("sbylos", "Пушкин оказался прав. Фразы Чацкого и Софьи повторяют до сих пор, часто не зная, откуда они."),
    ("premiera", "Сам Грибоедов так и не увидел пьесу на сцене целиком — он погиб в Тегеране в тысяча "
                 "восемьсот двадцать девятом году. Премьера состоялась только двадцать шестого января "
                 "тысяча восемьсот тридцать первого года, в Александринском театре в Петербурге."),
    ("izdanie", "Полный текст без цензурных сокращений напечатали лишь в тысяча восемьсот шестьдесят "
                "втором году — через тридцать восемь лет после того, как пьеса была написана."),
]


async def main():
    chunks = []
    timings = []
    cursor = 0.0
    for key, text in PARTS:
        tmp = f"{OUT}/part-{key}.mp3"
        for attempt in range(12):
            try:
                tts = edge_tts.Communicate(text, VOICE, rate=RATE)
                await tts.save(tmp)
                break
            except Exception as e:
                wait = min(60, 3 * (attempt + 1))
                print(f"part {key} attempt {attempt}: {e} -> sleep {wait}s")
                await asyncio.sleep(wait)
        else:
            raise RuntimeError(f"part {key} failed after retries")
        dur = MP3(tmp).info.length
        timings.append({"key": key, "start": round(cursor, 2), "dur": round(dur, 2), "text": text})
        cursor += dur
        chunks.append(tmp)
        print(f"part {key}: {os.path.getsize(tmp)} bytes, {dur:.2f}s, start={timings[-1]['start']}")

    with open(MP3_PATH, "wb") as out:
        for c in chunks:
            with open(c, "rb") as f:
                out.write(f.read())
    for c in chunks:
        os.remove(c)
    print(f"OK: {MP3_PATH} ({os.path.getsize(MP3_PATH)} bytes), total {cursor:.2f}s")
    with open(f"{OUT}/timings.json", "w", encoding="utf-8") as f:
        json.dump(timings, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    asyncio.run(main())
