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
// Circle geometry in the element's own box (works for full-screen and small surfaces).
function circles(o,el){
 const b=el&&el.getBoundingClientRect?el.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerHeight};
 const w=b.width||innerWidth,h=b.height||innerHeight,x=o.x-b.left,y=o.y-b.top;
 const far=Math.hypot(Math.max(Math.abs(x),Math.abs(w-x)),Math.max(Math.abs(y),Math.abs(h-y)))+16;
 const at=' at '+x.toFixed(1)+'px '+y.toFixed(1)+'px)';
 return {small:'circle('+o.r.toFixed(1)+'px'+at,full:'circle('+far.toFixed(1)+'px'+at};
}
const running=new WeakMap();
function stop(el){const a=running.get(el);if(a)a.forEach(m=>m.cancel());running.delete(el);}
/* Grow `el` (already displayed) out of `from` (an element or a point). */
function reveal(el,from,ms){
 stop(el);
 if(reduced()||!el.animate)return Promise.resolve();
 el.style.clipPath='';el.style.opacity='';
 const o=from&&from.x!=null?from:originFor(from||lastTarget),c=circles(o,el);
 const inner=el.firstElementChild;
 const d=ms||300;
 const anims=[el.animate([{clipPath:c.small},{clipPath:c.full}],{duration:d,easing:ease,fill:ms?'forwards':'none'})];
 if(inner&&inner.animate)anims.push(inner.animate([{transform:'scale(.965)',opacity:.4},{transform:'none',opacity:1}],{duration:d,easing:ease}));
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
 const c=circles(o,el),inner=el.firstElementChild;
 const anims=[el.animate([{clipPath:c.full},{clipPath:c.small,opacity:.6}],{duration:240,easing:'cubic-bezier(.5,0,.75,0)',fill:'forwards'})];
 if(inner&&inner.animate)anims.push(inner.animate([{transform:'none',opacity:1},{transform:'scale(.97)',opacity:.2}],{duration:240,easing:'cubic-bezier(.5,0,.75,0)',fill:'forwards'}));
 running.set(el,anims);
 // Hold the final small circle while the caller hides the surface, so no full frame flashes in between.
 return Promise.all(anims.map(a=>a.finished)).catch(()=>{}).then(()=>{el.style.clipPath=c.small;el.style.opacity='0';anims.forEach(a=>a.cancel());running.delete(el);});
}

/* A soft ring at the finger on main actions. */
const PULSE='[data-field-action],.start-orbit,.field-explore-entry,.today-play,.week-day,'+
 '.btn-primary,.session-cta,.pt-add,.pbu-add,.pbu-confirm-ok,.exercise-name-picker-new-v1,.pk-pulse,'+
 // the exercise explorer
 '.st-cta,.st-rail-btn,.st-program,[data-start-at],.gm-find-btn,.gm-find-row,.muscle-map-label,#muscle-map-open,[data-map-exercise]';
