/* museum-audioguide.js — единый виджет аудиогида для всех музеев.
   Эталон разметки и поведения — izobreteniya/day-05jan-shukhov.html (аудит 03.08/05.08).

   Даёт: круглую кнопку play/pause, автотайтл длительности по metadata,
   навигацию по остановкам с подсветкой текущей, разворачиваемый текст экскурсии.

   Подключение — вместо копии HTML/CSS/JS в теле страницы, внутри пустой секции:
     <section class="block" id="audioguide"></section>
     ...
     <script>window.MUSEUM_AUDIOGUIDE={
       audioSrc:'audio-guide-shukhov-ru.mp3',
       heading:'Пройти зал с экскурсоводом',                       // необязательно
       durationLabel:'5 минут 52 секунды',                          // видно до loadedmetadata, потом пересчитывается
       lead:'Голос ведёт от каравана бочек в Баку до гиперболоидной башни…',
       stops:[{t:0,mark:'0:00',title:'Зал чёрного золота'}, {t:49,mark:'0:49',title:'…'}],
       transcript:['<p>«Мы входим в зал чёрного золота…</p>','<p>…</p>'],
       note:'Озвучено синтезом речи — временно, до записи голосом автора музея.'
     };</script>
     <script src="../assets/museum-audioguide.js"></script>

   Если #audioguide не найден, конфига нет, или секция уже свёрстана вручную (есть .agbox) —
   движок ничего не делает и не трогает страницу.
*/
(function(){
  var CFG = window.MUSEUM_AUDIOGUIDE;
  if(!CFG || !CFG.audioSrc) return;
  var host = document.getElementById('audioguide');
  if(!host || host.querySelector('.agbox')) return;

  var css = ''
  + '.agbox{background:linear-gradient(180deg,rgba(201,168,76,.10),rgba(201,168,76,.03));'
  + 'border:1px solid rgba(201,168,76,.32);border-radius:18px;padding:22px 24px}'
  + '.agtop{display:flex;align-items:center;gap:16px}'
  + '.agbtn{flex-shrink:0;width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;'
  + 'background:linear-gradient(135deg,var(--gold),#b8882b);color:#1a0f00;font-size:20px;'
  + 'box-shadow:0 4px 20px rgba(201,168,76,.3);transition:.18s}'
  + '.agbtn:hover{filter:brightness(1.12);transform:scale(1.04)}'
  + '.agttl{font-family:\'Playfair Display\',Georgia,serif;font-size:23px;color:#fff;line-height:1.2}'
  + '.agsub{font-size:14px;color:var(--muted);margin-top:5px;line-height:1.55;max-width:60ch}'
  + '.agnav{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}'
  + '.agnav .lbl{width:100%;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--gold);'
  + 'font-family:\'Inter\',sans-serif;font-weight:700;margin-bottom:2px}'
  + '.agnav button{background:rgba(255,255,255,.05);border:1px solid var(--card-b);border-radius:20px;'
  + 'padding:7px 15px;font-size:13px;color:var(--muted);cursor:pointer;font-family:\'Inter\',sans-serif;transition:.16s}'
  + '.agnav button:hover{border-color:var(--gold);color:var(--gold)}'
  + '.agnav button.on{background:var(--gold-g);border-color:var(--gold);color:var(--gold-l);font-weight:600}'
  + '.agnav button i{font-style:normal;font-family:var(--mono);font-size:11px;opacity:.65;margin-right:6px}'
  + '.agtext{margin-top:16px}'
  + '.agtext summary{cursor:pointer;font-family:\'Inter\',sans-serif;font-size:12px;letter-spacing:1.5px;'
  + 'text-transform:uppercase;color:var(--gold);font-weight:700;list-style:none}'
  + '.agtext summary::-webkit-details-marker{display:none}'
  + '.agtext[open] summary{margin-bottom:10px;opacity:.7}'
  + '.agtext p{font-size:14.5px;color:var(--muted);margin:9px 0}'
  + '@media(max-width:600px){.agbox{padding:18px 16px}.agttl{font-size:19px}.agbtn{width:50px;height:50px;font-size:17px}}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function esc(s){ return String(s==null?'':s); }

  var stopsHtml = (CFG.stops||[]).map(function(s){
    return '<button data-t="'+s.t+'"><i>'+esc(s.mark)+'</i>'+esc(s.title)+'</button>';
  }).join('');

  host.classList.add('block');
  host.innerHTML =
    '<div class="wrap">'
    + '<div class="kicker">Аудиогид музея</div>'
    + '<h2 style="margin-bottom:14px">'+esc(CFG.heading||'Пройти зал с экскурсоводом')+'</h2>'
    + '<div class="agbox">'
      + '<div class="agtop">'
        + '<button class="agbtn" id="agbtn" aria-label="Включить аудиогид">▶</button>'
        + '<div>'
          + '<div class="agttl">Весь зал за <span id="agdur">'+esc(CFG.durationLabel||'…')+'</span></div>'
          + '<div class="agsub">'+esc(CFG.lead||'')+'</div>'
        + '</div>'
      + '</div>'
      + '<audio id="agaudio" data-src="'+esc(CFG.audioSrc)+'" preload="none" controls style="width:100%;margin:14px 0 0;border-radius:10px;display:none"></audio>'
      + '<div class="agnav"><span class="lbl">Перейти к остановке:</span>'+stopsHtml+'</div>'
      + (CFG.transcript && CFG.transcript.length ? '<details class="agtext"><summary>Текст экскурсии — читать глазами</summary>'+CFG.transcript.join('')+'</details>' : '')
      + (CFG.note ? '<p style="font-size:12px;color:var(--muted);opacity:.75;margin:14px 0 0">'+esc(CFG.note)+'</p>' : '')
    + '</div>'
    + '</div>';

  var b=document.getElementById('agbtn'), a=document.getElementById('agaudio');
  if(!b||!a) return;
  function ensureAudio(){
    if(!a.getAttribute('src')){
      a.setAttribute('src',a.dataset.src);
      a.load();
    }
  }
  b.addEventListener('click',function(){ if(a.paused){ensureAudio();a.play();}else a.pause(); });
  a.addEventListener('play',function(){ b.textContent='❚❚'; a.style.display='block'; });
  a.addEventListener('pause',function(){ b.textContent='▶'; });
  a.addEventListener('ended',function(){ b.textContent='▶'; });
  a.addEventListener('loadedmetadata',function(){
    var d=a.duration; if(!isFinite(d))return;
    var m=Math.floor(d/60), s=Math.round(d%60); if(s===60){m++;s=0;}
    var el=document.getElementById('agdur');
    if(el)el.textContent=m+' мин '+(s<10?'0':'')+s+' сек';
  });
  var btns=host.querySelectorAll('.agnav button');
  btns.forEach(function(btn){
    btn.addEventListener('click',function(){
      ensureAudio();
      var targetTime=parseInt(btn.dataset.t,10);
      if(a.readyState>=1) a.currentTime=targetTime;
      else a.addEventListener('loadedmetadata',function seek(){a.currentTime=targetTime;},{once:true});
      a.play();
      btns.forEach(function(x){x.classList.remove('on');});
      btn.classList.add('on');
    });
  });
  a.addEventListener('timeupdate',function(){
    var t=a.currentTime, cur=null;
    btns.forEach(function(x){ if(parseInt(x.dataset.t,10)<=t) cur=x; });
    if(cur&&!cur.classList.contains('on')){
      btns.forEach(function(x){x.classList.remove('on');});
      cur.classList.add('on');
    }
  });
})();
