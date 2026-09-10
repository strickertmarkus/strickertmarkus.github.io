/* Zen meditation waterfall v26c: smaller layered rocks, per-rock streamlines, lower source, clearer splash. */
(function(){
  'use strict';
  var host=document.querySelector('.landscape');
  if(!host)return;
  var shade=host.querySelector('.landscape-shade');
  var canvas=document.createElement('canvas');
  canvas.className='zen-waterfall-v26';
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

  function rock(cx,cy,rx,ry,lean,kind){
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(lean);
    var g=ctx.createLinearGradient(-rx*.8,-ry*.9,rx*.75,ry*.85);
    if(kind==='rear'){
      g.addColorStop(0,'#c9d3bf');g.addColorStop(.34,'#a9baa9');g.addColorStop(.72,'#798f86');g.addColorStop(1,'#58736d');
    }else if(kind==='front'){
      g.addColorStop(0,'#b3c1b0');g.addColorStop(.34,'#8fa297');g.addColorStop(.72,'#657d75');g.addColorStop(1,'#48645f');
    }else{
      g.addColorStop(0,'#becab8');g.addColorStop(.34,'#98aa9c');g.addColorStop(.72,'#6f857d');g.addColorStop(1,'#506a65');
    }
    ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(-rx*.92,ry*.18);
    ctx.bezierCurveTo(-rx*.88,-ry*.54,-rx*.42,-ry*.97,rx*.03,-ry*.91);
    ctx.bezierCurveTo(rx*.52,-ry*.94,rx*.96,-ry*.43,rx*.93,ry*.18);
    ctx.bezierCurveTo(rx*.83,ry*.70,rx*.30,ry*.93,-rx*.34,ry*.80);
    ctx.bezierCurveTo(-rx*.74,ry*.69,-rx*.97,ry*.48,-rx*.92,ry*.18);ctx.fill();

    var sun=ctx.createLinearGradient(-rx*.82,-ry*.75,rx*.12,-ry*.08);
    sun.addColorStop(0,kind==='rear'?'rgba(255,240,190,.24)':'rgba(255,239,188,.16)');
    sun.addColorStop(.48,kind==='rear'?'rgba(247,231,174,.11)':'rgba(247,231,174,.07)');
    sun.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sun;ctx.beginPath();ctx.ellipse(-rx*.09,-ry*.23,rx*.76,ry*.52,-.12,0,TAU);ctx.fill();

    if(kind==='front'){
      var under=ctx.createLinearGradient(0,-ry*.05,0,ry*.95);
      under.addColorStop(0,'rgba(33,61,57,0)');under.addColorStop(.60,'rgba(29,54,51,.08)');under.addColorStop(1,'rgba(23,47,45,.25)');
      ctx.fillStyle=under;ctx.beginPath();ctx.ellipse(0,ry*.20,rx*.82,ry*.64,0,0,TAU);ctx.fill();
    }
    ctx.restore();
  }

  function lines(cx,cy,rx,ry,lean,time,phase,warm){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(lean);ctx.globalCompositeOperation='screen';
    var move=reduced.matches ? 0 : Math.sin(time*.66+phase)*2.4;
    var pulse=reduced.matches ? .78 : (.66+.20*(Math.sin(time*.82+phase)+1)*.5);
    for(var i=0;i<3;i++){
      var y=-ry*.27+i*ry*.24;
      var x1=-rx*.53+i*rx*.05,x2=rx*.42-i*rx*.03;
      var baseAlpha=warm ? .115 : .095;
      var a=baseAlpha-i*.016;
      ctx.strokeStyle=warm?'rgba(255,243,196,'+(a*pulse)+')':'rgba(232,246,229,'+(a*pulse)+')';
      ctx.lineWidth=.85;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y+move*.15);
      ctx.bezierCurveTo(-rx*.20,y-ry*.17+move,rx*.11,y-ry*.12-move*.35,x2,y-ry*.05);ctx.stroke();
    }
    ctx.restore();
  }

  function bank(fallX,lipY,waterY,mobile,time){
    var s=mobile ? .70 : .80;
    var rear={x:fallX-18*s,y:lipY+52*s,rx:101*s,ry:80*s,l:-.07};
    var front={x:fallX+53*s,y:lipY+73*s,rx:66*s,ry:54*s,l:.07};
    var leftR={x:fallX-75*s,y:lipY+88*s,rx:39*s,ry:29*s,l:-.11};
    var rightR={x:fallX+99*s,y:lipY+93*s,rx:36*s,ry:27*s,l:.10};
    rock(rear.x,rear.y,rear.rx,rear.ry,rear.l,'rear');
    rock(front.x,front.y,front.rx,front.ry,front.l,'front');
    rock(leftR.x,leftR.y,leftR.rx,leftR.ry,leftR.l,'small');
    rock(rightR.x,rightR.y,rightR.rx,rightR.ry,rightR.l,'small');
    lines(rear.x,rear.y,rear.rx,rear.ry,rear.l,time,.2,true);
    lines(front.x,front.y,front.rx,front.ry,front.l,time,1.1,false);
    lines(leftR.x,leftR.y,leftR.rx,leftR.ry,leftR.l,time,2.2,true);
    lines(rightR.x,rightR.y,rightR.rx,rightR.ry,rightR.l,time,3.0,true);

    var shelf=ctx.createLinearGradient(fallX-112*s,lipY+78*s,fallX+118*s,waterY+35*s);
    shelf.addColorStop(0,'rgba(131,155,144,.88)');shelf.addColorStop(.56,'rgba(88,116,107,.94)');shelf.addColorStop(1,'rgba(61,89,84,.95)');
    ctx.fillStyle=shelf;ctx.beginPath();ctx.moveTo(fallX-111*s,waterY+16*s);
    ctx.bezierCurveTo(fallX-94*s,lipY+80*s,fallX-50*s,lipY+73*s,fallX-19*s,lipY+86*s);
    ctx.bezierCurveTo(fallX+8*s,lipY+71*s,fallX+54*s,lipY+74*s,fallX+78*s,lipY+88*s);
    ctx.bezierCurveTo(fallX+103*s,lipY+80*s,fallX+120*s,lipY+99*s,fallX+116*s,waterY+18*s);
    ctx.lineTo(fallX+116*s,waterY+37*s);ctx.lineTo(fallX-111*s,waterY+37*s);ctx.closePath();ctx.fill();

    var holeX=fallX+28*s,holeY=lipY+76*s,holeR=27*s;
    var c=ctx.createRadialGradient(holeX-5*s,holeY-7*s,2,holeX,holeY,holeR);
    c.addColorStop(0,'rgba(26,52,49,.86)');c.addColorStop(.46,'rgba(36,66,61,.78)');c.addColorStop(.77,'rgba(62,91,80,.43)');c.addColorStop(1,'rgba(91,115,101,0)');
    ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(holeX,holeY,holeR*1.16,holeR*.68,-.02,0,TAU);ctx.fill();

    ctx.save();ctx.globalCompositeOperation='screen';
    for(var j=0;j<6;j++){
      var iy=holeY-4*s+j*1.45*s;
      ctx.strokeStyle='rgba(244,250,227,'+(.14+j*.015)+')';ctx.lineWidth=(j%3===0?1.16:.76)*s;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(holeX-14*s,iy);ctx.bezierCurveTo(holeX-5*s,iy-2*s,holeX+7*s,iy+1*s,holeX+16*s,iy+7*s);ctx.stroke();
    }
    ctx.restore();
    return {s:s,holeX:holeX,holeY:holeY,holeR:holeR};
  }

  function cascade(waterY,g,time,mobile){
    var s=g.s,startY=g.holeY+7*s,bendY=g.holeY+25*s,count=mobile ? 11 : 14,topSpread=22*s,bottomSpread=45*s;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(var i=0;i<count;i++){
      var t=count===1 ? .5 : i/(count-1);
      var sx=g.holeX-topSpread*.5+t*topSpread,ex=g.holeX-bottomSpread*.5+t*bottomSpread;
      var sway=reduced.matches ? 0 : Math.sin(time*1.02+i*.61)*(1+(i%4)*.15)*s;
      ctx.strokeStyle='rgba(239,250,235,'+(.16+(i%4)*.026)+')';ctx.lineWidth=(i%4===0?1.55:(i%2===0?1:.76))*s;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(sx,startY);ctx.bezierCurveTo(sx+1.3*s,startY+7*s,ex-2*s,bendY-5*s,ex,bendY);
      ctx.bezierCurveTo(ex+sway,bendY+18*s,ex+sway*.65,waterY-18*s,ex+sway*.22,waterY);ctx.stroke();
      if(!reduced.matches&&i%2===0){
        var p=(time*.48+i/count)%1,dy=startY+(waterY-startY)*p,dx=sx+(ex-sx)*p+sway*p*.42;
        ctx.fillStyle='rgba(255,247,206,'+(.13+(1-p)*.18)+')';ctx.beginPath();ctx.ellipse(dx,dy,.72*s,2*s,0,0,TAU);ctx.fill();
      }
    }
    ctx.strokeStyle='rgba(255,247,208,.34)';ctx.lineWidth=1*s;ctx.beginPath();ctx.moveTo(g.holeX-topSpread*.42,bendY-2*s);
    ctx.quadraticCurveTo(g.holeX,bendY-7*s,g.holeX+topSpread*.42,bendY-1*s);ctx.stroke();ctx.restore();

    ctx.strokeStyle='rgba(76,104,96,.95)';ctx.lineWidth=5*s;ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(g.holeX-g.holeR*.86,g.holeY+3*s);ctx.quadraticCurveTo(g.holeX,g.holeY-7*s,g.holeX+g.holeR*.88,g.holeY+4*s);ctx.stroke();
    ctx.strokeStyle='rgba(255,241,194,.17)';ctx.lineWidth=.82*s;ctx.beginPath();
    ctx.moveTo(g.holeX-g.holeR*.64,g.holeY+1*s);ctx.quadraticCurveTo(g.holeX,g.holeY-6*s,g.holeX+g.holeR*.64,g.holeY+2*s);ctx.stroke();

    var mist=ctx.createRadialGradient(g.holeX,waterY+1,0,g.holeX,waterY+1,61*s);
    mist.addColorStop(0,'rgba(252,248,216,.27)');mist.addColorStop(.4,'rgba(229,246,236,.13)');mist.addColorStop(1,'rgba(229,246,236,0)');
    ctx.fillStyle=mist;ctx.fillRect(g.holeX-68*s,waterY-42*s,136*s,86*s);

    ctx.save();ctx.globalCompositeOperation='screen';
    for(var d=0;d<10;d++){
      var ph=reduced.matches ? .34 : ((time*.72+d*.101)%1);
      var side=d%2===0?-1:1,spread=(5+d*1.5)*s;
      var dx2=g.holeX+side*spread*ph,dy2=waterY-3*s-(1-ph)*(14+(d%3)*4)*s;
      ctx.fillStyle='rgba(255,249,214,'+((1-ph)*.30)+')';ctx.beginPath();ctx.arc(dx2,dy2,(.72+(d%3)*.20)*s,0,TAU);ctx.fill();
    }
    ctx.restore();

    for(var r=0;r<5;r++){
      var rp=reduced.matches ? .38 : ((time*.245+r/5)%1);
      var inner=r<2;
      var alpha=(1-rp)*(inner ? .36 : .20),range=inner ? 44 : 61;
      ctx.strokeStyle='rgba(255,245,199,'+alpha+')';ctx.lineWidth=inner ? 1.05 : .82;ctx.beginPath();
      ctx.ellipse(g.holeX,waterY+5,7+rp*range*s,2+rp*(inner ? 7 : 9)*s,0,0,TAU);ctx.stroke();
    }
  }

  function draw(time){
    prep();if(document.body.dataset.kind!=='meditation')return;
    var mobile=width<700;
    var fallX=mobile ? 878 : 962;
    var lipY=mobile ? 426 : 478;
    var waterY=mobile ? 540 : 592;
    cascade(waterY,bank(fallX,lipY,waterY,mobile,time),time,mobile);
  }

  function resize(){
    var b=host.getBoundingClientRect();width=Math.max(1,b.width);height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1050000/(width*height)));
    scale=Math.max(width/W,height/H);
    left=(width-W*scale)*(width<600 ? .69 : .5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);draw(reduced.matches ? 0 : performance.now()/1000);wake();
  }
  function loop(now){frame=0;if(document.hidden||!visible||reduced.matches)return;if(now-last>33){last=now;draw(now/1000);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame)cancelAnimationFrame(frame);frame=0;if(document.hidden||!visible)return;if(reduced.matches){draw(0);return;}frame=requestAnimationFrame(loop);}

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(function(e){visible=e[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(function(){draw(reduced.matches ? 0 : performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);if(reduced.addEventListener)reduced.addEventListener('change',wake);
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',wake);resize();
})();
