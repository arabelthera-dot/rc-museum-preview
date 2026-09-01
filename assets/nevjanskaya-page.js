(function(){
  'use strict';
  const range=document.querySelector('#plumb-range');
  const progress=document.querySelector('#plumb-progress');
  const result=document.querySelector('#plumb-result');
  const tiers=[...document.querySelectorAll('.tier')];
  const marker=document.querySelector('#axis-marker');
  const connector=document.querySelector('#axis-connector');
  const routeProgress=document.querySelector('#short-route-progress');
  const routeProgressText=routeProgress?.querySelector('span');
  const routeButtons=[...document.querySelectorAll('[data-route]')];
  let shortRoute=false;
  const observations=[
    ['Основание · отклонено сильнее','Тяжёлый квадратный четверик заметнее всего отходит от отвеса. Это наблюдаемая форма, а не доказательство её причины.',[202,470],[172,440,232,500]],
    ['Переход · ось меняет направление','Выше линия оси начинает возвращаться к отвесу. Именно здесь силуэт перестаёт читаться как одна наклонная прямая.',[190,350],[163,337,223,367]],
    ['Верхние ярусы · ближе к вертикали','Восьмигранные ярусы заметно прямее основания. Видимый изгиб можно проверить, не принимая объясняющую версию за факт.',[197,235],[167,229,227,241]],
    ['Шпиль · почти вертикален','Верх завершает обратное движение. Версия связывает форму с осадкой основания и корректировкой верхней кладки; прямого строительного документа об этом нет.',[198,95],[198,65,198,125]]
  ];
  function showStage(value){
    const n=Number(value);
    tiers.forEach((tier,i)=>tier.classList.toggle('is-active',i===3-n));
    progress.textContent=`Наблюдение ${n+1} из 4`;
    result.innerHTML=`<strong>${observations[n][0]}</strong><p>${observations[n][1]}</p>`;
    range?.setAttribute('aria-valuetext',`${observations[n][0]}, ${n+1} из 4`);
    const [x,y]=observations[n][2];
    const [x1,y1,x2,y2]=observations[n][3];
    marker?.setAttribute('cx',x); marker?.setAttribute('cy',y);
    connector?.setAttribute('x1',x1); connector?.setAttribute('y1',y1);
    connector?.setAttribute('x2',x2); connector?.setAttribute('y2',y2);
    if(shortRoute&&routeProgressText)routeProgressText.textContent=n===3?'2/3 · рассмотри четыре масштаба и сформулируй вывод':'1/3 · проведи отвес до шпиля';
    document.dispatchEvent(new CustomEvent(n===3?'museum:route-success':'museum:route-reset'));
    if(n===3&&window.rcGoal)window.rcGoal('rc_game_complete',{game:'nevjansk_plumb',total:4});
  }
  if(range){range.addEventListener('input',e=>showStage(e.target.value));showStage(range.value);}

  document.addEventListener('museum:media-loaded',event=>{
    const video=event.target.querySelector?.('video');
    if(!video)return;
    video.load(); video.play().catch(()=>{});
  });

  routeButtons.forEach(button=>button.addEventListener('click',()=>{
    routeButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    shortRoute=button.dataset.route==='short';
    if(routeProgress)routeProgress.hidden=!shortRoute;
    const freeMap=document.querySelector('#free-route-map');
    if(freeMap)freeMap.hidden=shortRoute;
    const shortConclusion=document.querySelector('#short-conclusion');
    if(shortConclusion)shortConclusion.hidden=!shortRoute;
    if(shortRoute&&routeProgressText)routeProgressText.textContent='1/3 · проведи отвес до шпиля';
    const target=shortRoute?'#plumb':'#free-route-map';
    document.querySelector(target)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }));

  const conclusion=document.querySelector('#visitor-conclusion');
  const conclusionButton=document.querySelector('#check-conclusion');
  const conclusionFeedback=document.querySelector('#conclusion-feedback');
  const conclusionActions=document.querySelector('#conclusion-actions');
  conclusionButton?.addEventListener('click',()=>{
    const answer=conclusion.value.trim();
    if(answer.length<12){
      conclusionFeedback.textContent='Добавь хотя бы одно наблюдение: что происходит с основанием, ярусами или шпилем.';
      conclusion.focus(); return;
    }
    conclusionFeedback.innerHTML='<strong>Сравни:</strong> низ отклонён сильнее, выше ось меняет направление, а шпиль ближе к вертикали. Причину мы называем версией, пока нет прямого строительного документа.';
    conclusionActions.hidden=false;
    if(shortRoute&&routeProgressText)routeProgressText.textContent='3/3 · вывод собран, короткий маршрут завершён';
    if(window.rcGoal)window.rcGoal('rc_route_complete',{route:'nevjansk_short'});
  });

  const gameData=[
    {text:'Высота Невьянской башни — 57,5 метра.',answer:'fact',explain:'Размер опубликован в официальной карточке памятника и музейном издании.'},
    {text:'Башню намеренно наклонили в сторону Тулы как поклон родине Демидовых.',answer:'legend',explain:'Это выразительный рассказ, но прямого документального подтверждения у него нет.'},
    {text:'Наблюдения 1991 года не показали продолжающегося падения башни.',answer:'fact',explain:'По опубликованным наблюдениям башню относят к наклонным, а не падающим.'},
    {text:'В затопленных подвалах чеканили тайные деньги и погубили свидетелей.',answer:'legend',explain:'История живёт как легенда; страница не выдаёт её за установленное событие.'}
  ];
  const statement=document.querySelector('#game-statement');
  const gameProgress=document.querySelector('#game-progress');
  const feedback=document.querySelector('#game-feedback');
  const choices=[...document.querySelectorAll('[data-game-choice]')];
  const next=document.querySelector('#game-next');
  const restart=document.querySelector('#game-restart');
  const log=document.querySelector('#game-log');
  let gameIndex=0,score=0,attempted=false,settled=false;
  function renderGame(){
    const item=gameData[gameIndex];
    gameProgress.textContent=`Утверждение ${gameIndex+1} из ${gameData.length}`;
    statement.textContent=item.text;
    feedback.textContent='Выбери: это установлено источниками или живёт как легенда?';
    choices.forEach(button=>{button.disabled=false;button.removeAttribute('aria-pressed');});
    next.hidden=true;restart.hidden=true;attempted=false;settled=false;
  }
  choices.forEach(button=>button.addEventListener('click',()=>{
    if(settled)return;
    const item=gameData[gameIndex];
    const right=button.dataset.gameChoice===item.answer;
    choices.forEach(choice=>{choice.setAttribute('aria-pressed','false');choice.removeAttribute('aria-invalid');choice.classList.remove('is-wrong');});
    button.setAttribute('aria-pressed','true');
    if(!right){attempted=true;button.setAttribute('aria-invalid','true');button.classList.add('is-wrong');feedback.innerHTML=`<strong>Попробуй ещё раз.</strong> ${item.explain}`;return;}
    settled=true;if(!attempted)score++;
    choices.forEach(choice=>choice.disabled=true);
    feedback.innerHTML=`<strong>${item.answer==='fact'?'Факт':'Легенда'}.</strong> ${item.explain}`;
    const entry=document.createElement('li');
    entry.innerHTML=`<strong>${item.answer==='fact'?'Факт':'Легенда'}:</strong> ${item.explain}`;
    log.append(entry);
    if(gameIndex<gameData.length-1)next.hidden=false;
    else{
      gameProgress.textContent=`Готово · ${score} из ${gameData.length} без подсказки`;
      restart.hidden=false;
      if(window.rcGoal)window.rcGoal('rc_game_complete',{game:'nevjansk_fact_legend',score,total:gameData.length});
    }
  }));
  next?.addEventListener('click',()=>{gameIndex++;renderGame();});
  restart?.addEventListener('click',()=>{gameIndex=0;score=0;log.replaceChildren();renderGame();});
  if(statement)renderGame();

  const lab=document.querySelector('#plumb');
  if(lab&&'IntersectionObserver' in window){
    new IntersectionObserver(entries=>document.body.classList.toggle('nv-interactive-visible',entries.some(entry=>entry.isIntersecting)),{threshold:.15}).observe(lab);
  }
})();
