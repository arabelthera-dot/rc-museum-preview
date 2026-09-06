async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.reload();
 const reports=[];
 for(const width of [320,360,390,768,1440]){
 await page.setViewportSize({width,height:900});
 await page.evaluate(async()=>{for(const img of document.images){img.loading='eager'}await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await document.fonts.ready});
 reports.push(await page.evaluate((width)=>({width,overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>!i.naturalWidth).length,halls:document.querySelectorAll('#halls details').length,order:[...document.querySelectorAll('section[id]')].map(e=>e.id),support:[...document.querySelectorAll('.support')].map(e=>Math.round((e.getBoundingClientRect().top+scrollY)/document.documentElement.scrollHeight*100)),deadAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).length,fonts:document.fonts.status}),width));
 }
 await page.locator('#halls summary').first().click();if(!await page.locator('#halls details').first().evaluate(e=>e.open))throw Error('Hall did not open');
 await page.locator('[data-filter="press"]').click();if(await page.locator('.card:visible').count()!==2)throw Error('Filter');await page.locator('[data-filter="all"]').click();
 await page.locator('[data-detail="1"]').click();await page.locator('[data-detail="1"]').press('ArrowRight');if(await page.locator('[data-detail="2"]').getAttribute('aria-selected')!=='true')throw Error('Detail keyboard');
 await page.locator('[data-school="1"]').click();if(await page.locator('#school-steps li').count()!==4)throw Error('School15');await page.locator('[data-school="0"]').click();if(await page.locator('#school-steps li').count()!==3)throw Error('School7');
 await page.locator('.cday[data-k="01-02"]').click();if(!await page.locator('.calcard h3').innerText())throw Error('Calendar title');
 await page.locator('.calnav[data-step="1"]').click();await page.locator('.cday[data-k="02-01"]').click();if(await page.locator('.calcard.empty').count()!==1)throw Error('Empty month');await page.locator('.calnav[data-step="-1"]').click();
 const result={reports,errors};
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/home/agent/workspace/.playwright-cli/karikatura-museum-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/home/agent/workspace/.playwright-cli/karikatura-museum-desktop.png',fullPage:true});
 return result;
}
