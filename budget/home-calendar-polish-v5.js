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

      /* Lighter warm-charcoal header with a slightly mottled gradient. */
      body.home-calendar-polish-v5 .app-header {
        justify-content:center !important;
        text-align:center !important;
        min-height:82px !important;
        position:sticky !important;
        background:
          radial-gradient(360px 150px at 18% 4%, rgba(251,191,36,.055), transparent 70%),
          radial-gradient(300px 150px at 72% 0%, rgba(255,255,255,.040), transparent 72%),
          radial-gradient(240px 120px at 42% 112%, rgba(251,146,60,.038), transparent 74%),
          linear-gradient(180deg,rgba(31,29,30,.985),rgba(21,22,26,.955)) !important;
        border-bottom:0 !important;
        box-shadow:0 4px 16px rgba(0,0,0,.19), inset 0 -1px 0 rgba(255,255,255,.015) !important;
        backdrop-filter:blur(14px) !important;
        -webkit-backdrop-filter:blur(14px) !important;
      }
      body.home-calendar-polish-v5 .app-header::after {
        content:'';
        position:absolute;
        left:5%;
        right:5%;
        bottom:0;
        height:1px;
        pointer-events:none;
        background:linear-gradient(90deg,transparent,rgba(251,146,60,.055) 24%,rgba(255,255,255,.065) 50%,rgba(251,146,60,.055) 76%,transparent);
        opacity:.72;
      }
      body.home-calendar-polish-v5 .filter-bar {
        background:linear-gradient(180deg,rgba(21,22,26,.92),rgba(15,18,25,.88)) !important;
        border-bottom:1px solid rgba(255,255,255,.050) !important;
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
        background:linear-gradient(180deg, rgba(255,255,255,.040), rgba(255,255,255,.022)) !important;
        border-color:rgba(255,255,255,.080) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.020), 0 8px 22px rgba(0,0,0,.13);
      }
      body.home-calendar-polish-v5 #shopping-widget {
        border-color:rgba(74,222,128,.11) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.020), 0 8px 22px rgba(0,0,0,.13), 0 0 18px rgba(74,222,128,.022);
      }
      body.home-calendar-polish-v5 #transfer-widget {
        border-color:rgba(251,146,60,.14) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.020), 0 8px 22px rgba(0,0,0,.13), 0 0 18px rgba(251,146,60,.032);
      }
      body.home-calendar-polish-v5 .link-card {
        transition:transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease !important;
      }
      body.home-calendar-polish-v5 .link-card:hover {
        transform:translateY(-1px);
        background:linear-gradient(180deg, rgba(255,255,255,.052), rgba(255,255,255,.028)) !important;
      }

      body.home-calendar-polish-v5 .cal-cell {
        background:rgba(255,255,255,.024) !important;
        border-color:rgba(255,255,255,.055) !important;
        box-shadow:none !important;
      }
      body.home-calendar-polish-v5 .cal-cell:hover {
        border-color:rgba(251,146,60,.16) !important;
        background:rgba(251,146,60,.030) !important;
      }
      body.home-calendar-polish-v5 .cal-cell.has-events:hover {
        border-color:rgba(251,191,36,.34) !important;
        background:rgba(251,146,60,.050) !important;
        box-shadow:0 6px 16px rgba(0,0,0,.20), 0 0 12px rgba(251,146,60,.025) !important;
      }
      body.home-calendar-polish-v5 .cal-cell.today {
        border-color:rgba(251,191,36,.62) !important;
        background:linear-gradient(180deg, rgba(251,191,36,.090), rgba(251,146,60,.035)) !important;
        box-shadow:inset 0 0 0 1px rgba(251,191,36,.055), 0 0 13px rgba(251,146,60,.030) !important;
      }
      body.home-calendar-polish-v5 .cal-wd {
        color:#8F97A3 !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav button,
      body.home-calendar-polish-v5 .btn-xs {
        background:rgba(255,255,255,.040) !important;
        border-color:rgba(251,146,60,.14) !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav button:hover,
      body.home-calendar-polish-v5 .btn-xs:hover {
        background:rgba(251,146,60,.075) !important;
        border-color:rgba(251,146,60,.24) !important;
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
        min-height:50px;
        text-align:center !important;
      }
      body.home-calendar-polish-v5 .brand-text h1 {
        font-size:23px !important;
        line-height:29px !important;
        letter-spacing:-.40px !important;
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

      body.home-calendar-polish-v5 .app-header .nav-btn {
        width:36px !important;
        height:36px !important;
        border-radius:10px !important;
        background:linear-gradient(180deg,rgba(255,255,255,.052),rgba(255,255,255,.026)) !important;
        border:1px solid rgba(251,146,60,.16) !important;
        color:#E8E3DD !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 4px 14px rgba(0,0,0,.14) !important;
      }
      body.home-calendar-polish-v5 .app-header .nav-btn:hover {
        background:rgba(251,146,60,.075) !important;
        border-color:rgba(251,146,60,.26) !important;
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

      body.home-calendar-polish-v5 #notif-panel,
      body.home-calendar-polish-v5 #push-mobile-bell {
        display:none !important;
      }

      /* The bell itself is the moving object in the notification switch. */
      body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 {
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        position:absolute !important;
        left:24px !important;
        bottom:7px !important;
        z-index:4 !important;
        width:42px !important;
        min-width:42px !important;
        max-width:42px !important;
        height:22px !important;
        min-height:22px !important;
        margin:0 !important;
        padding:0 !important;
        border-radius:999px !important;
        border:1px solid rgba(255,255,255,.18) !important;
        background:rgba(255,255,255,.060) !important;
        box-shadow:inset 0 1px 3px rgba(0,0,0,.30),0 1px 3px rgba(0,0,0,.15) !important;
        cursor:pointer !important;
        font-size:0 !important;
        line-height:0 !important;
        transition:background .18s ease,border-color .18s ease,box-shadow .18s ease !important;
      }
      body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 .home-notif-knob-v7 {
        position:absolute;
        left:1px;
        top:1px;
        width:18px;
        height:18px;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#A7AFBA;
        background:transparent;
        box-shadow:none;
        transform:translateX(0);
        transition:transform .18s cubic-bezier(.2,.8,.2,1),color .18s ease,filter .18s ease;
      }
      body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 .home-notif-bell-v8 {
        width:14px;
        height:14px;
        display:block;
        stroke:currentColor;
      }
      body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on {
        background:rgba(251,146,60,.18) !important;
        border-color:rgba(251,146,60,.48) !important;
        box-shadow:inset 0 0 0 1px rgba(251,146,60,.035),0 0 10px rgba(251,146,60,.070) !important;
      }
      body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on .home-notif-knob-v7 {
        transform:translateX(20px);
        color:#FBBF24;
        filter:drop-shadow(0 0 4px rgba(251,191,36,.32));
      }

      body.home-calendar-polish-v5 .main-layout {
        padding-top:1.15rem !important;
      }
      body.home-calendar-polish-v5 .cal-section {
        padding-top:40px !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 {
        position:absolute !important;
        top:0 !important;
        left:0 !important;
        right:24px !important;
        width:auto !important;
        min-height:34px !important;
        padding:0 0 5px !important;
        margin:0 !important;
        align-items:center !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .cal-week-number,
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .calendar-week-number-v2 {
        font-size:12px !important;
        letter-spacing:.55px !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav {
        margin:0 0 0 auto !important;
        justify-content:flex-end !important;
        flex:0 0 auto !important;
        gap:6px !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav button {
        width:29px !important;
        height:29px !important;
        font-size:14px !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 #month-label {
        font-size:12px !important;
        padding:0 6px !important;
        color:#FDBA74 !important;
        text-shadow:0 1px 7px rgba(251,146,60,.07) !important;
      }

      body.home-calendar-polish-v5.calendar-ui-v2 .fab,
      body.home-calendar-polish-v5 .fab {
        width:50px !important;
        height:50px !important;
        min-width:50px !important;
        min-height:50px !important;
        background:rgba(18,22,30,.97) !important;
        color:#FBBF24 !important;
        border:1px solid rgba(251,191,36,.42) !important;
        font-size:24px !important;
        box-shadow:0 9px 22px rgba(0,0,0,.28),0 0 22px rgba(251,146,60,.13) !important;
      }
      body.home-calendar-polish-v5.calendar-ui-v2 .fab:hover,
      body.home-calendar-polish-v5 .fab:hover {
        background:rgba(251,146,60,.090) !important;
        border-color:rgba(251,191,36,.58) !important;
        box-shadow:0 10px 24px rgba(0,0,0,.30),0 0 26px rgba(251,146,60,.18) !important;
      }

      @media (max-width:768px) {
        body.home-calendar-polish-v5 .app-header {
          min-height:80px !important;
        }
        body.home-calendar-polish-v5 .brand {
          max-width:calc(100% - 130px) !important;
        }
        body.home-calendar-polish-v5 .brand-text h1 {
          font-size:21px !important;
          line-height:27px !important;
          letter-spacing:-.35px !important;
        }
        body.home-calendar-polish-v5 .brand-text p {
          margin-top:1px !important;
          font-size:12.5px !important;
        }
        body.home-calendar-polish-v5 .filter-bar {
          padding-bottom:6px !important;
        }
        body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 {
          left:16px !important;
          bottom:7px !important;
          width:40px !important;
          min-width:40px !important;
          max-width:40px !important;
          height:21px !important;
          min-height:21px !important;
        }
        body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 .home-notif-knob-v7 {
          width:17px;
          height:17px;
        }
        body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 .home-notif-bell-v8 {
          width:13px;
          height:13px;
        }
        body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on .home-notif-knob-v7 {
          transform:translateX(19px);
        }
        body.home-calendar-polish-v5 .main-layout {
          padding-top:1rem !important;
        }
        body.home-calendar-polish-v5 .cal-section {
          padding-top:38px !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 {
          right:0 !important;
          min-height:32px !important;
          padding-bottom:4px !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 .cal-week-number,
        body.home-calendar-polish-v5 .calendar-toolbar-v2 .calendar-week-number-v2 {
          font-size:11px !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav {
          margin:0 0 0 auto !important;
          gap:5px !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav button {
          width:28px !important;
          height:28px !important;
          font-size:14px !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 #month-label {
          font-size:11.5px !important;
          padding:0 4px !important;
        }
        body.home-calendar-polish-v5.calendar-ui-v2 .fab,
        body.home-calendar-polish-v5 .fab {
          width:48px !important;
          height:48px !important;
          min-width:48px !important;
          min-height:48px !important;
          font-size:23px !important;
          box-shadow:0 9px 22px rgba(0,0,0,.28),0 0 24px rgba(251,146,60,.15) !important;
        }
      }

      @media (max-width:390px) {
        body.home-calendar-polish-v5 .brand {
          max-width:calc(100% - 112px) !important;
        }
        body.home-calendar-polish-v5 .brand-text h1 {
          font-size:19px !important;
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
    var button = document.querySelector('.app-header .home-notif-switch-v7');
    if (!button) return;
    var checkbox = document.getElementById('notif-enabled');
    var enabled = checkbox ? !!checkbox.checked : storedNotificationEnabled();
    button.classList.toggle('is-on', enabled);
    button.setAttribute('aria-checked', enabled ? 'true' : 'false');
    button.setAttribute('title', enabled ? 'Notiser: På' : 'Notiser: Av');
  }

  function setupNotificationSwitch() {
    var header = document.querySelector('.app-header');
    if (!header) return;

    var button = header.querySelector('.btn-notif.home-notif-switch-v7') ||
      document.querySelector('.filter-bar .btn-notif') ||
      document.querySelector('.btn-notif');
    if (!button) {
      button = document.createElement('button');
      button.className = 'btn-notif';
    }

    document.querySelectorAll('.app-header .btn-notif, .filter-bar .btn-notif').forEach(function (extra) {
      if (extra !== button) extra.remove();
    });

    button.removeAttribute('onclick');
    button.classList.remove('home-notif-toggle-v6','is-open');
    button.classList.add('home-notif-switch-v7');
    button.type = 'button';
    button.setAttribute('role','switch');
    button.setAttribute('aria-label','Notiser');
    button.setAttribute('aria-expanded','false');
    if (!button.querySelector('.home-notif-bell-v8')) {
      button.innerHTML = '<span class="home-notif-knob-v7" aria-hidden="true"><svg class="home-notif-bell-v8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>';
    }
    if (button.parentElement !== header) header.appendChild(button);

    if (!button.__homeNotifSwitchV7Bound) {
      button.__homeNotifSwitchV7Bound = true;
      button.addEventListener('click',function (event) {
        event.preventDefault();
        event.stopPropagation();
        var checkbox = document.getElementById('notif-enabled');
        if (!checkbox) {
          setTimeout(setupNotificationSwitch,100);
          return;
        }
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