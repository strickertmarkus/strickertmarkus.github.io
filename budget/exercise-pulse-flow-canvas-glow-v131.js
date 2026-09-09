(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowCanvasGlowV131Installed) return;
  window.__exercisePulseFlowCanvasGlowV131Installed = true;

  var STYLE_ID = 'exercise-pulse-flow-canvas-glow-v131-style';

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width:600px) {
        /* v130 did paint the Canvas halo, but Canvas shadows inherit the source
           stroke alpha. With source alpha in the 0.02-0.08 range the effective
           shadow landed at roughly sub-percent to a few percent opacity and was
           essentially invisible on iOS. Amplify the already blurred Canvas
           result and keep it above local backgrounds while still below the
           crisp SVG core. */
        html.exercise-concept-pulse-home-v1 body canvas.pf-canvas-glow-v130 {
          opacity:1 !important;
          filter:brightness(4.8) saturate(1.12) !important;
          -webkit-filter:brightness(4.8) saturate(1.12) !important;
          mix-blend-mode:screen !important;
        }

        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 > .pf-canvas-large-v130 {
          z-index:1 !important;
        }
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 > svg {
          z-index:2 !important;
        }
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58::after {
          z-index:3 !important;
        }
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-status-v58 {
          z-index:4 !important;
        }

        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > .pf-canvas-mini-v130,
        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 > .pf-canvas-mini-v130 {
          z-index:1 !important;
        }
        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > svg,
        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 > svg {
          z-index:2 !important;
        }

        html.exercise-concept-pulse-home-v1 body #session-countdown-ring > .pf-canvas-arc-v130,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-ring > .pf-canvas-arc-v130 {
          z-index:1 !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring > .pf-arc-svg-v80,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-ring > .pf-arc-svg-v80 {
          z-index:2 !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring .session-countdown-copy,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-copy {
          z-index:4 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',installStyle,{once:true});
  else installStyle();
})();
