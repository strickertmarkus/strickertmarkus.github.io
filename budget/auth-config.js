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
  /* Nested Pulse/Zen preview shells provide their own asset manifests. */
  var isNestedExerciseShell = path.indexOf('/pulse-environment/') !== -1 || path.indexOf('/pulse-observatory/') !== -1 || path.indexOf('/zen-preview/') !== -1;
  // Pulse Field has its own lightweight dashboard. Only the archived
  // exercise application needs the legacy first-paint gate and asset manifest.
  var isLegacyExercise = (path.endsWith('/budget/exercise.html') || path.endsWith('/exercise.html')) &&
    !isNestedExerciseShell && !document.documentElement.hasAttribute('data-field-view');
  if (!isLegacyExercise) return;

  /* First-paint gate v1: exercise.html still contains the legacy dashboard as
     its base markup. Keep that markup out of the visible first paint until the
     normal exercise bundle has loaded and the DOM rearrangement pass has run. */
  var exerciseFirstPaintRootV1 = document.documentElement;
  var embeddedFieldWorkspace = exerciseFirstPaintRootV1.hasAttribute('data-field-embedded');
  if (!embeddedFieldWorkspace) exerciseFirstPaintRootV1.classList.add('exercise-first-paint-loading-v1');
  if (!embeddedFieldWorkspace && !document.getElementById('exercise-first-paint-critical-v1')) {
    var firstPaintStyleV1 = document.createElement('style');
    firstPaintStyleV1.id = 'exercise-first-paint-critical-v1';
    firstPaintStyleV1.textContent =
      'html.exercise-first-paint-loading-v1:not([data-wellness-mode="zen"]),html.exercise-first-paint-loading-v1:not([data-wellness-mode="zen"]) body{background:#080D14!important}' +
      'html.exercise-first-paint-loading-v1:not([data-wellness-mode="zen"]) body .app-wrap,html.exercise-first-paint-loading-v1:not([data-wellness-mode="zen"]) body>.fab{visibility:hidden!important;opacity:0!important;pointer-events:none!important}' +
      'html.exercise-first-paint-loading-v1:not([data-wellness-mode="zen"]) body::after{content:""!important;display:block!important;position:fixed!important;left:50%!important;top:50%!important;width:44px!important;height:44px!important;margin:0!important;border-radius:50%!important;border:2px solid rgba(103,232,249,.13)!important;border-top-color:#67E8F9!important;border-right-color:rgba(103,232,249,.46)!important;box-shadow:0 0 24px rgba(34,211,238,.12)!important;z-index:2147483600!important;pointer-events:none!important;animation:exerciseFirstPaintSpinV1 .82s linear infinite!important}' +
      'html.exercise-first-paint-ready-v1 body .app-wrap{animation:exerciseFirstPaintRevealV1 .20s cubic-bezier(.16,1,.3,1) both}' +
      '@keyframes exerciseFirstPaintSpinV1{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}' +
      '@keyframes exerciseFirstPaintRevealV1{from{opacity:0}to{opacity:1}}' +
      '@media(prefers-reduced-motion:reduce){html.exercise-first-paint-loading-v1:not([data-wellness-mode="zen"]) body::after{animation:none!important}html.exercise-first-paint-ready-v1 body .app-wrap{animation:none!important}}';
    document.head.appendChild(firstPaintStyleV1);
  }

  var pulseDefaultBoot = !embeddedFieldWorkspace;
  var exerciseFastVersion = '20260926-embedded-builder-layout-2';

  /* Loader manifest v2. Network fetches may run concurrently, but auth-gate
     still executes these entries in this exact order. `group` documents the
     ownership so later cleanup can move only proven-independent layers. */
  var allExerciseAssetManifestV2 = [
    {src:'exercise-points-8-9.js',attr:'data-exercise-points-8-9',group:'dashboard'},
    {src:'exercise-heart-rate-range.js',attr:'data-exercise-heart-rate-range',group:'dashboard'},
    {src:'exercise-session-enhancements.js',attr:'data-exercise-session-enhancements',group:'session-presentation'},
    {src:'exercise-session-runtime-core-v21.js',attr:'data-exercise-session-runtime-core-v21',group:'session-core'},
    {src:'exercise-session-theme-stability.js',attr:'data-exercise-session-theme-stability',group:'session-presentation'},
    {src:'exercise-session-stable-details.js',attr:'data-exercise-session-stable-details',group:'session-presentation'},
    {src:'exercise-reload-recovery.js',attr:'data-exercise-reload-recovery',group:'boot-recovery'},
    {src:'exercise-points-3-6-7.js',attr:'data-exercise-points-3-6-7',group:'dashboard'},
    {src:'exercise-between-routing-v7.js',attr:'data-exercise-between-routing-v7',group:'session-transition'},
    {src:'exercise-between-custom-exercise-v3.js',attr:'data-exercise-between-custom-exercise-v3',group:'session-transition'},
    {src:'exercise-between-sets.js',attr:'data-exercise-between-sets-v2',group:'session-transition'},
    {src:'exercise-hype-polish.js',attr:'data-exercise-hype-polish-passive',group:'session-presentation'},
    {src:'exercise-flow-polish-v2.js',attr:'data-exercise-flow-polish-v2',group:'session-transition'},
    {src:'exercise-builder-row-tools-v3.js',attr:'data-exercise-builder-row-tools-v3',group:'builder'},
    {src:'exercise-builder-style-v5.js',attr:'data-exercise-builder-style-v5',group:'builder'},
    {src:'exercise-log-mobile-fix-v5.js',attr:'data-exercise-log-mobile-fix-v5',group:'training-log'},
    {src:'exercise-session-set-cards-v6.js',attr:'data-exercise-session-set-cards-v6',group:'session-presentation'},
    {src:'exercise-builder-between-preview-v7.js',attr:'data-exercise-builder-between-preview-v7',group:'builder'},
    {src:'exercise-session-shell-v19.js',attr:'data-exercise-session-shell-v19',group:'session-presentation'},
    {src:'exercise-session-ux-v20.js',attr:'data-exercise-session-ux-v20',group:'session-ux'},
    {src:'exercise-motion-v1.js',attr:'data-exercise-motion-v1',group:'motion'},
    {src:'exercise-hype-timer-layout-v1.js',attr:'data-exercise-hype-timer-layout-v1',group:'session-presentation'},
    {src:'exercise-session-stability-v55.js',attr:'data-exercise-session-stability-v55',group:'session-stability'},
    {src:'exercise-custom-transition-atomic-v56.js',attr:'data-exercise-custom-transition-atomic-v56',group:'session-transition'},
    {src:'exercise-pulse-flow-v58.js',attr:'data-exercise-pulse-flow-v58',group:'pulse-presentation'},
    {src:'exercise-pulse-flow-motion-v67.js',attr:'data-exercise-pulse-flow-motion-v67',group:'motion'},
    {src:'exercise-session-typography.js',attr:'data-exercise-session-typography',group:'pulse-presentation'}
  ];
  var exerciseAssetManifestV2 = embeddedFieldWorkspace
    ? allExerciseAssetManifestV2.filter(function (item) {
        return item.group === 'builder';
      })
    : allExerciseAssetManifestV2;

  /* Embedded Pulse Field opens the original builder immediately but the much
     larger session presentation bundle only when it is actually needed. This
     keeps builder buttons responsive without forking any training behavior. */
  var embeddedSessionAssetManifestV1 = embeddedFieldWorkspace
    ? [
        {src:'exercise-points-8-9.js',attr:'data-exercise-points-8-9'},
        {src:'exercise-timer-focus.js',attr:'data-exercise-timer-focus-v1'}
      ].concat(
        allExerciseAssetManifestV2.filter(function (item) {
          return ['session-presentation','session-core','session-transition','session-ux','session-stability','pulse-presentation','motion'].indexOf(item.group) >= 0;
        })
      )
    : [];
  window.__embeddedSessionAssetManifestV1 = embeddedSessionAssetManifestV1;

  function preloadEmbeddedAssets(manifest, marker) {
    manifest.forEach(function (item) {
      var href = item.src + '?v=' + exerciseFastVersion;
      if (document.querySelector('link[rel="preload"][href="' + href + '"]')) return;
      var preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'script';
      preload.href = href;
      preload.setAttribute(marker,'true');
      document.head.appendChild(preload);
    });
  }

  function loadEmbeddedAssets(manifest) {
    return manifest.reduce(function (chain,item) {
      return chain.then(function () {
        if (document.querySelector('script[' + item.attr + ']')) return;
        return new Promise(function (resolve,reject) {
          var script = document.createElement('script');
          script.src = item.src + '?v=' + exerciseFastVersion;
          script.async = false;
          script.setAttribute(item.attr,'true');
          script.addEventListener('load',resolve,{once:true});
          script.addEventListener('error',function(){reject(new Error('Kunde inte ladda '+item.src));},{once:true});
          document.head.appendChild(script);
        });
      });
    },Promise.resolve());
  }

  window.__prefetchEmbeddedSessionAssetsV1 = function () {
    if (!embeddedFieldWorkspace) return;
    preloadEmbeddedAssets(embeddedSessionAssetManifestV1,'data-embedded-session-preload-v1');
  };
  window.__loadEmbeddedSessionAssetsV1 = function () {
    if (!embeddedFieldWorkspace || !embeddedSessionAssetManifestV1.length) return Promise.resolve();
    if (window.__embeddedSessionAssetsPromiseV1) return window.__embeddedSessionAssetsPromiseV1;
    preloadEmbeddedAssets(embeddedSessionAssetManifestV1,'data-embedded-session-preload-v1');
    window.__embeddedSessionAssetsPromiseV1 = loadEmbeddedAssets(embeddedSessionAssetManifestV1);
    return window.__embeddedSessionAssetsPromiseV1;
  };

  window.__exerciseAssetManifestV2 = exerciseAssetManifestV2;
  window.__exerciseLoaderMetricsV2 = {
    manifestCount:exerciseAssetManifestV2.length,
    preloadStartedAt:(window.performance && performance.now) ? performance.now() : Date.now(),
    groups:exerciseAssetManifestV2.reduce(function (out,item) {
      out[item.group] = (out[item.group] || 0) + 1;
      return out;
    },{})
  };

  if (embeddedFieldWorkspace) {
    preloadEmbeddedAssets(exerciseAssetManifestV2,'data-embedded-builder-preload-v1');
    window.__embeddedBuilderReadyV1 = loadEmbeddedAssets(exerciseAssetManifestV2).then(function () {
      window.__exerciseLoaderMetricsV2.bundleReadyAt = (window.performance && performance.now) ? performance.now() : Date.now();
      window.__exerciseLoaderMetricsV2.bundleMs = Math.round(window.__exerciseLoaderMetricsV2.bundleReadyAt - window.__exerciseLoaderMetricsV2.preloadStartedAt);
      window.__exerciseLoaderMetricsV2.executionCount = exerciseAssetManifestV2.length;
    });
    return;
  }

  /* Start all network transfers together. Script execution remains ordered in
     auth-gate, so this removes waterfall latency without changing dependencies. */
  exerciseAssetManifestV2.forEach(function (item) {
    var href = item.src + '?v=' + exerciseFastVersion;
    if (document.querySelector('link[rel="preload"][href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = href;
    link.setAttribute('data-exercise-manifest-preload-v2','true');
    document.head.appendChild(link);
  });
  if (pulseDefaultBoot) {
    document.documentElement.classList.add('exercise-concept-pulse-home-v1');
    document.documentElement.classList.remove('exercise-pulse-booting-v82');
    document.documentElement.style.backgroundColor = '#080D14';

    if (!document.getElementById('exercise-pulse-preboot-v82')) {
      var pulseStyle = document.createElement('style');
      pulseStyle.id = 'exercise-pulse-preboot-v82';
      pulseStyle.textContent =
        'html.exercise-concept-pulse-home-v1:not([data-wellness-mode="zen"]),html.exercise-concept-pulse-home-v1:not([data-wellness-mode="zen"]) body{background:#080D14!important}' +
        'html.exercise-concept-pulse-home-v1 body .app-wrap{visibility:visible!important;opacity:1!important}' +
        'html.exercise-first-paint-loading-v1.exercise-concept-pulse-home-v1 body .app-wrap,html.exercise-first-paint-loading-v1.exercise-concept-pulse-home-v1 body>.fab{visibility:hidden!important;opacity:0!important;pointer-events:none!important}';
      document.head.appendChild(pulseStyle);
    }

    ['exercise-pulse-flow-v58.js','exercise-pulse-flow-motion-v67.js','exercise-pulse-flow-progress-marker-v92.js','exercise-pulse-flow-completed-marker-v102.js','exercise-pulse-flow-ecg-glow-v104.js','exercise-pulse-flow-canvas-glow-v130.js','exercise-pulse-flow-canvas-glow-v131.js'].forEach(function (src) {
      var href = src + '?v=' + exerciseFastVersion;
      if (document.querySelector('link[rel="preload"][href="' + href + '"]')) return;
      var link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = href;
      document.head.appendChild(link);
    });
  }

  [
    ['exercise-points-8-9.js',exerciseFastVersion],
    ['exercise-heart-rate-range.js',exerciseFastVersion]
  ].forEach(function (item) {
    var href = item[0] + '?v=' + item[1];
    if (document.querySelector('link[rel="preload"][href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = href;
    document.head.appendChild(link);
  });

  /* exercise-points-8-9 is the first normal exercise asset. Load it here with
     the fast cache key so its v125 scheduler guard is installed before the
     sequential auth-gate exercise bundle starts registering legacy pollers. */
  if (!document.querySelector('script[data-exercise-points-8-9]')) {
    var performanceBootstrap = document.createElement('script');
    performanceBootstrap.src = 'exercise-points-8-9.js?v=' + exerciseFastVersion;
    performanceBootstrap.async = false;
    performanceBootstrap.setAttribute('data-exercise-points-8-9','true');
    document.head.appendChild(performanceBootstrap);
  }

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
      'html body .charts-row>.chart-card:nth-child(2) .bw-row{display:none!important}' +
      'html body .goals-grid>.goal-card.vo2-goal-source-v13{display:none!important}' +
      'html body .goals-grid>.goal-vo2-chart-v13{display:block!important}' +
      'html body .goal-vo2-chart-v13 .bw-row{display:none!important}' +
      'html.exercise-hr-booting-v14 body #chart-sessions,html.exercise-hr-booting-v14 body #chart-bw,html.exercise-hr-booting-v14 body #chart-hr-combined{visibility:hidden!important}' +
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

  var exerciseDomReadyV1 = document.readyState !== 'loading';
  var exerciseBundleReadyV1 = !!window.__exerciseBundleReadyV1;
  var exerciseFirstPaintReleasedV1 = false;

  function prepareExerciseFirstPaintDomV1() {
    arrangeCriticalDom();
    try {
      if (window.__exerciseShellV13 && typeof window.__exerciseShellV13.prepare === 'function') window.__exerciseShellV13.prepare();
    } catch (_) {}
  }

  function releaseExerciseFirstPaintV1(force) {
    if (exerciseFirstPaintReleasedV1) return;
    if (!force && (!exerciseDomReadyV1 || !exerciseBundleReadyV1)) return;
    exerciseFirstPaintReleasedV1 = true;
    prepareExerciseFirstPaintDomV1();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var root = document.documentElement;
        root.classList.remove('exercise-shell-booting-v13');
        root.classList.add('exercise-shell-ready-v13');
        root.classList.remove('exercise-first-paint-loading-v1');
        root.classList.add('exercise-first-paint-ready-v1');
        setTimeout(function () { root.classList.remove('exercise-first-paint-ready-v1'); }, 420);
      });
    });
  }

  function markExerciseDomReadyV1() {
    exerciseDomReadyV1 = true;
    prepareExerciseFirstPaintDomV1();
    releaseExerciseFirstPaintV1(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markExerciseDomReadyV1, {once:true});
  else markExerciseDomReadyV1();

  document.addEventListener('exercise:bundle-ready-v1', function () {
    exerciseBundleReadyV1 = true;
    releaseExerciseFirstPaintV1(false);
  }, {once:true});

  /* Never leave the page hidden indefinitely if an optional legacy layer fails. */
  setTimeout(function () { releaseExerciseFirstPaintV1(true); }, 12000);

  if (!document.querySelector('script[data-exercise-shell-v13]')) {
    var shellScript = document.createElement('script');
    shellScript.src = 'exercise-shell-v13.js?v=20260916-wellness-shell-3';
    shellScript.async = false;
    shellScript.setAttribute('data-exercise-shell-v13','true');
    document.head.appendChild(shellScript);
  }

  if (!document.querySelector('script[data-exercise-hr-first-paint-v14]')) {
    var hrPaintScript = document.createElement('script');
    hrPaintScript.src = 'exercise-hr-first-paint-v14.js?v=20260913-training-cleanup-timers';
    hrPaintScript.async = false;
    hrPaintScript.setAttribute('data-exercise-hr-first-paint-v14','true');
    document.head.appendChild(hrPaintScript);
  }

  if (!document.querySelector('script[data-exercise-progress-consistency-v10]')) {
    var progressScript = document.createElement('script');
    progressScript.src = 'exercise-progress-consistency-v10.js?v=' + exerciseFastVersion;
    progressScript.async = false;
    progressScript.setAttribute('data-exercise-progress-consistency-v10','true');
    document.head.appendChild(progressScript);
  }

  if (pulseDefaultBoot && !document.querySelector('script[data-exercise-pulse-flow-progress-marker-v92]')) {
    var markerScript = document.createElement('script');
    markerScript.src = 'exercise-pulse-flow-progress-marker-v92.js?v=' + exerciseFastVersion;
    markerScript.async = false;
    markerScript.setAttribute('data-exercise-pulse-flow-progress-marker-v92','true');
    document.head.appendChild(markerScript);
  }

  if (pulseDefaultBoot && !document.querySelector('script[data-exercise-pulse-flow-completed-marker-v102]')) {
    var completedMarkerScript = document.createElement('script');
    completedMarkerScript.src = 'exercise-pulse-flow-completed-marker-v102.js?v=' + exerciseFastVersion;
    completedMarkerScript.async = false;
    completedMarkerScript.setAttribute('data-exercise-pulse-flow-completed-marker-v102','true');
    document.head.appendChild(completedMarkerScript);
  }

  if (pulseDefaultBoot && !document.querySelector('script[data-exercise-pulse-flow-ecg-glow-v104]')) {
    var ecgGlowScript = document.createElement('script');
    ecgGlowScript.src = 'exercise-pulse-flow-ecg-glow-v104.js?v=' + exerciseFastVersion;
    ecgGlowScript.async = false;
    ecgGlowScript.setAttribute('data-exercise-pulse-flow-ecg-glow-v104','true');
    document.head.appendChild(ecgGlowScript);
  }

  if (pulseDefaultBoot && !document.querySelector('script[data-exercise-pulse-flow-canvas-glow-v130]')) {
    var canvasGlowScript = document.createElement('script');
    canvasGlowScript.src = 'exercise-pulse-flow-canvas-glow-v130.js?v=' + exerciseFastVersion;
    canvasGlowScript.async = false;
    canvasGlowScript.setAttribute('data-exercise-pulse-flow-canvas-glow-v130','true');
    document.head.appendChild(canvasGlowScript);
  }

  if (pulseDefaultBoot && !document.querySelector('script[data-exercise-pulse-flow-canvas-glow-v131]')) {
    var canvasGlowBoostScript = document.createElement('script');
    canvasGlowBoostScript.src = 'exercise-pulse-flow-canvas-glow-v131.js?v=' + exerciseFastVersion;
    canvasGlowBoostScript.async = false;
    canvasGlowBoostScript.setAttribute('data-exercise-pulse-flow-canvas-glow-v131','true');
    document.head.appendChild(canvasGlowBoostScript);
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
