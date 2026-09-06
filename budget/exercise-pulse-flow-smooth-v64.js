(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase() !== 'pulse-home') return;
  if (window.__exercisePulseFlowSmoothV64Installed) return;
  window.__exercisePulseFlowSmoothV64Installed = true;

  var rafId = 0;
  var lastPreValue = '';
  var reduced = false;
  var preSampleRaw = -1;
  var preSampleProgress = 0;
  var preSampleAt = 0;
  var preWasVisible = false;
  var PRE_DURATION_MS = 5000;
  try { reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_) {}

  function installStyles() {
    if (document.getElementById('exercise-pulse-flow-smooth-v64-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-pulse-flow-smooth-v64-style';
    style.textContent = `
      /* 5 s progress marker: brighter active-toggle style halo. */
      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-line-fill-v62 {
        box-shadow:
          0 0 5px rgba(var(--concept-timer-rgb),.62),
          0 0 14px rgba(var(--concept-timer-rgb),.28) !important;
        will-change:width;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-line-dot-v62 {
        width:10px !important;
        height:10px !important;
        top:2.5px !important;
        border:1px solid var(--concept-timer-soft) !important;
        background:var(--concept-timer-soft) !important;
        box-shadow:
          0 0 0 3px rgba(var(--concept-timer-rgb),.16),
          0 0 9px rgba(var(--concept-timer-rgb),1),
          0 0 21px rgba(var(--concept-timer-rgb),.62),
          0 0 40px rgba(var(--concept-timer-rgb),.27) !important;
        will-change:left,transform,box-shadow;
      }

      /* A restrained double-beat on each new second. No layout movement. */
      html.exercise-concept-pulse-home-v1 #session-pre-timer-value.pf-heartbeat-v64 {
        transform-origin:50% 58%;
        animation:pfHeartBeatV64 .44s cubic-bezier(.22,1,.36,1) both !important;
        will-change:transform,filter,text-shadow;
      }
      @keyframes pfHeartBeatV64 {
        0%   { transform:scale(1); filter:none; }
        11%  { transform:scale(1.058); filter:drop-shadow(0 0 9px rgba(var(--concept-timer-rgb),.32)); }
        22%  { transform:scale(.997); }
        34%  { transform:scale(1.030); filter:drop-shadow(0 0 6px rgba(var(--concept-timer-rgb),.20)); }
        53%,100% { transform:scale(1); filter:none; }
      }

      /* Pass flow markers: glow intensity inspired by enabled builder toggles. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength::after {
        box-shadow:
          0 0 0 2px #090E15,
          0 0 8px rgba(251,146,60,.38),
          0 0 17px rgba(251,146,60,.15) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio::after {
        box-shadow:
          0 0 0 2px #090E15,
          0 0 8px rgba(239,68,68,.40),
          0 0 17px rgba(239,68,68,.16) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.strength::after {
        box-shadow:
          0 0 0 3px rgba(251,146,60,.12),
          0 0 9px rgba(251,146,60,.98),
          0 0 20px rgba(251,146,60,.56),
          0 0 36px rgba(251,146,60,.21) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.cardio::after {
        box-shadow:
          0 0 0 3px rgba(239,68,68,.12),
          0 0 9px rgba(239,68,68,.98),
          0 0 20px rgba(239,68,68,.56),
          0 0 36px rgba(239,68,68,.21) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
        box-shadow:
          0 0 0 4px rgba(var(--pf-rgb),.20),
          0 0 10px rgba(var(--pf-rgb),1),
          0 0 24px rgba(var(--pf-rgb),.72),
          0 0 46px rgba(var(--pf-rgb),.31) !important;
        animation:pfTimelineGlowV64 1.08s ease-in-out infinite !important;
      }
      @keyframes pfTimelineGlowV64 {
        50% {
          box-shadow:
            0 0 0 7px rgba(var(--pf-rgb),.085),
            0 0 12px rgba(var(--pf-rgb),1),
            0 0 30px rgba(var(--pf-rgb),.84),
            0 0 55px rgba(var(--pf-rgb),.38);
        }
      }

      @media(prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 #session-pre-timer-value.pf-heartbeat-v64,
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
          animation:none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function restartHeartbeat(valueNode) {
    if (!valueNode || reduced) return;
    valueNode.classList.remove('pf-heartbeat-v64');
    void valueNode.offsetWidth;
    valueNode.classList.add('pf-heartbeat-v64');
    setTimeout(function () { valueNode.classList.remove('pf-heartbeat-v64'); },470);
  }

  function resetPretimerInterpolation() {
    preSampleRaw = -1;
    preSampleProgress = 0;
    preSampleAt = 0;
    preWasVisible = false;
  }

  function frame(now) {
    var overlay = document.getElementById('session-pre-timer');
    var ring = document.getElementById('session-pre-timer-ring');
    var visible = !!(overlay && ring && overlay.classList.contains('show'));

    if (visible) {
      var rawDeg = parseFloat(String(ring.style.getPropertyValue('--pre-smooth-progress') || '0').replace('deg','')) || 0;
      var rawProgress = Math.max(0,Math.min(1,rawDeg / 360));

      /* The session controller currently samples its source timer at ~32 ms.
         Treat each source value as a correction point, then interpolate at the
         display's requestAnimationFrame cadence between samples. */
      var sourceChanged = preSampleRaw < 0 || Math.abs(rawProgress - preSampleRaw) > 0.000001;
      var sourceReset = preSampleRaw >= 0 && rawProgress + 0.02 < preSampleRaw;
      if (!preWasVisible || sourceReset || sourceChanged) {
        preSampleRaw = rawProgress;
        preSampleProgress = rawProgress;
        preSampleAt = now;
      }
      preWasVisible = true;

      var smoothProgress = preSampleProgress;
      if (!reduced && preSampleAt) {
        smoothProgress += Math.max(0,now - preSampleAt) / PRE_DURATION_MS;
      }
      smoothProgress = Math.max(rawProgress,Math.min(1,smoothProgress));
      ring.style.setProperty('--pf-pre-progress',smoothProgress.toFixed(6));

      var valueNode = document.getElementById('session-pre-timer-value');
      var currentValue = valueNode ? String(valueNode.textContent || '').trim() : '';
      if (currentValue && currentValue !== lastPreValue) {
        lastPreValue = currentValue;
        restartHeartbeat(valueNode);
      }
    } else {
      lastPreValue = '';
      resetPretimerInterpolation();
    }

    rafId = requestAnimationFrame(frame);
  }

  function waitForFinalPulseStyles() {
    var attempts = 0;
    (function wait() {
      attempts += 1;
      var ready = document.documentElement.classList.contains('exercise-concept-ready-v1');
      var base = document.getElementById('exercise-pulse-flow-timers-v62-style');
      if (ready && base) {
        installStyles();
        var own = document.getElementById('exercise-pulse-flow-smooth-v64-style');
        if (own) document.head.appendChild(own);
        if (!rafId) rafId = requestAnimationFrame(frame);
        return;
      }
      if (attempts < 300) setTimeout(wait,20);
    })();
  }

  window.addEventListener('pagehide',function () {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  },{once:true});

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',waitForFinalPulseStyles,{once:true});
  else waitForFinalPulseStyles();
})();