/* Zen meditation v15: animated sun reflection in the water + tiny scroll-linked light drift. */
(function(){
  'use strict';
  const host=document.querySelector('.landscape');
  if(!host)return;
  const shade=host.querySelector('.landscape-shade');
  const canvas=document.createElement('canvas');
  canvas.className='zen-water-light-v15';
  if(shade)host.insertBefore(canvas,shade); else host.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx)return;

  const W=1200,H=900,WATER=575,TAU=Math.PI*2;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;

  function prepare(){
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.translate(left,0);
    ctx.scale(scale,scale);
  }

  function drawReflection(time){
    ctx.save();
    ctx.beginPath();ctx.rect(0,WATER,W,H-WATER);ctx.clip();
    ctx.globalCompositeOperation='screen';

    /* Broken horizontal highlights below the sun, distorted by the same wind rhythm as the water. */
    for(let i=0;i<24;i++){
      const p=i/23;
      const y=WATER+15+p*252;
      const sway=reduced.matches?0:Math.sin(time*.42+i*.71)*14*(.35+p*.65);
      const x=810+sway+Math.sin(i*.63)*12;
      const half=10+Math.sin(i*1.7)*4+p*18;
      const alpha=.055+(1-p)*.08+((i%5)===0?.035:0);
      const grad=ctx.createLinearGradient(x-half,y,x+half,y);
      grad.addColorStop(0,'rgba(255,246,201,0)');
      grad.addColorStop(.28,'rgba(255,244,191,'+(alpha*.55)+')');
      grad.addColorStop(.5,'rgba(255,251,225,'+alpha+')');
      grad.addColorStop(.72,'rgba(255,239,171,'+(alpha*.48)+')');
      grad.addColorStop(1,'rgba(255,246,201,0)');
      ctx.strokeStyle=grad;
      ctx.lineWidth=(i%6===0)?1.45:.9;
      ctx.beginPath();
      ctx.moveTo(x-half,y);
      ctx.bezierCurveTo(x-half*.35,y-1.6,x+half*.38,y+1.6,x+half,y);
      ctx.stroke();
    }

    /* A very soft vertical sun pool ties the highlights together without forming a solid column. */
    const pool=ctx.createRadialGradient(808,WATER+95,8,808,WATER+110,180);
    pool.addColorStop(0,'rgba(255,244,194,.105)');
    pool.addColorStop(.34,'rgba(255,239,176,.048)');
    pool.addColorStop(1,'rgba(255,239,176,0)');
    ctx.fillStyle=pool;
    ctx.fillRect(610,WATER,395,330);

    ctx.restore();
  }

  function draw(time){
    prepare();
    if(document.body.dataset.kind!=='meditation')return;
    drawReflection(time);
  }

  function resize(){
    const box=host.getBoundingClientRect();
    width=Math.max(1,box.width);height=Math.max(1,box.height);
    ratio=Math.min(window.devicePixelRatio||1,1.4,Math.sqrt(900000/(width*height)));
    scale=Math.max(width/W,height/H);
    left=(width-W*scale)*(width<600?0.69:0.5);
    canvas.width=Math.round(width*ratio);
    canvas.height=Math.round(height*ratio);
    draw(reduced.matches?0:performance.now()/1000);
    wake();
  }

  function loop(now){
    frame=0;
    if(document.hidden||!visible||reduced.matches)return;
    if(now-last>40){last=now;draw(now/1000);}
    frame=requestAnimationFrame(loop);
  }
  function wake(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;
    if(document.hidden||!visible)return;
    if(reduced.matches){draw(0);return;}
    frame=requestAnimationFrame(loop);
  }

  let scrollFrame=0;
  function applySunShift(){
    scrollFrame=0;
    if(document.body.dataset.kind!=='meditation'){
      document.body.style.setProperty('--zen-sun-shift','0px');
      document.body.style.setProperty('--zen-sun-x','0px');
      return;
    }
    const y=Math.max(0,window.scrollY||window.pageYOffset||0);
    const shift=Math.min(18,y*.022);
    const x=Math.min(5,y*.006);
    document.body.style.setProperty('--zen-sun-shift',shift.toFixed(2)+'px');
    document.body.style.setProperty('--zen-sun-x',x.toFixed(2)+'px');
  }
  function onScroll(){
    if(scrollFrame)return;
    scrollFrame=requestAnimationFrame(applySunShift);
  }

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(function(){draw(reduced.matches?0:performance.now()/1000);applySunShift();wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);
  reduced.addEventListener('change',wake);
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',function(){applySunShift();wake();});
  resize();applySunShift();
})();
