/* museum-paper-theatre.js — SK-N3 «Бумажный театр» (согласовано Сергеем 08.09.2026,
   в реестре помечено «сказки; далее театр и литература»).

   Что делает посетитель: расставляет фигуры по трём кадрам эпизода — кто где находится
   в начале, в середине и в конце, — а потом сравнивает свою расстановку с тем, как это
   рассказано в подлинном тексте. Открытие: сюжет держится не на событиях, а на том,
   кто к кому приближается и кто от кого уходит.

   Чего этот движок НАМЕРЕННО не делает (граница из чеклиста, утверждённого Сергеем 15.09):
   это не рисовалка со свободным холстом. Фигуры готовые, мест на сцене конечное число —
   иначе это недели работы и чужие права на изображения. Посетитель выбирает расстановку,
   а не рисует.

   §6-тер: очки даются за пройденный до конца эпизод (все кадры расставлены), а не за
   «правильность» — верной расстановки не существует, есть авторская. Повторная сборка
   заново не начисляет. Пустых кадров быть не может: движок не запускается, если кадров
   меньше двух или в кадре нет ни одной фигуры.

   Подключение — внутри пустой секции:
     <section class="block" id="paperTheatre"></section>
     ...
     <script>window.MUSEUM_PAPER_THEATRE = {
       mount: 'paperTheatre',              // id контейнера, по умолчанию 'paperTheatre'
       title: 'Собери сцену сказа',
       lead:  'Поставь героев так, как, по-твоему, шёл эпизод.',
       source:'П. П. Бажов. «Медной горы Хозяйка», 1936. Текст по ФЭБ',
       points: 30,                         // очки за пройденный эпизод, по умолчанию 30
       figures: ['Степан', 'Хозяйка', 'Приказчик'],       // имена фигур (текстом, не картинкой)
       frames: [
         { title:'Кадр 1. Встреча',
           slots:['у забоя','поодаль'],
           asText:'В сказе Степан стоит у забоя один, Хозяйка появляется поодаль и смотрит.' },
         { title:'Кадр 2. Испытание',
           slots:['рядом','позади'],
           asText:'Хозяйка подходит вплотную: испытание в том, что отказать ей нужно в лицо.' },
         { title:'Кадр 3. Цена',
           slots:['уходит','остаётся'],
           asText:'Степан уходит живым, но с этого дня несвободен — цена сказана не словом, а местом.' }
       ],
       after:'Бажов ведёт сказ расстановкой: кто приблизился, тот и решает судьбу.'
     };</script>
     <script src="../../assets/museum-paper-theatre.js"></script>

   Очки объявляются в MUSEUM_SCORE:  awards: { theatre: 30 }

   Доступность: каждая фигура в кадре — <select> с подписью (Tab, стрелки, скринридер),
   а не перетаскивание мышью: drag-and-drop на телефоне и с клавиатуры недоступен.
   Ширина экрана на логику не влияет (§6-тер).

   Если контейнера нет, конфига нет, кадров меньше двух, нет фигур или секция свёрстана
   руками (есть .pt-box) — движок не делает ничего. */
