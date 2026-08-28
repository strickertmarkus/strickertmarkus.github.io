(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isMarkus = path.endsWith('/budget/budget.html') || path.endsWith('/budget.html');
  var isMaja = path.endsWith('/budget/budget_maja.html') || path.endsWith('/budget_maja.html');
  var isBudgetPage = isMarkus || isMaja;
  var transitionKey = 'budget-user-transition-v1';
  var lastUserKey = 'budget-last-user-v1';
  var rememberedUser = 'markus';
  var transitionBackground = '#0F1219';

  /* Mirror the Exercise first-paint pattern: keep the destination page hidden
     while its final controls and charts are prepared, then reveal everything on
     one frame and start the Chart.js entrance animations together. */
  if (isBudgetPage) {
    document.documentElement.classList.add('budget-transition-root-v4', 'budget-profile-booting-v2');
    document.documentElement.style.backgroundColor = transitionBackground;
    document.documentElement.style.colorScheme = 'dark';

    if (!document.getElementById('budget-profile-first-paint-v2-style')) {
      var rootStyle = document.createElement('style');
      rootStyle.id = 'budget-profile-first-paint-v2-style';
      rootStyle.textContent =
        'html.budget-transition-root-v4,html.budget-transition-root-v4 body{background:' + transitionBackground + '!important}' +
        'html.budget-transition-root-v4 body{min-height:100vh}' +
        'html.budget-profile-booting-v2 body .header>*,html.budget-profile-booting-v2 body .container{visibility:hidden!important}' +
        'html.budget-profile-ready-v2 body .header>*,html.budget-profile-ready-v2 body .container{animation:budgetProfileRevealV2 .34s cubic-bezier(.16,1,.3,1) both}' +
        '@keyframes budgetProfileRevealV2{from{opacity:.12;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}' +
        '@media(prefers-reduced-motion:reduce){html.budget-profile-ready-v2 body .header>*,html.budget-profile-ready-v2 body .container{animation:none!important}}';
      document.head.appendChild(rootStyle);
    }
  }

  try {
    var savedUser = localStorage.getItem(lastUserKey);
    if (savedUser === 'maja' || savedUser === 'markus') rememberedUser = savedUser;
  } catch (_) {}
  var currentUser = isMaja ? 'maja' : (isMarkus ? 'markus' : rememberedUser);

  function addStyles() {
    if (!isBudgetPage || document.getElementById('budget-user-toggle-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'budget-user-toggle-v1-style';
    style.textContent = `
      .budget-user-toggle-v1 {
        width:max-content;
        max-width:calc(100% - 130px);
        margin:11px auto 0;
        display:flex;
        align-items:center;
        gap:2px;
        padding:3px;
        border:1px solid rgba(255,255,255,.22);
        border-radius:11px;
        background:rgba(255,255,255,.08);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.055);
        backdrop-filter:blur(8px);
        -webkit-backdrop-filter:blur(8px);
      }
      .budget-user-option-v1 {
        appearance:none;
        border:0;
        outline:0;
        min-width:66px;
        padding:7px 11px;
        border-radius:8px;
        background:transparent;
        color:#94A3B8;
        font:700 12px/1.1 'Inter',sans-serif;
        cursor:pointer;
        transition:background .15s ease,color .15s ease;
        -webkit-tap-highlight-color:transparent;
      }
      .budget-user-option-v1:hover { color:#E2E8F0; }
      .budget-user-option-v1[data-user="markus"].active {
        color:#60A5FA;
        background:rgba(59,130,246,.16);
        box-shadow:inset 0 0 0 1px rgba(96,165,250,.48),0 2px 10px rgba(59,130,246,.08);
      }
      .budget-user-option-v1[data-user="maja"].active {
        color:#F472B6;
        background:rgba(244,114,182,.15);
        box-shadow:inset 0 0 0 1px rgba(244,114,182,.48),0 2px 10px rgba(244,114,182,.07);
      }
      @media(max-width:600px) {
        .budget-user-toggle-v1 {
          margin-top:8px;
          padding:2px;
          border-radius:10px;
          max-width:calc(100% - 100px);
        }
        .budget-user-option-v1 {
          min-width:58px;
          padding:6px 9px;
          font-size:11px;
        }
        .header #month-nav { margin-top:11px !important; }
      }
      @media(max-width:380px) {
        .budget-user-option-v1 { min-width:54px; padding-left:7px; padding-right:7px; font-size:10.5px; }
      }
    `;
    document.head.appendChild(style);
  }

  function targetFor(user) {
    return user === 'maja' ? 'budget_maja.html' : 'budget.html';
  }

  function rememberUser(user) {
    if (user !== 'markus' && user !== 'maja') return;
    try { localStorage.setItem(lastUserKey,user); } catch (_) {}
  }

  function flushCurrentEdit() {
    try {
      var active = document.activeElement;
      if (active && active !== document.body && typeof active.blur === 'function') active.blur();
    } catch (_) {}
    try {
      if (typeof window.saveLocal === 'function') window.saveLocal();
    } catch (_) {}
  }

  function primeTargetPage() {
    if (!isBudgetPage) return;
    var otherUser = currentUser === 'markus' ? 'maja' : 'markus';
    var href = targetFor(otherUser);
    if (!document.querySelector('link[data-budget-profile-prefetch="' + otherUser + '"]')) {
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.setAttribute('data-budget-profile-prefetch',otherUser);
      document.head.appendChild(link);
    }
  }

  function lockTransitionCanvas() {
    document.documentElement.classList.add('budget-transition-root-v4');
    document.documentElement.style.backgroundColor = transitionBackground;
    document.documentElement.style.colorScheme = 'dark';
    if (document.body) {
      document.body.style.backgroundColor = transitionBackground;
      document.body.style.minHeight = '100vh';
    }
  }

  function startSwitch(user) {
    if (!isBudgetPage || user === currentUser || (user !== 'markus' && user !== 'maja')) return;
    flushCurrentEdit();
    rememberUser(user);
    lockTransitionCanvas();

    try {
      sessionStorage.setItem(transitionKey, JSON.stringify({ target:user, at:Date.now() }));
    } catch (_) {}

    /* Exercise uses an immediate document navigation. Do the same here; no
       outgoing fade or pre-emptive active-state swap on the old page. */
    window.location.href = targetFor(user);
  }

  function ensureToggle() {
    if (!isBudgetPage) return null;
    var existing = document.getElementById('budget-user-toggle-v1');
    if (existing) return existing;
    var header = document.querySelector('.header');
    var sub = header && header.querySelector('p');
    if (!header || !sub) return null;

    var toggle = document.createElement('div');
    toggle.id = 'budget-user-toggle-v1';
    toggle.className = 'budget-user-toggle-v1';
    toggle.setAttribute('role','group');
    toggle.setAttribute('aria-label','Välj budgetprofil');
    toggle.innerHTML =
      '<button type="button" class="budget-user-option-v1' + (currentUser === 'markus' ? ' active' : '') + '" data-user="markus" aria-pressed="' + (currentUser === 'markus' ? 'true' : 'false') + '">Markus</button>' +
      '<button type="button" class="budget-user-option-v1' + (currentUser === 'maja' ? ' active' : '') + '" data-user="maja" aria-pressed="' + (currentUser === 'maja' ? 'true' : 'false') + '">Maja</button>';
    toggle.addEventListener('click',function (event) {
      var button = event.target && event.target.closest ? event.target.closest('[data-user]') : null;
      if (!button || button.dataset.user === currentUser) return;
      startSwitch(button.dataset.user);
    });
    sub.insertAdjacentElement('afterend',toggle);
    return toggle;
  }

  function cleanBudgetMenu() {
    var menu = document.getElementById('nav-menu');
    if (!menu || menu.querySelector('[data-budget-menu-v1]')) return;

    var markus = menu.querySelector('a[href="budget.html"]');
    var maja = menu.querySelector('a[href="budget_maja.html"]');
    var reference = markus || maja;
    if (!reference || !reference.parentNode) return;

    var link = document.createElement('a');
    link.href = targetFor(currentUser);
    if (isBudgetPage) link.className = 'active';
    link.setAttribute('data-budget-menu-v1','true');
    link.innerHTML = '<span class="nav-icon">💰</span> Budget';
    reference.parentNode.insertBefore(link,reference);
    if (markus) markus.remove();
    if (maja) maja.remove();
  }

  function speedUpInitialCharts() {
    if (!isBudgetPage || window.__budgetChartsFastBootV2) return;
    if (typeof window.initCharts !== 'function') return;

    window.__budgetChartsFastBootV2 = true;
    var originalInitCharts = window.initCharts;
    var guardUntil = Date.now() + 750;

    /* The page still contains a legacy 500 ms chart-start timer. Create the
       charts immediately instead. If that legacy timer later fires during this
       short guard, only refresh the existing charts instead of rebuilding them. */
    window.initCharts = function () {
      if (Date.now() < guardUntil) {
        try {
          if (typeof window.updateCharts === 'function') window.updateCharts();
        } catch (_) {}
        return;
      }
      window.initCharts = originalInitCharts;
      return originalInitCharts.apply(this,arguments);
    };

    requestAnimationFrame(function () {
      try {
        originalInitCharts();
        if (typeof window.updateCharts === 'function') window.updateCharts();
        window.__budgetChartsPreparedAtV2 = Date.now();
      } catch (_) {}
    });

    setTimeout(function () {
      if (window.initCharts !== originalInitCharts && Date.now() >= guardUntil) {
        window.initCharts = originalInitCharts;
      }
    },770);
  }

  function chartFor(id) {
    var canvas = document.getElementById(id);
    if (!canvas || !window.Chart || typeof window.Chart.getChart !== 'function') return null;
    return window.Chart.getChart(canvas) || window.Chart.getChart(id) || null;
  }

  function finalCharts() {
    var pie = chartFor('pieChart');
    var bar = chartFor('barChart');
    if (!pie || !bar) return null;
    if (!pie.data || !pie.data.datasets || !pie.data.datasets[0]) return null;
    if (!bar.data || !bar.data.datasets || !bar.data.datasets.length) return null;
    return [pie, bar];
  }

  function clearTransitionCanvas() {
    document.documentElement.classList.remove('budget-transition-root-v4');
    document.documentElement.style.backgroundColor = '';
    if (document.body) {
      document.body.style.backgroundColor = '';
      document.body.style.minHeight = '';
    }
  }

  function watchFirstPaint() {
    if (!isBudgetPage || window.__budgetFirstPaintWatchV2) return;
    window.__budgetFirstPaintWatchV2 = true;

    var started = Date.now();
    var timer = null;

    function revealTogether(charts) {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }

      /* Same sequence as Exercise: put every final chart at its native animation
         start state while hidden, reveal the UI on one frame, then start all
         Chart.js entrance animations together. */
      charts.forEach(function (chart) {
        try { if (typeof chart.stop === 'function') chart.stop(); } catch (_) {}
        try { if (typeof chart.reset === 'function') chart.reset(); } catch (_) {}
      });

      requestAnimationFrame(function () {
        document.documentElement.classList.remove('budget-profile-booting-v2', 'budget-toggle-booting-v1');
        document.documentElement.classList.add('budget-profile-ready-v2');
        clearTransitionCanvas();

        charts.forEach(function (chart) {
          try { if (typeof chart.update === 'function') chart.update(); } catch (_) {}
        });

        setTimeout(function () {
          document.documentElement.classList.remove('budget-profile-ready-v2');
        },380);
      });
    }

    function fallbackReveal() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      document.documentElement.classList.remove('budget-profile-booting-v2', 'budget-toggle-booting-v1');
      document.documentElement.classList.add('budget-profile-ready-v2');
      clearTransitionCanvas();
      setTimeout(function () {
        document.documentElement.classList.remove('budget-profile-ready-v2');
      },380);
    }

    function check() {
      var charts = finalCharts();
      var preparedAt = Number(window.__budgetChartsPreparedAtV2 || 0);

      /* initCharts has an old internal 50 ms data-animation timer. Keep the page
         hidden until that has had time to settle, then reset once and reveal the
         final charts exactly like the Exercise chart gate. */
      if (charts && preparedAt && Date.now() - preparedAt >= 70) {
        revealTogether(charts);
        return;
      }

      if (Date.now() - started > 2500) fallbackReveal();
    }

    timer = setInterval(check,16);
    check();
  }

  function consumeTransitionMarker() {
    try { sessionStorage.removeItem(transitionKey); } catch (_) {}
  }

  function install() {
    if (isBudgetPage) {
      rememberUser(currentUser);
      addStyles();
      ensureToggle();
      primeTargetPage();
      speedUpInitialCharts();
      watchFirstPaint();
      consumeTransitionMarker();
    }
    cleanBudgetMenu();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();