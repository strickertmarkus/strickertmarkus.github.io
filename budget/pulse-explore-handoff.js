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
  if (!raw || raw.length > 10000) return;

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
      s.src = 'pulse-explore.js?v=20261111-countup-1';
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
    var hadPlan = !!(planned && ((planned.exercises||[]).length||planned.zenRoutine));
    // Imported programmes become an additional pass, rather than replacing
    // the day's previously planned session. The existing logs remain untouched.
    if(hadPlan&&win.PulseMultiPassV1&&typeof win.PulseMultiPassV1.add==='function'){
      win.PulseMultiPassV1.add();
    }
    var extraSlot=!!modal.dataset.extraId;
    var alreadyLogged=false;
    try{
      var workouts=typeof win.getWorkouts==='function'?win.getWorkouts():[];
      alreadyLogged=Array.isArray(workouts)&&workouts.some(function(w){return w.date===modal.dataset.date;});
    }catch(_){};
    // A focus name is more useful than the generic type "Styrka" in the
    // builder, and remains consistent with its established muscle-group field.
    if (type) type.value = String(plan.name||plan.type||'Styrka').split(' · ')[0];
    if (name) name.value = plan.name;
    var select = doc.getElementById('day-workout-template-select'); if (select) select.value = '';
    list.innerHTML = '';
    var importedRows=rowsFor(plan);
    importedRows.forEach(function (row) { win.addDayWorkoutExRow(row); });
    // A previously planned stretch/meditation on this date can leave the
    // embedded builder in Zen mode even after the visible fields are changed.
    // Reset that mode for a strength programme, without touching saved data.
    if(win.PulseZen&&typeof win.PulseZen.loadBuilder==='function'){
      win.PulseZen.loadBuilder({type:'Styrka',name:plan.name,exercises:importedRows});
    }
    if(list.querySelectorAll('.ex-row-item').length!==importedRows.length){
      throw new Error('Passbyggaren tog inte emot alla övningar.');
    }

    var old = doc.getElementById('explore-handoff'); if (old) old.remove();
    var note = doc.createElement('div');
    note.id = 'explore-handoff';
    note.setAttribute('role', 'status');
    note.style.cssText = 'margin:0 0 14px;padding:14px 16px;border-radius:16px;background:linear-gradient(120deg,#ff5a4824,#ff5a4808);box-shadow:inset 0 0 0 1px #ff6a5a44;color:inherit;font-size:13px;line-height:1.45';
    // Programme transitions are displayed in the builder but deliberately NOT
    // added as cardio rows: otherwise strength volume and cardio stats change.
    // The training builder currently has no first-class inter-exercise timer.
    var sequence=Array.isArray(plan.sequence)?plan.sequence:[];
    var transitionRows=sequence.filter(function(segment){return segment.kind==='rope'||segment.kind==='rest';});
    var transitionsHtml=transitionRows.length
      ? '<details style="margin-top:10px"><summary style="cursor:pointer;color:#ffc5b8;font-weight:600">Hopprep och vila mellan övningarna ('+transitionRows.length+')</summary><ol style="margin:8px 0 0 18px;padding:0;display:grid;gap:5px">'
         +transitionRows.map(function(segment){
           return '<li>'+(segment.kind==='rope'
             ?'Hopprep '+segment.seconds+' sek + '+segment.restSeconds+' sek lugn återhämtning'
             :'Vila '+segment.seconds+' sek')+'</li>';
         }).join('')+'</ol><small style="display:block;margin-top:8px;opacity:.68">Följ tiderna mellan övningarna. De startar inte automatiskt i passbyggaren.</small></details>'
      : '';
    note.innerHTML = '<strong style="display:block;font-size:15px;margin-bottom:3px">' + plan.name.replace(/</g, '&lt;') + '</strong>' +
      '<span style="opacity:.8">' + plan.exercises.length + ' övningar från övningsutforskaren. Justera set, reps och vikter och tryck sedan Starta pass.' + (extraSlot ? ' Importeras som ett extra pass; ditt befintliga dagsupplägg behålls.' : '') +
      (alreadyLogged?' Tidigare loggade pass för dagen påverkas inte.':'') + '</span>' +
      transitionsHtml +
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

  function showImportError(error){
    // Never silently discard the selection if the frame failed to load.
    var node=document.getElementById('explore-import-error');
    if(!node){
      node=document.createElement('div');node.id='explore-import-error';
      node.setAttribute('role','alert');
      node.style.cssText='position:fixed;z-index:10005;left:16px;right:16px;bottom:calc(20px + env(safe-area-inset-bottom));max-width:500px;margin:auto;background:#241b22;color:#f8e8e4;padding:14px 16px;border-radius:14px;border:1px solid #f1766850;box-shadow:0 12px 50px #000a;font-size:13px;line-height:1.5';
      document.body.appendChild(node);
    }
    node.textContent='Programmet är sparat för import, men passbyggaren kunde inte fyllas i. ';
    var retry=document.createElement('button');retry.type='button';retry.textContent='Försök igen';
    retry.style.cssText='display:inline-block;margin-left:12px;border:1px solid #e9786870;border-radius:9px;padding:8px 12px;background:#f46c5124;color:#ffd1c6;font:inherit;font-weight:600;cursor:pointer';
    retry.addEventListener('click',start);node.appendChild(retry);
    if(error&&window.console)console.warn('[Pulse Explore] Programme handoff:',error);
  }
  var attempting=false;
  function start() {
    if(attempting)return;
    attempting=true;
    var banner=document.getElementById('explore-import-error');if(banner)banner.remove();
    loadCatalogue().then(function (explore) {
      var plan=explore.workout(JSON.parse(raw));
      if(!plan)throw new Error('Det valda programmet finns inte i katalogen.');
      var date=todayISO();
      window.dispatchEvent(new CustomEvent('pulse-field:open-tool',{detail:{tool:'build',date:date}}));
      return whenBuilderOpen(date,22000).then(function(win){
        fill(win,plan);
        clearTransfer();
      });
    }).catch(showImportError).finally(function(){attempting=false;});
  }
  // The pass tools install themselves at DOMContentLoaded; ask for the builder after that.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); }, { once: true });
  else setTimeout(start, 0);
})();
