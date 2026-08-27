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
      /* Keep the legacy inline day panel available to old code, but never
         expose it in Home. Empty and populated dates both use the popover. */
      body.home-calendar-polish-v5 #day-panel {
        display:none !important;
      }

      /* Header: title and hamburger share the same horizontal centre line.
         The meta line is positioned underneath without affecting title centring. */
      body.home-calendar-polish-v5 .app-header {
        justify-content:flex-start !important;
        text-align:left !important;
        min-height:70px;
      }
      body.home-calendar-polish-v5 .brand {
        min-width:0;
        margin-right:auto !important;
        justify-content:flex-start !important;
      }
      body.home-calendar-polish-v5 .brand-text {
        min-width:0;
        position:relative;
        min-height:38px;
      }
      body.home-calendar-polish-v5 .brand-text h1 {
        font-size:22px !important;
        line-height:38px !important;
        letter-spacing:-.45px !important;
        white-space:nowrap !important;
      }
      body.home-calendar-polish-v5 .brand-text p {
        position:absolute;
        left:0;
        top:31px;
        white-space:nowrap;
      }

      /* Reserve the toolbar area permanently. The toolbar is positioned in
         that reserved strip, so moving .month-nav from the header does not
         change layout after first paint. */
      body.home-calendar-polish-v5 .cal-section {
        padding-top:40px !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 {
        position:absolute !important;
        top:0 !important;
        left:0 !important;
        right:24px !important;
        width:auto !important;
        padding:0 !important;
        margin:0 !important;
      }
      body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav {
        margin:0 0 0 auto !important;
        justify-content:flex-end !important;
        flex:0 0 auto !important;
      }

      @media (max-width:768px) {
        body.home-calendar-polish-v5 .brand-text h1 {
          font-size:20px !important;
          line-height:38px !important;
          letter-spacing:-.35px !important;
        }
        body.home-calendar-polish-v5 .cal-section {
          padding-top:36px !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 {
          right:0 !important;
        }
        body.home-calendar-polish-v5 .calendar-toolbar-v2 .month-nav {
          margin:0 0 0 auto !important;
        }
      }

      @media (max-width:390px) {
        body.home-calendar-polish-v5 .brand-text h1 {
          font-size:18px !important;
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

    /* Re-render first so selected-state styling is retained, then anchor the
       same overview popover used by dates that already contain events. */
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

    /* Empty calendar cells call selectDay(). Populated cells already call
       openDayEventsPopup() directly, so replacing only selectDay makes the two
       single-click paths identical without touching the existing dblclick
       handler that opens the event editor. */
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
