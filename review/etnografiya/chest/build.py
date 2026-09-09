from pathlib import Path
import re,json
p=Path(__file__).parent
base="https://raw.githubusercontent.com/arabelthera-dot/rc-museum-preview/codex/chest-fix-0909/review/etnografiya/chest/"
s=(p/'full-source.html').read_text()
for n in ['chest','lock','drawers']:
 s=s.replace('{{'+n+'}}',base+'media/'+n+'.webp')
assert '{{' not in s
(p/'index.html').write_text(s)
print('HTML',len(s.encode()),'bytes')
