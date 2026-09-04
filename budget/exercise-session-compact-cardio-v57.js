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
        /* Timed cardio must fit as one complete action screen. The old mobile
           min-height counted almost a full viewport again below the session
           header and pushed Klar med set below Safari's bottom bar. */
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .session-main {
          min-height:0 !important;
          height:auto !important;
          gap:6px !important;
          padding:9px !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .session-grid {
          padding:5px !important;
          overflow-y:auto !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .session-timers {
          gap:6px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .session-timers .timer-box {
          min-height:55px !important;
          padding:6px 5px !important;
          border-radius:9px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .session-timers .timer-lbl {
          font-size:8px !important;
          letter-spacing:.65px !important;
          line-height:1.05 !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .session-timers .timer-val {
          margin-top:2px !important;
          font-size:clamp(21px,6.3vw,25px) !important;
          line-height:1 !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .session-ex-heading-row {
          gap:4px 7px !important;
          margin-top:1px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-current-ex {
          min-height:24px !important;
          font-size:clamp(21px,6.2vw,25px) !important;
          line-height:1.05 !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-current-target {
          min-height:0 !important;
          margin-top:0 !important;
          font-size:12px !important;
          line-height:1.25 !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-stable-details {
          gap:6px !important;
          margin:3px 0 1px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-stable-details .stable-detail-label {
          font-size:7px !important;
          letter-spacing:.48px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-stable-details .stable-detail-value {
          margin-top:2px !important;
          font-size:clamp(20px,6.2vw,24px) !important;
          line-height:.95 !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .hype-workout-progress {
          margin:7px auto 1px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .hype-progress-head {
          margin-bottom:4px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .hype-progress-title {
          font-size:8px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .hype-progress-percent {
          font-size:20px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .hype-progress-track {
          height:18px !important;
          padding:2px !important;
          border-radius:7px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .hype-progress-meta {
          margin-top:4px !important;
          gap:3px !important;
          font-size:8px !important;
          line-height:1.15 !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .hype-progress-legend {
          gap:10px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .hype-progress-dot {
          width:6px !important;
          height:6px !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown {
          margin:0 auto 1px !important;
          padding:0 !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring {
          flex-basis:min(138px,39vw) !important;
          width:min(138px,39vw) !important;
          height:min(138px,39vw) !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-core {
          inset:18px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-copy {
          width:calc(100% - 40px) !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
          font-size:clamp(28px,9.2vw,38px) !important;
          line-height:1 !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-pause-hint {
          margin-top:4px !important;
          font-size:7px !important;
          line-height:1.15 !important;
        }

        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-controls {
          min-height:48px !important;
          margin-top:2px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-controls .session-cta.primary {
          min-height:48px !important;
          padding-top:10px !important;
          padding-bottom:10px !important;
        }
      }

      /* Very short mobile viewports get one extra compact step. */
      @media (max-width:600px) and (max-height:760px) {
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .session-main {
          gap:4px !important;
          padding:7px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .session-timers .timer-box {
          min-height:50px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) .hype-workout-progress {
          margin-top:4px !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring {
          flex-basis:min(124px,36vw) !important;
          width:min(124px,36vw) !important;
          height:min(124px,36vw) !important;
        }
        #session-modal.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
          font-size:clamp(26px,8.5vw,34px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installStyles, {once:true});
  else installStyles();
})();
