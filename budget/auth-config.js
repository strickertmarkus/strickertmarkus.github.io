window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCgGL762gcglRpix4-akfP7NydFj5ChxfM",
  authDomain: "frick-budget.firebaseapp.com",
  projectId: "frick-budget",
  storageBucket: "frick-budget.firebasestorage.app",
  messagingSenderId: "231130144804",
  appId: "1:231130144804:web:49ad446a858c585d2838b1",
  databaseURL: "https://frick-budget-default-rtdb.europe-west1.firebasedatabase.app"
};

window.FIREBASE_VAPID_KEY = "BDxkgYtOxV9Pwiz_IJk0wzLmZCXAd1Gkdo1yHdBwZZCJr-NdwkSLbYF1l4EFBho3eT11rSdjV8esa4m9v97GjLk";

(function () {
  var path = window.location.pathname.toLowerCase();
  var darkOnlyPages = [
    '/budget/budget.html','/budget.html',
    '/budget/budget_maja.html','/budget_maja.html',
    '/budget/analytics.html','/analytics.html',
    '/budget/analytics_maja.html','/analytics_maja.html',
    '/budget/familjebudget.html','/familjebudget.html',
    '/budget/data.html','/data.html'
  ];
  var isBudgetDarkOnly = darkOnlyPages.some(function (suffix) { return path.endsWith(suffix); });
  if (!isBudgetDarkOnly) return;

  document.documentElement.classList.add('dark-mode','budget-dark-only-v1');
  document.documentElement.style.colorScheme = 'dark';
  document.documentElement.style.backgroundColor = '#0F1219';

  if (!document.getElementById('budget-dark-only-critical-v1')) {
    var style = document.createElement('style');
    style.id = 'budget-dark-only-critical-v1';
    style.textContent =
      'html.budget-dark-only-v1,html.budget-dark-only-v1 body{background:#0F1219!important;color-scheme:dark!important}' +
      'html.budget-dark-only-v1 #dark-mode-btn{display:none!important}' +
      'html.budget-dark-only-v1 .header>.nav-dropdown-wrapper{right:16px!important}' +
      '@media(max-width:480px){html.budget-dark-only-v1 .header>.nav-dropdown-wrapper{right:8px!important}}';
    document.head.appendChild(style);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add('dark-mode','budget-dark-only-v1');
    var button = document.getElementById('dark-mode-btn');
    if (button) {
      button.style.display = 'none';
      button.setAttribute('aria-hidden','true');
      button.tabIndex = -1;
    }
    var nav = document.querySelector('.header > .nav-dropdown-wrapper');
    if (nav) nav.style.right = window.matchMedia && window.matchMedia('(max-width:480px)').matches ? '8px' : '16px';

    window.toggleDarkMode = function () {
      document.documentElement.classList.add('dark-mode','budget-dark-only-v1');
    };
  }, {once:true});
})();

(function () {
  var path = window.location.pathname.toLowerCase();
  var isExercise = path.endsWith('/budget/exercise.html') || path.endsWith('/exercise.html');
  if (!isExercise) return;

  ['exercise-points-8-9.js','exercise-heart-rate-range.js'].forEach(function (src) {
    var href = src + '?v=20260828-1745-chart-sync-v16';
    if (document.querySelector('link[rel="preload"][href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = href;
    document.head.appendChild(link);
  });

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
      'html.exercise-hr-booting-v14 body #chart-sessions,html.exercise-hr-booting-v14 body #chart-bw,html.exercise-hr-booting-v14 body #chart-hr,html.exercise-hr-booting-v14 body #chart-hr-combined{visibility:hidden!important}' +
      'html.exercise-hr-booting-v14 body #hr-card-combined .chart-note{visibility:hidden!important}' +
      'html.exercise-shell-ready-v13 body .main-content{animation:exerciseShellRevealV15 .34s cubic-bezier(.16,1,.3,1) both}' +
      'html.exercise-shell-ready-v13 body .fab{animation:exerciseFabRevealV15 .3s cubic-bezier(.16,1,.3,1) .06s both}' +
      '@keyframes exerciseShellRevealV15{from{opacity:.12;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}' +
      '@keyframes exerciseFabRevealV15{from{opacity:0;transform:translateY(5px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}' +
      'html body #day-workout-modal #pretimer-builder-v2{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}' +
      '@media(max-width:768px){html body .goals-grid{grid-template-columns:1fr!important}}' +
      '@media(prefers-reduced-motion:reduce){html.exercise-shell-ready-v13 body .main-content,html.exercise-shell-ready-v13 body .fab{animation:none!important}}';
    document.head.appendChild(style);
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

  document.addEventListener('DOMContentLoaded', function () {
    arrangeCriticalDom();

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

  if (!document.querySelector('script[data-exercise-hr-first-paint-v14]')) {
    var hrPaintScript = document.createElement('script');
    hrPaintScript.src = 'exercise-hr-first-paint-v14.js?v=20260828-1745-chart-sync-v16';
    hrPaintScript.async = false;
    hrPaintScript.setAttribute('data-exercise-hr-first-paint-v14','true');
    document.head.appendChild(hrPaintScript);
  }

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

  if (!document.querySelector('script[data-shopping-recipe-header-polish-v6]')) {
    var script = document.createElement('script');
    script.src = 'shopping-recipe-header-polish-v6.js?v=20260828-1345-recipe-header-v6';
    script.async = false;
    script.setAttribute('data-shopping-recipe-header-polish-v6','true');
    document.head.appendChild(script);
  }
})();
