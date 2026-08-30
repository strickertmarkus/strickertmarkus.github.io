from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

anchor = "  installFinancePreload();\n\n  function route(nextView, nextUser) {"
morph_bootstrap = """  installFinancePreload();

  function installFinanceMorphBootstrap() {
    if (document.getElementById('finance-morph-v13-style')) return;
    var style = document.createElement('style');
    style.id = 'finance-morph-v13-style';
    style.textContent =
      '@view-transition{navigation:auto}' +
      '::view-transition-old(root),::view-transition-new(root){animation:none!important;mix-blend-mode:normal!important}' +
      '::view-transition-old(root){opacity:0!important}' +
      '::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-month),::view-transition-group(finance-profile),::view-transition-group(finance-views),::view-transition-group(finance-menu),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.46s!important;animation-timing-function:cubic-bezier(.22,1,.36,1)!important}' +
      '::view-transition-old(finance-panel-0),::view-transition-old(finance-panel-1),::view-transition-old(finance-panel-2),::view-transition-new(finance-panel-0),::view-transition-new(finance-panel-1),::view-transition-new(finance-panel-2){mix-blend-mode:normal!important;animation-duration:.46s!important}' +
      '::view-transition-old(finance-title),::view-transition-new(finance-title),::view-transition-old(finance-person),::view-transition-new(finance-person){mix-blend-mode:normal!important;animation-duration:.40s!important}';
    document.head.appendChild(style);
  }

  installFinanceMorphBootstrap();

  function route(nextView, nextUser) {"""
if anchor not in s:
    raise SystemExit('morph bootstrap anchor not found')
s = s.replace(anchor, morph_bootstrap, 1)

before_arrival = "  function animateArrival() {"
morph_fn = """  function setupFinanceMorphTargets() {
    var header = document.querySelector('.header');
    if (header) {
      var h1 = header.querySelector('h1');
      var sub = header.querySelector('p');
      var menu = header.querySelector('.nav-dropdown-wrapper');
      if (h1) h1.style.viewTransitionName = 'finance-title';
      if (sub) sub.style.viewTransitionName = 'finance-person';
      if (menu) menu.style.viewTransitionName = 'finance-menu';
    }
    var month = document.getElementById('month-nav');
    var profile = document.getElementById('finance-profile-clean-v1');
    var views = document.getElementById('finance-view-clean-v1');
    if (month) month.style.viewTransitionName = 'finance-month';
    if (profile) profile.style.viewTransitionName = 'finance-profile';
    if (views) views.style.viewTransitionName = 'finance-views';

    var container = document.querySelector('.container');
    if (!container) return;
    Array.prototype.slice.call(container.children, 0, 3).forEach(function (el, index) {
      el.style.viewTransitionName = 'finance-panel-' + index;
    });
  }

  function animateArrival() {"""
if before_arrival not in s:
    raise SystemExit('animateArrival anchor not found')
s = s.replace(before_arrival, morph_fn, 1)

old_fresh = """    if (!fresh) return;
    var container = document.querySelector('.container');
    if (!container) return;
"""
new_fresh = """    if (!fresh) return;
    var nativeMorph = false;
    try {
      nativeMorph = !!(window.CSS && CSS.supports && CSS.supports('view-transition-name: none') && ('onpagereveal' in window));
    } catch (_) {}
    if (nativeMorph) return;
    var container = document.querySelector('.container');
    if (!container) return;
"""
if old_fresh not in s:
    raise SystemExit('animateArrival native fallback anchor not found')
s = s.replace(old_fresh, new_fresh, 1)

old_init = """    buildViewToggle();
    updateActiveStates();
    setupMonthControl();
    animateArrival();
"""
new_init = """    buildViewToggle();
    updateActiveStates();
    setupMonthControl();
    setupFinanceMorphTargets();
    animateArrival();
"""
if old_init not in s:
    raise SystemExit('init anchor not found')
s = s.replace(old_init, new_init, 1)
ui.write_text(s)

pages = [
    'budget/budget.html',
    'budget/budget_maja.html',
    'budget/analytics.html',
    'budget/analytics_maja.html',
    'budget/familjebudget.html',
]
for name in pages:
    p = Path(name)
    t = p.read_text()
    old = 'finance-ui.js?v=20260830-finance-clean-v12'
    new = 'finance-ui.js?v=20260830-finance-clean-v13'
    if old not in t:
        raise SystemExit(f'{name}: v12 loader not found')
    p.write_text(t.replace(old, new, 1))
