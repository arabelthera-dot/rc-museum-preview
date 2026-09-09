from pathlib import Path
import re,json
p=Path(__file__).parent
base="https://raw.githubusercontent.com/arabelthera-dot/rc-museum-preview/codex/chest-contract-0909/review/etnografiya/chest/"
s=(p/'full-source.html').read_text()
for n in ['chest','lock','drawers']:
 s=s.replace('{{'+n+'}}',base+'media/'+n+'.webp')
for n,w in [('chest',697),('lock',517),('drawers',835)]:
 s=re.sub(r'(<img[^>]*src="'+re.escape(base+'media/'+n+'.webp')+r'")',lambda m:m[1]+' srcset="'+base+'media/'+n+'-400.webp 400w, '+base+'media/'+n+'.webp '+str(w)+'w" sizes="(max-width:700px) 90vw, 835px"',s)
s=re.sub(r'<link rel="stylesheet" href="[^"]+/page.css">','<style>'+(p/'page.css').read_text()+'</style>',s)
assert '{{' not in s
(p/'index.html').write_text(s)
print('HTML',len(s.encode()),'bytes')
