/* Единая верхняя полоса (Сергей 17.10): прокрутка вниз — прячется, вверх — появляется.
   Липкие элементы страницы с верхом у края (шапка, #secnav museum-chrome.js, .daynav, прогресс расследования)
   сдвигаются на высоту видимой полосы через --rc-bar-vis, чтобы полоса их не перекрывала. Без зависимостей. */
(function(){
  var bar = document.querySelector('nav.rc-sitebar');
  if(!bar) return;
  var root = document.documentElement, H = bar.offsetHeight || 52, last = window.pageYOffset || 0, hidden = false;
  function set(h){
    if(h === hidden) return;
    hidden = h;
    bar.classList[h ? 'add' : 'remove']('rc-sb-hidden');
    root.style.setProperty('--rc-bar-vis', h ? '0px' : H + 'px');
  }
  root.style.setProperty('--rc-bar-vis', H + 'px');
  window.addEventListener('scroll', function(){
    var y = window.pageYOffset || 0;
    if(y <= H) set(false);
    else if(y > last + 4) set(true);
    else if(y < last - 4) set(false);
    last = y;
  }, { passive: true });
  /* после load: museum-chrome.js уже расставил свои липкие панели и их top */
  function shift(){
    var all = document.body.querySelectorAll('*');
    for(var i = 0; i < all.length; i++){
      var e = all[i];
      if(e === bar || bar.contains(e)) continue;
      var cs = getComputedStyle(e);
      if(cs.position !== 'sticky' && cs.position !== 'fixed') continue;
      if(cs.top === 'auto') continue;
      var t = parseFloat(cs.top);
      if(isNaN(t)) continue;
      if(cs.position === 'fixed' && (t >= H) || cs.position === 'fixed' && (cs.bottom !== 'auto' && parseFloat(cs.bottom) < H || e.offsetHeight > 200)) continue;
      e.style.setProperty('top', 'calc(' + t + 'px + var(--rc-bar-vis, 0px))', 'important');
    }
  }
  if(document.readyState === 'complete') shift(); else window.addEventListener('load', shift);

  /* п.4 — «Поделиться» один раз (замер 17.10): первый блок остаётся, повторы прячутся */
  function oneShare(){
    var seen = null, list = document.querySelectorAll('.sharerow, .wrap.share, div.share, #sharefinal');
    for(var i = 0; i < list.length; i++){
      var e = list[i];
      if(bar.contains(e) || e.offsetParent === null) continue;
      if(seen && !seen.contains(e) && !e.contains(seen)) e.style.setProperty('display', 'none', 'important');
      else if(!seen) seen = e;
    }
    return seen;
  }
  /* п.6 — подписка в Telegram на полной странице дня, под строкой «Поделиться» (или в конце статьи).
     Шаблонные страницы получают её из Base.astro — тогда .rc-sub уже есть и здесь ничего не делается.
     Разметка должна совпадать с src/lib/sitebar.mjs podpiskaHtml. */
  function subscribe(after){
    if(!bar.querySelector('.rc-sb-here') || document.querySelector('.rc-sub')) return;
    var box = document.createElement('div');
    box.className = 'rc-sub';
    box.innerHTML = '<a href="https://t.me/russian_civilization_ru" target="_blank" rel="noopener">'
      + '<span aria-hidden="true">✈</span>Подписаться в Telegram</a>';
    var foot = document.querySelector('footer');
    if(after && after.parentNode) after.parentNode.insertBefore(box, after.nextSibling);
    else if(foot && foot.parentNode) foot.parentNode.insertBefore(box, foot);
    else document.body.appendChild(box);
  }
  function tidy(){ subscribe(oneShare()); }
  if(document.readyState === 'complete') tidy(); else window.addEventListener('load', tidy);
})();
