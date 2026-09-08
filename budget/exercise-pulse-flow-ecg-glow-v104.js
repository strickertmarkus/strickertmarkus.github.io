(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowEcgGlowV104Installed) return;
  window.__exercisePulseFlowEcgGlowV104Installed = true;

  var STYLE_ID = 'exercise-pulse-flow-ecg-glow-v104-style';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var scheduled = false;

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Pulse Flow ECG: make the resting/non-pulsing trace much quieter so the
         travelling pulse reads clearly, while keeping the geometry unchanged. */
      html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-axis-v58 {
        stroke:rgba(var(--pf-rgb),.045) !important;
      }
      html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-ghost-v58 {
        stroke:currentColor !important;
        stroke-width:1.05 !important;
        opacity:.075 !important;
      }
      html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-trace-v58 {
        stroke-width:2.55 !important;
        opacity:1 !important;
      }

      /* Small bright marker at the leading edge of the animated ECG pulse.
         It uses the same path and cadence as the trace, offset by the 175-unit
         dash length so it stays at the front rather than following behind. */
      html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-head-v104 {
        fill:none !important;
        vector-effect:non-scaling-stroke;
        stroke:var(--pf-soft) !important;
        stroke-width:4.6 !important;
        stroke-linecap:round !important;
        stroke-linejoin:round !important;
        stroke-dasharray:.01 999.99;
        stroke-dashoffset:-175;
        opacity:.96 !important;
        pointer-events:none;
        animation:pulse-flow-head-sweep-v104 var(--pf-speed) linear infinite;
        will-change:stroke-dashoffset;
      }
      @keyframes pulse-flow-head-sweep-v104 {
        to { stroke-dashoffset:-1175; }
      }

      /* Slightly stronger glow on the active portion of the between-set timer.
         The inactive ring is intentionally left untouched. */
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2.pulse-flow-rest-v58 .bs-segment.active {
        background:var(--pf-accent) !important;
        box-shadow:
          0 0 5px rgba(var(--pf-rgb),.76),
          0 0 11px rgba(var(--pf-rgb),.28) !important;
        filter:brightness(1.08) !important;
      }

      @media (prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-head-v104 {
          animation:none !important;
          opacity:0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePulseHeads() {
    installStyle();

    document.querySelectorAll('.pulse-flow-band-v58 svg').forEach(function (svg) {
      var trace = svg.querySelector('.pulse-flow-trace-v58');
      if (!trace) return;

      /* Increase only the active trace's existing SVG glow a little. */
      var filterId = trace.getAttribute('filter');
      if (filterId) {
        var blur = svg.querySelector('defs filter feGaussianBlur');
        if (blur && blur.getAttribute('data-pf-v104') !== 'true') {
          blur.setAttribute('stdDeviation', '3.15');
          blur.setAttribute('data-pf-v104', 'true');
        }
      }

      if (svg.querySelector('.pulse-flow-head-v104')) return;

      var head = trace.cloneNode(false);
      head.setAttribute('class', 'pulse-flow-head-v104');
      head.setAttribute('aria-hidden', 'true');
      head.removeAttribute('stroke');
      trace.insertAdjacentElement('afterend', head);
    });
  }

  function scheduleEnsure() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      ensurePulseHeads();
    });
  }

  installStyle();
  scheduleEnsure();

  var observer = new MutationObserver(scheduleEnsure);
  observer.observe(document.documentElement, { childList:true, subtree:true });
})();
