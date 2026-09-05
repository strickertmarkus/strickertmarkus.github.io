(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseConceptLabV1Installed) return;

  var concept = String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase();
  var concepts = {
    'interval-track': {
      title:'Interval Track',
      eyebrow:'Koncept 01',
      copy:'Tydliga banor, block och rytm för set, intervaller och återhämtning.'
    },
    'uhd-athlete': {
      title:'UHD Athlete',
      eyebrow:'Koncept 02',
      copy:'En precisionsvy med hög kontrast, livekänsla och fokuserad träningsdata.'
    },
    'pulse-home': {
      title:'Pulse Flow · Helsida',
      eyebrow:'Koncept 03',
      copy:'Träningsöversikten och passläget i samma lugna, levande visuella språk.'
    }
  };
  if (!concepts[concept]) return;
  window.__exerciseConceptLabV1Installed = true;

  var root = document.documentElement;
  var modalObserver = null;

  function addStyles() {
    if (document.getElementById('exercise-concept-lab-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-concept-lab-v1-style';
    style.textContent = `
      html[class*="exercise-concept-"] {
        --concept-bg:#080D14;
        --concept-surface:#0C131C;
        --concept-surface-2:#101925;
        --concept-line:rgba(148,163,184,.13);
        --concept-text:#F1F5F9;
        --concept-muted:#788699;
        --concept-accent:#67E8F9;
        --concept-accent-rgb:103,232,249;
        color-scheme:dark;
      }
      html[class*="exercise-concept-"] body {
        background:var(--concept-bg) !important;
        color:var(--concept-text) !important;
      }
      html[class*="exercise-concept-"] body::before {
        background:linear-gradient(180deg,rgba(255,255,255,.012),transparent 24%) !important;
      }
      html[class*="exercise-concept-"] .exercise-concept-bar-v1 {
        position:relative;
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        align-items:center;
        gap:18px;
        margin:0 0 24px;
        padding:16px 18px;
        overflow:hidden;
        border:1px solid var(--concept-line);
        border-radius:16px;
        background:linear-gradient(120deg,rgba(var(--concept-accent-rgb),.075),rgba(255,255,255,.018) 48%,transparent);
      }
      html[class*="exercise-concept-"] .exercise-concept-bar-v1::before {
        content:'';
        position:absolute;
        left:0;
        top:13px;
        bottom:13px;
        width:3px;
        border-radius:0 4px 4px 0;
        background:var(--concept-accent);
        box-shadow:0 0 16px rgba(var(--concept-accent-rgb),.48);
      }
      html[class*="exercise-concept-"] .exercise-concept-eyebrow-v1 {
        color:var(--concept-accent);
        font-size:8px;
        line-height:1;
        font-weight:850;
        letter-spacing:1.4px;
        text-transform:uppercase;
      }
      html[class*="exercise-concept-"] .exercise-concept-title-v1 {
        margin-top:5px;
        color:var(--concept-text);
        font-size:clamp(20px,3vw,28px);
        line-height:1;
        font-weight:880;
        letter-spacing:-.8px;
      }
      html[class*="exercise-concept-"] .exercise-concept-copy-v1 {
        max-width:650px;
        margin-top:7px;
        color:var(--concept-muted);
        font-size:11px;
        line-height:1.45;
      }
      html[class*="exercise-concept-"] .exercise-concept-tabs-v1 {
        display:flex;
        flex-wrap:wrap;
        justify-content:flex-end;
        gap:5px;
      }
      html[class*="exercise-concept-"] .exercise-concept-tabs-v1 a {
        display:inline-flex;
        align-items:center;
        min-height:32px;
        padding:7px 10px;
        border:1px solid var(--concept-line);
        border-radius:999px;
        background:rgba(255,255,255,.022);
        color:var(--concept-muted);
        font-size:8px;
        font-weight:800;
        text-decoration:none;
        white-space:nowrap;
      }
      html[class*="exercise-concept-"] .exercise-concept-tabs-v1 a.active {
        border-color:rgba(var(--concept-accent-rgb),.44);
        background:rgba(var(--concept-accent-rgb),.105);
        color:var(--concept-accent);
      }
      html[class*="exercise-concept-"] #nav-menu [data-exercise-concept-link].active {
        color:var(--concept-accent) !important;
        background:rgba(var(--concept-accent-rgb),.09) !important;
      }
      html[class*="exercise-concept-"] .concept-front-visual-v1 {
        grid-column:1 / -1;
        width:100%;
        min-width:0;
      }
      html[class*="exercise-concept-"] .concept-front-visual-v1 svg {
        display:block;
        width:100%;
        height:42px;
        overflow:visible;
      }

      /* CONCEPT 01 — INTERVAL TRACK */
      html.exercise-concept-interval-track-v1 {
        --concept-bg:#080B11;
        --concept-surface:#0D121B;
        --concept-surface-2:#111925;
        --concept-line:rgba(125,211,252,.17);
        --concept-text:#F8FAFC;
        --concept-muted:#8796AA;
        --concept-accent:#7DD3FC;
        --concept-accent-rgb:125,211,252;
      }
      html.exercise-concept-interval-track-v1 body {
        background:
          linear-gradient(rgba(125,211,252,.026) 1px,transparent 1px),
          linear-gradient(90deg,rgba(125,211,252,.022) 1px,transparent 1px),
          #080B11 !important;
        background-size:32px 32px !important;
      }
      html.exercise-concept-interval-track-v1 .app-header {
        background:linear-gradient(180deg,rgba(8,11,17,.99),rgba(10,18,28,.97)) !important;
        border-bottom-color:rgba(125,211,252,.24) !important;
        box-shadow:0 10px 34px rgba(0,0,0,.32) !important;
      }
      html.exercise-concept-interval-track-v1 .brand-text p,
      html.exercise-concept-interval-track-v1 .section-hdr h2::before {
        color:#7DD3FC !important;
        background:#7DD3FC !important;
      }
      html.exercise-concept-interval-track-v1 :is(.stat-card,.goal-card,.chart-card,.pr-card) {
        border-radius:10px !important;
        border-color:rgba(125,211,252,.14) !important;
        background:linear-gradient(180deg,rgba(17,25,37,.90),rgba(10,15,23,.92)) !important;
        box-shadow:none !important;
      }
      html.exercise-concept-interval-track-v1 .stat-card {
        position:relative;
        overflow:hidden;
        border-top:2px solid #7DD3FC !important;
      }
      html.exercise-concept-interval-track-v1 .stat-card:nth-child(2) { border-top-color:#F59E0B !important; }
      html.exercise-concept-interval-track-v1 .stat-card:nth-child(3) { border-top-color:#EF4444 !important; }
      html.exercise-concept-interval-track-v1 .stat-card:nth-child(4) { border-top-color:#A3E635 !important; }
      html.exercise-concept-interval-track-v1 .week-day {
        border-radius:8px !important;
        background:linear-gradient(90deg,rgba(125,211,252,.035),rgba(255,255,255,.018)) !important;
        border-color:rgba(125,211,252,.13) !important;
        box-shadow:none !important;
      }
      html.exercise-concept-interval-track-v1 .week-day.today {
        border-color:#F59E0B !important;
        background:linear-gradient(90deg,rgba(245,158,11,.14),rgba(125,211,252,.035)) !important;
      }
      html.exercise-concept-interval-track-v1 :is(.btn-sm,.btn-primary,.fab) {
        border-color:rgba(125,211,252,.55) !important;
        background:linear-gradient(110deg,#38BDF8,#0284C7) !important;
        color:#041018 !important;
        box-shadow:0 10px 26px rgba(2,132,199,.16) !important;
      }
      html.exercise-concept-interval-track-v1 .concept-track-front-v1 {
        position:relative;
        height:42px;
        margin-top:11px;
        border-top:1px solid rgba(125,211,252,.20);
        border-bottom:1px solid rgba(125,211,252,.20);
        background:repeating-linear-gradient(90deg,transparent 0 52px,rgba(125,211,252,.12) 52px 53px);
      }
      html.exercise-concept-interval-track-v1 .concept-track-front-v1::before,
      html.exercise-concept-interval-track-v1 .concept-track-front-v1::after {
        content:'';
        position:absolute;
        left:0;
        right:0;
        height:1px;
        background:rgba(125,211,252,.10);
      }
      html.exercise-concept-interval-track-v1 .concept-track-front-v1::before { top:13px; }
      html.exercise-concept-interval-track-v1 .concept-track-front-v1::after { bottom:13px; }
      html.exercise-concept-interval-track-v1 .concept-track-front-v1 span {
        position:absolute;
        top:16px;
        left:5%;
        width:10px;
        height:10px;
        border:2px solid #7DD3FC;
        border-radius:50%;
        background:#E0F2FE;
        box-shadow:0 0 14px rgba(125,211,252,.55);
        animation:conceptTrackRunV1 3.4s cubic-bezier(.4,0,.2,1) infinite alternate;
      }
      @keyframes conceptTrackRunV1 { to { left:calc(95% - 10px); } }

      html.exercise-concept-interval-track-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) {
        --pf-accent:#7DD3FC;
        --pf-soft:#E0F2FE;
        --pf-rgb:125,211,252;
        background:#080B11 !important;
      }
      html.exercise-concept-interval-track-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-shell {
        background:
          linear-gradient(rgba(125,211,252,.025) 1px,transparent 1px),
          linear-gradient(90deg,rgba(125,211,252,.02) 1px,transparent 1px),
          #080B11 !important;
        background-size:34px 34px !important;
      }
      html.exercise-concept-interval-track-v1 #session-modal .pulse-flow-band-v58 { display:none !important; }
      html.exercise-concept-interval-track-v1 #session-modal #session-current-ex {
        color:#F8FAFC !important;
        text-transform:uppercase;
        letter-spacing:-1.2px !important;
      }
      html.exercise-concept-interval-track-v1 #session-modal :is(.timer-val,.stable-detail-value) {
        color:#E0F2FE !important;
        font-variant-numeric:tabular-nums;
      }
      html.exercise-concept-interval-track-v1 #session-modal #session-controls .session-cta.primary {
        border-radius:9px !important;
        border-color:#7DD3FC !important;
        background:linear-gradient(90deg,#38BDF8,#0284C7) !important;
        color:#041018 !important;
      }
      .concept-session-v1 { width:100%;min-width:0; }
      .concept-track-v1 {
        position:relative;
        height:80px;
        overflow:hidden;
        border-top:1px solid rgba(125,211,252,.17);
        border-bottom:1px solid rgba(125,211,252,.17);
        background:repeating-linear-gradient(90deg,transparent 0 58px,rgba(125,211,252,.09) 58px 59px);
      }
      .concept-track-v1::before,
      .concept-track-v1::after {
        content:'';position:absolute;left:0;right:0;height:1px;background:rgba(125,211,252,.11);
      }
      .concept-track-v1::before { top:26px; }
      .concept-track-v1::after { bottom:26px; }
      .concept-track-label-v1 {
        position:absolute;left:7px;top:6px;color:#7DD3FC;font-size:7px;font-weight:850;letter-spacing:1.1px;text-transform:uppercase;
      }
      .concept-track-phase-v1 { color:#94A3B8;margin-left:7px; }
      .concept-track-runner-v1 {
        position:absolute;left:4%;top:35px;width:11px;height:11px;border:2px solid #7DD3FC;border-radius:50%;background:#E0F2FE;
        box-shadow:0 0 15px rgba(125,211,252,.60);animation:conceptSessionTrackV1 2.6s cubic-bezier(.4,0,.2,1) infinite alternate;
      }
      #session-modal.pulse-flow-active-v58 .concept-track-runner-v1 { animation-duration:.86s; }
      #session-modal.pulse-flow-resting-v58 .concept-track-runner-v1 { animation-duration:3.2s; }
      @keyframes conceptSessionTrackV1 { to { left:calc(96% - 11px); } }

      /* CONCEPT 02 — UHD ATHLETE */
      html.exercise-concept-uhd-athlete-v1 {
        --concept-bg:#07090D;
        --concept-surface:#0D1117;
        --concept-surface-2:#111822;
        --concept-line:rgba(190,242,100,.16);
        --concept-text:#F8FAFC;
        --concept-muted:#8290A2;
        --concept-accent:#BEF264;
        --concept-accent-rgb:190,242,100;
      }
      html.exercise-concept-uhd-athlete-v1 body {
        background:
          radial-gradient(900px 440px at 88% -110px,rgba(167,139,250,.09),transparent 68%),
          radial-gradient(740px 380px at 10% 28%,rgba(190,242,100,.045),transparent 72%),
          #07090D !important;
      }
      html.exercise-concept-uhd-athlete-v1 .app-header {
        background:linear-gradient(180deg,rgba(7,9,13,.985),rgba(14,18,24,.965)) !important;
        border-bottom-color:rgba(190,242,100,.20) !important;
        box-shadow:0 12px 38px rgba(0,0,0,.36),0 1px 30px rgba(167,139,250,.055) !important;
      }
      html.exercise-concept-uhd-athlete-v1 .brand-text p { color:#BEF264 !important; }
      html.exercise-concept-uhd-athlete-v1 :is(.stat-card,.goal-card,.chart-card,.pr-card) {
        position:relative;
        overflow:hidden;
        border-color:rgba(190,242,100,.13) !important;
        border-radius:15px !important;
        background:linear-gradient(145deg,rgba(255,255,255,.052),rgba(255,255,255,.018) 58%,rgba(167,139,250,.026)) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 16px 40px rgba(0,0,0,.20) !important;
      }
      html.exercise-concept-uhd-athlete-v1 :is(.stat-card,.goal-card,.chart-card)::after {
        content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 0 65%,rgba(190,242,100,.025));
      }
      html.exercise-concept-uhd-athlete-v1 .stat-label,
      html.exercise-concept-uhd-athlete-v1 .section-hdr h2 {
        letter-spacing:1.05px !important;
        text-transform:uppercase;
      }
      html.exercise-concept-uhd-athlete-v1 .section-hdr h2::before { background:#BEF264 !important;box-shadow:0 0 14px rgba(190,242,100,.46) !important; }
      html.exercise-concept-uhd-athlete-v1 .week-day {
        border-color:rgba(190,242,100,.105) !important;
        background:linear-gradient(145deg,rgba(255,255,255,.038),rgba(167,139,250,.018)) !important;
        box-shadow:none !important;
      }
      html.exercise-concept-uhd-athlete-v1 .week-day.today {
        border-color:rgba(190,242,100,.52) !important;
        background:linear-gradient(145deg,rgba(190,242,100,.12),rgba(167,139,250,.055)) !important;
      }
      html.exercise-concept-uhd-athlete-v1 :is(.btn-sm,.btn-primary,.fab) {
        border-color:rgba(190,242,100,.42) !important;
        background:linear-gradient(110deg,#BEF264,#84CC16) !important;
        color:#0A1004 !important;
        box-shadow:0 12px 32px rgba(132,204,22,.15) !important;
      }
      .concept-hud-front-v1 {
        display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(190,242,100,.12);
      }
      .concept-hud-orbit-v1 {
        position:relative;width:34px;height:34px;border:1px solid rgba(190,242,100,.48);border-radius:50%;box-shadow:0 0 16px rgba(190,242,100,.10);
      }
      .concept-hud-orbit-v1::before { content:'';position:absolute;inset:5px;border:1px dashed rgba(167,139,250,.70);border-radius:50%;animation:conceptOrbitV1 6s linear infinite; }
      .concept-hud-orbit-v1::after { content:'';position:absolute;left:50%;top:50%;width:5px;height:5px;transform:translate(-50%,-50%);border-radius:50%;background:#BEF264;box-shadow:0 0 10px rgba(190,242,100,.7); }
      @keyframes conceptOrbitV1 { to { transform:rotate(360deg); } }
      .concept-hud-line-v1 { height:1px;background:linear-gradient(90deg,rgba(190,242,100,.58),rgba(167,139,250,.40),transparent); }
      .concept-hud-readout-v1 { color:#BEF264;font-size:8px;font-weight:850;letter-spacing:1.2px;text-transform:uppercase; }

      html.exercise-concept-uhd-athlete-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) {
        --pf-accent:#BEF264;
        --pf-soft:#ECFCCB;
        --pf-rgb:190,242,100;
        background:#07090D !important;
      }
      html.exercise-concept-uhd-athlete-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-shell {
        background:
          radial-gradient(700px 360px at 82% -90px,rgba(167,139,250,.10),transparent 68%),
          radial-gradient(620px 360px at 8% 48%,rgba(190,242,100,.04),transparent 72%),
          #07090D !important;
      }
      html.exercise-concept-uhd-athlete-v1 #session-modal .pulse-flow-band-v58 { display:none !important; }
      html.exercise-concept-uhd-athlete-v1 #session-modal #session-current-ex {
        color:#F8FAFC !important;
        text-transform:uppercase;
        letter-spacing:-1.3px !important;
      }
      html.exercise-concept-uhd-athlete-v1 #session-modal #session-stable-details {
        border-color:rgba(190,242,100,.14) !important;
        background:linear-gradient(90deg,rgba(190,242,100,.025),rgba(167,139,250,.03),transparent) !important;
      }
      html.exercise-concept-uhd-athlete-v1 #session-modal #session-controls .session-cta.primary {
        border-color:#BEF264 !important;
        background:linear-gradient(110deg,#BEF264,#84CC16) !important;
        color:#071003 !important;
        box-shadow:0 12px 34px rgba(132,204,22,.17) !important;
      }
      .concept-hud-v1 {
        display:grid;grid-template-columns:96px minmax(0,1fr);align-items:center;gap:18px;padding:6px 0 10px;border-top:1px solid rgba(190,242,100,.10);border-bottom:1px solid rgba(190,242,100,.10);
      }
      .concept-hud-ring-v1 {
        position:relative;width:82px;height:82px;margin:auto;border:1px solid rgba(190,242,100,.50);border-radius:50%;box-shadow:0 0 28px rgba(190,242,100,.08),inset 0 0 24px rgba(167,139,250,.035);
      }
      .concept-hud-ring-v1::before { content:'';position:absolute;inset:9px;border:1px dashed rgba(167,139,250,.72);border-radius:50%;animation:conceptOrbitV1 5s linear infinite; }
      .concept-hud-ring-v1::after { content:'';position:absolute;inset:28px;border-radius:50%;background:#BEF264;box-shadow:0 0 18px rgba(190,242,100,.52); }
      .concept-hud-data-v1 { display:grid;gap:9px; }
      .concept-hud-data-v1 > div { display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:7px;border-bottom:1px solid rgba(148,163,184,.10); }
      .concept-hud-data-v1 span { color:#718096;font-size:7px;font-weight:800;letter-spacing:1px;text-transform:uppercase; }
      .concept-hud-data-v1 b { color:#ECFCCB;font-size:10px;letter-spacing:.4px; }
      .concept-hud-data-v1 [data-concept-phase] { color:#BEF264; }

      /* CONCEPT 03 — PULSE FLOW ACROSS THE FRONT PAGE */
      html.exercise-concept-pulse-home-v1 {
        --concept-bg:#080D14;
        --concept-surface:#0B121A;
        --concept-surface-2:#0E1721;
        --concept-line:rgba(103,232,249,.12);
        --concept-text:#F1F5F9;
        --concept-muted:#788699;
        --concept-accent:#67E8F9;
        --concept-accent-rgb:103,232,249;
      }
      html.exercise-concept-pulse-home-v1 body {
        background:
          radial-gradient(800px 340px at 50% -80px,rgba(103,232,249,.075),transparent 68%),
          radial-gradient(560px 300px at 92% 46%,rgba(251,146,60,.026),transparent 72%),
          #080D14 !important;
      }
      html.exercise-concept-pulse-home-v1 .app-header {
        background:rgba(8,13,20,.91) !important;
        border-bottom-color:rgba(103,232,249,.13) !important;
        box-shadow:0 9px 32px rgba(0,0,0,.22) !important;
      }
      html.exercise-concept-pulse-home-v1 .brand-text p { color:#67E8F9 !important; }
      html.exercise-concept-pulse-home-v1 :is(.stat-card,.goal-card,.chart-card,.pr-card) {
        border-radius:14px !important;
        border-color:rgba(103,232,249,.105) !important;
        background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.014)) !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 .stat-card {
        border-top:0 !important;
        border-bottom-color:rgba(103,232,249,.17) !important;
      }
      html.exercise-concept-pulse-home-v1 .stat-card:nth-child(1) .stat-val { color:#FED7AA !important; }
      html.exercise-concept-pulse-home-v1 .stat-card:nth-child(2) .stat-val { color:#CFFAFE !important; }
      html.exercise-concept-pulse-home-v1 .stat-card:nth-child(3) .stat-val { color:#FCA5A5 !important; }
      html.exercise-concept-pulse-home-v1 .stat-card:nth-child(4) .stat-val { color:#A7F3D0 !important; }
      html.exercise-concept-pulse-home-v1 .section-hdr h2::before { background:#67E8F9 !important;box-shadow:0 0 12px rgba(103,232,249,.42) !important; }
      html.exercise-concept-pulse-home-v1 .week-day {
        border-radius:12px !important;
        border-color:rgba(148,163,184,.105) !important;
        background:#0C131C !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 .week-day.today {
        border-color:#FB923C !important;
        background:linear-gradient(180deg,rgba(251,146,60,.12),rgba(12,19,28,.96)) !important;
      }
      html.exercise-concept-pulse-home-v1 :is(.btn-sm,.btn-primary) {
        border-radius:999px !important;
        border-color:rgba(103,232,249,.25) !important;
        background:rgba(103,232,249,.055) !important;
        color:#CFFAFE !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 .fab {
        border-color:rgba(251,146,60,.75) !important;
        background:linear-gradient(115deg,#FB923C,#F97316) !important;
        color:#120A04 !important;
        box-shadow:0 12px 32px rgba(249,115,22,.16) !important;
      }
      html.exercise-concept-pulse-home-v1 .log-tag.cardio,
      html.exercise-concept-pulse-home-v1 .log-tag.is-cardio {
        color:#FCA5A5 !important;border-color:rgba(239,68,68,.50) !important;background:rgba(239,68,68,.09) !important;
      }
      .concept-pulse-front-v1 {
        position:relative;height:47px;margin-top:8px;overflow:hidden;border-top:1px solid rgba(103,232,249,.09);border-bottom:1px solid rgba(103,232,249,.09);
        color:#67E8F9;background:linear-gradient(90deg,transparent,rgba(103,232,249,.035),transparent);
      }
      .concept-pulse-front-v1 svg { position:absolute;inset:1px 0 0;width:100%;height:45px !important; }
      .concept-pulse-front-v1 path { fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;stroke-dasharray:120 480;animation:conceptPulseSweepV1 2.2s linear infinite; }
      @keyframes conceptPulseSweepV1 { to { stroke-dashoffset:-600; } }

      @media(max-width:760px) {
        html[class*="exercise-concept-"] .exercise-concept-bar-v1 { grid-template-columns:1fr;gap:11px;margin-bottom:18px;padding:14px 13px; }
        html[class*="exercise-concept-"] .exercise-concept-tabs-v1 { justify-content:flex-start;overflow-x:auto;flex-wrap:nowrap;padding-bottom:1px;scrollbar-width:none; }
        html[class*="exercise-concept-"] .exercise-concept-tabs-v1::-webkit-scrollbar { display:none; }
        html[class*="exercise-concept-"] .exercise-concept-tabs-v1 a { min-height:30px;padding:6px 9px; }
        html.exercise-concept-interval-track-v1 .stat-card { border-top-width:1px !important; }
        .concept-hud-v1 { grid-template-columns:78px minmax(0,1fr);gap:10px; }
        .concept-hud-ring-v1 { width:68px;height:68px; }
        .concept-hud-ring-v1::after { inset:23px; }
      }
      @media(max-width:390px) {
        html[class*="exercise-concept-"] .exercise-concept-copy-v1 { font-size:10px; }
        .concept-track-v1 { height:68px; }
        .concept-track-v1::before { top:22px; }
        .concept-track-v1::after { bottom:22px; }
        .concept-track-runner-v1 { top:28px; }
      }
      @media(prefers-reduced-motion:reduce) {
        .concept-track-front-v1 span,.concept-track-runner-v1,.concept-hud-orbit-v1::before,.concept-hud-ring-v1::before,.concept-pulse-front-v1 path { animation:none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function conceptHref(name) {
    var params = new URLSearchParams();
    params.set('concept',name);
    var user = new URLSearchParams(window.location.search).get('user');
    if (user) params.set('user',user);
    return 'exercise.html?' + params.toString();
  }

  function standardHref() {
    var user = new URLSearchParams(window.location.search).get('user');
    return user ? 'exercise.html?user=' + encodeURIComponent(user) : 'exercise.html';
  }

  function frontVisual() {
    if (concept === 'interval-track') {
      return '<div class="concept-front-visual-v1 concept-track-front-v1" aria-hidden="true"><span></span></div>';
    }
    if (concept === 'uhd-athlete') {
      return '<div class="concept-front-visual-v1 concept-hud-front-v1" aria-hidden="true">' +
        '<i class="concept-hud-orbit-v1"></i><i class="concept-hud-line-v1"></i><b class="concept-hud-readout-v1">Signal klar · Live data</b></div>';
    }
    return '<div class="concept-front-visual-v1 concept-pulse-front-v1" aria-hidden="true">' +
      '<svg viewBox="0 0 600 54" preserveAspectRatio="none"><path pathLength="600" d="M0 29 H68 L77 22 L86 36 L95 29 H145 L156 8 L169 48 L182 29 H250 L259 22 L268 36 L277 29 H327 L338 8 L351 48 L364 29 H432 L441 22 L450 36 L459 29 H509 L520 8 L533 48 L546 29 H600"></path></svg></div>';
  }

  function ensureConceptBar() {
    var main = document.querySelector('.main-content');
    if (!main || document.getElementById('exercise-concept-bar-v1')) return;
    var meta = concepts[concept];
    var bar = document.createElement('section');
    bar.id = 'exercise-concept-bar-v1';
    bar.className = 'exercise-concept-bar-v1';
    bar.setAttribute('aria-label','Träningsdesign ' + meta.title);
    bar.innerHTML = '<div><div class="exercise-concept-eyebrow-v1">' + meta.eyebrow + '</div>' +
      '<div class="exercise-concept-title-v1">' + meta.title + '</div>' +
      '<div class="exercise-concept-copy-v1">' + meta.copy + '</div></div>' +
      '<nav class="exercise-concept-tabs-v1" aria-label="Jämför träningsdesigner">' +
        '<a href="' + standardHref() + '">Standard</a>' +
        '<a href="' + conceptHref('interval-track') + '" data-concept-tab="interval-track">Interval Track</a>' +
        '<a href="' + conceptHref('uhd-athlete') + '" data-concept-tab="uhd-athlete">UHD Athlete</a>' +
        '<a href="' + conceptHref('pulse-home') + '" data-concept-tab="pulse-home">Pulse Flow</a>' +
      '</nav>' + frontVisual();
    var active = bar.querySelector('[data-concept-tab="' + concept + '"]');
    if (active) active.classList.add('active');
    main.insertBefore(bar,main.firstChild);
  }

  function syncMenu() {
    document.querySelectorAll('[data-exercise-concept-link]').forEach(function (link) {
      var name = link.getAttribute('data-exercise-concept-link');
      link.href = conceptHref(name);
      link.classList.toggle('active',name === concept);
      if (name === concept) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
  }

  function phaseText(modal) {
    if (!modal) return 'Redo';
    if (modal.classList.contains('pulse-flow-complete-v58')) return 'Pass klart';
    if (modal.classList.contains('pulse-flow-resting-v58')) return 'Återhämtning';
    if (modal.classList.contains('pulse-flow-starting-v58')) return 'Startsekvens';
    if (modal.classList.contains('pulse-flow-active-v58')) return 'Aktivt moment';
    return 'Redo';
  }

  function sessionVisualMarkup() {
    if (concept === 'interval-track') {
      return '<div class="concept-track-v1"><div class="concept-track-label-v1">Intervallspår <span class="concept-track-phase-v1" data-concept-phase>Redo</span></div><i class="concept-track-runner-v1"></i></div>';
    }
    if (concept === 'uhd-athlete') {
      return '<div class="concept-hud-v1"><div class="concept-hud-ring-v1" aria-hidden="true"></div><div class="concept-hud-data-v1">' +
        '<div><span>Status</span><b data-concept-phase>Redo</b></div><div><span>Signal</span><b>Live</b></div><div><span>Fokus</span><b>Nuvarande moment</b></div></div></div>';
    }
    return '';
  }

  function syncSessionVisual() {
    if (concept === 'pulse-home') return;
    var modal = document.getElementById('session-modal');
    var pulse = document.getElementById('pulse-flow-live-v58');
    var target = pulse || document.getElementById('session-current-target');
    if (!modal || !target || !target.parentNode) return;
    var visual = document.getElementById('exercise-concept-session-v1');
    if (!visual) {
      visual = document.createElement('div');
      visual.id = 'exercise-concept-session-v1';
      visual.className = 'concept-session-v1';
      visual.innerHTML = sessionVisualMarkup();
      target.insertAdjacentElement('afterend',visual);
    }
    var phase = phaseText(modal);
    visual.querySelectorAll('[data-concept-phase]').forEach(function (node) {
      if (node.textContent !== phase) node.textContent = phase;
    });
  }

  function observeSession() {
    var modal = document.getElementById('session-modal');
    if (!modal || modalObserver) return;
    modalObserver = new MutationObserver(syncSessionVisual);
    modalObserver.observe(modal,{attributes:true,attributeFilter:['class']});
  }

  function reveal() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.remove('exercise-concept-booting-v1');
        root.classList.add('exercise-concept-ready-v1');
      });
    });
    setTimeout(function () {
      root.classList.remove('exercise-concept-booting-v1');
      root.classList.add('exercise-concept-ready-v1');
    },450);
  }

  function install() {
    addStyles();
    root.classList.add('exercise-concept-' + concept + '-v1');
    document.title = concepts[concept].title + ' · Träning';
    ensureConceptBar();
    syncMenu();
    syncSessionVisual();
    observeSession();
    reveal();
    window.addEventListener('pageshow',function () {
      ensureConceptBar();
      syncMenu();
      syncSessionVisual();
      reveal();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
