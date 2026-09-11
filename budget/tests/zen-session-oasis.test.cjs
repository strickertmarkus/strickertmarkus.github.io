const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'zen.html'),'utf8');
const css=fs.readFileSync(path.join(root,'zen-session-oasis-v54.css'),'utf8');
const js=fs.readFileSync(path.join(root,'zen-session-oasis-v54.js'),'utf8');

function hasAll(source,parts){for(const part of parts)assert.ok(source.includes(part),`missing: ${part}`);}

test('session oasis assets are loaded after the core Zen session code',()=>{
  const core=html.indexOf('zen.js?v=');
  const controller=html.indexOf('zen-session-oasis-v54.js?v=');
  const style=html.indexOf('zen-session-oasis-v54.css?v=');
  assert.ok(core>=0&&controller>core);
  assert.ok(style>=0);
});

test('meditation runner has the complete oasis presentation system',()=>{
  hasAll(css,[
    'view-transition-name:meditation-orb',
    '.breathing-field',
    '.breath-halo',
    ".session-clock::before{\n  content:'≈'",
    '.session-center::before',
    ".session-cue::before{\n  content:'4 sek in · 6 sek ut'",
    '.next-step .text-button',
    '.free-breathing .breath-halo',
    '.oasis-exhale .session-view::after',
    '.session-progress>span::after',
    '.pause-button',
    'left:-17px',
    '@media(prefers-reduced-motion:reduce)'
  ]);
});

test('session controller reacts to core phase state without duplicating timer logic',()=>{
  hasAll(js,[
    "phase==='Egen andning'",
    "phase==='Andas in'||phase==='Andas ut'",
    "phase==='Andas ut'",
    "body.classList.add('oasis-exhale')",
    'document.startViewTransition',
    "wrapSessionEntry(startButton",
    "wrapSessionEntry(resumeButton",
    "attributeFilter:['class','data-kind']"
  ]);
  assert.equal(js.includes('setInterval('),false,'presentation controller must not create a second session timer');
});

test('oasis styling is scoped to meditation session and preserves stretch runner',()=>{
  assert.ok(css.includes('body.in-session[data-kind=meditation]'));
  assert.equal(css.includes('body.in-session[data-kind=stretch]'),false);
});

test('ring scaling avoids unsupported CSS multiplication and stays Safari-safe',()=>{
  assert.equal(css.includes('var(--breath-scale) *'),false,'do not multiply CSS custom properties inside calc()');
  assert.ok(css.includes('transform:scale(calc(var(--breath-scale) + .045))'));
  assert.ok(css.includes('transform:scale(calc(var(--breath-scale) - .035))'));
});

test('CSS structure is balanced',()=>{
  const stripped=css.replace(/\/\*[\s\S]*?\*\//g,'');
  let depth=0;
  for(const char of stripped){if(char==='{')depth++;if(char==='}')depth--;assert.ok(depth>=0,'unexpected closing brace');}
  assert.equal(depth,0,'unbalanced CSS braces');
});
