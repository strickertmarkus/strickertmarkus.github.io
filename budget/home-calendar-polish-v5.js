(function () {
  'use strict';

  if (window.__homeCalendarPolishV5Loader20260911) return;
  window.__homeCalendarPolishV5Loader20260911 = true;

  function installDayPreviewEditV1() {
    if (window.__homeDayPreviewEditV1Installed) return;
    if (typeof window.openDayEventsPopup !== 'function' || typeof window.closeDayEventsPopup !== 'function') {
      setTimeout(installDayPreviewEditV1, 50);
      return;
    }

    window.__homeDayPreviewEditV1Installed = true;

    var activeDayISO = '';
    var activeEvents = [];
    var originalOpenDayEventsPopup = window.openDayEventsPopup;
    var originalCloseDayEventsPopup = window.closeDayEventsPopup;

    function previewIsOpen() {
      var pop = document.getElementById('home-day-popover');
      return !!(pop && pop.getAttribute('aria-hidden') !== 'true');
    }

    function editPreviewEvent(ev) {
      if (!ev || typeof window.editEvent !== 'function') return false;
      var eventId = ev.__sourceEventId || ev.id;
      if (!eventId) return false;
      window.closeDayEventsPopup();
      window.editEvent(eventId);
      return true;
    }

    function decoratePreviewItems() {
      var pop = document.getElementById('home-day-popover');
      if (!pop || pop.getAttribute('aria-hidden') === 'true') return;

      var items = pop.querySelectorAll('.home-day-popover-item');
      items.forEach(function (item, index) {
        item.setAttribute('data-home-preview-index', String(index));
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', 'Redigera händelse');
        item.style.cursor = 'pointer';
      });
    }

    window.openDayEventsPopup = function (dayISO, dayEvents, anchorEl) {
      var events = Array.isArray(dayEvents) ? dayEvents : [];
      var sameDaySecondClick = previewIsOpen() && activeDayISO === dayISO;

      if (sameDaySecondClick && events.length === 1 && editPreviewEvent(events[0])) {
        return;
      }

      activeDayISO = dayISO || '';
      activeEvents = events.slice();

      var result = originalOpenDayEventsPopup.apply(this, arguments);
      requestAnimationFrame(decoratePreviewItems);
      return result;
    };

    window.closeDayEventsPopup = function () {
      activeDayISO = '';
      activeEvents = [];
      return originalCloseDayEventsPopup.apply(this, arguments);
    };

    // Capture outside clicks so the preview closes even when another control
    // inside the calendar stops propagation. Keep the active day itself open
    // long enough for a second click to be interpreted as an edit action.
    document.addEventListener('click', function (event) {
      var pop = document.getElementById('home-day-popover');
      if (!pop || pop.getAttribute('aria-hidden') === 'true' || pop.contains(event.target)) return;

      var cell = event.target.closest ? event.target.closest('.cal-cell') : null;
      if (cell && cell.dataset && cell.dataset.date === activeDayISO) return;

      window.closeDayEventsPopup();
    }, true);

    document.addEventListener('click', function (event) {
      var pop = document.getElementById('home-day-popover');
      if (!pop || pop.getAttribute('aria-hidden') === 'true') return;

      var item = event.target.closest ? event.target.closest('.home-day-popover-item[data-home-preview-index]') : null;
      if (!item || !pop.contains(item)) return;

      var index = Number(item.getAttribute('data-home-preview-index'));
      var ev = Number.isFinite(index) ? activeEvents[index] : null;
      if (!ev) return;

      event.preventDefault();
      event.stopPropagation();
      editPreviewEvent(ev);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var item = event.target.closest ? event.target.closest('.home-day-popover-item[data-home-preview-index]') : null;
      if (!item) return;

      var pop = document.getElementById('home-day-popover');
      if (!pop || !pop.contains(item) || pop.getAttribute('aria-hidden') === 'true') return;

      var index = Number(item.getAttribute('data-home-preview-index'));
      var ev = Number.isFinite(index) ? activeEvents[index] : null;
      if (!ev) return;

      event.preventDefault();
      event.stopPropagation();
      editPreviewEvent(ev);
    });

    document.addEventListener('dblclick', function (event) {
      var cell = event.target.closest ? event.target.closest('.cal-cell.has-events') : null;
      if (!cell) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  function loadBasePolish() {
    var existing = document.querySelector('script[data-home-calendar-polish-v5-base="true"]');
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') installDayPreviewEditV1();
      else existing.addEventListener('load', installDayPreviewEditV1, { once: true });
      return;
    }

    var script = document.createElement('script');
    script.src = 'home-calendar-polish-v5-base-20260911.js?v=20260911-day-preview-edit-v1';
    script.async = false;
    script.setAttribute('data-home-calendar-polish-v5-base', 'true');
    script.addEventListener('load', function () {
      script.setAttribute('data-loaded', 'true');
      installDayPreviewEditV1();
    }, { once: true });
    script.addEventListener('error', installDayPreviewEditV1, { once: true });
    document.head.appendChild(script);
  }

  loadBasePolish();
})();
