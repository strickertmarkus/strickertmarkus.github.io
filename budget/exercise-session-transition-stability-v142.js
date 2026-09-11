(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseSessionTransitionStabilityV142Installed) return;
  window.__exerciseSessionTransitionStabilityV142Installed = true;

  var activeRest = null;
  var syncQueued = false;
  var installed = false;
  var lastCustomKey = '';
  var lastPositionKey = '';

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    var index = Number(state.exerciseIndex) || 0;
    return index >= 0 && index < state.exercises.length ? state.exercises[index] : null;
  }

  function normalizeConfig(raw) {
    raw = raw || {};
    if (raw.enabled === false) return { type:'none', seconds:30, name:'' };
    var type = raw.type === 'rest' || raw.type === 'custom' ? raw.type : 'none';
    return {
      type:type,
      seconds:Math.max(1,Math.round(Number(raw.seconds) || (type === 'rest' ? 60 : 30))),
      name:type === 'custom' ? String(raw.name || '').trim() : ''
    };
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

  function plansSafe() {
    try { return typeof window.getPlannedSessions === 'function' ? (window.getPlannedSessions() || {}) : {}; }
    catch (_) { return {}; }
  }

  function transitionConfig(state, kind) {
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

  function positionKey(state, kind) {
    return [
      state && state.passStartedAt || '',
      state && Number(state.exerciseIndex) || 0,
      state && Math.max(1,Number(state.currentSet) || 1),
      kind || ''
    ].join('|');
  }

  function formatTime(seconds) {
    var whole = Math.max(0,Math.ceil(Number(seconds) || 0));
    return String(Math.floor(whole / 60)).padStart(2,'0') + ':' + String(whole % 60).padStart(2,'0');
  }

  function buildSegments() {
    var html = '';
    for (var i = 0; i < 60; i++) {
      html += '<span class="bs-segment active" data-i="' + i + '" style="--between-angle:' + (i * 6) + 'deg"></span>';
    }
    return html;
  }

  function ensureOverlay() {
    var overlay = document.getElementById('session-between-overlay-v2');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'session-between-overlay-v2';
      overlay.setAttribute('role','button');
      overlay.setAttribute('tabindex','0');
      overlay.innerHTML =
        '<div class="bs-overlay-wrap">' +
          '<div class="bs-heading" id="bs-overlay-heading">Vila</div>' +
          '<div class="bs-ring">' +
            '<div class="bs-segments">' + buildSegments() + '</div>' +
            '<div class="bs-core"></div>' +
            '<div class="bs-copy"><div class="bs-value" id="bs-overlay-value">00:00</div><div class="bs-label">Mellan set</div></div>' +
          '</div>' +
          '<div class="bs-skip">Tryck för att hoppa över</div>' +
        '</div>';
      document.body.appendChild(overlay);
    }

    if (overlay.dataset.transitionStabilityV142Bound !== 'true') {
      overlay.dataset.transitionStabilityV142Bound = 'true';

      overlay.addEventListener('click',function (event) {
        if (!activeRest || overlay.dataset.transitionStabilityRestV142 !== 'true') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        finishRest();
      },true);

      overlay.addEventListener('keydown',function (event) {
        if (!activeRest || overlay.dataset.transitionStabilityRestV142 !== 'true') return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        finishRest();
      },true);
    }

    try {
      var controller = window.__exerciseSessionControllerV46;
      if (controller && typeof controller.normalizeSegments === 'function') controller.normalizeSegments();
    } catch (_) {}

    return overlay;
  }

  function paintRest() {
    if (!activeRest) return;

    var overlay = document.getElementById('session-between-overlay-v2');
    if (!overlay || overlay.dataset.transitionStabilityRestV142 !== 'true') {
      cancelRest(false);
      return;
    }

    var remain = Math.max(0,activeRest.deadline - Date.now());
    var value = document.getElementById('bs-overlay-value');
    if (value) value.textContent = formatTime(remain / 1000);

    var activeCount = Math.max(0,Math.min(60,Math.ceil(60 * remain / activeRest.totalMs)));
    overlay.querySelectorAll('.bs-segment').forEach(function (segment,index) {
      segment.classList.toggle('active',index < activeCount);
    });

    if (remain <= 0) {
      finishRest();
      return;
    }
    activeRest.raf = requestAnimationFrame(paintRest);
  }

  function cancelRest(hideOverlay) {
    if (activeRest && activeRest.raf) cancelAnimationFrame(activeRest.raf);
    activeRest = null;

    var overlay = document.getElementById('session-between-overlay-v2');
    if (!overlay) return;
    if (hideOverlay) overlay.classList.remove('show');
    overlay.removeAttribute('data-transition-stability-rest-v142');
    if (overlay.dataset.autoRestV118 === 'true') overlay.removeAttribute('data-auto-rest-v118');
  }

  function finishRest() {
    if (!activeRest) return;
    var pending = activeRest;
    if (pending.raf) cancelAnimationFrame(pending.raf);
    activeRest = null;

    var overlay = document.getElementById('session-between-overlay-v2');
    if (overlay) {
      overlay.classList.remove('show');
      overlay.removeAttribute('data-between-type');
      overlay.removeAttribute('data-transition-stability-rest-v142');
      overlay.removeAttribute('data-auto-rest-v118');
    }

    requestAnimationFrame(function () {
      try {
        if (pending.kind === 'next' && typeof window.startNextSet === 'function') {
          window.startNextSet();
        } else if (pending.kind === 'finish' && typeof window.finishCurrentExercise === 'function') {
          window.finishCurrentExercise();
        }
      } catch (_) {}
      scheduleSync();
      setTimeout(syncTransition,40);
    });
  }

  function beginRest(state, kind, config) {
    if (!state || !kind || !config || config.type !== 'rest') return false;
    if (activeRest) return true;

    var overlay = ensureOverlay();
    if (!overlay) return false;

    /* If an older layer has only painted the static rest shell, take ownership
       before it can leave the display frozen at 01:00. */
    if (overlay.classList.contains('show') && overlay.dataset.transitionStabilityRestV142 !== 'true') {
      overlay.classList.remove('show');
    }

    try {
      var controller = window.__exerciseSessionControllerV46;
      if (controller && typeof controller.armRestTransition === 'function') controller.armRestTransition(kind);
    } catch (_) {}

    var totalMs = Math.max(1000,Math.round(Number(config.seconds) || 60) * 1000);
    activeRest = {
      kind:kind,
      key:positionKey(state,kind),
      passToken:String(state.passStartedAt || ''),
      exerciseIndex:Number(state.exerciseIndex) || 0,
      currentSet:Math.max(1,Number(state.currentSet) || 1),
      totalMs:totalMs,
      deadline:Date.now() + totalMs,
      raf:0
    };

    var heading = document.getElementById('bs-overlay-heading');
    if (heading) heading.textContent = 'Vila';
    var label = overlay.querySelector('.bs-label');
    if (label) label.textContent = kind === 'finish' ? 'Mellan övningar' : 'Mellan set';

    overlay.dataset.betweenType = 'rest';
    overlay.dataset.transitionStabilityRestV142 = 'true';
    overlay.classList.add('show');

    var value = document.getElementById('bs-overlay-value');
    if (value) value.textContent = formatTime(totalMs / 1000);

    try {
      var controller2 = window.__exerciseSessionControllerV46;
      if (controller2 && typeof controller2.normalizeSegments === 'function') controller2.normalizeSegments();
    } catch (_) {}

    paintRest();
    return true;
  }

  function findTransitionButton(kind) {
    var controls = document.getElementById('session-controls');
    if (!controls) return null;

    return Array.prototype.slice.call(controls.querySelectorAll('button')).find(function (button) {
      var text = String(button.textContent || '').trim().toLocaleLowerCase('sv-SE');
      var onclick = String(button.getAttribute('onclick') || '');
      if (kind === 'next') {
        return text.indexOf('starta nästa set') === 0 ||
          text === 'extra set' ||
          onclick.indexOf('startNextSet') >= 0;
      }
      return text.indexOf('övning klar') === 0 ||
        text.indexOf('starta nästa övning') === 0 ||
        onclick.indexOf('finishCurrentExercise') >= 0;
    }) || null;
  }

  function startCustomTransition(state,kind,config) {
    if (!state || !config || config.type !== 'custom' || !config.name) return false;
    var key = positionKey(state,kind);
    if (lastCustomKey === key) return true;

    var button = findTransitionButton(kind);
    if (!button) return false;

    /* Use the existing routing/custom transition handlers deliberately. They
       own log preservation and the temporary cardio exercise. Triggering the
       already-rendered transition button makes the configured between exercise
       enter the normal 5 s pre-timer path without requiring a second user tap. */
    lastCustomKey = key;
    try {
      button.click();
      return true;
    } catch (_) {
      lastCustomKey = '';
      return false;
    }
  }

  function syncTransition() {
    var state = getState();
    if (!state) {
      lastCustomKey = '';
      lastPositionKey = '';
      cancelRest(true);
      return;
    }

    if (activeRest) {
      var currentKey = positionKey(state,activeRest.kind);
      if (
        String(state.passStartedAt || '') !== activeRest.passToken ||
        Number(state.exerciseIndex || 0) !== activeRest.exerciseIndex ||
        Math.max(1,Number(state.currentSet) || 1) !== activeRest.currentSet ||
        state.setRunning ||
        currentKey !== activeRest.key
      ) {
        cancelRest(true);
      } else {
        return;
      }
    }

    if (state.__betweenCustomRuntimeV3) return;
    if (state.setRunning || !state.awaitingDecision) return;

    var kind = expectedTransition(state);
    if (!kind) return;

    var key = positionKey(state,kind);
    if (lastPositionKey !== key) {
      lastPositionKey = key;
      if (lastCustomKey !== key) lastCustomKey = '';
    }

    var config = transitionConfig(state,kind);

    if (config.type === 'rest') {
      beginRest(state,kind,config);
      return;
    }

    if (config.type === 'custom' && config.name) {
      if (!startCustomTransition(state,kind,config)) {
        setTimeout(syncTransition,35);
      }
    }
  }

  function scheduleSync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(function () {
      syncQueued = false;
      syncTransition();
    });
  }

  function wrapAfter(name) {
    var fn = window[name];
    if (typeof fn !== 'function' || fn.__transitionStabilityV142Wrapped) return false;

    var wrapped = function () {
      var result = fn.apply(this,arguments);

      /* completeCurrentSet has already committed awaitingDecision when it
         returns. Run synchronously so older auto-rest layers see our overlay
         and stand down instead of racing us. */
      if (name === 'completeCurrentSet') syncTransition();
      else scheduleSync();

      setTimeout(syncTransition,0);
      setTimeout(syncTransition,45);
      setTimeout(syncTransition,140);
      return result;
    };
    wrapped.__transitionStabilityV142Wrapped = true;
    wrapped.__transitionStabilityV142Original = fn;
    window[name] = wrapped;
    return true;
  }

  function relevantClick(event) {
    var button = event.target && event.target.closest ? event.target.closest('#session-controls button') : null;
    if (!button) return;
    var text = String(button.textContent || '').trim().toLocaleLowerCase('sv-SE');
    if (
      text.indexOf('klar med set') === 0 ||
      text.indexOf('starta nästa set') === 0 ||
      text.indexOf('övning klar') === 0 ||
      text.indexOf('starta nästa övning') === 0
    ) {
      setTimeout(syncTransition,0);
      setTimeout(syncTransition,60);
    }
  }

  function installObservers() {
    var modal = document.getElementById('session-modal');
    if (!modal || typeof MutationObserver === 'undefined') return;

    var observer = new MutationObserver(function (mutations) {
      var relevant = mutations.some(function (mutation) {
        var target = mutation.target && mutation.target.nodeType === 1
          ? mutation.target
          : mutation.target && mutation.target.parentElement;
        if (!target) return false;
        if (target.closest && target.closest('#bs-overlay-value,#session-pass-timer,#session-set-timer,#session-countdown-value,#session-pre-timer-value')) return false;
        return !!(
          (target.matches && target.matches('#session-controls,#session-modal')) ||
          (target.closest && target.closest('#session-controls')) ||
          (target.querySelector && target.querySelector('#session-controls'))
        );
      });
      if (relevant) scheduleSync();
    });
    observer.observe(modal,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }

  function dependenciesReady() {
    return !!(
      document.getElementById('session-modal') &&
      typeof window.completeCurrentSet === 'function' &&
      window.__exerciseBetweenRoutingV7 &&
      window.__exerciseBetweenCustomV3Installed &&
      window.__exerciseSessionControllerV46Installed
    );
  }

  function install(attempt) {
    if (installed) return;
    attempt = Number(attempt) || 0;

    if (!dependenciesReady()) {
      if (attempt < 240) setTimeout(function () { install(attempt + 1); },50);
      return;
    }

    installed = true;
    ensureOverlay();
    wrapAfter('completeCurrentSet');
    wrapAfter('renderSessionMode');
    wrapAfter('startCurrentSet');
    wrapAfter('startNextSet');
    wrapAfter('finishCurrentExercise');

    document.addEventListener('click',relevantClick,false);
    installObservers();
    scheduleSync();

    window.__exerciseSessionTransitionStabilityV142 = {
      sync:syncTransition,
      ensureOverlay:ensureOverlay
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',function () { install(0); },{once:true});
  } else {
    install(0);
  }
})();