const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../zen-model.js');
const start=100000;
test('skipping exercises changes position without recording unpracticed time',()=>{
 let s=M.start(M.routines[0],start,'skip');s=M.seek(s,3,start+10000);
 assert.equal(M.position(s,start+10000).index,3);assert.equal(M.practiced(s,start+10000),10000);
 s=M.pause(s,start+15000);assert.equal(M.practiced(s,start+90000),15000);
 s=M.resume(s,start+90000);s=M.seek(s,1,start+95000);
 assert.equal(M.practiced(s,start+95000),20000);assert.equal(M.position(s,start+95000).index,1);
});
test('preparation and preparation after pause do not count toward practiced time',()=>{
 let s=M.start(M.routines[0],start+5000,'prep');assert.equal(M.elapsed(s,start+3000),0);assert.equal(M.practiced(s,start+3000),0);
 s=M.pause(s,start+15000);s=M.resume(s,start+20000);assert.equal(M.practiced(s,start+18000),10000);assert.equal(M.practiced(s,start+25000),15000);
});
test('finishing after a background delay only counts until the last step finishes',()=>{
 let s=M.start(M.routines[0],start,'background');s=M.seek(s,7,start+12000);
 assert.equal(M.practiced(s,start+300000),72000);assert.ok(M.position(s,start+300000).done);
 const restored=JSON.parse(JSON.stringify(M.pause(s,start+300000)));assert.equal(M.practiced(restored,start+400000),72000);
});
test('meditation rhythm supports legacy defaults and custom phase boundaries',()=>{
 const legacy=M.routines.find(r=>r.id==='water');assert.ok(M.routineValid(legacy));
 assert.equal(M.breathState(legacy,4).id,'exhale');assert.equal(M.breathState(legacy,10).id,'inhale');
 const r={...legacy,breathing:{inhale:3,holdIn:2,exhale:7,holdOut:1}};
 for(const [t,id,scale] of [[0,'inhale',.84],[3,'holdIn',1.07],[5,'exhale',1.07],[12,'holdOut',.84],[13,'inhale',.84]]){
  const p=M.breathState(r,t);assert.equal(p.id,id);assert.equal(p.total,13);assert.ok(Math.abs(p.scale-scale)<1e-9);
 }
 assert.equal(M.breathState({...r,breathing:{inhale:2,exhale:8}},2).id,'exhale');
});
test('meditation timings validate and survive persistence, merge and pause',()=>{
 const r={id:'custom-meditation',kind:'meditation',name:'Min rytm',seconds:720,guidance:'breath',breathing:{inhale:3,holdIn:2,exhale:7,holdOut:1}};
 assert.ok(M.routineValid(r));
 for(const value of [0,-1,31,NaN,1.5,'4'])assert.equal(M.routineValid({...r,breathing:{...r.breathing,inhale:value}}),false);
 assert.equal(M.routineValid({...r,breathing:{...r.breathing,holdOut:-1}}),false);
 assert.equal(M.routineValid({...r,breathing:null}),false);
 assert.equal(M.routineValid({...r,seconds:0}),false);
 const entry={id:r.id,type:'routine',routine:r,updatedAt:123};assert.deepEqual(M.merge({},JSON.parse(JSON.stringify({[r.id]:entry})))[r.id],entry);
 const saved=JSON.parse(JSON.stringify(M.pause(M.start(r,start,'session-custom'),start+9000)));
 assert.ok(M.activeValid(saved));assert.equal(M.position(saved,start+900000).spent,9);assert.deepEqual(saved.routine.breathing,r.breathing);
 assert.equal(M.breathState(saved.routine,M.position(saved,start+900000).spent).id,'exhale');
 const resumed=M.resume(saved,start+20000);assert.equal(M.position(resumed,start+23000).spent,12);
});
