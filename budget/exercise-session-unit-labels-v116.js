(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseSessionUnitLabelsV116Installed) return;
  window.__exerciseSessionUnitLabelsV116Installed = true;

  var observer = null;
  var retries = 0;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function sync() {
    var state = getState();
    var row = document.getElementById('session-stable-details');
    if (!state || !row || !Array.isArray(state.exercises)) return;
    var ex = state.exercises[Number(state.exerciseIndex) || 0];
    if (!ex) return;

    var label = row.querySelector('[data-detail-label="2"]');
    if (!label) return;
    var wanted = isTimedExercise(ex) ? 'Tid (min)' : 'Vikt (kg)';
    if (label.textContent !== wanted) label.textContent = wanted;
  }

  function bindRow() {
    var row = document.getElementById('session-stable-details');
    if (!row) {
      retries++;
      if (retries < 60) setTimeout(bindRow,100);
      return;
    }
    sync();
    if (observer) observer.disconnect();
    observer = new MutationObserver(sync);
    observer.observe(row,{childList:true,subtree:true,characterData:true});
  }

  document.addEventListener('click',function (event) {
    if (event.target && event.target.closest && event.target.closest('#session-controls')) setTimeout(sync,0);
  },false);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',bindRow,{once:true});
  else bindRow();
})();
