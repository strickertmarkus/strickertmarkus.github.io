(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase() !== 'pulse-home') return;
  if (window.__exercisePulseFlowTimelineV61Installed) return;
  window.__exercisePulseFlowTimelineV61Installed = true;

  function addStyles() {
    if (document.getElementById('exercise-pulse-flow-timeline-v61-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-pulse-flow-timeline-v61-style';
    style.textContent = `
      /* Session timeline. Reuse the single original Pulse Flow dot rather than
         drawing a second pseudo-element on top of it. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-workout-progress {
        margin:6px 0 2px !important;
        padding:9px 0 5px !important;
        border-top:1px solid rgba(148,163,184,.09) !important;
        border-bottom:1px solid rgba(148,163,184,.08) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-head {
        margin-bottom:5px !important;
        align-items:center !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-title {
        font-size:0 !important;
        color:#718095 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-title::after {
        content:'Passflöde';
        font-size:8px;
        font-weight:700;
        letter-spacing:1.15px;
        text-transform:uppercase;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-percent {
        color:var(--pf-soft) !important;
        font-size:17px !important;
        font-weight:700 !important;
        letter-spacing:-.35px !important;
        text-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-track {
        position:relative !important;
        display:flex !important;
        align-items:center !important;
        width:100% !important;
        height:34px !important;
        gap:0 !important;
        padding:0 5px !important;
        overflow:visible !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-track::before {
        content:'' !important;
        position:absolute !important;
        left:9px !important;
        right:9px !important;
        top:50% !important;
        height:1px !important;
        transform:translateY(-.5px) !important;
        background:linear-gradient(90deg,rgba(148,163,184,.07),rgba(148,163,184,.20),rgba(148,163,184,.07)) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment {
        position:relative !important;
        z-index:1 !important;
        display:grid !important;
        place-items:center !important;
        flex:1 1 0 !important;
        width:auto !important;
        min-width:7px !important;
        height:34px !important;
        padding:0 !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
        opacity:1 !important;
        transform:none !important;
        overflow:visible !important;
      }
      /* Disable the experimental second dot entirely. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::before {
        content:none !important;
        display:none !important;
      }
      /* The original ::after dot is the single visual source of truth. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::after {
        content:'' !important;
        display:block !important;
        width:9px !important;
        height:9px !important;
        box-sizing:border-box !important;
        border-radius:50% !important;
        border:1px solid rgba(100,116,139,.72) !important;
        background:#0B121A !important;
        box-shadow:0 0 0 2px #090E15,0 0 7px rgba(100,116,139,.12) !important;
        transition:width .16s ease,height .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength::after {
        border-color:rgba(251,146,60,.58) !important;
        box-shadow:0 0 0 2px #090E15,0 0 9px rgba(251,146,60,.16) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio::after {
        border-color:rgba(239,68,68,.60) !important;
        box-shadow:0 0 0 2px #090E15,0 0 9px rgba(239,68,68,.17) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.strength::after {
        background:#FB923C !important;
        border-color:#FED7AA !important;
        box-shadow:0 0 0 2px #090E15,0 0 10px rgba(251,146,60,.58),0 0 20px rgba(251,146,60,.22) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.cardio::after {
        background:#EF4444 !important;
        border-color:#FCA5A5 !important;
        box-shadow:0 0 0 2px #090E15,0 0 10px rgba(239,68,68,.60),0 0 20px rgba(239,68,68,.22) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
        width:16px !important;
        height:16px !important;
        background:var(--pf-accent) !important;
        border:2px solid var(--pf-soft) !important;
        box-shadow:0 0 0 4px rgba(var(--pf-rgb),.12),0 0 14px rgba(var(--pf-rgb),.78),0 0 28px rgba(var(--pf-rgb),.30) !important;
        animation:pfTimelinePulseV61 1.2s ease-in-out infinite !important;
      }
      @keyframes pfTimelinePulseV61 {
        50% {
          box-shadow:0 0 0 6px rgba(var(--pf-rgb),.055),0 0 18px rgba(var(--pf-rgb),.88),0 0 34px rgba(var(--pf-rgb),.36);
        }
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-meta {
        margin-top:3px !important;
        color:#647286 !important;
        font-size:8px !important;
        line-height:1.25 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-legend {
        gap:10px !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-dot {
        width:6px !important;
        height:6px !important;
        border-radius:50% !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-dot.strength { background:#FB923C !important; }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-dot.cardio { background:#EF4444 !important; }

      /* Actual timers: 5 s, timed cardio and rest. The small pass/set clocks are
         intentionally left alone. */
      html.exercise-concept-pulse-home-v1 #session-pre-timer.show {
        background:radial-gradient(380px 260px at 50% 48%,rgba(var(--concept-timer-rgb),.075),transparent 68%),#080D14 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer-ring {
        box-shadow:0 0 0 1px rgba(var(--concept-timer-rgb),.08),0 0 26px rgba(var(--concept-timer-rgb),.12) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer-value {
        font-size:clamp(38px,10vw,50px) !important;
        font-weight:620 !important;
        letter-spacing:-1px !important;
        text-shadow:0 0 14px rgba(var(--concept-timer-rgb),.16) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer .session-pre-label {
        font-weight:650 !important;
        letter-spacing:1.15px !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring .session-countdown-core {
        background:radial-gradient(circle at 50% 42%,rgba(var(--pf-rgb),.045),transparent 58%),#091018 !important;
        border:1px solid rgba(var(--pf-rgb),.16) !important;
        box-shadow:inset 0 0 24px rgba(var(--pf-rgb),.035),0 0 24px rgba(var(--pf-rgb),.07) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-value {
        font-size:28px !important;
        font-weight:620 !important;
        letter-spacing:-.55px !important;
        text-shadow:0 0 14px rgba(var(--pf-rgb),.17) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-segments .session-countdown-segment.active {
        box-shadow:0 0 8px rgba(var(--pf-rgb),.68) !important;
      }

      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-core {
        background:radial-gradient(circle at 50% 42%,rgba(34,211,238,.045),transparent 58%),#091018 !important;
        border:1px solid rgba(34,211,238,.16) !important;
        box-shadow:inset 0 0 24px rgba(34,211,238,.035),0 0 24px rgba(34,211,238,.07) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-value {
        font-size:29px !important;
        font-weight:620 !important;
        letter-spacing:-.6px !important;
        text-shadow:0 0 14px rgba(34,211,238,.17) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-segment.active {
        filter:drop-shadow(0 0 4px rgba(34,211,238,.70)) !important;
      }

      @media(max-width:600px) {
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-track {
          height:31px !important;
          padding-left:3px !important;
          padding-right:3px !important;
        }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment {
          min-width:5px !important;
          height:31px !important;
        }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::after {
          width:8px !important;
          height:8px !important;
        }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
          width:15px !important;
          height:15px !important;
        }
      }

      @media(prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
          animation:none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function removeExperimentalTimerEcg() {
    var extra = document.getElementById('pulse-flow-timer-ecg-v61');
    if (extra) extra.remove();
  }

  function syncLabels() {
    var title = document.querySelector('#session-modal .hype-progress-title');
    if (title) title.setAttribute('aria-label','Passflöde');
  }

  function sync() {
    removeExperimentalTimerEcg();
    syncLabels();
  }

  function install() {
    addStyles();
    sync();
    window.addEventListener('pageshow', function () { setTimeout(sync,0); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
