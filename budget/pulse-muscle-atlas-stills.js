/** Art-directed stills; reusable WebGL model remains on pulse-exercise-guide-3d.html. */
const target = document.getElementById('atlas-stills');
const visual = document.querySelector('.atlas-visual');
const status = document.getElementById('atlas-stills-status');
const base = new URL('./assets/atlas-art-v1/', import.meta.url);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const cache = new Map();
let manifest, current, generation = 0, requested = '', zoomed = true;
let group = document.getElementById('atlas-selected-name')?.textContent || 'Bröst';
function loadImage(name) {
  if (!cache.has(name)) {
    const img = new Image();
    img.src = new URL(name, base).href;
    cache.set(name, img.decode().then(() => img.src).catch(error => { cache.delete(name); throw error; }));
  }
  return cache.get(name);
}
function camera(entering = false) {
  if (!current) return;
  const previous = getComputedStyle(current).transform;
  current.getAnimations().forEach(animation => animation.cancel());
  const info = manifest.groups[target.dataset.muscle];
  const scale = zoomed ? info.zoom : 1;
  current.style.transform = `scale(${scale})`;
  target.dataset.camera = zoomed ? 'closeup' : 'overview';
  if (!reducedMotion.matches) {
    const frames = entering ? [
      { transform: 'scale(1)', opacity: 0, offset: 0 },
      { transform: `scale(${1 + (scale - 1) * .7})`, opacity: 1, offset: .3 },
      { transform: `scale(${scale})`, opacity: 1, offset: 1 }
    ] : [{ transform: previous }, { transform: `scale(${scale})` }];
    current.animate(frames, {duration: entering ? 1300 : 650, easing: 'cubic-bezier(.22,.61,.36,1)'});
  }
}
function fail() {
  clearTimeout(window.__pulseAtlasFallbackTimeout);
  document.documentElement.classList.remove('atlas-stills-pending');
  document.documentElement.classList.add('atlas-stills-failed');
  status.textContent = 'Bildvyn kunde inte laddas. Du kan fortfarande välja muskelgrupp.';
}
async function showSelection() {
  if (!manifest?.groups[group] || requested === group) return;
  const selected = group, run = ++generation;
  requested = selected;
  target.setAttribute('aria-busy','true');
  try {
    const info = manifest.groups[selected];
    const src = await loadImage(info.image);
    const next = new Image(1024,1024);
    next.src = src;
    next.alt = `${selected} markerad i korall på en genomskinlig anatomisk illustration.`;
    next.draggable = false;
    next.className = 'atlas-art-image';
    next.style.transformOrigin = info.origin;
    await next.decode();
    if (run !== generation) return;
    for (const img of target.children) if (img !== current) img.remove();
    const previous = current;
    if (previous) { previous.getAnimations().forEach(a=>a.cancel()); previous.alt=''; previous.setAttribute('aria-hidden','true'); }
    target.append(next);
    current = next;
    target.dataset.muscle = selected;
    target.setAttribute('aria-busy','false');
    clearTimeout(window.__pulseAtlasFallbackTimeout);
    document.documentElement.classList.remove('atlas-stills-pending','atlas-stills-failed');
    visual.classList.add('atlas-stills-ready');
    target.hidden = false;
    status.textContent = '';
    camera(true);
    // WebKit can suspend offscreen animations: retire the old layer independently
    // after the short crossfade, while the new image continues its gentle zoom.
    if (reducedMotion.matches) previous?.remove();
    else setTimeout(()=>previous?.remove(),600);
  } catch (error) {
    if (run !== generation) return;
    target.setAttribute('aria-busy','false');
    requested = '';
    if (!current) fail();
    else status.textContent = 'Bilden kunde inte laddas. Välj muskelgruppen igen för att försöka på nytt.';
  }
}
if (target && visual) {
  document.addEventListener('pulse:atlas-sync', event => {
    if (event.detail?.group) group = event.detail.group;
    showSelection();
  });
  for (const id of ['atlas-closeup','atlas-overview']) document.getElementById(id)?.addEventListener('click',()=>{
    zoomed = id === 'atlas-closeup';
    document.getElementById('atlas-closeup').setAttribute('aria-pressed',String(zoomed));
    document.getElementById('atlas-overview').setAttribute('aria-pressed',String(!zoomed));
    camera();
  });
  reducedMotion.addEventListener('change',()=>camera());
  try {
    const response = await fetch(new URL('manifest.json',base));
    if (!response.ok) throw new Error('Atlas images unavailable');
    manifest = await response.json();
    await showSelection();
  } catch (error) { fail(); }
}
