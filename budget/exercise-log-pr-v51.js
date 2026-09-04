(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseLogPrV51Installed) return;
  window.__exerciseLogPrV51Installed = true;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function number(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  function fmtWeight(value) {
    var n = number(value);
    if (!n) return '—';
    return (Math.round(n * 10) / 10).toLocaleString('sv-SE',{maximumFractionDigits:1}) + ' kg';
  }
  function workoutDateValue(workout,index) {
    var raw = workout && (workout.date || workout.datetime || workout.createdAt || workout.id);
    var parsed = raw ? Date.parse(raw) : NaN;
    if (Number.isFinite(parsed)) return parsed;
    var numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric > 100000) return numeric;
    return index;
  }
  function isStrength(exercise) {
    if (!exercise) return false;
    var kind = String(exercise.kind || '').toLowerCase();
    if (kind) return kind !== 'cardio' && kind !== 'run' && kind !== 'running';
    return !(number(exercise.distance) > 0 || number(exercise.time) > 0 || (number(exercise.duration) > 0 && !number(exercise.weight)));
  }
  function collectWeights(exercise) {
    var values = [];
    function add(value) { var n = number(value); if (n > 0) values.push(n); }
    add(exercise && exercise.weight);
    add(exercise && exercise.actualWeight);
    add(exercise && exercise.maxWeight);
    ['sets','logs','setLogs','setLog'].forEach(function (key) {
      var rows = exercise && exercise[key];
      if (!Array.isArray(rows)) return;
      rows.forEach(function (row) {
        if (!row || typeof row !== 'object') return;
        add(row.actualWeight); add(row.weight); add(row.maxWeight);
      });
    });
    return values;
  }
  function getWorkoutsSafe() {
    try {
      if (typeof window.getWorkouts === 'function') return window.getWorkouts() || [];
      if (typeof getWorkouts === 'function') return getWorkouts() || [];
    } catch (_) {}
    return [];
  }
  function buildRecords() {
    var workouts = getWorkoutsSafe().slice().map(function (workout,index) {
      return {workout:workout,index:index,time:workoutDateValue(workout,index)};
    }).sort(function (a,b) { return a.time - b.time; });
    var map = Object.create(null);
    workouts.forEach(function (entry) {
      var workout = entry.workout || {};
      var perWorkout = Object.create(null);
      (Array.isArray(workout.exercises) ? workout.exercises : []).forEach(function (exercise) {
        if (!isStrength(exercise)) return;
        var name = String(exercise.name || exercise.exercise || '').trim();
        if (!name) return;
        var key = name.toLocaleLowerCase('sv-SE');
        var weights = collectWeights(exercise);
        var best = weights.length ? Math.max.apply(Math,weights) : 0;
        if (!perWorkout[key]) perWorkout[key] = {name:name,best:best};
        else perWorkout[key].best = Math.max(perWorkout[key].best,best);
      });
      Object.keys(perWorkout).forEach(function (key) {
        var item = perWorkout[key];
        if (!map[key]) map[key] = {name:item.name,max:0,history:[]};
        if (item.best > 0) {
          map[key].max = Math.max(map[key].max,item.best);
          map[key].history.push(item.best);
        }
      });
    });
    return Object.keys(map).map(function (key) {
      var rec = map[key];
      rec.first = rec.history.length ? rec.history[0] : 0;
      rec.latest = rec.history.length ? rec.history[rec.history.length - 1] : 0;
      rec.delta = rec.first > 0 && rec.max > rec.first ? rec.max - rec.first : 0;
      return rec;
    }).sort(function (a,b) { return a.name.localeCompare(b.name,'sv-SE',{sensitivity:'base'}); });
  }
  function sparkline(values) {
    values = (values || []).filter(function (v) { return number(v) > 0; }).map(number);
    if (values.length < 2) return '<span class="record-spark-empty-v51">—</span>';
    var width=72,height=22,pad=3,min=Math.min.apply(Math,values),max=Math.max.apply(Math,values),span=Math.max(1,max-min);
    var points = values.map(function (value,index) {
      var x = pad + index * (width-pad*2)/(values.length-1);
      var y = height-pad - ((value-min)/span)*(height-pad*2);
      return x.toFixed(1)+','+y.toFixed(1);
    }).join(' ');
    var last = points.split(' ').pop().split(',');
    return '<svg class="record-spark-v51" viewBox="0 0 '+width+' '+height+'" aria-hidden="true"><polyline points="'+points+'"></polyline><circle cx="'+last[0]+'" cy="'+last[1]+'" r="2.3"></circle></svg>';
  }

  var lastRecordSignature = '';
  function renderStrengthRecords(force) {
    var grid = document.getElementById('pr-grid');
    if (!grid) return;
    var records = buildRecords();
    var signature = JSON.stringify(records.map(function (r) { return [r.name,r.max,r.first,r.latest,r.history.length]; }));
    if (!force && signature === lastRecordSignature && grid.classList.contains('records-table-wrap-v51')) return;
    lastRecordSignature = signature;

    var header = Array.prototype.find.call(document.querySelectorAll('.section-hdr'),function (node) {
      var h2 = node.querySelector('h2');
      return h2 && /personliga rekord/i.test(h2.textContent || '');
    });
    if (header) {
      var oldButton = header.querySelector('button');
      if (oldButton) oldButton.style.display = 'none';
      if (!header.querySelector('.records-subtitle-v51')) {
        var subtitle = document.createElement('div');
        subtitle.className = 'records-subtitle-v51';
        subtitle.textContent = 'Automatiskt från träningsloggen · högsta registrerade vikt';
        header.appendChild(subtitle);
      }
      header.classList.add('records-header-v51');
    }

    grid.classList.add('records-table-wrap-v51');
    if (!records.length) {
      grid.innerHTML = '<div class="records-empty-v51">Inga styrkeövningar registrerade ännu.</div>';
      return;
    }
    var accents=['#22D3EE','#A78BFA','#FB923C','#34D399','#F472B6'];
    var rows=records.map(function (rec,index) {
      var firstToMax = rec.first > 0 && rec.max > 0 ? (Math.round(rec.first*10)/10).toLocaleString('sv-SE',{maximumFractionDigits:1})+' → '+(Math.round(rec.max*10)/10).toLocaleString('sv-SE',{maximumFractionDigits:1}) : '—';
      var gain = rec.delta > 0 ? '<span class="record-gain-v51">+'+(Math.round(rec.delta*10)/10).toLocaleString('sv-SE',{maximumFractionDigits:1})+' kg</span>' : '<span class="record-flat-v51">'+(rec.history.length > 1 ? 'stabil' : 'ny')+'</span>';
      return '<div class="record-row-v51" style="--record-accent:'+accents[index%accents.length]+'"><div class="record-name-v51"><span class="record-dot-v51"></span><span>'+esc(rec.name)+'</span></div><div class="record-max-v51">'+esc(fmtWeight(rec.max))+'</div><div class="record-progress-v51">'+sparkline(rec.history)+'<div class="record-progress-copy-v51"><span>'+esc(firstToMax)+'</span>'+gain+'</div></div></div>';
    }).join('');
    grid.innerHTML='<div class="records-table-v51"><div class="records-head-v51"><span>Övning</span><span>Max</span><span>Utveckling</span></div>'+rows+'</div>';
  }
  window.renderStrengthRecordsV51 = renderStrengthRecords;

  function formatSummaryDate(raw) {
    if (!raw) return '';
    var parts=String(raw).split('-');
    return parts.length===3 ? parts[2]+'/'+parts[1] : String(raw);
  }
  function resetAddExerciseModal() {
    var overlay=document.getElementById('wk-modal');
    if (!overlay) return;
    overlay.classList.remove('log-add-mode-v51');
    overlay.querySelectorAll('.log-add-hidden-v51').forEach(function (node) { node.classList.remove('log-add-hidden-v51'); });
    var summary=overlay.querySelector('.log-add-summary-v51'); if (summary) summary.remove();
    delete overlay.dataset.logAddExistingCountV51;
    var list=document.getElementById('ex-list');
    var group=list && (list.closest('.form-group') || list.parentElement);
    var label=group && group.querySelector(':scope > label'); if (label) label.textContent='Övningar';
    var footer=overlay.querySelector('.modal-footer');
    if (footer) footer.querySelectorAll('button').forEach(function (button) {
      if (button.dataset.originalTextV51) { button.textContent=button.dataset.originalTextV51; delete button.dataset.originalTextV51; }
    });
  }
  function syncAddExerciseModal() {
    var overlay=document.getElementById('wk-modal');
    if (!overlay) return;
    var modal=overlay.querySelector('.modal') || overlay.firstElementChild;
    var title=modal && modal.querySelector(':scope > h2');
    var addMode=!!(overlay.classList.contains('show') && title && /^lägg till övning$/i.test(String(title.textContent||'').trim()));
    if (!addMode) { resetAddExerciseModal(); return; }

    overlay.classList.add('log-add-mode-v51');
    var list=document.getElementById('ex-list'); if (!list) return;
    var exerciseGroup=list.closest('.form-group') || list.parentElement;
    if (!overlay.dataset.logAddExistingCountV51) overlay.dataset.logAddExistingCountV51=String(Math.max(0,list.querySelectorAll('.ex-row-item').length-1));
    var existingCount=Number(overlay.dataset.logAddExistingCountV51)||0;
    list.querySelectorAll('.ex-row-item').forEach(function (row,index) { row.classList.toggle('log-add-hidden-v51',index<existingCount); });
    modal.querySelectorAll('.form-group').forEach(function (group) { group.classList.toggle('log-add-hidden-v51',group!==exerciseGroup); });

    var summary=overlay.querySelector('.log-add-summary-v51');
    if (!summary) { summary=document.createElement('div'); summary.className='log-add-summary-v51'; exerciseGroup.parentNode.insertBefore(summary,exerciseGroup); }
    var date=document.getElementById('wk-date'),type=document.getElementById('wk-type'),duration=document.getElementById('wk-dur');
    summary.innerHTML='<span class="log-add-summary-label-v51">Lägger till i</span><strong>'+esc(type&&type.value?type.value:'Pass')+'</strong>'+(date&&date.value?'<span>'+esc(formatSummaryDate(date.value))+'</span>':'')+(duration&&duration.value?'<span>'+esc(duration.value)+' min</span>':'');
    var label=exerciseGroup.querySelector(':scope > label'); if (label) label.textContent='Ny övning';
    var footer=modal.querySelector('.modal-footer');
    if (footer) footer.querySelectorAll('button').forEach(function (button) {
      var text=String(button.textContent||'').trim();
      if (/spara/i.test(text) && !/mall/i.test(text)) {
        if (!button.dataset.originalTextV51) button.dataset.originalTextV51=text;
        button.textContent='Lägg till';
      }
    });
  }

  function addStyles() {
    if (document.getElementById('exercise-log-pr-v51-style')) return;
    var style=document.createElement('style'); style.id='exercise-log-pr-v51-style';
    style.textContent=`
      .records-header-v51{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:3px!important;align-items:start!important}.records-header-v51 h2{margin-bottom:0!important}.records-subtitle-v51{font-size:11px;line-height:1.35;color:#738094;font-weight:650;margin-left:16px}
      #pr-grid.records-table-wrap-v51{display:block!important;grid-template-columns:none!important;gap:0!important;margin-top:12px!important}.records-table-v51{overflow:hidden;border:1px solid rgba(148,163,184,.13);border-radius:13px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.018))}.records-head-v51,.record-row-v51{display:grid;grid-template-columns:minmax(0,1.35fr) 70px minmax(112px,.95fr);align-items:center;column-gap:9px}.records-head-v51{min-height:34px;padding:0 12px;border-bottom:1px solid rgba(148,163,184,.13);font-size:9px;font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:#667386}.records-head-v51 span:nth-child(2),.records-head-v51 span:nth-child(3){text-align:right}.record-row-v51{position:relative;min-height:52px;padding:7px 12px;border-bottom:1px solid rgba(148,163,184,.09)}.record-row-v51:last-child{border-bottom:0}.record-row-v51::before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:2px;border-radius:0 2px 2px 0;background:var(--record-accent)}.record-name-v51{display:flex;align-items:center;gap:8px;min-width:0;color:#E8EDF5;font-size:12px;font-weight:760}.record-name-v51 span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.record-dot-v51{width:6px;height:6px;flex:0 0 6px;border-radius:50%;background:var(--record-accent)}.record-max-v51{text-align:right;color:#F8FAFC;font-size:12px;font-weight:850;font-variant-numeric:tabular-nums}.record-progress-v51{display:flex;justify-content:flex-end;align-items:center;gap:6px;min-width:0}.record-spark-v51{width:50px;height:19px;flex:0 0 50px;overflow:visible}.record-spark-v51 polyline{fill:none;stroke:var(--record-accent);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:.82}.record-spark-v51 circle{fill:var(--record-accent)}.record-spark-empty-v51{width:50px;text-align:center;color:#4D596A}.record-progress-copy-v51{display:flex;min-width:52px;flex-direction:column;align-items:flex-end;gap:1px;font-size:8.5px;color:#7D899B;font-weight:700;white-space:nowrap}.record-gain-v51{color:#34D399}.record-flat-v51{color:#667386}.records-empty-v51{padding:16px 12px;border:1px dashed rgba(148,163,184,.16);border-radius:12px;color:#718096;font-size:12px}
      #wk-modal.log-add-mode-v51 .modal{width:min(620px,calc(100vw - 24px))!important;max-height:min(78vh,720px)!important;padding:18px!important;border-color:rgba(34,211,238,.18)!important;background:linear-gradient(180deg,#181E27,#141922)!important}#wk-modal.log-add-mode-v51 .modal>h2{font-size:20px!important;margin:0 42px 14px 0!important}.log-add-hidden-v51{display:none!important}.log-add-summary-v51{display:flex;align-items:center;gap:8px;min-height:36px;margin:0 0 12px;padding:8px 10px;border:1px solid rgba(34,211,238,.13);border-radius:10px;background:rgba(34,211,238,.035);font-size:10px;color:#8391A4}.log-add-summary-v51 strong{color:#DDF8FC;font-size:12px}.log-add-summary-label-v51{text-transform:uppercase;letter-spacing:.08em;font-size:8px;font-weight:850;color:#5D6C80}#wk-modal.log-add-mode-v51 #ex-list{border:1px solid rgba(148,163,184,.12);border-radius:12px;overflow:hidden;background:rgba(255,255,255,.015)}#wk-modal.log-add-mode-v51 #ex-list .ex-row-item{padding:9px 10px!important;background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.012))!important}#wk-modal.log-add-mode-v51 .form-group>label{font-size:9px!important;letter-spacing:.11em!important;color:#7C899B!important}#wk-modal.log-add-mode-v51 .modal-footer{margin-top:14px!important;padding-top:12px!important;border-top:1px solid rgba(148,163,184,.10)!important}#wk-modal.log-add-mode-v51 .modal-footer .btn-primary{background:linear-gradient(135deg,#22D3EE,#0891B2)!important;color:#061218!important}
      @media(max-width:520px){.records-head-v51,.record-row-v51{grid-template-columns:minmax(0,1.15fr) 64px minmax(104px,1fr);column-gap:6px}.record-row-v51{padding-left:10px;padding-right:10px}.record-name-v51{font-size:11px}.record-max-v51{font-size:11px}.record-spark-v51,.record-spark-empty-v51{width:42px;flex-basis:42px}.record-progress-copy-v51{min-width:46px;font-size:7.8px}#wk-modal.log-add-mode-v51 .modal{padding:14px!important;width:calc(100vw - 16px)!important;max-height:82vh!important}}
    `;
    document.head.appendChild(style);
  }

  function wrapRefreshAll() {
    var original=window.refreshAll;
    if (typeof original!=='function' || original.__recordV51Wrapped) return;
    var wrapped=function () { var result=original.apply(this,arguments); setTimeout(function(){ renderStrengthRecords(false); },0); return result; };
    wrapped.__recordV51Wrapped=true; wrapped.__recordV51Original=original; window.refreshAll=wrapped;
  }
  function scheduleModalSync() { setTimeout(syncAddExerciseModal,0); setTimeout(syncAddExerciseModal,80); }
  function install() {
    addStyles();
    renderStrengthRecords(true);
    wrapRefreshAll();
    setTimeout(function(){ wrapRefreshAll(); renderStrengthRecords(false); },250);
    setTimeout(function(){ wrapRefreshAll(); renderStrengthRecords(false); },900);

    document.addEventListener('click',function (event) {
      var target=event.target && event.target.closest ? event.target.closest('.log-add-workout-v8,#wk-modal button') : null;
      if (!target) return;
      scheduleModalSync();
      if (target.closest && target.closest('#wk-modal') && /lägg till|spara/i.test(String(target.textContent||''))) setTimeout(function(){ renderStrengthRecords(false); },120);
    },true);
    window.addEventListener('firebase-sync',function(){ setTimeout(function(){ renderStrengthRecords(false); },40); });
    document.addEventListener('firebase-sync',function(){ setTimeout(function(){ renderStrengthRecords(false); },40); });
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
