from pathlib import Path
import re

ui = Path('budget/finance-ui.js')
s = ui.read_text()

marker = "  var TRANSITION_KEY = 'finance-view-transition-clean-v1';\n"
preload = r'''  var TRANSITION_KEY = 'finance-view-transition-clean-v1';
  var financePreloadTimer = 0;

  function releaseFinancePreload() {
    if (financePreloadTimer) {
      clearTimeout(financePreloadTimer);
      financePreloadTimer = 0;
    }
    document.documentElement.classList.remove('finance-ui-preload-v2');
  }

  function installFinancePreload() {
    document.documentElement.classList.add('finance-ui-preload-v2');
    if (!document.getElementById('finance-ui-preload-v2-style')) {
      var critical = document.createElement('style');
      critical.id = 'finance-ui-preload-v2-style';
      critical.textContent =
        'html.finance-ui-preload-v2 body .header{height:122px!important;min-height:122px!important;max-height:122px!important;overflow:hidden!important;position:relative!important;background:linear-gradient(135deg,#0B0F1A,#151C2C)!important;box-shadow:0 4px 30px rgba(0,0,0,.5)!important}' +
        'html.finance-ui-preload-v2 body .header>*{visibility:hidden!important}' +
        'html.finance-ui-preload-v2 body .header::before{display:none!important}' +
        '@media(max-width:600px){html.finance-ui-preload-v2 body .header{height:116px!important;min-height:116px!important;max-height:116px!important}}';
      document.head.appendChild(critical);
    }
    financePreloadTimer = setTimeout(releaseFinancePreload, 1400);
  }

  installFinancePreload();
'''
if marker not in s:
    raise SystemExit('transition marker not found')
s = s.replace(marker, preload, 1)

old = "      'html.finance-ui-clean-v1 body .header>#month-nav{position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:9px!important;transform:translateX(-50%)!important;margin:0!important;padding:0!important;height:29px!important;width:max-content!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-wrap:nowrap!important;gap:4px!important;z-index:8!important}' +\n"
new = "      'html.finance-ui-clean-v1 body .header>#month-nav{position:absolute!important;left:50%!important;right:auto!important;top:auto!important;bottom:9px!important;transform:translateX(-50%)!important;margin:0!important;padding:3px!important;height:35px!important;width:max-content!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-wrap:nowrap!important;gap:0!important;z-index:8!important;border:1px solid rgba(255,255,255,.15)!important;border-radius:18px!important;background:rgba(255,255,255,.055)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 4px 16px rgba(0,0,0,.12)!important;backdrop-filter:blur(9px)!important;-webkit-backdrop-filter:blur(9px)!important}' +\n"
if old not in s: raise SystemExit('month nav css not found')
s = s.replace(old, new, 1)

old = "      'html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper{position:relative!important;display:block!important;flex:0 0 auto!important;height:29px!important}' +\n"
new = "      'html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper{position:relative!important;display:block!important;flex:0 0 90px!important;width:90px!important;height:29px!important}' +\n      'html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper::after{content:\"\";position:absolute;right:7px;top:10px;width:5px;height:5px;border-right:1.5px solid #64748B;border-bottom:1.5px solid #64748B;transform:rotate(45deg);pointer-events:none}' +\n"
if old not in s: raise SystemExit('month wrapper css not found')
s = s.replace(old, new, 1)

old = "      'html.finance-ui-clean-v1 body .header #month-dropdown{appearance:none!important;height:29px!important;width:82px!important;min-width:82px!important;margin:0!important;padding:0 17px 0 6px!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:8px!important;background:rgba(255,255,255,.04)!important;color:#F0F6FC!important;font:700 9px/1 Inter,sans-serif!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;text-align:center!important;box-shadow:none!important;background-image:url(\"data:image/svg+xml,%3Csvg fill=%22%238B949E%22 height=%2216%22 viewBox=%220 0 24 24%22 width=%2216%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M7 10l5 5 5-5z%22/%3E%3C/svg%3E\")!important;background-repeat:no-repeat!important;background-position:right 3px center!important;background-size:12px!important;transform:none!important}' +\n"
new = "      'html.finance-ui-clean-v1 body .header #month-dropdown{appearance:none!important;height:29px!important;width:90px!important;min-width:90px!important;margin:0!important;padding:0 16px 0 5px!important;border:0!important;border-radius:12px!important;background:transparent!important;background-image:none!important;color:#F0F6FC!important;font:700 10px/1 Inter,sans-serif!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;text-align:center!important;box-shadow:none!important;transform:none!important;cursor:pointer!important}' +\n      'html.finance-ui-clean-v1 body .header #month-dropdown:active{background:rgba(255,255,255,.055)!important}' +\n"
if old not in s: raise SystemExit('month dropdown css not found')
s = s.replace(old, new, 1)

