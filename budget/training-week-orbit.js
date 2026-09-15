/* Checkpoint 6 — one canonical weekly plan with a reversible click-expanded Observatory orbit. */
(function () {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let weekOrbitProgress = 0;
  let weekOrbitLayout = null;
  let weekOrbitRaf = 0;
  let weekOrbitAnimation = null;
  let weekOrbitShell = null;
  let weekOrbitToggle = null;

  function overviewMode() {
    const explicit = document.documentElement.dataset.trainingOverview;
    if (explicit) return explicit;
    return document.body && document.body.classList.contains('pulse-observatory') ? 'observatory' : 'compact';
  }

  function orbitAvailable() { return overviewMode() === 'observatory'; }
  function clamp01(value) { return Math.max(0, Math.min(1, value)); }
  function mix(from, to, progress) { return from + (to - from) * progress; }
  function easeOutCubic(value) { return 1 - Math.pow(1 - value, 3); }

  function clearOrbitInlineStyles(layout) {
    if (!layout) return;
    layout.days.forEach(day => {
      day.style.removeProperty('--week-orbit-x');
      day.style.removeProperty('--week-orbit-y');
      day.style.removeProperty('--week-orbit-width');
      day.style.removeProperty('--week-orbit-height');
      day.style.removeProperty('--week-orbit-radius');
      day.style.removeProperty('--week-orbit-node-progress');
    });
    layout.grid.style.removeProperty('height');
    layout.grid.style.removeProperty('--week-orbit-progress');
    layout.shell.style.removeProperty('--week-orbit-progress');
    layout.shell.style.removeProperty('--week-orbit-diameter');
    layout.shell.style.removeProperty('--week-orbit-center-y');
    layout.grid.classList.remove('week-orbit-layout');
  }

  function deactivateOrbitLayout() {
    clearOrbitInlineStyles(weekOrbitLayout);
    weekOrbitLayout = null;
  }

  function captureOrbitLayout() {
    const grid = document.getElementById('week-grid');
    if (!grid || !weekOrbitShell) return null;
    const days = Array.from(grid.querySelectorAll('.week-day'));
    if (days.length !== 7) return null;

    if (weekOrbitLayout && weekOrbitLayout.days.length === days.length && weekOrbitLayout.days.every((day, index) => day === days[index])) {
      return weekOrbitLayout;
    }

    deactivateOrbitLayout();
    const gridRect = grid.getBoundingClientRect();
    const bases = days.map(day => {
      const rect = day.getBoundingClientRect();
      return {
        x: rect.left - gridRect.left + rect.width / 2,
        y: rect.top - gridRect.top + rect.height / 2,
        width: rect.width,
        height: rect.height
      };
    });
    const collapsedHeight = Math.max(gridRect.height, Math.max.apply(null, bases.map(base => base.y + base.height / 2)));
    weekOrbitLayout = { grid, shell: weekOrbitShell, days, bases, collapsedHeight };
    grid.classList.add('week-orbit-layout');
    grid.style.height = collapsedHeight + 'px';
    return weekOrbitLayout;
  }

  function updateOrbitControl() {
    if (!weekOrbitToggle) return;
    const destination = weekOrbitAnimation ? weekOrbitAnimation.to : weekOrbitProgress;
    const expanded = destination >= .5;
    weekOrbitToggle.setAttribute('aria-expanded', String(expanded));
    weekOrbitToggle.setAttribute('aria-label', expanded ? 'Fäll ihop veckoplanens orbitvy' : 'Expandera veckoplanen till orbitvy');
  }

  function renderOrbitProgress() {
    if (!weekOrbitLayout && weekOrbitProgress > 0) captureOrbitLayout();
    const layout = weekOrbitLayout;
    if (!layout) {
      updateOrbitControl();
      return;
    }

    const progress = clamp01(weekOrbitProgress);
    const gridRect = layout.grid.getBoundingClientRect();
    const width = Math.max(1, gridRect.width || layout.shell.clientWidth || 1);
    const expandedHeight = Math.min(430, Math.max(286, width * .92));
    const nodeSize = width < 340 ? 48 : width < 430 ? 52 : 58;
    const radius = Math.min(width * .39, expandedHeight * .39);
    const centerX = width / 2;
    const centerY = expandedHeight / 2;

    layout.grid.style.height = mix(layout.collapsedHeight, expandedHeight, progress) + 'px';
    layout.grid.style.setProperty('--week-orbit-progress', progress.toFixed(4));
    layout.shell.style.setProperty('--week-orbit-progress', progress.toFixed(4));
    layout.shell.style.setProperty('--week-orbit-diameter', (radius * 2) + 'px');
    layout.shell.style.setProperty('--week-orbit-center-y', centerY + 'px');

    layout.days.forEach((day, index) => {
      const angle = (-90 + index * 360 / 7) * Math.PI / 180;
      const targetX = centerX + radius * Math.cos(angle);
      const targetY = centerY + radius * Math.sin(angle);
      const base = layout.bases[index];
      day.style.setProperty('--week-orbit-x', mix(base.x, targetX, progress) + 'px');
      day.style.setProperty('--week-orbit-y', mix(base.y, targetY, progress) + 'px');
      day.style.setProperty('--week-orbit-width', mix(base.width, nodeSize, progress) + 'px');
      day.style.setProperty('--week-orbit-height', mix(base.height, nodeSize, progress) + 'px');
      day.style.setProperty('--week-orbit-radius', (progress * 50) + '%');
      day.style.setProperty('--week-orbit-node-progress', progress.toFixed(4));
    });

    const section = layout.grid.closest('.observatory-week');
    if (section) {
      section.dataset.weekOrbitState = weekOrbitAnimation ? 'settling' : progress >= .999 ? 'expanded' : progress <= .001 ? 'collapsed' : 'transitioning';
    }
    updateOrbitControl();
  }

  function requestOrbitFrame() {
    if (!weekOrbitRaf) weekOrbitRaf = requestAnimationFrame(orbitFrame);
  }

  function orbitFrame(now) {
    weekOrbitRaf = 0;
    if (!weekOrbitAnimation) {
      renderOrbitProgress();
      return;
    }
    if (!weekOrbitAnimation.startedAt) weekOrbitAnimation.startedAt = now;
    const elapsed = now - weekOrbitAnimation.startedAt;
    const raw = Math.min(1, elapsed / weekOrbitAnimation.duration);
    weekOrbitProgress = mix(weekOrbitAnimation.from, weekOrbitAnimation.to, easeOutCubic(raw));
    renderOrbitProgress();
    if (raw < 1) {
      requestOrbitFrame();
      return;
    }
    const target = weekOrbitAnimation.to;
    weekOrbitAnimation = null;
    weekOrbitProgress = target;
    renderOrbitProgress();
    if (target === 0) deactivateOrbitLayout();
  }

  function settleOrbit(target, immediate) {
    target = target ? 1 : 0;
    if (target && !orbitAvailable()) return;
    if (target && !captureOrbitLayout()) return;
    weekOrbitAnimation = null;
    if (immediate || reduced.matches) {
      weekOrbitProgress = target;
      renderOrbitProgress();
      if (!target) deactivateOrbitLayout();
      return;
    }
    weekOrbitAnimation = {
      from: weekOrbitProgress,
      to: target,
      duration: 320,
      startedAt: 0
    };
    requestOrbitFrame();
  }

  function recaptureOrbitAfterLayoutChange() {
    const progress = weekOrbitProgress;
    if (!weekOrbitLayout && progress <= 0) return;
    if (weekOrbitLayout) {
      clearOrbitInlineStyles(weekOrbitLayout);
      weekOrbitLayout = null;
    }
    if (progress > 0 && orbitAvailable()) {
      captureOrbitLayout();
      weekOrbitProgress = progress;
      renderOrbitProgress();
    }
  }

  function install() {
    const grid = document.getElementById('week-grid');
    weekOrbitShell = document.querySelector('[data-week-orbit-shell]');
    weekOrbitToggle = document.querySelector('[data-week-orbit-toggle]');
    if (!grid || !weekOrbitShell || !weekOrbitToggle) return;

    weekOrbitToggle.addEventListener('click', function () {
      settleOrbit(weekOrbitProgress < .5, false);
    });

    new MutationObserver(function () {
      if (weekOrbitProgress > 0) recaptureOrbitAfterLayoutChange();
    }).observe(grid, { childList: true });

    window.addEventListener('resize', function () {
      if (weekOrbitProgress > 0 && orbitAvailable()) recaptureOrbitAfterLayoutChange();
    }, { passive: true });

    window.addEventListener('training-overview-change', function () {
      if (!orbitAvailable() && weekOrbitProgress > 0) settleOrbit(0, true);
    });

    updateOrbitControl();
  }

  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
