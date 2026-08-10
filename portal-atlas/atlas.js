const state={museums:[],query:'',category:'',limit:12};
const grid=document.querySelector('#museum-grid');
const count=document.querySelector('#result-count');
const more=document.querySelector('#show-more');
const normalize=value=>(value||'').toLocaleLowerCase('ru-RU');
const museumText=m=>normalize([m.title_ru,m.promise_ru,m.category_title_ru,...(m.search_terms_ru||[])].join(' '));
function render(){
  const filtered=state.museums.filter(m=>(!state.category||m.category_id===state.category)&&(!state.query||museumText(m).includes(normalize(state.query))));
  count.textContent=`Найдено: ${filtered.length} из ${state.museums.length}`;
  grid.innerHTML=filtered.slice(0,state.limit).map(m=>`<article class="museum-card"><div class="museum-coordinate"><span>Музей ${String(m.number).padStart(2,'0')}</span><span>${m.category_title_ru}</span></div><h3>Музей ${m.title_ru}</h3><p>${m.promise_ru}</p><a href="${m.status==='open'?'../'+m.public_path:'#museums'}">Войти в музей →</a></article>`).join('')||'<p>Попробуй другой запрос — город умеет показывать людей, предметы, эпохи и темы.</p>';
  more.hidden=filtered.length<=state.limit;
}
function makeFilters(){
  const host=document.querySelector('#category-filters');
  const categories=[...new Map(state.museums.map(m=>[m.category_id,m.category_title_ru])).entries()];
  host.innerHTML='<button class="active" data-category="">Все районы</button>'+categories.map(([id,title])=>`<button data-category="${id}">${title}</button>`).join('');
  host.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;state.category=button.dataset.category;state.limit=12;host.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));render()});
}
fetch('assets/portal-museums.json').then(r=>r.json()).then(data=>{state.museums=data.museums;makeFilters();render()}).catch(()=>{grid.innerHTML='<p>Указатель временно недоступен.</p>'});
document.querySelector('#search-form').addEventListener('submit',e=>{e.preventDefault();state.query=document.querySelector('#query').value.trim();state.limit=12;render();document.querySelector('#museums').scrollIntoView()});
document.querySelectorAll('[data-intent]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#query').value=button.dataset.intent;state.query=button.dataset.intent;state.limit=12;render();document.querySelector('#museums').scrollIntoView()}));
more.addEventListener('click',()=>{state.limit+=12;render()});
document.querySelector('.districts').addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;document.querySelectorAll('.districts button').forEach(item=>item.classList.toggle('active',item===button));document.querySelector('#district-title').textContent=button.dataset.title;document.querySelector('#district-copy').textContent=button.dataset.copy;document.querySelector('#district-count').textContent=button.dataset.count});
const menu=document.querySelector('.menu');const mobile=document.querySelector('#mobile-nav');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));mobile.hidden=open;mobile.classList.toggle('open',!open)});
