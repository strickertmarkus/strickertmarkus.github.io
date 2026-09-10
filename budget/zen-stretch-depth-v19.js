/* Zen Stretch v19: visibly stronger layered depth and a more organic cel-shaded hero tree. */
(function(){
  'use strict';
  var host=document.querySelector('.landscape');
  if(!host)return;
  var shade=host.querySelector('.landscape-shade');
  var canvas=document.createElement('canvas');
  canvas.className='zen-stretch-depth-v19';
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

  function bezier(points,color,lineWidth,alpha){
    ctx.save();
    ctx.globalAlpha=alpha==null?1:alpha;
    ctx.strokeStyle=color;
    ctx.lineWidth=lineWidth;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(points[0],points[1]);
    ctx.bezierCurveTo(points[2],points[3],points[4],points[5],points[6],points[7]);
    ctx.stroke();
    ctx.restore();
  }

  function leaf(x,y,len,w,angle,fill,alpha,vein){
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
    if(vein){
      ctx.strokeStyle=vein;
      ctx.lineWidth=.8;
      ctx.beginPath();
      ctx.moveTo(-len*.32,0);
      ctx.lineTo(len*.34,0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function glow(x,y,r,a){
    var g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba(238,255,183,'+a+')');
    g.addColorStop(.16,'rgba(207,248,130,'+(a*.74)+')');
    g.addColorStop(.48,'rgba(160,222,92,'+(a*.28)+')');
    g.addColorStop(1,'rgba(133,205,73,0)');
    ctx.fillStyle=g;
    ctx.fillRect(x-r,y-r,r*2,r*2);
  }

  function drawTree(time){
    var sway=reduced.matches?0:(Math.sin(time*.27)*5+Math.sin(time*.09+1.3)*2.5);
    ctx.save();
    ctx.translate(sway*.28,0);

    /* A new asymmetric silhouette covers most of the old cylindrical trunk. */
    ctx.fillStyle='#102b20';
    ctx.beginPath();
    ctx.moveTo(742,760);
    ctx.bezierCurveTo(785,727,803,684,811,632);
    ctx.bezierCurveTo(821,566,805,512,819,446);
    ctx.bezierCurveTo(827,402,831,356,854,305);
    ctx.bezierCurveTo(876,329,893,371,900,418);
    ctx.bezierCurveTo(910,486,899,548,919,610);
    ctx.bezierCurveTo(934,658,970,710,1015,747);
    ctx.bezierCurveTo(963,754,921,757,888,760);
    ctx.bezierCurveTo(843,754,799,754,742,760);
    ctx.closePath();
    ctx.fill();

    var bark=ctx.createLinearGradient(805,0,936,0);
    bark.addColorStop(0,'#1d3b27');
    bark.addColorStop(.27,'#355234');
    bark.addColorStop(.52,'#5c6d3d');
    bark.addColorStop(.70,'#435932');
    bark.addColorStop(1,'#173424');
    ctx.fillStyle=bark;
    ctx.beginPath();
    ctx.moveTo(772,744);
    ctx.bezierCurveTo(808,706,817,661,823,611);
    ctx.bezierCurveTo(831,551,818,505,829,449);
    ctx.bezierCurveTo(836,403,839,361,856,321);
    ctx.bezierCurveTo(873,351,884,389,889,429);
    ctx.bezierCurveTo(898,488,889,545,906,603);
    ctx.bezierCurveTo(919,649,944,698,986,736);
    ctx.bezierCurveTo(935,741,893,748,858,748);
    ctx.bezierCurveTo(830,747,802,744,772,744);
    ctx.closePath();
    ctx.fill();

    /* Broad cel-shaded planes are intentionally obvious on a phone display. */
    ctx.fillStyle='rgba(190,205,111,.16)';
    ctx.beginPath();
    ctx.moveTo(844,340);ctx.bezierCurveTo(867,389,858,466,869,531);ctx.bezierCurveTo(876,581,894,650,923,704);ctx.bezierCurveTo(900,682,881,644,867,593);ctx.bezierCurveTo(849,526,854,435,844,340);ctx.closePath();ctx.fill();

    ctx.fillStyle='rgba(6,25,18,.30)';
    ctx.beginPath();
    ctx.moveTo(808,639);ctx.bezierCurveTo(819,570,803,514,819,448);ctx.bezierCurveTo(827,407,833,367,850,326);ctx.bezierCurveTo(827,413,839,515,827,601);ctx.bezierCurveTo(820,653,800,699,772,738);ctx.closePath();ctx.fill();

    /* Major branches give the trunk a less generic Y-shape. */
    bezier([845,420,806,391,763,365,704,346],'#0e2b20',34,1);
    bezier([844,420,811,394,769,369,711,350],'#52663a',22,.92);
    bezier([882,438,927,401,969,366,1045,349],'#0d2a1f',31,1);
    bezier([881,438,925,405,966,374,1037,355],'#536b3d',19,.92);
    bezier([830,520,783,510,743,523,687,555],'#0e2d20',24,.96);
    bezier([830,520,785,512,747,526,693,556],'#4f6738',14,.90);
    bezier([906,552,949,542,995,554,1052,590],'#0d2b1f',25,.96);
    bezier([906,552,948,545,990,557,1046,590],'#4d6539',14,.88);

    /* Bark cuts, knots and contour highlights. */
    for(var i=0;i<14;i++){
      var yy=392+i*22;
      var side=Math.sin(i*1.67);
      bezier([842+side*12,yy,850+side*10,yy+6,838-side*8,yy+13,848+side*5,yy+21],i%4===0?'rgba(205,213,119,.31)':'rgba(7,31,21,.55)',i%4===0?1.5:2.6,1);
    }
    var knots=[[835,482,12,7,-.55],[878,547,14,8,.38],[842,615,10,6,-.18]];
    for(var k=0;k<knots.length;k++){
      var n=knots[k];
      ctx.save();ctx.translate(n[0],n[1]);ctx.rotate(n[4]);
      ctx.fillStyle='rgba(5,24,17,.72)';ctx.beginPath();ctx.ellipse(0,0,n[2],n[3],0,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(200,211,116,.30)';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(-1,-1,n[2]*.78,n[3]*.72,0,Math.PI*.9,TAU*1.02);ctx.stroke();
      ctx.restore();
    }

    /* Root flares anchor the trunk into the ground. */
    bezier([817,660,790,704,747,731,686,746],'#102b1f',18,1);
    bezier([840,676,820,712,787,740,742,753],'#56683a',8,.85);
    bezier([904,666,935,704,978,727,1030,741],'#102b1f',19,1);
    bezier([890,681,923,711,956,733,999,747],'#55693a',8,.82);

    ctx.restore();
  }

  function foliageCluster(cx,cy,scaleFactor,phase,time,depth){
    var move=reduced.matches?0:(Math.sin(time*(depth?0.32:0.46)+phase)*(depth?5:11));
    var colors=depth?['#173926','#20452b','#285032']:['#163b27','#23502f','#32643a','#487843','#5a884a'];
    for(var i=0;i<16;i++){
      var a=i/16*TAU+phase;
      var radius=(34+(i%5)*11)*scaleFactor;
      var x=cx+Math.cos(a)*radius+move;
      var y=cy+Math.sin(a)*radius*.55+Math.sin(i*1.3+phase)*9*scaleFactor;
      var len=(35+(i%4)*7)*scaleFactor;
      leaf(x,y,len,7.5*scaleFactor,a*.33+(i%2?-.22:.18),colors[i%colors.length],depth?.64:.88,depth?'rgba(180,209,135,.10)':'rgba(205,230,153,.18)');
    }
  }

  function drawLayers(time){
    /* Mid foliage around branch ends. */
    foliageCluster(705,346,1.06,.4,time,true);
    foliageCluster(1034,350,1.10,1.2,time,true);
    foliageCluster(690,557,.94,2.0,time,true);
    foliageCluster(1047,592,.96,2.7,time,true);

    /* Closer leaves intentionally cross the extreme edges but leave title centre clean. */
    ctx.save();ctx.filter='blur(1.8px)';
    foliageCluster(585,246,1.35,3.3,time,false);
    foliageCluster(1100,258,1.45,4.0,time,false);
    foliageCluster(575,695,1.38,4.7,time,false);
    foliageCluster(1090,705,1.48,5.3,time,false);
    ctx.restore();
  }

  var flies=[
    [615,245,.2,2.5],[670,326,.8,3.0],[733,232,1.5,2.4],[792,305,2.2,3.3],
    [914,258,2.9,2.7],[650,461,3.5,3.1],[716,552,4.1,2.6],[807,476,4.8,3.5],
    [889,586,5.3,2.9],[952,433,5.9,3.1],[645,688,1.9,3.2],[762,728,3.1,2.7],
    [850,682,4.4,3.4],[930,744,5.5,2.8]
  ];

  function drawFireflies(time){
    ctx.save();ctx.globalCompositeOperation='screen';
    for(var i=0;i<flies.length;i++){
      var f=flies[i];
      var pulse=.42+.58*Math.pow((Math.sin(time*.82+f[2])+1)/2,2);
      var x=f[0]+(reduced.matches?0:Math.sin(time*.24+f[2])*18);
      var y=f[1]+(reduced.matches?0:Math.cos(time*.19+f[2])*11);
      glow(x,y,31+f[3]*5,pulse*.58);
      ctx.fillStyle='rgba(242,255,187,'+Math.min(1,.72+pulse*.26)+')';
      ctx.beginPath();ctx.arc(x,y,f[3]*(.86+pulse*.24),0,TAU);ctx.fill();
    }
    ctx.restore();
  }

  function draw(time){
    prep();
    if(document.body.dataset.kind!=='stretch')return;
    drawTree(time);
    drawLayers(time);
    drawFireflies(time);
  }

  function resize(){
    var b=host.getBoundingClientRect();
    width=Math.max(1,b.width);height=Math.max(1,b.height);
    ratio=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(1500000/(width*height)));
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
