/* «Русская цивилизация» — единая аналитика.
 * Один файл на все страницы. Чтобы включить сбор — вписать номер счётчика в COUNTER_ID.
 * Пока COUNTER_ID пустой, скрипт не грузит ничего и не шлёт ни одного запроса,
 * но цели уже расставлены: в день включения статистика начинает копиться сразу.
 *
 * Цели (rc_* — имена, по ним в Метрике строятся отчёты):
 *   rc_scroll75   — дочитал 75% страницы
 *   rc_read60     — провёл на странице минуту (реальное чтение, а не отскок)
 *   rc_support    — клик по блоку/кнопке «Поддержать проект»
 *   rc_share      — клик «Поделиться»
 *   rc_telegram   — переход в Telegram-канал
 *   rc_game       — старт игры или викторины
 *   rc_audio      — запуск аудиогида
 *   rc_video      — запуск видео (ролик дня)
 *   rc_calendar   — клик по дате в календаре музея
 */
(function () {
  'use strict';

  var COUNTER_ID = ''; // ← сюда номер счётчика Яндекс.Метрики (только цифры)

  window.rcGoal = function (name, params) {
    try {
      if (COUNTER_ID && window['ym']) window['ym'](COUNTER_ID, 'reachGoal', name, params || {});
      if (window.rcGoalDebug) console.log('[rc-goal]', name, params || {});
    } catch (e) { /* аналитика никогда не ломает страницу */ }
  };

  if (COUNTER_ID) {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < e.scripts.length; j++) { if (e.scripts[j].src === r) return; }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(COUNTER_ID, 'init', {
      defer: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    });
  }

  // ——— автоматические цели, без правки самих страниц ———
  var fired = {};
  function once(name, params) { if (fired[name]) return; fired[name] = 1; window.rcGoal(name, params); }

  // доскролл 75%
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0 && (window.scrollY / h) >= 0.75) once('rc_scroll75');
    });
  }, { passive: true });

  // минута на странице — отсекает случайный заход от настоящего чтения
  setTimeout(function () { once('rc_read60'); }, 60000);

  // запуск видео и аудио: слушаем на фазе перехвата, ловит и плееры, вставленные позже
  document.addEventListener('play', function (ev) {
    var t = ev.target;
    if (!t || !t.tagName) return;
    var src = (t.currentSrc || t.getAttribute('src') || '').split('/').pop();
    if (t.tagName === 'VIDEO') once('rc_video', { file: src });
    if (t.tagName === 'AUDIO') once('rc_audio', { file: src });
  }, true);

  // клики: поддержка, «поделиться», телеграм, игры
  document.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('a,button,[role="button"]') : null;
    if (!el) return;
    var txt = (el.textContent || '').toLowerCase();
    var href = (el.getAttribute('href') || '').toLowerCase();
    var cls = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '') + '';

    if (/t\.me\//.test(href)) return window.rcGoal('rc_telegram', { href: href });
    if (/(^|\/)(day|exp|pic)-[^\/]+\.html/.test(href))
      return window.rcGoal('rc_calendar', { day: href.split('/').pop().replace('.html', '') });
    if (/поддержать|донат|support/.test(txt) || /support/.test(cls) || /#support/.test(href))
      return window.rcGoal('rc_support', { where: cls || txt.slice(0, 40) });
    if (/поделиться|share/.test(txt) || /share/.test(cls))
      return window.rcGoal('rc_share');
    if (/играть|начать игру|викторин|пройти тест|проверить себя/.test(txt))
      return window.rcGoal('rc_game', { label: txt.slice(0, 40) });
  }, true);
})();
