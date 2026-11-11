/* Home's full-screen Listor/Resor views and its Översikt/Överföringar sections, all switched
 * with one slide. The destination uses the ORIGINAL Shopping/Travel document in a viewport-sized layer.
 * URL and Back/Forward are synchronised with History API; refresh opens its native page.
 */
(function(){
  'use strict';
  const sources={lists:'shopping.html',travel:'travel.html'};
  const frames=new Map();
  let active=null,busy=false,pending=null,requestVersion=0,homeScroll=0;
  const $=selector=>document.querySelector(selector);
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pathArea=()=>{
    const tail=location.pathname.split('/').pop();
    return tail==='shopping.html'?'lists':tail==='travel.html'?'travel':null;
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
  function makeStage(area){
    if(frames.has(area))return frames.get(area);
    const stage=document.createElement('div');
    stage.className='hub-morph-stage';
    stage.dataset.area=area;
    stage.style.visibility='hidden';
    stage.style.pointerEvents='none';
    const frame=document.createElement('iframe');
    frame.title=area==='lists'?'Listor – fullskärm':'Resor – fullskärm';
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
  /* Every Home page change is one overlapping slide: the old view slides out while the new one
     slides in from the side of its tab, both in DURATION ms, so the screen is never empty.
     Direction follows the order of the tabs in the bottom bar. */
  const DURATION=300,EASE='cubic-bezier(.32,.72,0,1)';
  const ORDER={overview:0,economy:1,lists:3,travel:4};
  const dirOf=(from,to)=>(ORDER[to]||0)>=(ORDER[from]||0)?1:-1;
  function slide(el,fromX,fromO,toX,toO){
    if(!el||!el.animate||reduced())return Promise.resolve();
    const a=el.animate([{opacity:fromO,transform:'translate3d('+fromX+'px,0,0)'},{opacity:toO,transform:'translate3d('+toX+'px,0,0)'}],{duration:DURATION,easing:EASE});
    return a.finished.catch(()=>{});
  }
  const all=(els,fn)=>Promise.all([].concat(els).filter(Boolean).map(fn));
  const leave=(els,dir)=>all(els,el=>slide(el,0,1,-dir*36,0));
  const enter=(els,dir)=>all(els,el=>slide(el,dir*48,0,0,1));
  // Home's own layer for a section: the section plus the header and "+" that float over it.
  const homeLayer=view=>[$('#home-'+view),$('.app-wrap>.app-header'),$('body>.fab')];
  /* The section being left is copied into a fixed layer at its place, so it can slide out
     while the new section (already in the page) slides in. */
  function ghostOf(section){
    if(!section||reduced())return null;
    const r=section.getBoundingClientRect(),ghost=section.cloneNode(true);
    // Same ids and place in the page (so its styles match); it comes after the original, so
    // lookups by id still find the real section during the 300 ms it exists.
    ghost.hidden=false;ghost.setAttribute('aria-hidden','true');ghost.inert=true;
    Object.assign(ghost.style,{position:'fixed',top:r.top+'px',left:r.left+'px',width:r.width+'px',margin:'0',zIndex:'50',pointerEvents:'none'});
    section.after(ghost);
    return ghost;
  }
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
    const dir=dirOf(current,view);
    const ghost=ghostOf($('#home-'+current));
    window.selectHomeSection(view);
    window.scrollTo(0,0);
    await Promise.all([leave(ghost,dir),enter($('#home-'+view),dir)]);
    ghost?.remove();
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
      const from=active||document.body.dataset.homeSection,dir=dirOf(from,job.area);
      resource.stage.style.visibility='visible';
      resource.stage.style.pointerEvents='none';
      await Promise.all([leave(previous?previous.stage:homeLayer(document.body.dataset.homeSection),dir),enter(resource.stage,dir)]);
      if(previous)stageVisibility(previous,false);
      if(job.id!==requestVersion && !previous && active!==job.area){stageVisibility(resource,false);lockHome(false);return;}
      stageVisibility(resource,true);
      active=job.area;
      if(job.push)history.pushState({hubMorph:job.area},'',sources[job.area]);
      changed();
      try{resource.frame.focus({preventScroll:true});}catch(_){resource.frame.focus();}
    }catch(error){
      if(active!==job.area)stageVisibility(resource,false);
      if(previous)stageVisibility(previous,true);
      else lockHome(false);
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
    const resource=frames.get(active),dir=dirOf(active,view);
    if(document.body.dataset.homeSection!==view && typeof window.selectHomeSection==='function')window.selectHomeSection(view);
    window.scrollTo(0,homeScroll);
    lockHome(false);
    await Promise.all([leave(resource.stage,dir),enter(homeLayer(view),dir)]);
    stageVisibility(resource,false);
    active=null;
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
  // to a section. Listor is loaded in the background so its slide starts at once.
  window.HomeHub={
    open(area,source){makeStage(area);request(area,'overview',true,source);},
    home(view,source){request(null,view==='economy'?'economy':'overview',!!active,source);},
    active(){return pending?pending.area:active;}
  };
  window.addEventListener('load',()=>setTimeout(()=>{if(!frames.has('lists'))makeStage('lists');},1200));
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
