/* museum-voice-lab.js — SK-N2 «Мастерская голоса» (согласовано Сергеем 08.09.2026,
   в реестре помечено «сказки; далее литература и музыка»).

   Что делает посетитель: слушает ОДНУ И ТУ ЖЕ строку в нескольких исполнениях и слышит,
   как от паузы и смыслового ударения меняется смысл. Это не «выбери правильное чтение» —
   верного исполнения нет, и движок его не объявляет: у каждого варианта своя честная
   подпись, что именно в нём сделано и что от этого происходит со строкой.

   Зачем отдельный движок, а не аудиогид (museum-audioguide.js). Аудиогид ведёт по РАЗНЫМ
   главам одной дорожки: главы сменяют друг друга, и вернуться к сравнению нельзя. Здесь
   наоборот: фрагмент один, дорожек несколько, и ценность ровно в переключении между ними
   на одном и том же месте. Разные задачи — разные движки (то же основание, по которому
   museum-quiz.js отделён от museum-fact-or-myth.js).

   §6-тер: очки даются за то, что посетитель СРАВНИЛ, то есть послушал не меньше двух
   исполнений, — а не за факт открытия блока. Одно прослушивание очков не даёт, повторные
   не начисляют заново.

   Честность записи: если дорожки синтезированы (edge-tts), это обязано быть написано в note
   и показывается под плеером — как на «Слове о полку Игореве». Выдавать синтез за живое
   чтение запрещено.

   Подключение — внутри пустой секции:
     <section class="block" id="voiceLab"></section>
     ...
     <script>window.MUSEUM_VOICE_LAB = {
       mount: 'voiceLab',                  // id контейнера, по умолчанию 'voiceLab'
       title: 'Одна строка — три голоса',
       lead:  'Послушай, как меняется смысл от паузы и ударения.',
       line:  'Умом Россию не понять, аршином общим не измерить…',   // сам текст строки
       source:'Ф. И. Тютчев, 1866. Текст по ФЭБ',
       points: 20,                         // очки за сравнение, по умолчанию 20
       takes: [
         { label:'Ровно',      audio:'tyutchev-1.mp3',
           what:'Без выделения — строка звучит как спокойная констатация.' },
         { label:'Пауза после «понять»', audio:'tyutchev-2.mp3',
           what:'Пауза разрывает строку надвое: сначала отказ разуму, потом мера.' },
         { label:'Ударение на «общим»', audio:'tyutchev-3.mp3',
           what:'Смысл смещается: не «нельзя измерить вообще», а «нельзя измерить ЧУЖОЙ меркой».' }
       ],
       note: 'Озвучено синтезом речи — временно, до записи голосом.'
     };</script>
     <script src="../../assets/museum-voice-lab.js"></script>

   Очки объявляются в MUSEUM_SCORE:  awards: { voice: 20 }

   Доступность: варианты — <button> (Tab/Enter), у плеера настоящие controls, подпись
   активного исполнения выводится в aria-live. Одновременно звучит только одна дорожка.

   Если контейнера нет, конфига нет, дорожек меньше двух (сравнивать нечего) или секция
   свёрстана руками (есть .vl-box) — движок не делает ничего. */
(function () {
  'use strict';

  function init() {
    var cfg = window.MUSEUM_VOICE_LAB;
    if (!cfg || !cfg.takes || cfg.takes.length < 2) return;   // одно чтение — не сравнение

    var mount = document.getElementById(cfg.mount || 'voiceLab');
    if (!mount || mount.querySelector('.vl-box')) return;

    ensureStyles();

    var points = typeof cfg.points === 'number' ? cfg.points : 20;
    var heard = {};
    var scored = false;

    var box = document.createElement('div');
    box.className = 'vl-box';

    if (cfg.title) {
      var h = document.createElement('h2');
      h.className = 'vl-title';
      h.textContent = cfg.title;
      box.appendChild(h);
    }
    if (cfg.lead) {
      var lead = document.createElement('p');
      lead.className = 'vl-lead';
      lead.textContent = cfg.lead;
      box.appendChild(lead);
    }
    if (cfg.line) {
      var line = document.createElement('blockquote');
      line.className = 'vl-line';
      line.textContent = cfg.line;
      box.appendChild(line);
    }

    var tabs = document.createElement('div');
    tabs.className = 'vl-takes';
    box.appendChild(tabs);

    var audio = document.createElement('audio');
    audio.className = 'vl-audio';
    audio.controls = true;
    audio.preload = 'none';                      // дорожка грузится только по выбору
    box.appendChild(audio);

    var what = document.createElement('div');
    what.className = 'vl-what';
    what.setAttribute('aria-live', 'polite');
    box.appendChild(what);

    cfg.takes.forEach(function (take, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'vl-take';
      b.textContent = take.label || ('Исполнение ' + (i + 1));
      b.addEventListener('click', function () { pick(i, b, take); });
      tabs.appendChild(b);
    });

    if (cfg.note) {
      var note = document.createElement('p');
      note.className = 'vl-note';
      note.textContent = cfg.note;
      box.appendChild(note);
    }
    if (cfg.source) {
      var src = document.createElement('p');
      src.className = 'vl-src';
      src.textContent = cfg.source;
      box.appendChild(src);
    }

    mount.appendChild(box);

    function pick(i, btn, take) {
      Array.prototype.forEach.call(tabs.querySelectorAll('.vl-take'), function (b) {
        b.classList.toggle('is-on', b === btn);
      });

      if (take.audio) {
        audio.src = take.audio;
        var played = audio.play();
        if (played && typeof played.catch === 'function') played.catch(function () {});
      }

      what.textContent = take.what || '';
      what.classList.add('is-on');

      heard[i] = true;
      if (!scored && Object.keys(heard).length >= 2) {      // очки за сравнение, не за открытие
        scored = true;
        if (typeof window.award === 'function') window.award('voice', points);
      }
    }
  }

  function ensureStyles() {
    if (document.getElementById('vl-styles')) return;
    var s = document.createElement('style');
    s.id = 'vl-styles';
    s.textContent = [
      '.vl-box{margin-top:18px}',
      '.vl-title{margin:0 0 6px}',
      '.vl-lead{color:var(--muted,#a89a80);margin:0 0 14px;max-width:62ch}',
      '.vl-line{margin:0 0 16px;padding:14px 18px;border-left:3px solid var(--acc,#c9a84c);',
      'font-size:20px;line-height:1.6;max-width:62ch;font-style:italic}',
      '.vl-takes{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}',
      '.vl-take{font:inherit;color:inherit;cursor:pointer;padding:10px 14px;border-radius:10px;',
      'border:1px solid var(--acc-soft,rgba(201,168,76,.16));background:transparent}',
      '.vl-take:hover{border-color:var(--acc,#c9a84c)}',
      '.vl-take:focus-visible{outline:2px solid var(--acc,#c9a84c);outline-offset:2px}',
      '.vl-take.is-on{border-color:var(--acc,#c9a84c);background:var(--acc-soft,rgba(201,168,76,.16));font-weight:600}',
      '.vl-audio{width:100%;max-width:62ch;display:block}',
      '.vl-what{margin-top:12px;display:none;line-height:1.55;max-width:62ch;color:var(--muted,#a89a80)}',
      '.vl-what.is-on{display:block}',
      '.vl-note{margin-top:12px;font-size:13px;color:var(--muted,#a89a80);opacity:.85}',
      '.vl-src{margin-top:6px;font-size:13px;color:var(--muted,#a89a80);opacity:.85}'
    ].join('');
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
