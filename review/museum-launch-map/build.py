import json,csv,copy,html
from pathlib import Path
p=Path(__file__).resolve().parent
d=json.loads((p/'map.json').read_text())
assert len({m['id'] for m in d['museums']})==len(d['museums'])
assert all(set(m['matrix'])=={c['id'] for c in d['columns']} for m in d['museums'])
with (p/'museum-map.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f,lineterminator="\n");w.writerow(['№','Музей / тема']+[c['title'] for c in d['columns']])
    for m in d['museums']:w.writerow([m['number'],m['title']]+[m['matrix'][c['id']]['label'] for c in d['columns']])
(p/'audit.json').write_text(json.dumps(d['work_audit'],ensure_ascii=False))
view=copy.deepcopy(d)
view['work_audit'].pop('documents',None)
for a in view['work_audit']['museums'].values():
    for k in ['documents','pages','media','other_files','production']:a.pop(k,None)
(p/'index.html').write_text((p/'template.html').read_text().replace('__CSS__',(p/'base.css').read_text()).replace('__DATA__',json.dumps(view,ensure_ascii=False).replace('<','\\u003c')))
(p/'park-ideas.html').write_text('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=./"><title>Единая таблица музеев</title><p><a href="./">Открыть единую таблицу музеев</a></p></html>')
print('Built one table; old ideas URL redirects to the same table.')
assert d['sequence_columns'].index('calendar') < d['sequence_columns'].index('mechanism_assignment') < d['sequence_columns'].index('mechanism_code')
with (p/'sequence.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f,lineterminator="\n")
    cols=[c for c in d['columns'] if c['id'] in d['sequence_columns']]
    w.writerow(['№','Музей / тема']+[c['title'] for c in cols])
    for m in d['museums']:w.writerow([m['number'],m['title']]+[m['matrix'][c['id']]['label'] for c in cols])
stage_rows=''.join('<tr>'+''.join('<td>'+html.escape(s[k])+'</td>' for k in ['title','action','exit','gate','duration'])+'</tr>' for s in d['stages'])
(p/'sequence.html').write_text((p/'sequence-template.html').read_text().replace('__STAGE_ROWS__',stage_rows))
print('Built 9 ordered stages and the 18-column sequence form; regenerate Excel with export_xlsx.py.')
