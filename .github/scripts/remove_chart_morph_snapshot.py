from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

old_rules = (
    "      '::view-transition-old(finance-title),::view-transition-old(finance-person),::view-transition-old(finance-month),::view-transition-old(finance-profile),::view-transition-old(finance-views),::view-transition-old(finance-menu),::view-transition-old(finance-panel-0),::view-transition-old(finance-panel-1),::view-transition-old(finance-panel-2){opacity:0!important;animation:none!important;mix-blend-mode:normal!important}' +\n"
    "      '::view-transition-new(finance-title),::view-transition-new(finance-person),::view-transition-new(finance-month),::view-transition-new(finance-profile),::view-transition-new(finance-views),::view-transition-new(finance-menu),::view-transition-new(finance-panel-0),::view-transition-new(finance-panel-1),::view-transition-new(finance-panel-2){opacity:1!important;animation:none!important;mix-blend-mode:normal!important}';"
)
new_rules = "      '::view-transition-old(finance-title),::view-transition-new(finance-title),::view-transition-old(finance-person),::view-transition-new(finance-person),::view-transition-old(finance-month),::view-transition-new(finance-month),::view-transition-old(finance-profile),::view-transition-new(finance-profile),::view-transition-old(finance-views),::view-transition-new(finance-views),::view-transition-old(finance-menu),::view-transition-new(finance-menu),::view-transition-old(finance-panel-0),::view-transition-new(finance-panel-0),::view-transition-old(finance-panel-1),::view-transition-new(finance-panel-1),::view-transition-old(finance-panel-2),::view-transition-new(finance-panel-2){mix-blend-mode:normal!important}';"
if old_rules not in s:
    raise SystemExit('temporary old/new opacity workaround not found')
s = s.replace(old_rules, new_rules, 1)

old_targets = """    var container = document.querySelector('.container');
    if (!container) return;
    Array.prototype.slice.call(container.children, 0, 3).forEach(function (el, index) {
      el.style.viewTransitionName = 'finance-panel-' + index;
    });
"""
new_targets = """    var container = document.querySelector('.container');
    if (!container) return;
    var morphIndex = 0;
    Array.prototype.slice.call(container.children).forEach(function (el) {
      if (morphIndex >= 3 || el.querySelector('canvas')) return;
      el.style.viewTransitionName = 'finance-panel-' + morphIndex;
      morphIndex += 1;
    });
"""
if old_targets not in s:
    raise SystemExit('current panel morph target block not found')
s = s.replace(old_targets, new_targets, 1)
ui.write_text(s)

pages = [
    'budget/budget.html', 'budget/budget_maja.html',
    'budget/analytics.html', 'budget/analytics_maja.html',
    'budget/familjebudget.html'
]
for name in pages:
    p = Path(name)
    t = p.read_text()
    old = 'finance-ui.js?v=20260830-finance-final-v2'
    new = 'finance-ui.js?v=20260830-finance-final-v3'
    if old not in t:
        raise SystemExit(f'{name}: final-v2 loader not found')
    p.write_text(t.replace(old, new, 1))
