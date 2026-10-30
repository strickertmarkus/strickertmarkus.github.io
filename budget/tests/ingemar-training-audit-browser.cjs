'use strict';
const {webkit,chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const dir='test-results/ingemar-training-audit';fs.mkdirSync(dir,{recursive:true});
// Isolated persistence fixture. Every external request is blocked; real Firebase
// credentials/accounts/data are never accessed by this suite.
function installFixture(){
 const key='__audit_remote';let listener;
 const read=()=>JSON.parse(localStorage.getItem(key)||'null');
 const write=value=>localStorage.setItem(key,JSON.stringify(value));
 const ref={on(type,cb){listener=cb;queueMicrotask(()=>cb({val:read}));},off(){listener=null;},get:async()=>({val:read}),async transaction(update){
  await new Promise(r=>setTimeout(r,80));
  if(localStorage.getItem('__audit_offline'))throw Error('Offline fixture');
  const result=update(read());write(result);listener?.({val:()=>result});return {committed:true,snapshot:{val:()=>result}};
 }};
 let authListener;const user={uid:'ingemar-audit-fixture',email:'qa@test.invalid'};
 const auth={currentUser:user,setPersistence:async()=>{},onAuthStateChanged(cb){authListener=cb;queueMicrotask(()=>cb(localStorage.getItem('__audit_logout')?null:user));},async signOut(){localStorage.setItem('__audit_logout','1');authListener(null);},async signInWithEmailAndPassword(){localStorage.removeItem('__audit_logout');authListener(user);}};
 const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'LOCAL'}};
 window.firebase={apps:[],initializeApp(){const app={name:'[DEFAULT]'};this.apps.push(app);return app;},auth:authFn,database:()=>({ref:()=>ref})};
 window.__auditRemote=mutate=>{const data=JSON.parse(read()||'{}');mutate(data);write(JSON.stringify(data));listener?.({val:read});};
}
async function synced(page){await page.waitForFunction(()=>IngemarAccount.canEdit&&/^Synkat/.test(IngemarAccount.status));}
async function data(page){await synced(page);return page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('__audit_remote'))));}
async function shot(page,label,selector){await (selector?page.locator(selector):page).screenshot({path:`${dir}/${label}.png`});}
async function geometry(page,selector){
 const bad=await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth,overflow:el.scrollWidth-el.clientWidth};});
 assert.ok(bad.left>=-1&&bad.right<=bad.width+1&&bad.overflow<=2,selector+' geometry '+JSON.stringify(bad));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No page horizontal overflow');
}
async function closeBuilder(page){await page.locator('#builder .modal-head [data-action="close-builder"]').click();await page.waitForFunction(()=>!document.getElementById('builder').open);}
async function confirmSave(page){await page.locator('[data-action="save-plan"]').click();await page.locator('[data-action="preview-save"]').click();await synced(page);}
async function exerciseDrag(page,label){
 const handle=page.locator('[data-drag-exercise="0"]');await handle.scrollIntoViewIfNeeded();
 const rect=await handle.boundingBox(),point={pointerId:71,pointerType:'touch',button:0,buttons:1,clientX:rect.x+10,clientY:rect.y+10};
 const names=()=>page.locator('#exercise-list [data-exercise-name-input]').evaluateAll(els=>els.map(e=>e.value));
 const before=await names();await handle.dispatchEvent('pointerdown',point);
 const ghost=await page.locator('.builder-drag-ghost').boundingBox();
 await page.evaluate(p=>document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,cancelable:true,...p,clientX:p.clientX+15,clientY:p.clientY+50})),point);
 const moved=await page.locator('.builder-drag-ghost').boundingBox();assert.ok(Math.abs(moved.x-ghost.x-15)<2&&Math.abs(moved.y-ghost.y-50)<2,'Drag follows finger');
 await shot(page,label+'-drag');await page.evaluate(p=>document.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,...p})),point);
 assert.deepEqual(await names(),before);assert.equal(await page.locator('.builder-drag-ghost').count(),0);
}
async function run(browserType,label,width){
 const browser=await browserType.launch();
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Stockholm'});
 await context.addInitScript(installFixture);
 await context.route('**/*',r=>{
  const url=r.request().url();if(url.startsWith('http://127.0.0.1:4173/'))return r.continue();
  if(url.includes('firebasejs'))return r.fulfill({contentType:'application/javascript',body:'// isolated fixture'});
  if(url.includes('fonts.googleapis.com'))return r.fulfill({contentType:'text/css',body:''});
  return r.abort();
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
 try{
 await page.goto('http://127.0.0.1:4173/budget/ingemar.html');await synced(page);
 await geometry(page,'#training-view');await shot(page,label+'-empty');
 // Goal bounds, saved across reload.
 for(let i=0;i<20;i++)await page.locator('[data-goal-adjust="1"]').click();
 assert.equal(await page.locator('#stat-week-goal').textContent(),'14');
 for(let i=0;i<20;i++)await page.locator('[data-goal-adjust="-1"]').click();
 assert.equal(await page.locator('#stat-week-goal').textContent(),'1');await synced(page);await page.reload();await synced(page);assert.equal(await page.locator('#stat-week-goal').textContent(),'1');
 // Build, copy, edit, persist, reopen and validate.
 await page.locator('[data-choice="Push"]').click();
 const originalDate=await page.locator('#build-date').inputValue();
 await page.locator('#build-name').fill('Ben & press – eget pass');
 await page.locator('[data-builder-pre-timer]').click();await page.locator('[data-between-toggle="global"]').click();await page.locator('[data-between-edit="global:type"]').selectOption('custom');await page.locator('[data-between-edit="global:seconds"]').fill('42');await page.locator('[data-between-edit="global:name"]').fill('Hopprep');await page.locator('[data-between-toggle="0"]').click();await page.locator('[data-between-edit="0:seconds"]').fill('75');
 await page.locator('[data-set="0:0:weight"]').fill('47.25');
 await page.locator('[data-copy-exercise="0"]').click();
 await page.locator('[data-set="1:0:weight"]').fill('51.5');
 await synced(page);
 let saved=await data(page);const draft=saved.builderDrafts[originalDate];
 assert.notEqual(draft.exercises[0].id,draft.exercises[1].id);assert.notEqual(draft.exercises[0].sets[0].id,draft.exercises[1].sets[0].id);
 await page.locator('[data-exercise-picker="0"]').click();
 await geometry(page,'[data-exercise-menu="0"]');await shot(page,label+'-exercise-menu');
 await page.keyboard.press('Escape');assert.equal(await page.locator('#builder').evaluate(e=>e.open),true);assert.equal(await page.locator('[data-exercise-menu="0"]').evaluate(e=>e.hidden),true);await page.locator('[data-exercise-menu="0"]').waitFor({state:'hidden'});
 await page.locator('[data-exercise-picker="0"]').click();await page.locator('#build-name').click();assert.equal(await page.locator('[data-exercise-menu="0"]').evaluate(e=>e.hidden),true);await page.locator('[data-exercise-menu="0"]').waitFor({state:'hidden'});
 // First tap exposes picker, second explicitly enters name editing; scroll must retain it.
 await page.locator('[data-exercise-name-input="0"]').click();await page.locator('[data-exercise-name-input="0"]').click();
 await page.locator('[data-exercise-name-input="0"]').fill('Egen press 1');
 await page.locator('#builder').evaluate(e=>e.scrollTop+=150);await synced(page);
 assert.equal(await page.locator('[data-exercise-name-input="0"]').inputValue(),'Egen press 1');assert.equal(await page.locator('[data-exercise-name-input="0"]').getAttribute('readonly'),null);
 await shot(page,label+'-builder');await geometry(page,'#builder');await exerciseDrag(page,label);
 console.log(label+': builder and menu lifecycle passed');
 await closeBuilder(page);await synced(page);await page.reload();await synced(page);
 await page.locator('[data-action="build"]').first().click();assert.equal(await page.locator('#build-name').inputValue(),'Ben & press – eget pass');assert.equal(await page.locator('[data-set="1:0:weight"]').inputValue(),'51.5');
 await page.locator('#build-date').fill('');await page.locator('[data-action="save-plan"]').click();await page.waitForFunction(()=>!document.querySelector('#plan-preview').open);assert.equal(await page.locator('#plan-preview').evaluate(e=>e.open),false);
 await page.locator('#build-date').fill(originalDate);await page.locator('[data-set="0:0:reps"]').fill('1.5');await page.locator('[data-action="save-plan"]').click();await page.waitForFunction(()=>!document.querySelector('#plan-preview').open);assert.equal(await page.locator('#plan-preview').evaluate(e=>e.open),false);
 await page.locator('[data-set="0:0:reps"]').fill('10');
 page.once('dialog',d=>d.accept('Mall med eget namn'));await page.locator('[data-action="save-template"]').click();await synced(page);
 const templateId=(await data(page)).templates.find(t=>t.name==='Mall med eget namn').id;
 await page.locator('[data-action="save-plan"]').click();await geometry(page,'#plan-preview');await shot(page,label+'-preview');
 await page.locator('[data-action="preview-back"]').first().click();assert.equal(await page.locator('#builder').evaluate(e=>e.open),true);
 await confirmSave(page);const savedPlan=(await data(page)).plans[originalDate];assert.equal(savedPlan.exercises[0].sets[0].weight,47.25);assert.equal(savedPlan.preTimerEnabled,false);assert.equal(savedPlan.betweenExercises.seconds,42);assert.equal(savedPlan.betweenExercises.name,'Hopprep');assert.equal(savedPlan.exercises[0].betweenSets.seconds,75);
 await page.locator('[data-action="build"]').first().click();await page.locator('#builder-template-select').selectOption(templateId);await page.locator('[data-add-set="0"]').click();assert.equal(await page.locator('#builder-template-select').inputValue(),templateId);
 page.once('dialog',d=>d.accept());await page.locator('[data-action="delete-template"]').click();await page.locator('#builder [data-action="undo-delete"]').click();await synced(page);
 await page.locator('[data-action="apply-template"]').click();assert.equal(await page.locator('#build-name').inputValue(),'Mall med eget namn');await closeBuilder(page);
 // Week planner: copy, clear, undo, whole-week templates including rest days.
 await page.locator('[data-action="plan-week"]').click();assert.equal(await page.evaluate(()=>document.body.dataset.builderOpen),'true');
 const monday=await page.locator('[data-week-day="0"]').getAttribute('data-week-date');
 await page.locator('[data-week-toggle-day="0"]').click();await page.locator('[data-week-type="0:Push"]').click();
 await page.locator('[data-week-copy="0"]').click();await page.locator('[data-week-copy-target="1"]').click();
 assert.notEqual(await page.locator('[data-week-day="1"] .week-day-pass strong').textContent(),'Ingen träning');
 await page.locator('[data-week-clear="1"]').click();await page.locator('#week-planner [data-action="undo-delete"]').click();assert.notEqual(await page.locator('[data-week-day="1"] .week-day-pass strong').textContent(),'Ingen träning');
 await page.locator('[data-week-type="1:Vila"]').click();
 await page.locator('.week-template-drawer > summary').click();page.once('dialog',d=>d.accept('Vecka med vila'));await page.locator('[data-action="save-week-template"]').click();await synced(page);
 const weekId=(await data(page)).weekTemplates.find(t=>t.name==='Vecka med vila').id;
 await page.locator('[data-week-type="1:Pull"]').click();await page.locator('#week-template-select').selectOption(weekId);await page.locator('[data-action="apply-week-template"]').click();assert.equal(await page.locator('[data-week-day="1"] .week-day-pass strong').textContent(),'Ingen träning');
 page.once('dialog',d=>d.accept());await page.locator('[data-action="delete-week-template"]').click();await page.locator('#week-planner [data-action="undo-delete"]').click();await synced(page);
 await shot(page,label+'-week');await geometry(page,'#week-planner');
 await page.locator('[data-week-edit="0"]').first().click();await page.locator('#build-name').fill('Veckans måndag');await confirmSave(page);
 await page.waitForFunction(()=>document.getElementById('week-planner').open);assert.equal(await page.evaluate(()=>document.body.dataset.builderOpen),'true');
 assert.equal(await page.locator('[data-week-day="0"] .week-day-pass strong').textContent(),'Veckans måndag');
 // A remote day change while planner is open must be reflected, not overwritten.
 await synced(page);await page.evaluate(date=>window.__auditRemote(d=>{d.plans[date]={type:'Pull',name:'Annan enhet',exercises:d.plans[Object.keys(d.plans)[0]].exercises};}),monday);
 await page.waitForFunction(()=>document.querySelector('[data-week-day="0"] .week-day-pass strong').textContent==='Annan enhet');
 await page.locator('#week-planner .modal-head [data-action="close-week-planner"]').click();await page.waitForFunction(()=>!document.body.dataset.builderOpen);
 await page.locator('[data-delete-day-plan="'+monday+'"]').click({trial:true});page.once('dialog',d=>d.accept());await page.locator('[data-delete-day-plan="'+monday+'"]').click();await page.locator('[data-action="undo-delete"]').click();await synced(page);assert.equal((await data(page)).plans[monday].name,'Annan enhet');
 console.log(label+': weekly planning and templates passed');
 // Manual history, validation, cancel protection, concurrent edit, deletion and undo.
 await page.locator('[data-action="new-history"]').click();await page.locator('#log-edit-name').fill('Registrerat presspass');await page.locator('[data-log-name="0"]').fill('Bänkpress');await page.locator('[data-log-set="0:0:weight"]').fill('60.5');await page.locator('[data-log-set="0:0:reps"]').fill('8');
 await page.locator('[data-action="log-add-exercise"]').click();await page.locator('[data-log-mode="1"]').selectOption('min');await page.locator('[data-log-name="1"]').fill('Promenad');await page.locator('[data-log-set="1:0:minutes"]').fill('2.5');await page.locator('[data-log-move="1:-1"]').click();assert.equal(await page.locator('[data-log-name="0"]').inputValue(),'Promenad');await page.locator('[data-log-remove-ex="0"]').click();
 await page.locator('#log-edit-minutes').fill('0');await page.locator('[data-action="log-save"]').click();assert.equal(await page.locator('#history-editor').evaluate(e=>e.open),true);await page.locator('#log-edit-minutes').fill('45');
 page.once('dialog',d=>d.dismiss());await page.locator('#history-editor .modal-head [data-action="cancel-history-edit"]').click();assert.equal(await page.locator('#history-editor').evaluate(e=>e.open),true);
 await shot(page,label+'-log-editor');await geometry(page,'#history-editor');await page.locator('[data-action="log-save"]').click();await synced(page);
 let log=(await data(page)).history.find(h=>h.name==='Registrerat presspass');assert.equal((await data(page)).prs['bänkpress'].weight,60.5);
 await page.locator(`[data-history="${log.id}"]`).first().click();await shot(page,label+'-log-detail');await page.locator('#log-edit-name').fill('Ändrat passnamn');
 await page.evaluate(id=>window.__auditRemote(d=>{d.history.find(h=>h.id===id).exercises[0].sets[0].weight=65;}),log.id);
 assert.equal(await page.locator('#log-edit-name').inputValue(),'Ändrat passnamn');await page.locator('[data-action="log-save"]').click();await synced(page);
 log=(await data(page)).history.find(h=>h.id===log.id);assert.equal(log.name,'Ändrat passnamn');assert.equal(log.exercises[0].sets[0].weight,65);
 await page.locator(`[data-history="${log.id}"]`).first().click();page.once('dialog',d=>d.accept());await page.locator('[data-action="log-delete"]').click();await page.locator('[data-action="undo-delete"]').click();await synced(page);assert.equal((await data(page)).history.length,1);
 // Manual records and correction; entered fractions must survive reload.
 await page.locator('[data-action="new-record"]').click();await page.locator('#pr-edit-name').fill('Marklyft');await page.locator('#pr-edit-weight').fill('103.75');await page.locator('#pr-edit-group').selectOption('Pull');await page.locator('[data-action="save-record"]').click();await synced(page);assert.equal((await data(page)).manualPrs.marklyft.weight,103.75);
 console.log(label+': history, records and concurrent edits passed');
 // Failed write, reload, recovery: local journal is kept and synchronized later.
 await page.evaluate(()=>localStorage.setItem('__audit_offline','1'));await page.locator('[data-goal-adjust="1"]').click();await page.waitForFunction(()=>/misslyckades/.test(IngemarAccount.status));
 assert.equal(await page.evaluate(()=>!!localStorage.getItem('ex_ingemar_journal')),true);await page.reload();await page.waitForFunction(()=>IngemarAccount.canEdit);assert.equal(await page.locator('#stat-week-goal').textContent(),'2');
 await page.evaluate(()=>{localStorage.removeItem('__audit_offline');dispatchEvent(new Event('online'));});await synced(page);assert.equal((await data(page)).goal,2);
 const beforeMature=await data(page);
 // Simulate a mature profile and verify no collection truncation after more edits.
 await page.evaluate(()=>window.__auditRemote(d=>{
  const ex=i=>({id:'long-ex-'+i,name:'Bänkpress',mode:'kg',sets:[{id:'long-set-'+i,weight:40+i%30,reps:8,done:true}]});
  for(let i=0;i<250;i++){const date=new Date(2025,0,1+i).toLocaleDateString('sv-SE');d.history.push({id:'long-log-'+i,date,type:i%2?'Pull':'Push',name:'Historiskt pass '+i,minutes:40,exercises:[ex(i)]});d.plans[date]={type:'Push',name:'Plan '+i,exercises:[ex(i)]};}
  d.history[0].name='LångtPassnamn'.repeat(5);d.history[0].exercises[0].name='Övningsnamn'.repeat(8);
  for(let i=0;i<80;i++)d.templates.push({id:'long-template-'+i,name:'Långt mallnamn med ben och överkropp '+i,type:'Push',exercises:[ex(i)]});
 }));
 await page.reload();await synced(page);assert.equal(await page.locator('#history > button').count(),251);await page.locator('[data-goal-adjust="1"]').click();saved=await data(page);assert.equal(saved.history.length,251);assert.equal(saved.templates.length,beforeMature.templates.length+80);assert.ok(Object.keys(saved.plans).length>=250);
 for(const metric of ['weight','e1rm','volume'])await page.locator(`[data-analytics-metric="${metric}"]`).click();
 await geometry(page,'#training-view');await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await shot(page,label+'-mature');
 // Responsive review and input geometry on narrow mobile and desktop.
 for(const size of [{width:320,height:740},{width:1440,height:1000}]){
  await page.setViewportSize(size);await page.locator('#history [data-history]').first().click();await geometry(page,'#history-editor');await shot(page,label+'-long-log-'+size.width);await page.locator('#history-editor .modal-head [data-action="cancel-history-edit"]').click();await page.locator('[data-action="build"]').first().click();await geometry(page,'#builder');
  const bad=await page.locator('#builder input').evaluateAll(els=>els.filter(el=>el.getClientRects().length).some(el=>parseFloat(getComputedStyle(el).fontSize)<16));assert.equal(bad,false);
  assert.equal(await page.locator('#builder .builder-session-settings').evaluate(el=>getComputedStyle(el).display),'grid','Session settings retain their layout at '+size.width);
  assert.equal(await page.locator('#builder-pre-timer-toggle').evaluate(el=>getComputedStyle(el).display),'flex','Timer switch retains its layout at '+size.width);
  await shot(page,label+'-builder-'+size.width);await closeBuilder(page);await page.waitForFunction(()=>!document.body.dataset.builderOpen);await geometry(page,'#training-view');await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await shot(page,label+'-overview-'+size.width);
 }
 // Unfinished plans remain editable after mode switches, saving templates and reload.
 await page.setViewportSize({width,height:844});
 await page.locator('[data-action="build"]').first().click();
 const incompleteDate=await page.locator('#build-date').inputValue();
 await page.locator('[data-set="0:0:weight"]').fill('62.75');
 await page.locator('[data-set="0:0:reps"]').fill('');
 await page.locator('[data-mode="0:min"]').click();
 await page.locator('[data-set="0:0:minutes"]').fill('2.5');
 await page.locator('[data-mode="0:kg"]').click();
 assert.equal(await page.locator('[data-set="0:0:weight"]').inputValue(),'62.75');
 assert.equal(await page.locator('[data-set="0:0:reps"]').inputValue(),'');
 await page.locator('[data-mode="0:min"]').click();
 assert.equal(await page.locator('[data-set="0:0:minutes"]').inputValue(),'2.5');
 await page.locator('[data-set="0:0:minutes"]').fill('');
 await page.locator('[data-mode="0:kg"]').click();
 await page.locator('[data-set="0:0:weight"]').fill('');
 await page.locator('[data-mode="0:min"]').click();
 assert.equal(await page.locator('[data-set="0:0:minutes"]').inputValue(),'');
 await closeBuilder(page);await synced(page);await page.reload();await synced(page);
 await page.locator('[data-action="build"]').first().click();
 assert.equal(await page.locator('[data-mode="0:min"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('[data-set="0:0:minutes"]').inputValue(),'');
 page.once('dialog',d=>d.accept('Fyll i under träningen'));
 await page.locator('[data-action="save-template"]').click();await synced(page);
 const incompleteTemplate=(await data(page)).templates.find(t=>t.name==='Fyll i under träningen');
 assert.ok(incompleteTemplate);assert.equal(incompleteTemplate.exercises[0].sets[0].minutes??null,null);
 await page.locator('[data-mode="0:kg"]').click();
 assert.equal(await page.locator('[data-set="0:0:weight"]').inputValue(),'');
 assert.equal(await page.locator('[data-set="0:0:reps"]').inputValue(),'');
 await page.locator('[data-set="0:0:weight"]').scrollIntoViewIfNeeded();await geometry(page,'#builder');await shot(page,label+'-optional-fields');
 await page.locator('[data-action="save-plan"]').click();
 assert.equal(await page.locator('#plan-preview').evaluate(el=>el.open),true);
 assert.ok((await page.locator('#plan-preview-list').textContent()).includes('– kg × –'));
 await page.locator('[data-action="preview-back"]').first().click();await confirmSave(page);
 await page.reload();await synced(page);await page.locator('[data-action="build"]').first().click();
 assert.equal(await page.locator('[data-set="0:0:weight"]').inputValue(),'');
 assert.equal(await page.locator('[data-set="0:0:reps"]').inputValue(),'');
 assert.equal((await data(page)).plans[incompleteDate].exercises[0].sets[0].reps??null,null);
 await closeBuilder(page);
 // A new exercise starts blank; additional sets copy only that exercise's last set.
 await page.locator('[data-action="build"]').first().click();
 const newIndex=await page.locator('#exercise-list > [data-exercise]').count();
 await page.locator('[data-action="add-exercise"]').click();
 await page.locator('#build-name').click();
 for(let j=0;j<3;j++)for(const field of ['weight','reps'])assert.equal(await page.locator(`[data-set="${newIndex}:${j}:${field}"]`).inputValue(),'');
 await page.locator(`[data-set="${newIndex}:2:weight"]`).fill('20');
 await page.locator(`[data-set="${newIndex}:2:reps"]`).fill('8');
 await page.locator(`[data-add-set="${newIndex}"]`).click();
 assert.equal(await page.locator(`[data-set="${newIndex}:3:weight"]`).inputValue(),'20');
 assert.equal(await page.locator(`[data-set="${newIndex}:3:reps"]`).inputValue(),'8');
 await page.locator(`[data-exercise="${newIndex}"]`).scrollIntoViewIfNeeded();await shot(page,label+'-new-exercise-blank');
 await page.locator(`[data-mode="${newIndex}:min"]`).click();
 assert.equal(await page.locator(`[data-set="${newIndex}:0:minutes"]`).inputValue(),'');
 await page.locator('[data-type="Kondition"]').click();
 await page.locator('[data-action="add-exercise"]').click();await page.locator('#build-name').click();
 assert.equal(await page.locator(`[data-set="${newIndex+1}:0:minutes"]`).inputValue(),'');
 assert.equal(await page.locator(`[data-set="${newIndex+1}:0:reps"]`).inputValue(),'');
 await closeBuilder(page);
 assert.deepEqual(errors,[],'No runtime errors');console.log(label+': training-only lifecycle, persistence, menus, statistics and geometry passed');
 }catch(e){await shot(page,label+'-FAILURE');throw e;}finally{await browser.close();}
}
(async()=>{await run(webkit,'webkit',390);await run(chromium,'android',412);})().catch(e=>{console.error(e);process.exitCode=1;});
