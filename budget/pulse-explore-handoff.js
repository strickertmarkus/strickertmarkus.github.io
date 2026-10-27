/* Hand-off from the exercise explorer's programmes into training mode.
   The explorer stores the chosen programme (catalogue ids only) in
   sessionStorage and opens exercise.html?explore=1. Here the ordinary pass
   builder opens for today with those exercises filled in, so sets, reps and
   weights can be adjusted first; the builder's own "Starta pass" then starts
   training mode, and an optional switch also saves the pass as a mallpass.
   Nothing changes without ?explore=1 and a stored programme. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  if (params.get('explore') !== '1') return;
  var profile = params.get('user') === 'maja' ? 'maja' : 'markus';
  var KEY = 'pulse-explore-transfer-v1-' + profile;
  var raw = null;
  try { raw = sessionStorage.getItem(KEY); } catch (e) {}
  if (!raw || raw.length > 4000) return;

  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function clearTransfer() {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    var url = new URL(location.href); url.searchParams.delete('explore');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }
  function loadCatalogue() {
    if (window.PulseExplore) return Promise.resolve(window.PulseExplore);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'pulse-explore.js?v=20261023-full-library-v2';
      s.onload = function () { window.PulseExplore ? resolve(window.PulseExplore) : reject(); };
      s.onerror = reject; document.head.appendChild(s);
    });
  }
  // The builder's own exercise format: strength rows carry sets × reps, timed
  // moves are cardio rows in minutes. Weights are left for the person to fill in.
  function rowsFor(plan) {
    return plan.exercises.map(function (ex) {
      var first = ex.sets[0] || {};
      if (ex.mode === 'min') return { kind: 'cardio', name: ex.name, time: Number(first.minutes) || 0, distance: 0 };
      return { kind: 'strength', name: ex.name, sets: ex.sets.length || 1, reps: Number(first.reps) || 0, weight: 0 };
    });
  }
  // Wait for the embedded builder to show today's day builder.
  function whenBuilderOpen(date, timeout) {
    var started = Date.now();
    return new Promise(function (resolve, reject) {
      (function poll() {
        var frame = document.querySelector('#field-workspace iframe'), win = null;
        try { win = frame && frame.contentWindow; } catch (e) {}
        var modal = win && win.document && win.document.getElementById('day-workout-modal');
        if (modal && modal.classList.contains('show') && modal.dataset.date === date && typeof win.addDayWorkoutExRow === 'function') { resolve(win); return; }
        if (Date.now() - started > timeout) { reject(new Error('timeout')); return; }
        setTimeout(poll, 120);
      })();
    });
  }

  function fill(win, plan) {
    var doc = win.document, modal = doc.getElementById('day-workout-modal');
    var type = doc.getElementById('day-workout-type'), name = doc.getElementById('day-workout-name'), list = doc.getElementById('day-workout-ex-list');
    var planned = typeof win.getPlannedSessions === 'function' ? win.getPlannedSessions()[modal.dataset.date] : null;
    var hadPlan = !!(planned && planned.exercises && planned.exercises.length);
    if (type) type.value = plan.type || type.value;
    if (name) name.value = plan.name;
    var select = doc.getElementById('day-workout-template-select'); if (select) select.value = '';
    list.innerHTML = '';
    rowsFor(plan).forEach(function (row) { win.addDayWorkoutExRow(row); });

    var old = doc.getElementById('explore-handoff'); if (old) old.remove();
    var note = doc.createElement('div');
    note.id = 'explore-handoff';
    note.setAttribute('role', 'status');
    note.style.cssText = 'margin:0 0 14px;padding:14px 16px;border-radius:16px;background:linear-gradient(120deg,#ff5a4824,#ff5a4808);box-shadow:inset 0 0 0 1px #ff6a5a44;color:inherit;font-size:13px;line-height:1.45';
    note.innerHTML = '<strong style="display:block;font-size:15px;margin-bottom:3px">' + plan.name.replace(/</g, '&lt;') + '</strong>' +
      '<span style="opacity:.8">' + plan.exercises.length + ' övningar från övningsutforskaren. Justera set, reps och vikter och tryck sedan Starta pass.' + (hadPlan ? ' Dagens tidigare upplägg ersätts först när du sparar eller startar.' : '') + '</span>' +
      '<label style="display:flex;align-items:center;gap:10px;margin-top:12px;font-weight:600;cursor:pointer"><input type="checkbox" id="explore-handoff-template" style="width:20px;height:20px;accent-color:#ff5a48"> Spara också som mallpass</label>';
    list.parentNode.insertBefore(note, list);

    // Saving as a mallpass rides on the builder's own template flow, just
    // before the pass is saved or started.
    function maybeSaveTemplate() {
      var box = doc.getElementById('explore-handoff-template');
      if (!box || !box.checked || box.dataset.saved) return;
      var field = doc.getElementById('day-workout-new-template-name');
      if (!field || typeof win.pulseClassicConfirmSaveAsTemplate !== 'function') return;
      field.value = (name && name.value || plan.name).trim().slice(0, 70);
      win.pulseClassicConfirmSaveAsTemplate();
      box.dataset.saved = '1';
    }
    modal.addEventListener('click', function (event) {
      if (event.target.closest('.classic-start-pass,[onclick*="saveDayWorkoutPlan"],[onclick*="startDayWorkoutFromBuilder"]')) maybeSaveTemplate();
    }, true);
    var observer = new MutationObserver(function () { if (!modal.classList.contains('show')) { observer.disconnect(); note.remove(); } });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    var first = list.querySelector('input,select'); if (first) first.blur();
  }

  function start() {
    loadCatalogue().then(function (explore) {
      var plan = explore.workout(JSON.parse(raw));
      if (!plan) { clearTransfer(); return; }
      var date = todayISO();
      window.dispatchEvent(new CustomEvent('pulse-field:open-tool', { detail: { tool: 'build', date: date } }));
      return whenBuilderOpen(date, 20000).then(function (win) { fill(win, plan); clearTransfer(); });
    }).catch(function () { clearTransfer(); });
  }
  // The pass tools install themselves at DOMContentLoaded; ask for the builder after that.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); }, { once: true });
  else setTimeout(start, 0);
})();
