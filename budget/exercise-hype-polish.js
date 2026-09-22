(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; } catch (e) { return null; }
  }

  function addStyles() {
    if (document.getElementById('exercise-hype-polish-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-hype-polish-style';
    style.textContent = `
      #session-pre-timer.show {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        z-index: 2147483000 !important;
        display: grid !important;
        place-items: center !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      #session-pre-timer .session-pre-skip { display: none !important; }

      .session-ex-heading-row {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 7px 10px;
        min-width: 0;
      }
      #session-current-ex {
        font-size: 27px !important;
        line-height: 1.08 !important;
        font-weight: 900 !important;
        letter-spacing: -.7px !important;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      #session-next-ex-arrow {
        color: #FB923C;
        font-size: 16px;
        line-height: 1;
        font-weight: 900;
        flex: 0 0 auto;
      }
      #session-next-ex-inline {
        color: #8B949E;
        font-size: 13px;
        line-height: 1.2;
        font-weight: 700;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      #session-next-ex-arrow[hidden],
      #session-next-ex-inline[hidden] { display: none !important; }

      #session-modal.persistent-hype:not(.session-overview-mode) .session-grid > .session-card:nth-child(2) {
        display: block !important;
        grid-column: 1 / -1 !important;
        order: 99;
        margin-top: 2px;
      }
      #session-modal.persistent-hype:not(.session-overview-mode) .session-grid > .session-card:nth-child(2) .session-table {
        width: 100%;
      }

      @media (max-width:600px) {
        #session-pre-timer.show {
          min-height: 100dvh !important;
          padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom)) !important;
        }
        .session-ex-heading-row { gap: 5px 8px; }
        #session-current-ex { font-size: clamp(23px,7vw,29px) !important; }
        #session-next-ex-arrow { font-size: 14px; }
        #session-next-ex-inline { font-size: 11px; }
        #session-modal.persistent-hype:not(.session-overview-mode) .session-grid > .session-card:nth-child(2) {
          margin-top: 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function promotePretimerToViewport() {
    var pre = document.getElementById('session-pre-timer');
    if (!pre) return;
    if (pre.parentNode !== document.body) document.body.appendChild(pre);
    var skip = pre.querySelector('.session-pre-skip');
    if (skip) skip.remove();
  }

  function ensureExerciseHeadingRow() {
    var current = document.getElementById('session-current-ex');
    if (!current) return null;

    var row = document.getElementById('session-ex-heading-row');
    if (!row) {
      row = document.createElement('div');
      row.id = 'session-ex-heading-row';
      row.className = 'session-ex-heading-row';
      current.parentNode.insertBefore(row, current);
      row.appendChild(current);

      var arrow = document.createElement('span');
      arrow.id = 'session-next-ex-arrow';
      arrow.textContent = '→';
      arrow.hidden = true;
      row.appendChild(arrow);

      var next = document.createElement('span');
      next.id = 'session-next-ex-inline';
      next.hidden = true;
      row.appendChild(next);
    }
    return row;
  }

  function setHidden(el, hidden) {
    if (el && el.hidden !== hidden) el.hidden = hidden;
  }

  function updateNextExercise() {
    ensureExerciseHeadingRow();
    var state = getState();
    var arrow = document.getElementById('session-next-ex-arrow');
    var next = document.getElementById('session-next-ex-inline');
    if (!arrow || !next) return;

    var nextExercise = null;
    if (state && Array.isArray(state.exercises)) {
      var idx = Number(state.exerciseIndex || 0) + 1;
      if (idx >= 0 && idx < state.exercises.length) nextExercise = state.exercises[idx];
    }

    var name = nextExercise && String(nextExercise.name || '').trim();
    if (!name) {
      setHidden(arrow, true);
      setHidden(next, true);
      if (next.textContent) next.textContent = '';
      return;
    }

    setHidden(arrow, false);
    setHidden(next, false);
    if (next.textContent !== name) next.textContent = name;
  }

  function refresh() {
    promotePretimerToViewport();
    updateNextExercise();
  }

  function scheduleRefresh() {
    setTimeout(refresh, 0);
    setTimeout(refresh, 80);
  }

  function install() {
    if (window.__exerciseHypePolishPassiveInstalled) return;
    window.__exerciseHypePolishPassiveInstalled = true;

    addStyles();
    refresh();

    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (target.closest('#session-modal') || target.closest('#day-workout-modal')) scheduleRefresh();
    }, true);

    document.addEventListener('input', function (event) {
      var target = event.target;
      if (target && target.closest && target.closest('#session-modal')) scheduleRefresh();
    }, true);

    document.addEventListener('change', function (event) {
      var target = event.target;
      if (target && target.closest && target.closest('#session-modal')) scheduleRefresh();
    }, true);

    /* Passive safety sync only. No MutationObserver and no function wrapping. */
    setInterval(function () {
      var modal = document.getElementById('session-modal');
      var pre = document.getElementById('session-pre-timer');
      if ((modal && modal.classList.contains('show')) || (pre && pre.classList.contains('show'))) refresh();
    }, 750);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
