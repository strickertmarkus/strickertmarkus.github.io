(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  var isBudgetPage = path.endsWith('/budget/budget.html') || path.endsWith('/budget.html') ||
    path.endsWith('/budget/budget_maja.html') || path.endsWith('/budget_maja.html');

  function installUiCleanup() {
    if (!isBudgetPage || window.__budgetUiCleanupV4Installed) return;
    window.__budgetUiCleanupV4Installed = true;

    var style = document.createElement('style');
    style.id = 'budget-ui-cleanup-v4-style';
    style.textContent =
      '#set-start-month-btn{display:none!important}' +
      '#month-nav>button[onclick*="deleteCurrentMonth"]{display:none!important}' +
      '.budget-month-delete-v4{margin-left:10px;width:24px;height:24px;border:0;border-radius:6px;background:transparent;color:#94A3B8;font:700 16px/1 Inter,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 24px}' +
      '.budget-month-delete-v4:hover{color:#F87171;background:rgba(248,113,113,.10)}' +
      '.custom-dropdown-item.budget-month-row-v4{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important}';
    document.head.appendChild(style);

    function decorateMonthMenu() {
      var menu = document.getElementById('month-dropdown-menu');
      if (!menu) return;
      Array.prototype.slice.call(menu.querySelectorAll('.custom-dropdown-item')).forEach(function (item) {
        if (item.querySelector('.budget-month-delete-v4')) return;
        item.classList.add('budget-month-row-v4');
        var label = String(item.textContent || '').trim();
        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'budget-month-delete-v4';
        remove.setAttribute('aria-label','Radera ' + label);
        remove.title = 'Radera ' + label;
        remove.textContent = '×';
        remove.addEventListener('click',function (event) {
          event.preventDefault();
          event.stopPropagation();
          /* Reuse the page's own month-selection and deletion paths so its
             existing persistence/save logic remains the single source of truth. */
          if (typeof item.click === 'function') item.click();
          setTimeout(function () {
            if (typeof window.deleteCurrentMonth === 'function') window.deleteCurrentMonth();
          },0);
        });
        item.appendChild(remove);
      });
    }

    decorateMonthMenu();
    var menu = document.getElementById('month-dropdown-menu');
    if (menu && window.MutationObserver) {
      new MutationObserver(decorateMonthMenu).observe(menu,{childList:true});
    }
  }

  function loadStable() {
    var stable = document.createElement('script');
    stable.src = 'budget-user-toggle-stable-999.js?v=20260828-2215-stable-999';
    stable.async = false;
    stable.onload = installUiCleanup;
    document.head.appendChild(stable);
  }

  loadStable();
})();