#!/usr/bin/env python3
"""Скриншот страницы музея для визуальной приёмки (bot4).
Запуск: LD_LIBRARY_PATH=~/opt/libs python3 shot.py URL ВЫХОД.png [ширина] [высота]
Без высоты = full_page."""
import sys
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

url = sys.argv[1]
out = sys.argv[2]
width = int(sys.argv[3]) if len(sys.argv) > 3 else 1280
height = sys.argv[4] if len(sys.argv) > 4 else None  # None => full_page

Path(out).parent.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": width, "height": 900})
    pg.goto(url, wait_until="networkidle", timeout=60000)
    pg.wait_for_timeout(1800)
    if height:
        pg.set_viewport_size({"width": width, "height": int(height)})
        pg.wait_for_timeout(300)
        pg.screenshot(path=out)
    else:
        pg.screenshot(path=out, full_page=True)
    b.close()
print("OK", out)
