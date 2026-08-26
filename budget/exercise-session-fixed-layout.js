(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function getState() {
    try {
      return typeof sessionState !== 'undefined' ? sessionState : null;
    } catch (e) {
      return null;
    }
  }

  function addStyles() {
    if (document.getElementById('exercise-session-cardio-spacing-style')) return;

    var style = document.createElement('style');
    style.id = 'exercise-session-cardio-spacing-style';
    style.textContent = `
      /* Restore the original flowing Hype layout. Only add a little breathing
         room before the initial Starta set control for cardio exercises. */
      #session-modal.persistent-hype:not(.session-overview-mode).session-current-cardio #session-controls:not(.decision-row) {
        margin-top: 18px !important;
      }

      @media (max-width: 600px) {
        #session-modal.persistent-hype:not(.session-overview-mode).session-current-cardio #session-controls:not(.decision-row) {
          margin-top: 20px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function syncExerciseKind() {
    var modal = document.getElementById('session-modal');
    var state = getState();
    if (!modal) return;

    var ex = state && Array.isArray(state.exercises) && state.exerciseIndex < state.exercises.length
      ? state.exercises[state.exerciseIndex]
      : null;

    modal.classList.toggle('session-current-cardio', !!(ex && ex.kind === 'cardio'));
  }

  function install() {
    addStyles();
    syncExerciseKind();

    var attempts = 0;
    function bind() {
      attempts++;
      if (typeof window.renderSessionMode !== 'function') {
        if (attempts < 50) setTimeout(bind, 100);
        return;
      }
      if (window.__exerciseCardioSpacingInstalled) return;
      window.__exerciseCardioSpacingInstalled = true;

      var previousRender = window.renderSessionMode;
      window.renderSessionMode = function () {
        var result = previousRender.apply(this, arguments);
        syncExerciseKind();
        return result;
      };

      syncExerciseKind();
    }

    bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
