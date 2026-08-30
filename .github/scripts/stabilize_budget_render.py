from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

old_css = (
"      '@view-transition{navigation:auto}' +\n"
"      ':root{view-transition-name:none}' +\n"
"      '::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-month),::view-transition-group(finance-profile),::view-transition-group(finance-views),::view-transition-group(finance-menu),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.46s!important;animation-timing-function:cubic-bezier(.22,1,.36,1)!important}' +\n"
"      '::view-transition-old(*),::view-transition-new(*){mix-blend-mode:normal!important}';"
)
new_css = (
"      '@view-transition{navigation:auto}' +\n"
"      ':root{view-transition-name:none}' +\n"
"      '::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.46s!important;animation-timing-function:cubic-bezier(.22,1,.36,1)!important}' +\n"
"      '::view-transition-old(finance-title),::view-transition-new(finance-title),::view-transition-old(finance-person),::view-transition-new(finance-person),::view-transition-old(finance-panel-0),::view-transition-new(finance-panel-0),::view-transition-old(finance-panel-1),::view-transition-new(finance-panel-1),::view-transition-old(finance-panel-2),::view-transition-new(finance-panel-2){mix-blend-mode:normal!important}';"
)
if old_css not in s:
    raise SystemExit('finance morph CSS block not found')
s = s.replace(old_css, new_css, 1)

old_initial = """    buildFinanceMonthMenu();
    var selected = financeSelectedMonth(financeMonthKeys());
    if (selected) refreshFinanceMonthView(selected);
"""
new_initial = """    buildFinanceMonthMenu();
    var selected = financeSelectedMonth(financeMonthKeys());
    if (selected && !isBudget) refreshFinanceMonthView(selected);
"""
if old_initial not in s:
    raise SystemExit('initial finance month refresh block not found')
s = s.replace(old_initial, new_initial, 1)

old_targets = """    if (header) {
      var h1 = header.querySelector('h1');
      var sub = header.querySelector('p');
      var menu = header.querySelector('.nav-dropdown-wrapper');
      if (h1) h1.style.viewTransitionName = 'finance-title';
      if (sub) sub.style.viewTransitionName = 'finance-person';
      if (menu) menu.style.viewTransitionName = 'finance-menu';
    }
    var month = document.getElementById('month-nav');
    var profile = document.getElementById('finance-profile-clean-v1');
    var views = document.getElementById('finance-view-clean-v1');
    if (month) month.style.viewTransitionName = 'finance-month';
    if (profile) profile.style.viewTransitionName = 'finance-profile';
    if (views) views.style.viewTransitionName = 'finance-views';

"""
new_targets = """    if (header) {
      var h1 = header.querySelector('h1');
      var sub = header.querySelector('p');
      if (h1) h1.style.viewTransitionName = 'finance-title';
      if (sub) sub.style.viewTransitionName = 'finance-person';
    }

"""
if old_targets not in s:
    raise SystemExit('finance header morph target block not found')
s = s.replace(old_targets, new_targets, 1)
ui.write_text(s)

old_delayed_init = """// Delay chart initialization to ensure DOM is fully laid out
setTimeout(() => {
    console.log(\"Initializing charts...\");
    console.log(\"Chart.js available:\", typeof Chart !== 'undefined');
    console.log(\"pieChart canvas:\", document.getElementById(\"pieChart\"));
    console.log(\"barChart canvas:\", document.getElementById(\"barChart\"));
    try {
        initCharts();
        console.log(\"Charts initialized successfully\");
    } catch (e) {
        console.error(\"Error initializing charts:\", e);
    }
}, 500);
renderPieLegend();"""
new_delayed_init = """// Initialize charts once after the initial layout is committed.
requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        try {
            initCharts();
        } catch (e) {
            console.error(\"Error initializing charts:\", e);
        }
    });
});
renderPieLegend();"""

