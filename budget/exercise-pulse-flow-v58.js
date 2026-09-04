(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowV58Installed) return;
  window.__exercisePulseFlowV58Installed = true;

  var renderBound = false;
  var sessionObserver = null;
  var restObserver = null;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    return state.exercises[Number(state.exerciseIndex) || 0] || null;
  }

  function pulseMarkup(idPrefix, withStatus) {
    var gradient = idPrefix + '-gradient';
    var glow = idPrefix + '-glow';
    var path = 'M0 36 L42 36 C49 36 52 34 56 30 L63 42 L72 36 L101 36 L112 13 L126 58 L139 36 L170 36 ' +
      'C177 36 180 34 184 30 L191 42 L200 36 L229 36 L240 13 L254 58 L267 36 L298 36 ' +
      'C305 36 308 34 312 30 L319 42 L328 36 L357 36 L368 13 L382 58 L395 36 L426 36 ' +
      'C433 36 436 34 440 30 L447 42 L456 36 L485 36 L496 13 L510 58 L523 36 L600 36';
    return '<div class="pulse-flow-band-v58" aria-hidden="true">' +
      (withStatus ? '<div class="pulse-flow-status-v58"><span></span><b data-pulse-flow-status>Redo</b></div>' : '') +
      '<svg viewBox="0 0 600 70" preserveAspectRatio="none" focusable="false">' +
        '<defs>' +
          '<linearGradient id="' + gradient + '" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="currentColor" stop-opacity="0"></stop>' +
            '<stop offset=".28" stop-color="currentColor" stop-opacity=".52"></stop>' +
            '<stop offset=".64" stop-color="currentColor"></stop>' +
            '<stop offset="1" stop-color="currentColor" stop-opacity="0"></stop>' +
          '</linearGradient>' +
          '<filter id="' + glow + '" x="-30%" y="-80%" width="160%" height="260%">' +
            '<feGaussianBlur stdDeviation="2.4" result="blur"></feGaussianBlur>' +
            '<feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>' +
          '</filter>' +
        '</defs>' +
        '<path class="pulse-flow-axis-v58" d="M0 36 H600" pathLength="1000"></path>' +
        '<path class="pulse-flow-ghost-v58" d="' + path + '" pathLength="1000"></path>' +
        '<path class="pulse-flow-trace-v58" d="' + path + '" pathLength="1000" stroke="url(#' + gradient + ')" filter="url(#' + glow + ')"></path>' +
      '</svg>' +
    '</div>';
  }

  function addStyles() {
    if (document.getElementById('exercise-pulse-flow-v58-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-pulse-flow-v58-style';
    style.textContent = `
      /* Pulse Flow is the final presentation authority for live training.
         It deliberately does not change session state, timers or routing. */
      #session-modal.pulse-flow-v58 {
        --pf-accent:#67E8F9;
        --pf-soft:#CFFAFE;
        --pf-rgb:34,211,238;
        --pf-speed:2.4s;
      }
      #session-modal.pulse-flow-v58.pulse-flow-strength-v58 {
        --pf-accent:#FB923C;
        --pf-soft:#FED7AA;
        --pf-rgb:251,146,60;
      }
      #session-modal.pulse-flow-v58.pulse-flow-cardio-v58 {
        --pf-accent:#EF4444;
        --pf-soft:#FCA5A5;
        --pf-rgb:239,68,68;
      }
      #session-modal.pulse-flow-v58.pulse-flow-active-v58 { --pf-speed:.92s; }
      #session-modal.pulse-flow-v58.pulse-flow-active-v58.pulse-flow-cardio-v58 { --pf-speed:.72s; }
      #session-modal.pulse-flow-v58.pulse-flow-starting-v58 { --pf-speed:1.18s; }
      #session-modal.pulse-flow-v58.pulse-flow-resting-v58 {
        --pf-accent:#67E8F9;
        --pf-soft:#CFFAFE;
        --pf-rgb:34,211,238;
        --pf-speed:2.8s;
      }
      #session-modal.pulse-flow-v58.pulse-flow-complete-v58 {
        --pf-accent:#34D399;
        --pf-soft:#A7F3D0;
        --pf-rgb:52,211,153;
        --pf-speed:3.2s;
      }

      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) {
        background:#080D14 !important;
        transition:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-shell {
        background:
          radial-gradient(720px 360px at 50% -90px,rgba(var(--pf-rgb),.105),transparent 68%),
          radial-gradient(540px 300px at 94% 44%,rgba(var(--pf-rgb),.032),transparent 72%),
          linear-gradient(180deg,#0A1018 0%,#090E15 54%,#080C12 100%) !important;
        transition:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-shell::before,
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-shell::after {
        content:none !important;
        display:none !important;
        animation:none !important;
      }

      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-top {
        background:rgba(8,13,20,.88) !important;
        border-bottom:1px solid rgba(var(--pf-rgb),.13) !important;
        box-shadow:0 8px 30px rgba(0,0,0,.20) !important;
        backdrop-filter:blur(20px) !important;
        -webkit-backdrop-filter:blur(20px) !important;
        transition:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-top::after {
        content:'';
        position:absolute;
        left:18px;
        right:18px;
        bottom:-1px;
        height:1px;
        pointer-events:none;
        background:linear-gradient(90deg,transparent,rgba(var(--pf-rgb),.70),transparent);
        opacity:.48;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-title {
        color:#F1F5F9 !important;
        letter-spacing:-.55px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-subtitle {
        color:#788596 !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-view-toggle,
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-top > .session-cta,
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-pretimer-toggle-v2 {
        border-color:rgba(var(--pf-rgb),.20) !important;
        background:rgba(255,255,255,.025) !important;
        box-shadow:none !important;
      }

      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-grid {
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        gap:14px !important;
        padding:clamp(10px,2vw,18px) !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-grid > .session-card {
        width:min(820px,100%) !important;
        max-width:820px !important;
        margin:0 auto !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-main.session-card {
        display:flex !important;
        flex-direction:column !important;
        gap:12px !important;
        padding:clamp(12px,2.3vw,22px) !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
        transition:none !important;
      }

      /* Timers read as live values rather than two cards. */
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-timers {
        position:relative !important;
        gap:0 !important;
        margin:0 0 4px !important;
        padding:0 0 10px !important;
        border-bottom:1px solid rgba(148,163,184,.12) !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-timers::after {
        content:'';
        position:absolute;
        left:50%;
        top:5px;
        bottom:15px;
        width:1px;
        background:linear-gradient(transparent,rgba(var(--pf-rgb),.28),transparent);
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .timer-box {
        min-height:58px !important;
        padding:7px 14px !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
        transition:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .timer-lbl {
        color:#697789 !important;
        font-size:8px !important;
        letter-spacing:1.05px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .timer-val {
        color:var(--pf-soft) !important;
        font-size:clamp(24px,5vw,32px) !important;
        font-weight:850 !important;
        letter-spacing:-1.05px !important;
        text-shadow:0 0 18px rgba(var(--pf-rgb),.12) !important;
        transition:none !important;
      }

      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-ex-heading-row {
        align-items:baseline !important;
        margin-top:2px !important;
        gap:7px 10px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-current-ex {
        color:#F4F7FB !important;
        font-size:clamp(31px,7.5vw,48px) !important;
        line-height:.98 !important;
        font-weight:880 !important;
        letter-spacing:-1.75px !important;
        text-shadow:0 8px 30px rgba(0,0,0,.25) !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-next-ex-arrow {
        color:var(--pf-accent) !important;
        opacity:.82 !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-next-ex-inline {
        color:#667386 !important;
        font-weight:650 !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-current-target {
        color:#778496 !important;
        font-size:11px !important;
        line-height:1.35 !important;
        margin-top:-4px !important;
      }

      /* Animated ECG ribbon. It is a state indicator, not a fabricated BPM. */
      #pulse-flow-live-v58 {
        order:initial;
        width:100%;
        min-width:0;
      }
      .pulse-flow-band-v58 {
        position:relative;
        width:100%;
        height:78px;
        min-width:0;
        overflow:hidden;
        color:var(--pf-accent);
        border-top:1px solid rgba(var(--pf-rgb),.10);
        border-bottom:1px solid rgba(var(--pf-rgb),.10);
        background:linear-gradient(90deg,transparent,rgba(var(--pf-rgb),.027) 20%,rgba(var(--pf-rgb),.048) 50%,rgba(var(--pf-rgb),.027) 80%,transparent);
        transition:none;
      }
      .pulse-flow-band-v58::after {
        content:'';
        position:absolute;
        inset:0;
        pointer-events:none;
        background:linear-gradient(90deg,#090E15 0,transparent 9%,transparent 91%,#090E15 100%);
      }
      .pulse-flow-band-v58 svg {
        position:absolute;
        inset:7px 0 1px;
        display:block;
        width:100%;
        height:70px;
        overflow:visible;
      }
      .pulse-flow-axis-v58,
      .pulse-flow-ghost-v58,
      .pulse-flow-trace-v58 {
        fill:none;
        vector-effect:non-scaling-stroke;
        stroke-linecap:round;
        stroke-linejoin:round;
      }
      .pulse-flow-axis-v58 {
        stroke:rgba(var(--pf-rgb),.10);
        stroke-width:1;
      }
      .pulse-flow-ghost-v58 {
        stroke:currentColor;
        stroke-width:1.25;
        opacity:.20;
      }
      .pulse-flow-trace-v58 {
        stroke-width:2.25;
        stroke-dasharray:175 825;
        stroke-dashoffset:0;
        animation:pulse-flow-sweep-v58 var(--pf-speed) linear infinite;
        will-change:stroke-dashoffset;
      }
      @keyframes pulse-flow-sweep-v58 {
        to { stroke-dashoffset:-1000; }
      }
      .pulse-flow-status-v58 {
        position:absolute;
        left:8px;
        top:7px;
        z-index:3;
        display:flex;
        align-items:center;
        gap:5px;
        color:var(--pf-soft);
        font-size:7.5px;
        line-height:1;
        font-weight:850;
        letter-spacing:1px;
        text-transform:uppercase;
      }
      .pulse-flow-status-v58 > span {
        width:5px;
        height:5px;
        border-radius:50%;
        background:var(--pf-accent);
        box-shadow:0 0 8px rgba(var(--pf-rgb),.70);
      }

      /* Set/reps/weight become one quiet metric rail. */
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-stable-details {
        display:grid !important;
        grid-template-columns:repeat(3,minmax(0,1fr)) !important;
        width:100% !important;
        max-width:none !important;
        gap:0 !important;
        margin:0 !important;
        padding:10px 0 11px !important;
        border-top:1px solid rgba(148,163,184,.10) !important;
        border-bottom:1px solid rgba(148,163,184,.10) !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-stable-details > div {
        position:relative !important;
        min-width:0 !important;
        padding:0 10px !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
        transition:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-stable-details > div + div::before {
        content:'';
        position:absolute;
        left:0;
        top:4px;
        bottom:3px;
        width:1px;
        background:linear-gradient(transparent,rgba(var(--pf-rgb),.24),transparent);
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-stable-details .stable-detail-label {
        color:#687689 !important;
        font-size:7.5px !important;
        letter-spacing:.95px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-stable-details .stable-detail-value {
        margin-top:5px !important;
        color:var(--pf-soft) !important;
        font-size:clamp(23px,5.5vw,31px) !important;
        font-weight:850 !important;
        letter-spacing:-1px !important;
        text-shadow:0 0 15px rgba(var(--pf-rgb),.10) !important;
      }

      /* Pass progress borrows the chart language: hairline + measured points. */
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-workout-progress {
        display:block !important;
        width:100% !important;
        max-width:none !important;
        margin:6px 0 2px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-head {
        margin-bottom:4px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-title {
        color:#6F7C8E !important;
        font-size:8px !important;
        letter-spacing:1px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-percent {
        color:var(--pf-soft) !important;
        font-size:18px !important;
        font-weight:850 !important;
        text-shadow:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-track {
        position:relative !important;
        display:flex !important;
        align-items:center !important;
        width:100% !important;
        height:20px !important;
        gap:0 !important;
        padding:0 2px !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
        overflow:visible !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-track::before {
        content:'';
        position:absolute;
        left:6px;
        right:6px;
        top:50%;
        height:1px;
        background:rgba(148,163,184,.18);
        transform:translateY(-50%);
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment {
        position:relative !important;
        z-index:1 !important;
        display:grid !important;
        place-items:center !important;
        flex:1 1 0 !important;
        width:auto !important;
        min-width:4px !important;
        height:20px !important;
        padding:0 !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment::after {
        content:'';
        display:block;
        width:5px;
        height:5px;
        border-radius:50%;
        border:1px solid rgba(100,116,139,.72);
        background:#111923;
        box-sizing:border-box;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.strength::after {
        border-color:#FB923C;
        background:#FED7AA;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.done.cardio::after {
        border-color:#EF4444;
        background:#FCA5A5;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-segment.current::after {
        width:9px;
        height:9px;
        border-color:var(--pf-accent);
        background:var(--pf-soft);
        box-shadow:0 0 11px rgba(var(--pf-rgb),.55);
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-meta {
        margin-top:2px !important;
        color:#657285 !important;
        font-size:8px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-legend {
        gap:10px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-dot {
        width:5px !important;
        height:5px !important;
        border-radius:50% !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-dot.strength { background:#FB923C !important; }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-dot.cardio { background:#EF4444 !important; }

      /* Logged sets stay editable, but become rows instead of nested cards. */
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-log-section {
        margin-top:4px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-log-section > div:first-child:not(#session-set-log) {
        color:#6E7B8D !important;
        font-size:8px !important;
        letter-spacing:1px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log {
        gap:0 !important;
        margin-top:5px !important;
        border-top:1px solid rgba(148,163,184,.10) !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log .set-log-item {
        grid-template-columns:minmax(54px,.65fr) repeat(3,minmax(0,1fr)) !important;
        gap:6px !important;
        margin:0 !important;
        padding:8px 2px !important;
        border:0 !important;
        border-bottom:1px solid rgba(148,163,184,.10) !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log .set-tag {
        color:var(--pf-soft) !important;
        font-size:9px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log input {
        height:34px !important;
        padding:5px 3px !important;
        border:0 !important;
        border-bottom:1px solid rgba(var(--pf-rgb),.18) !important;
        border-radius:0 !important;
        background:transparent !important;
        color:#DCE5F0 !important;
        -webkit-text-fill-color:#DCE5F0 !important;
        box-shadow:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log input:focus {
        border-bottom-color:var(--pf-accent) !important;
        box-shadow:0 7px 14px -10px rgba(var(--pf-rgb),.80) !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log input[readonly] {
        color:#788596 !important;
        -webkit-text-fill-color:#788596 !important;
        background:transparent !important;
      }

      /* One clear action surface; secondary decisions stay quiet. */
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-controls {
        width:100% !important;
        min-height:48px !important;
        margin-top:5px !important;
        gap:8px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-controls .session-cta {
        min-height:48px !important;
        border-radius:999px !important;
        transition:transform .14s cubic-bezier(.22,1,.36,1),filter .14s ease !important;
        animation:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-controls .session-cta.primary {
        border:1px solid rgba(var(--pf-rgb),.78) !important;
        background:linear-gradient(110deg,rgba(var(--pf-rgb),.96),rgba(var(--pf-rgb),.72)) !important;
        color:#071017 !important;
        box-shadow:0 10px 30px rgba(var(--pf-rgb),.16),inset 0 1px 0 rgba(255,255,255,.28) !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-controls .session-cta.warn,
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-controls .session-cta.success {
        border-color:rgba(var(--pf-rgb),.26) !important;
        background:rgba(255,255,255,.025) !important;
        color:#B7C3D2 !important;
        box-shadow:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-controls .session-cta:active {
        transform:scale(.985) !important;
      }

      /* The plan remains available below, but as a flat data table. */
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-grid > .session-card:nth-child(2) {
        padding:12px 0 0 !important;
        border:0 !important;
        border-top:1px solid rgba(148,163,184,.12) !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-grid > .session-card:nth-child(2) > div:first-child {
        color:#6C798B !important;
        font-size:8px !important;
        letter-spacing:1px !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-table th,
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-table td {
        padding:8px 7px !important;
        border-bottom-color:rgba(148,163,184,.09) !important;
        background:transparent !important;
      }
      #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-table th {
        color:#697789 !important;
        font-size:8px !important;
      }

      /* Rest gets the same ribbon at a slower cadence. */
      #session-between-overlay-v2.pulse-flow-rest-v58 {
        --pf-accent:#67E8F9;
        --pf-soft:#CFFAFE;
        --pf-rgb:34,211,238;
        --pf-speed:2.9s;
        background:rgba(7,12,18,.965) !important;
        backdrop-filter:blur(12px) !important;
        -webkit-backdrop-filter:blur(12px) !important;
      }
      #session-between-overlay-v2.pulse-flow-rest-v58.pulse-flow-custom-v58 {
        --pf-accent:#FB923C;
        --pf-soft:#FED7AA;
        --pf-rgb:251,146,60;
        --pf-speed:1.1s;
      }
      #session-between-overlay-v2.pulse-flow-rest-v58 .bs-overlay-wrap {
        width:min(520px,calc(100vw - 28px)) !important;
      }
      #session-between-overlay-v2.pulse-flow-rest-v58 .bs-heading {
        color:var(--pf-soft) !important;
        font-size:13px !important;
        letter-spacing:.4px !important;
      }
      #session-between-overlay-v2.pulse-flow-rest-v58 .bs-ring {
        width:146px !important;
        height:146px !important;
        margin:0 auto !important;
      }
      #session-between-overlay-v2.pulse-flow-rest-v58 .bs-core {
        inset:22px !important;
        border-color:rgba(var(--pf-rgb),.12) !important;
        background:#0A1119 !important;
      }
      #session-between-overlay-v2.pulse-flow-rest-v58 .bs-segment.active {
        background:var(--pf-accent) !important;
        box-shadow:0 0 5px rgba(var(--pf-rgb),.48) !important;
      }
      #session-between-overlay-v2.pulse-flow-rest-v58 .bs-value {
        color:var(--pf-soft) !important;
        font-size:32px !important;
      }
      #session-between-overlay-v2.pulse-flow-rest-v58 .pulse-flow-band-v58 {
        height:64px;
        margin:12px 0 4px;
      }
      #session-between-overlay-v2.pulse-flow-rest-v58 .pulse-flow-band-v58 svg {
        top:0;
        height:64px;
      }
      #session-between-overlay-v2.pulse-flow-rest-v58 .bs-start-next-v20 {
        border-color:rgba(var(--pf-rgb),.28) !important;
        background:rgba(var(--pf-rgb),.055) !important;
        color:var(--pf-soft) !important;
        box-shadow:none !important;
      }

      @media(max-width:600px) {
        #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-main {
          min-height:0 !important;
          height:auto !important;
        }
        #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown {
          margin:3px auto 5px !important;
          padding:2px 0 4px !important;
        }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-grid {
          padding:8px 10px max(18px,env(safe-area-inset-bottom)) !important;
          gap:10px !important;
        }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-main.session-card {
          gap:9px !important;
          padding:10px 4px 12px !important;
        }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-top {
          padding-left:11px !important;
          padding-right:11px !important;
        }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-top::after {
          left:11px;
          right:11px;
        }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-timers {
          padding-bottom:7px !important;
        }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .timer-box {
          min-height:51px !important;
          padding:5px 8px !important;
        }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-current-ex {
          font-size:clamp(29px,9vw,39px) !important;
          letter-spacing:-1.35px !important;
        }
        .pulse-flow-band-v58 { height:67px; }
        .pulse-flow-band-v58 svg { inset:0 0 -3px;height:67px; }
        .pulse-flow-status-v58 { top:5px;font-size:7px; }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-stable-details {
          padding:8px 0 9px !important;
        }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-stable-details > div {
          padding:0 5px !important;
        }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-meta {
          flex-direction:row !important;
          align-items:center !important;
          justify-content:space-between !important;
          gap:7px !important;
        }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-controls .session-cta {
          min-height:50px !important;
          padding:12px 10px !important;
          font-size:13px !important;
        }
        #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring {
          flex-basis:min(132px,39vw) !important;
          width:min(132px,39vw) !important;
          height:min(132px,39vw) !important;
        }
        #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-core {
          inset:18px !important;
        }
        #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
          font-size:27px !important;
        }
        #session-between-overlay-v2.pulse-flow-rest-v58 .bs-ring {
          width:136px !important;
          height:136px !important;
        }
      }

      @media(max-width:370px), (max-height:720px) {
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-grid {
          padding-top:5px !important;
        }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-main.session-card {
          gap:7px !important;
          padding-top:7px !important;
        }
        .pulse-flow-band-v58 { height:58px; }
        .pulse-flow-band-v58 svg { height:61px; }
        #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .hype-progress-meta {
          font-size:7px !important;
        }
      }

      @media(prefers-reduced-motion:reduce) {
        .pulse-flow-trace-v58 {
          animation:none !important;
          stroke-dasharray:420 580 !important;
          stroke-dashoffset:-180 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureLivePulse() {
    var target = document.getElementById('session-current-target');
    if (!target || !target.parentNode) return null;
    var pulse = document.getElementById('pulse-flow-live-v58');
    if (!pulse) {
      pulse = document.createElement('div');
      pulse.id = 'pulse-flow-live-v58';
      pulse.innerHTML = pulseMarkup('pulse-flow-live-v58', true);
      target.insertAdjacentElement('afterend', pulse);
    }
    return pulse;
  }

  function ensureRestPulse() {
    var overlay = document.getElementById('session-between-overlay-v2');
    var wrap = overlay && overlay.querySelector('.bs-overlay-wrap');
    if (!overlay || !wrap) return null;
    setClass(overlay, 'pulse-flow-rest-v58', true);
    var pulse = document.getElementById('pulse-flow-rest-band-v58');
    if (!pulse) {
      pulse = document.createElement('div');
      pulse.id = 'pulse-flow-rest-band-v58';
      pulse.innerHTML = pulseMarkup('pulse-flow-rest-v58', false);
      var ring = wrap.querySelector('.bs-ring');
      if (ring) ring.insertAdjacentElement('afterend', pulse);
      else wrap.appendChild(pulse);
    }
    return pulse;
  }

  function setClass(element, name, enabled) {
    if (element && element.classList.contains(name) !== !!enabled) element.classList.toggle(name, !!enabled);
  }

  function syncControls(state) {
    var controls = document.getElementById('session-controls');
    if (!controls) return;
    Array.prototype.forEach.call(controls.querySelectorAll('button'), function (button) {
      var label = String(button.textContent || '').trim().toLocaleLowerCase('sv-SE');
      var action = 'secondary';
      if (/^klar med set/.test(label)) action = 'complete-set';
      else if (/^starta/.test(label)) action = state && state.awaitingDecision ? 'next' : 'start';
      else if (/^extra set/.test(label)) action = 'extra';
      else if (/^övning klar/.test(label)) action = 'finish';
      if (button.dataset.pulseFlowAction !== action) button.dataset.pulseFlowAction = action;
    });
  }

  function syncState() {
    var modal = document.getElementById('session-modal');
    if (!modal) return;
    setClass(modal, 'pulse-flow-v58', true);
    ensureLivePulse();

    var state = getState();
    var exercise = currentExercise(state);
    var pre = document.getElementById('session-pre-timer');
    var rest = document.getElementById('session-between-overlay-v2');
    var restVisible = !!(rest && rest.classList.contains('show'));
    var preVisible = !!(pre && pre.classList.contains('show'));
    var done = !!(state && Array.isArray(state.exercises) && Number(state.exerciseIndex) >= state.exercises.length);
    var active = !!(state && state.setRunning);
    var starting = preVisible && !active;
    var waiting = !!(state && state.awaitingDecision);
    var cardio = !!(exercise && exercise.kind === 'cardio');
    var strength = !!(exercise && exercise.kind !== 'cardio');

    setClass(modal, 'pulse-flow-active-v58', active);
    setClass(modal, 'pulse-flow-starting-v58', starting);
    setClass(modal, 'pulse-flow-resting-v58', restVisible || waiting);
    setClass(modal, 'pulse-flow-complete-v58', done);
    setClass(modal, 'pulse-flow-cardio-v58', !done && !restVisible && !waiting && cardio);
    setClass(modal, 'pulse-flow-strength-v58', !done && !restVisible && !waiting && strength);

    var status = modal.querySelector('[data-pulse-flow-status]');
    if (status) {
      var text = 'Redo';
      if (done) text = 'Pass klart';
      else if (restVisible || waiting) text = 'Återhämtning';
      else if (active) text = cardio ? 'Kondition pågår' : 'Aktivt set';
      else if (starting) text = 'Startar';
      if (status.textContent !== text) status.textContent = text;
    }
    syncControls(state);
    syncRestState();
  }

  function syncRestState() {
    var overlay = document.getElementById('session-between-overlay-v2');
    if (!overlay) return;
    ensureRestPulse();
    setClass(overlay, 'pulse-flow-custom-v58', overlay.dataset.betweenType === 'custom');
  }

  function observeStateSurfaces() {
    var modal = document.getElementById('session-modal');
    if (modal && !sessionObserver) {
      sessionObserver = new MutationObserver(function () { syncState(); });
      sessionObserver.observe(modal, {attributes:true,attributeFilter:['class']});
    }
    var rest = document.getElementById('session-between-overlay-v2');
    if (rest && !restObserver) {
      restObserver = new MutationObserver(function () { syncState(); });
      restObserver.observe(rest, {attributes:true,attributeFilter:['class','data-between-type']});
    }
  }

  function bindFinalRenderer() {
    if (renderBound) return true;
    if (typeof window.renderSessionMode !== 'function') return false;
    var original = window.renderSessionMode;
    if (original.__exercisePulseFlowV58Wrapped) {
      renderBound = true;
      return true;
    }
    var wrapped = function () {
      var result = original.apply(this, arguments);
      syncState();
      return result;
    };
    wrapped.__exercisePulseFlowV58Wrapped = true;
    wrapped.__exercisePulseFlowV58Original = original;
    window.renderSessionMode = wrapped;
    renderBound = true;
    return true;
  }

  function install() {
    addStyles();
    var modal = document.getElementById('session-modal');
    setClass(modal, 'pulse-flow-v58', true);
    ensureLivePulse();
    ensureRestPulse();
    observeStateSurfaces();
    syncState();

    var attempts = 0;
    (function bindWhenReady() {
      attempts += 1;
      if (bindFinalRenderer()) {
        syncState();
        return;
      }
      if (attempts < 160) setTimeout(bindWhenReady, 50);
    })();

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) syncState();
    });
    window.addEventListener('pageshow', syncState);

    window.__exercisePulseFlowV58 = {
      sync:syncState,
      ensureLivePulse:ensureLivePulse,
      ensureRestPulse:ensureRestPulse
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
