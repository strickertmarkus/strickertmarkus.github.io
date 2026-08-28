(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function addStyles() {
    if (document.getElementById('exercise-goal-vo2-source-v11-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-goal-vo2-source-v11-style';
    style.textContent = `
      /* Mål contains only the running-distance card and the moved VO2 chart. */
      html body .goals-grid {
        grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      }
      html body .goals-grid > .goal-card:first-child {
        display:none !important;
      }
      html body .goals-grid > .goal-card.vo2-goal-source-v8 {
        display:none !important;
      }

      /* VO2 is logged with the workout, never from a separate control here. */
      html body .goal-vo2-chart-v8 .bw-row,
      html body .charts-row > .chart-card:nth-child(2) .bw-row {
        display:none !important;
      }
      html body .goal-vo2-chart-v8 .vo2-goal-line-v8 {
        margin-top:0 !important;
      }

      @media(max-width:768px) {
        html body .goals-grid {
          grid-template-columns:1fr !important;
        }
        html body .goals-grid > .goal-vo2-chart-v8 {
          grid-column:1 !important;
        }
      }
    `;
    document.head.appendChild(style);
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
      .map(function (workout) {
        return { date:String(workout.date), score:Number(workout.vo2) };
      })
      .sort(function (a,b) { return a.date.localeCompare(b.date); });
  }

  function installChartSource() {
    if (window.__exerciseWorkoutVo2RenderWrappedV11) return true;
    if (typeof window.renderCharts !== 'function' || !window.DB || typeof window.DB.get !== 'function') return false;

    var originalRenderCharts = window.renderCharts;
    window.__exerciseWorkoutVo2RenderWrappedV11 = true;

    window.renderCharts = function () {
      var db = window.DB;
      var originalGet = db && db.get;
      if (typeof originalGet !== 'function') return originalRenderCharts.apply(this,arguments);

      db.get = function (key) {
        if (key === 'vo2') return workoutVo2Data();
        return originalGet.call(db,key);
      };

      try {
        return originalRenderCharts.apply(this,arguments);
      } finally {
        db.get = originalGet;
      }
    };

    /* If the old chart already rendered before this module bound, rebuild it
       immediately from the workout log. */
    try { window.renderCharts(); } catch (_) {}
    return true;
  }

  function sync() {
    addStyles();
    installChartSource();
  }

  function install() {
    if (window.__exerciseGoalVo2SourceV11Installed) return;
    window.__exerciseGoalVo2SourceV11Installed = true;
    addStyles();

    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (installChartSource() || tries > 200) clearInterval(timer);
    },40);
    sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
