/* Zen v35 polish — continuous pond stones and a short cascade, drawn before foreground bamboo. */
(function(){
  'use strict';

  // Draw within the meditation scene, before its real foreground bamboo.
  // No transparent cut-outs and no independently transformed overlay.
  var ctx,width=1,left=0,scale=1;
  var WATER=575,TAU=Math.PI*2;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');

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
      g.addColorStop(.66,'#97aba0');
      g.addColorStop(1,'#7f988d');
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
    for(var i=0;i<2;i++){
      var y=-ry*.31+i*ry*.29;
      var x1=-rx*.56+i*rx*.05;
      var x2=rx*(i===0 ? .18 : .37);
      var base=warm ? .095 : .08;
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
    var x=mobile ? Math.min(846,cropRight-118) : 936;
    return {mobile:mobile,s:mobile ? .64 : .76,x:x,crest:477,lip:520,water:WATER};
  }

  function drawFormation(g,time){
    var s=g.s;
    var x=g.x;

    // A soft, local contact shadow anchors the feet in the water.
    ctx.save();ctx.translate(x+15*s,g.water+2*s);ctx.scale(1,.16);
    var contact=ctx.createRadialGradient(0,0,0,0,0,114*s);
    contact.addColorStop(0,'rgba(46,85,74,.24)');
    contact.addColorStop(.62,'rgba(46,85,74,.07)');
    contact.addColorStop(1,'rgba(46,85,74,0)');
    ctx.fillStyle=contact;ctx.fillRect(-114*s,-114*s,228*s,228*s);ctx.restore();
    // Interlocking smaller stones support the shelf all the way to the pond.
    rock(x+40*s,g.water-35*s,61*s,43*s,.12,'small','rear');
    rock(x-45*s,g.water-24*s,39*s,35*s,-.18,'small','ledge');
    var rear={x:x+19*s,y:g.crest+35*s,rx:86*s,ry:52*s,l:-.075,shape:'rear'};
    var left={x:x-51*s,y:g.crest+67*s,rx:32*s,ry:21*s,l:-.13,shape:'flat'};
    var right={x:x+93*s,y:g.crest+64*s,rx:33*s,ry:24*s,l:.11,shape:'small'};
    rock(rear.x,rear.y,rear.rx,rear.ry,rear.l,'rear',rear.shape);
    rock(left.x,left.y,left.rx,left.ry,left.l,'small',left.shape);
    rock(right.x,right.y,right.rx,right.ry,right.l,'small',right.shape);
    rockLines(rear.x,rear.y,rear.rx,rear.ry,rear.l,rear.shape,time,.2,true);
    rockLines(left.x,left.y,left.rx,left.ry,left.l,left.shape,time,1.8,true);
    rockLines(right.x,right.y,right.rx,right.ry,right.l,right.shape,time,2.7,false);

    var holeX=x+18*s;
    var holeY=g.crest+67*s;
    var cavity=ctx.createRadialGradient(holeX-4*s,holeY-4*s,2,holeX,holeY,22*s);
    cavity.addColorStop(0,'rgba(42,70,62,.46)');
    cavity.addColorStop(.50,'rgba(55,82,71,.32)');
    cavity.addColorStop(.82,'rgba(75,101,89,.16)');
    cavity.addColorStop(1,'rgba(100,124,109,0)');
    ctx.fillStyle=cavity;
    ctx.beginPath();
    ctx.moveTo(holeX-20*s,holeY-2*s);
    ctx.bezierCurveTo(holeX-9*s,holeY-7*s,holeX+2*s,holeY-3*s,holeX+16*s,holeY-5*s);
    ctx.lineTo(holeX+13*s,holeY+4*s);
    ctx.quadraticCurveTo(holeX-4*s,holeY+7*s,holeX-20*s,holeY-2*s);ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.lineCap='round';
    for(var i=0;i<7;i++){
      var off=(i-3)*2.1*s;
      var wobble=reduced.matches ? 0 : Math.sin(time*.80+i*.82)*1.2*s;
      ctx.strokeStyle='rgba(226,245,232,'+(0.11+(3-Math.abs(i-3))*.022)+')';
      ctx.lineWidth=(i===3 ? 1.45 : .82)*s;
      ctx.beginPath();
      ctx.moveTo(x-55*s,g.crest+17*s+off);
      ctx.bezierCurveTo(x-34*s,g.crest+14*s+off+wobble,x-16*s,g.crest+42*s+off,holeX-6*s,holeY-4*s+off*.22);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();ctx.translate(x+24*s,holeY+14*s);ctx.scale(1,.22);
    var seam=ctx.createRadialGradient(0,0,0,0,0,66*s);
    seam.addColorStop(0,'rgba(32,64,55,.18)');seam.addColorStop(1,'rgba(32,64,55,0)');
    ctx.fillStyle=seam;ctx.fillRect(-66*s,-66*s,132*s,132*s);ctx.restore();
    var lipLeft={x:holeX-35*s,y:holeY+19*s,rx:31*s,ry:22*s,l:-.10,shape:'ledge'};
    var lipRight={x:holeX+39*s,y:holeY+21*s,rx:36*s,ry:24*s,l:.08,shape:'ledge'};
    drawWater(holeX,holeY+2*s,g.water,s,time,g.mobile);
    rock(lipLeft.x,lipLeft.y,lipLeft.rx,lipLeft.ry,lipLeft.l,'front',lipLeft.shape);
    rock(lipRight.x,lipRight.y,lipRight.rx,lipRight.ry,lipRight.l,'front',lipRight.shape);
    rockLines(lipLeft.x,lipLeft.y,lipLeft.rx,lipLeft.ry,lipLeft.l,lipLeft.shape,time,1.1,false);
    rockLines(lipRight.x,lipRight.y,lipRight.rx,lipRight.ry,lipRight.l,lipRight.shape,time,2.0,false);

    rock(x-60*s,g.water-5*s,27*s,14*s,-.08,'small','flat');
    rock(x+73*s,g.water-6*s,30*s,15*s,.07,'small','flat');
    var wash=ctx.createRadialGradient(x,g.water+8,0,x,g.water+8,100*s);
    wash.addColorStop(0,'rgba(180,219,208,.18)');
    wash.addColorStop(.55,'rgba(180,219,208,.09)');
    wash.addColorStop(1,'rgba(153,204,198,0)');
    ctx.fillStyle=wash;
    ctx.fillRect(x-125*s,g.water-8,250*s,36);
    // Impact is drawn in the live scene after the mirrored surface.

  }

  function drawWater(x,startY,waterY,s,time,mobile){
    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.lineCap='round';
    // A translucent sheet carries the water; a few uneven strands add texture.
    var sheet=ctx.createLinearGradient(0,startY,0,waterY);
    sheet.addColorStop(0,'rgba(232,247,235,.24)');
    sheet.addColorStop(.25,'rgba(232,247,235,.13)');
    sheet.addColorStop(.78,'rgba(220,243,235,.20)');
    sheet.addColorStop(1,'rgba(239,250,241,.30)');
    ctx.fillStyle=sheet;ctx.beginPath();ctx.moveTo(x-10*s,startY);
    ctx.bezierCurveTo(x-8*s,startY+16*s,x-14*s,waterY-12*s,x-20*s,waterY);
    ctx.lineTo(x+21*s,waterY);
    ctx.bezierCurveTo(x+14*s,waterY-15*s,x+8*s,startY+14*s,x+10*s,startY);
    ctx.closePath();ctx.fill();
    var count=mobile ? 7 : 9;
    for(var i=0;i<count;i++){
      var t=Math.pow(i/(count-1),1.17);
      var sx=x-14*s+t*28*s;
      var ex=x-20*s+t*40*s;
      var sway=reduced.matches ? 0 : Math.sin(time*.96+i*.61)*(1.3+(i%4)*.18)*s;
      var center=1-Math.abs(t-.5)*2;
      ctx.strokeStyle='rgba(215,240,233,'+(0.075+center*.10)+')';
      ctx.lineWidth=(.50+center*.55)*s;
      ctx.beginPath();
      ctx.moveTo(sx,startY);
      ctx.bezierCurveTo(sx+1*s,startY+10*s,ex+sway,waterY-34*s,ex+sway*.22,waterY);
      ctx.stroke();
    }
    for(var c=0;c<3;c++){
      var ct=.23+c*.21;
      var csx=x-14*s+ct*28*s;
      var cex=x-20*s+ct*40*s;
      ctx.strokeStyle=c===1?'rgba(244,252,243,.43)':'rgba(233,247,239,.25)';
      ctx.lineWidth=(c===1 ? 1.65 : 1.25)*s;
      ctx.beginPath();
      ctx.moveTo(csx,startY);
      ctx.bezierCurveTo(csx,startY+12*s,cex,waterY-32*s,cex,waterY);
      ctx.stroke();
    }
    if(!reduced.matches){
      for(var d=0;d<8;d++){
        var p=(time*.52+d*.117)%1;
        var side=d%2===0 ? -1 : 1;
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

    // Fine white flecks stay at the actual point of impact, not along a ledge.
    for(var k=0;k<5;k++){
      var q=reduced.matches ? .45 : (time*.7+k*.21)%1;
      ctx.fillStyle='rgba(239,252,244,'+((1-q)*.29)+')';
      ctx.beginPath();ctx.ellipse(x+(k-2)*4*s*(.5+q),waterY-Math.sin(q*Math.PI)*5*s,.9*s,.55*s,0,0,TAU);ctx.fill();
    }
    for(var r=0;r<4;r++){
      var p=reduced.matches ? .34 : ((time*.22+r*.19)%1);
      var inner=r<2;
      var reach=inner ? 43 : 65;
      var alpha=(1-p)*(inner ? .31 : .13);
      ctx.strokeStyle='rgba(255,244,198,'+alpha+')';
      ctx.lineWidth=inner ? 1.05 : .70;
      ctx.beginPath();
      ctx.ellipse(x,waterY+3*s,7+p*reach*s,2+p*(inner ? 7 : 10)*s,0,0,TAU);
      ctx.stroke();
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

  // One bounded offscreen source for both the formation and its exact reflection.
  var source=document.createElement('canvas');source.width=1200;source.height=640;
  var sourceContext=source.getContext('2d');
  window.ZenPondRocks={
    draw:function(context,viewport,time){
      width=viewport.width;left=viewport.left;scale=viewport.scale;
      var g=geometry();
      ctx=sourceContext;ctx.clearRect(0,0,source.width,source.height);
      ctx.save();ctx.beginPath();ctx.rect(0,0,1200,g.water);ctx.clip();
      drawFormation(g,time);ctx.restore();
      ctx=context;ctx.save();
      var sx=g.x-130*g.s,sw=260*g.s,compression=.58;
      var depth=(g.water-(g.crest-35*g.s))*compression;
      // Each strip samples the SAME source pixels in reverse vertical order.
      // Wave displacement grows away from the contact line, so the base stays attached.
      for(var y=0;y<depth;y+=1.5){
        var p=y/depth;
        var wave=(Math.sin(y*.27-time*1.45)+Math.sin(y*.13+time*.71)*.55)*(.35+p*3.7);
        if(reduced.matches)wave=Math.sin(y*.27)*(.35+p*2.2);
        ctx.globalAlpha=.27*Math.pow(1-p,1.6);
        var sy=g.water-(y+1.5)/compression;
        ctx.drawImage(source,sx,sy,sw,1.5/compression,sx+wave,g.water+y,sw,1.6);
      }
      ctx.globalAlpha=1;
      ctx.drawImage(source,0,0);
      // Fine water highlights break the reflection at its point of contact.
      drawImpact(g.x+18*g.s,g.water,g.s,time);
      ctx.restore();
    }
  };
  addMeditationSymbol();
  new MutationObserver(addMeditationSymbol).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  window.dispatchEvent(new Event('zen-pond-ready'));
})();
