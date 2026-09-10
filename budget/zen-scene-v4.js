/* Zen scene v4 overlay: continuous bamboo through the waterline, reflections and wind-driven ripples. */
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
  const water=575;
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
  const windRipples=Array.from({length:38},(_,i)=>({
    x:560+((i*83)%640),
    y:588+((i*47)%260),
    length:30+(i%6)*13,
    phase:i*.71,
    speed:.12+(i%5)*.025,
    alpha:.035+(i%4)*.012
  }));
  function prepare(){
    c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);c.translate(left,0);c.scale(scale,scale);
  }
  function line(x1,y1,x2,y2,color,w){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  function leaf(x,y,len,w,angle,color,alpha){
    c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();c.moveTo(-len*.45,0);c.quadraticCurveTo(-len*.05,-w,len*.55,0);c.quadraticCurveTo(-len*.04,w,-len*.45,0);c.fill();c.restore();
  }
  function ripple(x,y,r,alpha){c.strokeStyle='rgba(243,249,232,'+alpha+')';c.lineWidth=.9;c.beginPath();c.ellipse(x,y,r,r*.18,0,0,TAU);c.stroke();}
  function drawWindWater(time){
    c.save();
    c.beginPath();c.rect(535,water-4,W-535,H-water+4);c.clip();
    const wash=c.createLinearGradient(0,water,0,H);
    wash.addColorStop(0,'rgba(244,249,229,.012)');
    wash.addColorStop(.42,'rgba(220,237,220,.028)');
    wash.addColorStop(1,'rgba(174,211,202,.045)');
    c.fillStyle=wash;c.fillRect(535,water,W-535,H-water);
    for(const r of windRipples){
      const drift=motion.matches?0:Math.sin(time*r.speed+r.phase)*15;
      const lift=motion.matches?0:Math.cos(time*r.speed*.72+r.phase)*1.8;
      const x=r.x+drift,y=r.y+lift,len=r.length;
      c.strokeStyle='rgba(248,250,229,'+r.alpha+')';c.lineWidth=.7;c.lineCap='round';
      c.beginPath();c.moveTo(x-len*.5,y);c.bezierCurveTo(x-len*.18,y-1.4,x+len*.16,y+1.2,x+len*.5,y);c.stroke();
      if((Math.floor(r.phase*10)%3)===0){
        c.strokeStyle='rgba(142,190,179,'+(r.alpha*.72)+')';
        c.beginPath();c.moveTo(x-len*.32,y+4);c.bezierCurveTo(x-len*.08,y+3.2,x+len*.13,y+4.7,x+len*.36,y+4);c.stroke();
      }
    }
    c.restore();
  }
  function drawRootRipples(s,time){
    if(motion.matches){
      ripple(s.x,water,14+s.w*.8,.14);ripple(s.x,water,27+s.w*1.15,.075);return;
    }
    for(let i=0;i<3;i++){
      const p=(time*(.075+i*.008)+s.phase*.09+i*.28)%1;
      const eased=Math.sin(p*Math.PI);
      const radius=10+p*(31+s.w*1.7)+i*3;
      ripple(s.x+Math.sin(time*.24+s.phase)*1.8,water+i*.55,radius,eased*(.105-i*.018));
    }
  }
  function drawStalk(s,time){
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
      if(j<segments-1)line(x1-ww*.56,y1,x1+ww*.56,y1,below?'rgba(28,67,59,.3)':'rgba(42,79,61,.75)',Math.max(1,ww*.14));
      if(j>1&&j<segments-2&&j%2===0){
        const dir=(j+s.x)%2>1?1:-1;
        const branch=32+(j%3)*8;
        line(x1,y1,x1+dir*branch,y1-18,'rgba(50,94,73,.62)',Math.max(1,ww*.12));
        for(let k=0;k<3;k++)leaf(x1+dir*(15+k*10),y1-9-k*5,28-k*2,5.5,dir*(.2+k*.18)+(motion.matches?0:Math.sin(time*.5+s.phase+k)*.05),'#507b5e',below?.35:.72);
      }
    }
    c.save();c.globalAlpha=.15;c.beginPath();c.rect(0,water,W,H-water);c.clip();
    for(let i=0;i<13;i++){
      const p=i/12,y=water+p*145;
      const x=s.x+(xTop-s.x)*Math.max(0,(water-s.top)/height)+(Math.sin(time*.28+i+s.phase)*3);
      line(x-2+i*.22,y,x+2+i*.18,y+8,'rgba(177,210,180,.42)',Math.max(1,s.w*.12));
    }
    c.restore();
    drawRootRipples(s,time);
  }
  function draw(time){
    prepare();
    if(document.body.dataset.kind!=='meditation')return;
    const veil=c.createLinearGradient(0,535,0,760);veil.addColorStop(0,'rgba(179,209,193,0)');veil.addColorStop(.48,'rgba(179,209,193,.035)');veil.addColorStop(1,'rgba(92,143,131,.08)');c.fillStyle=veil;c.fillRect(560,520,640,260);
    drawWindWater(time);
    stalks.forEach(s=>drawStalk(s,time));
    c.save();c.globalCompositeOperation='screen';
    for(let i=0;i<18;i++){
      const x=625+i*31+Math.sin(time*.25+i)*8,y=590+i%4*23;
      const a=.045+.035*Math.sin(time*.6+i);
      line(x,y,x+32,y+2,'rgba(255,239,177,'+Math.max(.015,a)+')',.9);
    }
    c.restore();
  }
  function resize(){
    const box=host.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);
    ratio=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(1400000/(width*height)));
    scale=Math.max(width/W,height/H);left=(width-W*scale)*(width<600?.69:.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    draw(motion.matches?0:performance.now()/1000);wake();
  }
  function loop(now){frame=0;if(document.hidden||!visible||motion.matches)return;if(now-last>45){last=now;draw(now/1000);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame)cancelAnimationFrame(frame);frame=0;if(document.hidden||!visible)return;if(motion.matches){draw(0);return;}frame=requestAnimationFrame(loop);}
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(()=>{draw(motion.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);motion.addEventListener('change',wake);
  window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',wake);resize();
})();
