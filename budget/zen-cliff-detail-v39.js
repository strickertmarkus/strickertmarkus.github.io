/* Zen v39 — depth stones, grounded cap stones and a small cliff plant.
   Narrow polish layer over Astra's v38 cliff; Stretch and core waterfall geometry stay untouched. */
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
    var stones=[
      {x:g.x+154*s,y:g.water-7,rx:34*s,ry:17*s,l:-.07,a:.56,w:true},
      {x:g.x+200*s,y:g.water-12,rx:27*s,ry:17*s,l:.09,a:.50,w:false},
      {x:g.x+236*s,y:g.water-4,rx:18*s,ry:10*s,l:-.10,a:.43,w:true},
      {x:g.x+270*s,y:g.water-2,rx:13*s,ry:8*s,l:.06,a:.34,w:false}
    ];

    for(var i=0;i<stones.length;i++){
      var st=stones[i];
      drawReflection(ctx,st.x,g.water,st.rx,st.a*.55);
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

    /* Moss base hides the exact emergence point in a crack. */
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

  function drawDetails(ctx,viewport,time){
    if(document.body.dataset.kind!=='meditation')return;
    var g=geometry(viewport);

    /* Right-side stones sit at the pond edge and are naturally occluded by the
       foreground bamboo because this wrapper still runs before that bamboo pass. */
    drawRightDepthStones(ctx,g);

    /* Astra's two cap stones keep their shapes, but gain contact shadows so their
       lower edges read as resting in the cliff rather than hovering above it. */
    contactSeam(ctx,g.x-61*g.s,g.top+23,18*g.s,-.14);
    contactSeam(ctx,g.x+72*g.s,g.top+17,17*g.s,.12);

    drawCliffPlant(ctx,g,time||0);
  }

  function install(){
    var pond=window.ZenPondRocks;
    if(!pond||typeof pond.draw!=='function'||pond.__cliffDetailV39)return false;
    var original=pond.draw;
    pond.draw=function(context,viewport,time){
      original(context,viewport,time);
      drawDetails(context,viewport,time||0);
    };
    pond.__cliffDetailV39=true;
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
