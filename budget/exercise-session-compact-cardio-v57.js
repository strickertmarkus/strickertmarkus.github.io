(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseCompactCardioV57Installed) return;
  window.__exerciseCompactCardioV57Installed = true;

  function installStyles() {
    if (document.getElementById('exercise-session-compact-cardio-v57-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-session-compact-cardio-v57-style';
    style.textContent = `
      @media (max-width:600px) {
        /* Keep the original Träningsläge layout. Only remove the old forced
           viewport-height from timed cardio so the action button is allowed
           to fit above Safari's bottom bar. */
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .session-main {
          min-height:0 !important;
          height:auto !important;
        }

        /* Everything outside the countdown keeps its previous styling and
           spacing. The countdown itself is only slightly smaller. */
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown {
          margin:3px auto 5px !important;
          padding:2px 0 4px !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring {
          flex-basis:min(150px,44vw) !important;
          width:min(150px,44vw) !important;
          height:min(150px,44vw) !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-core {
          inset:20px !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-copy {
          width:calc(100% - 48px) !important;
          min-width:0 !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
          width:100% !important;
          min-width:0 !important;
          font-size:30px !important;
          line-height:1 !important;
          letter-spacing:-1px !important;
          white-space:nowrap !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .session-countdown-label {
          margin-top:5px !important;
          font-size:8px !important;
          line-height:1.1 !important;
          letter-spacing:.75px !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-pause-hint {
          margin-top:5px !important;
          font-size:7px !important;
          line-height:1.15 !important;
          letter-spacing:.45px !important;
        }
      }

      @media (max-width:600px) and (max-height:760px) {
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring {
          flex-basis:min(140px,41vw) !important;
          width:min(140px,41vw) !important;
          height:min(140px,41vw) !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-core {
          inset:19px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
          font-size:28px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installStyles, {once:true});
  else installStyles();
})();
