async page => {
 const R={checkedAt:new Date().toISOString(),url:page.url(),checks:[],layouts:[],errors:[]};
 const check=(name,ok,detail)=>R.checks.push({name,ok,detail});page.on('pageerror',e=>R.errors.push(e.message));
 page.setDefaultTimeout(5000);await page.reload();await page.evaluate(()=>document.fonts.ready);
 for(const width of [320,360,390,768,1440]){await page.setViewportSize({width,height:844});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);const a=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,h1:Math.round(document.querySelector('h1').getBoundingClientRect().bottom),buttons:Math.round(document.querySelector('.hero-btns').getBoundingClientRect().bottom),museumVisible:document.querySelector('.hero-lead .museum').getBoundingClientRect().height>0}));R.layouts.push(a);check('layout '+width,!a.overflow&&a.museumVisible&&(width>390||a.buttons<=844),a);}
 await page.setViewportSize({width:390,height:844});
 const ds=page.locator('#five-stories details');check('five moments',await ds.count()===5);
 for(let i=0;i<5;i++){const d=ds.nth(i);check('moment initially closed '+i,await d.getAttribute('open')===null);await d.locator('summary').click();check('moment opens '+i,await d.getAttribute('open')!==null);await d.locator('summary').press('Enter');check('moment keyboard closes '+i,await d.getAttribute('open')===null);}
 check('audio lazy',await page.locator('audio').getAttribute('src')===null);
 await page.locator('#agbtn').click();await page.waitForTimeout(1700);check('audio plays',await page.locator('audio').evaluate(a=>!a.paused&&a.currentTime>0));await page.locator('#agbtn').click();await page.waitForTimeout(200);check('audio paused label',await page.locator('#agbtn').getAttribute('aria-label')==='Включить аудиогид');
 const results=[];for(let route=0;route<8;route++){if(route)await page.locator('.ct-reset').click();for(let i=0;i<3;i++){await page.locator('.ct-choice').nth((route>>i)&1).click();check('choice feedback '+route+'-'+i,(await page.locator('.ct-feedback').innerText()).length>50);await page.locator('.ct-next').click();}results.push(await page.locator('.ct-end').innerText());}
 check('eight distinct outcomes',new Set(results).size===8);
 const correct=[0,1,2,0,1];for(let i=0;i<5;i++){await page.locator('.mq-opt').nth(i===0?1:correct[i]).click();await page.locator('.mq-next').click();}
 check('wrong route 80',await page.locator('#score').innerText()==='80');check('retry available',await page.locator('.mq-retry').count()===1);await page.locator('.mq-retry').click();
 for(let i=0;i<5;i++){await page.locator('.mq-opt').nth(correct[i]).click();check('explicit correct result '+i,(await page.locator('.mq-exp').innerText()).startsWith('Верно.'));await page.locator('.mq-next').click();}
 check('success 100',await page.locator('#score').innerText()==='100');check('diploma',await page.locator('#dipl').isVisible());
 await page.evaluate(()=>{window.award('share',5);window.award('q99',20);window.award('q0',20)});check('unregistered and repeated awards ignored',await page.evaluate(()=>museumScore.raw())===100);
 await page.reload();await page.evaluate(()=>{window.award('share',5);window.award('q99',20)});check('hidden award rejected at zero',await page.locator('#score').innerText()==='0');
 const sup=page.locator('.support');check('two supports',await sup.count()===2);
 if(await sup.count()){await sup.first().scrollIntoViewIfNeeded();await page.waitForTimeout(800);check('heart hidden beside support',await page.locator('#heart').evaluate(e=>getComputedStyle(e).visibility==='hidden'));R.support=await sup.evaluateAll(es=>es.map(e=>({ratio:(e.getBoundingClientRect().top+scrollY)/document.documentElement.scrollHeight,text:e.innerText.slice(0,70)})));check('support first third',R.support[0].ratio<=.35);}
 for(const w of [390,1440]){await page.setViewportSize({width:w,height:844});await page.evaluate(async()=>{for(const img of document.images){img.loading='eager'}await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));scrollTo(0,0)});await page.screenshot({path:'/home/agent/dna/reports/2026-09-15-slovo-finish/full-'+w+'.png',fullPage:true});}
 check('images',await page.locator('img').evaluateAll(es=>es.every(i=>i.complete&&i.naturalWidth>0)));check('no JS errors',R.errors.length===0,R.errors);
 R.passed=R.checks.filter(c=>c.ok).length;R.failed=R.checks.filter(c=>!c.ok);return R;
}
