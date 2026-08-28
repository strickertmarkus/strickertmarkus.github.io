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
        order:-1!important;
        width:30px!important;
        min-width:30px!important;
        height:34px!important;
        min-height:34px!important;
        padding:0!important;
        margin:0 2px 0 0!important;
        display:grid!important;
        place-items:center!important;
        border:0!important;
        border-radius:7px!important;
        background:transparent!important;
        box-shadow:none!important;
        color:var(--text-sec)!important;
        opacity:.78!important;
        line-height:1!important;
        transition:color .16s ease,background-color .16s ease,opacity .16s ease,transform .12s ease!important;
      }
      body.shopping-toolbar-v9 .header-right-top .undo-btn svg{width:18px;height:18px;display:block;pointer-events:none}
      body.shopping-toolbar-v9 .header-right-top .undo-btn:hover{color:var(--accent)!important;background:rgba(251,191,36,.045)!important;opacity:1!important}
      body.shopping-toolbar-v9 .header-right-top .undo-btn:active{transform:scale(.90)!important}
      @media(max-width:520px){
        body.shopping-toolbar-v9 .header-right-top .undo-btn{
          width:28px!important;
          min-width:28px!important;
          height:33px!important;
          min-height:33px!important;
          margin-right:1px!important;
        }
        body.shopping-toolbar-v9 .header-right-top .undo-btn svg{width:17px;height:17px}
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    if (window.__shoppingToolbarV9Installed) return;
    var group = document.querySelector('.header-right-top');
    var undo = group && group.querySelector('.undo-btn');
    var firstMenu = group && group.querySelector('.dropdown-wrapper');
    if (!group || !undo || !firstMenu) { setTimeout(install, 40); return; }

    window.__shoppingToolbarV9Installed = true;
    document.body.classList.add('shopping-toolbar-v9');
    addStyles();

    /* Keep DOM order equal to visual/tab order: Undo before Mallar. */
    group.insertBefore(undo, firstMenu);
    undo.setAttribute('aria-label', 'Ångra senaste ändring');
    undo.setAttribute('title', 'Ångra');
    undo.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7H4V3"/><path d="M4.5 7A8.5 8.5 0 1 1 4 16"/></svg>';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
