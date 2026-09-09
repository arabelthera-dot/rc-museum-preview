from pathlib import Path
import json,calendar,zipfile,xml.etree.ElementTree as ET,urllib.request,tempfile,sys,re
ROOT=Path(__file__).parent
data=json.loads((ROOT/'calendar.json').read_text());months=data['months'];allrows=[r for m in months.values() for r in m['days']]
assert len(allrows)==245 and len({r[1] for r in allrows})==245
assert all(len(m['days'])==calendar.monthrange(2027,m['month'])[1] for m in months.values())
old=[]
for m,dt in [('january','08'),('february','08'),('march','09'),('april','09')]:
 old+=json.load(open(ROOT/'accepted'/m/(m+'.json')))['days']
assert not set(r['title'] for r in old)&set(r[1] for r in allrows)
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(ROOT/'may-december.xlsx') as z:
 assert z.testzip() is None
 for name in z.namelist():
  if name.endswith('.xml') or name.endswith('.rels'):ET.fromstring(z.read(name))
 for i,m in enumerate(months.values(),1):
  sh=ET.fromstring(z.read(f'xl/worksheets/sheet{i}.xml'));rows=sh.findall('s:sheetData/s:row',ns);assert len(rows)==len(m['days'])+1
  assert all(len(r.findall('s:c',ns))==5 for r in rows)
meta=json.load(urllib.request.urlopen('https://pypi.org/pypi/pypdf/json',timeout=15));url=next(x['url'] for x in meta['urls'] if x['filename'].endswith('.whl'))
with tempfile.TemporaryDirectory(prefix='ethno-pdf-') as temp:
 p=Path(temp);(p/'lib.whl').write_bytes(urllib.request.urlopen(url,timeout=15).read());zipfile.ZipFile(p/'lib.whl').extractall(p/'lib');sys.path.insert(0,str(p/'lib'))
 from pypdf import PdfReader, PdfWriter
 pdfs={}
 for m,v in months.items():
  pdf=PdfReader(ROOT/v['name']/(v['name']+'.pdf'));txt='\n'.join(p.extract_text() for p in pdf.pages)
  assert all(f'{i:02}.{m}' in txt for i in range(1,len(v['days'])+1)),m
  pdfs[v['name']]={'pages':len(pdf.pages),'all_dates':True,'characters':len(txt)}
 pdf=PdfReader(ROOT/'may-december.pdf');txt='\n'.join(p.extract_text() for p in pdf.pages)
 assert all(f'{i:02}.{m}' in txt for m,v in months.items() for i in range(1,len(v['days'])+1))
 pdfs['combined']={'pages':len(pdf.pages),'all_245_dates':True,'characters':len(txt)}
 writer=PdfWriter()
 for m in ['january','february','march','april']:writer.append(ROOT/'accepted'/m/(m+'.pdf'))
 writer.append(ROOT/'may-december.pdf');writer.write(ROOT/'calendar-year.pdf');writer.close()
 year=PdfReader(ROOT/'calendar-year.pdf');yt='\n'.join(p.extract_text() for p in year.pages)
 assert all(f'{d:02}.{m:02}' in yt for m in range(1,13) for d in range(1,calendar.monthrange(2027,m)[1]+1))
 pdfs['year']={'pages':len(year.pages),'all_365_dates':True}
browser=json.loads((ROOT/'browser-result.txt').read_text().split('### Result\n')[1].split('\n###')[0])
report={'days':245,'months':8,'five_columns':True,'all_calendar_dates_present':True,'unique_titles':245,'exact_title_duplicates_january_april':0,'previous_days':len(old),'year_total':len(old)+245,'xlsx_sheets':8,'xlsx_xml_and_rows':'passed','pdf':pdfs,'browser':browser,'limits':'Проверена полнота редакционного состава и файлов. Отсутствие точных повторов заголовков не означает отсутствия развития общих тем. Частные сюжетные факты в строках-кандидатах не прошли предметную проверку. Механики предложены, не реализованы.'}
(ROOT/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k not in ['browser','limits']},ensure_ascii=False))
