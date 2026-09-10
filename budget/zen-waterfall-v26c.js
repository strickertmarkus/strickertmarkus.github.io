/* Zen meditation waterfall v27: asymmetric layered rocks, physical overhang, deeper water and clearer landing. */
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

  function localRockPath(rx,ry,shape){
    ctx.beginPath();
    if(shape==='rear'){
      ctx.moveTo(-rx*.96,ry*.20);
      ctx.bezierCurveTo(-rx*.91,-ry*.35,-rx*.55,-ry*.90,-rx*.11,-ry*.84);
      ctx.bezierCurveTo(rx*.16,-ry*1.02,rx*.66,-ry*.72,rx*.88,-ry*.28);
      ctx.bezierCurveTo(rx*1.02,-ry*.02,rx*.90,ry*.58,rx*.47,ry*.77);
      ctx.bezierCurveTo(rx*.02,ry*.97,-rx*.65,ry*.82,-rx*.96,ry*.20);
    }else if(shape==='front'){
      ctx.moveTo(-rx*.94,ry*.18);
      ctx.bezierCurveTo(-rx*.90,-ry*.45,-rx*.49,-ry*.82,-rx*.16,-ry*.78);
      ctx.bezierCurveTo(rx*.15,-ry*.98,rx*.61,-ry*.69,rx*.93,-ry*.17);
      ctx.bezierCurveTo(rx*.99,ry*.21,rx*.69,ry*.72,rx*.24,ry*.84);
      ctx.bezierCurveTo(-rx*.35,ry*.96,-rx*.84,ry*.67,-rx*.94,ry*.18);
    }else if(shape==='flat'){
      ctx.moveTo(-rx*.96,ry*.18);
      ctx.bezierCurveTo(-rx*.82,-ry*.52,-rx*.38,-ry*.74,rx*.08,-ry*.66);
      ctx.bezierCurveTo(rx*.48,-ry*.73,rx*.90,-ry*.36,rx*.94,ry*.05);
      ctx.bezierCurveTo(rx*.87,ry*.55,rx*.37,ry*.76,-rx*.25,ry*.73);
      ctx.bezierCurveTo(-rx*.66,ry*.69,-rx*.94,ry*.49,-rx*.96,ry*.18);
    }else{
      ctx.moveTo(-rx*.91,ry*.18);
      ctx.bezierCurveTo(-rx*.88,-ry*.50,-rx*.43,-ry*.92,rx*.04,-ry*.87);
      ctx.bezierCurveTo(rx*.53,-ry*.90,rx*.95,-ry*.39,rx*.90,ry*.20);
      ctx.bezierCurveTo(rx*.78,ry*.69,rx*.25,ry*.87,-rx*.37,ry*.76);
      ctx.bezierCurveTo(-rx*.73,ry*.64,-rx*.95,ry*.47,-rx*.91,ry*.18);
    }
    ctx.closePath();
  }

  function rock(cx,cy,rx,ry,lean,kind,shape){
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(lean);

    var g=ctx.createLinearGradient(-rx*.86,-ry*.92,rx*.75,ry*.88);
    if(kind==='rear'){
      g.addColorStop(0,'#cbd5c1');
      g.addColorStop(.31,'#abbba9');
      g.addColorStop(.69,'#7b9086');
      g.addColorStop(1,'#57736d');
    }else if(kind==='front'){
      g.addColorStop(0,'#b2c0af');
      g.addColorStop(.32,'#8da095');
      g.addColorStop(.68,'#647b74');
      g.addColorStop(1,'#455f5b');
    }else{
      g.addColorStop(0,'#bdc9b7');
      g.addColorStop(.33,'#98aa9c');
      g.addColorStop(.70,'#6f857d');
      g.addColorStop(1,'#4f6964');
    }
    ctx.fillStyle=g;
    localRockPath(rx,ry,shape);
    ctx.fill();

    var sun=ctx.createLinearGradient(-rx*.90,-ry*.82,rx*.12,-ry*.05);
    var sunA=kind==='rear' ? 0.26 : 0.15;
    sun.addColorStop(0,'rgba(255,240,188,'+sunA+')');
    sun.addColorStop(.48,'rgba(248,232,175,'+(sunA*.42)+')');
    sun.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sun;
    ctx.beginPath();
    ctx.ellipse(-rx*.13,-ry*.24,rx*.76,ry*.50,-.13,0,TAU);
    ctx.fill();

    if(kind==='front'){
      var under=ctx.createLinearGradient(0,-ry*.10,0,ry*.98);
      under.addColorStop(0,'rgba(27,55,52,0)');
      under.addColorStop(.55,'rgba(26,52,49,.08)');
      under.addColorStop(1,'rgba(19,43,41,.30)');
      ctx.fillStyle=under;
      ctx.beginPath();
      ctx.ellipse(0,ry*.22,rx*.84,ry*.65,0,0,TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function rockLines(cx,cy,rx,ry,lean,shape,time,phase,warm){
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(lean);
    localRockPath(rx,ry,shape);
    ctx.clip();
    ctx.globalCompositeOperation='screen';

    var move=0;
    var pulse=.78;
    if(!reduced.matches){
      move=Math.sin(time*.66+phase)*2.2;
      pulse=.66+.20*(Math.sin(time*.82+phase)+1)*.5;
    }

    for(var i=0;i<3;i++){
      var y=-ry*.27+i*ry*.23;
      var x1=-rx*.55+i*rx*.045;
      var x2=rx*.42-i*rx*.035;
      var base=warm ? 0.118 : 0.092;
      var alpha=(base-i*.017)*pulse;
      if(warm)ctx.strokeStyle='rgba(255,243,196,'+alpha+')';
      else ctx.strokeStyle='rgba(226,244,236,'+alpha+')';
      ctx.lineWidth=.84;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(x1,y+move*.15);
      ctx.bezierCurveTo(-rx*.19,y-ry*.17+move,rx*.11,y-ry*.11-move*.32,x2,y-ry*.04);
      ctx.stroke();
    }
    ctx.restore();
  }

  function bambooWaterReflections(time){
    var stems=[
      {x:815,w:10,p:.2},
      {x:915,w:13,p:1.1},
      {x:1005,w:11,p:2.2}
    ];
    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.filter='blur(1.6px)';
    for(var i=0;i<stems.length;i++){
      var st=stems[i];
      var sway=0;
      if(!reduced.matches)sway=Math.sin(time*.42+st.p)*2.4;
      var g=ctx.createLinearGradient(st.x,558,st.x,674);
      g.addColorStop(0,'rgba(220,248,239,0)');
      g.addColorStop(.25,'rgba(216,247,239,.035)');
      g.addColorStop(.58,'rgba(194,238,233,.070)');
      g.addColorStop(1,'rgba(177,226,225,0)');
      ctx.fillStyle=g;
      ctx.fillRect(st.x-st.w*.5+sway,558,st.w,116);

      for(var j=0;j<3;j++){
        var yy=588+j*22;
        ctx.strokeStyle='rgba(230,249,243,'+(.035-j*.006)+')';
        ctx.lineWidth=.8;
        ctx.beginPath();
        ctx.moveTo(st.x-st.w*.75+sway,yy);
        ctx.quadraticCurveTo(st.x+sway,yy+2,st.x+st.w*.72+sway,yy);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.filter='none';
  }

  function bank(fallX,lipY,impactY,mobile,time){
    var s=mobile ? 0.65 : 0.78;

    var rear={x:fallX-8*s,y:lipY+52*s,rx:95*s,ry:76*s,l:-.075,shape:'rear'};
    var front={x:fallX+47*s,y:lipY+75*s,rx:62*s,ry:51*s,l:.075,shape:'front'};
    var leftR={x:fallX-57*s,y:lipY+91*s,rx:30*s,ry:22*s,l:-.12,shape:'flat'};
    var rightR={x:fallX+101*s,y:lipY+93*s,rx:33*s,ry:25*s,l:.11,shape:'small'};

    rock(rear.x,rear.y,rear.rx,rear.ry,rear.l,'rear',rear.shape);
    rock(front.x,front.y,front.rx,front.ry,front.l,'front',front.shape);
    rock(leftR.x,leftR.y,leftR.rx,leftR.ry,leftR.l,'small',leftR.shape);
    rock(rightR.x,rightR.y,rightR.rx,rightR.ry,rightR.l,'small',rightR.shape);

    rockLines(rear.x,rear.y,rear.rx,rear.ry,rear.l,rear.shape,time,.2,true);
    rockLines(front.x,front.y,front.rx,front.ry,front.l,front.shape,time,1.2,false);
    rockLines(leftR.x,leftR.y,leftR.rx,leftR.ry,leftR.l,leftR.shape,time,2.1,true);
    rockLines(rightR.x,rightR.y,rightR.rx,rightR.ry,rightR.l,rightR.shape,time,2.9,false);

    var shelf=ctx.createLinearGradient(fallX-94*s,lipY+80*s,fallX+115*s,impactY+38*s);
    shelf.addColorStop(0,'rgba(126,151,140,.76)');
    shelf.addColorStop(.58,'rgba(84,112,104,.87)');
    shelf.addColorStop(1,'rgba(58,86,82,.90)');
    ctx.fillStyle=shelf;
    ctx.beginPath();
    ctx.moveTo(fallX-94*s,impactY+12*s);
    ctx.bezierCurveTo(fallX-77*s,lipY+84*s,fallX-39*s,lipY+78*s,fallX-12*s,lipY+89*s);
    ctx.bezierCurveTo(fallX+18*s,lipY+74*s,fallX+59*s,lipY+78*s,fallX+82*s,lipY+91*s);
    ctx.bezierCurveTo(fallX+104*s,lipY+83*s,fallX+117*s,lipY+99*s,fallX+113*s,impactY+14*s);
    ctx.lineTo(fallX+113*s,impactY+30*s);
    ctx.lineTo(fallX-94*s,impactY+30*s);
    ctx.closePath();
    ctx.fill();

    var holeX=fallX+8*s;
    var holeY=lipY+77*s;
    var holeR=25*s;
    var cavity=ctx.createRadialGradient(holeX-4*s,holeY-6*s,2,holeX,holeY,holeR);
    cavity.addColorStop(0,'rgba(27,53,50,.83)');
    cavity.addColorStop(.45,'rgba(39,68,63,.74)');
    cavity.addColorStop(.77,'rgba(65,93,82,.40)');
    cavity.addColorStop(1,'rgba(94,118,104,0)');
    ctx.fillStyle=cavity;
    ctx.beginPath();
    ctx.ellipse(holeX,holeY,holeR*1.18,holeR*.69,-.02,0,TAU);
    ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var j=0;j<6;j++){
      var iy=holeY-4*s+j*1.38*s;
      var ia=.13+j*.016;
      ctx.strokeStyle='rgba(242,250,230,'+ia+')';
      ctx.lineWidth=(j%3===0?1.12:.72)*s;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(holeX-14*s,iy);
      ctx.bezierCurveTo(holeX-5*s,iy-2*s,holeX+7*s,iy+1*s,holeX+15*s,iy+7*s);
      ctx.stroke();
    }
    ctx.restore();

    return {s:s,holeX:holeX,holeY:holeY,holeR:holeR};
  }

  function overhang(g){
    var s=g.s;

    ctx.fillStyle='rgba(35,65,60,.48)';
    ctx.beginPath();
    ctx.moveTo(g.holeX-g.holeR*1.04,g.holeY-3*s);
    ctx.bezierCurveTo(g.holeX-g.holeR*.52,g.holeY-14*s,g.holeX+g.holeR*.46,g.holeY-13*s,g.holeX+g.holeR*1.02,g.holeY-2*s);
    ctx.bezierCurveTo(g.holeX+g.holeR*.78,g.holeY+7*s,g.holeX-g.holeR*.70,g.holeY+7*s,g.holeX-g.holeR*1.04,g.holeY-3*s);
    ctx.fill();

    var lip=ctx.createLinearGradient(g.holeX,g.holeY-17*s,g.holeX,g.holeY+3*s);
    lip.addColorStop(0,'rgba(154,174,157,.98)');
    lip.addColorStop(.46,'rgba(111,139,127,.98)');
    lip.addColorStop(1,'rgba(69,99,92,.98)');
    ctx.fillStyle=lip;
    ctx.beginPath();
    ctx.moveTo(g.holeX-g.holeR*.99,g.holeY-8*s);
    ctx.bezierCurveTo(g.holeX-g.holeR*.46,g.holeY-20*s,g.holeX+g.holeR*.43,g.holeY-18*s,g.holeX+g.holeR*.96,g.holeY-6*s);
    ctx.bezierCurveTo(g.holeX+g.holeR*.68,g.holeY,g.holeX-g.holeR*.65,g.holeY+1*s,g.holeX-g.holeR*.99,g.holeY-8*s);
    ctx.fill();

    ctx.strokeStyle='rgba(255,241,194,.18)';
    ctx.lineWidth=.78*s;
    ctx.beginPath();
    ctx.moveTo(g.holeX-g.holeR*.74,g.holeY-9*s);
    ctx.quadraticCurveTo(g.holeX,g.holeY-16*s,g.holeX+g.holeR*.70,g.holeY-8*s);
    ctx.stroke();
  }

  function waterfall(impactY,g,time,mobile){
    var s=g.s;
    var startY=g.holeY+6*s;
    var bendY=g.holeY+24*s;
    var rearCount=mobile ? 11 : 14;
    var topSpread=21*s;
    var bottomSpread=43*s;

    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var i=0;i<rearCount;i++){
      var t=rearCount===1 ? 0.5 : i/(rearCount-1);
      var sx=g.holeX-topSpread*.5+t*topSpread;
      var ex=g.holeX-bottomSpread*.5+t*bottomSpread;
      var sway=0;
      if(!reduced.matches)sway=Math.sin(time*1.01+i*.61)*(1+(i%4)*.14)*s;
      var center=1-Math.abs(t-.5)*2;
      var alpha=.075+center*.075;
      ctx.strokeStyle='rgba(216,239,232,'+alpha+')';
      ctx.lineWidth=(.55+center*.36)*s;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(sx,startY);
      ctx.bezierCurveTo(sx+1*s,startY+7*s,ex-2*s,bendY-5*s,ex,bendY);
      ctx.bezierCurveTo(ex+sway,bendY+18*s,ex+sway*.62,impactY-17*s,ex+sway*.20,impactY);
      ctx.stroke();
    }

    var cores=[-.30,0,.28];
    for(var c=0;c<cores.length;c++){
      var ct=.5+cores[c];
      var csx=g.holeX-topSpread*.5+ct*topSpread;
      var cex=g.holeX-bottomSpread*.5+ct*bottomSpread;
      var csway=0;
      if(!reduced.matches)csway=Math.sin(time*.93+c*1.7)*1.15*s;
      ctx.strokeStyle=c===1?'rgba(249,252,236,.31)':'rgba(239,248,233,.245)';
      ctx.lineWidth=(c===1?1.45:1.14)*s;
      ctx.beginPath();
      ctx.moveTo(csx,startY);
      ctx.bezierCurveTo(csx,startY+8*s,cex-1*s,bendY-4*s,cex,bendY);
      ctx.bezierCurveTo(cex+csway,bendY+20*s,cex+csway*.5,impactY-15*s,cex,impactY);
      ctx.stroke();
    }

    if(!reduced.matches){
      for(var d=0;d<8;d++){
        var p=(time*.50+d*.123)%1;
        var x=g.holeX+(d%2===0?-1:1)*(3+d*.8)*s*p;
        var y=startY+(impactY-startY)*p;
        ctx.fillStyle='rgba(255,248,211,'+(.10+(1-p)*.18)+')';
        ctx.beginPath();
        ctx.ellipse(x,y,.68*s,1.9*s,0,0,TAU);
        ctx.fill();
      }
    }
    ctx.restore();

    overhang(g);

    var mist=ctx.createRadialGradient(g.holeX,impactY+1,0,g.holeX,impactY+1,58*s);
    mist.addColorStop(0,'rgba(253,249,217,.30)');
    mist.addColorStop(.36,'rgba(229,246,236,.15)');
    mist.addColorStop(1,'rgba(229,246,236,0)');
    ctx.fillStyle=mist;
    ctx.fillRect(g.holeX-64*s,impactY-39*s,128*s,82*s);

    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var k=0;k<10;k++){
      var phase=reduced.matches ? 0.36 : (time*.73+k*.101)%1;
      var dir=k%2===0?-1:1;
      var spread=(4+k*1.45)*s;
      var dx=g.holeX+dir*spread*phase;
      var dy=impactY-2*s-(1-phase)*(14+(k%3)*4)*s;
      ctx.fillStyle='rgba(255,249,214,'+((1-phase)*.32)+')';
      ctx.beginPath();
      ctx.arc(dx,dy,(.70+(k%3)*.20)*s,0,TAU);
      ctx.fill();
    }
    ctx.restore();

    for(var r=0;r<5;r++){
      var rp=reduced.matches ? 0.38 : (time*.245+r/5)%1;
      var inner=r<2;
      var alpha=(1-rp)*(inner ? 0.38 : 0.18);
      var reach=inner ? 42 : 62;
      ctx.strokeStyle='rgba(255,245,199,'+alpha+')';
      ctx.lineWidth=inner ? 1.08 : .78;
      ctx.beginPath();
      ctx.ellipse(g.holeX,impactY+4,7+rp*reach*s,2+rp*(inner ? 7 : 9)*s,0,0,TAU);
      ctx.stroke();
    }
  }

  function draw(time){
    prep();
    if(document.body.dataset.kind!=='meditation')return;

    var mobile=width<700;
    bambooWaterReflections(time);

    var fallX=mobile ? 896 : 972;
    var lipY=mobile ? 426 : 478;
    var impactY=mobile ? 520 : 574;
    var geometry=bank(fallX,lipY,impactY,mobile,time);
    waterfall(impactY,geometry,time,mobile);
  }

  function resize(){
    var b=host.getBoundingClientRect();
    width=Math.max(1,b.width);
    height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1050000/(width*height)));
    scale=Math.max(width/W,height/H);
    left=(width-W*scale)*(width<600 ? 0.69 : 0.5);
    canvas.width=Math.round(width*ratio);
    canvas.height=Math.round(height*ratio);
    draw(reduced.matches ? 0 : performance.now()/1000);
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
  new MutationObserver(function(){draw(reduced.matches ? 0 : performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);
  if(reduced.addEventListener)reduced.addEventListener('change',wake);
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',wake);
  resize();
})();