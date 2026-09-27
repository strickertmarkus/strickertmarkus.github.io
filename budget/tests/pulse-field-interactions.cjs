/* Browser regression suite: actual interactions, idle work and nested scroll locks.
   Run against the local fixture server; Firebase is isolated from real user data. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const base=process.env.PULSE_TEST_URL||'http://127.0.0.1:4173';
async function setup(browser,mobile,profile='markus'){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},isMobile:mobile,hasTouch:mobile});
 await context.route('https://**/*',r=>r.fulfill({body:''}));
 await context.route('**/auth-gate.js*',r=>r.fulfill({body:''}));
 // Mirror the profile storage read adapter without a real Firebase connection.
 await context.route('**/firebase-sync.js*',r=>r.fulfill({body:`if(new URLSearchParams(location.search).get('user')==='maja'){const get=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return get.call(this,/^ex_/.test(k)&&!k.endsWith('_maja')?k+'_maja':k);};}`}));
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept(d.type()==='prompt'?'Testmall':''));
 await page.goto(base+'/budget/exercise.html'+(profile==='maja'?'?user=maja':''));
 await page.waitForSelector('[data-day]');
 return {context,page,errors};
}
async function closed(page){await page.waitForFunction(()=>!document.getElementById('field-workspace').open);assert.equal(await page.evaluate(()=>TrainingOverlay.isLocked()),false);}
async function open(page,tool){await page.evaluate(tool=>dispatchEvent(new CustomEvent('pulse-field:open-tool',{detail:{tool}})),tool);}
async function verify(browser,mobile){
 const {context,page,errors}=await setup(browser,mobile);
 await page.locator('#menu-toggle').click();
 assert.equal(await page.evaluate(()=>document.body.style.position),'fixed');
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>TrainingOverlay.isLocked()),false);
 const day=page.locator('[data-day]').nth(2);const date=await day.getAttribute('data-day');
 await day.scrollIntoViewIfNeeded();await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
 const before=await page.evaluate(()=>scrollY);await day.click();
 const frame=page.frames().find(f=>f.url().includes('embedded=1'));
 await frame.waitForSelector('#day-workout-modal.show');
 await frame.waitForSelector('#between-exercise-toggle-panel-v7.builder-toggle-cluster-v13');
 await page.waitForTimeout(600);
 await frame.evaluate(()=>{window.idleWrites=0;window.idleObserver=new MutationObserver(rs=>idleWrites+=rs.length);idleObserver.observe(document.getElementById('day-workout-modal'),{subtree:true,attributes:true,childList:true});});
 await page.waitForTimeout(450);
 const idleWrites=await frame.evaluate(()=>{idleObserver.disconnect();return idleWrites;});
 assert.ok(idleWrites<8,'An idle builder must stop rewriting the DOM: '+idleWrites);
 console.log((mobile?'mobile':'desktop')+' idle mutations: '+idleWrites);
 await frame.locator('.dw-name').first().click();await frame.locator('.exercise-name-picker-new-v1').click();await frame.locator('.dw-name').first().fill('Testpress');
 await frame.locator('.dw-metric1').first().fill('2');await frame.locator('.dw-metric2').first().fill('8');await frame.locator('.dw-metric3').first().fill('20');
 await frame.locator('.builder-row-plus-v3').first().click();assert.equal(await frame.locator('#day-workout-ex-list .ex-row-item').count(),2);
 await frame.locator('#day-workout-ex-list .ex-row-item').last().locator('.ex-del').click();
 await frame.locator('[data-per-set-toggle-v7]').click();await frame.locator('[data-per-set-seconds-v7]').fill('30');
 const timer=frame.locator('#pretimer-builder-switch-v2'),initial=await timer.getAttribute('aria-pressed');await timer.click();assert.notEqual(await timer.getAttribute('aria-pressed'),initial);
 await frame.locator('[onclick="saveDayWorkoutPlan()"]').click();await frame.waitForSelector('#exercise-plan-preview-v7.show');
 assert.equal(await frame.locator('#day-workout-modal').evaluate(el=>el.inert),true,'Underlying builder must be inert during preview');
 assert.equal(await frame.evaluate(()=>TrainingOverlay.isLocked()),true);
 await page.keyboard.press('Escape');await frame.waitForSelector('#exercise-plan-preview-v7.show',{state:'hidden'});
 assert.equal(await frame.locator('#day-workout-modal').evaluate(el=>el.inert),false);
 assert.equal(await frame.evaluate(()=>TrainingOverlay.isLocked()),true,'Nested close must keep outer lock');
 await frame.locator('[onclick="saveDayWorkoutPlan()"]').click();await frame.locator('[data-preview-save-v7]').click();await closed(page);
 assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before)<2,'Restore original host scroll position');
 const stored=await page.evaluate(date=>JSON.parse(localStorage.getItem('ex_plannedSessions'))[date],date);
 assert.equal(stored.exercises[0].name,'Testpress');assert.equal(stored.exercises[0].betweenSets.seconds,30);
 // Template footer is temporary, not an accumulating customization of the log modal.
 for(let i=0;i<2;i++){await open(page,'createTemplate');await frame.waitForSelector('#wk-modal.show');assert.equal(await frame.locator('[data-field-template-save]').count(),1);await page.locator('#field-workspace-close').click();await closed(page);}
 await open(page,'log');await frame.waitForSelector('#wk-modal.show');assert.equal(await frame.locator('[data-field-template-save]').count(),0);assert.equal(await frame.locator('[onclick="saveWorkout()"]').evaluate(el=>el.hidden),false);
 await page.locator('#field-workspace-close').click();await closed(page);
 // Saving a log and editing one exercise must complete without old chart dependencies.
 await open(page,'log');await frame.waitForSelector('#wk-modal.show');
 await frame.locator('.ex-name').first().evaluate(el=>{el.value='Testpress';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await frame.locator('#wk-dur').fill('25');await frame.locator('.ex-metric1').first().fill('2');await frame.locator('.ex-metric2').first().fill('8');await frame.locator('.ex-metric3').first().fill('25');
 await frame.locator('[onclick="saveWorkout()"]').click();await closed(page);
 assert.equal(await frame.evaluate(()=>getWorkouts().length),1);
 await page.waitForSelector('[data-field-action="edit-exercise"]');await page.locator('[data-field-action="edit-exercise"]').first().click();await frame.waitForSelector('#exercise-edit-modal-v9.show');
 await frame.locator('[onclick="saveSingleExerciseEdit()"]').click();await closed(page);
 for(const [tool,id] of [['week','plan-modal'],['weekTemplates','template-modal'],['records','pr-modal'],['goals','pulse-goals']]){
  await open(page,tool);await frame.waitForSelector('#'+id);if(tool==='goals'){await frame.locator('#g2-goal').fill('12');await frame.locator('[onclick="saveGoals()"]').click();assert.equal(await frame.evaluate(()=>getGoals().runDistanceGoal),12);}assert.equal(await page.evaluate(()=>TrainingOverlay.isLocked()),true);await page.locator('#field-workspace-close').click();await closed(page);
 }
 await day.click();await frame.waitForSelector('#day-workout-modal.show');await frame.locator('[onclick="startDayWorkoutFromBuilder()"]').click();await frame.waitForSelector('#session-modal.show');
 await frame.waitForFunction(()=>!!window.__embeddedSessionAssetsPromiseV1);await frame.evaluate(()=>window.__embeddedSessionAssetsPromiseV1);
 assert.equal(await frame.locator('#session-pretimer-toggle-v2').count(),1);
 assert.equal(await frame.evaluate(()=>!!window.__exercisePulseFlowMainV85Installed&&!!window.__exercisePulseFlowEcgGlowV128Installed&&!!window.__exercisePulseFlowCanvasGlowV140Installed),true,'All approved Pulse Flow/ECG owners must be ready');
 assert.equal(await frame.locator('#session-view-toggle').count(),0,'Embedded training stays permanently in Pulse Flow');
 assert.equal(await frame.locator('.pulse-flow-trace-v58').count()>0,true);
 const sessionTimer=frame.locator('#session-pretimer-toggle-v2');
 if(await sessionTimer.getAttribute('aria-pressed')==='true')await sessionTimer.click();
 await frame.locator('#session-controls .primary').click();
 await frame.waitForFunction(()=>sessionState&&sessionState.setRunning);
 assert.equal(await frame.locator('#session-modal').evaluate(el=>el.classList.contains('pulse-flow-active-v58')),true);

 fs.mkdirSync('test-results/pulse-field',{recursive:true});await page.screenshot({path:'test-results/pulse-field/robust-session-'+(mobile?'mobile':'desktop')+'.png'});
 await page.locator('#field-workspace-close').click();await closed(page);
 await day.click();await frame.waitForSelector('#day-workout-modal.show');assert.equal(await frame.locator('#pretimer-builder-switch-v2').count(),1);
 await page.screenshot({path:'test-results/pulse-field/robust-builder-'+(mobile?'mobile':'desktop')+'.png'});await page.locator('#field-workspace-close').click();await closed(page);
 await page.locator('#training-overview-toggle').click();
 const compact=page.frameLocator('#field-compact-host iframe');
 await compact.locator('html[data-training-overview="compact"]').waitFor({state:'attached',timeout:10000});
 assert.equal(await page.evaluate(()=>TrainingOverlay.isLocked()),true);
 await compact.locator('#training-overview-toggle').click();await page.waitForFunction(()=>!document.getElementById('field-compact-host'));
 assert.equal(await page.evaluate(()=>TrainingOverlay.isLocked()),false);
 assert.deepEqual(errors,[],'No runtime errors');await context.close();
}
async function verifyProfileAndRetry(browser){
 const {context,page,errors}=await setup(browser,true,'maja');
 await page.evaluate(()=>{localStorage.setItem('ex_prs',JSON.stringify({Markus:50}));localStorage.setItem('ex_prs_maja',JSON.stringify({Maja:25}));});
 await open(page,'records');const frame=page.frames().find(f=>f.url().includes('embedded=1'));await frame.waitForSelector('#pr-modal.show');
 assert.deepEqual(await frame.evaluate(()=>getPRs()),{Maja:25});await frame.locator('#pr-name').fill('Majatest');await frame.locator('#pr-val').fill('30');await frame.locator('[onclick="savePR()"]').click();await closed(page);
 assert.deepEqual(await frame.evaluate(()=>JSON.parse(localStorage.getItem('ex_prs'))),{Markus:50});assert.equal(await frame.evaluate(()=>JSON.parse(localStorage.getItem('ex_prs_maja')).Majatest),30);
 assert.deepEqual(errors,[]);await context.close();
 // Close the workspace during opening, then select a different tool.
 const retry=await setup(browser,false);await retry.page.reload();
 const p=retry.page;await p.locator('#field-workspace iframe').waitFor({state:'attached'});
 await open(p,'build');await p.locator('#field-workspace-close').click();await open(p,'records');
 const f=p.frames().find(f=>f.url().includes('embedded=1'));await f.waitForSelector('#pr-modal.show');assert.equal(await f.locator('#day-workout-modal.show').count(),0,'Stale load callbacks must not reopen a canceled tool');await p.locator('#field-workspace-close').click();await closed(p);await retry.context.close();
}
(async()=>{const browser=await webkit.launch();try{await verify(browser,true);await verify(browser,false);await verifyProfileAndRetry(browser);console.log('Pulse Field interaction regressions passed');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
