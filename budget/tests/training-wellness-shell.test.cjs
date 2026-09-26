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
const authConfig=read('auth-config.js');
const environmentCss=read('pulse-environment/environment.css');
const shellV13=read('exercise-shell-v13.js');
const builderV7=read('exercise-builder-between-preview-v7.js');
const builderRows=read('exercise-builder-row-tools-v3.js');
const builderStyle=read('exercise-builder-style-v5.js');
const pulseFieldCss=read('training-pulse-field.css');
const pulseEditorCss=read('training-pulse-editor.css');
const pulseEditorJs=read('training-pulse-editor.js');
const pulseEmbeddedCss=read('training-pulse-embedded.css');
const flowPolish=read('exercise-flow-polish-v2.js');
const betweenRouting=read('exercise-between-routing-v7.js');
const pulseFieldJs=read('training-pulse-field.js');

test('embedded original builder stays lightweight and event driven',()=>{
  assert.match(authConfig,/embeddedFieldWorkspace[\s\S]*return item\.group === 'builder'/);
  assert.match(authConfig,/__loadEmbeddedSessionAssetsV1/);
  assert.match(authConfig,/if \(embeddedFieldWorkspace\) \{[\s\S]*__embeddedBuilderReadyV1[\s\S]*return;/);
  assert.match(authConfig,/__prefetchEmbeddedSessionAssetsV1/);
  assert.match(builderRows,/embedded && window\.MutationObserver/);
  assert.match(builderRows,/syncObserver\.observe\(modal,/);
  assert.doesNotMatch(builderRows,/syncObserver\.observe\(document\.body/);
  assert.match(builderStyle,/embedded && window\.MutationObserver/);
  assert.match(builderStyle,/observer\.observe\(modal,/);
  assert.match(builderV7,/embedded && window\.MutationObserver/);
  assert.match(builderV7,/syncObserver\.observe\(modal,/);
  assert.match(pulseFieldCss,/\.field-chart-tooltip\{[^}]*linear-gradient\(145deg,rgba\(77,30,54,/);
  assert.match(builderRows,/--builder-accent-rgb:\$\{embedded\?'255,101,122':'34,211,238'\}/);
  assert.match(builderV7,/--builder-preview-rgb:\$\{embedded\?'255,101,122':'34,211,238'\}/);
  assert.match(pulseEmbeddedCss,/body \.app-wrap,[\s\S]*display:none!important/);
  assert.match(pulseEmbeddedCss,/--accent-rgb:255,101,122/);
  assert.match(pulseEditorJs,/body\.classList\.add\('field-workspace-active'\)/);
  assert.match(pulseEditorJs,/dialog\.addEventListener\('close',[\s\S]*field-workspace-active/);
  assert.match(pulseEditorCss,/body\.field-workspace-active \.field-canvas,body\.field-workspace-active \.space-scene\{display:none!important\}/);
  assert.match(pulseEditorCss,/\.field-workspace::backdrop\{background:#02050b;backdrop-filter:none\}/);
  assert.match(flowPolish,/var embeddedField = document\.documentElement\.hasAttribute\('data-field-embedded'\)/);
  assert.match(flowPolish,/if \(embeddedField\) \{[\s\S]*pretimer-builder-v2[\s\S]*pretimer-builder-switch-v2[\s\S]*return null;/);
  assert.match(flowPolish,/--flow-accent:\$\{embeddedField\?'#ff9a91':'#22D3EE'\}/);
  assert.match(flowPolish,/session-pretimer-toggle-v2\[aria-pressed="true"\][\s\S]*background:var\(--flow-accent-pale\)/);
  assert.doesNotMatch(flowPolish,/background:#A5F3FC/);
  assert.match(flowPolish,/if \(embeddedField\) \{[\s\S]*MutationObserver[\s\S]*requestAnimationFrame\(syncEmbeddedSession\)[\s\S]*\} else \{[\s\S]*setInterval\(syncSlow,450\)/);
  assert.match(betweenRouting,/if \(embeddedField\) return;[\s\S]*exercise-between-routing-v7-clarification/);
  assert.match(betweenRouting,/if \(embeddedField\) \{[\s\S]*MutationObserver[\s\S]*requestAnimationFrame\(syncArchiveRows\)[\s\S]*\} else \{[\s\S]*setInterval\(syncArchiveRows,220\)/);
  assert.match(shellV13,/if\(embeddedField\)\{[\s\S]*pretimer-builder-v2[\s\S]*pretimer-builder-switch-v2[\s\S]*return true;/);
  assert.match(pulseFieldJs,/fieldLayoutKey='ex_field_layout_'\+profile/);
  assert.match(pulseFieldJs,/new IntersectionObserver\([\s\S]*fieldSceneVisible/);
  assert.doesNotMatch(pulseFieldJs,/addEventListener\('scroll'/);
  assert.match(pulseFieldCss,/\.space-scene\{position:fixed/);
  assert.match(pulseFieldCss,/html\[data-field-scene-visible="false"\] \.space-scene\{display:none\}/);
  assert.match(pulseFieldCss,/html\[data-field-layout="compact"\] \.field-canvas,html\[data-field-layout="compact"\] \.space-scene\{display:none\}/);
});

test('CP8 uses one canonical in-page wellness shell without iframe or duplicate full documents',()=>{
  assert.match(shell,/canonical=\/\\\/exercise\\\.html\$\//);
  assert.match(shell,/fetch\('zen\.html\?v=20260921-wellness-cohesion-1'/);
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
  assert.doesNotMatch(zenRuntime,/home\.style\.visibility='hidden'/);
  assert.match(zenRuntime,/kindMotionToken/);
  assert.match(zenRuntime,/home\.classList\.add\('zen-kind-surface-enter'\)/);
  assert.match(zenRuntime,/prefers-reduced-motion: reduce/);
  assert.match(zenCss,/\.zen-kind-surface-enter \{[\s\S]*zenKindSurfaceIn \.18s/);
  assert.match(zenCss,/@keyframes zenKindSurfaceIn/);
  assert.doesNotMatch(zenCss,/::view-transition-/);
});

test('Zen network assets warm without starting the Zen runtime',()=>{
  assert.equal((shell.match(/fetch\('zen\.html\?v=20260921-wellness-cohesion-1'/g)||[]).length,1,'Zen document should have one fetch owner');
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

test('Shared header geometry is stable across all wellness themes',()=>{
  assert.match(shellCss,/#pulse-page #pulse-header\{[^}]*height:104px!important[^}]*border:0!important[^}]*background:transparent!important[^}]*box-shadow:none!important[^}]*backdrop-filter:none!important/);
  assert.match(shellCss,/@media\(max-width:760px\)\{[\s\S]*#pulse-header\{height:92px!important;min-height:92px!important/);
  assert.match(shellCss,/wellness-zen-brand>span:first-child\{[^}]*font-size:48px/);
  assert.match(shellCss,/#pulse-header \.wellness-zen-brand small\{display:none\}/);
  assert.doesNotMatch(shellCss,/background:rgba\(7,27,23,\.86\)!important/);
});

test('Zen uses its existing shade to blend the first paintable pixel with Safari chrome',()=>{
  assert.match(zenCss, /--zen-browser-edge: linear-gradient\(180deg,#0d1c17 0px/);
  assert.match(zenCss, /body\[data-kind=meditation\] \{[\s\S]*--zen-browser-edge: linear-gradient\(180deg,#a8c5be 0px/);
  const shadeDeclarations=zenCss.match(/background: var\(--zen-browser-edge\),linear-gradient/g)||[];
  assert.equal(shadeDeclarations.length,3,'Default, mobile forest and meditation shade should share one Safari edge transition');
  assert.doesNotMatch(zenCss,/\.landscape::(?:before|after)\s*\{/,'Do not stack another scene element over the artwork');
});

test('Zen landscape begins at the app top behind header and shared toggle',()=>{
  assert.match(shell,/zenBackdrop\.classList\.add\('wellness-zen-backdrop'\)/);
  assert.match(shellCss,/\.wellness-zen-backdrop\{position:absolute!important;inset:0 0 auto!important/);
  assert.match(shellCss,/#pulse-page #pulse-header\{[^}]*background:transparent!important/);
  assert.match(shellCss,/html\[data-wellness-mode="zen"\] \.wellness-kind-switch\{z-index:30\}/);
});

test('exercise profile toggle stays compact and follows the active page theme',()=>{
  assert.match(firebase,/\.exercise-user-toggle \{[\s\S]*height:30px;[\s\S]*padding:2px;/);
  assert.match(firebase,/\.exercise-user-option \{[\s\S]*min-height:26px !important;[\s\S]*height:26px !important;/);
  assert.match(firebase,/@media\(max-width:430px\)[\s\S]*height:24px !important;/);
  assert.match(firebase,/#exercise-user-toggle \.exercise-user-option\.active/);
  assert.match(shellCss,/#exercise-user-toggle\{--profile-accent:#ff9a91/);
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
  assert.match(exercise,/training-zen-nav\.css\?v=20260922-observatory-composition-2/);
  assert.match(zen,/training-zen-nav\.css\?v=20260924-sky-tint-3/);
  for(const source of [exercise,zen]){
    assert.match(source,/training-zen-nav\.js\?v=20260921-wellness-cohesion-1/);
  }
  assert.match(exercise,/auth-config\.js\?v=20260926-energy-session-8/);
  assert.match(exercise,/auth-gate\.js\?v=20260926-energy-session-7/);
  assert.match(exercise,/training-overview-mode\.js\?v=20260922-observatory-composition-2/);
  assert.match(exercise,/pulse-environment\/environment\.js\?v=20260922-observatory-composition-2/);
  assert.match(exercise,/training-week-orbit\.js\?v=20260922-observatory-composition-2/);
  assert.match(overviewShim,/exercise-dashboard\.js\?v=20260922-observatory-composition-2/);
  assert.match(zen,/zen\.css\?v=20260925-safari-edge-11/);
  assert.match(zen,/zen\.js\?v=20260924-sky-tint-3/);
});


test('Stretch home removes the retired oversized pseudo surface instead of hiding it with an override', () => {
  assert.doesNotMatch(zenCss, /body\[data-kind=stretch\] #home-view::before/);
});


test('Stretch mobile hero subtitle stays inside its content column', () => {
  assert.match(zenCss, /@media \(max-width:600px\)[\s\S]*body\[data-kind=stretch\] \.hero-copy h1::after \{[\s\S]*width: 100%;[\s\S]*max-width: 100%;[\s\S]*white-space: normal;[\s\S]*overflow-wrap: anywhere;/);
});


test('Zen mobile hero title is bounded for a 390px shared shell', () => {
  assert.match(zenCss, /@media \(max-width:600px\)[\s\S]*\.hero-copy h1 \{[\s\S]*font-size: clamp\(58px,16vw,64px\);/);
});


test('Zen runtime does not write to the retired standalone profile label', () => {
  assert.doesNotMatch(zenRuntime, /profile-name/);
});


test('Zen render completion cannot rewrite wellness browser history',()=>{
  const rendered=shell.match(/document\.addEventListener\('zen:home-rendered',[\s\S]*?\n  \}\);/);
  assert.ok(rendered,'zen:home-rendered listener must exist');
  assert.match(rendered[0],/syncCanvasTheme\(zenKind\)/);
  assert.match(rendered[0],/updateUnifiedSwitch\(zenKind\)/);
  assert.doesNotMatch(rendered[0],/historyFor\(/,'requestDestination is the sole wellness history owner');
});


test('shared wellness CSS prevents iPhone focus zoom in every editable control without disabling pinch zoom',()=>{
  assert.doesNotMatch(shellCss,/@supports \(-webkit-touch-callout:none\)/);
  assert.match(shellCss,/@media\(hover:none\) and \(pointer:coarse\)/);
  assert.match(shellCss,/html body input:not\(\[type="hidden"\]\)[\s\S]*html body select,[\s\S]*html body textarea,[\s\S]*\[contenteditable\]:not\(\[contenteditable="false"\]\)[\s\S]*font-size:16px!important/);
  assert.doesNotMatch(shellCss,/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
  assert.doesNotMatch(exercise,/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
  assert.doesNotMatch(zen,/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
});

test('same-mode Zen destination selection always resynchronizes kind and canvas state',()=>{
  assert.match(shell,/var changedDestination=destination!==zenKind\|\|document\.body\.dataset\.kind!==destination\|\|document\.documentElement\.dataset\.wellnessKind!==destination/);
  assert.match(shell,/selectZenKind\(destination\);\s*if\(changedDestination\)historyFor/);
});

test('wellness shell removes the Pulse concept class while Zen owns the page and restores it for Training',()=>{
  assert.match(shell,/classList\.toggle\('exercise-concept-pulse-home-v1',!zen\)/);
});

test('shared shell fills the full Stretch and Meditation document canvas',()=>{
  assert.match(shell,/document\.documentElement\.dataset\.wellnessKind=destination/);
  assert.match(shell,/delete document\.documentElement\.dataset\.wellnessKind/);
  assert.match(shellCss,/data-wellness-kind="stretch"[\s\S]*background:#091d18!important/);
  assert.match(shellCss,/data-wellness-kind="meditation"[\s\S]*background:#a7c3bd!important/);
});

test('Zen owns the root canvas and training-only backgrounds release it cleanly',()=>{
  assert.match(shell,/function zenCanvasColor\(kind\)/);
  assert.match(shell,/document\.documentElement\.style\.backgroundColor=color/);
  assert.match(shell,/syncCanvasTheme\(zen\?zenKind:'training'\)/);
  assert.match(shell,/document\.documentElement\.dataset\.wellnessMode='zen'/);
  assert.match(authConfig,/exercise-concept-pulse-home-v1:not\(\[data-wellness-mode="zen"\]\)/);
  assert.match(authGate,/html:not\(\[data-wellness-mode="zen"\]\),html:not\(\[data-wellness-mode="zen"\]\) body/);
  assert.match(environmentCss,/html:not\(\[data-wellness-mode="zen"\]\)#pulse-document/);
  assert.doesNotMatch(environmentCss,/^#pulse-document:not\(:has\(#session-modal\.show\)\),/m);
});


test('Zen document canvas switches immediately instead of blending through stale background', () => {
  assert.match(zenCss, /The background is the document canvas below the scenery/);
  assert.doesNotMatch(zenCss, /transition:\s*background\s+1s/);
});
