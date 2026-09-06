(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase() !== 'pulse-home') return;
  if (window.__exercisePulseFlowSmoothV64Installed) return;
  window.__exercisePulseFlowSmoothV64Installed = true;

  var rafId = 0;
  var lastPreValue = '';
  var reduced = false;
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
          0 0 0 3px rgba(var(--concept-timer-rgb),.14),
          0 0 9px rgba(var(--concept-timer-rgb),.98),
          0 0 20px rgba(var(--concept-timer-rgb),.58),
          0 0 38px rgba(var(--concept-timer-rgb),.24) !important;
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
        12%  { transform:scale(1.055); filter:drop-shadow(0 0 8px rgba(var(--concept-timer-rgb),.28)); }
        23%  { transform:scale(.997); }
        34%  { transform:scale(1.027); filter:drop-shadow(0 0 5px rgba(var(--concept-timer-rgb),.18)); }
        52%,100% { transform:scale(1); filter:none; }
      }

      /* Pass flow markers: glow intensity inspired by enabled builder toggles. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength::after {
        box-shadow:
          0 0 0 2px #090E15,
          0 0 8px rgba(251,146,60,.32),
          0 0 16px rgba(251,146,60,.12) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio::after {
        box-shadow:
          0 0 0 2px #090E15,
          0 0 8px rgba(239,68,68,.34),
          0 0 16px rgba(239,68,68,.13) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.strength::after {
        box-shadow:
          0 0 0 3px rgba(251,146,60,.10),
          0 0 9px rgba(251,146,60,.94),
          0 0 19px rgba(251,146,60,.50),
          0 0 34px rgba(251,146,60,.18) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.cardio::after {
        box-shadow:
          0 0 0 3px rgba(239,68,68,.10),
          0 0 9px rgba(239,68,68,.94),
          0 0 19px rgba(239,68,68,.50),
          0 0 34px rgba(239,68,68,.18) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
        box-shadow:
          0 0 0 4px rgba(var(--pf-rgb),.18),
          0 0 10px rgba(var(--pf-rgb),1),
          0 0 23px rgba(var(--pf-rgb),.66),
          0 0 44px rgba(var(--pf-rgb),.28) !important;
        animation:pfTimelineGlowV64 1.08s ease-in-out infinite !important;
      }
      @keyframes pfTimelineGlowV64 {
        50% {
          box-shadow:
            0 0 0 7px rgba(var(--pf-rgb),.075),
            0 0 12px rgba(var(--pf-rgb),1),
            0 0 28px rgba(var(--pf-rgb),.78),
            0 0 52px rgba(var(--pf-rgb),.34);
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

  function frame() {
    var overlay = document.getElementById('session-pre-timer');
    var ring = document.getElementById('session-pre-timer-ring');
    if (overlay && ring && overlay.classList.contains('show')) {
      var raw = parseFloat(String(ring.style.getPropertyValue('--pre-smooth-progress') || '0').replace('deg','')) || 0;
      var progress = Math.max(0,Math.min(1,raw / 360));
      ring.style.setProperty('--pf-pre-progress',progress.toFixed(6));

      var valueNode = document.getElementById('session-pre-timer-value');
      var currentValue = valueNode ? String(valueNode.textContent || '').trim() : '';
      if (currentValue && currentValue !== lastPreValue) {
        lastPreValue = currentValue;
        restartHeartbeat(valueNode);
      }
    } else {
      lastPreValue = '';
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
