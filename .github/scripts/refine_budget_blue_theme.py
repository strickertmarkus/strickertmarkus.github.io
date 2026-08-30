from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

old_theme = """  var financeTheme = view === 'analysis'
    ? { accent: '#4ADE80', hover: '#86EFAC', active: '#22C55E', rgb: '74,222,128' }
    : (view === 'family'
      ? { accent: '#FB923C', hover: '#FDBA74', active: '#F97316', rgb: '251,146,60' }
      : { accent: '#60A5FA', hover: '#93C5FD', active: '#3B82F6', rgb: '96,165,250' });
  document.documentElement.dataset.financeView = view;
  document.documentElement.style.setProperty('--finance-accent', financeTheme.accent);
  document.documentElement.style.setProperty('--finance-accent-hover', financeTheme.hover);
  document.documentElement.style.setProperty('--finance-accent-active', financeTheme.active);
  document.documentElement.style.setProperty('--finance-accent-rgb', financeTheme.rgb);
"""
new_theme = """  var financeTheme = view === 'analysis'
    ? { accent: '#4ADE80', hover: '#86EFAC', active: '#22C55E', rgb: '74,222,128', month: '#4ADE80', monthHover: '#86EFAC', monthActive: '#22C55E', bgAlpha: '.085', headerAlpha: '.06', borderAlpha: '.20', glowAlpha: '.075' }
    : (view === 'family'
      ? { accent: '#FB923C', hover: '#FDBA74', active: '#F97316', rgb: '251,146,60', month: '#FB923C', monthHover: '#FDBA74', monthActive: '#F97316', bgAlpha: '.085', headerAlpha: '.06', borderAlpha: '.20', glowAlpha: '.075' }
      : { accent: '#3B82F6', hover: '#60A5FA', active: '#2563EB', rgb: '59,130,246', month: '#7DD3FC', monthHover: '#BAE6FD', monthActive: '#38BDF8', bgAlpha: '.125', headerAlpha: '.085', borderAlpha: '.25', glowAlpha: '.105' });
  document.documentElement.dataset.financeView = view;
  document.documentElement.style.setProperty('--finance-accent', financeTheme.accent);
  document.documentElement.style.setProperty('--finance-accent-hover', financeTheme.hover);
  document.documentElement.style.setProperty('--finance-accent-active', financeTheme.active);
  document.documentElement.style.setProperty('--finance-accent-rgb', financeTheme.rgb);
  document.documentElement.style.setProperty('--finance-month-accent', financeTheme.month);
  document.documentElement.style.setProperty('--finance-month-hover', financeTheme.monthHover);
  document.documentElement.style.setProperty('--finance-month-active', financeTheme.monthActive);
  document.documentElement.style.setProperty('--finance-theme-bg-alpha', financeTheme.bgAlpha);
  document.documentElement.style.setProperty('--finance-theme-header-alpha', financeTheme.headerAlpha);
  document.documentElement.style.setProperty('--finance-theme-border-alpha', financeTheme.borderAlpha);
  document.documentElement.style.setProperty('--finance-theme-glow-alpha', financeTheme.glowAlpha);
"""
if old_theme not in s:
    raise SystemExit('finance theme block not found')
s = s.replace(old_theme, new_theme, 1)

replacements = {
    "rgba(var(--finance-accent-rgb),.10),transparent 66%": "rgba(var(--finance-accent-rgb),var(--finance-theme-bg-alpha)),transparent 66%",
    "rgba(var(--finance-accent-rgb),.055))!important;border-bottom:1px solid rgba(var(--finance-accent-rgb),.18)!important;box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 22px rgba(var(--finance-accent-rgb),.07)!important": "rgba(var(--finance-accent-rgb),var(--finance-theme-header-alpha)))!important;border-bottom:1px solid rgba(var(--finance-accent-rgb),var(--finance-theme-border-alpha))!important;box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 22px rgba(var(--finance-accent-rgb),var(--finance-theme-glow-alpha))!important",
    "rgba(var(--finance-accent-rgb),.085),transparent 67%": "rgba(var(--finance-accent-rgb),var(--finance-theme-bg-alpha)),transparent 67%",
    "rgba(var(--finance-accent-rgb),.06))!important;border-bottom:1px solid rgba(var(--finance-accent-rgb),.20)!important;box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 24px rgba(var(--finance-accent-rgb),.075)!important": "rgba(var(--finance-accent-rgb),var(--finance-theme-header-alpha)))!important;border-bottom:1px solid rgba(var(--finance-accent-rgb),var(--finance-theme-border-alpha))!important;box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 24px rgba(var(--finance-accent-rgb),var(--finance-theme-glow-alpha))!important",
    "color:var(--finance-accent)!important;font:680 15px/1 Inter,sans-serif": "color:var(--finance-month-accent)!important;font:680 15px/1 Inter,sans-serif",
    "text-shadow:0 2px 10px rgba(var(--finance-accent-rgb),.14)!important": "text-shadow:0 2px 10px color-mix(in srgb,var(--finance-month-accent) 18%,transparent)!important",
    "#month-dropdown:hover{color:var(--finance-accent-hover)!important}html.finance-ui-clean-v1 body .header #month-dropdown:active{color:var(--finance-accent-active)!important": "#month-dropdown:hover{color:var(--finance-month-hover)!important}html.finance-ui-clean-v1 body .header #month-dropdown:active{color:var(--finance-month-active)!important",
}
for old, new in replacements.items():
    if old not in s:
        raise SystemExit('expected CSS fragment not found: ' + old[:70])
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
    old = 'finance-ui.js?v=20260830-finance-theme-exp-v2'
    new = 'finance-ui.js?v=20260830-finance-theme-exp-v3'
    if old not in t:
        raise SystemExit(f'{name}: v2 loader not found')
    p.write_text(t.replace(old, new, 1))
