/* Render both pages during navigation for an actual slide-like morph on iOS Safari.
 * The destination uses the ORIGINAL Shopping/Travel document, in a viewport-sized layer.
 * URL and Back/Forward are synchronised with History API; refresh opens its native page.
 */
(function(){
  'use strict';
  const sources={lists:'shopping.html',travel:'travel.html'};
  const frames=new Map();
  let active=null,busy=false,pending=null,homeScroll=0;
  const $=selector=>document.querySelector(selector);
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration=opening=>reduced()?0:(opening?310:255);
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
      duration:ms,easing:'cubic-bezier(.22,.82,.2,1)',fill:'both'
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
      ],{duration:Math.min(ms,240),easing:'cubic-bezier(.22,.82,.2,1)',fill:'both'});
    }
    try{await anim.finished}catch(_){}
    // Commit the end frame *before* cancelling WAAPI to avoid a full-screen flash
    // when the reverse animation collapses onto the Overview button.
    stage.style.clipPath=opening?'none':geometry.start;
    if(ghostAnim)ghostAnim.cancel();
    ghost?.remove();
    anim.cancel();
  }
  async function show(area,source,pushHistory){
    if(!sources[area])return;
    if(busy){pending={area,pushHistory};return;}
    if(active===area)return;
    busy=true;
    const tab=$('#home-tab-'+area);
    const origin=source||tab;
    origin?.classList.add('hub-loading');
    const resource=makeStage(area);
    try{
      await resource.loaded;
      const sourceRect=rect(origin)||rect(tab);
      const buttonRect=pillTarget(resource);
      homeScroll=window.scrollY;
      // Paint the destination beneath a chip-sized clipping mask before expanding it.
      // This prevents the first iframe paint becoming a visible rectangular flash.
      const openingMask=maskGeometry(sourceRect,resource.stage);
      resource.stage.style.clipPath=openingMask?openingMask.start:'none';
      resource.stage.style.visibility='visible';
      resource.stage.style.pointerEvents='none';
      await nextFrame();
      document.documentElement.classList.add('hub-morph-active');
      document.body.classList.add('hub-morph-active');
      await animatePortal(resource,sourceRect,buttonRect,true,origin?.textContent.trim()||'');
      resource.stage.style.visibility='visible';
      resource.stage.style.pointerEvents='auto';
      active=area;
      if(pushHistory)history.pushState({hubMorph:area},'',sources[area]);
      if(app)app.inert=true;
      try{resource.frame.focus({preventScroll:true});}catch(_){resource.frame.focus();}
    }catch(error){
      // Never strand the user on a blank portal when a browser prevents iframe rendering.
      resource.stage.style.visibility='hidden';
      resource.stage.style.pointerEvents='none';
      resource.stage.style.clipPath='';
      document.documentElement.classList.remove('hub-morph-active');
      document.body.classList.remove('hub-morph-active');
      if(app)app.inert=false;
      if(pushHistory)location.assign(sources[area]);
    }finally{
      origin?.classList.remove('hub-loading');
      busy=false;
      followPending();
    }
  }
  async function hide(view,pushHistory){
    if(!active)return;
    if(busy){pending={area:null,view,pushHistory};return;}
    busy=true;
    const area=active,resource=frames.get(area);
    if(pushHistory)history.pushState({hubMorph:'home'},'','home.html'+(view==='economy'?'?view=economy':''));
    const targetView=view==='economy'?'economy':'overview';
    // Redrawing the already visible Home section was expensive on mobile Safari.
    if(document.body.dataset.homeSection!==targetView &&
       typeof window.selectHomeSection==='function')window.selectHomeSection(targetView);
    const endingTab=$('#home-tab-'+(view==='economy'?'economy':'overview'));
    const from=pillTarget(resource),to=rect(endingTab);
    try{await animatePortal(resource,from,to,false,'Översikt');}catch(_){}
    resource.stage.style.visibility='hidden';
    resource.stage.style.pointerEvents='none';
    resource.stage.style.clipPath='none';
    document.documentElement.classList.remove('hub-morph-active');
    document.body.classList.remove('hub-morph-active');
    if(app)app.inert=false;
    active=null;
    window.scrollTo(0,homeScroll);
    try{endingTab?.focus({preventScroll:true});}catch(_){endingTab?.focus();}
    busy=false;
    followPending();
  }
  function followPending(){
    const next=pending;
    pending=null;
    if(!next)return;
    if(next.area)show(next.area,null,next.pushHistory);
    else hide(next.view,next.pushHistory);
  }

  document.addEventListener('pointerdown',event=>{
    const link=event.target.closest?.('.home-section-tabs a[data-home-route]');
    if(link && sources[link.dataset.homeRoute])makeStage(link.dataset.homeRoute);
  },{capture:true,passive:true});
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('.home-section-tabs a[data-home-route]');
    if(!link||event.defaultPrevented||event.button!==0||
       event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||
       link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
    const area=link.dataset.homeRoute;
    if(!sources[area])return;
    event.preventDefault();
    event.stopImmediatePropagation();
    show(area,link,true);
  },true);
  window.addEventListener('message',event=>{
    if(!sameSite(event.origin)||!event.data)return;
    if(event.data.type!=='hub:return-home')return;
    if(!active||event.source!==frames.get(active)?.frame.contentWindow)return;
    hide(event.data.view==='economy'?'economy':'overview',true);
  });
  window.addEventListener('popstate',()=>{
    const area=pathArea();
    if(area)show(area,null,false);
    else if(active)hide(new URLSearchParams(location.search).get('view')==='economy'?'economy':'overview',false);
    else if(typeof window.selectHomeSection==='function'){
      window.selectHomeSection(new URLSearchParams(location.search).get('view')==='economy'?'economy':'overview');
    }
  });
  window.addEventListener('pageshow',()=>{
    // A BFCache return should restore the correct overlay, not the previous URL's state.
    const area=pathArea();
    if(area && active!==area)show(area,null,false);
    if(!area && active)hide('overview',false);
  });
})();
