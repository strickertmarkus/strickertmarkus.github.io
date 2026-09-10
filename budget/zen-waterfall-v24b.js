/* Zen meditation waterfall v24b: integrated smaller rock + recessed source. Safari-safe. */
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

  function rockShape(cx,lipY,waterY,s){
    ctx.beginPath();
    ctx.moveTo(cx-110*s,waterY+29*s);
    ctx.bezierCurveTo(cx-114*s,lipY+46*s,cx-92*s,lipY-32*s,cx-44*s,lipY-38*s);
    ctx.bezierCurveTo(cx-15*s,lipY-61*s,cx+26*s,lipY-54*s,cx+46*s,lipY-23*s);
    ctx.bezierCurveTo(cx+72*s,lipY-31*s,cx+101*s,lipY+2*s,cx+104*s,waterY+24*s);
    ctx.lineTo(cx+104*s,waterY+44*s);
    ctx.lineTo(cx-110*s,waterY+44*s);
    ctx.closePath();
  }

  function drawRock(cx,lipY,waterY,mobile){
    var s=mobile?0.68:0.81;
    var body=ctx.createLinearGradient(cx-94,lipY-69,cx+90,waterY+50);
    body.addColorStop(0,'#bdcbb8');
    body.addColorStop(.32,'#91aa9b');
    body.addColorStop(.65,'#708d83');
    body.addColorStop(1,'#52736d');
    ctx.fillStyle=body;
    rockShape(cx,lipY,waterY,s);
    ctx.fill();

    var sun=ctx.createLinearGradient(cx-90*s,lipY-60*s,cx+25*s,lipY+10*s);
    sun.addColorStop(0,'rgba(255,239,186,.22)');
    sun.addColorStop(.45,'rgba(246,228,171,.10)');
    sun.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sun;
    rockShape(cx,lipY,waterY,s);
    ctx.fill();

    /* Front ledge: one coherent lower plane around the opening. */
    var ledge=ctx.createLinearGradient(cx-64*s,lipY,cx+72*s,lipY+50*s);
    ledge.addColorStop(0,'rgba(142,164,149,.97)');
    ledge.addColorStop(.58,'rgba(95,122,112,.99)');
    ledge.addColorStop(1,'rgba(63,92,86,.99)');
    ctx.fillStyle=ledge;
    ctx.beginPath();
    ctx.moveTo(cx-64*s,lipY+27*s);
    ctx.bezierCurveTo(cx-49*s,lipY-4*s,cx-21*s,lipY-3*s,cx-1*s,lipY+8*s);
    ctx.bezierCurveTo(cx+25*s,lipY-8*s,cx+57*s,lipY+2*s,cx+72*s,lipY+27*s);
    ctx.bezierCurveTo(cx+76*s,lipY+40*s,cx+64*s,lipY+50*s,cx+49*s,lipY+52*s);
    ctx.lineTo(cx-49*s,lipY+52*s);
    ctx.bezierCurveTo(cx-62*s,lipY+47*s,cx-70*s,lipY+36*s,cx-64*s,lipY+27*s);
    ctx.fill();

    var holeX=cx+10*s;
    var holeY=lipY+22*s;
    var holeR=29*s;
    var cavity=ctx.createRadialGradient(holeX-6*s,holeY-6*s,2,holeX,holeY,holeR);
    cavity.addColorStop(0,'rgba(26,51,48,.91)');
    cavity.addColorStop(.48,'rgba(34,64,59,.84)');
    cavity.addColorStop(.78,'rgba(55,84,74,.48)');
    cavity.addColorStop(1,'rgba(83,109,95,0)');
    ctx.fillStyle=cavity;
    ctx.beginPath();
    ctx.ellipse(holeX,holeY,holeR*1.10,holeR*.69,-.04,0,TAU);
    ctx.fill();

    /* Water is visible inside the recess before the bend. */
    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var i=0;i<6;i++){
      var yy=holeY-4*s+i*1.55*s;
      ctx.strokeStyle='rgba(243,249,226,'+(.13+i*.018)+')';
      ctx.lineWidth=(i%3===0?1.2:.78)*s;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(holeX-14*s,yy);
      ctx.bezierCurveTo(holeX-4*s,yy-2*s,holeX+8*s,yy+1*s,holeX+17*s,yy+7*s);
      ctx.stroke();
    }
    ctx.restore();

    return {s:s,holeX:holeX,holeY:holeY,holeR:holeR};
  }

  function drawCascade(lipY,waterY,g,time,mobile){
    var s=g.s;
    var topY=g.holeY+8*s;
    var bendY=lipY+42*s;
    var count=mobile?7:9;
    var topSpread=24*s;
    var bottomSpread=42*s;

    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var i=0;i<count;i++){
      var t=count===1?0.5:i/(count-1);
      var sx=g.holeX-topSpread*.5+t*topSpread;
      var ex=g.holeX-bottomSpread*.5+t*bottomSpread;
      var sway=reduced.matches?0:Math.sin(time*.92+i*.71)*(1.15+i*.07)*s;
      var a=.17+(i%3)*.032;
      ctx.strokeStyle='rgba(238,249,232,'+a+')';
      ctx.lineWidth=(i%4===0?1.65:1.0)*s;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(sx,topY);
      ctx.bezierCurveTo(sx+2*s,topY+8*s,ex-3*s,bendY-7*s,ex,bendY);
      ctx.bezierCurveTo(ex+sway,bendY+24*s,ex+sway*.75,waterY-22*s,ex+sway*.25,waterY);
      ctx.stroke();
    }

    ctx.strokeStyle='rgba(255,246,206,.32)';
    ctx.lineWidth=1.1*s;
    ctx.beginPath();
    ctx.moveTo(g.holeX-topSpread*.41,bendY-2*s);
    ctx.quadraticCurveTo(g.holeX,bendY-7*s,g.holeX+topSpread*.41,bendY-1*s);
    ctx.stroke();
    ctx.restore();

    /* Stone rim is painted after the stream start, hiding it behind the opening edge. */
    ctx.strokeStyle='rgba(82,110,100,.94)';
    ctx.lineWidth=5.3*s;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(g.holeX-g.holeR*.86,g.holeY+3*s);
    ctx.quadraticCurveTo(g.holeX,g.holeY-7*s,g.holeX+g.holeR*.87,g.holeY+4*s);
    ctx.stroke();
    ctx.strokeStyle='rgba(255,241,195,.18)';
    ctx.lineWidth=.85*s;
    ctx.beginPath();
    ctx.moveTo(g.holeX-g.holeR*.66,g.holeY+1*s);
    ctx.quadraticCurveTo(g.holeX,g.holeY-6*s,g.holeX+g.holeR*.65,g.holeY+2*s);
    ctx.stroke();

    var mist=ctx.createRadialGradient(g.holeX,waterY+1,0,g.holeX,waterY+1,47*s);
    mist.addColorStop(0,'rgba(250,246,213,.20)');
    mist.addColorStop(.5,'rgba(228,245,234,.09)');
    mist.addColorStop(1,'rgba(228,245,234,0)');
    ctx.fillStyle=mist;
    ctx.fillRect(g.holeX-55*s,waterY-27*s,110*s,62*s);

    for(var r=0;r<4;r++){
      var p=reduced.matches?0.35:((time*.22+r/4)%1);
      ctx.strokeStyle='rgba(255,245,199,'+((1-p)*.24)+')';
      ctx.lineWidth=.9;
      ctx.beginPath();
      ctx.ellipse(g.holeX,waterY+4,8+p*45*s,2+p*7*s,0,0,TAU);
      ctx.stroke();
    }
  }

  function draw(time){
    prep();
    if(document.body.dataset.kind!=='meditation')return;
    var mobile=width<700;
    /* Pulled left from the old composition so the full stone remains inside a narrow iPhone viewport. */
    var cx=mobile?818:938;
    var lipY=mobile?442:478;
    var waterY=mobile?558:592;
    var g=drawRock(cx,lipY,waterY,mobile);
    drawCascade(lipY,waterY,g,time,mobile);
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
