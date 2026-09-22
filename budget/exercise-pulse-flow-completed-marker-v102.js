(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowCompletedMarkerV103Installed) return;
  window.__exercisePulseFlowCompletedMarkerV103Installed=true;

  var style=document.createElement('style');
  style.id='exercise-pulse-flow-completed-marker-v103-style';
  style.textContent=`
    /* Completed Pulse Flow moments only: compact and flatter than the live
       marker. Keep a tiny centred pale core, but use transparent concentric
       colour instead of the previous off-centre highlight/3D look. */
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
      background:radial-gradient(circle at 50% 50%,rgba(255,247,237,.78) 0%,rgba(254,215,170,.66) 17%,rgba(253,186,116,.72) 38%,rgba(251,146,60,.70) 66%,rgba(251,146,60,.40) 100%)!important;
      box-shadow:0 0 4px rgba(251,146,60,.62),0 0 8px rgba(251,146,60,.17)!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #hype-progress-track .hype-progress-segment[data-pf-done-v98="true"][data-pf-kind-v98="cardio"]>.pf-progress-dot-v80{
      background:radial-gradient(circle at 50% 50%,rgba(255,241,242,.78) 0%,rgba(254,202,202,.66) 17%,rgba(248,113,113,.72) 38%,rgba(239,68,68,.70) 66%,rgba(239,68,68,.40) 100%)!important;
      box-shadow:0 0 4px rgba(239,68,68,.64),0 0 8px rgba(239,68,68,.18)!important;
    }
  `;
  document.head.appendChild(style);
})();
