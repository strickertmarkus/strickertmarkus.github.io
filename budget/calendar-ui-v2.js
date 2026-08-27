(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  var isCalendar = path.endsWith('/budget/calendar.html') || path.endsWith('/calendar.html');
  if (!isHome && !isCalendar) return;

  function addStyles() {
    if (document.getElementById('calendar-ui-v2-style')) return;
    var style = document.createElement('style');
    style.id = 'calendar-ui-v2-style';
    style.textContent = `
      body.calendar-ui-v2 .brand-text h1 {
        font-size: 19px !important;
        line-height: 1.15 !important;
        letter-spacing: -.25px !important;
      }
      .calendar-toolbar-v2 {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin:0 0 8px;
        min-height:32px;
      }
      .calendar-toolbar-v2 .cal-week-number,
      .calendar-toolbar-v2 .calendar-week-number-v2 {
        margin:0 !important;
        color:var(--accent);
        font-size:10px;
        font-weight:800;
        letter-spacing:.55px;
        text-transform:uppercase;
        white-space:nowrap;
      }
      .calendar-toolbar-v2 .month-nav {
        position:static !important;
        inset:auto !important;
        transform:none !important;
        display:flex !important;
        align-items:center !important;
        gap:4px !important;
        margin-left:auto;
      }
      .calendar-toolbar-v2 .month-nav button {
        width:28px !important;
        height:28px !important;
        border-radius:7px !important;
        font-size:13px !important;
      }
      .calendar-toolbar-v2 #month-label {
        min-width:0 !important;
        width:auto !important;
        padding:0 5px !important;
        font-size:11px !important;
        font-weight:800 !important;
        white-space:nowrap;
      }

      .event-end-toggle-v2 {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:10px 12px;
        margin:2px 0 12px;
        border:1px solid var(--border);
        border-radius:10px;
        background:rgba(255,255,255,.025);
      }
      .event-end-toggle-v2-copy strong {
        display:block;
        color:var(--text);
        font-size:12px;
      }
      .event-end-toggle-v2-copy span {
        display:block;
        margin-top:2px;
        color:var(--text-sec);
        font-size:10px;
      }
      .event-end-switch-v2 {
        appearance:none;
        width:46px;
        height:26px;
        flex:0 0 auto;
        border:1px solid var(--border-a);
        border-radius:999px;
        padding:3px;
        background:rgba(255,255,255,.045);
        cursor:pointer;
      }
      .event-end-switch-v2::after {
        content:'';
        display:block;
        width:18px;
        height:18px;
        border-radius:50%;
        background:#64748B;
        transform:translateX(0);
        transition:transform .18s ease, background .18s ease;
      }
      .event-end-switch-v2[aria-pressed="true"] {
        background:var(--accent-dim);
        border-color:var(--border-a);
      }
      .event-end-switch-v2[aria-pressed="true"]::after {
        transform:translateX(20px);
        background:var(--accent);
      }
      #event-end-panel-v2[hidden] { display:none !important; }
      #event-end-panel-v2 {
        display:grid;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr);
        gap:10px;
        margin-top:-2px;
        margin-bottom:10px;
        padding:10px;
        border:1px solid var(--border);
        border-radius:10px;
        background:rgba(255,255,255,.018);
      }
      #event-end-panel-v2 .form-group { margin-bottom:0 !important; }
      .calendar-repeat-row-v2 { grid-template-columns:minmax(0,1fr) !important; }

      .flatpickr-current-month .flatpickr-monthDropdown-months {
        appearance:auto !important;
        -webkit-appearance:menulist !important;
        opacity:1 !important;
        cursor:pointer !important;
      }
      .flatpickr-current-month .numInputWrapper,
      .flatpickr-current-month .cur-year {
        cursor:text !important;
      }
      .flatpickr-current-month {
        pointer-events:auto !important;
      }

      @media (max-width:768px) {
        body.calendar-ui-v2 .brand-text h1 { font-size:18px !important; }
        .calendar-toolbar-v2 { gap:6px; margin-bottom:6px; }
        .calendar-toolbar-v2 .month-nav { gap:3px !important; }
        .calendar-toolbar-v2 .month-nav button {
          width:26px !important;
          height:26px !important;
        }
        .calendar-toolbar-v2 #month-label {
          font-size:10px !important;
          padding:0 2px !important;
        }
        .calendar-toolbar-v2 .cal-week-number,
        .calendar-toolbar-v2 .calendar-week-number-v2 { font-size:9px; }
        #event-end-panel-v2 { grid-template-columns:1fr; gap:8px; }
        .event-end-toggle-v2 { padding:9px 10px; }
      }
    `;
    document.head.appendChild(style);
  }

  function isoWeek(date) {
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  function currentCalendarDate() {
    try {
      if (typeof currentDate !== 'undefined' && currentDate instanceof Date) return new Date(currentDate.getTime());
    } catch (e) {}
    return new Date();
  }

  function ensureCalendarToolbar() {
    var section = document.querySelector('.cal-section');
    var nav = document.querySelector('.month-nav');
    if (!section || !nav) return;

    var toolbar = section.querySelector('.calendar-toolbar-v2');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'calendar-toolbar-v2';
      var weekdays = section.querySelector('.cal-weekdays');
      if (weekdays) section.insertBefore(toolbar, weekdays);
      else section.insertBefore(toolbar, section.firstChild);
    }

    var week = document.getElementById('calendar-week-number');
    if (!week) {
      week = document.createElement('div');
      week.id = 'calendar-week-number-v2';
      week.className = 'calendar-week-number-v2';
      toolbar.appendChild(week);
    } else if (week.parentElement !== toolbar) {
      toolbar.appendChild(week);
    }

    if (nav.parentElement !== toolbar) toolbar.appendChild(nav);
    updateWeekLabel();
  }

  function updateWeekLabel() {
    var week = document.getElementById('calendar-week-number') || document.getElementById('calendar-week-number-v2');
    if (!week) return;
    var d = currentCalendarDate();
    var today = new Date();
    if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) d = today;
    else d = new Date(d.getFullYear(), d.getMonth(), 1);
    week.textContent = 'Vecka ' + isoWeek(d);
  }

  function setEndEnabled(enabled) {
    var btn = document.getElementById('event-end-switch-v2');
    var panel = document.getElementById('event-end-panel-v2');
    enabled = !!enabled;
    if (btn) btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    if (panel) panel.hidden = !enabled;
    if (!enabled) {
      var endTime = document.getElementById('ev-end-time');
      var endDate = document.getElementById('ev-end-date');
      if (endTime) endTime.value = '';
      if (endDate) endDate.value = '';
    }
  }

  function initDatePicker(el) {
    if (!el || typeof flatpickr === 'undefined') return;
    try {
      if (el._flatpickr) {
        el._flatpickr.set('monthSelectorType', 'dropdown');
        el._flatpickr.redraw();
        return;
      }
      flatpickr(el, {
        dateFormat:'Y-m-d',
        monthSelectorType:'dropdown',
        allowInput:true,
        clickOpens:true,
        disableMobile:true
      });
    } catch (e) {}
  }

  function upgradeExistingDatePickers() {
    ['trip-start-inp','trip-end-inp','ev-date','ev-repeat-until','ev-end-date'].forEach(function (id) {
      initDatePicker(document.getElementById(id));
    });
  }

  function ensureEndControls() {
    if (document.getElementById('event-end-toggle-v2')) return;
    var dateInput = document.getElementById('ev-date');
    var endTime = document.getElementById('ev-end-time');
    if (!dateInput || !endTime) return;

    var startRow = dateInput.closest('.form-row');
    var endTimeGroup = endTime.closest('.form-group');
    if (!startRow || !endTimeGroup) return;

    var oldRow = endTimeGroup.parentElement;
    var toggle = document.createElement('div');
    toggle.id = 'event-end-toggle-v2';
    toggle.className = 'event-end-toggle-v2';
    toggle.innerHTML =
      '<div class="event-end-toggle-v2-copy"><strong>Slutdatum / sluttid</strong><span>Aktivera om händelsen har ett slut.</span></div>' +
      '<button type="button" id="event-end-switch-v2" class="event-end-switch-v2" aria-pressed="false" aria-label="Aktivera slutdatum och sluttid"></button>';

    var panel = document.createElement('div');
    panel.id = 'event-end-panel-v2';
    panel.hidden = true;

    var endDateGroup = document.createElement('div');
    endDateGroup.className = 'form-group';
    endDateGroup.innerHTML = '<label>Slutdatum</label><input type="text" id="ev-end-date" lang="sv-SE" data-picker="date" placeholder="YYYY-MM-DD">';

    var label = endTimeGroup.querySelector('label');
    if (label) label.textContent = 'Sluttid';

    startRow.insertAdjacentElement('afterend', toggle);
    toggle.insertAdjacentElement('afterend', panel);
    panel.appendChild(endDateGroup);
    panel.appendChild(endTimeGroup);

    if (oldRow && oldRow.children.length === 1) oldRow.classList.add('calendar-repeat-row-v2');
    else if (oldRow && oldRow.children.length === 0) oldRow.remove();

    document.getElementById('event-end-switch-v2').addEventListener('click', function () {
      setEndEnabled(this.getAttribute('aria-pressed') !== 'true');
      if (this.getAttribute('aria-pressed') === 'true') {
        var startDate = document.getElementById('ev-date');
        var endDate = document.getElementById('ev-end-date');
        if (endDate && !endDate.value && startDate) endDate.value = startDate.value;
      }
    });

    initDatePicker(document.getElementById('ev-end-date'));
  }

  function getEventsSafe() {
    try { return typeof window.getEvents === 'function' ? (window.getEvents() || []) : []; }
    catch (e) { return []; }
  }

  function saveEventsSafe(events) {
    try { if (typeof window.saveEvents === 'function') window.saveEvents(events); }
    catch (e) {}
  }

  function syncEndUiFromEvent(ev) {
    var endDate = document.getElementById('ev-end-date');
    var endTime = document.getElementById('ev-end-time');
    if (!endDate || !endTime) return;
    if (!ev) {
      endDate.value = '';
      setEndEnabled(false);
      return;
    }
    var enabled = !!(ev.endDate || ev.endTime);
    endDate.value = ev.endDate || (enabled ? (ev.date || '') : '');
    endTime.value = ev.endTime || '';
    setEndEnabled(enabled);
    if (enabled) {
      endDate.value = ev.endDate || ev.date || '';
      endTime.value = ev.endTime || '';
    }
  }

  function refreshCalendarViews() {
    try { if (typeof window.renderMonth === 'function') window.renderMonth(); } catch (e) {}
    try { if (typeof window.renderUpcoming === 'function') window.renderUpcoming(); } catch (e) {}
    try {
      if (typeof selectedDate !== 'undefined' && selectedDate && typeof window.renderDayEvents === 'function') {
        window.renderDayEvents(selectedDate);
      }
    } catch (e) {}
    updateWeekLabel();
  }

  function bindEventFunctions() {
    if (typeof window.openEventModal === 'function' && !window.openEventModal.__calendarUiV2Wrapped) {
      var originalOpen = window.openEventModal;
      var wrappedOpen = function () {
        var result = originalOpen.apply(this, arguments);
        setTimeout(function () { syncEndUiFromEvent(null); upgradeExistingDatePickers(); }, 0);
        return result;
      };
      wrappedOpen.__calendarUiV2Wrapped = true;
      window.openEventModal = wrappedOpen;
    }

    if (typeof window.editEvent === 'function' && !window.editEvent.__calendarUiV2Wrapped) {
      var originalEdit = window.editEvent;
      var wrappedEdit = function (id) {
        var result = originalEdit.apply(this, arguments);
        var events = getEventsSafe();
        var ev = events.find(function (item) { return String(item && item.id) === String(id); }) || null;
        setTimeout(function () { syncEndUiFromEvent(ev); upgradeExistingDatePickers(); }, 0);
        return result;
      };
      wrappedEdit.__calendarUiV2Wrapped = true;
      window.editEvent = wrappedEdit;
    }

    if (typeof window.saveEvent === 'function' && !window.saveEvent.__calendarUiV2Wrapped) {
      var originalSave = window.saveEvent;
      var wrappedSave = function () {
        var enabled = !!(document.getElementById('event-end-switch-v2') && document.getElementById('event-end-switch-v2').getAttribute('aria-pressed') === 'true');
        var startDateEl = document.getElementById('ev-date');
        var startTimeEl = document.getElementById('ev-time');
        var endDateEl = document.getElementById('ev-end-date');
        var endTimeEl = document.getElementById('ev-end-time');
        var editIdEl = document.getElementById('edit-event-id');
        var startDate = startDateEl ? startDateEl.value : '';
        var startTime = startTimeEl ? startTimeEl.value : '';
        var endDate = enabled && endDateEl ? (endDateEl.value || startDate) : '';
        var endTime = enabled && endTimeEl ? endTimeEl.value : '';

        if (enabled && endDate && startDate && endDate < startDate) {
          if (typeof window.showToast === 'function') window.showToast('Slutdatum kan inte vara före startdatum.');
          if (endDateEl) endDateEl.focus();
          return;
        }
        if (enabled && endDate === startDate && startTime && endTime && endTime < startTime) {
          if (typeof window.showToast === 'function') window.showToast('Sluttiden måste vara efter starttiden.');
          if (endTimeEl) endTimeEl.focus();
          return;
        }

        if (!enabled && endTimeEl) endTimeEl.value = '';
        if (enabled && endDateEl && !endDateEl.value) endDateEl.value = startDate;

        var before = getEventsSafe();
        var beforeIds = before.map(function (ev) { return String(ev && ev.id); });
        var editId = editIdEl ? String(editIdEl.value || '') : '';
        var result = originalSave.apply(this, arguments);

        var events = getEventsSafe();
        var target = null;
        if (editId) {
          target = events.find(function (ev) { return String(ev && ev.id) === editId; }) || null;
        } else {
          for (var i = events.length - 1; i >= 0; i--) {
            if (beforeIds.indexOf(String(events[i] && events[i].id)) < 0) { target = events[i]; break; }
          }
        }

        if (target) {
          target.endDate = enabled ? (endDate || target.date || '') : '';
          if (!enabled) target.endTime = '';
          saveEventsSafe(events);
          refreshCalendarViews();
        }
        return result;
      };
      wrappedSave.__calendarUiV2Wrapped = true;
      window.saveEvent = wrappedSave;
    }
  }

  function addDays(iso, delta) {
    var p = String(iso || '').split('-').map(Number);
    if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return '';
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + delta));
    return d.toISOString().slice(0, 10);
  }

  function bindRangeExpansion() {
    if (typeof window.expandRepeating !== 'function' || window.expandRepeating.__calendarUiV2Wrapped) return;
    var originalExpand = window.expandRepeating;
    var wrappedExpand = function () {
      var base = originalExpand.apply(this, arguments) || [];
      var out = [];
      base.forEach(function (ev) {
        out.push(ev);
        if (!ev || !ev.endDate || !ev.date || ev.endDate <= ev.date) return;
        var cursor = ev.date;
        var guard = 0;
        while (cursor < ev.endDate && guard < 370) {
          guard++;
          cursor = addDays(cursor, 1);
          if (!cursor || cursor > ev.endDate) break;
          var clone = Object.assign({}, ev);
          clone.date = cursor;
          clone.__rangeContinuation = true;
          clone.__rangeStart = ev.date;
          out.push(clone);
        }
      });
      return out;
    };
    wrappedExpand.__calendarUiV2Wrapped = true;
    window.expandRepeating = wrappedExpand;
  }

  function bindTimeFormatting() {
    if (typeof window.formatEventTimeRange !== 'function' || window.formatEventTimeRange.__calendarUiV2Wrapped) return;
    var original = window.formatEventTimeRange;
    var wrapped = function (ev) {
      if (!ev || !ev.endDate || ev.endDate === ev.date) return original.apply(this, arguments);
      var p = String(ev.endDate).split('-');
      var shortDate = p.length === 3 ? (p[2] + '/' + p[1]) : ev.endDate;
      var start = ev.time || '';
      var end = ev.endTime || '';
      if (ev.__rangeContinuation) return 'Pågår till ' + shortDate + (end ? ' ' + end : '');
      return (start ? start + ' → ' : 'Till ') + shortDate + (end ? ' ' + end : '');
    };
    wrapped.__calendarUiV2Wrapped = true;
    window.formatEventTimeRange = wrapped;
  }

  function bindMonthNavigationRefresh() {
    document.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('.month-nav button') : null;
      if (!button) return;
      setTimeout(function () { updateWeekLabel(); upgradeExistingDatePickers(); }, 0);
    });
  }

  function bindFlatpickrYearSelect() {
    document.addEventListener('focusin', function (event) {
      var target = event.target;
      if (target && target.classList && target.classList.contains('cur-year') && typeof target.select === 'function') {
        setTimeout(function () { try { target.select(); } catch (e) {} }, 0);
      }
    });
  }

  function install() {
    if (window.__calendarUiV2Installed) return;
    if (!document.querySelector('.cal-section') || !document.getElementById('event-modal')) {
      setTimeout(install, 60);
      return;
    }
    window.__calendarUiV2Installed = true;
    document.body.classList.add('calendar-ui-v2');
    addStyles();
    ensureCalendarToolbar();
    ensureEndControls();
    upgradeExistingDatePickers();
    bindEventFunctions();
    bindRangeExpansion();
    bindTimeFormatting();
    bindMonthNavigationRefresh();
    bindFlatpickrYearSelect();
    refreshCalendarViews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 0); }, { once:true });
  } else {
    setTimeout(install, 0);
  }
})();
