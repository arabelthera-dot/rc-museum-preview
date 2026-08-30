/* scrolltelling.js — скроллтеллинг M-73 (музей «Русские не сдаются»).
 * Закреплённая картина меняет сцену и подпись по мере прокрутки шагов `.st-step`.
 * Повторяющийся блок: подключается на каждой странице дня, разметка — в HTML,
 * логика и стили — общие. Движок не пишется заново на страницу.
 */
(function () {
  function init() {
    var root = document.querySelector('.scrolltelling');
    if (!root) return;
    var steps = root.querySelectorAll('.st-step');
    var scenes = root.querySelectorAll('.st-scene');
    var caps = root.querySelectorAll('.st-cap-layer');
    if (!steps.length) return;

    function activate(idx) {
      var i;
      for (i = 0; i < scenes.length; i++) {
        scenes[i].classList.toggle('active', i === idx);
        scenes[i].setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      }
      for (i = 0; i < caps.length; i++) {
        caps[i].classList.toggle('active', i === idx);
        caps[i].setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      }
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) activate(Number(e.target.dataset.idx));
        });
      }, { threshold: 0.5, rootMargin: '-10% 0px -40% 0px' });
      steps.forEach(function (s) { io.observe(s); });
    }
    /* фолбэк без IO: первая сцена уже активна в разметке, дальше статично. */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
