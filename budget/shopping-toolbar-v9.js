(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  function addStyles() {
    if (document.getElementById('shopping-toolbar-v9-style')) return;
    var style = document.createElement('style');
    style.id = 'shopping-toolbar-v9-style';
    style.textContent = `
      body.shopping-toolbar-v9 .header-right-top .undo-btn{
        order:-1!important;width:30px!important;min-width:30px!important;height:34px!important;min-height:34px!important;
        padding:0!important;margin:0 2px 0 0!important;display:grid!important;place-items:center!important;
        border:0!important;border-radius:7px!important;background:transparent!important;box-shadow:none!important;
        color:var(--text-sec)!important;opacity:.78!important;line-height:1!important;
        transition:color .16s ease,background-color .16s ease,opacity .16s ease,transform .12s ease!important
      }
      body.shopping-toolbar-v9 .header-right-top .undo-btn svg{width:18px;height:18px;display:block;pointer-events:none}
      body.shopping-toolbar-v9 .header-right-top .undo-btn:hover{color:var(--accent)!important;background:rgba(251,191,36,.045)!important;opacity:1!important}
      body.shopping-toolbar-v9 .header-right-top .undo-btn:active{transform:scale(.90)!important}

      /* First-paint recipe icons. This stylesheet is installed before recipes-v4 renders,
         so the legacy pencil/text chevron can never become visible. */
      body.shopping-toolbar-v9 .recipe-toggle{font-size:0!important;width:22px!important;min-width:22px!important;height:34px!important}
      body.shopping-toolbar-v9 .recipe-toggle::before{
        content:'';display:block;width:17px;height:17px;background-repeat:no-repeat;background-position:center;background-size:17px 17px;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237F8DA0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m9 18 6-6-6-6'/%3E%3C/svg%3E");pointer-events:none
      }
      body.shopping-toolbar-v9 .recipe-edit-meta-v4{font-size:0!important}
      body.shopping-toolbar-v9 .recipe-edit-meta-v4>*{display:none!important}
      body.shopping-toolbar-v9 .recipe-edit-meta-v4::before{
        content:'';display:block;width:21px;height:21px;background-repeat:no-repeat;background-position:center;background-size:21px 21px;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237F8DA0' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.6 13.4a4 4 0 0 0 5.66 0l2.14-2.14a4 4 0 1 0-5.66-5.66l-1.22 1.22'/%3E%3Cpath d='M13.4 10.6a4 4 0 0 0-5.66 0L5.6 12.74a4 4 0 1 0 5.66 5.66l1.22-1.22'/%3E%3C/svg%3E");pointer-events:none
      }

      @media(max-width:520px){
        body.shopping-toolbar-v9 .header-right-top .undo-btn{width:28px!important;min-width:28px!important;height:33px!important;min-height:33px!important;margin-right:1px!important}
        body.shopping-toolbar-v9 .header-right-top .undo-btn svg{width:17px;height:17px}
        body.shopping-toolbar-v9 .recipe-toggle{width:24px!important;min-width:24px!important;height:38px!important}
        body.shopping-toolbar-v9 .recipe-toggle::before{width:19px;height:19px;background-size:19px 19px}
        body.shopping-toolbar-v9 .recipe-edit-meta-v4::before{width:22px;height:22px;background-size:22px 22px}
      }
    `;
    document.head.appendChild(style);
  }

  function loadRecipeLinkPopup() {
    if (document.querySelector('script[data-shopping-recipe-link-popup-v5]')) return;
    var s = document.createElement('script');
    s.src = 'shopping-recipe-link-popup-v5.js?v=20260828-1245-recipe-icons-v5b';
    s.async = false;
    s.setAttribute('data-shopping-recipe-link-popup-v5','true');
    document.head.appendChild(s);
  }

  function install() {
    if (window.__shoppingToolbarV9Installed) { loadRecipeLinkPopup(); return; }
    var group = document.querySelector('.header-right-top');
    var undo = group && group.querySelector('.undo-btn');
    var firstMenu = group && group.querySelector('.dropdown-wrapper');
    if (!group || !undo || !firstMenu) { setTimeout(install, 40); return; }

    window.__shoppingToolbarV9Installed = true;
    document.body.classList.add('shopping-toolbar-v9');
    addStyles();

    group.insertBefore(undo, firstMenu);
    undo.setAttribute('aria-label', 'Ångra senaste ändring');
    undo.setAttribute('title', 'Ångra');
    undo.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7H4V3"/><path d="M4.5 7A8.5 8.5 0 1 1 4 16"/></svg>';
    loadRecipeLinkPopup();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