old_visibility = """// Handle page visibility change - properly reinitialize charts when returning
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // When page becomes visible, reinitialize charts to fix any rendering issues
        setTimeout(() => {
            try {
                // Completely destroy old charts and clear canvas contexts
                if (pieChart) {
                    pieChart.destroy();
                    pieChart = null;
                }
                if (barChart) {
                    barChart.destroy();
                    barChart = null;
                }
                
                // Clear canvas internal state by redrawing blank
                const pieCanvas = document.getElementById(\"pieChart\");
                const barCanvas = document.getElementById(\"barChart\");
                
                if (pieCanvas) {
                    const pieCtx = pieCanvas.getContext('2d');
                    if (pieCtx) {
                        pieCtx.clearRect(0, 0, pieCanvas.width, pieCanvas.height);
                    }
                }
                
                if (barCanvas) {
                    const barCtx = barCanvas.getContext('2d');
                    if (barCtx) {
                        barCtx.clearRect(0, 0, barCanvas.width, barCanvas.height);
                    }
                }
                
                // Wait a frame, then reinitialize
                requestAnimationFrame(() => {
                    initCharts();
                });
            } catch(e) {
                console.error(\"Error reinitializing charts on visibility change:\", e);
                // Fallback: just reinitialize normally
                initCharts();
            }
        }, 200);
    }
});

"""
new_visibility = """// Keep existing Chart instances when returning to the page; repaint without replaying the intro animation.
document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    requestAnimationFrame(() => {
        if (pieChart) pieChart.resize();
        if (barChart) barChart.resize();
        updateCharts();
    });
});

"""

for name in ['budget/budget.html', 'budget/budget_maja.html']:
    p = Path(name)
    t = p.read_text()

    old_month = """            if (data.currentMonth) {
                const tryMonth = new Date(data.currentMonth);
                const tryKey = getMonthKey(tryMonth);
                // Check if currentMonth still exists, if not use first available month
                if (monthlyData[tryKey]) {
                    currentMonth = tryMonth;
                } else {
                    const allKeys = Object.keys(monthlyData).sort();
                    if (allKeys.length > 0) {
                        const [y, m] = allKeys[0].split('-').map(Number);
                        currentMonth = new Date(y, m - 1, 1);
                    }
                }
            }
"""
    new_month = """            const selectedMonthKey = localStorage.getItem('selectedBudgetMonth');
            if (/^\\d{4}-\\d{2}$/.test(selectedMonthKey || '') && monthlyData[selectedMonthKey]) {
                const [y, m] = selectedMonthKey.split('-').map(Number);
                currentMonth = new Date(y, m - 1, 1);
            } else if (data.currentMonth) {
                const tryMonth = new Date(data.currentMonth);
                const tryKey = getMonthKey(tryMonth);
                // Check if currentMonth still exists, if not use first available month
                if (monthlyData[tryKey]) {
                    currentMonth = tryMonth;
                } else {
                    const allKeys = Object.keys(monthlyData).sort();
                    if (allKeys.length > 0) {
                        const [y, m] = allKeys[0].split('-').map(Number);
                        currentMonth = new Date(y, m - 1, 1);
                    }
                }
            }
"""
    if old_month not in t:
        raise SystemExit(f'{name}: current month restore block not found')
    t = t.replace(old_month, new_month, 1)

    if old_delayed_init not in t:
        raise SystemExit(f'{name}: delayed chart init block not found')
    t = t.replace(old_delayed_init, new_delayed_init, 1)

    if name.endswith('budget.html'):
        if old_visibility not in t:
            raise SystemExit(f'{name}: visibility chart reset block not found')
        t = t.replace(old_visibility, new_visibility, 1)

    p.write_text(t)

for name in [
    'budget/budget.html', 'budget/budget_maja.html',
    'budget/analytics.html', 'budget/analytics_maja.html',
    'budget/familjebudget.html'
]:
    p = Path(name)
    t = p.read_text()
    old = 'finance-ui.js?v=20260830-finance-final-v4'
    new = 'finance-ui.js?v=20260830-finance-final-v5'
    if old not in t:
        raise SystemExit(f'{name}: final-v4 loader not found')
    p.write_text(t.replace(old, new, 1))
