'use strict';
const {webkit,chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
async function screenshotDuringBoot(page,path){
 // FontFaceSet.ready waits for document loading too. These screenshots must
 // capture the painted view while deferred SDK requests are deliberately held.
 const previous=process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY;
 process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
 try{
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const geometry=await page.evaluate(()=>[...document.querySelectorAll('#training-view > .section-head,#training-view > .choices')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth};}));
   assert.ok(geometry.every(r=>r.left>=0&&r.right<=r.width+1),'Early view must stay inside the mobile viewport: '+JSON.stringify(geometry));
   await page.screenshot({path});
 }
 finally{if(previous===undefined)delete process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY;else process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY=previous;}
}

async function verifyTouchDrag(page,label){
 const cards=page.locator('#exercise-list > .exercise-card');
 const names=await cards.locator('[data-exercise-name-input]').evaluateAll(els=>els.map(el=>el.value));
 const handle=page.locator('[data-drag-exercise="0"]');await handle.scrollIntoViewIfNeeded();
 const point=await handle.evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
 await handle.dispatchEvent('pointerdown',{pointerId:91,pointerType:'touch',isPrimary:true,button:0,buttons:1,clientX:point.x,clientY:point.y});
 const first=await page.locator('.builder-drag-ghost').boundingBox();
 assert.equal(await page.locator('#builder > .builder-drag-ghost').count(),1,'Preview must belong to modal top layer');
 assert.equal(await page.locator('html.ingemar-builder-drag-active').count(),1,'Drag must disable page text selection');
 await page.evaluate(p=>document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,cancelable:true,pointerId:91,pointerType:'touch',clientX:p.x+18,clientY:p.y+65})),point);
 const moved=await page.locator('.builder-drag-ghost').boundingBox();
 assert.ok(Math.abs(moved.x-first.x-18)<2&&Math.abs(moved.y-first.y-65)<2,'Exercise must follow finger in both axes');
 await page.screenshot({path:'test-results/ingemar-private/drag-follow-'+label+'.png'});
 const scroll=await page.locator('#builder').evaluate(el=>el.scrollTop);
 await page.evaluate(()=>{const r=document.getElementById('builder').getBoundingClientRect();document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,cancelable:true,pointerId:91,pointerType:'touch',clientX:r.left+100,clientY:r.bottom-8}));});
 await page.waitForFunction(before=>document.getElementById('builder').scrollTop>before+10,scroll);
 await page.evaluate(()=>document.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:91,pointerType:'touch'})));
 assert.equal(await page.locator('.builder-drag-ghost').count(),0);
 assert.equal(await page.locator('html.ingemar-builder-drag-active').count(),0,'Cancel must restore normal text selection');
 assert.deepEqual(await cards.locator('[data-exercise-name-input]').evaluateAll(els=>els.map(el=>el.value)),names,'Cancelling drag must preserve order');
 await handle.scrollIntoViewIfNeeded();
 const start=await handle.evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.left+10,y:r.top+10};});
 await handle.dispatchEvent('pointerdown',{pointerId:92,pointerType:'touch',button:0,buttons:1,clientX:start.x,clientY:start.y});
 await page.evaluate(()=>{const d=document.getElementById('builder');d.scrollTop=d.scrollHeight;const r=d.getBoundingClientRect();document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,cancelable:true,pointerId:92,pointerType:'touch',clientX:r.left+100,clientY:r.bottom-5}));document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:92,pointerType:'touch'}));});
 assert.deepEqual(await cards.locator('[data-exercise-name-input]').evaluateAll(els=>els.map(el=>el.value)),names.slice(1).concat(names[0]),'Drop must persist exercise order');
}
(async()=>{
 const browser=await webkit.launch();
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const installFirebase=()=>{
   // Firebase test double: never connects to a real account or database.
   const DBKEY='__ingemar_test_db',AUTHKEY='__ingemar_test_account';
   const observers=new Map();
   const getDb=()=>JSON.parse(localStorage.getItem(DBKEY)||'{}');
   let authListener=null;
   const emailToUid=email=>'fixture-'+email.toLowerCase().replace(/[^a-z0-9]/g,'-');
   function user(){const email=localStorage.getItem(AUTHKEY);return email?{uid:emailToUid(email),email}:null;}
   const auth={
     currentUser:user(),
     setPersistence:async()=>{await new Promise(resolve=>setTimeout(resolve,350));},
     onAuthStateChanged(fn){authListener=fn;queueMicrotask(()=>fn(user()));return()=>{};},
     signInWithEmailAndPassword:async(email,password)=>{
       if(password.length<6)throw {code:'auth/invalid-credential'};
       localStorage.setItem(AUTHKEY,email);auth.currentUser=user();authListener?.(user());return {user:user()};
     },
     createUserWithEmailAndPassword:async(email,password)=>{
       if(password.length<6)throw {code:'auth/weak-password'};
       localStorage.setItem(AUTHKEY,email);auth.currentUser=user();authListener?.(user());return {user:user()};
     },
     signOut:async()=>{localStorage.removeItem(AUTHKEY);auth.currentUser=null;authListener?.(null);}
   };
   function ref(path){return {
     on(type,cb,fail){if(localStorage.getItem('__deny_ingemar')){fail({code:'PERMISSION_DENIED'});return;}observers.set(path,cb);const deliver=()=>cb({val:()=>getDb()[path]||null});if(localStorage.getItem('__delay_ingemar'))window.__deliverIngemar=deliver;else queueMicrotask(deliver);},
     off(){observers.delete(path);},
     async get(){if(localStorage.getItem('__deny_ingemar'))throw {code:'PERMISSION_DENIED'};return {val:()=>getDb()[path]||null};},
     async transaction(update){const db=getDb(),value=update(db[path]||null);db[path]=value;localStorage.setItem(DBKEY,JSON.stringify(db));const cb=observers.get(path);if(cb)cb({val:()=>value});return {committed:true,snapshot:{val:()=>value}};},
     async set(value){const db=getDb();db[path]=value;localStorage.setItem(DBKEY,JSON.stringify(db));
       const cb=observers.get(path);if(cb)cb({val:()=>db[path]});},
   };}
   const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'LOCAL'}};
   const dbFn=()=>({ref});dbFn.ServerValue={TIMESTAMP:1234};
   const apps=[];
   window.firebase={apps,initializeApp(config,name){const app={name:name||'[DEFAULT]'};apps.push(app);return app;},auth:authFn,database:dbFn};
 };
 await context.addInitScript(installFirebase);
 await context.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'// Firebase isolated test double installed by Playwright'}));
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
 await context.route('https://fonts.gstatic.com/**',r=>r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 fs.mkdirSync('test-results/ingemar-private',{recursive:true});
 await page.goto('http://127.0.0.1:4173/budget/ingemar-preview.html',{waitUntil:'domcontentloaded'});
 await page.waitForURL('**/budget/ingemar.html');
 assert.equal(await page.title(),'Ingemars träning');
 assert.equal(await page.locator('#ingemar-account-loading').isVisible(),true,'Initial load must show spinner, not credentials');
 assert.equal(await page.locator('#ingemar-account-gate .account-card').isVisible(),false,'Do not flash the login card on first paint');
 await page.screenshot({path:'test-results/ingemar-private/boot-loader-390.png'});
 assert.equal(await page.locator('#ingemar-account-gate').isVisible(),true);
 assert.equal(await page.locator('main').isVisible(),false);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),true,'Login should not scroll the hidden training page');
 await page.screenshot({path:'test-results/ingemar-private/login-390.png',fullPage:true});
 await page.locator('#ingemar-login-email').fill('ingemar-fixture@test.invalid');
 await page.locator('#ingemar-login-password').fill('testing-12345');
 await page.locator('#ingemar-register-submit').click();
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 assert.equal(await page.locator('#ingemar-account-gate').isVisible(),false);
 assert.equal(await page.locator('main').isVisible(),true);
 assert.match(await page.locator('#ingemar-sync-status').textContent(),/Synkat/);
 const details=await page.evaluate(()=>({apps:firebase.apps.map(a=>a.name),db:JSON.parse(localStorage.getItem('__ingemar_test_db')||'{}')}));
 assert.deepEqual(details.apps,['[DEFAULT]']);
 assert.equal(Object.keys(details.db).length,0,'Empty account should not receive seeded fake data');
 await page.locator('[data-view="stretch"]').click();
 await page.locator('#zen-main-start').click();
 await page.waitForSelector('#zen-session:not([hidden])');
 await page.screenshot({path:'test-results/ingemar-private/stretch-390.png'});
 await page.locator('[data-action="finish-zen"]').click();
 await page.waitForFunction(()=>Object.keys(JSON.parse(localStorage.getItem('__ingemar_test_db')||'{}')).length===1);
 const saved=await page.evaluate(()=>{
    const db=JSON.parse(localStorage.getItem('__ingemar_test_db'));const path=Object.keys(db)[0];
    return {path,history:JSON.parse(db[path]).zenHistory.length};
 });
 assert.equal(saved.path,'ex_ingemar');
 assert.equal(saved.history,1,'Finishing Zen stores the session in Ingemar account');
 await page.screenshot({path:'test-results/ingemar-private/synced-390.png',fullPage:true});
 await page.evaluate(()=>{localStorage.setItem('__delay_ingemar','1');const db=JSON.parse(localStorage.getItem('__ingemar_test_db'));const data=JSON.parse(db.ex_ingemar);data.goal=7;db.ex_ingemar=JSON.stringify(data);localStorage.setItem('__ingemar_test_db',JSON.stringify(db));});
 // Keep every Firebase SDK request pending: local rendering must not wait for
 // SDK downloads, DOMContentLoaded, Auth persistence, or the first snapshot.
 let releaseSdk;const sdkGate=new Promise(resolve=>{releaseSdk=resolve;});
 const delayedSdk=async route=>{await sdkGate;await route.fulfill({status:200,contentType:'application/javascript',body:'// isolated Firebase stub'});};
 await page.route('https://www.gstatic.com/firebasejs/**',delayedSdk);
 await page.reload({waitUntil:'commit'});
 await page.waitForSelector('html[data-ingemar-auth="ready"]',{timeout:2000});
 assert.notEqual(await page.evaluate(()=>document.readyState),'complete','View must render before deferred SDKs finish');
 assert.equal(await page.evaluate(()=>firebase.apps.length),0,'No Firebase initialization before the local view');
 assert.equal(await page.evaluate(()=>IngemarAccount.user),null,'Auth has not yet restored');
 assert.equal(await page.locator('#ingemar-account-loading').isVisible(),false);
 assert.equal(await page.locator('#ingemar-account-gate .account-card').isVisible(),false);
 assert.equal(await page.locator('main').isVisible(),true);
 await screenshotDuringBoot(page,'test-results/ingemar-private/before-firebase-390.png');
 releaseSdk();
 await page.waitForLoadState('domcontentloaded');
 await page.unroute('https://www.gstatic.com/firebasejs/**',delayedSdk);
 await page.waitForFunction(()=>!!IngemarAccount.user);
 assert.equal(await page.evaluate(()=>IngemarAccount.canEdit),false,'Cache may be visible while the first remote snapshot is pending');
 assert.equal(await page.locator('main').evaluate(el=>el.inert),true);
 assert.match(await page.locator('#ingemar-sync-status').textContent(),/Visar sparad data/);
 assert.equal(await page.locator('#family-session-frame').getAttribute('src'),null,'Session assets must not load on refresh');
 await page.screenshot({path:'test-results/ingemar-private/cached-startup-390.png'});
 await page.evaluate(()=>{localStorage.removeItem('__delay_ingemar');window.__deliverIngemar();});
 await page.waitForFunction(()=>IngemarAccount.canEdit);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ex_ingemar')).goal),7,'Newer remote data must replace old cache');
 assert.equal(await page.locator('main').evaluate(el=>el.inert),false);
 // Restore the fixture goal so later weekly-target checks remain independent.
 await page.evaluate(()=>{const db=JSON.parse(localStorage.getItem('__ingemar_test_db'));const data=JSON.parse(db.ex_ingemar);data.goal=4;db.ex_ingemar=JSON.stringify(data);localStorage.setItem('__ingemar_test_db',JSON.stringify(db));window.__deliverIngemar();});
 await page.locator('[data-view="stretch"]').click();
 assert.match(await page.locator('#zen-history').textContent(),/sparad stund/,'Zen log survives reload');
 await page.locator('#ingemar-logout').click();
 await page.waitForSelector('html[data-ingemar-auth="locked"]');
 await page.locator('#ingemar-login-email').fill('other-fixture@test.invalid');
 await page.locator('#ingemar-login-password').fill('testing-12345');
 await page.locator('#ingemar-register-submit').click();
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 await page.locator('[data-view="stretch"]').click();
 assert.match(await page.locator('#zen-history').textContent(),/sparad stund/,'Markus can read the same Ingemar profile with his own login');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),true,'No unintended mobile horizontal overflow');
 assert.deepEqual(errors,[],errors.join(' | '));
 await page.locator('[data-view="training"]').click();
 assert.equal(await page.locator('#family-session-frame').getAttribute('src'),null);
 await page.locator('[data-choice="Push"]').click();
 await page.locator('#builder-start-from-builder').click();
 await page.waitForSelector('#plan-preview[open]');
 assert.equal(await page.locator('#builder').evaluate(el=>el.open),true);
 assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar).plans).length),0,'Preview must not save the plan');
 assert.match(await page.locator('#plan-preview-list').textContent(),/Bänkpress/);
 await page.screenshot({path:'test-results/ingemar-private/plan-preview-390.png'});
 await page.locator('#plan-preview .modal-actions [data-action="preview-back"]').click();
 assert.equal(await page.locator('#builder').evaluate(el=>el.open),true);
 await page.locator('#builder-start-from-builder').click();
 await page.locator('#preview-start').click();
 await page.waitForFunction(()=>{const frame=document.getElementById('family-session-frame');return frame.contentWindow?.sessionState!=null;});
 await page.screenshot({path:'test-results/ingemar-private/lazy-session-390.png'});
 await page.evaluate(()=>document.getElementById('family-session-frame').contentWindow.stopSessionMode(false));
 await page.waitForSelector('#family-session-frame',{state:'hidden'});
 // Use the real session bridge/save handler and verify that logged set weights become PRs.
 await page.evaluate(()=>{
  const frame=document.getElementById('family-session-frame');
  const workout={id:'test-real-session',date:'2026-10-11',type:'Push',name:'Push · Styrka',minutes:35,exercises:[{name:'Bänkpress',mode:'kg',sets:[{weight:45,reps:8,done:true},{weight:52.5,reps:6,done:true}]},{name:'Triceps kabeldrag',mode:'kg',sets:[{weight:22.5,reps:10,done:true}]}]};
  window.dispatchEvent(new MessageEvent('message',{origin:location.origin,source:frame.contentWindow,data:{type:'ingemar-family-session-saved',workout}}));
 });
 await page.waitForFunction(()=>JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar).prs?.['bänkpress']?.weight===52.5);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 assert.match(await page.locator('#personal-records').textContent(),/Max 52,5 kg/);
 assert.equal(await page.locator('a[href]').count(),0,'No links to other pages');
 await page.locator('#personal-records').scrollIntoViewIfNeeded();
 await page.screenshot({path:'test-results/ingemar-private/records-390.png'});
 await page.locator('[data-history="test-real-session"]').click();
 assert.match(await page.locator('#history-detail').textContent(),/PR 52.5 kg/);
 await page.screenshot({path:'test-results/ingemar-private/record-details-390.png'});
 // Training log supports full CRUD and automatically rebuilds PRs on edits.
 await page.locator('[data-action="edit-history"]').click();
 assert.equal(await page.locator('#history-editor').evaluate(el=>el.open),true);
 assert.equal(await page.locator('#log-edit-name').inputValue(),'Push · Styrka');
 await page.screenshot({path:'test-results/ingemar-private/log-edit-390.png'});
 await page.locator('[data-log-set="0:1:weight"]').fill('47.5');
 await page.locator('[data-action="log-save"]').click();
 await page.waitForFunction(()=>{
  const data=JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar);
  return data.prs?.['bänkpress']?.weight===47.5 && data.history.find(h=>h.id==='test-real-session')?.exercises[0].sets[1].weight===47.5;
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 assert.match(await page.locator('#personal-records').textContent(),/Max 47,5 kg/,'Edited weights must update PRs after reload');
 await page.locator('[data-action="new-history"]').click();
 assert.equal(await page.locator('#history-editor').evaluate(el=>el.open),true);
 await page.locator('#log-edit-name').fill('Nyregistrerat styrkepass');
 await page.locator('#log-edit-minutes').fill('25');
 await page.locator('[data-log-name="0"]').fill('Hantelpress');
 await page.locator('[data-log-set="0:0:weight"]').fill('24');
 await page.locator('[data-log-set="0:0:reps"]').fill('12');
 await page.screenshot({path:'test-results/ingemar-private/log-new-390.png'});
 await page.locator('[data-action="log-save"]').click();
 await page.waitForFunction(()=>{
  const data=JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar);
  return data.history.length===2 && data.prs?.['hantelpress']?.weight===24;
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 assert.match(await page.locator('#history').textContent(),/Nyregistrerat styrkepass/,'Manually logged workout survives reload');
 const newId=await page.evaluate(()=>{
  const data=JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar);
  return data.history.find(w=>w.name==='Nyregistrerat styrkepass').id;
 });
 await page.locator('[data-history="'+newId+'"]').click();
 await page.locator('[data-action="edit-history"]').click();
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('[data-action="log-delete"]').click();
 await page.waitForFunction(()=>{
  const data=JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar);
  return data.history.length===1 && !data.prs?.hantelpress && data.prs?.['bänkpress']?.weight===47.5;
 });
 assert.equal(await page.locator('[data-action="undo-delete"]').isVisible(),true,'Deleting a workout must offer Undo');
 await page.locator('[data-action="undo-delete"]').click();
 await page.waitForFunction(()=>{
  const data=JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar);
  return data.history.some(w=>w.name==='Nyregistrerat styrkepass')&&data.prs?.['hantelpress']?.weight===24;
 });
 await page.screenshot({path:'test-results/ingemar-private/undo-history-webkit.png'});
 await page.locator('[data-history="'+newId+'"]').click();
 await page.locator('[data-action="edit-history"]').click();
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('[data-action="log-delete"]').click();
 await page.waitForFunction(()=>JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar).history.length===1);
 await page.setViewportSize({width:320,height:740});
 await page.locator('[data-history="test-real-session"]').click();
 await page.locator('[data-action="edit-history"]').click();
 await page.screenshot({path:'test-results/ingemar-private/log-edit-320.png'});
 assert.equal(await page.locator('#history-editor').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Log editor may not overflow horizontally at 320px');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Document may not scroll horizontally when editing logs');
 await page.locator('#history-editor .modal-actions [data-action="cancel-history-edit"]').click();
 await page.setViewportSize({width:390,height:844});

 // Manual PRs remain editable without changing completed workout set data.
 await page.locator('[data-action="new-record"]').click();
 await page.locator('#pr-edit-name').fill('Marklyft');
 await page.locator('#pr-edit-weight').fill('120');
 await page.locator('#pr-edit-date').fill('2026-10-01');
 await page.screenshot({path:'test-results/ingemar-private/pr-editor-390.png'});
 await page.locator('[data-action="save-record"]').click();
 await page.waitForFunction(()=>{
  const data=JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar);
  return data.manualPrs?.['marklyft']?.weight===120 && data.prs?.['marklyft']?.weight===120;
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 assert.match(await page.locator('#personal-records').textContent(),/Marklyft/);
 await page.locator('[data-pr-filter="Pull"]').click();
 await page.locator('[data-pr-edit="Marklyft"]').click();
 assert.equal(await page.locator('#pr-edit-remove').isVisible(),true);
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('[data-action="remove-record"]').click();
 await page.waitForFunction(()=>{
  const data=JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar);
  return !data.manualPrs?.marklyft && !data.prs?.marklyft;
 });
 // Weekly target must be configurable and survive reload too.
 await page.locator('[data-goal-adjust="1"]').click();
 await page.waitForFunction(()=>{
  const data=JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar);
  return data.goal===5;
 });
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 assert.equal(await page.locator('#stat-week-goal').textContent(),'5');
 // iPhone: the date field must stay inside its dialog and never summon a keyboard on open.
 await page.locator('[data-action="new-record"]').click();
 assert.equal(await page.locator('#pr-editor').evaluate(()=>!document.activeElement.matches('input,textarea,select,[contenteditable=true]')),true,'PR editor must not autofocus any editable input');
 assert.equal(await page.locator('#pr-editor .compact-date-control').evaluate(el=>{
   const r=el.getBoundingClientRect(),dlg=el.closest('dialog').getBoundingClientRect();
   return r.left>=dlg.left&&r.right<=dlg.right+1&&el.scrollWidth<=el.clientWidth+1;
 }),true,'iPhone record date must stay within the dialog');
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('dialog input:not([type=checkbox]),dialog select,dialog textarea')].every(el=>parseFloat(getComputedStyle(el).fontSize)>=16)),true,'iOS inputs need 16px text to prevent focus zoom');
 await page.screenshot({path:'test-results/ingemar-private/record-date-iphone-390.png'});
 await page.locator('#pr-editor .modal-head [data-action="cancel-record"]').click();
 await page.locator('[data-choice="Pull"]').click();
 assert.equal(await page.locator('#builder').evaluate(()=>!document.activeElement.matches('input,textarea,select,[contenteditable=true]')),true,'Builder must not autofocus any editable input');
 await page.screenshot({path:'test-results/ingemar-private/builder-iphone-390.png'});
 await page.setViewportSize({width:320,height:740});
 const template320=await page.locator('#builder .builder-template-tools').evaluate(el=>{
   const parent=el.getBoundingClientRect();
   return el.scrollWidth<=el.clientWidth+1&&[...el.querySelectorAll('button')].every(b=>{
    const r=b.getBoundingClientRect();return r.left>=parent.left-1&&r.right<=parent.right+1;
   });
 });
 assert.equal(template320,true,'All builder template buttons must fit 320px');
 await page.screenshot({path:'test-results/ingemar-private/builder-iphone-320.png'});
 await page.locator('#builder .modal-head [data-action="close-builder"]').click();
 await page.setViewportSize({width:390,height:844});
 await page.setViewportSize({width:320,height:740});
 await page.locator('#personal-records').scrollIntoViewIfNeeded();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
 await page.screenshot({path:'test-results/ingemar-private/records-320.png'});
 await page.setViewportSize({width:1280,height:900});
 await page.locator('#personal-records').scrollIntoViewIfNeeded();
 await page.screenshot({path:'test-results/ingemar-private/records-desktop.png'});
 assert.deepEqual(errors,[],errors.join(' | '));
 await page.setViewportSize({width:390,height:844});
 await page.locator('#ingemar-logout').click();
 await page.waitForSelector('html[data-ingemar-auth="locked"]');
 await page.evaluate(()=>localStorage.setItem('__deny_ingemar','1'));
 await page.locator('#ingemar-login-email').fill('ingemar-fixture@test.invalid');
 await page.locator('#ingemar-login-password').fill('testing-12345');
 await page.locator('#ingemar-login-submit').click();
 await page.waitForFunction(()=>document.getElementById('ingemar-account-message').textContent.includes('Firebase nekar åtkomst'));
 assert.equal(await page.locator('#ingemar-account-message').getAttribute('data-error'),'true');
 assert.equal(await page.locator('#ingemar-retry').isVisible(),true);
 assert.equal(await page.locator('main').isVisible(),false);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
 await page.screenshot({path:'test-results/ingemar-private/permission-denied-390.png',fullPage:true});
 await page.evaluate(()=>localStorage.removeItem('__deny_ingemar'));
 await page.locator('#ingemar-retry').click();
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 assert.match(await page.locator('#personal-records').textContent(),/Max 47,5 kg/);
 assert.deepEqual(errors,[],errors.join(' | '));
 // Reopen with persisted storage and no warm JS/Auth memory.
 const reopened=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,storageState:await context.storageState()});
 await reopened.addInitScript(installFirebase);
 let releaseReopened;const reopenedGate=new Promise(resolve=>{releaseReopened=resolve;});
 await reopened.route('https://www.gstatic.com/firebasejs/**',async route=>{await reopenedGate;await route.fulfill({status:200,contentType:'application/javascript',body:'// isolated Firebase stub'});});
 await reopened.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
 const reopenedPage=await reopened.newPage();
 await reopenedPage.goto('http://127.0.0.1:4173/budget/ingemar.html',{waitUntil:'commit'});
 await reopenedPage.waitForSelector('html[data-ingemar-auth="ready"]',{timeout:2000});
 assert.match(await reopenedPage.locator('#personal-records').textContent(),/Max 47,5 kg/);
 assert.equal(await reopenedPage.evaluate(()=>IngemarAccount.canEdit),false);
 assert.equal(await reopenedPage.locator('main').evaluate(el=>el.inert),true);
 await screenshotDuringBoot(reopenedPage,'test-results/ingemar-private/reopened-before-firebase-390.png');
 releaseReopened();
 await reopenedPage.waitForFunction(()=>IngemarAccount.canEdit);
 await reopenedPage.locator('#ingemar-logout').click();
 await reopenedPage.waitForSelector('html[data-ingemar-auth="locked"]');
 assert.equal(await reopenedPage.evaluate(()=>localStorage.getItem('ex_ingemar_verified_uid')),null);
 await reopenedPage.reload({waitUntil:'domcontentloaded'});
 assert.equal(await reopenedPage.locator('main').isVisible(),false,'Signed-out browser must not restore the profile');
 await reopened.close();
 // Android phone: touch scrolling must not close the exercise picker or edit mode.
 const android=await chromium.launch();
 const androidContext=await android.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.75,isMobile:true,hasTouch:true});
 await androidContext.addInitScript(()=>{
   // Firebase test double: never connects to a real account or database.
   const DBKEY='__ingemar_test_db',AUTHKEY='__ingemar_test_account';
   const observers=new Map();
   const getDb=()=>JSON.parse(localStorage.getItem(DBKEY)||'{}');
   let authListener=null;
   const emailToUid=email=>'fixture-'+email.toLowerCase().replace(/[^a-z0-9]/g,'-');
   function user(){const email=localStorage.getItem(AUTHKEY);return email?{uid:emailToUid(email),email}:null;}
   const auth={
     currentUser:user(),
     setPersistence:async()=>{await new Promise(resolve=>setTimeout(resolve,350));},
     onAuthStateChanged(fn){authListener=fn;queueMicrotask(()=>fn(user()));return()=>{};},
     signInWithEmailAndPassword:async(email,password)=>{
       if(password.length<6)throw {code:'auth/invalid-credential'};
       localStorage.setItem(AUTHKEY,email);auth.currentUser=user();authListener?.(user());return {user:user()};
     },
     createUserWithEmailAndPassword:async(email,password)=>{
       if(password.length<6)throw {code:'auth/weak-password'};
       localStorage.setItem(AUTHKEY,email);auth.currentUser=user();authListener?.(user());return {user:user()};
     },
     signOut:async()=>{localStorage.removeItem(AUTHKEY);auth.currentUser=null;authListener?.(null);}
   };
   function ref(path){return {
     on(type,cb,fail){if(localStorage.getItem('__deny_ingemar')){fail({code:'PERMISSION_DENIED'});return;}observers.set(path,cb);const deliver=()=>cb({val:()=>getDb()[path]||null});if(localStorage.getItem('__delay_ingemar'))window.__deliverIngemar=deliver;else queueMicrotask(deliver);},
     off(){observers.delete(path);},
     async get(){if(localStorage.getItem('__deny_ingemar'))throw {code:'PERMISSION_DENIED'};return {val:()=>getDb()[path]||null};},
     async transaction(update){const db=getDb(),value=update(db[path]||null);db[path]=value;localStorage.setItem(DBKEY,JSON.stringify(db));const cb=observers.get(path);if(cb)cb({val:()=>value});return {committed:true,snapshot:{val:()=>value}};},
     async set(value){const db=getDb();db[path]=value;localStorage.setItem(DBKEY,JSON.stringify(db));
       const cb=observers.get(path);if(cb)cb({val:()=>db[path]});},
   };}
   const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'LOCAL'}};
   const dbFn=()=>({ref});dbFn.ServerValue={TIMESTAMP:1234};
   const apps=[];
   window.firebase={apps,initializeApp(config,name){const app={name:name||'[DEFAULT]'};apps.push(app);return app;},auth:authFn,database:dbFn};
 });
 await androidContext.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'// Firebase test mock'}));
 await androidContext.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
 await androidContext.route('https://fonts.gstatic.com/**',r=>r.abort());
 const androidPage=await androidContext.newPage(),androidErrors=[];
 androidPage.on('pageerror',e=>androidErrors.push(e.message));
 await androidPage.goto('http://127.0.0.1:4173/budget/ingemar.html',{waitUntil:'domcontentloaded'});
 await androidPage.locator('#ingemar-login-email').fill('android-fixture@test.invalid');
 await androidPage.locator('#ingemar-login-password').fill('testing-12345');
 await androidPage.locator('#ingemar-login-submit').click();
 await androidPage.waitForSelector('html[data-ingemar-auth="ready"]');
 await androidPage.locator('[data-choice="Pull"]').click();
 assert.equal(await androidPage.locator('#builder').evaluate(el=>el.open),true);
 assert.equal(await androidPage.locator('#builder').evaluate(()=>!document.activeElement.matches('input,textarea,select,[contenteditable=true]')),true,'Opening builder must not focus editable inputs');
 await androidPage.screenshot({path:'test-results/ingemar-private/builder-android-412.png'});
 const layout=await androidPage.locator('#builder .builder-template-tools').evaluate(el=>{
  const p=el.getBoundingClientRect(),buttons=[...el.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,h:r.height,inside:r.left>=p.left-1&&r.right<=p.right+1};});
  return {buttons,allFit:el.scrollWidth<=el.clientWidth+1};
 });
 assert.equal(layout.buttons.length,3);
 assert.equal(layout.buttons.every(b=>b.inside&&b.h>=44),true,'Android template actions must fit the row');
 assert.equal(new Set(layout.buttons.map(b=>b.y)).size,1,'Android 412px template buttons should align');
 assert.equal(layout.allFit,true);
 await androidPage.locator('[data-exercise-name-input="0"]').click();
 assert.equal(await androidPage.locator('[data-exercise-menu="0"]').isVisible(),true);
 await androidPage.locator('[data-exercise-name-input="0"]').click();
 assert.equal(await androidPage.locator('[data-exercise-name-input="0"]').evaluate(el=>!el.readOnly&&document.activeElement===el),true,'Second tap must enable typing and focus the exercise name');
 await androidPage.locator('[data-exercise-name-input="0"]').fill('Redigerat namn');
 await androidPage.locator('[data-exercise-picker="0"]').click();
 await androidPage.locator('#builder').evaluate(el=>{el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}));el.scrollTop+=200;});
 assert.equal(await androidPage.locator('[data-exercise-menu="0"]').isVisible(),true,'Scroll start must preserve exercise chooser');
 await androidPage.locator('[data-exercise-new="0"]').click();
 assert.equal(await androidPage.locator('[data-exercise-name-input="0"]').getAttribute('data-exercise-name-free'),'1');
 assert.equal(await androidPage.locator('[data-exercise-name-input="0"]').evaluate(el=>document.activeElement===el),true,'New exercise must focus the input as explicitly requested');
 await androidPage.locator('[data-exercise-name-input="0"]').fill('Testövning Android');
 await androidPage.locator('#builder').evaluate(el=>{el.scrollTop+=350;el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}));});
 assert.equal(await androidPage.locator('[data-exercise-name-input="0"]').getAttribute('data-exercise-name-free'),'1','Exercise editing mode must persist after scrolling');
 assert.equal(await androidPage.locator('[data-exercise-name-input="0"]').inputValue(),'Testövning Android');
 assert.equal(await androidPage.evaluate(()=>[...document.querySelectorAll('dialog input:not([type=checkbox]),dialog select,dialog textarea')].every(el=>parseFloat(getComputedStyle(el).fontSize)>=16)),true,'Android form fonts must be at least 16px');
 await androidPage.locator('#builder .modal-head [data-action="close-builder"]').click();
 await androidPage.locator('[data-action="new-record"]').click();
 const dateOK=await androidPage.locator('#pr-editor .compact-date-control').evaluate(el=>{
   const r=el.getBoundingClientRect(),dlg=el.closest('dialog').getBoundingClientRect();
   return r.left>=dlg.left&&r.right<=dlg.right+1&&el.scrollWidth<=el.clientWidth+1;
 });
 assert.equal(dateOK,true,'Android date field must stay in dialog');
 assert.equal(await androidPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
 await androidPage.screenshot({path:'test-results/ingemar-private/record-android-412.png'});
 await androidPage.locator('#pr-editor .modal-head [data-action="cancel-record"]').click();
 await androidPage.setViewportSize({width:432,height:915});
 await androidPage.locator('[data-choice="Pull"]').click();
 await androidPage.screenshot({path:'test-results/ingemar-private/builder-android-432.png'});
 assert.equal(await androidPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
 assert.deepEqual(androidErrors,[],androidErrors.join(' | '));
 // Focused records, preview and touch drag coverage on the existing Android page.
 await androidPage.locator('#builder .modal-head [data-action="close-builder"]').click();
 await androidPage.evaluate(()=>{
  const make=(id,date,type,name,mode,values)=>({id,date,type,name:type,minutes:30,exercises:[{name,mode,sets:values.map(v=>({weight:mode==='kg'?v:0,minutes:mode==='min'?v:0,reps:8,done:true}))}]});
  const data={plans:{},zenHistory:[],manualPrs:{},history:[make('p1','2026-10-01','Push','Bänkpress','kg',[40,50]),make('p2','2026-10-02','Push','Bänkpress','kg',[40,55]),make('pull','2026-10-02','Pull','Sittande rodd med smalt kabelhandtag','kg',[30,45]),make('run','2026-10-02','Kondition','Löpning','min',[10,15])]};
  const raw=JSON.stringify(data);localStorage.setItem('__ingemar_test_db',JSON.stringify({ex_ingemar:raw}));localStorage.setItem('ex_ingemar',raw);localStorage.setItem('ex_ingemar_pending','0');localStorage.removeItem('ex_ingemar_journal');
 });
 await androidPage.reload({waitUntil:'domcontentloaded'});await androidPage.waitForFunction(()=>IngemarAccount.canEdit);
 await androidPage.locator('#personal-records').scrollIntoViewIfNeeded();
 assert.match(await androidPage.locator('[data-pr-panel="Push"] .pr-gain').textContent(),/\+5 kg/);
 assert.match(await androidPage.locator('[data-pr-panel="Push"] .pr-row').evaluate(el=>getComputedStyle(el).backgroundImage),/linear-gradient/,'Record rows must use the dark theme, not the native button fill');
 await androidPage.screenshot({path:'test-results/ingemar-private/compact-records-push-android.png'});
 await androidPage.locator('[data-pr-filter="Pull"]').click();
 assert.match(await androidPage.locator('[data-pr-panel="Pull"]').textContent(),/Sittande rodd/);
 await androidPage.locator('[data-pr-filter="Kondition"]').click();
 assert.match(await androidPage.locator('[data-pr-panel="Kondition"]').textContent(),/25 min/);
 await androidPage.screenshot({path:'test-results/ingemar-private/compact-records-cardio-android.png'});
 await androidPage.locator('[data-pr-panel="Kondition"] .pr-row').click();
 assert.match(await androidPage.locator('#history-detail-title').textContent(),/Kondition/);
 await androidPage.locator('#history-detail .modal-head [data-action="close-history"]').click();
 await androidPage.locator('[data-pr-filter="Push"]').click();await androidPage.locator('[data-pr-edit="Bänkpress"]').click();
 await androidPage.locator('#pr-edit-weight').fill('60');await androidPage.locator('[data-action="save-record"]').click();
 await androidPage.waitForFunction(()=>JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar).manualPrs?.['bänkpress']?.weight===60);
 await androidPage.reload({waitUntil:'domcontentloaded'});await androidPage.waitForFunction(()=>IngemarAccount.canEdit);
 assert.match(await androidPage.locator('[data-pr-panel="Push"] .pr-gain').textContent(),/\+5 kg/);
 await androidPage.locator('[data-choice="Push"]').click();
 // A catalog option comes from history. Hiding it must not erase or rename historical workouts.
 await androidPage.locator('[data-exercise-name-input="0"]').click();
 const savedOption=androidPage.locator('[data-exercise-remove-option="0"][data-exercise-name="Bänkpress"]');
 assert.equal(await savedOption.isVisible(),true,'A saved exercise should have a dedicated remove cross');
 await androidPage.screenshot({path:'test-results/ingemar-private/compact-picker-android.png'});
 const optionSize=await savedOption.boundingBox();
 assert.ok(optionSize.width>=32&&optionSize.height>=32,'Remove cross must have an adequate touch target');
 androidPage.once('dialog',dialog=>dialog.dismiss());
 await savedOption.click();
 assert.equal(await savedOption.count(),1,'Cancelling confirmation must leave option present');
 androidPage.once('dialog',dialog=>dialog.accept());
 await savedOption.click();
 assert.equal(await savedOption.count(),0,'Confirming removal must immediately hide dropdown option');
 assert.equal(await androidPage.locator('[data-exercise-name-input="0"]').inputValue(),'Bänkpress','Existing draft name must be unchanged');
 const afterHide=await androidPage.evaluate(()=>JSON.parse(localStorage.getItem('ex_ingemar')));
 assert.equal(afterHide.history.some(item=>item.exercises.some(ex=>ex.name==='Bänkpress')),true,'Historical exercise names must be preserved');
 assert.equal(Object.values(afterHide.hiddenExerciseOptions||{}).some(Boolean),true,'Removed options must be persisted in profile state');
 await androidPage.screenshot({path:'test-results/ingemar-private/compact-picker-removed-android.png'});
 assert.equal(await androidPage.locator('#builder [data-action="undo-delete"]').isVisible(),true,'Picker removal can be undone');
 await androidPage.locator('#builder [data-action="undo-delete"]').click();
 assert.equal(await androidPage.locator('[data-exercise-remove-option="0"][data-exercise-name="Bänkpress"]').count(),1,'Undo restores dropdown option');
 androidPage.once('dialog',dialog=>dialog.accept());
 await androidPage.locator('[data-exercise-remove-option="0"][data-exercise-name="Bänkpress"]').click();
 await androidPage.locator('#builder .modal-head [data-action="close-builder"]').click();
 await androidPage.reload();await androidPage.waitForFunction(()=>IngemarAccount.canEdit);
 await androidPage.locator('[data-choice="Push"]').click();
 await androidPage.locator('[data-exercise-name-input="0"]').click();
 assert.equal(await androidPage.locator('[data-exercise-option="0"][data-exercise-name="Bänkpress"]').count(),0,'Hidden option must stay hidden after reload');
 assert.equal(await androidPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 await androidPage.locator('[data-exercise-picker="0"]').click();
 await verifyTouchDrag(androidPage,'android');
 await androidPage.locator('#builder-save-plan').click();await androidPage.waitForSelector('#plan-preview[open]');
 await androidPage.screenshot({path:'test-results/ingemar-private/plan-preview-android.png'});
 await androidPage.locator('#preview-save').click();
 await androidPage.waitForFunction(()=>Object.keys(JSON.parse(JSON.parse(localStorage.getItem('__ingemar_test_db')).ex_ingemar).plans).length===1);
 assert.equal(await androidPage.locator('#builder').evaluate(el=>el.open),false);
 // Verify the same compact rows and drag preview in iPhone WebKit at narrow widths.
 const recordState=await androidContext.storageState();
 const recordContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,storageState:recordState});
 await recordContext.addInitScript(installFirebase);
 await recordContext.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'// stub'}));
 await recordContext.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
 const recordPage=await recordContext.newPage();await recordPage.goto('http://127.0.0.1:4173/budget/ingemar.html');await recordPage.waitForFunction(()=>IngemarAccount.canEdit);
 for(const width of [390,320,1280]){
  await recordPage.setViewportSize({width,height:width===1280?900:844});
  await recordPage.locator('#personal-records').scrollIntoViewIfNeeded();
  await recordPage.locator('[data-pr-filter="Pull"]').click();
  assert.equal(await recordPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.equal(await recordPage.locator('[data-pr-panel="Pull"] .pr-row').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await recordPage.screenshot({path:'test-results/ingemar-private/compact-records-'+width+'.png'});
 }
 await recordPage.setViewportSize({width:390,height:844});await recordPage.locator('[data-choice="Push"]').click();
 await verifyTouchDrag(recordPage,'iphone');
 await recordPage.locator('#builder-save-plan').click();await recordPage.waitForSelector('#plan-preview[open]');
 await recordPage.setViewportSize({width:320,height:740});
 assert.equal(await recordPage.locator('#plan-preview').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
 await recordPage.screenshot({path:'test-results/ingemar-private/plan-preview-320.png'});
 await recordPage.locator('#plan-preview .modal-head [data-action="preview-back"]').click();
 assert.equal(await recordPage.locator('#builder').evaluate(el=>el.open),true);
 // Drafts, sequential templates and week edits must survive closing and reload.
 await recordPage.setViewportSize({width:390,height:844});
 await recordPage.locator('#build-name').fill('Ben – sparat utkast');
 await recordPage.locator('#builder .modal-head [data-action="close-builder"]').click();
 await recordPage.reload();await recordPage.waitForFunction(()=>IngemarAccount.canEdit);
 await recordPage.getByRole('button',{name:'Redigera vald dag',exact:true}).click();
 assert.equal(await recordPage.locator('#build-name').inputValue(),'Ben – sparat utkast');
 for(const name of ['Ben A','Ben B','Rygg C']){
  recordPage.once('dialog',dialog=>dialog.accept(name));
  await recordPage.locator('[data-action="save-template"]').click();
 }
 await recordPage.locator('#builder .modal-head [data-action="close-builder"]').click();
 await recordPage.locator('[data-action="plan-week"]').click();
 for(const i of [0,1,2,3,4]){
  await recordPage.locator('[data-week-toggle-day="'+i+'"]').click();
  await recordPage.locator('[data-week-type="'+i+':Push"]').click();
 }
 await recordPage.locator('.week-day-open[data-week-edit="0"]').click();
 await recordPage.locator('#build-name').fill('Ben måndag');
 await recordPage.locator('#builder-save-plan').click();await recordPage.locator('#preview-save').click();
 await recordPage.waitForSelector('#week-planner[open]');
 await recordPage.locator('#week-planner .modal-head [data-action="close-week-planner"]').click();
 await recordPage.reload();await recordPage.waitForFunction(()=>IngemarAccount.canEdit);
 const durable=await recordPage.evaluate(()=>JSON.parse(localStorage.getItem('ex_ingemar')));
 assert.ok(durable.templates.some(x=>x.name==='Ben A'));assert.ok(durable.templates.some(x=>x.name==='Ben B'));assert.ok(durable.templates.some(x=>x.name==='Rygg C'));
 assert.ok(Object.values(durable.plans).some(x=>x.name==='Ben måndag'));
 assert.ok(Object.keys(durable.plans).length>=5);
 await recordPage.locator('[data-action="plan-week"]').click();
 assert.equal(await recordPage.locator('#week-planner').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
 await recordPage.screenshot({path:'test-results/ingemar-private/durable-week-iphone.png'});
 // Full week-planner drag: the preview must be above the dialog and a cancelled
 // drag must never shuffle the stored week.
 await recordPage.evaluate(()=>document.querySelector('[data-week-type="1:Pull"]').click());
 const weekLabels=()=>recordPage.locator('#week-planner-days .week-day-pass strong').evaluateAll(nodes=>nodes.map(n=>n.textContent));
 const beforeWeek=await weekLabels();
 assert.notEqual(beforeWeek[0],beforeWeek[1],'Week drag fixture needs distinct labels');
 const dragDay=async(pointerId,endType)=>{
   const from=await recordPage.locator('[data-week-drag="0"]').boundingBox();
   const to=await recordPage.locator('#week-planner-days [data-week-day="1"]').boundingBox();
   const p={pointerId,pointerType:'touch',isPrimary:true,button:0,buttons:1,clientX:from.x+from.width/2,clientY:from.y+from.height/2};
   await recordPage.locator('[data-week-drag="0"]').dispatchEvent('pointerdown',p);
   assert.equal(await recordPage.locator('#week-planner > .week-planner-drag-ghost').count(),1,'Planner drag preview must render in top layer');
   assert.equal(await recordPage.locator('html.ingemar-builder-drag-active').count(),1);
   await recordPage.evaluate(q=>document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,cancelable:true,pointerId:q.pointerId,pointerType:'touch',clientX:q.x,clientY:q.y})),{pointerId,x:to.x+to.width/2,y:to.y+to.height/2});
   await recordPage.evaluate(q=>document.dispatchEvent(new PointerEvent(q.type,{bubbles:true,cancelable:true,pointerId:q.pointerId,pointerType:'touch'})),{type:endType,pointerId});
   assert.equal(await recordPage.locator('#week-planner > .week-planner-drag-ghost').count(),0);
   assert.equal(await recordPage.locator('html.ingemar-builder-drag-active').count(),0);
 };
 await dragDay(94,'pointercancel');
 assert.deepEqual(await weekLabels(),beforeWeek,'Cancelled week drag must preserve original day order');
 await dragDay(95,'pointerup');
 const swapped=await weekLabels();
 assert.equal(swapped[0],beforeWeek[1],'Dropped week drag must reorder first day');
 assert.equal(swapped[1],beforeWeek[0],'Dropped week drag must reorder second day');
 await recordPage.screenshot({path:'test-results/ingemar-private/week-reordered-iphone.png'});
 await recordPage.locator('#week-planner .modal-head [data-action="close-week-planner"]').click();
 await recordPage.reload();await recordPage.waitForFunction(()=>IngemarAccount.canEdit);
 await recordPage.locator('[data-action="plan-week"]').click();
 assert.deepEqual((await weekLabels()).slice(0,2),swapped.slice(0,2),'Reordered days must survive reload');
 await recordPage.locator('#week-planner .modal-head [data-action="close-week-planner"]').click();
 // Week navigation and category selection may never erase the chosen pass name.
 const displayWeek=await recordPage.locator('#training-week-label').textContent();
 await recordPage.locator('[data-training-week-shift="1"]').click();
 assert.notEqual(await recordPage.locator('#training-week-label').textContent(),displayWeek);
 await recordPage.locator('[data-training-week-today]').click();
 assert.equal(await recordPage.locator('#training-week-label').textContent(),displayWeek);
 await recordPage.locator('[data-choice="Pull"]').click();
 await recordPage.locator('#build-name').fill('Eget passnamn');
 await recordPage.locator('#builder .modal-head [data-action="close-builder"]').click();
 await recordPage.locator('[data-choice="Push"]').click();
 assert.equal(await recordPage.locator('[data-type="Push"]').getAttribute('aria-pressed'),'true','Explicit choice must override prior Pull category');
 assert.equal(await recordPage.locator('#build-name').inputValue(),'Eget passnamn','Category change must retain custom pass name');
 await recordPage.locator('#builder .modal-head [data-action="close-builder"]').click();
 await recordPage.locator('#week').screenshot({path:'test-results/ingemar-private/calendar-named-days-iphone.png'});
 // Selected-week statistics must follow the visible calendar week.
 const weekStats=()=>recordPage.evaluate(()=>{
  const monday=document.querySelector('#week [data-day]').dataset.day;
  const until=new Date(monday+'T12:00:00Z');until.setUTCDate(until.getUTCDate()+7);
  const end=until.toISOString().slice(0,10);
  const data=JSON.parse(localStorage.getItem('ex_ingemar')||'{}');
  return {expected:(data.history||[]).filter(h=>h.date>=monday&&h.date<end).length,
   shown:Number(document.getElementById('stat-week').textContent),
   label:document.getElementById('training-week-label').textContent,
   title:document.getElementById('stat-week-label').textContent};
 });
 let measured=await weekStats();assert.equal(measured.shown,measured.expected);assert.ok(measured.label.includes(measured.title.split(' ').at(-1)));
 await recordPage.locator('[data-training-week-shift="-1"]').click();
 measured=await weekStats();assert.equal(measured.shown,measured.expected);assert.ok(measured.label.includes(measured.title.split(' ').at(-1)));
 await recordPage.locator('[data-training-week-today]').click();
 // The undo control must be accessible while the pass builder is modal.
 await recordPage.locator('[data-choice="Pull"]').click();
 const exerciseCount=await recordPage.locator('#exercise-list > .exercise-card').count();
 assert.ok(exerciseCount>1,'Fixture must have multiple exercises');
 await recordPage.locator('[data-remove-exercise="1"]').click();
 assert.equal(await recordPage.locator('#exercise-list > .exercise-card').count(),exerciseCount-1);
 assert.equal(await recordPage.locator('#builder [data-action="undo-delete"]').isVisible(),true);
 await recordPage.screenshot({path:'test-results/ingemar-private/undo-exercise-iphone.png'});
 await recordPage.locator('#builder [data-action="undo-delete"]').click();
 assert.equal(await recordPage.locator('#exercise-list > .exercise-card').count(),exerciseCount);
 await recordPage.locator('#builder .modal-head [data-action="close-builder"]').click();
 await recordPage.locator('[data-action="plan-week"]').click();
 await recordPage.locator('[data-week-toggle-day="0"]').click();
 await recordPage.locator('[data-week-clear="0"]').click();
 assert.equal(await recordPage.locator('#week-planner [data-action="undo-delete"]').isVisible(),true);
 await recordPage.screenshot({path:'test-results/ingemar-private/undo-week-iphone.png'});
 await recordPage.locator('#week-planner [data-action="undo-delete"]').click();
 assert.notEqual(await recordPage.locator('#week-planner [data-week-day="0"] .week-day-pass strong').textContent(),'Ingen träning');
 await recordPage.locator('#week-planner .modal-head [data-action="close-week-planner"]').click();
 assert.equal(await recordPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 // Status must distinguish confirmed remote saving from local-only and pending.
 await recordPage.waitForFunction(()=>document.getElementById('ingemar-sync-status').dataset.syncState==='synced');
 assert.match(await recordPage.locator('#ingemar-sync-status').textContent(),/Firebase/);
 // Both Zen pages need the same durable create / edit / plan / log / delete behavior.
 await recordPage.locator('[data-view="stretch"]').click();
 await recordPage.locator('[data-zen-action="create"]').click();
 await recordPage.locator('#zen-edit-name').fill('QA Stretch');
 await recordPage.locator('[data-zen-step-field="name"]').first().fill('Rörlighet QA');
 await recordPage.locator('[data-zen-action="save-editor"]').click();
 assert.match(await recordPage.locator('#zen-choices').textContent(),/QA Stretch/);
 const routineId=await recordPage.evaluate(()=>JSON.parse(localStorage.getItem('ex_ingemar')).zenRoutines.stretch.find(r=>r.name==='QA Stretch').id);
 await recordPage.locator('[data-zen-edit="'+routineId+'"]').click();
 await recordPage.locator('#zen-edit-name').fill('QA Stretch redigerat');
 await recordPage.locator('[data-zen-action="save-editor"]').click();
 await recordPage.locator('[data-zen-plan-routine="'+routineId+'"]').click();
 assert.equal(await recordPage.locator('#zen-day-dialog').evaluate(el=>el.open),true);
 await recordPage.locator('[data-zen-action="save-day"]').click();
 await recordPage.locator('[data-zen-action="log"]').click();
 await recordPage.locator('#zen-edit-name').fill('QA stretchlogg');
 await recordPage.locator('#zen-edit-minutes').fill('11');
 await recordPage.locator('[data-zen-step-field="name"]').first().fill('Rörlighet loggad');
 await recordPage.locator('[data-zen-action="save-editor"]').click();
 await recordPage.reload();await recordPage.waitForFunction(()=>IngemarAccount.canEdit);
 await recordPage.locator('[data-view="stretch"]').click();
 assert.match(await recordPage.locator('#zen-history').textContent(),/QA stretchlogg/);
 await recordPage.locator('[data-zen-history]').filter({hasText:'QA stretchlogg'}).click();
 await recordPage.locator('#zen-edit-notes').fill('Redigerad efter omladdning');
 await recordPage.locator('[data-zen-action="save-editor"]').click();
 const savedZen=await recordPage.evaluate(()=>JSON.parse(localStorage.getItem('ex_ingemar')));
 assert.equal(savedZen.zenHistory.find(x=>x.name==='QA stretchlogg').notes,'Redigerad efter omladdning');
 await recordPage.locator('[data-view="meditation"]').click();
 await recordPage.locator('[data-zen-action="create"]').click();
 await recordPage.locator('#zen-edit-name').fill('QA Meditation');
 await recordPage.locator('[data-zen-step-field="name"]').first().fill('Andning QA');
 await recordPage.locator('[data-zen-action="save-editor"]').click();
 assert.match(await recordPage.locator('#zen-choices').textContent(),/QA Meditation/);
 const meditationId=await recordPage.evaluate(()=>JSON.parse(localStorage.getItem('ex_ingemar')).zenRoutines.meditation.find(r=>r.name==='QA Meditation').id);
 await recordPage.locator('[data-zen-edit="'+meditationId+'"]').click();
 recordPage.once('dialog',dialog=>dialog.accept());
 await recordPage.locator('[data-zen-action="delete-entry"]').click();
 assert.equal(await recordPage.locator('[data-action="undo-delete"]').isVisible(),true);
 await recordPage.locator('[data-action="undo-delete"]').click();
 assert.match(await recordPage.locator('#zen-choices').textContent(),/QA Meditation/);
 await recordPage.screenshot({path:'test-results/ingemar-private/zen-builder-review-iphone.png'});
 await recordContext.close();
 await android.close();
 await browser.close();console.log('Ingemar sync, records and iPhone/Android dialogs passed');
})().catch(err=>{console.error(err);process.exit(1);});
