from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding="utf-8")

def write(path, text):
    (ROOT / path).write_text(text, encoding="utf-8")

def one(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)

path = "budget/training-zen-nav.js"
text = read(path)
old_switch = '''  function switchMarkup(){
    return '<button type="button" data-wellness-destination="training" aria-pressed="false"><span aria-hidden="true">⌁</span> Träning</button>'+
      '<button type="button" data-wellness-destination="stretch" aria-pressed="false"><span aria-hidden="true">✧</span> Stretch</button>'+
      '<button type="button" data-wellness-destination="meditation" aria-pressed="false"><span aria-hidden="true">≈</span> Meditation</button>'+
      '<span class="wellness-mode-notice" role="status" aria-live="polite" hidden></span>';
  }
'''
new_switch = '''  function switchMarkup(){
    return '<div class="wellness-kind-options">'+
      '<button type="button" data-wellness-destination="training" aria-pressed="false"><span aria-hidden="true">⌁</span> Träning</button>'+
      '<button type="button" data-wellness-destination="stretch" aria-pressed="false"><span aria-hidden="true">✧</span> Stretch</button>'+
      '<button type="button" data-wellness-destination="meditation" aria-pressed="false"><span aria-hidden="true">≈</span> Meditation</button>'+
      '</div>'+
      '<span class="wellness-overview-slot"></span>'+
      '<span class="wellness-mode-notice" role="status" aria-live="polite" hidden></span>';
  }
'''
text = one(text, old_switch, new_switch, "switch markup")
text = one(text,
'''    nav.innerHTML=switchMarkup();
    header.insertAdjacentElement('afterend',nav);
    sharedSwitch=nav;
''',
'''    nav.innerHTML=switchMarkup();
    var overviewToggle=document.getElementById('training-overview-toggle');
    var overviewSlot=nav.querySelector('.wellness-overview-slot');
    if(overviewToggle&&overviewSlot)overviewSlot.appendChild(overviewToggle);
    header.insertAdjacentElement('afterend',nav);
    sharedSwitch=nav;
''', "overview relocation")
text = one(text,
'''  function finishSwitch(destination,options,token){
    if(token!==switchToken)return false;
    historyFor(destination,options.history||'push');
    requestAnimationFrame(function(){window.scrollTo(0,scrollPositions[mode]||0);});
    window.dispatchEvent(new CustomEvent('wellness-mode-change',{detail:{mode:mode,destination:destination}}));
    return true;
  }
''',
'''  function finishSwitch(destination,options,token){
    if(token!==switchToken)return false;
    historyFor(destination,options.history||'push');
    if(sharedSwitch)sharedSwitch.removeAttribute('aria-busy');
    requestAnimationFrame(function(){window.scrollTo(0,scrollPositions[mode]||0);});
    window.dispatchEvent(new CustomEvent('wellness-mode-change',{detail:{mode:mode,destination:destination}}));
    return true;
  }
''', "finish switch busy cleanup")
old_request = '''  function requestDestination(value,options){
    options=options||{};
    var destination=normalizeDestination(value);
    var nextMode=destination==='training'?'training':'zen';
    if(nextMode===mode&&!options.force){
      if(nextMode==='zen'&&destination!==zenKind){selectZenKind(destination);historyFor(destination,options.history||'push');}
      updateUnifiedSwitch(nextMode==='training'?'training':zenKind);
      return Promise.resolve(true);
    }
    if(!canLeave(nextMode))return Promise.resolve(false);
    var token=++switchToken;
    var ready=nextMode==='zen'?ensureZenLoaded():Promise.resolve();
    return ready.then(function(){
      if(token!==switchToken)return false;
      if(nextMode==='zen')selectZenKind(destination);
      return swap(nextMode).then(function(){return finishSwitch(destination,options,token);});
    }).catch(function(){setNotice('Läget kunde inte laddas. Försök igen.');return false;});
  }
'''
new_request = '''  function requestDestination(value,options){
    options=options||{};
    var destination=normalizeDestination(value);
    var nextMode=destination==='training'?'training':'zen';
    var token=++switchToken;
    if(nextMode===mode&&!options.force){
      if(nextMode==='zen'&&destination!==zenKind){selectZenKind(destination);historyFor(destination,options.history||'push');}
      updateUnifiedSwitch(nextMode==='training'?'training':zenKind);
      if(sharedSwitch)sharedSwitch.removeAttribute('aria-busy');
      return Promise.resolve(true);
    }
    if(!canLeave(nextMode)){
      updateUnifiedSwitch(mode==='zen'?zenKind:'training');
      if(sharedSwitch)sharedSwitch.removeAttribute('aria-busy');
      return Promise.resolve(false);
    }
    updateUnifiedSwitch(destination);
    if(sharedSwitch)sharedSwitch.setAttribute('aria-busy','true');
    var ready=nextMode==='zen'?ensureZenLoaded():Promise.resolve();
    return ready.then(function(){
      if(token!==switchToken)return false;
      if(nextMode==='zen')selectZenKind(destination);
      return swap(nextMode).then(function(){return finishSwitch(destination,options,token);});
    }).catch(function(){
      if(token===switchToken){
        if(sharedSwitch)sharedSwitch.removeAttribute('aria-busy');
        updateUnifiedSwitch(mode==='zen'?zenKind:'training');
        setNotice('Läget kunde inte laddas. Försök igen.');
      }
      return false;
    });
  }
'''
text = one(text, old_request, new_request, "request destination cancellation")
write(path, text)

