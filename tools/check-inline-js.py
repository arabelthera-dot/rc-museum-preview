#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверяет синтаксис всех inline-скриптов на страницах музеев.

Зачем: один неэкранированный апостроф в базе интервью (kb) убивает ВЕСЬ скрипт страницы —
молча, без видимых следов в вёрстке. Так на EN-версии «Девятого вала» месяц не работали
викторина, интервью и счётчик баллов. Запускать после каждой правки текстов в JS.
"""
import re, subprocess, tempfile, os, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIRS = ['izobreteniya', 'iskusstvo', 'pervoprohodcy']
RX = re.compile(r'<script(?![^>]*\ssrc=)[^>]*>(.*?)</script>', re.S)

bad = 0
files = []
for d in DIRS:
    files += sorted((ROOT / d).glob('*.html'))

for path in files:
    html = path.read_text(encoding='utf-8')
    for n, m in enumerate(RX.finditer(html), 1):
        line0 = html[:m.start()].count('\n') + 1
        tmp = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8')
        tmp.write(m.group(1)); tmp.close()
        r = subprocess.run(['node', '--check', tmp.name], capture_output=True, text=True)
        os.unlink(tmp.name)
        if r.returncode:
            bad += 1
            err = next((l for l in r.stderr.split('\n') if 'Error' in l), '?')
            print('✗ %s — скрипт #%d (со строки %d): %s'
                  % (path.relative_to(ROOT), n, line0, err.strip()[:110]))

print('\nпроверено файлов: %d — %s' % (len(files), 'битых скриптов нет' if not bad else 'битых скриптов: %d' % bad))
sys.exit(1 if bad else 0)
