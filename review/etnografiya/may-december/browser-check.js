async (page) => {
 const root='/home/agent/dna/reports/ethnography-may-december-2026-09-09',base='http://172.22.0.4:8842/';
 const months=['may','june','july','august','september','october','november','december'],counts=[31,30,31,31,30,31,30,31],result=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 for(let i=0;i<months.length;i++){
 const m=months[i];await page.goto(base+m+'/index.html');await page.setViewportSize({width:1440,height:1000});
 const rows=await page.locator('tbody tr').count(),cols=await page.locator('thead th').count();
 const title=await page.locator('tbody tr:first-child strong').textContent();await page.locator('#search').fill(title);
 const search=await page.locator('tbody tr:visible').count();await page.locator('#reset').click();
 await page.locator('#kind').selectOption('К');const k=await page.locator('tbody tr:visible').count();await page.locator('#kind').selectOption('У');const u=await page.locator('tbody tr:visible').count();await page.locator('#reset').click();
 const widths=[];for(const width of [390,320]){await page.setViewportSize({width,height:844});widths.push(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,scrollable:document.querySelector('.tablewrap').scrollWidth>document.querySelector('.tablewrap').clientWidth})));}
 if(i===0)await page.screenshot({path:root+'/output/playwright/mobile.png'});
 await page.setViewportSize({width:1440,height:1000});await page.pdf({path:root+'/'+m+'/'+m+'.pdf',format:'A3',landscape:true,printBackground:true,preferCSSPageSize:true});
 if(rows!==counts[i]||cols!==5||search!==1||k+u!==rows||widths.some(x=>x.overflow))throw Error(JSON.stringify({m,rows,cols,search,k,u,widths}));
 result.push({month:m,rows,cols,search,calendar:k,conditional:u,widths});
 }
 await page.goto(base+'print.html');await page.pdf({path:root+'/may-december.pdf',format:'A3',landscape:true,printBackground:true,preferCSSPageSize:true});
 if(errors.length)throw Error(JSON.stringify(errors));return {months:result,errors};
}
