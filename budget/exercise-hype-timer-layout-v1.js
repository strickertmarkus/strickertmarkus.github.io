(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (window.__exerciseHypeTimerLayoutV1Installed) return;
  window.__exerciseHypeTimerLayoutV1Installed = true;

  function addStyles() {
    if (document.getElementById('exercise-hype-timer-layout-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-hype-timer-layout-v1-style';
    style.textContent = `
      /* Final timer geometry authority. The session has accumulated several
         visual layers; keeping all geometry here prevents an older layer from
         offsetting a timer when Hype mode changes state. */
      #session-modal.show .session-timers {
        display:grid !important;
        grid-template-columns:repeat(2,minmax(0,1fr)) !important;
        align-items:stretch !important;
        width:100% !important;
        min-width:0 !important;
        gap:10px !important;
      }
      #session-modal.show .session-timers .timer-box {
        box-sizing:border-box !important;
        display:grid !important;
        align-content:center !important;
        justify-items:center !important;
        min-width:0 !important;
        min-height:74px !important;
        padding:10px 8px !important;
        text-align:center !important;
      }
      #session-modal.show .session-timers .timer-lbl,
      #session-modal.show .session-timers .timer-val {
        width:100% !important;
        min-width:0 !important;
        margin-left:0 !important;
        margin-right:0 !important;
        text-align:center !important;
        white-space:nowrap !important;
      }
      #session-modal.show .session-timers .timer-val {
        font-variant-numeric:tabular-nums !important;
        letter-spacing:-.6px !important;
      }

      #session-cardio-countdown {
        box-sizing:border-box !important;
        width:100% !important;
        min-width:0 !important;
        margin:5px auto 7px !important;
        padding:3px 0 5px !important;
        align-items:center !important;
        justify-content:center !important;
        overflow:visible !important;
      }
      #session-countdown-ring {
        box-sizing:border-box !important;
        flex:0 0 180px !important;
        width:180px !important;
        height:180px !important;
        aspect-ratio:1 !important;
        margin:0 auto !important;
        position:relative !important;
        display:grid !important;
        place-items:center !important;
        transform:none !important;
      }
      #session-countdown-segments {
        position:absolute !important;
        inset:0 !important;
        width:100% !important;
        height:100% !important;
        border-radius:50% !important;
        transform:none !important;
      }
      #session-countdown-segments .session-countdown-segment {
        --countdown-segment-color:rgba(251,146,60,.11);
        box-sizing:border-box !important;
        position:absolute !important;
        left:50% !important;
        top:50% !important;
        width:3px !important;
        height:calc(50% - 2px) !important;
        margin:0 !important;
        border-radius:999px !important;
        background:linear-gradient(to bottom,var(--countdown-segment-color) 0 13px,transparent 13px) !important;
        box-shadow:none !important;
        filter:none;
        opacity:.65;
        transform:translate(-50%,-100%) rotate(var(--countdown-angle,0deg)) !important;
        transform-origin:50% 100% !important;
        transition:opacity .12s linear,filter .12s linear !important;
      }
      #session-countdown-segments .session-countdown-segment.active {
        --countdown-segment-color:#FB923C;
        opacity:1;
        filter:drop-shadow(0 0 3px rgba(251,146,60,.60));
      }
      #session-countdown-segments .session-countdown-segment.inactive {
        --countdown-segment-color:rgba(251,146,60,.11);
        opacity:.65;
        filter:none;
      }
      #session-countdown-ring .session-countdown-core {
        box-sizing:border-box !important;
        inset:24px !important;
      }
      #session-countdown-ring .session-countdown-copy {
        position:relative !important;
        z-index:2 !important;
        display:grid !important;
        place-content:center !important;
        justify-items:center !important;
        width:calc(100% - 52px) !important;
        min-width:0 !important;
        margin:0 auto !important;
        text-align:center !important;
        transform:none !important;
      }
      #session-countdown-value,
      #session-countdown-pause-hint {
        width:100% !important;
        min-width:0 !important;
        text-align:center !important;
      }
      #session-countdown-value {
        font-variant-numeric:tabular-nums !important;
        white-space:nowrap !important;
      }

      #session-pre-timer.show {
        box-sizing:border-box !important;
        display:grid !important;
        grid-template:1fr / 1fr !important;
        place-items:center !important;
        width:100vw !important;
        height:100dvh !important;
        min-height:100svh !important;
        margin:0 !important;
        transform:none;
      }
      #session-pre-timer-ring {
        box-sizing:border-box !important;
        position:relative !important;
        width:172px !important;
        height:172px !important;
        aspect-ratio:1 !important;
        margin:auto !important;
        transform:none !important;
      }
      #session-pre-timer-ring::after {
        content:'' !important;
        position:absolute !important;
        inset:5px !important;
        width:auto !important;
        height:auto !important;
        margin:0 !important;
        border-radius:50% !important;
        background:radial-gradient(circle at 50% 0,#FB923C 0 5px,transparent 5.5px) !important;
        box-shadow:none !important;
        transform:rotate(var(--pre-smooth-progress,0deg)) !important;
        transform-origin:50% 50% !important;
        pointer-events:none !important;
        z-index:3 !important;
      }
      #session-pre-timer-ring .session-pre-copy {
        position:relative !important;
        z-index:4 !important;
        display:grid !important;
        place-content:center !important;
        justify-items:center !important;
        width:100% !important;
        height:100% !important;
        margin:0 !important;
        text-align:center !important;
        transform:none !important;
      }
      #session-pre-timer-value {
        min-width:0 !important;
        width:100% !important;
        margin:0 !important;
        text-align:center !important;
        font-variant-numeric:tabular-nums !important;
      }

      @media(max-width:600px) {
        #session-modal.show .session-timers { gap:7px !important; }
        #session-modal.show .session-timers .timer-box {
          min-height:68px !important;
          padding:9px 5px !important;
        }
        #session-modal.show .session-timers .timer-val {
          font-size:clamp(23px,7.2vw,28px) !important;
        }
        #session-countdown-ring {
          flex-basis:min(164px,48vw) !important;
          width:min(164px,48vw) !important;
          height:min(164px,48vw) !important;
        }
        #session-countdown-segments .session-countdown-segment {
          background:linear-gradient(to bottom,var(--countdown-segment-color) 0 11px,transparent 11px) !important;
        }
        #session-countdown-ring .session-countdown-core { inset:21px !important; }
        #session-countdown-ring .session-countdown-copy { width:calc(100% - 46px) !important; }

        #session-pre-timer.show {
          padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom)) !important;
        }
        #session-pre-timer-ring {
          width:min(158px,43vw) !important;
          height:min(158px,43vw) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeSegments() {
    document.querySelectorAll('#session-countdown-segments .session-countdown-segment').forEach(function (segment, index) {
      segment.style.setProperty('--countdown-angle', (index * 6) + 'deg');
      segment.style.removeProperty('transform');
    });
  }

  function install() {
    addStyles();
    normalizeSegments();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
