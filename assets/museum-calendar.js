/* Календарь музея — общий механизм для ВСЕХ музеев «Русской цивилизации».
   Стандарт введён 29.07.2026: внизу каждой страницы музея — блок «этот день».
   Нужен для ежедневных роликов и продвижения: у любого дня есть свой повод.

   Как подключить на странице:
     <section id="calendar"><h2 class="t"><small>Календарь музея</small>…</h2>
       <div id="calbox"></div></section>
     <script src="../assets/museum-calendar.js"></script>
     <script src="calendar-art.js"></script>   // данные конкретного музея

   Формат данных (файл музея задаёт window.MUSEUM_CALENDAR):
     window.MUSEUM_CALENDAR = {
       "07-29": {t:"Заголовок", y:1817, d:"Текст в 2–3 предложения.",
                 href:"pic-....html", link:"Подпись ссылки"},
       ...
     };
   Ключ — "ММ-ДД" по новому стилю. Поля y, href, link необязательны. */
(function () {
  var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
             'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function key(d) {
    return ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function human(d) { return d.getDate() + ' ' + MON[d.getMonth()]; }

  /* ближайший заполненный день, начиная с завтрашнего */
  function nextFilled(from, data) {
    var d = new Date(from);
    for (var i = 1; i <= 366; i++) {
      d.setDate(d.getDate() + 1);
      if (data[key(d)]) return { date: new Date(d), item: data[key(d)] };
    }
    return null;
  }

  function render(box, cur, today, data) {
    var k = key(cur), item = data[k], isToday = key(today) === k;
    var h = '<div class="calnav">' +
      '<button class="calarrow" data-step="-1" aria-label="Предыдущий день">‹</button>' +
      '<span class="caldate">' + human(cur) + (isToday ? ' <b>· сегодня</b>' : '') + '</span>' +
      '<button class="calarrow" data-step="1" aria-label="Следующий день">›</button></div>';

    if (item) {
      h += '<div class="calcard"><h3>' + item.t +
           (item.y ? ' <span class="caly">' + item.y + '</span>' : '') + '</h3>' +
           '<p>' + item.d + '</p>' +
           (item.href ? '<a href="' + item.href + '">' + (item.link || 'Открыть →') + '</a>' : '') +
           '</div>';
    } else {
      var n = nextFilled(cur, data);
      h += '<div class="calcard empty"><h3>На этот день запись ещё готовится</h3>' +
           '<p>Календарь музея наполняется: к каждому дню года мы привязываем день рождения художника, ' +
           'дату создания картины или событие, с которого всё началось.' +
           (n ? ' Ближайшая заполненная дата — <b>' + human(n.date) + '</b>: ' + n.item.t + '.' : '') +
           '</p></div>';
    }
    box.innerHTML = h;
    box.querySelectorAll('.calarrow').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = new Date(cur);
        d.setDate(d.getDate() + parseInt(b.dataset.step, 10));
        render(box, d, today, data);
      });
    });
  }

  function start() {
    var box = document.getElementById('calbox');
    if (!box) return;
    var data = window.MUSEUM_CALENDAR || {};
    var today = new Date();
    render(box, today, today, data);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
