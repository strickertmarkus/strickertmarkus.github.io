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

      .hype-set-details {
        display: none;
        grid-template-columns: repeat(3,minmax(0,auto));
        justify-content: center;
        align-items: center;
        gap: 12px;
        margin: 4px 0 2px;
        text-align: center;
      }
      #session-modal.hype-focus .hype-set-details {
        display: grid;
      }
      .hype-set-detail {
        min-width: 108px;
        padding: 12px 16px;
        border-radius: 12px;
        background: rgba(251,146,60,.075);
        border: 1px solid rgba(251,146,60,.22);
      }
      .hype-set-detail-label {
        font-size: 10px;
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: .9px;
        text-transform: uppercase;
        color: #A8A29E;
      }
      .hype-set-detail-value {
        margin-top: 5px;
        font-size: 26px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: -.8px;
        color: #FDBA74;
        font-variant-numeric: tabular-nums;
      }
      #session-modal.hype-focus .session-log-section {
        display: none !important;
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
        .hype-set-details {
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 6px;
          width: 100%;
        }
        .hype-set-detail {
          min-width: 0;
          padding: 10px 5px;
        }
        .hype-set-detail-label {
          font-size: 8px;
          letter-spacing: .55px;
        }
        .hype-set-detail-value {
          font-size: clamp(19px,6vw,26px);
          letter-spacing: -.5px;
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

  function ensureLogSection() {
    var setLog = document.getElementById('session-set-log');
    if (!setLog || !setLog.parentElement) return null;
    setLog.parentElement.classList.add('session-log-section');
    return setLog.parentElement;
  }

  function ensureHypeDetails() {
    var existing = document.getElementById('hype-set-details');
    if (existing) return existing;
    var target = document.getElementById('session-current-target');
    if (!target || !target.parentNode) return null;
    var details = document.createElement('div');
    details.id = 'hype-set-details';
    details.className = 'hype-set-details';
    target.insertAdjacentElement('afterend', details);
    return details;
  }

  function renderHypeDetails() {
    var details = ensureHypeDetails();
    var state = getState();
    var ex = currentExercise();
    if (!details || !state || !state.setRunning || !ex) {
      if (details) details.innerHTML = '';
      return;
    }

    var cells;
    if (ex.kind === 'cardio') {
      cells = [
        { label: 'Runda', value: String(state.currentSet || 1) },
        { label: 'Distans', value: ex.distance ? ex.distance + ' km' : '—' },
        { label: 'Tid', value: ex.time ? ex.time + ' min' : '—' }
      ];
    } else {
      cells = [
        { label: 'Set', value: (state.currentSet || 1) + ' / ' + (ex.plannedSets || 1) },
        { label: 'Reps', value: String(ex.reps || 0) },
        { label: 'Vikt', value: (ex.weight || 0) + ' kg' }
      ];
    }

    details.innerHTML = cells.map(function (cell) {
      return '<div class="hype-set-detail">' +
        '<div class="hype-set-detail-label">' + cell.label + '</div>' +
        '<div class="hype-set-detail-value">' + cell.value + '</div>' +
      '</div>';
    }).join('');
  }

  function rebuildEditableSetLog() {
    var state = getState();
    var setLog = document.getElementById('session-set-log');
    ensureLogSection();
    if (!state || !setLog || state.setRunning || state.exerciseIndex >= state.exercises.length) return;

    /* The timer updates this view repeatedly. Do not rebuild the logged-set DOM
       while the user is editing one of its inputs, otherwise Safari/Chrome loses
       the focused field before the edit can be committed. */
    var active = document.activeElement;
    if (active && setLog.contains(active) && active.hasAttribute('data-log-key')) return;

    var ex = state.exercises[state.exerciseIndex];
    var logs = state.logs && state.logs[state.exerciseIndex] ? state.logs[state.exerciseIndex] : [];
    setLog.innerHTML = '';

    logs.forEach(function (l, idx) {
      var row = document.createElement('div');
      row.className = 'set-log-item';
      if (ex.kind === 'cardio') {
        row.innerHTML = '<div class="set-tag">Runda ' + l.setNo + '</div>' +
          '<input type="number" value="' + (l.actualDistance || 0) + '" min="0" step="0.1" data-log-key="actualDistance">' +
          '<input type="number" value="' + (l.actualTime || 0) + '" min="0" step="1" data-log-key="actualTime">' +
          '<input type="text" value="' + (typeof fmtSec === 'function' ? fmtSec(l.durationSec) : l.durationSec) + '" readonly>';
      } else {
        row.innerHTML = '<div class="set-tag">Set ' + l.setNo + '</div>' +
          '<input type="number" value="' + (l.actualReps || 0) + '" min="0" data-log-key="actualReps">' +
          '<input type="number" value="' + (l.actualWeight || 0) + '" min="0" step=".5" data-log-key="actualWeight">' +
          '<input type="text" value="' + (typeof fmtSec === 'function' ? fmtSec(l.durationSec) : l.durationSec) + '" readonly>';
      }

      row.querySelectorAll('[data-log-key]').forEach(function (input) {
        function commitValue() {
          if (typeof window.updateSetLog === 'function') {
            window.updateSetLog(state.exerciseIndex, idx, input.dataset.logKey, input.value);
          }
        }
        input.addEventListener('input', commitValue);
        input.addEventListener('change', commitValue);
      });
      setLog.appendChild(row);
    });

    if (!logs.length) {
      setLog.innerHTML = '<div style="font-size:12px;color:var(--text-dim)">Inga set loggade ännu.</div>';
    }
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
    ensureLogSection();
    renderHypeDetails();
    if (!running) rebuildEditableSetLog();

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
    ensureLogSection();
    ensureHypeDetails();

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
      ensureLogSection();
      ensureHypeDetails();
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
      rebuildEditableSetLog();
      return result;
    };

    window.finishCurrentExercise = function () {
      clearPauseState(getState());
      var result = previousFinish.apply(this, arguments);
      renderPauseState();
      rebuildEditableSetLog();
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
