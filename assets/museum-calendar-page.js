/* Страница-календарь музея — общий движок для ВСЕХ музеев.
   Рисует год целиком: 12 месяцев, сетка дней, заполненные дни — золотые и кликабельные.
   Данные берёт из window.MUSEUM_CALENDAR (файл музея calendar-<тема>.js).

   Подключение:
     <div id="calyear"></div><div id="calcard"></div>
     <script src="calendar-<тема>.js"></script>
     <script src="../assets/museum-calendar-page.js"></script>  */
(function () {
  var MON = ['Январь','Февраль','Март','Апрель','Май','Июнь',
             'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  var MONR = ['января','февраля','марта','апреля','мая','июня',
              'июля','августа','сентября','октября','ноября','декабря'];
  var DAYS = [31,29,31,30,31,30,31,31,30,31,30,31];

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function start() {
    var host = document.getElementById('calyear');
    var card = document.getElementById('calcard');
    if (!host && !card) return;   // страница без календаря вовсе

    var data = window.MUSEUM_CALENDAR || {};
    var today = new Date(), tk = pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    var filled = Object.keys(data).length;

    var h = '<div class="calstat">Заполнено дней: <b>' + filled + '</b> из 365 · ' +
            'каждый заполненный день — готовый повод для ролика и поста</div>';

    /* годовая сетка рисуется только там, где для неё есть место (#calyear).
       На витрине музея его нет — там живёт одна карточка сегодняшнего дня. */
    for (var m = 0; host && m < 12; m++) {
      var cnt = 0, cells = '';
      for (var d = 1; d <= DAYS[m]; d++) {
        var k = pad(m + 1) + '-' + pad(d);
        var it = data[k];
        if (it) cnt++;
        cells += '<button class="cday' + (it ? ' full' : '') + (k === tk ? ' today' : '') + '"' +
                 (it ? ' data-k="' + k + '"' : ' disabled') +
                 ' title="' + (it ? it.t.replace(/"/g, '') : 'запись готовится') + '">' + d + '</button>';
      }
      h += '<section class="cmon"><h2>' + MON[m] +
           '<span class="cnt">' + (cnt ? cnt + ' ' + (cnt === 1 ? 'запись' : 'записи') : '—') + '</span></h2>' +
           '<div class="cgrid">' + cells + '</div></section>';
    }
    if (host) host.innerHTML = h;

    function show(k) {
      var it = data[k];
      if (!it || !card) return;
      var mm = parseInt(k.slice(0, 2), 10), dd = parseInt(k.slice(3), 10);
      card.innerHTML = '<div class="cdate">' + dd + ' ' + MONR[mm - 1] +
        (k === tk ? ' · <b>сегодня</b>' : '') + '</div>' +
        '<h3>' + it.t + (it.y ? ' <span class="caly">' + it.y + '</span>' : '') + '</h3>' +
        '<p>' + it.d + '</p>' +
        (it.href ? '<a href="' + it.href + '">' + (it.link || 'Открыть →') + '</a>' : '');
      card.style.display = 'block';
      if (host) {
        host.querySelectorAll('.cday').forEach(function (b) { b.classList.remove('on'); });
        var b = host.querySelector('.cday[data-k="' + k + '"]');
        if (b) b.classList.add('on');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    if (host) host.querySelectorAll('.cday[data-k]').forEach(function (b) {
      b.addEventListener('click', function () { show(b.dataset.k); });
    });

    /* при открытии показываем сегодняшний день, иначе первый заполненный */
    var keys = Object.keys(data).sort();
    if (data[tk]) show(tk);
    else if (keys.length) show(keys[0]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
