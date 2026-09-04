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
    return !(number(exercise.distance) > 0 || number(exercise.time) > 0 || number(exercise.duration) > 0 && !number(exercise.weight));
  }

  function collectWeights(exercise) {
    var values = [];
    function add(value) {
      var n = number(value);
      if (n > 0) values.push(n);
    }
    add(exercise && exercise.weight);
    add(exercise && exercise.actualWeight);
    add(exercise && exercise.maxWeight);

    ['sets','logs','setLogs','setLog'].forEach(function (key) {
      var rows = exercise && exercise[key];
      if (!Array.isArray(rows)) return;
      rows.forEach(function (row) {
        if (!row || typeof row !== 'object') return;
        add(row.actualWeight);
        add(row.weight);
        add(row.maxWeight);
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
        if (!map[key]) map[key] = {name:item.name,max:0,history:[],appearances:0};
        var rec = map[key];
        rec.appearances++;
        if (item.best > 0) {
          rec.max = Math.max(rec.max,item.best);
          rec.history.push(item.best);
        }
      });
    });

    return Object.keys(map).map(function (key) {
      var rec = map[key];
      rec.first = rec.history.length ? rec.history[0] : 0;
      rec.latest = rec.history.length ? rec.history[rec.history.length - 1] : 0;
      rec.delta = rec.first > 0 && rec.max > rec.first ? rec.max - rec.first : 0;
      return rec;
    }).sort(function (a,b) {
      return a.name.localeCompare(b.name,'sv-SE',{sensitivity:'base'});
    });
  }

  function sparkline(values) {
    values = (values || []).filter(function (v) { return number(v) > 0; }).map(number);
    if (values.length < 2) return '<span class="record-spark-empty-v51">—</span>';
    var width = 72, height = 22, pad = 3;
    var min = Math.min.apply(Math,values), max = Math.max.apply(Math,values);
    var span = Math.max(1,max-min);
    var points = values.map(function (value,index) {
      var x = pad + (values.length === 1 ? 0 : index * (width-pad*2)/(values.length-1));
      var y = height-pad - ((value-min)/span)*(height-pad*2);
      return x.toFixed(1)+','+y.toFixed(1);
    }).join(' ');
    var last = points.split(' ').pop().split(',');
    return '<svg class="record-spark-v51" viewBox="0 0 '+width+' '+height+'" aria-hidden="true">'
      +'<polyline points="'+points+'"></polyline>'
      +'<circle cx="'+last[0]+'" cy="'+last[1]+'" r="2.3"></circle>'
      +'</svg>';
  }

  function renderStrengthRecords() {
    var grid = document.getElementById('pr-grid');
    if (!grid) return;
    var header = grid.previousElementSibling;
    if (!header || !header.classList.contains('section-hdr')) {
      header = Array.prototype.find.call(document.querySelectorAll('.section-hdr'),function (node) {
        var h2 = node.querySelector('h2');
        return h2 && /personliga rekord/i.test(h2.textContent || '');
      });
    }
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

    var records = buildRecords();
    grid.classList.add('records-table-wrap-v51');
    if (!records.length) {
      grid.innerHTML = '<div class="records-empty-v51">Inga styrkeövningar registrerade ännu.</div>';
      return;
    }

    var accents = ['#22D3EE','#A78BFA','#FB923C','#34D399','#F472B6'];
    var rows = records.map(function (rec,index) {
      var firstToMax = rec.first > 0 && rec.max > 0
        ? (Math.round(rec.first*10)/10).toLocaleString('sv-SE',{maximumFractionDigits:1})+' → '+(Math.round(rec.max*10)/10).toLocaleString('sv-SE',{maximumFractionDigits:1})
        : '—';
      var gain = rec.delta > 0
        ? '<span class="record-gain-v51">+'+(Math.round(rec.delta*10)/10).toLocaleString('sv-SE',{maximumFractionDigits:1})+' kg</span>'
        : '<span class="record-flat-v51">'+(rec.history.length > 1 ? 'stabil' : 'ny')+'</span>';
      return '<div class="record-row-v51" style="--record-accent:'+accents[index % accents.length]+'">'
        +'<div class="record-name-v51"><span class="record-dot-v51"></span><span>'+esc(rec.name)+'</span></div>'
        +'<div class="record-max-v51">'+esc(fmtWeight(rec.max))+'</div>'
        +'<div class="record-progress-v51">'+sparkline(rec.history)+'<div class="record-progress-copy-v51"><span>'+esc(firstToMax)+'</span>'+gain+'</div></div>'
        +'</div>';
    }).join('');

    grid.innerHTML = '<div class="records-table-v51">'
      +'<div class="records-head-v51"><span>Övning</span><span>Max</span><span>Utveckling</span></div>'
      +rows+'</div>';
  }
  window.renderStrengthRecordsV51 = renderStrengthRecords;

  function formatSummaryDate(raw) {
    if (!raw) return '';
    var parts = String(raw).split('-');
    if (parts.length === 3) return parts[2]+'/'+parts[1];
    return String(raw);
  }

  function syncAddExerciseModal() {
    var overlay = document.getElementById('wk-modal');
    if (!overlay) return;
    var modal = overlay.querySelector('.modal') || overlay.firstElementChild;
    var title = modal && modal.querySelector(':scope > h2');
    var addMode = !!(overlay.classList.contains('show') && title && /^lägg till övning$/i.test(String(title.textContent || '').trim()));

    if (!addMode) {
      overlay.classList.remove('log-add-mode-v51');
      overlay.querySelectorAll('.log-add-hidden-v51').forEach(function (node) { node.classList.remove('log-add-hidden-v51'); });
      var oldSummary = overlay.querySelector('.log-add-summary-v51');
      if (oldSummary) oldSummary.remove();
      delete overlay.dataset.logAddExistingCountV51;
      return;
    }

    overlay.classList.add('log-add-mode-v51');
    var list = document.getElementById('ex-list');
    if (!list) return;
    var exerciseGroup = list.closest('.form-group') || list.parentElement;

    if (!overlay.dataset.logAddExistingCountV51) {
      var initialRows = list.querySelectorAll('.ex-row-item').length;
      overlay.dataset.logAddExistingCountV51 = String(Math.max(0,initialRows-1));
    }
    var existingCount = Number(overlay.dataset.logAddExistingCountV51) || 0;
    Array.prototype.forEach.call(list.querySelectorAll('.ex-row-item'),function (row,index) {
      row.classList.toggle('log-add-hidden-v51',index < existingCount);
    });

    if (modal) {
      Array.prototype.forEach.call(modal.querySelectorAll('.form-group'),function (group) {
        if (group !== exerciseGroup) group.classList.add('log-add-hidden-v51');
        else group.classList.remove('log-add-hidden-v51');
      });
    }

    var summary = overlay.querySelector('.log-add-summary-v51');
    if (!summary) {
      summary = document.createElement('div');
      summary.className = 'log-add-summary-v51';
      if (exerciseGroup && exerciseGroup.parentNode) exerciseGroup.parentNode.insertBefore(summary,exerciseGroup);
    }
    var date = document.getElementById('wk-date');
    var type = document.getElementById('wk-type');
    var duration = document.getElementById('wk-dur');
    summary.innerHTML = '<span class="log-add-summary-label-v51">Lägger till i</span>'
      +'<strong>'+esc(type && type.value ? type.value : 'Pass')+'</strong>'
      +(date && date.value ? '<span>'+esc(formatSummaryDate(date.value))+'</span>' : '')
      +(duration && duration.value ? '<span>'+esc(duration.value)+' min</span>' : '');

    if (exerciseGroup) {
      var label = exerciseGroup.querySelector(':scope > label');
      if (label) label.textContent = 'Ny övning';
    }
    var footer = modal && modal.querySelector('.modal-footer');
    if (footer) {
      var buttons = footer.querySelectorAll('button');
      Array.prototype.forEach.call(buttons,function (button) {
        var text = String(button.textContent || '').trim();
        if (/spara/i.test(text) && !/mall/i.test(text)) button.textContent = 'Lägg till';
      });
    }
  }

  function addStyles() {
    if (document.getElementById('exercise-log-pr-v51-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-log-pr-v51-style';
    style.textContent = `
      .records-header-v51{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:3px!important;align-items:start!important}
      .records-header-v51 h2{margin-bottom:0!important}
      .records-subtitle-v51{font-size:11px;line-height:1.35;color:#738094;font-weight:650;letter-spacing:.01em;margin-left:16px}
      #pr-grid.records-table-wrap-v51{display:block!important;grid-template-columns:none!important;gap:0!important;margin-top:12px!important}
      .records-table-v51{overflow:hidden;border:1px solid rgba(148,163,184,.13);border-radius:13px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.018));box-shadow:inset 0 1px 0 rgba(255,255,255,.02)}
      .records-head-v51,.record-row-v51{display:grid;grid-template-columns:minmax(0,1.35fr) 74px minmax(116px,.95fr);align-items:center;column-gap:10px}
      .records-head-v51{min-height:34px;padding:0 12px;border-bottom:1px solid rgba(148,163,184,.13);font-size:9px;font-weight:850;letter-spacing:.10em;text-transform:uppercase;color:#667386}
      .records-head-v51 span:nth-child(2){text-align:right}.records-head-v51 span:nth-child(3){text-align:right}
      .record-row-v51{position:relative;min-height:52px;padding:7px 12px;border-bottom:1px solid rgba(148,163,184,.09);transition:background .18s ease}
      .record-row-v51:last-child{border-bottom:0}.record-row-v51:hover{background:rgba(255,255,255,.018)}
      .record-row-v51::before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:2px;border-radius:0 2px 2px 0;background:var(--record-accent);box-shadow:0 0 10px color-mix(in srgb,var(--record-accent) 45%,transparent)}
      .record-name-v51{display:flex;align-items:center;gap:8px;min-width:0;color:#E8EDF5;font-size:12px;font-weight:760}
      .record-name-v51 span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .record-dot-v51{width:6px;height:6px;flex:0 0 6px;border-radius:50%;background:var(--record-accent);box-shadow:0 0 9px color-mix(in srgb,var(--record-accent) 42%,transparent)}
      .record-max-v51{text-align:right;color:#F8FAFC;font-size:12px;font-weight:850;font-variant-numeric:tabular-nums}
      .record-progress-v51{display:flex;justify-content:flex-end;align-items:center;gap:7px;min-width:0}
      .record-spark-v51{width:52px;height:19px;flex:0 0 52px;overflow:visible}.record-spark-v51 polyline{fill:none;stroke:var(--record-accent);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:.82}.record-spark-v51 circle{fill:var(--record-accent);filter:drop-shadow(0 0 3px var(--record-accent))}
      .record-spark-empty-v51{width:52px;text-align:center;color:#4D596A;font-size:11px}
      .record-progress-copy-v51{display:flex;min-width:54px;flex-direction:column;align-items:flex-end;gap:1px;font-size:8.5px;color:#7D899B;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
      .record-gain-v51{color:#6EE7B7;font-size:8px;font-weight:850}.record-flat-v51{color:#687588;font-size:8px;font-weight:750}
      .records-empty-v51{padding:16px 14px;border:1px dashed rgba(148,163,184,.15);border-radius:12px;color:#667386;font-size:12px;background:rgba(255,255,255,.018)}

      #wk-modal.log-add-mode-v51 .modal{width:min(680px,calc(100vw - 24px))!important;max-width:680px!important;max-height:min(86vh,720px)!important;padding:18px!important;border-color:rgba(34,211,238,.16)!important;background:linear-gradient(180deg,#171C23,#141920)!important;box-shadow:0 24px 70px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.035)!important}
      #wk-modal.log-add-mode-v51 .modal>h2{margin:0 46px 12px 0!important;font-size:19px!important;letter-spacing:-.25px!important}
      #wk-modal.log-add-mode-v51 .log-add-hidden-v51{display:none!important}
      #wk-modal.log-add-mode-v51 .log-add-summary-v51{display:flex;align-items:center;gap:8px;min-height:34px;margin:0 0 12px;padding:7px 10px;border:1px solid rgba(34,211,238,.12);border-radius:10px;background:linear-gradient(90deg,rgba(34,211,238,.06),rgba(255,255,255,.018));font-size:10px;color:#8C99AA}
      #wk-modal.log-add-mode-v51 .log-add-summary-v51 strong{font-size:11px;color:#E7F8FC;font-weight:850;margin-right:auto}
      #wk-modal.log-add-mode-v51 .log-add-summary-label-v51{text-transform:uppercase;letter-spacing:.08em;font-size:8px;font-weight:850;color:#5D6B7C}
      #wk-modal.log-add-mode-v51 .form-group:has(#ex-list){margin:0!important;padding:0!important}
      #wk-modal.log-add-mode-v51 .form-group:has(#ex-list)>label{display:block;margin:0 0 6px!important;font-size:9px!important;font-weight:850!important;letter-spacing:.09em!important;text-transform:uppercase!important;color:#778395!important}
      #wk-modal.log-add-mode-v51 #ex-list{display:flex!important;flex-direction:column!important;gap:7px!important;margin:0!important}
      #wk-modal.log-add-mode-v51 #ex-list .ex-row-item{padding:10px!important;border:1px solid rgba(34,211,238,.10)!important;border-radius:11px!important;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.018))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.02)!important}
      #wk-modal.log-add-mode-v51 #ex-list .ex-row{display:grid!important;grid-template-columns:minmax(0,1fr) 56px 56px 62px 26px!important;gap:5px!important;width:100%!important;min-width:0!important}
      #wk-modal.log-add-mode-v51 #ex-list .ex-row-item.is-cardio .ex-row{grid-template-columns:minmax(0,1fr) 84px 84px 26px!important}
      #wk-modal.log-add-mode-v51 #ex-list .ex-row input{width:100%!important;min-width:0!important;height:36px!important;padding:7px 8px!important;border-radius:8px!important;background:#21262D!important;border:1px solid rgba(255,255,255,.08)!important;color:#F0F6FC!important;font-size:12px!important;box-sizing:border-box!important}
      #wk-modal.log-add-mode-v51 #ex-list .ex-row .ex-name{padding-left:10px!important}
      #wk-modal.log-add-mode-v51 #ex-list .ex-del{width:24px!important;min-width:24px!important;height:36px!important;padding:0!important}
      #wk-modal.log-add-mode-v51 #ex-list+button,#wk-modal.log-add-mode-v51 .form-group:has(#ex-list)>.btn-sm{margin-top:7px!important;width:100%!important;min-height:34px!important;border-style:dashed!important;background:rgba(34,211,238,.035)!important}
      #wk-modal.log-add-mode-v51 .modal-footer{margin-top:13px!important;padding-top:11px!important;border-top:1px solid rgba(148,163,184,.10)!important;gap:8px!important}
      #wk-modal.log-add-mode-v51 .modal-footer button{min-height:38px!important;border-radius:9px!important;font-size:11px!important;font-weight:850!important}

      @media(max-width:600px){
        .records-subtitle-v51{margin-left:14px;font-size:10px}.records-head-v51,.record-row-v51{grid-template-columns:minmax(0,1fr) 62px minmax(104px,.9fr);column-gap:7px}.records-head-v51{padding:0 9px}.record-row-v51{padding:7px 9px;min-height:50px}.record-name-v51,.record-max-v51{font-size:11px}.record-spark-v51{width:44px;flex-basis:44px}.record-progress-copy-v51{min-width:48px;font-size:8px}
        #wk-modal.log-add-mode-v51{align-items:center!important;padding:10px!important}
        #wk-modal.log-add-mode-v51 .modal{width:100%!important;max-height:88vh!important;padding:15px!important;border-radius:15px!important}
        #wk-modal.log-add-mode-v51 #ex-list .ex-row{grid-template-columns:minmax(0,1fr) 44px 44px 50px 24px!important;gap:4px!important}
        #wk-modal.log-add-mode-v51 #ex-list .ex-row-item.is-cardio .ex-row{grid-template-columns:minmax(0,1fr) 68px 68px 24px!important}
        #wk-modal.log-add-mode-v51 #ex-list .ex-row input{font-size:11px!important;padding-left:6px!important;padding-right:6px!important}
      }
      @media(max-width:380px){.record-spark-v51{display:none}.record-progress-copy-v51{min-width:66px}.records-head-v51,.record-row-v51{grid-template-columns:minmax(0,1fr) 58px 70px}}
    `;
    document.head.appendChild(style);
  }

  function wrapRefreshAll() {
    var original = window.refreshAll;
    if (typeof original !== 'function' || original.__exerciseLogPrV51Wrapped) return;
    var wrapped = function () {
      var result = original.apply(this,arguments);
      renderStrengthRecords();
      requestAnimationFrame(syncAddExerciseModal);
      return result;
    };
    wrapped.__exerciseLogPrV51Wrapped = true;
    wrapped.__exerciseLogPrV51Original = original;
    window.refreshAll = wrapped;
  }

  function install() {
    addStyles();
    if (typeof window.renderPRs === 'function') window.renderPRs = renderStrengthRecords;
    wrapRefreshAll();
    renderStrengthRecords();
    syncAddExerciseModal();

    var observer = new MutationObserver(function () {
      requestAnimationFrame(function () {
        syncAddExerciseModal();
        var grid = document.getElementById('pr-grid');
        if (grid && !grid.classList.contains('records-table-wrap-v51')) renderStrengthRecords();
      });
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

    [80,300,900].forEach(function (delay) {
      setTimeout(function () {
        wrapRefreshAll();
        renderStrengthRecords();
        syncAddExerciseModal();
      },delay);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
