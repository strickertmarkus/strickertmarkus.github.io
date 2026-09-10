/* Zen meditation waterfall v24: smaller integrated rock, recessed source, natural cascade. */
(function(){
  'use strict';
  var host=document.querySelector('.landscape');
  if(!host)return;
  var shade=host.querySelector('.landscape-shade');
  var canvas=document.createElement('canvas');
  canvas.className='zen-waterfall-v24';
  if(shade)host.insertBefore(canvas,shade);else host.appendChild(canvas);
  var ctx=canvas.getContext('2d');
  if(!ctx)return;

  var W=1200,H=900,TAU=Math.PI*2;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;

  function prep(){
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.translate(left,0);
    ctx.scale(scale,scale);
  }

  function rockPath(cx,lipY,waterY,s){
    ctx.beginPath();
    ctx.moveTo(cx-112*s,waterY+28*s);
    ctx.bezierCurveTo(cx-116*s,lipY+54*s,cx-93*s,lipY-35*s,cx-43*s,lipY-40*s);
    ctx.bezierCurveTo(cx-12*s,lipY-64*s,cx+30*s,lipY-55*s,cx+48*s,lipY-24*s);
    ctx.bezierCurveTo(cx+73*s,lipY-33*s,cx+102*s,lipY+2*s,cx+106*s,waterY+24*s);
    ctx.lineTo(cx+106*s,waterY+44*s);
    ctx.lineTo(cx-112*s,waterY+44*s);
    ctx.closePath();
  }

  function drawRock(cx,lipY,waterY,mobile){
    var s=mobile?0.70:0.82;

    /* Main rock body with cool shadow and warm morning-light top plane. */
    var body=ctx.createLinearGradient(cx-95,lipY-70,cx+95,waterY+55);
    body.addColorStop(0,'#b7c5b4');
    body.addColorStop(.30,'#91a99b');
    body.addColorStop(.62,'#6f8c82');
    body.addColorStop(1,'#52736d');
    ctx.fillStyle=body;
    rockPath(cx,lipY,waterY,s);
    ctx.fill();

    var topLight=ctx.createLinearGradient(cx-95*s,lipY-62*s,cx+30*s,lipY+12*s);
    topLight.addColorStop(0,'rgba(255,239,185,.20)');
    topLight.addColorStop(.48,'rgba(246,229,172,.09)');
    topLight.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=topLight;
    rockPath(cx,lipY,waterY,s);
    ctx.fill();

    /* A lower ledge gives the source opening a physical lip, not a pasted hole. */
    var ledge=ctx.createLinearGradient(cx-70*s,lipY-4*s,cx+82*s,lipY+46*s);
    ledge.addColorStop(0,'rgba(136,160,145,.96)');
    ledge.addColorStop(.58,'rgba(91,119,108,.98)');
    ledge.addColorStop(1,'rgba(62,91,85,.98)');
    ctx.fillStyle=ledge;
    ctx.beginPath();
    ctx.moveTo(cx-70*s,lipY+25*s);
    ctx.bezierCurveTo(cx-53*s,lipY-8*s,cx-23*s,lipY-5*s,cx-2*s,lipY+7*s);
    ctx.bezierCurveTo(cx+26*s,lipY-11*s,cx+61*s,lipY+1*s,cx+76*s,lipY+26*s);
    ctx.bezierCurveTo(cx+79*s,lipY+39*s,cx+68*s,lipY+50*s,cx+52*s,lipY+52*s);
    ctx.lineTo(cx-55*s,lipY+52*s);
    ctx.bezierCurveTo(cx-69*s,lipY+47*s,cx-77*s,lipY+36*s,cx-70*s,lipY+25*s);
    ctx.fill();

    /* Recessed cavity: smaller and deep green instead of near-black. */
    var holeX=cx+12*s;
    var holeY=lipY+21*s;
    var holeR=31*s;
    var cavity=ctx.createRadialGradient(holeX-7*s,holeY-7*s,2,holeX,holeY,holeR);
    cavity.addColorStop(0,'rgba(23,48,45,.90)');
    cavity.addColorStop(.46,'rgba(31,61,56,.84)');
    cavity.addColorStop(.76,'rgba(52,82,72,.52)');
    cavity.addColorStop(1,'rgba(83,108,94,0)');
    ctx.fillStyle=cavity;
    ctx.beginPath();
    ctx.ellipse(holeX,holeY,holeR*1.13,holeR*.72,-.03,0,TAU);
    ctx.fill();

    /* Inner stream sits inside the recess before it bends over the stone lip. */
    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var i=0;i<6;i++){
      var yy=holeY-4*s+i*1.7*s;
      ctx.strokeStyle='rgba(242,249,225,'+(.14+i*.018)+')';
      ctx.lineWidth=(i%3===0?1.25:.8)*s;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(holeX-15*s,yy);
      ctx.bezierCurveTo(holeX-4*s,yy-2*s,holeX+9*s,yy+1*s,holeX+18*s,yy+7*s);
      ctx.stroke();
    }
    ctx.restore();

    return {s:s,holeX:holeX,holeY:holeY,holeR:holeR};
  }

  function drawCascade(cx,lipY,waterY,geo,time,mobile){
    var s=geo.s;
    var topY=geo.holeY+8*s;
    var bendY=lipY+42*s;
    var count=mobile?7:9;
    var topSpread=25*s;
    var bottomSpread=43*s;

    /* The stream begins inside the opening, curves over the lower lip, then separates. */
    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var i=0;i<count;i++){
      var t=count===1?0.5:i/(count-1);
      var sx=geo.holeX-topSpread*.5+t*topSpread;
      var ex=geo.holeX-bottomSpread*.5+t*bottomSpread;
      var sway=reduced.matches?0:Math.sin(time*.95+i*.71)*(1.2+i*.08)*s;
      var alpha=.17+(i%3)*.035;
      ctx.strokeStyle='rgba(238,249,232,'+alpha+')';
      ctx.lineWidth=(i%4===0?1.75:1.05)*s;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(sx,topY);
      ctx.bezierCurveTo(sx+2*s,topY+8*s,ex-3*s,bendY-7*s,ex,bendY);
      ctx.bezierCurveTo(ex+sway,bendY+24*s,ex+sway*.8,waterY-22*s,ex+sway*.3,waterY);
      ctx.stroke();
    }

    /* Bright fold at the edge makes the water visibly turn downward out of the recess. */
    ctx.strokeStyle='rgba(255,246,206,.32)';
    ctx.lineWidth=1.15*s;
    ctx.beginPath();
    ctx.moveTo(geo.holeX-topSpread*.42,bendY-2*s);
    ctx.quadraticCurveTo(geo.holeX,bendY-7*s,geo.holeX+topSpread*.42,bendY-1*s);
    ctx.stroke();
    ctx.restore();

    /* Stone lip overlays the very top of the water for real occlusion. */
    ctx.strokeStyle='rgba(80,108,99,.92)';
    ctx.lineWidth=5.6*s;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(geo.holeX-geo.holeR*.88,geo.holeY+3*s);
    ctx.quadraticCurveTo(geo.holeX,geo.holeY-7*s,geo.holeX+geo.holeR*.90,geo.holeY+4*s);
    ctx.stroke();
    ctx.strokeStyle='rgba(255,241,195,.17)';
    ctx.lineWidth=.9*s;
    ctx.beginPath();
    ctx.moveTo(geo.holeX-geo.holeR*.68,geo.holeY+1*s);
    ctx.quadraticCurveTo(geo.holeX,geo.holeY-6*s,geo.holeX+geo.holeR*.67,geo.holeY+2*s);
    ctx.stroke();

    /* Soft splash and ripples at the waterline. */
    var mist=ctx.createRadialGradient(geo.holeX,waterY+1,0,geo.holeX,waterY+1,49*s);
    mist.addColorStop(0,'rgba(250,246,213,.21)');
    mist.addColorStop(.5,'rgba(228,245,234,.10)');
    mist.addColorStop(1,'rgba(228,245,234,0)');
    ctx.fillStyle=mist;
    ctx.fillRect(geo.holeX-58*s,waterY-28*s,116*s,65*s);

    for(var r=0;r<4;r++){
      var p=reduced.matches?.35:((time*.22+r/4)%1);
      ctx.strokeStyle='rgba(255,245,199,'+((1-p)*.25)+')';
      ctx.lineWidth=.9;
      ctx.beginPath();
      ctx.ellipse(geo.holeX,waterY+4,8+p*47*s,2+p*7*s,0,0,TAU);
      ctx.stroke();
    }
  }

  function draw(time){
    prep();
    if(document.body.dataset.kind!=='meditation')return;
    var mobile=width<700;

    /* Mobile coordinates are intentionally pulled left from the old x=875 so the rock never clips. */
    var cx=mobile?820:938;
    var lipY=mobile?442:478;
    var waterY=mobile?558:592;
    var geo=drawRock(cx,lipY,waterY,mobile);
    drawCascade(cx,lipY,waterY,geo,time,mobile);
  }

  function resize(){
    var b=host.getBoundingClientRect();
    width=Math.max(1,b.width);height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1000000/(width*height)));
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
  document.addEventListener('visibilitychange',wake);
  if(reduced.addEventListener)reduced.addEventListener('change',wake);
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',wake);
  resize();
})();
