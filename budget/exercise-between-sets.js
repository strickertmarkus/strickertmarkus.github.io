(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  /*
   * SAFETY ROLLBACK
   *
   * The latest between-set implementation wrapped core session actions and
   * could leave a recovered Träningsläge session in a state that was hard to
   * leave. Keep this asset as a compatibility shim while the between-set flow
   * is rebuilt without intercepting the core session state machine.
   *
   * Important: do not clear sessionState or reload-recovery data here. An
   * interrupted workout must remain recoverable.
   */

  function cleanupTransientBetweenSetUi() {
    var overlay = document.getElementById('session-between-overlay');
    if (overlay) overlay.remove();

    document.querySelectorAll('.ex-row-item > .between-set-editor').forEach(function (el) {
      el.remove();
    });

    var globalEditor = document.getElementById('between-set-global-editor');
    if (globalEditor) globalEditor.remove();
  }

  function install() {
    cleanupTransientBetweenSetUi();

    /* Make cleanup available to the session safety layer / manual recovery. */
    window.__exerciseCancelBetweenSet = cleanupTransientBetweenSetUi;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
