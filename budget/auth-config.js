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

  /* First-paint guard. These selectors describe the raw exercise.html layout
     before the Exercise polish modules run. They prevent the old VO2 goal card
     and old VO2 chart position from ever painting, while keeping the real
     Framsteg -> Träningspass per vecka chart visible. Once chart-bw is moved
     into the Goals grid, the raw .charts-row selector no longer applies. */
  if (!document.getElementById('exercise-goal-first-paint-v9')) {
    var style = document.createElement('style');
    style.id = 'exercise-goal-first-paint-v9';
    style.textContent =
      '.goals-grid>.goal-card:first-child>.goal-row{display:none!important}' +
      '.goals-grid>.goal-card:nth-child(3){visibility:hidden!important}' +
      '.charts-row>.chart-card:nth-child(2){visibility:hidden!important}' +
      /* The large 5-second builder card is obsolete. The compact toggle next
         to Mellanövningar is now the only builder control. Higher specificity
         also wins over the older routing module that tried to force it open. */
      'html body #day-workout-modal #pretimer-builder-v2{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}';
    document.head.appendChild(style);
  }

  /* Load the corrective goal layer before body paint. */
  if (!document.querySelector('script[data-exercise-goal-layout-fix-v9]')) {
    var goalScript = document.createElement('script');
    goalScript.src = 'exercise-goal-layout-fix-v9.js?v=20260828-1240-goal-layout-fix-v9';
    goalScript.async = false;
    goalScript.setAttribute('data-exercise-goal-layout-fix-v9','true');
    document.head.appendChild(goalScript);
  }

  /* Canonical pass progress is independent of the temporary exercise swap
     used while a custom between-exercise is running. */
  if (!document.querySelector('script[data-exercise-progress-consistency-v10]')) {
    var progressScript = document.createElement('script');
    progressScript.src = 'exercise-progress-consistency-v10.js?v=20260828-1320-progress-consistency-v10';
    progressScript.async = false;
    progressScript.setAttribute('data-exercise-progress-consistency-v10','true');
    document.head.appendChild(progressScript);
  }
})();
