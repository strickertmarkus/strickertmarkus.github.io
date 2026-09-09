(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowSmoothGlowV129Installed) return;
  window.__exercisePulseFlowSmoothGlowV129Installed = true;

  var STYLE_ID = 'exercise-pulse-flow-smooth-glow-v129-style';
  var scheduled = false;

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* v127's single 11 px translucent stroke read as a thick tube on iOS.
         Hide it and build the mobile glow from two much lighter nested strokes
         around the original crisp trace instead. */
      html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-mobile-halo-v127 {
        display:none !important;
      }

      html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-smooth-halo-outer-v129,
      html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-smooth-halo-mid-v129 {
        display:none;
        fill:none;
        vector-effect:non-scaling-stroke;
        stroke-linecap:round;
        stroke-linejoin:round;
        pointer-events:none;
        filter:none;
        -webkit-filter:none;
      }

      @media (max-width:600px) {
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-trace-v58 {
          filter:
            drop-shadow(0 0 1.2px rgba(var(--pf-rgb),.92))
            drop-shadow(0 0 3.2px rgba(var(--pf-rgb),.44))
            drop-shadow(0 0 6.2px rgba(var(--pf-rgb),.16)) !important;
          -webkit-filter:
            drop-shadow(0 0 1.2px rgba(var(--pf-rgb),.92))
            drop-shadow(0 0 3.2px rgba(var(--pf-rgb),.44))
            drop-shadow(0 0 6.2px rgba(var(--pf-rgb),.16)) !important;
        }

        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-smooth-halo-outer-v129 {
          display:block;
          stroke-width:8px;
          stroke-dasharray:175 825;
          stroke-dashoffset:0;
          opacity:.045;
          animation:pulse-flow-sweep-v58 var(--pf-speed) linear infinite;
          will-change:stroke-dashoffset;
        }

        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-smooth-halo-mid-v129 {
          display:block;
          stroke-width:4.8px;
          stroke-dasharray:175 825;
          stroke-dashoffset:0;
          opacity:.105;
          animation:pulse-flow-sweep-v58 var(--pf-speed) linear infinite;
          will-change:stroke-dashoffset;
        }
      }

      @media (prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-smooth-halo-outer-v129,
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-smooth-halo-mid-v129 {
          animation:none !important;
          opacity:.045 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSmoothGlow() {
    document.querySelectorAll('.pulse-flow-band-v58 svg').forEach(function (svg) {
      var trace = svg.querySelector('.pulse-flow-trace-v58');
      if (!trace) return;

      if (!svg.querySelector('.pulse-flow-smooth-halo-outer-v129')) {
        var outer = trace.cloneNode(false);
        outer.classList.remove('pulse-flow-trace-v58');
        outer.classList.add('pulse-flow-smooth-halo-outer-v129');
        outer.removeAttribute('filter');
        outer.setAttribute('aria-hidden','true');
        trace.parentNode.insertBefore(outer,trace);
      }

      if (!svg.querySelector('.pulse-flow-smooth-halo-mid-v129')) {
        var mid = trace.cloneNode(false);
        mid.classList.remove('pulse-flow-trace-v58');
        mid.classList.add('pulse-flow-smooth-halo-mid-v129');
        mid.removeAttribute('filter');
        mid.setAttribute('aria-hidden','true');
        trace.parentNode.insertBefore(mid,trace);
      }
    });
  }

  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      ensureSmoothGlow();
    });
  }

  function relevantInsertion(mutation) {
    return Array.prototype.some.call(mutation.addedNodes || [],function (node) {
      if (!node || node.nodeType !== 1) return false;
      if (node.matches && node.matches('.pulse-flow-band-v58,.pulse-flow-trace-v58')) return true;
      return !!(node.querySelector && node.querySelector('.pulse-flow-band-v58,.pulse-flow-trace-v58'));
    });
  }

  installStyle();
  ensureSmoothGlow();

  var observer = new MutationObserver(function (mutations) {
    if (mutations.some(relevantInsertion)) scheduleSync();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
