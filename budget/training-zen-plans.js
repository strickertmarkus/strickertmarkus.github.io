/* Shared Zen identity and existing-routine planning for Markus and Maja. */
(function(){
'use strict';
var svg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19C6 19 3 15 3 10c4 0 7 2 9 6 2-4 5-6 9-6 0 5-3 9-9 9Z"/><path d="M12 16c-4-4-4-8 0-12 4 4 4 8 0 12Z"/></svg>';
var kind=function(type){return /meditation/i.test(type||'')?'meditation':/stretch/i.test(type||'')?'stretch':'';};
window.PulseZen={kind:kind,icon:function(k){return '<span class="pulse-zen-icon" data-zen-kind="'+k+'">'+svg+'</span>';},url:function(plan){var url=new URL('zen.html',document.baseURI),list=PulseZen.list(plan);url.searchParams.set('wellness',list[0].kind);url.searchParams.set('routine',list[0].id);if(list.length>1)url.searchParams.set('then',list.slice(1).map(function(r){return r.id;}).join(','));if(new URLSearchParams(location.search).get('user')==='maja')url.searchParams.set('user','maja');return url.href;}};
// A day can hold several stretch or meditation passes: zenRoutines (zenRoutine is the first).
PulseZen.list=function(plan){var l=plan&&Array.isArray(plan.zenRoutines)&&plan.zenRoutines.length?plan.zenRoutines:plan&&plan.zenRoutine?[plan.zenRoutine]:[];return l.filter(Boolean);};
PulseZen.duration=function(plan){return PulseZen.list(plan).reduce(function(sum,r){return sum+ZenModel.duration(r);},0);};
var escape=function(value){return String(value||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
var clone=function(value){return value==null?null:JSON.parse(JSON.stringify(value));};
var label=function(k){return k==='stretch'?'Stretch':'Meditation';};
function routines(k,query){var q=String(query||'').trim().toLocaleLowerCase('sv-SE');return ZenModel.routines.filter(function(r){return r.kind===k&&(!q||(k+' '+r.name).toLocaleLowerCase('sv-SE').indexOf(q)>=0);});}
function session(id){var r=ZenModel.routines.find(function(r){return r.id===id;});return r?{type:label(r.kind),name:r.name,zenRoutine:clone(r),exercises:[]}:null;}
PulseZen.session=session;
PulseZen.modeFor=function(record){var value=record&&record.session||record;if(!value)return '';if(value.zenRoutine)return kind(value.zenRoutine.kind);if((value.exercises||[]).length)return '';return /^(stretch|meditation)$/i.test(value.type||'')?kind(value.type):'';};
PulseZen.controls=function(selected,plannerIndex){return '<div class="pulse-zen-modes" role="group" aria-label="Passläge">'+['stretch','meditation'].map(function(k){return '<button type="button" class="pulse-zen-mode" data-zen-mode="'+k+'"'+(plannerIndex!=null?' data-zen-day="'+plannerIndex+'"':'')+' aria-label="'+label(k)+'" aria-pressed="'+String(selected===k)+'" title="'+label(k)+'">'+PulseZen.icon(k)+'<span>'+label(k)+'</span></button>';}).join('')+'</div>';};
PulseZen.selectOptions=function(selected,k){return '<option value=""'+(!selected?' selected':'')+' disabled>Välj '+(k==='stretch'?'stretchpass':'meditationspass')+'</option>'+routines(k).map(function(r){return '<option value="zen:'+escape(r.id)+'"'+(r.id===selected?' selected':'')+'>'+escape(r.name)+' · '+Math.round(ZenModel.duration(r)/60)+' min</option>';}).join('');};
PulseZen.planDraft=function(index,id){
 var record=session(id),entry=pulsePlanWeekDraftV2(planTargetMondayISO)[index];if(!record||!entry||PulseZen.modeFor(entry)!==record.zenRoutine.kind)return;
 pulsePlanDirtyWeeks[planTargetMondayISO]=true;entry.type=record.type;entry.session=record;pulsePlanRenderV2();
};
PulseZen.setPlannerMode=function(index,k){
 var entry=pulsePlanWeekDraftV2(planTargetMondayISO)[index];if(!entry)return;
 var current=PulseZen.modeFor(entry);
 if(!current)entry.trainingType=entry.type;
 pulsePlanSetTypeV2(index,current===k?(entry.trainingType||'Helkropp'):label(k));
};
var builder={mode:'',routines:[],saved:{},picking:false},box,panel,controls;
function namesOf(list){return list.map(function(r){return r.name;}).join(' + ');}
function byId(id){return document.getElementById(id);}
PulseZen.builderKind=function(){return builder.mode;};
PulseZen.builderRecord=function(){
 if(!builder.mode||!builder.routines.length)return null;
 return {type:label(builder.mode),name:(byId('day-workout-name').value||namesOf(builder.routines)).trim(),zenRoutine:clone(builder.routines[0]),zenRoutines:clone(builder.routines),exercises:[]};
};
PulseZen.loadBuilder=function(record){
 builder={mode:PulseZen.modeFor(record),routines:clone(PulseZen.list(record))||[],saved:{},picking:false};
 if(panel)panel.querySelector('input').value='';
 syncBuilder();
};
function kindWord(){return builder.mode==='stretch'?'stretchpass':'meditationspass';}
/* The chosen passes as rows, like exercises in the builder, with "+ Lägg till" below.
   The list of passes to choose from opens under the add row. */
function syncBuilder(){
 if(!box)return;
 box.dataset.zenMode=builder.mode||'training';
 controls.innerHTML=PulseZen.controls(builder.mode);
 panel.hidden=!builder.mode;
 if(!builder.mode)return;
 panel.dataset.zenKind=builder.mode;
 var list=builder.routines;
 panel.querySelector('.pulse-zen-rows').innerHTML=list.map(function(r,i){
  return '<div class="pulse-zen-row"><span class="pulse-zen-row-icon">'+PulseZen.icon(r.kind)+'</span><span class="pulse-zen-row-text"><strong>'+escape(r.name)+'</strong><small>'+Math.round(ZenModel.duration(r)/60)+' min'+(r.steps?' · '+r.steps.length+' övningar':'')+'</small></span>'
   +'<span class="pulse-zen-row-tools">'+(i>0?'<button type="button" data-zen-up="'+i+'" aria-label="Flytta upp '+escape(r.name)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg></button>':'')
   +'<button type="button" data-zen-remove="'+i+'" aria-label="Ta bort '+escape(r.name)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span></div>';
 }).join('');
 var add=panel.querySelector('.pulse-zen-add');
 add.querySelector('span:last-child').textContent=list.length?'Lägg till '+kindWord():'Välj '+kindWord();
 add.setAttribute('aria-expanded',String(builder.picking));
 panel.querySelector('.pulse-zen-routines').hidden=!builder.picking;
 var link=panel.querySelector('.pulse-zen-current');
 link.hidden=!list.length;
 if(list.length){link.href=PulseZen.url({zenRoutines:list});link.textContent='Öppna i Zen';}else{link.removeAttribute('href');link.textContent='';}
 renderRoutines();
}
function renderRoutines(){
 if(!panel||!builder.mode||!builder.picking)return;
 var list=routines(builder.mode,panel.querySelector('input').value);
 panel.querySelector('.pulse-zen-group-options').innerHTML=list.map(function(r){var chosen=builder.routines.some(function(x){return x.id===r.id;});return '<button type="button" data-zen-routine="'+escape(r.id)+'" aria-pressed="'+chosen+'"'+(chosen?' disabled':'')+'>'+PulseZen.icon(r.kind)+'<span>'+escape(r.name)+'<small>'+Math.round(ZenModel.duration(r)/60)+' min'+(chosen?' · tillagt':'')+'</small></span></button>';}).join('')||'<p class="pulse-zen-empty">Inga pass matchar sökningen.</p>';
}
function renameAfter(before){
 var name=byId('day-workout-name');
 if(!name.value||name.value===label(builder.mode)||name.value===before)name.value=namesOf(builder.routines)||label(builder.mode);
}
PulseZen.setBuilderMode=function(k){
 var previous=builder.mode||'training',next=builder.mode===k?'':k;
 builder.saved[previous]={name:byId('day-workout-name').value,type:byId('day-workout-type').value,template:byId('day-workout-template-select').value,routines:clone(builder.routines)};
 var restored=builder.saved[next||'training'];
 builder.mode=next;builder.routines=restored&&restored.routines?clone(restored.routines):[];
 byId('day-workout-name').value=restored?restored.name:next?label(next):'';
 byId('day-workout-type').value=restored?restored.type:next?label(next):'Helkropp';
 if(window.PulseClassicTemplates)PulseClassicTemplates.refreshChoices(restored&&restored.template||'');
 builder.picking=false;if(panel)panel.querySelector('input').value='';syncBuilder();
 byId('day-workout-type').dispatchEvent(new Event('input',{bubbles:true}));
};
function install(){
 box=byId('day-workout-modal');if(!box)return;
 controls=document.createElement('div');controls.className='pulse-zen-builder-modes';box.querySelector('.modal').appendChild(controls);
 controls.addEventListener('click',function(event){var button=event.target.closest('[data-zen-mode]');if(button)PulseZen.setBuilderMode(button.dataset.zenMode);});
 panel=document.createElement('div');panel.className='pulse-zen-builder';panel.hidden=true;
 panel.innerHTML='<div class="pulse-zen-rows"></div><button type="button" class="pulse-zen-add" aria-expanded="false"><span class="pulse-zen-add-plus" aria-hidden="true"></span><span></span></button><div class="pulse-zen-routines" hidden><input type="search" placeholder="Sök pass" aria-label="Sök pass" autocomplete="off"><div class="pulse-zen-group-options"></div></div><a class="pulse-zen-current" target="_top" hidden></a>';
 box.querySelector('.classic-exercises').before(panel);
 panel.querySelector('input').addEventListener('input',renderRoutines);
 panel.addEventListener('click',function(event){
  var t=event.target;
  if(t.closest('.pulse-zen-add')){builder.picking=!builder.picking;syncBuilder();if(builder.picking)panel.querySelector('input').focus({preventScroll:true});return;}
  var remove=t.closest('[data-zen-remove]');
  if(remove){var before=namesOf(builder.routines);builder.routines.splice(Number(remove.dataset.zenRemove),1);renameAfter(before);syncBuilder();return;}
  var up=t.closest('[data-zen-up]');
  if(up){var i=Number(up.dataset.zenUp),before2=namesOf(builder.routines);var moved=builder.routines.splice(i,1)[0];builder.routines.splice(i-1,0,moved);renameAfter(before2);syncBuilder();return;}
  var button=t.closest('[data-zen-routine]');if(!button||button.disabled)return;
  var record=session(button.dataset.zenRoutine);if(!record||record.zenRoutine.kind!==builder.mode)return;
  var before3=namesOf(builder.routines);builder.routines.push(record.zenRoutine);renameAfter(before3);
  builder.picking=false;panel.querySelector('input').value='';syncBuilder();
 });
 var planner=byId('plan-days');if(planner)planner.addEventListener('click',function(event){var button=event.target.closest('[data-zen-day]');if(button)PulseZen.setPlannerMode(Number(button.dataset.zenDay),button.dataset.zenMode);});
 syncBuilder();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
