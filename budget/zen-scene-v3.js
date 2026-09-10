/* Zen scenery v3: more organic forest and bamboo, with richer light and reflections. */
(function(){
  'use strict';
  const host=document.querySelector('.landscape');
  if(!host)return;
  const forest=host.querySelector('.landscape-forest');
  const garden=host.querySelector('.landscape-garden');
  const fc=forest.getContext('2d'),gc=garden.getContext('2d');
  if(!fc||!gc)return;
  const W=1200,H=900,TAU=Math.PI*2;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=window.matchMedia('(pointer: fine)');
  let seed=58127;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const range=(a,b)=>a+random()*(b-a);
  const layer=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
  const woodland=layer(),wood=layer(),waterside=layer();
  const leaves=[],bambooLeaves=[],fireflies=[],ripples=[],waterSpecks=[];
  let width=0,height=0,ratio=1,scale=1,left=0,frame=0,previous=-Infinity,visible=true,transitionUntil=0;
  let lastKind=document.body.dataset.kind,inSession=document.body.classList.contains('in-session');
  let pointerX=0,pointerY=0,driftX=0,driftY=0;

  function ellipse(c,x,y,rx,ry,color,rotation=0){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,TAU);c.fill();}
  function glow(c,x,y,radius,rgb,opacity){const g=c.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,'rgba('+rgb+','+opacity+')');g.addColorStop(.24,'rgba('+rgb+','+(opacity*.36)+')');g.addColorStop(1,'rgba('+rgb+',0)');c.fillStyle=g;c.fillRect(x-radius,y-radius,radius*2,radius*2);}
  function stroke(c,p,color,w){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(p[0],p[1]);c.bezierCurveTo(...p.slice(2));c.stroke();}
  function hill(c,y,color,amp,phase){c.beginPath();c.moveTo(0,H);for(let x=0;x<=W+20;x+=20)c.lineTo(x,y+Math.sin(x/210+phase)*amp+Math.sin(x/97+phase)*amp/4);c.lineTo(W,H);c.closePath();c.fillStyle=color;c.fill();}
  function leafShape(c,x,y,length,width,color,angle,vein,alpha=1){
    c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);
    c.fillStyle=color;c.beginPath();c.moveTo(-length*.48,0);c.quadraticCurveTo(-length*.08,-width,length*.52,0);c.quadraticCurveTo(-length*.1,width,-length*.48,0);c.fill();
    if(vein){c.strokeStyle=vein;c.lineWidth=.7;c.beginPath();c.moveTo(-length*.34,0);c.lineTo(length*.34,0);c.stroke();}
    c.restore();
  }
  function branch(c,x,y,length,angle,thickness,depth){
    const ex=x+Math.cos(angle)*length,ey=y+Math.sin(angle)*length;
    const cross=range(-.15,.15)*length;
    const pts=[x,y,x+Math.cos(angle)*length*.3+cross,y+Math.sin(angle)*length*.3,ex-Math.cos(angle)*length*.23,ey-Math.sin(angle)*length*.23,ex,ey];
    stroke(c,pts,'#0c251d',thickness+6);stroke(c,pts,'#314a35',thickness);stroke(c,pts.map((n,i)=>i%2?n:n-thickness*.12),'#7d8f5e',Math.max(.7,thickness*.11));
    if(depth<1){
      const cluster=Math.floor(range(9,15));
      for(let i=0;i<cluster;i++)leaves.push({x:ex+range(-48,48),y:ey+range(-28,30),len:range(22,48),wid:range(5.5,12),angle:range(-1.1,1.1),phase:range(0,TAU),shade:Math.floor(range(0,6)),flutter:range(.65,1.4)});
      return;
    }
    branch(c,ex,ey,length*range(.62,.79),angle-range(.27,.64),thickness*.64,depth-1);
    branch(c,ex,ey,length*range(.60,.78),angle+range(.25,.60),thickness*.62,depth-1);
    if(depth>2&&random()>.48)branch(c,ex,ey,length*range(.42,.58),angle+range(-.18,.18),thickness*.42,depth-2);
  }
  function barkKnot(c,x,y,rx,ry,angle){
    c.save();c.translate(x,y);c.rotate(angle);c.strokeStyle='#182f25aa';c.lineWidth=3;c.beginPath();c.ellipse(0,0,rx,ry,0,0,TAU);c.stroke();c.strokeStyle='#8da06d55';c.lineWidth=1.2;c.beginPath();c.ellipse(-1,-1,rx*.6,ry*.6,0,0,TAU);c.stroke();c.restore();
  }
  function canopyBlob(c,x,y,rx,ry,color){
    c.save();c.fillStyle=color;c.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU,r=1+(i%2?-.12:.1);const px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.closePath();c.fill();c.restore();
  }
  function makeForest(){
    const c=woodland.getContext('2d');
    const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#071c1b');sky.addColorStop(.43,'#214b38');sky.addColorStop(1,'#071a14');c.fillStyle=sky;c.fillRect(0,0,W,H);
    glow(c,795,245,470,'126,188,96',.3);
    for(let i=0;i<33;i++){const x=range(-40,1240),y=range(485,680),w=range(6,19);stroke(c,[x,y,x+range(-18,18),y-180,x+range(-38,28),95,x+range(-30,25),-30],'rgba(8,31,25,.39)',w);}
    for(let i=0;i<35;i++)canopyBlob(c,range(10,1190),range(110,390),range(45,105),range(28,64),['#12342677','#173e2a66','#214a3060'][i%3]);
    hill(c,614,'#143a28',37,2);hill(c,699,'#0c2b1f',43,4);
    for(let i=0;i<310;i++)ellipse(c,range(0,W),range(630,860),range(2,15),range(1,4),['#24452b','#1b3b28','#315332','#486340'][i%4],range(-.5,.5));
    glow(c,862,651,250,'142,203,88',.13);
    const t=wood.getContext('2d');
    for(let i=0;i<13;i++){
      const offset=(i-6),end=865+offset*34;
      stroke(t,[865,580,858+offset*7,668,end+range(-18,20),700,end,718+Math.abs(offset)*6],'#172e23',34-Math.abs(offset)*2.3);
      stroke(t,[864,595,858+offset*7,670,end+10,698,end,716+Math.abs(offset)*6],'#66784d',1.5);
    }
    branch(t,867,655,205,-1.68,88,4);branch(t,858,512,152,-2.54,42,3);branch(t,865,530,168,-.72,38,3);
    for(let i=0;i<34;i++){const x=range(830,895),y=range(450,664);stroke(t,[x,y,x+range(-9,6),y-range(18,32),x+range(-10,10),y-range(35,55),x+range(-7,7),y-range(58,92)],i%4===0?'#9aa66c47':'#10291fc4',range(.8,2.4));}
    for(let i=0;i<7;i++)barkKnot(t,range(842,884),range(482,632),range(5,12),range(3,8),range(-.8,.8));
    for(let i=0;i<15;i++)leafShape(t,range(829,895),range(480,670),range(10,24),range(3,6),'#627c4655',range(-1,1),null,.8);
    for(let i=0;i<58;i++)fireflies.push({x:range(430,1190),y:range(175,745),phase:range(0,TAU),speed:range(.15,.43),size:range(.7,1.9)});
  }
  function rock(c,x,y,size,shade){
    c.save();c.translate(x,y);const fill=c.createLinearGradient(-size,-size,size,size*.7);fill.addColorStop(0,shade);fill.addColorStop(.42,'#718a80');fill.addColorStop(1,'#314d4a');c.fillStyle=fill;c.beginPath();c.moveTo(-size,0);c.bezierCurveTo(-size*.9,-size*.56,-size*.4,-size*.9,size*.04,-size*.67);c.bezierCurveTo(size*.5,-size*.82,size*.76,-size*.28,size,0);c.bezierCurveTo(size*.74,size*.2,-size*.72,size*.24,-size,0);c.fill();stroke(c,[-size*.82,-size*.12,-size*.52,-size*.52,size*.12,-size*.55,size*.55,-size*.31],'#eff2cf70',1.7);c.restore();
  }
  function bambooCulm(c,x,y,tall,w,lean,depth){
    const segments=Math.max(6,Math.round(tall/72)),seg=tall/segments;
    for(let j=0;j<segments;j++){
      const t0=j/segments,t1=(j+1)/segments,x0=x+lean*t0,x1=x+lean*t1,y0=y-tall*t0,y1=y-tall*t1,ww=w*(1-j/segments*.32);
      const grad=c.createLinearGradient(x0-ww,y0,x0+ww,y0);grad.addColorStop(0,depth?'#274f43a8':'#315f50aa');grad.addColorStop(.35,depth?'#638b70d9':'#729a79dc');grad.addColorStop(.57,depth?'#94ae88cb':'#a8bc91d4');grad.addColorStop(1,depth?'#31594aaa':'#3f6a57b5');
      c.strokeStyle=grad;c.lineWidth=ww;c.lineCap='butt';c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();
      c.strokeStyle=depth?'#173b31a0':'#23483ca0';c.lineWidth=Math.max(1,ww*.10);c.beginPath();c.moveTo(x0-ww*.28,y0);c.lineTo(x1-ww*.28,y1);c.stroke();
      c.strokeStyle='#d7ddb082';c.lineWidth=Math.max(.7,ww*.08);c.beginPath();c.moveTo(x0+ww*.18,y0);c.lineTo(x1+ww*.18,y1);c.stroke();
      const nx=x1,ny=y1;c.strokeStyle=depth?'#213f34bb':'#365c48bb';c.lineWidth=Math.max(1.1,ww*.16);c.beginPath();c.moveTo(nx-ww*.62,ny);c.lineTo(nx+ww*.62,ny);c.stroke();
      if(j>0&&j<segments-1&&random()>.27){const dir=random()>.5?1:-1,branchLen=range(23,60)*(depth?.82:1);stroke(c,[nx,ny,nx+dir*branchLen*.35,ny-range(5,15),nx+dir*branchLen*.7,ny-range(10,24),nx+dir*branchLen,ny-range(13,28)],depth?'#294e40a8':'#355f4cae',Math.max(1.2,ww*.15));for(let k=0;k<range(2,5);k++)bambooLeaves.push({x:nx+dir*range(branchLen*.35,branchLen*1.06),y:ny-range(7,34),dir,phase:range(0,TAU),len:range(24,43)*(depth?.82:1),wid:range(4.5,8)*(depth?.85:1),depth});}
    }
  }
  function makeGarden(){
    const c=waterside.getContext('2d');
    const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#809f9e');sky.addColorStop(.23,'#c6d7ca');sky.addColorStop(.48,'#9ebfb0');sky.addColorStop(.68,'#6d9a90');sky.addColorStop(1,'#3a6967');c.fillStyle=sky;c.fillRect(0,0,W,H);
    glow(c,790,154,390,'255,241,180',.52);glow(c,728,218,250,'219,247,222',.23);glow(c,1000,330,270,'166,222,198',.18);
    ellipse(c,790,154,21,21,'rgba(255,248,205,.54)');
    hill(c,360,'#73998a42',54,.6);hill(c,453,'#567f7066',39,2);
    for(let i=0;i<27;i++){const depth=i<11;const x=range(595,1260),y=range(360,520),tall=range(depth?260:320,depth?470:560),lean=range(-42,32),w=range(depth?5:8,depth?10:15);bambooCulm(c,x,y,tall,w,lean,depth);}
    hill(c,532,'#466c5878',14,4);
    for(let i=0;i<21;i++)rock(c,660+i*29,559+Math.sin(i*.8)*16,range(24,51),'#aab9a5');
    rock(c,931,477,74,'#c6ceb7');rock(c,883,526,60,'#a6b69f');rock(c,1007,544,95,'#bbc6ae');rock(c,968,590,68,'#9cae98');
    c.fillStyle='#a8b9a6';c.beginPath();c.moveTo(1200,587);c.bezierCurveTo(1010,646,1040,710,1135,770);c.lineTo(1200,900);c.closePath();c.fill();
    for(let i=0;i<15;i++)stroke(c,[1208,604+i*10,1055+i*4,653+i*5,1085+i*7,738+i*5,1220,782+i*8],'#58796338',1.1);
    rock(c,1157,686,64,'#c2cbb8');rock(c,1160,741,29,'#afc0a9');
    for(let i=0;i<24;i++)ripples.push({x:range(520,1180),y:range(580,870),phase:range(0,1),size:range(15,58),speed:range(.07,.15)});
    for(let i=0;i<46;i++)waterSpecks.push({x:range(505,1110),y:range(590,835),phase:range(0,TAU),speed:range(.18,.5),size:range(.6,1.8)});
  }
  makeForest();makeGarden();

  function prepare(c){c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);c.translate(left,0);c.scale(scale,scale);}
  function renderForest(time){
    prepare(fc);fc.drawImage(woodland,0,0);
    fc.save();fc.globalCompositeOperation='screen';for(let i=0;i<5;i++){const x=610+i*102+Math.sin(time*.08+i)*15;const beam=fc.createLinearGradient(x,70,x-210,760);beam.addColorStop(0,'#d8f5ae00');beam.addColorStop(.32,'#c9eea515');beam.addColorStop(.7,'#aede8810');beam.addColorStop(1,'#b8e69400');fc.fillStyle=beam;fc.beginPath();fc.moveTo(x,0);fc.lineTo(x+34,0);fc.lineTo(x-170,780);fc.lineTo(x-285,780);fc.closePath();fc.fill();}fc.restore();
    const wind=Math.sin(time*.29)*.0045+Math.sin(time*.071+1.7)*.0032;
    fc.save();fc.translate(867+driftX*.35,690);fc.transform(1,0,wind,1,0,0);fc.drawImage(wood,-867,-690);fc.restore();
    const shades=['#173a2a','#234a31','#2c5737','#37643d','#477344','#587f49'];
    for(const l of leaves){const gust=Math.sin(time*.48+l.phase)*3.2*l.flutter+Math.sin(time*1.11+l.phase*.7)*.8;const x=l.x+gust+wind*(l.y-690)*1.7+driftX*.35,y=l.y+Math.cos(time*.34+l.phase)*1.35;const angle=l.angle+gust*.012+wind*12;leafShape(fc,x,y,l.len,l.wid,shades[l.shade],angle,l.shade>3?'#b6cd8250':'#0e2a2070');}
    fc.save();fc.globalCompositeOperation='screen';for(const f of fireflies){const x=f.x+Math.sin(time*f.speed+f.phase)*19+driftX,y=f.y+Math.cos(time*f.speed*.7+f.phase)*13+driftY;const light=.22+.7*Math.pow((Math.sin(time*.8+f.phase)+1)/2,2);glow(fc,x,y,15+f.size*3,'176,236,102',light*.34);ellipse(fc,x,y,f.size,f.size,'rgba(226,255,170,'+light+')');}fc.restore();
    glow(fc,850,658,190,'128,191,75',.105+Math.sin(time*.23)*.026);
  }
  function renderGarden(time){
    prepare(gc);gc.drawImage(waterside,0,0);
    gc.save();gc.globalCompositeOperation='screen';
    for(let i=0;i<4;i++){const sx=735+i*42+Math.sin(time*.07+i)*9;const beam=gc.createLinearGradient(sx,80,sx-150,690);beam.addColorStop(0,'rgba(255,245,194,.18)');beam.addColorStop(.5,'rgba(230,246,215,.08)');beam.addColorStop(1,'rgba(214,239,220,0)');gc.fillStyle=beam;gc.beginPath();gc.moveTo(sx,0);gc.lineTo(sx+32,0);gc.lineTo(sx-115,690);gc.lineTo(sx-210,690);gc.closePath();gc.fill();}
    glow(gc,790+Math.sin(time*.11)*8,158,118,'255,246,196',.24);glow(gc,693,317,120,'210,245,224',.09);gc.restore();
    gc.save();gc.beginPath();gc.moveTo(0,568);gc.lineTo(1090,568);gc.bezierCurveTo(992,662,1060,733,1140,790);gc.lineTo(1170,900);gc.lineTo(0,900);gc.closePath();gc.clip();
    for(let i=0;i<40;i++){const y=579+i*7.5,shift=Math.sin(time*.24+i*.67)*16;const reflection=gc.createLinearGradient(530,y,1095,y);reflection.addColorStop(0,'#d7edca00');reflection.addColorStop(.38,'#c8dfbc22');reflection.addColorStop(.63,'#fff2bf48');reflection.addColorStop(1,'#cee4bd00');stroke(gc,[555+shift,y,690+shift,y-5,860-shift,y+5,1090-shift,y],reflection,i%6===0?1.8:1.1);}
    gc.save();gc.globalCompositeOperation='screen';for(let i=0;i<26;i++){const y=590+i*10,x=805+Math.sin(time*.31+i*.8)*18,widthLine=26+(i%5)*12;gc.strokeStyle='rgba(255,241,184,'+(.05+(i%4)*.025)+')';gc.lineWidth=i%6===0?2:1;gc.beginPath();gc.moveTo(x-widthLine,y);gc.lineTo(x+widthLine,y+Math.sin(i)*2);gc.stroke();}
    for(const s of waterSpecks){const twinkle=.2+.8*(Math.sin(time*s.speed+s.phase)+1)/2;ellipse(gc,s.x+Math.sin(time*.2+s.phase)*4,s.y,s.size*twinkle,.6,'rgba(255,246,203,'+(.08+twinkle*.22)+')');}gc.restore();
    for(const r of ripples){const p=(time*r.speed+r.phase)%1,radius=4+p*r.size;gc.strokeStyle='rgba(220,242,224,'+Math.sin(p*Math.PI)*.25+')';gc.lineWidth=.8;gc.beginPath();gc.ellipse(r.x+driftX*.3,r.y,radius,radius*.17,0,0,TAU);gc.stroke();}
    glow(gc,817+Math.sin(time*.14)*14,694,245,'239,239,190',.13);gc.restore();
    for(let i=0;i<20;i++){const x=896+i*1.55,shimmer=.16+.2*Math.sin(time*1.2+i*.8);stroke(gc,[x,489,x+Math.sin(i)*2,518,x+8,545,x+27,586],'rgba(227,246,224,'+shimmer+')',i%4===0?2:1);const drop=(time*.36+i/20)%1;ellipse(gc,x+27*drop*drop,489+97*drop,.8,2.5,'#fff5c956');}
    for(let i=0;i<4;i++){const p=(time*.21+i/4)%1;gc.strokeStyle='rgba(229,246,226,'+(1-p)*.34+')';gc.lineWidth=1;gc.beginPath();gc.ellipse(938,593,5+p*58,2+p*9,0,0,TAU);gc.stroke();}
    for(const b of bambooLeaves){const breeze=Math.sin(time*.34+b.phase)*.075+Math.sin(time*.11+b.phase*.3)*.035;const x=b.x+b.dir*Math.sin(time*.24+b.phase)*3,y=b.y+Math.cos(time*.18+b.phase)*1.2;leafShape(gc,x,y,b.len,b.wid,b.depth?'#416b5970':'#3f6f58a5',b.dir*(.08+breeze),b.depth?'#c6d6a72c':'#dfe4b351',b.depth?.7:1);}
  }
  function draw(time,both){if(lastKind==='stretch'||both)renderForest(time);if(lastKind==='meditation'||both)renderGarden(time);}
  function resize(){const box=host.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);ratio=Math.min(window.devicePixelRatio||1,1.6,Math.sqrt(1800000/(width*height)));scale=Math.max(width/W,height/H);left=(width-W*scale)*(width<600?.69:.5);for(const canvas of[forest,garden]){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);}draw(motion.matches?0:performance.now()/1000,true);wake();}
  function loop(now){frame=0;if(document.hidden||!visible||motion.matches)return;if(now-previous>=40){previous=now;driftX+=(pointerX-driftX)*.035;driftY+=(pointerY-driftY)*.035;draw(now/1000,now<transitionUntil);}frame=requestAnimationFrame(loop);}
  function wake(){if(frame){cancelAnimationFrame(frame);frame=0;}if(document.hidden||!visible)return;if(motion.matches){driftX=0;driftY=0;draw(0,true);return;}frame=requestAnimationFrame(loop);}
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(()=>{const next=document.body.dataset.kind,session=document.body.classList.contains('in-session');if(next!==lastKind){lastKind=next;transitionUntil=performance.now()+1600;draw(motion.matches?0:performance.now()/1000,true);wake();}if(session!==inSession){inSession=session;resize();}}).observe(document.body,{attributes:true,attributeFilter:['data-kind','class']});
  motion.addEventListener('change',wake);document.addEventListener('visibilitychange',wake);window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});window.addEventListener('pageshow',wake);
  window.addEventListener('pointermove',event=>{if(!finePointer.matches||motion.matches)return;pointerX=(event.clientX/window.innerWidth-.5)*9;pointerY=(event.clientY/window.innerHeight-.5)*5;},{passive:true});
  resize();
})();
