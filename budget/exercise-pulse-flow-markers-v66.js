(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase() !== 'pulse-home') return;
  if (window.__exercisePulseFlowMarkersV66Installed) return;
  window.__exercisePulseFlowMarkersV66Installed = true;

  function install() {
    if (document.getElementById('exercise-pulse-flow-markers-v66-style')) return;

    var style = document.createElement('style');
    style.id = 'exercise-pulse-flow-markers-v66-style';
    style.textContent = `
      /* Final Passflöde marker authority.
         Return to the original Pulse Flow language (v58: 5px / 9px),
         only slightly larger with a little more glow. */
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
        background-image:none !important;
        filter:none !important;
        transform:none !important;
        opacity:1 !important;
        transition:width .16s ease,height .16s ease,background-color .16s ease,box-shadow .18s ease,transform .18s ease !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength::after {
        background:#FB923C !important;
        box-shadow:
          0 0 5px rgba(251,146,60,.64),
          0 0 11px rgba(251,146,60,.22) !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio::after {
        background:#EF4444 !important;
        box-shadow:
          0 0 5px rgba(239,68,68,.66),
          0 0 11px rgba(239,68,68,.23) !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done::after {
        width:8px !important;
        height:8px !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.strength::after {
        background:#FB923C !important;
        box-shadow:
          0 0 6px rgba(251,146,60,.82),
          0 0 13px rgba(251,146,60,.30) !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.cardio::after {
        background:#EF4444 !important;
        box-shadow:
          0 0 6px rgba(239,68,68,.84),
          0 0 13px rgba(239,68,68,.30) !important;
      }

      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
        width:11px !important;
        height:11px !important;
        border:0 !important;
        outline:0 !important;
        background:var(--pf-accent) !important;
        background-image:none !important;
        box-shadow:
          0 0 7px rgba(var(--pf-rgb),.92),
          0 0 15px rgba(var(--pf-rgb),.38) !important;
        filter:none !important;
        animation:pfMarkerPulseV66 1.15s ease-in-out infinite !important;
      }

      @keyframes pfMarkerPulseV66 {
        0%,100% {
          transform:scale(1);
          box-shadow:
            0 0 7px rgba(var(--pf-rgb),.92),
            0 0 15px rgba(var(--pf-rgb),.38);
        }
        50% {
          transform:scale(1.07);
          box-shadow:
            0 0 8px rgba(var(--pf-rgb),1),
            0 0 18px rgba(var(--pf-rgb),.46);
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
