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
      /* Timer ECG: a quiet divider that ties the clock rail into Pulse Flow. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-timers {
        padding-bottom:3px !important;
        border-bottom:0 !important;
      }
      html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61 {
        position:relative;
        width:100%;
        height:34px;
        margin:-3px 0 1px;
        overflow:hidden;
        color:var(--pf-accent);
        border-bottom:1px solid rgba(var(--pf-rgb),.10);
      }
      html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61::after {
        content:'';
        position:absolute;
        inset:0;
        pointer-events:none;
        background:linear-gradient(90deg,#090E15 0,transparent 10%,transparent 90%,#090E15 100%);
      }
      html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61 svg {
        display:block;
        width:100%;
        height:34px;
        overflow:visible;
      }
      html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61 .pf-timer-axis-v61,
      html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61 .pf-timer-ghost-v61,
      html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61 .pf-timer-trace-v61 {
        fill:none;
        vector-effect:non-scaling-stroke;
        stroke-linecap:round;
        stroke-linejoin:round;
      }
      html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61 .pf-timer-axis-v61 {
        stroke:rgba(var(--pf-rgb),.09);
        stroke-width:1;
      }
      html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61 .pf-timer-ghost-v61 {
        stroke:currentColor;
        stroke-width:1.05;
        opacity:.16;
      }
      html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61 .pf-timer-trace-v61 {
        stroke:currentColor;
        stroke-width:1.8;
        stroke-dasharray:110 890;
        stroke-dashoffset:0;
        filter:drop-shadow(0 0 3px rgba(var(--pf-rgb),.34));
        animation:pfTimerSweepV61 var(--pf-speed,2.4s) linear infinite;
      }
      @keyframes pfTimerSweepV61 { to { stroke-dashoffset:-1000; } }

      /* Session timeline: use the existing progress data, but render it as a flow line. */
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
        height:30px !important;
        gap:0 !important;
        padding:0 5px !important;
        overflow:visible !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-track::before {
        content:'';
        position:absolute;
        left:8px;
        right:8px;
        top:50%;
        height:1px;
        transform:translateY(-.5px);
        background:linear-gradient(90deg,rgba(148,163,184,.08),rgba(148,163,184,.18),rgba(148,163,184,.08));
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment {
        position:relative !important;
        z-index:1 !important;
        flex:1 1 0 !important;
        min-width:7px !important;
        height:30px !important;
        border-radius:0 !important;
        background:transparent !important;
        opacity:1 !important;
        transform:none !important;
        overflow:visible !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::after {
        content:'';
        position:absolute;
        z-index:-1;
        left:50%;
        right:-50%;
        top:50%;
        height:1px;
        background:rgba(148,163,184,.12);
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment:last-child::after {
        display:none;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::before {
        content:'';
        position:absolute;
        left:50%;
        top:50%;
        width:7px;
        height:7px;
        transform:translate(-50%,-50%);
        border-radius:50%;
        background:#0A1018;
        border:1px solid rgba(148,163,184,.22);
        box-shadow:0 0 0 2px #090E15;
        transition:width .16s ease,height .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength::before {
        border-color:rgba(251,146,60,.38);
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio::before {
        border-color:rgba(239,68,68,.42);
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength.done::before {
        background:#FB923C;
        border-color:#FB923C;
        box-shadow:0 0 0 2px #090E15,0 0 8px rgba(251,146,60,.28);
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio.done::before {
        background:#EF4444;
        border-color:#EF4444;
        box-shadow:0 0 0 2px #090E15,0 0 8px rgba(239,68,68,.30);
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength.done::after {
        background:rgba(251,146,60,.36);
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio.done::after {
        background:rgba(239,68,68,.38);
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::before {
        width:12px;
        height:12px;
        background:var(--pf-accent);
        border-color:var(--pf-soft);
        box-shadow:0 0 0 3px rgba(var(--pf-rgb),.12),0 0 13px rgba(var(--pf-rgb),.50);
        animation:pfTimelinePulseV61 1.25s ease-in-out infinite;
      }
      @keyframes pfTimelinePulseV61 {
        50% { box-shadow:0 0 0 5px rgba(var(--pf-rgb),.045),0 0 17px rgba(var(--pf-rgb),.60); }
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
        width:5px !important;
        height:5px !important;
        border-radius:50% !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-dot.strength { background:#FB923C !important; }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-dot.cardio { background:#EF4444 !important; }

      @media(max-width:600px) {
        html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61 {
          height:30px;
          margin-top:-5px;
        }
        html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61 svg { height:30px; }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-track {
          height:27px !important;
          padding-left:3px !important;
          padding-right:3px !important;
        }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment {
          min-width:5px !important;
          height:27px !important;
        }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::before {
          width:6px;
          height:6px;
        }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::before {
          width:11px;
          height:11px;
        }
      }

      @media(prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 #pulse-flow-timer-ecg-v61 .pf-timer-trace-v61,
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::before {
          animation:none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureTimerEcg() {
    var timers = document.querySelector('#session-modal .session-main .session-timers');
    if (!timers || !timers.parentNode) return false;
    if (document.getElementById('pulse-flow-timer-ecg-v61')) return true;

    var wrap = document.createElement('div');
    wrap.id = 'pulse-flow-timer-ecg-v61';
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML =
      '<svg viewBox="0 0 600 34" preserveAspectRatio="none" focusable="false">' +
        '<path class="pf-timer-axis-v61" d="M0 18 H600"></path>' +
        '<path class="pf-timer-ghost-v61" d="M0 18 H82 L94 15 L102 22 L111 18 H169 L179 7 L190 29 L201 18 H275 L285 14 L294 22 L304 18 H362 L372 7 L383 29 L394 18 H467 L478 14 L487 22 L497 18 H600"></path>' +
        '<path class="pf-timer-trace-v61" pathLength="1000" d="M0 18 H82 L94 15 L102 22 L111 18 H169 L179 7 L190 29 L201 18 H275 L285 14 L294 22 L304 18 H362 L372 7 L383 29 L394 18 H467 L478 14 L487 22 L497 18 H600"></path>' +
      '</svg>';
    timers.insertAdjacentElement('afterend', wrap);
    return true;
  }

  function syncLabels() {
    var title = document.querySelector('#session-modal .hype-progress-title');
    if (title) title.setAttribute('aria-label','Passflöde');
  }

  function sync() {
    ensureTimerEcg();
    syncLabels();
  }

  function install() {
    addStyles();
    sync();
    var attempts = 0;
    (function retry() {
      attempts += 1;
      if (ensureTimerEcg()) { syncLabels(); return; }
      if (attempts < 80) setTimeout(retry,50);
    })();
    window.addEventListener('pageshow', function () { setTimeout(sync,0); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
