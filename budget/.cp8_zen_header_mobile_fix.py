from pathlib import Path


def once(text, old, new, label):
    count=text.count(old)
    if count!=1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old,new,1)

css_path=Path('budget/training-zen-nav.css')
css=css_path.read_text()
css=once(
    css,
    'html[data-wellness-mode="zen"] .nav-dropdown-wrapper{opacity:.62}',
    'html[data-wellness-mode="zen"] #pulse-header .nav-dropdown-wrapper{display:none!important}',
    'retire training hamburger in Zen mode'
)
old_mobile='''@media(max-width:760px){
  .app-header:has(>.wellness-nav){flex-wrap:wrap}
  .app-header>.wellness-nav{order:4;flex-basis:100%;width:100%;justify-content:center}
  .app-header>.wellness-nav a{flex:1;min-height:34px}
  .wellness-nav a{padding:0 13px}
  #pulse-header .wellness-zen-tools{grid-column:2;grid-row:2;justify-self:end}
  #pulse-header .wellness-zen-brand{min-width:0}
  #pulse-header .wellness-zen-brand small{font-size:6px;letter-spacing:1px}
}
'''
new_mobile='''@media(max-width:760px){
  .app-header:has(>.wellness-nav){flex-wrap:wrap}
  .app-header>.wellness-nav{order:4;flex-basis:100%;width:100%;justify-content:center}
  .app-header>.wellness-nav a{flex:1;min-height:34px}
  .wellness-nav a{padding:0 13px}
  html[data-wellness-mode="zen"] #pulse-header{
    display:grid!important;
    grid-template-columns:minmax(0,1fr) auto!important;
    grid-template-rows:auto auto!important;
    align-items:center!important;
    gap:8px 12px!important;
    min-height:0!important;
    padding:12px 16px 10px!important;
  }
  html[data-wellness-mode="zen"] #pulse-header .brand{
    position:static!important;
    left:auto!important;
    top:auto!important;
    transform:none!important;
    width:auto!important;
    max-width:none!important;
    margin:0!important;
    grid-column:1!important;
    grid-row:1!important;
    justify-self:start!important;
    justify-content:flex-start!important;
  }
  html[data-wellness-mode="zen"] #pulse-header>.wellness-nav{
    grid-column:1/-1!important;
    grid-row:2!important;
    width:100%!important;
    min-width:0!important;
    margin:0!important;
    justify-self:stretch!important;
  }
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-tools{
    grid-column:2!important;
    grid-row:1!important;
    justify-self:end!important;
    gap:8px;
  }
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-tools .icon-button{width:34px;height:34px}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand{min-width:0;font-size:14px;line-height:1.05}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand>span:first-child{font-size:22px}
  html[data-wellness-mode="zen"] #pulse-header .wellness-zen-brand small{font-size:6px;letter-spacing:1px}
}
'''
css=once(css,old_mobile,new_mobile,'mobile Zen header layout')
css_path.write_text(css)

for rel in ['budget/exercise.html','budget/zen.html']:
    p=Path(rel); text=p.read_text()
    text=text.replace('training-zen-nav.css?v=20260916-main-cp8-wellness-fast-2','training-zen-nav.css?v=20260916-main-cp8-wellness-header-3')
    text=text.replace('training-zen-nav.js?v=20260916-main-cp8-wellness-fast-2','training-zen-nav.js?v=20260916-main-cp8-wellness-header-3')
    p.write_text(text)

test_path=Path('budget/tests/training-wellness-shell.test.cjs')
test=test_path.read_text()
test=test.replace('training-zen-nav\\.css\\?v=20260916-main-cp8-wellness-fast-2','training-zen-nav\\.css\\?v=20260916-main-cp8-wellness-header-3')
test=test.replace('training-zen-nav\\.js\\?v=20260916-main-cp8-wellness-fast-2','training-zen-nav\\.js\\?v=20260916-main-cp8-wellness-header-3')
new_test=r'''

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
'''
marker="\ntest('live sessions cannot be silently destroyed by a wellness switch',()=>{"
if new_test.strip() not in test:
    test=once(test,marker,new_test+marker,'mobile Zen header regression test')
test_path.write_text(test)

check_path=Path('budget/TRAINING-OBSERVATORY-MIGRATION-CHECKLIST.md')
check=check_path.read_text()
needle='Performance refinement (2026-09-16): the wellness morph is capped at 180–240 ms, full-surface blur was removed for mobile Safari, and Zen-local CSS/JS URLs are network-preloaded after initial idle or explicit Zen intent without executing the Zen runtime until the mode is actually opened.'
replacement=needle+'\n\nMobile Zen header refinement (2026-09-16): the in-page Zen mode now follows the native Zen header hierarchy. The Training hamburger is not rendered in Zen mode; mobile uses one compact identity/profile row plus the Training↔Zen selector directly underneath, avoiding duplicate menu affordances and excess header height.'
check=once(check,needle,replacement,'checklist mobile header note')
check_path.write_text(check)
