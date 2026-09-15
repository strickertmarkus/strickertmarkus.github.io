const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('exercise.html');
const css = read('pulse-observatory/observatory.css');
const environment = read('pulse-environment/environment.js');
const motion = read('exercise-pulse-flow-motion-v67.js');
const ecgGlow = read('exercise-pulse-flow-ecg-glow-v104.js');
const canvas130 = read('exercise-pulse-flow-canvas-glow-v130.js');
const canvas131 = read('exercise-pulse-flow-canvas-glow-v131.js');
const authConfig = read('auth-config.js');
const authGate = read('auth-gate.js');
const starPath = 'M12 1.8C13.3 7.15 16.85 10.7 22.2 12C16.85 13.3 13.3 16.85 12 22.2C10.7 16.85 7.15 13.3 1.8 12C7.15 10.7 10.7 7.15 12 1.8Z';

test('one native Observatory star geometry owns kicker, sticky header identity and next cue', () => {
  assert.equal((html.match(new RegExp(starPath, 'g')) || []).length, 3);
  assert.match(html, /observatory-only observatory-brand-lockup[^>]*>PULSE[\s\S]*observatory-header-star/);
  assert.match(html, /observatory-kicker[^>]*><svg class="observatory-star-glyph"/);
  assert.match(html, /observatory-next-cue/);
  assert.doesNotMatch(html, /observatory-kicker"><span aria-hidden="true">✧/);
});

test('header star uses heartbeat cadence and existing Observatory scheduler', () => {
  assert.match(css, /animation:observatoryHeartbeat 2\.05s linear infinite/);
  assert.match(css, /@keyframes observatoryHeartbeat\{0%,18%,100%/);
  assert.match(css, /3%\{transform:translateY\(-\.2px\) scale\(1\.16\)/);
  assert.match(css, /9%\{transform:translateY\(-\.1px\) scale\(1\.085\)/);
  assert.match(css, /50%\{transform:translateY\(\.2px\) scale\(\.998\) rotate\(-\.2deg\)/);
  assert.match(css, /observatory-header-star \.observatory-star-glyph path\{stroke-width:1\.7\}/);
  assert.match(css, /animation-play-state:var\(--observatory-identity-motion,paused\)/);
  assert.match(css, /prefers-reduced-motion:reduce[\s\S]*observatory-header-star \.observatory-star-glyph\{animation:none!important/);
  assert.match(environment, /const motionState = paused \? 'paused' : 'running'/);
  assert.match(environment, /document\.documentElement\.style\.setProperty\('--observatory-identity-motion', motionState\)/);
  assert.match(environment, /document\.hidden \|\| !onScreen \|\| session\.classList\.contains\('show'\)/);
});

test('retired header ECG has no remaining runtime or glow owner', () => {
  [motion, ecgGlow, canvas130, canvas131].forEach(source => assert.doesNotMatch(source, /pf-header-ecg/));
  assert.doesNotMatch(motion, /syncHeader/);
  assert.match(motion, /document\.querySelectorAll\('\.pf-ecg-v80'\)/);
});

test('Next Workout remains one real weekly-plan action with explicit cue and empty state', () => {
  const nextBlock = html.slice(html.indexOf('<div class="observatory-next">'), html.indexOf('<section class="observatory-metrics"'));
  assert.match(nextBlock, /class="observatory-next-label"><span>NÄSTA PASS<\/span><\/span>/);
  assert.doesNotMatch(nextBlock.split('<button')[0], /observatory-arrow/);
  assert.equal((html.match(/id="reactor-start"/g) || []).length, 1);
  assert.match(environment, /window\.getPlannedSessions\(\)/);
  assert.match(environment, /hasPlan \? \(plan\.type \|\| 'Planerat pass'\) : 'Planera ditt pass'/);
  assert.match(environment, /setText\('reactor-action', hasPlan \? 'Starta pass' : 'Bygg pass'\)/);
  assert.match(environment, /start\.dataset\.planState = hasPlan \? 'planned' : 'empty'/);
  assert.match(environment, /if \(hasPlan\) window\.startWorkoutSessionForDate\(selectedDate\);/);
});

test('CP5 cache keys force Safari to receive the retired-header ownership change', () => {
  assert.match(html, /auth-config\.js\?v=20260915-cp5-identity/);
  assert.match(html, /auth-gate\.js\?v=20260915-cp5-identity/);
  assert.match(html, /pulse-observatory\/observatory\.css\?v=20260915-main-cp5-heartbeat-polish-1/);
  assert.match(html, /pulse-environment\/environment\.js\?v=20260915-main-cp5-identity-1/);
  assert.match(authConfig, /exerciseFastVersion = '20260915-cp5-identity'/);
  assert.match(authGate, /exerciseAssetsVersion = '20260915-cp5-identity'/);
});
