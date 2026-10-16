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
  const duration=()=>reduced()?0:370;
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
    stage.appendChild(frame);
    document.body.appendChild(stage);
    let resolveLoad;
    const loaded=new Promise(resolve=>{resolveLoad=resolve;});
    frame.addEventListener('load',()=>resolveLoad(),{once:true});
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
  function insetFrom(r,stage){
    if(!r)return 'inset(0px 0px 0px 0px round 0px)';
    const b=stage.getBoundingClientRect();
    const t=Math.max(0,Math.min(b.height,r.top-b.top));
    const l=Math.max(0,Math.min(b.width,r.left-b.left));
    const right=Math.max(0,b.width-(r.left-b.left+r.width));
    const bottom=Math.max(0,b.height-(r.top-b.top+r.height));
    return 'inset('+t+'px '+right+'px '+bottom+'px '+l+'px round 13px)';
  }
  async function animatePortal(resource,fromRect,toRect,opening,word){
    const stage=resource.stage;
    const full='inset(0px 0px 0px 0px round 0px)';
    const clipped=insetFrom(opening?fromRect:toRect,stage);
    const ms=duration();
    if(!ms || !stage.animate)return;
    const anim=stage.animate(opening?[
      {clipPath:clipped,filter:'brightness(.85)'},
      {clipPath:full,filter:'brightness(1)'}
    ]:[
      {clipPath:full,filter:'brightness(1)'},
      {clipPath:clipped,filter:'brightness(.85)'}
    ],{duration:ms,easing:'cubic-bezier(.2,.85,.2,1)',fill:'both'});
    // Both entire pages coexist: the previous view remains visible outside the expanding area.
    const back=app?.animate(opening?[
      {opacity:1,transform:'scale(1)'},
      {opacity:.75,transform:'scale(.985)'}
    ]:[
      {opacity:.75,transform:'scale(.985)'},
      {opacity:1,transform:'scale(1)'}
    ],{duration:ms,easing:'cubic-bezier(.2,.85,.2,1)',fill:'both'});
    const ghost=glyph(opening?fromRect:fromRect,opening?toRect:toRect,word);
    let ghostAnim;
    if(ghost && fromRect && toRect){
      ghostAnim=ghost.animate([
        {left:fromRect.left+'px',top:fromRect.top+'px',width:fromRect.width+'px',height:fromRect.height+'px',opacity:1},
        {left:toRect.left+'px',top:toRect.top+'px',width:toRect.width+'px',height:toRect.height+'px',opacity:0}
      ],{duration:ms,easing:'cubic-bezier(.2,.85,.2,1)',fill:'both'});
    }
    try{await anim.finished}catch(_){}
    if(ghostAnim)ghostAnim.cancel();
    if(ghost)ghost.remove();
    if(back)back.cancel();
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
      // Wait for the child layout and its first paint, rather than revealing an empty canvas.
      await nextFrame();
      const sourceRect=rect(origin)||rect(tab);
      const buttonRect=pillTarget(resource);
      homeScroll=window.scrollY;
      resource.stage.style.visibility='visible';
      resource.stage.style.pointerEvents='none';
      document.documentElement.classList.add('hub-morph-active');
      document.body.classList.add('hub-morph-active');
      await animatePortal(resource,sourceRect,buttonRect,true,origin?.textContent.trim()||'');
      resource.stage.style.visibility='visible';
      resource.stage.style.pointerEvents='auto';
      active=area;
      if(pushHistory)history.pushState({hubMorph:area},'',sources[area]);
    }catch(error){
      // Never strand the user on a blank portal when a browser prevents iframe rendering.
      resource.stage.style.visibility='hidden';
      resource.stage.style.pointerEvents='none';
      document.documentElement.classList.remove('hub-morph-active');
      document.body.classList.remove('hub-morph-active');
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
    if(typeof window.selectHomeSection==='function')window.selectHomeSection(view==='economy'?'economy':'overview');
    await nextFrame();
    const endingTab=$('#home-tab-'+(view==='economy'?'economy':'overview'));
    const from=pillTarget(resource),to=rect(endingTab);
    try{await animatePortal(resource,from,to,false,'Översikt');}catch(_){}
    resource.stage.style.visibility='hidden';
    resource.stage.style.pointerEvents='none';
    document.documentElement.classList.remove('hub-morph-active');
    document.body.classList.remove('hub-morph-active');
    active=null;
    window.scrollTo(0,homeScroll);
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
