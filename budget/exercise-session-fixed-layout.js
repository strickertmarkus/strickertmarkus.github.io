(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function addStyles() {
    if (document.getElementById('exercise-session-fixed-layout-style')) return;

    var style = document.createElement('style');
    style.id = 'exercise-session-fixed-layout-style';
    style.textContent = `
      /* Fixed Hype layout: content may vary, controls and progress do not. */
      #session-modal.persistent-hype:not(.session-overview-mode) .session-main {
        position: relative !important;
        box-sizing: border-box !important;
        padding-bottom: 190px !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) #session-controls {
        position: absolute !important;
        left: 18px !important;
        right: 18px !important;
        bottom: 88px !important;
        width: auto !important;
        min-height: 78px !important;
        margin: 0 !important;
        z-index: 8 !important;
        align-content: end !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) #session-controls.session-cta-row.decision-row {
        min-height: 112px !important;
        align-content: end !important;
      }

      /* Previous spacing was useful in flowing layout, but fixed positioning now owns it. */
      #session-modal.persistent-hype:not(.session-overview-mode) .session-cta-row.decision-row .session-cta.primary:first-child {
        margin-top: 0 !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) .hype-workout-progress {
        position: absolute !important;
        left: 50% !important;
        bottom: 12px !important;
        transform: translateX(-50%) !important;
        width: min(820px, calc(100% - 36px)) !important;
        margin: 0 !important;
        z-index: 8 !important;
      }

      /* Keep cardio content in the middle instead of letting it push controls down. */
      #session-modal.persistent-hype:not(.session-overview-mode) .session-cardio-countdown.show {
        height: 150px !important;
        min-height: 150px !important;
        padding: 0 !important;
        overflow: visible !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) .session-countdown-ring {
        flex: 0 0 180px !important;
        width: 180px !important;
        height: 180px !important;
        transform: scale(.82) !important;
        transform-origin: center center !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) #session-stable-details {
        margin-bottom: 4px !important;
      }

      @media (max-width: 600px) {
        #session-modal.persistent-hype:not(.session-overview-mode) .session-main {
          min-height: calc(100dvh - 76px) !important;
          padding-bottom: calc(190px + env(safe-area-inset-bottom, 0px)) !important;
          overflow: hidden !important;
        }

        #session-modal.persistent-hype:not(.session-overview-mode) #session-controls {
          left: 10px !important;
          right: 10px !important;
          bottom: calc(82px + env(safe-area-inset-bottom, 0px)) !important;
          min-height: 72px !important;
        }

        #session-modal.persistent-hype:not(.session-overview-mode) #session-controls.session-cta-row.decision-row {
          min-height: 112px !important;
          grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          gap: 7px !important;
        }

        #session-modal.persistent-hype:not(.session-overview-mode) #session-controls.session-cta-row.decision-row .session-cta.primary:first-child {
          grid-column: 1 / -1 !important;
        }

        #session-modal.persistent-hype:not(.session-overview-mode) #session-controls.session-cta-row.decision-row .session-cta.warn,
        #session-modal.persistent-hype:not(.session-overview-mode) #session-controls.session-cta-row.decision-row .session-cta.success {
          grid-column: auto !important;
        }

        #session-modal.persistent-hype:not(.session-overview-mode) .hype-workout-progress {
          left: 10px !important;
          right: 10px !important;
          bottom: calc(8px + env(safe-area-inset-bottom, 0px)) !important;
          width: auto !important;
          transform: none !important;
        }

        /* Compact progress footer so it occupies a predictable bottom zone. */
        #session-modal.persistent-hype:not(.session-overview-mode) .hype-progress-head {
          margin-bottom: 5px !important;
        }
        #session-modal.persistent-hype:not(.session-overview-mode) .hype-progress-title {
          font-size: 9px !important;
        }
        #session-modal.persistent-hype:not(.session-overview-mode) .hype-progress-percent {
          font-size: 19px !important;
        }
        #session-modal.persistent-hype:not(.session-overview-mode) .hype-progress-track {
          height: 21px !important;
        }
        #session-modal.persistent-hype:not(.session-overview-mode) .hype-progress-meta {
          margin-top: 4px !important;
          min-height: 12px !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 8px !important;
          font-size: 8px !important;
        }
        #session-modal.persistent-hype:not(.session-overview-mode) .hype-progress-legend {
          gap: 8px !important;
        }
        #session-modal.persistent-hype:not(.session-overview-mode) .hype-progress-dot {
          width: 6px !important;
          height: 6px !important;
        }

        #session-modal.persistent-hype:not(.session-overview-mode) .session-cardio-countdown.show {
          height: 132px !important;
          min-height: 132px !important;
          margin-top: -4px !important;
        }
        #session-modal.persistent-hype:not(.session-overview-mode) .session-countdown-ring {
          transform: scale(.72) !important;
        }

        /* Keep the variable content above the fixed control/footer zones. */
        #session-modal.persistent-hype:not(.session-overview-mode) #session-current-ex,
        #session-modal.persistent-hype:not(.session-overview-mode) #session-current-target,
        #session-modal.persistent-hype:not(.session-overview-mode) #session-stable-details,
        #session-modal.persistent-hype:not(.session-overview-mode) .session-timers,
        #session-modal.persistent-hype:not(.session-overview-mode) .session-cardio-countdown {
          flex-shrink: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function markLayoutState() {
    var modal = document.getElementById('session-modal');
    if (!modal) return;
    var state = null;
    try { state = typeof sessionState !== 'undefined' ? sessionState : null; } catch (e) {}
    modal.classList.toggle('fixed-hype-layout', !!(state && modal.classList.contains('persistent-hype') && !modal.classList.contains('session-overview-mode')));
  }

  function install() {
    addStyles();
    markLayoutState();

    var attempts = 0;
    function bind() {
      attempts++;
      if (typeof window.renderSessionMode !== 'function') {
        if (attempts < 50) setTimeout(bind, 100);
        return;
      }
      if (window.__exerciseFixedLayoutInstalled) return;
      window.__exerciseFixedLayoutInstalled = true;

      var previousRender = window.renderSessionMode;
      window.renderSessionMode = function () {
        var result = previousRender.apply(this, arguments);
        markLayoutState();
        return result;
      };

      markLayoutState();
    }
    bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once:true });
  } else {
    install();
  }
})();
