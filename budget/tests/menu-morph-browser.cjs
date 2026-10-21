'use strict';
const {webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {setup}=require('./travel-browser.cjs');
const out='test-results/menu-morph';
async function finish(panel){await panel.evaluate(async e=>{const all=e.getAnimations();all.forEach(a=>a.play());await Promise.all(all.map(a=>a.finished.catch(()=>{})));});}
async function frame(panel,fraction){return panel.evaluate(async(e,f)=>{const a=e.getAnimations().find(a=>a.effect.getKeyframes().some(k=>k.scale));if(!a)throw Error('No geometric menu animation');a.pause();a.currentTime=Number(a.effect.getTiming().duration)*f;await new Promise(requestAnimationFrame);const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};},fraction);}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await webkit.launch(),ctx=await setup(browser,390),page=await ctx.newPage();
 try{
  for(const [file,button,menu] of [['home','.nav-dropdown-wrapper>button','.nav-dropdown-menu'],['travel','.tools>summary','.shared-tools-panel'],['exercise','#menu-toggle','#field-menu']]){
   await page.goto(`http://127.0.0.1:4173/budget/${file}.html`,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.MenuMotion);
   const trigger=page.locator(button).first(),panel=page.locator(menu).first();await trigger.scrollIntoViewIfNeeded();
   const t=await trigger.boundingBox();await trigger.click();
   const start=await frame(panel,0);for(const key of ['x','y','width','height'])assert(Math.abs(start[key]-t[key])<2,file+' starts at button '+key);
   const middle=await frame(panel,.25);await page.screenshot({path:`${out}/${file}-opening.png`});await finish(panel);
   const full=await panel.boundingBox();assert(middle.width>start.width&&middle.width<full.width,file+' grows');assert(full.x>=0&&full.x+full.width<=391,file+' viewport');
   await page.screenshot({path:`${out}/${file}-open.png`});await trigger.click();
   const closing=await frame(panel,.4);assert(closing.width<full.width&&closing.width>start.width,file+' collapses');await page.screenshot({path:`${out}/${file}-closing.png`});
   // A second click reverses the current frame, without a snap or delayed close.
   await trigger.click();const reverse=await frame(panel,0);assert(Math.abs(reverse.width-closing.width)<2,file+' continuous reversal');await finish(panel);
   await page.keyboard.press('Escape');await finish(panel);assert.equal(await panel.evaluate(e=>e.matches(':popover-open')),false,file+' Escape closes');
   await page.emulateMedia({reducedMotion:'reduce'});await trigger.click();assert.equal(await panel.evaluate(e=>e.getAnimations().length),0);await trigger.click();assert.equal(await panel.evaluate(e=>e.matches(':popover-open')),false);await page.emulateMedia({reducedMotion:'no-preference'});
   console.log(file+': grows from trigger, collapses to trigger, reverses, Escape, reduced motion and mobile bounds passed');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
