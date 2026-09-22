/* CP10 compatibility entry.
   Dashboard ownership moved to exercise-dashboard.js. This file remains only
   because the current exercise.html shell still references the historical path. */
(function () {
  'use strict';
  if (window.__exerciseDashboardCP10Requested) return;
  window.__exerciseDashboardCP10Requested = true;
  var script = document.createElement('script');
  script.src = 'exercise-dashboard.js?v=20260922-observatory-composition-2';
  script.async = false;
  script.dataset.exerciseDashboardOwner = 'cp10';
  script.addEventListener('load', function () { window.__exerciseDashboardCP10Loaded = true; }, {once:true});
  script.addEventListener('error', function () { window.__exerciseDashboardCP10LoadError = true; }, {once:true});
  document.head.appendChild(script);
})();