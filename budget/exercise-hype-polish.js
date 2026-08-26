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
          height: 100dvh !important;
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
    if (!el || el.hidden === hidden) return;
    el.hidden = hidden;
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
      if (next.textContent !== '') next.textContent = '';
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

  function install() {
    addStyles();
    refresh();

    var attempts = 0;
    function bind() {
      attempts++;
      if (typeof window.renderSessionMode !== 'function') {
        if (attempts < 80) setTimeout(bind, 100);
        return;
      }
      if (window.__exerciseHypePolishInstalled) return;
      window.__exerciseHypePolishInstalled = true;

      var previousRender = window.renderSessionMode;
      window.renderSessionMode = function () {
        var result = previousRender.apply(this, arguments);
        refresh();
        return result;
      };

      ['startCurrentSet','startNextSet','completeCurrentSet','addExtraSet','finishCurrentExercise'].forEach(function (name) {
        var fn = window[name];
        if (typeof fn !== 'function' || fn.__hypePolishWrapped) return;
        var wrapped = function () {
          var result = fn.apply(this, arguments);
          setTimeout(refresh, 0);
          return result;
        };
        wrapped.__hypePolishWrapped = true;
        window[name] = wrapped;
      });

      refresh();
    }
    bind();

    /* No broad MutationObserver here. The previous subtree observer could
       observe the text changes made by refresh() itself and enter an infinite
       render loop when a workout session was opened. Session wrappers above
       are the authoritative refresh points. */
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
