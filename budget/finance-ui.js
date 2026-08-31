(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var page = {
    budgetMarkus: path.endsWith('/budget/budget.html') || path.endsWith('/budget.html'),
    budgetMaja: path.endsWith('/budget/budget_maja.html') || path.endsWith('/budget_maja.html'),
    analysisMarkus: path.endsWith('/budget/analytics.html') || path.endsWith('/analytics.html'),
    analysisMaja: path.endsWith('/budget/analytics_maja.html') || path.endsWith('/analytics_maja.html'),
    family: path.endsWith('/budget/familjebudget.html') || path.endsWith('/familjebudget.html')
  };
  var active = page.budgetMarkus || page.budgetMaja || page.analysisMarkus || page.analysisMaja || page.family;
  if (!active || window.__financeUiInstalled) return;
  window.__financeUiInstalled = true;

  var isBudget = page.budgetMarkus || page.budgetMaja;
  var view = (page.analysisMarkus || page.analysisMaja) ? 'analysis' : (page.family ? 'family' : 'budget');
  var user = (page.budgetMaja || page.analysisMaja) ? 'maja' : 'markus';

  var financeTheme = view === 'analysis'
    ? { accent: '#4ADE80', hover: '#86EFAC', active: '#22C55E', rgb: '74,222,128', month: '#4ADE80', monthHover: '#86EFAC', monthActive: '#22C55E', bgAlpha: '.085', headerAlpha: '.06', borderAlpha: '.20', glowAlpha: '.075' }
    : (view === 'family'
      ? { accent: '#FB923C', hover: '#FDBA74', active: '#F97316', rgb: '251,146,60', month: '#FB923C', monthHover: '#FDBA74', monthActive: '#F97316', bgAlpha: '.085', headerAlpha: '.06', borderAlpha: '.20', glowAlpha: '.075' }
      : { accent: '#2563EB', hover: '#60A5FA', active: '#1D4ED8', rgb: '37,99,235', month: '#7DD3FC', monthHover: '#BAE6FD', monthActive: '#38BDF8', bgAlpha: '.16', headerAlpha: '.11', borderAlpha: '.32', glowAlpha: '.14' });
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
  try {
    var remembered = localStorage.getItem('budget-last-user-v1');
    if (page.family && (remembered === 'markus' || remembered === 'maja')) user = remembered;
  } catch (_) {}

  try { localStorage.setItem('finance-last-page-v1', path.split('/').pop()); } catch (_) {}
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
        'html.finance-ui-preload-v2,html.finance-ui-preload-v2 body{background:radial-gradient(760px 300px at 50% -90px,rgba(var(--finance-accent-rgb),var(--finance-theme-bg-alpha)),transparent 66%),#0F1219!important}' +
        'html.finance-ui-preload-v2 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;overflow:hidden!important;position:relative!important;padding:0!important;text-align:center!important;background:linear-gradient(180deg,rgba(13,17,23,.985),rgba(var(--finance-accent-rgb),var(--finance-theme-header-alpha)))!important;border-bottom:1px solid rgba(var(--finance-accent-rgb),var(--finance-theme-border-alpha))!important;box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 22px rgba(var(--finance-accent-rgb),var(--finance-theme-glow-alpha))!important}' +
        'html.finance-ui-preload-v2 body .header>*:not(h1){visibility:hidden!important}' +
        'html.finance-ui-preload-v2 body .header>h1{visibility:visible!important;position:absolute!important;left:50%!important;top:14px!important;transform:translateX(-50%)!important;width:max-content!important;max-width:calc(100% - 112px)!important;margin:0!important;font-size:21px!important;font-weight:800!important;letter-spacing:-.45px!important;line-height:1.1!important;white-space:nowrap!important;text-align:center!important;view-transition-name:finance-title}' +
        'html.finance-ui-preload-v2 body .header::before{display:none!important}' +
        '@media(max-width:600px){html.finance-ui-preload-v2 body .header{height:156px!important;min-height:156px!important;max-height:156px!important}html.finance-ui-preload-v2 body .header>h1{top:13px!important;font-size:20px!important;max-width:calc(100% - 112px)!important}}';
      document.head.appendChild(critical);
    }
    financePreloadTimer = setTimeout(releaseFinancePreload, 1400);
  }

  installFinancePreload();

  function installFinanceMorphBootstrap() {
    if (document.getElementById('finance-morph-style')) return;
    var style = document.createElement('style');
    style.id = 'finance-morph-style';
    style.textContent =
      '@view-transition{navigation:auto}' +
      ':root{view-transition-name:none}' +
      'body .header>h1{view-transition-name:finance-title}' +
      '::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.46s!important;animation-timing-function:cubic-bezier(.22,1,.36,1)!important}' +
      '::view-transition-old(finance-title),::view-transition-new(finance-title),::view-transition-old(finance-person),::view-transition-new(finance-person),::view-transition-old(finance-panel-0),::view-transition-new(finance-panel-0),::view-transition-old(finance-panel-1),::view-transition-new(finance-panel-1),::view-transition-old(finance-panel-2),::view-transition-new(finance-panel-2){mix-blend-mode:normal!important}';
    document.head.appendChild(style);
  }

  installFinanceMorphBootstrap();

  function route(nextView, nextUser) {
    if (nextView === 'analysis') return nextUser === 'maja' ? 'analytics_maja.html' : 'analytics.html';
    if (nextView === 'family') return 'familjebudget.html';
    return nextUser === 'maja' ? 'budget_maja.html' : 'budget.html';
  }

  function flushBudget() {
    try {
      var el = document.activeElement;
      if (el && el !== document.body && typeof el.blur === 'function') el.blur();
    } catch (_) {}
    try { if (typeof window.saveLocal === 'function') window.saveLocal(); } catch (_) {}
  }

  function remember(nextUser) {
    user = nextUser;
    try { localStorage.setItem('budget-last-user-v1', nextUser); } catch (_) {}
  }


  var financeNavigating = false;

  function navigate(nextView, nextUser) {
    var href = route(nextView, nextUser);
    if (location.pathname.toLowerCase().endsWith('/' + href.toLowerCase()) || financeNavigating) return;
    financeNavigating = true;
    flushBudget();
    location.assign(href);
  }

  function installStyles() {
    if (document.getElementById('finance-ui-clean-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'finance-ui-clean-v1-style';
    style.textContent =
      'html.finance-ui-clean-v1 body{background:radial-gradient(900px 380px at 50% -110px,rgba(var(--finance-accent-rgb),var(--finance-theme-bg-alpha)),transparent 67%),#0F1219!important}' +
      'html.finance-ui-clean-v1 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;position:relative!important;padding:0!important;text-align:center!important;overflow:visible!important;background:linear-gradient(180deg,rgba(13,17,23,.985),rgba(var(--finance-accent-rgb),var(--finance-theme-header-alpha)))!important;border-bottom:1px solid rgba(var(--finance-accent-rgb),var(--finance-theme-border-alpha))!important;box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 24px rgba(var(--finance-accent-rgb),var(--finance-theme-glow-alpha))!important;backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important}' +
      'html.finance-ui-clean-v1 body .header::before{display:none!important}' +
      'html.finance-ui-clean-v1 body .header>h1{position:absolute!important;left:50%!important;top:14px!important;transform:translateX(-50%)!important;width:max-content!important;max-width:calc(100% - 112px)!important;margin:0!important;font-size:21px!important;font-weight:800!important;letter-spacing:-.45px!important;line-height:1.1!important;white-space:nowrap!important;text-align:center!important}' +
      'html.finance-ui-clean-v1 body .header>p{position:absolute!important;left:50%!important;top:40px!important;transform:translateX(-50%)!important;margin:0!important;font-size:11px!important;line-height:1.2!important;white-space:nowrap!important;text-align:center!important}' +
      'html.finance-ui-clean-v1 body .header>.nav-dropdown-wrapper{position:absolute!important;top:10px!important;right:10px!important;left:auto!important}' +
      'html.finance-ui-clean-v1 body .top-bar{display:none!important}' +
      '.finance-profile-clean-v1,.finance-view-clean-v1{position:absolute!important;bottom:9px!important;display:flex!important;align-items:center!important;gap:2px!important;padding:3px!important;border:1px solid rgba(255,255,255,.22)!important;border-radius:18px!important;background:rgba(255,255,255,.075)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 4px 16px rgba(0,0,0,.12)!important;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);z-index:6!important}' +
      '.finance-profile-clean-v1{left:16px!important}' +
      '.finance-view-clean-v1{right:9px!important}' +
      '.finance-profile-clean-v1 button,.finance-view-clean-v1 button{appearance:none;height:29px!important;box-sizing:border-box!important;border:0!important;border-radius:14px!important;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      '.finance-profile-clean-v1 button{min-width:50px!important;padding:0 8px!important;color:#94A3B8;font:700 10px/1.1 Inter,sans-serif}' +
      '.finance-profile-clean-v1 button[data-user="markus"].active{color:#60A5FA!important;background:rgba(59,130,246,.16)!important;box-shadow:inset 0 0 0 1px rgba(96,165,250,.48),0 0 12px rgba(59,130,246,.18)!important}' +
      '.finance-profile-clean-v1 button[data-user="maja"].active{color:#F472B6!important;background:rgba(244,114,182,.15)!important;box-shadow:inset 0 0 0 1px rgba(244,114,182,.48),0 0 12px rgba(244,114,182,.17)!important}' +
      '.finance-view-clean-v1 button{width:39px!important;padding:0!important;opacity:.72;transition:background .15s,box-shadow .15s,opacity .15s,transform .1s}' +
      '.finance-view-clean-v1 button:active{transform:scale(.96)}' +
      '.finance-view-clean-v1 svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}' +
      '.finance-view-clean-v1 button[data-view="budget"]{color:#60A5FA}.finance-view-clean-v1 button[data-view="analysis"]{color:#4ADE80}.finance-view-clean-v1 button[data-view="family"]{color:#FB923C}' +
      '.finance-view-clean-v1 button[data-view="budget"].active{opacity:1;background:rgba(96,165,250,.16);box-shadow:inset 0 0 0 1px rgba(96,165,250,.52),0 0 12px rgba(96,165,250,.28),0 0 22px rgba(59,130,246,.10)}' +
      '.finance-view-clean-v1 button[data-view="analysis"].active{opacity:1;background:rgba(74,222,128,.14);box-shadow:inset 0 0 0 1px rgba(74,222,128,.48),0 0 12px rgba(74,222,128,.25),0 0 22px rgba(34,197,94,.09)}' +
      '.finance-view-clean-v1 button[data-view="family"].active{opacity:1;background:rgba(251,146,60,.15);box-shadow:inset 0 0 0 1px rgba(251,146,60,.50),0 0 12px rgba(251,146,60,.27),0 0 22px rgba(249,115,22,.09)}' +
      'html.finance-ui-clean-v1 body .header>#month-nav{position:absolute!important;left:50%!important;right:auto!important;top:54px!important;bottom:auto!important;transform:translateX(-50%)!important;margin:0!important;padding:0!important;height:40px!important;width:max-content!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-wrap:nowrap!important;gap:8px!important;z-index:8!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' +
      'html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper{position:relative!important;display:block!important;flex:0 0 154px!important;width:154px!important;height:40px!important}' +
      'html.finance-ui-clean-v1 body .header #month-dropdown{appearance:none!important;height:40px!important;width:154px!important;min-width:154px!important;margin:0!important;padding:0 8px!important;border:0!important;border-radius:0!important;background:transparent!important;background-image:none!important;color:var(--finance-month-accent)!important;font:680 15px/1 Inter,sans-serif!important;letter-spacing:-.10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;text-align:center!important;box-shadow:none!important;text-shadow:0 2px 10px color-mix(in srgb,var(--finance-month-accent) 18%,transparent)!important;transform:none!important;cursor:pointer!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;transition:color .15s,opacity .15s!important}' +
      'html.finance-ui-clean-v1 body .header #month-dropdown:hover{color:var(--finance-month-hover)!important}html.finance-ui-clean-v1 body .header #month-dropdown:active{color:var(--finance-month-active)!important;opacity:.88!important}' +
      '.finance-month-arrow-clean-v1{appearance:none!important;width:32px!important;height:32px!important;flex:0 0 32px!important;margin:0!important;padding:0!important;border:1px solid rgba(var(--finance-accent-rgb),.34)!important;border-radius:8px!important;background:linear-gradient(180deg,rgba(var(--finance-accent-rgb),.105),rgba(var(--finance-accent-rgb),.055))!important;color:var(--finance-month-accent)!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;font:650 15px/1 Inter,sans-serif!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 13px rgba(var(--finance-accent-rgb),.10)!important;text-shadow:0 0 10px rgba(var(--finance-accent-rgb),.28)!important;transition:background .16s,border-color .16s,box-shadow .16s,color .16s,transform .1s!important;-webkit-tap-highlight-color:transparent}' +
      '.finance-month-arrow-clean-v1:hover:not(:disabled){background:rgba(var(--finance-accent-rgb),.15)!important;border-color:rgba(var(--finance-accent-rgb),.52)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 0 17px rgba(var(--finance-accent-rgb),.18)!important;color:var(--finance-month-hover)!important}.finance-month-arrow-clean-v1:active:not(:disabled){transform:scale(.96)!important;background:rgba(var(--finance-accent-rgb),.18)!important;color:var(--finance-month-active)!important}.finance-month-arrow-clean-v1:disabled{opacity:.20!important;cursor:default!important;box-shadow:none!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu{display:none;position:absolute!important;top:calc(100% + 7px)!important;left:50%!important;right:auto!important;min-width:188px!important;width:max-content!important;max-width:min(260px,88vw)!important;margin:0!important;padding:5px 0!important;border:1px solid rgba(255,255,255,.09)!important;border-radius:12px!important;background:#161B22!important;color:#C9D1D9!important;box-shadow:0 14px 38px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.035)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;overflow-y:auto!important;transform:translateX(-50%)!important;transform-origin:top center!important;z-index:1000!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu.active{display:block!important;animation:financeMonthMenuInCleanV1 .18s cubic-bezier(.16,1,.3,1)!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu .custom-dropdown-item{min-height:36px!important;padding:9px 10px!important;color:#C9D1D9!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.045)!important;background:transparent!important;font:600 11px/1.35 Inter,sans-serif!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu .custom-dropdown-item:hover{padding-left:10px!important;background:rgba(var(--finance-accent-rgb),.10)!important;color:#F0F6FC!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu .custom-dropdown-item.selected{padding-left:10px!important;background:rgba(var(--finance-accent-rgb),.12)!important;color:var(--finance-accent-hover)!important;box-shadow:inset 3px 0 0 var(--finance-accent)!important}' +
      '.finance-month-delete-clean-v1{appearance:none!important;width:23px!important;height:23px!important;flex:0 0 23px!important;border:0!important;border-radius:6px!important;background:transparent!important;color:#64748B!important;font:700 15px/1 Inter,sans-serif!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important}' +
      '.finance-month-delete-clean-v1:hover{color:#F87171!important;background:rgba(248,113,113,.10)!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu .finance-month-add-clean-v1{margin-top:4px!important;border-top:1px solid rgba(74,222,128,.18)!important;border-bottom:0!important;color:#4ADE80!important;justify-content:center!important;font-weight:750!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu .finance-month-add-clean-v1:hover{background:rgba(74,222,128,.09)!important;color:#86EFAC!important}' +
      '@keyframes financeMonthMenuInCleanV1{from{opacity:0;transform:translate(-50%,-8px) scale(.98)}to{opacity:1;transform:translate(-50%,0) scale(1)}}' +
      'html.finance-ui-clean-v1 body .container .kpi-card,html.finance-ui-clean-v1 body .container .stat-card,html.finance-ui-clean-v1 body .container .chart-card,html.finance-ui-clean-v1 body .container .card,html.finance-ui-clean-v1 body .container .savings-goals-section,html.finance-ui-clean-v1 body .container>.section-card{outline:1px solid rgba(var(--finance-accent-rgb),.075)!important;outline-offset:-1px!important}' +
      'html.finance-ui-clean-v1 body .container>.kpi-row,html.finance-ui-clean-v1 body .container>.grid-4,html.finance-ui-clean-v1 body .container>.kpi-grid{filter:drop-shadow(0 10px 26px rgba(var(--finance-accent-rgb),.025))}' +
      'html.finance-ui-clean-v1 body .header>.nav-dropdown-wrapper>button{border-color:rgba(var(--finance-accent-rgb),.30)!important;background:rgba(var(--finance-accent-rgb),.075)!important;color:var(--finance-accent-hover)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 0 13px rgba(var(--finance-accent-rgb),.08)!important;transition:background .16s,border-color .16s,box-shadow .16s,color .16s,transform .1s!important}' +
      'html.finance-ui-clean-v1 body .header>.nav-dropdown-wrapper>button:hover{background:rgba(var(--finance-accent-rgb),.13)!important;border-color:rgba(var(--finance-accent-rgb),.46)!important;color:var(--finance-accent-hover)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 0 17px rgba(var(--finance-accent-rgb),.14)!important}' +
      'html.finance-ui-clean-v1 body .container .month-btn{background:linear-gradient(180deg,rgba(var(--finance-accent-rgb),.12),rgba(var(--finance-accent-rgb),.065))!important;border:1px solid rgba(var(--finance-accent-rgb),.38)!important;color:var(--finance-accent-hover)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 14px rgba(var(--finance-accent-rgb),.10)!important;text-shadow:0 0 10px rgba(var(--finance-accent-rgb),.28)!important;transition:background .16s,border-color .16s,box-shadow .16s,color .16s,transform .1s!important}' +
      'html.finance-ui-clean-v1 body .container .month-btn:hover{opacity:1!important;transform:translateY(-1px)!important;background:rgba(var(--finance-accent-rgb),.17)!important;border-color:rgba(var(--finance-accent-rgb),.58)!important;color:var(--finance-accent-hover)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 0 19px rgba(var(--finance-accent-rgb),.18)!important}html.finance-ui-clean-v1 body .container .month-btn:active{transform:scale(.96)!important;background:rgba(var(--finance-accent-rgb),.20)!important;color:var(--finance-accent-active)!important}' +
      'html.finance-ui-clean-v1 body .container .month-display{color:var(--finance-accent-hover)!important;text-shadow:0 0 12px rgba(var(--finance-accent-rgb),.12)!important}' +
      'html.finance-ui-clean-v1 body .container>.month-selector{border:1px solid rgba(var(--finance-accent-rgb),.14)!important;background:linear-gradient(180deg,rgba(var(--finance-accent-rgb),.045),rgba(var(--finance-accent-rgb),.018)),var(--card)!important;box-shadow:0 2px 8px rgba(0,0,0,.12),0 0 20px rgba(var(--finance-accent-rgb),.045)!important}' +
      'html.finance-ui-clean-v1 body .container .btn-add{border:1px solid rgba(var(--finance-accent-rgb),.28)!important;background:rgba(var(--finance-accent-rgb),.035)!important;color:var(--finance-accent-hover)!important;box-shadow:0 0 12px rgba(var(--finance-accent-rgb),.045)!important}' +
      'html.finance-ui-clean-v1 body .container .btn-add:hover{border-color:rgba(var(--finance-accent-rgb),.52)!important;background:rgba(var(--finance-accent-rgb),.09)!important;color:var(--finance-accent-hover)!important;box-shadow:0 0 17px rgba(var(--finance-accent-rgb),.11)!important}' +
      'html.finance-ui-clean-v1 body .container .table-collapse-btn{padding:6px 9px!important;border:1px solid rgba(var(--finance-accent-rgb),.22)!important;border-radius:8px!important;background:rgba(var(--finance-accent-rgb),.035)!important;color:var(--finance-accent-hover)!important;box-shadow:0 0 10px rgba(var(--finance-accent-rgb),.035)!important}' +
      'html.finance-ui-clean-v1 body .container .table-collapse-btn:hover{opacity:1!important;border-color:rgba(var(--finance-accent-rgb),.42)!important;background:rgba(var(--finance-accent-rgb),.08)!important;box-shadow:0 0 15px rgba(var(--finance-accent-rgb),.09)!important}' +
      'html.finance-ui-clean-v1 body .modal-btn-primary{background:rgba(var(--finance-accent-rgb),.17)!important;border:1px solid rgba(var(--finance-accent-rgb),.46)!important;color:var(--finance-accent-hover)!important;box-shadow:0 0 15px rgba(var(--finance-accent-rgb),.10)!important}' +
      'html.finance-ui-clean-v1 body .modal-btn-primary:hover{filter:none!important;background:rgba(var(--finance-accent-rgb),.24)!important;border-color:rgba(var(--finance-accent-rgb),.62)!important;box-shadow:0 0 20px rgba(var(--finance-accent-rgb),.16)!important}' +
      '@media(max-width:600px){html.finance-ui-clean-v1 body .header{height:156px!important;min-height:156px!important;max-height:156px!important;padding:0!important}html.finance-ui-clean-v1 body .header>h1{left:50%!important;top:13px!important;transform:translateX(-50%)!important;font-size:20px!important;max-width:calc(100% - 112px)!important;text-align:center!important}html.finance-ui-clean-v1 body .header>p{left:50%!important;top:39px!important;transform:translateX(-50%)!important;font-size:11px!important;text-align:center!important}html.finance-ui-clean-v1 body .header>.nav-dropdown-wrapper{top:8px!important;right:8px!important}.finance-profile-clean-v1,.finance-view-clean-v1{bottom:8px!important;border-radius:17px!important}.finance-profile-clean-v1{left:12px!important}.finance-view-clean-v1{right:7px!important}.finance-profile-clean-v1 button,.finance-view-clean-v1 button{height:28px!important;border-radius:13px!important}.finance-profile-clean-v1 button{min-width:47px!important;padding:0 6px!important;font-size:9.5px!important}.finance-view-clean-v1 button{width:37px!important}.finance-view-clean-v1 svg{width:16px!important;height:16px!important}html.finance-ui-clean-v1 body .header>#month-nav{top:54px!important;bottom:auto!important;height:40px!important;width:max-content!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;gap:7px!important}html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper{height:40px!important;width:150px!important;flex-basis:150px!important}html.finance-ui-clean-v1 body .header #month-dropdown{height:40px!important;width:150px!important;min-width:150px!important;padding:0 7px!important;font-size:14px!important;border-radius:0!important}.finance-month-arrow-clean-v1{width:32px!important;height:32px!important;flex-basis:32px!important;border-radius:8px!important;font-size:14px!important}html.finance-ui-clean-v1 #month-dropdown-menu{min-width:176px!important;border-radius:11px!important}html.finance-ui-clean-v1 #month-dropdown-menu .custom-dropdown-item{min-height:34px!important;padding:8px 10px!important;font-size:10px!important}}' +
      '@media(max-width:370px){.finance-profile-clean-v1{left:8px!important}.finance-profile-clean-v1 button{min-width:43px!important;padding:0 5px!important}.finance-view-clean-v1 button{width:34px!important}html.finance-ui-clean-v1 body .header>#month-nav{width:max-content!important;gap:6px!important}html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper{width:140px!important;flex-basis:140px!important}html.finance-ui-clean-v1 body .header #month-dropdown{width:140px!important;min-width:140px!important;font-size:13px!important}.finance-month-arrow-clean-v1{width:32px!important;height:32px!important;flex-basis:32px!important}}' +
      '@media(prefers-reduced-motion:reduce){::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-month),::view-transition-group(finance-profile),::view-transition-group(finance-views),::view-transition-group(finance-menu),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.001s!important}}';
    document.head.appendChild(style);
  }

  function setHeaderIdentity() {
    var header = document.querySelector('.header');
    if (!header) return;
    var h1 = header.querySelector('h1');
    var sub = header.querySelector('p');
    if (h1) h1.textContent = view === 'analysis' ? 'Analys' : (view === 'family' ? 'Familjebudget' : 'Budgetplanerare');
    if (sub) {
      sub.textContent = user === 'maja' ? 'Maja' : 'Markus';
      sub.style.color = user === 'maja' ? '#F472B6' : '#60A5FA';
      sub.style.fontWeight = '700';
      sub.style.opacity = '1';
    }
  }

  function buildProfile() {
    var header = document.querySelector('.header');
    if (!header) return;
    var group = document.createElement('div');
    group.id = 'finance-profile-clean-v1';
    group.className = 'finance-profile-clean-v1';
    group.setAttribute('role','group');
    group.setAttribute('aria-label','Välj person');
    group.innerHTML = '<button type="button" data-user="markus">Markus</button><button type="button" data-user="maja">Maja</button>';
    group.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-user]');
      if (!button) return;
      var nextUser = button.dataset.user;
      if (nextUser === user) return;
      flushBudget();
      remember(nextUser);
      updateActiveStates();
      setHeaderIdentity();
      if (!page.family) navigate(view, nextUser);
    });
    header.appendChild(group);
  }

  function buildViewToggle() {
    var header = document.querySelector('.header');
    if (!header) return;
    var group = document.createElement('div');
    group.id = 'finance-view-clean-v1';
    group.className = 'finance-view-clean-v1';
    group.setAttribute('role','group');
    group.setAttribute('aria-label','Välj budgetvy');
    group.innerHTML =
      '<button type="button" data-view="budget" aria-label="Budget" title="Budget"><svg viewBox="0 0 24 24"><path d="M4 7.5h14.5A1.5 1.5 0 0 1 20 9v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12a1 1 0 0 1 0 2H5a1 1 0 0 0-1 1v.5Z"/><path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></svg></button>' +
      '<button type="button" data-view="analysis" aria-label="Analys" title="Analys"><svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16m-13-4 4-4 3 2 5-6m-2.5 0H19v2.5"/></svg></button>' +
      '<button type="button" data-view="family" aria-label="Familjebudget" title="Familjebudget"><svg viewBox="0 0 24 24"><path d="m3 11 9-7 9 7M5.5 10.5V20h13v-9.5M9 20v-5h6v5"/><path d="M8.2 10.2c.9-1.7 3.3-1.5 3.8.2.5-1.7 2.9-1.9 3.8-.2.7 1.4-.3 2.9-3.8 5-3.5-2.1-4.5-3.6-3.8-5Z"/></svg></button>';
    group.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-view]');
      if (!button || button.dataset.view === view) return;
      navigate(button.dataset.view, user);
    });
    header.appendChild(group);
  }

  function updateActiveStates() {
    document.querySelectorAll('#finance-profile-clean-v1 [data-user]').forEach(function (button) {
      var on = button.dataset.user === user;
      button.classList.toggle('active', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('#finance-view-clean-v1 [data-view]').forEach(function (button) {
      var on = button.dataset.view === view;
      button.classList.toggle('active', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function financeMonthLabel(key) {
    if (!/^\d{4}-\d{2}$/.test(String(key || ''))) return 'Välj månad';
    var names = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
    var parts = key.split('-');
    return (names[Number(parts[1]) - 1] || '') + ' ' + parts[0];
  }

  function trackerMonthKeys(storageKey) {
    try {
      var raw = localStorage.getItem(storageKey);
      var data = raw ? JSON.parse(raw) : null;
      return data && data.monthlyData ? Object.keys(data.monthlyData).sort() : [];
    } catch (_) { return []; }
  }

  function financeMonthKeys() {
    var keys;
    if (page.family) {
      keys = trackerMonthKeys('budgetTracker').concat(trackerMonthKeys('budgetTracker_maja'));
      keys = Array.from(new Set(keys)).sort();
    } else {
      keys = trackerMonthKeys(user === 'maja' ? 'budgetTracker_maja' : 'budgetTracker');
    }
    var selected = '';
    try { selected = localStorage.getItem('selectedBudgetMonth') || ''; } catch (_) {}
    if (!keys.length && /^\d{4}-\d{2}$/.test(selected)) keys = [selected];
    return keys;
  }

  function financeSelectedMonth(keys) {
    keys = keys || financeMonthKeys();
    var selected = '';
    try { selected = localStorage.getItem('selectedBudgetMonth') || ''; } catch (_) {}
    if (selected && keys.indexOf(selected) !== -1) return selected;
    return keys.length ? keys[keys.length - 1] : '';
  }

  function updateMonthArrows() {
    var keys = financeMonthKeys();
    var selected = financeSelectedMonth(keys);
    var index = keys.indexOf(selected);
    var prev = document.getElementById('finance-month-prev-clean-v1');
    var next = document.getElementById('finance-month-next-clean-v1');
    if (prev) prev.disabled = index <= 0;
    if (next) next.disabled = index < 0 || index >= keys.length - 1;
  }

  function refreshFinanceMonthView(key) {
    if (isBudget && typeof window.setBudgetMonthFromFinance === 'function') {
      window.setBudgetMonthFromFinance(key);
      return;
    }
    if (view === 'analysis') {
      try { if (typeof window.renderKPIs === 'function') window.renderKPIs(); } catch (_) {}
      try { if (typeof window.renderGoals === 'function') window.renderGoals(); } catch (_) {}
      try { if (typeof window.renderCharts === 'function') window.renderCharts(); } catch (_) {}
      return;
    }
    if (page.family) {
      try { if (typeof window.syncWithBudgetMonth === 'function') window.syncWithBudgetMonth(); } catch (_) {}
      try { if (typeof window.renderAll === 'function') window.renderAll(); } catch (_) {}
    }
  }

  function selectFinanceMonth(key) {
    if (!key) return;
    try { localStorage.setItem('selectedBudgetMonth', key); } catch (_) {}
    refreshFinanceMonthView(key);
    buildFinanceMonthMenu();
    updateMonthArrows();
    var menu = document.getElementById('month-dropdown-menu');
    if (menu) menu.classList.remove('active');
  }

  function stepMonth(delta) {
    var keys = financeMonthKeys();
    var selected = financeSelectedMonth(keys);
    var index = keys.indexOf(selected);
    var target = keys[index + delta];
    if (target) selectFinanceMonth(target);
  }

  function arrow(id, label, glyph, delta) {
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

  function buildFinanceMonthMenu() {
    var menu = document.getElementById('month-dropdown-menu');
    var dropdown = document.getElementById('month-dropdown');
    if (!menu || !dropdown) return;
    var keys = financeMonthKeys();
    var selected = financeSelectedMonth(keys);
    if (selected) {
      try { localStorage.setItem('selectedBudgetMonth', selected); } catch (_) {}
    }
    dropdown.textContent = selected ? financeMonthLabel(selected) : 'Ingen månad';
    menu.innerHTML = '';

    keys.forEach(function (key) {
      var item = document.createElement('div');
      item.className = 'custom-dropdown-item' + (key === selected ? ' selected' : '');
      item.dataset.financeMonthKey = key;
      var label = document.createElement('span');
      label.className = 'finance-month-label-clean-v1';
      label.textContent = financeMonthLabel(key);
      item.appendChild(label);

      if (isBudget) {
        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'finance-month-delete-clean-v1';
        remove.textContent = '×';
        remove.title = 'Radera ' + financeMonthLabel(key);
        remove.setAttribute('aria-label','Radera ' + financeMonthLabel(key));
        remove.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          selectFinanceMonth(key);
          setTimeout(function () {
            if (typeof window.deleteCurrentMonth === 'function') window.deleteCurrentMonth();
            setTimeout(function () { buildFinanceMonthMenu(); updateMonthArrows(); }, 0);
          }, 0);
        });
        item.appendChild(remove);
      }

      item.addEventListener('click', function () { selectFinanceMonth(key); });
      menu.appendChild(item);
    });

    if (isBudget) {
      var add = document.createElement('div');
      add.className = 'custom-dropdown-item finance-month-add-clean-v1';
      add.textContent = '+ Ny månad';
      add.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        menu.classList.remove('active');
        if (typeof window.addNewMonth === 'function') window.addNewMonth();
        setTimeout(function () { buildFinanceMonthMenu(); updateMonthArrows(); }, 0);
      });
      menu.appendChild(add);
    }
    updateMonthArrows();
  }

  function setupMonthControl() {
    var header = document.querySelector('.header');
    if (!header) return;
    var nav = document.getElementById('month-nav');
    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'month-nav';
      header.appendChild(nav);
    }
    nav.innerHTML = '';
    if (nav.parentNode !== header) header.appendChild(nav);

    var wrapper = document.createElement('div');
    wrapper.className = 'custom-dropdown-wrapper';
    var dropdown = document.createElement('button');
    dropdown.id = 'month-dropdown';
    dropdown.type = 'button';
    dropdown.setAttribute('aria-haspopup','listbox');
    dropdown.setAttribute('aria-expanded','false');
    var menu = document.createElement('div');
    menu.id = 'month-dropdown-menu';
    menu.className = 'custom-dropdown-menu';
    wrapper.appendChild(dropdown);
    wrapper.appendChild(menu);

    nav.appendChild(arrow('finance-month-prev-clean-v1','Föregående månad','‹',-1));
    nav.appendChild(wrapper);
    nav.appendChild(arrow('finance-month-next-clean-v1','Nästa månad','›',1));

    dropdown.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var open = menu.classList.toggle('active');
      dropdown.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (event) {
      if (!nav.contains(event.target)) {
        menu.classList.remove('active');
        dropdown.setAttribute('aria-expanded','false');
      }
    });

    buildFinanceMonthMenu();
    var selected = financeSelectedMonth(financeMonthKeys());
    if (selected && !isBudget) refreshFinanceMonthView(selected);

    window.addEventListener('firebase-sync', function (event) {
      var syncKey = event && event.detail && event.detail.key;
      if (syncKey === 'budgetTracker' || syncKey === 'budgetTracker_maja') {
        setTimeout(function () { buildFinanceMonthMenu(); updateMonthArrows(); }, 0);
      }
    });
  }

  function setupFinanceMorphTargets() {
    var header = document.querySelector('.header');
    if (header) {
      var sub = header.querySelector('p');
      if (sub) sub.style.viewTransitionName = 'finance-person';
    }

    var container = document.querySelector('.container');
    if (!container) return;
    var morphIndex = 0;
    Array.prototype.slice.call(container.children).forEach(function (el) {
      if (morphIndex >= 3 || el.querySelector('canvas')) return;
      el.style.viewTransitionName = 'finance-panel-' + morphIndex;
      morphIndex += 1;
    });
  }

  function prefetch() {
    ['budget','analysis','family'].forEach(function (nextView) {
      var href = route(nextView, user);
      if (location.pathname.toLowerCase().endsWith('/' + href.toLowerCase())) return;
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    });
  }

  function init() {
    document.documentElement.classList.add('finance-ui-clean-v1');
    installStyles();
    setHeaderIdentity();
    buildProfile();
    buildViewToggle();
    updateActiveStates();
    setupMonthControl();
    setupFinanceMorphTargets();
    prefetch();
    requestAnimationFrame(function () {
      requestAnimationFrame(releaseFinancePreload);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
