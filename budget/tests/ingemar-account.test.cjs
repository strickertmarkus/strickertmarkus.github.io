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
  assert.match(html,/data-phase="restoring"/,'First paint must never be a login card');
  assert.match(html,/id="ingemar-account-loading"/);
  assert.match(html,/#ingemar-account-gate\[data-phase="restoring"\] \.account-card/);
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
    handlers:{},addEventListener(ev,fn){this.handlers[ev]=fn;},setAttribute(name,value){this[name]=value;}
  });
  const document={documentElement:{dataset:{}},getElementById,addEventListener(){}};
  const storage={getItem:key=>local.has(key)?local.get(key):null,setItem:(key,v)=>{local.set(key,String(v));}};
  const userRef=path=>({
    on(event,fn){callbacks.set(path,fn);queueMicrotask(()=>fn({val:()=>remote.get(path)||null}));},
    off(){callbacks.delete(path);},
    async get(){return {val:()=>remote.get(path)||null};},
    async transaction(update){const value=update(remote.get(path)||null);remote.set(path,value);const fn=callbacks.get(path);if(fn)fn({val:()=>remote.get(path)});return {committed:true,snapshot:{val:()=>value}};},
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
  assert.equal(getElementById('ingemar-account-gate').dataset.phase,'login');
  listener({uid:'ingemar-uid-1',email:'example1@test.invalid'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(window.IngemarAccount.canEdit,true);
  assert.equal(document.documentElement.dataset.ingemarAuth,'ready');
  assert.equal(getElementById('ingemar-account-gate').dataset.phase,'ready');
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
test('Demo URL opens the real profile and navigation stays within Ingemar training',()=>{
 const redirect=fs.readFileSync(path.join(root,'ingemar-preview.html'),'utf8');
 assert.match(redirect,/location.replace\('ingemar.html'/);
 const links=[...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map(match=>match[1]);
 assert.ok(links.includes('ingemar-exercise-guide.html'),'Exercise discovery remains reachable');
 for(const href of links)assert.match(href,/^ingemar-exercise-guide\.html(?:#(?:programs|suggestions))?$/,'Only the internal exercise guide may be linked');
 assert.doesNotMatch(redirect,/seed\(|localStorage/);
});

function loginFixture(mode){
 const elements={},timers=new Map();let timerId=0,listener,readMode=mode,writes=0,subscriptions=0;
 const el=id=>elements[id]||(elements[id]={value:'',dataset:{},textContent:'',handlers:{},hidden:false,addEventListener(type,fn){this.handlers[type]=fn;},setAttribute(name,value){this[name]=value;}});
 const document={getElementById:el,documentElement:{dataset:{}},addEventListener(){}};
 const read=()=>readMode==='denied'?Promise.reject({code:'PERMISSION_DENIED'}):readMode==='pending'?new Promise(()=>{}):Promise.resolve({val:()=>null});
 const ref={on(type,fn,fail){subscriptions++;if(readMode==='denied')fail({code:'PERMISSION_DENIED'});else if(readMode==='ok'||readMode==='write-denied')fn({val:()=>null});},off(){},get:read,transaction(update){writes++;return readMode==='write-denied'?Promise.reject({code:'PERMISSION_DENIED'}):Promise.resolve({committed:true,snapshot:{val:()=>update(null)}});}};
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
 assert.equal(f.el('ingemar-account-gate').dataset.phase,'error');
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
 // The fixture intercepts timeouts rather than running them automatically.
 // Flush the debounced Firebase write deterministically.
 const pending=[...f.timers.values()].find(t=>t.ms===450);
 assert.ok(pending,'Save should queue its 450ms Firebase write');
 await pending.fn();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.writes(),1);
 assert.match(f.el('ingemar-sync-status').textContent,/Firebase nekade sparningen/);
 assert.equal(f.el('ingemar-sync-status').dataset.error,'true');
});

test('Restoring a signed-in profile never reveals the login form during Firebase loading',async()=>{
 let deliverAuth,deliverSnapshot;
 const elements={};const el=id=>elements[id]||(elements[id]={dataset:{},hidden:id==='ingemar-account-form',textContent:'',setAttribute(){},addEventListener(){}});
 const document={documentElement:{dataset:{ingemarAuth:'locked'}},getElementById:el,addEventListener(){}};
 const auth={async setPersistence(){},onAuthStateChanged(fn){deliverAuth=fn;},currentUser:{uid:'saved-user',email:'saved@test.invalid'}};
 const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'LOCAL'}};
 const firebase={apps:[],initializeApp(){return{name:'[DEFAULT]'}},auth:authFn,database:()=>({ref:()=>({on(type,cb){deliverSnapshot=cb;},off(){},get(){return Promise.resolve({val:()=>null});}})})};
 const window={firebase,FIREBASE_CONFIG:{},addEventListener(){}};
 vm.runInNewContext(manager,{window,document,firebase,localStorage:{getItem:()=>null,setItem(){}},console,setTimeout,clearTimeout,setInterval(){return 1;}});
 window.IngemarAccount.connect({apply(){},serialize(){return '{"plans":{},"history":[],"zenHistory":[]}';}});
 await new Promise(resolve=>setImmediate(resolve));
 deliverAuth(auth.currentUser);
 assert.equal(el('ingemar-account-gate').dataset.phase,'loading');
 assert.equal(el('ingemar-account-form').hidden,true);
 assert.equal(document.documentElement.dataset.ingemarAuth,'locked');
 deliverSnapshot({val:()=>null});
 assert.equal(el('ingemar-account-gate').dataset.phase,'ready');
 assert.equal(el('ingemar-account-gate').hidden,true);
 assert.equal(el('ingemar-account-form').hidden,true);
 assert.equal(window.IngemarAccount.canEdit,true);
});

for(const owner of ['saved-user','different-user','signed-out'])test('Local startup precedes Firebase but editing waits for authorization: '+owner,async()=>{
 let deliverAuth,deliverSnapshot,deny,applied,writes=0;
 const storage=new Map([['ex_ingemar_verified_uid',owner],['ex_ingemar',JSON.stringify({goal:3})]]);
 const elements={};const el=id=>elements[id]||(elements[id]={dataset:{},hidden:true,textContent:'',setAttribute(){},addEventListener(){}});
 const events={};
 const document={readyState:'loading',documentElement:{dataset:{ingemarAuth:'locked'}},getElementById:el,addEventListener(name,fn){events[name]=fn;}};
 const auth={async setPersistence(){},onAuthStateChanged(fn){deliverAuth=fn;}};
 const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'LOCAL'}};
 const firebase={apps:[],initializeApp(){return{name:'[DEFAULT]'}},auth:authFn,database:()=>({ref:()=>({on(type,cb,fail){deliverSnapshot=cb;deny=fail;},off(){},set(){writes++;}})})};
 const window={firebase,FIREBASE_CONFIG:{},addEventListener(){}};
 vm.runInNewContext(manager,{window,document,firebase,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},console,setTimeout,clearTimeout,setInterval(){return 1;}});
 window.IngemarAccount.connect({apply(value){applied=value;},serialize:()=>JSON.stringify(applied)});
 assert.equal(document.documentElement.dataset.ingemarAuth,'ready','Local copy renders before Firebase initialization');
 assert.equal(applied.goal,3);
 assert.equal(el('ingemar-main').inert,true);
 assert.equal(window.IngemarAccount.save({goal:99}),false);
 assert.equal(deliverAuth,undefined,'SDK initialization must not block local rendering');
 events.DOMContentLoaded();
 await new Promise(resolve=>setImmediate(resolve));
 if(owner==='signed-out'){
   deliverAuth(null);
   assert.equal(document.documentElement.dataset.ingemarAuth,'locked');
   assert.equal(applied,null);
   assert.equal(storage.has('ex_ingemar_verified_uid'),false,'Signed-out sessions cannot restore local view next time');
   return;
 }
 deliverAuth({uid:'saved-user'});
 assert.equal(document.documentElement.dataset.ingemarAuth,owner==='saved-user'?'ready':'locked');
 assert.equal(el('ingemar-main').inert,true);
 assert.equal(window.IngemarAccount.save({goal:99}),false);
 deliverSnapshot({val:()=>JSON.stringify({goal:7})});
 assert.equal(applied.goal,7,'Fresh server data replaces cache');
 assert.equal(el('ingemar-main').inert,false);
 assert.equal(window.IngemarAccount.canEdit,true);
 assert.equal(writes,0,'Merely showing cache must not upload it');
 deny({code:'PERMISSION_DENIED'});
 assert.equal(document.documentElement.dataset.ingemarAuth,'locked');
 assert.equal(storage.has('ex_ingemar_verified_uid'),false);
});

test('Record increases compare workout maxima, respect chronology and rebuild after corrections',()=>{
 const workout=(date,weights,type='Push')=>({id:date,date,type,exercises:[{name:'Bänkpress',mode:'kg',sets:weights.map(weight=>({weight,reps:8,done:true}))}]});
 const history=[workout('2026-10-03',[30,55,45]),workout('2026-10-01',[25,50]),workout('2026-10-02',[45])];
 let pr=IngemarRecords.collect(history)['bänkpress'];
 assert.equal(pr.weight,55);assert.equal(pr.previousWeight,50);assert.equal(pr.gain,5);assert.equal(pr.group,'Push');
 assert.equal(IngemarRecords.collect([history[0]])['bänkpress'].gain,0,'Warm-up sets in the first workout are not earlier PRs');
 history[0].exercises[0].sets[1].weight=47.5;
 pr=IngemarRecords.collect(history)['bänkpress'];assert.equal(pr.weight,50);assert.equal(pr.gain,0);
 assert.equal(IngemarRecords.group('Marklyft'),'Pull');
 assert.equal(IngemarRecords.group('Min egen övning','Pull'),'Pull');
});
test('Manual record increases persist, corrections do not invent gains and group overrides survive',()=>{
 let manual=IngemarRecords.manualRecord(null,'Marklyft',100,'2026-10-01','Pull');
 let pr=IngemarRecords.collect([],{marklyft:manual}).marklyft;assert.equal(pr.gain,0);
 manual=IngemarRecords.manualRecord(pr,'Marklyft',105,'2026-10-02','Pull');
 pr=IngemarRecords.collect([],JSON.parse(JSON.stringify({marklyft:manual}))).marklyft;
 assert.equal(pr.gain,5);assert.equal(pr.previousWeight,100);assert.equal(pr.group,'Pull');
 manual=IngemarRecords.manualRecord(pr,'Marklyft',103,'2026-10-02','Push');
 pr=IngemarRecords.collect([],{marklyft:manual}).marklyft;assert.equal(pr.gain,3);assert.equal(pr.group,'Push');
 manual=IngemarRecords.manualRecord(pr,'Marklyft',95,'2026-10-02','Pull');
 assert.equal(IngemarRecords.collect([],{marklyft:manual}).marklyft.gain,0);
});
test('Cardio records use completed minutes per exercise and never mix in kilograms',()=>{
 const w=(id,date,minutes)=>({id,date,type:'Kondition',exercises:[{name:'Löpning',mode:'min',sets:minutes.map(minutes=>({minutes,done:true}))}]});
 const old=w('a','2026-10-01',[10,10]),latest=w('b','2026-10-03',[15,10]);latest.exercises[0].sets.push({minutes:999,done:true,skipped:true},{minutes:999,done:false});
 const pr=IngemarRecords.cardio([latest,old,{...w('demo','2026-10-04',[999]),demo:true}])['löpning'];
 assert.equal(pr.minutes,25);assert.equal(pr.gain,5);assert.equal(pr.group,'Kondition');assert.equal(pr.workoutId,'b');
 assert.equal(Object.keys(IngemarRecords.collect([latest,old])).length,0);
});

test('Concurrent devices retain additions, edits and explicit deletions without replacing collections',()=>{
 const window={};vm.runInNewContext(manager,{window});const merge=window.IngemarMerge;
 const copy=x=>JSON.parse(JSON.stringify(x));
 const base={plans:{a:{name:'Ben',exercises:[]}},templates:[{id:'old',name:'Old'}],history:[]};
 const a=copy(base),b=copy(base);a.templates.push({id:'a',name:'Ben'});b.templates.push({id:'b',name:'Pull'});
 a.plans.b={name:'Push'};b.plans.c={name:'Kondition'};
 let result=merge(base,a,b);
 assert.deepEqual(Object.keys(result.plans).sort(),['a','b','c']);
 assert.deepEqual(Array.from(result.templates,x=>x.id).sort(),['a','b','old']);
 const deletion=copy(base);deletion.templates=[];
 result=merge(base,deletion,result);
 assert.deepEqual(Array.from(result.templates,x=>x.id).sort(),['a','b'],'Only the explicitly deleted record is removed');
 for(let i=0;i<200;i++){
  const local=copy(base);local.plans['day-'+i]={name:'Pass '+i};local.templates.push({id:'tpl-'+i,name:'Mall '+i});
  result=merge(base,local,result);
 }
 assert.equal(Object.keys(result.plans).length,203);assert.equal(result.templates.length,202);
});

test('An outdated deletion never erases an exercise or template edited by another device',()=>{
 const window={};vm.runInNewContext(manager,{window});const merge=window.IngemarMerge;
 const base={plans:{monday:{id:'m',name:'Ben',type:'Push',exercises:[{id:'e',name:'Marklyft',sets:[{id:'s',weight:80,reps:5}]}]}},templates:[{id:'t',name:'Måndag',type:'Push',exercises:[]}]};
 const local=JSON.parse(JSON.stringify(base)),remote=JSON.parse(JSON.stringify(base));
 local.templates=[];local.plans.monday.exercises=[]; // Device A removed stale copies.
 remote.templates[0].name='Nyare mall';remote.plans.monday.exercises[0].sets[0].weight=90;
 const result=merge(base,local,remote);
 assert.equal(result.templates[0].name,'Nyare mall');
 assert.equal(result.plans.monday.exercises[0].sets[0].weight,90);
 const noRemoteEdit=merge(base,local,base);
 assert.equal(noRemoteEdit.templates.length,0,'Uncontested removal still works');
 assert.equal(noRemoteEdit.plans.monday.exercises.length,0);
});

test('Edits made while an earlier transaction is in flight survive its acknowledgement and reload',async()=>{
 const remote={value:JSON.stringify({plans:{},history:[],zenHistory:[],templates:[]})},storage=new Map();
 let deliver,resolveWrite,applied;
 const timers=[];
 const el=()=>({dataset:{},setAttribute(){},addEventListener(){}});
 const document={documentElement:{dataset:{}},getElementById:el,addEventListener(){}};
 const ref={on(_,cb){deliver=cb;cb({val:()=>remote.value});},off(){},transaction(update){return new Promise(resolve=>{resolveWrite=()=>{remote.value=update(remote.value);deliver({val:()=>remote.value});resolve({committed:true,snapshot:{val:()=>remote.value}});};});}};
 const auth={setPersistence:async()=>{},onAuthStateChanged(cb){cb({uid:'test'});}};
 const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'LOCAL'}};
 const firebase={apps:[],initializeApp:()=>({}),auth:authFn,database:()=>({ref:()=>ref})};
 const window={firebase,FIREBASE_CONFIG:{},addEventListener(){}};
 vm.runInNewContext(manager,{window,document,firebase,console,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout(fn,ms){timers.push({fn,ms});return timers.length;},clearTimeout(){},setInterval(){}});
 window.IngemarAccount.connect({apply:x=>applied=x,serialize:()=>JSON.stringify(applied)});
 await new Promise(r=>setImmediate(r));
 const first=JSON.parse(remote.value);first.templates.push({id:'one',name:'Ben'});
 window.IngemarAccount.save(first);const pending=timers.find(t=>t.ms===450).fn();
 const second=JSON.parse(JSON.stringify(first));second.templates.push({id:'two',name:'Pull'});window.IngemarAccount.save(second);
 const other=JSON.parse(remote.value);other.plans.tomorrow={name:'Annan mobil'};remote.value=JSON.stringify(other);
 resolveWrite();await pending;
 assert.equal(applied.templates.length,2);assert.equal(applied.plans.tomorrow.name,'Annan mobil');
 const journal=JSON.parse(storage.get('ex_ingemar_journal'));
 const recovered=window.IngemarMerge(JSON.parse(journal.base),JSON.parse(journal.local),JSON.parse(remote.value));
 assert.equal(recovered.templates.length,2);assert.equal(recovered.plans.tomorrow.name,'Annan mobil');
 const final=timers.filter(t=>t.ms===450).at(-1).fn();resolveWrite();await final;
 assert.equal(JSON.parse(remote.value).templates.length,2);assert.equal(storage.has('ex_ingemar_journal'),false);
});

