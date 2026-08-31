from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

old = "      : { accent: '#3B82F6', hover: '#60A5FA', active: '#2563EB', rgb: '59,130,246', month: '#7DD3FC', monthHover: '#BAE6FD', monthActive: '#38BDF8', bgAlpha: '.125', headerAlpha: '.085', borderAlpha: '.25', glowAlpha: '.105' });"
new = "      : { accent: '#F87171', hover: '#FCA5A5', active: '#EF4444', rgb: '248,113,113', month: '#FB7185', monthHover: '#FDA4AF', monthActive: '#F43F5E', bgAlpha: '.105', headerAlpha: '.072', borderAlpha: '.23', glowAlpha: '.09' });"
if old not in s:
    raise SystemExit('current blue Budget theme block not found')
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
    new_loader = 'finance-ui.js?v=20260831-finance-theme-red-v5'
    if old_loader not in t:
        raise SystemExit(f'{name}: v4 loader not found')
    p.write_text(t.replace(old_loader, new_loader, 1))
