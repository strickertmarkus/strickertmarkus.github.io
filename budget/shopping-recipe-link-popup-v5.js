(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  var STORAGE_KEY = 'sh_recipes_v3';
  var FIREBASE_KEY = 'sh_recipes_v3';
  var activeRecipeId = null;

  function normalizeUrl(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = 'https://' + raw;
    try {
      var parsed = new URL(raw);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
    } catch (_) { return ''; }
  }

  function readStore() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(raw)) return {version:4,updatedAt:0,recipes:raw};
      return raw && typeof raw === 'object' ? raw : {version:4,updatedAt:0,recipes:[]};
    } catch (_) { return {version:4,updatedAt:0,recipes:[]}; }
  }

  function recipeById(id) {
    var store = readStore();
    return (store.recipes || []).find(function (r) { return Number(r.id) === Number(id); }) || null;
  }

  function writeLink(id, rawUrl) {
    var store = readStore();
    var recipe = (store.recipes || []).find(function (r) { return Number(r.id) === Number(id); });
    if (!recipe) return false;
    var url = normalizeUrl(rawUrl);
    if (String(rawUrl || '').trim() && !url) return false;
    recipe.url = url;
    store.version = 4;
    store.updatedAt = Date.now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch (_) {}
    try {
      if (typeof firebase !== 'undefined' && firebase.database) {
        firebase.database().ref(FIREBASE_KEY).set(JSON.stringify(store));
      }
    } catch (_) {}
    try { if (typeof window.renderRecipes === 'function') window.renderRecipes(); } catch (_) {}
    try { if (typeof window.renderRecipesDropdown === 'function') window.renderRecipesDropdown(); } catch (_) {}
    return true;
  }

  function addStyles() {
    if (document.getElementById('shopping-recipe-link-popup-v5-style')) return;
    var style = document.createElement('style');
    style.id = 'shopping-recipe-link-popup-v5-style';
    style.textContent = `
      body.shopping-recipe-link-popup-v5 .recipe-header{position:relative!important;padding-right:73px!important}
      body.shopping-recipe-link-popup-v5 .recipe-title-wrap{padding-right:0!important}

      /* Native SVG chevron from first paint. The legacy text glyph is never visible. */
      body.shopping-recipe-link-popup-v5 .recipe-toggle{
        font-size:0!important;
        width:22px!important;
        min-width:22px!important;
        height:34px!important;
      }
      body.shopping-recipe-link-popup-v5 .recipe-toggle::before{
        content:'';
        display:block;
        width:17px;
        height:17px;
        background-repeat:no-repeat;
        background-position:center;
        background-size:17px 17px;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237F8DA0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m9 18 6-6-6-6'/%3E%3C/svg%3E");
        pointer-events:none;
      }

      body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4,
      body.shopping-recipe-link-popup-v5 .recipe-delete-v4{
        position:absolute!important;top:50%!important;transform:translateY(-50%)!important;
        width:34px!important;height:36px!important;min-width:34px!important;
        display:grid!important;place-items:center!important;padding:0!important;
        border:0!important;background:transparent!important;box-shadow:none!important;
        opacity:.78!important;line-height:1!important;color:#7F8DA0!important;
        -webkit-tap-highlight-color:transparent!important
      }
      body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4{
        right:37px!important;
        font-size:0!important;
      }
      body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4>*{display:none!important}
      body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4::before{
        content:'';
        display:block;
        width:21px;
        height:21px;
        background-repeat:no-repeat;
        background-position:center;
        background-size:21px 21px;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237F8DA0' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.6 13.4a4 4 0 0 0 5.66 0l2.14-2.14a4 4 0 1 0-5.66-5.66l-1.22 1.22'/%3E%3Cpath d='M13.4 10.6a4 4 0 0 0-5.66 0L5.6 12.74a4 4 0 1 0 5.66 5.66l1.22-1.22'/%3E%3C/svg%3E");
        pointer-events:none;
      }
      body.shopping-recipe-link-popup-v5 .recipe-delete-v4{right:1px!important;font-size:25px!important;font-weight:300!important}
      body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4:hover,
      body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4:active{color:#FBBF24!important;opacity:1!important}
      body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4:hover::before,
      body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4:active::before{
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FBBF24' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.6 13.4a4 4 0 0 0 5.66 0l2.14-2.14a4 4 0 1 0-5.66-5.66l-1.22 1.22'/%3E%3Cpath d='M13.4 10.6a4 4 0 0 0-5.66 0L5.6 12.74a4 4 0 1 0 5.66 5.66l1.22-1.22'/%3E%3C/svg%3E");
      }
      body.shopping-recipe-link-popup-v5 .recipe-delete-v4:hover,
      body.shopping-recipe-link-popup-v5 .recipe-delete-v4:active{color:#F87171!important;opacity:1!important}
      body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4:active,
      body.shopping-recipe-link-popup-v5 .recipe-delete-v4:active{transform:translateY(-50%) scale(.90)!important}

      /* Existing recipe inline edit is name-only. Links are managed by the link icon. */
      body.shopping-recipe-link-popup-v5 .recipe-meta-editor{grid-template-columns:minmax(0,1fr)!important}
      body.shopping-recipe-link-popup-v5 .recipe-meta-editor input[type="url"]{display:none!important}

      #recipe-link-popup-v5{
        position:fixed;inset:0;z-index:2147483200;display:none;place-items:center;padding:18px;
        background:rgba(3,7,13,.58);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)
      }
      #recipe-link-popup-v5.show{display:grid}
      .recipe-link-card-v5{
        width:min(390px,100%);padding:15px;border:1px solid rgba(251,191,36,.20);
        border-radius:14px;background:#151D27;box-shadow:0 24px 70px rgba(0,0,0,.55)
      }
      .recipe-link-head-v5{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:11px}
      .recipe-link-kicker-v5{font-size:9px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;color:#FBBF24}
      .recipe-link-title-v5{margin-top:2px;font-size:15px;font-weight:750;color:#F0F6FC;overflow-wrap:anywhere}
      .recipe-link-close-v5{border:0;background:transparent;color:#7F8DA0;font-size:22px;line-height:1;padding:1px 4px;cursor:pointer}
      .recipe-link-card-v5 label{display:block;margin-bottom:5px;color:#8B949E;font-size:9px;font-weight:750;text-transform:uppercase;letter-spacing:.45px}
      .recipe-link-card-v5 input{
        width:100%;height:40px;padding:8px 10px;border:1px solid rgba(251,191,36,.28);border-radius:8px;
        background:#202833;color:#F0F6FC;outline:none;font:500 14px/1.2 'Inter',sans-serif
      }
      .recipe-link-card-v5 input:focus{border-color:rgba(251,191,36,.62);box-shadow:0 0 0 2px rgba(251,191,36,.08)}
      .recipe-link-error-v5{min-height:16px;margin-top:4px;color:#F87171;font-size:9px}
      .recipe-link-actions-v5{display:flex;align-items:center;justify-content:flex-end;gap:7px;margin-top:9px}
      .recipe-link-actions-v5 button{min-height:34px;padding:6px 10px;border-radius:7px;font:700 10px/1 'Inter',sans-serif;cursor:pointer}
      .recipe-link-remove-v5{margin-right:auto;border:0!important;background:transparent!important;color:#F87171!important;padding-left:0!important}
      .recipe-link-cancel-v5{border:1px solid rgba(255,255,255,.09);background:transparent;color:#9AA8B8}
      .recipe-link-save-v5{border:1px solid rgba(251,191,36,.38);background:rgba(251,191,36,.14);color:#FBBF24}
      @media(max-width:520px){
        body.shopping-recipe-link-popup-v5 .recipe-header{padding-right:78px!important}
        body.shopping-recipe-link-popup-v5 .recipe-toggle{width:24px!important;min-width:24px!important;height:38px!important}
        body.shopping-recipe-link-popup-v5 .recipe-toggle::before{width:19px;height:19px;background-size:19px 19px}
        body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4,
        body.shopping-recipe-link-popup-v5 .recipe-delete-v4{width:37px!important;height:40px!important;min-width:37px!important}
        body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4{right:39px!important}
        body.shopping-recipe-link-popup-v5 .recipe-edit-meta-v4::before{width:22px;height:22px;background-size:22px 22px}
        body.shopping-recipe-link-popup-v5 .recipe-delete-v4{font-size:27px!important}
        .recipe-link-card-v5 input{font-size:16px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function decorateAccessibility() {
    var root = document.getElementById('recipes-list');
    if (!root) return;
    root.querySelectorAll('.recipe-edit-meta-v4').forEach(function (button) {
      button.title = 'Receptlänk';
      button.setAttribute('aria-label','Lägg till eller ändra receptlänk');
    });
  }

  function ensurePopup() {
    var popup = document.getElementById('recipe-link-popup-v5');
    if (popup) return popup;
    popup = document.createElement('div');
    popup.id = 'recipe-link-popup-v5';
    popup.innerHTML = '<div class="recipe-link-card-v5" role="dialog" aria-modal="true" aria-labelledby="recipe-link-title-v5">' +
      '<div class="recipe-link-head-v5"><div><div class="recipe-link-kicker-v5">Receptlänk</div><div class="recipe-link-title-v5" id="recipe-link-title-v5"></div></div><button type="button" class="recipe-link-close-v5" data-link-close-v5 aria-label="Stäng">×</button></div>' +
      '<label for="recipe-link-input-v5">Länk</label><input id="recipe-link-input-v5" type="url" inputmode="url" autocomplete="url" placeholder="https://…">' +
      '<div class="recipe-link-error-v5" id="recipe-link-error-v5"></div>' +
      '<div class="recipe-link-actions-v5"><button type="button" class="recipe-link-remove-v5" data-link-remove-v5>Ta bort länk</button><button type="button" class="recipe-link-cancel-v5" data-link-close-v5>Avbryt</button><button type="button" class="recipe-link-save-v5" data-link-save-v5>Spara</button></div>' +
      '</div>';
    document.body.appendChild(popup);

    popup.addEventListener('click', function (event) {
      if (event.target === popup || event.target.closest('[data-link-close-v5]')) closePopup();
      else if (event.target.closest('[data-link-save-v5]')) savePopup();
      else if (event.target.closest('[data-link-remove-v5]')) removePopupLink();
    });
    popup.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); closePopup(); }
      else if (event.key === 'Enter' && event.target.id === 'recipe-link-input-v5') { event.preventDefault(); savePopup(); }
    });
    return popup;
  }

  function openPopup(recipeId) {
    var recipe = recipeById(recipeId);
    if (!recipe) return;
    activeRecipeId = Number(recipeId);
    var popup = ensurePopup();
    document.getElementById('recipe-link-title-v5').textContent = recipe.name || 'Recept';
    var input = document.getElementById('recipe-link-input-v5');
    input.value = recipe.url || '';
    document.getElementById('recipe-link-error-v5').textContent = '';
    var remove = popup.querySelector('[data-link-remove-v5]');
    if (remove) remove.style.visibility = recipe.url ? 'visible' : 'hidden';
    popup.classList.add('show');
    setTimeout(function () {
      try { input.focus({preventScroll:true}); } catch (_) { try { input.focus(); } catch (ignore) {} }
      try { input.setSelectionRange(input.value.length,input.value.length); } catch (_) {}
    }, 0);
  }

  function closePopup() {
    var popup = document.getElementById('recipe-link-popup-v5');
    if (popup) popup.classList.remove('show');
    activeRecipeId = null;
  }

  function savePopup() {
    if (activeRecipeId == null) return;
    var input = document.getElementById('recipe-link-input-v5');
    var raw = String(input && input.value || '').trim();
    if (raw && !normalizeUrl(raw)) {
      document.getElementById('recipe-link-error-v5').textContent = 'Ange en giltig webblänk.';
      return;
    }
    if (!writeLink(activeRecipeId, raw)) return;
    closePopup();
  }

  function removePopupLink() {
    if (activeRecipeId == null) return;
    writeLink(activeRecipeId, '');
    closePopup();
  }

  function handleRecipeClickCapture(event) {
    var root = document.getElementById('recipes-list');
    if (!root || !root.contains(event.target)) return;

    var linkButton = event.target && event.target.closest ? event.target.closest('.recipe-edit-meta-v4') : null;
    if (linkButton) {
      var recipe = linkButton.closest('.recipe-item');
      if (!recipe) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openPopup(Number(recipe.dataset.recipeId));
      return;
    }

    /* A plain recipe heading used to enter the legacy meta editor, which
       briefly rendered the pencil. Treat it as expand/collapse instead. */
    var title = event.target && event.target.closest ? event.target.closest('.recipe-name-v4') : null;
    if (title) {
      var recipeItem = title.closest('.recipe-item');
      var toggle = recipeItem && recipeItem.querySelector('.recipe-toggle');
      if (!toggle) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      toggle.click();
    }
  }

  function install() {
    if (window.__shoppingRecipeLinkPopupV5Installed) return;
    var root = document.getElementById('recipes-list');
    if (!root || !window.__shoppingRecipesV4Installed) { setTimeout(install,40); return; }
    window.__shoppingRecipeLinkPopupV5Installed = true;
    document.body.classList.add('shopping-recipe-link-popup-v5');
    addStyles();
    ensurePopup();
    decorateAccessibility();
    root.addEventListener('click', handleRecipeClickCapture, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(install,0); }, {once:true});
  else setTimeout(install,0);
})();
