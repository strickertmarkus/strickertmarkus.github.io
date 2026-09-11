(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowCanvasGlowV140LayerInstalled) return;
  window.__exercisePulseFlowCanvasGlowV140LayerInstalled = true;

  var STYLE_ID = 'exercise-pulse-flow-canvas-glow-v140-layer-style';

  function installStyle() {
    [
      'exercise-pulse-flow-canvas-glow-v131-style',
      'exercise-pulse-flow-canvas-glow-v132-layer-style'
    ].forEach(function (id) {
      var old = document.getElementById(id);
      if (old) old.remove();
    });
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width:600px) {
        /* Keep the successful v132 Canvas layering only for the compact ECGs
           and timer arcs. The large ECG is intentionally left to its original
           v58 SVG presentation. */
        html.exercise-concept-pulse-home-v1 body canvas.pf-canvas-glow-v130 {
          opacity:1 !important;
          filter:none !important;
          -webkit-filter:none !important;
          mix-blend-mode:screen !important;
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

  function loadTransitionStability() {
    if (document.querySelector('script[data-exercise-session-transition-stability-v142]')) return;
    var script = document.createElement('script');
    script.src = 'exercise-session-transition-stability-v142.js?v=20260911-training-flow-v142b';
    script.async = false;
    script.setAttribute('data-exercise-session-transition-stability-v142','true');
    document.head.appendChild(script);
  }

  function loadSessionPersistence() {
    if (document.querySelector('script[data-exercise-session-persistence-v143]')) return;
    var script = document.createElement('script');
    script.src = 'exercise-session-persistence-v143.js?v=20260911-session-persistence-v143b';
    script.async = false;
    script.setAttribute('data-exercise-session-persistence-v143','true');
    document.head.appendChild(script);
  }

  function install() {
    installStyle();
    loadTransitionStability();
    loadSessionPersistence();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
