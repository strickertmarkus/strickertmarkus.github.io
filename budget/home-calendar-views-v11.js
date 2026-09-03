(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  if (!isHome || window.__homeCalendarViewsV11Installed) return;
  window.__homeCalendarViewsV11Installed = true;

  var VIEW_KEY = 'home-calendar-view-v11';
  var currentView = 'month';
  try {
    var stored = localStorage.getItem(VIEW_KEY);
    if (stored === 'day' || stored === 'week' || stored === 'month') currentView = stored;
  } catch (_) {}

  function esc(value) {
    if (typeof window.escHtml === 'function') return window.escHtml(value == null ? '' : value);
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function iso(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function dateFromIso(value) {
    var p = String(value || '').split('-').map(Number);
    if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return null;
    return new Date(p[0], p[1] - 1, p[2]);
  }

  function anchorDate() {
    var selected = dateFromIso(window.selectedDate);
    if (selected) return selected;

    var base = window.currentDate instanceof Date ? new Date(window.currentDate.getTime()) : new Date();
    var today = new Date();
    if (base.getFullYear() === today.getFullYear() && base.getMonth() === today.getMonth()) return today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }

  function mondayFor(date) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d;
  }

  function isoWeek(date) {
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  function eventsForDate(date) {
    if (typeof window.getEvents !== 'function') return [];
    var all = window.getEvents() || [];
    if (typeof window.expandRepeating === 'function') {
      try { all = window.expandRepeating(all, date.getFullYear(), date.getMonth()) || all; } catch (_) {}
    }
    var dayIso = iso(date);
    return all.filter(function (event) {
      if (!event || event.date !== dayIso) return false;
      return typeof window.isEventVisible === 'function' ? window.isEventVisible(event) : true;
    }).sort(function (a, b) {
      return String(a.time || '').localeCompare(String(b.time || '')) || String(a.title || '').localeCompare(String(b.title || ''));
    });
  }

  function memberColor(event) {
    if (typeof window.getMemberColor === 'function') return window.getMemberColor(event && event.member);
    var colors = { markus:'#38BDF8', maja:'#F9A8B8', mila:'#F472B6', melker:'#86EFAC', family:'#FBBF24' };
    return colors[event && event.member] || '#FBBF24';
  }

  function memberLabel(event) {
    var labels = window.MEMBER_LABELS || { markus:'Markus', maja:'Maja', mila:'Mila', melker:'Melker', family:'Familjen' };
    return labels[event && event.member] || 'Familjen';
  }

  function originalEventId(event) {
    return String(event && event.id || '').replace(/_(?:w|m)\d+$/, '');
  }

  function eventMarkup(event, compact) {
    var color = memberColor(event);
    var time = event.time || '';
    var end = event.endTime || '';
    var range = time && end ? time + '–' + end : (time || end || 'Hela dagen');
    return '<button type="button" class="home-cal-event-v11' + (compact ? ' compact' : '') + '" data-event-id="' + esc(originalEventId(event)) + '" style="--event-color:' + color + '">' +
      '<span class="home-cal-event-bar-v11"></span>' +
      '<span class="home-cal-event-copy-v11">' +
        '<strong>' + esc((event.emoji ? event.emoji + ' ' : '') + (event.title || 'Händelse')) + '</strong>' +
        '<small>' + esc(range + ' · ' + memberLabel(event)) + '</small>' +
      '</span>' +
    '</button>';
  }

  function setSelectedDay(dayIso) {
    window.selectedDate = dayIso;
    var input = document.getElementById('ev-date');
    if (input) input.value = dayIso;
  }

  function renderDay(stageAlt) {
    var date = anchorDate();
    var dayIso = iso(date);
    var events = eventsForDate(date);
    var title = date.toLocaleDateString('sv-SE', { weekday:'long', day:'numeric', month:'long' });
    title = title.charAt(0).toUpperCase() + title.slice(1);
    stageAlt.innerHTML =
      '<section class="home-cal-day-v11" data-date="' + dayIso + '">' +
        '<div class="home-cal-alt-head-v11"><div><span>Dagvy</span><strong>' + esc(title) + '</strong></div>' +
        '<button type="button" class="home-cal-add-v11" data-add-date="' + dayIso + '">+ Händelse</button></div>' +
        '<div class="home-cal-day-events-v11">' +
          (events.length ? events.map(function (ev) { return eventMarkup(ev, false); }).join('') : '<div class="home-cal-empty-v11">Inga händelser denna dag.</div>') +
        '</div>' +
      '</section>';
    setSelectedDay(dayIso);
  }

  function renderWeek(stageAlt) {
    var anchor = anchorDate();
    var monday = mondayFor(anchor);
    var rows = [];
    for (var i = 0; i < 7; i++) {
      var date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      var dayIso = iso(date);
      var events = eventsForDate(date);
      var isToday = dayIso === iso(new Date());
      var weekday = date.toLocaleDateString('sv-SE', { weekday:'short' }).replace('.', '');
      var label = date.toLocaleDateString('sv-SE', { day:'numeric', month:'short' }).replace('.', '');
      rows.push(
        '<section class="home-cal-week-day-v11' + (isToday ? ' today' : '') + '" data-date="' + dayIso + '">' +
          '<button type="button" class="home-cal-week-date-v11" data-pick-date="' + dayIso + '"><span>' + esc(weekday) + '</span><strong>' + esc(label) + '</strong></button>' +
          '<div class="home-cal-week-events-v11">' +
            (events.length ? events.map(function (ev) { return eventMarkup(ev, true); }).join('') : '<span class="home-cal-week-empty-v11">Inget planerat</span>') +
          '</div>' +
        '</section>'
      );
    }
    stageAlt.innerHTML =
      '<section class="home-cal-week-v11">' +
        '<div class="home-cal-alt-head-v11"><div><span>Veckovy</span><strong>Vecka ' + isoWeek(anchor) + '</strong></div></div>' +
        '<div class="home-cal-week-list-v11">' + rows.join('') + '</div>' +
      '</section>';
  }

  function syncToolbarLabel() {
    var label = document.getElementById('calendar-week-number') || document.getElementById('calendar-week-number-v2');
    if (!label) return;
    var anchor = anchorDate();
    if (currentView === 'day') {
      label.textContent = anchor.toLocaleDateString('sv-SE', { weekday:'long', day:'numeric', month:'short' }).replace('.', '');
    } else {
      label.textContent = 'Vecka ' + isoWeek(anchor);
    }
  }

  function renderActiveView() {
    var weekdays = document.querySelector('.cal-section .cal-weekdays');
    var grid = document.getElementById('cal-grid');
    var alt = document.getElementById('home-calendar-alt-view-v11');
    if (!weekdays || !grid || !alt) return;

    document.body.dataset.homeCalendarView = currentView;
    var group = document.getElementById('home-calendar-view-v11');
    if (group) {
      group.querySelectorAll('button[data-calendar-view]').forEach(function (btn) {
        var active = btn.dataset.calendarView === currentView;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    if (currentView === 'month') {
      weekdays.style.display = '';
      grid.style.display = '';
      alt.hidden = true;
      alt.innerHTML = '';
    } else {
      weekdays.style.display = 'none';
      grid.style.display = 'none';
      alt.hidden = false;
      if (currentView === 'day') renderDay(alt);
      else renderWeek(alt);
    }
    syncToolbarLabel();
  }

  function switchView(next) {
    if (next !== 'day' && next !== 'week' && next !== 'month') return;
    if (next === currentView) return;

    function commit() {
      currentView = next;
      try { localStorage.setItem(VIEW_KEY, currentView); } catch (_) {}
      renderActiveView();
    }

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && typeof document.startViewTransition === 'function') {
      document.startViewTransition(commit);
    } else {
      var stage = document.getElementById('home-calendar-view-stage-v11');
      if (stage) stage.classList.add('fallback-morph-v11');
      commit();
      if (stage) setTimeout(function () { stage.classList.remove('fallback-morph-v11'); }, 330);
    }
  }

  function ensureHeaderSelector() {
    var header = document.querySelector('.app-header');
    if (!header) return false;
    var group = document.getElementById('home-calendar-view-v11');
    if (!group) {
      group = document.createElement('div');
      group.id = 'home-calendar-view-v11';
      group.className = 'home-calendar-view-v11';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', 'Kalendervy');
      group.innerHTML =
        '<button type="button" data-calendar-view="day" aria-label="Dagvy" title="Dagvy"><svg viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 2v4M16 2v4M4 8h16"/><circle cx="12" cy="14" r="2.2"/></svg></button>' +
        '<button type="button" data-calendar-view="week" aria-label="Veckovy" title="Veckovy"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 4v16M16 4v16M3 9h18"/></svg></button>' +
        '<button type="button" data-calendar-view="month" aria-label="Månadsvy" title="Månadsvy"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 3v18M16 3v18M3 9h18M3 15h18"/></svg></button>';
      header.appendChild(group);
      group.addEventListener('click', function (event) {
        var button = event.target.closest('button[data-calendar-view]');
        if (!button) return;
        switchView(button.dataset.calendarView);
      });
    }
    return true;
  }

  function ensureStage() {
    var section = document.querySelector('.cal-section');
    var weekdays = section && section.querySelector('.cal-weekdays');
    var grid = document.getElementById('cal-grid');
    if (!section || !weekdays || !grid) return false;

    var stage = document.getElementById('home-calendar-view-stage-v11');
    if (!stage) {
      stage = document.createElement('div');
      stage.id = 'home-calendar-view-stage-v11';
      stage.className = 'home-calendar-view-stage-v11';
      weekdays.parentNode.insertBefore(stage, weekdays);
      stage.appendChild(weekdays);
      stage.appendChild(grid);
      var alt = document.createElement('div');
      alt.id = 'home-calendar-alt-view-v11';
      alt.className = 'home-calendar-alt-view-v11';
      alt.hidden = true;
      stage.appendChild(alt);
    }
    return true;
  }

  function bindStageActions() {
    var stage = document.getElementById('home-calendar-view-stage-v11');
    if (!stage || stage.dataset.actionsBoundV11 === '1') return;
    stage.dataset.actionsBoundV11 = '1';
    stage.addEventListener('click', function (event) {
      var eventButton = event.target.closest('[data-event-id]');
      if (eventButton) {
        event.stopPropagation();
        if (typeof window.editEvent === 'function') window.editEvent(eventButton.dataset.eventId);
        return;
      }
      var add = event.target.closest('[data-add-date]');
      if (add) {
        event.stopPropagation();
        setSelectedDay(add.dataset.addDate);
        if (typeof window.openEventModal === 'function') window.openEventModal(add.dataset.addDate);
        return;
      }
      var pick = event.target.closest('[data-pick-date]');
      if (pick) {
        event.stopPropagation();
        setSelectedDay(pick.dataset.pickDate);
        switchView('day');
      }
    });
  }

  function addStyles() {
    if (document.getElementById('home-calendar-views-v11-style')) return;
    var style = document.createElement('style');
    style.id = 'home-calendar-views-v11-style';
    style.textContent = `
      .home-calendar-view-v11 {
        position:absolute !important;
        right:9px !important;
        bottom:9px !important;
        display:flex !important;
        align-items:center !important;
        gap:2px !important;
        padding:3px !important;
        border:1px solid rgba(255,255,255,.22) !important;
        border-radius:18px !important;
        background:rgba(255,255,255,.075) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 4px 16px rgba(0,0,0,.12) !important;
        backdrop-filter:blur(9px);
        -webkit-backdrop-filter:blur(9px);
        z-index:6 !important;
      }
      .home-calendar-view-v11 button {
        appearance:none;
        width:39px !important;
        height:29px !important;
        padding:0 !important;
        border:0 !important;
        border-radius:14px !important;
        background:transparent !important;
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
        opacity:.72;
        -webkit-tap-highlight-color:transparent;
        transition:background .18s ease,box-shadow .22s ease,opacity .18s ease,transform .16s cubic-bezier(.22,1,.36,1),color .18s ease !important;
      }
      .home-calendar-view-v11 button:active { transform:scale(.94); }
      .home-calendar-view-v11 svg { width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round; }
      .home-calendar-view-v11 button[data-calendar-view="day"] { color:#60A5FA; }
      .home-calendar-view-v11 button[data-calendar-view="week"] { color:#4ADE80; }
      .home-calendar-view-v11 button[data-calendar-view="month"] { color:#FDBA74; }
      .home-calendar-view-v11 button[data-calendar-view="day"].active { opacity:1;background:rgba(96,165,250,.16) !important;box-shadow:inset 0 0 0 1px rgba(96,165,250,.52),0 0 12px rgba(96,165,250,.28),0 0 22px rgba(59,130,246,.10) !important; }
      .home-calendar-view-v11 button[data-calendar-view="week"].active { opacity:1;background:rgba(74,222,128,.14) !important;box-shadow:inset 0 0 0 1px rgba(74,222,128,.48),0 0 12px rgba(74,222,128,.25),0 0 22px rgba(34,197,94,.09) !important; }
      .home-calendar-view-v11 button[data-calendar-view="month"].active { opacity:1;background:rgba(253,186,116,.15) !important;box-shadow:inset 0 0 0 1px rgba(253,186,116,.50),0 0 12px rgba(253,186,116,.27),0 0 22px rgba(249,115,22,.09) !important; }

      #home-calendar-view-stage-v11 { view-transition-name:home-calendar-surface-v11; min-height:1px; transform-origin:50% 0; }
      ::view-transition-group(home-calendar-surface-v11) { animation-duration:.42s; animation-timing-function:cubic-bezier(.22,1,.36,1); }
      ::view-transition-old(home-calendar-surface-v11) { animation:home-calendar-out-v11 .30s cubic-bezier(.4,0,.2,1) both; mix-blend-mode:normal; }
      ::view-transition-new(home-calendar-surface-v11) { animation:home-calendar-in-v11 .42s cubic-bezier(.22,1,.36,1) both; mix-blend-mode:normal; }
      @keyframes home-calendar-out-v11 { to { opacity:0; transform:scale(.975) translateY(-5px); filter:blur(2px); } }
      @keyframes home-calendar-in-v11 { from { opacity:0; transform:scale(.965) translateY(7px); filter:blur(2px); } to { opacity:1; transform:none; filter:none; } }
      #home-calendar-view-stage-v11.fallback-morph-v11 { animation:home-calendar-fallback-v11 .32s cubic-bezier(.22,1,.36,1); }
      @keyframes home-calendar-fallback-v11 { 0%{opacity:.25;transform:scale(.975)} 100%{opacity:1;transform:none} }

      .home-calendar-alt-view-v11 { min-height:270px; }
      .home-cal-alt-head-v11 { display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:2px 0 12px;padding:0 2px; }
      .home-cal-alt-head-v11 > div { display:grid;gap:1px;text-align:left; }
      .home-cal-alt-head-v11 span { color:#94A3B8;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.8px; }
      .home-cal-alt-head-v11 strong { color:#F0F6FC;font-size:16px;line-height:1.25; }
      .home-cal-add-v11 { border:1px solid rgba(253,186,116,.30);background:rgba(253,186,116,.08);color:#FDBA74;border-radius:9px;padding:7px 10px;font:700 11px/1 Inter,sans-serif;cursor:pointer; }
      .home-cal-add-v11:active { transform:scale(.97); }

      .home-cal-day-v11 { min-height:270px; }
      .home-cal-day-events-v11 { display:grid;gap:8px; }
      .home-cal-event-v11 { width:100%;display:grid;grid-template-columns:4px minmax(0,1fr);gap:10px;text-align:left;padding:10px 11px;border:1px solid rgba(255,255,255,.085);border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.022));color:#F0F6FC;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.018); }
      .home-cal-event-v11.compact { padding:7px 9px;border-radius:9px; }
      .home-cal-event-v11:active { transform:scale(.99); }
      .home-cal-event-bar-v11 { width:4px;min-height:32px;border-radius:999px;background:var(--event-color);box-shadow:0 0 9px color-mix(in srgb,var(--event-color) 26%,transparent); }
      .home-cal-event-copy-v11 { min-width:0;display:grid;gap:2px;align-content:center; }
      .home-cal-event-copy-v11 strong { overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:1.25; }
      .home-cal-event-copy-v11 small { overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8B949E;font-size:10px;line-height:1.2; }
      .home-cal-empty-v11 { min-height:190px;display:grid;place-items:center;border:1px dashed rgba(255,255,255,.09);border-radius:14px;color:#64748B;font-size:12px; }

      .home-cal-week-list-v11 { display:grid;gap:6px; }
      .home-cal-week-day-v11 { display:grid;grid-template-columns:58px minmax(0,1fr);gap:8px;padding:7px;border:1px solid rgba(255,255,255,.075);border-radius:12px;background:rgba(255,255,255,.022); }
      .home-cal-week-day-v11.today { border-color:rgba(253,186,116,.34);background:linear-gradient(90deg,rgba(253,186,116,.055),rgba(255,255,255,.02)); }
      .home-cal-week-date-v11 { border:0;background:transparent;color:#94A3B8;display:grid;align-content:center;justify-items:start;padding:2px 4px;cursor:pointer;text-align:left; }
      .home-cal-week-date-v11 span { font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.55px; }
      .home-cal-week-date-v11 strong { color:#F0F6FC;font-size:13px;white-space:nowrap; }
      .home-cal-week-day-v11.today .home-cal-week-date-v11 strong { color:#FDBA74; }
      .home-cal-week-events-v11 { min-width:0;display:grid;gap:5px; }
      .home-cal-week-empty-v11 { align-self:center;color:#4A5568;font-size:10px;padding:6px 8px; }

      @media(max-width:768px) {
        .home-calendar-alt-view-v11 { min-height:250px; }
        .home-cal-alt-head-v11 strong { font-size:15px; }
        .home-cal-week-day-v11 { grid-template-columns:54px minmax(0,1fr); }
        .home-cal-event-v11 { padding:9px 10px; }
      }
      @media(prefers-reduced-motion:reduce) {
        ::view-transition-group(home-calendar-surface-v11),::view-transition-old(home-calendar-surface-v11),::view-transition-new(home-calendar-surface-v11),#home-calendar-view-stage-v11.fallback-morph-v11 { animation-duration:.001s !important; }
        .home-calendar-view-v11 button { transition-duration:.001s !important; }
      }
    `;
    document.head.appendChild(style);
  }

  var renderTimer = 0;
  function scheduleRender() {
    if (currentView === 'month') return;
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderActiveView, 20);
  }

  function install() {
    if (!ensureHeaderSelector() || !ensureStage()) {
      setTimeout(install, 60);
      return;
    }
    addStyles();
    bindStageActions();
    renderActiveView();

    var grid = document.getElementById('cal-grid');
    if (grid && !grid.__homeCalendarViewsV11Observer) {
      var observer = new MutationObserver(scheduleRender);
      observer.observe(grid, { childList:true });
      grid.__homeCalendarViewsV11Observer = observer;
    }

    window.addEventListener('firebase-sync', scheduleRender);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();