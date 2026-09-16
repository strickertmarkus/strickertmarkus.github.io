const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('exercise.html');
const environment = read('pulse-environment/environment.js');
const environmentCss = read('pulse-environment/environment.css');
const observatoryCss = read('pulse-observatory/observatory.css');
const orbitCss = read('training-week-orbit.css');

test('CP7 exposes one four-state Observatory semantic vocabulary', () => {
  ['pending', 'current', 'completed', 'goal-achieved'].forEach(state => {
    assert.match(observatoryCss, new RegExp(`data-observatory-state="${state}"`));
  });
  assert.match(environment, /const observatoryStates = new Set\(\['pending', 'current', 'completed', 'goal-achieved'\]\)/);
  assert.match(environment, /function setObservatoryState\(node, state\)/);
});

test('semantic state maps existing truth without owning workout persistence', () => {
  assert.match(environment, /day\.classList\.contains\('done'\)[\s\S]*'completed'/);
  assert.match(environment, /day\.classList\.contains\('is-selected'\) \|\| day\.classList\.contains\('today'\)/);
  assert.match(environment, /progressState\(card\.querySelector\('\.progress-bar'\)\)/);
  assert.doesNotMatch(environment, /localStorage\.setItem|firebase\.database\(\)\.ref/);
});

test('current state is reserved for active context rather than partial progress', () => {
  assert.doesNotMatch(environment, /value > 0\) return 'current'/);
  assert.doesNotMatch(environment, /weekCount > 0 \? 'current'/);
  assert.match(environment, /stat-duration'\), duration > 0 \? 'completed' : 'pending'/);
  assert.match(environment, /is-selected'\) \|\| day\.classList\.contains\('today'\)[\s\S]*\? 'current'[\s\S]*day\.classList\.contains\('done'\)[\s\S]*\? 'completed'/);
  assert.match(environment, /start, start\.dataset\.planState === 'planned' \? 'current' : 'pending'/);
});

test('pending dims semantic decoration while the intentionally latent empty start orb may dim as a whole', () => {
  assert.match(observatoryCss, /--obs-pending-decoration:\.5/);
  assert.match(observatoryCss, /--obs-pending-glow:0 0 0 transparent/);
  const genericPending = observatoryCss.match(/#pulse-home \[data-observatory-state="pending"\]\{[^}]*\}/);
  assert.ok(genericPending, 'generic pending semantic token rule must exist');
  assert.doesNotMatch(genericPending[0], /\bopacity:/);
  assert.match(observatoryCss, /week-day::after\{[^}]*opacity:var\(--obs-state-decoration/);
  assert.match(observatoryCss, /observatory-next-orb:is\(\[data-plan-state="empty"\],\[data-observatory-state="pending"\]\)\{[^}]*opacity:\.56/);
});

test('active and achieved states use bounded OLED-friendly glow tokens', () => {
  assert.match(observatoryCss, /--obs-current-glow:0 0 12px/);
  assert.match(observatoryCss, /--obs-completed-glow:0 0 14px/);
  assert.match(observatoryCss, /--obs-achieved-glow:0 0 18px/);
});

test('cyan is reserved for Observatory identity symbols while semantic data states stay pink', () => {
  assert.match(observatoryCss, /--obs-current-accent:#ffb8cb/);
  assert.doesNotMatch(observatoryCss, /--obs-current-accent:#9be4e9/);
  assert.match(observatoryCss, /observatory-header-star\{[^}]*color:#9be4e9/);
  assert.match(observatoryCss, /observatory-kicker>\.observatory-star-glyph\{[^}]*color:#9be4e9/);
  assert.match(observatoryCss, /observatory-next-orb \.observatory-star-glyph\{[^}]*color:#9be4e9/);
  assert.match(observatoryCss, /data-overview-mode=\"observatory\"\] \.training-overview-option-icon\{color:#9be4e9/);
  assert.match(environmentCss, /record-group-toggle-v52>span:first-child::before\{[^}]*color:#9be4e9/);
});

test('metrics next action goals and both week geometries consume shared state tokens', () => {
  assert.match(observatoryCss, /observatory-metrics \.stat-card\[data-observatory-state\]::after/);
  assert.match(observatoryCss, /observatory-next-orb\[data-observatory-state\]/);
  assert.match(observatoryCss, /pulse-goals \.goal-card\[data-observatory-state\]::after/);
  assert.match(environmentCss, /progress-bar\{[^}]*linear-gradient\(90deg,#a73761,#ffb4cd\)/);
  assert.match(environmentCss, /progress-marker\{[^}]*background:#ffe3ef/);
  assert.doesNotMatch(environmentCss, /progress-bar\{[^}]*var\(--obs-state/);
  assert.doesNotMatch(environmentCss, /progress-marker\{[^}]*var\(--obs-state/);
  assert.match(orbitCss, /week-orbit-layout \.week-day::before\{[\s\S]*var\(--obs-state-border/);
  assert.doesNotMatch(orbitCss, /week-day\.(?:is-selected|done|today|pending)::before/);
});

test('production cache-busts every modified CP7 presentation owner', () => {
  assert.match(html, /pulse-environment\/environment\.css\?v=20260915-main-cp7-symbol-cyan-1/);
  assert.match(html, /pulse-observatory\/observatory\.css\?v=20260916-main-next-pass-orb-2/);
  assert.match(html, /training-week-orbit\.css\?v=20260915-main-cp7-state-1/);
  assert.match(html, /pulse-environment\/environment\.js\?v=20260916-main-next-pass-orb-2/);
});
