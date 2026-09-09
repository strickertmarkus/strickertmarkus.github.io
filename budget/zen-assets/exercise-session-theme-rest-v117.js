(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseSessionThemeRestV120Installed) return;
  window.__exerciseSessionThemeRestV120Installed = true;

  var autoRest = null;
  var syncScheduled = false;
  var passPretimerArmUntil = 0;
  var passPretimerSeen = false;

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

  function formatTime(seconds) {
    seconds = Math.max(0,Math.ceil(Number(seconds) || 0));
    return String(Math.floor(seconds / 60)).padStart(2,'0') + ':' + String(seconds % 60).padStart(2,'0');
  }

  function ensureOverlayCapture() {
    var overlay = document.getElementById('session-between-overlay-v2');
    if (!overlay || overlay.dataset.autoRestCaptureV118 === 'true') return overlay;
    overlay.dataset.autoRestCaptureV118 = 'true';
    overlay.addEventListener('click',function (event) {
      if (!autoRest || overlay.dataset.autoRestV118 !== 'true') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      finishAutoRest();
    },true);
    overlay.addEventListener('keydown',function (event) {
      if (!autoRest || overlay.dataset.autoRestV118 !== 'true' || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      finishAutoRest();
    },true);
    return overlay;
  }

  function paintAutoRest() {
    if (!autoRest) return;
    var overlay = document.getElementById('session-between-overlay-v2');
    if (!overlay) return;
    var remain = Math.max(0,autoRest.deadline - Date.now());
    var value = document.getElementById('bs-overlay-value');
    if (value) value.textContent = formatTime(remain / 1000);
    var activeCount = Math.max(0,Math.min(60,Math.ceil(60 * remain / autoRest.totalMs)));
    overlay.querySelectorAll('.bs-segment').forEach(function (segment,index) {
      segment.classList.toggle('active',index < activeCount);
    });
    if (remain <= 0) finishAutoRest();
  }

  function finishAutoRest() {
    if (!autoRest) return;
    var pending = autoRest;
    autoRest = null;
    if (pending.timer) clearInterval(pending.timer);

    var overlay = document.getElementById('session-between-overlay-v2');
    if (overlay) {
      overlay.classList.remove('show');
      overlay.removeAttribute('data-between-type');
      overlay.removeAttribute('data-auto-rest-v118');
    }

    requestAnimationFrame(function () {
      try {
        if (pending.kind === 'next' && typeof window.startNextSet === 'function') window.startNextSet();
        else if (pending.kind === 'finish' && typeof window.finishCurrentExercise === 'function') window.finishCurrentExercise();
      } catch (_) {}
      scheduleSync();
    });
  }

  function beginAutoRest(state,kind,config) {
    if (!state || !kind || !config || config.type !== 'rest' || autoRest) return false;
    var overlay = ensureOverlayCapture();
    if (!overlay || overlay.classList.contains('show')) return false;

    var controller = window.__exerciseSessionControllerV46;
    try {
      if (controller && typeof controller.armRestTransition === 'function') controller.armRestTransition(kind);
    } catch (_) {}

    var heading = document.getElementById('bs-overlay-heading');
    if (heading) heading.textContent = 'Vila';
    var label = overlay.querySelector('.bs-label');
    if (label) label.textContent = kind === 'finish' ? 'Mellan övningar' : 'Mellan set';

    var totalMs = Math.max(1000,Math.round(Number(config.seconds) || 60) * 1000);
    autoRest = {
      kind:kind,
      passToken:String(state.passStartedAt || ''),
      exerciseIndex:Number(state.exerciseIndex) || 0,
      currentSet:Number(state.currentSet) || 1,
      totalMs:totalMs,
      deadline:Date.now() + totalMs,
      timer:null
    };

    overlay.dataset.betweenType = 'rest';
    overlay.dataset.autoRestV118 = 'true';
    overlay.classList.add('show');
    paintAutoRest();
    autoRest.timer = setInterval(paintAutoRest,100);
    return true;
  }

  function tryAutoRest() {
    var state = getState();
    if (!state || state.setRunning || !state.awaitingDecision || autoRest) return false;
    var kind = transitionKind(state);
    if (!kind) return false;
    var config = transitionConfig(state,kind);
    if (config.type !== 'rest') return false;

    var overlay = document.getElementById('session-between-overlay-v2');
    if (overlay && overlay.classList.contains('show')) return true;
    return beginAutoRest(state,kind,config);
  }

  function nextPendingKind(state) {
    try {
      var api = window.__exerciseProgressConsistencyV10;
      if (api && typeof api.calculate === 'function') {
        var result = api.calculate(state);
        if (result && Array.isArray(result.segments)) {
          var next = result.segments.find(function (segment) { return segment && !segment.done; });
          if (next && (['strength','cardio','stretch','meditation'].indexOf(next.kind)!==-1)) return next.kind;
        }
      }
    } catch (_) {}

    var ex = currentExercise(state);
    var kind = transitionKind(state);
    var config = transitionConfig(state,kind);
    if (kind === 'next' && config.type === 'custom') return 'cardio';
    return ex ? ex.kind : 'strength';
  }

  function installStyle() {
    if (document.getElementById('exercise-session-theme-rest-v120-style')) return;
    ['exercise-session-theme-rest-v117-style','exercise-session-theme-rest-v118-style','exercise-session-theme-rest-v119-style'].forEach(function (id) {
      var old = document.getElementById(id);
      if (old) old.remove();
    });

    var style = document.createElement('style');
    style.id = 'exercise-session-theme-rest-v120-style';
    style.textContent = `
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-between-set-strength-v118 {
        --pf-accent:#FB923C !important;
        --pf-soft:#FED7AA !important;
        --pf-rgb:251,146,60 !important;
        --pf-speed:2.8s !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-between-set-cardio-v118 {
        --pf-accent:#EF4444 !important;
        --pf-soft:#FCA5A5 !important;
        --pf-rgb:239,68,68 !important;
        --pf-speed:2.8s !important;
      }

      html.exercise-concept-pulse-home-v1 body #session-modal #session-set-log .session-log-unit-wrap-v118 {
        position:relative !important;
        display:block !important;
        width:100% !important;
        min-width:0 !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal #session-set-log .session-log-unit-wrap-v118 > input {
        width:100% !important;
        padding-right:27px !important;
        box-sizing:border-box !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal #session-set-log .session-log-unit-v118 {
        position:absolute !important;
        right:4px !important;
        top:50% !important;
        transform:translateY(-50%) !important;
        pointer-events:none !important;
        color:#8793A3 !important;
        font-size:9px !important;
        font-weight:750 !important;
        letter-spacing:.1px !important;
        line-height:1 !important;
      }

      /* Only change the existing Pulse Flow palette. Geometry stays owned by
         the normal five-second timer, so the green start countdown is identical
         in shape and motion to the orange/red variants. */
      html.exercise-concept-pulse-home-v1 body #session-pre-timer.pulse-flow-pass-start-v120 {
        --concept-timer-accent:#34D399 !important;
        --concept-timer-soft:#A7F3D0 !important;
        --concept-timer-rgb:52,211,153 !important;
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

    var nextKind = betweenSets ? nextPendingKind(state) : null;
    modal.classList.remove('pulse-flow-between-set-strength-v117','pulse-flow-between-set-cardio-v117');
    modal.classList.toggle('pulse-flow-between-set-strength-v118',betweenSets && nextKind === 'strength');
    modal.classList.toggle('pulse-flow-between-set-cardio-v118',betweenSets && nextKind === 'cardio');
  }

  function hasLoggedMoment(state) {
    if (!state || !Array.isArray(state.logs)) return false;
    return state.logs.some(function (logs) { return Array.isArray(logs) && logs.length > 0; });
  }

  function freshIntroState(state) {
    var pre = document.getElementById('session-pre-timer');
    return !!(
      state && Array.isArray(state.exercises) && state.exercises.length > 0 &&
      Number(state.exerciseIndex || 0) === 0 &&
      Math.max(1,Number(state.currentSet) || 1) === 1 &&
      !state.setRunning && !state.awaitingDecision && !state.__unifiedStartingV46 &&
      !(pre && pre.classList.contains('show')) &&
      !hasLoggedMoment(state)
    );
  }

  function syncPassClock() {
    var state = getState();
    if (!state) return;
    if (freshIntroState(state) && state.__passClockStartedV118 !== true) {
      if (state.__passClockPreparedV118 !== true) {
        state.__passClockPreparedV118 = true;
        state.__passClockStartedV118 = false;
        state.passStartedAt = null;
      }
      var timer = document.getElementById('session-pass-timer');
      if (timer && timer.textContent !== '00:00') timer.textContent = '00:00';
    }
  }

  function startPassClockIfNeeded() {
    var state = getState();
    if (!state || state.__passClockStartedV118 === true) return;
    state.__passClockPreparedV118 = true;
    state.__passClockStartedV118 = true;
    state.passStartedAt = Date.now();
    scheduleSync();
  }

  function armPassPretimer() {
    passPretimerArmUntil = Date.now() + 5000;
    passPretimerSeen = false;
    startPassClockIfNeeded();
    scheduleSync();
  }

  function restorePretimerLabel(pre) {
    if (!pre) return;
    var label = pre.querySelector('.session-pre-label');
    if (!label || !label.dataset.pfPassStartOriginalV120) return;
    label.textContent = label.dataset.pfPassStartOriginalV120;
    delete label.dataset.pfPassStartOriginalV120;
  }

  function syncFirstPretimer() {
    var state = getState();
    var pre = document.getElementById('session-pre-timer');
    if (!pre) return;

    var visible = pre.classList.contains('show');
    var armed = passPretimerArmUntil > Date.now();
    var active = visible && armed;

    pre.classList.remove('pulse-flow-pass-start-v119');
    pre.classList.toggle('pulse-flow-pass-start-v120',active);

    var label = pre.querySelector('.session-pre-label');
    if (active && label) {
      passPretimerSeen = true;
      if (!label.dataset.pfPassStartOriginalV120) {
        label.dataset.pfPassStartOriginalV120 = String(label.textContent || 'Startar Set').trim() || 'Startar Set';
      }
      if (label.textContent !== 'Startar Pass') label.textContent = 'Startar Pass';
      return;
    }

    restorePretimerLabel(pre);

    if ((passPretimerSeen && !visible) || !armed || (!visible && state && state.setRunning)) {
      passPretimerArmUntil = 0;
      passPretimerSeen = false;
    }
  }

  function syncNextIndicator() {
    var state = getState();
    var next = document.getElementById('session-next-ex-inline');
    var arrow = document.getElementById('session-next-ex-arrow');
    if (!state || !next || !arrow || !Array.isArray(state.exercises)) return;

    var nextIndex = (Number(state.exerciseIndex) || 0) + 1;
    var nextExercise = nextIndex >= 0 && nextIndex < state.exercises.length ? state.exercises[nextIndex] : null;
    if (!nextExercise) return;

    var config = transitionConfig(state,'finish');
    var name = config.type === 'rest' ? 'Vila' : String(nextExercise.name || '').trim();
    if (!name) return;

    arrow.hidden = false;
    next.hidden = false;
    if (next.textContent !== name) next.textContent = name;
  }

  function decorateLogUnits() {
    var log = document.getElementById('session-set-log');
    if (!log) return;
    log.querySelectorAll('input[data-session-log-v112="actualWeight"],input[data-session-log-v112="actualTime"]').forEach(function (input) {
      if (input.parentElement && input.parentElement.classList.contains('session-log-unit-wrap-v118')) return;
      var unit = input.getAttribute('data-session-log-v112') === 'actualTime' ? 'min' : 'kg';
      var wrap = document.createElement('span');
      wrap.className = 'session-log-unit-wrap-v118';
      input.parentNode.insertBefore(wrap,input);
      wrap.appendChild(input);
      var suffix = document.createElement('span');
      suffix.className = 'session-log-unit-v118';
      suffix.textContent = unit;
      wrap.appendChild(suffix);
    });
  }

  function syncAll() {
    syncScheduled = false;
    installStyle();
    ensureOverlayCapture();
    syncPassClock();
    syncWaitingTheme();
    syncFirstPretimer();
    syncNextIndicator();
    decorateLogUnits();
    tryAutoRest();
  }

  function scheduleSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(syncAll);
  }

  function wrapBefore(name,before) {
    var original = window[name];
    if (typeof original !== 'function' || original.__exerciseSessionThemeRestV120Wrapped) return false;
    var replacement = function () {
      try { before(); } catch (_) {}
      return original.apply(this,arguments);
    };
    replacement.__exerciseSessionThemeRestV120Wrapped = true;
    replacement.__exerciseSessionThemeRestV120Original = original;
    window[name] = replacement;
    return true;
  }

  function wrapAfter(name,after) {
    var original = window[name];
    if (typeof original !== 'function' || original.__exerciseSessionThemeRestV120Wrapped) return false;
    var replacement = function () {
      var result = original.apply(this,arguments);
      try { after(); } catch (_) {}
      return result;
    };
    replacement.__exerciseSessionThemeRestV120Wrapped = true;
    replacement.__exerciseSessionThemeRestV120Original = original;
    window[name] = replacement;
    return true;
  }

  function installWrappers() {
    wrapBefore('startCurrentSet',startPassClockIfNeeded);
    ['renderSessionMode','startNextSet','addExtraSet','finishCurrentExercise'].forEach(function (name) {
      wrapAfter(name,scheduleSync);
    });
    wrapAfter('completeCurrentSet',function () {
      scheduleSync();
      requestAnimationFrame(tryAutoRest);
      setTimeout(tryAutoRest,40);
    });
  }

  function relevantMutation(mutation) {
    var target = mutation.target && mutation.target.nodeType === 1 ? mutation.target : mutation.target && mutation.target.parentElement;
    if (!target) return false;
    if (target.closest && target.closest('#session-pass-timer,#session-set-timer,#session-countdown-value,#session-pre-timer-value,#bs-overlay-value,.pf-ecg-v80')) return false;
    if (target.closest && target.closest('#session-controls,#session-set-log,#hype-progress-track,#session-next-ex-inline,#session-next-ex-arrow')) return true;
    return Array.prototype.some.call(mutation.addedNodes || [],function (node) {
      if (!node || node.nodeType !== 1) return false;
      return !!(node.matches && node.matches('#session-controls,#session-set-log,#hype-progress-track,#session-next-ex-inline,#session-next-ex-arrow')) ||
        !!(node.querySelector && node.querySelector('#session-controls,#session-set-log,#hype-progress-track,#session-next-ex-inline,#session-next-ex-arrow'));
    });
  }

  function installObservers() {
    var modal = document.getElementById('session-modal');
    if (modal) {
      new MutationObserver(function (mutations) {
        if (mutations.some(relevantMutation)) scheduleSync();
      }).observe(modal,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
    }
    var rest = ensureOverlayCapture();
    if (rest) new MutationObserver(scheduleSync).observe(rest,{attributes:true,attributeFilter:['class','data-between-type']});
    var pre = document.getElementById('session-pre-timer');
    if (pre) new MutationObserver(scheduleSync).observe(pre,{attributes:true,attributeFilter:['class']});
  }

  function handleCapture(event) {
    var button = event.target && event.target.closest ? event.target.closest('button') : null;
    if (!button) return;
    var text = String(button.textContent || '').trim().toLocaleLowerCase('sv-SE');
    var onclick = String(button.getAttribute('onclick') || '');
    var state = getState();

    /* The green one-shot belongs only to an explicit Starta pass action.
       Starta set / Starta nästa set must never arm it. */
    if (text === 'starta pass' && button.closest('#day-workout-modal,#session-modal,#session-controls')) {
      armPassPretimer();
    } else if (state && freshIntroState(state) && (text.indexOf('starta set') === 0 || onclick.indexOf('startCurrentSet') >= 0)) {
      startPassClockIfNeeded();
    }

    if (/^klar med set/.test(text)) {
      requestAnimationFrame(tryAutoRest);
      setTimeout(tryAutoRest,40);
      setTimeout(tryAutoRest,120);
    }
    scheduleSync();
  }

  function install() {
    installStyle();
    installWrappers();
    document.addEventListener('click',handleCapture,true);
    installObservers();
    syncAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();