(function(){
  'use strict';
  const range=document.querySelector('#plumb-range');
  const progress=document.querySelector('#plumb-progress');
  const result=document.querySelector('#plumb-result');
  const tiers=[...document.querySelectorAll('.tier')];
  const gate=document.querySelector('[data-route-gate]');
  const observations=[
    ['Основание · около 3°','Сильнее всего отклонён тяжёлый квадратный четверик. Наклон начался в нижней части, а не одинаково по всей высоте.'],
    ['Переход · около 1°','Выше направление кладки меняется: строители постепенно возвращают ярусы к отвесу.'],
    ['Звон · почти вертикально','Восьмигранные ярусы уже заметно прямее основания. Силуэт изгибается, а не падает одной прямой линией.'],
    ['Шпиль · вертикаль','Верх завершает обратное движение. Башня читается как очень пологая сабля: низ ушёл, верх выправлен.']
  ];
  function showStage(value){
    const n=Number(value);
    tiers.forEach((tier,i)=>tier.classList.toggle('is-active',i===3-n));
    progress.textContent=`Наблюдение ${n+1} из 4`;
    result.innerHTML=`<strong>${observations[n][0]}</strong><p>${observations[n][1]}</p>`;
    document.dispatchEvent(new CustomEvent(n===3?'museum:route-success':'museum:route-reset'));
    if(n===3&&window.rcGoal)window.rcGoal('rc_game_complete',{game:'nevjansk_plumb',total:4});
  }
  if(range){range.addEventListener('input',e=>showStage(e.target.value));showStage(range.value);}
  document.addEventListener('museum:media-loaded',event=>{
    const video=event.target.querySelector?.('video');
    if(!video)return;
    video.load();
    video.play().catch(()=>{});
  });
  document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>{
    const target=button.dataset.route==='short'?'#plumb':'#four-scales';
    document.querySelector(target)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }));
  const quizButtons=[...document.querySelectorAll('[data-quiz]')];
  const quizFeedback=document.querySelector('#quiz-feedback');
  let answered=new Set(),score=0;
  quizButtons.forEach(button=>button.addEventListener('click',()=>{
    const id=button.dataset.quiz;
    if(answered.has(id))return;
    answered.add(id);
    const right=button.dataset.answer==='fact';
    if(right)score++;
    button.setAttribute('aria-pressed','true');
    quizFeedback.innerHTML=`<strong>${right?'Факт':'Легенда'}</strong> · ${button.dataset.explain}<br><small>${answered.size}/4, доказанных ответов: ${score}</small>`;
    if(answered.size===4&&window.rcGoal)window.rcGoal('rc_game_complete',{game:'nevjansk_fact_legend',score,total:4});
  }));
})();
