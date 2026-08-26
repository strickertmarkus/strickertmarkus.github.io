(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function addStyles() {
    if (document.getElementById('exercise-session-theme-stability-style')) return;

    var style = document.createElement('style');
    style.id = 'exercise-session-theme-stability-style';
    style.textContent = `
      /* Persistent Hype owns the visual theme for the whole workout session.
         This prevents older setRunning-based layers from flashing blue between sets. */
      #session-modal.persistent-hype {
        --accent: #FB923C !important;
        --accent-dim: rgba(251,146,60,.14) !important;
        --accent-glow: rgba(251,146,60,.32) !important;
        --border-a: rgba(251,146,60,.46) !important;
        background: rgba(21,10,4,.94) !important;
      }

      #session-modal.persistent-hype .session-shell {
        background:
          radial-gradient(circle at 50% 5%, rgba(251,146,60,.17), transparent 34%),
          linear-gradient(180deg,#17100c 0%,#1a0f09 48%,#100b09 100%) !important;
      }

      #session-modal.persistent-hype .session-top {
        border-bottom-color: rgba(251,146,60,.22) !important;
      }

      #session-modal.persistent-hype .session-card {
        background: rgba(251,146,60,.055) !important;
        border-color: rgba(251,146,60,.22) !important;
        box-shadow: 0 0 34px rgba(251,146,60,.035) !important;
      }

      #session-modal.persistent-hype .timer-box {
        background: rgba(251,146,60,.10) !important;
        border-color: rgba(251,146,60,.42) !important;
      }

      #session-modal.persistent-hype .timer-val,
      #session-modal.persistent-hype #session-current-ex,
      #session-modal.persistent-hype .session-table th {
        color: #FDBA74 !important;
      }

      #session-modal.persistent-hype .session-cta.primary {
        background: linear-gradient(135deg,#FB923C,#F97316) !important;
        border-color: transparent !important;
        color: #1d0d03 !important;
        box-shadow: 0 8px 26px rgba(249,115,22,.22) !important;
      }

      #session-modal.persistent-hype .session-cta.primary:active {
        transform: scale(.985);
      }

      /* Keep decision controls visually integrated with the orange session theme. */
      #session-modal.persistent-hype .session-cta.warn,
      #session-modal.persistent-hype .session-cta.success {
        border-color: rgba(251,146,60,.28) !important;
        background: rgba(251,146,60,.085) !important;
        color: #FDBA74 !important;
      }

      #session-modal.persistent-hype .session-cta.warn:hover,
      #session-modal.persistent-hype .session-cta.success:hover {
        background: rgba(251,146,60,.15) !important;
        border-color: rgba(251,146,60,.42) !important;
      }

      /* The tunnel animation should also remain present between sets. */
      #session-modal.persistent-hype .session-shell {
        position: relative;
        overflow: hidden;
      }
      #session-modal.persistent-hype .session-shell::before,
      #session-modal.persistent-hype .session-shell::after {
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
      #session-modal.persistent-hype .session-shell::after {
        opacity: .12;
        animation-duration: 2.1s;
        animation-delay: -.8s;
        filter: blur(.4px);
      }
      #session-modal.persistent-hype .session-shell > * {
        position: relative;
        z-index: 1;
      }

      /* Overview is intentionally allowed to return to the original blue theme. */
      #session-modal.session-overview-mode {
        --accent: #22D3EE;
      }

      @media (max-width: 600px) {
        #session-modal.persistent-hype .session-shell::before,
        #session-modal.persistent-hype .session-shell::after {
          inset: -40%;
          opacity: .17;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #session-modal.persistent-hype .session-shell::before,
        #session-modal.persistent-hype .session-shell::after {
          animation: none !important;
          opacity: .06;
          transform: scale(1.15);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function enforcePersistentTheme() {
    var modal = document.getElementById('session-modal');
    if (!modal) return;
    if (modal.classList.contains('persistent-hype') && !modal.classList.contains('session-overview-mode')) {
      modal.classList.add('hype-mode');
      modal.classList.add('hype-focus');
    }
  }

  function install() {
    addStyles();
    enforcePersistentTheme();

    var modal = document.getElementById('session-modal');
    if (modal && !window.__exerciseThemeStabilityObserver) {
      window.__exerciseThemeStabilityObserver = new MutationObserver(function () {
        enforcePersistentTheme();
      });
      window.__exerciseThemeStabilityObserver.observe(modal, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
