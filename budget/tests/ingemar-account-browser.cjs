'use strict';
const {webkit,chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await webkit.launch();
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{
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
     async set(value){const db=getDb();db[path]=value;localStorage.setItem(DBKEY,JSON.stringify(db));
       const cb=observers.get(path);if(cb)cb({val:()=>db[path]});},
   };}
   const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'LOCAL'}};
   const dbFn=()=>({ref});dbFn.ServerValue={TIMESTAMP:1234};
   const apps=[];
   window.firebase={apps,initializeApp(config,name){const app={name:name||'[DEFAULT]'};apps.push(app);return app;},auth:authFn,database:dbFn};
 });
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
 await page.reload({waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#ingemar-account-loading').isVisible(),true,'Signed-in reload must show loader');
 assert.equal(await page.locator('#ingemar-account-gate .account-card').isVisible(),false,'Signed-in reload must never show the login panel');
 await page.screenshot({path:'test-results/ingemar-private/reload-loader-390.png'});
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 assert.equal(await page.evaluate(()=>IngemarAccount.canEdit),false,'Cache may be visible while the first remote snapshot is pending');
 assert.equal(await page.locator('main').evaluate(el=>el.inert),true);
 assert.match(await page.locator('#ingemar-sync-status').textContent(),/Visar sparad data/);
 assert.equal(await page.locator('#family-session-frame').getAttribute('src'),null,'Session assets must not load on refresh');
 await page.screenshot({path:'test-results/ingemar-private/cached-startup-390.png'});
 await page.evaluate(()=>{localStorage.removeItem('__delay_ingemar');window.__deliverIngemar();});
 await page.waitForFunction(()=>IngemarAccount.canEdit);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ex_ingemar')).goal),7,'Newer remote data must replace old cache');
 assert.equal(await page.locator('main').evaluate(el=>el.inert),false);
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
 await androidPage.locator('#builder').evaluate(el=>{el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}));el.scrollTop+=200;});
 assert.equal(await androidPage.locator('[data-exercise-menu="0"]').isVisible(),true,'Scroll start must preserve exercise chooser');
 await androidPage.locator('[data-exercise-new="0"]').click();
 assert.equal(await androidPage.locator('[data-exercise-name-input="0"]').getAttribute('data-exercise-name-free'),'1');
 assert.equal(await androidPage.locator('[data-exercise-name-input="0"]').evaluate(el=>document.activeElement!==el),true,'New exercise must not summon keyboard automatically');
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
 await android.close();
 await browser.close();console.log('Ingemar sync, records and iPhone/Android dialogs passed');
})().catch(err=>{console.error(err);process.exit(1);});
