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

  function formatDateSv(iso) {
    var parts = String(iso || '').split('-');
    if (parts.length !== 3) return String(iso || '');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function queueCreatedNotification(ev) {
    if (!ev || !ev.id || !ev.date) return;
    if (!window.firebase || !firebase.database) return;

    var when = 'En ny kalenderpåminnelse har lagts in den ' + formatDateSv(ev.date);
    if (ev.time) when += ' kl: ' + ev.time;
    when += '.';

    try {
      firebase.database().ref('pushQueue').push({
        type: 'event-created',
        member: ev.member || 'family',
        title: 'Ny kalenderpåminnelse',
        body: when,
        url: 'calendar.html?date=' + encodeURIComponent(ev.date) + '&event=' + encodeURIComponent(ev.id),
        status: 'pending',
        eventId: String(ev.id),
        createdAt: firebase.database.ServerValue.TIMESTAMP
      }).catch(function (error) {
        console.warn('[push] Kunde inte köa notis för ny kalenderhändelse', error);
      });
    } catch (error) {
      console.warn('[push] Kunde inte köa notis för ny kalenderhändelse', error);
    }
  }

  function reminderValueForEvent(ev) {
    if (!ev || ev.reminderMinutes === null || ev.reminderMinutes === undefined || ev.reminderMinutes === '') return '';
    if (Number(ev.reminderMinutes) < 0) return 'none';
    return String(ev.reminderMinutes);
  }

  function decorateReminderSelect() {
    var select = document.getElementById('ev-reminder');
    if (!select) return;

    var current = select.value;
    if (select.dataset.defaultReminderV1 !== 'true') {
      select.innerHTML =
        '<option value="">Standard – 1 dag före</option>' +
        '<option value="none">Ingen påminnelse</option>' +
        '<option value="0">Vid starttid</option>' +
        '<option value="15">15 min före</option>' +
        '<option value="60">1 timme före</option>' +
        '<option value="180">3 timmar före</option>' +
        '<option value="1440">1 dag före</option>';
      select.dataset.defaultReminderV1 = 'true';
    }

    if (current === 'none' || current === '' || /^\d+$/.test(current)) select.value = current;

    var note = document.querySelector('.push-reminder-note');
    if (note) note.textContent = 'Standard är 1 dag före. Schemalagd påminnelse kräver starttid.';
  }

  function setNewEventDefault() {
    decorateReminderSelect();
    var select = document.getElementById('ev-reminder');
    if (select) select.value = '';
  }

  function setEditReminder(id) {
    decorateReminderSelect();
    var select = document.getElementById('ev-reminder');
    if (!select) return;
    var ev = getEventsSafe().find(function (item) { return String(item && item.id) === String(id); });
    select.value = reminderValueForEvent(ev);
  }

  function wrapModalFunctions() {
    if (typeof window.openEventModal === 'function' && !window.openEventModal.__notificationEnhancementsV1) {
      var originalOpen = window.openEventModal;
      var wrappedOpen = function () {
        var result = originalOpen.apply(this, arguments);
        setTimeout(setNewEventDefault, 0);
        setTimeout(setNewEventDefault, 80);
        return result;
      };
      wrappedOpen.__notificationEnhancementsV1 = true;
      window.openEventModal = wrappedOpen;
    }

    if (typeof window.editEvent === 'function' && !window.editEvent.__notificationEnhancementsV1) {
      var originalEdit = window.editEvent;
      var wrappedEdit = function (id) {
        var result = originalEdit.apply(this, arguments);
        setTimeout(function () { setEditReminder(id); }, 0);
        setTimeout(function () { setEditReminder(id); }, 80);
        return result;
      };
      wrappedEdit.__notificationEnhancementsV1 = true;
      window.editEvent = wrappedEdit;
    }
  }

  function wrapSaveEvent() {
    if (typeof window.saveEvent !== 'function' || window.saveEvent.__notificationEnhancementsV1) return;
    var originalSave = window.saveEvent;

    var wrappedSave = function () {
      var editIdEl = document.getElementById('edit-event-id');
      var editId = editIdEl ? String(editIdEl.value || '') : '';
      var isNew = !editId;
      var before = getEventsSafe();
      var beforeIds = before.map(function (ev) { return String(ev && ev.id); });
      var select = document.getElementById('ev-reminder');
      var rawReminder = select ? String(select.value || '') : '';

      // Existing save functions only understand numeric/empty values. Temporarily
      // translate the explicit "none" option to empty, then store -1 afterwards.
      if (select && rawReminder === 'none') select.value = '';
      var result = originalSave.apply(this, arguments);
      if (select) select.value = rawReminder;

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

      if (target) {
        if (rawReminder === 'none') target.reminderMinutes = -1;
        else if (rawReminder === '') target.reminderMinutes = null;
        else {
          var minutes = Number(rawReminder);
          target.reminderMinutes = Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
        }
        persistEvents(events);
        if (isNew) queueCreatedNotification(target);
      }

      return result;
    };

    wrappedSave.__notificationEnhancementsV1 = true;
    window.saveEvent = wrappedSave;
  }

  function install() {
    decorateReminderSelect();
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

  if (document.body && window.MutationObserver) {
    var observer = new MutationObserver(function () { decorateReminderSelect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 15000);
  }
})();