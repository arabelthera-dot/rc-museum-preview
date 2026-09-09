import json,urllib.request,concurrent.futures,re
from pathlib import Path
p=Path(__file__).parent;d=json.loads((p/'february.json').read_text());(p/'source-evidence').mkdir(exist_ok=True)
def check(item):
 key,(label,url)=item
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=18) as r:
   raw=r.read().decode('utf-8','replace');status=r.status
  text=re.sub('<[^>]+>',' ',re.sub(r'<(script|style)\b[^>]*>.*?</\1>','',raw,flags=re.S|re.I));text=re.sub(r'\s+',' ',text)
  (p/'source-evidence'/f'{key}.txt').write_text(text)
  return {'key':key,'url':url,'http':status,'characters':len(text),'method':'HTTP; содержание проверено отдельно по поиску/открытию источника'}
 except Exception as e:return {'key':key,'url':url,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as e:rows=list(e.map(check,d['sources'].items()))
(p/'source-check.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print(json.dumps({'total':len(rows),'ok':sum(x.get('http')==200 for x in rows),'issues':[x for x in rows if x.get('http')!=200]},ensure_ascii=False))
