(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  function addStyles() {
    if (document.getElementById('shopping-home-parity-v4-style')) return;
    var style = document.createElement('style');
    style.id = 'shopping-home-parity-v4-style';
    style.textContent = `
      /* Header: one compact row. Shopping keeps its page structure, but the
         controls now read as one toolbar instead of two stacked button rows. */
      body.shopping-home-parity-v4 header {
        gap:8px !important;
        margin-bottom:16px !important;
        padding-bottom:10px !important;
      }
      body.shopping-home-parity-v4 .header-shell {
        position:relative !important;
        display:flex !important;
        align-items:center !important;
        width:100% !important;
      }
      body.shopping-home-parity-v4 .header-top {
        display:flex !important;
        align-items:center !important;
        flex-wrap:nowrap !important;
        gap:5px !important;
        width:100% !important;
        padding:0 39px 0 0 !important;
      }
      body.shopping-home-parity-v4 .header-left {
        flex:0 0 auto !important;
        width:auto !important;
        padding:0 !important;
      }
      body.shopping-home-parity-v4 .header-right-top {
        display:flex !important;
        align-items:center !important;
        justify-content:flex-end !important;
        flex:1 1 auto !important;
        flex-wrap:nowrap !important;
        gap:5px !important;
        width:auto !important;
        margin:0 !important;
      }
      body.shopping-home-parity-v4 .header-right-top .dropdown-wrapper {
        min-width:0 !important;
        width:auto !important;
        flex:0 1 auto !important;
      }
      body.shopping-home-parity-v4 .home-btn,
      body.shopping-home-parity-v4 .dropdown-btn {
        height:34px !important;
        min-height:34px !important;
        min-width:0 !important;
        padding:0 10px !important;
        border-radius:8px !important;
        background:rgba(255,255,255,.035) !important;
        border:1px solid rgba(255,255,255,.08) !important;
        color:var(--text) !important;
        font-size:11px !important;
        font-weight:600 !important;
        white-space:nowrap !important;
        transition:background-color .16s ease,border-color .16s ease,transform .12s ease !important;
      }
      body.shopping-home-parity-v4 .home-btn:hover,
      body.shopping-home-parity-v4 .dropdown-btn:hover {
        background:rgba(255,255,255,.065) !important;
        border-color:rgba(251,191,36,.34) !important;
      }
      body.shopping-home-parity-v4 .home-btn:active,
      body.shopping-home-parity-v4 .dropdown-btn:active { transform:scale(.97); }
      body.shopping-home-parity-v4 .home-btn { padding-left:11px !important; padding-right:11px !important; }

      /* Undo is deliberately only a symbol, not another boxed button. */
      body.shopping-home-parity-v4 .undo-btn {
        width:25px !important;
        min-width:25px !important;
        height:34px !important;
        min-height:34px !important;
        padding:0 !important;
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
        color:var(--text-sec) !important;
        font-size:20px !important;
        font-weight:500 !important;
        opacity:.82;
        transition:color .16s ease,opacity .16s ease,transform .12s ease !important;
      }
      body.shopping-home-parity-v4 .undo-btn:hover { color:var(--accent) !important; opacity:1; }
      body.shopping-home-parity-v4 .undo-btn:active { transform:scale(.88); }

      body.shopping-home-parity-v4 .nav-dropdown-wrapper {
        position:absolute !important;
        right:0 !important;
        top:0 !important;
        transform:none !important;
        align-self:auto !important;
      }
      body.shopping-home-parity-v4 .nav-btn {
        width:34px !important;
        min-width:34px !important;
        height:34px !important;
        border-radius:8px !important;
        font-size:16px !important;
      }

      /* Exact Home shopping-row geometry and feel. */
      body.shopping-home-parity-v4 #items-list {
        display:block;
      }
      body.shopping-home-parity-v4 .list-item {
        display:grid !important;
        grid-template-columns:20px minmax(0,1fr) 22px !important;
        align-items:center !important;
        gap:8px !important;
        min-height:39px !important;
        padding:7px 4px !important;
        margin:0 !important;
        border-bottom:1px solid rgba(255,255,255,.07) !important;
        border-radius:0 !important;
        background:transparent !important;
        font-size:14px !important;
        touch-action:manipulation;
        -webkit-tap-highlight-color:transparent;
        transition:background-color .16s ease !important;
      }
      body.shopping-home-parity-v4 .list-item:hover { background:rgba(255,255,255,.018) !important; }
      body.shopping-home-parity-v4 .list-item.selected-row { background:rgba(251,191,36,.07) !important; }

      body.shopping-home-parity-v4 .list-item input[type="checkbox"],
      body.shopping-home-parity-v4 .add-item-line input[type="checkbox"] {
        -webkit-appearance:none !important;
        appearance:none !important;
        display:grid !important;
        place-content:center !important;
        width:16px !important;
        height:16px !important;
        min-width:16px !important;
        margin:0 !important;
        padding:0 !important;
        border:1px solid rgba(148,163,184,.72) !important;
        border-radius:4px !important;
        background:transparent !important;
        background-image:none !important;
        cursor:pointer !important;
        box-shadow:0 0 0 1px rgba(15,23,42,.65),inset 0 1px 0 rgba(255,255,255,.05) !important;
        transition:border-color .16s ease,background-color .16s ease,box-shadow .16s ease,transform .12s ease !important;
      }
      body.shopping-home-parity-v4 .list-item input[type="checkbox"]::before,
      body.shopping-home-parity-v4 .add-item-line input[type="checkbox"]::before {
        content:'';
        width:7px;
        height:4px;
        border-left:2px solid #93C5FD;
        border-bottom:2px solid #93C5FD;
        transform:rotate(-45deg) scale(0);
        transform-origin:center;
        transition:transform .12s ease;
      }
      body.shopping-home-parity-v4 .list-item input[type="checkbox"]:checked,
      body.shopping-home-parity-v4 .add-item-line input[type="checkbox"]:checked {
        background:rgba(15,26,46,.95) !important;
        border-color:rgba(96,165,250,.72) !important;
        box-shadow:0 0 0 2px rgba(96,165,250,.20),inset 0 1px 0 rgba(255,255,255,.06) !important;
      }
      body.shopping-home-parity-v4 .list-item input[type="checkbox"]:checked::before,
      body.shopping-home-parity-v4 .add-item-line input[type="checkbox"]:checked::before {
        transform:rotate(-45deg) scale(1);
      }
      body.shopping-home-parity-v4 .list-item input[type="checkbox"]:active,
      body.shopping-home-parity-v4 .add-item-line input[type="checkbox"]:active { transform:scale(.84); }

      body.shopping-home-parity-v4 .list-item label[id^="item-"] {
        grid-column:2;
        display:flex !important;
        align-items:center !important;
        width:100% !important;
        min-width:0 !important;
        min-height:25px !important;
        padding:3px 7px !important;
        margin:-3px -7px !important;
        border:1px solid transparent;
        border-radius:6px;
        color:var(--text) !important;
        cursor:text !important;
        outline:none !important;
        text-decoration:none;
        background-image:none !important;
        -webkit-user-select:text;
        user-select:text;
      }
      body.shopping-home-parity-v4 .list-item label.done {
        color:var(--text-sec) !important;
        text-decoration:line-through !important;
      }
      body.shopping-home-parity-v4 .list-item label[contenteditable="true"] {
        background:rgba(15,26,46,.72) !important;
        border-color:rgba(96,165,250,.55) !important;
        box-shadow:0 0 0 2px rgba(96,165,250,.08) !important;
        text-decoration:none !important;
      }
      body.shopping-home-parity-v4 .shopping-del {
        grid-column:3;
        width:22px;
        height:28px;
        display:grid;
        place-items:center;
        border:0;
        padding:0;
        background:transparent;
        color:var(--text-sec);
        font:500 14px/1 Inter,sans-serif;
        cursor:pointer;
        opacity:.55;
        transition:color .16s ease,opacity .16s ease,transform .12s ease;
      }
      body.shopping-home-parity-v4 .shopping-del:hover { color:#F87171; opacity:1; }
      body.shopping-home-parity-v4 .shopping-del:active { transform:scale(.86); }

      /* Base edit rows can still appear for programmatic saves. Keep them in
         exactly the same Home-shaped grid so there is no visual jump. */
      body.shopping-home-parity-v4 .list-item input.edit-input {
        grid-column:2 / 4 !important;
        width:100% !important;
        min-width:0 !important;
        min-height:31px !important;
        padding:3px 7px !important;
        border:1px solid rgba(96,165,250,.55) !important;
        border-radius:6px !important;
        background:rgba(15,26,46,.72) !important;
        color:var(--text) !important;
        outline:none !important;
        box-shadow:0 0 0 2px rgba(96,165,250,.08) !important;
        font-size:14px !important;
      }

      /* Home-style compact category headings. */
      body.shopping-home-parity-v4 .category-title {
        min-height:0 !important;
        margin:7px 2px 1px !important;
        padding:7px 5px 4px !important;
        border-bottom:1px solid rgba(251,191,36,.18) !important;
        color:var(--accent) !important;
        font-size:10px !important;
        line-height:1.15 !important;
        font-weight:800 !important;
        letter-spacing:.75px !important;
        text-transform:uppercase !important;
        cursor:text !important;
        transition:background-color .16s ease,color .16s ease !important;
      }
      body.shopping-home-parity-v4 .category-title:hover { background:rgba(251,191,36,.025); }
      body.shopping-home-parity-v4 .category-title[contenteditable="true"] {
        outline:none !important;
        border-radius:5px;
        background:rgba(251,191,36,.055) !important;
        box-shadow:inset 0 0 0 1px rgba(251,191,36,.24);
      }
      body.shopping-home-parity-v4 .category-title input {
        width:100% !important;
        padding:0 !important;
        border:0 !important;
        background:transparent !important;
        color:var(--accent) !important;
        font:800 10px/1.15 Inter,sans-serif !important;
        letter-spacing:.75px !important;
        text-transform:uppercase !important;
        outline:none !important;
      }
      body.shopping-home-parity-v4 .category-title.new-category {
        margin-top:8px !important;
        border-bottom:0 !important;
        color:var(--text-sec) !important;
        text-transform:none !important;
        letter-spacing:0 !important;
        font-size:12px !important;
        font-weight:600 !important;
        padding:7px 5px !important;
      }

      body.shopping-home-parity-v4 .add-item-line {
        display:grid !important;
        grid-template-columns:20px minmax(0,1fr) 22px !important;
        align-items:center !important;
        gap:8px !important;
        min-height:39px !important;
        padding:7px 4px !important;
        border-bottom:1px solid rgba(255,255,255,.07) !important;
        border-radius:0 !important;
        color:var(--text-sec) !important;
        cursor:text !important;
        transition:background-color .16s ease,color .16s ease !important;
        touch-action:manipulation;
        -webkit-tap-highlight-color:transparent;
      }
      body.shopping-home-parity-v4 .add-item-line:hover { background:rgba(255,255,255,.018) !important; color:var(--text) !important; }
      body.shopping-home-parity-v4 .add-item-line span {
        grid-column:2 / 4;
        width:100%;
        min-height:25px;
        display:flex;
        align-items:center;
        cursor:text !important;
      }
      body.shopping-home-parity-v4 .add-item-line input:not([type="checkbox"]) {
        grid-column:2 / 4;
        width:100% !important;
        min-width:0 !important;
        padding:3px 7px !important;
        border:0 !important;
        border-radius:6px !important;
        background:rgba(15,26,46,.52) !important;
        color:var(--text) !important;
        outline:none !important;
        font-size:14px !important;
      }

      @media(max-width:520px) {
        body.shopping-home-parity-v4 .wrap { padding-left:12px; padding-right:12px; }
        body.shopping-home-parity-v4 .header-top { gap:4px !important; padding-right:37px !important; }
        body.shopping-home-parity-v4 .header-right-top { gap:4px !important; }
        body.shopping-home-parity-v4 .home-btn,
        body.shopping-home-parity-v4 .dropdown-btn {
          height:33px !important;
          min-height:33px !important;
          padding:0 7px !important;
          font-size:10px !important;
        }
        body.shopping-home-parity-v4 .home-btn { padding-left:8px !important; padding-right:8px !important; }
        body.shopping-home-parity-v4 .undo-btn { width:21px !important; min-width:21px !important; height:33px !important; font-size:19px !important; }
        body.shopping-home-parity-v4 .nav-btn { width:33px !important; min-width:33px !important; height:33px !important; }
        body.shopping-home-parity-v4 .list-item,
        body.shopping-home-parity-v4 .add-item-line { min-height:42px !important; padding-top:8px !important; padding-bottom:8px !important; }
        body.shopping-home-parity-v4 .list-item label[id^="item-"] { min-height:27px !important; font-size:14px !important; }
        body.shopping-home-parity-v4 .category-title { margin-top:6px !important; padding-top:6px !important; font-size:9px !important; letter-spacing:.65px !important; }
      }

      @media(max-width:370px) {
        body.shopping-home-parity-v4 .home-btn,
        body.shopping-home-parity-v4 .dropdown-btn { padding-left:5px !important; padding-right:5px !important; font-size:9.5px !important; }
        body.shopping-home-parity-v4 .header-top,
        body.shopping-home-parity-v4 .header-right-top { gap:3px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function focusEditableAtEnd(el) {
    if (!el) return;
    try { el.focus({ preventScroll:true }); }
    catch (e) { try { el.focus(); } catch (_) {} }
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (_) {}
  }

  function focusInputNow(input) {
    if (!input) return;
    try { input.focus({ preventScroll:true }); }
    catch (e) { try { input.focus(); } catch (_) {} }
    try {
      var len = String(input.value || '').length;
      input.setSelectionRange(len, len);
    } catch (_) {}
  }

  function simplifyToolbarLabels() {
    document.querySelectorAll('.header-right-top .dropdown-btn').forEach(function (button) {
      var next = String(button.textContent || '').replace(/^\s*☰\s*/, '').trim();
      if (next && button.textContent !== next) button.textContent = next;
    });
  }

  function itemIdFromLabel(label) {
    var match = String(label && label.id || '').match(/^item-(\d+(?:\.\d+)?)$/);
    return match ? Number(match[1]) : null;
  }

  function categoryIdFromElement(el) {
    var attr = String(el && el.getAttribute('onclick') || '');
    var match = attr.match(/startEditCategory\((\d+(?:\.\d+)?)\)/);
    return match ? Number(match[1]) : null;
  }

  function decorateRows() {
    var list = document.getElementById('items-list');
    if (!list) return;

    list.querySelectorAll('.list-item').forEach(function (row) {
      var label = row.querySelector('label[id^="item-"]');
      if (!label || row.querySelector('.shopping-del')) return;
      var id = itemIdFromLabel(label);
      if (id == null) return;

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'shopping-del';
      del.textContent = '✕';
      del.setAttribute('aria-label', 'Radera ' + String(label.textContent || 'artikel'));
      del.dataset.itemId = String(id);
      row.appendChild(del);
    });
  }

  function persistItemText(id, text) {
    if (typeof window.startEditItem !== 'function' || typeof window.saveEditItem !== 'function') return;
    window.startEditItem(id);
    var input = document.getElementById('item-edit-' + id);
    if (!input) return;
    input.value = text;
    window.saveEditItem(id);
  }

  function beginItemEdit(label) {
    if (!label || label.getAttribute('contenteditable') === 'true') {
      focusEditableAtEnd(label);
      return;
    }
    label.dataset.homeEditOriginal = String(label.textContent || '');
    label.setAttribute('contenteditable', 'true');
    label.setAttribute('spellcheck', 'true');
    label.classList.add('home-inline-edit');
    focusEditableAtEnd(label);
  }

  function finishItemEdit(label, save) {
    if (!label || label.getAttribute('contenteditable') !== 'true') return;
    var id = itemIdFromLabel(label);
    var original = String(label.dataset.homeEditOriginal || '');
    var next = String(label.textContent || '').replace(/\u00a0/g, ' ').trim();

    label.removeAttribute('contenteditable');
    label.removeAttribute('spellcheck');
    label.classList.remove('home-inline-edit');
    delete label.dataset.homeEditOriginal;

    if (!save) {
      label.textContent = original;
      return;
    }
    if (id == null || next === original) return;
    persistItemText(id, next);
  }

  function persistCategoryText(id, text) {
    if (typeof window.startEditCategory !== 'function' || typeof window.commitCategoryEdit !== 'function') return;
    window.startEditCategory(id);
    var input = document.getElementById('cat-edit-' + id);
    if (!input) return;
    input.value = text;
    window.commitCategoryEdit(id);
  }

  function beginCategoryEdit(el) {
    if (!el || el.getAttribute('contenteditable') === 'true') {
      focusEditableAtEnd(el);
      return;
    }
    var id = categoryIdFromElement(el);
    if (id == null) return;
    el.dataset.homeCategoryId = String(id);
    el.dataset.homeEditOriginal = String(el.textContent || '');
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');
    focusEditableAtEnd(el);
  }

  function finishCategoryEdit(el, save, addItemAfter) {
    if (!el || el.getAttribute('contenteditable') !== 'true') return;
    var id = Number(el.dataset.homeCategoryId);
    var original = String(el.dataset.homeEditOriginal || '');
    var next = String(el.textContent || '').replace(/\u00a0/g, ' ').trim();

    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    delete el.dataset.homeCategoryId;
    delete el.dataset.homeEditOriginal;

    if (!save) {
      el.textContent = original;
      return;
    }

    if (Number.isFinite(id) && next !== original) persistCategoryText(id, next);
    if (addItemAfter && Number.isFinite(id) && typeof window.startAddItem === 'function') {
      window.startAddItem(id);
      focusInputNow(document.getElementById('new-item-input'));
    }
  }

  function deleteItem(button) {
    var id = Number(button && button.dataset.itemId);
    if (!Number.isFinite(id) || typeof window.deleteSelectedItems !== 'function' || typeof window.toggleSelectedItem !== 'function') return;
    var row = button.closest('.list-item');
    if (!row || !row.classList.contains('selected-row')) window.toggleSelectedItem(id);
    window.deleteSelectedItems();
  }

  function captureClick(event) {
    var root = document.getElementById('items-list');
    if (!root || !root.contains(event.target)) return;

    var del = event.target.closest('.shopping-del');
    if (del) {
      event.preventDefault();
      event.stopPropagation();
      deleteItem(del);
      return;
    }

    var checkbox = event.target.closest('input[type="checkbox"]');
    if (checkbox) return;

    var addRow = event.target.closest('.add-item-line');
    if (addRow && !addRow.querySelector('input:not([type="checkbox"])')) {
      event.preventDefault();
      event.stopPropagation();
      var onclick = String(addRow.getAttribute('onclick') || '');
      var match = onclick.match(/startAddItem\((\d+(?:\.\d+)?)\)/);
      if (typeof window.startAddItem === 'function') {
        if (match) window.startAddItem(Number(match[1]));
        else window.startAddItem();
        focusInputNow(document.getElementById('new-item-input'));
      }
      return;
    }

    var newCategory = event.target.closest('.category-title.new-category');
    if (newCategory && !newCategory.querySelector('input')) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof window.startAddCategory === 'function') {
        window.startAddCategory();
        focusInputNow(document.getElementById('new-category-input'));
      }
      return;
    }

    var category = event.target.closest('.category-title:not(.new-category)');
    if (category && !category.querySelector('input')) {
      event.preventDefault();
      event.stopPropagation();
      beginCategoryEdit(category);
      return;
    }

    var row = event.target.closest('.list-item');
    if (!row || row.querySelector('input.edit-input')) return;
    var label = row.querySelector('label[id^="item-"]');
    if (!label) return;

    if (event.ctrlKey || event.metaKey) {
      var id = itemIdFromLabel(label);
      event.preventDefault();
      event.stopPropagation();
      if (id != null && typeof window.toggleSelectedItem === 'function') window.toggleSelectedItem(id);
      return;
    }

    /* This capture handler intentionally wins over the old inline label onclick.
       The visible label becomes editable immediately, in this exact user gesture. */
    event.preventDefault();
    event.stopPropagation();
    beginItemEdit(label);
  }

  function captureKeydown(event) {
    var itemLabel = event.target.closest && event.target.closest('label[id^="item-"][contenteditable="true"]');
    if (itemLabel) {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        finishItemEdit(itemLabel, true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        finishItemEdit(itemLabel, false);
      }
      return;
    }

    var category = event.target.closest && event.target.closest('.category-title[contenteditable="true"]');
    if (category) {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        /* Restore the old fast flow: Enter on a heading saves it and immediately
           opens a new article row under that heading. */
        finishCategoryEdit(category, true, true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        finishCategoryEdit(category, false, false);
      }
    }
  }

  function captureFocusOut(event) {
    var label = event.target.closest && event.target.closest('label[id^="item-"][contenteditable="true"]');
    if (label) {
      setTimeout(function () {
        if (document.body.contains(label) && label.getAttribute('contenteditable') === 'true') finishItemEdit(label, true);
      }, 0);
      return;
    }
    var category = event.target.closest && event.target.closest('.category-title[contenteditable="true"]');
    if (category) {
      setTimeout(function () {
        if (document.body.contains(category) && category.getAttribute('contenteditable') === 'true') finishCategoryEdit(category, true, false);
      }, 0);
    }
  }

  function wrapRenderItems() {
    if (typeof window.renderItems !== 'function' || window.renderItems.__shoppingHomeParityV4) return false;
    var original = window.renderItems;
    var wrapped = function () {
      var result = original.apply(this, arguments);
      simplifyToolbarLabels();
      decorateRows();
      return result;
    };
    wrapped.__shoppingHomeParityV4 = true;
    window.renderItems = wrapped;
    return true;
  }

  function install() {
    if (window.__shoppingHomeParityV4Installed) return;
    if (typeof window.renderItems !== 'function' || typeof window.startEditItem !== 'function') {
      setTimeout(install, 40);
      return;
    }

    window.__shoppingHomeParityV4Installed = true;
    document.body.classList.remove('shopping-ui-polish-v2');
    document.body.classList.add('shopping-home-parity-v4');
    addStyles();
    simplifyToolbarLabels();
    wrapRenderItems();
    decorateRows();

    document.addEventListener('click', captureClick, true);
    document.addEventListener('keydown', captureKeydown, true);
    document.addEventListener('focusout', captureFocusOut, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
