/* Explicit helpers for surfaces removed from the DOM and measured disclosures. */
(function(){
'use strict';
if(window.SurfaceMotion)return;
const active=new WeakMap();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function measureChange(element,change){
 const from=element.getBoundingClientRect().height;
 active.get(element)?.cancel();
 change();
 const to=element.getBoundingClientRect().height;
 if(reduced()||!element.animate||from===to)return;
 const motion=element.animate([{height:from+'px',overflow:'hidden'},{height:to+'px',overflow:'hidden'}],{duration:to>from?190:150,easing:'cubic-bezier(.22,1,.36,1)'});
 active.set(element,motion);
 motion.finished.then(()=>{if(active.get(element)===motion)active.delete(element);}).catch(()=>{});
}
// Animate the real surface. Never clone the page or leave a miniature snapshot.
const motions=new WeakMap(),origins=new WeakMap(),disclosures=new WeakMap();
const ease='cubic-bezier(.22,1,.36,1)',exitEase='cubic-bezier(.4,0,.8,1)';
let lastTrigger=null,lastInteraction=0;
function rememberTrigger(event){
 const target=event.target instanceof Element?event.target:null;
 lastTrigger=target?.closest('button,summary,a,input,select,[role="button"],[data-date],.day-cell,.cal-day')||target;
 lastInteraction=performance.now();
}
document.addEventListener('pointerdown',rememberTrigger,true);
document.addEventListener('click',rememberTrigger,true);
function origin(panel,trigger,remember=true){
 const candidate=remember?(trigger||(performance.now()-lastInteraction<1500?lastTrigger:null)):null;
 if(candidate?.isConnected&&!candidate.matches('html,body')&&!panel.contains(candidate)){
  const rect=candidate.getBoundingClientRect();
  if(rect.width&&rect.height)origins.set(panel,{element:candidate,rect});
 }
 const saved=origins.get(panel);
 if(!saved)return null;
 const rect=saved.element.isConnected?saved.element.getBoundingClientRect():saved.rect;
 return rect.width&&rect.height&&rect.bottom>0&&rect.top<innerHeight?rect:null;
}
function animateSurface(panel,opening,trigger,done){
 const previous=motions.get(panel),style=getComputedStyle(panel);
 const current=previous?{translate:style.translate,scale:style.scale,opacity:style.opacity}:null;
 previous?.cancel();motions.delete(panel);
 panel.setAttribute('data-surface-panel','');
 if(reduced()||!panel.animate){done?.();return null;}
 // Layout is measured without animation; existing positioning transforms stay intact.
 panel.setAttribute('data-surface-measuring','');
 const rect=panel.getBoundingClientRect(),base=getComputedStyle(panel);
 const transform=new DOMMatrix(base.transform==='none'?undefined:base.transform);
 const pivot=base.transformOrigin.split(' ').map(parseFloat);
 const target=opening?origin(panel,trigger):origin(panel,null,false);
 const sx=target?Math.min(1,target.width/rect.width):.12,sy=target?Math.min(1,target.height/rect.height):.12;
 const dx=target?target.left-rect.left-(1-sx)*pivot[0]-(sx-1)*transform.e:0;
 const dy=target?target.top-rect.top-(1-sy)*pivot[1]-(sy-1)*transform.f:0;
 panel.removeAttribute('data-surface-measuring');
 if(!rect.width||!rect.height){done?.();return null;}
 const folded={translate:`${dx}px ${dy}px`,scale:`${sx} ${sy}`,opacity:0};
 const expanded={translate:'0px 0px',scale:'1 1',opacity:1};
 const motion=panel.animate([current||(opening?folded:expanded),opening?expanded:folded],{
  duration:opening?280:200,easing:opening?ease:exitEase,fill:'both'
 });
 motions.set(panel,motion);
 motion.finished.then(()=>{
  if(motions.get(panel)!==motion)return;
  motions.delete(panel);
  // Hide/remove first, cancel the filled frame in this same microtask: no end hold.
  done?.();motion.cancel();
 }).catch(()=>{});
 return motion;
}
function showDialog(dialog,modal=true,trigger){
 dialog.dataset.menuMotion='';dialog.dataset.surfaceDialog='';dialog.inert=false;
 if(!dialog.open)modal?dialog.showModal():dialog.show();
 animateSurface(dialog,true,trigger);
}
function closeDialog(dialog,done){
 if(!dialog?.open){done?.();return;}
 dialog.inert=true;
 animateSurface(dialog,false,null,()=>{dialog.close();dialog.inert=false;done?.();});
}
function remove(element){
 if(!element||element.hasAttribute('data-motion-removing'))return;
 element.inert=true;element.setAttribute('data-motion-removing','');
 animateSurface(element,false,null,()=>element.remove());
}
function setDetails(details,open){
 const previous=disclosures.get(details);
 const from=details.getBoundingClientRect().height;
 const panels=[...details.children].filter(e=>e.tagName!=='SUMMARY');
 const opacity=panels.map(e=>getComputedStyle(e).opacity);
 previous?.motions.forEach(a=>a.cancel());disclosures.delete(details);
 panels.forEach(e=>e.inert=false);
 if(reduced()){details.open=open;return;}
 // Measure the final natural size, then keep the native disclosure open only
 // for its closing pixels. No input values or child nodes are rebuilt.
 details.open=open;
 const to=details.getBoundingClientRect().height;
 details.open=true;
 const duration=open?190:150;
 const motions=panels.map((e,i)=>{
  e.inert=!open;
  return e.animate([{opacity:previous?opacity[i]:open?0:1},{opacity:open?1:0}],{duration,easing:ease});
 });
 if(from!==to)motions.push(details.animate([{height:from+'px',overflow:'clip'},{height:to+'px',overflow:'clip'}],{duration,easing:ease}));
 const state={open,motions};disclosures.set(details,state);
 Promise.all(motions.map(a=>a.finished)).then(()=>{
  if(disclosures.get(details)!==state)return;
  disclosures.delete(details);details.open=open;panels.forEach(e=>e.inert=false);
 }).catch(()=>{});
}
document.addEventListener('click',event=>{
 const summary=event.target.closest('summary');
 const details=summary?.parentElement;
 if(!details?.matches('details:not(.tools):not(.shopping-tools-menu):not(.packing-filter)')||event.defaultPrevented)return;
 if(event.target.closest('a,button,input,select,textarea'))return;
 event.preventDefault();setDetails(details,!(disclosures.get(details)?.open??details.open));
});
document.addEventListener('cancel',event=>{
 if(event.target.matches('dialog[data-surface-dialog]')&&!event.defaultPrevented){event.preventDefault();closeDialog(event.target);}
});
// Class/hidden-based surfaces retain their actual DOM for the closing frames.
// Observe only state mutations and affected subtrees, not animation frames.
const selectors=[
 '.modal-overlay','.day-tooltip','#exercise-plan-preview-v7','#session-between-overlay-v2','#session-pre-timer',
 '.packing-filter-panel','.custom-dropdown-menu','.notif-panel','.day-panel','.home-day-popover',
 '.fp-my-menu','.fp-floating-menu','.flatpickr-calendar','.calendar-month-menu-v3','.calendar-year-menu-v4',
 '.builder-exercise-name-menu','.exercise-name-picker-v1','.record-picker','.ft-add-options','#event-end-panel-v2',
 '.log-detail','.recipe-items'
].join(',');
const surfaces=new WeakMap();
function isOpen(el){
 if(el.hidden||el.getAttribute('aria-hidden')==='true'||el.hasAttribute('data-motion-removing'))return false;
 if(el.matches('[popover]'))return el.matches(':popover-open');
 if(el.matches('.calendar-month-menu-v3,.calendar-year-menu-v4'))return true;
 if(el.matches('.builder-exercise-name-menu,.record-picker,.ft-add-options,#event-end-panel-v2'))return getComputedStyle(el).display!=='none';
 if(el.matches('.log-detail'))return !!el.closest('.log-card.is-open');
 if(el.matches('.recipe-items'))return !!el.closest('.recipe-item.open');
 return el.matches('.show,.active,.open');
}
function syncSurface(el,initial=false){
 const open=isOpen(el),old=surfaces.get(el);
 if(old?.open===open)return;
 if(!old&&!open){surfaces.set(el,{open:false});return;}
 const panel=el.matches('.modal-overlay')?(el.querySelector(':scope > .modal,:scope > .session-shell')||el.firstElementChild||el):el;
 const state={open,panel,display:open?getComputedStyle(el).display:old?.display};
 surfaces.set(el,state);
 if(open){
  old?.release?.();
  el.removeAttribute('data-surface-closing');
  if(!initial)animateSurface(panel,true);
 }else if(!reduced()&&el.isConnected){
  // Inline important styles also retain surfaces with ID-specific [hidden] rules.
  const held={display:state.display||'block',visibility:'visible','pointer-events':'none'};
  const saved=Object.keys(held).map(key=>[key,el.style.getPropertyValue(key),el.style.getPropertyPriority(key)]);
  for(const [key,value] of Object.entries(held))el.style.setProperty(key,value,'important');
  state.release=()=>{for(const [key,value,priority] of saved){if(el.style.getPropertyValue(key)!==held[key])continue;value?el.style.setProperty(key,value,priority):el.style.removeProperty(key);}state.release=null;};
  el.setAttribute('data-surface-closing','');
  animateSurface(panel,false,null,()=>{if(surfaces.get(el)===state){state.release?.();el.removeAttribute('data-surface-closing');}});
 }else{old?.release?.();motions.get(panel)?.cancel();motions.delete(panel);el.removeAttribute('data-surface-closing');}
}
function watchSurfaces(){
 document.querySelectorAll(selectors).forEach(el=>syncSurface(el,true));
 new MutationObserver(records=>{
  const affected=new Set();
  for(const record of records){
   const el=record.target;
   if(!(el instanceof Element))continue;
   if(el.matches(selectors))affected.add(el);
   if(record.type==='childList')for(const node of record.addedNodes){
    if(!(node instanceof Element))continue;
    if(node.matches(selectors))affected.add(node);
    node.querySelectorAll(selectors).forEach(x=>affected.add(x));
   }
   else if(el.matches('.log-card,.recipe-item'))el.querySelectorAll(selectors).forEach(x=>affected.add(x));
  }
  affected.forEach(el=>{if(el.isConnected)syncSurface(el);});
 }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-hidden','style']});
 document.addEventListener('toggle',event=>{if(event.target.matches?.(selectors))syncSurface(event.target);},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchSurfaces,{once:true});else watchSurfaces();
window.SurfaceMotion={measureChange,remove,showDialog,closeDialog,setDetails,animateSurface};
})();
