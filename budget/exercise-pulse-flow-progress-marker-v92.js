(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowProgressMarkerV95Installed) return;
  window.__exercisePulseFlowProgressMarkerV95Installed=true;

  var LIVE='pf-ex-runtime-current-v95';
  var timer=null;

  var style=document.createElement('style');
  style.id='exercise-pulse-flow-progress-marker-v95-style';
  style.textContent=`
    /* Marker language from 8251202c: outlined pending points, filled completed
       points and a large pulsing live playhead. */
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment{
      opacity:1!important;
      filter:none!important;
      transform:none!important;
      overflow:visible!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment>.pf-progress-dot-v80{
      display:block!important;
      position:relative!important;
      z-index:2!important;
      width:9px!important;
      height:9px!important;
      flex:0 0 9px!important;
      box-sizing:border-box!important;
      border-radius:50%!important;
      border:1px solid rgba(100,116,139,.70)!important;
      background:#0B121A!important;
      box-shadow:0 0 0 2px #090E15,0 0 7px rgba(100,116,139,.12)!important;
      filter:none!important;
      opacity:1!important;
      transform:none!important;
      animation:none!important;
      transition:width .16s ease,height .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.strength>.pf-progress-dot-v80{
      border-color:rgba(251,146,60,.62)!important;
      box-shadow:0 0 0 2px #090E15,0 0 10px rgba(251,146,60,.18)!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.cardio>.pf-progress-dot-v80{
      border-color:rgba(239,68,68,.64)!important;
      box-shadow:0 0 0 2px #090E15,0 0 10px rgba(239,68,68,.19)!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.canonical-custom-v10>.pf-progress-dot-v80{
      border-color:rgba(251,146,60,.62)!important;
      box-shadow:0 0 0 2px #090E15,0 0 10px rgba(251,146,60,.18)!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.strength>.pf-progress-dot-v80{
      background:#FB923C!important;
      border-color:#FED7AA!important;
      box-shadow:0 0 0 2px #090E15,0 0 11px rgba(251,146,60,.66),0 0 22px rgba(251,146,60,.25)!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.cardio>.pf-progress-dot-v80{
      background:#EF4444!important;
      border-color:#FCA5A5!important;
      box-shadow:0 0 0 2px #090E15,0 0 11px rgba(239,68,68,.68),0 0 22px rgba(239,68,68,.25)!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.canonical-custom-v10>.pf-progress-dot-v80{
      background:#FB923C!important;
      border-color:#FED7AA!important;
      box-shadow:0 0 0 2px #090E15,0 0 11px rgba(251,146,60,.66),0 0 22px rgba(251,146,60,.25)!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current>.pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80{
      width:17px!important;
      height:17px!important;
      flex:0 0 17px!important;
      opacity:1!important;
      filter:none!important;
      animation:pfProgressMarkerPulseV95 1.18s ease-in-out infinite!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.strength>.pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.strength>.pf-progress-dot-v80{
      --pf-live-rgb:251,146,60;
      background:#FB923C!important;
      border:2px solid #FED7AA!important;
      box-shadow:0 0 0 4px rgba(251,146,60,.13),0 0 15px rgba(251,146,60,.86),0 0 31px rgba(251,146,60,.34)!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.cardio>.pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.cardio>.pf-progress-dot-v80{
      --pf-live-rgb:239,68,68;
      background:#EF4444!important;
      border:2px solid #FCA5A5!important;
      box-shadow:0 0 0 4px rgba(239,68,68,.13),0 0 15px rgba(239,68,68,.88),0 0 31px rgba(239,68,68,.35)!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.canonical-custom-v10>.pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.canonical-custom-v10>.pf-progress-dot-v80{
      --pf-live-rgb:251,146,60;
      background:#FB923C!important;
      border:2px solid #FED7AA!important;
      box-shadow:0 0 0 4px rgba(251,146,60,.13),0 0 15px rgba(251,146,60,.86),0 0 31px rgba(251,146,60,.34)!important;
    }

    @keyframes pfProgressMarkerPulseV95{
      50%{box-shadow:0 0 0 7px rgba(var(--pf-live-rgb),.05),0 0 20px rgba(var(--pf-live-rgb),.94),0 0 38px rgba(var(--pf-live-rgb),.38)}
    }
    @media(max-width:600px){
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80{width:16px!important;height:16px!important;flex-basis:16px!important}
    }
    @media(prefers-reduced-motion:reduce){
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80{animation:none!important}
    }
  `;
  document.head.appendChild(style);

  function ensureDot(segment){
    var dot=segment.querySelector(':scope>.pf-progress-dot-v80');
    if(dot) return dot;
    dot=document.createElement('span');
    dot.className='pf-progress-dot-v80';
    dot.setAttribute('aria-hidden','true');
    segment.appendChild(dot);
    return dot;
  }

  function sync(){
    var modal=document.getElementById('session-modal');
    var track=document.getElementById('hype-progress-track');
    if(!modal||!track){timer=setTimeout(sync,220);return;}

    var segments=Array.prototype.slice.call(track.querySelectorAll('.hype-progress-segment'));
    if(!segments.length){timer=setTimeout(sync,160);return;}
    segments.forEach(ensureDot);

    /* Canonical .current wins while a set is starting/running. Before the first
       set (and between ready states), highlight the first unfinished moment so
       set 1 never has an empty playhead. */
    var target=track.querySelector('.hype-progress-segment.current:not(.done)');
    if(!target){
      target=segments.find(function(seg){return !seg.classList.contains('done');})||null;
    }

    segments.forEach(function(seg){
      seg.classList.toggle(LIVE,seg===target);
    });

    timer=setTimeout(sync,160);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
})();
