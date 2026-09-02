(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  if (!isHome || window.__homeThemeControllerV1Installed) return;
  window.__homeThemeControllerV1Installed = true;

  var palettes = {
    day:   { accent:'#60A5FA', soft:'#93C5FD', rgb:'96,165,250' },
    week:  { accent:'#4ADE80', soft:'#86EFAC', rgb:'74,222,128' },
    month: { accent:'#FB923C', soft:'#FDBA74', rgb:'251,146,60' }
  };
  var BLUE_THEME_KEY = 'home-blue-theme-config-v1';
  var BRIGHTNESS_KEY = 'home-brightness-v1';
  var BRIGHTNESS_MIN = 70;
  var BRIGHTNESS_MAX = 130;

  function migrateThemeChoice() {
    try {
      if (localStorage.getItem(BLUE_THEME_KEY) === null) {
        localStorage.setItem(BLUE_THEME_KEY, localStorage.getItem('home-theme-choice-v1') === 'blue' ? '1' : '0');
      }
      localStorage.removeItem('home-theme-choice-v1');
    } catch (_) {}
  }

  function blueThemeEnabled() {
    try { return localStorage.getItem(BLUE_THEME_KEY) === '1'; }
    catch (_) { return false; }
  }

  function clampBrightness(value) {
    return Math.max(BRIGHTNESS_MIN, Math.min(BRIGHTNESS_MAX, Math.round(Number(value) || 100)));
  }

  function brightnessValue() {
    try { return clampBrightness(localStorage.getItem(BRIGHTNESS_KEY) || 100); }
    catch (_) { return 100; }
  }

  function brightnessEffect(value) {
    var level = clampBrightness(value);
    if (level < 100) {
      var darkAlpha = ((100 - level) / (100 - BRIGHTNESS_MIN)) * .24;
      return { css:'rgba(0,0,0,' + darkAlpha.toFixed(3) + ')', rgb:[0,0,0], alpha:darkAlpha };
    }
    if (level > 100) {
      var lightAlpha = ((level - 100) / (BRIGHTNESS_MAX - 100)) * .13;
      return { css:'rgba(255,247,237,' + lightAlpha.toFixed(3) + ')', rgb:[255,247,237], alpha:lightAlpha };
    }
    return { css:'rgba(0,0,0,0)', rgb:[0,0,0], alpha:0 };
  }

  function compositeHex(baseHex, effect) {
    var hex = String(baseHex || '#0F1219').replace('#','');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var base = [0,2,4].map(function (offset) { return parseInt(hex.slice(offset,offset + 2),16); });
    var alpha = effect.alpha || 0;
    var out = base.map(function (channel,index) {
      return Math.round(channel * (1 - alpha) + effect.rgb[index] * alpha);
    });
    return '#' + out.map(function (channel) { return channel.toString(16).padStart(2,'0'); }).join('').toUpperCase();
  }

  function updateBrightnessControl(value) {
    var level = clampBrightness(value);
    var input = document.getElementById('home-brightness-range-v1');
    var output = document.getElementById('home-brightness-output-v1');
    if (input && Number(input.value) !== level) input.value = String(level);
    if (output) output.textContent = level + '%';
    document.documentElement.style.setProperty(
      '--home-brightness-progress',
      (((level - BRIGHTNESS_MIN) / (BRIGHTNESS_MAX - BRIGHTNESS_MIN)) * 100).toFixed(2) + '%',
      'important'
    );
  }

  function applyBrightness(value, persist) {
    var level = clampBrightness(value);
    if (persist) {
      try { localStorage.setItem(BRIGHTNESS_KEY,String(level)); } catch (_) {}
    }
    var root = document.documentElement;
    root.dataset.homeBrightness = String(level);
    root.style.setProperty('--home-brightness-overlay',brightnessEffect(level).css,'important');
    updateBrightnessControl(level);
    syncStatusSurface(blueThemeEnabled(),level);
  }

  function currentView() {
    var body = document.body;
    var view = body && body.dataset ? body.dataset.homeCalendarView : '';
    if (!view) {
      try { view = localStorage.getItem('home-calendar-view-v11') || ''; } catch (_) {}
    }
    return palettes[view] ? view : 'month';
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

  function clearBlueSurfaceVars(node) {
    if (!node) return;
    ['--home-theme-page','--home-theme-panel','--home-theme-strong','--bg','--bg2','--bg3','--card','--surface','--surface-h','--border'].forEach(function (name) {
      node.style.removeProperty(name);
    });
  }

  function setBlueSurfaceVars(node) {
    if (!node) return;
    var s = node.style;
    s.setProperty('--home-theme-page','#0B1320','important');
    s.setProperty('--home-theme-panel','#111B2A','important');
    s.setProperty('--home-theme-strong','#18253A','important');
    s.setProperty('--bg','#0B1320','important');
    s.setProperty('--bg2','#111B2A','important');
    s.setProperty('--bg3','#18253A','important');
    s.setProperty('--card','#111B2A','important');
    s.setProperty('--surface','rgba(96,165,250,.045)','important');
    s.setProperty('--surface-h','rgba(96,165,250,.085)','important');
    s.setProperty('--border','rgba(96,165,250,.135)','important');
  }

  function updateBlueThemeConfig() {
    var button = document.getElementById('home-blue-theme-config-v1');
    if (!button) return;
    var enabled = blueThemeEnabled();
    button.classList.toggle('is-on', enabled);
    button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    var check = button.querySelector('.home-blue-theme-check-v1');
    if (check) check.textContent = enabled ? '✓' : '';
  }

  function syncStatusSurface(blue, brightness) {
    var root = document.documentElement;
    var topColor = blue ? '#111B2A' : '#0F1219';
    var statusColor = compositeHex(topColor,brightnessEffect(brightness == null ? brightnessValue() : brightness));
    root.classList.add('home-finance-orange-v3','home-status-integrated-v3');
    root.style.setProperty('--home-status-surface',topColor,'important');
    root.style.setProperty('background',topColor,'important');
    root.style.setProperty('background-color',topColor,'important');

    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name','theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content',statusColor);
  }

  function applyPalette() {
    var view = currentView();
    var blue = blueThemeEnabled();
    var p = blue ? palettes.day : palettes[view];
    var root = document.documentElement;
    var body = document.body;
    root.dataset.homeCalendarView = view;
    syncStatusSurface(blue,brightnessValue());

    if (blue) {
      root.dataset.homeBlueTheme = 'true';
      if (body && body.dataset) body.dataset.homeBlueTheme = 'true';
      setBlueSurfaceVars(root);
      setBlueSurfaceVars(body);
    } else {
      delete root.dataset.homeBlueTheme;
      if (body && body.dataset) delete body.dataset.homeBlueTheme;
      clearBlueSurfaceVars(root);
      clearBlueSurfaceVars(body);
    }

    setVars(root, p);
    setVars(body, p);
    updateBlueThemeConfig();
    applyBrightness(brightnessValue(),false);
  }

  function setBlueTheme(enabled) {
    try { localStorage.setItem(BLUE_THEME_KEY, enabled ? '1' : '0'); } catch (_) {}
    var commit = function () {
      applyPalette();
      window.dispatchEvent(new CustomEvent('home-blue-theme-change', { detail:{ enabled:enabled } }));
    };
    var reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) {}
    if (!reduced && typeof document.startViewTransition === 'function') {
      try { document.startViewTransition(commit); }
      catch (_) { commit(); }
    } else {
      commit();
    }
  }

  function addOverrideStyles() {
    if (document.getElementById('home-theme-controller-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'home-theme-controller-v1-style';
    style.textContent = `
      html[data-home-blue-theme="true"],
      html[data-home-blue-theme="true"] body.home-calendar-polish-v5 {
        background:
          radial-gradient(920px 390px at 50% -115px,rgba(var(--home-view-rgb),.145),transparent 68%),
          radial-gradient(720px 420px at 105% 55%,rgba(var(--home-view-rgb),.045),transparent 72%),
          var(--home-theme-page) !important;
        background-color:var(--home-theme-page) !important;
      }
      html[data-home-blue-theme="true"] body.home-calendar-polish-v5::before {
        background:
          radial-gradient(ellipse 90% 52% at 50% -10%,rgba(var(--home-view-rgb),.11),transparent 65%),
          linear-gradient(180deg,rgba(255,255,255,.008),transparent 32%) !important;
      }

      html[data-home-blue-theme="true"] body .filter-bar {
        background:linear-gradient(180deg,rgba(var(--home-view-rgb),.07),rgba(var(--home-view-rgb),.025)) !important;
        border-bottom-color:rgba(var(--home-view-rgb),.16) !important;
      }
      html[data-home-blue-theme="true"] body .nav-dropdown-menu,
      html[data-home-blue-theme="true"] body .notif-panel,
      html[data-home-blue-theme="true"] body .day-panel,
      html[data-home-blue-theme="true"] body .sidebar-section,
      html[data-home-blue-theme="true"] body .widget {
        background:
          radial-gradient(420px 150px at 50% -55px,rgba(var(--home-view-rgb),.075),transparent 72%),
          linear-gradient(180deg,var(--home-theme-panel),var(--home-theme-page)) !important;
        border-color:rgba(var(--home-view-rgb),.15) !important;
        box-shadow:0 8px 24px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.025) !important;
      }
      html[data-home-blue-theme="true"] body .widget:hover,
      html[data-home-blue-theme="true"] body .sidebar-section:hover {
        border-color:rgba(var(--home-view-rgb),.25) !important;
        box-shadow:0 12px 28px rgba(0,0,0,.28),0 0 18px rgba(var(--home-view-rgb),.045) !important;
      }
      html[data-home-blue-theme="true"] body .cal-cell {
        background:linear-gradient(180deg,rgba(var(--home-view-rgb),.05),rgba(var(--home-view-rgb),.018)) !important;
        border-color:rgba(var(--home-view-rgb),.115) !important;
      }
      html[data-home-blue-theme="true"] body .cal-cell.empty {
        background:transparent !important;
        border-color:transparent !important;
      }
      html[data-home-blue-theme="true"] body .cal-cell.selected {
        border-color:var(--home-view-accent) !important;
        box-shadow:0 0 0 2px rgba(var(--home-view-rgb),.20),0 0 18px rgba(var(--home-view-rgb),.08) !important;
      }
      html[data-home-blue-theme="true"] body .btn,
      html[data-home-blue-theme="true"] body .btn-xs,
      html[data-home-blue-theme="true"] body .badge {
        border-color:rgba(var(--home-view-rgb),.38) !important;
        background:rgba(var(--home-view-rgb),.09) !important;
        color:var(--home-view-accent-soft) !important;
      }
      html[data-home-blue-theme="true"] body .btn:hover,
      html[data-home-blue-theme="true"] body .btn-xs:hover {
        border-color:rgba(var(--home-view-rgb),.60) !important;
        background:rgba(var(--home-view-rgb),.16) !important;
        color:var(--home-view-accent-soft) !important;
        box-shadow:0 7px 18px rgba(var(--home-view-rgb),.10) !important;
      }
      html[data-home-blue-theme="true"] body .shopping-input,
      html[data-home-blue-theme="true"] body .todo-input,
      html[data-home-blue-theme="true"] body .todo-member-sel {
        background:rgba(var(--home-view-rgb),.028) !important;
        border-color:rgba(var(--home-view-rgb),.15) !important;
      }
      html[data-home-blue-theme="true"] body .shopping-input:focus,
      html[data-home-blue-theme="true"] body .todo-input:focus,
      html[data-home-blue-theme="true"] body .todo-member-sel:focus {
        border-color:rgba(var(--home-view-rgb),.55) !important;
        box-shadow:0 0 0 2px rgba(var(--home-view-rgb),.11) !important;
      }
      html[data-home-blue-theme="true"] body .toggle input:checked + .toggle-slider {
        background:rgba(var(--home-view-rgb),.22) !important;
        border-color:rgba(var(--home-view-rgb),.55) !important;
      }
      html[data-home-blue-theme="true"] body .toggle input:checked + .toggle-slider::before {
        background:var(--home-view-accent) !important;
        box-shadow:0 0 8px rgba(var(--home-view-rgb),.40) !important;
      }
      html[data-home-blue-theme="true"] body input[type="checkbox"],
      html[data-home-blue-theme="true"] body input[type="radio"],
      html[data-home-blue-theme="true"] body input[type="range"] {
        accent-color:var(--home-view-accent) !important;
      }

      html[data-home-blue-theme="true"] body .transfer-popup-shell,
      html[data-home-blue-theme="true"] body .month-popup-shell,
      html[data-home-blue-theme="true"] body .transfer-person-card,
      html[data-home-blue-theme="true"] body .month-expense-section {
        background:
          radial-gradient(360px 130px at 50% 0,rgba(var(--home-view-rgb),.075),transparent 72%),
          linear-gradient(180deg,var(--home-theme-strong),var(--home-theme-panel)) !important;
        border-color:rgba(var(--home-view-rgb),.17) !important;
      }
      html[data-home-blue-theme="true"] body .transfer-row,
      html[data-home-blue-theme="true"] body .shopping-item,
      html[data-home-blue-theme="true"] body .event-item,
      html[data-home-blue-theme="true"] body .notif-row {
        border-color:rgba(var(--home-view-rgb),.105) !important;
      }

      html[data-home-blue-theme="true"] body .modal {
        background:
          radial-gradient(620px 220px at 50% -45px,rgba(var(--home-view-rgb),.13),transparent 70%),
          linear-gradient(180deg,var(--home-theme-strong),var(--home-theme-page)) !important;
        border-color:rgba(var(--home-view-rgb),.30) !important;
        box-shadow:0 26px 72px rgba(0,0,0,.58),0 0 38px rgba(var(--home-view-rgb),.09),inset 0 1px 0 rgba(255,255,255,.035) !important;
      }
      html[data-home-blue-theme="true"] body .form-group input,
      html[data-home-blue-theme="true"] body .form-group select,
      html[data-home-blue-theme="true"] body .form-group textarea,
      html[data-home-blue-theme="true"] body #event-end-panel-v2,
      html[data-home-blue-theme="true"] body .event-end-toggle-v2 {
        background-color:rgba(var(--home-view-rgb),.035) !important;
        border-color:rgba(var(--home-view-rgb),.14) !important;
      }
      html[data-home-blue-theme="true"] body .form-group input:focus,
      html[data-home-blue-theme="true"] body .form-group select:focus,
      html[data-home-blue-theme="true"] body .form-group textarea:focus {
        background-color:rgba(var(--home-view-rgb),.065) !important;
        border-color:rgba(var(--home-view-rgb),.58) !important;
        box-shadow:0 0 0 2px rgba(var(--home-view-rgb),.13) !important;
      }
      html[data-home-blue-theme="true"] body .modal-close,
      html[data-home-blue-theme="true"] body .transfer-close {
        background:rgba(var(--home-view-rgb),.045) !important;
        border-color:rgba(var(--home-view-rgb),.16) !important;
      }
      html[data-home-blue-theme="true"] body .modal-close:hover,
      html[data-home-blue-theme="true"] body .transfer-close:hover {
        color:var(--home-view-accent-soft) !important;
        background:rgba(var(--home-view-rgb),.11) !important;
        border-color:rgba(var(--home-view-rgb),.34) !important;
      }
      html[data-home-blue-theme="true"] body .flatpickr-calendar,
      html[data-home-blue-theme="true"] body .home-day-popover {
        background:
          radial-gradient(480px 170px at 50% 0,rgba(var(--home-view-rgb),.10),transparent 72%),
          linear-gradient(180deg,var(--home-theme-strong),var(--home-theme-page)) !important;
        border-color:rgba(var(--home-view-rgb),.28) !important;
        box-shadow:0 18px 48px rgba(0,0,0,.55),0 0 30px rgba(var(--home-view-rgb),.08) !important;
      }


      html.home-finance-orange-v3[data-home-blue-theme="true"] body.home-calendar-polish-v5 .app-header,
      html[data-home-blue-theme="true"] body .app-header {
        background:
          radial-gradient(560px 185px at 50% 108%,rgba(96,165,250,.13),transparent 70%),
          linear-gradient(180deg,var(--home-status-surface,#111B2A) 0,var(--home-status-surface,#111B2A) 3px,var(--home-theme-page) 100%) !important;
        border-bottom-color:rgba(96,165,250,.24) !important;
      }
      html.home-finance-orange-v3[data-home-blue-theme="true"] body.home-calendar-polish-v5 #event-modal .modal,
      html.home-finance-orange-v3[data-home-blue-theme="true"] body.home-calendar-polish-v5 .flatpickr-calendar,
      html.home-finance-orange-v3[data-home-blue-theme="true"] body.home-calendar-polish-v5 .home-day-popover {
        background:
          radial-gradient(560px 190px at 50% -30px,rgba(96,165,250,.13),transparent 70%),
          linear-gradient(180deg,var(--home-theme-strong),var(--home-theme-page)) !important;
        border-color:rgba(96,165,250,.30) !important;
      }
      html.home-finance-orange-v3[data-home-blue-theme="true"] body.home-calendar-polish-v5 #event-modal input[data-picker="date"] {
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360A5FA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='3'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E") !important;
      }
      html.home-finance-orange-v3[data-home-blue-theme="true"] body.home-calendar-polish-v5 #event-modal input[data-picker="time"] {
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360A5FA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpolyline points='12 7 12 12 15 14'/%3E%3C/svg%3E") !important;
      }

      .home-blue-theme-config-v1 {
        width:100%;
        display:flex;
        align-items:center;
        gap:10px;
        padding:11px 16px;
        border:0;
        border-bottom:1px solid rgba(255,255,255,.035);
        background:transparent;
        color:#C9D1DC;
        font:500 13px/1.35 'Inter',sans-serif;
        text-align:left;
        cursor:pointer;
      }
      .home-blue-theme-config-v1:hover,
      .home-blue-theme-config-v1.is-on {
        background:var(--accent-dim);
        color:var(--accent);
      }
      .home-blue-theme-check-v1 {
        margin-left:auto;
        color:var(--accent);
        font-size:14px;
        font-weight:900;
      }

      html.home-finance-orange-v3 body::after {
        content:"";
        display:block;
        position:fixed;
        inset:0;
        z-index:2147483600;
        pointer-events:none;
        background:var(--home-brightness-overlay,rgba(0,0,0,0));
        transition:background .08s linear;
      }
      .home-brightness-control-v1 {
        padding:11px 14px 13px;
        border-top:1px solid rgba(255,255,255,.035);
        background:rgba(var(--home-view-rgb),.018);
      }
      .home-brightness-head-v1 {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:9px;
        color:#C9D1DC;
        font:700 11px/1.2 'Inter',sans-serif;
      }
      .home-brightness-output-v1 {
        color:var(--home-view-accent-soft);
        font-size:10px;
        font-variant-numeric:tabular-nums;
      }
      .home-brightness-row-v1 {
        display:grid;
        grid-template-columns:18px minmax(0,1fr) 20px;
        align-items:center;
        gap:8px;
        color:var(--text-sec,#8B949E);
        font-size:14px;
      }
      .home-brightness-range-v1 {
        --range-rest:rgba(255,255,255,.13);
        width:100%;
        height:6px;
        margin:7px 0;
        padding:0;
        border:0;
        border-radius:999px;
        appearance:none;
        -webkit-appearance:none;
        outline:none;
        cursor:pointer;
        background:linear-gradient(90deg,var(--home-view-accent) 0 var(--home-brightness-progress,50%),var(--range-rest) var(--home-brightness-progress,50%) 100%);
        box-shadow:inset 0 1px 2px rgba(0,0,0,.45),0 0 10px rgba(var(--home-view-rgb),.055);
      }
      .home-brightness-range-v1::-webkit-slider-thumb {
        width:21px;
        height:21px;
        border:2px solid rgba(var(--home-view-rgb),.68);
        border-radius:50%;
        appearance:none;
        -webkit-appearance:none;
        background:#FFF8E9;
        box-shadow:0 1px 4px rgba(0,0,0,.42),0 0 8px rgba(var(--home-view-rgb),.42);
      }
      .home-brightness-range-v1::-moz-range-thumb {
        width:18px;
        height:18px;
        border:2px solid rgba(var(--home-view-rgb),.68);
        border-radius:50%;
        background:#FFF8E9;
        box-shadow:0 1px 4px rgba(0,0,0,.42),0 0 8px rgba(var(--home-view-rgb),.42);
      }

      html body .home-day-popover {
        background:
          linear-gradient(180deg,rgba(var(--home-view-rgb),.05),rgba(var(--home-view-rgb),.014)),
          rgba(15,18,25,.985) !important;
        border-color:rgba(var(--home-view-rgb),.26) !important;
        border-radius:10px !important;
        box-shadow:0 8px 20px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.025) !important;
      }
      html[data-home-blue-theme="true"] body .home-day-popover {
        background:
          linear-gradient(180deg,rgba(var(--home-view-rgb),.065),rgba(var(--home-view-rgb),.018)),
          var(--home-theme-page) !important;
      }
      html body .home-day-popover-week,
      html body .day-panel-week {
        color:var(--home-view-accent-soft) !important;
        border-color:rgba(var(--home-view-rgb),.28) !important;
        background:rgba(var(--home-view-rgb),.075) !important;
      }

      html body .header-time {
        color:var(--home-view-accent) !important;
        text-shadow:0 2px 10px rgba(var(--home-view-rgb),.20) !important;
      }
      html body .header-date {
        color:#93C5FD !important;
        text-shadow:0 1px 8px rgba(96,165,250,.14) !important;
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
          linear-gradient(180deg,var(--home-status-surface,#0F1219) 0,var(--home-status-surface,#0F1219) 3px,rgba(var(--home-view-rgb),.052) 100%) !important;
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
    `;
    document.head.appendChild(style);
  }

  function installBlueThemeConfig() {
    var menu = document.getElementById('nav-menu');
    if (!menu || document.getElementById('home-blue-theme-config-v1')) {
      updateBlueThemeConfig();
      return;
    }

    var separator = document.createElement('div');
    separator.className = 'nav-sep';
    separator.setAttribute('data-home-blue-theme-separator-v1','true');

    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'home-blue-theme-config-v1';
    button.className = 'home-blue-theme-config-v1';
    button.setAttribute('aria-pressed','false');
    button.innerHTML = '<span class="nav-icon" aria-hidden="true">🔵</span><span>Blått tema</span><span class="home-blue-theme-check-v1" aria-hidden="true"></span>';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      menu.classList.remove('show');
      setBlueTheme(!blueThemeEnabled());
    });

    menu.appendChild(separator);
    menu.appendChild(button);
    updateBlueThemeConfig();
  }

  function installBrightnessControl() {
    var menu = document.getElementById('nav-menu');
    var existing = document.getElementById('home-brightness-control-v1');
    if (!menu || existing) {
      updateBrightnessControl(brightnessValue());
      return;
    }

    var panel = document.createElement('div');
    panel.id = 'home-brightness-control-v1';
    panel.className = 'home-brightness-control-v1';
    panel.innerHTML =
      '<div class="home-brightness-head-v1"><span>Ljusstyrka</span><output class="home-brightness-output-v1" id="home-brightness-output-v1">100%</output></div>' +
      '<div class="home-brightness-row-v1"><span aria-hidden="true">☾</span><input class="home-brightness-range-v1" id="home-brightness-range-v1" type="range" min="' + BRIGHTNESS_MIN + '" max="' + BRIGHTNESS_MAX + '" step="1" value="100" aria-label="Justera sidans ljusstyrka"><span aria-hidden="true">☀</span></div>';

    ['click','pointerdown','touchstart'].forEach(function (type) {
      panel.addEventListener(type,function (event) { event.stopPropagation(); }, { passive:type === 'touchstart' });
    });

    var input = panel.querySelector('input[type="range"]');
    input.addEventListener('input',function () { applyBrightness(input.value,true); });
    input.addEventListener('change',function () { applyBrightness(input.value,true); });

    menu.appendChild(panel);
    updateBrightnessControl(brightnessValue());
  }

  window.__homeBlueThemeConfigV1 = {
    enabled:blueThemeEnabled,
    setEnabled:setBlueTheme
  };
  window.__homeBrightnessV1 = {
    value:brightnessValue,
    setValue:function (value) { applyBrightness(value,true); }
  };

  /* This is the sole Home theme/status authority. No legacy Home patch loads it. */
  migrateThemeChoice();

  /* Critical palette CSS and root variables must exist before first paint. */
  addOverrideStyles();
  applyPalette();

  function start() {
    addOverrideStyles();
    applyPalette();
    installBlueThemeConfig();
    installBrightnessControl();
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
