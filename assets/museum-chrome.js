/* museum-chrome.js — единая обвязка страницы экспоната для всех музеев.
   Эталон разметки и CSS — pervoprohodcy/exp-dezhnev-1648.html (аудит 30.07).

   Даёт пять элементов стандарта + анти-тупик:
     1. .backbtn «← [Музей]» в шапке
     2. .sharerow с #sharebtn «⤴ Поделиться страницей» (+ дубль #sharefinal, если есть в HTML)
     3. #secnav — липкие чипсы разделов с полосой прочитанного
     4. прилипшие стрелки «← пред · след →»
     5. строка «🎲 Случайное · Все экспонаты · В город-музей» в блоке «Куда дальше»

   Ничего не дублирует: если элемент уже есть в HTML — движок его не трогает,
   только доводит поведение (share, подсветка чипсов).

   Подключение перед </body>:
     <script>window.MUSEUM_CHROME={
       museum:{title:'Музей изобретений',href:'index.html'},
       share:{title:'…',text:'…'},
       prev:{href:'day-04jan-pilchikov.html',title:'4 января · Пильчиков'},
       next:{href:'day-06jan-bering.html',title:'6 января · Беринг'},
       all:{href:'index.html',label:'Все изобретения'},
       city:'../index.html',
       random:['day-01jan-cabletv.html','…']
     };</script>
     <script src="../assets/museum-chrome.js"></script>
*/
(function(){
  var C = window.MUSEUM_CHROME || {};
  var M = C.museum || {};
  var T = C.t || {};                       /* подписи: RU по умолчанию, EN-версия шлёт свои */
  var doc = document, body = doc.body;
  if(!body) return;

  /* ── подписи чипсов по id секции: единые для трёх музеев ── */
  var LABEL = {
    'video':'Ролик','rolik':'Ролик','rolik-kartiny':'Ролик','film':'Ролик',
    'audioguide':'Аудиогид','audiogid':'Аудиогид',
    'glubokiy-zum':'Зум','zum-po-polotnu':'Зум','zoomwrap':'Зум',
    'kartina-i-hudozhnik':'Картина','story':'История','istoriya':'История',
    'put':'Маршрут','routewrap':'Маршрут','atlas':'Атлас',
    'trudno-poverit':'Факты','more':'Ещё','theme-inventions':'Тема',
    /* 03.08: секции, которые выпадали из панели на всех трёх флагманах */
    'chto-zametit':'Детали','mirovoy-kontekst':'Мир','scene-baku':'Сцена',
    'kontekst':'Мир','razbor':'Разбор',
    'chat':'Интервью','chat-sec':'Интервью',
    'game':'Игра','games':'Игры','pohod':'Игра','geom-sec':'Игра',
    'game-trajectory':'Игра','game-landing':'Игра','assemble':'Сборка',
    'quiz':'Викторина','quiz-sec':'Викторина','sharada':'Шарада','myth-sec':'Мифы',
    'fork':'Развилка','excursion':'Экскурсия','result':'Итог','calendar':'Календарь'
  };
  var SKIP = {'catalog':1,'kuda-dalshe':1,'final':1};

  /* ── CSS: цвета берём у страницы, фолбэк — палитра «Русской цивилизации» ── */
  var css = ''
  + '.backbtn{position:static;margin:12px 0 0 12px;display:inline-flex;align-items:center;gap:7px;'
  + 'background:rgba(11,13,17,.86);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);'
  + 'border:1px solid var(--gold,#c8a24a);color:var(--gold,#c8a24a);border-radius:22px;padding:9px 15px;'
  + 'font-family:Georgia,serif;font-size:13.5px;text-decoration:none;box-shadow:0 4px 16px rgba(0,0,0,.5);transition:background .2s}'
  + '.backbtn:hover{background:rgba(200,162,74,.18)}'
  + '.backbtn .ar{font-size:16px;line-height:1}'
  + '@media (max-width:520px){.backbtn{font-size:12.5px;padding:8px 13px}}'
  + '.sharerow{text-align:center;padding:10px 16px 0}'
  + '.sharebtn{background:rgba(18,21,28,.9);border:1px solid var(--line,rgba(255,255,255,.14));'
  + 'color:var(--gold,#c8a24a);border-radius:22px;padding:8px 18px;font-family:inherit;font-size:13.5px;cursor:pointer}'
  + '.sharebtn span{margin-right:7px}'
  + '.sharehint{font-size:12.5px;opacity:.85;margin-left:10px;display:none}'
  + '#secnav{position:sticky;top:0;z-index:55;background:rgba(11,13,17,.94);'
  + '-webkit-backdrop-filter:blur(9px);backdrop-filter:blur(9px);border-bottom:1px solid var(--line,rgba(255,255,255,.14))}'
  + '#secnav .row{display:flex;gap:6px;overflow-x:auto;padding:9px 12px;scrollbar-width:none;-ms-overflow-style:none}'
  + '#secnav .row::-webkit-scrollbar{display:none}'
  + '#secnav a{flex:none;font-size:12.5px;padding:6px 12px;border:1px solid var(--line,rgba(255,255,255,.14));border-radius:16px;'
  + 'color:var(--txt,#e8e6e1);opacity:.7;text-decoration:none;white-space:nowrap;transition:opacity .2s,border-color .2s,background .2s}'
  + '#secnav a:hover{opacity:1;border-color:var(--gold,#c8a24a)}'
  + '#secnav a.on{opacity:1;color:var(--gold,#c8a24a);border-color:var(--gold,#c8a24a);background:rgba(200,162,74,.13)}'
  + '#secnav a.home{color:var(--gold,#c8a24a);opacity:.85;border-color:rgba(200,162,74,.45)}'
  + '#secnav .prog{height:2px;width:0;background:var(--gold,#c8a24a);box-shadow:0 0 8px rgba(200,162,74,.6)}'
  + 'section[id]{scroll-margin-top:56px}'
  + '@media (max-width:520px){#secnav a{font-size:12px;padding:5px 10px}#secnav .row{padding:8px 10px}}'
  /* стрелки «пред/след» */
  + '.mcnav{position:fixed;top:50%;transform:translateY(-50%);z-index:54;display:flex;align-items:center;gap:8px;'
  + 'max-width:min(38vw,300px);background:rgba(11,13,17,.9);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);'
  + 'border:1px solid var(--line,rgba(255,255,255,.14));color:var(--txt,#e8e6e1);text-decoration:none;'
  + 'font-family:inherit;font-size:12.5px;line-height:1.3;padding:10px 13px;opacity:0;pointer-events:none;transition:opacity .3s,border-color .2s}'
  + '.mcnav.show{opacity:.92;pointer-events:auto}'
  + '.mcnav:hover{opacity:1;border-color:var(--gold,#c8a24a)}'
  + '.mcnav .ar{color:var(--gold,#c8a24a);font-size:17px;line-height:1;flex:none}'
  + '.mcnav .tx{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  + '.mcnav.prev{left:0;border-left:none;border-radius:0 22px 22px 0}'
  + '.mcnav.next{right:0;border-right:none;border-radius:22px 0 0 22px;text-align:right}'
  + '@media (max-width:860px){.mcnav .tx{display:none}.mcnav{padding:12px 10px}'
  + '.mcnav.prev{bottom:74px;top:auto;transform:none}.mcnav.next{bottom:74px;top:auto;transform:none}}'
  /* строка «Случайное · Все · В город-музей» */
  + '.wayrow{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin:18px auto 4px;padding:0 14px}'
  + '.wayrow a{font-size:13px;padding:9px 16px;border:1px solid var(--line,rgba(255,255,255,.14));border-radius:20px;'
  + 'color:var(--txt,#e8e6e1);opacity:.82;text-decoration:none;transition:opacity .2s,border-color .2s,background .2s}'
  + '.wayrow a:hover{opacity:1;border-color:var(--gold,#c8a24a);background:rgba(200,162,74,.1)}'
  + '.wayrow a.dice{color:var(--gold,#c8a24a);border-color:rgba(200,162,74,.45);opacity:1}'
  + '@media (prefers-reduced-motion:reduce){.mcnav,#secnav a,.wayrow a{transition:none}}';

  var st = doc.createElement('style'); st.textContent = css; doc.head.appendChild(st);

  function el(tag, cls, html){var e=doc.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e;}

  /* ── 1. кнопка возврата в музей ── */
  if(!doc.querySelector('.backbtn') && M.href){
    var back = el('a','backbtn','<span class="ar">←</span>'+(M.title||'Музей'));
    back.href = M.href;
    body.insertBefore(back, body.firstChild);
  }

  /* ── 2. строка «Поделиться» — сразу под обложкой ── */
  var anchor = doc.querySelector('.hero') || doc.querySelector('nav.crumbs') || doc.querySelector('header');
  var madeShare = false;
  if(!doc.querySelector('.sharerow') && anchor && anchor.parentNode){
    madeShare = true;
    var srow = el('div','sharerow',
      '<button class="sharebtn" type="button" id="sharebtn"><span>⤴</span>'+(T.share||'Поделиться страницей')+'</button>'
      + '<span class="sharehint" id="sharehint"></span>');
    anchor.parentNode.insertBefore(srow, anchor.nextSibling);
  }
  /* обработчик вешаем только на свою кнопку: где .sharerow был в HTML, там уже есть свой скрипт */
  if(madeShare) (function(){
    var h = doc.getElementById('sharehint');
    function hint(t){if(!h)return; h.textContent=t; h.style.display='inline';
      setTimeout(function(){h.style.display='none';}, 2800);}
    function share(){
      var url = location.href.split('#')[0];
      var s = C.share || {};
      var payload = {title: s.title || doc.title, text: s.text || '', url: url};
      if(navigator.share){navigator.share(payload).catch(function(){}); return;}
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(function(){hint('Ссылка скопирована');}, function(){hint(url);});
        return;
      }
      hint(url);
    }
    ['sharebtn','sharefinal'].forEach(function(id){
      var b = doc.getElementById(id); if(b) b.addEventListener('click', share);
    });
  })();

  /* ── 3. липкие чипсы разделов ── */
  var nav = doc.getElementById('secnav');
  if(!nav){
    var secs = [].slice.call(doc.querySelectorAll('section[id],div[id="routewrap"],div[id="zoomwrap"]'));
    var chips = [];
    secs.forEach(function(s){
      var id = s.id;
      if(!id || SKIP[id]) return;
      var lab = s.getAttribute('data-nav') || (C.labels && C.labels[id]) || LABEL[id];
      if(!lab) return;
      if(chips.some(function(c){return c.lab === lab;})) return;   /* «Игра 1/2» — один чип */
      chips.push({id:id, lab:lab});
    });
    if(chips.length > 2){
      nav = el('nav'); nav.id = 'secnav'; nav.setAttribute('aria-label','Разделы страницы');
      var row = el('div','row');
      if(M.href){var hm = el('a','home', M.homeLabel || '← Музей'); hm.href = M.href; row.appendChild(hm);}
      chips.forEach(function(c){var a = el('a', null, c.lab); a.href = '#'+c.id; row.appendChild(a);});
      nav.appendChild(row);
      var prog = el('div','prog'); prog.id = 'secprog'; nav.appendChild(prog);
      /* страницы дней носят урезанную .daynav (6 ссылок, без «← Музей», подсветки и прогресса) —
         занимаем её место, чтобы не было двух липких панелей друг на друге */
      var old = doc.querySelector('.daynav');
      if(old && old.parentNode){
        old.parentNode.insertBefore(nav, old);
        old.parentNode.removeChild(old);
      } else {
        var host = doc.querySelector('.sharerow') || anchor;
        if(host && host.parentNode) host.parentNode.insertBefore(nav, host.nextSibling);
        else body.insertBefore(nav, body.firstChild);
      }
      /* если шапка сама липкая — встаём под неё, а не поверх */
      var top = 0;
      [].slice.call(doc.querySelectorAll('header')).forEach(function(hd){
        var cs = getComputedStyle(hd);
        if(cs.position === 'sticky' && parseInt(cs.top || '0', 10) === 0) top = Math.max(top, hd.offsetHeight);
      });
      if(top){
        nav.style.top = top + 'px';
        nav.style.zIndex = '25';
        var sm = doc.createElement('style');
        sm.textContent = 'section[id]{scroll-margin-top:' + (top + 52) + 'px}';
        doc.head.appendChild(sm);
      }
    }
  }
  if(nav){
    var nrow = nav.querySelector('.row'), nprog = doc.getElementById('secprog');
    var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
    var targets = links.map(function(a){return doc.getElementById(a.getAttribute('href').slice(1));});
    var navH = nav.offsetHeight, tick = 0;
    var upd = function(){
      var y = window.scrollY || doc.documentElement.scrollTop;
      var h = doc.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? Math.min(100, y / h * 100) : 0;
      if(nprog) nprog.style.width = pct.toFixed(1) + '%';
      var cur = -1;
      for(var i=0;i<targets.length;i++){
        if(targets[i] && targets[i].getBoundingClientRect().top <= navH + 50) cur = i;
      }
      for(var j=0;j<links.length;j++) links[j].classList.toggle('on', j === cur);
      if(cur > -1 && nrow){
        var a = links[cur], l = a.offsetLeft, r = l + a.offsetWidth;
        if(l < nrow.scrollLeft + 10) nrow.scrollLeft = Math.max(0, l - 14);
        else if(r > nrow.scrollLeft + nrow.clientWidth - 10) nrow.scrollLeft = r - nrow.clientWidth + 14;
      }
      /* стрелки показываем, когда читатель уже втянулся: страницы дней длинные,
         поэтому порог в абсолютной прокрутке, а не в процентах */
      if(arrows.length){
        var on = y > window.innerHeight * 0.8;
        arrows.forEach(function(x){x.classList.toggle('show', on);});
      }
    };
    var arrows = [];

    /* ── 4. прилипшие стрелки «пред / след» ── */
    [['prev','←',C.prev],['next','→',C.next]].forEach(function(cfg){
      var d = cfg[2]; if(!d || !d.href) return;
      if(doc.querySelector('.mcnav.'+cfg[0])) return;
      var a = el('a','mcnav '+cfg[0]);
      a.href = d.href;
      a.setAttribute('aria-label', (cfg[0]==='prev'?'Предыдущий экспонат: ':'Следующий экспонат: ')+(d.title||''));
      var ar = el('span','ar', cfg[1]), tx = el('span','tx', d.title || '');
      if(cfg[0]==='prev'){a.appendChild(ar); a.appendChild(tx);} else {a.appendChild(tx); a.appendChild(ar);}
      body.appendChild(a); arrows.push(a);
    });

    addEventListener('scroll', function(){
      if(tick) return;
      tick = requestAnimationFrame(function(){tick = 0; upd();});
    }, {passive:true});
    addEventListener('resize', function(){navH = nav.offsetHeight; upd();});
    upd();
  }

  /* ── 5. строка «Случайное · Все экспонаты · В город-музей» ── */
  (function(){
    if(doc.querySelector('.wayrow')) return;
    var all = C.all || (M.href ? {href:M.href, label:'Все экспонаты'} : null);
    var pool = (C.random || []).filter(function(u){
      return u.split('/').pop() !== location.pathname.split('/').pop();
    });
    var row = el('div','wayrow');
    if(pool.length){
      var d = el('a','dice', T.dice || '🎲 Случайное');
      d.href = '#';
      d.addEventListener('click', function(e){
        e.preventDefault();
        location.href = pool[Math.floor(Math.random() * pool.length)];
      });
      row.appendChild(d);
    }
    if(all && all.href){var a2 = el('a', null, all.label || T.all || 'Все экспонаты'); a2.href = all.href; row.appendChild(a2);}
    var city = C.city || '../index.html';
    var a3 = el('a', null, T.city || 'В город-музей'); a3.href = city; row.appendChild(a3);
    if(row.children.length < 2) return;

    /* по стандарту строка живёт в блоке «Куда дальше»; где его нет —
       ставим её после последнего смыслового блока, а не внутрь чужой секции */
    var inside = doc.getElementById('kuda-dalshe');
    var after = doc.getElementById('catalog') || doc.getElementById('calendar');
    if(inside) inside.appendChild(row);
    else if(after && after.parentNode) after.parentNode.insertBefore(row, after.nextSibling);
    else body.appendChild(row);
  })();
})();
