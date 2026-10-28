/* Classic Pulse Field pass builder — original editor plus reusable mallpass.
 * Preserves existing ex_templates / ex_plannedSessions storage for Maja & Markus. */
(function(){
'use strict';
var box=document.getElementById('day-workout-modal');
if(!box||typeof window.openDayWorkoutBuilder!=='function')return;
var mode='day',originDay='',editTemplateId='',nextId=0;
var byId=function(id){return document.getElementById(id);};
var getTemplates=function(){return window.getTemplates()||[];};
var saveTemplates=function(list){window.saveTemplates(list);};
var clone=function(data){return JSON.parse(JSON.stringify(data));};
var toast=function(text){if(window.showToast)window.showToast(text);};
function makeId(){
 var id=Date.now()+nextId++;
 while(getTemplates().some(function(t){return String(t.id)===String(id);}))id+=1;
 return id;
}
function rows(){
 var result=[];
 document.querySelectorAll('#day-workout-ex-list .ex-row-item').forEach(function(row){
  var ex=window.parseExerciseRow(row,'dw');
  if(ex)result.push(ex);
 });
 return result;
}
function setRows(exercises){
 var list=byId('day-workout-ex-list');
 list.innerHTML='';
 if(Array.isArray(exercises)&&exercises.length)exercises.forEach(function(ex){window.addDayWorkoutExRow(clone(ex));});
 else window.addDayWorkoutExRow();
}
function populateSelect(selected){
 var select=byId('day-workout-template-select');
 if(!select)return;
 select.textContent='';
 var ph=document.createElement('option');
 ph.value='';ph.textContent=getTemplates().length?'Välj mallpass':'Inga mallpass ännu';
 select.appendChild(ph);
 getTemplates().slice().sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'sv');}).forEach(function(t){
  var opt=document.createElement('option');opt.value=String(t.id);opt.textContent=t.name||t.type||'Mallpass';select.appendChild(opt);
 });
 select.value=selected!=null?String(selected):'';
 if(select.selectedIndex<0)select.value='';
 select.dataset.current=select.value;
 var editButton=byId('day-workout-edit-template');
 if(editButton)editButton.disabled=!select.value;
}
function refreshMode(){
 var editing=mode==='template';
 box.classList.toggle('classic-template-edit-mode',editing);
 var title=byId('day-workout-title');
 if(title&&editing)title.textContent=editTemplateId?'Redigera mallpass':'Skapa mallpass';
 var btn=box.querySelector('.classic-save-pass');
 if(btn)btn.textContent=editing?'Spara mallpass':'Spara passupplägg';
 var inline=byId('day-workout-inline-template');
 if(inline)inline.hidden=true;
 var back=byId('day-workout-back-day');
 if(back)back.hidden=!editing;
}
function syncDay(iso,p){
 mode='day';originDay=iso;editTemplateId='';
 populateSelect(p&&p.templateId);
 refreshMode();
}
function apply(id){
 if(mode==='template')backToDay();
 if(!id){
  var edit=byId('day-workout-edit-template');if(edit)edit.disabled=true;
  // Going back to "Välj mallpass" after a template was chosen empties the day:
  // its exercises came from that template, so they go too.
  var sel=byId('day-workout-template-select'),prev=sel&&sel.dataset.current;
  if(prev){
   var old=getTemplates().find(function(t){return String(t.id)===String(prev);});
   var nameEl=byId('day-workout-name');
   if(nameEl&&old&&nameEl.value===(old.name||old.type||''))nameEl.value='';
   setRows([]);
   sel.dataset.current='';
   toast('Mallpasset borttaget. Dagen är tom.');
  }
  return;
 }
 var found=getTemplates().find(function(t){return String(t.id)===String(id);});
 if(!found){populateSelect('');toast('Mallpasset finns inte längre.');return;}
 byId('day-workout-name').value=found.name||found.type||'';
 byId('day-workout-type').value=found.type||'Helkropp';
 setRows(found.exercises||[]);
 populateSelect(found.id);
 toast('Mallpass valt. Justera eller spara dagen.');
}
function openTemplate(id,date){
 originDay=date||originDay||byId('day-workout-date').value||window.todayISO();
 window.openDayWorkoutBuilder(window.dayLabelFromISO(originDay),originDay);
 mode='template';
 var tpl=id==null?null:getTemplates().find(function(t){return String(t.id)===String(id);});
 if(id!=null&&!tpl){toast('Mallpasset finns inte längre.');mode='day';refreshMode();return;}
 editTemplateId=tpl?tpl.id:'';
 byId('day-workout-name').value=tpl?tpl.name||'':'';
 byId('day-workout-type').value=tpl?tpl.type||'Helkropp':'Helkropp';
 setRows(tpl&&tpl.exercises||[]);
 populateSelect(editTemplateId);
 refreshMode();
 var name=byId('day-workout-name');
 if(name)name.focus({preventScroll:true});
}
function backToDay(){
 var day=originDay||byId('day-workout-date').value||window.todayISO();
 mode='day';editTemplateId='';
 window.loadDayWorkoutBuilder(day);
}
function updateLinkedNames(id,oldName,newName){
 if(!oldName||oldName===newName)return;
 var sessions=window.getPlannedSessions(),changed=false;
 Object.keys(sessions).forEach(function(day){
  var plan=sessions[day];
  if(plan&&String(plan.templateId)===String(id)&&plan.name===oldName){
   plan.name=newName;changed=true;
  }
 });
 if(changed)window.savePlannedSessions(sessions);
}
function saveTemplate(options){
 options=options||{};
 var name=String(byId('day-workout-name').value||'').trim().slice(0,70);
 if(!name){toast('Skriv ett namn på mallpasset.');byId('day-workout-name').focus();return false;}
 var list=getTemplates(),at=list.findIndex(function(t){return String(t.id)===String(editTemplateId);});
 var previous=at>=0?list[at]:null;
 var id=previous?previous.id:makeId();
 var entry=Object.assign({},previous||{},{
  id:id,name:name,type:String(byId('day-workout-type').value||'').trim()||'Helkropp',
  exercises:options.nameOnly&&previous?(previous.exercises||[]):options.nameOnly?[]:rows()
 });
 if(at>=0)list[at]=entry;else list.push(entry);
 saveTemplates(list);
 updateLinkedNames(id,previous&&previous.name,name);
 editTemplateId=id;
 populateSelect(id);
 refreshMode();
 if(!options.silent)toast('Mallpass sparat.');
 return true;
}
function saveAsTemplate(){
 if(mode==='template'){saveTemplate();return;}
 var inline=byId('day-workout-inline-template'),name=byId('day-workout-new-template-name');
 inline.hidden=false;name.value=String(byId('day-workout-name').value||'').trim();
 name.focus({preventScroll:true});name.select();
}
function confirmSaveAsTemplate(){
 var name=String(byId('day-workout-new-template-name').value||'').trim().slice(0,70);
 if(!name){toast('Ange ett namn för mallen.');byId('day-workout-new-template-name').focus();return;}
 var ex=rows();
 if(!ex.length){toast('Lägg till minst en namngiven övning först.');return;}
 var list=getTemplates(),id=makeId();
 list.push({id:id,name:name,type:String(byId('day-workout-type').value||'').trim()||'Helkropp',exercises:ex});
 saveTemplates(list);
 populateSelect(id);
 byId('day-workout-inline-template').hidden=true;
 toast('Mallpass sparat och valt.');
}
var originalSave=window.saveDayWorkoutPlan;
window.saveDayWorkoutPlan=function(){
 if(mode==='template')return saveTemplate();
 return originalSave.apply(this,arguments);
};
var originalStart=window.startDayWorkoutFromBuilder;
window.startDayWorkoutFromBuilder=function(){
 if(mode==='template'){saveTemplate();return;}
 return originalStart.apply(this,arguments);
};
byId('day-workout-name').addEventListener('blur',function(){
 if(mode!=='template')return;
 var val=this.value.trim();
 if(!val)return;
 var item=getTemplates().find(function(t){return String(t.id)===String(editTemplateId);});
 if(!item||item.name!==val)saveTemplate({silent:true,nameOnly:true});
});
byId('day-workout-new-template-name').addEventListener('keydown',function(event){
 if(event.key==='Enter'){event.preventDefault();confirmSaveAsTemplate();}
 if(event.key==='Escape'){byId('day-workout-inline-template').hidden=true;}
});
window.PulseClassicTemplates={syncDay:syncDay,openTemplate:openTemplate,apply:apply,backToDay:backToDay,saveAsTemplate:saveAsTemplate,confirmSaveAsTemplate:confirmSaveAsTemplate,saveTemplate:saveTemplate};
window.pulseClassicApplyTemplate=apply;
window.pulseClassicNewTemplate=function(){openTemplate(null);};
window.pulseClassicEditTemplate=function(){var id=byId('day-workout-template-select').value;if(id)openTemplate(id);};
window.pulseClassicBackToDay=backToDay;
window.pulseClassicSaveAsTemplate=saveAsTemplate;
window.pulseClassicConfirmSaveAsTemplate=confirmSaveAsTemplate;
})();