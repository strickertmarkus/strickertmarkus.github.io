from pathlib import Path

root = Path('.')

css = r'''.wellness-kind-switch{display:inline-flex;align-items:center;gap:28px;margin:0 0 35px;border-bottom:1px solid rgba(255,184,208,.20);font-family:Inter,system-ui,sans-serif;position:relative;z-index:24}
.wellness-kind-switch button{position:relative;appearance:none;-webkit-appearance:none;display:flex;align-items:center;gap:10px;min-height:44px;padding:8px 3px 14px;border:0;border-radius:0;background:none;color:#a896a5;font:500 13px/1.25 Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap;touch-action:manipulation;transition:color .3s,text-shadow .3s}
.wellness-kind-switch button span{font-size:27px;line-height:1;font-weight:400}
.wellness-kind-switch button:hover{color:#eadde3}
.wellness-kind-switch button:focus-visible{outline:2px solid #ff9bb2;outline-offset:5px}
.wellness-kind-switch button[aria-pressed="true"]{color:#ff9bb2;text-shadow:0 0 25px rgba(255,98,142,.42)}
.wellness-kind-switch button:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:1px;background:#ff9bb2;box-shadow:0 0 12px #ff9bb2;transform:scaleX(0);transform-origin:center;transition:transform .55s cubic-bezier(.16,1,.3,1)}
.wellness-kind-switch button[aria-pressed="true"]:after{transform:scaleX(1)}
.wellness-mode-notice{position:absolute;left:50%;top:calc(100% + 9px);transform:translateX(-50%);width:max-content;max-width:min(330px,82vw);padding:8px 11px;border:1px solid #e8c7a22b;border-radius:10px;background:#161a1eea;color:#eadfd6;font-size:10px;font-weight:500;line-height:1.35;box-shadow:0 10px 28px #0007;z-index:1200}

/* The integrated Zen state intentionally mirrors the original standalone Zen header. */
.wellness-zen-brand{display:flex;align-items:center;gap:12px;flex:1;min-width:0;color:#edf4dc;text-decoration:none;font-family:"Cormorant Garamond",Georgia,serif;font-size:37px;font-weight:400;line-height:1}
.wellness-zen-brand[hidden],.wellness-zen-tools[hidden]{display:none!important}
.wellness-zen-brand>span:first-child{font-family:"DM Sans",system-ui,sans-serif;font-size:48px;font-weight:300;color:#d4eea7;text-shadow:0 0 25px #c0f39699}
.wellness-zen-brand small{display:block;margin-top:7px;color:#b4c6af;font:8px Manrope,"DM Sans",system-ui,sans-serif;letter-spacing:2px}
.wellness-zen-tools{display:flex;align-items:center;justify-content:flex-end;flex:0 0 auto;color:#b4c6af;font:500 11px/1.2 Manrope,Inter,system-ui,sans-serif}
.wellness-zen-tools .icon-button{display:grid;place-items:center;width:44px;height:44px;min-width:44px;min-height:44px;padding:0;border:1px solid #b2d69626;border-radius:50%;background:transparent;color:#edf4dc;font-size:27px;line-height:1}
.wellness-zen-tools .icon-button:hover{background:#d4eea71a}

.wellness-zen-surface{position:relative;isolation:isolate;min-height:100vh;view-transition-name:wellness-surface}
#pulse-home{view-transition-name:wellness-surface}
html[data-wellness-mode="zen"] #pulse-header{background:transparent!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;border:0!important;box-shadow:none!important;position:relative!important;top:auto!important;height:108px!important;min-height:108px!important;max-width:1440px;margin:0 auto!important;padding:0 5.5%!important;display:flex!important;align-items:center!important;gap:24px!important}
html[data-wellness-mode="zen"] #pulse-header .brand{position:static!important;left:auto!important;top:auto!important;transform:none!important;width:auto!important;max-width:none!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;flex:1!important;min-width:0!important}
html[data-wellness-mode="zen"] #pulse-header .wellness-zen-tools{margin-left:auto!important;flex:0 0 auto!important}
.wellness-surface-enter{animation:wellnessSurfaceIn .22s cubic-bezier(.16,1,.3,1)}
@keyframes wellnessSurfaceIn{from{opacity:0;transform:translateY(5px) scale(.996)}to{opacity:1;transform:none}}
::view-transition-old(wellness-surface){animation:wellnessSurfaceOld .18s cubic-bezier(.4,0,.2,1)}
::view-transition-new(wellness-surface){animation:wellnessSurfaceNew .24s cubic-bezier(.16,1,.3,1)}
@keyframes wellnessSurfaceOld{to{opacity:0;transform:scale(.997) translateY(-3px)}}
@keyframes wellnessSurfaceNew{from{opacity:0;transform:scale(.997) translateY(4px)}}

@media(max-width:760px){
  .wellness-kind-switch{gap:18px;max-width:100%;margin-bottom:28px}
  .wellness-kind-switch button{gap:7px;font-size:12px;padding-inline:1px}
  .wellness-kind-switch button span{font-size:23px}
  #wellness-zen-surface .kind-switch{gap:18px;max-width:100%;margin-bottom:28px}
  #wellness-zen-surface .kind-switch button{gap:7px;font-size:12px;padding-inline:1px}
  #wellness-zen-surface .kind-switch button span{font-size:23px}
  html[data-wellness-mode="zen"] #pulse-header{height:92px!important;min-height:92px!important;gap:12px!important;padding:0 6%!important}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand{gap:6px;flex:0 1 auto;font-size:30px;line-height:1}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand>span:first-child{font-size:35px}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand small{display:none}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-tools{margin-left:auto!important}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-tools .icon-button{width:36px;height:36px;min-width:36px;min-height:36px;border:0;font-size:24px}
}
@media(max-width:390px){
  .wellness-kind-switch,#wellness-zen-surface .kind-switch{gap:11px;width:100%;justify-content:space-between}
  .wellness-kind-switch button,#wellness-zen-surface .kind-switch button{gap:5px;font-size:11px}
  .wellness-kind-switch button span,#wellness-zen-surface .kind-switch button span{font-size:21px}
  html[data-wellness-mode="zen"] #pulse-header{gap:8px!important;padding-inline:5.5%!important}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand{font-size:28px}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand>span:first-child{font-size:32px}
}
@media(prefers-reduced-motion:reduce){
  .wellness-kind-switch button,.wellness-kind-switch button:after,.wellness-surface-enter{transition:none!important;animation:none!important}
  ::view-transition-old(wellness-surface),::view-transition-new(wellness-surface){animation:none!important}
}
'''
(root / 'budget/training-zen-nav.css').write_text(css, encoding='utf-8')

