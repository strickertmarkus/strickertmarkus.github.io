from pathlib import Path

budget_files = ['budget/budget.html', 'budget/budget_maja.html']

initial_old = '''                backgroundColor: expenseSections.map(s => s.color),
                borderColor: expenseSections.map(s => lightenChartColor(s.color)),
                borderWidth: 2,
                borderRadius: 6,
                spacing: 1,
                hoverBorderWidth: 2,
                hoverBorderColor: expenseSections.map(s => lightenChartColor(s.color)),
                hoverOffset: 0,'''
initial_new = '''                backgroundColor: expenseSections.map(s => s.color),
                hoverBackgroundColor: expenseSections.map(s => s.color),
                borderColor: expenseSections.map(s => lightenChartColor(s.color)),
                borderWidth: 1.5,
                borderAlign: "inner",
                borderRadius: 6,
                spacing: 1,
                hoverBorderWidth: 1.5,
                hoverBorderColor: expenseSections.map(s => lightenChartColor(s.color)),
                hoverOffset: 0,'''

plugin_old = '''        },
        plugins: [{
            id: 'segmentGlow',
            afterDatasetDraw(chart) {
                if (chart._glowIndex == null || chart._glowIndex < 0) return;
                const meta = chart.getDatasetMeta(0);
                const arc = meta.data[chart._glowIndex];
                if (!arc) return;
                const ctx = chart.ctx;
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.shadowColor = chart._glowColor || 'rgba(255,255,255,0.5)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                arc.draw(ctx);
                ctx.restore();
            }
        }]
    });'''
plugin_new = '''        }
    });'''

hover_start = '''    // Per-segment hover glow: highlight only the hovered segment
    const pieCanvas = document.getElementById("pieChart");
    // Use onmousemove/onmouseleave (not addEventListener) to prevent listener accumulation on re-init
    let hoveredSegment = -1;

    pieCanvas.onmousemove = (e) => {
        if (!pieChart || !pieChart.data || !pieChart.data.datasets[0]) return;
        const elements = pieChart.getElementsAtEventForMode(e, "nearest", { intersect: true }, true);
        const newHovered = elements.length > 0 ? elements[0].index : -1;
        if (newHovered !== hoveredSegment) {
            hoveredSegment = newHovered;
            const currentSections = getCurrentMonthSections().filter(s => !s.isIncome);
            const colors = currentSections.map((s, i) => {
                if (newHovered === -1) return s.color + 'A0';
                return i === newHovered ? s.color + 'CC' : s.color + '44';
            });
            pieChart.data.datasets[0].backgroundColor = colors;
            if (newHovered >= 0 && newHovered < currentSections.length) {
                const c = currentSections[newHovered].color;
                pieChart._glowIndex = newHovered;
                pieChart._glowColor = c + '90';
            } else {
                pieChart._glowIndex = -1;
            }
            pieChart.update({ animation: false });
        }
    };
    pieCanvas.onmouseleave = () => {
        if (!pieChart || !pieChart.data || !pieChart.data.datasets[0]) return;
        hoveredSegment = -1;
        const currentSections = getCurrentMonthSections().filter(s => !s.isIncome);
        pieChart.data.datasets[0].backgroundColor = currentSections.map(s => s.color + 'A0');
        pieChart._glowIndex = -1;
        pieChart.update({ animation: false });
    };

'''

update_old = '''    pieChart.data.datasets[0].backgroundColor = expenseSections.map(s => s.color);
    pieChart.data.datasets[0].borderColor = expenseSections.map(s => lightenChartColor(s.color));
    pieChart.data.datasets[0].borderWidth = 2;
    pieChart.data.datasets[0].hoverBorderWidth = 2;
    pieChart.data.datasets[0].hoverBorderColor = expenseSections.map(s => lightenChartColor(s.color));'''
update_new = '''    pieChart.data.datasets[0].backgroundColor = expenseSections.map(s => s.color);
    pieChart.data.datasets[0].hoverBackgroundColor = expenseSections.map(s => s.color);
    pieChart.data.datasets[0].borderColor = expenseSections.map(s => lightenChartColor(s.color));
    pieChart.data.datasets[0].borderWidth = 1.5;
    pieChart.data.datasets[0].borderAlign = "inner";
    pieChart.data.datasets[0].hoverBorderWidth = 1.5;
    pieChart.data.datasets[0].hoverBorderColor = expenseSections.map(s => lightenChartColor(s.color));'''

for name in budget_files:
    p = Path(name)
    s = p.read_text()
    if s.count(initial_old) != 1:
        raise SystemExit(f'{name}: initial wheel block count {s.count(initial_old)}')
    s = s.replace(initial_old, initial_new, 1)
    if s.count(plugin_old) != 1:
        raise SystemExit(f'{name}: segmentGlow plugin block count {s.count(plugin_old)}')
    s = s.replace(plugin_old, plugin_new, 1)
    if s.count(hover_start) != 1:
        raise SystemExit(f'{name}: legacy hover block count {s.count(hover_start)}')
    s = s.replace(hover_start, '', 1)
    if s.count(update_old) != 1:
        raise SystemExit(f'{name}: update wheel block count {s.count(update_old)}')
    s = s.replace(update_old, update_new, 1)
    p.write_text(s)

ui = Path('budget/finance-ui.js')
s = ui.read_text()
old_header = "html.finance-ui-clean-v1 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;position:relative!important;padding:0!important;text-align:center!important;overflow:visible!important;"
new_header = "html.finance-ui-clean-v1 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;position:relative!important;z-index:100!important;padding:0!important;text-align:center!important;overflow:visible!important;"
if s.count(old_header) != 1:
    raise SystemExit(f'finance header style guard failed: {s.count(old_header)}')
s = s.replace(old_header, new_header, 1)
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
    s = p.read_text()
    old = 'finance-ui.js?v=20260831-finance-theme-blue-v8'
    new = 'finance-ui.js?v=20260831-finance-theme-blue-v9'
    if s.count(old) != 1:
        raise SystemExit(f'{name}: loader guard count {s.count(old)}')
    p.write_text(s.replace(old, new, 1))
