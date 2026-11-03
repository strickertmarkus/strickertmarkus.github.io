const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const archive=read('archive/exercise.html');
const field=read('training-pulse-field.js');

function extract(source,begin,end){const a=source.indexOf(begin),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,begin);return source.slice(a,b);}

function fakePlanner(){
 let store={'2026-11-03':{
   type:'Bröst + Triceps',name:'Pass 1',
   exercises:[{name:'Bänkpress',kind:'strength',sets:3,reps:8,weight:40}]
 }};
 let active='extra-1',form={type:'Rygg + Biceps',name:'Pass 2',exercise:'Rodd'},weeks=0,writes=0;
 const elements={
   'day-workout-modal':{dataset:{date:'2026-11-03'}},
   'day-workout-type':{get value(){return form.type;}},
   'day-workout-name':{get value(){return form.name;}},
   'day-workout-date':{value:'2026-11-03'},
   'day-workout-template-select':{value:''}
 };
 const ctx={
   window:{},document:{
     getElementById:id=>elements[id],
     querySelectorAll:()=>[{exercise:form.exercise}]
   },byId:id=>elements[id],
   getPlannedSessions:()=>store,savePlannedSessions:next=>{store=next;writes++;},
   parseExerciseRow:row=>({kind:'strength',name:row.exercise,sets:2,reps:10,weight:0}),
   pulseExtraCurrentV1:()=>active,
   pulseExtraListV1:day=>day&&Array.isArray(day.additionalSessions)?day.additionalSessions:[],
   pulseExtraDraftsV1:{},mondayISOOf:()=> '2026-11-02',
   dayKeyFromISO:()=> 'tue',getPlanForWeek:()=>({tue:'Bröst + Triceps'}),
   setPlanForWeek:()=>weeks++,refreshTypeSuggestions:()=>{},renderWeekGrid:()=>{},
   closeModal:()=>{},showToast:()=>{},pulsePlanBuilderReturnV3:null
 };
 vm.runInNewContext(extract(archive,'function persistDayWorkoutPlan(opts){','/* "Vilodag" in the day builder:')+
  '\nthis.persist=persistDayWorkoutPlan;',ctx);
 return {ctx,store:()=>store,form,active:id=>active=id,writes:()=>writes,weeks:()=>weeks};
}
test('second same-day workout saves to additionalSessions; primary and its week type stay intact',()=>{
 const harness=fakePlanner(),{ctx}=harness;
 assert.equal(ctx.persist({startAfterSave:false}),true);
 const plan=harness.store()['2026-11-03'];
 assert.equal(plan.name,'Pass 1');
 assert.equal(plan.exercises[0].name,'Bänkpress');
 assert.equal(plan.additionalSessions.length,1);
 assert.equal(plan.additionalSessions[0].name,'Pass 2');
 assert.equal(plan.additionalSessions[0].exercises[0].name,'Rodd');
 assert.equal(harness.weeks(),0);
 assert.equal(harness.writes(),1);
});
test('editing first and second independently keeps both; second save never duplicates by id',()=>{
 const h=fakePlanner();
 h.ctx.persist({startAfterSave:false});
 h.active('');h.form.name='Pass 1 uppdaterat';h.form.exercise='Armhävningar';
 h.ctx.persist({startAfterSave:false});
 h.active('extra-1');h.form.name='Pass 2 uppdaterat';h.form.exercise='Latsdrag';
 h.ctx.persist({startAfterSave:false});
 const plan=h.store()['2026-11-03'];
 assert.equal(plan.name,'Pass 1 uppdaterat');
 assert.equal(plan.additionalSessions.length,1);
 assert.equal(plan.additionalSessions[0].name,'Pass 2 uppdaterat');
 assert.equal(plan.additionalSessions[0].exercises[0].name,'Latsdrag');
 assert.equal(h.weeks(),1);
});
test('session mode can start primary or selected additional programme independently',()=>{
 const a=extract(archive,'function startWorkoutSessionForDate(iso,extraId){','function startSessionTimerLoop(){');
 const plan={
   '2026-11-03':{name:'Pass 1',type:'Bröst + Triceps',exercises:[{name:'Bänkpress',kind:'strength',sets:3,reps:8}],
     additionalSessions:[{id:'extra-1',name:'Pass 2',type:'Rygg + Biceps',exercises:[{name:'Rodd',kind:'strength',sets:2,reps:10}]}]
   }
 };
 const ctx={
   window:{__FIELD_EMBEDDED__:false},sessionState:null,
   getPlannedSessions:()=>plan,pulseExtraListV1:day=>day.additionalSessions||[],
   closeModal(){},normalizeExercise:e=>e,
   document:{getElementById:()=>({value:'',classList:{add(){},remove(){}}})},
   renderSessionMode(){},startSessionTimerLoop(){},showToast(){}
 };
 vm.runInNewContext(a+'\nthis.start=startWorkoutSessionForDate;',ctx);
 ctx.start('2026-11-03','extra-1');
 assert.equal(ctx.sessionState.name,'Pass 2');
 assert.equal(ctx.sessionState.sourceExtraId,'extra-1');
 assert.equal(ctx.sessionState.exercises[0].name,'Rodd');
 ctx.start('2026-11-03');
 assert.equal(ctx.sessionState.name,'Pass 1');
 assert.equal(ctx.sessionState.exercises[0].name,'Bänkpress');
});
test('Zen history distinguishes stretch, meditation, deleted sessions and profile scope',()=>{
 const start=field.indexOf('  function zenKindsByDate(){'),end=field.indexOf('  var zenKindsCache=null',start);
 assert.ok(start>0&&end>start);
 const t=new Date(2026,10,3,12).getTime();
 const entries={
   A:{id:'A',type:'session',kind:'stretch',completedAt:t},
   B:{id:'B',type:'session',kind:'meditation',completedAt:t+1000},
   C:{id:'C',type:'session',kind:'stretch',completedAt:t+2000},
   D:{id:'D',type:'session',kind:'meditation',completedAt:t+3000,deleted:true}
 };
 const data={'zen_v1_test_markus_entries':JSON.stringify(entries),
   'zen_v1_test_maja_entries':JSON.stringify({M:{id:'M',type:'session',kind:'stretch',completedAt:t}})};
 const ctx={
   cloudZenEntries:null,window:{},profile:'markus',isoDate:d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),
   localStorage:{get length(){return Object.keys(data).length;},key:i=>Object.keys(data)[i],getItem:k=>data[k]}
 };
 vm.runInNewContext(field.slice(start,end)+'\nthis.counts=zenKindsByDate;',ctx);
 const result=ctx.counts();
 assert.equal(result['2026-11-03'].stretch,2);
 assert.equal(result['2026-11-03'].meditation,1);
 ctx.cloudZenEntries={...entries,C:{...entries.C,deleted:true}};
 assert.equal(ctx.counts()['2026-11-03'].stretch,1,'cloud tombstones suppress stale local session');
});
test('orbit and 8-week rhythm add recovery without changing /4 session count',()=>{
 const a=field.indexOf('  function rhythmOrbit(week,goal,zenDays){'),b=field.indexOf('  function renderRhythm() {',a);
 assert.ok(a>0&&b>a);
 const start=new Date(2026,10,2,12);
 const ctx={
   startOfWeek:()=>start,
   shiftDate:(d,i)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+i,12),
   isoDate:d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),
   number:Number,workoutKind:()=> 'strength'
 };
 vm.runInNewContext(field.slice(a,b)+'\nthis.orbit=rhythmOrbit;',ctx);
 const svg=ctx.orbit([{id:1,date:'2026-11-03',type:'Styrka'}],4,{'2026-11-03':{stretch:2,meditation:1}});
 assert.equal((svg.match(/class="ro-arc"/g)||[]).length,1);
 assert.equal((svg.match(/class="ro-empty"/g)||[]).length,3);
 assert.match(svg,/ro-zen-stretch/);assert.match(svg,/ro-zen-meditation/);
 assert.match(svg,/#b8e99b/);assert.match(svg,/#f5d58c/);
 assert.match(field,/rm-zen-dot is-stretch/);
 assert.match(field,/rm-zen-dot is-meditation/);
});
test('view exposes add and edit actions and does not create new Firebase keys',()=>{
 const home=read('exercise.html'),editor=read('training-pulse-editor.js'),css=read('training-pulse-field.css');
 assert.match(home,/week-selected-extras-v1/);
 assert.match(home,/rhythm-zen-facts/);
 assert.match(editor,/case 'addPass'/);
 assert.match(editor,/case 'editExtra'/);
 assert.match(editor,/case 'startExtra'/);
 assert.match(css,/\.ro-zen-track|\.rhythm-orbit-svg \.ro-zen-track/);
 assert.match(css,/\.week-extra-item/);
 assert.match(archive,/pulseExtraListV1/);
 assert.match(archive,/training-multipass-v1\.css/);
 assert.ok(!archive.includes('ex_plannedAdditional'));
});


