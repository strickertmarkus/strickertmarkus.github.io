(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var TARGET_PLUGIN_ID = 'exerciseVo2GoalLineV9';

  function addStyles() {
    if (document.getElementById('exercise-goal-layout-fix-v9-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-goal-layout-fix-v9-style';
    style.textContent = `
      /* Pass / vecka stays as a goal card, but without the small progress graph. */
      body .goals-grid > .goal-card:first-child > .goal-row {
        display:none !important;
      }

      /* V8 accidentally hid the real Framsteg chart. Higher specificity keeps
         Träningspass per vecka visible even while V8 still adds its old class. */
      body .chart-card.sessions-chart-hidden-v8 {
        display:block !important;
      }

      /* The legacy VO2 goal card remains only as a hidden state/source. */
      body .goals-grid > .goal-card.vo2-goal-source-v8 {
        display:none !important;
      }

      /* The moved VO2 history chart is the visible VO2 goal surface. */
      body .goals-grid > .goal-vo2-chart-v8 {
        display:block !important;
        visibility:visible !important;
      }
    `;
    document.head.appendChild(style);
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

  function registerTargetPlugin() {
    if (!window.Chart || window.__exerciseVo2GoalLineV9Registered) return;
    window.__exerciseVo2GoalLineV9Registered = true;

    window.Chart.register({
      id:TARGET_PLUGIN_ID,
      afterDatasetsDraw:function (chart) {
        if (!chart || !chart.canvas || chart.canvas.id !== 'chart-bw') return;
        var area = chart.chartArea;
        var yScale = chart.scales && chart.scales.y;
        if (!area || !yScale) return;

        var value = goalValue();
        if (!isFinite(value)) return;
        var y = yScale.getPixelForValue(value);
        if (!isFinite(y) || y < area.top || y > area.bottom) return;

        var ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2;
        ctx.setLineDash([7,5]);
        ctx.beginPath();
        ctx.moveTo(area.left, Math.round(y) + 0.5);
        ctx.lineTo(area.right, Math.round(y) + 0.5);
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
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(label, x, labelY);
        ctx.restore();
      }
    });
  }

  function repairLayout() {
    /* V8 still owns the actual move of chart-bw into Goals. This layer only
       corrects the mistaken sessions-chart hide and reinforces the intended
       final state without touching session/training logic. */
    var sessions = document.getElementById('chart-sessions');
    var sessionsCard = sessions && sessions.closest ? sessions.closest('.chart-card') : null;
    if (sessionsCard) sessionsCard.classList.remove('sessions-chart-hidden-v8');

    var passGoal = document.getElementById('g1-goal');
    var passCard = passGoal && passGoal.closest ? passGoal.closest('.goal-card') : null;
    var passProgress = passCard && passCard.querySelector('.goal-row');
    if (passProgress) passProgress.style.display = 'none';

    var chart = window.chartVO2;
    if (chart && chart.canvas && chart.canvas.id === 'chart-bw') {
      try { chart.draw(); } catch (_) {}
    }
  }

  function bindGoalInput() {
    var input = document.getElementById('vo2-goal-line-v8');
    if (!input || input.dataset.goalLineV9Bound === '1') return;
    input.dataset.goalLineV9Bound = '1';
    ['input','change'].forEach(function (type) {
      input.addEventListener(type,function () {
        setTimeout(function () {
          try { if (window.chartVO2) window.chartVO2.draw(); } catch (_) {}
        },0);
      });
    });
  }

  function sync() {
    registerTargetPlugin();
    repairLayout();
    bindGoalInput();
  }

  function install() {
    if (window.__exerciseGoalLayoutFixV9Installed) return;
    window.__exerciseGoalLayoutFixV9Installed = true;
    addStyles();
    sync();
    setInterval(sync,220);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
