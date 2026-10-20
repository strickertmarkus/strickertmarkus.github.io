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
window.SurfaceMotion={measureChange,remove};
})();
