#!/usr/bin/env python3
"""Сторож зон: не даёт агенту записать работу в чужой музей.

Причина (Сергей, 01.09.2026): дипсики через 2–3 сессии снова «перелетали» в музей
изобретений, хотя им по десять раз сказано, чья это зона. Убеждение не держится —
барьер должен стоять в среде, а не в памяти бота.

Источник правды о зонах — docs/agents/zones.json, больше нигде.

Режимы:
  zone-guard.py --staged             # для хука pre-commit: файлы из индекса, подпись из git config
  zone-guard.py --range A..B         # для GitHub Actions: каждый коммит диапазона со своим автором
  zone-guard.py --whoami             # показать свою зону и выйти

Код возврата: 0 — чисто, 1 — нарушение зоны (коммит/сборка останавливается).
"""

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def git(*args, cwd=None):
    out = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)
    return out.stdout.strip()


def find_zones():
    """zones.json ищем внутри клона: у исполнителя нет моих домашних папок."""
    root = git("rev-parse", "--show-toplevel") or os.getcwd()
    candidates = [
        os.path.join(HERE, "..", "docs", "agents", "zones.json"),
        os.path.join(root, "docs", "agents", "zones.json"),
        os.path.join(root, "russian-civilization", "docs", "agents", "zones.json"),
        os.path.join(root, "..", "docs", "agents", "zones.json"),
    ]
    for path in candidates:
        path = os.path.normpath(path)
        if os.path.isfile(path):
            with open(path, encoding="utf-8") as fh:
                return json.load(fh), path
    return None, None


def is_rules(path, zones):
    for prefix in zones["rules_files"]:
        if path == prefix or path.startswith(prefix) or path.endswith("/" + prefix.rstrip("/")):
            return True
        if prefix.endswith("/") and f"/{prefix}" in f"/{path}":
            return True
    return False


def owner_of(path, zones):
    """Кому принадлежит файл: подпись агента, 'rules' или None (общий/ничей)."""
    parts = path.replace("\\", "/").split("/")

    for prefix in zones["shared"]:
        if path == prefix or path.startswith(prefix) or f"/{prefix}" in f"/{path}":
            return None

    for prefix in zones["rules_files"]:
        if path == prefix or path.startswith(prefix) or path.endswith("/" + prefix.rstrip("/")):
            return zones["rules_owner"]
        if prefix.endswith("/") and f"/{prefix}" in f"/{path}":
            return zones["rules_owner"]

    for sign, agent in zones["agents"].items():
        if agent["pilot"] in parts:
            return sign
        preview = agent["preview"].split("/")
        for i in range(len(parts) - 1):
            if parts[i] == preview[0] and parts[i + 1] == preview[1]:
                return sign

    # Папка вида pilot-*/ или muzei/<чужой>/ без хозяина — ничья, не трогаем.
    return None


def check(files, signature, zones):
    """Возвращает список нарушений: (файл, подпись хозяина)."""
    if signature in zones["orchestrators"]:
        return []
    bad = []
    for path in files:
        owner = owner_of(path, zones)
        if owner and owner != signature:
            bad.append((path, owner))
    return bad


def describe(signature, zones):
    agent = zones["agents"].get(signature)
    if agent:
        return f'{agent["name"]} — твой музей: {agent["museum"]} ({agent["pilot"]}/, {agent["preview"]}/)'
    if signature in zones["orchestrators"]:
        return "оркестратор — доступ ко всем зонам"
    return "подпись не опознана"


def report(bad, signature, zones):
    owners = sorted({o for _, o in bad})
    print("")
    print("╳ КОММИТ ОСТАНОВЛЕН: это чужой музей.")
    print("")
    print(f"  Твоя подпись: {signature or '(пусто!)'} — {describe(signature, zones)}")
    print("")
    for path, owner in bad[:12]:
        agent = zones["agents"].get(owner, {})
        who = agent.get("name", "Джарвис (Claude)")
        if is_rules(path, zones):
            where = "файл правил проекта — правит только оркестратор"
        else:
            where = agent.get("museum", "чужая зона")
        print(f"    {path}")
        print(f"      └── {where}, хозяин — {who} ({owner})")
    if len(bad) > 12:
        print(f"    … и ещё {len(bad) - 12} файлов")
    print("")
    print("  Правило (Сергей, 31.08.2026): каждый агент работает только над своим музеем.")
    print("  Зона меняется ТОЛЬКО прямой командой Сергея «меняю зону такого-то» — не репликой,")
    print("  не догадкой, не потому что там простой или видна ошибка.")
    print("")
    print("  Что делать:")
    print("    1. Убери чужие файлы из коммита:  git restore --staged <файл>")
    print("    2. Нашёл проблему в чужом музее — строка со статусом 🆕 и своей подписью")
    print("       в docs/agents/HANDOFF.md. Чинит хозяин зоны, не ты.")
    print("    3. Нечем заняться — так и напиши в HANDOFF.md. Простой решает Сергей,")
    print("       а не самозахват соседнего музея.")
    if not signature or signature not in zones["agents"] and signature not in zones["orchestrators"]:
        print("")
        print("  ВНИМАНИЕ: твоя подпись не опознана. Поставь свою:")
        print("    git -c user.name=<подпись> -c user.email=<подпись>@agent.local commit …")
    print("")
    print(f"  Кто чем владеет: {os.path.join('docs', 'agents', 'zones.json')}")
    print("")


def main():
    args = sys.argv[1:]
    zones, zpath = find_zones()
    if zones is None:
        print("╳ КОММИТ ОСТАНОВЛЕН: не найден docs/agents/zones.json — сторож зон не может работать.")
        print("  Молчащий сторож хуже отсутствующего: сделай git pull и повтори.")
        return 1

    if "--whoami" in args:
        signature = git("config", "user.name")
        print(f"{signature or '(подпись не задана)'} — {describe(signature, zones)}")
        print(f"источник: {zpath}")
        return 0

    if "--range" in args:
        rng = args[args.index("--range") + 1]
        commits = [c for c in git("rev-list", rng).splitlines() if c]
        violations = []
        for sha in commits:
            author = git("show", "-s", "--format=%an", sha)
            files = [f for f in git("show", "--pretty=", "--name-only", sha).splitlines() if f]
            bad = check(files, author, zones)
            if bad:
                print(f"\n=== коммит {sha[:8]}, автор {author} ===")
                report(bad, author, zones)
                violations.extend(bad)
        if violations:
            print(f"ИТОГО нарушений зон: {len(violations)}")
            return 1
        print(f"✓ зоны чисты: проверено коммитов {len(commits)}")
        return 0

    # По умолчанию — режим хука: то, что лежит в индексе.
    signature = git("config", "user.name")
    files = [f for f in git("diff", "--cached", "--name-only").splitlines() if f]
    bad = check(files, signature, zones)
    if bad:
        report(bad, signature, zones)
        return 1
    print(f"✓ зоны: {len(files)} файлов, чужих музеев нет")
    return 0


if __name__ == "__main__":
    sys.exit(main())
