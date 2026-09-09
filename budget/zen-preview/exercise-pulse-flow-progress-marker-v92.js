(function(){
  'use strict';
  if(!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowProgressMarkerV98Installed) return;
  window.__exercisePulseFlowProgressMarkerV98Installed=true;

  var LIVE='pf-ex-runtime-current-v98';
  var STYLE_ID='exercise-pulse-flow-progress-marker-v98-style';
  var timer=null;
  var styleEl=null;

  function getState(){
    try{return typeof sessionState!=='undefined'?sessionState:null;}catch(_){return null;}
  }

  function ensureFinalStyle(){
    if(!document.getElementById('exercise-pulse-flow-main-v85-style')) return false;

    if(!styleEl){
      [
        'exercise-pulse-flow-progress-marker-v92-style',
        'exercise-pulse-flow-progress-marker-v94-style',
        'exercise-pulse-flow-progress-marker-v95-style',
        'exercise-pulse-flow-progress-marker-v96-style',
        'exercise-pulse-flow-progress-marker-v97-style',
        STYLE_ID
      ].forEach(function(id){
        var old=document.getElementById(id);
        if(old) old.remove();
      });

      styleEl=document.createElement('style');
      styleEl.id=STYLE_ID;
      styleEl.textContent=`
        /* Final visual authority for Pulse Flow progress + 5 s toggle. */
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment{
          opacity:1!important;
          filter:none!important;
          transform:none!important;
          overflow:visible!important;
        }

        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment>.pf-progress-dot-v80{
          display:block!important;
          position:relative!important;
          z-index:3!important;
          width:7px!important;
          height:7px!important;
          flex:0 0 7px!important;
          box-sizing:border-box!important;
          border-radius:50%!important;
          border:0!important;
          outline:0!important;
          background:rgba(100,116,139,.12)!important;
          box-shadow:0 0 5px rgba(100,116,139,.06)!important;
          filter:none!important;
          opacity:1!important;
          transform:none!important;
          animation:none!important;
          transition:width .16s ease,height .16s ease,background .16s ease,box-shadow .16s ease,filter .16s ease!important;
        }

        /* Pending points: faint but clearly exercise-coloured, exactly as approved. */
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment[data-pf-kind-v98="strength"]>.pf-progress-dot-v80{
          background:rgba(251,146,60,.16)!important;
          box-shadow:0 0 5px rgba(251,146,60,.10)!important;
        }
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment[data-pf-kind-v98="cardio"]>.pf-progress-dot-v80{
          background:rgba(239,68,68,.16)!important;
          box-shadow:0 0 5px rgba(239,68,68,.10)!important;
        }

        /* Completed points: compact, solid, no pale/white outline. */
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment[data-pf-done-v98="true"]>.pf-progress-dot-v80{
          width:9px!important;
          height:9px!important;
          flex-basis:9px!important;
        }
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment[data-pf-done-v98="true"][data-pf-kind-v98="strength"]>.pf-progress-dot-v80{
          background:#FB923C!important;
          box-shadow:0 0 5px rgba(251,146,60,.88),0 0 12px rgba(251,146,60,.31)!important;
        }
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment[data-pf-done-v98="true"][data-pf-kind-v98="cardio"]>.pf-progress-dot-v80{
          background:#EF4444!important;
          box-shadow:0 0 5px rgba(239,68,68,.90),0 0 12px rgba(239,68,68,.32)!important;
        }

        /* Next set before Starta set: deliberately softer/faded than the running marker. */
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80{
          width:10px!important;
          height:10px!important;
          flex-basis:10px!important;
          border:0!important;
          outline:0!important;
          transform:none!important;
        }
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}[data-pf-kind-v98="strength"]>.pf-progress-dot-v80{
          --pf-dot-rgb:251,146,60;
          background:radial-gradient(circle at 50% 50%,rgba(254,215,170,.72) 0 18%,rgba(253,186,116,.58) 19% 34%,rgba(251,146,60,.42) 35% 66%,rgba(251,146,60,.18) 67% 82%,rgba(251,146,60,.05) 83% 100%)!important;
          box-shadow:0 0 0 1px rgba(251,146,60,.14),0 0 5px rgba(251,146,60,.42),0 0 11px rgba(251,146,60,.15)!important;
          animation:pfDotReadyPulseV98 1.34s ease-in-out infinite!important;
        }
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}[data-pf-kind-v98="cardio"]>.pf-progress-dot-v80{
          --pf-dot-rgb:239,68,68;
          background:radial-gradient(circle at 50% 50%,rgba(255,209,215,.72) 0 18%,rgba(252,165,165,.58) 19% 34%,rgba(239,68,68,.44) 35% 66%,rgba(239,68,68,.19) 67% 82%,rgba(239,68,68,.05) 83% 100%)!important;
          box-shadow:0 0 0 1px rgba(239,68,68,.15),0 0 5px rgba(239,68,68,.44),0 0 11px rgba(239,68,68,.16)!important;
          animation:pfDotReadyPulseV98 1.34s ease-in-out infinite!important;
        }

        /* Starting/running share the base live size. The active set gets a
           slightly larger marker below without changing the pre-start preview. */
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80,
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-starting-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80{
          width:12px!important;
          height:12px!important;
          flex-basis:12px!important;
          border:0!important;
          outline:0!important;
          transform:none!important;
        }

        /* Starting state remains unchanged. */
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-starting-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}[data-pf-kind-v98="strength"]>.pf-progress-dot-v80{
          --pf-dot-rgb:251,146,60;
          background:radial-gradient(circle at 50% 50%,#FFE4C4 0 18%,#FDBA74 19% 33%,#FB923C 34% 67%,rgba(251,146,60,.82) 68% 82%,rgba(251,146,60,.16) 83% 100%)!important;
          box-shadow:0 0 0 2px rgba(251,146,60,.34),0 0 8px rgba(251,146,60,.94),0 0 19px rgba(251,146,60,.43)!important;
          animation:pfDotLivePulseV98 1.18s ease-in-out infinite!important;
        }
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-starting-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}[data-pf-kind-v98="cardio"]>.pf-progress-dot-v80{
          --pf-dot-rgb:239,68,68;
          background:radial-gradient(circle at 50% 50%,#FFD1D7 0 18%,#FCA5A5 19% 33%,#EF4444 34% 67%,rgba(239,68,68,.84) 68% 82%,rgba(239,68,68,.16) 83% 100%)!important;
          box-shadow:0 0 0 2px rgba(239,68,68,.36),0 0 8px rgba(239,68,68,.98),0 0 19px rgba(239,68,68,.45)!important;
          animation:pfDotLivePulseV98 1.18s ease-in-out infinite!important;
        }

        /* Active set only: larger, continuous radial colour scale with a smaller
           near-white core. The coloured edge dissolves directly into the pulse. */
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80{
          width:15px!important;
          height:15px!important;
          flex-basis:15px!important;
        }
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}[data-pf-kind-v98="strength"]>.pf-progress-dot-v80{
          --pf-dot-rgb:251,146,60;
          background:radial-gradient(circle at 50% 50%,rgba(255,247,237,.99) 0%,rgba(255,237,213,.98) 6%,rgba(254,215,170,.97) 15%,rgba(253,186,116,.94) 27%,rgba(251,146,60,.90) 43%,rgba(251,146,60,.77) 59%,rgba(251,146,60,.59) 73%,rgba(251,146,60,.43) 85%,rgba(251,146,60,.31) 94%,rgba(251,146,60,.23) 100%)!important;
          box-shadow:0 0 6px rgba(251,146,60,.98),0 0 13px rgba(251,146,60,.72),0 0 26px rgba(251,146,60,.39)!important;
          animation:pfDotActivePulseV101 1.08s ease-in-out infinite!important;
        }
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-active-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}[data-pf-kind-v98="cardio"]>.pf-progress-dot-v80{
          --pf-dot-rgb:239,68,68;
          background:radial-gradient(circle at 50% 50%,rgba(255,241,242,.99) 0%,rgba(255,228,230,.98) 6%,rgba(254,202,202,.97) 15%,rgba(252,165,165,.94) 27%,rgba(248,113,113,.91) 43%,rgba(239,68,68,.82) 59%,rgba(239,68,68,.63) 73%,rgba(239,68,68,.46) 85%,rgba(239,68,68,.33) 94%,rgba(239,68,68,.24) 100%)!important;
          box-shadow:0 0 6px rgba(239,68,68,1),0 0 13px rgba(239,68,68,.74),0 0 26px rgba(239,68,68,.41)!important;
          animation:pfDotActivePulseV101 1.08s ease-in-out infinite!important;
        }

        @keyframes pfDotReadyPulseV98{
          0%,100%{box-shadow:0 0 0 1px rgba(var(--pf-dot-rgb),.12),0 0 5px rgba(var(--pf-dot-rgb),.38),0 0 10px rgba(var(--pf-dot-rgb),.13)}
          50%{box-shadow:0 0 0 2px rgba(var(--pf-dot-rgb),.08),0 0 7px rgba(var(--pf-dot-rgb),.50),0 0 14px rgba(var(--pf-dot-rgb),.18)}
        }
        @keyframes pfDotLivePulseV98{
          0%,100%{box-shadow:0 0 5px rgba(var(--pf-dot-rgb),.94),0 0 11px rgba(var(--pf-dot-rgb),.66),0 0 22px rgba(var(--pf-dot-rgb),.33)}
          50%{box-shadow:0 0 7px rgba(var(--pf-dot-rgb),1),0 0 15px rgba(var(--pf-dot-rgb),.76),0 0 29px rgba(var(--pf-dot-rgb),.44)}
        }
        @keyframes pfDotActivePulseV101{
          0%,100%{box-shadow:0 0 5px rgba(var(--pf-dot-rgb),.96),0 0 12px rgba(var(--pf-dot-rgb),.68),0 0 24px rgba(var(--pf-dot-rgb),.34)}
          50%{box-shadow:0 0 9px rgba(var(--pf-dot-rgb),1),0 0 20px rgba(var(--pf-dot-rgb),.86),0 0 38px rgba(var(--pf-dot-rgb),.54)}
        }

        /* No pseudo halo from older versions; it caused the off-centre/white ring. */
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58 .hype-progress-segment>.pf-progress-dot-v80::before,
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58 .hype-progress-segment>.pf-progress-dot-v80::after{
          content:none!important;
          display:none!important;
          animation:none!important;
        }

        /* Approved 5 s toggle glow. */
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-pretimer-toggle-v2[aria-pressed="true"]{
          border-color:rgba(var(--pf-rgb),.62)!important;
          background:linear-gradient(135deg,rgba(var(--pf-rgb),.17),rgba(var(--pf-rgb),.085))!important;
          color:var(--pf-soft)!important;
          box-shadow:inset 0 0 0 1px rgba(var(--pf-rgb),.14),0 0 13px rgba(var(--pf-rgb),.22),0 0 31px rgba(var(--pf-rgb),.15)!important;
        }
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-pretimer-toggle-v2[aria-pressed="true"] .session-timer-track-v48{
          background:rgba(var(--pf-rgb),.33)!important;
          box-shadow:inset 0 0 0 1px rgba(var(--pf-rgb),.39),0 0 12px rgba(var(--pf-rgb),.24)!important;
        }
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-pretimer-toggle-v2[aria-pressed="true"] .session-timer-knob-v48{
          background:var(--pf-soft)!important;
          box-shadow:0 0 7px rgba(var(--pf-rgb),.96),0 0 16px rgba(var(--pf-rgb),.50),0 0 27px rgba(var(--pf-rgb),.22)!important;
        }

        @media(prefers-reduced-motion:reduce){
          html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.${LIVE}>.pf-progress-dot-v80{animation:none!important}
        }
      `;
      document.head.appendChild(styleEl);
    }

    /* Keep this stylesheet last. No observer, no layout loop; moving an existing
       node is cheap and only happens when another asset is appended after it. */
    if(document.head.lastElementChild!==styleEl) document.head.appendChild(styleEl);
    return true;
  }

  function ensureDot(segment){
    var dot=segment.querySelector('.pf-progress-dot-v80');
    if(dot) return dot;
    dot=document.createElement('span');
    dot.className='pf-progress-dot-v80';
    dot.setAttribute('aria-hidden','true');
    segment.appendChild(dot);
    return dot;
  }

  function canonicalResult(state,segments){
    var api=window.__exerciseProgressConsistencyV10;
    if(!api||typeof api.calculate!=='function') return null;
    try{
      var result=api.calculate(state);
      return result&&Array.isArray(result.segments)&&result.segments.length===segments.length?result:null;
    }catch(_){return null;}
  }

  function currentExerciseKind(state){
    if(!state||!Array.isArray(state.exercises)) return '';
    var ex=state.exercises[Math.max(0,Number(state.exerciseIndex)||0)];
    return ex?(ex.kind||'strength'):'';
  }

  function sync(){
    ensureFinalStyle();

    var modal=document.getElementById('session-modal');
    var track=document.getElementById('hype-progress-track');
    var state=getState();
    if(!modal||!track||!state){timer=setTimeout(sync,180);return;}

    var segments=Array.prototype.slice.call(track.querySelectorAll('.hype-progress-segment'));
    if(!segments.length){timer=setTimeout(sync,180);return;}

    var result=canonicalResult(state,segments);
    var targetIndex=-1;

    segments.forEach(function(seg,index){
      ensureDot(seg);

      var kind='';
      var done=seg.classList.contains('done');
      if(result&&result.segments[index]){
        var item=result.segments[index];
        kind=item.kind||'strength';
        done=!!item.done;
        if(targetIndex<0&&item.current&&!item.done) targetIndex=index;
      }else{
        kind=seg.classList.contains('cardio')?'cardio':'strength';
      }

      if(seg.getAttribute('data-pf-kind-v98')!==kind) seg.setAttribute('data-pf-kind-v98',kind);
      var doneText=done?'true':'false';
      if(seg.getAttribute('data-pf-done-v98')!==doneText) seg.setAttribute('data-pf-done-v98',doneText);
    });

    if(targetIndex<0&&result){
      var exIndex=Math.max(0,Number(state.exerciseIndex)||0);
      var setIndex=Math.max(0,(Number(state.currentSet)||1)-1);
      targetIndex=result.segments.findIndex(function(item){
        return !item.done&&item.type==='base'&&Number(item.exIndex)===exIndex&&Number(item.setIndex)===setIndex;
      });
      if(targetIndex<0) targetIndex=result.segments.findIndex(function(item){return !item.done;});
    }
    if(targetIndex<0){
      targetIndex=segments.findIndex(function(seg){return seg.classList.contains('current')&&seg.getAttribute('data-pf-done-v98')!=='true';});
      if(targetIndex<0) targetIndex=segments.findIndex(function(seg){return seg.getAttribute('data-pf-done-v98')!=='true';});
    }

    if(targetIndex>=0&&segments[targetIndex]){
      var engaged=modal.classList.contains('pulse-flow-active-v58')||modal.classList.contains('pulse-flow-starting-v58');
      var liveKind='';

      /* Before Starta set, the target segment itself is authoritative. That makes
         the faded marker preview the colour of the set that is actually next.
         Once starting/running, the runtime exercise remains authoritative. */
      if(engaged){
        liveKind=currentExerciseKind(state);
      }else if(result&&result.segments[targetIndex]){
        liveKind=result.segments[targetIndex].kind||'strength';
      }else{
        liveKind=segments[targetIndex].getAttribute('data-pf-kind-v98')||currentExerciseKind(state);
      }

      if(liveKind) segments[targetIndex].setAttribute('data-pf-kind-v98',liveKind);
    }

    segments.forEach(function(seg,index){
      var on=index===targetIndex&&seg.getAttribute('data-pf-done-v98')!=='true'&&!modal.classList.contains('pulse-flow-complete-v58');
      if(seg.classList.contains(LIVE)!==on) seg.classList.toggle(LIVE,on);
    });

    ensureFinalStyle();
    timer=setTimeout(sync,180);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
})();