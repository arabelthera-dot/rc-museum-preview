/* Блок «Документ» — доказательство первенства на экране.
   Стандарт: docs/standards/page-production-standard.md, раздел от 09.10.2026.
   Данные: <script type="application/json" data-proof>{…priority_proof…}</script>
   Место:  <section data-proof-block></section> сразу под утверждением первенства.
   status=not_found — блок не рисуется, день остаётся; список для Сергея ведёт tools/proof-check.py. */
(function(){
  'use strict';
  var CSS='.rc-proof{margin:28px 0;padding:22px 22px 18px;border:1px solid var(--gold-l,#b8943f);border-radius:6px;'+
    'background:var(--surface,rgba(184,148,63,.06));color:var(--fg,inherit);font-size:16px;line-height:1.5}'+
    '.rc-proof__k{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-l,#b8943f);margin:0 0 8px}'+
    '.rc-proof__t{font-family:"Playfair Display",Georgia,serif;font-size:20px;margin:0 0 6px}'+
    '.rc-proof__m{color:var(--muted,#777);font-size:14px;margin:0 0 14px}'+
    '.rc-proof figure{margin:0 0 14px}.rc-proof img{display:block;max-width:100%;height:auto;border:1px solid rgba(0,0,0,.15)}'+
    '.rc-proof figcaption{font-size:13px;color:var(--muted,#777);margin-top:6px}'+
    '.rc-proof__vs{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;border-top:1px solid rgba(128,128,128,.3);padding-top:14px}'+
    '.rc-proof__side b{display:block;font-size:22px}.rc-proof__side span{font-size:13px;color:var(--muted,#777)}'+
    '.rc-proof__gap{text-align:center;font-weight:700;color:var(--gold-l,#b8943f);white-space:nowrap}'+
    '.rc-proof__side--them{text-align:right}.rc-proof a{color:inherit}'+
    '@media(max-width:480px){.rc-proof__vs{grid-template-columns:1fr}.rc-proof__side--them{text-align:left}.rc-proof__gap{text-align:left}}';
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function year(d){return d?parseInt(String(d).slice(0,4),10):NaN;}
  function fmt(d){
    if(!d)return '';var p=String(d).split('-');
    var M=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    if(p.length===3)return parseInt(p[2],10)+' '+M[parseInt(p[1],10)-1]+' '+p[0]+' г.';
    return p[0]+' г.';
  }
  function plural(n){var a=n%10,b=n%100;if(a===1&&b!==11)return 'год';if(a>=2&&a<=4&&(b<10||b>=20))return 'года';return 'лет';}
  function render(host,data){
    if(!data||data.status!=='found'||!data.ours)return;
    var o=data.ours,r=data.rival;
    var box=el('div','rc-proof');box.setAttribute('role','note');box.setAttribute('aria-label','Документ первенства');
    box.appendChild(el('p','rc-proof__k','Документ'));
    box.appendChild(el('p','rc-proof__t',o.title));
    box.appendChild(el('p','rc-proof__m',[o.kind,o.number?'№ '+o.number:'',fmt(o.date),o.holder].filter(Boolean).join(' · ')));
    if(o.scan){
      var f=el('figure'),img=el('img');img.src=o.scan;img.alt=o.kind+': '+o.title;img.loading='lazy';
      var a=el('a');a.href=o.source_url;a.target='_blank';a.rel='noopener';a.appendChild(img);f.appendChild(a);
      f.appendChild(el('figcaption',null,o.scan_credit||'Источник: '+o.source_url));box.appendChild(f);
    }else{
      var s=el('p','rc-proof__m');var l=el('a',null,'Открыть документ в архиве');l.href=o.source_url;l.target='_blank';l.rel='noopener';s.appendChild(l);box.appendChild(s);
    }
    if(r&&r.name){
      var gap=data.gap_years!=null?data.gap_years:(year(r.date)-year(o.date));
      var vs=el('div','rc-proof__vs');
      var us=el('div','rc-proof__side');us.appendChild(el('b',null,String(year(o.date))));us.appendChild(el('span',null,'Россия · '+o.kind));
      var g=el('div','rc-proof__gap',isFinite(gap)&&gap>0?'раньше на '+gap+' '+plural(gap):'');
      var th=el('div','rc-proof__side rc-proof__side--them');th.appendChild(el('b',null,String(year(r.date))));
      th.appendChild(el('span',null,r.name+(r.doc_title?' · '+r.doc_title:'')));
      vs.appendChild(us);vs.appendChild(g);vs.appendChild(th);box.appendChild(vs);
    }
    host.appendChild(box);
  }
  document.addEventListener('DOMContentLoaded',function(){
    var src=document.querySelector('script[data-proof]'),host=document.querySelector('[data-proof-block]');
    if(!src||!host)return;
    var data;try{data=JSON.parse(src.textContent);}catch(e){return;}
    if(!document.getElementById('rc-proof-css')){var st=el('style');st.id='rc-proof-css';st.textContent=CSS;document.head.appendChild(st);}
    render(host,data);
  });
}());
