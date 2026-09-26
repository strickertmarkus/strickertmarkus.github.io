const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('exercise.html');
const css = read('pulse-observatory/observatory.css');
const dashboard = read('exercise-dashboard.js');
const environmentShim = read('pulse-environment/environment.js');
const motion = read('exercise-pulse-flow-motion-v67.js');
const ecgGlow = read('exercise-pulse-flow-ecg-glow-v104.js');
const canvas130 = read('exercise-pulse-flow-canvas-glow-v130.js');
const canvas131 = read('exercise-pulse-flow-canvas-glow-v131.js');
const authConfig = read('auth-config.js');
const authGate = read('auth-gate.js');
const starPath = 'M12 1.8C13.3 7.15 16.85 10.7 22.2 12C16.85 13.3 13.3 16.85 12 22.2C10.7 16.85 7.15 13.3 1.8 12C7.15 10.7 10.7 7.15 12 1.8Z';

test('one native Observatory star geometry owns kicker, sticky header identity, and weekly orbit centre', () => {
  assert.equal((html.match(new RegExp(starPath, 'g')) || []).length, 3);
  assert.match(html, /week-orbit-center-symbol/);
  assert.match(html, /observatory-only observatory-brand-lockup[^>]*>PULSE[\s\S]*observatory-header-star/);
  assert.match(html, /observatory-kicker[^>]*><svg class="observatory-star-glyph"/);
  assert.match(html, /observatory-next-orb/);
  assert.doesNotMatch(html, /observatory-kicker"><span aria-hidden="true">✧/);
});

test('identity is quiet and ambient motion uses one shared visibility scheduler', () => {
  assert.doesNotMatch(css, /observatoryHeartbeat|observatoryTwinkle|observatoryAtmosphere/);
  assert.match(css, /observatoryHorizonSweep 32s/);
  assert.match(css, /observatoryReadyPulse 6\.2s/);
  assert.match(css, /animation-play-state:var\(--pulse-scene-motion,running\)/);
  assert.match(dashboard, /sceneRoot\.style\.setProperty\('--pulse-scene-motion', motionState\)/);
  assert.match(dashboard, /document\.hidden \|\| !onScreen \|\| session\.classList\.contains\('show'\)/);
});

test('retired header ECG has no remaining runtime or glow owner', () => {
  [motion, ecgGlow, canvas130, canvas131].forEach(source => assert.doesNotMatch(source, /pf-header-ecg/));
  assert.doesNotMatch(motion, /syncHeader/);
  assert.match(motion, /document\.querySelectorAll\('\.pf-ecg-v80'\)/);
});

test('hero has one Zen-sized start action and keeps building in the template section', () => {
  const hero = html.slice(html.indexOf('<section class="observatory-stage'), html.indexOf('<section class="observatory-templates'));
  assert.equal((hero.match(/id="reactor-start"/g) || []).length, 1);
  assert.doesNotMatch(html, /id="reactor-build"|id="reactor-action"/);
  assert.match(hero, /<h2>Träning<\/h2>/);
  assert.match(hero, /id="reactor-title"/);
  assert.match(hero, /aria-describedby="reactor-summary"/);
  assert.match(dashboard, /window\.getPlannedSessions\(\)/);
  assert.match(dashboard, /start\.dataset\.planState = hasPlan \? 'planned' : 'empty'/);
  assert.match(dashboard, /if \(hasPlan\) \{ window\.startWorkoutSessionForDate\(selectedDate\); return; \}/);
  assert.match(dashboard, /choices\.focus\(\{preventScroll:true\}\)/);
  assert.doesNotMatch(dashboard, /reactor-build|reactor-action/);
  assert.match(css, /observatory-next-orb\{[^}]*width:168px;height:168px/);
  assert.match(css, /observatory-next-orb::after\{[^}]*border-radius:50%/);
  assert.match(css, /observatory-heading h2\{[^}]*Cormorant Garamond/);
});

test('boot keeps the current shared wellness ownership fresh and CP10 routes dashboard JS to one owner', () => {
  assert.match(html, /auth-config\.js\?v=20260926-energy-session-8/);
  assert.match(html, /auth-gate\.js\?v=20260926-energy-session-7/);
  assert.match(html, /pulse-observatory\/observatory\.css\?v=20260922-observatory-composition-2/);
  assert.match(environmentShim, /exercise-dashboard\.js\?v=20260922-observatory-composition-2/);
  assert.match(authConfig, /exerciseFastVersion = '20260926-pulse-energy-session-6'/);
  assert.match(authGate, /exerciseAssetsVersion = '20260926-pulse-energy-session-6'/);
});
