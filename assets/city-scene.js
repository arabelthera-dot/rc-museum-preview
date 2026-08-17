/* city-scene.js — живая панорама города-музея для hero портала и страниц музеев.
 * Рисует силуэт русского города в несколько слоёв с параллаксом: холмы, крепостная
 * стена с башнями, купола, шатровые церкви, Шуховская башня, ракета, паруса.
 * Внутри сцены НЕТ ни одной надписи — текст живёт отдельным блоком под ней
 * (правило Сергея 03.08: «отдельно картинка, отдельно хук под ним написанный»).
 *
 * Подключение:
 *   <canvas id="city"></canvas>
 *   <script>window.CITY_SCENE={acc:'#e8873a',seed:7,density:1};</script>
 *   <script src="../assets/city-scene.js" defer></script>
 */
(function () {
  var C = window.CITY_SCENE || {};
  var ACC = C.acc || '#e8873a';
  var SEED = C.seed == null ? 1 : C.seed;

  /* ---- живой город: здание = музей ----
     Привязка идёт по типу постройки, а не подряд: гиперболоид Шухова ведёт в изобретения,
     ракета — в космос, парус коча — к первопроходцам. Здания без смысловой пары остаются
     фоном города и не кликаются: натянутая связь хуже её отсутствия.
     Интерактив включается только флагом linked — на страницах музеев сцена декоративна,
     и относительные ссылки оттуда вели бы в никуда. */
  var SPOTS = C.spots || {
    shukhov: { href: 'muzei/izobreteniya/index.html', name: 'Музей изобретений',
               hook: 'Башня из прямых стержней, которая стоит уже второй век' },
    rocket: { href: 'muzei/kosmos/index.html', name: 'Музей космоса',
              hook: 'Королёв считал: чтобы полететь, надо сначала перестать бояться' },
    sail: { href: 'muzei/pervoprohodcy/index.html', name: 'Музей первопроходцев',
            hook: 'На таком коче Дежнёв прошёл пролив за восемьдесят лет до Беринга' },
    tentChurch: { href: 'muzei/arhitektura/index.html', name: 'Музей архитектуры',
                  hook: 'Шатёр вместо купола — так строили только на Руси' },
    church: { href: 'muzei/ikona/index.html', name: 'Музей иконы',
              hook: 'Внутри пятиглавого храма — лица, писанные светом' }
  };
  var LINKED = !!C.linked;
  var hits = [], hover = null, tapped = null, label = null;

  function kindKey(kind) { return typeof kind === 'string' ? kind : (kind && kind.name) || ''; }

  function rnd(s) { var x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  var cv = document.getElementById(C.canvas || 'city');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  var stars = [], flakes = [], layers = [], t0 = performance.now();
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- силуэты: каждая функция рисует один объект от базовой линии вверх ---- */
  function wallTower(x, y, w, h) {                    /* башня крепостной стены с шатром */
    ctx.beginPath();
    ctx.rect(x - w / 2, y - h, w, h);
    ctx.moveTo(x - w * 0.72, y - h);
    ctx.lineTo(x, y - h - w * 1.25);
    ctx.lineTo(x + w * 0.72, y - h);
    ctx.closePath(); ctx.fill();
  }
  function wall(x, y, w, h) {                          /* прясло стены с зубцами */
    ctx.fillRect(x, y - h, w, h);
    var n = Math.max(3, Math.round(w / 14));
    for (var i = 0; i < n; i++) ctx.fillRect(x + i * (w / n) + 1, y - h - 6, (w / n) - 3, 6);
  }
  function dome(x, y, r) {                             /* луковичная глава на барабане */
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.bezierCurveTo(x - r * 1.25, y - r * 1.15, x - r * 0.55, y - r * 1.55, x, y - r * 2.15);
    ctx.bezierCurveTo(x + r * 0.55, y - r * 1.55, x + r * 1.25, y - r * 1.15, x + r, y);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(x - r * 0.12, y - r * 2.9, r * 0.24, r * 0.8);          /* крест: стойка */
    ctx.fillRect(x - r * 0.42, y - r * 2.62, r * 0.84, r * 0.16);        /* крест: перекладина */
  }
  function church(x, y, s) {                           /* четверик + пять глав */
    ctx.fillRect(x - s * 1.5, y - s * 1.6, s * 3, s * 1.6);
    dome(x, y - s * 1.6, s * 0.5);
    dome(x - s * 1.05, y - s * 1.35, s * 0.3);
    dome(x + s * 1.05, y - s * 1.35, s * 0.3);
  }
  function tentChurch(x, y, s) {                       /* шатровый храм */
    ctx.fillRect(x - s * 0.7, y - s * 1.8, s * 1.4, s * 1.8);
    ctx.beginPath();
    ctx.moveTo(x - s * 0.95, y - s * 1.8);
    ctx.lineTo(x, y - s * 3.6);
    ctx.lineTo(x + s * 0.95, y - s * 1.8);
    ctx.closePath(); ctx.fill();
    dome(x, y - s * 3.6, s * 0.2);
  }
  function shukhov(x, y, h) {                          /* гиперболоид: две сетки прямых */
    var w = h * 0.34, n = 9;
    ctx.save(); ctx.globalAlpha *= 0.95; ctx.lineWidth = Math.max(1, h * 0.012);
    ctx.strokeStyle = ctx.fillStyle;
    for (var i = 0; i <= n; i++) {
      var a = i / n;
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + a * w, y);
      ctx.lineTo(x - w * 0.22 + a * w * 0.44, y - h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - a * w, y);
      ctx.lineTo(x + w * 0.22 - a * w * 0.44, y - h);
      ctx.stroke();
    }
    for (var k = 1; k < 4; k++) {                      /* кольца жёсткости */
      var yy = y - h * k / 4, ww = w * (1 - 0.28 * k / 4 * 2.2);
      ctx.beginPath(); ctx.moveTo(x - ww / 2, yy); ctx.lineTo(x + ww / 2, yy); ctx.stroke();
    }
    ctx.restore();
  }
  function rocket(x, y, h) {                           /* ракета на стартовом столе */
    var w = h * 0.13;
    ctx.beginPath();
    ctx.moveTo(x - w, y - h * 0.62);
    ctx.lineTo(x - w, y - h * 0.06);
    ctx.lineTo(x + w, y - h * 0.06);
    ctx.lineTo(x + w, y - h * 0.62);
    ctx.quadraticCurveTo(x, y - h * 1.12, x - w, y - h * 0.62);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();                                   /* боковые блоки «семёрки» */
    ctx.moveTo(x - w * 2.1, y); ctx.lineTo(x - w * 2.1, y - h * 0.42);
    ctx.quadraticCurveTo(x - w * 1.5, y - h * 0.66, x - w * 0.95, y - h * 0.3);
    ctx.lineTo(x - w * 0.95, y); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.scale(-1, 1);
    ctx.beginPath();
    ctx.moveTo(-x - w * 2.1, y); ctx.lineTo(-x - w * 2.1, y - h * 0.42);
    ctx.quadraticCurveTo(-x - w * 1.5, y - h * 0.66, -x - w * 0.95, y - h * 0.3);
    ctx.lineTo(-x - w * 0.95, y); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillRect(x + w * 2.6, y - h * 0.75, w * 0.3, h * 0.75);          /* ферма обслуживания */
  }
  function sail(x, y, h) {                             /* парус коча */
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x, y - h);
    ctx.quadraticCurveTo(x + h * 0.62, y - h * 0.52, x + h * 0.06, y - h * 0.06);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(x - h * 0.5, y - h * 0.06, h * 1.15, h * 0.09);
  }
  function izba(x, y, s) {                             /* изба с коньком */
    ctx.fillRect(x - s, y - s * 0.75, s * 2, s * 0.75);
    ctx.beginPath();
    ctx.moveTo(x - s * 1.2, y - s * 0.75);
    ctx.lineTo(x, y - s * 1.5);
    ctx.lineTo(x + s * 1.2, y - s * 0.75);
    ctx.closePath(); ctx.fill();
  }

  var KIT = [church, tentChurch, izba, wallTower];

  /* ---- сборка слоёв: дальний бледный, ближний плотный ---- */
  function build() {
    layers = [];
    /* Масштаб постройки считается не от одной высоты: на весь экран (1280×800) высота
       растёт вдвое, и город раздувался до пяти домов на кадр. Берём меньшее из высоты
       и доли ширины — тогда в развороте прибавляется город, а не размер избы. */
    var SC = Math.min(H, Math.max(W * 0.42, 300)) / 420;
    var base = [
      { depth: 0.18, alpha: 0.50, scale: 0.62, step: 150 },
      { depth: 0.42, alpha: 0.74, scale: 0.86, step: 190 },
      { depth: 0.85, alpha: 0.96, scale: 1.00, step: 240 }
    ];
    base.forEach(function (L, li) {
      var items = [], span = W * 2 + 400, x = -100, i = 0;
      while (x < span) {
        var r = rnd(SEED * 31 + li * 97 + i * 13);
        var s = (27 + r * 34) * L.scale * SC;
        var kind;
        if (li === 2 && i % 7 === 3) kind = 'shukhov';
        else if (li === 2 && i % 11 === 6) kind = 'rocket';
        else if (li === 1 && i % 9 === 4) kind = 'sail';
        else kind = KIT[Math.floor(r * 1000) % KIT.length];
        items.push({
          x: x, s: s, kind: kind, lit: rnd(SEED + i * 7 + li),
          /* кликается только ближний слой: по дальнему бледному силуэту не целятся */
          spot: (LINKED && li === 2) ? SPOTS[kindKey(kind)] || null : null
        });
        x += (L.step * L.scale * (0.62 + r * 0.62)) * SC;
        i++;
      }
      L.items = items; L.width = x;
      layers.push(L);
    });
    stars = [];
    for (var k = 0; k < 90; k++) {
      stars.push({ x: rnd(SEED + k * 3.1), y: rnd(SEED + k * 7.7) * 0.62, r: 0.4 + rnd(k * 2.3) * 1.1, p: rnd(k * 5.5) });
    }
    flakes = [];
    var nf = Math.round(46 * (C.density == null ? 1 : C.density));
    for (var f = 0; f < nf; f++) {
      flakes.push({ x: rnd(f * 1.7 + SEED), y: rnd(f * 3.3), v: 0.15 + rnd(f * 9.1) * 0.35, a: rnd(f * 4.4), r: 0.6 + rnd(f * 6.2) * 1.4 });
    }
  }

  function resize() {
    var r = cv.getBoundingClientRect();
    W = Math.max(320, r.width); H = Math.max(180, r.height);
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function draw(now) {
    var t = (now - t0) / 1000;
    var HOR = H * (H > W * 0.5 ? 0.80 : 0.855);                                /* линия горизонта: выше неё — небо */

    /* небо: рассвет. Тёмная синь вверху → тёплый свет у горизонта, чтобы силуэты читались
       контрастом «тёмное на светлом», а не «чёрное на чёрном» (правка Сергея 05.08). */
    var g = ctx.createLinearGradient(0, 0, 0, HOR);
    g.addColorStop(0, '#16203f');
    g.addColorStop(0.34, '#33355f');
    g.addColorStop(0.60, '#6b4f6d');
    g.addColorStop(0.80, '#b4705a');
    g.addColorStop(0.93, '#e0914c');
    g.addColorStop(1, '#f5c377');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HOR);

    /* звёзды — только в верхней, ещё тёмной части неба */
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i], sy = st.y * HOR * 0.72, tw = 0.55 + 0.45 * Math.sin(t * 0.9 + st.p * 6.283);
      ctx.globalAlpha = 0.55 * tw * (1 - sy / (HOR * 0.85));
      ctx.fillStyle = '#eef2ff';
      ctx.beginPath(); ctx.arc(st.x * W, sy, st.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* солнце у горизонта — источник света, за силуэтами города */
    var sunX = W * 0.63, sunY = HOR - H * 0.045, sunR = Math.max(16, H * 0.052);
    var sg = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 7);
    sg.addColorStop(0, 'rgba(255,236,190,.95)');
    sg.addColorStop(0.16, 'rgba(255,196,116,.55)');
    sg.addColorStop(0.45, hexA(ACC, 0.22));
    sg.addColorStop(1, hexA(ACC, 0));
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, HOR);
    ctx.fillStyle = 'rgba(255,240,205,.92)';
    ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, 6.283); ctx.fill();

    /* дымка над горизонтом — воздушная перспектива, разделяет планы */
    var hz = ctx.createLinearGradient(0, HOR - H * 0.30, 0, HOR);
    hz.addColorStop(0, 'rgba(246,200,140,0)');
    hz.addColorStop(1, 'rgba(246,200,140,.30)');
    ctx.fillStyle = hz; ctx.fillRect(0, HOR - H * 0.30, W, H * 0.30);

    /* земля под городом */
    var eg = ctx.createLinearGradient(0, HOR - H * 0.02, 0, H);
    eg.addColorStop(0, '#2a2038');
    eg.addColorStop(1, '#120f22');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (var x = 0; x <= W; x += 12) {
      ctx.lineTo(x, HOR - Math.sin(x / W * 3.1 + SEED) * H * 0.018 - Math.sin(x / W * 7.3) * H * 0.010);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    /* слои города */
    var speed = reduced ? 0 : 1;
    for (var li = 0; li < layers.length; li++) {
      var L = layers[li];
      var baseY = HOR - H * 0.055 + li * H * 0.030;
      var off = (t * 4.5 * L.depth * speed) % L.width;
      ctx.save();
      ctx.globalAlpha = L.alpha;
      ctx.fillStyle = li === 2 ? '#0f0c1c' : (li === 1 ? '#332a4a' : '#6e5a78');
      if (li === 2) hits = [];
      for (var k = 0; k < L.items.length; k++) {
        var it = L.items[k], px = it.x - off;
        if (px < -160) px += L.width;
        if (px > W + 160) continue;
        /* здание под курсором выступает из строя: теплеет камень и загорается ореол */
        var hot = it.spot && hover === it;
        if (hot) {
          ctx.save();
          /* два прохода: широкий тёплый ореол вокруг силуэта, затем сам камень посветлее.
             Один проход давал еле заметное свечение у основания — здание не откликалось. */
          ctx.shadowColor = hexA(ACC, 1);
          ctx.shadowBlur = Math.max(26, it.s * 1.6);
          ctx.fillStyle = hexA(ACC, 0.55);
          if (it.kind === 'shukhov') shukhov(px, baseY, it.s * 3.4);
          else if (it.kind === 'rocket') rocket(px, baseY, it.s * 3.2);
          else if (it.kind === 'sail') sail(px, baseY, it.s * 1.8);
          else if (it.kind === wallTower) wallTower(px, baseY, it.s * 0.9, it.s * 1.7);
          else it.kind(px, baseY, it.s);
          ctx.shadowBlur = Math.max(12, it.s * 0.7);
          ctx.fillStyle = '#3d2b52';
        }
        if (it.kind === 'shukhov') shukhov(px, baseY, it.s * 3.4);
        else if (it.kind === 'rocket') rocket(px, baseY, it.s * 3.2);
        else if (it.kind === 'sail') sail(px, baseY, it.s * 1.8);
        else if (it.kind === wallTower) wallTower(px, baseY, it.s * 0.9, it.s * 1.7);
        else it.kind(px, baseY, it.s);
        if (hot) ctx.restore();
        if (it.spot) {
          var kk = kindKey(it.kind);
          var hh = kk === 'shukhov' ? it.s * 3.4 : kk === 'rocket' ? it.s * 3.2
                 : kk === 'sail' ? it.s * 1.8 : it.s * 2.6;
          hits.push({ item: it, x: px, y: baseY, w: it.s * 1.9, h: hh });
        }
      }
      /* тёплые окна ближнего слоя */
      if (li === 2) {
        ctx.fillStyle = 'rgba(255,206,122,.95)';
        for (var w2 = 0; w2 < L.items.length; w2++) {
          var iw = L.items[w2], pw = iw.x - off;
          if (pw < -60) pw += L.width;
          if (pw > W + 60 || iw.kind === 'shukhov' || iw.kind === 'rocket') continue;
          var blink = 0.35 + 0.65 * Math.pow(Math.sin(t * 0.5 + iw.lit * 6.283) * 0.5 + 0.5, 3);
          ctx.globalAlpha = L.alpha * blink * 0.9;
          ctx.fillRect(pw - iw.s * 0.18, baseY - iw.s * 0.55, iw.s * 0.16, iw.s * 0.22);
          ctx.fillRect(pw + iw.s * 0.06, baseY - iw.s * 0.55, iw.s * 0.16, iw.s * 0.22);
        }
      }
      ctx.restore();
    }

    /* снег */
    if (!reduced) {
      ctx.fillStyle = 'rgba(226,236,255,.55)';
      for (var f = 0; f < flakes.length; f++) {
        var fl = flakes[f];
        var fy = ((fl.y + t * fl.v * 0.05) % 1) * H;
        var fx = (fl.x * W + Math.sin(t * 0.5 + fl.a * 6.283) * 14 + W) % W;
        ctx.globalAlpha = 0.25 + 0.35 * (1 - fy / H);
        ctx.beginPath(); ctx.arc(fx, fy, fl.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    /* узкая виньетка у самого низа — только стык с фоном страницы.
       Раньше она шла с 0.72H и закрашивала сами здания (правка 05.08). */
    var vg = ctx.createLinearGradient(0, H * 0.93, 0, H);
    vg.addColorStop(0, 'rgba(11,16,32,0)');
    vg.addColorStop(1, 'rgba(11,16,32,.80)');
    ctx.fillStyle = vg; ctx.fillRect(0, H * 0.93, W, H * 0.07);

    requestAnimationFrame(draw);
  }

  function hexA(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ---- полный экран по клику (правка Сергея 05.08) ----
     Нативный Fullscreen API, а где его нет (Safari на iPhone не даёт fullscreen для div) —
     запасной режим классом .scene-max: position:fixed на весь вьюпорт. Выход — повторный
     клик, кнопка или Esc. Стили и кнопку вставляет сам движок: иначе это 58 правок в HTML. */
  var box = cv.parentNode;
  if (box && !C.noFull) {
    if (!document.getElementById('city-scene-css')) {
      var stl = document.createElement('style');
      stl.id = 'city-scene-css';
      stl.textContent =
        '.hero-scene{cursor:zoom-in}' +
        '.hero-scene.scene-max{position:fixed;inset:0;width:100%;height:100%;z-index:9999;' +
        'max-height:none;cursor:zoom-out;background:#16203f}' +
        '.hero-scene:fullscreen{height:100%;cursor:zoom-out}' +
        '.hero-scene:-webkit-full-screen{height:100%;cursor:zoom-out}' +
        '.scene-full{position:absolute;right:12px;bottom:12px;z-index:5;display:inline-flex;' +
        'align-items:center;gap:7px;padding:7px 12px;border-radius:20px;cursor:pointer;' +
        'font:600 12px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.4px;' +
        'color:#fff3dd;background:rgba(12,10,26,.55);border:1px solid rgba(255,214,150,.45);' +
        'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:background .18s,transform .18s}' +
        '.scene-full:hover{background:rgba(12,10,26,.8);transform:translateY(-1px)}' +
        '.scene-full svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2}' +
        '@media (max-width:640px){.scene-full span{display:none}.scene-full{padding:9px;right:10px;bottom:10px}}';
      document.head.appendChild(stl);
    }
    var ICON_IN = '<svg viewBox="0 0 20 20"><path d="M7 2H2v5M13 2h5v5M7 18H2v-5M13 18h5v-5"/></svg>';
    var ICON_OUT = '<svg viewBox="0 0 20 20"><path d="M2 7h5V2M18 7h-5V2M2 13h5v5M18 13h-5v5"/></svg>';
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'scene-full';
    btn.innerHTML = ICON_IN + '<span>Во весь экран</span>';
    btn.setAttribute('aria-label', 'Показать панораму города во весь экран');
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
    box.appendChild(btn);

    var isFull = function () {
      return !!(document.fullscreenElement || document.webkitFullscreenElement) ||
        box.classList.contains('scene-max');
    };
    var paint = function () {
      var f = isFull();
      btn.innerHTML = (f ? ICON_OUT : ICON_IN) + '<span>' + (f ? 'Свернуть' : 'Во весь экран') + '</span>';
      btn.setAttribute('aria-label', f ? 'Свернуть панораму' : 'Показать панораму города во весь экран');
      setTimeout(resize, 60);
    };
    var enter = function () {
      var rq = box.requestFullscreen || box.webkitRequestFullscreen;
      if (rq) { var p = rq.call(box); if (p && p.catch) p.catch(function () { box.classList.add('scene-max'); paint(); }); }
      else { box.classList.add('scene-max'); }
      paint();
    };
    var exit = function () {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      }
      box.classList.remove('scene-max');
      paint();
    };
    /* клик по зданию — это вход в музей, а не полный экран: разводим два жеста */
    var toggle = function (e) {
      if (hover && hover.spot) return;
      e.preventDefault(); isFull() ? exit() : enter();
    };
    box.addEventListener('click', toggle);
    document.addEventListener('fullscreenchange', paint);
    document.addEventListener('webkitfullscreenchange', paint);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('scene-max')) exit();
    });
  }

  /* ---- живой город: наведение и вход ----
     Подпись живёт ОТДЕЛЬНЫМ блоком под сценой, внутри картинки текста нет
     (правило Сергея 03.08). Здание светится — читаем, что в нём, под холстом. */
  if (LINKED) {
    var IDLE = C.idle || 'Наведи на здание — узнаешь, какой музей внутри';
    if (!document.getElementById('city-link-css')) {
      var lst = document.createElement('style');
      lst.id = 'city-link-css';
      lst.textContent =
        '.city-label{margin:14px 0 0;min-height:1.6em;font:400 16px/1.55 "PT Serif",Georgia,serif;' +
        'color:#b9b3a6;transition:color .2s}' +
        '.city-label.is-on{color:#f4f1ea}' +
        '.city-label b{font-weight:700;color:#f4f1ea}' +
        '.city-go{white-space:nowrap;color:' + ACC + ';font-weight:700}' +
        '@media (max-width:640px){.city-label{font-size:15px}}';
      document.head.appendChild(lst);
    }
    label = document.querySelector('[data-city-label]');
    if (!label) {
      label = document.createElement('p');
      label.setAttribute('data-city-label', '');
      if (box && box.parentNode) box.parentNode.insertBefore(label, box.nextSibling);
    }
    label.className = 'city-label';
    label.setAttribute('aria-live', 'polite');
    label.textContent = IDLE;

    var paintLabel = function () {
      if (!label) return;
      if (hover && hover.spot) {
        label.innerHTML = '<b>' + hover.spot.name + '</b> — ' + hover.spot.hook +
          ' <span class="city-go">войти →</span>';
        label.classList.add('is-on');
      } else {
        label.textContent = IDLE;
        label.classList.remove('is-on');
      }
    };
    var setHover = function (item) {
      if (hover === item) return;
      hover = item;
      cv.style.cursor = item ? 'pointer' : '';
      paintLabel();
    };
    var pick = function (e) {
      var r = cv.getBoundingClientRect();
      var mx = e.clientX - r.left, my = e.clientY - r.top;
      for (var i = hits.length - 1; i >= 0; i--) {
        var b = hits[i];
        if (mx >= b.x - b.w / 2 && mx <= b.x + b.w / 2 && my >= b.y - b.h && my <= b.y + 8) {
          return b.item;
        }
      }
      return null;
    };
    cv.addEventListener('mousemove', function (e) { setHover(pick(e)); });
    cv.addEventListener('mouseleave', function () { setHover(null); });
    cv.addEventListener('click', function (e) {
      var item = pick(e);
      if (!item || !item.spot) return;
      e.preventDefault(); e.stopPropagation();
      window.location.href = item.spot.href;
    });
    /* телефон: первый тап зажигает здание и показывает подпись, второй — открывает музей */
    cv.addEventListener('touchstart', function (e) {
      var touch = e.touches[0];
      if (!touch) return;
      var item = pick(touch);
      if (!item || !item.spot) { setHover(null); tapped = null; return; }
      e.preventDefault(); e.stopPropagation();
      if (tapped === item) { window.location.href = item.spot.href; return; }
      tapped = item;
      setHover(item);
    }, { passive: false });
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 120); });
  resize();
  requestAnimationFrame(draw);
})();
