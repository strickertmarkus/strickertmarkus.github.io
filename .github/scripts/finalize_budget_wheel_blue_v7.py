from pathlib import Path

old = '    pieChart.data.datasets[0].hoverBorderColor = isDarkMode() ? "#2A3041" : "#FFFFFF";'
new = "    pieChart.data.datasets[0].hoverBorderColor = isDarkMode() ? 'rgba(125,211,252,0.70)' : '#2563EB';"

for name in ['budget/budget.html', 'budget/budget_maja.html']:
    p = Path(name)
    s = p.read_text()
    if s.count(old) != 1:
        raise SystemExit(f'{name}: expected one updateCharts hover border assignment, found {s.count(old)}')
    if 'hoverBorderWidth: isDarkMode() ? 4 : 5' not in s:
        raise SystemExit(f'{name}: initial themed wheel hover width missing')
    if "hoverBorderColor: isDarkMode() ? 'rgba(125,211,252,0.70)' : '#2563EB'" not in s:
        raise SystemExit(f'{name}: initial themed wheel hover color missing')
    p.write_text(s.replace(old, new, 1))
