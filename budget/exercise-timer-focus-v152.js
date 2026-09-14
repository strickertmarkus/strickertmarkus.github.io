(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseTimerFocusV152Installed) return;
  window.__exerciseTimerFocusV152Installed = true;

  function install() {
    ['exercise-timer-focus-v150-style','exercise-timer-focus-v151-style'].forEach(function (id) {
      var stale = document.getElementById(id);
      if (stale) stale.remove();
    });
    if (document.getElementById('exercise-timer-focus-v152-style')) return;

    var style = document.createElement('style');
    style.id = 'exercise-timer-focus-v152-style';
    style.textContent = `
      /* v152: keep the entire ancestry of the real compact timer visible.
         Only sibling workout UI is hidden. This avoids visibility/display
         inheritance bugs while still rendering the exact live timer. */
      html:has(#cardio-focus-v145.show) #session-modal.show {
        z-index:2147483500 !important;
        pointer-events:none !important;
        background:
          radial-gradient(circle at 50% 42%,rgba(239,68,68,.20),transparent 34%),
          radial-gradient(circle at 50% 110%,rgba(127,29,29,.18),transparent 42%),
          linear-gradient(180deg,#16090C 0%,#10070A 48%,#09070A 100%) !important;
      }
      html:has(#cardio-focus-v145.show) #session-modal.show::before,
      html:has(#cardio-focus-v145.show) #session-modal.show::after {
        content:none !important;
        display:none !important;
      }

      /* Never hide a timer ancestor. */
      html:has(#cardio-focus-v145.show) #session-modal.show .session-shell,
      html:has(#cardio-focus-v145.show) #session-modal.show .session-grid,
      html:has(#cardio-focus-v145.show) #session-modal.show .session-main {
        visibility:visible !important;
        opacity:1 !important;
        filter:none !important;
        transform:none !important;
        background:transparent !important;
        border-color:transparent !important;
        box-shadow:none !important;
        overflow:visible !important;
      }
      html:has(#cardio-focus-v145.show) #session-modal.show .session-grid,
      html:has(#cardio-focus-v145.show) #session-modal.show .session-main {
        position:fixed !important;
        inset:0 !important;
        width:100vw !important;
        height:100dvh !important;
        min-height:100svh !important;
        max-width:none !important;
        max-height:none !important;
        margin:0 !important;
        padding:0 !important;
      }

      /* Hide only siblings around the live countdown. */
      html:has(#cardio-focus-v145.show) #session-modal.show .session-top,
      html:has(#cardio-focus-v145.show) #session-modal.show .session-grid > .session-card:not(.session-main),
      html:has(#cardio-focus-v145.show) #session-modal.show .session-main > *:not(#session-cardio-countdown) {
        visibility:hidden !important;
        opacity:0 !important;
        pointer-events:none !important;
      }

      html:has(#cardio-focus-v145.show) #session-modal.show #session-cardio-countdown.show {
        visibility:visible !important;
        opacity:1 !important;
        display:block !important;
        position:fixed !important;
        inset:0 !important;
        z-index:50 !important;
        width:100vw !important;
        height:100dvh !important;
        min-height:100svh !important;
        margin:0 !important;
        padding:0 !important;
        overflow:visible !important;
        pointer-events:none !important;
        background:transparent !important;
      }

      /* Exact compact timer, laid out at a larger native size. */
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring {
        visibility:visible !important;
        opacity:1 !important;
        display:grid !important;
        position:fixed !important;
        left:50% !important;
        top:55% !important;
        right:auto !important;
        bottom:auto !important;
        width:min(324px,82vw) !important;
        height:min(324px,82vw) !important;
        min-width:0 !important;
        min-height:0 !important;
        flex:0 0 min(324px,82vw) !important;
        flex-basis:min(324px,82vw) !important;
        aspect-ratio:1 !important;
        margin:0 !important;
        transform:translate(-50%,-50%) !important;
        transform-origin:50% 50% !important;
        z-index:51 !important;
        overflow:visible !important;
        pointer-events:auto !important;
      }
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring > *,
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring .session-countdown-copy,
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring .session-countdown-copy > * {
        visibility:visible !important;
        opacity:1 !important;
      }
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring .session-countdown-core {
        inset:44px !important;
      }
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring .session-countdown-copy {
        width:calc(100% - 128px) !important;
      }
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-value {
        font-size:66px !important;
        line-height:1 !important;
        letter-spacing:-2.4px !important;
      }
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring .session-countdown-label {
        margin-top:12px !important;
        font-size:12px !important;
        letter-spacing:1.15px !important;
      }
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring .pf-ecg-v80 {
        width:104px !important;
        height:29px !important;
        margin-top:9px !important;
      }
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring #cardio-inline-plus-v145 {
        margin-top:10px !important;
        font-size:14px !important;
      }
      html:has(#cardio-focus-v145.show) #session-modal.show #session-cardio-countdown .cardio-focus-expand-v145 {
        display:none !important;
      }

      /* Keep v145 only for the background labels and close control. */
      #cardio-focus-v145.show {
        z-index:2147483600 !important;
        background:transparent !important;
        pointer-events:none !important;
      }
      #cardio-focus-v145.show::before { display:none !important; }
      #cardio-focus-v145.show .cardio-focus-ring-v145 { display:none !important; }
      #cardio-focus-v145.show .cardio-focus-shell-v145 {
        position:fixed !important;
        inset:0 !important;
        width:100% !important;
        max-width:none !important;
        padding:0 !important;
        display:block !important;
        pointer-events:none !important;
      }
      #cardio-focus-v145.show .cardio-focus-kicker-v145,
      #cardio-focus-v145.show .cardio-focus-name-v145 {
        position:absolute !important;
        left:50% !important;
        transform:translateX(-50%) !important;
        width:min(430px,86vw) !important;
        text-align:center !important;
      }
      #cardio-focus-v145.show .cardio-focus-kicker-v145 { top:25.5vh !important; }
      #cardio-focus-v145.show .cardio-focus-name-v145 { top:calc(25.5vh + 30px) !important; margin:0 !important; }
      #cardio-focus-v145.show .cardio-focus-close-v145 {
        z-index:5 !important;
        pointer-events:auto !important;
      }

      @media(max-width:390px) {
        html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring {
          width:min(300px,80vw) !important;
          height:min(300px,80vw) !important;
          flex-basis:min(300px,80vw) !important;
          top:55.5% !important;
        }
        html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring .session-countdown-core { inset:41px !important; }
        html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-value { font-size:61px !important; }
        #cardio-focus-v145.show .cardio-focus-kicker-v145 { top:25vh !important; }
        #cardio-focus-v145.show .cardio-focus-name-v145 { top:calc(25vh + 29px) !important; }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
