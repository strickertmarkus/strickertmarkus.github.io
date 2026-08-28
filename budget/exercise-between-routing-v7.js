(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var originalGetPlanned = null;
  var activeTransition = '';
  var activeState = null;
  var clearTimer = null;

  function normalizeConfig(raw) {
    raw = raw || {};
    if (raw.enabled === false) return { type:'none', seconds:30, name:'' };
    var type = raw.type === 'custom' ? 'custom' : (raw.type === 'rest' ? 'rest' : 'none');
    return {
      type:type,
      seconds:Math.max(1,Math.round(Number(raw.seconds) || (type === 'rest' ? 60 : 30))),
      name:type === 'custom' ? String(raw.name || '').trim() : ''
    };
  }

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function transitionKind(button, state) {
    var text = String(button && button.textContent || '').trim().toLowerCase();
    if (text.indexOf('starta nästa set') === 0) return 'next';
    if (text.indexOf('extra set') === 0) return 'extra';
    if (text.indexOf('övning klar') === 0) {
      return Array.isArray(state && state.exercises) && Number(state.exerciseIndex) + 1 < state.exercises.length ? 'finish' : '';
    }
    return '';
  }

  function configForTransition(planned, state, transition) {
    if (!state || !state.date || !planned) return normalizeConfig(null);
    var plan = planned[state.date];
    if (!plan) return normalizeConfig(null);

    if (transition === 'finish') {
      if (plan.betweenExercises) return normalizeConfig(plan.betweenExercises);
      /* One-way compatibility: the old pass-wide betweenSets value becomes
         "between exercises" until the plan is saved with the new builder. */
      if (plan.betweenSets) return normalizeConfig(plan.betweenSets);
      return normalizeConfig(null);
    }

    if (transition === 'next' || transition === 'extra') {
      var index = Number(state.exerciseIndex) || 0;
      var exercise = Array.isArray(plan.exercises) ? plan.exercises[index] : null;
      return normalizeConfig(exercise && exercise.betweenSets);
    }

    return normalizeConfig(null);
  }

  function installGetPlannedRouter() {
    if (originalGetPlanned || typeof window.getPlannedSessions !== 'function') return !!originalGetPlanned;
    originalGetPlanned = window.getPlannedSessions;

    window.getPlannedSessions = function () {
      var planned = originalGetPlanned.apply(this, arguments) || {};
      if (!activeTransition || !activeState || !activeState.date || !planned[activeState.date]) return planned;

      /* Return a shallow routed view only for this event. No persistent plan
         data is mutated, so Firebase/localStorage never sees a temporary
         betweenSets value. Existing safe modules can keep reading plan.betweenSets. */
      var routed = Object.assign({}, planned);
      var plan = Object.assign({}, planned[activeState.date]);
      plan.betweenSets = configForTransition(planned, activeState, activeTransition);
      routed[activeState.date] = plan;
      return routed;
    };
    return true;
  }

  function clearRouteSoon() {
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer = setTimeout(function () {
      activeTransition = '';
      activeState = null;
      clearTimer = null;
    }, 0);
  }

  function handleCapture(event) {
    var button = event.target && event.target.closest ? event.target.closest('#session-controls button') : null;
    if (!button) return;
    var state = getState();
    if (!state || state.setRunning || !state.awaitingDecision || state.__betweenCustomRuntimeV3) return;
    var transition = transitionKind(button,state);
    if (!transition) return;
    activeTransition = transition;
    activeState = state;
    clearRouteSoon();
  }

  function install() {
    if (window.__exerciseBetweenRoutingV7Installed) return;
    if (!installGetPlannedRouter()) { setTimeout(install,40); return; }
    window.__exerciseBetweenRoutingV7Installed = true;
    /* Loaded before both existing between modules, so their capture handlers
       see the transition-specific routed configuration synchronously. */
    document.addEventListener('click',handleCapture,true);
    window.__exerciseBetweenRoutingV7 = {
      configForTransition:configForTransition,
      normalizeConfig:normalizeConfig
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
