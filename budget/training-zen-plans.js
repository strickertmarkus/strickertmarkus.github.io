/* Shared Zen identity and existing-routine planning for Markus and Maja. */
(function(){
'use strict';
var svg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19C6 19 3 15 3 10c4 0 7 2 9 6 2-4 5-6 9-6 0 5-3 9-9 9Z"/><path d="M12 16c-4-4-4-8 0-12 4 4 4 8 0 12Z"/></svg>';
var kind=function(type){return /meditation/i.test(type||'')?'meditation':/stretch/i.test(type||'')?'stretch':'';};
window.PulseZen={kind:kind,icon:function(k){return '<span class="pulse-zen-icon" data-zen-kind="'+k+'">'+svg+'</span>';},url:function(plan){var url=new URL('zen.html',document.baseURI);url.searchParams.set('wellness',plan.zenRoutine.kind);url.searchParams.set('routine',plan.zenRoutine.id);if(new URLSearchParams(location.search).get('user')==='maja')url.searchParams.set('user','maja');return url.href;}};
var escape=function(value){return String(value).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
function routines(k,query){var q=String(query||'').trim().toLocaleLowerCase('sv-SE');return ZenModel.routines.filter(function(r){return r.kind===k&&(!q||(k+' '+r.name).toLocaleLowerCase('sv-SE').indexOf(q)>=0);});}
function findRoutine(id){return ZenModel.routines.find(function(r){return r.id===id;});}
function session(id){var r=findRoutine(id);return r?{type:r.kind==='stretch'?'Stretch':'Meditation',name:r.name,zenRoutine:JSON.parse(JSON.stringify(r)),exercises:[]}:null;}
PulseZen.session=session;
PulseZen.options=function(query){
 return ['stretch','meditation'].map(function(k){var list=routines(k,query);if(!list.length)return '';return '<details class="pulse-zen-group" data-zen-kind="'+k+'"'+(String(query||'').trim()?' open':'')+'><summary>'+PulseZen.icon(k)+'<span>'+(k==='stretch'?'Stretch':'Meditation')+'</span><small>'+list.length+' pass</small></summary><div class="pulse-zen-group-options">'+list.map(function(r){return '<button type="button" data-zen-routine="'+escape(r.id)+'">'+PulseZen.icon(k)+'<span>'+escape(r.name)+'<small>Färdigt pass · '+Math.round(ZenModel.duration(r)/60)+' min</small></span></button>';}).join('')+'</div></details>';}).join('');
};
PulseZen.selectOptions=function(selected){return ['stretch','meditation'].map(function(k){return '<optgroup label="'+(k==='stretch'?'Stretch':'Meditation')+'" data-zen-kind="'+k+'">'+routines(k).map(function(r){return '<option value="zen:'+escape(r.id)+'"'+(r.id===selected?' selected':'')+'>'+escape(r.name)+' · '+Math.round(ZenModel.duration(r)/60)+' min</option>';}).join('')+'</optgroup>';}).join('');};
PulseZen.canPlan=function(row){var box=row&&row.closest('#day-workout-modal');return !!(box&&!box.classList.contains('classic-template-edit-mode'));};
PulseZen.planDay=function(id){
 var box=document.getElementById('day-workout-modal');if(!PulseZen.canPlan(box))return;
 var record=session(id),date=box.dataset.date;if(!record||!date)return;
 var all=getPlannedSessions();all[date]=record;savePlannedSessions(all);
 var monday=mondayISOOf(date),plan=Object.assign({},getPlanForWeek(monday));plan[dayKeyFromISO(date)]=record.type;setPlanForWeek(monday,plan);
 closeModal('day-workout-modal');if(pulsePlanBuilderReturnV3)pulsePlanReturnFromBuilderV3();refreshAll();showToast(record.type+' planerad.');
};
PulseZen.planDraft=function(index,id){
 var record=session(id),entry=pulsePlanWeekDraftV2(planTargetMondayISO)[index];if(!record||!entry)return;
 pulsePlanDirtyWeeks[planTargetMondayISO]=true;entry.type=record.type;entry.session=record;pulsePlanRenderV2();
};
function install(){
 var box=document.getElementById('day-workout-modal');if(!box)return;
 var current=document.createElement('div');current.className='pulse-zen-current';box.querySelector('.classic-pass-fields').after(current);
 function showCurrent(){var plan=getPlannedSessions()[box.dataset.date];current.textContent='';if(!plan||!plan.zenRoutine||box.classList.contains('classic-template-edit-mode'))return;var a=document.createElement('a');a.href=PulseZen.url(plan);a.target='_top';a.innerHTML=PulseZen.icon(plan.zenRoutine.kind);a.appendChild(document.createTextNode(plan.name+' · Öppna i Zen'));current.appendChild(a);}
 new MutationObserver(showCurrent).observe(box,{attributes:true,attributeFilter:['class','data-date']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
