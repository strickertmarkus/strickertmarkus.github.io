'use strict';
const {webkit}=require('playwright');
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
     on(type,cb,fail){if(localStorage.getItem('__deny_ingemar')){fail({code:'PERMISSION_DENIED'});return;}observers.set(path,cb);queueMicrotask(()=>cb({val:()=>getDb()[path]||null}));},
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
 await page.reload({waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#ingemar-account-loading').isVisible(),true,'Signed-in reload must show loader');
 assert.equal(await page.locator('#ingemar-account-gate .account-card').isVisible(),false,'Signed-in reload must never show the login panel');
 await page.screenshot({path:'test-results/ingemar-private/reload-loader-390.png'});
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
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
 await page.locator('[data-action="cancel-history-edit"]').click();
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
 await browser.close();console.log('Shared Ingemar profile, login, save, records, reload and mobile visuals passed');
})().catch(err=>{console.error(err);process.exit(1);});
