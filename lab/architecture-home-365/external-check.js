async(page)=>{
await page.unrouteAll({behavior:'wait'});await page.evaluate(()=>document.body.style.zoom='');
const errors=[];page.on('pageerror',e=>errors.push(e.message));const out=[];
const root='https://arabelthera-dot.github.io/rc-museum-preview/lab/architecture-home-365/';
await page.setViewportSize({width:390,height:844});const home=await page.goto(root+'index.html?version=99377bb');await page.waitForSelector('.story');await page.evaluate(()=>document.fonts.ready);
out.push({version:await page.locator('.hero h2').evaluate(x=>getComputedStyle(x).hyphens)});out.push({page:'home',http:home.status(),...await page.evaluate(()=>({cards:document.querySelectorAll('.story').length,overflow:document.documentElement.scrollWidth>innerWidth,fonts:document.fonts.status,action:document.querySelector('.primary').getBoundingClientRect().bottom}))});
await page.locator('img').evaluateAll(xs=>xs.forEach(x=>x.loading='eager'));await page.waitForFunction(()=>[...document.images].every(x=>x.complete&&x.naturalWidth>0));
await page.screenshot({path:'/home/agent/workspace/architecture-365-public-mobile.png',fullPage:true});await page.evaluate(()=>{document.body.style.zoom='2';scrollTo(0,0)});out.push({zoom200:await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)});await page.evaluate(()=>document.body.style.zoom='');await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'/home/agent/workspace/architecture-365-public-desktop.png',fullPage:true});
await page.locator('.all-stories').click();await page.waitForSelector('.catalog-entry');out.push({page:'catalog',count:await page.locator('#catalog-count').innerText(),cards:await page.locator('.catalog-entry').count()});
await page.getByRole('button',{name:'Далее →',exact:true}).click();out.push({page2:await page.locator('#catalog-count').innerText()});
await page.getByRole('button',{name:'← Назад',exact:true}).click();await page.screenshot({path:'/home/agent/workspace/architecture-365-public-catalog.png'});
await page.setViewportSize({width:390,height:844});out.push({catalogMobile:await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].every(x=>x.complete&&x.naturalWidth>0)}))});return {out,errors};
}
