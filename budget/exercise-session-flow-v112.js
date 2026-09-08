(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseSessionFlowV116Installed) return;
  window.__exerciseSessionFlowV116Installed = true;

  var profile = String(new URLSearchParams(window.location.search).get('user') || 'markus').toLowerCase();
  var BETWEEN_KEY_PREFIX = 'ex_between_set_v2_' + profile + '_';
  var autoRestKey = '';
  var syncingLog = false;
  var syncScheduled = false;

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
    if (raw.enabled === false) return {type:'none',seconds:30,name:''};
    var type = raw.type === 'rest' || raw.type === 'custom' ? raw.type : 'none';
    return {
      type:type,
      seconds:Math.max(1,Math.round(Number(raw.seconds) || (type === 'rest' ? 60 : 30))),
      name:type === 'custom' ? String(raw.name || '').trim() : ''
    };
  }

  function getPlansSafe() {
    try { return typeof window.getPlannedSessions === 'function' ? (window.getPlannedSessions() || {}) : {}; }
    catch (_) { return {}; }
  }

  function transitionConfig(state,transition) {
    if (!state || !state.date) return normalizeBetween(null);
    var plans = getPlansSafe();

    try {
      var routing = window.__exerciseBetweenRoutingV7;
      if (routing && typeof routing.configForTransition === 'function') {
        return normalizeBetween(routing.configForTransition(plans,state,transition));
      }
    } catch (_) {}

    var plan = plans && plans[state.date];
    if (plan) {
      if (transition === 'finish') return normalizeBetween(plan.betweenExercises || plan.betweenSets);
      if (transition === 'next') {
        var exIndex = Math.max(0,Number(state.exerciseIndex) || 0);
        var plannedExercise = Array.isArray(plan.exercises) ? plan.exercises[exIndex] : null;
        if (plannedExercise && plannedExercise.betweenSets) return normalizeBetween(plannedExercise.betweenSets);
      }
    }

    try {
      var raw = localStorage.getItem(BETWEEN_KEY_PREFIX + state.date);
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
      return text.indexOf('övning klar') === 0 || text.indexOf('starta nästa övning') === 0 || onclick.indexOf('finishCurrentExercise') >= 0;
    }) || null;
  }

  function tryStartConfiguredRest(attempt) {
    attempt = Number(attempt) || 0;
    var state = getState();
    if (!state || state.setRunning || !state.awaitingDecision) return;

    var kind = expectedTransition(state);
    if (!kind) return;
    var config = transitionConfig(state,kind);
    if (config.type !== 'rest') return;

    var key = [state.passStartedAt || '',state.exerciseIndex,state.currentSet,kind].join('|');
    if (autoRestKey === key) return;

    var overlay = document.getElementById('session-between-overlay-v2');
    if (overlay && overlay.classList.contains('show')) {
      autoRestKey = key;
      return;
    }

    var button = findTransitionButton(kind);
    if (!button) {
      if (attempt < 30) setTimeout(function () { tryStartConfiguredRest(attempt + 1); },35);
      return;
    }

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
      '<input type="number" min="0" step="0.5" inputmode="decimal" aria-label="Vikt i kg" data-session-log-v112="actualWeight" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Number(log.actualWeight) || 0) + '">';
  }

  function cardioRowHtml(log,index) {
    return '<div class="set-tag">Runda</div>' +
      '<input type="number" min="1" step="1" inputmode="numeric" aria-label="Set" data-session-log-v112="setNo" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Math.max(1,Number(log.setNo) || (index + 1))) + '">' +
      '<input type="number" min="0" step="0.1" inputmode="decimal" aria-label="Tid i minuter" data-session-log-v112="actualTime" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Number(log.actualTime) || 0) + '">';
  }

  function ensureStyles() {
    ['exercise-session-flow-v112-style','exercise-session-flow-v113-style','exercise-session-flow-v114-style'].forEach(function (id) {
      var old = document.getElementById(id);
      if (old) old.remove();
    });
    if (document.getElementById('exercise-session-flow-v116-style')) return;

    var style = document.createElement('style');
    style.id = 'exercise-session-flow-v116-style';
    style.textContent = `
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log .set-log-item.session-log-cardio-fields-v112 {
        grid-template-columns:minmax(54px,.65fr) repeat(2,minmax(0,1fr)) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log .set-log-item.session-log-strength-fields-v112 {
        grid-template-columns:minmax(54px,.65fr) repeat(3,minmax(0,1fr)) !important;
      }

      /* Fresh session and completed exercise use the same green language as
         the final Pass klart state. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-intro-v116,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-exercise-complete-v116 {
        --pf-accent:#34D399 !important;
        --pf-soft:#A7F3D0 !important;
        --pf-rgb:52,211,153 !important;
        --pf-speed:3.2s !important;
      }

      /* Ready-to-start states follow exercise type instead of the generic cyan
         recovery colour. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-ready-strength-v116 {
        --pf-accent:#FB923C !important;
        --pf-soft:#FED7AA !important;
        --pf-rgb:251,146,60 !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-ready-cardio-v116 {
        --pf-accent:#EF4444 !important;
        --pf-soft:#FCA5A5 !important;
        --pf-rgb:239,68,68 !important;
      }

      /* Canonical exercise boundaries: inserted between-exercise cardio moments
         stay inside the surrounding exercise group. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-start-v80:not(:first-child) {
        margin-left:0 !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-start-canonical-v116:not(:first-child) {
        margin-left:4px !important;
      }
    `;
    document.head.appendChild(style);
  }

  function removeOldThemeToggleArtifacts() {
    var oldToggle = document.getElementById('session-blue-green-toggle-v114');
    if (oldToggle) oldToggle.remove();
    var modal = document.getElementById('session-modal');
    var rest = document.getElementById('session-between-overlay-v2');
    if (modal) modal.classList.remove('pulse-flow-green-cyan-v114');
    if (rest) rest.classList.remove('pulse-flow-green-cyan-v114');
  }

  function syncProgressExerciseBoundaries() {
    var state = getState();
    var track = document.getElementById('hype-progress-track');
    var api = window.__exerciseProgressConsistencyV10;
    if (!state || !track || !api || typeof api.calculate !== 'function') return;

    var nodes = Array.prototype.slice.call(track.querySelectorAll(':scope > .hype-progress-segment'));
    if (!nodes.length) return;

    var result;
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
      node.classList.toggle('pf-ex-start-canonical-v116',!!starts[index]);
    });
  }

  function hasLoggedMoment(state) {
    if (!state || !Array.isArray(state.logs)) return false;
    return state.logs.some(function (logs) { return Array.isArray(logs) && logs.length > 0; });
  }

  function overlayVisible(id) {
    var element = document.getElementById(id);
    return !!(element && element.classList.contains('show'));
  }

  function introState(state) {
    return !!(
      state && Array.isArray(state.exercises) && state.exercises.length > 0 &&
      Number(state.exerciseIndex || 0) === 0 &&
      Math.max(1,Number(state.currentSet) || 1) === 1 &&
      !state.setRunning && !state.awaitingDecision &&
      !overlayVisible('session-pre-timer') &&
      !hasLoggedMoment(state)
    );
  }

  function completedExerciseState(state) {
    var ex = currentExercise(state);
    if (!state || !ex || state.setRunning || !state.awaitingDecision) return false;
    if (overlayVisible('session-pre-timer') || overlayVisible('session-between-overlay-v2')) return false;
    var currentSet = Math.max(1,Number(state.currentSet) || 1);
    var plannedSets = Math.max(1,Number(ex.plannedSets) || 1);
    return currentSet >= plannedSets;
  }

  function syncIntroButton(intro) {
    var controls = document.getElementById('session-controls');
    if (!controls) return;
    var buttons = Array.prototype.slice.call(controls.querySelectorAll('button'));
    var button = buttons.find(function (item) {
      var text = String(item.textContent || '').trim().toLocaleLowerCase('sv-SE');
      return text === 'starta pass' || text.indexOf('starta set') === 0 || String(item.getAttribute('onclick') || '').indexOf('startCurrentSet') >= 0;
    });
    if (!button) return;

    if (intro) {
      if (!button.dataset.pfIntroOriginalV116) button.dataset.pfIntroOriginalV116 = String(button.textContent || 'Starta set').trim() || 'Starta set';
      if (button.textContent !== 'Starta pass') button.textContent = 'Starta pass';
      button.setAttribute('data-pf-intro-start-v116','true');
    } else if (button.getAttribute('data-pf-intro-start-v116') === 'true') {
      if (String(button.textContent || '').trim() === 'Starta pass') button.textContent = button.dataset.pfIntroOriginalV116 || 'Starta set';
      button.removeAttribute('data-pf-intro-start-v116');
      delete button.dataset.pfIntroOriginalV116;
    }
  }

  function syncThemeState() {
    var state = getState();
    var modal = document.getElementById('session-modal');
    if (!modal) return;

    var intro = introState(state);
    var completedExercise = completedExerciseState(state);
    var ex = currentExercise(state);
    var done = !!(state && Array.isArray(state.exercises) && Number(state.exerciseIndex) >= state.exercises.length);
    var ready = !!(
      state && ex && !intro && !completedExercise && !done &&
      !state.setRunning && !state.awaitingDecision &&
      !overlayVisible('session-pre-timer') && !overlayVisible('session-between-overlay-v2')
    );

    modal.classList.toggle('pulse-flow-intro-v116',intro);
    modal.classList.toggle('pulse-flow-exercise-complete-v116',completedExercise);
    modal.classList.toggle('pulse-flow-ready-cardio-v116',ready && ex.kind === 'cardio');
    modal.classList.toggle('pulse-flow-ready-strength-v116',ready && ex.kind !== 'cardio');
    syncIntroButton(intro);
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
    syncScheduled = false;
    if (syncingLog) return;
    removeOldThemeToggleArtifacts();
    syncThemeState();
    syncProgressExerciseBoundaries();
    syncLoggedSetFields();
  }

  function scheduleSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(syncSessionUi);
  }

  function handleClick(event) {
    var button = event.target && event.target.closest ? event.target.closest('#session-controls button') : null;
    if (!button) return;
    var text = String(button.textContent || '').trim().toLocaleLowerCase('sv-SE');

    setTimeout(scheduleSync,0);

    if (/^klar med set/.test(text)) {
      setTimeout(function () {
        autoRestKey = '';
        tryStartConfiguredRest(0);
        scheduleSync();
      },0);
    }
  }

  function relevantMutation(mutation) {
    var target = mutation.target && mutation.target.nodeType === 1 ? mutation.target : mutation.target && mutation.target.parentElement;
    if (!target) return false;

    if (target.closest && target.closest('#session-pass-timer,#session-set-timer,#session-countdown-value,#session-pre-timer-value,#bs-overlay-value,.pf-ecg-v80')) return false;
    if (mutation.type === 'attributes') return target.id === 'session-modal' || target.id === 'session-between-overlay-v2';

    if (target.closest && target.closest('#session-controls,#session-set-log,#hype-progress-track,#session-current-target,.session-top')) return true;
    return Array.prototype.some.call(mutation.addedNodes || [],function (node) {
      if (!node || node.nodeType !== 1) return false;
      return !!(node.matches && node.matches('#session-controls,#session-set-log,#hype-progress-track,#session-current-target,.session-top')) ||
        !!(node.querySelector && node.querySelector('#session-controls,#session-set-log,#hype-progress-track,#session-current-target,.session-top'));
    });
  }

  function installObservers() {
    var modal = document.getElementById('session-modal');
    if (modal) {
      var modalObserver = new MutationObserver(function (mutations) {
        if (syncingLog) return;
        if (mutations.some(relevantMutation)) scheduleSync();
      });
      modalObserver.observe(modal,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }

    var rest = document.getElementById('session-between-overlay-v2');
    if (rest) {
      var restObserver = new MutationObserver(scheduleSync);
      restObserver.observe(rest,{attributes:true,attributeFilter:['class','data-between-type']});
    }
  }

  function install() {
    ensureStyles();
    removeOldThemeToggleArtifacts();

    document.addEventListener('click',handleClick,false);
    document.addEventListener('change',function (event) {
      var input = event.target && event.target.closest ? event.target.closest('#session-set-log [data-session-log-v112]') : null;
      if (input) {
        commitLogInput(input);
        scheduleSync();
      }
    },false);

    installObservers();
    scheduleSync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
