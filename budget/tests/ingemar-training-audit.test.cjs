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
 const draft={exercises:[ex()]},builderExpandedCardIds=new Set(['e']);const c=context(['focusBuilderCard','copyDraftExercise'],{draft,builderExpandedCardIds,updateDraftFromBuilderInputs(){},renderBuilder(){},document:{querySelector(){return null;}}});
 c.copyDraftExercise(0);assert.equal(draft.exercises.length,2);assert.notEqual(draft.exercises[0].id,draft.exercises[1].id);assert.notEqual(draft.exercises[0].sets[0].id,draft.exercises[1].sets[0].id);
 assert.deepEqual([...builderExpandedCardIds],[draft.exercises[1].id],'Duplicated exercise becomes the only expanded card');
 draft.exercises[1].sets[0].weight=77.5;assert.equal(draft.exercises[0].sets[0].weight,50);
});
test('Collapsible exercise cards keep all workout data and support multiple open cards',()=>{
 const draft={exercises:[ex('e1',40),ex('e2',50)]};
 const c=context(['builderExerciseSummary','syncBuilderCardExpansion','focusBuilderCard'],{draft,builderCardDraftRef:null,builderExpandedCardIds:new Set()});
 c.syncBuilderCardExpansion();assert.deepEqual([...c.builderExpandedCardIds],[],'All exercises should initially be collapsed');
 c.focusBuilderCard('e2',false);assert.deepEqual([...c.builderExpandedCardIds],['e2']);
 assert.equal(c.builderExerciseSummary(draft.exercises[0]),'1 set · 40 kg · 8 reps');
 const before=deep(draft);c.builderExpandedCardIds.delete('e1');assert.deepEqual(draft,before,'Only UI state changes when a card collapses');
});
test('Week planner preserves the chosen template association',()=>{
 const c=context(['weekPlanClone'],{normalizeBetweenOption:x=>x||{enabled:false,type:'none'}});
 const day={...workout('Mallpass'),templateId:'template-1'};
 const cloned=c.weekPlanClone(day);assert.equal(cloned.templateId,'template-1');assert.deepEqual(deep(cloned.exercises),day.exercises);
});
test('Day builder recognizes explicit and unchanged legacy templates, never guesses at edited matches',()=>{
 const template={id:'template-1',...workout('Bröst och triceps')};
 const c=context(['matchingBuilderTemplateId'],{builderTemplates:()=>[template]});
 const legacy=workout('Bröst och triceps');
 assert.equal(c.matchingBuilderTemplateId(legacy),'template-1','Exact legacy template is recognized');
 assert.equal(c.matchingBuilderTemplateId({...legacy,templateId:'template-1'}),'template-1','Explicit saved association is preserved');
 assert.equal(c.matchingBuilderTemplateId({...legacy,templateId:''}),'','An intentionally unlinked day is not matched again');
 assert.equal(c.matchingBuilderTemplateId({...legacy,name:'Eget pass'}),'','Different name is not mistaken for a template');
 const changed=deep(legacy);changed.exercises[0].sets[0].weight=77;
 assert.equal(c.matchingBuilderTemplateId(changed),'','Edited legacy workout is not matched by guesswork');
});

