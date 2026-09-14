(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseTimerFocusV146Installed) return;
  window.__exerciseTimerFocusV146Installed = true;

  var reduced = false;
  var closeBypass = false;
  var lastOverlayVisible = false;
  var lastFrame = 0;
  try { reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_) {}

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    return state.exercises[Math.max(0, Number(state.exerciseIndex) || 0)] || null;
  }

  function addStyle() {
    if (document.getElementById('exercise-timer-focus-v146-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-timer-focus-v146-style';
    style.textContent = `
      /* Full-screen cardio uses the compact Pulse Flow timer language, scaled up. */
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ring-v145 {
        width:min(360px,82vw)!important;height:min(360px,82vw)!important;margin:28px auto 10px!important;
        border-radius:50%!important;background:radial-gradient(circle,rgba(239,68,68,.028) 0 47%,transparent 69%)!important;
        box-shadow:none!important;transition:width .5s cubic-bezier(.16,1,.3,1),height .5s cubic-bezier(.16,1,.3,1)!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ring-v145::before,
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-segments-v145 {display:none!important}
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-arc-v146 {
        position:absolute!important;inset:0!important;width:100%!important;height:100%!important;overflow:visible!important;
        transform:rotate(-90deg)!important;filter:none!important
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-track-v146,
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-progress-v146 {
        fill:none!important;stroke-linecap:round!important;vector-effect:non-scaling-stroke!important
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-track-v146 {stroke:rgba(239,68,68,.085)!important;stroke-width:2.7!important}
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-progress-v146 {
        stroke:rgba(239,68,68,.78)!important;stroke-width:2.7!important;
        filter:drop-shadow(0 0 3px rgba(239,68,68,.30)) drop-shadow(0 0 10px rgba(239,68,68,.13))!important;
        transition:stroke-dasharray .12s linear!important
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-marker-v146 {
        fill:#FCA5A5!important;stroke:none!important;
        filter:drop-shadow(0 0 3px #EF4444) drop-shadow(0 0 10px rgba(239,68,68,.78))!important
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-copy-v145 {width:calc(100% - 84px)!important}
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-value-v145 {
        color:#FCA5A5!important;font-size:clamp(50px,13vw,66px)!important;line-height:.96!important;font-weight:600!important;
        letter-spacing:-1.8px!important;text-shadow:0 0 16px rgba(239,68,68,.17)!important
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-label-v145 {
        margin-top:6px!important;color:#718095!important;font-size:10px!important;font-weight:650!important;letter-spacing:1.15px!important
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-v146 {
        width:92px;height:22px;margin:7px auto 0;color:#EF4444;opacity:.88;filter:drop-shadow(0 0 5px rgba(239,68,68,.34))
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-v146 svg {display:block;width:100%;height:100%;overflow:visible}
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-v146 path {
        fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-plus-v145 {margin-top:7px!important}

      /* Rest keeps the same compact SVG arc and endpoint, only with larger geometry. */
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80),
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) {
        width:min(330px,80vw)!important;height:min(330px,80vw)!important;
        background:radial-gradient(circle,rgba(var(--pf-between-rgb),.025) 0 47%,transparent 69%)!important;box-shadow:none!important
      }
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80) .bs-segments,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) .bs-segments,
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80) .bs-core,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) .bs-core {display:none!important}
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80) > .pf-arc-svg-v80,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) > .pf-arc-svg-v80 {
        position:absolute!important;inset:0!important;width:100%!important;height:100%!important;overflow:visible!important
      }
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80) .bs-copy,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) .bs-copy {width:100%!important;inset:0!important}
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80) .bs-value,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) .bs-value {
        font-size:54px!important;font-weight:600!important;letter-spacing:-1.6px!important
      }

      .cardio-focus-morphing-v146 {will-change:transform,opacity,filter!important;transform-origin:center center!important}
      @media(max-width:600px){
        #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ring-v145{width:min(330px,82vw)!important;height:min(330px,82vw)!important}
        #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-copy-v145{width:calc(100% - 72px)!important}
      }
      @media(prefers-reduced-motion:reduce){#cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-progress-v146{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function ensureFocusSurface() {
    var overlay = document.getElementById('cardio-focus-v145');
    if (!overlay) return null;
    overlay.classList.add('cardio-focus-compact-v146');
    var ring = overlay.querySelector('.cardio-focus-ring-v145');
    if (!ring) return overlay;

    if (!ring.querySelector('.cardio-focus-arc-v146')) {
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns,'svg');
      svg.setAttribute('class','cardio-focus-arc-v146');svg.setAttribute('viewBox','0 0 200 200');svg.setAttribute('aria-hidden','true');
      var track = document.createElementNS(ns,'circle');
      track.setAttribute('class','cardio-focus-track-v146');track.setAttribute('cx','100');track.setAttribute('cy','100');track.setAttribute('r','92');track.setAttribute('pathLength','100');svg.appendChild(track);
      var progress = document.createElementNS(ns,'circle');
      progress.setAttribute('class','cardio-focus-progress-v146');progress.setAttribute('cx','100');progress.setAttribute('cy','100');progress.setAttribute('r','92');progress.setAttribute('pathLength','100');progress.setAttribute('stroke-dasharray','100 100');svg.appendChild(progress);
      var marker = document.createElementNS(ns,'circle');
      marker.setAttribute('class','cardio-focus-marker-v146');marker.setAttribute('cx','192');marker.setAttribute('cy','100');marker.setAttribute('r','3.1');svg.appendChild(marker);
      ring.insertBefore(svg,ring.firstChild);
    }

    var copy = ring.querySelector('.cardio-focus-copy-v145');
    if (copy && !copy.querySelector('.cardio-focus-ecg-v146')) {
      var ecg = document.createElement('div');
      ecg.className = 'cardio-focus-ecg-v146';ecg.setAttribute('aria-hidden','true');
      ecg.innerHTML = '<svg viewBox="0 0 92 22" preserveAspectRatio="none"><path d="M1 12H18L23 8L28 16L35 3L42 18L48 10L54 12H91"/></svg>';
      var label = copy.querySelector('.cardio-focus-label-v145');
      if (label && label.nextSibling) copy.insertBefore(ecg,label.nextSibling); else copy.appendChild(ecg);
    }
    bindCloseMorph(overlay);
    return overlay;
  }

  function updateArc() {
    var overlay = ensureFocusSurface();
    if (!overlay || !overlay.classList.contains('show')) return;
    var state = getState(), exercise = currentExercise(state);
    if (!state || !exercise || exercise.kind !== 'cardio' || !state.setStartedAt || !(Number(exercise.time) > 0)) return;
    var now = Date.now();
    var end = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : now;
    var elapsed = Math.max(0,(end - Number(state.setStartedAt)) / 1000);
    var total = Math.max(1,Number(exercise.time) * 60);
    var ratio = Math.max(0,Math.min(1,(total - elapsed) / total));
    var progress = overlay.querySelector('.cardio-focus-progress-v146');
    var marker = overlay.querySelector('.cardio-focus-marker-v146');
    if (progress) progress.setAttribute('stroke-dasharray',(ratio * 100).toFixed(3) + ' 100');
    if (marker) {
      var angle = ratio * Math.PI * 2;
      marker.setAttribute('cx',(100 + 92 * Math.cos(angle)).toFixed(3));
      marker.setAttribute('cy',(100 + 92 * Math.sin(angle)).toFixed(3));
    }
  }

  function sourceRect() {
    var source = document.getElementById('session-countdown-ring');
    if (!source) return null;
    var rect = source.getBoundingClientRect();
    return rect.width && rect.height ? rect : null;
  }

  function morphRing(entering, done) {
    var overlay = document.getElementById('cardio-focus-v145');
    var ring = overlay && overlay.querySelector('.cardio-focus-ring-v145');
    var source = sourceRect();
    if (!ring || !source || reduced || typeof ring.animate !== 'function') {if (done) done();return}
    var target = ring.getBoundingClientRect();
    if (!target.width || !target.height) {if (done) done();return}
    var dx = source.left + source.width/2 - target.left - target.width/2;
    var dy = source.top + source.height/2 - target.top - target.height/2;
    var sx = Math.max(.05,source.width / target.width), sy = Math.max(.05,source.height / target.height);
    var compact = {transform:'translate('+dx+'px,'+dy+'px) scale('+sx+','+sy+')',opacity:.42,filter:'blur(.25px)'};
    var large = {transform:'translate(0,0) scale(1,1)',opacity:1,filter:'blur(0)'};
    ring.classList.add('cardio-focus-morphing-v146');
    var animation = ring.animate(entering ? [compact,large] : [large,compact],{duration:entering ? 520 : 390,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
    var finish = function () {ring.classList.remove('cardio-focus-morphing-v146');try{animation.cancel()}catch(_){}if(done)done()};
    animation.addEventListener('finish',finish,{once:true});
  }

  function bindCloseMorph(overlay) {
    var button = overlay.querySelector('.cardio-focus-close-v145');
    if (!button || button.dataset.focusMorphV146 === 'true') return;
    button.dataset.focusMorphV146 = 'true';
    button.addEventListener('click',function (event) {
      if (closeBypass || reduced || !overlay.classList.contains('show')) return;
      event.preventDefault();event.stopImmediatePropagation();
      morphRing(false,function () {closeBypass=true;try{button.click()}finally{closeBypass=false}});
    },true);
  }

  function syncVisibility() {
    var overlay = ensureFocusSurface();
    var visible = !!(overlay && overlay.classList.contains('show'));
    if (visible && !lastOverlayVisible) requestAnimationFrame(function(){requestAnimationFrame(function(){morphRing(true)})});
    lastOverlayVisible = visible;
  }

  function frame(now) {
    if (!lastFrame || now-lastFrame>80) {lastFrame=now;syncVisibility();updateArc()}
    requestAnimationFrame(frame);
  }

  function install() {addStyle();ensureFocusSurface();requestAnimationFrame(frame)}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();