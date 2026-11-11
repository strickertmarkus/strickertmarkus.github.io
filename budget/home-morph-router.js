/* Render both pages during navigation for an actual slide-like morph on iOS Safari.
 * The destination uses the ORIGINAL Shopping/Travel document, in a viewport-sized layer.
 * URL and Back/Forward are synchronised with History API; refresh opens its native page.
 */
(function(){
  'use strict';
  const sources={lists:'shopping.html',travel:'travel.html'};
  const frames=new Map();
  let active=null,busy=false,pending=null,requestVersion=0,homeScroll=0;
  const $=selector=>document.querySelector(selector);
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration=opening=>reduced()?0:(opening?220:255);
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
  function pillTarget(resource){
    try{
      const home=resource.frame.contentDocument?.querySelector('.site-hub-home');
      const r=rect(home);
      const origin=rect(resource.frame);
      return r&&origin?{left:r.left+origin.left,top:r.top+origin.top,width:r.width,height:r.height}:null;
    }catch(_){return null;}
  }
  function glyph(from,to,text){
    if(!from||!to)return null;
    const ghost=document.createElement('div');
    ghost.className='hub-morph-ghost';
    ghost.textContent=text;
    ghost.style.left=from.left+'px';
    ghost.style.top=from.top+'px';
    ghost.style.width=from.width+'px';
    ghost.style.height=from.height+'px';
    document.body.appendChild(ghost);
    return ghost;
  }
  /* A radial reveal grows outward from the ACTUAL tapped button center.
     Earlier inset clipping had the right bounds but felt like a centre-opened canvas. */
  function maskGeometry(r,stage){
    const box=stage.getBoundingClientRect();
    if(!r||!box.width||!box.height)return null;
    const x=Math.max(0,Math.min(box.width,r.left-box.left+r.width/2));
    const y=Math.max(0,Math.min(box.height,r.top-box.top+r.height/2));
    const small=Math.max(1,Math.hypot(r.width/2,r.height/2));
    const large=Math.hypot(Math.max(x,box.width-x),Math.max(y,box.height-y))+12;
    const center=x.toFixed(2)+'px '+y.toFixed(2)+'px';
    return {
      start:'circle('+small.toFixed(2)+'px at '+center+')',
      full:'circle('+large.toFixed(2)+'px at '+center+')'
    };
  }
  async function animatePortal(resource,fromRect,toRect,opening,word){
    const stage=resource.stage;
    // Reverse shrink always converges on the Overview tab, rather than the iframe centre.
    const geometry=maskGeometry(opening?fromRect:toRect,stage);
    const ms=duration(opening);
    if(!geometry)return;
    if(!ms || !stage.animate){
      stage.style.clipPath=opening?'none':geometry.start;
      return;
    }
    const keyframes=opening?[
      {clipPath:geometry.start,offset:0},
      {clipPath:geometry.full,offset:1}
    ]:[
      {clipPath:geometry.full,offset:0},
      {clipPath:geometry.start,offset:1}
    ];
    const anim=stage.animate(keyframes,{
      duration:ms,easing:'cubic-bezier(.34,.1,.22,1)',fill:'both'
    });
    // Animate only a small lightweight chip. Don't repaint/scale the entire Home page.
    const ghost=glyph(fromRect,toRect,word);
    let ghostAnim;
    if(ghost && fromRect && toRect){
      const tx=toRect.left-fromRect.left,ty=toRect.top-fromRect.top;
      const scaleX=toRect.width/fromRect.width,scaleY=toRect.height/fromRect.height;
      ghostAnim=ghost.animate([
        {transform:'translate3d(0,0,0) scale(1,1)',opacity:1,offset:0},
        {transform:'translate3d('+tx+'px,'+ty+'px,0) scale('+scaleX+','+scaleY+')',opacity:0,offset:1}
      ],{duration:Math.min(ms,240),easing:'cubic-bezier(.34,.1,.22,1)',fill:'both'});
    }
    try{await anim.finished}catch(_){}
    // Commit the end frame *before* cancelling WAAPI to avoid a full-screen flash
    // when the reverse animation collapses onto the Overview button.
    stage.style.clipPath=opening?'none':geometry.start;
    if(ghostAnim)ghostAnim.cancel();
    ghost?.remove();
    anim.cancel();
  }
  function stageVisibility(resource,visible){
    resource.stage.style.visibility=visible?'visible':'hidden';
    resource.stage.style.pointerEvents=visible?'auto':'none';
    resource.stage.style.opacity='1';
    if(!visible)resource.stage.style.clipPath='none';
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
    const out=$('#home-'+current),next=$('#home-'+view),dir=view==='economy'?1:-1;
    if(reduced() || !out || !next || !out.animate){window.selectHomeSection(view);return;}
    const leave=out.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translate3d('+(-dir*18)+'px,0,0)'}],
      {duration:130,easing:'cubic-bezier(.4,0,1,1)'});
    try{await leave.finished}catch(_){}
    window.selectHomeSection(view);
    window.scrollTo(0,0);
    next.animate([{opacity:0,transform:'translate3d('+(dir*26)+'px,0,0)'},{opacity:1,transform:'none'}],
      {duration:300,easing:'cubic-bezier(.22,1,.36,1)'});
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
      const from=rect(origin),to=pillTarget(resource);
      if(!active)homeScroll=window.scrollY;
      // The next page is first painted behind a mask at the touched button.
      const mask=maskGeometry(from,resource.stage);
      resource.stage.style.clipPath=mask?mask.start:'none';
      resource.stage.style.visibility='visible';
      resource.stage.style.pointerEvents='none';
      await nextFrame();
      if(job.id!==requestVersion){
        stageVisibility(resource,false);
        return;
      }
      // One fast button-origin radial animation; no separate View Transition.
      lockHome(true);
      await animatePortal(resource,from,to,true,origin?.textContent.trim()||'');
      if(job.id!==requestVersion){
        stageVisibility(resource,false);
        if(!previous)lockHome(false);
        return;
      }
      stageVisibility(resource,true);
      if(previous)stageVisibility(previous,false);
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
    if(!active){
      if(job.id!==requestVersion)return;
      if(job.push && pathArea())history.replaceState({hubMorph:'home'},'','home.html');
      await switchSection(job.view==='economy'?'economy':'overview');
      changed();
      return;
    }
    const resource=frames.get(active);
    const view=job.view==='economy'?'economy':'overview';
    // The view shrinks back into the tapped tab (or the Hem tab when left another way).
    const to=rect(job.source)||rect(document.querySelector('.pbn [data-pbn="'+(view==='economy'?'transfer':'home')+'"]'));
    try{await animatePortal(resource,null,to,false,'');}catch(_){}
    stageVisibility(resource,false);
    lockHome(false);
    active=null;
    window.scrollTo(0,homeScroll);
    if(job.id===requestVersion){
      if(job.push)history.pushState({hubMorph:'home'},'','home.html'+(view==='economy'?'?view=economy':''));
      if(document.body.dataset.homeSection!==view && typeof window.selectHomeSection==='function'){
        window.selectHomeSection(view);
      }
    }
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
  // to a section, with the reveal growing from / shrinking into the tapped tab.
  window.HomeHub={
    open(area,source){makeStage(area);request(area,'overview',true,source);},
    home(view,source){request(null,view==='economy'?'economy':'overview',!!active,source);},
    active(){return pending?pending.area:active;}
  };
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
