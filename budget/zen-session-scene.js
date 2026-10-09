/* Presentation only: the runner sends snapshots from its one authoritative clock.
   Cached scenery and pose art have independent compositions for the two rituals. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),host=$('session-view'),canvas=$('session-landscape'),poseCanvas=$('session-pose');
 if(!host||!canvas)return;
 const c=canvas.getContext('2d'),p=poseCanvas.getContext('2d'),still=document.createElement('canvas'),b=still.getContext('2d');
 const leafFlashes=Array(16).fill(-Infinity);
 let sampledAt=0,lastLeaf=-1,poseStarted=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let width=0,height=0,dpr=1,frame=0,last=0,active=false,snapshot={},previousIndex=-1,previousKind='',ripples=[],pointer={x:0,y:0},idle=0,transitionTimer=0,motionTime=0,keyboardMode=false;
 const TAU=Math.PI*2;
 let seed=47;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function ellipse(ctx,x,y,rx,ry,color,angle=0){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),angle,0,TAU);ctx.fill();}
 function glow(ctx,x,y,r,color,alpha){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 function line(ctx,points,color,w){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
 function leaf(ctx,x,y,size,angle,color){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(size*.1,-size*.48,size,0);ctx.quadraticCurveTo(size*.4,size*.34,0,0);ctx.fill();ctx.restore();}
 function forest(){
  const sky=b.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#061811');sky.addColorStop(.48,'#173e28');sky.addColorStop(1,'#03130d');b.fillStyle=sky;b.fillRect(0,0,width,height);
  glow(b,width*.56,height*.4,height*.65,'155,208,107',.17);
  // Distant trunks, then large near roots: a dedicated clearing, not the home tree.
  for(let i=0;i<38;i++){let x=random()*width,y=height*(.56+random()*.18),w=2+random()*9;b.strokeStyle=`rgba(89,135,89,${.06+random()*.1})`;b.lineWidth=w;b.beginPath();b.moveTo(x,y);b.bezierCurveTo(x-20,y*.5,x+20,height*.1,x-10,-20);b.stroke();}
  for(const side of [-1,1]){
   const x=side<0?-width*.05:width*1.05,w=width*.105;
   b.fillStyle='#071c12';b.beginPath();b.moveTo(x-side*w,height*.92);b.bezierCurveTo(x-side*w*.2,height*.53,x-side*w*.3,height*.18,x-side*w*2,-40);b.lineTo(x+side*w,-40);b.lineTo(x+side*w,height);b.closePath();b.fill();
   for(let i=0;i<12;i++){const y=height*(.24+i*.05);b.strokeStyle='#527b3730';b.lineWidth=.8;b.beginPath();b.moveTo(x-side*w*.3,y);b.bezierCurveTo(x-side*w*.8,y+60,x-side*w*(2+random()),height*.95,x-side*w*(2+random()*3),height);b.stroke();}
   for(let i=0;i<65;i++){const lx=side<0?random()*width*.25:width-random()*width*.25,ly=random()*height*.2;leaf(b,lx,ly,15+random()*50,random()*TAU,['#1c3c1a','#294d23','#365b28','#416331'][i%4]);}
  }
  // Soft moss terraces, fine luminous roots and floating pollen.
  for(let j=0;j<4;j++){b.strokeStyle=['#477d2933','#75974a33','#a1b86a18','#6a8e3d22'][j];b.lineWidth=1;b.beginPath();for(let x=0;x<width;x+=4){const y=height*(.8+j*.04)+Math.sin(x/width*6+j)*height*.025;x?b.lineTo(x,y):b.moveTo(x,y);}b.stroke();}
  for(let i=0;i<180;i++){const x=random()*width,y=height*(.78+random()*.2);leaf(b,x,y,3+random()*12,random()*TAU,i%4?'#496a3122':'#a4c67a44');}
  const shade=b.createLinearGradient(0,0,0,height);shade.addColorStop(0,'#03120e99');shade.addColorStop(.23,'#03120e11');shade.addColorStop(.7,'#03120e00');shade.addColorStop(1,'#03120ecc');b.fillStyle=shade;b.fillRect(0,0,width,height);
 }
 function shore(){
  const sky=b.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#102f2a');sky.addColorStop(.38,'#486f60');sky.addColorStop(.6,'#698d78');sky.addColorStop(.61,'#365f51');sky.addColorStop(1,'#082d29');b.fillStyle=sky;b.fillRect(0,0,width,height);
  glow(b,width*.5,height*.35,height*.6,'248,216,149',.14);
  // Receding hills and a separate lower water plane leave room around the guide.
  for(let j=0;j<4;j++){b.fillStyle=['#31584c66','#244b4055','#173f3666','#143b3288'][j];b.beginPath();b.moveTo(0,height*.62);for(let x=0;x<=width+10;x+=10)b.lineTo(x,height*(.43+j*.048)-Math.sin(x/width*5+j)*height*.04);b.lineTo(width,height*.63);b.lineTo(0,height*.63);b.fill();}
  for(const side of [-1,1])for(let i=0;i<7;i++){
   const x=side<0?width*(.015+i*.018):width*(.985-i*.018),lean=side*(10+i*5),top=-50+random()*height*.22,base=height*(.71+random()*.12),thick=4+random()*6;
   line(b,[[x,base],[x+lean,top]],i<3?'#092d26':'#1c4a37',thick+3);line(b,[[x-2,base],[x+lean-2,top]],'#65835a55',1.4);
   for(let y=base-40;y>top;y-=52){const xx=x+lean*(base-y)/(base-top);line(b,[[xx-thick*.6,y],[xx+thick*.6,y]],'#9eb38044',2);if(random()>.48)for(let l=0;l<5;l++)leaf(b,xx,y,18+random()*30,(side<0?-.4:3.5)+(random()-.5),l%2?'#163f2e':'#285d3c');}
  }
  for(let i=0;i<16;i++){const side=i%2?-1:1,x=side<0?random()*width*.14:width-random()*width*.14,y=height*(.57+random()*.09);ellipse(b,x,y,12+random()*40,8+random()*20,'#16382d');ellipse(b,x,y-4,10+random()*30,4+random()*8,'#64826755');}
  const shade=b.createLinearGradient(0,0,0,height);shade.addColorStop(0,'#0b282977');shade.addColorStop(.6,'#0b282900');shade.addColorStop(1,'#062721aa');b.fillStyle=shade;b.fillRect(0,0,width,height);
 }
 function makeSun(){
  const surface=$('session-sun-surface');if(!surface)return;surface.width=384;surface.height=384;
  const ctx=surface.getContext('2d'),pixels=ctx.createImageData(384,384);
  const hash=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;};
  for(let y=0;y<384;y++)for(let x=0;x<384;x++){
   const r=Math.hypot((x-191.5)/191.5,(y-191.5)/191.5),i=(y*384+x)*4;if(r>1)continue;
   const limb=Math.pow(Math.max(0,1-r*r),.24),grain=(noise(x/2.3,y/2.3)-.5)*8+(noise(x/13,y/13)-.5)*6;
   pixels.data[i]=255;pixels.data[i+1]=183+limb*61+grain;pixels.data[i+2]=87+limb*94+grain*1.4;pixels.data[i+3]=Math.min(255,(1-r)*384*255);
  }
  ctx.putImageData(pixels,0,0);
 }
 makeSun();
 function resize(){
  if(!active)return;const r=host.getBoundingClientRect();if(!r.width||!r.height)return;width=r.width;height=Math.max(r.height,host.scrollHeight);dpr=Math.min(devicePixelRatio||1,1.6);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);c.setTransform(dpr,0,0,dpr,0,0);still.width=canvas.width;still.height=canvas.height;b.setTransform(dpr,0,0,dpr,0,0);seed=47;
  snapshot.kind==='meditation'?shore():forest();
  const pr=poseCanvas.getBoundingClientRect();poseCanvas.width=Math.max(1,Math.round(pr.width*dpr));poseCanvas.height=Math.max(1,Math.round(pr.height*dpr));p.setTransform(dpr,0,0,dpr,0,0);paint(performance.now());
 }
 // Anatomical silhouettes are drawn as shaded, joined forms, never a generic timer icon.
 const poses={
  arrive:{head:[150,50],torso:[[150,86],[150,158]],arms:[[[134,91],[126,135],[124,166]],[[166,91],[174,135],[176,166]]],legs:[[[141,159],[137,210],[130,261]],[[159,159],[163,210],[170,261]]]},
  neck:{head:[150,50],torso:[[150,86],[150,158]],arms:[[[134,91],[118,125],[115,157]],[[166,91],[181,125],[185,157]]],legs:[[[141,159],[137,210],[130,261]],[[159,159],[163,210],[170,261]]]},
  'side-left':{head:[120,52],torso:[[127,87],[150,156]],arms:[[[111,92],[103,132],[117,167]],[[141,81],[139,41],[110,16]]],legs:[[[142,158],[129,211],[114,261]],[[157,158],[172,210],[183,261]]]},
  'side-right':{mirror:'side-left'},
  cat:{head:[91,127],torso:[[111,145],[189,142]],arms:[[[113,150],[109,196],[103,229]],[[125,151],[120,192],[118,229]]],legs:[[[186,146],[191,223],[230,226]],[[175,148],[175,212],[215,216]]]},
  child:{head:[104,197],torso:[[126,190],[183,171]],arms:[[[126,195],[86,217],[45,222]],[[130,186],[90,205],[46,211]]],legs:[[[182,177],[159,225],[215,222]],[[185,169],[173,214],[216,210]]]},
  'hip-left':{head:[127,65],torso:[[135,98],[153,169]],arms:[[[120,109],[101,149],[98,185]],[[149,107],[161,148],[131,176]]],legs:[[[146,171],[100,182],[82,252]],[[160,176],[193,248],[244,249]]]},
  'hip-right':{mirror:'hip-left'},
  fold:{head:[139,158],torso:[[134,183],[92,221]],arms:[[[143,185],[179,206],[214,224]],[[126,177],[171,196],[210,216]]],legs:[[[93,224],[161,233],[234,232]],[[95,214],[163,218],[231,219]]]},
  rest:{head:[55,208],torso:[[89,214],[161,218]],arms:[[[93,222],[129,240],[166,238]],[[93,203],[129,194],[164,200]]],legs:[[[159,222],[208,234],[259,239]],[[159,211],[210,214],[260,217]]]}
 };
 // Animate the joints of each exercise; the shared motion clock freezes on pause.
 function animatedPose(key,t){
  const source=poses[key];if(!source)return null;
  const pose={head:[...source.head],torso:source.torso.map(v=>[...v]),arms:source.arms.map(a=>a.map(v=>[...v])),legs:source.legs.map(a=>a.map(v=>[...v]))};
  if(reduced.matches)return pose;
  const cycle=t*TAU/6,breathe=Math.sin(t*TAU/7),ease=(1-Math.cos(cycle))/2;
  const upper=[pose.head,...pose.torso.slice(0,-1),...pose.arms.flat()];
  const rotate=(points,pivot,angle)=>points.forEach(v=>{const x=v[0]-pivot[0],y=v[1]-pivot[1];v[0]=pivot[0]+x*Math.cos(angle)-y*Math.sin(angle);v[1]=pivot[1]+x*Math.sin(angle)+y*Math.cos(angle);});
  if(key==='neck'){
   // Shoulders lift, sweep back and release; elbows and hands follow the joints.
   pose.arms.forEach((arm,i)=>{const side=i?1:-1,dx=side*7*Math.sin(cycle),dy=-12*ease;
    arm.forEach((v,j)=>{v[0]+=dx*[1,.75,.45][j];v[1]+=dy*[1,.85,.65][j];});
   });
   pose.torso[0][1]-=3*ease;
  }else if(key==='side-left'){
   rotate(upper,pose.torso[1],-.12*Math.sin(cycle));
  }else if(key==='cat'){
   const arch=18*Math.sin(cycle);
   pose.torso.splice(1,0,[150,143-arch]);pose.head[1]+=arch*.45;pose.head[0]+=arch*.15;
   pose.arms.forEach(a=>a[0][1]-=arch*.12);
  }else if(key==='child'){
   rotate(upper,pose.torso[1],-.08*ease);pose.torso[1][0]+=3*ease;
  }else if(key==='hip-left'){
   const shift=-9*ease;upper.forEach(v=>v[0]+=shift);pose.torso[1][0]+=shift;
   pose.legs.forEach(leg=>leg[0][0]+=shift);
  }else if(key==='fold'){
   rotate(upper,pose.torso[1],.13*ease);
  }else if(key==='rest'){
   pose.torso[0][1]-=2*breathe;pose.arms.forEach(a=>a[0][1]-=breathe);
  }else{
   pose.torso[0][1]-=2*breathe;pose.head[1]-=breathe;
   pose.arms.forEach(a=>a.forEach((v,j)=>v[1]-=breathe*(2-j*.5)));
  }
  return pose;
 }
 function torso(points,color,width){
  p.strokeStyle=color;p.lineWidth=width;p.lineCap='round';p.beginPath();p.moveTo(...points[0]);
  if(points.length===3)p.quadraticCurveTo(...points[1],...points[2]);else p.lineTo(...points[1]);p.stroke();
 }
 function drawPose(t,now){
  const w=poseCanvas.width/dpr,h=poseCanvas.height/dpr;if(w<2||h<2)return;p.clearRect(0,0,w,h);
  const s=Math.min(w/340,h/330),cx=w/2,cy=h*.48;
  p.save();p.translate(cx-150*s,cy-148*s);p.scale(s,s);
  // Interpolate the latest authoritative timing snapshot between its 200ms updates.
  // No second session clock: pause, step changes and tab recovery still come from zen.js.
  const drift=snapshot.paused||snapshot.preparing||snapshot.done?0:Math.max(0,now-sampledAt)/1000/(snapshot.step?.seconds||1);
  const progress=snapshot.done?1:Math.min(1,(snapshot.stepProgress||0)+drift);
  const hit=Math.min(15,Math.floor(progress*16));
  if(hit>lastLeaf){if(lastLeaf>=0&&hit-lastLeaf===1)leafFlashes[hit]=t;lastLeaf=hit;}
  const orbit=(a)=>[150+Math.cos(a)*139,148+Math.sin(a)*144];
  const arc=()=>{p.beginPath();p.ellipse(150,148,139,144,0,-Math.PI/2,-Math.PI/2+TAU*progress);};
  p.save();
  p.beginPath();p.ellipse(150,148,139,144,0,0,TAU);p.strokeStyle='#93c46644';p.lineWidth=1.1;p.stroke();
  // Broad bloom, a saturated core, then a fine bright filament.
  p.shadowColor='#b9ff6c';p.shadowBlur=22;p.strokeStyle='#9de55f55';p.lineWidth=6;arc();p.stroke();
  p.shadowBlur=12;p.strokeStyle='#c9f996';p.lineWidth=2.1;arc();p.stroke();
  p.shadowBlur=0;p.strokeStyle='#efffd0';p.lineWidth=.65;arc();p.stroke();
  p.restore();
  for(let i=0;i<16;i++){
   const a=-Math.PI/2+i/16*TAU,[x,y]=orbit(a),lit=i/16<=progress,age=t-leafFlashes[i];
   if(lit)glow(p,x,y,20,'184,245,123',.32);
   p.save();if(lit){p.shadowColor='#cbff92';p.shadowBlur=9;}
   // Center each leaf on the exact timer path, so contact and flash coincide.
   const angle=a,size=25;
   leaf(p,x-Math.cos(angle)*size/2,y-Math.sin(angle)*size/2,size,angle,lit?'#e4ffb7':'#85ad62');
   line(p,[[x-Math.cos(angle)*7,y-Math.sin(angle)*7],[x+Math.cos(angle)*7,y+Math.sin(angle)*7]],lit?'#709b43':'#c2df9388',.8);p.restore();
   if(!reduced.matches&&age>=0&&age<1.35){
    const q=age/1.35,alpha=Math.sin(Math.PI*Math.min(1,q*3))*(1-q);
    glow(p,x,y,22+q*10,'220,255,162',alpha*.6);
    p.save();p.strokeStyle=`rgba(218,255,158,${(1-q)*.9})`;p.lineWidth=1.4*(1-q)+.35;p.shadowColor='#c2ff83';p.shadowBlur=13;
    p.beginPath();p.arc(x,y,12+q*19,0,TAU);p.stroke();p.restore();
   }
  }
  const [tipX,tipY]=orbit(-Math.PI/2+TAU*progress);
  glow(p,tipX,tipY,24,'193,255,139',.5);ellipse(p,tipX,tipY,2.3,2.3,'#f0ffd2');
  // The movement stays readable, but sits quietly inside the timer garden.
  p.translate(150,148);p.scale(.66,.66);p.translate(-150,-148);p.globalAlpha=.76;
  ellipse(p,150,268,78,9,'#b5d78413');ellipse(p,150,270,61,3,'#d8eca51f');
  const key=snapshot.step?.id,poseKey=poses[key]?.mirror||key;
  if(poses[key]?.mirror){p.translate(300,0);p.scale(-1,1);}
  const pose=animatedPose(poseKey,t-poseStarted);
  if(!pose){glow(p,150,150,90,'168,216,125',.18);p.fillStyle='#daecc6';p.font='italic 25px Georgia';p.textAlign='center';p.fillText('Din rörelse',150,145);p.font='12px sans-serif';p.fillText('Följ din egen instruktion',150,170);p.restore();return;}
  const cloth=p.createLinearGradient(110,80,177,230);cloth.addColorStop(0,'#e5edc4');cloth.addColorStop(.45,'#a5bd90');cloth.addColorStop(1,'#6b9271');
  for(const leg of pose.legs){line(p,leg,'#213f2c',20);line(p,leg,cloth,15);const end=leg[2];line(p,[[end[0],end[1]],[end[0]+(end[0]>150?9:-9),end[1]+2]],'#c6d7a9',9);}
  torso(pose.torso,'#294936',39);torso(pose.torso,cloth,33);
  // Shoulder band and gently shaded head make the figure legible at phone sizes.
  for(const arm of pose.arms){line(p,arm,'#244530',14);line(p,arm,'#c6d8af',10);ellipse(p,arm[2][0],arm[2][1],5,6,'#dae4bc');}
  line(p,[[pose.head[0],pose.head[1]+14],pose.torso[0]],'#c2d1a4',10);
  const skin=p.createRadialGradient(pose.head[0]-5,pose.head[1]-5,1,...pose.head,24);skin.addColorStop(0,'#f0edcb');skin.addColorStop(1,'#8fa87b');ellipse(p,...pose.head,16,21,skin,-.05);
  p.strokeStyle='#dceab980';p.lineWidth=1;p.beginPath();p.moveTo(pose.torso[0][0]-10,pose.torso[0][1]);p.lineTo(pose.torso.at(-1)[0]-11,pose.torso.at(-1)[1]);p.stroke();
  if(key?.startsWith('side'))glow(p,144,133,25,'210,255,143',.22);
  if(key?.startsWith('hip'))glow(p,150,172,24,'210,255,143',.25);
  if(key==='neck')for(const arm of pose.arms)glow(p,...arm[0],12,'210,255,143',.2);
  p.restore();
 }
 function paint(now){
  if(!active)return;const t=motionTime;c.clearRect(0,0,width,height);c.drawImage(still,0,0,width,height);
  if(snapshot.kind==='meditation'){
   const sun=$('breathing-field').getBoundingClientRect(),rect=host.getBoundingClientRect(),sx=sun.left+sun.width/2-rect.left,horizon=height*.61;
   const scale=snapshot.scale||1;
   for(let i=0;i<58;i++){const z=i/58,y=horizon+z*height*.35,w=(12+z*90)*scale,offset=Math.sin(i*2+t*.8)*w*.28;const alpha=(1-z)*(.025+.045*Math.sin(i*5+t)**2);line(c,[[sx-w+offset,y],[sx+w+offset,y]],`rgba(253,228,170,${alpha})`,1+z*2);}
   for(let i=0;i<20;i++){const y=horizon+(i/20)*height*.37,x=(i*117.1%width);line(c,[[x,y],[x+25+Math.sin(t*.3+i)*12,y]],'#d3ead214',.7);}
   for(const r of ripples){const age=(now-r.at)/1000;if(age>7)continue;const q=age/7;c.save();c.globalAlpha=(1-q)*.25;c.strokeStyle='#efdfaf';c.lineWidth=1;c.beginPath();c.ellipse(r.x,r.y,12+q*width*.5,3+q*height*.09,0,0,TAU);c.stroke();c.restore();}ripples=ripples.filter(r=>now-r.at<7000);
   // Waterfall at the far right, outside the breathing guide and controls.
   for(let i=0;i<12;i++){const x=width*.91+Math.sin(i*2)*width*.025,y=height*.46;line(c,[[x,y],[x+Math.sin(t*1.4+i)*2,height*.62]],`rgba(206,230,204,${.035+i%3*.015})`,1.3);}
  }else{
   for(let i=0;i<38;i++){const x=((i*197.7)%width)+Math.sin(t*.25+i)*16+pointer.x*5,y=height*(.13+(i*0.071% .65))+Math.cos(t*.3+i)*12;const alpha=.14+.22*(1+Math.sin(t*.8+i))/2;glow(c,x,y,22,'190,255,112',alpha*.48);glow(c,x,y,8,'224,255,164',alpha*.85);ellipse(c,x,y,1.5,1.5,`rgba(239,255,194,${Math.min(1,alpha*1.7)})`);}
   for(let i=0;i<9;i++){const x=(i*137.3+t*7)%width,y=(i*101+t*8)%(height*.8);leaf(c,x,y,4+ i%3,Math.sin(t*.3+i),'#b6d17d30');}
   drawPose(t,now);
  }
 }
 function loop(now){frame=0;if(!active||document.hidden)return;const delta=last?Math.min(100,now-last):0;if(!snapshot.paused&&!snapshot.preparing&&!reduced.matches)motionTime+=delta/1000;last=now;paint(now);if(!reduced.matches&&!snapshot.paused)frame=requestAnimationFrame(loop);}
 function wake(){cancelAnimationFrame(frame);frame=0;last=0;if(active&&!document.hidden){paint(performance.now());if(!reduced.matches&&!snapshot.paused)frame=requestAnimationFrame(loop);}}
 function showControls(){clearTimeout(idle);host.classList.remove('controls-asleep');$('reveal-session-controls').hidden=true;
  if(active&&snapshot.kind==='meditation'&&!snapshot.paused&&!snapshot.done&&!$('session-audio').open)idle=setTimeout(()=>{if(keyboardMode&&host.contains(document.activeElement))return;if(host.contains(document.activeElement)&&document.activeElement.matches('button,input,summary'))document.activeElement.blur();host.classList.add('controls-asleep');$('reveal-session-controls').hidden=false;},9000);
 }
 host.addEventListener('pointerdown',event=>{keyboardMode=false;if(host.classList.contains('controls-asleep')){event.preventDefault();showControls();}else showControls();},{capture:true});
 host.addEventListener('pointermove',e=>{pointer.x=e.clientX/Math.max(1,width)-.5;pointer.y=e.clientY/Math.max(1,height)-.5;});
 host.addEventListener('keydown',()=>{keyboardMode=true;showControls();});$('reveal-session-controls').onclick=showControls;$('session-audio').addEventListener('toggle',showControls);
 document.addEventListener('zen:session-frame',e=>{
  const next=e.detail,old=snapshot;snapshot=next;sampledAt=performance.now();
  if(next.index!==old.index||(next.stepProgress||0)<(old.stepProgress||0)-.01){lastLeaf=-1;leafFlashes.fill(-Infinity);}
  if(next.kind!==previousKind){previousKind=next.kind;previousIndex=-1;resize();showControls();}
  if(next.kind==='stretch'&&next.index!==previousIndex&&next.step){
   previousIndex=next.index;poseStarted=motionTime;host.classList.remove('step-changing');void host.offsetWidth;host.classList.add('step-changing');clearTimeout(transitionTimer);transitionTimer=setTimeout(()=>host.classList.remove('step-changing'),700);
   host.classList.toggle('is-rest',next.step.id==='rest');poseCanvas.setAttribute('aria-label',next.step.name+' — '+next.step.cue);
   $('session-stage-caption').textContent=next.step.id==='rest'?'Låt kroppen landa':next.step.id?.includes('side-')?'Längd genom hela sidan':'En rörelse. Ett andetag i taget.';
   $('session-trail').replaceChildren(...next.steps.map((step,i)=>{const li=document.createElement('li');li.style.flex=String(step.seconds||1);li.title=step.name;li.setAttribute('aria-label',(i+1)+'. '+step.name+(i<next.index?' · avklarad':''));li.dataset.state=i<next.index?'done':'waiting';if(i===next.index)li.setAttribute('aria-current','step');li.appendChild(document.createElement('span'));return li;}));
  }
  if(next.done)$('session-trail').querySelectorAll('li').forEach(li=>{li.dataset.state='done';li.removeAttribute('aria-current');});
  if(next.phase==='Andas ut'&&old.phase!==next.phase&&!reduced.matches)ripples.push({x:width*.5,y:height*.65,at:performance.now()});
  if(next.paused!==old.paused||next.done!==old.done){showControls();wake();}
  if(reduced.matches||next.paused)paint(performance.now());
 });
 document.addEventListener('zen:session-view',e=>{active=e.detail.view==='session';snapshot={kind:e.detail.kind};sampledAt=performance.now();lastLeaf=-1;leafFlashes.fill(-Infinity);const clock=host.querySelector('.session-clock');host.querySelector(e.detail.kind==='meditation'?'.session-meta':'.session-guidance').appendChild(clock);previousKind='';previousIndex=-1;motionTime=0;clearTimeout(idle);host.classList.remove('controls-asleep');$('reveal-session-controls').hidden=true;if(active){resize();showControls();}wake();});
 const sceneSizeObserver=new ResizeObserver(()=>{if(active)resize();});sceneSizeObserver.observe(host);sceneSizeObserver.observe($('breathing-field'));
 document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake);
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);clearTimeout(idle);});window.addEventListener('pageshow',wake);
})();
