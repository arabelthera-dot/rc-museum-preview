#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Добор к apply-support.py: снимает дубли блоков и конфликты сердечка.
   1. heartBound:true там, где сердечко уже привязано в HTML;
   2. удаляет старые самодельные блоки поддержки (Дежнёв — слишком рано на странице,
      EN-Девятый вал — дублирует финальный), их место занимают блоки движка."""
import glob, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
log = []


def read(p):
    return open(p, encoding='utf-8').read()


def write(p, s):
    open(p, 'w', encoding='utf-8').write(s)


# ── 1. heartBound для страниц со своим обработчиком сердечка ─────────────────
for f in sorted(glob.glob('iskusstvo/pic-*.html') + ['pervoprohodcy/exp-dezhnev-1648.html']):
    s = read(f)
    if 'heartBound' in s or "getElementById('heart')" not in s:
        continue
    s2 = re.sub(r'(window\.MUSEUM_SUPPORT=\{)', r'\1heartBound:true,', s, count=1)
    if s2 != s:
        write(f, s2)
        log.append('heartBound → %s' % f)

# ── 2. старый блок Дежнёва (стоял до раздела «Путь» — не пик) ────────────────
d = 'pervoprohodcy/exp-dezhnev-1648.html'
s = read(d)
old = re.search(r'\n<section style="padding:18px 18px 0"><div class="support" id="support".*?</div></section>\n',
                s, re.S)
if old:
    write(d, s.replace(old.group(0), '\n'))
    log.append('Дежнёв: ранний блок убран, id=support уходит на блок-пик')

# ── 3. старый блок EN (дублировал финальный) ────────────────────────────────
e = 'iskusstvo/pic-aivazovsky-devyatyi-val-en.html'
s = read(e)
old = re.search(r'[ \t]*<div class="support"><p>This museum is built.*?</div>\n', s, re.S)
if old:
    write(e, s.replace(old.group(0), ''))
    log.append('EN: старый блок поддержки убран')

print('\n'.join(log) if log else 'изменений нет')
