/* Reorder a documentary photograph. No reconstruction of the object is implied. */
(()=>{'use strict';document.querySelectorAll('[data-photo-order]').forEach(root=>{
 const host=root.querySelector('.order-pieces'),feedback=root.querySelector('[data-order-feedback]');
 let order=[2,0,1],moves=0;try{if(JSON.parse(localStorage.getItem('rc-chest-v2')||'{}').earned?.includes('main')){order=[0,1,2];moves=1;root.classList.add('complete');feedback.textContent='Сборка сохранена. Девять отделений, восемь ящиков.'}}catch{};
 function paint(){host.replaceChildren();order.forEach((part,pos)=>{
  const item=document.createElement('figure'),visual=document.createElement('div'),img=document.createElement('img'),caption=document.createElement('figcaption');
  visual.className='order-fragment';img.src=root.dataset.image;img.alt='Фрагмент подлинного снимка внутренних ящиков';img.style.top=(-part*100)+'%';visual.append(img);item.append(visual);
  caption.append(document.createTextNode('Место '+(pos+1)+' '));
  for(const [label,delta] of [['↑ Выше',-1],['↓ Ниже',1]]){const b=document.createElement('button');b.textContent=label;b.disabled=pos+delta<0||pos+delta>2;b.setAttribute('aria-label',label+' фрагмент с места '+(pos+1));b.addEventListener('click',()=>{[order[pos],order[pos+delta]]=[order[pos+delta],order[pos]];moves++;paint();host.children[pos+delta].querySelector('button:not(:disabled)')?.focus({preventScroll:true});feedback.textContent='Фрагмент перемещён. Проверь непрерывность фасадов и рамки.'});caption.append(b)}
  item.append(caption);host.append(item);
 });}
 root.querySelector('[data-order-check]').onclick=()=>{if(moves>0&&order.every((x,i)=>x===i)){feedback.textContent='Собрано. Девять отделений, но ящиков восемь: справа вверху осталось пустое место. Ряды разной высоты делят пространство по-разному. +40 баллов.';root.classList.add('complete');root.dispatchEvent(new CustomEvent('photo-order-complete',{bubbles:true}));}else{feedback.textContent='Пока линии не сошлись. Верхний фрагмент узнаётся по крышке и пустому отделению справа. Подними его, затем совмести остальные ряды.';}}
 root.querySelector('[data-order-reset]').onclick=()=>{order=[2,0,1];moves=0;root.classList.remove('complete');paint();feedback.textContent='Фрагменты снова перепутаны. Собери внутренний вид.';root.dispatchEvent(new CustomEvent('photo-order-reset',{bubbles:true}))};paint();
})})();
