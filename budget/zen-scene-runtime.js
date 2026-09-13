/* One clock for the visible Zen landscape. Layers retain independent compositing. */
(function () {
  'use strict';
  const host = document.querySelector('.landscape');
  if (!host) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const layers = [];
  let frame = 0, visible = true, suspended = false;
  let kind = document.body.dataset.kind, outgoing = null, fadeUntil = 0;
  let inSession = document.body.classList.contains('in-session');

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function drawable() { return visible && !document.hidden && !suspended; }
  function paint(layer, now) {
    layer.draw(motion.matches ? 0 : now / 1000);
    layer.last = now;
  }
  function loop(now) {
    frame = 0;
    if (!drawable() || motion.matches) return;
    for (const layer of layers) {
      const active = layer.kind === kind || (layer.fade && layer.kind === outgoing && now < fadeUntil);
      if (active && now - layer.last >= layer.interval) paint(layer, now);
    }
    frame = requestAnimationFrame(loop);
  }
  function wake() {
    stop();
    if (!drawable()) return;
    if (motion.matches) layers.forEach(layer => paint(layer, 0));
    else frame = requestAnimationFrame(loop);
  }
  function resize() {
    layers.forEach(layer => layer.resize());
    wake();
  }
  window.ZenSceneRuntime = {
    register(layer) {
      layer.last = -Infinity;
      layers.push(layer);
      layer.resize();
      wake();
    },
    invalidate() {
      if (drawable()) layers.forEach(layer => paint(layer, performance.now()));
    }
  };
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; wake(); }).observe(host);
  new MutationObserver(() => {
    const next = document.body.dataset.kind;
    const session = document.body.classList.contains('in-session');
    if (next !== kind) {
      outgoing = kind; kind = next; fadeUntil = performance.now() + 1600;
      layers.forEach(layer => { if (layer.onModeChange) layer.onModeChange(); });
      window.ZenSceneRuntime.invalidate();
      wake();
    }
    if (session !== inSession) { inSession = session; resize(); }
  }).observe(document.body, { attributes: true, attributeFilter: ['data-kind', 'class'] });
  motion.addEventListener('change', wake);
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('pagehide', () => { suspended = true; stop(); });
  window.addEventListener('pageshow', () => { suspended = false; wake(); });
})();
