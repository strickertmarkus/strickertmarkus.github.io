/* Shared Zen identity and existing-routine planning for Markus and Maja. */
(function(){
'use strict';
var svg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19C6 19 3 15 3 10c4 0 7 2 9 6 2-4 5-6 9-6 0 5-3 9-9 9Z"/><path d="M12 16c-4-4-4-8 0-12 4 4 4 8 0 12Z"/></svg>';
var kind=function(type){return /meditation/i.test(type||'')?'meditation':/stretch/i.test(type||'')?'stretch':'';};
window.PulseZen={kind:kind,icon:function(k){return '<span class="pulse-zen-icon" data-zen-kind="'+k+'">'+svg+'</span>';},url:function(plan){var url=new URL('zen.html',document.baseURI);url.searchParams.set('wellness',plan.zenRoutine.kind);url.searchParams.set('routine',plan.zenRoutine.id);if(new URLSearchParams(location.search).get('user')==='maja')url.searchParams.set('user','maja');return url.href;}};
function install(){
 var box=document.getElementById('day-workout-modal');if(!box)return;
 var picker=document.createElement('details');picker.className='pulse-zen-picker';
 picker.innerHTML='<summary aria-label="Välj färdigt stretch- eller meditationspass">'+PulseZen.icon('stretch')+'<span>Välj Zen-pass</span></summary><div class="pulse-zen-options"></div>';
 box.querySelector('.classic-pass-fields').after(picker);
 picker.querySelector('summary').addEventListener('click',function(event){event.preventDefault();event.stopPropagation();if(window.SurfaceMotion)SurfaceMotion.setDetails(picker,!picker.open);else picker.open=!picker.open;});
 var current=document.createElement('div');current.className='pulse-zen-current';picker.before(current);
 function showCurrent(){var plan=getPlannedSessions()[box.dataset.date];current.textContent='';if(!plan||!plan.zenRoutine||box.classList.contains('classic-template-edit-mode'))return;var a=document.createElement('a');a.href=PulseZen.url(plan);a.target='_top';a.innerHTML=PulseZen.icon(plan.zenRoutine.kind);a.appendChild(document.createTextNode(plan.name+' · Öppna i Zen'));current.appendChild(a);}
 var options=picker.querySelector('.pulse-zen-options');
 ['stretch','meditation'].forEach(function(k){var title=document.createElement('h3');title.textContent=k==='stretch'?'Stretch':'Meditation';options.appendChild(title);ZenModel.routines.filter(function(r){return r.kind===k;}).forEach(function(r){var b=document.createElement('button');b.type='button';b.dataset.zenRoutine=r.id;b.innerHTML=PulseZen.icon(k);var label=document.createElement('span');label.textContent=r.name+' · '+Math.round(ZenModel.duration(r)/60)+' min';b.appendChild(label);b.onclick=function(){
 var date=box.dataset.date;if(!date)return;
 var all=getPlannedSessions(),type=k==='stretch'?'Stretch':'Meditation';
 all[date]={type:type,name:r.name,zenRoutine:JSON.parse(JSON.stringify(r)),exercises:[]};savePlannedSessions(all);
 var monday=mondayISOOf(date),plan=Object.assign({},getPlanForWeek(monday));plan[dayKeyFromISO(date)]=type;setPlanForWeek(monday,plan);
 picker.open=false;closeModal('day-workout-modal');if(pulsePlanBuilderReturnV3)pulsePlanReturnFromBuilderV3();refreshAll();showToast(type+' planerad.');
 };options.appendChild(b);});});
 new MutationObserver(function(){if(!box.classList.contains('show'))picker.open=false;showCurrent();}).observe(box,{attributes:true,attributeFilter:['class','data-date']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
