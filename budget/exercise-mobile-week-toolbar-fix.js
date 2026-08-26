(function () {
  'use strict';
  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var style = document.createElement('style');
  style.id = 'exercise-mobile-week-toolbar-fix-style';
  style.textContent = `
    @media (max-width: 600px) {
      .week-toolbar {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        gap: 8px !important;
        width: 100% !important;
      }
      .week-toolbar .week-nav {
        flex: 0 1 auto !important;
        min-width: 0 !important;
        width: auto !important;
      }
      .week-toolbar .week-nav-copy {
        min-width: 0 !important;
        width: auto !important;
      }
      .week-toolbar .week-pick {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        gap: 6px !important;
        flex: 1 1 0 !important;
        min-width: 0 !important;
        width: auto !important;
        max-width: none !important;
      }
      .week-toolbar .week-pick input[type="date"] {
        flex: 1 1 0 !important;
        min-width: 0 !important;
        width: 0 !important;
      }
      .week-toolbar .week-pick .btn-sm,
      .week-toolbar .week-pick button {
        flex: 0 0 auto !important;
        white-space: nowrap !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
