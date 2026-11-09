/* Shared monthly net-income source for Familjebudget and Home. */
(function () {
  'use strict';
  const MONTHS = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
  const DEFAULTS = {
    '2026-10': { markus: 37288, maja: 11479 },
    '2026-11': { markus: 37288, maja: 11605 },
    '2026-12': { markus: 37288, maja: 10260 }
  };
  const has = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
  function amount(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(typeof value === 'string' ? value.replace(/[\s\u00a0]/g, '').replace(',', '.') : value);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  function key(row) {
    if (!row) return '';
    const index = MONTHS.indexOf(row.month);
    if (index < 0) return '';
    return String(row.year) + '-' + String(index + 1).padStart(2, '0');
  }
  function legacyFor(monthKey) {
    try {
      const saved = JSON.parse(localStorage.getItem('home_transfer_income_v1') || '{}');
      return saved && typeof saved[monthKey] === 'object' ? saved[monthKey] : {};
    } catch (_) {
      return {};
    }
  }
  function get(row) {
    const monthKey = key(row);
    const old = legacyFor(monthKey);
    const defaults = DEFAULTS[monthKey] || {};
    const find = (person) => {
      if (has(row, person + 'Netto')) return amount(row[person + 'Netto']);
      if (has(old, person)) return amount(old[person]);
      return amount(defaults[person]);
    };
    return { markus: find('markus'), maja: find('maja') };
  }
  function complete(row) {
    if (!row) return row;
    const incomes = get(row);
    if (!has(row, 'markusNetto') && incomes.markus !== null) row.markusNetto = incomes.markus;
    if (!has(row, 'majaNetto') && incomes.maja !== null) row.majaNetto = incomes.maja;
    return row;
  }
  // Same formulas as the Överföringar sheet in Huskalkyl.xlsx:
  // Netto total = Markus + Maja, Maja andel = Maja / total, Markus andel = Markus / total,
  // Huskonto X = INT(Husutgifter × andel), ICA X = INT(ICA-kort × andel).
  function recalculate(row) {
    const income = get(row);
    if (income.markus === null || income.maja === null) return false;
    const total = income.markus + income.maja;
    if (!(total > 0)) return false;
    const majaShare = income.maja / total;
    const markusShare = income.markus / total;
    const house = Number(row.husutgifter) || 0;
    const ica = Number(row.ica) || 0;
    Object.assign(row, {
      majaAndel: majaShare, markusAndel: markusShare,
      huskontoMaja: Math.floor(house * majaShare), huskontoMarkus: Math.floor(house * markusShare),
      icaMaja: Math.floor(ica * majaShare), icaMarkus: Math.floor(ica * markusShare)
    });
    return true;
  }

  // ── House cost per month, as the Data sheet in Huskalkyl.xlsx ──
  // Month 1 is the loan start; April 2025 is month 2 in the sheet (Överföringar!D3 = Data!L5).
  // Ränta = INT(lån × listränta% × skattereduktion% / 12), Drift = INT((drift + fastighetsavgift) / 12),
  // Amortering = INT(huslån × amortering% / 12), 1 % under 70 % belåning, 0 under 50 %,
  // Renovering = INT(huspris × renovering% / 12), Totalt hus = summan, nästa månads lån = lån − amortering.
  const LOAN_PARAMS = { huspris: 5000000, huslan: 3750000, listranta: 3.067, driftkostnad: 47025, fastighetsavgift: 9525, skattereduktion: 100, renovering: 1, ammortering: 2 };
  const SHEET_START = '2025-04';   // month 2
  const AUTO_FROM = '2027-01';     // months after the sheet's last row (December 2026) are filled here
  function monthDiff(a, b) { const [ay, am] = a.split('-').map(Number), [by, bm] = b.split('-').map(Number); return (by - ay) * 12 + (bm - am); }
  function sheetMonth(monthKey) { return monthDiff(SHEET_START, monthKey) + 2; }
  function houseMonth(n, params) {
    const p = Object.assign({}, LOAN_PARAMS, params || {});
    const start = Number(p.huslan) || 0;
    const fullAmort = Math.floor(start * (Number(p.ammortering) || 0) / 100 / 12);
    const amortFor = (loan, first) => {
      if (first) return fullAmort;
      const below70 = loan < 0.7 * start, below50 = loan < 0.5 * start;
      if (below70 && below50) return 0;
      return below70 ? Math.floor(start * 1 / 100 / 12) : fullAmort;
    };
    let loan = start;
    for (let m = 1; m < n; m++) loan -= amortFor(loan, m === 1);
    const interest = Math.floor(loan * (Number(p.listranta) || 0) / 100 * (Number(p.skattereduktion) || 0) / 100 / 12);
    const drift = Math.floor(((Number(p.driftkostnad) || 0) + (Number(p.fastighetsavgift) || 0)) / 12);
    const amort = amortFor(loan, n <= 1);
    const reno = Math.floor((Number(p.huspris) || 0) * (Number(p.renovering) || 0) / 100 / 12);
    return { month: n, loan, interest, drift, amort, reno, total: interest + drift + amort + reno };
  }
  function sum(list) { return (Array.isArray(list) ? list : []).reduce((t, e) => t + (Number(e && e.amount) || 0), 0); }
  // Husutgifter = Totalt hus + Huskonto-utgifter (as Överföringar!D13 and onwards).
  function houseCosts(monthKey, store) {
    store = store || {};
    return houseMonth(sheetMonth(monthKey), store.loanParams).total + sum(store.huskonto);
  }
  function nextKey(monthKey) { const [y, m] = monthKey.split('-').map(Number); return m === 12 ? (y + 1) + '-01' : y + '-' + String(m + 1).padStart(2, '0'); }
  function rowKey(row) { return key(row); }
  // A new month after December 2026: ICA-kort and both net salaries copied from the month before,
  // Husutgifter from the formula, the rest recalculated.
  function projectRow(prev, monthKey, store) {
    const [y, m] = monthKey.split('-').map(Number);
    const income = get(prev);
    const row = { year: y, month: MONTHS[m - 1], husAuto: true, husutgifter: houseCosts(monthKey, store), ica: Number(prev && prev.ica) || 8331 };
    if (income.markus !== null) row.markusNetto = income.markus;
    if (income.maja !== null) row.majaNetto = income.maja;
    if (!recalculate(row)) Object.assign(row, {
      majaAndel: prev.majaAndel, markusAndel: prev.markusAndel,
      huskontoMaja: Math.floor(row.husutgifter * prev.majaAndel), huskontoMarkus: Math.floor(row.husutgifter * prev.markusAndel),
      icaMaja: Math.floor(row.ica * prev.majaAndel), icaMarkus: Math.floor(row.ica * prev.markusAndel)
    });
    return row;
  }
  // Add missing months up to uptoKey (never before AUTO_FROM). Returns true when rows were added.
  function ensureRows(store, uptoKey) {
    if (!store || !Array.isArray(store.transfers) || !store.transfers.length) return false;
    const rows = store.transfers;
    let last = rows.reduce((a, r) => (key(r) > key(a) ? r : a), rows[0]);
    let added = false, guard = 0;
    while (key(last) && key(last) < uptoKey && guard++ < 60) {
      const k = nextKey(key(last));
      if (k < AUTO_FROM) break;
      const row = projectRow(last, k, store);
      rows.push(row); last = row; added = true;
    }
    return added;
  }
  // Keep formula-driven Husutgifter in step with loan parameters and Huskonto-utgifter.
  function refreshAuto(store) {
    if (!store || !Array.isArray(store.transfers)) return false;
    let changed = false;
    store.transfers.forEach(row => {
      if (!row || !row.husAuto) return;
      const h = houseCosts(key(row), store);
      if (h !== Number(row.husutgifter)) {
        row.husutgifter = h;
        if (!recalculate(row)) Object.assign(row, {
          huskontoMaja: Math.floor(h * (row.majaAndel || 0)), huskontoMarkus: Math.floor(h * (row.markusAndel || 0))
        });
        changed = true;
      }
    });
    return changed;
  }
  // The stored row for a month, or a projected one (read-only) when it has not been created yet.
  function rowFor(store, monthKey) {
    const rows = (store && Array.isArray(store.transfers)) ? store.transfers : [];
    const found = rows.find(r => key(r) === monthKey);
    if (found || monthKey < AUTO_FROM || !rows.length) return found || null;
    const copy = { transfers: rows.map(r => Object.assign({}, r)), loanParams: store.loanParams, huskonto: store.huskonto };
    ensureRows(copy, monthKey);
    return copy.transfers.find(r => key(r) === monthKey) || null;
  }
  function update(row, person, value) {
    if (!row || (person !== 'markus' && person !== 'maja')) return false;
    const number = amount(value);
    if (number === null) return false;
    complete(row);
    row[person + 'Netto'] = number;
    recalculate(row);
    return true;
  }
  window.TransferIncome = Object.freeze({ MONTHS, DEFAULTS, AUTO_FROM, amount, key, get, complete, recalculate, update,
    sheetMonth, houseMonth, houseCosts, projectRow, ensureRows, refreshAuto, rowFor, nextKey });
})();