old = "      '.finance-month-arrow-clean-v1{appearance:none!important;width:25px!important;height:29px!important;flex:0 0 25px!important;margin:0!important;padding:0!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:8px!important;background:rgba(255,255,255,.04)!important;color:#F0F6FC!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;-webkit-tap-highlight-color:transparent}' +\n"
new = "      '.finance-month-arrow-clean-v1{appearance:none!important;width:27px!important;height:29px!important;flex:0 0 27px!important;margin:0!important;padding:0!important;border:0!important;border-radius:14px!important;background:transparent!important;color:#94A3B8!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;font:500 21px/1 Inter,sans-serif!important;-webkit-tap-highlight-color:transparent}' +\n"
if old not in s: raise SystemExit('month arrow css not found')
s = s.replace(old, new, 1)

old = "      '.finance-month-arrow-clean-v1 svg{width:12px!important;height:12px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.1!important;stroke-linecap:round!important;stroke-linejoin:round!important}' +\n"
if old not in s: raise SystemExit('month svg css not found')
s = s.replace(old, '', 1)

old = "      '.finance-month-arrow-clean-v1:active:not(:disabled){transform:scale(.94)}.finance-month-arrow-clean-v1:disabled{opacity:.26!important;cursor:default!important}' +\n"
new = "      '.finance-month-arrow-clean-v1:active:not(:disabled){background:rgba(255,255,255,.07)!important;transform:scale(.94)}.finance-month-arrow-clean-v1:disabled{opacity:.22!important;cursor:default!important}' +\n"
if old not in s: raise SystemExit('month arrow state css not found')
s = s.replace(old, new, 1)

old = "html.finance-ui-clean-v1 body .header>#month-nav{bottom:8px!important;height:28px!important;gap:3px!important}html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper{height:28px!important}html.finance-ui-clean-v1 body .header #month-dropdown{height:28px!important;width:76px!important;min-width:76px!important;font-size:8.4px!important}.finance-month-arrow-clean-v1{width:23px!important;height:28px!important;flex-basis:23px!important}"
new = "html.finance-ui-clean-v1 body .header>#month-nav{bottom:8px!important;height:34px!important;padding:3px!important;border-radius:17px!important;gap:0!important}html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper{height:28px!important;width:76px!important;flex-basis:76px!important}html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper::after{right:5px!important;top:9px!important;width:4px!important;height:4px!important}html.finance-ui-clean-v1 body .header #month-dropdown{height:28px!important;width:76px!important;min-width:76px!important;padding:0 11px 0 3px!important;font-size:9px!important}.finance-month-arrow-clean-v1{width:22px!important;height:28px!important;flex-basis:22px!important;font-size:19px!important}"
if old not in s: raise SystemExit('mobile month css not found')
s = s.replace(old, new, 1)

old = "html.finance-ui-clean-v1 body .header #month-dropdown{width:68px!important;min-width:68px!important;font-size:7.8px!important}.finance-month-arrow-clean-v1{width:21px!important;flex-basis:21px!important}"
new = "html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper{width:70px!important;flex-basis:70px!important}html.finance-ui-clean-v1 body .header #month-dropdown{width:70px!important;min-width:70px!important;font-size:8.5px!important}.finance-month-arrow-clean-v1{width:20px!important;flex-basis:20px!important}"
if old not in s: raise SystemExit('tiny month css not found')
s = s.replace(old, new, 1)

pattern = re.compile(r"  function arrow\(id, label, d, delta\) \{.*?\n  \}\n", re.S)
replacement = r'''  function arrow(id, label, glyph, delta) {
    var button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.className = 'finance-month-arrow-clean-v1';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.textContent = glyph;
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      stepMonth(delta);
    });
    return button;
  }
'''
s, count = pattern.subn(replacement, s, count=1)
if count != 1: raise SystemExit('arrow function not replaced')

old = "    nav.insertBefore(arrow('finance-month-prev-clean-v1','Föregående månad','M15 18l-6-6 6-6',-1), wrapper);\n    nav.appendChild(arrow('finance-month-next-clean-v1','Nästa månad','M9 6l6 6-6 6',1));"
new = "    nav.insertBefore(arrow('finance-month-prev-clean-v1','Föregående månad','‹',-1), wrapper);\n    nav.appendChild(arrow('finance-month-next-clean-v1','Nästa månad','›',1));"
if old not in s: raise SystemExit('arrow calls not found')
s = s.replace(old, new, 1)

old = "    animateArrival();\n    prefetch();\n  }"
new = "    animateArrival();\n    prefetch();\n    requestAnimationFrame(function () {\n      requestAnimationFrame(releaseFinancePreload);\n    });\n  }"
if old not in s: raise SystemExit('init tail not found')
s = s.replace(old, new, 1)

ui.write_text(s)

for name in ['budget.html','budget_maja.html','analytics.html','analytics_maja.html','familjebudget.html']:
    p = Path('budget') / name
    text = p.read_text()
    old = 'finance-ui.js?v=20260830-finance-clean-v2'
    if old not in text:
        raise SystemExit(f'{old} missing in {name}')
    p.write_text(text.replace(old, 'finance-ui.js?v=20260830-finance-clean-v3', 1))
