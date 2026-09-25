/* Pulse Field's native training tools. Storage shapes deliberately match the
   archived trainer so existing Firebase/profile data remain usable in both. */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
if(!$('week-days')||!$('next-session-link'))return;
var demo=new URLSearchParams(location.search).get('demo')==='1';
var selectedDate=today(),editTemplateId=null,editWorkoutId=null,editRecordName=null;
var dayKeys=['mon','tue','wed','thu','fri','sat','sun'],dayNames=['Mån','Tis','Ons','Tor','Fre','Lör','Sön'];
var defaults={mon:'Bröst + Triceps',tue:'Rygg + Biceps',wed:'Ben + Axlar',thu:'Kondition',fri:'Helkropp',sat:'Vila',sun:'Vila'};
var types=['Bröst + Triceps','Rygg + Biceps','Ben + Axlar','Helkropp','Kondition','Överkropp','Underkropp','Vila','Övrigt'];
var dialog=null,sessionDialog=null,session=null,clock=0;
var unique=0;
function today(){return dateISO(new Date());}
function dateISO(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function asDate(iso){var p=String(iso||today()).split('-').map(Number);return new Date(p[0],p[1]-1,p[2],12);}
function shift(iso,n){var d=asDate(iso);d.setDate(d.getDate()+n);return dateISO(d);}
function monday(iso){var d=asDate(iso);d.setDate(d.getDate()-(d.getDay()+6)%7);return dateISO(d);}
function key(iso){return dayKeys[(asDate(iso).getDay()+6)%7];}
function text(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function num(v){var n=Number(v);return Number.isFinite(n)?n:0;}
function numberText(v){return v==null?'':text(v);}
function read(k,fallback){try{var r=JSON.parse(localStorage.getItem('ex_'+k));return r==null?fallback:r;}catch(_){return fallback;}}
function put(k,v){
  if(demo){error('Exempeldata kan inte sparas. Öppna sidan utan demo=1.');return false;}
  try{localStorage.setItem('ex_'+k,JSON.stringify(v));return true;}
  catch(_){error('Kunde inte spara. Kontrollera lagringsbehörighet.');return false;}
}
function notify(keys){
  window.dispatchEvent(new CustomEvent('pulse-field:data-change',{detail:{keys:keys||[]}}));
  renderTemplates();
}
function toast(message){var node=$('field-toast');if(!node)return;node.textContent=message;node.classList.add('is-visible');clearTimeout(toast.timer);toast.timer=setTimeout(function(){node.classList.remove('is-visible');},2900);}
function error(message){var node=$('field-form-error');if(node)node.textContent=message;else toast(message);}
function templates(){return read('templates',[]);}
function planned(){return read('plannedSessions',{});}
function planFor(iso){return read('weekPlans',{})[monday(iso)]||read('plan',defaults);}
function templateFor(id){return templates().find(function(t){return String(t.id)===String(id);});}
function freshId(){return Date.now()*1000+(unique++%999);}
function clone(a){return JSON.parse(JSON.stringify(a));}
function safeExercises(a){return (Array.isArray(a)?a:[]).map(function(raw){
 var e=raw||{},kind=e.kind==='cardio'||(!e.kind&&(e.distance||e.time))?'cardio':'strength';
 return kind==='cardio'?{kind:kind,name:String(e.name||''),distance:num(e.distance),time:num(e.time)}:
 {kind:kind,name:String(e.name||''),sets:Math.max(1,Math.round(num(e.sets)||1)),reps:num(e.reps),weight:num(e.weight)};
});}
function exerciseSuggestions(){
 var names=new Set(['Hantelpress','Bänkpress','Dips','Knäböj','Marklyft','Rodd','Bicepscurls','Löpning','Cykling','Promenad','Hopprep']);
 templates().forEach(function(t){(t.exercises||[]).forEach(function(e){if(e.name)names.add(e.name);});});
 read('wk',[]).forEach(function(w){(w.exercises||[]).forEach(function(e){if(e.name)names.add(e.name);});});
 return Array.from(names).sort(function(a,b){return a.localeCompare(b,'sv');}).map(function(name){return '<option value="'+text(name)+'"></option>';}).join('');
}
function typeOptions(){return types.map(function(t){return '<option value="'+text(t)+'"></option>';}).join('');}
function showDialog(title,kicker,body,foot){
 if(dialog.open)dialog.close();
 dialog.innerHTML='<form id="field-form" method="dialog" novalidate><div class="field-dialog-head"><div><p class="eyebrow">'+text(kicker)+'</p><h2 id="field-dialog-title">'+text(title)+'</h2></div><button type="button" class="field-dialog-close" data-close-field aria-label="Stäng">×</button></div><div class="field-dialog-body">'+body+'<p id="field-form-error" class="field-dialog-error" role="alert"></p></div><div class="field-dialog-foot"><button type="button" class="field-action field-action--quiet" data-close-field>Avbryt</button>'+foot+'</div></form><datalist id="field-exercise-suggestions">'+exerciseSuggestions()+'</datalist><datalist id="field-type-suggestions">'+typeOptions()+'</datalist>';
 dialog.showModal();
 dialog.querySelector('[data-close-field]').addEventListener('click',function(){dialog.close();});
 dialog.querySelector('#field-form').addEventListener('submit',function(event){event.preventDefault();});
}
function closeOnBackdrop(event){if(event.target===dialog)dialog.close();}
function formValue(id){var e=$(id);return e?e.value.trim():'';}
function input(id,label,value,type,attributes){
 return '<label for="'+id+'">'+text(label)+'<input id="'+id+'" name="'+id+'" type="'+(type||'text')+'" value="'+numberText(value)+'" '+(attributes||'')+'></label>';
}
function textarea(id,label,value){return '<label for="'+id+'">'+text(label)+'<textarea id="'+id+'" rows="2" maxlength="1200">'+text(value||'')+'</textarea></label>';}
function button(label,action,extra){return '<button type="button" class="field-action'+(extra?' '+extra:'')+'" data-field-action="'+action+'">'+label+'</button>';}
function options(items,selected,placeholder){
 return (placeholder?'<option value="">'+text(placeholder)+'</option>':'')+items.map(function(item){
  var value=item.id==null?item.name:item.id,label=item.label||item.name;
  return '<option value="'+text(value)+'"'+(String(value)===String(selected)?' selected':'')+'>'+text(label)+'</option>';
 }).join('');
}
function exerciseRow(raw){
 var e=safeExercises([raw||{}])[0],i='ex-'+freshId();
 return '<section class="field-exercise-row" data-exercise-row data-kind="'+e.kind+'"><div class="field-exercise-head">'+
  input(i+'-name','Övning',e.name,'text','class="field-ex-name" list="field-exercise-suggestions" maxlength="100" placeholder="Övning"')+
  '<label>Typ<select class="field-ex-kind" aria-label="Typ av övning"><option value="strength"'+(e.kind==='strength'?' selected':'')+'>Styrka</option><option value="cardio"'+(e.kind==='cardio'?' selected':'')+'>Kondition</option></select></label>'+
  '<button type="button" data-remove-ex aria-label="Ta bort övning">×</button></div>'+
  '<div class="field-exercise-metrics">'+
  '<label class="field-strength-only">Set<input class="field-ex-sets" type="number" min="1" max="100" step="1" value="'+numberText(e.sets||1)+'"></label>'+
  '<label class="field-strength-only">Reps<input class="field-ex-reps" type="number" min="0" step="1" value="'+numberText(e.reps)+'"></label>'+
  '<label class="field-strength-only">Vikt (kg)<input class="field-ex-weight" type="number" min="0" step="0.5" value="'+numberText(e.weight)+'"></label>'+
  '<label class="field-cardio-only">Distans (km)<input class="field-ex-distance" type="number" min="0" step="0.1" value="'+numberText(e.distance)+'"></label>'+
  '<label class="field-cardio-only">Tid (min)<input class="field-ex-time" type="number" min="0" step="0.1" value="'+numberText(e.time)+'"></label>'+
  '<label>Tid för övningen (sek, valfritt)<input class="field-ex-duration" type="number" min="0" step="1" value="'+numberText(raw&&raw.durationSec||'')+'"></label>'+
  '</div></section>';
}
function exerciseEditor(exercises){return '<div class="field-inline-tools"><h3>Övningar</h3>'+button('＋ Lägg till övning','add-ex')+'</div><div id="field-exercises" class="field-exercise-list">'+(exercises.length?exercises.map(exerciseRow).join(''):exerciseRow())+'</div>';}
function collectExercises(){
 var entries=[],timings=[],invalid=false;
 dialog.querySelectorAll('[data-exercise-row]').forEach(function(row){
  var name=row.querySelector('.field-ex-name').value.trim(),kind=row.dataset.kind;
  if(!name){invalid=true;return;}
  var e=kind==='cardio'?{kind:kind,name:name,distance:num(row.querySelector('.field-ex-distance').value),time:num(row.querySelector('.field-ex-time').value)}:
    {kind:kind,name:name,sets:Math.max(1,Math.round(num(row.querySelector('.field-ex-sets').value)||1)),reps:num(row.querySelector('.field-ex-reps').value),weight:num(row.querySelector('.field-ex-weight').value)};
  var seconds=num(row.querySelector('.field-ex-duration').value);
  if(seconds>0)timings.push({name:name,exerciseIndex:entries.length,durationSec:seconds});
  entries.push(e);
 });
 if(invalid){error('Ange namn på varje övning eller ta bort tomma rader.');return null;}
 return {exercises:entries,timings:timings};
}
function editorDate(){var d=formValue('field-date');return /^\d{4}-\d{2}-\d{2}$/.test(d)?d:null;}
function editorType(){return formValue('field-type')||'Övrigt';}
function chosenDate(){return selectedDate||today();}
function dateFields(date,type){
 return '<div class="field-form-grid">'+input('field-date','Datum',date,'date','required')+input('field-type','Typ av pass',type,'text','list="field-type-suggestions" required maxlength="100"')+'</div>';
}
function openBuilder(date,templateId){
 editTemplateId=templateId==null?null:String(templateId);
 var tpl=editTemplateId?templateFor(editTemplateId):null,iso=date||chosenDate(),byDate=planned()[iso]||{},plan=planFor(iso);
 var source=tpl||byDate,exercises=safeExercises(source.exercises);
 var body=dateFields(iso,source.type||plan[key(iso)]||'Övrigt')+
 '<p class="field-hint">Spara ett passupplägg för vald dag eller skapa en återanvändbar mall. Redigera namn, set, vikt och tid här.</p>'+
 '<label>Välj sparat mallpass<select id="field-template-pick">'+options(templates().map(function(t){return {id:t.id,name:t.name};}),editTemplateId,'Välj mall (valfritt)')+'</select></label>'+
 input('field-template-name','Mallnamn',tpl&&tpl.name||'', 'text','maxlength="100" placeholder="Valfritt namn för mall"')+
 exerciseEditor(exercises);
 var foot=button('Spara upplägg','save-plan','field-action--primary')+button('Spara som mall','save-template')+button('Starta pass','start-from-builder');
 if(tpl)foot+=button('Ta bort mall','delete-template','field-action--danger');
 showDialog(tpl?'Redigera mallpass':'Bygg pass','PULSE / PASS',body,foot);
 $('field-template-pick').addEventListener('change',function(){if(this.value)openBuilder(formValue('field-date'),this.value);});
 dialog.querySelector('[data-field-action="save-plan"]').addEventListener('click',savePlan);
 dialog.querySelector('[data-field-action="save-template"]').addEventListener('click',saveTemplate);
 dialog.querySelector('[data-field-action="start-from-builder"]').addEventListener('click',function(){if(savePlan())startSession(editorDate()||chosenDate());});
 if(tpl)dialog.querySelector('[data-field-action="delete-template"]').addEventListener('click',deleteTemplate);
}
function savePlan(){
 var date=editorDate(),collected=collectExercises();
 if(!date||!collected)return date?false:(error('Välj ett giltigt datum.'),false);
 if(!collected.exercises.length){error('Lägg till minst en övning.');return false;}
 var plan=planned(),type=editorType();
 plan[date]={type:type,exercises:collected.exercises};
 if(!put('plannedSessions',plan))return false;
 var weeks=read('weekPlans',{}),start=monday(date),week=Object.assign({},planFor(date));
 week[key(date)]=type;weeks[start]=week;
 if(!put('weekPlans',weeks))return false;
 if(start===monday(today()))put('plan',week);
 selectedDate=date;notify(['plannedSessions','weekPlans','plan']);dialog.close();toast('Passupplägget är sparat.');return true;
}
function saveTemplate(){
 var collected=collectExercises(),name=formValue('field-template-name')||editorType();
 if(!collected||!collected.exercises.length){error('Lägg till minst en övning till mallen.');return;}
 var all=templates(),tpl={id:editTemplateId?Number(editTemplateId):freshId(),name:name,type:editorType(),duration:null,exercises:collected.exercises};
 if(editTemplateId&&!Number.isFinite(tpl.id))tpl.id=editTemplateId;
 var pos=all.findIndex(function(t){return String(t.id)===String(editTemplateId);});
 if(pos>=0)all[pos]=tpl;else all.push(tpl);
 if(!put('templates',all))return;
 notify(['templates']);dialog.close();toast('Mallpass sparat.');
}
function deleteTemplate(){
 if(!editTemplateId||!window.confirm('Ta bort mallpasset?'))return;
 if(!put('templates',templates().filter(function(t){return String(t.id)!==String(editTemplateId);})))return;
 notify(['templates']);dialog.close();toast('Mallpass borttaget.');
}
function upsertVO2(date,value){
 if(!(value>0))return;
 var entries=read('vo2',[]),idx=entries.findIndex(function(v){return v.date===date;});
 if(idx>=0)entries[idx].score=value;else entries.push({date:date,score:value});
 entries.sort(function(a,b){return a.date.localeCompare(b.date);});put('vo2',entries);
}
function openWorkout(id,date){
 editWorkoutId=id==null?null:String(id);
 var original=editWorkoutId?read('wk',[]).find(function(w){return String(w.id)===editWorkoutId;}):null;
 var iso=original&&original.date||date||chosenDate(),plan=planned()[iso]||{},source=original||plan;
 var exercises=safeExercises(source.exercises||[]);
 if(original&&Array.isArray(original.exerciseTimings))exercises.forEach(function(e,index){var t=original.exerciseTimings.find(function(item){return item.exerciseIndex===index;});if(t)e.durationSec=t.durationSec;});
 var body=dateFields(iso,source.type||'Övrigt')+
 '<div class="field-form-grid">'+input('field-duration','Passets tid (min)',original&&original.duration||'', 'number','min="0" step="1"')+
 input('field-hr','Medelpuls (bpm)',original&&original.hrAvg||'', 'number','min="0" max="240"')+
 input('field-vo2','VO₂ max (valfritt)',original&&original.vo2||'', 'number','min="0" max="100" step="0.1"')+
 input('field-run-km','Löpdistans (km)',original&&original.runDistance||'', 'number','min="0" step="0.1"')+
 input('field-run-min','Löptid (min)',original&&original.runTime||'', 'number','min="0" step="0.1"')+'</div>'+
 '<label>Ladda mallpass<select id="field-template-pick">'+options(templates().map(function(t){return {id:t.id,name:t.name};}),null,'Välj mall (valfritt)')+'</select></label>'+
 exerciseEditor(exercises)+textarea('field-notes','Anteckningar',original&&original.notes||'');
 var foot=button('Spara pass','save-workout','field-action--primary');
 if(original)foot+=button('Ta bort pass','delete-workout','field-action--danger');
 showDialog(original?'Redigera loggat pass':'Logga pass','PULSE / LOGG',body,foot);
 $('field-template-pick').addEventListener('change',function(){
  var t=templateFor(this.value);if(!t)return;
  $('field-type').value=t.type||t.name;
  $('field-exercises').innerHTML=safeExercises(t.exercises).map(exerciseRow).join('');
 });
 dialog.querySelector('[data-field-action="save-workout"]').addEventListener('click',saveWorkout);
 if(original)dialog.querySelector('[data-field-action="delete-workout"]').addEventListener('click',deleteWorkout);
}
function saveWorkout(){
 var date=editorDate(),collected=collectExercises();
 if(!date||!collected){if(!date)error('Välj ett giltigt datum.');return;}
 var distance=num(formValue('field-run-km')),minutes=num(formValue('field-run-min')),hr=num(formValue('field-hr')),vo2=num(formValue('field-vo2'));
 var cardio=collected.exercises.filter(function(e){return e.kind==='cardio';});
 if(!distance)distance=cardio.reduce(function(sum,e){return sum+num(e.distance);},0);
 if(!minutes)minutes=cardio.reduce(function(sum,e){return sum+num(e.time);},0);
 if(vo2&&(vo2<10||vo2>100)){error('VO₂ max måste vara mellan 10 och 100.');return;}
 if(!collected.exercises.length&&!num(formValue('field-duration'))){error('Ange övningar eller passets tid.');return;}
 var item={id:editWorkoutId?Number(editWorkoutId):freshId(),date:date,type:editorType(),duration:num(formValue('field-duration'))||null,
 hrAvg:hr||null,vo2:vo2||null,runDistance:distance,runTime:minutes||null,
 avgPaceKm:distance&&minutes?+(minutes/distance).toFixed(4):null,
 runMetricsDerived:!num(formValue('field-run-km'))&&cardio.length>0,
 exercises:collected.exercises,exerciseTimings:collected.timings,notes:formValue('field-notes')};
 if(editWorkoutId&&!Number.isFinite(item.id))item.id=editWorkoutId;
 var list=read('wk',[]),pos=list.findIndex(function(w){return String(w.id)===editWorkoutId;});
 if(pos>=0)list[pos]=item;else list.push(item);
 if(!put('wk',list))return;
 upsertVO2(date,vo2);notify(['wk','vo2']);dialog.close();toast('Passet är sparat.');
}
function deleteWorkout(){
 if(!editWorkoutId||!window.confirm('Ta bort det loggade passet?'))return;
 if(!put('wk',read('wk',[]).filter(function(w){return String(w.id)!==editWorkoutId;})))return;
 notify(['wk']);dialog.close();toast('Pass borttaget.');
}
function weekDate(){return formValue('field-week-date')||monday(chosenDate());}
function weekRows(week){
 return '<div class="field-week-grid">'+dayKeys.map(function(k,i){return '<label>'+dayNames[i]+'<input data-week-day="'+k+'" list="field-type-suggestions" maxlength="100" value="'+text(week[k]||'Vila')+'"></label>';}).join('')+'</div>';
}
function chosenWeekPlan(){var plan={};dialog.querySelectorAll('[data-week-day]').forEach(function(e){plan[e.dataset.weekDay]=e.value.trim()||'Vila';});return plan;}
function openWeek(iso){
 var date=monday(iso||chosenDate()),weekTemplates=read('weekTemplates',[]);
 var body=input('field-week-date','Vecka som börjar',date,'date','required')+
 '<p class="field-hint">Ändra de sju dagarna och spara. Befintliga övningar behålls om en dag byter namn.</p><div id="field-week-days">'+weekRows(planFor(date))+'</div>'+
 '<h3>Veckomallar</h3><div class="field-week-templates"><label>Välj veckomall<select id="field-week-template">'+options(weekTemplates.map(function(t){return {id:t.id,name:t.name};}),null,'Välj mall')+'</select></label>'+
 button('Använd','apply-week-template')+button('Ta bort mall','delete-week-template','field-action--danger')+'</div>'+
 input('field-week-template-name','Namn på ny veckomall','','text','maxlength="100" placeholder="Exempelvis Push / Pull"');
 var foot=button('Spara veckoplan','save-week','field-action--primary')+button('Spara som veckomall','save-week-template');
 showDialog('Veckoplan','PULSE / PLAN',body,foot);
 $('field-week-date').addEventListener('change',function(){if(this.value)$('field-week-days').innerHTML=weekRows(planFor(monday(this.value)));});
 dialog.querySelector('[data-field-action="save-week"]').addEventListener('click',saveWeek);
 dialog.querySelector('[data-field-action="save-week-template"]').addEventListener('click',saveWeekTemplate);
 dialog.querySelector('[data-field-action="apply-week-template"]').addEventListener('click',function(){
 var t=read('weekTemplates',[]).find(function(w){return String(w.id)===formValue('field-week-template');});
 if(!t){error('Välj en veckomall.');return;}
 $('field-week-days').innerHTML=weekRows(t.plan||{});toast('Veckomallen är inläst. Spara för att använda den.');
 });
 dialog.querySelector('[data-field-action="delete-week-template"]').addEventListener('click',function(){
 var id=formValue('field-week-template');if(!id||!window.confirm('Ta bort vald veckomall?'))return;
 if(!put('weekTemplates',read('weekTemplates',[]).filter(function(t){return String(t.id)!==id;})))return;
 openWeek(weekDate());toast('Veckomall borttagen.');
 });
}
function saveWeek(){
 var week=chosenWeekPlan(),date=monday(weekDate()),weeks=read('weekPlans',{}),sessions=planned();
 weeks[date]=week;
 if(!put('weekPlans',weeks))return false;
 for(var i=0;i<7;i++){
  var d=shift(date,i),type=week[dayKeys[i]]||'Vila';
  if(type==='Vila'){if(sessions[d]&&!(sessions[d].exercises||[]).length)delete sessions[d];continue;}
  if(!sessions[d])sessions[d]={type:type,exercises:[]};
  else sessions[d].type=type;
 }
 if(!put('plannedSessions',sessions))return false;
 if(date===monday(today()))put('plan',week);
 selectedDate=date;notify(['weekPlans','plan','plannedSessions']);dialog.close();toast('Veckoplanen är sparad.');return true;
}
function saveWeekTemplate(){
 var name=formValue('field-week-template-name');
 if(!name){error('Ange ett namn på veckomallen.');return;}
 var all=read('weekTemplates',[]);all.push({id:freshId(),name:name,plan:chosenWeekPlan()});
 if(!put('weekTemplates',all))return;
 if(saveWeek())toast('Veckomall och veckoplan sparade.');
}
function openGoals(){
 var current=read('goals',{weeklyWk:4,runDistanceGoal:10,vo2Goal:45});
 var entry=read('vo2',[]).slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));})[0];
 var body='<h3>Veckans mål</h3><div class="field-form-grid">'+
 input('field-goal-week','Träningspass per vecka',num(current.weeklyWk)||4,'number','min="1" max="14" step="1"')+
 input('field-goal-run','Löpdistans (km)',num(current.runDistanceGoal)||10,'number','min="0.1" max="1000" step="0.1"')+
 input('field-goal-vo2','VO₂-mål',num(current.vo2Goal)||45,'number','min="10" max="100" step="0.1"')+'</div>'+
 '<h3>Registrera VO₂</h3><div class="field-form-grid">'+
 input('field-vo2-date','Datum',today(),'date','')+
 input('field-vo2-score','VO₂ max',entry&&num(entry.score)||'','number','min="10" max="100" step="0.1"')+
 '</div><p class="field-hint">Mål sparas per profil. Ett registrerat VO₂-värde uppdaterar mätvärdesgrafen.</p>';
 showDialog('Mål och VO₂','PULSE / UTVECKLING',body,button('Spara mål','save-goals','field-action--primary')+button('Registrera VO₂','save-vo2'));
 dialog.querySelector('[data-field-action="save-goals"]').addEventListener('click',function(){
  var n=num(formValue('field-goal-week')),run=num(formValue('field-goal-run')),vo2=num(formValue('field-goal-vo2'));
  if(!Number.isInteger(n)||n<1||n>14||run<=0||run>1000||vo2<10||vo2>100){error('Kontrollera målen: 1–14 pass, positiv distans och VO₂ mellan 10 och 100.');return;}
  var goals=Object.assign({},current,{weeklyWk:n,runDistanceGoal:run,vo2Goal:vo2});
  if(!put('goals',goals))return;
  notify(['goals']);dialog.close();toast('Målen är sparade.');
 });
 dialog.querySelector('[data-field-action="save-vo2"]').addEventListener('click',function(){
  var d=formValue('field-vo2-date'),v=num(formValue('field-vo2-score'));
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||v<10||v>100){error('Välj datum och VO₂ mellan 10 och 100.');return;}
  upsertVO2(d,v);notify(['vo2']);dialog.close();toast('VO₂-värdet är sparat.');
 });
}
function openRecord(name){
 editRecordName=name||null;
 var prs=read('prs',{}),value=editRecordName&&prs[editRecordName]||'';
 var body=input('field-pr-name','Övning',editRecordName||'','text','required maxlength="100" list="field-exercise-suggestions"')+
 input('field-pr-value','Rekord (kg)',value,'number','required min="0" step="0.5"')+
 '<p class="field-hint">Manuella rekord sparas tillsammans med passens automatiskt beräknade maxvärden.</p>'+
 '<div class="field-record-list">'+Object.keys(prs).sort(function(a,b){return a.localeCompare(b,'sv');}).map(function(k){return '<button type="button" data-edit-pr="'+text(k)+'">'+text(k)+'<small>'+text(prs[k])+' kg</small></button>';}).join('')+'</div>';
 var foot=button('Spara rekord','save-pr','field-action--primary')+(editRecordName?button('Ta bort rekord','delete-pr','field-action--danger'):'');
 showDialog(editRecordName?'Redigera rekord':'Hantera rekord','PULSE / REKORD',body,foot);
 dialog.querySelector('[data-field-action="save-pr"]').addEventListener('click',function(){
 var next=formValue('field-pr-name'),value=num(formValue('field-pr-value'));if(!next||!value){error('Ange övning och rekordvikt.');return;}
 var p=read('prs',{});if(editRecordName&&editRecordName!==next)delete p[editRecordName];p[next]=value;
 if(!put('prs',p))return;notify(['prs']);dialog.close();toast('Rekord sparat.');
 });
 if(editRecordName)dialog.querySelector('[data-field-action="delete-pr"]').addEventListener('click',function(){
 if(!window.confirm('Ta bort manuellt rekord?'))return;
 var p=read('prs',{});delete p[editRecordName];if(!put('prs',p))return;
 notify(['prs']);dialog.close();toast('Manuellt rekord borttaget.');
 });
}
function renderTemplates(){
 var grid=$('field-template-grid');if(!grid)return;
 var all=templates();
 grid.innerHTML=all.length?all.map(function(t){
  var count=(t.exercises||[]).length;
  return '<article class="field-template-card"><strong>'+text(t.name||t.type||'Mallpass')+'</strong><p>'+text(t.type||'Träning')+' · '+count+' övningar</p><div class="field-action-row">'+
  button('Starta','start-template','field-action--primary').replace('data-field-action="start-template"','data-field-action="start-template" data-template-id="'+text(t.id)+'"')+
  button('Redigera','edit-template').replace('data-field-action="edit-template"','data-field-action="edit-template" data-template-id="'+text(t.id)+'"')+'</div></article>';
 }).join(''):'<p class="field-hint">Inga sparade mallpass ännu. Bygg ditt första pass här.</p>';
}
function sessionElapsed(){return session?Math.max(0,Math.floor((Date.now()-session.startedAt-session.pausedMs-(session.pauseAt?Date.now()-session.pauseAt:0))/1000)):0;}
function fmt(s){s=Math.max(0,Math.floor(s||0));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function sessionStateEx(){return session&&session.exercises[session.index];}
function startSession(date){
 var plan=planned()[date];
 if(!plan||!(plan.exercises||[]).length){openBuilder(date);toast('Bygg och spara ett pass först.');return;}
 if(session&&sessionDialog.open){sessionDialog.focus();return;}
 if(dialog.open)dialog.close();
 session={date:date,type:plan.type||'Träning',exercises:safeExercises(plan.exercises),index:0,set:1,logs:[],
 startedAt:Date.now(),pausedMs:0,pauseAt:0,setStartedAt:0,done:false};
 session.exercises.forEach(function(){session.logs.push([]);});
 sessionDialog.showModal();clearInterval(clock);clock=setInterval(tickSession,500);renderSession();
}
function renderSession(){
 if(!session)return;
 var ex=sessionStateEx(),count=session.exercises.length,total=session.exercises.reduce(function(n,e){return n+(e.kind==='cardio'?1:Math.max(1,e.sets));},0);
 var done=session.logs.reduce(function(n,items){return n+items.length;},0),finish=session.done;
 sessionDialog.innerHTML='<div class="field-dialog-inner"><div class="field-dialog-head"><div><p class="eyebrow">PULSE / PÅGÅENDE PASS</p><h2>'+(finish?'Sammanfattning':text(session.type))+'</h2></div><button type="button" class="field-dialog-close" data-session-close aria-label="Avbryt pass">×</button></div>'+
 '<div class="field-dialog-body"><div class="field-session-time" id="field-pass-clock">'+fmt(sessionElapsed())+'</div>'+
 '<div class="field-session-progress"><span style="width:'+Math.min(100,done/Math.max(1,total)*100)+'%"></span></div>'+
 '<p class="field-session-count">'+(finish?'Pass klart':('Övning '+(session.index+1)+' av '+count+' · Set '+session.set+(ex.kind==='strength'?' / '+Math.max(ex.set,ex.sets):'')))+'</p>'+
 (finish?'<div class="field-form-grid">'+input('field-session-hr','Medelpuls (bpm)','','number','min="0" max="240"')+
 input('field-session-vo2','VO₂ max','','number','min="0" max="100" step="0.1"')+'</div>'+textarea('field-session-notes','Anteckningar','')+
 '<p class="field-hint">'+done+' loggade set. Du kan spara passet i träningsloggen.</p>':
 '<h3>'+text(ex.name||'Övning')+'</h3><div class="field-form-grid">'+
 (ex.kind==='cardio'?input('field-session-distance','Distans (km)',ex.distance,'number','min="0" step="0.1"')+
 input('field-session-minutes','Tid (min)',ex.time,'number','min="0" step="0.1"'):
 input('field-session-weight','Vikt (kg)',ex.weight,'number','min="0" step="0.5"')+
 input('field-session-reps','Repetitioner',ex.reps,'number','min="0" step="1"'))+'</div>'+
 '<p class="field-hint" id="field-set-clock">'+(session.setStartedAt?'Set pågår · '+fmt((Date.now()-session.setStartedAt)/1000):'Redo att starta set')+'</p>')+
 '<div class="field-session-controls">'+(finish?
 button('Spara pass','session-save','field-action--primary')+button('Tillbaka','session-back'):
 session.setStartedAt?button('Avsluta set','session-finish-set','field-action--primary'):
 button('Starta set','session-start-set','field-action--primary')+
 button('Extra set','session-extra-set')+button('Övning klar / Nästa','session-next')+button('Avsluta pass','session-complete'))+'</div><p class="field-dialog-error" id="field-session-error" role="alert"></p></div></div>';
 sessionDialog.querySelector('[data-session-close]').addEventListener('click',endSession);
 sessionDialog.querySelectorAll('[data-field-action]').forEach(function(b){b.addEventListener('click',function(){sessionAction(this.dataset.fieldAction);});});
}
function tickSession(){
 if(!session||!sessionDialog.open)return;
 var main=$('field-pass-clock'),set=$('field-set-clock');
 if(main)main.textContent=fmt(sessionElapsed());
 if(set&&session.setStartedAt)set.textContent='Set pågår · '+fmt((Date.now()-session.setStartedAt)/1000);
}
function nextEx(){
 if(session.index+1<session.exercises.length){session.index++;session.set=1;session.setStartedAt=0;}else session.done=true;
 renderSession();
}
function sessionAction(action){
 if(!session)return;
 var ex=sessionStateEx();
 if(action==='session-start-set'){session.setStartedAt=Date.now();renderSession();return;}
 if(action==='session-finish-set'){
  var elapsed=session.setStartedAt?Math.max(1,Math.floor((Date.now()-session.setStartedAt)/1000)):0;
  var log=ex.kind==='cardio'?{actualDistance:num($('field-session-distance').value),actualTime:num($('field-session-minutes').value),durationSec:elapsed}:
   {actualWeight:num($('field-session-weight').value),actualReps:num($('field-session-reps').value),durationSec:elapsed};
  session.logs[session.index].push(log);session.setStartedAt=0;
  if(ex.kind==='cardio'||session.set>=ex.sets)nextEx();else{session.set++;renderSession();}
  return;
 }
 if(action==='session-extra-set'){if(ex.kind==='strength')ex.sets++;renderSession();return;}
 if(action==='session-next'){if(session.setStartedAt){$('field-session-error').textContent='Avsluta det pågående setet först.';return;}nextEx();return;}
 if(action==='session-complete'){if(session.setStartedAt){$('field-session-error').textContent='Avsluta det pågående setet först.';return;}session.done=true;renderSession();return;}
 if(action==='session-back'){session.done=false;renderSession();return;}
 if(action==='session-save')saveSession();
}
function saveSession(){
 var exercises=[],timings=[],distance=0,minutes=0;
 session.exercises.forEach(function(ex,i){
  var logs=session.logs[i];if(!logs.length)return;
  var seconds=logs.reduce(function(n,l){return n+num(l.durationSec);},0);
  var e=ex.kind==='cardio'?{kind:'cardio',name:ex.name,distance:logs.reduce(function(n,l){return n+num(l.actualDistance);},0),time:logs.reduce(function(n,l){return n+num(l.actualTime);},0)}:
   {kind:'strength',name:ex.name,sets:logs.length,reps:Math.round(logs.reduce(function(n,l){return n+num(l.actualReps);},0)/logs.length),weight:+(logs.reduce(function(n,l){return n+num(l.actualWeight);},0)/logs.length).toFixed(1)};
  if(e.kind==='cardio'){distance+=e.distance;minutes+=e.time;}
  timings.push({name:e.name,exerciseIndex:exercises.length,durationSec:seconds});exercises.push(e);
 });
 if(!exercises.length){$('field-session-error').textContent='Logga minst ett set innan du sparar.';return;}
 var vo2=num(formValue('field-session-vo2')),hr=num(formValue('field-session-hr'));
 if(vo2&&(vo2<10||vo2>100)){$('field-session-error').textContent='Ange giltigt VO₂-värde.';return;}
 var duration=Math.max(1,Math.ceil(sessionElapsed()/60)),w={
  id:freshId(),date:session.date,type:session.type,duration:duration,hrAvg:hr||null,vo2:vo2||null,
  runDistance:distance,runTime:minutes||null,avgPaceKm:distance&&minutes?+(minutes/distance).toFixed(4):null,runMetricsDerived:distance>0,
  exercises:exercises,exerciseTimings:timings,notes:formValue('field-session-notes')||'Skapad i passläge'
 };
 var list=read('wk',[]);list.push(w);if(!put('wk',list))return;
 upsertVO2(session.date,vo2);notify(['wk','vo2']);closeSession();toast('Passet är sparat i träningsloggen.');
}
function closeSession(){clearInterval(clock);clock=0;session=null;if(sessionDialog.open)sessionDialog.close();}
function endSession(){if(session&&window.confirm('Avsluta passet utan att spara?'))closeSession();}
function selectedDay(date){selectedDate=date;var edit=$('field-edit-day'),start=$('field-start-day');if(edit)edit.textContent='Redigera '+date;if(start)start.textContent='Starta '+date;}
function go(action,button){
 var id=button&&button.dataset.templateId;
 if(action==='build')openBuilder(chosenDate());
 else if(action==='log')openWorkout(null,chosenDate());
 else if(action==='week')openWeek(chosenDate());
 else if(action==='records')openRecord();
 else if(action==='goals')openGoals();
 else if(action==='start')startSession((button&&button.dataset.fieldDate)||chosenDate());
 else if(action==='edit-day')openBuilder(chosenDate());
 else if(action==='start-day')startSession(chosenDate());
 else if(action==='edit-template')openBuilder(chosenDate(),id);
 else if(action==='start-template'){
  var tpl=templateFor(id);if(!tpl)return;
  var date=chosenDate(),sessions=planned();sessions[date]={type:tpl.type||tpl.name||'Träning',exercises:safeExercises(tpl.exercises)};
  if(!put('plannedSessions',sessions))return;
  selectedDate=date;notify(['plannedSessions']);startSession(date);
 }
 else if(action==='edit-log')openWorkout(button.dataset.workoutId);
 else if(action==='edit-record')openRecord(button.dataset.recordName);
 else if(action==='add-ex'){$('field-exercises').insertAdjacentHTML('beforeend',exerciseRow());}
}
function install(){
 dialog=document.createElement('dialog');dialog.id='field-editor-dialog';dialog.className='field-editor';document.body.appendChild(dialog);
 dialog.addEventListener('click',closeOnBackdrop);
 sessionDialog=document.createElement('dialog');sessionDialog.id='field-session-dialog';sessionDialog.className='field-session';document.body.appendChild(sessionDialog);
 sessionDialog.addEventListener('cancel',function(event){event.preventDefault();endSession();});
 document.addEventListener('click',function(event){
  var button=event.target.closest('[data-field-action]');if(!button)return;
  var action=button.dataset.fieldAction;
  if(button.closest('#field-editor-dialog')){
   if(action==='add-ex'){event.preventDefault();go(action,button);}return;
  }
  if(button.closest('#field-session-dialog'))return;
  event.preventDefault();
  var menu=button.closest('#field-menu');
  if(menu){menu.classList.remove('is-open');menu.setAttribute('aria-hidden','true');var toggle=$('menu-toggle');if(toggle){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Öppna meny');}}
  go(action,button);
 });
 document.addEventListener('change',function(event){
  if(event.target.classList.contains('field-ex-kind')){
   event.target.closest('[data-exercise-row]').dataset.kind=event.target.value;
  }
 });
 document.addEventListener('click',function(event){
  if(event.target.closest('[data-remove-ex]')){
   event.preventDefault();
   var row=event.target.closest('[data-exercise-row]');if(row)row.remove();
  }
  var pr=event.target.closest('[data-edit-pr]');if(pr&&dialog.contains(pr)){openRecord(pr.dataset.editPr);}
  var day=event.target.closest('[data-day]');if(day)selectedDay(day.dataset.day);
 });
 window.addEventListener('firebase-sync',function(event){
  if(!event.detail||!['ex_templates','ex_weekTemplates','ex_weekPlans'].includes(event.detail.key))return;
  renderTemplates();
 });
 renderTemplates();selectedDay(chosenDate());
 var deep=new URLSearchParams(location.search).get('tool');
 if(deep&&['build','log','week','records','start'].includes(deep))go(deep);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();