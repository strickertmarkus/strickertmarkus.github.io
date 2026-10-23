/* Pulse Flow Living Anatomy imagery; Markus/Maja only.
 * Uses the licensed locally-hosted atlas stills. No external product dependencies.
 */
(function(){
 'use strict';
 const hero=document.getElementById('discover-home');
 const chips=[...document.querySelectorAll('#atlas-home .living-muscle-chip')];
 if(!hero||!chips.length)return;
 const base=new URL('./assets/atlas-stills-v1/',document.currentScript?.src||document.baseURI);
 fetch(new URL('manifest.json',base),{cache:'force-cache'}).then(async response=>{
  if(!response.ok)throw new Error('No atlas thumbnails');
  const manifest=await response.json();
  for(const chip of chips){
   const muscle=chip.dataset.atlasMuscle;
   const info=manifest.groups?.[muscle];
   if(!info)continue;
   const side=muscle==='Rygg'?'back':'front';
   const image=info[side]?.image||info.front?.image;
   if(!image)continue;
   const el=document.createElement('img');
   el.src=new URL(image,base).href;
   el.alt='';
   el.loading='lazy';
   el.decoding='async';
   el.draggable=false;
   const holder=chip.querySelector('.living-chip-ring');
   if(holder)holder.replaceChildren(el);
  }
 }).catch(()=>{
   // Decorative thumbnails only. Buttons remain fully functional without them.
 });
 const preferReduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 hero.addEventListener('keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  const list=chips.filter(x=>!x.disabled);
  const from=list.indexOf(document.activeElement);
  if(from<0)return;
  event.preventDefault();
  const next=list[(from+(event.key==='ArrowRight'?1:-1)+list.length)%list.length];
  next.focus();
 });
 let start=null;
 const view=hero.querySelector('.atlas-visual');
 if(view){
  view.addEventListener('touchstart',event=>{
   if(event.target.closest('button')||event.touches.length!==1)return;
   start={x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{passive:true});
  view.addEventListener('touchend',event=>{
   if(!start||event.changedTouches.length!==1)return;
   const dx=event.changedTouches[0].clientX-start.x,dy=event.changedTouches[0].clientY-start.y;
   start=null;
   if(Math.abs(dx)<65||Math.abs(dx)<Math.abs(dy)*1.4)return;
   // Front/back view is already wired through the official atlas controls.
   const id=dx<0?'atlas-back':'atlas-front';
   document.getElementById(id)?.click();
  },{passive:true});
  view.addEventListener('touchcancel',()=>{start=null;});
 }
})();
