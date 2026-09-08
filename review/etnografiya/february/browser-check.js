async (page) => {
 const root='/home/agent/dna/reports/ethnography-february-2026-09-08';
 await page.goto('http://172.22.0.4:8831/index.html');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});
 const initial=await page.evaluate(()=>({rows:document.querySelectorAll('tbody tr').length,columns:document.querySelectorAll('thead th').length,count:document.getElementById('count').textContent,overflow:document.documentElement.scrollWidth>innerWidth}));
 await page.getByRole('searchbox').fill('Осокина');
 const search=await page.locator('tbody tr:visible').count();
 await page.getByRole('button',{name:'Сбросить',exact:true}).click();
 await page.locator('#kind').selectOption('К'); const calendar=await page.locator('tbody tr:visible').count();
 await page.locator('#kind').selectOption('У'); const conditional=await page.locator('tbody tr:visible').count();
 await page.getByRole('button',{name:'Сбросить',exact:true}).click();
 await page.getByRole('searchbox').fill('неттакогопредмета'); const empty=await page.locator('#empty').isVisible();
 await page.getByRole('button',{name:'Сбросить',exact:true}).click();
 await page.screenshot({path:root+'/output/playwright/desktop.png'});
 const mobile=[];
 for (const width of [390,320]) {await page.setViewportSize({width,height:844});mobile.push(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,tableScrollable:document.querySelector('.tablewrap').scrollWidth>document.querySelector('.tablewrap').clientWidth})));}
 await page.screenshot({path:root+'/output/playwright/mobile.png'});
 await page.setViewportSize({width:1440,height:1000});
 await page.pdf({path:root+'/february.pdf',format:'A3',landscape:true,printBackground:true,preferCSSPageSize:true});
 const result={initial,search,calendar,conditional,empty,mobile,errors};
 if(initial.rows!==28||initial.columns!==5||search!==1||calendar!==3||conditional!==25||!empty||initial.overflow||mobile.some(x=>x.overflow)||errors.length)throw new Error(JSON.stringify(result));
 return result;
}
