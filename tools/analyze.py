#!/usr/bin/env python3
"""Карта страницы музея из DOM для приёмки (bot4).
Запуск: LD_LIBRARY_PATH=... python3 analyze.py URL
Печатает: title, h1/h2/h3, ключевые блоки, обложку, аудиогид, навигацию, ошибки консоли."""
import sys
from playwright.sync_api import sync_playwright

url = sys.argv[1]
console_errors = []

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    pg.goto(url, wait_until="networkidle", timeout=60000)
    pg.wait_for_timeout(1200)

    info = pg.evaluate("""() => {
        const out = {};
        out.title = document.title;
        out.h1 = [...document.querySelectorAll('h1')].map(e => e.textContent.trim());
        out.h2 = [...document.querySelectorAll('h2')].map(e => e.textContent.trim());
        out.h3 = [...document.querySelectorAll('h3')].map(e => e.textContent.trim()).slice(0, 40);
        out.bodyH = document.body.scrollHeight;
        out.viewportW = document.documentElement.clientWidth;
        out.scrollW = document.documentElement.scrollWidth;
        out.hscroll = out.scrollW > out.viewportW + 2;
        out.imgs = document.images.length;
        out.brokenImgs = [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src);
        out.audio = [...document.querySelectorAll('audio, [data-audio], .audio-guide, button[data-src]')].length;
        out.links = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
        out.iframes = [...document.querySelectorAll('iframe')].map(f => f.src);
        out.hero = !!document.querySelector('.hero, [class*="hero"], [class*="cover"], [class*="oblozh"]');
        out.sections = [...document.querySelectorAll('section, [class*="section"], [class*="block"]')].slice(0,60).map(e => (e.className && typeof e.className === 'string' ? e.className : e.tagName));
        return out;
    }""")

    print("TITLE:", info["title"])
    print("H1:", info["h1"])
    print("H2:", info["h2"])
    print("H3 (первые 40):", info["h3"])
    print("высота:", info["bodyH"], "| ширина:", info["viewportW"], "| scrollW:", info["scrollW"], "| горизонт.скролл:", info["hscroll"])
    print("картинок:", info["imgs"], "| битых:", info["brokenImgs"])
    print("аудио-элементов:", info["audio"])
    print("iframe:", info["iframes"])
    print("hero/обложка:", info["hero"])
    print("ссылки:", info["links"])
    print("секции:", info["sections"])
    print("console errors:", console_errors if console_errors else "нет")
    b.close()
