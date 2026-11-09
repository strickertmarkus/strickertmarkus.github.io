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

  // Net salary and the house/ICA transfers come from familjebudget (the same source as Home).
  // Only the current and later months are filled, so past months keep their history.
  // Budget is always kept in step; the received amount is filled for the current month while
  // it is 0 or still equals the old synced value (a hand-typed amount is left alone).
  var person = dataKey === 'budgetTracker' ? 'markus' : 'maja';
  var MONTHS = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
  // The stored transfer row, or one projected with the Huskalkyl formulas for months after December 2026.
  function transferRow(key) {
    try {
      var data = JSON.parse(localStorage.getItem('familjebudget_data') || 'null');
      if (!data || !Array.isArray(data.transfers)) return null;
      if (window.TransferIncome && window.TransferIncome.rowFor) return window.TransferIncome.rowFor(data, key);
      var d = dateOf(key);
      return data.transfers.find(function (r) { return r && Number(r.year) === d.getFullYear() && r.month === MONTHS[d.getMonth()]; }) || null;
    } catch (_) { return null; }
  }
  function syncFromFamily() {
    var changed = false;
    var now = todayKey();
    Object.keys(monthlyData).forEach(function (key) {
      if (key < now) return;
      var row = transferRow(key);
      if (!row) return;
      var sections = monthlyData[key].sections || [];
      var find = function (sectionKey, test) {
        var s = sections.find(function (x) { return x.key === sectionKey; });
        return s ? (s.items || []).find(test) : null;
      };
      var setBudget = function (item, value) {
        if (!item || value == null || !isFinite(value)) return;
        value = Math.round(Number(value));
        if (Number(item.budget) !== value) { item.budget = value; changed = true; }
      };
      var net = null;
      try { if (window.TransferIncome) net = window.TransferIncome.get(row)[person]; } catch (_) {}
      var salary = find('income', function (i) { return /^lön/i.test(i.name || ''); });
      if (salary && net != null) {
        var oldBudget = Number(salary.budget) || 0;
        setBudget(salary, net);
        var actual = Number(salary.actual) || 0;
        if (key === now && (actual === 0 || actual === oldBudget) && actual !== Math.round(net)) { salary.actual = Math.round(net); changed = true; }
      }
      setBudget(find('house', function (i) { return i.name === 'Huskonto'; }), row[person === 'markus' ? 'huskontoMarkus' : 'huskontoMaja']);
      setBudget(find('misc', function (i) { return i.name === 'ICA-konto'; }), row[person === 'markus' ? 'icaMarkus' : 'icaMaja']);
    });
    return changed;
  }

  function run(save) {
    var created = ensure();
    created = syncFromFamily() || created;
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

  // A new net salary or transfer saved on Home / Familjebudget.
  window.addEventListener('firebase-sync', function (e) {
    if (!initialDone || !e.detail || e.detail.key !== 'familjebudget_data') return;
    if (run(true)) render();
  });

  // The Apple Pay inbox asks for a month that may not exist yet.
  window.budgetEnsureMonths = function () {
    var created = run(initialDone);
    if (created) render();
    return created;
  };
})();