test('four recovery arcs align precisely with the four main training segments',()=>{
 const a=field.indexOf('  function rhythmOrbit(week,goal,zenDays){'),b=field.indexOf('  function renderRhythm() {',a);
 assert.ok(a>0&&b>a);
 const monday=new Date(2026,10,2,12);
 const day=(d)=>new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+d,12);
 const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const ctx={startOfWeek:()=>monday,shiftDate:(d,i)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+i,12),
   isoDate:iso,number:Number,workoutKind:()=> 'strength'};
 vm.runInNewContext(field.slice(a,b)+'\nthis.orbit=rhythmOrbit;',ctx);
 const svg=ctx.orbit([{id:1,date:iso(day(1)),type:'Styrka'}],4,
   {[iso(day(1))]:{stretch:2,meditation:1},[iso(day(3))]:{stretch:1,meditation:0}});
 const inner=name=>svg.match(new RegExp('<g class="ro-zen-track ro-zen-'+name+'">([\\s\\S]*?)<\\/g>'))[1];
 const stretch=inner('stretch'),meditation=inner('meditation');
 assert.equal((stretch.match(/class="ro-zen-segment/g)||[]).length,4);
 assert.equal((meditation.match(/class="ro-zen-segment/g)||[]).length,4);
 assert.equal((stretch.match(/class="ro-zen-lit"/g)||[]).length,3);
 assert.equal((meditation.match(/class="ro-zen-lit"/g)||[]).length,1);
 assert.equal((svg.match(/class="ro-arc"/g)||[]).length,1);
 const main=svg.match(/class="ro-arc" d="([^"]+)"/)[1];
 const outer=stretch.match(/data-slot="0" d="([^"]+)"/)[1];
 const angle=str=>{
   const m=str.match(/^M ([\d.-]+) ([\d.-]+)/);
   return Math.atan2(Number(m[2])-60,Number(m[1])-60);
 };
 assert.ok(Math.abs(angle(main)-angle(outer))<.001,'First segment start angle must align');
 const capped=ctx.orbit([],4,{[iso(day(1))]:{stretch:7,meditation:5}});
 assert.equal((capped.match(/class="ro-zen-lit"/g)||[]).length,8,'Full tracks never create a fifth segment');
});

test('rhythm map shows a full dot for Zen-only days and a pip alongside strength/cardio',()=>{
 const a=field.indexOf('  function renderActivity() {'),b=field.indexOf('  function chartRangeStart() {',a);
 assert.ok(a>0&&b>a);
 const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const shift=(d,i)=>{const result=new Date(d);result.setDate(result.getDate()+i);return result;};
 const monday=shift(new Date(),-((new Date().getDay()+6)%7)-7);
 const days=[0,1,2,3].map(i=>iso(shift(monday,i)));
 const today=iso(new Date());
 const zen={
   [days[0]]:{stretch:1,meditation:0},
   [days[1]]:{stretch:0,meditation:1},
   [days[2]]:{stretch:1,meditation:1},
   [days[3]]:{stretch:2,meditation:0},
   [today]:{stretch:1,meditation:0}
 };
 const workouts={[days[3]]:[{id:1,date:days[3],type:'Styrka',duration:30}]};
 const chart={innerHTML:'',setAttribute(){}};
 const elements={'activity-total':{},'activity-unit':{},'activity-caption':{},'activity-chart':chart};
 const ctx={
   data:{goals:{weeklyWk:4}},byId:id=>elements[id],
   isoDate:iso,shiftDate:shift,startOfWeek:d=>shift(d,-((d.getDay()+6)%7)),
   zenKindsSnapshot:()=>zen,workoutsOn:d=>workouts[iso(d)]||[],
   workoutKind:()=> 'strength',workoutType:()=> 'Styrka',
   number:Number,formatNumber:String,weekNumber:()=>44,
   dayNames:['Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag','Söndag'],
   shortDate:iso,planForDate:d=>iso(d)===today?{type:'Styrka',name:'Planerat'}:null,
   chartTipAttrs:title=>' data-test="'+title.slice(title.lastIndexOf(' ')+1)+'" '
 };
 vm.runInNewContext(field.slice(a,b)+'\nthis.render=renderActivity;',ctx);
 ctx.render();
 function cell(key){
   const m=chart.innerHTML.match(new RegExp('<span class="([^"]+)"[^>]*data-test="'+key+'"[^>]*>([\\s\\S]*?)<\\/span>'));
   assert.ok(m,'missing cell '+key);
   return {classes:m[1],markup:m[2]};
 }
 const stretch=cell(days[0]),meditation=cell(days[1]),both=cell(days[2]),mixed=cell(days[3]),planned=cell(today);
 assert.match(stretch.classes,/is-pass is-zen-only/);
 assert.doesNotMatch(stretch.markup,/rm-zen-dot/);
 assert.match(meditation.classes,/is-pass is-zen-only/);
 assert.doesNotMatch(meditation.markup,/rm-zen-dot/);
 assert.match(both.classes,/is-zen-mixed/);
 assert.doesNotMatch(both.markup,/rm-zen-dot/);
 assert.doesNotMatch(mixed.classes,/is-zen-only/);
 assert.match(mixed.markup,/rm-zen-dot is-stretch/);
 assert.match(planned.classes,/is-zen-only/);
 assert.doesNotMatch(planned.classes,/is-planned/);
 assert.equal(elements['activity-total'].textContent,'1','Zen sessions do not count toward workout goal');
 const css=read('training-pulse-field.css');
 assert.match(css,/\.rm-cell\.is-zen-only>i/);
 assert.match(css,/\.rm-cell\.is-zen-only\.is-zen-mixed>i/);
});
