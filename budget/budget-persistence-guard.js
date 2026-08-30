(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isMaja = path.endsWith('/budget/budget_maja.html') || path.endsWith('/budget_maja.html');
  var isBudget = path.endsWith('/budget/budget.html') || path.endsWith('/budget.html') || isMaja;
  if (!isBudget || window.__budgetPersistenceGuardInstalled) return;
  window.__budgetPersistenceGuardInstalled = true;

  var dataKey = isMaja ? 'budgetTracker_maja' : 'budgetTracker';
  var snapshotKey = 'budget-navigation-snapshot-v1';

  function writeLocal(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
    try {
      if (typeof window.fallbackSetItem === 'function') window.fallbackSetItem(key, value);
    } catch (_) {}
  }

  function saveSnapshot() {
    try { if (typeof window.saveLocal === 'function') window.saveLocal(); } catch (_) {}
    try {
      var value = localStorage.getItem(dataKey);
      if (!value) return;
      sessionStorage.setItem(snapshotKey, JSON.stringify({ at: Date.now(), key: dataKey, value: value }));
    } catch (_) {}
  }

  window.addEventListener('pagehide', saveSnapshot, { capture: true });

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
  var synced = false;

  function refreshCurrentBudget() {
    if (snapshot.key !== dataKey) return;
    try { if (typeof window.loadLocal === 'function') window.loadLocal(); } catch (_) {}
    try { if (typeof window.updateMonthDisplay === 'function') window.updateMonthDisplay(); } catch (_) {}
    try { if (typeof window.renderSections === 'function') window.renderSections(); } catch (_) {}
    try { if (typeof window.renderKPIs === 'function') window.renderKPIs(); } catch (_) {}
    try { if (typeof window.updateCharts === 'function') window.updateCharts(); } catch (_) {}
    try { if (typeof window.saveSelectedMonth === 'function') window.saveSelectedMonth(); } catch (_) {}
  }

  function syncSnapshot() {
    if (synced) return;
    try {
      if (typeof window.isFirebaseConnected === 'function' &&
          window.isFirebaseConnected() &&
          typeof window.syncToFirebase === 'function') {
        window.syncToFirebase(snapshot.key, snapshot.value);
        synced = true;
      }
    } catch (_) {}
  }

  function protect() {
    var changed = false;
    try {
      if (localStorage.getItem(snapshot.key) !== snapshot.value) {
        writeLocal(snapshot.key, snapshot.value);
        changed = true;
      }
    } catch (_) {}

    if (changed) refreshCurrentBudget();
    syncSnapshot();

    if (Date.now() - started < 5000) {
      setTimeout(protect, 80);
      return;
    }

    if (!synced) {
      try {
        if (typeof window.syncToFirebase === 'function') window.syncToFirebase(snapshot.key, snapshot.value);
      } catch (_) {}
    }
    try { sessionStorage.removeItem(snapshotKey); } catch (_) {}
  }

  setTimeout(protect, 0);
})();
