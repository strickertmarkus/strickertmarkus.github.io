(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  var drag = null;
  var syncTimer = null;

  function text(el) {
    return String((el && el.textContent) || '').trim().toLowerCase();
  }

  function addStyles() {
    if (document.getElementById('exercise-builder-row-tools-v3-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-builder-row-tools-v3-style';
    style.textContent = `
      /* Hard fallback: the old current-week button must never remain visible. */
      .week-toolbar button[onclick*="goToCurrentWeek"] {
        display:none !important;
      }
      #week-inline-actions-v3 {
        display:flex;
        align-items:center;
        gap:6px;
        margin-left:auto;
        flex:0 0 auto;
      }
      #week-inline-actions-v3 .btn-sm {
        white-space:nowrap;
      }

      #day-workout-ex-list .ex-row-item.builder-row-enhanced-v3 {
        padding:7px;
        border:1px solid rgba(255,255,255,.055);
        border-radius:11px;
        background:rgba(255,255,255,.012);
        transition:border-color .16s ease,background .16s ease,box-shadow .16s ease,opacity .16s ease,transform .16s ease;
      }
      #day-workout-ex-list .ex-row-item.builder-row-enhanced-v3:hover {
        border-color:rgba(34,211,238,.16);
        background:rgba(34,211,238,.018);
      }
      #day-workout-ex-list .ex-row-head {
        min-width:0;
      }
      .builder-row-tools-v3 {
        margin-left:auto;
        display:flex;
        align-items:center;
        gap:5px;
        flex:0 0 auto;
      }
      .builder-row-plus-v3,
      .builder-row-drag-handle-v3 {
        width:30px;
        height:28px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        border-radius:8px;
        font-family:'Inter',sans-serif;
        font-weight:900;
        line-height:1;
        cursor:pointer;
        -webkit-tap-highlight-color:transparent;
      }
      .builder-row-plus-v3 {
        border:1px solid rgba(34,211,238,.28);
        background:rgba(34,211,238,.08);
        color:#67E8F9;
        font-size:17px;
      }
      .builder-row-plus-v3:hover,
      .builder-row-plus-v3:active {
        background:rgba(34,211,238,.18);
        border-color:rgba(34,211,238,.48);
      }
      .builder-row-drag-handle-v3 {
        border:1px solid rgba(148,163,184,.18);
        background:rgba(148,163,184,.055);
        color:#94A3B8;
        font-size:15px;
        letter-spacing:-3px;
        touch-action:none;
        user-select:none;
        -webkit-user-select:none;
        cursor:grab;
      }
      .builder-row-drag-handle-v3:active {
        cursor:grabbing;
        background:rgba(34,211,238,.10);
        border-color:rgba(34,211,238,.34);
        color:#67E8F9;
      }
      #day-workout-ex-list .builder-row-dragging-v3 {
        opacity:.72;
        transform:scale(.992);
        border-color:rgba(34,211,238,.52) !important;
        background:rgba(34,211,238,.075) !important;
        box-shadow:0 8px 24px rgba(0,0,0,.26),0 0 0 1px rgba(34,211,238,.10);
        z-index:4;
      }
      #day-workout-ex-list .builder-row-copied-v3 {
        animation:builderRowCopiedV3 .45s ease-out;
      }
      @keyframes builderRowCopiedV3 {
        0% { border-color:rgba(34,211,238,.72); background:rgba(34,211,238,.14); }
        100% { border-color:rgba(255,255,255,.055); background:rgba(255,255,255,.012); }
      }
      body.builder-row-drag-active-v3,
      body.builder-row-drag-active-v3 * {
        user-select:none !important;
        -webkit-user-select:none !important;
      }

      @media (max-width:600px) {
        #week-inline-actions-v3 { gap:4px; }
        #week-inline-actions-v3 .btn-sm {
          padding:6px 7px !important;
          font-size:9px !important;
        }
        #day-workout-ex-list .ex-row-item.builder-row-enhanced-v3 {
          padding:7px 6px;
        }
        .builder-row-plus-v3,
        .builder-row-drag-handle-v3 {
          width:34px;
          height:32px;
          border-radius:9px;
        }
        .builder-row-plus-v3 { font-size:19px; }
        .builder-row-drag-handle-v3 { font-size:16px; }
      }
    `;
    document.head.appendChild(style);
  }

  function fixWeekToolbar() {
    var toolbar = document.querySelector('.week-toolbar');
    if (!toolbar) return;

    /* Remove the actual static button regardless of which container it sits in. */
    Array.prototype.slice.call(toolbar.querySelectorAll('button')).forEach(function (button) {
      var onclick = button.getAttribute('onclick') || '';
      if (text(button) === 'denna vecka' || onclick.indexOf('goToCurrentWeek') >= 0) button.remove();
    });

    var actions = document.getElementById('week-inline-actions-v3');
    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'week-inline-actions-v3';
    }

    var oldActions = document.getElementById('week-inline-actions-v2');
    if (oldActions && oldActions !== actions) {
      Array.prototype.slice.call(oldActions.querySelectorAll('button')).forEach(function (button) {
        actions.appendChild(button);
      });
      oldActions.remove();
    }

    var weekHeader = Array.prototype.slice.call(document.querySelectorAll('.section-hdr')).find(function (header) {
      var h2 = header.querySelector('h2');
      return h2 && text(h2) === 'veckoplan';
    });

    if (weekHeader) {
      Array.prototype.slice.call(weekHeader.querySelectorAll('button')).forEach(function (button) {
        var t = text(button);
        if (t === 'redigera' || t === 'mallpass') actions.appendChild(button);
      });

      Array.prototype.slice.call(weekHeader.children).forEach(function (child) {
        if (child.tagName === 'H2') return;
        if (!child.querySelector('button') && !String(child.textContent || '').trim()) child.remove();
      });
    }

    if (actions.querySelector('button') && actions.parentNode !== toolbar) toolbar.appendChild(actions);
  }

  function builderList() {
    return document.getElementById('day-workout-ex-list');
  }

  function enhanceRow(row) {
    if (!row || row.dataset.builderToolsV3 === '1') return;
    row.dataset.builderToolsV3 = '1';
    row.classList.add('builder-row-enhanced-v3');

    var head = row.querySelector('.ex-row-head');
    if (!head) return;

    var old = row.querySelector('.builder-row-tools-v3');
    if (old) old.remove();

    var tools = document.createElement('div');
    tools.className = 'builder-row-tools-v3';
    tools.innerHTML =
      '<button type="button" class="builder-row-plus-v3" aria-label="Kopiera övningsrad" title="Kopiera rad">+</button>' +
      '<button type="button" class="builder-row-drag-handle-v3" aria-label="Dra för att flytta övningsrad" title="Dra för att ändra ordning">⋮⋮</button>';
    head.appendChild(tools);
  }

  function syncRows() {
    var list = builderList();
    if (!list) return;
    Array.prototype.slice.call(list.querySelectorAll('.ex-row-item')).forEach(enhanceRow);
  }

  function copyFormState(source, clone) {
    var sourceControls = source.querySelectorAll('input,select,textarea');
    var cloneControls = clone.querySelectorAll('input,select,textarea');
    sourceControls.forEach(function (control, index) {
      var target = cloneControls[index];
      if (!target) return;
      target.value = control.value;
      if ('checked' in control) target.checked = control.checked;
      if (control.tagName === 'SELECT') target.selectedIndex = control.selectedIndex;
    });
  }

  function notifyBuilderChanged(target) {
    try { target.dispatchEvent(new Event('input', { bubbles:true })); } catch (e) {}
  }

  function duplicateRow(source) {
    var list = builderList();
    if (!list || !source || source.parentNode !== list) return;

    var clone = source.cloneNode(true);
    copyFormState(source, clone);
    clone.querySelectorAll('.builder-row-tools-v3').forEach(function (el) { el.remove(); });
    clone.removeAttribute('data-builder-tools-v3');
    clone.classList.remove('builder-row-dragging-v3','builder-row-copied-v3');
    source.insertAdjacentElement('afterend', clone);
    enhanceRow(clone);
    clone.classList.add('builder-row-copied-v3');
    setTimeout(function () { clone.classList.remove('builder-row-copied-v3'); }, 500);
    notifyBuilderChanged(clone);
  }

  function rowFromTarget(target) {
    return target && target.closest ? target.closest('#day-workout-ex-list .ex-row-item') : null;
  }

  function isInteractiveTarget(target) {
    return !!(target && target.closest && target.closest('input,select,textarea,button,a,label'));
  }

  function rowIndex(row) {
    var list = row && row.parentElement;
    if (!list) return -1;
    return Array.prototype.indexOf.call(list.children, row);
  }

  function beginDrag() {
    if (!drag || drag.active) return;
    if (drag.pressTimer) clearTimeout(drag.pressTimer);
    drag.pressTimer = null;
    drag.active = true;
    drag.startIndex = rowIndex(drag.row);
    drag.row.classList.add('builder-row-dragging-v3');
    document.body.classList.add('builder-row-drag-active-v3');
  }

  function reorderAt(clientY) {
    if (!drag || !drag.active || !drag.row) return;
    var row = drag.row;
    var list = row.parentElement;
    if (!list) return;

    var beforeIndex = rowIndex(row);
    var others = Array.prototype.slice.call(list.children).filter(function (el) {
      return el !== row && el.classList && el.classList.contains('ex-row-item');
    });
    var inserted = false;

    for (var i = 0; i < others.length; i++) {
      var target = others[i];
      var rect = target.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        list.insertBefore(row, target);
        inserted = true;
        break;
      }
    }
    if (!inserted) list.appendChild(row);

    if (rowIndex(row) !== beforeIndex) drag.changed = true;
  }

  function clearDrag(commit) {
    if (!drag) return;
    if (drag.pressTimer) clearTimeout(drag.pressTimer);
    var row = drag.row;
    var changed = !!drag.changed;
    if (row) row.classList.remove('builder-row-dragging-v3');
    document.body.classList.remove('builder-row-drag-active-v3');
    drag = null;
    if (commit && changed && row) notifyBuilderChanged(row);
  }

  function distanceFromStart(x, y) {
    if (!drag) return 0;
    var dx = x - drag.startX;
    var dy = y - drag.startY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      var plus = event.target && event.target.closest ? event.target.closest('.builder-row-plus-v3') : null;
      if (!plus) return;
      event.preventDefault();
      event.stopPropagation();
      duplicateRow(rowFromTarget(plus));
    }, false);

    /* Desktop mouse drag: drag the handle immediately, or drag empty row space after moving a few pixels. */
    document.addEventListener('mousedown', function (event) {
      if (event.button !== 0) return;
      var row = rowFromTarget(event.target);
      if (!row) return;
      var handle = event.target.closest && event.target.closest('.builder-row-drag-handle-v3');
      if (!handle && isInteractiveTarget(event.target)) return;

      clearDrag(false);
      drag = {
        mode:'mouse',
        row:row,
        startX:event.clientX,
        startY:event.clientY,
        active:false,
        changed:false,
        pressTimer:null
      };
      if (handle) {
        event.preventDefault();
        beginDrag();
      }
    }, false);

    document.addEventListener('mousemove', function (event) {
      if (!drag || drag.mode !== 'mouse') return;
      if (!drag.active) {
        if (distanceFromStart(event.clientX, event.clientY) < 4) return;
        beginDrag();
      }
      event.preventDefault();
      reorderAt(event.clientY);
    }, false);

    document.addEventListener('mouseup', function () {
      if (!drag || drag.mode !== 'mouse') return;
      clearDrag(true);
    }, false);

    /* Mobile: hold a row (or the grip) briefly, then drag vertically. */
    document.addEventListener('touchstart', function (event) {
      if (!event.touches || event.touches.length !== 1) return;
      var row = rowFromTarget(event.target);
      if (!row) return;
      var handle = event.target.closest && event.target.closest('.builder-row-drag-handle-v3');
      if (!handle && isInteractiveTarget(event.target)) return;

      clearDrag(false);
      var touch = event.touches[0];
      drag = {
        mode:'touch',
        row:row,
        startX:touch.clientX,
        startY:touch.clientY,
        active:false,
        changed:false,
        pressTimer:null
      };
      drag.pressTimer = setTimeout(function () {
        if (drag && drag.mode === 'touch') beginDrag();
      }, handle ? 220 : 320);
    }, { passive:true });

    document.addEventListener('touchmove', function (event) {
      if (!drag || drag.mode !== 'touch' || !event.touches || event.touches.length !== 1) return;
      var touch = event.touches[0];
      if (!drag.active) {
        if (distanceFromStart(touch.clientX, touch.clientY) > 10) clearDrag(false);
        return;
      }
      event.preventDefault();
      reorderAt(touch.clientY);
    }, { passive:false });

    document.addEventListener('touchend', function () {
      if (!drag || drag.mode !== 'touch') return;
      clearDrag(true);
    }, false);

    document.addEventListener('touchcancel', function () {
      if (!drag || drag.mode !== 'touch') return;
      clearDrag(false);
    }, false);

    document.addEventListener('contextmenu', function (event) {
      if (!drag) return;
      var row = rowFromTarget(event.target);
      if (row && row === drag.row) event.preventDefault();
    }, false);
  }

  function sync() {
    fixWeekToolbar();
    var modal = document.getElementById('day-workout-modal');
    if (modal && modal.classList.contains('show')) syncRows();
  }

  function install() {
    addStyles();
    bindEvents();
    sync();
    syncTimer = setInterval(sync, 300);
    window.__exerciseBuilderRowToolsV3 = {
      sync:sync,
      duplicateRow:duplicateRow
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
