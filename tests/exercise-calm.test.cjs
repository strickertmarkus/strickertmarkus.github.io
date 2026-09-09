// Dependency-free integration tests for the actual page model and timer controller.
// Run: node --test tests/exercise-calm.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..', 'budget');
const html = fs.readFileSync(path.join(root, 'exercise.html'), 'utf8');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
function sourceFunction(source, name) {
  const match = new RegExp('^([ \\t]*)function ' + name + '\\(', 'm').exec(source);
  assert.ok(match, name + ' exists');
  const start = match.index + match[1].length;
  const firstEnd = source.indexOf('\n', start);
  const first = source.slice(start, firstEnd);
  if (first.endsWith('}')) return first;
  const end = new RegExp('^' + match[1] + '}', 'm').exec(source.slice(firstEnd));
  assert.ok(end, name + ' has closing brace');
  return source.slice(start, firstEnd + end.index + match[1].length + 1);
}
function loadFunctions(context, source, names) {
  names.forEach(name => vm.runInContext(sourceFunction(source, name), context));
}
function makeContext() {
  let now = 1_000_000;
  const fields = new Map();
  const field = id => {
    if (!fields.has(id)) fields.set(id, {value:'',textContent:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector(){return null;}});
    return fields.get(id);
  };
  const c = vm.createContext({console, Date:class extends Date {static now(){return now;}},
    sessionState:null, plans:{}, saved:[], document:{getElementById:field,querySelectorAll:()=>[]},
    renderSessionMode(){}, renderStable(){}, startSessionTimerLoop(){}, stopSessionTimerLoop(){},
    startUnifiedTimerLoop(){}, timerEnabledForDate(){return false;},
    unifiedPretimer:null, closeModal(){}, refreshTypeSuggestions(){},refreshAll(){},showToast(){},upsertVO2ForDate(){},
    getPlannedSessions(){return c.plans;},getWorkouts(){return c.saved;},saveWorkouts(w){c.saved=w;},
  });
  c.window=c;
  c.advance=ms=>{now+=ms;};
  loadFunctions(c,html,['isCalmExercise','isTimedExercise','exerciseKindLabel','normalizeExercise','calcVol','escHtml','fmtSec','formatCardioTime','canonicalWorkoutType','workoutKindSummary','isCardioWorkout','exerciseTargetText','isRunningLabel','workoutRunMetrics','buildExerciseEditorRowHtml','parseExerciseRow','startWorkoutSessionForDate','saveSessionWorkout','stopSessionMode']);
  vm.runInContext(html.match(/var EXERCISE_KINDS=.*;/)[0],c);
  const controller=read('exercise-hype-timer-layout-v1.js');
  loadFunctions(c,controller,['getState','currentExercise','beginSetRaw','startSetWithGate','startCurrentSetV46','consumeRestTransition','startNextSetV46','addExtraSetV46','finishCurrentExerciseV46','completeCurrentSetV46']);
  const runtime=read('exercise-session-runtime-core-v21.js');
  loadFunctions(c,runtime,['clearPauseState','toggleCardioPause']);
  c.renderPauseState=()=>{};
  return c;
}
function plan(c,exercises) {
  c.plans['2026-09-09']={type:'Övrigt',exercises};
  c.startWorkoutSessionForDate('2026-09-09');
  return c.sessionState;
}
function plain(value){return JSON.parse(JSON.stringify(value));}
test('all modified JavaScript and every inline page script parse',()=>{
  for(const file of fs.readdirSync(root).filter(n=>n.startsWith('exercise-')&&n.endsWith('.js'))){
    assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
  }
  for(const file of ['auth-config.js','auth-gate.js'])new vm.Script(read(file),{filename:file});
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(match[1].trim())new vm.Script(match[1]);
});
test('normalization round-trips all four kinds, guides and breathing choice',()=>{
  const c=makeContext();
  const input=[{kind:'stretch',name:'Höft',time:.5,guide:'Ta det lugnt',breathing:'off'},{kind:'meditation',name:'Stillhet',time:5,guide:'Min text',breathing:'gentle'},{kind:'strength',name:'Press',sets:3,reps:8,weight:30},{kind:'cardio',name:'Löpning',distance:5,time:30}];
  input.forEach(ex=>assert.deepEqual(plain(c.normalizeExercise(c.normalizeExercise(ex))),ex));
  assert.equal(c.normalizeExercise({kind:'meditation',time:NaN}).time,5);
  assert.equal(c.exerciseTargetText(input[0]),'Stretch · 00:30');
});
test('builder uses the same four kinds in planner, manual log and single exercise editor',()=>{
  const c=makeContext();
  for(const prefix of ['dw','ex','single'])for(const kind of ['strength','cardio','stretch','meditation']){
    const markup=c.buildExerciseEditorRowHtml(prefix,{kind,name:'Test " < >',time:.5,guide:'A " B'},'void 0');
    assert.equal((markup.match(/class="ex-kind-btn/g)||[]).length,4);
    assert.ok(markup.includes('Test &quot; &lt; &gt;'));
    assert.ok(markup.includes('value="'+kind+'"'));
    const values={['.'+prefix+'-name']:'Test',['.'+prefix+'-kind']:kind,['.'+prefix+'-metric1']:'2',['.'+prefix+'-metric2']:'.5',['.'+prefix+'-metric3']:'4','.calm-guide':'A " B','.calm-breathing':'off'};
    const row={querySelector:selector=>({value:values[selector]})};
    const parsed=c.parseExerciseRow(row,prefix);
    assert.equal(parsed.kind,kind);
    if(c.isCalmExercise(parsed)){assert.equal(parsed.time,.5);assert.equal(parsed.breathing,'off');assert.equal(parsed.guide,'A " B');assert.equal(parsed.weight,undefined);}
  }
});
test('mixed session preserves order, times and kind through start, pause, completion and save',()=>{
  const c=makeContext();
  const s=plan(c,[{kind:'stretch',name:'Före',time:.5},{kind:'strength',name:'Press',sets:1,reps:8,weight:30},{kind:'cardio',name:'Löpning',time:1,distance:.2},{kind:'meditation',name:'Efter',time:2,breathing:'off',guide:'Stillhet'}]);
  assert.deepEqual(plain(s.exercises.map(ex=>ex.kind)),['stretch','strength','cardio','meditation']);
  c.startCurrentSetV46();c.advance(10000);c.toggleCardioPause();c.advance(30000);c.toggleCardioPause();c.advance(20000);c.completeCurrentSetV46();
  assert.equal(s.logs[0][0].durationSec,30);assert.equal(s.logs[0][0].actualTime,.5);
  c.completeCurrentSetV46();assert.equal(s.logs[0].length,1);
  c.finishCurrentExerciseV46();assert.equal(s.exerciseIndex,1);
  c.startCurrentSetV46();c.advance(20000);c.completeCurrentSetV46();c.finishCurrentExerciseV46();
  c.startCurrentSetV46();c.advance(60000);c.completeCurrentSetV46();c.finishCurrentExerciseV46();
  c.startCurrentSetV46();c.advance(40000);c.completeCurrentSetV46();c.finishCurrentExerciseV46();
  c.saveSessionWorkout();
  const wk=c.saved[0];
  assert.deepEqual(plain(wk.exercises.map(ex=>ex.kind)),['stretch','strength','cardio','meditation']);
  assert.equal(wk.exercises[3].time,40/60);assert.equal(wk.exercises[3].guide,'Stillhet');
  assert.equal(wk.exercises[3].breathing,'off');assert.equal(wk.exerciseTimings[3].durationSec,40);
  assert.equal(c.calcVol(wk),240);assert.equal(c.workoutRunMetrics(wk).distance,.2);
  assert.equal(c.sessionState,null);
});
test('background completion records the target duration once, and separate calm workouts save correctly',()=>{
  const c=makeContext();
  for(const kind of ['stretch','meditation']){
    const s=plan(c,[{kind,name:'Eget pass',time:1}]);
    c.startCurrentSetV46();s.__calmTimerEnd=s.setStartedAt+60000;c.advance(180000);c.completeCurrentSetV46();c.completeCurrentSetV46();
    assert.equal(s.logs[0].length,1);assert.equal(s.logs[0][0].durationSec,60);
    delete s.__calmTimerEnd;c.finishCurrentExerciseV46();c.saveSessionWorkout();
    const wk=c.saved.at(-1);assert.equal(wk.type,kind==='stretch'?'Stretch':'Meditation');assert.equal(c.calcVol(wk),0);assert.equal(c.workoutRunMetrics(wk).distance,0);assert.equal(c.isCardioWorkout(wk),false);
  }
});
test('pause then finish and extra rounds use elapsed active time',()=>{
  const c=makeContext(),s=plan(c,[{kind:'stretch',name:'Stretch',time:1}]);
  c.startCurrentSetV46();c.advance(12000);c.toggleCardioPause();c.advance(90000);c.completeCurrentSetV46();
  assert.equal(s.logs[0][0].durationSec,12);
  c.addExtraSetV46();assert.equal(s.currentSet,2);assert.equal(s.exercises[0].plannedSets,2);assert.equal(s.setRunning,true);
  c.advance(10000);c.completeCurrentSetV46();assert.equal(s.logs[0][1].durationSec,10);
});
test('canonical progress retains calm kinds and only advances completed moments',()=>{
  const c=makeContext();
  c.localStorage={getItem:()=>null};
  loadFunctions(c,read('exercise-progress-consistency-v10.js'),['getStoredPlan','normalizeBetween','customKey','runtimeFor','baseExercise','baseLogs','buildCanonicalPlan']);
  const s=plan(c,[{kind:'stretch',name:'Före',time:1},{kind:'strength',name:'Press',sets:3,reps:8},{kind:'meditation',name:'Efter',time:5}]);
  assert.deepEqual(plain(c.buildCanonicalPlan(s).map(x=>x.kind)),['stretch','strength','strength','strength','meditation']);
});
test('calm timer expires automatically, pauses safely and does not complete twice',()=>{
  const c=makeContext();
  const fields=c.document;
  const old=fields.getElementById;
  fields.getElementById=id=>{const el=old(id);el.style={setProperty(){}};el.getAttribute=()=>null;return el;};
  c.focus={style:{setProperty(){}},getAttribute(){},setAttribute(){}};c.reduced={matches:false};
  c.completeCurrentSet=c.completeCurrentSetV46;
  loadFunctions(c,read('exercise-calm-v1.js'),['state','current','isCalm','text','attr','secondsLabel','tick']);
  const s=plan(c,[{kind:'meditation',name:'Stillhet',time:1}]);
  c.startCurrentSetV46();c.advance(20000);c.toggleCardioPause();c.advance(180000);c.tick(c.Date.now());
  assert.equal(s.logs[0].length,0);assert.equal(old('calm-phase').textContent,'Pausad');
  c.toggleCardioPause();c.advance(40000);c.tick(c.Date.now());c.tick(c.Date.now()+1000);
  assert.equal(s.logs[0].length,1);assert.equal(s.logs[0][0].durationSec,60);assert.equal(s.awaitingDecision,true);assert.equal(s.exerciseIndex,0);
  assert.equal(old('calm-phase').textContent,'Moment klart');
});
