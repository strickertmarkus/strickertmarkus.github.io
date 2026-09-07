(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowProgressMarkerV94Installed) return;
  window.__exercisePulseFlowProgressMarkerV94Installed=true;

  var style=document.createElement('style');
  style.id='exercise-pulse-flow-progress-marker-v94-style';
  style.textContent=`
    /* Passflöde markers restored to the 8251202c language:
       outlined resting points, filled completed points and a large pulsing playhead. */
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment{
      opacity:1!important;
      filter:none!important;
      transform:none!important;
      overflow:visible!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment > .pf-progress-dot-v80{
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
      transition:width .16s ease,height .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease,filter .16s ease!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.strength > .pf-progress-dot-v80{
      border-color:rgba(251,146,60,.62)!important;
      box-shadow:0 0 0 2px #090E15,0 0 10px rgba(251,146,60,.18)!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.cardio > .pf-progress-dot-v80{
      border-color:rgba(239,68,68,.64)!important;
      box-shadow:0 0 0 2px #090E15,0 0 10px rgba(239,68,68,.19)!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.canonical-custom-v10 > .pf-progress-dot-v80{
      border-color:rgba(251,146,60,.62)!important;
      box-shadow:0 0 0 2px #090E15,0 0 10px rgba(251,146,60,.18)!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.strength > .pf-progress-dot-v80{
      background:#FB923C!important;
      border-color:#FED7AA!important;
      box-shadow:0 0 0 2px #090E15,0 0 11px rgba(251,146,60,.66),0 0 22px rgba(251,146,60,.25)!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.cardio > .pf-progress-dot-v80{
      background:#EF4444!important;
      border-color:#FCA5A5!important;
      box-shadow:0 0 0 2px #090E15,0 0 11px rgba(239,68,68,.68),0 0 22px rgba(239,68,68,.25)!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.canonical-custom-v10 > .pf-progress-dot-v80{
      background:#FB923C!important;
      border-color:#FED7AA!important;
      box-shadow:0 0 0 2px #090E15,0 0 11px rgba(251,146,60,.66),0 0 22px rgba(251,146,60,.25)!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.pf-progress-runtime-current-v94 > .pf-progress-dot-v80{
      width:17px!important;
      height:17px!important;
      flex:0 0 17px!important;
      border-width:2px!important;
      opacity:1!important;
      filter:none!important;
      animation:pfProgressPulseV94 1.18s ease-in-out infinite!important;
    }

    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.strength > .pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.pf-progress-runtime-current-v94.strength > .pf-progress-dot-v80{
      --pf-progress-live-rgb:251,146,60;
      background:#FB923C!important;
      border-color:#FED7AA!important;
      box-shadow:0 0 0 4px rgba(251,146,60,.13),0 0 15px rgba(251,146,60,.86),0 0 31px rgba(251,146,60,.34)!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.cardio:not(.canonical-custom-v10) > .pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.pf-progress-runtime-current-v94.cardio:not(.canonical-custom-v10) > .pf-progress-dot-v80{
      --pf-progress-live-rgb:239,68,68;
      background:#EF4444!important;
      border-color:#FCA5A5!important;
      box-shadow:0 0 0 4px rgba(239,68,68,.13),0 0 15px rgba(239,68,68,.86),0 0 31px rgba(239,68,68,.34)!important;
    }
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.canonical-custom-v10 > .pf-progress-dot-v80,
    html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.pf-progress-runtime-current-v94.canonical-custom-v10 > .pf-progress-dot-v80{
      --pf-progress-live-rgb:251,146,60;
      background:#FB923C!important;
      border-color:#FED7AA!important;
      box-shadow:0 0 0 4px rgba(251,146,60,.13),0 0 15px rgba(251,146,60,.86),0 0 31px rgba(251,146,60,.34)!important;
    }

    @keyframes pfProgressPulseV94{
      50%{
        box-shadow:0 0 0 7px rgba(var(--pf-progress-live-rgb),.05),0 0 20px rgba(var(--pf-progress-live-rgb),.94),0 0 38px rgba(var(--pf-progress-live-rgb),.38)!important;
      }
    }

    @media(max-width:600px){
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment > .pf-progress-dot-v80{
        width:8px!important;
        height:8px!important;
        flex-basis:8px!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.pf-progress-runtime-current-v94 > .pf-progress-dot-v80{
        width:16px!important;
        height:16px!important;
        flex-basis:16px!important;
      }
    }

    @media(prefers-reduced-motion:reduce){
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current > .pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.pf-progress-runtime-current-v94 > .pf-progress-dot-v80{
        animation:none!important;
      }
    }
  `;
  document.head.appendChild(style);

  function getState(){
    try{return typeof sessionState!=='undefined'?sessionState:null;}catch(_){return null;}
  }

  function ensureDot(segment){
    var dot=segment.querySelector(':scope > .pf-progress-dot-v80');
    if(dot) return dot;
    segment.querySelectorAll(':scope > [class^="pf-progress-dot-"]').forEach(function(node){node.remove();});
    dot=document.createElement('span');
    dot.className='pf-progress-dot-v80';
    dot.setAttribute('aria-hidden','true');
    segment.appendChild(dot);
    return dot;
  }

  function findTargetIndex(state,segments){
    if(!state||!segments.length) return -1;

    var api=window.__exerciseProgressConsistencyV10;
    if(api&&typeof api.calculate==='function'){
      try{
        var result=api.calculate(state);
        if(result&&Array.isArray(result.segments)&&result.segments.length===segments.length){
          var i=result.segments.findIndex(function(segment){return segment.current&&!segment.done;});
          if(i>=0) return i;

          var exIndex=Math.max(0,Number(state.exerciseIndex)||0);
          var setIndex=Math.max(0,(Number(state.currentSet)||1)-1);
          i=result.segments.findIndex(function(segment){
            return !segment.done&&segment.type==='base'&&Number(segment.exIndex)===exIndex&&Number(segment.setIndex)===setIndex;
          });
          if(i>=0) return i;

          i=result.segments.findIndex(function(segment){return !segment.done;});
          if(i>=0) return i;
          return -1;
        }
      }catch(_){}
    }

    var current=segments.findIndex(function(segment){return segment.classList.contains('current')&&!segment.classList.contains('done');});
    if(current>=0) return current;
    return segments.findIndex(function(segment){return !segment.classList.contains('done');});
  }

  function syncMarker(){
    var modal=document.getElementById('session-modal');
    var track=document.getElementById('hype-progress-track');
    if(!modal||!track) return;

    var segments=Array.prototype.slice.call(track.querySelectorAll('.hype-progress-segment'));
    if(!segments.length) return;

    segments.forEach(function(segment){
      ensureDot(segment);
      segment.classList.remove('pf-progress-runtime-current-v93','pf-progress-runtime-current-v94');
    });

    var state=getState();
    if(!state) return;
    if(modal.classList.contains('pulse-flow-complete-v58')) return;

    var targetIndex=findTargetIndex(state,segments);
    if(targetIndex>=0&&segments[targetIndex]&&!segments[targetIndex].classList.contains('done')){
      segments[targetIndex].classList.add('pf-progress-runtime-current-v94');
    }
  }

  var lastSync=0;
  function loop(now){
    if(!lastSync||now-lastSync>=80){
      lastSync=now;
      syncMarker();
    }
    requestAnimationFrame(loop);
  }

  function install(){
    syncMarker();
    requestAnimationFrame(loop);
    var modal=document.getElementById('session-modal');
    if(modal){
      var observer=new MutationObserver(syncMarker);
      observer.observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
