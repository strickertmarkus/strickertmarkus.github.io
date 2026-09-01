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

      /* Header: same family as the page, but without reading as a separate slab. */
      body.home-calendar-polish-v5 .app-header {
        justify-content:center !important;
        text-align:center !important;
        min-height:82px !important;
        position:sticky !important;
        background:
          radial-gradient(520px 115px at 50% 18%, rgba(251,146,60,.075), transparent 72%),
          linear-gradient(180deg,rgba(15,18,25,.98),rgba(17,19,25,.94)) !important;
        border-bottom:1px solid rgba(255,255,255,.045) !important;
        box-shadow:0 3px 14px rgba(0,0,0,.18), inset 0 -1px 0 rgba(251,146,60,.025) !important;
        backdrop-filter:blur(14px) !important;
        -webkit-backdrop-filter:blur(14px) !important;
      }
      body.home-calendar-polish-v5 .filter-bar {
        background:linear-gradient(180deg,rgba(17,19,25,.92),rgba(15,18,25,.88)) !important;
        border-bottom:1px solid rgba(255,255,255,.055) !important;
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

      /* Let the content cards sit back slightly so the information wins. */
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

      /* Quieter calendar grid: today is the one clear amber focal point. */
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

      /* Keep the Home glass/amber language for the hamburger menu. */
      body.home-calendar-polish-v5 .app-header .nav-btn {
        width:36px !important;
        height:36px !important;
        border-radius:10px !important;
        background:linear-gradient(180deg,rgba(255,255,255,.042),rgba(255,255,255,.024)) !important;
        border:1px solid rgba(251,146,60,.12) !important;
        color:#E8E3DD !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.024),0 4px 14px rgba(0,0,0,.13) !important;
      }
      body.home-calendar-polish-v5 .app-header .nav-btn:hover {
        background:rgba(251,146,60,.070) !important;
        border-color:rgba(251,146,60,.22) !important;
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
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        flex:0 0 38px !important;
        align-self:flex-end !important;
        margin-left:auto !important;
        margin-right:0 !important;
        margin-bottom:-3px !important;
        transform:none !important;
        position:relative !important;
        z-index:5 !important;
        width:38px !important;
        min-width:38px !important;
        max-width:38px !important;
        height:20px !important;
        min-height:20px !important;
        padding:0 !important;
        border-radius:999px !important;
        border:1px solid rgba(255,255,255,.16) !important;
        background:rgba(255,255,255,.095) !important;
        box-shadow:inset 0 1px 2px rgba(0,0,0,.24),0 1px 3px rgba(0,0,0,.16) !important;
        cursor:pointer !important;
        font-size:0 !important;
        line-height:0 !important;
        transition:background .18s ease,border-color .18s ease,box-shadow .18s ease !important;
      }
      body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7 .home-notif-knob-v7 {
        position:absolute;
        left:2px;
        top:2px;
        width:14px;
        height:14px;
        border-radius:50%;
        background:#A1A9B4;
        box-shadow:0 1px 3px rgba(0,0,0,.40),inset 0 1px 0 rgba(255,255,255,.28);
        transform:translateX(0);
        transition:transform .18s cubic-bezier(.2,.8,.2,1),background .18s ease,box-shadow .18s ease;
      }
      body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7.is-on {
        background:rgba(251,146,60,.24) !important;
        border-color:rgba(251,146,60,.55) !important;
        box-shadow:inset 0 0 0 1px rgba(251,146,60,.045),0 0 11px rgba(251,146,60,.055) !important;
      }
      body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7.is-on .home-notif-knob-v7 {
        transform:translateX(18px);
        background:#FDBA74;
        box-shadow:0 1px 4px rgba(0,0,0,.34),0 0 8px rgba(251,146,60,.16);
      }

      /* One compact calendar toolbar: week left, month controls right. */
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

      /* Smaller, dark floating add control so it no longer dominates cards. */
      body.home-calendar-polish-v5.calendar-ui-v2 .fab,
      body.home-calendar-polish-v5 .fab {
        width:46px !important;
        height:46px !important;
        min-width:46px !important;
        min-height:46px !important;
        background:rgba(18,22,30,.97) !important;
        color:#FBBF24 !important;
        border:1px solid rgba(251,191,36,.38) !important;
        font-size:23px !important;
        box-shadow:0 8px 20px rgba(0,0,0,.26),0 0 12px rgba(251,146,60,.035) !important;
      }
      body.home-calendar-polish-v5.calendar-ui-v2 .fab:hover,
      body.home-calendar-polish-v5 .fab:hover {
        background:rgba(251,146,60,.085) !important;
        border-color:rgba(251,191,36,.52) !important;
        box-shadow:0 9px 22px rgba(0,0,0,.28),0 0 14px rgba(251,146,60,.055) !important;
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
        body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7 {
          flex-basis:36px !important;
          width:36px !important;
          min-width:36px !important;
          max-width:36px !important;
          height:19px !important;
          min-height:19px !important;
          margin-bottom:-2px !important;
        }
        body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7 .home-notif-knob-v7 {
          width:13px;
          height:13px;
        }
        body.home-calendar-polish-v5 .filter-bar .btn-notif.home-notif-switch-v7.is-on .home-notif-knob-v7 {
          transform:translateX(17px);
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
          width:44px !important;
          height:44px !important;
          min-width:44px !important;
          min-height:44px !important;
          font-size:22px !important;
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
    var button = document.querySelector('.filter-bar .home-notif-switch-v7');
    if (!button) return;
    var checkbox = document.getElementById('notif-enabled');
    var enabled = checkbox ? !!checkbox.checked : storedNotificationEnabled();
    button.classList.toggle('is-on', enabled);
    button.setAttribute('aria-checked', enabled ? 'true' : 'false');
    button.setAttribute('title', enabled ? 'Notiser: På' : 'Notiser: Av');
  }

  function setupNotificationSwitch() {
    var filter = document.querySelector('.filter-bar');
    if (!filter) return;

    var button = filter.querySelector('.btn-notif.home-notif-switch-v7') || document.querySelector('.btn-notif');
    if (!button) {
      button = document.createElement('button');
      button.className = 'btn-notif';
      filter.appendChild(button);
    }

    document.querySelectorAll('.app-header .btn-notif').forEach(function (extra) {
      if (extra !== button) extra.remove();
    });

    button.removeAttribute('onclick');
    button.classList.remove('home-notif-toggle-v6','is-open');
    button.classList.add('home-notif-switch-v7');
    button.type = 'button';
    button.setAttribute('role','switch');
    button.setAttribute('aria-label','Notiser');
    button.setAttribute('aria-expanded','false');
    if (!button.querySelector('.home-notif-knob-v7')) {
      button.innerHTML = '<span class="home-notif-knob-v7" aria-hidden="true"></span>';
    }
    if (button.parentElement !== filter) filter.appendChild(button);

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