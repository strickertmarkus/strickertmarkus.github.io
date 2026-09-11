(function () {
  'use strict';

  if (window.__homeCalendarPolishV5Bootstrap20260911V2) return;
  window.__homeCalendarPolishV5Bootstrap20260911V2 = true;

  function installRepeatUntilPlacementV2() {
    if (window.__homeRepeatUntilPlacementV2Installed) return;

    var repeat = document.getElementById('ev-repeat');
    var repeatUntil = document.getElementById('ev-repeat-until');
    var modal = document.getElementById('event-modal');
    if (!repeat || !repeatUntil || !modal) {
      setTimeout(installRepeatUntilPlacementV2, 50);
      return;
    }

    var repeatGroup = repeat.closest ? repeat.closest('.form-group') : null;
    var repeatUntilRow = repeatUntil.closest ? (repeatUntil.closest('.calendar-repeat-row-v2') || repeatUntil.closest('.form-row') || repeatUntil.closest('.form-group')) : null;
    if (!repeatGroup || !repeatUntilRow) {
      setTimeout(installRepeatUntilPlacementV2, 50);
      return;
    }

    window.__homeRepeatUntilPlacementV2Installed = true;
    repeatUntilRow.classList.add('home-repeat-until-v2');

    if (!document.getElementById('home-repeat-until-v2-style')) {
      var style = document.createElement('style');
      style.id = 'home-repeat-until-v2-style';
      style.textContent =
        '.home-repeat-until-v2{grid-template-columns:minmax(0,1fr)!important;margin-top:-2px!important;}' +
        '.home-repeat-until-v2[hidden]{display:none!important;}' +
        '.home-repeat-until-v2:not([hidden]){animation:homeRepeatUntilInV2 .18s cubic-bezier(.16,1,.3,1) both;}' +
        '@keyframes homeRepeatUntilInV2{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}' +
        '@media(prefers-reduced-motion:reduce){.home-repeat-until-v2:not([hidden]){animation:none!important;}}';
      document.head.appendChild(style);
    }

    var syncing = false;
    function syncRepeatUntil(clearWhenDisabled) {
      if (syncing) return;
      syncing = true;

      repeatGroup = repeat.closest ? repeat.closest('.form-group') : repeatGroup;
      repeatUntilRow = repeatUntil.closest ? (repeatUntil.closest('.calendar-repeat-row-v2') || repeatUntil.closest('.form-row') || repeatUntil.closest('.form-group')) : repeatUntilRow;

      if (repeatGroup && repeatUntilRow && repeatGroup.nextElementSibling !== repeatUntilRow) {
        repeatGroup.insertAdjacentElement('afterend', repeatUntilRow);
      }

      var enabled = !!repeat.value && repeat.value !== 'none';
      if (repeatUntilRow) {
        repeatUntilRow.hidden = !enabled;
        repeatUntilRow.setAttribute('aria-hidden', enabled ? 'false' : 'true');
      }

      if (!enabled) {
        if (repeatUntil._flatpickr && typeof repeatUntil._flatpickr.close === 'function') {
          repeatUntil._flatpickr.close();
        }
        if (clearWhenDisabled) repeatUntil.value = '';
      }

      syncing = false;
    }

    repeat.addEventListener('change', function () {
      syncRepeatUntil(true);
    });

    if (typeof MutationObserver !== 'undefined') {
      var scheduled = false;
      var observer = new MutationObserver(function () {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(function () {
          scheduled = false;
          if (modal.classList.contains('show')) syncRepeatUntil(false);
        });
      });
      observer.observe(modal, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    }

    function wrapModalFunction(name) {
      var original = window[name];
      if (typeof original !== 'function' || original.__repeatUntilPlacementV2Wrapped) return;
      var wrapped = function () {
        var result = original.apply(this, arguments);
        setTimeout(function () { syncRepeatUntil(false); }, 0);
        setTimeout(function () { syncRepeatUntil(false); }, 80);
        return result;
      };
      wrapped.__repeatUntilPlacementV2Wrapped = true;
      window[name] = wrapped;
    }

    wrapModalFunction('openEventModal');
    wrapModalFunction('editEvent');

    syncRepeatUntil(false);
    [40, 120, 350, 900].forEach(function (delay) {
      setTimeout(function () { syncRepeatUntil(false); }, delay);
    });
  }

  function loadPreviousPolish() {
    var existing = document.querySelector('script[data-home-calendar-polish-preview-delete-20260911="true"]');
    if (existing) {
      installRepeatUntilPlacementV2();
      return;
    }

    var script = document.createElement('script');
    script.src = 'home-calendar-polish-v5-preview-delete-20260911.js?v=20260911-repeat-until-v2';
    script.async = false;
    script.setAttribute('data-home-calendar-polish-preview-delete-20260911', 'true');
    script.addEventListener('load', installRepeatUntilPlacementV2, { once: true });
    script.addEventListener('error', installRepeatUntilPlacementV2, { once: true });
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installRepeatUntilPlacementV2, { once: true });
  } else {
    installRepeatUntilPlacementV2();
  }

  loadPreviousPolish();
})();