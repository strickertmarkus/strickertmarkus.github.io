from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 exact match, found {count}')
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label, flags=0):
    text2, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 regex match, found {count}')
    return text2

# --- Shared Training / Zen shell -------------------------------------------------
path = 'budget/training-zen-nav.js'
text = read(path)
text = replace_once(
    text,
    "var zenHost=null,zenLoadPromise=null,zenDocumentPromise=null,zenPreloadStarted=false,zenStyleLinks=[],zenTools=null,zenBrand=null,trainingSwitch=null;",
    "var zenHost=null,zenBackdrop=null,zenLoadPromise=null,zenDocumentPromise=null,zenPreloadStarted=false,zenStyleLinks=[],zenTools=null,zenBrand=null,sharedSwitch=null;",
    'shell state owner'
)
new_switch = """  function ensureSharedSwitch(){
    if(!canonical||!trainingMain||!header)return null;
    var existing=document.querySelector('[data-wellness-kind-switch=\"true\"]');
    if(existing){sharedSwitch=existing;return existing;}
    var nav=document.createElement('nav');
    nav.className='wellness-kind-switch';
    nav.dataset.wellnessKindSwitch='true';
    nav.setAttribute('aria-label','Välj Träning, Stretch eller Meditation');
    nav.innerHTML=switchMarkup();
    header.insertAdjacentElement('afterend',nav);
    sharedSwitch=nav;
    nav.addEventListener('click',function(event){
      var button=event.target.closest('[data-wellness-destination]');
      if(!button||!nav.contains(button))return;
      requestDestination(button.dataset.wellnessDestination);
    });
    return nav;
  }
"""
text = sub_once(
    text,
    r"  function ensureTrainingSwitch\(\)\{.*?\n  \}\n(?=  function updateUnifiedSwitch)",
    new_switch,
    'shared switch owner',
    re.S
)
new_extract = """  function extractZenSurface(doc){
    var host=document.createElement('section');
    host.id='wellness-zen-surface';host.className='wellness-zen-surface';host.hidden=true;host.setAttribute('aria-label','Zen');
    var landscape=doc.querySelector('.landscape');
    if(landscape){
      zenBackdrop=document.importNode(landscape,true);
      zenBackdrop.classList.add('wellness-zen-backdrop');
      zenBackdrop.hidden=true;
      var wrap=header&&header.closest('.app-wrap');
      if(wrap)wrap.insertBefore(zenBackdrop,wrap.firstChild);
      else document.body.insertBefore(zenBackdrop,document.body.firstChild);
    }
    var main=doc.querySelector('#zen-main');
    if(main)host.appendChild(document.importNode(main,true));
    Array.prototype.forEach.call(doc.querySelectorAll('dialog,#toast'),function(node){host.appendChild(document.importNode(node,true));});
    if(!host.querySelector('#zen-main'))throw new Error('Zen-ytan saknar huvudvyn.');
    trainingMain.insertAdjacentElement('afterend',host);
    var trainingButton=host.querySelector('.kind-switch [data-wellness-destination=\"training\"]');
    if(trainingButton)trainingButton.addEventListener('click',function(){requestDestination('training');});
    return host;
  }
"""
text = sub_once(
    text,
    r"  function extractZenSurface\(doc\)\{.*?\n  \}\n(?=  function ensureZenLoaded)",
    new_extract,
    'Zen backdrop extraction',
    re.S
)
text = replace_once(
    text,
    "    }).catch(function(error){zenLoadPromise=null;if(zenHost){zenHost.remove();zenHost=null;}throw error;});",
    "    }).catch(function(error){zenLoadPromise=null;if(zenHost){zenHost.remove();zenHost=null;}if(zenBackdrop){zenBackdrop.remove();zenBackdrop=null;}throw error;});",
    'Zen load cleanup'
)
text = replace_once(
    text,
    "    if(zenHost)zenHost.hidden=!zen;\n    if(zenTools)zenTools.hidden=!zen;",
    "    if(zenHost)zenHost.hidden=!zen;\n    if(zenBackdrop)zenBackdrop.hidden=!zen;\n    if(zenTools)zenTools.hidden=!zen;",
    'Zen backdrop visibility'
)
text = replace_once(text, "var nav=ensureTrainingSwitch();", "var nav=ensureSharedSwitch();", 'shared switch init')
if 'trainingSwitch' in text:
    raise SystemExit('obsolete trainingSwitch owner remains')
