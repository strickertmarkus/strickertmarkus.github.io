(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var rangeChart = null;
  var lastSignature = '';
  var lastWorkoutModalOpen = false;
  var lastWorkoutEditId = null;
  var lastSessionToken = null;

  function getWorkoutsSafe() {
    try {
      return typeof window.getWorkouts === 'function' ? (window.getWorkouts() || []) : [];
    } catch (e) { return []; }
  }

  function saveWorkoutsSafe(list) {
    try {
      if (typeof window.saveWorkouts === 'function') window.saveWorkouts(list);
    } catch (e) {}
  }

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (e) { return null; }
  }

  function numberOrNull(value) {
    if (value === '' || value === null || typeof value === 'undefined') return null;
    var n = Number(value);
    return Number.isFinite(n) && n >= 30 && n <= 240 ? Math.round(n) : null;
  }

  function addStyles() {
    if (document.getElementById('exercise-heart-rate-range-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-heart-rate-range-style';
    style.textContent = `
      .hr-triple-row-v3 {
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:10px;
        margin-bottom:14px;
      }
      .hr-triple-row-v3 .form-group { margin-bottom:0; min-width:0; }
      .hr-inline-range-v3 {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
      }
      .hr-range-hint-v3 {
        margin:-7px 0 12px;
        color:var(--text-dim);
        font-size:10px;
        line-height:1.35;
      }
      #hr-card-combined .chart-note .hr-band-note-v3 {
        color:var(--text-dim);
      }
      @media(max-width:600px) {
        .hr-triple-row-v3 { gap:6px; }
        .hr-triple-row-v3 .form-group label { font-size:9px; letter-spacing:.45px; }
        .hr-triple-row-v3 .form-group input { padding:8px 6px; font-size:12px; }
        .hr-inline-range-v3 { gap:6px; }
      }
    `;
    document.head.appendChild(style);
  }

  function makeGroup(label, id) {
    var group = document.createElement('div');
    group.className = 'form-group';
    group.innerHTML = '<label>' + label + '</label><input type="number" id="' + id + '" min="30" max="240" inputmode="numeric" placeholder="—">';
    return group;
  }

  function ensureWorkoutFields() {
    var avg = document.getElementById('wk-hr-avg');
    if (!avg) return;
    if (document.getElementById('wk-hr-min')) return;

    var avgGroup = avg.closest('.form-group');
    var oldRow = avgGroup && avgGroup.parentElement;
    if (!avgGroup || !oldRow) return;

    var triple = document.createElement('div');
    triple.className = 'hr-triple-row-v3';
    triple.id = 'wk-hr-triple-v3';
    oldRow.parentNode.insertBefore(triple, oldRow);
    triple.appendChild(makeGroup('Minpuls (bpm)', 'wk-hr-min'));
    triple.appendChild(avgGroup);
    triple.appendChild(makeGroup('Maxpuls (bpm)', 'wk-hr-max'));

    var hint = document.createElement('div');
    hint.className = 'hr-range-hint-v3';
    hint.textContent = 'Min/medel/max från klockan används som intervall i pulsgrafen.';
    triple.insertAdjacentElement('afterend', hint);
  }

  function ensureSessionFields() {
    var avg = document.getElementById('session-hr');
    if (!avg || document.getElementById('session-hr-min')) return;
    var avgGroup = avg.closest('.form-group');
    var oldRow = avgGroup && avgGroup.parentElement;
    if (!avgGroup || !oldRow) return;

    var triple = document.createElement('div');
    triple.className = 'hr-triple-row-v3';
    triple.id = 'session-hr-triple-v3';
    oldRow.parentNode.insertBefore(triple, oldRow);
    triple.appendChild(makeGroup('Minpuls (bpm)', 'session-hr-min'));
    triple.appendChild(avgGroup);
    triple.appendChild(makeGroup('Maxpuls (bpm)', 'session-hr-max'));
  }

  function ensureInlineFields() {
    var workouts = getWorkoutsSafe();
    document.querySelectorAll('[id^="in-hr-"]').forEach(function (avg) {
      if (/^in-hr-(min|max)-/.test(avg.id)) return;
      var id = Number(avg.id.replace('in-hr-', ''));
      if (!Number.isFinite(id) || document.getElementById('in-hr-min-' + id)) return;
      var row = avg.closest('.form-row');
      if (!row || !row.parentNode) return;
      var wk = workouts.find(function (w) { return Number(w.id) === id; }) || {};
      var wrap = document.createElement('div');
      wrap.className = 'hr-inline-range-v3';
      var minGroup = makeGroup('Minpuls (bpm)', 'in-hr-min-' + id);
      var maxGroup = makeGroup('Maxpuls (bpm)', 'in-hr-max-' + id);
      minGroup.querySelector('input').value = wk.hrMin || '';
      maxGroup.querySelector('input').value = wk.hrMax || '';
      wrap.appendChild(minGroup);
      wrap.appendChild(maxGroup);
      row.insertAdjacentElement('afterend', wrap);
    });
  }

  function setValue(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value || '';
  }

  function syncWorkoutModalValues() {
    var modal = document.getElementById('wk-modal');
    if (!modal) return;
    var open = modal.classList.contains('show');
    if (!open) {
      lastWorkoutModalOpen = false;
      lastWorkoutEditId = null;
      return;
    }

    var editId = null;
    try { editId = Number(window.editingWorkoutId || 0) || null; } catch (e) {}
    if (!lastWorkoutModalOpen || editId !== lastWorkoutEditId) {
      var wk = editId ? getWorkoutsSafe().find(function (w) { return Number(w.id) === editId; }) : null;
      setValue('wk-hr-min', wk && wk.hrMin);
      setValue('wk-hr-max', wk && wk.hrMax);
      lastWorkoutModalOpen = true;
      lastWorkoutEditId = editId;
    }
  }

  function syncSessionValues() {
    var state = getState();
    var token = state && state.passStartedAt ? String(state.passStartedAt) : null;
    if (token && token !== lastSessionToken) {
      setValue('session-hr-min', '');
      setValue('session-hr-max', '');
      lastSessionToken = token;
    } else if (!state) {
      lastSessionToken = null;
    }
  }

  function validateRange(min, avg, max) {
    min = numberOrNull(min);
    avg = numberOrNull(avg);
    max = numberOrNull(max);
    if (min !== null && avg !== null && min > avg) return 'Minpuls kan inte vara högre än medelpuls.';
    if (max !== null && avg !== null && max < avg) return 'Maxpuls kan inte vara lägre än medelpuls.';
    if (min !== null && max !== null && min > max) return 'Minpuls kan inte vara högre än maxpuls.';
    return '';
  }

  function toast(message) {
    try { if (typeof window.showToast === 'function') window.showToast(message); }
    catch (e) {}
  }

  function patchWorkout(id, min, max) {
    if (!id) return;
    var list = getWorkoutsSafe();
    var idx = list.findIndex(function (w) { return Number(w.id) === Number(id); });
    if (idx < 0) return;
    var changed = false;
    var nMin = numberOrNull(min);
    var nMax = numberOrNull(max);
    if ((list[idx].hrMin || null) !== nMin) { list[idx].hrMin = nMin; changed = true; }
    if ((list[idx].hrMax || null) !== nMax) { list[idx].hrMax = nMax; changed = true; }
    if (changed) saveWorkoutsSafe(list);
  }

  function captureSave(event) {
    var button = event.target && event.target.closest ? event.target.closest('button') : null;
    if (!button) return;
    var onclick = button.getAttribute('onclick') || '';
    var mode = null;
    var id = null;
    var minEl = null;
    var maxEl = null;
    var avgEl = null;

    if (onclick.indexOf('saveWorkout()') >= 0) {
      mode = 'workout';
      minEl = document.getElementById('wk-hr-min');
      maxEl = document.getElementById('wk-hr-max');
      avgEl = document.getElementById('wk-hr-avg');
      try { id = Number(window.editingWorkoutId || 0) || null; } catch (e) {}
    } else if (onclick.indexOf('saveInlineWorkout(') >= 0) {
      mode = 'inline';
      var match = onclick.match(/saveInlineWorkout\((\d+)\)/);
      id = match ? Number(match[1]) : null;
      minEl = document.getElementById('in-hr-min-' + id);
      maxEl = document.getElementById('in-hr-max-' + id);
      avgEl = document.getElementById('in-hr-' + id);
    } else if (onclick.indexOf('saveSessionWorkout()') >= 0) {
      mode = 'session';
      minEl = document.getElementById('session-hr-min');
      maxEl = document.getElementById('session-hr-max');
      avgEl = document.getElementById('session-hr');
    } else {
      return;
    }

    var min = minEl ? minEl.value : '';
    var max = maxEl ? maxEl.value : '';
    var avg = avgEl ? avgEl.value : '';
    var error = validateRange(min, avg, max);
    if (error) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toast(error);
      return;
    }

    var beforeIds = getWorkoutsSafe().map(function (w) { return Number(w.id); });
    setTimeout(function () {
      var list = getWorkoutsSafe();
      var targetId = id;
      if (!targetId && (mode === 'workout' || mode === 'session')) {
        var added = list.filter(function (w) { return beforeIds.indexOf(Number(w.id)) < 0; });
        if (added.length) {
          added.sort(function (a,b) { return Number(b.id || 0) - Number(a.id || 0); });
          targetId = added[0].id;
        }
      }
      patchWorkout(targetId, min, max);
      renderRangeChart(true);
    }, 60);
  }

  function validDate(iso) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''));
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function exerciseKind(ex) {
    ex = ex || {};
    if (ex.kind === 'cardio' || ex.kind === 'strength') return ex.kind;
    return (Number(ex.distance) > 0 || Number(ex.time) > 0) ? 'cardio' : 'strength';
  }

  function workoutKinds(w) {
    var cardio = false, strength = false;
    (Array.isArray(w && w.exercises) ? w.exercises : []).forEach(function (ex) {
      var kind = exerciseKind(ex);
      if (kind === 'cardio') cardio = true;
      if (kind === 'strength') strength = true;
    });
    if (!cardio && !strength) {
      var type = String((w && w.type) || '').toLowerCase();
      if (/kondition|cardio|löp|running|jogg|cross\s*-?trainer|crosstrainer|ellipt|cyk|spinning|rodd/.test(type)) cardio = true;
      else if (/styrka|helkropp|överkropp|underkropp|bröst|rygg|axel|arm|biceps|triceps|ben|strength/.test(type)) strength = true;
    }
    return {cardio:cardio, strength:strength};
  }

  function fmtDateSafe(iso) {
    try { if (typeof window.fmtDate === 'function') return window.fmtDate(iso); } catch (e) {}
    if (!validDate(iso)) return '—';
    var p = iso.split('-');
    return p[2] + '/' + p[1];
  }

  function chartEntries() {
    var today = todayISO();
    return getWorkoutsSafe().filter(function (w) {
      if (!w || !validDate(w.date) || w.date > today || !(Number(w.hrAvg) > 0)) return false;
      var kinds = workoutKinds(w);
      return kinds.cardio || kinds.strength;
    }).sort(function (a,b) {
      return String(a.date).localeCompare(String(b.date)) || Number(a.id || 0) - Number(b.id || 0);
    }).slice(-50);
  }

  function avgDataset(label, data, color, pointStyle, range) {
    return {
      label:label,
      data:data,
      borderColor:color,
      backgroundColor:color,
      pointBackgroundColor:color,
      pointBorderColor:color,
      pointRadius:4,
      pointHoverRadius:6,
      pointStyle:pointStyle,
      borderWidth:2.5,
      tension:.28,
      fill:false,
      spanGaps:true,
      _hrRange:range,
      _mainPulse:true
    };
  }

  function bandDataset(label, data, fill, backgroundColor, group) {
    return {
      label:label,
      data:data,
      borderColor:'rgba(0,0,0,0)',
      backgroundColor:backgroundColor,
      pointRadius:0,
      pointHoverRadius:0,
      borderWidth:0,
      tension:.28,
      fill:fill,
      spanGaps:false,
      _pulseBand:true,
      _pulseGroup:group
    };
  }

  function renderRangeChart(force) {
    if (typeof window.Chart !== 'function') return;
    var canvas = document.getElementById('chart-hr-combined');
    if (!canvas) return;
    var entries = chartEntries();
    var signature = JSON.stringify(entries.map(function (w) {
      return [w.id,w.date,w.type,w.hrAvg,w.hrMin,w.hrMax,workoutKinds(w)];
    }));
    if (!force && signature === lastSignature && rangeChart) return;
    lastSignature = signature;

    var labels = entries.length ? entries.map(function (w) { return fmtDateSafe(w.date); }) : ['—'];
    function values(kind, prop) {
      return entries.map(function (w) {
        if (!workoutKinds(w)[kind]) return null;
        var n = numberOrNull(w[prop]);
        return n;
      });
    }
    function averages(kind) {
      return entries.map(function (w) { return workoutKinds(w)[kind] ? Number(w.hrAvg) : null; });
    }
    function ranges(kind) {
      return entries.map(function (w) {
        if (!workoutKinds(w)[kind]) return null;
        return {min:numberOrNull(w.hrMin), max:numberOrNull(w.hrMax)};
      });
    }

    var cardioMin = values('cardio','hrMin');
    var cardioMax = values('cardio','hrMax');
    var strengthMin = values('strength','hrMin');
    var strengthMax = values('strength','hrMax');

    var existing = window.Chart.getChart ? window.Chart.getChart(canvas) : null;
    if (existing) existing.destroy();
    if (rangeChart && rangeChart !== existing) {
      try { rangeChart.destroy(); } catch (e) {}
    }

    rangeChart = new Chart(canvas.getContext('2d'), {
      type:'line',
      data:{
        labels:labels,
        datasets:[
          bandDataset('Kondition min', cardioMin, false, 'rgba(239,68,68,.00)', 'cardio'),
          bandDataset('Kondition intervall', cardioMax, '-1', 'rgba(239,68,68,.13)', 'cardio'),
          avgDataset('Kondition', averages('cardio'), '#EF4444', 'circle', ranges('cardio')),
          bandDataset('Styrka min', strengthMin, false, 'rgba(34,211,238,.00)', 'strength'),
          bandDataset('Styrka intervall', strengthMax, '-1', 'rgba(34,211,238,.11)', 'strength'),
          avgDataset('Styrka', averages('strength'), '#22D3EE', 'rectRounded', ranges('strength'))
        ]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        interaction:{mode:'nearest',intersect:false},
        plugins:{
          legend:{
            display:true,
            labels:{
              color:'#8B949E',
              font:{family:'Inter',size:11},
              usePointStyle:true,
              boxWidth:9,
              filter:function (item, data) { return !!data.datasets[item.datasetIndex]._mainPulse; }
            },
            onClick:function (event, item, legend) {
              var chart = legend.chart;
              var main = item.datasetIndex;
              var bandStart = main === 2 ? 0 : 3;
              var nextVisible = !chart.isDatasetVisible(main);
              [bandStart,bandStart + 1,main].forEach(function (idx) {
                chart.setDatasetVisibility(idx, nextVisible);
              });
              chart.update();
            }
          },
          tooltip:{
            backgroundColor:'#161B22',
            titleColor:'#F0F6FC',
            bodyColor:'#C9D1DC',
            borderColor:'rgba(255,255,255,.08)',
            borderWidth:1,
            filter:function (ctx) { return !!ctx.dataset._mainPulse; },
            callbacks:{
              label:function (ctx) {
                var avg = ctx.parsed.y;
                var range = ctx.dataset._hrRange && ctx.dataset._hrRange[ctx.dataIndex];
                var suffix = range && range.min !== null && range.max !== null ? ' (' + range.min + '–' + range.max + ')' : '';
                return ctx.dataset.label + ': ' + avg + ' bpm' + suffix;
              }
            }
          }
        },
        scales:{
          x:{ticks:{color:'#8B949E',font:{family:'Inter',size:10},maxRotation:45,minRotation:0},grid:{color:'rgba(255,255,255,.05)'}},
          y:{ticks:{color:'#8B949E',font:{family:'Inter',size:11}},grid:{color:'rgba(255,255,255,.05)'},suggestedMin:40,suggestedMax:190}
        }
      }
    });

    var note = document.getElementById('hr-combined-note');
    if (note) {
      var cardioCount = entries.filter(function (w) { return workoutKinds(w).cardio; }).length;
      var strengthCount = entries.filter(function (w) { return workoutKinds(w).strength; }).length;
      note.innerHTML = entries.length
        ? 'Kondition: ' + cardioCount + ' pass · Styrka: ' + strengthCount + ' pass <span class="hr-band-note-v3">· Färgat band = min–max</span>'
        : 'Ingen registrerad puls ännu';
    }
  }

  function syncUi() {
    ensureWorkoutFields();
    ensureSessionFields();
    ensureInlineFields();
    syncWorkoutModalValues();
    syncSessionValues();
  }

  function install() {
    addStyles();
    syncUi();
    document.addEventListener('click', captureSave, true);
    setInterval(syncUi, 300);
    setInterval(function () { renderRangeChart(false); }, 700);
    setTimeout(function () { renderRangeChart(true); }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
