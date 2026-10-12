/* Presentation only: the runner sends snapshots from its one authoritative clock.
   Cached scenery and pose art have independent compositions for the two rituals. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),host=$('session-view'),canvas=$('session-landscape'),poseCanvas=$('session-pose');
 if(!host||!canvas)return;
 const c=canvas.getContext('2d'),p=poseCanvas.getContext('2d'),still=document.createElement('canvas'),b=still.getContext('2d');
 let sampledAt=0,poseStarted=0,poseTransition=null,previewKey='',previewStarted=0,previewStep=null;
 const preview=$('stretch-next-preview'),previewCanvas=$('next-pose'),previewContext=previewCanvas.getContext('2d');
 const poseBounds=new Map();
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
  // A quiet veil softens trunks behind the movement while the edges stay luminous.
  b.save();b.translate(width*.5,height*.43);b.scale(width*.48,height*.47);const veil=b.createRadialGradient(0,0,.1,0,0,1);veil.addColorStop(0,'#0b241bb8');veil.addColorStop(.55,'#0b241b80');veil.addColorStop(1,'#0b241b00');b.fillStyle=veil;b.fillRect(-1,-1,2,2);b.restore();
  const shade=b.createLinearGradient(0,0,0,height);shade.addColorStop(0,'#03120e99');shade.addColorStop(.23,'#03120e11');shade.addColorStop(.7,'#03120e00');shade.addColorStop(1,'#03120ecc');b.fillStyle=shade;b.fillRect(0,0,width,height);
 }
 // Cached atmospheric depth; only mist and water are animated per frame.
 function shore(){
  const horizon=height*.59;
  const sky=b.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#071f23');sky.addColorStop(.42,'#345650');sky.addColorStop(.59,'#698076');sky.addColorStop(.64,'#294b47');sky.addColorStop(1,'#061f23');b.fillStyle=sky;b.fillRect(0,0,width,height);
  glow(b,width*.52,height*.4,height*.52,'227,210,158',.16);
  // Uneven distant tree canopies dissolve into the humid air.
  for(let depth=0;depth<3;depth++){
   b.save();b.filter=`blur(${5-depth*1.7}px)`;b.fillStyle=['#47645e','#304f48','#203e39'][depth];
   b.beginPath();b.moveTo(-10,horizon+20);
   for(let x=-10;x<width+15;x+=3){const edge=Math.pow(Math.abs(x/width-.52)*2,1.6);const y=horizon-height*(.035+edge*(.10+depth*.025))+Math.sin(x*.017+depth*3)*height*.013+Math.sin(x*.073+depth)*3+random()*4;b.lineTo(x,y);}
   b.lineTo(width+15,horizon+20);b.closePath();b.fill();b.restore();
   b.save();b.translate(width*.5,horizon-depth*height*.023);b.scale(width*.85,height*.07);glow(b,0,0,1,'190,207,183',.17);b.restore();
  }
  const water=b.createLinearGradient(0,horizon,0,height);water.addColorStop(0,'#57736b');water.addColorStop(.12,'#2b514b');water.addColorStop(.55,'#133a36');water.addColorStop(1,'#071f23');b.fillStyle=water;b.fillRect(0,horizon,width,height-horizon);
  // Distant reflected trunks: muted, vertically stretched, broken by the water.
  for(let i=0;i<100;i++){const x=random()*width,z=Math.abs(x/width-.5)*2;line(b,[[x,horizon],[x+random()*8-4,horizon+height*(.01+random()*.12)*z]],'#112f2920',1+random()*4);}
  // Asymmetrical slender bamboo, with narrow pointed leaves rather than a flat border.
  for(const side of [-1,1])for(let i=0;i<(side<0?5:3);i++){
   const x=side<0?width*(-.025+i*.024):width*(1.01-i*.026),lean=side*(8+random()*25),base=height*(.73+random()*.09),top=-50,thick=3+random()*5;
   const stalk=b.createLinearGradient(x-thick,0,x+thick,0);stalk.addColorStop(0,'#071f20');stalk.addColorStop(.5,'#284a3c');stalk.addColorStop(.8,'#3a5741');stalk.addColorStop(1,'#0a2928');
   line(b,[[x,base],[x+lean,top]],stalk,thick);line(b,[[x+thick*.28,base],[x+lean+thick*.28,top]],'#b0b78622',.6);
   for(let y=base-30;y>top;y-=64+random()*35){
    const xx=x+lean*(base-y)/(base-top);line(b,[[xx-thick*.5,y],[xx+thick*.5,y-1]],'#a6b28a40',1);
    if(random()<.5)continue;
    const reach=(side<0?1:-1)*(20+random()*45),tip=xx+reach,by=y-12-random()*25;
    line(b,[[xx,y],[xx+reach*.45,y-8],[tip,by]],'#36563e',.8);
    for(let j=0;j<7;j++){
     const f=.25+j*.1,lx=xx+reach*f,ly=y+(by-y)*f,angle=(side<0?0:Math.PI)+(j%2?-.65:.8);
     b.save();b.translate(lx,ly);b.rotate(angle);b.scale(1,.32);leaf(b,0,0,16+random()*23,0,j%3?'#163a30':'#48634a');b.restore();
    }
   }
  }
  // Irregular low stone banks; mineral texture and moss catch only grazing light.
  for(const side of [-1,1])for(let i=0;i<5;i++){
   const x=side<0?random()*width*.1:width-random()*width*.08,y=height*(.72+i*.018),rx=18+random()*32,ry=9+random()*14;
   const rock=b.createLinearGradient(0,y-ry,0,y+ry);rock.addColorStop(0,'#41534a');rock.addColorStop(.23,'#263d35');rock.addColorStop(1,'#0a2524');b.fillStyle=rock;b.beginPath();
   for(let k=0;k<=12;k++){const a=k/12*TAU,r=.8+random()*.2;const px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;k?b.lineTo(px,py):b.moveTo(px,py);}b.closePath();b.fill();
   for(let k=0;k<35;k++)ellipse(b,x+(random()-.5)*rx*1.4,y-ry*.45+random()*ry*.4,.4+random(),.3,'#a0ab6c24');
  }
  // Fine atmospheric grain, fixed in the cache (no animated noise flicker).
  for(let i=0;i<width*height/65;i++)ellipse(b,random()*width,random()*height,.4,.4,i%2?'#e6dfbc09':'#00191b10');
  // Meet the browser chrome and safe areas with the same petrol shade, without a cut edge.
  const shade=b.createLinearGradient(0,0,0,height);shade.addColorStop(0,'#081f23');shade.addColorStop(.10,'#081f2340');shade.addColorStop(.38,'#081f2300');shade.addColorStop(.72,'#081f2322');shade.addColorStop(1,'#081f23');b.fillStyle=shade;b.fillRect(0,0,width,height);
 }
 function makeSun(){
  const surface=$('session-sun-surface');if(!surface)return;surface.width=384;surface.height=384;
  const ctx=surface.getContext('2d'),pixels=ctx.createImageData(384,384);
  const hash=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;};
  for(let y=0;y<384;y++)for(let x=0;x<384;x++){
   const r=Math.hypot((x-191.5)/191.5,(y-191.5)/191.5),i=(y*384+x)*4;if(r>1)continue;
   const limb=Math.pow(Math.max(0,1-r*r),.24),grain=(noise(x/2.3,y/2.3)-.5)*8+(noise(x/13,y/13)-.5)*6;
   pixels.data[i]=255;pixels.data[i+1]=225+limb*25+grain*.6;pixels.data[i+2]=151+limb*57+grain;pixels.data[i+3]=Math.min(255,(1-r)*110*255);
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
 function torso(p,points,color,width){
  p.strokeStyle=color;p.lineWidth=width;p.lineCap='round';p.beginPath();p.moveTo(...points[0]);
  if(points.length===3)p.quadraticCurveTo(...points[1],...points[2]);else p.lineTo(...points[1]);p.stroke();
 }
 function drawPose(t,now){
  const w=poseCanvas.width/dpr,h=poseCanvas.height/dpr;if(w<2||h<2)return;p.clearRect(0,0,w,h);
  const s=Math.min(w/350,h/350),cx=w/2,cy=h*.5;
  const blend=poseTransition&&!snapshot.paused&&!reduced.matches?Math.min(1,(now-poseTransition.at)/550):1;
  p.save();p.globalAlpha=blend;p.translate(cx-150*s,cy-148*s);p.scale(s,s);
  // Interpolate the latest authoritative timing snapshot between its 200ms updates.
  // No second session clock: pause, step changes and tab recovery still come from zen.js.
  const drift=snapshot.paused||snapshot.preparing||snapshot.done?0:Math.max(0,now-sampledAt)/1000/(snapshot.step?.seconds||1);
  const progress=snapshot.done?1:Math.min(1,(snapshot.stepProgress||0)+drift);
  const orbit=(a)=>[150+Math.cos(a)*139,148+Math.sin(a)*144];
  // Match Pulse Flow: a 260° sweep with the opening below the figure.
  const start=140*Math.PI/180,sweep=260*Math.PI/180;
  const arc=(fraction=progress)=>{p.beginPath();p.ellipse(150,148,139,144,0,start,start+sweep*fraction);};
  p.save();
  arc(1);p.lineCap='round';p.strokeStyle='#a3cb7880';p.lineWidth=1.5;p.stroke();
  // Broad bloom, a saturated core, then a fine bright filament.
  p.shadowColor='#b9ff6c';p.shadowBlur=22;p.strokeStyle='#9de55f55';p.lineWidth=6;arc();p.stroke();
  p.shadowBlur=12;p.strokeStyle='#c9f996';p.lineWidth=2.1;arc();p.stroke();
  p.shadowBlur=0;p.strokeStyle='#efffd0';p.lineWidth=.65;arc();p.stroke();
  p.restore();
  // Short luminous wake gives the moving point a clear direction.
  p.save();p.lineCap='round';
  for(let i=0;i<18;i++){const end=progress-i*.0025,begin=Math.max(0,end-.003);if(end<=0)break;p.beginPath();p.ellipse(150,148,139,144,0,start+sweep*begin,start+sweep*end);p.strokeStyle=`rgba(232,255,184,${.8*(1-i/18)})`;p.lineWidth=3.4*(1-i/24);p.shadowColor='#ceff8f';p.shadowBlur=10;p.stroke();}p.restore();
  const [tipX,tipY]=orbit(start+sweep*progress);
  glow(p,tipX,tipY,30,'193,255,139',.72);glow(p,tipX,tipY,13,'227,255,175',.95);ellipse(p,tipX,tipY,4.2,4.2,'#f4ffdc');
  // The movement stays readable, but sits quietly inside the timer garden.
  p.translate(150,148);p.scale(.66,.66);p.translate(-150,-148);p.globalAlpha*=.76;
  drawFigure(p,snapshot.step?.id,t-poseStarted,t);
  p.restore();
  if(poseTransition&&blend<1){p.save();p.globalAlpha=1-blend;p.drawImage(poseTransition.image,0,0,w,h);p.restore();}else poseTransition=null;
 }
 // One figure renderer serves the current movement and the upcoming preview.
 function drawFigure(p,key,elapsed,t){
  p.save();
  const pose=window.ZenStretch.frame(key,elapsed,reduced.matches);
  if(!pose){glow(p,150,150,90,'168,216,125',.18);p.fillStyle='#daecc6';p.font='italic 25px Georgia';p.textAlign='center';p.fillText('Din rörelse',150,145);p.font='12px sans-serif';p.fillText('Följ din egen instruktion',150,170);p.restore();return;}
  if(!poseBounds.has(key)){
   const neutral=window.ZenStretch.frame(key,0,true),points=[...neutral.torso,...neutral.arms.flat(),...neutral.legs.flat(),[neutral.head[0]-16,neutral.head[1]-21],[neutral.head[0]+16,neutral.head[1]+21]];
   const xs=points.map(v=>v[0]),ys=points.map(v=>v[1]);poseBounds.set(key,{x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2,bottom:Math.max(...ys)});
  }
  const bounds=poseBounds.get(key);p.translate(150-bounds.x,148-bounds.y);
  if(key==='rest'){
   const breath=reduced.matches?.5:(1-Math.cos((elapsed)*TAU/8))/2;
   p.save();p.translate(bounds.x,bounds.bottom+13);p.scale(1,.2);glow(p,0,0,100+breath*22,'192,237,139',.13+breath*.12);p.restore();
  }
  ellipse(p,bounds.x,bounds.bottom+15,78,7,'#b5d78413');ellipse(p,bounds.x,bounds.bottom+17,61,3,'#d8eca51f');
  const cloth=p.createLinearGradient(110,80,177,230);cloth.addColorStop(0,'#e5edc4');cloth.addColorStop(.45,'#a5bd90');cloth.addColorStop(1,'#6b9271');
  // Curved joints and shared shoulder roots keep the silhouette connected in motion.
  const limb=(points,color,weight)=>{p.strokeStyle=color;p.lineWidth=weight;p.lineCap='round';p.lineJoin='round';p.beginPath();p.moveTo(...points[0]);for(let i=1;i<points.length-1;i++){const a=points[i],n=points[i+1];p.quadraticCurveTo(...a,(a[0]+n[0])/2,(a[1]+n[1])/2);}p.lineTo(...points.at(-1));p.stroke();};
  p.shadowColor='#d9ffc0';p.shadowBlur=5;
  for(const [i,leg] of pose.legs.entries()){limb(leg,cloth,17);const end=leg[2],angle=pose.feet[i].angle;line(p,[end,[end[0]+Math.cos(angle)*12,end[1]+Math.sin(angle)*12]],'#bbd1a6',8);}
  const skinLimb=p.createLinearGradient(110,60,190,230);skinLimb.addColorStop(0,'#e3e8c0');skinLimb.addColorStop(.5,'#bbd0a5');skinLimb.addColorStop(1,'#8aaa86');
  for(const [i,arm] of pose.arms.entries()){limb([pose.torso[0],...arm],skinLimb,12);const a=pose.hands[i].angle;line(p,[arm[2],[arm[2][0]+Math.cos(a)*10,arm[2][1]+Math.sin(a)*10]],skinLimb,7);}
  line(p,[[pose.head[0],pose.head[1]+14],pose.torso[0]],skinLimb,12);
  p.shadowBlur=0;torso(p,pose.torso,cloth,35);
  const skin=p.createRadialGradient(pose.head[0]-5,pose.head[1]-5,1,...pose.head,24);skin.addColorStop(0,'#f0edcb');skin.addColorStop(1,'#8fa87b');ellipse(p,...pose.head,16,21,skin,pose.headAngle-.05);
  p.strokeStyle='#dceab980';p.lineWidth=1;p.beginPath();p.moveTo(pose.torso[0][0]-10,pose.torso[0][1]);p.lineTo(pose.torso.at(-1)[0]-11,pose.torso.at(-1)[1]);p.stroke();
  // Soft localized muscle light follows the animated joints, not fixed canvas coordinates.
  for(const region of pose.highlights){
   const strength=reduced.matches?.8:.72+.12*Math.sin(t*TAU/8);
   p.save();p.globalAlpha*=strength;p.shadowColor='#d4ff88';p.shadowBlur=18;
   line(p,[region.a,region.b],'#caff8177',region.r*1.5);p.shadowBlur=6;
   line(p,[region.a,region.b],'#edffc7b0',region.r*.5);
   glow(p,(region.a[0]+region.b[0])/2,(region.a[1]+region.b[1])/2,region.r*2,'199,255,114',.32);p.restore();
  }
  p.restore();
 }
 function updateNextPreview(){
  const following=snapshot.steps?.[snapshot.index+1];
  const remaining=(1-(snapshot.stepProgress||0))*(snapshot.step?.seconds||0);
  const visible=active&&snapshot.kind==='stretch'&&!snapshot.preparing&&!snapshot.done&&!!following&&remaining>0&&remaining<=7;
  preview.parentElement.classList.toggle('has-preview',visible);
  preview.setAttribute('aria-hidden',String(!visible));
  if(!visible){previewKey='';previewStep=null;return;}
  const key=snapshot.index+':'+following.id;
  if(previewKey!==key){
   previewKey=key;previewStarted=motionTime;previewStep=following;
   $('next-preview-name').textContent=following.name;
  }
  $('next-preview-time').textContent=snapshot.paused?'Nästa · pausat':'Nästa · om '+Math.ceil(remaining)+' s';
 }
 function drawNextPreview(t){
  if(!previewStep)return;
  const ctx=previewContext;ctx.clearRect(0,0,300,300);
  ctx.save();ctx.translate(150,148);ctx.scale(.88,.88);ctx.translate(-150,-148);
  drawFigure(ctx,previewStep.id,t-previewStarted,t);ctx.restore();
 }
 function paintSessionProgress(now){
  if(snapshot.kind!=='stretch')return;
  const total=(snapshot.steps||[]).reduce((n,step)=>n+step.seconds,0);
  const remaining=(snapshot.step?.seconds||0)*(1-(snapshot.stepProgress||0));
  const drift=snapshot.paused||snapshot.preparing||snapshot.done?0:Math.min(Math.max(0,remaining),Math.max(0,now-sampledAt)/1000);
  const progress=snapshot.done?1:Math.min(1,(snapshot.progress||0)+(total?drift/total:0));
  $('session-progress-fill').style.width=(progress*100)+'%';
 }
 function paint(now){
  if(!active)return;paintSessionProgress(now);const t=motionTime;c.clearRect(0,0,width,height);c.drawImage(still,0,0,width,height);
  if(snapshot.kind==='meditation'){
   const sun=$('breathing-field').getBoundingClientRect(),rect=host.getBoundingClientRect(),sx=sun.left+sun.width/2-rect.left,horizon=height*.59;
   const scale=snapshot.scale||1;
   const sy=sun.top+sun.height/2-rect.top;
   // Interpolate the runner's breathing snapshot; pause and reduced motion keep the light still.
   const drift=snapshot.paused||snapshot.preparing||reduced.matches?0:Math.min(.25,Math.max(0,now-sampledAt)/1000);
   const cycle=((snapshot.cycle||0)+drift)%10;
   const breath=(scale-.84)/.23,light=Math.max(0,Math.min(1,breath));
   c.save();c.globalCompositeOperation='screen';
   glow(c,sx,sy,Math.min(width*.85,height*.43),'255,239,174',.09+light*.07);
   // Shafts of pale sunlight echo the home scene, with very slow movement.
   for(let i=0;i<3;i++){
    const x=sx+width*(.13+i*.08)+Math.sin(t*.06+i)*width*.015;
    const beam=c.createLinearGradient(x,height*.04,x-width*.20,horizon+height*.16);
    beam.addColorStop(0,'rgba(255,239,176,0)');beam.addColorStop(.17,'rgba(255,239,176,.055)');beam.addColorStop(.5,'rgba(255,243,193,.028)');beam.addColorStop(1,'rgba(255,243,193,0)');
    c.fillStyle=beam;c.beginPath();c.moveTo(x,0);c.lineTo(x+width*.025,0);c.lineTo(x-width*.20,horizon+height*.16);c.lineTo(x-width*.32,horizon+height*.16);c.closePath();c.fill();
   }
   if(snapshot.guided&&!snapshot.preparing&&!reduced.matches){
    const q=cycle<4?cycle/4:(cycle-4)/6;
    const radius=sun.width*.38*scale+q*Math.min(width*.65,240),alpha=Math.sin(q*Math.PI)*.14;
    const wave=c.createRadialGradient(sx,sy,radius*.28,sx,sy,radius);
    wave.addColorStop(0,'rgba(255,246,196,0)');wave.addColorStop(.48,`rgba(255,240,169,${alpha*.4})`);wave.addColorStop(.72,`rgba(255,246,196,${alpha})`);wave.addColorStop(1,'rgba(255,246,196,0)');
    c.fillStyle=wave;c.fillRect(sx-radius,sy-radius,radius*2,radius*2);
   }
   c.restore();
   // Broad low bloom under a broken path of light. Breathing gently widens the reflection.
   c.save();c.translate(sx,horizon+height*.12);c.scale(width*.30*scale,height*.24);glow(c,0,0,1,'255,239,177',.11*scale);c.restore();
   for(let i=0;i<125;i++){
    const z=i/125,y=horizon+Math.pow(z,1.35)*height*.39,w=(5+z*z*width*.32)*scale;
    const wave=Math.sin(i*2.39+t*.36)+Math.sin(i*.71-t*.21),offset=wave*w*.23;
    const alpha=(1-z)*(.025+.095*Math.pow((1+Math.sin(i*1.7+t*.45))/2,3));
    for(let j=0;j<3;j++){const a=-1+j*.7,span=.15+.3*(1+Math.sin(i*3+j))/2;line(c,[[sx+offset+w*a,y],[sx+offset+w*(a+span),y]],`rgba(255,243,190,${alpha*1.25})`,.5+z*1.1);}
   }
   for(let i=0;i<45;i++){const z=i/45,y=horizon+z*height*.4,x=(i*117.1%width)+Math.sin(t*.15+i)*4;line(c,[[x,y],[x+8+z*30,y]],`rgba(151,183,168,${.02+z*.035})`,.6);}
   // Mist drifts at three different speeds and stays below the breathing sun.
   for(let i=0;i<3;i++){c.save();c.translate(width*(.25+i*.28)+Math.sin(t*.045+i*2)*width*.13,horizon-height*(.025+i*.027));c.scale(width*(.55+i*.12),height*.035);glow(c,0,0,1,'196,207,185',.08);c.restore();}
   for(const r of ripples){const age=t-r.at;if(age>7)continue;const q=age/7;c.save();c.globalAlpha=(1-q)*.10;c.strokeStyle='#dfd4ab';c.lineWidth=.65;c.beginPath();c.ellipse(r.x,r.y,12+q*width*.42,2+q*height*.032,0,0,TAU);c.stroke();c.restore();}ripples=ripples.filter(r=>t-r.at<7);
  }else{
   for(let i=0;i<38;i++){const x=((i*197.7)%width)+Math.sin(t*.25+i)*16+pointer.x*5,y=height*(.13+(i*0.071% .65))+Math.cos(t*.3+i)*12;const edge=Math.min(1,Math.abs(x-width*.5)/(width*.36));const alpha=(.14+.22*(1+Math.sin(t*.8+i))/2)*(.12+.88*edge*edge);glow(c,x,y,22,'190,255,112',alpha*.48);glow(c,x,y,8,'224,255,164',alpha*.85);ellipse(c,x,y,1.5,1.5,`rgba(239,255,194,${Math.min(1,alpha*1.7)})`);}
   for(let i=0;i<9;i++){const x=(i*137.3+t*7)%width,y=(i*101+t*8)%(height*.8);leaf(c,x,y,4+ i%3,Math.sin(t*.3+i),'#b6d17d30');}
   drawPose(t,now);drawNextPreview(t);
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
  if(next.kind!==previousKind){previousKind=next.kind;previousIndex=-1;resize();showControls();}
  if(next.kind==='stretch'&&next.index!==previousIndex&&next.step){
   const advance=previousIndex>=0&&next.index>previousIndex;
   if(previousIndex>=0&&!reduced.matches&&!next.paused){
    poseTransition=null;
    // Finish the outgoing arc visually; timing immediately continues in the new step.
    snapshot={...old,stepProgress:advance?1:old.stepProgress};drawPose(motionTime,performance.now());snapshot=next;
    const image=document.createElement('canvas');image.width=poseCanvas.width;image.height=poseCanvas.height;image.getContext('2d').drawImage(poseCanvas,0,0);poseTransition={image,at:performance.now()};
   }else poseTransition=null;
   previousIndex=next.index;poseStarted=motionTime;host.classList.remove('step-changing');void host.offsetWidth;host.classList.add('step-changing');clearTimeout(transitionTimer);transitionTimer=setTimeout(()=>host.classList.remove('step-changing'),700);
   host.classList.toggle('is-rest',next.step.id==='rest');poseCanvas.setAttribute('aria-label',next.step.name+' — '+next.step.cue);

   const total=next.steps.reduce((n,step)=>n+step.seconds,0);let offset=0;
   const leaves=next.steps.map((step,i)=>{const li=document.createElement('li');li.style.left=(offset/total*100)+'%';offset+=step.seconds;li.title=step.name;li.setAttribute('aria-label',(i+1)+'. '+step.name+(i<next.index?' · avklarad':''));li.dataset.state=i<next.index?'done':'waiting';if(i===next.index){li.setAttribute('aria-current','step');if(advance)li.classList.add('step-arrived');}li.appendChild(document.createElement('span'));return li;});
   const end=document.createElement('li');end.style.left='100%';end.title='Passet klart';end.setAttribute('aria-label','Passet klart');end.dataset.state='waiting';end.appendChild(document.createElement('span'));leaves.push(end);
   $('session-trail').replaceChildren(...leaves);
  }
  if(next.kind==='stretch'&&next.step){
   const cues=next.step.id==='rest'?['Låt kroppen landa','Ge andetaget plats']:next.step.id?.includes('side-')?['Längd genom hela sidan','Låt axlarna sjunka','Följ din egen andning']:['Hitta mjukhet i rörelsen','Följ din egen andning','Släpp spänningen lite till'];
   const cue=next.paused?'Ta den tid du behöver':next.preparing?'Hitta din position':cues[Math.min(cues.length-1,Math.floor((next.stepProgress||0)*cues.length))];
   const caption=$('session-stage-caption');if(caption.textContent!==cue){caption.getAnimations().forEach(a=>a.cancel());caption.textContent=cue;if(!reduced.matches)caption.animate([{opacity:0,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:900,easing:'ease-out'});}

  }
  updateNextPreview();
  if(next.done)$('session-trail').querySelectorAll('li').forEach(li=>{li.dataset.state='done';li.removeAttribute('aria-current');});
  if(next.phase==='Andas ut'&&old.phase!==next.phase&&!reduced.matches)ripples.push({x:width*.5,y:height*.65,at:motionTime});
  if(next.paused!==old.paused||next.done!==old.done){showControls();wake();}
  paintSessionProgress(performance.now());
  if(reduced.matches||next.paused)paint(performance.now());
 });
 document.addEventListener('zen:session-view',e=>{active=e.detail.view==='session';poseTransition=null;snapshot={kind:e.detail.kind};sampledAt=performance.now();const clock=host.querySelector('.session-clock');host.querySelector(e.detail.kind==='meditation'?'.session-meta':'.session-guidance').prepend(clock);const next=host.querySelector('.session-next');next.classList.remove('has-preview');previewStep=null;previewKey='';preview.setAttribute('aria-hidden','true');if(e.detail.kind==='stretch')host.querySelector('.session-bottom').prepend(next);else host.querySelector('.session-layout').appendChild(next);$('session-audio').open=false;previousKind='';previousIndex=-1;motionTime=0;clearTimeout(idle);host.classList.remove('controls-asleep');$('reveal-session-controls').hidden=true;if(active){resize();showControls();}wake();});
 const sceneSizeObserver=new ResizeObserver(()=>{if(active)resize();});sceneSizeObserver.observe(host);sceneSizeObserver.observe($('breathing-field'));
 host.addEventListener('pointerdown',e=>{const audio=$('session-audio');if(audio.open&&!audio.contains(e.target))audio.open=false;});host.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('session-audio').open){$('session-audio').open=false;$('session-audio').querySelector('summary').focus();}});
 document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake);
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);clearTimeout(idle);});window.addEventListener('pageshow',wake);
})();
