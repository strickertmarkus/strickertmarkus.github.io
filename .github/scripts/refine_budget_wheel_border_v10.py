from pathlib import Path

files = ['budget/budget.html', 'budget/budget_maja.html']

helper = '''function lightenChartColor(hex, amount = 0.10) {
    const value = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(value)) return hex;
    const rgb = parseInt(value, 16);
    const mix = channel => Math.round(channel + (255 - channel) * amount);
    const r = mix((rgb >> 16) & 255);
    const g = mix((rgb >> 8) & 255);
    const b = mix(rgb & 255);
    return `rgb(${r}, ${g}, ${b})`;
}

'''

for name in files:
    p = Path(name)
    s = p.read_text()

    anchor = 'let pieChart, barChart;\nlet showComparisonMode = false;\n\n'
    if helper not in s:
        if s.count(anchor) != 1:
            raise SystemExit(f'{name}: chart helper anchor count {s.count(anchor)}')
        s = s.replace(anchor, anchor + helper, 1)

    initial_old = '''                backgroundColor: expenseSections.map(s => s.color),
                borderColor: isDarkMode() ? "#0B0F16" : "#FFFFFF",
                borderWidth: 4,
                borderRadius: 6,
                spacing: 1,
                hoverBorderWidth: 4,
                hoverBorderColor: isDarkMode() ? "#0B0F16" : "#FFFFFF",
                hoverOffset: 0,'''
    initial_new = '''                backgroundColor: expenseSections.map(s => s.color),
                borderColor: expenseSections.map(s => lightenChartColor(s.color)),
                borderWidth: 2,
                borderRadius: 6,
                spacing: 1,
                hoverBorderWidth: 2,
                hoverBorderColor: expenseSections.map(s => lightenChartColor(s.color)),
                hoverOffset: 0,'''
    if s.count(initial_old) != 1:
        raise SystemExit(f'{name}: initial wheel block count {s.count(initial_old)}')
    s = s.replace(initial_old, initial_new, 1)

    update_old = '''    pieChart.data.datasets[0].borderColor = isDarkMode() ? "#0B0F16" : "#FFFFFF";
    pieChart.data.datasets[0].borderWidth = 4;
    pieChart.data.datasets[0].hoverBorderWidth = 4;
    pieChart.data.datasets[0].hoverBorderColor = isDarkMode() ? "#0B0F16" : "#FFFFFF";'''
    update_new = '''    pieChart.data.datasets[0].borderColor = expenseSections.map(s => lightenChartColor(s.color));
    pieChart.data.datasets[0].borderWidth = 2;
    pieChart.data.datasets[0].hoverBorderWidth = 2;
    pieChart.data.datasets[0].hoverBorderColor = expenseSections.map(s => lightenChartColor(s.color));'''
    if s.count(update_old) != 1:
        raise SystemExit(f'{name}: update wheel block count {s.count(update_old)}')
    s = s.replace(update_old, update_new, 1)

    p.write_text(s)
