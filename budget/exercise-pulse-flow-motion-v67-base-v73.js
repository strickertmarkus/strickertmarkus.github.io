(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase() !== 'pulse-home') return;
  if (window.__exercisePulseFlowMotionV73FinalInstalled) return;
  window.__exercisePulseFlowMotionV73FinalInstalled = true;

  var reduced = false;
  var rafId = 0;
  var lastSurfaceSync = 0;
  var betweenVisible = false;
  var betweenType = '';
  var betweenTotalMs = 0;
  var betweenShownSeconds = null;
  var betweenShownAt = 0;

  var ARC_CX = 50;
  var ARC_CY = 50;
  var ARC_R = 42;
  var ARC_START_DEG = 140;
  var ARC_SPAN_DEG = 260;
  var ECG_D = 'M0 5 H10 L13 3.7 L16 6.1 L20 1 L24 8 L28 4.8 H42';

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

  function arcPoint(ratio) {
    ratio = Math.max(0, Math.min(1, Number(ratio) || 0));
    var angle = (ARC_START_DEG + ARC_SPAN_DEG * ratio) * Math.PI / 180;
    return {
      x: ARC_CX + ARC_R * Math.cos(angle),
      y: ARC_CY + ARC_R * Math.sin(angle)
    };
  }

  function arcPath(fromRatio, toRatio) {
    fromRatio = Math.max(0, Math.min(1, Number(fromRatio) || 0));
    toRatio = Math.max(0, Math.min(1, Number(toRatio) || 0));
    if (toRatio <= fromRatio + 0.000001) return '';
    var a = arcPoint(fromRatio);
    var b = arcPoint(toRatio);
    var sweepDegrees = ARC_SPAN_DEG * (toRatio - fromRatio);
    var large = sweepDegrees > 180 ? 1 : 0;
    return 'M' + a.x.toFixed(3) + ' ' + a.y.toFixed(3) +
      ' A' + ARC_R + ' ' + ARC_R + ' 0 ' + large + ' 1 ' +
      b.x.toFixed(3) + ' ' + b.y.toFixed(3);
  }

  function installStyles() {
    ['exercise-pulse-flow-motion-v70-final-style','exercise-pulse-flow-motion-v71-final-style','exercise-pulse-flow-motion-v72-final-style'].forEach(function (id) {
      var old = document.getElementById(id);
      if (old) old.remove();
    });

    var style = document.getElementById('exercise-pulse-flow-motion-v73-final-style');
    if (style) {
      if (style !== document.head.lastElementChild) document.head.appendChild(style);
      return;
    }

    style = document.createElement('style');
    style.id = 'exercise-pulse-flow-motion-v73-final-style';
    style.textContent = `
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment {
        position:relative !important;display:grid !important;place-items:center !important;
        background:transparent !important;background-image:none !important;border:0 !important;outline:0 !important;
        border-radius:0 !important;box-shadow:none !important;filter:none !important;overflow:visible !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment::before,
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment::after {
        content:none !important;display:none !important;width:0 !important;height:0 !important;background:none !important;
        border:0 !important;outline:0 !important;box-shadow:none !important;filter:none !important;animation:none !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .pf-progress-dot-v73 {
        display:block !important;width:6px !important;height:6px !important;flex:0 0 6px !important;border:0 !important;outline:0 !important;
        border-radius:50% !important;background:#252D37 !important;box-shadow:none !important;filter:none !important;opacity:.72 !important;
        transform:none !important;animation:none !important;
        transition:width .16s ease,height .16s ease,background .16s ease,box-shadow .18s ease,opacity .16s ease !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.strength > .pf-progress-dot-v73 {
        background:#FB923C !important;opacity:1 !important;box-shadow:0 0 4px rgba(251,146,60,.82),0 0 9px rgba(251,146,60,.26) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.cardio > .pf-progress-dot-v73 {
        background:#EF4444 !important;opacity:1 !important;box-shadow:0 0 4px rgba(239,68,68,.84),0 0 9px rgba(239,68,68,.27) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v73 {
        width:10px !important;height:10px !important;flex-basis:10px !important;opacity:1 !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.strength > .pf-progress-dot-v73 {
        background:radial-gradient(circle,#FFF2DE 0 8%,#FDBA74 20%,#FB923C 46%,rgba(251,146,60,.54) 66%,rgba(251,146,60,.10) 82%,transparent 100%) !important;
        box-shadow:0 0 6px rgba(251,146,60,.92),0 0 14px rgba(251,146,60,.42) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.cardio > .pf-progress-dot-v73 {
        background:radial-gradient(circle,#FFE4E6 0 8%,#FCA5A5 20%,#EF4444 46%,rgba(239,68,68,.54) 66%,rgba(239,68,68,.10) 82%,transparent 100%) !important;
        box-shadow:0 0 6px rgba(239,68,68,.94),0 0 14px rgba(239,68,68,.43) !important;
      }

      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-countdown-ring,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2#session-between-overlay-v2 .bs-ring {
        position:relative !important;border:0 !important;outline:0 !important;overflow:visible !important;box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-countdown-ring::before,
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-countdown-ring::after,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2#session-between-overlay-v2 .bs-ring::before,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2#session-between-overlay-v2 .bs-ring::after {
        content:none !important;display:none !important;width:0 !important;height:0 !important;background:none !important;border:0 !important;outline:0 !important;
        box-shadow:none !important;filter:none !important;transform:none !important;animation:none !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-countdown-segments,
      html.exercise-concept-pulse-home-v1 body #session-modal#session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-countdown-ring .session-countdown-core,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2#session-between-overlay-v2 .bs-segments,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2#session-between-overlay-v2 .bs-core,
      html.exercise-concept-pulse-home-v1 body .pf-arc-svg-v70,
      html.exercise-concept-pulse-home-v1 body .pf-arc-svg-v71,
      html.exercise-concept-pulse-home-v1 body .pf-arc-svg-v72,
      html.exercise-concept-pulse-home-v1 body .pf-arc-trail-v69,
      html.exercise-concept-pulse-home-v1 body .pf-arc-marker-v69 {
        display:none !important;visibility:hidden !important;opacity:0 !important;animation:none !important;
      }

      .pf-arc-svg-v73 {position:absolute !important;inset:0 !important;z-index:1 !important;width:100% !important;height:100% !important;overflow:visible !important;pointer-events:none !important;}
      .pf-arc-svg-v73 path {fill:none !important;vector-effect:non-scaling-stroke !important;stroke-linecap:round !important;stroke-linejoin:round !important;}
      #session-modal.pulse-flow-v58 .pf-arc-track-v73 {stroke:rgba(var(--pf-rgb),.085) !important;stroke-width:2.7 !important;}
      #session-modal.pulse-flow-v58 .pf-arc-progress-v73 {stroke:rgba(var(--pf-rgb),.68) !important;stroke-width:2.7 !important;filter:drop-shadow(0 0 3px rgba(var(--pf-rgb),.28)) !important;}
      #session-modal.pulse-flow-v58 .pf-arc-marker-v73 {fill:var(--pf-accent) !important;stroke:none !important;filter:drop-shadow(0 0 2px var(--pf-accent)) drop-shadow(0 0 5px rgba(var(--pf-rgb),.98)) drop-shadow(0 0 11px rgba(var(--pf-rgb),.56)) !important;}

      #session-between-overlay-v2 {--pf-between-accent:#22D3EE;--pf-between-rgb:34,211,238;}
      #session-between-overlay-v2[data-between-type="custom"] {--pf-between-accent:#EF4444;--pf-between-rgb:239,68,68;}
      #session-between-overlay-v2 .pf-arc-track-v73 {stroke:rgba(var(--pf-between-rgb),.085) !important;stroke-width:2.7 !important;}
      #session-between-overlay-v2 .pf-arc-progress-v73 {stroke:rgba(var(--pf-between-rgb),.68) !important;stroke-width:2.7 !important;filter:drop-shadow(0 0 3px rgba(var(--pf-between-rgb),.28)) !important;}
      #session-between-overlay-v2 .pf-arc-marker-v73 {fill:var(--pf-between-accent) !important;stroke:none !important;filter:drop-shadow(0 0 2px var(--pf-between-accent)) drop-shadow(0 0 5px rgba(var(--pf-between-rgb),.98)) drop-shadow(0 0 11px rgba(var(--pf-between-rgb),.56)) !important;}

      html.exercise-concept-pulse-home-v1 body #session-countdown-ring .pf-timer-signal-v62,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-timer-signal-v62 {
        display:none !important;visibility:hidden !important;opacity:0 !important;animation:none !important;
      }
      .pf-ecg-v73 {display:block !important;position:relative !important;width:48px !important;min-width:48px !important;height:10px !important;min-height:10px !important;margin:5px auto 2px !important;flex:0 0 10px !important;overflow:visible !important;opacity:1 !important;visibility:visible !important;animation:none !important;transform:none !important;}
      .pf-ecg-v73 svg {display:block !important;width:100% !important;height:100% !important;overflow:visible !important;}
      .pf-ecg-v73 .pf-ecg-base-v73,.pf-ecg-v73 .pf-ecg-sweep-v73 {fill:none !important;stroke:currentColor !important;stroke-linecap:round !important;stroke-linejoin:round !important;vector-effect:non-scaling-stroke !important;}
      .pf-ecg-v73 .pf-ecg-base-v73 {stroke-width:1.05 !important;opacity:.24 !important;}
      .pf-ecg-v73 .pf-ecg-sweep-v73 {stroke-width:1.65 !important;opacity:.92 !important;filter:drop-shadow(0 0 1.5px currentColor) drop-shadow(0 0 4px currentColor) !important;}
      .pf-ecg-v73 .pf-ecg-marker-v73 {fill:currentColor !important;stroke:none !important;opacity:1 !important;filter:drop-shadow(0 0 1.5px currentColor) drop-shadow(0 0 3px currentColor) !important;}
      #session-countdown-ring .pf-ecg-v73 {color:var(--pf-accent) !important;}
      #session-between-overlay-v2 .pf-ecg-v73 {color:var(--pf-between-accent) !important;}

      /* 5 s pre-timer: same visual, marker reduced to 75% of the v65 size. */
      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-line-dot-v62 {
        width:15px !important;height:15px !important;top:.5px !important;
        filter:drop-shadow(0 0 6px rgba(var(--concept-timer-rgb),.45)) !important;
      }

      @media(prefers-reduced-motion:reduce){.pf-ecg-v73 .pf-ecg-sweep-v73{opacity:.48 !important;}}
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
      segment.querySelectorAll(':scope > .pf-progress-dot-v70,:scope > .pf-progress-dot-v71,:scope > .pf-progress-dot-v72').forEach(function (node) { node.remove(); });
      var dot = segment.querySelector(':scope > .pf-progress-dot-v73');
      if (!dot) {
        dot = document.createElement('span');
        dot.className = 'pf-progress-dot-v73';
        dot.setAttribute('aria-hidden', 'true');
        segment.appendChild(dot);
      }
    });
  }

  function arcMarkup() {
    return '<svg class="pf-arc-svg-v73" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<path class="pf-arc-track-v73" d="' + arcPath(0, 1) + '"></path>' +
      '<path class="pf-arc-progress-v73"></path>' +
      '<circle class="pf-arc-marker-v73" r="1.45"></circle>' +
      '</svg>';
  }

  function ensureArc(ring) {
    if (!ring) return null;
    ring.querySelectorAll(':scope > .pf-arc-svg-v70,:scope > .pf-arc-svg-v71,:scope > .pf-arc-svg-v72,.pf-arc-trail-v69,.pf-arc-marker-v69').forEach(function (node) { node.remove(); });
    var svg = ring.querySelector(':scope > .pf-arc-svg-v73');
    if (!svg) {
      ring.insertAdjacentHTML('afterbegin', arcMarkup());
      svg = ring.querySelector(':scope > .pf-arc-svg-v73');
    }
    return svg;
  }

  function updateArc(ring, ratio) {
    var svg = ensureArc(ring);
    if (!svg) return;
    ratio = Math.max(0, Math.min(1, Number(ratio) || 0));
    var progress = svg.querySelector('.pf-arc-progress-v73');
    var marker = svg.querySelector('.pf-arc-marker-v73');
    if (progress) progress.setAttribute('d', arcPath(0, ratio));
    if (marker) {
      var point = arcPoint(ratio);
      marker.setAttribute('cx', point.x.toFixed(3));
      marker.setAttribute('cy', point.y.toFixed(3));
      marker.style.opacity = ratio > .002 ? '1' : '0';
    }
  }

  function ensureEcg(copy) {
    if (!copy) return null;
    copy.querySelectorAll('.pf-timer-signal-v62,.pf-ecg-v72').forEach(function (node) {
      node.style.setProperty('display', 'none', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.style.setProperty('opacity', '0', 'important');
    });
    var signal = copy.querySelector(':scope > .pf-ecg-v73');
    if (!signal) {
      signal = document.createElement('span');
      signal.className = 'pf-ecg-v73';
      signal.setAttribute('aria-hidden', 'true');
      signal.innerHTML = '<svg viewBox="0 0 42 9" focusable="false" aria-hidden="true">' +
        '<path class="pf-ecg-guide-v73" d="' + ECG_D + '" fill="none" stroke="none"></path>' +
        '<path class="pf-ecg-base-v73" d="' + ECG_D + '"></path>' +
        '<path class="pf-ecg-sweep-v73"></path>' +
        '<circle class="pf-ecg-marker-v73" cx="0" cy="5" r=".68"></circle>' +
        '</svg>';
      var label = copy.querySelector('.session-countdown-label,.bs-label');
      if (label) copy.insertBefore(signal, label);
      else copy.appendChild(signal);
    }
    return signal;
  }

  function sampledPath(path, startLength, endLength, steps) {
    if (!path || typeof path.getPointAtLength !== 'function' || endLength <= startLength) return '';
    steps = Math.max(2, steps || 12);
    var d = '';
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var len = startLength + (endLength - startLength) * t;
      var p = path.getPointAtLength(len);
      d += (i === 0 ? 'M' : ' L') + p.x.toFixed(3) + ' ' + p.y.toFixed(3);
    }
    return d;
  }

  function animateEcg(signal, now) {
    if (!signal) return;
    var svg = signal.querySelector('svg');
    var guide = svg && svg.querySelector('.pf-ecg-guide-v73');
    var sweep = svg && svg.querySelector('.pf-ecg-sweep-v73');
    var marker = svg && svg.querySelector('.pf-ecg-marker-v73');
    if (!guide || !sweep || !marker || typeof guide.getTotalLength !== 'function') return;
    var overlay = signal.closest('#session-between-overlay-v2');
    var isRest = !!(overlay && overlay.dataset.betweenType !== 'custom');
    var cycle = isRest ? 2000 : 1000;
    var phase = reduced ? .5 : ((now % cycle) / cycle);
    var total = guide.getTotalLength();
    var head = total * phase;
    var tail = Math.max(0, head - total * .23);
    sweep.setAttribute('d', sampledPath(guide, tail, head, 12));
    var point = guide.getPointAtLength(head);
    marker.setAttribute('cx', point.x.toFixed(3));
    marker.setAttribute('cy', point.y.toFixed(3));
  }

  function syncSurfaces() {
    installStyles();
    syncProgressDots();
    var cardioRing = document.getElementById('session-countdown-ring');
    if (cardioRing) {
      ensureArc(cardioRing);
      ensureEcg(cardioRing.querySelector('.session-countdown-copy'));
    }
    var overlay = document.getElementById('session-between-overlay-v2');
    var betweenRing = overlay && overlay.querySelector('.bs-ring');
    if (betweenRing) {
      ensureArc(betweenRing);
      ensureEcg(betweenRing.querySelector('.bs-copy'));
    }
  }

  function paintCardio(nowEpoch) {
    var ring = document.getElementById('session-countdown-ring');
    if (!ring) return;
    var state = getState();
    var exercise = currentExercise(state);
    var timed = !!(state && state.setRunning && state.setStartedAt && exercise && exercise.kind === 'cardio' && Number(exercise.time) > 0);
    if (!timed) { updateArc(ring, 1); return; }
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
      betweenVisible = false;betweenType = '';betweenTotalMs = 0;betweenShownSeconds = null;betweenShownAt = 0;return;
    }
    var type = String(overlay.dataset.betweenType || 'rest');
    var shownEl = overlay.querySelector('.bs-value');
    var shownSeconds = parseClock(shownEl && shownEl.textContent);
    if (!betweenVisible || type !== betweenType) {
      betweenVisible = true;betweenType = type;betweenShownSeconds = shownSeconds;betweenShownAt = nowEpoch;
      var configured = type === 'custom' ? 0 : configuredBetweenSeconds();
      betweenTotalMs = Math.max(1000, (configured || shownSeconds || 60) * 1000);
    } else if (shownSeconds !== betweenShownSeconds) {
      betweenShownSeconds = shownSeconds;betweenShownAt = nowEpoch;
    }
    var fractionalRemaining = Math.max(0, shownSeconds * 1000 - Math.max(0, nowEpoch - betweenShownAt));
    updateArc(ring, betweenTotalMs > 0 ? fractionalRemaining / betweenTotalMs : 0);
  }

  function animate(now) {
    var nowEpoch = Date.now();
    if (now - lastSurfaceSync > 90) {lastSurfaceSync = now;syncSurfaces();}
    if (!reduced) {paintCardio(nowEpoch);paintBetween(nowEpoch);}
    document.querySelectorAll('.pf-ecg-v73').forEach(function (signal) { animateEcg(signal, now); });
    rafId = requestAnimationFrame(animate);
  }

  function activate() {
    installStyles();syncSurfaces();
    var headObserver = new MutationObserver(function () { installStyles(); });
    headObserver.observe(document.head, { childList:true });
    var bodyObserver = new MutationObserver(function () { syncProgressDots(); });
    bodyObserver.observe(document.body, { childList:true, subtree:true });
    if (!rafId) rafId = requestAnimationFrame(animate);
  }

  var attempts = 0;
  (function waitForConcept() {
    attempts += 1;
    if (document.documentElement.classList.contains('exercise-concept-ready-v1')) {setTimeout(activate, 90);return;}
    if (attempts < 400) setTimeout(waitForConcept, 20);
  })();
})();