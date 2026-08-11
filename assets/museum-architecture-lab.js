(function () {
  'use strict';

  function init(root) {
    var choices = { base: '', transition: '', crown: '', site: '' };
    var correct = { base: 'gallery', transition: 'kokoshnik', crown: 'tent', site: 'bank' };
    var labels = {
      gallery: 'высокий подклет и круговая галерея', cube: 'простой четверик', low: 'низкое основание',
      kokoshnik: 'ступени, кокошники и восьмерик', direct: 'резкий переход', drum: 'круглый барабан',
      tent: 'каменный шатёр', dome: 'купол', spire: 'европейский шпиль',
      bank: 'высокий берег', square: 'ровная площадь', hollow: 'низина'
    };
    var feedback = root.querySelector('[data-lab-feedback]');
    var progress = root.querySelector('[data-lab-progress]');
    var reveal = root.querySelector('[data-lab-reveal]');
    var beam = root.querySelector('[data-eye-path]');
    var model = root.querySelector('[data-lab-model]');
    var groups = [].slice.call(root.querySelectorAll('[data-lab-group]'));

    function selectedCount() {
      return Object.keys(choices).filter(function (key) { return choices[key]; }).length;
    }

    function updateModel(key, value) {
      model.setAttribute('data-' + key, value);
      [].slice.call(model.querySelectorAll('[data-variant-' + key + ']')).forEach(function (node) {
        node.hidden = node.getAttribute('data-variant-' + key) !== value;
      });
      model.classList.remove('is-changing');
      void model.getBoundingClientRect();
      model.classList.add('is-changing');
      model.setAttribute('aria-label', 'Учебная модель. Выбрано решений: ' + selectedCount() + ' из 4. Последнее изменение: ' + labels[value] + '.');
    }

    function explain(key, value) {
      var messages = {
        base: {
          gallery: 'Совпадает с устройством Коломенского: галерея и высокий подклет начинают движение ещё у земли.',
          cube: 'Четверик даёт ясную массу, но взгляд начинает подниматься слишком поздно.',
          low: 'Низкое основание лишает здание зрительного разбега.'
        },
        transition: {
          kokoshnik: 'Кокошники и восьмерик превращают сужение в последовательность, а не в скачок.',
          direct: 'Без переходных ярусов шатёр выглядит поставленным сверху отдельной крышей.',
          drum: 'Барабан естественно готовит купол, но ослабляет шатровую непрерывность.'
        },
        crown: {
          tent: 'Шатёр продолжает грани нижних объёмов почти до самой главы.',
          dome: 'Купол собирает движение вокруг центра — это другой пространственный жест.',
          spire: 'Шпиль тоже ведёт вверх, но остаётся башенным завершением, а не русским каменным шатром.'
        },
        site: {
          bank: 'Высокий берег становится первым невидимым ярусом композиции.',
          square: 'На площади храм сохраняет силуэт, но теряет усиление естественным рельефом.',
          hollow: 'Низина спорит с замыслом: окружающая земля гасит вертикаль.'
        }
      };
      return messages[key][value];
    }

    function render() {
      var count = selectedCount();
      progress.value = count;
      progress.setAttribute('aria-valuetext', count + ' из 4 решений');
      groups.forEach(function (group) {
        var key = group.getAttribute('data-lab-group');
        [].slice.call(group.querySelectorAll('button')).forEach(function (button) {
          var active = choices[key] === button.getAttribute('data-value');
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      });
      if (count < 4) {
        reveal.hidden = true;
        beam.classList.remove('is-on');
        return;
      }
      var score = Object.keys(correct).filter(function (key) { return choices[key] === correct[key]; }).length;
      reveal.hidden = false;
      if (score === 4) {
        root.classList.add('is-solved');
        beam.classList.add('is-on');
        reveal.innerHTML = '<span>Твой результат · Архитектор вертикали</span><strong>Ты построил не крышу, а маршрут взгляда.</strong><p>Берег, галерея, сужающиеся переходы и шатёр сложились в одну вертикаль. Поэтому 62-метровый храм кажется ещё выше — хотя внутри это камерная домовая церковь.</p><button class="share-result" type="button" data-lab-share>Поделиться открытием</button>';
        feedback.textContent = 'Все четыре решения работают вместе. Запусти взгляд от берега к кресту.';
      } else {
        root.classList.remove('is-solved');
        beam.classList.remove('is-on');
        reveal.innerHTML = '<span>Почти получилось</span><strong>Совпало решений: ' + score + ' из 4.</strong><p>Меняй варианты и наблюдай не за отдельной крышей, а за непрерывностью всего силуэта снизу вверх.</p>';
      }
    }

    groups.forEach(function (group) {
      group.addEventListener('click', function (event) {
        var button = event.target.closest('button[data-value]');
        if (!button) return;
        var key = group.getAttribute('data-lab-group');
        var value = button.getAttribute('data-value');
        choices[key] = value;
        updateModel(key, value);
        feedback.textContent = explain(key, value);
        render();
      });
    });

    [].slice.call(document.querySelectorAll('[data-hero-crown]')).forEach(function (button) {
      button.addEventListener('click', function () {
        choices.crown = button.getAttribute('data-hero-crown');
        updateModel('crown', choices.crown);
        feedback.textContent = explain('crown', choices.crown) + ' Теперь выбери ещё три решения.';
        render();
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    root.addEventListener('click', function (event) {
      if (!event.target.closest('[data-lab-share]')) return;
      var share = { title: document.title, text: 'Я раскрыл секрет Коломенского: 62 метра нужны не для большого зала, а для движения взгляда от берега к кресту.', url: location.href };
      if (navigator.share) {
        navigator.share(share).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(share.text + ' ' + share.url).then(function () { feedback.textContent = 'Открытие и ссылка скопированы.'; });
      } else {
        feedback.textContent = 'Скопируй адрес страницы из строки браузера и поделись открытием.';
      }
    });

    var reset = root.querySelector('[data-lab-reset]');
    if (reset) reset.addEventListener('click', function () {
      choices = { base: '', transition: '', crown: '', site: '' };
      model.removeAttribute('data-base');
      model.removeAttribute('data-transition');
      model.removeAttribute('data-crown');
      model.removeAttribute('data-site');
      [].slice.call(model.querySelectorAll('[data-variant-base],[data-variant-transition],[data-variant-crown],[data-variant-site]')).forEach(function (node) { node.hidden = true; });
      root.classList.remove('is-solved');
      feedback.textContent = 'Начни с основания. Модель будет меняться после каждого решения.';
      reveal.hidden = true;
      beam.classList.remove('is-on');
      render();
    });

    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    [].slice.call(document.querySelectorAll('[data-architecture-lab]')).forEach(init);
    [].slice.call(document.querySelectorAll('[data-compare-tool]')).forEach(function (tool) {
      var stage = tool.querySelector('[data-compare-stage]');
      var text = tool.querySelector('[data-compare-text]');
      var messages = {
        dome: 'Во флорентийском куполе движение собирается вокруг большого свода и его вершины.',
        spire: 'У готического собора острота сосредоточена в башнях и их верхнем завершении.',
        tent: 'В Коломенском подъём начинается внизу: рельеф и основание включены в общую вертикаль.',
        all: 'При наложении видно: похожая устремлённость вверх возникает разными архитектурными средствами.'
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
        [].slice.call(document.querySelectorAll('.teaser details[open]')).forEach(function (other) {
          if (other !== details) other.open = false;
        });
      });
    });
  });
}());
