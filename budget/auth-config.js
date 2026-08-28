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

  /* Hard-refresh gate. The current exercise.html still contains a few legacy
     source elements for compatibility. They must never be painted before the
     final DOM geometry and first Chart.js render are ready. */
  document.documentElement.classList.add('exercise-shell-booting-v13');
  document.documentElement.classList.add('exercise-hr-booting-v14');

  if (!document.getElementById('exercise-shell-critical-v13')) {
    var style = document.createElement('style');
    style.id = 'exercise-shell-critical-v13';
    style.textContent =
      'html.exercise-shell-booting-v13 body .main-content,html.exercise-shell-booting-v13 body .fab{visibility:hidden!important}' +
      '.week-toolbar>button[onclick*="goToCurrentWeek"]{display:none!important}' +
      'html body .goals-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}' +
      'html body .goals-grid>.goal-card:first-child{display:none!important}' +
      'html body .goals-grid>.goal-card:nth-child(3):not(.goal-vo2-chart-v13){display:none!important}' +
      'html body .goals-grid>.goal-card.vo2-goal-source-v13{display:none!important}' +
      'html body .charts-row>.chart-card:nth-child(2) .bw-row{display:none!important}' +
      'html body .goals-grid>.goal-vo2-chart-v13{display:block!important}' +
      'html body .goal-vo2-chart-v13 .bw-row{display:none!important}' +
      'html.exercise-hr-booting-v14 body #chart-hr{visibility:hidden!important}' +
      'html.exercise-hr-booting-v14 body #hr-card-combined .chart-area,html.exercise-hr-booting-v14 body #hr-card-combined .chart-note{visibility:hidden!important}' +
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
    if (window.__exerciseVo2SourceWrappedV13) return true;
    if (typeof window.renderCharts !== 'function' || !window.DB || typeof window.DB.get !== 'function') return false;
    var originalRender = window.renderCharts;
    window.__exerciseVo2SourceWrappedV13 = true;
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
    if (window.__exerciseVo2GoalLineV13Registered || !window.Chart) return;
    window.__exerciseVo2GoalLineV13Registered = true;
    window.Chart.register({
      id:'exerciseVo2GoalLineV13',
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

  function arrangeCriticalDom() {
    var toolbar = document.querySelector('.week-toolbar');
    if (toolbar) {
      Array.prototype.slice.call(toolbar.children).forEach(function (child) {
        if (child.tagName === 'BUTTON' && String(child.textContent || '').trim().toLowerCase() === 'denna vecka') child.remove();
      });
    }

    var goalsGrid = document.querySelector('.goals-grid');
    var g1 = document.getElementById('g1-goal');
    var g1Card = g1 && g1.closest ? g1.closest('.goal-card') : null;
    if (g1Card) g1Card.classList.add('goal-pass-week-legacy-v13');

    var legacyVo2 = document.getElementById('g3-goal');
    var legacyVo2Card = legacyVo2 && legacyVo2.closest ? legacyVo2.closest('.goal-card') : null;
    if (legacyVo2Card) legacyVo2Card.classList.add('vo2-goal-source-v13');

    var canvas = document.getElementById('chart-bw');
    var vo2Card = canvas && canvas.closest ? canvas.closest('.chart-card') : null;
    var runInput = document.getElementById('g2-goal');
    var runCard = runInput && runInput.closest ? runInput.closest('.goal-card') : null;
    if (goalsGrid && vo2Card) {
      vo2Card.classList.add('goal-vo2-chart-v13');
      if (vo2Card.parentElement !== goalsGrid) {
        if (runCard && runCard.parentElement === goalsGrid) runCard.insertAdjacentElement('afterend',vo2Card);
        else goalsGrid.appendChild(vo2Card);
      }
    }
  }

  function revealFinalFrame() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.remove('exercise-shell-booting-v13');
        document.documentElement.classList.add('exercise-shell-ready-v13');
      });
    });
  }

  /* Registered before exercise.html's own DOMContentLoaded refreshAll handler.
     Geometry and data source are therefore final before Chart.js builds the
     first visible charts. The boot gate is released only after that task. */
  document.addEventListener('DOMContentLoaded', function () {
    arrangeCriticalDom();
    installEarlyVo2Source();
    installEarlyGoalPlugin();

    try {
      if (window.__exerciseShellV13 && typeof window.__exerciseShellV13.prepare === 'function') window.__exerciseShellV13.prepare();
    } catch (_) {}

    revealFinalFrame();
  }, {once:true});

  if (!document.querySelector('script[data-exercise-shell-v13]')) {
    var shellScript = document.createElement('script');
    shellScript.src = 'exercise-shell-v13.js?v=20260828-1615-shell-v13';
    shellScript.async = false;
    shellScript.setAttribute('data-exercise-shell-v13','true');
    document.head.appendChild(shellScript);
  }

  /* The pulse graph has two compatibility render stages (legacy -> combined ->
     range). Keep its drawing hidden until the final range chart is complete. */
  if (!document.querySelector('script[data-exercise-hr-first-paint-v14]')) {
    var hrPaintScript = document.createElement('script');
    hrPaintScript.src = 'exercise-hr-first-paint-v14.js?v=20260828-1645-hr-first-paint-v14';
    hrPaintScript.async = false;
    hrPaintScript.setAttribute('data-exercise-hr-first-paint-v14','true');
    document.head.appendChild(hrPaintScript);
  }

  /* Canonical pass progress remains isolated from page-shell cleanup. */
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
