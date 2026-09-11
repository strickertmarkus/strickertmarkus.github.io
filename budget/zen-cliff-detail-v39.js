/* Zen v44 — cliff garden layering.
   Rear pond stones are drawn BEFORE Astra's cliff/waterfall so the cliff naturally
   occludes them. Plant and lily details are drawn afterwards. */
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

  function stonePath(ctx,rx,ry,shape){
    var forms={
      broad:[[-.98,.18],[-.82,-.36],[-.45,-.70],[-.06,-.64],[.26,-.80],[.66,-.44],[.96,-.08],[.86,.30],[.48,.54],[-.14,.57],[-.70,.42]],
      rear:[[-.96,.14],[-.82,-.42],[-.40,-.70],[.04,-.60],[.35,-.78],[.75,-.36],[.95,.02],[.70,.43],[.15,.62],[-.52,.49]],
      low:[[-.99,.14],[-.74,-.38],[-.30,-.50],[.14,-.62],[.59,-.33],[.94,-.06],[.82,.29],[.31,.43],[-.43,.48],[-.84,.29]]
    };
    var pts=forms[shape]||forms.rear;
    ctx.beginPath();
    for(var i=0;i<pts.length;i++){
      var p=pts[i];
      if(i===0)ctx.moveTo(p[0]*rx,p[1]*ry);else ctx.lineTo(p[0]*rx,p[1]*ry);
    }
    ctx.closePath();
  }

  function depthStone(ctx,cx,cy,rx,ry,lean,alpha,shape,warm){
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(cx,cy);
    ctx.rotate(lean);
    var g=ctx.createLinearGradient(-rx,-ry,rx,ry);
    if(warm){
      g.addColorStop(0,'#d2d6bd');
      g.addColorStop(.42,'#aeb9a7');
      g.addColorStop(1,'#73877e');
    }else{
      g.addColorStop(0,'#c5cfbd');
      g.addColorStop(.44,'#9ba99e');
      g.addColorStop(1,'#657c74');
    }
    ctx.fillStyle=g;
    stonePath(ctx,rx,ry,shape);
    ctx.fill();
    ctx.clip();

    var sun=ctx.createLinearGradient(-rx*.85,-ry*.8,rx*.2,ry*.1);
    sun.addColorStop(0,'rgba(255,240,188,.24)');
    sun.addColorStop(.55,'rgba(246,235,194,.06)');
    sun.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sun;
    ctx.beginPath();
    ctx.ellipse(-rx*.18,-ry*.22,rx*.70,ry*.42,-.12,0,TAU);
    ctx.fill();

    var under=ctx.createLinearGradient(0,0,0,ry);
    under.addColorStop(0,'rgba(32,58,53,0)');
    under.addColorStop(1,'rgba(28,52,48,.24)');
    ctx.fillStyle=under;
    ctx.fillRect(-rx,0,rx*2,ry);

    ctx.strokeStyle='rgba(50,78,69,.18)';
    ctx.lineWidth=.8;
    ctx.beginPath();
    ctx.moveTo(-rx*.44,-ry*.15);
    ctx.lineTo(-rx*.10,ry*.04);
    ctx.lineTo(rx*.26,-ry*.08);
    ctx.stroke();
    ctx.restore();
  }

  function groundContact(ctx,cx,water,rx,alpha){
    ctx.save();
    ctx.globalAlpha=alpha;
    var shadow=ctx.createRadialGradient(cx,water+1,0,cx,water+1,rx*1.08);
    shadow.addColorStop(0,'rgba(42,75,66,.26)');
    shadow.addColorStop(.58,'rgba(42,75,66,.13)');
    shadow.addColorStop(1,'rgba(42,75,66,0)');
    ctx.fillStyle=shadow;
    ctx.beginPath();
    ctx.ellipse(cx,water+2,rx*1.08,5.4,0,0,TAU);
    ctx.fill();
    ctx.strokeStyle='rgba(237,237,197,.13)';
    ctx.lineWidth=.8;
    ctx.beginPath();
    ctx.ellipse(cx,water+2.8,rx*.90,2.6,0,0,TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawRearGroundStones(ctx,g){
    var s=g.s;
    /* First two overlap Astra's right cliff edge. Since these are drawn BEFORE the
       cliff, the cliff masks their left sides and makes the depth physically clear. */
    var stones=[
      {x:g.x+110*s,y:g.water-14,rx:35*s,ry:26*s,l:-.08,a:.84,shape:'broad',warm:true},
      {x:g.x+139*s,y:g.water-19,rx:40*s,ry:30*s,l:.06,a:.90,shape:'rear',warm:false},
      {x:g.x+171*s,y:g.water-12,rx:34*s,ry:24*s,l:-.03,a:.88,shape:'low',warm:true},
      {x:g.x+200*s,y:g.water-9,rx:28*s,ry:20*s,l:.09,a:.82,shape:'rear',warm:false}
    ];
    for(var i=0;i<stones.length;i++){
      var st=stones[i];
      groundContact(ctx,st.x,g.water,st.rx,st.a*.92);
      depthStone(ctx,st.x,st.y,st.rx,st.ry,st.l,st.a,st.shape,st.warm);
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

  function lilyPadPath(ctx,r){
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,r,.20*Math.PI,1.88*Math.PI,false);
    ctx.closePath();
  }

  function waterRipple(ctx,x,y,rx,ry,alpha,time,phase){
    var breathe=reduced.matches ? 1 : .90+.10*Math.sin(time*.72+phase);
    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.strokeStyle='rgba(244,236,190,'+(alpha*breathe)+')';
    ctx.lineWidth=.78;
    ctx.beginPath();
    ctx.ellipse(x,y,rx,ry,0,0,TAU);
    ctx.stroke();
    ctx.strokeStyle='rgba(205,236,227,'+(alpha*.74*breathe)+')';
    ctx.lineWidth=.64;
    ctx.beginPath();
    ctx.ellipse(x,y+1.5,rx*1.28,ry*1.32,0,0,TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawPad(ctx,x,y,r,tilt,bob,alpha){
    ctx.save();
    ctx.globalAlpha=.25*alpha;
    ctx.fillStyle='rgba(54,96,84,.34)';
    ctx.beginPath();
    ctx.ellipse(x,y+3+bob,r*1.17,r*.18,tilt,0,TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(x,y+bob);
    ctx.rotate(tilt);
    ctx.scale(1,.30);
    ctx.globalAlpha=alpha;
    var pad=ctx.createRadialGradient(-r*.20,-r*.18,0,0,0,r);
    pad.addColorStop(0,'rgba(205,223,178,.98)');
    pad.addColorStop(.47,'rgba(142,179,128,.95)');
    pad.addColorStop(1,'rgba(69,111,88,.94)');
    ctx.fillStyle=pad;
    lilyPadPath(ctx,r);
    ctx.fill();
    ctx.strokeStyle='rgba(42,76,62,.40)';
    ctx.lineWidth=1.3;
    ctx.stroke();
    ctx.strokeStyle='rgba(246,232,177,.22)';
    ctx.lineWidth=.82;
    ctx.beginPath();
    ctx.moveTo(-r*.70,-r*.08);
    ctx.quadraticCurveTo(-r*.18,-r*.03,r*.45,-r*.17);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    var wash=ctx.createLinearGradient(0,y-1,0,y+8);
    wash.addColorStop(0,'rgba(183,222,216,0)');
    wash.addColorStop(.45,'rgba(168,213,207,.07)');
    wash.addColorStop(1,'rgba(145,199,192,.18)');
    ctx.fillStyle=wash;
    ctx.beginPath();
    ctx.ellipse(x,y+2+bob,r*1.02,r*.17,tilt,0,Math.PI);
    ctx.fill();
    ctx.restore();
  }

  function drawLilyFlower(ctx,x,y,s,bob){
    ctx.save();
    ctx.translate(x,y+bob);
    ctx.globalCompositeOperation='screen';
    var petals=[[-5,0,-.18],[5,0,.18],[0,-2.3,0],[-2.7,1.5,.42],[2.8,1.4,-.42]];
    ctx.fillStyle='rgba(255,246,218,.86)';
    for(var i=0;i<petals.length;i++){
      var p=petals[i];
      ctx.save();ctx.translate(p[0]*s,p[1]*s);ctx.rotate(p[2]);
      ctx.beginPath();ctx.ellipse(0,0,4.6*s,1.7*s,0,0,TAU);ctx.fill();ctx.restore();
    }
    ctx.fillStyle='rgba(244,209,116,.92)';
    ctx.beginPath();ctx.ellipse(0,.2*s,1.5*s,.8*s,0,0,TAU);ctx.fill();
    var glow=ctx.createRadialGradient(0,0,0,0,0,10*s);
    glow.addColorStop(0,'rgba(249,221,146,.24)');
    glow.addColorStop(1,'rgba(249,221,146,0)');
    ctx.fillStyle=glow;
    ctx.beginPath();ctx.ellipse(0,0,10*s,4*s,0,0,TAU);ctx.fill();
    ctx.restore();
  }

  function drawFrontLily(ctx,g,time){
    var s=g.s;
    var x=g.x+50*s;
    var y=g.water+55;
    var bob=reduced.matches ? 0 : Math.sin(time*.72+.45)*.45*s;
    var bob2=reduced.matches ? 0 : Math.sin(time*.66+1.35)*.32*s;
    waterRipple(ctx,x,y+1,32*s,5.4*s,.22,time,.4);
    waterRipple(ctx,x,y+1,40*s,6.6*s,.13,time,1.0);
    waterRipple(ctx,x,y+1,47*s,7.8*s,.075,time,1.55);
    waterRipple(ctx,x+29*s,y+5,23*s,4.2*s,.15,time,1.2);
    drawPad(ctx,x,y,27*s,-.11,bob,1);
    drawPad(ctx,x+29*s,y+6,17*s,.10,bob2,.92);
    drawLilyFlower(ctx,x+7*s,y-2,s,bob);
    ctx.save();
    ctx.globalCompositeOperation='screen';
    var sheen=ctx.createLinearGradient(x-30*s,0,x+48*s,0);
    sheen.addColorStop(0,'rgba(255,244,197,0)');
    sheen.addColorStop(.48,'rgba(255,244,197,.12)');
    sheen.addColorStop(1,'rgba(255,244,197,0)');
    ctx.strokeStyle=sheen;
    ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(x-27*s,y+5);ctx.quadraticCurveTo(x+5*s,y+3,x+45*s,y+7);ctx.stroke();
    ctx.restore();
  }

  function drawFrontDetails(ctx,g,time){
    contactSeam(ctx,g.x-61*g.s,g.top+23,18*g.s,-.14);
    contactSeam(ctx,g.x+72*g.s,g.top+17,17*g.s,.12);
    drawCliffPlant(ctx,g,time||0);
    drawFrontLily(ctx,g,time||0);
  }

  function install(){
    var pond=window.ZenPondRocks;
    if(!pond||typeof pond.draw!=='function'||pond.__cliffDetailV44)return false;
    var original=pond.draw;
    pond.draw=function(context,viewport,time){
      var g=geometry(viewport);
      if(document.body.dataset.kind==='meditation')drawRearGroundStones(context,g);
      original(context,viewport,time);
      if(document.body.dataset.kind==='meditation')drawFrontDetails(context,g,time||0);
    };
    pond.__cliffDetailV44=true;
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
