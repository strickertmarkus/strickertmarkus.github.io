(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var originalGetPlanned = null;
  var activeTransition = '';
  var activeState = null;
  var clearTimer = null;

  function normalizeConfig(raw) {
    raw = raw || {};
    if (raw.enabled === false) return { type:'none', seconds:30, name:'' };
    var type = raw.type === 'custom' ? 'custom' : (raw.type === 'rest' ? 'rest' : 'none');
    return {
      type:type,
      seconds:Math.max(1,Math.round(Number(raw.seconds) || (type === 'rest' ? 60 : 30))),
      name:type === 'custom' ? String(raw.name || '').trim() : ''
    };
  }

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function transitionKind(button, state) {
    var text = String(button && button.textContent || '').trim().toLowerCase();
    if (text.indexOf('starta nästa set') === 0) return 'next';
    if (text.indexOf('extra set') === 0) return 'extra';
    if (text.indexOf('övning klar') === 0) {
      return Array.isArray(state && state.exercises) && Number(state.exerciseIndex) + 1 < state.exercises.length ? 'finish' : '';
    }
    return '';
  }

  function configForTransition(planned, state, transition) {
    if (!state || !state.date || !planned) return normalizeConfig(null);
    var plan = planned[state.date];
    if (!plan) return normalizeConfig(null);

    if (transition === 'finish') {
      if (plan.betweenExercises) return normalizeConfig(plan.betweenExercises);
      if (plan.betweenSets) return normalizeConfig(plan.betweenSets);
      return normalizeConfig(null);
    }

    if (transition === 'next' || transition === 'extra') {
      var index = Number(state.exerciseIndex) || 0;
      var exercise = Array.isArray(plan.exercises) ? plan.exercises[index] : null;
      return normalizeConfig(exercise && exercise.betweenSets);
    }

    return normalizeConfig(null);
  }

  function installGetPlannedRouter() {
    if (originalGetPlanned || typeof window.getPlannedSessions !== 'function') return !!originalGetPlanned;
    originalGetPlanned = window.getPlannedSessions;

    window.getPlannedSessions = function () {
      var planned = originalGetPlanned.apply(this, arguments) || {};
      if (!activeTransition || !activeState || !activeState.date || !planned[activeState.date]) return planned;

      var routed = Object.assign({}, planned);
      var plan = Object.assign({}, planned[activeState.date]);
      plan.betweenSets = configForTransition(planned, activeState, activeTransition);
      routed[activeState.date] = plan;
      return routed;
    };
    return true;
  }

  function summaryKey(summary) {
    return String(summary && summary.name || 'Valfri övning').trim().toLocaleLowerCase('sv-SE') + '|' +
      Math.max(1,Math.round(Number(summary && summary.seconds) || 30));
  }

  function archiveMap(state) {
    if (!state.__betweenCustomArchiveV7) state.__betweenCustomArchiveV7 = Object.create(null);
    return state.__betweenCustomArchiveV7;
  }

  function archiveSummary(state, summary) {
    if (!state || !summary || !Array.isArray(summary.logs) || !summary.logs.length) return;
    var map = archiveMap(state);
    var key = summaryKey(summary);
    if (!map[key]) {
      map[key] = {
        name:summary.name || 'Valfri övning',
        seconds:Math.max(1,Math.round(Number(summary.seconds) || 30)),
        logs:[]
      };
    }
    summary.logs.forEach(function (log) { map[key].logs.push(Object.assign({},log)); });
  }

  function maybeArchiveBeforeNewCustom(state, nextConfig) {
    if (!state || nextConfig.type !== 'custom' || !nextConfig.name) return;
    var current = state.__betweenCustomSummaryV3;
    if (!current || !Array.isArray(current.logs) || !current.logs.length) return;
    if (summaryKey(current) === summaryKey(nextConfig)) return;
    archiveSummary(state,current);
  }

  function injectArchivesForSave(state) {
    if (!state || state.__betweenCustomArchiveInjectedV7) return;

    var current = state.__betweenCustomSummaryV3;
    if (current && Array.isArray(current.logs) && current.logs.length) {
      archiveSummary(state,current);
      state.__betweenCustomSummaryV3 = {
        name:current.name,
        seconds:current.seconds,
        logs:[]
      };
    }

    var map = archiveMap(state);
    Object.keys(map).forEach(function (key) {
      var summary = map[key];
      if (!summary || !summary.logs.length) return;
      state.exercises.push({
        kind:'cardio',
        name:summary.name,
        distance:0,
        time:summary.seconds / 60,
        plannedSets:summary.logs.length,
        __betweenCustomSavedV7:true
      });
      state.logs.push(summary.logs.map(function (log,index) {
        var copy = Object.assign({},log);
        copy.setNo = index + 1;
        return copy;
      }));
    });
    state.__betweenCustomArchiveInjectedV7 = true;
  }

  function fmtSec(sec) {
    sec = Math.max(0,Math.round(Number(sec) || 0));
    return String(Math.floor(sec / 60)).padStart(2,'0') + ':' + String(sec % 60).padStart(2,'0');
  }

  function syncArchiveRows() {
    var state = getState();
    var tbody = document.getElementById('session-plan-table');
    if (!state || !tbody) return;
    tbody.querySelectorAll('tr[data-between-custom-archive-v7]').forEach(function (row) { row.remove(); });
    var map = state.__betweenCustomArchiveV7;
    if (!map) return;
    Object.keys(map).forEach(function (key) {
      var summary = map[key];
      if (!summary || !summary.logs || !summary.logs.length) return;
      var duration = summary.logs.reduce(function (sum,log) { return sum + (Number(log.durationSec) || 0); },0);
      var row = document.createElement('tr');
      row.setAttribute('data-between-custom-archive-v7','true');
      row.innerHTML = '<td></td><td></td><td></td><td></td>';
      var cells = row.querySelectorAll('td');
      cells[0].textContent = summary.name;
      var chip = document.createElement('span');
      chip.className = 'between-custom-chip-v3';
      chip.textContent = 'Mellanövning';
      cells[0].appendChild(chip);
      cells[1].textContent = summary.seconds + ' sek';
      cells[2].textContent = String(summary.logs.length);
      cells[3].textContent = fmtSec(duration);
      tbody.appendChild(row);
    });
  }

  function addClarificationStyles() {
    if (document.getElementById('exercise-between-routing-v7-clarification')) return;
    var style = document.createElement('style');
    style.id = 'exercise-between-routing-v7-clarification';
    style.textContent = 'body #day-workout-modal #pretimer-builder-v2{display:flex!important}';
    document.head.appendChild(style);
  }

  function clearRouteSoon() {
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer = setTimeout(function () {
      activeTransition = '';
      activeState = null;
      clearTimer = null;
    }, 0);
  }

  function handleCapture(event) {
    var button = event.target && event.target.closest ? event.target.closest('button') : null;
    if (!button) return;
    var state = getState();
    if (!state) return;

    if (button.closest('#session-complete-box') && /spara pass/i.test(button.textContent || '')) {
      injectArchivesForSave(state);
      return;
    }

    if (!button.closest('#session-controls') || state.setRunning || !state.awaitingDecision || state.__betweenCustomRuntimeV3) return;
    var transition = transitionKind(button,state);
    if (!transition) return;

    var planned = originalGetPlanned ? (originalGetPlanned() || {}) : {};
    var nextConfig = configForTransition(planned,state,transition);
    maybeArchiveBeforeNewCustom(state,nextConfig);

    activeTransition = transition;
    activeState = state;
    clearRouteSoon();
  }

  function install() {
    if (window.__exerciseBetweenRoutingV7Installed) return;
    if (!installGetPlannedRouter()) { setTimeout(install,40); return; }
    window.__exerciseBetweenRoutingV7Installed = true;
    addClarificationStyles();
    document.addEventListener('click',handleCapture,true);
    setInterval(syncArchiveRows,220);
    window.__exerciseBetweenRoutingV7 = {
      configForTransition:configForTransition,
      normalizeConfig:normalizeConfig
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
