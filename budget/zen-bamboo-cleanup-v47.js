/* Zen v47 — remove only the unwanted underwater continuation of the x≈790 foreground bamboo.
   The exact pre-foreground pixels are captured after the pond/cliff/details render, then restored
   in a microtask after the scene has drawn its foreground bamboo. This preserves the cliff reflection,
   water motion and all objects underneath instead of painting a fake patch over the scene. */
(function(){
  'use strict';

  var scratch=document.createElement('canvas');
  var sctx=scratch.getContext('2d');
  if(!sctx)return;

  function install(){
    var pond=window.ZenPondRocks;
    if(!pond||typeof pond.draw!=='function'||pond.__underwaterBambooCleanupV47)return false;
    var original=pond.draw;

    pond.draw=function(context,viewport,time){
      original(context,viewport,time);
      if(document.body.dataset.kind!=='meditation')return;

      /* This is the single foreground stalk at x=790 in zen-meditation-scene-v34.js.
         Keep it above WATER=575, but preserve the already-rendered pond beneath it. */
      var m=context.getTransform();
      var x0=768,x1=808,y0=576,y1=900;
      var sx=Math.round(m.a*x0+m.e);
      var sy=Math.round(m.d*y0+m.f);
      var sw=Math.max(1,Math.round(m.a*(x1-x0)));
      var sh=Math.max(1,Math.round(m.d*(y1-y0)));
      var canvas=context.canvas;

      if(sx<0){sw+=sx;sx=0;}
      if(sy<0){sh+=sy;sy=0;}
      if(sx+sw>canvas.width)sw=canvas.width-sx;
      if(sy+sh>canvas.height)sh=canvas.height-sy;
      if(sw<=0||sh<=0)return;

      if(scratch.width!==sw||scratch.height!==sh){scratch.width=sw;scratch.height=sh;}
      sctx.setTransform(1,0,0,1,0,0);
      sctx.clearRect(0,0,sw,sh);
      sctx.drawImage(canvas,sx,sy,sw,sh,0,0,sw,sh);

      Promise.resolve().then(function(){
        if(document.body.dataset.kind!=='meditation')return;
        context.save();
        context.setTransform(1,0,0,1,0,0);
        context.globalCompositeOperation='source-over';
        context.globalAlpha=1;
        context.drawImage(scratch,0,0,sw,sh,sx,sy,sw,sh);
        context.restore();
      });
    };

    pond.__underwaterBambooCleanupV47=true;
    return true;
  }

  function attempt(){
    if(!install())return;
    window.removeEventListener('zen-pond-ready',attempt);
    window.setTimeout(function(){window.dispatchEvent(new Event('zen-pond-ready'));},0);
  }

  window.addEventListener('zen-pond-ready',attempt);
  attempt();
})();
