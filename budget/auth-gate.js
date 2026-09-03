(function () {
  if (typeof firebase === 'undefined') return;

  var cfg = window.FIREBASE_CONFIG || {
    apiKey: 'AIzaSyCgGL762gcglRpix4-akfP7NydFj5ChxfM',
    authDomain: 'frick-budget.firebaseapp.com',
    projectId: 'frick-budget',
    storageBucket: 'frick-budget.firebasestorage.app',
    messagingSenderId: '231130144804',
    appId: '1:231130144804:web:49ad446a858c585d2838b1',
    databaseURL: 'https://frick-budget-default-rtdb.europe-west1.firebasedatabase.app'
  };

  try {
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);
  } catch (e) {}
  if (!firebase.auth) return;

  var auth = firebase.auth();
  var lowerPath = window.location.pathname.toLowerCase();
  var isLoginPage = lowerPath.endsWith('/budget/login.html') || lowerPath.endsWith('/login.html');
  var isExercisePage = lowerPath.endsWith('/budget/exercise.html') || lowerPath.endsWith('/exercise.html');
  var isHomePage = lowerPath.endsWith('/budget/home.html') || lowerPath.endsWith('/home.html');
  var isCalendarPage = lowerPath.endsWith('/budget/calendar.html') || lowerPath.endsWith('/calendar.html');
  var isShoppingPage = lowerPath.endsWith('/budget/shopping.html') || lowerPath.endsWith('/shopping.html');

  var financeHubPages = ['budget.html','budget_maja.html','analytics.html','analytics_maja.html','familjebudget.html'];
  var isFinanceHubPage = financeHubPages.some(function (name) { return lowerPath.endsWith('/' + name); });

  function financeHubTarget() {
    var saved = '';
    try { saved = String(localStorage.getItem('finance-last-page-v1') || '').toLowerCase(); } catch (_) {}
    if (financeHubPages.indexOf(saved) !== -1) return saved;
    var remembered = 'markus';
    try { remembered = localStorage.getItem('budget-last-user-v1') === 'maja' ? 'maja' : 'markus'; } catch (_) {}
    return remembered === 'maja' ? 'budget_maja.html' : 'budget.html';
  }

  function normalizeFinanceNavigation() {
    var menu = document.getElementById('nav-menu');
    if (!menu) return;
    var links = Array.prototype.slice.call(menu.querySelectorAll('a[href]'));
    var financeLinks = links.filter(function (link) {
      var href = String(link.getAttribute('href') || '').split('#')[0].split('?')[0].toLowerCase();
      var name = href.split('/').pop();
      return financeHubPages.indexOf(name) !== -1;
    });
    var existing = menu.querySelector('a[data-finance-hub-link="true"]');
    var hub = existing || document.createElement('a');
    hub.setAttribute('data-finance-hub-link','true');
    hub.href = financeHubTarget();
    hub.innerHTML = '<span class="nav-icon">💰</span> Budget';
    hub.classList.toggle('active', isFinanceHubPage);
    hub.addEventListener('click', function () { hub.href = financeHubTarget(); });
    if (!existing && financeLinks.length) financeLinks[0].parentNode.insertBefore(hub, financeLinks[0]);
    financeLinks.forEach(function (link) { if (link !== hub) link.remove(); });
  }

  document.addEventListener('DOMContentLoaded', normalizeFinanceNavigation, {once:true});

  var exerciseAssetsVersion = '20260903-exercise-running-goals-v35';
  var homeAssetsVersion = '20260827-1230-shopping-groups-v1';
  var calendarAssetsVersion = '20260902-home-color-wheel-v5';
  var shoppingAssetsVersion = '20260828-1340-recipe-header-v10';

  if (isExercisePage && !document.getElementById('exercise-profile-critical-v12')) {
    var exerciseCritical = document.createElement('style');
    exerciseCritical.id = 'exercise-profile-critical-v12';
    exerciseCritical.textContent =
      'html,body{background:radial-gradient(900px 380px at 50% -110px,rgba(34,211,238,.105),transparent 67%),radial-gradient(620px 300px at 92% 42%,rgba(251,146,60,.025),transparent 72%),#0F1219!important}' +
      'body::before{content:""!important;display:block!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:0!important;background:linear-gradient(180deg,rgba(255,255,255,.008),transparent 28%)!important}' +
      '.app-wrap{position:relative!important;z-index:1!important}' +
      '.app-header{background:linear-gradient(180deg,rgba(13,17,23,.985),rgba(34,211,238,.055))!important;border-bottom:1px solid rgba(34,211,238,.20)!important;box-shadow:0 7px 26px rgba(0,0,0,.42),0 1px 24px rgba(34,211,238,.07)!important;backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important}' +
      '.stat-card,.goal-card,.chart-card{background:linear-gradient(180deg,rgba(255,255,255,.046),rgba(255,255,255,.024))!important;border-color:rgba(34,211,238,.105)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 10px 28px rgba(0,0,0,.18)!important}' +
      '.stat-card:hover,.goal-card:hover,.chart-card:hover{border-color:rgba(34,211,238,.20)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 12px 32px rgba(0,0,0,.24),0 0 22px rgba(34,211,238,.035)!important}' +
      '.week-day{background:linear-gradient(180deg,rgba(255,255,255,.038),rgba(255,255,255,.022))!important;border-color:rgba(255,255,255,.085)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.018)!important}' +
      '.week-day:hover:not(.today){background:rgba(34,211,238,.045)!important;border-color:rgba(34,211,238,.18)!important}' +
      '.week-day.today{background:linear-gradient(180deg,rgba(34,211,238,.13),rgba(34,211,238,.055))!important;border-color:rgba(34,211,238,.48)!important;box-shadow:inset 0 0 0 1px rgba(34,211,238,.045),0 0 20px rgba(34,211,238,.045)!important}' +
      '.section-hdr h2::before{opacity:1!important;box-shadow:0 0 10px rgba(34,211,238,.34)!important}' +
      '.nav-btn,.week-nav-btn,.btn-ghost{background:rgba(255,255,255,.045)!important;border-color:rgba(34,211,238,.14)!important}' +
      '.nav-btn:hover,.week-nav-btn:hover,.btn-ghost:hover{background:rgba(34,211,238,.08)!important;border-color:rgba(34,211,238,.26)!important}' +
      '.chart-card h3{color:#CFFAFE!important;text-shadow:0 2px 10px rgba(34,211,238,.08)!important}' +
      '.exercise-user-option[data-user="markus"].active{background:rgba(56,189,248,.14)!important;color:#38BDF8!important;box-shadow:inset 0 0 0 1px rgba(56,189,248,.42)!important}' +
      '.exercise-user-option[data-user="maja"].active{background:rgba(244,114,182,.15)!important;color:#F472B6!important;box-shadow:inset 0 0 0 1px rgba(244,114,182,.46)!important}';
    document.head.appendChild(exerciseCritical);
  }

  if (isHomePage && !document.getElementById('home-critical-prelayout-v9')) {
    var critical = document.createElement('style');
    critical.id = 'home-critical-prelayout-v9';
    critical.textContent = '\n' +
      '.app-header{justify-content:center!important;text-align:center!important;min-height:70px;position:sticky!important;}\n' +
      '.app-header .brand{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;margin:0!important;width:max-content!important;justify-content:center!important;min-width:0;max-width:calc(100% - 150px);z-index:1;}\n' +
      '.app-header .brand-text{position:relative;min-height:46px;min-width:0;text-align:center!important;}\n' +
      '.app-header .brand-text h1{font-size:22px!important;line-height:26px!important;letter-spacing:-.45px!important;white-space:nowrap!important;text-align:center!important;}\n' +
      '.app-header .brand-text p{position:static!important;margin-top:1px!important;font-size:13px!important;line-height:1.25!important;white-space:nowrap;text-align:center!important;}\n' +
      '.app-header .nav-dropdown-wrapper{z-index:3!important;}\n' +
      '.app-header>.month-nav{visibility:hidden!important;}\n' +
      '.main-layout{padding-top:.25rem!important;}\n' +
      '.cal-section{padding-top:40px!important;}\n' +
      '.calendar-toolbar-v2{position:absolute!important;top:0!important;left:0!important;right:24px!important;width:auto!important;min-height:34px!important;padding:0!important;margin:0!important;}\n' +
      '.calendar-toolbar-v2 .cal-week-number,.calendar-toolbar-v2 .calendar-week-number-v2{font-size:12px!important;letter-spacing:.6px!important;}\n' +
      '.calendar-toolbar-v2 .month-nav{visibility:visible!important;margin:0 0 0 auto!important;justify-content:flex-end!important;gap:5px!important;}\n' +
      '.calendar-toolbar-v2 .month-nav button{width:30px!important;height:30px!important;font-size:14px!important;}\n' +
      '.calendar-toolbar-v2 #month-label{font-size:12px!important;padding:0 6px!important;}\n' +
      '#trip-section{display:none!important;}\n' +
      '@media(max-width:768px){.app-header .brand{max-width:calc(100% - 130px)!important}.app-header .brand-text h1{font-size:20px!important;line-height:24px!important;letter-spacing:-.35px!important}.app-header .brand-text p{margin-top:1px!important;font-size:12.5px!important}.main-layout{padding-top:.15rem!important}.cal-section{padding-top:38px!important}.calendar-toolbar-v2{right:0!important;min-height:32px!important}.calendar-toolbar-v2 .cal-week-number,.calendar-toolbar-v2 .calendar-week-number-v2{font-size:11px!important}.calendar-toolbar-v2 .month-nav{gap:4px!important}.calendar-toolbar-v2 .month-nav button{width:29px!important;height:29px!important;font-size:14px!important}.calendar-toolbar-v2 #month-label{font-size:11.5px!important;padding:0 4px!important}}\n' +
      '@media(max-width:390px){.app-header .brand{max-width:calc(100% - 112px)!important}.app-header .brand-text h1{font-size:18px!important}.app-header .brand-text p{font-size:12px!important}}';
    document.head.appendChild(critical);
  }

  function loadScriptOnce(src, attr, done) {
    if (document.querySelector('script[' + attr + ']')) {
      if (done) done();
      return;
    }
    var s = document.createElement('script');
    s.src = src + '?v=' + exerciseAssetsVersion;
    s.async = false;
    s.setAttribute(attr, 'true');
    if (done) s.addEventListener('load', done, { once:true });
    document.head.appendChild(s);
  }

  function loadCalendarScript(src, attr, done) {
    if (document.querySelector('script[' + attr + ']')) {
      if (done) done();
      return;
    }
    var s = document.createElement('script');
    s.src = src + '?v=' + calendarAssetsVersion;
    s.async = false;
    s.setAttribute(attr, 'true');
    if (done) s.addEventListener('load', done, { once:true });
    document.head.appendChild(s);
  }

  function loadShoppingScript(src, attr, done) {
    if (document.querySelector('script[' + attr + ']')) {
      if (done) done();
      return;
    }
    var s = document.createElement('script');
    s.src = src + '?v=' + shoppingAssetsVersion;
    s.async = false;
    s.setAttribute(attr, 'true');
    if (done) s.addEventListener('load', done, { once:true });
    document.head.appendChild(s);
  }

  if (isExercisePage) {
    /* One ordered exercise stack: runtime first, feature layers next and one
       final morph/stability authority last. Obsolete inline-log patch is gone. */
    var exerciseScripts = [
      ['exercise-points-8-9.js', 'data-exercise-points-8-9'],
      ['exercise-heart-rate-range.js', 'data-exercise-heart-rate-range'],
      ['exercise-session-enhancements.js', 'data-exercise-session-enhancements'],
      ['exercise-session-runtime-core-v21.js', 'data-exercise-session-runtime-core-v21'],
      ['exercise-session-progress.js', 'data-exercise-session-progress'],
      ['exercise-session-theme-stability.js', 'data-exercise-session-theme-stability'],
      ['exercise-session-stable-details.js', 'data-exercise-session-stable-details'],
      ['exercise-reload-recovery.js', 'data-exercise-reload-recovery'],
      ['exercise-points-3-6-7.js', 'data-exercise-points-3-6-7'],
      ['exercise-between-routing-v7.js', 'data-exercise-between-routing-v7'],
      ['exercise-between-custom-exercise-v3.js', 'data-exercise-between-custom-exercise-v3'],
      ['exercise-between-sets.js', 'data-exercise-between-sets-v2'],
      ['exercise-hype-polish.js', 'data-exercise-hype-polish-passive'],
      ['exercise-flow-polish-v2.js', 'data-exercise-flow-polish-v2'],
      ['exercise-builder-row-tools-v3.js', 'data-exercise-builder-row-tools-v3'],
      ['exercise-builder-style-v5.js', 'data-exercise-builder-style-v5'],
      ['exercise-log-mobile-fix-v5.js', 'data-exercise-log-mobile-fix-v5'],
      ['exercise-session-set-cards-v6.js', 'data-exercise-session-set-cards-v6'],
      ['exercise-builder-between-preview-v7.js', 'data-exercise-builder-between-preview-v7'],
      ['exercise-session-shell-v19.js', 'data-exercise-session-shell-v19'],
      ['exercise-session-ux-v20.js', 'data-exercise-session-ux-v20'],
      ['exercise-motion-v1.js', 'data-exercise-motion-v1']
    ];

    (function loadExerciseAt(index) {
      if (index >= exerciseScripts.length) return;
      var item = exerciseScripts[index];
      loadScriptOnce(item[0], item[1], function () { loadExerciseAt(index + 1); });
    })(0);
  }

  if (isHomePage && !document.querySelector('script[data-home-shopping-groups-v1]')) {
    var homeScript = document.createElement('script');
    homeScript.src = 'home-shopping-groups-v1.js?v=' + homeAssetsVersion;
    homeScript.async = false;
    homeScript.setAttribute('data-home-shopping-groups-v1', 'true');
    document.head.appendChild(homeScript);
  }

  if (isShoppingPage) {
    loadShoppingScript('shopping-list-stability-v8.js', 'data-shopping-list-stability-v8', function () {
      loadShoppingScript('shopping-list-engine-v7.js', 'data-shopping-list-engine-v7', function () {
        loadShoppingScript('shopping-toolbar-v9.js', 'data-shopping-toolbar-v9', function () {
          loadShoppingScript('shopping-recipes-v4.js', 'data-shopping-recipes-v4');
        });
      });
    });
  }

  if (isHomePage || isCalendarPage) {
    loadCalendarScript('calendar-ui-v2.js', 'data-calendar-ui-v2', function () {
      loadCalendarScript('calendar-picker-fix-v3.js', 'data-calendar-picker-fix-v3', function () {
        loadCalendarScript('calendar-followups-v4.js', 'data-calendar-followups-v4', function () {
          loadCalendarScript('calendar-notification-enhancements-v1.js', 'data-calendar-notification-enhancements-v1', function () {
            if (isHomePage) loadCalendarScript('home-calendar-polish-v5.js', 'data-home-calendar-polish-v5');
          });
        });
      });
    });
  }

  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function () {});

  function nextTarget() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get('next');
    return next && next.trim() ? next : 'home.html';
  }

  function goToNext() {
    window.location.replace(nextTarget());
  }

  function showMessage(msg, isError) {
    var el = document.getElementById('login-message');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#F87171' : '#34D399';
  }

  function wireLoginUi() {
    if (window.__budgetLoginBound) return;
    window.__budgetLoginBound = true;

    var form = document.getElementById('login-form');
    var emailEl = document.getElementById('login-email');
    var passEl = document.getElementById('login-password');
    var createBtn = document.getElementById('create-account-btn');
    if (!form || !emailEl || !passEl) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = (emailEl.value || '').trim();
      var password = passEl.value || '';
      if (!email || !password) {
        showMessage('Fyll i e-post och lösenord.', true);
        return;
      }
      auth.signInWithEmailAndPassword(email, password)
        .then(function () { showMessage('Inloggad. Omdirigerar...', false); goToNext(); })
        .catch(function (error) { showMessage(error && error.message ? error.message : 'Kunde inte logga in.', true); });
    });

    if (createBtn) {
      createBtn.addEventListener('click', function () {
        var email = (emailEl.value || '').trim();
        var password = passEl.value || '';
        if (!email || !password) {
          showMessage('Fyll i e-post och lösenord först.', true);
          return;
        }
        auth.createUserWithEmailAndPassword(email, password)
          .then(function () { showMessage('Konto skapat och inloggad.', false); goToNext(); })
          .catch(function (error) { showMessage(error && error.message ? error.message : 'Kunde inte skapa konto.', true); });
      });
    }
  }

  auth.onAuthStateChanged(function (user) {
    if (isLoginPage) {
      if (user) { goToNext(); return; }
      wireLoginUi();
      return;
    }
    if (!user) {
      var current = window.location.pathname.split('/').pop() + window.location.search + window.location.hash;
      window.location.replace('login.html?next=' + encodeURIComponent(current));
    }
  });
})();