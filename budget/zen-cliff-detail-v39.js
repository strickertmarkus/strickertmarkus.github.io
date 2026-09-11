/* Zen v41 — cliff garden polish over Astra's v38 cliff.
   Keeps cliff/waterfall geometry untouched; places depth stones beside the cliff,
   lays the lily flat on the pond surface, and keeps the cliff plants grounded. */
(function(){
  'use strict';

  var WATER=575;
  var TAU=Math.PI*2;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');

  function geometry(viewport){
    var mobile=viewport.width<700;
    var cropRight=(viewport.width-viewport.left)/viewport.scale;
    var x=mobile ? Math.min(846,cropRight-118) : 936;
    return {x:x,s:mobile ? .64 : .76,top:430,water:WATER};
  }

  function stonePath(ctx,rx,ry){
    ctx.beginPath();
    ctx.moveTo(-rx*.96,ry*.12);
    ctx.bezierCurveTo(-rx*.84,-ry*.42,-rx*.48,-ry*.73,-rx*.10,-ry*.61);
    ctx.bezierCurveTo(rx*.18,-ry*.82,rx*.58,-ry*.53,rx*.89,-ry*.18);
    ctx.bezierCurveTo(rx*1.01,ry*.05,rx*.70,ry*.35,rx*.27,ry*.43);
    ctx.bezierCurveTo(-rx*.21,ry*.52,-rx*.72,ry*.40,-rx*.96,ry*.12);
    ctx.closePath();
  }

  function depthStone(ctx,cx,cy,rx,ry,lean,alpha,warm){
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(cx,cy);
    ctx.rotate(lean);
    var g=ctx.createLinearGradient(-rx,-ry,rx,ry);
    if(warm){
      g.addColorStop(0,'#d6d9bd');
      g.addColorStop(.38,'#aebba8');
      g.addColorStop(1,'#718a80');
    }else{
      g.addColorStop(0,'#c3cfbd');
      g.addColorStop(.42,'#99aa9e');
      g.addColorStop(1,'#607c74');
    }
    ctx.fillStyle=g;
    stonePath(ctx,rx,ry);
    ctx.fill();
    ctx.clip();

    var sun=ctx.createLinearGradient(-rx*.8,-ry*.7,rx*.25,ry*.1);
    sun.addColorStop(0,'rgba(255,240,188,.24)');
    sun.addColorStop(.55,'rgba(246,235,194,.07)');
    sun.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sun;
    ctx.beginPath();
    ctx.ellipse(-rx*.18,-ry*.18,rx*.68,ry*.40,-.12,0,TAU);
    ctx.fill();

    ctx.strokeStyle='rgba(54,82,72,.18)';
    ctx.lineWidth=.7;
    ctx.beginPath();
    ctx.moveTo(-rx*.42,-ry*.18);
    ctx.lineTo(-rx*.12,ry*.03);
    ctx.lineTo(rx*.20,-ry*.08);
    ctx.stroke();
    ctx.restore();
  }

  function drawReflection(ctx,cx,water,rx,alpha){
    ctx.save();
    ctx.globalAlpha=alpha;
    var g=ctx.createLinearGradient(0,water,0,water+35);
    g.addColorStop(0,'rgba(128,170,160,.26)');
    g.addColorStop(1,'rgba(128,170,160,0)');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.ellipse(cx,water+11,rx*.78,7,0,0,TAU);
    ctx.fill();
    ctx.strokeStyle='rgba(255,241,188,.11)';
    ctx.lineWidth=.7;
    ctx.beginPath();
    ctx.ellipse(cx,water+2,rx*.92,3.2,0,0,TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawRightDepthStones(ctx,g){
    var s=g.s;
    /* Astra's cliff silhouette reaches roughly x + 120*s. Keep this group just
       beyond that edge so it reads as a separate pond bank in the user's marked area. */
    var stones=[
      {x:g.x+130*s,y:g.water-10,rx:20*s,ry:12*s,l:-.05,a:.43,w:false},
      {x:g.x+149*s,y:g.water-18,rx:27*s,ry:18*s,l:-.09,a:.55,w:true},
      {x:g.x+170*s,y:g.water-8,rx:17*s,ry:10*s,l:.04,a:.39,w:true},
      {x:g.x+188*s,y:g.water-14,rx:23*s,ry:16*s,l:.08,a:.49,w:false},
      {x:g.x+207*s,y:g.water-5,rx:15*s,ry:9*s,l:-.06,a:.36,w:true}
    ];

    for(var i=0;i<stones.length;i++){
      var st=stones[i];
      drawReflection(ctx,st.x,g.water,st.rx,st.a*.52);
      depthStone(ctx,st.x,st.y,st.rx,st.ry,st.l,st.a,st.w);
    }
  }

  function contactSeam(ctx,cx,cy,rx,lean){
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(lean);
    var shadow=ctx.createRadialGradient(0,0,0,0,0,rx);
    shadow.addColorStop(0,'rgba(36,67,59,.29)');
    shadow.addColorStop(.56,'rgba(44,76,66,.18)');
    shadow.addColorStop(1,'rgba(44,76,66,0)');
    ctx.fillStyle=shadow;
    ctx.beginPath();
    ctx.ellipse(0,0,rx,4.4,0,0,TAU);
    ctx.fill();
    ctx.strokeStyle='rgba(42,72,63,.23)';
    ctx.lineWidth=.75;
    ctx.beginPath();
    ctx.moveTo(-rx*.66,0);
    ctx.quadraticCurveTo(0,2.8,rx*.68,-.4);
    ctx.stroke();
    ctx.restore();
  }

  function leaf(ctx,x,y,len,w,angle,alpha){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    ctx.globalAlpha=alpha;
    var g=ctx.createLinearGradient(-len*.45,0,len*.55,0);
    g.addColorStop(0,'#355f4b');
    g.addColorStop(.58,'#557d5d');
    g.addColorStop(1,'#789468');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(-len*.42,0);
    ctx.quadraticCurveTo(-len*.03,-w,len*.54,0);
    ctx.quadraticCurveTo(-len*.03,w,-len*.42,0);
    ctx.fill();
    ctx.strokeStyle='rgba(246,229,169,.18)';
    ctx.lineWidth=.45;
    ctx.beginPath();
    ctx.moveTo(-len*.25,0);
    ctx.lineTo(len*.32,0);
    ctx.stroke();
    ctx.restore();
  }

  function drawCliffPlant(ctx,g,time){
    var s=g.s;
    var px=g.x+45*s;
    var py=g.top+12;
    var sway=reduced.matches ? 0 : Math.sin(time*.55)*2.2*s;

    ctx.save();
    var moss=ctx.createRadialGradient(px,py+3,0,px,py+3,18*s);
    moss.addColorStop(0,'rgba(54,96,68,.42)');
    moss.addColorStop(.62,'rgba(67,108,74,.20)');
    moss.addColorStop(1,'rgba(67,108,74,0)');
    ctx.fillStyle=moss;
    ctx.beginPath();
    ctx.ellipse(px,py+3,18*s,5*s,0,0,TAU);
    ctx.fill();

    ctx.strokeStyle='rgba(49,91,63,.78)';
    ctx.lineWidth=1.15*s;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(px,py+2);
    ctx.bezierCurveTo(px-1*s,py-6,px-4*s+sway*.35,py-13,px-7*s+sway,py-22);
    ctx.moveTo(px+2*s,py+2);
    ctx.bezierCurveTo(px+4*s,py-5,px+9*s+sway*.25,py-11,px+11*s+sway*.6,py-18);
    ctx.moveTo(px-2*s,py+2);
    ctx.bezierCurveTo(px-6*s,py-4,px-13*s+sway*.18,py-7,px-16*s+sway*.45,py-13);
    ctx.stroke();

    leaf(ctx,px-9*s+sway,py-22,15*s,4.7*s,-.48,.91);
    leaf(ctx,px-3*s+sway*.65,py-15,13*s,4.1*s,.36,.86);
    leaf(ctx,px+12*s+sway*.6,py-18,14*s,4.4*s,.28,.90);
    leaf(ctx,px-16*s+sway*.45,py-13,11*s,3.6*s,-.28,.78);
    ctx.restore();
  }

  function drawWallPlant(ctx,g,time){
    var s=g.s;
    var px=g.x+24*s;
    var py=g.top+88*s;
    var sway=reduced.matches ? 0 : Math.sin(time*.62+1.1)*1.5*s;

    ctx.save();
    var moss=ctx.createRadialGradient(px,py,0,px,py,14*s);
    moss.addColorStop(0,'rgba(49,91,62,.38)');
    moss.addColorStop(.62,'rgba(68,105,72,.15)');
    moss.addColorStop(1,'rgba(68,105,72,0)');
    ctx.fillStyle=moss;
    ctx.beginPath();
    ctx.ellipse(px,py,14*s,5*s,-.18,0,TAU);
    ctx.fill();

    ctx.strokeStyle='rgba(48,87,61,.76)';
    ctx.lineWidth=1.05*s;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(px,py+1);
    ctx.bezierCurveTo(px+1*s,py-5,px+6*s+sway*.25,py-12,px+8*s+sway,py-20);
    ctx.moveTo(px-2*s,py+1);
    ctx.bezierCurveTo(px-5*s,py-4,px-9*s+sway*.18,py-9,px-13*s+sway*.55,py-15);
    ctx.moveTo(px+1*s,py+2);
    ctx.bezierCurveTo(px+4*s,py+7,px+8*s+sway*.12,py+11,px+11*s+sway*.35,py+16);
    ctx.stroke();

    leaf(ctx,px+8*s+sway,py-20,12*s,3.8*s,.32,.85);
    leaf(ctx,px-13*s+sway*.55,py-15,11*s,3.6*s,-.24,.80);
    leaf(ctx,px+4*s+sway*.42,py-11,10*s,3.2*s,-.70,.72);
    leaf(ctx,px+11*s+sway*.35,py+16,9*s,3.0*s,.64,.64);
    ctx.restore();
  }

  function lilyPadPath(ctx,r){
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,r,.20*Math.PI,1.88*Math.PI,false);
    ctx.closePath();
  }

  function drawFrontLily(ctx,g,time){
    var s=g.s;
    /* Place the lily in the foreground pond, below and slightly right of the cliff.
       It is deliberately flattened in Y so it lies on the water plane. */
    var x=g.x+54*s;
    var y=g.water+54;
    var bob=reduced.matches ? 0 : Math.sin(time*.72+.45)*.45*s;
    var r=23*s;
    var tilt=-.12;

    ctx.save();
    ctx.globalAlpha=.32;
    ctx.fillStyle='rgba(74,117,103,.20)';
    ctx.beginPath();
    ctx.ellipse(x,y+3+bob,r*1.15,r*.24,tilt,0,TAU);
    ctx.fill();
    ctx.strokeStyle='rgba(248,232,178,.12)';
    ctx.lineWidth=.65;
    ctx.beginPath();
    ctx.ellipse(x,y+1+bob,r*1.28,r*.31,tilt,0,TAU);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(x,y+bob);
    ctx.rotate(tilt);
    ctx.scale(1,.34);
    var pad=ctx.createRadialGradient(-r*.18,-r*.18,0,0,0,r);
    pad.addColorStop(0,'rgba(191,213,166,.96)');
    pad.addColorStop(.54,'rgba(137,172,124,.92)');
    pad.addColorStop(1,'rgba(78,119,94,.90)');
    ctx.fillStyle=pad;
    lilyPadPath(ctx,r);
    ctx.fill();
    ctx.strokeStyle='rgba(48,85,68,.30)';
    ctx.lineWidth=1.25;
    ctx.stroke();
    ctx.strokeStyle='rgba(246,230,175,.20)';
    ctx.lineWidth=.8;
    ctx.beginPath();
    ctx.moveTo(-r*.68,-r*.09);
    ctx.quadraticCurveTo(-r*.16,-r*.04,r*.43,-r*.18);
    ctx.stroke();
    ctx.restore();

    /* Low, side-view blossom sitting on the same water plane. */
    ctx.save();
    var bx=x+7*s;
    var by=y-3+bob;
    ctx.fillStyle='rgba(255,243,207,.76)';
    ctx.beginPath();
    ctx.ellipse(bx-2.5*s,by,4.6*s,1.55*s,-.20,0,TAU);
    ctx.ellipse(bx+2.1*s,by-.3*s,4.4*s,1.45*s,.18,0,TAU);
    ctx.fill();
    var glow=ctx.createRadialGradient(bx,by,0,bx,by,8*s);
    glow.addColorStop(0,'rgba(250,225,158,.24)');
    glow.addColorStop(1,'rgba(250,225,158,0)');
    ctx.fillStyle=glow;
    ctx.beginPath();
    ctx.ellipse(bx,by,8*s,3*s,0,0,TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawDetails(ctx,viewport,time){
    if(document.body.dataset.kind!=='meditation')return;
    var g=geometry(viewport);

    drawRightDepthStones(ctx,g);

    /* Astra's two cap stones keep their shapes, but gain contact shadows so their
       lower edges read as resting in the cliff rather than hovering above it. */
    contactSeam(ctx,g.x-61*g.s,g.top+23,18*g.s,-.14);
    contactSeam(ctx,g.x+72*g.s,g.top+17,17*g.s,.12);

    drawCliffPlant(ctx,g,time||0);
    drawWallPlant(ctx,g,time||0);
    drawFrontLily(ctx,g,time||0);
  }

  function install(){
    var pond=window.ZenPondRocks;
    if(!pond||typeof pond.draw!=='function'||pond.__cliffDetailV41)return false;
    var original=pond.draw;
    pond.draw=function(context,viewport,time){
      original(context,viewport,time);
      drawDetails(context,viewport,time||0);
    };
    pond.__cliffDetailV41=true;
    return true;
  }

  function attemptInstall(){
    if(!install())return;
    window.removeEventListener('zen-pond-ready',attemptInstall);
    window.setTimeout(function(){window.dispatchEvent(new Event('zen-pond-ready'));},0);
  }

  window.addEventListener('zen-pond-ready',attemptInstall);
  attemptInstall();
})();