(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseLogPrThemeV53Installed) return;
  window.__exerciseLogPrThemeV53Installed = true;

  if (document.getElementById('exercise-log-pr-theme-v53-style')) return;

  var style = document.createElement('style');
  style.id = 'exercise-log-pr-theme-v53-style';
  style.textContent = `
    /* PR table: closer to the visual language of Träningslogg. */
    #pr-grid.records-log-wrap-v52 {
      margin-top:10px!important;
    }

    .records-log-table-v52 {
      background:transparent!important;
      border-top:1px solid rgba(148,163,184,.26)!important;
      border-bottom:1px solid rgba(148,163,184,.26)!important;
      overflow:hidden;
    }

    .records-columns-v52 {
      min-height:42px!important;
      background:transparent!important;
      border-bottom:1px solid rgba(148,163,184,.26)!important;
      color:#778395!important;
      font-size:9px!important;
      font-weight:850!important;
      letter-spacing:.115em!important;
      text-transform:uppercase!important;
    }

    .record-group-v52 {
      --record-accent:#38BDF8;
      --record-accent-rgb:56,189,248;
      border-bottom:1px solid rgba(148,163,184,.20)!important;
      background:transparent!important;
    }

    .record-group-v52[data-record-category="Övrigt"] {
      --record-accent:#F87171;
      --record-accent-rgb:248,113,113;
    }

    .record-group-v52:last-child {
      border-bottom:0!important;
    }

    .record-group-toggle-v52 {
      min-height:44px!important;
      padding:0 12px!important;
      border:0!important;
      border-bottom:1px solid rgba(var(--record-accent-rgb),.18)!important;
      background:linear-gradient(90deg,rgba(var(--record-accent-rgb),.105),rgba(var(--record-accent-rgb),.028) 58%,transparent)!important;
      color:var(--record-accent)!important;
      font-size:11px!important;
      font-weight:850!important;
      letter-spacing:.055em!important;
      text-transform:uppercase!important;
    }

    .record-group-toggle-v52 > span:first-child {
      display:flex;
      align-items:center;
      gap:8px;
    }

    .record-group-toggle-v52 > span:first-child::before {
      content:"";
      width:5px;
      height:5px;
      border-radius:50%;
      background:var(--record-accent);
      box-shadow:0 0 8px rgba(var(--record-accent-rgb),.48);
      flex:0 0 5px;
    }

    .record-group-count-v52 {
      min-width:25px;
      padding:3px 7px!important;
      border:1px solid rgba(var(--record-accent-rgb),.24)!important;
      border-radius:999px!important;
      background:rgba(var(--record-accent-rgb),.075)!important;
      color:var(--record-accent)!important;
      font-size:8px!important;
      font-weight:850!important;
      text-align:center!important;
    }

    .record-chevron-v52 {
      color:var(--record-accent)!important;
      opacity:.78!important;
    }

    .record-group-body-v52 {
      background:rgba(9,13,19,.16)!important;
    }

    .record-row-v52 {
      min-height:58px!important;
      padding-top:8px!important;
      padding-bottom:8px!important;
      border-bottom:1px solid rgba(148,163,184,.145)!important;
      background:transparent!important;
      transition:background .16s ease!important;
    }

    .record-row-v52:hover {
      background:rgba(var(--record-accent-rgb),.025)!important;
    }

    .record-row-v52:last-child {
      border-bottom:0!important;
    }

    .record-name-v52 {
      position:relative;
      padding-left:12px!important;
      color:#E9EEF5!important;
      font-size:11.5px!important;
      font-weight:650!important;
      letter-spacing:-.01em!important;
    }

    .record-name-v52::before {
      content:"";
      position:absolute;
      left:0;
      top:50%;
      width:4px;
      height:4px;
      margin-top:-2px;
      border-radius:50%;
      background:rgba(var(--record-accent-rgb),.58);
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
      filter:drop-shadow(0 0 3px rgba(var(--record-accent-rgb),.45));
    }

    .record-progress-copy-v52 {
      color:#7E8A9B!important;
    }

    .record-gain-v52 {
      color:var(--record-accent)!important;
      font-weight:850!important;
    }

    .record-flat-v52 {
      color:#667386!important;
    }

    .records-master-toggle-v52 {
      border-color:rgba(56,189,248,.22)!important;
      background:rgba(56,189,248,.04)!important;
      color:#38BDF8!important;
    }

    @media(max-width:520px) {
      .record-group-toggle-v52 {
        min-height:42px!important;
        padding-left:10px!important;
        padding-right:10px!important;
      }
      .record-row-v52 {
        min-height:56px!important;
      }
      .record-name-v52 {
        padding-left:10px!important;
        font-size:10.7px!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
