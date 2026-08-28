(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  var STORAGE_KEY = 'sh_recipes_v3';
  var FIREBASE_KEY = 'sh_recipes_v3';
  var openIds = new Set();
  var editingNameId = null;
  var editingIngredient = null;
  var addingRecipe = false;
  var addIngredientFocusId = null;
  var activeListId = null;
  var remoteRef = null;
  var remoteWriteTimer = null;
  var applyingRemote = false;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function normalizeRecipe(recipe, index) {
    recipe = recipe || {};
    return {
      id: Number(recipe.id) || (Date.now() + index),
      name: String(recipe.name || '').trim() || 'Recept',
      items: Array.isArray(recipe.items)
        ? recipe.items.map(function (item) { return String(item || '').trim(); }).filter(Boolean)
        : []
    };
  }

  function normalizeStore(raw) {
    if (Array.isArray(raw)) {
      return { version:3, updatedAt:0, recipes:raw.map(normalizeRecipe) };
    }
    raw = raw && typeof raw === 'object' ? raw : {};
    return {
      version:3,
      updatedAt:Number(raw.updatedAt) || 0,
      recipes:Array.isArray(raw.recipes) ? raw.recipes.map(normalizeRecipe) : []
    };
  }

  function readStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeStore(JSON.parse(raw)) : normalizeStore(null);
    } catch (e) {
      return normalizeStore(null);
    }
  }

  function recipes() {
    return clone(readStore().recipes);
  }

  function writeStore(store, syncRemote) {
    store = normalizeStore(store);
    if (!store.updatedAt) store.updatedAt = Date.now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch (e) {}
    if (syncRemote !== false && !applyingRemote) scheduleRemoteWrite(store);
  }

  function saveRecipes(nextRecipes) {
    writeStore({version:3, updatedAt:Date.now(), recipes:nextRecipes}, true);
    renderAllRecipes();
  }

  function scheduleRemoteWrite(store) {
    if (!remoteRef) return;
    if (remoteWriteTimer) clearTimeout(remoteWriteTimer);
    var payload = JSON.stringify(normalizeStore(store));
    remoteWriteTimer = setTimeout(function () {
      remoteWriteTimer = null;
      try { remoteRef.set(payload); } catch (e) {}
    }, 180);
  }

  function parseRemote(value) {
    if (value == null) return normalizeStore(null);
    try {
      if (typeof value === 'string') return normalizeStore(JSON.parse(value));
      return normalizeStore(value);
    } catch (e) {
      return normalizeStore(null);
    }
  }

  function bindFirebase() {
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.database) return;
    var auth;
    try { auth = firebase.auth(); } catch (e) { return; }
    var attached = false;

    function attach(user) {
      if (!user || attached) return;
      attached = true;
      try { remoteRef = firebase.database().ref(FIREBASE_KEY); } catch (e) { return; }

      remoteRef.get().then(function (snapshot) {
        var local = readStore();
        if (!snapshot.exists()) {
          if (local.recipes.length) scheduleRemoteWrite(local);
          return;
        }
        var remote = parseRemote(snapshot.val());
        if (remote.updatedAt > local.updatedAt || !local.recipes.length) {
          applyingRemote = true;
          writeStore(remote, false);
          applyingRemote = false;
          renderAllRecipes();
        } else if (local.updatedAt > remote.updatedAt) {
          scheduleRemoteWrite(local);
        }
      }).catch(function () {});

      remoteRef.on('value', function (snapshot) {
        if (!snapshot.exists()) return;
        var remote = parseRemote(snapshot.val());
        var local = readStore();
        if (remote.updatedAt <= local.updatedAt) return;
        applyingRemote = true;
        writeStore(remote, false);
        applyingRemote = false;
        renderAllRecipes();
      }, function () {});
    }

    if (auth.currentUser) attach(auth.currentUser);
    auth.onAuthStateChanged(attach);
  }

  function getLists() {
    try {
      var parsed = JSON.parse(localStorage.getItem('sh_lists') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveLists(lists) {
    try { localStorage.setItem('sh_lists', JSON.stringify(lists)); } catch (e) {}
    try { if (typeof window.renderItems === 'function') window.renderItems(); } catch (e) {}
  }

  function ensureActiveList(lists) {
    lists = Array.isArray(lists) ? lists : [];
    var list = lists.find(function (entry) { return Number(entry && entry.id) === Number(activeListId); });
    if (!list) {
      list = lists[0] || null;
      activeListId = list ? list.id : null;
    }
    return list;
  }

  function insertInFirstCategory(list, text, checked) {
    if (!list) return null;
    if (!Array.isArray(list.items)) list.items = [];
    var existing = list.items.find(function (item) {
      return item && item.type !== 'category' && String(item.text || '').trim() === text;
    });
    if (existing) {
      if (typeof checked === 'boolean') existing.checked = checked;
      return existing;
    }
    var item = { id: Date.now() + Math.random(), type:'item', text:text, checked:!!checked };
    var categoryIndex = list.items.findIndex(function (entry) { return entry && entry.type === 'category'; });
    if (categoryIndex < 0) {
      list.items.push(item);
      return item;
    }
    var insertAt = categoryIndex + 1;
    while (insertAt < list.items.length && list.items[insertAt].type !== 'category') insertAt++;
    list.items.splice(insertAt, 0, item);
    return item;
  }

  function addIngredientToShopping(text, checked) {
    text = String(text || '').trim();
    if (!text) return;
    var lists = getLists();
    var list = ensureActiveList(lists);
    if (!list) return;
    insertInFirstCategory(list, text, checked);
    saveLists(lists);
  }

  function ingredientChecked(text) {
    var lists = getLists();
    var list = ensureActiveList(lists);
    if (!list || !Array.isArray(list.items)) return false;
    var item = list.items.find(function (entry) {
      return entry && entry.type !== 'category' && String(entry.text || '').trim() === String(text || '').trim();
    });
    return !!(item && item.checked);
  }

  function focusNow(input) {
    if (!input) return;
    try { input.focus({preventScroll:true}); }
    catch (e) { try { input.focus(); } catch (ignore) {} }
    try {
      var len = String(input.value || '').length;
      input.setSelectionRange(len, len);
    } catch (e) {}
  }

  function addStyles() {
    if (document.getElementById('shopping-recipes-v3-style')) return;
    var style = document.createElement('style');
    style.id = 'shopping-recipes-v3-style';
    style.textContent = `
      body.shopping-recipes-v3 .section-title {
        margin-top:14px !important;
        margin-bottom:5px !important;
        font-size:10px !important;
        letter-spacing:1.25px !important;
      }
      body.shopping-recipes-v3 .recipe-item {
        padding:4px 0 !important;
        border-bottom:1px solid rgba(255,255,255,.07) !important;
      }
      body.shopping-recipes-v3 .recipe-header {
        min-height:34px;
        gap:6px !important;
        padding:2px 3px !important;
        border-radius:7px;
        transition:background-color .16s ease;
        -webkit-tap-highlight-color:transparent;
      }
      body.shopping-recipes-v3 .recipe-header:active {
        background:rgba(251,191,36,.04);
      }
      body.shopping-recipes-v3 .recipe-toggle {
        width:12px !important;
        font-size:11px !important;
      }
      body.shopping-recipes-v3 .recipe-name {
        min-height:30px;
        display:flex;
        align-items:center;
        padding:3px 4px;
        border-radius:6px;
        font-size:13px;
        cursor:text;
      }
      body.shopping-recipes-v3 .recipe-name input,
      body.shopping-recipes-v3 .recipe-ingredient input[type="text"],
      body.shopping-recipes-v3 .recipe-add-item input[type="text"],
      body.shopping-recipes-v3 .new-recipe input {
        min-height:32px;
        padding:5px 7px !important;
        border:1px solid rgba(251,191,36,.36) !important;
        border-radius:7px !important;
        background:rgba(251,191,36,.04) !important;
        color:var(--text) !important;
        outline:none !important;
        font-size:13px !important;
      }
      body.shopping-recipes-v3 .recipe-actions {
        display:flex !important;
        opacity:.72 !important;
        gap:3px !important;
        flex:0 0 auto;
      }
      body.shopping-recipes-v3 .recipe-actions button {
        width:30px;
        height:30px;
        display:grid;
        place-items:center;
        padding:0 !important;
        border:1px solid rgba(251,191,36,.16) !important;
        border-radius:7px;
        background:rgba(251,191,36,.045) !important;
        color:var(--text-sec) !important;
        font-size:14px !important;
        line-height:1;
      }
      body.shopping-recipes-v3 .recipe-actions button:active {
        transform:scale(.96);
      }
      body.shopping-recipes-v3 .recipe-delete-v3:hover { color:#F87171 !important; }
      body.shopping-recipes-v3 .recipe-item.open .recipe-items {
        display:flex !important;
      }
      body.shopping-recipes-v3 .recipe-items {
        padding-left:18px !important;
        margin:2px 0 4px !important;
        gap:1px !important;
      }
      body.shopping-recipes-v3 .recipe-ingredient,
      body.shopping-recipes-v3 .recipe-add-item {
        min-height:30px;
        gap:6px !important;
        padding:1px 2px !important;
        font-size:12px !important;
      }
      body.shopping-recipes-v3 .recipe-ingredient label {
        flex:1 1 auto !important;
        width:100%;
        min-height:28px;
        display:flex;
        align-items:center;
        padding:4px 5px;
        border-radius:6px;
        cursor:text !important;
      }
      body.shopping-recipes-v3 .recipe-ingredient input[type="checkbox"],
      body.shopping-recipes-v3 .recipe-add-item input[type="checkbox"] {
        width:15px !important;
        height:15px !important;
      }
      body.shopping-recipes-v3 .recipe-add-item {
        color:var(--text-dim);
        margin-top:1px;
      }
      body.shopping-recipes-v3 .recipe-add-item input[type="text"] {
        border-color:transparent !important;
        background:transparent !important;
      }
      body.shopping-recipes-v3 .recipe-add-item input[type="text"]:focus {
        border-color:rgba(251,191,36,.32) !important;
        background:rgba(251,191,36,.03) !important;
      }
      body.shopping-recipes-v3 .new-recipe {
        min-height:34px;
        padding:3px 5px !important;
        display:flex;
        align-items:center;
        border-radius:7px;
        font-size:12px;
      }
      @media(max-width:520px) {
        body.shopping-recipes-v3 .recipe-header { min-height:38px; }
        body.shopping-recipes-v3 .recipe-name { min-height:34px; font-size:13px; }
        body.shopping-recipes-v3 .recipe-items { padding-left:14px !important; }
        body.shopping-recipes-v3 .recipe-actions { opacity:1 !important; }
        body.shopping-recipes-v3 .recipe-actions button { width:32px; height:32px; }
        body.shopping-recipes-v3 .recipe-ingredient,
        body.shopping-recipes-v3 .recipe-add-item { min-height:34px; }
        body.shopping-recipes-v3 .recipe-ingredient label { min-height:32px; padding:5px 6px; }
      }
    `;
    document.head.appendChild(style);
  }

  function renderDropdown() {
    var menu = document.getElementById('recipes-dropdown');
    if (!menu) return;
    var list = recipes();
    if (!list.length) {
      menu.innerHTML = '<a href="#" onclick="return false;">Inga recept sparade</a>';
      return;
    }
    menu.innerHTML = list.map(function (recipe) {
      return '<a href="#" onclick="addRecipeItems(' + recipe.id + '); return false;">Lägg till: ' + escapeHtml(recipe.name) + '</a>';
    }).join('');
  }

  function renderRecipes() {
    var root = document.getElementById('recipes-list');
    if (!root) return;
    var list = recipes();
    var html = addingRecipe
      ? '<div class="new-recipe"><input id="new-recipe-input-v3" type="text" placeholder="Nytt recept..." onkeydown="saveNewRecipe(event)" onblur="cancelAddRecipe()"></div>'
      : '<div class="new-recipe" onclick="startAddRecipe()">+ Lägg till recept</div>';

    list.forEach(function (recipe) {
      var open = openIds.has(recipe.id);
      html += '<div class="recipe-item' + (open ? ' open' : '') + '" data-recipe-id="' + recipe.id + '">' +
        '<div class="recipe-header" onclick="toggleRecipe(' + recipe.id + ')">' +
          '<span class="recipe-toggle">›</span>';

      if (editingNameId === recipe.id) {
        html += '<span class="recipe-name"><input id="recipe-name-edit-v3-' + recipe.id + '" type="text" value="' + escapeAttr(recipe.name) + '" onkeydown="handleRecipeNameKeydown(' + recipe.id + ',event)" onblur="commitRecipeName(' + recipe.id + ')" onclick="event.stopPropagation()"></span>';
      } else {
        html += '<span class="recipe-name" onclick="event.stopPropagation();startEditRecipeName(' + recipe.id + ')">' + escapeHtml(recipe.name) + '</span>';
      }

      html += '<div class="recipe-actions">' +
        '<button type="button" title="Lägg ingredienser i inköpslistan" onclick="event.stopPropagation();addRecipeItems(' + recipe.id + ')">+</button>' +
        '<button type="button" class="recipe-delete-v3" title="Radera recept" onclick="event.stopPropagation();delRecipe(' + recipe.id + ')">×</button>' +
        '</div></div><div class="recipe-items">';

      recipe.items.forEach(function (ingredient, index) {
        var editing = editingIngredient && editingIngredient.recipeId === recipe.id && editingIngredient.index === index;
        if (editing) {
          html += '<div class="recipe-ingredient">' +
            '<input type="checkbox" onmousedown="event.preventDefault();commitRecipeIngredientDraft(' + recipe.id + ',' + index + ',!this.checked)">' +
            '<input id="recipe-edit-v3-' + recipe.id + '-' + index + '" type="text" value="' + escapeAttr(ingredient) + '" onkeydown="handleRecipeIngredientKeydown(' + recipe.id + ',' + index + ',event)" onblur="commitRecipeIngredientEdit(' + recipe.id + ',' + index + ')">' +
            '</div>';
        } else {
          var checked = ingredientChecked(ingredient);
          html += '<div class="recipe-ingredient">' +
            '<input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="toggleRecipeIngredient(' + recipe.id + ',' + JSON.stringify(ingredient).replace(/"/g,'&quot;') + ',this.checked,this)">' +
            '<label class="' + (checked ? 'done' : '') + '" onclick="startEditRecipeIngredient(' + recipe.id + ',' + index + ')">' + escapeHtml(ingredient) + '</label>' +
            '</div>';
        }
      });

      html += '<div class="recipe-add-item">' +
        '<input type="checkbox" onmousedown="event.preventDefault();commitNewRecipeIngredientDraft(' + recipe.id + ',!this.checked)">' +
        '<input id="new-recipe-ingredient-v3-' + recipe.id + '" type="text" placeholder="+ Lägg till ingrediens" onkeydown="saveRecipeItem(' + recipe.id + ',event)" onblur="commitNewRecipeIngredientFromInput(' + recipe.id + ')">' +
        '</div></div></div>';
    });

    root.innerHTML = html;

    if (editingNameId != null) focusNow(document.getElementById('recipe-name-edit-v3-' + editingNameId));
    if (editingIngredient) focusNow(document.getElementById('recipe-edit-v3-' + editingIngredient.recipeId + '-' + editingIngredient.index));
    if (addingRecipe) focusNow(document.getElementById('new-recipe-input-v3'));
    if (addIngredientFocusId != null) {
      var focusId = addIngredientFocusId;
      addIngredientFocusId = null;
      focusNow(document.getElementById('new-recipe-ingredient-v3-' + focusId));
    }
  }

  function renderAllRecipes() {
    renderDropdown();
    renderRecipes();
  }

  function findRecipe(id) {
    return recipes().find(function (recipe) { return Number(recipe.id) === Number(id); }) || null;
  }

  function addIngredient(recipeId, text, checked) {
    text = String(text || '').trim();
    if (!text) return false;
    var list = recipes();
    var recipe = list.find(function (entry) { return Number(entry.id) === Number(recipeId); });
    if (!recipe) return false;
    if (!recipe.items.some(function (item) { return item.toLowerCase() === text.toLowerCase(); })) recipe.items.push(text);
    openIds.add(Number(recipeId));
    addIngredientToShopping(text, !!checked);
    saveRecipes(list);
    return true;
  }

  function installOverrides() {
    if (window.__shoppingRecipesV3Installed) return true;
    if (!document.getElementById('recipes-list')) return false;

    window.__shoppingRecipesV3Installed = true;
    document.body.classList.add('shopping-recipes-v3');
    addStyles();

    var lists = getLists();
    activeListId = lists[0] ? lists[0].id : null;

    var originalSelectList = window.selectList;
    if (typeof originalSelectList === 'function') {
      window.selectList = function (id) {
        activeListId = id;
        return originalSelectList.apply(this, arguments);
      };
    }
    var originalCreateNewList = window.createNewList;
    if (typeof originalCreateNewList === 'function') {
      window.createNewList = function () {
        var before = getLists().map(function (list) { return list.id; });
        var result = originalCreateNewList.apply(this, arguments);
        var after = getLists();
        var created = after.find(function (list) { return before.indexOf(list.id) < 0; });
        if (created) activeListId = created.id;
        return result;
      };
    }
    var originalDeleteList = window.deleteList;
    if (typeof originalDeleteList === 'function') {
      window.deleteList = function (id) {
        var result = originalDeleteList.apply(this, arguments);
        var after = getLists();
        if (!after.some(function (list) { return Number(list.id) === Number(activeListId); })) activeListId = after[0] ? after[0].id : null;
        return result;
      };
    }

    window.renderRecipesDropdown = renderDropdown;
    window.renderRecipes = renderRecipes;
    window.recipeIngredientIsChecked = ingredientChecked;

    window.startAddRecipe = function () {
      if (addingRecipe) return;
      addingRecipe = true;
      renderRecipes();
    };

    window.saveNewRecipe = function (event) {
      if (event && event.key && event.key !== 'Enter') return;
      if (event) event.preventDefault();
      var input = document.getElementById('new-recipe-input-v3');
      var name = String(input && input.value || '').trim();
      if (!name) return;
      var list = recipes();
      var id = list.reduce(function (max, recipe) { return Math.max(max, Number(recipe.id) || 0); }, 0) + 1;
      list.push({id:id, name:name, items:[]});
      addingRecipe = false;
      openIds.add(id);
      saveRecipes(list);
    };

    window.cancelAddRecipe = function () {
      if (!addingRecipe) return;
      var input = document.getElementById('new-recipe-input-v3');
      if (input && String(input.value || '').trim()) {
        window.saveNewRecipe();
        return;
      }
      addingRecipe = false;
      renderRecipes();
    };

    window.toggleRecipe = function (id) {
      id = Number(id);
      if (openIds.has(id)) openIds.delete(id); else openIds.add(id);
      renderRecipes();
    };

    window.delRecipe = function (id) {
      if (!confirm('Radera receptet?')) return;
      id = Number(id);
      openIds.delete(id);
      saveRecipes(recipes().filter(function (recipe) { return Number(recipe.id) !== id; }));
    };

    window.startEditRecipeName = function (id) {
      editingNameId = Number(id);
      openIds.add(Number(id));
      renderRecipes();
    };

    window.commitRecipeName = function (id) {
      id = Number(id);
      if (editingNameId !== id) return;
      var input = document.getElementById('recipe-name-edit-v3-' + id);
      var name = String(input && input.value || '').trim();
      var list = recipes();
      var recipe = list.find(function (entry) { return Number(entry.id) === id; });
      editingNameId = null;
      if (!recipe) return renderRecipes();
      if (!name) {
        list = list.filter(function (entry) { return Number(entry.id) !== id; });
        openIds.delete(id);
      } else recipe.name = name;
      saveRecipes(list);
    };

    window.handleRecipeNameKeydown = function (id, event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        window.commitRecipeName(id);
      } else if (event.key === 'Escape') {
        editingNameId = null;
        renderRecipes();
      }
    };

    window.saveRecipeItem = function (recipeId, event) {
      if (!event || event.key !== 'Enter') return;
      event.preventDefault();
      var input = event.target;
      var text = String(input && input.value || '').trim();
      if (!text) return;
      if (addIngredient(recipeId, text, false)) {
        addIngredientFocusId = Number(recipeId);
        renderRecipes();
      }
    };

    window.commitNewRecipeIngredientFromInput = function (recipeId) {
      var input = document.getElementById('new-recipe-ingredient-v3-' + recipeId);
      var text = String(input && input.value || '').trim();
      if (!text) return;
      addIngredient(recipeId, text, false);
    };

    window.commitNewRecipeIngredientDraft = function (recipeId, checked) {
      var input = document.getElementById('new-recipe-ingredient-v3-' + recipeId);
      var text = String(input && input.value || '').trim();
      if (!text) return;
      addIngredient(recipeId, text, checked);
    };

    window.startEditRecipeIngredient = function (recipeId, index) {
      editingIngredient = {recipeId:Number(recipeId), index:Number(index)};
      openIds.add(Number(recipeId));
      renderRecipes();
    };

    function commitIngredientEdit(recipeId, index, moveToAdd) {
      recipeId = Number(recipeId);
      index = Number(index);
      var input = document.getElementById('recipe-edit-v3-' + recipeId + '-' + index);
      var text = String(input && input.value || '').trim();
      var list = recipes();
      var recipe = list.find(function (entry) { return Number(entry.id) === recipeId; });
      if (!recipe || !recipe.items[index]) {
        editingIngredient = null;
        renderRecipes();
        return;
      }
      if (!text) recipe.items.splice(index, 1);
      else {
        recipe.items[index] = text;
        addIngredientToShopping(text, false);
      }
      editingIngredient = null;
      if (moveToAdd) addIngredientFocusId = recipeId;
      saveRecipes(list);
    }

    window.commitRecipeIngredientEdit = function (recipeId, index) {
      if (!editingIngredient || editingIngredient.recipeId !== Number(recipeId) || editingIngredient.index !== Number(index)) return;
      commitIngredientEdit(recipeId, index, false);
    };

    window.handleRecipeIngredientKeydown = function (recipeId, index, event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        commitIngredientEdit(recipeId, index, true);
      } else if (event.key === 'Escape') {
        editingIngredient = null;
        renderRecipes();
      } else if (event.key === 'Backspace' && event.target.value === '') {
        event.preventDefault();
        commitIngredientEdit(recipeId, index, false);
      }
    };

    window.commitRecipeIngredientDraft = function (recipeId, index, checked) {
      recipeId = Number(recipeId);
      index = Number(index);
      var input = document.getElementById('recipe-edit-v3-' + recipeId + '-' + index);
      var text = String(input && input.value || '').trim();
      if (!text) return;
      var list = recipes();
      var recipe = list.find(function (entry) { return Number(entry.id) === recipeId; });
      if (!recipe || index >= recipe.items.length) return;
      recipe.items[index] = text;
      editingIngredient = null;
      addIngredientToShopping(text, checked);
      saveRecipes(list);
    };

    window.toggleRecipeIngredient = function (recipeId, text, checked, checkbox) {
      var lists = getLists();
      var list = ensureActiveList(lists);
      if (!list) return;
      var item = insertInFirstCategory(list, String(text || '').trim(), checked);
      if (item) item.checked = !!checked;
      saveLists(lists);
      if (checkbox && checkbox.nextElementSibling) checkbox.nextElementSibling.classList.toggle('done', !!checked);
    };

    window.deleteRecipeItem = function (recipeId, index) {
      var list = recipes();
      var recipe = list.find(function (entry) { return Number(entry.id) === Number(recipeId); });
      if (!recipe || index < 0 || index >= recipe.items.length) return;
      recipe.items.splice(index, 1);
      saveRecipes(list);
    };

    window.addRecipeItems = function (recipeId) {
      var recipe = findRecipe(recipeId);
      if (!recipe || !recipe.items.length) return alert('Receptet har inga ingredienser');
      var lists = getLists();
      var list = ensureActiveList(lists);
      if (!list) return;
      recipe.items.forEach(function (ingredient) { insertInFirstCategory(list, ingredient, false); });
      saveLists(lists);
    };

    renderAllRecipes();
    bindFirebase();
    return true;
  }

  function install() {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      if (installOverrides() || attempts > 80) clearInterval(timer);
    }, 50);
    installOverrides();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 0); }, {once:true});
  } else setTimeout(install, 0);
})();
