import json,csv,copy
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
