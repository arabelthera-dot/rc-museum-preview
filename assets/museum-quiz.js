/* museum-quiz.js — M-23 «Вопрос с разбором» (общий движок викторины музеев).

   Зачем движок (п.10 museum-core, «повторяющееся — в движок, а не копией в каждый HTML»).
   До него викторина жила inline в теле каждой страницы: свой массив вопросов, свой
   renderQ(), свой answerQ(), своя разметка кнопок и своя раздача очков через award('q0',10).
   Это 31 копия одного поведения на январь одного музея — и 31 правка при каждом уточнении
   вкуса. Здесь ровно то же поведение, но одним файлом: страница объявляет только вопросы.

   Чем отличается от museum-fact-or-myth.js (M-97). Там верного ответа НЕТ намеренно:
   посетитель решает, документ перед ним или легенда, и получает разбор без «верно/неверно».
   Здесь верный ответ ЕСТЬ и за него даются очки — это проверка знания, а не проверка
   достоверности источника. Два разных вопроса к посетителю, поэтому два движка.

   §6-тер (честность интерактива): каждый дистрактор обязан быть неверным по русскому
   источнику, а не «неожиданным». Движок это проверить не может — это редакторская
   ответственность автора страницы; движок отвечает за то, что очки начислены ровно один
   раз за вопрос и что сумма наград совпадает с объявленным реестром.

   Подключение — внутри пустой секции:
     <section class="block" id="quiz"></section>
     ...
     <script>window.MUSEUM_QUIZ = {
       mount: 'quiz',                    // id контейнера, по умолчанию 'quiz'
       title: 'Три вопроса о «Слове»',   // необязательно
       lead:  'Ответь и узнай, как было на самом деле.',   // необязательно
       points: 10,                       // очков за верный ответ, по умолчанию 10
       items: [
         { q:'Кто написал «Слово о полку Игореве»?',
           o:['Автор неизвестен','Летописец Нестор','Князь Игорь'],
           c:0,                          // индекс верного варианта
           e:'Имя автора история не сохранила…' }   // разбор, показывается всегда
       ]
     };</script>
     <script src="../../assets/museum-quiz.js"></script>

   Очки: страница объявляет реестр наград в MUSEUM_SCORE, движок начисляет их сам —
       awards: { q: [3, 10] }            // 3 вопроса по 10 очков
   Ключи наград: 'q0', 'q1', … — совпадают с прежними inline-викторинами, поэтому
   уже принятые страницы при переходе на движок не меняют свой знаменатель.

   Доступность: варианты — настоящие <button> в списке, ходят по Tab и жмутся Enter/Space;
   разбор выводится в area с aria-live, поэтому его читает скринридер. Ширина экрана на
   логику не влияет (§6-тер: расчёт игры не привязывается к размеру холста) — кнопки
   переносятся по колонкам, поведение на 390 и 1440 одинаковое.

   Если контейнера нет, конфига нет, список вопросов пуст или секция уже свёрстана руками
   (внутри есть .mq-box) — движок не делает ничего и страницу не трогает. */
