from pathlib import Path


def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)

js_path = Path('budget/training-zen-nav.js')
js = js_path.read_text()
js = once(
    js,
    "  var zenHost=null,zenLoadPromise=null,zenStyleLinks=[],zenTools=null,zenBrand=null;",
    "  var zenHost=null,zenLoadPromise=null,zenDocumentPromise=null,zenPreloadStarted=false,zenStyleLinks=[],zenTools=null,zenBrand=null;",
    'wellness state vars'
)
insert_anchor = "  function loadStyles(doc){\n"
insert = """  function getZenDocument(){
    if(zenDocumentPromise)return zenDocumentPromise;
    zenDocumentPromise=fetch('zen.html',{credentials:'same-origin'}).then(function(response){
      if(!response.ok)throw new Error('Zen kunde inte laddas.');
      return response.text();
    }).then(function(html){return new DOMParser().parseFromString(html,'text/html');}).catch(function(error){zenDocumentPromise=null;throw error;});
    return zenDocumentPromise;
  }
  function preloadZenAssets(doc){
    if(zenPreloadStarted)return;
    zenPreloadStarted=true;
    Array.prototype.forEach.call(doc.querySelectorAll('link[rel=\"stylesheet\"]'),function(source){
      var href=source.getAttribute('href')||'';
      var absolute=new URL(href,location.href);
      var file=absolute.pathname.split('/').pop();
      if(!/^zen.*\\.css$/i.test(file))return;
      if(document.querySelector('link[data-wellness-preload=\"'+absolute.href.replace(/\"/g,'')+'\"]'))return;
      var link=document.createElement('link');
      link.rel='preload';link.as='style';link.href=absolute.href;link.dataset.wellnessPreload=absolute.href;
      document.head.appendChild(link);
    });
    Array.prototype.forEach.call(doc.querySelectorAll('script[src]'),function(source){
      var src=source.getAttribute('src')||'';
      var absolute=new URL(src,location.href);
      var file=absolute.pathname.split('/').pop().split('?')[0];
      if(file!=='zen.js'&&!/^zen-.*\\.js$/i.test(file))return;
      if(document.querySelector('link[data-wellness-preload=\"'+absolute.href.replace(/\"/g,'')+'\"]'))return;
      var link=document.createElement('link');
      link.rel='preload';link.as='script';link.href=absolute.href;link.dataset.wellnessPreload=absolute.href;
      document.head.appendChild(link);
    });
  }
  function warmZenAssets(){
    if(!canonical||zenLoadPromise)return;
    getZenDocument().then(preloadZenAssets).catch(function(){zenPreloadStarted=false;});
  }
"""
js = once(js, insert_anchor, insert + insert_anchor, 'preload helpers')
old_ensure = """  function ensureZenLoaded(){
    if(zenLoadPromise)return zenLoadPromise;
    zenLoadPromise=fetch('zen.html',{credentials:'same-origin'}).then(function(response){if(!response.ok)throw new Error('Zen kunde inte laddas.');return response.text();}).then(function(html){
      var doc=new DOMParser().parseFromString(html,'text/html');
      zenHost=extractZenSurface(doc);
      ensureThemeMeta();
      document.body.dataset.kind=doc.body.dataset.kind||'stretch';
      return loadStyles(doc).then(function(){return loadScripts(doc);});
    }).catch(function(error){zenLoadPromise=null;if(zenHost){zenHost.remove();zenHost=null;}throw error;});
    return zenLoadPromise;
  }
"""
new_ensure = """  function ensureZenLoaded(){
    if(zenLoadPromise)return zenLoadPromise;
    zenLoadPromise=getZenDocument().then(function(doc){
      preloadZenAssets(doc);
      zenHost=extractZenSurface(doc);
      ensureThemeMeta();
      document.body.dataset.kind=doc.body.dataset.kind||'stretch';
      return loadStyles(doc).then(function(){return loadScripts(doc);});
    }).catch(function(error){zenLoadPromise=null;if(zenHost){zenHost.remove();zenHost=null;}throw error;});
    return zenLoadPromise;
  }
"""
js = once(js, old_ensure, new_ensure, 'ensureZenLoaded')
js = once(js, "},460);});", "},260);});", 'fallback duration')
nav_anchor = """  ensureSharedHeaderZenTools();
  document.documentElement.dataset.wellnessMode='training';
  updateNav('training');
"""
nav_new = """  ensureSharedHeaderZenTools();
  document.documentElement.dataset.wellnessMode='training';
  updateNav('training');
  var zenNavLink=nav&&nav.querySelector('[data-destination=\"zen\"]');
  if(zenNavLink){
    zenNavLink.addEventListener('pointerenter',warmZenAssets,{once:true,passive:true});
    zenNavLink.addEventListener('focus',warmZenAssets,{once:true});
    zenNavLink.addEventListener('touchstart',warmZenAssets,{once:true,passive:true});
  }
  if('requestIdleCallback' in window)window.requestIdleCallback(warmZenAssets,{timeout:1200});
  else window.setTimeout(warmZenAssets,1000);
"""
js = once(js, nav_anchor, nav_new, 'warm scheduling')
js_path.write_text(js)