write(path, text)

# --- Shared navigation + restored landscape composition --------------------------
css = r'''.wellness-kind-switch{--wellness-accent:#ff9bb2;--wellness-accent-soft:rgba(255,155,178,.12);--wellness-accent-glow:rgba(255,98,142,.42);--wellness-muted:#a896a5;--wellness-line:rgba(255,184,208,.20);display:flex;align-items:center;gap:28px;width:min(90%,1100px);max-width:1100px;margin:0 auto;padding-top:18px;border-bottom:1px solid var(--wellness-line);font-family:Inter,system-ui,sans-serif;position:relative;z-index:24}
.wellness-kind-switch button{position:relative;appearance:none;-webkit-appearance:none;display:flex;align-items:center;gap:10px;min-height:44px;padding:8px 3px 14px;border:0;border-radius:0;background:none;color:var(--wellness-muted);font:500 13px/1.25 Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap;touch-action:manipulation;transition:color .3s,text-shadow .3s}
.wellness-kind-switch button span{font-size:27px;line-height:1;font-weight:400}
.wellness-kind-switch button:hover{color:var(--wellness-accent)}
.wellness-kind-switch button:focus-visible{outline:2px solid var(--wellness-accent);outline-offset:5px}
.wellness-kind-switch button[aria-pressed="true"]{color:var(--wellness-accent);text-shadow:0 0 25px var(--wellness-accent-glow)}
.wellness-kind-switch button:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:1px;background:var(--wellness-accent);box-shadow:0 0 12px var(--wellness-accent);transform:scaleX(0);transform-origin:center;transition:transform .55s cubic-bezier(.16,1,.3,1)}
.wellness-kind-switch button[aria-pressed="true"]:after{transform:scaleX(1)}
.wellness-mode-notice{position:absolute;left:50%;top:calc(100% + 9px);transform:translateX(-50%);width:max-content;max-width:min(330px,82vw);padding:8px 11px;border:1px solid #e8c7a22b;border-radius:10px;background:#161a1eea;color:#eadfd6;font-size:10px;font-weight:500;line-height:1.35;box-shadow:0 10px 28px #0007;z-index:1200}

html[data-wellness-mode="zen"] body[data-kind="stretch"] .wellness-kind-switch{--wellness-accent:#d4eea7;--wellness-accent-soft:rgba(212,238,167,.11);--wellness-accent-glow:rgba(192,243,150,.38);--wellness-muted:#b4c6af;--wellness-line:#b2d69626}
html[data-wellness-mode="zen"] body[data-kind="meditation"] .wellness-kind-switch{--wellness-accent:#244739;--wellness-accent-soft:rgba(43,100,82,.11);--wellness-accent-glow:rgba(43,100,82,.25);--wellness-muted:#5c716b;--wellness-line:#627e6530}

/* The integrated Zen state uses the original Zen header composition while the scene owns the full top background. */
.wellness-zen-brand{display:flex;align-items:center;gap:12px;flex:1;min-width:0;color:#edf4dc;text-decoration:none;font-family:"Cormorant Garamond",Georgia,serif;font-size:37px;font-weight:400;line-height:1}
.wellness-zen-brand[hidden],.wellness-zen-tools[hidden],.wellness-zen-backdrop[hidden]{display:none!important}
.wellness-zen-brand>span:first-child{font-family:"DM Sans",system-ui,sans-serif;font-size:48px;font-weight:300;color:#d4eea7;text-shadow:0 0 25px #c0f39699}
.wellness-zen-brand small{display:block;margin-top:7px;color:#b4c6af;font:8px Manrope,"DM Sans",system-ui,sans-serif;letter-spacing:2px}
.wellness-zen-tools{display:flex;align-items:center;justify-content:flex-end;flex:0 0 auto;color:#b4c6af;font:500 11px/1.2 Manrope,Inter,system-ui,sans-serif}
.wellness-zen-tools .icon-button{display:grid;place-items:center;width:44px;height:44px;min-width:44px;min-height:44px;padding:0;border:1px solid #b2d69626;border-radius:50%;background:transparent;color:#edf4dc;font-size:27px;line-height:1}
.wellness-zen-tools .icon-button:hover{background:#d4eea71a}

#exercise-user-toggle{--profile-accent:#ff9bb2;--profile-soft:rgba(255,155,178,.12);--profile-border:rgba(255,155,178,.34);--profile-glow:rgba(255,98,142,.22);--profile-muted:#b8a7b2}
html[data-wellness-mode="zen"] body[data-kind="stretch"] #exercise-user-toggle{--profile-accent:#d4eea7;--profile-soft:rgba(212,238,167,.11);--profile-border:rgba(212,238,167,.32);--profile-glow:rgba(192,243,150,.20);--profile-muted:#b4c6af}
html[data-wellness-mode="zen"] body[data-kind="meditation"] #exercise-user-toggle{--profile-accent:#244739;--profile-soft:rgba(43,100,82,.11);--profile-border:rgba(43,100,82,.28);--profile-glow:rgba(43,100,82,.15);--profile-muted:#5c716b}

.wellness-zen-backdrop{position:absolute!important;inset:0 0 auto!important;width:100%!important;z-index:0!important;pointer-events:none!important}
.wellness-zen-surface{position:relative;z-index:2;isolation:isolate;min-height:100vh;view-transition-name:wellness-surface}
#pulse-home{view-transition-name:wellness-surface}
#wellness-zen-surface .kind-switch{display:none!important}
html[data-wellness-mode="zen"] #pulse-header{background:transparent!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;border:0!important;box-shadow:none!important;position:relative!important;top:auto!important;z-index:30!important;height:108px!important;min-height:108px!important;max-width:1440px;margin:0 auto!important;padding:0 5.5%!important;display:flex!important;align-items:center!important;gap:24px!important}
html[data-wellness-mode="zen"] #pulse-header .brand{position:static!important;left:auto!important;top:auto!important;transform:none!important;width:auto!important;max-width:none!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;flex:1!important;min-width:0!important}
html[data-wellness-mode="zen"] #pulse-header .wellness-zen-tools{margin-left:auto!important;flex:0 0 auto!important}
html[data-wellness-mode="zen"] .wellness-kind-switch{z-index:30}
.wellness-surface-enter{animation:wellnessSurfaceIn .22s cubic-bezier(.16,1,.3,1)}
@keyframes wellnessSurfaceIn{from{opacity:0;transform:translateY(5px) scale(.996)}to{opacity:1;transform:none}}
::view-transition-old(wellness-surface){animation:wellnessSurfaceOld .18s cubic-bezier(.4,0,.2,1)}
::view-transition-new(wellness-surface){animation:wellnessSurfaceNew .24s cubic-bezier(.16,1,.3,1)}
@keyframes wellnessSurfaceOld{to{opacity:0;transform:scale(.997) translateY(-3px)}}
@keyframes wellnessSurfaceNew{from{opacity:0;transform:scale(.997) translateY(4px)}}

@media(max-width:760px){
  .wellness-kind-switch{gap:18px;width:88%;max-width:none;padding-top:14px}
  .wellness-kind-switch button{gap:7px;font-size:12px;padding-inline:1px}
  .wellness-kind-switch button span{font-size:23px}
  html[data-wellness-mode="zen"] #pulse-header{height:92px!important;min-height:92px!important;gap:12px!important;padding:0 6%!important}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand{gap:6px;flex:0 1 auto;font-size:30px;line-height:1}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand>span:first-child{font-size:35px}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand small{display:none}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-tools{margin-left:auto!important}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-tools .icon-button{width:36px;height:36px;min-width:36px;min-height:36px;border:0;font-size:24px}
}
@media(max-width:390px){
  .wellness-kind-switch{gap:11px;justify-content:space-between}
  .wellness-kind-switch button{gap:5px;font-size:11px}
  .wellness-kind-switch button span{font-size:21px}
  html[data-wellness-mode="zen"] #pulse-header{gap:8px!important;padding-inline:5.5%!important}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand{font-size:28px}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand>span:first-child{font-size:32px}
}
@media(prefers-reduced-motion:reduce){
  .wellness-kind-switch button,.wellness-kind-switch button:after,.wellness-surface-enter{transition:none!important;animation:none!important}
  ::view-transition-old(wellness-surface),::view-transition-new(wellness-surface){animation:none!important}
}
'''
write('budget/training-zen-nav.css', css)

