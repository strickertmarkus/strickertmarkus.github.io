(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  var enterGuardUntil = 0;
  var localMutationUntil = 0;
  var lastDeleteAt = 0;
  var DELETE_GUARD_MS = 115;
  var ENTER_GUARD_MS = 150;
  var LOCAL_ECHO_GUARD_MS = 260;

  function now() {
    return (window.performance && typeof performance.now === 'function') ? performance.now() : Date.now();
  }

  function insideItems(target) {
    var root = document.getElementById('items-list');
    return !!(root && target && root.contains(target));
  }

  function markLocalMutation() {
    localMutationUntil = now() + LOCAL_ECHO_GUARD_MS;
  }

  /* Register this before V7. Local sh_lists echoes do not need another render:
     V7 has already rendered the local result synchronously. Skipping that echo
     removes a major source of DOM churn during rapid add/delete sequences. */
  window.addEventListener('firebase-sync', function (event) {
    var key = event && event.detail && event.detail.key;
    if (key !== 'sh_lists') return;
    if (now() >= localMutationUntil) return;
    event.stopImmediatePropagation();
  }, true);

  /* A new editor is rendered/focused synchronously on Enter. Safari can still
     dispatch a late focusout from the editor that was just replaced. Suppress
     only that very short transition window so the new draft cannot be closed. */
  document.addEventListener('focusout', function (event) {
    if (now() >= enterGuardUntil) return;
    if (!insideItems(event.target)) return;
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' || !insideItems(event.target)) return;
    var editable = event.target && event.target.closest ? event.target.closest('[contenteditable="true"]') : null;
    if (!editable) return;

    var stamp = now();
    if (event.repeat || stamp < enterGuardUntil - 70) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    enterGuardUntil = stamp + ENTER_GUARD_MS;
    markLocalMutation();
  }, true);

  /* Rapid taps on a delete control can otherwise land on the next row after the
     synchronous re-render. Keep deletion fast, but require ~115 ms between
     accepted delete actions. This is short enough for deliberate rapid cleanup
     while preventing one finger gesture from cascading through shifted rows. */
  document.addEventListener('click', function (event) {
    if (!insideItems(event.target) || !event.target.closest) return;
    var deleteButton = event.target.closest('[data-action="delete-item"]');
    if (!deleteButton) return;

    var stamp = now();
    if (stamp - lastDeleteAt < DELETE_GUARD_MS) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    lastDeleteAt = stamp;
    markLocalMutation();
  }, true);

  document.addEventListener('change', function (event) {
    if (!insideItems(event.target)) return;
    if (event.target && event.target.type === 'checkbox') markLocalMutation();
  }, true);

  function addStylesWhenReady() {
    if (document.getElementById('shopping-list-stability-v8-style')) return;
    if (!document.getElementById('shopping-list-engine-v7-style')) {
      setTimeout(addStylesWhenReady, 30);
      return;
    }

    var style = document.createElement('style');
    style.id = 'shopping-list-stability-v8-style';
    style.textContent = `
      /* V8 visual compacting: keep V7 logic and text size unchanged. */
      body.shopping-list-engine-v7 .list-item {
        grid-template-columns:22px minmax(0,1fr) 22px !important;
        gap:7px !important;
        min-height:34px !important;
        padding:4px 4px !important;
        border-bottom:0 !important;
      }
      body.shopping-list-engine-v7 .list-item input[type="checkbox"] {
        width:18px !important;
        height:18px !important;
        min-width:18px !important;
        border-radius:4px !important;
      }
      body.shopping-list-engine-v7 .list-item input[type="checkbox"]::before {
        width:8px !important;
        height:5px !important;
      }
      body.shopping-list-engine-v7 .item-text {
        min-height:23px !important;
        padding:2px 6px !important;
        margin:-2px -6px !important;
      }
      body.shopping-list-engine-v7 .shopping-del {
        height:26px !important;
      }
      body.shopping-list-engine-v7 .add-item-line {
        grid-template-columns:22px minmax(0,1fr) 22px !important;
        gap:7px !important;
        min-height:30px !important;
        padding:3px 4px !important;
        border-bottom:0 !important;
      }
      body.shopping-list-engine-v7 .add-item-line span {
        min-height:22px !important;
        font-size:12px !important;
        font-weight:600 !important;
      }
      body.shopping-list-engine-v7 .category-title.new-category {
        font-size:12px !important;
      }
      @media(max-width:520px) {
        body.shopping-list-engine-v7 .list-item {
          min-height:37px !important;
          padding-top:5px !important;
          padding-bottom:5px !important;
        }
        body.shopping-list-engine-v7 .add-item-line {
          min-height:33px !important;
          padding-top:4px !important;
          padding-bottom:4px !important;
        }
        body.shopping-list-engine-v7 .item-text {
          min-height:25px !important;
        }
        body.shopping-list-engine-v7 .add-item-line span {
          font-size:12px !important;
          min-height:24px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addStylesWhenReady, { once:true });
  } else {
    addStylesWhenReady();
  }
})();
