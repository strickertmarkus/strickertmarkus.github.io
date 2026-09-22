const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const count = (text, pattern) => (text.match(pattern) || []).length;

const html = read('exercise.html');
const dashboard = read('exercise-dashboard.js');
const overviewShim = read('training-overview-mode.js');
const environmentShim = read('pulse-environment/environment.js');
const orbitShim = read('training-week-orbit.js');
const authConfig = read('auth-config.js');
const canvasLayer = read('exercise-pulse-flow-canvas-glow-v131.js');
const reactorLegacyEntry = read('pulse-environment/exercise.html');
const observatoryLegacyEntry = read('pulse-observatory/exercise.html');

function assertContainsAll(text, values, label) {
  values.forEach(value => assert.ok(text.includes(value), `${label} is missing ${value}`));
}

test('production owns exactly one live workout session runtime', () => {
  assert.equal(count(html, /id="session-modal"/g), 1, 'exercise.html must contain one session modal');
  assert.equal(count(html, /var sessionState=null;/g), 1, 'exercise.html must contain one sessionState owner');
  assert.equal(count(html, /function startWorkoutSessionForDate\(iso\)/g), 1, 'exercise.html must contain one canonical start function');

  assert.doesNotMatch(html, /training-design-bar/);
  assert.doesNotMatch(html, /data-training-design=/);
  assert.doesNotMatch(html, /pulse-environment\/training\.js/);
  assert.doesNotMatch(html, /pulse-environment\/training\.css/);
  assert.doesNotMatch(html, /pulse-observatory\/training\.css/);
});

test('Compact and Observatory delegate to the same canonical start function', () => {
  assert.match(
    html,
    /startBtn\.onclick=function\(\)\{startWorkoutSessionForDate\(iso\);\};/,
    'Compact/day-plan start must use startWorkoutSessionForDate'
  );
  assert.match(
    dashboard,
    /if \(hasPlan\) \{ window\.startWorkoutSessionForDate\(selectedDate\); return; \}/,
    'Observatory next-workout start must use the canonical startWorkoutSessionForDate function'
  );
  assert.equal(count(dashboard, /startWorkoutSessionForDate/g), 1, 'dashboard presentation must only delegate to the session entry point');
});

test('CP10 dashboard owner is presentation-only and cannot own live session state', () => {
  assert.doesNotMatch(dashboard, /(?:var|let|const)\s+sessionState\b/);
  assert.doesNotMatch(dashboard, /function startWorkoutSessionForDate\(/);
  assertContainsAll(dashboard, [
    "document.getElementById('training-overview-toggle')",
    "currentMode() === 'compact' ? 'observatory' : 'compact'",
    'setVisibility(mode)',
    'setAssetState(mode)',
    'function syncObservatoryStates()',
    'function renderOrbitProgress()'
  ], 'exercise-dashboard owner');
  assert.doesNotMatch(dashboard, /trainingOverviewSwitch|training-overview-switch-shell/);
});

test('CP10 historical dashboard entry files are non-owning compatibility loaders', () => {
  assert.match(overviewShim, /exercise-dashboard\.js\?v=20260922-observatory-composition-2/);
  assert.match(environmentShim, /exercise-dashboard\.js\?v=20260922-observatory-composition-2/);
  assert.match(orbitShim, /exercise-dashboard\.js\?v=20260922-observatory-composition-2/);
  assert.doesNotMatch(overviewShim, /function currentMode\(|function setModeWithTransition\(/);
  assert.doesNotMatch(environmentShim, /function syncReactor\(|function syncObservatoryStates\(/);
  assert.doesNotMatch(orbitShim, /weekOrbitProgress|function orbitFrame\(/);
  assert.equal(count(dashboard, /window\.__trainingOverviewModeInstalled/g), 2, 'dashboard should guard the overview owner once and set it once');
});

test('approved timer, transition, audio/persistence and typography owners stay in the production load graph', () => {
  assert.ok(html.includes('exercise-timer-focus.js?v='), 'approved cardio compact/focus timer must remain directly loaded');

  assertContainsAll(authConfig, [
    "src:'exercise-session-runtime-core-v21.js'",
    "src:'exercise-between-routing-v7.js'",
    "src:'exercise-between-custom-exercise-v3.js'",
    "src:'exercise-between-sets.js'",
    "src:'exercise-session-ux-v20.js'",
    "src:'exercise-hype-timer-layout-v1.js'",
    "src:'exercise-session-stability-v55.js'",
    "src:'exercise-custom-transition-atomic-v56.js'",
    "src:'exercise-pulse-flow-v58.js'",
    "src:'exercise-pulse-flow-motion-v67.js'",
    "src:'exercise-session-typography.js'"
  ], 'auth-config session manifest');

  assertContainsAll(canvasLayer, [
    'exercise-session-transition-stability-v142.js',
    'exercise-session-persistence-v143.js'
  ], 'nested session stability/persistence loader');
});

test('Checkpoint 9 retires standalone preview runtimes while retaining canonical Observatory presentation assets', () => {
  const retired = [
    'pulse-environment/auth-gate.js',
    'pulse-environment/dashboard.css',
    'pulse-environment/dashboard.js',
    'pulse-environment/exercise-heart-rate-range.js',
    'pulse-environment/exercise-points-8-9.js',
    'pulse-environment/records.js',
    'pulse-environment/recovery.js',
    'pulse-environment/training.css',
    'pulse-environment/training.js',
    'pulse-observatory/training.css'
  ];
  retired.forEach(relative => assert.equal(exists(relative), false, `${relative} must be retired after CP9`));

  assert.equal(exists('pulse-environment/environment.css'), true);
  assert.equal(exists('pulse-observatory/observatory.css'), true);
  assert.equal(exists('exercise-dashboard.js'), true);
  assert.match(html, /pulse-environment\/environment\.css\?v=/);
  assert.match(html, /pulse-observatory\/observatory\.css\?v=/);
});

test('legacy Observatory and Reactor URLs are redirect-only aliases to the canonical training route', () => {
  [reactorLegacyEntry, observatoryLegacyEntry].forEach(source => {
    assert.match(source, /var target = '\.\.\/exercise\.html' \+ window\.location\.search \+ window\.location\.hash/);
    assert.match(source, /window\.location\.replace\(target\)/);
    assert.doesNotMatch(source, /firebase|chart\.js|session-modal|training-design-bar|dashboard\.js|environment\.js/i);
  });
});

test('CP10 JavaScript owners and compatibility entries parse cleanly', () => {
  new vm.Script(dashboard, { filename: 'exercise-dashboard.js' });
  new vm.Script(overviewShim, { filename: 'training-overview-mode.js' });
  new vm.Script(environmentShim, { filename: 'pulse-environment/environment.js' });
  new vm.Script(orbitShim, { filename: 'training-week-orbit.js' });
  new vm.Script(authConfig, { filename: 'auth-config.js' });
  new vm.Script(canvasLayer, { filename: 'exercise-pulse-flow-canvas-glow-v131.js' });

  const inlineScripts = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi))
    .map(match => match[1])
    .filter(source => source.trim());
  assert.ok(inlineScripts.length > 0, 'exercise.html should contain its canonical inline runtime');
  inlineScripts.forEach((source, index) => new vm.Script(source, { filename: `exercise-inline-${index + 1}.js` }));
});
