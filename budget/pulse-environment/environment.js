/* Presentation only. Data and training controls belong to the shared runtime. */
(function () {
  'use strict';

  function updateNavigation() {
    const profile = new URLSearchParams(location.search).get('user');
    const query = profile === 'maja' ? '?user=maja' : '';
    document.querySelectorAll('[data-pulse-original]').forEach(function (link) {
      link.href = new URL('exercise.html' + query, document.baseURI).href;
    });
    const current = document.querySelector('#pulse-header [data-destination="training"]');
    if (current) current.href = location.pathname + query;
    const profileToggle = document.getElementById('exercise-user-toggle');
    const menu = document.getElementById('nav-menu');
    if (profileToggle && menu) menu.prepend(profileToggle);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavigation, { once: true });
  } else {
    updateNavigation();
  }

  const canvas = document.getElementById('pulse-environment');
  const ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const session = document.getElementById('session-modal');
  let width = 1;
  const height = 1280;
  let ratio = 1;
  let frame = 0;
  let last = 0;
  let visible = true;

  function point(t, lane) {
    const farX = width * .86;
    const nearX = width * (.05 + lane * .16);
    const depth = t * t;
    return {
      x: farX + (nearX - farX) * depth + Math.sin(t * 5.6 + lane * .18) * width * .07 * t,
      y: 90 + depth * 1080
    };
  }

  function paint(time) {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const halo = ctx.createRadialGradient(width * .86, 150, 0, width * .86, 200, width * .7);
    halo.addColorStop(0, 'rgba(214,35,76,.16)');
    halo.addColorStop(.04, 'rgba(190,31,68,.13)');
    halo.addColorStop(.4, 'rgba(116,20,47,.08)');
    halo.addColorStop(1, 'rgba(8,9,14,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    // Three pairs of traces give the light field depth and direction.
    for (let lane = 0; lane < 6; lane++) {
      ctx.beginPath();
      for (let j = 0; j <= 70; j++) {
        const p = point(j / 70, lane);
        if (j) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
      }
      ctx.lineWidth = lane % 2 ? 1 : 1.4;
      ctx.strokeStyle = lane % 2 ? 'rgba(245,82,112,.13)' : 'rgba(255,55,96,.24)';
      ctx.shadowColor = '#ff3f66';
      ctx.shadowBlur = lane % 2 ? 5 : 17;
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (lane % 2 === 0) {
        const t = reduced.matches ? .55 : ((time * .000038 + lane * .17) % 1);
        const p = point(t, lane);
        const light = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 25);
        light.addColorStop(0, 'rgba(255,158,171,.63)');
        light.addColorStop(.13, 'rgba(255,61,103,.24)');
        light.addColorStop(1, 'rgba(255,61,103,0)');
        ctx.fillStyle = light;
        ctx.fillRect(p.x - 25, p.y - 25, 50, 50);
      }
    }

    // Sparse contours connect the light traces.
    for (let n = 0; n < 7; n++) {
      const t = .24 + n * .1;
      const p = point(t, 0);
      const q = point(t, 5);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.bezierCurveTo(width * .38, p.y + 25, width * .68, q.y - 24, q.x, q.y);
      ctx.strokeStyle = 'rgba(194,87,119,' + (.045 + n * .009) + ')';
      ctx.lineWidth = .7;
      ctx.stroke();
    }
  }

  function active() {
    return !document.hidden && visible && !(session && session.classList.contains('show'));
  }
  function loop(now) {
    frame = 0;
    if (!active() || reduced.matches) return;
    if (now - last > 40) { last = now; paint(now); }
    frame = requestAnimationFrame(loop);
  }
  function wake() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (!active()) return;
    paint(reduced.matches ? 0 : performance.now());
    if (!reduced.matches) frame = requestAnimationFrame(loop);
  }
  function resize() {
    width = canvas.clientWidth || innerWidth;
    ratio = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(1500000 / (width * height)));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    wake();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    wake();
  }).observe(canvas);
  if (session) new MutationObserver(wake).observe(session, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', wake);
  reduced.addEventListener('change', wake);
  addEventListener('pagehide', function () {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  });
  addEventListener('pageshow', wake);
  resize();
})();
