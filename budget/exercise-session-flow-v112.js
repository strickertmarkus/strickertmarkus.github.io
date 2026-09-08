(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseSessionFlowV114Installed) return;
  window.__exerciseSessionFlowV114Installed = true;

  var profile = String(new URLSearchParams(window.location.search).get('user') || 'markus').toLowerCase();
  var BETWEEN_KEY_PREFIX = 'ex_between_set_v2_' + profile + '_';
  var autoRestKey = '';
  var syncingLog = false;
  var greenBlueMode = false;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    var index = Number(state.exerciseIndex) || 0;
    return index >= 0 && index < state.exercises.length ? state.exercises[index] : null;
  }

  function normalizeBetween(raw) {
    raw = raw || {};
    if (raw.enabled === false) return {type:'none',seconds:30,name:''};
    var type = raw.type === 'rest' || raw.type === 'custom' ? raw.type : 'none';
    return {
      type:type,
      seconds:Math.max(1,Math.round(Number(raw.seconds) || (type === 'rest' ? 60 : 30))),
      name:type === 'custom' ? String(raw.name || '').trim() : ''
    };
  }

  function getPlansSafe() {
    try { return typeof window.getPlannedSessions === 'function' ? (window.getPlannedSessions() || {}) : {}; }
    catch (_) { return {}; }
  }

  function transitionConfig(state,transition) {
    if (!state || !state.date) return normalizeBetween(null);
    var plans = getPlansSafe();

    /* The routing layer knows the actual distinction between "between sets"
       and "between exercises". Use it when available so automatic rest follows
       the same configuration as a manual transition click. */
    try {
      var routing = window.__exerciseBetweenRoutingV7;
      if (routing && typeof routing.configForTransition === 'function') {
        return normalizeBetween(routing.configForTransition(plans,state,transition));
      }
    } catch (_) {}

    var plan = plans && plans[state.date];
    if (plan) {
      if (transition === 'finish') {
        return normalizeBetween(plan.betweenExercises || plan.betweenSets);
      }
      if (transition === 'next') {
        var exIndex = Math.max(0,Number(state.exerciseIndex) || 0);
        var plannedExercise = Array.isArray(plan.exercises) ? plan.exercises[exIndex] : null;
        if (plannedExercise && plannedExercise.betweenSets) return normalizeBetween(plannedExercise.betweenSets);
      }
    }

    /* Legacy fallback for older plans that stored one global between config. */
    try {
      var raw = localStorage.getItem(BETWEEN_KEY_PREFIX + state.date);
      if (raw) return normalizeBetween(JSON.parse(raw));
    } catch (_) {}
    return normalizeBetween(null);
  }

  function expectedTransition(state) {
    var ex = currentExercise(state);
    if (!state || !ex || !Array.isArray(state.exercises)) return null;
    var exIndex = Number(state.exerciseIndex) || 0;
    var currentSet = Math.max(1,Number(state.currentSet) || 1);
    var plannedSets = Math.max(1,Number(ex.plannedSets) || 1);
    if (currentSet < plannedSets) return 'next';
    if (exIndex + 1 < state.exercises.length) return 'finish';
    return null;
  }

  function findTransitionButton(kind) {
    var controls = document.getElementById('session-controls');
    if (!controls) return null;
    return Array.prototype.slice.call(controls.querySelectorAll('button')).find(function (button) {
      var text = String(button.textContent || '').trim().toLocaleLowerCase('sv-SE');
      var onclick = String(button.getAttribute('onclick') || '');
      if (kind === 'next') return text.indexOf('starta nästa set') === 0 || onclick.indexOf('startNextSet') >= 0;
      return text.indexOf('övning klar') === 0 || text.indexOf('starta nästa övning') === 0 || onclick.indexOf('finishCurrentExercise') >= 0;
    }) || null;
  }

  function tryStartConfiguredRest(attempt) {
    attempt = Number(attempt) || 0;
    var state = getState();
    if (!state || state.setRunning || !state.awaitingDecision) return;

    var kind = expectedTransition(state);
    if (!kind) return;
    var config = transitionConfig(state,kind);

    /* Custom between-exercises remain manual by design. Only true rest should
       begin automatically after the completed training period. */
    if (config.type !== 'rest') return;

    var key = [state.passStartedAt || '',state.exerciseIndex,state.currentSet,kind].join('|');
    if (autoRestKey === key) return;

    var overlay = document.getElementById('session-between-overlay-v2');
    if (overlay && overlay.classList.contains('show')) {
      autoRestKey = key;
      return;
    }

    var button = findTransitionButton(kind);
    if (!button) {
      if (attempt < 30) setTimeout(function () { tryStartConfiguredRest(attempt + 1); }, 35);
      return;
    }

    /* A synthetic decision-button click deliberately goes through the same
       capture routing as a manual click. That gives the existing rest timer
       ownership of the transition and avoids a second timer implementation. */
    autoRestKey = key;
    try { button.click(); }
    catch (_) { autoRestKey = ''; }
  }

  function escapeAttr(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/"/g,'&quot;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function strengthRowHtml(log,index) {
    return '<div class="set-tag">Set</div>' +
      '<input type="number" min="1" step="1" inputmode="numeric" aria-label="Set" data-session-log-v112="setNo" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Math.max(1,Number(log.setNo) || (index + 1))) + '">' +
      '<input type="number" min="0" step="1" inputmode="numeric" aria-label="Reps" data-session-log-v112="actualReps" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Number(log.actualReps) || 0) + '">' +
      '<input type="number" min="0" step="0.5" inputmode="decimal" aria-label="Vikt" data-session-log-v112="actualWeight" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Number(log.actualWeight) || 0) + '">';
  }

  function cardioRowHtml(log,index) {
    return '<div class="set-tag">Runda</div>' +
      '<input type="number" min="1" step="1" inputmode="numeric" aria-label="Set" data-session-log-v112="setNo" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Math.max(1,Number(log.setNo) || (index + 1))) + '">' +
      '<input type="number" min="0" step="0.1" inputmode="decimal" aria-label="Tid" data-session-log-v112="actualTime" data-session-log-index-v112="' + index + '" value="' + escapeAttr(Number(log.actualTime) || 0) + '">';
  }

  function ensureStyles() {
    ['exercise-session-flow-v112-style','exercise-session-flow-v113-style'].forEach(function (id) {
      var old = document.getElementById(id);
      if (old) old.remove();
    });
    var existing = document.getElementById('exercise-session-flow-v114-style');
    if (existing) {
      if (document.head.lastElementChild !== existing) document.head.appendChild(existing);
      return;
    }

    var style = document.createElement('style');
    style.id = 'exercise-session-flow-v114-style';
    style.textContent = `
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log .set-log-item.session-log-cardio-fields-v112 {
        grid-template-columns:minmax(54px,.65fr) repeat(2,minmax(0,1fr)) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) #session-set-log .set-log-item.session-log-strength-fields-v112 {
        grid-template-columns:minmax(54px,.65fr) repeat(3,minmax(0,1fr)) !important;
      }

      /* Fresh session = Starta pass. Same green language as Pass klart. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-intro-v114 {
        --pf-accent:#34D399 !important;
        --pf-soft:#A7F3D0 !important;
        --pf-rgb:52,211,153 !important;
        --pf-speed:3.2s !important;
      }

      /* A ready/waiting exercise keeps its own exercise colour. This prevents
         the generic resting/waiting cyan state from masking a red cardio set. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-ready-strength-v114 {
        --pf-accent:#FB923C !important;
        --pf-soft:#FED7AA !important;
        --pf-rgb:251,146,60 !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-ready-cardio-v114 {
        --pf-accent:#EF4444 !important;
        --pf-soft:#FCA5A5 !important;
        --pf-rgb:239,68,68 !important;
      }

      /* Temporary comparison switch: convert only cyan/blue Pulse Flow states
         to green. Strength orange and cardio red remain untouched. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.pulse-flow-green-cyan-v114:not(.pulse-flow-intro-v114):not(.pulse-flow-ready-strength-v114):not(.pulse-flow-ready-cardio-v114):not(.pulse-flow-strength-v58):not(.pulse-flow-cardio-v58) {
        --pf-accent:#34D399 !important;
        --pf-soft:#A7F3D0 !important;
        --pf-rgb:52,211,153 !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2.pulse-flow-green-cyan-v114:not(.pulse-flow-custom-v58) {
        --pf-accent:#34D399 !important;
        --pf-soft:#A7F3D0 !important;
        --pf-rgb:52,211,153 !important;
        --pf-between-accent:#34D399 !important;
        --pf-between-soft:#A7F3D0 !important;
        --pf-between-rgb:52,211,153 !important;
      }

      /* Top-row blue/green comparison toggle. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show .session-top {
        grid-template-columns:minmax(92px,1fr) auto auto auto auto !important;
      }
      #session-blue-green-toggle-v114 {
        box-sizing:border-box;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:5px;
        min-width:50px;
        min-height:38px;
        padding:6px 7px;
        border:1px solid rgba(103,232,249,.22);
        border-radius:11px;
        background:rgba(255,255,255,.025);
        color:#8EA0B4;
        font:800 8px/1 'Inter',sans-serif;
        letter-spacing:.35px;
        text-transform:uppercase;
        white-space:nowrap;
        -webkit-tap-highlight-color:transparent;
      }
      #session-blue-green-toggle-v114 .pf-theme-switch-v114 {
        position:relative;
        display:block;
        width:22px;
        height:12px;
        flex:0 0 22px;
        border-radius:999px;
        background:rgba(34,211,238,.20);
        box-shadow:inset 0 0 0 1px rgba(103,232,249,.20);
      }
      #session-blue-green-toggle-v114 .pf-theme-switch-v114::after {
        content:'';
        position:absolute;
        left:2px;
        top:2px;
        width:8px;
        height:8px;
        border-radius:50%;
        background:#67E8F9;
        box-shadow:0 0 6px rgba(34,211,238,.52);
        transition:transform .16s ease,background .16s ease,box-shadow .16s ease;
      }
      #session-blue-green-toggle-v114[aria-pressed="true"] {
        border-color:rgba(52,211,153,.40);
        color:#A7F3D0;
        background:rgba(52,211,153,.07);
      }
      #session-blue-green-toggle-v114[aria-pressed="true"] .pf-theme-switch-v114 {
        background:rgba(52,211,153,.23);
        box-shadow:inset 0 0 0 1px rgba(52,211,153,.27),0 0 8px rgba(52,211,153,.12);
      }
      #session-blue-green-toggle-v114[aria-pressed="true"] .pf-theme-switch-v114::after {
        transform:translateX(10px);
        background:#A7F3D0;
        box-shadow:0 0 7px rgba(52,211,153,.68);
      }

      /* Canonical exercise boundaries: inserted custom/cardio moments belong
         inside the surrounding exercise group, so the gap begins only at the
         first real set of the next main exercise. */
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-start-v80:not(:first-child) {
        margin-left:0 !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58 .hype-progress-segment.pf-ex-start-canonical-v113:not(:first-child) {
        margin-left:4px !important;
      }

      @media(max-width:600px) {
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show .session-top {
          grid-template-columns:minmax(88px,1fr) auto auto auto auto !important;
          gap:4px !important;
        }
        #session-blue-green-toggle-v114 {
          min-width:44px;
          min-height:36px;
          padding:6px 5px;
          gap:4px;
          font-size:7px;
        }
      }
      @media(max-width:360px) {
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show .session-top {
          grid-template-columns:repeat(4,auto) !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-modal.pulse-flow-v58.show .session-top > div:first-child {
          grid-column:1 / -1 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function syncProgressExerciseBoundaries() {
    var state = getState();
    var track = document.getElementById('hype-progress-track');
    var api = window.__exerciseProgressConsistencyV10;
    if (!state || !track || !api || typeof api.calculate !== 'function') return;

    var nodes = Array.prototype.slice.call(track.querySelectorAll(':scope > .hype-progress-segment'));
    if (!nodes.length) return;

    var result = null;
    try { result = api.calculate(state); }
    catch (_) { return; }
    if (!result || !Array.isArray(result.segments) || result.segments.length !== nodes.length) return;

    var starts = Object.create(null);
    var seenExercise = Object.create(null);
    result.segments.forEach(function (segment,index) {
      if (!segment || segment.type !== 'base') return;
      var exIndex = Number(segment.exIndex);
      if (!Number.isFinite(exIndex) || seenExercise[exIndex]) return;
      seenExercise[exIndex] = true;
      starts[index] = true;
    });

    nodes.forEach(function (node,index) {
      node.classList.toggle('pf-ex-start-canonical-v113',!!starts[index]);
    });
  }

  function hasLoggedMoment(state) {
    if (!state || !Array.isArray(state.logs)) return false;
    return state.logs.some(function (logs) { return Array.isArray(logs) && logs.length > 0; });
  }

  function introState(state) {
    var pre = document.getElementById('session-pre-timer');
    var preVisible = !!(pre && pre.classList.contains('show'));
    return !!(
      state &&
      Array.isArray(state.exercises) && state.exercises.length > 0 &&
      Number(state.exerciseIndex || 0) === 0 &&
      Math.max(1,Number(state.currentSet) || 1) === 1 &&
      !state.setRunning &&
      !state.awaitingDecision &&
      !preVisible &&
      !hasLoggedMoment(state) &&
      Number(state.exerciseIndex || 0) < state.exercises.length
    );
  }

  function syncIntroButton(intro) {
    var controls = document.getElementById('session-controls');
    if (!controls) return;
    var buttons = Array.prototype.slice.call(controls.querySelectorAll('button'));
    var button = buttons.find(function (item) {
      var text = String(item.textContent || '').trim().toLocaleLowerCase('sv-SE');
      return text === 'starta pass' || text.indexOf('starta set') === 0 || String(item.getAttribute('onclick') || '').indexOf('startCurrentSet') >= 0;
    });
    if (!button) return;

    if (intro) {
      if (!button.dataset.pfIntroOriginalV114) button.dataset.pfIntroOriginalV114 = String(button.textContent || 'Starta set').trim() || 'Starta set';
      if (button.textContent !== 'Starta pass') button.textContent = 'Starta pass';
      button.setAttribute('data-pf-intro-start-v114','true');
    } else if (button.getAttribute('data-pf-intro-start-v114') === 'true') {
      if (String(button.textContent || '').trim() === 'Starta pass') button.textContent = button.dataset.pfIntroOriginalV114 || 'Starta set';
      button.removeAttribute('data-pf-intro-start-v114');
      delete button.dataset.pfIntroOriginalV114;
    }
  }

  function syncIntroAndReadyTheme() {
    var state = getState();
    var modal = document.getElementById('session-modal');
    if (!modal) return;

    var intro = introState(state);
    modal.classList.toggle('pulse-flow-intro-v114',intro);
    syncIntroButton(intro);

    var pre = document.getElementById('session-pre-timer');
    var rest = document.getElementById('session-between-overlay-v2');
    var preVisible = !!(pre && pre.classList.contains('show'));
    var restVisible = !!(rest && rest.classList.contains('show'));
    var ex = currentExercise(state);
    var done = !!(state && Array.isArray(state.exercises) && Number(state.exerciseIndex) >= state.exercises.length);
    var ready = !!(state && ex && !intro && !done && !state.setRunning && !preVisible && !restVisible);

    modal.classList.toggle('pulse-flow-ready-cardio-v114',ready && ex.kind === 'cardio');
    modal.classList.toggle('pulse-flow-ready-strength-v114',ready && ex.kind !== 'cardio');
  }

  function ensureThemeToggle() {
    var modal = document.getElementById('session-modal');
    var top = modal && modal.querySelector('.session-top');
    if (!top) return null;
    var toggle = document.getElementById('session-blue-green-toggle-v114');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.id = 'session-blue-green-toggle-v114';
      toggle.setAttribute('aria-label','Byt blå Pulse Flow-teman mot gröna');
      toggle.innerHTML = '<span class="pf-theme-label-v114">Blå</span><span class="pf-theme-switch-v114" aria-hidden="true"></span>';
      toggle.addEventListener('click',function (event) {
        event.preventDefault();
        event.stopPropagation();
        greenBlueMode = !greenBlueMode;
        syncGreenBlueTheme();
      });
      var viewToggle = top.querySelector('.session-view-toggle');
      if (viewToggle) top.insertBefore(toggle,viewToggle);
      else top.appendChild(toggle);
    }
    return toggle;
  }

  function syncGreenBlueTheme() {
    var toggle = ensureThemeToggle();
    var modal = document.getElementById('session-modal');
    var rest = document.getElementById('session-between-overlay-v2');
    if (toggle) {
      toggle.setAttribute('aria-pressed',greenBlueMode ? 'true' : 'false');
      var label = toggle.querySelector('.pf-theme-label-v114');
      if (label) label.textContent = greenBlueMode ? 'Grön' : 'Blå';
    }
    if (modal) modal.classList.toggle('pulse-flow-green-cyan-v114',greenBlueMode);
    if (rest) rest.classList.toggle('pulse-flow-green-cyan-v114',greenBlueMode);
  }

  function syncLoggedSetFields() {
    if (syncingLog) return;
    var state = getState();
    var modal = document.getElementById('session-modal');
    var setLog = document.getElementById('session-set-log');
    if (!state || !modal || !setLog || !modal.classList.contains('show') || modal.classList.contains('session-overview-mode')) return;

    var ex = currentExercise(state);
    var logs = state.logs && state.logs[state.exerciseIndex];
    if (!ex || !Array.isArray(logs) || !logs.length) return;

    var rows = Array.prototype.slice.call(setLog.querySelectorAll(':scope > .set-log-item'));
    if (!rows.length) return;

    syncingLog = true;
    try {
      rows.slice(0,logs.length).forEach(function (row,index) {
        var kind = ex.kind === 'cardio' ? 'cardio' : 'strength';
        var marker = kind + '|' + index;
        if (row.dataset.sessionFieldsV112 === marker) return;
        row.dataset.sessionFieldsV112 = marker;
        row.classList.toggle('session-log-cardio-fields-v112',kind === 'cardio');
        row.classList.toggle('session-log-strength-fields-v112',kind !== 'cardio');
        row.innerHTML = kind === 'cardio' ? cardioRowHtml(logs[index] || {},index) : strengthRowHtml(logs[index] || {},index);
      });
    } finally {
      syncingLog = false;
    }
  }

  function commitLogInput(input) {
    if (!input || !input.matches('[data-session-log-v112]')) return;
    var state = getState();
    if (!state) return;
    var index = Number(input.getAttribute('data-session-log-index-v112'));
    var key = input.getAttribute('data-session-log-v112');
    if (!Number.isInteger(index) || !key) return;
    if (typeof window.updateSetLog === 'function') {
      try { window.updateSetLog(Number(state.exerciseIndex) || 0,index,key,input.value); return; }
      catch (_) {}
    }
    var logs = state.logs && state.logs[state.exerciseIndex];
    if (!Array.isArray(logs) || !logs[index]) return;
    var value = (key === 'actualWeight' || key === 'actualTime') ? parseFloat(input.value) : parseInt(input.value,10);
    logs[index][key] = Number.isFinite(value) ? value : 0;
  }

  function syncSessionUi() {
    ensureStyles();
    syncIntroAndReadyTheme();
    syncGreenBlueTheme();
    syncProgressExerciseBoundaries();
    syncLoggedSetFields();
  }

  function handleClick(event) {
    var button = event.target && event.target.closest ? event.target.closest('#session-controls button') : null;
    if (!button) return;
    var text = String(button.textContent || '').trim().toLocaleLowerCase('sv-SE');
    if (/^klar med set/.test(text)) {
      setTimeout(function () {
        autoRestKey = '';
        tryStartConfiguredRest(0);
        syncSessionUi();
      },0);
    }
  }

  function install() {
    ensureStyles();
    document.addEventListener('click',handleClick,false);
    document.addEventListener('change',function (event) {
      var input = event.target && event.target.closest ? event.target.closest('#session-set-log [data-session-log-v112]') : null;
      if (input) commitLogInput(input);
    },false);

    var observer = new MutationObserver(function () {
      if (syncingLog) return;
      requestAnimationFrame(syncSessionUi);
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    setInterval(syncSessionUi,180);
    setTimeout(syncSessionUi,0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
