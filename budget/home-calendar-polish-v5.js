(function () {
  'use strict';

  if (window.__homeCalendarPolishV5Bootstrap20260911) return;
  window.__homeCalendarPolishV5Bootstrap20260911 = true;

  function installRepeatUntilPlacementV1() {
    if (window.__homeRepeatUntilPlacementV1Installed) return;

    var repeat = document.getElementById('ev-repeat');
    var repeatUntil = document.getElementById('ev-repeat-until');
    if (!repeat || !repeatUntil) {
      setTimeout(installRepeatUntilPlacementV1, 50);
      return;
    }

    var repeatGroup = repeat.closest ? repeat.closest('.form-group') : null;
    var repeatUntilRow = repeatUntil.closest ? (repeatUntil.closest('.calendar-repeat-row-v2') || repeatUntil.closest('.form-row') || repeatUntil.closest('.form-group')) : null;
    if (!repeatGroup || !repeatUntilRow) return;

    window.__homeRepeatUntilPlacementV1Installed = true;

    if (repeatGroup.nextElementSibling !== repeatUntilRow) {
      repeatGroup.insertAdjacentElement('afterend', repeatUntilRow);
    }

    repeatUntilRow.classList.add('home-repeat-until-v1');

    if (!document.getElementById('home-repeat-until-v1-style')) {
      var style = document.createElement('style');
      style.id = 'home-repeat-until-v1-style';
      style.textContent =
        '.home-repeat-until-v1{grid-template-columns:minmax(0,1fr)!important;}' +
        '.home-repeat-until-v1[hidden]{display:none!important;}' +
        '.home-repeat-until-v1:not([hidden]){animation:homeRepeatUntilInV1 .18s cubic-bezier(.16,1,.3,1) both;}' +
        '@keyframes homeRepeatUntilInV1{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}' +
        '@media(prefers-reduced-motion:reduce){.home-repeat-until-v1:not([hidden]){animation:none!important;}}';
      document.head.appendChild(style);
    }

    function syncRepeatUntilVisibility(clearWhenDisabled) {
      var enabled = !!repeat.value && repeat.value !== 'none';
      repeatUntilRow.hidden = !enabled;
      repeatUntilRow.setAttribute('aria-hidden', enabled ? 'false' : 'true');

      if (!enabled) {
        if (repeatUntil._flatpickr && typeof repeatUntil._flatpickr.close === 'function') {
          repeatUntil._flatpickr.close();
        }
        if (clearWhenDisabled) repeatUntil.value = '';
      }
    }

    repeat.addEventListener('change', function () {
      syncRepeatUntilVisibility(true);
    });

    var modal = document.getElementById('event-modal');
    if (modal && typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function () {
        if (modal.classList.contains('show')) {
          requestAnimationFrame(function () {
            syncRepeatUntilVisibility(false);
          });
        }
      });
      observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }

    syncRepeatUntilVisibility(false);
  }

  function loadPreviousPolish() {
    var existing = document.querySelector('script[data-home-calendar-polish-preview-delete-20260911="true"]');
    if (existing) {
      installRepeatUntilPlacementV1();
      return;
    }

    var script = document.createElement('script');
    script.src = 'home-calendar-polish-v5-preview-delete-20260911.js?v=20260911-repeat-until-v1';
    script.async = false;
    script.setAttribute('data-home-calendar-polish-preview-delete-20260911', 'true');
    script.addEventListener('load', installRepeatUntilPlacementV1, { once: true });
    script.addEventListener('error', installRepeatUntilPlacementV1, { once: true });
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installRepeatUntilPlacementV1, { once: true });
  } else {
    installRepeatUntilPlacementV1();
  }

  loadPreviousPolish();
})();