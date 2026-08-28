(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isMarkus = path.endsWith('/budget/budget.html') || path.endsWith('/budget.html');
  var isMaja = path.endsWith('/budget/budget_maja.html') || path.endsWith('/budget_maja.html');
  var isBudgetPage = isMarkus || isMaja;
  var transitionKey = 'budget-user-transition-v1';
  var lastUserKey = 'budget-last-user-v1';
  var rememberedUser = 'markus';
  var currentUser;
  var switching = false;
  var headerInstalled = false;

  try {
    var savedUser = localStorage.getItem(lastUserKey);
    if (savedUser === 'maja' || savedUser === 'markus') rememberedUser = savedUser;
  } catch (_) {}

  currentUser = isMaja ? 'maja' : (isMarkus ? 'markus' : rememberedUser);

  function addStyles() {
    if (!isBudgetPage || document.getElementById('budget-user-toggle-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'budget-user-toggle-v1-style';
    style.textContent = `
      html.dark-mode .header,
      .header {
        background:rgba(11,15,26,.96) !important;
        border-bottom:1px solid rgba(255,255,255,.08) !important;
        box-shadow:0 4px 22px rgba(0,0,0,.28) !important;
        padding:12px 16px !important;
        min-height:0 !important;
        display:flex !important;
        flex-wrap:wrap !important;
        align-items:center !important;
        justify-content:flex-start !important;
        gap:9px !important;
        text-align:left !important;
        position:sticky !important;
        top:0 !important;
        z-index:100 !important;
        backdrop-filter:blur(18px);
        -webkit-backdrop-filter:blur(18px);
      }
      .budget-brand-v3 {
        flex:1 1 auto;
        min-width:72px;
        display:flex;
        flex-direction:column;
        justify-content:center;
        gap:1px;
        order:1;
      }
      .header .budget-brand-v3 h1 {
        margin:0 !important;
        font-size:16px !important;
        line-height:1.12 !important;
        font-weight:750 !important;
        letter-spacing:-.3px !important;
        color:#F0F6FC !important;
        text-transform:none !important;
      }
      .header .budget-brand-v3 p {
        margin:0 !important;
        font-size:11px !important;
        line-height:1.2 !important;
        font-weight:700 !important;
        letter-spacing:.05px !important;
        transition:color .18s ease,opacity .09s ease,transform .18s cubic-bezier(.16,1,.3,1) !important;
      }
      .header .budget-brand-v3 p[data-user="markus"] { color:#60A5FA !important; }
      .header .budget-brand-v3 p[data-user="maja"] { color:#F472B6 !important; }
      .header .budget-brand-v3 p.budget-profile-name-changing-v3 {
        animation:budgetProfileNameMorphV3 .18s cubic-bezier(.16,1,.3,1) both;
      }
      @keyframes budgetProfileNameMorphV3 {
        0% { opacity:1; transform:translateY(0); }
        45% { opacity:.25; transform:translateY(-2px); }
        55% { opacity:.25; transform:translateY(2px); }
        100% { opacity:1; transform:translateY(0); }
      }

      .budget-user-toggle-v1 {
        width:116px;
        height:32px;
        display:grid;
        grid-template-columns:1fr 1fr;
        align-items:center;
        padding:3px;
        position:relative;
        isolation:isolate;
        flex:0 0 116px;
        order:2;
        border:1px solid rgba(255,255,255,.08);
        border-radius:10px;
        background:rgba(255,255,255,.035);
        overflow:hidden;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
      }
      .budget-user-thumb-v3 {
        position:absolute;
        z-index:-1;
        top:3px;
        bottom:3px;
        left:3px;
        width:calc(50% - 3px);
        border-radius:7px;
        transform:translateX(0);
        background:rgba(59,130,246,.15);
        box-shadow:inset 0 0 0 1px rgba(96,165,250,.40);
        transition:transform .18s cubic-bezier(.16,1,.3,1),background .18s ease,box-shadow .18s ease;
      }
      .budget-user-toggle-v1[data-user="maja"] .budget-user-thumb-v3 {
        transform:translateX(100%);
        background:rgba(244,114,182,.14);
        box-shadow:inset 0 0 0 1px rgba(244,114,182,.40);
      }
      .budget-user-option-v1 {
        appearance:none;
        border:0;
        outline:0;
        height:26px;
        padding:0 6px;
        border-radius:7px;
        background:transparent;
        color:#8B949E;
        font:650 10.5px/1 'Inter',sans-serif;
        cursor:pointer;
        transition:color .15s ease;
        -webkit-tap-highlight-color:transparent;
      }
      .budget-user-option-v1[data-user="markus"].active { color:#60A5FA; }
      .budget-user-option-v1[data-user="maja"].active { color:#F472B6; }
      .budget-user-option-v1:disabled { cursor:default; }

      .header > .nav-dropdown-wrapper {
        position:relative !important;
        top:auto !important;
        right:auto !important;
        left:auto !important;
        margin:0 !important;
        order:3;
        flex:0 0 auto;
      }
      .header > .nav-dropdown-wrapper > button {
        width:32px !important;
        height:32px !important;
        min-width:32px !important;
        padding:0 !important;
        border-radius:8px !important;
        font-size:15px !important;
        background:rgba(255,255,255,.035) !important;
        border:1px solid rgba(255,255,255,.08) !important;
        color:#E2E8F0 !important;
      }

      .header #month-nav {
        width:100%;
        flex:0 0 100%;
        order:4;
        margin:1px 0 0 !important;
        display:flex !important;
        flex-wrap:nowrap !important;
        align-items:center !important;
        justify-content:flex-start !important;
        gap:7px !important;
      }
      .header #month-nav .custom-dropdown-wrapper {
        flex:1 1 auto !important;
        min-width:0 !important;
        max-width:250px !important;
        position:relative;
      }
      .header #month-dropdown {
        width:100% !important;
        min-width:0 !important;
        height:32px !important;
        padding:6px 10px !important;
        border-radius:8px !important;
        border:1px solid rgba(255,255,255,.08) !important;
        background:rgba(255,255,255,.035) !important;
        color:#E2E8F0 !important;
        font:650 11px/1 'Inter',sans-serif !important;
        text-align:left !important;
      }
      .header #month-nav > button {
        height:32px !important;
        min-height:32px !important;
        padding:0 10px !important;
        border-radius:8px !important;
        font:650 11px/1 'Inter',sans-serif !important;
        white-space:nowrap !important;
        margin:0 !important;
      }
      .header #set-start-month-btn,
      .header #month-nav > button[onclick*="deleteCurrentMonth"] {
        display:none !important;
      }
      .header #month-nav > button[onclick*="addNewMonth"] {
        background:rgba(52,211,153,.09) !important;
        border:1px solid rgba(52,211,153,.20) !important;
        color:#34D399 !important;
      }

      .header .custom-dropdown-menu {
        width:100% !important;
        min-width:190px !important;
        max-height:300px !important;
        margin-top:6px !important;
        background:#161B22 !important;
        border:1px solid rgba(255,255,255,.09) !important;
        border-radius:10px !important;
        box-shadow:0 12px 36px rgba(0,0,0,.45) !important;
        overflow-y:auto !important;
        overflow-x:hidden !important;
      }
      .header .custom-dropdown-item.budget-month-item-v3 {
        min-height:36px;
        padding:6px 7px 6px 10px !important;
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:8px !important;
        border-bottom:1px solid rgba(255,255,255,.055) !important;
        color:#C9D1D9 !important;
        background:transparent !important;
        font-size:11px !important;
      }
      .header .custom-dropdown-item.budget-month-item-v3:hover {
        padding:6px 7px 6px 10px !important;
        background:rgba(255,255,255,.045) !important;
        color:#F0F6FC !important;
      }
      .header .custom-dropdown-item.budget-month-item-v3.selected {
        padding:6px 7px 6px 10px !important;
        border-left:2px solid #60A5FA !important;
        background:rgba(96,165,250,.08) !important;
      }
      .header .budget-month-delete-v3 {
        width:24px;
        height:24px;
        flex:0 0 24px;
        display:flex;
        align-items:center;
        justify-content:center;
        border:0;
        border-radius:6px;
        background:transparent;
        color:#6E7681;
        font:700 16px/1 'Inter',sans-serif;
        cursor:pointer;
        transition:background .15s,color .15s;
      }
      .header .budget-month-delete-v3:hover {
        color:#F87171;
        background:rgba(248,113,113,.10);
      }

      html.budget-profile-switching-v3 .container {
        opacity:.94;
        transition:opacity .18s ease;
      }

      @media(max-width:430px) {
        .header { padding:10px 12px !important; gap:7px !important; }
        .budget-brand-v3 { min-width:58px; }
        .header .budget-brand-v3 h1 { font-size:15px !important; }
        .header .budget-brand-v3 p { font-size:10px !important; }
        .budget-user-toggle-v1 { width:108px; flex-basis:108px; height:30px; }
        .budget-user-option-v1 { height:24px; padding:0 4px; font-size:10px; }
        .header > .nav-dropdown-wrapper > button { width:30px !important; height:30px !important; min-width:30px !important; }
        .header #month-nav { gap:6px !important; }
        .header #month-nav .custom-dropdown-wrapper { max-width:none !important; }
        .header #month-dropdown { height:30px !important; font-size:10.5px !important; }
        .header #month-nav > button { height:30px !important; min-height:30px !important; padding:0 9px !important; font-size:10.5px !important; }
      }
      @media(max-width:355px) {
        .budget-user-toggle-v1 { width:100px; flex-basis:100px; }
        .budget-user-option-v1 { font-size:9.5px; }
        .header #month-nav > button[onclick*="addNewMonth"] { padding-left:7px !important; padding-right:7px !important; }
      }
      @media(prefers-reduced-motion:reduce) {
        .budget-user-thumb-v3,.header .budget-brand-v3 p,html.budget-profile-switching-v3 .container { transition:none !important; animation:none !important; }
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

  function setVisualUser(user, animateName) {
    var toggle = document.getElementById('budget-user-toggle-v1');
    if (toggle) {
      toggle.setAttribute('data-user',user);
      toggle.querySelectorAll('[data-user]').forEach(function (button) {
        var active = button.dataset.user === user;
        button.classList.toggle('active',active);
        button.setAttribute('aria-pressed',active ? 'true' : 'false');
        if (switching) button.disabled = true;
      });
    }

    var profile = document.querySelector('.budget-brand-v3 p');
    if (!profile) return;
    var name = user === 'maja' ? 'Maja' : 'Markus';
    if (!animateName) {
      profile.textContent = name;
      profile.setAttribute('data-user',user);
      return;
    }

    profile.classList.remove('budget-profile-name-changing-v3');
    void profile.offsetWidth;
    profile.classList.add('budget-profile-name-changing-v3');
    setTimeout(function () {
      profile.textContent = name;
      profile.setAttribute('data-user',user);
    },80);
    setTimeout(function () {
      profile.classList.remove('budget-profile-name-changing-v3');
    },190);
  }

  function startSwitch(user) {
    if (!isBudgetPage || switching || user === currentUser || (user !== 'markus' && user !== 'maja')) return;
    switching = true;
    flushCurrentEdit();
    rememberUser(user);

    try {
      sessionStorage.setItem(transitionKey, JSON.stringify({target:user,at:Date.now()}));
    } catch (_) {}

    document.documentElement.classList.add('budget-profile-switching-v3');
    setVisualUser(user,true);

    /* Keep the source page visible long enough for the pill/name morph to be
       perceived. The prefetched destination already has the same final header
       state, so navigation continues from that visual instead of a black canvas. */
    setTimeout(function () {
      window.location.href = targetFor(user);
    },185);
  }

  function ensureToggle(header, brand) {
    var existing = document.getElementById('budget-user-toggle-v1');
    if (existing) return existing;

    var toggle = document.createElement('div');
    toggle.id = 'budget-user-toggle-v1';
    toggle.className = 'budget-user-toggle-v1';
    toggle.setAttribute('data-user',currentUser);
    toggle.setAttribute('role','group');
    toggle.setAttribute('aria-label','Välj budgetprofil');
    toggle.innerHTML =
      '<span class="budget-user-thumb-v3" aria-hidden="true"></span>' +
      '<button type="button" class="budget-user-option-v1' + (currentUser === 'markus' ? ' active' : '') + '" data-user="markus" aria-pressed="' + (currentUser === 'markus' ? 'true' : 'false') + '">Markus</button>' +
      '<button type="button" class="budget-user-option-v1' + (currentUser === 'maja' ? ' active' : '') + '" data-user="maja" aria-pressed="' + (currentUser === 'maja' ? 'true' : 'false') + '">Maja</button>';
    toggle.addEventListener('click',function (event) {
      var button = event.target && event.target.closest ? event.target.closest('[data-user]') : null;
      if (!button || button.dataset.user === currentUser) return;
      startSwitch(button.dataset.user);
    });

    if (brand && brand.parentNode === header) brand.insertAdjacentElement('afterend',toggle);
    else header.appendChild(toggle);
    return toggle;
  }

  function compactMonthControls(header) {
    var monthNav = document.getElementById('month-nav');
    if (!monthNav) return;

    var startButton = document.getElementById('set-start-month-btn');
    if (startButton) startButton.remove();

    Array.prototype.slice.call(monthNav.querySelectorAll('button')).forEach(function (button) {
      var onclick = String(button.getAttribute('onclick') || '');
      if (onclick.indexOf('deleteCurrentMonth') !== -1) button.remove();
      if (onclick.indexOf('addNewMonth') !== -1) button.textContent = '+ Månad';
    });

    header.appendChild(monthNav);
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

  function prepareHeaderEarly() {
    if (!isBudgetPage || headerInstalled) return false;
    var header = document.querySelector('.header');
    var title = header && header.querySelector(':scope > h1');
    var subtitle = header && header.querySelector(':scope > p');
    if (!header || !title || !subtitle) return false;

    headerInstalled = true;
    var darkButton = document.getElementById('dark-mode-btn');
    if (darkButton) darkButton.remove();

    var brand = document.createElement('div');
    brand.className = 'budget-brand-v3';
    header.insertBefore(brand,title);
    brand.appendChild(title);
    brand.appendChild(subtitle);

    title.textContent = 'Budget';
    title.setAttribute('aria-label','Budget – gå till startsidan');
    subtitle.textContent = currentUser === 'maja' ? 'Maja' : 'Markus';
    subtitle.setAttribute('data-user',currentUser);

    ensureToggle(header,brand);

    var nav = header.querySelector(':scope > .nav-dropdown-wrapper');
    if (nav) header.appendChild(nav);
    compactMonthControls(header);
    cleanBudgetMenu();

    /* Release the old critical gate as soon as the final header geometry exists.
       Do not wait for charts: keeping page content visible avoids the black gap. */
    document.documentElement.classList.remove(
      'budget-toggle-booting-v1',
      'budget-profile-booting-v2',
      'budget-profile-ready-v2',
      'budget-transition-root-v4'
    );
    document.documentElement.style.backgroundColor = '';
    if (document.body) {
      document.body.style.backgroundColor = '';
      document.body.style.minHeight = '';
    }

    return true;
  }

  function installEarlyHeaderWatcher() {
    if (!isBudgetPage) return;
    addStyles();
    if (prepareHeaderEarly()) return;

    var observer = new MutationObserver(function () {
      if (prepareHeaderEarly()) observer.disconnect();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    setTimeout(function () {
      observer.disconnect();
      prepareHeaderEarly();
      document.documentElement.classList.remove('budget-toggle-booting-v1','budget-profile-booting-v2','budget-transition-root-v4');
    },1200);
  }

  function speedUpInitialCharts() {
    if (!isBudgetPage || window.__budgetChartsFastBootV3) return;
    if (typeof window.initCharts !== 'function') return;

    window.__budgetChartsFastBootV3 = true;
    var originalInitCharts = window.initCharts;
    var guardUntil = Date.now() + 700;

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
      if (window.initCharts !== originalInitCharts && Date.now() >= guardUntil) window.initCharts = originalInitCharts;
    },720);
  }

  function parseMonthKey(key) {
    var parts = String(key || '').split('-').map(Number);
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;
    return new Date(parts[0],parts[1]-1,1);
  }

  function deleteMonthKey(key) {
    try {
      if (typeof monthlyData === 'undefined' || !monthlyData) return;
      var allKeys = Object.keys(monthlyData).sort();
      if (allKeys.length <= 1) {
        alert('Du måste ha minst en månad');
        return;
      }
      if (allKeys.indexOf(key) === -1) return;

      var date = parseMonthKey(key);
      if (!date) return;
      if (!confirm('Är du säker på att du vill radera ' + getMonthDisplay(date) + '?')) return;

      var selectedKey = typeof getMonthKey === 'function' ? getMonthKey(currentMonth) : '';
      var deletingSelected = selectedKey === key;
      var index = allKeys.indexOf(key);
      var nextKey = index > 0 ? allKeys[index-1] : allKeys[index+1];

      delete monthlyData[key];

      if (deletingSelected && nextKey) {
        var nextDate = parseMonthKey(nextKey);
        if (nextDate) currentMonth = nextDate;
      }

      if (typeof updateMonthDisplay === 'function') updateMonthDisplay();
      if (typeof refresh === 'function') refresh();
      if (typeof saveSelectedMonth === 'function') saveSelectedMonth();
      if (typeof saveLocal === 'function') saveLocal();
    } catch (error) {
      console.error('Could not delete budget month:',error);
    }
  }

  function enhanceMonthMenu() {
    var menu = document.getElementById('month-dropdown-menu');
    if (!menu) return;

    var keys;
    try {
      if (typeof monthlyData === 'undefined' || !monthlyData) return;
      keys = Object.keys(monthlyData).sort();
    } catch (_) { return; }

    var items = Array.prototype.slice.call(menu.querySelectorAll('.custom-dropdown-item'));
    items.forEach(function (item,index) {
      if (item.querySelector('.budget-month-delete-v3')) return;
      var key = keys[index];
      if (!key) return;

      var labelText = String(item.textContent || '').trim();
      item.textContent = '';
      item.classList.add('budget-month-item-v3');
      item.setAttribute('data-month-key',key);

      var label = document.createElement('span');
      label.className = 'budget-month-label-v3';
      label.textContent = labelText;
      item.appendChild(label);

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'budget-month-delete-v3';
      remove.textContent = '×';
      remove.setAttribute('aria-label','Radera ' + labelText);
      remove.title = 'Radera månad';
      remove.addEventListener('click',function (event) {
        event.preventDefault();
        event.stopPropagation();
        deleteMonthKey(key);
        menu.classList.remove('active');
      });
      item.appendChild(remove);
    });
  }

  function installMonthMenuEnhancement() {
    if (!isBudgetPage || window.__budgetMonthDeleteV3Installed) return;
    window.__budgetMonthDeleteV3Installed = true;

    var original = typeof window.updateMonthDisplay === 'function' ? window.updateMonthDisplay : null;
    if (original) {
      window.updateMonthDisplay = function () {
        var result = original.apply(this,arguments);
        enhanceMonthMenu();
        return result;
      };
    }

    enhanceMonthMenu();

    var menu = document.getElementById('month-dropdown-menu');
    if (menu) {
      var observer = new MutationObserver(function () { enhanceMonthMenu(); });
      observer.observe(menu,{childList:true});
    }
  }

  function consumeTransitionMarker() {
    try { sessionStorage.removeItem(transitionKey); } catch (_) {}
    document.documentElement.classList.remove('budget-profile-switching-v3');
  }

  function installLate() {
    if (isBudgetPage) {
      rememberUser(currentUser);
      prepareHeaderEarly();
      primeTargetPage();
      speedUpInitialCharts();
      installMonthMenuEnhancement();
      consumeTransitionMarker();
    }
    cleanBudgetMenu();
  }

  installEarlyHeaderWatcher();
  primeTargetPage();

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',installLate,{once:true});
  else installLate();
})();