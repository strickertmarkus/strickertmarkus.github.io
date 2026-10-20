'use strict';
const {webkit,chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('./travel-browser.cjs');
const pages=['home','calendar','budget','budget_maja','familjebudget','analytics','analytics_maja','data','mila','melker','shopping','travel','exercise','zen','ingemar','archive/exercise','ingemar-session/exercise','pulse-observatory/exercise'];
const out='test-results/motion';
async function settle(el){await el.evaluate(async e=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const animations=e.getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity);animations.forEach(a=>a.play());await Promise.all(animations.map(a=>a.finished.catch(()=>{})));});}
async function phase(el,open){
 const s=await el.evaluate(async(e,open)=>{
  getComputedStyle(e).opacity;
  if(e.tagName==='DIALOG'){open?SurfaceMotion.showDialog(e):SurfaceMotion.closeDialog(e);}
  else e.classList.toggle('show',open);
  getComputedStyle(e).opacity;
  const animations=e.getAnimations();
  for(const animation of animations){animation.pause();animation.currentTime=Number(animation.effect.getTiming().duration)/2;}
  await new Promise(requestAnimationFrame);
  return {opacity:+getComputedStyle(e).opacity,display:getComputedStyle(e).display,classes:e.className,animations:animations.map(a=>a.transitionProperty)};
 },open);
 assert(s.opacity>0&&s.opacity<1,`${await el.getAttribute('id')} ${open?'enter':'exit'}: ${JSON.stringify(s)}`);
 assert.notEqual(s.display,'none','Closing surface disappeared before fade finished');
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const failures=[];
 for(const [name,engine] of Object.entries({webkit,chromium})){
  const browser=await engine.launch(),ctx=await setup(browser,390),page=await ctx.newPage();
  await ctx.route('**/ingemar-account.js*',r=>r.fulfill({body:"document.documentElement.dataset.ingemarAuth='ready';",contentType:'application/javascript'}));
  // Every active document, including embedded editors, resolves the same assets.
  for(const file of pages){
   await page.goto('http://127.0.0.1:4173/budget/'+file+'.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.SurfaceMotion);
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--surface-enter').trim()),'190ms',file);
   console.log(name+' motion assets: '+file);
  }
  for(const [file,selector] of [['home','#event-modal'],['calendar','#event-modal'],['zen','#settings-dialog'],['ingemar','#week-planner']]){
   await page.goto('http://127.0.0.1:4173/budget/'+file+'.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.SurfaceMotion);
   const el=page.locator(selector);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   try {
   await phase(el,true);await settle(el);
   await page.screenshot({path:`${out}/${name}-${file}-open-390.png`});
   const box=await el.boundingBox();assert(box&&box.x>=-1&&box.x+box.width<=391,file+' horizontal dialog bounds');
   if(file==='ingemar'){
    const details=page.locator('.week-template-drawer');
    await details.locator('summary').click();await settle(details);
    const motions=await details.evaluate(async e=>{
     SurfaceMotion.setDetails(e,false);getComputedStyle(e).opacity;
     const animations=e.getAnimations({subtree:true});
     animations.forEach(a=>{a.pause();a.currentTime=Number(a.effect.getTiming().duration)/2;});
     await new Promise(requestAnimationFrame);
     return animations.map(a=>({property:a.transitionProperty||(a.effect.getKeyframes().some(k=>'opacity' in k)?'opacity':'height'),progress:a.effect.getComputedTiming().progress}));
    });
    assert(motions.some(a=>a.property==='opacity'&&a.progress>0&&a.progress<1),'Details closing animation: '+JSON.stringify(motions));
    await page.screenshot({path:`${out}/${name}-details-closing-390.png`});await settle(details);
   }
   await phase(el,false);
   await page.screenshot({path:`${out}/${name}-${file}-closing-390.png`});await settle(el);
   // Reverse an exit before it finishes: no delayed callback may close the new state.
   await el.evaluate(e=>e.tagName==='DIALOG'?SurfaceMotion.showDialog(e):e.classList.add('show'));await settle(el);
   await phase(el,false);await el.evaluate(e=>e.tagName==='DIALOG'?SurfaceMotion.showDialog(e):e.classList.add('show'));await settle(el);
   assert.equal(await el.evaluate(e=>+getComputedStyle(e).opacity),1);
   await el.evaluate(e=>e.tagName==='DIALOG'?SurfaceMotion.closeDialog(e):e.classList.remove('show'));await settle(el);
   }catch(error){failures.push(name+' '+file+': '+error.message);console.error(failures.at(-1));await page.screenshot({path:`${out}/${name}-${file}-failure.png`});}
  }
  // Dynamic menus finish their exit before DOM removal; opening another stays independent.
  await page.goto('http://127.0.0.1:4173/budget/home.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{const m=document.createElement('div');m.className='calendar-month-menu-v3';m.id='motion-month';m.textContent='Januari';document.body.append(m);});
  const month=page.locator('#motion-month');await settle(month);await month.evaluate(e=>SurfaceMotion.remove(e));
  await page.waitForTimeout(45);assert.equal(await month.count(),1);await month.waitFor({state:'detached'});
  // Actual finance disclosure: height, interruption and reduced motion.
  await page.goto('http://127.0.0.1:4173/budget/familjebudget.html',{waitUntil:'domcontentloaded'});
  const section=page.locator('#section-loan');await section.evaluate(e=>e.classList.remove('open'));
  await page.evaluate(()=>toggleSection('loan'));await settle(section);
  assert((await section.boundingBox()).height>0);
  await page.evaluate(()=>toggleSection('loan'));await page.waitForTimeout(35);await page.evaluate(()=>toggleSection('loan'));await settle(section);
  assert((await section.boundingBox()).height>0);
  for(const width of [320,1280]){
   await page.setViewportSize({width,height:844});await page.locator('.nav-dropdown-wrapper>button').first().click();await settle(page.locator('.nav-dropdown-menu'));
   const box=await page.locator('.nav-dropdown-menu').boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);
   await page.screenshot({path:`${out}/${name}-finance-menu-${width}.png`});await page.keyboard.press('Escape');await page.waitForTimeout(180);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:4173/budget/zen.html',{waitUntil:'domcontentloaded'});
  const dialog=page.locator('#settings-dialog');await dialog.evaluate(e=>SurfaceMotion.showDialog(e));await settle(dialog);
  await dialog.evaluate(e=>SurfaceMotion.closeDialog(e));assert.equal(await dialog.evaluate(e=>getComputedStyle(e).display),'none');
  await browser.close();
 }
 assert.deepEqual(failures,[]);
 console.log('All active pages: shared assets, entry/exit, interrupted close, DOM removal, finance disclosure, menu bounds and reduced motion passed.');
})().catch(e=>{console.error(e);process.exit(1);});
