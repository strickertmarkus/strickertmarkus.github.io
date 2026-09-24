/* Ingemar Zen visual engine. All four designs are painted in Canvas 2D;
   SVG artwork is deliberately not used. Session time and stage state are
   provided by the existing training engine. */
(function(global){
  'use strict';
  var KEY='ingemar-zen-visual-style-v1', variants=['observatory','abstract'];
  var root=null, canvas=null, ctx=null, view={kind:'stretch',variant:'observatory',elapsed:0,duration:1,stepFraction:0,breath:0,running:false,done:false,stage:0};
  var raf=0, width=0, height=0, scale=1, stamp=0, lastFrame=0, needsMeasure=true, reduced=global.matchMedia&&global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
  function color(rgb,a){return 'rgba('+rgb.join(',')+','+a+')';}
  function rgba(hex,a){return color(hex,a);}
  function variant(){try{var saved=localStorage.getItem(KEY);return variants.indexOf(saved)>=0?saved:'observatory';}catch(_){return 'observatory';}}
  view.variant=variant();
  function grad(x,y,r,stops){
    var g=ctx.createRadialGradient(x,y,0,x,y,r);stops.forEach(function(p){g.addColorStop(p[0],p[1]);});return g;
  }
  function fill(x,y,w,h,paint){ctx.fillStyle=paint;ctx.fillRect(x,y,w,h);}
  function ellipse(x,y,rx,ry,paint){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=paint;ctx.fill();}
  function strokeLine(points,paint,lw,blur,shadow){
    if(points.length<2)return;ctx.save();ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(var i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    ctx.strokeStyle=paint;ctx.lineWidth=lw;ctx.lineCap='round';ctx.lineJoin='round';
    if(blur){ctx.shadowBlur=blur;ctx.shadowColor=shadow||paint;}
    ctx.stroke();ctx.restore();
  }
  function base(w,h,med,center){
    fill(0,0,w,h,med?'#0c1721':'#071511');
    var ambient=ctx.createLinearGradient(0,0,0,h);
    if(med){ambient.addColorStop(0,'#12242c');ambient.addColorStop(.48,'#14262f');ambient.addColorStop(1,'#08131c');}
    else {ambient.addColorStop(0,'#10251e');ambient.addColorStop(.48,'#10231d');ambient.addColorStop(1,'#06120e');}
    fill(0,0,w,h,ambient);
    fill(0,0,w,h,grad(w*.5,center.y,Math.max(w,h)*.57,med?[[0,'rgba(204,171,110,.105)'],[.4,'rgba(122,147,146,.045)'],[1,'transparent']]:[[0,'rgba(109,184,140,.115)'],[.45,'rgba(51,103,80,.04)'],[1,'transparent']]));
    fill(0,0,w,h,grad(w*.52,h*.5,Math.max(w,h)*.72,[[0,'transparent'],[.56,'transparent'],[1,'rgba(1,8,12,.63)']]));
    ctx.save();ctx.globalAlpha=med?.13:.11;
    for(var i=0;i<36;i++){var q=(i*79.17)%w,yy=(i*173.23)%h,r=(i%4+1)*.5;ellipse(q,yy,r,r,med?'#cdbf9d':'#a8d8b2');}
    ctx.restore();
  }
  function halo(x,y,r,rgb,alpha){
    fill(x-r,y-r,2*r,2*r,grad(x,y,r,[[0,rgba(rgb,alpha)],[.34,rgba(rgb,alpha*.27)],[1,rgba(rgb,0)]]));
  }
  function ringScene(center,r,progress,breath,t){
    var x=center.x,y=center.y,g=[130,231,171],white=[225,255,237];
    halo(x,y,r*2,g,.095);
    ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2);ctx.scale(1,.90);
    ctx.strokeStyle='rgba(154,216,177,.13)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(125,204,159,.045)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r*1.27,.1,Math.PI*1.7);ctx.stroke();
    var theta=progress*Math.PI*2;
    ctx.beginPath();ctx.arc(0,0,r,0,theta);ctx.strokeStyle='rgba(104,215,158,.13)';ctx.lineWidth=11;ctx.shadowBlur=27;ctx.shadowColor='rgba(104,215,158,.60)';ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,r,0,theta);ctx.strokeStyle='#95edb5';ctx.lineWidth=2.4;ctx.shadowBlur=8;ctx.stroke();
    ctx.restore();
    var a=progress*Math.PI*2-Math.PI/2,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.90;
    halo(px,py,21,g,.26);ellipse(px,py,3.2,3.2,'#e6ffe9');
    var band=ctx.createLinearGradient(x-r,y+r*.6,x+r,y-r*.8);
    band.addColorStop(0,'rgba(60,133,104,.04)');band.addColorStop(.50,'rgba(202,255,222,.18)');band.addColorStop(1,'rgba(79,166,115,.025)');
    ctx.save();ctx.translate(x,y);ctx.rotate(-.3);ctx.scale(1,.9);
    ctx.lineWidth=.85;ctx.strokeStyle=band;ctx.beginPath();ctx.ellipse(0,0,r*.66,r*.63,-.45,.16,Math.PI*1.54);ctx.stroke();ctx.restore();
    var inner=ctx.createLinearGradient(x-r,y-r,x+r,y+r);inner.addColorStop(0,'rgba(135,210,164,.0)');inner.addColorStop(.52,'rgba(134,208,163,.095)');inner.addColorStop(1,'rgba(135,210,164,0)');
    ellipse(x,y,r*.72,r*.67,inner);
    var sweep=.5+breath*.5;
    halo(x,y,r*.8,g,.036*sweep);
  }
  function horizonScene(center,r,progress,breath,t,w){
    var x=center.x,y=center.y,g=[228,194,123];
    halo(x,y,r*2.7,g,.095);
    var floor=ctx.createLinearGradient(0,y-8,0,y+r*1.2);
    floor.addColorStop(0,'rgba(210,190,144,.055)');floor.addColorStop(.5,'rgba(53,99,102,.04)');floor.addColorStop(1,'transparent');
    fill(0,y,w,r*1.4,floor);
    strokeLine([[x-r*1.27,y],[x+r*1.27,y]],'rgba(232,207,148,.20)',1,6,rgba(g,.35));
    var extent=r*2.54,from=x-r*1.27;strokeLine([[from,y],[from+extent*progress,y]],'#f4db9c',2,8,rgba(g,.6));
    var sx=from+extent*progress;halo(sx,y,19,g,.30);ellipse(sx,y,2.8,2.8,'#fff1d6');
    ctx.save();ctx.translate(x,y+13);ctx.scale(1,.16);
    var ripples=2;for(var i=0;i<ripples;i++){var rr=r*(.42+i*.32)+breath*r*.1;ctx.beginPath();ctx.ellipse(0,0,rr,rr,0,0,Math.PI*2);ctx.strokeStyle=rgba(g,.08/(i+1));ctx.lineWidth=3;ctx.stroke();}
    ctx.restore();
    for(var j=0;j<6;j++){var ww=r*(.32+j*.12),yy=y+14+j*j*2.3;strokeLine([[x-ww*.5,yy],[x+ww*.5,yy]],rgba(g,.10/(1+j*.3)),1);}
    var gleam=grad(x,y-24,r*.7,[[0,rgba(g,.15)],[1,rgba(g,0)]]);fill(x-r,y-r,r*2,r*2,gleam);
  }
  function ribbonScene(center,r,progress,breath,t){
    var x=center.x,y=center.y,g=[139,235,177],N=74;
    halo(x,y,r*2.5,g,.075);
    var left=[],right=[],mid=[];
    for(var i=0;i<=N;i++){
      var u=i/N,v=u*Math.PI*2.2+(reduced?0:t*.19);
      var z=Math.sin(v)*.64+Math.cos(v*.57)*.18;
      var px=x+(u-.5)*r*2.15+z*r*.24;
      var py=y+Math.sin(v+.34)*r*.33 + Math.cos(u*6.4+t*.16)*r*.075;
      var width=r*(.075+.105*(.5+.5*Math.sin(v+1)))*(1+.23*Math.sin(u*11+breath));
      var ang=Math.atan2(Math.cos(v+.34)*.34,-.5+Math.cos(v)*.18);
      var nx=Math.sin(ang),ny=Math.cos(ang);
      left.push([px+nx*width,py+ny*width]);right.push([px-nx*width,py-ny*width]);mid.push([px,py]);
    }
    for(var k=0;k<N;k++){
      var shade=.12+.49*(.5+.5*Math.sin(k/N*17+t*.12)),rgb='rgba('+(85+shade*125|0)+','+(155+shade*91|0)+','+(122+shade*103|0)+',.88)';
      ctx.beginPath();ctx.moveTo(left[k][0],left[k][1]);ctx.lineTo(left[k+1][0],left[k+1][1]);ctx.lineTo(right[k+1][0],right[k+1][1]);ctx.lineTo(right[k][0],right[k][1]);ctx.closePath();
      ctx.fillStyle=rgb;ctx.fill();
    }
    ctx.save();ctx.globalCompositeOperation='screen';
    strokeLine(mid,'rgba(154,247,186,.11)',r*.11,22,'rgba(102,221,155,.35)');
    strokeLine(left,'rgba(225,255,228,.56)',1.3,6,'rgba(174,254,202,.35)');
    ctx.restore();
    var point=mid[Math.round(progress*N)];halo(point[0],point[1],r*.28,g,.17);ellipse(point[0],point[1],3,3,'#f1ffec');
    ctx.save();ctx.translate(x,y+r*.67);ctx.scale(1,.14);
    ellipse(0,0,r*.8,r*.36,grad(0,0,r*.8,[[0,'rgba(140,219,166,.085)'],[1,'transparent']]));ctx.restore();
  }
  function sphereScene(center,r,progress,breath,t){
    var x=center.x,y=center.y,radius=r*(.82+.055*breath),gold=[241,204,139];
    halo(x,y,r*2.0,gold,.10+breath*.035);
    var reflection=ctx.createRadialGradient(x,y+r*.95,0,x,y+r*.95,r*.95);
    reflection.addColorStop(0,'rgba(243,204,149,.12)');reflection.addColorStop(.47,'rgba(223,186,136,.038)');reflection.addColorStop(1,'transparent');
    ctx.save();ctx.translate(x,y+r*.97);ctx.scale(1,.20);ellipse(0,0,r*.94,r*.94,reflection);ctx.restore();
    var glass=ctx.createRadialGradient(x-radius*.38,y-radius*.58,radius*.02,x+radius*.17,y+radius*.16,radius*1.3);
    glass.addColorStop(0,'rgba(255,251,233,.74)');
    glass.addColorStop(.23,'rgba(247,219,167,.42)');
    glass.addColorStop(.59,'rgba(143,177,162,.22)');
    glass.addColorStop(.84,'rgba(37,67,72,.37)');
    glass.addColorStop(1,'rgba(3,14,25,.55)');
    ellipse(x,y,radius,radius,glass);
    ctx.save();ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.clip();
    var shade=ctx.createLinearGradient(x-radius,y-radius,x+radius,y+radius);
    shade.addColorStop(0,'rgba(255,251,219,.24)');shade.addColorStop(.33,'transparent');shade.addColorStop(.68,'rgba(6,25,39,.10)');shade.addColorStop(1,'rgba(4,15,29,.54)');
    fill(x-radius,y-radius,radius*2,radius*2,shade);
    var shine=grad(x-radius*.42,y-radius*.61,radius*.55,[[0,'rgba(255,255,249,.66)'],[.25,'rgba(255,245,213,.20)'],[1,'transparent']]);
    fill(x-radius,y-radius,radius*2,radius*2,shine);ctx.restore();
    ctx.save();ctx.beginPath();ctx.arc(x,y,radius-.6,0,Math.PI*2);
    ctx.lineWidth=1.3;ctx.strokeStyle='rgba(255,240,207,.39)';ctx.shadowBlur=8;ctx.shadowColor='rgba(240,207,149,.3)';ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2);
    ctx.beginPath();ctx.arc(0,0,radius+7,0,progress*Math.PI*2);ctx.strokeStyle='rgba(255,219,154,.86)';ctx.lineWidth=1.8;ctx.shadowBlur=8;ctx.shadowColor='rgba(250,216,145,.46)';ctx.stroke();ctx.restore();
    var g=ctx.createLinearGradient(0,y+r*.86,0,y+r*1.9);
    g.addColorStop(0,'rgba(223,188,141,.065)');g.addColorStop(1,'transparent');
    ellipse(x,y+r*1.19,radius*.72,radius*.37,g);
  }
  function measure(){
    if(!root||!canvas)return;
    var box=root.querySelector('.zen-layout').getBoundingClientRect(),focus=root.querySelector('.zen-focus-card').getBoundingClientRect(),dock=root.querySelector('.zen-journey-card').getBoundingClientRect();
    width=Math.max(1,Math.round(box.width));height=Math.max(1,Math.round(box.height));
    var top=clamp(focus.bottom-box.top+7,0,height),bottom=clamp(dock.top-box.top-7,0,height);
    if(bottom-top<90){top=clamp(focus.bottom-box.top+2,0,height);bottom=clamp(dock.top-box.top-2,top+30,height);}
    var room=Math.max(35,bottom-top);
    root.style.setProperty('--zen-art-center-y',(top+room*.5)+'px');
    root.style.setProperty('--zen-art-size',Math.round(Math.min(width*.50,room*.45,245))+'px');
    view.area={x:width*.5,y:top+room*.5,r:Math.max(24,Math.min(width*.43,room*.41,192)),room:room};
    root.style.setProperty('--zen-breath-label-y',Math.max(top+7,view.area.y-view.area.r-21)+'px');
    var dpr=clamp(global.devicePixelRatio||1,1,1.65),pixelCap=1700000;
    scale=Math.min(dpr,Math.sqrt(pixelCap/(width*height)));
    var w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.setTransform(scale,0,0,scale,0,0);
  }
  function frame(now){
    raf=0;if(!root||root.hidden||!canvas||!ctx)return;
    if(now-lastFrame<33&&view.running&&!reduced){raf=requestAnimationFrame(frame);return;}
    lastFrame=now;
    if(needsMeasure||canvas.clientWidth!==width||canvas.clientHeight!==height){measure();needsMeasure=false;}
    var v=view,med=v.kind==='meditation',abstract=v.variant==='abstract',center=v.area,r=v.area.r,t=reduced?0:(now-stamp)/1000;
    ctx.clearRect(0,0,width,height);base(width,height,med,center);
    if(abstract){if(med)sphereScene(center,r,v.elapsed/Math.max(v.duration,1),v.breath,t);else ribbonScene(center,r,v.elapsed/Math.max(v.duration,1),v.breath,t);}
    else if(med)horizonScene(center,r,clamp(v.elapsed/Math.max(v.duration,1),0,1),v.breath,t,width);
    else ringScene(center,r,clamp(v.elapsed/Math.max(v.duration,1),0,1),v.breath,t);
    if(v.running&&!reduced)raf=requestAnimationFrame(frame);
  }
  function draw(){if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}
  function refreshLayout(){needsMeasure=true;draw();}
  function switchTo(next){
    if(variants.indexOf(next)<0)return;view.variant=next;
    try{localStorage.setItem(KEY,next);}catch(_){}
    if(root){root.dataset.zenVariant=next;root.querySelectorAll('[data-zen-variant]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.zenVariant===next));});}
    draw();
  }
  function init(node,element){
    root=node;canvas=element;ctx=canvas.getContext('2d',{alpha:false});stamp=performance.now();
    switchTo(view.variant);
    global.addEventListener('resize',refreshLayout,{passive:true});
    if(global.visualViewport)global.visualViewport.addEventListener('resize',refreshLayout,{passive:true});
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(refreshLayout);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)draw();});
  }
  function update(data){
    if(data.stage!==view.stage||data.kind!==view.kind)needsMeasure=true;
    Object.keys(data).forEach(function(k){view[k]=data[k];});
    if(root&&!root.hidden){root.dataset.running=view.running?'true':'false';root.dataset.zenVariant=view.variant;draw();}
    else stop();
  }
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
  global.IngemarZenVisuals={init:init,update:update,stop:stop,switchTo:switchTo,getVariant:function(){return view.variant;},measure:measure};
})(window);
