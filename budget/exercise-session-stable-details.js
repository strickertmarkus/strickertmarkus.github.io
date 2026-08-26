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

  function getExercise(state) {
    if (!state || !Array.isArray(state.exercises) || state.exerciseIndex >= state.exercises.length) return null;
    return state.exercises[state.exerciseIndex];
  }

  function addStyles() {
    if (document.getElementById('exercise-stable-details-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-stable-details-style';
    style.textContent = `
      /* The older detail row is render-wrapper driven. Keep it out of layout and
         use one permanently mounted row instead to prevent mobile pop-in. */
      #session-modal #hype-set-details {
        display: none !important;
      }

      #session-stable-details {
        display: none;
        grid-template-columns: repeat(3,minmax(0,auto));
        justify-content: center;
        align-items: start;
        gap: 26px;
        margin: 8px 0 4px;
        text-align: center;
      }
      #session-modal.persistent-hype:not(.session-overview-mode) #session-stable-details {
        display: grid;
      }
      #session-stable-details .stable-detail-label {
        font-size: 10px;
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: .9px;
        text-transform: uppercase;
        color: #A8A29E;
      }
      #session-stable-details .stable-detail-value {
        margin-top: 4px;
        font-size: 29px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: -.8px;
        color: #FDBA74;
        font-variant-numeric: tabular-nums;
      }
      @media (max-width:600px) {
        #session-stable-details {
          width: 100%;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 10px;
          margin-top: 5px;
        }
        #session-stable-details .stable-detail-value {
          font-size: clamp(22px,7vw,29px);
          letter-spacing: -.5px;
        }
        #session-stable-details .stable-detail-label {
          font-size: 8px;
          letter-spacing: .55px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureRow() {
    var row = document.getElementById('session-stable-details');
    if (row) return row;

    var target = document.getElementById('session-current-target');
    if (!target || !target.parentNode) return null;

    row = document.createElement('div');
    row.id = 'session-stable-details';
    row.innerHTML =
      '<div><div class="stable-detail-label" data-detail-label="0"></div><div class="stable-detail-value" data-detail-value="0">—</div></div>' +
      '<div><div class="stable-detail-label" data-detail-label="1"></div><div class="stable-detail-value" data-detail-value="1">—</div></div>' +
      '<div><div class="stable-detail-label" data-detail-label="2"></div><div class="stable-detail-value" data-detail-value="2">—</div></div>';
    target.insertAdjacentElement('afterend', row);
    return row;
  }

  function updateRow() {
    var row = ensureRow();
    if (!row) return;

    var state = getState();
    var ex = getExercise(state);
    if (!state || !ex) {
      row.style.visibility = 'hidden';
      return;
    }

    row.style.visibility = '';
    var cells;
    if (ex.kind === 'cardio') {
      cells = [
        ['Runda', String(state.currentSet || 1)],
        ['Distans', ex.distance ? ex.distance + ' km' : '—'],
        ['Tid', ex.time ? ex.time + ' min' : '—']
      ];
    } else {
      cells = [
        ['Set', (state.currentSet || 1) + ' / ' + (ex.plannedSets || 1)],
        ['Reps', String(ex.reps || 0)],
        ['Vikt', (ex.weight || 0) + ' kg']
      ];
    }

    cells.forEach(function (cell, index) {
      var label = row.querySelector('[data-detail-label="' + index + '"]');
      var value = row.querySelector('[data-detail-value="' + index + '"]');
      if (label && label.textContent !== cell[0]) label.textContent = cell[0];
      if (value && value.textContent !== cell[1]) value.textContent = cell[1];
    });
  }

  function wrap(name, before, after) {
    var fn = window[name];
    if (typeof fn !== 'function' || fn.__stableDetailsWrapped) return;
    var wrapped = function () {
      if (before) before();
      var result = fn.apply(this, arguments);
      if (after) after();
      return result;
    };
    wrapped.__stableDetailsWrapped = true;
    window[name] = wrapped;
  }

  function install() {
    addStyles();
    ensureRow();
    updateRow();

    var attempts = 0;
    function bind() {
      attempts++;
      if (typeof window.renderSessionMode !== 'function') {
        if (attempts < 50) setTimeout(bind, 100);
        return;
      }
      if (window.__stableExerciseDetailsInstalled) return;
      window.__stableExerciseDetailsInstalled = true;

      /* Update before every state transition/render, so the mounted row already
         contains the next visible values before any other wrapper changes layout. */
      ['renderSessionMode','startCurrentSet','startNextSet','completeCurrentSet','addExtraSet','finishCurrentExercise'].forEach(function (name) {
        wrap(name, updateRow, updateRow);
      });

      updateRow();
    }
    bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once:true });
  } else {
    install();
  }
})();
