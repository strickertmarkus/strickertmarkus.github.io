(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseCustomTransitionAtomicV56Installed) return;
  window.__exerciseCustomTransitionAtomicV56Installed = true;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    return state.exercises[Number(state.exerciseIndex) || 0] || null;
  }

  function syncManualStartLabel(state) {
    var gate = state && state.__betweenCustomManualStartV4;
    if (!gate) return;
    var controls = document.getElementById('session-controls');
    if (!controls) return;
    var start = Array.prototype.slice.call(controls.querySelectorAll('button')).find(function (button) {
      return /^starta set$/i.test(String(button.textContent || '').trim());
    });
    if (!start) return;
    start.textContent = gate.kind === 'exercise' ? 'Starta nästa övning' : 'Starta nästa set';
    start.setAttribute('data-between-custom-manual-start-v4','true');
  }

  function appendSummaryLogs(state, runtime, exercise, tempLogs, duration) {
    var summary = state.__betweenCustomSummaryV3;
    if (!summary) {
      summary = state.__betweenCustomSummaryV3 = {
        name: exercise.name || 'Valfri övning',
        seconds: Math.max(1, Math.round((Number(exercise.time) || 0) * 60)) || duration,
        logs: []
      };
    }
    if (!Array.isArray(summary.logs)) summary.logs = [];
    tempLogs.forEach(function (log) {
      var copy = Object.assign({}, log);
      copy.setNo = summary.logs.length + 1;
      summary.logs.push(copy);
    });
  }

  function completeCustomAtomically(state, exercise) {
    var runtime = state && state.__betweenCustomRuntimeV3;
    if (!runtime || !exercise || !exercise.__betweenCustomV3 || !state.setRunning || !state.setStartedAt) return false;

    var endedAt = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : Date.now();
    var duration = Math.max(1, Math.round((endedAt - Number(state.setStartedAt)) / 1000));

    if (!Array.isArray(state.logs)) state.logs = [];
    var tempLogs = state.logs[runtime.index];
    if (!Array.isArray(tempLogs)) tempLogs = state.logs[runtime.index] = [];

    tempLogs.push({
      setNo: state.currentSet,
      actualDistance: Number(exercise.distance) || 0,
      actualTime: Number(exercise.time) || +(duration / 60).toFixed(2),
      durationSec: duration
    });
    appendSummaryLogs(state, runtime, exercise, tempLogs, duration);

    state.exercises[runtime.index] = runtime.originalExercise;
    state.logs[runtime.index] = runtime.originalLogs;
    state.exerciseIndex = runtime.index;
    state.currentSet = runtime.originalCurrentSet;
    state.setRunning = false;
    state.setStartedAt = null;
    state.awaitingDecision = false;
    state.__hypePaused = false;
    state.__hypePausedAt = null;
    state.__unifiedStartingV46 = false;
    state.__betweenCustomRuntimeV3 = null;

    if (runtime.transition === 'next') {
      state.currentSet = runtime.originalCurrentSet + 1;
    } else if (runtime.transition === 'extra') {
      runtime.originalExercise.plannedSets = Math.max(1, Number(runtime.originalExercise.plannedSets) || 1) + 1;
      state.currentSet = runtime.originalCurrentSet + 1;
    } else if (runtime.transition === 'finish') {
      state.exerciseIndex = runtime.index + 1;
      state.currentSet = 1;
    }

    state.__betweenCustomManualStartV4 = {
      kind: runtime.transition === 'finish' ? 'exercise' : 'set',
      exerciseIndex: state.exerciseIndex,
      currentSet: state.currentSet
    };

    try { if (typeof window.renderSessionMode === 'function') window.renderSessionMode(); } catch (_) {}
    syncManualStartLabel(state);
    try {
      if (window.__exerciseSessionControllerV46 && typeof window.__exerciseSessionControllerV46.paint === 'function') {
        window.__exerciseSessionControllerV46.paint();
      }
    } catch (_) {}
    return true;
  }

  function bindFinalComplete() {
    if (!window.__exerciseSessionControllerV46Installed || typeof window.completeCurrentSet !== 'function') return false;
    var original = window.completeCurrentSet;
    if (original.__exerciseCustomAtomicV56Wrapped) return true;

    var wrapped = function () {
      var state = getState();
      var exercise = currentExercise(state);
      if (state && exercise && exercise.__betweenCustomV3 && state.__betweenCustomRuntimeV3) {
        if (completeCustomAtomically(state, exercise)) return;
      }
      return original.apply(this, arguments);
    };
    wrapped.__exerciseCustomAtomicV56Wrapped = true;
    wrapped.__exerciseCustomAtomicV56Original = original;
    window.completeCurrentSet = wrapped;
    return true;
  }

  function install() {
    var attempts = 0;
    (function waitForV46() {
      attempts += 1;
      if (bindFinalComplete()) return;
      if (attempts < 160) setTimeout(waitForV46, 50);
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
