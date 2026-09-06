(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase() !== 'pulse-home') return;
  if (window.__exercisePulseFlowMotionV70FinalInstalled) return;
  window.__exercisePulseFlowMotionV70FinalInstalled = true;

  var reduced = false;
  var rafId = 0;
  var lastSurfaceSync = 0;
  var betweenVisible = false;
  var betweenStartedAt = 0;
  var betweenTotalMs = 0;
  var betweenType = '';

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
    var style = document.getElementById('exercise-pulse-flow-motion-v70-final-style');
    if (style) {
      if (style !== document.head.lastElementChild) document.head.appendChild(style);
      return;
    }

    style = document.createElement('style');
    style.id = 'exercise-pulse-flow-motion-v70-final-style';
    style.textContent = `
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment {
        position:relative !important;
        display:grid !important;
        place-items:center !important;
        background:transparent !important;
        background-image:none !important;
        border:0 !important;
        outline:0 !important;
        border-radius:0 !important;
        box-shadow:none !important;
        filter:none !important;
        overflow:visible !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment::before,
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment::after {
        content:none !important;
        display:none !important;
        width:0 !important;
        height:0 !important;
        background:none !important;
        border:0 !important;
        outline:0 !important;
        box-shadow:none !important;
        filter:none !important;
        animation:none !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .pf-progress-dot-v70 {
        display:block !important;
        width:4px !important;
        height:4px !important;
        flex:0 0 4px !important;
        border:0 !important;
        outline:0 !important;
        border-radius:50% !important;
        background:#252D37 !important;
        box-shadow:none !important;
        filter:none !important;
        opacity:.72 !important;
        transform:none !important;
        animation:none !important;
        transition:width .16s ease,height .16s ease,background .16s ease,box-shadow .18s ease,opacity .16s ease !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.strength > .pf-progress-dot-v70 {
        width:4px !important;
        height:4px !important;
        background:#FB923C !important;
        opacity:1 !important;
        box-shadow:0 0 4px rgba(251,146,60,.82),0 0 9px rgba(251,146,60,.26) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.cardio > .pf-progress-dot-v70 {
        width:4px !important;
        height:4px !important;
        background:#EF4444 !important;
        opacity:1 !important;
        box-shadow:0 0 4px rgba(239,68,68,.84),0 0 9px rgba(239,68,68,.27) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v70 {
        width:8px !important;
        height:8px !important;
        opacity:1 !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.strength > .pf-progress-dot-v70 {
        background:radial-gradient(circle,#FFF2DE 0 8%,#FDBA74 20%,#FB923C 46%,rgba(251,146,60,.54) 66%,rgba(251,146,60,.10) 82%,transparent 100%) !important;
        box-shadow:0 0 6px rgba(251,146,60,.92),0 0 14px rgba(251,146,60,.42) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.cardio > .pf-progress-dot-v70 {
        background:radial-gradient(circle,#FFE4E6 0 8%,#FCA5A5 20%,#EF4444 46%,rgba(239,68,68,.54) 66%,rgba(239,68,68,.10) 82%,transparent 100%) !important;
        box-shadow:0 0 6px rgba(239,68,68,.94),0 0 14px rgba(239,68,68,.43) !important;
      }

      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-countdown-ring,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2#session-between-overlay-v2 .bs-ring {
        position:relative !important;
        border:0 !important;
        outline:0 !important;
        overflow:visible !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-countdown-ring::before,
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-countdown-ring::after,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2#session-between-overlay-v2 .bs-ring::before,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2#session-between-overlay-v2 .bs-ring::after {
        content:none !important;
        display:none !important;
        background:none !important;
        box-shadow:none !important;
        filter:none !important;
        animation:none !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-countdown-segments,
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-countdown-ring .session-countdown-core,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2#session-between-overlay-v2 .bs-segments,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2#session-between-overlay-v2 .bs-core,
      html.exercise-concept-pulse-home-v1 body .pf-arc-trail-v69,
      html.exercise-concept-pulse-home-v1 body .pf-arc-marker-v69 {
        display:none !important;
        visibility:hidden !important;
        opacity:0 !important;
        animation:none !important;
      }

      .pf-arc-svg-v70 {
        position:absolute !important;
        inset:0 !important;
        z-index:1 !important;
        width:100% !important;
        height:100% !important;
        overflow:visible !important;
        pointer-events:none !important;
      }
      .pf-arc-svg-v70 path {
        fill:none !important;
        vector-effect:non-scaling-stroke !important;
        stroke-linecap:round !important;
        stroke-linejoin:round !important;
      }
      #session-modal.pulse-flow-v58 .pf-arc-track-v70 { stroke:rgba(var(--pf-rgb),.085) !important; stroke-width:2.7 !important; }
      #session-modal.pulse-flow-v58 .pf-arc-progress-v70 { stroke:rgba(var(--pf-rgb),.62) !important; stroke-width:2.7 !important; filter:drop-shadow(0 0 3px rgba(var(--pf-rgb),.28)) !important; }
      #session-modal.pulse-flow-v58 .pf-arc-tail-soft-v70 { stroke:rgba(var(--pf-rgb),.26) !important; stroke-width:4.6 !important; filter:drop-shadow(0 0 5px rgba(var(--pf-rgb),.26)) !important; }
      #session-modal.pulse-flow-v58 .pf-arc-tail-bright-v70 { stroke:var(--pf-soft) !important; stroke-width:3.0 !important; filter:drop-shadow(0 0 5px rgba(var(--pf-rgb),.66)) drop-shadow(0 0 10px rgba(var(--pf-rgb),.24)) !important; }
      #session-modal.pulse-flow-v58 .pf-arc-marker-v70 { fill:var(--pf-soft) !important; stroke:none !important; filter:drop-shadow(0 0 2px var(--pf-accent)) drop-shadow(0 0 6px rgba(var(--pf-rgb),.78)) !important; }

      #session-between-overlay-v2 { --pf-between-accent:#22D3EE; --pf-between-soft:#CFFAFE; --pf-between-rgb:34,211,238; }
      #session-between-overlay-v2[data-between-type="custom"] { --pf-between-accent:#EF4444; --pf-between-soft:#FCA5A5; --pf-between-rgb:239,68,68; }
      #session-between-overlay-v2 .pf-arc-track-v70 { stroke:rgba(var(--pf-between-rgb),.085) !important; stroke-width:2.7 !important; }
      #session-between-overlay-v2 .pf-arc-progress-v70 { stroke:rgba(var(--pf-between-rgb),.62) !important; stroke-width:2.7 !important; filter:drop-shadow(0 0 3px rgba(var(--pf-between-rgb),.28)) !important; }
      #session-between-overlay-v2 .pf-arc-tail-soft-v70 { stroke:rgba(var(--pf-between-rgb),.26) !important; stroke-width:4.6 !important; filter:drop-shadow(0 0 5px rgba(var(--pf-between-rgb),.26)) !important; }
      #session-between-overlay-v2 .pf-arc-tail-bright-v70 { stroke:var(--pf-between-soft) !important; stroke-width:3.0 !important; filter:drop-shadow(0 0 5px rgba(var(--pf-between-rgb),.66)) drop-shadow(0 0 10px rgba(var(--pf-between-rgb),.24)) !important; }
      #session-between-overlay-v2 .pf-arc-marker-v70 { fill:var(--pf-between-soft) !important; stroke:none !important; filter:drop-shadow(0 0 2px var(--pf-between-accent)) drop-shadow(0 0 6px rgba(var(--pf-between-rgb),.78)) !important; }

      html.exercise-concept-pulse-home-v1 body .pf-timer-signal-v62 {
        display:block !important;
        width:42px !important;
        height:9px !important;
        margin:5px auto 1px !important;
        overflow:visible !important;
        opacity:1 !important;
        animation:none !important;
        filter:none !important;
        transform:none !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal .pf-timer-signal-v62 { color:var(--pf-accent) !important; }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2#session-between-overlay-v2 .pf-timer-signal-v62 { color:var(--pf-between-accent) !important; }
      html.exercise-concept-pulse-home-v1 body .pf-timer-signal-v62 *,
      html.exercise-concept-pulse-home-v1 body .pf-timer-signal-v62::before,
      html.exercise-concept-pulse-home-v1 body .pf-timer-signal-v62::after { animation:none !important; }
      .pf-timer-signal-v62 svg { display:block !important; width:100% !important; height:100% !important; overflow:visible !important; }
      .pf-signal-base-v70,.pf-signal-sweep-v70 { fill:none !important; stroke:currentColor !important; stroke-linecap:round !important; stroke-linejoin:round !important; }
      .pf-signal-base-v70 { stroke-width:1.05 !important; opacity:.18 !important; }
      .pf-signal-sweep-v70 { stroke-width:1.55 !important; opacity:.74 !important; filter:drop-shadow(0 0 1.5px currentColor) drop-shadow(0 0 3.5px currentColor) !important; }
      .pf-signal-marker-v70 { fill:currentColor !important; stroke:none !important; opacity:.96 !important; filter:drop-shadow(0 0 1.5px currentColor) drop-shadow(0 0 3px currentColor) !important; }
      @media(prefers-reduced-motion:reduce) { .pf-signal-sweep-v70 { opacity:.38 !important; } }
    `;
    document.head.appendChild(style);
  }

  function syncProgressDots() {
    var segments = document.querySelectorAll('#session-modal.pulse-flow-v58 .hype-progress-segment');
    segments.forEach(function (segment) {
      segment.style.setProperty('background', 'transparent', 'important');
      segment.style.setProperty('background-image', 'none', 'important');
      segment.style.setProperty('border', '0', 'important');
      segment.style.setProperty('outline', '0', 'important');
      segment.style.setProperty('box-shadow', 'none', 'important');
      segment.style.setProperty('filter', 'none', 'important');
      segment.style.setProperty('border-radius', '0', 'important');

      var dot = segment.querySelector(':scope > .pf-progress-dot-v70');
      if (!dot) {
        dot = document.createElement('span');
        dot.className = 'pf-progress-dot-v70';
        dot.setAttribute('aria-hidden', 'true');
        segment.appendChild(dot);
      }
    });
  }

  function arcMarkup() {
    var d = 'M17.826 76.997 A42 42 0 1 1 82.174 76.997';
    return '<svg class="pf-arc-svg-v70" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<path class="pf-arc-track-v70" d="' + d + '" pathLength="100"></path>' +
      '<path class="pf-arc-progress-v70" d="' + d + '" pathLength="100"></path>' +
      '<path class="pf-arc-tail-soft-v70" d="' + d + '" pathLength="100"></path>' +
      '<path class="pf-arc-tail-bright-v70" d="' + d + '" pathLength="100"></path>' +
      '<circle class="pf-arc-marker-v70" cx="17.826" cy="76.997" r="2.1"></circle>' +
      '</svg>';
  }

  function ensureArc(ring) {
    if (!ring) return null;
    ring.querySelectorAll('.pf-arc-trail-v69,.pf-arc-marker-v69').forEach(function (node) { node.remove(); });
    var svg = ring.querySelector(':scope > .pf-arc-svg-v70');
    if (!svg) {
      ring.insertAdjacentHTML('afterbegin', arcMarkup());
      svg = ring.querySelector(':scope > .pf-arc-svg-v70');
    }
    return svg;
  }

  function updateArc(ring, ratio) {
    var svg = ensureArc(ring);
    if (!svg) return;

    ratio = Math.max(0, Math.min(1, Number(ratio) || 0));
    var pct = ratio * 100;
    var progress = svg.querySelector('.pf-arc-progress-v70');
    var tailSoft = svg.querySelector('.pf-arc-tail-soft-v70');
    var tailBright = svg.querySelector('.pf-arc-tail-bright-v70');
    var marker = svg.querySelector('.pf-arc-marker-v70');

    if (progress) {
      progress.style.strokeDasharray = pct.toFixed(3) + ' 100';
      progress.style.strokeDashoffset = '0';
    }

    var softLen = Math.min(16, pct);
    if (tailSoft) {
      tailSoft.style.strokeDasharray = softLen.toFixed(3) + ' ' + (100 - softLen).toFixed(3);
      tailSoft.style.strokeDashoffset = (-(pct - softLen)).toFixed(3);
      tailSoft.style.opacity = pct > .1 ? '1' : '0';
    }

    var brightLen = Math.min(6.5, pct);
    if (tailBright) {
      tailBright.style.strokeDasharray = brightLen.toFixed(3) + ' ' + (100 - brightLen).toFixed(3);
      tailBright.style.strokeDashoffset = (-(pct - brightLen)).toFixed(3);
      tailBright.style.opacity = pct > .1 ? '1' : '0';
    }

    if (marker && progress && typeof progress.getTotalLength === 'function') {
      var total = progress.getTotalLength();
      var point = progress.getPointAtLength(total * ratio);
      marker.setAttribute('cx', point.x.toFixed(3));
      marker.setAttribute('cy', point.y.toFixed(3));
      marker.style.opacity = pct > .1 ? '1' : '0';
    }
  }

  function ensureSignal(copy) {
    if (!copy) return null;
    var signal = copy.querySelector('.pf-timer-signal-v62');
    if (!signal) {
      signal = document.createElement('span');
      signal.className = 'pf-timer-signal-v62';
      signal.setAttribute('aria-hidden', 'true');
      copy.appendChild(signal);
    }

    if (signal.dataset.pfV70 !== '1') {
      signal.dataset.pfV70 = '1';
      signal.innerHTML =
        '<svg viewBox="0 0 42 9" focusable="false" aria-hidden="true">' +
          '<path class="pf-signal-base-v70" pathLength="100" d="M0 5 H10 L13 3.7 L16 6.1 L20 1 L24 8 L28 4.8 H42"></path>' +
          '<path class="pf-signal-sweep-v70" pathLength="100" d="M0 5 H10 L13 3.7 L16 6.1 L20 1 L24 8 L28 4.8 H42"></path>' +
          '<circle class="pf-signal-marker-v70" cx="0" cy="5" r=".72"></circle>' +
        '</svg>';
    }
    return signal;
  }

  function animateSignal(signal, now) {
    if (!signal) return;
    var svg = signal.querySelector('svg');
    var path = svg && svg.querySelector('.pf-signal-base-v70');
    var sweep = svg && svg.querySelector('.pf-signal-sweep-v70');
    var marker = svg && svg.querySelector('.pf-signal-marker-v70');
    if (!path || !sweep || !marker || typeof path.getTotalLength !== 'function') return;

    var overlay = signal.closest('#session-between-overlay-v2');
    var isRest = !!(overlay && overlay.dataset.betweenType !== 'custom');
    var cycle = isRest ? 2000 : 1000;
    var phase = reduced ? .5 : ((now % cycle) / cycle);

    sweep.style.strokeDasharray = '18 82';
    sweep.style.strokeDashoffset = (18 - phase * 100).toFixed(3);

    var length = path.getTotalLength();
    var point = path.getPointAtLength(phase * length);
    marker.setAttribute('cx', point.x.toFixed(3));
    marker.setAttribute('cy', point.y.toFixed(3));
  }

  function syncSurfaces() {
    installStyles();
    syncProgressDots();

    var cardioRing = document.getElementById('session-countdown-ring');
    if (cardioRing) {
      ensureArc(cardioRing);
      var cardioCopy = cardioRing.querySelector('.session-countdown-copy');
      ensureSignal(cardioCopy);
    }

    var overlay = document.getElementById('session-between-overlay-v2');
    var restRing = overlay && overlay.querySelector('.bs-ring');
    if (restRing) {
      ensureArc(restRing);
      var restCopy = restRing.querySelector('.bs-copy');
      ensureSignal(restCopy);
    }
  }

  function paintCardio(nowEpoch) {
    var ring = document.getElementById('session-countdown-ring');
    if (!ring) return;

    var state = getState();
    var exercise = currentExercise(state);
    var timed = !!(state && state.setRunning && state.setStartedAt && exercise && exercise.kind === 'cardio' && Number(exercise.time) > 0);

    if (!timed) {
      updateArc(ring, 1);
      return;
    }

    var totalMs = Number(exercise.time) * 60000;
    var end = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : nowEpoch;
    var elapsed = Math.max(0, end - Number(state.setStartedAt));
    updateArc(ring, totalMs > 0 ? (totalMs - elapsed) / totalMs : 0);
  }

  function paintBetween(nowEpoch) {
    var overlay = document.getElementById('session-between-overlay-v2');
    var ring = overlay && overlay.querySelector('.bs-ring');
    var visible = !!(overlay && ring && overlay.classList.contains('show'));

    if (!visible) {
      betweenVisible = false;
      betweenStartedAt = 0;
      betweenTotalMs = 0;
      betweenType = '';
      return;
    }

    var type = String(overlay.dataset.betweenType || 'rest');
    var shownEl = overlay.querySelector('.bs-value');
    var shownSeconds = parseClock(shownEl && shownEl.textContent);

    if (!betweenVisible || type !== betweenType) {
      betweenVisible = true;
      betweenType = type;
      betweenStartedAt = nowEpoch;
      betweenTotalMs = Math.max(1000, (configuredBetweenSeconds() || shownSeconds || 60) * 1000);
    }

    var elapsed = Math.max(0, nowEpoch - betweenStartedAt);
    var ratio = betweenTotalMs > 0 ? (betweenTotalMs - elapsed) / betweenTotalMs : 0;
    if (shownEl && shownSeconds <= 0) ratio = 0;
    updateArc(ring, ratio);
  }

  function animate(now) {
    var nowEpoch = Date.now();

    if (now - lastSurfaceSync > 100) {
      lastSurfaceSync = now;
      syncSurfaces();
    }

    if (!reduced) {
      paintCardio(nowEpoch);
      paintBetween(nowEpoch);
    }

    document.querySelectorAll('.pf-timer-signal-v62[data-pf-v70="1"]').forEach(function (signal) {
      animateSignal(signal, now);
    });

    rafId = requestAnimationFrame(animate);
  }

  function activate() {
    installStyles();
    syncSurfaces();

    var headObserver = new MutationObserver(function () {
      installStyles();
    });
    headObserver.observe(document.head, { childList:true });

    var bodyObserver = new MutationObserver(function () {
      syncProgressDots();
    });
    bodyObserver.observe(document.body, { childList:true, subtree:true });

    if (!rafId) rafId = requestAnimationFrame(animate);
  }

  var attempts = 0;
  (function waitForConcept() {
    attempts += 1;
    if (document.documentElement.classList.contains('exercise-concept-ready-v1')) {
      setTimeout(activate, 90);
      return;
    }
    if (attempts < 400) setTimeout(waitForConcept, 20);
  })();
})();
