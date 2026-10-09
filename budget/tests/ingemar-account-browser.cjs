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
     setPersistence:async()=>{},
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
     on(type,cb){observers.set(path,cb);queueMicrotask(()=>cb({val:()=>getDb()[path]||null}));},
     off(){observers.delete(path);},
     async set(value){const db=getDb();db[path]={json:value.json,updatedAt:1234};localStorage.setItem(DBKEY,JSON.stringify(db));
       const cb=observers.get(path);if(cb)cb({val:()=>db[path]});},
   };}
   const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'LOCAL'}};
   const dbFn=()=>({ref});dbFn.ServerValue={TIMESTAMP:1234};
   const apps=[];
   window.firebase={apps,initializeApp(config,name){const app={name};apps.push(app);return app;},auth:authFn,database:dbFn};
 });
 await context.route('https://www.gstatic.com/firebasejs/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'// Firebase isolated test double installed by Playwright'}));
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
 await context.route('https://fonts.gstatic.com/**',r=>r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 fs.mkdirSync('test-results/ingemar-private',{recursive:true});
 await page.goto('http://127.0.0.1:4173/budget/ingemar.html',{waitUntil:'domcontentloaded'});
 assert.equal(await page.title(),'Ingemars träning · Mitt konto');
 assert.equal(await page.locator('#ingemar-account-gate').isVisible(),true);
 assert.equal(await page.locator('main').isVisible(),false);
 await page.screenshot({path:'test-results/ingemar-private/login-390.png',fullPage:true});
 await page.locator('#ingemar-login-email').fill('ingemar-fixture@test.invalid');
 await page.locator('#ingemar-login-password').fill('testing-12345');
 await page.locator('#ingemar-register-submit').click();
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 assert.equal(await page.locator('#ingemar-account-gate').isVisible(),false);
 assert.equal(await page.locator('main').isVisible(),true);
 assert.match(await page.locator('#ingemar-sync-status').textContent(),/Synkat/);
 const details=await page.evaluate(()=>({apps:firebase.apps.map(a=>a.name),db:JSON.parse(localStorage.getItem('__ingemar_test_db')||'{}')}));
 assert.deepEqual(details.apps,['ingemar-personal']);
 assert.equal(Object.keys(details.db).length,0,'Empty account should not receive seeded fake data');
 await page.locator('[data-view="stretch"]').click();
 await page.locator('#zen-main-start').click();
 await page.waitForSelector('#zen-session:not([hidden])');
 await page.screenshot({path:'test-results/ingemar-private/stretch-390.png'});
 await page.locator('[data-action="finish-zen"]').click();
 await page.waitForFunction(()=>Object.keys(JSON.parse(localStorage.getItem('__ingemar_test_db')||'{}')).length===1);
 const saved=await page.evaluate(()=>{
    const db=JSON.parse(localStorage.getItem('__ingemar_test_db'));const path=Object.keys(db)[0];
    return {path,history:JSON.parse(db[path].json).zenHistory.length};
 });
 assert.equal(saved.path,'ingemar_v1/fixture-ingemar-fixture-test-invalid/state');
 assert.equal(saved.history,1,'Finishing Zen stores the session in Ingemar account');
 await page.screenshot({path:'test-results/ingemar-private/synced-390.png',fullPage:true});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 await page.locator('[data-view="stretch"]').click();
 assert.match(await page.locator('#zen-history').textContent(),/Helkropp/,'Zen log survives reload');
 await page.locator('#ingemar-logout').click();
 await page.waitForSelector('html[data-ingemar-auth="locked"]');
 await page.locator('#ingemar-login-email').fill('other-fixture@test.invalid');
 await page.locator('#ingemar-login-password').fill('testing-12345');
 await page.locator('#ingemar-register-submit').click();
 await page.waitForSelector('html[data-ingemar-auth="ready"]');
 await page.locator('[data-view="stretch"]').click();
 assert.doesNotMatch(await page.locator('#zen-history').textContent(),/Helkropp/,'Second account must not see first account log');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),true,'No unintended mobile horizontal overflow');
 assert.deepEqual(errors,[],errors.join(' | '));
 await browser.close();console.log('Separate Ingemar account, registration, Zen Firebase sync, reload and UID isolation passed');
})().catch(err=>{console.error(err);process.exit(1);});
