/* Pulse motion for the training page and its tools (Markus & Maja).
 * - Surfaces open as a circle growing out of the tapped control and close back
 *   into it, like the Home page's morph.
 * - Main actions answer a tap with a soft pulsing ring at the finger.
 * - Panels that unfold (log entries, the record picker) grow and shrink smoothly.
 * Loaded on exercise.html (host) and archive/exercise.html (tools in the iframe).
 */
(function(){
'use strict';
if(window.PulseMotion)return;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease='cubic-bezier(.34,.1,.22,1)';
let lastPoint=null,lastTarget=null;

function centre(el){
 if(!el||!el.getBoundingClientRect)return null;
 const r=el.getBoundingClientRect();
 if(!r.width&&!r.height)return null;
 return {x:r.left+r.width/2,y:r.top+r.height/2,r:Math.min(36,Math.max(14,Math.hypot(r.width,r.height)/2))};
}
function originFor(el){
 const c=centre(el);
 if(c&&c.y>-20&&c.y<innerHeight+20)return c;
 if(lastPoint&&performance.now()-lastPoint.t<1200)return {x:lastPoint.x,y:lastPoint.y,r:22};
 return {x:innerWidth/2,y:innerHeight*.62,r:22};
}
function circles(o){
 const far=Math.hypot(Math.max(o.x,innerWidth-o.x),Math.max(o.y,innerHeight-o.y))+16;
 const at=' at '+o.x.toFixed(1)+'px '+o.y.toFixed(1)+'px)';
 return {small:'circle('+o.r.toFixed(1)+'px'+at,full:'circle('+far.toFixed(1)+'px'+at};
}
const running=new WeakMap();
function stop(el){const a=running.get(el);if(a)a.forEach(m=>m.cancel());running.delete(el);}
/* Grow `el` (already displayed) out of `from` (an element or a point). */
function reveal(el,from){
 stop(el);
 if(reduced()||!el.animate)return Promise.resolve();
 const o=from&&from.x!=null?from:originFor(from||lastTarget),c=circles(o);
 const inner=el.firstElementChild;
 const anims=[el.animate([{clipPath:c.small},{clipPath:c.full}],{duration:300,easing:ease})];
 if(inner&&inner.animate)anims.push(inner.animate([{transform:'scale(.965)',opacity:.4},{transform:'none',opacity:1}],{duration:300,easing:ease}));
 running.set(el,anims);el.dataset.pmFrom=JSON.stringify(o);
 return Promise.all(anims.map(a=>a.finished)).catch(()=>{}).then(()=>running.delete(el));
}
/* Shrink `el` back into where it came from (or `to`); resolves when hidden. */
function conceal(el,to){
 stop(el);
 if(reduced()||!el.animate)return Promise.resolve();
 let o=to&&to.x!=null?to:to?originFor(to):null;
 if(!o){try{o=JSON.parse(el.dataset.pmFrom||'null');}catch(_){o=null;}}
 if(!o)o={x:innerWidth/2,y:innerHeight*.62,r:22};
 const c=circles(o),inner=el.firstElementChild;
 const anims=[el.animate([{clipPath:c.full},{clipPath:c.small,opacity:.6}],{duration:240,easing:'cubic-bezier(.5,0,.75,0)',fill:'forwards'})];
 if(inner&&inner.animate)anims.push(inner.animate([{transform:'none',opacity:1},{transform:'scale(.97)',opacity:.2}],{duration:240,easing:'cubic-bezier(.5,0,.75,0)',fill:'forwards'}));
 running.set(el,anims);
 // Hold the final small circle while the caller hides the surface, so no full frame flashes in between.
 return Promise.all(anims.map(a=>a.finished)).catch(()=>{}).then(()=>{el.style.clipPath=c.small;el.style.opacity='0';anims.forEach(a=>a.cancel());running.delete(el);});
}

/* A soft ring at the finger on main actions. */
const PULSE='[data-field-action],.start-orbit,.field-explore-entry,.today-play,.week-day,'+
 '.btn-primary,.session-cta,.pt-add,.pbu-add,.pbu-confirm-ok,.exercise-name-picker-new-v1,.pk-pulse';
function ring(x,y,warm){
 const dot=document.createElement('span');
 dot.className='pm-ring'+(warm?'':' is-cool');dot.style.left=x+'px';dot.style.top=y+'px';
 document.body.appendChild(dot);
 const done=()=>dot.remove();
 if(dot.animate){dot.animate([{transform:'translate(-50%,-50%) scale(.25)',opacity:.95},{transform:'translate(-50%,-50%) scale(1.6)',opacity:0}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'}).finished.then(done,done);}
 else setTimeout(done,520);
}
// The ring answers a tap, not a scroll: it waits for the finger to lift without
// having moved (or for a mouse click), so swiping through the log never pulses.
let press=null;
document.addEventListener('pointerdown',event=>{
 lastPoint={x:event.clientX,y:event.clientY,t:performance.now()};
 lastTarget=event.target.closest&&event.target.closest('button,a,[role="button"],[data-field-action],input,select,label')||null;
 press=null;
 if(reduced()||event.button>0)return;
 const hit=event.target.closest&&event.target.closest(PULSE);
 if(!hit||hit.disabled)return;
 press={x:event.clientX,y:event.clientY,t:performance.now(),cool:!!hit.closest('.is-cardio,[data-kind="cardio"]')};
},{capture:true,passive:true});
document.addEventListener('pointermove',event=>{if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>8)press=null;},{capture:true,passive:true});
['pointercancel','scroll'].forEach(type=>document.addEventListener(type,()=>{press=null;},{capture:true,passive:true}));
document.addEventListener('pointerup',event=>{
 const p=press;press=null;
 if(!p||performance.now()-p.t>600)return;
 ring(p.x,p.y,!p.cool);
},{capture:true,passive:true});

/* Panels that unfold grow from their old size (uses SurfaceMotion when present). */
function measure(el,change){
 if(window.SurfaceMotion&&window.SurfaceMotion.measureChange){window.SurfaceMotion.measureChange(el,change);}
 else change();
 if(reduced())return;
 el.querySelectorAll(':scope [data-pm-unfold]:not([hidden])').forEach(p=>p.animate&&p.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'}));
}

/* Inside the tools: every full-screen window reveals from the tap that opened it. */
function watchOverlays(){
 const seen=new WeakSet();
 const isOpen=el=>el.classList.contains('show');
 const observer=new MutationObserver(records=>{
  records.forEach(r=>{
   const el=r.target;
   if(r.type!=='attributes')return;
   const was=(r.oldValue||'').split(/\s+/).includes('show');
   if(!was&&isOpen(el))reveal(el);
  });
 });
 const attach=el=>{if(seen.has(el))return;seen.add(el);observer.observe(el,{attributes:true,attributeFilter:['class'],attributeOldValue:true});};
 const scan=root=>root.querySelectorAll&&root.querySelectorAll('.modal-overlay,#exercise-name-picker-v1,.pbu-confirm').forEach(attach);
 scan(document);
 new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType!==1)return;if(n.matches('.modal-overlay,#exercise-name-picker-v1,.pbu-confirm'))attach(n);scan(n);})))
  .observe(document.body,{childList:true,subtree:true});
}
if(document.body&&document.getElementById('pulse-page'))watchOverlays();
else document.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('pulse-page'))watchOverlays();},{once:true});

/* Host page: the way into the exercise explorer grows into its dark sky first. */
document.addEventListener('click',event=>{
 const link=event.target.closest&&event.target.closest('a.field-explore-entry,a#menu-explore-training');
 if(!link||reduced()||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||!document.body.animate)return;
 event.preventDefault();
 const veil=document.createElement('div');veil.className='pm-veil';veil.innerHTML='<i></i>';document.body.appendChild(veil);
 reveal(veil,link.querySelector('.field-explore-star')||link).then(()=>{location.href=link.href;});
 // Coming back with the browser's Back keeps no stale veil on screen.
 addEventListener('pageshow',()=>veil.remove(),{once:true});
});
window.PulseMotion={reveal,conceal,measure,ring,originFor};
})();
