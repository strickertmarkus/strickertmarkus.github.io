const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const budget = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(budget, name), 'utf8');

const shopping = read('shopping.html');
const minimal = read('shopping-minimal.html');
const shell = read('shopping-shell-v1.css');
const core = read('shopping-core-v1.js');
const authGate = read('auth-gate.js');

test('canonical Shopping uses the Home-native dashboard shell', () => {
  assert.match(shopping, /data-shopping-layout="dashboard"/);
  assert.match(shopping, /shopping-shell-v1\.css\?v=20260916-shopping-shell-v1/);
  assert.match(shopping, /shopping-core-v1\.js\?v=20260916-shopping-shell-v1/);
  assert.match(shopping, /class="shopping-dashboard"/);
  assert.match(shopping, /class="shopping-panel shopping-list-panel"/);
  assert.match(shopping, /class="shopping-panel shopping-recipes-panel"/);
  assert.match(shopping, /id="shopping-current-list"/);
  assert.match(shopping, /id="shopping-summary"/);
  assert.doesNotMatch(shopping, /function renderItems\s*\(/);
});

test('minimal concept is a temporary route using the same canonical runtime', () => {
  assert.match(minimal, /shopping\.html\?layout=minimal/);
  assert.match(shopping, /href="shopping-minimal\.html"/);
  assert.match(shopping, /nav-minimal-preview/);
  assert.match(shopping, /nav-dashboard-return/);
  assert.match(shell, /html\[data-shopping-layout="minimal"\] \.shopping-dashboard\{display:block\}/);
  assert.match(shell, /html\[data-shopping-layout="minimal"\] \.shopping-context-card\{display:none\}/);
});

test('Shopping presentation follows Home palette and responsive layout', () => {
  assert.match(shell, /--bg:#0F1219/);
  assert.match(shell, /--home-orange:#FDBA74/);
  assert.match(shell, /--radius:14px/);
  assert.match(shell, /grid-template-columns:minmax\(0,1\.7fr\) minmax\(290px,\.83fr\)/);
  assert.match(shell, /@media\(max-width:900px\)/);
  assert.match(shell, /@media\(max-width:680px\)/);
  assert.match(shell, /@media\(max-width:430px\)/);
});

test('mobile Safari editable inputs keep a 16px floor', () => {
  assert.match(shell, /@supports \(-webkit-touch-callout:none\)/);
  assert.match(shell, /#recipes-list input\[type="text"\],#recipes-list input\[type="url"\]/);
  assert.match(shell, /font-size:16px!important/);
});

test('core owns shell/list/template controls while V7 and V4 remain feature owners', () => {
  assert.match(core, /window\.saveState\s*=/);
  assert.match(core, /window\.renderListsMenu\s*=/);
  assert.match(core, /window\.renderTemplatesMenu\s*=/);
  assert.match(core, /window\.__shoppingShellV1UpdateSummary\s*=/);
  assert.doesNotMatch(core, /function renderItems\s*\(/);
  assert.match(authGate, /shopping-list-stability-v8\.js/);
  assert.match(authGate, /shopping-list-engine-v7\.js/);
  assert.match(authGate, /shopping-toolbar-v9\.js/);
  assert.match(authGate, /shopping-recipes-v4\.js/);
});
