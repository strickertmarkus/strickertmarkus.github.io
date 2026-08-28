(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function normalize(raw) {
    raw=raw||{};
    return {
      type:raw.type==='custom'?'custom':(raw.type==='rest'?'rest':'none'),
      seconds:Math.max(1,Math.round(Number(raw.seconds)||30)),
      name:String(raw.name||'').trim()
    };
  }

  function keyFor(summary) {
    return String(summary && summary.name || 'Valfri övning').trim().toLocaleLowerCase('sv-SE')+'|'+Math.max(1,Math.round(Number(summary && summary.seconds)||30));
  }

  function archiveMap(state) {
    if (!state.__betweenCustomArchiveV7) state.__betweenCustomArchiveV7=Object.create(null);
    return state.__betweenCustomArchiveV7;
  }

  function archiveSummary(state,summary) {
    if (!state || !summary || !Array.isArray(summary.logs) || !summary.logs.length) return;
    var map=archiveMap(state);
    var key=keyFor(summary);
    if (!map[key]) map[key]={name:summary.name||'Valfri övning',seconds:Math.max(1,Math.round(Number(summary.seconds)||30)),logs:[]};
    summary.logs.forEach(function (log) { map[key].logs.push(Object.assign({},log)); });
  }

  function routedConfig(state) {
    try {
      var planned=typeof window.getPlannedSessions==='function'?(window.getPlannedSessions()||{}):{};
      var plan=state && planned[state.date];
      return normalize(plan && plan.betweenSets);
    } catch (_) { return normalize(null); }
  }

  function isTransitionButton(button,state) {
    if (!button || !button.closest('#session-controls') || !state || state.setRunning || !state.awaitingDecision) return false;
    var text=String(button.textContent||'').trim().toLowerCase();
    if (text.indexOf('starta nästa set')===0 || text.indexOf('extra set')===0) return true;
    if (text.indexOf('övning klar')===0) return Array.isArray(state.exercises) && Number(state.exerciseIndex)+1<state.exercises.length;
    return false;
  }

  function injectArchivesForSave(state) {
    if (!state || state.__betweenCustomArchiveInjectedV7) return;

    /* Merge the currently active summary as well, then empty it so the older
       V3 save hook does not inject the same activity a second time. */
    var current=state.__betweenCustomSummaryV3;
    if (current && Array.isArray(current.logs) && current.logs.length) {
      archiveSummary(state,current);
      state.__betweenCustomSummaryV3={name:current.name,seconds:current.seconds,logs:[]};
    }

    var map=archiveMap(state);
    Object.keys(map).forEach(function (key) {
      var summary=map[key];
      if (!summary || !summary.logs.length) return;
      state.exercises.push({
        kind:'cardio',name:summary.name,distance:0,time:summary.seconds/60,
        plannedSets:summary.logs.length,__betweenCustomSavedV7:true
      });
      state.logs.push(summary.logs.map(function (log,index) {
        var copy=Object.assign({},log);copy.setNo=index+1;return copy;
      }));
    });
    state.__betweenCustomArchiveInjectedV7=true;
  }

  function fmtSec(sec) {
    sec=Math.max(0,Math.round(Number(sec)||0));
    return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
  }

  function syncArchiveRows() {
    var state=getState();
    var tbody=document.getElementById('session-plan-table');
    if (!state || !tbody) return;
    tbody.querySelectorAll('tr[data-between-custom-archive-v7]').forEach(function (row) { row.remove(); });
    var map=state.__betweenCustomArchiveV7;
    if (!map) return;
    Object.keys(map).forEach(function (key) {
      var summary=map[key];
      if (!summary || !summary.logs || !summary.logs.length) return;
      var duration=summary.logs.reduce(function (sum,log) { return sum+(Number(log.durationSec)||0); },0);
      var row=document.createElement('tr');
      row.setAttribute('data-between-custom-archive-v7','true');
      row.innerHTML='<td></td><td></td><td></td><td></td>';
      var cells=row.querySelectorAll('td');
      cells[0].textContent=summary.name;
      var chip=document.createElement('span');
      chip.className='between-custom-chip-v3';
      chip.textContent='Mellanövning';
      cells[0].appendChild(chip);
      cells[1].textContent=summary.seconds+' sek';
      cells[2].textContent=String(summary.logs.length);
      cells[3].textContent=fmtSec(duration);
      tbody.appendChild(row);
    });
  }

  function handleCapture(event) {
    var button=event.target&&event.target.closest?event.target.closest('button'):null;
    if (!button) return;
    var state=getState();
    if (!state) return;

    if (button.closest('#session-complete-box') && /spara pass/i.test(button.textContent||'')) {
      injectArchivesForSave(state);
      return;
    }

    if (state.__betweenCustomRuntimeV3 || !isTransitionButton(button,state)) return;
    var cfg=routedConfig(state);
    if (cfg.type!=='custom' || !cfg.name) return;
    var current=state.__betweenCustomSummaryV3;
    if (!current || !Array.isArray(current.logs) || !current.logs.length) return;
    if (keyFor(current)===keyFor(cfg)) return;
    archiveSummary(state,current);
  }

  function install() {
    if (window.__exerciseBetweenSummaryArchiveV7Installed) return;
    window.__exerciseBetweenSummaryArchiveV7Installed=true;
    document.addEventListener('click',handleCapture,true);
    setInterval(syncArchiveRows,220);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
