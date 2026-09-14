(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseTimerFocusV150Installed) return;
  window.__exerciseTimerFocusV150Installed = true;

  function install() {
    if (document.getElementById('exercise-timer-focus-v150-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-timer-focus-v150-style';
    style.textContent = `
      /* v150: focus mode uses the exact existing compact Pulse Flow timer.
         Nothing is cloned, reparented or redrawn. The live timer remains in
         its normal DOM position and is only promoted/scaled with CSS. */

      html:has(#cardio-focus-v145.show) #session-modal.show {
        z-index:2147483451 !important;
        background:transparent !important;
        pointer-events:none !important;
      }

      html:has(#cardio-focus-v145.show) #session-modal.show .session-shell {
        visibility:hidden !important;
        background:transparent !important;
      }

      html:has(#cardio-focus-v145.show) #session-modal.show #session-cardio-countdown {
        visibility:visible !important;
        position:fixed !important;
        inset:0 !important;
        z-index:2147483452 !important;
        width:100vw !important;
        height:100dvh !important;
        min-height:100svh !important;
        margin:0 !important;
        padding:0 !important;
        display:grid !important;
        place-items:center !important;
        overflow:visible !important;
        pointer-events:none !important;
        background:transparent !important;
      }

      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring {
        visibility:visible !important;
        position:relative !important;
        left:auto !important;
        top:auto !important;
        right:auto !important;
        bottom:auto !important;
        margin:6vh 0 0 !important;
        flex:none !important;
        flex-basis:auto !important;
        transform:scale(2.48) !important;
        transform-origin:50% 50% !important;
        z-index:2147483453 !important;
        overflow:visible !important;
        pointer-events:none !important;
        will-change:transform !important;
      }

      /* Keep every piece of the compact timer untouched and visible. */
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring *,
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring::before,
      html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring::after {
        visibility:visible !important;
      }

      html:has(#cardio-focus-v145.show) #session-modal.show #session-cardio-countdown .cardio-focus-expand-v145 {
        display:none !important;
      }

      /* v145 still owns the opaque background, title and close button. Hide
         only its duplicate timer artwork; the real timer above is visible. */
      #cardio-focus-v145.show .cardio-focus-ring-v145 {
        display:none !important;
      }

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

      #cardio-focus-v145.show .cardio-focus-kicker-v145 {
        top:28.5vh !important;
      }

      #cardio-focus-v145.show .cardio-focus-name-v145 {
        top:calc(28.5vh + 29px) !important;
        margin:0 !important;
      }

      #cardio-focus-v145.show .cardio-focus-close-v145 {
        pointer-events:auto !important;
      }

      @media(max-width:600px) {
        html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring {
          transform:scale(2.42) !important;
          margin-top:7vh !important;
        }
      }

      @media(max-width:390px) {
        html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring {
          transform:scale(2.28) !important;
        }
        #cardio-focus-v145.show .cardio-focus-kicker-v145 { top:27.5vh !important; }
        #cardio-focus-v145.show .cardio-focus-name-v145 { top:calc(27.5vh + 28px) !important; }
      }

      @media(prefers-reduced-motion:reduce) {
        html:has(#cardio-focus-v145.show) #session-modal.show #session-countdown-ring {
          will-change:auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
