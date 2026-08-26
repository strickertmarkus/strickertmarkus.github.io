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
  var draftTimer = null;

  function addStyles() {
    if (document.getElementById('exercise-between-sets-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-between-sets-style';
    style.textContent = `
      /* One pass-wide between-set setting. Keep the builder in the normal blue theme. */
      #between-set-global-editor {
        margin-top: 12px;
        padding: 12px;
        border: 1px solid rgba(34,211,238,.28);
        border-radius: 11px;
        background: rgba(34,211,238,.055);
        box-shadow: inset 0 0 0 1px rgba(34,211,238,.025);
      }
      #between-set-global-editor .between-set-title {
        margin-bottom: 8px;
        color: #67E8F9;
        font-size: 10px;
        line-height: 1.2;
        font-weight: 800;
        letter-spacing: .65px;
        text-transform: uppercase;
      }
      #between-set-global-editor .between-set-subtitle {
        margin: -3px 0 10px;
        color: #8B949E;
        font-size: 10px;
        line-height: 1.35;
      }
      #between-set-global-editor .between-set-fields {
        display: grid;
        grid-template-columns: minmax(130px,.8fr) minmax(105px,.5fr) minmax(160px,1fr);
        gap: 8px;
        align-items: end;
      }
      #between-set-global-editor .between-set-field { min-width: 0; }
      #between-set-global-editor .between-set-field label {
        display: block;
        margin-bottom: 4px;
        color: #8B949E;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: .35px;
        text-transform: uppercase;
      }
      #between-set-global-editor .between-set-field select,
      #between-set-global-editor .between-set-field input {
        width: 100%;
        min-width: 0;
        height: 38px;
        padding: 7px 9px;
        border: 1px solid rgba(34,211,238,.24);
        border-radius: 8px;
        background: rgba(33,38,45,.92);
        color: #F0F6FC;
        outline: none;
        font: 600 12px/1 'Inter',sans-serif;
      }
      #between-set-global-editor .between-set-field select:focus,
      #between-set-global-editor .between-set-field input:focus {
        border-color: rgba(34,211,238,.68);
        box-shadow: 0 0 0 2px rgba(34,211,238,.10);
      }
      #between-set-global-editor .between-set-field[hidden] { display: none !important; }

      /* Remove any legacy per-exercise editor if stale markup survived a cached render. */
      .ex-row-item > .between-set-editor { display: none !important; }

      /* Between-set activity is a real training step and covers the full session viewport. */
      #session-between-overlay {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100dvh;
        z-index: 2147482990;
        display: none;
        place-items: center;
        margin: 0;
        background: rgba(12,8,5,.88);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      #session-between-overlay.show { display: grid; }
      .session-between-wrap { text-align: center; }
      .session-between-heading {
        margin-bottom: 13px;
        color: #FDBA74;
        font-size: 15px;
        font-weight: 900;
        letter-spacing: .5px;
      }
      .session-between-skip {
        margin-top: 12px;
        color: #78716C;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: .55px;
        text-transform: uppercase;
      }

      /* Keep the five-second timer visually identical to the segmented workout timer. */
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
      #session-pre-timer-ring .session-pre-skip { display: none !important; }

      @media (max-width:600px) {
        #between-set-global-editor {
          margin-top: 10px;
          padding: 10px;
        }
        #between-set-global-editor .between-set-fields {
          grid-template-columns: minmax(0,1fr) 92px;
          gap: 7px;
        }
        #between-set-global-editor .between-set-field-name { grid-column: 1 / -1; }
        #session-between-overlay {
          padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
        }
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

  function firstLegacyConfig(plan) {
    if (!plan || !Array.isArray(plan.exercises)) return null;
    var fallback = null;
    for (var i = 0; i < plan.exercises.length; i++) {
      var raw = plan.exercises[i] && plan.exercises[i].betweenSets;
      if (!raw) continue;
      var c = normalizeConfig(raw);
      if (!fallback) fallback = c;
      if (c.type !== 'none') return c;
    }
    return fallback;
  }

  function currentBuilderDate() {
    var modal = document.getElementById('day-workout-modal');
    var date = document.getElementById('day-workout-date');
    return (modal && modal.dataset.date) || (date && date.value) || '';
  }

  function configForDate(date) {
    var draft = safeParse(localStorage.getItem(DRAFT_KEY));
    if (draft && draft.date === date) {
      if (draft.config) return normalizeConfig(draft.config);
      /* Migrate the previous per-row draft format. */
      if (Array.isArray(draft.configs) && draft.configs.length) {
        for (var i = 0; i < draft.configs.length; i++) {
          var dc = normalizeConfig(draft.configs[i]);
          if (dc.type !== 'none') return dc;
        }
        return normalizeConfig(draft.configs[0]);
      }
    }

    var planned = getPlannedSafe();
    var plan = planned && planned[date];
    if (!plan) return normalizeConfig(null);
    if (plan.betweenSets) return normalizeConfig(plan.betweenSets);
    return normalizeConfig(firstLegacyConfig(plan));
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

  function applyConfigToEditor(editor, config) {
    if (!editor) return;
    var c = normalizeConfig(config);
    var type = editor.querySelector('[data-between-type]');
    var seconds = editor.querySelector('[data-between-seconds]');
    var name = editor.querySelector('[data-between-name]');
    if (type) type.value = c.type;
    if (seconds) seconds.value = c.seconds;
    if (name) name.value = c.name;
    updateEditorVisibility(editor);
  }

  function captureGlobalConfig() {
    var editor = document.getElementById('between-set-global-editor');
    if (!editor) return normalizeConfig(null);
    return normalizeConfig({
      type: editor.querySelector('[data-between-type]').value,
      seconds: editor.querySelector('[data-between-seconds]').value,
      name: editor.querySelector('[data-between-name]').value
    });
  }

  function removeLegacyEditors() {
    document.querySelectorAll('#day-workout-ex-list .between-set-editor').forEach(function (el) { el.remove(); });
  }

  function ensureGlobalEditor(date, forceReload) {
    removeLegacyEditors();
    var list = document.getElementById('day-workout-ex-list');
    if (!list || !list.parentElement) return null;

    var editor = document.getElementById('between-set-global-editor');
    var created = false;
    if (!editor) {
      created = true;
      editor = document.createElement('div');
      editor.id = 'between-set-global-editor';
      editor.innerHTML =
        '<div class="between-set-title">Mellan varje set</div>' +
        '<div class="between-set-subtitle">Gäller hela passet.</div>' +
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
            '<input data-between-seconds type="number" min="1" step="1" inputmode="numeric" value="60">' +
          '</div>' +
          '<div class="between-set-field between-set-field-name">' +
            '<label>Övning</label>' +
            '<input data-between-name type="text" placeholder="Ex: Hopprep">' +
          '</div>' +
        '</div>';

      list.parentElement.appendChild(editor);
      editor.querySelector('[data-between-type]').addEventListener('change', function () {
        updateEditorVisibility(editor);
        saveDraftSoon();
      });
      editor.addEventListener('input', saveDraftSoon, true);
      editor.addEventListener('change', saveDraftSoon, true);
    }

    if (created || forceReload) applyConfigToEditor(editor, configForDate(date || currentBuilderDate()));
    return editor;
  }

  function saveDraftSoon() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      var modal = document.getElementById('day-workout-modal');
      if (!modal || !modal.classList.contains('show')) return;
      var date = currentBuilderDate();
      if (!date) return;
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          date: date,
          config: captureGlobalConfig(),
          savedAt: Date.now()
        }));
      } catch (e) {}
    }, 50);
  }

  function clearDraft() {
    clearTimeout(draftTimer);
    localStorage.removeItem(DRAFT_KEY);
  }

  function persistGlobalConfig(date, config) {
    if (!date) return;
    var planned = getPlannedSafe();
    var plan = planned && planned[date];
    if (!plan) return;

    plan.betweenSets = normalizeConfig(config);
    if (Array.isArray(plan.exercises)) {
      plan.exercises.forEach(function (ex) {
        if (ex && typeof ex === 'object' && Object.prototype.hasOwnProperty.call(ex, 'betweenSets')) {
          delete ex.betweenSets;
        }
      });
    }
    planned[date] = plan;
    savePlannedSafe(planned);
  }

  function copyConfigIntoActiveState(date, fallbackConfig) {
    var state = getState();
    if (!state) return;

    var planned = getPlannedSafe();
    var plan = planned && planned[date || state.date];
    var config = plan && plan.betweenSets ? plan.betweenSets : fallbackConfig;
    if (!config && plan) config = firstLegacyConfig(plan);
    state.betweenSets = normalizeConfig(config);

    if (Array.isArray(state.exercises)) {
      state.exercises.forEach(function (ex) {
        if (ex && Object.prototype.hasOwnProperty.call(ex, 'betweenSets')) delete ex.betweenSets;
      });
    }
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
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        finishInterset();
      }
    });
    document.body.appendChild(overlay);
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
    if (config.type === 'none') {
      if (typeof done === 'function') done();
      return;
    }

    var overlay = ensureIntersetOverlay();
    if (!overlay) {
      if (typeof done === 'function') done();
      return;
    }

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

  function activeIntersetConfig(state) {
    if (!state || state.setRunning || !state.awaitingDecision) return null;
    var config = normalizeConfig(state.betweenSets);
    return config.type === 'none' ? null : config;
  }

  function hasNextExercise(state) {
    return !!(state && Array.isArray(state.exercises) && Number(state.exerciseIndex) + 1 < state.exercises.length);
  }

  function runBeforeAction(originalFn, self, args, requireNextExercise) {
    if (intersetActive) return;
    var state = getState();
    var config = activeIntersetConfig(state);
    if (requireNextExercise && !hasNextExercise(state)) config = null;
    if (!config) return originalFn.apply(self, args);
    startInterset(config, function () { originalFn.apply(self, args); });
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
      var originalAddExtra = window.addExtraSet;
      var originalFinishExercise = window.finishCurrentExercise;
      var originalRender = window.renderSessionMode;
      var originalStop = window.stopSessionMode;
      var originalClose = window.closeModal;

      window.addDayWorkoutExRow = function () {
        var result = originalAdd.apply(this, arguments);
        removeLegacyEditors();
        ensureGlobalEditor(currentBuilderDate(), false);
        return result;
      };

      window.loadDayWorkoutBuilder = function (iso) {
        var result = originalLoad.apply(this, arguments);
        setTimeout(function () {
          ensureGlobalEditor(iso, true);
        }, 0);
        return result;
      };

      window.persistDayWorkoutPlan = function () {
        var date = currentBuilderDate();
        var config = captureGlobalConfig();
        var result = originalPersist.apply(this, arguments);
        if (result !== false) {
          /* Base save/start may already have started the session. Persist and then
             copy again so the active session always receives the new setting. */
          persistGlobalConfig(date, config);
          copyConfigIntoActiveState(date, config);
          clearDraft();
          if (typeof window.renderSessionMode === 'function' && getState()) window.renderSessionMode();
        }
        return result;
      };

      window.startWorkoutSessionForDate = function (iso) {
        var result = originalStartSession.apply(this, arguments);
        copyConfigIntoActiveState(iso);
        if (typeof window.renderSessionMode === 'function' && getState()) window.renderSessionMode();
        return result;
      };

      window.startNextSet = function () {
        return runBeforeAction(originalNextSet, this, arguments, false);
      };

      if (typeof originalAddExtra === 'function') {
        window.addExtraSet = function () {
          return runBeforeAction(originalAddExtra, this, arguments, false);
        };
      }

      if (typeof originalFinishExercise === 'function') {
        window.finishCurrentExercise = function () {
          return runBeforeAction(originalFinishExercise, this, arguments, true);
        };
      }

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

      ensureGlobalEditor(currentBuilderDate(), true);
      copyConfigIntoActiveState();
      setInterval(syncPretimerSegments, 50);
    }

    bind();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