test('New template names are edited in the picker; existing template/day names keep their pencils',()=>{
 assert.ok(html.includes('id="builder-pass-inline"'),'Day pass name should be displayed in builder header');
 assert.ok(html.includes('data-action="rename-day-pass"'),'Day pass should have an edit pencil');
 assert.ok(html.includes('data-action="rename-template"'),'Existing templates still have an edit pencil');
 assert.ok(html.includes('id="builder-template-name"'),'New template name must be a direct inline input');
 assert.ok(html.includes("var canRename=isTemplate?!!builderTemplateId"),'New templates should not require an edit pencil');
 assert.ok(html.includes('dayEditing&&selectedTemplate'),'Selected templates must expose a pencil even in day-builder mode');
 assert.ok(!html.includes('id="build-name"'),'Legacy always-visible pass-name input must not exist');
});
test('Renaming a saved template updates only linked plans and both template dropdown and week uses',()=>{
 const template={id:'tpl',type:'Push',name:'Push · Fokus',exercises:[ex('e',50)]};
 const linked={...workout('Push · Fokus'),templateId:'tpl'};
 const legacy=workout('Push · Fokus');
 const independent={...workout('Push · Fokus'),templateId:''};
 const renamedCustom={...workout('Eget namn'),templateId:'tpl'};
 const state={templates:[template],plans:{a:linked,b:legacy,c:independent,d:renamedCustom},builderDrafts:{e:deep(linked)},weekTemplates:[{days:[deep(linked),deep(renamedCustom)]}]};
 const draft=deep(linked),weekDraft=[deep(linked)],weekBase=[deep(linked)];let saved=0;
 const c=context(['matchingBuilderTemplateId','renameStoredBuilderTemplate'],{
  state,builderTemplates:()=>state.templates,draft,weekDraft,weekBase,builderDayDraft:null,builderTemplateDraft:null,builderTemplateDraftId:'',persist(){saved++;return true;}
 });
 assert.equal(c.renameStoredBuilderTemplate('tpl','Push · Styrka'),true);
 assert.equal(template.name,'Push · Styrka');assert.equal(linked.name,'Push · Styrka');
 assert.equal(legacy.name,'Push · Styrka');assert.equal(legacy.templateId,'tpl');
 assert.equal(independent.name,'Push · Fokus','Explicitly independent day must not change');
 assert.equal(renamedCustom.name,'Eget namn','Custom-named linked plan stays independent');
 assert.equal(state.builderDrafts.e.name,'Push · Styrka');
 assert.equal(state.weekTemplates[0].days[0].name,'Push · Styrka');
 assert.equal(state.weekTemplates[0].days[1].name,'Eget namn');
 assert.equal(weekDraft[0].name,'Push · Styrka');assert.equal(weekBase[0].name,'Push · Styrka');
 assert.equal(draft.name,'Push · Styrka');assert.equal(saved,1);
});
test('Renaming a template restores original names if Firebase cannot save',()=>{
 const template={id:'tpl',type:'Push',name:'Gammalt',exercises:[ex()]},linked={...workout('Gammalt'),templateId:'tpl'};
 const state={templates:[template],plans:{a:linked},builderDrafts:{},weekTemplates:[]};
 const c=context(['matchingBuilderTemplateId','renameStoredBuilderTemplate'],{
  state,builderTemplates:()=>state.templates,draft:null,weekDraft:null,weekBase:null,builderDayDraft:null,builderTemplateDraft:null,builderTemplateDraftId:'',persist:()=>false
 });
 assert.equal(c.renameStoredBuilderTemplate('tpl','Nytt'),false);
 assert.equal(template.name,'Gammalt');assert.equal(linked.name,'Gammalt');assert.equal(linked.templateId,'tpl');
});
test('A day-pass rename updates the selected template without changing exercises',()=>{
 const template={id:'t',...workout('Push')},draft={...workout('Push'),templateId:'t'};
 const state={templates:[template],plans:{today:{...workout('Push'),templateId:'t'}},builderDrafts:{},weekTemplates:[]};
 let persisted=0,kept=0;
 const c=context(['matchingBuilderTemplateId','renameStoredBuilderTemplate','saveRenamedBuilderDay'],{
  state,builderTemplates:()=>state.templates,draft,builderMode:'day',builderDayRenaming:true,
  weekDraft:null,weekBase:null,builderDayDraft:null,builderTemplateDraft:null,builderTemplateDraftId:'',
  $:()=>({value:'Push + extra'}),persist:()=>{persisted++;return true;},keepBuilderDraft(){kept++;},
  renderBuilderTemplates(){},render(){},toast(){}
 });
 c.saveRenamedBuilderDay();
 assert.equal(template.name,'Push + extra');assert.equal(draft.name,'Push + extra');
 assert.equal(state.plans.today.name,'Push + extra');assert.equal(state.plans.today.exercises[0].sets[0].weight,50);
 assert.equal(kept,1);assert.equal(persisted,1);
});
test('Renaming a standalone saved day updates the week and hero source immediately',()=>{
 const saved=workout('Push · Fokus'),draft=deep(saved),state={plans:{'2026-10-22':saved},templates:[],builderDrafts:{},weekTemplates:[]};
 let persistCalls=0;
 const c=context(['matchingBuilderTemplateId','saveRenamedBuilderDay'],{
  state,builderTemplates:()=>state.templates,draft,builderMode:'day',builderDayRenaming:true,
  $:()=>({value:'Push · Bröst och axlar'}),plan:date=>state.plans[date],persist(){persistCalls++;return true;},
  keepBuilderDraft(){},renderBuilderTemplates(){},render(){},toast(){}
 });
 draft.date='2026-10-22';c.saveRenamedBuilderDay();
 assert.equal(saved.name,'Push · Bröst och axlar');assert.equal(draft.name,'Push · Bröst och axlar');
 assert.equal(persistCalls,1);assert.equal(saved.exercises[0].sets[0].weight,50);
});
test('New template names synchronize immediately and trim on leaving the field',()=>{
 const draft=workout(''),input={value:'Bröst + triceps'},option={textContent:''};
 const c=context(['updateNewBuilderTemplateName'],{
  builderMode:'template',builderTemplateCreating:true,draft,
  $:id=>id==='builder-template-name'?input:{querySelector:()=>option}
 });
 c.updateNewBuilderTemplateName(false);
 assert.equal(draft.name,'Bröst + triceps','Typing must update the draft without a confirmation click');
 assert.equal(option.textContent,'＋ Bröst + triceps','Picker option must reflect the name');
 input.value='  Bröst + triceps  ';
 c.updateNewBuilderTemplateName(true);
 assert.equal(draft.name,'Bröst + triceps','Blur must finalize the name without a checkmark');
 assert.equal(input.value,draft.name);
});
test('The standard builder defaults to templates and puts the template tab first',()=>{
 const tabs=html.match(/<div class="builder-mode-switch"[^>]*>(.*?)<\/div>/);
 assert.ok(tabs,'Mode switch must exist');
 assert.ok(tabs[1].indexOf('data-builder-mode="template"')<tabs[1].indexOf('data-builder-mode="day"'));
 assert.match(source,/builderMode=\(!editDay&&!choosePass&&!type\)\?'template':'day'/);
 assert.match(source,/\$\('builder-template-name'\)\.focus\(\)/,'New mall should focus the name field on tap');
});
test('New exercise action focuses its input synchronously on mobile',()=>{
 assert.ok(html.includes('class="builder-exercise-name-new" data-exercise-new='),'New exercise must be a real button');
 assert.doesNotMatch(source,/<label for="builder-exercise-name-/, 'New exercise must not rely on delayed label activation');
 assert.match(source,/if\(newName\)\{beginBuilderFreeExerciseName\(Number\(newName\.dataset\.exerciseNew\),true\);return;\}/);
 assert.match(source,/input\.readOnly=false;input\.dataset\.exerciseNameFree='1';[\s\S]*?input\.focus\(\)/);
 assert.match(source,/\$\('builder-rename-name'\)\.addEventListener\('blur'/,'Existing template renames save on blur');
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
test('Builder accepts unfinished sets but rejects invalid numbers and fractional repetitions',()=>{
 const draft={...workout(),date:'2026-10-16'},messages=[];
 const c=context(['validateDraft'],{draft,builderMode:'day',validDay:()=>true,updateDraftFromBuilderInputs(){},rememberAllTypedExerciseNames(){},cleanExerciseName:s=>s.trim(),toast:s=>messages.push(s)});
 for(const bad of [-1,1000,Infinity,'invalid']){draft.exercises[0].sets[0].weight=bad;assert.equal(c.validateDraft(),false);}
 draft.exercises[0].sets[0].weight=null;draft.exercises[0].sets[0].reps=null;assert.equal(c.validateDraft(),true);draft.exercises[0].sets[0].reps=8;
 draft.exercises[0].sets[0].weight=1.25;assert.equal(c.validateDraft(),true);draft.exercises[0].sets[0].reps=1.5;assert.equal(c.validateDraft(),false);
 draft.exercises[0].mode='min';draft.exercises[0].sets[0].reps=0;draft.exercises[0].sets[0].minutes=0;assert.equal(c.validateDraft(),true);draft.exercises[0].sets[0].minutes=.25;assert.equal(c.validateDraft(),true);draft.exercises[0].sets[0].minutes=null;assert.equal(c.validateDraft(),true);
});
test('Invalid dates cannot silently save to the previous date',()=>{
 const c=context(['pad','dayISO','dayFrom','validDay']);assert.equal(c.validDay('2026-02-30'),false);assert.equal(c.validDay(''),false);assert.equal(c.validDay('2028-02-29'),true);
});
test('Changing builder date moves its draft and uses the destination base',()=>{
 const old='2026-10-12',date='2026-10-13',state={builderDrafts:{[old]:workout('Utkast')}};
 const c=context(['keepBuilderDraft'],{state,draft:{...workout(),date},builderMode:'day',builderDayStage:'custom',builderDraftDate:old,window:{IngemarAccount:{canEdit:true}},validDay:()=>true,plan:()=>workout('Destination'),persist(){}});
 c.keepBuilderDraft();assert.equal(state.builderDrafts[old],undefined);assert.equal(state.builderDrafts[date].name,'Ben');assert.equal(c.builderBase.name,'Destination');
});
test('Unsaved log edits ask before closing and cancellation preserves the draft',()=>{
 let closes=0;const draft=workout();const c=context(['historyEditorDirty','closeHistoryEditor'],{SurfaceMotion:{closeDialog(dialog){dialog.close();}},historyEditDraft:draft,historyEditInitial:JSON.stringify(draft),$:()=>({open:true,close(){closes++;}}),confirm:()=>false,unlockBuilderBackground(){}});
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

test('Log editor preserves blank numeric fields distinctly from zero',()=>{
 const c=context(['logEditorSet'],{});
 const blank=c.logEditorSet(),zero=c.logEditorSet({weight:0,reps:0,minutes:0,done:true});
 assert.equal(blank.weight,null);assert.equal(blank.reps,null);assert.equal(blank.minutes,null);
 assert.equal(zero.weight,0);assert.equal(zero.reps,0);assert.equal(zero.minutes,0);
 assert.equal(c.logEditorSet({weight:37.5,reps:12}).weight,37.5);
});
