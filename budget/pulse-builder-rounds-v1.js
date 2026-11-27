/* Rounds ("Runda") in the pass builder: a few exercises done in a row, with a short rest between
 * them and a longer rest between laps, repeated a number of laps.
 *
 * Data: every exercise row in a round carries the same settings in row.dataset.roundV1
 * ({id, name, laps, rest, lapRest}); parseExerciseRow returns them as exercise.round and they are
 * saved with the plan like any other exercise field. A round is the consecutive rows sharing an id.
 * The training session expands a round into one entry per exercise and lap
 * (sessionExercisesFromPlan in archive/exercise.html), so the session itself stays as it is.
 *
 * Builder: a "Runda" toggle beside Styrka / Kondition in an exercise's panel puts it in a round
 * (the round above or below it, otherwise a new one); the round gets a heading row with its
 * settings and a "Lägg till i rundan" row after its last exercise. Both are list children that are
 * not .ex-row-item, so saving, drag-and-drop and the row UI (pulse-builder-ui.js) ignore them. */
(function () {
  'use strict';
  if (!document.documentElement.classList.contains('pbu-v1')) return;

  var DEFAULTS = { name: 'Runda', laps: 3, rest: 10, lapRest: 60 };
  var LIMITS = { laps: [1, 20, 1], rest: [0, 300, 5], lapRest: [0, 600, 15] };
  var openRounds = {};

  function clean(raw) {
    if (!raw || !raw.id) return null;
    var out = { id: String(raw.id).slice(0, 40), name: String(raw.name || DEFAULTS.name).trim().slice(0, 40) || DEFAULTS.name };
    Object.keys(LIMITS).forEach(function (k) {
      var v = Math.round(Number(raw[k]));
      if (!isFinite(v)) v = DEFAULTS[k];
      out[k] = Math.max(LIMITS[k][0], Math.min(LIMITS[k][1], v));
    });
    return out;
  }
  function readRound(row) {
    try { return clean(JSON.parse(row.dataset.roundV1 || 'null')); } catch (_) { return null; }
  }
  function writeRound(row, round) {
    var before = row.dataset.roundV1 || '';
    if (round) row.dataset.roundV1 = JSON.stringify(round);
    else delete row.dataset.roundV1;
    // The row's summary reads "15 reps" in a round and "3 × 15" outside one.
    if (!!before !== !!round && window.PulseBuilderUI && window.PulseBuilderUI.paintRow) window.PulseBuilderUI.paintRow(row);
  }
  function newId() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function list() { return document.getElementById('day-workout-ex-list'); }
  function rows() { var l = list(); return l ? Array.prototype.slice.call(l.querySelectorAll(':scope > .ex-row-item')) : []; }

  /* Consecutive rows with the same round id. A round split by a moved row continues as its own round. */
  function groups() {
    var out = [], current = null, seen = {};
    rows().forEach(function (row) {
      var round = readRound(row);
      if (!round) { current = null; return; }
      if (current && current.round.id === round.id) { current.rows.push(row); return; }
      if (seen[round.id]) { round.id = newId(); writeRound(row, round); }
      seen[round.id] = true;
      current = { round: round, rows: [row] };
      out.push(current);
    });
    // All rows of a round share the settings of its first row.
    out.forEach(function (g) { g.rows.forEach(function (row) { if (row.dataset.roundV1 !== JSON.stringify(g.round)) writeRound(row, g.round); }); });
    return out;
  }

  /* ---------- saved data ---------- */
  function installParse() {
    if (typeof window.parseExerciseRow !== 'function' || window.parseExerciseRow.__roundsV1) return typeof window.parseExerciseRow === 'function';
    var original = window.parseExerciseRow;
    var wrapped = function (row, prefix) {
      var parsed = original.apply(this, arguments);
      var round = parsed && row && prefix === 'dw' ? readRound(row) : null;
      if (round) {
        parsed.round = round;
        if (parsed.kind !== 'cardio') parsed.sets = 1;   // one set per lap
      }
      return parsed;
    };
    wrapped.__roundsV1 = true;
    window.parseExerciseRow = wrapped;
    return true;
  }
  function installLoad() {
    if (typeof window.addDayWorkoutExRow !== 'function' || window.addDayWorkoutExRow.__roundsV1) return typeof window.addDayWorkoutExRow === 'function';
    var original = window.addDayWorkoutExRow;
    var wrapped = function (ex) {
      var result = original.apply(this, arguments);
      var round = ex && clean(ex.round), l = list(), row = l && l.lastElementChild;
      if (round && row && row.classList.contains('ex-row-item')) writeRound(row, round);
      return result;
    };
    wrapped.__roundsV1 = true;
    window.addDayWorkoutExRow = wrapped;
    return true;
  }

  /* ---------- builder ---------- */
  function headHtml(round) {
    var open = !!openRounds[round.id];
    var restText = (round.rest ? 'Vila ' + round.rest + ' s mellan övningar' : 'Ingen vila mellan övningar') + ' · ' + (round.lapRest ? round.lapRest + ' s mellan varv' : 'ingen vila mellan varv');
    var step = function (key, label, unit) {
      return '<div class="pbu-step"><span class="pbu-step-label">' + label + (unit ? ' <small>' + unit + '</small>' : '') + '</span><div class="pbu-step-ctrl">' +
        '<button type="button" data-pbr-step="' + key + '" data-pbr-dir="-1" aria-label="Minska"><i class="pbu-minus"></i></button>' +
        '<input class="pbu-step-value" data-pbr-value="' + key + '" type="text" inputmode="numeric" value="' + round[key] + '" aria-label="' + label + '" autocomplete="off">' +
        '<button type="button" data-pbr-step="' + key + '" data-pbr-dir="1" aria-label="Öka"><i class="pbu-plus"></i></button></div></div>';
    };
    return '<button type="button" class="pbr-toggle" data-pbr-toggle aria-expanded="' + open + '">' +
      '<span class="pbr-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M17 2.5l3 3-3 3"/><path d="M4 11.5v-1a5 5 0 0 1 5-5h11"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/></svg></span>' +
      '<span class="pbr-copy"><span class="pbr-title">Runda · ' + esc(round.name) + '</span><span class="pbr-rest">' + esc(restText) + '</span></span>' +
      '<span class="pbr-laps">' + round.laps + ' varv</span><i class="pbr-chev" aria-hidden="true"></i></button>' +
      (open ? '<div class="pbr-settings">' +
        '<label class="pbr-name"><span class="pbu-step-label">Namn</span><input type="text" data-pbr-name value="' + esc(round.name) + '" maxlength="40" autocomplete="off"></label>' +
        '<div class="pbu-steps pbr-steps">' + step('laps', 'Varv', '') + step('rest', 'Vila mellan övningar', 's') + step('lapRest', 'Vila mellan varv', 's') + '</div>' +
        '<button type="button" class="pbu-link pbr-dissolve" data-pbr-dissolve>Lös upp rundan</button></div>' : '');
  }

  var painting = false;
  function paint() {
    var l = list();
    if (!l || painting) return;
    painting = true;
    try {
      rows().forEach(syncToggle);
      var gs = groups(), keep = [], marks = new Map();
      gs.forEach(function (g) { g.rows.forEach(function (row, i) { marks.set(row, { first: i === 0, last: i === g.rows.length - 1 }); }); });
      rows().forEach(function (row) {
        var m = marks.get(row);
        setClass(row, 'pbr-in', !!m); setClass(row, 'pbr-first', !!(m && m.first)); setClass(row, 'pbr-last', !!(m && m.last));
      });
      gs.forEach(function (g) {
        var first = g.rows[0], last = g.rows[g.rows.length - 1];
        var head = l.querySelector(':scope > .pbr-head[data-round="' + g.round.id + '"]');
        if (!head) { head = document.createElement('div'); head.className = 'pbr-head'; head.dataset.round = g.round.id; }
        var html = headHtml(g.round);
        if (head.dataset.html !== html) { head.innerHTML = html; head.dataset.html = html; }
        if (first.previousElementSibling !== head) l.insertBefore(head, first);
        var add = l.querySelector(':scope > .pbr-add[data-round="' + g.round.id + '"]');
        if (!add) {
          add = document.createElement('button'); add.type = 'button'; add.className = 'pbr-add'; add.dataset.round = g.round.id;
          add.innerHTML = '<i class="pbu-plus" aria-hidden="true"></i><span>Lägg till i rundan</span>';
        }
        if (last.nextElementSibling !== add) l.insertBefore(add, last.nextSibling);
        keep.push(head, add);
      });
      l.querySelectorAll(':scope > .pbr-head, :scope > .pbr-add').forEach(function (el) { if (keep.indexOf(el) < 0) el.remove(); });
    } finally { painting = false; }
  }

  /* A round exercise is one set per lap. */
  function oneSet(row) {
    var kind = row.querySelector('[class$="-kind"]'), sets = row.querySelector('[class$="-metric1"]');
    if (sets && !(kind && kind.value === 'cardio')) sets.value = 1;
  }
  // Only touch a class when it changes: other observers in the builder react to every class write.
  function setClass(el, name, on) { if (el.classList.contains(name) !== on) el.classList.toggle(name, on); }

  function roundRows(id) { return rows().filter(function (row) { var r = readRound(row); return r && r.id === id; }); }
  function update(id, change) {
    roundRows(id).forEach(function (row) { var r = readRound(row); change(r); writeRound(row, clean(r)); });
    paint();
  }
  function openNewRow(row) {
    if (window.PulseBuilderUI && typeof window.PulseBuilderUI.openRow === 'function') window.PulseBuilderUI.openRow(row, { pick: true });
  }
  /* A new exercise row, placed after `after` (or last) and belonging to `round`. */
  function addRow(round, after) {
    if (typeof window.addDayWorkoutExRow !== 'function') return;
    window.addDayWorkoutExRow();
    var l = list(), all = rows(), row = all[all.length - 1];
    if (!row) return;
    writeRound(row, round);
    oneSet(row);
    if (after && after.nextSibling !== row) l.insertBefore(row, after.nextSibling);
    paint();
    setTimeout(function () { openNewRow(row); }, 0);
  }
  /* The "Runda" toggle on a row: joins the round right above (or below) it, or starts a new one. */
  function toggleRow(row) {
    if (readRound(row)) { writeRound(row, null); paint(); return; }
    var prev = row.previousElementSibling, next = row.nextElementSibling;
    while (prev && !prev.classList.contains('ex-row-item')) prev = prev.previousElementSibling;
    while (next && !next.classList.contains('ex-row-item')) next = next.nextElementSibling;
    var round = (prev && readRound(prev)) || (next && readRound(next));
    if (!round) { round = clean(Object.assign({ id: newId() }, DEFAULTS)); openRounds[round.id] = true; }
    writeRound(row, round);
    oneSet(row);
    if (window.PulseBuilderUI && window.PulseBuilderUI.paintRow) window.PulseBuilderUI.paintRow(row);
    paint();
  }
  var LOOP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2.5l3 3-3 3"/><path d="M4 11.5v-1a5 5 0 0 1 5-5h11"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/></svg>';
  /* Puts the toggle beside the row's Styrka / Kondition choice once the row has its panel. */
  function syncToggle(row) {
    var seg = row.querySelector('.pbu-panel > .pbu-seg, .pbr-kind-row > .pbu-seg');
    if (!seg) return;
    var wrap = seg.parentNode.classList.contains('pbr-kind-row') ? seg.parentNode : null;
    if (!wrap) {
      wrap = document.createElement('div'); wrap.className = 'pbr-kind-row';
      seg.parentNode.insertBefore(wrap, seg); wrap.appendChild(seg);
      wrap.insertAdjacentHTML('beforeend', '<div class="pbu-seg pbr-row-toggle" role="group" aria-label="Runda"><button type="button" data-pbr-row-toggle aria-pressed="false">' + LOOP_ICON + '<span>Runda</span></button></div>');
    }
    var btn = wrap.querySelector('[data-pbr-row-toggle]'), on = String(!!readRound(row));
    if (btn.getAttribute('aria-pressed') !== on) btn.setAttribute('aria-pressed', on);
  }

  function bind() {
    var l = list();
    if (!l || !installParse() || !installLoad()) return false;
    l.addEventListener('click', function (e) {
      var t = e.target, head = t.closest('.pbr-head'), add = t.closest('.pbr-add');
      var rowToggle = t.closest('[data-pbr-row-toggle]');
      if (rowToggle) { toggleRow(rowToggle.closest('.ex-row-item')); return; }
      if (add) { var rr = roundRows(add.dataset.round); if (rr.length) addRow(readRound(rr[0]), rr[rr.length - 1]); return; }
      if (!head) return;
      var id = head.dataset.round;
      if (t.closest('[data-pbr-toggle]')) { openRounds[id] = !openRounds[id]; paint(); return; }
      var step = t.closest('[data-pbr-step]');
      if (step) { var key = step.dataset.pbrStep; update(id, function (r) { r[key] = r[key] + Number(step.dataset.pbrDir) * LIMITS[key][2]; }); return; }
      if (t.closest('[data-pbr-dissolve]')) { delete openRounds[id]; roundRows(id).forEach(function (row) { writeRound(row, null); }); paint(); }
    });
    l.addEventListener('change', function (e) {
      var t = e.target, head = t.closest('.pbr-head'); if (!head) return;
      var id = head.dataset.round;
      if (t.matches('[data-pbr-name]')) update(id, function (r) { r.name = t.value; });
      if (t.matches('[data-pbr-value]')) update(id, function (r) { r[t.dataset.pbrValue] = Number(t.value); });
    });
    l.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.closest('.pbr-head') && e.target.matches('input')) { e.preventDefault(); e.target.blur(); } });
    var scheduled = 0;
    new MutationObserver(function () {
      if (painting || scheduled) return;
      scheduled = requestAnimationFrame(function () { scheduled = 0; paint(); });
    }).observe(l, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-round-v1'] });
    paint();
    return true;
  }

  function init() { if (!bind()) setTimeout(init, 150); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.PulseRoundsV1 = { clean: clean, paint: paint };
})();
