from pathlib import Path
import json,zipfile,re,shutil,xml.etree.ElementTree as ET
ROOT=Path(__file__).parent
names=['january','february','march','april','may','june','july','august','september','october','november','december'];ru=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
for i,m in enumerate(names[:4]):
 p=Path(f'/home/agent/dna/reports/ethnography-{m}-2026-09-{"08" if i<2 else "09"}');out=ROOT/'accepted'/m;out.mkdir(parents=True,exist_ok=True)
 for e in ['md','xlsx','pdf','json']:
  if (p/(m+'.'+e)).exists():shutil.copy2(p/(m+'.'+e),out/(m+'.'+e))
  else:assert (out/(m+'.'+e)).exists()
base=zipfile.ZipFile(ROOT/'may-december.xlsx');ns='http://schemas.openxmlformats.org/package/2006/relationships'
with zipfile.ZipFile(ROOT/'calendar-year.xlsx','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['_rels/.rels','xl/styles.xml']:z.writestr(name,base.read(name))
 ct=base.read('[Content_Types].xml').decode().replace('</Types>',''.join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(9,13))+'</Types>');z.writestr('[Content_Types].xml',ct)
 z.writestr('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+''.join(f'<sheet name="{name}" sheetId="{i}" r:id="rId{i}"/>' for i,name in enumerate(ru,1))+'</sheets></workbook>')
 z.writestr('xl/_rels/workbook.xml.rels',f'<Relationships xmlns="{ns}">'+''.join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>' for i in range(1,13))+'<Relationship Id="rId13" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
 for i,m in enumerate(names,1):
  p=ROOT/'accepted'/m/(m+'.xlsx') if i<=4 else ROOT/m/(m+'.xlsx')
  with zipfile.ZipFile(p) as orig:z.writestr(f'xl/worksheets/sheet{i}.xml',orig.read('xl/worksheets/sheet1.xml'))
base.close()
with zipfile.ZipFile(ROOT/'calendar-year.xlsx') as z:
 ns2={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'};n=0
 for name in z.namelist():
  if name.endswith('.xml') or name.endswith('.rels'):ET.fromstring(z.read(name))
 for i in range(1,13):n+=len(ET.fromstring(z.read(f'xl/worksheets/sheet{i}.xml')).findall('s:sheetData/s:row',ns2))-1
 assert n==365
p=ROOT/'README.md';s=p.read_text();s=s.replace('245 дней. Январь–апрель приняты.','365 дней в годовой книге; 245 новых дней с мая по декабрь. Январь–апрель приняты.')
s=s.replace('[Скачать общий Excel](may-december.xlsx) · [Общий PDF](may-december.pdf)','**Весь год:** [Excel — 12 месяцев](calendar-year.xlsx) · [PDF](calendar-year.pdf)\n\n**Новые месяцы:** [Excel — май–декабрь](may-december.xlsx) · [PDF — 24 страницы](may-december.pdf)')
s+='\nЯнварь–апрель включены в годовую книгу копированием принятых таблиц без редакционных изменений.\n\n| Принятый месяц | Таблица |\n|---|---|\n'+''.join(f'| {ru[i]} | [Открыть](accepted/{m}/{m}.md) |\n' for i,m in enumerate(names[:4]))
p.write_text(s);print('Year workbook: 12 sheets, 365 rows; accepted files unchanged')
