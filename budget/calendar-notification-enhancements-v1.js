/* Calendar reminders: the one place for the reminder choices, the default for new events and
   the "Påminnelse" field in the event dialog. The default is per device, so each person has their own
   on their phone: pick another reminder in the dialog and tap "Använd som min standard".
   Home's saveEvent stores the field's value on the event (reminderMinutes, -1 = none);
   budget/push-worker.mjs sends the reminder and treats events without a value as 1 day before. */
(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  var isCalendar = path.endsWith('/budget/calendar.html') || path.endsWith('/calendar.html');
  if (!isHome && !isCalendar) return;

  var DEFAULT_KEY = 'cal_default_reminder_v1';
  var LEGACY_DEFAULT = 1440; /* what the sender uses for events saved without a choice */
  var CHOICES = [
    [-1, 'Ingen påminnelse'],
    [0, 'Vid starttid'],
    [15, '15 min före'],
    [30, '30 min före'],
    [60, '1 timme före'],
    [120, '2 timmar före'],
    [180, '3 timmar före'],
    [1440, '1 dag före'],
    [2880, '2 dagar före']
  ];

  function known(minutes) { return CHOICES.some(function (c) { return c[0] === minutes; }); }
  function labelOf(minutes) {
    var hit = CHOICES.filter(function (c) { return c[0] === minutes; })[0];
    return hit ? hit[1] : minutes + ' min före';
  }
  function getDefault() {
    var raw = null;
    try { raw = localStorage.getItem(DEFAULT_KEY); } catch (_) {}
    var value = raw === null || raw === '' ? LEGACY_DEFAULT : Number(raw);
    return known(value) ? value : LEGACY_DEFAULT;
  }
  function setDefault(minutes) {
    minutes = Number(minutes);
    if (!known(minutes)) return;
    try { localStorage.setItem(DEFAULT_KEY, String(minutes)); } catch (_) {}
    renderSelect();
  }
  /* The choices as <option>s, the default marked "(standard)". */
  function optionsHtml(markDefault) {
    var def = getDefault();
    return CHOICES.map(function (c) {
      return '<option value="' + c[0] + '">' + c[1] + (markDefault && c[0] === def ? ' (standard)' : '') + '</option>';
    }).join('');
  }

  window.CalendarReminders = { choices: CHOICES, getDefault: getDefault, setDefault: setDefault, label: labelOf, optionsHtml: optionsHtml };

  function renderSelect() {
    var select = document.getElementById('ev-reminder');
    if (!select) return null;
    var current = select.value;
    select.innerHTML = optionsHtml(true);
    select.dataset.reminderChoices = String(getDefault());
    if (current !== '' && known(Number(current))) select.value = current;
    syncNote(select);
    return select;
  }
  /* Under the field: what the standard is, and a button to make the chosen reminder the standard. */
  function syncNote(select) {
    var note = document.querySelector('.push-reminder-note');
    if (!note) { note = document.createElement('span'); note.className = 'push-reminder-note'; select.parentNode.insertBefore(note, select.nextSibling); }
    var text = 'Din standard är ' + labelOf(getDefault()).toLowerCase() + '. Påminnelsen kräver en starttid.';
    if (note.textContent !== text) note.textContent = text;
    var btn = document.getElementById('ev-reminder-make-default');
    if (!btn) {
      btn = document.createElement('button'); btn.type = 'button'; btn.id = 'ev-reminder-make-default'; btn.className = 'reminder-make-default';
      btn.textContent = 'Använd som min standard';
      btn.addEventListener('click', function () { var s = document.getElementById('ev-reminder'); if (s) setDefault(s.value); });
      note.parentNode.insertBefore(btn, note.nextSibling);
      select.addEventListener('change', function () { syncNote(select); });
    }
    var v = Number(select.value);
    btn.hidden = select.value === '' || v === getDefault() || !known(v);
  }
  function ensureStyle() {
    if (document.getElementById('calendar-reminders-style')) return;
    var st = document.createElement('style'); st.id = 'calendar-reminders-style';
    st.textContent = '.reminder-make-default{display:inline-block;margin-top:6px;padding:4px 0;background:none;border:0;font:600 12px/1.3 inherit;color:var(--accent,#FDBA74);cursor:pointer;text-decoration:underline;text-decoration-style:dashed;text-underline-offset:3px}.reminder-make-default[hidden]{display:none}';
    document.head.appendChild(st);
  }
  function ensureSelect() {
    var select = document.getElementById('ev-reminder');
    if (!select) return null;
    return select.dataset.reminderChoices === String(getDefault()) ? select : renderSelect();
  }

  function setNewEventDefault() {
    var select = ensureSelect();
    if (!select) return;
    select.value = String(getDefault()); syncNote(select);
  }

  function setEditReminder(id) {
    var select = ensureSelect();
    if (!select) return;
    var ev = null;
    try { ev = (window.getEvents() || []).find(function (item) { return String(item && item.id) === String(id); }); } catch (_) {}
    var stored = !ev || ev.reminderMinutes === null || ev.reminderMinutes === undefined || ev.reminderMinutes === '' ? LEGACY_DEFAULT : Number(ev.reminderMinutes);
    if (stored < 0) stored = -1;
    if (!known(stored)) { /* an older value outside the list stays selectable */
      var opt = document.createElement('option'); opt.value = String(stored); opt.textContent = labelOf(stored); select.appendChild(opt);
    }
    select.value = String(stored); syncNote(select);
  }

  function wrapModalFunctions() {
    if (typeof window.openEventModal === 'function' && !window.openEventModal.__calendarReminders) {
      var originalOpen = window.openEventModal;
      var wrappedOpen = function () {
        var result = originalOpen.apply(this, arguments);
        setNewEventDefault();
        return result;
      };
      wrappedOpen.__calendarReminders = true;
      window.openEventModal = wrappedOpen;
    }
    if (typeof window.editEvent === 'function' && !window.editEvent.__calendarReminders) {
      var originalEdit = window.editEvent;
      var wrappedEdit = function (id) {
        var result = originalEdit.apply(this, arguments);
        setEditReminder(id);
        return result;
      };
      wrappedEdit.__calendarReminders = true;
      window.editEvent = wrappedEdit;
    }
  }

  function install() {
    ensureStyle();
    ensureSelect();
    wrapModalFunctions();
    return !!(document.getElementById('ev-reminder') && window.openEventModal && window.openEventModal.__calendarReminders && window.editEvent && window.editEvent.__calendarReminders);
  }

  /* The dialog functions and the field come from Home's own script and the other calendar scripts. */
  if (!install()) {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      if (install() || attempts >= 40) clearInterval(timer);
    }, 250);
  }
})();
