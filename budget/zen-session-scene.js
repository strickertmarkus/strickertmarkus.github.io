/* Presentation only: the runner sends snapshots from its one authoritative clock.
   Cached scenery and pose art have independent compositions for the two rituals. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),host=$('session-view'),canvas=$('session-landscape'),poseCanvas=$('session-pose');
 if(!host||!canvas)return;
 const c=canvas.getContext('2d'),p=poseCanvas.getContext('2d'),still=document.createElement('canvas'),b=still.getContext('2d');
 let sampledAt=0,poseStarted=0;
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
 function torso(points,color,width){
  p.strokeStyle=color;p.lineWidth=width;p.lineCap='round';p.beginPath();p.moveTo(...points[0]);
  if(points.length===3)p.quadraticCurveTo(...points[1],...points[2]);else p.lineTo(...points[1]);p.stroke();
 }
 function drawPose(t,now){
  const w=poseCanvas.width/dpr,h=poseCanvas.height/dpr;if(w<2||h<2)return;p.clearRect(0,0,w,h);
  const s=Math.min(w/350,h/350),cx=w/2,cy=h*.5;
  p.save();p.translate(cx-150*s,cy-148*s);p.scale(s,s);
  // Interpolate the latest authoritative timing snapshot between its 200ms updates.
  // No second session clock: pause, step changes and tab recovery still come from zen.js.
  const drift=snapshot.paused||snapshot.preparing||snapshot.done?0:Math.max(0,now-sampledAt)/1000/(snapshot.step?.seconds||1);
  const progress=snapshot.done?1:Math.min(1,(snapshot.stepProgress||0)+drift);
  const orbit=(a)=>[150+Math.cos(a)*139,148+Math.sin(a)*144];
  // Match Pulse Flow: a 260° sweep with the opening below the figure.
  const start=140*Math.PI/180,sweep=260*Math.PI/180;
  const arc=(fraction=progress)=>{p.beginPath();p.ellipse(150,148,139,144,0,start,start+sweep*fraction);};
  p.save();
  arc(1);p.lineCap='round';p.strokeStyle='#93c46644';p.lineWidth=1.1;p.stroke();
  // Broad bloom, a saturated core, then a fine bright filament.
  p.shadowColor='#b9ff6c';p.shadowBlur=22;p.strokeStyle='#9de55f55';p.lineWidth=6;arc();p.stroke();
  p.shadowBlur=12;p.strokeStyle='#c9f996';p.lineWidth=2.1;arc();p.stroke();
  p.shadowBlur=0;p.strokeStyle='#efffd0';p.lineWidth=.65;arc();p.stroke();
  p.restore();
  const [tipX,tipY]=orbit(start+sweep*progress);
  glow(p,tipX,tipY,30,'193,255,139',.72);glow(p,tipX,tipY,13,'227,255,175',.95);ellipse(p,tipX,tipY,4.2,4.2,'#f4ffdc');
  // The movement stays readable, but sits quietly inside the timer garden.
  p.translate(150,148);p.scale(.66,.66);p.translate(-150,-148);p.globalAlpha=.76;
  ellipse(p,150,268,78,9,'#b5d78413');ellipse(p,150,270,61,3,'#d8eca51f');
  const key=snapshot.step?.id;
  const pose=window.ZenStretch.frame(key,t-poseStarted,reduced.matches);
  if(!pose){glow(p,150,150,90,'168,216,125',.18);p.fillStyle='#daecc6';p.font='italic 25px Georgia';p.textAlign='center';p.fillText('Din rörelse',150,145);p.font='12px sans-serif';p.fillText('Följ din egen instruktion',150,170);p.restore();return;}
  const cloth=p.createLinearGradient(110,80,177,230);cloth.addColorStop(0,'#e5edc4');cloth.addColorStop(.45,'#a5bd90');cloth.addColorStop(1,'#6b9271');
  // Curved joints and shared shoulder roots keep the silhouette connected in motion.
  const limb=(points,color,weight)=>{p.strokeStyle=color;p.lineWidth=weight;p.lineCap='round';p.lineJoin='round';p.beginPath();p.moveTo(...points[0]);for(let i=1;i<points.length-1;i++){const a=points[i],n=points[i+1];p.quadraticCurveTo(...a,(a[0]+n[0])/2,(a[1]+n[1])/2);}p.lineTo(...points.at(-1));p.stroke();};
  p.shadowColor='#d9ffc0';p.shadowBlur=5;
  for(const [i,leg] of pose.legs.entries()){limb(leg,cloth,17);const end=leg[2],angle=pose.feet[i].angle;line(p,[end,[end[0]+Math.cos(angle)*12,end[1]+Math.sin(angle)*12]],'#bbd1a6',8);}
  const skinLimb=p.createLinearGradient(110,60,190,230);skinLimb.addColorStop(0,'#e3e8c0');skinLimb.addColorStop(.5,'#bbd0a5');skinLimb.addColorStop(1,'#8aaa86');
  for(const [i,arm] of pose.arms.entries()){limb([pose.torso[0],...arm],skinLimb,12);const a=pose.hands[i].angle;line(p,[arm[2],[arm[2][0]+Math.cos(a)*10,arm[2][1]+Math.sin(a)*10]],skinLimb,7);}
  line(p,[[pose.head[0],pose.head[1]+14],pose.torso[0]],skinLimb,12);
  p.shadowBlur=0;torso(pose.torso,cloth,35);
  const skin=p.createRadialGradient(pose.head[0]-5,pose.head[1]-5,1,...pose.head,24);skin.addColorStop(0,'#f0edcb');skin.addColorStop(1,'#8fa87b');ellipse(p,...pose.head,16,21,skin,pose.headAngle-.05);
  p.strokeStyle='#dceab980';p.lineWidth=1;p.beginPath();p.moveTo(pose.torso[0][0]-10,pose.torso[0][1]);p.lineTo(pose.torso.at(-1)[0]-11,pose.torso.at(-1)[1]);p.stroke();
  // Soft localized muscle light follows the animated joints, not fixed canvas coordinates.
  for(const region of pose.highlights){
   const strength=reduced.matches?.8:.72+.12*Math.sin(t*TAU/8);
   p.save();p.globalAlpha=strength;p.shadowColor='#d4ff88';p.shadowBlur=18;
   line(p,[region.a,region.b],'#caff8177',region.r*1.5);p.shadowBlur=6;
   line(p,[region.a,region.b],'#edffc7b0',region.r*.5);
   glow(p,(region.a[0]+region.b[0])/2,(region.a[1]+region.b[1])/2,region.r*2,'199,255,114',.32);p.restore();
  }
  p.restore();
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
   const sun=$('breathing-field').getBoundingClientRect(),rect=host.getBoundingClientRect(),sx=sun.left+sun.width/2-rect.left,horizon=height*.61;
   const scale=snapshot.scale||1;
   for(let i=0;i<58;i++){const z=i/58,y=horizon+z*height*.35,w=(12+z*90)*scale,offset=Math.sin(i*2+t*.8)*w*.28;const alpha=(1-z)*(.025+.045*Math.sin(i*5+t)**2);line(c,[[sx-w+offset,y],[sx+w+offset,y]],`rgba(253,228,170,${alpha})`,1+z*2);}
   for(let i=0;i<20;i++){const y=horizon+(i/20)*height*.37,x=(i*117.1%width);line(c,[[x,y],[x+25+Math.sin(t*.3+i)*12,y]],'#d3ead214',.7);}
   for(const r of ripples){const age=(now-r.at)/1000;if(age>7)continue;const q=age/7;c.save();c.globalAlpha=(1-q)*.25;c.strokeStyle='#efdfaf';c.lineWidth=1;c.beginPath();c.ellipse(r.x,r.y,12+q*width*.5,3+q*height*.09,0,0,TAU);c.stroke();c.restore();}ripples=ripples.filter(r=>now-r.at<7000);
   // Waterfall at the far right, outside the breathing guide and controls.
   for(let i=0;i<12;i++){const x=width*.91+Math.sin(i*2)*width*.025,y=height*.46;line(c,[[x,y],[x+Math.sin(t*1.4+i)*2,height*.62]],`rgba(206,230,204,${.035+i%3*.015})`,1.3);}
  }else{
   for(let i=0;i<38;i++){const x=((i*197.7)%width)+Math.sin(t*.25+i)*16+pointer.x*5,y=height*(.13+(i*0.071% .65))+Math.cos(t*.3+i)*12;const edge=Math.min(1,Math.abs(x-width*.5)/(width*.36));const alpha=(.14+.22*(1+Math.sin(t*.8+i))/2)*(.12+.88*edge*edge);glow(c,x,y,22,'190,255,112',alpha*.48);glow(c,x,y,8,'224,255,164',alpha*.85);ellipse(c,x,y,1.5,1.5,`rgba(239,255,194,${Math.min(1,alpha*1.7)})`);}
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
  if(next.kind!==previousKind){previousKind=next.kind;previousIndex=-1;resize();showControls();}
  if(next.kind==='stretch'&&next.index!==previousIndex&&next.step){
   const advance=previousIndex>=0&&next.index>previousIndex;
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
   host.querySelector('.session-next').classList.toggle('next-imminent',!next.paused&&!next.preparing&&next.index<next.steps.length-1&&(1-next.stepProgress)*next.step.seconds<=5);
  }
  if(next.done)$('session-trail').querySelectorAll('li').forEach(li=>{li.dataset.state='done';li.removeAttribute('aria-current');});
  if(next.phase==='Andas ut'&&old.phase!==next.phase&&!reduced.matches)ripples.push({x:width*.5,y:height*.65,at:performance.now()});
  if(next.paused!==old.paused||next.done!==old.done){showControls();wake();}
  paintSessionProgress(performance.now());
  if(reduced.matches||next.paused)paint(performance.now());
 });
 document.addEventListener('zen:session-view',e=>{active=e.detail.view==='session';snapshot={kind:e.detail.kind};sampledAt=performance.now();const clock=host.querySelector('.session-clock');host.querySelector(e.detail.kind==='meditation'?'.session-meta':'.session-guidance').prepend(clock);const next=host.querySelector('.session-next');next.classList.remove('next-imminent');if(e.detail.kind==='stretch')host.querySelector('.session-bottom').prepend(next);else host.querySelector('.session-layout').appendChild(next);$('session-audio').open=false;previousKind='';previousIndex=-1;motionTime=0;clearTimeout(idle);host.classList.remove('controls-asleep');$('reveal-session-controls').hidden=true;if(active){resize();showControls();}wake();});
 const sceneSizeObserver=new ResizeObserver(()=>{if(active)resize();});sceneSizeObserver.observe(host);sceneSizeObserver.observe($('breathing-field'));
 host.addEventListener('pointerdown',e=>{const audio=$('session-audio');if(audio.open&&!audio.contains(e.target))audio.open=false;});host.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('session-audio').open){$('session-audio').open=false;$('session-audio').querySelector('summary').focus();}});
 document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake);
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);clearTimeout(idle);});window.addEventListener('pageshow',wake);
})();
