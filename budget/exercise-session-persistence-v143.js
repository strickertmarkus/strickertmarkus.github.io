(function () {
  'use strict';
  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseSessionPersistenceV143Installed) return;
  window.__exerciseSessionPersistenceV143Installed = true;
  var repairTimer = null;
  var wrapperTimer = null;
  var wrapperAttempts = 0;
  function clone(value) {
    if (value == null) return value;
    try { return JSON.parse(JSON.stringify(value)); }
    catch (_) { return value; }
  }
  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }
  function plansSafe() {
    try { return typeof window.getPlannedSessions === 'function' ? (window.getPlannedSessions() || {}) : {}; }
    catch (_) { return {}; }
  }
  function workoutsSafe() {
    try { return typeof window.getWorkouts === 'function' ? (window.getWorkouts() || []) : []; }
    catch (_) { return []; }
  }
  function sameExercise(a,b) {
    if (!a || !b) return false;
    var an = String(a.name || '').trim().toLocaleLowerCase('sv-SE');
    var bn = String(b.name || '').trim().toLocaleLowerCase('sv-SE');
    var ak = String(a.kind || ((a.distance || a.time) ? 'cardio' : 'strength'));
    var bk = String(b.kind || ((b.distance || b.time) ? 'cardio' : 'strength'));
    return !!an && an === bn && ak === bk;
  }
  function mergePlan(previous,incoming) {
    if (!previous || typeof previous !== 'object' || Array.isArray(previous)) return clone(incoming);
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return clone(incoming);
    var merged = Object.assign({}, clone(previous), clone(incoming));
    if (!Array.isArray(incoming.exercises)) return merged;
    var previousExercises = Array.isArray(previous.exercises) ? previous.exercises : [];
    var used = Object.create(null);
    merged.exercises = incoming.exercises.map(function (exercise,index) {
      var old = previousExercises[index];
      var oldIndex = index;
      if (!sameExercise(old,exercise)) {
        oldIndex = previousExercises.findIndex(function (candidate,candidateIndex) {
          return !used[candidateIndex] && sameExercise(candidate,exercise);
        });
        old = oldIndex >= 0 ? previousExercises[oldIndex] : null;
      }
      if (oldIndex >= 0) used[oldIndex] = true;
      if (!old || typeof old !== 'object') return clone(exercise);
      return Object.assign({}, clone(old), clone(exercise));
    });
    return merged;
  }
  function installPlannedSessionGuard() {
    var fn = window.savePlannedSessions;
    if (typeof fn !== 'function' || fn.__sessionPersistenceV143Wrapped) return false;
    var wrapped = function (next) {
      next = next && typeof next === 'object' ? next : {};
      var current = plansSafe();
      var output = {};
      Object.keys(next).forEach(function (date) {
        var incoming = next[date];
        var previous = current && current[date];
        output[date] = mergePlan(previous,incoming);
      });
      return fn.call(this,output);
    };
    wrapped.__sessionPersistenceV143Wrapped = true;
    wrapped.__sessionPersistenceV143Original = fn;
    window.savePlannedSessions = wrapped;
    return true;
  }
  function attachSnapshotToSession(date,snapshot) {
    var state = getState();
    if (!state || String(state.date || '') !== String(date || '') || !snapshot) return;
    state.__plannedSessionSnapshotV143 = clone(snapshot);
  }
  function installStartWrapper() {
    var fn = window.startWorkoutSessionForDate;
    if (typeof fn !== 'function' || fn.__sessionPersistenceV143Wrapped) return false;
    var wrapped = function (iso) {
      var before = plansSafe();
      var snapshot = before && before[iso] ? clone(before[iso]) : null;
      var result = fn.apply(this,arguments);
      attachSnapshotToSession(iso,snapshot);
      return result;
    };
    wrapped.__sessionPersistenceV143Wrapped = true;
    wrapped.__sessionPersistenceV143Original = fn;
    window.startWorkoutSessionForDate = wrapped;
    return true;
  }
  function recentDate(iso,days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return false;
    var parts = iso.split('-').map(Number);
    var then = new Date(parts[0],parts[1]-1,parts[2]);
    var now = new Date();
    var today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
    var age = Math.round((today - then) / 86400000);
    return age >= 0 && age <= days;
  }
  function planExerciseFromWorkout(exercise) {
    exercise = exercise || {};
    var kind = exercise.kind || ((Number(exercise.distance) > 0 || Number(exercise.time) > 0) ? 'cardio' : 'strength');
    if (kind === 'cardio') {
      return {
        kind:'cardio',
        name:String(exercise.name || ''),
        distance:Number(exercise.distance) || 0,
        time:Number(exercise.time) || 0
      };
    }
    return {
      kind:'strength',
      name:String(exercise.name || ''),
      sets:Math.max(1,Number(exercise.sets) || Number(exercise.plannedSets) || 1),
      reps:Number(exercise.reps) || 0,
      weight:Number(exercise.weight) || 0
    };
  }
  function fallbackPlanFromWorkout(workout) {
    if (!workout || !Array.isArray(workout.exercises) || !workout.exercises.length) return null;
    return {
      type:String(workout.type || 'Övrigt'),
      exercises:workout.exercises.map(planExerciseFromWorkout),
      __recoveredFromWorkoutV143:true
    };
  }
  function saveWorkoutSnapshot(date,snapshot,beforeIds) {
    var workouts = workoutsSafe();
    if (!Array.isArray(workouts) || !workouts.length || !date) return;
    var candidate = null;
    for (var i = workouts.length - 1; i >= 0; i--) {
      var workout = workouts[i];
      if (!workout || String(workout.date || '') !== String(date)) continue;
      if (!beforeIds || !beforeIds[String(workout.id)]) {
        candidate = workout;
        break;
      }
      if (!candidate) candidate = workout;
    }
    if (!candidate) return;
    var changed = false;
    if (snapshot) {
      candidate.plannedSession = clone(snapshot);
      candidate.planSnapshotVersion = 143;
      changed = true;
    }
    if (changed) {
      try { if (typeof window.saveWorkouts === 'function') window.saveWorkouts(workouts); }
      catch (_) {}
    }
  }
  function ensurePlanExists(date,snapshot) {
    if (!date) return;
    var planned = plansSafe();
    if (planned && planned[date] && Array.isArray(planned[date].exercises) && planned[date].exercises.length) return;
    var source = snapshot;
    if (!source) {
      var workouts = workoutsSafe();
      var latest = null;
      (workouts || []).forEach(function (workout) {
        if (!workout || String(workout.date || '') !== String(date)) return;
        if (!latest || Number(workout.id || 0) > Number(latest.id || 0)) latest = workout;
      });
      source = latest && (latest.plannedSession || fallbackPlanFromWorkout(latest));
    }
    if (!source) return;
    planned = Object.assign({},planned || {});
    planned[date] = clone(source);
    try { if (typeof window.savePlannedSessions === 'function') window.savePlannedSessions(planned); }
    catch (_) {}
  }
  function installSaveWrapper() {
    var fn = window.saveSessionWorkout;
    if (typeof fn !== 'function' || fn.__sessionPersistenceV143Wrapped) return false;
    var wrapped = function () {
      var state = getState();
      var date = state && state.date ? String(state.date) : '';
      var currentPlans = plansSafe();
      var snapshot = state && state.__plannedSessionSnapshotV143
        ? clone(state.__plannedSessionSnapshotV143)
        : (date && currentPlans[date] ? clone(currentPlans[date]) : null);
      var beforeIds = Object.create(null);
      workoutsSafe().forEach(function (workout) {
        if (workout) beforeIds[String(workout.id)] = true;
      });
      var result = fn.apply(this,arguments);
      if (date) {
        saveWorkoutSnapshot(date,snapshot,beforeIds);
        ensurePlanExists(date,snapshot);
      }
      return result;
    };
    wrapped.__sessionPersistenceV143Wrapped = true;
    wrapped.__sessionPersistenceV143Original = fn;
    window.saveSessionWorkout = wrapped;
    return true;
  }
  function repairRecentHistory() {
    if (typeof window.savePlannedSessions !== 'function' || typeof window.saveWorkouts !== 'function') return;
    var planned = plansSafe();
    var workouts = workoutsSafe();
    if (!planned || !Array.isArray(workouts)) return;
    var plannedChanged = false;
    var workoutChanged = false;
    var nextPlans = Object.assign({},planned);
    workouts.forEach(function (workout) {
      if (!workout || !recentDate(workout.date,14)) return;
      if (String(workout.notes || '') !== 'Skapad i passläge') return;
      var date = String(workout.date || '');
      var plan = nextPlans[date];
      if ((!plan || !Array.isArray(plan.exercises) || !plan.exercises.length) && workout.plannedSession) {
        nextPlans[date] = clone(workout.plannedSession);
        plan = nextPlans[date];
        plannedChanged = true;
      }
      if (!plan || !Array.isArray(plan.exercises) || !plan.exercises.length) {
        var recovered = fallbackPlanFromWorkout(workout);
        if (recovered) {
          nextPlans[date] = recovered;
          plan = recovered;
          plannedChanged = true;
        }
      }
      if (!workout.plannedSession && plan && Array.isArray(plan.exercises) && plan.exercises.length) {
        workout.plannedSession = clone(plan);
        workout.planSnapshotVersion = 143;
        workoutChanged = true;
      }
    });
    try {
      if (plannedChanged) window.savePlannedSessions(nextPlans);
      if (workoutChanged) window.saveWorkouts(workouts);
    } catch (_) {}
  }
  function queueRepair(delay) {
    if (repairTimer) clearTimeout(repairTimer);
    repairTimer = setTimeout(function () {
      repairTimer = null;
      repairRecentHistory();
    },Math.max(0,Number(delay) || 0));
  }
  function ensureWrappers() {
    installPlannedSessionGuard();
    installStartWrapper();
    installSaveWrapper();
  }
  function install() {
    ensureWrappers();
    queueRepair(0);
    setTimeout(function () { ensureWrappers(); queueRepair(0); },1200);
    setTimeout(function () { ensureWrappers(); queueRepair(0); },3800);
    wrapperTimer = setInterval(function () {
      wrapperAttempts += 1;
      ensureWrappers();
      if (wrapperAttempts >= 24) {
        clearInterval(wrapperTimer);
        wrapperTimer = null;
      }
    },500);
    window.addEventListener('firebase-sync',function (event) {
      var key = event && event.detail && event.detail.key;
      if (key === 'ex_wk' || key === 'ex_plannedSessions') queueRepair(250);
    });
    window.addEventListener('firebase-force-sync',function () { queueRepair(350); });
    window.__exerciseSessionPersistenceV143 = {
      repair:repairRecentHistory,
      ensureWrappers:ensureWrappers
    };
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',install,{once:true});
  } else {
    install();
  }
})();
