(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function syncUnitLabels() {
    var modal = document.getElementById('day-workout-modal');
    if (!modal || !modal.classList.contains('show')) return;

    var list = document.getElementById('day-workout-ex-list');
    var group = list && (list.closest('.form-group') || list.parentElement);
    var label = group && group.querySelector(':scope > label');
    if (label) {
      label.textContent = 'Övningar (Set/Reps/kg · Distans km / Tid min · Vila/mellanövning sek)';
    }

    var globalSeconds = document.querySelector('#between-exercise-global-editor-v7 [data-global-seconds-v7]');
    if (globalSeconds) {
      var field = globalSeconds.closest('div');
      var fieldLabel = field && field.querySelector('label');
      if (fieldLabel) fieldLabel.textContent = 'Tid (sek)';
      globalSeconds.setAttribute('aria-label', 'Tid mellan övningar i sekunder');
    }

    document.querySelectorAll('#day-workout-ex-list [data-per-set-seconds-v7]').forEach(function (input) {
      input.setAttribute('aria-label', 'Tid mellan set i sekunder');
      input.setAttribute('title', 'sekunder');
    });
  }

  function install() {
    if (document.getElementById('exercise-builder-style-v5')) return;

    var style = document.createElement('style');
    style.id = 'exercise-builder-style-v5';
    style.textContent = `
      /* Bygg pass: give the exercise name more room and make numeric fields tighter. */
      #day-workout-ex-list .ex-row {
        grid-template-columns:minmax(0,1fr) 56px 56px 62px 26px !important;
        gap:5px !important;
      }
      #day-workout-ex-list .ex-row-item.is-cardio .ex-row {
        grid-template-columns:minmax(0,1fr) 92px 92px 26px !important;
      }
      #day-workout-ex-list .ex-row input {
        min-width:0 !important;
      }
      #day-workout-ex-list .ex-row .ex-name {
        padding-left:10px !important;
        padding-right:8px !important;
      }
      #day-workout-ex-list .ex-row input[type="number"] {
        padding-left:8px !important;
        padding-right:8px !important;
        text-align:left;
      }

      /* Floating drag clone lives under body instead of inside the modal.
         Explicitly preserve the same dark form styling while it is floating. */
      .builder-row-floating-v4 input,
      .builder-row-floating-v4 select,
      .builder-row-floating-v4 textarea {
        box-sizing:border-box !important;
        min-width:0 !important;
        background:#21262D !important;
        background-color:#21262D !important;
        border:1px solid rgba(255,255,255,.08) !important;
        border-radius:8px !important;
        color:#F0F6FC !important;
        -webkit-text-fill-color:#F0F6FC !important;
        caret-color:#F0F6FC !important;
        box-shadow:none !important;
        opacity:1 !important;
        font-family:'Inter',sans-serif !important;
      }
      .builder-row-floating-v4 input::placeholder,
      .builder-row-floating-v4 textarea::placeholder {
        color:#8B949E !important;
        -webkit-text-fill-color:#8B949E !important;
        opacity:1 !important;
      }
      .builder-row-floating-v4 .ex-row {
        grid-template-columns:minmax(0,1fr) 56px 56px 62px 26px !important;
        gap:5px !important;
      }
      .builder-row-floating-v4.is-cardio .ex-row {
        grid-template-columns:minmax(0,1fr) 92px 92px 26px !important;
      }
      .builder-row-floating-v4 .ex-row .ex-name {
        padding-left:10px !important;
        padding-right:8px !important;
      }
      .builder-row-floating-v4 .ex-row input[type="number"] {
        padding-left:8px !important;
        padding-right:8px !important;
      }

      @media(max-width:480px) {
        #day-workout-ex-list .ex-row,
        .builder-row-floating-v4 .ex-row {
          grid-template-columns:minmax(0,1fr) 44px 44px 50px 22px !important;
          gap:4px !important;
        }
        #day-workout-ex-list .ex-row-item.is-cardio .ex-row,
        .builder-row-floating-v4.is-cardio .ex-row {
          grid-template-columns:minmax(0,1fr) 68px 68px 22px !important;
        }
        #day-workout-ex-list .ex-row input,
        .builder-row-floating-v4 .ex-row input {
          padding-left:7px !important;
          padding-right:6px !important;
          font-size:12px !important;
        }
        #day-workout-ex-list .ex-row .ex-name,
        .builder-row-floating-v4 .ex-row .ex-name {
          padding-left:9px !important;
          padding-right:7px !important;
        }
      }
    `;
    document.head.appendChild(style);

    syncUnitLabels();
    setInterval(syncUnitLabels, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
