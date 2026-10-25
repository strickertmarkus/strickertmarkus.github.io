/* Family Pulse builder — shares the established profile-scoped training database. */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('embedded')!=='1')return;
var modal,mode='template',day='',templateId='',dayTemplateId='',draft=null,dirty=false,expanded=new Set();
var TYPES=['Bröst + Triceps','Rygg + Biceps','Ben + Axlar','Helkropp','Kondition','Överkropp','Underkropp','Stretching / Rörlighet','Övrigt'];
var NAMES=['Bänkpress','Hantelpress','Bröstpress maskin','Armhävningar','Dips','Triceps pushdown','Latsdrag','Chins','Sittande rodd','Marklyft','Bicepscurl','Hammercurl','Knäböj','Benpress','Utfall','Hip thrust','Axelpress','Sidolyft','Plankan','Löpning','Cykling','Roddmaskin','Intervaller','Promenad'];
function $(s){return modal.querySelector(s);}
function h(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function clone(o){return JSON.parse(JSON.stringify(o));}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function at(isoDay){var p=String(isoDay).split('-').map(Number);return new Date(p[0],p[1]-1,p[2],12);}
function shift(isoDay,n){var d=at(isoDay);d.setDate(d.getDate()+n);return iso(d);}
function week(isoDay){var d=at(isoDay);d.setDate(d.getDate()-(d.getDay()+6)%7);return iso(d);}
function templates(){return window.getTemplates()||[];}
function planned(){return window.getPlannedSessions()||{};}
function blank(){return {name:'',type:'Helkropp',exercises:[]};}
function message(s){if(typeof window.showToast==='function')window.showToast(s);}
function confirmDiscard(){return !dirty||confirm('Lämna ändringarna utan att spara?');}
function setDraft(d){draft=clone(d||blank());draft.exercises=Array.isArray(draft.exercises)?draft.exercises:[];expanded.clear();dirty=false;}
function loadTemplate(id){var t=templates().find(function(x){return String(x.id)===String(id);});templateId=t?t.id:'';setDraft(t||blank());}
function loadDay(isoDay){day=isoDay;var d=planned()[day];dayTemplateId=d&&d.templateId||'';setDraft(d||blank());if(d&&!draft.name&&draft.exercises.length)draft.name=d.type||'';}
function ensure(){
 if(modal)return;
 modal=document.createElement('div');modal.id='pulse-family-builder';modal.className='modal-overlay pulse-editor';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
 modal.innerHTML='<div class="modal"><header class="pf-head"><div><small>PASSBYGGARE · MAJA / MARKUS</small><h2>Bygg pass</h2></div><button type="button" class="pf-icon" data-act="close" aria-label="Stäng">×</button></header><main class="pf-content"></main></div>';
 document.body.appendChild(modal);modal.addEventListener('click',clicked);modal.addEventListener('input',entered);modal.addEventListener('change',changed);modal.addEventListener('focusout',blurred);modal.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();close();}});
}
function open(opt){
 opt=opt||{};ensure();day=opt.date||day||iso(new Date());
 mode=opt.mode==='day'?'day':'template';
 if(mode==='day')loadDay(day);else loadTemplate(opt.templateId||'');
 render();modal.classList.add('show');
}
function close(){if(!confirmDiscard())return;modal.classList.remove('show');dirty=false;
 if(window.pulsePlanBuilderReturnV3&&typeof window.pulsePlanReturnFromBuilderV3==='function')window.pulsePlanReturnFromBuilderV3();
}
function cleaned(){
 return draft.exercises.filter(function(e){return String(e.name||'').trim();}).map(function(e){
 var name=String(e.name).trim().slice(0,100);
 return e.kind==='cardio'?{kind:'cardio',name:name,distance:Number(e.distance)||0,time:Number(e.time)||0}:{kind:'strength',name:name,sets:Math.max(1,Math.round(Number(e.sets)||1)),weight:Number(e.weight)||0,reps:Number(e.reps)||0};
 });
}
function saveTemplate(silent){
 if(!String(draft.name||'').trim()){if(!silent)message('Namnge mallpasset först.');return false;}
 var list=templates(),index=list.findIndex(function(t){return String(t.id)===String(templateId);});
 var id=templateId||Date.now();
 var entry={id:id,name:String(draft.name).trim(),type:draft.type||'Helkropp',exercises:cleaned()};
 if(index<0)list.push(entry);else list[index]=Object.assign({},list[index],entry);
 window.saveTemplates(list);templateId=id;dirty=false;
 if(!silent)message('Mallpass sparat.');
 return true;
}
function saveDay(silent){
 var entry={name:String(draft.name||draft.type||'Träning').trim(),type:draft.type||'Helkropp',exercises:cleaned()};
 if(dayTemplateId)entry.templateId=dayTemplateId;
 var all=planned();all[day]=entry;window.savePlannedSessions(all);
 var monday=week(day),p=Object.assign({},window.getPlanForWeek(monday));p[window.dayKeyFromISO(day)]=entry.type;
 window.setPlanForWeek(monday,p);window.viewedMondayISO=monday;
 if(typeof window.renderWeekGrid==='function')window.renderWeekGrid();
 dirty=false;if(!silent)message('Dagspass sparat.');return true;
}
function suggestions(){
 var all=NAMES.slice();templates().forEach(function(t){(t.exercises||[]).forEach(function(e){if(e.name)all.push(e.name);});});
 try{(window.getWorkouts()||[]).forEach(function(w){(w.exercises||[]).forEach(function(e){if(e.name)all.push(e.name);});});}catch(_){}
 return Array.from(new Set(all)).map(function(x){return '<option value="'+h(x)+'"></option>';}).join('');
}
function templateOptions(){
 return '<option value="">'+(templates().length?'Välj mallpass':'Inga mallpass ännu')+'</option>'+
 templates().slice().sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'sv');}).map(function(t){return '<option value="'+h(t.id)+'">'+h(t.name||'Mallpass')+'</option>';}).join('');
}
function exerciseView(ex,i){
 var open=expanded.has(i),cardio=ex.kind==='cardio';
 var summary=cardio?[ex.distance?ex.distance+' km':'',ex.time?ex.time+' min':''].filter(Boolean).join(' · '):[ex.sets?ex.sets+' set':'',ex.weight?ex.weight+' kg':'',ex.reps?ex.reps+' reps':''].filter(Boolean).join(' · ');
 return '<article class="pf-exercise'+(open?' is-open':'')+'"><div class="pf-card-head"><button type="button" class="pf-expand" data-act="expand" data-index="'+i+'" aria-expanded="'+open+'" aria-controls="pf-card-'+i+'"><span class="pf-chevron">›</span><span class="pf-card-label"><small>ÖVNING '+String(i+1).padStart(2,'0')+'</small><strong>'+h(ex.name||'Ny övning')+'</strong><em>'+h(summary|| (cardio?'Kondition':'Styrka'))+'</em></span></button><button class="pf-icon" type="button" data-act="remove" data-index="'+i+'" aria-label="Ta bort övning">×</button></div>'+
 '<div class="pf-exercise-body" id="pf-card-'+i+'"'+(open?'':' hidden')+'><input class="pf-exercise-name" data-edit="ex:'+i+':name" list="pf-suggestions" autocomplete="off" placeholder="Välj eller skriv övning" value="'+h(ex.name||'')+'">'+
 '<div class="pf-kind"><button type="button" data-act="kind" data-index="'+i+'" data-kind="strength" aria-pressed="'+(!cardio)+'">kg × reps</button><button type="button" data-act="kind" data-index="'+i+'" data-kind="cardio" aria-pressed="'+cardio+'">Tid / kondition</button></div>'+
 '<div class="pf-metrics'+(cardio?' cardio':'')+'">'+(cardio?
 '<label>Distans (km)<input type="number" min="0" step=".1" inputmode="decimal" data-edit="ex:'+i+':distance" value="'+h(ex.distance||'')+'" placeholder="–"></label><label>Tid (min)<input type="number" min="0" step=".5" inputmode="decimal" data-edit="ex:'+i+':time" value="'+h(ex.time||'')+'" placeholder="–"></label>':
 '<label>Set<input type="number" min="1" max="99" step="1" inputmode="numeric" data-edit="ex:'+i+':sets" value="'+h(ex.sets||'')+'" placeholder="–"></label><label>Vikt (kg)<input type="number" min="0" step=".5" inputmode="decimal" data-edit="ex:'+i+':weight" value="'+h(ex.weight||'')+'" placeholder="–"></label><label>Reps<input type="number" min="0" step="1" inputmode="numeric" data-edit="ex:'+i+':reps" value="'+h(ex.reps||'')+'" placeholder="–"></label>')+'</div></div></article>';
}
function render(){
 var t=mode==='template',selectId=t?templateId:dayTemplateId;
 var html='<div class="pf-tabs"><button type="button" data-act="mode-template" aria-pressed="'+t+'">Mallpass</button><button type="button" data-act="mode-day" aria-pressed="'+(!t)+'">Dagens pass</button></div>';
 if(!t)html+='<div class="pf-overline">Planerad dag</div><div class="pf-day-nav"><button type="button" class="pf-icon" data-act="prev">‹</button><input type="date" data-select="date" value="'+h(day)+'" aria-label="Välj dag"><button type="button" class="pf-icon" data-act="next">›</button></div>';
 html+='<div class="pf-field"><div class="pf-overline">'+(t?'Välj mallpass':'Välj mallpass för dagen')+'</div><div class="pf-inline"><select data-select="'+(t?'template':'day-template')+'">'+templateOptions()+'</select><button type="button" class="pf-btn" data-act="'+(t?'new-template':'new-day')+'">＋ '+(t?'Ny mall':'Nytt pass')+'</button></div></div>';
 if(!t&&!draft.name&&!draft.exercises.length)html+='<div class="pf-intro"><strong>Ingen träning planerad</strong><p>Välj ett mallpass eller skapa ett nytt dagspass. Inga övningar fylls i automatiskt.</p></div>';
 else{
 html+='<div class="pf-field"><div class="pf-overline">'+(t?'Mallnamn (sparas när du lämnar fältet)':'Passnamn')+'</div><input class="pf-name" data-edit="name" maxlength="70" value="'+h(draft.name||'')+'" placeholder="Namnge passet"></div>';
 html+='<div class="pf-field"><div class="pf-overline">Träningsform</div><select data-edit="type">'+TYPES.concat(draft.type&&!TYPES.includes(draft.type)?[draft.type]:[]).map(function(v){return '<option value="'+h(v)+'"'+(v===draft.type?' selected':'')+'>'+h(v)+'</option>';}).join('')+'</select></div>';
 html+='<div class="pf-heading"><strong>Övningar · '+draft.exercises.length+'</strong><span class="pf-minor">Tryck på en övning för att redigera</span></div>'+
 (draft.exercises.length?draft.exercises.map(exerciseView).join(''):'<div class="pf-empty">Inga övningar ännu</div>')+
 '<button class="pf-btn" type="button" data-act="add">＋ Ny övning</button>';
 }
 html+='<div class="pf-copy"><div class="pf-actions"><button type="button" class="pf-btn" data-act="week">Planera vecka ↗</button>';
 if(!t&&draft.exercises.length)html+='<button class="pf-btn" type="button" data-act="copy-template">Spara som mallpass</button>';
 html+='</div></div><div class="pf-foot"><div class="pf-actions">';
 if(t&&templateId)html+='<button type="button" class="pf-btn pf-danger" data-act="delete-template">Ta bort mall</button>';
 if(!t&&planned()[day])html+='<button type="button" class="pf-btn pf-danger" data-act="clear-day">Rensa dagen</button>';
 html+='<button class="pf-btn pf-primary" type="button" data-act="save">'+(t?'Spara mallpass':'Spara dagspass')+'</button>';
 if(!t&&draft.exercises.length)html+='<button type="button" class="pf-btn" data-act="start">Spara &amp; starta ↗</button>';
 html+='</div></div><datalist id="pf-suggestions">'+suggestions()+'</datalist>';
 $('.pf-content').innerHTML=html;var picker=$('[data-select="'+(t?'template':'day-template')+'"]');if(picker)picker.value=selectId?String(selectId):'';
}
function edit(e){var path=e.target.dataset.edit;if(!path)return;var val=e.target.value;if(path==='name')draft.name=val;else if(path==='type')draft.type=val;else if(path.startsWith('ex:')){var parts=path.split(':'),ex=draft.exercises[Number(parts[1])];if(ex)ex[parts[2]]=val;}dirty=true;}
function entered(e){if(e.target.dataset.edit)edit(e);}
function blurred(e){if(e.target.dataset.edit==='name'&&mode==='template'&&String(draft.name||'').trim()&&dirty)saveTemplate(true);}
function changed(e){
 var x=e.target,a=x.dataset.select;if(x.dataset.edit){edit(e);return;}
 if(a==='date'){
  if(!x.value||!confirmDiscard()){x.value=day;return;}loadDay(x.value);render();
 }else if(a==='template'){
  if(!confirmDiscard()){x.value=String(templateId||'');return;}loadTemplate(x.value);render();
 }else if(a==='day-template'){
  if(!confirmDiscard()){x.value=String(dayTemplateId||'');return;}
  var t=templates().find(function(item){return String(item.id)===x.value;});
  if(t){dayTemplateId=t.id;setDraft({name:t.name,type:t.type||'Helkropp',exercises:t.exercises||[]});dirty=true;}
  else loadDay(day);
  render();
 }
}
function clicked(e){
 var el=e.target.closest('[data-act]');if(!el)return;var a=el.dataset.act,i=Number(el.dataset.index||0);
 if(a==='close'){close();return;}
 if(a==='mode-template'||a==='mode-day'){var m=a==='mode-template'?'template':'day';if(m===mode)return;if(!confirmDiscard())return;mode=m;if(m==='day')loadDay(day);else loadTemplate('');render();return;}
 if(a==='new-template'||a==='new-day'){if(!confirmDiscard())return;if(a==='new-template'){mode='template';loadTemplate('');}else{mode='day';dayTemplateId='';setDraft(blank());}render();var nm=$('[data-edit="name"]');if(nm)nm.focus();return;}
 if(a==='prev'||a==='next'){if(!confirmDiscard())return;loadDay(shift(day,a==='prev'?-1:1));render();return;}
 if(a==='expand'){expanded.has(i)?expanded.delete(i):expanded.add(i);render();return;}
 if(a==='kind'){if(draft.exercises[i]){draft.exercises[i].kind=el.dataset.kind;expanded.add(i);dirty=true;render();}return;}
 if(a==='remove'){draft.exercises.splice(i,1);expanded=new Set([...expanded].filter(function(j){return j!==i;}).map(function(j){return j>i?j-1:j;}));dirty=true;render();return;}
 if(a==='add'){var index=draft.exercises.length;draft.exercises.push({kind:'strength',name:'',sets:'',weight:'',reps:''});expanded.add(index);dirty=true;render();var name=$('[data-edit="ex:'+index+':name"]');if(name)name.focus();return;}
 if(a==='save'){if(mode==='template'?saveTemplate(false):saveDay(false))render();return;}
 if(a==='start'){if(!cleaned().length){message('Lägg till minst en övning.');return;}saveDay(false);window.pulsePlanBuilderReturnV3=null;modal.classList.remove('show');window.startWorkoutSessionForDate(day);return;}
 if(a==='delete-template'){var t=templates().find(function(x){return String(x.id)===String(templateId);});if(t&&confirm('Ta bort mallpasset "'+t.name+'"?')){window.saveTemplates(templates().filter(function(x){return String(x.id)!==String(templateId);}));loadTemplate('');render();message('Mallpass borttaget.');}return;}
 if(a==='clear-day'){if(!confirm('Ta bort passet för '+day+'?'))return;var all=planned();delete all[day];window.savePlannedSessions(all);var w=week(day),p=Object.assign({},window.getPlanForWeek(w));p[window.dayKeyFromISO(day)]='Vila';window.setPlanForWeek(w,p);loadDay(day);render();window.renderWeekGrid();return;}
 if(a==='copy-template'){var name=prompt('Namn på mallpasset:',draft.name||'Mitt mallpass');if(name&&name.trim()){var all=templates();all.push({id:Date.now(),name:name.trim(),type:draft.type,exercises:cleaned()});window.saveTemplates(all);message('Mallpass sparat.');}return;}
 if(a==='week'){if(!confirmDiscard())return;modal.classList.remove('show');dirty=false;
  if(window.pulsePlanBuilderReturnV3&&typeof window.pulsePlanReturnFromBuilderV3==='function')window.pulsePlanReturnFromBuilderV3();
  else{window.viewedMondayISO=week(day);window.openPlanModal();}
 }
}
window.PulseFamilyPlanner={open:open,close:close,version:'1.0'};
})();