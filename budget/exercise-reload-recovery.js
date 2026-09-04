(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var params = new URLSearchParams(window.location.search);
  var profile = (params.get('user') || 'markus').toLowerCase();
  var SESSION_KEY = 'ex_reload_session_' + profile;
  var SUSPENDED_KEY = SESSION_KEY + '_suspended_20260826';
  var exitIntentUntil = 0;
  var bootInteraction = false;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (e) { return null; }
  }

  function setState(value) {
    try { sessionState = value; return true; }
    catch (e) {
      try { window.sessionState = value; return true; }
      catch (ignore) { return false; }
    }
  }

  function archiveAndClearOldCheckpoint() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (raw && !localStorage.getItem(SUSPENDED_KEY)) {
        localStorage.setItem(SUSPENDED_KEY, raw);
      }
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  function clearStaleModalOverlays() {
    document.querySelectorAll('.modal-overlay.show').forEach(function (overlay) {
      overlay.classList.remove('show');
    });

    try { delete document.documentElement.dataset.exerciseMorph; } catch (e) {}
    document.querySelectorAll('.exercise-morph-fallback-v1').forEach(function (el) {
      el.classList.remove('exercise-morph-fallback-v1');
    });
  }

  function hideTransientSessionUi() {
    ['session-pre-timer','session-between-overlay','session-between-overlay-v2'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.classList.remove('show');
        if (id === 'session-between-overlay' || id === 'session-between-overlay-v2') el.remove();
      }
    });
    var modal = document.getElementById('session-modal');
    if (modal) {
      modal.classList.remove('show','hype-mode','persistent-hype','hype-focus','session-overview-mode');
    }
  }

  function loadLogLayoutV50() {
    if (document.querySelector('script[data-exercise-log-layout-v50]')) return;
    var script = document.createElement('script');
    script.src = 'exercise-log-layout-v50.js?v=20260904-1151-align';
    script.async = false;
    script.setAttribute('data-exercise-log-layout-v50','true');
    document.head.appendChild(script);
  }

  function loadLogPrV51() {
    if (document.querySelector('script[data-exercise-log-pr-v51]')) return;
    var script = document.createElement('script');
    script.src = 'exercise-log-pr-v51.js?v=20260904-1218-stable';
    script.async = false;
    script.setAttribute('data-exercise-log-pr-v51','true');
    document.head.appendChild(script);
  }

  function emergencyResetOnBoot() {
    archiveAndClearOldCheckpoint();
    setState(null);
    hideTransientSessionUi();
    clearStaleModalOverlays();
  }

  function saveSessionCheckpoint() {
    if (Date.now() < exitIntentUntil) return;
    var state = getState();
    if (!state) {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
      return;
    }

    var modal = document.getElementById('session-modal');
    var hr = document.getElementById('session-hr');
    var vo2 = document.getElementById('session-vo2');
    var payload = {
      version: 2,
      savedAt: Date.now(),
      state: state,
      hr: hr ? hr.value : '',
      vo2: vo2 ? vo2.value : '',
      view: modal && modal.classList.contains('session-overview-mode') ? 'overview' : 'hype'
    };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(payload)); } catch (e) {}
  }

  function markExitIntent() {
    exitIntentUntil = Date.now() + 5000;
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  window.__exerciseEmergencyExit = function () {
    markExitIntent();
    setState(null);
    hideTransientSessionUi();
    clearStaleModalOverlays();
  };

  function wrapAfter(name) {
    var fn = window[name];
    if (typeof fn !== 'function' || fn.__emergencyRecoveryWrapped) return;
    var wrapped = function () {
      var result = fn.apply(this, arguments);
      saveSessionCheckpoint();
      return result;
    };
    wrapped.__emergencyRecoveryWrapped = true;
    window[name] = wrapped;
  }

  function install() {
    emergencyResetOnBoot();
    loadLogLayoutV50();
    loadLogPrV51();

    document.addEventListener('pointerdown', function () {
      bootInteraction = true;
    }, { once:true, capture:true });

    [0, 80, 250, 700].forEach(function (delay) {
      setTimeout(function () {
        if (!bootInteraction) {
          hideTransientSessionUi();
          clearStaleModalOverlays();
        }
      }, delay);
    });

    window.addEventListener('pageshow', function (event) {
      if (event && event.persisted) {
        bootInteraction = false;
        setState(null);
        hideTransientSessionUi();
        clearStaleModalOverlays();
      }
    });

    var attempts = 0;
    function ready() {
      attempts++;
      if (typeof window.renderSessionMode !== 'function') {
        if (attempts < 80) setTimeout(ready, 100);
        return;
      }

      ['renderSessionMode','startCurrentSet','startNextSet','completeCurrentSet','addExtraSet','finishCurrentExercise','updateSetLog']
        .forEach(wrapAfter);

      var stopFn = window.stopSessionMode;
      if (typeof stopFn === 'function' && !stopFn.__emergencyRecoveryWrapped) {
        var wrappedStop = function () {
          markExitIntent();
          var result = stopFn.apply(this, arguments);
          markExitIntent();
          return result;
        };
        wrappedStop.__emergencyRecoveryWrapped = true;
        window.stopSessionMode = wrappedStop;
      }

      document.addEventListener('click', function (event) {
        var button = event.target && event.target.closest ? event.target.closest('#session-modal button') : null;
        if (!button) return;
        var inline = button.getAttribute('onclick') || '';
        var text = (button.textContent || '').trim().toLowerCase();
        if (inline.indexOf('stopSessionMode') >= 0 || text === 'avsluta') markExitIntent();
      }, true);

      window.addEventListener('pagehide', saveSessionCheckpoint);
      window.addEventListener('beforeunload', saveSessionCheckpoint);
      setInterval(function () { if (getState()) saveSessionCheckpoint(); }, 1000);
    }
    ready();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
