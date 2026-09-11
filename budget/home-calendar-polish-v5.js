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
    var pendingDeleteEvent = null;
    var originalOpenDayEventsPopup = window.openDayEventsPopup;
    var originalCloseDayEventsPopup = window.closeDayEventsPopup;

    function addPreviewDeleteStyles() {
      if (document.getElementById('home-preview-delete-v2-style')) return;
      var style = document.createElement('style');
      style.id = 'home-preview-delete-v2-style';
      style.textContent = `
        body.home-calendar-polish-v5 .home-day-popover-item {
          position:relative;
          padding-right:34px !important;
        }
        body.home-calendar-polish-v5 .home-day-popover-item > div:nth-child(2) {
          min-width:0;
          flex:1 1 auto;
        }
        body.home-calendar-polish-v5 .home-preview-delete-v2 {
          position:absolute;
          right:6px;
          top:50%;
          transform:translateY(-50%);
          width:24px;
          height:24px;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:0;
          border-radius:8px;
          border:1px solid rgba(248,113,113,.12);
          background:rgba(248,113,113,.035);
          color:#8F97A3;
          font:500 17px/1 Inter,sans-serif;
          cursor:pointer;
          opacity:.72;
          transition:color .16s ease,background .16s ease,border-color .16s ease,box-shadow .16s ease,transform .16s ease,opacity .16s ease;
          -webkit-tap-highlight-color:transparent;
        }
        body.home-calendar-polish-v5 .home-preview-delete-v2:hover,
        body.home-calendar-polish-v5 .home-preview-delete-v2:focus-visible {
          color:#FCA5A5;
          background:rgba(248,113,113,.105);
          border-color:rgba(248,113,113,.30);
          box-shadow:0 0 14px rgba(248,113,113,.08);
          opacity:1;
          outline:none;
        }
        body.home-calendar-polish-v5 .home-preview-delete-v2:active {
          transform:translateY(-50%) scale(.92);
        }

        .home-delete-confirm-v2 {
          position:fixed;
          inset:0;
          z-index:3000;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:20px;
          background:rgba(5,7,11,.62);
          backdrop-filter:blur(7px);
          -webkit-backdrop-filter:blur(7px);
          opacity:0;
          visibility:hidden;
          pointer-events:none;
          transition:opacity .18s ease,visibility .18s ease;
        }
        .home-delete-confirm-v2.show {
          opacity:1;
          visibility:visible;
          pointer-events:auto;
        }
        .home-delete-confirm-card-v2 {
          position:relative;
          width:min(390px,calc(100vw - 34px));
          overflow:hidden;
          border:1px solid rgba(253,186,116,.20);
          border-radius:18px;
          padding:22px 20px 18px;
          background:
            radial-gradient(280px 130px at 18% 0%,rgba(253,186,116,.10),transparent 72%),
            linear-gradient(180deg,rgba(27,28,33,.985),rgba(16,19,26,.99));
          box-shadow:0 26px 70px rgba(0,0,0,.56),0 0 30px rgba(253,186,116,.045),inset 0 1px 0 rgba(255,255,255,.035);
          transform:translateY(8px) scale(.965);
          transition:transform .22s cubic-bezier(.16,1,.3,1);
        }
        .home-delete-confirm-v2.show .home-delete-confirm-card-v2 {
          transform:translateY(0) scale(1);
        }
        .home-delete-confirm-icon-v2 {
          width:38px;
          height:38px;
          display:flex;
          align-items:center;
          justify-content:center;
          margin-bottom:13px;
          border-radius:12px;
          border:1px solid rgba(248,113,113,.22);
          background:rgba(248,113,113,.075);
          color:#FCA5A5;
          font-size:22px;
          line-height:1;
          box-shadow:0 0 20px rgba(248,113,113,.045);
        }
        .home-delete-confirm-title-v2 {
          margin:0 34px 6px 0;
          color:#F0F6FC;
          font:700 17px/1.25 Inter,sans-serif;
          letter-spacing:-.2px;
        }
        .home-delete-confirm-copy-v2 {
          margin:0;
          color:#9CA6B4;
          font:500 12.5px/1.55 Inter,sans-serif;
        }
        .home-delete-confirm-event-v2 {
          display:block;
          margin-top:7px;
          color:#FDBA74;
          font-weight:650;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .home-delete-confirm-close-v2 {
          position:absolute;
          right:12px;
          top:12px;
          width:30px;
          height:30px;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:0;
          border:0;
          border-radius:9px;
          background:transparent;
          color:#737D8B;
          font:400 20px/1 Inter,sans-serif;
          cursor:pointer;
          transition:background .15s ease,color .15s ease;
        }
        .home-delete-confirm-close-v2:hover {
          background:rgba(255,255,255,.045);
          color:#D6DCE5;
        }
        .home-delete-confirm-actions-v2 {
          display:flex;
          justify-content:flex-end;
          gap:9px;
          margin-top:19px;
        }
        .home-delete-confirm-actions-v2 button {
          min-height:38px;
          padding:0 15px;
          border-radius:10px;
          font:650 12px/1 Inter,sans-serif;
          cursor:pointer;
          transition:transform .14s ease,background .14s ease,border-color .14s ease,box-shadow .14s ease;
        }
        .home-delete-confirm-cancel-v2 {
          border:1px solid rgba(253,186,116,.15);
          background:rgba(255,255,255,.035);
          color:#C9D1DC;
        }
        .home-delete-confirm-cancel-v2:hover {
          border-color:rgba(253,186,116,.26);
          background:rgba(253,186,116,.065);
          color:#F5D0A9;
        }
        .home-delete-confirm-submit-v2 {
          border:1px solid rgba(248,113,113,.38);
          background:linear-gradient(180deg,rgba(220,75,75,.94),rgba(185,55,55,.94));
          color:#FFF5F5;
          box-shadow:0 7px 18px rgba(185,55,55,.20),inset 0 1px 0 rgba(255,255,255,.12);
        }
        .home-delete-confirm-submit-v2:hover {
          border-color:rgba(252,165,165,.58);
          background:linear-gradient(180deg,rgba(231,82,82,.98),rgba(197,61,61,.98));
          box-shadow:0 9px 22px rgba(185,55,55,.28),0 0 18px rgba(248,113,113,.08);
        }
        .home-delete-confirm-actions-v2 button:active {
          transform:scale(.97);
        }
        @media(max-width:520px) {
          .home-delete-confirm-card-v2 { padding:20px 18px 17px; border-radius:17px; }
          .home-delete-confirm-actions-v2 button { flex:1 1 0; }
        }
        @media(prefers-reduced-motion:reduce) {
          .home-delete-confirm-v2,
          .home-delete-confirm-card-v2,
          body.home-calendar-polish-v5 .home-preview-delete-v2 { transition:none !important; }
        }
      `;
      document.head.appendChild(style);
    }

    function ensureDeleteConfirmDialog() {
      var existing = document.getElementById('home-delete-confirm-v2');
      if (existing) return existing;

      var overlay = document.createElement('div');
      overlay.id = 'home-delete-confirm-v2';
      overlay.className = 'home-delete-confirm-v2';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML =
        '<div class="home-delete-confirm-card-v2" role="alertdialog" aria-modal="true" aria-labelledby="home-delete-confirm-title-v2" aria-describedby="home-delete-confirm-copy-v2">' +
          '<button type="button" class="home-delete-confirm-close-v2" data-home-delete-cancel-v2 aria-label="Stäng">×</button>' +
          '<div class="home-delete-confirm-icon-v2" aria-hidden="true">×</div>' +
          '<h3 class="home-delete-confirm-title-v2" id="home-delete-confirm-title-v2">Ta bort händelse?</h3>' +
          '<p class="home-delete-confirm-copy-v2" id="home-delete-confirm-copy-v2">Händelsen tas bort från familjekalendern.<span class="home-delete-confirm-event-v2" id="home-delete-confirm-event-v2"></span></p>' +
          '<div class="home-delete-confirm-actions-v2">' +
            '<button type="button" class="home-delete-confirm-cancel-v2" data-home-delete-cancel-v2>Avbryt</button>' +
            '<button type="button" class="home-delete-confirm-submit-v2" id="home-delete-confirm-submit-v2">Ta bort</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);

      overlay.addEventListener('click', function (event) {
        if (event.target === overlay || (event.target.closest && event.target.closest('[data-home-delete-cancel-v2]'))) {
          closeDeleteConfirm();
        }
      });

      var submit = overlay.querySelector('#home-delete-confirm-submit-v2');
      if (submit) {
        submit.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          var ev = pendingDeleteEvent;
          closeDeleteConfirm();
          if (ev) deletePreviewEvent(ev);
        });
      }

      return overlay;
    }

    function closeDeleteConfirm() {
      var overlay = document.getElementById('home-delete-confirm-v2');
      if (!overlay) return;
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden', 'true');
      pendingDeleteEvent = null;
    }

    function openDeleteConfirm(ev) {
      if (!ev) return;
      pendingDeleteEvent = ev;
      var overlay = ensureDeleteConfirmDialog();
      var label = overlay.querySelector('#home-delete-confirm-event-v2');
      if (label) label.textContent = (ev.emoji ? ev.emoji + ' ' : '') + (ev.title || 'Händelse');
      overlay.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function () {
        overlay.classList.add('show');
        var submit = overlay.querySelector('#home-delete-confirm-submit-v2');
        if (submit) submit.focus();
      });
    }

    function previewIsOpen() {
      var pop = document.getElementById('home-day-popover');
      return !!(pop && pop.getAttribute('aria-hidden') !== 'true');
    }

    function eventSourceId(ev) {
      return ev && (ev.__sourceEventId || ev.id) ? (ev.__sourceEventId || ev.id) : '';
    }

    function editPreviewEvent(ev) {
      if (!ev || typeof window.editEvent !== 'function') return false;
      var eventId = eventSourceId(ev);
      if (!eventId) return false;
      window.closeDayEventsPopup();
      window.editEvent(eventId);
      return true;
    }

    function deletePreviewEvent(ev) {
      var eventId = eventSourceId(ev);
      var editIdInput = document.getElementById('edit-event-id');
      if (!eventId || !editIdInput || typeof window.deleteCurrentEvent !== 'function') {
        if (typeof window.showToast === 'function') window.showToast('Kunde inte ta bort händelsen');
        return false;
      }

      window.closeDayEventsPopup();
      editIdInput.value = eventId;
      window.deleteCurrentEvent();
      editIdInput.value = '';
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

        var ev = activeEvents[index];
        var deleteButton = item.querySelector('.home-preview-delete-v2');
        if (!deleteButton) {
          deleteButton = document.createElement('button');
          deleteButton.type = 'button';
          deleteButton.className = 'home-preview-delete-v2';
          deleteButton.textContent = '×';
          item.appendChild(deleteButton);
        }
        deleteButton.setAttribute('data-home-preview-delete-index', String(index));
        deleteButton.setAttribute('aria-label', 'Ta bort ' + (ev && ev.title ? ev.title : 'händelse'));
        deleteButton.setAttribute('title', 'Ta bort händelse');
        deleteButton.onclick = function (event) {
          event.preventDefault();
          event.stopPropagation();
          var idx = Number(this.getAttribute('data-home-preview-delete-index'));
          var targetEvent = Number.isFinite(idx) ? activeEvents[idx] : null;
          if (targetEvent) openDeleteConfirm(targetEvent);
        };
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

    addPreviewDeleteStyles();
    ensureDeleteConfirmDialog();

    // Capture outside clicks so the preview closes even when another control
    // inside the calendar stops propagation. Keep the active day itself open
    // long enough for a second click to be interpreted as an edit action.
    document.addEventListener('click', function (event) {
      var confirmOverlay = document.getElementById('home-delete-confirm-v2');
      if (confirmOverlay && confirmOverlay.classList.contains('show')) return;

      var pop = document.getElementById('home-day-popover');
      if (!pop || pop.getAttribute('aria-hidden') === 'true' || pop.contains(event.target)) return;

      var cell = event.target.closest ? event.target.closest('.cal-cell') : null;
      if (cell && cell.dataset && cell.dataset.date === activeDayISO) return;

      window.closeDayEventsPopup();
    }, true);

    document.addEventListener('click', function (event) {
      var pop = document.getElementById('home-day-popover');
      if (!pop || pop.getAttribute('aria-hidden') === 'true') return;
      if (event.target.closest && event.target.closest('.home-preview-delete-v2')) return;

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
      var confirmOverlay = document.getElementById('home-delete-confirm-v2');
      if (event.key === 'Escape' && confirmOverlay && confirmOverlay.classList.contains('show')) {
        event.preventDefault();
        closeDeleteConfirm();
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest && event.target.closest('.home-preview-delete-v2')) return;

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
    script.src = 'home-calendar-polish-v5-base-20260911.js?v=20260911-day-preview-delete-v2';
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
