/* CP10 compatibility entry.
   Weekly-plan orbit ownership moved to exercise-dashboard.js. This file remains
   as a non-owning compatibility path until the Release V1 loader cutover. */
(function () {
  'use strict';
  if (window.__exerciseDashboardCP10Requested) return;
  window.__exerciseDashboardCP10Requested = true;
  var script = document.createElement('script');
  script.src = 'exercise-dashboard.js?v=20260926-original-compact-host-4';
  script.async = false;
  script.dataset.exerciseDashboardOwner = 'cp10-fallback';
  document.head.appendChild(script);
})();