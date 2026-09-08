(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseSessionThemeRestV117Installed) return;
  window.__exerciseSessionThemeRestV117Installed = true;

  var autoRestKey = '';
  var wrapped = Object.create(null);

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

  function transitionKind(state) {
    var ex = currentExercise(state);
    if (!state || !ex || !Array.isArray(state.exercises)) return null;
    var currentSet = Math.max(1,Number(state.currentSet) || 1);
    var plannedSets = Math.max(1,Number(ex.plannedSets) || 1);
    if (currentSet < plannedSets) return 'next';
    if ((Number(state.exerciseIndex) || 0) + 1 < state.exercises.length) return 'finish';
    return null;
  }

  function transitionConfig(state,kind) {
    if (!state || !state.date || !kind) return normalizeBetween(null);
    var plans = {};
    try { plans = typeof window.getPlannedSessions === 'function' ? (window.getPlannedSessions() || {}) : {}; }
    catch (_) {}

    try {
      var routing = window.__exerciseBetweenRoutingV7;
      if (routing && typeof routing.configForTransition === 'function') {
        return normalizeBetween(routing.configForTransition(plans,state,kind));
      }
    } catch (_) {}

    var plan = plans && plans[state.date];
    if (!plan) return normalizeBetween(null);
    if (kind === 'finish') return normalizeBetween(plan.betweenExercises || plan.betweenSets);
    if (kind === 'next') {
      var index = Math.max(0,Number(state.exerciseIndex) || 0);
      var plannedExercise = Array.isArray(plan.exercises) ? plan.exercises[index] : null;
      return normalizeBetween((plannedExercise && plannedExercise.betweenSets) || plan.betweenSets);
    }
    return normalizeBetween(null);
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

  function tryAutoRest(attempt) {
    attempt = Number(attempt) || 0;
    var state = getState();
    if (!state || state.setRunning || !state.awaitingDecision) return;

    var kind = transitionKind(state);
    if (!kind) return;
    var config = transitionConfig(state,kind);
    if (config.type !== 'rest') return;

    var key = [state.passStartedAt || '',state.exerciseIndex,state.currentSet,kind].join('|');
    var overlay = document.getElementById('session-between-overlay-v2');
    if (overlay && overlay.classList.contains('show')) {
      autoRestKey = key;
      return;
    }
    if (autoRestKey === key) return;

    var button = findTransitionButton(kind);
    if (!button) {
      if (attempt < 20) requestAnimationFrame(function () { tryAutoRest(attempt + 1); });
      return;
    }

    autoRestKey = key;
    try { button.click(); }
    catch (_) { autoRestKey = ''; }
  }

  function installStyle() {
    if (document.getElementById('exercise-session-theme-rest-v117-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-session-theme-rest-v117-style';
    style.textContent = `
      /* Waiting for the next set is not rest. Keep the exercise identity,
         but retain the calm waiting cadence from the recovery state. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-between-set-strength-v117 {
        --pf-accent:#FB923C !important;
        --pf-soft:#FED7AA !important;
        --pf-rgb:251,146,60 !important;
        --pf-speed:2.8s !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-between-set-cardio-v117 {
        --pf-accent:#EF4444 !important;
        --pf-soft:#FCA5A5 !important;
        --pf-rgb:239,68,68 !important;
        --pf-speed:2.8s !important;
      }
    `;
    document.head.appendChild(style);
  }

  function syncWaitingTheme() {
    var modal = document.getElementById('session-modal');
    var state = getState();
    if (!modal) return;

    var ex = currentExercise(state);
    var overlay = document.getElementById('session-between-overlay-v2');
    var restVisible = !!(overlay && overlay.classList.contains('show'));
    var betweenSets = false;

    if (state && ex && state.awaitingDecision && !state.setRunning && !restVisible) {
      var currentSet = Math.max(1,Number(state.currentSet) || 1);
      var plannedSets = Math.max(1,Number(ex.plannedSets) || 1);
      betweenSets = currentSet < plannedSets;
    }

    modal.classList.toggle('pulse-flow-between-set-strength-v117',betweenSets && ex && ex.kind !== 'cardio');
    modal.classList.toggle('pulse-flow-between-set-cardio-v117',betweenSets && ex && ex.kind === 'cardio');
  }

  function syncAll() {
    syncWaitingTheme();
    tryAutoRest(0);
  }

  function wrapAfter(name,after) {
    var original = window[name];
    if (typeof original !== 'function' || original.__exerciseSessionThemeRestV117Wrapped) return false;
    var replacement = function () {
      var result = original.apply(this,arguments);
      try { after(); } catch (_) {}
      return result;
    };
    replacement.__exerciseSessionThemeRestV117Wrapped = true;
    replacement.__exerciseSessionThemeRestV117Original = original;
    window[name] = replacement;
    wrapped[name] = true;
    return true;
  }

  function installWrappers() {
    ['renderSessionMode','startCurrentSet','startNextSet','addExtraSet','finishCurrentExercise'].forEach(function (name) {
      wrapAfter(name,syncWaitingTheme);
    });
    wrapAfter('completeCurrentSet',function () {
      autoRestKey = '';
      syncWaitingTheme();
      tryAutoRest(0);
    });
  }

  function install() {
    installStyle();
    installWrappers();
    syncAll();

    /* The rest overlay is created outside the session modal. Watching only its
       visibility keeps the theme in sync without adding a polling loop. */
    var rest = document.getElementById('session-between-overlay-v2');
    if (rest) {
      new MutationObserver(syncWaitingTheme).observe(rest,{attributes:true,attributeFilter:['class']});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
