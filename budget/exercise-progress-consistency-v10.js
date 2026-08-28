(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function getStoredPlan(date) {
    if (!date) return null;
    try {
      var raw = localStorage.getItem('ex_plannedSessions');
      var all = raw ? JSON.parse(raw) : {};
      return all && all[date] ? all[date] : null;
    } catch (_) { return null; }
  }

  function normalizeBetween(raw) {
    raw = raw || {};
    if (raw.enabled === false) return {type:'none',seconds:30,name:''};
    var type = raw.type === 'custom' ? 'custom' : (raw.type === 'rest' ? 'rest' : 'none');
    return {
      type:type,
      seconds:Math.max(1,Math.round(Number(raw.seconds) || (type === 'rest' ? 60 : 30))),
      name:type === 'custom' ? String(raw.name || '').trim() : ''
    };
  }

  function customKey(raw) {
    var cfg = normalizeBetween(raw);
    if (cfg.type !== 'custom' || !cfg.name) return '';
    return cfg.name.toLocaleLowerCase('sv-SE') + '|' + cfg.seconds;
  }

  function runtimeFor(state) {
    return state && state.__betweenCustomRuntimeV3 ? state.__betweenCustomRuntimeV3 : null;
  }

  function baseExercise(state,index,planExercise) {
    var runtime = runtimeFor(state);
    if (runtime && Number(runtime.index) === index && runtime.originalExercise) return runtime.originalExercise;
    var ex = state && Array.isArray(state.exercises) ? state.exercises[index] : null;
    if (ex && !ex.__betweenCustomV3 && !ex.__betweenCustomSavedV3 && !ex.__betweenCustomSavedV7) return ex;
    if (!planExercise) return ex || null;
    var kind = planExercise.kind === 'cardio' ? 'cardio' : 'strength';
    return kind === 'cardio'
      ? {kind:'cardio',name:planExercise.name || '',plannedSets:1}
      : {kind:'strength',name:planExercise.name || '',plannedSets:Math.max(1,Number(planExercise.sets) || 1)};
  }

  function baseLogs(state,index) {
    var runtime = runtimeFor(state);
    if (runtime && Number(runtime.index) === index && Array.isArray(runtime.originalLogs)) return runtime.originalLogs;
    var logs = state && Array.isArray(state.logs) ? state.logs[index] : null;
    return Array.isArray(logs) ? logs : [];
  }

  function buildCanonicalPlan(state) {
    var stored = getStoredPlan(state && state.date) || {};
    var planExercises = Array.isArray(stored.exercises) ? stored.exercises : [];
    var baseCount = planExercises.length;
    if (!baseCount && state && Array.isArray(state.exercises)) {
      baseCount = state.exercises.filter(function (ex) {
        return ex && !ex.__betweenCustomSavedV3 && !ex.__betweenCustomSavedV7;
      }).length;
    }

    var globalBetween = normalizeBetween(stored.betweenExercises || stored.betweenSets);
    var segments = [];

    for (var i = 0; i < baseCount; i++) {
      var plannedEx = planExercises[i] || null;
      var ex = baseExercise(state,i,plannedEx);
      if (!ex) continue;
      var sets = Math.max(1,Number(ex.plannedSets) || (plannedEx && Number(plannedEx.sets)) || 1);
      var kind = ex.kind === 'cardio' ? 'cardio' : 'strength';
      var perSet = normalizeBetween(plannedEx && plannedEx.betweenSets);

      for (var setIndex = 0; setIndex < sets; setIndex++) {
        segments.push({
          type:'base',
          kind:kind,
          exIndex:i,
          setIndex:setIndex
        });

        if (setIndex < sets - 1 && perSet.type === 'custom' && perSet.name) {
          segments.push({
            type:'custom',
            kind:'cardio',
            key:customKey(perSet),
            exIndex:i,
            transition:'next'
          });
        }
      }

      if (i < baseCount - 1 && globalBetween.type === 'custom' && globalBetween.name) {
        segments.push({
          type:'custom',
          kind:'cardio',
          key:customKey(globalBetween),
          exIndex:i,
          transition:'finish'
        });
      }
    }

    return segments;
  }

  function completedCustomByKey(state) {
    var counts = Object.create(null);
    function add(name,seconds,logs) {
      if (!Array.isArray(logs) || !logs.length) return;
      var key = customKey({type:'custom',name:name,seconds:seconds});
      if (!key) return;
      counts[key] = (counts[key] || 0) + logs.length;
    }

    var archive = state && state.__betweenCustomArchiveV7;
    if (archive) Object.keys(archive).forEach(function (key) {
      var summary = archive[key];
      if (summary) add(summary.name,summary.seconds,summary.logs);
    });

    var summary = state && state.__betweenCustomSummaryV3;
    if (summary) add(summary.name,summary.seconds,summary.logs);

    var runtime = runtimeFor(state);
    if (runtime && state && Array.isArray(state.logs) && Array.isArray(state.logs[runtime.index])) {
      var current = state.exercises && state.exercises[runtime.index];
      if (current && current.__betweenCustomV3) add(current.name,Math.round(Number(current.time || 0) * 60),state.logs[runtime.index]);
    }
    return counts;
  }

  function currentCustomKey(state) {
    var runtime = runtimeFor(state);
    if (!runtime || !state || !Array.isArray(state.exercises)) return '';
    var current = state.exercises[runtime.index];
    if (!current || !current.__betweenCustomV3) return '';
    return customKey({type:'custom',name:current.name,seconds:Math.round(Number(current.time || 0) * 60)});
  }

  function calculate(state) {
    var plan = buildCanonicalPlan(state);
    var baseDone = Object.create(null);
    var baseCount = 0;

    plan.forEach(function (segment) {
      if (segment.type !== 'base') return;
      if (!Object.prototype.hasOwnProperty.call(baseDone,segment.exIndex)) {
        baseDone[segment.exIndex] = baseLogs(state,segment.exIndex).length;
      }
    });

    var customLeft = completedCustomByKey(state);
    var activeCustomKey = currentCustomKey(state);
    var activeCustomAssigned = false;
    var completed = 0;

    plan.forEach(function (segment) {
      segment.done = false;
      segment.current = false;

      if (segment.type === 'base') {
        segment.done = segment.setIndex < (baseDone[segment.exIndex] || 0);
        if (segment.done) completed++;

        var runtime = runtimeFor(state);
        var isRuntimeIndex = runtime && Number(runtime.index) === segment.exIndex;
        if (!segment.done && !isRuntimeIndex && Number(state.exerciseIndex) === segment.exIndex &&
            segment.setIndex === Math.max(0,(Number(state.currentSet) || 1) - 1)) {
          segment.current = true;
        }
        return;
      }

      var left = customLeft[segment.key] || 0;
      if (left > 0) {
        segment.done = true;
        customLeft[segment.key] = left - 1;
        completed++;
      } else if (!activeCustomAssigned && activeCustomKey && segment.key === activeCustomKey) {
        segment.current = true;
        activeCustomAssigned = true;
      }
    });

    return {segments:plan,total:plan.length,completed:Math.min(plan.length,completed)};
  }

  function classesFor(segment) {
    var classes = ['hype-progress-segment',segment.kind === 'cardio' ? 'cardio' : 'strength'];
    if (segment.type === 'custom') classes.push('canonical-custom-v10');
    if (segment.done) classes.push('done');
    else if (segment.current) classes.push('current');
    return classes.join(' ');
  }

  function domMatches(result,percentEl,countEl,track) {
    if (!percentEl || !countEl || !track) return false;
    var percent = result.total ? Math.round(result.completed / result.total * 100) : 0;
    if (percentEl.textContent !== percent + '%') return false;
    if (countEl.textContent !== result.completed + ' / ' + result.total + ' moment klara') return false;
    if (track.children.length !== result.segments.length) return false;
    for (var i = 0; i < result.segments.length; i++) {
      if (track.children[i].className !== classesFor(result.segments[i])) return false;
    }
    return true;
  }

  function renderCanonicalProgress() {
    var state = getState();
    var track = document.getElementById('hype-progress-track');
    var percentEl = document.getElementById('hype-progress-percent');
    var countEl = document.getElementById('hype-progress-count');
    if (!state || !track || !percentEl || !countEl) return;

    var result = calculate(state);
    if (domMatches(result,percentEl,countEl,track)) return;

    var percent = result.total ? Math.round(result.completed / result.total * 100) : 0;
    percentEl.textContent = percent + '%';
    countEl.textContent = result.completed + ' / ' + result.total + ' moment klara';

    var fragment = document.createDocumentFragment();
    result.segments.forEach(function (segment) {
      var el = document.createElement('span');
      el.className = classesFor(segment);
      if (segment.type === 'custom') el.setAttribute('data-progress-custom-v10','true');
      fragment.appendChild(el);
    });
    track.innerHTML = '';
    track.appendChild(fragment);
  }

  function addStyles() {
    if (document.getElementById('exercise-progress-consistency-v10-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-progress-consistency-v10-style';
    style.textContent = `
      /* The large builder 5-second panel is obsolete. The compact top toggle
         is the only builder control; keep the source panel permanently hidden. */
      html body #day-workout-modal #pretimer-builder-v2 {
        display:none !important;
        visibility:hidden !important;
        height:0 !important;
        min-height:0 !important;
        margin:0 !important;
        padding:0 !important;
        border:0 !important;
        overflow:hidden !important;
      }
      .hype-progress-segment.canonical-custom-v10 {
        background:#F59E0B;
      }
      .hype-progress-segment.canonical-custom-v10.done {
        box-shadow:0 0 8px rgba(245,158,11,.34);
      }
    `;
    document.head.appendChild(style);
  }

  function loop() {
    renderCanonicalProgress();
    requestAnimationFrame(loop);
  }

  function install() {
    if (window.__exerciseProgressConsistencyV10Installed) return;
    window.__exerciseProgressConsistencyV10Installed = true;
    addStyles();
    requestAnimationFrame(loop);
    window.__exerciseProgressConsistencyV10 = {calculate:calculate,render:renderCanonicalProgress};
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
