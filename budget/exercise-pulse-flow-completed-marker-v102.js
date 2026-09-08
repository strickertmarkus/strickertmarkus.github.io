(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowCompletedMarkerV102Installed) return;
  window.__exercisePulseFlowCompletedMarkerV102Installed=true;

  var style=document.createElement('style');
  style.id='exercise-pulse-flow-completed-marker-v102-style';
  style.textContent=`
    /* Completed Pulse Flow moments only: slightly smaller, with a restrained
       colour gradient. Extra #hype-progress-track specificity keeps this rule
       authoritative even when the main marker stylesheet moves itself last. */
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #hype-progress-track .hype-progress-segment[data-pf-done-v98="true"]>.pf-progress-dot-v80{
      width:8px!important;
      height:8px!important;
      flex-basis:8px!important;
      border:0!important;
      outline:0!important;
      animation:none!important;
      filter:none!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #hype-progress-track .hype-progress-segment[data-pf-done-v98="true"][data-pf-kind-v98="strength"]>.pf-progress-dot-v80{
      background:radial-gradient(circle at 42% 38%,rgba(254,215,170,.88) 0%,rgba(253,186,116,.96) 24%,rgba(251,146,60,.98) 55%,rgba(249,115,22,.92) 100%)!important;
      box-shadow:0 0 4px rgba(251,146,60,.78),0 0 9px rgba(251,146,60,.22)!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #hype-progress-track .hype-progress-segment[data-pf-done-v98="true"][data-pf-kind-v98="cardio"]>.pf-progress-dot-v80{
      background:radial-gradient(circle at 42% 38%,rgba(254,202,202,.88) 0%,rgba(248,113,113,.96) 27%,rgba(239,68,68,.98) 58%,rgba(220,38,38,.92) 100%)!important;
      box-shadow:0 0 4px rgba(239,68,68,.80),0 0 9px rgba(239,68,68,.23)!important;
    }
  `;
  document.head.appendChild(style);
})();
