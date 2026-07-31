/* museum-support.js — единый блок «Поддержать проект» для всех музеев.
   Эталон разметки и CSS — izobreteniya/day-05jan-shukhov.html (правка Сергея 31.07).

   Стандарт (PREFERENCES.md, 31.07):
     1. блок на эмоциональном пике — сразу после «Итога дня» (или ближайшего пика);
     2. блок в подвале — внутри «Куда дальше»;
     3. прилипшее сердечко «❤ Поддержать проект» справа снизу;
     4. название везде «Поддержать проект»; формулировка «дать денег» ЗАПРЕЩЕНА,
        третий способ — «поддержать проект рублём»;
     5. шрифт блока НЕ как у текста страницы: Playfair Display 17px на золотой
        подложке с двойной рамкой, капс-заголовок Inter 10px / трекинг 3.4px.

   Ничего не дублирует: страница, где блоки уже свёрстаны вручную (Шухов),
   движку не нужна — он сам выходит, увидев два блока и сердечко.

   Подключение перед </body>:
     <script>window.MUSEUM_SUPPORT={
       museum:'Что изобрели русские первыми в мире',
       page:'странице Шухова',          // для темы письма
       peak:'#result'                    // необязательно: свой якорь блока-пика
     };</script>
     <script src="../assets/museum-support.js"></script>
*/
(function(){
  var C = window.MUSEUM_SUPPORT || {};
  var doc = document, body = doc.body;
  if(!body) return;

  var have = doc.querySelectorAll('.support').length;
  if(have >= 2 && doc.getElementById('heart')) return;   /* всё сверстано вручную */

  var MAIL   = C.mail   || 'arabelthera@gmail.com';
  var MUSEUM = C.museum || 'Русская цивилизация';
  var PAGE   = C.page   || doc.title;
  var EN     = (C.lang === 'en');

  var T = EN ? {
    label:'Support the project',
    heart:'Support the project',
    peak:'The museum is made by two people and it is free — no ads, no sign-up, no paywalls. The most valuable thing you can do right now is <b>send this page to someone who will enjoy it</b>. One such share brings more people than advertising.',
    share:'⤴ Share this page',
    more:'Other ways to help →',
    final:'The museum is free: no ads, no sign-up, no paywalls. There are three ways to support it — <b>show</b> the page to someone who will enjoy it; <b>correct</b> us if you spot a wrong date or figure (<a href="MAILTO">write to us</a>); <b>support the project financially</b> — for archive scans, filming and voice-over: details will appear once the fundraiser is set up.',
    subject:MUSEUM + ' — note on ' + PAGE
  } : {
    label:'Поддержать проект',
    heart:'Поддержать проект',
    peak:'Музей делают два человека, и он бесплатный — без рекламы, регистрации и платных разделов. Самое ценное, что можно сделать прямо сейчас, — <b>отправить страницу тому, кому она зайдёт</b>. Один такой пересыл приводит больше людей, чем реклама.',
    share:'⤴ Поделиться страницей',
    more:'Другие способы поддержать →',
    final:'Музей бесплатный: без рекламы, регистрации и платных разделов. Поддержать его можно тремя способами — <b>показать</b> страницу тому, кому она зайдёт; <b>поправить</b> нас, если нашли ошибку в дате или цифре (<a href="MAILTO">написать</a>); <b>поддержать проект рублём</b> — на архивные сканы, съёмку и озвучку: реквизиты появятся, когда будет оформлен сбор.',
    subject:'Музей «' + MUSEUM + '» — замечание по ' + PAGE
  };
  var MAILTO = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(T.subject);
  T.final = T.final.replace('MAILTO', MAILTO);

  /* ── шрифт: блок обязан отличаться от текста страницы ── */
  if(!/Playfair/.test(doc.documentElement.innerHTML.slice(0, 8000))){
    var fl = doc.createElement('link');
    fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;600;700&display=swap';
    doc.head.appendChild(fl);
  }

  /* ── CSS эталона Шухова ── */
  var css = ''
  + '.support{position:relative;background:linear-gradient(180deg,rgba(201,168,76,.10),rgba(201,168,76,.028));'
  + 'border:1px solid rgba(201,168,76,.34);border-radius:3px;padding:24px 28px 22px;margin-top:20px;scroll-margin-top:70px;'
  + "font-family:'Playfair Display',Georgia,serif;font-size:17px;line-height:1.62;text-align:left;color:var(--fg,#e8e5df)}"
  + ".support::before{content:'';position:absolute;inset:5px;border:1px solid rgba(201,168,76,.15);border-radius:1px;pointer-events:none}"
  + '.support>*{position:relative}'
  + ".support .sup-l{display:flex;align-items:center;gap:10px;font-family:'Inter',system-ui,sans-serif;font-size:10px;font-weight:700;"
  + 'letter-spacing:3.4px;text-transform:uppercase;color:var(--gold,#c8a24a);margin-bottom:11px}'
  + ".support .sup-l::before{content:'❤';font-size:13px;letter-spacing:0}"
  + ".support .sup-l::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(201,168,76,.45),transparent)}"
  + '.support p{margin:0;font-size:17px;line-height:1.62}'
  + '.support b{color:var(--gold-l,#e3c883);font-weight:700}'
  + '.support a{color:var(--gold-l,#e3c883)}'
  + ".support .sup-btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:15px;font-family:'Inter',system-ui,sans-serif}"
  + '.support .sup-btns button{background:rgba(18,21,28,.9);border:1px solid rgba(201,168,76,.45);color:var(--gold-l,#e3c883);'
  + 'border-radius:22px;padding:10px 17px;font-size:14px;cursor:pointer;transition:background .2s}'
  + '.support .sup-btns button.gold{background:rgba(201,168,76,.16)}'
  + '.support .sup-btns button:hover{background:rgba(201,168,76,.26)}'
  + '@media(max-width:600px){.support{padding:20px 18px;font-size:16px}.support p{font-size:16px}}'
  + "#heart{position:fixed;right:12px;bottom:82px;z-index:60;background:rgba(6,12,23,.92);border:1px solid rgba(201,168,76,.35);"
  + 'border-radius:26px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;font-size:17px;'
  + "color:var(--gold,#c8a24a);cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.5);overflow:hidden;font-family:'Inter',system-ui,sans-serif;"
  + 'transition:transform .35s ease,width .3s ease,opacity .3s ease}'
  + '#heart .lbl{display:none;white-space:nowrap;margin-left:7px;font-size:13px;letter-spacing:.3px}'
  + '#heart.wide{width:auto;padding:0 17px}#heart.wide .lbl{display:inline}'
  + '#heart.tuck{transform:translateY(96px);opacity:0;pointer-events:none}';
  var st = doc.createElement('style'); st.textContent = css; doc.head.appendChild(st);

  /* ── разметка блоков ── */
  function peakBlock(){
    var d = doc.createElement('div'); d.className = 'support';
    d.innerHTML = '<div class="sup-l">' + T.label + '</div><p>' + T.peak + '</p>'
      + '<div class="sup-btns">'
      + '<button class="gold" data-sup-share>' + T.share + '</button>'
      + '<button data-sup-more>' + T.more + '</button></div>';
    return d;
  }
  function finalBlock(){
    var d = doc.createElement('div'); d.className = 'support';
    d.innerHTML = '<div class="sup-l">' + T.label + '</div><p>' + T.final + '</p>';
    return d;
  }

  function pick(sel){ for(var i=0;i<sel.length;i++){ var e=doc.querySelector(sel[i]); if(e) return e; } return null; }
  function hasSupport(el){ return !!(el && el.querySelector && el.querySelector('.support')); }

  /* ── 1. блок на пике: после «Итога дня», иначе ближайший пик вовлечения ── */
  var anchor = C.peak ? doc.querySelector(C.peak) : null;
  if(!anchor) anchor = pick(['#result','#excursion','#sharada','#quiz','#quiz-sec','#games','#game']);
  if(anchor && !hasSupport(anchor)){
    var wrap = anchor.querySelector('.wrap') || anchor;
    var pb = peakBlock();
    if(!doc.getElementById('support')) pb.id = 'support';   /* якорь для кнопок href="#support" */
    wrap.appendChild(pb);
  }

  /* ── 2. блок в подвале: внутри «Куда дальше», иначе перед футером ── */
  var tail = pick(['#kuda-dalshe','#kuda','.kuda-dalshe']);
  if(tail && !hasSupport(tail)){
    (tail.querySelector('.wrap') || tail).appendChild(finalBlock());
  } else if(!tail){
    var ft = doc.querySelector('footer');
    var sec = doc.createElement('section');
    sec.style.cssText = 'padding:0 18px 26px';
    sec.appendChild(finalBlock());
    if(ft) ft.parentNode.insertBefore(sec, ft); else body.appendChild(sec);
  }

  /* ── 3. кнопки внутри блоков ── */
  var sups = [].slice.call(doc.querySelectorAll('.support'));
  var sb = doc.querySelector('[data-sup-share]');
  if(sb) sb.addEventListener('click', function(){
    var self = this;
    if(navigator.share) navigator.share({title:doc.title, url:location.href}).catch(function(){});
    else if(navigator.clipboard) navigator.clipboard.writeText(location.href).then(function(){
      self.textContent = EN ? 'Link copied ✓' : 'Ссылка скопирована ✓'; });
    if(typeof window.award === 'function') window.award('share', 5);
  });
  var mb = doc.querySelector('[data-sup-more]');
  if(mb) mb.addEventListener('click', function(){
    var last = sups[sups.length-1];
    if(last) last.scrollIntoView({behavior:'smooth', block:'center'});
  });

  /* ── 4. прилипшее сердечко ── */
  var h = doc.getElementById('heart');
  if(!h){
    h = doc.createElement('div');
    h.id = 'heart'; h.title = T.heart;
    h.innerHTML = '❤<span class="lbl">' + T.heart + '</span>';
    body.appendChild(h);
  } else {
    h.title = T.heart;
    var lbl = h.querySelector('.lbl');
    if(lbl) lbl.textContent = T.heart;       /* приводим подпись к стандарту */
  }
  if(!h.dataset.supBound && C.heartBound !== true){   /* heartBound:true — сердечко уже привязано в HTML */
    h.dataset.supBound = '1';
    h.addEventListener('click', function(){
      var s = sups.filter(function(e){ return e.getBoundingClientRect().top > 60; })[0] || sups[sups.length-1];
      if(s) s.scrollIntoView({behavior:'smooth', block:'center'});
    });
    var last = window.scrollY, t = null;
    window.addEventListener('scroll', function(){
      var y = window.scrollY;
      if(y > last + 6) h.classList.add('tuck'); else if(y < last - 6) h.classList.remove('tuck');
      last = y; clearTimeout(t); t = setTimeout(function(){ h.classList.remove('tuck'); }, 700);
      h.classList.toggle('wide', sups.some(function(e){
        var r = e.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; }));
    }, {passive:true});
  }
})();
