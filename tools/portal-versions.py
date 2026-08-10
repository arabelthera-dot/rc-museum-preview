#!/usr/bin/env python3
"""Архив главных страниц портала: снимки и витрина «как менялась главная».

    python3 tools/portal-versions.py snapshot 2026-08-05-city "Принятая главная до оживления"
    python3 tools/portal-versions.py build

Снимок замораживается целиком: HTML плюс копии всех css/js, которые он тянет.
Иначе правка общего `assets/city-scene.js` задним числом меняет и «историю».
"""
import json
import re
import shutil
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSIONS = ROOT / "versions"
ASSET_RE = re.compile(r'(?:src|href)="((?:assets|[^":]+)/[^"]+\.(?:js|css))"')
NOINDEX = '<meta name="robots" content="noindex">'


def snapshot(slug: str, title: str, source: str = "index.html") -> None:
    src = ROOT / source
    dst = VERSIONS / slug
    if dst.exists():
        sys.exit(f"Снимок {slug} уже есть — выбери другое имя, история не переписывается.")
    dst.mkdir(parents=True)

    html = src.read_text(encoding="utf-8")
    for rel in sorted(set(ASSET_RE.findall(html))):
        asset = ROOT / rel
        if not asset.exists():
            print(f"  пропущен (нет файла): {rel}")
            continue
        target = dst / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(asset, target)
        print(f"  заморожен: {rel}")

    if NOINDEX not in html:
        html = html.replace("<head>", "<head>\n" + NOINDEX, 1)
    (dst / "index.html").write_text(html, encoding="utf-8")
    (dst / "manifest.json").write_text(json.dumps({
        "slug": slug,
        "title": title,
        "source": source,
        "frozen": date.today().isoformat(),
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Снимок готов: versions/{slug}/")


def build() -> None:
    """Собирает витрину истории из манифестов снимков и файла живых ветвей."""
    items = []
    for manifest in sorted(VERSIONS.glob("*/manifest.json")):
        data = json.loads(manifest.read_text(encoding="utf-8"))
        data["href"] = f"{manifest.parent.name}/"
        data["kind"] = "снимок"
        items.append(data)

    branches = VERSIONS / "branches.json"
    if branches.exists():
        for branch in json.loads(branches.read_text(encoding="utf-8")):
            branch["kind"] = branch.get("kind", "живая ветвь")
            items.append(branch)

    items.sort(key=lambda item: (item.get("frozen", ""), item.get("slug", "")), reverse=True)

    cards = "\n".join(
        f'''      <li class="v-card">
        <div class="v-meta"><span class="v-date">{item.get("frozen", "")}</span>'''
        f'''<span class="v-kind">{item["kind"]}</span></div>
        <h2><a href="{item["href"]}">{item["title"]}</a></h2>
        <p>{item.get("note", "")}</p>
      </li>'''
        for item in items
    )

    (VERSIONS / "index.html").write_text(PAGE.replace("{{CARDS}}", cards), encoding="utf-8")
    print(f"Витрина собрана: versions/index.html ({len(items)} записей)")


PAGE = '''<!doctype html>
<html lang="ru">
<head>
<meta name="robots" content="noindex">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Путь главной страницы — Русская цивилизация</title>
<link rel="stylesheet" href="../assets/fonts.css">
<style>
  :root { --ink: #f4f1ea; --muted: #b9b3a6; --bg: #0c0a1a; --line: rgba(244,241,234,.14); }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink);
         font-family: "PT Serif", Georgia, serif; line-height: 1.6; }
  .wrap { max-width: 860px; margin: 0 auto; padding: 56px 20px 80px; }
  h1 { font-size: clamp(28px, 5vw, 44px); line-height: 1.15; margin: 0 0 12px; }
  .lead { color: var(--muted); font-size: 18px; margin: 0 0 40px; max-width: 62ch; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 18px; }
  .v-card { border: 1px solid var(--line); border-radius: 14px; padding: 20px 22px;
            background: rgba(255,255,255,.03); }
  .v-meta { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
  .v-date { font-family: ui-monospace, monospace; font-size: 13px; color: var(--muted); }
  .v-kind { font-size: 12px; text-transform: uppercase; letter-spacing: .08em;
            color: #e8c98a; border: 1px solid rgba(232,201,138,.35);
            border-radius: 999px; padding: 2px 10px; }
  .v-card h2 { font-size: 22px; margin: 0 0 6px; }
  .v-card a { color: var(--ink); text-decoration-color: rgba(232,201,138,.6);
              text-underline-offset: 4px; }
  .v-card a:hover { color: #e8c98a; }
  .v-card p { margin: 0; color: var(--muted); font-size: 16px; }
  .back { display: inline-block; margin-top: 40px; color: #e8c98a; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Путь главной страницы</h1>
    <p class="lead">Служебная страница для владельца проекта: как менялся вход в город музеев.
      Каждый снимок заморожен вместе со своими стилями и скриптами и открывается таким,
      каким был в тот день. Живые ветви — параллельные варианты главной, из которых
      берутся лучшие решения.</p>
    <ul>
{{CARDS}}
    </ul>
    <a class="back" href="../">← на главную</a>
  </div>
</body>
</html>
'''

if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "snapshot":
        snapshot(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else sys.argv[2])
        build()
    elif len(sys.argv) >= 2 and sys.argv[1] == "build":
        build()
    else:
        sys.exit(__doc__)
