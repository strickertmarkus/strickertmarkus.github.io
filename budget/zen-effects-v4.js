/* Zen v4 DOM effects: brand symbol sync and demo indicator. */
(function(){
  'use strict';
  const body=document.body;
  if(!body)return;
  const brandSymbol=document.querySelector('.zen-brand>span:first-child');
  const heroCopy=document.querySelector('.hero-copy');
  let badge=document.getElementById('zen-demo-badge-v4');
  if(!badge&&heroCopy){
    badge=document.createElement('div');
    badge.id='zen-demo-badge-v4';
    badge.textContent='Visar exempeldata · sparas inte';
    heroCopy.appendChild(badge);
  }
  const oldAmbient=document.getElementById('zen-ambient-v4');
  if(oldAmbient)oldAmbient.remove();
  let lastKind='';
  function sync(){
    const kind=body.dataset.kind==='meditation'?'meditation':'stretch';
    if(brandSymbol&&kind!==lastKind){
      brandSymbol.classList.add('zen-brand-symbol-swap');
      setTimeout(()=>{
        brandSymbol.textContent=kind==='meditation'?'≈':'✧';
        brandSymbol.classList.remove('zen-brand-symbol-swap');
      },150);
    }
    lastKind=kind;
    if(badge){
      const active=!!(window.ZenDemoV4&&ZenDemoV4.isActive(kind));
      badge.hidden=!active;
    }
    document.querySelectorAll('[data-delete^="zen_demo_v4_"]').forEach(btn=>{
      btn.hidden=true;
      btn.setAttribute('aria-hidden','true');
    });
  }
  const observer=new MutationObserver(sync);
  observer.observe(body,{attributes:true,attributeFilter:['data-kind'],subtree:false});
  const main=document.getElementById('zen-main');
  if(main)observer.observe(main,{childList:true,subtree:true});
  sync();
})();
