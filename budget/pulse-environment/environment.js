/* Presentation only: no storage access, data transformation, or session hooks. */
(function(){
  'use strict';
  const canvas=document.getElementById('pulse-environment');
  const ctx=canvas&&canvas.getContext('2d');
  if(!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const session=document.getElementById('session-modal');
  let width=1,height=1280,ratio=1,frame=0,last=0,visible=true;
  function point(t,lane){
    const farX=width*.86,nearX=width*(.05+lane*.16);
    const depth=t*t;
    return {x:farX+(nearX-farX)*depth+Math.sin(t*5.6+lane*.18)*width*.07*t,y:90+depth*1080};
  }
  function paint(time){
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
    const halo=ctx.createRadialGradient(width*.86,150,0,width*.86,200,width*.7);
    halo.addColorStop(0,'rgba(214,35,76,.16)');
    halo.addColorStop(.04,'rgba(190,31,68,.13)');halo.addColorStop(.4,'rgba(116,20,47,.08)');halo.addColorStop(1,'rgba(8,9,14,0)');
    ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
    // Three pairs of converging traces establish the depth of an abstract energy field.
    for(let lane=0;lane<6;lane++){
      ctx.beginPath();for(let j=0;j<=70;j++){const p=point(j/70,lane);j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}
      ctx.lineWidth=lane%2?1:1.4;ctx.strokeStyle=lane%2?'rgba(245,82,112,.13)':'rgba(255,55,96,.24)';ctx.shadowColor='#ff3f66';ctx.shadowBlur=lane%2?5:17;ctx.stroke();ctx.shadowBlur=0;
      if(lane%2===0){const t=reduced.matches?.55:((time*.000038+lane*.17)%1),p=point(t,lane);const light=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,25);light.addColorStop(0,'rgba(255,158,171,.63)');light.addColorStop(.13,'rgba(255,61,103,.24)');light.addColorStop(1,'rgba(255,61,103,0)');ctx.fillStyle=light;ctx.fillRect(p.x-25,p.y-25,50,50);}
    }
    // Sparse cross-contours connect the traces without turning the page into a grid.
    for(let n=0;n<7;n++){
      const t=.24+n*.1,p=point(t,0),q=point(t,5);
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.bezierCurveTo(width*.38,p.y+25,width*.68,q.y-24,q.x,q.y);
      ctx.strokeStyle='rgba(194,87,119,'+(.045+n*.009)+')';ctx.lineWidth=.7;ctx.stroke();
    }
  }
  function active(){return !document.hidden&&visible&&!(session&&session.classList.contains('show'));}
  function loop(now){frame=0;if(!active()||reduced.matches)return;if(now-last>40){last=now;paint(now);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame)cancelAnimationFrame(frame);frame=0;if(!active())return;paint(reduced.matches?0:performance.now());if(!reduced.matches)frame=requestAnimationFrame(loop);}
  function resize(){width=canvas.clientWidth||innerWidth;height=1280;ratio=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1500000/(width*height)));canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);wake();}
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;wake();}).observe(canvas);
  if(session)new MutationObserver(wake).observe(session,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake);
  addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});addEventListener('pageshow',wake);
  const profile=new URLSearchParams(location.search).get('user');
  document.querySelectorAll('[data-pulse-original]').forEach(link=>{link.href='exercise.html'+(profile==='maja'?'?user=maja':'');});
  resize();
})();
