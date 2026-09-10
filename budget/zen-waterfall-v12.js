/* Zen waterfall v12: smaller centered rock bank with a more visible cascade. */
(function(){
  'use strict';
  const host=document.querySelector('.landscape'); if(!host)return;
  const shade=host.querySelector('.landscape-shade');
  const canvas=document.createElement('canvas'); canvas.className='zen-waterfall-v12';
  if(shade)host.insertBefore(canvas,shade); else host.appendChild(canvas);
  const ctx=canvas.getContext('2d'); if(!ctx)return;
  const W=1200,H=900,TAU=Math.PI*2,reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;

  function prep(){ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);ctx.translate(left,0);ctx.scale(scale,scale);}
  function ripple(x,y,rx,ry,a,warm){ctx.strokeStyle=warm?'rgba(255,246,205,'+a+')':'rgba(232,247,236,'+a+')';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.stroke();}
  function rock(x,y,size,a,cool){
    ctx.save();ctx.globalAlpha=a;
    const g=ctx.createLinearGradient(x-size,y-size,x+size,y+size);
    if(cool){g.addColorStop(0,'#bccabe');g.addColorStop(.43,'#80988f');g.addColorStop(1,'#43645f');}
    else{g.addColorStop(0,'#cbd4bd');g.addColorStop(.43,'#8b9f92');g.addColorStop(1,'#4c6b62');}
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-size,y+size*.08);
    ctx.bezierCurveTo(x-size*.9,y-size*.52,x-size*.35,y-size*.84,x+size*.06,y-size*.65);
    ctx.bezierCurveTo(x+size*.5,y-size*.77,x+size*.82,y-size*.22,x+size,y+size*.05);
    ctx.bezierCurveTo(x+size*.7,y+size*.25,x-size*.66,y+size*.28,x-size,y+size*.08);ctx.fill();
    ctx.strokeStyle='rgba(255,247,209,.24)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-size*.58,y-size*.08);ctx.quadraticCurveTo(x-size*.04,y-size*.46,x+size*.46,y-size*.23);ctx.stroke();ctx.restore();
  }

  function bank(fallX,lipY,waterY,mobile){
    const s=mobile?.78:.84;ctx.save();ctx.translate(fallX,lipY);ctx.scale(s,s);ctx.translate(-fallX,-lipY);
    const le=fallX-132,re=fallX+140;
    const bg=ctx.createLinearGradient(le,lipY-64,re,waterY+44);bg.addColorStop(0,'#9fb0a2');bg.addColorStop(.46,'#748d84');bg.addColorStop(1,'#4c6d67');ctx.fillStyle=bg;
    ctx.beginPath();ctx.moveTo(le,waterY+25);ctx.bezierCurveTo(le+9,lipY+12,le+52,lipY-28,fallX-60,lipY-18);ctx.bezierCurveTo(fallX-22,lipY-58,fallX+12,lipY-44,fallX+35,lipY-14);ctx.bezierCurveTo(fallX+78,lipY-32,re-14,lipY+14,re,waterY+23);ctx.lineTo(re,waterY+52);ctx.lineTo(le,waterY+52);ctx.closePath();ctx.fill();
    rock(fallX-75,lipY+18,42,.97,true);rock(fallX-32,lipY,50,.99,false);rock(fallX+14,lipY+10,46,.98,true);rock(fallX+55,lipY+27,39,.96,false);rock(fallX+89,lipY+48,32,.93,true);rock(fallX-103,lipY+49,30,.91,true);
    ctx.restore();

    /* Physical waterfall origin: a dark wet cleft between the two centre stones. */
    const notch=ctx.createRadialGradient(fallX+9,lipY+24,1,fallX+9,lipY+24,38);notch.addColorStop(0,'rgba(30,62,59,.58)');notch.addColorStop(.55,'rgba(39,72,67,.20)');notch.addColorStop(1,'rgba(39,72,67,0)');ctx.fillStyle=notch;ctx.fillRect(fallX-31,lipY-1,84,57);

    /* Water in front of the lower bank makes the stones feel submerged. */
    const veil=ctx.createLinearGradient(0,waterY-15,0,waterY+65);veil.addColorStop(0,'rgba(171,209,199,.07)');veil.addColorStop(.35,'rgba(153,198,191,.28)');veil.addColorStop(1,'rgba(124,180,176,.48)');ctx.fillStyle=veil;ctx.fillRect(fallX-122,waterY-15,250,82);
  }

  function cascade(fallX,lipY,waterY,time,mobile){
    const n=mobile?22:24;ctx.save();ctx.globalCompositeOperation='screen';
    const mist=ctx.createRadialGradient(fallX+18,waterY,0,fallX+18,waterY,78);mist.addColorStop(0,'rgba(249,249,220,.25)');mist.addColorStop(.42,'rgba(228,246,233,.12)');mist.addColorStop(1,'rgba(228,246,233,0)');ctx.fillStyle=mist;ctx.fillRect(fallX-72,waterY-58,175,120);
    for(let i=0;i<n;i++){
      const sx=fallX-9+i*2.35,ph=i*.57,sw=reduced.matches?0:Math.sin(time*1.1+ph)*(1+(i%4)*.28),sh=reduced.matches?.24:.19+.18*(Math.sin(time*1.55+ph)+1)*.5,start=lipY+24+(i%3)*1.2,end=sx+11+sw*1.7;
      ctx.strokeStyle='rgba(238,250,236,'+sh+')';ctx.lineWidth=i%5===0?2.1:(i%2===0?1.3:.9);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx,start);ctx.bezierCurveTo(sx-2+sw,start+25,sx+3+sw,waterY-29,end,waterY);ctx.stroke();
      if(!reduced.matches&&i%2===0){const p=(time*.54+i/n)%1;ctx.fillStyle='rgba(255,245,194,'+(.16+(1-p)*.20)+')';ctx.beginPath();ctx.ellipse(sx+11*p*p,start+(waterY-start)*p,.85,2.5,0,0,TAU);ctx.fill();}
    }
    ctx.strokeStyle='rgba(255,247,207,.34)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(fallX-12,lipY+23);ctx.bezierCurveTo(fallX+4,lipY+20,fallX+24,lipY+25,fallX+42,lipY+21);ctx.stroke();ctx.restore();
    for(let i=0;i<5;i++){const p=reduced.matches?.38:(time*.25+i/5)%1;ripple(fallX+18,waterY+4,8+p*68,2+p*10,(1-p)*.33,i%2===0);}
  }

  function draw(time){prep();if(document.body.dataset.kind!=='meditation')return;const mobile=width<700;const fallX=mobile?835:950,lipY=mobile?528:510,waterY=mobile?636:610;bank(fallX,lipY,waterY,mobile);cascade(fallX,lipY,waterY,time,mobile);}
  function resize(){const b=host.getBoundingClientRect();width=Math.max(1,b.width);height=Math.max(1,b.height);ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1200000/(width*height)));scale=Math.max(width/W,height/H);left=(width-W*scale)*(width<600?.69:.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);draw(reduced.matches?0:performance.now()/1000);wake();}
  function loop(now){frame=0;if(document.hidden||!visible||reduced.matches)return;if(now-last>32){last=now;draw(now/1000);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame)cancelAnimationFrame(frame);frame=0;if(document.hidden||!visible)return;if(reduced.matches){draw(0);return;}frame=requestAnimationFrame(loop);}
  new ResizeObserver(resize).observe(host);new IntersectionObserver(e=>{visible=e[0].isIntersecting;wake();}).observe(host);new MutationObserver(()=>{draw(reduced.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake);window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',wake);resize();
})();
