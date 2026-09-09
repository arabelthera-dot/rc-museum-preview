from pathlib import Path
import json,html,csv,zipfile,re,ast
from xml.sax.saxutils import escape
ROOT=Path(__file__).parent
src=json.loads((ROOT/'sources.json').read_text());src['nikola-zimnij']=src['sukkot8']
S={k:[v['label'],v['url']] for k,v in src.items()}
HEADERS=['Дата','Экспонат / название дня','Хук','Механика','Атрибуция и подтверждение']
months={};cur=None
names=['may','june','july','august','september','october','november','december']
for line in (ROOT/'days.tsv').read_text().splitlines():
 if line.startswith('@'):
  m,ru,theme=line[1:].split('|');cur={'month':int(m),'name':names[int(m)-5],'ru':ru,'theme':theme,'days':[]};months[m]=cur;continue
 title,hook,mech,key,theme=line.split('|');parts=key.split('/');key=parts[0];kind='К' if len(parts)>1 and parts[1]=='К' else 'У';floating=len(parts)>1 and parts[1]=='П';day=len(cur['days'])+1
 scope=src[key]['scope']
 if key=='R':scope='Тема-кандидат в рамках экспозиции РЭМ о русских. Конкретный предмет, местность, дата и подтверждение частного сюжета ещё подбираются; обзор не заменяет предметную атрибуцию.'
 if key=='craft':scope='Кандидат по названному промыслу. Обзор Культура.РФ — исходный ориентир; конкретная вещь, автор, дата и частные технологические сведения требуют предметной проверки.'
 reason='Ежегодная дата по современному гражданскому календарю.' if kind=='К' else ('Подвижный праздник; номер строки не является его датой. Привязка уточняется для года показа.' if floating else 'Редакционное размещение; не историческая дата возникновения.')
 need='Подобрать указанные в механике предметы или записи, проверить локальную атрибуцию и права, подготовить подписанные иллюстрации. Механика — авторский замысел, ещё не реализована.'
 cur['days'].append([day,title,kind,reason,hook,mech,scope,[key],need,theme])
LEGEND='[К] — ежегодная календарная дата; [У] — редакционное размещение. Подвижные праздники обозначены отдельно. Календарь не привязан к 2026 году. Названия и механики — авторские предложения.'
LIMITS='Состав для просмотра, не готовые страницы музея. Источники различаются по уровню: предметная карточка, локальная традиция, обзор. Строки «тема-кандидат» требуют подбора предмета и проверки частных деталей. Музей посвящён этнографии русского народа. Январь–апрель приняты; май–декабрь ожидают приёмки. Проверка источников: 09.09.2026.'
renderer=(ROOT/'renderer.py').read_text()
for m,v in months.items():
 out=ROOT/v['name'];out.mkdir(exist_ok=True);n=len(v['days']);INTRO=f"{v['ru']} · {n} дней · {v['theme']}. Пять граф принятого формата апреля. Состав на просмотр."
 code=renderer.replace('april',v['name']).replace('Апрель',v['ru']).replace('апреля',v['ru'].lower()).replace('апрель',v['ru'].lower()).replace('.04','.'+m).replace('30 дней',str(n)+' дней').replace('30 из 30',f'{n} из {n}').replace('из 30',f'из {n}').replace('помесячная работа','май–декабрь одним пакетом')
 code=code.replace("'days':30","'days':"+str(n)).replace('range(1,31)',f'range(1,{n+1})').replace('==30',f'=={n}').replace('== 30',f'== {n}')
 env=dict(ROOT=out,ROWS=v['days'],S={k:S[k] for k in set(r[7][0] for r in v['days'])},HEADERS=HEADERS,INTRO=INTRO,LEGEND=LEGEND,LIMITS=LIMITS,json=json,html=html,csv=csv,zipfile=zipfile,escape=escape)
 exec(compile(code,'render','exec'),env)
 (out/'how-it-looks.md').write_text('# '+v['ru']+' — примеры посещения\n\n'+'\n\n'.join('**'+r[1]+'**\n\n'+r[4]+' '+r[5]+'\n\nАтрибуция: '+r[6] for r in v['days'][:3]))
 v['rows']=[env['row_cells'](r) for r in v['days']]
# Общая книга: по листу на месяц; используем проверенный стиль помесячной книги.
base=zipfile.ZipFile(ROOT/'may/may.xlsx');sheet_xml=env['sheet_xml'];ns='http://schemas.openxmlformats.org/package/2006/relationships'
with zipfile.ZipFile(ROOT/'may-december.xlsx','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['_rels/.rels','xl/styles.xml']:z.writestr(name,base.read(name))
 z.writestr('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+''.join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(1,9))+'</Types>')
 z.writestr('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+''.join(f'<sheet name="{v["ru"]}" sheetId="{i}" r:id="rId{i}"/>' for i,v in enumerate(months.values(),1))+'</sheets></workbook>')
 z.writestr('xl/_rels/workbook.xml.rels',f'<Relationships xmlns="{ns}">'+''.join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>' for i in range(1,9))+'<Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
 for i,v in enumerate(months.values(),1):z.writestr(f'xl/worksheets/sheet{i}.xml',sheet_xml([HEADERS]+v['rows'],[9,40,45,64,82]))
base.close()
md='# Музей русской этнографии — май–декабрь\n\n245 дней. Январь–апрель приняты. Все восемь следующих месяцев подготовлены одним пакетом.\n\n[Скачать общий Excel](may-december.xlsx) · [Общий PDF](may-december.pdf)\n\n'+LIMITS+'\n\n| Месяц | Дней | Таблица | Excel | PDF |\n|---|---:|---|---|---|\n'
for v in months.values():
 k=v['name'];md+=f'| {v["ru"]} | {len(v["days"])} | [Открыть]({k}/{k}.md) | [Скачать]({k}/{k}.xlsx) | [Открыть]({k}/{k}.pdf) |\n'
md+='\nПраздничные даты приведены по современному гражданскому календарю. Майские Вознесение, Семик и Троица, июньский Духов день размещены условно. Фактические даты определяются годом показа. Механики — проектные предложения, не описание работающих интерактивов.\n'
(ROOT/'README.md').write_text(md)
css=env['css'];sections=''
for v in months.values():
 t=(ROOT/v['name']/'index.html').read_text();a=t.index('<table>');b=t.index('</table>',a)+8;sections+=f'<section><h2>{v["ru"]} — {v["theme"]}</h2>'+t[a:b]+'</section>'
(ROOT/'print.html').write_text('<!doctype html><html lang="ru"><meta charset="utf-8"><link rel="icon" href="data:,"><title>Май–декабрь — Русская этнография</title><style>'+css+'section{break-before:page}section:first-of-type{break-before:auto}</style><main><h1>Май–декабрь · 245 дней</h1><p>'+html.escape(LIMITS)+'</p>'+sections+'</main></html>')
(ROOT/'calendar.json').write_text(json.dumps({'status':'Состав на просмотр; предметная подготовка отмечена построчно','months':months,'sources':{k:src[k] for k in set(r[7][0] for v in months.values() for r in v['days'])}},ensure_ascii=False,indent=2))
print('BUILT',sum(len(v['days']) for v in months.values()),'days')
