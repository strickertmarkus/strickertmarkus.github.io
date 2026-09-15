/* Checkpoint 6 — one canonical weekly plan with a reversible Observatory orbit presentation. */
(function () {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let weekOrbitProgress = 0;
  let weekOrbitLayout = null;
  let weekOrbitRaf = 0;
  let weekOrbitAnimation = null;
  let weekOrbitDrag = null;
  let weekOrbitSuppressClickUntil = 0;
  let weekOrbitControls = null;

  function overviewMode() {
    const explicit = document.documentElement.dataset.trainingOverview;
    if (explicit) return explicit;
    return document.body && document.body.classList.contains('pulse-observatory') ? 'observatory' : 'compact';
  }

  function orbitAvailable() { return overviewMode() === 'observatory'; }
  function clamp01(value) { return Math.max(0, Math.min(1, value)); }
  function mix(from, to, progress) { return from + (to - from) * progress; }
  function easeOutCubic(value) { return 1 - Math.pow(1 - value, 3); }

  function ensureOrbitStructure(grid) {
    const existing = document.querySelector('[data-week-orbit-shell]');
    if (existing) {
      return {
        shell: existing,
        toggle: document.querySelector('[data-week-orbit-toggle]'),
        label: document.querySelector('[data-week-orbit-label]')
      };
    }
    const section = grid.closest('.observatory-week');
    if (!section) return null;

    const control = document.createElement('div');
    control.className = 'week-orbit-control observatory-only';
    control.innerHTML = '<button type="button" class="week-orbit-toggle" data-week-orbit-toggle aria-expanded="false" aria-label="Expandera veckoplanen till orbitvy">'
      + '<span class="week-orbit-grip" aria-hidden="true"><i></i><i></i><i></i></span>'
      + '<svg class="week-orbit-toggle-symbol" viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false"><circle cx="14" cy="14" r="9.5"/><path d="M14 2.8C14.8 8.1 18 11.2 23.2 12C18 12.8 14.8 15.9 14 21.2C13.2 15.9 10 12.8 4.8 12C10 11.2 13.2 8.1 14 2.8Z"/></svg>'
      + '<span data-week-orbit-label>Orbitvy</span>'
      + '<svg class="week-orbit-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 12.5 10 7.5l5 5"/></svg>'
      + '</button>';

    const shell = document.createElement('div');
    shell.className = 'week-orbit-shell';
    shell.dataset.weekOrbitShell = '';
    shell.innerHTML = '<svg class="week-orbit-geometry observatory-only" viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false">'
      + '<circle class="week-orbit-ring week-orbit-ring-outer" cx="50" cy="50" r="44"/>'
      + '<circle class="week-orbit-ring week-orbit-ring-inner" cx="50" cy="50" r="35"/>'
      + '<path class="week-orbit-axis" d="M50 3v8M50 89v8M3 50h8M89 50h8"/>'
      + '<path class="week-orbit-trace" d="M18 72C29 89 60 96 82 74"/>'
      + '<path class="week-orbit-trace week-orbit-trace-secondary" d="M18 28C30 10 62 5 83 27"/>'
      + '<g class="week-orbit-stars"><circle cx="22" cy="26" r=".8"/><circle cx="77" cy="67" r=".65"/><path d="M76 20v5M73.5 22.5h5"/><path d="M26 77v4M24 79h4"/></g>'
      + '</svg>';

    section.insertBefore(control, grid);
    section.insertBefore(shell, grid);
    shell.appendChild(grid);
    return { shell, toggle: control.querySelector('[data-week-orbit-toggle]'), label: control.querySelector('[data-week-orbit-label]') };
  }

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
    const shell = weekOrbitControls && weekOrbitControls.shell;
    if (!grid || !shell) return null;
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
    weekOrbitLayout = { grid, shell, days, bases, collapsedHeight };
    grid.classList.add('week-orbit-layout');
    grid.style.height = collapsedHeight + 'px';
    return weekOrbitLayout;
  }

  function updateOrbitControl() {
    if (!weekOrbitControls || !weekOrbitControls.toggle) return;
    const destination = weekOrbitAnimation ? weekOrbitAnimation.to : weekOrbitProgress;
    const expanded = destination >= .5;
    weekOrbitControls.toggle.setAttribute('aria-expanded', String(expanded));
    weekOrbitControls.toggle.setAttribute('aria-label', expanded ? 'Fäll ihop veckoplanens orbitvy' : 'Expandera veckoplanen till orbitvy');
    weekOrbitControls.toggle.dataset.orbitExpanded = String(expanded);
    if (weekOrbitControls.label) weekOrbitControls.label.textContent = expanded ? 'Stäng orbit' : 'Orbitvy';
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
      section.dataset.weekOrbitState = weekOrbitDrag ? 'dragging' : weekOrbitAnimation ? 'settling' : progress >= .999 ? 'expanded' : progress <= .001 ? 'collapsed' : 'transitioning';
    }
    updateOrbitControl();
  }

  function requestOrbitFrame() {
    if (!weekOrbitRaf) weekOrbitRaf = requestAnimationFrame(orbitFrame);
  }

  function orbitFrame(now) {
    weekOrbitRaf = 0;
    if (weekOrbitAnimation) {
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
      return;
    }
    renderOrbitProgress();
  }

  function settleOrbit(target, immediate) {
    target = target ? 1 : 0;
    if (target && !orbitAvailable()) return;
    if (target) captureOrbitLayout();
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
      duration: 300,
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
    if (!grid) return;
    weekOrbitControls = ensureOrbitStructure(grid);
    if (!weekOrbitControls || !weekOrbitControls.toggle) return;
    const toggle = weekOrbitControls.toggle;

    toggle.addEventListener('click', function () {
      if (Date.now() < weekOrbitSuppressClickUntil) return;
      settleOrbit(weekOrbitProgress < .5, false);
    });

    toggle.addEventListener('pointerdown', function (event) {
      const coarse = event.pointerType === 'touch' || event.pointerType === 'pen' || matchMedia('(pointer: coarse)').matches;
      if (!coarse || reduced.matches || !orbitAvailable()) return;
      if (!captureOrbitLayout()) return;
      weekOrbitAnimation = null;
      weekOrbitDrag = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startProgress: weekOrbitProgress,
        moved: false
      };
      toggle.setPointerCapture(event.pointerId);
      toggle.dataset.dragging = 'true';
      event.preventDefault();
    });

    toggle.addEventListener('pointermove', function (event) {
      if (!weekOrbitDrag || weekOrbitDrag.pointerId !== event.pointerId || !weekOrbitLayout) return;
      const travel = Math.max(150, weekOrbitLayout.collapsedHeight * 1.7);
      const delta = (weekOrbitDrag.startY - event.clientY) / travel;
      weekOrbitProgress = clamp01(weekOrbitDrag.startProgress + delta);
      weekOrbitDrag.moved = weekOrbitDrag.moved || Math.abs(event.clientY - weekOrbitDrag.startY) > 6;
      requestOrbitFrame();
      event.preventDefault();
    });

    function finishOrbitDrag(event) {
      if (!weekOrbitDrag || weekOrbitDrag.pointerId !== event.pointerId) return;
      if (toggle.hasPointerCapture(event.pointerId)) toggle.releasePointerCapture(event.pointerId);
      const moved = weekOrbitDrag.moved;
      weekOrbitDrag = null;
      toggle.removeAttribute('data-dragging');
      weekOrbitSuppressClickUntil = moved ? Date.now() + 450 : 0;
      settleOrbit(weekOrbitProgress >= .5, false);
      if (moved) event.preventDefault();
    }
    toggle.addEventListener('pointerup', finishOrbitDrag);
    toggle.addEventListener('pointercancel', finishOrbitDrag);

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
