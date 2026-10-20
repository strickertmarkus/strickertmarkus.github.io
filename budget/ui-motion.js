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
function remove(element){
 if(!element||element.hasAttribute('data-motion-removing'))return;
 element.inert=true;
 element.setAttribute('data-motion-removing','');
 // Capture transitions after style resolution, with no timeout racing a new menu.
 getComputedStyle(element).opacity;
 Promise.all(element.getAnimations().map(a=>a.finished.catch(()=>{}))).then(()=>element.remove());
}

const dialogMotions=new WeakMap(),closingDialogs=new WeakSet(),disclosures=new WeakMap();
const ease='cubic-bezier(.22,1,.36,1)';
function showDialog(dialog){
 closingDialogs.delete(dialog);
 const previous=dialogMotions.get(dialog),opacity=previous?getComputedStyle(dialog).opacity:0,translate=previous?getComputedStyle(dialog).translate:'0 -6px';
 previous?.cancel();dialogMotions.delete(dialog);
 dialog.dataset.menuMotion='';dialog.dataset.surfaceDialog='';dialog.inert=false;
 if(!dialog.open)dialog.showModal();
 if(reduced())return;
 const motion=dialog.animate([{opacity,translate},{opacity:1,translate:'none'}],{duration:190,easing:ease});
 dialogMotions.set(dialog,motion);
 motion.finished.then(()=>{if(dialogMotions.get(dialog)===motion)dialogMotions.delete(dialog);}).catch(()=>{});
}
function closeDialog(dialog){
 if(!dialog?.open||closingDialogs.has(dialog))return;
 const opacity=getComputedStyle(dialog).opacity,translate=getComputedStyle(dialog).translate;
 dialogMotions.get(dialog)?.cancel();dialogMotions.delete(dialog);
 if(reduced()){dialog.close();dialog.inert=false;return;}
 closingDialogs.add(dialog);dialog.inert=true;
 const motion=dialog.animate([{opacity,translate},{opacity:0,translate:'0 -6px'}],{duration:150,easing:ease});
 dialogMotions.set(dialog,motion);
 motion.finished.then(()=>{
  if(dialogMotions.get(dialog)!==motion)return;
  dialogMotions.delete(dialog);closingDialogs.delete(dialog);dialog.close();dialog.inert=false;
 }).catch(()=>{});
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
 if(event.target.matches('dialog.zen-dialog[data-surface-dialog]')&&!event.defaultPrevented){event.preventDefault();closeDialog(event.target);}
},true);
window.SurfaceMotion={measureChange,remove,showDialog,closeDialog,setDetails};
})();
