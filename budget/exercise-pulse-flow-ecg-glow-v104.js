(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowEcgGlowV105Installed) return;
  window.__exercisePulseFlowEcgGlowV105Installed = true;

  var STYLE_ID = 'exercise-pulse-flow-ecg-glow-v105-style';
  var scheduled = false;

  function cleanPreviousLargeEcgChanges() {
    var oldStyle = document.getElementById('exercise-pulse-flow-ecg-glow-v104-style');
    if (oldStyle) oldStyle.remove();

    document.querySelectorAll('.pulse-flow-head-v104').forEach(function (node) {
      node.remove();
    });

    document.querySelectorAll('.pulse-flow-band-v58 svg defs filter feGaussianBlur[data-pf-v104="true"]').forEach(function (blur) {
      blur.setAttribute('stdDeviation', '2.4');
      blur.removeAttribute('data-pf-v104');
    });
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Only the tiny ECG inside the between-set / between-exercise timer.
         The large ECG ribbon in the live workout keeps its original styling. */
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-base-v80 {
        stroke:var(--pf-between-accent) !important;
        stroke-width:1 !important;
        opacity:.055 !important;
        filter:none !important;
      }

      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-a-v80,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-b-v80 {
        stroke:color-mix(in srgb,var(--pf-between-accent) 82%,var(--pf-between-soft) 18%) !important;
        stroke-width:1.8 !important;
        opacity:1 !important;
        filter:
          drop-shadow(0 0 1.4px rgba(var(--pf-between-rgb),.96))
          drop-shadow(0 0 4.5px rgba(var(--pf-between-rgb),.50)) !important;
      }

      /* Small bright point at the leading edge of the tiny ECG sweep. */
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-marker-v80 {
        fill:var(--pf-between-soft) !important;
        stroke:none !important;
        opacity:1 !important;
        filter:
          drop-shadow(0 0 1.4px rgba(var(--pf-between-rgb),1))
          drop-shadow(0 0 4.8px rgba(var(--pf-between-rgb),.78)) !important;
      }

      /* Add the subtle glow from the approved timer mockup to the active
         portion of the actual between-set / between-exercise timer arc. */
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-arc-progress-v80 {
        stroke:rgba(var(--pf-between-rgb),.78) !important;
        filter:
          drop-shadow(0 0 3px rgba(var(--pf-between-rgb),.68))
          drop-shadow(0 0 9px rgba(var(--pf-between-rgb),.28)) !important;
      }

      @media (prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-a-v80,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-b-v80 {
          opacity:.48 !important;
          filter:none !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-marker-v80 {
          opacity:.55 !important;
          filter:none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function syncSmallEcgMarker() {
    installStyle();
    document.querySelectorAll('#session-between-overlay-v2 .pf-ecg-marker-v80').forEach(function (marker) {
      if (marker.getAttribute('r') !== '.82') marker.setAttribute('r', '.82');
    });
  }

  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      cleanPreviousLargeEcgChanges();
      syncSmallEcgMarker();
    });
  }

  cleanPreviousLargeEcgChanges();
  installStyle();
  scheduleSync();

  var observer = new MutationObserver(scheduleSync);
  observer.observe(document.documentElement, { childList:true, subtree:true });
})();
