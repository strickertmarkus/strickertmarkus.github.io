/* Zen v45 — harden Meditation depth ordering without changing Astra's waterfall.
   Loaded after zen-waterfall-v34.js and before zen-cliff-detail-v39.js so final order is:
   rear stones -> opaque cliff mask -> cliff/waterfall -> foreground bamboo occluders -> plant/lily. */
(function(){
  'use strict';

  var WATER=575;
  var TAU=Math.PI*2;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');

  function geometry(viewport){
    var mobile=viewport.width<700;
    var cropRight=(viewport.width-viewport.left)/viewport.scale;
    var x=mobile ? Math.min(846,cropRight-118) : 936;
    return {x:x,s:mobile ? .64 : .76,top:430,water:WATER,mobile:mobile};
  }

  /* Same outer silhouette as Astra's v43/v38 cliff body. This pass is intentionally
     fully opaque and sits BEHIND the real cliff artwork. Its only job is to prevent
     rear stones/background from ever showing through the cliff mass. */
  function drawOpaqueCliffMask(ctx,g){
    var s=g.s,x=g.x,top=g.top,base=g.water;
    ctx.save();
    ctx.globalAlpha=1;
    ctx.globalCompositeOperation='source-over';
    ctx.beginPath();
    ctx.moveTo(x-109*s,base+12);
    ctx.lineTo(x-106*s,top+88);
    ctx.lineTo(x-89*s,top+63);
    ctx.lineTo(x-85*s,top+28);
    ctx.lineTo(x-64*s,top+9);
    ctx.lineTo(x-38*s,top+15);
    ctx.lineTo(x-19*s,top+3);
    ctx.lineTo(x+16*s,top+13);
    ctx.lineTo(x+42*s,top+8);
    ctx.lineTo(x+62*s,top-6);
    ctx.lineTo(x+83*s,top+1);
    ctx.lineTo(x+101*s,top+24);
    ctx.lineTo(x+98*s,top+52);
    ctx.lineTo(x+116*s,top+75);
    ctx.lineTo(x+108*s,base-21);
    ctx.lineTo(x+120*s,base+12);
    ctx.closePath();

    var face=ctx.createLinearGradient(x-90*s,top,x+90*s,base);
    face.addColorStop(0,'#c1ccb7');
    face.addColorStop(.31,'#a5b6a6');
    face.addColorStop(.66,'#7c9789');
    face.addColorStop(1,'#587a70');
    ctx.fillStyle=face;
    ctx.fill();
    ctx.restore();
  }

  function stalkSway(stalk,time,mobile){
    if(reduced.matches)return 0;
    var phase=stalk[3];
    var boost=mobile ? 1.30 : 1;
    return (Math.sin(time*.50+phase)*9+Math.sin(time*.19+phase*1.7)*4)*boost;
  }

  /* Two stems at x≈950/995 belong visually in front of the new rear-stone bank,
     although the base scene classifies those coordinates as distant bamboo. Redraw
     ONLY the rock-zone slice after the cliff; this creates real bamboo occlusion
     without doubling/darkening the full-height stems elsewhere. */
  function drawForegroundBambooOccluders(ctx,viewport,time){
    var g=geometry(viewport);
    var stalks=[
      [950,5,-13,5.1,.78],
      [995,7,19,5.7,.82]
    ];
    var baseY=975,topY=-145,total=baseY-topY;

    ctx.save();
    ctx.beginPath();
    ctx.rect(875,392,180,245);
    ctx.clip();

    for(var n=0;n<stalks.length;n++){
      var st=stalks[n];
      var x=st[0],w=st[1],lean=st[2],phase=st[3],alpha=st[4];
      var topX=x+lean+stalkSway(st,time,g.mobile);

      var grad=ctx.createLinearGradient(x-w,0,x+w,0);
      grad.addColorStop(0,'rgba(42,84,70,'+(alpha*.86)+')');
      grad.addColorStop(.38,'rgba(116,159,122,'+alpha+')');
      grad.addColorStop(.60,'rgba(190,199,143,'+(alpha*.88)+')');
      grad.addColorStop(1,'rgba(49,93,74,'+(alpha*.90)+')');

      ctx.strokeStyle=grad;
      ctx.lineWidth=w;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(x,baseY);
      ctx.lineTo(topX,topY);
      ctx.stroke();

      /* Warm sun edge, matching the live meditation renderer. */
      var sunSide=topX<805?1:-1;
      ctx.strokeStyle='rgba(252,233,173,'+(alpha*.34)+')';
      ctx.lineWidth=Math.max(.6,w*.08);
      ctx.beginPath();
      ctx.moveTo(x+sunSide*w*.26,baseY);
      ctx.lineTo(topX+sunSide*w*.26,topY);
      ctx.stroke();

      /* Bamboo nodes only inside the clipped rock zone. */
      for(var j=4;j<=10;j++){
        var t=(j+.12*Math.sin(j*2.31+phase*3.7))/14;
        var y=baseY-total*t;
        if(y<392||y>637)continue;
        var nx=x+(topX-x)*t;
        var nw=w*(1-t*.30);
        ctx.strokeStyle='rgba(49,82,65,'+(alpha*.72)+')';
        ctx.lineWidth=Math.max(.9,nw*.12);
        ctx.beginPath();
        ctx.moveTo(nx-nw*.56,y);
        ctx.lineTo(nx+nw*.56,y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function install(){
    var pond=window.ZenPondRocks;
    if(!pond||typeof pond.draw!=='function'||pond.__opaqueCliffBambooV45)return false;
    var original=pond.draw;
    pond.draw=function(context,viewport,time){
      if(document.body.dataset.kind==='meditation'){
        var g=geometry(viewport);
        drawOpaqueCliffMask(context,g);
      }
      original(context,viewport,time);
      if(document.body.dataset.kind==='meditation'){
        drawForegroundBambooOccluders(context,viewport,time||0);
      }
    };
    pond.__opaqueCliffBambooV45=true;
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
