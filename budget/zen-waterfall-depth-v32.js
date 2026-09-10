/* Zen v32: two-layer Meditation waterfall with consistent bamboo depth and a readable pond waterline. */
(function(){
  'use strict';

  var host=document.querySelector('.landscape');
  if(!host)return;
  var scene=document.querySelector('.landscape-meditation-v8');
  var shade=host.querySelector('.landscape-shade');
  if(!scene||!shade)return;

  var rear=document.createElement('canvas');
  rear.className='zen-waterfall-rear-v32';
  host.insertBefore(rear,scene);

  var front=document.createElement('canvas');
  front.className='zen-waterfall-front-v32';
  host.insertBefore(front,shade);

  var rctx=rear.getContext('2d');
  var fctx=front.getContext('2d');
  if(!rctx||!fctx)return;

  var W=1200,H=900,WATER=575,TAU=Math.PI*2;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;

  function pathRock(ctx,cx,cy,rx,ry,pts){
    ctx.beginPath();
    for(var i=0;i<pts.length;i++){
      var p=pts[i];
      var x=cx+p[0]*rx;
      var y=cy+p[1]*ry;
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.closePath();
  }

  function rock(ctx,cx,cy,rx,ry,variant){
    var shapes={
      back:[[-.97,.18],[-.84,-.24],[-.54,-.58],[-.16,-.74],[.16,-.66],[.46,-.76],[.78,-.43],[.96,-.05],[.78,.36],[.39,.55],[-.10,.63],[-.57,.50],[-.88,.34]],
      shelf:[[-.96,.12],[-.75,-.34],[-.36,-.51],[.02,-.44],[.35,-.60],[.76,-.31],[.96,.02],[.72,.37],[.24,.47],[-.23,.44],[-.67,.31]],
      small:[[-.91,.17],[-.70,-.29],[-.31,-.51],[.09,-.44],[.42,-.59],[.82,-.25],[.94,.08],[.62,.42],[.12,.52],[-.47,.43]]
    };
    var pts=shapes[variant]||shapes.small;
    var g=ctx.createLinearGradient(cx-rx,cy-ry,cx+rx,cy+ry);
    if(variant==='back'){
      g.addColorStop(0,'#d0d8c3');g.addColorStop(.30,'#aebdaf');g.addColorStop(.68,'#718980');g.addColorStop(1,'#526c66');
    }else{
      g.addColorStop(0,'#bcc9b7');g.addColorStop(.30,'#97a99b');g.addColorStop(.68,'#647c74');g.addColorStop(1,'#465f5a');
    }
    ctx.fillStyle=g;
    pathRock(ctx,cx,cy,rx,ry,pts);
    ctx.fill();
    ctx.save();
    pathRock(ctx,cx,cy,rx,ry,pts);
    ctx.clip();

    var sun=ctx.createLinearGradient(cx-rx*.85,cy-ry*.82,cx+rx*.12,cy+ry*.08);
    sun.addColorStop(0,variant==='back'?'rgba(255,239,187,.26)':'rgba(250,237,193,.16)');
    sun.addColorStop(.55,'rgba(248,236,191,.06)');
    sun.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sun;
    ctx.beginPath();ctx.ellipse(cx-rx*.12,cy-ry*.24,rx*.72,ry*.43,-.13,0,TAU);ctx.fill();

    var under=ctx.createLinearGradient(cx,cy-ry*.12,cx,cy+ry);
    under.addColorStop(0,'rgba(22,50,47,0)');under.addColorStop(.70,'rgba(24,50,48,.10)');under.addColorStop(1,'rgba(18,42,40,.30)');
    ctx.fillStyle=under;ctx.fillRect(cx-rx,cy-ry*.1,rx*2,ry*1.2);

    ctx.strokeStyle='rgba(246,239,194,.22)';ctx.lineWidth=.8;ctx.lineCap='round';
    for(var i=0;i<3;i++){
      var yy=cy-ry*.30+i*ry*.18;
      ctx.beginPath();
      ctx.moveTo(cx-rx*.58+i*rx*.06,yy);
      ctx.bezierCurveTo(cx-rx*.25,yy-ry*.08,cx+rx*.10,yy-ry*.05,cx+rx*.43-i*rx*.05,yy-ry*.01);
      ctx.stroke();
    }
    ctx.restore();
  }

  function geometry(){
    var mobile=width<700;
    var cropRight=(width-left)/scale;
    var fallX=mobile?Math.min(902,cropRight-92):952;
    return {mobile:mobile,s:mobile?0.64:0.77,fallX:fallX,crestY:447,lipY:470,waterY:WATER};
  }

  function prep(ctx){
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.translate(left,0);
    ctx.scale(scale,scale);
  }

  function drawWaterline(ctx,time){
    ctx.save();
    ctx.globalCompositeOperation='screen';
    var line=ctx.createLinearGradient(520,WATER,1165,WATER);
    line.addColorStop(0,'rgba(244,246,215,0)');
    line.addColorStop(.18,'rgba(244,246,215,.10)');
    line.addColorStop(.62,'rgba(255,240,183,.17)');
    line.addColorStop(.90,'rgba(235,246,224,.08)');
    line.addColorStop(1,'rgba(235,246,224,0)');
    ctx.strokeStyle=line;ctx.lineWidth=1.25;
    ctx.beginPath();ctx.moveTo(520,WATER);ctx.bezierCurveTo(710,WATER-1.5,930,WATER+1.5,1165,WATER);ctx.stroke();

    for(var i=0;i<5;i++){
      var travel=reduced.matches?i/5:((time*.055+i*.21)%1);
      var x=610+travel*500;
      var a=Math.sin(travel*Math.PI)*.12;
      ctx.strokeStyle='rgba(255,244,197,'+a+')';ctx.lineWidth=.9;
      ctx.beginPath();ctx.moveTo(x-24,WATER+2+i*.35);ctx.quadraticCurveTo(x,WATER-1,x+24,WATER+1);ctx.stroke();
    }
    ctx.restore();
  }

  function drawRear(g,time){
    var ctx=rctx,s=g.s,x=g.fallX;
    drawWaterline(ctx,time);

    /* Rear shelf is one coherent bank behind every bamboo stalk. */
    rock(ctx,x+22*s,g.crestY+18*s,99*s,58*s,'back');
    rock(ctx,x-55*s,g.crestY+40*s,39*s,27*s,'small');
    rock(ctx,x+101*s,g.crestY+40*s,34*s,24*s,'small');

    /* Thin water film travels across the rock surface before reaching the lip. */
    ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
    for(var i=0;i<7;i++){
      var off=(i-3)*2.4*s;
      var drift=reduced.matches?0:Math.sin(time*.78+i*.9)*1.4*s;
      ctx.strokeStyle='rgba(224,244,231,'+(0.10+(3-Math.abs(i-3))*.025)+')';
      ctx.lineWidth=(i===3?1.45:.82)*s;
      ctx.beginPath();
      ctx.moveTo(x-73*s,g.crestY+8*s+off);
      ctx.bezierCurveTo(x-47*s,g.crestY-1*s+off+drift,x-22*s,g.crestY+9*s+off,x-4*s,g.lipY-3*s+off*.34);
      ctx.stroke();
    }
    ctx.restore();

    /* Main falling water stays behind foreground bamboo for consistent depth. */
    ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
    var count=g.mobile?15:18;
    for(var j=0;j<count;j++){
      var t=count===1?0.5:j/(count-1);
      var sx=x-15*s+t*30*s;
      var spread=x-32*s+t*64*s;
      var sway=reduced.matches?0:Math.sin(time*.94+j*.67)*(1.5+(j%4)*.24)*s;
      var center=1-Math.abs(t-.5)*2;
      ctx.strokeStyle='rgba(213,239,232,'+(0.075+center*.085)+')';
      ctx.lineWidth=(.52+center*.54)*s;
      ctx.beginPath();
      ctx.moveTo(sx,g.lipY+2*s);
      ctx.bezierCurveTo(sx+1*s,g.lipY+18*s,spread+sway,WATER-34*s,spread+sway*.22,WATER-3*s);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFront(g,time){
    var ctx=fctx,s=g.s,x=g.fallX;

    /* Foreground lip stones are entirely in front of bamboo; each rock keeps one depth. */
    rock(ctx,x-31*s,g.lipY+14*s,34*s,23*s,'shelf');
    rock(ctx,x+34*s,g.lipY+15*s,38*s,24*s,'shelf');
    rock(ctx,x-73*s,g.lipY+28*s,23*s,17*s,'small');

    /* Dark channel cut beneath the overhang. */
    var cavity=ctx.createRadialGradient(x-1*s,g.lipY-1*s,2,x,g.lipY+3*s,26*s);
    cavity.addColorStop(0,'rgba(30,58,54,.84)');cavity.addColorStop(.48,'rgba(43,72,66,.68)');cavity.addColorStop(1,'rgba(86,108,96,0)');
    ctx.fillStyle=cavity;ctx.beginPath();ctx.ellipse(x,g.lipY+1*s,27*s,13*s,-.02,0,TAU);ctx.fill();

    /* Water visibly folds over the lip before joining the rear falling sheet. */
    ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
    for(var i=0;i<6;i++){
      var o=(i-2.5)*3.1*s;
      var alpha=(i===2||i===3)?0.30:0.19;
      ctx.strokeStyle='rgba(245,249,229,'+alpha+')';
      ctx.lineWidth=(i===2||i===3?1.45:.9)*s;
      ctx.beginPath();
      ctx.moveTo(x-13*s+o*.24,g.lipY-4*s);
      ctx.bezierCurveTo(x-8*s+o*.35,g.lipY+1*s,x-4*s+o*.55,g.lipY+7*s,x-3*s+o*.82,g.lipY+18*s);
      ctx.stroke();
    }
    ctx.restore();

    /* A real stone overhang masks the water source so it comes from inside the formation. */
    var lip=ctx.createLinearGradient(x,g.lipY-17*s,x,g.lipY+2*s);
    lip.addColorStop(0,'rgba(167,181,162,.98)');lip.addColorStop(.5,'rgba(117,142,130,.98)');lip.addColorStop(1,'rgba(71,99,92,.98)');
    ctx.fillStyle=lip;ctx.beginPath();ctx.moveTo(x-24*s,g.lipY-8*s);ctx.bezierCurveTo(x-11*s,g.lipY-18*s,x+10*s,g.lipY-17*s,x+24*s,g.lipY-7*s);ctx.bezierCurveTo(x+16*s,g.lipY-1*s,x-16*s,g.lipY,x-24*s,g.lipY-8*s);ctx.fill();
    ctx.strokeStyle='rgba(255,241,194,.20)';ctx.lineWidth=.8*s;ctx.beginPath();ctx.moveTo(x-17*s,g.lipY-9*s);ctx.quadraticCurveTo(x,g.lipY-14*s,x+17*s,g.lipY-8*s);ctx.stroke();

    /* Landing makes the WATER=575 boundary obvious without drawing a hard divider. */
    var mist=ctx.createRadialGradient(x,WATER,0,x,WATER,54*s);
    mist.addColorStop(0,'rgba(255,248,211,.27)');mist.addColorStop(.40,'rgba(229,246,236,.12)');mist.addColorStop(1,'rgba(229,246,236,0)');
    ctx.fillStyle=mist;ctx.fillRect(x-60*s,WATER-34*s,120*s,70*s);

    ctx.save();ctx.globalCompositeOperation='screen';
    for(var d=0;d<8;d++){
      var p=reduced.matches?0.38:((time*.58+d*.113)%1);
      var side=d%2===0?-1:1;
      var dx=x+side*(4+d*1.2)*s*p;
      var dy=WATER-3*s-(1-p)*(12+(d%3)*4)*s;
      ctx.fillStyle='rgba(255,248,211,'+((1-p)*.27)+')';
      ctx.beginPath();ctx.arc(dx,dy,(.65+(d%3)*.16)*s,0,TAU);ctx.fill();
    }
    for(var r=0;r<5;r++){
      var rp=reduced.matches?0.34:((time*.22+r*.19)%1);
      var inner=r<2;
      var reach=inner?45:69;
      var alpha=(1-rp)*(inner?0.36:0.15);
      ctx.strokeStyle='rgba(255,244,198,'+alpha+')';ctx.lineWidth=inner?1.08:.72;
      ctx.beginPath();ctx.ellipse(x,WATER+3*s,8+rp*reach*s,2+rp*(inner?7:10)*s,0,0,TAU);ctx.stroke();
    }
    ctx.restore();
  }

  function draw(time){
    prep(rctx);prep(fctx);
    if(document.body.dataset.kind!=='meditation')return;
    var g=geometry();
    drawRear(g,time);
    drawFront(g,time);
  }

  function resize(){
    var b=host.getBoundingClientRect();
    width=Math.max(1,b.width);height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1180000/(width*height)));
    scale=Math.max(width/W,height/H);
    left=(width-W*scale)*(width<600?0.69:0.5);
    rear.width=Math.round(width*ratio);rear.height=Math.round(height*ratio);
    front.width=Math.round(width*ratio);front.height=Math.round(height*ratio);
    draw(reduced.matches?0:performance.now()/1000);wake();
  }

  function loop(now){frame=0;if(document.hidden||!visible||reduced.matches)return;if(now-last>=34){last=now;draw(now/1000);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame)cancelAnimationFrame(frame);frame=0;if(document.hidden||!visible)return;if(reduced.matches){draw(0);return;}frame=requestAnimationFrame(loop);}

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(function(){draw(reduced.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);
  if(reduced.addEventListener)reduced.addEventListener('change',wake);
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',wake);
  resize();
})();
