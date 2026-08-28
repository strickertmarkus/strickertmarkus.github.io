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
      '.charts-row>.chart-card:nth-child(2){visibility:hidden!important}';
    document.head.appendChild(style);
  }

  /* Load the corrective layer before body paint. It is intentionally separate
     from the session modules and only owns Goals/VO2 presentation. */
  if (!document.querySelector('script[data-exercise-goal-layout-fix-v9]')) {
    var script = document.createElement('script');
    script.src = 'exercise-goal-layout-fix-v9.js?v=20260828-1240-goal-layout-fix-v9';
    script.async = false;
    script.setAttribute('data-exercise-goal-layout-fix-v9','true');
    document.head.appendChild(script);
  }
})();
