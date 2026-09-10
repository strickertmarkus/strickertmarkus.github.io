/* Zen scene v6 overlay: continuous bamboo, stronger visible breeze and wind-driven pond movement. */
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
  const windRipples=Array.from({length:52},(_,i)=>({
    x:545+((i*79)%665),
    y:586+((i*43)%275),
    length:38+(i%7)*15,
    phase:i*.67,
    speed:.20+(i%6)*.028,
    alpha:.070+(i%5)*.014
  }));
  function prepare(){
    c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);c.translate(left,0);c.scale(scale,scale);
  }
  function line(x1,y1,x2,y2,color,w){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  function leaf(x,y,len,w,angle,color,alpha){
    c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();c.moveTo(-len*.45,0);c.quadraticCurveTo(-len*.05,-w,len*.55,0);c.quadraticCurveTo(-len*.04,w,-len*.45,0);c.fill();c.restore();
  }
  function ripple(x,y,r,alpha,lineWidth=1.15){c.strokeStyle='rgba(248,250,229,'+alpha+')';c.lineWidth=lineWidth;c.beginPath();c.ellipse(x,y,r,r*.19,0,0,TAU);c.stroke();}
  function mobileBoost(){return width<700?1.42:1;}

  function drawWindBands(time){
    if(motion.matches)return;
    const boost=mobileBoost();
    c.save();c.globalCompositeOperation='screen';
    for(let i=0;i<9;i++){
      const laneY=water+18+i*29+Math.sin(time*.35+i)*3.2;
      const travel=((time*(48+i*4)+i*103)%(W+330))-165;
      const len=(125+i%3*34)*boost;
      const lift=Math.sin(time*.72+i*.8)*3.4;
      c.strokeStyle='rgba(255,247,205,'+(0.055+(i%3)*.018)+')';c.lineWidth=1.2+(i%2)*.35;c.lineCap='round';
      c.beginPath();c.moveTo(travel-len*.5,laneY);c.bezierCurveTo(travel-len*.18,laneY-3-lift,travel+len*.17,laneY+3+lift,travel+len*.5,laneY);c.stroke();
      c.strokeStyle='rgba(146,196,184,'+(0.040+(i%4)*.012)+')';c.lineWidth=.85;
      c.beginPath();c.moveTo(travel-len*.30,laneY+7);c.bezierCurveTo(travel-len*.08,laneY+5,travel+len*.11,laneY+9,travel+len*.34,laneY+7);c.stroke();
    }
    c.restore();
  }

  function drawWindWater(time){
    c.save();
    c.beginPath();c.rect(525,water-5,W-525,H-water+5);c.clip();
    const wash=c.createLinearGradient(0,water,0,H);
    wash.addColorStop(0,'rgba(255,247,213,.018)');
    wash.addColorStop(.34,'rgba(229,241,223,.040)');
    wash.addColorStop(1,'rgba(167,209,199,.065)');
    c.fillStyle=wash;c.fillRect(525,water,W-525,H-water);
    drawWindBands(time);
    const boost=mobileBoost();
    for(const r of windRipples){
      const drift=motion.matches?0:Math.sin(time*r.speed+r.phase)*28*boost;
      const lift=motion.matches?0:Math.cos(time*r.speed*.78+r.phase)*3.6;
      const x=r.x+drift,y=r.y+lift,len=r.length*boost;
      c.strokeStyle='rgba(250,251,229,'+r.alpha+')';c.lineWidth=1.05;c.lineCap='round';
      c.beginPath();c.moveTo(x-len*.5,y);c.bezierCurveTo(x-len*.18,y-2.6,x+len*.16,y+2.2,x+len*.5,y);c.stroke();
      if((Math.floor(r.phase*10)%3)===0){
        c.strokeStyle='rgba(128,183,171,'+(r.alpha*.72)+')';c.lineWidth=.9;
        c.beginPath();c.moveTo(x-len*.34,y+5);c.bezierCurveTo(x-len*.09,y+3.7,x+len*.14,y+6.4,x+len*.38,y+5);c.stroke();
      }
    }
    c.restore();
  }

  function drawRootRipples(s,time){
    const boost=mobileBoost();
    if(motion.matches){
      ripple(s.x,water,15+s.w*.9,.18);ripple(s.x,water,30+s.w*1.3,.095);return;
    }
    for(let i=0;i<4;i++){
      const p=(time*(.13+i*.012)+s.phase*.09+i*.22)%1;
      const eased=Math.sin(p*Math.PI);
      const radius=(11+p*(39+s.w*1.9)+i*4)*boost;
      ripple(s.x+Math.sin(time*.42+s.phase)*3.2,water+i*.7,radius,eased*(.165-i*.025),1.05);
    }
  }

  function drawStalk(s,time){
    const boost=mobileBoost();
    const breeze=motion.matches?0:(Math.sin(time*.58+s.phase)*7.5+Math.sin(time*.21+s.phase*1.7)*4.2)*boost;
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
        const branch=34+(j%3)*9;
        const branchSwing=motion.matches?0:Math.sin(time*.72+s.phase+j*.3)*4.5*boost;
        line(x1,y1,x1+dir*(branch+branchSwing),y1-18,'rgba(50,94,73,.65)',Math.max(1,ww*.12));
        for(let k=0;k<3;k++){
          const flutter=motion.matches?0:Math.sin(time*1.05+s.phase+k+j*.2)*.12*boost;
          leaf(x1+dir*(16+k*11)+dir*branchSwing*.55,y1-9-k*5,29-k*2,5.8,dir*(.2+k*.18)+flutter,'#507b5e',below?.35:.76);
        }
      }
    }
    c.save();c.globalAlpha=.19;c.beginPath();c.rect(0,water,W,H-water);c.clip();
    for(let i=0;i<15;i++){
      const p=i/14,y=water+p*155;
      const x=s.x+(xTop-s.x)*Math.max(0,(water-s.top)/height)+(motion.matches?0:Math.sin(time*.48+i+s.phase)*5.5*boost);
      line(x-3+i*.23,y,x+3+i*.18,y+8,'rgba(183,215,184,.45)',Math.max(1,s.w*.13));
    }
    c.restore();
    drawRootRipples(s,time);
  }

  function draw(time){
    prepare();
    if(document.body.dataset.kind!=='meditation')return;
    const veil=c.createLinearGradient(0,530,0,775);veil.addColorStop(0,'rgba(179,209,193,0)');veil.addColorStop(.38,'rgba(246,244,207,.028)');veil.addColorStop(.68,'rgba(179,209,193,.055)');veil.addColorStop(1,'rgba(92,143,131,.09)');c.fillStyle=veil;c.fillRect(540,515,660,285);
    drawWindWater(time);
    stalks.forEach(s=>drawStalk(s,time));
    c.save();c.globalCompositeOperation='screen';
    const boost=mobileBoost();
    for(let i=0;i<24;i++){
      const x=600+i*27+Math.sin(time*.48+i)*14*boost,y=590+i%5*22+Math.sin(time*.8+i*.6)*2.5;
      const a=.065+.050*Math.sin(time*.85+i);
      line(x,y,x+42*boost,y+2,'rgba(255,239,177,'+Math.max(.025,a)+')',1.05);
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
  function loop(now){frame=0;if(document.hidden||!visible||motion.matches)return;if(now-last>30){last=now;draw(now/1000);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame)cancelAnimationFrame(frame);frame=0;if(document.hidden||!visible)return;if(motion.matches){draw(0);return;}frame=requestAnimationFrame(loop);}
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(()=>{draw(motion.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);motion.addEventListener('change',wake);
  window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',wake);resize();
})();
