from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

old = "      : { accent: '#3B82F6', hover: '#60A5FA', active: '#2563EB', rgb: '59,130,246', month: '#7DD3FC', monthHover: '#BAE6FD', monthActive: '#38BDF8', bgAlpha: '.125', headerAlpha: '.085', borderAlpha: '.25', glowAlpha: '.105' });"
new = "      : { accent: '#8B5CF6', hover: '#A78BFA', active: '#7C3AED', rgb: '139,92,246', month: '#C4B5FD', monthHover: '#DDD6FE', monthActive: '#A78BFA', bgAlpha: '.125', headerAlpha: '.085', borderAlpha: '.25', glowAlpha: '.105' });"
if old not in s:
    raise SystemExit('budget theme block not found')
s = s.replace(old, new, 1)
ui.write_text(s)

for name in ['budget/budget.html', 'budget/budget_maja.html']:
    p = Path(name)
    t = p.read_text()
    old_loader = 'finance-ui.js?v=20260830-finance-theme-exp-v4'
    new_loader = 'finance-ui.js?v=20260831-finance-theme-budget-violet-v1'
    if old_loader not in t:
        raise SystemExit(f'{name}: expected v4 loader not found')
    p.write_text(t.replace(old_loader, new_loader, 1))
