from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]


def read(rel):
    return (root / rel).read_text(encoding='utf-8')


def write(rel, text):
    (root / rel).write_text(text, encoding='utf-8')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old, new, 1)

js_path = 'budget/training-zen-nav.js'
js = read(js_path)
pattern = re.compile(r"  function applyMode\(nextMode\)\{\n.*?\n  \}\n  function swap\(nextMode\)\{\n.*?\n  \}\n  function historyFor", re.S)
replacement = """  function applyMode(nextMode){
    var zen=nextMode==='zen';
    if(zen)toggleZenStyles(true);
    if(!zen){
      if(zenHost)zenHost.hidden=true;
      if(zenBackdrop)zenBackdrop.hidden=true;
    }
    document.documentElement.dataset.wellnessMode=nextMode;
    document.body.classList.toggle('wellness-zen-active',zen);
    trainingMain.hidden=zen;
    if(zen){
      if(zenHost)zenHost.hidden=false;
      if(zenBackdrop)zenBackdrop.hidden=false;
    }
    if(zenTools)zenTools.hidden=!zen;
    if(zenBrand)zenBrand.hidden=!zen;
    var trainingBrand=header&&header.querySelector('.brand-text');if(trainingBrand)trainingBrand.hidden=zen;
    var streak=header&&header.querySelector('.streak-badge');if(streak)streak.hidden=zen;
    if(!zen)toggleZenStyles(false);
    ensureThemeMeta().content=zen?(document.body.dataset.kind==='meditation'?'#a7c3bd':'#091d18'):trainingTheme;
    document.title=zen?'Zen · '+(zenKind==='meditation'?'Meditation':'Stretch'):trainingTitle;
    updateUnifiedSwitch(zen?zenKind:'training');
    mode=nextMode;
  }
  function swap(nextMode){
    scrollPositions[mode]=window.scrollY||0;
    applyMode(nextMode);
    if(reduced&&reduced.matches)return Promise.resolve();
    var target=nextMode==='zen'?zenHost:trainingMain;
    if(!target)return Promise.resolve();
    target.classList.remove('wellness-surface-enter');
    document.documentElement.classList.add('wellness-shell-switching');
    return new Promise(function(resolve){
      requestAnimationFrame(function(){
        target.classList.add('wellness-surface-enter');
        window.setTimeout(function(){
          document.documentElement.classList.remove('wellness-shell-switching');
          target.classList.remove('wellness-surface-enter');
          resolve();
        },200);
      });
    });
  }
  function historyFor"""
js, count = pattern.subn(replacement, js, count=1)
if count != 1:
    raise SystemExit(f'JS apply/swap owner: expected 1 match, found {count}')
if 'document.startViewTransition' in js:
    raise SystemExit('JS still contains document.startViewTransition')
write(js_path, js)

css_path = 'budget/training-zen-nav.css'
css = read(css_path)
old_css = ".wellness-zen-surface{position:relative;z-index:2;isolation:isolate;min-height:100vh;view-transition-name:wellness-surface}\n#pulse-home{view-transition-name:wellness-surface}\n#wellness-zen-surface .kind-switch{display:none!important}"
new_css = ".wellness-zen-surface{position:relative;z-index:2;isolation:isolate;min-height:100vh}\n#wellness-zen-surface .kind-switch{display:none!important}"
css = replace_once(css, old_css, new_css, 'remove view-transition ownership')
old_morph = ".wellness-surface-enter{animation:wellnessSurfaceIn .22s cubic-bezier(.16,1,.3,1)}\n@keyframes wellnessSurfaceIn{from{opacity:0;transform:translateY(5px) scale(.996)}to{opacity:1;transform:none}}\n::view-transition-old(wellness-surface){animation:wellnessSurfaceOld .18s cubic-bezier(.4,0,.2,1)}\n::view-transition-new(wellness-surface){animation:wellnessSurfaceNew .24s cubic-bezier(.16,1,.3,1)}\n@keyframes wellnessSurfaceOld{to{opacity:0;transform:scale(.997) translateY(-3px)}}\n@keyframes wellnessSurfaceNew{from{opacity:0;transform:scale(.997) translateY(4px)}}"
new_morph = ".wellness-surface-enter{animation:wellnessSurfaceIn .18s cubic-bezier(.16,1,.3,1)}\n@keyframes wellnessSurfaceIn{from{opacity:.82;transform:translateY(3px) scale(.998)}to{opacity:1;transform:none}}"
css = replace_once(css, old_morph, new_morph, 'replace snapshot morph')
old_reduced = "@media(prefers-reduced-motion:reduce){\n  .wellness-kind-options button,.wellness-kind-options button:after,.wellness-surface-enter{transition:none!important;animation:none!important}\n  ::view-transition-old(wellness-surface),::view-transition-new(wellness-surface){animation:none!important}\n}"
new_reduced = "@media(prefers-reduced-motion:reduce){\n  .wellness-kind-options button,.wellness-kind-options button:after,.wellness-surface-enter{transition:none!important;animation:none!important}\n}"
css = replace_once(css, old_reduced, new_reduced, 'reduced motion cleanup')
if 'view-transition' in css or 'wellnessSurfaceOld' in css or 'wellnessSurfaceNew' in css:
    raise SystemExit('CSS still contains retired snapshot transition code')
