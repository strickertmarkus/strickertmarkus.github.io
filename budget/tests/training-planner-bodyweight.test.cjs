const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
function runtime(profile='markus'){
 const data=new Map(),nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',dataset:{},textContent:'',innerHTML:'',scrollTop:0,classList:{add(){},remove(){},toggle(){}},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){},setAttribute(){}});return nodes.get(id);};
 const document={readyState:'loading',addEventListener(){},querySelectorAll(){return [];},querySelector(){return null;},getElementById:node};
 const ctx={document,localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},location:{search:profile==='maja'?'?user=maja':''},URLSearchParams,console,MutationObserver:class{observe(){} disconnect(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},Date,Event:function(){},CustomEvent:function(){}};
 ctx.window=ctx;ctx.__FIELD_EMBEDDED__=true;ctx.addEventListener=()=>{};
 const script=read('archive/exercise.html').match(/<script>\s*\/\/ ══ DATA[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,'');
 vm.createContext(ctx);vm.runInContext(script,ctx);vm.runInContext(read('training-month-planner.js'),ctx);
 for(const name of ['syncPlanWeekUI','pulsePlanRenderV2','refreshTypeSuggestions','renderWeekGrid','showToast'])ctx[name]=()=>{};
 ctx.planTargetMondayISO='2026-10-26';ctx.viewedMondayISO='2026-10-26';ctx.pulsePlanMonth='2026-10-01';ctx.pulsePlanSelected='2026-10-29';
 return {ctx,data,node};
}
const bw={kind:'strength',name:'Armhävningar',sets:3,reps:12,weightMode:'bodyweight',weight:90};
test('bodyweight survives editor parsing and normalization without entering kg volume',()=>{
 const {ctx}=runtime();const ex=ctx.normalizeExercise(bw);assert.equal(ex.weight,0);assert.equal(ex.weightMode,'bodyweight');assert.equal(ctx.calcVol({exercises:[bw]}),0);
 const row={querySelector(s){return s.endsWith('-name')?{value:'Armhävningar'}:s.endsWith('-kind')?{value:'strength'}:s.endsWith('-metric1')?{value:'3'}:s.endsWith('-metric2')?{value:'12'}:{value:'90',dataset:{weightMode:'bodyweight'}};}};
 const parsed=ctx.parseExerciseRow(row,'dw');assert.equal(parsed.weightMode,'bodyweight');assert.equal(parsed.weight,0);assert.equal(parsed.reps,12);assert.match(ctx.exerciseTargetText(parsed),/Kroppsvikt/);
 assert.equal(ctx.normalizeExercise({...bw,weightMode:'kg',weight:25}).weight,25);
});
test('month copy, cross-week swap and save preserve full sessions, and profiles stay separate',()=>{
 for(const profile of ['markus','maja']){
  const {ctx,data}=runtime(profile);ctx.DB.set('plan',Object.fromEntries(ctx.DAY_KEYS.map(k=>[k,'Vila'])));
  const session={type:'Helkropp',name:'Hemma',templateId:17,exercises:[ctx.normalizeExercise(bw)],custom:{rest:60}};
  ctx.savePlannedSessions({'2026-10-29':session});
  ctx.pulsePlanCopied={date:'2026-10-29',entry:ctx.pulsePlanCloneV2(ctx.pulsePlanEntryForDate('2026-10-29'))};
  ctx.planTargetMondayISO='2026-11-02';ctx.pulsePlanCopyV2To(2);
  ctx.pulsePlanSwapDates('2026-11-04','2026-11-09');ctx.savePlan();
  const saved=ctx.getPlannedSessions();assert.equal(saved['2026-10-29'].name,'Hemma');assert.equal(saved['2026-11-09'].templateId,17);assert.equal(saved['2026-11-09'].exercises[0].weightMode,'bodyweight');assert.equal(saved['2026-11-09'].custom.rest,60);assert.equal(saved['2026-11-04'],undefined);
  assert.equal(data.has(profile==='maja'?'ex_plannedSessions':'ex_plannedSessions_maja'),false);
 }
});
test('browsing months does not materialize or overwrite untouched weeks when saving',()=>{
 const {ctx,data}=runtime();ctx.savePlannedSessions({'2026-10-29':{type:'Helkropp',exercises:[bw]}});
 const before=JSON.stringify([...data]);
 for(let month=1;month<=12;month++)ctx.pulsePlanEntryForDate(`2027-${String(month).padStart(2,'0')}-01`);
 ctx.savePlan();assert.equal(JSON.stringify([...data]),before);
});
test('month navigation handles year boundaries and leap days, and renders complete weeks',()=>{
 const {ctx,node}=runtime();ctx.pulsePlanView='month';ctx.pulsePlanMonth='2026-12-01';ctx.shiftPlanTargetWeek(1);assert.equal(ctx.pulsePlanMonth,'2027-01-01');ctx.shiftPlanTargetWeek(-1);assert.equal(ctx.pulsePlanMonth,'2026-12-01');
 ctx.pulsePlanMonth='2028-02-01';ctx.pulsePlanRenderMonth();const html=node('plan-days').innerHTML;assert.match(html,/data-calendar-date="2028-02-29"/);assert.equal((html.match(/data-calendar-date=/g)||[]).length%7,0);
});
test('bodyweight is excluded from PR even with stale numeric or set-level weights',()=>{
 const source=read('exercise-log-pr-v52.js');const fn=source.slice(source.indexOf('  function collectWeights('),source.indexOf('  function getWorkoutsSafe('));const ctx={number:v=>Number(v)||0};vm.createContext(ctx);vm.runInContext(fn,ctx);
 assert.equal(ctx.collectWeights({...bw,actualWeight:100,logs:[{actualWeight:110}]}).length,0);
 assert.deepEqual(Array.from(ctx.collectWeights({weight:25,logs:[{weightMode:'bodyweight',actualWeight:100},{actualWeight:30}]})),[25,30]);
});
test('logged session keeps bodyweight and set repetitions',()=>{
 const {ctx}=runtime();ctx.stopSessionMode=()=>{};ctx.refreshAll=()=>{};
 ctx.sessionState={date:'2026-10-29',type:'Helkropp',passStartedAt:Date.now()-90000,exercises:[ctx.normalizeExercise(bw)],logs:[[{actualReps:12,actualWeight:0,durationSec:40,weightMode:'bodyweight'}]]};
 ctx.saveSessionWorkout();const ex=ctx.getWorkouts()[0].exercises[0];assert.equal(ex.weightMode,'bodyweight');assert.equal(ex.weight,0);assert.equal(ex.reps,12);
});

test('editing this week does not change the fallback plan for other months',()=>{
 const {ctx}=runtime();const initial=Object.fromEntries(ctx.DAY_KEYS.map(k=>[k,'Vila']));ctx.DB.set('plan',initial);
 ctx.setPlanForWeek(ctx.weekStartISO(),{...initial,thu:'Helkropp'});
 assert.equal(ctx.getPlan().thu,'Vila');assert.equal(ctx.getPlanForWeek(ctx.weekStartISO()).thu,'Helkropp');
});
