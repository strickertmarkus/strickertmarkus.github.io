/* Zen meditation v8: one clean visible canvas for bamboo, water, ripples, rocks and morning light. */
(function(){
  'use strict';
  const host=document.querySelector('.landscape');
  if(!host)return;
  const shade=host.querySelector('.landscape-shade');
  const canvas=document.createElement('canvas');
  canvas.className='landscape-meditation-v8';
  if(shade)host.insertBefore(canvas,shade);else host.appendChild(canvas);
  const c=canvas.getContext('2d');
  if(!c)return;

  const W=1200,H=900,TAU=Math.PI*2,water=575;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;
  const bg=document.createElement('canvas');bg.width=W;bg.height=H;const b=bg.getContext('2d');

  const back=[
    {x:585,w:6,lean:-28,phase:.2,alpha:.40},{x:630,w:7,lean:20,phase:.8,alpha:.44},{x:675,w:5,lean:-14,phase:1.5,alpha:.34},
    {x:720,w:8,lean:22,phase:2.1,alpha:.48},{x:770,w:5,lean:-20,phase:2.7,alpha:.34},{x:815,w:7,lean:16,phase:3.4,alpha:.44},
    {x:860,w:6,lean:-18,phase:4.0,alpha:.38},{x:905,w:8,lean:24,phase:4.5,alpha:.45},{x:950,w:5,lean:-13,phase:5.1,alpha:.34},
    {x:995,w:7,lean:19,phase:5.7,alpha:.42},{x:1040,w:6,lean:-22,phase:6.2,alpha:.37},{x:1090,w:8,lean:17,phase:6.8,alpha:.43},
    {x:1140,w:6,lean:-18,phase:7.4,alpha:.35},{x:1185,w:7,lean:20,phase:8.0,alpha:.40}
  ];
  const front=[
    {x:650,w:10,lean:-34,phase:.4,alpha:.76},{x:735,w:13,lean:26,phase:1.4,alpha:.88},{x:825,w:9,lean:-22,phase:2.4,alpha:.78},
    {x:915,w:15,lean:34,phase:3.5,alpha:.92},{x:1005,w:11,lean:-27,phase:4.5,alpha:.84},{x:1095,w:14,lean:24,phase:5.6,alpha:.90},
    {x:1180,w:10,lean:-20,phase:6.7,alpha:.80}
  ];

  function line(ctx,x1,y1,x2,y2,color,w){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function ellipse(ctx,x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
  function glow(ctx,x,y,r,rgb,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(.28,`rgba(${rgb},${a*.36})`);g.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function leaf(ctx,x,y,len,w,angle,alpha){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#4c7761';ctx.beginPath();ctx.moveTo(-len*.46,0);ctx.quadraticCurveTo(-len*.05,-w,len*.54,0);ctx.quadraticCurveTo(-len*.05,w,-len*.46,0);ctx.fill();ctx.strokeStyle='rgba(224,232,185,.28)';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(-len*.28,0);ctx.lineTo(len*.31,0);ctx.stroke();ctx.restore();}
  function rock(ctx,x,y,s){const g=ctx.createLinearGradient(x-s,y-s,x+s,y+s);g.addColorStop(0,'#c6d0b9');g.addColorStop(.48,'#84988d');g.addColorStop(1,'#4b6963');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-s,y);ctx.bezierCurveTo(x-s*.88,y-s*.62,x-s*.35,y-s*.86,x+s*.05,y-s*.66);ctx.bezierCurveTo(x+s*.48,y-s*.78,x+s*.78,y-s*.25,x+s,y);ctx.bezierCurveTo(x+s*.74,y+s*.19,x-s*.68,y+s*.25,x-s,y);ctx.fill();line(ctx,x-s*.72,y-s*.12,x+s*.35,y-s*.42,'rgba(248,244,207,.35)',1.3);}

  function makeBackground(){
    const sky=b.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#a8c5be');sky.addColorStop(.22,'#bfd3c7');sky.addColorStop(.50,'#a9c9bc');sky.addColorStop(.69,'#8fb9ae');sky.addColorStop(1,'#6ea09a');b.fillStyle=sky;b.fillRect(0,0,W,H);
    glow(b,805,145,430,'255,242,184',.38);glow(b,720,245,260,'229,247,220',.18);
    ellipse(b,806,148,18,18,'rgba(255,248,211,.46)');
    // distant foliage/hills
    b.fillStyle='rgba(102,148,129,.19)';b.beginPath();b.moveTo(0,390);for(let x=0;x<=W;x+=30)b.lineTo(x,390+Math.sin(x/145)*28+Math.sin(x/57)*9);b.lineTo(W,520);b.lineTo(0,520);b.closePath();b.fill();
    b.fillStyle='rgba(73,118,99,.24)';b.beginPath();b.moveTo(0,470);for(let x=0;x<=W;x+=30)b.lineTo(x,470+Math.sin(x/190+1)*20);b.lineTo(W,560);b.lineTo(0,560);b.closePath();b.fill();
    // bank and rock fall on right
    for(let i=0;i<14;i++)rock(b,885+i*27,558+Math.sin(i*.77)*15,24+(i%4)*7);
    rock(b,1010,535,78);rock(b,1080,588,98);rock(b,1155,664,72);rock(b,1118,735,40);
    // water base
    const wg=b.createLinearGradient(0,water,0,H);wg.addColorStop(0,'rgba(189,218,205,.64)');wg.addColorStop(.35,'rgba(159,203,193,.70)');wg.addColorStop(1,'rgba(116,174,169,.76)');b.fillStyle=wg;b.fillRect(0,water,W,H-water);
    // soft horizon mist
    const mist=b.createLinearGradient(0,water-55,0,water+70);mist.addColorStop(0,'rgba(238,246,229,0)');mist.addColorStop(.5,'rgba(238,246,229,.20)');mist.addColorStop(1,'rgba(238,246,229,0)');b.fillStyle=mist;b.fillRect(0,water-55,W,130);
  }
  makeBackground();

  function prepare(){c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);c.translate(left,0);c.scale(scale,scale);}
  function mobileBoost(){return width<700?1.30:1;}
  function waterX(s,time){const sway=reduce.matches?0:(Math.sin(time*.50+s.phase)*9+Math.sin(time*.19+s.phase*1.7)*4)*mobileBoost();const topX=s.x+s.lean+sway;const t=(H+75-water)/(H+75+145);return s.x+(topX-s.x)*t;}

  function drawStem(s,time,depth){
    const boost=mobileBoost();
    const sway=reduce.matches?0:(Math.sin(time*.50+s.phase)*9+Math.sin(time*.19+s.phase*1.7)*4)*boost*(depth?.65:1);
    const baseY=H+75,topY=-145,topX=s.x+s.lean+sway,total=baseY-topY,segments=15;
    for(let j=0;j<segments;j++){
      const t0=j/segments,t1=(j+1)/segments,y0=baseY-total*t0,y1=baseY-total*t1,x0=s.x+(topX-s.x)*t0,x1=s.x+(topX-s.x)*t1,ww=s.w*(1-j/segments*.30);
      const submerged=y0>water&&y1>water;
      const alpha=s.alpha*(submerged?.24:1);
      const g=c.createLinearGradient(x0-ww,y0,x0+ww,y0);
      g.addColorStop(0,`rgba(42,84,70,${alpha*.78})`);g.addColorStop(.38,`rgba(116,159,122,${alpha})`);g.addColorStop(.60,`rgba(190,199,143,${alpha*.84})`);g.addColorStop(1,`rgba(49,93,74,${alpha*.82})`);
      line(c,x0,y0,x1,y1,g,ww);
      line(c,x0+ww*.18,y0,x1+ww*.18,y1,`rgba(236,239,190,${alpha*.28})`,Math.max(.6,ww*.07));
      if(j<segments-1)line(c,x1-ww*.55,y1,x1+ww*.55,y1,`rgba(49,82,65,${alpha*.70})`,Math.max(.9,ww*.12));
      if(!submerged&&j>1&&j<12&&j%2===0){
        const dir=((j+Math.round(s.x))%4)<2?1:-1,branch=depth?27:39,flutter=reduce.matches?0:Math.sin(time*.82+s.phase+j)*5*boost;
        line(c,x1,y1,x1+dir*(branch+flutter),y1-17,`rgba(51,94,74,${alpha*.72})`,Math.max(.9,ww*.10));
        for(let k=0;k<3;k++)leaf(c,x1+dir*(13+k*10)+dir*flutter*.5,y1-7-k*5,(depth?22:29)-k,depth?4.3:5.4,dir*(.18+k*.16)+(reduce.matches?0:Math.sin(time*1.05+s.phase+k)*.08*boost),alpha*(depth?.68:.90));
      }
    }
  }

  function drawRippleSet(x,time,phase,depth){
    if(reduce.matches){
      for(let i=0;i<2;i++){c.strokeStyle=`rgba(251,248,218,${depth?.08:.13-i*.035})`;c.lineWidth=.9;c.beginPath();c.ellipse(x,water+i*.6,18+i*20,(18+i*20)*.18,0,0,TAU);c.stroke();}
      return;
    }
    const count=depth?2:3;
    for(let i=0;i<count;i++){
      const p=(time*(depth?.085:.115)+phase*.11+i*.28)%1,r=10+p*(depth?42:58)+i*5,a=Math.sin(p*Math.PI)*(depth?.10:.17-i*.025);
      c.strokeStyle=`rgba(255,248,207,${Math.max(0,a)})`;c.lineWidth=depth?.8:1.05;c.beginPath();c.ellipse(x+Math.sin(time*.35+phase)*2.2,water+i*.65,r,r*.19,0,0,TAU);c.stroke();
    }
  }

  function drawWaterMotion(time){
    c.save();c.beginPath();c.rect(0,water,W,H-water);c.clip();
    const boost=mobileBoost();
    for(let i=0;i<34;i++){
      const y=water+12+(i*31)%295,travel=((time*(34+(i%5)*5)+i*73)%(W+220))-110,len=(50+(i%6)*18)*boost;
      c.strokeStyle=`rgba(247,248,221,${.040+(i%4)*.012})`;c.lineWidth=.85;c.lineCap='round';c.beginPath();c.moveTo(travel-len*.5,y);c.bezierCurveTo(travel-len*.18,y-2,travel+len*.17,y+2,travel+len*.5,y);c.stroke();
    }
    // broad soft moving bands: visible like the waterfall, still calm
    if(!reduce.matches){
      for(let i=0;i<6;i++){
        const y=water+24+i*48+Math.sin(time*.35+i)*4,x=((time*(42+i*4)+i*161)%(W+360))-180,len=150+i%2*42;
        c.strokeStyle=`rgba(255,243,185,${.055+i%2*.018})`;c.lineWidth=1.2;c.beginPath();c.moveTo(x-len*.5,y);c.bezierCurveTo(x-len*.2,y-3,x+len*.18,y+3,x+len*.5,y);c.stroke();
      }
    }
    c.restore();
  }

  function drawWaterfall(time){
    c.save();c.globalCompositeOperation='screen';
    for(let i=0;i<18;i++){
      const x=1050+i*3.0,shimmer=.13+.15*Math.sin(time*1.3+i*.7),drop=reduce.matches?.35:(time*.43+i/18)%1;
      c.strokeStyle=`rgba(231,247,228,${shimmer})`;c.lineWidth=i%4===0?1.8:1;c.beginPath();c.moveTo(x,552);c.bezierCurveTo(x-3,590,x+8,630,x+25,688);c.stroke();
      ellipse(c,x+25*drop*drop,552+136*drop,.7,2.4,'rgba(255,246,199,.34)');
    }
    c.restore();
    for(let i=0;i<4;i++){
      const p=reduce.matches?.35:(time*.22+i/4)%1;c.strokeStyle=`rgba(237,249,232,${(1-p)*.25})`;c.lineWidth=1;c.beginPath();c.ellipse(1080,694,7+p*62,2+p*10,0,0,TAU);c.stroke();
    }
  }

  function drawSun(time){
    c.save();c.globalCompositeOperation='screen';
    for(let i=0;i<4;i++){
      const sx=750+i*47+(reduce.matches?0:Math.sin(time*.08+i)*10),g=c.createLinearGradient(sx,60,sx-170,690);g.addColorStop(0,'rgba(255,246,198,.15)');g.addColorStop(.50,'rgba(245,245,211,.065)');g.addColorStop(1,'rgba(238,247,225,0)');c.fillStyle=g;c.beginPath();c.moveTo(sx,0);c.lineTo(sx+34,0);c.lineTo(sx-125,700);c.lineTo(sx-220,700);c.closePath();c.fill();
    }
    glow(c,805+(reduce.matches?0:Math.sin(time*.11)*7),150,125,'255,246,198',.17);c.restore();
  }

  function draw(time){
    prepare();
    if(document.body.dataset.kind!=='meditation')return;
    c.drawImage(bg,0,0);
    drawSun(time);
    back.forEach(s=>drawStem(s,time,true));
    // water sits in front of distant culms and makes them read as immersed, not clipped
    const haze=c.createLinearGradient(0,water-20,0,water+100);haze.addColorStop(0,'rgba(215,234,221,0)');haze.addColorStop(.45,'rgba(215,234,221,.16)');haze.addColorStop(1,'rgba(176,211,203,.07)');c.fillStyle=haze;c.fillRect(0,water-20,W,120);
    drawWaterMotion(time);
    back.forEach(s=>drawRippleSet(waterX(s,time),time,s.phase,true));
    front.forEach(s=>drawStem(s,time,false));
    front.forEach(s=>drawRippleSet(waterX(s,time),time,s.phase,false));
    drawWaterfall(time);
    // thin warm reflections across the pond
    c.save();c.globalCompositeOperation='screen';for(let i=0;i<18;i++){const y=water+20+i*14,x=790+(reduce.matches?0:Math.sin(time*.32+i*.7)*16),w=20+(i%5)*13;c.strokeStyle=`rgba(255,239,177,${.045+(i%4)*.018})`;c.lineWidth=.9;c.beginPath();c.moveTo(x-w,y);c.lineTo(x+w,y+Math.sin(i)*1.5);c.stroke();}c.restore();
  }

  function resize(){const box=host.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1450000/(width*height)));scale=Math.max(width/W,height/H);left=(width-W*scale)*(width<600?.69:.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);draw(reduce.matches?0:performance.now()/1000);wake();}
  function loop(now){frame=0;if(document.hidden||!visible||reduce.matches)return;if(now-last>32){last=now;draw(now/1000);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame)cancelAnimationFrame(frame);frame=0;if(document.hidden||!visible)return;if(reduce.matches){draw(0);return;}frame=requestAnimationFrame(loop);}
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(()=>{draw(reduce.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);reduce.addEventListener('change',wake);window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',wake);resize();
})();
