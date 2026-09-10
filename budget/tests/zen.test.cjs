const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const M=require('../zen-model.js');
const time=new Date(2026,8,10,12).getTime();
const routine=M.routines[0];
const record=(id,kind='stretch',completedAt=time,seconds=60)=>({id,type:'session',kind,completedAt,seconds,name:'Min stund',note:'',feeling:'',updatedAt:completedAt});

test('all built-in rituals validate and contain only one kind',()=>{
  for(const r of M.routines){assert.ok(M.routineValid(r));assert.ok(M.duration(r)>0);if(r.kind==='meditation')assert.equal(r.steps,undefined);else assert.equal(r.guidance,undefined);}
  assert.equal(M.duration(routine),480);
});
test('wall-clock timer crosses poses and finishes after a suspended tab',()=>{
  const s=M.start(routine,time,'first');assert.equal(M.position(s,time+61000).index,1);assert.equal(M.position(s,time+61000).remaining,59);
  assert.equal(M.position(s,time+3600000).done,true);assert.equal(M.elapsed(s,time+3600000),480000);
});
test('pause, serialize, reload and resume exclude all paused time',()=>{
  let s=M.pause(M.start(routine,time,'pause'),time+45000);s=JSON.parse(JSON.stringify(s));assert.ok(M.activeValid(s));assert.equal(M.elapsed(s,time+7200000),45000);
  s=M.resume(s,time+7200000);assert.equal(M.elapsed(s,time+7215000),60000);assert.equal(M.position(s,time+7215000).index,1);
  s=M.pause(s,time+7220000);s=M.resume(s,time+8000000);assert.equal(M.elapsed(s,time+8005000),70000);
});
test('running recovery counts wall time and snapshots do not mutate presets',()=>{
  const s=JSON.parse(JSON.stringify(M.start(routine,time,'resume')));assert.equal(M.elapsed(s,time+70000),70000);s.routine.steps[0].seconds=90;assert.equal(routine.steps[0].seconds,60);
  assert.equal(M.elapsed(M.start(routine,time,'clock'),time-10000),0);
});
test('invalid imports and corrupt active timers are rejected',()=>{
  assert.equal(M.routineValid({...routine,steps:[]}),false);assert.equal(M.routineValid({...M.routines[3],seconds:Infinity}),false);
  assert.equal(M.activeValid({...M.start(routine,time,'bad'),elapsedMs:-5}),false);
  assert.equal(M.entryValid({...record('bad'),seconds:-1}),false);assert.equal(M.entryValid({...record('bad'),kind:'strength'}),false);
  assert.deepEqual(M.merge({bad:{...record('bad'),id:'different'}},{}),{});
});
test('weeks, streaks and collections use the selected kind and local dates',()=>{
  const today=new Date(2026,8,10,12).getTime(),yesterday=new Date(2026,8,9,12).getTime();
  const records=[record('s1','stretch',today,600),record('s2','stretch',yesterday,300),record('m1','meditation',today,1200)];
  const st=M.stats(records,'stretch',today);assert.equal(st.minutes,15);assert.equal(st.count,2);assert.equal(st.streak,2);assert.equal(st.days,2);assert.equal(st.week[0].date,'2026-09-07');assert.equal(st.week[3].minutes,10);
  assert.equal(M.stats(records,'meditation',today).minutes,20);assert.equal(M.stats(records,'stretch',new Date(2026,8,11,12)).streak,2);assert.equal(M.stats(records,'stretch',new Date(2026,8,12,12)).streak,0);
});
test('records are idempotent and deleted records stay deleted after offline merge',()=>{
  const r=record('one'),deleted={id:'one',deleted:true,updatedAt:time+10};assert.equal(Object.keys(M.merge({one:r},{one:r})).length,1);
  assert.deepEqual(M.merge({one:deleted},{one:r}).one,deleted);assert.deepEqual(M.merge({one:r},{one:deleted}).one,deleted);
});

function storeHarness({deny=false,seed={},localFail=false}={}){
  const local=new Map(Object.entries(seed)),writes=[],listeners=new Map(),remote={},auth={callback:null};let pathRoot='';
  const ref={off(){},on(event,cb,error){listeners.set('entries',cb);if(deny)error(Error('PERMISSION_DENIED'));else cb({val:()=>remote});},once(){return Promise.resolve({val:()=>remote});},child(id){return {set(e){writes.push({path:pathRoot+'/'+id,entry:e});remote[id]=e;listeners.get('entries')?.({val:()=>remote});return Promise.resolve();}};}};
  const firebase={auth:()=>({onAuthStateChanged(fn){auth.callback=fn;fn({uid:'test-user'});}}),database:()=>({ref(p){if(p==='.info/connected')return {on(event,fn){listeners.set('connection',fn);fn({val:()=>true});}};pathRoot=p;return ref;}})};
  const context={window:{ZenModel:M,firebase},firebase,location:{search:'?user=maja'},URLSearchParams,Date,queueMicrotask,localStorage:{getItem:k=>local.get(k)||null,setItem(k,v){if(localFail)throw Error('Quota');local.set(k,v);}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../zen-store.js'),'utf8'),context);
  return {S:context.window.ZenStore,writes,local,auth};
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
test('cloud storage is profile scoped and never writes any training key',async()=>{
  const {S,writes}=storeHarness();S.put(record('saved'));await flush();assert.equal(writes.length,1);assert.equal(writes[0].path,'zen_v1/test-user/maja/entries/saved');assert.equal(S.status,'Sparat på ditt konto');
  S.setActive(M.start(routine,time,'active'));assert.equal(writes.length,1);
});
test('permission denied preserves records locally and reports local-only saving',()=>{
  const {S,local,writes}=storeHarness({deny:true});S.put(record('offline'));assert.equal(S.entries.length,1);assert.equal(writes.length,0);assert.equal(S.status,'Sparat på den här enheten');assert.match(local.get('zen_v1_test-user_maja_entries'),/offline/);
});
test('offline backlog syncs each entry once despite realtime local echo',async()=>{
  const entries=Object.fromEntries(Array.from({length:100},(_,i)=>['r'+i,record('r'+i)]));
  const {S,writes}=storeHarness({seed:{'zen_v1_test-user_maja_entries':JSON.stringify(entries)}});await flush();assert.equal(S.entries.length,100);assert.equal(writes.length,100);assert.equal(S.status,'Sparat på ditt konto');
});
test('backup import validates profile, refuses training data, preserves existing entries',async()=>{
  const {S}=storeHarness();S.put(record('existing'));assert.throws(()=>S.import({app:'exercise',version:1,profile:'maja',entries:{}}));assert.throws(()=>S.import({app:'zen',version:1,profile:'markus',entries:{}}));
  S.import({app:'zen',version:1,profile:'maja',entries:{imported:record('imported')}});await flush();assert.equal(S.entries.length,2);assert.equal(S.export().profile,'maja');
});
test('storage errors are surfaced and auth changes clear the current profile cache',()=>{
  const {S,auth}=storeHarness({deny:true,localFail:true});S.put(record('memory'));assert.match(S.status,/Kunde inte spara/);auth.callback(null);assert.equal(S.ready,false);assert.equal(S.entries.length,0);assert.equal(S.active,null);
});
