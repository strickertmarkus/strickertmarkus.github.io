/* Zen meditation v16: recessed waterfall mouth overlay. */
(function(){
  'use strict';
  const host=document.querySelector('.landscape');
  if(!host)return;
  const shade=host.querySelector('.landscape-shade');
  const canvas=document.createElement('canvas');
  canvas.className='zen-waterfall-mouth-v16';
  if(shade)host.insertBefore(canvas,shade);else host.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx)return;

  const W=1200,H=900,TAU=Math.PI*2;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;

  function prep(){
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.translate(left,0);ctx.scale(scale,scale);
  }

  function drawMouth(time,mobile){
    const fallX=mobile?875:955;
    const lipY=mobile?455:485;
    const holeX=fallX+14;
    const holeY=lipY+31;

    /* Deep cavity recessed into the rock face. */
    const cavity=ctx.createRadialGradient(holeX-8,holeY-9,3,holeX,holeY,43);
    cavity.addColorStop(0,'rgba(14,37,37,.96)');
    cavity.addColorStop(.52,'rgba(23,52,50,.88)');
    cavity.addColorStop(.82,'rgba(39,70,64,.50)');
    cavity.addColorStop(1,'rgba(57,89,79,0)');
    ctx.fillStyle=cavity;
    ctx.beginPath();
    ctx.moveTo(holeX-31,holeY+7);
    ctx.bezierCurveTo(holeX-29,holeY-23,holeX-13,holeY-35,holeX+9,holeY-33);
    ctx.bezierCurveTo(holeX+31,holeY-31,holeX+43,holeY-13,holeX+39,holeY+10);
    ctx.bezierCurveTo(holeX+29,holeY+18,holeX-17,holeY+19,holeX-31,holeY+7);
    ctx.fill();

    /* Short inner stream: visibly travels inside the cavity before folding downward. */
    ctx.save();
    ctx.globalCompositeOperation='screen';
    const inner=ctx.createLinearGradient(holeX-20,holeY-5,holeX+29,holeY+19);
    inner.addColorStop(0,'rgba(225,244,232,.05)');
    inner.addColorStop(.46,'rgba(248,250,224,.40)');
    inner.addColorStop(1,'rgba(232,248,238,.19)');
    ctx.strokeStyle=inner;
    ctx.lineCap='round';
    for(let i=0;i<8;i++){
      const jitter=reduced.matches?0:Math.sin(time*1.1+i*.8)*.9;
      const y=holeY-4+i*1.15;
      ctx.lineWidth=i%3===0?1.5:.9;
      ctx.beginPath();
      ctx.moveTo(holeX-17,y);
      ctx.bezierCurveTo(holeX-5,y-2+jitter,holeX+9,y+1,holeX+23,y+9+jitter);
      ctx.stroke();
    }
    ctx.restore();

    /* Front rim is painted last so the stream disappears behind stone at the top edge. */
    const rim=ctx.createLinearGradient(holeX-34,holeY-18,holeX+45,holeY+20);
    rim.addColorStop(0,'rgba(143,160,145,.98)');
    rim.addColorStop(.55,'rgba(96,122,111,.99)');
    rim.addColorStop(1,'rgba(61,91,85,.99)');
    ctx.strokeStyle=rim;
    ctx.lineWidth=8;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(holeX-28,holeY+1);
    ctx.bezierCurveTo(holeX-8,holeY-11,holeX+20,holeY-9,holeX+38,holeY+5);
    ctx.stroke();

    ctx.strokeStyle='rgba(255,247,210,.20)';
    ctx.lineWidth=1.05;
    ctx.beginPath();
    ctx.moveTo(holeX-21,holeY-1);
    ctx.quadraticCurveTo(holeX+7,holeY-11,holeX+31,holeY+2);
    ctx.stroke();

    /* Bright bend at the mouth visually connects to the existing vertical waterfall below. */
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<11;i++){
      const x=holeX-6+i*2.7;
      const a=.13+(i%3)*.035;
      ctx.strokeStyle='rgba(239,249,232,'+a+')';
      ctx.lineWidth=i%4===0?1.55:.9;
      ctx.beginPath();
      ctx.moveTo(x,holeY+8);
      ctx.bezierCurveTo(x+4,holeY+14,x+6,holeY+20,x+5,holeY+29);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(time){
    prep();
    if(document.body.dataset.kind!=='meditation')return;
    drawMouth(time,width<700);
  }

  function resize(){
    const b=host.getBoundingClientRect();
    width=Math.max(1,b.width);height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(700000/(width*height)));
    scale=Math.max(width/W,height/H);
    left=(width-W*scale)*(width<600?0.69:0.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    draw(reduced.matches?0:performance.now()/1000);wake();
  }
  function loop(now){
    frame=0;
    if(document.hidden||!visible||reduced.matches)return;
    if(now-last>45){last=now;draw(now/1000);}
    frame=requestAnimationFrame(loop);
  }
  function wake(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;
    if(document.hidden||!visible)return;
    if(reduced.matches){draw(0);return;}
    frame=requestAnimationFrame(loop);
  }

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(function(){draw(reduced.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);
  reduced.addEventListener('change',wake);
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',wake);
  resize();
})();
