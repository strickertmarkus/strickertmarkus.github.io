from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,text): (ROOT/path).write_text(text,encoding='utf-8')
def one(text,old,new,label):
    n=text.count(old)
    if n!=1: raise SystemExit(f'{label}: expected 1 exact match, found {n}')
    return text.replace(old,new,1)
def sub(text,pattern,repl,label,flags=0):
    out,n=re.subn(pattern,repl,text,count=1,flags=flags)
    if n!=1: raise SystemExit(f'{label}: expected 1 regex match, found {n}')
    return out

# Shared shell: one persistent mode switch + Zen landscape promoted to app background.
p='budget/training-zen-nav.js'; s=read(p)
s=one(s,
"var zenHost=null,zenLoadPromise=null,zenDocumentPromise=null,zenPreloadStarted=false,zenStyleLinks=[],zenTools=null,zenBrand=null,trainingSwitch=null;",
"var zenHost=null,zenBackdrop=null,zenLoadPromise=null,zenDocumentPromise=null,zenPreloadStarted=false,zenStyleLinks=[],zenTools=null,zenBrand=null,sharedSwitch=null;",'shell state')
shared_switch="""  function ensureSharedSwitch(){
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
s=sub(s,r"  function ensureTrainingSwitch\(\)\{.*?\n  \}\n(?=  function updateUnifiedSwitch)",shared_switch,'shared switch',re.S)
extract="""  function extractZenSurface(doc){
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
s=sub(s,r"  function extractZenSurface\(doc\)\{.*?\n  \}\n(?=  function ensureZenLoaded)",extract,'Zen surface extraction',re.S)
s=one(s,"    }).catch(function(error){zenLoadPromise=null;if(zenHost){zenHost.remove();zenHost=null;}throw error;});","    }).catch(function(error){zenLoadPromise=null;if(zenHost){zenHost.remove();zenHost=null;}if(zenBackdrop){zenBackdrop.remove();zenBackdrop=null;}throw error;});",'Zen cleanup')
s=one(s,"    if(zenHost)zenHost.hidden=!zen;\n    if(zenTools)zenTools.hidden=!zen;","    if(zenHost)zenHost.hidden=!zen;\n    if(zenBackdrop)zenBackdrop.hidden=!zen;\n    if(zenTools)zenTools.hidden=!zen;",'Zen backdrop visibility')
s=one(s,'var nav=ensureTrainingSwitch();','var nav=ensureSharedSwitch();','shared switch init')
if 'trainingSwitch' in s: raise SystemExit('obsolete trainingSwitch remains')
write(p,s)

# Shared nav/theme CSS. Same DOM nav = exact same position in all three modes.
css='''.wellness-kind-switch{--wellness-accent:#ff9bb2;--wellness-accent-glow:rgba(255,98,142,.42);--wellness-muted:#a896a5;--wellness-line:rgba(255,184,208,.20);display:flex;align-items:center;gap:28px;width:min(90%,1100px);max-width:1100px;margin:0 auto;padding-top:18px;border-bottom:1px solid var(--wellness-line);font-family:Inter,system-ui,sans-serif;position:relative;z-index:24}
.wellness-kind-switch button{position:relative;appearance:none;-webkit-appearance:none;display:flex;align-items:center;gap:10px;min-height:44px;padding:8px 3px 14px;border:0;border-radius:0;background:none;color:var(--wellness-muted);font:500 13px/1.25 Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap;touch-action:manipulation;transition:color .3s,text-shadow .3s}
.wellness-kind-switch button span{font-size:27px;line-height:1;font-weight:400}
.wellness-kind-switch button:hover{color:var(--wellness-accent)}
.wellness-kind-switch button:focus-visible{outline:2px solid var(--wellness-accent);outline-offset:5px}
.wellness-kind-switch button[aria-pressed="true"]{color:var(--wellness-accent);text-shadow:0 0 25px var(--wellness-accent-glow)}
.wellness-kind-switch button:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:1px;background:var(--wellness-accent);box-shadow:0 0 12px var(--wellness-accent);transform:scaleX(0);transform-origin:center;transition:transform .55s cubic-bezier(.16,1,.3,1)}
.wellness-kind-switch button[aria-pressed="true"]:after{transform:scaleX(1)}
.wellness-mode-notice{position:absolute;left:50%;top:calc(100% + 9px);transform:translateX(-50%);width:max-content;max-width:min(330px,82vw);padding:8px 11px;border:1px solid #e8c7a22b;border-radius:10px;background:#161a1eea;color:#eadfd6;font-size:10px;font-weight:500;line-height:1.35;box-shadow:0 10px 28px #0007;z-index:1200}
html[data-wellness-mode="zen"] body[data-kind="stretch"] .wellness-kind-switch{--wellness-accent:#d4eea7;--wellness-accent-glow:rgba(192,243,150,.38);--wellness-muted:#b4c6af;--wellness-line:#b2d69626}
html[data-wellness-mode="zen"] body[data-kind="meditation"] .wellness-kind-switch{--wellness-accent:#244739;--wellness-accent-glow:rgba(43,100,82,.25);--wellness-muted:#5c716b;--wellness-line:#627e6530}

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
write('budget/training-zen-nav.css',css)

# Profile toggle uses page-theme tokens instead of user-specific colors.
p='budget/firebase-sync.js'; s=read(p)
profile="""    .exercise-user-toggle {
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
s=sub(s,r"    \.exercise-user-toggle \{.*?    \.exercise-user-option\.active \{.*?    \}\n",profile,'profile CSS',re.S); write(p,s)

# Remove obsolete per-user active colors from active training layers.
p='budget/auth-gate.js'; s=read(p)
s=sub(s,r"(      '\.chart-card h3\{[^\n]+\}') \+\n      '\.exercise-user-option\[data-user=\"markus\"\]\.active\{[^\n]+\}' \+\n      '\.exercise-user-option\[data-user=\"maja\"\]\.active\{[^\n]+\}';",r"\1;",'auth gate profile colors')
s=sub(s,r"var exerciseAssetsVersion = '[^']+';","var exerciseAssetsVersion = '20260916-wellness-shell-3';",'auth gate cache'); write(p,s)
p='budget/exercise-shell-v13.js'; s=read(p); s=sub(s,r"\n      \.exercise-user-option\[data-user=\"markus\"\]\.active\{[^\n]+\}\n      \.exercise-user-option\[data-user=\"maja\"\]\.active\{[^\n]+\}\n","\n",'shell profile colors'); write(p,s)
p='budget/exercise-builder-between-preview-v7.js'; s=read(p); s=sub(s,r"\n      /\* Exercise profile switch: Markus stays blue; Maja gets her own pink active state\. \*/\n      \.exercise-user-option\[data-user=\"markus\"\]\.active\{[^\n]+\}\n      \.exercise-user-option\[data-user=\"maja\"\]\.active\{[^\n]+\}\n","\n",'builder profile colors'); write(p,s)

# Bump active loader/cache owners so Safari cannot retain the removed color rules.
p='budget/auth-config.js'; s=read(p)
s=sub(s,r"var exerciseFastVersion = '[^']+';","var exerciseFastVersion = '20260916-wellness-shell-3';",'fast version')
s=sub(s,r"shellScript\.src = 'exercise-shell-v13\.js\?v=[^']+';","shellScript.src = 'exercise-shell-v13.js?v=20260916-wellness-shell-3';",'shell cache'); write(p,s)
p='budget/exercise.html'; s=read(p)
for pat,repl,label in [
(r'auth-config\.js\?v=[^"\s]+','auth-config.js?v=20260916-wellness-shell-3','exercise auth-config'),
(r'auth-gate\.js\?v=[^"\s]+','auth-gate.js?v=20260916-wellness-shell-3','exercise auth-gate'),
(r'firebase-sync\.js\?v=[^"\s]+','firebase-sync.js?v=20260916-profile-theme-2','exercise firebase'),
(r'training-zen-nav\.css\?v=[^"\s]+','training-zen-nav.css?v=20260916-main-cp8-shared-scene-1','exercise wellness css'),
(r'training-zen-nav\.js\?v=[^"\s]+','training-zen-nav.js?v=20260916-main-cp8-shared-scene-1','exercise wellness js')]: s=sub(s,pat,repl,label)
write(p,s)
p='budget/zen.html'; s=read(p)
s=sub(s,r'training-zen-nav\.css\?v=[^"\s]+','training-zen-nav.css?v=20260916-main-cp8-shared-scene-1','zen wellness css')
s=sub(s,r'training-zen-nav\.js\?v=[^"\s]+','training-zen-nav.js?v=20260916-main-cp8-shared-scene-1','zen wellness js'); write(p,s)

# Regression tests track the new single nav/backdrop/theme ownership.
p='budget/tests/training-wellness-shell.test.cjs'; s=read(p)
s=one(s,"const firebase=read('firebase-sync.js');","const firebase=read('firebase-sync.js');\nconst authGate=read('auth-gate.js');\nconst shellV13=read('exercise-shell-v13.js');\nconst builderV7=read('exercise-builder-between-preview-v7.js');",'test sources')
s=one(s,"  assert.match(shell,/\\['\\.landscape','#zen-main'\\]/);","  assert.match(shell,/zenBackdrop=document\\.importNode\\(landscape,true\\)/);\n  assert.match(shell,/wrap\\.insertBefore\\(zenBackdrop,wrap\\.firstChild\\)/);",'backdrop test')
s=one(s,"test('Training stays mounted while Zen is toggled and the shared header has one Zen settings control',()=>{\n  assert.match(shell,/trainingMain\\.hidden=zen/);\n  assert.match(shell,/zenHost\\.hidden=!zen/);","test('Training stays mounted while Zen uses one shared header and separate scene background',()=>{\n  assert.match(shell,/trainingMain\\.hidden=zen/);\n  assert.match(shell,/zenHost\\.hidden=!zen/);\n  assert.match(shell,/zenBackdrop\\.hidden=!zen/);",'backdrop visibility test')
s=one(s,"test('one three-mode switch replaces the old Training Zen pill',()=>{\n  assert.match(shell,/function ensureTrainingSwitch\\(\\)/);","test('one persistent three-mode switch owns the same position in Training Stretch and Meditation',()=>{\n  assert.match(shell,/function ensureSharedSwitch\\(\\)/);\n  assert.match(shell,/header\\.insertAdjacentElement\\('afterend',nav\\)/);",'shared switch test')
s=one(s,"  assert.doesNotMatch(shell,/className='wellness-nav'/);","  assert.doesNotMatch(shell,/className='wellness-nav'/);\n  assert.match(shellCss,/#wellness-zen-surface \\.kind-switch\\{display:none!important\\}/);\n  assert.doesNotMatch(shell,/ensureTrainingSwitch|trainingSwitch/);",'hidden runtime switch test')
s=one(s,"test('exercise profile toggle stays compact in Training and Zen',()=>{","test('exercise profile toggle stays compact and follows the active page theme',()=>{")
s=one(s,"  assert.match(exercise,/firebase-sync\\.js\\?v=20260916-profile-toggle-compact-1/);","  assert.match(firebase,/#exercise-user-toggle \\.exercise-user-option\\.active/);\n  assert.match(shellCss,/#exercise-user-toggle\\{--profile-accent:#ff9bb2/);\n  assert.match(shellCss,/body\\[data-kind=\"stretch\"\\] #exercise-user-toggle\\{--profile-accent:#d4eea7/);\n  assert.match(shellCss,/body\\[data-kind=\"meditation\"\\] #exercise-user-toggle\\{--profile-accent:#244739/);\n  for(const source of [authGate,shellV13,builderV7]) assert.doesNotMatch(source,/exercise-user-option\\[data-user=\"(?:markus|maja)\"\\]\\.active/);\n  assert.match(exercise,/firebase-sync\\.js\\?v=20260916-profile-theme-2/);",'profile theme test')
s=sub(s,r"test\('production pages cache-bust the unified CP8 controller',\(\)=>\{.*?\n\}\);",'''test('production pages cache-bust the shared wellness owners',()=>{
  for(const source of [exercise,zen]){
    assert.match(source,/training-zen-nav\\.css\\?v=20260916-main-cp8-shared-scene-1/);
    assert.match(source,/training-zen-nav\\.js\\?v=20260916-main-cp8-shared-scene-1/);
  }
  assert.match(exercise,/auth-config\\.js\\?v=20260916-wellness-shell-3/);
  assert.match(exercise,/auth-gate\\.js\\?v=20260916-wellness-shell-3/);
  assert.match(exercise,/training-overview-mode\\.js\\?v=20260916-main-cp8-header-toggle-1/);
});''','cache test',re.S)
# Add explicit scene-at-top assertion after restored-header test.
needle="  assert.doesNotMatch(shellCss,/background:rgba\\(7,27,23,\\.86\\)!important/);\n});"
replacement=needle+"\n\ntest('Zen landscape begins at the app top behind header and shared toggle',()=>{\n  assert.match(shell,/zenBackdrop\\.classList\\.add\\('wellness-zen-backdrop'\\)/);\n  assert.match(shellCss,/\\.wellness-zen-backdrop\\{position:absolute!important;inset:0 0 auto!important/);\n  assert.match(shellCss,/html\\[data-wellness-mode=\"zen\"\\] #pulse-header\\{background:transparent!important/);\n  assert.match(shellCss,/html\\[data-wellness-mode=\"zen\"\\] \\.wellness-kind-switch\\{z-index:30\\}/);\n});"
s=one(s,needle,replacement,'scene top test')
write(p,s)

p='budget/tests/training-observatory-identity.test.cjs'; s=read(p)
s=s.replace('20260915-cp5-identity','20260916-wellness-shell-3')
s=s.replace('CP5 cache keys force Safari to receive the retired-header ownership change','boot cache keys keep the current shared wellness ownership fresh'); write(p,s)

# Final ownership guard.
for f in ['budget/auth-gate.js','budget/exercise-shell-v13.js','budget/exercise-builder-between-preview-v7.js']:
    if re.search(r'exercise-user-option\[data-user="(?:markus|maja)"\]\.active',read(f)): raise SystemExit('old profile owner remains in '+f)
if "header.insertAdjacentElement('afterend',nav)" not in read('budget/training-zen-nav.js'): raise SystemExit('shared switch not after header')
if 'wrap.insertBefore(zenBackdrop,wrap.firstChild)' not in read('budget/training-zen-nav.js'): raise SystemExit('Zen backdrop not at app top')
print('CP8 shared Zen scene migration applied')
