/* Isolated fixtures: never connects to Firebase or saves user data. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const base=process.env.PULSE_TEST_URL||'http://127.0.0.1:4173';
const out=process.env.ZEN_SCREENSHOTS||'test-results/zen-meditation-builder';fs.mkdirSync(out,{recursive:true});
async function context(browser,size){
 const ctx=await browser.newContext({viewport:size,isMobile:size.width<700,hasTouch:size.width<700});
 await ctx.route('https://**/*',r=>/fonts\.(googleapis|gstatic)\.com/.test(r.request().url())?r.continue():r.fulfill({body:''}));
 await ctx.route('**/auth-gate.js*',r=>r.fulfill({body:''}));
 await ctx.addInitScript(()=>{
  const auth={currentUser:{uid:'session-fixture'},onAuthStateChanged(cb){queueMicrotask(()=>cb(this.currentUser));return()=>{};}};
  const ref=()=>({on(e,cb){queueMicrotask(()=>cb({val:()=>null}));},off(){},once:()=>Promise.resolve({val:()=>null}),child:()=>ref(),set:()=>Promise.resolve()});
  window.firebase={apps:[{}],auth:()=>auth,database:()=>({ref})};
  window.homePaints=0;const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.closest('.landscape'))homePaints++;return clear.apply(this,args);};
 });
 return ctx;
}
(async()=>{
 const browser=await webkit.launch({headless:true,...(process.env.ZEN_WEBKIT?{executablePath:process.env.ZEN_WEBKIT}:{})});
 try{
  const ctx=await context(browser,{width:390,height:844}),page=await ctx.newPage(),errors=[];
  await ctx.route('https://**/*',r=>r.fulfill({body:''}));
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.testNow=Date.now();Date.now=()=>window.testNow;document.addEventListener('zen:session-frame',e=>window.lastFrame=e.detail);});
  const click=selector=>page.locator(selector).evaluate(b=>b.click());
  const fill=async(selector,value)=>{await page.locator(selector).fill(String(value));};
  await page.goto(base+'/budget/zen.html?wellness=meditation',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.ZenStore?.ready);
  await click('#create-routine');assert.equal(await page.locator('#builder-dialog').evaluate(d=>d.open),true);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'builder-title');
  await fill('#routine-name','Min kvällsrytm');await fill('#meditation-minutes',12);
  for(const [id,v] of [['inhale',3],['holdIn',2],['exhale',7],['holdOut',1]])await fill('#breath-'+id,v);
  assert.match(await page.locator('#breath-summary').innerText(),/13 sek per varv/);
  for(const size of [{width:390,height:844},{width:320,height:640},{width:1280,height:900}]){
   await page.setViewportSize(size);await page.waitForTimeout(150);
   const g=await page.evaluate(()=>{const d=document.querySelector('#builder-dialog'),r=d.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,overflow:d.scrollWidth>d.clientWidth+1,small:[...d.querySelectorAll('input:not([type=checkbox]),select')].filter(e=>e.getBoundingClientRect().width>0).some(e=>parseFloat(getComputedStyle(e).fontSize)<16)};});
   assert.ok(g.left>=0&&g.right<=size.width&&g.top>=0&&g.bottom<=size.height,JSON.stringify(g));assert.ok(!g.overflow&&!g.small,JSON.stringify(g));
   await page.screenshot({animations:'disabled',path:out+'/builder-'+size.width+'.png'});
   if(size.width<400){await page.locator('#builder-dialog .builder-footer').evaluate(el=>el.scrollIntoView({block:'end'}));await page.screenshot({animations:'disabled',path:out+'/builder-footer-'+size.width+'.png'});await page.locator('#builder-dialog').evaluate(el=>el.scrollTop=0);}
  }
  await page.setViewportSize({width:390,height:844});
  await fill('#breath-inhale',0);assert.equal(await page.locator('#builder-form').evaluate(f=>f.checkValidity()),false);await fill('#breath-inhale',3);
  await click('#builder-form button[type=submit]');await page.waitForFunction(()=>!document.querySelector('#builder-dialog').open);assert.equal(await page.locator('#builder-dialog').evaluate(d=>d.open),false);
  const saved=await page.evaluate(()=>ZenStore.entries.find(e=>e.type==='routine'&&e.routine.name==='Min kvällsrytm'));
  assert.deepEqual(saved.routine.breathing,{inhale:3,holdIn:2,exhale:7,holdOut:1});assert.equal(saved.routine.seconds,720);
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.ZenStore?.ready);
  assert.equal(await page.locator('#selected-name').innerText(),'Min kvällsrytm');
  await click('.selected-routine');assert.equal(await page.locator('#breath-exhale').inputValue(),'7');await fill('#routine-name','Min ändrade rytm');await page.evaluate(()=>window.testNow+=1000);await click('#builder-form button[type=submit]');
  assert.equal(await page.evaluate(()=>ZenStore.entries.filter(e=>e.type==='routine').length),1);
  await click('#start-button');await page.waitForTimeout(250);assert.equal(await page.locator('#session-clock').innerText(),'12:00');
  for(const [advance,id] of [[0,'inhale'],[3000,'holdIn'],[2000,'exhale'],[7000,'holdOut'],[1000,'inhale']]){
   await page.evaluate(ms=>window.testNow+=ms,advance);await page.waitForTimeout(250);
   const frame=await page.evaluate(()=>window.lastFrame);assert.equal(frame.breathing.id,id);assert.equal(frame.scale,frame.breathing.scale);
   if(id==='holdIn')await page.screenshot({animations:'disabled',path:out+'/session-hold.png'});
  }
  await click('#pause-session');const clock=await page.locator('#session-clock').innerText();await page.evaluate(()=>window.testNow+=45000);await page.waitForTimeout(250);assert.equal(await page.locator('#session-clock').innerText(),clock);
  await click('#pause-session');await page.evaluate(()=>window.testNow+=3000);await page.waitForTimeout(250);assert.equal((await page.evaluate(()=>window.lastFrame)).breathing.id,'inhale');
  await click('#guidance-toggle');await page.waitForTimeout(250);assert.equal((await page.evaluate(()=>window.lastFrame)).guided,false);
  await click('#guidance-toggle');await page.waitForTimeout(250);assert.equal((await page.evaluate(()=>window.lastFrame)).breathing.seconds,3);
  await click('#leave-session');await click('.selected-routine');await fill('#routine-name','Cancel this');await click('[data-close=builder-dialog]');assert.equal(await page.locator('#selected-name').innerText(),'Min ändrade rytm');
  await click('#create-routine');await page.locator('#meditation-guidance').selectOption('silent');assert.equal(await page.locator('#meditation-rhythm').isVisible(),false);await click('#builder-form button[type=submit]');await page.waitForFunction(()=>!document.querySelector('#builder-dialog').open);assert.equal(await page.locator('#builder-dialog').evaluate(d=>d.open),false);
  assert.deepEqual(errors,[]);console.log('Meditation builder: creation, validation, custom phases, persistence, editing, cancel, pause/resume, guide toggle and mobile/desktop layout passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
