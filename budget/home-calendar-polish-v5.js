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

      /* Finance-page inspired family theme: dark neutral base with warm
         orange/amber glow, glassy surfaces and restrained coloured accents. */
      html,
      body.home-calendar-polish-v5 {
        background:#0F1219 !important;
      }
      body.home-calendar-polish-v5::before {
        background:
          radial-gradient(900px 380px at 50% -110px, rgba(251,146,60,.13), transparent 67%),
          radial-gradient(700px 320px at 12% 44%, rgba(56,189,248,.035), transparent 72%) !important;
      }

      body.home-calendar-polish-v5 .app-header {
        justify-content:center !important;
        text-align:center !important;
        min-height:70px;
        position:sticky !important;
        background:linear-gradient(180deg, rgba(13,17,23,.99), rgba(251,146,60,.03)) !important;
        border-bottom:1px solid rgba(251,146,60,.12) !important;
        box-shadow:0 6px 22px rgba(0,0,0,.34), 0 1px 16px rgba(251,146,60,.025) !important;
        backdrop-filter:blur(14px) !important;
        -webkit-backdrop-filter:blur(14px) !important;
      }
      body.home-calendar-polish-v5 .filter-bar {
        background:rgba(13,17,23,.72) !important;
        border-bottom:1px solid rgba(251,146,60,.12) !important;
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
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
      body.home-calendar-polish-v5 .btn-notif,
      body.home-calendar-polish-v5 .btn-xs {
        background:rgba(255,255,255,.045) !important;
        border-color:rgba(251,146,60,.18) !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav button:hover,
      body.home-calendar-polish-v5 .btn-notif:hover,
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
        min-height:46px;
        text-align:center !important;
      }
      body.home-calendar-polish-v5 .brand-text h1 {
        font-size:22px !important;
        line-height:26px !important;
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
        body.home-calendar-polish-v5 .brand {
          max-width:calc(100% - 130px) !important;
        }
        body.home-calendar-polish-v5 .brand-text h1 {
          font-size:20px !important;
          line-height:24px !important;
          letter-spacing:-.35px !important;
        }
        body.home-calendar-polish-v5 .brand-text p {
          margin-top:1px !important;
          font-size:12.5px !important;
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

    var panel = document.getElementById('day-panel');
    if (panel) panel.classList.remove('show');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 40); }, { once:true });
  } else {
    setTimeout(install, 40);
  }
})();