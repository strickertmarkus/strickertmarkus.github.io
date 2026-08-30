from pathlib import Path
import re

ui = Path('budget/finance-ui.js')
s = ui.read_text()

old_panel_rule = (
    "      '::view-transition-old(finance-panel-0),::view-transition-old(finance-panel-1),::view-transition-old(finance-panel-2),"
    "::view-transition-new(finance-panel-0),::view-transition-new(finance-panel-1),::view-transition-new(finance-panel-2)"
    "{mix-blend-mode:normal!important;animation-duration:.46s!important}' +\n"
    "      '::view-transition-old(finance-title),::view-transition-new(finance-title),::view-transition-old(finance-person),"
    "::view-transition-new(finance-person){mix-blend-mode:normal!important;animation-duration:.40s!important}';"
)

old_names = [
    'finance-title', 'finance-person', 'finance-month', 'finance-profile',
    'finance-views', 'finance-menu', 'finance-panel-0', 'finance-panel-1', 'finance-panel-2'
]
old_selector = ','.join('::view-transition-old(%s)' % n for n in old_names)
new_selector = ','.join('::view-transition-new(%s)' % n for n in old_names)

new_panel_rule = (
    "      '" + old_selector + "{opacity:0!important;animation:none!important;mix-blend-mode:normal!important}' +\n"
    "      '" + new_selector + "{opacity:1!important;animation:none!important;mix-blend-mode:normal!important}';"
)

if old_panel_rule not in s:
    raise SystemExit('Current shared-element image-pair rules not found')
s = s.replace(old_panel_rule, new_panel_rule, 1)
ui.write_text(s)

# Slightly increase the native Chart.js arc rounding on the Budget wheel only.
for name in ['budget/budget.html', 'budget/budget_maja.html']:
    p = Path(name)
    t = p.read_text()
    pattern = re.compile(r'(borderRadius\s*:\s*)4(\s*,\s*spacing\s*:\s*1)')
    t2, count = pattern.subn(r'\g<1>6\g<2>', t)
    if count < 1:
        raise SystemExit(f'{name}: budget wheel borderRadius/spacing pair not found')
    p.write_text(t2)

# Bump only the finance UI cache key on all finance pages.
for name in [
    'budget/budget.html', 'budget/budget_maja.html',
    'budget/analytics.html', 'budget/analytics_maja.html',
    'budget/familjebudget.html'
]:
    p = Path(name)
    t = p.read_text()
    old = 'finance-ui.js?v=20260830-finance-final-v1'
    new = 'finance-ui.js?v=20260830-finance-final-v2'
    if old not in t:
        raise SystemExit(f'{name}: final-v1 loader not found')
    p.write_text(t.replace(old, new, 1))
