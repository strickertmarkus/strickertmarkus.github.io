const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../training-pulse-field.js'),'utf8');
const scope={};vm.createContext(scope);
const start=source.indexOf('  function normalizeExercise('),end=source.indexOf('  function workoutType(');
vm.runInContext('function number(v){return Number(v)||0;}\n'+source.slice(start,end),scope);
const metrics=w=>JSON.parse(JSON.stringify(scope.workoutRunningMetrics(w)));
const row=(name,distance,time)=>({kind:'cardio',name,distance,time});
test('running under Kondition is included; other cardio is excluded even with stale run fields',()=>{
 for(const name of ['Löpning','Jogging','Löpband','Running'])assert.deepEqual(metrics({type:'Kondition',exercises:[row(name,5,30)]}),{distance:5,time:30,pace:6});
 for(const name of ['Cykling','Crosstrainer','Roddmaskin','Promenad'])assert.deepEqual(metrics({type:'Löpning',runDistance:40,runTime:60,exercises:[row(name,40,60)]}),{distance:0,time:0,pace:0});
});
test('mixed workouts use only running distances and times, not pass totals or pace',()=>{
 assert.deepEqual(metrics({type:'Kondition',runDistance:25,runTime:90,avgPaceKm:3.6,exercises:[row('Löpning',5,30),row('Cykling',20,60)]}),{distance:5,time:30,pace:6});
 assert.deepEqual(metrics({type:'Kondition',avgPaceKm:3,exercises:[row('Löpning',5,0),row('Cykling',20,60)]}),{distance:5,time:0,pace:0});
});
test('old dedicated running metrics survive, but cycling logs without rows do not enter',()=>{
 assert.deepEqual(metrics({type:'Kondition',runDistance:5,runTime:25}),{distance:5,time:25,pace:5});
 assert.deepEqual(metrics({type:'Cykling',runDistance:20,runTime:60}),{distance:0,time:0,pace:0});
});
test('distance without time remains in totals but does not produce a chart pace',()=>{
 assert.deepEqual(metrics({exercises:[row('Löpning',5,0)]}),{distance:5,time:0,pace:0});
 assert.equal(metrics({exercises:[row('Löpning',3,15),row('Jogging',2,0)]}).pace,0);
});
test('graph and running summaries use running metrics; general distance remains available',()=>{
 assert.match(source,/var run=workoutRunningMetrics\(w\)/);
 assert.match(source,/workoutRunningMetrics\(workout\)\.distance/);
 assert.match(source,/workoutRunningMetrics\(workout\)\.time/);
 assert.equal(scope.workoutDistance({exercises:[row('Cykling',20,60)]}),20);
});
