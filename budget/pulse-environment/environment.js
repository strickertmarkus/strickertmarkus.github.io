/* CP10 compatibility entry.
   Observatory presentation/state ownership moved to ../exercise-dashboard.js.
   The canonical loader is training-overview-mode.js; this file intentionally
   owns no runtime behavior while the current HTML shell still references it. */
(function () {
  'use strict';
  if (window.__exerciseDashboardCP10Requested) return;
  window.__exerciseDashboardCP10Requested = true;
  var script = document.createElement('script');
  script.src = 'exercise-dashboard.js?v=20260922-observatory-composition-2';
  script.async = false;
  script.dataset.exerciseDashboardOwner = 'cp10-fallback';
  document.head.appendChild(script);
})();