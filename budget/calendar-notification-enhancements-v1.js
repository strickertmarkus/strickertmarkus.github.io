(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  var isCalendar = path.endsWith('/budget/calendar.html') || path.endsWith('/calendar.html');
  if (!isHome && !isCalendar) return;

  function getEventsSafe() {
    try { return typeof window.getEvents === 'function' ? (window.getEvents() || []) : []; }
    catch (_) { return []; }
  }

  function persistEvents(events) {
    try {
      if (window.DB && typeof window.DB.set === 'function') {
        window.DB.set('events', events);
        return true;
      }
    } catch (_) {}
    try {
      localStorage.setItem('cal_events', JSON.stringify(events));
      return true;
    } catch (_) {}
    return false;
  }

  function normalizeReminderSelect() {
    var select = document.getElementById('ev-reminder');
    if (!select) return null;

    var current = String(select.value || '');
    if (select.dataset.defaultReminderV2 !== 'true') {
      select.innerHTML =
        '<option value="1440">Standard – 1 dag före</option>' +
        '<option value="-1">Ingen påminnelse</option>' +
        '<option value="0">Vid starttid</option>' +
        '<option value="15">15 min före</option>' +
        '<option value="60">1 timme före</option>' +
        '<option value="180">3 timmar före</option>';
      select.dataset.defaultReminderV2 = 'true';
    }

    if (current === '-1' || current === '0' || current === '15' || current === '60' || current === '180' || current === '1440') {
      select.value = current;
    }

    var note = document.querySelector('.push-reminder-note');
    var text = 'Standard är 1 dag före. Schemalagd påminnelse kräver starttid.';
    if (note && note.textContent !== text) note.textContent = text;
    return select;
  }

  function setNewEventDefault() {
    var select = normalizeReminderSelect();
    if (select) select.value = '1440';
  }

  function setEditReminder(id) {
    var select = normalizeReminderSelect();
    if (!select) return;
    var ev = getEventsSafe().find(function (item) { return String(item && item.id) === String(id); });
    if (!ev || ev.reminderMinutes === null || ev.reminderMinutes === undefined || ev.reminderMinutes === '') {
      select.value = '1440';
      return;
    }
    select.value = Number(ev.reminderMinutes) < 0 ? '-1' : String(ev.reminderMinutes);
  }

  function wrapModalFunctions() {
    if (typeof window.openEventModal === 'function' && !window.openEventModal.__notificationEnhancementsV2) {
      var originalOpen = window.openEventModal;
      var wrappedOpen = function () {
        var result = originalOpen.apply(this, arguments);
        setTimeout(setNewEventDefault, 0);
        setTimeout(setNewEventDefault, 80);
        return result;
      };
      wrappedOpen.__notificationEnhancementsV2 = true;
      window.openEventModal = wrappedOpen;
    }

    if (typeof window.editEvent === 'function' && !window.editEvent.__notificationEnhancementsV2) {
      var originalEdit = window.editEvent;
      var wrappedEdit = function (id) {
        var result = originalEdit.apply(this, arguments);
        setTimeout(function () { setEditReminder(id); }, 0);
        setTimeout(function () { setEditReminder(id); }, 80);
        return result;
      };
      wrappedEdit.__notificationEnhancementsV2 = true;
      window.editEvent = wrappedEdit;
    }
  }

  function wrapSaveEvent() {
    if (typeof window.saveEvent !== 'function' || window.saveEvent.__notificationEnhancementsV2) return;
    var originalSave = window.saveEvent;

    var wrappedSave = function () {
      var select = normalizeReminderSelect();
      var rawReminder = select ? String(select.value || '1440') : '1440';
      var editIdEl = document.getElementById('edit-event-id');
      var editId = editIdEl ? String(editIdEl.value || '') : '';
      var before = getEventsSafe();
      var beforeIds = before.map(function (ev) { return String(ev && ev.id); });

      var result = originalSave.apply(this, arguments);

      var applySavedValue = function () {
        var events = getEventsSafe();
        var target = null;
        if (editId) {
          target = events.find(function (ev) { return String(ev && ev.id) === editId; }) || null;
        } else {
          for (var i = events.length - 1; i >= 0; i--) {
            if (beforeIds.indexOf(String(events[i] && events[i].id)) < 0) {
              target = events[i];
              break;
            }
          }
        }
        if (!target) return false;
        target.reminderMinutes = rawReminder === '-1' ? -1 : Number(rawReminder || 1440);
        persistEvents(events);
        return true;
      };

      if (!applySavedValue()) setTimeout(applySavedValue, 80);
      return result;
    };

    wrappedSave.__notificationEnhancementsV2 = true;
    window.saveEvent = wrappedSave;
  }

  function install() {
    normalizeReminderSelect();
    wrapModalFunctions();
    wrapSaveEvent();
  }

  install();
  var attempts = 0;
  var timer = setInterval(function () {
    install();
    attempts += 1;
    if (attempts >= 40) clearInterval(timer);
  }, 250);
})();