(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/home.html') && !path.endsWith('/home.html')) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function addStyles() {
    if (document.getElementById('home-shopping-groups-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'home-shopping-groups-v1-style';
    style.textContent = `
      #shopping-items .shopping-category-heading {
        list-style: none;
        margin: 7px 2px 1px;
        padding: 7px 5px 4px;
        border-bottom: 1px solid rgba(251,146,60,.18);
        color: var(--accent);
        font-size: 10px;
        line-height: 1.15;
        font-weight: 800;
        letter-spacing: .75px;
        text-transform: uppercase;
      }
      #shopping-items .shopping-category-heading:first-child {
        margin-top: 0;
        padding-top: 3px;
      }
      #shopping-items .shopping-category-heading + .shopping-item {
        border-top: 0;
      }
      #shopping-items .shopping-item {
        padding-left: 5px;
        padding-right: 4px;
      }
      @media (max-width: 768px) {
        #shopping-items .shopping-category-heading {
          margin-top: 6px;
          padding-top: 6px;
          font-size: 9px;
          letter-spacing: .65px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function groupedRender() {
    if (typeof window.getCurrentShoppingList !== 'function' ||
        typeof window.getVisibleShoppingItems !== 'function') return;

    var list = window.getCurrentShoppingList();
    var items = window.getVisibleShoppingItems(list) || [];
    var ul = document.getElementById('shopping-items');
    var count = document.getElementById('shopping-count');
    if (!ul || !count) return;

    count.textContent = items.length + (items.length === 1 ? ' artikel' : ' artiklar');
    if (!items.length) {
      ul.innerHTML = '<li class="empty">Inga artiklar ännu. Lägg till första här.</li>';
      return;
    }

    var html = '';
    var lastCategory = null;

    items.forEach(function (item) {
      var category = String(item.category || '').trim();
      if (category !== lastCategory) {
        if (category) {
          html += '<li class="shopping-category-heading" aria-label="Kategori ' + escapeHtml(category) + '">' +
            escapeHtml(category) +
          '</li>';
        }
        lastCategory = category;
      }

      var rawText = String(item.text || '');
      var rawTextAttr = escapeHtml(rawText);
      html += '<li class="shopping-item ' + (item.checked ? 'done' : '') + '">' +
        '<input type="checkbox" ' + (item.checked ? 'checked' : '') +
          ' onchange="toggleShoppingItem(' + item.id + ', this.checked)">' +
        '<span class="txt" data-raw-text="' + rawTextAttr +
          '" title="Klicka för att redigera" onclick="event.stopPropagation();startEditShoppingItem(this,' + item.id + ')">' +
          escapeHtml(rawText) +
        '</span>' +
        '<button class="shopping-del" type="button" onclick="event.stopPropagation();deleteShoppingItem(' + item.id + ')">✕</button>' +
      '</li>';
    });

    ul.innerHTML = html;
  }

  function install() {
    if (window.__homeShoppingGroupsV1Installed) return;
    if (typeof window.renderShoppingWidget !== 'function' ||
        typeof window.getVisibleShoppingItems !== 'function' ||
        typeof window.getCurrentShoppingList !== 'function') {
      setTimeout(install, 50);
      return;
    }

    window.__homeShoppingGroupsV1Installed = true;
    addStyles();

    /* Presentation-only override. All data mutation functions remain the
       original Home/shopping implementations. */
    window.renderShoppingWidget = groupedRender;
    groupedRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
