(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function getSessionState() {
    try {
      return typeof sessionState !== 'undefined' ? sessionState : null;
    } catch (e) {
      return null;
    }
  }

  function currentExercise() {
    var state = getSessionState();
    if (!state || !state.exercises || state.exerciseIndex >= state.exercises.length) return null;
    return state.exercises[state.exerciseIndex];
  }

  function addStyles() {
    if (document.getElementById('exercise-hype-mode-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-hype-mode-style';
    style.textContent = `
      #session-modal {
        transition: background .28s ease;
      }
      #session-modal .session-shell,
      #session-modal .session-card,
      #session-modal .timer-box,
      #session-modal .session-cta,
      #session-modal .session-table th {
        transition: background .28s ease, border-color .28s ease, color .28s ease, box-shadow .28s ease;
      }

      /* Start-set is a primary workout action even before hype mode begins. */
      #session-controls:not(.decision-row) .session-cta.primary {
        flex: 1 1 100%;
        width: 100%;
        min-height: 58px;
        padding: 15px 22px;
        font-size: 16px;
        font-weight: 900;
        border-radius: 12px;
      }

      #session-modal.hype-mode {
        --accent: #FB923C;
        --accent-dim: rgba(251,146,60,.14);
        --accent-glow: rgba(251,146,60,.32);
        --border-a: rgba(251,146,60,.46);
        background: rgba(21,10,4,.94);
      }
      #session-modal.hype-mode .session-shell {
        background:
          radial-gradient(circle at 50% 5%, rgba(251,146,60,.17), transparent 34%),
          linear-gradient(180deg,#17100c 0%,#1a0f09 48%,#100b09 100%);
      }
      #session-modal.hype-mode .session-top {
        border-bottom-color: rgba(251,146,60,.22);
      }
      #session-modal.hype-mode .session-card {
        background: rgba(251,146,60,.055);
        border-color: rgba(251,146,60,.22);
        box-shadow: 0 0 34px rgba(251,146,60,.035);
      }
      #session-modal.hype-mode .timer-box {
        background: rgba(251,146,60,.10);
        border-color: rgba(251,146,60,.42);
      }
      #session-modal.hype-mode .timer-val,
      #session-modal.hype-mode #session-current-ex,
      #session-modal.hype-mode .session-table th {
        color: #FDBA74;
      }
      #session-modal.hype-mode .session-cta.primary {
        flex: 1 1 100%;
        width: 100%;
        min-height: 58px;
        padding: 15px 22px;
        background: linear-gradient(135deg,#FB923C,#F97316);
        border-color: transparent;
        color: #1d0d03;
        font-size: 16px;
        font-weight: 900;
        box-shadow: 0 8px 26px rgba(249,115,22,.22);
      }
      #session-modal.hype-mode .session-cta.primary:active {
        transform: scale(.985);
      }

      .session-cardio-countdown {
        display: none;
        align-items: center;
        justify-content: center;
        padding: 3px 0 5px;
      }
      .session-cardio-countdown.show {
        display: flex;
      }
      .session-countdown-ring {
        --countdown-progress: 100%;
        width: 168px;
        height: 168px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        position: relative;
        background: conic-gradient(#FB923C var(--countdown-progress), rgba(251,146,60,.12) 0);
        box-shadow: 0 0 34px rgba(251,146,60,.14);
      }
      .session-countdown-ring::after {
        content: '';
        position: absolute;
        inset: 8px;
        border-radius: 50%;
        background: #15100d;
        border: 1px solid rgba(251,146,60,.22);
      }
      .session-countdown-copy {
        position: relative;
        z-index: 1;
        text-align: center;
      }
      .session-countdown-value {
        color: #FDBA74;
        font-size: 38px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: -1.5px;
        font-variant-numeric: tabular-nums;
      }
      .session-countdown-label {
        margin-top: 7px;
        color: #A8A29E;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .9px;
      }

      /* Mobile is a first-class layout for pass mode. */
      @media (max-width: 600px) {
        #session-modal {
          padding: 0 !important;
          align-items: stretch !important;
          justify-content: stretch !important;
        }
        #session-modal .session-shell {
          width: 100vw !important;
          min-width: 0 !important;
          height: 100dvh !important;
          min-height: 100dvh !important;
          overflow: hidden !important;
        }
        #session-modal .session-top {
          padding: 10px 12px !important;
          gap: 8px;
          flex-shrink: 0;
        }
        #session-modal .session-title {
          font-size: 16px !important;
        }
        #session-modal #session-subtitle {
          font-size: 11px !important;
          line-height: 1.25;
        }
        #session-modal .session-top > .session-cta {
          padding: 8px 10px !important;
          font-size: 11px !important;
          min-height: 38px;
          white-space: nowrap;
        }
        #session-modal .session-grid {
          display: grid !important;
          grid-template-columns: minmax(0,1fr) !important;
          gap: 8px !important;
          padding: 8px !important;
          height: auto !important;
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch;
        }
        #session-modal .session-card {
          width: 100% !important;
          min-width: 0 !important;
          padding: 10px !important;
          border-radius: 12px !important;
        }
        #session-modal .session-main {
          gap: 10px !important;
        }
        #session-modal .session-timers {
          grid-template-columns: minmax(0,1fr) minmax(0,1fr) !important;
          gap: 7px !important;
        }
        #session-modal .timer-box {
          min-width: 0;
          padding: 8px !important;
        }
        #session-modal .timer-lbl {
          font-size: 9px !important;
          letter-spacing: .55px !important;
        }
        #session-modal .timer-val {
          font-size: 24px !important;
        }
        #session-modal #session-current-ex {
          font-size: 18px !important;
          overflow-wrap: anywhere;
        }
        #session-modal .session-nextset {
          font-size: 12px !important;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        #session-controls {
          width: 100%;
        }
        #session-controls:not(.decision-row) .session-cta.primary,
        #session-modal.hype-mode #session-controls .session-cta.primary {
          width: 100% !important;
          min-height: 66px !important;
          padding: 16px 14px !important;
          font-size: 17px !important;
          border-radius: 13px !important;
        }
        #session-modal .session-cta-row.decision-row {
          grid-template-columns: 1fr !important;
          gap: 7px !important;
        }
        #session-modal .session-cta-row.decision-row .session-cta {
          min-height: 48px;
          font-size: 13px !important;
        }
        .session-countdown-ring {
          width: min(148px, 43vw);
          height: min(148px, 43vw);
        }
        .session-countdown-value {
          font-size: 34px;
        }
        #session-modal .set-log-item {
          grid-template-columns: 58px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) !important;
          gap: 5px !important;
          min-width: 0;
        }
        #session-modal .set-log-item input {
          min-width: 0;
          padding: 7px 5px !important;
          font-size: 11px !important;
        }
        #session-modal .set-log-item .set-tag {
          font-size: 10px !important;
        }
        #session-modal .session-table {
          table-layout: fixed;
          width: 100%;
          font-size: 10px !important;
        }
        #session-modal .session-table th,
        #session-modal .session-table td {
          padding: 6px 4px !important;
          overflow-wrap: anywhere;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureCountdown() {
    var existing = document.getElementById('session-cardio-countdown');
    if (existing) return existing;
    var target = document.getElementById('session-current-target');
    if (!target || !target.parentNode) return null;
    var wrap = document.createElement('div');
    wrap.id = 'session-cardio-countdown';
    wrap.className = 'session-cardio-countdown';
    wrap.innerHTML = '<div class="session-countdown-ring" id="session-countdown-ring">' +
      '<div class="session-countdown-copy">' +
        '<div class="session-countdown-value" id="session-countdown-value">00:00</div>' +
        '<div class="session-countdown-label">Tid kvar</div>' +
      '</div>' +
    '</div>';
    target.insertAdjacentElement('afterend', wrap);
    return wrap;
  }

  function formatRemaining(totalSeconds) {
    var seconds = Math.max(0, Math.ceil(totalSeconds));
    var minutes = Math.floor(seconds / 60);
    var rest = seconds % 60;
    return String(minutes).padStart(2, '0') + ':' + String(rest).padStart(2, '0');
  }

  function syncHypeState() {
    var modal = document.getElementById('session-modal');
    if (!modal) return;
    var state = getSessionState();
    var running = !!(state && state.setRunning);
    modal.classList.toggle('hype-mode', running);

    var wrap = ensureCountdown();
    if (!wrap) return;
    var ex = currentExercise();
    var isTimedCardio = !!(running && ex && ex.kind === 'cardio' && Number(ex.time) > 0 && state.setStartedAt);
    wrap.classList.toggle('show', isTimedCardio);
    if (!isTimedCardio) return;

    var totalSeconds = Number(ex.time) * 60;
    var elapsedSeconds = Math.max(0, (Date.now() - state.setStartedAt) / 1000);
    var remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
    var progress = totalSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100)) : 0;
    var value = document.getElementById('session-countdown-value');
    var ring = document.getElementById('session-countdown-ring');
    if (value) value.textContent = formatRemaining(remainingSeconds);
    if (ring) ring.style.setProperty('--countdown-progress', progress.toFixed(2) + '%');
  }

  function installEnhancements() {
    addStyles();
    ensureCountdown();

    if (typeof window.startCurrentSet !== 'function' || typeof window.renderSessionMode !== 'function') return;
    if (window.__exerciseHypeEnhancementsInstalled) return;
    window.__exerciseHypeEnhancementsInstalled = true;

    var originalRenderSessionMode = window.renderSessionMode;
    var originalUpdateSessionTimers = window.updateSessionTimers;
    var originalStartCurrentSet = window.startCurrentSet;
    var originalCompleteCurrentSet = window.completeCurrentSet;
    var originalStartNextSet = window.startNextSet;
    var originalAddExtraSet = window.addExtraSet;
    var originalFinishCurrentExercise = window.finishCurrentExercise;
    var originalStopSessionMode = window.stopSessionMode;

    window.renderSessionMode = function () {
      var result = originalRenderSessionMode.apply(this, arguments);
      syncHypeState();
      return result;
    };

    window.updateSessionTimers = function () {
      var result = originalUpdateSessionTimers.apply(this, arguments);
      syncHypeState();
      return result;
    };

    window.startCurrentSet = function () {
      var result = originalStartCurrentSet.apply(this, arguments);
      syncHypeState();
      return result;
    };

    window.completeCurrentSet = function () {
      var result = originalCompleteCurrentSet.apply(this, arguments);
      syncHypeState();
      return result;
    };

    // One tap now moves to the next planned set AND starts it immediately.
    window.startNextSet = function () {
      var result = originalStartNextSet.apply(this, arguments);
      var state = getSessionState();
      if (state && !state.setRunning && !state.awaitingDecision && state.exerciseIndex < state.exercises.length) {
        originalStartCurrentSet.call(this);
      }
      syncHypeState();
      return result;
    };

    window.addExtraSet = function () {
      var result = originalAddExtraSet.apply(this, arguments);
      syncHypeState();
      return result;
    };

    window.finishCurrentExercise = function () {
      var result = originalFinishCurrentExercise.apply(this, arguments);
      syncHypeState();
      return result;
    };

    window.stopSessionMode = function () {
      var result = originalStopSessionMode.apply(this, arguments);
      syncHypeState();
      return result;
    };

    syncHypeState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installEnhancements, { once: true });
  } else {
    installEnhancements();
  }
})();
