(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseSessionStabilityV55Installed) return;
  window.__exerciseSessionStabilityV55Installed = true;

  /* Suppress the legacy v49 follow-up layer. Its document-wide MutationObserver
     can repeatedly reschedule session work while the live UI is rendering. */
  window.__exerciseFollowupV49Installed = true;

  var profile = (new URLSearchParams(window.location.search).get('user') || 'markus').toLowerCase();
  var finalBound = false;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function timerEnabled(date) {
    try {
      var api = window.__exerciseFlowPolishV2;
      if (api && typeof api.timerEnabledForDate === 'function') return api.timerEnabledForDate(date) !== false;
    } catch (_) {}
    try {
      var planned = typeof window.getPlannedSessions === 'function' ? window.getPlannedSessions() : null;
      if (planned && planned[date] && typeof planned[date].preTimerEnabled === 'boolean') return planned[date].preTimerEnabled;
    } catch (_) {}
    try {
      var local = localStorage.getItem('ex_pretimer_v2_' + profile + '_' + (date || ''));
      if (local === '0') return false;
      if (local === '1') return true;
    } catch (_) {}
    return true;
  }

  function setTimerEnabled(date, enabled) {
    enabled = enabled !== false;
    try {
      var api = window.__exerciseFlowPolishV2;
      if (api && typeof api.setTimerEnabled === 'function') {
        api.setTimerEnabled(date, enabled);
        return;
      }
    } catch (_) {}
    try { localStorage.setItem('ex_pretimer_v2_' + profile + '_' + (date || ''), enabled ? '1' : '0'); } catch (_) {}
    try {
      var planned = typeof window.getPlannedSessions === 'function' ? window.getPlannedSessions() : null;
      if (planned && planned[date]) {
        planned[date].preTimerEnabled = enabled;
        if (typeof window.savePlannedSessions === 'function') window.savePlannedSessions(planned);
      }
    } catch (_) {}
  }

  function renderTimerToggle(button, enabled) {
    if (!button) return;
    if (typeof window.__renderSessionPretimerToggleV48 === 'function') {
      try { window.__renderSessionPretimerToggleV48(button, enabled); return; } catch (_) {}
    }
    if (button.dataset.timerToggleMarkupV55 !== 'true') {
      button.dataset.timerToggleMarkupV55 = 'true';
      button.innerHTML =
        '<span aria-hidden="true" style="font-size:13px;line-height:1">◷</span>' +
        '<span>5 s</span>' +
        '<span class="session-timer-track-v48" aria-hidden="true"><span class="session-timer-knob-v48"></span></span>';
    }
    button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    button.setAttribute('aria-label', '5 sekunders starttimer ' + (enabled ? 'på' : 'av'));
  }

  function ensureTimerToggle() {
    var top = document.querySelector('#session-modal .session-top');
    if (!top) return null;
    var button = document.getElementById('session-pretimer-toggle-v2');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'session-pretimer-toggle-v2';
      button.className = 'session-pretimer-toggle-v2';
      button.addEventListener('click', function () {
        var state = getState();
        if (!state || !state.date) return;
        var enabled = !timerEnabled(state.date);
        setTimerEnabled(state.date, enabled);
        renderTimerToggle(button, enabled);
        if (!enabled) {
          var pre = document.getElementById('session-pre-timer');
          if (pre && pre.classList.contains('show')) {
            try { pre.click(); } catch (_) {}
          }
        }
      });
      var overview = document.getElementById('session-view-toggle');
      var stop = top.querySelector('.session-cta');
      if (overview) overview.insertAdjacentElement('beforebegin', button);
      else if (stop) stop.insertAdjacentElement('beforebegin', button);
      else top.appendChild(button);
    }
    return button;
  }

  function syncTimerToggle() {
    var button = ensureTimerToggle();
    if (!button) return;
    var state = getState();
    button.style.display = state ? '' : 'none';
    if (state) renderTimerToggle(button, timerEnabled(state.date));
  }

  function syncSessionControls() {
    var controls = document.getElementById('session-controls');
    if (!controls) return;
    var buttons = Array.prototype.slice.call(controls.querySelectorAll('button'));
    var success = buttons.find(function (button) { return /^övning klar/i.test(String(button.textContent || '').trim()); });
    var extra = buttons.find(function (button) { return /^extra set/i.test(String(button.textContent || '').trim()); });
    var primary = buttons.find(function (button) { return /^starta/i.test(String(button.textContent || '').trim()); });
    if (extra) {
      var completedDecision = !!success && !primary;
      extra.style.setProperty('display', completedDecision ? 'flex' : 'none', 'important');
      extra.setAttribute('aria-hidden', completedDecision ? 'false' : 'true');
    }

    var modal = document.getElementById('session-modal');
    var pre = document.getElementById('session-pre-timer');
    var state = getState();
    var activeOrange = !!(modal && !modal.classList.contains('session-overview-mode') &&
      ((state && state.setRunning) || (pre && pre.classList.contains('show')) || (state && state.__betweenCustomRuntimeV3)));
    if (modal && activeOrange && !modal.classList.contains('hype-mode')) modal.classList.add('hype-mode');
  }

  function syncLogActions(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.log-add-workout-v8').forEach(function (button) {
      button.setAttribute('aria-label','Lägg till övning i passet');
      button.title = 'Lägg till övning i passet';
    });
  }

  function addExerciseToWorkout(id) {
    id = Number(id);
    if (!id || typeof window.editWorkout !== 'function') return;
    window.editWorkout(id);
    if (typeof window.addExRow === 'function') window.addExRow();
    var title = document.querySelector('#wk-modal .modal > h2');
    if (title) title.textContent = 'Lägg till övning';
    var list = document.getElementById('ex-list');
    if (list && list.lastElementChild) {
      try { list.lastElementChild.scrollIntoView({block:'nearest',behavior:'smooth'}); } catch (_) {}
      var input = list.lastElementChild.querySelector('.ex-name');
      if (input) { try { input.focus({preventScroll:true}); } catch (_) { try { input.focus(); } catch (_) {} } }
    }
  }
  window.addExerciseToWorkoutV49 = addExerciseToWorkout;

  function handleLogPlus(event) {
    var button = event.target && event.target.closest ? event.target.closest('.log-add-workout-v8') : null;
    if (!button) return;
    var detail = button.closest('.log-detail[data-workout-id]');
    if (!detail) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    addExerciseToWorkout(detail.dataset.workoutId);
  }

  function syncHeartRateChart() {
    try {
      if (!window.Chart || typeof window.Chart.getChart !== 'function') return;
      var canvas = document.getElementById('chart-hr-combined');
      if (!canvas) return;
      var chart = window.Chart.getChart(canvas);
      if (!chart || !chart.data || !Array.isArray(chart.data.datasets)) return;
      var cardio = chart.data.datasets.find(function (dataset) { return dataset && dataset.label === 'Kondition'; });
      if (!cardio || cardio.borderColor === '#EF4444') return;
      cardio.borderColor = '#EF4444';
      chart.update('none');
    } catch (_) {}
  }

  function addStyles() {
    if (document.getElementById('exercise-session-stability-v55-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-session-stability-v55-style';
    style.textContent = `
      #session-controls.decision-row:has(.session-cta.success):not(:has(.session-cta.primary)) {
        grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      }
      #session-controls.decision-row:has(.session-cta.success):not(:has(.session-cta.primary)) .session-cta.warn,
      #session-controls.decision-row:has(.session-cta.success):not(:has(.session-cta.primary)) .session-cta.success {
        display:flex !important;align-items:center !important;justify-content:center !important;
        grid-column:auto !important;min-width:0 !important;min-height:43px !important;
      }
      #session-modal.show #session-controls .session-cta {
        transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease !important;
      }
      ::view-transition-group(exercise-session-surface-v1),
      ::view-transition-old(exercise-session-surface-v1),
      ::view-transition-new(exercise-session-surface-v1) { animation-duration:.001s !important;animation-delay:0s !important; }
      #session-modal.show #session-controls > * { animation-duration:.001s !important; }
      .log-edit-pass-v7 { display:none !important; }
      .log-detail-actions-v8 { gap:0 !important; }
      .log-add-workout-v8 { width:34px !important;height:34px !important;flex:0 0 34px !important; }

      /* Pulse Flow concept: keep live training free from the separate plan
         card even when older flow CSS tries to force that card visible. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-grid > .session-card:nth-child(2),
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-grid > .session-card:not(.session-main) {
        display:none !important;
        visibility:hidden !important;
        pointer-events:none !important;
      }

      /* Pulse Flow timer typography: calmer, lighter and closer to the front-page theme. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .timer-box {
        min-height:58px !important;
        padding:8px 12px !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .timer-lbl {
        color:#718095 !important;
        font-size:8px !important;
        font-weight:650 !important;
        letter-spacing:1.1px !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .timer-val {
        color:var(--pf-soft) !important;
        font-size:clamp(22px,4.5vw,28px) !important;
        line-height:1 !important;
        font-weight:700 !important;
        letter-spacing:-.6px !important;
        text-shadow:0 0 14px rgba(var(--pf-rgb),.10) !important;
      }

      /* The live cardio timer must use the current Pulse Flow state colour,
         not the older hard-coded orange fallback. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-segments .session-countdown-segment {
        background:rgba(var(--pf-rgb),.10) !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-segments .session-countdown-segment.active {
        background:var(--pf-accent) !important;
        box-shadow:0 0 7px rgba(var(--pf-rgb),.56) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring .session-countdown-core {
        background:#0A1119 !important;
        border-color:rgba(var(--pf-rgb),.15) !important;
        box-shadow:inset 0 0 28px rgba(var(--pf-rgb),.025) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-value {
        color:var(--pf-soft) !important;
        font-size:30px !important;
        font-weight:700 !important;
        letter-spacing:-.7px !important;
        text-shadow:0 0 16px rgba(var(--pf-rgb),.13) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .session-countdown-label,
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-pause-hint {
        font-weight:600 !important;
        letter-spacing:.85px !important;
      }

      /* Full-screen 5 s timer follows the same restrained typography. */
      html.exercise-concept-pulse-home-v1 body #session-pre-timer #session-pre-timer-value {
        font-size:clamp(42px,12vw,56px) !important;
        font-weight:700 !important;
        letter-spacing:-1.4px !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-pre-timer .session-pre-label {
        font-weight:700 !important;
        letter-spacing:1px !important;
      }

      /* Rest is a focused Pulse Flow timer with a lightweight themed overview. */
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2.show {
        background:
          radial-gradient(430px 290px at 50% 38%,rgba(34,211,238,.075),transparent 70%),
          #080D14 !important;
        backdrop-filter:blur(18px) !important;
        -webkit-backdrop-filter:blur(18px) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2::before,
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2::after {
        content:none !important;
        display:none !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-overlay-wrap {
        width:min(430px,calc(100vw - 32px)) !important;
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        justify-content:center !important;
        text-align:center !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-heading {
        margin:0 0 14px !important;
        color:#CFFAFE !important;
        font-size:13px !important;
        font-weight:700 !important;
        letter-spacing:.04em !important;
        text-shadow:0 0 14px rgba(34,211,238,.09) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-ring {
        width:min(164px,44vw) !important;
        height:min(164px,44vw) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-segment {
        background:rgba(34,211,238,.09) !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-segment.active {
        background:#22D3EE !important;
        box-shadow:0 0 6px rgba(34,211,238,.46) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-core {
        background:#0A1119 !important;
        border-color:rgba(34,211,238,.14) !important;
        box-shadow:inset 0 0 24px rgba(34,211,238,.022) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-value {
        color:#CFFAFE !important;
        font-size:31px !important;
        line-height:1 !important;
        font-weight:700 !important;
        letter-spacing:-.7px !important;
        text-shadow:0 0 15px rgba(34,211,238,.12) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-label {
        margin-top:7px !important;
        color:#718095 !important;
        font-size:9px !important;
        font-weight:600 !important;
        letter-spacing:1px !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-skip {
        margin-top:16px !important;
        color:#617086 !important;
        font-size:9px !important;
        font-weight:600 !important;
        letter-spacing:.65px !important;
      }

      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-rest-overview {
        display:block !important;
        visibility:visible !important;
        width:100% !important;
        margin:22px 0 0 !important;
        padding:0 !important;
        border:0 !important;
        border-top:1px solid rgba(34,211,238,.13) !important;
        border-bottom:1px solid rgba(34,211,238,.09) !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
        text-align:left !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-rest-overview-title {
        margin:0 !important;
        padding:10px 2px 8px !important;
        color:#67E8F9 !important;
        font-size:8px !important;
        font-weight:750 !important;
        letter-spacing:1.15px !important;
        text-transform:uppercase !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-rest-overview-row {
        display:grid !important;
        grid-template-columns:minmax(0,1fr) auto !important;
        gap:12px !important;
        align-items:center !important;
        min-height:34px !important;
        padding:7px 2px !important;
        border-top:1px solid rgba(148,163,184,.09) !important;
        background:transparent !important;
        font-size:10px !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-rest-name {
        color:#7D8A9C !important;
        font-weight:560 !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-rest-progress {
        color:#5EDCF2 !important;
        font-weight:650 !important;
        font-variant-numeric:tabular-nums !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-rest-overview-row.current {
        background:linear-gradient(90deg,rgba(34,211,238,.055),transparent 72%) !important;
      }
      html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-rest-overview-row.current .bs-rest-name {
        color:#E2F8FC !important;
        font-weight:700 !important;
      }

      @media(max-width:600px) {
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .timer-val {
          font-size:24px !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-overlay-wrap {
          width:min(390px,calc(100vw - 28px)) !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-ring {
          width:min(152px,41vw) !important;
          height:min(152px,41vw) !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-value {
          font-size:29px !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-rest-overview {
          margin-top:18px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function wrapRefreshAll() {
    var original = window.refreshAll;
    if (typeof original !== 'function' || original.__exerciseStabilityV55Wrapped) return;
    var wrapped = function () {
      var result = original.apply(this, arguments);
      syncLogActions(document);
      syncHeartRateChart();
      return result;
    };
    wrapped.__exerciseStabilityV55Wrapped = true;
    window.refreshAll = wrapped;
  }

  function bindFinalSessionRenderer() {
    if (finalBound) return true;
    if (!window.__exerciseSessionControllerV46Installed || typeof window.renderSessionMode !== 'function') return false;
    var original = window.renderSessionMode;
    if (original.__exerciseStabilityV55RenderWrapped) { finalBound = true; return true; }
    var wrapped = function () {
      var result = original.apply(this, arguments);
      syncTimerToggle();
      syncSessionControls();
      return result;
    };
    wrapped.__exerciseStabilityV55RenderWrapped = true;
    wrapped.__exerciseStabilityV55Original = original;
    window.renderSessionMode = wrapped;
    finalBound = true;
    syncTimerToggle();
    syncSessionControls();
    return true;
  }

  function install() {
    addStyles();
    wrapRefreshAll();
    document.addEventListener('click', handleLogPlus, true);
    syncLogActions(document);
    syncHeartRateChart();

    var attempts = 0;
    (function waitForFinalController() {
      attempts += 1;
      if (bindFinalSessionRenderer()) return;
      if (attempts < 160) setTimeout(waitForFinalController, 50);
    })();

    window.addEventListener('pageshow', function () {
      setTimeout(function () {
        bindFinalSessionRenderer();
        syncTimerToggle();
        syncSessionControls();
      }, 0);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();