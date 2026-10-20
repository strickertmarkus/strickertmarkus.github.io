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
    const index = row && MONTHS.indexOf(row.month);
    if (index === undefined || index < 0) return '';
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
  function recalculate(row) {
    const income = get(row);
    if (income.markus === null || income.maja === null) return false;
    const total = income.markus + income.maja;
    if (!(total > 0)) return false;
    const markusShare = income.markus / total;
    const majaShare = 1 - markusShare;
    const house = Number(row.husutgifter) || 0;
    const ica = Number(row.ica) || 0;
    const markusHouse = Math.round(house * markusShare);
    const markusIca = Math.round(ica * markusShare);
    Object.assign(row, {
      majaAndel: majaShare, markusAndel: markusShare,
      huskontoMaja: house - markusHouse, huskontoMarkus: markusHouse,
      icaMaja: ica - markusIca, icaMarkus: markusIca
    });
    return true;
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
  window.TransferIncome = Object.freeze({ MONTHS, DEFAULTS, amount, key, get, complete, recalculate, update });
})();
