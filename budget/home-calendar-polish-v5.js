(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  if (!isHome) return;

  function addStyles() {
    if (document.getElementById('home-calendar-polish-v5-style')) return;
    var style = document.createElement('style');
    style.id = 'home-calendar-polish-v5-style';
    style.textContent = `
      body.home-calendar-polish-v5 #day-panel {
        display:none !important;
      }

      html,
      body.home-calendar-polish-v5 {
        background:#0F1219 !important;
      }
      body.home-calendar-polish-v5::before {
        background:
          radial-gradient(900px 380px at 50% -110px, rgba(251,146,60,.13), transparent 67%),
          radial-gradient(700px 320px at 12% 44%, rgba(56,189,248,.035), transparent 72%) !important;
      }

      /* Slightly taller, calmer header. Keep the header and filter strip close
         in tone so they read as one continuous top section. */
      body.home-calendar-polish-v5 .app-header {
        justify-content:center !important;
        text-align:center !important;
        min-height:76px !important;
        position:sticky !important;
        background:rgba(15,18,25,.94) !important;
        border-bottom:1px solid rgba(255,255,255,.055) !important;
        box-shadow:0 4px 16px rgba(0,0,0,.20), inset 0 -1px 0 rgba(251,146,60,.025) !important;
        backdrop-filter:blur(14px) !important;
        -webkit-backdrop-filter:blur(14px) !important;
      }
      body.home-calendar-polish-v5 .filter-bar {
        background:rgba(15,18,25,.86) !important;
        border-bottom:1px solid rgba(255,255,255,.06) !important;
        padding-top:9px !important;
        padding-bottom:7px !important;
        backdrop-filter:blur(12px);
        -webkit-backdrop-filter:blur(12px);
      }

      body.home-calendar-polish-v5 #shopping-widget .widget-title,
      body.home-calendar-polish-v5 #transfer-widget .widget-title {
        color:#FBBF24 !important;
        text-shadow:0 2px 10px rgba(251,191,36,.16);
      }

      body.home-calendar-polish-v5 .sidebar-section,
      body.home-calendar-polish-v5 .widget {
        background:linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.024)) !important;
        border-color:rgba(255,255,255,.095) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025), 0 10px 28px rgba(0,0,0,.16);
      }
      body.home-calendar-polish-v5 #shopping-widget {
        border-color:rgba(74,222,128,.14) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025), 0 10px 28px rgba(0,0,0,.16), 0 0 24px rgba(74,222,128,.035);
      }
      body.home-calendar-polish-v5 #transfer-widget {
        border-color:rgba(251,146,60,.18) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025), 0 10px 28px rgba(0,0,0,.16), 0 0 24px rgba(251,146,60,.05);
      }
      body.home-calendar-polish-v5 .link-card {
        transition:transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease !important;
      }
      body.home-calendar-polish-v5 .link-card:hover {
        transform:translateY(-1px);
        background:linear-gradient(180deg, rgba(255,255,255,.058), rgba(255,255,255,.03)) !important;
      }

      body.home-calendar-polish-v5 .cal-cell {
        background:rgba(255,255,255,.032) !important;
        border-color:rgba(255,255,255,.075) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.014);
      }
      body.home-calendar-polish-v5 .cal-cell:hover {
        border-color:rgba(251,146,60,.22) !important;
        background:rgba(251,146,60,.045) !important;
      }
      body.home-calendar-polish-v5 .cal-cell.has-events:hover {
        border-color:rgba(251,191,36,.45) !important;
        background:rgba(251,146,60,.07) !important;
        box-shadow:0 7px 20px rgba(0,0,0,.24), 0 0 18px rgba(251,146,60,.045) !important;
      }
      body.home-calendar-polish-v5 .cal-cell.today {
        border-color:rgba(251,191,36,.72) !important;
        background:linear-gradient(180deg, rgba(251,191,36,.105), rgba(251,146,60,.045)) !important;
        box-shadow:inset 0 0 0 1px rgba(251,191,36,.08), 0 0 20px rgba(251,146,60,.04);
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav button,
      body.home-calendar-polish-v5 .btn-xs {
        background:rgba(255,255,255,.045) !important;
        border-color:rgba(251,146,60,.18) !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav button:hover,
      body.home-calendar-polish-v5 .btn-xs:hover {
        background:rgba(251,146,60,.10) !important;
        border-color:rgba(251,146,60,.30) !important;
      }

      body.home-calendar-polish-v5 .brand {
        position:absolute !important;
        left:50% !important;
        top:50% !important;
        transform:translate(-50%,-50%) !important;
        margin:0 !important;
        width:max-content !important;
        min-width:0;
        max-width:calc(100% - 150px);
        justify-content:center !important;
        z-index:1;
      }
      body.home-calendar-polish-v5 .brand-text {
        min-width:0;
        position:relative;
        min-height:48px;
        text-align:center !important;
      }
      body.home-calendar-polish-v5 .brand-text h1 {
        font-size:22px !important;
        line-height:27px !important;
        letter-spacing:-.45px !important;
        white-space:nowrap !important;
        text-align:center !important;
      }
      body.home-calendar-polish-v5 .brand-text p {
        position:static !important;
        margin-top:1px !important;
        font-size:13px !important;
        line-height:1.25 !important;
        white-space:nowrap;
        text-align:center !important;
      }

      body.home-calendar-polish-v5 .app-header .nav-dropdown-wrapper {
        z-index:3 !important;
      }

      /* Keep the Home glass/amber language for the hamburger menu. */
      body.home-calendar-polish-v5 .app-header .nav-btn {
        background:linear-gradient(180deg,rgba(255,255,255,.048),rgba(255,255,255,.028)) !important;
        border:1px solid rgba(251,146,60,.15) !important;
        color:#E8E3DD !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.028),0 5px 18px rgba(0,0,0,.16) !important;
      }
      body.home-calendar-polish-v5 .app-header .nav-btn:hover {
        background:rgba(251,146,60,.085) !important;
        border-color:rgba(251,146,60,.28) !important;
        color:#FDBA74 !important;
      }
      body.home-calendar-polish-v5 .app-header .nav-dropdown-menu {
        top:calc(100% + 10px) !important;
        background:linear-gradient(180deg,rgba(20,23,30,.98),rgba(15,18,25,.985)) !important;
        border:1px solid rgba(251,146,60,.16) !important;
        border-radius:14px !important;
        box-shadow:0 18px 46px rgba(0,0,0,.46),0 0 28px rgba(251,146,60,.035),inset 0 1px 0 rgba(255,255,255,.025) !important;
        backdrop-filter:blur(18px) !important;
        -webkit-backdrop-filter:blur(18px) !important;
        overflow:hidden !important;
      }
      body.home-calendar-polish-v5 .app-header .nav-dropdown-menu a {
        color:#C7CDD6 !important;
        border-bottom-color:rgba(255,255,255,.04) !important;
        background:transparent !important;
      }
      body.home-calendar-polish-v5 .app-header .nav-dropdown-menu a:hover,
      body.home-calendar-polish-v5 .app-header .nav-dropdown-menu a.active {
        background:linear-gradient(90deg,rgba(251,146,60,.11),rgba(251,146,60,.035)) !important;
        color:#FDBA74 !important;
      }
      body.home-calendar-polish-v5 .app-header .nav-dropdown-menu .nav-sep {
        border-top-color:rgba(251,146,60,.10) !important;
      }

      /* The old notification settings panel and mobile bell are no longer UI. */
      body.home-calendar-polish-v5 #notif-panel,
      body.home-calendar-polish-v5 #push-mobile-bell {
        display:none !important;
      }

      /* Compact notification on/off switch in the original filter-bar slot. */
      body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7 {
        margin-left:auto !important;
        margin-right:1px !important;
        margin-bottom:-1px !important;
        transform:translateY(2px);
        position:relative !important;
        width:34px !important;
        min-width:34px !important;
        height:18px !important;
        padding:0 !important;
        border-radius:999px !important;
        border:1px solid rgba(255,255,255,.12) !important;
        background:rgba(255,255,255,.07) !important;
        box-shadow:inset 0 1px 2px rgba(0,0,0,.22) !important;
        cursor:pointer !important;
        font-size:0 !important;
        line-height:0 !important;
        transition:background .18s ease,border-color .18s ease,box-shadow .18s ease !important;
      }
      body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7 .home-notif-knob-v7 {
        position:absolute;
        left:2px;
        top:2px;
        width:12px;
        height:12px;
        border-radius:50%;
        background:#7D8794;
        box-shadow:0 1px 3px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.22);
        transform:translateX(0);
        transition:transform .18s cubic-bezier(.2,.8,.2,1),background .18s ease,box-shadow .18s ease;
      }
      body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7.is-on {
        background:rgba(251,146,60,.18) !important;
        border-color:rgba(251,146,60,.42) !important;
        box-shadow:inset 0 0 0 1px rgba(251,146,60,.035),0 0 10px rgba(251,146,60,.035) !important;
      }
      body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7.is-on .home-notif-knob-v7 {
        transform:translateX(16px);
        background:#FDBA74;
        box-shadow:0 1px 4px rgba(0,0,0,.34),0 0 7px rgba(251,146,60,.12);
      }

      body.home-calendar-polish-v5 .cal-section {
        padding-top:42px !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 {
        position:absolute !important;
        top:0 !important;
        left:0 !important;
        right:24px !important;
        width:auto !important;
        min-height:34px !important;
        padding:0 !important;
        margin:0 !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .cal-week-number,
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .calendar-week-number-v2 {
        font-size:12px !important;
        letter-spacing:.6px !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav {
        margin:0 0 0 auto !important;
        justify-content:flex-end !important;
        flex:0 0 auto !important;
        gap:5px !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav button {
        width:30px !important;
        height:30px !important;
        font-size:14px !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 #month-label {
        font-size:12px !important;
        padding:0 6px !important;
        color:#FDBA74 !important;
        text-shadow:0 2px 10px rgba(251,146,60,.16);
      }

      @media (max-width:768px) {
        body.home-calendar-polish-v5 .app-header {
          min-height:74px !important;
        }
        body.home-calendar-polish-v5 .brand {
          max-width:calc(100% - 130px) !important;
        }
        body.home-calendar-polish-v5 .brand-text h1 {
          font-size:20px !important;
          line-height:25px !important;
          letter-spacing:-.35px !important;
        }
        body.home-calendar-polish-v5 .brand-text p {
          margin-top:1px !important;
          font-size:12.5px !important;
        }
        body.home-calendar-polish-v5 .filter-bar {
          padding-bottom:6px !important;
        }
        body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7 {
          width:32px !important;
          min-width:32px !important;
          height:17px !important;
        }
        body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7 .home-notif-knob-v7 {
          width:11px;
          height:11px;
        }
        body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7.is-on .home-notif-knob-v7 {
          transform:translateX(15px);
        }
        body.home-calendar-polish-v5 .cal-section {
          padding-top:39px !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 {
          right:0 !important;
          min-height:32px !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 .cal-week-number,
        body.home-calendar-polish-v5 .calendar-toolbar-v2 .calendar-week-number-v2 {
          font-size:11px !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav {
          margin:0 0 0 auto !important;
          gap:4px !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav button {
          width:29px !important;
          height:29px !important;
          font-size:14px !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 #month-label {
          font-size:11.5px !important;
          padding:0 4px !important;
        }
      }

      @media (max-width:390px) {
        body.home-calendar-polish-v5 .brand {
          max-width:calc(100% - 112px) !important;
        }
        body.home-calendar-polish-v5 .brand-text h1 {
          font-size:18px !important;
        }
        body.home-calendar-polish-v5 .brand-text p {
          font-size:12px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getDayEvents(dateISO) {
    try {
      var p = String(dateISO || '').split('-').map(Number);
      var year = p[0];
      var month = p[1] - 1;
      if (!year || month < 0) return [];
      var events = typeof window.getEvents === 'function' ? (window.getEvents() || []) : [];
      if (typeof window.expandRepeating === 'function') {
        events = window.expandRepeating(events, year, month) || [];
      }
      return events.filter(function (ev) {
        if (!ev || ev.date !== dateISO) return false;
        return typeof window.isEventVisible === 'function' ? window.isEventVisible(ev) : true;
      });
    } catch (e) {
      return [];
    }
  }

  function selectDayAsOverview(dateISO) {
    try { window.selectedDate = dateISO; } catch (e) {}

    var panel = document.getElementById('day-panel');
    if (panel) panel.classList.remove('show');

    var dateInput = document.getElementById('ev-date');
    if (dateInput) dateInput.value = dateISO;

    try { if (typeof window.renderMonth === 'function') window.renderMonth(); } catch (e) {}

    setTimeout(function () {
      var anchor = document.querySelector('.cal-cell[data-date="' + dateISO + '"]');
      if (!anchor || typeof window.openDayEventsPopup !== 'function') return;
      window.openDayEventsPopup(dateISO, getDayEvents(dateISO).slice(0, 5), anchor);
    }, 0);
  }

  function storedNotificationEnabled() {
    try {
      var settings = JSON.parse(localStorage.getItem('cal_push_settings_v1') || 'null');
      return !!(settings && settings.enabled);
    } catch (_) {
      return false;
    }
  }

  function syncNotificationSwitch() {
    var button = document.querySelector('.filter-bar .btn-notif.home-notif-switch-v7');
    if (!button) return;
    var checkbox = document.getElementById('notif-enabled');
    var enabled = checkbox ? !!checkbox.checked : storedNotificationEnabled();
    button.classList.toggle('is-on', enabled);
    button.setAttribute('aria-checked', enabled ? 'true' : 'false');
    button.setAttribute('title', enabled ? 'Notiser: På' : 'Notiser: Av');
  }

  function setupNotificationSwitch() {
    var button = document.querySelector('.btn-notif');
    var filter = document.querySelector('.filter-bar');
    if (!button || !filter) return;

    button.removeAttribute('onclick');
    button.classList.remove('home-notif-toggle-v6','is-open');
    button.classList.add('home-notif-switch-v7');
    button.type = 'button';
    button.setAttribute('role','switch');
    button.setAttribute('aria-label','Notiser');
    button.setAttribute('aria-expanded','false');
    button.innerHTML = '<span class="home-notif-knob-v7" aria-hidden="true"></span>';
    if (button.parentElement !== filter) filter.appendChild(button);

    if (!button.__homeNotifSwitchV7Bound) {
      button.__homeNotifSwitchV7Bound = true;
      button.addEventListener('click',function (event) {
        event.preventDefault();
        event.stopPropagation();
        var checkbox = document.getElementById('notif-enabled');
        if (!checkbox) return;
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change',{bubbles:true}));
        syncNotificationSwitch();
        setTimeout(syncNotificationSwitch,250);
        setTimeout(syncNotificationSwitch,1200);
      });
    }

    var panel = document.getElementById('notif-panel');
    if (panel) panel.classList.remove('show');
    var mobileBell = document.getElementById('push-mobile-bell');
    if (mobileBell) mobileBell.remove();
    syncNotificationSwitch();
  }

  function install() {
    if (window.__homeCalendarPolishV5Installed) return;
    if (!document.querySelector('.cal-section') || typeof window.selectDay !== 'function') {
      setTimeout(install, 60);
      return;
    }

    window.__homeCalendarPolishV5Installed = true;
    document.body.classList.add('home-calendar-polish-v5');
    addStyles();
    window.selectDay = selectDayAsOverview;
    setupNotificationSwitch();

    var panel = document.getElementById('day-panel');
    if (panel) panel.classList.remove('show');

    setInterval(function () {
      setupNotificationSwitch();
      syncNotificationSwitch();
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 40); }, { once:true });
  } else {
    setTimeout(install, 40);
  }
})();