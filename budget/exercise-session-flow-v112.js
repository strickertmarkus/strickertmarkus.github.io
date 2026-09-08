(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseSessionFlowV113Installed) return;
  window.__exerciseSessionFlowV113Installed = true;

  var profile = String(new URLSearchParams(window.location.search).get('user') || 'markus').toLowerCase();
  var BETWEEN_KEY_PREFIX = 'ex_between_set_v2_' + profile + '_';
  var autoRestKey = '';
  var syncingLog = false;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    var index = Number(state.exerciseIndex) || 0;
    return index >= 0 && index < state.exercises.length ? state.exercises[index] : null;
  }

  function normalizeBetween(raw) {
    raw = raw || {};
    var type = raw.type === 'rest' || raw.type === 'custom' ? raw.type : 'none';
    return {
      type:type,
      seconds:Math.max(1,Math.round(Number(raw.seconds) || (type === 'rest' ? 60 : 30)))
    };
  }

  function betweenConfigForDate(date) {
    if (!date) return normalizeBetween(null);
    try {
      if (typeof window.getPlannedSessions === 'function') {
        var plans = window.getPlannedSessions() || {};
        if (plans[date] && plans[date].betweenSets) return normalizeBetween(plans[date].betweenSets);
      }
    } catch (_) {}
    try {
      var raw = localStorage.getItem(BETWEEN_KEY_PREFIX + date);
      if (raw) return normalizeBetween(JSON.parse(raw));
    } catch (_) {}
    return normalizeBetween(null);
  }

  function expectedTransition(state) {
    var ex = currentExercise(state);
    if (!state || !ex || !Array.isArray(state.exercises)) return null;
    var exIndex = Number(state.exerciseIndex) || 0;
    var currentSet = Math.max(1,Number(state.currentSet) || 1);
    var plannedSets = Math.max(1,Number(ex.plannedSets) || 1);
    if (currentSet < plannedSets) return 'next';
    if (exIndex + 1 < state.exercises.length) return 'finish';
    return null;
  }

  function findTransitionButton(kind) {
    var controls = document.getElementById('session-controls');
    if (!controls) return null;
    return Array.prototype.slice.call(controls.querySelectorAll('button')).find(function (button) {
      var text = String(button.textContent || '').trim().toLocaleLowerCase('sv-SE');
      var onclick = String(button.getAttribute('onclick') || '');
      if (kind === 'next') return text.indexOf('starta nästa set') === 0 || onclick.indexOf('startNextSet') >= 0;
      return text.indexOf('övning klar') === 0 || onclick.indexOf('finishCurrentExercise') >= 0;
    }) || null;
  }

  function tryStartConfiguredRest(attempt) {
    attempt = Number(attempt) || 0;
    var state = getState();
    if (!state || state.setRunning || !state.awaitingDecision) return;
    var config = betweenConfigForDate(state.date);
    if (config.type !== 'rest') return;

    var kind = expectedTransition(state);
    if (!kind) return;
    var key = [state.passStartedAt || '',state.exerciseIndex,state.currentSet,kind].join('|');
    if (autoRestKey === key) return;

    var overlay = document.getElementById('session-between-overlay-v2');
    if (overlay && overlay.classList.contains('show')) {
      autoRestKey = key;
      return;
    }

    var button = findTransitionButton(kind);
    if (!button) {
      if (attempt < 12) setTimeout(function () { tryStartConfiguredRest(attempt + 1); }, 25);
      return;
    }

    /* Reuse the established between-set router instead of starting a second
       timer path. Its capture listener turns this decision-button click into
       the configured rest overlay and preserves the normal post-rest flow. */
    autoRestKey = key;
    try { button.click(); }
    catch (_) { autoRestKey = ''; }
  }

  function escapeAttr(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/"/g,'&quot;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function strengthRowHtml(log,index) {
    return '<div class="set-tag">Set</div>' +
      '<input type="number" min="1" step="1" inputmode="numeric" aria-label="Set" data-session-log-v112="setNo" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Math.max(1,Number(log.setNo) || (index + 1))) + '">' +
      '<input type="number" min="0" step="1" inputmode="numeric" aria-label="Reps" data-session-log-v112="actualReps" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Number(log.actualReps) || 0) + '">' +
      '<input type="number" min="0" step="0.5" inputmode="decimal" aria-label="Vikt" data-session-log-v112="actualWeight" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Number(log.actualWeight) || 0) + '">';
  }

  function cardioRowHtml(log,index) {
    return '<div class="set-tag">Runda</div>' +
      '<input type="number" min="1" step="1" inputmode="numeric" aria-label="Set" data-session-log-v112="setNo" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Math.max(1,Number(log.setNo) || (index + 1))) + '">' +
      '<input type="number" min="0" step="0.1" inputmode="decimal" aria-label="Tid" data-session-log-v112="actualTime" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Number(log.actualTime) || 0) + '">';
  }

  function ensureStyles() {
    var old = document.getElementById('exercise-session-flow-v112-style');
    if (old) old.remove();
    if (document.getElementById('exercise-session-flow-v113-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-session-flow-v113-style';
    style.textContent = `
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log .set-log-item.session-log-cardio-fields-v112 {
        grid-template-columns:minmax(54px,.65fr) repeat(2,minmax(0,1fr)) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log .set-log-item.session-log-strength-fields-v112 {
        grid-template-columns:minmax(54px,.65fr) repeat(3,minmax(0,1fr)) !important;
      }

      /* The first screen of a fresh session uses the same calm green language
         as the completed-session screen. As soon as the first set starts, the
         normal strength/cardio colour takes over again. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-intro-v113 {
        --pf-accent:#34D399 !important;
        --pf-soft:#A7F3D0 !important;
        --pf-rgb:52,211,153 !important;
        --pf-speed:3.2s !important;
      }

      /* v80 grouped the progress track by raw planned-set count and therefore
         ignored inserted custom/cardio moments. Neutralise that old boundary
         and apply the gap only at canonical exercise starts. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-start-v80:not(:first-child) {
        margin-left:0 !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-start-canonical-v113:not(:first-child) {
        margin-left:4px !important;
      }
    `;
    document.head.appendChild(style);
  }

  function syncProgressExerciseBoundaries() {
    var state = getState();
    var track = document.getElementById('hype-progress-track');
    var api = window.__exerciseProgressConsistencyV10;
    if (!state || !track || !api || typeof api.calculate !== 'function') return;

    var nodes = Array.prototype.slice.call(track.querySelectorAll(':scope > .hype-progress-segment'));
    if (!nodes.length) return;

    var result = null;
    try { result = api.calculate(state); }
    catch (_) { return; }
    if (!result || !Array.isArray(result.segments) || result.segments.length !== nodes.length) return;

    var starts = Object.create(null);
    var seenExercise = Object.create(null);
    result.segments.forEach(function (segment,index) {
      if (!segment || segment.type !== 'base') return;
      var exIndex = Number(segment.exIndex);
      if (!Number.isFinite(exIndex) || seenExercise[exIndex]) return;
      seenExercise[exIndex] = true;
      starts[index] = true;
    });

    nodes.forEach(function (node,index) {
      node.classList.toggle('pf-ex-start-canonical-v113',!!starts[index]);
    });
  }

  function hasLoggedMoment(state) {
    if (!state || !Array.isArray(state.logs)) return false;
    return state.logs.some(function (logs) { return Array.isArray(logs) && logs.length > 0; });
  }

  function syncIntroTheme() {
    var state = getState();
    var modal = document.getElementById('session-modal');
    if (!modal) return;

    var pre = document.getElementById('session-pre-timer');
    var preVisible = !!(pre && pre.classList.contains('show'));
    var intro = !!(
      state &&
      Array.isArray(state.exercises) && state.exercises.length > 0 &&
      Number(state.exerciseIndex || 0) === 0 &&
      Math.max(1,Number(state.currentSet) || 1) === 1 &&
      !state.setRunning &&
      !state.awaitingDecision &&
      !preVisible &&
      !hasLoggedMoment(state) &&
      Number(state.exerciseIndex || 0) < state.exercises.length
    );

    modal.classList.toggle('pulse-flow-intro-v113',intro);
  }

  function syncLoggedSetFields() {
    if (syncingLog) return;
    var state = getState();
    var modal = document.getElementById('session-modal');
    var setLog = document.getElementById('session-set-log');
    if (!state || !modal || !setLog || !modal.classList.contains('show') || modal.classList.contains('session-overview-mode')) return;

    var ex = currentExercise(state);
    var logs = state.logs && state.logs[state.exerciseIndex];
    if (!ex || !Array.isArray(logs) || !logs.length) return;

    var rows = Array.prototype.slice.call(setLog.querySelectorAll(':scope > .set-log-item'));
    if (!rows.length) return;

    syncingLog = true;
    try {
      rows.slice(0,logs.length).forEach(function (row,index) {
        var kind = ex.kind === 'cardio' ? 'cardio' : 'strength';
        var marker = kind + '|' + index;
        if (row.dataset.sessionFieldsV112 === marker) return;
        row.dataset.sessionFieldsV112 = marker;
        row.classList.toggle('session-log-cardio-fields-v112',kind === 'cardio');
        row.classList.toggle('session-log-strength-fields-v112',kind !== 'cardio');
        row.innerHTML = kind === 'cardio' ? cardioRowHtml(logs[index] || {},index) : strengthRowHtml(logs[index] || {},index);
      });
    } finally {
      syncingLog = false;
    }
  }

  function commitLogInput(input) {
    if (!input || !input.matches('[data-session-log-v112]')) return;
    var state = getState();
    if (!state) return;
    var index = Number(input.getAttribute('data-session-log-index-v112'));
    var key = input.getAttribute('data-session-log-v112');
    if (!Number.isInteger(index) || !key) return;
    if (typeof window.updateSetLog === 'function') {
      try { window.updateSetLog(Number(state.exerciseIndex) || 0,index,key,input.value); return; }
      catch (_) {}
    }
    var logs = state.logs && state.logs[state.exerciseIndex];
    if (!Array.isArray(logs) || !logs[index]) return;
    var value = (key === 'actualWeight' || key === 'actualTime') ? parseFloat(input.value) : parseInt(input.value,10);
    logs[index][key] = Number.isFinite(value) ? value : 0;
  }

  function syncSessionUi() {
    ensureStyles();
    syncIntroTheme();
    syncProgressExerciseBoundaries();
    syncLoggedSetFields();
  }

  function handleClick(event) {
    var button = event.target && event.target.closest ? event.target.closest('#session-controls button') : null;
    if (!button) return;
    var text = String(button.textContent || '').trim().toLocaleLowerCase('sv-SE');
    if (/^klar med set/.test(text)) {
      setTimeout(function () {
        autoRestKey = '';
        tryStartConfiguredRest(0);
        syncSessionUi();
      },0);
    }
  }

  function install() {
    ensureStyles();
    document.addEventListener('click',handleClick,false);
    document.addEventListener('change',function (event) {
      var input = event.target && event.target.closest ? event.target.closest('#session-set-log [data-session-log-v112]') : null;
      if (input) commitLogInput(input);
    },false);

    var observer = new MutationObserver(function () {
      if (syncingLog) return;
      requestAnimationFrame(syncSessionUi);
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    setInterval(syncSessionUi,180);
    setTimeout(syncSessionUi,0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
