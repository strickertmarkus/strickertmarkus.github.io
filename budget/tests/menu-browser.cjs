'use strict';
const {webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('./travel-browser.cjs');
(async()=>{
 fs.mkdirSync('test-results/travel',{recursive:true});const browser=await webkit.launch(),ctx=await setup(browser,390),page=await ctx.newPage();
 await ctx.addInitScript(()=>{localStorage.setItem('home-blue-theme-config-v1','1');localStorage.setItem('home-theme-choice-v1','blue');});
 for(const file of ['home','familjebudget','budget','budget_maja','calendar','data','analytics','analytics_maja','melker','mila']){
  await page.goto('http://127.0.0.1:4173/budget/'+file+'.html',{waitUntil:'domcontentloaded'});
  const trigger=page.locator('.nav-dropdown-wrapper > button').first();await trigger.waitFor();await page.waitForFunction(()=>!!window.MenuMotion);await trigger.click();
  await page.waitForFunction(()=>document.querySelector('.nav-dropdown-menu')?.matches(':popover-open'));
  const box=await page.locator('.nav-dropdown-menu').boundingBox();assert(box.x>=0&&box.x+box.width<=391&&box.y>=0&&box.y+box.height<=845,file+' menu bounds');
  assert.equal(await trigger.getAttribute('aria-expanded'),'true');
  assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).overflowY),'hidden');
  if(file==='home'){
   assert.equal(await page.locator('#home-blue-theme-config-v1').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('home-blue-theme-config-v1')),null);assert.match(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent')),/FDBA74/i);
   await page.locator('.nav-dropdown-menu').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{})));});await page.screenshot({path:'test-results/travel/menu-home-open-390.png'});
   await trigger.click();await page.waitForTimeout(60);await page.screenshot({path:'test-results/travel/menu-home-closing-390.png'});await page.waitForFunction(()=>!document.querySelector('.nav-dropdown-menu').matches(':popover-open'));await trigger.click();
  }
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.nav-dropdown-menu').matches(':popover-open'));assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  await page.setViewportSize({width:320,height:568});await trigger.click();const narrow=await page.locator('.nav-dropdown-menu').boundingBox();assert(narrow.x>=0&&narrow.x+narrow.width<=321&&narrow.y+narrow.height<=569,file+' narrow menu bounds');
  if(file==='familjebudget')await page.locator('.nav-dropdown-menu').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{})));});
  if(file==='familjebudget')await page.screenshot({path:'test-results/travel/menu-budget-320.png'});
  await page.mouse.click(2,560);await page.waitForFunction(()=>!document.querySelector('.nav-dropdown-menu').classList.contains('show'));await page.setViewportSize({width:390,height:844});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.nav-dropdown-wrapper>button').first().click();assert.equal(await page.locator('.nav-dropdown-menu').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 await page.goto('http://127.0.0.1:4173/budget/exercise.html',{waitUntil:'domcontentloaded'});
 await page.locator('#menu-toggle').click();await page.waitForFunction(()=>document.querySelector('#field-menu')?.matches(':popover-open'));
 const fieldBox=await page.locator('#field-menu').boundingBox();assert(fieldBox.x>=0&&fieldBox.x+fieldBox.width<=391&&fieldBox.y+fieldBox.height<=845,'Training menu bounds');
 assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).overflowY),'hidden');
 await page.screenshot({path:'test-results/travel/menu-training-390.png'});await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#field-menu').matches(':popover-open'));
 await browser.close();console.log('Shared menus: ten pages, viewport bounds, outside tap, Escape, Home orange migration, motion and reduced motion passed.');
})().catch(e=>{console.error(e);process.exit(1)});
