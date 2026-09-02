(function(){
  'use strict';
  const stones=[
    {name:'Грифон',zone:'north',certainty:'confirmed',text:'Часть северного фасада сохранилась ближе к первоначальному порядку. Здесь мы показываем подтверждённую зону, а не точную координату камня.'},
    {name:'Святой воин',zone:'west',certainty:'plausible',text:'Композиционная связь допустима по исследованиям, но точное место блока не доказано.'},
    {name:'Растительный плетень',zone:'unknown',certainty:'unknown',text:'Орнамент принадлежит резному ковру собора, однако исходное положение отдельного блока неизвестно.'}
  ];
  const bank=document.querySelector('#stone-bank');
  const zones=[...document.querySelectorAll('[data-zone]')];
  const result=document.querySelector('#placement-result');
  const progress=document.querySelector('#placement-progress');
  const restart=document.querySelector('#placement-restart');
  let active=0,placed=0;
  function select(i){active=i;[...bank.querySelectorAll('.stone')].forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));result.innerHTML=`<strong>${stones[i].name}</strong> Выбери зону фасада. Здесь проверяется не память, а граница уверенности.`;}
  stones.forEach((stone,i)=>{const b=document.createElement('button');b.type='button';b.className='stone';b.textContent=`${i+1}. ${stone.name}`;b.addEventListener('click',()=>select(i));bank.append(b);});
  zones.forEach(zone=>zone.addEventListener('click',()=>{
    const stone=stones[active];const chosen=zone.dataset.zone;const exact=stone.zone===chosen;
    const labels={confirmed:'Подтверждено сохранившейся частью',plausible:'Допустимая реконструкция',unknown:'Исходное место неизвестно'};
    zone.classList.toggle('is-filled',exact);zone.textContent=exact?stone.name:zone.dataset.label;
    result.innerHTML=`<strong>${labels[stone.certainty]}</strong>${stone.text}${exact?'':' Выбранная зона не подтверждается: попробуй другую.'}`;
    if(exact){placed=Math.max(placed,active+1);progress.textContent=`Разобрано ${placed} из 3 блоков`;if(active<2)select(active+1);else{restart.hidden=false;document.dispatchEvent(new CustomEvent('museum:route-success'));window.rcGoal?.('rc_game_complete',{game:'georgievskiy_relief_map',total:3});}}
  }));
  restart?.addEventListener('click',()=>{placed=0;zones.forEach(z=>{z.classList.remove('is-filled');z.textContent=z.dataset.label;});restart.hidden=true;progress.textContent='Разобрано 0 из 3 блоков';select(0);});
  if(bank)select(0);
  document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector(button.dataset.route==='short'?'#relief-lab':'#four-scales')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}));
  const quiz=[...document.querySelectorAll('[data-quiz]')];quiz.forEach(button=>button.addEventListener('click',()=>{const box=document.querySelector('#quiz-feedback');const right=button.dataset.quiz==='unknown';box.innerHTML=right?'<strong>Верно.</strong> Исследование может сузить варианты, но не превращает утраченную схему в установленный факт.':'<strong>Проверь ещё раз.</strong> Перестройка известна, но точный исходный порядок всех рельефов не восстановлен.';}));
  document.addEventListener('museum:media-loaded',event=>{const video=event.target.querySelector?.('video');if(video){video.load();video.play().catch(()=>{});}});
})();
