const test=require('node:test'),assert=require('node:assert/strict'),m=require('../training-strength-metrics.js');
const bw={name:'Armhävningar',kind:'strength',sets:3,reps:10,weightMode:'bodyweight',weight:999};
const kg={name:'Bänkpress',kind:'strength',sets:3,reps:10,weight:50};
test('only Markus bodyweight adds volume; personal mass never becomes a weight PR',()=>{
 const w={bodyweightKg:75,exercises:[bw,kg]};
 assert.deepEqual(m.workout(w,'markus'),{volume:3750,count:2,perExercise:1875});
 assert.equal(m.workout(w,'maja').volume,1500);assert.equal(m.exercise(bw,w,'markus').weight,0);
 const r=m.records([w],{Armhävningar:999},'markus');assert.equal(r.length,2);assert.equal(r.find(x=>x.bodyweight).value,10);
});
test('normalization counts only completed strength exercises',()=>{
 const w={exercises:[kg,{...kg,reps:0},{...kg,name:''},{name:'Löpning',kind:'cardio',distance:5,time:30}]};
 assert.deepEqual(m.workout(w,'markus'),{volume:1500,count:1,perExercise:1500});
 assert.equal(m.workout({exercises:[kg,kg]},'markus').perExercise,m.workout({exercises:[kg]},'markus').perExercise);
});
test('new workouts snapshot mass once; editing never changes historical values',()=>{
 const first=m.snapshot({id:1,exercises:[bw]},null,'markus',75);assert.equal(first.bodyweightKg,75);
 assert.equal(m.snapshot({...first},first,'markus',80).bodyweightKg,75);
 const old={id:2,exercises:[bw]};assert.equal(m.snapshot({...old},old,'markus',80).bodyweightKg,undefined);
 assert.equal(m.snapshot({exercises:[bw]},null,'maja',75).bodyweightKg,undefined);
 assert.equal(m.snapshot({exercises:[bw]},null,'markus',0).bodyweightKg,null);
});
test('set logs give accurate volume and best reps, and survive unrelated editing',()=>{
 const ex={...bw,logs:[{actualReps:8,actualWeight:999},{actualReps:12,actualWeight:999}]};
 const w={id:1,date:'2026-10-31',bodyweightKg:75,exercises:[ex]};assert.equal(m.workout(w,'markus').volume,1500);
 const r=m.records([w],{},'markus')[0];assert.equal(r.value,12);assert.equal(r.entries[0].volume,1500);
 const edit=m.snapshot({...w,exercises:[{...bw}]},w,'markus',80);assert.deepEqual(edit.exercises[0].logs,ex.logs);
 const changed=m.snapshot({...w,exercises:[{...bw,reps:20}]},w,'markus',80);assert.equal(changed.exercises[0].logs,undefined);
});
test('bodyweight and weighted history stay separate; manual PR does not invent chart points',()=>{
 const w={date:'2026-10-31',exercises:[bw,{...bw,weightMode:'kg',weight:10}]};
 const r=m.records([w],{Armhävningar:15,Marklyft:100},'markus');assert.equal(r.length,3);
 assert.equal(r.find(x=>x.key==='armhävningar|kg').value,15);assert.equal(r.find(x=>x.key==='armhävningar|bodyweight').value,10);
 assert.equal(r.find(x=>x.name==='Marklyft').entries.length,0);
});
