/* Keyboard and swipe navigation for Markus/Maja's illustrated muscle explorer. */
(function(){
 'use strict';
 const hero=document.getElementById('discover-home');
 const chips=[...document.querySelectorAll('#atlas-home .living-muscle-chip')];
 if(!hero||!chips.length)return;
 hero.addEventListener('keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  const from=chips.indexOf(document.activeElement);
  if(from<0)return;
  event.preventDefault();
  chips[(from+(event.key==='ArrowRight'?1:-1)+chips.length)%chips.length].focus();
 });
 let start=null;
 const view=hero.querySelector('.atlas-visual');
 view.addEventListener('touchstart',event=>{
  if(event.target.closest('button')||event.touches.length!==1)return;
  start={x:event.touches[0].clientX,y:event.touches[0].clientY};
 },{passive:true});
 view.addEventListener('touchend',event=>{
  if(!start||event.changedTouches.length!==1)return;
  const dx=event.changedTouches[0].clientX-start.x,dy=event.changedTouches[0].clientY-start.y;
  start=null;
  if(Math.abs(dx)<65||Math.abs(dx)<Math.abs(dy)*1.4)return;
  const from=chips.findIndex(chip=>chip.getAttribute('aria-pressed')==='true');
  const next=chips[(from+(dx<0?1:-1)+chips.length)%chips.length];
  next.click();
  next.scrollIntoView({block:'nearest',inline:'center',behavior:'auto'});
 },{passive:true});
 view.addEventListener('touchcancel',()=>{start=null;});
})();
