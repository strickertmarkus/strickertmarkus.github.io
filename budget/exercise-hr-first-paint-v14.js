(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (window.__exerciseHrFirstPaintV14Installed) return;
  window.__exerciseHrFirstPaintV14Installed = true;

  var started = Date.now();
  var timer = null;

  function finalChart() {
    var canvas = document.getElementById('chart-hr-combined');
    if (!canvas || !window.Chart || typeof window.Chart.getChart !== 'function') return null;

    var chart = window.Chart.getChart(canvas);
    if (!chart || !chart.data || !Array.isArray(chart.data.datasets)) return null;

    /* exercise-heart-rate-range.js marks the final datasets with _mainPulse
       and _hrRange. The earlier points-8-9 chart has neither marker. */
    var hasFinalRangeDataset = chart.data.datasets.some(function (dataset) {
      return dataset && dataset._mainPulse === true && Array.isArray(dataset._hrRange);
    });
    if (!hasFinalRangeDataset) return null;

    var note = document.getElementById('hr-combined-note');
    if (note && note.querySelector && !note.querySelector('.hr-band-note-v3')) {
      /* With no pulse entries the note contains no band explanation. In that
         case the final dataset marker above is still sufficient. */
      var hasValues = chart.data.datasets.some(function (dataset) {
        return dataset && Array.isArray(dataset.data) && dataset.data.some(function (value) {
          return value !== null && typeof value !== 'undefined' && Number(value) > 0;
        });
      });
      if (hasValues) return null;
    }

    return chart;
  }

  function reveal(chart) {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    /* Do not expose an in-progress Chart.js animation. Force the exact final
       geometry once, then reveal on the following painted frame. */
    try { if (chart && typeof chart.stop === 'function') chart.stop(); } catch (_) {}
    try { if (chart && typeof chart.update === 'function') chart.update('none'); } catch (_) {}

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.remove('exercise-hr-booting-v14');
        document.documentElement.classList.add('exercise-hr-ready-v14');
      });
    });
  }

  function check() {
    var chart = finalChart();
    if (chart) {
      reveal(chart);
      return;
    }

    /* Safety fallback: never leave the graph hidden forever if a future module
       changes its internal marker. This is intentionally long enough that the
       current range module will normally finish well before it is reached. */
    if (Date.now() - started > 6000) {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      document.documentElement.classList.remove('exercise-hr-booting-v14');
      document.documentElement.classList.add('exercise-hr-ready-v14');
    }
  }

  timer = setInterval(check, 25);
  check();
})();
