/* A page shown as one of Home's full-screen views (Budget, Listor, Resor; home-morph-router.js):
 * links back to Home and to the other views go through Home's router instead of loading pages
 * inside the frame. The finance pages switch among themselves inside the Budget view. */
(function(){
  'use strict';
  if(window.parent===window)return;
  let hub=false;
  try{hub=!!window.parent.HomeHub;}catch(_){}
  // hubFrame=1 is on the first page only; later finance pages are recognised by their parent.
  if(!hub && new URLSearchParams(location.search).get('hubFrame')!=='1')return;
  const FINANCE=['budget.html','budget_maja.html','analytics.html','analytics_maja.html','familjebudget.html','data.html'];
  const AREA={'shopping.html':'lists','travel.html':'travel'};
  const areaOf=leaf=>AREA[leaf]||(FINANCE.includes(leaf)?'budget':null);
  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[href]');
    if(!anchor || event.defaultPrevented || event.button!==0||
       event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
       anchor.hasAttribute('download') || (anchor.target&&anchor.target!=='_self'))return;
    let url;
    try{url=new URL(anchor.href,location.href)}catch(_){return}
    if(url.origin!==location.origin)return;
    const leaf=url.pathname.split('/').pop(),own=location.pathname.split('/').pop();
    if(leaf==='home.html'){
      event.preventDefault();
      event.stopImmediatePropagation();
      window.parent.postMessage({type:'hub:return-home',view:url.searchParams.get('view')==='economy'?'economy':'overview'},location.origin);
      return;
    }
    const target=areaOf(leaf),here=areaOf(own);
    // Same view (one finance page to another): an ordinary navigation inside the frame.
    if(target && target===here)return;
    if(target){
      event.preventDefault();
      event.stopImmediatePropagation();
      window.parent.postMessage({type:'hub:open-area',area:target},location.origin);
      return;
    }
    // Other full pages must never open inside the framed application.
    if(leaf!==own && leaf.endsWith('.html')){
      event.preventDefault();
      event.stopImmediatePropagation();
      window.top.location.assign(url.href);
    }
  },true);
})();
