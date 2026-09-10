/* Zen waterfall v10: visible mobile-first cascade aligned to its own rock shelf. */
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

  function strokeEllipse(x, y, rx, ry, alpha) {
    ctx.strokeStyle = 'rgba(244,250,232,' + alpha + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.stroke();
  }

  function rock(x, y, size, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
    g.addColorStop(0, '#c7d1b9');
    g.addColorStop(0.40, '#849a8e');
    g.addColorStop(1, '#48675f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - size, y + size * 0.08);
    ctx.bezierCurveTo(x - size * 0.92, y - size * 0.54, x - size * 0.38, y - size * 0.84, x + size * 0.05, y - size * 0.65);
    ctx.bezierCurveTo(x + size * 0.50, y - size * 0.78, x + size * 0.82, y - size * 0.24, x + size, y + size * 0.05);
    ctx.bezierCurveTo(x + size * 0.72, y + size * 0.27, x - size * 0.69, y + size * 0.29, x - size, y + size * 0.08);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,246,205,.28)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.62, y - size * 0.08);
    ctx.quadraticCurveTo(x - size * 0.05, y - size * 0.50, x + size * 0.50, y - size * 0.26);
    ctx.stroke();
    ctx.restore();
  }

  function draw(time) {
    setupTransform();
    if (document.body.dataset.kind !== 'meditation') return;

    const mobile = width < 700;
    /* This position stays well inside the mobile crop instead of at the far-right edge. */
    const fallX = mobile ? 835 : 1010;
    const lipY = mobile ? 492 : 510;
    const waterY = 594;
    const strandCount = mobile ? 20 : 22;

    /* A small coherent rock shelf: the water begins at the lip instead of in empty space. */
    rock(fallX - 60, lipY + 17, 46, 0.72);
    rock(fallX - 18, lipY + 2, 58, 0.82);
    rock(fallX + 35, lipY + 18, 48, 0.78);
    rock(fallX + 72, lipY + 41, 42, 0.64);
    rock(fallX - 83, lipY + 49, 38, 0.58);

    /* Dark wet notch under the lip gives the cascade a physical origin. */
    const notch = ctx.createRadialGradient(fallX + 10, lipY + 18, 2, fallX + 10, lipY + 18, 45);
    notch.addColorStop(0, 'rgba(42,77,70,.38)');
    notch.addColorStop(1, 'rgba(42,77,70,0)');
    ctx.fillStyle = notch;
    ctx.fillRect(fallX - 40, lipY - 5, 105, 65);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const mist = ctx.createRadialGradient(fallX + 22, waterY, 0, fallX + 22, waterY, 88);
    mist.addColorStop(0, 'rgba(247,249,219,.22)');
    mist.addColorStop(0.42, 'rgba(227,246,232,.11)');
    mist.addColorStop(1, 'rgba(227,246,232,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(fallX - 78, waterY - 65, 190, 135);

    for (let i = 0; i < strandCount; i++) {
      const sx = fallX - 4 + i * 2.55;
      const phase = i * 0.59;
      const sway = reduced.matches ? 0 : Math.sin(time * 1.08 + phase) * (1.0 + (i % 4) * 0.32);
      const shimmer = reduced.matches ? 0.22 : 0.18 + 0.18 * (Math.sin(time * 1.52 + phase) + 1) * 0.5;
      const startY = lipY + 19 + (i % 3) * 1.3;
      const endX = sx + 12 + sway * 1.8;

      ctx.strokeStyle = 'rgba(235,249,233,' + shimmer + ')';
      ctx.lineWidth = i % 5 === 0 ? 2.05 : (i % 2 === 0 ? 1.25 : 0.9);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, startY);
      ctx.bezierCurveTo(sx - 2 + sway, startY + 27, sx + 3 + sway, waterY - 31, endX, waterY);
      ctx.stroke();

      if (!reduced.matches && i % 2 === 0) {
        const p = (time * 0.52 + i / strandCount) % 1;
        ctx.fillStyle = 'rgba(255,245,194,' + (0.15 + (1 - p) * 0.20) + ')';
        ctx.beginPath();
        ctx.ellipse(sx + 12 * p * p, startY + (waterY - startY) * p, 0.85, 2.55, 0, 0, TAU);
        ctx.fill();
      }
    }

    /* Bright but soft water edge at the lip. */
    ctx.strokeStyle = 'rgba(255,247,207,.28)';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(fallX - 9, lipY + 18);
    ctx.bezierCurveTo(fallX + 6, lipY + 15, fallX + 28, lipY + 19, fallX + 47, lipY + 16);
    ctx.stroke();
    ctx.restore();

    const rippleTime = reduced.matches ? 0.32 : time;
    for (let i = 0; i < 5; i++) {
      const p = reduced.matches ? 0.38 : (rippleTime * 0.24 + i / 5) % 1;
      strokeEllipse(fallX + 23, waterY + 4, 9 + p * 70, 2.2 + p * 11, (1 - p) * 0.31);
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
