(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function getState() {
    try {
      return typeof sessionState !== 'undefined' ? sessionState : null;
    } catch (e) {
      return null;
    }
  }

  function currentExercise() {
    var state = getState();
    if (!state || !state.exercises || state.exerciseIndex >= state.exercises.length) return null;
    return state.exercises[state.exerciseIndex];
  }

  function addStyles() {
    if (document.getElementById('exercise-session-focus-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-session-focus-style';
    style.textContent = `
      #session-modal.hype-focus .session-grid {
        grid-template-columns: minmax(0,1fr) !important;
      }
      #session-modal.hype-focus .session-grid > .session-card:nth-child(2) {
        display: none !important;
      }
      #session-modal.hype-focus .session-main {
        width: 100% !important;
        min-width: 0 !important;
        min-height: calc(100% - 2px);
      }

      #session-modal .session-cta-row.decision-row {
        display: grid !important;
        grid-template-columns: repeat(2,minmax(0,1fr)) !important;
        gap: 8px !important;
      }
      #session-modal .session-cta-row.decision-row .session-cta.primary:first-child {
        grid-column: 1 / -1 !important;
      }
      #session-modal .session-cta-row.decision-row .session-cta.warn,
      #session-modal .session-cta-row.decision-row .session-cta.success {
        grid-column: auto !important;
      }

      #session-modal.hype-mode .session-shell {
        position: relative;
        overflow: hidden;
      }
      #session-modal.hype-mode .session-shell::before,
      #session-modal.hype-mode .session-shell::after {
        content: '';
        position: absolute;
        inset: -28%;
        pointer-events: none;
        z-index: 0;
        opacity: .22;
        background:
          repeating-conic-gradient(
            from 0deg at 50% 52%,
            transparent 0deg 7deg,
            rgba(251,146,60,.18) 7.15deg 7.55deg,
            transparent 7.7deg 14deg
          );
        -webkit-mask-image: radial-gradient(circle at 50% 52%, transparent 0 17%, rgba(0,0,0,.2) 23%, #000 38%, rgba(0,0,0,.9) 58%, transparent 78%);
        mask-image: radial-gradient(circle at 50% 52%, transparent 0 17%, rgba(0,0,0,.2) 23%, #000 38%, rgba(0,0,0,.9) 58%, transparent 78%);
        animation: hypeTunnelRush 1.35s linear infinite;
        transform-origin: 50% 52%;
      }
      #session-modal.hype-mode .session-shell::after {
        opacity: .12;
        animation-duration: 2.1s;
        animation-delay: -.8s;
        filter: blur(.4px);
      }
      #session-modal.hype-mode .session-shell > * {
        position: relative;
        z-index: 1;
      }
      @keyframes hypeTunnelRush {
        0% { transform: scale(.48); opacity: .05; }
        38% { opacity: .22; }
        100% { transform: scale(1.55); opacity: 0; }
      }

      #session-countdown-ring {
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      #session-countdown-ring:focus-visible {
        outline: 2px solid #FDBA74;
        outline-offset: 7px;
        border-radius: 50%;
      }
      #session-countdown-ring.is-paused .session-countdown-segment.active {
        background: #FDBA74;
        box-shadow: 0 0 8px rgba(253,186,116,.68);
      }
      #session-countdown-ring.is-paused .session-countdown-core {
        border-color: rgba(253,186,116,.34);
        background: rgba(35,24,16,.97);
      }
      #session-countdown-ring.is-paused .session-countdown-value {
        color: #FED7AA;
      }
      #session-countdown-pause-hint {
        margin-top: 6px;
        color: #78716C;
        font-size: 9px;
        line-height: 1.2;
        font-weight: 700;
        letter-spacing: .55px;
        text-transform: uppercase;
      }
      #session-countdown-ring.is-paused #session-countdown-pause-hint {
        color: #FDBA74;
      }

      @media (max-width: 600px) {
        #session-modal.hype-focus .session-grid {
          display: block !important;
          padding: 8px !important;
          overflow-y: auto !important;
        }
        #session-modal.hype-focus .session-main {
          min-height: calc(100dvh - 76px) !important;
        }
        #session-modal .session-cta-row.decision-row {
          grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          gap: 7px !important;
        }
        #session-modal .session-cta-row.decision-row .session-cta.warn,
        #session-modal .session-cta-row.decision-row .session-cta.success {
          min-height: 48px !important;
          padding: 10px 6px !important;
          white-space: normal !important;
        }
        #session-modal.hype-mode .session-shell::before,
        #session-modal.hype-mode .session-shell::after {
          inset: -40%;
          opacity: .17;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #session-modal.hype-mode .session-shell::before,
        #session-modal.hype-mode .session-shell::after {
          animation: none !important;
          opacity: .06;
          transform: scale(1.15);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePauseHint() {
    var copy = document.querySelector('#session-countdown-ring .session-countdown-copy');
    if (!copy) return;
    if (!document.getElementById('session-countdown-pause-hint')) {
      var hint = document.createElement('div');
      hint.id = 'session-countdown-pause-hint';
      hint.textContent = 'Tryck för att pausa';
      copy.appendChild(hint);
    }
    var ring = document.getElementById('session-countdown-ring');
    if (ring) {
      ring.setAttribute('role', 'button');
      ring.setAttribute('tabindex', '0');
      ring.setAttribute('aria-label', 'Pausa eller fortsätt konditionstimern');
    }
  }

  function formatRemaining(seconds) {
    var whole = Math.max(0, Math.ceil(seconds));
    var min = Math.floor(whole / 60);
    var sec = whole % 60;
    return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }

  function updateSegments(remainingSeconds, totalSeconds) {
    var segments = document.querySelectorAll('#session-countdown-segments .session-countdown-segment');
    if (!segments.length) return;
    var activeCount = totalSeconds > 0 ? Math.ceil((Math.max(0, Math.min(totalSeconds, remainingSeconds)) / totalSeconds) * 60) : 0;
    activeCount = Math.max(0, Math.min(60, activeCount));
    segments.forEach(function (segment, index) {
      var active = index < activeCount;
      segment.classList.toggle('active', active);
      segment.classList.toggle('inactive', !active);
    });
  }

  function pausedElapsedSeconds(state) {
    if (!state || !state.setStartedAt) return 0;
    if (state.__hypePaused && state.__hypePausedAt) {
      return Math.max(0, (state.__hypePausedAt - state.setStartedAt) / 1000);
    }
    return Math.max(0, (Date.now() - state.setStartedAt) / 1000);
  }

  function renderPauseState() {
    var state = getState();
    var ex = currentExercise();
    var modal = document.getElementById('session-modal');
    if (!modal) return;

    var running = !!(state && state.setRunning);
    modal.classList.toggle('hype-focus', running);

    var ring = document.getElementById('session-countdown-ring');
    var hint = document.getElementById('session-countdown-pause-hint');
    if (!ring) return;

    var paused = !!(running && state && state.__hypePaused);
    ring.classList.toggle('is-paused', paused);
    if (hint) hint.textContent = paused ? 'Pausad · tryck för att fortsätta' : 'Tryck för att pausa';

    var timedCardio = !!(running && ex && ex.kind === 'cardio' && Number(ex.time) > 0 && state.setStartedAt);
    if (!timedCardio) return;

    var totalSeconds = Number(ex.time) * 60;
    var elapsed = pausedElapsedSeconds(state);
    var remaining = Math.max(0, totalSeconds - elapsed);
    var value = document.getElementById('session-countdown-value');
    if (value) value.textContent = formatRemaining(remaining);
    updateSegments(remaining, totalSeconds);

    var setTimer = document.getElementById('session-set-timer');
    if (setTimer && paused) setTimer.textContent = formatRemaining(elapsed).replace(/^00:/, '00:');
  }

  function toggleCardioPause() {
    var state = getState();
    var ex = currentExercise();
    if (!state || !state.setRunning || !state.setStartedAt || !ex || ex.kind !== 'cardio' || Number(ex.time) <= 0) return;

    if (state.__hypePaused) {
      var pauseDuration = Math.max(0, Date.now() - state.__hypePausedAt);
      state.setStartedAt += pauseDuration;
      state.__hypePaused = false;
      state.__hypePausedAt = null;
    } else {
      state.__hypePaused = true;
      state.__hypePausedAt = Date.now();
    }
    renderPauseState();
  }

  function bindRing() {
    ensurePauseHint();
    var ring = document.getElementById('session-countdown-ring');
    if (!ring || ring.dataset.pauseBound === 'true') return;
    ring.dataset.pauseBound = 'true';
    ring.addEventListener('click', toggleCardioPause);
    ring.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleCardioPause();
      }
    });
  }

  function clearPauseState(state) {
    if (!state) return;
    if (state.__hypePaused && state.__hypePausedAt && state.setStartedAt) {
      state.setStartedAt += Math.max(0, Date.now() - state.__hypePausedAt);
    }
    state.__hypePaused = false;
    state.__hypePausedAt = null;
  }

  function install() {
    addStyles();
    ensurePauseHint();
    bindRing();

    if (window.__exerciseSessionFocusInstalled) return;
    if (typeof window.renderSessionMode !== 'function' || typeof window.updateSessionTimers !== 'function') return;
    window.__exerciseSessionFocusInstalled = true;

    var previousRender = window.renderSessionMode;
    var previousTick = window.updateSessionTimers;
    var previousComplete = window.completeCurrentSet;
    var previousFinish = window.finishCurrentExercise;
    var previousStop = window.stopSessionMode;

    window.renderSessionMode = function () {
      var result = previousRender.apply(this, arguments);
      ensurePauseHint();
      bindRing();
      renderPauseState();
      return result;
    };

    window.updateSessionTimers = function () {
      var result = previousTick.apply(this, arguments);
      renderPauseState();
      return result;
    };

    window.completeCurrentSet = function () {
      clearPauseState(getState());
      var result = previousComplete.apply(this, arguments);
      renderPauseState();
      return result;
    };

    window.finishCurrentExercise = function () {
      clearPauseState(getState());
      var result = previousFinish.apply(this, arguments);
      renderPauseState();
      return result;
    };

    window.stopSessionMode = function () {
      clearPauseState(getState());
      var result = previousStop.apply(this, arguments);
      renderPauseState();
      return result;
    };

    renderPauseState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
