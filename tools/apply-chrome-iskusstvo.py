#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Врезает единую обвязку (assets/museum-chrome.js) в страницы музея искусства.

«Нить» — морская линия Айвазовского: «Девятый вал» → «Радуга» → «Чёрное море» → кольцом обратно.
Скрипт идемпотентен.
"""
import pathlib

BASE = pathlib.Path(__file__).resolve().parent.parent / 'iskusstvo'
MARK = 'museum-chrome.js'

RU = [
    ('pic-aivazovsky-devyatyi-val.html', '«Девятый вал»',
     'Девятый вал',
     'Самая известная волна русской живописи — и шесть человек, которые её пережили.'),
    ('pic-aivazovsky-raduga.html', '«Радуга»',
     'Радуга',
     'Кораблекрушение, написанное почти без красок: буря цвета мокрого стекла.'),
    ('pic-aivazovsky-chernoe-more.html', '«Чёрное море»',
     'Чёрное море',
     'Море без корабля и без берега — картина, в которой Айвазовский убрал всё лишнее.'),
]



def esc(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")


def insert(path, block):
    html = path.read_text(encoding='utf-8')
    if MARK in html:
        return 'уже есть'
    idx = html.rfind('</body>')
    if idx == -1:
        return 'нет </body>'
    path.write_text(html[:idx] + block + html[idx:], encoding='utf-8')
    return 'ок'


def main():
    random_list = ','.join("'%s'" % r[0] for r in RU)
    for i, (fname, label, title, hook) in enumerate(RU):
        prev_f, prev_l = RU[i - 1][0], RU[i - 1][1]
        next_f, next_l = RU[(i + 1) % len(RU)][0], RU[(i + 1) % len(RU)][1]
        block = (
            "\n<!-- единая обвязка музеев: чипсы разделов, стрелки «пред/след»,\n"
            "     строка «Случайное · Все картины · В город-музей» -->\n"
            "<script>window.MUSEUM_CHROME={\n"
            "  museum:{title:'Русское искусство',href:'index.html'},\n"
            "  share:{title:'%s — Айвазовский · музей «Русское искусство»',text:'%s'},\n"
            "  prev:{href:'%s',title:'%s'},\n"
            "  next:{href:'%s',title:'%s'},\n"
            "  all:{href:'index.html',label:'Все картины'},\n"
            "  city:'../index.html',\n"
            "  random:[%s]\n"
            "};</script>\n"
            "<script src=\"../assets/museum-chrome.js\"></script>\n"
        ) % (esc(title), esc(hook), prev_f, esc(prev_l), next_f, esc(next_l), random_list)
        print('%-40s %s' % (fname, insert(BASE / fname, block)))



if __name__ == '__main__':
    main()
