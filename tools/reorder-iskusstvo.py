#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Приводит порядок блоков страниц музея искусства к канону museum-core.

Канон (уточнение Сергея 30.07): интерактив идёт ПОСЛЕ знания —
ролик → зум → на что смотреть → статья → интервью → мировой контекст →
игра → викторина → шарада → календарь → куда дальше.

Было: зум → ИГРА → ролик → … → викторина → шарада → интервью → куда дальше → календарь.

Двигает только секции верхнего уровня целиком. Если между секциями найдётся значимый
контент (не пробелы и не комментарии) — файл не трогается, печатается предупреждение.
"""
import re, pathlib, sys

BASE = pathlib.Path(__file__).resolve().parent.parent / 'iskusstvo'

ORDER = ['rolik-kartiny', 'glubokiy-zum', 'zum-po-polotnu', 'kartina-i-hudozhnik',
         'istoriya', 'chat', 'razbor', 'kontekst', 'game', 'quiz', 'sharada',
         'calendar', 'kuda-dalshe']

FILES = ['pic-aivazovsky-devyatyi-val.html', 'pic-aivazovsky-raduga.html',
         'pic-aivazovsky-chernoe-more.html']

OPEN = re.compile(r'<section\b', re.I)
CLOSE = re.compile(r'</section\s*>', re.I)


def find_sections(html):
    """[(id, start, end)] для секций верхнего уровня с id."""
    out = []
    for m in re.finditer(r'^[ \t]*<section[^>]*\bid="([a-zA-Z0-9_-]+)"', html, re.M):
        sid, start = m.group(1), m.start()
        depth, pos = 0, start
        while True:
            o = OPEN.search(html, pos)
            c = CLOSE.search(html, pos)
            if not c:
                return None
            if o and o.start() < c.start():
                depth += 1
                pos = o.end()
            else:
                depth -= 1
                pos = c.end()
                if depth == 0:
                    out.append((sid, start, pos))
                    break
    return out


def main():
    changed = 0
    for name in FILES:
        path = BASE / name
        html = path.read_text(encoding='utf-8')
        secs = find_sections(html)
        if not secs:
            print('✗ %s — не разобрал секции' % name); continue

        ids = [s[0] for s in secs]
        target = [i for i in ORDER if i in ids]
        if len(target) != len(ids):
            print('✗ %s — в каноне нет секций: %s' % (name, set(ids) - set(target))); continue
        if ids == target:
            print('· %s — порядок уже канонический' % name); continue

        # блок = секция вместе с хвостом до следующей секции с якорем:
        # так панель #zoomwrap уезжает вместе со своим зумом
        bounds = [s[1] for s in secs] + [secs[-1][2]]
        blocks = {}
        for n, s in enumerate(secs):
            end = bounds[n + 1] if n + 1 < len(secs) else secs[-1][2]
            blocks[s[0]] = html[s[1]:end].rstrip()
        head, tail = html[:secs[0][1]], html[secs[-1][2]:]
        body = '\n\n'.join(blocks[i] for i in target)
        path.write_text(head + body + tail, encoding='utf-8')
        changed += 1
        print('✓ %s\n    было:  %s\n    стало: %s' % (name, ' → '.join(ids), ' → '.join(target)))

    print('\nпереставлено файлов: %d' % changed)
    return 0


if __name__ == '__main__':
    sys.exit(main())