(function () {
  'use strict';

  function init() {
    var cfg = window.MUSEUM_QUIZ;
    if (!cfg || !cfg.items || !cfg.items.length) return;

    var mount = document.getElementById(cfg.mount || 'quiz');
    if (!mount || mount.querySelector('.mq-box')) return;

    ensureStyles();

    var points = typeof cfg.points === 'number' ? cfg.points : 10;
    var idx = 0;
    var answered = [];

    var box = document.createElement('div');
    box.className = 'mq-box';

    if (cfg.title) {
      var h = document.createElement('h2');
      h.className = 'mq-title';
      h.textContent = cfg.title;
      box.appendChild(h);
    }
    if (cfg.lead) {
      var p = document.createElement('p');
      p.className = 'mq-lead';
      p.textContent = cfg.lead;
      box.appendChild(p);
    }

    var card = document.createElement('div');
    card.className = 'mq-card';
    box.appendChild(card);
    mount.appendChild(box);

    render();

    function render() {
      card.innerHTML = '';

      if (idx >= cfg.items.length) {
        var done = document.createElement('p');
        done.className = 'mq-done';
        var right = answered.filter(Boolean).length;
        done.textContent = 'Вопросы пройдены: верных ' + right + ' из ' + cfg.items.length + '.';
        card.appendChild(done);
        return;
      }

      var item = cfg.items[idx];

      var step = document.createElement('p');
      step.className = 'mq-step';
      step.textContent = (idx + 1) + ' / ' + cfg.items.length;
      card.appendChild(step);

      var q = document.createElement('p');
      q.className = 'mq-q';
      q.textContent = item.q;
      card.appendChild(q);

      var list = document.createElement('div');
      list.className = 'mq-opts';
      card.appendChild(list);

      (item.o || []).forEach(function (text, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'mq-opt';
        b.textContent = text;
        b.addEventListener('click', function () { answer(i, list, item); });
        list.appendChild(b);
      });

      var exp = document.createElement('div');
      exp.className = 'mq-exp';
      exp.setAttribute('aria-live', 'polite');
      card.appendChild(exp);
    }

    function answer(picked, list, item) {
      var btns = list.querySelectorAll('.mq-opt');
      if (btns.length && btns[0].disabled) return;   // повторное нажатие не начисляет заново

      Array.prototype.forEach.call(btns, function (b, j) {
        b.disabled = true;
        if (j === item.c) b.classList.add('is-right');
        else if (j === picked) b.classList.add('is-wrong');
      });

      var hit = picked === item.c;
      answered.push(hit);
      if (hit && typeof window.award === 'function') window.award('q' + idx, points);

      var exp = list.parentNode.querySelector('.mq-exp');
      if (exp) {
        exp.textContent = item.e || '';
        exp.classList.add('is-on');
      }

      var next = document.createElement('button');
      next.type = 'button';
      next.className = 'mq-next';
      next.textContent = idx + 1 < cfg.items.length ? 'Следующий вопрос →' : 'Завершить';
      next.addEventListener('click', function () { idx++; render(); });
      card.appendChild(next);
      next.focus();
    }
  }

  function ensureStyles() {
    if (document.getElementById('mq-styles')) return;
    var s = document.createElement('style');
    s.id = 'mq-styles';
    s.textContent = [
      '.mq-box{margin-top:18px}',
      '.mq-title{margin:0 0 6px}',
      '.mq-lead{color:var(--muted,#a89a80);margin:0 0 14px;max-width:62ch}',
      '.mq-card{border:1px solid var(--acc-soft,rgba(201,168,76,.16));border-radius:14px;padding:18px}',
      '.mq-step{margin:0 0 6px;font-size:13px;color:var(--muted,#a89a80)}',
      '.mq-q{font-weight:600;font-size:17px;margin:0 0 12px}',
      '.mq-opts{display:grid;gap:8px}',
      '.mq-opt{display:block;width:100%;text-align:left;padding:12px 14px;border-radius:10px;',
      'border:1px solid var(--acc-soft,rgba(201,168,76,.16));background:transparent;',
      'color:inherit;font:inherit;cursor:pointer;line-height:1.35}',
      '.mq-opt:hover:not(:disabled){border-color:var(--acc,#c9a84c)}',
      '.mq-opt:focus-visible{outline:2px solid var(--acc,#c9a84c);outline-offset:2px}',
      '.mq-opt:disabled{cursor:default;opacity:.85}',
      '.mq-opt.is-right{border-color:#4f9d69;background:rgba(79,157,105,.14)}',
      '.mq-opt.is-wrong{border-color:#b45b4c;background:rgba(180,91,76,.12)}',
      '.mq-exp{margin-top:12px;display:none;line-height:1.5;color:var(--muted,#a89a80)}',
      '.mq-exp.is-on{display:block}',
      '.mq-next{margin-top:14px;padding:10px 16px;border-radius:10px;cursor:pointer;',
      'border:1px solid var(--acc,#c9a84c);background:transparent;color:inherit;font:inherit}',
      '.mq-next:focus-visible{outline:2px solid var(--acc,#c9a84c);outline-offset:2px}',
      '.mq-done{margin:0;font-weight:600;color:var(--gold-l,#e0c470)}',
      '@media(prefers-reduced-motion:reduce){.mq-opt,.mq-next{transition:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
