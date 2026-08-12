#!/usr/bin/env python3
"""Не допускает новых нарушений музейного минимума в staged HTML.

Старые известные долги перечислены в ``tools/audit-baseline.json``. Проверка
сравнивает результат только с этим baseline: существующая страница не получает
новый долг, а новая страница должна быть чистой. Хук намеренно анализирует лишь
файлы, подготовленные к текущему коммиту, чтобы исторические страницы не
блокировали независимую работу.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASELINE_PATH = ROOT / "tools" / "audit-baseline.json"


def staged_html() -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "--", "*.html"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def has_large_hero(html: str) -> bool:
    hero = re.search(
        r'<(?:section|header)[^>]+class="[^"]*\bhero\b[^"]*"[\s\S]{0,9000}?</(?:section|header)>',
        html,
        re.I,
    )
    if not hero:
        return False
    return bool(re.search(r'<(?:img|video|svg|canvas)\b|\b(scene|stage|visual)\b', hero.group(0), re.I))


def text_over_visual(html: str) -> bool:
    """Консервативный статический признак текста, наложенного на изображение.

    Проверка не считает нарушением подпись ``figcaption``. Она реагирует только
    на явно названный overlay внутри figure/visual-блока или inline absolute.
    Полная геометрическая проверка остаётся задачей браузерного стоп-шлюза.
    """
    return bool(
        re.search(r'class="[^"]*\b(?:image|photo|hero)-(?:overlay|text)\b', html, re.I)
        or re.search(r'<(?:p|h[1-6]|div)[^>]+style="[^"]*position\s*:\s*absolute', html, re.I)
    )


def findings(html: str) -> list[str]:
    result: list[str] = []
    audio = re.search(r'<audio\b', html, re.I)
    if not audio:
        result.append("аудиоплеер")

    # Аудиогид должен появляться до финальной навигации/календаря, а не быть
    # пристёгнутым после содержательного завершения страницы.
    finish_positions = [
        pos
        for marker in ('id="quiz"', 'id="calendar"', 'id="kuda-dalshe"', '<footer')
        if (pos := html.find(marker)) >= 0
    ]
    finish = min(finish_positions) if finish_positions else len(html)
    if not audio or audio.start() >= finish:
        result.append("аудиогид не в конце")

    if text_over_visual(html):
        result.append("текст НЕ поверх картинки")
    if not has_large_hero(html):
        result.append("hero — сцена или большой визуал")
    if not re.search(r'id="(?:calendar|calbox)"|museum-calendar-month\.js', html, re.I):
        result.append("календарь месяца")
    return result


# Служебные страницы, которые не являются экспозицией для посетителя: витрины, календари,
# рабочие разборы и СТЕНДЫ ДВИЖКОВ. Стенд показывает механику Сергею и разработчику —
# аудиогид, календарь месяца и hero-сцена ему не положены по определению.
# Список ведётся перечислением имён: признак вроде <meta noindex> стал бы лазейкой,
# через которую от сторожа ушла бы настоящая страница музея.
SERVICE_PAGES = {"index.html", "calendar.html", "competitors.html", "firstlook.html"}


def main() -> int:
    baseline = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    targets = [t for t in staged_html() if Path(t).name not in SERVICE_PAGES]
    if not targets:
        print("Музейный pre-commit: staged HTML нет — проверка не требуется.")
        return 0

    errors: list[str] = []
    for relative in targets:
        target = ROOT / relative
        if not target.is_file():
            continue
        current = findings(target.read_text(encoding="utf-8", errors="ignore"))
        allowed = set(baseline.get(relative, []))
        introduced = [item for item in current if item not in allowed]
        if introduced:
            errors.append(f"{relative}: новые нарушения — {', '.join(introduced)}")
        else:
            print(f"✓ {relative}: новых нарушений нет")

    if errors:
        print("\nМузейный pre-commit заблокировал коммит:", file=sys.stderr)
        for error in errors:
            print(f"  ✗ {error}", file=sys.stderr)
        print(
            "Исправьте страницу; расширять baseline можно только отдельным осознанным решением.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
