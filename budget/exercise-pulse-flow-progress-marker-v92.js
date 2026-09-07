(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowProgressMarkerV92Installed) return;
  window.__exercisePulseFlowProgressMarkerV92Installed=true;

  var style=document.createElement('style');
  style.id='exercise-pulse-flow-progress-marker-v92-style';
  style.textContent=`
    /* Pulse Flow progress marker: match the bright endpoint marker used by the circular timer. */
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment > .pf-progress-dot-v80{
      background:#334155!important;
      opacity:.92!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.strength > .pf-progress-dot-v80{
      background:#FB923C!important;
      opacity:1!important;
      box-shadow:0 0 4px rgba(251,146,60,.92),0 0 10px rgba(251,146,60,.34)!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.cardio > .pf-progress-dot-v80{
      background:#EF4444!important;
      opacity:1!important;
      box-shadow:0 0 4px rgba(239,68,68,.94),0 0 10px rgba(239,68,68,.36)!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-starting-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v80{
      width:15px!important;
      height:15px!important;
      flex:0 0 15px!important;
      opacity:1!important;
      border:0!important;
      border-radius:50%!important;
      box-shadow:none!important;
      transform:none!important;
    }

    /* Drive the live marker from the current Pulse Flow mode, not the stored segment class.
       This guarantees red for a running cardio set even if historical progress metadata lags behind. */
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-cardio-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-cardio-v58.pulse-flow-starting-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v80{
      background:radial-gradient(circle,#FFFFFF 0 8%,#FCA5A5 20%,#EF4444 43%,rgba(239,68,68,.62) 68%,rgba(239,68,68,.16) 84%,transparent 100%)!important;
      filter:drop-shadow(0 0 3px rgba(239,68,68,1)) drop-shadow(0 0 9px rgba(239,68,68,.88)) drop-shadow(0 0 18px rgba(239,68,68,.48))!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-strength-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-strength-v58.pulse-flow-starting-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v80{
      background:radial-gradient(circle,#FFFFFF 0 8%,#FED7AA 20%,#FB923C 43%,rgba(251,146,60,.62) 68%,rgba(251,146,60,.16) 84%,transparent 100%)!important;
      filter:drop-shadow(0 0 3px rgba(251,146,60,1)) drop-shadow(0 0 9px rgba(251,146,60,.86)) drop-shadow(0 0 18px rgba(251,146,60,.46))!important;
    }
  `;
  document.head.appendChild(style);
})();
