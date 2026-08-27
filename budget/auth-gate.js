(function () {
  if (typeof firebase === "undefined") return;

  var cfg = window.FIREBASE_CONFIG || {
    apiKey: "AIzaSyCgGL762gcglRpix4-akfP7NydFj5ChxfM",
    authDomain: "frick-budget.firebaseapp.com",
    projectId: "frick-budget",
    storageBucket: "frick-budget.firebasestorage.app",
    messagingSenderId: "231130144804",
    appId: "1:231130144804:web:49ad446a858c585d2838b1",
    databaseURL: "https://frick-budget-default-rtdb.europe-west1.firebasedatabase.app"
  };

  try {
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);
  } catch (e) {}

  if (!firebase.auth) return;

  var auth = firebase.auth();
  var lowerPath = window.location.pathname.toLowerCase();
  var isLoginPage = lowerPath.endsWith("/budget/login.html") || lowerPath.endsWith("/login.html");
  var isExercisePage = lowerPath.endsWith("/budget/exercise.html") || lowerPath.endsWith("/exercise.html");
  var isHomePage = lowerPath.endsWith("/budget/home.html") || lowerPath.endsWith("/home.html");
  var exerciseAssetsVersion = '20260827-1112-session-set-cards-v6';
  var homeAssetsVersion = '20260827-1230-shopping-groups-v1';

  function loadScriptOnce(src, attr, done) {
    if (document.querySelector('script[' + attr + ']')) {
      if (done) done();
      return;
    }
    var s = document.createElement('script');
    s.src = src + '?v=' + exerciseAssetsVersion;
    s.async = false;
    s.setAttribute(attr, 'true');
    if (done) s.addEventListener('load', done, { once: true });
    document.head.appendChild(s);
  }

  if (isExercisePage) {
    loadScriptOnce('exercise-session-enhancements.js', 'data-exercise-session-enhancements', function () {
      loadScriptOnce('exercise-session-focus.js', 'data-exercise-session-focus', function () {
        loadScriptOnce('exercise-session-progress.js', 'data-exercise-session-progress', function () {
          loadScriptOnce('exercise-session-persistent-hype.js', 'data-exercise-session-persistent-hype', function () {
            loadScriptOnce('exercise-session-theme-stability.js', 'data-exercise-session-theme-stability', function () {
              loadScriptOnce('exercise-session-stable-details.js', 'data-exercise-session-stable-details', function () {
                loadScriptOnce('exercise-session-mobile-repaint-fix.js', 'data-exercise-session-mobile-repaint-fix', function () {
                  loadScriptOnce('exercise-reload-recovery.js', 'data-exercise-reload-recovery', function () {
                    loadScriptOnce('exercise-points-3-6-7.js', 'data-exercise-points-3-6-7', function () {
                      loadScriptOnce('exercise-mobile-week-toolbar-fix.js', 'data-exercise-mobile-week-toolbar-fix', function () {
                        loadScriptOnce('exercise-between-sets.js', 'data-exercise-between-sets-v2', function () {
                          loadScriptOnce('exercise-hype-polish.js', 'data-exercise-hype-polish-passive', function () {
                            loadScriptOnce('exercise-points-8-9.js', 'data-exercise-points-8-9', function () {
                              loadScriptOnce('exercise-flow-polish-v2.js', 'data-exercise-flow-polish-v2', function () {
                                loadScriptOnce('exercise-builder-row-tools-v3.js', 'data-exercise-builder-row-tools-v3', function () {
                                  loadScriptOnce('exercise-builder-style-v5.js', 'data-exercise-builder-style-v5', function () {
                                    loadScriptOnce('exercise-heart-rate-range.js', 'data-exercise-heart-rate-range', function () {
                                      loadScriptOnce('exercise-pretimer-visibility-fix.js', 'data-exercise-pretimer-visibility-fix', function () {
                                        loadScriptOnce('exercise-log-details-v4.js', 'data-exercise-log-details-v4', function () {
                                          loadScriptOnce('exercise-log-mobile-fix-v5.js', 'data-exercise-log-mobile-fix-v5', function () {
                                            loadScriptOnce('exercise-session-set-cards-v6.js', 'data-exercise-session-set-cards-v6');
                                          });
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  if (isHomePage && !document.querySelector('script[data-home-shopping-groups-v1]')) {
    var homeScript = document.createElement('script');
    homeScript.src = 'home-shopping-groups-v1.js?v=' + homeAssetsVersion;
    homeScript.async = false;
    homeScript.setAttribute('data-home-shopping-groups-v1', 'true');
    document.head.appendChild(homeScript);
  }

  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function () {});

  function nextTarget() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get("next");
    return next && next.trim() ? next : "home.html";
  }

  function goToNext() {
    window.location.replace(nextTarget());
  }

  function showMessage(msg, isError) {
    var el = document.getElementById("login-message");
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? "#F87171" : "#34D399";
  }

  function wireLoginUi() {
    if (window.__budgetLoginBound) return;
    window.__budgetLoginBound = true;

    var form = document.getElementById("login-form");
    var emailEl = document.getElementById("login-email");
    var passEl = document.getElementById("login-password");
    var createBtn = document.getElementById("create-account-btn");
    if (!form || !emailEl || !passEl) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = (emailEl.value || "").trim();
      var password = passEl.value || "";
      if (!email || !password) {
        showMessage("Fyll i e-post och lösenord.", true);
        return;
      }
      auth.signInWithEmailAndPassword(email, password)
        .then(function () { showMessage("Inloggad. Omdirigerar...", false); goToNext(); })
        .catch(function (error) { showMessage(error && error.message ? error.message : "Kunde inte logga in.", true); });
    });

    if (createBtn) {
      createBtn.addEventListener("click", function () {
        var email = (emailEl.value || "").trim();
        var password = passEl.value || "";
        if (!email || !password) {
          showMessage("Fyll i e-post och lösenord först.", true);
          return;
        }
        auth.createUserWithEmailAndPassword(email, password)
          .then(function () { showMessage("Konto skapat och inloggad.", false); goToNext(); })
          .catch(function (error) { showMessage(error && error.message ? error.message : "Kunde inte skapa konto.", true); });
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
      var current = window.location.pathname.split("/").pop() + window.location.search + window.location.hash;
      window.location.replace("login.html?next=" + encodeURIComponent(current));
    }
  });
})();
