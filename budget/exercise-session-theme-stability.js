(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function addStyles() {
    if (document.getElementById('exercise-session-theme-stability-style')) return;

    var style = document.createElement('style');
    style.id = 'exercise-session-theme-stability-style';
    style.textContent = `
      /* Keep the week picker and Denna vecka button on one row everywhere. */
      .week-pick {
        flex-direction: row !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        gap: 8px !important;
        min-width: 0;
      }
      .week-pick input[type="date"] {
        flex: 1 1 auto !important;
        width: auto !important;
        min-width: 0 !important;
      }
      .week-pick .btn-sm,
      .week-pick button {
        flex: 0 0 auto !important;
        white-space: nowrap !important;
      }

      /* Persistent session stays orange at all times while Hype view is active. */
      #session-modal.persistent-hype:not(.session-overview-mode) {
        --accent: #FB923C !important;
        --accent-dim: rgba(251,146,60,.14) !important;
        --accent-glow: rgba(251,146,60,.32) !important;
        --border-a: rgba(251,146,60,.46) !important;
        background: rgba(21,10,4,.94) !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) .session-shell {
        background:
          radial-gradient(circle at 50% 5%, rgba(251,146,60,.17), transparent 34%),
          linear-gradient(180deg,#17100c 0%,#1a0f09 48%,#100b09 100%) !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) .session-top {
        border-bottom-color: rgba(251,146,60,.22) !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) .session-card {
        background: rgba(251,146,60,.055) !important;
        border-color: rgba(251,146,60,.22) !important;
        box-shadow: 0 0 34px rgba(251,146,60,.035) !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) .timer-box {
        background: rgba(251,146,60,.10) !important;
        border-color: rgba(251,146,60,.42) !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) .timer-val,
      #session-modal.persistent-hype:not(.session-overview-mode) #session-current-ex,
      #session-modal.persistent-hype:not(.session-overview-mode) .session-table th {
        color: #FDBA74 !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) .session-cta.primary {
        background: linear-gradient(135deg,#FB923C,#F97316) !important;
        border-color: transparent !important;
        color: #1d0d03 !important;
        box-shadow: 0 8px 26px rgba(249,115,22,.22) !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) .session-cta.warn {
        border-color: rgba(245,158,11,.42) !important;
        background: rgba(245,158,11,.14) !important;
        color: #FCD34D !important;
      }
      #session-modal.persistent-hype:not(.session-overview-mode) .session-cta.success {
        border-color: rgba(52,211,153,.34) !important;
        background: rgba(52,211,153,.10) !important;
        color: #6EE7B7 !important;
      }
      #session-modal.persistent-hype:not(.session-overview-mode) .session-cta.warn:active,
      #session-modal.persistent-hype:not(.session-overview-mode) .session-cta.success:active {
        transform: scale(.985);
      }

      /* Flowing layout restored. Only add breathing room under the cardio countdown. */
      #session-modal.persistent-hype.cardio-countdown-active:not(.session-overview-mode) #session-controls {
        margin-top: 18px !important;
      }

      /* Keep the next-set decision comfortably separated in normal flow. */
      #session-modal.persistent-hype:not(.session-overview-mode) .session-cta-row.decision-row .session-cta.primary:first-child {
        margin-top: 18px !important;
      }

      /* Between sets: keep orange colors, but remove only the tunnel/speed-line layer. */
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-shell::before,
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-shell::after {
        content: none !important;
        animation: none !important;
      }

      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell {
        position: relative;
        overflow: hidden;
      }
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell::before,
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell::after {
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
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell::after {
        opacity: .12;
        animation-duration: 2.1s;
        animation-delay: -.8s;
        filter: blur(.4px);
      }
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell > * {
        position: relative;
        z-index: 1;
      }

      @media (max-width: 600px) {
        .week-pick {
          width: 100%;
          gap: 7px !important;
        }
        .week-pick input[type="date"] {
          font-size: 11px !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
        }
        .week-pick .btn-sm,
        .week-pick button {
          padding-left: 10px !important;
          padding-right: 10px !important;
        }
        #session-modal.persistent-hype.cardio-countdown-active:not(.session-overview-mode) #session-controls {
          margin-top: 22px !important;
        }
        #session-modal.persistent-hype:not(.session-overview-mode) .session-cta-row.decision-row .session-cta.primary:first-child {
          margin-top: 16px !important;
        }
        #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell::before,
        #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell::after {
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

  function syncThemeState() {
    var modal = document.getElementById('session-modal');
    if (!modal) return;

    var state = null;
    try {
      state = typeof sessionState !== 'undefined' ? sessionState : null;
    } catch (e) {}

    var overview = modal.classList.contains('session-overview-mode');
    var running = !!(state && state.setRunning);
    var ex = state && Array.isArray(state.exercises) && state.exerciseIndex < state.exercises.length
      ? state.exercises[state.exerciseIndex]
      : null;
    var timedCardio = !!(running && ex && ex.kind === 'cardio' && Number(ex.time) > 0);

    if (modal.classList.contains('persistent-hype') && !overview) {
      modal.classList.toggle('hype-mode', running);
      modal.classList.toggle('cardio-countdown-active', timedCardio);
    } else {
      modal.classList.remove('cardio-countdown-active');
    }
  }

  function install() {
    addStyles();
    syncThemeState();

    var attempts = 0;
    function bindWhenReady() {
      attempts++;
      if (typeof window.renderSessionMode !== 'function' || typeof window.updateSessionTimers !== 'function') {
        if (attempts < 50) setTimeout(bindWhenReady, 100);
        return;
      }
      if (window.__exerciseThemeStateInstalled) return;
      window.__exerciseThemeStateInstalled = true;

      var previousRender = window.renderSessionMode;
      var previousTick = window.updateSessionTimers;

      window.renderSessionMode = function () {
        var result = previousRender.apply(this, arguments);
        syncThemeState();
        return result;
      };

      window.updateSessionTimers = function () {
        var result = previousTick.apply(this, arguments);
        syncThemeState();
        return result;
      };

      syncThemeState();
    }

    bindWhenReady();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
