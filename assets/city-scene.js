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
    var base = [
      { depth: 0.18, alpha: 0.22, scale: 0.55, step: 150 },
      { depth: 0.42, alpha: 0.40, scale: 0.80, step: 190 },
      { depth: 0.85, alpha: 0.78, scale: 1.00, step: 240 }
    ];
    base.forEach(function (L, li) {
      var items = [], span = W * 2 + 400, x = -100, i = 0;
      while (x < span) {
        var r = rnd(SEED * 31 + li * 97 + i * 13);
        var s = (18 + r * 26) * L.scale * (H / 420);
        var kind;
        if (li === 2 && i % 7 === 3) kind = 'shukhov';
        else if (li === 2 && i % 11 === 6) kind = 'rocket';
        else if (li === 1 && i % 9 === 4) kind = 'sail';
        else kind = KIT[Math.floor(r * 1000) % KIT.length];
        items.push({ x: x, s: s, kind: kind, lit: rnd(SEED + i * 7 + li) });
        x += (L.step * L.scale * (0.7 + r * 0.7)) * (H / 420);
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
    /* небо */
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1020');
    g.addColorStop(0.55, '#141a2e');
    g.addColorStop(1, '#20243a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    /* звёзды */
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i], tw = 0.55 + 0.45 * Math.sin(t * 0.9 + st.p * 6.283);
      ctx.globalAlpha = 0.7 * tw;
      ctx.fillStyle = '#dfe6ff';
      ctx.beginPath(); ctx.arc(st.x * W, st.y * H, st.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* зарево над городом акцентным цветом */
    var gl = ctx.createRadialGradient(W * 0.5, H * 1.02, H * 0.05, W * 0.5, H * 1.02, H * 0.95);
    gl.addColorStop(0, hexA(ACC, 0.30));
    gl.addColorStop(0.5, hexA(ACC, 0.09));
    gl.addColorStop(1, hexA(ACC, 0));
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);

    /* холмы под городом */
    ctx.fillStyle = 'rgba(10,14,26,.55)';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (var x = 0; x <= W; x += 12) {
      ctx.lineTo(x, H * 0.90 - Math.sin(x / W * 3.1 + SEED) * H * 0.03 - Math.sin(x / W * 7.3) * H * 0.015);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    /* слои города */
    var speed = reduced ? 0 : 1;
    for (var li = 0; li < layers.length; li++) {
      var L = layers[li];
      var baseY = H * (0.80 + li * 0.065);
      var off = (t * 4.5 * L.depth * speed) % L.width;
      ctx.save();
      ctx.globalAlpha = L.alpha;
      ctx.fillStyle = li === 2 ? '#05070f' : (li === 1 ? '#0a0f1e' : '#141b30');
      for (var k = 0; k < L.items.length; k++) {
        var it = L.items[k], px = it.x - off;
        if (px < -160) px += L.width;
        if (px > W + 160) continue;
        if (it.kind === 'shukhov') shukhov(px, baseY, it.s * 3.4);
        else if (it.kind === 'rocket') rocket(px, baseY, it.s * 3.2);
        else if (it.kind === 'sail') sail(px, baseY, it.s * 1.8);
        else if (it.kind === wallTower) wallTower(px, baseY, it.s * 0.9, it.s * 1.7);
        else it.kind(px, baseY, it.s);
      }
      /* тёплые окна ближнего слоя */
      if (li === 2) {
        ctx.fillStyle = hexA(ACC, 0.85);
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

    /* мягкая виньетка снизу — стык с фоном страницы */
    var vg = ctx.createLinearGradient(0, H * 0.72, 0, H);
    vg.addColorStop(0, 'rgba(11,16,32,0)');
    vg.addColorStop(1, 'rgba(11,16,32,.85)');
    ctx.fillStyle = vg; ctx.fillRect(0, H * 0.72, W, H * 0.28);

    requestAnimationFrame(draw);
  }

  function hexA(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();
