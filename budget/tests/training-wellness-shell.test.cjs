const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const shell=read('training-zen-nav.js');
const shellCss=read('training-zen-nav.css');
const overview=read('exercise-dashboard.js');
const overviewShim=read('training-overview-mode.js');
const overviewCss=read('training-overview-mode.css');
const exercise=read('exercise.html');
const zen=read('zen.html');
const zenRuntime=read('zen.js');
const zenCss=read('zen.css');
const store=read('zen-store.js');
const firebase=read('firebase-sync.js');
const authGate=read('auth-gate.js');
const shellV13=read('exercise-shell-v13.js');
const builderV7=read('exercise-builder-between-preview-v7.js');

test('CP8 uses one canonical in-page wellness shell without iframe or duplicate full documents',()=>{
  assert.match(shell,/canonical=\/\\\/exercise\\\.html\$\//);
  assert.match(shell,/fetch\('zen\.html'/);
  assert.match(shell,/extractZenSurface\(doc\)/);
  assert.match(shell,/zenBackdrop=document\.importNode\(landscape,true\)/);
  assert.match(shell,/wrap\.insertBefore\(zenBackdrop,wrap\.firstChild\)/);
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

test('Training stays mounted while Zen uses one shared header and separate scene background',()=>{
  assert.match(shell,/trainingMain\.hidden=zen/);
  assert.match(shell,/if\(zenHost\)zenHost\.hidden=true/);
  assert.match(shell,/if\(zenHost\)zenHost\.hidden=false/);
  assert.match(shell,/if\(zenBackdrop\)zenBackdrop\.hidden=true/);
  assert.match(shell,/if\(zenBackdrop\)zenBackdrop\.hidden=false/);
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

test('wellness switching atomically swaps surfaces without outgoing snapshots',()=>{
  assert.doesNotMatch(shell,/document\.startViewTransition/);
  assert.match(shell,/wellness-shell-switching/);
  assert.match(shell,/prefers-reduced-motion: reduce/);
  const apply=shell.slice(shell.indexOf('function applyMode'),shell.indexOf('function swap'));
  assert.ok(apply.indexOf('if(zenHost)zenHost.hidden=true;')>=0);
  assert.ok(apply.indexOf('if(zenHost)zenHost.hidden=true;')<apply.indexOf('if(!zen)toggleZenStyles(false);'));
  assert.ok(apply.indexOf('if(zenBackdrop)zenBackdrop.hidden=true;')<apply.indexOf('if(!zen)toggleZenStyles(false);'));
  assert.match(shellCss,/wellnessSurfaceIn/);
  assert.doesNotMatch(shellCss,/::view-transition-/);
  assert.doesNotMatch(shellCss,/view-transition-name/);
  assert.match(shellCss,/@media\(prefers-reduced-motion:reduce\)/);
});

test('wellness morph animates only the incoming surface and remains short',()=>{
  assert.match(shellCss,/wellnessSurfaceIn \.18s/);
  assert.doesNotMatch(shellCss,/wellnessSurfaceOld|wellnessSurfaceNew/);
  const morphCss=shellCss.slice(shellCss.indexOf('.wellness-surface-enter'),shellCss.indexOf('@media(max-width:760px)'));
  assert.doesNotMatch(morphCss,/filter:blur/);
  assert.match(shell,/target\.classList\.add\('wellness-surface-enter'\)/);
  assert.match(shell,/\},200\);/);
});

test('Stretch and Meditation reuse the same incoming-only atomic transition model',()=>{
  assert.match(zenRuntime,/function applyKind\(next\)/);
  assert.match(zenRuntime,/home\.style\.visibility='hidden'/);
  assert.match(zenRuntime,/home\.classList\.add\('zen-kind-surface-enter'\)/);
  assert.match(zenRuntime,/prefers-reduced-motion: reduce/);
  assert.match(zenCss,/\.zen-kind-surface-enter \{[\s\S]*zenKindSurfaceIn \.18s/);
  assert.match(zenCss,/@keyframes zenKindSurfaceIn/);
  assert.doesNotMatch(zenCss,/::view-transition-/);
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

test('one persistent three-mode switch owns the same position in Training Stretch and Meditation',()=>{
  assert.match(shell,/function ensureSharedSwitch\(\)/);
  assert.match(shell,/header\.insertAdjacentElement\('afterend',nav\)/);
  assert.match(shell,/class="wellness-kind-options"/);
  assert.match(shell,/class="wellness-overview-slot"/);
  assert.match(shell,/overviewSlot\.appendChild\(overviewToggle\)/);
  assert.match(shellCss,/grid-template-columns:minmax\(0,1fr\) 42px/);
  assert.match(shellCss,/\.wellness-overview-slot\{[^}]*width:42px[^}]*height:54px/);
  assert.match(shell,/data-wellness-destination="training"/);
  assert.match(shell,/data-wellness-destination="stretch"/);
  assert.match(shell,/data-wellness-destination="meditation"/);
  assert.match(shellCss,/\.wellness-kind-switch/);
  assert.doesNotMatch(shellCss,/\.wellness-nav\{/);
  assert.doesNotMatch(shell,/className='wellness-nav'/);
  assert.match(shellCss,/#wellness-zen-surface \.kind-switch\{display:none!important\}/);
  assert.doesNotMatch(shell,/ensureTrainingSwitch|trainingSwitch/);
  assert.match(zen,/data-wellness-destination="training"/);
  assert.match(zen,/data-kind="stretch"/);
  assert.match(zen,/data-kind="meditation"/);
});

test('Compact uses one right-side wellness-row symbol and no dashboard mode switch',()=>{
  assert.match(exercise,/id="training-overview-toggle"/);
  assert.match(overview,/getElementById\('training-overview-toggle'\)/);
  assert.match(overview,/currentMode\(\) === 'compact' \? 'observatory' : 'compact'/);
  assert.match(overviewCss,/#training-overview-toggle\[aria-pressed="true"\]/);
  assert.match(overviewCss,/#9be4e9/);
  assert.doesNotMatch(overview,/training-overview-switch-shell/);
  assert.doesNotMatch(overviewCss,/training-overview-switch-shell/);
  assert.match(shell,/overviewSlot\.appendChild\(overviewToggle\)/);
  assert.match(overviewCss,/html\[data-wellness-mode="zen"\] #training-overview-toggle\{display:none!important\}/);
});

test('Zen shared header restores the original transparent Zen composition',()=>{
  assert.match(shellCss,/html\[data-wellness-mode=\"zen\"\] #pulse-header\{[^}]*background:transparent!important[^}]*backdrop-filter:none!important[^}]*border:0!important[^}]*box-shadow:none!important[^}]*height:108px!important/);
  assert.match(shellCss,/@media\(max-width:760px\)\{[\s\S]*#pulse-header\{height:92px!important;min-height:92px!important/);
  assert.match(shellCss,/wellness-zen-brand>span:first-child\{[^}]*font-size:48px/);
  assert.match(shellCss,/#pulse-header \.wellness-zen-brand small\{display:none\}/);
  assert.doesNotMatch(shellCss,/background:rgba\(7,27,23,\.86\)!important/);
});

test('Zen landscape begins at the app top behind header and shared toggle',()=>{
  assert.match(shell,/zenBackdrop\.classList\.add\('wellness-zen-backdrop'\)/);
  assert.match(shellCss,/\.wellness-zen-backdrop\{position:absolute!important;inset:0 0 auto!important/);
  assert.match(shellCss,/html\[data-wellness-mode="zen"\] #pulse-header\{background:transparent!important/);
  assert.match(shellCss,/html\[data-wellness-mode="zen"\] \.wellness-kind-switch\{z-index:30\}/);
});

test('exercise profile toggle stays compact and follows the active page theme',()=>{
  assert.match(firebase,/\.exercise-user-toggle \{[\s\S]*height:30px;[\s\S]*padding:2px;/);
  assert.match(firebase,/\.exercise-user-option \{[\s\S]*min-height:26px !important;[\s\S]*height:26px !important;/);
  assert.match(firebase,/@media\(max-width:430px\)[\s\S]*height:24px !important;/);
  assert.match(firebase,/#exercise-user-toggle \.exercise-user-option\.active/);
  assert.match(shellCss,/#exercise-user-toggle\{--profile-accent:#ff9bb2/);
  assert.match(shellCss,/body\[data-kind="stretch"\] #exercise-user-toggle\{--profile-accent:#d4eea7/);
  assert.match(shellCss,/body\[data-kind="meditation"\] #exercise-user-toggle\{--profile-accent:#244739/);
  for(const source of [authGate,shellV13,builderV7]) assert.doesNotMatch(source,/exercise-user-option\[data-user="(?:markus|maja)"\]\.active/);
  assert.match(exercise,/firebase-sync\.js\?v=20260916-profile-theme-2/);
});

test('rapid Training and Zen requests cancel stale pending transitions',()=>{
  const start=shell.indexOf('function requestDestination');
  const end=shell.indexOf('\n\n  if(directZen',start);
  const body=shell.slice(start,end);
  assert.ok(body.indexOf('var token=++switchToken;')>=0);
  assert.ok(body.indexOf('var token=++switchToken;')<body.indexOf('if(nextMode===mode&&!options.force)'));
  assert.match(body,/sharedSwitch\.setAttribute\('aria-busy','true'\)/);
  assert.match(body,/token===switchToken/);
});

test('profile query and intentional browser history survive unified switching',()=>{
  assert.match(shell,/url\.searchParams\.set\('wellness',destination\)/);
  assert.match(shell,/url\.searchParams\.delete\('wellness'\)/);
  assert.match(shell,/history\.pushState/);
  assert.match(shell,/addEventListener\('popstate'/);
  assert.match(shell,/get\('user'\)===['"]maja['"]/);
});

test('production pages cache-bust the shared wellness owners',()=>{
  for(const source of [exercise,zen]){
    assert.match(source,/training-zen-nav\.css\?v=20260916-main-cp8-no-flash-1/);
    assert.match(source,/training-zen-nav\.js\?v=20260916-main-cp8-no-flash-1/);
  }
  assert.match(exercise,/auth-config\.js\?v=20260916-wellness-shell-3/);
  assert.match(exercise,/auth-gate\.js\?v=20260916-wellness-shell-3/);
  assert.match(exercise,/training-overview-mode\.js\?v=20260918-main-cp11-shims-1/);
  assert.match(exercise,/pulse-environment\/environment\.js\?v=20260918-main-cp11-shims-1/);
  assert.match(exercise,/training-week-orbit\.js\?v=20260918-main-cp11-shims-1/);
  assert.match(overviewShim,/exercise-dashboard\.js\?v=20260916-main-cp10-dashboard-1/);
  assert.match(zen,/zen\.css\?v=20260918-cp11-canvas-containment-1/);
  assert.match(zen,/zen\.js\?v=20260916-kind-enter-1/);
});


test('Zen scene canvas has an explicit CSS paint box inside the shared mobile shell', () => {
  assert.match(zenCss, /\.landscape>div,\s*\.landscape>canvas\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*max-width:\s*100%;[^}]*display:\s*block;/s);
});
