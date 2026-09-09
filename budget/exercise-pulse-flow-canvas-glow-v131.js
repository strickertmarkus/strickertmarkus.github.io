(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowCanvasGlowV132LayerInstalled) return;
  window.__exercisePulseFlowCanvasGlowV132LayerInstalled = true;

  var STYLE_ID = 'exercise-pulse-flow-canvas-glow-v132-layer-style';

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var old = document.getElementById('exercise-pulse-flow-canvas-glow-v131-style');
    if (old) old.remove();

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width:600px) {
        /* v132 now generates the halo at real toggle-like strength in Canvas.
           Do not multiply it with the old 4.8x brightness hack. */
        html.exercise-concept-pulse-home-v1 body canvas.pf-canvas-glow-v130 {
          opacity:1 !important;
          filter:none !important;
          -webkit-filter:none !important;
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
        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 > .pf-canvas-mini-v130,
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring > .pf-canvas-arc-v130,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-ring > .pf-canvas-arc-v130 {
          z-index:1 !important;
        }

        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > svg,
        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 > svg,
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