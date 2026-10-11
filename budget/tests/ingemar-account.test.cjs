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
  assert.match(html,/id="ingemar-account-form"/);
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
