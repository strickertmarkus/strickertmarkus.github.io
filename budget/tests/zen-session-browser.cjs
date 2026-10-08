/* Isolated fixtures: never connects to Firebase or saves user data. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const base=process.env.PULSE_TEST_URL||'http://127.0.0.1:4173';
const out=process.env.ZEN_SCREENSHOTS||'test-results/zen-sessions';fs.mkdirSync(out,{recursive:true});
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
async function geometry(page,kind,size){
 const data=await page.evaluate(()=>{
  const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};};
  return{overflow:document.documentElement.scrollWidth>innerWidth+1,scroll:document.getElementById('session-view').scrollHeight>innerHeight+2,controls:['leave-session','sound-toggle','pause-session','finish-session'].map(rect),title:rect('session-title'),stage:rect('breathing-field'),phase:rect('breath-label'),clock:rect('session-clock'),scene:getComputedStyle(document.querySelector('.landscape')).display};
 });
 assert.equal(data.overflow,false,'horizontal overflow');assert.equal(data.scroll,false,`unwanted session scrolling ${JSON.stringify(data)}`);assert.equal(data.scene,'none');
 for(const r of data.controls){assert.ok(r.x>=0&&r.right<=size.width+1&&r.y>=0&&r.bottom<=size.height,`control outside viewport: ${JSON.stringify(r)}`);assert.ok(r.h>=44,'touch target too short');}
 for(let i=0;i<data.controls.length;i++)for(let j=i+1;j<data.controls.length;j++){const a=data.controls[i],b=data.controls[j];assert.ok(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y,'overlapping controls');}
 if(kind==='meditation'){assert.ok(data.phase.y>=data.stage.bottom,'instruction overlaps sun');assert.ok(data.clock.y>data.stage.bottom,'timer overlaps sun');}
}
(async()=>{
 const browser=await webkit.launch({headless:true,...(process.env.ZEN_WEBKIT?{executablePath:process.env.ZEN_WEBKIT}:{})});
 try{for(const size of [{width:390,height:844},{width:320,height:640},{width:1440,height:960}]){
  const ctx=await context(browser,size),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const kind of ['stretch','meditation']){
   await page.goto(base+'/budget/zen.html?wellness='+kind);await page.waitForFunction(()=>window.ZenStore?.ready);await page.locator('#start-button').click();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1100);
   if(kind==='stretch'){await page.locator('#following-step').click();await page.locator('#following-step').click();await page.waitForTimeout(750);assert.match(await page.locator('#session-side').innerText(),/Vänster/i);}
   await page.screenshot({path:`${out}/${kind}-${size.width}.png`});await geometry(page,kind,size);
   const paints=await page.evaluate(()=>homePaints);await page.waitForTimeout(240);assert.equal(await page.evaluate(()=>homePaints),paints,'home scenery still running behind session');
   await page.locator('#pause-session').click();assert.equal(await page.evaluate(()=>ZenStore.active.paused),true);
   const time=await page.locator('#session-clock').innerText();await page.waitForTimeout(300);assert.equal(await page.locator('#session-clock').innerText(),time);
   if(kind==='stretch'){
    await page.locator('#restart-step').click();assert.equal(await page.locator('#session-clock').innerText(),'1:00');
    await page.locator('#following-step').click();assert.match(await page.locator('#session-side').innerText(),/Höger/i);
    await page.locator('#previous-step').click();assert.match(await page.locator('#session-side').innerText(),/Vänster/i);
   }else{
    await page.locator('#guidance-toggle').click();assert.equal(await page.evaluate(()=>ZenStore.active.routine.guidance),'silent');
    await page.locator('#clock-toggle').click();assert.equal(await page.locator('#session-clock').isVisible(),false);await page.locator('#clock-toggle').click();
    await page.locator('#session-audio summary').click();await page.locator('#session-volume').fill('35');assert.equal(await page.locator('#volume-value').innerText(),'35 %');await page.locator('#session-audio summary').click();
   }
   await page.locator('#leave-session').click();await page.locator('#resume-button').click();assert.equal(await page.evaluate(()=>ZenStore.active.paused),false);
   await page.locator('#finish-session').click();await page.locator('#confirm-yes').click();await page.waitForSelector('#complete-view:not([hidden])');await page.locator('#save-session').click();
   const recorded=await page.evaluate(()=>ZenStore.entries.filter(e=>e.type==='session'&&!e.demo).at(-1));assert.ok(recorded.seconds>0&&recorded.seconds<30,`skipping must not inflate log: ${recorded.seconds}`);
   assert.equal(await page.locator('#home-view').isVisible(),true);
  }
  assert.deepEqual(errors,[]);await ctx.close();console.log(`PASS ${size.width}: visuals, controls, pause, navigation, volume and logging`);
 }
 // Complete a short actual routine using the browser's clock, including quiet ending.
 const ctx=await context(browser,{width:390,height:844}),page=await ctx.newPage();
 await page.goto(base+'/budget/zen.html?wellness=meditation');await page.waitForFunction(()=>window.ZenStore?.ready);
 await page.clock.install();await page.locator('#start-button').click();await page.clock.runFor(1100);await page.clock.fastForward(610000);await page.clock.runFor(300);await page.waitForSelector('#session-ending:not([hidden])');
 await page.screenshot({path:`${out}/meditation-ending.png`});await page.locator('#show-session-summary').click();await page.locator('#save-session').click();
 assert.equal(await page.evaluate(()=>ZenStore.entries.find(e=>!e.demo&&e.type==='session').seconds),600);await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
