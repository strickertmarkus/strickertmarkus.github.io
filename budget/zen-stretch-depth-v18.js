/* Zen stretch v18: stronger layered depth, larger fireflies and stylized natural tree detail. */
(function(){
  'use strict';
  var host=document.querySelector('.landscape');
  if(!host)return;
  var shade=host.querySelector('.landscape-shade');
  var canvas=document.createElement('canvas');
  canvas.className='zen-stretch-depth-v18';
  if(shade)host.insertBefore(canvas,shade);else host.appendChild(canvas);
  var ctx=canvas.getContext('2d');
  if(!ctx)return;

  var W=1200,H=900,TAU=Math.PI*2;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;

  var clusters=[
    {x:585,y:205,side:1,alpha:.48,s:1.00,phase:.4,blur:.4},
    {x:935,y:188,side:-1,alpha:.57,s:1.16,phase:1.5,blur:.6},
    {x:580,y:505,side:1,alpha:.38,s:1.18,phase:2.8,blur:1.1},
    {x:952,y:525,side:-1,alpha:.48,s:1.30,phase:3.9,blur:1.2},
    {x:555,y:720,side:1,alpha:.28,s:1.38,phase:5.0,blur:2.0},
    {x:982,y:700,side:-1,alpha:.33,s:1.45,phase:5.8,blur:2.2}
  ];

  var fireflies=[
    [625,250,.1,1.7],[690,340,.8,2.2],[745,205,1.5,1.6],[812,292,2.1,2.5],
    [900,245,2.8,1.9],[655,465,3.4,2.4],[720,555,4.0,1.8],[805,475,4.7,2.7],
    [890,590,5.2,2.0],[930,420,5.8,2.3],[640,690,1.9,2.5],[760,735,3.1,1.9],
    [850,680,4.3,2.6],[915,760,5.5,2.1]
  ];

  function prep(){
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.translate(left,0);
    ctx.scale(scale,scale);
  }

  function curve(points,color,lineWidth){
    ctx.strokeStyle=color;
    ctx.lineWidth=lineWidth;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(points[0],points[1]);
    ctx.bezierCurveTo(points[2],points[3],points[4],points[5],points[6],points[7]);
    ctx.stroke();
  }

  function leaf(x,y,len,w,angle,color,alpha,vein){
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(x,y);
    ctx.rotate(angle);
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(-len*.50,0);
    ctx.quadraticCurveTo(-len*.08,-w,len*.52,0);
    ctx.quadraticCurveTo(-len*.05,w,-len*.50,0);
    ctx.fill();
    if(vein){
      ctx.strokeStyle=vein;
      ctx.lineWidth=.7;
      ctx.beginPath();
      ctx.moveTo(-len*.31,0);
      ctx.lineTo(len*.34,0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function glow(x,y,radius,alpha){
    var g=ctx.createRadialGradient(x,y,0,x,y,radius);
    g.addColorStop(0,'rgba(235,255,176,'+alpha+')');
    g.addColorStop(.18,'rgba(197,244,118,'+(alpha*.68)+')');
    g.addColorStop(.55,'rgba(151,218,84,'+(alpha*.20)+')');
    g.addColorStop(1,'rgba(137,210,74,0)');
    ctx.fillStyle=g;
    ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }

  function nearBranch(c,time){
    var breeze=reduced.matches?0:(Math.sin(time*.48+c.phase)*13+Math.sin(time*.15+c.phase*.7)*7);
    var rise=reduced.matches?0:Math.cos(time*.31+c.phase)*3;
    var endX=c.x+c.side*(140*c.s)+breeze;
    var endY=c.y+50*c.s+rise;

    ctx.save();
    ctx.filter='blur('+c.blur+'px)';
    ctx.globalAlpha=c.alpha;
    curve([c.x,c.y,c.x+c.side*42*c.s,c.y+7*c.s,c.x+c.side*92*c.s,c.y+30*c.s,endX,endY],'rgba(5,25,18,.96)',10*c.s);
    curve([c.x+c.side*2,c.y-2,c.x+c.side*44*c.s,c.y+7*c.s,c.x+c.side*94*c.s,c.y+27*c.s,endX,endY-3*c.s],'rgba(104,137,73,.46)',1.45*c.s);

    var greens=['#123524','#1b432a','#285532','#35633a','#477546','#5a844d'];
    for(var i=0;i<13;i++){
      var t=(i+1)/14;
      var bx=c.x+(endX-c.x)*t;
      var by=c.y+(endY-c.y)*t;
      var local=reduced.matches?0:Math.sin(time*.72+c.phase+i*.53)*7*c.s;
      var lift=Math.cos(i*1.41+c.phase)*17*c.s;
      leaf(
        bx+c.side*(18+Math.sin(i*1.93+c.phase)*20)*c.s+local,
        by-9*c.s+lift,
        (31+(i%4)*6)*c.s,
        (6.4+(i%3)*1.5)*c.s,
        c.side*(.16+Math.sin(i*.67)*.34)+local*.009,
        greens[i%greens.length],
        Math.min(.96,c.alpha+.25),
        'rgba(199,226,149,.18)'
      );
    }
    ctx.restore();
  }

  function treeDetails(time){
    var wind=reduced.matches?0:(Math.sin(time*.29)*.0045+Math.sin(time*.071+1.7)*.0032);
    ctx.save();
    ctx.translate(867,690);
    ctx.transform(1,0,wind,1,0,0);
    ctx.translate(-867,-690);

    /* Deep cel-shaded bark side: graphic but still organic. */
    curve([843,455,829,505,834,595,820,688],'rgba(5,24,18,.34)',15);
    curve([881,458,894,520,887,615,900,681],'rgba(153,177,96,.21)',7);
    curve([855,468,848,528,860,590,851,650],'rgba(117,143,76,.24)',3.2);
    curve([873,478,879,535,869,600,881,665],'rgba(29,60,38,.56)',4.3);

    /* Broken bark ridges avoid a smooth/cartoon cylinder. */
    for(var i=0;i<11;i++){
      var y=485+i*18;
      var wobble=Math.sin(i*1.8)*7;
      curve([846+wobble,y,852+wobble,y+5,845-wobble*.25,y+13,850+wobble*.15,y+20],i%3===0?'rgba(180,194,111,.26)':'rgba(12,43,29,.43)',i%3===0?1.3:2.0);
    }

    /* Knots with a dark core and light upper rim. */
    var knots=[[848,531,9,5,-.55],[879,584,11,6,.42],[854,625,7,4,-.20]];
    for(var k=0;k<knots.length;k++){
      var n=knots[k];
      ctx.save();ctx.translate(n[0],n[1]);ctx.rotate(n[4]);
      ctx.fillStyle='rgba(7,29,20,.48)';ctx.beginPath();ctx.ellipse(0,0,n[2],n[3],0,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(174,191,105,.28)';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(-1,-1,n[2]*.72,n[3]*.72,0,Math.PI,TAU);ctx.stroke();
      ctx.restore();
    }

    /* Root flare contouring makes the trunk feel planted rather than pasted. */
    curve([842,666,827,690,800,708,770,720],'rgba(6,29,20,.45)',7);
    curve([865,670,850,699,834,719,812,735],'rgba(82,112,61,.30)',3.2);
    curve([886,665,901,695,930,711,958,720],'rgba(13,43,28,.43)',7);
    curve([877,675,894,702,913,718,938,730],'rgba(142,163,85,.19)',2.2);

    ctx.restore();
  }

  function drawFireflies(time){
    ctx.save();
    ctx.globalCompositeOperation='screen';
    for(var i=0;i<fireflies.length;i++){
      var f=fireflies[i];
      var pulse=.48+.52*Math.pow((Math.sin(time*.72+f[2])+1)/2,2);
      var x=f[0]+(reduced.matches?0:Math.sin(time*.22+f[2])*15);
      var y=f[1]+(reduced.matches?0:Math.cos(time*.18+f[2])*9);
      var core=f[3];
      glow(x,y,25+core*5,pulse*.48);
      ctx.fillStyle='rgba(238,255,185,'+Math.min(.98,.66+pulse*.28)+')';
      ctx.beginPath();ctx.arc(x,y,core*(.88+pulse*.22),0,TAU);ctx.fill();
    }
    ctx.restore();
  }

  function draw(time){
    prep();
    if(document.body.dataset.kind!=='stretch')return;

    /* Mid plane. */
    for(var i=0;i<4;i++)nearBranch(clusters[i],time);

    /* Detail follows the same wind shear as the main v3 tree. */
    treeDetails(time);

    /* Near plane moves more and is softer at the edges. */
    for(var j=4;j<clusters.length;j++)nearBranch(clusters[j],time);

    /* Larger foreground fireflies reinforce depth without replacing the smaller v3 motes. */
    drawFireflies(time);
  }

  function resize(){
    var b=host.getBoundingClientRect();
    width=Math.max(1,b.width);height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(1450000/(width*height)));
    scale=Math.max(width/W,height/H);
    left=(width-W*scale)*(width<600?.69:.5);
    canvas.width=Math.round(width*ratio);
    canvas.height=Math.round(height*ratio);
    draw(reduced.matches?0:performance.now()/1000);
    wake();
  }

  function loop(now){
    frame=0;
    if(document.hidden||!visible||reduced.matches)return;
    if(now-last>=34){last=now;draw(now/1000);}
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
  reduced.addEventListener('change',wake);
  document.addEventListener('visibilitychange',wake);
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',wake);
  resize();
})();
