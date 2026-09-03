(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  if (!isHome || window.__homeCalendarThemeV12Installed) return;
  window.__homeCalendarThemeV12Installed = true;

  function initialView() {
    var view = '';
    try { view = localStorage.getItem('home-calendar-view-v11') || ''; } catch (_) {}
    return view === 'day' || view === 'week' || view === 'month' ? view : 'month';
  }

  function syncViewTheme() {
    var body = document.body;
    if (!body) return;
    var view = body.dataset.homeCalendarView || initialView();
    if (view !== 'day' && view !== 'week' && view !== 'month') view = 'month';
    if (!body.dataset.homeCalendarView) body.dataset.homeCalendarView = view;
    document.documentElement.dataset.homeCalendarView = view;
  }

  function placeHomeMonthNav() {
    var header = document.querySelector('.app-header');
    var nav = document.querySelector('.month-nav');
    if (!header || !nav) return false;
    if (nav.parentElement !== header) header.appendChild(nav);
    nav.classList.add('home-header-month-v10');
    return true;
  }

  function addStyles() {
    if (document.getElementById('home-calendar-theme-v12-style')) return;
    var style = document.createElement('style');
    style.id = 'home-calendar-theme-v12-style';
    style.textContent = `
      html.home-finance-orange-v3,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 {
        --home-view-accent:#FB923C;
        --home-view-accent-soft:#FDBA74;
        --home-view-rgb:251,146,60;
        --accent:var(--home-view-accent);
        --accent-dim:rgba(var(--home-view-rgb),.10);
        --accent-glow:rgba(var(--home-view-rgb),.25);
        --border-a:rgba(var(--home-view-rgb),.30);
        --accent-bg:rgba(var(--home-view-rgb),.055);
      }
      html.home-finance-orange-v3[data-home-calendar-view="day"],
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="day"] {
        --home-view-accent:#60A5FA;
        --home-view-accent-soft:#93C5FD;
        --home-view-rgb:96,165,250;
      }
      html.home-finance-orange-v3[data-home-calendar-view="week"],
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="week"] {
        --home-view-accent:#4ADE80;
        --home-view-accent-soft:#86EFAC;
        --home-view-rgb:74,222,128;
      }
      html.home-finance-orange-v3[data-home-calendar-view="month"],
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="month"] {
        --home-view-accent:#FB923C;
        --home-view-accent-soft:#FDBA74;
        --home-view-rgb:251,146,60;
      }

      html.home-finance-orange-v3,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 {
        background:
          radial-gradient(900px 380px at 50% -110px,rgba(var(--home-view-rgb),.105),transparent 67%),
          #0F1219 !important;
        background-color:#0F1219 !important;
      }

      /* Keep the Budget-page vertical rhythm: title -> meta is tight,
         meta -> month picker has clearly more air. */
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand {
        top:13px !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text h1 {
        font-size:19px !important;
        line-height:1.08 !important;
        letter-spacing:-.38px !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text p {
        margin-top:2px !important;
        font-size:10.5px !important;
        line-height:1.2 !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header > .month-nav.home-header-month-v10 {
        top:65px !important;
      }

      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header {
        background:
          radial-gradient(560px 185px at 50% 108%,rgba(var(--home-view-rgb),.105),transparent 70%),
          linear-gradient(180deg,var(--home-status-surface,#0F1219) 0,var(--home-status-surface,#0F1219) 3px,rgba(var(--home-view-rgb),.052) 100%) !important;
        border-bottom-color:rgba(var(--home-view-rgb),.22) !important;
        box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 25px rgba(var(--home-view-rgb),.075) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header::after {
        background:linear-gradient(90deg,transparent,rgba(var(--home-view-rgb),.10) 24%,rgba(255,255,255,.06) 50%,rgba(var(--home-view-rgb),.10) 76%,transparent) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .header-time {
        color:var(--home-view-accent) !important;
        text-shadow:0 2px 10px rgba(var(--home-view-rgb),.20) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .header-date {
        color:var(--home-view-accent-soft) !important;
      }

      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header > .month-nav.home-header-month-v10 button {
        color:var(--home-view-accent-soft) !important;
        border-color:rgba(var(--home-view-rgb),.22) !important;
        box-shadow:0 0 13px rgba(var(--home-view-rgb),.045) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header > .month-nav.home-header-month-v10 button:hover {
        background:rgba(var(--home-view-rgb),.10) !important;
        border-color:rgba(var(--home-view-rgb),.40) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header > .month-nav.home-header-month-v10 #month-label {
        color:var(--home-view-accent-soft) !important;
        text-shadow:0 2px 11px rgba(var(--home-view-rgb),.16) !important;
      }

      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .nav-btn {
        border-color:rgba(var(--home-view-rgb),.18) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .nav-btn:hover {
        background:rgba(var(--home-view-rgb),.08) !important;
        border-color:rgba(var(--home-view-rgb),.30) !important;
        color:var(--home-view-accent-soft) !important;
      }

      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on {
        border-color:rgba(var(--home-view-rgb),.46) !important;
        background:rgba(var(--home-view-rgb),.12) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 0 13px rgba(var(--home-view-rgb),.18) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on .home-notif-knob-v7 {
        color:#FFF8E9 !important;
        background:rgba(var(--home-view-rgb),.18) !important;
        filter:drop-shadow(0 0 2px rgba(255,255,255,.98)) drop-shadow(0 0 8px rgba(var(--home-view-rgb),.82)) !important;
      }

      html.home-finance-orange-v3 body.home-calendar-polish-v5 .cal-week-number,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .calendar-week-number-v2 {
        color:var(--home-view-accent) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .cal-cell:hover {
        border-color:rgba(var(--home-view-rgb),.20) !important;
        background:rgba(var(--home-view-rgb),.035) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .cal-cell.has-events:hover {
        border-color:rgba(var(--home-view-rgb),.38) !important;
        background:rgba(var(--home-view-rgb),.06) !important;
        box-shadow:0 6px 16px rgba(0,0,0,.20),0 0 13px rgba(var(--home-view-rgb),.035) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .cal-cell.today {
        border-color:rgba(var(--home-view-rgb),.72) !important;
        background:linear-gradient(180deg,rgba(var(--home-view-rgb),.115),rgba(var(--home-view-rgb),.035)) !important;
        box-shadow:inset 0 0 0 1px rgba(var(--home-view-rgb),.07),0 0 14px rgba(var(--home-view-rgb),.045) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .cal-cell.today .cal-num {
        color:var(--home-view-accent) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #shopping-widget .widget-title,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #transfer-widget .widget-title {
        color:var(--home-view-accent) !important;
        text-shadow:0 2px 10px rgba(var(--home-view-rgb),.14) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5.calendar-ui-v2 .fab,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .fab {
        color:var(--home-view-accent) !important;
        border-color:rgba(var(--home-view-rgb),.50) !important;
        box-shadow:0 9px 22px rgba(0,0,0,.28),0 0 24px rgba(var(--home-view-rgb),.16) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5.calendar-ui-v2 .fab:hover,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .fab:hover {
        background:rgba(var(--home-view-rgb),.095) !important;
        border-color:rgba(var(--home-view-rgb),.68) !important;
        box-shadow:0 10px 24px rgba(0,0,0,.30),0 0 28px rgba(var(--home-view-rgb),.22) !important;
      }

      html.home-finance-orange-v3 body.home-calendar-polish-v5 .home-cal-add-v11 {
        border-color:rgba(var(--home-view-rgb),.34) !important;
        background:rgba(var(--home-view-rgb),.09) !important;
        color:var(--home-view-accent-soft) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .home-cal-week-day-v11.today {
        border-color:rgba(var(--home-view-rgb),.38) !important;
        background:linear-gradient(90deg,rgba(var(--home-view-rgb),.07),rgba(255,255,255,.02)) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .home-cal-week-day-v11.today .home-cal-week-date-v11 strong {
        color:var(--home-view-accent) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .home-day-popover {
        background:
          linear-gradient(180deg,rgba(var(--home-view-rgb),.05),rgba(var(--home-view-rgb),.014)),
          rgba(15,18,25,.985) !important;
        border-color:rgba(var(--home-view-rgb),.26) !important;
        border-radius:10px !important;
        box-shadow:0 8px 20px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.025) !important;
        backdrop-filter:blur(12px) !important;
        -webkit-backdrop-filter:blur(12px) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .home-day-popover-title {
        color:var(--home-view-accent) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .home-day-popover-week,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .day-panel-week {
        color:var(--home-view-accent-soft) !important;
        border-color:rgba(var(--home-view-rgb),.28) !important;
        background:rgba(var(--home-view-rgb),.075) !important;
      }

      /* Event editor: retire the old blue modal surface and let it follow the active view. */
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal.modal-overlay {
        background:rgba(5,7,10,.72) !important;
        backdrop-filter:blur(10px) !important;
        -webkit-backdrop-filter:blur(10px) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .modal {
        background:
          radial-gradient(560px 190px at 50% -30px,rgba(var(--home-view-rgb),.105),transparent 70%),
          linear-gradient(180deg,rgba(25,25,28,.995),rgba(15,18,25,.995)) !important;
        border-color:rgba(var(--home-view-rgb),.28) !important;
        box-shadow:0 26px 72px rgba(0,0,0,.58),0 0 34px rgba(var(--home-view-rgb),.075),inset 0 1px 0 rgba(255,255,255,.035) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .modal h2 {
        color:#F5F7FA !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .modal-close {
        background:rgba(255,255,255,.045) !important;
        border-color:rgba(var(--home-view-rgb),.16) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .modal-close:hover {
        color:var(--home-view-accent-soft) !important;
        background:rgba(var(--home-view-rgb),.08) !important;
        border-color:rgba(var(--home-view-rgb),.30) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .form-group label {
        color:#9BA5B3 !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .form-group input,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .form-group select,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .form-group textarea,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal #event-end-panel-v2,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .event-end-toggle-v2 {
        background-color:rgba(255,255,255,.038) !important;
        border-color:rgba(255,255,255,.09) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .form-group input:focus,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .form-group select:focus,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .form-group textarea:focus {
        border-color:rgba(var(--home-view-rgb),.58) !important;
        box-shadow:0 0 0 2px rgba(var(--home-view-rgb),.13) !important;
        background-color:rgba(var(--home-view-rgb),.035) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .event-end-switch-v2[aria-pressed="true"] {
        background:rgba(var(--home-view-rgb),.18) !important;
        border-color:rgba(var(--home-view-rgb),.48) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .event-end-switch-v2[aria-pressed="true"]::after {
        background:var(--home-view-accent) !important;
        box-shadow:0 0 8px rgba(var(--home-view-rgb),.42) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .btn-primary {
        background:var(--home-view-accent) !important;
        color:#101318 !important;
        box-shadow:0 5px 18px rgba(var(--home-view-rgb),.20) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .btn-ghost {
        border-color:rgba(var(--home-view-rgb),.15) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .btn-ghost:hover {
        color:var(--home-view-accent-soft) !important;
        background:rgba(var(--home-view-rgb),.065) !important;
      }

      /* Theme the date/time glyphs in the editor as well. */
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="day"] #event-modal input[data-picker="date"] { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360A5FA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='3' ry='3'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E") !important; }
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="week"] #event-modal input[data-picker="date"] { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234ADE80' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='3' ry='3'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E") !important; }
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="month"] #event-modal input[data-picker="date"] { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FB923C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='3' ry='3'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E") !important; }
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="day"] #event-modal input[data-picker="time"] { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360A5FA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpolyline points='12 7 12 12 15 14'/%3E%3C/svg%3E") !important; }
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="week"] #event-modal input[data-picker="time"] { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234ADE80' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpolyline points='12 7 12 12 15 14'/%3E%3C/svg%3E") !important; }
      html.home-finance-orange-v3 body.home-calendar-polish-v5[data-home-calendar-view="month"] #event-modal input[data-picker="time"] { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FB923C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpolyline points='12 7 12 12 15 14'/%3E%3C/svg%3E") !important; }
      /* Prevent the themed SVG picker icon from tiling across iOS inputs. */
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal input[data-picker="date"],
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal input[data-picker="time"] {
        background-repeat:no-repeat !important;
        background-position:right 12px center !important;
        background-size:18px 18px !important;
        -webkit-background-size:18px 18px !important;
        background-origin:padding-box !important;
        padding-right:42px !important;
      }

      /* Neutral switch off-state; active view color when enabled. */
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .event-end-switch-v2 {
        background:rgba(255,255,255,.045) !important;
        border-color:rgba(var(--home-view-rgb),.22) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .event-end-switch-v2::after {
        background:#7C8798 !important;
        box-shadow:none !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .event-end-switch-v2[aria-pressed="true"] {
        background:rgba(var(--home-view-rgb),.18) !important;
        border-color:rgba(var(--home-view-rgb),.48) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 #event-modal .event-end-switch-v2[aria-pressed="true"]::after {
        background:var(--home-view-accent) !important;
        box-shadow:0 0 8px rgba(var(--home-view-rgb),.42) !important;
      }

      /* Flatpickr is rendered outside the modal, so theme it at page level. */
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .flatpickr-calendar {
        background:linear-gradient(180deg,rgba(25,25,28,.995),rgba(15,18,25,.995)) !important;
        border:1px solid rgba(var(--home-view-rgb),.24) !important;
        box-shadow:0 18px 48px rgba(0,0,0,.55),0 0 28px rgba(var(--home-view-rgb),.07) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .flatpickr-months,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .flatpickr-weekdays,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .flatpickr-time {
        border-color:rgba(var(--home-view-rgb),.18) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .flatpickr-day.today {
        border-color:rgba(var(--home-view-rgb),.60) !important;
        color:var(--home-view-accent-soft) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .flatpickr-day:hover,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .flatpickr-day:focus {
        background:rgba(var(--home-view-rgb),.12) !important;
        border-color:rgba(var(--home-view-rgb),.22) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .flatpickr-day.selected,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .flatpickr-day.startRange,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .flatpickr-day.endRange {
        background:var(--home-view-accent) !important;
        border-color:var(--home-view-accent) !important;
        color:#101318 !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .fp-time-chip:hover {
        background:rgba(var(--home-view-rgb),.16) !important;
        border-color:rgba(var(--home-view-rgb),.38) !important;
        color:var(--home-view-accent-soft) !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .fp-time-chip.active {
        background:var(--home-view-accent) !important;
        border-color:var(--home-view-accent) !important;
        color:#101318 !important;
      }

      @media(max-width:600px) {
        html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand {
          top:12px !important;
        }
        html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text h1 {
          font-size:18px !important;
        }
        html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text p {
          margin-top:2px !important;
          font-size:10px !important;
        }
        html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header > .month-nav.home-header-month-v10 {
          top:63px !important;
        }
      }

    html.home-finance-orange-v3 {
      background:#0D1117 !important;
      background-color:#0D1117 !important;
    }
    html.home-finance-orange-v3 body {
      background:radial-gradient(900px 380px at 50% -110px,rgba(251,146,60,.085),transparent 67%),#0F1219 !important;
      background-color:#0F1219 !important;
    }
    html.home-finance-orange-v3 body::before {
      content:none !important;
      display:none !important;
      background:none !important;
    }

    html.home-finance-orange-v3 body .app-header,
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header {
      height:160px !important;
      min-height:160px !important;
      max-height:160px !important;
      position:sticky !important;
      top:0 !important;
      padding:0 !important;
      overflow:visible !important;
      text-align:center !important;
      background:linear-gradient(180deg,var(--home-status-surface,#0F1219) 0,var(--home-status-surface,#0F1219) 3px,rgba(251,146,60,.06) 100%) !important;
      border-bottom:1px solid rgba(251,146,60,.20) !important;
      box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 24px rgba(251,146,60,.075) !important;
      backdrop-filter:blur(20px) !important;
      -webkit-backdrop-filter:blur(20px) !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand {
      position:absolute !important;
      left:50% !important;
      top:14px !important;
      transform:translateX(-50%) !important;
      width:max-content !important;
      max-width:calc(100% - 112px) !important;
      margin:0 !important;
      z-index:2 !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text {
      min-height:0 !important;
      text-align:center !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text h1 {
      font-size:21px !important;
      line-height:1.1 !important;
      font-weight:800 !important;
      letter-spacing:-.45px !important;
      white-space:nowrap !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text p {
      margin-top:5px !important;
      font-size:11px !important;
      line-height:1.2 !important;
      white-space:nowrap !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text .header-date.header-date {
      color:#93C5FD !important;
      text-shadow:0 1px 8px rgba(96,165,250,.14) !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .nav-dropdown-wrapper {
      position:absolute !important;
      top:10px !important;
      right:10px !important;
      left:auto !important;
      transform:none !important;
      margin:0 !important;
      z-index:8 !important;
    }

    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header > .month-nav.home-header-month-v10 {
      visibility:visible !important;
      display:flex !important;
      position:absolute !important;
      left:50% !important;
      right:auto !important;
      top:57px !important;
      bottom:auto !important;
      transform:translateX(-50%) !important;
      height:40px !important;
      width:max-content !important;
      margin:0 !important;
      padding:0 !important;
      gap:8px !important;
      align-items:center !important;
      justify-content:center !important;
      z-index:7 !important;
      background:transparent !important;
      border:0 !important;
      box-shadow:none !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header > .month-nav.home-header-month-v10 button {
      width:32px !important;
      min-width:32px !important;
      height:32px !important;
      min-height:32px !important;
      padding:0 !important;
      border-radius:9px !important;
      font-size:15px !important;
      line-height:1 !important;
      color:#FDBA74 !important;
      background:rgba(255,255,255,.035) !important;
      border:1px solid rgba(251,146,60,.18) !important;
      box-shadow:0 0 12px rgba(251,146,60,.025) !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header > .month-nav.home-header-month-v10 #month-label {
      min-width:150px !important;
      width:150px !important;
      padding:0 5px !important;
      font-size:15px !important;
      font-weight:700 !important;
      line-height:40px !important;
      white-space:nowrap !important;
      text-align:center !important;
      color:#FDBA74 !important;
      text-shadow:0 2px 10px rgba(251,146,60,.14) !important;
    }

    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 {
      position:absolute !important;
      left:16px !important;
      right:auto !important;
      top:auto !important;
      bottom:9px !important;
      width:50px !important;
      min-width:50px !important;
      max-width:50px !important;
      height:35px !important;
      min-height:35px !important;
      padding:3px !important;
      border:1px solid rgba(255,255,255,.22) !important;
      border-radius:18px !important;
      background:rgba(255,255,255,.075) !important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 4px 16px rgba(0,0,0,.12) !important;
      backdrop-filter:blur(9px) !important;
      -webkit-backdrop-filter:blur(9px) !important;
      z-index:6 !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.home-notif-switch-v7 {
      width:62px !important;
      min-width:62px !important;
      max-width:62px !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 .home-notif-knob-v7 {
      left:3px !important;
      top:3px !important;
      width:27px !important;
      height:27px !important;
      border-radius:14px !important;
      color:#94A3B8 !important;
      transition:transform .22s cubic-bezier(.22,1,.36,1),color .18s ease,filter .18s ease,background .18s ease !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 .home-notif-bell-v8 {
      width:15px !important;
      height:15px !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on {
      border-color:rgba(251,146,60,.42) !important;
      background:rgba(251,146,60,.11) !important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 0 12px rgba(251,146,60,.15) !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on .home-notif-knob-v7 {
      transform:translateX(17px) !important;
      color:#FFF0AE !important;
      background:rgba(251,146,60,.16) !important;
      filter:drop-shadow(0 0 2px rgba(255,250,220,.95)) drop-shadow(0 0 7px rgba(251,146,60,.72)) !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.home-notif-switch-v7.is-on .home-notif-knob-v7 {
      transform:translateX(29px) !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on .home-notif-bell-v8 {
      stroke-width:2.35 !important;
      opacity:1 !important;
    }

    html.home-finance-orange-v3 body.home-calendar-polish-v5 .calendar-toolbar-v2 {
      right:0 !important;
    }

    @media(max-width:600px) {
      html.home-finance-orange-v3 body .app-header,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header {
        height:156px !important;
        min-height:156px !important;
        max-height:156px !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand {
        top:13px !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text h1 {
        font-size:20px !important;
      }
    }


      @media(prefers-reduced-motion:no-preference) {
        ::view-transition-group(root) {
          animation-duration:.38s;
          animation-timing-function:cubic-bezier(.22,1,.36,1);
        }
        ::view-transition-old(root) { animation:home-theme-out-v12 .25s ease both; mix-blend-mode:normal; }
        ::view-transition-new(root) { animation:home-theme-in-v12 .38s ease both; mix-blend-mode:normal; }
        @keyframes home-theme-out-v12 { to { opacity:.18; } }
        @keyframes home-theme-in-v12 { from { opacity:.18; } to { opacity:1; } }
      }
    `;
    document.head.appendChild(style);
  }

  /* Inject the final theme while the document is still in <head>. This avoids
     painting the legacy base theme before DOMContentLoaded. */
  addStyles();

  function install() {
    if (!document.body) {
      setTimeout(install, 20);
      return;
    }
    syncViewTheme();
    addStyles();
    placeHomeMonthNav();
    [60, 180, 450, 950, 1500].forEach(function (delay) {
      setTimeout(placeHomeMonthNav, delay);
    });

    var observer = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        if (records[i].attributeName === 'data-home-calendar-view') {
          syncViewTheme();
          break;
        }
      }
    });
    observer.observe(document.body, { attributes:true, attributeFilter:['data-home-calendar-view'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();