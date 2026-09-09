(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowEcgGlowV126Installed) return;
  window.__exercisePulseFlowEcgGlowV126Installed = true;

  var STYLE_ID = 'exercise-pulse-flow-ecg-glow-v126-style';
  var scheduled = false;

  function cleanPreviousLargeEcgChanges() {
    ['exercise-pulse-flow-ecg-glow-v104-style','exercise-pulse-flow-ecg-glow-v105-style','exercise-pulse-flow-ecg-glow-v106-style','exercise-pulse-flow-ecg-glow-v107-style','exercise-pulse-flow-ecg-glow-v108-style','exercise-pulse-flow-ecg-glow-v109-style','exercise-pulse-flow-ecg-glow-v110-style','exercise-pulse-flow-ecg-glow-v111-style','exercise-pulse-flow-ecg-glow-v112-style','exercise-pulse-flow-ecg-glow-v113-style','exercise-pulse-flow-ecg-glow-v114-style','exercise-pulse-flow-ecg-glow-v116-style','exercise-pulse-flow-ecg-glow-v117-style','exercise-pulse-flow-ecg-glow-v118-style','exercise-pulse-flow-ecg-glow-v119-style','exercise-pulse-flow-ecg-glow-v120-style','exercise-pulse-flow-ecg-glow-v121-style','exercise-pulse-flow-ecg-glow-v122-style','exercise-pulse-flow-ecg-glow-v123-style','exercise-pulse-flow-ecg-glow-v124-style','exercise-pulse-flow-ecg-glow-v125-style'].forEach(function (id) {
      var oldStyle = document.getElementById(id);
      if (oldStyle) oldStyle.remove();
    });

    document.querySelectorAll('.pulse-flow-head-v104').forEach(function (node) {
      node.remove();
    });

    document.querySelectorAll('.pulse-flow-band-v58 svg defs filter feGaussianBlur[data-pf-v104="true"]').forEach(function (blur) {
      blur.setAttribute('stdDeviation','2.4');
      blur.removeAttribute('data-pf-v104');
    });
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Truly circular 5 s halo. Keep the v124 geometry/pulse unchanged. */
      html.exercise-concept-pulse-home-v1 body #session-pre-timer.show {
        background:rgba(8,13,20,.975) !important;
        isolation:isolate !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-pre-timer.show::before {
        content:'';
        position:absolute;
        inset:0;
        z-index:0;
        pointer-events:none;
        background:
          radial-gradient(circle 320px at 50% calc(50% - 18px),
            rgba(var(--concept-timer-rgb),.115) 0%,
            rgba(var(--concept-timer-rgb),.058) 39%,
            rgba(var(--concept-timer-rgb),.018) 60%,
            transparent 75%);
        transform-origin:50% calc(50% - 18px);
        animation:pfPretimerHaloPulseV124 1s cubic-bezier(.4,0,.2,1) infinite;
        will-change:transform,opacity;
      }
      html.exercise-concept-pulse-home-v1 body #session-pre-timer.show #session-pre-timer-ring {
        z-index:1 !important;
      }
      @keyframes pfPretimerHaloPulseV124 {
        0%,100% { opacity:.79;transform:scale(.976); }
        17% { opacity:1;transform:scale(1.035); }
        44% { opacity:.88;transform:scale(1.008); }
      }

      /* The wide Pulse Flow ECG used an SVG Gaussian blur measured in SVG user
         units. Because the 600-wide viewBox is stretched differently on phone
         and desktop, that glow grew visually with the viewport. Override the
         SVG filter with fixed-pixel CSS shadows so the apparent radius stays
         stable across screen sizes. */
      html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-trace-v58 {
        filter:
          drop-shadow(0 0 1.25px color-mix(in srgb,currentColor 86%,transparent))
          drop-shadow(0 0 3.8px color-mix(in srgb,currentColor 36%,transparent)) !important;
      }

      html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 .pf-ecg-guide-v80 {
        stroke:none !important;
        stroke-width:0 !important;
        stroke-opacity:0 !important;
        opacity:0 !important;
        filter:none !important;
        visibility:hidden !important;
      }

      html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 .pf-ecg-base-v80 {
        display:block !important;
        visibility:visible !important;
        stroke:currentColor !important;
        stroke-width:.9 !important;
        stroke-opacity:.14 !important;
        opacity:1 !important;
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

      /* Mobile Safari tends to render the same fixed-pixel filter slightly
         tighter on a high-DPI display. Give only the luminous layer a modest
         boost; geometry, stroke width and animation cadence remain identical. */
      @media (max-width:600px) {
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-trace-v58 {
          filter:
            drop-shadow(0 0 1.4px color-mix(in srgb,currentColor 92%,transparent))
            drop-shadow(0 0 4.3px color-mix(in srgb,currentColor 43%,transparent)) !important;
        }

        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-a-v80,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-b-v80 {
          filter:
            drop-shadow(0 0 1.55px rgba(var(--pf-between-rgb),.98))
            drop-shadow(0 0 5.05px rgba(var(--pf-between-rgb),.57)) !important;
        }

        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-marker-v80 {
          filter:
            drop-shadow(0 0 1.55px rgba(var(--pf-between-rgb),1))
            drop-shadow(0 0 5.35px rgba(var(--pf-between-rgb),.82)) !important;
        }

        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-arc-progress-v80 {
          filter:
            drop-shadow(0 0 3.3px rgba(var(--pf-between-rgb),.72))
            drop-shadow(0 0 9.8px rgba(var(--pf-between-rgb),.32)) !important;
        }
      }

      @media (prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 body #session-pre-timer.show::before {
          animation:none !important;
          opacity:.91 !important;
          transform:none !important;
        }
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
    document.querySelectorAll('#session-between-overlay-v2 .pf-ecg-marker-v80').forEach(function (marker) {
      if (marker.getAttribute('r') !== '.82') marker.setAttribute('r','.82');
    });
  }

  function syncLargeEcgGlow() {
    document.querySelectorAll('.pulse-flow-band-v58 .pulse-flow-trace-v58[filter]').forEach(function (trace) {
      var value = String(trace.getAttribute('filter') || '');
      if (value.indexOf('url(') === 0) trace.removeAttribute('filter');
    });
  }

  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      syncSmallEcgMarker();
      syncLargeEcgGlow();
    });
  }

  function relevantInsertion(mutation) {
    return Array.prototype.some.call(mutation.addedNodes || [],function (node) {
      if (!node || node.nodeType !== 1) return false;
      if (node.matches && node.matches('.pf-ecg-v80,#session-between-overlay-v2,.pulse-flow-band-v58')) return true;
      return !!(node.querySelector && node.querySelector('.pf-ecg-v80,#session-between-overlay-v2,.pulse-flow-band-v58'));
    });
  }

  function loadSessionHelpers() {
    if (!document.querySelector('script[data-exercise-session-flow-v118]')) {
      var flow = document.createElement('script');
      flow.src = 'exercise-session-flow-v112.js?v=20260909-session-flow-v118';
      flow.async = false;
      flow.setAttribute('data-exercise-session-flow-v118','true');
      document.head.appendChild(flow);
    }

    if (!document.querySelector('script[data-exercise-session-unit-labels-v118]')) {
      var units = document.createElement('script');
      units.src = 'exercise-session-unit-labels-v116.js?v=20260909-session-units-v118';
      units.async = false;
      units.setAttribute('data-exercise-session-unit-labels-v118','true');
      document.head.appendChild(units);
    }

    if (!document.querySelector('script[data-exercise-session-theme-rest-v120]')) {
      var restTheme = document.createElement('script');
      restTheme.src = 'exercise-session-theme-rest-v117.js?v=20260909-session-theme-rest-v120';
      restTheme.async = false;
      restTheme.setAttribute('data-exercise-session-theme-rest-v120','true');
      document.head.appendChild(restTheme);
    }
  }

  cleanPreviousLargeEcgChanges();
  installStyle();
  syncSmallEcgMarker();
  syncLargeEcgGlow();
  loadSessionHelpers();

  var observer = new MutationObserver(function (mutations) {
    if (mutations.some(relevantInsertion)) scheduleSync();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();