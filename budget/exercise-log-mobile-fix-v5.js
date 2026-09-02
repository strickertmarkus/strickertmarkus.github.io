(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function addStyles() {
    var existing = document.getElementById('exercise-log-mobile-fix-v5-style');
    if (existing) existing.remove();
    var style = document.createElement('style');
    style.id = 'exercise-log-mobile-fix-v5-style';
    style.textContent = `
      /* One compact, flat visual authority for the editable workout log. */
      .log-wrap {
        overflow-x:hidden !important;
        padding:0 !important;
        border:1px solid rgba(148,163,184,.16) !important;
        border-radius:12px !important;
        background:#121821 !important;
        box-shadow:none !important;
      }
      .log-table {
        width:100% !important;
        table-layout:fixed !important;
        border-collapse:collapse !important;
      }
      .log-table th {
        padding:8px 10px !important;
        background:rgba(255,255,255,.018) !important;
        border-bottom:1px solid rgba(148,163,184,.18) !important;
        font-size:9px !important;
        letter-spacing:.7px !important;
      }
      .log-table td {
        box-sizing:border-box !important;
      }
      .log-table tbody .log-main-row td {
        height:52px !important;
        padding:8px 10px !important;
        border-bottom:1px solid rgba(148,163,184,.16) !important;
        background:transparent !important;
        background-clip:padding-box !important;
      }
      .log-table tbody .log-main-row:hover td {
        background:rgba(34,211,238,.035) !important;
      }
      .log-table td.log-actions {
        display:table-cell !important;
        text-align:center !important;
        vertical-align:middle !important;
      }
      .log-table td.log-actions .log-del {
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        width:28px !important;
        height:30px !important;
        margin:0 auto !important;
        padding:0 !important;
        border-radius:7px !important;
      }
      .log-table td:nth-child(5) { white-space:nowrap; }
      .log-tag {
        min-height:27px !important;
        padding:3px 9px !important;
        border-radius:9px !important;
        line-height:1.12 !important;
        text-align:center !important;
        justify-content:center !important;
        background:rgba(34,211,238,.08) !important;
        border-color:rgba(34,211,238,.42) !important;
        color:#22D3EE !important;
        box-shadow:none !important;
      }
      .log-main-row.log-pass-cardio-v6 .log-tag {
        background:rgba(248,113,113,.10) !important;
        border-color:rgba(248,113,113,.48) !important;
        color:#F87171 !important;
      }

      .log-detail > td {
        padding:0 !important;
        border:0 !important;
        background:transparent !important;
      }
      .log-detail-box {
        margin:0 !important;
        padding:10px !important;
        overflow-x:hidden !important;
        color:var(--text-sec) !important;
        line-height:1.3 !important;
        background:linear-gradient(180deg,rgba(34,211,238,.018),rgba(255,255,255,.008)) !important;
        border-bottom:1px solid rgba(148,163,184,.18) !important;
        box-shadow:none !important;
      }
      .log-detail-box .form-row,
      .log-detail-box .log-detail-row {
        grid-template-columns:repeat(2,minmax(0,1fr)) !important;
        gap:6px !important;
      }
      .log-detail-box .form-group {
        min-width:0 !important;
        margin-bottom:6px !important;
      }
      .log-detail-box .form-group label {
        margin-bottom:3px !important;
        color:#8893A2 !important;
        font-size:9px !important;
        line-height:1.15 !important;
        letter-spacing:.48px !important;
        white-space:normal !important;
      }
      .log-detail-box .form-group input,
      .log-detail-box .form-group select,
      .log-detail-box .form-group textarea {
        min-width:0 !important;
        height:36px !important;
        padding:6px 9px !important;
        border:1px solid rgba(148,163,184,.18) !important;
        border-radius:9px !important;
        background:#1A202A !important;
        color:#E8EDF4 !important;
        font-size:12px !important;
        box-shadow:none !important;
      }
      .log-detail-box .form-group input:focus,
      .log-detail-box .form-group select:focus,
      .log-detail-box .form-group textarea:focus {
        border-color:rgba(34,211,238,.55) !important;
        box-shadow:0 0 0 2px rgba(34,211,238,.08) !important;
      }
      .log-detail-box .form-group input[readonly] {
        color:#A8B1BF !important;
        background:#151B24 !important;
      }
      .log-detail-box .form-group textarea {
        height:46px !important;
        min-height:46px !important;
        resize:vertical !important;
      }
      .log-detail-box .hr-log-triple-v4,
      .log-detail-box .hr-triple-row-v3 {
        grid-template-columns:repeat(3,minmax(0,1fr)) !important;
        gap:5px !important;
        margin:0 0 6px !important;
      }
      .log-detail-box .hr-log-triple-v4 .form-group,
      .log-detail-box .hr-triple-row-v3 .form-group {
        margin-bottom:0 !important;
      }

      .log-detail-box .ex-list {
        gap:6px !important;
        margin:5px 0 7px !important;
      }
      .log-detail-box .inline-ex-row {
        gap:0 !important;
        margin:0 !important;
        padding:7px !important;
        border:1px solid rgba(148,163,184,.14) !important;
        border-radius:10px !important;
        background:rgba(255,255,255,.018) !important;
      }
      .log-detail-box .inline-ex-row.is-cardio {
        border-color:rgba(248,113,113,.18) !important;
        background:rgba(248,113,113,.018) !important;
      }
      .log-detail-box .ex-row-head {
        min-height:22px !important;
        margin:0 0 4px !important;
        gap:4px !important;
      }
      .log-detail-box .ex-kind-btn {
        min-height:22px !important;
        padding:2px 8px !important;
        border-radius:7px !important;
        font-size:9px !important;
        line-height:1 !important;
      }
      .log-detail-box .inline-ex-row.is-cardio .ex-kind-btn.active {
        border-color:rgba(248,113,113,.42) !important;
        background:rgba(248,113,113,.10) !important;
        color:#F87171 !important;
      }
      .log-detail-box .ex-row {
        grid-template-columns:minmax(0,1fr) 43px 43px 49px 23px !important;
        gap:4px !important;
        align-items:center !important;
      }
      .log-detail-box .ex-row-item.is-cardio .ex-row {
        grid-template-columns:minmax(0,1fr) 62px 52px 23px !important;
      }
      .log-detail-box .ex-row input {
        width:100% !important;
        height:34px !important;
        min-width:0 !important;
        padding:5px 7px !important;
        border-radius:8px !important;
        font-size:11px !important;
      }
      .log-detail-box .ex-del {
        width:23px !important;
        height:30px !important;
        padding:0 !important;
        font-size:13px !important;
      }
      .log-detail-box .btn-sm {
        min-height:34px !important;
        padding:6px 11px !important;
        border-radius:9px !important;
        font-size:11px !important;
      }
      .exercise-timing-group-v6 {
        margin-top:8px !important;
        padding-top:7px !important;
        border-top:1px solid rgba(148,163,184,.12) !important;
      }
      .exercise-timing-list-v6 {
        display:flex !important;
        flex-wrap:wrap !important;
        gap:5px !important;
      }
      .exercise-timing-item-v6 {
        padding:4px 7px !important;
        border:1px solid rgba(148,163,184,.14) !important;
        border-radius:7px !important;
        background:rgba(255,255,255,.018) !important;
        color:#9AA5B4 !important;
        font-size:10px !important;
        line-height:1.2 !important;
      }
      .log-detail-box .modal-footer {
        margin-top:8px !important;
        padding-top:8px !important;
        border-top:1px solid rgba(148,163,184,.12) !important;
      }
      .log-detail-box .modal-footer .btn-primary {
        min-height:38px !important;
        padding:7px 14px !important;
        border-radius:9px !important;
        box-shadow:none !important;
      }
      body.exercise-log-detail-open-v6 > .fab,
      body.exercise-log-detail-open-v6 .app-wrap + .fab {
        opacity:0 !important;
        pointer-events:none !important;
        transform:scale(.78) !important;
      }

      @media (max-width:600px) {
        .log-table tbody .log-main-row td {
          padding:7px 6px !important;
          font-size:11px !important;
        }
        .log-table td.log-actions {
          padding-left:1px !important;
          padding-right:1px !important;
          overflow:hidden !important;
        }
      }
      @media (max-width:430px) {
        .log-table th:nth-child(1), .log-table td:nth-child(1) { width:14% !important; }
        .log-table th:nth-child(2), .log-table td:nth-child(2) { width:24% !important; }
        .log-table th:nth-child(3), .log-table td:nth-child(3) { width:20% !important; }
        .log-table th:nth-child(4), .log-table td:nth-child(4) { width:15% !important; }
        .log-table th:nth-child(5), .log-table td:nth-child(5) { width:19% !important; }
        .log-table th:nth-child(6), .log-table td:nth-child(6) { width:8% !important; }
        .log-table th:nth-child(5), .log-table td:nth-child(5) {
          padding-left:4px !important;
          padding-right:2px !important;
        }
        .log-table th:nth-child(6) {
          padding-left:0 !important;
          padding-right:0 !important;
        }
        .log-tag {
          padding-left:5px !important;
          padding-right:5px !important;
          font-size:9px !important;
          white-space:normal !important;
        }
        .log-detail-box { padding:8px !important; }
        .log-detail-box .form-group input,
        .log-detail-box .form-group select,
        .log-detail-box .form-group textarea { font-size:11px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeLabel(value) {
    return String(value || '').trim().toLocaleLowerCase('sv-SE');
  }

  function isCardioTitle(value) {
    return /^(kondition|cardio|löpning|löpband|cykling|rodd|intervaller?|promenad)$/.test(normalizeLabel(value));
  }

  function decorateLog() {
    document.querySelectorAll('.log-main-row').forEach(function (row) {
      var tag = row.querySelector('.log-tag');
      row.classList.toggle('log-pass-cardio-v6',!!(tag && isCardioTitle(tag.textContent)));
    });

    document.querySelectorAll('.log-detail-box .form-group').forEach(function (group) {
      var label = group.querySelector(':scope > label');
      if (!label || normalizeLabel(label.textContent) !== 'tid per övning') return;
      group.classList.add('exercise-timing-group-v6');
      var list = label.nextElementSibling;
      if (!list) return;
      list.classList.add('exercise-timing-list-v6');
      Array.from(list.children).forEach(function (item) {
        item.classList.add('exercise-timing-item-v6');
        item.removeAttribute('style');
      });
      list.removeAttribute('style');
    });

    document.body.classList.toggle('exercise-log-detail-open-v6',!!document.querySelector('.log-detail.show'));
  }

  function renameHeading() {
    document.querySelectorAll('.section-hdr h2').forEach(function (heading) {
      if (String(heading.textContent || '').trim() === 'Träningslog') heading.textContent = 'Träningslogg';
    });
  }

  function install() {
    addStyles();
    renameHeading();
    decorateLog();

    var body = document.getElementById('log-body');
    if (body) {
      new MutationObserver(function () { decorateLog(); }).observe(body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }
    document.addEventListener('click',function (event) {
      if (event.target && event.target.closest && event.target.closest('.log-main-row')) setTimeout(decorateLog,0);
    },false);
    window.addEventListener('firebase-sync',function () { setTimeout(decorateLog,0); });
    window.__exerciseLogCompactV6 = { sync:decorateLog };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
