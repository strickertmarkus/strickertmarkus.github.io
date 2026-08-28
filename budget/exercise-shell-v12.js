(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var GOAL_PLUGIN_ID = 'exerciseVo2GoalLineV12';
  var renderWrapped = false;
  var builderTimers = [];

  function addStyles() {
    if (document.getElementById('exercise-shell-v12-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-shell-v12-style';
    style.textContent = `
      /* Final page shell: these rules are the source of truth for first paint. */
      .week-pick > button { display:none !important; }
      .week-inline-actions-v2 { display:flex; align-items:center; gap:6px; flex:0 0 auto; }
      .week-inline-actions-v2 .btn-sm { display:inline-flex !important; white-space:nowrap; }

      html body .goals-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
      html body .goals-grid > .goal-card:first-child { display:none !important; }
      html body .goals-grid > .goal-card:nth-child(3):not(.goal-vo2-chart-v12) { display:none !important; }
      html body .charts-row > .chart-card:nth-child(2) { display:none !important; }
      html body .goals-grid > .goal-vo2-chart-v12 {
        display:block !important;
        min-width:0;
        padding:18px;
        align-self:stretch;
      }
      html body .goals-grid > .goal-vo2-chart-v12 h3 { margin-bottom:10px; color:#34D399; }
      html body .goals-grid > .goal-vo2-chart-v12 .bw-row { display:none !important; }
      html body .goals-grid > .goal-vo2-chart-v12 .chart-area { height:190px; }

      .vo2-goal-line-v12 {
        display:flex; align-items:center; justify-content:space-between; gap:8px;
        margin:0 0 10px; padding:6px 0 7px;
        border-bottom:1px solid rgba(255,255,255,.055);
      }
      .vo2-goal-line-v12 label {
        color:#FBBF24; font-size:9px; font-weight:800;
        text-transform:uppercase; letter-spacing:.55px; white-space:nowrap;
      }
      .vo2-goal-line-v12 input {
        width:62px; height:30px; padding:4px 7px;
        border:1px solid rgba(251,191,36,.28); border-radius:7px;
        background:rgba(251,191,36,.055); color:#FBBF24; outline:none;
        text-align:center; font:750 11px/1 'Inter',sans-serif;
      }
      .vo2-goal-line-v12 input:focus {
        border-color:rgba(251,191,36,.62);
        box-shadow:0 0 0 2px rgba(251,191,36,.08);
      }

      /* Compact builder controls. The old large pre-timer panel remains only as
         a data/control source for the stable timer logic and is never visible. */
      html body #day-workout-modal #pretimer-builder-v2,
      html body #day-workout-modal #between-set-global-editor-v2 {
        display:none !important; visibility:hidden !important;
        height:0 !important; min-height:0 !important;
        margin:0 !important; padding:0 !important; border:0 !important; overflow:hidden !important;
      }
      #day-workout-modal #between-exercise-toggle-panel-v7.builder-toggle-cluster-v12 {
        min-width:132px !important; min-height:0 !important;
        padding:0 !important; border:0 !important; border-radius:0 !important;
        background:transparent !important; display:flex !important;
        align-items:flex-start !important; justify-content:flex-end !important;
        gap:12px !important;
      }
      .builder-toggle-unit-v12 {
        display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
        gap:5px; min-width:55px;
      }
      .builder-toggle-label-v12 {
        color:#8B949E; font-size:8px; line-height:1.05; font-weight:800;
        letter-spacing:.25px; text-align:center; white-space:nowrap;
      }
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v12 .between-switch-v7,
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v12 .pretimer-switch {
        width:40px !important; height:22px !important; padding:2px !important;
        margin:0 !important; flex:0 0 auto !important;
      }
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v12 .between-switch-v7::after,
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v12 .pretimer-switch::after {
        width:16px !important; height:16px !important;
      }
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v12 .between-switch-v7[aria-pressed="true"]::after,
      #between-exercise-toggle-panel-v7.builder-toggle-cluster-v12 .pretimer-switch[aria-pressed="true"]::after {
        transform:translateX(18px) !important;
      }
      #day-workout-modal .builder-week-between-v7 > .week-nav { min-width:0 !important; }
      #day-workout-modal .builder-week-between-v7 > .week-nav .week-nav-copy { min-width:0 !important; flex:1 1 auto; }

      .exercise-user-option[data-user="markus"].active {
        background:rgba(56,189,248,.14) !important; color:#38BDF8 !important;
        box-shadow:inset 0 0 0 1px rgba(56,189,248,.42) !important;
      }
      .exercise-user-option[data-user="maja"].active {
        background:rgba(244,114,182,.15) !important; color:#F472B6 !important;
        box-shadow:inset 0 0 0 1px rgba(244,114,182,.46) !important;
      }

      @media(max-width:768px) {
        html body .goals-grid { grid-template-columns:1fr !important; }
        html body .goals-grid > .goal-vo2-chart-v12 { grid-column:1 !important; padding:15px; }
        html body .goals-grid > .goal-vo2-chart-v12 .chart-area { height:205px; }
      }
      @media(max-width:600px) {
        .week-toolbar {
          display:flex !important; flex-direction:row !important; flex-wrap:nowrap !important;
          align-items:center !important; gap:6px !important; width:100% !important;
        }
        .week-toolbar .week-nav { flex:0 1 auto !important; min-width:0 !important; width:auto !important; gap:5px !important; }
        .week-toolbar .week-nav-copy { min-width:0 !important; width:auto !important; }
        .week-toolbar .week-pick {
          display:flex !important; flex-direction:row !important; flex-wrap:nowrap !important;
          align-items:center !important; gap:5px !important; flex:1 1 0 !important;
          min-width:0 !important; width:auto !important; max-width:none !important;
        }
        .week-toolbar .week-pick input[type="date"] {
          flex:1 1 88px !important; min-width:0 !important; width:88px !important;
          padding:6px 5px !important; font-size:10px !important;
        }
        .week-inline-actions-v2 { gap:4px; }
        .week-inline-actions-v2 .btn-sm { padding:6px 7px !important; font-size:9px !important; }

        #day-workout-modal .builder-week-between-v7 {
          grid-template-columns:minmax(0,1fr) auto !important;
          column-gap:8px !important; row-gap:0 !important;
        }
        #day-workout-modal #between-exercise-toggle-panel-v7.builder-toggle-cluster-v12 {
          grid-column:2 !important; min-width:124px !important; gap:8px !important;
        }
        .builder-toggle-unit-v12 { min-width:54px; gap:4px; }
        .builder-toggle-label-v12 { font-size:7.5px; }
      }
      @media(max-width:380px) {
        #day-workout-modal .builder-week-between-v7 {
          grid-template-columns:minmax(0,1fr) 118px !important; column-gap:6px !important;
        }
        #day-workout-modal #between-exercise-toggle-panel-v7.builder-toggle-cluster-v12 {
          grid-column:2 !important; min-width:118px !important; gap:6px !important;
        }
        .builder-toggle-unit-v12 { min-width:52px; }
        .builder-toggle-label-v12 { font-size:7px; letter-spacing:0; }
      }
    `;
    document.head.appendChild(style);
  }

  function lower(value) { return String(value || '').trim().toLocaleLowerCase('sv-SE'); }

  function relocateWeekActions() {
    var toolbar = document.querySelector('.week-toolbar');
    var pick = toolbar && toolbar.querySelector('.week-pick');
    if (!toolbar || !pick) return;

    Array.prototype.slice.call(pick.children).forEach(function (child) {
      if (child.tagName === 'BUTTON' && lower(child.textContent) === 'denna vecka') child.remove();
    });

    var actions = document.getElementById('week-inline-actions-v2');
    if (actions) return;

    var headers = Array.prototype.slice.call(document.querySelectorAll('.section-hdr'));
    var weekHeader = headers.find(function (header) {
      var h2 = header.querySelector('h2');
      return h2 && lower(h2.textContent) === 'veckoplan';
    });
    if (!weekHeader) return;

    var buttons = Array.prototype.slice.call(weekHeader.querySelectorAll('button')).filter(function (button) {
      var text = lower(button.textContent);
      return text === 'redigera' || text === 'mallpass';
    });
    if (!buttons.length) return;

    actions = document.createElement('div');
    actions.id = 'week-inline-actions-v2';
    actions.className = 'week-inline-actions-v2';
    buttons.forEach(function (button) { actions.appendChild(button); });
    pick.appendChild(actions);
  }

  function cardForCanvas(id) {
    var canvas = document.getElementById(id);
    return canvas && canvas.closest ? canvas.closest('.chart-card') : null;
  }

  function goalValue() {
    try {
      if (typeof window.getGoals === 'function') {
        var goals = window.getGoals() || {};
        var value = Number(goals.vo2Goal);
        if (isFinite(value)) return value;
      }
    } catch (_) {}
    var legacy = document.getElementById('g3-goal');
    var fallback = Number(legacy && legacy.value);
    return isFinite(fallback) ? fallback : 45;
  }

  function syncGoalInput() {
    var input = document.getElementById('vo2-goal-line-v12');
    if (!input || document.activeElement === input) return;
    var value = goalValue();
    if (isFinite(value) && Number(input.value) !== value) input.value = String(value);
  }

  function saveGoalValue(value) {
    try {
      var goals = typeof window.getGoals === 'function' ? (window.getGoals() || {}) : {};
      goals.vo2Goal = value;
      if (window.DB && typeof window.DB.set === 'function') window.DB.set('goals', goals);
      else localStorage.setItem('ex_goals', JSON.stringify(goals));
    } catch (_) {}
    var legacy = document.getElementById('g3-goal');
    if (legacy) legacy.value = value;
  }

  function ensureGoalLineControl(vo2Card) {
    if (!vo2Card) return;
    var existing = document.getElementById('vo2-goal-line-v12');
    if (existing) { syncGoalInput(); return; }
    var row = vo2Card.querySelector('.bw-row');
    if (!row) return;

    var line = document.createElement('div');
    line.className = 'vo2-goal-line-v12';
    line.innerHTML = '<label for="vo2-goal-line-v12">Mål VO₂ max</label><input id="vo2-goal-line-v12" type="number" min="20" max="80" step="0.1" inputmode="decimal">';
    row.insertAdjacentElement('afterend', line);
    var input = line.querySelector('input');
    input.value = String(goalValue());
    input.addEventListener('change', function () {
      var value = Number(input.value);
      if (!isFinite(value) || value < 20 || value > 80) { syncGoalInput(); return; }
      saveGoalValue(value);
      try { if (typeof window.refreshGoals === 'function') window.refreshGoals(); } catch (_) {}
      try { if (typeof window.renderCharts === 'function') window.renderCharts(); } catch (_) {}
    });
  }

  function arrangeGoals() {
    var grid = document.querySelector('.goals-grid');
    if (!grid) return;

    var legacyVo2 = document.getElementById('g3-goal');
    var legacyCard = legacyVo2 && legacyVo2.closest ? legacyVo2.closest('.goal-card') : null;
    if (legacyCard) legacyCard.classList.add('vo2-goal-source-v12');

    var vo2Card = cardForCanvas('chart-bw');
    var runInput = document.getElementById('g2-goal');
    var runCard = runInput && runInput.closest ? runInput.closest('.goal-card') : null;
    if (!vo2Card) return;

    vo2Card.classList.add('goal-vo2-chart-v12');
    if (vo2Card.parentElement !== grid) {
      if (runCard && runCard.parentElement === grid) runCard.insertAdjacentElement('afterend', vo2Card);
      else grid.appendChild(vo2Card);
    }
    ensureGoalLineControl(vo2Card);
  }

  function workoutVo2Data() {
    var workouts = [];
    try {
      if (typeof window.getWorkouts === 'function') workouts = window.getWorkouts() || [];
      else if (window.DB && typeof window.DB.get === 'function') workouts = window.DB.get('wk') || [];
    } catch (_) { workouts = []; }

    return (Array.isArray(workouts) ? workouts : [])
      .filter(function (workout) {
        var value = Number(workout && workout.vo2);
        return workout && workout.date && isFinite(value) && value >= 10 && value <= 100;
      })
      .map(function (workout) { return {date:String(workout.date), score:Number(workout.vo2)}; })
      .sort(function (a,b) { return a.date.localeCompare(b.date); });
  }

  function installRenderSource() {
    if (renderWrapped || typeof window.renderCharts !== 'function' || !window.DB || typeof window.DB.get !== 'function') return false;
    var originalRender = window.renderCharts;
    renderWrapped = true;
    window.renderCharts = function () {
      var db = window.DB;
      var originalGet = db.get;
      db.get = function (key) {
        if (key === 'vo2') return workoutVo2Data();
        return originalGet.call(db,key);
      };
      try {
        return originalRender.apply(this,arguments);
      } finally {
        db.get = originalGet;
        setTimeout(function () {
          syncGoalInput();
          try { if (window.chartVO2) window.chartVO2.draw(); } catch (_) {}
        },0);
      }
    };
    return true;
  }

  function registerGoalPlugin() {
    if (!window.Chart || window.__exerciseVo2GoalLineV12Registered) return false;
    window.__exerciseVo2GoalLineV12Registered = true;
    window.Chart.register({
      id:GOAL_PLUGIN_ID,
      afterDatasetsDraw:function (chart) {
        if (!chart || !chart.canvas || chart.canvas.id !== 'chart-bw') return;
        var area = chart.chartArea;
        var yScale = chart.scales && chart.scales.y;
        if (!area || !yScale) return;
        var value = goalValue();
        var y = yScale.getPixelForValue(value);
        if (!isFinite(y) || y < area.top || y > area.bottom) return;

        var ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2;
        ctx.setLineDash([7,5]);
        ctx.beginPath();
        ctx.moveTo(area.left, Math.round(y) + .5);
        ctx.lineTo(area.right, Math.round(y) + .5);
        ctx.stroke();
        ctx.setLineDash([]);

        var label = 'Mål ' + (Math.round(value * 10) / 10).toString().replace('.', ',');
        ctx.font = '700 9px Inter, sans-serif';
        var width = ctx.measureText(label).width;
        var x = Math.max(area.left + 4, area.right - width - 5);
        var labelY = Math.max(area.top + 10, y - 5);
        ctx.fillStyle = 'rgba(22,27,34,.88)';
        ctx.fillRect(x - 3, labelY - 9, width + 6, 12);
        ctx.fillStyle = '#FBBF24';
        ctx.fillText(label, x, labelY);
        ctx.restore();
      }
    });
    return true;
  }

  function compactBuilderControls() {
    var modal = document.getElementById('day-workout-modal');
    if (!modal || !modal.classList.contains('show')) return false;
    var panel = document.getElementById('between-exercise-toggle-panel-v7');
    var globalButton = panel && panel.querySelector('[data-global-toggle-v7]');
    var timerButton = document.getElementById('pretimer-builder-switch-v2');
    if (!panel || !globalButton || !timerButton) return false;

    if (panel.dataset.compactTogglesV12 !== '1') {
      globalButton.remove();
      timerButton.remove();
      panel.innerHTML = '';
      panel.classList.add('builder-toggle-cluster-v12');
      panel.dataset.compactTogglesV12 = '1';

      var betweenUnit = document.createElement('div');
      betweenUnit.className = 'builder-toggle-unit-v12';
      betweenUnit.innerHTML = '<span class="builder-toggle-label-v12">Mellanövningar</span>';
      betweenUnit.appendChild(globalButton);

      var timerUnit = document.createElement('div');
      timerUnit.className = 'builder-toggle-unit-v12';
      timerUnit.innerHTML = '<span class="builder-toggle-label-v12">5 s starttimer</span>';
      timerUnit.appendChild(timerButton);

      panel.appendChild(betweenUnit);
      panel.appendChild(timerUnit);
    }
    return true;
  }

  function scheduleBuilderControls() {
    builderTimers.forEach(clearTimeout);
    builderTimers = [0,60,160,320,560,850].map(function (delay) {
      return setTimeout(compactBuilderControls,delay);
    });
  }

  function bindBuilderTriggers() {
    document.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('button') : null;
      if (!button) return;
      scheduleBuilderControls();
    }, false);
    document.addEventListener('change', function (event) {
      if (event.target && event.target.id === 'day-workout-date') scheduleBuilderControls();
    }, false);
  }

  function prepare() {
    relocateWeekActions();
    arrangeGoals();
    registerGoalPlugin();
    installRenderSource();
    scheduleBuilderControls();
  }

  function install() {
    if (window.__exerciseShellV12Installed) return;
    window.__exerciseShellV12Installed = true;
    addStyles();
    bindBuilderTriggers();
    prepare();
    window.__exerciseShellV12 = {
      prepare:prepare,
      arrangeGoals:arrangeGoals,
      relocateWeekActions:relocateWeekActions,
      compactBuilderControls:compactBuilderControls,
      workoutVo2Data:workoutVo2Data
    };
  }

  addStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