css_path = Path('budget/training-zen-nav.css')
css = css_path.read_text()
css = css.replace('transition:background .45s,color .45s,box-shadow .45s','transition:background .22s,color .22s,box-shadow .22s')
css = once(css, '.wellness-surface-enter{animation:wellnessSurfaceIn .44s cubic-bezier(.16,1,.3,1)}', '.wellness-surface-enter{animation:wellnessSurfaceIn .22s cubic-bezier(.16,1,.3,1)}', 'fallback animation')
css = once(css, '@keyframes wellnessSurfaceIn{from{opacity:0;transform:translateY(10px) scale(.992);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}', '@keyframes wellnessSurfaceIn{from{opacity:0;transform:translateY(5px) scale(.996)}to{opacity:1;transform:none}}', 'fallback keyframes')
css = once(css, '::view-transition-old(wellness-surface){animation:wellnessSurfaceOld .42s cubic-bezier(.4,0,.2,1)}', '::view-transition-old(wellness-surface){animation:wellnessSurfaceOld .18s cubic-bezier(.4,0,.2,1)}', 'old transition')
css = once(css, '::view-transition-new(wellness-surface){animation:wellnessSurfaceNew .52s cubic-bezier(.16,1,.3,1)}', '::view-transition-new(wellness-surface){animation:wellnessSurfaceNew .24s cubic-bezier(.16,1,.3,1)}', 'new transition')
css = once(css, '@keyframes wellnessSurfaceOld{to{opacity:0;transform:scale(.99) translateY(-5px);filter:blur(2px)}}', '@keyframes wellnessSurfaceOld{to{opacity:0;transform:scale(.997) translateY(-3px)}}', 'old keyframes')
css = once(css, '@keyframes wellnessSurfaceNew{from{opacity:0;transform:scale(.992) translateY(8px);filter:blur(3px)}}', '@keyframes wellnessSurfaceNew{from{opacity:0;transform:scale(.997) translateY(4px)}}', 'new keyframes')
css_path.write_text(css)

for rel in ['budget/exercise.html','budget/zen.html']:
    p=Path(rel); text=p.read_text()
    text=text.replace('training-zen-nav.css?v=20260915-main-cp8-wellness-1','training-zen-nav.css?v=20260916-main-cp8-wellness-fast-2')
    text=text.replace('training-zen-nav.js?v=20260915-main-cp8-wellness-1','training-zen-nav.js?v=20260916-main-cp8-wellness-fast-2')
    p.write_text(text)

test_path=Path('budget/tests/training-wellness-shell.test.cjs')
test=test_path.read_text()
test=test.replace('training-zen-nav\\.css\\?v=20260915-main-cp8-wellness-1','training-zen-nav\\.css\\?v=20260916-main-cp8-wellness-fast-2')
test=test.replace('training-zen-nav\\.js\\?v=20260915-main-cp8-wellness-1','training-zen-nav\\.js\\?v=20260916-main-cp8-wellness-fast-2')
performance_test = r'''

test('wellness morph stays short and avoids expensive full-surface blur',()=>{
  assert.match(css,/wellnessSurfaceIn \.22s/);
  assert.match(css,/wellnessSurfaceOld \.18s/);
  assert.match(css,/wellnessSurfaceNew \.24s/);
  assert.doesNotMatch(css,/filter:blur/);
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
'''
marker="\ntest('profile query and intentional browser history survive in-page switching',()=>{"
if performance_test.strip() not in test:
    test=once(test,marker,performance_test+marker,'performance tests')
test_path.write_text(test)

check_path=Path('budget/TRAINING-OBSERVATORY-MIGRATION-CHECKLIST.md')
check=check_path.read_text()
needle='Verification: controller syntax, all `budget/tests/training-*.test.cjs` plus existing `budget/tests/zen*.test.cjs`, lazy Zen-only asset filtering, no iframe/second full-document mount, one shared header, active-session guards, profile/history preservation, current cache keys and `git diff --check`.'
replacement=needle+'\n\nPerformance refinement (2026-09-16): the wellness morph is capped at 180–240 ms, full-surface blur was removed for mobile Safari, and Zen-local CSS/JS URLs are network-preloaded after initial idle or explicit Zen intent without executing the Zen runtime until the mode is actually opened.'
check=once(check,needle,replacement,'checklist performance note')
check_path.write_text(check)
