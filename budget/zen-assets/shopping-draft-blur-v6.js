(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  function valueOf(id) {
    var el = document.getElementById(id);
    return String(el && el.value || '').trim();
  }

  function wrapCancel(name, inputId, saveName) {
    var original = window[name];
    var save = window[saveName];
    if (typeof original !== 'function' || typeof save !== 'function' || original.__shoppingDraftBlurV6) return;

    var wrapped = function () {
      var text = valueOf(inputId);
      if (text) return window[saveName].apply(this, arguments);
      return original.apply(this, arguments);
    };
    wrapped.__shoppingDraftBlurV6 = true;
    window[name] = wrapped;
  }

  function wrapCancelByPrefix(name, prefix, saveName) {
    var original = window[name];
    var save = window[saveName];
    if (typeof original !== 'function' || typeof save !== 'function' || original.__shoppingDraftBlurV6) return;

    var wrapped = function (id) {
      var text = valueOf(prefix + id);
      if (text) return window[saveName].apply(this, arguments);
      return original.apply(this, arguments);
    };
    wrapped.__shoppingDraftBlurV6 = true;
    window[name] = wrapped;
  }

  function install() {
    if (window.__shoppingDraftBlurV6Installed) return;
    if (typeof window.saveNewItem !== 'function' || typeof window.saveNewCategory !== 'function') {
      setTimeout(install, 40);
      return;
    }

    window.__shoppingDraftBlurV6Installed = true;

    /* New article: clicking away commits any typed text instead of allowing a
       later render/cancel path to discard the draft. */
    wrapCancel('cancelAddItem', 'new-item-input', 'saveNewItem');

    /* New heading was the main loss path in the legacy page: cancelAddCategory
       always discarded the draft. Non-empty headings now commit on blur. */
    wrapCancel('cancelAddCategory', 'new-category-input', 'saveNewCategory');

    /* Keep the same rule for the persistent recipe UI as well. */
    wrapCancel('cancelAddRecipe', 'new-recipe-input-v3', 'saveNewRecipe');

    /* Legacy input-based item editing can still briefly be used internally by
       the Home-parity persistence bridge. If it loses focus with edited text,
       commit immediately rather than waiting for a cancel/re-render cycle. */
    wrapCancelByPrefix('cancelEditItem', 'item-edit-', 'saveEditItem');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
