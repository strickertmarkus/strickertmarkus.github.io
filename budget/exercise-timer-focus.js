(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseTimerFocusInstalled) return;
  window.__exerciseTimerFocusInstalled = true;

  var audioContext = null;
  var audioBus = null;
  var audioSessionRestoreTimer = null;
  var lastCardioToken = '';
  var collapsedCardioToken = '';
  var lastRestKey = '';
  var lastFrameAt = 0;
  var gesture = null;
  var suppressTimerClickUntil = 0;
  var dragAnimationFrame = 0;
  var beeped = Object.create(null);

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    return state.exercises[Math.max(0, Number(state.exerciseIndex) || 0)] || null;
  }

  function isTimedCardio(state, exercise) {
    return !!(state && exercise && state.setRunning && state.setStartedAt && exercise.kind === 'cardio' && Number(exercise.time) > 0);
  }

  function cardioToken(state, exercise) {
    return [
      state && state.passStartedAt || '',
      state && Number(state.exerciseIndex) || 0,
      state && Math.max(1, Number(state.currentSet) || 1),
      exercise && exercise.name || '',
      state && state.setStartedAt || ''
    ].join('|');
  }

  function formatClock(seconds) {
    var whole = Math.max(0, Math.floor(Number(seconds) || 0));
    return String(Math.floor(whole / 60)).padStart(2,'0') + ':' + String(whole % 60).padStart(2,'0');
  }

  function ensureStyle() {
    if (document.getElementById('exercise-timer-focus-style')) return;

    /* Remove stale styles if an old cached bundle happened to execute first. */
    [145,146,147,148,149,150,151].forEach(function (version) {
      var old = document.getElementById('exercise-timer-focus-v' + version + '-style');
      if (old) old.remove();
    });

    var style = document.createElement('style');
    style.id = 'exercise-timer-focus-style';
    style.textContent = `
      /* ---- Rest: same Pulse Flow timer, only larger ---- */
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring {
        width:min(330px,80vw)!important;
        height:min(330px,80vw)!important;
      }
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80),
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) {
        background:radial-gradient(circle,rgba(var(--pf-between-rgb),.025) 0 47%,transparent 69%)!important;
        box-shadow:none!important;
      }
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80) .bs-segments,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) .bs-segments,
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80) .bs-core,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) .bs-core {
        display:none!important;
      }
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80) > .pf-arc-svg-v80,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) > .pf-arc-svg-v80 {
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        overflow:visible!important;
      }
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80) .bs-copy,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80) .bs-copy {
        width:100%!important;
        inset:0!important;
      }
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-value,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-value {
        font-size:clamp(54px,15vw,78px)!important;
        line-height:.96!important;
        font-weight:600!important;
        letter-spacing:-2px!important;
        font-variant-numeric:tabular-nums!important;
      }
      #session-between-overlay-v2.show[data-between-type="rest"] .pf-arc-progress-v80,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .pf-arc-progress-v80 {
        filter:drop-shadow(0 0 3.8px rgba(var(--pf-between-rgb),.82)) drop-shadow(0 0 11px rgba(var(--pf-between-rgb),.40))!important;
        -webkit-filter:drop-shadow(0 0 3.8px rgba(var(--pf-between-rgb),.82)) drop-shadow(0 0 11px rgba(var(--pf-between-rgb),.40))!important;
      }
      #session-between-overlay-v2.show[data-between-type="rest"] .bs-ring:has(> .pf-arc-svg-v80)::after,
      #session-between-overlay-v2.show[data-transition-stability-rest-v142="true"] .bs-ring:has(> .pf-arc-svg-v80)::after {
        content:''!important;
        position:absolute!important;
        inset:14%!important;
        border-radius:50%!important;
        pointer-events:none!important;
        background:radial-gradient(circle,rgba(var(--pf-between-rgb),.095),rgba(var(--pf-between-rgb),.04) 43%,transparent 72%)!important;
        filter:blur(11px)!important;
        opacity:.84!important;
      }

      /* ---- Inline cardio timer ---- */
      #session-countdown-ring {
        touch-action:manipulation;
        -webkit-tap-highlight-color:transparent;
      }
      .cardio-desktop-toggle {
        appearance:none;position:absolute;top:-7px;right:-7px;z-index:30;width:30px;height:30px;display:grid;place-items:center;padding:0;
        border:1px solid rgba(248,113,113,.28);border-radius:10px;background:rgba(13,9,13,.84);color:#FCA5A5;
        box-shadow:0 5px 18px rgba(0,0,0,.24),inset 0 1px rgba(255,255,255,.035);cursor:pointer;-webkit-tap-highlight-color:transparent;
      }
      .cardio-desktop-toggle:hover {border-color:rgba(248,113,113,.52);background:rgba(49,17,24,.92);box-shadow:0 0 18px rgba(239,68,68,.14),inset 0 1px rgba(255,255,255,.045);}
      .cardio-desktop-toggle:active {transform:scale(.94);}
      .cardio-desktop-toggle svg {width:16px;height:16px;display:block;}
      html.cardio-focus-active #session-countdown-ring .cardio-desktop-toggle {top:7px;right:7px;}
      @media (hover:none),(pointer:coarse) {
        #session-countdown-ring {touch-action:none;}
        .cardio-desktop-toggle {display:none!important;}
      }
      @media (hover:hover) and (pointer:fine) {.cardio-focus-close {display:none!important;}}

      /* Mobile drag preview: the real live timer is resized/repositioned frame-by-frame. */
      html.cardio-focus-dragging { --cf-progress:0; }
      html.cardio-focus-dragging #cardio-focus {
        display:block!important;
        opacity:var(--cf-progress)!important;
      }
      html.cardio-focus-dragging .cardio-focus-title,
      html.cardio-focus-dragging .cardio-focus-close {
        opacity:var(--cf-progress)!important;
      }
      html.cardio-focus-dragging .cardio-focus-title {
        transform:translateX(-50%) translateY(var(--cf-title-shift,18px))!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) {
        z-index:2147483500!important;
        pointer-events:none!important;
        isolation:isolate!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode)::after {
        content:''!important;
        display:block!important;
        position:fixed!important;
        inset:0!important;
        z-index:2147483501!important;
        pointer-events:none!important;
        opacity:var(--cf-progress)!important;
        background:
          radial-gradient(circle at 50% 45%,rgba(239,68,68,.20),transparent 35%),
          radial-gradient(circle at 50% 112%,rgba(127,29,29,.17),transparent 43%),
          linear-gradient(180deg,#16090C 0%,#10070A 48%,#09070A 100%)!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-top,
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-grid > .session-card:not(.session-main),
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-main > *:not(#session-cardio-countdown) {
        opacity:var(--cf-content-opacity)!important;
        pointer-events:none!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown.show {
        opacity:1!important;
        visibility:visible!important;
        position:fixed!important;
        inset:0!important;
        z-index:2147483550!important;
        width:100vw!important;
        height:100dvh!important;
        min-height:100svh!important;
        margin:0!important;
        padding:0!important;
        display:block!important;
        overflow:visible!important;
        pointer-events:none!important;
        background:transparent!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring {
        opacity:1!important;
        visibility:visible!important;
        display:grid!important;
        position:fixed!important;
        left:var(--cf-left)!important;
        top:var(--cf-top)!important;
        right:auto!important;
        bottom:auto!important;
        width:var(--cf-size)!important;
        height:var(--cf-size)!important;
        min-width:0!important;
        min-height:0!important;
        flex:0 0 var(--cf-size)!important;
        flex-basis:var(--cf-size)!important;
        aspect-ratio:1!important;
        margin:0!important;
        transform:none!important;
        z-index:2147483551!important;
        overflow:visible!important;
        pointer-events:auto!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-segments,
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring > .pf-canvas-arc-v130,
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring > .pf-arc-svg-v80 {
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        max-width:none!important;
        max-height:none!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-core {
        inset:var(--cf-core-inset)!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-copy {
        width:var(--cf-copy-width)!important;
        display:grid!important;
        place-content:center!important;
        justify-items:center!important;
        gap:var(--cf-copy-gap)!important;
        min-width:0!important;
        margin:0 auto!important;
        text-align:center!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
        font-size:var(--cf-font-size)!important;
        line-height:1!important;
        letter-spacing:var(--cf-letter-spacing)!important;
        transform:translateX(var(--cf-time-x))!important;
        white-space:nowrap!important;
        width:100%!important;
        min-width:0!important;
        text-align:center!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-label {
        margin:0!important;
        font-size:var(--cf-label-size)!important;
        line-height:1!important;
        letter-spacing:var(--cf-label-letter)!important;
        white-space:nowrap!important;
        width:100%!important;
        text-align:center!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-pause-hint {
        margin:0 auto!important;
        width:var(--cf-hint-width)!important;
        max-width:var(--cf-hint-width)!important;
        min-width:0!important;
        font-size:var(--cf-hint-size)!important;
        line-height:1.05!important;
        letter-spacing:var(--cf-hint-letter)!important;
        white-space:normal!important;
        text-align:center!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .pf-ecg-v80 {
        width:var(--cf-ecg-width)!important;
        height:var(--cf-ecg-height)!important;
        margin-top:0!important;
      }

      /* Optical centering of the compact numeric value only; ring geometry is untouched. */
      html:not(.cardio-focus-active):not(.cardio-focus-dragging) body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
        transform:translateX(1px)!important;
      }

      .cardio-inline-plus {
        display:none;
        margin-top:5px;
        color:#FCA5A5;
        font-size:10px;
        font-weight:850;
        font-variant-numeric:tabular-nums;
        text-align:center;
      }
      .cardio-inline-plus.show { display:block; }
      .cardio-inline-plus .plus-word {
        margin-left:4px;
        color:#A78B91;
        font-size:8px;
        font-weight:800;
        letter-spacing:.7px;
        text-transform:uppercase;
      }

      /* ---- Focus chrome; the timer itself remains the live compact timer ---- */
      #cardio-focus {
        position:fixed;
        inset:0;
        z-index:2147483600;
        display:none;
        width:100vw;
        height:100dvh;
        min-height:100svh;
        pointer-events:none;
      }
      #cardio-focus.show { display:block; }
      .cardio-focus-close {
        appearance:none;
        position:fixed;
        top:max(14px,env(safe-area-inset-top));
        right:max(14px,env(safe-area-inset-right));
        z-index:4;
        min-height:36px;
        padding:9px 13px;
        border:1px solid rgba(248,113,113,.30);
        border-radius:999px;
        background:rgba(20,11,14,.72);
        color:#FCA5A5;
        font:800 11px/1 'Inter',system-ui,sans-serif;
        letter-spacing:.15px;
        cursor:pointer;
        pointer-events:auto;
        -webkit-tap-highlight-color:transparent;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 8px 24px rgba(0,0,0,.20);
      }
      .cardio-focus-close:active { transform:scale(.97); }
      .cardio-focus-title {
        position:fixed;
        left:50%;
        top:calc(59dvh - min(162px,41vw) - 94px);
        z-index:3;
        width:min(430px,86vw);
        transform:translateX(-50%);
        display:grid;
        justify-items:center;
        gap:12px;
        text-align:center;
        pointer-events:none;
      }
      .cardio-focus-kicker {
        color:#F87171;
        font:900 10px/1 'Inter',system-ui,sans-serif;
        letter-spacing:1.55px;
        text-transform:uppercase;
      }
      .cardio-focus-name {
        max-width:100%;
        color:#FEE2E2;
        font:850 clamp(20px,5vw,28px)/1.14 'Inter',system-ui,sans-serif;
        letter-spacing:-.45px;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }

      /* Focus background is the existing session modal. No ancestor is hidden:
         Safari can otherwise suppress the composited timer canvas. */
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) {
        z-index:2147483500!important;
        pointer-events:none!important;
        isolation:isolate!important;
        background:
          radial-gradient(circle at 50% 45%,rgba(239,68,68,.20),transparent 35%),
          radial-gradient(circle at 50% 112%,rgba(127,29,29,.17),transparent 43%),
          linear-gradient(180deg,#16090C 0%,#10070A 48%,#09070A 100%)!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode)::before,
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode)::after {
        content:none!important;
        display:none!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-shell {
        visibility:visible!important;
        background:transparent!important;
        transform:none!important;
        filter:none!important;
        overflow:visible!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-top,
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-grid > .session-card:not(.session-main),
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-main > *:not(#session-cardio-countdown) {
        opacity:0!important;
        pointer-events:none!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-grid,
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-main {
        overflow:visible!important;
        background:transparent!important;
        border-color:transparent!important;
        box-shadow:none!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown.show {
        opacity:1!important;
        visibility:visible!important;
        position:fixed!important;
        inset:0!important;
        z-index:2147483550!important;
        width:100vw!important;
        height:100dvh!important;
        min-height:100svh!important;
        margin:0!important;
        padding:0!important;
        display:block!important;
        overflow:visible!important;
        pointer-events:none!important;
        background:transparent!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown.show * {
        visibility:visible!important;
      }

      /* Native-size enlargement: no scale() and no duplicate timer. */
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring {
        opacity:1!important;
        visibility:visible!important;
        display:grid!important;
        position:fixed!important;
        left:50%!important;
        top:59dvh!important;
        right:auto!important;
        bottom:auto!important;
        width:min(324px,82vw)!important;
        height:min(324px,82vw)!important;
        min-width:0!important;
        min-height:0!important;
        flex:0 0 min(324px,82vw)!important;
        flex-basis:min(324px,82vw)!important;
        aspect-ratio:1!important;
        margin:0!important;
        transform:translate(-50%,-50%)!important;
        transform-origin:50% 50%!important;
        z-index:2147483551!important;
        overflow:visible!important;
        pointer-events:auto!important;
        will-change:auto!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-core {
        inset:44px!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-copy {
        opacity:1!important;
        width:calc(100% - 128px)!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
        opacity:1!important;
        font-size:66px!important;
        line-height:1!important;
        letter-spacing:-2.4px!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-label {
        margin-top:12px!important;
        font-size:12px!important;
        letter-spacing:1.15px!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .pf-ecg-v80 {
        opacity:1!important;
        width:104px!important;
        height:29px!important;
        margin-top:9px!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .cardio-inline-plus {
        margin-top:10px!important;
        font-size:14px!important;
      }
      html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .cardio-inline-plus .plus-word {
        margin-left:6px!important;
        font-size:10px!important;
        letter-spacing:1px!important;
      }

      @media(max-width:390px) {
        .cardio-focus-title { top:calc(59dvh - min(150px,40vw) - 88px);gap:10px; }
        html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring {
          width:min(300px,80vw)!important;
          height:min(300px,80vw)!important;
          flex-basis:min(300px,80vw)!important;
          top:59dvh!important;
        }
        html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-core {
          inset:41px!important;
        }
        html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
          font-size:61px!important;
        }
      }
      @media(max-height:700px) {
        .cardio-focus-title { top:calc(58dvh - min(150px,40vw) - 82px); }
        html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring { top:58dvh!important; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureFocusChrome() {
    var legacy = document.getElementById('cardio-focus-v145');
    if (legacy) legacy.remove();

    var overlay = document.getElementById('cardio-focus');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'cardio-focus';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML =
      '<button type="button" class="cardio-focus-close" aria-label="Visa hela träningspasset">Visa passet</button>' +
      '<div class="cardio-focus-title">' +
        '<div class="cardio-focus-kicker">Kondition</div>' +
        '<div class="cardio-focus-name" id="cardio-focus-name"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('.cardio-focus-close').addEventListener('click',function (event) {
      event.preventDefault();
      event.stopPropagation();
      collapseFocus();
    });
    return overlay;
  }

  function ensureInlinePlus() {
    var copy = document.querySelector('#session-countdown-ring .session-countdown-copy');
    if (!copy) return null;

    /* Remove the old explicit focus button and legacy plus element. */
    document.querySelectorAll('.cardio-focus-expand-v145').forEach(function (button) { button.remove(); });
    var legacy = document.getElementById('cardio-inline-plus-v145');
    if (legacy) legacy.remove();

    var plus = document.getElementById('cardio-inline-plus');
    if (!plus) {
      plus = document.createElement('div');
      plus.id = 'cardio-inline-plus';
      plus.className = 'cardio-inline-plus';
      plus.innerHTML = '<span class="plus-time">+ 00:00</span><span class="plus-word">plustid</span>';
      copy.appendChild(plus);
    }
    return plus;
  }

  function isTouchLike() {
    try { return !!((window.matchMedia && window.matchMedia('(pointer:coarse)').matches) || Number(navigator.maxTouchPoints) > 0); }
    catch (_) { return Number(navigator.maxTouchPoints) > 0; }
  }

  function desktopIcon(expanded) {
    if (expanded) return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v6H3"></path><path d="M15 3v6h6"></path><path d="M9 21v-6H3"></path><path d="M15 21v-6h6"></path><path d="M9 9 4 4M15 9l5-5M9 15l-5 5M15 15l5 5"></path></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9H3V3"></path><path d="M15 9h6V3"></path><path d="M9 15H3v6"></path><path d="M15 15h6v6"></path><path d="M9 9 3 3M15 9l6-6M9 15l-6 6M15 15l6 6"></path></svg>';
  }

  function ensureDesktopToggle() {
    var ring=document.getElementById('session-countdown-ring');
    if(!ring) return null;
    var button=ring.querySelector('.cardio-desktop-toggle');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='cardio-desktop-toggle';
      button.addEventListener('pointerdown',function(event){event.stopPropagation();});
      button.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();toggleFocus();});
      ring.appendChild(button);
    }
    var expanded=document.documentElement.classList.contains('cardio-focus-active');
    var state=expanded?'collapse':'expand';
    if(button.dataset.state!==state){
      button.dataset.state=state;
      button.innerHTML=desktopIcon(expanded);
      button.setAttribute('aria-label',expanded?'Minska timer':'Förstora timer');
      button.title=expanded?'Minska timer':'Förstora timer';
    }
    return button;
  }

  function clamp01(value) {
    return Math.max(0,Math.min(1,Number(value) || 0));
  }

  function mix(a,b,t) {
    return Number(a) + (Number(b) - Number(a)) * t;
  }

  function focusTargetRect() {
    var vw = Math.max(1,window.innerWidth || document.documentElement.clientWidth || 1);
    var vh = Math.max(1,window.innerHeight || document.documentElement.clientHeight || 1);
    var compact = vw <= 390;
    var short = vh <= 700;
    var size = compact ? Math.min(300,vw * 0.80) : Math.min(324,vw * 0.82);
    var centerY = vh * (short ? 0.58 : 0.59);
    return {left:(vw - size) / 2,top:centerY - size / 2,width:size,height:size};
  }

  function measureSmallRing(ring) {
    var root = document.documentElement;
    var overlay = ensureFocusChrome();
    var wasExpanded = root.classList.contains('cardio-focus-active');
    var overlayWasShown = !!(overlay && overlay.classList.contains('show'));
    if (wasExpanded) {
      root.classList.remove('cardio-focus-active');
      if (overlay) overlay.classList.remove('show');
    }
    var rect = ring.getBoundingClientRect();
    var measured = {left:rect.left,top:rect.top,width:rect.width,height:rect.height};
    if (wasExpanded) {
      root.classList.add('cardio-focus-active');
      if (overlay && overlayWasShown) overlay.classList.add('show');
    }
    return measured;
  }

  function setDragVar(name,value) {
    document.documentElement.style.setProperty(name,value);
  }

  function clearDragVars() {
    [
      '--cf-progress','--cf-content-opacity','--cf-left','--cf-top','--cf-size',
      '--cf-core-inset','--cf-font-size','--cf-letter-spacing','--cf-copy-width','--cf-copy-gap',
      '--cf-ecg-width','--cf-ecg-height','--cf-time-x','--cf-title-shift',
      '--cf-label-size','--cf-label-letter','--cf-hint-size','--cf-hint-letter','--cf-hint-width'
    ].forEach(function (name) { document.documentElement.style.removeProperty(name); });
  }

  function applyDragProgress(progress) {
    if (!gesture || !gesture.engaged) return;
    progress = clamp01(progress);
    gesture.progress = progress;
    var small = gesture.smallRect;
    var large = gesture.largeRect;
    var size = mix(small.width,large.width,progress);
    setDragVar('--cf-progress',String(progress));
    setDragVar('--cf-content-opacity',String(1 - progress));
    setDragVar('--cf-left',mix(small.left,large.left,progress).toFixed(2) + 'px');
    setDragVar('--cf-top',mix(small.top,large.top,progress).toFixed(2) + 'px');
    setDragVar('--cf-size',size.toFixed(2) + 'px');
    setDragVar('--cf-core-inset',mix(18,gesture.largeCoreInset,progress).toFixed(2) + 'px');
    setDragVar('--cf-font-size',mix(27,gesture.largeFontSize,progress).toFixed(2) + 'px');
    setDragVar('--cf-letter-spacing',mix(-0.6,-2.4,progress).toFixed(2) + 'px');
    setDragVar('--cf-copy-width','calc(100% - ' + mix(52,128,progress).toFixed(2) + 'px)');
    setDragVar('--cf-copy-gap',mix(3,8,progress).toFixed(2) + 'px');
    setDragVar('--cf-ecg-width',mix(gesture.smallEcgWidth,104,progress).toFixed(2) + 'px');
    setDragVar('--cf-ecg-height',mix(gesture.smallEcgHeight,29,progress).toFixed(2) + 'px');
    setDragVar('--cf-time-x',mix(1,0,progress).toFixed(2) + 'px');
    setDragVar('--cf-title-shift',mix(18,0,progress).toFixed(2) + 'px');
    setDragVar('--cf-label-size',mix(8.5,12,progress).toFixed(2) + 'px');
    setDragVar('--cf-label-letter',mix(0.8,1.15,progress).toFixed(2) + 'px');
    setDragVar('--cf-hint-size',mix(6.5,10,progress).toFixed(2) + 'px');
    setDragVar('--cf-hint-letter',mix(0.65,1.0,progress).toFixed(2) + 'px');
    setDragVar('--cf-hint-width',mix(64,126,progress).toFixed(2) + 'px');
  }

  function beginInteractiveDrag(ring,startExpanded) {
    if (!gesture || gesture.engaged) return;
    var smallRect = measureSmallRing(ring);
    var largeRect = focusTargetRect();
    var ecg = ring.querySelector('.pf-ecg-v80');
    var ecgRect = ecg ? ecg.getBoundingClientRect() : null;
    gesture.engaged = true;
    gesture.startExpanded = !!startExpanded;
    gesture.smallRect = smallRect;
    gesture.largeRect = largeRect;
    gesture.progress = startExpanded ? 1 : 0;
    gesture.largeCoreInset = window.innerWidth <= 390 ? 41 : 44;
    gesture.largeFontSize = window.innerWidth <= 390 ? 61 : 66;
    gesture.smallEcgWidth = ecgRect && ecgRect.width ? ecgRect.width : 58;
    gesture.smallEcgHeight = ecgRect && ecgRect.height ? ecgRect.height : 18;
    gesture.startedAt = performance.now();
    var root = document.documentElement;
    root.classList.add('cardio-focus-dragging');
    root.classList.remove('cardio-focus-active');
    var overlay = ensureFocusChrome();
    if (overlay) overlay.classList.add('show');
    applyDragProgress(gesture.progress);
  }

  function finishInteractiveDrag(targetExpanded) {
    if (!gesture || !gesture.engaged) return;
    if (dragAnimationFrame) cancelAnimationFrame(dragAnimationFrame);
    var from = gesture.progress;
    var to = targetExpanded ? 1 : 0;
    var distance = Math.abs(to - from);
    var duration = Math.max(120,Math.min(240,120 + distance * 120));
    var started = performance.now();
    function step(now) {
      if (!gesture || !gesture.engaged) return;
      var t = Math.min(1,(now - started) / duration);
      var eased = 1 - Math.pow(1 - t,3);
      applyDragProgress(from + (to - from) * eased);
      if (t < 1) {
        dragAnimationFrame = requestAnimationFrame(step);
        return;
      }
      dragAnimationFrame = 0;
      document.documentElement.classList.remove('cardio-focus-dragging');
      clearDragVars();
      if (targetExpanded) {
        collapsedCardioToken = '';
        setFocus(true);
      } else {
        if (lastCardioToken) collapsedCardioToken = lastCardioToken;
        setFocus(false);
      }
      try { window.dispatchEvent(new Event('resize')); } catch (_) {}
      gesture = null;
    }
    dragAnimationFrame = requestAnimationFrame(step);
  }

  function setFocus(visible) {
    var overlay = ensureFocusChrome();
    document.documentElement.classList.toggle('cardio-focus-active',!!visible);
    if (overlay) {
      overlay.classList.toggle('show',!!visible);
      overlay.setAttribute('aria-hidden',visible ? 'false' : 'true');
    }
  }

  function collapseFocus() {
    if (lastCardioToken) collapsedCardioToken = lastCardioToken;
    setFocus(false);
  }

  function expandFocus() {
    var state = getState();
    var exercise = currentExercise(state);
    if (!isTimedCardio(state,exercise)) return;
    collapsedCardioToken = '';
    setFocus(true);
  }

  function toggleFocus() {
    var state = getState();
    var exercise = currentExercise(state);
    if (!isTimedCardio(state,exercise)) return;
    if (document.documentElement.classList.contains('cardio-focus-active')) collapseFocus();
    else expandFocus();
  }

  function getAudioContext() {
    if (audioContext) return audioContext;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      audioContext = new Ctx({latencyHint:'interactive'});
      var compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.002;
      compressor.release.value = 0.12;
      compressor.connect(audioContext.destination);
      audioBus = compressor;
    } catch (_) {
      audioContext = null;
      audioBus = null;
    }
    return audioContext;
  }

  function unlockAudio() {
    var ctx = getAudioContext();
    if (!ctx) return;
    try {
      var resumed = ctx.state === 'suspended' ? ctx.resume() : null;
      if (resumed && typeof resumed.catch === 'function') resumed.catch(function () {});
    } catch (_) {}
  }

  function prepareAudibleBeep() {
    try {
      if (navigator.audioSession && 'type' in navigator.audioSession) {
        navigator.audioSession.type = 'playback';
        if (audioSessionRestoreTimer) clearTimeout(audioSessionRestoreTimer);
        audioSessionRestoreTimer = setTimeout(function () {
          try { navigator.audioSession.type = 'ambient'; } catch (_) {}
          audioSessionRestoreTimer = null;
        },320);
      }
    } catch (_) {}
  }

  function beep(finalBeat) {
    var ctx = getAudioContext();
    if (!ctx) return;
    prepareAudibleBeep();
    try { if (ctx.state === 'suspended') ctx.resume(); } catch (_) {}
    if (ctx.state !== 'running') return;
    try {
      var now = ctx.currentTime;
      var duration = finalBeat ? 0.17 : 0.095;
      var master = ctx.createGain();
      master.gain.setValueAtTime(0.0001,now);
      master.gain.exponentialRampToValueAtTime(finalBeat ? 0.22 : 0.16,now + 0.007);
      master.gain.exponentialRampToValueAtTime(0.0001,now + duration);
      master.connect(audioBus || ctx.destination);
      [finalBeat ? 1080 : 820, finalBeat ? 1620 : 1230].forEach(function (frequency,index) {
        var oscillator = ctx.createOscillator();
        var voice = ctx.createGain();
        oscillator.type = index ? 'sine' : 'square';
        oscillator.frequency.setValueAtTime(frequency,now);
        voice.gain.value = index ? 0.42 : 0.78;
        oscillator.connect(voice);
        voice.connect(master);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.015);
      });
    } catch (_) {}
  }

  function beepOnce(key,second) {
    if (second < 1 || second > 5) return;
    var ledgerKey = key + '|' + second;
    if (beeped[ledgerKey]) return;
    beeped[ledgerKey] = true;
    unlockAudio();
    beep(second === 1);
  }

  function elapsedForState(state,now) {
    if (!state || !state.setStartedAt) return 0;
    var end = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : now;
    return Math.max(0,(end - Number(state.setStartedAt)) / 1000);
  }

  function syncCardio(now) {
    var state = getState();
    var exercise = currentExercise(state);
    var timed = isTimedCardio(state,exercise);
    var overlay = ensureFocusChrome();
    var plus = ensureInlinePlus();
    var desktopToggle = ensureDesktopToggle();

    if (!timed) {
      lastCardioToken = '';
      collapsedCardioToken = '';
      if (plus) plus.classList.remove('show');
      if (desktopToggle) desktopToggle.hidden = true;
      setFocus(false);
      return;
    }

    if (desktopToggle) { desktopToggle.hidden = false; ensureDesktopToggle(); }

    var token = cardioToken(state,exercise);
    if (token !== lastCardioToken) {
      lastCardioToken = token;
      collapsedCardioToken = '';
    }

    var total = Math.max(1,Number(exercise.time) * 60);
    var elapsed = elapsedForState(state,now);
    var remainingRaw = total - elapsed;
    var overtime = Math.max(0,elapsed - total);
    var second = Math.ceil(remainingRaw);
    if (second >= 1 && second <= 5) beepOnce('cardio|' + token,second);

    var name = document.getElementById('cardio-focus-name');
    if (name) name.textContent = exercise.name || 'Kondition';

    if (plus) {
      plus.classList.toggle('show',overtime >= 0.05);
      var plusTime = plus.querySelector('.plus-time');
      if (plusTime) plusTime.textContent = '+ ' + formatClock(overtime);
    }

    var modal = document.getElementById('session-modal');
    var pre = document.getElementById('session-pre-timer');
    var blockedByOverview = !!(modal && modal.classList.contains('session-overview-mode'));
    var blockedByPretimer = !!(pre && pre.classList.contains('show'));
    var shouldShow = collapsedCardioToken !== token && !blockedByOverview && !blockedByPretimer;
    if (!document.documentElement.classList.contains('cardio-focus-dragging')) setFocus(shouldShow);
  }

  function restSecondsFromDom() {
    var overlay = document.getElementById('session-between-overlay-v2');
    if (!overlay || !overlay.classList.contains('show')) return null;
    var isRest = overlay.dataset.betweenType === 'rest' || overlay.dataset.transitionStabilityRestV142 === 'true';
    if (!isRest) return null;
    var value = document.getElementById('bs-overlay-value');
    var text = value ? String(value.textContent || '').trim() : '';
    var match = text.match(/^(\d{1,3}):(\d{2})$/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function syncRestSound() {
    var overlay = document.getElementById('session-between-overlay-v2');
    var seconds = restSecondsFromDom();
    if (seconds == null) {
      lastRestKey = '';
      return;
    }
    var state = getState();
    var key = [
      'rest',
      state && state.passStartedAt || '',
      state && Number(state.exerciseIndex) || 0,
      state && Math.max(1,Number(state.currentSet) || 1),
      overlay && overlay.dataset.betweenType || 'rest'
    ].join('|');
    lastRestKey = key;
    if (seconds >= 1 && seconds <= 5) beepOnce(key,seconds);
  }

  function installTimerGestures() {
    document.addEventListener('pointerdown',function (event) {
      if (!isTouchLike() || event.isPrimary === false || dragAnimationFrame) return;
      var ring = event.target && event.target.closest ? event.target.closest('#session-countdown-ring') : null;
      if (!ring || (event.target && event.target.closest && event.target.closest('.cardio-desktop-toggle'))) return;
      gesture = {
        pointerId:event.pointerId,
        ring:ring,
        startX:event.clientX,
        startY:event.clientY,
        lastX:event.clientX,
        lastY:event.clientY,
        lastAt:performance.now(),
        startExpanded:document.documentElement.classList.contains('cardio-focus-active'),
        engaged:false,
        progress:document.documentElement.classList.contains('cardio-focus-active') ? 1 : 0
      };
    },true);

    document.addEventListener('pointermove',function (event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      var dx = event.clientX - gesture.startX;
      var dy = event.clientY - gesture.startY;
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      gesture.lastAt = performance.now();
      var verticalIntent = Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.12;
      var intendedDirection = gesture.startExpanded ? dy > 0 : dy < 0;
      if (!gesture.engaged && verticalIntent && intendedDirection) beginInteractiveDrag(gesture.ring,gesture.startExpanded);
      if (!gesture || !gesture.engaged) return;
      if (event.cancelable) event.preventDefault();
      var travel = Math.max(150,Math.min(220,window.innerHeight * 0.24));
      var progress = gesture.startExpanded ? 1 - Math.max(0,dy) / travel : Math.max(0,-dy) / travel;
      applyDragProgress(progress);
    },{capture:true,passive:false});

    document.addEventListener('pointerup',function (event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      if (!gesture.engaged) {
        gesture = null;
        return;
      }
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
      suppressTimerClickUntil = Date.now() + 650;
      var targetExpanded = gesture.progress >= 0.5;
      finishInteractiveDrag(targetExpanded);
    },true);

    document.addEventListener('pointercancel',function (event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      if (gesture.engaged) finishInteractiveDrag(gesture.startExpanded);
      else gesture = null;
    },true);

    document.addEventListener('click',function (event) {
      if (Date.now() > suppressTimerClickUntil) return;
      var ring = event.target && event.target.closest ? event.target.closest('#session-countdown-ring') : null;
      if (!ring) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressTimerClickUntil = 0;
    },true);
  }

  function frame(now) {
    if (!lastFrameAt || now - lastFrameAt >= 80) {
      lastFrameAt = now;
      syncCardio(Date.now());
      syncRestSound();
    }
    requestAnimationFrame(frame);
  }

  function installAudioUnlock() {
    ['pointerdown','touchstart','keydown'].forEach(function (type) {
      document.addEventListener(type,unlockAudio,{capture:true,passive:true});
    });
  }

  function install() {
    ensureStyle();
    ensureFocusChrome();
    ensureInlinePlus();
    installAudioUnlock();
    installTimerGestures();
    requestAnimationFrame(frame);
    window.__exerciseTimerFocus = {
      expand:expandFocus,
      collapse:collapseFocus,
      toggle:toggleFocus,
      unlockAudio:unlockAudio,
      beep:function () { unlockAudio();beep(false); }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
