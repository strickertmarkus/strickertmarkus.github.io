(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase() !== 'pulse-home') return;
  if (window.__exercisePulseFlowMotionV69FinalInstalled) return;
  window.__exercisePulseFlowMotionV69FinalInstalled = true;

  var reduced = false;
  var rafId = 0;
  var lastSyncAt = 0;
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
    var m = parseInt(p[0], 10);
    var s = parseInt(p[1], 10);
    return Number.isFinite(m) && Number.isFinite(s) ? Math.max(0, m * 60 + s) : 0;
  }

  function configuredBetweenSeconds() {
    var state = getState();
    if (!state || !state.date) return 0;
    try {
      if (typeof window.getPlannedSessions !== 'function') return 0;
      var planned = window.getPlannedSessions() || {};
      var cfg = planned[state.date] && planned[state.date].betweenSets;
      return Math.max(0, Number(cfg && cfg.seconds) || 0);
    } catch (_) {
      return 0;
    }
  }

  function installStyles() {
    var existing = document.getElementById('exercise-pulse-flow-motion-v69-final-style');
    if (existing) {
      document.head.appendChild(existing);
      return;
    }

    var style = document.createElement('style');
    style.id = 'exercise-pulse-flow-motion-v69-final-style';
    style.textContent = `
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment {
        background:transparent !important;
        border:0 !important;
        outline:0 !important;
        box-shadow:none !important;
        filter:none !important;
        overflow:visible !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::before {
        content:none !important;
        display:none !important;
        border:0 !important;
        background:none !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::after {
        content:'' !important;
        display:block !important;
        position:relative !important;
        z-index:3 !important;
        width:4px !important;
        height:4px !important;
        border:0 !important;
        outline:0 !important;
        border-radius:50% !important;
        background:#26303C !important;
        background-image:none !important;
        box-shadow:none !important;
        filter:none !important;
        opacity:1 !important;
        transform:none !important;
        animation:none !important;
        transition:width .16s ease,height .16s ease,background-color .16s ease,box-shadow .18s ease,transform .18s ease !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done::after {
        width:4px !important;
        height:4px !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.strength::after {
        background:#FB923C !important;
        box-shadow:0 0 4px rgba(251,146,60,.78),0 0 9px rgba(251,146,60,.30),0 0 15px rgba(251,146,60,.10) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.cardio::after {
        background:#EF4444 !important;
        box-shadow:0 0 4px rgba(239,68,68,.80),0 0 9px rgba(239,68,68,.31),0 0 15px rgba(239,68,68,.10) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
        width:8px !important;
        height:8px !important;
        border:0 !important;
        outline:0 !important;
        animation:pfCurrentDotV69 1.05s ease-in-out infinite !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current.strength::after {
        background:#FB923C !important;
        box-shadow:0 0 6px rgba(251,146,60,.98),0 0 14px rgba(251,146,60,.50),0 0 24px rgba(251,146,60,.18) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current.cardio::after {
        background:#EF4444 !important;
        box-shadow:0 0 6px rgba(239,68,68,.98),0 0 14px rgba(239,68,68,.50),0 0 24px rgba(239,68,68,.18) !important;
      }
      @keyframes pfCurrentDotV69 {
        0%,100% { transform:scale(1); }
        50% { transform:scale(1.07); }
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-start-v62:not(:first-child) {
        margin-left:5px !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring {
        --pf-countdown-angle-v69:260deg;
        --pf-countdown-tail-start-v69:238deg;
        --pf-countdown-tail-mid-v69:252deg;
        --pf-countdown-marker-opacity-v69:1;
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
          rgba(var(--pf-rgb),.62) 0 var(--pf-countdown-angle-v69),
          rgba(var(--pf-rgb),.09) var(--pf-countdown-angle-v69) 260deg,
          transparent 260deg 360deg) !important;
        -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3.4px),#000 calc(100% - 3px)) !important;
        mask:radial-gradient(farthest-side,transparent calc(100% - 3.4px),#000 calc(100% - 3px)) !important;
        filter:drop-shadow(0 0 5px rgba(var(--pf-rgb),.25)) !important;
        pointer-events:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring::after {
        content:none !important;
        display:none !important;
      }

      .pf-arc-trail-v69,
      .pf-arc-marker-v69 {
        pointer-events:none !important;
        position:absolute !important;
        z-index:4 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring .pf-arc-trail-v69 {
        inset:5px !important;
        border-radius:50% !important;
        background:conic-gradient(from 230deg,
          transparent 0 var(--pf-countdown-tail-start-v69),
          rgba(var(--pf-rgb),.03) var(--pf-countdown-tail-start-v69),
          rgba(var(--pf-rgb),.28) var(--pf-countdown-tail-mid-v69),
          var(--pf-soft) var(--pf-countdown-angle-v69),
          transparent var(--pf-countdown-angle-v69) 360deg) !important;
        -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4.7px),#000 calc(100% - 2.4px)) !important;
        mask:radial-gradient(farthest-side,transparent calc(100% - 4.7px),#000 calc(100% - 2.4px)) !important;
        filter:drop-shadow(0 0 7px rgba(var(--pf-rgb),.42)) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring .pf-arc-marker-v69 {
        left:50% !important;
        top:50% !important;
        width:9px !important;
        height:9px !important;
        margin:-4.5px 0 0 -4.5px !important;
        border:0 !important;
        border-radius:50% !important;
        opacity:var(--pf-countdown-marker-opacity-v69) !important;
        background:radial-gradient(circle,#FFF 0 8%,var(--pf-soft) 20%,var(--pf-accent) 43%,rgba(var(--pf-rgb),.42) 68%,transparent 100%) !important;
        box-shadow:0 0 7px rgba(var(--pf-rgb),.86),0 0 15px rgba(var(--pf-rgb),.34) !important;
        transform:rotate(calc(230deg + var(--pf-countdown-angle-v69))) translateY(-68px) !important;
        transform-origin:4.5px 4.5px !important;
      }

      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 {
        --pf-between-accent:#22D3EE;
        --pf-between-soft:#CFFAFE;
        --pf-between-rgb:34,211,238;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2[data-between-type="custom"] {
        --pf-between-accent:#EF4444;
        --pf-between-soft:#FCA5A5;
        --pf-between-rgb:239,68,68;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-segments,
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-core {
        display:none !important;
        visibility:hidden !important;
        opacity:0 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring {
        --pf-rest-countdown-angle-v69:260deg;
        --pf-rest-tail-start-v69:238deg;
        --pf-rest-tail-mid-v69:252deg;
        --pf-rest-marker-opacity-v69:1;
        position:relative !important;
        border:0 !important;
        overflow:visible !important;
        background:radial-gradient(circle,rgba(var(--pf-between-rgb),.028) 0 48%,transparent 70%) !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring::before {
        content:'' !important;
        display:block !important;
        position:absolute !important;
        inset:5px !important;
        border-radius:50% !important;
        background:conic-gradient(from 230deg,
          rgba(var(--pf-between-rgb),.62) 0 var(--pf-rest-countdown-angle-v69),
          rgba(var(--pf-between-rgb),.09) var(--pf-rest-countdown-angle-v69) 260deg,
          transparent 260deg 360deg) !important;
        -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3.4px),#000 calc(100% - 3px)) !important;
        mask:radial-gradient(farthest-side,transparent calc(100% - 3.4px),#000 calc(100% - 3px)) !important;
        filter:drop-shadow(0 0 5px rgba(var(--pf-between-rgb),.25)) !important;
        pointer-events:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring::after {
        content:none !important;
        display:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring .pf-arc-trail-v69 {
        inset:5px !important;
        border-radius:50% !important;
        background:conic-gradient(from 230deg,
          transparent 0 var(--pf-rest-tail-start-v69),
          rgba(var(--pf-between-rgb),.03) var(--pf-rest-tail-start-v69),
          rgba(var(--pf-between-rgb),.28) var(--pf-rest-tail-mid-v69),
          var(--pf-between-soft) var(--pf-rest-countdown-angle-v69),
          transparent var(--pf-rest-countdown-angle-v69) 360deg) !important;
        -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4.7px),#000 calc(100% - 2.4px)) !important;
        mask:radial-gradient(farthest-side,transparent calc(100% - 4.7px),#000 calc(100% - 2.4px)) !important;
        filter:drop-shadow(0 0 7px rgba(var(--pf-between-rgb),.42)) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring .pf-arc-marker-v69 {
        left:50% !important;
        top:50% !important;
        width:9px !important;
        height:9px !important;
        margin:-4.5px 0 0 -4.5px !important;
        border:0 !important;
        border-radius:50% !important;
        opacity:var(--pf-rest-marker-opacity-v69) !important;
        background:radial-gradient(circle,#FFF 0 8%,var(--pf-between-soft) 20%,var(--pf-between-accent) 43%,rgba(var(--pf-between-rgb),.42) 68%,transparent 100%) !important;
        box-shadow:0 0 7px rgba(var(--pf-between-rgb),.86),0 0 15px rgba(var(--pf-between-rgb),.34) !important;
        transform:rotate(calc(230deg + var(--pf-rest-countdown-angle-v69))) translateY(-70px) !important;
        transform-origin:4.5px 4.5px !important;
      }

      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 {
        display:block !important;
        width:42px !important;
        height:9px !important;
        margin:5px auto 1px !important;
        overflow:visible !important;
        color:var(--pf-accent,currentColor) !important;
        opacity:1 !important;
        animation:none !important;
        filter:none !important;
        transform:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-timer-signal-v62 {
        color:var(--pf-between-accent) !important;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 svg {
        display:block !important;
        width:100% !important;
        height:100% !important;
        overflow:visible !important;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 .pf-signal-base-v69 {
        fill:none !important;
        stroke:currentColor !important;
        stroke-width:1.12 !important;
        stroke-linecap:round !important;
        stroke-linejoin:round !important;
        opacity:.22 !important;
        filter:none !important;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 .pf-signal-sweep-v69 {
        fill:none !important;
        stroke:currentColor !important;
        stroke-width:1.75 !important;
        stroke-linecap:round !important;
        stroke-linejoin:round !important;
        stroke-dasharray:18 82 !important;
        opacity:.10;
        animation:pfSignalSweepV69 1s linear infinite !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2[data-between-type="rest"] .pf-signal-sweep-v69 {
        animation-duration:2s !important;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 .pf-signal-marker-v69 {
        fill:currentColor !important;
        stroke:none !important;
        opacity:.95 !important;
        filter:drop-shadow(0 0 1.5px currentColor) drop-shadow(0 0 4px currentColor) !important;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62.pf-timer-signal-tick-v62,
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-sweep-v65.pf-rest-sweep-run-v65 {
        animation:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-base-v65,
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-sweep-v65 {
        display:none !important;
      }
      @keyframes pfSignalSweepV69 {
        0% { stroke-dashoffset:18;opacity:.10;filter:drop-shadow(0 0 1px currentColor); }
        38% { opacity:.55; }
        50% { stroke-dashoffset:-32;opacity:1;filter:drop-shadow(0 0 2px currentColor) drop-shadow(0 0 7px currentColor) drop-shadow(0 0 13px currentColor); }
        62% { opacity:.60; }
        100% { stroke-dashoffset:-82;opacity:.10;filter:drop-shadow(0 0 1px currentColor); }
      }

      @media(max-width:600px) {
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring .pf-arc-marker-v69 {
          transform:rotate(calc(230deg + var(--pf-countdown-angle-v69))) translateY(-64px) !important;
        }
        html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring .pf-arc-marker-v69 {
          transform:rotate(calc(230deg + var(--pf-rest-countdown-angle-v69))) translateY(-66px) !important;
        }
      }

      @media(prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after,
        html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 .pf-signal-sweep-v69 {
          animation:none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureArcDecor(ring) {
    if (!ring) return;
    if (!ring.querySelector('.pf-arc-trail-v69')) {
      var trail = document.createElement('span');
      trail.className = 'pf-arc-trail-v69';
      trail.setAttribute('aria-hidden', 'true');
      ring.appendChild(trail);
    }
    if (!ring.querySelector('.pf-arc-marker-v69')) {
      var marker = document.createElement('span');
      marker.className = 'pf-arc-marker-v69';
      marker.setAttribute('aria-hidden', 'true');
      ring.appendChild(marker);
    }
  }

  function ensureSignal(copy) {
    if (!copy) return null;
    var signal = copy.querySelector('.pf-timer-signal-v62');
    if (!signal) {
      signal = document.createElement('span');
      signal.className = 'pf-timer-signal-v62';
      signal.setAttribute('aria-hidden', 'true');
      signal.innerHTML = '<svg viewBox="0 0 42 9" focusable="false"><path d="M0 5 H10 L13 3.7 L16 6.1 L20 1 L24 8 L28 4.8 H42"></path></svg>';
      var label = copy.querySelector('.session-countdown-label,.bs-label');
      if (label) label.insertAdjacentElement('beforebegin', signal);
      else copy.appendChild(signal);
    }
    return signal;
  }

  function enhanceSignal(signal) {
    if (!signal) return;
    var svg = signal.querySelector('svg');
    if (!svg) return;

    var base = svg.querySelector('.pf-signal-base-v69');
    if (!base) {
      base = svg.querySelector('.pf-signal-base-v68') ||
             svg.querySelector('.pf-signal-base-v67') ||
             svg.querySelector('.pf-rest-base-v65') ||
             svg.querySelector('path');
      if (!base) return;
      base.setAttribute('class', 'pf-signal-base-v69');
      base.setAttribute('pathLength', '100');
    }

    svg.querySelectorAll('.pf-signal-sweep-v68,.pf-signal-sweep-v67,.pf-rest-sweep-v65').forEach(function (node) {
      node.remove();
    });

    if (!svg.querySelector('.pf-signal-sweep-v69')) {
      var sweep = base.cloneNode(true);
      sweep.setAttribute('class', 'pf-signal-sweep-v69');
      sweep.setAttribute('pathLength', '100');
      svg.appendChild(sweep);
    }

    if (!svg.querySelector('.pf-signal-marker-v69')) {
      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('class', 'pf-signal-marker-v69');
      dot.setAttribute('r', '1.15');
      dot.setAttribute('cx', '0');
      dot.setAttribute('cy', '5');
      svg.appendChild(dot);
    }
  }

  function syncSurfaces() {
    var cardioRing = document.getElementById('session-countdown-ring');
    if (cardioRing) {
      ensureArcDecor(cardioRing);
      var cardioCopy = cardioRing.querySelector('.session-countdown-copy');
      enhanceSignal(ensureSignal(cardioCopy));
    }

    var overlay = document.getElementById('session-between-overlay-v2');
    var restRing = overlay && overlay.querySelector('.bs-ring');
    if (restRing) {
      ensureArcDecor(restRing);
      var restCopy = restRing.querySelector('.bs-copy');
      enhanceSignal(ensureSignal(restCopy));
    }

    document.querySelectorAll('.pf-timer-signal-v62').forEach(enhanceSignal);
  }

  function setArcVars(ring, angle, prefix) {
    var safe = Math.max(0, Math.min(260, angle));
    var tailStart = Math.max(0, safe - 24);
    var tailMid = Math.max(0, safe - 8);
    ring.style.setProperty('--' + prefix + '-angle-v69', safe.toFixed(3) + 'deg');
    ring.style.setProperty('--' + prefix + '-tail-start-v69', tailStart.toFixed(3) + 'deg');
    ring.style.setProperty('--' + prefix + '-tail-mid-v69', tailMid.toFixed(3) + 'deg');
    ring.style.setProperty('--' + prefix + '-marker-opacity-v69', safe > 0.8 ? '1' : '0');
  }

  function paintCardioArc(nowEpoch) {
    var ring = document.getElementById('session-countdown-ring');
    var state = getState();
    var exercise = currentExercise(state);
    if (!ring) return;

    var timed = !!(state && state.setRunning && state.setStartedAt && exercise && exercise.kind === 'cardio' && Number(exercise.time) > 0);
    if (!timed) {
      setArcVars(ring, 260, 'pf-countdown');
      return;
    }

    var totalMs = Number(exercise.time) * 60000;
    var end = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : nowEpoch;
    var elapsed = Math.max(0, end - Number(state.setStartedAt));
    var ratio = totalMs > 0 ? Math.max(0, Math.min(1, (totalMs - elapsed) / totalMs)) : 0;
    setArcVars(ring, ratio * 260, 'pf-countdown');
  }

  function paintBetweenArc(nowEpoch) {
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
      restTotalMs = Math.max(1000, (configuredBetweenSeconds() || shownSeconds || 60) * 1000);
      setArcVars(ring, 260, 'pf-rest-countdown');
    }

    var elapsed = Math.max(0, nowEpoch - restStartedAt);
    var ratio = restTotalMs > 0 ? Math.max(0, Math.min(1, (restTotalMs - elapsed) / restTotalMs)) : 0;
    var value = overlay.querySelector('.bs-value');
    if (value && parseClock(value.textContent) <= 0) ratio = 0;
    setArcVars(ring, ratio * 260, 'pf-rest-countdown');
  }

  function moveSignalMarker(signal, phase) {
    if (!signal) return;
    var svg = signal.querySelector('svg');
    var path = svg && svg.querySelector('.pf-signal-base-v69');
    var dot = svg && svg.querySelector('.pf-signal-marker-v69');
    if (!path || !dot || typeof path.getTotalLength !== 'function') return;
    try {
      var length = path.getTotalLength();
      var point = path.getPointAtLength(Math.max(0, Math.min(1, phase)) * length);
      dot.setAttribute('cx', point.x.toFixed(2));
      dot.setAttribute('cy', point.y.toFixed(2));
    } catch (_) {}
  }

  function paintSignalMarkers(now) {
    document.querySelectorAll('.pf-timer-signal-v62').forEach(function (signal) {
      var overlay = signal.closest('#session-between-overlay-v2');
      var isRest = !!(overlay && overlay.getAttribute('data-between-type') === 'rest');
      var duration = isRest ? 2000 : 1000;
      var phase = (now % duration) / duration;
      moveSignalMarker(signal, phase);
    });
  }

  function animate(now) {
    var nowEpoch = Date.now();

    if (!reduced) {
      paintCardioArc(nowEpoch);
      paintBetweenArc(nowEpoch);
      paintSignalMarkers(now);
    }

    if (now - lastSyncAt > 220) {
      lastSyncAt = now;
      syncSurfaces();
      installStyles();
    }

    rafId = requestAnimationFrame(animate);
  }

  function activate() {
    installStyles();
    syncSurfaces();
    if (!rafId) rafId = requestAnimationFrame(animate);
    setTimeout(function () { installStyles(); syncSurfaces(); }, 180);
    setTimeout(function () { installStyles(); syncSurfaces(); }, 650);
    setTimeout(function () { installStyles(); syncSurfaces(); }, 1400);
  }

  var attempts = 0;
  (function waitForConcept() {
    attempts += 1;
    if (document.documentElement.classList.contains('exercise-concept-ready-v1')) {
      setTimeout(activate, 110);
      return;
    }
    if (attempts < 400) setTimeout(waitForConcept, 20);
  })();
})();
