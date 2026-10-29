/* WebKit coverage of the real dashboard -> planner -> builder -> session path.
   Fixtures and network are isolated from Firebase and the user's data. */
const {webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.PULSE_TEST_URL||'http://127.0.0.1:4173';
const out='test-results/training-planner';fs.mkdirSync(out,{recursive:true});
async function verify(width,profile){
 const browser=await webkit.launch();
 const context=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600});
 await context.route('https://**/*',r=>r.fulfill({body:''}));
 await context.route('**/auth-gate.js*',r=>r.fulfill({body:''}));
 await context.route('**/firebase-sync.js*',r=>r.fulfill({body:''}));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/budget/exercise.html?user='+profile);
 await page.waitForFunction(()=>document.querySelector('.field-workspace-frame')?.contentWindow?.__embeddedBuilderReadyV1);
 const frame=page.frames().find(f=>f.url().includes('/archive/exercise.html'));await frame.evaluate(()=>window.__embeddedBuilderReadyV1);
 await frame.evaluate(()=>{
  const ex={kind:'strength',name:'Armhävningar',sets:1,reps:12,weight:0,weightMode:'bodyweight'};
  DB.set('plan',Object.fromEntries(DAY_KEYS.map(k=>[k,'Vila'])));DB.set('weekPlans',{});DB.set('wk',[]);
  saveTemplates([{id:17,type:'Helkropp',name:'Styrka hemma',exercises:[ex]}]);
  savePlannedSessions({'2026-10-29':{type:'Helkropp',name:'Styrka hemma',templateId:17,preTimerEnabled:false,betweenExercises:{type:'none'},exercises:[ex]}});
 });
 await page.locator('#edit-week-link').click();
 await frame.locator('#plan-week-date').fill('2026-10-29');
 await frame.locator('#plan-week-date').dispatchEvent('change');
 await frame.locator('[data-plan-view="month"]').click();
 await frame.waitForSelector('.planner-month-grid');
 async function geometry(){
  const result=await frame.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,cells:[...document.querySelectorAll('.planner-month-day')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};})}));
  assert.ok(result.scroll<=result.width+1,JSON.stringify(result));
  assert.ok(result.cells.every(r=>r.left>=-1&&r.right<=result.width+1&&r.width>25),'calendar cell geometry');
  const footer=await frame.locator('#plan-modal .modal-footer').evaluate(el=>({bottom:el.getBoundingClientRect().bottom,height:innerHeight}));
  assert.ok(footer.bottom<=footer.height+1,'Planner save controls stay inside viewport: '+JSON.stringify(footer));
 }
 await geometry();await page.screenshot({path:`${out}/${width}-month.jpg`,type:'jpeg',quality:70});
 await frame.locator('.planner-day-open[data-plan-date="2026-10-29"]').click();
 await frame.locator('.planner-selected-day .pp-builder').click();
 await frame.locator('#day-workout-ex-list .pbu-title').first().click();
 await frame.locator('[data-pbu-weight-mode="kg"]').click();await frame.locator('[data-pbu-value="3"]').fill('25');
 await frame.locator('[data-pbu-weight-mode="bodyweight"]').click();
 assert.match(await frame.locator('.pbu-head').first().textContent(),/Kroppsvikt/);
 const inputs=await frame.locator('.pbu-step-value:visible').evaluateAll(nodes=>nodes.map(el=>({font:parseFloat(getComputedStyle(el).fontSize),rect:el.getBoundingClientRect().toJSON()})));
 for(const input of inputs){assert.ok(input.font>=16);assert.ok(input.rect.right<=width+1);}
 await page.screenshot({path:`${out}/${width}-bodyweight.jpg`,type:'jpeg',quality:70});
 await frame.getByRole('button',{name:'Spara passupplägg',exact:true}).click();
 await frame.getByRole('button',{name:'Spara pass',exact:true}).click();
 await frame.waitForSelector('#plan-modal.show.is-month-view');
 assert.equal(await frame.evaluate(()=>getPlannedSessions()['2026-10-29'].exercises[0].weightMode),'bodyweight');
 assert.equal(await frame.evaluate(()=>getPlannedSessions()['2026-10-29'].exercises[0].weight),0);
 await frame.locator('[data-pulse-copy-v2]').click();
 await frame.getByRole('button',{name:'Nästa månad',exact:true}).click();
 await frame.locator('[data-plan-paste][data-plan-date="2026-11-03"]').click();
 await frame.locator('[data-plan-view="week"]').click();
 assert.match(await frame.locator('.pulse-plan-day-v2[data-index="1"]').textContent(),/Styrka hemma/);
 await frame.locator('[data-plan-view="month"]').click();
 // Keyboard move shares the same swap operation as pointer dragging.
 await frame.locator('[data-plan-drag-date="2026-11-03"]').press('ArrowRight');
 await frame.getByRole('button',{name:'Spara plan',exact:true}).click();
 await page.waitForFunction(()=>!document.getElementById('field-workspace').open);
 assert.equal(await frame.evaluate(()=>getPlannedSessions()['2026-11-04'].exercises[0].weightMode),'bodyweight');
 assert.equal(await frame.evaluate(()=>getPlannedSessions()['2026-11-03']),undefined);
 // The actual session runtime must retain the marker in its set log and saved workout.
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('pulse-field:open-tool',{detail:{tool:'start',date:'2026-10-29'}})));
 await frame.waitForFunction(()=>window.__exerciseSessionTransitionStabilityV142&&sessionState&&document.querySelector('#session-modal.show'));
 await frame.locator('#session-controls .primary').click();await frame.waitForFunction(()=>sessionState.setRunning);
 await frame.locator('#session-controls .primary').click();await frame.waitForFunction(()=>sessionState.logs[0].length===1);
 assert.equal(await frame.evaluate(()=>sessionState.logs[0][0].weightMode),'bodyweight');
 await frame.evaluate(()=>saveSessionWorkout());
 assert.equal(await frame.evaluate(()=>getWorkouts()[0].exercises[0].weightMode),'bodyweight');
 assert.equal(await frame.evaluate(()=>calcVol(getWorkouts()[0])),0);
 // Preserve the newly redesigned log form, pace editing and health meters.
 await page.waitForFunction(()=>!document.getElementById('field-workspace').open);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('pulse-field:open-tool',{detail:{tool:'log',date:'2026-10-29'}})));
 await frame.waitForSelector('#wk-modal.show');
 await frame.evaluate(()=>{document.getElementById('ex-list').innerHTML='';addExRow({kind:'cardio',name:'Löpning',distance:5,time:25});});
 await frame.locator('#ex-list .pbu-title').click();
 assert.equal(await frame.locator('#ex-list [data-pbu-value="2"]').inputValue(),'25:00');
 await frame.locator('#wk-pace').fill('6:00');
 await frame.locator('#wk-type').fill('Löpning med nya mätvärden');
 await frame.locator('#wk-hr-avg').fill('145');await frame.locator('#wk-hr-min').fill('110');await frame.locator('#wk-hr-max').fill('175');await frame.locator('#wk-vo2').fill('48,5');
 await page.screenshot({path:`${out}/${width}-new-log.jpg`,type:'jpeg',quality:70});
 await frame.getByRole('button',{name:'Spara träning',exact:true}).click();
 const latest=await frame.evaluate(()=>getWorkouts().at(-1));
 assert.equal(latest.runDistance,5);assert.equal(latest.runTime,30);assert.equal(latest.hrMin,110);assert.equal(latest.hrMax,175);assert.equal(latest.vo2,48.5);
 assert.deepEqual(errors,[]);
 await context.close();await browser.close();
}
(async()=>{for(const [width,profile] of [[390,'markus'],[320,'maja'],[1280,'markus']])await verify(width,profile);console.log('PLANNER_BODYWEIGHT_PASS');})().catch(e=>{console.error(e);process.exit(1);});
