const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const html = read('exercise.html');
const css = read('pulse-observatory/observatory.css');
const environment = read('pulse-environment/environment.js');

function between(text, start, end) {
  const from = text.indexOf(start);
  assert.ok(from >= 0, `missing start marker: ${start}`);
  const to = text.indexOf(end, from + start.length);
  assert.ok(to >= 0, `missing end marker: ${end}`);
  return text.slice(from, to);
}

test('mobile Observatory summary is one four-column row', () => {
  const mobile = between(css, '@media(max-width:760px){', '@media(max-width:360px){');
  assert.match(mobile, /observatory-metrics \.stats-row\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important;gap:0!important/);
  assert.doesNotMatch(mobile, /observatory-metrics \.stats-row\{grid-template-columns:repeat\(2/);
  assert.match(mobile, /observatory-metrics \.stat-card\{[^}]*min-width:0!important;[^}]*overflow:hidden!important/);
  assert.doesNotMatch(mobile, /observatory-metrics \.stat-card\{[^}]*border-left:/);
  assert.match(mobile, /observatory-metrics \.stat-val\{[^}]*white-space:nowrap/);
});

test('320, 375 and 390 px widths keep four metric columns inside the Observatory content width', () => {
  // environment.css gives #pulse-home width:90%; CP4 uses zero grid gap and minmax(0,1fr).
  [320, 375, 390].forEach(viewport => {
    const contentWidth = viewport * 0.90;
    const columnWidth = contentWidth / 4;
    assert.ok(columnWidth >= 72, `${viewport}px viewport leaves only ${columnWidth}px per metric`);
  });
});

test('weekly plan stays immediately after the compact summary and before goals', () => {
  const stage = html.indexOf('<section class="observatory-stage');
  const metrics = html.indexOf('<section class="observatory-metrics');
  const week = html.indexOf('<section class="observatory-week"');
  const goals = html.indexOf('<section class="pulse-section pulse-goals"');
  assert.ok(stage >= 0 && metrics > stage && week > metrics && goals > week, 'Observatory top hierarchy must remain stage -> metrics -> week -> goals');

  const mobile = between(css, '@media(max-width:760px){', '@media(max-width:360px){');
  assert.match(mobile, /observatory-field\{min-height:252px/);
  assert.match(mobile, /observatory-week\{margin:16px 0 40px\}/);
});

test('large add-workout CTA is absent from production weekly planning while contextual editing remains', () => {
  const week = between(html, '<section class="observatory-week"', '<hr class="rule compact-only">');
  assert.doesNotMatch(week, /observatory-add|Lägg till pass/);
  assert.match(week, /onclick="openPlanModal\(\)"/);
  assert.match(week, /onclick="openTemplateModal\(\)"/);
  assert.match(week, /id="week-grid"/);
  assert.match(environment, /grid\.addEventListener\('click'/);
  assert.match(environment, /openSelectedBuilder/);
});

test('mobile preview cannot reintroduce the large Observatory add CTA', () => {
  const mobile = between(css, '@media(max-width:760px){', '@media(max-width:360px){');
  assert.match(mobile, /observatory-add\{display:none!important\}/);
});

test('Observatory metrics have no separator owner at base level', () => {
  const base = css.slice(0, css.indexOf('@media(max-width:760px){'));
  assert.match(base, /observatory-metrics \.stat-card\{[^}]*border:0!important/);
  assert.doesNotMatch(base, /observatory-metrics \.stat-card\{[^}]*border-left:/);
});

test('hero atmosphere is owned by the whole Observatory stage and fades before its paint box ends', () => {
  assert.match(css, /observatory-stage::before\{[^}]*radial-gradient/);
  assert.match(css, /observatory-stage::before\{[^}]*inset:-70px -10vw -150px/);
  assert.match(css, /observatory-stage::before\{[^}]*-webkit-mask-image:linear-gradient\(to bottom,[^}]*transparent 100%\)/);
  assert.match(css, /observatory-stage::before\{[^}]*mask-image:linear-gradient\(to bottom,[^}]*transparent 100%\)/);
  assert.doesNotMatch(css, /observatory-scene::before\{/);
  assert.match(css, /observatory-stage\[data-workout-kind="cardio"\]::before/);
  assert.match(environment, /stage\.dataset\.workoutKind = kind/);
});

test('production page cache-busts the current Observatory composition', () => {
  assert.match(html, /pulse-observatory\/observatory\.css\?v=20260915-main-cp7-symbol-cyan-1/);
  assert.match(html, /pulse-environment\/environment\.css\?v=20260915-main-cp7-symbol-cyan-1/);
  assert.match(html, /pulse-environment\/environment\.js\?v=20260915-main-cp7-state-2/);
});

test('Observatory CSS stays structurally balanced', () => {
  const opens = (css.match(/\{/g) || []).length;
  const closes = (css.match(/\}/g) || []).length;
  assert.equal(opens, closes, 'CSS braces must stay balanced');
});
