/* Home's full-screen Budget/Listor/Resor views and its Översikt/Överföringar sections, all switched
 * with one slide. Each view is the ORIGINAL page (budget pages, shopping.html, travel.html) in a
 * viewport-sized layer that stays loaded, so the bottom bar switches between them without page loads.
 * URL and Back/Forward are synchronised with History API; refresh opens its native page.
 */
(function(){
  'use strict';
  const FINANCE=['budget.html','budget_maja.html','analytics.html','analytics_maja.html','familjebudget.html','data.html'];
  // Budget opens the finance page used last (finance-ui stores it); inside the view the page's own
  // header switches between the finance pages.
  const lastFinance=()=>{let p='';try{p=localStorage.getItem('finance-last-page-v1')||'';}catch(_){}return FINANCE.includes(p)?p:'budget.html';};
  const sources={lists:'shopping.html',travel:'travel.html',get budget(){return lastFinance();}};
  const TITLES={lists:'Listor',travel:'Resor',budget:'Budget'};
  const frames=new Map();
  let active=null,busy=false,pending=null,requestVersion=0,homeScroll=0;
  const $=selector=>document.querySelector(selector);
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pathArea=()=>{
    const tail=location.pathname.split('/').pop();
    return tail==='shopping.html'?'lists':tail==='travel.html'?'travel':FINANCE.includes(tail)?'budget':null;
  };
  const sameSite=origin=>origin===location.origin;
  const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const app=$('.app-wrap');

  function rect(el){
    if(!el)return null;
    const r=el.getBoundingClientRect();
    if(!r.width||!r.height)return null;
    return {left:r.left,top:r.top,width:r.width,height:r.height};
  }
  // The address shown for a view: the page it currently shows (Budget may have moved to Analys etc.).
  function urlFor(area){
    const r=frames.get(area);
    try{const leaf=r&&r.frame.contentWindow.location.pathname.split('/').pop();if(leaf)return leaf;}catch(_){}
    return sources[area];
  }
  function makeStage(area){
    if(frames.has(area))return frames.get(area);
    const stage=document.createElement('div');
    stage.className='hub-morph-stage';
    stage.dataset.area=area;
    stage.style.visibility='hidden';
    stage.style.pointerEvents='none';
    const frame=document.createElement('iframe');
    frame.title=TITLES[area]+' – fullskärm';
    frame.setAttribute('referrerpolicy','same-origin');
    frame.setAttribute('loading','eager');
    stage.setAttribute('role','region');
    stage.setAttribute('aria-label',frame.title);
    stage.appendChild(frame);
    document.body.appendChild(stage);
    let resolveLoad;
    const loaded=new Promise((resolve,reject)=>{
      resolveLoad=resolve;
      const limit=window.setTimeout(()=>reject(new Error('Fullskärmsvyn kunde inte laddas.')),12000);
      frame.addEventListener('load',()=>{
        window.clearTimeout(limit);
        resolveLoad();
      },{once:true});
    });
    frame.src=sources[area]+'?hubFrame=1';
    const resource={stage,frame,loaded};
    frames.set(area,resource);
    return resource;
  }
  /* Every Home page change is the same slide: the old view fades out towards the far side
     (100 ms), the new one slides in from the side of its tab (220 ms). */
  const EASE_IN='cubic-bezier(.4,0,1,1)',EASE_OUT='cubic-bezier(.22,1,.36,1)';
  function slide(el,fromX,fromO,toX,toO,ms,easing){
    if(!el||!el.animate||reduced())return Promise.resolve();
    const a=el.animate([{opacity:fromO,transform:'translate3d('+fromX+'px,0,0)'},{opacity:toO,transform:'translate3d('+toX+'px,0,0)'}],{duration:ms,easing});
    return a.finished.catch(()=>{});
  }
  const all=(els,fn)=>Promise.all([].concat(els).filter(Boolean).map(fn));
  const leave=(els,dir)=>all(els,el=>slide(el,0,1,-dir*18,0,100,EASE_IN));
  const enter=(els,dir)=>all(els,el=>slide(el,dir*26,0,0,1,220,EASE_OUT));
  const hide=(els,on)=>[].concat(els).filter(Boolean).forEach(el=>{el.style.opacity=on?'0':'';});
  // Home's own layer for a section: the section plus the header and "+" that float over it.
  const homeLayer=view=>[$('#home-'+view),$('.app-wrap>.app-header'),$('body>.fab')];
  function stageVisibility(resource,visible){
    resource.stage.style.visibility=visible?'visible':'hidden';
    resource.stage.style.pointerEvents=visible?'auto':'none';
    resource.stage.style.opacity='1';
  }
  function lockHome(locked){
    document.documentElement.classList.toggle('hub-morph-active',locked);
    document.body.classList.toggle('hub-morph-active',locked);
    if(app)app.inert=locked;
  }
  const changed=()=>window.dispatchEvent(new CustomEvent('hub:change',{detail:{area:active,view:document.body.dataset.homeSection}}));
  /* Översikt <-> Överföringar without a full-screen view: the old section slides out,
     the new one slides in from the side of its tab in the bottom bar. */
  async function switchSection(view){
    const current=document.body.dataset.homeSection;
    if(current===view || typeof window.selectHomeSection!=='function')return;
    const dir=view==='economy'?1:-1;
    await leave($('#home-'+current),dir);
    window.selectHomeSection(view);
    window.scrollTo(0,0);
    enter($('#home-'+view),dir);
  }
  async function openArea(job){
    if(!sources[job.area] || active===job.area)return;
    const origin=job.source;
    const previous=active?frames.get(active):null;
    const resource=makeStage(job.area);
    origin?.classList.add('hub-loading');
    try{
      await resource.loaded;
      if(job.id!==requestVersion)return;
      if(!active)homeScroll=window.scrollY;
      lockHome(true);
      const section=homeLayer(document.body.dataset.homeSection);
      // View to view (e.g. Budget -> Listor): Home stays hidden underneath, so it never shows
      // between the two.
      if(previous)hide(section,true);
      await leave(previous?previous.stage:section,1);
      if(job.id!==requestVersion){
        if(!previous)lockHome(false);
        hide(section,false);
        return;
      }
      // Home stays hidden under the incoming view (the leave animation has no fill).
      hide(section,true);
      resource.stage.style.visibility='visible';
      resource.stage.style.pointerEvents='none';
      if(previous)stageVisibility(previous,false);
      await enter(resource.stage,1);
      stageVisibility(resource,true);
      hide(section,false);
      active=job.area;
      if(job.push)history.pushState({hubMorph:job.area},'',urlFor(job.area));
      changed();
      try{resource.frame.focus({preventScroll:true});}catch(_){resource.frame.focus();}
    }catch(error){
      if(active!==job.area)stageVisibility(resource,false);
      if(previous)stageVisibility(previous,true);
      else lockHome(false);
      hide(homeLayer(document.body.dataset.homeSection),false);
      if(job.id===requestVersion && job.push)location.assign(sources[job.area]);
    }finally{
      origin?.classList.remove('hub-loading');
    }
  }
  async function closeArea(job){
    const view=job.view==='economy'?'economy':'overview';
    if(!active){
      if(job.id!==requestVersion)return;
      if(job.push && pathArea())history.replaceState({hubMorph:'home'},'','home.html');
      await switchSection(view);
      changed();
      return;
    }
    const resource=frames.get(active);
    if(document.body.dataset.homeSection!==view && typeof window.selectHomeSection==='function')window.selectHomeSection(view);
    const section=homeLayer(view);
    // Hidden under the leaving view so it can slide in instead of flashing.
    hide(section,true);
    await leave(resource.stage,-1);
    stageVisibility(resource,false);
    lockHome(false);
    active=null;
    window.scrollTo(0,homeScroll);
    hide(section,false);
    enter(section,-1);
    if(job.id===requestVersion && job.push)history.pushState({hubMorph:'home'},'','home.html'+(view==='economy'?'?view=economy':''));
    changed();
  }
  /* A last-intent-wins queue: stale loads never push history and an Overview
     request cancels any queued Listor/Resor request, including rapid taps. */
  function request(area,view,push,source){
    pending={area,view:view||'overview',push:!!push,source:source||null,id:++requestVersion};
    if(!busy)void drain();
  }
  async function drain(){
    if(busy)return;
    busy=true;
    try{
      while(pending){
        const job=pending;
        pending=null;
        if(job.area)await openArea(job);
        else await closeArea(job);
      }
    }finally{
      busy=false;
      if(pending)void drain();
    }
  }

  // The bottom bar (pulse-bottom-nav-v1.js) drives Home: open a full-screen view or go back
  // to a section.
  window.HomeHub={
    open(area,source){makeStage(area);request(area,'overview',true,source);},
    home(view,source){request(null,view==='economy'?'economy':'overview',!!active,source);},
    active(){return pending?pending.area:active;}
  };
  // Listor and Budget load in the background so their slide starts at once.
  window.addEventListener('load',()=>{
    setTimeout(()=>{if(!frames.has('lists'))makeStage('lists');},1200);
    setTimeout(()=>{if(!frames.has('budget'))makeStage('budget');},2600);
  });
  window.addEventListener('message',event=>{
    if(!sameSite(event.origin)||!event.data)return;
    const validChild=[...frames.entries()].some(([area,resource])=>
      event.source===resource.frame.contentWindow && (area===active || area===pending?.area));
    if(!validChild)return;
    if(event.data.type==='hub:return-home'){
      request(null,event.data.view==='economy'?'economy':'overview',true,null);
    }else if(event.data.type==='hub:open-area'&&sources[event.data.area]){
      request(event.data.area,'overview',true,null);
    }
  });
  window.addEventListener('popstate',()=>{
    const area=pathArea();
    request(area,area?'overview':new URLSearchParams(location.search).get('view')==='economy'?'economy':'overview',false,null);
  });
  window.addEventListener('pageshow',()=>{
    const area=pathArea();
    if(area!==active)request(area,area?'overview':'overview',false,null);
  });
})();
