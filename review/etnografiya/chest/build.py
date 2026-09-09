from pathlib import Path
import base64,re
p=Path(__file__).parent
s=(p/'story.html').read_text().replace('/*TOKENS*/',(p/'tokens.css').read_text())
css=p.parents[2]/'assets/fonts.css'
fontcss=css.read_text()
blocks=[b for b in re.findall(r'@font-face\s*\{[^}]+\}',fontcss) if "font-family: 'Lora'" in b and 'font-style: normal' in b and 'font-weight: 400' in b and ('U+0301' in b or 'U+0000' in b)]
for i,b in enumerate(blocks):
 for rel in re.findall(r'url\(([^)]+)\)',b):
  f=css.parent/rel;blocks[i]=blocks[i].replace(rel,'data:font/woff2;base64,'+base64.b64encode(f.read_bytes()).decode())
s=s.replace('/*FONT*/','\n'.join(blocks))
for name in ['chest','lock','drawers']:
 s=s.replace('{{'+name+'}}','data:image/jpeg;base64,'+base64.b64encode((p/'media'/f'{name}.jpeg').read_bytes()).decode())
s=s.replace('<script src="https://arabelthera-dot.github.io/rc-museum-preview/assets/museum-support.js"></script>','<script>'+ (p.parents[2]/'assets/museum-support.js').read_text() +'</script>')
assert '{{' not in s
(p/'index.html').write_text(s)
print('Built',len(s.encode()),'bytes;',len(blocks),'font blocks')
