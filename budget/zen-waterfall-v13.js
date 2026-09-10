/* Zen waterfall v13: two coherent rock masses, clear cascade origin and mobile-safe placement. */
(function(){
  'use strict';
  const host=document.querySelector('.landscape');
  if(!host)return;
  const shade=host.querySelector('.landscape-shade');
  const canvas=document.createElement('canvas');
  canvas.className='zen-waterfall-v13';
  if(shade)host.insertBefore(canvas,shade); else host.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx)return;

  const W=1200,H=900,TAU=Math.PI*2;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;

  function prep(){
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.translate(left,0);
    ctx.scale(scale,scale);
  }

  function ripple(x,y,rx,ry,a,warm){
    ctx.strokeStyle=warm?'rgba(255,246,205,'+a+')':'rgba(232,247,236,'+a+')';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.stroke();
  }

  function rockMass(points,lightX,lightY){
    const g=ctx.createLinearGradient(lightX-120,lightY-90,lightX+150,lightY+130);
    g.addColorStop(0,'#bac8b8');
    g.addColorStop(.38,'#82978c');
    g.addColorStop(.72,'#607c73');
    g.addColorStop(1,'#456761');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++){
      const p=points[i];
      if(p.length===2)ctx.lineTo(p[0],p[1]);
      else ctx.bezierCurveTo(p[0],p[1],p[2],p[3],p[4],p[5]);
    }
    ctx.closePath();ctx.fill();

    ctx.strokeStyle='rgba(255,248,211,.22)';
    ctx.lineWidth=1.15;
    ctx.beginPath();
    ctx.moveTo(lightX-72,lightY-20);
    ctx.quadraticCurveTo(lightX-16,lightY-49,lightX+45,lightY-31);
    ctx.stroke();
  }

  function drawBank(fallX,lipY,waterY,mobile){
    const s=mobile?.79:.86;
    ctx.save();
    ctx.translate(fallX,lipY);
    ctx.scale(s,s);
    ctx.translate(-fallX,-lipY);

    /* Rear slab: one coherent shape, not a pile of circles. */
    rockMass([
      [fallX-122,waterY+30],
      [fallX-119,lipY+36,fallX-95,lipY-34,fallX-38,lipY-42],
      [fallX-5,lipY-69,fallX+41,lipY-52,fallX+57,lipY-18],
      [fallX+92,lipY-29,fallX+126,lipY+12,fallX+127,waterY+28],
      [fallX+127,waterY+54],[fallX-122,waterY+54]
    ],fallX-18,lipY);

    /* Front ledge: second continuous mass creates the lip and hides stems behind it. */
    rockMass([
      [fallX-82,waterY+25],
      [fallX-77,lipY+31,fallX-49,lipY-4,fallX-9,lipY+2],
      [fallX+14,lipY-18,fallX+51,lipY-7,fallX+67,lipY+16],
      [fallX+91,lipY+30,fallX+103,lipY+52,fallX+102,waterY+28],
      [fallX+102,waterY+48],[fallX-82,waterY+48]
    ],fallX+5,lipY+10);
    ctx.restore();

    /* The cleft is the physical source of the cascade. */
    const cleft=ctx.createLinearGradient(fallX-18,lipY+10,fallX+38,lipY+42);
    cleft.addColorStop(0,'rgba(37,69,65,.12)');
    cleft.addColorStop(.48,'rgba(27,57,55,.68)');
    cleft.addColorStop(1,'rgba(43,77,70,.10)');
    ctx.fillStyle=cleft;
    ctx.beginPath();
    ctx.moveTo(fallX-7,lipY+14);
    ctx.bezierCurveTo(fallX+5,lipY+10,fallX+23,lipY+12,fallX+35,lipY+22);
    ctx.bezierCurveTo(fallX+27,lipY+36,fallX+16,lipY+47,fallX+12,lipY+58);
    ctx.bezierCurveTo(fallX+5,lipY+45,fallX-2,lipY+31,fallX-7,lipY+14);
    ctx.fill();

    /* Water visually sits in front of the lowest rock edge. */
    const veil=ctx.createLinearGradient(0,waterY-9,0,waterY+58);
    veil.addColorStop(0,'rgba(183,217,207,.04)');
    veil.addColorStop(.32,'rgba(158,201,193,.24)');
    veil.addColorStop(1,'rgba(126,182,177,.46)');
    ctx.fillStyle=veil;
    ctx.fillRect(fallX-112,waterY-9,235,70);

    ctx.strokeStyle='rgba(255,244,193,.18)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(fallX-74,waterY+8);ctx.quadraticCurveTo(fallX+5,waterY+2,fallX+82,waterY+8);ctx.stroke();
  }

  function drawCascade(fallX,lipY,waterY,time,mobile){
    const n=mobile?20:22;
    ctx.save();ctx.globalCompositeOperation='screen';

    const mist=ctx.createRadialGradient(fallX+14,waterY+1,0,fallX+14,waterY+1,72);
    mist.addColorStop(0,'rgba(249,249,220,.24)');
    mist.addColorStop(.43,'rgba(228,246,233,.12)');
    mist.addColorStop(1,'rgba(228,246,233,0)');
    ctx.fillStyle=mist;ctx.fillRect(fallX-64,waterY-52,160,110);

    for(let i=0;i<n;i++){
      const sx=fallX-5+i*2.2;
      const ph=i*.57;
      const sw=reduced.matches?0:Math.sin(time*1.08+ph)*(1+(i%4)*.27);
      const sh=reduced.matches?.24:.18+.19*(Math.sin(time*1.54+ph)+1)*.5;
      const start=lipY+30+(i%3)*1.15;
      const end=sx+9+sw*1.65;
      ctx.strokeStyle='rgba(238,250,236,'+sh+')';
      ctx.lineWidth=i%5===0?2.05:(i%2===0?1.25:.88);
      ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx,start);
      ctx.bezierCurveTo(sx-2+sw,start+23,sx+3+sw,waterY-27,end,waterY);ctx.stroke();

      if(!reduced.matches&&i%2===0){
        const p=(time*.54+i/n)%1;
        ctx.fillStyle='rgba(255,245,194,'+(.15+(1-p)*.20)+')';
        ctx.beginPath();ctx.ellipse(sx+9*p*p,start+(waterY-start)*p,.82,2.35,0,0,TAU);ctx.fill();
      }
    }

    ctx.strokeStyle='rgba(255,247,207,.36)';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(fallX-7,lipY+29);ctx.bezierCurveTo(fallX+7,lipY+25,fallX+25,lipY+30,fallX+39,lipY+27);ctx.stroke();
    ctx.restore();

    for(let i=0;i<5;i++){
      const p=reduced.matches?.38:(time*.25+i/5)%1;
      ripple(fallX+13,waterY+4,7+p*62,2+p*9,(1-p)*.32,i%2===0);
    }
  }

  function draw(time){
    prep();
    if(document.body.dataset.kind!=='meditation')return;
    const mobile=width<700;
    /* Higher and farther right: visible, but clear of the selected routine and start button. */
    const fallX=mobile?875:955;
    const lipY=mobile?455:485;
    const waterY=mobile?565:595;
    drawBank(fallX,lipY,waterY,mobile);
    drawCascade(fallX,lipY,waterY,time,mobile);
  }

  function resize(){
    const b=host.getBoundingClientRect();
    width=Math.max(1,b.width);height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1200000/(width*height)));
    scale=Math.max(width/W,height/H);
    left=(width-W*scale)*(width<600?.69:.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    draw(reduced.matches?0:performance.now()/1000);wake();
  }
  function loop(now){frame=0;if(document.hidden||!visible||reduced.matches)return;if(now-last>32){last=now;draw(now/1000);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame)cancelAnimationFrame(frame);frame=0;if(document.hidden||!visible)return;if(reduced.matches){draw(0);return;}frame=requestAnimationFrame(loop);}

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(()=>{draw(reduced.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);
  reduced.addEventListener('change',wake);
  window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',wake);
  resize();
})();
