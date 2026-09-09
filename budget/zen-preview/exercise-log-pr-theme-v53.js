(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseLogPrThemeV53Installed) return;
  window.__exerciseLogPrThemeV53Installed = true;

  if (document.getElementById('exercise-log-pr-theme-v53-style')) return;

  var style = document.createElement('style');
  style.id = 'exercise-log-pr-theme-v53-style';
  style.textContent = `
    /* PR table: open, flat table language matching Träningslogg. */
    #pr-grid.records-log-wrap-v52 {
      margin-top:10px!important;
      background:transparent!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
    }

    .records-log-table-v52 {
      background:transparent!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      overflow:visible!important;
    }

    .records-columns-v52 {
      min-height:42px!important;
      padding-left:12px!important;
      padding-right:12px!important;
      background:transparent!important;
      border-top:1px solid rgba(148,163,184,.25)!important;
      border-bottom:1px solid rgba(148,163,184,.28)!important;
      color:#778395!important;
      font-size:9px!important;
      font-weight:850!important;
      letter-spacing:.115em!important;
      text-transform:uppercase!important;
    }

    .record-group-v52 {
      --record-accent:#38BDF8;
      --record-accent-rgb:56,189,248;
      margin:0!important;
      background:transparent!important;
      border:0!important;
      border-bottom:1px solid rgba(148,163,184,.22)!important;
      border-radius:0!important;
      box-shadow:none!important;
    }

    .record-group-v52[data-record-category="Övrigt"] {
      --record-accent:#F87171;
      --record-accent-rgb:248,113,113;
    }

    .record-group-toggle-v52 {
      width:100%!important;
      min-height:43px!important;
      padding:0 12px!important;
      border:0!important;
      border-bottom:1px solid rgba(var(--record-accent-rgb),.16)!important;
      border-radius:0!important;
      background:rgba(var(--record-accent-rgb),.035)!important;
      box-shadow:none!important;
      color:var(--record-accent)!important;
      font-size:10.5px!important;
      font-weight:850!important;
      letter-spacing:.07em!important;
      text-transform:uppercase!important;
    }

    /* No decorative bullets/dots anywhere in the PR table. */
    .record-group-toggle-v52 > span:first-child::before,
    .record-name-v52::before {
      content:none!important;
      display:none!important;
    }

    .record-group-toggle-v52 > span:first-child {
      display:block!important;
    }

    .record-group-count-v52 {
      min-width:24px!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
      color:rgba(var(--record-accent-rgb),.62)!important;
      font-size:8.5px!important;
      font-weight:800!important;
      text-align:right!important;
    }

    .record-chevron-v52 {
      color:var(--record-accent)!important;
      opacity:.72!important;
    }

    .record-group-body-v52 {
      background:transparent!important;
      border:0!important;
    }

    .record-row-v52 {
      min-height:57px!important;
      padding:8px 12px!important;
      border:0!important;
      border-bottom:1px solid rgba(148,163,184,.135)!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
    }

    .record-row-v52:last-child {
      border-bottom:0!important;
    }

    .record-name-v52 {
      position:static!important;
      padding-left:0!important;
      color:#E9EEF5!important;
      font-size:11.5px!important;
      font-weight:620!important;
      letter-spacing:-.01em!important;
    }

    .record-max-v52 {
      color:var(--record-accent)!important;
      font-size:12px!important;
      font-weight:820!important;
    }

    .record-spark-v52 polyline,
    .record-spark-v52.has-gain polyline {
      stroke:var(--record-accent)!important;
      opacity:.88!important;
    }

    .record-spark-v52 circle,
    .record-spark-v52.has-gain circle {
      fill:var(--record-accent)!important;
      filter:drop-shadow(0 0 3px rgba(var(--record-accent-rgb),.40));
    }

    .record-progress-copy-v52 { color:#7E8A9B!important; }
    .record-gain-v52 { color:var(--record-accent)!important;font-weight:850!important; }
    .record-flat-v52 { color:#667386!important; }

    .records-master-toggle-v52 {
      border-color:rgba(56,189,248,.20)!important;
      background:transparent!important;
      color:#38BDF8!important;
      box-shadow:none!important;
    }

    @media(max-width:520px) {
      .records-columns-v52,
      .record-group-toggle-v52,
      .record-row-v52 {
        padding-left:10px!important;
        padding-right:10px!important;
      }
      .record-group-toggle-v52 { min-height:41px!important; }
      .record-row-v52 { min-height:55px!important; }
      .record-name-v52 { font-size:10.7px!important; }
    }
  `;
  document.head.appendChild(style);
})();
