from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

analysis_theme = "? { accent: '#4ADE80', hover: '#86EFAC', active: '#22C55E', rgb: '74,222,128', month: '#4ADE80', monthHover: '#86EFAC', monthActive: '#22C55E', bgAlpha: '.085', headerAlpha: '.06', borderAlpha: '.20', glowAlpha: '.075' }"
family_theme = "? { accent: '#FB923C', hover: '#FDBA74', active: '#F97316', rgb: '251,146,60', month: '#FB923C', monthHover: '#FDBA74', monthActive: '#F97316', bgAlpha: '.085', headerAlpha: '.06', borderAlpha: '.20', glowAlpha: '.075' }"
if analysis_theme not in s or family_theme not in s:
    raise SystemExit('analysis/family theme guard failed')

old_budget = "      : { accent: '#A78BFA', hover: '#C4B5FD', active: '#8B5CF6', rgb: '167,139,250', month: '#C084FC', monthHover: '#D8B4FE', monthActive: '#A855F7', bgAlpha: '.105', headerAlpha: '.072', borderAlpha: '.23', glowAlpha: '.09' });"
new_budget = "      : { accent: '#2563EB', hover: '#60A5FA', active: '#1D4ED8', rgb: '37,99,235', month: '#7DD3FC', monthHover: '#BAE6FD', monthActive: '#38BDF8', bgAlpha: '.16', headerAlpha: '.11', borderAlpha: '.32', glowAlpha: '.14' });"
if old_budget not in s:
    raise SystemExit('current violet budget theme not found')
s = s.replace(old_budget, new_budget, 1)

anchor = "      'html.finance-ui-clean-v1 body .container>.kpi-row,html.finance-ui-clean-v1 body .container>.grid-4,html.finance-ui-clean-v1 body .container>.kpi-grid{filter:drop-shadow(0 10px 26px rgba(var(--finance-accent-rgb),.025))}' +\n"
wheel_css = "      'html[data-finance-view=\"budget\"].finance-ui-clean-v1 body #pieChart{filter:drop-shadow(0 0 9px rgba(var(--finance-accent-rgb),.16))!important;transition:filter .18s ease!important}' +\n"
if wheel_css not in s:
    if anchor not in s:
        raise SystemExit('finance theme CSS anchor not found')
    s = s.replace(anchor, anchor + wheel_css, 1)

ui.write_text(s)

wheel_old = "                hoverBorderWidth: 0,\n                hoverBorderColor: 'transparent',\n                hoverOffset: 0,"
wheel_new = "                hoverBorderWidth: isDarkMode() ? 4 : 5,\n                hoverBorderColor: isDarkMode() ? 'rgba(125,211,252,0.70)' : '#2563EB',\n                hoverOffset: 0,"
for name in ['budget/budget.html', 'budget/budget_maja.html']:
    p = Path(name)
    t = p.read_text()
    if t.count(wheel_old) != 1:
        raise SystemExit(f'{name}: expected exactly one budget wheel hover block, found {t.count(wheel_old)}')
    p.write_text(t.replace(wheel_old, wheel_new, 1))

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
    old_loader = 'finance-ui.js?v=20260831-finance-theme-violet-v6'
    new_loader = 'finance-ui.js?v=20260831-finance-theme-blue-v7'
    if old_loader not in t:
        raise SystemExit(f'{name}: v6 loader not found')
    p.write_text(t.replace(old_loader, new_loader, 1))
