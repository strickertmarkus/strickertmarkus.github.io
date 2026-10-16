/* Direct browser navigation preserves the native cross-document View Transition morph. */
(function(){
  'use strict';
  const validArea=path=>{
    const match=String(path).match(/(?:^|\/)budget\/(home|shopping|travel)\.html$/);
    return match?match[1]:null;
  };
  const currentArea=validArea(location.pathname);
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  /* Prepare the outgoing named element before Safari takes its pageswap snapshot.
     No timeout, CSS transform or delayed location.assign: those caused the old two-stage jump. */
  function prepareDestination(url){
    if(currentArea!=='home')return;
    let target;
    try{target=validArea(new URL(url,location.href).pathname)}catch(_){return}
    document.documentElement.dataset.hubRoute=target==='shopping'?'lists':target==='travel'?'travel':'overview';
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[data-hub-link],.home-section-tabs a[data-home-route]');
    if(!link || event.defaultPrevented || event.button!==0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
        link.hasAttribute('download') || (link.target && link.target!=='_self'))return;
    let destination;
    try{destination=new URL(link.href,location.href)}catch(_){return}
    if(destination.origin!==location.origin || !validArea(destination.pathname))return;
    if(destination.pathname===location.pathname &&
        destination.search===location.search && destination.hash===location.hash){
      event.preventDefault();
      return;
    }
    prepareDestination(destination.href);
    /* Let the anchor navigate normally: Safari 18.2+ owns the 215ms shared-element transition. */
  });

  window.addEventListener('pageswap',event=>{
    if(!event.viewTransition || reduced())return;
    const destination=event.activation?.entry?.url;
    if(destination)prepareDestination(destination);
  });
  window.addEventListener('pagereveal',()=>{
    // BFCache restores can retain the outgoing Home route. Reset before the new snapshot.
    if(currentArea==='home')document.documentElement.dataset.hubRoute='overview';
    document.documentElement.classList.remove('hub-leaving','hub-arrived');
  });
  window.addEventListener('pageshow',()=>{
    if(currentArea==='home')document.documentElement.dataset.hubRoute='overview';
    document.documentElement.classList.remove('hub-leaving','hub-arrived');
  });
})();
