(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var lastVolumeSignature = '';
  var normalizing = false;

  function getWorkoutsSafe() {
    try {
      return typeof window.getWorkouts === 'function' ? (window.getWorkouts() || []) : [];
    } catch (e) { return []; }
  }

  function saveWorkoutsSafe(list) {
    try {
      if (typeof window.saveWorkouts === 'function') window.saveWorkouts(list);
    } catch (e) {}
  }

  function num(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function isCardio(ex) {
    if (!ex || typeof ex !== 'object') return false;
    if (ex.kind === 'cardio') return true;
    if (ex.kind === 'strength') return false;
    return num(ex.distance) > 0 || num(ex.time) > 0;
  }

  function strengthVolume(workout) {
    var exercises = Array.isArray(workout && workout.exercises) ? workout.exercises : [];
    return exercises.reduce(function (sum, ex) {
      if (!ex || isCardio(ex)) return sum;
      var sets = num(ex.sets || ex.plannedSets || 1);
      var reps = num(ex.reps);
      var weight = num(ex.weight);
      return sum + sets * reps * weight;
    }, 0);
  }

  function cardioDistance(workout) {
    var exercises = Array.isArray(workout && workout.exercises) ? workout.exercises : [];
    return exercises.reduce(function (sum, ex) {
      return sum + (isCardio(ex) ? num(ex.distance) : 0);
    }, 0);
  }

  function volumeDisplay(workout) {
    var volume = strengthVolume(workout);
    if (volume > 0) return Math.round(volume).toLocaleString('sv-SE') + ' kg';
    var distance = cardioDistance(workout);
    if (distance > 0) return String(Math.round(distance * 100) / 100).replace('.', ',') + ' km';
    return '—';
  }

  function addStyles() {
    if (document.getElementById('exercise-log-details-v4-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-log-details-v4-style';
    style.textContent = `
      .hr-log-triple-v4 {
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:10px;
        margin-bottom:14px;
      }
      .hr-log-triple-v4 .form-group {
        min-width:0;
        margin-bottom:0;
      }
      .hr-log-triple-v4 input {
        min-width:0;
      }
      @media(max-width:600px) {
        .hr-log-triple-v4 { gap:6px; }
        .hr-log-triple-v4 .form-group label {
          font-size:9px !important;
          letter-spacing:.4px !important;
        }
        .hr-log-triple-v4 .form-group input {
          padding:7px 6px !important;
          font-size:11px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function workoutIdFromDetail(detail) {
    if (!detail || !/^detail-\d+$/.test(detail.id || '')) return null;
    var n = Number(String(detail.id).replace('detail-', ''));
    return Number.isFinite(n) ? n : null;
  }

  function ensureInlineHeartRateLayout() {
    document.querySelectorAll('tr.log-detail[id^="detail-"]').forEach(function (detail) {
      var id = workoutIdFromDetail(detail);
      if (!id) return;

      var avg = document.getElementById('in-hr-' + id);
      var min = document.getElementById('in-hr-min-' + id);
      var max = document.getElementById('in-hr-max-' + id);
      if (!avg || !min || !max) return;

      var avgGroup = avg.closest('.form-group');
      var minGroup = min.closest('.form-group');
      var maxGroup = max.closest('.form-group');
      if (!avgGroup || !minGroup || !maxGroup) return;

      var triple = detail.querySelector('.hr-log-triple-v4');
      if (!triple) {
        triple = document.createElement('div');
        triple.className = 'hr-log-triple-v4';
        triple.dataset.workoutId = String(id);

        var sourceRow = avgGroup.closest('.form-row');
        if (sourceRow && sourceRow.parentNode) sourceRow.insertAdjacentElement('afterend', triple);
        else {
          var box = detail.querySelector('.log-detail-box');
          if (box) box.insertBefore(triple, box.firstChild);
        }
      }

      if (minGroup.parentNode !== triple) triple.appendChild(minGroup);
      if (avgGroup.parentNode !== triple) triple.appendChild(avgGroup);
      if (maxGroup.parentNode !== triple) triple.appendChild(maxGroup);

      var oldRange = detail.querySelector('.hr-inline-range-v3');
      if (oldRange && !oldRange.children.length) oldRange.remove();
    });
  }

  function findWorkoutById(list, id) {
    return (list || []).find(function (w) { return Number(w && w.id) === Number(id); }) || null;
  }

  function syncVolumeUi() {
    var workouts = getWorkoutsSafe();
    document.querySelectorAll('tr.log-detail[id^="detail-"]').forEach(function (detail) {
      var id = workoutIdFromDetail(detail);
      var workout = findWorkoutById(workouts, id);
      if (!workout) return;
      var display = volumeDisplay(workout);

      var main = detail.previousElementSibling;
      if (main && main.classList.contains('log-main-row')) {
        var cells = main.querySelectorAll('td');
        if (cells[2] && cells[2].textContent !== display) cells[2].textContent = display;
      }

      detail.querySelectorAll('.form-group').forEach(function (group) {
        var label = group.querySelector('label');
        if (!label || String(label.textContent || '').trim().toLowerCase() !== 'passvolym') return;
        var input = group.querySelector('input');
        if (input && input.value !== display) input.value = display;
      });
    });
  }

  function normalizeStoredVolumes() {
    if (normalizing) return;
    var workouts = getWorkoutsSafe();
    var signature = JSON.stringify(workouts.map(function (w) {
      return [w && w.id, w && w.volume, w && w.volumeKg, w && w.totalVolume, w && w.totalVolumeKg,
        Array.isArray(w && w.exercises) ? w.exercises.map(function (ex) {
          return [ex && ex.kind, ex && ex.sets, ex && ex.plannedSets, ex && ex.reps, ex && ex.weight, ex && ex.distance, ex && ex.time];
        }) : []];
    }));
    if (signature === lastVolumeSignature) return;
    lastVolumeSignature = signature;

    var changed = false;
    workouts.forEach(function (w) {
      if (!w || typeof w !== 'object') return;
      var volume = strengthVolume(w);
      if (volume <= 0) return;
      if (num(w.volume) !== volume) { w.volume = volume; changed = true; }
      if (Object.prototype.hasOwnProperty.call(w, 'volumeKg') && num(w.volumeKg) !== volume) { w.volumeKg = volume; changed = true; }
      if (Object.prototype.hasOwnProperty.call(w, 'totalVolume') && num(w.totalVolume) !== volume) { w.totalVolume = volume; changed = true; }
      if (Object.prototype.hasOwnProperty.call(w, 'totalVolumeKg') && num(w.totalVolumeKg) !== volume) { w.totalVolumeKg = volume; changed = true; }
    });

    if (changed) {
      normalizing = true;
      try { saveWorkoutsSafe(workouts); }
      finally {
        normalizing = false;
        lastVolumeSignature = '';
      }
    }
  }

  function sync() {
    ensureInlineHeartRateLayout();
    normalizeStoredVolumes();
    syncVolumeUi();
  }

  function install() {
    addStyles();
    sync();
    setInterval(sync, 350);
    document.addEventListener('click', function (event) {
      if (event.target && event.target.closest && event.target.closest('.log-main-row')) {
        setTimeout(sync, 0);
      }
    }, false);
    window.__exerciseLogDetailsV4 = { sync:sync, strengthVolume:strengthVolume };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
