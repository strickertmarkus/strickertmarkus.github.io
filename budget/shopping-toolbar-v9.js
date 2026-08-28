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

      /* Recipe heading and header alignment. All visible controls share one
         38px vertical center line: chevron, title, external-link mark, link
         editor and delete X. */
      body.shopping-toolbar-v9 .section-title{font-size:12px!important;letter-spacing:1.2px!important}
      body.shopping-toolbar-v9 .recipe-header{
        min-height:38px!important;
        display:flex!important;
        align-items:center!important;
        gap:6px!important;
        line-height:1!important;
      }
      body.shopping-toolbar-v9 .recipe-title-wrap{
        min-height:38px!important;
        display:flex!important;
        align-items:center!important;
        gap:7px!important;
      }
      body.shopping-toolbar-v9 .recipe-name-v4,
      body.shopping-toolbar-v9 .recipe-name-link-v4{
        min-height:38px!important;
        height:38px!important;
        display:inline-flex!important;
        align-items:center!important;
        line-height:1.15!important;
        font-size:15px!important;
        font-weight:600!important;
      }

      /* First-paint recipe chevron. The legacy text glyph never becomes visible. */
      body.shopping-toolbar-v9 .recipe-toggle{
        font-size:0!important;
        width:26px!important;
        min-width:26px!important;
        height:38px!important;
        min-height:38px!important;
        display:grid!important;
        place-items:center!important;
        padding:0!important;
        margin:0!important;
        line-height:1!important;
      }
      body.shopping-toolbar-v9 .recipe-toggle::before{
        content:'';display:block;width:20px;height:20px;background-repeat:no-repeat;background-position:center;background-size:20px 20px;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237F8DA0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m9 18 6-6-6-6'/%3E%3C/svg%3E");pointer-events:none
      }

      /* Replace the old ↗ text next to a linked recipe with a real SVG.
         Slightly larger than the old glyph for clearer visual weight. */
      body.shopping-toolbar-v9 .recipe-link-mark{
        font-size:0!important;
        width:18px!important;
        min-width:18px!important;
        height:38px!important;
        margin:0 0 0 3px!important;
        display:inline-grid!important;
        place-items:center!important;
        align-self:center!important;
        opacity:.88!important;
        flex:0 0 18px!important;
      }
      body.shopping-toolbar-v9 .recipe-link-mark::before{
        content:'';
        display:block;
        width:17px;
        height:17px;
        background-repeat:no-repeat;
        background-position:center;
        background-size:17px 17px;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FBBF24' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 5h5v5'/%3E%3Cpath d='M10 14 19 5'/%3E%3Cpath d='M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5'/%3E%3C/svg%3E");
        pointer-events:none;
      }

      body.shopping-toolbar-v9 .recipe-edit-meta-v4,
      body.shopping-toolbar-v9 .recipe-delete-v4{
        top:50%!important;
        height:38px!important;
        min-height:38px!important;
        display:grid!important;
        place-items:center!important;
        line-height:1!important;
        margin:0!important;
      }
      body.shopping-toolbar-v9 .recipe-edit-meta-v4{font-size:0!important}
      body.shopping-toolbar-v9 .recipe-edit-meta-v4>*{display:none!important}
      body.shopping-toolbar-v9 .recipe-edit-meta-v4::before{
        content:'';display:block;width:22px;height:22px;background-repeat:no-repeat;background-position:center;background-size:22px 22px;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237F8DA0' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.6 13.4a4 4 0 0 0 5.66 0l2.14-2.14a4 4 0 1 0-5.66-5.66l-1.22 1.22'/%3E%3Cpath d='M13.4 10.6a4 4 0 0 0-5.66 0L5.6 12.74a4 4 0 1 0 5.66 5.66l1.22-1.22'/%3E%3C/svg%3E");pointer-events:none
      }
      body.shopping-toolbar-v9 .recipe-delete-v4{
        font-size:26px!important;
        font-weight:300!important;
        padding-bottom:2px!important;
      }

      @media(max-width:520px){
        body.shopping-toolbar-v9 .header-right-top .undo-btn{width:28px!important;min-width:28px!important;height:33px!important;min-height:33px!important;margin-right:1px!important}
        body.shopping-toolbar-v9 .header-right-top .undo-btn svg{width:17px;height:17px}
        body.shopping-toolbar-v9 .section-title{font-size:12px!important}
        body.shopping-toolbar-v9 .recipe-header,
        body.shopping-toolbar-v9 .recipe-title-wrap,
        body.shopping-toolbar-v9 .recipe-name-v4,
        body.shopping-toolbar-v9 .recipe-name-link-v4{min-height:40px!important;height:40px!important}
        body.shopping-toolbar-v9 .recipe-name-v4,
        body.shopping-toolbar-v9 .recipe-name-link-v4{font-size:15px!important}
        body.shopping-toolbar-v9 .recipe-toggle{width:27px!important;min-width:27px!important;height:40px!important;min-height:40px!important}
        body.shopping-toolbar-v9 .recipe-toggle::before{width:21px;height:21px;background-size:21px 21px}
        body.shopping-toolbar-v9 .recipe-link-mark{height:40px!important;width:19px!important;min-width:19px!important;flex-basis:19px!important}
        body.shopping-toolbar-v9 .recipe-link-mark::before{width:18px;height:18px;background-size:18px 18px}
        body.shopping-toolbar-v9 .recipe-edit-meta-v4,
        body.shopping-toolbar-v9 .recipe-delete-v4{height:40px!important;min-height:40px!important}
        body.shopping-toolbar-v9 .recipe-edit-meta-v4::before{width:22px;height:22px;background-size:22px 22px}
        body.shopping-toolbar-v9 .recipe-delete-v4{font-size:27px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function loadRecipeLinkPopup() {
    if (document.querySelector('script[data-shopping-recipe-link-popup-v5]')) return;
    var s = document.createElement('script');
    s.src = 'shopping-recipe-link-popup-v5.js?v=20260828-1335-recipe-header-v10';
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
