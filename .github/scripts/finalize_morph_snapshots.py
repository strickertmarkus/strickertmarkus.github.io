from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

old = (
    "      '@view-transition{navigation:auto}' +\n"
    "      '::view-transition-old(root),::view-transition-new(root){animation:none!important;mix-blend-mode:normal!important}' +\n"
    "      '::view-transition-old(root){opacity:0!important}' +\n"
    "      '::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-month),::view-transition-group(finance-profile),::view-transition-group(finance-views),::view-transition-group(finance-menu),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.46s!important;animation-timing-function:cubic-bezier(.22,1,.36,1)!important}' +\n"
    "      '::view-transition-old(finance-title),::view-transition-new(finance-title),::view-transition-old(finance-person),::view-transition-new(finance-person),::view-transition-old(finance-month),::view-transition-new(finance-month),::view-transition-old(finance-profile),::view-transition-new(finance-profile),::view-transition-old(finance-views),::view-transition-new(finance-views),::view-transition-old(finance-menu),::view-transition-new(finance-menu),::view-transition-old(finance-panel-0),::view-transition-new(finance-panel-0),::view-transition-old(finance-panel-1),::view-transition-new(finance-panel-1),::view-transition-old(finance-panel-2),::view-transition-new(finance-panel-2){mix-blend-mode:normal!important}';"
)
new = (
    "      '@view-transition{navigation:auto}' +\n"
    "      ':root{view-transition-name:none}' +\n"
    "      '::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-month),::view-transition-group(finance-profile),::view-transition-group(finance-views),::view-transition-group(finance-menu),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.46s!important;animation-timing-function:cubic-bezier(.22,1,.36,1)!important}' +\n"
    "      '::view-transition-old(*),::view-transition-new(*){mix-blend-mode:normal!important}';"
)
if old not in s:
    raise SystemExit('current morph bootstrap not found')
s = s.replace(old, new, 1)
ui.write_text(s)

for name in [
    'budget/budget.html', 'budget/budget_maja.html',
    'budget/analytics.html', 'budget/analytics_maja.html',
    'budget/familjebudget.html'
]:
    p = Path(name)
    t = p.read_text()
    old_loader = 'finance-ui.js?v=20260830-finance-final-v3'
    new_loader = 'finance-ui.js?v=20260830-finance-final-v4'
    if old_loader not in t:
        raise SystemExit(f'{name}: final-v3 loader not found')
    p.write_text(t.replace(old_loader, new_loader, 1))
