/*
 * Analys (analytics.html for Markus, analytics_maja.html for Maja): one shared script.
 * Three questions for a chosen period: how the months went, where the money goes and which
 * posts most often go over budget, plus savings.
 * - The header month means "up to and including". Only whole months with entered amounts count
 *   in the averages; the running month is drawn (marked "pågår") but not averaged.
 * - Colours follow the budget page (DISPLAY_COLORS by section key).
 * - Savings goals live on Familjebudget. Goals that only existed here are copied there once,
 *   after the first Firebase read, by name (the old list is left untouched).
 */
(function () {
  'use strict';
  var isMaja = /analytics_maja\.html$/i.test(location.pathname);
  var DATA_KEY = isMaja ? 'budgetTracker_maja' : 'budgetTracker';
  var OLD_GOALS_KEY = isMaja ? 'savingsGoals_maja' : 'savingsGoals';
  var PERIOD_KEY = 'analys-period-v1';
  var MONTHS = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
  var COLORS = { income: '#7DD3A8', house: '#8EA6F7', insurances: '#F2948B', subscriptions: '#FDBA74', savings: '#6FD6A8', misc: '#E3C77A' };
  var INCOME_LINE = '#B4A7F5';
  var period = '6';
  try { var p = localStorage.getItem(PERIOD_KEY); if (/^(3|6|12|all)$/.test(p || '')) period = p; } catch (_) {}

  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return Math.round(Number(n) || 0).toLocaleString('sv-SE'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var signed = function (n) { return (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n)); };
  function keyNow() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function shortLabel(k) { return MONTHS[Number(k.slice(5)) - 1].slice(0, 3); }
  function colorOf(s) {
    if (s && COLORS[s.key]) return COLORS[s.key];
    var hex = String((s && s.color) || '#FDBA74').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return '#FDBA74';
    var mix = function (i) { return Math.round(parseInt(hex.substr(i, 2), 16) * 0.72 + 0xC4 * 0.28).toString(16).padStart(2, '0'); };
    return '#' + mix(0) + mix(2) + mix(4);
  }

  function readData() {
    try { var d = JSON.parse(localStorage.getItem(DATA_KEY) || 'null'); return (d && d.monthlyData) || {}; } catch (_) { return {}; }
  }
  function expenseSections(m) { return (m.sections || []).filter(function (s) { return !s.isIncome && s.key !== 'income'; }); }
  function itemsSum(sections, field) {
    return sections.reduce(function (t, s) { return t + (s.items || []).reduce(function (u, i) { return u + (Number(i[field]) || 0); }, 0); }, 0);
  }
  function income(m) {
    var s = (m.sections || []).find(function (x) { return x.isIncome || x.key === 'income'; });
    return s ? (s.items || []).reduce(function (t, i) { return t + (Number(i.actual) || Number(i.budget) || 0); }, 0) : 0;
  }
  function hasEntries(m) { return itemsSum(expenseSections(m), 'actual') > 0; }

  function model() {
    var data = readData();
    var selected = '';
    try { selected = localStorage.getItem('selectedBudgetMonth') || ''; } catch (_) {}
    var now = keyNow();
    var upTo = /^\d{4}-\d{2}$/.test(selected) ? selected : now;
    var keys = Object.keys(data).sort().filter(function (k) { return k <= upTo; });
    var whole = keys.filter(function (k) { return k < now && hasEntries(data[k]); });
    var used = period === 'all' ? whole : whole.slice(-Number(period));
    var running = keys.indexOf(now) !== -1 && upTo >= now ? now : '';
    return { data: data, used: used, running: running };
  }

  // ── render ──────────────────────────────────────────
  function renderPeriod() {
    document.querySelectorAll('#an-period [data-period]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.period === period));
    });
  }

  function kpi(label, value, sub, cls) {
    return '<div class="an-kpi"><small>' + label + '</small><b class="' + (cls || '') + '">' + value + '</b><em>' + sub + '</em></div>';
  }

  function renderKpis(M) {
    var n = M.used.length;
    if (!n) {
      $('an-kpis').innerHTML = '<p class="an-muted">Det finns inga hela månader med inlagda belopp i perioden än.</p>';
      return;
    }
    var spent = 0, budget = 0, saved = 0, inc = 0;
    M.used.forEach(function (k) {
      var m = M.data[k], ex = expenseSections(m);
      spent += itemsSum(ex, 'actual'); budget += itemsSum(ex, 'budget'); inc += income(m);
      var sv = (m.sections || []).find(function (s) { return s.key === 'savings'; });
      if (sv) saved += itemsSum([sv], 'actual');
    });
    var pct = budget > 0 ? Math.round(spent / budget * 100) : 0;
    var diff = Math.round((budget - spent) / n);
    var surplus = (inc - spent) / n;
    var chip = diff >= 0 ? '<span class="an-chip ok">' + fmt(diff) + ' under / mån</span>' : '<span class="an-chip bad">' + fmt(-diff) + ' över / mån</span>';
    $('an-kpis').innerHTML =
      kpi('Snitt utgifter', fmt(spent / n), 'per månad, ' + n + ' hela mån') +
      kpi('Mot budget', pct + ' %', chip, pct > 100 ? 'minus' : '') +
      kpi('Sparat', fmt(saved), period === 'all' ? 'alla månader' : 'senaste ' + n + ' mån', 'plus') +
      kpi('Överskott', signed(surplus), 'inkomst minus utgifter / mån', surplus < 0 ? 'minus' : 'plus');
  }

  function renderChart(M) {
    var keys = M.used.slice(-24);
    if (M.running) keys = keys.concat([M.running]);
    if (!keys.length) { $('an-chart').innerHTML = ''; return; }
    var rows = keys.map(function (k) {
      var m = M.data[k], ex = expenseSections(m);
      return { k: k, spent: itemsSum(ex, 'actual'), budget: itemsSum(ex, 'budget'), inc: income(m), run: k === M.running };
    });
    var max = Math.max.apply(null, rows.map(function (r) { return Math.max(r.spent, r.budget, r.inc); })) || 1;
    var W = 320, H = 132, base = H - 16, top = 6, n = rows.length;
    var slot = W / n, bw = Math.min(30, slot * 0.62);
    var y = function (v) { return base - v / max * (base - top); };
    var cx = function (i) { return slot * i + slot / 2; };
    var g = rows.map(function (r, i) {
      var h = base - y(r.spent), over = r.budget > 0 && r.spent > r.budget && !r.run;
      var fill = r.run ? 'url(#an-run)' : over ? '#F87171' : '#FDBA74';
      var label = n > 12 ? (i % 2 ? '' : shortLabel(r.k).slice(0, 1)) : (r.run ? shortLabel(r.k) + '*' : shortLabel(r.k));
      return '<rect x="' + (cx(i) - bw / 2).toFixed(1) + '" y="' + y(r.spent).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) + '" rx="4" fill="' + fill + '" opacity="' + (r.run ? 1 : .78) + '"><title>' + shortLabel(r.k) + ': ' + fmt(r.spent) + ' kr av ' + fmt(r.budget) + '</title></rect>' +
        '<line x1="' + (cx(i) - slot / 2 + 2).toFixed(1) + '" x2="' + (cx(i) + slot / 2 - 2).toFixed(1) + '" y1="' + y(r.budget).toFixed(1) + '" y2="' + y(r.budget).toFixed(1) + '" stroke="rgba(255,255,255,.5)" stroke-dasharray="3 3"/>' +
        '<text x="' + cx(i).toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">' + label + '</text>';
    }).join('');
    var incPts = rows.map(function (r, i) { return cx(i).toFixed(1) + ',' + y(r.inc).toFixed(1); }).join(' ');
    var dots = rows.map(function (r, i) { return '<circle cx="' + cx(i).toFixed(1) + '" cy="' + y(r.inc).toFixed(1) + '" r="2.4" fill="' + INCOME_LINE + '"/>'; }).join('');
    $('an-chart').innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Utgifter per månad mot budget och inkomst">' +
      '<defs><pattern id="an-run" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="rgba(253,186,116,.35)"/><rect width="3" height="6" fill="rgba(253,186,116,.75)"/></pattern></defs>' +
      g + '<polyline points="' + incPts + '" fill="none" stroke="' + INCOME_LINE + '" stroke-width="1.8" stroke-linejoin="round"/>' + dots + '</svg>' +
      '<div class="an-key"><span><i style="background:#FDBA74"></i>Utgifter</span><span><i style="background:#F87171"></i>Över budget</span><span><i class="dash"></i>Budget</span><span><i style="background:' + INCOME_LINE + '"></i>Inkomst</span></div>' +
      (M.running ? '<p class="an-note">* Innevarande månad pågår och räknas inte in i snitten.</p>' : '');
  }

  function renderCategories(M) {
    var el = $('an-cats'), n = M.used.length;
    if (!n) { el.innerHTML = ''; return; }
    var by = {}, order = [];
    M.used.forEach(function (k) {
      expenseSections(M.data[k]).forEach(function (s) {
        var id = s.key || s.name;
        if (!by[id]) { by[id] = { name: s.name, color: colorOf(s), a: 0, b: 0 }; order.push(id); }
        by[id].name = s.name; by[id].color = colorOf(s);
        by[id].a += itemsSum([s], 'actual'); by[id].b += itemsSum([s], 'budget');
      });
    });
    var list = order.map(function (id) { var c = by[id]; return { name: c.name, color: c.color, a: c.a / n, b: c.b / n }; })
      .filter(function (c) { return c.a > 0 || c.b > 0; })
      .sort(function (x, y) { return y.a - x.a; });
    var max = Math.max.apply(null, list.map(function (c) { return Math.max(c.a, c.b); })) || 1;
    el.innerHTML = list.map(function (c) {
      var d = Math.round(c.a - c.b);
      var note = Math.abs(d) < 1 ? 'enligt budget' : '<span class="' + (d > 0 ? 'minus' : 'plus') + '">' + signed(d) + '</span> ' + (d > 0 ? 'över' : 'under') + ' budget i snitt';
      return '<div class="an-cat" style="--c:' + c.color + '"><span class="an-dot"></span><b>' + esc(c.name) + '</b><span class="v">' + fmt(c.a) + ' kr</span>' +
        '<div class="an-track"><i style="width:' + (c.a / max * 100).toFixed(1) + '%"></i>' + (c.b > 0 ? '<u style="left:' + (c.b / max * 100).toFixed(1) + '%"></u>' : '') + '</div><em>' + note + '</em></div>';
    }).join('');
  }

  function renderOver(M) {
    var el = $('an-over'), n = M.used.length;
    if (!n) { el.innerHTML = ''; return; }
    var items = {};
    M.used.forEach(function (k) {
      expenseSections(M.data[k]).forEach(function (s) {
        if (s.key === 'savings') return;
        (s.items || []).forEach(function (i) {
          var b = Number(i.budget) || 0, a = Number(i.actual) || 0;
          if (b <= 0 && a <= 0) return;
          var id = i.name;
          var t = items[id] || (items[id] = { name: i.name, over: 0, diff: 0 });
          if (b > 0 && a > b) t.over += 1;
          t.diff += a - b;
        });
      });
    });
    var list = Object.keys(items).map(function (k) { var t = items[k]; return { name: t.name, over: t.over, avg: t.diff / n }; })
      .filter(function (t) { return t.over > 0 && t.avg > 0; })
      .sort(function (x, y) { return y.over - x.over || y.avg - x.avg; })
      .slice(0, 5);
    el.innerHTML = list.length ? list.map(function (t) {
      return '<div class="an-dev"><span>' + esc(t.name) + ' <small>· över ' + t.over + ' av ' + n + ' mån</small></span><span class="an-chip bad">+' + fmt(t.avg) + ' kr/mån</span></div>';
    }).join('') : '<p class="an-muted">Inget har gått över budget i snitt under perioden.</p>';
  }

  function renderSavings(M) {
    var el = $('an-savings'), n = M.used.length;
    if (!n) { el.innerHTML = ''; return; }
    var total = 0, run = [], byItem = {};
    M.used.forEach(function (k) {
      var s = (M.data[k].sections || []).find(function (x) { return x.key === 'savings'; });
      var sum = 0;
      if (s) (s.items || []).forEach(function (i) { var a = Number(i.actual) || 0; sum += a; if (a) byItem[i.name] = (byItem[i.name] || 0) + a; });
      total += sum; run.push(total);
    });
    var W = 320, H = 52, max = Math.max(total, 1);
    var pts = run.map(function (v, i) { return (run.length > 1 ? i / (run.length - 1) * W : W / 2).toFixed(1) + ',' + (H - 4 - v / max * (H - 10)).toFixed(1); });
    if (pts.length === 1) pts.unshift('0,' + (H - 4));
    var top = Object.keys(byItem).sort(function (a, b) { return byItem[b] - byItem[a]; }).slice(0, 3);
    el.innerHTML =
      '<div class="an-big"><div><b>' + fmt(total) + '</b><em>Sparat ' + (period === 'all' ? 'totalt' : 'senaste ' + n + ' mån') + '</em></div><div class="r"><b class="s">' + fmt(total / n) + '</b><em>i snitt / mån</em></div></div>' +
      '<svg class="an-spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts.join(' ') + '" fill="none" stroke="#6FD6A8" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>' +
      (top.length ? top.map(function (name) { return '<div class="an-it"><span>' + esc(name) + '</span><span>' + fmt(byItem[name]) + '</span></div>'; }).join('') : '<p class="an-muted">Inget sparande inlagt under perioden.</p>');
  }

  function renderAll() {
    var M = model();
    renderPeriod();
    [renderKpis, renderChart, renderCategories, renderOver, renderSavings].forEach(function (fn) {
      try { fn(M); } catch (e) { console.error(fn.name, e); }
    });
  }

  // finance-ui calls these when the header month changes.
  window.renderKPIs = renderAll;
  window.renderCharts = function () {};
  window.renderGoals = function () {};

  $('an-period').addEventListener('click', function (e) {
    var b = e.target.closest('[data-period]');
    if (!b) return;
    period = b.dataset.period;
    try { localStorage.setItem(PERIOD_KEY, period); } catch (_) {}
    renderAll();
  });

  // ── one-time move of goals that only existed here ──
  function moveGoals() {
    try {
      var old = JSON.parse(localStorage.getItem(OLD_GOALS_KEY) || '[]');
      if (!Array.isArray(old) || !old.length) return;
      var fam = JSON.parse(localStorage.getItem('familjebudget_data') || 'null');
      if (!fam) return;
      var goals = Array.isArray(fam.savingsGoals) ? fam.savingsGoals : [];
      var names = goals.map(function (g) { return String(g.name || '').trim().toLowerCase(); });
      var added = old.filter(function (g) { return g && g.name && names.indexOf(String(g.name).trim().toLowerCase()) === -1; })
        .map(function (g) {
          return { name: g.name, target: Number(g.target) || 0, current: Number(g.current) || 0, extra: Number(g.extra) || 0,
            monthly: Number(g.monthly) || 0, customMonthsToGoal: Number(g.customMonthsToGoal) || 0, color: g.color || '#6FD6A8',
            linkedItems: Array.isArray(g.linkedItems) ? g.linkedItems : [] };
        });
      if (!added.length) return;
      fam.savingsGoals = goals.concat(added);
      localStorage.setItem('familjebudget_data', JSON.stringify(fam));
    } catch (_) {}
  }

  renderAll();
  window.addEventListener('firebase-initial-load', function () { moveGoals(); renderAll(); });
  if (window.__firebaseInitialLoadDone) moveGoals();
  window.addEventListener('firebase-sync', function (e) { if (e.detail && e.detail.key === DATA_KEY) renderAll(); });
  window.addEventListener('storage', function (e) { if (e.key === DATA_KEY || e.key === 'selectedBudgetMonth') renderAll(); });
})();
