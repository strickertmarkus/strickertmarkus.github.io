/* Zen v4 DOM effects: brand symbol sync. */
(function(){
  'use strict';
  const body=document.body;
  if(!body)return;
  const brandSymbol=document.querySelector('.zen-brand>span:first-child');
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
  }
  document.addEventListener('zen:home-rendered',sync);
  sync();
})();