# --- Profile toggle: one theme owner, no user-specific active color ----------------
path = 'budget/firebase-sync.js'
text = read(path)
profile_css = """    .exercise-user-toggle {
      display:flex;
      align-items:center;
      flex-shrink:0;
      height:30px;
      max-height:30px;
      padding:2px;
      gap:1px;
      border:1px solid var(--profile-border,var(--border));
      border-radius:9px;
      background:rgba(255,255,255,.035);
    }
    .exercise-user-option {
      display:flex;
      align-items:center;
      justify-content:center;
      min-width:0 !important;
      min-height:26px !important;
      height:26px !important;
      margin:0 !important;
      border:0;
      background:transparent;
      color:var(--profile-muted,var(--text-sec));
      border-radius:7px;
      padding:0 8px !important;
      font:600 10px/1 'Inter',sans-serif;
      cursor:pointer;
      transition:background .15s,color .15s,box-shadow .15s;
    }
    #exercise-user-toggle .exercise-user-option.active {
      background:var(--profile-soft,var(--accent-dim));
      color:var(--profile-accent,var(--accent));
      box-shadow:inset 0 0 0 1px var(--profile-border,var(--border-a)),0 0 12px var(--profile-glow,transparent);
    }
"""
text = sub_once(
    text,
    r"    \.exercise-user-toggle \{.*?    \.exercise-user-option\.active \{.*?    \}\n",
    profile_css,
    'profile toggle CSS owner',
    re.S
)
write(path, text)

