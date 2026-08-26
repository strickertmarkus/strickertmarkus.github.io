(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function addStyles() {
    if (document.getElementById('exercise-session-theme-stability-style')) return;

    var style = document.createElement('style');
    style.id = 'exercise-session-theme-stability-style';
    style.textContent = `
      /* The focused session layout can remain persistent, but the orange visual
         Hype theme is now intentionally tied only to an actively running set. */
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) {
        --accent: #22D3EE !important;
        --accent-dim: rgba(34,211,238,.12) !important;
        --accent-glow: rgba(34,211,238,.24) !important;
        --border-a: rgba(34,211,238,.30) !important;
      }

      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-shell {
        background: linear-gradient(180deg,#0b1220 0%,#0c1626 52%,#09111d 100%) !important;
      }

      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-top {
        border-bottom-color: rgba(34,211,238,.16) !important;
      }

      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-card {
        background: rgba(34,211,238,.035) !important;
        border-color: rgba(34,211,238,.14) !important;
        box-shadow: none !important;
      }

      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .timer-box {
        background: rgba(34,211,238,.07) !important;
        border-color: rgba(34,211,238,.22) !important;
      }

      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .timer-val,
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) #session-current-ex,
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-table th {
        color: #67E8F9 !important;
      }

      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-cta.primary {
        background: linear-gradient(135deg,#22D3EE,#0891B2) !important;
        border-color: transparent !important;
        color: #04151a !important;
        box-shadow: 0 8px 24px rgba(8,145,178,.18) !important;
      }

      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-cta.warn,
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-cta.success {
        background: rgba(34,211,238,.055) !important;
        border-color: rgba(34,211,238,.19) !important;
        color: #A5F3FC !important;
      }

      /* No speed-line pseudo-elements between sets. */
      #session-modal.persistent-hype:not(.hype-mode) .session-shell::before,
      #session-modal.persistent-hype:not(.hype-mode) .session-shell::after {
        content: none !important;
        animation: none !important;
      }

      /* Active set: keep the orange theme completely stable. */
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) {
        --accent: #FB923C !important;
        --accent-dim: rgba(251,146,60,.14) !important;
        --accent-glow: rgba(251,146,60,.32) !important;
        --border-a: rgba(251,146,60,.46) !important;
        background: rgba(21,10,4,.94) !important;
      }

      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell {
        background:
          radial-gradient(circle at 50% 5%, rgba(251,146,60,.17), transparent 34%),
          linear-gradient(180deg,#17100c 0%,#1a0f09 48%,#100b09 100%) !important;
      }

      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-card {
        background: rgba(251,146,60,.055) !important;
        border-color: rgba(251,146,60,.22) !important;
      }

      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .timer-box {
        background: rgba(251,146,60,.10) !important;
        border-color: rgba(251,146,60,.42) !important;
      }

      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .timer-val,
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) #session-current-ex {
        color: #FDBA74 !important;
      }

      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-cta.primary {
        background: linear-gradient(135deg,#FB923C,#F97316) !important;
        color: #1d0d03 !important;
        box-shadow: 0 8px 26px rgba(249,115,22,.22) !important;
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

    if (modal.classList.contains('persistent-hype') && !overview) {
      modal.classList.toggle('hype-mode', running);
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
