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
      /* iOS WebKit zooms focused editable controls whose computed text size is
         below 16 CSS px. Keep Home inputs at the threshold without disabling
         the user's normal pinch-to-zoom accessibility. */
      @supports (-webkit-touch-callout: none) {
        @media (hover: none) and (pointer: coarse) {
          html body input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"]),
          html body select,
          html body textarea,
          html body [contenteditable]:not([contenteditable="false"]) {
            font-size: 16px !important;
          }
        }
      }

      #shopping-items .shopping-category-heading {
        list-style: none;
        margin: 7px 2px 1px;
        padding: 7px 5px 4px;
        border-bottom: 1px solid rgba(253,186,116,.18);
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

    // Read actual category rows rather than deriving headings from items:
    // empty stores must be visible too, just like on shopping.html.
    var sections = [];
    var uncategorized = [];
    var activeSection = null;
    (list && Array.isArray(list.items) ? list.items : []).forEach(function (entry) {
      if (!entry) return;
      if (entry.type === 'category') {
        var name = String(entry.text || '').trim();
        if (!name) { activeSection = null; return; }
        activeSection = { name:name, items:[] };
        sections.push(activeSection);
      } else if (String(entry.text || '').trim()) {
        if (activeSection) activeSection.items.push(entry);
        else uncategorized.push(entry);
      }
    });

    // Keep all five standard store headings on Home even if a historical
    // list is missing one. This fallback only affects presentation, not
    // the saved list or Firebase category data.
    var defaults = ['Maxi','Willys','Hemköp','Lidl','Coop'];
    defaults.forEach(function (name) {
      var exists = sections.some(function (section) {
        return section.name.toLocaleLowerCase('sv-SE') === name.toLocaleLowerCase('sv-SE');
      });
      if (!exists) sections.push({ name:name, items:[] });
    });

    function itemHtml(item) {
      var rawText = String(item.text || '');
      return '<li class="shopping-item ' + (item.checked ? 'done' : '') + '">' +
        '<input type="checkbox" ' + (item.checked ? 'checked' : '') +
          ' onchange="toggleShoppingItem(' + item.id + ', this.checked)">' +
        '<span class="txt" data-raw-text="' + escapeHtml(rawText) +
          '" title="Klicka för att redigera" onclick="event.stopPropagation();startEditShoppingItem(this,' + item.id + ')">' +
          escapeHtml(rawText) +
        '</span>' +
        '<button class="shopping-del" type="button" onclick="event.stopPropagation();deleteShoppingItem(' + item.id + ')">✕</button>' +
      '</li>';
    }

    var html = !items.length
      ? '<li class="empty">Inga artiklar ännu. Lägg till första här.</li>'
      : '';
    uncategorized.forEach(function (item) { html += itemHtml(item); });
    sections.forEach(function (section) {
      html += '<li class="shopping-category-heading" aria-label="Kategori ' + escapeHtml(section.name) + '">' +
        escapeHtml(section.name) + '</li>';
      section.items.forEach(function (item) { html += itemHtml(item); });
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

  /* Install the Home-wide iOS editable-control guard immediately when this
     Home-only presentation module loads; shopping data may initialize later. */
  addStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
