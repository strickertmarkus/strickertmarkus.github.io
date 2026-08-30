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
  try {
    var remembered = localStorage.getItem('budget-last-user-v1');
    if (page.family && (remembered === 'markus' || remembered === 'maja')) user = remembered;
  } catch (_) {}

  var TRANSITION_KEY = 'finance-view-transition-clean-v1';
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
        'html.finance-ui-preload-v2 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;overflow:hidden!important;position:relative!important;background:rgba(24,31,46,.94)!important;border-bottom:1px solid rgba(255,255,255,.08)!important;box-shadow:0 8px 28px rgba(0,0,0,.32)!important}' +
        'html.finance-ui-preload-v2 body .header>*{visibility:hidden!important}' +
        'html.finance-ui-preload-v2 body .header::before{display:none!important}' +
        '@media(max-width:600px){html.finance-ui-preload-v2 body .header{height:156px!important;min-height:156px!important;max-height:156px!important}}';
      document.head.appendChild(critical);
    }
    financePreloadTimer = setTimeout(releaseFinancePreload, 1400);
  }

  installFinancePreload();

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

  function markTransition(nextView, nextUser) {
    try { sessionStorage.setItem(TRANSITION_KEY, JSON.stringify({ view: nextView, user: nextUser, at: Date.now() })); } catch (_) {}
  }

  function navigate(nextView, nextUser) {
    var href = route(nextView, nextUser);
    if (location.pathname.toLowerCase().endsWith('/' + href.toLowerCase())) return;
    flushBudget();
    markTransition(nextView, nextUser);
    location.assign(href);
  }

  function installStyles() {
    if (document.getElementById('finance-ui-clean-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'finance-ui-clean-v1-style';
    style.textContent =
      'html.finance-ui-clean-v1 body .header{height:160px!important;min-height:160px!important;max-height:160px!important;position:relative!important;padding:0!important;text-align:center!important;overflow:visible!important;background:rgba(24,31,46,.94)!important;border-bottom:1px solid rgba(255,255,255,.08)!important;box-shadow:0 8px 28px rgba(0,0,0,.32)!important;backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important}' +
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
      'html.finance-ui-clean-v1 body .header>#month-nav{position:absolute!important;left:50%!important;right:auto!important;top:60px!important;bottom:auto!important;transform:translateX(-50%)!important;margin:0!important;padding:0!important;height:40px!important;width:max-content!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-wrap:nowrap!important;gap:8px!important;z-index:8!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' +
      'html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper{position:relative!important;display:block!important;flex:0 0 154px!important;width:154px!important;height:40px!important}' +
      'html.finance-ui-clean-v1 body .header #month-dropdown{appearance:none!important;height:40px!important;width:154px!important;min-width:154px!important;margin:0!important;padding:0 8px!important;border:0!important;border-radius:0!important;background:transparent!important;background-image:none!important;color:#8CC0FF!important;font:760 15px/1 Inter,sans-serif!important;letter-spacing:-.15px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;text-align:center!important;box-shadow:none!important;text-shadow:0 2px 12px rgba(96,165,250,.18)!important;transform:none!important;cursor:pointer!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;transition:color .15s,opacity .15s!important}' +
      'html.finance-ui-clean-v1 body .header #month-dropdown:hover{color:#B8D8FF!important}html.finance-ui-clean-v1 body .header #month-dropdown:active{color:#60A5FA!important;opacity:.86!important}' +
      '.finance-month-arrow-clean-v1{appearance:none!important;width:32px!important;height:32px!important;flex:0 0 32px!important;margin:0!important;padding:0!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:8px!important;background:rgba(255,255,255,.04)!important;color:#F0F6FC!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;font:500 14px/1 Inter,sans-serif!important;box-shadow:none!important;transition:background .2s!important;-webkit-tap-highlight-color:transparent}' +
      '.finance-month-arrow-clean-v1:hover:not(:disabled){background:rgba(255,255,255,.07)!important}.finance-month-arrow-clean-v1:active:not(:disabled){background:rgba(255,255,255,.07)!important}.finance-month-arrow-clean-v1:disabled{opacity:.22!important;cursor:default!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu{display:none;position:absolute!important;top:calc(100% + 7px)!important;left:50%!important;right:auto!important;min-width:188px!important;width:max-content!important;max-width:min(260px,88vw)!important;margin:0!important;padding:5px 0!important;border:1px solid rgba(255,255,255,.09)!important;border-radius:12px!important;background:#161B22!important;color:#C9D1D9!important;box-shadow:0 14px 38px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.035)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;overflow-y:auto!important;transform:translateX(-50%)!important;transform-origin:top center!important;z-index:1000!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu.active{display:block!important;animation:financeMonthMenuInCleanV1 .18s cubic-bezier(.16,1,.3,1)!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu .custom-dropdown-item{min-height:36px!important;padding:9px 10px!important;color:#C9D1D9!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.045)!important;background:transparent!important;font:600 11px/1.35 Inter,sans-serif!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu .custom-dropdown-item:hover{padding-left:10px!important;background:rgba(96,165,250,.10)!important;color:#F0F6FC!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu .custom-dropdown-item.selected{padding-left:10px!important;background:rgba(96,165,250,.12)!important;color:#93C5FD!important;box-shadow:inset 3px 0 0 #60A5FA!important}' +
      '.finance-month-delete-clean-v1{appearance:none!important;width:23px!important;height:23px!important;flex:0 0 23px!important;border:0!important;border-radius:6px!important;background:transparent!important;color:#64748B!important;font:700 15px/1 Inter,sans-serif!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important}' +
      '.finance-month-delete-clean-v1:hover{color:#F87171!important;background:rgba(248,113,113,.10)!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu .finance-month-add-clean-v1{margin-top:4px!important;border-top:1px solid rgba(74,222,128,.18)!important;border-bottom:0!important;color:#4ADE80!important;justify-content:center!important;font-weight:750!important}' +
      'html.finance-ui-clean-v1 #month-dropdown-menu .finance-month-add-clean-v1:hover{background:rgba(74,222,128,.09)!important;color:#86EFAC!important}' +
      '.container.finance-arrival-clean-v1>*{transform-origin:top center;animation:financeArrivalCleanV1 .30s cubic-bezier(.16,1,.3,1) both;will-change:transform}.container.finance-arrival-clean-v1>*:nth-child(2){animation-delay:.025s}.container.finance-arrival-clean-v1>*:nth-child(3){animation-delay:.05s}.container.finance-arrival-clean-v1>*:nth-child(4){animation-delay:.075s}.container.finance-arrival-clean-v1>*:nth-child(n+5){animation-delay:.10s}' +
      '@keyframes financeArrivalCleanV1{0%{transform:translateY(-12px) scale(.995)}72%{transform:translateY(1px) scale(1.001)}100%{transform:translateY(0) scale(1)}}' +
      '@keyframes financeMonthMenuInCleanV1{from{opacity:0;transform:translate(-50%,-8px) scale(.98)}to{opacity:1;transform:translate(-50%,0) scale(1)}}' +
      '@media(max-width:600px){html.finance-ui-clean-v1 body .header{height:156px!important;min-height:156px!important;max-height:156px!important;padding:0!important}html.finance-ui-clean-v1 body .header>h1{left:50%!important;top:13px!important;transform:translateX(-50%)!important;font-size:20px!important;max-width:calc(100% - 112px)!important;text-align:center!important}html.finance-ui-clean-v1 body .header>p{left:50%!important;top:39px!important;transform:translateX(-50%)!important;font-size:11px!important;text-align:center!important}html.finance-ui-clean-v1 body .header>.nav-dropdown-wrapper{top:8px!important;right:8px!important}.finance-profile-clean-v1,.finance-view-clean-v1{bottom:8px!important;border-radius:17px!important}.finance-profile-clean-v1{left:12px!important}.finance-view-clean-v1{right:7px!important}.finance-profile-clean-v1 button,.finance-view-clean-v1 button{height:28px!important;border-radius:13px!important}.finance-profile-clean-v1 button{min-width:47px!important;padding:0 6px!important;font-size:9.5px!important}.finance-view-clean-v1 button{width:37px!important}.finance-view-clean-v1 svg{width:16px!important;height:16px!important}html.finance-ui-clean-v1 body .header>#month-nav{top:60px!important;bottom:auto!important;height:40px!important;width:max-content!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;gap:7px!important}html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper{height:40px!important;width:150px!important;flex-basis:150px!important}html.finance-ui-clean-v1 body .header #month-dropdown{height:40px!important;width:150px!important;min-width:150px!important;padding:0 7px!important;font-size:14px!important;border-radius:0!important}.finance-month-arrow-clean-v1{width:32px!important;height:32px!important;flex-basis:32px!important;border-radius:8px!important;font-size:14px!important}html.finance-ui-clean-v1 #month-dropdown-menu{min-width:176px!important;border-radius:11px!important}html.finance-ui-clean-v1 #month-dropdown-menu .custom-dropdown-item{min-height:34px!important;padding:8px 10px!important;font-size:10px!important}}' +
      '@media(max-width:370px){.finance-profile-clean-v1{left:8px!important}.finance-profile-clean-v1 button{min-width:43px!important;padding:0 5px!important}.finance-view-clean-v1 button{width:34px!important}html.finance-ui-clean-v1 body .header>#month-nav{width:max-content!important;gap:6px!important}html.finance-ui-clean-v1 body .header>#month-nav>.custom-dropdown-wrapper{width:140px!important;flex-basis:140px!important}html.finance-ui-clean-v1 body .header #month-dropdown{width:140px!important;min-width:140px!important;font-size:13px!important}.finance-month-arrow-clean-v1{width:32px!important;height:32px!important;flex-basis:32px!important}}' +
      '@media(prefers-reduced-motion:reduce){.container.finance-arrival-clean-v1>*{animation:none!important}}';
    document.head.appendChild(style);
  }

  function cleanLegacy() {
    document.documentElement.classList.remove('budget-toggle-booting-v1','finance-shell-booting-v8','finance-shell-v9','finance-shell-v14','finance-shell-arriving-v9','finance-shell-arriving-v12','finance-shell-leaving-v10');
    document.body && document.body.classList.remove('budget-user-switching-v1');
    ['budget-toggle-critical-v1','budget-ui-cleanup-v7-style','finance-shell-v8-style','finance-shell-v9-style','finance-shell-v14-style','finance-shell-polish-v10-style','finance-shell-polish-v11-style','finance-shell-polish-v12-style','finance-shell-polish-v13-style','finance-month-controls-v15-style','finance-month-controls-v16-style'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.remove();
    });
    ['budget-finance-toggle-v7','budget-finance-toggle-v8','budget-finance-toggle-v9','budget-finance-toggle-v14','finance-toggle-row-v8','finance-toggle-row-v9','finance-toggle-row-v14'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.remove();
    });
    var oldProfile = document.getElementById('budget-user-toggle-v1');
    if (oldProfile) oldProfile.remove();
    var header = document.querySelector('.header');
    if (header) header.classList.remove('budget-compact-header-v5');
    var month = document.getElementById('month-nav');
    if (month) month.classList.remove('budget-month-nav-v5');
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
    if (selected) refreshFinanceMonthView(selected);

    window.addEventListener('firebase-sync', function (event) {
      var syncKey = event && event.detail && event.detail.key;
      if (syncKey === 'budgetTracker' || syncKey === 'budgetTracker_maja') {
        setTimeout(function () { buildFinanceMonthMenu(); updateMonthArrows(); }, 0);
      }
    });
  }

  function animateArrival() {
    var fresh = false;
    try {
      var data = JSON.parse(sessionStorage.getItem(TRANSITION_KEY) || 'null');
      fresh = !!(data && Date.now() - Number(data.at || 0) < 5000);
      sessionStorage.removeItem(TRANSITION_KEY);
    } catch (_) {}
    if (!fresh) return;
    var container = document.querySelector('.container');
    if (!container) return;
    requestAnimationFrame(function () {
      container.classList.add('finance-arrival-clean-v1');
      setTimeout(function () { container.classList.remove('finance-arrival-clean-v1'); }, 650);
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
    cleanLegacy();
    document.documentElement.classList.add('finance-ui-clean-v1');
    installStyles();
    setHeaderIdentity();
    buildProfile();
    buildViewToggle();
    updateActiveStates();
    setupMonthControl();
    animateArrival();
    prefetch();
    requestAnimationFrame(function () {
      requestAnimationFrame(releaseFinancePreload);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
