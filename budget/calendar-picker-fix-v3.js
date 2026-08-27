(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  var isCalendar = path.endsWith('/budget/calendar.html') || path.endsWith('/calendar.html');
  if (!isHome && !isCalendar) return;

  var DATE_IDS = ['trip-start-inp', 'trip-end-inp', 'ev-date', 'ev-repeat-until', 'ev-end-date'];
  var MONTHS = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
  var activeMonthMenu = null;
  var activeMonthAnchor = null;

  function addStyles() {
    if (document.getElementById('calendar-picker-fix-v3-style')) return;
    var style = document.createElement('style');
    style.id = 'calendar-picker-fix-v3-style';
    style.textContent = `
      .flatpickr-current-month .cur-month.calendar-month-click-v3 {
        cursor:pointer !important;
        border-radius:6px;
        padding:2px 5px;
        transition:background .15s ease;
      }
      .flatpickr-current-month .cur-month.calendar-month-click-v3:hover,
      .flatpickr-current-month .cur-month.calendar-month-click-v3:focus-visible {
        background:rgba(251,191,36,.12);
        outline:none;
      }
      .flatpickr-current-month .cur-year.calendar-year-click-v3 {
        cursor:text !important;
      }
      .calendar-month-menu-v3 {
        position:absolute;
        z-index:9999;
        top:38px;
        left:10px;
        right:10px;
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:5px;
        padding:8px;
        border:1px solid rgba(255,255,255,.12);
        border-radius:10px;
        background:#1E2638;
        box-shadow:0 12px 30px rgba(0,0,0,.48);
      }
      .calendar-month-menu-v3 button {
        border:1px solid rgba(255,255,255,.08);
        border-radius:7px;
        background:rgba(255,255,255,.035);
        color:#DCE6F2;
        padding:7px 4px;
        font:600 11px/1.1 Inter, sans-serif;
        cursor:pointer;
      }
      .calendar-month-menu-v3 button:hover,
      .calendar-month-menu-v3 button.active {
        border-color:rgba(251,191,36,.42);
        background:rgba(251,191,36,.12);
        color:#FBBF24;
      }
      @media(max-width:768px) {
        .calendar-month-menu-v3 { gap:4px; padding:7px; }
        .calendar-month-menu-v3 button { min-height:34px; font-size:10px; }
      }
    `;
    document.head.appendChild(style);
  }

  function closeMonthMenu() {
    if (activeMonthMenu && activeMonthMenu.parentNode) activeMonthMenu.parentNode.removeChild(activeMonthMenu);
    activeMonthMenu = null;
    activeMonthAnchor = null;
  }

  function closeAllPickers(except) {
    DATE_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      var fp = el && el._flatpickr;
      if (!fp || fp === except) return;
      try { fp.close(); } catch (e) {}
    });
  }

  function openMonthMenu(instance, anchor) {
    closeMonthMenu();
    if (!instance || !instance.calendarContainer || !anchor) return;

    var menu = document.createElement('div');
    menu.className = 'calendar-month-menu-v3';
    menu.setAttribute('role', 'menu');

    MONTHS.forEach(function (name, index) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = name.slice(0, 3);
      btn.title = name;
      btn.className = index === instance.currentMonth ? 'active' : '';
      btn.addEventListener('pointerdown', function (event) {
        event.preventDefault();
        event.stopPropagation();
      });
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        try { instance.changeMonth(index, false); } catch (e) {}
        closeMonthMenu();
        setTimeout(function () { decoratePicker(instance); }, 0);
      });
      menu.appendChild(btn);
    });

    instance.calendarContainer.appendChild(menu);
    activeMonthMenu = menu;
    activeMonthAnchor = anchor;
  }

  function decoratePicker(instance) {
    if (!instance || !instance.calendarContainer) return;

    var month = instance.calendarContainer.querySelector('.flatpickr-current-month .cur-month');
    if (month && !month.__calendarMonthV3Bound) {
      month.__calendarMonthV3Bound = true;
      month.classList.add('calendar-month-click-v3');
      month.setAttribute('tabindex', '0');
      month.setAttribute('role', 'button');
      month.setAttribute('title', 'Välj månad');
      month.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (activeMonthMenu && activeMonthAnchor === month) {
          closeMonthMenu();
        } else {
          openMonthMenu(instance, month);
        }
      });
      month.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        month.click();
      });
    }

    var year = instance.calendarContainer.querySelector('.flatpickr-current-month .cur-year');
    if (year && !year.__calendarYearV3Bound) {
      year.__calendarYearV3Bound = true;
      year.classList.add('calendar-year-click-v3');
      year.setAttribute('title', 'Klicka för att välja år');
      year.addEventListener('click', function () {
        try { year.focus(); year.select(); } catch (e) {}
      });
      year.addEventListener('focus', function () {
        setTimeout(function () { try { year.select(); } catch (e) {} }, 0);
      });
    }
  }

  function pickerOptions(el, previousValue) {
    return {
      dateFormat: 'Y-m-d',
      monthSelectorType: 'static',
      allowInput: true,
      clickOpens: true,
      disableMobile: true,
      closeOnSelect: true,
      defaultDate: previousValue || null,
      onReady: function (selectedDates, dateStr, instance) {
        instance.__calendarPickerV3 = true;
        decoratePicker(instance);
      },
      onOpen: function (selectedDates, dateStr, instance) {
        closeAllPickers(instance);
        closeMonthMenu();
        decoratePicker(instance);
      },
      onMonthChange: function (selectedDates, dateStr, instance) {
        closeMonthMenu();
        setTimeout(function () { decoratePicker(instance); }, 0);
      },
      onYearChange: function (selectedDates, dateStr, instance) {
        closeMonthMenu();
        setTimeout(function () { decoratePicker(instance); }, 0);
      },
      onChange: function (selectedDates, dateStr, instance) {
        /* Explicitly sync the visible input before closing. This avoids the
           broken state where the calendar changed internally but the text
           field remained stale. */
        el.value = dateStr || '';
        try { el.dispatchEvent(new Event('input', { bubbles:true })); } catch (e) {}
        try { el.dispatchEvent(new Event('change', { bubbles:true })); } catch (e) {}
        closeMonthMenu();
        setTimeout(function () { try { instance.close(); } catch (e) {} }, 0);
      },
      onClose: function () { closeMonthMenu(); }
    };
  }

  function repairPicker(el) {
    if (!el || typeof flatpickr === 'undefined') return;

    var old = el._flatpickr;
    if (old && old.__calendarPickerV3 && old.config && old.config.monthSelectorType === 'static') {
      decoratePicker(old);
      return;
    }

    var value = String(el.value || '').trim();
    try { if (old) old.destroy(); } catch (e) {}

    try {
      var fp = flatpickr(el, pickerOptions(el, value));
      fp.__calendarPickerV3 = true;
      decoratePicker(fp);
    } catch (e) {}
  }

  function repairAllPickers() {
    DATE_IDS.forEach(function (id) { repairPicker(document.getElementById(id)); });
  }

  function bindCalendarFunctions() {
    if (typeof window.openEventModal === 'function' && !window.openEventModal.__calendarPickerV3Wrapped) {
      var originalOpen = window.openEventModal;
      var openWrapped = function () {
        var result = originalOpen.apply(this, arguments);
        setTimeout(repairAllPickers, 20);
        return result;
      };
      openWrapped.__calendarPickerV3Wrapped = true;
      window.openEventModal = openWrapped;
    }

    if (typeof window.editEvent === 'function' && !window.editEvent.__calendarPickerV3Wrapped) {
      var originalEdit = window.editEvent;
      var editWrapped = function () {
        var result = originalEdit.apply(this, arguments);
        setTimeout(repairAllPickers, 20);
        return result;
      };
      editWrapped.__calendarPickerV3Wrapped = true;
      window.editEvent = editWrapped;
    }
  }

  function bindGlobalClose() {
    document.addEventListener('pointerdown', function (event) {
      var target = event.target;
      if (!target) return;

      if (activeMonthMenu && !activeMonthMenu.contains(target) && target !== activeMonthAnchor) {
        closeMonthMenu();
      }

      if (target.closest && target.closest('.flatpickr-calendar')) return;

      var clickedDateInput = false;
      for (var i = 0; i < DATE_IDS.length; i++) {
        var el = document.getElementById(DATE_IDS[i]);
        if (el && (target === el || (target.closest && target.closest('#' + DATE_IDS[i])))) {
          clickedDateInput = true;
          break;
        }
      }
      if (!clickedDateInput) closeAllPickers(null);
    }, true);

    document.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('.month-nav button') : null;
      if (!button) return;
      setTimeout(repairAllPickers, 30);
    });
  }

  function install() {
    if (window.__calendarPickerV3Installed) return;
    if (typeof flatpickr === 'undefined' || !document.getElementById('event-modal')) {
      setTimeout(install, 60);
      return;
    }
    window.__calendarPickerV3Installed = true;
    addStyles();
    repairAllPickers();
    bindCalendarFunctions();
    bindGlobalClose();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 30); }, { once:true });
  } else {
    setTimeout(install, 30);
  }
})();
