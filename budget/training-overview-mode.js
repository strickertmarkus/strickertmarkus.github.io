(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__trainingOverviewModeInstalled) return;
  window.__trainingOverviewModeInstalled = true;

  var MODES = { observatory:true, compact:true };
  var styleIds = ['training-observatory-environment','training-observatory-composition'];
  var CONTROL_STYLE_ID = 'training-overview-mode-style';
  var CONTROL_STYLE_URL = 'training-overview-mode.css?v=20260915-main-cp2';
  var activeViewTransition = null;
  var fallbackAnimation = null;

  function resolveMode(value) {
    value = String(value || '').toLowerCase();
    return MODES[value] ? value : 'observatory';
  }

  function currentMode() {
    return resolveMode(document.documentElement.dataset.trainingOverview);
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function ensureControlStyles() {
    var existing = document.getElementById(CONTROL_STYLE_ID);
    if (existing) return existing;
    var link = document.createElement('link');
    link.id = CONTROL_STYLE_ID;
    link.rel = 'stylesheet';
    link.href = CONTROL_STYLE_URL;
    link.addEventListener('load', function () { link.dataset.loaded = 'true'; }, {once:true});
    document.head.appendChild(link);
    return link;
  }

  var controlStyle = ensureControlStyles();

  function compactIcon() {
    return '<span class="training-overview-option-icon training-overview-option-icon--compact" aria-hidden="true">'
      + '<svg viewBox="0 0 24 24"><path d="M12 3.1 20.9 12 12 20.9 3.1 12Z"/></svg></span>';
  }

  function observatoryIcon() {
    // Normalised from the cross-shaped Observatory stars already used in the scene SVG.
    return '<span class="training-overview-option-icon training-overview-option-icon--observatory" aria-hidden="true">'
      + '<svg viewBox="0 0 24 24"><path d="M12 3V21M3 12H21"/></svg></span>';
  }

  function optionMarkup(mode, label, shortLabel, icon) {
    return '<button class="training-overview-option" type="button" data-overview-mode="' + mode + '" aria-pressed="false" aria-label="' + label + '">'
      + icon
      + '<span class="training-overview-option-label-full">' + label + '</span>'
      + '<span class="training-overview-option-label-short">' + shortLabel + '</span>'
      + '</button>';
  }

  function createControl() {
    var existing = document.querySelector('[data-training-overview-switch]');
    if (existing) return existing;

    var header = document.getElementById('pulse-header') || document.querySelector('.app-header');
    if (!header || !header.parentNode) return null;

    var shell = document.createElement('div');
    shell.className = 'training-overview-switch-shell';
    shell.hidden = true;
    shell.dataset.trainingOverviewSwitch = 'true';
    shell.innerHTML = '<div class="training-overview-switch" role="group" aria-label="Översiktsläge">'
      + optionMarkup('compact', 'Compact', 'Compact', compactIcon())
      + optionMarkup('observatory', 'Pulse Observatory', 'Observatory', observatoryIcon())
      + '</div>';

    header.insertAdjacentElement('afterend', shell);

    shell.addEventListener('click', function (event) {
      var button = event.target.closest('[data-overview-mode]');
      if (!button || !shell.contains(button)) return;
      setModeWithTransition(button.dataset.overviewMode);
    });

    function reveal() { shell.hidden = false; }
    if (controlStyle.dataset.loaded === 'true' || controlStyle.sheet) reveal();
    else {
      controlStyle.addEventListener('load', reveal, {once:true});
      window.setTimeout(reveal, 1200);
    }
    return shell;
  }

  function updateControl(mode) {
    document.querySelectorAll('[data-training-overview-switch] [data-overview-mode]').forEach(function (button) {
      var selected = button.dataset.overviewMode === mode;
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      button.tabIndex = selected ? 0 : 0;
    });
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

  function sharedScrollCandidates() {
    var root = document.getElementById('pulse-home') || document.querySelector('.main-content');
    if (!root) return [];
    return Array.prototype.slice.call(root.querySelectorAll('.stats-row,#week-grid,.goals-grid,.charts-grid,#log-body,.section-hdr,[data-training-shared]')).filter(function (node) {
      return !node.closest('.observatory-only,.compact-only') && node.getClientRects().length;
    });
  }

  function captureScrollAnchor() {
    var header = document.getElementById('pulse-header') || document.querySelector('.app-header');
    var topEdge = header ? Math.max(0, header.getBoundingClientRect().bottom + 8) : 8;
    var candidates = sharedScrollCandidates();
    var best = null;
    var bestDistance = Infinity;

    candidates.forEach(function (node) {
      var rect = node.getBoundingClientRect();
      if (rect.bottom <= topEdge || rect.top >= window.innerHeight) return;
      var distance = Math.abs(rect.top - topEdge);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { node:node, top:rect.top, scrollY:window.scrollY };
      }
    });

    return best || { node:null, top:0, scrollY:window.scrollY };
  }

  function restoreScrollAnchor(anchor) {
    if (!anchor) return;
    if (anchor.node && anchor.node.isConnected && anchor.node.getClientRects().length) {
      var nextTop = anchor.node.getBoundingClientRect().top;
      var delta = nextTop - anchor.top;
      if (Math.abs(delta) > 0.5) window.scrollBy(0, delta);
      return;
    }
    if (Math.abs(window.scrollY - anchor.scrollY) > 0.5) window.scrollTo(0, anchor.scrollY);
  }

  function applyMode(value, options) {
    var mode = resolveMode(value);
    var previous = currentMode();
    document.documentElement.dataset.trainingOverview = mode;
    if (document.body) document.body.classList.toggle('pulse-observatory', mode === 'observatory');
    setAssetState(mode);
    setVisibility(mode);
    updateControl(mode);

    if (!options || !options.silent) {
      window.dispatchEvent(new CustomEvent('training-overview-change', {
        detail:{ mode:mode, previous:previous }
      }));
      // Charts remain the original chart instances/data owner. This only reapplies active presentation.
      if (typeof window.renderCharts === 'function') {
        requestAnimationFrame(function () { try { window.renderCharts(); } catch (_) {} });
      }
    }
    return mode;
  }

  function animateFallback(surface) {
    if (!surface || typeof surface.animate !== 'function') return;
    if (fallbackAnimation) {
      try { fallbackAnimation.cancel(); } catch (_) {}
    }
    fallbackAnimation = surface.animate([
      { opacity:.5, transform:'translateY(-3px) scale(.996)' },
      { opacity:1, transform:'translateY(0) scale(1)' }
    ], {
      duration:420,
      easing:'cubic-bezier(.16,1,.3,1)'
    });
    fallbackAnimation.finished.catch(function () {}).then(function () {
      fallbackAnimation = null;
    });
  }

  function setModeWithTransition(value, options) {
    var mode = resolveMode(value);
    var previous = currentMode();
    if (mode === previous) {
      updateControl(mode);
      return mode;
    }

    var anchor = captureScrollAnchor();
    var update = function () {
      applyMode(mode, options);
      restoreScrollAnchor(anchor);
    };

    if (prefersReducedMotion()) {
      update();
      return mode;
    }

    if (typeof document.startViewTransition === 'function') {
      if (activeViewTransition && typeof activeViewTransition.skipTransition === 'function') {
        try { activeViewTransition.skipTransition(); } catch (_) {}
      }
      activeViewTransition = document.startViewTransition(update);
      var thisTransition = activeViewTransition;
      thisTransition.finished.catch(function () {}).then(function () {
        if (activeViewTransition === thisTransition) activeViewTransition = null;
      });
      return mode;
    }

    update();
    animateFallback(document.getElementById('pulse-home') || document.querySelector('.main-content'));
    return mode;
  }

  function initialMode() {
    var requested = new URLSearchParams(window.location.search).get('overview');
    // Checkpoint 2 deliberately does not persist manual Compact selection; Observatory remains default.
    return requested === 'compact' ? 'compact' : 'observatory';
  }

  window.getTrainingOverviewMode = currentMode;
  window.setTrainingOverviewMode = function (mode) { return setModeWithTransition(mode); };

  function install() {
    createControl();
    applyMode(initialMode(), {silent:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
