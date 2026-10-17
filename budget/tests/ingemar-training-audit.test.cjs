'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('budget/ingemar.html','utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function fn(name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);const next=source.indexOf('\nfunction ',start+1);return source.slice(start,next<0?source.length:next).split('\nvar ')[0];}
const deep=x=>JSON.parse(JSON.stringify(x));
function context(names,values={}){let serial=0;const c={deep,uid:()=>`id-${++serial}`,Set,Number,console,...values};vm.createContext(c);for(const name of names)vm.runInContext(fn(name),c);return c;}
const ex=(id='e',weight=50)=>({id,name:'Bänkpress',mode:'kg',sets:[{id:'s',weight,reps:8,minutes:0,done:true}]});
const workout=(name='Ben')=>({type:'Push',name,exercises:[ex()]});
const days=['Mån','Tis','Ons','Tor','Fre','Lör','Sön'];
const offset=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*864e5).toISOString().slice(0,10);

test('Copying an exercise gives independent IDs to exercise and sets',()=>{
 const draft={exercises:[ex()]};const c=context(['copyDraftExercise'],{draft,updateDraftFromBuilderInputs(){},renderBuilder(){},document:{querySelector(){return null;}}});
 c.copyDraftExercise(0);assert.equal(draft.exercises.length,2);assert.notEqual(draft.exercises[0].id,draft.exercises[1].id);assert.notEqual(draft.exercises[0].sets[0].id,draft.exercises[1].sets[0].id);
 draft.exercises[1].sets[0].weight=77.5;assert.equal(draft.exercises[0].sets[0].weight,50);
});
test('Old duplicate exercise/set IDs are repaired without losing contents',()=>{
 const w={exercises:[ex(),ex()]};w.exercises[0].sets.push({...w.exercises[0].sets[0],weight:65});
 const c=context(['normalizeWorkoutIds']);c.normalizeWorkoutIds(w);assert.equal(w.exercises.length,2);assert.equal(new Set(w.exercises.map(e=>e.id)).size,2);assert.equal(new Set(w.exercises[0].sets.map(s=>s.id)).size,2);assert.equal(w.exercises[0].sets[1].weight,65);
 const before=deep(w);c.normalizeWorkoutIds(w);assert.deepEqual(w,before);
});
test('A complete week template replaces old training days with its rest days and removes stale drafts',()=>{
 const state={builderDrafts:{}};for(let i=0;i<7;i++)state.builderDrafts[offset('2026-10-12',i)]=workout('Gammalt');
 const template={id:'t',days:[workout('Mall'),null,null,null,null,null,null]};
 const c=context(['applyWeekTemplate'],{state,DAYS:days,offset,weekPlannerMonday:'2026-10-12',weekDraft:Array.from({length:7},()=>workout('Gammalt')),weekTemplates:()=>[template],$:()=>({value:'t'}),weekPlanClone:x=>x?deep(x):null,renderWeekPlanner(){},toast(){}});
 c.applyWeekTemplate();assert.equal(c.weekDraft.filter(Boolean).length,1);assert.equal(c.weekDraft[0].name,'Mall');assert.equal(Object.keys(state.builderDrafts).length,0);
});
test('Copying to a day invalidates the old builder draft and swapping fixes draft dates',()=>{
 const monday='2026-10-12',tuesday=offset(monday,1),state={builderDrafts:{[monday]:{...workout('A'),date:monday},[tuesday]:{...workout('B'),date:tuesday}}};
 const c=context(['copyWeekDay','swapWeekDays'],{state,weekPlannerMonday:monday,weekDraft:[workout('A'),workout('B'),null,null,null,null,null],offset,weekPlanClone:x=>x?deep(x):null,renderWeekPlanner(){}});
 c.swapWeekDays(0,1);assert.equal(state.builderDrafts[monday].name,'B');assert.equal(state.builderDrafts[monday].date,monday);assert.equal(state.builderDrafts[tuesday].date,tuesday);
 c.copyWeekDay(0,1);assert.equal(state.builderDrafts[tuesday],undefined);assert.equal(c.weekDraft[1].name,'B');
});
test('Exercise reuse prefers the latest actual workout, including fractional weights',()=>{
 const c=context(['weekExercisePreset'],{state:{history:[{date:'2026-10-01',...workout(),exercises:[ex('a',42.5)]},{date:'2026-10-15',...workout(),exercises:[ex('b',57.25)]}],plans:{}},historyNewestFirst:(a,b)=>b.date.localeCompare(a.date),exerciseNameKey:s=>s.toLowerCase(),builderTemplates:()=>[],template:()=>[ex('default',20)]});
 const found=c.weekExercisePreset('Push','Bänkpress');assert.equal(found.sets[0].weight,57.25);assert.equal(found.sets[0].done,false);assert.equal(found.sets[0].skipped,false);
});
test('Statistics exclude skipped, undone, demo and timed sets and count bodyweight work',()=>{
 const w=workout();w.date='2026-10-16';w.exercises[0].sets=[{done:true,weight:0,reps:10},{done:true,weight:50,reps:8},{done:true,skipped:true,weight:200,reps:99},{done:false,weight:200,reps:99}];w.exercises.push({...ex('timed',200),mode:'min'});
 const c=context(['strengthSetsForWeek','strengthMetric'],{state:{history:[w,{...deep(w),demo:true}]},exerciseNameKey:s=>s.toLowerCase()});
 const week={start:'2026-10-12',end:'2026-10-19'};assert.equal(c.strengthMetric(week,'Push','','sets'),2);assert.equal(c.strengthMetric(week,'Push','','reps'),18);assert.equal(c.strengthMetric(week,'Push','','volume'),400);
});
test('Builder rejects blank/negative/out-of-range values and fractional repetitions but accepts fractional weights',()=>{
 const draft={...workout(),date:'2026-10-16'},messages=[];
 const c=context(['validateDraft'],{draft,validDay:()=>true,updateDraftFromBuilderInputs(){},rememberAllTypedExerciseNames(){},cleanExerciseName:s=>s.trim(),toast:s=>messages.push(s)});
 for(const bad of [null,-1,1000,Infinity]){draft.exercises[0].sets[0].weight=bad;assert.equal(c.validateDraft(),false);}
 draft.exercises[0].sets[0].weight=1.25;assert.equal(c.validateDraft(),true);draft.exercises[0].sets[0].reps=1.5;assert.equal(c.validateDraft(),false);
 draft.exercises[0].mode='min';draft.exercises[0].sets[0].reps=0;draft.exercises[0].sets[0].minutes=0;assert.equal(c.validateDraft(),false);draft.exercises[0].sets[0].minutes=.25;assert.equal(c.validateDraft(),true);
});
test('Invalid dates cannot silently save to the previous date',()=>{
 const c=context(['pad','dayISO','dayFrom','validDay']);assert.equal(c.validDay('2026-02-30'),false);assert.equal(c.validDay(''),false);assert.equal(c.validDay('2028-02-29'),true);
});
test('Changing builder date moves its draft and uses the destination base',()=>{
 const old='2026-10-12',date='2026-10-13',state={builderDrafts:{[old]:workout('Utkast')}};
 const c=context(['keepBuilderDraft'],{state,draft:{...workout(),date},builderDraftDate:old,window:{IngemarAccount:{canEdit:true}},validDay:()=>true,plan:()=>workout('Destination'),persist(){}});
 c.keepBuilderDraft();assert.equal(state.builderDrafts[old],undefined);assert.equal(state.builderDrafts[date].name,'Ben');assert.equal(c.builderBase.name,'Destination');
});
test('Unsaved log edits ask before closing and cancellation preserves the draft',()=>{
 let closes=0;const draft=workout();const c=context(['historyEditorDirty','closeHistoryEditor'],{historyEditDraft:draft,historyEditInitial:JSON.stringify(draft),$:()=>({open:true,close(){closes++;}}),confirm:()=>false,unlockBuilderBackground(){}});
 draft.name='Ny text';c.closeHistoryEditor();assert.equal(closes,0);assert.equal(c.historyEditDraft.name,'Ny text');c.closeHistoryEditor(true);assert.equal(closes,1);
});
test('Background stays locked while a nested training dialog is still open',()=>{
 let scrolled=false;const body={dataset:{builderOpen:'true'},style:{top:'-100px'}};
 const c=context(['unlockBuilderBackground'],{document:{body,querySelector:()=>({})},window:{scrollTo(){scrolled=true;}},builderScrollY:100});c.unlockBuilderBackground();assert.equal(body.dataset.builderOpen,'true');assert.equal(scrolled,false);
 c.document.querySelector=()=>null;c.unlockBuilderBackground();assert.equal(body.dataset.builderOpen,undefined);assert.equal(scrolled,true);
});
test('Concurrent different log fields survive saving an open editor',()=>{
 const window={};vm.runInNewContext(fs.readFileSync('budget/ingemar-account.js','utf8'),{window});
 const base={id:'log',date:'2026-10-16',...workout()},local=deep(base),remote=deep(base);local.name='Nytt namn';remote.exercises[0].sets[0].weight=77.5;
 const result=window.IngemarMerge({history:[base]},{history:[local]},{history:[remote]});assert.equal(result.history[0].name,'Nytt namn');assert.equal(result.history[0].exercises[0].sets[0].weight,77.5);
});
