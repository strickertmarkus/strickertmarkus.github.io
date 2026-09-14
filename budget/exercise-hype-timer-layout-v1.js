(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (window.__exerciseHypeTimerLayoutV1Installed) return;
  window.__exerciseHypeTimerLayoutV1Installed = true;
  /* Set this before DOMContentLoaded so every older polling layer can yield
     before its first live-session tick. */
  window.__exerciseSessionControllerV46Installed = true;

  var liveFrame = 0;
  var lastPaintAt = 0;
  var unifiedPretimer = null;

  function addStyles() {
    if (document.getElementById('exercise-hype-timer-layout-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-hype-timer-layout-v1-style';
    style.textContent = `
      /* Final timer geometry authority. The session has accumulated several
         visual layers; keeping all geometry here prevents an older layer from
         offsetting a timer when Hype mode changes state. */
      #session-modal.show .session-timers {
        display:grid !important;
        grid-template-columns:repeat(2,minmax(0,1fr)) !important;
        align-items:stretch !important;
        width:100% !important;
        min-width:0 !important;
        gap:10px !important;
      }
      #session-modal.show .session-top {
        display:grid !important;
        grid-template-columns:minmax(104px,1fr) auto auto auto !important;
        align-items:center !important;
        gap:7px !important;
      }
      #session-modal.show .session-top > div:first-child {
        min-width:0 !important;
      }
      #session-modal.show .session-title,
      #session-modal.show #session-subtitle {
        overflow:hidden !important;
        text-overflow:ellipsis !important;
        white-space:nowrap !important;
      }
      #session-modal.show .session-view-toggle,
      #session-modal.show .session-top > .session-cta {
        min-width:0 !important;
        white-space:nowrap !important;
      }
      #session-modal.show .session-timers .timer-box {
        box-sizing:border-box !important;
        display:grid !important;
        align-content:center !important;
        justify-items:center !important;
        min-width:0 !important;
        min-height:74px !important;
        padding:10px 8px !important;
        text-align:center !important;
      }
      #session-modal.show .session-timers .timer-lbl,
      #session-modal.show .session-timers .timer-val {
        width:100% !important;
        min-width:0 !important;
        margin-left:0 !important;
        margin-right:0 !important;
        text-align:center !important;
        white-space:nowrap !important;
      }
      #session-modal.show .session-timers .timer-val {
        font-variant-numeric:tabular-nums !important;
        letter-spacing:-.6px !important;
      }

      #session-cardio-countdown {
        box-sizing:border-box !important;
        width:100% !important;
        min-width:0 !important;
        margin:5px auto 7px !important;
        padding:3px 0 5px !important;
        align-items:center !important;
        justify-content:center !important;
        overflow:visible !important;
      }
      #session-countdown-ring {
        box-sizing:border-box !important;
        flex:0 0 180px !important;
        width:180px !important;
        height:180px !important;
        aspect-ratio:1 !important;
        margin:0 auto !important;
        position:relative !important;
        display:grid !important;
        place-items:center !important;
        transform:none !important;
      }
      #session-countdown-segments {
        position:absolute !important;
        inset:0 !important;
        width:100% !important;
        height:100% !important;
        border-radius:50% !important;
        transform:none !important;
      }
      #session-countdown-segments .session-countdown-segment {
        --countdown-segment-color:rgba(251,146,60,.11);
        box-sizing:border-box !important;
        position:absolute !important;
        left:50% !important;
        top:50% !important;
        width:3px !important;
        height:calc(50% - 2px) !important;
        margin:0 !important;
        border-radius:999px !important;
        background:linear-gradient(to bottom,var(--countdown-segment-color) 0 13px,transparent 13px) !important;
        box-shadow:none !important;
        filter:none;
        opacity:.65;
        transform:translate(-50%,-100%) rotate(var(--countdown-angle,0deg)) !important;
        transform-origin:50% 100% !important;
        transition:opacity .12s linear,filter .12s linear !important;
      }
      #session-countdown-segments .session-countdown-segment.active {
        --countdown-segment-color:#FB923C;
        opacity:1;
        filter:drop-shadow(0 0 3px rgba(251,146,60,.60));
      }
      #session-countdown-segments .session-countdown-segment.inactive {
        --countdown-segment-color:rgba(251,146,60,.11);
        opacity:.65;
        filter:none;
      }
      #session-countdown-ring .session-countdown-core {
        box-sizing:border-box !important;
        inset:24px !important;
      }
      #session-countdown-ring .session-countdown-copy {
        position:relative !important;
        z-index:2 !important;
        display:grid !important;
        place-content:center !important;
        justify-items:center !important;
        width:calc(100% - 52px) !important;
        min-width:0 !important;
        margin:0 auto !important;
        text-align:center !important;
        transform:none !important;
      }
      #session-countdown-value,
      #session-countdown-pause-hint {
        width:100% !important;
        min-width:0 !important;
        text-align:center !important;
      }
      #session-countdown-value {
        font-variant-numeric:tabular-nums !important;
        white-space:nowrap !important;
      }

      #session-pre-timer.show {
        box-sizing:border-box !important;
        display:grid !important;
        grid-template:1fr / 1fr !important;
        place-items:center !important;
        width:100vw !important;
        height:100dvh !important;
        min-height:100svh !important;
        margin:0 !important;
        transform:none !important;
        backdrop-filter:none !important;
        -webkit-backdrop-filter:none !important;
        animation:exercise-pretimer-enter-v46 .18s ease-out both !important;
      }
      #session-pre-timer.show.is-closing-v46 {
        opacity:0 !important;
        transition:opacity .12s ease-out !important;
      }
      @keyframes exercise-pretimer-enter-v46 {
        from { opacity:0; }
        to { opacity:1; }
      }
      #session-pre-timer-ring {
        box-sizing:border-box !important;
        position:relative !important;
        width:172px !important;
        height:172px !important;
        aspect-ratio:1 !important;
        margin:auto !important;
        transform:none !important;
      }
      #session-pre-timer-ring::after {
        content:'' !important;
        position:absolute !important;
        inset:auto !important;
        left:50% !important;
        top:50% !important;
        width:10px !important;
        height:10px !important;
        margin:-5px 0 0 -5px !important;
        border-radius:0 6px 6px 0 !important;
        background:#FB923C !important;
        box-shadow:0 0 7px rgba(251,146,60,.42) !important;
        transform:rotate(var(--pre-smooth-progress,0deg)) translateY(-81px) !important;
        transform-origin:5px 5px !important;
        pointer-events:none !important;
        z-index:3 !important;
      }
      #session-pre-timer-ring .session-pre-copy {
        position:relative !important;
        z-index:4 !important;
        display:grid !important;
        place-content:center !important;
        justify-items:center !important;
        width:100% !important;
        height:100% !important;
        margin:0 !important;
        text-align:center !important;
        transform:none !important;
      }
      #session-pre-timer-value {
        min-width:0 !important;
        width:100% !important;
        margin:0 !important;
        text-align:center !important;
        font-variant-numeric:tabular-nums !important;
      }

      /* The rest timer uses the same centre-based geometry as the active
         cardio timer. Its old fixed translateY radius was another source of
         crooked rings on small screens. */
      #session-between-overlay-v2 {
        box-sizing:border-box !important;
        place-items:center !important;
        backdrop-filter:none !important;
        -webkit-backdrop-filter:none !important;
      }
      #session-between-overlay-v2.show .bs-overlay-wrap {
        width:100% !important;
        min-width:0 !important;
        display:grid !important;
        justify-items:center !important;
        animation:exercise-between-enter-v46 .18s ease-out both !important;
      }
      @keyframes exercise-between-enter-v46 {
        from { opacity:0;transform:translateY(4px); }
        to { opacity:1;transform:none; }
      }
      #session-between-overlay-v2 .bs-ring {
        box-sizing:border-box !important;
        width:180px !important;
        height:180px !important;
        aspect-ratio:1 !important;
        position:relative !important;
        display:grid !important;
        place-items:center !important;
        margin:0 auto !important;
        transform:none !important;
      }
      #session-between-overlay-v2 .bs-segments {
        position:absolute !important;
        inset:0 !important;
        width:100% !important;
        height:100% !important;
        transform:none !important;
      }
      #session-between-overlay-v2 .bs-segment {
        --between-segment-color:rgba(251,146,60,.11);
        box-sizing:border-box !important;
        position:absolute !important;
        left:50% !important;
        top:50% !important;
        width:3px !important;
        height:calc(50% - 2px) !important;
        margin:0 !important;
        background:linear-gradient(to bottom,var(--between-segment-color) 0 13px,transparent 13px) !important;
        box-shadow:none !important;
        opacity:.65;
        transform:translate(-50%,-100%) rotate(var(--between-angle,0deg)) !important;
        transform-origin:50% 100% !important;
      }
      #session-between-overlay-v2 .bs-segment.active {
        --between-segment-color:#FB923C;
        opacity:1;
        filter:drop-shadow(0 0 3px rgba(251,146,60,.60));
      }
      #session-between-overlay-v2 .bs-core { inset:24px !important; }
      #session-between-overlay-v2 .bs-copy {
        position:relative !important;
        z-index:2 !important;
        width:calc(100% - 52px) !important;
        margin:0 auto !important;
        text-align:center !important;
      }

      @media(max-width:600px) {
        #session-modal.show .session-top {
          grid-template-columns:minmax(94px,1fr) auto auto auto !important;
          gap:5px !important;
          padding-left:12px !important;
          padding-right:12px !important;
        }
        #session-modal.show .session-top .session-view-toggle {
          min-height:36px !important;
          padding:7px 8px !important;
          font-size:9px !important;
        }
        #session-modal.show .session-top > .session-cta {
          min-height:36px !important;
          padding:7px 10px !important;
          font-size:11px !important;
        }
        #session-modal.show .session-timers { gap:7px !important; }
        #session-modal.show .session-timers .timer-box {
          min-height:68px !important;
          padding:9px 5px !important;
        }
        #session-modal.show .session-timers .timer-val {
          font-size:clamp(23px,7.2vw,28px) !important;
        }
        #session-countdown-ring {
          flex-basis:min(164px,48vw) !important;
          width:min(164px,48vw) !important;
          height:min(164px,48vw) !important;
        }
        #session-countdown-segments .session-countdown-segment {
          background:linear-gradient(to bottom,var(--countdown-segment-color) 0 11px,transparent 11px) !important;
        }
        #session-countdown-ring .session-countdown-core { inset:21px !important; }
        #session-countdown-ring .session-countdown-copy { width:calc(100% - 46px) !important; }

        #session-pre-timer.show {
          padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom)) !important;
        }
        #session-pre-timer-ring {
          width:158px !important;
          height:158px !important;
        }
        #session-pre-timer-ring::after {
          transform:rotate(var(--pre-smooth-progress,0deg)) translateY(-74px) !important;
        }
        #session-between-overlay-v2 .bs-ring {
          width:164px !important;
          height:164px !important;
        }
        #session-between-overlay-v2 .bs-segment {
          background:linear-gradient(to bottom,var(--between-segment-color) 0 11px,transparent 11px) !important;
        }
        #session-between-overlay-v2 .bs-core { inset:21px !important; }
        #session-between-overlay-v2 .bs-copy { width:calc(100% - 46px) !important; }
      }

      @media(max-width:360px) {
        #session-modal.show .session-top {
          grid-template-columns:minmax(0,1fr) auto auto !important;
        }
        #session-modal.show .session-top > div:first-child {
          grid-column:1 / -1 !important;
        }
        #session-modal.show .session-pretimer-toggle-v2 { justify-self:start !important; }
        #session-pre-timer-ring {
          width:146px !important;
          height:146px !important;
        }
        #session-pre-timer-ring::after {
          transform:rotate(var(--pre-smooth-progress,0deg)) translateY(-68px) !important;
        }
        #session-between-overlay-v2 .bs-ring {
          width:150px !important;
          height:150px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeSegments() {
    document.querySelectorAll('#session-countdown-segments .session-countdown-segment').forEach(function (segment, index) {
      segment.style.setProperty('--countdown-angle', (index * 6) + 'deg');
      segment.style.removeProperty('transform');
    });
    document.querySelectorAll('#session-between-overlay-v2 .bs-segment').forEach(function (segment, index) {
      segment.style.setProperty('--between-angle', (index * 6) + 'deg');
      segment.style.removeProperty('transform');
    });
  }

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    return state.exercises[Number(state.exerciseIndex) || 0] || null;
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element && element.textContent !== value) element.textContent = value;
  }

  function formatClock(seconds) {
    var whole = Math.max(0, Math.floor(Number(seconds) || 0));
    return String(Math.floor(whole / 60)).padStart(2, '0') + ':' + String(whole % 60).padStart(2, '0');
  }

  function timerEnabledForDate(date) {
    try {
      var api = window.__exerciseFlowPolishV2;
      if (api && typeof api.timerEnabledForDate === 'function') return api.timerEnabledForDate(date) !== false;
    } catch (_) {}
    try {
      var plans = typeof window.getPlannedSessions === 'function' ? window.getPlannedSessions() : null;
      if (plans && plans[date] && typeof plans[date].preTimerEnabled === 'boolean') return plans[date].preTimerEnabled;
    } catch (_) {}
    return true;
  }

  function syncSessionChrome() {
    var state = getState();
    var toggle = document.getElementById('session-pretimer-toggle-v2');
    if (toggle) {
      toggle.style.display = state ? '' : 'none';
      if (state) {
        var enabled = timerEnabledForDate(state.date);
        if (typeof window.__renderSessionPretimerToggleV48 === 'function') {
          window.__renderSessionPretimerToggleV48(toggle,enabled);
        } else {
          toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
          toggle.textContent = enabled ? '5 s: På' : '5 s: Av';
        }
      }
    }
    normalizeSegments();
  }

  function renderStable() {
    try {
      if (typeof window.renderSessionMode === 'function') window.renderSessionMode();
    } catch (_) {}
    syncSessionChrome();
  }

  function paintPrimaryTimers(now) {
    var state = getState();
    if (!state) return;
    var passElapsed = Math.max(0, (now - Number(state.passStartedAt || now)) / 1000);
    var setEnd = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : now;
    var setElapsed = state.setRunning && state.setStartedAt
      ? Math.max(0, (setEnd - Number(state.setStartedAt)) / 1000)
      : 0;
    setText('session-pass-timer', formatClock(passElapsed));
    setText('session-set-timer', formatClock(setElapsed));
  }

  function paintCardioTimer(now) {
    var state = getState();
    var exercise = currentExercise(state);
    var wrap = document.getElementById('session-cardio-countdown');
    if (!wrap) return;
    var timed = !!(state && state.setRunning && state.setStartedAt && exercise && exercise.kind === 'cardio' && Number(exercise.time) > 0);
    wrap.classList.toggle('show', timed);
    if (!timed) {
      delete wrap.dataset.activeCountV46;
      return;
    }

    var total = Number(exercise.time) * 60;
    var end = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : now;
    var elapsed = Math.max(0, (end - Number(state.setStartedAt)) / 1000);
    var remaining = Math.max(0, total - elapsed);
    setText('session-countdown-value', formatClock(Math.ceil(remaining)));

    var activeCount = Math.max(0, Math.min(60, Math.ceil(60 * remaining / total)));
    if (wrap.dataset.activeCountV46 === String(activeCount)) return;
    wrap.dataset.activeCountV46 = String(activeCount);
    document.querySelectorAll('#session-countdown-segments .session-countdown-segment').forEach(function (segment, index) {
      var active = index < activeCount;
      segment.classList.toggle('active', active);
      segment.classList.toggle('inactive', !active);
    });
  }

  function closePretimerSurface(immediate) {
    var element = document.getElementById('session-pre-timer');
    if (!element) return;
    if (immediate) {
      element.classList.remove('show', 'is-closing-v46');
      return;
    }
    element.classList.add('is-closing-v46');
    setTimeout(function () {
      if (!unifiedPretimer) element.classList.remove('show', 'is-closing-v46');
    }, 120);
  }

  function finishUnifiedPretimer() {
    if (!unifiedPretimer) return;
    var pending = unifiedPretimer;
    unifiedPretimer = null;
    if (typeof pending.done === 'function') pending.done();
    closePretimerSurface(false);
  }

  function cancelUnifiedPretimer() {
    unifiedPretimer = null;
    closePretimerSurface(true);
  }

  function paintPretimer(now) {
    if (!unifiedPretimer) return;
    var elapsed = Math.max(0, now - unifiedPretimer.startedAt);
    var remaining = Math.max(0, unifiedPretimer.duration - elapsed);
    var value = Math.max(1, Math.ceil(remaining / 1000));
    setText('session-pre-timer-value', String(value));
    var ring = document.getElementById('session-pre-timer-ring');
    if (ring) ring.style.setProperty('--pre-smooth-progress', (Math.min(1, elapsed / unifiedPretimer.duration) * 360).toFixed(3) + 'deg');
    if (remaining <= 0) finishUnifiedPretimer();
  }

  function paintLiveTimers() {
    var now = Date.now();
    paintPrimaryTimers(now);
    paintCardioTimer(now);
    paintPretimer(now);
  }

  function liveLoop(frameTime) {
    if (frameTime - lastPaintAt >= 32) {
      lastPaintAt = frameTime;
      paintLiveTimers();
    }
    if (getState() || unifiedPretimer) liveFrame = requestAnimationFrame(liveLoop);
    else liveFrame = 0;
  }

  function startUnifiedTimerLoop() {
    if (liveFrame) {
      paintLiveTimers();
      return;
    }
    lastPaintAt = 0;
    liveFrame = requestAnimationFrame(liveLoop);
    paintLiveTimers();
  }

  function stopUnifiedTimerLoop() {
    if (liveFrame) cancelAnimationFrame(liveFrame);
    liveFrame = 0;
    lastPaintAt = 0;
    cancelUnifiedPretimer();
    var state = getState();
    if (state) delete state.__restTransitionPendingV48;
  }

  function ensurePretimerHandlers() {
    var element = document.getElementById('session-pre-timer');
    if (!element || element.dataset.unifiedV46 === 'true') return;
    element.dataset.unifiedV46 = 'true';
    element.addEventListener('click', function (event) {
      if (!unifiedPretimer) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      finishUnifiedPretimer();
    }, true);
    element.addEventListener('keydown', function (event) {
      if (!unifiedPretimer || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      finishUnifiedPretimer();
    }, true);
  }

  function beginSetRaw(expectedState) {
    var state = getState();
    if (!state || state !== expectedState || state.setRunning || state.awaitingDecision) return;
    state.setRunning = true;
    state.setStartedAt = Date.now();
    state.__hypePaused = false;
    state.__hypePausedAt = null;
    state.__unifiedStartingV46 = false;
    renderStable();
    startUnifiedTimerLoop();
  }

  function startSetWithGate(state) {
    if (!state || unifiedPretimer) return false;
    if (!timerEnabledForDate(state.date)) {
      beginSetRaw(state);
      return false;
    }
    ensurePretimerHandlers();
    var element = document.getElementById('session-pre-timer');
    var ring = document.getElementById('session-pre-timer-ring');
    if (!element || !ring) {
      beginSetRaw(state);
      return false;
    }
    state.__unifiedStartingV46 = true;
    unifiedPretimer = {
      startedAt: Date.now(),
      duration: 5000,
      done: function () { beginSetRaw(state); }
    };
    ring.style.setProperty('--pre-smooth-progress', '0deg');
    element.classList.remove('is-closing-v46');
    element.classList.add('show');
    var modal = document.getElementById('session-modal');
    if (modal) modal.classList.add('persistent-hype', 'hype-focus', 'hype-mode');
    startUnifiedTimerLoop();
    return true;
  }

  function startCurrentSetV46() {
    var state = getState();
    if (!state || !Array.isArray(state.exercises) || state.setRunning || state.awaitingDecision || Number(state.exerciseIndex) >= state.exercises.length) return;
    startSetWithGate(state);
  }

  function consumeRestTransition(state, kind) {
    var pending = state && state.__restTransitionPendingV48;
    if (!pending || !state) return false;
    var matches = pending.kind === kind &&
      pending.passToken === String(state.passStartedAt || '') &&
      pending.exerciseIndex === Number(state.exerciseIndex) &&
      pending.currentSet === Number(state.currentSet);
    if (matches) delete state.__restTransitionPendingV48;
    return matches;
  }

  function armRestTransition(kind) {
    var state = getState();
    if (!state || (kind !== 'next' && kind !== 'finish')) return;
    state.__restTransitionPendingV48 = {
      passToken:String(state.passStartedAt || ''),
      exerciseIndex:Number(state.exerciseIndex),
      currentSet:Number(state.currentSet),
      kind:kind
    };
  }

  function startNextSetV46() {
    var state = getState();
    if (!state || !Array.isArray(state.exercises) || state.setRunning || !state.awaitingDecision) return;
    consumeRestTransition(state, 'next');
    state.currentSet = Math.max(1, Number(state.currentSet) || 1) + 1;
    state.awaitingDecision = false;
    state.setStartedAt = null;
    if (startSetWithGate(state)) renderStable();
  }

  function addExtraSetV46() {
    var state = getState();
    var exercise = currentExercise(state);
    if (!state || !exercise || state.setRunning || !state.awaitingDecision) return;
    exercise.plannedSets = Math.max(1, Number(exercise.plannedSets) || 1) + 1;
    state.currentSet = Math.max(1, Number(state.currentSet) || 1) + 1;
    state.awaitingDecision = false;
    state.setStartedAt = null;
    if (startSetWithGate(state)) renderStable();
  }

  function finishCurrentExerciseV46() {
    var state = getState();
    if (!state || !Array.isArray(state.exercises) || state.setRunning) return;
    var autoStart = consumeRestTransition(state, 'finish');
    state.setStartedAt = null;
    state.awaitingDecision = false;
    state.exerciseIndex = Math.max(0, Number(state.exerciseIndex) || 0) + 1;
    state.currentSet = 1;
    state.__hypePaused = false;
    state.__hypePausedAt = null;
    if (autoStart && state.exerciseIndex < state.exercises.length) {
      if (startSetWithGate(state)) renderStable();
    } else {
      renderStable();
    }
  }

  function completeCurrentSetV46() {
    var state = getState();
    var exercise = currentExercise(state);
    if (!state || !exercise || !state.setRunning || !state.setStartedAt) return;
    var endedAt = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : Date.now();
    var duration = Math.max(1, Math.round((endedAt - Number(state.setStartedAt)) / 1000));
    var logs = state.logs && state.logs[state.exerciseIndex];
    if (!Array.isArray(logs)) {
      if (!Array.isArray(state.logs)) state.logs = [];
      logs = state.logs[state.exerciseIndex] = [];
    }
    logs.push(exercise.kind === 'cardio' ? {
      setNo: state.currentSet,
      actualDistance: Number(exercise.distance) || 0,
      actualTime: Number(exercise.time) || +(duration / 60).toFixed(2),
      durationSec: duration
    } : {
      setNo: state.currentSet,
      targetReps: Number(exercise.reps) || 0,
      targetWeight: Number(exercise.weight) || 0,
      actualReps: Number(exercise.reps) || 0,
      actualWeight: Number(exercise.weight) || 0,
      durationSec: duration
    });
    state.setRunning = false;
    state.setStartedAt = null;
    state.awaitingDecision = true;
    state.__hypePaused = false;
    state.__hypePausedAt = null;
    renderStable();
  }

  function installController() {
    window.startSessionTimerLoop = startUnifiedTimerLoop;
    window.stopSessionTimerLoop = stopUnifiedTimerLoop;
    window.updateSessionTimers = paintLiveTimers;
    window.startCurrentSet = startCurrentSetV46;
    window.startNextSet = startNextSetV46;
    window.addExtraSet = addExtraSetV46;
    window.completeCurrentSet = completeCurrentSetV46;
    window.finishCurrentExercise = finishCurrentExerciseV46;

    window.__exerciseSessionControllerV46 = {
      paint: paintLiveTimers,
      normalizeSegments: normalizeSegments,
      cancelPretimer: cancelUnifiedPretimer,
      armRestTransition: armRestTransition
    };

    ensurePretimerHandlers();
    syncSessionChrome();
    if (getState()) startUnifiedTimerLoop();
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && getState()) {
        paintLiveTimers();
        startUnifiedTimerLoop();
      }
    });
  }

  function install() {
    addStyles();
    normalizeSegments();
    installController();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
