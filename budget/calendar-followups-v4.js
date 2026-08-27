(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  var isCalendar = path.endsWith('/budget/calendar.html') || path.endsWith('/calendar.html');
  if (!isHome && !isCalendar) return;

  var DATE_IDS = ['trip-start-inp', 'trip-end-inp', 'ev-date', 'ev-repeat-until', 'ev-end-date'];
  var activeYearMenu = null;
  var activeYearAnchor = null;

  function addStyles() {
    if (document.getElementById('calendar-followups-v4-style')) return;
    var style = document.createElement('style');
    style.id = 'calendar-followups-v4-style';
    style.textContent = `
      .flatpickr-current-month .cur-year.calendar-year-menu-anchor-v4 {
        cursor:pointer !important;
        border-radius:6px;
        padding:2px 4px !important;
        transition:background .15s ease;
      }
      .flatpickr-current-month .cur-year.calendar-year-menu-anchor-v4:hover,
      .flatpickr-current-month .cur-year.calendar-year-menu-anchor-v4:focus-visible {
        background:rgba(251,191,36,.12);
        outline:none;
      }
      .calendar-year-menu-v4 {
        position:absolute;
        z-index:10000;
        top:38px;
        left:50%;
        transform:translateX(-50%);
        width:min(190px, calc(100% - 28px));
        max-height:230px;
        overflow-y:auto;
        overscroll-behavior:contain;
        -webkit-overflow-scrolling:touch;
        padding:7px;
        border:1px solid rgba(255,255,255,.12);
        border-radius:10px;
        background:#1E2638;
        box-shadow:0 12px 30px rgba(0,0,0,.48);
        scrollbar-width:thin;
        scrollbar-color:rgba(251,191,36,.45) rgba(255,255,255,.04);
      }
      .calendar-year-menu-v4 button {
        display:block;
        width:100%;
        min-height:34px;
        margin:0 0 4px;
        border:1px solid rgba(255,255,255,.08);
        border-radius:7px;
        background:rgba(255,255,255,.035);
        color:#DCE6F2;
        font:700 12px/1 Inter, sans-serif;
        cursor:pointer;
      }
      .calendar-year-menu-v4 button:last-child { margin-bottom:0; }
      .calendar-year-menu-v4 button:hover,
      .calendar-year-menu-v4 button.active {
        border-color:rgba(251,191,36,.42);
        background:rgba(251,191,36,.12);
        color:#FBBF24;
      }
      @media(max-width:768px) {
        .calendar-year-menu-v4 {
          width:min(176px, calc(100% - 24px));
          max-height:210px;
          padding:6px;
        }
        .calendar-year-menu-v4 button { min-height:38px; font-size:12px; }

        body.calendar-ui-v2 .fab {
          position:fixed !important;
          right:18px !important;
          bottom:calc(18px + env(safe-area-inset-bottom, 0px)) !important;
          margin:0 !important;
          width:54px !important;
          height:54px !important;
          z-index:700 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function closeYearMenu() {
    if (activeYearMenu && activeYearMenu.parentNode) activeYearMenu.parentNode.removeChild(activeYearMenu);
    activeYearMenu = null;
    activeYearAnchor = null;
  }

  function instanceForCalendar(calendar) {
    if (!calendar) return null;
    for (var i = 0; i < DATE_IDS.length; i++) {
      var el = document.getElementById(DATE_IDS[i]);
      var fp = el && el._flatpickr;
      if (fp && fp.calendarContainer === calendar) return fp;
    }
    return null;
  }

  function openYearMenu(instance, anchor) {
    closeYearMenu();
    if (!instance || !instance.calendarContainer || !anchor) return;

    var menu = document.createElement('div');
    menu.className = 'calendar-year-menu-v4';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Välj år');

    var current = Number(instance.currentYear) || new Date().getFullYear();
    var start = current - 60;
    var end = current + 60;
    var activeButton = null;

    for (var year = start; year <= end; year++) {
      (function (y) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = String(y);
        btn.className = y === current ? 'active' : '';
        btn.setAttribute('role', 'menuitem');
        btn.addEventListener('pointerdown', function (event) {
          event.preventDefault();
          event.stopPropagation();
        });
        btn.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          try { instance.changeYear(y); } catch (e) {}
          closeYearMenu();
        });
        if (y === current) activeButton = btn;
        menu.appendChild(btn);
      })(year);
    }

    instance.calendarContainer.appendChild(menu);
    activeYearMenu = menu;
    activeYearAnchor = anchor;

    if (activeButton) {
      requestAnimationFrame(function () {
        try { activeButton.scrollIntoView({ block:'center' }); } catch (e) {}
      });
    }
  }

  function decorateYears() {
    DATE_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      var fp = el && el._flatpickr;
      if (!fp || !fp.calendarContainer) return;
      var year = fp.calendarContainer.querySelector('.flatpickr-current-month .cur-year');
      if (!year) return;
      year.classList.add('calendar-year-menu-anchor-v4');
      year.setAttribute('title', 'Välj år');
      year.setAttribute('aria-label', 'Välj år');
    });
  }

  function bindYearPicker() {
    document.addEventListener('pointerdown', function (event) {
      var target = event.target;
      if (!target) return;

      if (activeYearMenu && !activeYearMenu.contains(target) && target !== activeYearAnchor) {
        closeYearMenu();
      }

      if (!target.classList || !target.classList.contains('cur-year')) return;
      var calendar = target.closest ? target.closest('.flatpickr-calendar') : null;
      var instance = instanceForCalendar(calendar);
      if (!instance) return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

      if (activeYearMenu && activeYearAnchor === target) closeYearMenu();
      else openYearMenu(instance, target);
    }, true);

    document.addEventListener('keydown', function (event) {
      var target = event.target;
      if (!target || !target.classList || !target.classList.contains('cur-year')) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      var calendar = target.closest ? target.closest('.flatpickr-calendar') : null;
      var instance = instanceForCalendar(calendar);
      if (!instance) return;
      if (activeYearMenu && activeYearAnchor === target) closeYearMenu();
      else openYearMenu(instance, target);
    }, true);

    document.addEventListener('click', function (event) {
      if (event.target && event.target.closest && event.target.closest('.flatpickr-calendar')) {
        setTimeout(decorateYears, 0);
      }
    });
  }

  function ensureYearlyOption() {
    var select = document.getElementById('ev-repeat');
    if (!select || select.querySelector('option[value="yearly"]')) return;
    var option = document.createElement('option');
    option.value = 'yearly';
    option.textContent = 'Årligen';
    select.appendChild(option);
  }

  function parseIso(iso) {
    var parts = String(iso || '').split('-').map(Number);
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
    return { year:parts[0], month:parts[1], day:parts[2] };
  }

  function daysInMonth(year, month1) {
    return new Date(Date.UTC(year, month1, 0)).getUTCDate();
  }

  function annualDate(source, year) {
    var p = parseIso(source);
    if (!p) return '';
    var day = Math.min(p.day, daysInMonth(year, p.month));
    return String(year) + '-' + String(p.month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  function addDays(iso, amount) {
    var p = parseIso(iso);
    if (!p) return '';
    var d = new Date(Date.UTC(p.year, p.month - 1, p.day + amount));
    return d.toISOString().slice(0, 10);
  }

  function dayDiff(startIso, endIso) {
    var a = parseIso(startIso);
    var b = parseIso(endIso);
    if (!a || !b) return 0;
    var start = Date.UTC(a.year, a.month - 1, a.day);
    var end = Date.UTC(b.year, b.month - 1, b.day);
    return Math.max(0, Math.min(370, Math.round((end - start) / 86400000)));
  }

  function bindYearlyExpansion() {
    if (typeof window.expandRepeating !== 'function' || window.expandRepeating.__calendarYearlyV4Wrapped) return;
    var original = window.expandRepeating;

    var wrapped = function (events, targetYear, targetMonth) {
      var result = original.apply(this, arguments) || [];
      var rawEvents = Array.isArray(events) ? events : [];
      var year = Number(targetYear);
      var month0 = Number(targetMonth);
      if (!Number.isFinite(year) || !Number.isFinite(month0)) return result;

      rawEvents.forEach(function (ev) {
        if (!ev || ev.repeat !== 'yearly' || !ev.date) return;
        var source = parseIso(ev.date);
        if (!source) return;
        var duration = ev.endDate ? dayDiff(ev.date, ev.endDate) : 0;
        var until = ev.repeatUntil || '';

        [year - 1, year].forEach(function (occurrenceYear) {
          if (occurrenceYear <= source.year) return;
          var startDate = annualDate(ev.date, occurrenceYear);
          if (!startDate) return;
          if (until && startDate > until) return;
          var endDate = duration ? addDays(startDate, duration) : '';

          for (var offset = 0; offset <= duration; offset++) {
            var date = addDays(startDate, offset);
            var p = parseIso(date);
            if (!p || p.year !== year || p.month - 1 !== month0) continue;

            var clone = Object.assign({}, ev);
            clone.id = String(ev.id) + '_y' + occurrenceYear + (offset ? '_r' + offset : '');
            clone.date = date;
            if (duration) clone.endDate = endDate;
            if (offset > 0) {
              clone.__rangeContinuation = true;
              clone.__rangeStart = startDate;
            }
            result.push(clone);
          }
        });
      });

      return result;
    };

    wrapped.__calendarYearlyV4Wrapped = true;
    window.expandRepeating = wrapped;
  }

  function installHomeFabFix() {
    if (!isHome) return;
    var fab = document.querySelector('.fab');
    if (fab) fab.setAttribute('data-home-floating-fab-v4', 'true');
  }

  function bindModalRefresh() {
    if (typeof window.openEventModal === 'function' && !window.openEventModal.__calendarFollowupsV4Wrapped) {
      var originalOpen = window.openEventModal;
      var openWrapped = function () {
        ensureYearlyOption();
        var result = originalOpen.apply(this, arguments);
        setTimeout(function () { ensureYearlyOption(); decorateYears(); }, 20);
        return result;
      };
      openWrapped.__calendarFollowupsV4Wrapped = true;
      window.openEventModal = openWrapped;
    }

    if (typeof window.editEvent === 'function' && !window.editEvent.__calendarFollowupsV4Wrapped) {
      var originalEdit = window.editEvent;
      var editWrapped = function () {
        ensureYearlyOption();
        var result = originalEdit.apply(this, arguments);
        setTimeout(function () { ensureYearlyOption(); decorateYears(); }, 20);
        return result;
      };
      editWrapped.__calendarFollowupsV4Wrapped = true;
      window.editEvent = editWrapped;
    }
  }

  function install() {
    if (window.__calendarFollowupsV4Installed) return;
    if (!document.getElementById('event-modal')) {
      setTimeout(install, 60);
      return;
    }

    window.__calendarFollowupsV4Installed = true;
    addStyles();
    ensureYearlyOption();
    bindYearlyExpansion();
    bindYearPicker();
    bindModalRefresh();
    installHomeFabFix();
    setTimeout(decorateYears, 40);

    try { if (typeof window.renderMonth === 'function') window.renderMonth(); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 40); }, { once:true });
  } else {
    setTimeout(install, 40);
  }
})();
