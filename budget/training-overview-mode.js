(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__trainingOverviewModeInstalled) return;
  window.__trainingOverviewModeInstalled = true;

  var MODES = { observatory:true, compact:true };
  var styleIds = ['training-observatory-environment','training-observatory-composition'];
  var CONTROL_STYLE_ID = 'training-overview-mode-style';
  var CONTROL_STYLE_URL = 'training-overview-mode.css?v=20260916-main-cp8-header-toggle-1';
  var activeAnimations = [];
  var switchToken = 0;

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
  var headerToggle = null;

  function createControl() {
    headerToggle = document.getElementById('training-overview-toggle');
    if (!headerToggle) return null;
    if (headerToggle.dataset.overviewBound === 'true') return headerToggle;
    headerToggle.dataset.overviewBound = 'true';
    headerToggle.addEventListener('click', function () {
      setModeWithTransition(currentMode() === 'compact' ? 'observatory' : 'compact');
    });
    function reveal() { headerToggle.hidden = false; }
    if (controlStyle.dataset.loaded === 'true' || controlStyle.sheet) reveal();
    else {
      controlStyle.addEventListener('load', reveal, {once:true});
      window.setTimeout(reveal, 1200);
    }
    return headerToggle;
  }

  function updateControl(mode) {
    var button = headerToggle || document.getElementById('training-overview-toggle');
    if (!button) return;
    var compact = mode === 'compact';
    button.setAttribute('aria-pressed', compact ? 'true' : 'false');
    button.setAttribute('aria-label', compact ? 'Compact vy aktiv. Byt till Pulse Observatory' : 'Aktivera Compact vy');
    button.title = compact ? 'Compact vy aktiv' : 'Compact vy';
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

  function renderChartsSoon() {
    if (typeof window.renderCharts !== 'function') return;
    requestAnimationFrame(function () {
      try { window.renderCharts(); } catch (_) {}
    });
  }

  function applyMode(value, options) {
    options = options || {};
    var mode = resolveMode(value);
    var previous = currentMode();
    document.documentElement.dataset.trainingOverview = mode;
    if (document.body) document.body.classList.toggle('pulse-observatory', mode === 'observatory');
    setAssetState(mode);
    setVisibility(mode);
    updateControl(mode);

    if (!options.silent) {
      window.dispatchEvent(new CustomEvent('training-overview-change', {
        detail:{ mode:mode, previous:previous }
      }));
      if (!options.deferCharts) renderChartsSoon();
    }
    return mode;
  }

  function cancelAnimations() {
    activeAnimations.forEach(function (animation) {
      try { animation.cancel(); } catch (_) {}
    });
    activeAnimations = [];
  }

  function visibleContent(root) {
    if (!root) return [];
    var viewportTop = -80;
    var viewportBottom = window.innerHeight + 120;
    return Array.prototype.slice.call(root.children).filter(function (node) {
      if (node.hidden || !node.getClientRects().length) return false;
      var rect = node.getBoundingClientRect();
      return rect.bottom > viewportTop && rect.top < viewportBottom;
    });
  }

  function animateNodes(nodes, keyframes, options) {
    if (!nodes.length || typeof nodes[0].animate !== 'function') return Promise.resolve();
    var animations = nodes.map(function (node) { return node.animate(keyframes, options); });
    activeAnimations = animations;
    return Promise.all(animations.map(function (animation) {
      return animation.finished.catch(function () {});
    }));
  }

  function commitAtSameScroll(mode, options) {
    var x = window.scrollX;
    var y = window.scrollY;
    var html = document.documentElement;
    var previousBehavior = html.style.scrollBehavior;
    var previousAnchor = html.style.overflowAnchor;

    html.style.scrollBehavior = 'auto';
    html.style.overflowAnchor = 'none';
    applyMode(mode, options);
    window.scrollTo(x, y);

    requestAnimationFrame(function () {
      window.scrollTo(x, y);
      requestAnimationFrame(function () {
        html.style.scrollBehavior = previousBehavior;
        html.style.overflowAnchor = previousAnchor;
      });
    });
  }

  function setModeWithTransition(value) {
    var mode = resolveMode(value);
    if (mode === currentMode()) {
      updateControl(mode);
      return mode;
    }

    var token = ++switchToken;
    var root = document.getElementById('pulse-home') || document.querySelector('.main-content');
    cancelAnimations();

    if (prefersReducedMotion() || !root || typeof Element.prototype.animate !== 'function') {
      commitAtSameScroll(mode);
      return mode;
    }

    var outgoing = visibleContent(root);
    animateNodes(outgoing, [
      {opacity:1, transform:'translate3d(0,0,0)'},
      {opacity:.58, transform:'translate3d(0,2px,0)'}
    ], {duration:90, easing:'ease-out', fill:'both'}).then(function () {
      if (token !== switchToken) return;
      cancelAnimations();
      commitAtSameScroll(mode, {deferCharts:true});

      requestAnimationFrame(function () {
        if (token !== switchToken) return;
        var incoming = visibleContent(root);
        animateNodes(incoming, [
          {opacity:.52, transform:'translate3d(0,-3px,0)'},
          {opacity:1, transform:'translate3d(0,0,0)'}
        ], {duration:230, easing:'cubic-bezier(.22,1,.36,1)', fill:'both'}).then(function () {
          if (token !== switchToken) return;
          cancelAnimations();
          renderChartsSoon();
        });
      });
    });

    return mode;
  }

  function initialMode() {
    var requested = new URLSearchParams(window.location.search).get('overview');
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
