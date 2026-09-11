(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseCustomTransitionManualV144Installed) return;
  window.__exerciseCustomTransitionManualV144Installed = true;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    var index = Number(state.exerciseIndex) || 0;
    return index >= 0 && index < state.exercises.length ? state.exercises[index] : null;
  }

  function expectedTransition(state) {
    var ex = currentExercise(state);
    if (!state || !ex || !Array.isArray(state.exercises)) return null;
    var index = Number(state.exerciseIndex) || 0;
    var currentSet = Math.max(1,Number(state.currentSet) || 1);
    var plannedSets = Math.max(1,Number(ex.plannedSets) || 1);
    if (currentSet < plannedSets) return 'next';
    if (index + 1 < state.exercises.length) return 'finish';
    return null;
  }

  function normalizeConfig(raw) {
    raw = raw || {};
    if (raw.enabled === false) return {type:'none',name:''};
    var type = raw.type === 'rest' || raw.type === 'custom' ? raw.type : 'none';
    return {type:type,name:type === 'custom' ? String(raw.name || '').trim() : ''};
  }

  function plansSafe() {
    try { return typeof window.getPlannedSessions === 'function' ? (window.getPlannedSessions() || {}) : {}; }
    catch (_) { return {}; }
  }

  function transitionConfig(state,kind) {
    if (!state || !state.date || !kind) return normalizeConfig(null);
    var plans = plansSafe();

    try {
      var routing = window.__exerciseBetweenRoutingV7;
      if (routing && typeof routing.configForTransition === 'function') {
        return normalizeConfig(routing.configForTransition(plans,state,kind));
      }
    } catch (_) {}

    var plan = plans && plans[state.date];
    if (!plan) return normalizeConfig(null);
    if (kind === 'finish') return normalizeConfig(plan.betweenExercises || plan.betweenSets);
    if (kind === 'next') {
      var index = Math.max(0,Number(state.exerciseIndex) || 0);
      var plannedExercise = Array.isArray(plan.exercises) ? plan.exercises[index] : null;
      return normalizeConfig((plannedExercise && plannedExercise.betweenSets) || plan.betweenSets);
    }
    return normalizeConfig(null);
  }

  function isTransitionButton(button,kind) {
    if (!button || !button.closest || !button.closest('#session-controls')) return false;
    var text = String(button.textContent || '').trim().toLocaleLowerCase('sv-SE');
    var onclick = String(button.getAttribute('onclick') || '');
    if (kind === 'next') {
      return text.indexOf('starta nästa set') === 0 || onclick.indexOf('startNextSet') >= 0;
    }
    return text.indexOf('övning klar') === 0 ||
      text.indexOf('starta nästa övning') === 0 ||
      onclick.indexOf('finishCurrentExercise') >= 0;
  }

  /* v142 used button.click() to auto-start custom between exercises. Rest should
     auto-start, but a real between exercise must wait for the user's tap. Block
     only synthetic transition clicks while a custom transition is pending. */
  document.addEventListener('click',function (event) {
    if (event.isTrusted) return;

    var state = getState();
    if (!state || state.setRunning || !state.awaitingDecision || state.__betweenCustomRuntimeV3) return;

    var kind = expectedTransition(state);
    if (!kind) return;

    var config = transitionConfig(state,kind);
    if (config.type !== 'custom' || !config.name) return;

    var button = event.target && event.target.closest ? event.target.closest('#session-controls button') : null;
    if (!isTransitionButton(button,kind)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  },true);
})();
