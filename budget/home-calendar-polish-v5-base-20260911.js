(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isHome = path.endsWith('/budget/home.html') || path.endsWith('/home.html');
  if (!isHome) return;



  function getDayEvents(dateISO) {
    try {
      var p = String(dateISO || '').split('-').map(Number);
      var year = p[0];
      var month = p[1] - 1;
      if (!year || month < 0) return [];
      var events = typeof window.getEvents === 'function' ? (window.getEvents() || []) : [];
      if (typeof window.expandRepeating === 'function') {
        events = window.expandRepeating(events, year, month) || [];
      }
      return events.filter(function (ev) {
        if (!ev || ev.date !== dateISO) return false;
        return typeof window.isEventVisible === 'function' ? window.isEventVisible(ev) : true;
      });
    } catch (e) {
      return [];
    }
  }

  function selectDayAsOverview(dateISO) {
    try { window.selectedDate = dateISO; } catch (e) {}

    var panel = document.getElementById('day-panel');
    if (panel) panel.classList.remove('show');

    var dateInput = document.getElementById('ev-date');
    if (dateInput) dateInput.value = dateISO;

    try { if (typeof window.renderMonth === 'function') window.renderMonth(); } catch (e) {}

    setTimeout(function () {
      var anchor = document.querySelector('.cal-cell[data-date="' + dateISO + '"]');
      if (!anchor || typeof window.openDayEventsPopup !== 'function') return;
      window.openDayEventsPopup(dateISO, getDayEvents(dateISO).slice(0, 5), anchor);
    }, 0);
  }

  function storedNotificationEnabled() {
    try {
      var settings = JSON.parse(localStorage.getItem('cal_push_settings_v1') || 'null');
      return !!(settings && settings.enabled);
    } catch (_) {
      return false;
    }
  }

  function syncNotificationSwitch() {
    var button = document.querySelector('.app-header .home-notif-switch-v7');
    if (!button) return;
    var checkbox = document.getElementById('notif-enabled');
    var enabled = checkbox ? !!checkbox.checked : storedNotificationEnabled();
    button.classList.toggle('is-on', enabled);
    button.setAttribute('aria-checked', enabled ? 'true' : 'false');
    button.setAttribute('title', enabled ? 'Notiser: På' : 'Notiser: Av');
  }

  function setupNotificationSwitch() {
    var header = document.querySelector('.app-header');
    if (!header) return;

    var button = header.querySelector('.btn-notif.home-notif-switch-v7') ||
      document.querySelector('.filter-bar .btn-notif') ||
      document.querySelector('.btn-notif');
    if (!button) {
      button = document.createElement('button');
      button.className = 'btn-notif';
    }

    document.querySelectorAll('.app-header .btn-notif, .filter-bar .btn-notif').forEach(function (extra) {
      if (extra !== button) extra.remove();
    });

    button.removeAttribute('onclick');
    button.classList.remove('home-notif-toggle-v6','is-open');
    button.classList.add('home-notif-switch-v7');
    button.type = 'button';
    button.setAttribute('role','switch');
    button.setAttribute('aria-label','Notiser');
    button.setAttribute('aria-expanded','false');
    if (!button.querySelector('.home-notif-bell-v8')) {
      button.innerHTML = '<span class="home-notif-knob-v7" aria-hidden="true"><svg class="home-notif-bell-v8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>';
    }
    if (button.parentElement !== header) header.appendChild(button);

    if (!button.__homeNotifSwitchV7Bound) {
      button.__homeNotifSwitchV7Bound = true;
      button.addEventListener('click',function (event) {
        event.preventDefault();
        event.stopPropagation();
        var checkbox = document.getElementById('notif-enabled');
        if (!checkbox) {
          setTimeout(setupNotificationSwitch,100);
          return;
        }
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change',{bubbles:true}));
        syncNotificationSwitch();
        setTimeout(syncNotificationSwitch,250);
        setTimeout(syncNotificationSwitch,1200);
      });
    }

    var panel = document.getElementById('notif-panel');
    if (panel) panel.classList.remove('show');
    var mobileBell = document.getElementById('push-mobile-bell');
    if (mobileBell) mobileBell.remove();
    syncNotificationSwitch();
  }

  function install() {
    if (window.__homeCalendarPolishV5Installed) return;
    if (!document.querySelector('.cal-section') || typeof window.selectDay !== 'function') {
      setTimeout(install, 60);
      return;
    }

    window.__homeCalendarPolishV5Installed = true;
    document.body.classList.add('home-calendar-polish-v5');
    window.selectDay = selectDayAsOverview;
    setupNotificationSwitch();

    var panel = document.getElementById('day-panel');
    if (panel) panel.classList.remove('show');

    setInterval(function () {
      setupNotificationSwitch();
      syncNotificationSwitch();
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once:true });
  } else {
    install();
  }
})();