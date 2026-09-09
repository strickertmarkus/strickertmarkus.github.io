(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  var activeListId = null;

  function parseCategoryInput(value) {
    var cleaned = String(value == null ? '' : value).trim();
    var match = cleaned.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
    if (!match) return { text: cleaned, category: '' };
    var text = String(match[1] || '').trim();
    var category = String(match[2] || '').trim();
    if (!text || !category) return { text: cleaned, category: '' };
    return { text: text, category: category };
  }

  function norm(value) {
    return String(value || '').trim().toLocaleLowerCase('sv-SE');
  }

  function getLists() {
    try {
      var value = JSON.parse(localStorage.getItem('sh_lists') || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  function saveLists(lists, render) {
    try { localStorage.setItem('sh_lists', JSON.stringify(lists)); } catch (_) {}
    if (render !== false && typeof window.renderItems === 'function') {
      try { window.renderItems(); } catch (_) {}
    }
  }

  function getActiveList(lists) {
    lists = Array.isArray(lists) ? lists : [];
    var list = lists.find(function (entry) { return Number(entry && entry.id) === Number(activeListId); });
    if (!list) {
      list = lists[0] || null;
      activeListId = list ? list.id : null;
    }
    return list;
  }

  function categoryIndex(items, name) {
    var target = norm(name);
    return (items || []).findIndex(function (item) {
      return item && item.type === 'category' && norm(item.text) === target;
    });
  }

  function insertAtTop(items, item) {
    var firstCategory = (items || []).findIndex(function (entry) { return entry && entry.type === 'category'; });
    if (firstCategory < 0) items.push(item);
    else items.splice(firstCategory, 0, item);
  }

  function insertInCategory(items, index, item) {
    if (index < 0) return insertAtTop(items, item);
    var at = index + 1;
    while (at < items.length && items[at] && items[at].type !== 'category') at++;
    items.splice(at, 0, item);
  }

  function routeItemById(id, rawText) {
    var parsed = parseCategoryInput(rawText);
    if (!parsed.category || !parsed.text) return false;

    var lists = getLists();
    var changed = false;
    lists.some(function (list) {
      if (!Array.isArray(list.items)) return false;
      var index = list.items.findIndex(function (item) { return item && Number(item.id) === Number(id); });
      if (index < 0) return false;

      var item = list.items[index];
      list.items.splice(index, 1);
      item.text = parsed.text;
      var cat = categoryIndex(list.items, parsed.category);
      insertInCategory(list.items, cat, item);
      activeListId = list.id;
      changed = true;
      return true;
    });

    if (changed) saveLists(lists, true);
    return changed;
  }

  function routeNewestRaw(rawText, idsBefore) {
    var parsed = parseCategoryInput(rawText);
    if (!parsed.category || !parsed.text) return false;
    var lists = getLists();
    var candidate = null;
    var candidateList = null;

    lists.forEach(function (list) {
      (list.items || []).forEach(function (item) {
        if (!item || item.type === 'category') return;
        if (idsBefore && idsBefore.has(String(item.id))) return;
        if (String(item.text || '').trim() !== String(rawText || '').trim()) return;
        if (!candidate || Number(item.id) > Number(candidate.id)) {
          candidate = item;
          candidateList = list;
        }
      });
    });
    if (!candidate || !candidateList) return false;

    var index = candidateList.items.indexOf(candidate);
    if (index >= 0) candidateList.items.splice(index, 1);
    candidate.text = parsed.text;
    insertInCategory(candidateList.items, categoryIndex(candidateList.items, parsed.category), candidate);
    activeListId = candidateList.id;
    saveLists(lists, true);
    return true;
  }

  function allItemIds() {
    var ids = new Set();
    getLists().forEach(function (list) {
      (list.items || []).forEach(function (item) {
        if (item && item.type !== 'category') ids.add(String(item.id));
      });
    });
    return ids;
  }

  function insertParsedIngredient(list, rawText, checked) {
    if (!list) return null;
    if (!Array.isArray(list.items)) list.items = [];
    var parsed = parseCategoryInput(rawText);
    var text = parsed.text;
    if (!text) return null;

    var existing = list.items.find(function (item) {
      return item && item.type !== 'category' && norm(item.text) === norm(text);
    });
    if (existing) {
      if (typeof checked === 'boolean') existing.checked = !!checked;
      if (parsed.category) {
        var oldIndex = list.items.indexOf(existing);
        list.items.splice(oldIndex, 1);
        insertInCategory(list.items, categoryIndex(list.items, parsed.category), existing);
      }
      return existing;
    }

    var item = { id: Date.now() + Math.random(), type: 'item', text: text, checked: !!checked };
    if (parsed.category) insertInCategory(list.items, categoryIndex(list.items, parsed.category), item);
    else {
      var firstCategory = list.items.findIndex(function (entry) { return entry && entry.type === 'category'; });
      if (firstCategory < 0) list.items.push(item);
      else insertInCategory(list.items, firstCategory, item);
    }
    return item;
  }

  function postProcessRawIngredient(rawText) {
    var parsed = parseCategoryInput(rawText);
    if (!parsed.category || !parsed.text) return;
    var lists = getLists();
    var list = getActiveList(lists);
    if (!list || !Array.isArray(list.items)) return;

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

    if (rawItem) {
      var cleanExisting = list.items.find(function (entry) {
        return entry && entry.type !== 'category' && norm(entry.text) === norm(parsed.text);
      });
      if (cleanExisting) {
        cleanExisting.checked = !!rawItem.checked;
        var existingIndex = list.items.indexOf(cleanExisting);
        list.items.splice(existingIndex, 1);
        insertInCategory(list.items, categoryIndex(list.items, parsed.category), cleanExisting);
      } else {
        rawItem.text = parsed.text;
        insertInCategory(list.items, categoryIndex(list.items, parsed.category), rawItem);
      }
      saveLists(lists, true);
    }
  }

  function readRecipes() {
    try {
      var store = JSON.parse(localStorage.getItem('sh_recipes_v3') || '{}');
      if (Array.isArray(store)) return store;
      return Array.isArray(store.recipes) ? store.recipes : [];
    } catch (_) { return []; }
  }

  function recipeById(id) {
    return readRecipes().find(function (recipe) { return Number(recipe && recipe.id) === Number(id); }) || null;
  }

  function checkedForIngredient(rawText) {
    var parsed = parseCategoryInput(rawText);
    var lists = getLists();
    var list = getActiveList(lists);
    if (!list) return false;
    var item = (list.items || []).find(function (entry) {
      return entry && entry.type !== 'category' && norm(entry.text) === norm(parsed.text);
    });
    return !!(item && item.checked);
  }

  function refreshRecipeChecks() {
    var root = document.getElementById('recipes-list');
    if (!root) return;
    root.querySelectorAll('.recipe-ingredient').forEach(function (row) {
      var label = row.querySelector('label');
      var box = row.querySelector('input[type="checkbox"]');
      if (!label || !box) return;
      var raw = String(label.textContent || '').trim();
      var checked = checkedForIngredient(raw);
      box.checked = checked;
      label.classList.toggle('done', checked);
    });
  }

  function addStyles() {
    if (document.getElementById('shopping-yellow-category-v5-style')) return;
    var style = document.createElement('style');
    style.id = 'shopping-yellow-category-v5-style';
    style.textContent = `
      /* Keep V4 geometry/logic exactly; only scale headings and swap blue accents for Shopping yellow. */
      body.shopping-home-parity-v4 .category-title:not(.new-category) {
        font-size:12px !important;
        line-height:1.2 !important;
        letter-spacing:.8px !important;
        padding-top:8px !important;
        padding-bottom:5px !important;
      }
      body.shopping-home-parity-v4 .category-title:not(.new-category) input {
        font-size:12px !important;
        line-height:1.2 !important;
        letter-spacing:.8px !important;
      }
      body.shopping-home-parity-v4 .list-item input[type="checkbox"]::before,
      body.shopping-home-parity-v4 .add-item-line input[type="checkbox"]::before {
        border-left-color:#FBBF24 !important;
        border-bottom-color:#FBBF24 !important;
      }
      body.shopping-home-parity-v4 .list-item input[type="checkbox"]:checked,
      body.shopping-home-parity-v4 .add-item-line input[type="checkbox"]:checked {
        border-color:rgba(251,191,36,.78) !important;
        box-shadow:0 0 0 2px rgba(251,191,36,.18),inset 0 1px 0 rgba(255,255,255,.05) !important;
      }
      body.shopping-home-parity-v4 .list-item label[contenteditable="true"],
      body.shopping-home-parity-v4 .list-item input.edit-input {
        border-color:rgba(251,191,36,.56) !important;
        box-shadow:0 0 0 2px rgba(251,191,36,.08) !important;
        background:rgba(251,191,36,.045) !important;
      }
      @media(max-width:520px) {
        body.shopping-home-parity-v4 .category-title:not(.new-category) {
          font-size:11px !important;
          letter-spacing:.72px !important;
        }
        body.shopping-home-parity-v4 .category-title:not(.new-category) input {
          font-size:11px !important;
          letter-spacing:.72px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function wrapShoppingSaves() {
    if (typeof window.saveEditItem === 'function' && !window.saveEditItem.__shoppingCategoryV5) {
      var originalEdit = window.saveEditItem;
      var edit = function (id) {
        var input = document.getElementById('item-edit-' + id);
        var raw = String(input && input.value || '').trim();
        var result = originalEdit.apply(this, arguments);
        if (parseCategoryInput(raw).category) routeItemById(id, raw);
        return result;
      };
      edit.__shoppingCategoryV5 = true;
      window.saveEditItem = edit;
    }

    if (typeof window.saveNewItem === 'function' && !window.saveNewItem.__shoppingCategoryV5) {
      var originalNew = window.saveNewItem;
      var add = function () {
        var input = document.getElementById('new-item-input');
        var raw = String(input && input.value || '').trim();
        var before = allItemIds();
        var result = originalNew.apply(this, arguments);
        if (parseCategoryInput(raw).category) routeNewestRaw(raw, before);
        return result;
      };
      add.__shoppingCategoryV5 = true;
      window.saveNewItem = add;
    }

    if (typeof window.commitNewItemDraft === 'function' && !window.commitNewItemDraft.__shoppingCategoryV5) {
      var originalDraft = window.commitNewItemDraft;
      var draft = function () {
        var input = document.getElementById('new-item-input');
        var raw = String(input && input.value || '').trim();
        var before = allItemIds();
        var result = originalDraft.apply(this, arguments);
        if (parseCategoryInput(raw).category) routeNewestRaw(raw, before);
        return result;
      };
      draft.__shoppingCategoryV5 = true;
      window.commitNewItemDraft = draft;
    }
  }

  function wrapRecipeFunctions() {
    ['saveRecipeItem','commitNewRecipeIngredientFromInput','commitNewRecipeIngredientDraft'].forEach(function (name) {
      var fn = window[name];
      if (typeof fn !== 'function' || fn.__shoppingCategoryV5) return;
      var wrapped = function (recipeId) {
        var input = document.getElementById('new-recipe-ingredient-v3-' + recipeId);
        var raw = String(input && input.value || '').trim();
        var result = fn.apply(this, arguments);
        postProcessRawIngredient(raw);
        setTimeout(refreshRecipeChecks, 0);
        return result;
      };
      wrapped.__shoppingCategoryV5 = true;
      window[name] = wrapped;
    });

    ['commitRecipeIngredientEdit','commitRecipeIngredientDraft'].forEach(function (name) {
      var fn = window[name];
      if (typeof fn !== 'function' || fn.__shoppingCategoryV5) return;
      var wrapped = function (recipeId, index) {
        var input = document.getElementById('recipe-edit-v3-' + recipeId + '-' + index);
        var raw = String(input && input.value || '').trim();
        var result = fn.apply(this, arguments);
        postProcessRawIngredient(raw);
        setTimeout(refreshRecipeChecks, 0);
        return result;
      };
      wrapped.__shoppingCategoryV5 = true;
      window[name] = wrapped;
    });

    if (typeof window.toggleRecipeIngredient === 'function' && !window.toggleRecipeIngredient.__shoppingCategoryV5) {
      var toggle = function (recipeId, rawText, checked, checkbox) {
        var lists = getLists();
        var list = getActiveList(lists);
        if (!list) return;
        var item = insertParsedIngredient(list, rawText, !!checked);
        if (item) item.checked = !!checked;
        saveLists(lists, true);
        if (checkbox && checkbox.nextElementSibling) checkbox.nextElementSibling.classList.toggle('done', !!checked);
      };
      toggle.__shoppingCategoryV5 = true;
      window.toggleRecipeIngredient = toggle;
    }

    if (typeof window.addRecipeItems === 'function' && !window.addRecipeItems.__shoppingCategoryV5) {
      var addRecipe = function (recipeId) {
        var recipe = recipeById(recipeId);
        if (!recipe || !Array.isArray(recipe.items) || !recipe.items.length) return alert('Receptet har inga ingredienser');
        var lists = getLists();
        var list = getActiveList(lists);
        if (!list) return;
        recipe.items.forEach(function (ingredient) { insertParsedIngredient(list, ingredient, false); });
        saveLists(lists, true);
        setTimeout(refreshRecipeChecks, 0);
      };
      addRecipe.__shoppingCategoryV5 = true;
      window.addRecipeItems = addRecipe;
    }
  }

  function trackActiveList() {
    if (typeof window.selectList === 'function' && !window.selectList.__shoppingCategoryV5) {
      var original = window.selectList;
      var select = function (id) {
        activeListId = id;
        var result = original.apply(this, arguments);
        setTimeout(refreshRecipeChecks, 0);
        return result;
      };
      select.__shoppingCategoryV5 = true;
      window.selectList = select;
    }
  }

  function install() {
    if (window.__shoppingYellowCategoryV5Installed) return;
    if (typeof window.saveEditItem !== 'function' || typeof window.saveNewItem !== 'function' || typeof window.renderItems !== 'function') {
      setTimeout(install, 50);
      return;
    }
    window.__shoppingYellowCategoryV5Installed = true;
    var lists = getLists();
    activeListId = lists[0] ? lists[0].id : null;
    addStyles();
    wrapShoppingSaves();
    trackActiveList();

    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      wrapRecipeFunctions();
      trackActiveList();
      refreshRecipeChecks();
      if (attempts > 30 && typeof window.saveRecipeItem === 'function') clearInterval(timer);
    }, 80);

    var root = document.getElementById('recipes-list');
    if (root && typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function () { refreshRecipeChecks(); });
      observer.observe(root, { childList:true, subtree:true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
