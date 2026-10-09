const {test}=require('node:test');
const assert=require('node:assert/strict');
const L=require('../zen-stretch-library.js');
const M=require('../zen-model.js');
test('catalogue has at least 50 movement families and every choice has a valid animated rig',()=>{
 assert.ok(L.families.length>=50);assert.equal(new Set(L.poses.map(p=>p.id)).size,L.poses.length);
 for(const entry of L.poses){
  assert.ok(entry.name&&entry.cue&&entry.group);
  const a=L.frame(entry.id,0),b=L.frame(entry.id,2);
  assert.ok(a&&b,entry.id);assert.notDeepEqual(a,b,entry.id+' must animate');
  for(const t of [0,1.5,3,5]){const p=L.frame(entry.id,t);for(const point of [p.head,...p.torso,...p.arms.flat(),...p.legs.flat()])assert.ok(point.every(Number.isFinite),entry.id);}
  assert.deepEqual(L.frame(entry.id,0,true),L.frame(entry.id,4,true));
  assert.ok(M.routineValid({id:'check',name:'Check',kind:'stretch',steps:[{...entry,seconds:60}]}));
 }
});
test('mirrored variants move symmetrically and all saved default IDs remain supported',()=>{
 for(const e of L.poses.filter(p=>p.side==='left')){const left=L.frame(e.id,2),right=L.frame(e.id.replace(/-left$/,'-right'),2);assert.equal(left.head[0]+right.head[0],300);}
 for(const r of M.routines.filter(r=>r.kind==='stretch'))for(const s of r.steps)assert.ok(L.frame(s.id),s.id);
 assert.equal(L.frame('custom-unknown'),null);
});
