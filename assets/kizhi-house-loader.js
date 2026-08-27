(function(){
  'use strict';
  var root=document.querySelector('[data-house3d]'),button=root&&root.querySelector('[data-house3d-start]');if(!button)return;
  button.addEventListener('click',function load(){button.disabled=true;button.textContent='Загружаю испытание…';import('./kizhi-house-3d.js?v=20260827-4').catch(function(){button.textContent='3D не загрузилось — открыть текстовую схему';button.disabled=false;var alt=document.querySelector('.house3d-alt');if(alt)alt.open=true})},{once:true});
})();
