/* Zen stretch v17: a restrained near-canopy layer for bamboo-like depth. */
(function(){
  'use strict';
  const host=document.querySelector('.landscape');
  if(!host)return;
  const shade=host.querySelector('.landscape-shade');
  const canvas=document.createElement('canvas');
  canvas.className='zen-stretch-depth-v17';
  if(shade)host.insertBefore(canvas,shade);else host.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx)return;

  const W=1200,H=900,TAU=Math.PI*2;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;

  const clusters=[
    {x:382,y:162,side:-1,alpha:.42,scale:1.12,phase:.4},
    {x:1030,y:220,side:1,alpha:.52,scale:1.28,phase:1.7},
    {x:1002,y:612,side:1,alpha:.34,scale:1.08,phase:3.1},
    {x:410,y:724,side:-1,alpha:.27,scale:.94,phase:4.2}
  ];

  function prep(){
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.translate(left,0);
    ctx.scale(scale,scale);
  }

  function leaf(x,y,len,w,angle,color,alpha){
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(x,y);ctx.rotate(angle);
    ctx.fillStyle=color;
    ctx.beginPath();ctx.moveTo(-len*.48,0);
    ctx.quadraticCurveTo(-len*.08,-w,len*.52,0);
    ctx.quadraticCurveTo(-len*.10,w,-len*.48,0);
    ctx.fill();
    ctx.strokeStyle='rgba(187,219,139,.13)';ctx.lineWidth=.65;
    ctx.beginPath();ctx.moveTo(-len*.30,0);ctx.lineTo(len*.28,0);ctx.stroke();
    ctx.restore();
  }

  function branch(x,y,side,s,phase,time,alpha){
    const breeze=reduced.matches?0:(Math.sin(time*.43+phase)*9+Math.sin(time*.17+phase*.7)*5);
    const rise=reduced.matches?0:Math.sin(time*.28+phase)*2.2;
    const endX=x+side*(116*s)+breeze;
    const endY=y+(47*s)+rise;

    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.strokeStyle='rgba(8,29,21,.86)';ctx.lineWidth=8.5*s;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+side*34*s,y+8*s,x+side*70*s,y+27*s,endX,endY);
    ctx.stroke();
    ctx.strokeStyle='rgba(92,119,67,.34)';ctx.lineWidth=1.2*s;
    ctx.beginPath();ctx.moveTo(x+side*3*s,y-1);
    ctx.bezierCurveTo(x+side*38*s,y+8*s,x+side*73*s,y+26*s,endX,endY-2*s);
    ctx.stroke();
    ctx.restore();

    const greens=['#173a29','#224a30','#2b5836','#37663d','#466f42'];
    for(let i=0;i<11;i++){
      const t=(i+1)/12;
      const spread=Math.sin(i*2.17+phase)*17*s;
      const bx=x+(endX-x)*t;
      const by=y+(endY-y)*t;
      const local=reduced.matches?0:Math.sin(time*.66+phase+i*.58)*5.5*s;
      leaf(
        bx+side*(18+spread)+local,
        by-8*s+Math.cos(i*1.37+phase)*14*s,
        (29+(i%4)*5)*s,
        (6.3+(i%3)*1.4)*s,
        side*(.18+Math.sin(i*.71)*.32)+local*.008,
        greens[i%greens.length],
        Math.min(.88,alpha+.18)
      );
    }
  }

  function draw(time){
    prep();
    if(document.body.dataset.kind!=='stretch')return;

    ctx.save();
    ctx.filter='blur(1.1px)';
    for(const c of clusters)branch(c.x,c.y,c.side,c.scale,c.phase,time,c.alpha);
    ctx.restore();

    /* Very close leaves at extreme edges: softer and slightly more mobile than the middle plane. */
    const sway=reduced.matches?0:Math.sin(time*.39)*12+Math.sin(time*.91)*3;
    ctx.save();ctx.filter='blur(2.4px)';
    for(let i=0;i<8;i++){
      leaf(354+sway+i*5,520+i*21,44+(i%3)*7,9+(i%2)*2,-.72+i*.08,'#0b2d20',.22);
      leaf(1055-sway*.7-i*4,410+i*28,48+(i%4)*5,10+(i%3),.68-i*.06,'#123726',.28);
    }
    ctx.restore();
  }

  function resize(){
    const b=host.getBoundingClientRect();
    width=Math.max(1,b.width);height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1200000/(width*height)));
    scale=Math.max(width/W,height/H);
    left=(width-W*scale)*(width<600?0.69:0.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    draw(reduced.matches?0:performance.now()/1000);wake();
  }
  function loop(now){
    frame=0;
    if(document.hidden||!visible||reduced.matches)return;
    if(now-last>34){last=now;draw(now/1000);}
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
  reduced.addEventListener('change',wake);
  document.addEventListener('visibilitychange',wake);
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',wake);
  resize();
})();
