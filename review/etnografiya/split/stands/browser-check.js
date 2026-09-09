async (page) => {
const checks=[]; const ok=(name,test)=>{checks.push({name,pass:!!test});if(!test)throw Error(name)};let errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.reload();await page.locator('#cut').click();ok('прорези открываются',await page.locator('#holes').getAttribute('opacity')==='1');
await page.locator('#layers').focus();await page.keyboard.press('End');ok('клавиатура разделяет слои',await page.locator('#layers').inputValue()==='100');ok('геометрия меняется',(await page.locator('#plate').getAttribute('transform')).includes('-65'));
await page.locator('[data-answer=paint]').click();ok('ошибка объясняется',(await page.locator('#metal-answer').textContent()).includes('Проверь'));
await page.locator('[data-answer=backing]').click();ok('верный ответ',(await page.locator('#metal-answer').textContent()).startsWith('Да.'));
await page.locator('#metal-reset').click();ok('сброс металла',(await page.locator('#layers').inputValue())==='0' && await page.locator('#holes').getAttribute('opacity')==='0');
for(const id of ['sheet','towel','shirt'])await page.locator('[data-item='+id+']').click();
ok('произвольный порядок: три вещи',await page.locator('.relation').count()===3);ok('итог виден',await page.locator('#family-result').isVisible());ok('связь с подругами',(await page.locator('#relations').textContent()).includes('подруги'));
await page.locator('[data-item=shirt]').click();ok('повтор снимает вещь',await page.locator('.relation').count()===2 && await page.locator('#cloth-shirt').getAttribute('opacity')==='0');
await page.locator('[data-family-answer=all]').click();ok('семья: ошибка с объяснением',(await page.locator('#family-answer').textContent()).includes('не говорит'));
await page.locator('[data-family-answer=shirt]').click();ok('семья: правильный ответ',(await page.locator('#family-answer').textContent()).startsWith('Да.'));
await page.locator('#family-reset').click();ok('сброс семьи',await page.locator('.relation').count()===0 && await page.locator('#family-answer').textContent()==='');
for(const w of [320,360,390,768,1440]){await page.setViewportSize({width:w,height:900});ok('ширина '+w,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));ok('кнопки 44px '+w,await page.locator('button,input[type=range]').evaluateAll(es=>es.every(e=>{let r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})))}
await page.setViewportSize({width:390,height:844});await page.locator('[data-item=shirt]').click();await page.locator('[data-item=towel]').click();await page.locator('[data-item=sheet]').click();await page.screenshot({path:'/tmp/ethnography-stands-mobile-full.png',fullPage:true});
await page.setViewportSize({width:1440,height:1000});await page.locator('#cut').click();await page.locator('#layers').fill('60');await page.locator('#layers').dispatchEvent('input');await page.screenshot({path:'/tmp/ethnography-stands-desktop-full.png',fullPage:true});
ok('нет ошибок JS',errors.length===0);return {passed:checks.length,checks,errors};}
