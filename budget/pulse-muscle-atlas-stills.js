/** Still-image atlas. The preserved, reusable WebGL model is on pulse-exercise-guide-3d.html. */
const target = document.getElementById('atlas-stills');
const visual = document.querySelector('.atlas-visual');
const status = document.getElementById('atlas-stills-status');
const base = new URL('./assets/atlas-stills-v1/', import.meta.url);
const backGroups = new Set(['Rygg','Triceps','Säte','Baksida lår','Vader']);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const cache = new Map();
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let manifest, neutral, highlight, angle = 1, generation = 0, renderedKey = '', requestedKey = '', queued = false;
let group = document.getElementById('atlas-selected-name')?.textContent || 'Bröst';
let side = document.getElementById('atlas-back')?.getAttribute('aria-pressed') === 'true' ? 'back' : 'front';
function loadImage(name) {
  if (!cache.has(name)) {
    const img = new Image();
    img.src = new URL(name, base).href;
    const promise = img.decode().then(() => img).catch(error => { cache.delete(name); throw error; });
    cache.set(name, promise);
  }
  return cache.get(name);
}
function rotationSteps(from, to) {
  const steps = [];
  let delta = (to - from + 12) % 12;
  if (delta > 6) delta -= 12;
  const direction = Math.sign(delta);
  for (let i = 1; i <= Math.abs(delta); i++) steps.push((from + i * direction + 12) % 12);
  return steps;
}
function ready() {
  clearTimeout(window.__pulseAtlasFallbackTimeout);
  document.documentElement.classList.remove('atlas-stills-pending','atlas-stills-failed');
  visual.classList.add('atlas-stills-ready');
  target.hidden = false;
  status.textContent = '';
}
async function showSelection() {
  if (!manifest?.groups[group]) return;
  const selectedGroup = group, selectedSide = side;
  const key = `${selectedGroup}:${selectedSide}`;
  if (requestedKey === key) return;
  requestedKey = key;
  const run = ++generation;
  const view = manifest.groups[selectedGroup][selectedSide];
  const steps = rotationSteps(angle, view.angle);
  target.setAttribute('aria-busy','true');
  try {
    const [active, resting] = await Promise.all([
      loadImage(view.image), loadImage(manifest.neutral[view.angle]),
      ...steps.map(step => loadImage(manifest.neutral[step]))
    ]);
    if (run !== generation) return;
    if (renderedKey && !reducedMotion.matches) {
      target.classList.remove('is-highlighted');
      await pause(130);
      if (run !== generation) return;
      for (const step of steps) {
        neutral.src = (await loadImage(manifest.neutral[step])).src;
        angle = step;
        await pause(48);
        if (run !== generation) return;
      }
    }
    neutral.src = resting.src;
    angle = view.angle;
    highlight.src = active.src;
    highlight.alt = `${selectedGroup} markerad, ${selectedSide === 'back' ? 'bakifrån' : 'framifrån'}.`;
    await highlight.decode();
    if (run !== generation) return;
    ready();
    // A separate paint lets the highlight fade in after the final viewing angle.
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (run !== generation) return;
    target.classList.add('is-highlighted');
    target.dataset.muscle = selectedGroup;
    target.dataset.view = selectedSide;
    target.dataset.angle = String(angle * 30);
    renderedKey = key;
    target.setAttribute('aria-busy','false');
  } catch (error) {
    if (run !== generation) return;
    target.setAttribute('aria-busy','false');
    requestedKey = '';
    if (!renderedKey) fail();
    else status.textContent = 'Bilden kunde inte laddas. Välj muskelgruppen igen för att försöka på nytt.';
  }
}
function schedule() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; showSelection(); });
}
function fail() {
  clearTimeout(window.__pulseAtlasFallbackTimeout);
  document.documentElement.classList.remove('atlas-stills-pending');
  document.documentElement.classList.add('atlas-stills-failed');
  status.textContent = 'Bildvyn kunde inte laddas. Du kan fortfarande välja muskler i 2D-atlasen.';
}
if (target && visual) {
  neutral = document.createElement('img');
  neutral.className = 'atlas-still-neutral'; neutral.alt = ''; neutral.setAttribute('aria-hidden','true');
  highlight = document.createElement('img'); highlight.className = 'atlas-still-highlight';
  for (const img of [neutral,highlight]) { img.width = 720; img.height = 900; img.draggable = false; }
  target.append(neutral,highlight);
  document.addEventListener('pulse:atlas-sync', event => {
    const details = event.detail || {};
    if (details.group && details.group !== group) {
      group = details.group;
      side = backGroups.has(group) ? 'back' : 'front';
    }
    if (details.view === 'front' || details.view === 'back') side = details.view;
    schedule();
  });
  try {
    const response = await fetch(new URL('manifest.json',base));
    if (!response.ok) throw new Error('Atlas images unavailable');
    manifest = await response.json();
    await showSelection();
    // Warm only the twelve neutral angles; highlighted views load when selected.
    if (renderedKey) for (const name of manifest.neutral) loadImage(name).catch(() => {});
  } catch (error) { fail(); }
}
