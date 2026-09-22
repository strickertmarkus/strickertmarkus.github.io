(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (window.__exerciseSessionRuntimeCoreV21Installed) return;
  window.__exerciseSessionRuntimeCoreV21Installed = true;

  var overviewMode = false;
  var sessionToken = null;
  var transitionVisualUntil = 0;
  var customStartKey = '';

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    var index = Number(state.exerciseIndex || 0);
    return index >= 0 && index < state.exercises.length ? state.exercises[index] : null;
  }

  function addStyles() {
    if (document.getElementById('exercise-session-runtime-core-v21-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-session-runtime-core-v21-style';
    style.textContent = `
      /* Runtime core replaces the old focus + persistent-hype render patches.
         Keep the compatibility anchor invisible; no legacy detail UI is painted. */
      #session-modal #hype-set-details { display:none !important; }

      .session-view-toggle {
        min-height:40px;
        padding:9px 13px;
        border-radius:10px;
        border:1px solid rgba(251,146,60,.34);
        background:rgba(251,146,60,.10);
        color:#FDBA74;
        font:800 11px/1 'Inter',sans-serif;
        letter-spacing:.25px;
        cursor:pointer;
        white-space:nowrap;
        transition:background .16s ease,border-color .16s ease,color .16s ease;
      }
      .session-view-toggle:hover {
        background:rgba(251,146,60,.18);
        border-color:rgba(251,146,60,.52);
      }
      #session-modal.session-overview-mode .session-view-toggle {
        background:rgba(34,211,238,.10);
        border-color:rgba(34,211,238,.30);
        color:#67E8F9;
      }

      #session-modal.persistent-hype .session-grid {
        grid-template-columns:minmax(0,1fr) !important;
      }
      #session-modal.persistent-hype .session-grid > .session-card:nth-child(2) {
        display:none !important;
      }
      #session-modal.persistent-hype .session-main {
        width:100% !important;
        min-width:0 !important;
        min-height:calc(100% - 2px);
      }

      #session-modal.session-overview-mode .session-grid {
        display:grid !important;
        grid-template-columns:1.2fr 1fr !important;
      }
      #session-modal.session-overview-mode .session-grid > .session-card:nth-child(2) {
        display:block !important;
      }

      #session-countdown-ring {
        cursor:pointer;
        user-select:none;
        -webkit-tap-highlight-color:transparent;
        touch-action:manipulation;
      }
      #session-countdown-ring:focus-visible {
        outline:2px solid #FDBA74;
        outline-offset:7px;
        border-radius:50%;
      }
      #session-countdown-ring.is-paused .session-countdown-segment.active {
        background:#FDBA74;
        box-shadow:0 0 8px rgba(253,186,116,.68);
      }
      #session-countdown-ring.is-paused .session-countdown-core {
        border-color:rgba(253,186,116,.34);
        background:rgba(35,24,16,.97);
      }
      #session-countdown-ring.is-paused .session-countdown-value {
        color:#FED7AA;
      }
      #session-countdown-pause-hint {
        margin-top:6px;
        color:#78716C;
        font-size:9px;
        line-height:1.2;
        font-weight:700;
        letter-spacing:.55px;
        text-transform:uppercase;
      }
      #session-countdown-ring.is-paused #session-countdown-pause-hint {
        color:#FDBA74;
      }

      @keyframes hypeTunnelRush {
        0% { transform:scale(.48); opacity:.05; }
        38% { opacity:.22; }
        100% { transform:scale(1.55); opacity:0; }
      }

      @media (max-width:600px) {
        .session-view-toggle {
          min-height:38px;
          padding:8px 9px;
          font-size:10px;
        }
        #session-modal.persistent-hype .session-grid {
          display:block !important;
          padding:8px !important;
          overflow-y:auto !important;
        }
        #session-modal.persistent-hype .session-main {
          min-height:calc(100dvh - 76px) !important;
        }
        #session-modal.session-overview-mode .session-grid {
          grid-template-columns:minmax(0,1fr) !important;
          gap:8px !important;
          overflow-y:auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureCompatibilityAnchor() {
    var anchor = document.getElementById('hype-set-details');
    if (anchor) {
      anchor.innerHTML = '';
      anchor.setAttribute('aria-hidden','true');
      return anchor;
    }
    var target = document.getElementById('session-current-target');
    if (!target || !target.parentNode) return null;
    anchor = document.createElement('div');
    anchor.id = 'hype-set-details';
    anchor.className = 'hype-set-details';
    anchor.setAttribute('aria-hidden','true');
    target.insertAdjacentElement('afterend',anchor);
    return anchor;
  }

  function ensureLogSection() {
    var setLog = document.getElementById('session-set-log');
    if (setLog && setLog.parentElement) setLog.parentElement.classList.add('session-log-section');
  }

  function ensureToggleButton() {
    var existing = document.getElementById('session-view-toggle');
    if (existing) return existing;
    var top = document.querySelector('#session-modal .session-top');
    var stop = top && top.querySelector('.session-cta');
    if (!top || !stop) return null;

    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'session-view-toggle';
    button.className = 'session-view-toggle';
    button.addEventListener('click',function () {
      overviewMode = !overviewMode;
      transitionVisualUntil = 0;
      applyViewState();
      try { if (typeof window.renderSessionMode === 'function') window.renderSessionMode(); } catch (_) {}
    });
    stop.insertAdjacentElement('beforebegin',button);
    return button;
  }

  function resetForSession(state) {
    var token = state && state.passStartedAt ? String(state.passStartedAt) : null;
    if (token && token !== sessionToken) {
      sessionToken = token;
      overviewMode = false;
      transitionVisualUntil = 0;
      customStartKey = '';
    } else if (!state) {
      sessionToken = null;
      overviewMode = false;
      transitionVisualUntil = 0;
      customStartKey = '';
    }
  }

  function pretimerVisible() {
    var pre = document.getElementById('session-pre-timer');
    return !!(pre && pre.classList.contains('show'));
  }

  function restVisible() {
    var rest = document.getElementById('session-between-overlay-v2');
    return !!(rest && rest.classList.contains('show'));
  }

  function customWaiting(state) {
    var ex = currentExercise(state);
    return !!(state && state.__betweenCustomRuntimeV3 && ex && ex.__betweenCustomV3 && !state.setRunning && !state.awaitingDecision);
  }

  function markTransitionVisual() {
    transitionVisualUntil = Date.now() + 7000;
    var modal = document.getElementById('session-modal');
    if (!modal || modal.classList.contains('session-overview-mode')) return;
    modal.classList.add('persistent-hype','hype-focus','hype-mode');
  }

  function applyViewState() {
    var modal = document.getElementById('session-modal');
    var state = getState();
    if (!modal) return;

    resetForSession(state);
    var active = !!state;
    var training = active && !overviewMode;
    var running = !!(state && state.setRunning);
    var ex = currentExercise(state);
    var preStarting = pretimerVisible();
    var customStarting = customWaiting(state);

    if (!training || restVisible()) transitionVisualUntil = 0;
    if (running) transitionVisualUntil = 0;

    var starting = training && !restVisible() && (preStarting || customStarting || Date.now() < transitionVisualUntil);
    var timedCardio = !!(training && running && ex && ex.kind === 'cardio' && Number(ex.time) > 0);

    modal.classList.toggle('persistent-hype',training);
    modal.classList.toggle('hype-focus',training);
    modal.classList.toggle('session-overview-mode',active && overviewMode);
    modal.classList.toggle('hype-mode',training && (running || starting));
    modal.classList.toggle('cardio-countdown-active',timedCardio);

    var button = ensureToggleButton();
    if (button) {
      button.style.display = active ? '' : 'none';
      button.textContent = overviewMode ? 'Träningsläge' : 'Översikt';
      button.setAttribute('aria-pressed',overviewMode ? 'true' : 'false');
    }
  }

  function ensurePauseHint() {
    var copy = document.querySelector('#session-countdown-ring .session-countdown-copy');
    if (!copy) return;
    var hint = document.getElementById('session-countdown-pause-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'session-countdown-pause-hint';
      hint.textContent = 'Tryck för att pausa';
      copy.appendChild(hint);
    }
    var ring = document.getElementById('session-countdown-ring');
    if (ring) {
      ring.setAttribute('role','button');
      ring.setAttribute('tabindex','0');
      ring.setAttribute('aria-label','Pausa eller fortsätt konditionstimern');
    }
  }

  function formatTime(seconds) {
    var whole = Math.max(0,Math.ceil(Number(seconds) || 0));
    var min = Math.floor(whole / 60);
    var sec = whole % 60;
    return String(min).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
  }

  function pausedElapsedSeconds(state) {
    if (!state || !state.setStartedAt) return 0;
    var end = state.__hypePaused && state.__hypePausedAt ? state.__hypePausedAt : Date.now();
    return Math.max(0,(end - state.setStartedAt) / 1000);
  }

  function updateSegments(remainingSeconds,totalSeconds) {
    var segments = document.querySelectorAll('#session-countdown-segments .session-countdown-segment');
    if (!segments.length) return;
    var activeCount = totalSeconds > 0
      ? Math.ceil((Math.max(0,Math.min(totalSeconds,remainingSeconds)) / totalSeconds) * 60)
      : 0;
    activeCount = Math.max(0,Math.min(60,activeCount));
    segments.forEach(function (segment,index) {
      var active = index < activeCount;
      segment.classList.toggle('active',active);
      segment.classList.toggle('inactive',!active);
    });
  }

  function renderPauseState() {
    var state = getState();
    var ex = currentExercise(state);
    var ring = document.getElementById('session-countdown-ring');
    if (!ring) return;

    var running = !!(state && state.setRunning);
    var paused = !!(running && state.__hypePaused);
    ring.classList.toggle('is-paused',paused);

    var hint = document.getElementById('session-countdown-pause-hint');
    if (hint) hint.textContent = paused ? 'Pausad · tryck för att fortsätta' : 'Tryck för att pausa';

    var timedCardio = !!(running && ex && ex.kind === 'cardio' && Number(ex.time) > 0 && state.setStartedAt);
    if (!timedCardio) return;

    var totalSeconds = Number(ex.time) * 60;
    var elapsed = pausedElapsedSeconds(state);
    var remaining = Math.max(0,totalSeconds - elapsed);
    var value = document.getElementById('session-countdown-value');
    if (value) value.textContent = formatTime(remaining);
    updateSegments(remaining,totalSeconds);

    if (paused) {
      var setTimer = document.getElementById('session-set-timer');
      if (setTimer) setTimer.textContent = formatTime(elapsed);
    }
  }

  function clearPauseState(state) {
    if (!state) return;
    if (state.__hypePaused && state.__hypePausedAt && state.setStartedAt) {
      state.setStartedAt += Math.max(0,Date.now() - state.__hypePausedAt);
    }
    state.__hypePaused = false;
    state.__hypePausedAt = null;
  }

  function toggleCardioPause() {
    var state = getState();
    var ex = currentExercise(state);
    if (!state || !state.setRunning || !state.setStartedAt || !ex || ex.kind !== 'cardio' || Number(ex.time) <= 0) return;

    if (state.__hypePaused) {
      clearPauseState(state);
    } else {
      state.__hypePaused = true;
      state.__hypePausedAt = Date.now();
    }
    renderPauseState();
  }

  function bindRing() {
    ensurePauseHint();
    var ring = document.getElementById('session-countdown-ring');
    if (!ring || ring.dataset.runtimePauseV21 === 'true') return;
    ring.dataset.runtimePauseV21 = 'true';
    ring.addEventListener('click',toggleCardioPause);
    ring.addEventListener('keydown',function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleCardioPause();
      }
    });
  }

  function maybeStartCustomExercise() {
    var state = getState();
    var ex = currentExercise(state);
    var waiting = !!(state && state.__betweenCustomRuntimeV3 && ex && ex.__betweenCustomV3 && !state.setRunning && !state.awaitingDecision);
    if (!waiting) {
      if (!(state && state.__betweenCustomRuntimeV3)) customStartKey = '';
      return;
    }

    var runtime = state.__betweenCustomRuntimeV3;
    var key = [state.passStartedAt || '',runtime.index || 0,runtime.originalCurrentSet || 1,runtime.transition || '',ex.name || ''].join('|');
    if (key === customStartKey) return;
    customStartKey = key;

    /* A custom between exercise is a real exercise step. Keep it waiting on
       the ordinary Starta set button so the configured pre-timer and the
       active cardio timer are both shown. Only a rest transition may start
       the following set automatically. */
    applyViewState();
  }

  function primeRestSkip(event) {
    var target = event && event.target;
    var overlay = target && target.closest ? target.closest('#session-between-overlay-v2.show') : null;
    if (!overlay) return;
    markTransitionVisual();
  }

  function syncUi() {
    ensureCompatibilityAnchor();
    ensureLogSection();
    ensureToggleButton();
    ensurePauseHint();
    bindRing();
    maybeStartCustomExercise();
    applyViewState();
    renderPauseState();
  }

  function wrapAfter(name,after,before) {
    var fn = window[name];
    if (typeof fn !== 'function' || fn.__runtimeCoreV21Wrapped) return;
    var wrapped = function () {
      if (before) { try { before(); } catch (_) {} }
      var result = fn.apply(this,arguments);
      if (after) { try { after(); } catch (_) {} }
      return result;
    };
    wrapped.__runtimeCoreV21Wrapped = true;
    window[name] = wrapped;
  }

  function install() {
    addStyles();
    ensureCompatibilityAnchor();
    ensureLogSection();
    ensureToggleButton();

    document.addEventListener('pointerdown',primeRestSkip,true);
    document.addEventListener('click',primeRestSkip,true);

    var attempts = 0;
    (function bindWhenReady() {
      attempts += 1;
      if (typeof window.renderSessionMode !== 'function' || typeof window.updateSessionTimers !== 'function') {
        if (attempts < 60) setTimeout(bindWhenReady,75);
        return;
      }

      wrapAfter('renderSessionMode',syncUi);
      wrapAfter('updateSessionTimers',function () { applyViewState(); renderPauseState(); });
      wrapAfter('completeCurrentSet',syncUi,function () { clearPauseState(getState()); });
      wrapAfter('finishCurrentExercise',syncUi,function () { clearPauseState(getState()); });
      wrapAfter('stopSessionMode',function () {
        overviewMode = false;
        sessionToken = null;
        transitionVisualUntil = 0;
        customStartKey = '';
        syncUi();
      },function () { clearPauseState(getState()); });

      syncUi();
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
