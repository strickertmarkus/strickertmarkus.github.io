(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var cardioChart = null;
  var strengthChart = null;
  var lastSignature = '';

  function addStyles() {
    if (document.getElementById('exercise-points-8-9-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-points-8-9-style';
    style.textContent = `
      .stat-last #last-sub .last-workout-age,
      .stat-last #last-sub .last-workout-type {
        display: block;
        color: var(--text-sec);
      }
      .stat-last #last-sub .last-workout-type {
        margin-top: 3px;
        font-size: 11px;
        line-height: 1.25;
        font-weight: 600;
        text-transform: none;
        letter-spacing: 0;
      }

      #chart-hr-legacy-card { display: none !important; }
      .hr-split-card .chart-note {
        min-height: 16px;
        margin-top: -10px;
      }
      .hr-split-card .chart-area {
        height: 220px;
      }
      .hr-empty-note {
        color: var(--text-dim);
      }

      @media (max-width:600px) {
        .hr-split-card {
          padding: 18px !important;
          min-width: 0;
        }
        .hr-split-card .chart-area {
          height: 210px;
        }
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
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
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
    if (ex.kind === 'cardio' || ex.kind === 'strength') return ex.kind;
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

    if (!cardio && !strength) {
      var type = String((w && w.type) || '').toLowerCase();
      if (/kondition|cardio|löp|running|jogg|cross\s*-?trainer|crosstrainer|ellipt|cyk|spinning|rodd/.test(type)) {
        cardio = true;
      } else if (/styrka|helkropp|överkropp|underkropp|bröst|rygg|axel|arm|biceps|triceps|ben|strength/.test(type)) {
        strength = true;
      }
    }

    return { cardio: cardio, strength: strength };
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
    var list = performedWorkouts(wks).slice();
    list.sort(function (a, b) {
      var byDate = String(b.date).localeCompare(String(a.date));
      if (byDate) return byDate;
      return Number(b.id || 0) - Number(a.id || 0);
    });
    return list[0] || null;
  }

  function updateLatestWorkoutCard(wks) {
    var value = document.getElementById('last-d');
    var sub = document.getElementById('last-sub');
    if (!value || !sub) return;

    var latest = latestWorkout(wks);
    if (!latest) {
      if (value.textContent !== '—') value.textContent = '—';
      if (sub.innerHTML !== '') sub.innerHTML = '';
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

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function ensurePulseCards() {
    if (typeof window.Chart !== 'function') return false;

    var oldCanvas = document.getElementById('chart-hr');
    if (!oldCanvas) return false;
    var oldCard = oldCanvas.closest('.chart-card');
    var row = oldCard && oldCard.parentElement;
    if (!oldCard || !row) return false;

    oldCard.id = 'chart-hr-legacy-card';
    oldCard.setAttribute('aria-hidden', 'true');

    if (!document.getElementById('hr-card-cardio')) {
      var cardio = document.createElement('div');
      cardio.className = 'chart-card hr-split-card';
      cardio.id = 'hr-card-cardio';
      cardio.innerHTML =
        '<h3>Medelpuls – Kondition</h3>' +
        '<div class="chart-note" id="hr-cardio-note"></div>' +
        '<div class="chart-area"><canvas id="chart-hr-cardio"></canvas></div>';
      row.appendChild(cardio);
    }

    if (!document.getElementById('hr-card-strength')) {
      var strength = document.createElement('div');
      strength.className = 'chart-card hr-split-card';
      strength.id = 'hr-card-strength';
      strength.innerHTML =
        '<h3>Medelpuls – Styrka</h3>' +
        '<div class="chart-note" id="hr-strength-note"></div>' +
        '<div class="chart-area"><canvas id="chart-hr-strength"></canvas></div>';
      row.appendChild(strength);
    }

    return true;
  }

  function formatDate(iso) {
    try {
      if (typeof window.fmtDate === 'function') return window.fmtDate(iso);
    } catch (e) {}
    if (!validDate(iso)) return iso || '—';
    var p = iso.split('-');
    return p[2] + '/' + p[1];
  }

  function chartOptions(accent) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#8B949E',
            font: { family: 'Inter', size: 11 },
            usePointStyle: true,
            boxWidth: 9
          }
        },
        tooltip: {
          backgroundColor: '#161B22',
          titleColor: accent,
          bodyColor: '#C9D1DC',
          borderColor: 'rgba(255,255,255,.08)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: { color: '#8B949E', font: { family: 'Inter', size: 10 }, maxRotation: 45, minRotation: 0 },
          grid: { color: 'rgba(255,255,255,.05)' }
        },
        y: {
          ticks: { color: '#8B949E', font: { family: 'Inter', size: 11 } },
          grid: { color: 'rgba(255,255,255,.05)' },
          suggestedMin: 40,
          suggestedMax: 190
        }
      }
    };
  }

  function makeDataset(label, data, color, fillColor) {
    return {
      label: label,
      data: data,
      borderColor: color,
      backgroundColor: fillColor,
      pointBackgroundColor: color,
      pointRadius: 4,
      pointHoverRadius: 5,
      borderWidth: 2,
      tension: .3,
      fill: true,
      spanGaps: true
    };
  }

  function pulseData(wks, wantedKind) {
    return performedWorkouts(wks)
      .filter(function (w) {
        if (!(Number(w.hrAvg) > 0)) return false;
        var kinds = workoutKinds(w);
        return wantedKind === 'cardio' ? kinds.cardio : kinds.strength;
      })
      .sort(function (a, b) {
        var byDate = String(a.date).localeCompare(String(b.date));
        if (byDate) return byDate;
        return Number(a.id || 0) - Number(b.id || 0);
      })
      .slice(-40);
  }

  function updatePulseCharts(wks) {
    if (!ensurePulseCards()) return;

    var cardio = pulseData(wks, 'cardio');
    var strength = pulseData(wks, 'strength');
    var cardioCanvas = document.getElementById('chart-hr-cardio');
    var strengthCanvas = document.getElementById('chart-hr-strength');
    if (!cardioCanvas || !strengthCanvas) return;

    if (cardioChart) cardioChart.destroy();
    if (strengthChart) strengthChart.destroy();

    var cardioLabels = cardio.length ? cardio.map(function (w) { return formatDate(w.date); }) : ['—'];
    var cardioValues = cardio.length ? cardio.map(function (w) { return Number(w.hrAvg); }) : [];
    var strengthLabels = strength.length ? strength.map(function (w) { return formatDate(w.date); }) : ['—'];
    var strengthValues = strength.length ? strength.map(function (w) { return Number(w.hrAvg); }) : [];

    cardioChart = new Chart(cardioCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: cardioLabels,
        datasets: [makeDataset('Medelpuls (bpm)', cardioValues, '#22D3EE', 'rgba(34,211,238,.14)')]
      },
      options: chartOptions('#22D3EE')
    });

    strengthChart = new Chart(strengthCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: strengthLabels,
        datasets: [makeDataset('Medelpuls (bpm)', strengthValues, '#FB923C', 'rgba(251,146,60,.14)')]
      },
      options: chartOptions('#FB923C')
    });

    var cardioNote = document.getElementById('hr-cardio-note');
    var strengthNote = document.getElementById('hr-strength-note');
    if (cardioNote) {
      cardioNote.textContent = cardio.length ? cardio.length + ' pass med registrerad puls' : 'Ingen registrerad konditionspuls ännu';
      cardioNote.classList.toggle('hr-empty-note', !cardio.length);
    }
    if (strengthNote) {
      strengthNote.textContent = strength.length ? strength.length + ' pass med registrerad puls' : 'Ingen registrerad styrkepuls ännu';
      strengthNote.classList.toggle('hr-empty-note', !strength.length);
    }
  }

  function signatureFor(wks) {
    return JSON.stringify((wks || []).map(function (w) {
      return {
        id: w && w.id,
        date: w && w.date,
        type: w && w.type,
        hrAvg: w && w.hrAvg,
        exercises: Array.isArray(w && w.exercises) ? w.exercises.map(function (ex) {
          return { kind: exerciseKind(ex), name: ex && ex.name, distance: ex && ex.distance, time: ex && ex.time };
        }) : []
      };
    }));
  }

  function sync(force) {
    var wks = getWorkoutsSafe();
    updateLatestWorkoutCard(wks);

    var signature = signatureFor(wks);
    if (force || signature !== lastSignature || !document.getElementById('hr-card-cardio') || !document.getElementById('hr-card-strength')) {
      lastSignature = signature;
      updatePulseCharts(wks);
    }
  }

  function install() {
    addStyles();

    var attempts = 0;
    function ready() {
      attempts++;
      if (typeof window.getWorkouts !== 'function' || typeof window.Chart !== 'function' || !document.getElementById('last-d') || !document.getElementById('chart-hr')) {
        if (attempts < 100) setTimeout(ready, 100);
        return;
      }
      if (window.__exercisePoints89Installed) return;
      window.__exercisePoints89Installed = true;

      sync(true);
      setInterval(function () { sync(false); }, 1200);
      window.addEventListener('storage', function () { setTimeout(function () { sync(true); }, 0); });
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) sync(true);
      });
    }
    ready();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
