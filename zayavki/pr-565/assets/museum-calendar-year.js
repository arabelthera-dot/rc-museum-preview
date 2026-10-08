/* Календарь музея — ГОДОВОЙ вид, помесячно, по образцу музея «Что изобрели русские
   первыми в мире» (izobreteniya/calendar.html). Стандарт с 30.07.2026 по решению Сергея:
   на странице музея показываются все двенадцать месяцев подряд, у каждого — свои дни.
   Пустой месяц не прячется: видно, что день ещё не занят.

   Как подключить:
     <section id="calendar"><h2 …>…</h2><div id="calbox"></div></section>
     <script src="../assets/museum-calendar-year.js"></script>
     <script src="calendar-<музей>.js"></script>   // window.MUSEUM_CALENDAR

   Данные — тот же формат, что у museum-calendar.js (посуточный вид):
     "09-20": {t:"Заголовок", y:1648, d:"Текст.", href:"…html", link:"Подпись ссылки"} */
(function () {
  var MON = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
             'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  var DIM = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  var CSS = '' +
    '#calbox .calmon{margin:22px 0 0}' +
    '#calbox .calmh{display:flex;align-items:baseline;gap:9px;font-family:Georgia,serif;' +
      'font-size:16px;color:var(--gold);border-bottom:1px solid rgba(212,175,55,.25);padding-bottom:6px}' +
    '#calbox .calmh i{font-style:normal;font-size:12px;opacity:.5;color:var(--txt)}' +
    '#calbox .calgrid{display:grid;gap:10px;margin-top:11px}' +
    '@media(min-width:620px){#calbox .calgrid{grid-template-columns:1fr 1fr}}' +
    '#calbox .calday{display:flex;gap:11px;background:rgba(233,227,211,.05);' +
      'border:1px solid rgba(233,227,211,.14);border-radius:12px;padding:11px 13px}' +
    '#calbox .calday.today{border-color:var(--gold);background:rgba(212,175,55,.10)}' +
    '#calbox .cd{flex:none;font-family:Georgia,serif;font-size:13px;color:var(--gold);' +
      'min-width:44px;padding-top:1px}' +
    '#calbox .ct{font-family:Georgia,serif;font-size:14.5px;line-height:1.35;margin-bottom:4px}' +
    '#calbox .ct span{opacity:.55;font-size:12.5px;color:var(--txt)}' +
    '#calbox .cdesc{font-size:12.5px;line-height:1.5;opacity:.82}' +
    '#calbox .calday a{display:inline-block;margin-top:6px;font-size:12.5px}' +
    '#calbox .calempty{font-size:12.5px;opacity:.45;margin-top:9px}' +
    '#calbox .calnow{font-size:12.5px;opacity:.75;margin-bottom:4px}';

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function card(mi, day, item, isToday) {
    return '<article class="calday' + (isToday ? ' today' : '') + '">' +
      '<div class="cd">' + pad(day) + '.' + pad(mi + 1) + '</div><div>' +
      '<div class="ct">' + esc(item.t) + (item.y ? ' <span>' + item.y + '</span>' : '') + '</div>' +
      '<div class="cdesc">' + esc(item.d) + '</div>' +
      (item.href ? '<a href="' + item.href + '">' + esc(item.link || 'Открыть →') + '</a>' : '') +
      '</div></article>';
  }

  function start() {
    var box = document.getElementById('calbox');
    if (!box) return;
    var data = window.MUSEUM_CALENDAR || {};
    var today = new Date(), tm = today.getMonth(), td = today.getDate();

    var st = document.createElement('style'); st.textContent = CSS;
    document.head.appendChild(st);

    var h = '', total = 0;
    for (var mi = 0; mi < 12; mi++) {
      var days = '', cnt = 0;
      for (var d = 1; d <= DIM[mi]; d++) {
        var item = data[pad(mi + 1) + '-' + pad(d)];
        if (!item) continue;
        cnt++; total++;
        days += card(mi, d, item, mi === tm && d === td);
      }
      var lbl = cnt
        ? (cnt % 10 === 1 && cnt % 100 !== 11 ? 'занят ' + cnt + ' день' : 'занято ' + cnt + ' дней') +
          ' из ' + DIM[mi]
        : 'дней пока нет';
      h += '<section class="calmon"><div class="calmh">' + MON[mi] + '<i>' + lbl + '</i></div>' +
           (cnt ? '<div class="calgrid">' + days + '</div>' : '') +
           '</section>';
    }
    box.innerHTML = '<div class="calnow">Сегодня ' + td + '.' + pad(tm + 1) +
      ' · заполнено дней в году: <b>' + total + '</b> из 365</div>' + h;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
