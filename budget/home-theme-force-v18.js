(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  if (!isHome || window.__homeThemeForceV18Installed) return;
  window.__homeThemeForceV18Installed = true;

  var THEME_KEY = 'home-theme-choice-v1';
  var palettes = {
    blue: {
      label:'Blå',
      accent:'#60A5FA',
      soft:'#93C5FD',
      rgb:'96,165,250',
      page:'#0B1320',
      panel:'#111B2A',
      strong:'#18253A'
    },
    amber: {
      label:'Amber',
      accent:'#FBBF24',
      soft:'#FCD34D',
      rgb:'251,191,36',
      page:'#15130C',
      panel:'#1D190F',
      strong:'#282116'
    },
    orange: {
      label:'Ljusorange',
      accent:'#FB923C',
      soft:'#FDBA74',
      rgb:'251,146,60',
      page:'#17100C',
      panel:'#201510',
      strong:'#2B1C15'
    }
  };

  function currentTheme() {
    var theme = '';
    try { theme = localStorage.getItem(THEME_KEY) || ''; } catch (_) {}
    return palettes[theme] ? theme : 'orange';
  }

  function setVars(node, p) {
    if (!node) return;
    var s = node.style;
    s.setProperty('--home-view-accent', p.accent, 'important');
    s.setProperty('--home-view-accent-soft', p.soft, 'important');
    s.setProperty('--home-view-rgb', p.rgb, 'important');
    s.setProperty('--home-theme-page', p.page, 'important');
    s.setProperty('--home-theme-panel', p.panel, 'important');
    s.setProperty('--home-theme-strong', p.strong, 'important');
    s.setProperty('--bg', p.page, 'important');
    s.setProperty('--bg2', p.panel, 'important');
    s.setProperty('--bg3', p.strong, 'important');
    s.setProperty('--card', p.panel, 'important');
    s.setProperty('--surface', 'rgba(' + p.rgb + ',.045)', 'important');
    s.setProperty('--surface-h', 'rgba(' + p.rgb + ',.085)', 'important');
    s.setProperty('--border', 'rgba(' + p.rgb + ',.135)', 'important');
    s.setProperty('--accent', p.accent, 'important');
    s.setProperty('--accent-dim', 'rgba(' + p.rgb + ',.10)', 'important');
    s.setProperty('--accent-glow', 'rgba(' + p.rgb + ',.25)', 'important');
    s.setProperty('--border-a', 'rgba(' + p.rgb + ',.30)', 'important');
    s.setProperty('--accent-bg', 'rgba(' + p.rgb + ',.075)', 'important');
  }

  function updateThemeSelector(theme) {
    var picker = document.getElementById('home-theme-picker-v1');
    if (!picker) return;
    var button = picker.querySelector('.home-theme-toggle-v1');
    if (button) {
      button.title = 'Tema: ' + palettes[theme].label;
      button.setAttribute('aria-label', 'Byt färgtema. Aktivt tema: ' + palettes[theme].label);
      var dot = button.querySelector('.home-theme-current-dot-v1');
      if (dot) dot.style.background = palettes[theme].accent;
    }
    picker.querySelectorAll('[data-home-theme-choice]').forEach(function (choice) {
      var active = choice.dataset.homeThemeChoice === theme;
      choice.classList.toggle('is-active', active);
      choice.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }

  function applyPalette(theme) {
    theme = palettes[theme] ? theme : currentTheme();
    var p = palettes[theme];
    var root = document.documentElement;
    var body = document.body;
    root.dataset.homeTheme = theme;
    if (body && body.dataset) body.dataset.homeTheme = theme;
    setVars(root, p);
    setVars(body, p);
    updateThemeSelector(theme);
  }

  function setTheme(theme) {
    if (!palettes[theme] || theme === currentTheme()) return;
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}

    function commitTheme() {
      applyPalette(theme);
      window.dispatchEvent(new CustomEvent('home-theme-change', { detail:{ theme:theme } }));
    }

    var reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) {}
    if (!reduced && typeof document.startViewTransition === 'function') {
      try { document.startViewTransition(commitTheme); }
      catch (_) { commitTheme(); }
    } else {
      commitTheme();
    }
  }

  function addOverrideStyles() {
    if (document.getElementById('home-theme-force-v18-style')) return;
    var style = document.createElement('style');
    style.id = 'home-theme-force-v18-style';
    style.textContent = `
      html[data-home-theme],
      html[data-home-theme] body.home-calendar-polish-v5 {
        background:
          radial-gradient(920px 390px at 50% -115px,rgba(var(--home-view-rgb),.145),transparent 68%),
          radial-gradient(720px 420px at 105% 55%,rgba(var(--home-view-rgb),.045),transparent 72%),
          var(--home-theme-page) !important;
        background-color:var(--home-theme-page) !important;
      }
      html[data-home-theme] body.home-calendar-polish-v5::before {
        background:
          radial-gradient(ellipse 90% 52% at 50% -10%,rgba(var(--home-view-rgb),.11),transparent 65%),
          linear-gradient(180deg,rgba(255,255,255,.008),transparent 32%) !important;
      }

      html[data-home-theme] body .filter-bar {
        background:linear-gradient(180deg,rgba(var(--home-view-rgb),.07),rgba(var(--home-view-rgb),.025)) !important;
        border-bottom-color:rgba(var(--home-view-rgb),.16) !important;
      }
      html[data-home-theme] body .nav-dropdown-menu,
      html[data-home-theme] body .notif-panel,
      html[data-home-theme] body .day-panel,
      html[data-home-theme] body .sidebar-section,
      html[data-home-theme] body .widget {
        background:
          radial-gradient(420px 150px at 50% -55px,rgba(var(--home-view-rgb),.075),transparent 72%),
          linear-gradient(180deg,var(--home-theme-panel),var(--home-theme-page)) !important;
        border-color:rgba(var(--home-view-rgb),.15) !important;
        box-shadow:0 8px 24px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.025) !important;
      }
      html[data-home-theme] body .widget:hover,
      html[data-home-theme] body .sidebar-section:hover {
        border-color:rgba(var(--home-view-rgb),.25) !important;
        box-shadow:0 12px 28px rgba(0,0,0,.28),0 0 18px rgba(var(--home-view-rgb),.045) !important;
      }
      html[data-home-theme] body .cal-cell {
        background:linear-gradient(180deg,rgba(var(--home-view-rgb),.05),rgba(var(--home-view-rgb),.018)) !important;
        border-color:rgba(var(--home-view-rgb),.115) !important;
      }
      html[data-home-theme] body .cal-cell.empty {
        background:transparent !important;
        border-color:transparent !important;
      }
      html[data-home-theme] body .cal-cell.selected {
        border-color:var(--home-view-accent) !important;
        box-shadow:0 0 0 2px rgba(var(--home-view-rgb),.20),0 0 18px rgba(var(--home-view-rgb),.08) !important;
      }
      html[data-home-theme] body .btn,
      html[data-home-theme] body .btn-xs,
      html[data-home-theme] body .badge {
        border-color:rgba(var(--home-view-rgb),.38) !important;
        background:rgba(var(--home-view-rgb),.09) !important;
        color:var(--home-view-accent-soft) !important;
      }
      html[data-home-theme] body .btn:hover,
      html[data-home-theme] body .btn-xs:hover {
        border-color:rgba(var(--home-view-rgb),.60) !important;
        background:rgba(var(--home-view-rgb),.16) !important;
        color:var(--home-view-accent-soft) !important;
        box-shadow:0 7px 18px rgba(var(--home-view-rgb),.10) !important;
      }
      html[data-home-theme] body .shopping-input,
      html[data-home-theme] body .todo-input,
      html[data-home-theme] body .todo-member-sel {
        background:rgba(var(--home-view-rgb),.028) !important;
        border-color:rgba(var(--home-view-rgb),.15) !important;
      }
      html[data-home-theme] body .shopping-input:focus,
      html[data-home-theme] body .todo-input:focus,
      html[data-home-theme] body .todo-member-sel:focus {
        border-color:rgba(var(--home-view-rgb),.55) !important;
        box-shadow:0 0 0 2px rgba(var(--home-view-rgb),.11) !important;
      }
      html[data-home-theme] body .toggle input:checked + .toggle-slider {
        background:rgba(var(--home-view-rgb),.22) !important;
        border-color:rgba(var(--home-view-rgb),.55) !important;
      }
      html[data-home-theme] body .toggle input:checked + .toggle-slider::before {
        background:var(--home-view-accent) !important;
        box-shadow:0 0 8px rgba(var(--home-view-rgb),.40) !important;
      }
      html[data-home-theme] body input[type="checkbox"],
      html[data-home-theme] body input[type="radio"],
      html[data-home-theme] body input[type="range"] {
        accent-color:var(--home-view-accent) !important;
      }

      html[data-home-theme] body .transfer-popup-shell,
      html[data-home-theme] body .month-popup-shell,
      html[data-home-theme] body .transfer-person-card,
      html[data-home-theme] body .month-expense-section {
        background:
          radial-gradient(360px 130px at 50% 0,rgba(var(--home-view-rgb),.075),transparent 72%),
          linear-gradient(180deg,var(--home-theme-strong),var(--home-theme-panel)) !important;
        border-color:rgba(var(--home-view-rgb),.17) !important;
      }
      html[data-home-theme] body .transfer-row,
      html[data-home-theme] body .shopping-item,
      html[data-home-theme] body .event-item,
      html[data-home-theme] body .notif-row {
        border-color:rgba(var(--home-view-rgb),.105) !important;
      }

      html[data-home-theme] body .modal {
        background:
          radial-gradient(620px 220px at 50% -45px,rgba(var(--home-view-rgb),.13),transparent 70%),
          linear-gradient(180deg,var(--home-theme-strong),var(--home-theme-page)) !important;
        border-color:rgba(var(--home-view-rgb),.30) !important;
        box-shadow:0 26px 72px rgba(0,0,0,.58),0 0 38px rgba(var(--home-view-rgb),.09),inset 0 1px 0 rgba(255,255,255,.035) !important;
      }
      html[data-home-theme] body .form-group input,
      html[data-home-theme] body .form-group select,
      html[data-home-theme] body .form-group textarea,
      html[data-home-theme] body #event-end-panel-v2,
      html[data-home-theme] body .event-end-toggle-v2 {
        background-color:rgba(var(--home-view-rgb),.035) !important;
        border-color:rgba(var(--home-view-rgb),.14) !important;
      }
      html[data-home-theme] body .form-group input:focus,
      html[data-home-theme] body .form-group select:focus,
      html[data-home-theme] body .form-group textarea:focus {
        background-color:rgba(var(--home-view-rgb),.065) !important;
        border-color:rgba(var(--home-view-rgb),.58) !important;
        box-shadow:0 0 0 2px rgba(var(--home-view-rgb),.13) !important;
      }
      html[data-home-theme] body .modal-close,
      html[data-home-theme] body .transfer-close {
        background:rgba(var(--home-view-rgb),.045) !important;
        border-color:rgba(var(--home-view-rgb),.16) !important;
      }
      html[data-home-theme] body .modal-close:hover,
      html[data-home-theme] body .transfer-close:hover {
        color:var(--home-view-accent-soft) !important;
        background:rgba(var(--home-view-rgb),.11) !important;
        border-color:rgba(var(--home-view-rgb),.34) !important;
      }
      html[data-home-theme] body .flatpickr-calendar,
      html[data-home-theme] body .home-day-popover {
        background:
          radial-gradient(480px 170px at 50% 0,rgba(var(--home-view-rgb),.10),transparent 72%),
          linear-gradient(180deg,var(--home-theme-strong),var(--home-theme-page)) !important;
        border-color:rgba(var(--home-view-rgb),.28) !important;
        box-shadow:0 18px 48px rgba(0,0,0,.55),0 0 30px rgba(var(--home-view-rgb),.08) !important;
      }

      html body .header-time {
        color:var(--home-view-accent) !important;
        text-shadow:0 2px 10px rgba(var(--home-view-rgb),.20) !important;
      }
      html body .header-date {
        color:var(--home-view-accent-soft) !important;
        text-shadow:0 1px 8px rgba(var(--home-view-rgb),.14) !important;
      }
      html body .app-header > .month-nav.home-header-month-v10 button,
      html body .app-header > .month-nav.home-header-month-v10 #month-label {
        color:var(--home-view-accent-soft) !important;
      }
      html body .app-header > .month-nav.home-header-month-v10 button {
        border-color:rgba(var(--home-view-rgb),.28) !important;
      }
      html body .app-header {
        background:
          radial-gradient(560px 185px at 50% 108%,rgba(var(--home-view-rgb),.105),transparent 70%),
          linear-gradient(180deg,rgba(13,17,23,.988),rgba(var(--home-view-rgb),.052)) !important;
        border-bottom-color:rgba(var(--home-view-rgb),.22) !important;
        box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 25px rgba(var(--home-view-rgb),.075) !important;
      }
      html body .cal-week-number,
      html body .calendar-week-number-v2,
      html body .sidebar-title,
      html body .home-day-popover-title {
        color:var(--home-view-accent) !important;
      }
      html body .cal-cell.today {
        border-color:rgba(var(--home-view-rgb),.72) !important;
        background:linear-gradient(180deg,rgba(var(--home-view-rgb),.115),rgba(var(--home-view-rgb),.035)) !important;
        box-shadow:inset 0 0 0 1px rgba(var(--home-view-rgb),.07),0 0 14px rgba(var(--home-view-rgb),.045) !important;
      }
      html body .cal-cell.today .cal-num {
        color:var(--home-view-accent) !important;
      }
      html body .fab,
      html body.calendar-ui-v2 .fab {
        color:var(--home-view-accent) !important;
        border-color:rgba(var(--home-view-rgb),.50) !important;
        box-shadow:0 9px 22px rgba(0,0,0,.28),0 0 24px rgba(var(--home-view-rgb),.16) !important;
      }
      html body .app-header .btn-notif.home-notif-switch-v7.is-on {
        border-color:rgba(var(--home-view-rgb),.46) !important;
        background:rgba(var(--home-view-rgb),.12) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 0 13px rgba(var(--home-view-rgb),.18) !important;
      }
      html.home-finance-orange-v3[data-home-theme] body.home-calendar-polish-v5 #event-modal .modal,
      html[data-home-theme] body #event-modal .modal {
        background:
          radial-gradient(560px 190px at 50% -30px,rgba(var(--home-view-rgb),.13),transparent 70%),
          linear-gradient(180deg,var(--home-theme-strong),var(--home-theme-page)) !important;
        border-color:rgba(var(--home-view-rgb),.30) !important;
      }
      html body #event-modal .form-group input:focus,
      html body #event-modal .form-group select:focus,
      html body #event-modal .form-group textarea:focus {
        border-color:rgba(var(--home-view-rgb),.58) !important;
        box-shadow:0 0 0 2px rgba(var(--home-view-rgb),.13) !important;
      }

      .home-theme-picker-v1 {
        position:absolute;
        top:13px;
        right:70px;
        z-index:1003;
      }
      .home-theme-toggle-v1 {
        position:relative;
        width:38px;
        height:38px;
        display:grid;
        place-items:center;
        border:1px solid rgba(var(--home-view-rgb),.28);
        border-radius:10px;
        background:rgba(255,255,255,.035);
        color:var(--home-view-accent-soft);
        font-size:17px;
        cursor:pointer;
        box-shadow:0 7px 20px rgba(0,0,0,.22);
      }
      .home-theme-toggle-v1:hover,
      .home-theme-toggle-v1[aria-expanded="true"] {
        background:rgba(var(--home-view-rgb),.11);
        border-color:rgba(var(--home-view-rgb),.52);
      }
      .home-theme-current-dot-v1 {
        position:absolute;
        right:4px;
        bottom:4px;
        width:8px;
        height:8px;
        border:1px solid rgba(255,255,255,.72);
        border-radius:50%;
        box-shadow:0 0 8px rgba(var(--home-view-rgb),.75);
      }
      .home-theme-menu-v1 {
        position:absolute;
        top:46px;
        right:0;
        width:190px;
        display:none;
        padding:7px;
        border:1px solid rgba(var(--home-view-rgb),.26);
        border-radius:13px;
        background:rgba(15,18,25,.98);
        box-shadow:0 16px 42px rgba(0,0,0,.52);
        backdrop-filter:blur(12px);
        -webkit-backdrop-filter:blur(12px);
      }
      .home-theme-picker-v1.is-open .home-theme-menu-v1 { display:grid; gap:4px; }
      .home-theme-choice-v1 {
        width:100%;
        min-height:40px;
        display:flex;
        align-items:center;
        gap:10px;
        padding:8px 10px;
        border:1px solid transparent;
        border-radius:9px;
        background:transparent;
        color:#DDE3EA;
        font:700 12px/1.2 'Inter',sans-serif;
        text-align:left;
        cursor:pointer;
      }
      .home-theme-choice-v1:hover { background:rgba(255,255,255,.05); }
      .home-theme-choice-v1.is-active {
        color:var(--home-view-accent-soft);
        border-color:rgba(var(--home-view-rgb),.32);
        background:rgba(var(--home-view-rgb),.10);
      }
      .home-theme-swatch-v1 {
        width:16px;
        height:16px;
        flex:0 0 auto;
        border-radius:50%;
        background:var(--swatch);
        box-shadow:0 0 11px color-mix(in srgb,var(--swatch) 55%,transparent);
      }

      html[data-home-theme="blue"] body #event-modal input[data-picker="date"] {
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360A5FA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='3'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E") !important;
      }
      html[data-home-theme="amber"] body #event-modal input[data-picker="date"] {
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FBBF24' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='3'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E") !important;
      }
      html[data-home-theme="orange"] body #event-modal input[data-picker="date"] {
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FB923C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='3'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E") !important;
      }
      html[data-home-theme="blue"] body #event-modal input[data-picker="time"] {
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360A5FA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpolyline points='12 7 12 12 15 14'/%3E%3C/svg%3E") !important;
      }
      html[data-home-theme="amber"] body #event-modal input[data-picker="time"] {
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FBBF24' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpolyline points='12 7 12 12 15 14'/%3E%3C/svg%3E") !important;
      }
      html[data-home-theme="orange"] body #event-modal input[data-picker="time"] {
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FB923C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpolyline points='12 7 12 12 15 14'/%3E%3C/svg%3E") !important;
      }

      @media (max-width:480px) {
        .home-theme-picker-v1 { top:12px; right:66px; }
        .home-theme-menu-v1 { position:fixed; top:58px; right:12px; width:min(220px,calc(100vw - 24px)); }
      }
    `;
    document.head.appendChild(style);
  }

  function closeThemeSelector() {
    var picker = document.getElementById('home-theme-picker-v1');
    if (!picker) return;
    picker.classList.remove('is-open');
    var toggle = picker.querySelector('.home-theme-toggle-v1');
    if (toggle) toggle.setAttribute('aria-expanded','false');
  }

  function installThemeSelector() {
    var header = document.querySelector('.app-header');
    if (!header || document.getElementById('home-theme-picker-v1')) {
      updateThemeSelector(currentTheme());
      return;
    }

    var picker = document.createElement('div');
    picker.id = 'home-theme-picker-v1';
    picker.className = 'home-theme-picker-v1';

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'home-theme-toggle-v1';
    toggle.setAttribute('aria-haspopup','menu');
    toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML = '<span aria-hidden="true">🎨</span><span class="home-theme-current-dot-v1" aria-hidden="true"></span>';
    toggle.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var open = !picker.classList.contains('is-open');
      closeThemeSelector();
      picker.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    var menu = document.createElement('div');
    menu.className = 'home-theme-menu-v1';
    menu.setAttribute('role','radiogroup');
    menu.setAttribute('aria-label','Färgtema');

    ['blue','amber','orange'].forEach(function (theme) {
      var choice = document.createElement('button');
      choice.type = 'button';
      choice.className = 'home-theme-choice-v1';
      choice.dataset.homeThemeChoice = theme;
      choice.setAttribute('role','radio');
      choice.style.setProperty('--swatch',palettes[theme].accent);
      choice.innerHTML = '<span class="home-theme-swatch-v1" aria-hidden="true"></span><span>' + palettes[theme].label + '</span>';
      choice.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        closeThemeSelector();
        setTheme(theme);
      });
      menu.appendChild(choice);
    });

    picker.appendChild(toggle);
    picker.appendChild(menu);
    header.appendChild(picker);
    document.addEventListener('click', function (event) {
      if (!picker.contains(event.target)) closeThemeSelector();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeThemeSelector();
    });
    updateThemeSelector(currentTheme());
  }

  window.__homeThemeV1 = {
    getTheme:currentTheme,
    setTheme:setTheme
  };

  /* Critical palette CSS and root variables must exist before first paint. */
  addOverrideStyles();
  applyPalette();

  function start() {
    addOverrideStyles();
    applyPalette();
    installThemeSelector();
    if (document.body) {
      new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].attributeName === 'data-home-calendar-view') {
            applyPalette();
            break;
          }
        }
      }).observe(document.body, { attributes:true, attributeFilter:['data-home-calendar-view'] });
    }
    [80, 250, 700, 1600].forEach(function (delay) { setTimeout(applyPalette, delay); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }
})();
