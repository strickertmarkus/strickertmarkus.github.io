(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var params = new URLSearchParams(window.location.search);
  var profile = (params.get('user') || 'markus').toLowerCase();
  var DRAFT_KEY = 'ex_between_set_draft_' + profile;
  var intersetActive = false;
  var intersetTimer = null;
  var intersetDeadline = 0;
  var intersetTotalMs = 0;
  var intersetDone = null;

  function addStyles() {
    if (document.getElementById('exercise-between-sets-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-between-sets-style';
    style.textContent = `
      .between-set-editor {
        grid-column: 1 / -1;
        margin-top: 8px;
        padding: 10px;
        border: 1px solid rgba(251,146,60,.18);
        border-radius: 10px;
        background: rgba(251,146,60,.045);
      }
      .between-set-title {
        margin-bottom: 7px;
        color: #FDBA74;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .65px;
        text-transform: uppercase;
      }
      .between-set-fields {
        display: grid;
        grid-template-columns: minmax(120px,.8fr) minmax(110px,.55fr) minmax(150px,1fr);
        gap: 8px;
        align-items: end;
      }
      .between-set-field { min-width: 0; }
      .between-set-field label {
        display: block;
        margin-bottom: 4px;
        color: #8B949E;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: .35px;
        text-transform: uppercase;
      }
      .between-set-field select,
      .between-set-field input {
        width: 100%;
        min-width: 0;
        height: 38px;
        padding: 7px 9px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 8px;
        background: #21262D;
        color: #F0F6FC;
        font: 600 12px/1 'Inter',sans-serif;
      }
      .between-set-field[hidden] { display: none !important; }

      #session-between-overlay {
        position: absolute;
        inset: 0;
        z-index: 58;
        display: none;
        place-items: center;
        background: rgba(12,8,5,.84);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      #session-between-overlay.show { display: grid; }
      .session-between-wrap { text-align: center; }
      .session-between-heading {
        margin-bottom: 13px;
        color: #FDBA74;
        font-size: 13px;
        font-weight: 900;
        letter-spacing: .7px;
        text-transform: uppercase;
      }
      .session-between-skip {
        margin-top: 12px;
        color: #78716C;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: .55px;
        text-transform: uppercase;
      }

      /* The 5-second pre-timer now uses the exact segmented visual language of the workout timer. */
      #session-pre-timer-ring.session-pre-segmented {
        width: 180px !important;
        height: 180px !important;
        position: relative !important;
        display: grid !important;
        place-items: center !important;
        background: none !important;
        box-shadow: none !important;
      }
      #session-pre-timer-ring.session-pre-segmented::before { content: none !important; }
      #session-pre-timer-ring .session-pre-segments {
        position: absolute;
        inset: 0;
        border-radius: 50%;
      }
      #session-pre-timer-ring .session-countdown-core { inset: 24px; }
      #session-pre-timer-ring #session-pre-timer-value {
        color: #FDBA74;
        font-size: 38px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: -1.5px;
        font-variant-numeric: tabular-nums;
      }
      #session-pre-timer-ring .session-pre-label {
        margin-top: 7px;
        color: #A8A29E;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .9px;
        text-transform: uppercase;
      }
      #session-pre-timer-ring .session-pre-skip {
        margin-top: 5px;
        color: #78716C;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: .45px;
        text-transform: uppercase;
      }

      @media (max-width:600px) {
        .between-set-editor { padding: 9px; }
        .between-set-fields {
          grid-template-columns: minmax(0,1fr) 92px;
          gap: 7px;
        }
        .between-set-field-name { grid-column: 1 / -1; }
        #session-pre-timer-ring.session-pre-segmented,
        #session-between-ring {
          width: min(164px,48vw) !important;
          height: min(164px,48vw) !important;
        }
        #session-pre-timer-ring .session-countdown-core,
        #session-between-ring .session-countdown-core { inset: 21px; }
        #session-pre-timer-ring #session-pre-timer-value,
        #session-between-value { font-size: 34px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function safeParse(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; } catch (e) { return null; }
  }

  function getPlannedSafe() {
    try {
      if (typeof window.getPlannedSessions === 'function') return window.getPlannedSessions() || {};
      if (typeof getPlannedSessions === 'function') return getPlannedSessions() || {};
    } catch (e) {}
    return {};
  }

  function savePlannedSafe(value) {
    try {
      if (typeof window.savePlannedSessions === 'function') return window.savePlannedSessions(value);
      if (typeof savePlannedSessions === 'function') return savePlannedSessions(value);
    } catch (e) {}
  }

  function normalizeConfig(config) {
    config = config || {};
    var type = config.type === 'rest' || config.type === 'custom' ? config.type : 'none';
    var seconds = Math.max(1, Math.round(Number(config.seconds) || (type === 'rest' ? 60 : 30)));
    return {
      type: type,
      seconds: seconds,
      name: type === 'custom' ? String(config.name || '').trim() : ''
    };
  }

  function updateEditorVisibility(editor) {
    if (!editor) return;
    var type = editor.querySelector('[data-between-type]');
    var seconds = editor.querySelector('.between-set-field-seconds');
    var name = editor.querySelector('.between-set-field-name');
    var value = type ? type.value : 'none';
    if (seconds) seconds.hidden = value === 'none';
    if (name) name.hidden = value !== 'custom';
  }

  function augmentRow(row, config) {
    if (!row || row.querySelector('.between-set-editor')) return;
    var c = normalizeConfig(config);
    var editor = document.createElement('div');
    editor.className = 'between-set-editor';
    editor.innerHTML =
      '<div class="between-set-title">Mellan varje set</div>' +
      '<div class="between-set-fields">' +
        '<div class="between-set-field">' +
          '<label>Aktivitet</label>' +
          '<select data-between-type>' +
            '<option value="none">Ingen</option>' +
            '<option value="rest">Vila</option>' +
            '<option value="custom">Valfri övning</option>' +
          '</select>' +
        '</div>' +
        '<div class="between-set-field between-set-field-seconds">' +
          '<label>Tid (sek)</label>' +
          '<input data-between-seconds type="number" min="1" step="1" inputmode="numeric" value="' + c.seconds + '">' +
        '</div>' +
        '<div class="between-set-field between-set-field-name">' +
          '<label>Övning</label>' +
          '<input data-between-name type="text" placeholder="Ex: Hopprep" value="">' +
        '</div>' +
      '</div>';
    row.appendChild(editor);
    editor.querySelector('[data-between-type]').value = c.type;
    editor.querySelector('[data-between-name]').value = c.name;
    updateEditorVisibility(editor);
    editor.querySelector('[data-between-type]').addEventListener('change', function () {
      updateEditorVisibility(editor);
      saveDraftSoon();
    });
  }

  function rowConfig(row) {
    var editor = row && row.querySelector('.between-set-editor');
    if (!editor) return normalizeConfig(null);
    return normalizeConfig({
      type: editor.querySelector('[data-between-type]').value,
      seconds: editor.querySelector('[data-between-seconds]').value,
      name: editor.querySelector('[data-between-name]').value
    });
  }

  function currentBuilderDate() {
    var modal = document.getElementById('day-workout-modal');
    var date = document.getElementById('day-workout-date');
    return (modal && modal.dataset.date) || (date && date.value) || '';
  }

  function captureBuilderConfigs() {
    var list = document.getElementById('day-workout-ex-list');
    if (!list) return [];
    return Array.prototype.slice.call(list.querySelectorAll('.ex-row-item')).map(rowConfig);
  }

  var draftTimer = null;
  function saveDraftSoon() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      var modal = document.getElementById('day-workout-modal');
      if (!modal || !modal.classList.contains('show')) return;
      var date = currentBuilderDate();
      if (!date) return;
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({date:date, configs:captureBuilderConfigs(), savedAt:Date.now()}));
      } catch (e) {}
    }, 50);
  }

  function clearDraft() {
    clearTimeout(draftTimer);
    localStorage.removeItem(DRAFT_KEY);
  }

  function configsForDate(date) {
    var draft = safeParse(localStorage.getItem(DRAFT_KEY));
    if (draft && draft.date === date && Array.isArray(draft.configs)) return draft.configs;
    var planned = getPlannedSafe();
    var p = planned && planned[date];
    return p && Array.isArray(p.exercises) ? p.exercises.map(function (ex) { return ex && ex.betweenSets; }) : [];
  }

  function augmentBuilderRows(date) {
    var list = document.getElementById('day-workout-ex-list');
    if (!list) return;
    var configs = configsForDate(date || currentBuilderDate());
    Array.prototype.slice.call(list.querySelectorAll('.ex-row-item')).forEach(function (row, idx) {
      augmentRow(row, configs[idx]);
    });
  }

  function persistConfigs(date, configs) {
    if (!date) return;
    var planned = getPlannedSafe();
    var p = planned && planned[date];
    if (!p || !Array.isArray(p.exercises)) return;
    p.exercises.forEach(function (ex, idx) {
      if (!ex || typeof ex !== 'object') return;
      ex.betweenSets = normalizeConfig(configs[idx]);
    });
    planned[date] = p;
    savePlannedSafe(planned);
  }

  function copyConfigIntoActiveState(date) {
    var state = getState();
    if (!state || !Array.isArray(state.exercises)) return;
    var planned = getPlannedSafe();
    var p = planned && planned[date || state.date];
    if (!p || !Array.isArray(p.exercises)) return;
    state.exercises.forEach(function (ex, idx) {
      ex.betweenSets = normalizeConfig(p.exercises[idx] && p.exercises[idx].betweenSets);
    });
  }

  function buildSegments(containerId) {
    var segments = '';
    for (var i = 0; i < 60; i++) {
      segments += '<span class="session-countdown-segment active" data-segment="' + i + '" style="transform:rotate(' + (i * 6) + 'deg) translateY(-82px)"></span>';
    }
    return '<div class="session-countdown-segments" id="' + containerId + '">' + segments + '</div>';
  }

  function upgradePretimer() {
    var ring = document.getElementById('session-pre-timer-ring');
    if (!ring || ring.classList.contains('session-pre-segmented')) return;
    ring.classList.add('session-pre-segmented');
    ring.innerHTML =
      buildSegments('session-pre-segments') +
      '<div class="session-countdown-core"></div>' +
      '<div class="session-countdown-copy">' +
        '<div id="session-pre-timer-value">5</div>' +
        '<div class="session-pre-label">Gör dig redo</div>' +
        '<div class="session-pre-skip">Tryck för att hoppa över</div>' +
      '</div>';
  }

  function syncPretimerSegments() {
    upgradePretimer();
    var ring = document.getElementById('session-pre-timer-ring');
    if (!ring) return;
    var raw = ring.style.getPropertyValue('--pre-progress') || '0';
    var deg = Math.max(0, Math.min(360, parseFloat(raw) || 0));
    var activeCount = Math.max(0, Math.min(60, Math.ceil(60 * (1 - deg / 360))));
    document.querySelectorAll('#session-pre-segments .session-countdown-segment').forEach(function (segment, idx) {
      var active = idx < activeCount;
      segment.classList.toggle('active', active);
      segment.classList.toggle('inactive', !active);
    });
  }

  function ensureIntersetOverlay() {
    var existing = document.getElementById('session-between-overlay');
    if (existing) return existing;
    var shell = document.querySelector('#session-modal .session-shell');
    if (!shell) return null;
    if (getComputedStyle(shell).position === 'static') shell.style.position = 'relative';
    var overlay = document.createElement('div');
    overlay.id = 'session-between-overlay';
    overlay.setAttribute('role','button');
    overlay.setAttribute('tabindex','0');
    overlay.setAttribute('aria-label','Hoppa över mellanset-aktivitet');
    overlay.innerHTML =
      '<div class="session-between-wrap">' +
        '<div class="session-between-heading" id="session-between-heading">Vila</div>' +
        '<div class="session-countdown-ring" id="session-between-ring">' +
          buildSegments('session-between-segments') +
          '<div class="session-countdown-core"></div>' +
          '<div class="session-countdown-copy">' +
            '<div class="session-countdown-value" id="session-between-value">01:00</div>' +
            '<div class="session-countdown-label">Mellan set</div>' +
          '</div>' +
        '</div>' +
        '<div class="session-between-skip">Tryck för att hoppa över</div>' +
      '</div>';
    overlay.addEventListener('click', finishInterset);
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finishInterset(); }
    });
    shell.appendChild(overlay);
    return overlay;
  }

  function formatTime(seconds) {
    seconds = Math.max(0, Math.ceil(seconds));
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }

  function updateInterset() {
    if (!intersetActive) return;
    var remain = Math.max(0, intersetDeadline - Date.now());
    var value = document.getElementById('session-between-value');
    if (value) value.textContent = formatTime(remain / 1000);
    var activeCount = intersetTotalMs > 0 ? Math.ceil(60 * remain / intersetTotalMs) : 0;
    activeCount = Math.max(0, Math.min(60, activeCount));
    document.querySelectorAll('#session-between-segments .session-countdown-segment').forEach(function (segment, idx) {
      var active = idx < activeCount;
      segment.classList.toggle('active', active);
      segment.classList.toggle('inactive', !active);
    });
    if (remain <= 0) finishInterset();
  }

  function startInterset(config, done) {
    config = normalizeConfig(config);
    if (config.type === 'none') { done(); return; }
    var overlay = ensureIntersetOverlay();
    if (!overlay) { done(); return; }
    intersetActive = true;
    intersetDone = done;
    intersetTotalMs = Math.max(1000, config.seconds * 1000);
    intersetDeadline = Date.now() + intersetTotalMs;
    var heading = document.getElementById('session-between-heading');
    if (heading) heading.textContent = config.type === 'custom' ? (config.name || 'Valfri övning') : 'Vila';
    overlay.classList.add('show');
    updateInterset();
    intersetTimer = setInterval(updateInterset, 50);
  }

  function finishInterset() {
    if (!intersetActive) return;
    intersetActive = false;
    if (intersetTimer) clearInterval(intersetTimer);
    intersetTimer = null;
    var overlay = document.getElementById('session-between-overlay');
    if (overlay) overlay.classList.remove('show');
    var done = intersetDone;
    intersetDone = null;
    if (typeof done === 'function') done();
  }

  function cancelInterset() {
    intersetDone = null;
    intersetActive = false;
    if (intersetTimer) clearInterval(intersetTimer);
    intersetTimer = null;
    var overlay = document.getElementById('session-between-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  function shouldRunInterset(state) {
    if (!state || !Array.isArray(state.exercises) || state.exerciseIndex >= state.exercises.length) return null;
    var ex = state.exercises[state.exerciseIndex];
    var plannedSets = Math.max(1, Number(ex.plannedSets) || 1);
    if (Number(state.currentSet) >= plannedSets) return null;
    var config = normalizeConfig(ex.betweenSets);
    return config.type === 'none' ? null : config;
  }

  function install() {
    addStyles();
    upgradePretimer();
    ensureIntersetOverlay();

    var attempts = 0;
    function bind() {
      attempts++;
      if (typeof window.addDayWorkoutExRow !== 'function' ||
          typeof window.loadDayWorkoutBuilder !== 'function' ||
          typeof window.persistDayWorkoutPlan !== 'function' ||
          typeof window.startWorkoutSessionForDate !== 'function' ||
          typeof window.startNextSet !== 'function') {
        if (attempts < 80) setTimeout(bind, 100);
        return;
      }
      if (window.__exerciseBetweenSetsInstalled) return;
      window.__exerciseBetweenSetsInstalled = true;

      var originalAdd = window.addDayWorkoutExRow;
      var originalLoad = window.loadDayWorkoutBuilder;
      var originalPersist = window.persistDayWorkoutPlan;
      var originalStartSession = window.startWorkoutSessionForDate;
      var originalNextSet = window.startNextSet;
      var originalRender = window.renderSessionMode;
      var originalStop = window.stopSessionMode;
      var originalClose = window.closeModal;

      window.addDayWorkoutExRow = function (ex) {
        var list = document.getElementById('day-workout-ex-list');
        var before = list ? list.querySelectorAll('.ex-row-item').length : 0;
        var result = originalAdd.apply(this, arguments);
        list = document.getElementById('day-workout-ex-list');
        if (list) {
          var rows = list.querySelectorAll('.ex-row-item');
          if (rows.length > before) augmentRow(rows[rows.length - 1], ex && ex.betweenSets);
        }
        saveDraftSoon();
        return result;
      };

      window.loadDayWorkoutBuilder = function (iso) {
        var result = originalLoad.apply(this, arguments);
        setTimeout(function () { augmentBuilderRows(iso); }, 0);
        return result;
      };

      window.persistDayWorkoutPlan = function (opts) {
        var date = currentBuilderDate();
        var configs = captureBuilderConfigs();
        var result = originalPersist.apply(this, arguments);
        if (result !== false) {
          persistConfigs(date, configs);
          clearDraft();
        }
        return result;
      };

      window.startWorkoutSessionForDate = function (iso) {
        var result = originalStartSession.apply(this, arguments);
        copyConfigIntoActiveState(iso);
        if (typeof window.renderSessionMode === 'function') window.renderSessionMode();
        return result;
      };

      window.startNextSet = function () {
        var self = this, args = arguments;
        if (intersetActive) return;
        var config = shouldRunInterset(getState());
        if (!config) return originalNextSet.apply(self, args);
        startInterset(config, function () { originalNextSet.apply(self, args); });
      };

      if (typeof originalRender === 'function') {
        window.renderSessionMode = function () {
          var result = originalRender.apply(this, arguments);
          upgradePretimer();
          syncPretimerSegments();
          return result;
        };
      }

      if (typeof originalStop === 'function') {
        window.stopSessionMode = function () {
          cancelInterset();
          return originalStop.apply(this, arguments);
        };
      }

      if (typeof originalClose === 'function') {
        window.closeModal = function (id) {
          if (id === 'day-workout-modal') clearDraft();
          return originalClose.apply(this, arguments);
        };
      }

      document.addEventListener('input', function (e) {
        if (e.target && e.target.closest && e.target.closest('.between-set-editor')) saveDraftSoon();
      }, true);
      document.addEventListener('change', function (e) {
        if (e.target && e.target.closest && e.target.closest('.between-set-editor')) saveDraftSoon();
      }, true);

      var list = document.getElementById('day-workout-ex-list');
      if (list) {
        new MutationObserver(function () {
          augmentBuilderRows(currentBuilderDate());
        }).observe(list, {childList:true});
      }

      augmentBuilderRows(currentBuilderDate());
      copyConfigIntoActiveState();
      setInterval(syncPretimerSegments, 50);
    }

    bind();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
