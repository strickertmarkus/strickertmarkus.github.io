from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

anchor = "  var user = (page.budgetMaja || page.analysisMaja) ? 'maja' : 'markus';\n"
insert = """  var user = (page.budgetMaja || page.analysisMaja) ? 'maja' : 'markus';

  var financeTheme = view === 'analysis'
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
if anchor not in s:
    raise SystemExit('theme anchor not found')
s = s.replace(anchor, insert, 1)

old_pre_bg = "        'html.finance-ui-preload-v2,html.finance-ui-preload-v2 body{background:#0F1219!important}' +\n"
new_pre_bg = "        'html.finance-ui-preload-v2,html.finance-ui-preload-v2 body{background:radial-gradient(760px 300px at 50% -90px,rgba(var(--finance-accent-rgb),.10),transparent 66%),#0F1219!important}' +\n"
if old_pre_bg not in s:
    raise SystemExit('preload background not found')
s = s.replace(old_pre_bg, new_pre_bg, 1)

old_pre_header = "        'html.finance-ui-preload-v2 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;overflow:hidden!important;position:relative!important;padding:0!important;text-align:center!important;background:rgba(13,17,23,.96)!important;border-bottom:1px solid rgba(255,255,255,.08)!important;box-shadow:0 7px 26px rgba(0,0,0,.44)!important}' +\n"
new_pre_header = "        'html.finance-ui-preload-v2 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;overflow:hidden!important;position:relative!important;padding:0!important;text-align:center!important;background:linear-gradient(180deg,rgba(13,17,23,.985),rgba(var(--finance-accent-rgb),.055))!important;border-bottom:1px solid rgba(var(--finance-accent-rgb),.18)!important;box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 22px rgba(var(--finance-accent-rgb),.07)!important}' +\n"
if old_pre_header not in s:
    raise SystemExit('preload header not found')
s = s.replace(old_pre_header, new_pre_header, 1)

old_header = "      'html.finance-ui-clean-v1 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;position:relative!important;padding:0!important;text-align:center!important;overflow:visible!important;background:rgba(13,17,23,.96)!important;border-bottom:1px solid rgba(255,255,255,.08)!important;box-shadow:0 7px 26px rgba(0,0,0,.44)!important;backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important}' +\n"
new_header = "      'html.finance-ui-clean-v1 body{background:radial-gradient(900px 380px at 50% -110px,rgba(var(--finance-accent-rgb),.085),transparent 67%),#0F1219!important}' +\n      'html.finance-ui-clean-v1 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;position:relative!important;padding:0!important;text-align:center!important;overflow:visible!important;background:linear-gradient(180deg,rgba(13,17,23,.985),rgba(var(--finance-accent-rgb),.06))!important;border-bottom:1px solid rgba(var(--finance-accent-rgb),.20)!important;box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 24px rgba(var(--finance-accent-rgb),.075)!important;backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important}' +\n"
if old_header not in s:
    raise SystemExit('main header not found')
s = s.replace(old_header, new_header, 1)

old_month = "color:#FB923C!important;font:680 15px/1 Inter,sans-serif!important;"
new_month = "color:var(--finance-accent)!important;font:680 15px/1 Inter,sans-serif!important;"
if old_month not in s:
    raise SystemExit('month accent not found')
s = s.replace(old_month, new_month, 1)

old_hover = "html.finance-ui-clean-v1 body .header #month-dropdown:hover{color:#FDBA74!important}html.finance-ui-clean-v1 body .header #month-dropdown:active{color:#F97316!important;opacity:.88!important}"
new_hover = "html.finance-ui-clean-v1 body .header #month-dropdown:hover{color:var(--finance-accent-hover)!important}html.finance-ui-clean-v1 body .header #month-dropdown:active{color:var(--finance-accent-active)!important;opacity:.88!important}"
if old_hover not in s:
    raise SystemExit('month hover/active accent not found')
s = s.replace(old_hover, new_hover, 1)

marker = "      '@keyframes financeMonthMenuInCleanV1{from{opacity:0;transform:translate(-50%,-8px) scale(.98)}to{opacity:1;transform:translate(-50%,0) scale(1)}}' +\n"
theme_css = marker + "      'html.finance-ui-clean-v1 body .container .kpi-card,html.finance-ui-clean-v1 body .container .stat-card,html.finance-ui-clean-v1 body .container .chart-card,html.finance-ui-clean-v1 body .container .card,html.finance-ui-clean-v1 body .container .savings-goals-section,html.finance-ui-clean-v1 body .container>.section-card{outline:1px solid rgba(var(--finance-accent-rgb),.075)!important;outline-offset:-1px!important}' +\n      'html.finance-ui-clean-v1 body .container>.kpi-row,html.finance-ui-clean-v1 body .container>.grid-4,html.finance-ui-clean-v1 body .container>.kpi-grid{filter:drop-shadow(0 10px 26px rgba(var(--finance-accent-rgb),.025))}' +\n"
if marker not in s:
    raise SystemExit('theme css insertion marker not found')
s = s.replace(marker, theme_css, 1)

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
    old = 'finance-ui.js?v=20260830-finance-final-v6'
    new = 'finance-ui.js?v=20260830-finance-theme-exp-v1'
    if old not in t:
        raise SystemExit(f'{name}: v6 loader not found')
    p.write_text(t.replace(old, new, 1))
