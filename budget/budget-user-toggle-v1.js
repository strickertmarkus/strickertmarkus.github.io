(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isMarkus = path.endsWith('/budget/budget.html') || path.endsWith('/budget.html');
  var isMaja = path.endsWith('/budget/budget_maja.html') || path.endsWith('/budget_maja.html');
  var isBudgetPage = isMarkus || isMaja;
  var transitionKey = 'budget-user-transition-v1';
  var lastUserKey = 'budget-last-user-v1';
  var rememberedUser = 'markus';

  function storedDarkMode() {
    try {
      var value = String(localStorage.getItem('darkMode') || '').toLowerCase();
      return value === 'true' || value === '1' || value === 'dark';
    } catch (_) {
      return false;
    }
  }

  var transitionBackground = storedDarkMode() ? '#0F1219' : '#F0F2F5';

  /* This script is loaded from <head>. Paint the correct budget canvas before
     body/CSS exist so a cross-document navigation never exposes the browser's
     default white background. The class is removed after the final page frame. */
  if (isBudgetPage) {
    document.documentElement.classList.add('budget-transition-root-v3');
    document.documentElement.style.backgroundColor = transitionBackground;
    document.documentElement.style.colorScheme = storedDarkMode() ? 'dark' : 'light';

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
        at:Date.now(),
        background:transitionBackground
      }));
    } catch (_) {}

    /* No outgoing fade to a blank canvas. Keep the current themed frame visible
       right up to navigation; the incoming document paints the same canvas color
       from <head>, then reveals its final content. */
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

  function finishArrival() {
    if (!isBudgetPage) return;
    var switched = false;
    try {
      var raw = sessionStorage.getItem(transitionKey);
      var data = raw ? JSON.parse(raw) : null;
      switched = !!(data && data.target === currentUser && Date.now() - Number(data.at || 0) < 5000);
      if (data && data.background) {
        transitionBackground = data.background;
        document.documentElement.style.backgroundColor = transitionBackground;
        if (document.body) document.body.style.backgroundColor = transitionBackground;
      }
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
          document.documentElement.style.colorScheme = '';
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
    }
    cleanBudgetMenu();
    finishArrival();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();