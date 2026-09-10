/* Zen v22: foreground depth + larger fireflies for the original Stretch tree. */
(function(){
  'use strict';
  var host=document.querySelector('.landscape');
  if(!host)return;
  var shade=host.querySelector('.landscape-shade');
  var canvas=document.createElement('canvas');
  canvas.className='zen-stretch-classic-effects-v22';
  if(shade)host.insertBefore(canvas,shade);else host.appendChild(canvas);
  var ctx=canvas.getContext('2d');
  if(!ctx)return;

  var W=1200,H=900,TAU=Math.PI*2;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;
  var flies=[
    [590,240,.2,2.7],[655,315,.9,3.1],[722,244,1.6,2.6],[790,322,2.1,3.5],
    [905,267,2.8,3.0],[635,465,3.4,3.2],[714,548,4.0,2.8],[806,482,4.7,3.5],
    [886,582,5.2,3.0],[958,430,5.8,3.3],[652,690,1.8,3.3],[760,724,3.0,2.8]
  ];

  function prep(){
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.translate(left,0);
    ctx.scale(scale,scale);
  }

  function glow(x,y,r,a){
    var g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba(245,255,198,'+a+')');
    g.addColorStop(.18,'rgba(215,249,142,'+(a*.74)+')');
    g.addColorStop(.50,'rgba(163,224,91,'+(a*.30)+')');
    g.addColorStop(1,'rgba(132,205,73,0)');
    ctx.fillStyle=g;
    ctx.fillRect(x-r,y-r,r*2,r*2);
  }

  function leaf(x,y,len,w,angle,fill,alpha){
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(x,y);
    ctx.rotate(angle);
    ctx.fillStyle=fill;
    ctx.beginPath();
    ctx.moveTo(-len*.52,0);
    ctx.quadraticCurveTo(-len*.12,-w,len*.54,0);
    ctx.quadraticCurveTo(-len*.06,w,-len*.52,0);
    ctx.fill();
    ctx.strokeStyle='rgba(204,229,151,.16)';
    ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(-len*.28,0);ctx.lineTo(len*.32,0);ctx.stroke();
    ctx.restore();
  }

  function drawForeground(time){
    var shiftA=reduced.matches?0:Math.sin(time*.34)*11;
    var shiftB=reduced.matches?0:Math.sin(time*.29+1.8)*13;
    var clusters=[
      [535,215,1.30,shiftA,-.20],[1090,245,1.42,shiftB,.24],
      [548,690,1.34,-shiftB,-.08],[1080,700,1.48,-shiftA,.16]
    ];
    var colors=['#153b27','#1c492c','#2a5933','#3b6a3b'];
    ctx.save();
    ctx.filter='blur(1.4px)';
    for(var c=0;c<clusters.length;c++){
      var cl=clusters[c];
      for(var i=0;i<15;i++){
        var a=i/15*TAU+cl[4];
        var radius=(35+(i%5)*12)*cl[2];
        var x=cl[0]+Math.cos(a)*radius+cl[3];
        var y=cl[1]+Math.sin(a)*radius*.52+Math.sin(i*1.2+c)*8;
        leaf(x,y,(34+(i%4)*8)*cl[2],7.4*cl[2],a*.34+(i%2?-.20:.18),colors[(i+c)%colors.length],.83);
      }
    }
    ctx.restore();
  }

  function drawFireflies(time){
    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var i=0;i<flies.length;i++){
      var f=flies[i];
      var pulse=.44+.56*Math.pow((Math.sin(time*.82+f[2])+1)/2,2);
      var x=f[0],y=f[1];
      if(!reduced.matches){
        x+=Math.sin(time*.24+f[2])*17;
        y+=Math.cos(time*.19+f[2])*10;
      }
      glow(x,y,31+f[3]*5.2,pulse*.58);
      ctx.fillStyle='rgba(247,255,198,'+Math.min(1,.72+pulse*.24)+')';
      ctx.beginPath();ctx.arc(x,y,f[3]*(.86+pulse*.22),0,TAU);ctx.fill();
    }
    ctx.restore();
  }

  function draw(time){
    prep();
    if(document.body.dataset.kind!=='stretch')return;
    drawForeground(time);
    drawFireflies(time);
  }

  function resize(){
    var b=host.getBoundingClientRect();
    width=Math.max(1,b.width);height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1200000/(width*height)));
    scale=Math.max(width/W,height/H);
    left=(width-W*scale)*(width<600?0.69:0.5);
    canvas.width=Math.round(width*ratio);
    canvas.height=Math.round(height*ratio);
    draw(reduced.matches?0:performance.now()/1000);
    wake();
  }

  function loop(now){
    frame=0;
    if(document.hidden||!visible||reduced.matches)return;
    if(now-last>=36){last=now;draw(now/1000);}
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
  new MutationObserver(function(){draw(reduced.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);
  if(reduced.addEventListener)reduced.addEventListener('change',wake);
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',wake);
  resize();
})();