(function () {
  'use strict';

  function init() {
    var cfg = window.MUSEUM_PAPER_THEATRE;
    if (!cfg || !cfg.frames || cfg.frames.length < 2) return;
    if (!cfg.figures || !cfg.figures.length) return;

    var mount = document.getElementById(cfg.mount || 'paperTheatre');
    if (!mount || mount.querySelector('.pt-box')) return;

    ensureStyles();

    var points = typeof cfg.points === 'number' ? cfg.points : 30;
    var scored = false;
    var placed = cfg.frames.map(function () { return {}; });

    var box = document.createElement('div');
    box.className = 'pt-box';

    if (cfg.title) {
      var h = document.createElement('h2');
      h.className = 'pt-title';
      h.textContent = cfg.title;
      box.appendChild(h);
    }
    if (cfg.lead) {
      var lead = document.createElement('p');
      lead.className = 'pt-lead';
      lead.textContent = cfg.lead;
      box.appendChild(lead);
    }

    cfg.frames.forEach(function (frame, fi) {
      if (!frame.slots || !frame.slots.length) return;

      var card = document.createElement('div');
      card.className = 'pt-frame';

      var ft = document.createElement('h3');
      ft.className = 'pt-frame-title';
      ft.textContent = frame.title || ('Кадр ' + (fi + 1));
      card.appendChild(ft);

      var rows = document.createElement('div');
      rows.className = 'pt-rows';
      card.appendChild(rows);

      cfg.figures.forEach(function (fig, gi) {
        var row = document.createElement('label');
        row.className = 'pt-row';

        var name = document.createElement('span');
        name.className = 'pt-fig';
        name.textContent = fig;
        row.appendChild(name);

        var sel = document.createElement('select');
        sel.className = 'pt-slot';

        var empty = document.createElement('option');
        empty.value = '';
        empty.textContent = '— где он —';
        sel.appendChild(empty);

        frame.slots.forEach(function (slot) {
          var o = document.createElement('option');
          o.value = slot;
          o.textContent = slot;
          sel.appendChild(o);
        });

        sel.addEventListener('change', function () {
          placed[fi][gi] = sel.value;
          check();
        });

        row.appendChild(sel);
        rows.appendChild(row);
      });

      var reveal = document.createElement('div');
      reveal.className = 'pt-as-text';
      reveal.setAttribute('aria-live', 'polite');
      card.appendChild(reveal);
      card._reveal = reveal;
      card._asText = frame.asText || '';

      box.appendChild(card);
    });

    var out = document.createElement('div');
    out.className = 'pt-out';
    out.setAttribute('aria-live', 'polite');
    box.appendChild(out);

    if (cfg.source) {
      var src = document.createElement('p');
      src.className = 'pt-src';
      src.textContent = cfg.source;
      box.appendChild(src);
    }

    mount.appendChild(box);

    function frameFilled(fi) {
      var f = placed[fi];
      var n = 0;
      for (var k in f) if (f[k]) n++;
      return n === cfg.figures.length;
    }

    function check() {
      var cards = box.querySelectorAll('.pt-frame');
      var all = true;

      Array.prototype.forEach.call(cards, function (card, fi) {
        if (frameFilled(fi)) {
          if (card._reveal && !card._reveal.classList.contains('is-on')) {
            card._reveal.textContent = card._asText;   // как рассказано в подлиннике
            card._reveal.classList.add('is-on');
          }
        } else {
          all = false;
        }
      });

      if (all && !scored) {
        scored = true;
        if (typeof window.award === 'function') window.award('theatre', points);
        if (cfg.after) {
          out.textContent = cfg.after;
          out.classList.add('is-on');
        }
      }
    }
  }

  function ensureStyles() {
    if (document.getElementById('pt-styles')) return;
    var s = document.createElement('style');
    s.id = 'pt-styles';
    s.textContent = [
      '.pt-box{margin-top:18px}',
      '.pt-title{margin:0 0 6px}',
      '.pt-lead{color:var(--muted,#a89a80);margin:0 0 14px;max-width:62ch}',
      '.pt-frame{border:1px solid var(--acc-soft,rgba(201,168,76,.16));border-radius:14px;',
      'padding:16px;margin-bottom:12px}',
      '.pt-frame-title{margin:0 0 10px;font-size:16px}',
      '.pt-rows{display:grid;gap:10px}',
      '.pt-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}',
      '.pt-fig{min-width:9ch;font-weight:600}',
      '.pt-slot{font:inherit;color:inherit;background:transparent;padding:8px 10px;border-radius:8px;',
      'border:1px solid var(--acc-soft,rgba(201,168,76,.16));flex:1 1 12ch}',
      '.pt-slot:focus-visible{outline:2px solid var(--acc,#c9a84c);outline-offset:2px}',
      '.pt-as-text{margin-top:12px;display:none;line-height:1.55;color:var(--muted,#a89a80)}',
      '.pt-as-text.is-on{display:block}',
      '.pt-out{margin-top:8px;display:none;line-height:1.55;max-width:62ch;',
      'color:var(--gold-l,#e0c470);font-weight:600}',
      '.pt-out.is-on{display:block}',
      '.pt-src{margin-top:12px;font-size:13px;color:var(--muted,#a89a80);opacity:.85}'
    ].join('');
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
