(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowEcgGlowV127Installed) return;
  window.__exercisePulseFlowEcgGlowV127Installed = true;

  var STYLE_ID = 'exercise-pulse-flow-ecg-glow-v127-style';
  var scheduled = false;

  function cleanPreviousLargeEcgChanges() {
    ['exercise-pulse-flow-ecg-glow-v104-style','exercise-pulse-flow-ecg-glow-v105-style','exercise-pulse-flow-ecg-glow-v106-style','exercise-pulse-flow-ecg-glow-v107-style','exercise-pulse-flow-ecg-glow-v108-style','exercise-pulse-flow-ecg-glow-v109-style','exercise-pulse-flow-ecg-glow-v110-style','exercise-pulse-flow-ecg-glow-v111-style','exercise-pulse-flow-ecg-glow-v112-style','exercise-pulse-flow-ecg-glow-v113-style','exercise-pulse-flow-ecg-glow-v114-style','exercise-pulse-flow-ecg-glow-v116-style','exercise-pulse-flow-ecg-glow-v117-style','exercise-pulse-flow-ecg-glow-v118-style','exercise-pulse-flow-ecg-glow-v119-style','exercise-pulse-flow-ecg-glow-v120-style','exercise-pulse-flow-ecg-glow-v121-style','exercise-pulse-flow-ecg-glow-v122-style','exercise-pulse-flow-ecg-glow-v123-style','exercise-pulse-flow-ecg-glow-v124-style','exercise-pulse-flow-ecg-glow-v125-style','exercise-pulse-flow-ecg-glow-v126-style'].forEach(function (id) {
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
      /* Keep the circular 5 s halo exactly as before. */
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

      /* Desktop keeps a light fixed-pixel shadow. Use rgba instead of
         color-mix so the filter is parsed consistently by WebKit. */
      html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-trace-v58 {
        filter:
          drop-shadow(0 0 1.25px rgba(var(--pf-rgb),.86))
          drop-shadow(0 0 3.8px rgba(var(--pf-rgb),.36)) !important;
        -webkit-filter:
          drop-shadow(0 0 1.25px rgba(var(--pf-rgb),.86))
          drop-shadow(0 0 3.8px rgba(var(--pf-rgb),.36)) !important;
      }

      /* iOS/WebKit fallback: a real translucent SVG stroke behind the active
         trace. This does not depend on CSS filter rendering and therefore stays
         visibly luminous on the phone. It is hidden on larger screens. */
      html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-mobile-halo-v127 {
        display:none;
        fill:none;
        vector-effect:non-scaling-stroke;
        stroke-linecap:round;
        stroke-linejoin:round;
        pointer-events:none;
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
        -webkit-filter:
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
        -webkit-filter:
          drop-shadow(0 0 1.4px rgba(var(--pf-between-rgb),1))
          drop-shadow(0 0 4.8px rgba(var(--pf-between-rgb),.78)) !important;
      }

      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-arc-progress-v80 {
        stroke:rgba(var(--pf-between-rgb),.78) !important;
        filter:
          drop-shadow(0 0 3px rgba(var(--pf-between-rgb),.68))
          drop-shadow(0 0 9px rgba(var(--pf-between-rgb),.28)) !important;
        -webkit-filter:
          drop-shadow(0 0 3px rgba(var(--pf-between-rgb),.68))
          drop-shadow(0 0 9px rgba(var(--pf-between-rgb),.28)) !important;
      }

      @media (max-width:600px) {
        /* The screenshot showed WebKit rendering the animated SVG filter almost
           flat. On mobile, use the stroke halo as the primary luminous layer
           and leave only a very tight shadow on the core trace. */
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-trace-v58 {
          filter:drop-shadow(0 0 1.8px rgba(var(--pf-rgb),.96)) !important;
          -webkit-filter:drop-shadow(0 0 1.8px rgba(var(--pf-rgb),.96)) !important;
        }
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-mobile-halo-v127 {
          display:block;
          stroke-width:11px;
          stroke-dasharray:175 825;
          stroke-dashoffset:0;
          opacity:.22;
          animation:pulse-flow-sweep-v58 var(--pf-speed) linear infinite;
          will-change:stroke-dashoffset;
        }

        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-a-v80,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-b-v80 {
          filter:
            drop-shadow(0 0 1.8px rgba(var(--pf-between-rgb),1))
            drop-shadow(0 0 6.2px rgba(var(--pf-between-rgb),.68))
            drop-shadow(0 0 10px rgba(var(--pf-between-rgb),.26)) !important;
          -webkit-filter:
            drop-shadow(0 0 1.8px rgba(var(--pf-between-rgb),1))
            drop-shadow(0 0 6.2px rgba(var(--pf-between-rgb),.68))
            drop-shadow(0 0 10px rgba(var(--pf-between-rgb),.26)) !important;
        }

        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-marker-v80 {
          filter:
            drop-shadow(0 0 1.8px rgba(var(--pf-between-rgb),1))
            drop-shadow(0 0 6.4px rgba(var(--pf-between-rgb),.88)) !important;
          -webkit-filter:
            drop-shadow(0 0 1.8px rgba(var(--pf-between-rgb),1))
            drop-shadow(0 0 6.4px rgba(var(--pf-between-rgb),.88)) !important;
        }

        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-arc-progress-v80 {
          filter:
            drop-shadow(0 0 3.8px rgba(var(--pf-between-rgb),.80))
            drop-shadow(0 0 11px rgba(var(--pf-between-rgb),.38)) !important;
          -webkit-filter:
            drop-shadow(0 0 3.8px rgba(var(--pf-between-rgb),.80))
            drop-shadow(0 0 11px rgba(var(--pf-between-rgb),.38)) !important;
        }

        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58 #session-countdown-segments .session-countdown-segment.active {
          filter:
            drop-shadow(0 0 2px rgba(var(--pf-rgb),.96))
            drop-shadow(0 0 6px rgba(var(--pf-rgb),.62)) !important;
          -webkit-filter:
            drop-shadow(0 0 2px rgba(var(--pf-rgb),.96))
            drop-shadow(0 0 6px rgba(var(--pf-rgb),.62)) !important;
        }
      }

      @media (prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 body #session-pre-timer.show::before {
          animation:none !important;
          opacity:.91 !important;
          transform:none !important;
        }
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-mobile-halo-v127 {
          animation:none !important;
          opacity:.10 !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-a-v80,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-b-v80 {
          opacity:.48 !important;
          filter:none !important;
          -webkit-filter:none !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-marker-v80 {
          opacity:.55 !important;
          filter:none !important;
          -webkit-filter:none !important;
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
    document.querySelectorAll('.pulse-flow-band-v58 svg').forEach(function (svg) {
      var trace = svg.querySelector('.pulse-flow-trace-v58');
      if (!trace) return;

      var attrFilter = String(trace.getAttribute('filter') || '');
      if (attrFilter.indexOf('url(') === 0) trace.removeAttribute('filter');

      if (!svg.querySelector('.pulse-flow-mobile-halo-v127')) {
        var halo = trace.cloneNode(false);
        halo.classList.remove('pulse-flow-trace-v58');
        halo.classList.add('pulse-flow-mobile-halo-v127');
        halo.removeAttribute('filter');
        halo.setAttribute('aria-hidden','true');
        trace.parentNode.insertBefore(halo,trace);
      }
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