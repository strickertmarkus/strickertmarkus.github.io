const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/../shopping-recipes-v4.js', 'utf8').replace('  function engine()', '  window.recipeTest = {mergeStores, saveRecipes, readStore, reconcileSnapshot, bindFirebase, refreshRemote, newRecipeId, status:()=>({message:syncMessage,failed:syncFailed})};\n  function engine()');
const recipe = (id, name, updatedAt = 0) => ({id, name, url:'', items:[], updatedAt});
const store = (recipes, updatedAt = 0, deleted = {}) => ({version:5, updatedAt, recipes, deleted});
function client(initial, server) {
  const storage = new Map([['sh_recipes_v3', JSON.stringify(initial)]]);
  const timers = [];
  const snap = () => ({exists:()=>server.value != null, val:()=>server.value});
  const ref = {
    get:async()=>{if(server.readFail)throw {code:'PERMISSION_DENIED'};return snap();}, on(){}, off(){},
    async transaction(update) {
      if (server.fail) throw Error('offline');
      server.value = update(server.value);
      return {committed:true, snapshot:snap()};
    }
  };
  const document = {readyState:'loading', hidden:false, addEventListener(){}, getElementById(){return null;}};
  const window = {crypto:require('node:crypto').webcrypto, location:{pathname:'/budget/shopping.html'}, addEventListener(){}};
  const firebase = {auth:()=>({onAuthStateChanged:fn=>fn({uid:'fixture'})}), database:()=>({ref:()=>ref})};
  vm.runInNewContext(source, {window, document, firebase, localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}, URL, Set, Map, Date, console:{warn(){}}, setInterval(){}, setTimeout(fn){timers.push(fn);return fn;}, clearTimeout(fn){const i=timers.indexOf(fn);if(i>=0)timers.splice(i,1);}});
  return {...window.recipeTest, async flush(){while(timers.length){timers.shift()(); await new Promise(setImmediate);}}, async attach(){window.recipeTest.bindFirebase();await new Promise(setImmediate);}};
}
test('legacy recipe collections merge even when the older collection has no timestamp', () => {
  const c = client(store([]), {});
  const merged = c.mergeStores({version:4, updatedAt:900, recipes:[recipe(1,'Markus')]}, [recipe(2,'Maja')]);
  assert.deepEqual(Array.from(merged.recipes, r=>r.name), ['Markus','Maja']);
});
test('newest individual edit wins without discarding unrelated older recipes', () => {
  const c = client(store([]), {});
  const merged = c.mergeStores(store([recipe(1,'Edited',40),recipe(2,'Other',10)],40),store([recipe(1,'Old',20),recipe(3,'Offline',25)],25));
  assert.deepEqual(Array.from(merged.recipes, r=>r.name), ['Edited','Other','Offline']);
});
test('deletion markers prevent an offline phone resurrecting a deleted recipe', () => {
  const c = client(store([]), {});
  const merged = c.mergeStores(store([],40,{'1':40}),store([recipe(1,'Old',20)],20));
  assert.equal(merged.recipes.length,0);
});
test('simultaneous additions use a transaction and preserve both phones recipes',async()=>{
  const server={value:JSON.stringify(store([]))};
  const a=client(store([]),server),b=client(store([]),server);
  await a.attach();await b.attach();
  a.saveRecipes([recipe(1,'Markus')]);b.saveRecipes([recipe(2,'Maja')]);
  await a.flush();await b.flush();
  assert.deepEqual(JSON.parse(server.value).recipes.map(r=>r.name).sort(),['Maja','Markus']);
});
test('failed writes retain local additions and retry on a later refresh',async()=>{
  const server={value:JSON.stringify(store([recipe(1,'Shared',1)],1)),fail:true};
  const c=client(store([recipe(2,'Offline',2)],2),server);
  await c.attach();await c.flush();
  assert.equal(c.readStore().recipes.length,2);
  server.fail=false;
  c.reconcileSnapshot({val:()=>server.value});await c.flush();
  assert.equal(JSON.parse(server.value).recipes.length,2);
});
test('deleting the last recipe propagates an empty collection',async()=>{
  const initial=store([recipe(1,'Shared',1)],1);
  const server={value:JSON.stringify(initial)};
  const c=client(initial,server);await c.attach();
  c.saveRecipes([]);await c.flush();
  assert.equal(JSON.parse(server.value).recipes.length,0);
  assert(JSON.parse(server.value).deleted['1']>1);
});

test('new recipes get different IDs on phones starting from the same collection',()=>{
  const a=client(store([recipe(1,'Shared')]),{}),b=client(store([recipe(1,'Shared')]),{});
  const ids=Array.from({length:100},()=>[a.newRecipeId(),b.newRecipeId()]).flat();
  assert(ids.every(Number.isSafeInteger));
  assert.equal(new Set(ids).size,ids.length);
  assert(!ids.includes(1));
});
test('permission denial is visible and a later successful refresh clears it',async()=>{
  const initial=store([recipe(1,'Local',1)],1);
  const server={readFail:true,value:JSON.stringify(initial)};
  const c=client(initial,server);await c.attach();
  assert.equal(c.status().failed,true);
  assert.match(c.status().message,/Firebase nekar åtkomst/);
  c.reconcileSnapshot({val:()=>server.value});
  assert.equal(c.status().failed,false);
  assert.equal(c.status().message,'Recept synkade');
});
