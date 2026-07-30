/* museum-choice-run.js — движок «поход по решениям» для музеев «Русской цивилизации».
   Игрок ведёт экспедицию через развилки: каждое решение стоит судов и людей,
   после каждого показывается, как было в действительности. Случайности нет —
   все исходы заданы данными, то есть фактами.

   Движок ничего не знает про конкретный поход: данные приходят снаружи.
   Подключение:
     <script src="../assets/museum-choice-run.js"></script>
     MuseumChoiceRun.init({mount:'#pohodbox', data:RUN, onPoints:addPts});

   Формат данных — см. museum-choice-run.README внизу файла.  */

(function (w, d) {
  'use strict';

  function el(tag, cls, html) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* «7 кочей» / «2 коча» / «1 коч» */
  function plural(n, f) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return n + ' ' + f.many;
    if (b > 1 && b < 5) return n + ' ' + f.few;
    if (b === 1) return n + ' ' + f.one;
    return n + ' ' + f.many;
  }

  var SHIP = '<svg viewBox="0 0 24 26" aria-hidden="true">' +
    '<path class="hull" d="M3.2 17.5h17.6l-2.6 5.2a1.6 1.6 0 0 1-1.4.9H7.2a1.6 1.6 0 0 1-1.4-.9z"/>' +
    '<path class="mast" d="M11.4 2.4h1.2v15h-1.2z"/><path class="sail" d="M13.4 4.2l6 5.4-6 2.4z"/>' +
    '<path class="sail2" d="M10.6 5.6L5.4 10l5.2 1.9z"/></svg>';

  function init(cfg) {
    var box = typeof cfg.mount === 'string' ? d.querySelector(cfg.mount) : cfg.mount;
    if (!box) return null;
    var data = cfg.data,
        onPoints = cfg.onPoints || function () {},
        onFinish = cfg.onFinish || function () {};

    var st = {
      unit: data.unit.n,
      crew: data.crew.n,
      stage: -1,          /* -1 — груз ещё не собран */
      cargo: [],
      losses: [],
      drifted: {},        /* этапы, на которых уже списаны фоновые потери */
      awarded: 0
    };

    box.classList.add('crun');
    box.innerHTML = '';

    /* ── шапка: флот и люди ── */
    var head = el('div', 'crun-head');
    var fleet = el('div', 'crun-fleet');
    var tally = el('div', 'crun-tally');
    head.appendChild(fleet);
    head.appendChild(tally);

    var body = el('div', 'crun-body');
    var log = el('div', 'crun-log');
    box.appendChild(head);
    box.appendChild(body);
    box.appendChild(log);

    function drawHead() {
      fleet.innerHTML = '';
      for (var i = 0; i < data.unit.n; i++) {
        var s = el('span', 'crun-ship' + (i < st.unit ? '' : ' gone'), SHIP);
        fleet.appendChild(s);
      }
      tally.innerHTML = '<b>' + plural(st.unit, data.unit) + '</b> · ' +
        plural(st.crew, data.crew) + ' на борту';
    }

    function addLoss(text) {
      if (!text) return;
      st.losses.push(text);
      var li = el('div', 'crun-loss', text);
      log.appendChild(li);
    }

    /* ── экран груза ── */
    function drawCargo() {
      var c = data.cargo;
      body.innerHTML = '';
      body.appendChild(el('div', 'crun-when', c.when || 'Перед выходом'));
      body.appendChild(el('h3', null, c.title));
      body.appendChild(el('p', 'crun-text', c.text));

      var grid = el('div', 'crun-cargo');
      c.items.forEach(function (item) {
        var b = el('button', 'crun-item',
          '<b>' + item.name + '</b><i>' + item.note + '</i>');
        b.type = 'button';
        b.addEventListener('click', function () {
          var at = st.cargo.indexOf(item.id);
          if (at > -1) { st.cargo.splice(at, 1); b.classList.remove('on'); }
          else {
            if (st.cargo.length >= c.limit) return;
            st.cargo.push(item.id); b.classList.add('on');
          }
          count.textContent = 'Выбрано ' + st.cargo.length + ' из ' + c.limit;
          go.disabled = st.cargo.length !== c.limit;
        });
        grid.appendChild(b);
      });
      body.appendChild(grid);

      var count = el('div', 'crun-count', 'Выбрано 0 из ' + c.limit);
      body.appendChild(count);

      var go = el('button', 'gbtn', c.button || 'В море →');
      go.type = 'button';
      go.disabled = true;
      go.addEventListener('click', function () { st.stage = 0; drawStage(); });
      body.appendChild(go);
    }

    /* ── экран развилки ── */
    function drawStage() {
      var s = data.stages[st.stage];

      /* фоновые потери перехода: они происходят помимо решений игрока —
         экспедицию съедало море, а не только чужие ошибки */
      var dr = s.drift;
      if (dr && !st.drifted[st.stage]) {
        st.drifted[st.stage] = 1;
        st.unit = Math.max(0, st.unit - (dr.unit || 0));
        st.crew = Math.max(0, st.crew - (dr.crew || 0));
        drawHead();
        if (dr.log) addLoss(dr.log);
      }

      body.innerHTML = '';
      body.appendChild(el('div', 'crun-when',
        s.when + ' · решение ' + (st.stage + 1) + ' из ' + data.stages.length));
      if (dr && dr.text) body.appendChild(el('p', 'crun-drift', dr.text));
      body.appendChild(el('h3', null, s.title));
      body.appendChild(el('p', 'crun-text', s.text));

      var opts = el('div', 'crun-opts');
      s.options.forEach(function (o) {
        var b = el('button', 'crun-opt', o.label);
        b.type = 'button';
        b.addEventListener('click', function () { choose(s, o); });
        opts.appendChild(b);
      });
      body.appendChild(opts);
    }

    function choose(s, o) {
      var lostUnit = (o.lose && o.lose.unit) || 0,
          lostCrew = (o.lose && o.lose.crew) || 0,
          extra = '';

      /* груз, которого не хватило именно здесь */
      if (o.needs && st.cargo.indexOf(o.needs) === -1) {
        lostUnit += (o.penalty && o.penalty.unit) || 0;
        lostCrew += (o.penalty && o.penalty.crew) || 0;
        extra = o.penaltyText || '';
      }
      if (o.needs && st.cargo.indexOf(o.needs) > -1 && o.bonusText) extra = o.bonusText;

      st.unit = Math.max(0, st.unit - lostUnit);
      st.crew = Math.max(0, st.crew - lostCrew);
      drawHead();
      if (o.lossLog) addLoss(o.lossLog);

      /* баллы — за пройденный этап, а не за «правильность»:
         в этом походе правильных решений не было ни у кого */
      st.awarded += data.pointsPerStage || 0;
      onPoints(data.pointsPerStage || 0);

      body.innerHTML = '';
      body.appendChild(el('div', 'crun-when', s.when));
      body.appendChild(el('h3', null, o.head || s.title));
      body.appendChild(el('p', 'crun-echo' + (lostUnit || lostCrew ? ' bad' : ''), o.echo));
      if (extra) body.appendChild(el('p', 'crun-echo', extra));
      if (lostUnit || lostCrew) {
        var cost = [];
        if (lostUnit) cost.push('минус ' + plural(lostUnit, data.unit));
        if (lostCrew) cost.push('минус ' + plural(lostCrew, data.crew));
        body.appendChild(el('div', 'crun-cost', cost.join(' · ')));
      }
      body.appendChild(el('p', 'crun-truth', '<b>Как было:</b> ' + o.truth));

      var next = el('button', 'gbtn',
        st.stage + 1 < data.stages.length ? 'Дальше →' : 'Чем кончилось →');
      next.type = 'button';
      next.addEventListener('click', function () {
        st.stage++;
        if (st.stage < data.stages.length) drawStage(); else drawFinale();
      });
      body.appendChild(next);
    }

    /* ── финал: сравнение с действительностью ── */
    function drawFinale() {
      var f = data.finale, real = f.real;
      body.innerHTML = '';
      body.appendChild(el('div', 'crun-when', f.when || 'Итог похода'));
      body.appendChild(el('h3', null, f.title));

      var cmp = el('div', 'crun-cmp');
      cmp.appendChild(el('div', 'crun-col',
        '<span>У вас</span><b>' + plural(st.unit, data.unit) + '</b><i>' +
        plural(st.crew, data.crew) + '</i>'));
      cmp.appendChild(el('div', 'crun-col real',
        '<span>В действительности</span><b>' + plural(real.unit, data.unit) + '</b><i>' +
        plural(real.crew, data.crew) + '</i>'));
      body.appendChild(cmp);

      body.appendChild(el('p', 'crun-text', f.text));
      if (st.unit > real.unit && f.better) body.appendChild(el('p', 'crun-truth', f.better));
      if (st.unit === 0 && f.worst) body.appendChild(el('p', 'crun-truth', f.worst));

      var again = el('button', 'gbtn sec', 'Пройти заново');
      again.type = 'button';
      again.addEventListener('click', function () {
        st.unit = data.unit.n; st.crew = data.crew.n;
        st.stage = -1; st.cargo = []; st.losses = []; st.drifted = {}; log.innerHTML = '';
        drawHead(); drawCargo();
      });
      body.appendChild(again);
      onFinish({ unit: st.unit, crew: st.crew, points: st.awarded });
    }

    drawHead();
    drawCargo();
    return { state: st };
  }

  w.MuseumChoiceRun = { init: init };
})(window, document);

/* museum-choice-run.README
   data = {
     unit:{n:7, one:'коч', few:'коча', many:'кочей'},     — суда/сани/шлюпы
     crew:{n:90, one:'человек', few:'человека', many:'человек'},
     pointsPerStage:10,
     cargo:{when, title, text, limit:3, button, items:[{id,name,note}]},
     stages:[{ when, title, text, options:[{
        label,                       — текст кнопки
        head,                        — заголовок экрана последствий
        echo,                        — что произошло
        truth,                       — как было в действительности (обязательно)
        lose:{unit,crew},            — потери за это решение
        lossLog,                     — строка в судовой журнал потерь
        needs:'id-предмета', penalty:{unit,crew}, penaltyText, bonusText
     }]}],
     finale:{when,title,text,real:{unit,crew},better,worst}
   }
   Правило музея: ни одного выдуманного исхода. Каждый `truth` — из источника,
   указанного в блоке «Источники» страницы.  */
