(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var params = new URLSearchParams(window.location.search);
  var profile = (params.get('user') || 'markus').toLowerCase();
  var TIMER_PREFIX = 'ex_pretimer_v2_' + profile + '_';
  var autoPending = null;
  var lastDecisionKey = '';
  var fastTimer = null;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; } catch (e) { return null; }
  }

  function getPlannedSafe() {
    try { return typeof window.getPlannedSessions === 'function' ? (window.getPlannedSessions() || {}) : {}; }
    catch (e) { return {}; }
  }

  function savePlannedSafe(value) {
    try { if (typeof window.savePlannedSessions === 'function') window.savePlannedSessions(value); }
    catch (e) {}
  }

  function timerKey(date) { return TIMER_PREFIX + (date || ''); }

  function timerEnabledForDate(date) {
    if (!date) return true;
    var planned = getPlannedSafe();
    var plan = planned && planned[date];
    if (plan && typeof plan.preTimerEnabled === 'boolean') return plan.preTimerEnabled;
    try {
      var local = localStorage.getItem(timerKey(date));
      if (local === '0') return false;
      if (local === '1') return true;
    } catch (e) {}
    return true;
  }

  function persistTimer(date, enabled) {
    if (!date) return;
    enabled = enabled !== false;
    try { localStorage.setItem(timerKey(date), enabled ? '1' : '0'); } catch (e) {}
    var planned = getPlannedSafe();
    if (planned && planned[date]) {
      planned[date].preTimerEnabled = enabled;
      savePlannedSafe(planned);
    }
  }

  function currentBuilderDate() {
    var modal = document.getElementById('day-workout-modal');
    var input = document.getElementById('day-workout-date');
    return (modal && modal.dataset.date) || (input && input.value) || '';
  }

  function addStyles() {
    if (document.getElementById('exercise-flow-polish-v2-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-flow-polish-v2-style';
    style.textContent = `
      /* The retired auto-advance flow hid this entire row. The unified session
         controller deliberately waits for the user when no rest is configured,
         so the decision controls must remain visible and easy to hit. */
      #session-controls.decision-row {
        display:grid !important;
        grid-template-columns:minmax(0,1fr) !important;
        gap:8px !important;
        width:100% !important;
      }
      #session-controls.decision-row .session-cta.primary:first-child {
        grid-column:1 / -1 !important;
        min-height:52px !important;
        font-size:13px !important;
      }
      #session-controls.decision-row .session-cta.warn {
        display:none !important;
      }
      #session-controls.decision-row:has(.session-cta.primary) .session-cta.success {
        display:none !important;
      }
      #session-controls.decision-row .session-cta.success {
        grid-column:1 / -1 !important;
        min-height:43px !important;
      }
      @media(max-width:380px) {
        #session-controls.decision-row { gap:7px !important; }
        #session-controls.decision-row .session-cta {
          padding-left:5px !important;
          padding-right:5px !important;
          font-size:11px !important;
        }
      }

      /* Stronger active-set contrast. */
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) {
        --accent:#FF8A1F !important;
        --accent-dim:rgba(255,122,26,.20) !important;
        --accent-glow:rgba(255,122,26,.48) !important;
        --border-a:rgba(255,151,69,.68) !important;
        background:rgba(28,8,2,.98) !important;
      }
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell {
        background:
          radial-gradient(circle at 50% 8%,rgba(255,122,26,.28),transparent 38%),
          linear-gradient(180deg,#1d0b04 0%,#160804 55%,#0d0908 100%) !important;
      }
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-card {
        background:rgba(255,122,26,.10) !important;
        border-color:rgba(255,151,69,.42) !important;
        box-shadow:0 0 38px rgba(249,115,22,.08) !important;
      }
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .timer-box {
        background:rgba(255,122,26,.16) !important;
        border-color:rgba(255,151,69,.58) !important;
      }
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) #session-current-ex,
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .timer-val,
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-table th {
        color:#FFB36B !important;
      }
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) #session-controls .session-cta.primary {
        background:linear-gradient(135deg,#FF9A3D,#F97316) !important;
        color:#1b0902 !important;
        box-shadow:0 10px 30px rgba(249,115,22,.34) !important;
      }

      /* Calm blue/cyan state between active sets. */
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) {
        --accent:#22D3EE !important;
        --accent-dim:rgba(34,211,238,.13) !important;
        --accent-glow:rgba(34,211,238,.30) !important;
        --border-a:rgba(34,211,238,.42) !important;
        background:rgba(5,12,22,.97) !important;
      }
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-shell {
        background:
          radial-gradient(circle at 50% 5%,rgba(34,211,238,.14),transparent 38%),
          linear-gradient(180deg,#07121d 0%,#0a111a 58%,#090d14 100%) !important;
      }
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-card {
        background:rgba(34,211,238,.055) !important;
        border-color:rgba(34,211,238,.20) !important;
        box-shadow:0 0 30px rgba(34,211,238,.025) !important;
      }
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .timer-box {
        background:rgba(34,211,238,.075) !important;
        border-color:rgba(34,211,238,.28) !important;
      }
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) #session-current-ex,
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .timer-val,
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-table th {
        color:#67E8F9 !important;
      }
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) #session-controls .session-cta.primary {
        background:linear-gradient(135deg,#22D3EE,#0EA5E9) !important;
        color:#04131a !important;
        box-shadow:0 8px 25px rgba(34,211,238,.18) !important;
      }

      /* The existing overview must remain the final block in Träningsläge. */
      #session-modal.persistent-hype:not(.session-overview-mode) .session-grid > .session-card:nth-child(2) {
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        max-height:none !important;
        grid-column:1 / -1 !important;
        order:99 !important;
        margin-top:8px !important;
      }
      #session-modal.persistent-hype:not(.session-overview-mode) .session-grid > .session-card:nth-child(2) .session-table {
        display:table !important;
        width:100% !important;
      }

      /* Blue rest/between-set overlay, with a compact overview included. */
      #session-between-overlay-v2 {
        background:rgba(4,11,21,.91) !important;
      }
      #session-between-overlay-v2 .bs-heading,
      #session-between-overlay-v2 .bs-value {
        color:#67E8F9 !important;
      }
      #session-between-overlay-v2 .bs-segment {
        background:rgba(34,211,238,.11) !important;
      }
      #session-between-overlay-v2 .bs-segment.active {
        background:#22D3EE !important;
        box-shadow:0 0 8px rgba(34,211,238,.58) !important;
      }
      #session-between-overlay-v2 .bs-core {
        background:rgba(5,15,24,.97) !important;
        border-color:rgba(34,211,238,.20) !important;
      }
      #session-between-overlay-v2 .bs-label { color:#94A3B8 !important; }
      #session-between-overlay-v2 .bs-skip { color:#64748B !important; }
      .bs-rest-overview {
        width:min(560px,calc(100vw - 32px));
        margin:18px auto 0;
        padding:11px 12px;
        border:1px solid rgba(34,211,238,.18);
        border-radius:12px;
        background:rgba(15,23,42,.72);
        text-align:left;
      }
      .bs-rest-overview-title {
        color:#67E8F9;
        font-size:10px;
        font-weight:800;
        letter-spacing:.7px;
        text-transform:uppercase;
        margin-bottom:7px;
      }
      .bs-rest-overview-row {
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:10px;
        align-items:center;
        padding:5px 0;
        border-top:1px solid rgba(255,255,255,.045);
        font-size:10px;
      }
      .bs-rest-overview-row:first-of-type { border-top:0; }
      .bs-rest-overview-row.current .bs-rest-name { color:#F0F6FC; font-weight:800; }
      .bs-rest-name { color:#94A3B8; overflow-wrap:anywhere; }
      .bs-rest-progress { color:#67E8F9; font-variant-numeric:tabular-nums; white-space:nowrap; }

      /* Builder + in-session 5-second timer toggles. */
      .pretimer-builder-v2 {
        margin-top:9px;
        padding:10px 12px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        border:1px solid rgba(34,211,238,.22);
        border-radius:10px;
        background:rgba(34,211,238,.04);
      }
      .pretimer-builder-copy strong {
        display:block;
        color:#CFFAFE;
        font-size:11px;
      }
      .pretimer-builder-copy span {
        display:block;
        margin-top:2px;
        color:#8B949E;
        font-size:9px;
      }
      .pretimer-switch,
      .session-pretimer-toggle-v2 {
        appearance:none;
        border:1px solid rgba(34,211,238,.25);
        background:rgba(34,211,238,.07);
        color:#A5F3FC;
        border-radius:999px;
        cursor:pointer;
        font-family:'Inter',sans-serif;
      }
      .pretimer-switch {
        width:46px;
        height:26px;
        padding:3px;
        position:relative;
        flex:0 0 auto;
      }
      .pretimer-switch::after {
        content:'';
        display:block;
        width:18px;
        height:18px;
        border-radius:50%;
        background:#64748B;
        transform:translateX(0);
        transition:transform .18s ease,background .18s ease;
      }
      .pretimer-switch[aria-pressed="true"] {
        background:rgba(34,211,238,.17);
        border-color:rgba(34,211,238,.48);
      }
      .pretimer-switch[aria-pressed="true"]::after {
        transform:translateX(20px);
        background:#22D3EE;
      }
      .session-pretimer-toggle-v2 {
        min-height:38px;
        padding:6px 8px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:6px;
        font-size:10px;
        font-weight:850;
        white-space:nowrap;
        transition:background .18s ease,border-color .18s ease,color .18s ease,box-shadow .18s ease,transform .12s ease;
      }
      .session-pretimer-toggle-v2:active { transform:scale(.97); }
      .session-pretimer-toggle-v2 .session-timer-icon-v48 {
        display:grid;
        place-items:center;
        width:16px;
        height:16px;
        flex:0 0 16px;
      }
      .session-pretimer-toggle-v2 .session-timer-icon-v48 svg {
        display:block;
        width:16px;
        height:16px;
        fill:none;
        stroke:currentColor;
        stroke-width:1.9;
        stroke-linecap:round;
        stroke-linejoin:round;
      }
      .session-pretimer-toggle-v2 .session-timer-track-v48 {
        width:27px;
        height:16px;
        padding:2px;
        flex:0 0 27px;
        border-radius:999px;
        background:rgba(100,116,139,.34);
        box-shadow:inset 0 0 0 1px rgba(148,163,184,.20);
        transition:background .18s ease,box-shadow .18s ease;
      }
      .session-pretimer-toggle-v2 .session-timer-knob-v48 {
        display:block;
        width:12px;
        height:12px;
        border-radius:50%;
        background:#64748B;
        transform:translateX(0);
        transition:transform .2s cubic-bezier(.2,.8,.2,1),background .18s ease,box-shadow .18s ease;
      }
      .session-pretimer-toggle-v2[aria-pressed="true"] {
        border-color:rgba(34,211,238,.48);
        background:rgba(34,211,238,.14);
        color:#67E8F9;
        box-shadow:0 0 20px rgba(34,211,238,.12),inset 0 0 0 1px rgba(103,232,249,.04);
      }
      .session-pretimer-toggle-v2[aria-pressed="true"] .session-timer-track-v48 {
        background:rgba(34,211,238,.30);
        box-shadow:inset 0 0 0 1px rgba(103,232,249,.28),0 0 10px rgba(34,211,238,.18);
      }
      .session-pretimer-toggle-v2[aria-pressed="true"] .session-timer-knob-v48 {
        transform:translateX(11px);
        background:#A5F3FC;
        box-shadow:0 0 8px rgba(103,232,249,.75);
      }
      #session-modal.hype-mode .session-pretimer-toggle-v2[aria-pressed="true"] {
        border-color:rgba(255,154,61,.46);
        background:rgba(255,122,26,.12);
        color:#FDBA74;
        box-shadow:0 0 20px rgba(249,115,22,.13),inset 0 0 0 1px rgba(253,186,116,.04);
      }
      #session-modal.hype-mode .session-pretimer-toggle-v2[aria-pressed="true"] .session-timer-track-v48 {
        background:rgba(249,115,22,.30);
        box-shadow:inset 0 0 0 1px rgba(253,186,116,.28),0 0 10px rgba(249,115,22,.20);
      }
      #session-modal.hype-mode .session-pretimer-toggle-v2[aria-pressed="true"] .session-timer-knob-v48 {
        background:#FED7AA;
        box-shadow:0 0 8px rgba(253,186,116,.72);
      }

      /* Weekly toolbar: date + Redigera + Mallpass in the row where Denna vecka was. */
      .week-inline-actions-v2 {
        display:flex;
        align-items:center;
        gap:6px;
        flex:0 0 auto;
      }
      .week-inline-actions-v2 .btn-sm {
        white-space:nowrap;
      }

      @media (max-width:600px) {
        .bs-rest-overview {
          width:min(94vw,500px);
          margin-top:14px;
          padding:9px 10px;
          max-height:170px;
          overflow:auto;
        }
        .bs-rest-overview-row { font-size:9px; padding:4px 0; }
        .pretimer-builder-v2 { padding:9px 10px; }
        .session-pretimer-toggle-v2 {
          min-height:36px;
          padding:6px 7px;
          font-size:9px;
        }
        .week-toolbar {
          flex-wrap:nowrap !important;
          gap:6px !important;
        }
        .week-nav { gap:5px !important; min-width:0 !important; }
        .week-nav-copy { min-width:0 !important; }
        .week-pick {
          flex:1 1 0 !important;
          min-width:0 !important;
          gap:5px !important;
        }
        .week-pick input[type="date"] {
          min-width:0 !important;
          width:88px !important;
          flex:1 1 88px !important;
          padding:6px 5px !important;
          font-size:10px !important;
        }
        .week-inline-actions-v2 { gap:4px; }
        .week-inline-actions-v2 .btn-sm {
          padding:6px 7px !important;
          font-size:9px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function ensureRestOverview() {
    var overlay = document.getElementById('session-between-overlay-v2');
    var wrap = overlay && overlay.querySelector('.bs-overlay-wrap');
    if (!wrap) return null;
    var panel = wrap.querySelector('.bs-rest-overview');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'bs-rest-overview';
      wrap.appendChild(panel);
    }
    return panel;
  }

  function renderRestOverview() {
    var overlay = document.getElementById('session-between-overlay-v2');
    if (!overlay || !overlay.classList.contains('show')) return;
    var panel = ensureRestOverview();
    var state = getState();
    if (!panel || !state || !Array.isArray(state.exercises)) return;

    var html = '<div class="bs-rest-overview-title">Översikt</div>';
    state.exercises.forEach(function (ex, idx) {
      var logs = Array.isArray(state.logs && state.logs[idx]) ? state.logs[idx] : [];
      var planned = ex.kind === 'cardio' ? 1 : Math.max(1,Number(ex.plannedSets) || 1);
      var done = Math.min(logs.length,planned);
      html += '<div class="bs-rest-overview-row' + (idx === Number(state.exerciseIndex) ? ' current' : '') + '">' +
        '<span class="bs-rest-name">' + escapeHtml(ex.name || 'Övning') + '</span>' +
        '<span class="bs-rest-progress">' + done + ' / ' + planned + '</span>' +
      '</div>';
    });
    if (panel.innerHTML !== html) panel.innerHTML = html;
  }

  function ensureBuilderTimerToggle() {
    var modal = document.getElementById('day-workout-modal');
    var list = document.getElementById('day-workout-ex-list');
    if (!modal || !modal.classList.contains('show') || !list || !list.parentElement) return null;

    var panel = document.getElementById('pretimer-builder-v2');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'pretimer-builder-v2';
      panel.className = 'pretimer-builder-v2';
      panel.innerHTML =
        '<div class="pretimer-builder-copy"><strong>5 s starttimer</strong><span>Nedräkning innan ett set startas</span></div>' +
        '<button type="button" class="pretimer-switch" id="pretimer-builder-switch-v2" aria-label="5 sekunders starttimer"></button>';
      var between = document.getElementById('between-set-global-editor-v2');
      if (between && between.parentNode === list.parentElement) between.insertAdjacentElement('afterend',panel);
      else list.parentElement.appendChild(panel);

      panel.querySelector('button').addEventListener('click',function () {
        var date = currentBuilderDate();
        var enabled = this.getAttribute('aria-pressed') !== 'true';
        persistTimer(date,enabled);
        syncBuilderTimerToggle(true);
      });
    }
    syncBuilderTimerToggle(false);
    return panel;
  }

  function syncBuilderTimerToggle(force) {
    var button = document.getElementById('pretimer-builder-switch-v2');
    if (!button) return;
    var date = currentBuilderDate();
    if (!force && button.dataset.date === date) return;
    button.dataset.date = date;
    button.setAttribute('aria-pressed',timerEnabledForDate(date) ? 'true' : 'false');
  }

  function renderSessionTimerToggle(button, enabled) {
    if (!button) return;
    if (button.dataset.timerToggleMarkupV48 !== 'true') {
      button.dataset.timerToggleMarkupV48 = 'true';
      button.innerHTML =
        '<span class="session-timer-icon-v48" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24"><path d="M9 2h6M12 6v2M18.4 7.6l1.4-1.4"></path><circle cx="12" cy="14" r="7"></circle><path d="M12 14l3-2"></path></svg>' +
        '</span>' +
        '<span class="session-timer-label-v48">5 s</span>' +
        '<span class="session-timer-track-v48" aria-hidden="true"><span class="session-timer-knob-v48"></span></span>';
    }
    button.setAttribute('aria-pressed',enabled ? 'true' : 'false');
    button.setAttribute('aria-label','5 sekunders starttimer ' + (enabled ? 'på' : 'av'));
    button.title = enabled ? '5 sekunders starttimer är på' : '5 sekunders starttimer är av';
  }

  window.__renderSessionPretimerToggleV48 = renderSessionTimerToggle;

  function ensureSessionTimerToggle() {
    var top = document.querySelector('#session-modal .session-top');
    if (!top) return null;
    var button = document.getElementById('session-pretimer-toggle-v2');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'session-pretimer-toggle-v2';
      button.className = 'session-pretimer-toggle-v2';
      button.addEventListener('click',function () {
        var state = getState();
        if (!state || !state.date) return;
        var enabled = !timerEnabledForDate(state.date);
        persistTimer(state.date,enabled);
        syncSessionTimerToggle();
        if (!enabled) skipPretimerIfNeeded(false);
      });
      var overview = document.getElementById('session-view-toggle');
      var stop = top.querySelector('.session-cta');
      if (overview) overview.insertAdjacentElement('beforebegin',button);
      else if (stop) stop.insertAdjacentElement('beforebegin',button);
      else top.appendChild(button);
    }
    return button;
  }

  function syncSessionTimerToggle() {
    var button = ensureSessionTimerToggle();
    var state = getState();
    if (!button) return;
    button.style.display = state ? '' : 'none';
    if (!state) return;
    var enabled = timerEnabledForDate(state.date);
    renderSessionTimerToggle(button,enabled);
  }

  function findDecisionButton(kind) {
    var controls = document.getElementById('session-controls');
    if (!controls) return null;
    var buttons = Array.prototype.slice.call(controls.querySelectorAll('button'));
    return buttons.find(function (button) {
      var text = (button.textContent || '').trim().toLowerCase();
      return kind === 'next' ? text.indexOf('starta nästa set') === 0 : text.indexOf('övning klar') === 0;
    }) || null;
  }

  function decisionKey(state) {
    if (!state) return '';
    var logs = Array.isArray(state.logs && state.logs[state.exerciseIndex]) ? state.logs[state.exerciseIndex].length : 0;
    return [state.passStartedAt || '',state.exerciseIndex,state.currentSet,logs].join('|');
  }

  function autoAdvanceDecision() {
    var state = getState();
    if (!state || state.setRunning || !state.awaitingDecision || autoPending) return;
    var key = decisionKey(state);
    if (!key || key === lastDecisionKey) return;

    var ex = Array.isArray(state.exercises) ? state.exercises[state.exerciseIndex] : null;
    if (!ex) return;
    var plannedSets = Math.max(1,Number(ex.plannedSets) || 1);
    var kind = Number(state.currentSet) < plannedSets ? 'next' : 'finish';
    var button = findDecisionButton(kind);
    if (!button) return;

    lastDecisionKey = key;
    autoPending = {
      kind:kind,
      exerciseIndex:Number(state.exerciseIndex),
      currentSet:Number(state.currentSet),
      button:button,
      startedAt:Date.now()
    };

    try {
      button.click();
      /* The custom-between module owns this transition. Do not let the
         generic auto-transition skip its Start button or pre-timer. */
      if (state.__betweenCustomRuntimeV3) autoPending = null;
    }
    catch (e) { autoPending = null; }
  }

  function settleAutoTransition() {
    if (!autoPending) return;
    var state = getState();
    if (!state) { autoPending = null; return; }
    if (state.__betweenCustomRuntimeV3 || state.__betweenCustomManualStartV4) {
      autoPending = null;
      return;
    }

    if (autoPending.kind === 'next') {
      var advanced = Number(state.exerciseIndex) === autoPending.exerciseIndex && Number(state.currentSet) > autoPending.currentSet;
      if (!advanced) return;
      if (state.setRunning) {
        state.setRunning = false;
        state.setStartedAt = null;
        state.awaitingDecision = false;
        try { if (typeof window.renderSessionMode === 'function') window.renderSessionMode(); } catch (e) {}
      }
      autoPending = null;
      return;
    }

    if (Number(state.exerciseIndex) > autoPending.exerciseIndex || !state.awaitingDecision) {
      autoPending = null;
    }
  }

  function skipPretimerIfNeeded(forAutoTransition) {
    var pre = document.getElementById('session-pre-timer');
    if (!pre || !pre.classList.contains('show')) return false;
    var state = getState();
    var shouldSkip = !!forAutoTransition || !(state && timerEnabledForDate(state.date));
    if (!shouldSkip) return false;
    try {
      pre.click();
      return true;
    } catch (e) {
      return false;
    }
  }

  function syncAutoPretimer() {
    var state = getState();
    if (state && (state.__betweenCustomRuntimeV3 || state.__betweenCustomManualStartV4)) {
      autoPending = null;
      return;
    }
    if (!autoPending || autoPending.kind !== 'next') return;
    if (skipPretimerIfNeeded(true)) {
      setTimeout(settleAutoTransition,0);
    }
  }

  function relocateWeekActions() {
    var toolbar = document.querySelector('.week-toolbar');
    var pick = toolbar && toolbar.querySelector('.week-pick');
    if (!toolbar || !pick) return;

    Array.prototype.slice.call(pick.querySelectorAll('button')).forEach(function (button) {
      if ((button.textContent || '').trim().toLowerCase() === 'denna vecka') button.remove();
    });

    var actions = document.getElementById('week-inline-actions-v2');
    if (!actions) {
      var headers = Array.prototype.slice.call(document.querySelectorAll('.section-hdr'));
      var weekHeader = headers.find(function (header) {
        var h2 = header.querySelector('h2');
        return h2 && (h2.textContent || '').trim().toLowerCase() === 'veckoplan';
      });
      if (!weekHeader) return;
      var buttons = Array.prototype.slice.call(weekHeader.querySelectorAll('button')).filter(function (button) {
        var text = (button.textContent || '').trim().toLowerCase();
        return text === 'redigera' || text === 'mallpass';
      });
      if (!buttons.length) return;
      actions = document.createElement('div');
      actions.id = 'week-inline-actions-v2';
      actions.className = 'week-inline-actions-v2';
      buttons.forEach(function (button) { actions.appendChild(button); });
      pick.appendChild(actions);
      Array.prototype.slice.call(weekHeader.children).forEach(function (child) {
        if (child.tagName !== 'H2' && !child.children.length && !(child.textContent || '').trim()) child.remove();
      });
    }
  }

  function syncFast() {
    /* The unified v46 controller owns live session transitions. Keep this
       legacy poller dormant so it cannot auto-click or settle a newer state
       a few frames after the user's action. */
    if (window.__exerciseSessionControllerV46Installed) return;
    var state = getState();
    if (!state) {
      autoPending = null;
      lastDecisionKey = '';
      syncSessionTimerToggle();
      return;
    }

    syncSessionTimerToggle();
    renderRestOverview();
    autoAdvanceDecision();
    syncAutoPretimer();
    if (!autoPending) skipPretimerIfNeeded(false);
    settleAutoTransition();
  }

  function syncSlow() {
    ensureBuilderTimerToggle();
    syncBuilderTimerToggle(false);
    relocateWeekActions();
    renderRestOverview();
  }

  function install() {
    addStyles();
    ensureSessionTimerToggle();
    relocateWeekActions();
    setTimeout(syncSlow,0);
    fastTimer = setInterval(syncFast,75);
    setInterval(syncSlow,450);

    document.addEventListener('change',function (event) {
      if (event.target && event.target.id === 'day-workout-date') {
        setTimeout(function () { syncBuilderTimerToggle(true); },0);
      }
    },false);

    document.addEventListener('click',function (event) {
      var button = event.target && event.target.closest ? event.target.closest('#day-workout-modal button') : null;
      if (!button) return;
      var text = (button.textContent || '').trim().toLowerCase();
      if (text.indexOf('spara passupplägg') >= 0 || text.indexOf('starta pass') >= 0) {
        var date = currentBuilderDate();
        persistTimer(date,timerEnabledForDate(date));
      }
    },false);

    window.__exerciseFlowPolishV2 = {
      timerEnabledForDate:timerEnabledForDate,
      setTimerEnabled:function (date,enabled) { persistTimer(date,enabled); },
      sync:function () { syncFast(); syncSlow(); }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
