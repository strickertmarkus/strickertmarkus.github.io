(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function addStyles() {
    if (document.getElementById('exercise-log-mobile-fix-v5-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-log-mobile-fix-v5-style';
    style.textContent = `
      /* A td must remain a table-cell. The base .log-actions rule uses flex,
         which breaks the final column geometry in mobile Safari. */
      .log-table td.log-actions {
        display: table-cell !important;
        text-align: center !important;
        vertical-align: middle !important;
      }
      .log-table td.log-actions .log-del {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 auto !important;
      }
      .log-table td:nth-child(5) {
        white-space: nowrap;
      }

      @media (max-width: 600px) {
        .log-wrap {
          overflow-x: hidden !important;
        }
        .log-table {
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
        }
        .log-table th,
        .log-table td {
          box-sizing: border-box !important;
        }
        .log-table tbody .log-main-row td {
          border-bottom: 1px solid var(--border) !important;
          background-clip: padding-box !important;
        }
        .log-table tbody .log-main-row:hover td {
          background: var(--accent-dim) !important;
        }
        .log-table tbody .log-main-row:last-of-type td {
          border-bottom: 1px solid var(--border) !important;
        }
        .log-table td.log-actions {
          padding-left: 2px !important;
          padding-right: 2px !important;
          overflow: hidden !important;
        }
        .log-table td.log-actions .log-del {
          width: 28px !important;
          height: 32px !important;
          padding: 0 !important;
          border-radius: 7px !important;
          font-size: 14px !important;
          line-height: 1 !important;
        }
      }

      @media (max-width: 430px) {
        .log-table th:nth-child(1), .log-table td:nth-child(1) { width: 14% !important; }
        .log-table th:nth-child(2), .log-table td:nth-child(2) { width: 24% !important; }
        .log-table th:nth-child(3), .log-table td:nth-child(3) { width: 20% !important; }
        .log-table th:nth-child(4), .log-table td:nth-child(4) { width: 15% !important; }
        .log-table th:nth-child(5), .log-table td:nth-child(5) { width: 19% !important; }
        .log-table th:nth-child(6), .log-table td:nth-child(6) { width: 8% !important; }

        .log-table th:nth-child(5), .log-table td:nth-child(5) {
          padding-left: 5px !important;
          padding-right: 3px !important;
        }
        .log-table th:nth-child(6) {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
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
    /* Heading is static, but one delayed pass covers late page initialization
       without observing the whole DOM. */
    setTimeout(renameHeading, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
