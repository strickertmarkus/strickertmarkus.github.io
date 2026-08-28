(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  function engine() {
    return window.__shoppingListEngineV7 || null;
  }

  function readRecipes() {
    try {
      var store = JSON.parse(localStorage.getItem('sh_recipes_v3') || '{}');
      if (Array.isArray(store)) return store;
      return Array.isArray(store.recipes) ? store.recipes : [];
    } catch (_) {
      return [];
    }
  }

  function recipeById(id) {
    return readRecipes().find(function (recipe) {
      return Number(recipe && recipe.id) === Number(id);
    }) || null;
  }

  function refreshRecipeChecks() {
    var api = engine();
    var root = document.getElementById('recipes-list');
    if (!api || !root) return;
    root.querySelectorAll('.recipe-ingredient').forEach(function (row) {
      var label = row.querySelector('label');
      var box = row.querySelector('input[type="checkbox"]');
      if (!label || !box) return;
      var checked = api.rawIngredientChecked(label.textContent || '');
      box.checked = checked;
      label.classList.toggle('done', checked);
    });
  }

  function wrapNewIngredientFunction(name) {
    var original = window[name];
    if (typeof original !== 'function' || original.__shoppingRecipeBridgeV7) return;
    var wrapped = function (recipeId) {
      var input = document.getElementById('new-recipe-ingredient-v3-' + recipeId);
      var raw = String(input && input.value || '').trim();
      var result = original.apply(this, arguments);
      var api = engine();
      if (api && raw) api.routeRecipeRaw(raw);
      setTimeout(refreshRecipeChecks, 0);
      return result;
    };
    wrapped.__shoppingRecipeBridgeV7 = true;
    window[name] = wrapped;
  }

  function wrapEditedIngredientFunction(name) {
    var original = window[name];
    if (typeof original !== 'function' || original.__shoppingRecipeBridgeV7) return;
    var wrapped = function (recipeId, index) {
      var input = document.getElementById('recipe-edit-v3-' + recipeId + '-' + index);
      var raw = String(input && input.value || '').trim();
      var result = original.apply(this, arguments);
      var api = engine();
      if (api && raw) api.routeRecipeRaw(raw);
      setTimeout(refreshRecipeChecks, 0);
      return result;
    };
    wrapped.__shoppingRecipeBridgeV7 = true;
    window[name] = wrapped;
  }

  function install() {
    if (window.__shoppingRecipeBridgeV7Installed) return;
    var api = engine();
    if (!api || typeof window.addRecipeItems !== 'function' || !document.getElementById('recipes-list')) {
      setTimeout(install, 50);
      return;
    }

    window.__shoppingRecipeBridgeV7Installed = true;

    wrapNewIngredientFunction('saveRecipeItem');
    wrapNewIngredientFunction('commitNewRecipeIngredientFromInput');
    wrapNewIngredientFunction('commitNewRecipeIngredientDraft');
    wrapEditedIngredientFunction('commitRecipeIngredientEdit');
    wrapEditedIngredientFunction('commitRecipeIngredientDraft');

    window.toggleRecipeIngredient = function (recipeId, rawText, checked, checkbox) {
      var current = engine();
      if (!current) return;
      current.upsertRecipeItems([rawText], !!checked);
      if (checkbox && checkbox.nextElementSibling) checkbox.nextElementSibling.classList.toggle('done', !!checked);
      setTimeout(refreshRecipeChecks, 0);
    };
    window.toggleRecipeIngredient.__shoppingRecipeBridgeV7 = true;

    window.addRecipeItems = function (recipeId) {
      var recipe = recipeById(recipeId);
      if (!recipe || !Array.isArray(recipe.items) || !recipe.items.length) return alert('Receptet har inga ingredienser');
      var current = engine();
      if (!current) return;
      current.upsertRecipeItems(recipe.items, false);
      setTimeout(refreshRecipeChecks, 0);
    };
    window.addRecipeItems.__shoppingRecipeBridgeV7 = true;

    var root = document.getElementById('recipes-list');
    if (root && typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function () { refreshRecipeChecks(); });
      observer.observe(root, { childList: true, subtree: true });
    }

    refreshRecipeChecks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 0); }, { once: true });
  else setTimeout(install, 0);
})();
