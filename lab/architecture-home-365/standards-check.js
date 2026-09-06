async(page) => {
 const checks=[],check=(name,ok,detail)=>checks.push({name,ok,detail});
 const slogan='Первый цифровой музей достижений России · Цивилизация первенств — что Россия дала миру раньше всех';
 check('Portal title',await page.locator('header.top .b1').innerText()==='Русская цивилизация');
 check('Portal slogan',await page.locator('header.top .b2').innerText()===slogan);
 check('Museum H1',await page.locator('h1').count()===1 && await page.locator('h1').innerText()==='Музей русской архитектуры');
 check('Museum slogan',await page.locator('.museum-slogan').innerText()==='Самый ясный ежедневный способ научиться видеть архитектуру');
 check('Header order',await page.evaluate(()=>{const a=document.querySelector('header.top'),b=document.querySelector('.museum-identity'),c=document.querySelector('.chrome-row');return !!(a.compareDocumentPosition(b)&4)&&!!(b.compareDocumentPosition(c)&4)}));
 check('Shared support',await page.locator('script[src$="museum-support.js"]').count()===1 && await page.locator('.support').count()===2);
 check('Five support methods',await page.locator('.support-options li').count()===5);
 check('Same-page support link',await page.locator('#next .end-links a').last().evaluate(a=>a.hash==='#support'&&a.pathname===location.pathname));
 check('Home selection limited',await page.locator('#story-grid .story').count()===3);
 check('365 calendar days',await page.evaluate(()=>Object.keys(window.MUSEUM_CALENDAR).length===365));
 for(const width of [320,360,390,768,1440]) {
  await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(400);
  const geometry=await page.evaluate(()=>{const r=document.querySelector('#support').getBoundingClientRect();const cal=document.querySelector('#calendar').getBoundingClientRect();const sections=[...document.querySelectorAll('body>section,main>section,main>article,body>footer')].filter(e=>e.offsetHeight);return {width:innerWidth,scroll:document.documentElement.scrollWidth,support:r.top/document.documentElement.scrollHeight,calendarLast:sections.at(-1).id==='calendar',bottom:cal.bottom+scrollY,doc:document.documentElement.scrollHeight,fonts:document.fonts.status}});
  check('Layout '+width,geometry.scroll<=width,geometry);check('Support first third '+width,geometry.support>0&&geometry.support<1/3,geometry.support);check('Calendar last '+width,geometry.calendarLast&&Math.abs(geometry.bottom-geometry.doc)<3,geometry);check('Fonts '+width,geometry.fonts==='loaded');
  await page.locator('#support').scrollIntoViewIfNeeded();await page.waitForTimeout(350);check('Heart hidden at support '+width,await page.locator('#heart').evaluate(e=>getComputedStyle(e).visibility==='hidden'));
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('#next .end-links a').last().click();await page.waitForFunction(()=>{const r=document.querySelector("#support").getBoundingClientRect();return r.top<innerHeight&&r.bottom>0});check('Support link scrolls',await page.locator('#support').evaluate(e=>e.getBoundingClientRect().top<innerHeight&&e.getBoundingClientRect().bottom>0));
 await page.locator('[data-sup-more]').click();await page.waitForTimeout(700);check('More reaches methods',await page.locator('#support-details').evaluate(e=>e.getBoundingClientRect().top<innerHeight));
 for(const mode of ['long','short']){await page.locator('[data-school='+mode+']').click();check('School '+mode,await page.locator('.school-steps b').evaluateAll(xs=>xs.reduce((n,e)=>n+Number(e.textContent.match(/(\d+) мин/)[1]),0))===(mode==='long'?35:15))}
 for(const view of ['space','material','people','time','place']){await page.locator('[data-view='+view+']').click();await page.waitForFunction(()=>!document.querySelector('.reader-stage').classList.contains('is-changing'));check('View '+view,await page.locator('#reader-image').evaluate(e=>e.complete&&e.naturalWidth>0))}
 for(const day of [1,12,25]){await page.locator('#calbox .cday').filter({hasText:new RegExp('^'+day+'$')}).click();check('Day hook '+day,(await page.locator('#calbox .calcard p').innerText()).length>5)}
 await page.evaluate(()=>window.renderArchitectureToday(new Date(2026,0,1)));check('Published today link',(await page.locator('#today-primary').getAttribute('href')).includes('kizhi'));await page.evaluate(()=>window.renderArchitectureToday());
 await page.evaluate(()=>{document.body.style.zoom='2';scrollTo(0,0)});check('Zoom 200%',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.evaluate(()=>document.body.style.zoom='');
 await page.evaluate(async()=>{for(const img of document.images){img.loading='eager';}await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});check('Images loaded',await page.locator('img').evaluateAll(xs=>xs.every(i=>i.complete&&i.naturalWidth>0)));
 await page.evaluate(()=>scrollTo(0,0));
 return {passed:checks.filter(c=>c.ok).length,failed:checks.filter(c=>!c.ok),checks};
}