firebase_path = root / 'budget/firebase-sync.js'
firebase = firebase_path.read_text(encoding='utf-8')
old_toggle = '''    .exercise-user-toggle {
      display:flex;
      align-items:center;
      flex-shrink:0;
      padding:3px;
      gap:2px;
      border:1px solid var(--border);
      border-radius:10px;
      background:rgba(255,255,255,.035);
    }
    .exercise-user-option {
      border:0;
      background:transparent;
      color:var(--text-sec);
      border-radius:7px;
      padding:5px 9px;
      font:600 11px/1.2 'Inter',sans-serif;
      cursor:pointer;
      transition:background .15s,color .15s;
    }'''
new_toggle = '''    .exercise-user-toggle {
      display:flex;
      align-items:center;
      flex-shrink:0;
      height:30px;
      max-height:30px;
      padding:2px;
      gap:1px;
      border:1px solid var(--border);
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
      color:var(--text-sec);
      border-radius:7px;
      padding:0 8px !important;
      font:600 10px/1 'Inter',sans-serif;
      cursor:pointer;
      transition:background .15s,color .15s;
    }'''
if old_toggle not in firebase:
    raise SystemExit('exercise profile toggle owner not found')
firebase = firebase.replace(old_toggle, new_toggle, 1)
old_mobile = "      .exercise-user-option { padding:5px 7px; font-size:10px; }"
new_mobile = "      .exercise-user-option { min-height:24px !important; height:24px !important; padding:0 7px !important; font-size:9px !important; }"
if old_mobile not in firebase:
    raise SystemExit('mobile exercise profile toggle owner not found')
