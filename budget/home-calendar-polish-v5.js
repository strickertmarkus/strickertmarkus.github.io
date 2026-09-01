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

      /* Slightly taller header with a little more amber again, while keeping
         the transition into the filter strip soft. */
      body.home-calendar-polish-v5 .app-header {
        justify-content:center !important;
        text-align:center !important;
        min-height:82px !important;
        position:sticky !important;
        background:linear-gradient(180deg,rgba(16,18,24,.97),rgba(251,146,60,.055)) !important;
        border-bottom:1px solid rgba(251,146,60,.095) !important;
        box-shadow:0 5px 18px rgba(0,0,0,.22), inset 0 -1px 0 rgba(251,146,60,.035) !important;
        backdrop-filter:blur(14px) !important;
        -webkit-backdrop-filter:blur(14px) !important;
      }
      body.home-calendar-polish-v5 .filter-bar {
        background:linear-gradient(180deg,rgba(18,20,27,.90),rgba(15,18,25,.86)) !important;
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
        min-height:50px;
        text-align:center !important;
      }
      body.home-calendar-polish-v5 .brand-text h1 {
        font-size:22px !important;
        line-height:28px !important;
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
          min-height:80px !important;
        }
        body.home-calendar-polish-v5 .brand {
          max-width:calc(100% - 130px) !important;
        }
        body.home-calendar-polish-v5 .brand-text h1 {
          font-size:20px !important;
          line-height:26px !important;
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