(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var params = new URLSearchParams(window.location.search);
  var profile = (params.get('user') || 'markus').toLowerCase();
  var KEY_PREFIX = 'ex_between_set_v2_' + profile + '_';
  var syncTimer = null;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (e) { return null; }
  }

  function getPlannedSafe() {
    try { return typeof window.getPlannedSessions === 'function' ? (window.getPlannedSessions() || {}) : {}; }
    catch (e) { return {}; }
  }

  function normalizeConfig(raw) {
    raw = raw || {};
    return {
      type: raw.type === 'custom' ? 'custom' : (raw.type === 'rest' ? 'rest' : 'none'),
      seconds: Math.max(1, Math.round(Number(raw.seconds) || 30)),
      name: String(raw.name || '').trim()
    };
  }

  function configForDate(date) {
    if (!date) return normalizeConfig(null);
    var planned = getPlannedSafe();
    var plan = planned && planned[date];
    if (plan && plan.betweenSets) return normalizeConfig(plan.betweenSets);
    try {
      var raw = localStorage.getItem(KEY_PREFIX + date);
      return raw ? normalizeConfig(JSON.parse(raw)) : normalizeConfig(null);
    } catch (e) {
      return normalizeConfig(null);
    }
  }

  function addStyles() {
    if (document.getElementById('exercise-between-custom-v3-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-between-custom-v3-style';
    style.textContent = `
      #between-set-global-editor-v2 .bs-custom-behaviour-v3 {
        margin-top:7px;
        padding:7px 9px;
        border:1px solid rgba(251,146,60,.18);
        border-radius:8px;
        background:rgba(251,146,60,.045);
        color:#A8A29E;
        font-size:9px;
        line-height:1.35;
      }
      #between-set-global-editor-v2 .bs-custom-behaviour-v3 strong {
        color:#FDBA74;
        font-weight:800;
      }
      #session-plan-table tr[data-between-custom-summary-v3] td:first-child {
        color:#FDBA74;
        font-weight:800;
      }
      #session-plan-table tr[data-between-custom-summary-v3] td {
        border-top:1px solid rgba(251,146,60,.16);
        background:rgba(251,146,60,.035);
      }
      .between-custom-chip-v3 {
        display:inline-flex;
        align-items:center;
        gap:5px;
        margin-left:6px;
        padding:2px 6px;
        border:1px solid rgba(251,146,60,.22);
        border-radius:999px;
        color:#FDBA74;
        background:rgba(251,146,60,.07);
        font-size:8px;
        font-weight:800;
        letter-spacing:.35px;
        text-transform:uppercase;
        vertical-align:middle;
      }
      @media(max-width:600px) {
        #between-set-global-editor-v2 .bs-custom-behaviour-v3 { font-size:8px; padding:6px 7px; }
        .between-custom-chip-v3 { font-size:7px; padding:2px 5px; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureBuilderHint() {
    var editor = document.getElementById('between-set-global-editor-v2');
    if (!editor) return;
    var sub = editor.querySelector('.bs-sub');
    if (sub) sub.textContent = 'Gäller hela passet. Vila använder blå timer; valfri övning körs som ett eget set.';
    if (!editor.querySelector('.bs-custom-behaviour-v3')) {
      var hint = document.createElement('div');
      hint.className = 'bs-custom-behaviour-v3';
      hint.innerHTML = '<strong>Valfri övning:</strong> visas i Träningsläge med Starta set, orange timer och loggas i passet.';
      editor.appendChild(hint);
    }
  }

  function transitionKind(button, state) {
    var text = String(button && button.textContent || '').trim().toLowerCase();
    if (text.indexOf('starta nästa set') === 0) return 'next';
    if (text.indexOf('extra set') === 0) return 'extra';
    if (text.indexOf('övning klar') === 0) {
      return Array.isArray(state.exercises) && Number(state.exerciseIndex) + 1 < state.exercises.length ? 'finish' : '';
    }
    return '';
  }

  function ensureSummary(state, config) {
    if (!state.__betweenCustomSummaryV3 || state.__betweenCustomSummaryV3.name !== config.name || state.__betweenCustomSummaryV3.seconds !== config.seconds) {
      state.__betweenCustomSummaryV3 = {
        name: config.name || 'Valfri övning',
        seconds: config.seconds,
        logs: []
      };
    }
    return state.__betweenCustomSummaryV3;
  }

  function beginCustomExercise(state, config, transition) {
    if (!state || state.__betweenCustomRuntimeV3) return false;
    var index = Number(state.exerciseIndex);
    var originalExercise = state.exercises && state.exercises[index];
    var originalLogs = state.logs && state.logs[index];
    if (!originalExercise || !Array.isArray(originalLogs)) return false;

    ensureSummary(state, config);
    state.__betweenCustomManualStartV4 = null;
    state.__betweenCustomRuntimeV3 = {
      index: index,
      transition: transition,
      originalExercise: originalExercise,
      originalLogs: originalLogs,
      originalCurrentSet: Number(state.currentSet) || 1
    };

    state.exercises[index] = {
      kind: 'cardio',
      name: config.name || 'Valfri övning',
      distance: 0,
      time: config.seconds / 60,
      plannedSets: 1,
      __betweenCustomV3: true
    };
    state.logs[index] = [];
    state.currentSet = 1;
    state.setRunning = false;
    state.setStartedAt = null;
    state.awaitingDecision = false;

    try { if (typeof window.renderSessionMode === 'function') window.renderSessionMode(); } catch (e) {}
    syncSummaryUi();
    return true;
  }

  function appendRuntimeLogs(state, runtime) {
    var summary = state.__betweenCustomSummaryV3;
    var logs = state.logs && state.logs[runtime.index];
    if (!summary || !Array.isArray(logs)) return;
    logs.forEach(function (log) {
      var copy = Object.assign({}, log);
      copy.setNo = summary.logs.length + 1;
      summary.logs.push(copy);
    });
  }

  function restoreAndContinue(state) {
    var runtime = state && state.__betweenCustomRuntimeV3;
    if (!runtime) return;

    appendRuntimeLogs(state, runtime);
    state.exercises[runtime.index] = runtime.originalExercise;
    state.logs[runtime.index] = runtime.originalLogs;
    state.exerciseIndex = runtime.index;
    state.currentSet = runtime.originalCurrentSet;
    state.setRunning = false;
    state.setStartedAt = null;
    state.awaitingDecision = false;
    state.__betweenCustomRuntimeV3 = null;

    if (runtime.transition === 'next') {
      state.currentSet = runtime.originalCurrentSet + 1;
    } else if (runtime.transition === 'extra') {
      runtime.originalExercise.plannedSets = Math.max(1, Number(runtime.originalExercise.plannedSets) || 1) + 1;
      state.currentSet = runtime.originalCurrentSet + 1;
    } else if (runtime.transition === 'finish') {
      state.exerciseIndex = runtime.index + 1;
      state.currentSet = 1;
    }

    state.__betweenCustomManualStartV4 = {
      kind: runtime.transition === 'finish' ? 'exercise' : 'set',
      exerciseIndex: state.exerciseIndex,
      currentSet: state.currentSet
    };

    try { if (typeof window.renderSessionMode === 'function') window.renderSessionMode(); } catch (e) {}
    syncManualStartUi();
    syncSummaryUi();
  }

  function syncManualStartUi() {
    var state = getState();
    var gate = state && state.__betweenCustomManualStartV4;
    if (!gate) return;

    if (state.setRunning) {
      state.__betweenCustomManualStartV4 = null;
      return;
    }
    if (state.awaitingDecision) return;

    var controls = document.getElementById('session-controls');
    if (!controls) return;
    var buttons = Array.prototype.slice.call(controls.querySelectorAll('button'));
    var start = buttons.find(function (button) {
      return /^starta set$/i.test(String(button.textContent || '').trim());
    });
    if (start) {
      start.textContent = gate.kind === 'exercise' ? 'Starta nästa övning' : 'Starta nästa set';
      start.setAttribute('data-between-custom-manual-start-v4','true');
    }
  }

  function maybeFinishCustom() {
    var state = getState();
    if (!state || !state.__betweenCustomRuntimeV3) return;
    var runtime = state.__betweenCustomRuntimeV3;
    var current = state.exercises && state.exercises[runtime.index];
    if (!current || !current.__betweenCustomV3) return;
    if (state.setRunning || !state.awaitingDecision) return;
    restoreAndContinue(state);
  }

  function fmtSec(sec) {
    sec = Math.max(0, Math.round(Number(sec) || 0));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function targetText(ex) {
    if (!ex) return '—';
    if (ex.kind === 'cardio') {
      var parts = [];
      if (Number(ex.distance) > 0) parts.push(ex.distance + ' km');
      if (Number(ex.time) > 0) parts.push((Math.round(Number(ex.time) * 100) / 100) + ' min');
      return parts.join(' / ') || 'Kondition';
    }
    return (Number(ex.plannedSets) || 1) + 'x' + (Number(ex.reps) || 0) + ' @ ' + (Number(ex.weight) || 0);
  }

  function syncSummaryUi() {
    var state = getState();
    var tbody = document.getElementById('session-plan-table');
    if (!state || !tbody) return;
    var summary = state.__betweenCustomSummaryV3;
    var runtime = state.__betweenCustomRuntimeV3;

    tbody.querySelectorAll('tr[data-between-custom-summary-v3]').forEach(function (row) { row.remove(); });

    if (runtime) {
      var baseRows = tbody.querySelectorAll('tr');
      var row = baseRows[runtime.index];
      if (row) {
        var cells = row.querySelectorAll('td');
        var logs = runtime.originalLogs || [];
        var dur = logs.reduce(function (sum, item) { return sum + (Number(item.durationSec) || 0); }, 0);
        if (cells[0]) cells[0].textContent = runtime.originalExercise.name || 'Övning';
        if (cells[1]) cells[1].textContent = targetText(runtime.originalExercise);
        if (cells[2]) cells[2].textContent = String(logs.length);
        if (cells[3]) cells[3].textContent = fmtSec(dur);
      }
    }

    if (!summary) return;
    var tempLogs = runtime && state.logs && Array.isArray(state.logs[runtime.index]) ? state.logs[runtime.index] : [];
    var allLogs = summary.logs.concat(tempLogs || []);
    if (!allLogs.length && !runtime) return;

    var totalDuration = allLogs.reduce(function (sum, item) { return sum + (Number(item.durationSec) || 0); }, 0);
    var row = document.createElement('tr');
    row.setAttribute('data-between-custom-summary-v3', 'true');
    row.innerHTML = '<td></td><td></td><td></td><td></td>';
    var cells = row.querySelectorAll('td');
    cells[0].textContent = summary.name;
    var chip = document.createElement('span');
    chip.className = 'between-custom-chip-v3';
    chip.textContent = 'Mellanövning';
    cells[0].appendChild(chip);
    cells[1].textContent = summary.seconds + ' sek';
    cells[2].textContent = String(allLogs.length);
    cells[3].textContent = fmtSec(totalDuration);
    tbody.appendChild(row);
  }

  function injectSummaryForSave(state) {
    if (!state || state.__betweenCustomSaveInjectedV3) return;
    var summary = state.__betweenCustomSummaryV3;
    if (!summary || !Array.isArray(summary.logs) || !summary.logs.length) return;

    state.__betweenCustomSaveInjectedV3 = true;
    state.exercises.push({
      kind: 'cardio',
      name: summary.name,
      distance: 0,
      time: summary.seconds / 60,
      plannedSets: summary.logs.length,
      __betweenCustomSavedV3: true
    });
    state.logs.push(summary.logs.map(function (log, index) {
      var copy = Object.assign({}, log);
      copy.setNo = index + 1;
      return copy;
    }));
  }

  function handleCapture(event) {
    var button = event.target && event.target.closest ? event.target.closest('button') : null;
    if (!button) return;
    var state = getState();
    if (!state) return;

    if (button.closest('#session-complete-box') && /spara pass/i.test(button.textContent || '')) {
      injectSummaryForSave(state);
      return;
    }

    /* While the temporary custom exercise is awaiting its hidden "Övning klar"
       transition, consume that auto-click here as well. This prevents it from
       falling through to the legacy between-set module and opening a blue
       custom-activity overlay. */
    if (state.__betweenCustomRuntimeV3 && button.closest('#session-controls') && !state.setRunning && state.awaitingDecision) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setTimeout(maybeFinishCustom, 0);
      return;
    }

    if (!button.closest('#session-controls') || state.setRunning || !state.awaitingDecision || state.__betweenCustomRuntimeV3) return;
    var transition = transitionKind(button, state);
    if (!transition) return;

    var config = configForDate(state.date);
    if (config.type !== 'custom' || !config.name) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (beginCustomExercise(state, config, transition)) {
      /* The user's "Starta nästa set" click is also the explicit start of the
         configured between exercise. Feed it straight into the normal start
         gate so the 5-second timer is preserved without a second orange click. */
      try {
        if (typeof window.startCurrentSet === 'function') window.startCurrentSet();
      } catch (_) {}
    }
  }

  function handleBubble(event) {
    var button = event.target && event.target.closest ? event.target.closest('#session-controls button') : null;
    if (!button) return;
    /* Restore the original exercise before the browser paints the completed
       custom state. The old zero-delay timeout exposed one blue frame. */
    if (/klar med set/i.test(button.textContent || '')) maybeFinishCustom();
  }

  function sync() {
    ensureBuilderHint();
    maybeFinishCustom();
    syncManualStartUi();
    syncSummaryUi();
  }

  function install() {
    if (window.__exerciseBetweenCustomV3Installed) return;
    window.__exerciseBetweenCustomV3Installed = true;
    addStyles();

    /* Capture must be registered before exercise-between-sets.js. Custom
       activities are consumed here, while rest/none fall through unchanged
       to the existing safe blue rest overlay. */
    document.addEventListener('click', handleCapture, true);
    document.addEventListener('click', handleBubble, false);

    syncTimer = setInterval(sync, 180);
    setTimeout(sync, 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
