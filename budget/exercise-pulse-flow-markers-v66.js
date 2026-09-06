(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase() !== 'pulse-home') return;
  if (window.__exercisePulseFlowMotionV67Installed) return;
  window.__exercisePulseFlowMotionV67Installed = true;

  var reduced = false;
  var rafId = 0;
  var lastSignalSync = 0;
  try { reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_) {}

  function installStyles() {
    if (document.getElementById('exercise-pulse-flow-motion-v67-style')) return;

    var style = document.createElement('style');
    style.id = 'exercise-pulse-flow-motion-v67-style';
    style.textContent = `
      /* PASSFLÖDE — same luminous core/halo language as the 5 s playhead,
         but deliberately much smaller. No white border/ring. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::after {
        content:'' !important;
        display:block !important;
        position:relative !important;
        z-index:2 !important;
        width:7px !important;
        height:7px !important;
        border:0 !important;
        outline:0 !important;
        border-radius:50% !important;
        box-shadow:none !important;
        filter:none !important;
        transform:none !important;
        opacity:1 !important;
        animation:none !important;
        transition:width .16s ease,height .16s ease,filter .18s ease !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength::after {
        background:radial-gradient(circle,
          #FED7AA 0 17%,
          #FB923C 30%,
          rgba(251,146,60,.88) 43%,
          rgba(251,146,60,.45) 61%,
          rgba(251,146,60,.13) 77%,
          transparent 100%) !important;
        filter:drop-shadow(0 0 4px rgba(251,146,60,.48)) drop-shadow(0 0 8px rgba(251,146,60,.19)) !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio::after {
        background:radial-gradient(circle,
          #FCA5A5 0 17%,
          #EF4444 30%,
          rgba(239,68,68,.89) 43%,
          rgba(239,68,68,.46) 61%,
          rgba(239,68,68,.13) 77%,
          transparent 100%) !important;
        filter:drop-shadow(0 0 4px rgba(239,68,68,.50)) drop-shadow(0 0 8px rgba(239,68,68,.20)) !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done::after {
        width:8px !important;
        height:8px !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.strength::after {
        filter:drop-shadow(0 0 5px rgba(251,146,60,.70)) drop-shadow(0 0 11px rgba(251,146,60,.28)) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.cardio::after {
        filter:drop-shadow(0 0 5px rgba(239,68,68,.72)) drop-shadow(0 0 11px rgba(239,68,68,.29)) !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
        width:10px !important;
        height:10px !important;
        border:0 !important;
        outline:0 !important;
        box-shadow:none !important;
        animation:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current.strength::after {
        filter:drop-shadow(0 0 6px rgba(251,146,60,.92)) drop-shadow(0 0 14px rgba(251,146,60,.38)) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current.cardio::after {
        filter:drop-shadow(0 0 6px rgba(239,68,68,.94)) drop-shadow(0 0 14px rgba(239,68,68,.40)) !important;
      }

      /* CARDIO/VILA — keep the thin halo, but let one luminous playhead orbit
         continuously once per second. JS only changes these two custom props. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring::after,
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring::after {
        width:11px !important;
        height:11px !important;
        border:0 !important;
        outline:0 !important;
        border-radius:50% !important;
        box-shadow:none !important;
        animation:none !important;
        will-change:transform !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring::after {
        background:radial-gradient(circle,
          var(--pf-soft) 0 16%,
          var(--pf-accent) 30%,
          rgba(var(--pf-rgb),.88) 43%,
          rgba(var(--pf-rgb),.43) 61%,
          rgba(var(--pf-rgb),.11) 78%,
          transparent 100%) !important;
        filter:drop-shadow(0 0 6px rgba(var(--pf-rgb),.72)) drop-shadow(0 0 12px rgba(var(--pf-rgb),.28)) !important;
        transform:translate(-50%,-50%) rotate(var(--pf-orbit-angle,0deg)) translateY(var(--pf-orbit-radius,-64px)) !important;
      }

      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring::after {
        color:#22D3EE !important;
        background:radial-gradient(circle,
          #ECFEFF 0 15%,
          #67E8F9 28%,
          #22D3EE 41%,
          rgba(34,211,238,.44) 60%,
          rgba(34,211,238,.11) 78%,
          transparent 100%) !important;
        filter:drop-shadow(0 0 6px rgba(34,211,238,.74)) drop-shadow(0 0 12px rgba(34,211,238,.30)) !important;
        transform:translate(-50%,-50%) rotate(var(--pf-rest-orbit-angle,0deg)) translateY(var(--pf-rest-orbit-radius,-66px)) !important;
      }

      /* One complete ECG sweep per second for both cardio and rest.
         The underlying path stays faint; the bright copy travels L->R. */
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 {
        overflow:visible !important;
        opacity:1 !important;
        animation:none !important;
        filter:none !important;
        transform:none !important;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 svg {
        overflow:visible !important;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 .pf-signal-base-v67 {
        fill:none !important;
        stroke:currentColor !important;
        stroke-width:1.15 !important;
        opacity:.24 !important;
        filter:none !important;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 .pf-signal-sweep-v67 {
        fill:none !important;
        stroke:currentColor !important;
        stroke-width:1.75 !important;
        stroke-linecap:round !important;
        stroke-dasharray:18 82 !important;
        opacity:.15;
        animation:pfSignalSweepV67 1s linear infinite !important;
        will-change:stroke-dashoffset,opacity,filter;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-timer-signal-v62 {
        color:#22D3EE !important;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62.pf-timer-signal-tick-v62,
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-sweep-v65.pf-rest-sweep-run-v65 {
        animation:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-base-v65,
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-sweep-v65 {
        display:none !important;
      }

      @keyframes pfSignalSweepV67 {
        0% {
          stroke-dashoffset:18;
          opacity:.12;
          filter:drop-shadow(0 0 1px currentColor);
        }
        38% { opacity:.58; }
        50% {
          stroke-dashoffset:-32;
          opacity:1;
          filter:drop-shadow(0 0 2px currentColor) drop-shadow(0 0 7px currentColor) drop-shadow(0 0 13px currentColor);
        }
        62% { opacity:.62; }
        100% {
          stroke-dashoffset:-82;
          opacity:.12;
          filter:drop-shadow(0 0 1px currentColor);
        }
      }

      @media(prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 .pf-signal-sweep-v67 {
          animation:none !important;
          opacity:.55 !important;
          stroke-dashoffset:-32 !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function enhanceSignal(signal) {
    if (!signal) return;
    var svg = signal.querySelector('svg');
    if (!svg) return;

    svg.querySelectorAll('.pf-rest-base-v65,.pf-rest-sweep-v65').forEach(function (node) { node.remove(); });

    var base = svg.querySelector('.pf-signal-base-v67');
    if (!base) {
      var source = svg.querySelector('path');
      if (!source) return;
      source.classList.add('pf-signal-base-v67');
      source.setAttribute('pathLength','100');
      base = source;
    }

    if (!svg.querySelector('.pf-signal-sweep-v67')) {
      var sweep = base.cloneNode(true);
      sweep.classList.remove('pf-signal-base-v67');
      sweep.classList.add('pf-signal-sweep-v67');
      sweep.setAttribute('pathLength','100');
      svg.appendChild(sweep);
    }
  }

  function syncSignals() {
    document.querySelectorAll('html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62').forEach(enhanceSignal);
  }

  function setOrbit(ring, angle, propName, radiusName) {
    if (!ring) return;
    ring.style.setProperty(propName, angle.toFixed(3) + 'deg');
    var width = ring.getBoundingClientRect().width;
    if (width > 0) ring.style.setProperty(radiusName, (-Math.max(10,width / 2 - 5)).toFixed(2) + 'px');
  }

  function animate(now) {
    var phase = (now % 1000) / 1000;
    var angle = phase * 360;

    if (!reduced) {
      var cardio = document.getElementById('session-countdown-ring');
      if (cardio && cardio.offsetParent !== null) setOrbit(cardio,angle,'--pf-orbit-angle','--pf-orbit-radius');

      var rest = document.querySelector('#session-between-overlay-v2 .bs-ring');
      if (rest && rest.offsetParent !== null) setOrbit(rest,angle,'--pf-rest-orbit-angle','--pf-rest-orbit-radius');
    }

    if (now - lastSignalSync > 250) {
      lastSignalSync = now;
      syncSignals();
    }

    rafId = requestAnimationFrame(animate);
  }

  function install() {
    installStyles();
    syncSignals();
    if (!rafId) rafId = requestAnimationFrame(animate);
  }

  var attempts = 0;
  (function waitForPulseFlow() {
    attempts += 1;
    if (document.documentElement.classList.contains('exercise-concept-ready-v1') &&
        document.getElementById('exercise-pulse-flow-timers-v62-style')) {
      install();
      return;
    }
    if (attempts < 300) setTimeout(waitForPulseFlow,20);
  })();
})();
