(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var params = new URLSearchParams(window.location.search);
  var profile = (params.get('user') || 'markus').toLowerCase();
  var KEY_PREFIX = 'ex_between_set_v2_' + profile + '_';
  var overlayActive = false;
  var overlayTimer = null;
  var bypassNextClick = false;
  var pendingButton = null;

  function normalizeConfig(raw) {
    raw = raw || {};
    var type = raw.type === 'rest' || raw.type === 'custom' ? raw.type : 'none';
    return {
      type: type,
      seconds: Math.max(1, Math.round(Number(raw.seconds) || (type === 'rest' ? 60 : 30))),
      name: type === 'custom' ? String(raw.name || '').trim() : ''
    };
  }

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; } catch (e) { return null; }
  }

  function currentBuilderDate() {
    var modal = document.getElementById('day-workout-modal');
    var input = document.getElementById('day-workout-date');
    return (modal && modal.dataset.date) || (input && input.value) || '';
  }

  function getPlannedSafe() {
    try { return typeof window.getPlannedSessions === 'function' ? (window.getPlannedSessions() || {}) : {}; }
    catch (e) { return {}; }
  }

  function savePlannedSafe(value) {
    try { if (typeof window.savePlannedSessions === 'function') window.savePlannedSessions(value); }
    catch (e) {}
  }

  function localKey(date) { return KEY_PREFIX + date; }

  function readLocal(date) {
    if (!date) return null;
    try {
      var raw = localStorage.getItem(localKey(date));
      return raw ? normalizeConfig(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }

  function saveLocal(date, config) {
    if (!date) return;
    try { localStorage.setItem(localKey(date), JSON.stringify(normalizeConfig(config))); }
    catch (e) {}
  }

  function configForDate(date) {
    if (!date) return normalizeConfig(null);
    var planned = getPlannedSafe();
    var plan = planned && planned[date];
    if (plan && plan.betweenSets) return normalizeConfig(plan.betweenSets);
    return readLocal(date) || normalizeConfig(null);
  }

  function persistToPlan(date, config) {
    if (!date) return;
    var normalized = normalizeConfig(config);
    saveLocal(date, normalized);
    var planned = getPlannedSafe();
    if (!planned || !planned[date]) return;
    planned[date].betweenSets = normalized;
    if (Array.isArray(planned[date].exercises)) {
      planned[date].exercises.forEach(function (ex) {
        if (ex && Object.prototype.hasOwnProperty.call(ex, 'betweenSets')) delete ex.betweenSets;
      });
    }
    savePlannedSafe(planned);
  }

  function addStyles() {
    if (document.getElementById('exercise-between-sets-v2-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-between-sets-v2-style';
    style.textContent = `
      #between-set-global-editor-v2 {
        margin-top: 12px;
        padding: 12px;
        border: 1px solid rgba(34,211,238,.30);
        border-radius: 11px;
        background: rgba(34,211,238,.055);
      }
      #between-set-global-editor-v2 .bs-title {
        color: #67E8F9;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .65px;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      #between-set-global-editor-v2 .bs-sub {
        color: #8B949E;
        font-size: 10px;
        margin-bottom: 9px;
      }
      #between-set-global-editor-v2 .bs-fields {
        display: grid;
        grid-template-columns: minmax(130px,.8fr) 105px minmax(150px,1fr);
        gap: 8px;
        align-items: end;
      }
      #between-set-global-editor-v2 .bs-field { min-width: 0; }
      #between-set-global-editor-v2 .bs-field[hidden] { display:none !important; }
      #between-set-global-editor-v2 label {
        display:block;
        margin-bottom:4px;
        color:#8B949E;
        font-size:9px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:.35px;
      }
      #between-set-global-editor-v2 select,
      #between-set-global-editor-v2 input {
        width:100%;
        min-width:0;
        height:38px;
        border:1px solid rgba(34,211,238,.24);
        border-radius:8px;
        padding:7px 9px;
        background:#21262D;
        color:#F0F6FC;
        font:600 12px/1 'Inter',sans-serif;
        outline:none;
      }
      #between-set-global-editor-v2 select:focus,
      #between-set-global-editor-v2 input:focus {
        border-color:rgba(34,211,238,.72);
        box-shadow:0 0 0 2px rgba(34,211,238,.10);
      }

      #session-between-overlay-v2 {
        position:fixed;
        inset:0;
        z-index:2147482995;
        display:none;
        place-items:center;
        width:100vw;
        height:100dvh;
        background:rgba(12,8,5,.90);
        backdrop-filter:blur(6px);
        -webkit-backdrop-filter:blur(6px);
        cursor:pointer;
        -webkit-tap-highlight-color:transparent;
      }
      #session-between-overlay-v2.show { display:grid; }
      #session-between-overlay-v2 .bs-overlay-wrap { text-align:center; }
      #session-between-overlay-v2 .bs-heading {
        margin-bottom:13px;
        color:#FDBA74;
        font-size:16px;
        font-weight:900;
      }
      #session-between-overlay-v2 .bs-ring {
        width:180px;
        height:180px;
        position:relative;
        display:grid;
        place-items:center;
      }
      #session-between-overlay-v2 .bs-segments { position:absolute; inset:0; }
      #session-between-overlay-v2 .bs-segment {
        position:absolute;
        left:50%;
        top:50%;
        width:3px;
        height:13px;
        margin-left:-1.5px;
        margin-top:-6.5px;
        border-radius:999px;
        background:rgba(251,146,60,.12);
        transform-origin:1.5px 6.5px;
      }
      #session-between-overlay-v2 .bs-segment.active {
        background:#FB923C;
        box-shadow:0 0 7px rgba(251,146,60,.58);
      }
      #session-between-overlay-v2 .bs-core {
        position:absolute;
        inset:24px;
        border-radius:50%;
        background:rgba(21,16,13,.97);
        border:1px solid rgba(251,146,60,.16);
      }
      #session-between-overlay-v2 .bs-copy { position:relative; z-index:2; }
      #session-between-overlay-v2 .bs-value {
        color:#FDBA74;
        font-size:38px;
        line-height:1;
        font-weight:900;
        font-variant-numeric:tabular-nums;
      }
      #session-between-overlay-v2 .bs-label {
        margin-top:7px;
        color:#A8A29E;
        font-size:10px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:.9px;
      }
      #session-between-overlay-v2 .bs-skip {
        margin-top:12px;
        color:#78716C;
        font-size:9px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:.5px;
      }

      @media (max-width:600px) {
        #between-set-global-editor-v2 { padding:10px; }
        #between-set-global-editor-v2 .bs-fields {
          grid-template-columns:minmax(0,1fr) 92px;
          gap:7px;
        }
        #between-set-global-editor-v2 .bs-name { grid-column:1 / -1; }
        #session-between-overlay-v2 { padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom)); }
        #session-between-overlay-v2 .bs-ring { width:min(164px,48vw); height:min(164px,48vw); }
        #session-between-overlay-v2 .bs-core { inset:21px; }
        #session-between-overlay-v2 .bs-value { font-size:34px; }
      }
    `;
    document.head.appendChild(style);
  }

  function editorConfig(editor) {
    if (!editor) return normalizeConfig(null);
    return normalizeConfig({
      type: editor.querySelector('[data-bs-type]').value,
      seconds: editor.querySelector('[data-bs-seconds]').value,
      name: editor.querySelector('[data-bs-name]').value
    });
  }

  function syncEditorVisibility(editor) {
    if (!editor) return;
    var type = editor.querySelector('[data-bs-type]').value;
    editor.querySelector('.bs-seconds').hidden = type === 'none';
    editor.querySelector('.bs-name').hidden = type !== 'custom';
  }

  function applyEditor(editor, config) {
    config = normalizeConfig(config);
    editor.querySelector('[data-bs-type]').value = config.type;
    editor.querySelector('[data-bs-seconds]').value = config.seconds;
    editor.querySelector('[data-bs-name]').value = config.name;
    syncEditorVisibility(editor);
  }

  function ensureEditor() {
    var modal = document.getElementById('day-workout-modal');
    var list = document.getElementById('day-workout-ex-list');
    if (!modal || !modal.classList.contains('show') || !list || !list.parentElement) return null;

    document.querySelectorAll('#day-workout-ex-list .between-set-editor').forEach(function (el) { el.remove(); });

    var editor = document.getElementById('between-set-global-editor-v2');
    if (!editor) {
      editor = document.createElement('div');
      editor.id = 'between-set-global-editor-v2';
      editor.innerHTML =
        '<div class="bs-title">Mellan varje set</div>' +
        '<div class="bs-sub">Gäller hela passet.</div>' +
        '<div class="bs-fields">' +
          '<div class="bs-field"><label>Aktivitet</label><select data-bs-type><option value="none">Ingen</option><option value="rest">Vila</option><option value="custom">Valfri övning</option></select></div>' +
          '<div class="bs-field bs-seconds"><label>Tid (sek)</label><input data-bs-seconds type="number" min="1" step="1" inputmode="numeric"></div>' +
          '<div class="bs-field bs-name"><label>Övning</label><input data-bs-name type="text" placeholder="Ex: Hopprep"></div>' +
        '</div>';
      list.parentElement.appendChild(editor);

      editor.addEventListener('change', function () {
        syncEditorVisibility(editor);
        var date = currentBuilderDate();
        var cfg = editorConfig(editor);
        saveLocal(date, cfg);
        persistToPlan(date, cfg);
      });
      editor.addEventListener('input', function () {
        var date = currentBuilderDate();
        saveLocal(date, editorConfig(editor));
      });
    }

    var date = currentBuilderDate();
    if (editor.dataset.loadedDate !== date) {
      applyEditor(editor, configForDate(date));
      editor.dataset.loadedDate = date;
    }
    return editor;
  }

  function buildSegments() {
    var html = '';
    for (var i = 0; i < 60; i++) {
      html += '<span class="bs-segment active" data-i="' + i + '" style="--between-angle:' + (i * 6) + 'deg"></span>';
    }
    return html;
  }

  function ensureOverlay() {
    var overlay = document.getElementById('session-between-overlay-v2');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'session-between-overlay-v2';
    overlay.setAttribute('role','button');
    overlay.setAttribute('tabindex','0');
    overlay.innerHTML =
      '<div class="bs-overlay-wrap">' +
        '<div class="bs-heading" id="bs-overlay-heading">Vila</div>' +
        '<div class="bs-ring">' +
          '<div class="bs-segments">' + buildSegments() + '</div>' +
          '<div class="bs-core"></div>' +
          '<div class="bs-copy"><div class="bs-value" id="bs-overlay-value">01:00</div><div class="bs-label">Mellan set</div></div>' +
        '</div>' +
        '<div class="bs-skip">Tryck för att hoppa över</div>' +
      '</div>';
    overlay.addEventListener('click', finishOverlay);
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finishOverlay(); }
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function formatTime(seconds) {
    seconds = Math.max(0, Math.ceil(seconds));
    return String(Math.floor(seconds / 60)).padStart(2,'0') + ':' + String(seconds % 60).padStart(2,'0');
  }

  function finishOverlay() {
    if (!overlayActive) return;
    overlayActive = false;
    if (overlayTimer) clearInterval(overlayTimer);
    overlayTimer = null;
    var overlay = document.getElementById('session-between-overlay-v2');
    if (overlay) {
      overlay.classList.remove('show');
      overlay.removeAttribute('data-between-type');
    }

    var button = pendingButton;
    pendingButton = null;
    if (button && document.documentElement.contains(button)) {
      bypassNextClick = true;
      button.click();
    }
  }

  function startOverlay(config, button) {
    config = normalizeConfig(config);
    if (config.type === 'none') return false;
    var overlay = ensureOverlay();
    if (!overlay) return false;

    pendingButton = button;
    overlayActive = true;
    var totalMs = Math.max(1000, config.seconds * 1000);
    var deadline = Date.now() + totalMs;
    var heading = document.getElementById('bs-overlay-heading');
    if (heading) heading.textContent = config.type === 'custom' ? (config.name || 'Valfri övning') : 'Vila';
    overlay.dataset.betweenType = config.type;
    overlay.classList.add('show');

    function tick() {
      if (!overlayActive) return;
      var remain = Math.max(0, deadline - Date.now());
      var value = document.getElementById('bs-overlay-value');
      if (value) value.textContent = formatTime(remain / 1000);
      var activeCount = Math.max(0, Math.min(60, Math.ceil(60 * remain / totalMs)));
      overlay.querySelectorAll('.bs-segment').forEach(function (seg, idx) {
        seg.classList.toggle('active', idx < activeCount);
      });
      if (remain <= 0) finishOverlay();
    }

    tick();
    overlayTimer = setInterval(tick, 100);
    return true;
  }

  function shouldIntercept(button) {
    var controls = button && button.closest ? button.closest('#session-controls') : null;
    var state = getState();
    if (!controls || !state || state.setRunning || !state.awaitingDecision) return false;

    var text = (button.textContent || '').trim().toLowerCase();
    if (text.indexOf('starta nästa set') === 0 || text.indexOf('extra set') === 0) return true;
    if (text.indexOf('övning klar') === 0) {
      return Array.isArray(state.exercises) && Number(state.exerciseIndex) + 1 < state.exercises.length;
    }
    return false;
  }

  function handleSessionClick(event) {
    var button = event.target && event.target.closest ? event.target.closest('#session-controls button') : null;
    if (!button) return;

    if (bypassNextClick) {
      bypassNextClick = false;
      return;
    }
    if (overlayActive || !shouldIntercept(button)) return;

    var state = getState();
    var config = configForDate(state && state.date);
    if (!config || config.type === 'none') return;

    try {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!startOverlay(config, button)) {
        bypassNextClick = true;
        button.click();
      } else if (config.type === 'rest') {
        var text = String(button.textContent || '').trim().toLowerCase();
        var kind = text.indexOf('övning klar') === 0 ? 'finish' : 'next';
        var controller = window.__exerciseSessionControllerV46;
        if (controller && typeof controller.armRestTransition === 'function') {
          controller.armRestTransition(kind);
        }
      }
    } catch (e) {
      bypassNextClick = true;
      try { button.click(); } catch (ignore) {}
    }
  }

  function install() {
    addStyles();
    ensureOverlay();

    document.addEventListener('click', handleSessionClick, true);

    document.addEventListener('click', function (event) {
      setTimeout(function () {
        var editor = ensureEditor();
        if (!editor) return;
        var button = event.target && event.target.closest ? event.target.closest('#day-workout-modal button') : null;
        if (!button) return;
        var text = (button.textContent || '').trim().toLowerCase();
        if (text.indexOf('spara passupplägg') >= 0 || text.indexOf('starta pass') >= 0) {
          var date = currentBuilderDate();
          persistToPlan(date, editorConfig(editor));
        }
      }, 0);
    }, false);

    document.addEventListener('change', function (event) {
      if (event.target && event.target.id === 'day-workout-date') {
        var editor = document.getElementById('between-set-global-editor-v2');
        if (editor) editor.dataset.loadedDate = '';
        setTimeout(ensureEditor, 0);
      }
    }, false);

    window.__exerciseCancelBetweenSet = function () {
      overlayActive = false;
      pendingButton = null;
      if (overlayTimer) clearInterval(overlayTimer);
      overlayTimer = null;
      var overlay = document.getElementById('session-between-overlay-v2');
      if (overlay) overlay.classList.remove('show');
    };

    setTimeout(ensureEditor, 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
