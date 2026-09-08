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
       city:'../../index.html',
       random:['day-01jan-cabletv.html','…']
     };</script>
     <script src="../../assets/museum-chrome.js"></script>
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
  /* Страница не ездит вбок. Найдено 08.09.2026 браузерной проверкой: на 320px все страницы
     дней, кроме эталона Шухова, вылезали на 62–72px — в эталоне строка стояла руками.
     Именно clip, а не hidden: hidden делает html скролл-контейнером и ломает position:sticky
     у #secnav и у аудиогида. */
  + 'html,body{overflow-x:clip}'
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
  + '.mcnav .ar{color:var(--gold,#c8a24a);font-size:19px;line-height:1;flex:none}'
  /* Название соседней страницы раскрывается ТОЛЬКО когда поля шире самой подписи:
     контент музеев ≤ 840 px, подпись ≤ 300 px → 840 + 2×320 ≈ 1480 px.
     Уже — компактная стрелка 44 px, иначе она садится на заголовки секций (аудит 05.08). */
  + '.mcnav .tx{display:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  + '@media (min-width:1480px){.mcnav .tx{display:block}}'
  + '.mcnav{min-width:44px;min-height:44px;justify-content:center;padding:12px 11px}'
  + '.mcnav.prev{left:0;border-left:none;border-radius:0 22px 22px 0}'
  + '.mcnav.next{right:0;border-right:none;border-radius:22px 0 0 22px;text-align:right}'
  /* До 1024 px свободных полей нет вовсе — стрелки уходят в нижние углы.
     Правая поднята над сердечком поддержки (#heart: bottom 82 px, высота 46 px). */
  + '@media (max-width:1023px){.mcnav{padding:12px 10px}'
  + '.mcnav.prev{bottom:74px;top:auto;transform:none}.mcnav.next{bottom:136px;top:auto;transform:none}}'
  /* строка «Случайное · Все · В город-музей» */
  + '.wayrow{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin:18px auto 4px;padding:0 14px}'
  + '.wayrow a{font-size:13px;padding:9px 16px;border:1px solid var(--line,rgba(255,255,255,.14));border-radius:20px;'
  + 'color:var(--txt,#e8e6e1);opacity:.82;text-decoration:none;transition:opacity .2s,border-color .2s,background .2s}'
  + '.wayrow a:hover{opacity:1;border-color:var(--gold,#c8a24a);background:rgba(200,162,74,.1)}'
  + '.wayrow a.dice{color:var(--gold,#c8a24a);border-color:rgba(200,162,74,.45);opacity:1}'
  + '@media (prefers-reduced-motion:reduce){.mcnav,#secnav a,.wayrow a{transition:none}}'
  /* ── обложка обязана уместиться в первый экран ВМЕСТЕ с заголовком (04.08, разбор Шухова) ──
     Было: шапка 200/265 px + сцена 48vh → h1 начинался на 880 px, на мобиле первый экран =
     одна служебная навигация. --hero-fit считает JS от реального верха визуала. */
  + '.hero-scene,.hero-visual,.hero .bg{max-height:var(--hero-fit,none)!important}'
  /* Исключение — картинные музеи: полотно показывается целиком (.fit-full), обрезать его
     ради первого экрана нельзя. Высоту там держит сама картинка (max-height:62vh). */
  + '.hero-scene.fit-full{max-height:none!important}'
  + '.hero-scene.fit-full img{max-height:min(62vh,var(--hero-fit,62vh))}'
  /* ── строка слогана портала под названием музея (museum-core, раздел 6-бис) ──
     Слоган стоял руками только у эталона Шухова, у остальных 15 страниц января его не было
     (аудит 08.09.2026). Повторяющийся блок отдан движку, а не размножен копией по файлам
     (договор о приёмке, п. 10). Кегль и прозрачность — как в эталоне. */
  + 'header.top .b2,header.site .b2{display:block;text-align:center;font-size:11px;opacity:.62;'
  + 'line-height:1.45;max-width:760px;margin-left:auto;margin-right:auto;padding:2px 16px 7px;'
  + 'overflow:hidden;max-height:64px;transition:max-height .25s,opacity .2s,padding .25s}'
  /* липкая шапка со слоганом занимала на мобиле 122 px вместо 64 и висела над всей страницей:
     в исходном положении слоган виден, при прокрутке строка убирается (только там, где шапка
     действительно sticky — у эталона Шухова шапка обычная и уезжает сама) */
  + 'header.mc-shrink .b2{max-height:0;opacity:0;padding-top:0;padding-bottom:0}'
  + '@media (prefers-reduced-motion:reduce){header.top .b2,header.site .b2{transition:none}}'
  /* на мобиле до заголовка стояли: подзаголовок музея (2 строки), этикетка сцены крупным
     кеглем и щедрый отступ обложки — вместе больше половины экрана */
  + '@media (max-width:600px){header.top .b2,header.site .b2{display:block!important;font-size:11.5px;line-height:1.4;max-width:94%}'
  + '.scene-caption{padding:10px 0 12px!important}'
  + '.scene-caption .scene-cap{font-size:12.5px;line-height:1.45}'
  /* подсказка про интерактив стояла последней и уезжала под этикетку на 780 px —
     ставим её первой строкой сразу под сценой (разбор Шухова, 04.08) */
  + '.scene-caption .scene-hint{order:-1;width:100%;margin-bottom:6px;padding:5px 10px!important}'
  + '.hero-lead{padding-top:12px!important}'
  /* ── уплотнение первого экрана 08.09.2026 (замер fold-parts.mjs на 390×844) ──
     Сцена уже стояла на нижнем пределе 200 px, а низ кнопок у эталона Шухова был на 919 px
     при экране 844. Значит резать надо не обложку, а то, что стоит до неё и после неё:
     каждая строка ниже — измеренный кусок высоты, а не косметика.
     шапка со слоганом 118 · крошки 28 · строка «поделиться» 42 · этикетка 140 ·
     подводка до h1 99 · h1 55 · хук 119 · кнопки 104 */
  + 'header.top{padding-top:30px!important}'
  + 'header.top .b2,header.site .b2{font-size:11px;line-height:1.35;padding-bottom:5px}'
  + '.crumbs{font-size:11px!important;line-height:1.3;padding:2px 10px 4px!important}'
  /* строка «поделиться» стояла между крошками и обложкой и съедала 42 px первого экрана */
  + '.sharerow{padding:2px 0!important}'
  + '.sharerow .sharebtn{padding:5px 11px!important;font-size:11.5px!important}'
  + '.scene-caption{padding:6px 0 8px!important}'
  + '.scene-caption .scene-cap{font-size:12px;line-height:1.4}'
  /* min-height страницы побеждает max-height движка: у cabletv сцена держалась на 230 px
     вопреки расчёту --hero-fit. Нижний предел обложки задаёт сам расчёт (200 px), не CSS. */
  + '.hero-scene,.hero-visual,.hero .bg{min-height:0!important}'
  /* заголовок обложки: на cabletv кегль оставался 34 px и h1 занимал 106 px в две строки.
     Обложечные заголовки других раскладок (.bp-over, .bp-title) не трогаются. */
  + '.hero-lead h1,header.hero-lead h1{font-size:25px!important;line-height:1.1;margin-bottom:10px!important}'
  + '.hero-lead .hook{font-size:14.5px;line-height:1.45}'
  /* кнопки: две по 46 px в столбик + зазор 12 = 104 px; при трёх кнопках было 169 */
  + '.hero-btns{gap:8px!important}'
  + '.hero-btns>a,.hero-btns>button{padding:11px 15px!important;font-size:13.5px!important}}';

  var st = doc.createElement('style'); st.textContent = css; doc.head.appendChild(st);

  function el(tag, cls, html){var e=doc.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e;}

  /* ── 0-бис. строка слогана портала в шапке ──
     Слоган портала один на все музеи и меняться не может (museum-core, раздел 6-бис),
     поэтому текст живёт здесь, а не в конфиге страницы. Переопределение — только для
     иноязычной версии через C.t.slogan. Если строка уже стоит в HTML (эталон Шухова) —
     движок её не трогает, как и любой другой готовый элемент. */
  /* Одной строкой, без склейки: аудитор ищет слоган в тексте этого файла (slogan_ok
     в tools/audit-pages.py), разорванная конкатенацией строка ему не видна. */
  var SLOGAN = 'Первый цифровой музей достижений России · Цивилизация первенств — что Россия дала миру раньше всех';
  (function(){
    var head = doc.querySelector('header.top') || doc.querySelector('header.site');
    if(!head) return;
    if(!head.querySelector('.b2')) head.appendChild(el('div','b2', T.slogan || SLOGAN));
    /* сжатие только у липкой шапки: обычная уезжает при прокрутке сама */
    if((doc.defaultView.getComputedStyle(head).position || '') !== 'sticky') return;
    var shrunk = false;
    doc.defaultView.addEventListener('scroll', function(){
      var need = (doc.defaultView.pageYOffset || 0) > 90;
      if(need === shrunk) return;
      shrunk = need;
      head.classList[need ? 'add' : 'remove']('mc-shrink');
    }, {passive:true});
  })();

  /* ── 0. высота обложки: сцена + этикетка + заголовок + кнопки влезают в первый экран ──
     Считаем от реального верха визуала, поэтому работает при любой шапке и на любом экране.
     Резерв под этикетку сцены и первую строку h1 — 26% высоты окна, но не меньше 150 и не больше 210. */
  function fitHero(){
    var v = doc.querySelector('.hero-scene, .hero-visual, .hero .bg');
    if(!v) return;
    var vh = window.innerHeight || 700, y = window.pageYOffset || 0;
    var vr = v.getBoundingClientRect(), top = vr.top + y;
    /* Нижняя граница первого экрана — не заголовок, а ДВЕ КНОПКИ под ним (museum-core, 6-бис
       п.5: «кнопки, уехавшие за сгиб, считаются отсутствующими»). Замер 08.09.2026 на 390×844:
       у эталона Шухова низ .hero-btns был на 938 px при экране 844 — резерв считался по h1
       и про кнопки не знал. Нет кнопок в разметке — планка прежняя, по заголовку. */
    var h1 = doc.querySelector('h1'), last = doc.querySelector('.hero-btns') || h1, reserve = 0;
    if(h1 && last){
      var hr = h1.getBoundingClientRect(), lr = last.getBoundingClientRect();
      var gap = (hr.top + y) - (vr.bottom + y);   /* этикетка сцены, дата, имя — всё между */
      /* в первый экран должен попасть ВЕСЬ заголовок и начало хука, а не верхние 40 px строки:
         замер 04.08 — при резерве в одну строку у Шухова на 390 px было видно 41 px из h1 */
      var need = ((lr.bottom + y) - (hr.top + y)) + 28;
      /* gap < 0 — старый формат, где заголовок лежит внутри обложки: там резерв не нужен */
      /* потолок резерва 0.70 vh (было 0.58): при 0.58 кнопкам Шухова не хватало 94 px и они
         оставались за сгибом даже после учёта их высоты. Нижний предел сцены (200 px) держит
         обложку от вырождения в полоску, поэтому потолок можно поднимать безопасно. */
      if(gap > 0) reserve = Math.min(Math.round(vh * 0.70), gap + need);
    }
    if(!reserve) reserve = Math.max(150, Math.min(210, Math.round(vh * 0.26)));
    var h = Math.max(200, Math.round(vh - top - reserve));
    doc.documentElement.style.setProperty('--hero-fit', h + 'px');
  }
  fitHero();
  window.addEventListener('load', function(){ fitHero(); window.dispatchEvent(new Event('resize')); });
  var fitT; window.addEventListener('resize', function(){
    clearTimeout(fitT); fitT = setTimeout(fitHero, 160);
  });

  /* ── 1. кнопка возврата в музей ──
     Крошки ведут в тот же музей тем же текстом, поэтому кнопка при них — третий повтор
     названия в шапке и лишние 55 px до заголовка (разбор Шухова, 04.08). */
  var crumbHome = doc.querySelector('nav.crumbs a[href="' + (M.href || '') + '"]');
  var oldBack = doc.querySelector('.backbtn');
  if(oldBack && crumbHome && oldBack.getAttribute('href') === M.href && oldBack.parentNode){
    oldBack.parentNode.removeChild(oldBack);   /* кнопка, вшитая в HTML до появления крошек */
    oldBack = null;
  }
  if(!oldBack && M.href && !crumbHome){
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
      if(Array.isArray(C.navIds) && C.navIds.indexOf(id) === -1) return;
      var lab = s.getAttribute('data-nav') || (C.labels && C.labels[id]) || LABEL[id];
      if(!lab) return;
      if(chips.some(function(c){return c.lab === lab;})) return;   /* «Игра 1/2» — один чип */
      chips.push({id:id, lab:lab});
    });
    if(chips.length > 2){
      nav = el('nav'); nav.id = 'secnav'; nav.setAttribute('aria-label','Разделы страницы');
      var row = el('div','row');
      if(M.href && C.showMuseumHome !== false){var hm = el('a','home', M.homeLabel || '← Музей'); hm.href = M.href; row.appendChild(hm);}
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
      if(cur > -1 && nrow && !C.stableNav){
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
    var city = C.city || '../../index.html';
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
