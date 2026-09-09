(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  /* -----------------------------------------------------------------------
     Session performance mode v125

     This file is intentionally first in auth-gate's sequential exercise
     loader. Install the lightweight scheduler guard here so later legacy/
     dashboard pollers can sleep while the full-screen training session owns
     the screen. Live timers and Pulse Flow animation remain untouched.
     --------------------------------------------------------------------- */
  if (!window.__exercisePerformanceV125Installed) {
    window.__exercisePerformanceV125Installed = true;

    var perfNativeSetInterval = window.setInterval;
    var perfRoot = document.documentElement;
    var perfActive = false;
    var perfModalObserver = null;
    var perfBackgroundSources = [
      'exercise-points-8-9.js',
      'exercise-heart-rate-range.js',
      'exercise-builder-style-v5.js',
      'exercise-builder-row-tools-v3.js',
      'exercise-builder-between-preview-v7.js',
      'exercise-between-routing-v7.js',
      'exercise-log-layout-v50.js'
    ];

    function perfSessionModal() {
      return document.getElementById('session-modal');
    }

    function perfSessionActive() {
      var modal = perfSessionModal();
      return !!(modal && modal.classList.contains('show'));
    }

    function perfPretimerVisible() {
      var pre = document.getElementById('session-pre-timer');
      return !!(pre && pre.classList.contains('show'));
    }

    function perfSourceFromStack() {
      var stack = '';
      try { stack = String((new Error()).stack || ''); } catch (_) {}
      var known = perfBackgroundSources.concat([
        'exercise-flow-polish-v2.js',
        'exercise-session-theme-rest-v117.js',
        'exercise-between-sets.js',
        'exercise-session-ux-v20.js'
      ]);
      for (var i = 0; i < known.length; i++) {
        if (stack.indexOf(known[i]) >= 0) return known[i];
      }
      return '';
    }

    function perfIsBackgroundSource(source) {
      return perfBackgroundSources.indexOf(source) >= 0;
    }

    function perfShouldSkip(source, requestedDelay) {
      var active = perfSessionActive();

      /* Dashboard/builder/history sync has no visible job while the session
         overlay is open. Also avoid doing this work in a background tab. */
      if (perfIsBackgroundSource(source) && (active || document.hidden)) return true;

      /* The v46 controller owns transitions. The old 75 ms flow-polish loop is
         intentionally dormant once that controller exists. The slower loop is
         builder/rest-overview maintenance and can sleep during Pulse Flow. */
      if (source === 'exercise-flow-polish-v2.js') {
        if (requestedDelay <= 120 && window.__exerciseSessionControllerV46Installed) return true;
        if (requestedDelay > 120 && active) return true;
      }

      /* session-ux has an 80 ms sound/rest guard. With v46 installed it only
         needs to wake while the five-second pre-timer is actually visible.
         Its 250 ms current-set editor only matters in explicit Overview mode. */
      if (source === 'exercise-session-ux-v20.js') {
        if (requestedDelay <= 120 && window.__exerciseSessionControllerV46Installed && !perfPretimerVisible()) return true;
        if (requestedDelay >= 200) {
          var modal = perfSessionModal();
          var state = null;
          try { state = typeof sessionState !== 'undefined' ? sessionState : null; } catch (_) {}
          if (!modal || !modal.classList.contains('show') || !modal.classList.contains('session-overview-mode') || !(state && state.setRunning)) return true;
        }
      }

      return false;
    }

    /* Keep native interval semantics, but gate expensive callbacks. Two visual
       countdown loops are safely reduced from 10 Hz to 4 Hz: their displayed
       text/60-segment ring only changes at whole-second-ish boundaries, while
       the ECG animation remains CSS-smooth. */
    window.setInterval = function (handler, delay) {
      var source = perfSourceFromStack();
      var requestedDelay = Math.max(0,Number(delay) || 0);
      var actualDelay = requestedDelay;
      var extraArgs = Array.prototype.slice.call(arguments,2);

      if (source === 'exercise-flow-polish-v2.js' && requestedDelay > 0 && requestedDelay <= 120) actualDelay = 1000;
      if ((source === 'exercise-session-theme-rest-v117.js' || source === 'exercise-between-sets.js') && requestedDelay >= 80 && requestedDelay <= 120) actualDelay = 250;

      if (typeof handler !== 'function' || !source) {
        return perfNativeSetInterval.apply(window,[handler,actualDelay].concat(extraArgs));
      }

      var wrapped = function () {
        if (perfShouldSkip(source,requestedDelay)) return;
        return handler.apply(this,arguments);
      };
      return perfNativeSetInterval.apply(window,[wrapped,actualDelay].concat(extraArgs));
    };

    function perfInstallStyle(moveLast) {
      var style = document.getElementById('exercise-performance-v125-style');
      if (!style) {
        style = document.createElement('style');
        style.id = 'exercise-performance-v125-style';
        style.textContent = `
          /* The live session sits outside .app-wrap in exercise.html. Hiding
             the covered dashboard preserves its layout/state but lets Safari
             stop painting/compositing charts and cards underneath the modal. */
          html.exercise-session-performance-v125 body .app-wrap {
            visibility:hidden !important;
            pointer-events:none !important;
          }

          /* Pulse Flow's header already has an 88% opaque surface. Eight pixels
             retains the frosted depth while avoiding the much heavier 20 px
             live backdrop blur on iOS. */
          html.exercise-session-performance-v125 body #session-modal.pulse-flow-v58.show:not(.session-overview-mode) .session-top {
            backdrop-filter:blur(8px) !important;
            -webkit-backdrop-filter:blur(8px) !important;
          }

          /* Keep the marker pulse, but animate compositor-friendly scale and
             opacity. The existing static glow remains; box-shadow is no longer
             recalculated every animation frame. */
          @keyframes pfDotActivePulseV101 {
            0%,100% { scale:.965;opacity:.91; }
            50% { scale:1.075;opacity:1; }
          }
          @keyframes pfDotReadyPulseV98 {
            0%,100% { scale:.98;opacity:.86; }
            50% { scale:1.045;opacity:1; }
          }
          @keyframes pfDotLivePulseV98 {
            0%,100% { scale:.97;opacity:.92; }
            50% { scale:1.065;opacity:1; }
          }
        `;
        document.head.appendChild(style);
      } else if (moveLast && style.parentNode) {
        /* Marker styles load later in the chain. Moving this node to the end
           when a session opens makes these optimized keyframes authoritative. */
        style.parentNode.appendChild(style);
      }
    }

    function perfDispatch(name,active) {
      try {
        document.dispatchEvent(new CustomEvent(name,{detail:{active:active}}));
      } catch (_) {}
    }

    function perfSyncMode() {
      var active = perfSessionActive();
      if (active === perfActive) return;
      perfActive = active;
      window.__exerciseSessionPerformanceActive = active;
      perfRoot.classList.toggle('exercise-session-performance-v125',active);
      if (active) perfInstallStyle(true);
      perfDispatch(active ? 'exercise:performance-suspend' : 'exercise:performance-resume',active);
    }

    function perfBindModal() {
      var modal = perfSessionModal();
      if (!modal) return false;
      if (!perfModalObserver) {
        perfModalObserver = new MutationObserver(perfSyncMode);
        perfModalObserver.observe(modal,{attributes:true,attributeFilter:['class']});
      }
      perfSyncMode();
      return true;
    }

    perfInstallStyle(false);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded',perfBindModal,{once:true});
    } else {
      perfBindModal();
    }
    document.addEventListener('visibilitychange',function () {
      if (!document.hidden) perfSyncMode();
    });
  }

  var pulseChart = null;
  var lastSignature = '';

  function addStyles() {
    if (document.getElementById('exercise-points-8-9-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-points-8-9-style';
    style.textContent = `
      .stat-last #last-sub .last-workout-age,
      .stat-last #last-sub .last-workout-type {
        display:block;
        color:var(--text-sec);
      }
      .stat-last #last-sub .last-workout-type {
        margin-top:3px;
        font-size:11px;
        line-height:1.25;
        font-weight:600;
        text-transform:none;
        letter-spacing:0;
      }

      #chart-hr-legacy-card { display:none !important; }
      #hr-card-cardio,
      #hr-card-strength { display:none !important; }
      #hr-card-combined .chart-area { height:230px; }
      #hr-card-combined .chart-note {
        min-height:16px;
        margin-top:-10px;
      }
      .hr-empty-note { color:var(--text-dim); }

      @media (max-width:600px) {
        #hr-card-combined {
          padding:18px !important;
          min-width:0;
        }
        #hr-card-combined .chart-area { height:215px; }
      }
    `;
    document.head.appendChild(style);
  }

  function getWorkoutsSafe() {
    try {
      if (typeof window.getWorkouts === 'function') {
        var value = window.getWorkouts();
        return Array.isArray(value) ? value : [];
      }
    } catch (e) {}
    return [];
  }

  function validDate(iso) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''));
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function daysSinceLocal(iso) {
    if (!validDate(iso)) return null;
    var p = iso.split('-').map(Number);
    var then = new Date(p[0], p[1] - 1, p[2]);
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.floor((today.getTime() - then.getTime()) / 86400000));
  }

  function exerciseKind(ex) {
    ex = ex || {};
    if (['strength','cardio','stretch','meditation'].indexOf(ex.kind)!==-1) return ex.kind;
    return (Number(ex.distance) > 0 || Number(ex.time) > 0) ? 'cardio' : 'strength';
  }

  function workoutKinds(w) {
    var cardio = false;
    var strength = false;
    var exercises = Array.isArray(w && w.exercises) ? w.exercises : [];

    exercises.forEach(function (ex) {
      var kind = exerciseKind(ex);
      if (kind === 'cardio') cardio = true;
      if (kind === 'strength') strength = true;
    });

    if (!cardio && !strength && !(w.exercises||[]).some(function(ex){return ex.kind==='stretch'||ex.kind==='meditation';})) {
      var type = String((w && w.type) || '').toLowerCase();
      if (/kondition|cardio|löp|running|jogg|cross\s*-?trainer|crosstrainer|ellipt|cyk|spinning|rodd/.test(type)) {
        cardio = true;
      } else if (/styrka|helkropp|överkropp|underkropp|bröst|rygg|axel|arm|biceps|triceps|ben|strength/.test(type)) {
        strength = true;
      }
    }

    return {cardio:cardio,strength:strength};
  }

  function workoutSubtype(w) {
    var explicit = String((w && w.type) || '').trim();
    if (explicit && explicit.toLowerCase() !== 'övrigt') return explicit;
    var kinds = workoutKinds(w || {});
    if (kinds.cardio && kinds.strength) return 'Blandpass';
    if (kinds.cardio) return 'Kondition';
    if (kinds.strength) return 'Styrka';
    return explicit || 'Övrigt';
  }

  function performedWorkouts(wks) {
    var today = todayISO();
    return (wks || []).filter(function (w) {
      return w && validDate(w.date) && w.date <= today;
    });
  }

  function latestWorkout(wks) {
    var list = performedWorkouts(wks).slice().sort(function (a,b) {
      var byDate = String(b.date).localeCompare(String(a.date));
      return byDate || Number(b.id || 0) - Number(a.id || 0);
    });
    return list[0] || null;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function updateLatestWorkoutCard(wks) {
    var value = document.getElementById('last-d');
    var sub = document.getElementById('last-sub');
    if (!value || !sub) return;
    var latest = latestWorkout(wks);
    if (!latest) {
      value.textContent = '—';
      sub.innerHTML = '';
      return;
    }
    var days = daysSinceLocal(latest.date);
    var main = days === 0 ? 'Idag' : String(days);
    var age = days === 0 ? '' : '<span class="last-workout-age">dagar sedan</span>';
    var type = '<span class="last-workout-type">' + escapeHtml(workoutSubtype(latest)) + '</span>';
    if (value.textContent !== main) value.textContent = main;
    var html = age + type;
    if (sub.innerHTML !== html) sub.innerHTML = html;
  }

  function formatDate(iso) {
    try { if (typeof window.fmtDate === 'function') return window.fmtDate(iso); } catch (e) {}
    if (!validDate(iso)) return iso || '—';
    var p = iso.split('-');
    return p[2] + '/' + p[1];
  }

  function ensurePulseCard() {
    if (typeof window.Chart !== 'function') return false;
    var oldCanvas = document.getElementById('chart-hr');
    if (!oldCanvas) return false;
    var oldCard = oldCanvas.closest('.chart-card');
    var row = oldCard && oldCard.parentElement;
    if (!oldCard || !row) return false;

    oldCard.id = 'chart-hr-legacy-card';
    oldCard.setAttribute('aria-hidden','true');

    ['hr-card-cardio','hr-card-strength'].forEach(function (id) {
      var old = document.getElementById(id);
      if (old) old.remove();
    });

    if (!document.getElementById('hr-card-combined')) {
      var card = document.createElement('div');
      card.className = 'chart-card';
      card.id = 'hr-card-combined';
      card.innerHTML =
        '<h3>Medelpuls över tid</h3>' +
        '<div class="chart-note" id="hr-combined-note"></div>' +
        '<div class="chart-area"><canvas id="chart-hr-combined"></canvas></div>';
      row.appendChild(card);
    }
    return true;
  }

  function pulseEntries(wks) {
    return performedWorkouts(wks)
      .filter(function (w) {
        if (!(Number(w.hrAvg) > 0)) return false;
        var kinds = workoutKinds(w);
        return kinds.cardio || kinds.strength;
      })
      .sort(function (a,b) {
        var byDate = String(a.date).localeCompare(String(b.date));
        return byDate || Number(a.id || 0) - Number(b.id || 0);
      })
      .slice(-50);
  }

  function dataset(label, values, color, pointStyle) {
    return {
      label:label,
      data:values,
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
      spanGaps:true
    };
  }

  function updatePulseChart(wks) {
    if (!ensurePulseCard()) return;
    var entries = pulseEntries(wks);
    var canvas = document.getElementById('chart-hr-combined');
    if (!canvas) return;
    if (pulseChart) pulseChart.destroy();

    var labels = entries.length ? entries.map(function (w) { return formatDate(w.date); }) : ['—'];
    var cardio = entries.length ? entries.map(function (w) {
      return workoutKinds(w).cardio ? Number(w.hrAvg) : null;
    }) : [];
    var strength = entries.length ? entries.map(function (w) {
      return workoutKinds(w).strength ? Number(w.hrAvg) : null;
    }) : [];

    pulseChart = new Chart(canvas.getContext('2d'), {
      type:'line',
      data:{
        labels:labels,
        datasets:[
          dataset('Kondition', cardio, '#EF4444', 'circle'),
          dataset('Styrka', strength, '#22D3EE', 'rectRounded')
        ]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        interaction:{mode:'nearest',intersect:false},
        plugins:{
          legend:{
            display:true,
            labels:{color:'#8B949E',font:{family:'Inter',size:11},usePointStyle:true,boxWidth:9}
          },
          tooltip:{
            backgroundColor:'#161B22',
            titleColor:'#F0F6FC',
            bodyColor:'#C9D1DC',
            borderColor:'rgba(255,255,255,.08)',
            borderWidth:1
          }
        },
        scales:{
          x:{ticks:{color:'#8B949E',font:{family:'Inter',size:10},maxRotation:45,minRotation:0},grid:{color:'rgba(255,255,255,.05)'}},
          y:{ticks:{color:'#8B949E',font:{family:'Inter',size:11}},grid:{color:'rgba(255,255,255,.05)'},suggestedMin:40,suggestedMax:190}
        }
      }
    });

    var cardioCount = entries.filter(function (w) { return workoutKinds(w).cardio; }).length;
    var strengthCount = entries.filter(function (w) { return workoutKinds(w).strength; }).length;
    var note = document.getElementById('hr-combined-note');
    if (note) {
      note.textContent = entries.length
        ? 'Kondition: ' + cardioCount + ' pass · Styrka: ' + strengthCount + ' pass'
        : 'Ingen registrerad puls ännu';
      note.classList.toggle('hr-empty-note', !entries.length);
    }
  }

  function signatureFor(wks) {
    return JSON.stringify((wks || []).map(function (w) {
      return {
        id:w && w.id,
        date:w && w.date,
        type:w && w.type,
        hrAvg:w && w.hrAvg,
        exercises:Array.isArray(w && w.exercises) ? w.exercises.map(function (ex) {
          return {kind:exerciseKind(ex),name:ex && ex.name,distance:ex && ex.distance,time:ex && ex.time};
        }) : []
      };
    }));
  }

  function sync(force) {
    var wks = getWorkoutsSafe();
    updateLatestWorkoutCard(wks);
    var signature = signatureFor(wks);
    if (force || signature !== lastSignature || !document.getElementById('hr-card-combined')) {
      lastSignature = signature;
      updatePulseChart(wks);
    }
  }

  function install() {
    addStyles();
    var attempts = 0;
    function ready() {
      attempts++;
      if (typeof window.getWorkouts !== 'function' || typeof window.Chart !== 'function' || !document.getElementById('last-d') || !document.getElementById('chart-hr')) {
        if (attempts < 100) setTimeout(ready,100);
        return;
      }
      if (window.__exercisePoints89Installed) return;
      window.__exercisePoints89Installed = true;
      sync(true);
      setInterval(function () { sync(false); },1200);
      window.addEventListener('storage', function () { setTimeout(function () { sync(true); },0); });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) sync(true); });
      document.addEventListener('exercise:performance-resume', function () { sync(true); });
    }
    ready();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
