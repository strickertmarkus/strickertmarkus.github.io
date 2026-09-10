/* Zen v4 DOM effects: brand symbol sync, demo indicator and ambient fireflies. */
(function(){
  'use strict';
  const body=document.body;
  if(!body)return;
  const brandSymbol=document.querySelector('.zen-brand>span:first-child');
  const heroCopy=document.querySelector('.hero-copy');
  let badge=document.getElementById('zen-demo-badge-v4');
  if(!badge&&heroCopy){badge=document.createElement('div');badge.id='zen-demo-badge-v4';badge.textContent='Visar exempeldata · sparas inte';heroCopy.appendChild(badge);}
  let ambient=document.getElementById('zen-ambient-v4');
  if(!ambient){
    ambient=document.createElement('div');ambient.id='zen-ambient-v4';ambient.setAttribute('aria-hidden','true');
    for(let i=0;i<26;i++){
      const p=document.createElement('i');
      p.style.left=(3+Math.random()*94).toFixed(2)+'vw';
      p.style.top=(18+Math.random()*78).toFixed(2)+'vh';
      p.style.setProperty('--dur',(8+Math.random()*10).toFixed(2)+'s');
      p.style.setProperty('--delay',(-Math.random()*10).toFixed(2)+'s');
      p.style.setProperty('--dx',(-18+Math.random()*36).toFixed(1)+'px');
      p.style.setProperty('--dy',(-28+Math.random()*22).toFixed(1)+'px');
      const s=.7+Math.random()*1.45;p.style.transform='scale('+s.toFixed(2)+')';
      ambient.appendChild(p);
    }
    body.prepend(ambient);
  }
  let lastKind='';
  function sync(){
    const kind=body.dataset.kind==='meditation'?'meditation':'stretch';
    if(brandSymbol&&kind!==lastKind){
      brandSymbol.classList.add('zen-brand-symbol-swap');
      setTimeout(()=>{brandSymbol.textContent=kind==='meditation'?'≈':'✧';brandSymbol.classList.remove('zen-brand-symbol-swap');},150);
    }
    lastKind=kind;
    if(badge){const active=!!(window.ZenDemoV4&&ZenDemoV4.isActive(kind));badge.hidden=!active;}
    document.querySelectorAll('[data-delete^="zen_demo_v4_"]').forEach(btn=>{btn.hidden=true;btn.setAttribute('aria-hidden','true');});
  }
  const observer=new MutationObserver(sync);
  observer.observe(body,{attributes:true,attributeFilter:['data-kind'],subtree:false});
  const main=document.getElementById('zen-main');
  if(main)observer.observe(main,{childList:true,subtree:true});
  sync();
})();
