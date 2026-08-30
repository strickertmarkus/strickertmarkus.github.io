from pathlib import Path

ui = Path('budget/finance-ui.js')
s = ui.read_text()

old_arrow = "      '.finance-month-arrow-clean-v1{appearance:none!important;width:32px!important;height:32px!important;flex:0 0 32px!important;margin:0!important;padding:0!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:8px!important;background:rgba(255,255,255,.04)!important;color:#F0F6FC!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;font:500 14px/1 Inter,sans-serif!important;box-shadow:none!important;transition:background .2s!important;-webkit-tap-highlight-color:transparent}' +\n      '.finance-month-arrow-clean-v1:hover:not(:disabled){background:rgba(255,255,255,.07)!important}.finance-month-arrow-clean-v1:active:not(:disabled){background:rgba(255,255,255,.07)!important}.finance-month-arrow-clean-v1:disabled{opacity:.22!important;cursor:default!important}' +\n"
new_arrow = "      '.finance-month-arrow-clean-v1{appearance:none!important;width:32px!important;height:32px!important;flex:0 0 32px!important;margin:0!important;padding:0!important;border:1px solid rgba(var(--finance-accent-rgb),.34)!important;border-radius:8px!important;background:linear-gradient(180deg,rgba(var(--finance-accent-rgb),.105),rgba(var(--finance-accent-rgb),.055))!important;color:var(--finance-month-accent)!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;font:650 15px/1 Inter,sans-serif!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 13px rgba(var(--finance-accent-rgb),.10)!important;text-shadow:0 0 10px rgba(var(--finance-accent-rgb),.28)!important;transition:background .16s,border-color .16s,box-shadow .16s,color .16s,transform .1s!important;-webkit-tap-highlight-color:transparent}' +\n      '.finance-month-arrow-clean-v1:hover:not(:disabled){background:rgba(var(--finance-accent-rgb),.15)!important;border-color:rgba(var(--finance-accent-rgb),.52)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 0 17px rgba(var(--finance-accent-rgb),.18)!important;color:var(--finance-month-hover)!important}.finance-month-arrow-clean-v1:active:not(:disabled){transform:scale(.96)!important;background:rgba(var(--finance-accent-rgb),.18)!important;color:var(--finance-month-active)!important}.finance-month-arrow-clean-v1:disabled{opacity:.20!important;cursor:default!important;box-shadow:none!important}' +\n"
if old_arrow not in s:
    raise SystemExit('month arrow block not found')
s = s.replace(old_arrow, new_arrow, 1)

anchor = "      'html.finance-ui-clean-v1 body .container>.kpi-row,html.finance-ui-clean-v1 body .container>.grid-4,html.finance-ui-clean-v1 body .container>.kpi-grid{filter:drop-shadow(0 10px 26px rgba(var(--finance-accent-rgb),.025))}' +\n"
if anchor not in s:
    raise SystemExit('theme card anchor not found')
