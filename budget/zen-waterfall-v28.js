/* Zen meditation waterfall v28: physical stone channel, layered water, asymmetric rocks and clearer landing. */
(function(){
  'use strict';
  var host=document.querySelector('.landscape');
  if(!host)return;
  var shade=host.querySelector('.landscape-shade');
  var canvas=document.createElement('canvas');
  canvas.className='zen-waterfall-v28';
  if(shade)host.insertBefore(canvas,shade);else host.appendChild(canvas);
  var ctx=canvas.getContext('2d');
  if(!ctx)return;
  var W=1200,H=900,TAU=Math.PI*2;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;

  function prep(){ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);ctx.translate(left,0);ctx.scale(scale,scale);}

  function rockPath(rx,ry,shape){
    ctx.beginPath();
    if(shape==='rear'){
      ctx.moveTo(-rx*.98,ry*.18);ctx.bezierCurveTo(-rx*.92,-ry*.36,-rx*.61,-ry*.83,-rx*.23,-ry*.80);ctx.bezierCurveTo(rx*.02,-ry*1.02,rx*.45,-ry*.92,rx*.67,-ry*.58);ctx.bezierCurveTo(rx*.91,-ry*.43,rx*1.01,-ry*.02,rx*.89,ry*.31);ctx.bezierCurveTo(rx*.72,ry*.73,rx*.22,ry*.91,-rx*.37,ry*.79);ctx.bezierCurveTo(-rx*.77,ry*.71,-rx*1.00,ry*.48,-rx*.98,ry*.18);
    }else if(shape==='ledge'){
      ctx.moveTo(-rx*.98,ry*.18);ctx.bezierCurveTo(-rx*.88,-ry*.44,-rx*.54,-ry*.76,-rx*.14,-ry*.70);ctx.bezierCurveTo(rx*.17,-ry*.85,rx*.54,-ry*.66,rx*.84,-ry*.34);ctx.bezierCurveTo(rx*.99,-ry*.08,rx*.93,ry*.30,rx*.68,ry*.54);ctx.bezierCurveTo(rx*.36,ry*.79,-rx*.27,ry*.82,-rx*.69,ry*.61);ctx.bezierCurveTo(-rx*.91,ry*.49,-rx*1.01,ry*.34,-rx*.98,ry*.18);
    }else if(shape==='flat'){
      ctx.moveTo(-rx*.98,ry*.14);ctx.bezierCurveTo(-rx*.86,-ry*.46,-rx*.43,-ry*.66,rx*.02,-ry*.62);ctx.bezierCurveTo(rx*.42,-ry*.70,rx*.83,-ry*.40,rx*.95,-ry*.04);ctx.bezierCurveTo(rx*.92,ry*.40,rx*.46,ry*.69,-rx*.16,ry*.67);ctx.bezierCurveTo(-rx*.62,ry*.66,-rx*.92,ry*.45,-rx*.98,ry*.14);
    }else{
      ctx.moveTo(-rx*.94,ry*.17);ctx.bezierCurveTo(-rx*.89,-ry*.47,-rx*.47,-ry*.84,-rx*.04,-ry*.79);ctx.bezierCurveTo(rx*.41,-ry*.88,rx*.84,-ry*.48,rx*.93,-ry*.06);ctx.bezierCurveTo(rx*.92,ry*.42,rx*.48,ry*.78,-rx*.13,ry*.76);ctx.bezierCurveTo(-rx*.59,ry*.72,-rx*.91,ry*.49,-rx*.94,ry*.17);
    }
    ctx.closePath();
  }

  function rock(cx,cy,rx,ry,lean,kind,shape){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(lean);
    var g=ctx.createLinearGradient(-rx*.92,-ry*.94,rx*.80,ry*.90);
    if(kind==='rear'){g.addColorStop(0,'#ced8c4');g.addColorStop(.29,'#aebead');g.addColorStop(.67,'#788f85');g.addColorStop(1,'#54706a');}
    else if(kind==='front'){g.addColorStop(0,'#b2c1af');g.addColorStop(.31,'#8da095');g.addColorStop(.68,'#627971');g.addColorStop(1,'#435d58');}
    else{g.addColorStop(0,'#bdcab8');g.addColorStop(.32,'#98aa9c');g.addColorStop(.70,'#6c837a');g.addColorStop(1,'#4d6761');}
    ctx.fillStyle=g;rockPath(rx,ry,shape);ctx.fill();
    var warm=kind==='rear';var sun=ctx.createLinearGradient(-rx*.90,-ry*.86,rx*.10,-ry*.02);
    sun.addColorStop(0,warm?'rgba(255,240,189,.29)':'rgba(247,235,190,.15)');sun.addColorStop(.48,warm?'rgba(247,231,174,.12)':'rgba(242,232,191,.06)');sun.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sun;ctx.beginPath();ctx.ellipse(-rx*.16,-ry*.24,rx*.75,ry*.49,-.14,0,TAU);ctx.fill();
    if(kind==='front'){var under=ctx.createLinearGradient(0,-ry*.08,0,ry*.98);under.addColorStop(0,'rgba(28,55,52,0)');under.addColorStop(.52,'rgba(25,52,49,.09)');under.addColorStop(1,'rgba(18,42,40,.34)');ctx.fillStyle=under;ctx.beginPath();ctx.ellipse(0,ry*.25,rx*.85,ry*.65,0,0,TAU);ctx.fill();}
    ctx.restore();
  }

  function rockLines(cx,cy,rx,ry,lean,shape,time,phase,warm){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(lean);rockPath(rx,ry,shape);ctx.clip();ctx.globalCompositeOperation='screen';
    var move=0,pulse=.78;if(!reduced.matches){move=Math.sin(time*.66+phase)*2.1;pulse=.68+.18*(Math.sin(time*.82+phase)+1)*.5;}
    for(var i=0;i<3;i++){var y=-ry*.28+i*ry*.23,x1=-rx*.56+i*rx*.05,x2=rx*.40-i*rx*.04,base=warm?0.12:0.09,alpha=(base-i*.017)*pulse;ctx.strokeStyle=warm?'rgba(255,243,196,'+alpha+')':'rgba(222,244,237,'+alpha+')';ctx.lineWidth=.82;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y+move*.14);ctx.bezierCurveTo(-rx*.22,y-ry*.16+move,rx*.08,y-ry*.10-move*.30,x2,y-ry*.04);ctx.stroke();}
    ctx.restore();
  }

  function bambooWaterReflections(time){
    var stems=[{x:805,w:10,p:.2},{x:905,w:13,p:1.1},{x:997,w:11,p:2.2}];ctx.save();ctx.globalCompositeOperation='screen';ctx.filter='blur(1.4px)';
    for(var i=0;i<stems.length;i++){var st=stems[i],sway=0;if(!reduced.matches)sway=Math.sin(time*.42+st.p)*2.2;var g=ctx.createLinearGradient(st.x,548,st.x,682);g.addColorStop(0,'rgba(220,248,239,0)');g.addColorStop(.28,'rgba(216,247,239,.040)');g.addColorStop(.60,'rgba(190,239,234,.086)');g.addColorStop(1,'rgba(172,226,224,0)');ctx.fillStyle=g;ctx.fillRect(st.x-st.w*.55+sway,548,st.w*1.1,134);for(var j=0;j<3;j++){var yy=590+j*22;ctx.strokeStyle='rgba(230,250,244,'+(.040-j*.006)+')';ctx.lineWidth=.82;ctx.beginPath();ctx.moveTo(st.x-st.w*.80+sway,yy);ctx.quadraticCurveTo(st.x+sway,yy+2,st.x+st.w*.78+sway,yy);ctx.stroke();}}
    ctx.restore();ctx.filter='none';
  }

  function sceneGeometry(mobile){return {s:mobile?0.63:0.76,fallX:mobile?894:972,lipY:mobile?430:478,impactY:mobile?500:570};}

  function drawBackBank(g,time){
    var s=g.s,fallX=g.fallX,lipY=g.lipY;
    var rear={x:fallX+23*s,y:lipY+51*s,rx:94*s,ry:71*s,l:-.075,shape:'rear'};
    var backLeft={x:fallX-52*s,y:lipY+83*s,rx:34*s,ry:23*s,l:-.13,shape:'flat'};
    var backRight={x:fallX+102*s,y:lipY+79*s,rx:35*s,ry:26*s,l:.11,shape:'small'};
    rock(rear.x,rear.y,rear.rx,rear.ry,rear.l,'rear',rear.shape);rock(backLeft.x,backLeft.y,backLeft.rx,backLeft.ry,backLeft.l,'small',backLeft.shape);rock(backRight.x,backRight.y,backRight.rx,backRight.ry,backRight.l,'small',backRight.shape);
    rockLines(rear.x,rear.y,rear.rx,rear.ry,rear.l,rear.shape,time,.2,true);rockLines(backLeft.x,backLeft.y,backLeft.rx,backLeft.ry,backLeft.l,backLeft.shape,time,1.8,true);rockLines(backRight.x,backRight.y,backRight.rx,backRight.ry,backRight.l,backRight.shape,time,2.7,false);
  }

  function drawCavity(g){
    var s=g.s,holeX=g.fallX-5*s,holeY=g.lipY+77*s,holeR=24*s;var cavity=ctx.createRadialGradient(holeX-5*s,holeY-5*s,2,holeX,holeY,holeR);cavity.addColorStop(0,'rgba(28,54,50,.84)');cavity.addColorStop(.45,'rgba(39,68,63,.76)');cavity.addColorStop(.78,'rgba(70,96,85,.38)');cavity.addColorStop(1,'rgba(98,121,107,0)');ctx.fillStyle=cavity;ctx.beginPath();ctx.ellipse(holeX,holeY,holeR*1.17,holeR*.67,-.03,0,TAU);ctx.fill();
    ctx.save();ctx.globalCompositeOperation='screen';for(var j=0;j<6;j++){var iy=holeY-4*s+j*1.38*s,ia=.13+j*.016;ctx.strokeStyle='rgba(243,250,231,'+ia+')';ctx.lineWidth=(j%3===0?1.12:.72)*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(holeX-14*s,iy);ctx.bezierCurveTo(holeX-5*s,iy-2*s,holeX+7*s,iy+1*s,holeX+15*s,iy+7*s);ctx.stroke();}ctx.restore();
    return {s:s,holeX:holeX,holeY:holeY,holeR:holeR,impactY:g.impactY};
  }

  function drawWater(g,time,mobile){
    var s=g.s,startY=g.holeY+6*s,bendY=g.holeY+23*s,impactY=g.impactY,rearCount=mobile?12:15,topSpread=23*s,bottomSpread=47*s;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(var i=0;i<rearCount;i++){var t=rearCount===1?0.5:i/(rearCount-1),sx=g.holeX-topSpread*.5+t*topSpread,ex=g.holeX-bottomSpread*.5+t*bottomSpread,sway=0;if(!reduced.matches)sway=Math.sin(time*1.01+i*.61)*(1+(i%4)*.14)*s;var center=1-Math.abs(t-.5)*2,alpha=.068+center*.075;ctx.strokeStyle='rgba(208,235,230,'+alpha+')';ctx.lineWidth=(.50+center*.34)*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx,startY);ctx.bezierCurveTo(sx+1*s,startY+7*s,ex-2*s,bendY-5*s,ex,bendY);ctx.bezierCurveTo(ex+sway,bendY+18*s,ex+sway*.62,impactY-17*s,ex+sway*.20,impactY);ctx.stroke();}
    var cores=[-.31,0,.30];for(var c=0;c<cores.length;c++){var ct=.5+cores[c],csx=g.holeX-topSpread*.5+ct*topSpread,cex=g.holeX-bottomSpread*.5+ct*bottomSpread,csway=0;if(!reduced.matches)csway=Math.sin(time*.93+c*1.7)*1.15*s;ctx.strokeStyle=c===1?'rgba(252,253,238,.37)':'rgba(242,249,234,.29)';ctx.lineWidth=(c===1?1.65:1.28)*s;ctx.beginPath();ctx.moveTo(csx,startY);ctx.bezierCurveTo(csx,startY+8*s,cex-1*s,bendY-4*s,cex,bendY);ctx.bezierCurveTo(cex+csway,bendY+20*s,cex+csway*.5,impactY-15*s,cex,impactY);ctx.stroke();}
    if(!reduced.matches){for(var d=0;d<9;d++){var p=(time*.50+d*.111)%1,side=d%2===0?-1:1,x=g.holeX+side*(3+d*.78)*s*p,y=startY+(impactY-startY)*p;ctx.fillStyle='rgba(255,248,211,'+(.11+(1-p)*.18)+')';ctx.beginPath();ctx.ellipse(x,y,.72*s,2.0*s,0,0,TAU);ctx.fill();}}
    ctx.restore();
  }

  function drawFrontChannel(g,time){
    var s=g.s,fallX=g.holeX,lipY=g.holeY;
    var leftLip={x:fallX-37*s,y:lipY+23*s,rx:33*s,ry:24*s,l:-.10,shape:'ledge'};
    var rightLip={x:fallX+43*s,y:lipY+25*s,rx:39*s,ry:27*s,l:.08,shape:'ledge'};
    rock(leftLip.x,leftLip.y,leftLip.rx,leftLip.ry,leftLip.l,'front',leftLip.shape);rock(rightLip.x,rightLip.y,rightLip.rx,rightLip.ry,rightLip.l,'front',rightLip.shape);rockLines(leftLip.x,leftLip.y,leftLip.rx,leftLip.ry,leftLip.l,leftLip.shape,time,1.1,false);rockLines(rightLip.x,rightLip.y,rightLip.rx,rightLip.ry,rightLip.l,rightLip.shape,time,2.0,false);
    ctx.fillStyle='rgba(28,55,52,.43)';ctx.beginPath();ctx.moveTo(g.holeX-g.holeR*1.00,g.holeY-2*s);ctx.bezierCurveTo(g.holeX-g.holeR*.52,g.holeY-14*s,g.holeX+g.holeR*.48,g.holeY-13*s,g.holeX+g.holeR*.99,g.holeY-2*s);ctx.bezierCurveTo(g.holeX+g.holeR*.73,g.holeY+6*s,g.holeX-g.holeR*.70,g.holeY+6*s,g.holeX-g.holeR*1.00,g.holeY-2*s);ctx.fill();
    var lip=ctx.createLinearGradient(g.holeX,g.holeY-18*s,g.holeX,g.holeY+3*s);lip.addColorStop(0,'rgba(158,177,159,.98)');lip.addColorStop(.46,'rgba(113,140,128,.98)');lip.addColorStop(1,'rgba(68,98,91,.98)');ctx.fillStyle=lip;ctx.beginPath();ctx.moveTo(g.holeX-g.holeR*.98,g.holeY-8*s);ctx.bezierCurveTo(g.holeX-g.holeR*.47,g.holeY-21*s,g.holeX+g.holeR*.42,g.holeY-19*s,g.holeX+g.holeR*.95,g.holeY-6*s);ctx.bezierCurveTo(g.holeX+g.holeR*.66,g.holeY-.5*s,g.holeX-g.holeR*.64,g.holeY+1*s,g.holeX-g.holeR*.98,g.holeY-8*s);ctx.fill();ctx.strokeStyle='rgba(255,241,194,.20)';ctx.lineWidth=.82*s;ctx.beginPath();ctx.moveTo(g.holeX-g.holeR*.73,g.holeY-9*s);ctx.quadraticCurveTo(g.holeX,g.holeY-16*s,g.holeX+g.holeR*.69,g.holeY-8*s);ctx.stroke();
  }

  function drawLanding(g,time){
    var s=g.s,impactY=g.impactY;var mist=ctx.createRadialGradient(g.holeX,impactY,0,g.holeX,impactY,64*s);mist.addColorStop(0,'rgba(255,249,217,.34)');mist.addColorStop(.34,'rgba(230,247,237,.17)');mist.addColorStop(1,'rgba(229,246,236,0)');ctx.fillStyle=mist;ctx.fillRect(g.holeX-70*s,impactY-42*s,140*s,88*s);
    ctx.save();ctx.globalCompositeOperation='screen';for(var k=0;k<11;k++){var phase=reduced.matches?0.36:(time*.73+k*.091)%1,dir=k%2===0?-1:1,spread=(4+k*1.5)*s,dx=g.holeX+dir*spread*phase,dy=impactY-2*s-(1-phase)*(15+(k%3)*4)*s;ctx.fillStyle='rgba(255,249,214,'+((1-phase)*.34)+')';ctx.beginPath();ctx.arc(dx,dy,(.72+(k%3)*.20)*s,0,TAU);ctx.fill();}ctx.restore();
    for(var r=0;r<5;r++){var rp=reduced.matches?0.38:(time*.245+r/5)%1,inner=r<2,alpha=(1-rp)*(inner?0.42:0.18),reach=inner?44:64;ctx.strokeStyle='rgba(255,245,199,'+alpha+')';ctx.lineWidth=inner?1.12:.76;ctx.beginPath();ctx.ellipse(g.holeX,impactY+4,7+rp*reach*s,2+rp*(inner?7:9)*s,0,0,TAU);ctx.stroke();}
  }

  function draw(time){prep();if(document.body.dataset.kind!=='meditation')return;var mobile=width<700;bambooWaterReflections(time);var geom=sceneGeometry(mobile);drawBackBank(geom,time);var cavity=drawCavity(geom);drawWater(cavity,time,mobile);drawFrontChannel(cavity,time);drawLanding(cavity,time);}
  function resize(){var b=host.getBoundingClientRect();width=Math.max(1,b.width);height=Math.max(1,b.height);ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1050000/(width*height)));scale=Math.max(width/W,height/H);left=(width-W*scale)*(width<600?0.69:0.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);draw(reduced.matches?0:performance.now()/1000);wake();}
  function loop(now){frame=0;if(document.hidden||!visible||reduced.matches)return;if(now-last>33){last=now;draw(now/1000);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame)cancelAnimationFrame(frame);frame=0;if(document.hidden||!visible)return;if(reduced.matches){draw(0);return;}frame=requestAnimationFrame(loop);}
  new ResizeObserver(resize).observe(host);new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;wake();}).observe(host);new MutationObserver(function(){draw(reduced.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});document.addEventListener('visibilitychange',wake);if(reduced.addEventListener)reduced.addEventListener('change',wake);window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',wake);resize();
})();
