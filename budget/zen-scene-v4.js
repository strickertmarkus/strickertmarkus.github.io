/* Zen scene v4 overlay: continuous bamboo through the waterline with reflections. */
(function(){
  'use strict';
  const host=document.querySelector('.landscape');
  if(!host)return;
  const shade=host.querySelector('.landscape-shade');
  const canvas=document.createElement('canvas');
  canvas.className='landscape-v4-overlay';
  if(shade)host.insertBefore(canvas,shade);else host.appendChild(canvas);
  const c=canvas.getContext('2d');
  if(!c)return;
  const W=1200,H=900,TAU=Math.PI*2;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;
  const stalks=[
    {x:690,base:674,top:-110,w:9,lean:-42,phase:.4},
    {x:754,base:706,top:-65,w:13,lean:24,phase:1.1},
    {x:822,base:651,top:-145,w:8,lean:-18,phase:2.2},
    {x:892,base:742,top:-90,w:15,lean:36,phase:3.1},
    {x:965,base:690,top:-130,w:10,lean:-28,phase:4.0},
    {x:1038,base:720,top:-80,w:14,lean:22,phase:4.8},
    {x:1115,base:655,top:-120,w:8,lean:-20,phase:5.6},
    {x:1182,base:748,top:-55,w:12,lean:30,phase:6.2}
  ];
  function prepare(){
    c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);c.translate(left,0);c.scale(scale,scale);
  }
  function line(x1,y1,x2,y2,color,w){c.strokeStyle=color;c.lineWidth=w;c.lineCap='butt';c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  function leaf(x,y,len,w,angle,color,alpha){
    c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();c.moveTo(-len*.45,0);c.quadraticCurveTo(-len*.05,-w,len*.55,0);c.quadraticCurveTo(-len*.04,w,-len*.45,0);c.fill();c.restore();
  }
  function ripple(x,y,r,alpha){c.strokeStyle='rgba(235,247,223,'+alpha+')';c.lineWidth=1;c.beginPath();c.ellipse(x,y,r,r*.18,0,0,TAU);c.stroke();}
  function drawStalk(s,time){
    const water=575;
    const breeze=motion.matches?0:Math.sin(time*.33+s.phase)*5;
    const xTop=s.x+s.lean+breeze;
    const height=s.base-s.top;
    const segments=Math.max(8,Math.round(height/72));
    for(let j=0;j<segments;j++){
      const t0=j/segments,t1=(j+1)/segments;
      const y0=s.base-height*t0,y1=s.base-height*t1;
      const x0=s.x+(xTop-s.x)*t0,x1=s.x+(xTop-s.x)*t1;
      const below=(y0>water&&y1>water);
      const ww=s.w*(1-j/segments*.35);
      const g=c.createLinearGradient(x0-ww,y0,x0+ww,y0);
      if(below){g.addColorStop(0,'rgba(39,83,72,.32)');g.addColorStop(.5,'rgba(115,156,124,.38)');g.addColorStop(1,'rgba(29,68,60,.28)');}
      else{g.addColorStop(0,'rgba(39,83,70,.72)');g.addColorStop(.36,'rgba(111,154,117,.88)');g.addColorStop(.58,'rgba(170,190,139,.83)');g.addColorStop(1,'rgba(44,86,70,.78)');}
      line(x0,y0,x1,y1,g,ww);
      line(x0+ww*.18,y0,x1+ww*.18,y1,below?'rgba(220,235,201,.18)':'rgba(225,234,188,.48)',Math.max(.7,ww*.08));
      if(j<segments-1){line(x1-ww*.56,y1,x1+ww*.56,y1,below?'rgba(28,67,59,.3)':'rgba(42,79,61,.75)',Math.max(1,ww*.14));}
      if(j>1&&j<segments-2&&j%2===0){
        const dir=(j+s.x)%2>1?1:-1;
        const branch=32+(j%3)*8;
        line(x1,y1,x1+dir*branch,y1-18,'rgba(50,94,73,.62)',Math.max(1,ww*.12));
        for(let k=0;k<3;k++)leaf(x1+dir*(15+k*10),y1-9-k*5,28-k*2,5.5,dir*(.2+k*.18)+(motion.matches?0:Math.sin(time*.5+s.phase+k)*.05),'#507b5e',below?.35:.72,below?.35:.72);
      }
    }
    // Reflection: same culm mirrored beneath water, blurred by transparency and waviness.
    c.save();c.globalAlpha=.15;c.beginPath();c.rect(0,water,W,H-water);c.clip();
    for(let i=0;i<13;i++){
      const p=i/12,y=water+p*145;
      const x=s.x+(xTop-s.x)*Math.max(0,(water-s.top)/height)+(Math.sin(time*.28+i+s.phase)*3);
      line(x-2+i*.22,y,x+2+i*.18,y+8,'rgba(177,210,180,.42)',Math.max(1,s.w*.12));
    }
    c.restore();
    ripple(s.x,water,12+(s.w*.8),.18);ripple(s.x,water,24+(s.w*1.3),.1);
  }
  function draw(time){
    prepare();
    if(document.body.dataset.kind!=='meditation')return;
    // A soft foreground veil hides harsh lower edges and lets culms feel embedded in the pond.
    const veil=c.createLinearGradient(0,535,0,760);veil.addColorStop(0,'rgba(179,209,193,0)');veil.addColorStop(.48,'rgba(179,209,193,.035)');veil.addColorStop(1,'rgba(92,143,131,.08)');c.fillStyle=veil;c.fillRect(560,520,640,260);
    stalks.forEach(s=>drawStalk(s,time));
    // Fine reflected highlights around the immersed culms.
    c.save();c.globalCompositeOperation='screen';for(let i=0;i<18;i++){const x=625+i*31+Math.sin(time*.25+i)*8,y=590+i%4*23;const a=.06+.05*Math.sin(time*.6+i);line(x,y,x+32,y+2,'rgba(248,239,178,'+Math.max(.02,a)+')',1);};c.restore();
  }
  function resize(){const box=host.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);ratio=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(1400000/(width*height)));scale=Math.max(width/W,height/H);left=(width-W*scale)*(width<600?.69:.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);draw(motion.matches?0:performance.now()/1000);wake();}
  function loop(now){frame=0;if(document.hidden||!visible||motion.matches)return;if(now-last>45){last=now;draw(now/1000);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame)cancelAnimationFrame(frame);frame=0;if(document.hidden||!visible)return;if(motion.matches){draw(0);return;}frame=requestAnimationFrame(loop);}
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(()=>{draw(motion.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);motion.addEventListener('change',wake);window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',wake);resize();
})();
