const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const count = (text, pattern) => (text.match(pattern) || []).length;

const html = read('exercise.html');
const overview = read('training-overview-mode.js');
const environment = read('pulse-environment/environment.js');
const authConfig = read('auth-config.js');
const canvasLayer = read('exercise-pulse-flow-canvas-glow-v131.js');
const previewTraining = read('pulse-environment/training.js');

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
    environment,
    /if \(hasPlan\) \{ window\.startWorkoutSessionForDate\(selectedDate\); return; \}/,
    'Observatory next-workout start must use the canonical startWorkoutSessionForDate function'
  );
  assert.equal(count(environment, /startWorkoutSessionForDate/g), 1, 'overview adapter must not introduce another session entry implementation');
});

test('overview-mode controller is presentation-only and cannot own live session state', () => {
  assert.doesNotMatch(overview, /sessionState/);
  assert.doesNotMatch(overview, /startWorkoutSessionForDate/);
  assert.doesNotMatch(overview, /session-modal/);
  assertContainsAll(overview, [
    "document.getElementById('training-overview-toggle')",
    "currentMode() === 'compact' ? 'observatory' : 'compact'",
    'setVisibility(mode)',
    'setAssetState(mode)'
  ], 'overview controller');
  assert.doesNotMatch(overview, /trainingOverviewSwitch|training-overview-switch-shell/);
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

test('preview training adapter remains explicitly preview-only', () => {
  assert.match(previewTraining, /Shared preview presentation only/);
  assert.match(previewTraining, /training-design-bar/);
  assert.match(previewTraining, /data-training-design/);
  assert.doesNotMatch(html, /training-design-bar|data-training-design=/);
});

test('checkpoint-3 JavaScript sources parse cleanly', () => {
  new vm.Script(overview, { filename: 'training-overview-mode.js' });
  new vm.Script(environment, { filename: 'pulse-environment/environment.js' });
  new vm.Script(authConfig, { filename: 'auth-config.js' });
  new vm.Script(canvasLayer, { filename: 'exercise-pulse-flow-canvas-glow-v131.js' });

  const inlineScripts = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi))
    .map(match => match[1])
    .filter(source => source.trim());
  assert.ok(inlineScripts.length > 0, 'exercise.html should contain its canonical inline runtime');
  inlineScripts.forEach((source, index) => new vm.Script(source, { filename: `exercise-inline-${index + 1}.js` }));
});
