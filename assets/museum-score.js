/*! museum-score.js — общий счёт дня музея. Шкала посетителя ВСЕГДА из 100 (§6-тер).
 *
 * Зачем движок (П5, 09.09.2026). До него счёт жил inline в каждой странице:
 * своя переменная score, свой award(), свой знаменатель в разметке. Замер по 16 страницам
 * января показал, что знаменатель не совпадал с достижимым НИ НА ОДНОЙ: 60 при достижимых 38,
 * 80 при 50, 100 при 45. То есть посетитель видел шкалу, до конца которой дойти нельзя,
 * а диплом Шухова открывался при score>=60 при максимуме 45 — не открывался никогда.
 * Причина не в цифрах, а в том, что шкалу держала разметка страницы: 16 копий одного правила.
 *
 * Как теперь. Страница объявляет только свои НАГРАДЫ и их сумму:
 *
 *     <script>window.MUSEUM_SCORE = {
 *       max: 45,                                   // сумма всех award() на странице
 *       ranks: [[100,'Первый инженер империи'],[70,'Знаток трубопроводов'],
 *               [40,'Экскурсант'],[0,'Гость музея']],   // пороги в шкале 0–100
 *       diplomaAt: 60                              // порог диплома в той же шкале
 *     };</script>
 *     <script src="../../assets/museum-score.js" defer></script>
 *
 * Движок нормирует сырые очки к 100 и сам рисует: счётчик в шапке, знаменатель, полосу
 * «Итог дня», звание и диплом. Набрал все награды — ровно 100 и высшее звание.
 *
 * Совместимость с принятыми страницами: наружу отдаётся та же глобальная функция award(k,n),
 * поэтому вызовы внутри викторин, игр и чатов не переписываются. Локальные переменные score
 * внутри мини-игр (gm_tf2 и прочие) движка не касаются — он ничего глобального, кроме award
 * и museumScore, не объявляет.
 */
(function () {
  var cfg = window.MUSEUM_SCORE || {};

  // Достижимое число очков. 11.09.2026: поле max писалось рукой и на проверенных страницах
  // января оказывалось суммой ОДНИХ ЛИШЬ литеральных наград — награды из циклов
  // (award('q'+qIdx,10) на каждый вопрос викторины) в него не входили. Шкала от этого
  // занижена, а занижение хуже завышения: raw/max обрезается по 100, посетитель упирается
  // в потолок и получает высшее звание задолго до конца дня. Теперь страница объявляет
  // реестр наград, и максимум считает движок — расходиться стало не с чем:
  //
  //     awards: {read: 5, fork: 10, q: [4, 10]}   // число — очки; пара — [сколько раз, по сколько]
  //
  // Поле max сохранено для уже принятых страниц и берётся, когда реестра нет.
  function sumAwards(a) {
    var t = 0;
    for (var k in a) {
      if (!Object.prototype.hasOwnProperty.call(a, k)) continue;
      var v = a[k];
      t += Array.isArray(v) ? (Number(v[0]) || 0) * (Number(v[1]) || 0) : (Number(v) || 0);
    }
    return t;
  }
  var max = cfg.awards ? sumAwards(cfg.awards) : (Number(cfg.max) || 0);
  var ranks = cfg.ranks || [[100, 'Знаток'], [70, 'Знаток'], [40, 'Экскурсант'], [0, 'Гость музея']];
  var diplomaAt = cfg.diplomaAt == null ? null : Number(cfg.diplomaAt);

  var raw = 0;
  var earned = {};

  function value() {                      // очки посетителя в шкале 0–100
    if (max <= 0) return 0;
    return Math.min(100, Math.round(raw / max * 100));
  }

  function rank(v) {
    for (var i = 0; i < ranks.length; i++) {
      if (v >= ranks[i][0]) return ranks[i][1];
    }
    return ranks.length ? ranks[ranks.length - 1][1] : '';
  }

  function setDenominator() {
    // «⭐ <span id="score">0</span> / 60» → знаменатель приводится к 100 без перезаписи
    // innerHTML: перезапись убила бы обработчики, повешенные страницей на сам блок.
    var box = document.getElementById('scoreBox');
    if (!box) return;
    for (var n = box.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && /\/\s*\d+/.test(n.nodeValue)) {
        n.nodeValue = n.nodeValue.replace(/\/\s*\d+/, '/ 100');
      }
    }
  }

  function render() {
    var v = value();
    var el = document.getElementById('score');
    if (el) el.textContent = v;

    var bar = document.getElementById('dayBar');
    if (bar) bar.style.width = v + '%';

    var txt = document.getElementById('dayTxt');
    if (txt) txt.textContent = v + ' / 100 · звание: ' + rank(v);

    if (diplomaAt != null) {
      var d = document.getElementById('dipl');
      var note = document.getElementById('diplnote');
      var pts = document.getElementById('dpts');
      if (d) {
        var open = v >= diplomaAt;
        d.style.display = open ? 'block' : 'none';
        if (note) note.style.display = open ? 'block' : 'none';
        if (pts) pts.textContent = v;
      }
    }
  }

  window.award = function (key, points) {
    if (earned[key]) return;
    earned[key] = true;
    raw += Number(points) || 0;
    render();
  };

  window.museumScore = {
    value: value,                          // 0–100, то, что видит посетитель
    raw: function () { return raw; },      // сырые очки страницы
    max: function () { return max; },
    rank: function () { return rank(value()); }
  };

  function init() { setDenominator(); render(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
