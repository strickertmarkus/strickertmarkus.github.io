(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var profile = (new URLSearchParams(window.location.search).get('user') || 'markus').toLowerCase() === 'maja' ? 'maja' : 'markus';
  var globalByDate = Object.create(null);
  var plannedRowConfigs = [];
  var loadedDate = '';
  var syncTimer = null;
  var originalPersist = null;
  var originalStartBuilder = null;
  var originalLoadBuilder = null;
  var previewDraft = null;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function normalizeConfig(raw, fallbackType) {
    raw = raw || {};
    var type = raw.type === 'custom' ? 'custom' : (raw.type === 'rest' ? 'rest' : (fallbackType || 'rest'));
    var enabled = raw.enabled === false ? false : (raw.enabled === true || raw.type === 'custom' || raw.type === 'rest');
    return {
      enabled:!!enabled,
      type:type,
      seconds:Math.max(1,Math.round(Number(raw.seconds) || (type === 'rest' ? 60 : 30))),
      name:type === 'custom' ? String(raw.name || '').trim() : ''
    };
  }

  function inactiveConfig() {
    return { enabled:false, type:'rest', seconds:60, name:'' };
  }

  function currentDate() {
    var modal = document.getElementById('day-workout-modal');
    var input = document.getElementById('day-workout-date');
    return (modal && modal.dataset.date) || (input && input.value) || '';
  }

  function getPlanned() {
    try { return typeof window.getPlannedSessions === 'function' ? (window.getPlannedSessions() || {}) : {}; }
    catch (_) { return {}; }
  }

  function loadPlanState(date) {
    if (!date) return;
    var planned = getPlanned();
    var plan = planned[date] || {};
    var legacy = plan.betweenExercises || plan.betweenSets || null;
    globalByDate[date] = legacy ? normalizeConfig(legacy) : inactiveConfig();
    plannedRowConfigs = (plan.exercises || []).map(function (ex) {
      return ex && ex.betweenSets ? normalizeConfig(ex.betweenSets) : inactiveConfig();
    });
    loadedDate = date;
  }

  function rowConfig(row) {
    if (!row) return inactiveConfig();
    try {
      var raw = row.dataset.betweenSetsV7 ? JSON.parse(row.dataset.betweenSetsV7) : null;
      return raw ? normalizeConfig(raw) : inactiveConfig();
    } catch (_) { return inactiveConfig(); }
  }

  function setRowConfig(row, config) {
    if (!row) return;
    config = normalizeConfig(config);
    row.dataset.betweenSetsV7 = JSON.stringify(config);
    syncPerRowUi(row,config);
  }

  function isStrengthRow(row) {
    var hidden = row && row.querySelector('.dw-kind');
    return !hidden || hidden.value !== 'cardio';
  }

  function addStyles() {
    if (document.getElementById('exercise-builder-between-preview-v7-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-builder-between-preview-v7-style';
    style.textContent = `
      /* The old builder-only five-second timer switch is replaced by the new
         between-exercises switch. The in-session five-second control remains. */
      #pretimer-builder-v2{display:none!important}
      #between-set-global-editor-v2{display:none!important}

      #day-workout-modal .builder-week-between-v7{
        display:grid!important;
        grid-template-columns:minmax(0,1.12fr) minmax(145px,.88fr)!important;
        column-gap:12px!important;
        align-items:end!important;
      }
      #day-workout-modal .builder-week-between-v7>label{grid-column:1/-1}
      #day-workout-modal .builder-week-between-v7>.week-nav{grid-column:1;min-width:0}
      #between-exercise-toggle-panel-v7{
        grid-column:2;
        min-width:0;
        min-height:58px;
        padding:8px 9px;
        border:1px solid rgba(251,146,60,.34);
        border-radius:10px;
        background:
          radial-gradient(circle at 84% 50%,rgba(251,146,60,.16),transparent 44%),
          linear-gradient(180deg,rgba(251,146,60,.10),rgba(251,146,60,.035));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 0 18px rgba(251,146,60,.075);
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
      }
      .between-toggle-copy-v7{min-width:0}
      .between-toggle-copy-v7 strong{display:block;color:#FDBA74;font-size:10px;line-height:1.2;text-shadow:0 0 10px rgba(251,146,60,.24)}
      .between-toggle-copy-v7 span{display:block;margin-top:2px;color:#A58B77;font-size:8px;line-height:1.25}
      .between-switch-v7{
        width:43px;height:24px;padding:3px;flex:0 0 auto;
        border:1px solid rgba(251,146,60,.32);border-radius:999px;
        background:linear-gradient(180deg,rgba(251,146,60,.085),rgba(251,146,60,.035));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 0 10px rgba(251,146,60,.045);
        cursor:pointer;
        transition:background .17s ease,border-color .17s ease,box-shadow .17s ease;
      }
      .between-switch-v7::after{
        content:'';display:block;width:16px;height:16px;border-radius:50%;
        background:#7C8798;transform:translateX(0);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 1px 3px rgba(0,0,0,.42);
        transition:transform .17s ease,background .17s ease,box-shadow .17s ease;
      }
      .between-switch-v7[aria-pressed="true"]{
        background:linear-gradient(180deg,rgba(251,146,60,.28),rgba(251,146,60,.13));
        border-color:rgba(251,146,60,.64);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.11),0 0 14px rgba(251,146,60,.30),0 0 26px rgba(251,146,60,.13);
      }
      .between-switch-v7[aria-pressed="true"]::after{
        transform:translateX(19px);
        background:#FFF8E9;
        box-shadow:0 0 2px rgba(255,255,255,.98),0 0 8px rgba(251,146,60,.92),0 0 16px rgba(251,146,60,.52);
      }
      .between-switch-v7:focus-visible{outline:2px solid rgba(251,146,60,.72);outline-offset:2px}

      #between-exercise-global-editor-v7{
        margin-top:8px;padding:9px 10px;
        border:1px solid rgba(251,146,60,.28);border-radius:10px;
        background:
          radial-gradient(360px 110px at 86% 0,rgba(251,146,60,.09),transparent 72%),
          rgba(251,146,60,.035);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
      }
      #between-exercise-global-editor-v7[hidden]{display:none!important}
      .between-global-title-v7{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}
      .between-global-title-v7 strong{color:#FDBA74;font-size:10px;text-transform:uppercase;letter-spacing:.55px;text-shadow:0 0 10px rgba(251,146,60,.20)}
      .between-global-title-v7 span{color:#9D8776;font-size:8px}
      .between-fields-v7{display:grid;grid-template-columns:minmax(110px,.85fr) 86px minmax(130px,1.2fr);gap:7px}
      .between-fields-v7 .between-name-v7[hidden]{display:none!important}
      .between-fields-v7 label{display:block;margin-bottom:3px;color:#A58B77;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
      .between-fields-v7 select,.between-fields-v7 input{
        width:100%;height:34px;min-width:0;padding:5px 7px;
        border:1px solid rgba(251,146,60,.18);border-radius:7px;
        background:#211E1C;color:#F0F6FC;outline:none;font:600 11px/1 Inter,sans-serif;
      }
      .between-fields-v7 select:focus,.between-fields-v7 input:focus{border-color:rgba(251,146,60,.62);box-shadow:0 0 0 2px rgba(251,146,60,.09),0 0 12px rgba(251,146,60,.09)}

      .per-set-v7{
        margin-top:6px;padding-top:6px;border-top:1px solid rgba(251,146,60,.12);
        display:flex;align-items:center;gap:7px;min-height:29px;
      }
      .per-set-v7[hidden]{display:none!important}
      .per-set-toggle-wrap-v7{display:flex;align-items:center;gap:6px;flex:0 0 auto}
      .per-set-label-v7{color:#C99A72;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.45px;white-space:nowrap}
      .per-set-v7 .between-switch-v7{width:36px;height:20px;padding:2px}
      .per-set-v7 .between-switch-v7::after{width:14px;height:14px}
      .per-set-v7 .between-switch-v7[aria-pressed="true"]::after{transform:translateX(16px)}
      .per-set-fields-v7{display:grid;grid-template-columns:92px 68px minmax(95px,1fr);gap:5px;flex:1 1 auto;min-width:0}
      .per-set-fields-v7[hidden]{display:none!important}
      .per-set-fields-v7 .per-set-name-v7[hidden]{display:none!important}
      .per-set-fields-v7 select,.per-set-fields-v7 input{
        width:100%;min-width:0;height:28px;padding:3px 6px;
        border:1px solid rgba(251,146,60,.16);border-radius:6px;
        background:rgba(251,146,60,.026);color:#DCE7F3;outline:none;
        font:600 9px/1 Inter,sans-serif;
      }
      .per-set-fields-v7 select:focus,.per-set-fields-v7 input:focus{border-color:rgba(251,146,60,.52);box-shadow:0 0 0 2px rgba(251,146,60,.07)}

      #exercise-plan-preview-v7{
        position:fixed;inset:0;z-index:2147483300;
        display:none;place-items:center;padding:18px;
        background:rgba(3,7,13,.76);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);
      }
      #exercise-plan-preview-v7.show{display:grid}
      .plan-preview-card-v7{
        width:min(520px,100%);max-height:min(78dvh,720px);overflow:auto;
        padding:16px;border:1px solid rgba(34,211,238,.22);border-radius:16px;
        background:linear-gradient(180deg,#17202a,#111922);box-shadow:0 28px 80px rgba(0,0,0,.55);
      }
      .plan-preview-head-v7{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
      .plan-preview-kicker-v7{color:#67E8F9;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.8px}
      .plan-preview-title-v7{margin-top:3px;color:#F0F6FC;font-size:18px;font-weight:850;line-height:1.2}
      .plan-preview-date-v7{margin-top:3px;color:#7C8A9B;font-size:10px}
      .plan-preview-close-v7{border:0;background:transparent;color:#64748B;font-size:20px;cursor:pointer;padding:2px 5px}
      .plan-preview-list-v7{display:flex;flex-direction:column;gap:5px}
      .plan-preview-row-v7{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 9px;border:1px solid rgba(255,255,255,.055);border-radius:9px;background:rgba(255,255,255,.018)}
      .plan-preview-num-v7{color:#64748B;font-size:9px;font-weight:800;text-align:center}
      .plan-preview-name-v7{color:#E6EDF5;font-size:11px;font-weight:750;overflow-wrap:anywhere}
      .plan-preview-target-v7{color:#8FA0B3;font-size:9px;text-align:right;white-space:nowrap}
      .plan-preview-between-v7{grid-column:2/-1;margin-top:-2px;color:#FDBA74;font-size:8px;font-weight:700}
      .plan-preview-global-v7{margin-top:9px;padding:8px 9px;border:1px solid rgba(251,146,60,.22);border-radius:9px;background:rgba(251,146,60,.055);color:#FDBA74;font-size:9px;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
      .plan-preview-actions-v7{display:flex;justify-content:flex-end;gap:7px;margin-top:13px}
      .plan-preview-actions-v7 button{min-height:36px;border-radius:8px;padding:7px 12px;font:750 10px/1 Inter,sans-serif;cursor:pointer}
      .plan-preview-back-v7{border:1px solid rgba(148,163,184,.18);background:transparent;color:#A8B6C7}
      .plan-preview-save-v7{border:1px solid rgba(34,211,238,.42);background:#22D3EE;color:#06141A}

      /* Exercise profile switch: Markus stays blue; Maja gets her own pink active state. */
      .exercise-user-option[data-user="markus"].active{background:rgba(56,189,248,.14)!important;color:#38BDF8!important;box-shadow:inset 0 0 0 1px rgba(56,189,248,.42)!important}
      .exercise-user-option[data-user="maja"].active{background:rgba(244,114,182,.15)!important;color:#F472B6!important;box-shadow:inset 0 0 0 1px rgba(244,114,182,.46)!important}
      body.exercise-profile-maja-v7 .brand-text p{color:#F472B6!important}
      body.exercise-profile-markus-v7 .brand-text p{color:#38BDF8!important}

      @media(max-width:600px){
        #day-workout-modal .builder-week-between-v7{grid-template-columns:minmax(0,1.08fr) minmax(130px,.92fr)!important;column-gap:8px!important}
        #between-exercise-toggle-panel-v7{min-height:55px;padding:7px 8px}
        .between-toggle-copy-v7 strong{font-size:9px}.between-toggle-copy-v7 span{font-size:7px}
        .between-fields-v7{grid-template-columns:minmax(0,1fr) 78px}.between-fields-v7 .between-name-v7{grid-column:1/-1}
        .per-set-v7{gap:5px;align-items:flex-start;flex-wrap:wrap}
        .per-set-toggle-wrap-v7{min-height:28px}
        .per-set-fields-v7{grid-template-columns:88px 64px minmax(90px,1fr);width:100%}
        .plan-preview-card-v7{padding:13px;max-height:82dvh}
        .plan-preview-row-v7{grid-template-columns:20px minmax(0,1fr) auto;padding:7px 8px}
      }
      @media(max-width:380px){
        #day-workout-modal .builder-week-between-v7{grid-template-columns:1fr!important;row-gap:7px!important}
        #day-workout-modal .builder-week-between-v7>.week-nav,#between-exercise-toggle-panel-v7{grid-column:1}
        .per-set-fields-v7{grid-template-columns:minmax(0,1fr) 64px}.per-set-name-v7{grid-column:1/-1}
      }
    `;
    document.head.appendChild(style);
  }

  function globalConfig(date) {
    if (!date) return inactiveConfig();
    if (!globalByDate[date]) loadPlanState(date);
    return globalByDate[date] || inactiveConfig();
  }

  function syncGlobalFields(editor, config) {
    if (!editor) return;
    config = normalizeConfig(config);
    var type = editor.querySelector('[data-global-type-v7]');
    var seconds = editor.querySelector('[data-global-seconds-v7]');
    var name = editor.querySelector('[data-global-name-v7]');
    if (type) type.value = config.type;
    if (seconds) seconds.value = config.seconds;
    if (name) name.value = config.name;
    var nameWrap = editor.querySelector('.between-name-v7');
    if (nameWrap) nameWrap.hidden = config.type !== 'custom';
  }

  function ensureGlobalUi() {
    var modal = document.getElementById('day-workout-modal');
    var list = document.getElementById('day-workout-ex-list');
    if (!modal || !modal.classList.contains('show') || !list) return;
    var date = currentDate();
    if (!date) return;
    if (loadedDate !== date) loadPlanState(date);

    var weekLabel = document.getElementById('day-workout-week-label');
    var weekGroup = weekLabel && weekLabel.closest('.form-group');
    var weekNav = weekGroup && weekGroup.querySelector('.week-nav');
    if (weekGroup && weekNav) {
      weekGroup.classList.add('builder-week-between-v7');
      var togglePanel = document.getElementById('between-exercise-toggle-panel-v7');
      if (!togglePanel) {
        togglePanel = document.createElement('div');
        togglePanel.id = 'between-exercise-toggle-panel-v7';
        togglePanel.innerHTML = '<div class="between-toggle-copy-v7"><strong>Mellan övningar</strong><span>Aktivitet när nästa övning börjar</span></div><button type="button" class="between-switch-v7" data-global-toggle-v7 aria-label="Mellan övningar"></button>';
        weekNav.insertAdjacentElement('afterend',togglePanel);
      }
      var cfg = globalConfig(date);
      var switchEl = togglePanel.querySelector('[data-global-toggle-v7]');
      if (switchEl) switchEl.setAttribute('aria-pressed',cfg.enabled ? 'true' : 'false');
    }

    var exerciseGroup = list.closest('.form-group') || list.parentElement;
    if (!exerciseGroup) return;
    var editor = document.getElementById('between-exercise-global-editor-v7');
    if (!editor) {
      editor = document.createElement('div');
      editor.id = 'between-exercise-global-editor-v7';
      editor.innerHTML = '<div class="between-global-title-v7"><strong>Mellan varje övning</strong><span>Gäller övergången till nästa övning</span></div>' +
        '<div class="between-fields-v7">' +
          '<div><label>Aktivitet</label><select data-global-type-v7><option value="rest">Vila</option><option value="custom">Valfri övning</option></select></div>' +
          '<div><label>Tid</label><input type="number" min="1" step="1" inputmode="numeric" data-global-seconds-v7></div>' +
          '<div class="between-name-v7"><label>Övning</label><input type="text" data-global-name-v7 placeholder="Ex: Hopprep"></div>' +
        '</div>';
      exerciseGroup.appendChild(editor);
    }
    var config = globalConfig(date);
    editor.hidden = !config.enabled;
    if (editor.dataset.date !== date) {
      editor.dataset.date = date;
      syncGlobalFields(editor,config);
    }
  }

  function perRowMarkup() {
    return '<div class="per-set-v7">' +
      '<div class="per-set-toggle-wrap-v7"><span class="per-set-label-v7">Mellan set</span><button type="button" class="between-switch-v7" data-per-set-toggle-v7 aria-label="Mellan set"></button></div>' +
      '<div class="per-set-fields-v7" hidden>' +
        '<select data-per-set-type-v7 aria-label="Aktivitet mellan set"><option value="rest">Vila</option><option value="custom">Valfri övning</option></select>' +
        '<input type="number" min="1" step="1" inputmode="numeric" data-per-set-seconds-v7 aria-label="Tid mellan set">' +
        '<input type="text" class="per-set-name-v7" data-per-set-name-v7 placeholder="Ex: Hopprep" aria-label="Mellanövning">' +
      '</div>' +
    '</div>';
  }

  function syncPerRowUi(row, config) {
    var panel = row && row.querySelector('.per-set-v7');
    if (!panel) return;
    panel.hidden = !isStrengthRow(row);
    config = normalizeConfig(config);
    var toggle = panel.querySelector('[data-per-set-toggle-v7]');
    var fields = panel.querySelector('.per-set-fields-v7');
    var type = panel.querySelector('[data-per-set-type-v7]');
    var seconds = panel.querySelector('[data-per-set-seconds-v7]');
    var name = panel.querySelector('[data-per-set-name-v7]');
    if (toggle) toggle.setAttribute('aria-pressed',config.enabled ? 'true' : 'false');
    if (fields) fields.hidden = !config.enabled;
    if (type) type.value = config.type;
    if (seconds) seconds.value = config.seconds;
    if (name) { name.value = config.name; name.hidden = config.type !== 'custom'; }
  }

  function enhanceRows() {
    var list = document.getElementById('day-workout-ex-list');
    if (!list) return;
    var date = currentDate();
    if (date && loadedDate !== date) loadPlanState(date);
    var rows = Array.prototype.slice.call(list.querySelectorAll(':scope > .ex-row-item'));
    rows.forEach(function (row,index) {
      if (!row.querySelector('.per-set-v7')) row.insertAdjacentHTML('beforeend',perRowMarkup());
      if (!row.dataset.betweenSetsV7) {
        var cfg = plannedRowConfigs[index] || inactiveConfig();
        row.dataset.betweenSetsV7 = JSON.stringify(cfg);
      }
      syncPerRowUi(row,rowConfig(row));
    });
  }

  function updateGlobalFromEditor() {
    var date = currentDate();
    var editor = document.getElementById('between-exercise-global-editor-v7');
    if (!date || !editor) return;
    var current = globalConfig(date);
    var type = editor.querySelector('[data-global-type-v7]');
    var seconds = editor.querySelector('[data-global-seconds-v7]');
    var name = editor.querySelector('[data-global-name-v7]');
    current.type = type ? type.value : current.type;
    current.seconds = Math.max(1,Math.round(Number(seconds && seconds.value) || (current.type === 'rest' ? 60 : 30)));
    current.name = current.type === 'custom' ? String(name && name.value || '').trim() : '';
    globalByDate[date] = normalizeConfig(current);
    var nameWrap = editor.querySelector('.between-name-v7');
    if (nameWrap) nameWrap.hidden = current.type !== 'custom';
  }

  function handleBuilderClick(event) {
    var modal = event.target && event.target.closest ? event.target.closest('#day-workout-modal') : null;
    if (!modal) return;

    var globalToggle = event.target.closest('[data-global-toggle-v7]');
    if (globalToggle) {
      event.preventDefault();
      var date = currentDate();
      var cfg = globalConfig(date);
      cfg.enabled = !cfg.enabled;
      globalByDate[date] = normalizeConfig(cfg);
      globalToggle.setAttribute('aria-pressed',cfg.enabled ? 'true' : 'false');
      var editor = document.getElementById('between-exercise-global-editor-v7');
      if (editor) { editor.hidden = !cfg.enabled; syncGlobalFields(editor,cfg); }
      return;
    }

    var perToggle = event.target.closest('[data-per-set-toggle-v7]');
    if (perToggle) {
      event.preventDefault();
      var row = perToggle.closest('.ex-row-item');
      var rowCfg = rowConfig(row);
      rowCfg.enabled = !rowCfg.enabled;
      setRowConfig(row,rowCfg);
    }
  }

  function handleBuilderInput(event) {
    var target = event.target;
    if (!target || !target.closest || !target.closest('#day-workout-modal')) return;

    if (target.matches('[data-global-type-v7],[data-global-seconds-v7],[data-global-name-v7]')) {
      updateGlobalFromEditor();
      return;
    }

    var row = target.closest('#day-workout-ex-list .ex-row-item');
    if (!row) return;
    if (target.matches('.dw-kind,.dw-metric1,.ex-kind-btn')) {
      setTimeout(function () { syncPerRowUi(row,rowConfig(row)); },0);
      return;
    }
    if (!target.matches('[data-per-set-type-v7],[data-per-set-seconds-v7],[data-per-set-name-v7]')) return;
    var cfg = rowConfig(row);
    var panel = row.querySelector('.per-set-v7');
    var type = panel.querySelector('[data-per-set-type-v7]');
    var seconds = panel.querySelector('[data-per-set-seconds-v7]');
    var name = panel.querySelector('[data-per-set-name-v7]');
    cfg.type = type.value;
    cfg.seconds = Math.max(1,Math.round(Number(seconds.value) || (cfg.type === 'rest' ? 60 : 30)));
    cfg.name = cfg.type === 'custom' ? String(name.value || '').trim() : '';
    setRowConfig(row,cfg);
  }

  function parseRow(row) {
    try {
      if (typeof window.parseExerciseRow === 'function') return window.parseExerciseRow(row,'dw');
    } catch (_) {}
    var nameEl = row.querySelector('.dw-name');
    var kindEl = row.querySelector('.dw-kind');
    var name = String(nameEl && nameEl.value || '').trim();
    if (!name) return null;
    var kind = kindEl ? kindEl.value : 'strength';
    if (kind === 'cardio') return {kind:'cardio',name:name,distance:+row.querySelector('.dw-metric1').value||0,time:+row.querySelector('.dw-metric2').value||0};
    return {kind:'strength',name:name,sets:+row.querySelector('.dw-metric1').value||1,reps:+row.querySelector('.dw-metric2').value||0,weight:+row.querySelector('.dw-metric3').value||0};
  }

  function captureDraft() {
    var modal = document.getElementById('day-workout-modal');
    if (!modal) return null;
    var dateInput = document.getElementById('day-workout-date');
    var date = (dateInput && dateInput.value) || modal.dataset.date || '';
    var typeInput = document.getElementById('day-workout-type');
    var type = String(typeInput && typeInput.value || 'Övrigt').trim() || 'Övrigt';
    var exercises = [];
    Array.prototype.slice.call(document.querySelectorAll('#day-workout-ex-list > .ex-row-item')).forEach(function (row) {
      var exercise = parseRow(row);
      if (!exercise) return;
      var between = isStrengthRow(row) ? rowConfig(row) : inactiveConfig();
      exercises.push({ exercise:exercise, betweenSets:between.enabled ? between : inactiveConfig() });
    });
    return { date:date, type:type, exercises:exercises, betweenExercises:normalizeConfig(globalConfig(date)) };
  }

  function targetText(ex) {
    if (!ex) return '—';
    if (ex.kind === 'cardio') {
      var p=[];
      if (Number(ex.distance)>0) p.push(ex.distance+' km');
      if (Number(ex.time)>0) p.push(ex.time+' min');
      return p.join(' · ') || 'Kondition';
    }
    var base=(Number(ex.sets)||1)+'×'+(Number(ex.reps)||0);
    if (Number(ex.weight)>0) base+=' · '+ex.weight+' kg';
    return base;
  }

  function configText(cfg,prefix) {
    cfg=normalizeConfig(cfg);
    if (!cfg.enabled) return '';
    var what=cfg.type==='custom'?(cfg.name||'Valfri övning'):'Vila';
    return (prefix ? prefix+': ' : '')+what+' · '+cfg.seconds+' s';
  }

  function ensurePreview() {
    var overlay=document.getElementById('exercise-plan-preview-v7');
    if (overlay) return overlay;
    overlay=document.createElement('div');
    overlay.id='exercise-plan-preview-v7';
    overlay.innerHTML='<div class="plan-preview-card-v7" role="dialog" aria-modal="true" aria-labelledby="plan-preview-title-v7">' +
      '<div class="plan-preview-head-v7"><div><div class="plan-preview-kicker-v7">Förhandsgranskning</div><div class="plan-preview-title-v7" id="plan-preview-title-v7"></div><div class="plan-preview-date-v7" id="plan-preview-date-v7"></div></div><button type="button" class="plan-preview-close-v7" data-preview-back-v7 aria-label="Tillbaka">×</button></div>' +
      '<div class="plan-preview-list-v7" id="plan-preview-list-v7"></div>' +
      '<div class="plan-preview-global-v7" id="plan-preview-global-v7" hidden></div>' +
      '<div class="plan-preview-actions-v7"><button type="button" class="plan-preview-back-v7" data-preview-back-v7>Tillbaka & redigera</button><button type="button" class="plan-preview-save-v7" data-preview-save-v7>Spara pass</button></div>' +
    '</div>';
    overlay.addEventListener('click',function (event) {
      if (event.target===overlay || event.target.closest('[data-preview-back-v7]')) { closePreview(); return; }
      if (event.target.closest('[data-preview-save-v7]')) confirmPreviewSave();
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function showPreview() {
    var draft=captureDraft();
    if (!draft || !draft.exercises.length) {
      try { if (typeof window.showToast==='function') window.showToast('Lägg till minst en övning.'); } catch (_) {}
      return false;
    }
    previewDraft=draft;
    var overlay=ensurePreview();
    document.getElementById('plan-preview-title-v7').textContent=draft.type;
    document.getElementById('plan-preview-date-v7').textContent=draft.date || '';
    document.getElementById('plan-preview-list-v7').innerHTML=draft.exercises.map(function (entry,index) {
      var between=configText(entry.betweenSets,'Mellan set');
      return '<div class="plan-preview-row-v7"><div class="plan-preview-num-v7">'+(index+1)+'</div><div class="plan-preview-name-v7">'+esc(entry.exercise.name)+'</div><div class="plan-preview-target-v7">'+esc(targetText(entry.exercise))+'</div>'+(between?'<div class="plan-preview-between-v7">'+esc(between)+'</div>':'')+'</div>';
    }).join('');
    var global=document.getElementById('plan-preview-global-v7');
    var globalText=configText(draft.betweenExercises,'Mellan övningar');
    global.hidden=!globalText;
    global.textContent=globalText;
    overlay.classList.add('show');
    return true;
  }

  function closePreview() {
    var overlay=document.getElementById('exercise-plan-preview-v7');
    if (overlay) overlay.classList.remove('show');
    previewDraft=null;
  }

  function writeExtras(draft) {
    if (!draft || !draft.date) return;
    var planned=getPlanned();
    var plan=planned[draft.date];
    if (!plan) return;
    delete plan.betweenSets;
    plan.betweenExercises=draft.betweenExercises.enabled ? {
      enabled:true,type:draft.betweenExercises.type,seconds:draft.betweenExercises.seconds,name:draft.betweenExercises.name
    } : {enabled:false,type:'none',seconds:30,name:''};
    if (Array.isArray(plan.exercises)) {
      plan.exercises.forEach(function (ex,index) {
        var source=draft.exercises[index];
        if (!ex) return;
        if (source && source.betweenSets && source.betweenSets.enabled) {
          ex.betweenSets={enabled:true,type:source.betweenSets.type,seconds:source.betweenSets.seconds,name:source.betweenSets.name};
        } else if (Object.prototype.hasOwnProperty.call(ex,'betweenSets')) {
          delete ex.betweenSets;
        }
      });
    }
    try { if (typeof window.savePlannedSessions==='function') window.savePlannedSessions(planned); } catch (_) {}
    loadPlanState(draft.date);
  }

  function persistDraft(draft,startAfter) {
    if (!draft || !originalPersist) return false;
    var ok=false;
    try { ok=originalPersist({startAfterSave:!!startAfter}) !== false; } catch (_) { ok=false; }
    if (!ok) return false;
    writeExtras(draft);
    return true;
  }

  function confirmPreviewSave() {
    var draft=previewDraft || captureDraft();
    if (!draft) return;
    var overlay=document.getElementById('exercise-plan-preview-v7');
    if (overlay) overlay.classList.remove('show');
    previewDraft=null;
    persistDraft(draft,false);
  }

  function installSaveFlow() {
    if (!originalPersist && typeof window.persistDayWorkoutPlan==='function') originalPersist=window.persistDayWorkoutPlan;
    if (!originalStartBuilder && typeof window.startDayWorkoutFromBuilder==='function') originalStartBuilder=window.startDayWorkoutFromBuilder;
    if (!originalPersist) return false;

    window.saveDayWorkoutPlan=function () { return showPreview(); };
    window.startDayWorkoutFromBuilder=function () {
      var draft=captureDraft();
      if (!draft || !draft.exercises.length) {
        try { if (typeof window.showToast==='function') window.showToast('Lägg till minst en övning.'); } catch (_) {}
        return;
      }
      if (!persistDraft(draft,true)) return;
      try { if (typeof window.startWorkoutSessionForDate==='function') window.startWorkoutSessionForDate(draft.date); } catch (_) {}
    };
    return true;
  }

  function installLoadHook() {
    if (originalLoadBuilder || typeof window.loadDayWorkoutBuilder!=='function') return;
    originalLoadBuilder=window.loadDayWorkoutBuilder;
    window.loadDayWorkoutBuilder=function (iso) {
      var result=originalLoadBuilder.apply(this,arguments);
      loadPlanState(iso || currentDate());
      setTimeout(function () { ensureGlobalUi(); enhanceRows(); },0);
      return result;
    };
  }

  function sync() {
    var modal=document.getElementById('day-workout-modal');
    if (modal && modal.classList.contains('show')) {
      ensureGlobalUi();
      enhanceRows();
    }
    installSaveFlow();
    installLoadHook();
  }

  function install() {
    if (window.__exerciseBuilderBetweenPreviewV7Installed) return;
    if (!document.getElementById('day-workout-modal')) { setTimeout(install,50); return; }
    window.__exerciseBuilderBetweenPreviewV7Installed=true;
    document.body.classList.add(profile==='maja'?'exercise-profile-maja-v7':'exercise-profile-markus-v7');
    addStyles();
    document.addEventListener('click',handleBuilderClick,false);
    document.addEventListener('input',handleBuilderInput,false);
    document.addEventListener('change',handleBuilderInput,false);
    sync();
    syncTimer=setInterval(sync,180);
    window.__exerciseBuilderBetweenPreviewV7={captureDraft:captureDraft,showPreview:showPreview};
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
