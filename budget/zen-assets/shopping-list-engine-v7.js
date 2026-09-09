(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  var installed = false;
  var activeListId = null;
  var blurTimer = null;
  var state = {
    editingItem: null,
    editingCategory: null,
    draft: null,
    newCategory: null,
    remoteDirty: false
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function norm(value) {
    return String(value || '').trim().toLocaleLowerCase('sv-SE');
  }

  function parseCategoryInput(value) {
    var cleaned = String(value == null ? '' : value).replace(/\u00a0/g, ' ').trim();
    var match = cleaned.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
    if (!match) return { text: cleaned, category: '' };
    var text = String(match[1] || '').trim();
    var category = String(match[2] || '').trim();
    if (!text || !category) return { text: cleaned, category: '' };
    return { text: text, category: category };
  }

  function getLists() {
    try {
      var parsed = JSON.parse(localStorage.getItem('sh_lists') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveLists(lists, doRender) {
    try { localStorage.setItem('sh_lists', JSON.stringify(lists)); } catch (_) {}
    if (doRender !== false) renderItems();
  }

  function pushUndo() {
    try { if (typeof window.saveState === 'function') window.saveState(); } catch (_) {}
  }

  function getActiveList(lists) {
    lists = Array.isArray(lists) ? lists : [];
    var list = lists.find(function (entry) {
      return Number(entry && entry.id) === Number(activeListId);
    });
    if (!list) {
      list = lists[0] || null;
      activeListId = list ? list.id : null;
    }
    if (list && !Array.isArray(list.items)) list.items = [];
    return list;
  }

  function findCategoryIndex(items, name) {
    var target = norm(name);
    return (items || []).findIndex(function (item) {
      return item && item.type === 'category' && norm(item.text) === target;
    });
  }

  function categoryIdBeforeIndex(items, index) {
    for (var i = index - 1; i >= 0; i--) {
      if (items[i] && items[i].type === 'category') return items[i].id;
    }
    return null;
  }

  function insertUncategorized(items, item) {
    var firstCategory = items.findIndex(function (entry) { return entry && entry.type === 'category'; });
    if (firstCategory < 0) items.push(item);
    else items.splice(firstCategory, 0, item);
  }

  function insertAtCategoryEnd(items, categoryId, item) {
    var categoryIndex = items.findIndex(function (entry) {
      return entry && entry.type === 'category' && Number(entry.id) === Number(categoryId);
    });
    if (categoryIndex < 0) {
      insertUncategorized(items, item);
      return null;
    }
    var at = categoryIndex + 1;
    while (at < items.length && items[at] && items[at].type !== 'category') at++;
    items.splice(at, 0, item);
    return items[categoryIndex].id;
  }

  function insertAfterItem(items, afterItemId, item) {
    var index = items.findIndex(function (entry) {
      return entry && entry.type !== 'category' && Number(entry.id) === Number(afterItemId);
    });
    if (index < 0) return { found: false, categoryId: null };
    var categoryId = categoryIdBeforeIndex(items, index + 1);
    items.splice(index + 1, 0, item);
    return { found: true, categoryId: categoryId };
  }

  function insertNewItem(rawText, checked, anchor, options) {
    options = options || {};
    var parsed = parseCategoryInput(rawText);
    if (!parsed.text) return null;

    var lists = getLists();
    var list = getActiveList(lists);
    if (!list) return null;

    if (options.undo !== false) pushUndo();

    var item = {
      id: Date.now() + Math.random(),
      type: 'item',
      text: parsed.text,
      checked: !!checked
    };
    var actualCategoryId = null;

    if (parsed.category) {
      var targetIndex = findCategoryIndex(list.items, parsed.category);
      if (targetIndex >= 0) {
        actualCategoryId = insertAtCategoryEnd(list.items, list.items[targetIndex].id, item);
      } else {
        insertUncategorized(list.items, item);
      }
    } else if (anchor && anchor.afterItemId != null) {
      var afterResult = insertAfterItem(list.items, anchor.afterItemId, item);
      if (afterResult.found) {
        actualCategoryId = afterResult.categoryId;
      } else if (anchor.categoryId != null) {
        actualCategoryId = insertAtCategoryEnd(list.items, anchor.categoryId, item);
      } else {
        insertUncategorized(list.items, item);
      }
    } else if (anchor && anchor.categoryId != null) {
      actualCategoryId = insertAtCategoryEnd(list.items, anchor.categoryId, item);
    } else {
      insertUncategorized(list.items, item);
    }

    saveLists(lists, options.render !== false);
    return { item: item, categoryId: actualCategoryId };
  }

  function updateExistingItem(id, rawText, options) {
    options = options || {};
    var parsed = parseCategoryInput(rawText);
    var lists = getLists();
    var list = getActiveList(lists);
    if (!list) return null;
    var index = list.items.findIndex(function (entry) {
      return entry && entry.type !== 'category' && Number(entry.id) === Number(id);
    });
    if (index < 0) return null;

    var item = list.items[index];
    var oldText = String(item.text || '').trim();
    var originalCategoryId = categoryIdBeforeIndex(list.items, index + 1);
    var changed = parsed.text !== oldText || !!parsed.category;

    if (!parsed.text) {
      if (options.undo !== false) pushUndo();
      list.items.splice(index, 1);
      saveLists(lists, options.render !== false);
      return { deleted: true, itemId: id, categoryId: originalCategoryId };
    }

    if (!changed) return { item: item, itemId: item.id, categoryId: originalCategoryId, changed: false };
    if (options.undo !== false) pushUndo();

    if (parsed.category) {
      list.items.splice(index, 1);
      item.text = parsed.text;
      var targetIndex = findCategoryIndex(list.items, parsed.category);
      var actualCategoryId = null;
      if (targetIndex >= 0) actualCategoryId = insertAtCategoryEnd(list.items, list.items[targetIndex].id, item);
      else insertUncategorized(list.items, item);
      saveLists(lists, options.render !== false);
      return { item: item, itemId: item.id, categoryId: actualCategoryId, changed: true };
    }

    item.text = parsed.text;
    saveLists(lists, options.render !== false);
    return { item: item, itemId: item.id, categoryId: originalCategoryId, changed: true };
  }

  function updateCategory(id, text, options) {
    options = options || {};
    text = String(text || '').replace(/\u00a0/g, ' ').trim();
    var lists = getLists();
    var list = getActiveList(lists);
    if (!list) return null;
    var index = list.items.findIndex(function (entry) {
      return entry && entry.type === 'category' && Number(entry.id) === Number(id);
    });
    if (index < 0) return null;
    var category = list.items[index];
    var oldText = String(category.text || '').trim();

    if (!text) {
      pushUndo();
      list.items.splice(index, 1);
      saveLists(lists, options.render !== false);
      return { deleted: true, id: id };
    }
    if (text === oldText) return { id: category.id, text: oldText, changed: false };

    pushUndo();
    category.text = text;
    saveLists(lists, options.render !== false);
    return { id: category.id, text: text, changed: true };
  }

  function createCategory(text, options) {
    options = options || {};
    text = String(text || '').replace(/\u00a0/g, ' ').trim();
    if (!text) return null;
    var lists = getLists();
    var list = getActiveList(lists);
    if (!list) return null;
    pushUndo();
    var category = { id: Date.now() + Math.random(), type: 'category', text: text };
    list.items.push(category);
    saveLists(lists, options.render !== false);
    return category;
  }

  function setItemChecked(id, checked) {
    var lists = getLists();
    var list = getActiveList(lists);
    if (!list) return;
    var item = list.items.find(function (entry) {
      return entry && entry.type !== 'category' && Number(entry.id) === Number(id);
    });
    if (!item || item.checked === !!checked) return;
    pushUndo();
    item.checked = !!checked;
    saveLists(lists, false);
  }

  function deleteItem(id) {
    var lists = getLists();
    var list = getActiveList(lists);
    if (!list) return;
    var before = list.items.length;
    list.items = list.items.filter(function (entry) {
      return entry && (entry.type === 'category' || Number(entry.id) !== Number(id));
    });
    if (list.items.length === before) return;
    pushUndo();
    saveLists(lists, true);
  }

  function activeEditorExists() {
    return !!(state.editingItem || state.editingCategory || state.draft || state.newCategory);
  }

  window.addEventListener('firebase-sync', function (event) {
    if (!installed) return;
    var key = event && event.detail && event.detail.key;
    if (!key || key.indexOf('sh_') !== 0) return;

    if (key === 'sh_lists') {
      event.stopImmediatePropagation();
      if (activeEditorExists()) state.remoteDirty = true;
      else renderItems();
      try { if (typeof window.renderListsMenu === 'function') window.renderListsMenu(); } catch (_) {}
      return;
    }

    if (activeEditorExists()) {
      state.remoteDirty = true;
      event.stopImmediatePropagation();
    }
  }, true);

  function focusEditable(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); }
    catch (_) { try { el.focus(); } catch (ignore) {} }
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (_) {}
  }

  function isSelected(id) {
    try { return !!selectedItemIds && selectedItemIds.has(id); } catch (_) { return false; }
  }

  function draftHtml() {
    var checked = !!(state.draft && state.draft.checked);
    var text = state.draft ? state.draft.text : '';
    return '<div class="list-item shopping-draft-row" data-shopping-draft-row="true">' +
      '<input type="checkbox" data-action="draft-check" ' + (checked ? 'checked' : '') + '>' +
      '<div class="item-text shopping-draft-editor" contenteditable="true" spellcheck="true" data-placeholder="+ Lägg till artikel">' + escapeHtml(text) + '</div>' +
      '<span class="shopping-del shopping-draft-spacer" aria-hidden="true"></span>' +
    '</div>';
  }

  function itemHtml(item) {
    var editing = state.editingItem && Number(state.editingItem.id) === Number(item.id);
    var text = editing ? state.editingItem.text : String(item.text || '');
    return '<div class="list-item ' + (isSelected(item.id) ? 'selected-row ' : '') + (item.checked ? 'done ' : '') + '" data-item-id="' + item.id + '">' +
      '<input type="checkbox" data-action="toggle-item" ' + (item.checked ? 'checked' : '') + '>' +
      '<div class="item-text' + (item.checked ? ' done' : '') + '" ' +
        (editing ? 'contenteditable="true" spellcheck="true" data-editing-item="true"' : '') + '>' + escapeHtml(text) + '</div>' +
      '<button class="shopping-del" type="button" data-action="delete-item" aria-label="Radera ' + escapeHtml(item.text || 'artikel') + '">✕</button>' +
    '</div>';
  }

  function categoryHtml(category) {
    var editing = state.editingCategory && Number(state.editingCategory.id) === Number(category.id);
    var text = editing ? state.editingCategory.text : String(category.text || '');
    return '<div class="category-title" data-category-id="' + category.id + '" ' +
      (editing ? 'contenteditable="true" spellcheck="true" data-editing-category="true"' : '') + '>' +
      escapeHtml(text) +
    '</div>';
  }

  function newCategoryHtml() {
    if (state.newCategory) {
      return '<div class="category-title new-category shopping-new-category-editor" contenteditable="true" spellcheck="true" data-new-category-editor="true" data-placeholder="Rubrik...">' +
        escapeHtml(state.newCategory.text || '') +
      '</div>';
    }
    return '<div class="category-title new-category" data-action="add-category">+ Lägg till rubrik</div>';
  }

  function addLineHtml(categoryId) {
    var attr = categoryId == null ? '' : ' data-category-id="' + categoryId + '"';
    return '<div class="add-item-line" data-action="add-item"' + attr + '><span>+ Lägg till artikel</span></div>';
  }

  function renderItems() {
    var lists = getLists();
    var list = getActiveList(lists);
    var root = document.getElementById('items-list');
    if (!root) return;
    var items = list && Array.isArray(list.items) ? list.items : [];
    var html = '';
    var activeCategoryId = null;
    var draftRendered = false;

    if (!items.length) {
      if (state.draft && state.draft.categoryId == null) {
        html += draftHtml();
        draftRendered = true;
      } else if (!state.draft) {
        html += addLineHtml(null);
      }
      html += newCategoryHtml();
      root.innerHTML = html;
      focusActiveEditor(root);
      return;
    }

    items.forEach(function (item, index) {
      var next = items[index + 1] || null;

      if (item.type === 'category') {
        if (!draftRendered && state.draft && state.draft.categoryId == null && state.draft.afterItemId == null && activeCategoryId == null) {
          html += draftHtml();
          draftRendered = true;
        }

        activeCategoryId = item.id;
        html += categoryHtml(item);

        if (!next || next.type === 'category') {
          if (!draftRendered && state.draft && Number(state.draft.categoryId) === Number(item.id) && state.draft.afterItemId == null) {
            html += draftHtml();
            draftRendered = true;
          } else if (!state.draft) {
            html += addLineHtml(item.id);
          }
        }
        return;
      }

      html += itemHtml(item);

      if (!draftRendered && state.draft && state.draft.afterItemId != null && Number(state.draft.afterItemId) === Number(item.id)) {
        html += draftHtml();
        draftRendered = true;
      } else if (!draftRendered && state.draft && state.draft.afterItemId == null && Number(state.draft.categoryId) === Number(activeCategoryId) && (!next || next.type === 'category')) {
        html += draftHtml();
        draftRendered = true;
      }
    });

    if (!draftRendered && state.draft) html += draftHtml();
    html += newCategoryHtml();
    root.innerHTML = html;
    focusActiveEditor(root);
  }

  function focusActiveEditor(root) {
    if (!root) return;
    var target = null;
    if (state.editingItem) target = root.querySelector('[data-item-id="' + state.editingItem.id + '"] .item-text[contenteditable="true"]');
    else if (state.editingCategory) target = root.querySelector('[data-category-id="' + state.editingCategory.id + '"][contenteditable="true"]');
    else if (state.draft) target = root.querySelector('.shopping-draft-editor[contenteditable="true"]');
    else if (state.newCategory) target = root.querySelector('.shopping-new-category-editor[contenteditable="true"]');
    if (target) focusEditable(target);
  }

  function cancelBlurTimer() {
    if (blurTimer) {
      clearTimeout(blurTimer);
      blurTimer = null;
    }
  }

  function commitEditingItem(openNext, doRender) {
    if (!state.editingItem) return null;
    var current = state.editingItem;
    state.editingItem = null;
    var result = updateExistingItem(current.id, current.text, { render: false });
    if (openNext && result && !result.deleted) {
      state.draft = { categoryId: result.categoryId, afterItemId: result.itemId, text: '', checked: false };
    }
    if (doRender !== false) renderItems();
    return result;
  }

  function commitEditingCategory(openItem, doRender) {
    if (!state.editingCategory) return null;
    var current = state.editingCategory;
    state.editingCategory = null;
    var result = updateCategory(current.id, current.text, { render: false });
    if (openItem && result && !result.deleted) {
      state.draft = { categoryId: current.id, afterItemId: null, text: '', checked: false };
    }
    if (doRender !== false) renderItems();
    return result;
  }

  function commitDraft(continueAdding, doRender) {
    if (!state.draft) return null;
    var current = state.draft;
    var text = String(current.text || '').replace(/\u00a0/g, ' ').trim();
    state.draft = null;
    var result = null;
    if (text) {
      result = insertNewItem(text, !!current.checked, current, { render: false });
      if (continueAdding && result) {
        state.draft = { categoryId: result.categoryId, afterItemId: result.item.id, text: '', checked: false };
      }
    } else if (continueAdding) {
      state.draft = current;
      state.draft.text = '';
    }
    if (doRender !== false) renderItems();
    return result;
  }

  function commitNewCategory(openItem, doRender) {
    if (!state.newCategory) return null;
    var text = String(state.newCategory.text || '').replace(/\u00a0/g, ' ').trim();
    state.newCategory = null;
    var category = text ? createCategory(text, { render: false }) : null;
    if (openItem && category) {
      state.draft = { categoryId: category.id, afterItemId: null, text: '', checked: false };
    }
    if (doRender !== false) renderItems();
    return category;
  }

  function commitActive(doRender) {
    if (state.editingItem) return commitEditingItem(false, doRender);
    if (state.editingCategory) return commitEditingCategory(false, doRender);
    if (state.draft) return commitDraft(false, doRender);
    if (state.newCategory) return commitNewCategory(false, doRender);
    if (doRender !== false && state.remoteDirty) {
      state.remoteDirty = false;
      renderItems();
    }
    return null;
  }

  function beginItemEdit(id) {
    cancelBlurTimer();
    if (state.editingItem && Number(state.editingItem.id) === Number(id)) {
      focusActiveEditor(document.getElementById('items-list'));
      return;
    }
    if (activeEditorExists()) commitActive(false);
    var lists = getLists();
    var list = getActiveList(lists);
    var item = list && list.items.find(function (entry) { return entry && entry.type !== 'category' && Number(entry.id) === Number(id); });
    if (!item) return;
    state.editingItem = { id: item.id, text: String(item.text || ''), original: String(item.text || '') };
    renderItems();
  }

  function beginCategoryEdit(id) {
    cancelBlurTimer();
    if (state.editingCategory && Number(state.editingCategory.id) === Number(id)) {
      focusActiveEditor(document.getElementById('items-list'));
      return;
    }
    if (activeEditorExists()) commitActive(false);
    var lists = getLists();
    var list = getActiveList(lists);
    var category = list && list.items.find(function (entry) { return entry && entry.type === 'category' && Number(entry.id) === Number(id); });
    if (!category) return;
    state.editingCategory = { id: category.id, text: String(category.text || ''), original: String(category.text || '') };
    renderItems();
  }

  function beginDraft(categoryId, afterItemId) {
    cancelBlurTimer();
    if (activeEditorExists()) commitActive(false);
    state.draft = {
      categoryId: categoryId == null ? null : categoryId,
      afterItemId: afterItemId == null ? null : afterItemId,
      text: '',
      checked: false
    };
    renderItems();
  }

  function beginNewCategory() {
    cancelBlurTimer();
    if (activeEditorExists()) commitActive(false);
    state.newCategory = { text: '' };
    renderItems();
  }

  function currentEditorContains(target) {
    if (!target || !target.closest) return false;
    if (state.editingItem && target.closest('[data-editing-item="true"]')) return true;
    if (state.editingCategory && target.closest('[data-editing-category="true"]')) return true;
    if (state.draft && target.closest('.shopping-draft-editor')) return true;
    if (state.newCategory && target.closest('.shopping-new-category-editor')) return true;
    return false;
  }

  function handleClick(event) {
    cancelBlurTimer();
    var root = document.getElementById('items-list');
    if (!root || !root.contains(event.target)) return;

    if (currentEditorContains(event.target)) return;

    var deleteButton = event.target.closest('[data-action="delete-item"]');
    var checkbox = event.target.closest('input[type="checkbox"]');
    var addItem = event.target.closest('[data-action="add-item"]');
    var addCategory = event.target.closest('[data-action="add-category"]');
    var category = event.target.closest('[data-category-id]');
    var row = event.target.closest('.list-item[data-item-id]');
    var hadActive = activeEditorExists();

    if (hadActive) commitActive(false);

    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();
      var deleteRow = deleteButton.closest('[data-item-id]');
      if (deleteRow) deleteItem(Number(deleteRow.dataset.itemId));
      return;
    }

    if (checkbox) {
      if (hadActive) setTimeout(renderItems, 0);
      return;
    }

    if (addItem) {
      event.preventDefault();
      event.stopPropagation();
      var catAttr = addItem.getAttribute('data-category-id');
      beginDraft(catAttr == null ? null : Number(catAttr), null);
      return;
    }

    if (addCategory) {
      event.preventDefault();
      event.stopPropagation();
      beginNewCategory();
      return;
    }

    if (category && category.classList.contains('category-title') && !category.classList.contains('new-category')) {
      event.preventDefault();
      event.stopPropagation();
      beginCategoryEdit(Number(category.dataset.categoryId));
      return;
    }

    if (row) {
      var id = Number(row.dataset.itemId);
      if ((event.ctrlKey || event.metaKey) && typeof window.toggleSelectedItem === 'function') {
        event.preventDefault();
        event.stopPropagation();
        window.toggleSelectedItem(id);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      beginItemEdit(id);
    }
  }

  function handleInput(event) {
    var target = event.target;
    if (!target || !target.closest) return;
    if (state.editingItem && target.matches('[data-editing-item="true"]')) {
      state.editingItem.text = target.textContent || '';
      return;
    }
    if (state.editingCategory && target.matches('[data-editing-category="true"]')) {
      state.editingCategory.text = target.textContent || '';
      return;
    }
    if (state.draft && target.matches('.shopping-draft-editor')) {
      state.draft.text = target.textContent || '';
      return;
    }
    if (state.newCategory && target.matches('.shopping-new-category-editor')) {
      state.newCategory.text = target.textContent || '';
    }
  }

  function handleKeydown(event) {
    var target = event.target;
    if (!target || !target.closest) return;

    if (state.editingItem && target.matches('[data-editing-item="true"]')) {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        state.editingItem.text = target.textContent || '';
        commitEditingItem(true, true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        state.editingItem = null;
        renderItems();
      }
      return;
    }

    if (state.editingCategory && target.matches('[data-editing-category="true"]')) {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        state.editingCategory.text = target.textContent || '';
        commitEditingCategory(true, true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        state.editingCategory = null;
        renderItems();
      }
      return;
    }

    if (state.draft && target.matches('.shopping-draft-editor')) {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        state.draft.text = target.textContent || '';
        commitDraft(true, true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        state.draft = null;
        renderItems();
      }
      return;
    }

    if (state.newCategory && target.matches('.shopping-new-category-editor')) {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        state.newCategory.text = target.textContent || '';
        commitNewCategory(true, true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        state.newCategory = null;
        renderItems();
      }
    }
  }

  function handleFocusOut(event) {
    if (!activeEditorExists()) return;
    var root = document.getElementById('items-list');
    if (!root || !root.contains(event.target)) return;
    cancelBlurTimer();
    blurTimer = setTimeout(function () {
      blurTimer = null;
      if (!activeEditorExists()) return;
      commitActive(true);
      state.remoteDirty = false;
    }, 0);
  }

  function handleChange(event) {
    var target = event.target;
    if (!target || target.type !== 'checkbox') return;
    var root = document.getElementById('items-list');
    if (!root || !root.contains(target)) return;

    if (target.dataset.action === 'draft-check') {
      if (state.draft) {
        state.draft.checked = !!target.checked;
        var text = String(state.draft.text || '').trim();
        if (text) commitDraft(true, true);
      }
      return;
    }

    if (target.dataset.action === 'toggle-item') {
      var row = target.closest('[data-item-id]');
      if (!row) return;
      setItemChecked(Number(row.dataset.itemId), !!target.checked);
      var text = row.querySelector('.item-text');
      row.classList.toggle('done', !!target.checked);
      if (text) text.classList.toggle('done', !!target.checked);
    }
  }

  function simplifyToolbarLabels() {
    document.querySelectorAll('.header-right-top .dropdown-btn').forEach(function (button) {
      var next = String(button.textContent || '').replace(/^\s*☰\s*/, '').trim();
      if (next && button.textContent !== next) button.textContent = next;
    });
  }

  function addStyles() {
    if (document.getElementById('shopping-list-engine-v7-style')) return;
    var style = document.createElement('style');
    style.id = 'shopping-list-engine-v7-style';
    style.textContent = `
      body.shopping-list-engine-v7 header{gap:8px!important;margin-bottom:16px!important;padding-bottom:10px!important}
      body.shopping-list-engine-v7 .header-shell{position:relative!important;display:flex!important;align-items:center!important;width:100%!important}
      body.shopping-list-engine-v7 .header-top{display:flex!important;align-items:center!important;flex-wrap:nowrap!important;gap:5px!important;width:100%!important;padding:0 39px 0 0!important}
      body.shopping-list-engine-v7 .header-left{flex:0 0 auto!important;width:auto!important;padding:0!important}
      body.shopping-list-engine-v7 .header-right-top{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex:1 1 auto!important;flex-wrap:nowrap!important;gap:5px!important;width:auto!important;margin:0!important}
      body.shopping-list-engine-v7 .header-right-top .dropdown-wrapper{min-width:0!important;width:auto!important;flex:0 1 auto!important}
      body.shopping-list-engine-v7 .home-btn,body.shopping-list-engine-v7 .dropdown-btn{height:34px!important;min-height:34px!important;min-width:0!important;padding:0 10px!important;border-radius:8px!important;background:rgba(255,255,255,.035)!important;border:1px solid rgba(255,255,255,.08)!important;color:var(--text)!important;font-size:11px!important;font-weight:600!important;white-space:nowrap!important;transition:background-color .16s ease,border-color .16s ease,transform .12s ease!important}
      body.shopping-list-engine-v7 .home-btn:hover,body.shopping-list-engine-v7 .dropdown-btn:hover{background:rgba(255,255,255,.065)!important;border-color:rgba(251,191,36,.34)!important}
      body.shopping-list-engine-v7 .home-btn:active,body.shopping-list-engine-v7 .dropdown-btn:active{transform:scale(.97)}
      body.shopping-list-engine-v7 .undo-btn{width:25px!important;min-width:25px!important;height:34px!important;min-height:34px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:var(--text-sec)!important;font-size:20px!important;font-weight:500!important;opacity:.82;transition:color .16s ease,opacity .16s ease,transform .12s ease!important}
      body.shopping-list-engine-v7 .undo-btn:hover{color:var(--accent)!important;opacity:1}body.shopping-list-engine-v7 .undo-btn:active{transform:scale(.88)}
      body.shopping-list-engine-v7 .nav-dropdown-wrapper{position:absolute!important;right:0!important;top:0!important;transform:none!important;align-self:auto!important}
      body.shopping-list-engine-v7 .nav-btn{width:34px!important;min-width:34px!important;height:34px!important;border-radius:8px!important;font-size:16px!important}
      body.shopping-list-engine-v7 #items-list{display:block}
      body.shopping-list-engine-v7 .list-item{display:grid!important;grid-template-columns:20px minmax(0,1fr) 22px!important;align-items:center!important;gap:8px!important;min-height:39px!important;padding:7px 4px!important;margin:0!important;border-bottom:1px solid rgba(255,255,255,.07)!important;border-radius:0!important;background:transparent!important;font-size:14px!important;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:background-color .16s ease!important}
      body.shopping-list-engine-v7 .list-item:hover{background:rgba(255,255,255,.018)!important}body.shopping-list-engine-v7 .list-item.selected-row{background:rgba(251,191,36,.07)!important}
      body.shopping-list-engine-v7 .list-item input[type="checkbox"]{-webkit-appearance:none!important;appearance:none!important;display:grid!important;place-content:center!important;width:16px!important;height:16px!important;min-width:16px!important;margin:0!important;padding:0!important;border:1px solid rgba(148,163,184,.72)!important;border-radius:4px!important;background:transparent!important;background-image:none!important;cursor:pointer!important;box-shadow:0 0 0 1px rgba(15,23,42,.65),inset 0 1px 0 rgba(255,255,255,.05)!important;transition:border-color .16s ease,background-color .16s ease,box-shadow .16s ease,transform .12s ease!important}
      body.shopping-list-engine-v7 .list-item input[type="checkbox"]::before{content:'';width:7px;height:4px;border-left:2px solid #FBBF24;border-bottom:2px solid #FBBF24;transform:rotate(-45deg) scale(0);transform-origin:center;transition:transform .12s ease}
      body.shopping-list-engine-v7 .list-item input[type="checkbox"]:checked{background:rgba(251,191,36,.035)!important;border-color:rgba(251,191,36,.78)!important;box-shadow:0 0 0 2px rgba(251,191,36,.18),inset 0 1px 0 rgba(255,255,255,.05)!important}
      body.shopping-list-engine-v7 .list-item input[type="checkbox"]:checked::before{transform:rotate(-45deg) scale(1)}body.shopping-list-engine-v7 .list-item input[type="checkbox"]:active{transform:scale(.84)}
      body.shopping-list-engine-v7 .item-text{grid-column:2;display:flex;align-items:center;width:100%;min-width:0;min-height:25px;padding:3px 7px;margin:-3px -7px;border:1px solid transparent;border-radius:6px;color:var(--text);cursor:text;outline:none;text-decoration:none;-webkit-user-select:text;user-select:text;white-space:pre-wrap;overflow-wrap:anywhere}
      body.shopping-list-engine-v7 .item-text.done{text-decoration:line-through;color:var(--text-sec)}
      body.shopping-list-engine-v7 .item-text[contenteditable="true"]{background:rgba(251,191,36,.045);border-color:rgba(251,191,36,.56);box-shadow:0 0 0 2px rgba(251,191,36,.08);text-decoration:none;color:var(--text)}
      body.shopping-list-engine-v7 [contenteditable="true"][data-placeholder]:empty::before{content:attr(data-placeholder);color:var(--text-dim);pointer-events:none}
      body.shopping-list-engine-v7 .shopping-del{grid-column:3;width:22px;height:28px;display:grid;place-items:center;border:0;padding:0;background:transparent;color:var(--text-sec);font:500 14px/1 Inter,sans-serif;cursor:pointer;opacity:.55;transition:color .16s ease,opacity .16s ease,transform .12s ease}
      body.shopping-list-engine-v7 .shopping-del:hover{color:#F87171;opacity:1}body.shopping-list-engine-v7 .shopping-del:active{transform:scale(.86)}body.shopping-list-engine-v7 .shopping-draft-spacer{pointer-events:none;opacity:0}
      body.shopping-list-engine-v7 .category-title{min-height:0!important;margin:7px 2px 1px!important;padding:8px 5px 5px!important;border-bottom:1px solid rgba(251,191,36,.18)!important;color:var(--accent)!important;font-size:12px!important;line-height:1.2!important;font-weight:800!important;letter-spacing:.8px!important;text-transform:uppercase!important;cursor:text!important;transition:background-color .16s ease,color .16s ease!important;outline:none!important;white-space:pre-wrap;overflow-wrap:anywhere}
      body.shopping-list-engine-v7 .category-title:hover{background:rgba(251,191,36,.025)}body.shopping-list-engine-v7 .category-title[contenteditable="true"]{border-radius:5px;background:rgba(251,191,36,.055)!important;box-shadow:inset 0 0 0 1px rgba(251,191,36,.24)}
      body.shopping-list-engine-v7 .category-title.new-category{margin-top:8px!important;border-bottom:0!important;color:var(--text-sec)!important;text-transform:none!important;letter-spacing:0!important;font-size:12px!important;font-weight:600!important;padding:7px 5px!important}
      body.shopping-list-engine-v7 .shopping-new-category-editor{color:var(--accent)!important;background:rgba(251,191,36,.045)!important;box-shadow:inset 0 0 0 1px rgba(251,191,36,.24)!important}
      body.shopping-list-engine-v7 .add-item-line{display:grid!important;grid-template-columns:20px minmax(0,1fr) 22px!important;align-items:center!important;gap:8px!important;min-height:39px!important;padding:7px 4px!important;border-bottom:1px solid rgba(255,255,255,.07)!important;border-radius:0!important;color:var(--text-sec)!important;cursor:text!important;transition:background-color .16s ease,color .16s ease!important;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      body.shopping-list-engine-v7 .add-item-line:hover{background:rgba(255,255,255,.018)!important;color:var(--text)!important}body.shopping-list-engine-v7 .add-item-line span{grid-column:2 / 4;width:100%;min-height:25px;display:flex;align-items:center;cursor:text!important}
      @media(max-width:520px){body.shopping-list-engine-v7 .wrap{padding-left:12px;padding-right:12px}body.shopping-list-engine-v7 .header-top{gap:4px!important;padding-right:37px!important}body.shopping-list-engine-v7 .header-right-top{gap:4px!important}body.shopping-list-engine-v7 .home-btn,body.shopping-list-engine-v7 .dropdown-btn{height:33px!important;min-height:33px!important;padding:0 7px!important;font-size:10px!important}body.shopping-list-engine-v7 .undo-btn{width:21px!important;min-width:21px!important;height:33px!important;font-size:19px!important}body.shopping-list-engine-v7 .nav-btn{width:33px!important;min-width:33px!important;height:33px!important}body.shopping-list-engine-v7 .list-item,body.shopping-list-engine-v7 .add-item-line{min-height:42px!important;padding-top:8px!important;padding-bottom:8px!important}body.shopping-list-engine-v7 .item-text{min-height:27px;font-size:14px}body.shopping-list-engine-v7 .category-title{font-size:11px!important;letter-spacing:.72px!important}body.shopping-list-engine-v7 #recipes-list input[type="text"],body.shopping-list-engine-v7 .logo input{font-size:16px!important}}
      @media(max-width:370px){body.shopping-list-engine-v7 .home-btn,body.shopping-list-engine-v7 .dropdown-btn{padding-left:5px!important;padding-right:5px!important;font-size:9.5px!important}body.shopping-list-engine-v7 .header-top,body.shopping-list-engine-v7 .header-right-top{gap:3px!important}}
    `;
    document.head.appendChild(style);
  }

  function wrapListNavigation() {
    if (typeof window.selectList === 'function' && !window.selectList.__shoppingListEngineV7) {
      var originalSelect = window.selectList;
      var select = function (id) {
        cancelBlurTimer();
        state.editingItem = state.editingCategory = state.draft = state.newCategory = null;
        activeListId = id;
        return originalSelect.apply(this, arguments);
      };
      select.__shoppingListEngineV7 = true;
      window.selectList = select;
    }

    if (typeof window.createNewList === 'function' && !window.createNewList.__shoppingListEngineV7) {
      var originalCreate = window.createNewList;
      var create = function () {
        var before = getLists().map(function (list) { return String(list.id); });
        var result = originalCreate.apply(this, arguments);
        var after = getLists();
        var created = after.find(function (list) { return before.indexOf(String(list.id)) < 0; });
        if (created) activeListId = created.id;
        renderItems();
        return result;
      };
      create.__shoppingListEngineV7 = true;
      window.createNewList = create;
    }

    if (typeof window.deleteList === 'function' && !window.deleteList.__shoppingListEngineV7) {
      var originalDelete = window.deleteList;
      var del = function () {
        var result = originalDelete.apply(this, arguments);
        var lists = getLists();
        if (!lists.some(function (list) { return Number(list.id) === Number(activeListId); })) activeListId = lists[0] ? lists[0].id : null;
        renderItems();
        return result;
      };
      del.__shoppingListEngineV7 = true;
      window.deleteList = del;
    }
  }

  function installCompatibilityApi() {
    window.renderItems = renderItems;
    window.startAddItem = function (categoryId) { beginDraft(categoryId == null ? null : Number(categoryId), null); };
    window.saveNewItem = function (event) {
      if (event && event.key && event.key !== 'Enter') return;
      if (event) event.preventDefault();
      if (state.draft) commitDraft(!!(event && event.key === 'Enter'), true);
    };
    window.cancelAddItem = function () { if (state.draft) commitDraft(false, true); };
    window.commitNewItemDraft = function (checked) { if (state.draft) { state.draft.checked = !!checked; commitDraft(true, true); } };
    window.startAddCategory = beginNewCategory;
    window.saveNewCategory = function (event) {
      if (event && event.key && event.key !== 'Enter') return;
      if (event) event.preventDefault();
      if (state.newCategory) commitNewCategory(!!(event && event.key === 'Enter'), true);
    };
    window.cancelAddCategory = function () { if (state.newCategory) commitNewCategory(false, true); };
    window.startEditItem = function (id) { beginItemEdit(Number(id)); };
    window.saveEditItem = function (id, event) {
      if (event && event.key && event.key !== 'Enter') return;
      if (event) event.preventDefault();
      if (state.editingItem && Number(state.editingItem.id) === Number(id)) commitEditingItem(!!(event && event.key === 'Enter'), true);
    };
    window.cancelEditItem = function (id) { if (state.editingItem && Number(state.editingItem.id) === Number(id)) commitEditingItem(false, true); };
    window.handleItemKeydown = function (id, event) {
      if (!state.editingItem || Number(state.editingItem.id) !== Number(id)) return;
      if (event.key === 'Enter') { event.preventDefault(); commitEditingItem(true, true); }
      else if (event.key === 'Escape') { event.preventDefault(); state.editingItem = null; renderItems(); }
    };
    window.commitItemDraft = function (id, checked) {
      if (state.editingItem && Number(state.editingItem.id) === Number(id)) {
        var result = commitEditingItem(false, false);
        if (result && !result.deleted) setItemChecked(result.itemId, !!checked);
        renderItems();
      }
    };
    window.startEditCategory = function (id) { beginCategoryEdit(Number(id)); };
    window.commitCategoryEdit = function (id) { if (state.editingCategory && Number(state.editingCategory.id) === Number(id)) commitEditingCategory(false, true); };
    window.handleCategoryKeydown = function (id, event) {
      if (!state.editingCategory || Number(state.editingCategory.id) !== Number(id)) return;
      if (event.key === 'Enter') { event.preventDefault(); commitEditingCategory(true, true); }
      else if (event.key === 'Escape') { event.preventDefault(); state.editingCategory = null; renderItems(); }
    };
  }

  function upsertRecipeItems(rawItems, checked) {
    rawItems = Array.isArray(rawItems) ? rawItems : [rawItems];
    var lists = getLists();
    var list = getActiveList(lists);
    if (!list) return;
    var changed = false;
    rawItems.forEach(function (rawText) {
      var parsed = parseCategoryInput(rawText);
      if (!parsed.text) return;
      var existing = list.items.find(function (entry) { return entry && entry.type !== 'category' && norm(entry.text) === norm(parsed.text); });
      if (existing) {
        if (typeof checked === 'boolean') existing.checked = !!checked;
        if (parsed.category) {
          var oldIndex = list.items.indexOf(existing);
          list.items.splice(oldIndex, 1);
          var catIndex = findCategoryIndex(list.items, parsed.category);
          if (catIndex >= 0) insertAtCategoryEnd(list.items, list.items[catIndex].id, existing);
          else insertUncategorized(list.items, existing);
        }
        changed = true;
        return;
      }
      var item = { id: Date.now() + Math.random(), type: 'item', text: parsed.text, checked: !!checked };
      if (parsed.category) {
        var targetIndex = findCategoryIndex(list.items, parsed.category);
        if (targetIndex >= 0) insertAtCategoryEnd(list.items, list.items[targetIndex].id, item);
        else insertUncategorized(list.items, item);
      } else {
        var firstCategory = list.items.find(function (entry) { return entry && entry.type === 'category'; });
        if (firstCategory) insertAtCategoryEnd(list.items, firstCategory.id, item);
        else list.items.push(item);
      }
      changed = true;
    });
    if (changed) saveLists(lists, true);
  }

  function routeRecipeRaw(rawText) {
    var parsed = parseCategoryInput(rawText);
    if (!parsed.category || !parsed.text) return;
    var lists = getLists();
    var list = getActiveList(lists);
    if (!list) return;
    var raw = String(rawText || '').trim();
    var rawItem = null;
    for (var i = list.items.length - 1; i >= 0; i--) {
      var entry = list.items[i];
      if (entry && entry.type !== 'category' && String(entry.text || '').trim() === raw) {
        rawItem = entry;
        list.items.splice(i, 1);
        break;
      }
    }
    if (!rawItem) return;
    rawItem.text = parsed.text;
    var existing = list.items.find(function (entry) { return entry && entry.type !== 'category' && norm(entry.text) === norm(parsed.text); });
    var target = existing || rawItem;
    if (existing) {
      existing.checked = !!rawItem.checked;
      var existingIndex = list.items.indexOf(existing);
      if (existingIndex >= 0) list.items.splice(existingIndex, 1);
    }
    var targetIndex = findCategoryIndex(list.items, parsed.category);
    if (targetIndex >= 0) insertAtCategoryEnd(list.items, list.items[targetIndex].id, target);
    else insertUncategorized(list.items, target);
    saveLists(lists, true);
  }

  function rawIngredientChecked(rawText) {
    var parsed = parseCategoryInput(rawText);
    var list = getActiveList(getLists());
    if (!list) return false;
    var item = list.items.find(function (entry) { return entry && entry.type !== 'category' && norm(entry.text) === norm(parsed.text); });
    return !!(item && item.checked);
  }

  function install() {
    if (installed) return;
    if (typeof window.renderItems !== 'function' || !document.getElementById('items-list')) {
      setTimeout(install, 40);
      return;
    }
    installed = true;
    var lists = getLists();
    activeListId = lists[0] ? lists[0].id : null;
    document.body.classList.remove('shopping-home-parity-v4', 'shopping-ui-polish-v2');
    document.body.classList.add('shopping-list-engine-v7');
    addStyles();
    simplifyToolbarLabels();
    wrapListNavigation();
    installCompatibilityApi();
    var root = document.getElementById('items-list');
    root.addEventListener('click', handleClick, false);
    root.addEventListener('input', handleInput, false);
    root.addEventListener('keydown', handleKeydown, false);
    root.addEventListener('focusout', handleFocusOut, false);
    root.addEventListener('change', handleChange, false);
    window.__shoppingListEngineV7 = {
      parseCategoryInput: parseCategoryInput,
      upsertRecipeItems: upsertRecipeItems,
      routeRecipeRaw: routeRecipeRaw,
      rawIngredientChecked: rawIngredientChecked,
      renderItems: renderItems,
      getActiveListId: function () { return activeListId; }
    };
    renderItems();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 0); }, { once: true });
  else setTimeout(install, 0);
})();
