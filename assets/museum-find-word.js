/* museum-find-word.js — M-16 «Найди деталь», текстовый вариант для музея литературы.

   Чем отличается от исходной M-16. В музее искусства «Найди деталь» — это поиск места
   на картине по координатам. Для литературы предмет другой: деталь живёт не в кадре,
   а в самой фразе. Поэтому здесь ищут не точку на картинке, а СЛОВО в подлинном отрывке.
   Следствия, ради которых это сделано отдельным движком, а не копией картиночного:
     — работает на телефоне без прицеливания пальцем в мелкую область кадра;
     — кандидаты — настоящие <button>, значит ходят по Tab и читаются скринридером;
     — текст остаётся текстом (не картинкой с надписями), это правило Сергея от 03.08.

   §6-тер (честность интерактива): промах не наказывается пустым «неверно» — у каждого
   кандидата свой честный разбор, почему именно он не держит фразу. Очки даются один раз
   за найденную деталь, повторные нажатия не начисляют. Верный ответ подсвечивается только
   после выбора, до этого подсказки в разметке нет (иначе задача решается через «Просмотр кода»).

   Подключение — внутри пустой секции:
     <section class="block" id="findWord"></section>
     ...
     <script>window.MUSEUM_FIND_WORD = {
       mount: 'findWord',                 // id контейнера, по умолчанию 'findWord'
       title: 'Какое слово держит фразу',
       lead:  'Нажми на слово, без которого фраза рассыплется.',
       source:'Н. В. Гоголь. «Шинель», 1842. Текст по ФЭБ',   // атрибуция обязательна
       points: 20,                        // очки за найденную деталь, по умолчанию 20
       parts: [                           // отрывок: строки — обычный текст,
         'И долго потом, среди самых весёлых минут, представлялся ему ',
         { pick:'низенький', why:'Рост — примета внешности; фраза без него не рассыплется.' },
         ' чиновник с ',
         { pick:'лысинкой', hit:true,
           why:'Вся жалость держится на этой уменьшительной форме: не «лысина», а «лысинка» — Гоголь делает беззащитность физически видимой.' },
         ' на лбу.'
       ],
       after: 'Гоголь берёт не событие, а деталь — и из неё вырастает вся тема маленького человека.'
     };</script>
     <script src="../../assets/museum-find-word.js"></script>

   Очки объявляются в MUSEUM_SCORE:  awards: { find: 20 }

   Верных кандидатов может быть несколько (hit:true у каждого) — тогда очки даются за
   первого найденного, остальные продолжают раскрываться без начисления.

   Если контейнера нет, конфига нет, в parts нет ни одного hit:true или секция уже
   свёрстана руками (есть .fw-box) — движок не делает ничего и страницу не трогает. */
(function () {
  'use strict';

  function init() {
    var cfg = window.MUSEUM_FIND_WORD;
    if (!cfg || !cfg.parts || !cfg.parts.length) return;

    var hasHit = cfg.parts.some(function (p) { return p && typeof p === 'object' && p.hit; });
    if (!hasHit) return;                     // задача без верного ответа — не интерактив, а текст

    var mount = document.getElementById(cfg.mount || 'findWord');
    if (!mount || mount.querySelector('.fw-box')) return;

    ensureStyles();

    var points = typeof cfg.points === 'number' ? cfg.points : 20;
    var found = false;

    var box = document.createElement('div');
    box.className = 'fw-box';

    if (cfg.title) {
      var h = document.createElement('h2');
      h.className = 'fw-title';
      h.textContent = cfg.title;
      box.appendChild(h);
    }
    if (cfg.lead) {
      var lead = document.createElement('p');
      lead.className = 'fw-lead';
      lead.textContent = cfg.lead;
      box.appendChild(lead);
    }

    var frag = document.createElement('p');
    frag.className = 'fw-frag';
    box.appendChild(frag);

    cfg.parts.forEach(function (part) {
      if (typeof part === 'string') {
        frag.appendChild(document.createTextNode(part));
        return;
      }
      if (!part || !part.pick) return;

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fw-pick';
      b.textContent = part.pick;
      b.addEventListener('click', function () { choose(b, part); });
      frag.appendChild(b);
    });

    var why = document.createElement('div');
    why.className = 'fw-why';
    why.setAttribute('aria-live', 'polite');
    box.appendChild(why);

    if (cfg.source) {
      var src = document.createElement('p');
      src.className = 'fw-src';
      src.textContent = cfg.source;
      box.appendChild(src);
    }

    mount.appendChild(box);

    function choose(btn, part) {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.classList.add(part.hit ? 'is-hit' : 'is-miss');

      why.textContent = part.why || '';
      why.classList.add('is-on');

      if (part.hit && !found) {
        found = true;
        if (typeof window.award === 'function') window.award('find', points);
        if (cfg.after) {
          var after = document.createElement('p');
          after.className = 'fw-after';
          after.textContent = cfg.after;
          box.appendChild(after);
        }
      }
    }
  }

  function ensureStyles() {
    if (document.getElementById('fw-styles')) return;
    var s = document.createElement('style');
    s.id = 'fw-styles';
    s.textContent = [
      '.fw-box{margin-top:18px}',
      '.fw-title{margin:0 0 6px}',
      '.fw-lead{color:var(--muted,#a89a80);margin:0 0 14px;max-width:62ch}',
      '.fw-frag{font-size:19px;line-height:1.9;max-width:62ch;margin:0}',
      '.fw-pick{font:inherit;color:inherit;cursor:pointer;padding:2px 6px;margin:0 1px;',
      'border-radius:6px;border:1px dashed var(--acc-soft,rgba(201,168,76,.45));background:transparent}',
      '.fw-pick:hover:not(:disabled){border-style:solid;border-color:var(--acc,#c9a84c)}',
      '.fw-pick:focus-visible{outline:2px solid var(--acc,#c9a84c);outline-offset:2px}',
      '.fw-pick:disabled{cursor:default}',
      '.fw-pick.is-hit{border:1px solid #4f9d69;background:rgba(79,157,105,.18);font-weight:600}',
      '.fw-pick.is-miss{border:1px solid rgba(180,91,76,.6);background:rgba(180,91,76,.10);opacity:.8}',
      '.fw-why{margin-top:16px;display:none;line-height:1.55;max-width:62ch;color:var(--muted,#a89a80)}',
      '.fw-why.is-on{display:block}',
      '.fw-after{margin-top:12px;max-width:62ch;line-height:1.55;color:var(--gold-l,#e0c470);font-weight:600}',
      '.fw-src{margin-top:14px;font-size:13px;color:var(--muted,#a89a80);opacity:.85}'
    ].join('');
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
