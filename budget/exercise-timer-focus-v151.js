(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseTimerFocusV151Installed) return;
  window.__exerciseTimerFocusV151Installed = true;

  function install() {
    /* Remove the transform-scaling experiment if an older cached bundle
       happened to execute first. */
    var stale = document.getElementById('exercise-timer-focus-v150-style');
    if (stale) stale.remove();

    if (document.getElementById('exercise-timer-focus-v151-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-timer-focus-v151-style';
    style.textContent = `
      /* v151b: the opaque focus background is the session modal itself.
         This avoids putting a pseudo-element stacking context above the live
         countdown. The live compact timer is still the only timer rendered. */
      html:has(#cardio-focus-v145.show) #session-modal.show {
        z-index:2147483500 !important;
        pointer-events:none !important;
        isolation:isolate !important;
        background:
          radial-gradient(circle at 50% 42%,rgba(239,68,68,.20),transparent 34%),
          radial-gradient(circle at 50% 110%,rgba(127,29,29,.18),transparent 42%),
          linear-gradient(180deg,#16090C 0%,#10070A 48%,#09070A 100%) !important;
      }

      /* Explicitly kill the old backdrop pseudo-element from v151a. */
      html:has(#cardio-focus-v145.show) #session-modal.show::before,
      html:has(#cardio-focus-v145.show) #session-modal.show::after {
        content:none !important;
        display:none !important;
      }

      /* Hide the normal workout presentation without changing its DOM or
         runtime state. visibility can be restored on the countdown subtree,
         unlike opacity/display on an ancestor. */
      html:has(#cardio-focus-v145.show) #session-modal.show .session-shell {
        visibility:hidden !important;
        background:transparent !important;
        transform:none !important;
        filter:none !important;
      }

      html:has(#cardio-focus-v145.show) #session-modal.show #session-cardio-countdown.show,
      html:has(#cardio-focus-v145.show) #session-modal.show #session-cardio-countdown.show * {
        visibility:visible !important;
      }

      html:has(#cardio-focus-v145.show) #session-modal.show #session-cardio-countdown.show {
        position:fixed !important;
        inset:0 !important;
        z-index:20 !important;
        width:100vw !important;
        height:100dvh !important;
        min-height:100svh !important;
        margin:0 !important;
        padding:0 !important;
        display:block !important;
        overflow:visible !important;
        pointer-events:none !important;
        background:transparent !important;
      }

      /* Native-resolution enlargement. No scale() is applied to the ring, so
         its SVG and Canvas glow layers repaint at the large layout size. */
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring {
        visibility:visible !important;
        position:fixed !important;
        left:50% !important;
        top:55% !important;
        right:auto !important;
        bottom:auto !important;
        width:min(324px,82vw) !important;
        height:min(324px,82vw) !important;
        flex:0 0 min(324px,82vw) !important;
        flex-basis:min(324px,82vw) !important;
        aspect-ratio:1 !important;
        margin:0 !important;
        transform:translate(-50%,-50%) !important;
        transform-origin:50% 50% !important;
        z-index:21 !important;
        overflow:visible !important;
        pointer-events:auto !important;
        will-change:auto !important;
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
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring #cardio-inline-plus-v145 .plus-word-v145 {
        margin-left:6px !important;
        font-size:10px !important;
        letter-spacing:1px !important;
      }
      html:has(#cardio-focus-v145.show) #session-modal.show #session-cardio-countdown .cardio-focus-expand-v145 {
        display:none !important;
      }

      /* v145 remains the interaction/title layer only. */
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
        z-index:2 !important;
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
      #cardio-focus-v145.show .cardio-focus-name-v145 {
        top:calc(25.5vh + 30px) !important;
        margin:0 !important;
      }
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
        html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring .session-countdown-core {
          inset:41px !important;
        }
        html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-value {
          font-size:61px !important;
        }
        #cardio-focus-v145.show .cardio-focus-kicker-v145 { top:25vh !important; }
        #cardio-focus-v145.show .cardio-focus-name-v145 { top:calc(25vh + 29px) !important; }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
