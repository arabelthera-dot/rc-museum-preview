#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Врезает единую обвязку (assets/museum-chrome.js) во все страницы дней музея изобретений.

Порядок «нити» — календарный: 1 янв → 14 дек → снова 1 янв (кольцо, чтобы не было тупика).
Скрипт идемпотентен: повторный запуск ничего не дублирует.
"""
import re, pathlib

BASE = pathlib.Path(__file__).resolve().parent.parent / 'izobreteniya'

# файл → короткая подпись для стрелок «пред/след», в календарном порядке
DAYS = [
    ('day-01jan-cabletv.html',      '1 января · Кабельное ТВ'),
    ('day-02jan-luna1.html',        '2 января · «Луна-1»'),
    ('day-03jan-luna9.html',        '3 января · «Луна-9»'),
    ('day-04jan-pilchikov.html',    '4 января · Пильчиков'),
    ('day-05jan-shukhov.html',      '5 января · Шухов'),
    ('day-06jan-bering.html',       '6 января · Беринг'),
    ('day-07jan-buran.html',        '7 января · «Буран»'),
    ('day-08jan-icebreaker.html',   '8 января · «Ермак»'),
    ('day-09jan-blinov.html',       '9 января · Блинов'),
    ('day-30jan-kotelnikov.html',   '30 января · Котельников'),
    ('day-18mar-leonov.html',       '18 марта · Леонов'),
    ('day-15may-mechnikov.html',    '15 мая · Мечников'),
    ('day-16jun-tereshkova.html',   '16 июня · Терешкова'),
    ('day-26sep-pavlov.html',       '26 сентября · Павлов'),
    ('day-10nov-kalashnikov.html',  '10 ноября · Калашников'),
    ('day-25nov-pirogov.html',      '25 ноября · Пирогов'),
    ('day-01dec-lobachevsky.html',  '1 декабря · Лобачевский'),
    ('day-14dec-laser.html',        '14 декабря · Лазер'),
]

MARK = 'museum-chrome.js'


def esc(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")


def h1_of(html):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
    if not m:
        return ''
    t = re.sub(r'<[^>]+>', ' ', m.group(1))
    return re.sub(r'\s+', ' ', t).strip()


def main():
    names = [d[0] for d in DAYS]
    random_list = ','.join("'%s'" % n for n in names)
    done, skipped = [], []

    for i, (fname, label) in enumerate(DAYS):
        path = BASE / fname
        if not path.exists():
            skipped.append(fname + ' (нет файла)')
            continue
        html = path.read_text(encoding='utf-8')
        if MARK in html:
            skipped.append(fname + ' (уже есть)')
            continue

        prev_f, prev_l = DAYS[i - 1]                       # кольцо
        next_f, next_l = DAYS[(i + 1) % len(DAYS)]
        title = h1_of(html) or label

        block = (
            "\n<!-- единая обвязка музеев: backbtn, «Поделиться», чипсы разделов,\n"
            "     стрелки «пред/след», строка «Случайное · Все · В город-музей» -->\n"
            "<script>window.MUSEUM_CHROME={\n"
            "  museum:{title:'Музей изобретений',href:'index.html'},\n"
            "  share:{title:'%s — Музей изобретений «Русская цивилизация»',\n"
            "         text:'%s. Что Россия дала миру раньше всех — день за днём.'},\n"
            "  prev:{href:'%s',title:'%s'},\n"
            "  next:{href:'%s',title:'%s'},\n"
            "  all:{href:'index.html',label:'Все изобретения'},\n"
            "  city:'../index.html',\n"
            "  random:[%s]\n"
            "};</script>\n"
            "<script src=\"../assets/museum-chrome.js\"></script>\n"
        ) % (esc(title), esc(title), prev_f, esc(prev_l), next_f, esc(next_l), random_list)

        idx = html.rfind('</body>')
        if idx == -1:
            skipped.append(fname + ' (нет </body>)')
            continue
        path.write_text(html[:idx] + block + html[idx:], encoding='utf-8')
        done.append(fname)

    print('врезано: %d' % len(done))
    for f in done:
        print('  +', f)
    if skipped:
        print('пропущено: %d' % len(skipped))
        for f in skipped:
            print('  ·', f)


if __name__ == '__main__':
    main()
