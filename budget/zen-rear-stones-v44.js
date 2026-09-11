/* Zen v44 — rear ground stones for Meditation.
   Drawn before the existing cliff renderer so the cliff naturally occludes them. */
(function(){
  'use strict';

  var WATER=575;
  var TAU=Math.PI*2;

  function geometry(viewport){
    var mobile=viewport.width<700;
    var cropRight=(viewport.width-viewport.left)/viewport.scale;
    var x=mobile ? Math.min(846,cropRight-118) : 936;
    return {x:x,s:mobile ? .64 : .76,water:WATER};
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
      if(i===0)ctx.moveTo(p[0]*rx,p[1]*ry);
      else ctx.lineTo(p[0]*rx,p[1]*ry);
    }
    ctx.closePath();
  }

  function drawStone(ctx,cx,cy,rx,ry,lean,alpha,shape,warm){
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
    sun.addColorStop(0,'rgba(255,240,188,.22)');
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

  function drawGroundContact(ctx,cx,water,rx,alpha){
    ctx.save();
    ctx.globalAlpha=alpha;

    var shadow=ctx.createRadialGradient(cx,water+1,0,cx,water+1,rx*1.08);
    shadow.addColorStop(0,'rgba(42,75,66,.24)');
    shadow.addColorStop(.58,'rgba(42,75,66,.12)');
    shadow.addColorStop(1,'rgba(42,75,66,0)');
    ctx.fillStyle=shadow;
    ctx.beginPath();
    ctx.ellipse(cx,water+2,rx*1.08,5.2,0,0,TAU);
    ctx.fill();

    ctx.strokeStyle='rgba(237,237,197,.13)';
    ctx.lineWidth=.8;
    ctx.beginPath();
    ctx.ellipse(cx,water+2.6,rx*.92,2.6,0,0,TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawRearStones(ctx,viewport){
    if(document.body.dataset.kind!=='meditation')return;
    var g=geometry(viewport);
    var s=g.s;

    // Cluster sits on the pond floor immediately behind the cliff's right edge.
    // The first two overlap the cliff silhouette and will therefore be occluded by it.
    var stones=[
      {x:g.x+111*s,y:g.water-13,rx:33*s,ry:24*s,l:-.08,a:.82,shape:'broad',warm:true},
      {x:g.x+137*s,y:g.water-17,rx:37*s,ry:27*s,l:.06,a:.88,shape:'rear',warm:false},
      {x:g.x+166*s,y:g.water-10,rx:31*s,ry:21*s,l:-.03,a:.86,shape:'low',warm:true},
      {x:g.x+191*s,y:g.water-8,rx:25*s,ry:18*s,l:.09,a:.78,shape:'rear',warm:false}
    ];

    for(var i=0;i<stones.length;i++){
      var st=stones[i];
      drawGroundContact(ctx,st.x,g.water,st.rx,st.a*.9);
      drawStone(ctx,st.x,st.y,st.rx,st.ry,st.l,st.a,st.shape,st.warm);
    }
  }

  function install(){
    var pond=window.ZenPondRocks;
    if(!pond||typeof pond.draw!=='function'||pond.__rearStonesV44)return false;
    var original=pond.draw;
    pond.draw=function(context,viewport,time){
      drawRearStones(context,viewport);
      original(context,viewport,time);
    };
    pond.__rearStonesV44=true;
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
