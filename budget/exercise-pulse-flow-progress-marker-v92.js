(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowProgressMarkerV96Installed) return;
  window.__exercisePulseFlowProgressMarkerV96Installed=true;

  var LIVE='pf-ex-runtime-current-v96';
  var timer=null;
  var installed=false;

  function installFinalStyle(){
    if(installed) return true;

    /* exercise-pulse-flow-motion-v67 owns the base Pulse Flow presentation.
       Wait until that stylesheet exists so this file is always the final visual
       authority and cannot be overwritten by the later Pulse Flow render pass. */
    if(!document.getElementById('exercise-pulse-flow-main-v85-style')) return false;

    [
      'exercise-pulse-flow-progress-marker-v92-style',
      'exercise-pulse-flow-progress-marker-v94-style',
      'exercise-pulse-flow-progress-marker-v95-style',
      'exercise-pulse-flow-progress-marker-v96-style'
    ].forEach(function(id){
      var old=document.getElementById(id);
      if(old) old.remove();
    });

    var style=document.createElement('style');
    style.id='exercise-pulse-flow-progress-marker-v96-style';
    style.textContent=`
      /* -------------------------------------------------------------
         FINAL PASSFLÖDE MARKER AUTHORITY
         Visual target: approved v96 mockup / 8251202c marker language.
         ------------------------------------------------------------- */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment{
        opacity:1!important;
        filter:none!important;
        transform:none!important;
        overflow:visible!important;
      }

      /* Future / untouched moments: visible exercise-coloured ghosts. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment>.pf-progress-dot-v80{
        display:block!important;
        position:relative!important;
        z-index:2!important;
        width:7px!important;
        height:7px!important;
        flex:0 0 7px!important;
        box-sizing:border-box!important;
        border-radius:50%!important;
        border:1px solid rgba(100,116,139,.28)!important;
        background:rgba(100,116,139,.10)!important;
        box-shadow:0 0 5px rgba(100,116,139,.06)!important;
        filter:none!important;
        opacity:1!important;
        transform:none!important;
        animation:none!important;
        transition:width .16s ease,height .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease,filter .16s ease!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.strength>.pf-progress-dot-v80{
        border-color:rgba(251,146,60,.25)!important;
        background:rgba(251,146,60,.12)!important;
        box-shadow:0 0 6px rgba(251,146,60,.08)!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.cardio:not(.canonical-custom-v10)>.pf-progress-dot-v80{
        border-color:rgba(239,68,68,.25)!important;
        background:rgba(239,68,68,.12)!important;
        box-shadow:0 0 6px rgba(239,68,68,.08)!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.canonical-custom-v10>.pf-progress-dot-v80{
        border-color:rgba(251,146,60,.25)!important;
        background:rgba(251,146,60,.12)!important;
        box-shadow:0 0 6px rgba(251,146,60,.08)!important;
      }

      /* Completed moments: compact solid points. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done>.pf-progress-dot-v80{
        width:9px!important;
        height:9px!important;
        flex-basis:9px!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.strength>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.canonical-custom-v10>.pf-progress-dot-v80{
        background:#FB923C!important;
        border-color:#FDBA74!important;
        box-shadow:0 0 5px rgba(251,146,60,.90),0 0 12px rgba(251,146,60,.30)!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.cardio:not(.canonical-custom-v10)>.pf-progress-dot-v80{
        background:#EF4444!important;
        border-color:#FCA5A5!important;
        box-shadow:0 0 5px rgba(239,68,68,.92),0 0 12px rgba(239,68,68,.31)!important;
      }

      /* The next moment before Starta set: clearly coloured and alive, but
         intentionally smaller/softer than the marker while the set is running. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80{
        width:11px!important;
        height:11px!important;
        flex-basis:11px!important;
        border:0!important;
        opacity:1!important;
        overflow:visible!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.strength>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.canonical-custom-v10>.pf-progress-dot-v80{
        --pf-progress-live-rgb:251,146,60;
        background:radial-gradient(circle,#FED7AA 0 20%,#FB923C 31%,rgba(251,146,60,.88) 46%,rgba(251,146,60,.40) 68%,rgba(251,146,60,.08) 84%,transparent 100%)!important;
        box-shadow:none!important;
        filter:drop-shadow(0 0 4px rgba(251,146,60,.86)) drop-shadow(0 0 10px rgba(251,146,60,.34))!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.cardio:not(.canonical-custom-v10)>.pf-progress-dot-v80{
        --pf-progress-live-rgb:239,68,68;
        background:radial-gradient(circle,#FCA5A5 0 20%,#EF4444 31%,rgba(239,68,68,.90) 46%,rgba(239,68,68,.42) 68%,rgba(239,68,68,.08) 84%,transparent 100%)!important;
        box-shadow:none!important;
        filter:drop-shadow(0 0 4px rgba(239,68,68,.88)) drop-shadow(0 0 10px rgba(239,68,68,.36))!important;
      }

      /* Keep the earlier elegant progress-point pulse as an independent halo.
         Using a child pseudo-element avoids fighting !important declarations
         from the base Pulse Flow stylesheet. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80::after,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current>.pf-progress-dot-v80::after{
        content:''!important;
        display:block!important;
        position:absolute!important;
        z-index:-1!important;
        left:50%!important;
        top:50%!important;
        width:100%!important;
        height:100%!important;
        border-radius:50%!important;
        border:1px solid rgba(var(--pf-progress-live-rgb),.44)!important;
        box-shadow:0 0 8px rgba(var(--pf-progress-live-rgb),.48),0 0 16px rgba(var(--pf-progress-live-rgb),.20)!important;
        pointer-events:none!important;
        animation:pfProgressHaloV96 1.18s ease-in-out infinite!important;
      }
      @keyframes pfProgressHaloV96{
        0%,100%{transform:translate(-50%,-50%) scale(.88);opacity:.72}
        50%{transform:translate(-50%,-50%) scale(1.72);opacity:.10}
      }

      /* Once the set starts, the progress marker becomes the same marker
         language as the circular timer endpoint: white core -> soft colour ->
         saturated accent -> transparent halo. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-starting-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current>.pf-progress-dot-v80{
        width:15px!important;
        height:15px!important;
        flex-basis:15px!important;
        border:0!important;
        box-shadow:none!important;
        opacity:1!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.strength>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-starting-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.strength>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.strength>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.canonical-custom-v10>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-starting-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.canonical-custom-v10>.pf-progress-dot-v80{
        --pf-progress-live-rgb:251,146,60;
        background:radial-gradient(circle,#FFFFFF 0 8%,#FED7AA 20%,#FB923C 43%,rgba(251,146,60,.42) 68%,transparent 100%)!important;
        filter:drop-shadow(0 0 3px rgba(251,146,60,1)) drop-shadow(0 0 9px rgba(251,146,60,.74)) drop-shadow(0 0 18px rgba(251,146,60,.34))!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.cardio:not(.canonical-custom-v10)>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-starting-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}.cardio:not(.canonical-custom-v10)>.pf-progress-dot-v80,
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current.cardio:not(.canonical-custom-v10)>.pf-progress-dot-v80{
        --pf-progress-live-rgb:239,68,68;
        background:radial-gradient(circle,#FFFFFF 0 8%,#FCA5A5 20%,#EF4444 43%,rgba(239,68,68,.42) 68%,transparent 100%)!important;
        filter:drop-shadow(0 0 3px rgba(239,68,68,1)) drop-shadow(0 0 9px rgba(239,68,68,.74)) drop-shadow(0 0 18px rgba(239,68,68,.34))!important;
      }

      /* 5 s toggle: builder-style glow. This lives in the final authority
         stylesheet so the base Pulse Flow frame cannot flatten it afterwards. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-pretimer-toggle-v2[aria-pressed="true"]{
        border-color:rgba(var(--pf-rgb),.60)!important;
        background:linear-gradient(135deg,rgba(var(--pf-rgb),.16),rgba(var(--pf-rgb),.08))!important;
        color:var(--pf-soft)!important;
        box-shadow:inset 0 0 0 1px rgba(var(--pf-rgb),.13),0 0 12px rgba(var(--pf-rgb),.19),0 0 28px rgba(var(--pf-rgb),.13)!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-pretimer-toggle-v2[aria-pressed="true"] .session-timer-track-v48{
        background:rgba(var(--pf-rgb),.31)!important;
        box-shadow:inset 0 0 0 1px rgba(var(--pf-rgb),.37),0 0 11px rgba(var(--pf-rgb),.22)!important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-pretimer-toggle-v2[aria-pressed="true"] .session-timer-knob-v48{
        background:var(--pf-soft)!important;
        box-shadow:0 0 7px rgba(var(--pf-rgb),.95),0 0 15px rgba(var(--pf-rgb),.48),0 0 25px rgba(var(--pf-rgb),.20)!important;
      }

      @media(max-width:600px){
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment>.pf-progress-dot-v80{width:7px!important;height:7px!important;flex-basis:7px!important}
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done>.pf-progress-dot-v80{width:9px!important;height:9px!important;flex-basis:9px!important}
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80{width:11px!important;height:11px!important;flex-basis:11px!important}
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80,
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-starting-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80,
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current>.pf-progress-dot-v80{width:15px!important;height:15px!important;flex-basis:15px!important}
      }
      @media(prefers-reduced-motion:reduce){
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80::after,
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current>.pf-progress-dot-v80::after{animation:none!important;opacity:.28!important;transform:translate(-50%,-50%) scale(1.35)!important}
      }
    `;
    document.head.appendChild(style);
    installed=true;
    return true;
  }

  function getState(){
    try{return typeof sessionState!=='undefined'?sessionState:null;}catch(_){return null;}
  }

  function ensureDot(segment){
    var dot=segment.querySelector(':scope>.pf-progress-dot-v80');
    if(dot) return dot;
    segment.querySelectorAll(':scope>[class^="pf-progress-dot-"]').forEach(function(node){node.remove();});
    dot=document.createElement('span');
    dot.className='pf-progress-dot-v80';
    dot.setAttribute('aria-hidden','true');
    segment.appendChild(dot);
    return dot;
  }

  function findTargetIndex(state,segments){
    if(!segments.length) return -1;

    /* Use the canonical progress calculator whenever available. This keeps
       custom between-set moments and historical logs aligned with the visible
       progress row. */
    var api=window.__exerciseProgressConsistencyV10;
    if(state&&api&&typeof api.calculate==='function'){
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

    var current=segments.findIndex(function(segment){
      return segment.classList.contains('current')&&!segment.classList.contains('done');
    });
    if(current>=0) return current;
    return segments.findIndex(function(segment){return !segment.classList.contains('done');});
  }

  function sync(){
    if(!installFinalStyle()){
      timer=setTimeout(sync,80);
      return;
    }

    var modal=document.getElementById('session-modal');
    var track=document.getElementById('hype-progress-track');
    if(!modal||!track){timer=setTimeout(sync,180);return;}

    var segments=Array.prototype.slice.call(track.querySelectorAll('.hype-progress-segment'));
    if(!segments.length){timer=setTimeout(sync,140);return;}
    segments.forEach(ensureDot);

    var state=getState();
    var targetIndex=modal.classList.contains('pulse-flow-complete-v58') ? -1 : findTargetIndex(state,segments);

    segments.forEach(function(seg,index){
      ['pf-progress-runtime-current-v93','pf-progress-runtime-current-v94','pf-ex-runtime-current-v95'].forEach(function(oldClass){
        if(seg.classList.contains(oldClass)) seg.classList.remove(oldClass);
      });
      var shouldBeLive=index===targetIndex&&!seg.classList.contains('done');
      if(seg.classList.contains(LIVE)!==shouldBeLive) seg.classList.toggle(LIVE,shouldBeLive);
    });

    timer=setTimeout(sync,120);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
})();
