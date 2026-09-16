const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const dashboard = read('exercise-dashboard.js');
const orbitShim = read('training-week-orbit.js');
const orbitCss = read('training-week-orbit.css');
const html = read('exercise.html');
const starPath = 'M12 1.8C13.3 7.15 16.85 10.7 22.2 12C16.85 13.3 13.3 16.85 12 22.2C10.7 16.85 7.15 13.3 1.8 12C7.15 10.7 10.7 7.15 12 1.8Z';

const orbitStart = dashboard.indexOf('/* ── Canonical weekly plan: linear ↔ Observatory orbit');
const orbit = dashboard.slice(orbitStart);

test('weekly orbit keeps one progress state and one temporary animation-frame owner', () => {
  assert.match(orbit, /var weekOrbitProgress = 0;/);
  assert.match(orbit, /function orbitFrame\(now\)/);
  assert.equal((orbit.match(/requestAnimationFrame\(orbitFrame\)/g) || []).length, 1);
  assert.doesNotMatch(orbit, /setInterval\(/);
});

test('orbit reuses the canonical week grid and never clones interactive day nodes', () => {
  assert.match(orbit, /var grid = document\.getElementById\('week-grid'\);/);
  assert.match(orbit, /Array\.from\(grid\.querySelectorAll\('\.week-day'\)\)/);
  assert.doesNotMatch(orbit, /cloneNode\(/);
  assert.equal((html.match(/id="week-grid"/g) || []).length, 1);
  assert.match(html, /data-week-orbit-shell/);
});

test('CP6 uses one small click-only expand control in the weekly header', () => {
  const week = html.slice(html.indexOf('<section class="observatory-week"'), html.indexOf('<hr class="rule compact-only">'));
  assert.match(week, /observatory-week-title-row/);
  assert.match(week, /class="week-orbit-toggle observatory-only"/);
  assert.match(week, /class="week-orbit-expand-symbol"/);
  assert.ok(week.indexOf('week-orbit-toggle') < week.indexOf('<h2>Veckoplan</h2>'));
  assert.match(orbit, /weekOrbitToggle\.addEventListener\('click'/);
  assert.doesNotMatch(orbit, /pointerdown|pointermove|pointerup|pointercancel|setPointerCapture|releasePointerCapture|weekOrbitDrag|SuppressClick/);
  assert.doesNotMatch(orbitCss, /touch-action:none|data-dragging|week-orbit-grip|week-orbit-chevron/);
});

test('click animation remains reversible and reduced motion takes the instant path', () => {
  assert.match(orbit, /settleOrbit\(weekOrbitProgress < \.5, false\)/);
  assert.match(orbit, /aria-expanded/);
  assert.match(orbit, /if \(immediate \|\| reduced\.matches\)/);
  assert.match(orbitCss, /@media \(prefers-reduced-motion:reduce\)/);
});

test('week rerenders and overview switches cannot leave stale orbit layout', () => {
  assert.match(orbit, /recaptureOrbitAfterLayoutChange/);
  assert.match(orbit, /MutationObserver\(function \(\) \{\s*if \(weekOrbitProgress > 0\) recaptureOrbitAfterLayoutChange\(\);/);
  assert.match(orbit, /if \(!orbitAvailable\(\) && weekOrbitProgress > 0\) settleOrbit\(0, true\)/);
});

test('orbit visual language preserves day semantics and uses the canonical Observatory star in the centre', () => {
  assert.match(orbitCss, /var\(--obs-state-border/);
  assert.match(orbitCss, /var\(--obs-state-fill/);
  assert.match(orbitCss, /var\(--obs-state-glow/);
  assert.doesNotMatch(orbitCss, /week-day\.(?:is-selected|done|today|pending)::before/);
  assert.match(orbitCss, /week-orbit-trace-secondary/);
  assert.match(orbitCss, /week-orbit-center-symbol/);
  assert.match(html, new RegExp(starPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(html, /week-orbit-stars|week-orbit-axis/);
});

test('orbit stylesheet is Observatory-scoped and structurally balanced', () => {
  assert.match(orbitCss, /html\[data-training-overview="observatory"\]/);
  assert.match(orbitCss, /html\[data-training-overview="compact"\] \.week-orbit-toggle/);
  const opens = (orbitCss.match(/\{/g) || []).length;
  const closes = (orbitCss.match(/\}/g) || []).length;
  assert.equal(opens, closes);
});

test('CP10 gives orbit behavior one canonical dashboard owner', () => {
  assert.match(orbitShim, /ownership moved to exercise-dashboard\.js/);
  assert.doesNotMatch(orbitShim, /weekOrbitProgress|function orbitFrame/);
  assert.equal((dashboard.match(/function orbitFrame\(now\)/g) || []).length, 1);
  assert.match(html, /training-week-orbit\.css\?v=20260915-main-cp7-state-1/);
});
