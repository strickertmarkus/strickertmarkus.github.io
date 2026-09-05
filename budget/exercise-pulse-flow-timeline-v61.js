(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase() !== 'pulse-home') return;
  if (window.__exercisePulseFlowTimersV62Installed) return;
  window.__exercisePulseFlowTimersV62Installed = true;

  var lastTick = { cardio:'', rest:'', pre:'' };

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function addStyles() {
    if (document.getElementById('exercise-pulse-flow-timers-v62-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-pulse-flow-timers-v62-style';
    style.textContent = `
      /* ---------- PASS FLOW: one dot per set, one subtle band per exercise ---------- */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-workout-progress {
        margin:6px 0 2px !important;
        padding:9px 0 5px !important;
        border-top:1px solid rgba(148,163,184,.09) !important;
        border-bottom:1px solid rgba(148,163,184,.08) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-head {
        margin-bottom:4px !important;
        align-items:center !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-title {
        color:#718095 !important;
        font-size:8px !important;
        font-weight:700 !important;
        letter-spacing:1.15px !important;
        text-transform:uppercase !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-title::before,
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-title::after {
        content:none !important;
        display:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-percent {
        color:var(--pf-soft) !important;
        font-size:17px !important;
        font-weight:700 !important;
        letter-spacing:-.35px !important;
        text-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-track {
        position:relative !important;
        display:flex !important;
        align-items:center !important;
        width:100% !important;
        height:36px !important;
        gap:0 !important;
        padding:0 5px !important;
        overflow:visible !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-track::before {
        content:'' !important;
        position:absolute !important;
        left:9px !important;
        right:9px !important;
        top:50% !important;
        height:1px !important;
        transform:translateY(-.5px) !important;
        background:linear-gradient(90deg,rgba(148,163,184,.06),rgba(148,163,184,.18),rgba(148,163,184,.06)) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment {
        position:relative !important;
        z-index:1 !important;
        display:grid !important;
        place-items:center !important;
        flex:1 1 0 !important;
        width:auto !important;
        min-width:7px !important;
        height:36px !important;
        padding:0 !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
        opacity:1 !important;
        transform:none !important;
        overflow:visible !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-start-v62:not(:first-child) {
        margin-left:5px !important;
      }
      /* Group band. This is intentionally quiet: it only tells the eye which
         neighbouring set dots belong to the same exercise. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::before {
        content:'' !important;
        display:block !important;
        position:absolute !important;
        z-index:0 !important;
        left:-1px !important;
        right:-1px !important;
        top:50% !important;
        height:15px !important;
        transform:translateY(-50%) !important;
        border-top:1px solid rgba(148,163,184,.055) !important;
        border-bottom:1px solid rgba(148,163,184,.055) !important;
        background:rgba(148,163,184,.022) !important;
        pointer-events:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength::before {
        border-color:rgba(251,146,60,.075) !important;
        background:rgba(251,146,60,.025) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio::before {
        border-color:rgba(239,68,68,.075) !important;
        background:rgba(239,68,68,.025) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-start-v62::before {
        left:1px !important;
        border-left:1px solid rgba(148,163,184,.07) !important;
        border-radius:9px 0 0 9px !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-end-v62::before {
        right:1px !important;
        border-right:1px solid rgba(148,163,184,.07) !important;
        border-radius:0 9px 9px 0 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-single-v62::before {
        left:1px !important;
        right:1px !important;
        border-left:1px solid rgba(148,163,184,.07) !important;
        border-right:1px solid rgba(148,163,184,.07) !important;
        border-radius:9px !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength.pf-ex-complete-v62::before {
        border-color:rgba(251,146,60,.14) !important;
        background:rgba(251,146,60,.055) !important;
        box-shadow:inset 0 0 10px rgba(251,146,60,.022) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio.pf-ex-complete-v62::before {
        border-color:rgba(239,68,68,.14) !important;
        background:rgba(239,68,68,.055) !important;
        box-shadow:inset 0 0 10px rgba(239,68,68,.022) !important;
      }
      /* One and only one dot: the original ::after source. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::after {
        content:'' !important;
        display:block !important;
        position:relative !important;
        z-index:2 !important;
        width:9px !important;
        height:9px !important;
        box-sizing:border-box !important;
        border-radius:50% !important;
        border:1px solid rgba(100,116,139,.70) !important;
        background:#0B121A !important;
        box-shadow:0 0 0 2px #090E15,0 0 7px rgba(100,116,139,.12) !important;
        transition:width .16s ease,height .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength::after {
        border-color:rgba(251,146,60,.62) !important;
        box-shadow:0 0 0 2px #090E15,0 0 10px rgba(251,146,60,.18) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio::after {
        border-color:rgba(239,68,68,.64) !important;
        box-shadow:0 0 0 2px #090E15,0 0 10px rgba(239,68,68,.19) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.strength::after {
        background:#FB923C !important;
        border-color:#FED7AA !important;
        box-shadow:0 0 0 2px #090E15,0 0 11px rgba(251,146,60,.66),0 0 22px rgba(251,146,60,.25) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.cardio::after {
        background:#EF4444 !important;
        border-color:#FCA5A5 !important;
        box-shadow:0 0 0 2px #090E15,0 0 11px rgba(239,68,68,.68),0 0 22px rgba(239,68,68,.25) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
        width:17px !important;
        height:17px !important;
        background:var(--pf-accent) !important;
        border:2px solid var(--pf-soft) !important;
        box-shadow:0 0 0 4px rgba(var(--pf-rgb),.13),0 0 15px rgba(var(--pf-rgb),.86),0 0 31px rgba(var(--pf-rgb),.34) !important;
        animation:pfTimelinePulseV62 1.18s ease-in-out infinite !important;
      }
      @keyframes pfTimelinePulseV62 {
        50% { box-shadow:0 0 0 7px rgba(var(--pf-rgb),.05),0 0 20px rgba(var(--pf-rgb),.94),0 0 38px rgba(var(--pf-rgb),.38); }
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-meta {
        margin-top:2px !important;
        color:#647286 !important;
        font-size:8px !important;
        line-height:1.25 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-legend { gap:10px !important; }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-dot {
        width:6px !important;height:6px !important;border-radius:50% !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-dot.strength { background:#FB923C !important; }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-dot.cardio { background:#EF4444 !important; }

      /* ---------- SHARED TIMER SIGNAL ---------- */
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 {
        display:block;
        width:42px;
        height:9px;
        margin:5px auto 1px;
        color:currentColor;
        opacity:.48;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 svg { display:block;width:100%;height:100%;overflow:visible; }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62 path {
        fill:none;stroke:currentColor;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round;
        vector-effect:non-scaling-stroke;
      }
      html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62.pf-timer-signal-tick-v62 {
        animation:pfSignalTickV62 .24s ease-out both;
      }
      @keyframes pfSignalTickV62 { 45% { opacity:.95;filter:drop-shadow(0 0 5px currentColor);transform:scaleX(1.07); } }

      /* ---------- TIMED CARDIO: thin 270-degree Pulse Halo ---------- */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring {
        --pf-halo-angle:270deg;
        position:relative !important;
        display:grid !important;
        place-items:center !important;
        width:146px !important;
        height:146px !important;
        margin:8px auto 4px !important;
        border:0 !important;
        border-radius:50% !important;
        background:radial-gradient(circle,rgba(var(--pf-rgb),.032) 0 48%,transparent 69%) !important;
        box-shadow:none !important;
        overflow:visible !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-segments,
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring .session-countdown-core {
        display:none !important;
        visibility:hidden !important;
        opacity:0 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring::before {
        content:'' !important;
        position:absolute !important;
        inset:5px !important;
        border-radius:50% !important;
        background:conic-gradient(from 225deg,var(--pf-accent) 0 var(--pf-halo-angle),rgba(var(--pf-rgb),.105) var(--pf-halo-angle) 270deg,transparent 270deg 360deg) !important;
        -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2.6px),#000 calc(100% - 2.2px)) !important;
        mask:radial-gradient(farthest-side,transparent calc(100% - 2.6px),#000 calc(100% - 2.2px)) !important;
        filter:drop-shadow(0 0 5px rgba(var(--pf-rgb),.24)) !important;
        pointer-events:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring::after {
        content:'' !important;
        position:absolute !important;
        z-index:3 !important;
        left:50% !important;
        top:50% !important;
        width:7px !important;
        height:7px !important;
        border-radius:50% !important;
        border:1px solid var(--pf-soft) !important;
        background:var(--pf-accent) !important;
        box-shadow:0 0 9px rgba(var(--pf-rgb),.72) !important;
        transform:translate(-50%,-50%) rotate(calc(225deg + var(--pf-halo-angle))) translateY(-68px) !important;
        transform-origin:center !important;
        pointer-events:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring .session-countdown-copy {
        position:absolute !important;
        inset:0 !important;
        z-index:2 !important;
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        justify-content:center !important;
        text-align:center !important;
        color:var(--pf-soft) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-value {
        color:var(--pf-soft) !important;
        font-size:31px !important;
        line-height:1 !important;
        font-weight:600 !important;
        letter-spacing:-.7px !important;
        text-shadow:0 0 13px rgba(var(--pf-rgb),.15) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .session-countdown-label {
        margin-top:3px !important;
        color:#6F7D90 !important;
        font-size:8px !important;
        font-weight:650 !important;
        letter-spacing:1.25px !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-pause-hint {
        margin-top:3px !important;color:#647286 !important;font-size:7.5px !important;font-weight:600 !important;letter-spacing:.75px !important;
      }

      /* ---------- REST: exact same Halo family, calm cyan ---------- */
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-ring {
        --pf-rest-angle:270deg;
        position:relative !important;
        display:grid !important;
        place-items:center !important;
        width:150px !important;
        height:150px !important;
        margin:0 auto !important;
        border:0 !important;
        border-radius:50% !important;
        background:radial-gradient(circle,rgba(34,211,238,.032) 0 48%,transparent 69%) !important;
        box-shadow:none !important;
        overflow:visible !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-segments,
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-core {
        display:none !important;visibility:hidden !important;opacity:0 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-ring::before {
        content:'' !important;
        position:absolute !important;
        inset:5px !important;
        border-radius:50% !important;
        background:conic-gradient(from 225deg,#22D3EE 0 var(--pf-rest-angle),rgba(34,211,238,.105) var(--pf-rest-angle) 270deg,transparent 270deg 360deg) !important;
        -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2.6px),#000 calc(100% - 2.2px)) !important;
        mask:radial-gradient(farthest-side,transparent calc(100% - 2.6px),#000 calc(100% - 2.2px)) !important;
        filter:drop-shadow(0 0 5px rgba(34,211,238,.22)) !important;
        pointer-events:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-ring::after {
        content:'' !important;
        position:absolute !important;
        z-index:3 !important;
        left:50% !important;top:50% !important;
        width:7px !important;height:7px !important;border-radius:50% !important;
        border:1px solid #CFFAFE !important;background:#22D3EE !important;
        box-shadow:0 0 9px rgba(34,211,238,.68) !important;
        transform:translate(-50%,-50%) rotate(calc(225deg + var(--pf-rest-angle))) translateY(-70px) !important;
        pointer-events:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-copy {
        position:absolute !important;inset:0 !important;z-index:2 !important;
        display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;text-align:center !important;
        color:#CFFAFE !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-value {
        color:#CFFAFE !important;font-size:31px !important;line-height:1 !important;font-weight:600 !important;letter-spacing:-.7px !important;text-shadow:0 0 13px rgba(34,211,238,.14) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-label {
        margin-top:3px !important;color:#718095 !important;font-size:8px !important;font-weight:650 !important;letter-spacing:1.2px !important;text-transform:uppercase !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-skip {
        margin-top:18px !important;color:#647286 !important;font-size:8px !important;font-weight:650 !important;letter-spacing:1px !important;
      }

      /* ---------- 5 SECOND PRE-TIMER: no circle; number + hairline + playhead ---------- */
      html.exercise-concept-pulse-home-v1 #session-pre-timer.show {
        background:radial-gradient(410px 270px at 50% 48%,rgba(var(--concept-timer-rgb),.065),transparent 70%),#080D14 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer-ring {
        --pf-pre-progress:0;
        position:relative !important;
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        justify-content:center !important;
        width:min(310px,82vw) !important;
        height:auto !important;
        min-height:0 !important;
        padding:0 !important;
        margin:0 auto !important;
        border:0 !important;
        border-radius:0 !important;
        background:none !important;
        box-shadow:none !important;
        overflow:visible !important;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer-ring::before,
      html.exercise-concept-pulse-home-v1 #session-pre-timer-ring::after {
        content:none !important;display:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer-ring .session-pre-copy {
        position:static !important;
        transform:none !important;
        display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;
        color:var(--concept-timer-soft) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer-value {
        min-width:0 !important;color:var(--concept-timer-soft) !important;font-size:52px !important;line-height:.95 !important;font-weight:600 !important;letter-spacing:-1.2px !important;text-shadow:0 0 15px rgba(var(--concept-timer-rgb),.16) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer .session-pre-label {
        margin-top:7px !important;color:var(--concept-timer-accent) !important;font-size:9px !important;font-weight:650 !important;letter-spacing:1.45px !important;text-transform:uppercase !important;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-line-v62 {
        position:relative;width:min(250px,68vw);height:16px;margin:22px auto 0;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-line-v62::before {
        content:'';position:absolute;left:0;right:0;top:7px;height:1px;background:rgba(var(--concept-timer-rgb),.14);
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-line-fill-v62 {
        position:absolute;left:0;top:7px;width:calc(var(--pf-pre-progress) * 100%);height:1px;background:var(--concept-timer-accent);box-shadow:0 0 6px rgba(var(--concept-timer-rgb),.32);
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-line-dot-v62 {
        position:absolute;top:3.5px;left:calc(var(--pf-pre-progress) * 100%);width:8px;height:8px;transform:translateX(-50%);border-radius:50%;border:1px solid var(--concept-timer-soft);background:var(--concept-timer-accent);box-shadow:0 0 9px rgba(var(--concept-timer-rgb),.68);
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-exercise-v62 {
        margin-top:10px;color:#718095;font-size:9px;font-weight:650;letter-spacing:.8px;text-transform:uppercase;text-align:center;
      }

      @media(max-width:600px) {
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-track { height:33px !important;padding-left:3px !important;padding-right:3px !important; }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment { min-width:5px !important;height:33px !important; }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::after { width:8px !important;height:8px !important; }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after { width:16px !important;height:16px !important; }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring { width:138px !important;height:138px !important; }
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring::after { transform:translate(-50%,-50%) rotate(calc(225deg + var(--pf-halo-angle))) translateY(-64px) !important; }
        html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-ring { width:142px !important;height:142px !important; }
        html.exercise-concept-pulse-home-v1 #session-between-overlay-v2.pulse-flow-rest-v58 .bs-ring::after { transform:translate(-50%,-50%) rotate(calc(225deg + var(--pf-rest-angle))) translateY(-66px) !important; }
      }

      @media(prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after,
        html.exercise-concept-pulse-home-v1 .pf-timer-signal-v62.pf-timer-signal-tick-v62 { animation:none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSignal(copy) {
    if (!copy) return null;
    var signal = copy.querySelector('.pf-timer-signal-v62');
    if (signal) return signal;
    signal = document.createElement('span');
    signal.className = 'pf-timer-signal-v62';
    signal.setAttribute('aria-hidden','true');
    signal.innerHTML = '<svg viewBox="0 0 42 9" focusable="false"><path d="M0 5 H10 L13 3.7 L16 6.1 L20 1 L24 8 L28 4.8 H42"></path></svg>';
    var label = copy.querySelector('.session-countdown-label,.bs-label');
    if (label) label.insertAdjacentElement('beforebegin',signal);
    else copy.appendChild(signal);
    return signal;
  }

  function tickSignal(signal,key,value) {
    if (!signal || !value || lastTick[key] === value) return;
    lastTick[key] = value;
    signal.classList.remove('pf-timer-signal-tick-v62');
    void signal.offsetWidth;
    signal.classList.add('pf-timer-signal-tick-v62');
    setTimeout(function () { signal.classList.remove('pf-timer-signal-tick-v62'); },260);
  }

  function ratioFromSegments(root,selector) {
    if (!root) return 0;
    var all = Array.prototype.slice.call(root.querySelectorAll(selector));
    if (!all.length) return 0;
    var active = all.filter(function (node) { return node.classList.contains('active'); }).length;
    return Math.max(0,Math.min(1,active / all.length));
  }

  function syncCardioHalo() {
    var ring = document.getElementById('session-countdown-ring');
    if (!ring) return;
    var ratio = ratioFromSegments(ring,'.session-countdown-segment');
    ring.style.setProperty('--pf-halo-angle',(ratio * 270).toFixed(2) + 'deg');
    var copy = ring.querySelector('.session-countdown-copy');
    var signal = ensureSignal(copy);
    var value = document.getElementById('session-countdown-value');
    tickSignal(signal,'cardio',value ? String(value.textContent || '').trim() : '');
  }

  function syncRestHalo() {
    var overlay = document.getElementById('session-between-overlay-v2');
    if (!overlay || !overlay.classList.contains('show')) return;
    var ring = overlay.querySelector('.bs-ring');
    if (!ring) return;
    var ratio = ratioFromSegments(ring,'.bs-segment');
    ring.style.setProperty('--pf-rest-angle',(ratio * 270).toFixed(2) + 'deg');
    var copy = ring.querySelector('.bs-copy');
    var signal = ensureSignal(copy);
    var value = overlay.querySelector('.bs-value');
    tickSignal(signal,'rest',value ? String(value.textContent || '').trim() : '');
  }

  function syncPreTimer() {
    var overlay = document.getElementById('session-pre-timer');
    var ring = document.getElementById('session-pre-timer-ring');
    if (!overlay || !ring) return;
    var raw = parseFloat(String(ring.style.getPropertyValue('--pre-smooth-progress') || '0').replace('deg','')) || 0;
    var progress = Math.max(0,Math.min(1,raw / 360));
    ring.style.setProperty('--pf-pre-progress',progress.toFixed(4));

    var label = overlay.querySelector('.session-pre-label');
    if (label && label.textContent !== 'Startar set') label.textContent = 'Startar set';

    var line = ring.querySelector('.pf-pre-line-v62');
    if (!line) {
      line = document.createElement('div');
      line.className = 'pf-pre-line-v62';
      line.setAttribute('aria-hidden','true');
      line.innerHTML = '<span class="pf-pre-line-fill-v62"></span><span class="pf-pre-line-dot-v62"></span>';
      ring.appendChild(line);
    }

    var exercise = ring.querySelector('.pf-pre-exercise-v62');
    if (!exercise) {
      exercise = document.createElement('div');
      exercise.className = 'pf-pre-exercise-v62';
      ring.appendChild(exercise);
    }
    var current = document.getElementById('session-current-ex');
    exercise.textContent = current ? String(current.textContent || '').replace(/\s+/g,' ').trim() : '';

    var value = document.getElementById('session-pre-timer-value');
    if (overlay.classList.contains('show') && value) lastTick.pre = String(value.textContent || '').trim();
  }

  function syncProgressGrouping() {
    var title = document.querySelector('#session-modal .hype-progress-title');
    if (title && title.textContent !== 'Passflöde') title.textContent = 'Passflöde';

    var track = document.getElementById('hype-progress-track');
    var state = getState();
    if (!track || !state || !Array.isArray(state.exercises)) return;
    var segments = Array.prototype.slice.call(track.querySelectorAll('.hype-progress-segment'));
    if (!segments.length) return;

    segments.forEach(function (segment) {
      segment.classList.remove('pf-ex-start-v62','pf-ex-end-v62','pf-ex-single-v62','pf-ex-complete-v62');
      delete segment.dataset.pfExerciseIndex;
    });

    var cursor = 0;
    state.exercises.forEach(function (exercise,exIndex) {
      var count = Math.max(1,Number(exercise && exercise.plannedSets) || 1);
      var start = cursor;
      var end = Math.min(segments.length - 1,cursor + count - 1);
      if (start >= segments.length) return;
      var logs = state.logs && Array.isArray(state.logs[exIndex]) ? state.logs[exIndex].length : 0;
      var complete = logs >= count;
      for (var i=start;i<=end;i++) {
        segments[i].dataset.pfExerciseIndex = String(exIndex);
        if (complete) segments[i].classList.add('pf-ex-complete-v62');
      }
      segments[start].classList.add('pf-ex-start-v62');
      segments[end].classList.add('pf-ex-end-v62');
      if (start === end) segments[start].classList.add('pf-ex-single-v62');
      cursor += count;
    });
  }

  function removeLegacyExperiment() {
    var extra = document.getElementById('pulse-flow-timer-ecg-v61');
    if (extra) extra.remove();
  }

  function sync() {
    removeLegacyExperiment();
    syncProgressGrouping();
    syncCardioHalo();
    syncRestHalo();
    syncPreTimer();
  }

  function install() {
    addStyles();
    sync();
    var timer = setInterval(sync,120);
    window.addEventListener('pagehide',function () { clearInterval(timer); },{once:true});
    window.addEventListener('pageshow',function () { setTimeout(sync,0); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
