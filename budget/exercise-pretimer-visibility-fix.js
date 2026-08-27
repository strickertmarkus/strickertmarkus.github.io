(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (e) { return null; }
  }

  function timerEnabled(state) {
    if (!state || !state.date) return true;
    try {
      if (window.__exerciseFlowPolishV2 && typeof window.__exerciseFlowPolishV2.timerEnabledForDate === 'function') {
        return window.__exerciseFlowPolishV2.timerEnabledForDate(state.date) !== false;
      }
    } catch (e) {}
    return true;
  }

  function addStyles() {
    if (document.getElementById('exercise-pretimer-visibility-fix-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-pretimer-visibility-fix-style';
    style.textContent = `
      #session-modal.pretimer-disabled-v3 #session-pre-timer,
      #session-modal.pretimer-disabled-v3 #session-pre-timer.show {
        display:none !important;
        visibility:hidden !important;
        opacity:0 !important;
        pointer-events:none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function sync() {
    var modal = document.getElementById('session-modal');
    if (!modal) return;
    var state = getState();
    var disabled = !!state && !timerEnabled(state);
    modal.classList.toggle('pretimer-disabled-v3', disabled);

    if (disabled) {
      var pre = document.getElementById('session-pre-timer');
      if (pre && pre.classList.contains('show')) {
        try { pre.click(); } catch (e) {}
      }
    }
  }

  function install() {
    addStyles();
    sync();

    /* Capture runs before the inline Starta set onclick, so the overlay is
       already CSS-blocked before the legacy pretimer wrapper can show it. */
    document.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('#session-controls button') : null;
      if (button) sync();

      var toggle = event.target && event.target.closest ? event.target.closest('#session-pretimer-toggle-v2') : null;
      if (toggle) setTimeout(sync, 0);
    }, true);

    setInterval(sync, 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
