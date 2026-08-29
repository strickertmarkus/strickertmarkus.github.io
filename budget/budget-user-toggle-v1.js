(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isMajaPage = path.endsWith('/budget/budget_maja.html') || path.endsWith('/budget_maja.html');
  var isBudgetPage = path.endsWith('/budget/budget.html') || path.endsWith('/budget.html') || isMajaPage;
  var pageDataKey = isMajaPage ? 'budgetTracker_maja' : 'budgetTracker';
  var snapshotKey = 'budget-navigation-snapshot-v1';

  function installPersistenceGuard() {
    if (!isBudgetPage || window.__budgetPersistenceGuardV1Installed) return;
    window.__budgetPersistenceGuardV1Installed = true;

    window.addEventListener('pagehide', function () {
      try {
        if (typeof window.saveLocal === 'function') window.saveLocal();
      } catch (_) {}

      try {
        var value = localStorage.getItem(pageDataKey);
        if (!value) return;
        sessionStorage.setItem(snapshotKey, JSON.stringify({
          at: Date.now(),
          key: pageDataKey,
          value: value
        }));
      } catch (_) {}
    }, {capture:true});

    var snapshot = null;
    try {
      var raw = sessionStorage.getItem(snapshotKey);
      snapshot = raw ? JSON.parse(raw) : null;
    } catch (_) {}

    if (!snapshot || !snapshot.key || typeof snapshot.value !== 'string' ||
        Date.now() - Number(snapshot.at || 0) > 15000) {
      try { sessionStorage.removeItem(snapshotKey); } catch (_) {}
      return;
    }

    var started = Date.now();
    var syncRequested = false;

    function renderCurrentPageIfNeeded() {
      if (snapshot.key !== pageDataKey) return;
      try { if (typeof window.loadLocal === 'function') window.loadLocal(); } catch (_) {}
      try { if (typeof window.updateMonthDisplay === 'function') window.updateMonthDisplay(); } catch (_) {}
      try { if (typeof window.renderSections === 'function') window.renderSections(); } catch (_) {}
      try { if (typeof window.renderKPIs === 'function') window.renderKPIs(); } catch (_) {}
      try { if (typeof window.updateCharts === 'function') window.updateCharts(); } catch (_) {}
      try { if (typeof window.saveSelectedMonth === 'function') window.saveSelectedMonth(); } catch (_) {}
    }

    function protectRecentLocalValue() {
      var changed = false;
      try {
        if (localStorage.getItem(snapshot.key) !== snapshot.value) {
          localStorage.setItem(snapshot.key, snapshot.value);
          changed = true;
        }
      } catch (_) {}

      if (changed) renderCurrentPageIfNeeded();

      if (!syncRequested) {
        try {
          if (typeof window.isFirebaseConnected === 'function' &&
              window.isFirebaseConnected() &&
              typeof window.syncToFirebase === 'function') {
            window.syncToFirebase(snapshot.key, snapshot.value);
            syncRequested = true;
          }
        } catch (_) {}
      }

      if (Date.now() - started < 5000) {
        setTimeout(protectRecentLocalValue, 80);
      } else {
        try {
          if (!syncRequested && typeof window.syncToFirebase === 'function') {
            window.syncToFirebase(snapshot.key, snapshot.value);
          }
        } catch (_) {}
        try { sessionStorage.removeItem(snapshotKey); } catch (_) {}
      }
    }

    setTimeout(protectRecentLocalValue, 0);
  }

  function installHeaderIdentity() {
    if (!isBudgetPage) return;
    var header = document.querySelector('.header');
    if (!header) return;
    var title = header.querySelector('h1');
    var subtitle = header.querySelector('p');
    if (title) title.textContent = 'Budget';
    if (subtitle) {
      subtitle.textContent = isMajaPage ? 'Maja' : 'Markus';
      subtitle.style.color = isMajaPage ? '#F472B6' : '#60A5FA';
      subtitle.style.fontWeight = '700';
    }
  }

  function financeTarget(view) {
    if (view === 'analysis') return isMajaPage ? 'analytics_maja.html' : 'analytics.html';
    if (view === 'family') return 'familjebudget.html';
    return isMajaPage ? 'budget_maja.html' : 'budget.html';
  }

  function navigateFinance(view) {
    var target = financeTarget(view);
    try {
      var active = document.activeElement;
      if (active && active !== document.body && typeof active.blur === 'function') active.blur();
    } catch (_) {}
    try { if (typeof window.saveLocal === 'function') window.saveLocal(); } catch (_) {}
    if (window.location.pathname.toLowerCase().endsWith('/' + target.toLowerCase())) return;
    window.location.href = target;
  }

  function installFinanceToggle() {
    if (!isBudgetPage) return null;
    var existing = document.getElementById('budget-finance-toggle-v7');
    if (existing) return existing;
    var header = document.querySelector('.header');
    if (!header) return null;

    var toggle = document.createElement('div');
    toggle.id = 'budget-finance-toggle-v7';
    toggle.className = 'budget-finance-toggle-v7';
    toggle.setAttribute('role','group');
    toggle.setAttribute('aria-label','Välj budgetvy');
    toggle.innerHTML =
      '<button type="button" class="budget-finance-option-v7 active" data-view="budget" aria-label="Budget" title="Budget">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h14.5A1.5 1.5 0 0 1 20 9v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12a1 1 0 0 1 0 2H5a1 1 0 0 0-1 1v.5Z"/><path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Z"/><circle cx="16" cy="13.5" r=".8"/></svg>' +
      '</button>' +
      '<button type="button" class="budget-finance-option-v7" data-view="analysis" aria-label="Analys" title="Analys">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 2 5-6"/><path d="m16.5 7 2.5 0 0 2.5"/></svg>' +
      '</button>' +
      '<button type="button" class="budget-finance-option-v7" data-view="family" aria-label="Familjebudget" title="Familjebudget">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-7 9 7"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-5h6v5"/><path d="M8.2 10.2c.9-1.7 3.3-1.5 3.8.2.5-1.7 2.9-1.9 3.8-.2.7 1.4-.3 2.9-3.8 5-3.5-2.1-4.5-3.6-3.8-5Z"/></svg>' +
      '</button>';

    toggle.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('[data-view]') : null;
      if (!button) return;
      navigateFinance(button.dataset.view);
    });
    header.appendChild(toggle);
    return toggle;
  }

  function installHeaderLayout() {
    if (!isBudgetPage) return;
    var header = document.querySelector('.header');
    if (!header) return;
    header.classList.add('budget-compact-header-v5');

    var monthNav = document.getElementById('month-nav');
    if (monthNav) monthNav.classList.add('budget-month-nav-v5');

    var toggle = document.getElementById('budget-user-toggle-v1');
    if (toggle) toggle.classList.add('budget-profile-toggle-v5');

    installFinanceToggle();
  }

  function installUiCleanup() {
    if (!isBudgetPage || window.__budgetUiCleanupV7Installed) return;
    window.__budgetUiCleanupV7Installed = true;
    installHeaderIdentity();
    installHeaderLayout();

    var style = document.createElement('style');
    style.id = 'budget-ui-cleanup-v7-style';
    style.textContent =
      '#set-start-month-btn{display:none!important}' +
      '#month-nav>button[onclick*="deleteCurrentMonth"]{display:none!important}' +
      '#month-nav>button[onclick*="addNewMonth"]{display:none!important}' +
      '.budget-month-delete-v4{margin-left:10px;width:24px;height:24px;border:0;border-radius:6px;background:transparent;color:#94A3B8;font:700 16px/1 Inter,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 24px}' +
      '.budget-month-delete-v4:hover{color:#F87171;background:rgba(248,113,113,.10)}' +
      '.custom-dropdown-item.budget-month-row-v4{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important}' +
      '.custom-dropdown-item.budget-month-add-v6{margin-top:4px!important;border-top:1px solid rgba(148,163,184,.22)!important;border-bottom:0!important;color:#4ADE80!important;font-weight:700!important;text-align:center!important;justify-content:center!important}' +
      '.custom-dropdown-item.budget-month-add-v6:hover{background:rgba(74,222,128,.10)!important;color:#4ADE80!important;padding-left:16px!important}' +
      '.header.budget-compact-header-v5{display:grid!important;grid-template-columns:minmax(72px,1fr) auto;grid-template-areas:"title months" "user months" "profile finance";align-items:center!important;column-gap:14px!important;row-gap:2px!important;padding:22px 70px 22px 20px!important;text-align:left!important}' +
      '.header.budget-compact-header-v5>h1{grid-area:title;margin:0!important;justify-self:start!important;line-height:1.05!important}' +
      '.header.budget-compact-header-v5>p{grid-area:user;margin:3px 0 0!important;justify-self:start!important;line-height:1.1!important}' +
      '.header.budget-compact-header-v5>#month-nav{grid-area:months;margin:0!important;display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important}' +
      '.header.budget-compact-header-v5>#budget-user-toggle-v1{grid-area:profile;margin:13px 0 0!important;justify-self:start!important;max-width:none!important;padding:2px!important;gap:1px!important;border-radius:9px!important}' +
      '.header.budget-compact-header-v5>#budget-user-toggle-v1 .budget-user-option-v1{min-width:52px!important;padding:5px 8px!important;border-radius:7px!important;font-size:10.5px!important}' +
      '.header.budget-compact-header-v5 #month-nav .custom-dropdown-wrapper{flex-basis:auto!important}' +
      '.header.budget-compact-header-v5 #month-dropdown{min-width:150px!important;width:auto!important;padding:8px 32px 8px 12px!important;font-size:12px!important;white-space:nowrap!important}' +
      '.budget-finance-toggle-v7{grid-area:finance;justify-self:end;margin:13px 0 0;display:flex;align-items:center;gap:2px;padding:2px;border:1px solid rgba(255,255,255,.20);border-radius:9px;background:rgba(255,255,255,.07);box-shadow:inset 0 1px 0 rgba(255,255,255,.04);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}' +
      '.budget-finance-option-v7{appearance:none;width:32px;height:28px;padding:0;border:0;border-radius:7px;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:.72;transition:background .15s ease,box-shadow .15s ease,opacity .15s ease,transform .1s ease;-webkit-tap-highlight-color:transparent}' +
      '.budget-finance-option-v7 svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
      '.budget-finance-option-v7:active{transform:scale(.96)}' +
      '.budget-finance-option-v7[data-view="budget"]{color:#60A5FA}' +
      '.budget-finance-option-v7[data-view="analysis"]{color:#4ADE80}' +
      '.budget-finance-option-v7[data-view="family"]{color:#FB923C}' +
      '.budget-finance-option-v7:hover{opacity:1;background:rgba(255,255,255,.055)}' +
      '.budget-finance-option-v7.active{opacity:1;background:rgba(96,165,250,.14);box-shadow:inset 0 0 0 1px rgba(96,165,250,.42)}' +
      '@media(max-width:600px){.header.budget-compact-header-v5{grid-template-columns:minmax(62px,.65fr) minmax(118px,1.35fr);column-gap:8px!important;padding:18px 60px 18px 14px!important}.header.budget-compact-header-v5>h1{font-size:19px!important}.header.budget-compact-header-v5>p{font-size:11px!important}.header.budget-compact-header-v5>#month-nav{gap:5px!important}.header.budget-compact-header-v5 #month-dropdown{min-width:118px!important;padding:7px 28px 7px 8px!important;font-size:11px!important}.header.budget-compact-header-v5>#budget-user-toggle-v1{margin-top:11px!important}.header.budget-compact-header-v5>#budget-user-toggle-v1 .budget-user-option-v1{min-width:46px!important;padding:4px 6px!important;font-size:10px!important}.budget-finance-toggle-v7{margin-top:11px}.budget-finance-option-v7{width:29px;height:26px}.budget-finance-option-v7 svg{width:15px;height:15px}}' +
      '@media(max-width:360px){.header.budget-compact-header-v5{grid-template-columns:minmax(56px,.55fr) minmax(108px,1.45fr);padding-left:10px!important;padding-right:54px!important}.header.budget-compact-header-v5 #month-dropdown{min-width:108px!important;font-size:10.5px!important}.header.budget-compact-header-v5>#budget-user-toggle-v1 .budget-user-option-v1{min-width:43px!important;padding-left:5px!important;padding-right:5px!important}.budget-finance-option-v7{width:27px}}';
    document.head.appendChild(style);

    function decorateMonthMenu() {
      var menu = document.getElementById('month-dropdown-menu');
      if (!menu) return;

      Array.prototype.slice.call(menu.querySelectorAll('.custom-dropdown-item:not(.budget-month-add-v6)')).forEach(function (item) {
        if (item.querySelector('.budget-month-delete-v4')) return;
        item.classList.add('budget-month-row-v4');
        var label = String(item.textContent || '').trim();
        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'budget-month-delete-v4';
        remove.setAttribute('aria-label','Radera ' + label);
        remove.title = 'Radera ' + label;
        remove.textContent = '×';
        remove.addEventListener('click',function (event) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof item.click === 'function') item.click();
          setTimeout(function () {
            if (typeof window.deleteCurrentMonth === 'function') window.deleteCurrentMonth();
          },0);
        });
        item.appendChild(remove);
      });

      if (!menu.querySelector('.budget-month-add-v6')) {
        var add = document.createElement('div');
        add.className = 'custom-dropdown-item budget-month-add-v6';
        add.setAttribute('role','button');
        add.setAttribute('tabindex','0');
        add.textContent = '+ Ny månad';

        function createMonth(event) {
          if (event) {
            event.preventDefault();
            event.stopPropagation();
          }
          menu.classList.remove('active');
          if (typeof window.addNewMonth === 'function') window.addNewMonth();
        }

        add.addEventListener('click', createMonth);
        add.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') createMonth(event);
        });
        menu.appendChild(add);
      }
    }

    decorateMonthMenu();
    var menu = document.getElementById('month-dropdown-menu');
    if (menu && window.MutationObserver) {
      new MutationObserver(decorateMonthMenu).observe(menu,{childList:true});
    }
  }

  function loadStable() {
    installPersistenceGuard();

    var stable = document.createElement('script');
    stable.src = 'budget-user-toggle-stable-999.js?v=20260828-2215-stable-999';
    stable.async = false;
    stable.onload = installUiCleanup;
    document.head.appendChild(stable);
  }

  loadStable();
})();