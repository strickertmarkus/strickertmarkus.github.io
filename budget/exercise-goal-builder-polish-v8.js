(function () {
  'use strict';
  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  /* Compatibility shim: auth-gate still references this historical filename.
     All former V8 goal/layout/builder work now lives in exercise-shell-v12.js. */
  function syncShell() {
    try {
      if (window.__exerciseShellV12 && typeof window.__exerciseShellV12.prepare === 'function') {
        window.__exerciseShellV12.prepare();
        return true;
      }
    } catch (_) {}
    return false;
  }

  if (!syncShell()) {
    [0,80,240,600].forEach(function (delay) { setTimeout(syncShell,delay); });
  }
})();
