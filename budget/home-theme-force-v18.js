(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  if (!isHome || window.__homeThemeForceV18Installed) return;
  window.__homeThemeForceV18Installed = true;

  var palettes = {
    day:   { accent:'#60A5FA', soft:'#93C5FD', rgb:'96,165,250' },
    week:  { accent:'#4ADE80', soft:'#86EFAC', rgb:'74,222,128' },
    month: { accent:'#FB923C', soft:'#FDBA74', rgb:'251,146,60' }
  };

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

  function applyPalette() {
    var view = currentView();
    var p = palettes[view];
    var root = document.documentElement;
    var body = document.body;
    root.dataset.homeCalendarView = view;
    setVars(root, p);
    setVars(body, p);
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
    `;
    document.head.appendChild(style);
  }

  /* Critical palette CSS and root variables must exist before first paint. */
  addOverrideStyles();
  applyPalette();

  function start() {
    addOverrideStyles();
    applyPalette();
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
