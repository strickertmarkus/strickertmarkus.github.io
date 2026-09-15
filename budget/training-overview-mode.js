(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__trainingOverviewModeInstalled) return;
  window.__trainingOverviewModeInstalled = true;

  var MODES = { observatory:true, compact:true };
  var styleIds = ['training-observatory-environment','training-observatory-composition'];

  function resolveMode(value) {
    value = String(value || '').toLowerCase();
    return MODES[value] ? value : 'observatory';
  }

  function currentMode() {
    return resolveMode(document.documentElement.dataset.trainingOverview);
  }

  function setAssetState(mode) {
    var enabled = mode === 'observatory';
    styleIds.forEach(function (id) {
      var link = document.getElementById(id);
      if (link) link.disabled = !enabled;
    });
  }

  function setVisibility(mode) {
    document.querySelectorAll('.observatory-only').forEach(function (node) {
      node.hidden = mode !== 'observatory';
    });
    document.querySelectorAll('.compact-only').forEach(function (node) {
      node.hidden = mode !== 'compact';
    });
  }

  function applyMode(value, options) {
    var mode = resolveMode(value);
    var previous = currentMode();
    document.documentElement.dataset.trainingOverview = mode;
    if (document.body) document.body.classList.toggle('pulse-observatory', mode === 'observatory');
    setAssetState(mode);
    setVisibility(mode);

    if (!options || !options.silent) {
      window.dispatchEvent(new CustomEvent('training-overview-change', {
        detail:{ mode:mode, previous:previous }
      }));
      // Charts are still the original charts. Re-rendering only re-applies the active presentation
      // palette; it does not create another data owner.
      if (typeof window.renderCharts === 'function') {
        requestAnimationFrame(function () { try { window.renderCharts(); } catch (_) {} });
      }
    }
    return mode;
  }

  function initialMode() {
    var requested = new URLSearchParams(window.location.search).get('overview');
    return requested === 'compact' ? 'compact' : 'observatory';
  }

  window.getTrainingOverviewMode = currentMode;
  window.setTrainingOverviewMode = function (mode) { return applyMode(mode); };

  function install() { applyMode(initialMode(), {silent:true}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