path = "budget/training-zen-nav.css"
text = read(path)
text = one(text,
'.wellness-kind-switch{--wellness-accent:#ff9bb2;--wellness-accent-glow:rgba(255,98,142,.42);--wellness-muted:#a896a5;--wellness-line:rgba(255,184,208,.20);display:flex;align-items:center;gap:28px;width:min(90%,1100px);max-width:1100px;margin:0 auto;padding-top:18px;border-bottom:1px solid var(--wellness-line);font-family:Inter,system-ui,sans-serif;position:relative;z-index:24}\n',
'.wellness-kind-switch{--wellness-accent:#ff9bb2;--wellness-accent-glow:rgba(255,98,142,.42);--wellness-muted:#a896a5;--wellness-line:rgba(255,184,208,.20);display:grid;grid-template-columns:minmax(0,1fr) 42px;align-items:end;column-gap:14px;width:min(90%,1100px);max-width:1100px;margin:0 auto;padding-top:18px;border-bottom:1px solid var(--wellness-line);font-family:Inter,system-ui,sans-serif;position:relative;z-index:24}\n.wellness-kind-options{display:flex;align-items:center;gap:28px;min-width:0}\n.wellness-overview-slot{display:grid;place-items:center;width:42px;height:54px;padding-bottom:7px;justify-self:end;align-self:end}\n', "shared switch grid")
text = text.replace('.wellness-kind-switch button', '.wellness-kind-options button')
text = text.replace('.wellness-kind-switch button span', '.wellness-kind-options button span')
text = one(text,
'''@media(max-width:760px){
  .wellness-kind-switch{gap:18px;width:88%;max-width:none;padding-top:14px}
  .wellness-kind-options button{gap:7px;font-size:12px;padding-inline:1px}
  .wellness-kind-options button span{font-size:23px}
''',
'''@media(max-width:760px){
  .wellness-kind-switch{grid-template-columns:minmax(0,1fr) 40px;column-gap:12px;width:88%;max-width:none;padding-top:14px}
  .wellness-kind-options{gap:18px}
  .wellness-kind-options button{gap:7px;font-size:12px;padding-inline:1px}
  .wellness-kind-options button span{font-size:23px}
  .wellness-overview-slot{width:40px;height:52px;padding-bottom:6px}
''', "mobile shared row")
text = one(text,
'''@media(max-width:390px){
  .wellness-kind-switch{gap:11px;justify-content:space-between}
  .wellness-kind-options button{gap:5px;font-size:11px}
  .wellness-kind-options button span{font-size:21px}
''',
'''@media(max-width:390px){
  .wellness-kind-switch{grid-template-columns:minmax(0,1fr) 40px;column-gap:8px;width:calc(100% - 24px)}
  .wellness-kind-options{gap:7px;justify-content:space-between}
  .wellness-kind-options button{gap:5px;font-size:11px}
  .wellness-kind-options button span{font-size:21px}
''', "small mobile shared row")
write(path, text)

for path in ["budget/exercise.html", "budget/zen.html"]:
    text = read(path)
    text = one(text, "training-zen-nav.css?v=20260916-main-cp8-shared-scene-1", "training-zen-nav.css?v=20260916-main-cp8-toggle-align-1", f"{path} nav css cache")
    text = one(text, "training-zen-nav.js?v=20260916-main-cp8-shared-scene-1", "training-zen-nav.js?v=20260916-main-cp8-toggle-align-1", f"{path} nav js cache")
    write(path, text)

