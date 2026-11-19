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
      /* Reps and weight can be changed during the set (and before it): tap the value. */
      #session-stable-details [data-editable] .stable-detail-value{cursor:pointer;text-decoration:underline dashed rgba(var(--pf-rgb,253,186,116),.45);text-decoration-thickness:1.5px;text-underline-offset:7px}
      #session-stable-details .sd-edit{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:2px}
      #session-stable-details .sd-edit input{width:3.4em;min-width:0;border:0;border-bottom:2px solid rgb(var(--pf-rgb,253,186,116));background:transparent;color:#fff;text-align:center;font:800 22px/1.2 Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums;padding:2px 0;outline:none;border-radius:0;-moz-appearance:textfield}
      #session-stable-details .sd-edit input::-webkit-outer-spin-button,#session-stable-details .sd-edit input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
      #session-stable-details .sd-edit button{flex:0 0 auto;width:30px;height:30px;border-radius:50%;border:1px solid rgba(var(--pf-rgb,253,186,116),.4);background:rgba(var(--pf-rgb,253,186,116),.1);color:rgb(var(--pf-rgb,253,186,116));font:600 18px/1 Inter,system-ui,sans-serif;cursor:pointer;padding:0}
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
    if (row.dataset.editing) return;

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
        [Number(ex.time)<1?'Tid (s)':'Tid (min)', ex.time ? (Number(ex.time)<1?Math.round(Number(ex.time)*60)+' s':Number(Number(ex.time).toFixed(2))+' min') : '—']
      ];
    } else {
      cells = [
        ['Set', (state.currentSet || 1) + ' / ' + (ex.plannedSets || 1)],
        ['Reps', String(ex.reps || 0)],
        [ex.weightMode==='bodyweight'?'Vikt':'Vikt (kg)', ex.weightMode==='bodyweight'?'Kroppsvikt':(ex.weight || 0) + ' kg']
      ];
    }

    cells.forEach(function (cell, index) {
      var label = row.querySelector('[data-detail-label="' + index + '"]');
      var value = row.querySelector('[data-detail-value="' + index + '"]');
      var editable = ex.kind !== 'cardio' && (index === 1 || (index === 2 && ex.weightMode !== 'bodyweight'));
      if (label) label.parentNode.toggleAttribute('data-editable', editable);
      if (label && label.textContent !== cell[0]) label.textContent = cell[0];
      if (value && value.textContent !== cell[1]) value.textContent = cell[1];
    });
  }

  /* Tap Reps or Vikt to change it while the set runs: the new value is what this set logs and
     what the following sets of the exercise start from (the logged sets stay editable below). */
  function openEditor(cell) {
    var row = ensureRow(), state = getState(), ex = getExercise(state);
    if (!row || !ex || row.dataset.editing) return;
    var index = Number(cell.querySelector('[data-detail-value]').dataset.detailValue);
    var key = index === 1 ? 'reps' : 'weight', step = key === 'reps' ? 1 : 2.5;
    var value = cell.querySelector('.stable-detail-value');
    row.dataset.editing = key;
    var box = document.createElement('div');
    box.className = 'sd-edit';
    box.innerHTML = '<button type="button" data-step="-1" aria-label="Minska">−</button><input type="number" inputmode="decimal" step="any" min="0"><button type="button" data-step="1" aria-label="Öka">+</button>';
    var input = box.querySelector('input');
    input.value = String(Number(ex[key]) || 0);
    input.setAttribute('aria-label', key === 'reps' ? 'Reps' : 'Vikt i kg');
    value.hidden = true;
    value.insertAdjacentElement('afterend', box);
    var done = false;
    function commit() {
      if (done) return;
      done = true;
      var n = parseFloat(String(input.value).replace(',', '.'));
      if (isFinite(n) && n >= 0) ex[key] = key === 'reps' ? Math.round(n) : Math.round(n * 100) / 100;
      box.remove();
      value.hidden = false;
      delete row.dataset.editing;
      updateRow();
      try { if (typeof window.renderSessionMode === 'function') window.renderSessionMode(); } catch (_) {}
    }
    ['pointerdown', 'mousedown'].forEach(function (t) { box.addEventListener(t, function (e) { if (e.target.closest('button')) e.preventDefault(); }); });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-step]');
      if (!b) return;
      var n = parseFloat(String(input.value).replace(',', '.')) || 0;
      input.value = String(Math.max(0, Math.round((n + Number(b.dataset.step) * step) * 100) / 100));
      // Keep the field focused (a tap on iPhone moves focus away), so the editor stays open.
      if (!done) input.focus();
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
    input.addEventListener('blur', function () { setTimeout(function () { if (!box.contains(document.activeElement)) commit(); }, 260); });
    input.focus();
    try { input.select(); } catch (_) {}
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
    var row = ensureRow();
    document.addEventListener('click', function (e) {
      var cell = e.target.closest && e.target.closest('#session-stable-details [data-editable]');
      if (cell && !e.target.closest('.sd-edit')) openEditor(cell);
    });
    void row;
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
