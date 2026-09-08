#!/bin/bash
cd "$(dirname "$0")"
python3 - <<'PYEOF'
import urllib.request, urllib.parse, json, os, time, sys
UA = {'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36','Referer':'https://commons.wikimedia.org/'}
def api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)
def dl(url, out):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r, open(out,'wb') as f:
        f.write(r.read())
    return os.path.getsize(out)

targets = [
 ("File:Alois Senefelder inventor of lithography LCCN2003671619.jpg","senefelder.jpg"),
 ("File:Aloys Senefelder (1771-1834) - BBB-1382.jpg","senefelder-2.jpg"),
 ("File:Farnos the Red Nose and his wife Pegasya.JPG","lubok-farnos.jpg"),
 ("File:Ersh Ershovich.jpg","lubok-ersh.jpg"),
 ("File:Foma&Erema.jpg","lubok-foma-erema.jpg"),
 ("File:BearKrylov.jpg","lubok-bear-krylov.jpg"),
 ("File:BearWedding.jpg","lubok-bear-wedding.jpg"),
 ("File:Лубок Медведь с козою прохлаждается.png","lubok-medved-koza.png"),
 ("File:BovaLubok.jpg","lubok-bova.jpg"),
 ("File:Lubok with fools.JPG","lubok-fools.jpg"),
 ("File:Konek Gorbunok 1870.jpg","lubok-konek.jpg"),
 ("File:Баня-лубок.jpg","lubok-banya.jpg"),
 ("File:Funeral of Kostroma.jpg","lubok-kostroma.jpg"),
 ("File:Khor and Kalinych by Elisabeth Bohm 1883.jpg","bohm-khor.jpg"),
]
done=0
for title, out in targets:
    if os.path.exists(out) and os.path.getsize(out) > 5000:
        print("есть", out, flush=True); done+=1; continue
    thumb=None
    for attempt in range(12):
        try:
            d = api({'action':'query','titles':title,'prop':'imageinfo','iiprop':'url','iiurlwidth':'1100','format':'json'})
            for pid, p in d.get('query',{}).get('pages',{}).items():
                ii=(p.get('imageinfo') or [{}])[0]
                thumb = ii.get('thumburl') or ii.get('url')
            if thumb:
                size = dl(thumb, out)
                done+=1
                print("OK", out, size, "байт", flush=True)
                break
        except Exception as e:
            code = getattr(e,'code',None)
            print("  retry", out, "попытка", attempt+1, ":", e, flush=True)
            time.sleep(25 + attempt*8)
    if not thumb:
        print("FAIL", out, flush=True)
    time.sleep(3)
print("ГОТОВО, скачано", done, "из", len(targets), flush=True)
PYEOF
