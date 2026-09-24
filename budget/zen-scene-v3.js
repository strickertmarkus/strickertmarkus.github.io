/* Stretch forest: cached woodland and tree geometry, animated canopy and fireflies. */
(function(){
  'use strict';
  const host=document.querySelector('.landscape');
  if(!host)return;
  const forest=host.querySelector('.landscape-forest');
  const fc=forest.getContext('2d');
  if(!fc)return;
  const W=1200,H=900,TAU=Math.PI*2;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=window.matchMedia('(pointer: fine)');
  let seed=58127;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const range=(a,b)=>a+random()*(b-a);
  const layer=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
  const woodland=layer(),wood=layer();
  const leaves=[],fireflies=[];
  let width=0,height=0,ratio=1,scale=1,left=0;
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
    for(let i=0;i<22;i++)canopyBlob(c,range(-35,1235),range(-45,105),range(52,116),range(28,68),['#0e2f247a','#153b2870','#214b3066'][i%3]);
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
  makeForest();

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
  function draw(time){
    if(motion.matches){driftX=0;driftY=0;}
    else{driftX+=(pointerX-driftX)*.035;driftY+=(pointerY-driftY)*.035;}
    renderForest(time);
  }
  function resize(){
    const box=host.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);
    ratio=Math.min(window.devicePixelRatio||1,1.6,Math.sqrt(1800000/(width*height)));
    scale=Math.max(width/W,height/H);left=(width-W*scale)*(width<600?.69:.5);
    forest.width=Math.round(width*ratio);forest.height=Math.round(height*ratio);
    draw(motion.matches?0:performance.now()/1000);
  }
  window.addEventListener('pointermove',event=>{if(!finePointer.matches||motion.matches)return;pointerX=(event.clientX/window.innerWidth-.5)*9;pointerY=(event.clientY/window.innerHeight-.5)*5;},{passive:true});
  window.ZenSceneRuntime.register({kind:'stretch',interval:40,fade:true,draw,resize});
})();
