/* Pointer-driven sorting: the actual row follows the pointer continuously.
   The model changes once, on drop; keyboard arrows provide the same operation. */
(function(){
 'use strict';
 window.ZenBuilderSort={attach(list,onMove){
  const dialog=list.closest('dialog'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let drag=null,raf=0,settle=0;
  const rows=()=>Array.from(list.children);
  function cleanup(){cancelAnimationFrame(raf);clearTimeout(settle);raf=0;for(const row of rows()){row.style.transform='';row.style.transition='';row.classList.remove('is-dragging');}list.classList.remove('builder-sort-active');drag=null;}
  function finish(cancel=false){
   if(!drag||drag.finishing)return;const d=drag;d.finishing=true;cancelAnimationFrame(raf);raf=0;
   const to=cancel?d.from:d.to;
   const target=to>d.from?d.rects[to].bottom-d.rects[d.from].height:d.rects[to].top;
   d.row.style.transition=reduced.matches?'none':'transform .2s cubic-bezier(.2,.8,.2,1)';
   d.row.style.transform='translate3d(0,'+(target-d.rects[d.from].top)+'px,0)';
   if(cancel)d.rows.forEach(r=>{if(r!==d.row)r.style.transform='';});
   try{d.handle.releasePointerCapture(d.pointer);}catch(_){}
   settle=setTimeout(()=>{cleanup();if(!cancel&&to!==d.from)onMove(d.from,to);rows()[to]?.querySelector('.step-drag-handle')?.focus({preventScroll:true});},reduced.matches?0:200);
  }
  function paint(){
   raf=0;if(!drag||drag.finishing)return;const d=drag,bounds=dialog.getBoundingClientRect();
   // Scroll the modal while keeping the grabbed point attached to the finger.
   const edge=55,speed=d.y<bounds.top+edge?-Math.min(9,(bounds.top+edge-d.y)*.2):d.y>bounds.bottom-edge?Math.min(9,(d.y-bounds.bottom+edge)*.2):0;
   if(speed)dialog.scrollTop+=speed;
   const scroll=dialog.scrollTop-d.scroll,dy=d.y-d.startY+scroll,dx=Math.max(-18,Math.min(18,d.x-d.startX));
   d.row.style.transform='translate3d('+dx+'px,'+dy+'px,0) scale(1.025)';
   const center=d.rects[d.from].top+d.rects[d.from].height/2+dy;
   let to=d.from;
   for(let i=0;i<d.rects.length;i++){if(i===d.from)continue;const middle=d.rects[i].top+d.rects[i].height/2;if(i<d.from&&center<middle){to=i;break;}if(i>d.from&&center>middle)to=i;}
   d.to=to;
   d.rows.forEach((row,i)=>{if(i===d.from)return;let shift=0;if(to>d.from&&i>d.from&&i<=to)shift=-d.rects[d.from].height;if(to<d.from&&i>=to&&i<d.from)shift=d.rects[d.from].height;row.style.transform='translateY('+shift+'px)';});
   raf=requestAnimationFrame(paint);
  }
  list.addEventListener('pointerdown',e=>{
   const handle=e.target.closest('.step-drag-handle');if(!handle||drag||!e.isPrimary||e.button!==0)return;
   e.preventDefault();const items=rows(),row=handle.closest('.builder-step'),from=items.indexOf(row);if(from<0)return;
   drag={row,handle,rows:items,rects:items.map(r=>r.getBoundingClientRect()),from,to:from,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,scroll:dialog.scrollTop,finishing:false};
   handle.focus({preventScroll:true});list.classList.add('builder-sort-active');row.classList.add('is-dragging');handle.setPointerCapture(e.pointerId);raf=requestAnimationFrame(paint);
  });
  list.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.pointer&&!drag.finishing){drag.x=e.clientX;drag.y=e.clientY;e.preventDefault();}});
  list.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.pointer)finish();});
  list.addEventListener('pointercancel',()=>finish(true));list.addEventListener('lostpointercapture',()=>{if(drag&&!drag.finishing)finish(true);});
  list.addEventListener('keydown',e=>{
   const handle=e.target.closest('.step-drag-handle');if(!handle)return;
   if(e.key==='Escape'&&drag){e.preventDefault();e.stopPropagation();finish(true);return;}
   if(drag||!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();
   const items=rows(),from=items.indexOf(handle.closest('.builder-step')),to=e.key==='Home'?0:e.key==='End'?items.length-1:Math.max(0,Math.min(items.length-1,from+(e.key==='ArrowUp'?-1:1)));
   if(to!==from)onMove(from,to);rows()[to]?.querySelector('.step-drag-handle')?.focus({preventScroll:true});
  });
  dialog.addEventListener('close',cleanup);dialog.addEventListener('cancel',()=>{if(drag)cleanup();});window.addEventListener('pagehide',cleanup);
 }};
})();
