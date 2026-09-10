/* Zen waterfall v11: coherent rock bank with bamboo occlusion, submerged base and aligned cascade. */
(function () {
  'use strict';

  const host = document.querySelector('.landscape');
  if (!host) return;

  const shade = host.querySelector('.landscape-shade');
  const canvas = document.createElement('canvas');
  canvas.className = 'zen-waterfall-v9';
  if (shade) host.insertBefore(canvas, shade);
  else host.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1200;
  const H = 900;
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

  function setupTransform() {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(left, 0);
    ctx.scale(scale, scale);
  }

  function strokeEllipse(x, y, rx, ry, alpha, warm) {
    ctx.strokeStyle = warm
      ? 'rgba(255,246,205,' + alpha + ')'
      : 'rgba(232,247,236,' + alpha + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.stroke();
  }

  function rock(x, y, size, alpha, cool) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
    if (cool) {
      g.addColorStop(0, '#bac9bc');
      g.addColorStop(0.42, '#7d978d');
      g.addColorStop(1, '#42645e');
    } else {
      g.addColorStop(0, '#cad3ba');
      g.addColorStop(0.42, '#879c8f');
      g.addColorStop(1, '#4a6960');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - size, y + size * 0.08);
    ctx.bezierCurveTo(x - size * 0.92, y - size * 0.54, x - size * 0.38, y - size * 0.84, x + size * 0.05, y - size * 0.65);
    ctx.bezierCurveTo(x + size * 0.50, y - size * 0.78, x + size * 0.82, y - size * 0.24, x + size, y + size * 0.05);
    ctx.bezierCurveTo(x + size * 0.72, y + size * 0.27, x - size * 0.69, y + size * 0.29, x - size, y + size * 0.08);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,247,209,.24)';
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.60, y - size * 0.08);
    ctx.quadraticCurveTo(x - size * 0.06, y - size * 0.48, x + size * 0.48, y - size * 0.25);
    ctx.stroke();
    ctx.restore();
  }

  function drawRockBank(fallX, lipY, waterY, mobile) {
    /*
      Solid rear mass is intentional: it physically occludes bamboo from the main scenery canvas,
      so stems cannot appear to pass through the stones.
    */
    const leftEdge = fallX - (mobile ? 142 : 165);
    const rightEdge = fallX + (mobile ? 152 : 188);

    const back = ctx.createLinearGradient(leftEdge, lipY - 70, rightEdge, waterY + 60);
    back.addColorStop(0, '#9cad9f');
    back.addColorStop(0.44, '#718b82');
    back.addColorStop(1, '#496b66');
    ctx.fillStyle = back;
    ctx.beginPath();
    ctx.moveTo(leftEdge, waterY + 34);
    ctx.bezierCurveTo(leftEdge + 7, lipY + 14, leftEdge + 58, lipY - 38, fallX - 72, lipY - 20);
    ctx.bezierCurveTo(fallX - 26, lipY - 74, fallX + 18, lipY - 52, fallX + 40, lipY - 18);
    ctx.bezierCurveTo(fallX + 94, lipY - 43, rightEdge - 13, lipY + 18, rightEdge, waterY + 28);
    ctx.lineTo(rightEdge, waterY + 66);
    ctx.lineTo(leftEdge, waterY + 66);
    ctx.closePath();
    ctx.fill();

    /* Individual stones keep the organic look but remain opaque enough to hide bamboo. */
    rock(fallX - 86, lipY + 22, 49, 0.96, true);
    rock(fallX - 38, lipY - 2, 62, 0.99, false);
    rock(fallX + 20, lipY + 12, 58, 0.98, true);
    rock(fallX + 70, lipY + 31, 50, 0.96, false);
    rock(fallX + 111, lipY + 56, 42, 0.93, true);
    rock(fallX - 118, lipY + 61, 39, 0.91, true);

    /* Wet crevice: exact source of the waterfall. */
    const notch = ctx.createRadialGradient(fallX + 18, lipY + 27, 1, fallX + 18, lipY + 27, 52);
    notch.addColorStop(0, 'rgba(33,65,62,.56)');
    notch.addColorStop(0.55, 'rgba(40,73,68,.20)');
    notch.addColorStop(1, 'rgba(40,73,68,0)');
    ctx.fillStyle = notch;
    ctx.fillRect(fallX - 38, lipY - 6, 118, 78);

    /* Water covers the bottom of the bank: stones now sit in the pond rather than on top of it. */
    const waterVeil = ctx.createLinearGradient(0, waterY - 18, 0, waterY + 82);
    waterVeil.addColorStop(0, 'rgba(166,205,195,.08)');
    waterVeil.addColorStop(0.34, 'rgba(151,197,190,.31)');
    waterVeil.addColorStop(1, 'rgba(123,179,176,.53)');
    ctx.fillStyle = waterVeil;
    ctx.fillRect(leftEdge - 10, waterY - 18, rightEdge - leftEdge + 20, 100);

    /* Small surface reflections tie the bank to the rest of the moving water. */
    ctx.strokeStyle = 'rgba(248,247,216,.13)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const yy = waterY + 10 + i * 13;
      ctx.beginPath();
      ctx.moveTo(leftEdge + 26 + i * 7, yy);
      ctx.quadraticCurveTo(fallX - 10, yy - 2, rightEdge - 34 - i * 6, yy + 1);
      ctx.stroke();
    }
  }

  function drawCascade(fallX, lipY, waterY, time, mobile) {
    const strandCount = mobile ? 20 : 22;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const mist = ctx.createRadialGradient(fallX + 24, waterY, 0, fallX + 24, waterY, 92);
    mist.addColorStop(0, 'rgba(247,249,219,.24)');
    mist.addColorStop(0.42, 'rgba(227,246,232,.12)');
    mist.addColorStop(1, 'rgba(227,246,232,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(fallX - 82, waterY - 68, 200, 140);

    for (let i = 0; i < strandCount; i++) {
      const sx = fallX - 5 + i * 2.55;
      const phase = i * 0.59;
      const sway = reduced.matches ? 0 : Math.sin(time * 1.08 + phase) * (1.0 + (i % 4) * 0.32);
      const shimmer = reduced.matches ? 0.22 : 0.18 + 0.18 * (Math.sin(time * 1.52 + phase) + 1) * 0.5;
      const startY = lipY + 28 + (i % 3) * 1.2;
      const endX = sx + 13 + sway * 1.8;

      ctx.strokeStyle = 'rgba(235,249,233,' + shimmer + ')';
      ctx.lineWidth = i % 5 === 0 ? 2.05 : (i % 2 === 0 ? 1.25 : 0.9);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, startY);
      ctx.bezierCurveTo(sx - 2 + sway, startY + 28, sx + 3 + sway, waterY - 32, endX, waterY);
      ctx.stroke();

      if (!reduced.matches && i % 2 === 0) {
        const p = (time * 0.52 + i / strandCount) % 1;
        ctx.fillStyle = 'rgba(255,245,194,' + (0.15 + (1 - p) * 0.20) + ')';
        ctx.beginPath();
        ctx.ellipse(sx + 13 * p * p, startY + (waterY - startY) * p, 0.85, 2.55, 0, 0, TAU);
        ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(255,247,207,.30)';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(fallX - 10, lipY + 27);
    ctx.bezierCurveTo(fallX + 7, lipY + 24, fallX + 29, lipY + 29, fallX + 50, lipY + 25);
    ctx.stroke();
    ctx.restore();

    const rippleTime = reduced.matches ? 0.32 : time;
    for (let i = 0; i < 5; i++) {
      const p = reduced.matches ? 0.38 : (rippleTime * 0.24 + i / 5) % 1;
      strokeEllipse(fallX + 24, waterY + 4, 9 + p * 72, 2.2 + p * 11, (1 - p) * 0.32, i % 2 === 0);
    }
  }

  function draw(time) {
    setupTransform();
    if (document.body.dataset.kind !== 'meditation') return;

    const mobile = width < 700;
    /* Positioned at the right-hand bank: visible on mobile, outside the main text column. */
    const fallX = mobile ? 928 : 1010;
    const lipY = mobile ? 528 : 510;
    const waterY = mobile ? 642 : 612;

    drawRockBank(fallX, lipY, waterY, mobile);
    drawCascade(fallX, lipY, waterY, time, mobile);
  }

  function resize() {
    const box = host.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    ratio = Math.min(window.devicePixelRatio || 1, 1.45, Math.sqrt(1200000 / (width * height)));
    scale = Math.max(width / W, height / H);
    left = (width - W * scale) * (width < 600 ? 0.69 : 0.5);
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

  resize();
})();