path = "budget/tests/training-wellness-shell.test.cjs"
text = read(path)
text = one(text,
'''test('one persistent three-mode switch owns the same position in Training Stretch and Meditation',()=>{
  assert.match(shell,/function ensureSharedSwitch\\(\\)/);
  assert.match(shell,/header\\.insertAdjacentElement\\('afterend',nav\\)/);
''',
'''test('one persistent three-mode switch owns the same position in Training Stretch and Meditation',()=>{
  assert.match(shell,/function ensureSharedSwitch\\(\\)/);
  assert.match(shell,/header\\.insertAdjacentElement\\('afterend',nav\\)/);
  assert.match(shell,/class="wellness-kind-options"/);
  assert.match(shell,/class="wellness-overview-slot"/);
  assert.match(shell,/overviewSlot\\.appendChild\\(overviewToggle\\)/);
  assert.match(shellCss,/grid-template-columns:minmax\\(0,1fr\\) 42px/);
  assert.match(shellCss,/\\.wellness-overview-slot\\{[^}]*width:42px[^}]*height:54px/);
''', "persistent switch assertions")
text = one(text, "test('Compact uses one header symbol toggle and no dashboard mode switch',()=>{", "test('Compact uses one right-side wellness-row symbol and no dashboard mode switch',()=>{", "compact test title")
text = one(text,
'''  assert.doesNotMatch(overviewCss,/training-overview-switch-shell/);
});
''',
'''  assert.doesNotMatch(overviewCss,/training-overview-switch-shell/);
  assert.match(shell,/overviewSlot\\.appendChild\\(overviewToggle\\)/);
  assert.match(overviewCss,/html\\[data-wellness-mode="zen"\\] #training-overview-toggle\\{display:none!important\\}/);
});
''', "compact right-side assertions")
anchor = "test('profile query and intentional browser history survive unified switching',()=>{\n"
new_test = '''test('rapid Training and Zen requests cancel stale pending transitions',()=>{
  const start=shell.indexOf('function requestDestination');
  const end=shell.indexOf('\\n\\n  if(directZen',start);
  const body=shell.slice(start,end);
  assert.ok(body.indexOf('var token=++switchToken;')>=0);
  assert.ok(body.indexOf('var token=++switchToken;')<body.indexOf('if(nextMode===mode&&!options.force)'));
  assert.match(body,/sharedSwitch\\.setAttribute\\('aria-busy','true'\\)/);
  assert.match(body,/token===switchToken/);
});

'''
text = one(text, anchor, new_test + anchor, "rapid switch regression")
text = text.replace("20260916-main-cp8-shared-scene-1", "20260916-main-cp8-toggle-align-1")
write(path, text)

path = "budget/TRAINING-OBSERVATORY-MIGRATION-CHECKLIST.md"
text = read(path)
old = "**CP8 navigation refinement (2026-09-16):** the temporary two-state `Träning / Zen` header pill has been retired. The user-facing mode control is now one three-state `Träning / Stretch / Meditation` switch in the content position formerly owned by Zen's `Stretch / Meditation` switch. Compact/Observatory is no longer a second content-row toggle; Compact is a single header symbol owned by `training-overview-mode.js`, highlighted only while Compact is active. The training hamburger and `Din profil` placeholder were removed from this shell."
new = "**CP8 navigation refinement (2026-09-16):** the temporary two-state `Träning / Zen` header pill has been retired. The user-facing mode control is one persistent three-state `Träning / Stretch / Meditation` switch shared by all three surfaces. The Compact/Observatory symbol remains owned by `training-overview-mode.js` but now sits in a reserved right-side slot on that same switch row; the slot remains present in Zen so the three mode buttons do not shift between Training, Stretch and Meditation. Rapid destination requests advance the shared switch token before same-mode handling so a stale pending Zen load cannot override a newer Training request. The training hamburger and `Din profil` placeholder remain removed."
text = one(text, old, new, "CP8 handoff note")
write(path, text)

shell = read("budget/training-zen-nav.js")
css = read("budget/training-zen-nav.css")
if shell.count("overviewSlot.appendChild(overviewToggle)") != 1:
    raise SystemExit("overview toggle relocation must have one owner")
request_start = shell.index("function requestDestination")
if shell.index("var token=++switchToken;", request_start) > shell.index("if(nextMode===mode&&!options.force)", request_start):
    raise SystemExit("switch token must advance before same-mode early return")
if "grid-template-columns:minmax(0,1fr) 42px" not in css:
    raise SystemExit("desktop stable overview slot missing")
if "grid-template-columns:minmax(0,1fr) 40px" not in css:
    raise SystemExit("mobile stable overview slot missing")
print("CP8 toggle alignment and stale-switch cancellation applied")
