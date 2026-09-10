/* Zen waterfall v9: a visible running-water detail aligned to the meditation rock bank. */
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

  function drawEllipse(x, y, rx, ry, alpha) {
    ctx.strokeStyle = 'rgba(239,249,235,' + alpha + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.stroke();
  }

  function draw(time) {
    setupTransform();
    if (document.body.dataset.kind !== 'meditation') return;

    const mobile = width < 700;
    const fallX = mobile ? 900 : 1045;
    const topY = mobile ? 532 : 545;
    const baseY = 700;
    const strandCount = mobile ? 16 : 19;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const mist = ctx.createRadialGradient(fallX + 20, baseY - 2, 0, fallX + 20, baseY - 2, 82);
    mist.addColorStop(0, 'rgba(247,248,215,.16)');
    mist.addColorStop(.45, 'rgba(225,245,230,.08)');
    mist.addColorStop(1, 'rgba(225,245,230,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(fallX - 70, baseY - 65, 180, 130);

    for (let i = 0; i < strandCount; i++) {
      const sx = fallX + i * 2.6;
      const phase = i * 0.63;
      const sway = reduced.matches ? 0 : Math.sin(time * 1.05 + phase) * (1.2 + (i % 3) * 0.35);
      const shimmer = reduced.matches ? 0.16 : 0.12 + 0.13 * (Math.sin(time * 1.45 + phase) + 1) * 0.5;
      const endX = sx + 17 + sway * 2.2;

      ctx.strokeStyle = 'rgba(232,248,231,' + shimmer + ')';
      ctx.lineWidth = i % 4 === 0 ? 1.8 : 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, topY + (i % 4) * 1.5);
      ctx.bezierCurveTo(sx - 3 + sway, topY + 44, sx + 4 + sway, baseY - 48, endX, baseY);
      ctx.stroke();

      if (!reduced.matches && i % 2 === 0) {
        const p = (time * 0.48 + i / strandCount) % 1;
        ctx.fillStyle = 'rgba(255,245,195,' + (0.12 + (1 - p) * 0.18) + ')';
        ctx.beginPath();
        ctx.ellipse(sx + 17 * p * p, topY + (baseY - topY) * p, 0.8, 2.4, 0, 0, TAU);
        ctx.fill();
      }
    }

    ctx.restore();

    const rippleTime = reduced.matches ? 0.32 : time;
    for (let i = 0; i < 4; i++) {
      const p = reduced.matches ? 0.38 : (rippleTime * 0.22 + i / 4) % 1;
      drawEllipse(fallX + 42, baseY + 4, 8 + p * 64, 2 + p * 10, (1 - p) * 0.28);
    }
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
