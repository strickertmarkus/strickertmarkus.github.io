/* Connect the full Shopping and Travel apps to their Home tabs without duplicating data. */
(function () {
  'use strict';
  const $=id=>document.getElementById(id);
  let viewRequest=0;
  function notifyViewport() {
    const section=document.body.dataset.homeSection;
    const frame=$(section==='lists'?'home-lists-frame':section==='travel'?'home-travel-frame':'');
    if(!frame||!frame.getAttribute('src'))return;
    const rect=frame.getBoundingClientRect(),vv=window.visualViewport;
    const pageOffset=vv?vv.offsetTop:0;
    const viewHeight=vv?vv.height:window.innerHeight;
    const visibleTop=Math.max(0,pageOffset-rect.top);
    const visibleHeight=Math.max(120,Math.min(viewHeight,rect.height-visibleTop));
    frame.contentWindow?.postMessage({type:'home:viewport',top:visibleTop,height:visibleHeight},location.origin);
  }
  function scheduleViewport(){
    if(viewRequest)return;
    viewRequest=requestAnimationFrame(()=>{viewRequest=0;notifyViewport();});
  }
  function receiveHeight(event){
    const frame=event.source===$('home-lists-frame')?.contentWindow?$('home-lists-frame'):
      event.source===$('home-travel-frame')?.contentWindow?$('home-travel-frame'):null;
    if(!frame||event.origin!==location.origin||!event.data)return;
    const expected=frame.id==='home-lists-frame'?'shopping:content-height':'travel:content-height';
    if(event.data.type!==expected)return;
    const height=Number(event.data.height);
    if(!Number.isFinite(height)||height<200||height>60000)return;
    if(Math.abs((parseFloat(frame.style.height)||0)-height)>3)frame.style.height=Math.ceil(height)+'px';
    scheduleViewport();
  }
  function install(){
    ['home-lists-frame','home-travel-frame'].forEach(id=>{
      $(id)?.addEventListener('load',scheduleViewport);
    });
    window.addEventListener('message',receiveHeight);
    window.addEventListener('scroll',scheduleViewport,{passive:true});
    window.addEventListener('resize',scheduleViewport,{passive:true});
    window.visualViewport?.addEventListener('resize',scheduleViewport);
    window.visualViewport?.addEventListener('scroll',scheduleViewport);
    document.querySelectorAll('[data-home-tab]').forEach(tab=>tab.addEventListener('click',scheduleViewport));
    window.addEventListener('pageshow',scheduleViewport);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();