test('Concurrent workout versions remain available and exercise reordering survives another edit',()=>{
 const window={};vm.runInNewContext(manager,{window});
 const ex=id=>({id,name:id,sets:[{id:id+'-set',weight:20,reps:8}]});
 const base={plans:{today:{name:'Ben',type:'Push',exercises:[ex('a'),ex('b')]}},templates:[]};
 const local=JSON.parse(JSON.stringify(base)),remote=JSON.parse(JSON.stringify(base));
 local.plans.today.exercises.reverse();remote.plans.today.exercises[0].sets[0].weight=25;
 const result=window.IngemarMerge(base,local,remote);
 assert.equal(result.plans.today.exercises[0].id,'b');
 assert.equal(result.plans.today.exercises[1].sets[0].weight,25);
 assert.equal(result.templates.length,1);assert.match(result.templates[0].name,/sparad version/);
 const again=window.IngemarMerge(base,local,result);
 assert.equal(new Set(again.templates.map(x=>x.id)).size,again.templates.length);
});

test('Week planner keeps named drafts, protects last exercise and ignores cancelled drag',()=>{
 const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 function functionText(name){
  const match=source.match(new RegExp('^function '+name+'\\([^\\n]*\\)\\{[\\s\\S]*?^\\}', 'm'));
  assert.ok(match,'Missing production function '+name);return match[0];
 }
 const monday='2026-10-12',tuesday='2026-10-13',notices=[];
 const plan=(type,name)=>({type,name,exercises:[{name:'Bänkpress',mode:'kg',sets:[{reps:10,weight:50}]}]});
 const state={builderDrafts:{[monday]:plan('Push','Eget utkast')},templates:[]};
 const ctx={state,weekPlannerMonday:monday,weekDraft:[plan('Push','Ben'),plan('Push','Rygg'),null,null,null,null,null],
  weekDraftDirty:false,weekExpandedDay:-1,weekCopyFrom:-1,weekDrag:null,
  TYPES:['Push','Pull','Kondition'],DAYS:['Mån','Tis','Ons','Tor','Fre','Lör','Sön'],
  offset:(d,n)=>{const dt=new Date(d+'T12:00:00Z');dt.setUTCDate(dt.getUTCDate()+n);return dt.toISOString().slice(0,10);},
  standardWeekPlan:type=>plan(type,type+' · Fokus'),
  renderWeekPlanner(){},exerciseNameKey:s=>String(s).toLowerCase(),weekExercisePreset(){return null},
  toast:s=>notices.push(s),builderTemplates:()=>[{id:'tpl',...plan('Kondition','Mallens namn')}],
  deep:x=>JSON.parse(JSON.stringify(x)),
  document:{documentElement:{classList:{remove(){}}},removeEventListener(){}},
  clearWeekDragTarget(){},moveWeekDrag(){},swapCalls:0
 };
 vm.runInNewContext(['normalizeBetweenOption','setWeekDayType','toggleWeekExercise','applyWeekDayTemplate','swapWeekDays','endWeekDrag'].map(functionText).join('\n'),ctx);
 ctx.setWeekDayType(0,'Pull');
 assert.equal(ctx.weekDraft[0].name,'Ben');
 assert.equal(ctx.weekDraft[0].type,'Pull');
 assert.equal(state.builderDrafts[monday].type,'Pull','Old autosaved builder must not restore stale form');
 ctx.toggleWeekExercise(0,'Bänkpress');
 assert.equal(ctx.weekDraft[0].exercises.length,1,'Cannot leave a planned session with no exercise');
 assert.match(notices.at(-1),/minst en övning/);
 ctx.applyWeekDayTemplate(0,'tpl');
 assert.equal(ctx.weekDraft[0].name,'Mallens namn');
 assert.equal(state.builderDrafts[monday],undefined,'Applying a template must invalidate the older draft');
 state.builderDrafts[monday]=plan('Pull','Utkast mån');
 state.builderDrafts[tuesday]=plan('Push','Utkast tis');
 ctx.swapWeekDays(0,1);
 assert.equal(ctx.weekDraft[0].name,'Rygg');
 assert.equal(ctx.weekDraft[1].name,'Mallens namn');
 assert.equal(state.builderDrafts[monday].name,'Utkast tis');
 assert.equal(state.builderDrafts[tuesday].name,'Utkast mån');
 const before=ctx.weekDraft.map(x=>x&&x.name);
 ctx.weekDrag={pointerId:91,from:0,to:1,ghost:{parentNode:true,remove(){}},card:{classList:{remove(){}}}};
 ctx.endWeekDrag({pointerId:91,type:'pointercancel'});
 assert.equal(JSON.stringify(ctx.weekDraft.map(x=>x&&x.name)),JSON.stringify(before));
});

test('Two authenticated devices can add distinct manually typed exercise options without losing either',()=>{
 const window={};vm.runInNewContext(manager,{window});
 const merge=window.IngemarMerge;
 const base={plans:{},history:[],zenHistory:[],exerciseOptions:{},hiddenExerciseOptions:{}};
 const idA='Pull|kg|redigerat%20namn',idB='Push|kg|ny%20styrke%C3%B6vning';
 const local=JSON.parse(JSON.stringify(base)),remote=JSON.parse(JSON.stringify(base));
 local.exerciseOptions[idA]={type:'Pull',mode:'kg',name:'Redigerat namn'};
 remote.exerciseOptions[idB]={type:'Push',mode:'kg',name:'Ny styrkeövning'};
 const merged=merge(base,local,remote);
 assert.equal(merged.exerciseOptions[idA].name,'Redigerat namn');
 assert.equal(merged.exerciseOptions[idB].name,'Ny styrkeövning');
 merged.hiddenExerciseOptions[idA]=true;
 const unhidden=JSON.parse(JSON.stringify(merged));unhidden.hiddenExerciseOptions[idA]=false;
 assert.equal(merge(merged,unhidden,merged).hiddenExerciseOptions[idA],false,'Explicit retyping can restore a dismissed option');
});
