(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseTimerFocusV147Installed) return;
  window.__exerciseTimerFocusV147Installed = true;

  var reduced = false;
  var lastFrame = 0;
  try { reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_) {}

  function state() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(s) {
    if (!s || !Array.isArray(s.exercises)) return null;
    return s.exercises[Math.max(0, Number(s.exerciseIndex) || 0)] || null;
  }

  function addStyle() {
    if (document.getElementById('exercise-timer-focus-v147-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-timer-focus-v147-style';
    style.textContent = `
      /* Match the approved compact Pulse Flow timer's iOS-safe luminous arc. */
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ring-v145 {
        isolation:isolate!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ring-v145::after {
        content:''!important;
        position:absolute!important;
        inset:13%!important;
        z-index:-1!important;
        border-radius:50%!important;
        pointer-events:none!important;
        background:radial-gradient(circle,rgba(239,68,68,.105) 0%,rgba(239,68,68,.055) 38%,rgba(239,68,68,.016) 62%,transparent 75%)!important;
        filter:blur(12px)!important;
        opacity:.9!important;
        animation:pfFocusHaloPulseV147 2.2s ease-in-out infinite!important;
      }
      @keyframes pfFocusHaloPulseV147 {
        0%,100%{opacity:.66;transform:scale(.97)}
        50%{opacity:1;transform:scale(1.035)}
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-track-v146 {
        stroke:rgba(239,68,68,.075)!important;
        stroke-width:2.4!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-glow-wide-v147,
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-glow-mid-v147 {
        fill:none!important;
        stroke-linecap:round!important;
        vector-effect:non-scaling-stroke!important;
        pointer-events:none!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-glow-wide-v147 {
        stroke:rgba(239,68,68,.13)!important;
        stroke-width:13!important;
        filter:blur(5px)!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-glow-mid-v147 {
        stroke:rgba(239,68,68,.26)!important;
        stroke-width:6.5!important;
        filter:blur(2.2px)!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-progress-v146 {
        stroke:rgba(239,68,68,.88)!important;
        stroke-width:2.8!important;
        filter:drop-shadow(0 0 2px rgba(239,68,68,.98)) drop-shadow(0 0 5px rgba(239,68,68,.72)) drop-shadow(0 0 12px rgba(239,68,68,.34))!important;
        -webkit-filter:drop-shadow(0 0 2px rgba(239,68,68,.98)) drop-shadow(0 0 5px rgba(239,68,68,.72)) drop-shadow(0 0 12px rgba(239,68,68,.34))!important;
        transition:none!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-marker-v146 {display:none!important}
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-marker-v147 {
        fill:#FFD0D8!important;
        stroke:rgba(255,255,255,.72)!important;
        stroke-width:.45!important;
        vector-effect:non-scaling-stroke!important;
        filter:drop-shadow(0 0 2px rgba(255,164,177,1)) drop-shadow(0 0 6px rgba(239,68,68,.92)) drop-shadow(0 0 13px rgba(239,68,68,.56))!important;
        -webkit-filter:drop-shadow(0 0 2px rgba(255,164,177,1)) drop-shadow(0 0 6px rgba(239,68,68,.92)) drop-shadow(0 0 13px rgba(239,68,68,.56))!important;
      }

      /* Animated mini ECG: quiet baseline + two luminous sweeps, same visual logic as compact timer. */
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-v146 {
        width:100px!important;height:24px!important;margin:8px auto 0!important;color:#EF4444!important;opacity:1!important;
        filter:drop-shadow(0 0 1.6px rgba(239,68,68,.94)) drop-shadow(0 0 6px rgba(239,68,68,.48))!important;
        -webkit-filter:drop-shadow(0 0 1.6px rgba(239,68,68,.94)) drop-shadow(0 0 6px rgba(239,68,68,.48))!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-v146 svg {overflow:visible!important}
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-v146 .ecg-base-v147 {
        fill:none!important;stroke:currentColor!important;stroke-width:.9!important;stroke-opacity:.14!important;
        stroke-linecap:round!important;stroke-linejoin:round!important;vector-effect:non-scaling-stroke!important
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-v146 .ecg-sweep-v147 {
        fill:none!important;stroke:#EF4444!important;stroke-width:1.9!important;stroke-opacity:1!important;
        stroke-linecap:round!important;stroke-linejoin:round!important;vector-effect:non-scaling-stroke!important;
        stroke-dasharray:23 77!important;animation:pfFocusEcgSweepV147 1.05s linear infinite!important;
        will-change:stroke-dashoffset!important
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-v146 .ecg-sweep-b-v147 {animation-delay:-.525s!important;opacity:.48!important}
      @keyframes pfFocusEcgSweepV147 {to{stroke-dashoffset:-100}}

      /* The larger rest surface keeps the same luminous treatment as the compact rest timer. */
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80) .pf-arc-progress-v80,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) .pf-arc-progress-v80 {
        filter:drop-shadow(0 0 3.8px rgba(var(--pf-between-rgb),.82)) drop-shadow(0 0 11px rgba(var(--pf-between-rgb),.40))!important;
        -webkit-filter:drop-shadow(0 0 3.8px rgba(var(--pf-between-rgb),.82)) drop-shadow(0 0 11px rgba(var(--pf-between-rgb),.40))!important;
      }
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80)::after,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80)::after {
        content:''!important;position:absolute!important;inset:14%!important;border-radius:50%!important;pointer-events:none!important;
        background:radial-gradient(circle,rgba(var(--pf-between-rgb),.095),rgba(var(--pf-between-rgb),.04) 43%,transparent 72%)!important;
        filter:blur(11px)!important;opacity:.84!important
      }

      @media(prefers-reduced-motion:reduce){
        #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ring-v145::after,
        #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-v146 .ecg-sweep-v147{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSurface() {
    var overlay = document.getElementById('cardio-focus-v145');
    if (!overlay) return null;
    var ring = overlay.querySelector('.cardio-focus-ring-v145');
    var svg = ring && ring.querySelector('.cardio-focus-arc-v146');
    if (!ring || !svg) return overlay;

    var ns = 'http://www.w3.org/2000/svg';
    var progress = svg.querySelector('.cardio-focus-progress-v146');
    var track = svg.querySelector('.cardio-focus-track-v146');
    if (progress && !svg.querySelector('.cardio-focus-glow-wide-v147')) {
      var wide = document.createElementNS(ns,'circle');
      wide.setAttribute('class','cardio-focus-glow-wide-v147');
      wide.setAttribute('cx','100');wide.setAttribute('cy','100');wide.setAttribute('r','92');wide.setAttribute('pathLength','100');
      var mid = document.createElementNS(ns,'circle');
      mid.setAttribute('class','cardio-focus-glow-mid-v147');
      mid.setAttribute('cx','100');mid.setAttribute('cy','100');mid.setAttribute('r','92');mid.setAttribute('pathLength','100');
      svg.insertBefore(wide,progress);
      svg.insertBefore(mid,progress);
      if (track && track.parentNode === svg) svg.insertBefore(track,wide);
    }
    if (!svg.querySelector('.cardio-focus-marker-v147')) {
      var marker = document.createElementNS(ns,'circle');
      marker.setAttribute('class','cardio-focus-marker-v147');
      marker.setAttribute('cx','192');marker.setAttribute('cy','100');marker.setAttribute('r','3.0');
      svg.appendChild(marker);
    }

    var ecg = ring.querySelector('.cardio-focus-ecg-v146');
    if (ecg && ecg.dataset.v147 !== 'true') {
      ecg.dataset.v147 = 'true';
      var d = 'M1 12H18L23 8L28 16L35 3L42 18L48 10L54 12H91';
      ecg.innerHTML = '<svg viewBox="0 0 92 22" preserveAspectRatio="none" aria-hidden="true">' +
        '<path class="ecg-base-v147" pathLength="100" d="'+d+'"></path>' +
        '<path class="ecg-sweep-v147" pathLength="100" d="'+d+'"></path>' +
        '<path class="ecg-sweep-v147 ecg-sweep-b-v147" pathLength="100" d="'+d+'"></path>' +
      '</svg>';
    }
    return overlay;
  }

  function progressRatio() {
    var s = state(), ex = currentExercise(s);
    if (!s || !ex || ex.kind !== 'cardio' || !s.setStartedAt || !(Number(ex.time) > 0)) return null;
    var end = s.__hypePaused && s.__hypePausedAt ? Number(s.__hypePausedAt) : Date.now();
    var elapsed = Math.max(0,(end - Number(s.setStartedAt)) / 1000);
    var total = Math.max(1,Number(ex.time) * 60);
    return Math.max(0,Math.min(1,(total - elapsed) / total));
  }

  function syncArc() {
    var overlay = ensureSurface();
    if (!overlay || !overlay.classList.contains('show')) return;
    var ratio = progressRatio();
    if (ratio === null) return;
    var svg = overlay.querySelector('.cardio-focus-arc-v146');
    if (!svg) return;
    var progress = svg.querySelector('.cardio-focus-progress-v146');
    var wide = svg.querySelector('.cardio-focus-glow-wide-v147');
    var mid = svg.querySelector('.cardio-focus-glow-mid-v147');
    var marker = svg.querySelector('.cardio-focus-marker-v147');
    var dash = (ratio * 100).toFixed(4) + ' 100';
    if (progress) progress.setAttribute('stroke-dasharray',dash);
    if (wide) wide.setAttribute('stroke-dasharray',dash);
    if (mid) mid.setAttribute('stroke-dasharray',dash);

    /* Use the actual SVG geometry rather than angle math. This pins the dot to
       the rendered arc endpoint and removes the apparent off-arc motion. */
    if (marker && progress && typeof progress.getTotalLength === 'function' && typeof progress.getPointAtLength === 'function') {
      try {
        var length = progress.getTotalLength();
        var point = progress.getPointAtLength(Math.max(0,Math.min(length,length * ratio)));
        marker.setAttribute('cx',point.x.toFixed(3));
        marker.setAttribute('cy',point.y.toFixed(3));
      } catch (_) {}
    }
  }

  function frame(now) {
    if (!lastFrame || now-lastFrame > 32) {
      lastFrame = now;
      syncArc();
    }
    requestAnimationFrame(frame);
  }

  function install() {
    addStyle();
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      ensureSurface();
      if (document.getElementById('cardio-focus-v145') || attempts > 30) clearInterval(timer);
    },100);
    ensureSurface();
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
