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

    /* saveLocal() writes immediately to localStorage, while firebase-sync.js
       debounces its remote write. Keep one short-lived same-tab snapshot so a
       fast navigation/reload cannot let an older Firebase value overwrite the
       local budget that the user just left. */
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

  function installUiCleanup() {
    if (!isBudgetPage || window.__budgetUiCleanupV4Installed) return;
    window.__budgetUiCleanupV4Installed = true;
    installHeaderIdentity();

    var style = document.createElement('style');
    style.id = 'budget-ui-cleanup-v4-style';
    style.textContent =
      '#set-start-month-btn{display:none!important}' +
      '#month-nav>button[onclick*="deleteCurrentMonth"]{display:none!important}' +
      '.budget-month-delete-v4{margin-left:10px;width:24px;height:24px;border:0;border-radius:6px;background:transparent;color:#94A3B8;font:700 16px/1 Inter,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 24px}' +
      '.budget-month-delete-v4:hover{color:#F87171;background:rgba(248,113,113,.10)}' +
      '.custom-dropdown-item.budget-month-row-v4{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important}';
    document.head.appendChild(style);

    function decorateMonthMenu() {
      var menu = document.getElementById('month-dropdown-menu');
      if (!menu) return;
      Array.prototype.slice.call(menu.querySelectorAll('.custom-dropdown-item')).forEach(function (item) {
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
          /* Reuse the page's own month-selection and deletion paths so its
             existing persistence/save logic remains the single source of truth. */
          if (typeof item.click === 'function') item.click();
          setTimeout(function () {
            if (typeof window.deleteCurrentMonth === 'function') window.deleteCurrentMonth();
          },0);
        });
        item.appendChild(remove);
      });
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