control_css = (
"      'html.finance-ui-clean-v1 body .header>.nav-dropdown-wrapper>button{border-color:rgba(var(--finance-accent-rgb),.30)!important;background:rgba(var(--finance-accent-rgb),.075)!important;color:var(--finance-accent-hover)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 0 13px rgba(var(--finance-accent-rgb),.08)!important;transition:background .16s,border-color .16s,box-shadow .16s,color .16s,transform .1s!important}' +\n"
"      'html.finance-ui-clean-v1 body .header>.nav-dropdown-wrapper>button:hover{background:rgba(var(--finance-accent-rgb),.13)!important;border-color:rgba(var(--finance-accent-rgb),.46)!important;color:var(--finance-accent-hover)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 0 17px rgba(var(--finance-accent-rgb),.14)!important}' +\n"
"      'html.finance-ui-clean-v1 body .container .month-btn{background:linear-gradient(180deg,rgba(var(--finance-accent-rgb),.12),rgba(var(--finance-accent-rgb),.065))!important;border:1px solid rgba(var(--finance-accent-rgb),.38)!important;color:var(--finance-accent-hover)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 14px rgba(var(--finance-accent-rgb),.10)!important;text-shadow:0 0 10px rgba(var(--finance-accent-rgb),.28)!important;transition:background .16s,border-color .16s,box-shadow .16s,color .16s,transform .1s!important}' +\n"
"      'html.finance-ui-clean-v1 body .container .month-btn:hover{opacity:1!important;transform:translateY(-1px)!important;background:rgba(var(--finance-accent-rgb),.17)!important;border-color:rgba(var(--finance-accent-rgb),.58)!important;color:var(--finance-accent-hover)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 0 19px rgba(var(--finance-accent-rgb),.18)!important}html.finance-ui-clean-v1 body .container .month-btn:active{transform:scale(.96)!important;background:rgba(var(--finance-accent-rgb),.20)!important;color:var(--finance-accent-active)!important}' +\n"
"      'html.finance-ui-clean-v1 body .container .month-display{color:var(--finance-accent-hover)!important;text-shadow:0 0 12px rgba(var(--finance-accent-rgb),.12)!important}' +\n"
"      'html.finance-ui-clean-v1 body .container>.month-selector{border:1px solid rgba(var(--finance-accent-rgb),.14)!important;background:linear-gradient(180deg,rgba(var(--finance-accent-rgb),.045),rgba(var(--finance-accent-rgb),.018)),var(--card)!important;box-shadow:0 2px 8px rgba(0,0,0,.12),0 0 20px rgba(var(--finance-accent-rgb),.045)!important}' +\n"
"      'html.finance-ui-clean-v1 body .container .btn-add{border:1px solid rgba(var(--finance-accent-rgb),.28)!important;background:rgba(var(--finance-accent-rgb),.035)!important;color:var(--finance-accent-hover)!important;box-shadow:0 0 12px rgba(var(--finance-accent-rgb),.045)!important}' +\n"
"      'html.finance-ui-clean-v1 body .container .btn-add:hover{border-color:rgba(var(--finance-accent-rgb),.52)!important;background:rgba(var(--finance-accent-rgb),.09)!important;color:var(--finance-accent-hover)!important;box-shadow:0 0 17px rgba(var(--finance-accent-rgb),.11)!important}' +\n"
"      'html.finance-ui-clean-v1 body .container .table-collapse-btn{padding:6px 9px!important;border:1px solid rgba(var(--finance-accent-rgb),.22)!important;border-radius:8px!important;background:rgba(var(--finance-accent-rgb),.035)!important;color:var(--finance-accent-hover)!important;box-shadow:0 0 10px rgba(var(--finance-accent-rgb),.035)!important}' +\n"
"      'html.finance-ui-clean-v1 body .container .table-collapse-btn:hover{opacity:1!important;border-color:rgba(var(--finance-accent-rgb),.42)!important;background:rgba(var(--finance-accent-rgb),.08)!important;box-shadow:0 0 15px rgba(var(--finance-accent-rgb),.09)!important}' +\n"
"      'html.finance-ui-clean-v1 body .modal-btn-primary{background:rgba(var(--finance-accent-rgb),.17)!important;border:1px solid rgba(var(--finance-accent-rgb),.46)!important;color:var(--finance-accent-hover)!important;box-shadow:0 0 15px rgba(var(--finance-accent-rgb),.10)!important}' +\n"
"      'html.finance-ui-clean-v1 body .modal-btn-primary:hover{filter:none!important;background:rgba(var(--finance-accent-rgb),.24)!important;border-color:rgba(var(--finance-accent-rgb),.62)!important;box-shadow:0 0 20px rgba(var(--finance-accent-rgb),.16)!important}' +\n"
)
s = s.replace(anchor, anchor + control_css, 1)
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
    old = 'finance-ui.js?v=20260830-finance-theme-exp-v3'
    new = 'finance-ui.js?v=20260830-finance-theme-exp-v4'
    if old not in t:
        raise SystemExit(f'{name}: v3 loader not found')
    p.write_text(t.replace(old, new, 1))
