(function () {
  'use strict';

  function init(root) {
    var order = ['base', 'transition', 'crown', 'site'];
    var current = 0;
    var choices = { base: '', transition: '', crown: '', site: '' };
    var correct = { base: 'gallery', transition: 'kokoshnik', crown: 'tent', site: 'bank' };
    var names = {
      gallery: 'широкая галерея и высокий подклет', cube: 'ровный тяжёлый куб', low: 'низкое основание',
      kokoshnik: 'ступени, кокошники и восьмерик', direct: 'резкий скачок к крыше', drum: 'круглый барабан',
      tent: 'каменный шатёр', dome: 'купол', spire: 'острый шпиль',
      bank: 'высокий берег', square: 'ровная площадь', hollow: 'низина'
    };
    var reactions = {
      base: {
        gallery: 'Есть! Галерея дала храму разбег — будто он готовится к прыжку.',
        cube: 'Получился крепкий дом, но он не взлетает. Попробуй дать ему больше разбега.',
        low: 'Храм присел к земле. Для взлёта нужно другое основание.'
      },
      transition: {
        kokoshnik: 'Вот оно! Ступени мягко превращают тяжёлый квадрат в узкую вершину.',
        direct: 'Верх будто поставили на коробку. Части пока не стали одним целым.',
        drum: 'Круглый барабан готовит купол. Но движение к шатру здесь останавливается.'
      },
      crown: {
        tent: 'Шатёр не накрывает храм — он продолжает его вверх.',
        dome: 'Красиво, но взгляд остановился на округлой вершине. Нам нужен новый рывок вверх.',
        spire: 'Вверх устремился только острый наконечник. Сможешь поднять весь храм?'
      },
      site: {
        bank: 'Берег добавил высоту, хотя архитектор не положил ни одного камня.',
        square: 'На площади храм заметен, но земля больше не помогает ему взлететь.',
        hollow: 'Склоны спрятали основание. Храм потерял часть своей высоты ещё до первого камня.'
      }
    };
    var feedback = root.querySelector('[data-lab-feedback]');
    var progress = root.querySelector('[data-lab-progress]');
    var reveal = root.querySelector('[data-lab-reveal]');
    var beam = root.querySelector('[data-eye-path]');
    var model = root.querySelector('[data-lab-model]');
    var groups = [].slice.call(root.querySelectorAll('[data-lab-group]'));
    var decisions = [].slice.call(root.querySelectorAll('.decision'));
    var next = root.querySelector('[data-lab-next]');
    var stateText = root.querySelector('[data-lab-state]');

    function updateModel(key, value) {
      model.setAttribute('data-' + key, value);
      [].slice.call(model.querySelectorAll('[data-variant-' + key + ']')).forEach(function (node) {
        node.hidden = node.getAttribute('data-variant-' + key) !== value;
      });
      model.classList.remove('is-changing');
      void model.getBoundingClientRect();
      model.classList.add('is-changing');
      model.setAttribute('aria-label', 'Учебная модель. Найдено секретов: ' + current + ' из 4. Последнее изменение: ' + names[value] + '.');
      if (stateText) stateText.textContent = 'Состояние модели: ' + names[value] + '. Найдено верных решений: ' + current + ' из 4.';
    }

    function showStep(index) {
      decisions.forEach(function (decision, i) {
        decision.classList.toggle('is-current', i === index);
        decision.hidden = i !== index;
      });
      next.hidden = true;
      if (index < order.length) {
        feedback.textContent = 'Ход ' + (index + 1) + ' из 4. Выбирай и смотри, что произойдёт с храмом.';
      }
    }

    function finish() {
      root.classList.add('is-solved');
      beam.classList.add('is-on');
      reveal.hidden = false;
      reveal.innerHTML = '<span>Твой результат · Архитектор вертикали</span><strong>Ты заставил камень взлететь.</strong><p>Берег, галерея, каменные ступени и шатёр превратили семейный храм в 62-метровый знак, который было видно издалека.</p><div><button class="share-result" type="button" data-lab-compare>Сравнить схему и храм</button> <button class="share-result secondary" type="button" data-lab-share>Поделиться открытием</button></div>';
      if (root.dataset.finishHref) reveal.insertAdjacentHTML('beforeend', '<p><a class="primary" href="' + root.dataset.finishHref + '">Шаг 3 из 3 · Увидеть вывод →</a></p>');
      feedback.textContent = 'Готово! Свет проходит по всему храму — от высокого берега до креста.';
      model.setAttribute('aria-label', 'Храм собран. Четыре найденных секрета создают одно движение от берега до креста.');
      if (stateText) stateText.textContent = 'Модель завершена: высокий берег, широкая галерея, сужающиеся ярусы и гранёный шатёр соединены в одно движение к кресту.';
    }

    groups.forEach(function (group) {
      group.addEventListener('click', function (event) {
        var button = event.target.closest('button[data-value]');
        if (!button || button.disabled) return;
        var key = group.getAttribute('data-lab-group');
        if (key !== order[current]) return;
        var value = button.getAttribute('data-value');
        choices[key] = value;
        updateModel(key, value);
        [].slice.call(group.querySelectorAll('button')).forEach(function (item) {
          var active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        feedback.textContent = reactions[key][value];
        if (value === correct[key]) {
          [].slice.call(group.querySelectorAll('button')).forEach(function (item) { item.disabled = true; });
          current += 1;
          progress.value = current;
          progress.setAttribute('aria-valuetext', current + ' из 4 секретов найдено');
          if (current === order.length) finish();
          else next.hidden = false;
        } else {
          root.classList.remove('is-shake');
          void root.getBoundingClientRect();
          root.classList.add('is-shake');
          feedback.textContent += ' Этот ход сохранён на модели: сравни силуэт, затем осознанно выбери другой вариант.';
        }
      });
    });

    next.addEventListener('click', function () { showStep(current); });

    [].slice.call(document.querySelectorAll('[data-hero-crown]')).forEach(function (button) {
      button.addEventListener('click', function () {
        root.dataset.firstCrown = button.getAttribute('data-hero-crown');
        feedback.textContent = 'Запомнили твой выбор. На третьем ходу проверим, заставит ли он весь храм взлететь.';
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    root.addEventListener('click', function (event) {
      if (event.target.closest('[data-lab-compare]')) {
        root.classList.toggle('show-model');
        event.target.textContent = root.classList.contains('show-model') ? 'Показать настоящий храм' : 'Показать мою схему';
      }
      if (!event.target.closest('[data-lab-share]')) return;
      var share = { title: document.title, text: 'Я заставил камень взлететь и раскрыл секрет Коломенского.', url: location.href };
      if (navigator.share) navigator.share(share).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(share.text + ' ' + share.url).then(function () { feedback.textContent = 'Открытие и ссылка скопированы.'; });
      else feedback.textContent = 'Скопируй адрес страницы из строки браузера и поделись открытием.';
    });

    var reset = root.querySelector('[data-lab-reset]');
    reset.addEventListener('click', function () {
      current = 0;
      choices = { base: '', transition: '', crown: '', site: '' };
      order.forEach(function (key) { model.removeAttribute('data-' + key); });
      [].slice.call(model.querySelectorAll('[data-variant-base],[data-variant-transition],[data-variant-crown],[data-variant-site]')).forEach(function (node) { node.hidden = true; });
      groups.forEach(function (group) { [].slice.call(group.querySelectorAll('button')).forEach(function (button) { button.disabled = false; button.classList.remove('is-active'); button.setAttribute('aria-pressed', 'false'); }); });
      root.classList.remove('is-solved', 'show-model', 'is-shake');
      beam.classList.remove('is-on');
      progress.value = 0;
      reveal.hidden = true;
      if (stateText) stateText.textContent = 'Состояние модели: выбор ещё не сделан.';
      showStep(0);
    });

    showStep(0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    [].slice.call(document.querySelectorAll('[data-architecture-lab]')).forEach(init);
    [].slice.call(document.querySelectorAll('[data-compare-tool]')).forEach(function (tool) {
      var stage = tool.querySelector('[data-compare-stage]');
      var text = tool.querySelector('[data-compare-text]');
      var messages = {
        dome: 'Флоренция: огромный купол собирает всё движение вокруг своей вершины.',
        spire: 'Кёльн: две острые башни взмывают вверх, словно каменные иглы.',
        tent: 'Коломенское: взлёт начинается ещё на склоне и проходит через всё здание.',
        all: 'Теперь видно: похожее стремление вверх рождается тремя совершенно разными способами.'
      };
      tool.addEventListener('click', function (event) {
        var button = event.target.closest('button[data-mode]');
        if (!button) return;
        var mode = button.getAttribute('data-mode');
        stage.setAttribute('data-mode', mode);
        text.textContent = messages[mode];
        [].slice.call(tool.querySelectorAll('button[data-mode]')).forEach(function (item) {
          var active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      });
    });
    [].slice.call(document.querySelectorAll('.teaser details')).forEach(function (details) {
      details.addEventListener('toggle', function () {
        if (!details.open || window.innerWidth > 820) return;
        [].slice.call(document.querySelectorAll('.teaser details[open]')).forEach(function (other) { if (other !== details) other.open = false; });
      });
    });
  });
}());
