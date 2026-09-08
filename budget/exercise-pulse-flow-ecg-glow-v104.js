(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowEcgGlowV108Installed) return;
  window.__exercisePulseFlowEcgGlowV108Installed = true;

  var STYLE_ID = 'exercise-pulse-flow-ecg-glow-v108-style';
  var scheduled = false;

  function cleanPreviousLargeEcgChanges() {
    ['exercise-pulse-flow-ecg-glow-v104-style','exercise-pulse-flow-ecg-glow-v105-style','exercise-pulse-flow-ecg-glow-v106-style','exercise-pulse-flow-ecg-glow-v107-style'].forEach(function (id) {
      var oldStyle = document.getElementById(id);
      if (oldStyle) oldStyle.remove();
    });

    document.querySelectorAll('.pulse-flow-head-v104').forEach(function (node) {
      node.remove();
    });

    document.querySelectorAll('.pulse-flow-band-v58 svg defs filter feGaussianBlur[data-pf-v104="true"]').forEach(function (blur) {
      blur.setAttribute('stdDeviation', '2.4');
      blur.removeAttribute('data-pf-v104');
    });
  }

  function installStyle() {
    var style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        /* Isolation test: remove ONLY the static/inactive ECG baseline in the
           small rest / between-exercise timer. The moving sweep stays intact. */
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-base-v80 {
          display:none !important;
          visibility:hidden !important;
          stroke:none !important;
          stroke-opacity:0 !important;
          opacity:0 !important;
          filter:none !important;
        }

        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-a-v80,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-b-v80 {
          stroke:color-mix(in srgb,var(--pf-between-accent) 82%,var(--pf-between-soft) 18%) !important;
          stroke-width:1.8 !important;
          stroke-opacity:1 !important;
          opacity:1 !important;
          filter:
            drop-shadow(0 0 1.4px rgba(var(--pf-between-rgb),.96))
            drop-shadow(0 0 4.5px rgba(var(--pf-between-rgb),.50)) !important;
        }

        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-marker-v80 {
          fill:var(--pf-between-soft) !important;
          stroke:none !important;
          opacity:1 !important;
          filter:
            drop-shadow(0 0 1.4px rgba(var(--pf-between-rgb),1))
            drop-shadow(0 0 4.8px rgba(var(--pf-between-rgb),.78)) !important;
        }

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
    } else if (style !== document.head.lastElementChild) {
      document.head.appendChild(style);
    }
    return style;
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
