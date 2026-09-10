/* Zen v33 — preferred v30 upper stones, no backing monolith, pond-integrated waterfall. */
(function(){
  'use strict';

  var host=document.querySelector('.landscape');
  if(!host)return;
  var shade=host.querySelector('.landscape-shade');
  var canvas=document.createElement('canvas');
  canvas.className='zen-waterfall-v33';
  if(shade)host.insertBefore(canvas,shade);else host.appendChild(canvas);
  var ctx=canvas.getContext('2d');
  if(!ctx)return;

  var W=1200,H=900,WATER=575,TAU=Math.PI*2;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var width=1,height=1,ratio=1,scale=1,left=0,frame=0,last=-Infinity,visible=true;

  function prep(){
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.translate(left,0);
    ctx.scale(scale,scale);
  }

  function rockPath(rx,ry,shape){
    var forms={
      rear:[[-.98,.20],[-.90,-.22],[-.68,-.49],[-.55,-.83],[-.19,-.72],[.03,-.92],[.43,-.75],[.68,-.48],[.84,-.39],[.96,.09],[.71,.61],[.21,.79],[-.42,.68],[-.85,.45]],
      ledge:[[-.99,.15],[-.84,-.38],[-.50,-.58],[-.08,-.47],[.20,-.66],[.66,-.32],[.94,-.14],[.84,.31],[.45,.49],[-.16,.61],[-.71,.40]],
      flat:[[-.98,.10],[-.72,-.43],[-.24,-.36],[.13,-.61],[.57,-.39],[.91,-.15],[.83,.28],[.31,.43],[-.38,.54],[-.83,.30]],
      small:[[-.94,.19],[-.69,-.48],[-.12,-.63],[.29,-.80],[.76,-.37],[.94,.04],[.66,.47],[.11,.71],[-.54,.54]]
    };
    var pts=forms[shape]||forms.small;
    ctx.beginPath();
    for(var i=0;i<pts.length;i++){
      var p=pts[i];
      var next=pts[(i+1)%pts.length];
      var prev=pts[(i+pts.length-1)%pts.length];
      var bx=(p[0]*.88+prev[0]*.12)*rx;
      var by=(p[1]*.88+prev[1]*.12)*ry;
      if(i===0)ctx.moveTo(bx,by);else ctx.lineTo(bx,by);
      ctx.quadraticCurveTo(p[0]*rx,p[1]*ry,(p[0]*.88+next[0]*.12)*rx,(p[1]*.88+next[1]*.12)*ry);
    }
    ctx.closePath();
  }

  function rock(cx,cy,rx,ry,lean,kind,shape){
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(lean);
    var g=ctx.createLinearGradient(-rx*.92,-ry*.94,rx*.80,ry*.90);
    if(kind==='rear'){
      g.addColorStop(0,'#d4dbc8');
      g.addColorStop(.28,'#b4c2b2');
      g.addColorStop(.66,'#7b9087');
      g.addColorStop(1,'#566f68');
    }else if(kind==='front'){
      g.addColorStop(0,'#bac7b5');
      g.addColorStop(.30,'#93a59a');
      g.addColorStop(.68,'#647b73');
      g.addColorStop(1,'#455f59');
    }else{
      g.addColorStop(0,'#c5d0bd');
      g.addColorStop(.31,'#9cad9f');
      g.addColorStop(.69,'#70867c');
      g.addColorStop(1,'#4f6962');
    }
    ctx.fillStyle=g;
    rockPath(rx,ry,shape);
    ctx.fill();
    ctx.clip();

    var sun=ctx.createLinearGradient(-rx*.90,-ry*.86,rx*.10,-ry*.02);
    if(kind==='rear')sun.addColorStop(0,'rgba(255,240,189,.30)');
    else sun.addColorStop(0,'rgba(248,236,193,.17)');
    sun.addColorStop(.52,'rgba(248,233,185,.07)');
    sun.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sun;
    ctx.beginPath();
    ctx.ellipse(-rx*.16,-ry*.24,rx*.76,ry*.49,-.14,0,TAU);
    ctx.fill();

    var under=ctx.createLinearGradient(0,-ry*.05,0,ry);
    under.addColorStop(0,'rgba(25,52,49,0)');
    under.addColorStop(.62,'rgba(24,51,48,.08)');
    under.addColorStop(1,'rgba(18,42,40,.28)');
    ctx.fillStyle=under;
    ctx.fillRect(-rx,-ry*.05,rx*2,ry*1.05);

    ctx.fillStyle='rgba(28,56,52,.07)';
    ctx.beginPath();
    ctx.moveTo(-rx*.78,ry*.10);
    ctx.lineTo(-rx*.19,-ry*.48);
    ctx.lineTo(rx*.27,-ry*.14);
    ctx.lineTo(rx*.75,ry*.22);
    ctx.lineTo(rx*.18,ry*.51);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle='rgba(241,239,196,.24)';
    ctx.lineWidth=.8;
    ctx.beginPath();
    ctx.moveTo(-rx*.72,-ry*.34);
    ctx.lineTo(-rx*.49,-ry*.56);
    ctx.lineTo(-rx*.14,-ry*.45);
    ctx.stroke();
    ctx.restore();
  }

  function rockLines(cx,cy,rx,ry,lean,shape,time,phase,warm){
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(lean);
    rockPath(rx,ry,shape);
    ctx.clip();
    ctx.globalCompositeOperation='screen';
    var move=0;
    var pulse=.78;
    if(!reduced.matches){
      move=Math.sin(time*.66+phase)*2.0+Math.sin(time*.31+phase*1.7)*.85;
      pulse=.68+.18*(Math.sin(time*.82+phase)+1)*.5;
    }
    for(var i=0;i<3;i++){
      var y=-ry*.28+i*ry*.23;
      var x1=-rx*.56+i*rx*.05;
      var x2=rx*.40-i*rx*.04;
      var base=warm?.18:.14;
      var alpha=(base-i*.017)*pulse;
      ctx.strokeStyle=warm?'rgba(255,243,196,'+alpha+')':'rgba(222,244,237,'+alpha+')';
      ctx.lineWidth=.82;
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(x1,y+move*.14);
      ctx.bezierCurveTo(-rx*.22,y-ry*.16+move,rx*.08,y-ry*.10-move*.30,x2,y-ry*.04);
      ctx.stroke();
    }
    ctx.restore();
  }

  function geometry(){
    var mobile=width<700;
    var cropRight=(width-left)/scale;
    var x=mobile?Math.min(846,cropRight-118):936;
    return {mobile:mobile,s:mobile?.64:.76,x:x,crest:443,lip:500,water:WATER};
  }

  function drawFormation(g,time){
    var s=g.s;
    var x=g.x;

    /* Reuse the preferred v30 upper-stone language only; no backing monolith. */
    var rear={x:x+19*s,y:g.crest+35*s,rx:86*s,ry:61*s,l:-.075,shape:'rear'};
    var left={x:x-51*s,y:g.crest+67*s,rx:32*s,ry:21*s,l:-.13,shape:'flat'};
    var right={x:x+93*s,y:g.crest+64*s,rx:33*s,ry:24*s,l:.11,shape:'small'};
    rock(rear.x,rear.y,rear.rx,rear.ry,rear.l,'rear',rear.shape);
    rock(left.x,left.y,left.rx,left.ry,left.l,'small',left.shape);
    rock(right.x,right.y,right.rx,right.ry,right.l,'small',right.shape);
    rockLines(rear.x,rear.y,rear.rx,rear.ry,rear.l,rear.shape,time,.2,true);
    rockLines(left.x,left.y,left.rx,left.ry,left.l,left.shape,time,1.8,true);
    rockLines(right.x,right.y,right.rx,right.ry,right.l,right.shape,time,2.7,false);

    /* A shallow channel between the upper stones. */
    var holeX=x-3*s;
    var holeY=g.crest+67*s;
    var cavity=ctx.createRadialGradient(holeX-4*s,holeY-4*s,2,holeX,holeY,22*s);
    cavity.addColorStop(0,'rgba(29,56,52,.78)');
    cavity.addColorStop(.50,'rgba(42,70,64,.60)');
    cavity.addColorStop(.82,'rgba(75,101,89,.28)');
    cavity.addColorStop(1,'rgba(100,124,109,0)');
    ctx.fillStyle=cavity;
    ctx.beginPath();
    ctx.ellipse(holeX,holeY,25*s,13*s,-.03,0,TAU);
    ctx.fill();

    /* Water visibly travels across the stone surface before it falls. */
    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.lineCap='round';
    for(var i=0;i<7;i++){
      var off=(i-3)*2.1*s;
      var wobble=reduced.matches?0:Math.sin(time*.80+i*.82)*1.2*s;
      ctx.strokeStyle='rgba(226,245,232,'+(0.11+(3-Math.abs(i-3))*.022)+')';
      ctx.lineWidth=(i===3?1.45:.82)*s;
      ctx.beginPath();
      ctx.moveTo(x-55*s,g.crest+17*s+off);
      ctx.bezierCurveTo(x-34*s,g.crest+14*s+off+wobble,x-16*s,g.crest+42*s+off,holeX-6*s,holeY-4*s+off*.22);
      ctx.stroke();
    }
    ctx.restore();

    /* Front lip stones sit on the ledge and mask the water source. */
    var lipLeft={x:holeX-35*s,y:holeY+19*s,rx:31*s,ry:22*s,l:-.10,shape:'ledge'};
    var lipRight={x:holeX+39*s,y:holeY+21*s,rx:36*s,ry:24*s,l:.08,shape:'ledge'};

    /* Falling sheet first, then front stones mask its top edge. */
    drawWater(holeX,holeY+5*s,g.water,s,time,g.mobile);

    rock(lipLeft.x,lipLeft.y,lipLeft.rx,lipLeft.ry,lipLeft.l,'front',lipLeft.shape);
    rock(lipRight.x,lipRight.y,lipRight.rx,lipRight.ry,lipRight.l,'front',lipRight.shape);
    rockLines(lipLeft.x,lipLeft.y,lipLeft.rx,lipLeft.ry,lipLeft.l,lipLeft.shape,time,1.1,false);
    rockLines(lipRight.x,lipRight.y,lipRight.rx,lipRight.ry,lipRight.l,lipRight.shape,time,2.0,false);

    /* Small stone feet touch the waterline so the group is grounded. */
    rock(x-60*s,g.water-5*s,27*s,14*s,-.08,'small','flat');
    rock(x+73*s,g.water-6*s,30*s,15*s,.07,'small','flat');

    /* Waterline cuts across the lower stone feet, making them emerge from the pond. */
    var wash=ctx.createLinearGradient(0,g.water-8,0,g.water+28);
    wash.addColorStop(0,'rgba(169,209,199,0)');
    wash.addColorStop(.34,'rgba(180,219,208,.19)');
    wash.addColorStop(1,'rgba(153,204,198,.34)');
    ctx.fillStyle=wash;
    ctx.fillRect(x-125*s,g.water-8,250*s,36);

    drawImpact(holeX,g.water,s,time);
  }

  function drawWater(x,startY,waterY,s,time,mobile){
    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.lineCap='round';
    var count=mobile?13:16;
    for(var i=0;i<count;i++){
      var t=count===1?.5:i/(count-1);
      var sx=x-14*s+t*28*s;
      var ex=x-25*s+t*50*s;
      var sway=reduced.matches?0:Math.sin(time*.96+i*.61)*(1.3+(i%4)*.18)*s;
      var center=1-Math.abs(t-.5)*2;
      ctx.strokeStyle='rgba(215,240,233,'+(0.075+center*.095)+')';
      ctx.lineWidth=(.50+center*.55)*s;
      ctx.beginPath();
      ctx.moveTo(sx,startY);
      ctx.bezierCurveTo(sx+1*s,startY+10*s,ex+sway,waterY-34*s,ex+sway*.22,waterY-2*s);
      ctx.stroke();
    }
    for(var c=0;c<3;c++){
      var ct=.28+c*.22;
      var csx=x-14*s+ct*28*s;
      var cex=x-25*s+ct*50*s;
      ctx.strokeStyle=c===1?'rgba(250,252,237,.39)':'rgba(241,249,235,.29)';
      ctx.lineWidth=(c===1?1.65:1.25)*s;
      ctx.beginPath();
      ctx.moveTo(csx,startY);
      ctx.bezierCurveTo(csx,startY+12*s,cex,waterY-32*s,cex,waterY-2*s);
      ctx.stroke();
    }
    if(!reduced.matches){
      for(var d=0;d<8;d++){
        var p=(time*.52+d*.117)%1;
        var side=d%2===0?-1:1;
        var dx=x+side*(3+d*.8)*s*p;
        var dy=startY+(waterY-startY)*p;
        ctx.fillStyle='rgba(255,248,211,'+(.10+(1-p)*.18)+')';
        ctx.beginPath();
        ctx.ellipse(dx,dy,.68*s,1.9*s,0,0,TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawImpact(x,waterY,s,time){
    ctx.save();
    ctx.globalCompositeOperation='screen';
    var mist=ctx.createRadialGradient(x,waterY,0,x,waterY,49*s);
    mist.addColorStop(0,'rgba(255,248,211,.25)');
    mist.addColorStop(.42,'rgba(229,246,236,.11)');
    mist.addColorStop(1,'rgba(229,246,236,0)');
    ctx.fillStyle=mist;
    ctx.fillRect(x-58*s,waterY-30*s,116*s,60*s);

    for(var r=0;r<5;r++){
      var p=reduced.matches?.34:((time*.22+r*.19)%1);
      var inner=r<2;
      var reach=inner?43:65;
      var alpha=(1-p)*(inner?.31:.13);
      ctx.strokeStyle='rgba(255,244,198,'+alpha+')';
      ctx.lineWidth=inner?1.05:.70;
      ctx.beginPath();
      ctx.ellipse(x,waterY+3*s,7+p*reach*s,2+p*(inner?7:10)*s,0,0,TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function maskBamboo(){
    /* The underlying Meditation scene already contains all bamboo. Punch narrow holes
       through this overlay so every stalk stays consistently in front of the rocks/water. */
    var stems=[585,630,675,720,770,815,860,905,950,995,1040,1090,1140,1185,650,735,825,915,1005,1095,1180];
    ctx.save();
    ctx.globalCompositeOperation='destination-out';
    for(var i=0;i<stems.length;i++){
      var x=stems[i];
      if(x<760||x>1150)continue;
      ctx.fillStyle='rgba(0,0,0,1)';
      ctx.fillRect(x-10,335,20,285);
    }
    ctx.restore();
  }

  function addMeditationSymbol(){
    var button=document.getElementById('start-button');
    if(!button)return;
    if(button.querySelector('.start-ring-symbol'))return;
    var symbol=document.createElement('span');
    symbol.className='start-ring-symbol';
    symbol.setAttribute('aria-hidden','true');
    symbol.textContent='≈';
    var name=button.querySelector('.start-ring-name');
    if(name)button.insertBefore(symbol,name);else button.appendChild(symbol);
  }

  function draw(time){
    prep();
    if(document.body.dataset.kind!=='meditation')return;
    var g=geometry();
    drawFormation(g,time);
    maskBamboo();
  }

  function resize(){
    var box=host.getBoundingClientRect();
    width=Math.max(1,box.width);
    height=Math.max(1,box.height);
    ratio=Math.min(window.devicePixelRatio||1,1.45,Math.sqrt(1180000/(width*height)));
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
  new MutationObserver(function(){addMeditationSymbol();draw(reduced.matches?0:performance.now()/1000);wake();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  document.addEventListener('visibilitychange',wake);
  if(reduced.addEventListener)reduced.addEventListener('change',wake);
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',function(){addMeditationSymbol();wake();});
  addMeditationSymbol();
  resize();
})();
