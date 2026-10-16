/* Inter-page Home navigation: preserve standalone layouts and browser history. */
(function(){
  'use strict';
  const storageKey='family-hub-navigation-v1';
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // New documents get a small entrance transition on browsers without cross-document transitions.
  try {
    const stamp=Number(sessionStorage.getItem(storageKey));
    if(stamp && Date.now()-stamp<3500 && !reduced())document.documentElement.classList.add('hub-arrived');
    sessionStorage.removeItem(storageKey);
  }catch(_){}
  function intercept(event,anchor){
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(anchor.target&&anchor.target!=='_self')return;
    if(anchor.hasAttribute('download'))return;
    let dest;
    try{dest=new URL(anchor.href,location.href)}catch(_){return}
    if(dest.origin!==location.origin)return;
    // Choosing the already-active app must not reload it or discard an editing draft.
    if(anchor.getAttribute('aria-current')==='page' && dest.pathname===location.pathname){
      event.preventDefault();
      const menu=anchor.closest('details');
      if(menu)menu.open=false;
      return;
    }
    if(dest.pathname===location.pathname&&dest.search===location.search&&dest.hash===location.hash){
      event.preventDefault();
      return;
    }
    if(!/(?:^|\/)budget\/(?:home|shopping|travel)\.html$/.test(dest.pathname))return;
    // Native navigation remains the fallback for accessibility and reduced motion.
    if(reduced())return;
    event.preventDefault();
    try{sessionStorage.setItem(storageKey,String(Date.now()))}catch(_){}
    document.documentElement.classList.add('hub-leaving');
    window.setTimeout(()=>location.assign(dest.href),185);
  }
  document.addEventListener('click',function(event){
    const link=event.target.closest?.('a[data-hub-link],.home-section-tabs a[data-home-route]');
    if(link)intercept(event,link);
    document.querySelectorAll('.site-hub[open]').forEach(details=>{
      if(!details.contains(event.target))details.open=false;
    });
  });
  document.addEventListener('keydown',function(event){
    if(event.key==='Escape')document.querySelectorAll('.site-hub[open]').forEach(details=>{
      details.open=false;details.querySelector('summary')?.focus({preventScroll:true});
    });
  });
  window.addEventListener('pageshow',function(){
    document.documentElement.classList.remove('hub-leaving');
  });
})();
