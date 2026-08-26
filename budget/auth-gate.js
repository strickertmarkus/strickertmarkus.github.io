(function () {
  if (typeof firebase === "undefined") {
    return;
  }

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
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(cfg);
    }
  } catch (e) {
    // Firebase may already be initialized on this page.
  }

  if (!firebase.auth) {
    return;
  }

  var auth = firebase.auth();
  var lowerPath = window.location.pathname.toLowerCase();
  var isLoginPage = lowerPath.endsWith("/budget/login.html") || lowerPath.endsWith("/login.html");
  var isExercisePage = lowerPath.endsWith("/budget/exercise.html") || lowerPath.endsWith("/exercise.html");

  if (isExercisePage && !document.querySelector('script[data-exercise-session-enhancements]')) {
    var sessionEnhancements = document.createElement('script');
    sessionEnhancements.src = 'exercise-session-enhancements.js';
    sessionEnhancements.async = false;
    sessionEnhancements.dataset.exerciseSessionEnhancements = 'true';
    sessionEnhancements.addEventListener('load', function () {
      if (document.querySelector('script[data-exercise-session-focus]')) return;
      var sessionFocus = document.createElement('script');
      sessionFocus.src = 'exercise-session-focus.js';
      sessionFocus.async = false;
      sessionFocus.dataset.exerciseSessionFocus = 'true';
      document.head.appendChild(sessionFocus);
    }, { once: true });
    document.head.appendChild(sessionEnhancements);
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
        .then(function () {
          showMessage("Inloggad. Omdirigerar...", false);
          goToNext();
        })
        .catch(function (error) {
          showMessage(error && error.message ? error.message : "Kunde inte logga in.", true);
        });
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
          .then(function () {
            showMessage("Konto skapat och inloggad.", false);
            goToNext();
          })
          .catch(function (error) {
            showMessage(error && error.message ? error.message : "Kunde inte skapa konto.", true);
          });
      });
    }
  }

  auth.onAuthStateChanged(function (user) {
    if (isLoginPage) {
      if (user) {
        goToNext();
        return;
      }
      wireLoginUi();
      return;
    }

    if (!user) {
      var current = window.location.pathname.split("/").pop() + window.location.search + window.location.hash;
      window.location.replace("login.html?next=" + encodeURIComponent(current));
    }
  });
})();
