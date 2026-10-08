/* museum-choice-tale.js — M-20 «Что бы выбрал ты?»
   Ситуационная история без оценки правильности. Посетитель проходит подвиг по шагам,
   на каждом шаге делает выбор, в конце — не балл и не «верно/неверно», а «вес выбора»:
   какой выбор он делал чаще и что этот выбор значит, плюс честный факт-якорь — что
   сделали герои на самом деле.

   Конфиг (перед подключением движка):
     window.MUSEUM_CHOICE_TALE = {
       mount: 'choiceTale',           // id контейнера
       title: 'Что бы выбрал ты?',
       lead:  '...',                  // 1–2 фразы ввода
       steps: [
         { text:'...', choices:[ {label:'...', tag:'лечь'}, {label:'...', tag:'встать'} ] },
       ],
       weights: { 'лечь':'…', 'отступить':'…', 'встать':'…' },  // смысл каждого выбора
       reality: { label:'А они сделали так', text:'…' }          // факт-якорь
     };

   Разметка руками не пишется — движок рендерит всё в контейнер. Стили — самодостаточные
   (вставляются один раз), цвета из CSS-переменных темы с фолбэком. */
(function () {
  'use strict';
  function init() {
    var cfg = window.MUSEUM_CHOICE_TALE;
    if (!cfg || !cfg.mount) return;
    var mount = document.getElementById(cfg.mount);
    if (!mount) return;

    ensureStyles();

    var chosen = [];
    var idx = 0;

    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function dominantTag() {
      var cnt = {};
      chosen.forEach(function (t) { cnt[t] = (cnt[t] || 0) + 1; });
      var best = null, bestN = -1;
      for (var t in cnt) if (cnt[t] > bestN) { bestN = cnt[t]; best = t; }
      return best;
    }

    function render() {
      if (idx < cfg.steps.length) {
        var s = cfg.steps[idx];
        var html = '';
        html += '<div class="ct-progress">Шаг ' + (idx + 1) + ' из ' + cfg.steps.length + '</div>';
        html += '<p class="ct-text">' + esc(s.text) + '</p>';
        html += '<div class="ct-choices">';
        s.choices.forEach(function (c, i) {
          html += '<button type="button" class="ct-choice" data-i="' + i + '"><span class="ct-k">' +
            'АБВГДЕ'[i] + '</span>' + esc(c.label) + '</button>';
        });
        html += '</div>';
        mount.innerHTML = html;
        bindChoices(s);
      } else {
        renderEnd();
      }
    }

    function bindChoices(s) {
      [].forEach.call(mount.querySelectorAll('.ct-choice'), function (btn) {
        btn.addEventListener('click', function () {
          var c = s.choices[+btn.dataset.i];
          chosen.push(c.tag);
          idx++;
          render();
        });
      });
    }

    function renderEnd() {
      var dom = dominantTag();
      var pathTxt = chosen.map(function (t) {
        return { 'лечь': 'лечь', 'отступить': 'отойти', 'встать': 'встать' }[t] || t;
      }).join(' → ');
      var html = '';
      html += '<div class="ct-progress">Финал</div>';
      html += '<div class="ct-end">';
      html += '<div class="ct-verdict"><span class="ct-lbl">Твой путь</span>' + esc(pathTxt || '—') + '</div>';
      if (dom && cfg.weights && cfg.weights[dom]) {
        html += '<p class="ct-weight">' + esc(cfg.weights[dom]) + '</p>';
      }
      html += '<p class="ct-note">В этом зале нет правильного ответа — есть только цена каждого выбора. И есть то, что выбрали они.</p>';
      html += '<div class="ct-reality"><b>' + esc(cfg.reality.label || 'А они сделали так') + '</b> ' + esc(cfg.reality.text) + '</div>';
      html += '<button type="button" class="ct-reset">Пройти заново</button>';
      html += '</div>';
      mount.innerHTML = html;
      mount.querySelector('.ct-reset').addEventListener('click', function () {
        chosen = []; idx = 0; render();
      });
      if (typeof window.rcEvent === 'function') { try { window.rcEvent('rc_game', { mechanic: 'M-20' }); } catch (e) {} }
    }

    render();
  }

  function ensureStyles() {
    if (document.getElementById('ct-style')) return;
    var css = [
      '#choiceTale{position:relative}',
      '.ct-progress{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8a93a6);margin-bottom:12px}',
      '.ct-text{font-size:18px;line-height:1.6;max-width:64ch;margin:0 0 18px}',
      '.ct-choices{display:flex;flex-direction:column;gap:10px;max-width:64ch}',
      '.ct-choice{display:flex;align-items:center;gap:12px;text-align:left;background:var(--surface,#0d1626);border:1px solid rgba(201,168,76,.28);color:var(--fg,#e8ecf4);padding:13px 15px;border-radius:10px;font-size:16px;line-height:1.45;cursor:pointer;transition:border-color .18s,background .18s}',
      '.ct-choice:hover,.ct-choice:focus-visible{border-color:var(--gold,#c9a84c);background:rgba(201,168,76,.07)}',
      '.ct-k{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;border:1px solid var(--gold,#c9a84c);color:var(--gold,#c9a84c);font-size:13px;font-weight:700}',
      '.ct-end{max-width:64ch}',
      '.ct-verdict{font-size:15px;color:var(--muted,#8a93a6);margin-bottom:12px}',
      '.ct-verdict .ct-lbl{display:inline-block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-right:10px;color:var(--muted,#8a93a6)}',
      '.ct-verdict{font-size:17px;color:var(--fg,#e8ecf4);font-weight:600}',
      '.ct-weight{margin:0 0 12px;font-size:16px;line-height:1.6}',
      '.ct-note{font-size:14px;color:var(--muted,#8a93a6);margin:0 0 16px}',
      '.ct-reality{background:rgba(201,168,76,.08);border-left:3px solid var(--gold,#c9a84c);padding:14px 16px;border-radius:8px;font-size:16px;line-height:1.6;margin-bottom:16px}',
      '.ct-reset{background:none;border:1px solid rgba(201,168,76,.4);color:var(--gold,#c9a84c);padding:9px 18px;border-radius:8px;font-size:14px;cursor:pointer;transition:background .18s}',
      '.ct-reset:hover{background:rgba(201,168,76,.12)}'
    ].join('\n');
    var st = document.createElement('style');
    st.id = 'ct-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
