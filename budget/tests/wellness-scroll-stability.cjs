/* WebKit regression: fading scroll scenery, nested dialogs and session return.
   All external requests are isolated; no real account data is read or written. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const base=process.env.PULSE_TEST_URL||'http://127.0.0.1:4173';
async function setup(browser,mobile){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},isMobile:mobile,hasTouch:mobile});
 await context.route('https://**/*',r=>r.fulfill({body:''}));
 await context.route('**/auth-gate.js*',r=>r.fulfill({body:''}));
 await context.route('**/firebase-sync.js*',r=>r.fulfill({body:''}));
 await context.addInitScript(()=>{
  const auth={currentUser:{uid:'stability-fixture'},onAuthStateChanged(cb){queueMicrotask(()=>cb(this.currentUser));return()=>{};}};
  const ref=()=>({on(e,cb){queueMicrotask(()=>cb({val:()=>null}));},off(){},once:()=>Promise.resolve({val:()=>null}),child:()=>ref(),set:()=>Promise.resolve()});
  window.firebase={apps:[{}],auth:()=>auth,database:()=>({ref})};
  window.landscapePaints=0;const clear=CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.closest('.landscape'))window.landscapePaints++;return clear.apply(this,args);};
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 return{context,page,errors};
}
async function verify(browser,mobile){
 const {context,page,errors}=await setup(browser,mobile),name=mobile?'mobile':'desktop';
 await page.goto(base+'/budget/exercise.html?demo=1');
 await page.waitForSelector('.field-hero');
 await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
 const sceneHeight=await page.locator('.space-scene').evaluate(el=>el.offsetHeight);
 for(const y of [0,Math.round(sceneHeight*.55),sceneHeight+40]){
  await page.evaluate(y=>scrollTo(0,y),y);
  await page.waitForFunction(y=>Math.abs(scrollY-y)<2,y);
  await page.waitForFunction(()=>{const r=document.querySelector('.space-scene').getBoundingClientRect();return document.documentElement.dataset.fieldSceneVisible===(r.bottom>0?'true':'false');});
  const state=await page.locator('.space-scene').evaluate(el=>({display:getComputedStyle(el).display,position:getComputedStyle(el).position,top:el.getBoundingClientRect().top,mask:getComputedStyle(el).webkitMaskImage,paused:getComputedStyle(el.querySelector('.space-scene__nebula')).animationPlayState==='paused'}));
  assert.notEqual(state.display,'none');assert.equal(state.position,'absolute');assert.ok(Math.abs(state.top+y)<2,'The top artwork must leave the viewport with its original fade');
  assert.ok(state.mask.includes('100%')&&state.mask.includes('0)'),'Scene must retain its transparent lower edge');
  assert.equal(state.paused,y>=sceneHeight);
  if(y>=sceneHeight){
   await page.waitForTimeout(50);
   const times=await page.locator('.space-scene').evaluate(el=>el.getAnimations({subtree:true}).map(a=>a.currentTime));
   await page.waitForTimeout(180);
   assert.deepEqual(await page.locator('.space-scene').evaluate(el=>el.getAnimations({subtree:true}).map(a=>a.currentTime)),times,'Offscreen artwork must retain its paused frame');
  }
 }
 const spill=await page.locator('.rhythm-section').evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
 assert.ok(spill.includes('radial-gradient'),'Original Ambient A light must continue below the hero');
 fs.mkdirSync('test-results/pulse-field',{recursive:true});
 await page.locator('.rhythm-section').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/pulse-field/scroll-background-'+name+'.png'});
 await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>document.documentElement.dataset.fieldSceneVisible==='true');
 assert.equal(await page.locator('.space-scene__nebula').evaluate(el=>getComputedStyle(el).animationPlayState),'running');
 for(const kind of ['stretch','meditation']){
  await page.goto(base+'/budget/zen.html?wellness='+kind);await page.waitForFunction(()=>window.ZenStore?.ready);const previousRecords=await page.evaluate(()=>ZenStore.entries.filter(e=>e.type==='session'&&!e.demo).length);
  await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
  await page.locator('#create-routine').scrollIntoViewIfNeeded();const scroll=await page.evaluate(()=>scrollY);
  await page.locator('#create-routine').click();await page.waitForFunction(()=>TrainingOverlay.isLocked());
  assert.equal(await page.evaluate(()=>document.body.style.position),'fixed');
  await page.waitForTimeout(200);const paints=await page.evaluate(()=>landscapePaints);await page.waitForTimeout(180);
  assert.equal(await page.evaluate(()=>landscapePaints),paints,'Zen canvas must pause beneath a modal');
  await page.evaluate(()=>document.getElementById('confirm-dialog').showModal());await page.waitForTimeout(20);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>TrainingOverlay.isLocked()),true,'Nested close must retain the builder lock');
  await page.locator('[data-close="builder-dialog"]').click();await page.waitForFunction(()=>!TrainingOverlay.isLocked());
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scroll)<2,'Closing Zen builder must restore page position');
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);
  const resumed=await page.evaluate(()=>landscapePaints);await page.waitForFunction(n=>landscapePaints>n,resumed,{timeout:4000});
  await page.locator('#start-button').click();await page.waitForSelector('#session-view:not([hidden])');
  await page.locator('#pause-session').click();assert.equal(await page.evaluate(()=>ZenStore.active.paused),true);
  await page.locator('#leave-session').click();await page.locator('#resume-button').click();await page.waitForSelector('#session-view:not([hidden])');assert.equal(await page.evaluate(()=>ZenStore.active.paused),false);
  await page.evaluate(()=>{dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
  assert.ok(await page.evaluate(()=>ZenStore.active),'Returning from page cache must preserve the active session');
  await page.waitForFunction(()=>ZenModel.practiced(ZenStore.active,Date.now())>=1100);
  await page.locator('#finish-session').click();await page.waitForSelector('#confirm-dialog[open]');await page.locator('#confirm-yes').click();
  await page.waitForSelector('#complete-view:not([hidden])');await page.locator('#save-session').click();
  await page.waitForSelector('#home-view:not([hidden])');assert.equal(await page.evaluate(()=>ZenStore.active),null);
  assert.equal(await page.evaluate(()=>ZenStore.entries.filter(e=>e.type==='session'&&!e.demo).length),previousRecords+1);
  assert.equal(await page.evaluate(()=>TrainingOverlay.isLocked()),false);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
  await page.screenshot({path:'test-results/pulse-field/'+kind+'-stable-'+name+'.png'});
 }
 assert.deepEqual(errors,[]);await context.close();console.log(name+' scroll, Zen dialogs and session lifecycle passed');
}
(async()=>{const browser=await webkit.launch();try{await verify(browser,true);await verify(browser,false);}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
