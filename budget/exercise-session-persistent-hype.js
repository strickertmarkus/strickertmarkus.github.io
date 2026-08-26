(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var overviewMode = false;
  var sessionToken = null;

  function getState() {
    try {
      return typeof sessionState !== 'undefined' ? sessionState : null;
    } catch (e) {
      return null;
    }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises) || state.exerciseIndex >= state.exercises.length) return null;
    return state.exercises[state.exerciseIndex];
  }

  function addStyles() {
    if (document.getElementById('exercise-persistent-hype-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-persistent-hype-style';
    style.textContent = `
      .session-view-toggle {
        min-height: 40px;
        padding: 9px 13px;
        border-radius: 10px;
        border: 1px solid rgba(251,146,60,.34);
        background: rgba(251,146,60,.10);
        color: #FDBA74;
        font: 800 11px/1 'Inter',sans-serif;
        letter-spacing: .25px;
        cursor: pointer;
        white-space: nowrap;
        transition: background .16s ease,border-color .16s ease,color .16s ease;
      }
      .session-view-toggle:hover {
        background: rgba(251,146,60,.18);
        border-color: rgba(251,146,60,.52);
      }
      #session-modal.session-overview-mode .session-view-toggle {
        background: rgba(34,211,238,.10);
        border-color: rgba(34,211,238,.30);
        color: #67E8F9;
      }

      /* Persistent hype keeps the focused full-width workout card between sets. */
      #session-modal.persistent-hype .session-grid {
        grid-template-columns: minmax(0,1fr) !important;
      }
      #session-modal.persistent-hype .session-grid > .session-card:nth-child(2) {
        display: none !important;
      }
      #session-modal.persistent-hype .session-main {
        width: 100% !important;
        min-width: 0 !important;
        min-height: calc(100% - 2px);
      }
      #session-modal.persistent-hype .session-log-section {
        display: none !important;
      }
      #session-modal.persistent-hype .hype-set-details,
      #session-modal.persistent-hype .hype-workout-progress {
        display: grid;
      }
      #session-modal.persistent-hype .hype-workout-progress {
        display: block;
      }

      /* Overview deliberately restores the original two-column, editable view. */
      #session-modal.session-overview-mode .session-grid {
        display: grid !important;
        grid-template-columns: 1.2fr 1fr !important;
      }
      #session-modal.session-overview-mode .session-grid > .session-card:nth-child(2) {
        display: block !important;
      }
      #session-modal.session-overview-mode .session-log-section {
        display: block !important;
      }
      #session-modal.session-overview-mode .hype-set-details,
      #session-modal.session-overview-mode .hype-workout-progress {
        display: none !important;
      }

      @media (max-width: 600px) {
        .session-view-toggle {
          min-height: 38px;
          padding: 8px 9px;
          font-size: 10px;
        }
        #session-modal.persistent-hype .session-grid {
          display: block !important;
          padding: 8px !important;
          overflow-y: auto !important;
        }
        #session-modal.persistent-hype .session-main {
          min-height: calc(100dvh - 76px) !important;
        }
        #session-modal.session-overview-mode .session-grid {
          grid-template-columns: minmax(0,1fr) !important;
          gap: 8px !important;
          overflow-y: auto !important;
        }
        #session-modal.session-overview-mode .session-grid > .session-card:nth-child(2) {
          display: block !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureToggleButton() {
    var existing = document.getElementById('session-view-toggle');
    if (existing) return existing;
    var top = document.querySelector('#session-modal .session-top');
    var stop = top && top.querySelector('.session-cta');
    if (!top || !stop) return null;

    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'session-view-toggle';
    button.className = 'session-view-toggle';
    button.addEventListener('click', function () {
      overviewMode = !overviewMode;
      applyViewState();
      if (typeof window.renderSessionMode === 'function') {
        window.renderSessionMode();
      }
    });
    stop.insertAdjacentElement('beforebegin', button);
    return button;
  }

  function resetForNewSession(state) {
    var token = state && state.passStartedAt ? String(state.passStartedAt) : null;
    if (token && token !== sessionToken) {
      sessionToken = token;
      overviewMode = false;
    } else if (!state) {
      sessionToken = null;
      overviewMode = false;
    }
  }

  function renderPersistentDetails(state) {
    var details = document.getElementById('hype-set-details');
    var ex = currentExercise(state);
    if (!details || !state || !ex || state.exerciseIndex >= state.exercises.length) return;

    var cells;
    if (ex.kind === 'cardio') {
      cells = [
        { label: 'Runda', value: String(state.currentSet || 1) },
        { label: 'Distans', value: ex.distance ? ex.distance + ' km' : '—' },
        { label: 'Tid', value: ex.time ? ex.time + ' min' : '—' }
      ];
    } else {
      cells = [
        { label: 'Set', value: (state.currentSet || 1) + ' / ' + (ex.plannedSets || 1) },
        { label: 'Reps', value: String(ex.reps || 0) },
        { label: 'Vikt', value: (ex.weight || 0) + ' kg' }
      ];
    }

    details.innerHTML = cells.map(function (cell) {
      return '<div class="hype-set-detail">' +
        '<div class="hype-set-detail-label">' + cell.label + '</div>' +
        '<div class="hype-set-detail-value">' + cell.value + '</div>' +
      '</div>';
    }).join('');
  }

  function applyViewState() {
    var modal = document.getElementById('session-modal');
    var state = getState();
    if (!modal) return;

    resetForNewSession(state);
    var active = !!state;
    var hype = active && !overviewMode;

    /* Force hype styling for the whole session. Existing timer code may toggle
       hype-mode by setRunning; this layer intentionally owns the final state. */
    modal.classList.toggle('persistent-hype', hype);
    modal.classList.toggle('hype-focus', hype);
    modal.classList.toggle('hype-mode', hype);
    modal.classList.toggle('session-overview-mode', active && overviewMode);

    var button = ensureToggleButton();
    if (button) {
      button.style.display = active ? '' : 'none';
      button.textContent = overviewMode ? 'Till Hype Mode' : 'Visa översikt';
      button.setAttribute('aria-pressed', overviewMode ? 'true' : 'false');
    }

    if (hype) renderPersistentDetails(state);

    /* When overview is open, rebuild the editable log from sessionState without
       changing the underlying data. */
    if (active && overviewMode && typeof window.renderSessionMode === 'function') {
      var log = document.getElementById('session-set-log');
      if (log && log.children.length === 0) {
        // The normal render wrapper will populate it on the current render pass.
      }
    }
  }

  function install() {
    addStyles();
    ensureToggleButton();

    var attempts = 0;
    function bindWhenReady() {
      attempts++;
      if (typeof window.renderSessionMode !== 'function' || typeof window.updateSessionTimers !== 'function') {
        if (attempts < 50) setTimeout(bindWhenReady, 100);
        return;
      }
      if (window.__persistentHypeInstalled) return;
      window.__persistentHypeInstalled = true;

      var previousRender = window.renderSessionMode;
      var previousTick = window.updateSessionTimers;
      var previousStop = window.stopSessionMode;

      window.renderSessionMode = function () {
        var result = previousRender.apply(this, arguments);
        ensureToggleButton();
        applyViewState();
        return result;
      };

      window.updateSessionTimers = function () {
        var result = previousTick.apply(this, arguments);
        applyViewState();
        return result;
      };

      if (typeof previousStop === 'function') {
        window.stopSessionMode = function () {
          var result = previousStop.apply(this, arguments);
          overviewMode = false;
          sessionToken = null;
          applyViewState();
          return result;
        };
      }

      applyViewState();
    }

    bindWhenReady();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
