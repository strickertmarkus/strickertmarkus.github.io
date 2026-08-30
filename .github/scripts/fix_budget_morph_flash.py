from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

old_preload = (
"        'html.finance-ui-preload-v2 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;overflow:hidden!important;position:relative!important;background:rgba(13,17,23,.96)!important;border-bottom:1px solid rgba(255,255,255,.08)!important;box-shadow:0 7px 26px rgba(0,0,0,.44)!important}' +\n"
"        'html.finance-ui-preload-v2 body .header>*{visibility:hidden!important}' +\n"
"        'html.finance-ui-preload-v2 body .header::before{display:none!important}' +\n"
"        '@media(max-width:600px){html.finance-ui-preload-v2 body .header{height:156px!important;min-height:156px!important;max-height:156px!important}}';"
)
new_preload = (
"        'html.finance-ui-preload-v2,html.finance-ui-preload-v2 body{background:#0F1219!important}' +\n"
"        'html.finance-ui-preload-v2 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;overflow:hidden!important;position:relative!important;padding:0!important;text-align:center!important;background:rgba(13,17,23,.96)!important;border-bottom:1px solid rgba(255,255,255,.08)!important;box-shadow:0 7px 26px rgba(0,0,0,.44)!important}' +\n"
"        'html.finance-ui-preload-v2 body .header>*:not(h1){visibility:hidden!important}' +\n"
"        'html.finance-ui-preload-v2 body .header>h1{visibility:visible!important;position:absolute!important;left:50%!important;top:14px!important;transform:translateX(-50%)!important;width:max-content!important;max-width:calc(100% - 112px)!important;margin:0!important;font-size:21px!important;font-weight:800!important;letter-spacing:-.45px!important;line-height:1.1!important;white-space:nowrap!important;text-align:center!important;view-transition-name:finance-title}' +\n"
"        'html.finance-ui-preload-v2 body .header::before{display:none!important}' +\n"
"        '@media(max-width:600px){html.finance-ui-preload-v2 body .header{height:156px!important;min-height:156px!important;max-height:156px!important}html.finance-ui-preload-v2 body .header>h1{top:13px!important;font-size:20px!important;max-width:calc(100% - 112px)!important}}';"
)
if old_preload not in s:
    raise SystemExit('preload block not found')
s = s.replace(old_preload, new_preload, 1)

old_morph = (
"      '@view-transition{navigation:auto}' +\n"
"      ':root{view-transition-name:none}' +\n"
"      '::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.46s!important;animation-timing-function:cubic-bezier(.22,1,.36,1)!important}' +"
)
new_morph = (
"      '@view-transition{navigation:auto}' +\n"
"      ':root{view-transition-name:none}' +\n"
"      'body .header>h1{view-transition-name:finance-title}' +\n"
"      '::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.46s!important;animation-timing-function:cubic-bezier(.22,1,.36,1)!important}' +"
)
if old_morph not in s:
    raise SystemExit('morph bootstrap block not found')
s = s.replace(old_morph, new_morph, 1)

old_target = """    if (header) {
      var h1 = header.querySelector('h1');
      var sub = header.querySelector('p');
      if (h1) h1.style.viewTransitionName = 'finance-title';
      if (sub) sub.style.viewTransitionName = 'finance-person';
    }
"""
new_target = """    if (header) {
      var sub = header.querySelector('p');
      if (sub) sub.style.viewTransitionName = 'finance-person';
    }
"""
if old_target not in s:
    raise SystemExit('header morph target block not found')
s = s.replace(old_target, new_target, 1)
ui.write_text(s)

headings = {
    'budget/budget.html': ('MARKUS BUDGETPLANERARE', 'Budgetplanerare'),
    'budget/budget_maja.html': ('MAJA BUDGETPLANERARE', 'Budgetplanerare'),
    'budget/analytics.html': ('ANALYS & STATISTIK — MARKUS', 'Analys'),
    'budget/analytics_maja.html': ('ANALYS & STATISTIK — MAJA', 'Analys'),
    'budget/familjebudget.html': ('FAMILJEBUDGET', 'Familjebudget'),
}
for name, (old_heading, new_heading) in headings.items():
    p = Path(name)
    t = p.read_text()
    if f'>{old_heading}</h1>' not in t:
        raise SystemExit(f'{name}: static heading not found')
    t = t.replace(f'>{old_heading}</h1>', f'>{new_heading}</h1>', 1)
    old_loader = 'finance-ui.js?v=20260830-finance-final-v5'
    new_loader = 'finance-ui.js?v=20260830-finance-final-v6'
    if old_loader not in t:
        raise SystemExit(f'{name}: final-v5 loader not found')
    t = t.replace(old_loader, new_loader, 1)
    p.write_text(t)
