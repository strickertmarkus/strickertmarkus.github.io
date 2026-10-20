/* Isolated fixtures: never connects to Firebase or saves user data. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const base=process.env.PULSE_TEST_URL||'http://127.0.0.1:4173';
const out=process.env.ZEN_SCREENSHOTS||'test-results/zen-milestones';fs.mkdirSync(out,{recursive:true});
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
 const ctx=await context(browser,{width:390,height:844}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await ctx.route('https://**/*',r=>r.fulfill({body:''}));
 const click=s=>page.locator(s).evaluate(el=>el.click());
 await page.goto(base+'/budget/zen.html?wellness=stretch',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.ZenStore?.ready);
 for(const kind of ['stretch','meditation']){
  await click('.kind-switch [data-kind='+kind+']');await click('[data-milestone="1"]');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'milestone-title');
  await page.locator('#milestone-name').fill(kind==='stretch'?'Min rörlighet':'Min stillhet');await page.locator('#milestone-metric').selectOption(kind==='stretch'?'count':'minutes');await page.locator('#milestone-goal').fill(kind==='stretch'?'12':'90');
  if(kind==='meditation'){await page.setViewportSize({width:320,height:640});}
  await page.screenshot({animations:'disabled',path:out+'/edit-'+kind+'.png'});
  const r=await page.locator('#milestone-dialog').evaluate(el=>({width:el.getBoundingClientRect().width,overflow:el.scrollWidth>el.clientWidth+1}));assert(!r.overflow&&r.width<=390);
  await click('#milestone-form button[type=submit]');await page.waitForFunction(()=>!document.querySelector('#milestone-dialog').open);assert.equal(await page.locator('#milestone-dialog').evaluate(el=>el.open),false);
 }
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.ZenStore?.ready);
 assert.equal(await page.evaluate(()=>ZenStore.entries.filter(e=>e.type==='milestone').length),2);
 for(const kind of ['stretch','meditation','stretch','meditation']){
  await click('.kind-switch [data-kind='+kind+']');await page.waitForTimeout(1700);await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
  const expected=kind==='stretch'?'rgb(9, 29, 24)':'rgb(167, 195, 189)';
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),expected);
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.wellnessKind),kind);
  await page.screenshot({animations:'disabled',path:out+'/lower-'+kind+'.png'});
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(100);
  const canvas=kind==='stretch'?'.landscape-forest':'.landscape-meditation-v8';
  const pixels=await page.locator(canvas).evaluate(c=>({w:c.width,h:c.height,a:c.getContext('2d').getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data[3]}));assert(pixels.w>100&&pixels.h>100&&pixels.a>0,JSON.stringify(pixels));
 }
 await click('[data-milestone="1"]');assert.equal(await page.locator('#milestone-goal').inputValue(),'90');await page.locator('#milestone-goal').fill('0');assert.equal(await page.locator('#milestone-form').evaluate(f=>f.checkValidity()),false);await click('[data-close=milestone-dialog]');
 await click('[data-milestone="1"]');assert.equal(await page.locator('#milestone-goal').inputValue(),'90');await click('#milestone-reset');
 assert.equal(await page.evaluate(()=>ZenModel.milestones('meditation',ZenStore.entries)[1].goal),5);
 assert.equal(await page.evaluate(()=>ZenModel.milestones('stretch',ZenStore.entries)[1].goal),12);
 await click('#start-button');await page.waitForTimeout(900);await click('#leave-session');await page.waitForTimeout(1600);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(167, 195, 189)');await page.screenshot({animations:'disabled',path:out+'/return-home.png'});
 assert.deepEqual(errors,[]);console.log('Milestones edit, save, reload, cancel, validation, reset, kind isolation and repeated background switches passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
