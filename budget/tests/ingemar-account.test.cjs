'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'ingemar.html'),'utf8');
const manager=fs.readFileSync(path.join(root,'ingemar-account.js'),'utf8');

test('Ingemar production page has a shared login and no demo history bootstrap',()=>{
  new vm.Script(manager,{filename:'ingemar-account.js'});
  const source=html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(source,'Ingemar training inline script exists');
  new vm.Script(source[1],{filename:'ingemar.html'});
  assert.match(html,/data-ingemar-auth="locked"/);
  assert.match(html,/id="ingemar-account-form" hidden/,'Login controls must stay hidden until auth restoration resolves');
  assert.match(html,/ingemar-account\.js\?/);
  assert.match(source[1],/function emptyState\(\)/);
  assert.match(source[1],/window\.IngemarAccount\.save\(state\)/);
  assert.match(source[1],/window\.IngemarAccount\.connect\(\{/);
  assert.doesNotMatch(source[1],/function strengthDemoHistory\(|function zenSeedHistory\(|function seedWeekTemplates\(/);
  assert.doesNotMatch(html,/DEMO · FAKE DATA|Återställ demodata/);
});

test('Firebase data remains isolated from Maja/Markus and shared across authenticated accounts',async()=>{
  const remote=new Map(),local=new Map(),callbacks=new Map(),elements={};
  const getElementById=id=>elements[id]||(elements[id]={
    id,value:'',textContent:'',dataset:{},hidden:false,disabled:false,
    handlers:{},addEventListener(ev,fn){this.handlers[ev]=fn;}
  });
  const document={documentElement:{dataset:{}},getElementById,addEventListener(){}};
  const storage={getItem:key=>local.has(key)?local.get(key):null,setItem:(key,v)=>{local.set(key,String(v));}};
  const userRef=path=>({
    on(event,fn){callbacks.set(path,fn);queueMicrotask(()=>fn({val:()=>remote.get(path)||null}));},
    off(){callbacks.delete(path);},
    async get(){return {val:()=>remote.get(path)||null};},
    async set(value){remote.set(path,value);const fn=callbacks.get(path);if(fn)fn({val:()=>remote.get(path)});},
  });
  let listener;
  const auth={
    async setPersistence(){},onAuthStateChanged(fn){listener=fn;queueMicrotask(()=>fn(null));},
    async signOut(){listener(null);},
    async createUserWithEmailAndPassword(){return{};},
    async signInWithEmailAndPassword(){return{};}
  };
  const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'LOCAL'}};
  const dbFn=()=>({ref:userRef});dbFn.ServerValue={TIMESTAMP:1234};
  const apps=[];const firebase={
    apps,
    initializeApp(config,name){const app={name:name||'[DEFAULT]'};apps.push(app);return app;},
    auth:authFn,database:dbFn
  };
  const window={
    FIREBASE_CONFIG:{projectId:'fake-test'},firebase,document,
    addEventListener(){},confirm:()=>true
  };
  const context={window,document,firebase,localStorage:storage,console,
    queueMicrotask,setTimeout,clearTimeout,setInterval:()=>1,clearInterval:()=>{}};
  vm.runInNewContext(manager,context,{filename:'ingemar-account.js'});
  const pages=[];
  window.IngemarAccount.connect({
    apply:data=>pages.push(data),
    serialize:()=>JSON.stringify({plans:{},history:[],zenHistory:[]})
  });
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(window.IngemarAccount.canEdit,false);
  assert.equal(document.documentElement.dataset.ingemarAuth,'locked');
  listener({uid:'ingemar-uid-1',email:'example1@test.invalid'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(window.IngemarAccount.canEdit,true);
  assert.equal(document.documentElement.dataset.ingemarAuth,'ready');
  assert.deepEqual(apps.map(a=>a.name),['[DEFAULT]']);
  const data={plans:{'2026-10-09':{name:'Styrka'}},history:[{id:'run1'}],zenHistory:[{id:'zen1'}]};
  window.IngemarAccount.save(data);
  await new Promise(resolve=>setTimeout(resolve,550));
  assert.equal(remote.get('ex_ingemar'),JSON.stringify(data));
  assert.equal(window.IngemarAccount.status,'Synkat via Firebase');
  assert.equal(local.get('ex_ingemar'),JSON.stringify(data));
  listener(null);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(window.IngemarAccount.canEdit,false);
  assert.equal(document.documentElement.dataset.ingemarAuth,'locked');
  listener({uid:'ingemar-uid-2',email:'example2@test.invalid'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(window.IngemarAccount.canEdit,true);
  assert.equal(JSON.stringify(pages[pages.length-1]),JSON.stringify(data));
  assert.deepEqual([...remote.keys()],['ex_ingemar']);
  listener(null);
  await new Promise(resolve=>setImmediate(resolve));
  listener({uid:'ingemar-uid-1',email:'example1@test.invalid'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(JSON.stringify(pages[pages.length-1]),JSON.stringify(data));
});

require('../ingemar-records.js');
test('PRs use completed max weights, never demos, skipped sets, plans or cardio',()=>{
 const ex=(name,weights,extra={})=>({name,mode:'kg',sets:weights.map(weight=>({weight,reps:8,done:true})),...extra});
 const history=[{date:'2026-10-11',exercises:[ex('Bänkpress',[40,55,45]),ex(' BÄNKPRESS ',[60]),ex('Rodd',[35,42.5]),ex('Löpning',[200],{mode:'min'}),ex('Ej klart',[90],{sets:[{weight:90,reps:8,done:false}]}),ex('Överhoppat',[100],{sets:[{weight:100,reps:8,done:true,skipped:true}]})]}, {demo:true,exercises:[ex('Bänkpress',[999])]}];
 const records=globalThis.IngemarRecords.collect(history);
 assert.equal(records['bänkpress'].weight,60);
 assert.equal(records.rodd.weight,42.5);
 assert.equal(Object.keys(records).length,2);
 assert.equal(globalThis.IngemarRecords.collect([{exercises:[ex('Bänkpress',[30])]}],records)['bänkpress'].weight,60);
 assert.equal(globalThis.IngemarRecords.collect([{exercises:[ex('Bänkpress',[62.5])]}],records)['bänkpress'].weight,62.5);
});
test('Demo URL now opens the real profile and neither page exposes outgoing navigation',()=>{
 const redirect=fs.readFileSync(path.join(root,'ingemar-preview.html'),'utf8');
 assert.match(redirect,/location.replace\('ingemar.html'/);
 assert.doesNotMatch(html,/<a\s[^>]*href=/i);
 assert.doesNotMatch(redirect,/seed\(|localStorage/);
});

function loginFixture(mode){
 const elements={},timers=new Map();let timerId=0,listener,readMode=mode,writes=0,subscriptions=0;
 const el=id=>elements[id]||(elements[id]={value:'',dataset:{},textContent:'',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}});
 const document={getElementById:el,documentElement:{dataset:{}},addEventListener(){}};
 const read=()=>readMode==='denied'?Promise.reject({code:'PERMISSION_DENIED'}):readMode==='pending'?new Promise(()=>{}):Promise.resolve({val:()=>null});
 const ref={on(type,fn,fail){subscriptions++;if(readMode==='denied')fail({code:'PERMISSION_DENIED'});else if(readMode==='ok'||readMode==='write-denied')fn({val:()=>null});},off(){},get:read,set(){writes++;return readMode==='write-denied'?Promise.reject({code:'PERMISSION_DENIED'}):Promise.resolve();}};
 const auth={setPersistence:async()=>{},onAuthStateChanged(fn){listener=fn;fn(null);},async signInWithEmailAndPassword(){listener({uid:'fixture',email:'test@example.invalid'});},async signOut(){listener(null);}};
 const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'LOCAL'}};
 const firebase={apps:[],initializeApp:()=>({}),auth:authFn,database:()=>({ref:()=>ref})};
 const window={firebase,FIREBASE_CONFIG:{},addEventListener(){},confirm:()=>true};
 vm.runInNewContext(manager,{window,document,firebase,localStorage:{getItem:()=>null,setItem(){}},console,setTimeout(fn,ms){timers.set(++timerId,{fn,ms});return timerId;},clearTimeout(id){timers.delete(id);},setInterval(){return 1;}});
 window.IngemarAccount.connect({apply(){},serialize:()=>'{"plans":{},"history":[],"zenHistory":[]}'});
 el('ingemar-login-email').value='test@example.invalid';el('ingemar-login-password').value='test-password';
 return {window,document,el,timers,setMode(value){readMode=value;},writes:()=>writes,subscriptions:()=>subscriptions,async login(){el('ingemar-account-form').handlers.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));}};
}
test('Successful authentication cannot overwrite a database permission error; retry recovers',async()=>{
 const f=loginFixture('denied');await f.login();
 assert.match(f.el('ingemar-account-message').textContent,/Firebase nekar åtkomst/);
 assert.equal(f.el('ingemar-account-message').dataset.error,'true');
 assert.equal(f.window.IngemarAccount.canEdit,false);
 assert.equal(f.el('ingemar-account-gate').dataset.signedIn,'true');
 assert.equal(f.el('ingemar-account-form').hidden,true,'Signed-in retry gate must not request credentials again');
 assert.equal(f.writes(),0,'No writes when database access is denied');
 f.setMode('ok');f.el('ingemar-retry').handlers.click();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.window.IngemarAccount.canEdit,true);
 assert.equal(f.document.documentElement.dataset.ingemarAuth,'ready');
 assert.equal(f.subscriptions(),2,'Retry must restore the realtime subscription');
});
test('Unresponsive database produces a bounded error instead of endless loading',async()=>{
 const f=loginFixture('pending');await f.login();
 const timeout=[...f.timers.values()].find(t=>t.ms===12000);assert.ok(timeout);timeout.fn();
 assert.match(f.el('ingemar-account-message').textContent,/databasen svarar inte/);
 assert.equal(f.window.IngemarAccount.canEdit,false);
 assert.equal(f.writes(),0);
});

test('Denied Firebase writes remain pending and display a visible error',async()=>{
 const f=loginFixture('write-denied');await f.login();
 assert.equal(f.window.IngemarAccount.canEdit,true);
 assert.equal(f.window.IngemarAccount.save({plans:{},history:[],zenHistory:[{id:'zen-save-test'}]}),true);
 await new Promise(resolve=>setTimeout(resolve,550));
 assert.equal(f.writes(),1);
 assert.match(f.el('ingemar-sync-status').textContent,/Firebase nekade sparningen/);
 assert.equal(f.el('ingemar-sync-status').dataset.error,'true');
});
