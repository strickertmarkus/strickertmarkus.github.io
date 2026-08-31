from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

budget_theme = "      : { accent: '#2563EB', hover: '#60A5FA', active: '#1D4ED8', rgb: '37,99,235', month: '#7DD3FC', monthHover: '#BAE6FD', monthActive: '#38BDF8', bgAlpha: '.16', headerAlpha: '.11', borderAlpha: '.32', glowAlpha: '.14' });"
if budget_theme not in s:
    raise SystemExit('Budget blue theme guard failed')

wheel_css = "      'html[data-finance-view=\"budget\"].finance-ui-clean-v1 body #pieChart{filter:drop-shadow(0 0 9px rgba(var(--finance-accent-rgb),.16))!important;transition:filter .18s ease!important}' +\n"
if s.count(wheel_css) != 1:
    raise SystemExit(f'expected one Budget wheel halo rule, found {s.count(wheel_css)}')
s = s.replace(wheel_css, '', 1)
ui.write_text(s)

for name in ['budget/budget.html', 'budget/budget_maja.html']:
    p = Path(name)
    t = p.read_text()

    old_initial = "                hoverBorderWidth: isDarkMode() ? 4 : 5,\n                hoverBorderColor: isDarkMode() ? 'rgba(125,211,252,0.70)' : '#2563EB',\n                hoverOffset: 0,"
    new_initial = "                hoverBorderWidth: 0,\n                hoverBorderColor: 'transparent',\n                hoverOffset: 0,"
    if t.count(old_initial) != 1:
        raise SystemExit(f'{name}: themed initial wheel hover block count {t.count(old_initial)}')
    t = t.replace(old_initial, new_initial, 1)

    old_update = "    pieChart.data.datasets[0].hoverBorderColor = isDarkMode() ? 'rgba(125,211,252,0.70)' : '#2563EB';"
    new_update = '    pieChart.data.datasets[0].hoverBorderColor = isDarkMode() ? "#2A3041" : "#FFFFFF";'
    if t.count(old_update) != 1:
        raise SystemExit(f'{name}: themed update hover assignment count {t.count(old_update)}')
    t = t.replace(old_update, new_update, 1)

    color_expr = "expenseSections.map(s => s.color + 'A0')"
    if t.count(color_expr) != 2:
        raise SystemExit(f'{name}: expected two wheel A0 color expressions, found {t.count(color_expr)}')
    t = t.replace(color_expr, "expenseSections.map(s => s.color + 'C0')")

    p.write_text(t)

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
    old_loader = 'finance-ui.js?v=20260831-finance-theme-blue-v7'
    new_loader = 'finance-ui.js?v=20260831-finance-theme-blue-v8'
    if t.count(old_loader) != 1:
        raise SystemExit(f'{name}: expected one v7 loader, found {t.count(old_loader)}')
    p.write_text(t.replace(old_loader, new_loader, 1))
