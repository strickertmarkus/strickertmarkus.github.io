const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const motion = read('exercise-motion-v1.js');
const shell = read('training-zen-nav.js');

test('one shared hamburger is mounted into the persistent wellness header', () => {
  assert.match(motion, /function ensureSharedNavMenu\(\)/);
  assert.match(motion, /getElementById\('pulse-header'\)/);
  assert.match(motion, /getElementById\('nav-menu'\)/);
  assert.match(motion, /wrapper\.dataset\.sharedTrainingNav = 'true'/);
  assert.match(motion, /header\.appendChild\(wrapper\)/);
  assert.match(motion, /id=\\?"training-nav-toggle/);
  assert.match(motion, /id=\\?"nav-menu/);
  assert.doesNotMatch(shell, /createElement\('header'\)/);
});

test('shared menu is accessible and closes by outside click Escape or navigation', () => {
  assert.match(motion, /aria-controls=\\?"nav-menu/);
  assert.match(motion, /aria-expanded=\\?"false/);
  assert.match(motion, /window\.toggleNavMenu = function \(force\)/);
  assert.match(motion, /menu\.setAttribute\('aria-hidden', String\(!open\)\)/);
  assert.match(motion, /button\.setAttribute\('aria-expanded', String\(open\)\)/);
  assert.match(motion, /if \(!wrapper\.contains\(event\.target\) && menu\.classList\.contains\('show'\)\)/);
  assert.match(motion, /event\.key !== 'Escape'/);
  assert.match(motion, /data-training-nav-link/);
});

test('menu keeps the canonical training route and does not resurrect retired previews', () => {
  assert.match(motion, /navLink\('exercise\.html' \+ profile,'◆','Träning'\)/);
  assert.match(motion, /navLink\('home\.html'/);
  assert.match(motion, /navLink\('calendar\.html'/);
  assert.match(motion, /navLink\('shopping\.html'/);
  assert.doesNotMatch(motion, /pulse-observatory\/exercise\.html|pulse-environment\/exercise\.html|Pulse Reactor|Pulse Observatory/);
});

test('same hamburger has Training Stretch and Meditation presentation states', () => {
  assert.match(motion, /html\[data-wellness-mode=\\?"zen\\?"\] body\[data-kind=\\?"stretch\\?"\] \.shared-training-nav/);
  assert.match(motion, /html\[data-wellness-mode=\\?"zen\\?"\] body\[data-kind=\\?"meditation\\?"\] \.shared-training-nav/);
  assert.match(motion, /--nav-accent:#d4eea7/);
  assert.match(motion, /--nav-accent:#2b6452/);
  assert.match(shell, /document\.documentElement\.dataset\.wellnessMode=nextMode/);
  assert.match(shell, /document\.body\.dataset\.kind=kind/);
});

test('shared navigation owner parses cleanly', () => {
  new vm.Script(motion, {filename:'exercise-motion-v1.js'});
});