# Remove superseded Markus/Maja color ownership from active training layers.
path = 'budget/auth-gate.js'
text = read(path)
text = replace_once(text, "  var exerciseAssetsVersion = '20260915-cp5-identity';", "  var exerciseAssetsVersion = '20260916-wellness-shell-3';", 'auth gate cache version')
for old in [
    "      '.exercise-user-option[data-user=\"markus\"].active{background:rgba(56,189,248,.14)!important;color:#38BDF8!important;box-shadow:inset 0 0 0 1px rgba(56,189,248,.42)!important}' +\n",
    "      '.exercise-user-option[data-user=\"maja\"].active{background:rgba(244,114,182,.15)!important;color:#F472B6!important;box-shadow:inset 0 0 0 1px rgba(244,114,182,.46)!important}';"
]:
    if old not in text:
        raise SystemExit('auth-gate profile override not found')
# Second line terminates the concatenation, so chart-card becomes the terminator.
text = text.replace("      '.chart-card h3{color:#CFFAFE!important;text-shadow:0 2px 10px rgba(34,211,238,.08)!important}' +\n      '.exercise-user-option[data-user=\"markus\"].active{background:rgba(56,189,248,.14)!important;color:#38BDF8!important;box-shadow:inset 0 0 0 1px rgba(56,189,248,.42)!important}' +\n      '.exercise-user-option[data-user=\"maja\"].active{background:rgba(244,114,182,.15)!important;color:#F472B6!important;box-shadow:inset 0 0 0 1px rgba(244,114,182,.46)!important}';",
                    "      '.chart-card h3{color:#CFFAFE!important;text-shadow:0 2px 10px rgba(34,211,238,.08)!important}';", 1)
write(path, text)

