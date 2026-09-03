(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function addStyles() {
    var existing = document.getElementById('exercise-log-mobile-fix-v5-style');
    if (existing) existing.remove();
    var style = document.createElement('style');
    style.id = 'exercise-log-mobile-fix-v5-style';
    style.textContent = `
      /* Träningsloggen är en platt tabell. Det finns bara linjer mellan
         dataposterna; redigering sker i den befintliga modalytan. */
      .log-wrap {
        overflow-x:hidden !important;
        padding:0 !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }
      .log-table {
        width:100% !important;
        table-layout:fixed !important;
        border-collapse:collapse !important;
        border-top:1px solid rgba(148,163,184,.16) !important;
        border-bottom:1px solid rgba(148,163,184,.16) !important;
      }
      .log-table th {
        height:34px !important;
        padding:7px 10px !important;
        border-bottom:1px solid rgba(148,163,184,.18) !important;
        background:transparent !important;
        color:#7F8A99 !important;
        font-size:9px !important;
        letter-spacing:.72px !important;
      }
      .log-table td { box-sizing:border-box !important; }
      .log-table tbody .log-main-row td {
        height:50px !important;
        padding:8px 10px !important;
        border-bottom:1px solid rgba(148,163,184,.13) !important;
        background:transparent !important;
        background-clip:padding-box !important;
        transition:background .18s ease,color .18s ease !important;
      }
      .log-table tbody .log-main-row[aria-expanded="true"] td,
      .log-table tbody .log-main-row:hover td {
        background:rgba(34,211,238,.032) !important;
      }
      .log-table tbody .log-main-row.log-pass-cardio-v7[aria-expanded="true"] td,
      .log-table tbody .log-main-row.log-pass-cardio-v7:hover td {
        background:rgba(239,68,68,.035) !important;
      }
      .log-table td.log-actions {
        display:table-cell !important;
        text-align:center !important;
        vertical-align:middle !important;
      }
      .log-del {
        display:inline-grid !important;
        place-items:center !important;
        width:28px !important;
        height:28px !important;
        margin:0 auto !important;
        padding:0 !important;
        border:0 !important;
        border-radius:50% !important;
        background:transparent !important;
        color:#657181 !important;
        font-size:20px !important;
        line-height:1 !important;
        box-shadow:none !important;
      }
      .log-del:hover { color:#F87171 !important;background:rgba(248,113,113,.08) !important; }
      .log-tag {
        min-height:25px !important;
        max-width:100% !important;
        padding:3px 8px !important;
        border:1px solid rgba(34,211,238,.34) !important;
        border-radius:999px !important;
        background:rgba(34,211,238,.065) !important;
        color:#22D3EE !important;
        box-shadow:none !important;
        line-height:1.1 !important;
        text-align:center !important;
        justify-content:center !important;
      }
      .log-main-row.log-pass-cardio-v7 .log-tag {
        border-color:rgba(248,113,113,.48) !important;
        background:rgba(239,68,68,.095) !important;
        color:#F87171 !important;
      }

      .log-detail > td {
        padding:0 !important;
        border:0 !important;
        background:transparent !important;
      }
      .log-detail-box {
        margin:0 !important;
        padding:10px 11px 12px !important;
        overflow:hidden !important;
        color:var(--text-sec) !important;
        background:linear-gradient(180deg,rgba(34,211,238,.025),rgba(7,12,18,.08)) !important;
        border-bottom:1px solid rgba(148,163,184,.19) !important;
        box-shadow:none !important;
        transform-origin:50% 0;
      }
      .log-main-row.log-pass-cardio-v7 + .log-detail .log-detail-box {
        background:linear-gradient(180deg,rgba(239,68,68,.026),rgba(7,12,18,.08)) !important;
      }
      .log-detail.show .log-detail-box {
        animation:exercise-log-detail-in-v7 .34s cubic-bezier(.22,1,.36,1) both;
      }
      @keyframes exercise-log-detail-in-v7 {
        from { opacity:0;transform:scale(.985) translateY(-6px);filter:blur(1.5px); }
        to { opacity:1;transform:none;filter:none; }
      }
      .log-detail-head-v7 {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        min-width:0;
        padding:1px 2px 9px;
      }
      .log-detail-head-v7 > div { min-width:0;display:grid;gap:2px;text-align:left; }
      .log-detail-head-v7 strong {
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        color:#E8EDF4;
        font-size:12px;
        line-height:1.2;
      }
      .log-detail-head-v7 span { color:#7F8A99;font-size:9px;line-height:1.25; }
      .log-edit-pass-v7 {
        flex:none;
        min-height:30px;
        padding:6px 10px;
        border:1px solid rgba(34,211,238,.28);
        border-radius:8px;
        background:rgba(34,211,238,.06);
        color:#67E8F9;
        font:750 9px/1 'Inter',sans-serif;
        cursor:pointer;
      }
      .log-main-row.log-pass-cardio-v7 + .log-detail .log-edit-pass-v7 {
        border-color:rgba(248,113,113,.32);
        background:rgba(239,68,68,.065);
        color:#FCA5A5;
      }

      .log-ex-table-v7 {
        width:100%;
        border-top:1px solid rgba(148,163,184,.15);
        border-bottom:1px solid rgba(148,163,184,.15);
      }
      .log-ex-head-v7,
      .log-ex-row-v7 {
        display:grid;
        grid-template-columns:23px minmax(0,1.22fr) minmax(80px,.9fr) 43px 10px;
        gap:7px;
        align-items:center;
        width:100%;
        min-width:0;
      }
      .log-ex-head-v7 {
        min-height:26px;
        padding:4px 5px;
        color:#667383;
        font-size:8px;
        font-weight:800;
        line-height:1;
        letter-spacing:.58px;
        text-transform:uppercase;
      }
      .log-ex-row-v7 {
        position:relative;
        min-height:43px;
        padding:7px 5px;
        border:0;
        border-top:1px solid rgba(148,163,184,.105);
        border-radius:0;
        background:transparent;
        color:#DCE4EE;
        text-align:left;
        cursor:pointer;
        -webkit-tap-highlight-color:transparent;
        transition:background .18s ease,transform .16s cubic-bezier(.22,1,.36,1),color .18s ease;
      }
      .log-ex-row-v7:hover { background:rgba(34,211,238,.035); }
      .log-ex-row-v7.is-cardio:hover { background:rgba(239,68,68,.042); }
      .log-ex-row-v7:active { transform:scale(.992); }
      .log-ex-index-v7 {
        color:#667383;
        font-size:9px;
        font-weight:800;
        text-align:center;
      }
      .log-ex-name-v7 {
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        color:#E7EDF5;
        font-size:11px;
        line-height:1.2;
      }
      .log-ex-target-v7,
      .log-ex-time-v7 {
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        color:#8996A6;
        font-size:9px;
        line-height:1.2;
      }
      .log-ex-time-v7 { text-align:right;font-variant-numeric:tabular-nums; }
      .log-ex-chevron-v7 { color:#536071;font-size:15px;line-height:1;text-align:right; }
      .log-ex-row-v7.is-cardio .log-ex-index-v7,
      .log-ex-row-v7.is-cardio .log-ex-name-v7,
      .log-ex-row-v7.is-cardio .log-ex-time-v7 {
        color:#F87171;
      }
      .log-ex-row-v7.is-cardio .log-ex-target-v7 { color:#D99A9A; }
      .log-ex-empty-v7 {
        width:100%;
        min-height:42px;
        border:0;
        border-top:1px solid rgba(148,163,184,.105);
        background:transparent;
        color:#738092;
        font:600 10px/1.3 'Inter',sans-serif;
        text-align:left;
        cursor:pointer;
      }
      .log-note-v7 {
        margin:9px 2px 0;
        color:#778496;
        font-size:9px;
        line-height:1.45;
      }

      /* Tid per övning redigeras i samma rad i popupen. */
      #wk-modal .ex-duration-editor-v7 {
        display:grid;
        grid-template-columns:auto 72px 20px;
        align-items:center;
        justify-content:end;
        gap:5px;
        margin-top:1px;
        color:#7F8A99;
        font-size:9px;
        font-weight:700;
      }
      #wk-modal .ex-duration-editor-v7 input {
        width:72px;
        min-width:0;
        height:29px;
        padding:4px 7px;
        border:1px solid rgba(148,163,184,.17);
        border-radius:7px;
        background:#171E27;
        color:#DCE4EE;
        font-size:10px;
        box-shadow:none;
      }
      #wk-modal .ex-duration-editor-v7 small {
        color:#657181;
        font-size:8px;
        font-weight:700;
      }
      #wk-modal .exercise-edit-focus-v7 {
        animation:exercise-edit-focus-v7 1.05s cubic-bezier(.22,1,.36,1);
      }
      @keyframes exercise-edit-focus-v7 {
        0% { background:rgba(34,211,238,.18);box-shadow:0 0 0 2px rgba(34,211,238,.35),0 0 28px rgba(34,211,238,.12); }
        100% { background:transparent;box-shadow:0 0 0 0 transparent; }
      }
      body.exercise-log-detail-open-v7 > .fab,
      body.exercise-log-detail-open-v7 .app-wrap + .fab {
        opacity:0 !important;
        pointer-events:none !important;
        transform:scale(.78) !important;
      }

      @media(max-width:600px) {
        .log-table tbody .log-main-row td {
          padding:7px 6px !important;
          font-size:11px !important;
        }
        .log-table td.log-actions {
          padding-left:1px !important;
          padding-right:1px !important;
          overflow:hidden !important;
        }
        .log-detail-box { padding:9px 7px 11px !important; }
        .log-ex-head-v7,
        .log-ex-row-v7 {
          grid-template-columns:20px minmax(0,1.18fr) minmax(68px,.88fr) 39px 8px;
          gap:5px;
        }
      }
      @media(max-width:430px) {
        .log-table th:nth-child(1),.log-table td:nth-child(1){width:14% !important;}
        .log-table th:nth-child(2),.log-table td:nth-child(2){width:25% !important;}
        .log-table th:nth-child(3),.log-table td:nth-child(3){width:20% !important;}
        .log-table th:nth-child(4),.log-table td:nth-child(4){width:15% !important;}
        .log-table th:nth-child(5),.log-table td:nth-child(5){width:18% !important;}
        .log-table th:nth-child(6),.log-table td:nth-child(6){width:8% !important;}
        .log-tag { padding:3px 5px !important;font-size:9px !important;white-space:normal !important; }
        .log-detail-head-v7 { padding-left:3px;padding-right:3px; }
        .log-detail-head-v7 span { max-width:220px; }
        .log-ex-target-v7 { font-size:8px; }
      }
      @media(prefers-reduced-motion:reduce) {
        .log-detail.show .log-detail-box,.log-ex-row-v7,#wk-modal .exercise-edit-focus-v7 { animation-duration:.001s !important;transition-duration:.001s !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function renameHeading() {
    document.querySelectorAll('.section-hdr h2').forEach(function (heading) {
      if (String(heading.textContent || '').trim() === 'Träningslog') heading.textContent = 'Träningslogg';
    });
  }

  function install() {
    addStyles();
    renameHeading();
    window.addEventListener('firebase-sync',renameHeading);
    window.__exerciseLogTableV7 = {refreshHeading:renameHeading};
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
