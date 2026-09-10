/* Procedural Canvas scenery. All geometry, lighting and motion are drawn locally;
   no photographs, textures, external assets or rendering dependencies. */
(function () {
  'use strict';
  const host = document.querySelector('.landscape');
  if (!host) return;
  const forest = host.querySelector('.landscape-forest');
  const garden = host.querySelector('.landscape-garden');
  const fc = forest.getContext('2d'), gc = garden.getContext('2d');
  if (!fc || !gc) return; // CSS gradients remain as the non-canvas fallback.
  const W = 1200, H = 900, TAU = Math.PI * 2;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  let seed = 37019;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const range = (a, b) => a + random() * (b - a);
  const layer = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const woodland = layer(), wood = layer(), waterside = layer();
  const leaves = [], bamboo = [], lights = [], ripples = [];
  let width = 0, height = 0, ratio = 1, scale = 1, left = 0;
  let frame = 0, previous = -Infinity, visible = true, transitionUntil = 0;
  let lastKind = document.body.dataset.kind, inSession = document.body.classList.contains('in-session');
  let pointerX = 0, pointerY = 0, driftX = 0, driftY = 0;

  function ellipse(c, x, y, rx, ry, color, rotation = 0) {
    c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, TAU); c.fill();
  }
  function glow(c, x, y, radius, rgb, opacity) {
    const g = c.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, 'rgba(' + rgb + ',' + opacity + ')');
    g.addColorStop(.25, 'rgba(' + rgb + ',' + opacity * .3 + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = g; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  function stroke(c, points, color, thickness) {
    c.strokeStyle = color; c.lineWidth = thickness; c.lineCap = 'round';
    c.beginPath(); c.moveTo(points[0], points[1]);
    c.bezierCurveTo(...points.slice(2)); c.stroke();
  }
  function hill(c, y, color, amplitude, phase) {
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, y + Math.sin(x / 210 + phase) * amplitude + Math.sin(x / 97 + phase) * amplitude / 4);
    c.lineTo(W, H); c.closePath(); c.fillStyle = color; c.fill();
  }
  function branch(c, x, y, length, angle, thickness, depth) {
    const ex = x + Math.cos(angle) * length, ey = y + Math.sin(angle) * length;
    const bend = range(-.25, .25) * length;
    const points = [x, y, x + Math.cos(angle) * length * .3 + bend, y + Math.sin(angle) * length * .3,
      ex - Math.cos(angle) * length * .25, ey - Math.sin(angle) * length * .25, ex, ey];
    stroke(c, points, '#10291f', thickness + 5);
    stroke(c, points, '#304635', thickness);
    stroke(c, points.map((n, i) => i % 2 ? n : n - thickness * .16), '#60754a', Math.max(.7, thickness * .12));
    if (depth < 1) {
      for (let i = 0; i < 11; i++) leaves.push({x: ex + range(-42, 42), y: ey + range(-19, 25), rx: range(12, 31), ry: range(7, 18), angle: range(-.7, .7), phase: range(0, TAU), shade: Math.floor(range(0, 5))});
      return;
    }
    branch(c, ex, ey, length * range(.64, .78), angle - range(.26, .67), thickness * .65, depth - 1);
    branch(c, ex, ey, length * range(.61, .79), angle + range(.25, .62), thickness * .64, depth - 1);
  }
  function makeForest() {
    const c = woodland.getContext('2d');
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#081f1d'); sky.addColorStop(.43, '#204936'); sky.addColorStop(1, '#071c15');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    glow(c, 780, 255, 440, '126,186,94', .3);
    // Distant trunks fade into the clearing; each has its own seeded silhouette.
    for (let i = 0; i < 37; i++) {
      const x = range(-30, 1260), y = range(490, 690), w = range(7, 22);
      stroke(c, [x, y, x + 12, y - 180, x - 35, 80, x - 20, -30], 'rgba(10,35,28,.38)', w);
      stroke(c, [x - 5, 290, x - 40, 245, x - 65, 170, x - 100, 135], 'rgba(10,35,28,.3)', w * .4);
    }
    hill(c, 614, '#143b28', 37, 2); hill(c, 695, '#0d2d20', 43, 4);
    for (let i = 0; i < 260; i++) ellipse(c, range(0, W), range(637, 860), range(2, 16), range(1, 4), ['#24452b','#1d4029','#315332'][i % 3]);
    glow(c, 860, 645, 240, '141,202,86', .12);
    const t = wood.getContext('2d');
    for (let i = 0; i < 11; i++) {
      const end = 865 + (i - 5) * 37;
      stroke(t, [867, 587, 855 + (i - 5) * 8, 677, end + 23, 694, end, 713 + Math.abs(i - 5) * 6], '#263e2b', 31 - Math.abs(i - 5) * 3);
      stroke(t, [865, 605, 855 + (i - 5) * 8, 677, end + 23, 694, end, 713 + Math.abs(i - 5) * 6], '#6c8150', 2);
    }
    branch(t, 867, 654, 196, -1.67, 83, 4);
    branch(t, 861, 503, 141, -2.55, 39, 3);
    branch(t, 863, 528, 162, -.72, 36, 3);
    // Fine, discontinuous bark highlights run along the trunk.
    for (let i = 0; i < 23; i++) {
      const x = range(835, 890), y = range(472, 650);
      stroke(t, [x, y, x - 7, y - 20, x + 8, y - 40, x - 4, y - range(45, 83)], i % 3 ? '#83936035' : '#132d22aa', range(1, 3));
    }
    for (let i = 0; i < 62; i++) lights.push({x:range(450,1190),y:range(180,735),phase:range(0,TAU),speed:range(.18,.48),size:range(.8,2.1)});
  }
  function rock(c, x, y, size, shade) {
    c.save(); c.translate(x, y);
    const fill = c.createLinearGradient(-size, -size, size, size * .6);
    fill.addColorStop(0, shade); fill.addColorStop(.5, '#58736c'); fill.addColorStop(1, '#344f4d');
    c.fillStyle = fill; c.beginPath(); c.moveTo(-size, 0);
    c.bezierCurveTo(-size*.9, -size*.55, -size*.42, -size*.88, size*.04, -size*.67);
    c.bezierCurveTo(size*.5, -size*.82, size*.73, -size*.3, size, 0);
    c.bezierCurveTo(size*.72, size*.2, -size*.73, size*.23, -size, 0); c.fill();
    stroke(c, [-size*.82, -size*.13, -size*.5, -size*.53, size*.13, -size*.55, size*.53, -size*.31], '#cfdfbf55', 2);
    c.restore();
  }
  function makeGarden() {
    const c = waterside.getContext('2d');
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#8eadab'); sky.addColorStop(.38, '#c0d3c4'); sky.addColorStop(.61, '#84ada1'); sky.addColorStop(1, '#406f6c');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    glow(c, 785, 190, 330, '231,230,177', .47);
    hill(c, 360, '#769c8c44', 54, .6); hill(c, 453, '#5c877560', 39, 2);
    // Bamboo: stems and leaves are independent geometry, not a texture.
    for (let i = 0; i < 25; i++) {
      const x = range(615, 1250), y = range(370, 512), tall = range(230, 540), lean = range(-32, 25);
      stroke(c, [x, y, x + lean*.5, y - tall*.35, x + lean, y - tall*.7, x + lean, y - tall], '#426f5c70', range(3, 8));
      for (let j = 1; j < 7; j++) {
        const by = y - tall*j/7, bx = x + lean*j/7;
        c.fillStyle = '#adc4a38c'; c.fillRect(bx-4, by, 8, 2);
        bamboo.push({x:bx,y:by,phase:range(0,TAU),direction:i%2?1:-1});
      }
    }
    hill(c, 530, '#466c5870', 14, 4);
    for (let i = 0; i < 21; i++) rock(c, 660 + i*29, 559 + Math.sin(i*.8)*16, range(24,51), '#a2b3a0');
    rock(c, 931, 477, 74, '#c0c8b1'); rock(c, 883, 526, 60, '#9fae98');
    rock(c, 1007, 544, 95, '#b5bea7'); rock(c, 968, 590, 68, '#97aa93');
    // A gravel bank curves around the water, with hand-raked arcs.
    c.fillStyle = '#a4b4a0'; c.beginPath(); c.moveTo(1200, 587);
    c.bezierCurveTo(1010, 646, 1040, 710, 1135, 770); c.lineTo(1200, 900); c.closePath(); c.fill();
    for (let i = 0; i < 15; i++) stroke(c, [1208,604+i*10,1055+i*4,653+i*5,1085+i*7,738+i*5,1220,782+i*8], '#58796338', 1.1);
    rock(c, 1157, 686, 64, '#c0c6b2'); rock(c, 1160, 741, 29, '#aebfa8');
    for (let i = 0; i < 23; i++) ripples.push({x:range(525,1180),y:range(580,870),phase:range(0,1),size:range(15,55),speed:range(.08,.16)});
  }
  makeForest(); makeGarden();

  function prepare(c) {
    c.setTransform(ratio, 0, 0, ratio, 0, 0); c.clearRect(0, 0, width, height);
    c.translate(left, 0); c.scale(scale, scale);
  }
  function renderForest(time) {
    prepare(fc); fc.drawImage(woodland, 0, 0);
    // Light shafts move slowly through the clearing.
    fc.save(); fc.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) {
      const x = 640 + i*109 + Math.sin(time*.09+i)*13;
      const beam = fc.createLinearGradient(x, 80, x-190, 740);
      beam.addColorStop(0, '#b8e69400'); beam.addColorStop(.35, '#b8e6940b'); beam.addColorStop(1, '#b8e69400');
      fc.fillStyle=beam; fc.beginPath(); fc.moveTo(x,0);fc.lineTo(x+36,0);fc.lineTo(x-165,760);fc.lineTo(x-280,760);fc.closePath();fc.fill();
    }
    fc.restore();
    const wind = Math.sin(time*.29)*.003;
    fc.save(); fc.translate(867+driftX*.35, 690); fc.transform(1, 0, wind, 1, 0, 0); fc.drawImage(wood, -867, -690); fc.restore();
    const shades = ['#1d4430','#28543a','#34613d','#426f42','#547f48'];
    for (const l of leaves) {
      const sway = Math.sin(time*.43+l.phase)*2.5;
      const x = l.x+sway+wind*(l.y-690)+driftX*.35, y = l.y+Math.cos(time*.31+l.phase)*1.2;
      ellipse(fc,x,y,l.rx,l.ry,shades[l.shade],l.angle+sway*.015);
      if (l.shade===4) ellipse(fc,x-3,y-3,l.rx*.64,1.3,'#a6c57538',l.angle);
    }
    fc.save(); fc.globalCompositeOperation='screen';
    for (const f of lights) {
      const x=f.x+Math.sin(time*f.speed+f.phase)*19+driftX, y=f.y+Math.cos(time*f.speed*.7+f.phase)*13+driftY;
      const light=.25+.65*Math.pow((Math.sin(time*.8+f.phase)+1)/2,2);
      glow(fc,x,y,15+f.size*3,'175,233,100',light*.34);
      ellipse(fc,x,y,f.size,f.size,'rgba(221,255,166,'+light+')');
    }
    fc.restore();
    glow(fc,850,658,180,'128,191,75',.1+Math.sin(time*.23)*.025);
  }
  function renderGarden(time) {
    prepare(gc); gc.drawImage(waterside, 0, 0);
    // Slow reflections are clipped to the pond, leaving the bank and rocks solid.
    gc.save(); gc.beginPath();gc.moveTo(0,568);gc.lineTo(1090,568);gc.bezierCurveTo(992,662,1060,733,1140,790);gc.lineTo(1170,900);gc.lineTo(0,900);gc.closePath();gc.clip();
    for (let i=0;i<37;i++) {
      const y=579+i*8, shift=Math.sin(time*.24+i*.7)*15;
      const reflection=gc.createLinearGradient(550,y,1080,y);
      reflection.addColorStop(0,'#d7edca00');reflection.addColorStop(.45,'#c8dfbc38');reflection.addColorStop(1,'#cee4bd00');
      stroke(gc,[565+shift,y,690+shift,y-5,860-shift,y+5,1090-shift,y],reflection,1.3);
    }
    for(const r of ripples) {
      const p=(time*r.speed+r.phase)%1, radius=4+p*r.size;
      gc.strokeStyle='rgba(214,238,218,'+Math.sin(p*Math.PI)*.25+')';gc.lineWidth=.8;
      gc.beginPath();gc.ellipse(r.x+driftX*.3,r.y,radius,radius*.17,0,0,TAU);gc.stroke();
    }
    glow(gc,817+Math.sin(time*.14)*14,694,240,'218,232,193',.12);
    gc.restore();
    // Water threads descend from a rock ledge and fan into the pond.
    for (let i=0;i<19;i++) {
      const x=897+i*1.5, shimmer=.18+.18*Math.sin(time*1.2+i*.8);
      stroke(gc,[x,489,x+Math.sin(i)*2,518,x+8,545,x+27,586],'rgba(218,241,224,'+shimmer+')',i%3===0?2:1);
      const drop=(time*.36+i/19)%1;
      ellipse(gc,x+27*drop*drop,489+97*drop,.8,2.5,'#e3f8e34d');
    }
    for(let i=0;i<4;i++) {
      const p=(time*.21+i/4)%1;
      gc.strokeStyle='rgba(217,242,225,'+(1-p)*.35+')';gc.lineWidth=1;
      gc.beginPath();gc.ellipse(938,593,5+p*58,2+p*9,0,0,TAU);gc.stroke();
    }
    for (const b of bamboo) {
      const breeze=Math.sin(time*.34+b.phase)*.04;
      for(let i=0;i<3;i++) {
        const a=b.direction*(.2+i*.22)+breeze;
        ellipse(gc,b.x+b.direction*(15+i*9),b.y-i*7,19-i*2,3.2,'#426d586b',a);
      }
    }
  }
  function draw(time, both) {
    if(lastKind==='stretch'||both)renderForest(time);
    if(lastKind==='meditation'||both)renderGarden(time);
  }
  function resize() {
    const box=host.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);
    ratio=Math.min(window.devicePixelRatio||1,1.6,Math.sqrt(1800000/(width*height)));
    scale=Math.max(width/W,height/H);left=(width-W*scale)*(width<600?.69:.5);
    for(const canvas of [forest,garden]){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);}
    draw(motion.matches?0:performance.now()/1000,true);wake();
  }
  function loop(now) {
    frame=0;if(document.hidden||!visible||motion.matches)return;
    if(now-previous>=40){previous=now;driftX+=(pointerX-driftX)*.035;driftY+=(pointerY-driftY)*.035;draw(now/1000,now<transitionUntil);}
    frame=requestAnimationFrame(loop);
  }
  function wake() {
    if(frame){cancelAnimationFrame(frame);frame=0;}
    if(document.hidden||!visible)return;
    if(motion.matches){driftX=0;driftY=0;draw(0,true);return;}
    frame=requestAnimationFrame(loop);
  }
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;wake();}).observe(host);
  new MutationObserver(()=>{
    const next=document.body.dataset.kind, session=document.body.classList.contains('in-session');
    if(next!==lastKind){lastKind=next;transitionUntil=performance.now()+1600;draw(motion.matches?0:performance.now()/1000,true);wake();}
    if(session!==inSession){inSession=session;resize();}
  }).observe(document.body,{attributes:true,attributeFilter:['data-kind','class']});
  motion.addEventListener('change',wake);
  document.addEventListener('visibilitychange',wake);
  window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',wake);
  window.addEventListener('pointermove',event=>{
    if(!finePointer.matches||motion.matches)return;
    pointerX=(event.clientX/window.innerWidth-.5)*9;pointerY=(event.clientY/window.innerHeight-.5)*5;
  },{passive:true});
  resize();
})();