write(css_path, css)

test_path = 'budget/tests/training-wellness-shell.test.cjs'
test = read(test_path)
test = replace_once(test,
"  assert.match(shell,/zenHost\\.hidden=!zen/);\n  assert.match(shell,/zenBackdrop\\.hidden=!zen/);",
"  assert.match(shell,/if\\(zenHost\\)zenHost\\.hidden=true/);\n  assert.match(shell,/if\\(zenHost\\)zenHost\\.hidden=false/);\n  assert.match(shell,/if\\(zenBackdrop\\)zenBackdrop\\.hidden=true/);\n  assert.match(shell,/if\\(zenBackdrop\\)zenBackdrop\\.hidden=false/);",
'update mounted-surface assertions')
old_test = """test('wellness switching has view transition, CSS fallback and reduced-motion path',()=>{
  assert.match(shell,/document\\.startViewTransition/);
  assert.match(shell,/wellness-shell-switching/);
  assert.match(shell,/prefers-reduced-motion: reduce/);
  assert.match(shellCss,/wellnessSurfaceIn/);
  assert.match(shellCss,/::view-transition-old\\(wellness-surface\\)/);
  assert.match(shellCss,/@media\\(prefers-reduced-motion:reduce\\)/);
});

test('wellness morph stays short and avoids expensive full-surface blur',()=>{
  assert.match(shellCss,/wellnessSurfaceIn \\.22s/);
  assert.match(shellCss,/wellnessSurfaceOld \\.18s/);
  assert.match(shellCss,/wellnessSurfaceNew \\.24s/);
  const morphCss=shellCss.slice(shellCss.indexOf('.wellness-surface-enter'),shellCss.indexOf('@media(max-width:760px)'));
  assert.doesNotMatch(morphCss,/filter:blur/);
  assert.match(shell,/\\},260\\);\\}\\);/);
});"""
new_test = """test('wellness switching atomically swaps surfaces without outgoing snapshots',()=>{
  assert.doesNotMatch(shell,/document\\.startViewTransition/);
  assert.match(shell,/wellness-shell-switching/);
  assert.match(shell,/prefers-reduced-motion: reduce/);
  const apply=shell.slice(shell.indexOf('function applyMode'),shell.indexOf('function swap'));
  assert.ok(apply.indexOf('if(zenHost)zenHost.hidden=true;')>=0);
  assert.ok(apply.indexOf('if(zenHost)zenHost.hidden=true;')<apply.indexOf('if(!zen)toggleZenStyles(false);'));
  assert.ok(apply.indexOf('if(zenBackdrop)zenBackdrop.hidden=true;')<apply.indexOf('if(!zen)toggleZenStyles(false);'));
  assert.match(shellCss,/wellnessSurfaceIn/);
  assert.doesNotMatch(shellCss,/::view-transition-/);
  assert.doesNotMatch(shellCss,/view-transition-name/);
  assert.match(shellCss,/@media\\(prefers-reduced-motion:reduce\\)/);
});

test('wellness morph animates only the incoming surface and remains short',()=>{
  assert.match(shellCss,/wellnessSurfaceIn \\.18s/);
  assert.doesNotMatch(shellCss,/wellnessSurfaceOld|wellnessSurfaceNew/);
  const morphCss=shellCss.slice(shellCss.indexOf('.wellness-surface-enter'),shellCss.indexOf('@media(max-width:760px)'));
  assert.doesNotMatch(morphCss,/filter:blur/);
  assert.match(shell,/target\\.classList\\.add\\('wellness-surface-enter'\\)/);
  assert.match(shell,/\\},200\\);/);
});"""
test = replace_once(test, old_test, new_test, 'transition regression tests')
old_version = '20260916-main-cp8-toggle-align-1'
new_version = '20260916-main-cp8-no-flash-1'
if test.count(old_version) != 2:
    raise SystemExit(f'test cache key: expected 2 old refs, found {test.count(old_version)}')
test = test.replace(old_version, new_version)
write(test_path, test)

for rel in ['budget/exercise.html','budget/zen.html']:
    text = read(rel)
    if text.count(old_version) != 2:
        raise SystemExit(f'{rel}: expected 2 cache refs, found {text.count(old_version)}')
    write(rel, text.replace(old_version, new_version))

check_path = 'budget/TRAINING-OBSERVATORY-MIGRATION-CHECKLIST.md'
check = read(check_path)
marker = '\n\n# Checkpoint 9 — Retire preview/page duplication'
note = "\n\n**CP8 transition refinement (2026-09-16):** cross-mode Training ↔ Zen switching no longer uses browser View Transition snapshots. The outgoing surface is hidden atomically before Zen-only styles are detached, and only the newly active surface receives the short CSS enter animation. This removes the visible re-render/flash of the previous Stretch or Meditation page on mobile Safari while retaining reduced-motion and stale-request cancellation."
if note not in check:
    if marker not in check:
        raise SystemExit('checklist CP9 marker missing')
    check = check.replace(marker, note + marker, 1)
write(check_path, check)

print('Applied CP8 transition flash fix')
