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

  /* Budget pages are dark-only. Paint the dark canvas before body/CSS exist so
     cross-document profile navigation never exposes the browser default. */
  if (isBudgetPage) {
    document.documentElement.classList.add('budget-transition-root-v3');
    document.documentElement.style.backgroundColor = transitionBackground;
    document.documentElement.style.colorScheme = 'dark';

    if (!document.getElementById('budget-transition-root-v3-style')) {
      var rootStyle = document.createElement('style');
      rootStyle.id = 'budget-transition-root-v3-style';
      rootStyle.textContent =
        'html.budget-transition-root-v3,html.budget-transition-root-v3 body{background:' + transitionBackground + '!important}' +
        'html.budget-transition-root-v3 body{min-height:100vh}' +
        'html.budget-transition-arriving-v3 body{animation:none!important}';
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
        transition:background .13s ease,color .13s ease,box-shadow .13s ease,transform .09s ease;
        -webkit-tap-highlight-color:transparent;
      }
      .budget-user-option-v1:hover { color:#E2E8F0; }
      .budget-user-option-v1:active { transform:scale(.98); }
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
      html.budget-user-arrived-v1 body .header > h1,
      html.budget-user-arrived-v1 body .header > p,
      html.budget-user-arrived-v1 body .header > #budget-user-toggle-v1,
      html.budget-user-arrived-v1 body .header > #month-nav,
      html.budget-user-arrived-v1 body .container {
        animation:budgetUserArriveV3 .13s cubic-bezier(.16,1,.3,1) both;
      }
      @keyframes budgetUserArriveV3 {
        from { opacity:.45; transform:translateY(1px); }
        to { opacity:1; transform:translateY(0); }
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
      @media(prefers-reduced-motion:reduce) {
        html.budget-user-arrived-v1 body .header > h1,
        html.budget-user-arrived-v1 body .header > p,
        html.budget-user-arrived-v1 body .header > #budget-user-toggle-v1,
        html.budget-user-arrived-v1 body .header > #month-nav,
        html.budget-user-arrived-v1 body .container { animation:none !important; }
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

  function updateToggleVisual(user) {
    document.querySelectorAll('#budget-user-toggle-v1 [data-user]').forEach(function (button) {
      var active = button.dataset.user === user;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',active ? 'true' : 'false');
      button.disabled = true;
    });
  }

  function lockTransitionCanvas() {
    document.documentElement.classList.add('budget-transition-root-v3');
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
    updateToggleVisual(user);
    lockTransitionCanvas();

    try {
      sessionStorage.setItem(transitionKey, JSON.stringify({
        target:user,
        at:Date.now()
      }));
    } catch (_) {}

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
      if (!button || button.disabled) return;
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
    if (!isBudgetPage || window.__budgetChartsFastBootV1) return;
    if (typeof window.initCharts !== 'function') return;

    window.__budgetChartsFastBootV1 = true;
    var originalInitCharts = window.initCharts;
    var guardUntil = Date.now() + 700;

    /* budget.html / budget_maja.html still have a legacy 500 ms chart startup
       timer. Render on the next frame instead, then make the already-created
       charts jump to their real data immediately. During the short guard window
       the legacy timer is reduced to a cheap data refresh instead of destroying
       and recreating both charts. */
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
      } catch (_) {}
    });

    setTimeout(function () {
      if (window.initCharts !== originalInitCharts && Date.now() >= guardUntil) {
        window.initCharts = originalInitCharts;
      }
    },720);
  }

  function finishArrival() {
    if (!isBudgetPage) return;
    var switched = false;
    try {
      var raw = sessionStorage.getItem(transitionKey);
      var data = raw ? JSON.parse(raw) : null;
      switched = !!(data && data.target === currentUser && Date.now() - Number(data.at || 0) < 5000);
      sessionStorage.removeItem(transitionKey);
    } catch (_) {}

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.remove('budget-toggle-booting-v1');
        if (switched) {
          document.documentElement.classList.add('budget-user-arrived-v1');
          setTimeout(function () { document.documentElement.classList.remove('budget-user-arrived-v1'); },150);
        }
        setTimeout(function () {
          document.documentElement.classList.remove('budget-transition-root-v3');
          document.documentElement.style.backgroundColor = '';
          if (document.body) {
            document.body.style.backgroundColor = '';
            document.body.style.minHeight = '';
          }
        },switched ? 150 : 0);
      });
    });
  }

  function install() {
    if (isBudgetPage) {
      rememberUser(currentUser);
      addStyles();
      ensureToggle();
      primeTargetPage();
      speedUpInitialCharts();
    }
    cleanBudgetMenu();
    finishArrival();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();