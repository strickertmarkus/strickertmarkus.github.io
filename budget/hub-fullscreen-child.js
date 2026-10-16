/* Let a full-screen child return through the Home morph instead of nesting Home in an iframe. */
(function(){
  'use strict';
  if(window.parent===window || new URLSearchParams(location.search).get('hubFrame')!=='1')return;
  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[href]');
    if(!anchor || event.defaultPrevented || event.button!==0||
       event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
       anchor.hasAttribute('download') || (anchor.target&&anchor.target!=='_self'))return;
    let url;
    try{url=new URL(anchor.href,location.href)}catch(_){return}
    if(url.origin!==location.origin)return;
    const leaf=url.pathname.split('/').pop();
    if(leaf==='home.html'){
      event.preventDefault();
      event.stopImmediatePropagation();
      window.parent.postMessage({
        type:'hub:return-home',
        view:url.searchParams.get('view')==='economy'?'economy':'overview'
      },location.origin);
      return;
    }
    // Leaving the embedded full-screen application for other areas must
    // navigate the top page, never load an unrelated app inside the frame.
    const own=location.pathname.split('/').pop();
    if(leaf!==own && leaf.endsWith('.html')){
      event.preventDefault();
      event.stopImmediatePropagation();
      window.top.location.assign(url.href);
    }
  },true);
})();
