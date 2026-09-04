(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseReloadRecoveryV54Installed) return;
  window.__exerciseReloadRecoveryV54Installed = true;

  var params = new URLSearchParams(window.location.search);
  var profile = (params.get('user') || 'markus').toLowerCase();
  var SESSION_KEY = 'ex_reload_session_' + profile;
  var SUSPENDED_KEY = SESSION_KEY + '_suspended_20260826';
  var bootInteraction = false;

  function setState(value) {
    try { sessionState = value; return true; }
    catch (e) {
      try { window.sessionState = value; return true; }
      catch (_) { return false; }
    }
  }

  function archiveAndClearOldCheckpoint() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (raw && !localStorage.getItem(SUSPENDED_KEY)) localStorage.setItem(SUSPENDED_KEY, raw);
      localStorage.removeItem(SESSION_KEY);
    } catch (_) {}
  }

  function clearStaleModalOverlays() {
    document.querySelectorAll('.modal-overlay.show').forEach(function (overlay) {
      overlay.classList.remove('show');
    });
    try { delete document.documentElement.dataset.exerciseMorph; } catch (_) {}
    document.querySelectorAll('.exercise-morph-fallback-v1').forEach(function (el) {
      el.classList.remove('exercise-morph-fallback-v1');
    });
  }

  function hideTransientSessionUi() {
    ['session-pre-timer','session-between-overlay','session-between-overlay-v2'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('show','is-closing-v46');
      if (id === 'session-between-overlay' || id === 'session-between-overlay-v2') el.remove();
    });
    var modal = document.getElementById('session-modal');
    if (modal) modal.classList.remove('show','hype-mode','persistent-hype','hype-focus','session-overview-mode');
  }

  function loadScriptOnce(src, attr, onload) {
    var existing = document.querySelector('script[' + attr + ']');
    if (existing) {
      if (onload) onload();
      return;
    }
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.setAttribute(attr,'true');
    if (onload) script.addEventListener('load', onload, { once:true });
    document.head.appendChild(script);
  }

  function loadSessionStability() {
    loadScriptOnce('exercise-session-stability-v55.js?v=20260904-1418-session-stable','data-exercise-session-stability-v55');
    loadScriptOnce('exercise-custom-transition-atomic-v56.js?v=20260904-1432-atomic-custom','data-exercise-custom-transition-atomic-v56');
    loadScriptOnce('exercise-session-compact-cardio-v57.js?v=20260904-1512-timer-only','data-exercise-session-compact-cardio-v57');
  }

  function loadLogLayers() {
    loadScriptOnce('exercise-log-layout-v50.js?v=20260904-1151-align','data-exercise-log-layout-v50');
    loadScriptOnce('exercise-log-pr-v52.js?v=20260904-1544-collapsed-default','data-exercise-log-pr-v52',function () {
      loadScriptOnce('exercise-log-pr-theme-v53.js?v=20260904-1344-open-table','data-exercise-log-pr-theme-v53');
    });
  }

  function resetOnlyAtBoot() {
    archiveAndClearOldCheckpoint();
    setState(null);
    hideTransientSessionUi();
    clearStaleModalOverlays();
  }

  window.__exerciseEmergencyExit = function () {
    setState(null);
    try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
    hideTransientSessionUi();
    clearStaleModalOverlays();
  };

  function install() {
    resetOnlyAtBoot();
    loadSessionStability();
    loadLogLayers();

    document.addEventListener('pointerdown', function () {
      bootInteraction = true;
    }, { once:true, capture:true });

    [0,80,250,700].forEach(function (delay) {
      setTimeout(function () {
        if (!bootInteraction) {
          hideTransientSessionUi();
          clearStaleModalOverlays();
        }
      }, delay);
    });

    window.addEventListener('pageshow', function (event) {
      if (!event || !event.persisted) return;
      bootInteraction = false;
      setState(null);
      hideTransientSessionUi();
      clearStaleModalOverlays();
    });

    /* Deliberately no wrappers around renderSessionMode/startCurrentSet/etc.
       The recovery layer must never participate in the live workout engine. */
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();