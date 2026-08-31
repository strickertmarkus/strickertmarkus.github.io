from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()
old = "      ? { accent: '#FB923C', hover: '#FDBA74', active: '#F97316', rgb: '251,146,60', month: '#FB923C', monthHover: '#FDBA74', monthActive: '#F97316', bgAlpha: '.085', headerAlpha: '.06', borderAlpha: '.20', glowAlpha: '.075' }"
new = "      ? { accent: '#FBBF24', hover: '#FCD34D', active: '#F59E0B', rgb: '251,191,36', month: '#FBBF24', monthHover: '#FCD34D', monthActive: '#F59E0B', bgAlpha: '.082', headerAlpha: '.055', borderAlpha: '.19', glowAlpha: '.070' }"
if old not in s:
    raise SystemExit('family theme block not found')
s = s.replace(old, new, 1)
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
    t = p.read_text()
    old_loader = 'finance-ui.js?v=20260830-finance-theme-exp-v4'
    new_loader = 'finance-ui.js?v=20260831-finance-theme-exp-v5'
    if old_loader not in t:
        raise SystemExit(f'{name}: v4 loader not found')
    p.write_text(t.replace(old_loader, new_loader, 1))