function ring(x,y,warm){
 const dot=document.createElement('span');
 dot.className='pm-ring'+(warm?'':' is-cool');dot.style.left=x+'px';dot.style.top=y+'px';
 document.body.appendChild(dot);
 const done=()=>dot.remove();
 if(dot.animate){dot.animate([{transform:'translate(-50%,-50%) scale(.25)',opacity:.95},{transform:'translate(-50%,-50%) scale(1.6)',opacity:0}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'}).finished.then(done,done);}
 else setTimeout(done,520);
 return dot;
}
// The ring appears the moment the finger lands (as before); if the touch turns
// into a scroll it fades out at once instead of finishing its pulse.
let pressRing=null,pressAt=null;
document.addEventListener('pointerdown',event=>{
 lastPoint={x:event.clientX,y:event.clientY,t:performance.now()};
 lastTarget=event.target.closest&&event.target.closest('button,a,[role="button"],[data-field-action],input,select,label')||null;
 pressRing=null;
 if(reduced()||event.button>0)return;
 const hit=event.target.closest&&event.target.closest(PULSE);
 if(!hit||hit.disabled)return;
 pressAt={x:event.clientX,y:event.clientY};
 pressRing=ring(event.clientX,event.clientY,!hit.closest('.is-cardio,[data-kind="cardio"]'));
},{capture:true,passive:true});
const dropRing=()=>{const r=pressRing;pressRing=null;if(r&&r.isConnected&&r.animate){r.getAnimations().forEach(a=>a.cancel());r.animate([{opacity:.5},{opacity:0}],{duration:90,fill:'forwards'}).finished.then(()=>r.remove(),()=>r.remove());}};
document.addEventListener('pointermove',event=>{if(pressRing&&pressAt&&Math.hypot(event.clientX-pressAt.x,event.clientY-pressAt.y)>8)dropRing();},{capture:true,passive:true});
document.addEventListener('pointercancel',dropRing,{capture:true,passive:true});
document.addEventListener('scroll',dropRing,{capture:true,passive:true});

/* Panels that unfold grow from their old size (uses SurfaceMotion when present). */
function measure(el,change){
 if(window.SurfaceMotion&&window.SurfaceMotion.measureChange){window.SurfaceMotion.measureChange(el,change);}
 else change();
 if(reduced())return;
 el.querySelectorAll(':scope [data-pm-unfold]:not([hidden])').forEach(p=>p.animate&&p.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'}));
}

/* Inside the tools: every full-screen window reveals from the tap that opened it. */
function watchOverlays(){
 const seen=new WeakSet();let lastClose=0;
 const isOpen=el=>el.classList.contains('show');
 const observer=new MutationObserver(records=>{
  records.forEach(r=>{
   const el=r.target;
   if(r.type!=='attributes')return;
   const was=(r.oldValue||'').split(/\s+/).includes('show');
   if(!was&&isOpen(el)){
    // Coming back to the window underneath (e.g. the log after editing an entry):
    // it is simply there; only the closing window moves.
    if(performance.now()-lastClose<450)return;
    reveal(el);
   }else if(was&&!isOpen(el)&&el.matches('.modal-overlay')){
    lastClose=performance.now();
    el.setAttribute('data-pm-closing','');el.style.zIndex='2147480000';
    requestAnimationFrame(()=>{
     const back=[...document.querySelectorAll('.modal-overlay.show')].some(m=>m!==el);
     const clean=()=>{el.removeAttribute('data-pm-closing');el.style.zIndex='';el.style.clipPath='';el.style.opacity='';};
     // Back to another window: shrink into the control that opened this one.
     // Otherwise the whole tool is closing and the page handles it.
     if(back)conceal(el).then(clean);else clean();
    });
   }
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

/* The exercise explorer opens inside the training page, like Lists and Travel on
   Home: it is loaded in a full-screen frame that grows out of the star and folds
   back into it. The address follows (so Back and refresh work as before). */
const embedded=(()=>{try{return window.parent!==window&&!!window.parent.PulseExploreStage;}catch(_){return false;}})();
if(embedded){
 document.documentElement.classList.add('pm-embedded');
 // The explorer's own steps (body → exercise → list) share the browser history with
 // the training page; count them so closing can step back past all of them at once.
 const host=window.parent.PulseExploreStage,push=history.pushState.bind(history);
 history.pushState=function(){host.steps=(host.steps||0)+1;return push.apply(history,arguments);};
 addEventListener('popstate',()=>{host.steps=Math.max(0,(host.steps||0)-1);});
 // Leaving the explorer from inside the frame hands control back to the training page.
 document.addEventListener('click',event=>{
  const a=event.target.closest&&event.target.closest('a[href]');
  if(!a||event.defaultPrevented)return;
  const url=new URL(a.getAttribute('href'),location.href);
  if(!/\/exercise\.html$/.test(url.pathname))return;
  event.preventDefault();
  if(url.search.includes('explore=1'))window.parent.location.href=url.href;else window.parent.PulseExploreStage.close();
 },true);
}
let stage=null,stageFrame=null,stageFrom=null,stageOpen=false,stageBusy=false,homeUrl=null;
function idle(on){try{stageFrame.contentDocument.documentElement.classList.toggle('pm-idle',on);}catch(_){}}
function explorerUrl(link){const u=new URL(link.href,location.href);return u.href;}
function ensureStage(url){
 if(stage){if(stageFrame.dataset.src!==url){stageFrame.dataset.src=url;stageFrame.src=url;}return stage;}
 stage=document.createElement('div');stage.className='pm-stage';stage.hidden=true;stage.setAttribute('role','region');stage.setAttribute('aria-label','Utforska övningar');
 stageFrame=document.createElement('iframe');stageFrame.title='Utforska övningar';stageFrame.dataset.src=url;stageFrame.src=url;
 stage.appendChild(stageFrame);document.body.appendChild(stage);
 return stage;
}
function openStage(link,push){
 if(stageOpen||stageBusy)return;
 const url=explorerUrl(link);ensureStage(url);
 stageBusy=true;stageOpen=true;stageFrom=link.querySelector('.field-explore-star')||link;
 homeUrl=location.href;
 if(push)history.pushState({pmExplore:1},'',url);
 window.TrainingOverlay&&window.TrainingOverlay.acquire('explore',true);
 stage.hidden=false;document.documentElement.classList.add('pm-stage-open');document.documentElement.classList.remove('pm-stage-covered');
 const ready=new Promise(resolve=>{try{if(stageFrame.contentDocument&&stageFrame.contentDocument.readyState==='complete'&&stageFrame.contentWindow.PulseGuideUI)return resolve();}catch(_){}
  stageFrame.addEventListener('load',()=>resolve(),{once:true});setTimeout(resolve,350);});
 // Grow as soon as the explorer has painted its body (or quickly, if it is still loading).
 idle(false);
 // Once covered, the training page stops painting and animating underneath.
 ready.then(()=>reveal(stage,stageFrom,320)).then(()=>{stageBusy=false;if(stageOpen)document.documentElement.classList.add('pm-stage-covered');try{stageFrame.contentWindow.focus();}catch(_){}});
}
function closeStage(fromPop){
 if(!stageOpen||stageBusy)return;
 stageBusy=true;
 // The training page shows again underneath for the fold.
 document.documentElement.classList.remove('pm-stage-open');
 const api=window.PulseExploreStage,steps=api.steps||0;api.steps=0;
 if(!fromPop)history.go(-(1+steps));
 const target=stageFrom&&document.body.contains(stageFrom)&&stageFrom.getClientRects().length?stageFrom:null;
 document.documentElement.classList.remove('pm-stage-covered');
 fold(stage,target).then(()=>{
  stage.hidden=true;stage.style.opacity='';stage.style.clipPath='';stageOpen=false;stageBusy=false;
  window.TrainingOverlay&&window.TrainingOverlay.release('explore');
  // The explorer sleeps (no drawing) and starts on the body next time; nothing reloads.
  idle(true);try{stageFrame.contentWindow.PulseGymReset&&stageFrame.contentWindow.PulseGymReset();}catch(_){}
 });
}
if(!embedded){
 window.PulseExploreStage={open:link=>openStage(link,true),close:()=>closeStage(false)};
 document.addEventListener('click',event=>{
  const link=event.target.closest&&event.target.closest('a.field-explore-entry,a#menu-explore-training');
  if(!link||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||!document.body.animate)return;
  event.preventDefault();
  if(link.id==='menu-explore-training')window.dispatchEvent(new Event('pulse-field:close-menu'));
  openStage(link,true);
 });
 addEventListener('popstate',()=>{if(stageOpen)closeStage(true);});
 // Start loading the explorer as the finger lands on its link, not before: the
 // training page itself never pays for it.
 document.addEventListener('pointerdown',event=>{const link=event.target.closest&&event.target.closest('a.field-explore-entry,a#menu-explore-training');if(link&&!stage)ensureStage(explorerUrl(link));},{capture:true,passive:true});
}

/* Folding a surface that holds an iframe: a shrinking clip makes Safari repaint the
   frame (flicker); scaling it into the origin stays on the compositor. */
function fold(el,to){
 stop(el);
 if(reduced()||!el.animate)return Promise.resolve();
 let o=to&&to.x!=null?to:to?originFor(to):null;
 if(!o){try{o=JSON.parse(el.dataset.pmFrom||'null');}catch(_){o=null;}}
 if(!o)o={x:innerWidth/2,y:innerHeight*.62,r:22};
 const k=Math.max(.06,Math.min(.25,(o.r*2)/Math.max(innerWidth,1)));
 el.style.transformOrigin=o.x.toFixed(1)+'px '+o.y.toFixed(1)+'px';
 // Stays solid while it shrinks, fading only at the very end, so the fold reads as a collapse.
 const a=el.animate([{transform:'scale(1)',opacity:1,borderRadius:'0px',offset:0},{opacity:1,offset:.55},{transform:'scale('+k+')',opacity:0,borderRadius:'48px',offset:1}],{duration:300,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});
 running.set(el,[a]);
 return a.finished.catch(()=>{}).then(()=>{el.style.opacity='0';a.cancel();running.delete(el);el.style.transformOrigin='';});
}
/* Any page: surfaces that open with a `show` class grow out of the tap and fold
   back into it. Closing keeps the surface shown until the fold has finished. */
function watchSurfaces(selector){
 const seen=new WeakSet();
 const observer=new MutationObserver(records=>records.forEach(r=>{
  const el=r.target,was=(r.oldValue||'').split(/\s+/).includes('show'),now=el.classList.contains('show');
  if(was===now)return;
  if(now){
   // Opening (also mid-fold): drop the hold and grow out of the tap.
   el.classList.remove('pm-hold');reveal(el);
  }else if(!reduced()&&el.animate){
   // Closing: pm-hold keeps it on screen (styled like .show) while it folds back.
   el.classList.add('pm-hold');
   conceal(el).then(()=>{if(!el.classList.contains('show'))el.classList.remove('pm-hold');});
  }
 }));
 const attach=el=>{if(seen.has(el))return;seen.add(el);observer.observe(el,{attributes:true,attributeFilter:['class'],attributeOldValue:true});};
 const scan=root=>root.querySelectorAll&&root.querySelectorAll(selector).forEach(attach);
 scan(document);
 new MutationObserver(rs=>rs.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType!==1)return;if(n.matches(selector))attach(n);scan(n);}))).observe(document.body,{childList:true,subtree:true});
}
const surfaceList=document.currentScript&&document.currentScript.dataset.surfaces;
if(surfaceList){const go=()=>watchSurfaces(surfaceList);if(document.body)go();else document.addEventListener('DOMContentLoaded',go,{once:true});}
window.PulseMotion={watchSurfaces,reveal,conceal,fold,measure,ring,originFor};
})();