path = 'budget/exercise-shell-v13.js'
text = read(path)
text = sub_once(text, r"\n      \.exercise-user-option\[data-user=\"markus\"\]\.active\{[^\n]+\}\n      \.exercise-user-option\[data-user=\"maja\"\]\.active\{[^\n]+\}\n", "\n", 'shell profile override cleanup')
write(path, text)

path = 'budget/exercise-builder-between-preview-v7.js'
text = read(path)
text = sub_once(text, r"\n      /\* Exercise profile switch: Markus stays blue; Maja gets her own pink active state\. \*/\n      \.exercise-user-option\[data-user=\"markus\"\]\.active\{[^\n]+\}\n      \.exercise-user-option\[data-user=\"maja\"\]\.active\{[^\n]+\}\n", "\n", 'builder profile override cleanup')
write(path, text)

# Bump the loader version so the cleaned active layers cannot remain cached.
path = 'budget/auth-config.js'
text = read(path)
text = replace_once(text, "  var exerciseFastVersion = '20260915-cp5-identity';", "  var exerciseFastVersion = '20260916-wellness-shell-3';", 'auth config fast version')
text = sub_once(text, r"shellScript\.src = 'exercise-shell-v13\.js\?v=[^']+';", "shellScript.src = 'exercise-shell-v13.js?v=20260916-wellness-shell-3';", 'shell asset cache')
write(path, text)

# --- Production cache references -------------------------------------------------
path = 'budget/exercise.html'
text = read(path)
text = replace_once(text, 'auth-config.js?v=20260915-cp5-identity', 'auth-config.js?v=20260916-wellness-shell-3', 'exercise auth-config cache')
text = replace_once(text, 'auth-gate.js?v=20260915-cp5-identity', 'auth-gate.js?v=20260916-wellness-shell-3', 'exercise auth-gate cache')
text = replace_once(text, 'firebase-sync.js?v=20260916-profile-toggle-compact-1', 'firebase-sync.js?v=20260916-profile-theme-2', 'exercise profile cache')
text = replace_once(text, 'training-zen-nav.css?v=20260916-main-cp8-zen-border-2', 'training-zen-nav.css?v=20260916-main-cp8-shared-scene-1', 'exercise wellness css cache')
text = replace_once(text, 'training-zen-nav.js?v=20260916-main-cp8-unified-tabs-1', 'training-zen-nav.js?v=20260916-main-cp8-shared-scene-1', 'exercise wellness js cache')
write(path, text)

path = 'budget/zen.html'
text = read(path)
text = replace_once(text, 'training-zen-nav.css?v=20260916-main-cp8-zen-border-2', 'training-zen-nav.css?v=20260916-main-cp8-shared-scene-1', 'zen wellness css cache')
text = replace_once(text, 'training-zen-nav.js?v=20260916-main-cp8-unified-tabs-1', 'training-zen-nav.js?v=20260916-main-cp8-shared-scene-1', 'zen wellness js cache')
write(path, text)

