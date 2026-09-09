(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isMaja = path.endsWith('/budget/budget_maja.html') || path.endsWith('/budget_maja.html');
  var isBudget = path.endsWith('/budget/budget.html') || path.endsWith('/budget.html') || isMaja;
  if (!isBudget || window.__budgetPersistenceGuardInstalled) return;
  window.__budgetPersistenceGuardInstalled = true;

  var dataKey = isMaja ? 'budgetTracker_maja' : 'budgetTracker';
  var snapshotKey = 'budget-navigation-snapshot-v1';

  function refreshCurrentBudget() {
    try { if (typeof window.loadLocal === 'function') window.loadLocal(); } catch (_) {}
    try { if (typeof window.updateMonthDisplay === 'function') window.updateMonthDisplay(); } catch (_) {}
    try { if (typeof window.renderSections === 'function') window.renderSections(); } catch (_) {}
    try { if (typeof window.renderKPIs === 'function') window.renderKPIs(); } catch (_) {}
    try { if (typeof window.updateCharts === 'function') window.updateCharts(); } catch (_) {}
    try { if (typeof window.saveSelectedMonth === 'function') window.saveSelectedMonth(); } catch (_) {}
  }

  function saveSnapshot() {
    // Snapshot only what is already persisted. Do not call saveLocal() on pagehide:
    // the in-memory model may still be older than a just-received Firebase value.
    try {
      var value = localStorage.getItem(dataKey);
      if (!value) return;
      sessionStorage.setItem(snapshotKey, JSON.stringify({ at: Date.now(), key: dataKey, value: value }));
    } catch (_) {}
  }

  window.addEventListener('pagehide', saveSnapshot, { capture: true });

  // Firebase performs its initial remote -> local hydration asynchronously. The inline
  // budget renderer can therefore run before the fresh value reaches localStorage.
  // Re-read persisted data a few times during startup so refresh never leaves stale
  // zero-values on screen.
  [350, 900, 1800, 3200, 5200].forEach(function (delay) {
    setTimeout(refreshCurrentBudget, delay);
  });

  window.addEventListener('firebase-sync', function (event) {
    if (!event || !event.detail || event.detail.key !== dataKey) return;
    setTimeout(refreshCurrentBudget, 0);
  });

  window.addEventListener('pageshow', function () {
    setTimeout(refreshCurrentBudget, 0);
    setTimeout(refreshCurrentBudget, 600);
  });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) setTimeout(refreshCurrentBudget, 0);
  });

  // The previous guard restored a recent session snapshot over newer Firebase data
  // and pushed that snapshot back to Firebase. Retire any such snapshot instead.
  try { sessionStorage.removeItem(snapshotKey); } catch (_) {}
})();
