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
      .week-toolbar button[onclick*="goToCurrentWeek"] { display:none !important; }
      #week-inline-actions-v3 { display:flex; align-items:center; gap:6px; margin-left:auto; flex:0 0 auto; }
      #week-inline-actions-v3 .btn-sm { white-space:nowrap; }
      #day-workout-modal .builder-date-picker-hidden-v4 { display:none !important; }

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
      #day-workout-ex-list .ex-row-head { min-width:0; }
      .builder-row-tools-v3 { margin-left:auto; display:flex; align-items:center; gap:5px; flex:0 0 auto; }
      .builder-row-plus-v3,
      .builder-row-drag-handle-v3 {
        width:30px; height:28px; display:inline-flex; align-items:center; justify-content:center;
        border-radius:8px; font-family:'Inter',sans-serif; font-weight:900; line-height:1;
        cursor:pointer; -webkit-tap-highlight-color:transparent;
      }
      .builder-row-plus-v3 {
        border:1px solid rgba(34,211,238,.28); background:rgba(34,211,238,.08);
        color:#67E8F9; font-size:17px;
      }
      .builder-row-plus-v3:hover,
      .builder-row-plus-v3:active { background:rgba(34,211,238,.18); border-color:rgba(34,211,238,.48); }
      .builder-row-drag-handle-v3 {
        border:1px solid rgba(148,163,184,.18); background:rgba(148,163,184,.055);
        color:#94A3B8; font-size:15px; letter-spacing:-3px; touch-action:none;
        user-select:none; -webkit-user-select:none; cursor:grab;
      }
      .builder-row-drag-handle-v3:active {
        cursor:grabbing; background:rgba(34,211,238,.10); border-color:rgba(34,211,238,.34); color:#67E8F9;
      }

      .builder-row-floating-v4 {
        position:fixed !important; left:0 !important; top:0 !important; margin:0 !important;
        z-index:2147482000 !important; pointer-events:none !important; opacity:.97;
        transform-origin:center center; border-color:rgba(34,211,238,.62) !important;
        background:#111c25 !important;
        box-shadow:0 20px 44px rgba(0,0,0,.52),0 0 0 1px rgba(34,211,238,.18),0 0 28px rgba(34,211,238,.12) !important;
        will-change:transform;
      }
      .builder-row-floating-v4 input,
      .builder-row-floating-v4 button { pointer-events:none !important; }
      #day-workout-ex-list .builder-row-source-hidden-v4 { display:none !important; }
      #day-workout-ex-list .builder-row-placeholder-v4 {
        box-sizing:border-box; width:100%; border:1px dashed rgba(34,211,238,.52);
        border-radius:11px; background:rgba(34,211,238,.055);
        box-shadow:inset 0 0 0 1px rgba(34,211,238,.035);
        transition:height .14s ease,margin .14s ease,background .14s ease,border-color .14s ease;
      }
      #day-workout-ex-list .builder-row-drop-flash-v4 { animation:builderRowDropV4 .34s ease-out; }
      @keyframes builderRowDropV4 {
        0% { transform:scale(.985); border-color:rgba(34,211,238,.75); background:rgba(34,211,238,.13); }
        100% { transform:scale(1); }
      }
      #day-workout-ex-list .builder-row-copied-v3 { animation:builderRowCopiedV3 .45s ease-out; }
      @keyframes builderRowCopiedV3 {
        0% { border-color:rgba(34,211,238,.72); background:rgba(34,211,238,.14); }
        100% { border-color:rgba(255,255,255,.055); background:rgba(255,255,255,.012); }
      }
      body.builder-row-drag-active-v3,
      body.builder-row-drag-active-v3 * { user-select:none !important; -webkit-user-select:none !important; }
      body.builder-row-drag-active-v3 { cursor:grabbing !important; }

      @media (max-width:600px) {
        #week-inline-actions-v3 { gap:4px; }
        #week-inline-actions-v3 .btn-sm { padding:6px 7px !important; font-size:9px !important; }
        #day-workout-ex-list .ex-row-item.builder-row-enhanced-v3 { padding:7px 6px; }
        .builder-row-plus-v3,.builder-row-drag-handle-v3 { width:34px; height:32px; border-radius:9px; }
        .builder-row-plus-v3 { font-size:19px; }
        .builder-row-drag-handle-v3 { font-size:16px; }
        .builder-row-floating-v4 {
          box-shadow:0 18px 38px rgba(0,0,0,.55),0 0 0 1px rgba(34,211,238,.22),0 0 22px rgba(34,211,238,.13) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function fixWeekToolbar() {
    var toolbar = document.querySelector('.week-toolbar');
    if (!toolbar) return;
    Array.prototype.slice.call(toolbar.querySelectorAll('button')).forEach(function (button) {
      var onclick = button.getAttribute('onclick') || '';
      if (text(button) === 'denna vecka' || onclick.indexOf('goToCurrentWeek') >= 0) button.remove();
    });

    var actions = document.getElementById('week-inline-actions-v3');
    if (!actions) { actions = document.createElement('div'); actions.id = 'week-inline-actions-v3'; }

    var oldActions = document.getElementById('week-inline-actions-v2');
    if (oldActions && oldActions !== actions) {
      Array.prototype.slice.call(oldActions.querySelectorAll('button')).forEach(function (button) { actions.appendChild(button); });
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

  function hideBuilderDatePicker() {
    var input = document.getElementById('day-workout-date');
    if (!input) return;
    var pick = input.closest('.week-pick');
    if (pick) pick.classList.add('builder-date-picker-hidden-v4');
    var group = input.closest('.form-group');
    var label = group && group.querySelector(':scope > label');
    if (label && /datum och vecka/i.test(label.textContent || '')) label.textContent = 'Vecka';
  }

  function builderList() { return document.getElementById('day-workout-ex-list'); }

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
    tools.innerHTML = '<button type="button" class="builder-row-plus-v3" aria-label="Kopiera övningsrad" title="Kopiera rad">+</button>' +
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

  function stripDuplicateIds(root) {
    if (!root) return;
    if (root.id) root.removeAttribute('id');
    root.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
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
    clone.classList.remove('builder-row-source-hidden-v4','builder-row-floating-v4','builder-row-placeholder-v4','builder-row-drop-flash-v4','builder-row-copied-v3');
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

  function exerciseRows(list) {
    list = list || builderList();
    return list ? Array.prototype.slice.call(list.querySelectorAll(':scope > .ex-row-item')) : [];
  }

  function rowIndex(row) {
    var list = row && row.parentElement;
    return list ? exerciseRows(list).indexOf(row) : -1;
  }

  function animateSiblingShift(list, mutate) {
    if (!list || typeof mutate !== 'function') return;
    var rows = exerciseRows(list).filter(function (row) { return !drag || row !== drag.row; });
    var before = new Map();
    rows.forEach(function (row) { before.set(row, row.getBoundingClientRect().top); });
    mutate();
    rows.forEach(function (row) {
      var oldTop = before.get(row);
      var newTop = row.getBoundingClientRect().top;
      var delta = oldTop - newTop;
      if (!delta || Math.abs(delta) < .5) return;
      row.style.transition = 'none';
      row.style.transform = 'translateY(' + delta + 'px)';
      void row.offsetHeight;
      row.style.transition = 'transform 160ms cubic-bezier(.2,.8,.2,1)';
      row.style.transform = '';
      setTimeout(function () {
        row.style.transition = '';
        row.style.transform = '';
      }, 180);
    });
  }

  function updateGhost(clientX, clientY) {
    if (!drag || !drag.active || !drag.ghost) return;
    drag.lastX = clientX;
    drag.lastY = clientY;
    var x = clientX - drag.offsetX;
    var y = clientY - drag.offsetY;
    drag.ghost.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(1.018)';
  }

  function beginDrag(clientX, clientY) {
    if (!drag || drag.active) return;
    if (drag.pressTimer) clearTimeout(drag.pressTimer);
    drag.pressTimer = null;
    var row = drag.row;
    var list = row && row.parentElement;
    if (!row || !list) { drag = null; return; }

    var rect = row.getBoundingClientRect();
    drag.active = true;
    drag.startIndex = rowIndex(row);
    drag.offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    drag.offsetY = Math.max(0, Math.min(rect.height, clientY - rect.top));

    var placeholder = document.createElement('div');
    placeholder.className = 'builder-row-placeholder-v4';
    placeholder.style.height = rect.height + 'px';
    placeholder.setAttribute('aria-hidden','true');
    list.insertBefore(placeholder, row);
    drag.placeholder = placeholder;

    var ghost = row.cloneNode(true);
    copyFormState(row, ghost);
    stripDuplicateIds(ghost);
    ghost.classList.remove('builder-row-source-hidden-v4','builder-row-drop-flash-v4');
    ghost.classList.add('builder-row-floating-v4');
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    document.body.appendChild(ghost);
    drag.ghost = ghost;

    row.classList.add('builder-row-source-hidden-v4');
    document.body.classList.add('builder-row-drag-active-v3');
    updateGhost(clientX, clientY);
  }

  function movePlaceholder(clientY) {
    if (!drag || !drag.active || !drag.placeholder || !drag.row) return;
    var list = builderList();
    if (!list) return;
    var targets = exerciseRows(list).filter(function (row) { return row !== drag.row; });
    var beforeTarget = null;
    for (var i = 0; i < targets.length; i++) {
      var rect = targets[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) { beforeTarget = targets[i]; break; }
    }
    var placeholder = drag.placeholder;
    var samePlace = (beforeTarget && placeholder.nextElementSibling === beforeTarget) || (!beforeTarget && placeholder === list.lastElementChild);
    if (samePlace) return;
    animateSiblingShift(list, function () {
      if (beforeTarget) list.insertBefore(placeholder, beforeTarget);
      else list.appendChild(placeholder);
    });
  }

  function autoScroll(clientY) {
    var modal = document.querySelector('#day-workout-modal .modal');
    if (!modal || !drag || !drag.active) return;
    var rect = modal.getBoundingClientRect();
    var edge = Math.min(72, rect.height * .18);
    var amount = 0;
    if (clientY < rect.top + edge) amount = -12;
    else if (clientY > rect.bottom - edge) amount = 12;
    if (amount) modal.scrollTop += amount;
  }

  function finalizeDrag(commit) {
    if (!drag) return;
    if (drag.pressTimer) clearTimeout(drag.pressTimer);
    var state = drag;
    var row = state.row;
    var list = builderList();
    var placeholder = state.placeholder;
    var ghost = state.ghost;

    function cleanup(doCommit) {
      if (doCommit && row && list && placeholder && placeholder.parentNode === list) list.insertBefore(row, placeholder);
      if (placeholder && placeholder.parentNode) placeholder.remove();
      if (row) {
        row.classList.remove('builder-row-source-hidden-v4');
        if (doCommit) {
          row.classList.add('builder-row-drop-flash-v4');
          setTimeout(function () { row.classList.remove('builder-row-drop-flash-v4'); }, 360);
        }
      }
      if (ghost && ghost.parentNode) ghost.remove();
      document.body.classList.remove('builder-row-drag-active-v3');
      var changed = doCommit && row && state.startIndex !== rowIndex(row);
      drag = null;
      if (changed) notifyBuilderChanged(row);
    }

    if (commit && state.active && ghost && placeholder) {
      var target = placeholder.getBoundingClientRect();
      ghost.style.transition = 'transform 140ms cubic-bezier(.2,.8,.2,1), opacity 140ms ease';
      ghost.style.opacity = '.82';
      ghost.style.transform = 'translate3d(' + target.left + 'px,' + target.top + 'px,0) scale(1)';
      setTimeout(function () { cleanup(true); }, 145);
    } else {
      cleanup(false);
    }
  }

  function distanceFromStart(x, y) {
    if (!drag) return 0;
    var dx = x - drag.startX;
    var dy = y - drag.startY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function dragMove(clientX, clientY) {
    if (!drag || !drag.active) return;
    updateGhost(clientX, clientY);
    autoScroll(clientY);
    movePlaceholder(clientY);
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      var plus = event.target && event.target.closest ? event.target.closest('.builder-row-plus-v3') : null;
      if (!plus) return;
      event.preventDefault();
      event.stopPropagation();
      duplicateRow(rowFromTarget(plus));
    }, false);

    document.addEventListener('mousedown', function (event) {
      if (event.button !== 0) return;
      var row = rowFromTarget(event.target);
      if (!row) return;
      var handle = event.target.closest && event.target.closest('.builder-row-drag-handle-v3');
      if (!handle && isInteractiveTarget(event.target)) return;
      finalizeDrag(false);
      drag = { mode:'mouse', row:row, startX:event.clientX, startY:event.clientY, active:false, pressTimer:null };
      if (handle) { event.preventDefault(); beginDrag(event.clientX, event.clientY); }
    }, false);

    document.addEventListener('mousemove', function (event) {
      if (!drag || drag.mode !== 'mouse') return;
      if (!drag.active) {
        if (distanceFromStart(event.clientX, event.clientY) < 4) return;
        beginDrag(event.clientX, event.clientY);
      }
      event.preventDefault();
      dragMove(event.clientX, event.clientY);
    }, false);

    document.addEventListener('mouseup', function () {
      if (!drag || drag.mode !== 'mouse') return;
      finalizeDrag(true);
    }, false);

    document.addEventListener('touchstart', function (event) {
      if (!event.touches || event.touches.length !== 1) return;
      var row = rowFromTarget(event.target);
      if (!row) return;
      var handle = event.target.closest && event.target.closest('.builder-row-drag-handle-v3');
      if (!handle && isInteractiveTarget(event.target)) return;
      finalizeDrag(false);
      var touch = event.touches[0];
      drag = { mode:'touch', row:row, startX:touch.clientX, startY:touch.clientY, active:false, pressTimer:null };
      drag.pressTimer = setTimeout(function () {
        if (drag && drag.mode === 'touch') beginDrag(drag.startX, drag.startY);
      }, handle ? 180 : 300);
    }, { passive:true });

    document.addEventListener('touchmove', function (event) {
      if (!drag || drag.mode !== 'touch' || !event.touches || event.touches.length !== 1) return;
      var touch = event.touches[0];
      if (!drag.active) {
        if (distanceFromStart(touch.clientX, touch.clientY) > 10) finalizeDrag(false);
        return;
      }
      event.preventDefault();
      dragMove(touch.clientX, touch.clientY);
    }, { passive:false });

    document.addEventListener('touchend', function () {
      if (!drag || drag.mode !== 'touch') return;
      finalizeDrag(true);
    }, false);

    document.addEventListener('touchcancel', function () {
      if (!drag || drag.mode !== 'touch') return;
      finalizeDrag(false);
    }, false);

    document.addEventListener('contextmenu', function (event) {
      if (!drag) return;
      var row = rowFromTarget(event.target);
      if (row && row === drag.row) event.preventDefault();
    }, false);
  }

  function sync() {
    fixWeekToolbar();
    hideBuilderDatePicker();
    var modal = document.getElementById('day-workout-modal');
    if (modal && modal.classList.contains('show')) syncRows();
  }

  function install() {
    addStyles();
    bindEvents();
    sync();
    syncTimer = setInterval(sync, 300);
    window.__exerciseBuilderRowToolsV3 = { sync:sync, duplicateRow:duplicateRow };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
