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

test('cyan current state is reserved for active context rather than partial progress', () => {
  assert.doesNotMatch(environment, /value > 0\) return 'current'/);
  assert.doesNotMatch(environment, /weekCount > 0 \? 'current'/);
  assert.match(environment, /stat-duration'\), duration > 0 \? 'completed' : 'pending'/);
  assert.match(environment, /is-selected'\) \|\| day\.classList\.contains\('today'\)[\s\S]*\? 'current'[\s\S]*day\.classList\.contains\('done'\)[\s\S]*\? 'completed'/);
  assert.match(environment, /start, start\.dataset\.planState === 'planned' \? 'current' : 'pending'/);
});

test('pending dims decoration rather than readable text', () => {
  assert.match(observatoryCss, /--obs-pending-decoration:\.5/);
  assert.match(observatoryCss, /--obs-pending-glow:0 0 0 transparent/);
  assert.doesNotMatch(observatoryCss, /\[data-observatory-state="pending"\][^{]*\{[^}]*\bopacity:/);
  assert.match(observatoryCss, /week-day::after\{[^}]*opacity:var\(--obs-state-decoration/);
});

test('active and achieved states use bounded OLED-friendly glow tokens', () => {
  assert.match(observatoryCss, /--obs-current-glow:0 0 12px/);
  assert.match(observatoryCss, /--obs-completed-glow:0 0 14px/);
  assert.match(observatoryCss, /--obs-achieved-glow:0 0 18px/);
});

test('metrics next action goals and both week geometries consume shared state tokens', () => {
  assert.match(observatoryCss, /observatory-metrics \.stat-card\[data-observatory-state\]::after/);
  assert.match(observatoryCss, /observatory-start\[data-observatory-state\] \.observatory-next-cue/);
  assert.match(observatoryCss, /pulse-goals \.goal-card\[data-observatory-state\]::after/);
  assert.match(environmentCss, /progress-bar\{[^}]*var\(--obs-state-glow/);
  assert.match(environmentCss, /progress-marker\{[^}]*var\(--obs-state-accent/);
  assert.match(orbitCss, /week-orbit-layout \.week-day::before\{[\s\S]*var\(--obs-state-border/);
  assert.doesNotMatch(orbitCss, /week-day\.(?:is-selected|done|today|pending)::before/);
});

test('production cache-busts every modified CP7 presentation owner', () => {
  assert.match(html, /pulse-environment\/environment\.css\?v=20260915-main-cp7-state-1/);
  assert.match(html, /pulse-observatory\/observatory\.css\?v=20260915-main-cp7-state-1/);
  assert.match(html, /training-week-orbit\.css\?v=20260915-main-cp7-state-1/);
  assert.match(html, /pulse-environment\/environment\.js\?v=20260915-main-cp7-state-2/);
});
