/* Zen meditation waterfall v25: layered rock bank, animated streamlines and visible landing. */
(function(){
  'use strict';
  var host=document.querySelector('.landscape');
  if(!host)return;
  var shade=host.querySelector('.landscape-shade');
  var canvas=document.createElement('canvas');
  canvas.className='zen-waterfall-v25';
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

  function roundedRock(cx,cy,rx,ry,lean,light){
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(lean);
    var g=ctx.createLinearGradient(-rx*.8,-ry*.9,rx*.75,ry*.85);
    g.addColorStop(0,light?'#c5d1bd':'#a9baac');
    g.addColorStop(.34,light?'#9fb2a2':'#8fa398');
    g.addColorStop(.70,light?'#789189':'#6c847d');
    g.addColorStop(1,light?'#59766f':'#506c67');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(-rx*.92,ry*.18);
    ctx.bezierCurveTo(-rx*.88,-ry*.55,-rx*.40,-ry*.98,rx*.05,-ry*.90);
    ctx.bezierCurveTo(rx*.54,-ry*.93,rx*.96,-ry*.42,rx*.92,ry*.20);
    ctx.bezierCurveTo(rx*.82,ry*.72,rx*.28,ry*.92,-rx*.34,ry*.78);
    ctx.bezierCurveTo(-rx*.74,ry*.68,-rx*.96,ry*.48,-rx*.92,ry*.18);
    ctx.fill();

    var sun=ctx.createLinearGradient(-rx*.85,-ry*.75,rx*.15,-ry*.10);
    sun.addColorStop(0,'rgba(255,239,187,.20)');
    sun.addColorStop(.46,'rgba(247,231,174,.09)');
    sun.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sun;
    ctx.beginPath();
    ctx.ellipse(-rx*.10,-ry*.22,rx*.78,ry*.55,-.12,0,TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBank(fallX,lipY,waterY,mobile,time){
    var s=mobile?0.78:0.88;

    /* Rear mass and overlapping smaller rocks: closer to v23, but less bulky. */
    roundedRock(fallX-30*s,lipY+58*s,112*s,91*s,-.08,true);
    roundedRock(fallX+50*s,lipY+70*s,77*s,66*s,.07,false);
    roundedRock(fallX-92*s,lipY+92*s,53*s,40*s,-.10,false);
    roundedRock(fallX+96*s,lipY+98*s,47*s,36*s,.10,true);

    /* Lower submerged shelf ties the rocks together. */
    var shelf=ctx.createLinearGradient(fallX-128*s,lipY+72*s,fallX+124*s,waterY+38*s);
    shelf.addColorStop(0,'rgba(135,158,146,.92)');
    shelf.addColorStop(.58,'rgba(93,119,109,.95)');
    shelf.addColorStop(1,'rgba(64,92,87,.96)');
    ctx.fillStyle=shelf;
    ctx.beginPath();
    ctx.moveTo(fallX-125*s,waterY+20*s);
    ctx.bezierCurveTo(fallX-108*s,lipY+72*s,fallX-60*s,lipY+65*s,fallX-28*s,lipY+81*s);
    ctx.bezierCurveTo(fallX+2*s,lipY+61*s,fallX+53*s,lipY+67*s,fallX+79*s,lipY+84*s);
    ctx.bezierCurveTo(fallX+109*s,lipY+71*s,fallX+128*s,lipY+99*s,fallX+124*s,waterY+22*s);
    ctx.lineTo(fallX+124*s,waterY+45*s);
    ctx.lineTo(fallX-125*s,waterY+45*s);
    ctx.closePath();
    ctx.fill();

    /* Recessed opening: visible but not a black focal point. */
    var holeX=fallX+17*s;
    var holeY=lipY+57*s;
    var holeR=31*s;
    var cavity=ctx.createRadialGradient(holeX-6*s,holeY-8*s,3,holeX,holeY,holeR);
    cavity.addColorStop(0,'rgba(24,50,47,.90)');
    cavity.addColorStop(.47,'rgba(33,64,58,.82)');
    cavity.addColorStop(.78,'rgba(55,84,74,.48)');
    cavity.addColorStop(1,'rgba(85,109,96,0)');
    ctx.fillStyle=cavity;
    ctx.beginPath();
    ctx.ellipse(holeX,holeY,holeR*1.18,holeR*.72,-.03,0,TAU);
    ctx.fill();

    /* Animated contour/stream lines on the rocks. */
    ctx.save();
    ctx.globalCompositeOperation='screen';
    var shimmer=reduced.matches?0:Math.sin(time*.72)*4*s;
    for(var i=0;i<5;i++){
      var yy=lipY+18*s+i*15*s;
      var alpha=.09+(i%2)*.045;
      ctx.strokeStyle='rgba(255,244,199,'+alpha+')';
      ctx.lineWidth=.9;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(fallX-83*s+i*7*s,yy);
      ctx.bezierCurveTo(fallX-40*s+shimmer,yy-14*s,fallX+5*s-shimmer*.4,yy-18*s,fallX+61*s,yy-8*s);
      ctx.stroke();
    }
    ctx.strokeStyle='rgba(236,248,230,.12)';
    ctx.beginPath();
    ctx.moveTo(fallX-58*s,lipY+102*s);
    ctx.bezierCurveTo(fallX-18*s+shimmer*.3,lipY+90*s,fallX+36*s,lipY+97*s,fallX+92*s,lipY+88*s);
    ctx.stroke();
    ctx.restore();

    /* Inner stream travels in the recess before folding down. */
    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var j=0;j<7;j++){
      var iy=holeY-5*s+j*1.55*s;
      ctx.strokeStyle='rgba(244,250,226,'+(.14+j*.016)+')';
      ctx.lineWidth=(j%3===0?1.25:.82)*s;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(holeX-16*s,iy);
      ctx.bezierCurveTo(holeX-5*s,iy-2*s,holeX+8*s,iy+1*s,holeX+18*s,iy+8*s);
      ctx.stroke();
    }
    ctx.restore();

    return {s:s,holeX:holeX,holeY:holeY,holeR:holeR};
  }

  function drawCascade(lipY,waterY,g,time,mobile){
    var s=g.s;
    var startY=g.holeY+8*s;
    var bendY=lipY+88*s;
    var count=mobile?15:18;
    var topSpread=29*s;
    var bottomSpread=49*s;

    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var i=0;i<count;i++){
      var t=count===1?0.5:i/(count-1);
      var sx=g.holeX-topSpread*.5+t*topSpread;
      var ex=g.holeX-bottomSpread*.5+t*bottomSpread;
      var sway=reduced.matches?0:Math.sin(time*1.04+i*.63)*(1.05+(i%4)*.18)*s;
      var a=.15+(i%4)*.025;
      ctx.strokeStyle='rgba(239,250,234,'+a+')';
      ctx.lineWidth=(i%5===0?1.65:(i%2===0?1.05:.78))*s;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(sx,startY);
      ctx.bezierCurveTo(sx+1.5*s,startY+10*s,ex-3*s,bendY-7*s,ex,bendY);
      ctx.bezierCurveTo(ex+sway,bendY+22*s,ex+sway*.7,waterY-20*s,ex+sway*.25,waterY);
      ctx.stroke();

      if(!reduced.matches && i%2===0){
        var p=(time*.46+i/count)%1;
        var dy=startY+(waterY-startY)*p;
        var dx=sx+(ex-sx)*p+sway*p*.45;
        ctx.fillStyle='rgba(255,246,204,'+(.12+(1-p)*.18)+')';
        ctx.beginPath();
        ctx.ellipse(dx,dy,.72*s,2.1*s,0,0,TAU);
        ctx.fill();
      }
    }

    ctx.strokeStyle='rgba(255,247,208,.31)';
    ctx.lineWidth=1.0*s;
    ctx.beginPath();
    ctx.moveTo(g.holeX-topSpread*.43,bendY-3*s);
    ctx.quadraticCurveTo(g.holeX,bendY-8*s,g.holeX+topSpread*.43,bendY-2*s);
    ctx.stroke();
    ctx.restore();

    /* Front stone lip overlays the top of the water, making the source physical. */
    ctx.strokeStyle='rgba(79,107,98,.94)';
    ctx.lineWidth=5.2*s;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(g.holeX-g.holeR*.88,g.holeY+3*s);
    ctx.quadraticCurveTo(g.holeX,g.holeY-7*s,g.holeX+g.holeR*.90,g.holeY+4*s);
    ctx.stroke();
    ctx.strokeStyle='rgba(255,241,194,.17)';
    ctx.lineWidth=.85*s;
    ctx.beginPath();
    ctx.moveTo(g.holeX-g.holeR*.66,g.holeY+1*s);
    ctx.quadraticCurveTo(g.holeX,g.holeY-6*s,g.holeX+g.holeR*.67,g.holeY+2*s);
    ctx.stroke();

    /* Make the landing obvious: splash, bright droplets and expanding ripples. */
    var mist=ctx.createRadialGradient(g.holeX,waterY+2,0,g.holeX,waterY+2,66*s);
    mist.addColorStop(0,'rgba(252,247,215,.26)');
    mist.addColorStop(.40,'rgba(230,246,236,.13)');
    mist.addColorStop(1,'rgba(228,245,234,0)');
    ctx.fillStyle=mist;
    ctx.fillRect(g.holeX-72*s,waterY-44*s,144*s,92*s);

    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var d=0;d<9;d++){
      var phase=reduced.matches?0.35:((time*.70+d*.113)%1);
      var side=(d%2===0?-1:1);
      var dx2=g.holeX+side*(6+d*1.8)*s*phase;
      var dy2=waterY-4*s-(1-phase)*(13+(d%3)*4)*s;
      ctx.fillStyle='rgba(255,248,211,'+((1-phase)*.28)+')';
      ctx.beginPath();
      ctx.arc(dx2,dy2,(.7+(d%3)*.22)*s,0,TAU);
      ctx.fill();
    }
    ctx.restore();

    for(var r=0;r<5;r++){
      var rp=reduced.matches?0.38:((time*.25+r/5)%1);
      ctx.strokeStyle='rgba(255,245,199,'+((1-rp)*.29)+')';
      ctx.lineWidth=.9;
      ctx.beginPath();
      ctx.ellipse(g.holeX,waterY+5,7+rp*60*s,2+rp*9*s,0,0,TAU);
      ctx.stroke();
    }
  }

  function draw(time){
    prep();
    if(document.body.dataset.kind!=='meditation')return;
    var mobile=width<700;

    /* Close to the preferred v23 position, but pulled slightly inward to avoid clipping. */
    var fallX=mobile?852:952;
    var lipY=mobile?430:480;
    var waterY=mobile?538:592;
    var g=drawBank(fallX,lipY,waterY,mobile,time);
    drawCascade(lipY,waterY,g,time,mobile);
  }

  function resize(){
    var b=host.getBoundingClientRect();
    width=Math.max(1,b.width);height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1100000/(width*height)));
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
    if(now-last>33){last=now;draw(now/1000);}
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
