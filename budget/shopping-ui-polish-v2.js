(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  function addStyles() {
    if (document.getElementById('shopping-ui-polish-v2-style')) return;
    var style = document.createElement('style');
    style.id = 'shopping-ui-polish-v2-style';
    style.textContent = `
      /* Keep the existing Shopping palette, but make the controls read as one toolbar. */
      body.shopping-ui-polish-v2 header {
        gap:10px !important;
        margin-bottom:18px !important;
        padding-bottom:12px !important;
      }
      body.shopping-ui-polish-v2 .header-shell {
        align-items:center !important;
      }
      body.shopping-ui-polish-v2 .header-top {
        align-items:center !important;
        gap:8px !important;
        padding-right:48px !important;
      }
      body.shopping-ui-polish-v2 .header-right-top {
        flex:1 1 auto !important;
        margin-left:0 !important;
        gap:6px !important;
        flex-wrap:nowrap !important;
        justify-content:flex-end !important;
      }
      body.shopping-ui-polish-v2 .home-btn,
      body.shopping-ui-polish-v2 .dropdown-btn,
      body.shopping-ui-polish-v2 .undo-btn {
        height:38px !important;
        min-height:38px !important;
        border-radius:9px !important;
        background:rgba(251,191,36,.075) !important;
        border:1px solid rgba(251,191,36,.28) !important;
        color:#F8FAFC !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025) !important;
        transition:background-color .16s ease,border-color .16s ease,transform .12s ease !important;
      }
      body.shopping-ui-polish-v2 .home-btn:hover,
      body.shopping-ui-polish-v2 .dropdown-btn:hover,
      body.shopping-ui-polish-v2 .undo-btn:hover {
        background:rgba(251,191,36,.14) !important;
        border-color:rgba(251,191,36,.48) !important;
      }
      body.shopping-ui-polish-v2 .home-btn:active,
      body.shopping-ui-polish-v2 .dropdown-btn:active,
      body.shopping-ui-polish-v2 .undo-btn:active {
        transform:scale(.975);
      }
      body.shopping-ui-polish-v2 .home-btn {
        min-width:66px !important;
        padding:0 12px !important;
      }
      body.shopping-ui-polish-v2 .dropdown-btn {
        min-width:82px !important;
        padding:0 11px !important;
      }
      body.shopping-ui-polish-v2 .undo-btn {
        width:42px !important;
        min-width:42px !important;
        padding:0 !important;
        font-size:19px !important;
      }
      body.shopping-ui-polish-v2 .nav-btn {
        width:38px !important;
        height:38px !important;
        border-radius:9px !important;
      }

      /* Home-style interaction feel: the whole remaining row is a text hit-area. */
      body.shopping-ui-polish-v2 .list-item {
        min-height:38px;
        padding:4px 6px !important;
        border-radius:8px;
        transition:background-color .16s ease,box-shadow .16s ease,transform .12s ease;
        touch-action:manipulation;
        -webkit-tap-highlight-color:transparent;
      }
      body.shopping-ui-polish-v2 .list-item:hover {
        background:rgba(251,191,36,.035);
      }
      body.shopping-ui-polish-v2 .list-item:active {
        background:rgba(251,191,36,.055);
      }
      body.shopping-ui-polish-v2 .list-item label {
        flex:1 1 auto !important;
        width:100%;
        min-width:0;
        min-height:30px;
        display:flex;
        align-items:center;
        padding:5px 6px !important;
        margin:-1px 0;
        cursor:text !important;
        border-radius:6px;
        touch-action:manipulation;
        -webkit-tap-highlight-color:transparent;
      }
      body.shopping-ui-polish-v2 .list-item input[type="checkbox"] {
        transition:border-color .16s ease,background-color .16s ease,box-shadow .16s ease,transform .12s ease !important;
      }
      body.shopping-ui-polish-v2 .list-item input.edit-input {
        min-height:34px;
        flex:1 1 auto !important;
        min-width:0 !important;
        width:100% !important;
        padding:6px 8px !important;
        border:1px solid rgba(251,191,36,.44) !important;
        border-radius:7px !important;
        background:rgba(251,191,36,.045) !important;
        box-shadow:0 0 0 2px rgba(251,191,36,.06);
        font-size:13px !important;
      }
      body.shopping-ui-polish-v2 .list-item input.edit-input:focus {
        border-color:rgba(251,191,36,.72) !important;
        box-shadow:0 0 0 2px rgba(251,191,36,.11) !important;
      }
      body.shopping-ui-polish-v2 .add-item-line {
        min-height:38px;
        padding:5px 8px !important;
        border-radius:8px;
        transition:background-color .16s ease,color .16s ease !important;
        touch-action:manipulation;
        -webkit-tap-highlight-color:transparent;
      }
      body.shopping-ui-polish-v2 .add-item-line:hover,
      body.shopping-ui-polish-v2 .add-item-line:active {
        background:rgba(251,191,36,.035);
      }
      body.shopping-ui-polish-v2 .add-item-line input:not([type="checkbox"]) {
        min-height:30px;
        padding:5px 6px !important;
      }
      body.shopping-ui-polish-v2 .category-title {
        min-height:36px;
        padding:7px 4px !important;
        display:flex;
        align-items:center;
      }

      @media (max-width:520px) {
        body.shopping-ui-polish-v2 .header-shell {
          position:relative !important;
          display:block !important;
        }
        body.shopping-ui-polish-v2 .header-top {
          display:grid !important;
          grid-template-columns:1fr !important;
          gap:7px !important;
          width:100% !important;
          padding-right:0 !important;
        }
        body.shopping-ui-polish-v2 .header-left {
          width:auto !important;
          padding-right:48px;
        }
        body.shopping-ui-polish-v2 .home-btn {
          width:auto !important;
          min-width:70px !important;
        }
        body.shopping-ui-polish-v2 .header-right-top {
          width:100% !important;
          display:grid !important;
          grid-template-columns:repeat(4,minmax(0,1fr)) !important;
          gap:6px !important;
          margin:0 !important;
        }
        body.shopping-ui-polish-v2 .header-right-top .dropdown-wrapper,
        body.shopping-ui-polish-v2 .header-right-top .undo-btn {
          width:100% !important;
          min-width:0 !important;
        }
        body.shopping-ui-polish-v2 .header-right-top .dropdown-btn,
        body.shopping-ui-polish-v2 .header-right-top .undo-btn {
          width:100% !important;
          min-width:0 !important;
          height:40px !important;
          padding:0 6px !important;
          font-size:11px !important;
        }
        body.shopping-ui-polish-v2 .nav-dropdown-wrapper {
          position:absolute !important;
          right:0 !important;
          top:0 !important;
          align-self:auto !important;
        }
        body.shopping-ui-polish-v2 .list-item {
          min-height:42px;
          padding:5px 6px !important;
        }
        body.shopping-ui-polish-v2 .list-item label {
          min-height:32px;
          padding:6px 7px !important;
          font-size:14px;
        }
        body.shopping-ui-polish-v2 .list-item input.edit-input {
          min-height:36px;
          font-size:14px !important;
          padding:7px 8px !important;
        }
        body.shopping-ui-polish-v2 .add-item-line {
          min-height:42px;
          padding:6px 8px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function focusNow(input) {
    if (!input) return;
    try { input.focus({ preventScroll:true }); }
    catch (e) { try { input.focus(); } catch (ignore) {} }
    try {
      var len = String(input.value || '').length;
      input.setSelectionRange(len, len);
    } catch (e) {}
  }

  function wrapImmediateFocus() {
    if (typeof window.startEditItem === 'function' && !window.startEditItem.__shoppingUiPolishV2) {
      var originalEdit = window.startEditItem;
      var wrappedEdit = function (id) {
        var result = originalEdit.apply(this, arguments);
        focusNow(document.getElementById('item-edit-' + id));
        return result;
      };
      wrappedEdit.__shoppingUiPolishV2 = true;
      window.startEditItem = wrappedEdit;
    }

    if (typeof window.startAddItem === 'function' && !window.startAddItem.__shoppingUiPolishV2) {
      var originalAdd = window.startAddItem;
      var wrappedAdd = function () {
        var result = originalAdd.apply(this, arguments);
        focusNow(document.getElementById('new-item-input'));
        return result;
      };
      wrappedAdd.__shoppingUiPolishV2 = true;
      window.startAddItem = wrappedAdd;
    }
  }

  function simplifyToolbarLabels() {
    document.querySelectorAll('.header-right-top .dropdown-btn').forEach(function (button) {
      var next = String(button.textContent || '').replace(/^\s*☰\s*/, '').trim();
      if (next && button.textContent !== next) button.textContent = next;
    });
  }

  function rowFallbackClick(event) {
    var row = event.target && event.target.closest ? event.target.closest('.list-item') : null;
    if (!row) return;
    if (event.target.closest('input,button,a,label,textarea,select')) return;
    var label = row.querySelector('label[id^="item-"]');
    if (!label) return;
    var match = String(label.id || '').match(/^item-(\d+)$/);
    if (!match) return;
    var id = Number(match[1]);
    if (!Number.isFinite(id)) return;

    if ((event.ctrlKey || event.metaKey) && typeof window.toggleSelectedItem === 'function') {
      window.toggleSelectedItem(id);
      return;
    }
    if (typeof window.startEditItem === 'function') window.startEditItem(id);
  }

  function install() {
    if (window.__shoppingUiPolishV2Installed) return;
    window.__shoppingUiPolishV2Installed = true;
    document.body.classList.add('shopping-ui-polish-v2');
    addStyles();
    simplifyToolbarLabels();
    wrapImmediateFocus();
    document.addEventListener('click', rowFallbackClick, false);

    /* The page re-renders list rows often. Functions and toolbar nodes stay,
       so only a light periodic guard is needed for late initialization. */
    var attempts = 0;
    var timer = setInterval(function () {
      attempts++;
      wrapImmediateFocus();
      simplifyToolbarLabels();
      if (attempts > 20 && typeof window.startEditItem === 'function' && typeof window.startAddItem === 'function') clearInterval(timer);
    }, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
