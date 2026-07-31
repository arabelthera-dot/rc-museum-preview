#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Приводит страницы трёх музеев к стандарту 31.07:
   1. полное имя музея изобретений вместо «Музей изобретений»;
   2. подключение движка museum-support.js (блок «Поддержать проект» + сердечко);
   3. правка формулировки «дать денег» у Дежнёва.
   Идемпотентен: повторный запуск ничего не меняет."""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

FULL = 'Что изобрели русские первыми в мире'
log = []


def read(p):
    return open(p, encoding='utf-8').read()


def write(p, s):
    open(p, 'w', encoding='utf-8').write(s)


# ── 1. полное имя музея изобретений ──────────────────────────────────────────
for f in sorted(glob.glob('izobreteniya/day-*.html')):
    s = o = read(f)
    s = s.replace('Музей изобретений «Русская цивилизация»', 'музей «%s»' % FULL)
    s = s.replace('Музей изобретений', FULL)
    if s != o:
        write(f, s)
        log.append('имя музея  → %s' % f)

# ── 2. подключение движка поддержки ──────────────────────────────────────────
CFG = {}
for f in glob.glob('izobreteniya/day-*.html'):
    CFG[f] = "museum:'%s'" % FULL
for f in glob.glob('iskusstvo/pic-*.html'):
    CFG[f] = "museum:'Русское искусство'"
CFG['iskusstvo/pic-aivazovsky-devyatyi-val-en.html'] = "museum:'Russian Art',lang:'en'"
CFG['pervoprohodcy/exp-dezhnev-1648.html'] = "museum:'Русские первопроходцы',heartBound:true"
# у Шухова блоки свёрстаны вручную — эталон, движок не нужен
CFG.pop('izobreteniya/day-05jan-shukhov.html', None)

HOOK = re.compile(r'([ \t]*)<script src="(\.\./assets/museum-chrome\.js)"></script>')

for f, cfg in sorted(CFG.items()):
    s = read(f)
    if 'museum-support.js' in s:
        continue
    add = ('\n\\1<script>window.MUSEUM_SUPPORT={%s};</script>'
           '\n\\1<script src="../assets/museum-support.js"></script>') % cfg
    s2, n = HOOK.subn(lambda m: m.group(0) + add.replace('\\1', m.group(1)), s, count=1)
    if not n:                                   # движка обвязки нет — ставим перед </body>
        s2 = s.replace('</body>',
                       '<script>window.MUSEUM_SUPPORT={%s};</script>\n'
                       '<script src="../assets/museum-support.js"></script>\n</body>' % cfg, 1)
        if s2 == s:
            log.append('!! НЕ ВСТАВЛЕНО → %s' % f)
            continue
    write(f, s2)
    log.append('движок     → %s' % f)

# ── 3. Дежнёв: «дать денег» → «поддержать проект рублём», имя блока ──────────
d = 'pervoprohodcy/exp-dezhnev-1648.html'
s = o = read(d)
s = s.replace(
    '<b>дать денег</b> на сканы подлинников и озвучку',
    '<b>поддержать проект рублём</b> — на сканы подлинников и озвучку')
s = s.replace('❤ Поддержать музей.', '❤ Поддержать проект.')
s = s.replace('❤ Поддержать музей<', '❤ Поддержать проект<')
s = s.replace('<div id="heart">❤<span class="lbl">Поддержать</span></div>',
              '<div id="heart" title="Поддержать проект">❤<span class="lbl">Поддержать проект</span></div>')
if s != o:
    write(d, s)
    log.append('Дежнёв     → формулировки приведены к стандарту')

print('\n'.join(log) if log else 'изменений нет')
print('\nвсего правок: %d' % len(log))