firebase = firebase.replace(old_mobile, new_mobile, 1)
firebase_path.write_text(firebase, encoding='utf-8')

exercise_path = root / 'budget/exercise.html'
exercise = exercise_path.read_text(encoding='utf-8')
exercise = exercise.replace('training-zen-nav.css?v=20260916-main-cp8-zen-border-2','training-zen-nav.css?v=20260916-main-cp8-zen-header-restore-1',1)
exercise = exercise.replace('<script src="firebase-sync.js"></script>','<script src="firebase-sync.js?v=20260916-profile-toggle-compact-1"></script>',1)
exercise_path.write_text(exercise, encoding='utf-8')

zen_path = root / 'budget/zen.html'
zen = zen_path.read_text(encoding='utf-8')
zen = zen.replace('training-zen-nav.css?v=20260916-main-cp8-zen-border-2','training-zen-nav.css?v=20260916-main-cp8-zen-header-restore-1',1)
zen_path.write_text(zen, encoding='utf-8')

test_path = root / 'budget/tests/training-wellness-shell.test.cjs'
test = test_path.read_text(encoding='utf-8')
test = test.replace("const store=read('zen-store.js');", "const store=read('zen-store.js');\nconst firebase=read('firebase-sync.js');", 1)
old_test = '''test('Zen shared header removes the inherited Training divider',()=>{
  assert.match(shellCss,/html\\[data-wellness-mode=\\"zen\\"\\] #pulse-header\\{[^}]*border-bottom:0!important/);
  assert.doesNotMatch(shellCss,/html\\[data-wellness-mode=\\"zen\\"\\] #pulse-header\\{[^}]*border-bottom-color:/);
});'''
new_test = '''test('Zen shared header restores the original transparent Zen composition',()=>{
  assert.match(shellCss,/html\\[data-wellness-mode=\\"zen\\"\\] #pulse-header\\{[^}]*background:transparent!important[^}]*backdrop-filter:none!important[^}]*border:0!important[^}]*box-shadow:none!important[^}]*height:108px!important/);
  assert.match(shellCss,/@media\\(max-width:760px\\)\\{[\\s\\S]*#pulse-header\\{height:92px!important;min-height:92px!important/);
  assert.match(shellCss,/wellness-zen-brand>span:first-child\\{[^}]*font-size:48px/);
  assert.match(shellCss,/#pulse-header \\.wellness-zen-brand small\\{display:none\\}/);
  assert.doesNotMatch(shellCss,/background:rgba\\(7,27,23,\\.86\\)!important/);
});

test('exercise profile toggle stays compact in Training and Zen',()=>{
  assert.match(firebase,/\\.exercise-user-toggle \\{[\\s\\S]*height:30px;[\\s\\S]*padding:2px;/);
  assert.match(firebase,/\\.exercise-user-option \\{[\\s\\S]*min-height:26px !important;[\\s\\S]*height:26px !important;/);
  assert.match(firebase,/@media\\(max-width:430px\\)[\\s\\S]*height:24px !important;/);
  assert.match(exercise,/firebase-sync\\.js\\?v=20260916-profile-toggle-compact-1/);
});'''
if old_test not in test:
    raise SystemExit('old Zen header regression test not found')
test = test.replace(old_test, new_test, 1)
test = test.replace('training-zen-nav\\.css\\?v=20260916-main-cp8-zen-border-2','training-zen-nav\\.css\\?v=20260916-main-cp8-zen-header-restore-1')
test_path.write_text(test, encoding='utf-8')
