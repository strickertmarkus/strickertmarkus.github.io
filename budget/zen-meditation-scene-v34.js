/* Zen meditation v8 clean: single visible renderer, Safari-safe syntax. */
(function () {
  'use strict';

  const host = document.querySelector('.landscape');
  if (!host) return;

  const shade = host.querySelector('.landscape-shade');
  const canvas = document.createElement('canvas');
  canvas.className = 'landscape-meditation-v8';
  if (shade) host.insertBefore(canvas, shade);
  else host.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1200;
  const H = 900;
  const WATER = 575;
  const TAU = Math.PI * 2;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let width = 1;
  let height = 1;
  let ratio = 1;
  let scale = 1;
  let left = 0;
  let frame = 0;
  let lastFrame = -Infinity;
  let visible = true;
  let copyZones = [];

  const back = [
    [585, 6, -28, 0.2, 0.40], [630, 7, 20, 0.8, 0.44], [675, 5, -14, 1.5, 0.34],
    [720, 8, 22, 2.1, 0.48], [770, 5, -20, 2.7, 0.34], [815, 7, 16, 3.4, 0.44],
    [860, 6, -18, 4.0, 0.38], [905, 8, 24, 4.5, 0.45], [950, 5, -13, 5.1, 0.34],
    [995, 7, 19, 5.7, 0.42], [1040, 6, -22, 6.2, 0.37], [1090, 8, 17, 6.8, 0.43],
    [1140, 6, -18, 7.4, 0.35], [1185, 7, 20, 8.0, 0.40]
  ];

  const front = [
    [650, 10, -34, 0.4, 0.76], [735, 13, 26, 1.4, 0.88], [790, 9, -22, 2.4, 0.78],
    [915, 15, 34, 3.5, 0.92], [1005, 11, -27, 4.5, 0.84], [1095, 14, 24, 5.6, 0.90],
    [1180, 10, -20, 6.7, 0.80]
  ];

  const background = document.createElement('canvas');
  background.width = W;
  background.height = H;
  const bg = background.getContext('2d');

  function stroke(c, x1, y1, x2, y2, color, lineWidth) {
    c.strokeStyle = color;
    c.lineWidth = lineWidth;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  }

  function ellipse(c, x, y, rx, ry, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fill();
  }

  function glow(c, x, y, radius, rgb, alpha) {
    const g = c.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
    g.addColorStop(0.28, 'rgba(' + rgb + ',' + (alpha * 0.36) + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = g;
    c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function leaf(c, x, y, length, leafWidth, angle, alpha) {
    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y);
    c.rotate(angle);
    c.fillStyle = '#4c7761';
    c.beginPath();
    c.moveTo(-length * 0.46, 0);
    c.quadraticCurveTo(-length * 0.05, -leafWidth, length * 0.54, 0);
    c.quadraticCurveTo(-length * 0.05, leafWidth, -length * 0.46, 0);
    c.fill();
    c.strokeStyle = 'rgba(224,232,185,.28)';
    c.lineWidth = 0.55;
    c.beginPath();
    c.moveTo(-length * 0.28, 0);
    c.lineTo(length * 0.31, 0);
    c.stroke();
    c.restore();
  }

  function rock(c, x, y, size) {
    const g = c.createLinearGradient(x - size, y - size, x + size, y + size);
    g.addColorStop(0, '#c6d0b9');
    g.addColorStop(0.48, '#84988d');
    g.addColorStop(1, '#4b6963');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - size, y);
    c.bezierCurveTo(x - size * 0.88, y - size * 0.62, x - size * 0.35, y - size * 0.86, x + size * 0.05, y - size * 0.66);
    c.bezierCurveTo(x + size * 0.48, y - size * 0.78, x + size * 0.78, y - size * 0.25, x + size, y);
    c.bezierCurveTo(x + size * 0.74, y + size * 0.19, x - size * 0.68, y + size * 0.25, x - size, y);
    c.fill();
    stroke(c, x - size * 0.72, y - size * 0.12, x + size * 0.35, y - size * 0.42, 'rgba(248,244,207,.35)', 1.3);
  }

  function makeBackground() {
    const sky = bg.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#a8c5be');
    sky.addColorStop(0.22, '#bfd3c7');
    sky.addColorStop(0.50, '#a9c9bc');
    sky.addColorStop(0.69, '#8fb9ae');
    sky.addColorStop(1, '#6ea09a');
    bg.fillStyle = sky;
    bg.fillRect(0, 0, W, H);

    glow(bg, 805, 145, 430, '255,224,145', 0.40);
    glow(bg, 720, 245, 260, '229,247,220', 0.18);
    ellipse(bg, 806, 148, 18, 18, 'rgba(255,235,161,.62)');

    bg.fillStyle = 'rgba(102,148,129,.19)';
    bg.beginPath();
    bg.moveTo(0, 390);
    for (let x = 0; x <= W; x += 30) bg.lineTo(x, 390 + Math.sin(x / 145) * 28 + Math.sin(x / 57) * 9);
    bg.lineTo(W, 520);
    bg.lineTo(0, 520);
    bg.closePath();
    bg.fill();

    bg.fillStyle = 'rgba(73,118,99,.24)';
    bg.beginPath();
    bg.moveTo(0, 470);
    for (let x = 0; x <= W; x += 30) bg.lineTo(x, 470 + Math.sin(x / 190 + 1) * 20);
    bg.lineTo(W, 560);
    bg.lineTo(0, 560);
    bg.closePath();
    bg.fill();

    // v38: the cliff renderer owns ALL stone geometry and its reflection.

    const water = bg.createLinearGradient(0, WATER, 0, H);
    water.addColorStop(0, 'rgba(189,218,205,.64)');
    water.addColorStop(0.35, 'rgba(159,203,193,.70)');
    water.addColorStop(1, 'rgba(116,174,169,.76)');
    bg.fillStyle = water;
    bg.fillRect(0, WATER, W, H - WATER);

    const mist = bg.createLinearGradient(0, WATER - 55, 0, WATER + 70);
    mist.addColorStop(0, 'rgba(238,246,229,0)');
    mist.addColorStop(0.5, 'rgba(238,246,229,.20)');
    mist.addColorStop(1, 'rgba(238,246,229,0)');
    bg.fillStyle = mist;
    bg.fillRect(0, WATER - 55, W, 130);
  }

  makeBackground();

  function mobileBoost() {
    return width < 700 ? 1.30 : 1;
  }

  function stalkSway(stalk, time, distant) {
    if (reduced.matches) return 0;
    const phase = stalk[3];
    const strength = distant ? 0.65 : 1;
    return (Math.sin(time * 0.50 + phase) * 9 + Math.sin(time * 0.19 + phase * 1.7) * 4) * mobileBoost() * strength;
  }

  function waterCrossX(stalk, time, distant) {
    const topX = stalk[0] + stalk[2] + stalkSway(stalk, time, distant);
    const baseY = H + 75;
    const topY = -145;
    const t = (baseY - WATER) / (baseY - topY);
    return stalk[0] + (topX - stalk[0]) * t;
  }

  function drawStem(stalk, time, distant) {
    const x = stalk[0];
    const widthStem = stalk[1];
    const lean = stalk[2];
    const alphaBase = stalk[4];
    const sway = stalkSway(stalk, time, distant);
    const baseY = H + 75;
    const topY = -145;
    const topX = x + lean + sway;
    const total = baseY - topY;
    const segments = 13 + Math.floor((stalk[3] * 7.3) % 5);

    for (let j = 0; j < segments; j++) {
      // Stable uneven node heights; branches remain attached to the nodes.
      const node = n => n===0?0:n===segments?1:(n+Math.sin(n*2.31+stalk[3]*3.7)*.23)/segments;
      const t0 = node(j);
      const t1 = node(j + 1);
      const y0 = baseY - total * t0;
      const y1 = baseY - total * t1;
      const x0 = x + (topX - x) * t0;
      const x1 = x + (topX - x) * t1;
      const w = widthStem * (1 - j / segments * 0.30);
      const submerged = y0 > WATER && y1 > WATER;
      const alpha = alphaBase * (submerged ? 0.24 : 1);

      const g = ctx.createLinearGradient(x0 - w, y0, x0 + w, y0);
      g.addColorStop(0, 'rgba(42,84,70,' + (alpha * 0.78) + ')');
      g.addColorStop(0.38, 'rgba(116,159,122,' + alpha + ')');
      g.addColorStop(0.60, 'rgba(190,199,143,' + (alpha * 0.84) + ')');
      g.addColorStop(1, 'rgba(49,93,74,' + (alpha * 0.82) + ')');
      stroke(ctx, x0, y0, x1, y1, g, w);
      const sunSide=x1<805?1:-1;
      stroke(ctx, x0 + sunSide * w * 0.26, y0, x1 + sunSide * w * 0.26, y1, 'rgba(252,233,173,' + (alpha * 0.36) + ')', Math.max(0.6, w * 0.08));

      if (j < segments - 1) stroke(ctx, x1 - w * 0.55, y1, x1 + w * 0.55, y1, 'rgba(49,82,65,' + (alpha * 0.70) + ')', Math.max(0.9, w * 0.12));

      if (!submerged && j > 1 && j < segments - 2 && Math.sin(j * 2.17 + stalk[3] * 4.3) > (distant ? .08 : .24)) {
        const dir = ((j + Math.round(x)) % 4) < 2 ? 1 : -1;
        const branchLength = (distant ? 27 : 39) * (0.73 + (Math.sin(stalk[3] * 3 + j) + 1) * 0.22);
        const flutter = reduced.matches ? 0 : Math.sin(time * 0.82 + stalk[3] + j) * 5 * mobileBoost();
        // Reserve a real text-shaped opening instead of covering the copy with a panel.
        const edge = x1 + dir * (branchLength + 22 + Math.abs(flutter));
        if (copyZones.some(zone => Math.max(x1, edge) > zone.left && Math.min(x1, edge) < zone.right && y1+12 > zone.top && y1-50 < zone.bottom)) continue;
        stroke(ctx, x1, y1, x1 + dir * (branchLength + flutter), y1 - 17, 'rgba(51,94,74,' + (alpha * 0.72) + ')', Math.max(0.9, w * 0.10));
        for (let k = 0; k < 3; k++) {
          const len = (distant ? 22 : 29) - k + Math.sin(stalk[3] + j + k) * 4;
          const leafWidth = distant ? 4.3 : 5.4;
          const leafAngle = dir * (0.18 + k * 0.16) + (reduced.matches ? 0 : Math.sin(time * 1.05 + stalk[3] + k) * 0.08 * mobileBoost());
          leaf(ctx, x1 + dir * (13 + k * 10) + dir * flutter * 0.5, y1 - 7 - k * 5, len, leafWidth, leafAngle, alpha * (distant ? 0.68 : 0.90));
        }
      }
    }
  }

  function drawRippleSet(x, time, phase, distant) {
    const count = distant ? 2 : 3;
    if (reduced.matches) {
      for (let i = 0; i < count; i++) {
        const radius = 18 + i * 20;
        const alpha = (distant ? 0.08 : 0.13) - i * 0.025;
        ctx.strokeStyle = 'rgba(251,248,218,' + Math.max(0, alpha) + ')';
        ctx.lineWidth = distant ? 0.8 : 1;
        ctx.beginPath();
        ctx.ellipse(x, WATER + i * 0.6, radius, radius * 0.18, 0, 0, TAU);
        ctx.stroke();
      }
      return;
    }

    const speed = distant ? 0.085 : 0.115;
    for (let i = 0; i < count; i++) {
      const p = (time * speed + phase * 0.11 + i * 0.28) % 1;
      const radius = 10 + p * (distant ? 42 : 58) + i * 5;
      const alpha = Math.sin(p * Math.PI) * ((distant ? 0.10 : 0.17) - i * 0.025);
      ctx.strokeStyle = 'rgba(255,248,207,' + Math.max(0, alpha) + ')';
      ctx.lineWidth = distant ? 0.8 : 1.05;
      ctx.beginPath();
      ctx.ellipse(x + Math.sin(time * 0.35 + phase) * 2.2, WATER + i * 0.65, radius, radius * 0.19, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawWaterMotion(time) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, WATER, W, H - WATER);
    ctx.clip();
    const boost = mobileBoost();

    for (let i = 0; i < 34; i++) {
      const y = WATER + 12 + (i * 31) % 295;
      const travel = ((time * (34 + (i % 5) * 5) + i * 73) % (W + 220)) - 110;
      const len = (50 + (i % 6) * 18) * boost;
      ctx.strokeStyle = 'rgba(247,248,221,' + (0.040 + (i % 4) * 0.012) + ')';
      ctx.lineWidth = 0.85;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(travel - len * 0.5, y);
      ctx.bezierCurveTo(travel - len * 0.18, y - 2, travel + len * 0.17, y + 2, travel + len * 0.5, y);
      ctx.stroke();
    }

    if (!reduced.matches) {
      for (let i = 0; i < 6; i++) {
        const y = WATER + 24 + i * 48 + Math.sin(time * 0.35 + i) * 4;
        const x = ((time * (42 + i * 4) + i * 161) % (W + 360)) - 180;
        const len = 150 + (i % 2) * 42;
        ctx.strokeStyle = 'rgba(255,243,185,' + (0.055 + (i % 2) * 0.018) + ')';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - len * 0.5, y);
        ctx.bezierCurveTo(x - len * 0.2, y - 3, x + len * 0.18, y + 3, x + len * 0.5, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawWaterfall(time) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 18; i++) {
      const x = 1050 + i * 3;
      const shimmer = 0.13 + 0.15 * Math.sin(time * 1.3 + i * 0.7);
      const drop = reduced.matches ? 0.35 : (time * 0.43 + i / 18) % 1;
      ctx.strokeStyle = 'rgba(231,247,228,' + shimmer + ')';
      ctx.lineWidth = i % 4 === 0 ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 552);
      ctx.bezierCurveTo(x - 3, 590, x + 8, 630, x + 25, 688);
      ctx.stroke();
      ellipse(ctx, x + 25 * drop * drop, 552 + 136 * drop, 0.7, 2.4, 'rgba(255,246,199,.34)');
    }
    ctx.restore();

    for (let i = 0; i < 4; i++) {
      const p = reduced.matches ? 0.35 : (time * 0.22 + i / 4) % 1;
      ctx.strokeStyle = 'rgba(237,249,232,' + ((1 - p) * 0.25) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(1080, 694, 7 + p * 62, 2 + p * 10, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawSun(time) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) {
      const sx = 750 + i * 47 + (reduced.matches ? 0 : Math.sin(time * 0.08 + i) * 10);
      const beam = ctx.createLinearGradient(sx, 60, sx - 170, 690);
      beam.addColorStop(0, 'rgba(255,223,141,.18)');
      beam.addColorStop(0.50, 'rgba(255,231,167,.085)');
      beam.addColorStop(1, 'rgba(238,247,225,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx + 34, 0);
      ctx.lineTo(sx - 125, 700);
      ctx.lineTo(sx - 220, 700);
      ctx.closePath();
      ctx.fill();
    }
    glow(ctx, 805 + (reduced.matches ? 0 : Math.sin(time * 0.11) * 7), 150, 125, '255,223,139', 0.21);
    ctx.restore();
  }

  function prepare() {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(left, 0);
    ctx.scale(scale, scale);
  }

  function draw(time) {
    prepare();
    if (document.body.dataset.kind !== 'meditation') return;

    ctx.drawImage(background, 0, 0);
    drawSun(time);

    back.forEach(function (stalk) { drawStem(stalk, time, true); });

    const haze = ctx.createLinearGradient(0, WATER - 20, 0, WATER + 100);
    haze.addColorStop(0, 'rgba(215,234,221,0)');
    haze.addColorStop(0.45, 'rgba(215,234,221,.16)');
    haze.addColorStop(1, 'rgba(176,211,203,.07)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, WATER - 20, W, 120);

    drawWaterMotion(time);
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<13;i++){
      const x=715+i*24,y=WATER+15+(i%4)*13,m=reduced.matches?0:Math.sin(time*.42+i)*3;
      ctx.strokeStyle='rgba(223,241,203,.075)';ctx.lineWidth=.7;
      ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+8,y-5+m,x+23,y+6-m,x+38,y+1);ctx.stroke();
    }
    ctx.restore();
    back.forEach(function (stalk) { drawRippleSet(waterCrossX(stalk, time, true), time, stalk[3], true); });

    if(window.ZenPondRocks)window.ZenPondRocks.draw(ctx,{width:width,left:left,scale:scale},time);

    front.forEach(function (stalk) { drawStem(stalk, time, false); });
    front.forEach(function (stalk) { drawRippleSet(waterCrossX(stalk, time, false), time, stalk[3], false); });

    // Rocks/cascade share this canvas and the WATER=575 pond line.

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 18; i++) {
      const y = WATER + 20 + i * 14;
      const x = 790 + (reduced.matches ? 0 : Math.sin(time * 0.32 + i * 0.7) * 16);
      const lineWidth = 20 + (i % 5) * 13;
      ctx.strokeStyle = 'rgba(255,239,177,' + (0.045 + (i % 4) * 0.018) + ')';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(x - lineWidth, y);
      ctx.lineTo(x + lineWidth, y + Math.sin(i) * 1.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function updateCopyZone() {
    const b=host.getBoundingClientRect();
    copyZones=['.hero-description','.hero-copy h1','.kind-switch'].map(selector=>document.querySelector(selector)).filter(Boolean).map(text=>{
      const r=text.getBoundingClientRect();
      return {left:(r.left-b.left-left)/scale-10,right:(r.right-b.left-left)/scale+10,top:(r.top-b.top)/scale-8,bottom:(r.bottom-b.top)/scale+8};
    });
  }

  function resize() {
    const box = host.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    ratio = Math.min(window.devicePixelRatio || 1, 1.45, Math.sqrt(1450000 / (width * height)));
    scale = Math.max(width / W, height / H);
    left = (width - W * scale) * (width < 600 ? 0.69 : 0.5);
    updateCopyZone();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    draw(reduced.matches ? 0 : performance.now() / 1000);
    wake();
  }

  function loop(now) {
    frame = 0;
    if (document.hidden || !visible || reduced.matches) return;
    if (now - lastFrame > 32) {
      lastFrame = now;
      draw(now / 1000);
    }
    frame = requestAnimationFrame(loop);
  }

  function wake() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (document.hidden || !visible) return;
    if (reduced.matches) {
      draw(0);
      return;
    }
    frame = requestAnimationFrame(loop);
  }

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    wake();
  }).observe(host);
  new MutationObserver(function () {
    updateCopyZone();
    draw(reduced.matches ? 0 : performance.now() / 1000);
    wake();
  }).observe(document.body, { attributes: true, attributeFilter: ['data-kind'] });

  document.addEventListener('visibilitychange', wake);
  reduced.addEventListener('change', wake);
  window.addEventListener('pagehide', function () {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  });
  window.addEventListener('pageshow', wake);

  if(document.fonts)document.fonts.ready.then(function(){updateCopyZone();draw(reduced.matches?0:performance.now()/1000);});
  window.addEventListener('zen-pond-ready',function(){draw(reduced.matches?0:performance.now()/1000);});
  resize();
})();
