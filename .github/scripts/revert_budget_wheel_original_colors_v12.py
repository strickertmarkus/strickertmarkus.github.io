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

old_initial = '''                backgroundColor: expenseSections.map(s => s.color),
                hoverBackgroundColor: expenseSections.map(s => s.color),
                borderColor: expenseSections.map(s => lightenChartColor(s.color)),
                borderWidth: 1.5,
                borderAlign: "inner",
                borderRadius: 6,
                spacing: 1,
                hoverBorderWidth: 1.5,
                hoverBorderColor: expenseSections.map(s => lightenChartColor(s.color)),
                hoverOffset: 0,'''

new_initial = '''                backgroundColor: expenseSections.map(s => s.color + 'A0'),
                hoverBackgroundColor: expenseSections.map(s => s.color + 'A0'),
                borderColor: isDarkMode() ? "#1A1F2E" : "#FFFFFF",
                borderWidth: isDarkMode() ? 3 : 4,
                borderRadius: 6,
                spacing: 1,
                hoverBorderWidth: 0,
                hoverBorderColor: 'transparent',
                hoverOffset: 0,'''

old_update = '''    pieChart.data.datasets[0].backgroundColor = expenseSections.map(s => s.color);
    pieChart.data.datasets[0].hoverBackgroundColor = expenseSections.map(s => s.color);
    pieChart.data.datasets[0].borderColor = expenseSections.map(s => lightenChartColor(s.color));
    pieChart.data.datasets[0].borderWidth = 1.5;
    pieChart.data.datasets[0].borderAlign = "inner";
    pieChart.data.datasets[0].hoverBorderWidth = 1.5;
    pieChart.data.datasets[0].hoverBorderColor = expenseSections.map(s => lightenChartColor(s.color));'''

new_update = '''    pieChart.data.datasets[0].backgroundColor = expenseSections.map(s => s.color + 'A0');
    pieChart.data.datasets[0].hoverBackgroundColor = expenseSections.map(s => s.color + 'A0');
    pieChart.data.datasets[0].borderColor = isDarkMode() ? "#1A1F2E" : "#FFFFFF";
    pieChart.data.datasets[0].borderWidth = isDarkMode() ? 3 : 4;
    pieChart.data.datasets[0].hoverBorderWidth = 0;
    pieChart.data.datasets[0].hoverBorderColor = 'transparent';'''

for name in files:
    p = Path(name)
    s = p.read_text()

    if s.count(old_initial) != 1:
        raise SystemExit(f'{name}: initial wheel block count {s.count(old_initial)}')
    s = s.replace(old_initial, new_initial, 1)

    if s.count(old_update) != 1:
        raise SystemExit(f'{name}: update wheel block count {s.count(old_update)}')
    s = s.replace(old_update, new_update, 1)

    if helper in s:
        s = s.replace(helper, '', 1)

    p.write_text(s)
