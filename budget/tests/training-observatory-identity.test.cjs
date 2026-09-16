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

test('one native Observatory star geometry owns kicker, sticky header identity, next cue and weekly orbit centre', () => {
  assert.equal((html.match(new RegExp(starPath, 'g')) || []).length, 4);
  assert.match(html, /week-orbit-center-symbol/);
  assert.match(html, /observatory-only observatory-brand-lockup[^>]*>PULSE[\s\S]*observatory-header-star/);
  assert.match(html, /observatory-kicker[^>]*><svg class="observatory-star-glyph"/);
  assert.match(html, /observatory-next-orb/);
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
  assert.match(dashboard, /motionState = paused \? 'paused' : 'running'/);
  assert.match(dashboard, /document\.documentElement\.style\.setProperty\('--observatory-identity-motion', motionState\)/);
  assert.match(dashboard, /document\.hidden \|\| !onScreen \|\| session\.classList\.contains\('show'\)/);
});

test('retired header ECG has no remaining runtime or glow owner', () => {
  [motion, ecgGlow, canvas130, canvas131].forEach(source => assert.doesNotMatch(source, /pf-header-ecg/));
  assert.doesNotMatch(motion, /syncHeader/);
  assert.match(motion, /document\.querySelectorAll\('\.pf-ecg-v80'\)/);
});

test('Next Workout has separate build and start actions with a true latent empty state', () => {
  const nextBlock = html.slice(html.indexOf('<div class="observatory-next">'), html.indexOf('<section class="observatory-metrics"'));
  assert.match(nextBlock, /class="observatory-next-label"><span>NÄSTA PASS<\/span><\/span>/);
  assert.equal((html.match(/id="reactor-start"/g) || []).length, 1);
  assert.equal((html.match(/id="reactor-build"/g) || []).length, 1);
  assert.match(nextBlock, /observatory-next-orb-label">STARTA NÄSTA PASS/);
  assert.match(nextBlock, /id="reactor-start-notice"[^>]*>Bygg ett pass först\./);
  assert.doesNotMatch(nextBlock, /id="reactor-configure"/);
  assert.match(dashboard, /window\.getPlannedSessions\(\)/);
  assert.match(dashboard, /setText\('reactor-action', 'Bygg pass'\)/);
  assert.match(dashboard, /start\.dataset\.planState = hasPlan \? 'planned' : 'empty'/);
  assert.match(dashboard, /orbMeta\.hidden = !hasPlan/);
  assert.match(dashboard, /setText\('reactor-orb-meta', hasPlan \? summary : ''\)/);
  assert.doesNotMatch(dashboard, /setText\('reactor-orb-meta', hasPlan \? summary : 'Inget planerat'\)/);
  assert.match(dashboard, /if \(hasPlan\) \{ window\.startWorkoutSessionForDate\(selectedDate\); return; \}/);
  assert.match(dashboard, /showMissingPlanNotice\(\)/);
  assert.match(dashboard, /buildButton\.addEventListener\('click', openSelectedBuilder\)/);
  assert.doesNotMatch(dashboard, /else openSelectedBuilder\(\)/);
  assert.match(css, /observatory-next-actions\{[^}]*grid-template-columns:minmax\(0,1fr\) 108px;[^}]*gap:14px/);
  assert.match(css, /observatory-next-actions::before\{[^}]*inset:-28px -22px[^}]*rgba\(10,8,14,\.88\)/);
  assert.match(css, /observatory-next-orb\{[^}]*width:108px;height:108px[^}]*opacity:\.82/);
  assert.match(css, /observatory-next-orb-meta\[hidden\]\{display:none!important\}/);
  assert.match(css, /observatory-next-orb:is\(\[data-plan-state="empty"\],\[data-observatory-state="pending"\]\)\{[^}]*opacity:\.56/);
  assert.match(css, /observatory-next-orb:is\(\[data-plan-state="empty"\],\[data-observatory-state="pending"\]\) \.observatory-next-orb-meta\{display:none!important\}/);
  assert.match(css, /observatory-next-orb:is\(\[data-plan-state="planned"\],\[data-observatory-state="current"\]\)\{[^}]*opacity:1[^}]*animation:observatoryReadyPulse 3\.8s ease-in-out infinite/);
  assert.match(css, /observatory-build\{[^}]*width:min\(205px,100%\)/);
  assert.match(css, /observatory-next-actions:has\(\.observatory-next-orb:is\(\[data-plan-state="planned"\],\[data-observatory-state="current"\]\)\) \.observatory-build\{[^}]*opacity:\.62/);
  assert.match(css, /observatory-start-notice\{[^}]*position:absolute/);
});

test('boot keeps the current shared wellness ownership fresh and CP10 routes dashboard JS to one owner', () => {
  assert.match(html, /auth-config\.js\?v=20260916-wellness-shell-3/);
  assert.match(html, /auth-gate\.js\?v=20260916-wellness-shell-3/);
  assert.match(html, /pulse-observatory\/observatory\.css\?v=20260916-main-next-pass-orb-2/);
  assert.match(environmentShim, /exercise-dashboard\.js\?v=20260916-main-cp10-dashboard-1/);
  assert.match(authConfig, /exerciseFastVersion = '20260916-wellness-shell-3'/);
  assert.match(authGate, /exerciseAssetsVersion = '20260916-wellness-shell-3'/);
});
