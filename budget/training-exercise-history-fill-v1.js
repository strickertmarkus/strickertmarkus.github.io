/*
 * Pass builder: picking a strength exercise you have done before (Axelpress …) fills in the
 * sets, reps and weight from your heaviest logged time with it: the highest weight, the reps you
 * did at that weight and how many sets that pass had. Bodyweight exercises take the most reps.
 * Only when the exercise is picked (the name picker's change event), so values you type yourself
 * afterwards are kept. Works in the day builder (#day-workout-ex-list) and the template editor
 * that shares it. Reads the log through getWorkouts() in archive/exercise.html.
 */
(function () {
  'use strict';
  var list = document.getElementById('day-workout-ex-list');
  if (!list) return;

  function key(name) {
    try { if (typeof window.exerciseNameKey === 'function') return window.exerciseNameKey(name); } catch (_) {}
    return String(name || '').trim().toLocaleLowerCase('sv-SE');
  }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }

  // The best logged time with this exercise: highest weight, then most reps, then latest.
  function best(name) {
    var wanted = key(name), top = null;
    var workouts = [];
    try { workouts = typeof window.getWorkouts === 'function' ? window.getWorkouts() || [] : []; } catch (_) {}
    workouts.forEach(function (w) {
      (Array.isArray(w && w.exercises) ? w.exercises : []).forEach(function (ex) {
        if (!ex || key(ex.name) !== wanted || ex.kind === 'cardio') return;
        var bodyweight = ex.weightMode === 'bodyweight';
        var logs = Array.isArray(ex.logs) && ex.logs.length ? ex.logs : null;
        var weight = 0, reps = 0, sets = logs ? logs.length : Math.max(1, num(ex.sets));
        if (logs) {
          logs.forEach(function (l) {
            var lw = bodyweight ? 0 : num(l.actualWeight != null ? l.actualWeight : ex.weight), lr = num(l.actualReps != null ? l.actualReps : ex.reps);
            if (lw > weight || (lw === weight && lr > reps)) { weight = lw; reps = lr; }
          });
        } else {
          weight = bodyweight ? 0 : num(ex.weight);
          reps = num(ex.reps);
        }
        if (!reps && !weight) return;
        var cand = { weight: weight, reps: reps, sets: sets, bodyweight: bodyweight, date: String(w.date || '') };
        if (!top || cand.weight > top.weight || (cand.weight === top.weight && (cand.reps > top.reps || (cand.reps === top.reps && cand.date > top.date)))) top = cand;
      });
    });
    return top;
  }

  function setValue(input, value) {
    if (!input || input.disabled) return;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  list.addEventListener('change', function (e) {
    var input = e.target;
    if (!input.matches || !input.matches('.exercise-name-picker-input-v1')) return;
    var row = input.closest('.ex-row-item');
    var kind = row && row.querySelector('[class$="-kind"]');
    if (!row || (kind && kind.value === 'cardio')) return;
    // Once per chosen name: a change event for the same name (re-renders, typing) changes nothing.
    var name = String(input.value || '').trim();
    if (!name || row.dataset.historyFilledFor === key(name)) return;
    row.dataset.historyFilledFor = key(name);
    var found = best(name);
    if (!found) return;
    if (found.bodyweight && typeof window.setExerciseWeightMode === 'function') window.setExerciseWeightMode(row, 'bodyweight');
    setValue(row.querySelector('[data-role="sets"]'), found.sets);
    setValue(row.querySelector('[data-role="reps"]'), found.reps);
    if (!found.bodyweight) setValue(row.querySelector('[data-role="weight"]'), found.weight);
  });
})();
