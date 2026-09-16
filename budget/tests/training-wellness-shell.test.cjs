const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const shell=read('training-zen-nav.js');
const shellCss=read('training-zen-nav.css');
const overview=read('training-overview-mode.js');
const overviewCss=read('training-overview-mode.css');
const exercise=read('exercise.html');
const zen=read('zen.html');
const store=read('zen-store.js');
const firebase=read('firebase-sync.js');

test('CP8 uses one canonical in-page wellness shell without iframe or duplicate full documents',()=>{
  assert.match(shell,/canonical=\/\\\/exercise\\\.html\$\//);
  assert.match(shell,/fetch\('zen\.html'/);
  assert.match(shell,/extractZenSurface\(doc\)/);
  assert.match(shell,/\['\.landscape','#zen-main'\]/);
  assert.doesNotMatch(shell,/iframe|srcdoc/);
  assert.doesNotMatch(shell,/querySelector\('\.zen-header'\).*importNode/s);
});

test('Zen heavy assets are lazy loaded once and remain domain scoped',()=>{
  assert.match(shell,/zenLoadPromise/);
  assert.match(shell,/file==='zen\.js'\|\|\/\^zen-\.\*\\\.js\$/);
  assert.match(shell,/\^zen\.\*\\\.css\$/);
  assert.doesNotMatch(shell,/firebase-app-compat|auth-config\.js|auth-gate\.js/);
  assert.match(store,/firebase\.database\(\)\.ref\('zen_v1\//);
  assert.doesNotMatch(store,/weekPlans|plannedSessions|exerciseSessions/);
});

test('Training stays mounted while Zen is toggled and the shared header has one Zen settings control',()=>{
  assert.match(shell,/trainingMain\.hidden=zen/);
  assert.match(shell,/zenHost\.hidden=!zen/);
  assert.match(shell,/wellness-zen-tools/);
  assert.match(shell,/id="settings-open"/);
  assert.doesNotMatch(shell,/id="profile-name"/);
  assert.match(shellCss,/wellness-zen-brand\[hidden\]/);
  assert.equal((shell.match(/createElement\('header'\)/g)||[]).length,0);
});

test('live sessions cannot be silently destroyed by a wellness switch',()=>{
  assert.match(shell,/session-modal/);
  assert.match(shell,/classList\.contains\('show'\)/);
  assert.match(shell,/classList\.contains\('in-session'\)/);
  assert.match(shell,/Avsluta det pågående träningspasset/);
  assert.match(shell,/Avsluta eller lämna Zen-passet/);
});

test('wellness switching has view transition, CSS fallback and reduced-motion path',()=>{
  assert.match(shell,/document\.startViewTransition/);
  assert.match(shell,/wellness-shell-switching/);
  assert.match(shell,/prefers-reduced-motion: reduce/);
  assert.match(shellCss,/wellnessSurfaceIn/);
  assert.match(shellCss,/::view-transition-old\(wellness-surface\)/);
  assert.match(shellCss,/@media\(prefers-reduced-motion:reduce\)/);
});

test('wellness morph stays short and avoids expensive full-surface blur',()=>{
  assert.match(shellCss,/wellnessSurfaceIn \.22s/);
  assert.match(shellCss,/wellnessSurfaceOld \.18s/);
  assert.match(shellCss,/wellnessSurfaceNew \.24s/);
  const morphCss=shellCss.slice(shellCss.indexOf('.wellness-surface-enter'),shellCss.indexOf('@media(max-width:760px)'));
  assert.doesNotMatch(morphCss,/filter:blur/);
  assert.match(shell,/\},260\);\}\);/);
});

