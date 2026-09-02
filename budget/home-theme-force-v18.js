(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  if (!isHome || window.__homeThemeForceV18Installed) return;
  window.__homeThemeForceV18Installed = true;

  var THEME_KEY = 'home-theme-choice-v1';
  var palettes = {
    blue:   { label:'Blå', accent:'#60A5FA', soft:'#93C5FD', rgb:'96,165,250' },
    amber:  { label:'Amber', accent:'#FBBF24', soft:'#FCD34D', rgb:'251,191,36' },
    orange: { label:'Ljusorange', accent:'#FB923C', soft:'#FDBA74', rgb:'251,146,60' }
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
    s.setProperty('--accent', p.accent, 'important');
    s.setProperty('--accent-dim', 'rgba(' + p.rgb + ',.10)', 'important');
    s.setProperty('--accent-glow', 'rgba(' + p.rgb + ',.25)', 'important');
    s.setProperty('--border-a', 'rgba(' + p.rgb + ',.30)', 'important');
    s.setProperty('--accent-bg', 'rgba(' + p.rgb + ',.055)', 'important');
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
    if (!palettes[theme]) return;
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    applyPalette(theme);
    window.dispatchEvent(new CustomEvent('home-theme-change', { detail:{ theme:theme } }));
  }

  function addOverrideStyles() {
    if (document.getElementById('home-theme-force-v18-style')) return;
    var style = document.createElement('style');
    style.id = 'home-theme-force-v18-style';
    style.textContent = `
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
      html body #event-modal .modal {
        background:
          radial-gradient(560px 190px at 50% -30px,rgba(var(--home-view-rgb),.105),transparent 70%),
          linear-gradient(180deg,rgba(25,25,28,.995),rgba(15,18,25,.995)) !important;
        border-color:rgba(var(--home-view-rgb),.28) !important;
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
        setTheme(theme);
        closeThemeSelector();
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
