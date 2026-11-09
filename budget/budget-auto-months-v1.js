/*
 * Budget auto months (budget.html, budget_maja.html).
 *
 * - Months missing between the latest saved month and now are created: budgets copied from the
 *   month before, actual values 0, transfers (Huskonto, ICA-konto, Barnbidrag) from familjebudget.
 * - From the 25th the next month is created too.
 * - Opening the page (or coming back after 30 min) always shows the current month.
 *
 * Firebase safety: before the first Firebase read the months are written locally only
 * (firebase-sync has no database yet, so nothing is pushed). After the first read
 * ('firebase-initial-load') they are rebuilt on top of the fresh remote data and saved.
 *
 * Uses the page's own globals: monthlyData, currentMonth, SECTIONS, getMonthKey,
 * getTransferValuesForMonth, loadLocal, saveLocal, saveSelectedMonth, updateMonthDisplay,
 * renderKPIs, renderSections, updateCharts.
 */
(function () {
  'use strict';
  var path = location.pathname.toLowerCase();
  var dataKey = /budget_maja\.html$/.test(path) ? 'budgetTracker_maja' : 'budgetTracker';
  var autoCreated = {};

  function keyOf(d) { return getMonthKey(d); }
  function dateOf(key) { var p = key.split('-').map(Number); return new Date(p[0], p[1] - 1, 1); }
  function nextKey(key) { var d = dateOf(key); d.setMonth(d.getMonth() + 1); return keyOf(d); }
  function todayKey() { return keyOf(new Date()); }
  function targetKey() {
    var now = new Date();
    return now.getDate() >= 25 ? keyOf(new Date(now.getFullYear(), now.getMonth() + 1, 1)) : keyOf(now);
  }

  function storedKeys() {
    try {
      var data = JSON.parse(localStorage.getItem(dataKey) || 'null');
      return data && data.monthlyData ? Object.keys(data.monthlyData).sort() : [];
    } catch (_) { return []; }
  }

  function buildMonth(fromKey, key) {
    var from = monthlyData[fromKey];
    var sections = JSON.parse(JSON.stringify(from && from.sections ? from.sections : SECTIONS));
    sections.forEach(function (s) { (s.items || []).forEach(function (it) { it.actual = 0; }); });
    try {
      var t = getTransferValuesForMonth(dateOf(key), dataKey === 'budgetTracker');
      if (t) {
        var set = function (sectionKey, itemName, value) {
          var s = sections.find(function (x) { return x.key === sectionKey; });
          var it = s && s.items.find(function (i) { return i.name === itemName; });
          if (it && value != null) it.budget = value;
        };
        set('income', 'Barnbidrag', t.barnbidrag);
        set('house', 'Huskonto', t.huskonto);
        set('misc', 'ICA-konto', t.ica);
      }
    } catch (_) {}
    return { sections: sections };
  }

  // Create every month after the latest saved one up to the target. Returns true when it created any.
  function ensure() {
    var saved = storedKeys();
    if (!saved.length) return false;
    var target = targetKey();
    var key = saved[saved.length - 1];
    var created = false;
    var guard = 0;
    while (key < target && guard++ < 36) {
      var next = nextKey(key);
      monthlyData[next] = buildMonth(key, next);
      autoCreated[next] = true;
      created = true;
      key = next;
    }
    return created;
  }

  function render() {
    try { updateMonthDisplay(); } catch (_) {}
    try { renderKPIs(); } catch (_) {}
    try { renderSections(); } catch (_) {}
    try { updateCharts(); } catch (_) {}
  }

  function showCurrentMonth() {
    var key = todayKey();
    if (!monthlyData[key]) return;
    currentMonth = dateOf(key);
    try { saveSelectedMonth(); } catch (_) {}
  }
  // Let finance-ui rebuild its month menu (it reads the saved months).
  function announce() {
    window.dispatchEvent(new CustomEvent('firebase-sync', { detail: { key: dataKey, value: localStorage.getItem(dataKey) } }));
  }

  function run(save) {
    var created = ensure();
    if (created && save) { try { saveLocal(); } catch (_) {} }
    return created;
  }

  // 1) Page start: before DOMContentLoaded, firebase-sync has no database, so this write stays local.
  run(true);
  showCurrentMonth();
  render();

  // 2) After the first Firebase read: rebuild on top of the remote data and save (this one syncs).
  var initialDone = false;
  function afterInitialLoad() {
    if (initialDone) return;
    initialDone = true;
    // Start from exactly what Firebase holds, so nothing stale from this phone is pushed back.
    var fresh = storedKeys();
    if (fresh.length) Object.keys(monthlyData).forEach(function (k) { if (fresh.indexOf(k) === -1) delete monthlyData[k]; });
    autoCreated = {};
    try { loadLocal(); } catch (_) {}
    run(true);
    showCurrentMonth();
    render();
    announce();
  }
  if (window.__firebaseInitialLoadDone) afterInitialLoad();
  window.addEventListener('firebase-initial-load', afterInitialLoad);

  // 3) The app may stay open for days: check again when it comes back; jump to now after 30 min away.
  var hiddenAt = 0;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    var created = initialDone ? run(true) : false;
    if (hiddenAt && Date.now() - hiddenAt > 30 * 60 * 1000) showCurrentMonth();
    if (created) { render(); announce(); }
  });

  // The Apple Pay inbox asks for a month that may not exist yet.
  window.budgetEnsureMonths = function () {
    var created = run(initialDone);
    if (created) render();
    return created;
  };
})();
