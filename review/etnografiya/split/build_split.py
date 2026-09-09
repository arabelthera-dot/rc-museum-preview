"""Build a reviewable editorial split; original calendar dates remain source IDs."""
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'preflight/calendar-worklist.json'
LIFE = {
    1: [1, 2, 6, 7, 8, 9, 13, 14, 15, 17, 18, 19, 25, 29],
    2: [14, 15, 18, 19, 20, 21, 24, 26],
    3: [8, 14, 17, 22, 30],
    4: [5, 7, 8, 9, 10, 12, 16, 26, 27],
    5: [1, 6, 8, 9, 21, 22, 24, 27, 28, 31],
    6: [2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 21, 26, 27, 30],
    7: [4, 6, 7, 8, 9, 10, 11, 12, 15, 16],
    8: [2, 6, 7, 9, 13, 14, 16, 17, 19, 20, 21, 24, 26, 28, 29, 30, 31],
    9: [3, 9, 13, 14, 15, 16, 17, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29],
    10: list(range(1, 32)),
    11: [8, 10, 14, 30],
    12: [4, 9, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23, 25, 28, 29, 31],
}
NAMES = {'things': 'Музей русских вещей и мастерства',
         'life': 'Музей русских обычаев и уклада'}
BOUNDARIES = {
    '01.01': 'История семейного праздника; изготовление игрушки может дать отдельную историю первого музея.',
    '02.01': 'Устройство семейного хозяйства; архитектура дома остаётся контекстом.',
    '20.01': 'Главное действие исходника — наблюдение резьбы; отдельная история прядильщицы потребует другого рассказа.',
    '21.02': 'Представление и контакт с публикой; устройство куклы было бы другой историей.',
    '08.04': 'Личное обращение и дарение; техника изготовления яйца вторична.',
    '28.04': 'Исходник связывает рисунок биты с мастерством заводского города; правила игры — возможная связь со вторым музеем.',
    '30.04': 'Современный мастер и миниатюрная вещь; не переносить автоматически только из-за слова «игра».',
    '24.05': 'Семейное обучение чтению; конкретная азбука ещё нужна.',
    '15.07': 'Пока служебная история о собирателе: перед включением раскрыть встречу с носителями культуры.',
    '16.07': 'История полевой записи, пограничный методический сюжет; не считать её заменой истории самих людей.',
    '23.08': 'Устройство сбитенника; уличная торговля напитком даст другой сюжет второго музея.',
    '22.09': 'В исходнике обещан подарок; без документированной истории дарения вернуть к исследованию вещи.',
    '23.09': 'Подготовка приданого и вклад труда в новую семью; столярная конструкция сундука — первый музей.',
    '17.10': 'Смена семейного статуса через головной убор; его крой и техника — другая история.',
    '26.12': 'Исходник о сборке бумажной цепочки; семейный вечер потребует нового сценария второго музея.',
    '31.12': 'Навигационный итог года, не самостоятельный исторический экспонат; перед новым календарём заменить или вынести за его состав.',
}


def main():
    original = SOURCE.read_bytes()
    rows = json.loads(original)
    assert len(rows) == 365
    out = []
    for r in rows:
        day, month = map(int, r['date'].split('.'))
        target = 'life' if day in LIFE[month] else 'things'
        out.append({**r, 'source_date': r['date'], 'museum_id': target,
                    'proposed_museum_name': NAMES[target],
                    'assignment_status': 'Редакторское предложение; новая дата выпуска не назначена',
                    'boundary_note': BOUNDARIES.get(r['date'], ''),
                    'new_calendar_date': None})
    assert len({r['source_date'] for r in out}) == 365
    counts = Counter(r['museum_id'] for r in out)
    (HERE / 'split.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
    for target, name in NAMES.items():
        subset = [r for r in out if r['museum_id'] == target]
        fields = ['source_date', 'title', 'hook', 'mechanic', 'evidence', 'source_urls',
                  'boundary_note', 'editorial_dependency', 'assignment_status']
        with (HERE / f'{target}.csv').open('w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fields, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(subset)
        lines = [f'# {name}', '', f'Первичная раскладка: {len(subset)} исходных тем. '
                 'Даты служат адресами в прежнем календаре; это ещё не новый календарь музея. '
                 'Предметная готовность не повышается от переноса.', '',
                 f'[Полная таблица с хуками, действиями и источниками]({target}.csv)', '',
                 '| Прежняя дата | Тема | Пограничное решение |', '|---|---|---|']
        lines += [f'| {r["source_date"]} | {r["title"]} | {r["boundary_note"]} |' for r in subset]
        (HERE / f'{target}.md').write_text('\n'.join(lines) + '\n')
    report = {'source_sha256': hashlib.sha256(original).hexdigest(), 'source_rows': len(rows),
              'assigned_rows': len(out), 'unique_assignments': len({r['source_date'] for r in out}),
              'counts': dict(counts), 'source_dates_are_not_new_release_dates': True,
              'new_calendars_complete': False, 'names_approved': False,
              'all_sources_rechecked': False,
              'scope': 'Редакторское разделение исходных историй по главному вопросу; не создание 730 страниц.'}
    (HERE / 'checks.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
