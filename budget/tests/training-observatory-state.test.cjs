const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('exercise.html');
const dashboard = read('exercise-dashboard.js');
const environmentShim = read('pulse-environment/environment.js');
const environmentCss = read('pulse-environment/environment.css');
const observatoryCss = read('pulse-observatory/observatory.css');
const orbitCss = read('training-week-orbit.css');

test('CP7 exposes one four-state Observatory semantic vocabulary', () => {
  ['pending', 'current', 'completed', 'goal-achieved'].forEach(state => {
    assert.match(observatoryCss, new RegExp(`data-observatory-state="${state}"`));
  });
  assert.match(dashboard, /observatoryStates = new Set\(\['pending', 'current', 'completed', 'goal-achieved'\]\)/);
  assert.match(dashboard, /function setObservatoryState\(node, state\)/);
});

test('semantic state maps existing truth without owning workout persistence', () => {
  assert.match(dashboard, /day\.classList\.contains\('done'\)[\s\S]*'completed'/);
  assert.match(dashboard, /day\.classList\.contains\('is-selected'\) \|\| day\.classList\.contains\('today'\)/);
  assert.match(dashboard, /progressState\(card\.querySelector\('\.progress-bar'\)\)/);
  assert.doesNotMatch(dashboard, /localStorage\.setItem|firebase\.database\(\)\.ref/);
});

test('current state is reserved for active context rather than partial progress', () => {
  assert.doesNotMatch(dashboard, /value > 0\) return 'current'/);
  assert.doesNotMatch(dashboard, /weekCount > 0 \? 'current'/);
  assert.match(dashboard, /stat-duration'\), duration > 0 \? 'completed' : 'pending'/);
  assert.match(dashboard, /is-selected'\) \|\| day\.classList\.contains\('today'\)[\s\S]*\? 'current'[\s\S]*day\.classList\.contains\('done'\)[\s\S]*\? 'completed'/);
  assert.match(dashboard, /start, start\.dataset\.planState === 'planned' \? 'current' : 'pending'/);
});

test('pending dims semantic decoration while the start action keeps its light', () => {
  assert.match(observatoryCss, /--obs-pending-decoration:\.5/);
  assert.match(observatoryCss, /--obs-pending-glow:0 0 0 transparent/);
  const genericPending = observatoryCss.match(/#pulse-home \[data-observatory-state="pending"\]\{[^}]*\}/);
  assert.ok(genericPending, 'generic pending semantic token rule must exist');
  assert.doesNotMatch(genericPending[0], /\bopacity:/);
  assert.match(observatoryCss, /week-day.today::after\{opacity:1/);
  assert.doesNotMatch(observatoryCss, /observatory-next-orb:is\(\[data-plan-state="empty"\]/);
});

test('active and achieved states use bounded OLED-friendly glow tokens', () => {
  assert.match(observatoryCss, /--obs-current-glow:0 0 20px/);
  assert.match(observatoryCss, /--obs-completed-glow:0 0 12px/);
  assert.match(observatoryCss, /--obs-achieved-glow:0 0 18px/);
});

test('warm identity lighting is separate from semantic data colours', () => {
  assert.match(observatoryCss, /--obs-current-accent:#ffb3a5/);
  assert.match(observatoryCss, /observatory-header-star\{[^}]*color:#ffe4d6/);
  assert.match(observatoryCss, /observatory-kicker>\.observatory-star-glyph\{[^}]*color:#ffb3a5/);
  assert.doesNotMatch(observatoryCss, /#9be4e9/);
});

test('metrics next action goals and both week geometries consume shared state tokens', () => {
  assert.match(environmentCss, /\.stat-card\{[^}]*background:transparent!important/);
  assert.match(observatoryCss, /observatory-next-orb\{[^}]*box-shadow:/);
  assert.doesNotMatch(observatoryCss, /pulse-goals \.goal-card\[data-observatory-state\]::after/);
  assert.match(environmentCss, /:is\(\.goal-card,\.chart-card\)\{[^}]*border:0!important;[^}]*box-shadow:none!important;background:transparent!important/);
  assert.match(environmentCss, /progress-bar\{[^}]*var\(--obs-data-color,#70aaff\)/);
  assert.match(environmentCss, /progress-marker\{[^}]*background:var\(--obs-data-color,#70aaff\)/);
  assert.doesNotMatch(environmentCss, /progress-bar\{[^}]*var\(--obs-state/);
  assert.doesNotMatch(environmentCss, /progress-marker\{[^}]*var\(--obs-state/);
  assert.match(orbitCss, /week-orbit-layout \.week-day::before\{[\s\S]*var\(--obs-state-border/);
  assert.doesNotMatch(orbitCss, /week-day\.(?:is-selected|done|today|pending)::before/);
});

test('CP10 dashboard loader keeps current presentation CSS cache keys while JS ownership moves', () => {
  assert.match(html, /pulse-environment\/environment\.css\?v=20260922-observatory-red-light-1/);
  assert.match(html, /pulse-observatory\/observatory\.css\?v=20260922-observatory-red-light-1/);
  assert.match(html, /training-week-orbit\.css\?v=20260922-observatory-red-light-1/);
  assert.match(environmentShim, /exercise-dashboard\.js\?v=20260922-observatory-red-light-1/);
  assert.doesNotMatch(environmentShim, /function syncObservatoryStates/);
});
