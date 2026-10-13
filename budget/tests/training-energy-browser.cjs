/* Production session regressions. All storage/network fixtures are isolated. */
const {webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.PULSE_TEST_URL||'http://127.0.0.1:4173';
fs.mkdirSync('test-results/training-energy',{recursive:true});
async function verify(width,profile){
 const browser=await webkit.launch();
 const context=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600});
 await context.route('https://**/*',r=>r.fulfill({body:''}));
 await context.route('**/auth-gate.js*',r=>r.fulfill({body:''}));
 await context.route('**/firebase-sync.js*',r=>r.fulfill({body:''}));
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(base+'/budget/exercise.html?user='+profile);
 await page.waitForFunction(()=>document.querySelector('.field-workspace-frame')?.contentWindow?.__embeddedBuilderReadyV1);
 const frame=page.frames().find(f=>f.url().includes('/archive/exercise.html'));
 await frame.evaluate(()=>window.__embeddedBuilderReadyV1);
 const date='2026-10-13';
 async function start(exercises){
  await frame.evaluate(({date,exercises})=>{savePlannedSessions({[date]:{type:'Styrka',preTimerEnabled:false,betweenExercises:{type:'none'},exercises}});}, {date,exercises});
  await page.evaluate(date=>window.dispatchEvent(new CustomEvent('pulse-field:open-tool',{detail:{tool:'start',date}})),date);
  await frame.waitForFunction(()=>window.__exerciseSessionTransitionStabilityV142&&sessionState&&document.querySelector('#session-modal.show'));
  await frame.locator('#session-controls .primary').click();
  await frame.waitForFunction(()=>sessionState.setRunning);
 }
 async function stop(){await frame.evaluate(()=>stopSessionMode(false));await page.waitForFunction(()=>!document.getElementById('field-workspace').open);}
 async function shot(name){const path=`test-results/training-energy/${profile}-${width}-${name}.jpg`;await page.screenshot({path,type:'jpeg',quality:55});return path;}
 const strength={kind:'strength',name:'Bänkpress',sets:1,reps:8,weight:40,betweenSets:{type:'rest',seconds:3}};
 await start([strength]);
 assert.equal(await page.locator('.field-workspace-header').isVisible(),false);
 const box=await page.locator('.field-workspace-frame').boundingBox();assert.ok(box.y<1&&box.height>=843,JSON.stringify(box));
 const geometry=await frame.evaluate(()=>{const nodes=[...document.querySelectorAll('#session-modal .session-top button')].filter(n=>n.getClientRects().length);return {overflow:document.documentElement.scrollWidth>innerWidth,rects:nodes.map(n=>{const r=n.getBoundingClientRect();return {id:n.id,x:r.x,y:r.y,right:r.right,bottom:r.bottom};})};});
 assert.equal(geometry.overflow,false);
 for(const r of geometry.rects)assert.ok(r.x>=0&&r.right<=width+1,'header inside viewport '+JSON.stringify(r));
 for(let i=0;i<geometry.rects.length;i++)for(let j=i+1;j<geometry.rects.length;j++){const a=geometry.rects[i],b=geometry.rects[j];assert.ok(a.right<=b.x+1||b.right<=a.x+1||a.bottom<=b.y+1||b.bottom<=a.y+1,'overlap '+JSON.stringify([a,b]));}
 await shot('session');
 // Repeat extra-set rest: counts down and starts exactly one added set.
 for(let extra=2;extra<=3;extra++){
  await frame.locator('#session-controls .primary').click();
  await frame.locator('#session-controls button').filter({hasText:'Extra set'}).click();
  await frame.waitForSelector('#session-between-overlay-v2.show');
  const before=await frame.locator('#bs-overlay-value').textContent();
  await page.waitForTimeout(1150);
  const after=await frame.locator('#bs-overlay-value').textContent();assert.notEqual(after,before,'extra rest countdown must tick');
  assert.equal(await frame.locator('#session-countdown-ring.is-overtime').count(),0,'rest never becomes overtime');
  if(extra===2)await shot('extra-rest');
  await frame.waitForFunction(n=>sessionState.setRunning&&sessionState.currentSet===n,extra);
  assert.equal(await frame.evaluate(()=>sessionState.exercises[0].plannedSets),extra);
 }
 await stop();
 await start([{kind:'cardio',name:'Löpning',time:1,distance:1}]);
 await frame.waitForSelector('html.cardio-focus-active',{state:'attached'});
 await frame.evaluate(()=>{sessionState.setStartedAt=Date.now()-59500;updateSessionTimers();});
 await frame.waitForSelector('#session-countdown-ring.is-overtime');
 await frame.waitForFunction(()=>!document.documentElement.classList.contains('cardio-focus-active'));
 await page.waitForTimeout(1200);
 assert.match(await frame.locator('#session-countdown-value').textContent(),/^\+ [1-9]/);
 assert.equal(await frame.locator('#session-countdown-value').evaluate(n=>getComputedStyle(n).color),'rgb(167, 243, 208)');
 await shot('overtime');
 // Pausing must freeze overtime and resuming must continue it.
 await frame.locator('#session-countdown-ring').click();
 await frame.waitForFunction(()=>sessionState.__hypePaused);
 const paused=await frame.locator('#session-countdown-value').textContent();await page.waitForTimeout(1200);
 assert.equal(await frame.locator('#session-countdown-value').textContent(),paused);
 await frame.locator('#session-countdown-ring').click();
 await frame.waitForFunction(()=>!sessionState.__hypePaused);
 await page.waitForTimeout(1200);assert.notEqual(await frame.locator('#session-countdown-value').textContent(),paused);
 // Compare actual canvas redraw work with the same visible timer.
 if(width<600){
  await frame.evaluate(()=>{window.paintCalls=0;const original=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){window.paintCalls++;return original.apply(this,args);};});
  await page.waitForTimeout(1200);const normal=await frame.evaluate(()=>window.paintCalls);
  await frame.locator('#session-energy-toggle').click();
  await page.waitForTimeout(300);await frame.evaluate(()=>window.paintCalls=0);
  await page.waitForTimeout(1200);const saving=await frame.evaluate(()=>window.paintCalls);
  console.log('CANVAS_REDRAWS',JSON.stringify({width,normal,saving}));
  assert.ok(normal>10&&saving<normal*.3,'energy saver must reduce canvas drawing substantially');
  assert.equal(await frame.locator('#session-energy-toggle').getAttribute('aria-pressed'),'true');
  await shot('energy');
  const before=await frame.locator('#session-countdown-value').textContent();await page.waitForTimeout(1100);assert.notEqual(await frame.locator('#session-countdown-value').textContent(),before);
 }
 await stop();
 // Timed custom exercise uses the same overtime path; it stays active until done.
 await start([{...strength,sets:2,betweenSets:{type:'custom',name:'Höga knän',seconds:2}}]);
 if(width<600)assert.equal(await frame.locator('#session-energy-toggle').getAttribute('aria-pressed'),'true','choice survives next session');
 await frame.locator('#session-controls .primary').click();
 await frame.locator('#session-controls .primary').click();
 await frame.waitForFunction(()=>!!sessionState.__betweenCustomRuntimeV3);
 await frame.locator('#session-controls .primary').click();
 await frame.waitForFunction(()=>sessionState.setRunning);
 await frame.waitForSelector('#session-countdown-ring.is-overtime');
 await frame.waitForFunction(()=>!document.documentElement.classList.contains('cardio-focus-active'));
 assert.equal(await frame.evaluate(()=>!!sessionState.__betweenCustomRuntimeV3),true);
 const timerRect=await frame.locator('#session-countdown-ring').boundingBox();assert.ok(timerRect.width<220,'custom overtime collapses '+JSON.stringify(timerRect));
 await shot('between-overtime');
 await frame.locator('#session-controls .primary').click();
 await frame.waitForFunction(()=>!sessionState.__betweenCustomRuntimeV3);
 await stop();
 assert.deepEqual(errors,[]);
 await context.close();await browser.close();
}
(async()=>{for(const [width,profile] of [[390,'markus'],[320,'maja'],[1280,'markus']])await verify(width,profile);console.log('TRAINING_ENERGY_PASS');})().catch(e=>{console.error(e);process.exit(1);});
