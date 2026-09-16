const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const shell=read('training-zen-nav.js');
const css=read('training-zen-nav.css');
const exercise=read('exercise.html');
const zen=read('zen.html');
const store=read('zen-store.js');

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

test('Training stays mounted while Zen is toggled and the shared header supplies Zen tools',()=>{
  assert.match(shell,/trainingMain\.hidden=zen/);
  assert.match(shell,/zenHost\.hidden=!zen/);
  assert.match(shell,/wellness-zen-tools/);
  assert.match(shell,/id="profile-name"/);
  assert.match(shell,/id="settings-open"/);
  assert.match(css,/wellness-zen-surface/);
  assert.equal((shell.match(/createElement\('header'\)/g)||[]).length,0);
});


test('mobile Zen header retires the Training hamburger and uses one compact two-row composition',()=>{
  assert.match(css,/html\[data-wellness-mode="zen"\] #pulse-header \.nav-dropdown-wrapper\{display:none!important\}/);
  assert.doesNotMatch(css,/html\[data-wellness-mode="zen"\] \.nav-dropdown-wrapper\{opacity:/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) auto!important/);
  assert.match(css,/grid-template-rows:auto auto!important/);
  assert.match(css,/#pulse-header \.brand\{[\s\S]*position:static!important/);
  assert.match(css,/#pulse-header>\.wellness-nav\{[\s\S]*grid-row:2!important/);
  assert.match(css,/#pulse-header \.wellness-zen-tools\{[\s\S]*grid-row:1!important/);
  assert.match(css,/padding:12px 16px 10px!important/);
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
  assert.match(css,/wellnessSurfaceIn/);
  assert.match(css,/::view-transition-old\(wellness-surface\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});


test('wellness morph stays short and avoids expensive full-surface blur',()=>{
  assert.match(css,/wellnessSurfaceIn \.22s/);
  assert.match(css,/wellnessSurfaceOld \.18s/);
  assert.match(css,/wellnessSurfaceNew \.24s/);
  const morphCss=css.slice(css.indexOf('.wellness-surface-enter'),css.indexOf('@media(max-width:760px)'));
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

test('profile query and intentional browser history survive in-page switching',()=>{
  assert.match(shell,/searchParams\.set\('wellness','zen'\)/);
  assert.match(shell,/searchParams\.delete\('wellness'\)/);
  assert.match(shell,/history\.pushState/);
  assert.match(shell,/addEventListener\('popstate'/);
  assert.match(shell,/get\('user'\)===['"]maja['"]/);
});

test('production pages cache-bust the CP8 shared controller',()=>{
  for(const source of [exercise,zen]){
    assert.match(source,/training-zen-nav\.css\?v=20260916-main-cp8-wellness-header-3/);
    assert.match(source,/training-zen-nav\.js\?v=20260916-main-cp8-wellness-header-3/);
  }
});
