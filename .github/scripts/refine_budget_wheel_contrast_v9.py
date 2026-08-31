from pathlib import Path

files = ['budget/budget.html', 'budget/budget_maja.html']

for name in files:
    p = Path(name)
    s = p.read_text()

    color_old = "expenseSections.map(s => s.color + 'C0')"
    if s.count(color_old) != 2:
        raise SystemExit(f'{name}: expected two C0 wheel color expressions, found {s.count(color_old)}')
    s = s.replace(color_old, "expenseSections.map(s => s.color)")

    initial_old = '''                borderColor: isDarkMode() ? "#1A1F2E" : "#FFFFFF",
                borderWidth: isDarkMode() ? 3 : 4,
                borderRadius: 6,
                spacing: 1,
                hoverBorderWidth: 0,
                hoverBorderColor: 'transparent',
                hoverOffset: 0,'''
    initial_new = '''                borderColor: isDarkMode() ? "#0B0F16" : "#FFFFFF",
                borderWidth: 4,
                borderRadius: 6,
                spacing: 1,
                hoverBorderWidth: 4,
                hoverBorderColor: isDarkMode() ? "#0B0F16" : "#FFFFFF",
                hoverOffset: 0,'''
    if s.count(initial_old) != 1:
        raise SystemExit(f'{name}: initial wheel border block count {s.count(initial_old)}')
    s = s.replace(initial_old, initial_new, 1)

    update_old = '''    pieChart.data.datasets[0].borderColor = isDarkMode() ? "#1A1F2E" : "#FFFFFF";
    pieChart.data.datasets[0].hoverBorderColor = isDarkMode() ? "#2A3041" : "#FFFFFF";'''
    update_new = '''    pieChart.data.datasets[0].borderColor = isDarkMode() ? "#0B0F16" : "#FFFFFF";
    pieChart.data.datasets[0].borderWidth = 4;
    pieChart.data.datasets[0].hoverBorderWidth = 4;
    pieChart.data.datasets[0].hoverBorderColor = isDarkMode() ? "#0B0F16" : "#FFFFFF";'''
    if s.count(update_old) != 1:
        raise SystemExit(f'{name}: update wheel border block count {s.count(update_old)}')
    s = s.replace(update_old, update_new, 1)

    p.write_text(s)