# --- Regression tests -------------------------------------------------------------
wellness_test = r'''const test=require('node:test');
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
const firebaseSync=read('firebase-sync.js');
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

test('Training stays mounted while Zen uses one shared header and one separate background layer',()=>{
  assert.match(shell,/trainingMain\.hidden=zen/);
  assert.match(shell,/zenHost\.hidden=!zen/);
  assert.match(shell,/zenBackdrop\.hidden=!zen/);
  assert.match(shell,/wellness-zen-tools/);
  assert.match(shell,/id="settings-open"/);
  assert.match(shellCss,/\.wellness-zen-backdrop\{/);
  assert.match(shellCss,/\.wellness-zen-backdrop\[hidden\]/);
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

test('one persistent three-mode switch owns the same position for Training Stretch and Meditation',()=>{
  assert.match(shell,/function ensureSharedSwitch\(\)/);
  assert.match(shell,/header\.insertAdjacentElement\('afterend',nav\)/);
  assert.match(shell,/data-wellness-destination="training"/);
  assert.match(shell,/data-wellness-destination="stretch"/);
  assert.match(shell,/data-wellness-destination="meditation"/);
  assert.match(shellCss,/\.wellness-kind-switch\{/);
  assert.match(shellCss,/#wellness-zen-surface \.kind-switch\{display:none!important\}/);
  assert.match(zen,/data-wellness-destination="training"/);
  assert.match(zen,/data-kind="stretch"/);
  assert.match(zen,/data-kind="meditation"/);
  assert.doesNotMatch(shell,/ensureTrainingSwitch|trainingSwitch/);
});

test('Zen scene begins at the app top behind both header and shared switch',()=>{
  assert.match(shell,/zenBackdrop\.classList\.add\('wellness-zen-backdrop'\)/);
  assert.match(shellCss,/\.wellness-zen-backdrop\{position:absolute!important;inset:0 0 auto!important/);
  assert.match(shellCss,/html\[data-wellness-mode="zen"\] #pulse-header\{background:transparent!important/);
  assert.match(shellCss,/html\[data-wellness-mode="zen"\] \.wellness-kind-switch\{z-index:30\}/);
});

test('profile selector follows the active page theme instead of user-specific cyan and pink',()=>{
  assert.match(firebaseSync,/#exercise-user-toggle \.exercise-user-option\.active/);
  assert.match(firebaseSync,/var\(--profile-accent,var\(--accent\)\)/);
  assert.match(shellCss,/#exercise-user-toggle\{--profile-accent:#ff9bb2/);
  assert.match(shellCss,/body\[data-kind="stretch"\] #exercise-user-toggle\{--profile-accent:#d4eea7/);
  assert.match(shellCss,/body\[data-kind="meditation"\] #exercise-user-toggle\{--profile-accent:#244739/);
  for(const source of [authGate,shellV13,builderV7]){
    assert.doesNotMatch(source,/exercise-user-option\[data-user="(?:markus|maja)"\]\.active/);
  }
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

test('profile query and intentional browser history survive unified switching',()=>{
  assert.match(shell,/url\.searchParams\.set\('wellness',destination\)/);
  assert.match(shell,/url\.searchParams\.delete\('wellness'\)/);
  assert.match(shell,/history\.pushState/);
  assert.match(shell,/addEventListener\('popstate'/);
  assert.match(shell,/get\('user'\)===['"]maja['"]/);
});

test('production pages cache-bust the shared scene and navigation owners',()=>{
  assert.match(exercise,/training-zen-nav\.css\?v=20260916-main-cp8-shared-scene-1/);
  assert.match(exercise,/training-zen-nav\.js\?v=20260916-main-cp8-shared-scene-1/);
  assert.match(exercise,/firebase-sync\.js\?v=20260916-profile-theme-2/);
  assert.match(exercise,/auth-config\.js\?v=20260916-wellness-shell-3/);
  assert.match(exercise,/auth-gate\.js\?v=20260916-wellness-shell-3/);
  assert.match(zen,/training-zen-nav\.css\?v=20260916-main-cp8-shared-scene-1/);
  assert.match(zen,/training-zen-nav\.js\?v=20260916-main-cp8-shared-scene-1/);
});
'''
write('budget/tests/training-wellness-shell.test.cjs', wellness_test)

path = 'budget/tests/training-observatory-identity.test.cjs'
text = read(path)
text = text.replace('20260915-cp5-identity', '20260916-wellness-shell-3')
text = text.replace("CP5 cache keys force Safari to receive the retired-header ownership change", "boot cache keys keep the current shared wellness ownership fresh")
write(path, text)

# Final structural assertions before tests.
for path in ['budget/auth-gate.js','budget/exercise-shell-v13.js','budget/exercise-builder-between-preview-v7.js']:
    source = read(path)
    if re.search(r'exercise-user-option\[data-user="(?:markus|maja)"\]\.active', source):
        raise SystemExit(f'user-specific profile color remains in {path}')

shell = read('budget/training-zen-nav.js')
if "header.insertAdjacentElement('afterend',nav)" not in shell:
    raise SystemExit('shared nav was not moved after the header')
if "wrap.insertBefore(zenBackdrop,wrap.firstChild)" not in shell:
    raise SystemExit('Zen landscape was not moved to the app top')

print('CP8 shared scene/header migration applied cleanly')
