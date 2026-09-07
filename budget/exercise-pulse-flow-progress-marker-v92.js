(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowProgressMarkerV92Installed) return;
  window.__exercisePulseFlowProgressMarkerV92Installed=true;

  var style=document.createElement('style');
  style.id='exercise-pulse-flow-progress-marker-v92-style';
  style.textContent=`
    /* Restore the Passflöde marker language from 8251202c: luminous coloured
       points at every step, with a slightly larger/brighter live playhead. */
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment{
      opacity:1!important;
      filter:none!important;
      transform:none!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment > .pf-progress-dot-v80{
      display:block!important;
      width:7px!important;
      height:7px!important;
      flex:0 0 7px!important;
      border:0!important;
      outline:0!important;
      border-radius:50%!important;
      box-shadow:none!important;
      transform:none!important;
      opacity:1!important;
      animation:none!important;
      transition:width .16s ease,height .16s ease,filter .18s ease,background .16s ease!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.strength > .pf-progress-dot-v80{
      background:radial-gradient(circle,#FED7AA 0 17%,#FB923C 30%,rgba(251,146,60,.88) 43%,rgba(251,146,60,.45) 61%,rgba(251,146,60,.13) 77%,transparent 100%)!important;
      filter:drop-shadow(0 0 4px rgba(251,146,60,.48)) drop-shadow(0 0 8px rgba(251,146,60,.19))!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.cardio > .pf-progress-dot-v80{
      background:radial-gradient(circle,#FCA5A5 0 17%,#EF4444 30%,rgba(239,68,68,.89) 43%,rgba(239,68,68,.46) 61%,rgba(239,68,68,.13) 77%,transparent 100%)!important;
      filter:drop-shadow(0 0 4px rgba(239,68,68,.50)) drop-shadow(0 0 8px rgba(239,68,68,.20))!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done > .pf-progress-dot-v80{
      width:8px!important;
      height:8px!important;
      flex-basis:8px!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.strength > .pf-progress-dot-v80{
      filter:drop-shadow(0 0 5px rgba(251,146,60,.70)) drop-shadow(0 0 11px rgba(251,146,60,.28))!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.cardio > .pf-progress-dot-v80{
      filter:drop-shadow(0 0 5px rgba(239,68,68,.72)) drop-shadow(0 0 11px rgba(239,68,68,.29))!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.pf-progress-runtime-current-v93 > .pf-progress-dot-v80{
      width:10px!important;
      height:10px!important;
      flex-basis:10px!important;
      opacity:1!important;
      border:0!important;
      outline:0!important;
      box-shadow:none!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.strength > .pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.pf-progress-runtime-current-v93.strength > .pf-progress-dot-v80{
      filter:drop-shadow(0 0 6px rgba(251,146,60,.92)) drop-shadow(0 0 14px rgba(251,146,60,.38))!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.cardio > .pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.pf-progress-runtime-current-v93.cardio > .pf-progress-dot-v80{
      filter:drop-shadow(0 0 6px rgba(239,68,68,.94)) drop-shadow(0 0 14px rgba(239,68,68,.40))!important;
    }

    /* Runtime mode wins for the live playhead. This avoids a stale segment class
       leaving a running conditioning set orange/grey. */
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-cardio-v58.show:not(.session-overview-mode) .hype-progress-segment.pf-progress-runtime-current-v93 > .pf-progress-dot-v80{
      background:radial-gradient(circle,#FCA5A5 0 17%,#EF4444 30%,rgba(239,68,68,.89) 43%,rgba(239,68,68,.46) 61%,rgba(239,68,68,.13) 77%,transparent 100%)!important;
      filter:drop-shadow(0 0 6px rgba(239,68,68,.94)) drop-shadow(0 0 14px rgba(239,68,68,.40))!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-strength-v58.show:not(.session-overview-mode) .hype-progress-segment.pf-progress-runtime-current-v93 > .pf-progress-dot-v80{
      background:radial-gradient(circle,#FED7AA 0 17%,#FB923C 30%,rgba(251,146,60,.88) 43%,rgba(251,146,60,.45) 61%,rgba(251,146,60,.13) 77%,transparent 100%)!important;
      filter:drop-shadow(0 0 6px rgba(251,146,60,.92)) drop-shadow(0 0 14px rgba(251,146,60,.38))!important;
    }
  `;
  document.head.appendChild(style);

  function getState(){
    try{return typeof sessionState!=='undefined'?sessionState:null;}catch(_){return null;}
  }

  function syncRuntimeMarker(){
    var modal=document.getElementById('session-modal');
    var track=document.getElementById('hype-progress-track');
    if(!modal||!track) return;

    var segments=Array.prototype.slice.call(track.querySelectorAll('.hype-progress-segment'));
    if(!segments.length) return;

    segments.forEach(function(segment){
      var dot=segment.querySelector(':scope > .pf-progress-dot-v80');
      if(!dot){
        dot=document.createElement('span');
        dot.className='pf-progress-dot-v80';
        dot.setAttribute('aria-hidden','true');
        segment.appendChild(dot);
      }
      segment.classList.remove('pf-progress-runtime-current-v93');
    });

    var state=getState();
    var pre=document.getElementById('session-pre-timer');
    var engaged=!!(state&&state.setRunning) || !!(pre&&pre.classList.contains('show')) || modal.classList.contains('pulse-flow-starting-v58');
    if(!engaged) return;

    var current=track.querySelector('.hype-progress-segment.current:not(.done)');
    if(!current){
      current=segments.find(function(segment){return !segment.classList.contains('done');}) || null;
    }
    if(current) current.classList.add('pf-progress-runtime-current-v93');
  }

  var queued=false;
  function queueSync(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(function(){queued=false;syncRuntimeMarker();});
  }

  function installObserver(){
    syncRuntimeMarker();
    var modal=document.getElementById('session-modal');
    if(!modal) return;
    var observer=new MutationObserver(queueSync);
    observer.observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    setInterval(queueSync,180);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installObserver,{once:true});
  else installObserver();
})();
