async (page) => {
 const results=[]; const check=(name,ok,detail='')=>results.push({name,ok,detail});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,360,390,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>document.fonts.ready);
  const g=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,fonts:document.fonts.status,button:document.querySelector('.primary').getBoundingClientRect().bottom+scrollY,support:document.querySelector('.support-line').offsetTop/document.body.scrollHeight}));
  check('width '+width,!g.overflow&&g.fonts==='loaded'&&g.support<1/3,g);
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));
 check('first action visible',await page.locator('.primary').evaluate(x=>x.getBoundingClientRect().bottom<=innerHeight));
 for(const view of ['space','material','people','time','place']){
  await page.locator('[data-view="'+view+'"]').click();
  await page.waitForFunction(v=>document.querySelector('[data-view="'+v+'"]').getAttribute('aria-selected')==='true'&&!document.querySelector('.reader-stage').classList.contains('is-changing'),view);
  check('photo '+view,await page.locator('#reader-image').evaluate(x=>x.complete&&x.naturalWidth>0));
 }
 for(const [mode,total] of [['long',35],['short',15]]){
  await page.locator('[data-school="'+mode+'"]').click();
  const sum=await page.locator('.school-steps b').evaluateAll(xs=>xs.reduce((sum,x)=>sum+Number(x.textContent.match(/(\d+) мин/)[1]),0));check('school '+total,sum===total);
 }
 await page.locator('#story-search').fill('неттакогопамятника');check('empty search',await page.locator('#catalog-empty').isVisible());
 await page.locator('#story-search').fill('Асташово');check('search match',await page.locator('.story:visible').count()===1);
 await page.locator('#story-search').fill('');
 await page.locator('#filters-toggle').click();await page.locator('select[name=material]').selectOption('Дерево');check('filter material',await page.locator('.story:visible').count()===3);
 await page.locator('select[name=material]').selectOption('');await page.locator('#filters-toggle').click();
 await page.locator('#clear-route').click();for(let i=0;i<3;i++)await page.locator('.story-save').nth(i).click();
 check('route unlock',await page.locator('#start-route').getAttribute('aria-disabled')!=='true');check('route saved',await page.locator('#route-list a').count()===3);
 await page.locator('#clear-route').click();check('route reset',await page.locator('#start-route').getAttribute('aria-disabled')==='true');
 for(const day of [1,12,25]){await page.locator('#calbox .cday').filter({hasText:new RegExp('^'+day+'$')}).click();check('calendar '+day,await page.locator('#calbox .calcard p').innerText().then(t=>t.length>5));}
 for(let i=0;i<8;i++)await page.locator('#calbox .calnav').first().click();
 await page.locator('#calbox .cday').filter({hasText:/^1$/}).click();
 check('January linked day',await page.locator('#calbox .calcard a').getAttribute('href').then(t=>t.includes('kizhi')));
 check('365 entries',await page.evaluate(()=>Object.keys(window.MUSEUM_CALENDAR).length===365));
 // Load every lazy photograph before inspecting complete pages.
 await page.locator('img').evaluateAll(xs=>xs.forEach(x=>x.loading='eager'));
 await page.waitForFunction(()=>[...document.images].every(x=>x.complete));
 check('all photos loaded',await page.evaluate(()=>[...document.images].every(x=>x.naturalWidth>0)));
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:width===390?844:1000});await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'/home/agent/workspace/architecture-light-'+width+'-full.png',fullPage:true});
  await page.screenshot({path:'/home/agent/workspace/architecture-light-'+width+'-hero.png'});
 }
 check('console',errors.length===0,errors);
 return results;
}
