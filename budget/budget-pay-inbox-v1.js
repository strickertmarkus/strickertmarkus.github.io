/* Apple Pay inbox for the budget pages (budget.html / budget_maja.html).
 *
 * An iOS Shortcuts automation ("When I tap any of my cards") POSTs each Wallet payment to
 * Realtime Database: pay_inbox/<secret token>/<push id> = { amount, merchant, card, who }.
 * The database rules only let that token CREATE entries (no read, no edit); the family reads
 * and clears them while signed in. Nothing reaches the budget until it is approved here.
 *
 * Learning: approving "ICA Maxi" -> Övrigt / Matinköp stores that in localStorage
 * `pay_merchant_rules` ({ markus: { "ica maxi": { section, item } }, maja: {...} }), synced by
 * firebase-sync.js, so the next purchase there is pre-selected.
 *
 * Uses the page's own globals: monthlyData, currentMonth, getMonthKey, getCurrentMonthSections,
 * refresh, fmt.
 */
(function () {
  'use strict';
  if (window.__budgetPayInboxV1) return;
  window.__budgetPayInboxV1 = true;

  var WHO = /budget_maja\.html$/i.test(location.pathname) ? 'maja' : 'markus';
  var RULES_KEY = 'pay_merchant_rules';
  var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  var MONTHS_LONG = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];

  var entries = [];          // [{ path, key, raw, amount, merchant, card, time }]
  var panel = null;
  var db = null;

  // ── helpers ───────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    try { return typeof fmt === 'function' ? fmt(n) : Math.round(n).toLocaleString('sv-SE'); }
    catch (_) { return String(Math.round(n)); }
  }
  // "487,00 kr", "SEK 1 234.50", "1.234,50", 487 -> 487 / 1235
  function parseAmount(v) {
    if (typeof v === 'number') return isFinite(v) ? Math.abs(v) : 0;
    var s = String(v || '').replace(/[\s  ]/g, '').replace(/[^0-9.,-]/g, '');
    if (!s) return 0;
    var lastComma = s.lastIndexOf(','), lastDot = s.lastIndexOf('.');
    if (lastComma > -1 && lastDot > -1) {
      var dec = lastComma > lastDot ? ',' : '.';
      s = s.split(dec === ',' ? '.' : ',').join('').replace(dec, '.');
    } else if (lastComma > -1) {
      s = s.replace(/,/g, '.');
    } else if (lastDot > -1 && s.length - lastDot - 1 === 3) {   // "1.234" is thousands, never 3 decimals
      s = s.replace(/\./g, '');
    }
    var n = Math.abs(parseFloat(s));
    return isFinite(n) ? n : 0;
  }
  function pushTime(key) {
    var t = 0;
    for (var i = 0; i < 8; i++) {
      var c = PUSH_CHARS.indexOf(key.charAt(i));
      if (c < 0) return Date.now();
      t = t * 64 + c;
    }
    return t;
  }
  function norm(merchant) {
    return String(merchant || '').toLowerCase()
      .replace(/[0-9#*]+/g, ' ').replace(/[^a-zåäöéü&\s-]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function readRules() {
    try { return JSON.parse(localStorage.getItem(RULES_KEY) || '{}') || {}; } catch (_) { return {}; }
  }
  function writeRules(rules) {
    try { localStorage.setItem(RULES_KEY, JSON.stringify(rules)); } catch (_) {}
  }
  function guessTarget(merchant) {
    var mine = readRules()[WHO] || {};
    var n = norm(merchant);
    if (!n) return null;
    if (mine[n]) return mine[n];
    // longest learned name that starts the merchant text ("ica maxi" matches "ica maxi linkoping")
    var best = null, bestLen = 0;
    Object.keys(mine).forEach(function (k) {
      if (k.length > bestLen && (n.indexOf(k + ' ') === 0 || n === k)) { best = mine[k]; bestLen = k.length; }
    });
    return best;
  }

  // ── budget data ───────────────────────────────────────────
  function sectionsFor(date) {
    var key = getMonthKey(date);
    if (!monthlyData[key] && typeof window.budgetEnsureMonths === 'function') window.budgetEnsureMonths();
    if (monthlyData[key] && monthlyData[key].sections) return { sections: monthlyData[key].sections, own: true, date: date };
    return { sections: getCurrentMonthSections(), own: false, date: currentMonth };
  }
  function targetOptions() {
    return getCurrentMonthSections().filter(function (s) { return !s.isIncome; }).map(function (s) {
      return { key: s.key, name: s.name, items: s.items.map(function (it) { return it.name; }) };
    });
  }
  function findItem(sections, target) {
    if (!target) return null;
    var sec = sections.find(function (s) { return s.key === target.section; });
    if (!sec) return null;
    var item = sec.items.find(function (it) { return it.name === target.item; });
    return item ? { section: sec, item: item } : null;
  }

  // ── UI ────────────────────────────────────────────────────
  function ensurePanel() {
    if (panel && document.body.contains(panel)) return panel;
    var anchor = document.getElementById('sections-container');
    if (!anchor) return null;
    panel = document.createElement('section');
    panel.className = 'pay-inbox';
    panel.id = 'pay-inbox';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Nya köp att sortera');
    var row = document.querySelector('.new-section-row');
    (row || anchor).parentNode.insertBefore(panel, row || anchor);
    panel.addEventListener('click', onPanelClick);
    panel.addEventListener('change', onPanelChange);
    return panel;
  }

  function optionHtml(selected) {
    var html = '<option value="">Välj post…</option>';
    targetOptions().forEach(function (s) {
      html += '<optgroup label="' + esc(s.name) + '">';
      s.items.forEach(function (name) {
        var v = s.key + '\u001f' + name;
        var sel = selected && selected.section === s.key && selected.item === name ? ' selected' : '';
        html += '<option value="' + esc(v) + '"' + sel + '>' + esc(name) + '</option>';
      });
      html += '</optgroup>';
    });
    return html;
  }

  function render() {
    var p = ensurePanel();
    if (!p) return;
    var mine = entries.slice().sort(function (a, b) { return b.time - a.time; });
    if (!mine.length) { p.hidden = true; p.innerHTML = ''; return; }
    var suggested = 0;
    var rows = mine.map(function (e) {
      var guess = guessTarget(e.merchant);
      var valid = guess && findItem(getCurrentMonthSections(), guess) ? guess : null;
      if (valid) suggested++;
      var d = new Date(e.time);
      var meta = money(e.amount) + ' kr · ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + (e.card ? ' · ' + esc(e.card) : '');
      return '<div class="pay-row" data-key="' + esc(e.key) + '">' +
        '<div class="pay-main"><span class="pay-merchant">' + esc(e.merchant || 'Okänd butik') + '</span>' +
        '<span class="pay-meta">' + meta + '</span></div>' +
        '<div class="pay-actions">' +
          '<label class="pay-select-wrap' + (valid ? ' is-suggested' : '') + '"><span class="sr-only">Post för ' + esc(e.merchant || 'köpet') + '</span>' +
          '<select class="pay-select" data-key="' + esc(e.key) + '">' + optionHtml(valid) + '</select></label>' +
          '<button type="button" class="pay-ok" data-act="ok" data-key="' + esc(e.key) + '" aria-label="Lägg till ' + esc(money(e.amount)) + ' kr"' + (valid ? '' : ' disabled') + '>' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>' +
          '<button type="button" class="pay-skip" data-act="skip" data-key="' + esc(e.key) + '" aria-label="Hoppa över ' + esc(e.merchant || 'köpet') + '">×</button>' +
        '</div></div>';
    }).join('');
    p.innerHTML =
      '<div class="pay-head"><span class="pay-title">Nya köp att sortera</span><span class="pay-count">' + mine.length + '</span>' +
      (suggested > 1 ? '<button type="button" class="pay-all" data-act="all">Godkänn förslag (' + suggested + ')</button>' : '') +
      '</div>' + rows;
    p.hidden = false;
  }

  function entryByKey(key) { return entries.find(function (e) { return e.key === key; }); }
  function selectedTarget(key) {
    var sel = panel && panel.querySelector('select.pay-select[data-key="' + CSS.escape(key) + '"]');
    if (!sel || !sel.value) return null;
    var parts = sel.value.split('\u001f');
    return { section: parts[0], item: parts.slice(1).join('\u001f') };
  }

  function onPanelChange(e) {
    var sel = e.target.closest('select.pay-select');
    if (!sel) return;
    var ok = panel.querySelector('.pay-ok[data-key="' + CSS.escape(sel.dataset.key) + '"]');
    if (ok) ok.disabled = !sel.value;
    var wrap = sel.closest('.pay-select-wrap');
    if (wrap) wrap.classList.remove('is-suggested');
  }

  function onPanelClick(e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    if (btn.dataset.act === 'skip') skip(btn.dataset.key);
    else if (btn.dataset.act === 'ok') approve([btn.dataset.key]);
    else if (btn.dataset.act === 'all') {
      approve(entries.filter(function (en) { return !!selectedTarget(en.key); }).map(function (en) { return en.key; }));
    }
  }

  // ── actions ───────────────────────────────────────────────
  function approve(keys) {
    var done = [];
    var rules = readRules();
    rules[WHO] = rules[WHO] || {};
    keys.forEach(function (key) {
      var en = entryByKey(key);
      var target = selectedTarget(key);
      if (!en || !target) return;
      var where = sectionsFor(new Date(en.time));
      var hit = findItem(where.sections, target);
      if (!hit) return;
      hit.item.actual = (hit.item.actual || 0) + Math.round(en.amount);
      var n = norm(en.merchant);
      if (n) rules[WHO][n] = { section: target.section, item: target.item };
      done.push({ en: en, item: hit.item, amount: Math.round(en.amount), date: where.date });
    });
    if (!done.length) return;
    writeRules(rules);
    entries = entries.filter(function (en) { return !done.some(function (d) { return d.en.key === en.key; }); });
    refresh();
    render();
    done.forEach(function (d) { removeRemote(d.en); });
    var first = done[0];
    var otherMonth = getMonthKey(first.date) !== getMonthKey(currentMonth) ? ' i ' + MONTHS_LONG[first.date.getMonth()] : '';
    var msg = done.length === 1
      ? 'Lade till ' + money(first.amount) + ' kr på ' + first.item.name + otherMonth
      : 'Lade till ' + done.length + ' köp';
    toast(msg, function () {
      done.forEach(function (d) {
        d.item.actual = (d.item.actual || 0) - d.amount;
        restoreRemote(d.en);
      });
      refresh();
    });
  }

  function skip(key) {
    var en = entryByKey(key);
    if (!en) return;
    entries = entries.filter(function (x) { return x.key !== key; });
    render();
    removeRemote(en);
    toast('Köpet hoppades över', function () { restoreRemote(en); });
  }

  function removeRemote(en) {
    if (!db) return;
    db.ref(en.path).remove().catch(function (err) { console.warn('[PayInbox] remove failed', err && err.message); });
  }
  function restoreRemote(en) {
    if (!db) return;
    db.ref(en.path).set(en.raw).catch(function (err) { console.warn('[PayInbox] restore failed', err && err.message); });
  }

  var toastEl = null, toastTimer = 0;
  function toast(text, undo) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'pay-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    clearTimeout(toastTimer);
    toastEl.innerHTML = '<span>' + esc(text) + '</span>' + (undo ? '<button type="button">Ångra</button>' : '');
    var b = toastEl.querySelector('button');
    if (b) b.onclick = function () { clearTimeout(toastTimer); toastEl.classList.remove('show'); undo(); };
    toastEl.classList.add('show');
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 6000);
  }

  // ── Firebase ──────────────────────────────────────────────
  function onSnapshot(snap) {
    var next = [];
    var all = snap.val() || {};
    Object.keys(all).forEach(function (token) {
      var group = all[token] || {};
      Object.keys(group).forEach(function (key) {
        var raw = group[key] || {};
        var who = String(raw.who || 'markus').toLowerCase();
        if (who !== WHO) return;
        var amount = parseAmount(raw.amount);
        if (!amount) return;
        next.push({
          path: 'pay_inbox/' + token + '/' + key, key: key, raw: raw, amount: amount,
          merchant: String(raw.merchant || '').trim(), card: String(raw.card || '').trim(), time: pushTime(key)
        });
      });
    });
    entries = next;
    render();
  }

  function start() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length || !firebase.auth) return false;
    var app = firebase.app();
    firebase.auth(app).onAuthStateChanged(function (user) {
      if (!user) return;
      if (db) return;
      db = firebase.database(app);
      db.ref('pay_inbox').on('value', onSnapshot, function (err) {
        console.warn('[PayInbox] cannot read pay_inbox (check database rules):', err && err.message);
      });
    });
    return true;
  }

  function boot() {
    var tries = 0;
    (function wait() {
      if (start()) return;
      if (++tries < 60) setTimeout(wait, 250);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // Learned rules may arrive from the other phone; refresh suggestions when they do.
  window.addEventListener('storage', function (e) { if (e.key === RULES_KEY) render(); });

  // test hook
  window.PayInbox = { parseAmount: parseAmount, norm: norm, _setEntries: function (list) { entries = list; render(); } };
})();
