/* Zen v46 — structural pond/cliff renderer.
   Rear stones, opaque cliff and waterfall live in one offscreen source.
   No mirrored cliff reflection. Foreground bamboo is still drawn later by
   zen-meditation-scene-v34.js, so it naturally occludes the rocks. */
(function(){
  'use strict';

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
      var p=pts[i],next=pts[(i+1)%pts.length],prev=pts[(i+pts.length-1)%pts.length];
      var bx=(p[0]*.88+prev[0]*.12)*rx,by=(p[1]*.88+prev[1]*.12)*ry;
      if(i===0)ctx.moveTo(bx,by);else ctx.lineTo(bx,by);
      ctx.quadraticCurveTo(p[0]*rx,p[1]*ry,(p[0]*.88+next[0]*.12)*rx,(p[1]*.88+next[1]*.12)*ry);
    }
    ctx.closePath();
  }

  function rock(cx,cy,rx,ry,lean,kind,shape){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(lean);
    var g=ctx.createLinearGradient(-rx*.92,-ry*.94,rx*.80,ry*.90);
    if(kind==='rear'){
      g.addColorStop(0,'#d4dbc8');g.addColorStop(.28,'#b4c2b2');g.addColorStop(.66,'#97aba0');g.addColorStop(1,'#7f988d');
    }else if(kind==='front'){
      g.addColorStop(0,'#bac7b5');g.addColorStop(.30,'#93a59a');g.addColorStop(.68,'#647b73');g.addColorStop(1,'#455f59');
    }else{
      g.addColorStop(0,'#c5d0bd');g.addColorStop(.31,'#9cad9f');g.addColorStop(.69,'#70867c');g.addColorStop(1,'#4f6962');
    }
    ctx.fillStyle=g;rockPath(rx,ry,shape);ctx.fill();ctx.clip();
    var sun=ctx.createLinearGradient(-rx*.90,-ry*.86,rx*.10,-ry*.02);
    sun.addColorStop(0,kind==='rear'?'rgba(255,240,189,.30)':'rgba(248,236,193,.17)');
    sun.addColorStop(.52,'rgba(248,233,185,.07)');sun.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sun;ctx.beginPath();ctx.ellipse(-rx*.16,-ry*.24,rx*.76,ry*.49,-.14,0,TAU);ctx.fill();
    var under=ctx.createLinearGradient(0,-ry*.05,0,ry);
    under.addColorStop(0,'rgba(25,52,49,0)');under.addColorStop(.62,'rgba(24,51,48,.08)');under.addColorStop(1,'rgba(18,42,40,.28)');
    ctx.fillStyle=under;ctx.fillRect(-rx,-ry*.05,rx*2,ry*1.05);
    ctx.fillStyle='rgba(28,56,52,.07)';ctx.beginPath();ctx.moveTo(-rx*.78,ry*.10);ctx.lineTo(-rx*.19,-ry*.48);ctx.lineTo(rx*.27,-ry*.14);ctx.lineTo(rx*.75,ry*.22);ctx.lineTo(rx*.18,ry*.51);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(241,239,196,.24)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-rx*.72,-ry*.34);ctx.lineTo(-rx*.49,-ry*.56);ctx.lineTo(-rx*.14,-ry*.45);ctx.stroke();
    ctx.restore();
  }

  function geometry(){
    var mobile=width<700,cropRight=(width-left)/scale;
    var x=mobile?Math.min(846,cropRight-118):936;
    return {mobile:mobile,s:mobile?.64:.76,x:x,crest:430,water:WATER};
  }

  function drawRearBank(g){
    var s=g.s,x=g.x,b=g.water;
    // These sit in the same source as the cliff, so the cliff genuinely masks them.
    rock(x+109*s,b-17,38*s,27*s,-.07,'rear','ledge');
    rock(x+140*s,b-20,43*s,31*s,.05,'rear','rear');
    rock(x+174*s,b-14,36*s,25*s,-.03,'rear','flat');
    rock(x+205*s,b-10,30*s,21*s,.08,'rear','small');
  }

  function drawFormation(g,time){
    var s=g.s,x=g.x,top=g.crest,base=g.water,outlet=x+18*s;
    ctx.save();ctx.beginPath();
    ctx.moveTo(x-109*s,base+12);ctx.lineTo(x-106*s,top+88);ctx.lineTo(x-89*s,top+63);ctx.lineTo(x-85*s,top+28);ctx.lineTo(x-64*s,top+9);
    ctx.lineTo(x-38*s,top+15);ctx.lineTo(x-19*s,top+3);ctx.lineTo(x+16*s,top+13);ctx.lineTo(x+42*s,top+8);ctx.lineTo(x+62*s,top-6);
    ctx.lineTo(x+83*s,top+1);ctx.lineTo(x+101*s,top+24);ctx.lineTo(x+98*s,top+52);ctx.lineTo(x+116*s,top+75);ctx.lineTo(x+108*s,base-21);ctx.lineTo(x+120*s,base+12);ctx.closePath();
    var face=ctx.createLinearGradient(x-90*s,top,x+90*s,base);
    face.addColorStop(0,'#c4cfb8');face.addColorStop(.31,'#a8b9a8');face.addColorStop(.66,'#7e998b');face.addColorStop(1,'#587a70');
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle=face;ctx.fill();ctx.clip();
    var facets=[[-91,27,-53,18,-43,95,-88,130],[-32,13,8,16,-2,142,-41,154],[54,5,85,12,76,117,42,151]];
    facets.forEach(function(p,i){ctx.fillStyle=i===1?'rgba(37,67,58,.15)':'rgba(238,239,198,.12)';ctx.beginPath();ctx.moveTo(x+p[0]*s,top+p[1]);for(var j=2;j<p.length;j+=2)ctx.lineTo(x+p[j]*s,top+p[j+1]);ctx.closePath();ctx.fill();});
    for(var n=0;n<12;n++){
      var y=top+11+n*12.1+Math.sin(n*2.7)*4,phase=n*2.17;
      ctx.strokeStyle=n%3===0?'rgba(48,77,63,.18)':'rgba(224,233,195,.12)';ctx.lineWidth=n%3===0?.75:1;ctx.beginPath();
      var begin=x+(-112+(n%4)*13)*s;ctx.moveTo(begin,y);ctx.bezierCurveTo(x-42*s,y-7+Math.sin(phase)*4,x+21*s,y+6,x+(28+(n%4)*19)*s,y-3);ctx.stroke();
    }
    for(var k=0;k<8;k++){
      var cx=x+(-91+k*28)*s,cy=top+17+(k%3)*26;ctx.strokeStyle='rgba(42,69,59,.19)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+6*s,cy+14);ctx.lineTo(cx-3*s,cy+32);ctx.lineTo(cx+2*s,cy+49);ctx.stroke();
    }
    var wet=ctx.createLinearGradient(outlet-24*s,0,outlet+24*s,0);wet.addColorStop(0,'rgba(30,67,60,0)');wet.addColorStop(.5,'rgba(30,67,60,.20)');wet.addColorStop(1,'rgba(30,67,60,0)');ctx.fillStyle=wet;ctx.fillRect(outlet-24*s,top+12,48*s,base-top);ctx.restore();
    rock(x-61*s,top+11,24*s,16*s,-.14,'rear','flat');rock(x+72*s,top+3,22*s,18*s,.12,'rear','small');rock(x-93*s,base-22,28*s,31*s,-.12,'small','ledge');
    drawWater(outlet,top+14,base,s*2.05,time,g.mobile);
    rock(outlet-35*s,base-8,37*s,22*s,-.09,'front','ledge');rock(outlet+40*s,base-12,36*s,30*s,.12,'front','small');rock(x-94*s,base-3,25*s,14*s,-.06,'small','flat');rock(x+109*s,base-2,21*s,12*s,.08,'front','flat');
    ctx.strokeStyle='rgba(38,75,66,.25)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-105*s,base-.8);ctx.lineTo(outlet-19*s,base-.8);ctx.moveTo(outlet+24*s,base-.8);ctx.lineTo(x+118*s,base-.8);ctx.stroke();
  }

  function drawWater(x,startY,waterY,s,time,mobile){
    ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
    var sheet=ctx.createLinearGradient(0,startY,0,waterY);sheet.addColorStop(0,'rgba(232,247,235,.24)');sheet.addColorStop(.25,'rgba(232,247,235,.13)');sheet.addColorStop(.78,'rgba(220,243,235,.20)');sheet.addColorStop(1,'rgba(239,250,241,.30)');
    ctx.fillStyle=sheet;ctx.beginPath();ctx.moveTo(x-10*s,startY);ctx.bezierCurveTo(x-8*s,startY+16*s,x-14*s,waterY-12*s,x-20*s,waterY);ctx.lineTo(x+21*s,waterY);ctx.bezierCurveTo(x+14*s,waterY-15*s,x+8*s,startY+14*s,x+10*s,startY);ctx.closePath();ctx.fill();
    var count=mobile?7:9;
    for(var i=0;i<count;i++){
      var t=Math.pow(i/(count-1),1.17),sx=x-14*s+t*28*s,ex=x-20*s+t*40*s,sway=reduced.matches?0:Math.sin(time*.96+i*.61)*(1.3+(i%4)*.18)*s,center=1-Math.abs(t-.5)*2;
      ctx.strokeStyle='rgba(215,240,233,'+(0.075+center*.10)+')';ctx.lineWidth=(.50+center*.55)*s;ctx.beginPath();ctx.moveTo(sx,startY);ctx.bezierCurveTo(sx+1*s,startY+10*s,ex+sway,waterY-34*s,ex+sway*.22,waterY);ctx.stroke();
    }
    for(var c=0;c<3;c++){
      var ct=.23+c*.21,csx=x-14*s+ct*28*s,cex=x-20*s+ct*40*s;ctx.strokeStyle=c===1?'rgba(244,252,243,.43)':'rgba(233,247,239,.25)';ctx.lineWidth=(c===1?1.65:1.25)*s;ctx.beginPath();ctx.moveTo(csx,startY);ctx.bezierCurveTo(csx,startY+12*s,cex,waterY-32*s,cex,waterY);ctx.stroke();
    }
    if(!reduced.matches){for(var d=0;d<8;d++){var p=(time*.52+d*.117)%1,side=d%2===0?-1:1,dx=x+side*(3+d*.8)*s*p,dy=startY+(waterY-startY)*p;ctx.fillStyle='rgba(255,248,211,'+(.10+(1-p)*.18)+')';ctx.beginPath();ctx.ellipse(dx,dy,.68*s,1.9*s,0,0,TAU);ctx.fill();}}
    ctx.restore();
  }

  function drawImpact(x,waterY,s,time){
    ctx.save();ctx.globalCompositeOperation='screen';
    var mist=ctx.createRadialGradient(x,waterY,0,x,waterY,49*s);mist.addColorStop(0,'rgba(255,248,211,.25)');mist.addColorStop(.42,'rgba(229,246,236,.11)');mist.addColorStop(1,'rgba(229,246,236,0)');ctx.fillStyle=mist;ctx.fillRect(x-58*s,waterY-30*s,116*s,60*s);
    for(var k=0;k<5;k++){var q=reduced.matches?.45:(time*.7+k*.21)%1;ctx.fillStyle='rgba(239,252,244,'+((1-q)*.29)+')';ctx.beginPath();ctx.ellipse(x+(k-2)*4*s*(.5+q),waterY-Math.sin(q*Math.PI)*5*s,.9*s,.55*s,0,0,TAU);ctx.fill();}
    for(var r=0;r<4;r++){var p=reduced.matches?.34:((time*.22+r*.19)%1),inner=r<2,reach=inner?43:65,alpha=(1-p)*(inner?.31:.13);ctx.strokeStyle='rgba(255,244,198,'+alpha+')';ctx.lineWidth=inner?1.05:.70;ctx.beginPath();ctx.ellipse(x,waterY+3*s,7+p*reach*s,2+p*(inner?7:10)*s,0,0,TAU);ctx.stroke();}
    ctx.restore();
  }

  function addMeditationSymbol(){
    var button=document.getElementById('start-button');if(!button||button.querySelector('.start-ring-symbol'))return;
    var symbol=document.createElement('span');symbol.className='start-ring-symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent='≈';
    var name=button.querySelector('.start-ring-name');if(name)button.insertBefore(symbol,name);else button.appendChild(symbol);
  }

  var source=document.createElement('canvas');source.width=1200;source.height=640;
  var sourceContext=source.getContext('2d');
  window.ZenPondRocks={
    draw:function(context,viewport,time){
      width=viewport.width;left=viewport.left;scale=viewport.scale;
      var g=geometry();ctx=sourceContext;ctx.clearRect(0,0,source.width,source.height);
      ctx.save();ctx.beginPath();ctx.rect(0,0,1200,g.water);ctx.clip();
      drawRearBank(g);     // same source, first
      drawFormation(g,time); // opaque cliff masks rear stones
      ctx.restore();
      ctx=context;ctx.save();ctx.globalAlpha=1;ctx.drawImage(source,0,0);
      drawImpact(g.x+18*g.s,g.water,g.s,time);ctx.restore();
    }
  };

  addMeditationSymbol();
  new MutationObserver(addMeditationSymbol).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
  window.dispatchEvent(new Event('zen-pond-ready'));
})();
