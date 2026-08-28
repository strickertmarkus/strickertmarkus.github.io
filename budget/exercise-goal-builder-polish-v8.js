(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var syncTimer = null;
  var layoutApplied = false;

  function addStyles() {
    if (document.getElementById('exercise-goal-builder-polish-v8-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-goal-builder-polish-v8-style';
    style.textContent = `
      /* Goals: keep the old VO2 goal controls in DOM for legacy save/refresh,
         but replace their visible card with the actual VO2 history chart. */
      .goals-grid > .goal-card.vo2-goal-source-v8 { display:none !important; }
      .chart-card.sessions-chart-hidden-v8 { display:none !important; }
      .goals-grid > .goal-vo2-chart-v8 {
        min-width:0;
        padding:18px;
        align-self:stretch;
      }
      .goals-grid > .goal-vo2-chart-v8 h3 {
        margin-bottom:10px;
        color:#34D399;
      }
      .goals-grid > .goal-vo2-chart-v8 .bw-row {
        margin-bottom:8px;
        gap:6px;
      }
      .goals-grid > .goal-vo2-chart-v8 .bw-inp-wrap {
        flex:1 1 135px;
        min-width:0;
      }
      .goals-grid > .goal-vo2-chart-v8 .bw-inp-wrap input {
        min-width:0;
      }
      .goals-grid > .goal-vo2-chart-v8 .chart-area {
        height:190px;
      }
      .vo2-goal-line-v8 {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin:3px 0 10px;
        padding:6px 0 7px;
        border-bottom:1px solid rgba(255,255,255,.055);
      }
      .vo2-goal-line-v8 label {
        color:#FBBF24;
        font-size:9px;
        font-weight:800;
        text-transform:uppercase;
        letter-spacing:.55px;
        white-space:nowrap;
      }
      .vo2-goal-line-v8 input {
        width:62px;
        height:30px;
        padding:4px 7px;
        border:1px solid rgba(251,191,36,.28);
        border-radius:7px;
        background:rgba(251,191,36,.055);
        color:#FBBF24;
        outline:none;
        text-align:center;
        font:750 11px/1 'Inter',sans-serif;
      }
      .vo2-goal-line-v8 input:focus {
        border-color:rgba(251,191,36,.62);
        box-shadow:0 0 0 2px rgba(251,191,36,.08);
      }

      /* Builder: two bare, compact controls in the location that previously
         contained only the between-exercises switch. */
      #day-workout-modal #between-exercise-toggle-panel-v7.builder-toggle-cluster-v8 {
        min-width:132px !important;
        min-height:0 !important;
        padding:0 !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        display:flex !important;
        align-items:flex-start !important;
        justify-content:flex-end !important;
        gap:12px !important;
      }
      .builder-toggle-unit-v8 {
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:flex-start;
        gap:5px;
        min-width:55px;
      }
      .builder-toggle-label-v8 {
        color:#8B949E;
        font-size:8px;
        line-height:1.05;
        font-weight:800;
        letter-spacing:.25px;
        text-align:center;
        white-space:nowrap;
      }
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v8 .between-switch-v7,
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v8 .pretimer-switch {
        width:40px !important;
        height:22px !important;
        padding:2px !important;
        margin:0 !important;
        flex:0 0 auto !important;
      }
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v8 .between-switch-v7::after,
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v8 .pretimer-switch::after {
        width:16px !important;
        height:16px !important;
      }
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v8 .between-switch-v7[aria-pressed="true"]::after,
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v8 .pretimer-switch[aria-pressed="true"]::after {
        transform:translateX(18px) !important;
      }
      #pretimer-builder-v2.pretimer-source-hidden-v8 { display:none !important; }
      #day-workout-modal .builder-week-between-v7 > .week-nav {
        min-width:0 !important;
      }
      #day-workout-modal .builder-week-between-v7 > .week-nav .week-nav-copy {
        min-width:0 !important;
        flex:1 1 auto;
      }

      @media(max-width:768px) {
        .goals-grid > .goal-vo2-chart-v8 {
          grid-column:1 / -1;
          padding:15px;
        }
        .goals-grid > .goal-vo2-chart-v8 .chart-area { height:205px; }
      }
      @media(max-width:600px) {
        #day-workout-modal .builder-week-between-v7 {
          grid-template-columns:minmax(0,1fr) auto !important;
          column-gap:8px !important;
          row-gap:0 !important;
        }
        #day-workout-modal #between-exercise-toggle-panel-v7.builder-toggle-cluster-v8 {
          grid-column:2 !important;
          min-width:124px !important;
          gap:8px !important;
        }
        .builder-toggle-unit-v8 { min-width:54px; gap:4px; }
        .builder-toggle-label-v8 { font-size:7.5px; }
      }
      @media(max-width:380px) {
        #day-workout-modal .builder-week-between-v7 {
          grid-template-columns:minmax(0,1fr) 118px !important;
          column-gap:6px !important;
        }
        #day-workout-modal #between-exercise-toggle-panel-v7.builder-toggle-cluster-v8 {
          grid-column:2 !important;
          min-width:118px !important;
          gap:6px !important;
        }
        .builder-toggle-unit-v8 { min-width:52px; }
        .builder-toggle-label-v8 { font-size:7px; letter-spacing:0; }
      }
    `;
    document.head.appendChild(style);
  }

  function cardForCanvas(id) {
    var canvas = document.getElementById(id);
    return canvas && canvas.closest ? canvas.closest('.chart-card') : null;
  }

  function syncGoalInputFromLegacy() {
    var visible = document.getElementById('vo2-goal-line-v8');
    var legacy = document.getElementById('g3-goal');
    if (!visible || !legacy || document.activeElement === visible) return;
    if (String(visible.value) !== String(legacy.value || '')) visible.value = legacy.value || 45;
  }

  function refreshGoalDatasetLabel() {
    try {
      var chart = window.chartVO2;
      if (!chart || !chart.data || !Array.isArray(chart.data.datasets)) return;
      var changed = false;
      chart.data.datasets.forEach(function (dataset) {
        if (dataset && dataset.label === 'Mål') {
          dataset.label = 'Mål VO₂ max';
          dataset.borderDash = [6,4];
          dataset.borderWidth = 2;
          changed = true;
        }
      });
      if (changed) chart.update('none');
    } catch (_) {}
  }

  function ensureGoalLineControl(vo2Card) {
    if (!vo2Card || document.getElementById('vo2-goal-line-v8')) return;
    var row = vo2Card.querySelector('.bw-row');
    if (!row) return;
    var line = document.createElement('div');
    line.className = 'vo2-goal-line-v8';
    line.innerHTML = '<label for="vo2-goal-line-v8">Mål VO₂ max</label><input id="vo2-goal-line-v8" type="number" min="20" max="80" step="0.1" inputmode="decimal">';
    row.insertAdjacentElement('afterend', line);
    var input = line.querySelector('input');
    syncGoalInputFromLegacy();
    input.addEventListener('input', function () {
      var legacy = document.getElementById('g3-goal');
      if (legacy) legacy.value = input.value;
    });
    input.addEventListener('change', function () {
      var value = parseFloat(input.value);
      if (!isFinite(value) || value < 20 || value > 80) {
        syncGoalInputFromLegacy();
        return;
      }
      var legacy = document.getElementById('g3-goal');
      if (legacy) legacy.value = value;
      try {
        var goals = typeof window.getGoals === 'function' ? window.getGoals() : {};
        goals.vo2Goal = value;
        if (window.DB && typeof window.DB.set === 'function') window.DB.set('goals', goals);
        else localStorage.setItem('ex_goals', JSON.stringify(goals));
      } catch (_) {}
      try { if (typeof window.refreshGoals === 'function') window.refreshGoals(); } catch (_) {}
      try { if (typeof window.renderCharts === 'function') window.renderCharts(); } catch (_) {}
      setTimeout(function () { syncGoalInputFromLegacy(); refreshGoalDatasetLabel(); }, 0);
    });
  }

  function arrangeGoalCharts() {
    var goalsGrid = document.querySelector('.goals-grid');
    if (!goalsGrid) return;

    var legacyVo2Input = document.getElementById('g3-goal');
    var legacyVo2Card = legacyVo2Input && legacyVo2Input.closest ? legacyVo2Input.closest('.goal-card') : null;
    if (legacyVo2Card) legacyVo2Card.classList.add('vo2-goal-source-v8');

    var sessionsCard = cardForCanvas('chart-sessions');
    if (sessionsCard) sessionsCard.classList.add('sessions-chart-hidden-v8');

    var vo2Card = cardForCanvas('chart-bw');
    var runCard = document.getElementById('g2-goal');
    runCard = runCard && runCard.closest ? runCard.closest('.goal-card') : null;
    if (vo2Card) {
      vo2Card.classList.add('goal-vo2-chart-v8');
      if (vo2Card.parentElement !== goalsGrid) {
        if (runCard && runCard.parentElement === goalsGrid) runCard.insertAdjacentElement('afterend', vo2Card);
        else goalsGrid.appendChild(vo2Card);
        layoutApplied = true;
      }
      ensureGoalLineControl(vo2Card);
    }

    syncGoalInputFromLegacy();
    refreshGoalDatasetLabel();

    if (layoutApplied) {
      layoutApplied = false;
      requestAnimationFrame(function () {
        try { if (window.chartVO2 && typeof window.chartVO2.resize === 'function') window.chartVO2.resize(); } catch (_) {}
      });
    }
  }

  function ensureCompactBuilderToggles() {
    var modal = document.getElementById('day-workout-modal');
    if (!modal || !modal.classList.contains('show')) return;
    var panel = document.getElementById('between-exercise-toggle-panel-v7');
    var globalButton = panel && panel.querySelector('[data-global-toggle-v7]');
    var pretimerButton = document.getElementById('pretimer-builder-switch-v2');
    var pretimerSource = document.getElementById('pretimer-builder-v2');
    if (!panel || !globalButton || !pretimerButton) return;

    if (panel.dataset.compactTogglesV8 !== '1') {
      globalButton.remove();
      pretimerButton.remove();
      panel.innerHTML = '';
      panel.classList.add('builder-toggle-cluster-v8');
      panel.dataset.compactTogglesV8 = '1';

      var betweenUnit = document.createElement('div');
      betweenUnit.className = 'builder-toggle-unit-v8';
      betweenUnit.innerHTML = '<span class="builder-toggle-label-v8">Mellanövningar</span>';
      betweenUnit.appendChild(globalButton);

      var timerUnit = document.createElement('div');
      timerUnit.className = 'builder-toggle-unit-v8';
      timerUnit.innerHTML = '<span class="builder-toggle-label-v8">5 s starttimer</span>';
      timerUnit.appendChild(pretimerButton);

      panel.appendChild(betweenUnit);
      panel.appendChild(timerUnit);
    }

    if (pretimerSource) pretimerSource.classList.add('pretimer-source-hidden-v8');
  }

  function reinforceProfileColors() {
    var maja = document.querySelector('.exercise-user-option[data-user="maja"].active');
    var markus = document.querySelector('.exercise-user-option[data-user="markus"].active');
    if (maja) maja.classList.add('profile-active-maja-v8');
    if (markus) markus.classList.add('profile-active-markus-v8');
  }

  function sync() {
    arrangeGoalCharts();
    ensureCompactBuilderToggles();
    reinforceProfileColors();
  }

  function install() {
    if (window.__exerciseGoalBuilderPolishV8Installed) return;
    window.__exerciseGoalBuilderPolishV8Installed = true;
    addStyles();
    sync();
    syncTimer = setInterval(sync, 220);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
