from pathlib import Path
import re,json,ast,hashlib
p=Path(__file__).parent
base="https://raw.githubusercontent.com/arabelthera-dot/rc-museum-preview/codex/chest-structure-0909/review/etnografiya/chest/"
s=(p/'full-source.html').read_text()
for n in ['chest','lock','drawers']:
 s=s.replace('{{'+n+'}}',base+'media/'+n+'.webp')
for n,w in [('chest',697),('lock',517),('drawers',835)]:
 s=re.sub(r'(<img(?![^>]*id="(?:gallery-img|viewer-img)")[^>]*src="'+re.escape(base+'media/'+n+'.webp')+r'")',lambda m:m[1]+' srcset="'+base+'media/'+n+'-400.webp 400w, '+base+'media/'+n+'.webp '+str(w)+'w" sizes="(max-width:700px) 90vw, 835px"',s)
s=re.sub(r'<link rel="stylesheet" href="[^"]+/page.css">','<style>'+(p/'page.css').read_text()+'</style>',s)
# Render the shared chrome CSS before first paint; the runtime keeps owning behavior.
# Extract from the existing common engine, without maintaining a page-specific copy.
chrome=(p/'../../../assets/museum-chrome.js').resolve().read_text()
css_expr=chrome.split("var css =",1)[1].split("var st =",1)[0]
css_expr=re.sub(r'/\*.*?\*/','',css_expr,flags=re.S).strip().rstrip(';')
parts=re.findall(r"'(?:\\.|[^'\\])*'",css_expr)
assert re.sub(r"'(?:\\.|[^'\\])*'",'',css_expr).replace('+','').strip()==''
chrome_css=''.join(ast.literal_eval(part) for part in parts)
s=s.replace('</head>','<style data-shared-chrome-sha256="'+hashlib.sha256(chrome.encode()).hexdigest()+'">'+chrome_css+'</style></head>')
issue=json.loads((p/'issue.json').read_text())
manifest={'maximum':sum(issue['score_ledger'].values()),'awards':[{'id':k,'max':v} for k,v in issue['score_ledger'].items()]}
assert manifest['maximum']==100
s=s.replace('{{score_manifest}}','<template id="score-data"><script type="application/json" id="museum-score-manifest">'+json.dumps(manifest)+'</script></template><script>document.head.append(document.getElementById("score-data").content.firstElementChild);</script>')
assert '{{' not in s
(p/'index.html').write_text(s)
print('HTML',len(s.encode()),'bytes')
