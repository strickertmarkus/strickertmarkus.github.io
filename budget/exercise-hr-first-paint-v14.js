(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (window.__exerciseHrFirstPaintV14Installed) return;
  window.__exerciseHrFirstPaintV14Installed = true;

  var started = Date.now();
  var timer = null;

  function chartFor(id) {
    var canvas = document.getElementById(id);
    if (!canvas || !window.Chart || typeof window.Chart.getChart !== 'function') return null;
    return window.Chart.getChart(canvas) || null;
  }

  function finalHrChart() {
    var chart = chartFor('chart-hr-combined');
    if (!chart || !chart.data || !Array.isArray(chart.data.datasets)) return null;

    /* exercise-heart-rate-range.js marks the final datasets with _mainPulse
       and _hrRange. The earlier points-8-9 chart has neither marker. */
    var hasFinalRangeDataset = chart.data.datasets.some(function (dataset) {
      return dataset && dataset._mainPulse === true && Array.isArray(dataset._hrRange);
    });
    if (!hasFinalRangeDataset) return null;

    var note = document.getElementById('hr-combined-note');
    if (note && note.querySelector && !note.querySelector('.hr-band-note-v3')) {
      var hasValues = chart.data.datasets.some(function (dataset) {
        return dataset && Array.isArray(dataset.data) && dataset.data.some(function (value) {
          return value !== null && typeof value !== 'undefined' && Number(value) > 0;
        });
      });
      if (hasValues) return null;
    }

    return chart;
  }

  function allChartsReady() {
    var sessions = chartFor('chart-sessions');
    var vo2 = chartFor('chart-bw');
    var hr = finalHrChart();
    if (!sessions || !vo2 || !hr) return null;
    return [sessions, vo2, hr];
  }

  function revealTogether(charts) {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    /* Put every final chart at its animation start state while still hidden. */
    charts.forEach(function (chart) {
      try { if (typeof chart.stop === 'function') chart.stop(); } catch (_) {}
      try { if (typeof chart.reset === 'function') chart.reset(); } catch (_) {}
    });

    requestAnimationFrame(function () {
      /* All canvases become visible in one frame. */
      document.documentElement.classList.remove('exercise-hr-booting-v14');
      document.documentElement.classList.add('exercise-hr-ready-v14');

      /* Start the native Chart.js entrance animation for all three together. */
      charts.forEach(function (chart) {
        try { if (typeof chart.update === 'function') chart.update(); } catch (_) {}
      });
    });
  }

  function fallbackReveal() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    document.documentElement.classList.remove('exercise-hr-booting-v14');
    document.documentElement.classList.add('exercise-hr-ready-v14');
  }

  function check() {
    var charts = allChartsReady();
    if (charts) {
      revealTogether(charts);
      return;
    }

    /* Safety fallback only; normal startup should now complete far earlier. */
    if (Date.now() - started > 2500) fallbackReveal();
  }

  timer = setInterval(check, 16);
  check();
})();