/* Общий движок последовательной сборки смысловых слоёв.
 * Разметка и содержание принадлежат выпуску; движок управляет только состоянием,
 * клавиатурой, обратной связью, сбросом и аналитическим событием. */
(function () {
  'use strict';

  function init(root) {
    var steps = Array.prototype.slice.call(root.querySelectorAll('[data-stack-step]'));
    var layers = Array.prototype.slice.call(root.querySelectorAll('[data-stack-layer]'));
    var status = root.querySelector('[data-stack-status]');
    var progress = root.querySelector('[data-stack-progress]');
    var reset = root.querySelector('[data-stack-reset]');
    var result = root.querySelector('[data-stack-result]');
    var current = 0;

    if (!steps.length || steps.length !== layers.length || !status || !progress) return;

    function announce(text) {
      status.textContent = text;
    }

    function paint() {
      steps.forEach(function (button, index) {
        var placed = index < current;
        var next = index === current;
        button.classList.toggle('is-placed', placed);
        button.classList.toggle('is-next', next);
        button.disabled = placed;
        button.setAttribute('aria-pressed', placed ? 'true' : 'false');
      });
      layers.forEach(function (layer, index) {
        layer.classList.toggle('is-placed', index < current);
      });
      progress.style.setProperty('--stack-progress', (current / steps.length * 100) + '%');
      if ('value' in progress) progress.value = current;
      if ('max' in progress) progress.max = steps.length;
      progress.setAttribute('aria-valuenow', String(current));
      progress.setAttribute('aria-valuemax', String(steps.length));
      root.classList.toggle('is-complete', current === steps.length);
      if (result) result.hidden = current !== steps.length;
    }

    function choose(button) {
      var index = Number(button.getAttribute('data-stack-step'));
      if (index === current) {
        current += 1;
        var detail = button.getAttribute('data-stack-detail') || button.textContent.trim();
        if (current === steps.length) {
          announce('Храм собран. ' + (root.getAttribute('data-complete-message') || 'Все объёмы образовали единую вертикаль.'));
          if (typeof window.rcTrack === 'function') window.rcTrack('interactive_complete', { interactive: root.id || 'stack-builder' });
          if (result) result.focus({ preventScroll: true });
        } else {
          announce('Верно: ' + detail + ' Теперь найди следующий опирающийся на него объём.');
          steps[current].focus({ preventScroll: true });
        }
      } else if (index > current) {
        announce('Этот объём находится выше. Сначала найди его опору — шаг ' + (current + 1) + '.');
        root.classList.remove('is-shake');
        void root.offsetWidth;
        root.classList.add('is-shake');
      }
      paint();
    }

    steps.forEach(function (button) {
      button.addEventListener('click', function () { choose(button); });
    });

    if (reset) {
      reset.addEventListener('click', function () {
        current = 0;
        announce('Сборка сброшена. Начни с основания, на которое опирается весь храм.');
        paint();
        steps[0].focus({ preventScroll: true });
      });
    }

    paint();
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-stack-builder]'), init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
