(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var pretimerActive = false;
  var pretimerTimer = null;
  var pretimerDeadline = 0;
  var pretimerDone = null;
  var internalSave = false;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; } catch (e) { return null; }
  }

  function addStyles() {
    if (document.getElementById('exercise-points-3-6-7-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-points-3-6-7-style';
    style.textContent = `
      #session-pre-timer {
        position: absolute;
        inset: 0;
        z-index: 60;
        display: none;
        place-items: center;
        background: rgba(12,8,5,.78);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      #session-pre-timer.show { display: grid; }
      #session-pre-timer-ring {
        width: 172px;
        height: 172px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        position: relative;
        background: conic-gradient(#FB923C var(--pre-progress,0deg), rgba(251,146,60,.13) 0deg);
        box-shadow: 0 0 34px rgba(249,115,22,.22);
      }
      #session-pre-timer-ring::before {
        content: '';
        position: absolute;
        inset: 10px;
        border-radius: 50%;
        background: #17100c;
        border: 1px solid rgba(251,146,60,.25);
      }
      .session-pre-copy {
        position: relative;
        z-index: 2;
        text-align: center;
      }
      #session-pre-timer-value {
        color: #FDBA74;
        font-size: 58px;
        line-height: .95;
        font-weight: 900;
        letter-spacing: -2px;
        font-variant-numeric: tabular-nums;
      }
      .session-pre-label {
        margin-top: 9px;
        color: #A8A29E;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .9px;
        text-transform: uppercase;
      }
      .session-pre-skip {
        margin-top: 8px;
        color: #78716C;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: .5px;
        text-transform: uppercase;
      }
      @media (max-width:600px) {
        #session-pre-timer-ring {
          width: min(158px,43vw);
          height: min(158px,43vw);
        }
        #session-pre-timer-value { font-size: 52px; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePretimer() {
    var existing = document.getElementById('session-pre-timer');
    if (existing) return existing;
    var shell = document.querySelector('#session-modal .session-shell');
    if (!shell) return null;
    if (getComputedStyle(shell).position === 'static') shell.style.position = 'relative';
    var el = document.createElement('div');
    el.id = 'session-pre-timer';
    el.setAttribute('role','button');
    el.setAttribute('tabindex','0');
    el.setAttribute('aria-label','Hoppa över femsekunders nedräkning');
    el.innerHTML = '<div id="session-pre-timer-ring">' +
      '<div class="session-pre-copy">' +
        '<div id="session-pre-timer-value">5</div>' +
        '<div class="session-pre-label">Gör dig redo</div>' +
        '<div class="session-pre-skip">Tryck för att hoppa över</div>' +
      '</div></div>';
    el.addEventListener('click', finishPretimer);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finishPretimer(); }
    });
    shell.appendChild(el);
    return el;
  }

  function updatePretimer() {
    if (!pretimerActive) return;
    var remain = Math.max(0, pretimerDeadline - Date.now());
    var sec = Math.max(1, Math.ceil(remain / 1000));
    var value = document.getElementById('session-pre-timer-value');
    var ring = document.getElementById('session-pre-timer-ring');
    if (value) value.textContent = String(sec);
    if (ring) {
      var elapsed = Math.max(0, Math.min(5000, 5000 - remain));
      ring.style.setProperty('--pre-progress', ((elapsed / 5000) * 360) + 'deg');
    }
    if (remain <= 0) finishPretimer();
  }

  function startPretimer(done) {
    if (pretimerActive) return;
    var state = getState();
    if (!state || state.setRunning) { done(); return; }
    var el = ensurePretimer();
    if (!el) { done(); return; }
    pretimerActive = true;
    pretimerDone = done;
    pretimerDeadline = Date.now() + 5000;
    el.classList.add('show');
    updatePretimer();
    pretimerTimer = setInterval(updatePretimer, 50);
  }

  function finishPretimer() {
    if (!pretimerActive) return;
    pretimerActive = false;
    if (pretimerTimer) clearInterval(pretimerTimer);
    pretimerTimer = null;
    var el = document.getElementById('session-pre-timer');
    if (el) el.classList.remove('show');
    var done = pretimerDone;
    pretimerDone = null;
    if (typeof done === 'function') done();
  }

  function cancelPretimer() {
    pretimerDone = null;
    pretimerActive = false;
    if (pretimerTimer) clearInterval(pretimerTimer);
    pretimerTimer = null;
    var el = document.getElementById('session-pre-timer');
    if (el) el.classList.remove('show');
  }

  function textOf(obj) {
    if (!obj || typeof obj !== 'object') return '';
    return [obj.type,obj.name,obj.kind,obj.exercise,obj.category,obj.mode,obj.activity].filter(Boolean).join(' ').toLowerCase();
  }

  function isRunningText(text) {
    text = String(text || '').toLowerCase();
    if (/cross\s*-?trainer|crosstrainer|ellipt/.test(text)) return false;
    return /\blöp|löpning|löpband|running|\brun\b|jogg/.test(text);
  }

  function isCardio(ex) {
    var text = textOf(ex);
    return ex && (ex.kind === 'cardio' || /kondition|cardio|cross\s*-?trainer|crosstrainer|ellipt|cyk|spinning|rodd|running|\blöp|jogg/.test(text));
  }

  function number(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function runningDistanceFromWorkout(w) {
    if (!w || typeof w !== 'object') return 0;
    var topText = textOf(w);
    var runningTop = isRunningText(topText);
    if (runningTop) {
      var top = number(w.actualDistance) || number(w.runDistance) || number(w.distance) || number(w.km);
      if (top > 0) return top;
    }

    var exercises = Array.isArray(w.exercises) ? w.exercises : [];
    var total = 0;
    exercises.forEach(function (ex, idx) {
      if (!isRunningText(textOf(ex))) return;
      var direct = number(ex.actualDistance) || number(ex.distance) || number(ex.km);
      if (direct > 0) { total += direct; return; }
      var logs = [];
      if (Array.isArray(ex.logs)) logs = ex.logs;
      else if (Array.isArray(w.logs) && Array.isArray(w.logs[idx])) logs = w.logs[idx];
      var logged = logs.reduce(function (sum, l) { return sum + (number(l.actualDistance) || number(l.distance)); }, 0);
      total += logged;
    });
    return total;
  }

  function getWorkoutsSafe() {
    try {
      if (typeof window.getWorkouts === 'function') return window.getWorkouts() || [];
      if (typeof getWorkouts === 'function') return getWorkouts() || [];
    } catch (e) {}
    return [];
  }

  function updateLongestRunUi() {
    var workouts = getWorkoutsSafe();
    if (!Array.isArray(workouts)) return;
    var longest = workouts.reduce(function (m, w) { return Math.max(m, runningDistanceFromWorkout(w)); }, 0);
    document.querySelectorAll('.stat-card,.goal-card').forEach(function (card) {
      var txt = (card.textContent || '').toLowerCase();
      if (txt.indexOf('längsta') < 0 || (txt.indexOf('distans') < 0 && txt.indexOf('löp') < 0)) return;
      var value = card.querySelector('.stat-val,.goal-cur');
      if (value) value.innerHTML = (Math.round(longest * 100) / 100).toString().replace('.', ',') + '<small> km</small>';
    });
  }

  function strengthVolumeFromExercise(ex, logs) {
    if (!ex || isCardio(ex)) return 0;
    logs = Array.isArray(logs) ? logs : (Array.isArray(ex.logs) ? ex.logs : []);
    if (logs.length) {
      return logs.reduce(function (sum, l) {
        return sum + number(l.actualReps || l.reps) * number(l.actualWeight || l.weight);
      }, 0);
    }
    return number(ex.plannedSets || ex.sets || 1) * number(ex.reps) * number(ex.weight);
  }

  function strengthVolumeFromWorkout(w) {
    if (!w || typeof w !== 'object') return 0;
    if (Array.isArray(w.exercises)) {
      return w.exercises.reduce(function (sum, ex, idx) {
        var logs = Array.isArray(w.logs) && Array.isArray(w.logs[idx]) ? w.logs[idx] : null;
        return sum + strengthVolumeFromExercise(ex, logs);
      }, 0);
    }
    if (!isCardio(w)) {
      if (Array.isArray(w.sets)) {
        return w.sets.reduce(function (sum, s) { return sum + number(s.actualReps || s.reps) * number(s.actualWeight || s.weight); }, 0);
      }
      return number(w.sets || 1) * number(w.reps) * number(w.weight);
    }
    return 0;
  }

  function normalizeVolumes(list) {
    if (!Array.isArray(list)) return list;
    list.forEach(function (w) {
      if (!w || typeof w !== 'object') return;
      var volume = strengthVolumeFromWorkout(w);
      if ('volume' in w || volume > 0) w.volume = volume;
      if ('volumeKg' in w) w.volumeKg = volume;
      if ('totalVolume' in w) w.totalVolume = volume;
      if ('totalVolumeKg' in w) w.totalVolumeKg = volume;
    });
    return list;
  }

  function updateVolumeUi() {
    document.querySelectorAll('[data-volume],.workout-volume,.wk-volume').forEach(function (el) {
      var index = Number(el.dataset && el.dataset.workoutIndex);
      var workouts = getWorkoutsSafe();
      if (!Number.isFinite(index) || !workouts[index]) return;
      el.textContent = Math.round(strengthVolumeFromWorkout(workouts[index])).toLocaleString('sv-SE') + ' kg';
    });
  }

  function renameTrainingMode() {
    var button = document.getElementById('session-view-toggle');
    if (button && /Hype Mode/i.test(button.textContent || '')) {
      button.textContent = (button.textContent || '').replace(/Hype Mode/gi, 'Träningsläge');
    }
    document.querySelectorAll('#session-modal button,#session-modal .session-title,#session-modal [class*="hype"]').forEach(function (el) {
      if (el.children.length) return;
      if (/Hype Mode/i.test(el.textContent || '')) el.textContent = el.textContent.replace(/Hype Mode/gi, 'Träningsläge');
    });
  }

  function install() {
    addStyles();
    ensurePretimer();

    var attempts = 0;
    function bind() {
      attempts++;
      if (typeof window.startCurrentSet !== 'function' || typeof window.startNextSet !== 'function' || typeof window.renderSessionMode !== 'function') {
        if (attempts < 60) setTimeout(bind, 100);
        return;
      }
      if (window.__exercisePoints367Installed) return;
      window.__exercisePoints367Installed = true;

      var previousStart = window.startCurrentSet;
      var previousNext = window.startNextSet;
      var previousRender = window.renderSessionMode;
      var previousStop = window.stopSessionMode;
      var previousSaveWorkouts = window.saveWorkouts;

      window.startCurrentSet = function () {
        var self = this, args = arguments;
        if (pretimerActive) return;
        startPretimer(function () { previousStart.apply(self, args); });
      };

      window.startNextSet = function () {
        var self = this, args = arguments;
        if (pretimerActive) return;
        startPretimer(function () { previousNext.apply(self, args); });
      };

      window.renderSessionMode = function () {
        var result = previousRender.apply(this, arguments);
        renameTrainingMode();
        updateLongestRunUi();
        updateVolumeUi();
        return result;
      };

      if (typeof previousStop === 'function') {
        window.stopSessionMode = function () {
          cancelPretimer();
          return previousStop.apply(this, arguments);
        };
      }

      if (typeof previousSaveWorkouts === 'function') {
        window.saveWorkouts = function (workouts) {
          if (internalSave) return previousSaveWorkouts.apply(this, arguments);
          internalSave = true;
          try {
            normalizeVolumes(workouts);
            return previousSaveWorkouts.call(this, workouts);
          } finally {
            internalSave = false;
            setTimeout(function () { updateLongestRunUi(); updateVolumeUi(); }, 0);
          }
        };
        try {
          var existing = getWorkoutsSafe();
          if (Array.isArray(existing) && existing.length) {
            normalizeVolumes(existing);
            window.saveWorkouts(existing);
          }
        } catch (e) {}
      }

      renameTrainingMode();
      updateLongestRunUi();
      updateVolumeUi();
      setInterval(function () {
        renameTrainingMode();
        updateLongestRunUi();
      }, 1500);
    }
    bind();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
