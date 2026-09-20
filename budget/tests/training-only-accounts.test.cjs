'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'firebase-sync.js'), 'utf8');
const authSource = fs.readFileSync(path.join(root, 'auth-gate.js'), 'utf8');
const exerciseSource = fs.readFileSync(path.join(root, 'exercise.html'), 'utf8');
const navSource = fs.readFileSync(path.join(root, 'exercise-motion-v1.js'), 'utf8');
const flush = async () => { for (let i = 0; i < 35; i++) await Promise.resolve(); };

function harness(role, uid, seed = {}, urlSearch = '?user=maja') {
  const local = new Map();
  const remote = new Map(Object.entries(seed));
  const reads = [], writes = [], listeners = {};
  class Storage {
    getItem(k) { return local.has(String(k)) ? local.get(String(k)) : null; }
    setItem(k,v) { local.set(String(k),String(v)); }
    removeItem(k) { local.delete(String(k)); }
  }
  const localStorage = new Storage();
  const snapshot = val => ({exists: () => val != null, val: () => val});
  const db = {ref(key) {
    reads.push(key);
    return {get: () => Promise.resolve(snapshot(remote.get(key))),
      on(_event, cb) {cb(snapshot(remote.get(key)));return cb;},
      set(value) {writes.push({key,value});remote.set(key,value);return Promise.resolve();}};
  }};
  const authInstance = {currentUser:{uid},setPersistence:()=>Promise.resolve(),
    onAuthStateChanged(cb){cb(this.currentUser);return()=>{};}};
  function auth(){return authInstance;}
  auth.Auth = {Persistence:{LOCAL:'local'}};
  const firebase={apps:[{}],app:()=>({}),initializeApp:()=>({}),auth,database:()=>db};
  const access=role?{role,uid}:null;
  const window={location:{pathname:'/budget/exercise.html',search:urlSearch,
      href:'https://example.test/budget/exercise.html'+urlSearch},
    AppAccess:{role:role||null,uid:uid||null,ready:role?Promise.resolve(access):new Promise(()=>{})},
    addEventListener(){},dispatchEvent(){}};
  const document={title:'',head:{appendChild(){}},querySelector:()=>null,getElementById:()=>null,
    createElement:()=>({style:{},setAttribute(){},appendChild(){}}),
    addEventListener(name,cb){(listeners[name]||=[]).push(cb);}};
  const ctx=vm.createContext({Storage,localStorage,window,document,firebase,URL,URLSearchParams,
    CustomEvent:class{constructor(name,props){this.type=name;this.detail=props.detail;}},
    console:{log(){},warn(){}},setInterval:()=>1,clearInterval(){},
    setTimeout:fn=>{fn();return 1;},clearTimeout(){}});
  vm.runInContext(source,ctx,{filename:'firebase-sync.js'});
  return {local,remote,reads,writes,localStorage,
    start(){for(const cb of listeners.DOMContentLoaded||[])cb();},
    eval(code){return vm.runInContext(code,ctx);}};
}

test('unresolved role cannot read or overwrite family cache or read Firebase',async()=>{
  const h=harness(null,'unknown',{'ex_wk':'family-history'});
  h.local.set('ex_wk','cached-family-history');
  assert.equal(h.localStorage.getItem('ex_wk'),null);
  h.localStorage.setItem('ex_wk','unauthorized-write');
  h.start();await flush();
  assert.equal(h.local.get('ex_wk'),'cached-family-history');
  assert.deepEqual(h.reads,[]);
});
test('family retains the original Maja data path',async()=>{
  const h=harness('family','family-uid',{'ex_wk':'markus','ex_wk_maja':'maja'});
  h.start();await flush();
  assert.equal(h.localStorage.getItem('ex_wk'),'maja');
  assert.ok(h.reads.includes('ex_wk')&&h.reads.includes('ex_wk_maja'));
  assert.ok(!h.reads.some(p=>p.startsWith('training_users/')));
});
test('Ingemar uses only his own UID keys, even with a user=maja URL',async()=>{
  const h=harness('training_only','ingemar-uid',{
    'ex_wk':'family-workouts','ex_wk_maja':'maja-workouts','budgetTracker':'private-budget',
    'training_users/ingemar-uid/data/ex_wk':'own-workouts'});
  h.local.set('ex_wk','cached-markus');h.local.set('ex_wk_maja','cached-maja');
  h.start();await flush();
  assert.equal(h.localStorage.getItem('ex_wk'),'own-workouts');
  assert.equal(h.localStorage.getItem('ex_wk_maja'),null);
  assert.equal(h.local.get('ex_wk'),'cached-markus');
  assert.ok(h.reads.length>0);
  assert.ok(h.reads.every(p=>p.startsWith('training_users/ingemar-uid/data/ex_')));
  h.localStorage.setItem('ex_wk','new-own-workouts');await flush();
  assert.ok(h.writes.some(w=>w.key==='training_users/ingemar-uid/data/ex_wk'&&w.value==='new-own-workouts'));
  assert.ok(!h.writes.some(w=>['ex_wk','ex_wk_maja','budgetTracker'].includes(w.key)));
  h.localStorage.removeItem('ex_wk');
  assert.equal(h.localStorage.getItem('ex_wk'),null);
  assert.equal(h.local.get('ex_wk'),'cached-markus');
});
test('training account includes separate body-weight and weekly-plan synchronization',async()=>{
  const h=harness('training_only','own-uid');h.start();await flush();
  assert.ok(['ex_weekPlans','ex_bw'].every(k=>h.reads.includes('training_users/own-uid/data/'+k)));
});
test('client does not grant a role on registration and exposes Ingemar categories',()=>{
  assert.match(authSource,/role !== 'family' && role !== 'training_only'/);
  assert.match(authSource,/ref\('app_roles\/' \+ user\.uid\)/);
  assert.match(authSource,/auth\.signOut\(\)/);
  assert.match(navSource,/access\.role!=='training_only'/);
  assert.match(exerciseSource,/Ingemars träning/);
  assert.match(exerciseSource,/Push','Pull','Kondition/);
});
