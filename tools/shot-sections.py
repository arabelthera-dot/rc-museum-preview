#!/usr/bin/env python3
"""Секционные скриншоты страницы (viewport-экраны сверху вниз) для приёмки.
Запуск: LD_LIBRARY_PATH=... python3 shot-sections.py URL ПРЕФИКС [ширина] [высота]
Сохраняет ПРЕФИКС-01.png, -02.png, ... с прокруткой по viewport."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

url = sys.argv[1]
prefix = sys.argv[2]
width = int(sys.argv[3]) if len(sys.argv) > 3 else 1280
height = int(sys.argv[4]) if len(sys.argv) > 4 else 900

Path(prefix).parent.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": width, "height": height})
    pg.goto(url, wait_until="networkidle", timeout=60000)
    pg.wait_for_timeout(1500)
    total = pg.evaluate("() => document.body.scrollHeight")
    n = 0
    y = 0
    while y < total:
        n += 1
        pg.evaluate(f"() => window.scrollTo(0, {y})")
        pg.wait_for_timeout(450)
        out = f"{prefix}-{n:02d}.png"
        pg.screenshot(path=out)
        print("OK", out, "y=", y)
        y += height - 80  # перекрытие 80px
        if n > 40:
            break
    b.close()
print("total height", total, "sections", n)