test('Zen network assets warm without starting the Zen runtime',()=>{
  assert.equal((shell.match(/fetch\('zen\.html'/g)||[]).length,1,'Zen document should have one fetch owner');
  assert.match(shell,/function getZenDocument\(\)/);
  assert.match(shell,/function preloadZenAssets\(doc\)/);
  assert.match(shell,/link\.rel='preload';link\.as='style'/);
  assert.match(shell,/link\.rel='preload';link\.as='script'/);
  assert.match(shell,/requestIdleCallback/);
  assert.match(shell,/pointerenter/);
  assert.match(shell,/touchstart/);
  const preload=shell.slice(shell.indexOf('function preloadZenAssets'),shell.indexOf('function loadStyles'));
  assert.doesNotMatch(preload,/createElement\('script'\)/,'prewarm must download only, not execute Zen');
});

test('one three-mode switch replaces the old Training Zen pill',()=>{
  assert.match(shell,/function ensureTrainingSwitch\(\)/);
  assert.match(shell,/data-wellness-destination="training"/);
  assert.match(shell,/data-wellness-destination="stretch"/);
  assert.match(shell,/data-wellness-destination="meditation"/);
  assert.match(shellCss,/\.wellness-kind-switch/);
  assert.doesNotMatch(shellCss,/\.wellness-nav\{/);
  assert.doesNotMatch(shell,/className='wellness-nav'/);
  assert.match(zen,/data-wellness-destination="training"/);
  assert.match(zen,/data-kind="stretch"/);
  assert.match(zen,/data-kind="meditation"/);
});

test('Compact uses one header symbol toggle and no dashboard mode switch',()=>{
  assert.match(exercise,/id="training-overview-toggle"/);
  assert.match(overview,/getElementById\('training-overview-toggle'\)/);
  assert.match(overview,/currentMode\(\) === 'compact' \? 'observatory' : 'compact'/);
  assert.match(overviewCss,/#training-overview-toggle\[aria-pressed="true"\]/);
  assert.match(overviewCss,/#9be4e9/);
  assert.doesNotMatch(overview,/training-overview-switch-shell/);
  assert.doesNotMatch(overviewCss,/training-overview-switch-shell/);
});

test('Zen shared header restores the original transparent Zen composition',()=>{
  assert.match(shellCss,/html\[data-wellness-mode=\"zen\"\] #pulse-header\{[^}]*background:transparent!important[^}]*backdrop-filter:none!important[^}]*border:0!important[^}]*box-shadow:none!important[^}]*height:108px!important/);
  assert.match(shellCss,/@media\(max-width:760px\)\{[\s\S]*#pulse-header\{height:92px!important;min-height:92px!important/);
  assert.match(shellCss,/wellness-zen-brand>span:first-child\{[^}]*font-size:48px/);
  assert.match(shellCss,/#pulse-header \.wellness-zen-brand small\{display:none\}/);
  assert.doesNotMatch(shellCss,/background:rgba\(7,27,23,\.86\)!important/);
});

test('exercise profile toggle stays compact in Training and Zen',()=>{
  assert.match(firebase,/\.exercise-user-toggle \{[\s\S]*height:30px;[\s\S]*padding:2px;/);
  assert.match(firebase,/\.exercise-user-option \{[\s\S]*min-height:26px !important;[\s\S]*height:26px !important;/);
  assert.match(firebase,/@media\(max-width:430px\)[\s\S]*height:24px !important;/);
  assert.match(exercise,/firebase-sync\.js\?v=20260916-profile-toggle-compact-1/);
});

test('profile query and intentional browser history survive unified switching',()=>{
  assert.match(shell,/url\.searchParams\.set\('wellness',destination\)/);
  assert.match(shell,/url\.searchParams\.delete\('wellness'\)/);
  assert.match(shell,/history\.pushState/);
  assert.match(shell,/addEventListener\('popstate'/);
  assert.match(shell,/get\('user'\)===['"]maja['"]/);
});

test('production pages cache-bust the unified CP8 controller',()=>{
  for(const source of [exercise,zen]){
    assert.match(source,/training-zen-nav\.css\?v=20260916-main-cp8-zen-header-restore-1/);
    assert.match(source,/training-zen-nav\.js\?v=20260916-main-cp8-unified-tabs-1/);
  }
  assert.match(exercise,/training-overview-mode\.js\?v=20260916-main-cp8-header-toggle-1/);
});
