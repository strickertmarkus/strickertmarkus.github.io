(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  var STORAGE_KEY = 'sh_recipes_v3';
  var FIREBASE_KEY = 'sh_recipes_v3';
  var openIds = new Set();
  var editingMetaId = null;
  var editingIngredient = null;
  var addingRecipe = false;
  var addIngredientFocusId = null;
  var remoteRef = null;
  var remoteWriteTimer = null;
  var applyingRemote = false;
  var metaBlurTimer = null;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(value) { return escapeHtml(value); }

  function normalizeUrl(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = 'https://' + raw;
    try {
      var parsed = new URL(raw);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      return parsed.href;
    } catch (_) { return ''; }
  }

  function normalizeRecipe(recipe, index) {
    recipe = recipe || {};
    return {
      id: Number(recipe.id) || (Date.now() + index),
      name: String(recipe.name || '').trim() || 'Recept',
      url: normalizeUrl(recipe.url || ''),
      items: Array.isArray(recipe.items)
        ? recipe.items.map(function (item) { return String(item || '').trim(); }).filter(Boolean)
        : []
    };
  }

  function normalizeStore(raw) {
    if (Array.isArray(raw)) return { version:4, updatedAt:0, recipes:raw.map(normalizeRecipe) };
    raw = raw && typeof raw === 'object' ? raw : {};
    return {
      version:4,
      updatedAt:Number(raw.updatedAt) || 0,
      recipes:Array.isArray(raw.recipes) ? raw.recipes.map(normalizeRecipe) : []
    };
  }

  function readStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeStore(JSON.parse(raw)) : normalizeStore(null);
    } catch (_) { return normalizeStore(null); }
  }
  function recipes() { return clone(readStore().recipes); }

  function writeStore(store, syncRemote) {
    store = normalizeStore(store);
    if (!store.updatedAt) store.updatedAt = Date.now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch (_) {}
    if (syncRemote !== false && !applyingRemote) scheduleRemoteWrite(store);
  }
  function saveRecipes(nextRecipes) {
    writeStore({version:4, updatedAt:Date.now(), recipes:nextRecipes}, true);
    renderAllRecipes();
  }

  function scheduleRemoteWrite(store) {
    if (!remoteRef) return;
    if (remoteWriteTimer) clearTimeout(remoteWriteTimer);
    var payload = JSON.stringify(normalizeStore(store));
    remoteWriteTimer = setTimeout(function () {
      remoteWriteTimer = null;
      try { remoteRef.set(payload); } catch (_) {}
    }, 180);
  }

  function parseRemote(value) {
    if (value == null) return normalizeStore(null);
    try { return normalizeStore(typeof value === 'string' ? JSON.parse(value) : value); }
    catch (_) { return normalizeStore(null); }
  }

  function bindFirebase() {
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.database) return;
    var auth;
    try { auth = firebase.auth(); } catch (_) { return; }
    var attached = false;
    function attach(user) {
      if (!user || attached) return;
      attached = true;
      try { remoteRef = firebase.database().ref(FIREBASE_KEY); } catch (_) { return; }
      remoteRef.get().then(function (snapshot) {
        var local = readStore();
        if (!snapshot.exists()) {
          if (local.recipes.length) scheduleRemoteWrite(local);
          return;
        }
        var remote = parseRemote(snapshot.val());
        if (remote.updatedAt > local.updatedAt || !local.recipes.length) {
          applyingRemote = true; writeStore(remote, false); applyingRemote = false; renderAllRecipes();
        } else if (local.updatedAt > remote.updatedAt) scheduleRemoteWrite(local);
      }).catch(function () {});
      remoteRef.on('value', function (snapshot) {
        if (!snapshot.exists()) return;
        var remote = parseRemote(snapshot.val());
        var local = readStore();
        if (remote.updatedAt <= local.updatedAt) return;
        applyingRemote = true; writeStore(remote, false); applyingRemote = false; renderAllRecipes();
      }, function () {});
    }
    if (auth.currentUser) attach(auth.currentUser);
    auth.onAuthStateChanged(attach);
  }

  function engine() { return window.__shoppingListEngineV7 || null; }
  function ingredientChecked(text) {
    var e = engine();
    return !!(e && typeof e.rawIngredientChecked === 'function' && e.rawIngredientChecked(text));
  }
  function upsertShopping(rawItems, checked) {
    var e = engine();
    if (e && typeof e.upsertRecipeItems === 'function') e.upsertRecipeItems(rawItems, checked);
  }

  function focusNow(input) {
    if (!input) return;
    try { input.focus({preventScroll:true}); } catch (_) { try { input.focus(); } catch (ignore) {} }
    try { var len = String(input.value || '').length; input.setSelectionRange(len, len); } catch (_) {}
  }

  function addStyles() {
    if (document.getElementById('shopping-recipes-v4-style')) return;
    var style = document.createElement('style');
    style.id = 'shopping-recipes-v4-style';
    style.textContent = `
      body.shopping-recipes-v4 .section-title{margin-top:14px!important;margin-bottom:5px!important;font-size:10px!important;letter-spacing:1.25px!important}
      body.shopping-recipes-v4 .recipe-item{padding:4px 0!important;border-bottom:1px solid rgba(255,255,255,.07)!important}
      body.shopping-recipes-v4 .recipe-header{display:flex;align-items:center;min-height:34px;gap:6px!important;padding:2px 3px!important;border-radius:7px;transition:background-color .16s ease;-webkit-tap-highlight-color:transparent}
      body.shopping-recipes-v4 .recipe-header:active{background:rgba(251,191,36,.035)}
      body.shopping-recipes-v4 .recipe-toggle{width:18px;height:30px;display:grid;place-items:center;border:0;background:transparent;color:var(--text-sec);font-size:13px;cursor:pointer;padding:0;transition:transform .16s ease,color .16s ease}
      body.shopping-recipes-v4 .recipe-item.open .recipe-toggle{transform:rotate(90deg)}
      body.shopping-recipes-v4 .recipe-title-wrap{display:flex;align-items:center;gap:6px;min-width:0;flex:1}
      body.shopping-recipes-v4 .recipe-name-v4,body.shopping-recipes-v4 .recipe-name-link-v4{min-width:0;min-height:30px;display:flex;align-items:center;padding:3px 2px;border-radius:6px;font-size:13px;font-weight:500;color:var(--text);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      body.shopping-recipes-v4 .recipe-name-v4{cursor:text}
      body.shopping-recipes-v4 .recipe-name-link-v4{cursor:pointer;text-decoration-color:rgba(251,191,36,.42);text-underline-offset:3px}
      body.shopping-recipes-v4 .recipe-name-link-v4:hover{text-decoration:underline;color:#FDE68A}
      body.shopping-recipes-v4 .recipe-link-mark{font-size:11px;color:var(--accent);margin-left:5px;opacity:.78}
      body.shopping-recipes-v4 .recipe-edit-meta-v4,body.shopping-recipes-v4 .recipe-delete-v4{width:26px;height:30px;display:grid;place-items:center;padding:0;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:var(--text-sec);cursor:pointer;font-size:15px;line-height:1;opacity:.62;transition:color .16s ease,opacity .16s ease,transform .12s ease}
      body.shopping-recipes-v4 .recipe-edit-meta-v4:hover{color:var(--accent);opacity:1}
      body.shopping-recipes-v4 .recipe-delete-v4:hover{color:#F87171;opacity:1}
      body.shopping-recipes-v4 .recipe-edit-meta-v4:active,body.shopping-recipes-v4 .recipe-delete-v4:active{transform:scale(.88)}
      body.shopping-recipes-v4 .recipe-meta-editor{flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:6px;min-width:0}
      body.shopping-recipes-v4 .recipe-meta-editor input,body.shopping-recipes-v4 .recipe-ingredient input[type="text"],body.shopping-recipes-v4 .recipe-add-item input[type="text"],body.shopping-recipes-v4 .new-recipe-v4 input{min-height:32px;padding:5px 7px!important;border:1px solid rgba(251,191,36,.32)!important;border-radius:7px!important;background:rgba(251,191,36,.035)!important;color:var(--text)!important;outline:none!important;font-size:13px!important;min-width:0}
      body.shopping-recipes-v4 .recipe-meta-editor input:focus,body.shopping-recipes-v4 .new-recipe-v4 input:focus{border-color:rgba(251,191,36,.58)!important;box-shadow:0 0 0 2px rgba(251,191,36,.07)}
      body.shopping-recipes-v4 .new-recipe-v4{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:6px;padding:3px 3px!important}
      body.shopping-recipes-v4 .new-recipe{min-height:34px;padding:3px 5px!important;display:flex;align-items:center;border-radius:7px;font-size:12px}
      body.shopping-recipes-v4 .recipe-items{display:none!important;padding-left:18px!important;margin:2px 0 4px!important;gap:1px!important}
      body.shopping-recipes-v4 .recipe-item.open .recipe-items{display:flex!important;flex-direction:column}
      body.shopping-recipes-v4 .recipe-ingredient,body.shopping-recipes-v4 .recipe-add-item{min-height:30px;display:flex;align-items:center;gap:6px!important;padding:1px 2px!important;font-size:12px!important}
      body.shopping-recipes-v4 .recipe-ingredient label{flex:1 1 auto!important;width:100%;min-height:28px;display:flex;align-items:center;padding:4px 5px;border-radius:6px;cursor:text!important}
      body.shopping-recipes-v4 .recipe-ingredient label.done{text-decoration:line-through;color:var(--text-dim)}
      body.shopping-recipes-v4 .recipe-ingredient input[type="checkbox"],body.shopping-recipes-v4 .recipe-add-item input[type="checkbox"]{width:17px!important;height:17px!important;min-width:17px!important;appearance:none;background:transparent;border:1.5px solid var(--accent)!important;border-radius:4px;display:grid;place-content:center}
      body.shopping-recipes-v4 .recipe-ingredient input[type="checkbox"]:checked::before{content:'';width:7px;height:4px;border-left:2px solid #FBBF24;border-bottom:2px solid #FBBF24;transform:rotate(-45deg)}
      body.shopping-recipes-v4 .recipe-add-item{color:var(--text-dim);margin-top:1px}
      body.shopping-recipes-v4 .recipe-add-item input[type="text"]{border-color:transparent!important;background:transparent!important}
      body.shopping-recipes-v4 .recipe-add-item input[type="text"]:focus{border-color:rgba(251,191,36,.28)!important;background:rgba(251,191,36,.025)!important}
      @media(max-width:520px){
        body.shopping-recipes-v4 .recipe-header{min-height:38px}
        body.shopping-recipes-v4 .recipe-name-v4,body.shopping-recipes-v4 .recipe-name-link-v4{min-height:34px;font-size:13px}
        body.shopping-recipes-v4 .recipe-items{padding-left:14px!important}
        body.shopping-recipes-v4 .recipe-ingredient,body.shopping-recipes-v4 .recipe-add-item{min-height:34px}
        body.shopping-recipes-v4 .recipe-ingredient label{min-height:32px;padding:5px 6px}
        body.shopping-recipes-v4 .recipe-meta-editor,body.shopping-recipes-v4 .new-recipe-v4{grid-template-columns:1fr}
        body.shopping-recipes-v4 .recipe-meta-editor input,body.shopping-recipes-v4 .new-recipe-v4 input,body.shopping-recipes-v4 .recipe-ingredient input[type="text"],body.shopping-recipes-v4 .recipe-add-item input[type="text"]{font-size:16px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function renderDropdown() {
    var menu = document.getElementById('recipes-dropdown');
    if (!menu) return;
    var list = recipes();
    if (!list.length) { menu.innerHTML = '<a href="#" onclick="return false;">Inga recept sparade</a>'; return; }
    menu.innerHTML = list.map(function (recipe) {
      return '<a href="#" onclick="addRecipeItems(' + recipe.id + '); return false;">Lägg till: ' + escapeHtml(recipe.name) + '</a>';
    }).join('');
  }

  function renderRecipes() {
    var root = document.getElementById('recipes-list');
    if (!root) return;
    var list = recipes();
    var html = addingRecipe
      ? '<div class="new-recipe-v4" data-new-recipe-meta="true"><input id="new-recipe-name-v4" type="text" placeholder="Nytt recept"><input id="new-recipe-url-v4" type="url" inputmode="url" placeholder="Länk (valfritt)"></div>'
      : '<div class="new-recipe" data-action="add-recipe">+ Lägg till recept</div>';

    list.forEach(function (recipe) {
      var open = openIds.has(recipe.id);
      html += '<div class="recipe-item' + (open ? ' open' : '') + '" data-recipe-id="' + recipe.id + '">' +
        '<div class="recipe-header">' +
          '<button type="button" class="recipe-toggle" data-action="toggle-recipe" aria-label="Visa eller dölj ingredienser">›</button>';

      if (editingMetaId === recipe.id) {
        html += '<div class="recipe-meta-editor" data-recipe-meta-editor="' + recipe.id + '">' +
          '<input id="recipe-name-edit-v4-' + recipe.id + '" type="text" value="' + escapeAttr(recipe.name) + '" placeholder="Receptnamn">' +
          '<input id="recipe-url-edit-v4-' + recipe.id + '" type="url" inputmode="url" value="' + escapeAttr(recipe.url || '') + '" placeholder="Länk (valfritt)">' +
        '</div>';
      } else {
        html += '<div class="recipe-title-wrap">';
        if (recipe.url) {
          html += '<a class="recipe-name-link-v4" href="' + escapeAttr(recipe.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(recipe.name) + '<span class="recipe-link-mark">↗</span></a>';
        } else {
          html += '<span class="recipe-name-v4" data-action="edit-recipe">' + escapeHtml(recipe.name) + '</span>';
        }
        html += '<button type="button" class="recipe-edit-meta-v4" data-action="edit-recipe" title="Redigera namn och länk" aria-label="Redigera namn och länk">✎</button></div>';
      }

      html += '<button type="button" class="recipe-delete-v4" data-action="delete-recipe" title="Radera recept" aria-label="Radera recept">×</button>' +
        '</div><div class="recipe-items">';

      recipe.items.forEach(function (ingredient, index) {
        var editing = editingIngredient && editingIngredient.recipeId === recipe.id && editingIngredient.index === index;
        if (editing) {
          html += '<div class="recipe-ingredient">' +
            '<input type="checkbox" onmousedown="event.preventDefault();commitRecipeIngredientDraft(' + recipe.id + ',' + index + ',!this.checked)">' +
            '<input id="recipe-edit-v4-' + recipe.id + '-' + index + '" type="text" value="' + escapeAttr(ingredient) + '" onkeydown="handleRecipeIngredientKeydown(' + recipe.id + ',' + index + ',event)" onblur="commitRecipeIngredientEdit(' + recipe.id + ',' + index + ')">' +
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
        '<input id="new-recipe-ingredient-v4-' + recipe.id + '" type="text" placeholder="+ Lägg till ingrediens" onkeydown="saveRecipeItem(' + recipe.id + ',event)" onblur="commitNewRecipeIngredientFromInput(' + recipe.id + ')">' +
      '</div></div></div>';
    });

    root.innerHTML = html;
    if (editingMetaId != null) focusNow(document.getElementById('recipe-name-edit-v4-' + editingMetaId));
    if (editingIngredient) focusNow(document.getElementById('recipe-edit-v4-' + editingIngredient.recipeId + '-' + editingIngredient.index));
    if (addingRecipe) focusNow(document.getElementById('new-recipe-name-v4'));
    if (addIngredientFocusId != null) {
      var id = addIngredientFocusId; addIngredientFocusId = null;
      focusNow(document.getElementById('new-recipe-ingredient-v4-' + id));
    }
  }

  function renderAllRecipes() { renderDropdown(); renderRecipes(); }
  function findRecipe(id) { return recipes().find(function (r) { return Number(r.id) === Number(id); }) || null; }

  function commitRecipeMeta(id) {
    id = Number(id);
    if (editingMetaId !== id) return;
    var nameInput = document.getElementById('recipe-name-edit-v4-' + id);
    var urlInput = document.getElementById('recipe-url-edit-v4-' + id);
    var name = String(nameInput && nameInput.value || '').trim();
    var rawUrl = String(urlInput && urlInput.value || '').trim();
    var url = normalizeUrl(rawUrl);
    if (rawUrl && !url) { focusNow(urlInput); return; }
    var list = recipes();
    var recipe = list.find(function (r) { return Number(r.id) === id; });
    editingMetaId = null;
    if (!recipe) return renderRecipes();
    if (!name) {
      list = list.filter(function (r) { return Number(r.id) !== id; });
      openIds.delete(id);
    } else {
      recipe.name = name;
      recipe.url = url;
    }
    saveRecipes(list);
  }

  function commitNewRecipe() {
    if (!addingRecipe) return;
    var nameInput = document.getElementById('new-recipe-name-v4');
    var urlInput = document.getElementById('new-recipe-url-v4');
    var name = String(nameInput && nameInput.value || '').trim();
    var rawUrl = String(urlInput && urlInput.value || '').trim();
    if (!name) { addingRecipe = false; renderRecipes(); return; }
    var url = normalizeUrl(rawUrl);
    if (rawUrl && !url) { focusNow(urlInput); return; }
    var list = recipes();
    var id = list.reduce(function (max, r) { return Math.max(max, Number(r.id) || 0); }, 0) + 1;
    list.push({id:id, name:name, url:url, items:[]});
    addingRecipe = false;
    openIds.add(id);
    saveRecipes(list);
  }

  function addIngredient(recipeId, text, checked) {
    text = String(text || '').trim();
    if (!text) return false;
    var list = recipes();
    var recipe = list.find(function (r) { return Number(r.id) === Number(recipeId); });
    if (!recipe) return false;
    if (!recipe.items.some(function (item) { return item.toLocaleLowerCase('sv-SE') === text.toLocaleLowerCase('sv-SE'); })) recipe.items.push(text);
    openIds.add(Number(recipeId));
    upsertShopping([text], !!checked);
    saveRecipes(list);
    return true;
  }

  function installGlobals() {
    window.renderRecipesDropdown = renderDropdown;
    window.renderRecipes = renderRecipes;
    window.recipeIngredientIsChecked = ingredientChecked;

    window.addRecipeItems = function (recipeId) {
      var recipe = findRecipe(recipeId);
      if (!recipe || !recipe.items.length) return alert('Receptet har inga ingredienser');
      upsertShopping(recipe.items, false);
    };

    window.startEditRecipeIngredient = function (recipeId, index) {
      editingIngredient = {recipeId:Number(recipeId), index:Number(index)};
      openIds.add(Number(recipeId));
      renderRecipes();
    };

    function commitIngredientEdit(recipeId, index, moveToAdd) {
      recipeId = Number(recipeId); index = Number(index);
      var input = document.getElementById('recipe-edit-v4-' + recipeId + '-' + index);
      var text = String(input && input.value || '').trim();
      var list = recipes();
      var recipe = list.find(function (r) { return Number(r.id) === recipeId; });
      if (!recipe || index < 0 || index >= recipe.items.length) { editingIngredient = null; renderRecipes(); return; }
      if (!text) recipe.items.splice(index, 1);
      else { recipe.items[index] = text; upsertShopping([text], false); }
      editingIngredient = null;
      if (moveToAdd) addIngredientFocusId = recipeId;
      saveRecipes(list);
    }

    window.commitRecipeIngredientEdit = function (recipeId, index) {
      if (!editingIngredient || editingIngredient.recipeId !== Number(recipeId) || editingIngredient.index !== Number(index)) return;
      commitIngredientEdit(recipeId, index, false);
    };
    window.handleRecipeIngredientKeydown = function (recipeId, index, event) {
      if (event.key === 'Enter') { event.preventDefault(); commitIngredientEdit(recipeId, index, true); }
      else if (event.key === 'Escape') { editingIngredient = null; renderRecipes(); }
      else if (event.key === 'Backspace' && event.target.value === '') { event.preventDefault(); commitIngredientEdit(recipeId, index, false); }
    };
    window.commitRecipeIngredientDraft = function (recipeId, index, checked) {
      var input = document.getElementById('recipe-edit-v4-' + recipeId + '-' + index);
      var text = String(input && input.value || '').trim();
      if (!text) return;
      var list = recipes();
      var recipe = list.find(function (r) { return Number(r.id) === Number(recipeId); });
      if (!recipe || index < 0 || index >= recipe.items.length) return;
      recipe.items[index] = text;
      editingIngredient = null;
      upsertShopping([text], !!checked);
      saveRecipes(list);
    };
    window.toggleRecipeIngredient = function (recipeId, text, checked, checkbox) {
      upsertShopping([String(text || '').trim()], !!checked);
      if (checkbox && checkbox.nextElementSibling) checkbox.nextElementSibling.classList.toggle('done', !!checked);
    };
    window.saveRecipeItem = function (recipeId, event) {
      if (!event || event.key !== 'Enter') return;
      event.preventDefault();
      var text = String(event.target && event.target.value || '').trim();
      if (!text) return;
      if (addIngredient(recipeId, text, false)) { addIngredientFocusId = Number(recipeId); renderRecipes(); }
    };
    window.commitNewRecipeIngredientFromInput = function (recipeId) {
      var input = document.getElementById('new-recipe-ingredient-v4-' + recipeId);
      var text = String(input && input.value || '').trim();
      if (text) addIngredient(recipeId, text, false);
    };
    window.commitNewRecipeIngredientDraft = function (recipeId, checked) {
      var input = document.getElementById('new-recipe-ingredient-v4-' + recipeId);
      var text = String(input && input.value || '').trim();
      if (text) addIngredient(recipeId, text, checked);
    };
    window.deleteRecipeItem = function (recipeId, index) {
      var list = recipes();
      var recipe = list.find(function (r) { return Number(r.id) === Number(recipeId); });
      if (!recipe || index < 0 || index >= recipe.items.length) return;
      recipe.items.splice(index, 1); saveRecipes(list);
    };
  }

  function handleRootClick(event) {
    var root = document.getElementById('recipes-list');
    if (!root || !root.contains(event.target)) return;
    var recipeEl = event.target.closest('.recipe-item');
    var recipeId = recipeEl ? Number(recipeEl.dataset.recipeId) : null;
    var actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    var action = actionEl.dataset.action;
    if (action === 'add-recipe') {
      addingRecipe = true; editingMetaId = null; renderRecipes();
    } else if (action === 'toggle-recipe' && recipeId != null) {
      if (openIds.has(recipeId)) openIds.delete(recipeId); else openIds.add(recipeId); renderRecipes();
    } else if (action === 'edit-recipe' && recipeId != null) {
      editingMetaId = recipeId; openIds.add(recipeId); renderRecipes();
    } else if (action === 'delete-recipe' && recipeId != null) {
      if (!confirm('Radera receptet?')) return;
      openIds.delete(recipeId); if (editingMetaId === recipeId) editingMetaId = null;
      saveRecipes(recipes().filter(function (r) { return Number(r.id) !== recipeId; }));
    }
  }

  function handleRootKeydown(event) {
    if (event.target.id === 'new-recipe-name-v4') {
      if (event.key === 'Enter') { event.preventDefault(); focusNow(document.getElementById('new-recipe-url-v4')); }
      else if (event.key === 'Escape') { addingRecipe = false; renderRecipes(); }
      return;
    }
    if (event.target.id === 'new-recipe-url-v4') {
      if (event.key === 'Enter') { event.preventDefault(); commitNewRecipe(); }
      else if (event.key === 'Escape') { addingRecipe = false; renderRecipes(); }
      return;
    }
    if (editingMetaId != null && event.target.closest('[data-recipe-meta-editor]')) {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.target.id === 'recipe-name-edit-v4-' + editingMetaId) focusNow(document.getElementById('recipe-url-edit-v4-' + editingMetaId));
        else commitRecipeMeta(editingMetaId);
      } else if (event.key === 'Escape') { editingMetaId = null; renderRecipes(); }
    }
  }

  function handleRootFocusOut(event) {
    if (metaBlurTimer) clearTimeout(metaBlurTimer);
    if (!event.target.closest('.recipe-meta-editor') && !event.target.closest('.new-recipe-v4')) return;
    metaBlurTimer = setTimeout(function () {
      metaBlurTimer = null;
      var active = document.activeElement;
      if (active && (active.closest && (active.closest('.recipe-meta-editor') || active.closest('.new-recipe-v4')))) return;
      if (editingMetaId != null) commitRecipeMeta(editingMetaId);
      else if (addingRecipe) commitNewRecipe();
    }, 0);
  }

  function install() {
    if (window.__shoppingRecipesV4Installed) return;
    var root = document.getElementById('recipes-list');
    if (!root || !engine()) { setTimeout(install, 40); return; }
    window.__shoppingRecipesV4Installed = true;
    document.body.classList.remove('shopping-recipes-v3');
    document.body.classList.add('shopping-recipes-v4');
    addStyles();
    installGlobals();
    root.addEventListener('click', handleRootClick, false);
    root.addEventListener('keydown', handleRootKeydown, false);
    root.addEventListener('focusout', handleRootFocusOut, false);
    renderAllRecipes();
    bindFirebase();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 0); }, {once:true});
  else setTimeout(install, 0);
})();
