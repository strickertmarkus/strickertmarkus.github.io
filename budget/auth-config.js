window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCgGL762gcglRpix4-akfP7NydFj5ChxfM",
  authDomain: "frick-budget.firebaseapp.com",
  projectId: "frick-budget",
  storageBucket: "frick-budget.firebasestorage.app",
  messagingSenderId: "231130144804",
  appId: "1:231130144804:web:49ad446a858c585d2838b1",
  databaseURL: "https://frick-budget-default-rtdb.europe-west1.firebasedatabase.app"
};

(function () {
  var path = window.location.pathname.toLowerCase();
  var isExercise = path.endsWith('/budget/exercise.html') || path.endsWith('/exercise.html');
  if (!isExercise) return;

  /* Final Exercise shell geometry is known before body parsing. This prevents
     legacy controls/cards from participating in the first painted layout. */
  if (!document.getElementById('exercise-shell-critical-v12')) {
    var style = document.createElement('style');
    style.id = 'exercise-shell-critical-v12';
    style.textContent =
      '.week-pick>button{display:none!important}' +
      'html body .goals-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}' +
      'html body .goals-grid>.goal-card:first-child{display:none!important}' +
      'html body .goals-grid>.goal-card:nth-child(3):not(.goal-vo2-chart-v12){display:none!important}' +
      'html body .goals-grid>.goal-card.vo2-goal-source-v12{display:none!important}' +
      'html body .charts-row>.chart-card:nth-child(2){display:none!important}' +
      'html body .goals-grid>.goal-vo2-chart-v12{display:block!important}' +
      'html body .goal-vo2-chart-v12 .bw-row{display:none!important}' +
      'html body #day-workout-modal #pretimer-builder-v2{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}' +
      '@media(max-width:768px){html body .goals-grid{grid-template-columns:1fr!important}}';
    document.head.appendChild(style);
  }

  function earlyGoalValue() {
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

  function earlyWorkoutVo2Data() {
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

  function installEarlyVo2Source() {
    if (window.__exerciseVo2SourceWrappedV12) return true;
    if (typeof window.renderCharts !== 'function' || !window.DB || typeof window.DB.get !== 'function') return false;
    var originalRender = window.renderCharts;
    window.__exerciseVo2SourceWrappedV12 = true;
    window.renderCharts = function () {
      var db = window.DB;
      var originalGet = db.get;
      db.get = function (key) {
        if (key === 'vo2') return earlyWorkoutVo2Data();
        return originalGet.call(db,key);
      };
      try { return originalRender.apply(this,arguments); }
      finally { db.get = originalGet; }
    };
    return true;
  }

  function installEarlyGoalPlugin() {
    if (window.__exerciseVo2GoalLineV12Registered || !window.Chart) return;
    window.__exerciseVo2GoalLineV12Registered = true;
    window.Chart.register({
      id:'exerciseVo2GoalLineV12',
      afterDatasetsDraw:function (chart) {
        if (!chart || !chart.canvas || chart.canvas.id !== 'chart-bw') return;
        var area = chart.chartArea;
        var yScale = chart.scales && chart.scales.y;
        if (!area || !yScale) return;
        var value = earlyGoalValue();
        var y = yScale.getPixelForValue(value);
        if (!isFinite(y) || y < area.top || y > area.bottom) return;
        var ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2;
        ctx.setLineDash([7,5]);
        ctx.beginPath();
        ctx.moveTo(area.left,Math.round(y)+.5);
        ctx.lineTo(area.right,Math.round(y)+.5);
        ctx.stroke();
        ctx.setLineDash([]);
        var label = 'Mål ' + (Math.round(value*10)/10).toString().replace('.',',');
        ctx.font = '700 9px Inter, sans-serif';
        var width = ctx.measureText(label).width;
        var x = Math.max(area.left+4,area.right-width-5);
        var labelY = Math.max(area.top+10,y-5);
        ctx.fillStyle = 'rgba(22,27,34,.88)';
        ctx.fillRect(x-3,labelY-9,width+6,12);
        ctx.fillStyle = '#FBBF24';
        ctx.fillText(label,x,labelY);
        ctx.restore();
      }
    });
  }

  /* This listener is registered before exercise.html registers refreshAll().
     Therefore final geometry, VO2 source and goal plugin are all ready before
     Chart.js creates the first graph. */
  document.addEventListener('DOMContentLoaded', function () {
    var toolbar = document.querySelector('.week-toolbar');
    var pick = toolbar && toolbar.querySelector('.week-pick');
    if (pick) {
      Array.prototype.slice.call(pick.children).forEach(function (child) {
        if (child.tagName === 'BUTTON' && String(child.textContent || '').trim().toLowerCase() === 'denna vecka') child.remove();
      });

      if (!document.getElementById('week-inline-actions-v2')) {
        var headers = Array.prototype.slice.call(document.querySelectorAll('.section-hdr'));
        var weekHeader = headers.find(function (header) {
          var h2 = header.querySelector('h2');
          return h2 && String(h2.textContent || '').trim().toLowerCase() === 'veckoplan';
        });
        if (weekHeader) {
          var buttons = Array.prototype.slice.call(weekHeader.querySelectorAll('button')).filter(function (button) {
            var text = String(button.textContent || '').trim().toLowerCase();
            return text === 'redigera' || text === 'mallpass';
          });
          if (buttons.length) {
            var actions = document.createElement('div');
            actions.id = 'week-inline-actions-v2';
            actions.className = 'week-inline-actions-v2';
            buttons.forEach(function (button) { actions.appendChild(button); });
            pick.appendChild(actions);
          }
        }
      }
    }

    var goalsGrid = document.querySelector('.goals-grid');
    var legacyVo2 = document.getElementById('g3-goal');
    var legacyVo2Card = legacyVo2 && legacyVo2.closest ? legacyVo2.closest('.goal-card') : null;
    if (legacyVo2Card) legacyVo2Card.classList.add('vo2-goal-source-v12');

    var canvas = document.getElementById('chart-bw');
    var vo2Card = canvas && canvas.closest ? canvas.closest('.chart-card') : null;
    var runInput = document.getElementById('g2-goal');
    var runCard = runInput && runInput.closest ? runInput.closest('.goal-card') : null;
    if (goalsGrid && vo2Card) {
      vo2Card.classList.add('goal-vo2-chart-v12');
      if (vo2Card.parentElement !== goalsGrid) {
        if (runCard && runCard.parentElement === goalsGrid) runCard.insertAdjacentElement('afterend',vo2Card);
        else goalsGrid.appendChild(vo2Card);
      }
    }

    installEarlyVo2Source();
    installEarlyGoalPlugin();

    try {
      if (window.__exerciseShellV12 && typeof window.__exerciseShellV12.prepare === 'function') window.__exerciseShellV12.prepare();
    } catch (_) {}
  }, {once:true});

  if (!document.querySelector('script[data-exercise-shell-v12]')) {
    var shellScript = document.createElement('script');
    shellScript.src = 'exercise-shell-v12.js?v=20260828-1525-shell-v12c';
    shellScript.async = false;
    shellScript.setAttribute('data-exercise-shell-v12','true');
    document.head.appendChild(shellScript);
  }

  /* Canonical pass progress remains isolated from UI-shell cleanup because it
     represents session data, not page layout. */
  if (!document.querySelector('script[data-exercise-progress-consistency-v10]')) {
    var progressScript = document.createElement('script');
    progressScript.src = 'exercise-progress-consistency-v10.js?v=20260828-1320-progress-consistency-v10';
    progressScript.async = false;
    progressScript.setAttribute('data-exercise-progress-consistency-v10','true');
    document.head.appendChild(progressScript);
  }
})();

(function () {
  var path = window.location.pathname.toLowerCase();
  var isShopping = path.endsWith('/budget/shopping.html') || path.endsWith('/shopping.html');
  if (!isShopping) return;

  /* Recipe header geometry is loaded from head so the legacy text arrow never
     gets a visible first frame before the recipe modules finish rendering. */
  if (!document.querySelector('script[data-shopping-recipe-header-polish-v6]')) {
    var script = document.createElement('script');
    script.src = 'shopping-recipe-header-polish-v6.js?v=20260828-1345-recipe-header-v6';
    script.async = false;
    script.setAttribute('data-shopping-recipe-header-polish-v6','true');
    document.head.appendChild(script);
  }
})();
