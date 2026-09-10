/* Zen Stretch v20 active renderer: layered depth, larger fireflies and a naturally branching cel-shaded hero tree. */
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
    var sway=0;
    if(!reduced.matches)sway=Math.sin(time*.27)*5+Math.sin(time*.09+1.3)*2.5;
    ctx.save();
    ctx.translate(sway*.28,0);

    /* Structural limbs are drawn first. Their bases are covered by the trunk,
       so they read as growing out of the wood rather than sitting on top. */
    bezier([846,432,808,392,759,363,698,346],'#0b271d',43,1);
    bezier([846,432,812,396,766,369,705,351],'#50663a',27,.95);
    bezier([874,423,911,382,951,343,1009,306],'#0b271d',41,1);
    bezier([874,423,909,386,948,350,1004,313],'#52693c',25,.94);
    bezier([856,401,847,359,836,315,817,260],'#0a281d',46,1);
    bezier([856,401,849,361,839,319,822,266],'#566c3e',28,.94);
    bezier([881,452,930,425,980,405,1048,402],'#0c2a1f',31,.98);
    bezier([881,452,929,428,978,411,1042,407],'#4f663a',18,.90);
    bezier([826,514,781,508,735,523,681,556],'#0d2b20',28,.98);
    bezier([826,514,783,512,741,527,688,557],'#4e6538',16,.90);
    bezier([904,555,948,545,994,557,1050,591],'#0d2a1f',29,.98);
    bezier([904,555,947,548,989,560,1044,590],'#4c6438',16,.89);

    /* Main trunk: broad, irregular shoulders with no pointed cut-off. */
    ctx.fillStyle='#102b20';
    ctx.beginPath();
    ctx.moveTo(738,762);
    ctx.bezierCurveTo(781,728,801,683,810,632);
    ctx.bezierCurveTo(821,571,808,521,820,466);
    ctx.bezierCurveTo(829,425,834,399,842,378);
    ctx.bezierCurveTo(850,395,863,407,878,420);
    ctx.bezierCurveTo(893,446,895,491,902,531);
    ctx.bezierCurveTo(909,577,917,622,933,661);
    ctx.bezierCurveTo(951,704,981,736,1016,751);
    ctx.bezierCurveTo(965,756,923,760,886,760);
    ctx.bezierCurveTo(839,757,791,757,738,762);
    ctx.closePath();
    ctx.fill();

    var bark=ctx.createLinearGradient(795,0,945,0);
    bark.addColorStop(0,'#1d3c28');
    bark.addColorStop(.24,'#344f33');
    bark.addColorStop(.47,'#61713f');
    bark.addColorStop(.68,'#465c34');
    bark.addColorStop(1,'#173525');
    ctx.fillStyle=bark;
    ctx.beginPath();
    ctx.moveTo(772,746);
    ctx.bezierCurveTo(808,709,818,663,824,613);
    ctx.bezierCurveTo(832,557,821,511,830,468);
    ctx.bezierCurveTo(837,431,841,409,847,392);
    ctx.bezierCurveTo(856,407,865,416,875,425);
    ctx.bezierCurveTo(886,451,886,493,893,534);
    ctx.bezierCurveTo(900,580,907,623,921,659);
    ctx.bezierCurveTo(937,699,958,725,986,740);
    ctx.bezierCurveTo(938,745,897,749,860,749);
    ctx.bezierCurveTo(829,749,801,746,772,746);
    ctx.closePath();
    ctx.fill();

    /* Rounded branch collars visually weld each limb into the trunk. */
    var collars=[
      [844,428,39,27,-.45],[874,423,35,25,.48],[824,514,31,23,-.20],[902,553,30,22,.18]
    ];
    for(var c=0;c<collars.length;c++){
      var col=collars[c];
      ctx.save();ctx.translate(col[0],col[1]);ctx.rotate(col[4]);
      ctx.fillStyle='rgba(64,86,48,.96)';
      ctx.beginPath();ctx.ellipse(0,0,col[2],col[3],0,0,TAU);ctx.fill();
      ctx.fillStyle='rgba(126,145,75,.18)';
      ctx.beginPath();ctx.ellipse(-5,-5,col[2]*.63,col[3]*.50,0,0,TAU);ctx.fill();
      ctx.restore();
    }

    /* Broad cel-shaded planes keep the trunk readable at phone scale. */
    ctx.fillStyle='rgba(195,208,113,.19)';
    ctx.beginPath();
    ctx.moveTo(848,405);ctx.bezierCurveTo(867,443,857,506,868,566);ctx.bezierCurveTo(877,617,894,662,921,704);ctx.bezierCurveTo(898,683,880,647,867,602);ctx.bezierCurveTo(851,544,855,469,848,405);ctx.closePath();ctx.fill();

    ctx.fillStyle='rgba(6,25,18,.35)';
    ctx.beginPath();
    ctx.moveTo(808,640);ctx.bezierCurveTo(819,575,807,523,820,466);ctx.bezierCurveTo(828,432,834,407,843,386);ctx.bezierCurveTo(827,451,835,528,827,601);ctx.bezierCurveTo(820,654,801,701,772,739);ctx.closePath();ctx.fill();

    /* Bark channels continue through the branch-junction area rather than
       stopping at an artificial top. */
    for(var i=0;i<14;i++){
      var yy=405+i*22;
      var side=Math.sin(i*1.67);
      var light=i%4===0;
      bezier(
        [842+side*12,yy,850+side*10,yy+6,838-side*8,yy+13,848+side*5,yy+21],
        light?'rgba(205,213,119,.34)':'rgba(7,31,21,.60)',
        light?1.7:2.8,
        1
      );
    }

    var knots=[[835,482,12,7,-.55],[878,547,14,8,.38],[842,615,10,6,-.18]];
    for(var k=0;k<knots.length;k++){
      var n=knots[k];
      ctx.save();ctx.translate(n[0],n[1]);ctx.rotate(n[4]);
      ctx.fillStyle='rgba(5,24,17,.76)';ctx.beginPath();ctx.ellipse(0,0,n[2],n[3],0,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(200,211,116,.34)';ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(-1,-1,n[2]*.78,n[3]*.72,0,Math.PI*.9,TAU*1.02);ctx.stroke();
      ctx.restore();
    }

    bezier([817,660,790,704,747,731,686,746],'#102b1f',20,1);
    bezier([840,676,820,712,787,740,742,753],'#56683a',9,.88);
    bezier([904,666,935,704,978,727,1030,741],'#102b1f',21,1);
    bezier([890,681,923,711,956,733,999,747],'#55693a',9,.86);

    ctx.restore();
  }

  function foliageCluster(cx,cy,scaleFactor,phase,time,depth){
    var speed=depth?0.32:0.46;
    var range=depth?5:12;
    var move=0;
    if(!reduced.matches)move=Math.sin(time*speed+phase)*range;
    var colors=depth?['#173926','#20452b','#285032']:['#163b27','#23502f','#32643a','#487843','#5a884a'];
    var alpha=depth?.68:.92;
    var vein=depth?'rgba(180,209,135,.11)':'rgba(205,230,153,.20)';
    for(var i=0;i<16;i++){
      var a=i/16*TAU+phase;
      var radius=(34+(i%5)*11)*scaleFactor;
      var x=cx+Math.cos(a)*radius+move;
      var y=cy+Math.sin(a)*radius*.55+Math.sin(i*1.3+phase)*9*scaleFactor;
      var len=(35+(i%4)*7)*scaleFactor;
      leaf(x,y,len,7.5*scaleFactor,a*.33+(i%2?-.22:.18),colors[i%colors.length],alpha,vein);
    }
  }

  function drawLayers(time){
    /* Crown clusters now sit on the three visible leaders, hiding branch ends
       and making the trunk flow naturally into foliage. */
    foliageCluster(698,346,1.12,.4,time,true);
    foliageCluster(818,260,1.14,.9,time,true);
    foliageCluster(1008,307,1.16,1.25,time,true);
    foliageCluster(684,558,.98,2.0,time,true);
    foliageCluster(1047,592,1.00,2.7,time,true);

    ctx.save();ctx.filter='blur(1.6px)';
    foliageCluster(575,238,1.43,3.3,time,false);
    foliageCluster(1092,245,1.54,4.0,time,false);
    foliageCluster(566,695,1.46,4.7,time,false);
    foliageCluster(1090,705,1.56,5.3,time,false);
    ctx.restore();
  }

  var flies=[
    [615,245,.2,2.8],[670,326,.8,3.3],[733,232,1.5,2.7],[792,305,2.2,3.6],
    [914,258,2.9,3.0],[650,461,3.5,3.4],[716,552,4.1,2.9],[807,476,4.8,3.8],
    [889,586,5.3,3.2],[952,433,5.9,3.4],[645,688,1.9,3.5],[762,728,3.1,3.0],
    [850,682,4.4,3.7],[930,744,5.5,3.1]
  ];

  function drawFireflies(time){
    ctx.save();ctx.globalCompositeOperation='screen';
    for(var i=0;i<flies.length;i++){
      var f=flies[i];
      var pulse=.42+.58*Math.pow((Math.sin(time*.82+f[2])+1)/2,2);
      var x=f[0];
      var y=f[1];
      if(!reduced.matches){
        x+=Math.sin(time*.24+f[2])*18;
        y+=Math.cos(time*.19+f[2])*11;
      }
      glow(x,y,34+f[3]*5.5,pulse*.64);
      ctx.fillStyle='rgba(244,255,190,'+Math.min(1,.76+pulse*.23)+')';
      ctx.beginPath();ctx.arc(x,y,f[3]*(.90+pulse*.24),0,TAU);ctx.fill();
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
