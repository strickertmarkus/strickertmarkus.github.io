const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const orbit = read('training-week-orbit.js');
const orbitCss = read('training-week-orbit.css');
const html = read('exercise.html');

test('weekly orbit owns one progress state and one animation-frame owner', () => {
  assert.match(orbit, /let weekOrbitProgress = 0;/);
  assert.match(orbit, /function orbitFrame\(now\)/);
  assert.equal((orbit.match(/requestAnimationFrame\(orbitFrame\)/g) || []).length, 1);
  assert.doesNotMatch(orbit, /setInterval\(/);
});

test('orbit reuses the canonical week grid and never clones interactive day nodes', () => {
  assert.match(orbit, /const grid = document\.getElementById\('week-grid'\);/);
  assert.match(orbit, /shell\.appendChild\(grid\)/);
  assert.match(orbit, /Array\.from\(grid\.querySelectorAll\('\.week-day'\)\)/);
  assert.doesNotMatch(orbit, /cloneNode\(/);
  assert.equal((html.match(/id="week-grid"/g) || []).length, 1);
});

test('mobile drag follows pointer progress and captures scrolling only on the affordance', () => {
  assert.match(orbit, /toggle\.setPointerCapture\(event\.pointerId\)/);
  assert.match(orbit, /weekOrbitProgress = clamp01\(weekOrbitDrag\.startProgress \+ delta\)/);
  assert.match(orbit, /event\.preventDefault\(\)/);
  assert.match(orbitCss, /week-orbit-toggle\{[\s\S]*touch-action:none/);
  assert.doesNotMatch(orbitCss, /week-orbit-shell\{[^}]*touch-action:none/);
});

test('expanded state has an explicit reversible control and reduced-motion instant path', () => {
  assert.match(orbit, /aria-expanded/);
  assert.match(orbit, /Stäng orbit/);
  assert.match(orbit, /if \(immediate \|\| reduced\.matches\)/);
  assert.match(orbitCss, /@media \(prefers-reduced-motion:reduce\)/);
});

test('week rerenders and overview switches cannot leave stale orbit layout', () => {
  assert.match(orbit, /recaptureOrbitAfterLayoutChange/);
  assert.match(orbit, /MutationObserver\(function \(\) \{\s*if \(weekOrbitProgress > 0\) recaptureOrbitAfterLayoutChange\(\);/);
  assert.match(orbit, /if \(!orbitAvailable\(\) && weekOrbitProgress > 0\) settleOrbit\(0, true\)/);
});

test('orbit visual language preserves selected, completed, current and pending day semantics', () => {
  assert.match(orbitCss, /week-day\.is-selected::before/);
  assert.match(orbitCss, /week-day\.done::before/);
  assert.match(orbitCss, /week-day\.today::before/);
  assert.match(orbitCss, /week-day\.pending::before/);
  assert.match(orbitCss, /week-orbit-trace-secondary/);
  assert.match(orbitCss, /week-orbit-stars/);
});

test('orbit stylesheet is Observatory-scoped and structurally balanced', () => {
  assert.match(orbitCss, /html\[data-training-overview="observatory"\]/);
  assert.match(orbitCss, /html\[data-training-overview="compact"\] \.week-orbit-control/);
  const opens = (orbitCss.match(/\{/g) || []).length;
  const closes = (orbitCss.match(/\}/g) || []).length;
  assert.equal(opens, closes);
});

test('production page loads the CP6 orbit assets with cache keys', () => {
  assert.match(html, /training-week-orbit\.css\?v=20260915-main-cp6-1/);
  assert.match(html, /training-week-orbit\.js\?v=20260915-main-cp6-1/);
});
