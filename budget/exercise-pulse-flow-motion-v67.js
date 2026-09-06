(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase() !== 'pulse-home') return;
  if (window.__exercisePulseFlowMotionV68FinalInstalled) return;
  window.__exercisePulseFlowMotionV68FinalInstalled = true;

  var reduced = false;
  var rafId = 0;
  var lastSignalSync = 0;
  var restVisibleLastFrame = false;
  var restStartedAt = 0;
  var restTotalMs = 0;

  try {
    reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (_) {}

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    var index = Math.max(0, Number(state.exerciseIndex) || 0);
    return index < state.exercises.length ? state.exercises[index] : null;
  }

  function parseClock(text) {
    var p = String(text || '').trim().split(':');
    if (p.length !== 2) return 0;
    var m = parseInt(p[0],10);
    var s = parseInt(p[1],10);
    return Number.isFinite(m) && Number.isFinite(s) ? Math.max(0,m * 60 + s) : 0;
  }

  function configuredBetweenSeconds() {
    var state = getState();
    if (!state || !state.date) return 0;
    try {
      if (typeof window.getPlannedSessions !== 'function') return 0;
      var planned = window.getPlannedSessions() || {};
      var cfg = planned[state.date] && planned[state.date].betweenSets;
      return Math.max(0,Number(cfg && cfg.seconds) || 0);
    } catch (_) {
      return 0;
    }
  }

  function installStyles() {
    var existing = document.getElementById('exercise-pulse-flow-motion-v68-final-style');
    if (existing) {
      document.head.appendChild(existing);
      return;
    }

    var style = document.createElement('style');
    style.id = 'exercise-pulse-flow-motion-v68-final-style';
    style.textContent = `
      /* PASSFLÖDE: tiny glow dots only — no ring, border or boxed group layer. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment {
        background:transparent !important;
        border:0 !important;
        box-shadow:none !important;
        filter:none !important;
        overflow:visible !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::before {
        content:none !important;
        display:none !important;
        background:none !important;
        border:0 !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::after {
        content:'' !important;
        display:block !important;
        position:relative !important;
        z-index:3 !important;
        width:5px !important;
        height:5px !important;
        border:0 !important;
        outline:0 !important;
        border-radius:50% !important;
        background-image:none !important;
        filter:none !important;
        opacity:1 !important;
        transform:none !important;
        animation:none !important;
        transition:width .16s ease,height .16s ease,background-color .16s ease,box-shadow .18s ease !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength::after {
        background:rgba(251,146,60,.32) !important;
        box-shadow:0 0 4px rgba(251,146,60,.18),0 0 8px rgba(251,146,60,.07) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio::after {
        background:rgba(239,68,68,.32) !important;
        box-shadow:0 0 4px rgba(239,68,68,.19),0 0 8px rgba(239,68,68,.07) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done::after {
        width:6px !important;
        height:6px !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.strength::after {
        background:#FB923C !important;
        box-shadow:0 0 5px rgba(251,146,60,.82),0 0 11px rgba(251,146,60,.34),0 0 18px rgba(251,146,60,.12) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.cardio::after {
        background:#EF4444 !important;
        box-shadow:0 0 5px rgba(239,68,68,.84),0 0 11px rgba(239,68,68,.35),0 0 18px rgba(239,68,68,.12) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
        width:9px !important;
        height:9px !important;
        border:0 !important;
        outline:0 !important;
        filter:none !important;
        animation:pfCurrentDotV68 1.05s ease-in-out infinite !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current.strength::after {
        background:#FB923C !important;
        box-shadow:0 0 6px rgba(251,146,60,.98),0 0 14px rgba(251,146,60,.50),0 0 24px rgba(251,146,60,.18) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current.cardio::after {
        background:#EF4444 !important;
        box-shadow:0 0 6px rgba(239,68,68,.98),0 0 14px rgba(239,68,68,.50),0 0 24px rgba(239,68,68,.18) !important;
      }
      @keyframes pfCurrentDotV68 {
        0%,100% { transform:scale(1); }
        50% { transform:scale(1.08); }
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-start-v62:not(:first-child) {
        margin-left:5px !important;
      }

      /* CARDIO: full 260-degree arc at start, continuously drains to zero. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring {
        --pf-countdown-angle-v68:260deg;
        position:relative !important;
        border:0 !important;
        overflow:visible !important;
        background:radial-gradient(circle,rgba(var(--pf-rgb),.028) 0 48%,transparent 70%) !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-segments,
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring .session-countdown-core {
        display:none !important;
        visibility:hidden !important;
        opacity:0 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring::before {
        content:'' !important;
        display:block !important;
        position:absolute !important;
        inset:5px !important;
        border-radius:50% !important;
        background:conic-gradient(from 230deg,
          var(--pf-accent) 0 var(--pf-countdown-angle-v68),
          rgba(var(--pf-rgb),.10) var(--pf-countdown-angle-v68) 260deg,
          transparent 260deg 360deg) !important;
        -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3.4px),#000 calc(100% - 3px)) !important;
        mask:radial-gradient(farthest-side,transparent calc(100% - 3.4px),#000 calc(100% - 3px)) !important;
        filter:drop-shadow(0 0 5px rgba(var(--pf-rgb),.32)) !important;
        pointer-events:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring::after {
        content:none !important;
        display:none !important;
        animation:none !important;
      }

      /* REST: same 260-degree drain, cyan. */
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-segments,
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-core {
        display:none !important;
        visibility:hidden !important;
        opacity:0 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring {
        --pf-rest-countdown-angle-v68:260deg;
        position:relative !important;
        border:0 !important;
        overflow:visible !important;
        background:radial-gradient(circle,rgba(34,211,238,.028) 0 48%,transparent 70%) !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring::before {
        content:'' !important;
        display:block !important;
        position:absolute !important;
        inset:5px !important;
        border-radius:50% !important;
        background:conic-gradient(from 230deg,
          #22D3EE 0 var(--pf-rest-countdown-angle-v68),
          rgba(34,211,238,.10) var(--pf-rest-countdown-angle-v68) 260deg,
          transparent 260deg 360deg) !important;
        -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3.4px),#000 calc(100% - 3px)) !important;
        mask:radial-gradient(farthest-side,transparent calc(100% - 3.4px),#000 calc(100% - 3px)) !important;
        filter:drop-shadow(0 0 5px rgba(34,211,238,.30)) !important;
        pointer-events:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring::after {
        content:none !important;
        display:none !important;
        animation:none !important;
      }

      /* Keep the small ECG animation exactly as a continuous one-second sweep. */
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 {
        overflow:visible !important;
        opacity:1 !important;
        animation:none !important;
        filter:none !important;
        transform:none !important;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 svg { overflow:visible !important; }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 .pf-signal-base-v68 {
        fill:none !important;
        stroke:currentColor !important;
        stroke-width:1.15 !important;
        stroke-linecap:round !important;
        stroke-linejoin:round !important;
        opacity:.23 !important;
        filter:none !important;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 .pf-signal-sweep-v68 {
        fill:none !important;
        stroke:currentColor !important;
        stroke-width:1.75 !important;
        stroke-linecap:round !important;
        stroke-linejoin:round !important;
        stroke-dasharray:18 82 !important;
        opacity:.10;
        animation:pfSignalSweepV68 1s linear infinite !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-timer-signal-v62 { color:#22D3EE !important; }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62.pf-timer-signal-tick-v62 { animation:none !important; }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-sweep-v65,
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-base-v65 { animation:none !important; }
      @keyframes pfSignalSweepV68 {
        0% { stroke-dashoffset:18;opacity:.10;filter:drop-shadow(0 0 1px currentColor); }
        38% { opacity:.55; }
        50% { stroke-dashoffset:-32;opacity:1;filter:drop-shadow(0 0 2px currentColor) drop-shadow(0 0 7px currentColor) drop-shadow(0 0 13px currentColor); }
        62% { opacity:.60; }
        100% { stroke-dashoffset:-82;opacity:.10;filter:drop-shadow(0 0 1px currentColor); }
      }

      @media(prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after,
        html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 .pf-signal-sweep-v68 {
          animation:none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function enhanceSignal(signal) {
    if (!signal) return;
    var svg = signal.querySelector('svg');
    if (!svg) return;

    var base = svg.querySelector('.pf-signal-base-v68');
    if (!base) {
      base = svg.querySelector('.pf-signal-base-v67') || svg.querySelector('.pf-rest-base-v65') || svg.querySelector('path');
      if (!base) return;
      base.setAttribute('class','pf-signal-base-v68');
      base.setAttribute('pathLength','100');
    }

    svg.querySelectorAll('.pf-signal-sweep-v67,.pf-rest-sweep-v65').forEach(function (node) {
      node.remove();
    });

    if (!svg.querySelector('.pf-signal-sweep-v68')) {
      var sweep = base.cloneNode(true);
      sweep.setAttribute('class','pf-signal-sweep-v68');
      sweep.setAttribute('pathLength','100');
      svg.appendChild(sweep);
    }
  }

  function syncSignals() {
    document.querySelectorAll('.pf-timer-signal-v62').forEach(enhanceSignal);
  }

  function paintCardioArc(nowEpoch) {
    var ring = document.getElementById('session-countdown-ring');
    var state = getState();
    var exercise = currentExercise(state);
    if (!ring) return;

    var timed = !!(state && state.setRunning && state.setStartedAt && exercise && exercise.kind === 'cardio' && Number(exercise.time) > 0);
    if (!timed) {
      ring.style.setProperty('--pf-countdown-angle-v68','260deg');
      return;
    }

    var totalMs = Number(exercise.time) * 60000;
    var end = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : nowEpoch;
    var elapsed = Math.max(0,end - Number(state.setStartedAt));
    var ratio = totalMs > 0 ? Math.max(0,Math.min(1,(totalMs - elapsed) / totalMs)) : 0;
    ring.style.setProperty('--pf-countdown-angle-v68',(ratio * 260).toFixed(3) + 'deg');
  }

  function paintRestArc(nowEpoch) {
    var overlay = document.getElementById('session-between-overlay-v2');
    var ring = overlay && overlay.querySelector('.bs-ring');
    var visible = !!(overlay && ring && overlay.classList.contains('show'));

    if (!visible) {
      restVisibleLastFrame = false;
      restStartedAt = 0;
      restTotalMs = 0;
      return;
    }

    if (!restVisibleLastFrame) {
      restVisibleLastFrame = true;
      restStartedAt = nowEpoch;
      var shownEl = overlay.querySelector('.bs-value');
      var shownSeconds = parseClock(shownEl && shownEl.textContent);
      restTotalMs = Math.max(1000,(configuredBetweenSeconds() || shownSeconds || 60) * 1000);
      ring.style.setProperty('--pf-rest-countdown-angle-v68','260deg');
    }

    var elapsed = Math.max(0,nowEpoch - restStartedAt);
    var ratio = restTotalMs > 0 ? Math.max(0,Math.min(1,(restTotalMs - elapsed) / restTotalMs)) : 0;
    var value = overlay.querySelector('.bs-value');
    if (value && parseClock(value.textContent) <= 0) ratio = 0;
    ring.style.setProperty('--pf-rest-countdown-angle-v68',(ratio * 260).toFixed(3) + 'deg');
  }

  function animate(now) {
    var nowEpoch = Date.now();
    if (!reduced) {
      paintCardioArc(nowEpoch);
      paintRestArc(nowEpoch);
    }

    if (now - lastSignalSync > 220) {
      lastSignalSync = now;
      syncSignals();
      installStyles();
    }

    rafId = requestAnimationFrame(animate);
  }

  function activate() {
    installStyles();
    syncSignals();
    if (!rafId) rafId = requestAnimationFrame(animate);
    setTimeout(installStyles,180);
    setTimeout(installStyles,650);
    setTimeout(installStyles,1400);
  }

  var attempts = 0;
  (function waitForConcept() {
    attempts += 1;
    if (document.documentElement.classList.contains('exercise-concept-ready-v1')) {
      setTimeout(activate,110);
      return;
    }
    if (attempts < 400) setTimeout(waitForConcept,20);
  })();
})();