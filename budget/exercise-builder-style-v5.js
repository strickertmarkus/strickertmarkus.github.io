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
      label.textContent = 'Övningar';
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
      #day-workout-ex-list .ex-row,
      .builder-row-floating-v4 .ex-row {
        width:100% !important;
        min-width:0 !important;
        box-sizing:border-box !important;
      }
      #day-workout-ex-list .ex-row input {
        width:100% !important;
        min-width:0 !important;
        height:36px !important;
        box-sizing:border-box !important;
        line-height:20px !important;
      }
      #day-workout-ex-list .ex-row .ex-del {
        width:24px !important;
        min-width:24px !important;
        padding:0 !important;
        text-align:center !important;
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

      /* Kondition styrs av radens data-kind och använder alltid röd semantik.
         Detta gäller både passbyggaren, vanliga loggpopupen och dragkopian. */
      #day-workout-ex-list .ex-row-item,
      #wk-modal #ex-list .ex-row-item {
        position:relative;
        box-sizing:border-box !important;
        padding:8px 10px 9px !important;
        border-bottom:1px solid rgba(148,163,184,.10);
        transition:background .20s ease,border-color .20s ease,transform .18s cubic-bezier(.22,1,.36,1);
      }
      #day-workout-ex-list .ex-row-item.builder-row-enhanced-v3 {
        border-color:rgba(34,211,238,.095) !important;
      }
      #day-workout-ex-list .ex-row-item.is-cardio,
      #wk-modal #ex-list .ex-row-item.is-cardio {
        border-bottom-color:rgba(248,113,113,.24);
        background:linear-gradient(90deg,rgba(239,68,68,.045),transparent 42%);
      }
      #day-workout-ex-list .ex-row-item.is-cardio .ex-kind-btn.active,
      #wk-modal #ex-list .ex-row-item.is-cardio .ex-kind-btn.active,
      .builder-row-floating-v4.is-cardio .ex-kind-btn.active {
        border-color:rgba(248,113,113,.56) !important;
        background:rgba(239,68,68,.12) !important;
        color:#F87171 !important;
        box-shadow:0 0 13px rgba(239,68,68,.11) !important;
      }
      #day-workout-ex-list .ex-row-item.is-cardio .ex-row input,
      #wk-modal #ex-list .ex-row-item.is-cardio .ex-row input,
      .builder-row-floating-v4.is-cardio .ex-row input {
        border-color:rgba(248,113,113,.24) !important;
        background-color:rgba(37,21,25,.88) !important;
        color:#FDE7E7 !important;
        -webkit-text-fill-color:#FDE7E7 !important;
      }
      #day-workout-ex-list .ex-row-item.is-cardio .ex-row input:focus,
      #wk-modal #ex-list .ex-row-item.is-cardio .ex-row input:focus,
      .builder-row-floating-v4.is-cardio .ex-row input:focus {
        border-color:rgba(248,113,113,.62) !important;
        box-shadow:0 0 0 2px rgba(239,68,68,.09) !important;
      }
      #day-workout-ex-list .ex-row-item.is-cardio .ex-row input::placeholder,
      #wk-modal #ex-list .ex-row-item.is-cardio .ex-row input::placeholder,
      .builder-row-floating-v4.is-cardio .ex-row input::placeholder {
        color:#A9787D !important;
        -webkit-text-fill-color:#A9787D !important;
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

      /* When the user skips the rest timer, the old between-set palette can
         briefly paint the underlying Starta set CTA blue before Hype state
         catches up. Lock only that CTA to the established orange palette for
         the short hand-off from rest -> 5 s timer -> running set. */
      #session-modal.persistent-hype.rest-skip-orange-bridge-v1:not(.session-overview-mode) #session-controls .session-cta.primary {
        background:linear-gradient(135deg,#FF9A3D,#F97316) !important;
        border-color:transparent !important;
        color:#1b0902 !important;
        box-shadow:0 10px 30px rgba(249,115,22,.34) !important;
        transition:none !important;
      }

      @media(max-width:480px) {
        #day-workout-ex-list .ex-row,
        .builder-row-floating-v4 .ex-row {
          grid-template-columns:minmax(0,1fr) 42px 42px 48px 24px !important;
          gap:4px !important;
        }
        #day-workout-ex-list .ex-row-item.is-cardio .ex-row,
        .builder-row-floating-v4.is-cardio .ex-row {
          grid-template-columns:minmax(0,1fr) 64px 64px 24px !important;
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

    var restSkipBridgeTimer = null;
    document.addEventListener('click', function (event) {
      var target = event.target;
      var button = target && target.closest ? target.closest('#session-between-overlay-v2.show .bs-start-next-v20') : null;
      if (!button) return;
      var modal = document.getElementById('session-modal');
      if (!modal) return;
      modal.classList.add('rest-skip-orange-bridge-v1');
      if (restSkipBridgeTimer) clearTimeout(restSkipBridgeTimer);
      restSkipBridgeTimer = setTimeout(function () {
        modal.classList.remove('rest-skip-orange-bridge-v1');
        restSkipBridgeTimer = null;
      }, 7000);
    }, true);

    syncUnitLabels();
    setInterval(syncUnitLabels, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
