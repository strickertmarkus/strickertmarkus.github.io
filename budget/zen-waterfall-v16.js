/* Zen waterfall v16: water originates inside a recessed rock opening before folding over the lip. */
(function(){
  'use strict';
  const host=document.querySelector('.landscape');
  if(!host)return;
  const shade=host.querySelector('.landscape-shade');
  const canvas=document.createElement('canvas');
  canvas.className='zen-waterfall-v16';
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

  function ripple(x,y,rx,ry,a,warm){
    ctx.strokeStyle=warm?'rgba(255,246,205,'+a+')':'rgba(232,247,236,'+a+')';
    ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.stroke();
  }

  function rockMass(points,lightX,lightY){
    const g=ctx.createLinearGradient(lightX-120,lightY-90,lightX+150,lightY+130);
    g.addColorStop(0,'#bac8b8');g.addColorStop(.38,'#82978c');g.addColorStop(.72,'#607c73');g.addColorStop(1,'#456761');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++){
      const p=points[i];
      if(p.length===2)ctx.lineTo(p[0],p[1]);else ctx.bezierCurveTo(p[0],p[1],p[2],p[3],p[4],p[5]);
    }
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(255,248,211,.20)';ctx.lineWidth=1.1;ctx.beginPath();
    ctx.moveTo(lightX-70,lightY-18);ctx.quadraticCurveTo(lightX-14,lightY-47,lightX+42,lightY-30);ctx.stroke();
  }

  function drawBank(fallX,lipY,waterY,mobile){
    const s=mobile?.79:.86;
    ctx.save();ctx.translate(fallX,lipY);ctx.scale(s,s);ctx.translate(-fallX,-lipY);

    rockMass([
      [fallX-122,waterY+30],
      [fallX-119,lipY+36,fallX-95,lipY-34,fallX-38,lipY-42],
      [fallX-5,lipY-69,fallX+41,lipY-52,fallX+57,lipY-18],
      [fallX+92,lipY-29,fallX+126,lipY+12,fallX+127,waterY+28],
      [fallX+127,waterY+54],[fallX-122,waterY+54]
    ],fallX-18,lipY);

    rockMass([
      [fallX-82,waterY+25],
      [fallX-77,lipY+31,fallX-49,lipY-4,fallX-9,lipY+2],
      [fallX+14,lipY-18,fallX+51,lipY-7,fallX+67,lipY+16],
      [fallX+91,lipY+30,fallX+103,lipY+52,fallX+102,waterY+28],
      [fallX+102,waterY+48],[fallX-82,waterY+48]
    ],fallX+5,lipY+10);
    ctx.restore();

    const holeX=fallX+14,holeY=lipY+31;
    const cavity=ctx.createRadialGradient(holeX-7,holeY-8,4,holeX,holeY,42);
    cavity.addColorStop(0,'rgba(17,43,42,.92)');
    cavity.addColorStop(.55,'rgba(24,55,52,.78)');
    cavity.addColorStop(1,'rgba(53,83,75,.12)');
    ctx.fillStyle=cavity;ctx.beginPath();
    ctx.moveTo(holeX-30,holeY+6);
    ctx.bezierCurveTo(holeX-27,holeY-24,holeX-11,holeY-35,holeX+9,holeY-33);
    ctx.bezierCurveTo(holeX+31,holeY-31,holeX+42,holeY-15,holeX+39,holeY+9);
    ctx.bezierCurveTo(holeX+30,holeY+18,holeX-17,holeY+18,holeX-30,holeY+6);
    ctx.fill();

    const inner=ctx.createLinearGradient(holeX-18,holeY-8,holeX+26,holeY+20);
    inner.addColorStop(0,'rgba(226,245,231,.08)');
    inner.addColorStop(.46,'rgba(244,249,224,.36)');
    inner.addColorStop(1,'rgba(232,248,236,.18)');
    ctx.fillStyle=inner;ctx.beginPath();
    ctx.moveTo(holeX-18,holeY-4);
    ctx.bezierCurveTo(holeX-5,holeY-9,holeX+9,holeY-5,holeX+22,holeY+3);
    ctx.bezierCurveTo(holeX+18,holeY+9,holeX+12,holeY+15,holeX+9,holeY+23);
    ctx.bezierCurveTo(holeX+2,holeY+15,holeX-8,holeY+7,holeX-18,holeY-4);
    ctx.fill();

    const veil=ctx.createLinearGradient(0,waterY-9,0,waterY+58);
    veil.addColorStop(0,'rgba(183,217,207,.04)');veil.addColorStop(.32,'rgba(158,201,193,.24)');veil.addColorStop(1,'rgba(126,182,177,.46)');
    ctx.fillStyle=veil;ctx.fillRect(fallX-112,waterY-9,235,70);

    ctx.strokeStyle='rgba(255,244,193,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(fallX-74,waterY+8);ctx.quadraticCurveTo(fallX+5,waterY+2,fallX+82,waterY+8);ctx.stroke();

    return {holeX,holeY};
  }

  function drawCascade(fallX,lipY,waterY,time,mobile,hole){
    const n=mobile?18:21;
    const mouthX=hole.holeX+8,mouthY=hole.holeY+18;
    ctx.save();ctx.globalCompositeOperation='screen';

    const mist=ctx.createRadialGradient(mouthX+2,waterY+1,0,mouthX+2,waterY+1,68);
    mist.addColorStop(0,'rgba(249,249,220,.22)');mist.addColorStop(.43,'rgba(228,246,233,.11)');mist.addColorStop(1,'rgba(228,246,233,0)');
    ctx.fillStyle=mist;ctx.fillRect(mouthX-70,waterY-52,150,105);

    for(let i=0;i<n;i++){
      const ph=i*.57;
      const spread=(i-(n-1)/2)*2.0;
      const sx=hole.holeX-7+spread*.58;
      const ex=mouthX+spread;
      const sw=reduced.matches?0:Math.sin(time*1.08+ph)*(1+(i%4)*.22);
      const sh=reduced.matches?.23:.17+.17*(Math.sin(time*1.54+ph)+1)*.5;
      ctx.strokeStyle='rgba(238,250,236,'+sh+')';
      ctx.lineWidth=i%5===0?1.95:(i%2===0?1.18:.84);
      ctx.lineCap='round';ctx.beginPath();
      ctx.moveTo(sx,hole.holeY-2+(i%3)*.6);
      ctx.bezierCurveTo(sx+10,hole.holeY+3,ex-7,mouthY-5,ex,mouthY);
      ctx.bezierCurveTo(ex-1+sw,mouthY+26,ex+3+sw,waterY-28,ex+8+sw*1.3,waterY);
      ctx.stroke();

      if(!reduced.matches&&i%2===0){
        const p=(time*.54+i/n)%1;
        const y=mouthY+(waterY-mouthY)*p;
        ctx.fillStyle='rgba(255,245,194,'+(.13+(1-p)*.17)+')';
        ctx.beginPath();ctx.ellipse(ex+8*p*p,y,.8,2.2,0,0,TAU);ctx.fill();
      }
    }

    /* Rock lip drawn after the inner water: this occludes its top edge and makes the flow emerge from inside. */
    ctx.globalCompositeOperation='source-over';
    const lip=ctx.createLinearGradient(hole.holeX-34,hole.holeY-18,hole.holeX+44,hole.holeY+22);
    lip.addColorStop(0,'rgba(132,151,139,.98)');lip.addColorStop(.58,'rgba(92,119,109,.98)');lip.addColorStop(1,'rgba(61,91,85,.98)');
    ctx.strokeStyle=lip;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(hole.holeX-28,hole.holeY+1);
    ctx.bezierCurveTo(hole.holeX-8,hole.holeY-11,hole.holeX+20,hole.holeY-9,hole.holeX+38,hole.holeY+5);
    ctx.stroke();
    ctx.strokeStyle='rgba(255,247,210,.20)';ctx.lineWidth=1.1;ctx.beginPath();
    ctx.moveTo(hole.holeX-22,hole.holeY-1);ctx.quadraticCurveTo(hole.holeX+7,hole.holeY-11,hole.holeX+31,hole.holeY+2);ctx.stroke();
    ctx.restore();

    for(let i=0;i<5;i++){
      const p=reduced.matches?.38:(time*.25+i/5)%1;
      ripple(mouthX+4,waterY+4,7+p*58,2+p*8,(1-p)*.29,i%2===0);
    }
  }

  function draw(time){
    prep();if(document.body.dataset.kind!=='meditation')return;
    const mobile=width<700;
    const fallX=mobile?875:955;
    const lipY=mobile?455:485;
    const waterY=mobile?565:595;
    const hole=drawBank(fallX,lipY,waterY,mobile);
    drawCascade(fallX,lipY,waterY,time,mobile,hole);
  }

  function resize(){
    const b=host.getBoundingClientRect();width=Math.max(1,b.width);height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1200000/(width*height)));
    scale=Math.max(width/W,height/H);left=(width-W*scale)*(width<600?.69:.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    draw(reduced.matches?0:performance.now()/1000);wake();
  }
  function loop(now){frame=0;if(document.hidden||!visible||reduced.matches)return;if(now-last>32){last=now;draw(now/1000);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame)cancelAnimationFrame(frame);frame=0;if(document.hidden||!visible)return;if(reduced.matches){draw(0);return;}frame=requestAnimationFrame(loop);}

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(function(){draw(reduced.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake);
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',wake);resize();
})();
