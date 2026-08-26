(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var params = new URLSearchParams(window.location.search);
  var profile = (params.get('user') || 'markus').toLowerCase();
  var SESSION_KEY = 'ex_reload_session_' + profile;
  var DRAFT_KEY = 'ex_reload_pass_draft_' + profile;
  var restoring = false;
  var draftSaveTimer = null;

  function getState() {
    try {
      return typeof sessionState !== 'undefined' ? sessionState : null;
    } catch (e) {
      return null;
    }
  }

  function setState(value) {
    try {
      sessionState = value;
      return true;
    } catch (e) {
      try {
        window.sessionState = value;
        return true;
      } catch (ignore) {
        return false;
      }
    }
  }

  function safeParse(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function saveSessionCheckpoint() {
    if (restoring) return;
    var state = getState();
    if (!state) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    var modal = document.getElementById('session-modal');
    var hr = document.getElementById('session-hr');
    var vo2 = document.getElementById('session-vo2');
    var payload = {
      version: 1,
      savedAt: Date.now(),
      state: state,
      hr: hr ? hr.value : '',
      vo2: vo2 ? vo2.value : '',
      view: modal && modal.classList.contains('session-overview-mode') ? 'overview' : 'hype'
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function clearSessionCheckpoint() {
    localStorage.removeItem(SESSION_KEY);
  }

  function captureControl(control) {
    return {
      value: control.value,
      checked: !!control.checked,
      type: control.type || '',
      tag: control.tagName
    };
  }

  function applyControl(control, saved) {
    if (!control || !saved) return;
    if (saved.type === 'checkbox' || saved.type === 'radio') {
      control.checked = !!saved.checked;
    } else {
      control.value = saved.value == null ? '' : saved.value;
    }
  }

  function savePassDraft() {
    if (restoring) return;
    var modal = document.getElementById('day-workout-modal');
    if (!modal || !modal.classList.contains('show')) return;

    var list = document.getElementById('day-workout-ex-list');
    var dateEl = document.getElementById('day-workout-date');
    var typeEl = document.getElementById('day-workout-type');
    if (!list) return;

    var rows = Array.prototype.slice.call(list.querySelectorAll('.ex-row-item')).map(function (row) {
      return Array.prototype.slice.call(row.querySelectorAll('input,select,textarea')).map(captureControl);
    });

    var payload = {
      version: 1,
      savedAt: Date.now(),
      date: (dateEl && dateEl.value) || modal.dataset.date || '',
      type: typeEl ? typeEl.value : '',
      rows: rows
    };

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function savePassDraftSoon() {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(savePassDraft, 40);
  }

  function clearPassDraft() {
    clearTimeout(draftSaveTimer);
    localStorage.removeItem(DRAFT_KEY);
  }

  function restorePassDraft() {
    if (getState()) return false;
    var draft = safeParse(localStorage.getItem(DRAFT_KEY));
    if (!draft || !draft.date || !Array.isArray(draft.rows)) return false;
    if (typeof window.loadDayWorkoutBuilder !== 'function' || typeof window.addDayWorkoutExRow !== 'function') return false;

    restoring = true;
    try {
      window.loadDayWorkoutBuilder(draft.date);

      var modal = document.getElementById('day-workout-modal');
      var list = document.getElementById('day-workout-ex-list');
      var dateEl = document.getElementById('day-workout-date');
      var typeEl = document.getElementById('day-workout-type');
      if (!modal || !list) return false;

      var rows = Array.prototype.slice.call(list.querySelectorAll('.ex-row-item'));
      while (rows.length < draft.rows.length) {
        window.addDayWorkoutExRow();
        rows = Array.prototype.slice.call(list.querySelectorAll('.ex-row-item'));
      }
      while (rows.length > draft.rows.length && rows.length > 0) {
        rows[rows.length - 1].remove();
        rows = Array.prototype.slice.call(list.querySelectorAll('.ex-row-item'));
      }

      rows.forEach(function (row, rowIndex) {
        var controls = Array.prototype.slice.call(row.querySelectorAll('input,select,textarea'));
        var savedControls = draft.rows[rowIndex] || [];
        controls.forEach(function (control, controlIndex) {
          applyControl(control, savedControls[controlIndex]);
        });
      });

      if (dateEl) dateEl.value = draft.date;
      if (typeEl) typeEl.value = draft.type || typeEl.value;
      modal.dataset.date = draft.date;
      modal.classList.add('show');
      return true;
    } catch (e) {
      return false;
    } finally {
      restoring = false;
    }
  }

  function shiftRecoveredTimers(state, downtime) {
    if (!state || !downtime || downtime < 0) return;
    if (typeof state.passStartedAt === 'number') state.passStartedAt += downtime;
    if (state.setRunning && typeof state.setStartedAt === 'number') state.setStartedAt += downtime;
    if (state.__hypePaused && typeof state.__hypePausedAt === 'number') state.__hypePausedAt += downtime;
  }

  function restoreSessionCheckpoint() {
    var checkpoint = safeParse(localStorage.getItem(SESSION_KEY));
    if (!checkpoint || !checkpoint.state) return false;
    if (typeof window.renderSessionMode !== 'function') return false;

    restoring = true;
    try {
      var state = checkpoint.state;
      var downtime = Math.max(0, Date.now() - Number(checkpoint.savedAt || Date.now()));
      shiftRecoveredTimers(state, downtime);
      if (!setState(state)) return false;

      var hr = document.getElementById('session-hr');
      var vo2 = document.getElementById('session-vo2');
      if (hr) hr.value = checkpoint.hr || '';
      if (vo2) vo2.value = checkpoint.vo2 || '';

      var modal = document.getElementById('session-modal');
      if (modal) modal.classList.add('show');

      window.renderSessionMode();
      if (typeof window.startSessionTimerLoop === 'function') window.startSessionTimerLoop();

      if (checkpoint.view === 'overview') {
        setTimeout(function () {
          var currentModal = document.getElementById('session-modal');
          var toggle = document.getElementById('session-view-toggle');
          if (toggle && currentModal && !currentModal.classList.contains('session-overview-mode')) toggle.click();
        }, 0);
      }
      return true;
    } catch (e) {
      return false;
    } finally {
      restoring = false;
      setTimeout(saveSessionCheckpoint, 0);
    }
  }

  function wrapAfter(name, callback) {
    var fn = window[name];
    if (typeof fn !== 'function' || fn.__reloadRecoveryWrapped) return;
    var wrapped = function () {
      var result = fn.apply(this, arguments);
      callback.apply(this, arguments);
      return result;
    };
    wrapped.__reloadRecoveryWrapped = true;
    window[name] = wrapped;
  }

  function bindSessionCheckpointing() {
    [
      'renderSessionMode',
      'startCurrentSet',
      'startNextSet',
      'completeCurrentSet',
      'addExtraSet',
      'finishCurrentExercise',
      'updateSetLog'
    ].forEach(function (name) {
      wrapAfter(name, saveSessionCheckpoint);
    });

    var stopFn = window.stopSessionMode;
    if (typeof stopFn === 'function' && !stopFn.__reloadRecoveryWrapped) {
      var wrappedStop = function () {
        clearSessionCheckpoint();
        var result = stopFn.apply(this, arguments);
        clearSessionCheckpoint();
        return result;
      };
      wrappedStop.__reloadRecoveryWrapped = true;
      window.stopSessionMode = wrappedStop;
    }
  }

  function bindDraftCheckpointing() {
    document.addEventListener('input', function (event) {
      if (event.target && event.target.closest && event.target.closest('#day-workout-modal')) savePassDraftSoon();
      if (event.target && event.target.closest && event.target.closest('#session-modal')) saveSessionCheckpoint();
    }, true);

    document.addEventListener('change', function (event) {
      if (event.target && event.target.closest && event.target.closest('#day-workout-modal')) savePassDraftSoon();
      if (event.target && event.target.closest && event.target.closest('#session-modal')) saveSessionCheckpoint();
    }, true);

    var list = document.getElementById('day-workout-ex-list');
    if (list && !window.__exerciseDraftObserver) {
      window.__exerciseDraftObserver = new MutationObserver(function () {
        savePassDraftSoon();
      });
      window.__exerciseDraftObserver.observe(list, { childList: true, subtree: true });
    }

    var closeFn = window.closeModal;
    if (typeof closeFn === 'function' && !closeFn.__reloadRecoveryWrapped) {
      var wrappedClose = function (id) {
        if (id === 'day-workout-modal') clearPassDraft();
        return closeFn.apply(this, arguments);
      };
      wrappedClose.__reloadRecoveryWrapped = true;
      window.closeModal = wrappedClose;
    }
  }

  function install() {
    var attempts = 0;
    function ready() {
      attempts++;
      if (typeof window.renderSessionMode !== 'function' || typeof window.loadDayWorkoutBuilder !== 'function') {
        if (attempts < 80) setTimeout(ready, 100);
        return;
      }
      if (window.__exerciseReloadRecoveryInstalled) return;
      window.__exerciseReloadRecoveryInstalled = true;

      bindSessionCheckpointing();
      bindDraftCheckpointing();

      var restoredSession = restoreSessionCheckpoint();
      if (!restoredSession) restorePassDraft();

      window.addEventListener('pagehide', function () {
        saveSessionCheckpoint();
        savePassDraft();
      });
      window.addEventListener('beforeunload', function () {
        saveSessionCheckpoint();
        savePassDraft();
      });

      setInterval(function () {
        if (getState()) saveSessionCheckpoint();
      }, 1000);
    }
    ready();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
