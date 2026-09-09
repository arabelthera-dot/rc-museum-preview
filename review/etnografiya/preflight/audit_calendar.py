"""Reproducible inventory of editorial dependencies; not a historical fact audit."""
import calendar
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = ROOT.parent / 'may-december'
MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
          'august', 'september', 'october', 'november', 'december']


def run():
    rows, hashes, failures = [], {}, []
    for month, name in enumerate(MONTHS, 1):
        path = BASE / ('accepted' if month < 5 else '') / name / f'{name}.json'
        raw = path.read_bytes()
        hashes[str(path.relative_to(ROOT.parent))] = hashlib.sha256(raw).hexdigest()
        data = json.loads(raw)
        days = data['days']
        if sorted(d['day'] for d in days) != list(range(1, calendar.monthrange(2025, month)[1] + 1)):
            failures.append(f'{name}: missing or duplicate dates')
        for day in days:
            links = []
            for key in day['sources']:
                if key not in data['sources']:
                    failures.append(f'{name}/{day["day"]}: missing source {key}')
                    continue
                source = data['sources'][key]
                links.append(source['url'] if isinstance(source, dict) else source[1])
            broad = month >= 5 and any(k in {'R', 'craft'} for k in day['sources'])
            direct = any('/entity/OBJECT/' in u or '/subject/' in u for u in links)
            status = ('Общий обзор; нужен предмет' if broad else
                      'Есть адрес предметной карточки; сверить содержание и медиа' if direct else
                      'Запись/альбом/описание; проверить локальность и пригодность')
            rows.append(dict(date=f'{day["day"]:02}.{month:02}', title=day['title'],
                             hook=day['hook'], mechanic=day['mechanic'],
                             evidence=day['evidence'], source_urls=' ; '.join(links),
                             source_ids=' ; '.join(day['sources']),
                             theme=day.get('theme', ''), date_type=day['date_type'],
                             date_reason=day['date_reason'], preparation=day['preparation'],
                             editorial_dependency=status, broad_122=broad,
                             production_ready=False))
    titles = Counter(r['title'].casefold() for r in rows)
    summary = dict(checked_at='2026-09-09', rows=len(rows),
                   unique_dates=len({r['date'] for r in rows}),
                   exact_title_duplicates=[k for k, v in titles.items() if v > 1],
                   broad_overview_may_december=sum(r['broad_122'] for r in rows),
                   source_dependency_counts=dict(Counter(r['editorial_dependency'] for r in rows)),
                   production_readiness='Не проверена; production_ready=false означает отсутствие приёмки, а не непригодность темы',
                   scope='Структура, заявленные источники и зависимости 365 строк. Содержание всех внешних источников заново не проверялось.',
                   original_month_hashes=hashes, failures=failures)
    (ROOT / 'calendar-audit.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'calendar-worklist.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n')
    with (ROOT / 'calendar-worklist.csv').open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    lines = ['# 122 строки с общей обзорной опорой', '',
             'Это исходный список обязательной предметной доводки, не отчёт о 122 исправлениях. '
             'Конкретные находки и редакционные решения — в editorial-review.md. '
             'Остальные 243 строки также не считаются автоматически готовыми к выпуску.', '',
             '| Дата | Сюжет | Исходный источник |', '|---|---|---|']
    lines += [f'| {r["date"]} | {r["title"]} | {r["source_ids"]} |' for r in rows if r['broad_122']]
    (ROOT / 'overview-backlog.md').write_text('\n'.join(lines) + '\n')
    assert len(rows) == 365 and summary['unique_dates'] == 365, summary
    assert summary['broad_overview_may_december'] == 122, summary
    assert not failures, failures
    print(json.dumps({k: v for k, v in summary.items() if k not in ['original_month_hashes']}, ensure_ascii=False))


if __name__ == '__main__':
    run()
