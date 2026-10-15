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

  var activeAddCategory = null;

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
        padding: 5px 5px 4px;
        border-bottom: 1px solid rgba(253,186,116,.18);
        color: var(--accent);
        font-size: 10px;
        line-height: 1.15;
        font-weight: 800;
        letter-spacing: .75px;
        text-transform: uppercase;
        display:flex;align-items:center;justify-content:space-between;gap:8px;
      }
      #shopping-items .shopping-category-add {
        display:grid;place-items:center;flex:0 0 23px;width:23px;height:23px;
        border-radius:7px;border:1px solid rgba(253,186,116,.24);
        background:rgba(253,186,116,.065);color:var(--accent);
        font-size:17px;font-weight:500;line-height:1;cursor:pointer;
      }
      #shopping-items .shopping-category-add:hover,
      #shopping-items .shopping-category-add[aria-expanded="true"] {
        border-color:rgba(253,186,116,.56);background:rgba(253,186,116,.12);
        box-shadow:0 0 9px rgba(253,186,116,.2);
      }
      #shopping-items .shopping-category-add:focus-visible {outline:2px solid var(--accent);outline-offset:2px}
      #shopping-items .shopping-category-add-row {list-style:none;margin:2px 2px 5px;padding:0}
      #shopping-items .shopping-category-add-form {
        display:grid;grid-template-columns:minmax(0,1fr) auto auto;
        align-items:center;gap:5px;min-width:0;
      }
      #shopping-items .shopping-category-add-input {
        min-width:0;width:100%;padding:7px 8px;border:1px solid rgba(253,186,116,.38);
        border-radius:7px;background:var(--bg3,#202735);color:var(--text,#fff);
        font:inherit;font-size:16px;outline:none;
      }
      #shopping-items .shopping-category-add-input:focus {border-color:var(--accent);box-shadow:0 0 0 2px rgba(253,186,116,.1)}
      #shopping-items .shopping-category-save,
      #shopping-items .shopping-category-cancel {
        border:1px solid rgba(253,186,116,.22);border-radius:7px;
        min-height:31px;padding:5px 8px;background:rgba(253,186,116,.11);
        color:var(--accent);cursor:pointer;font-size:11px;font-weight:700;
      }
      #shopping-items .shopping-category-cancel {padding:5px 9px;color:var(--text-sec,#9ca3af);background:transparent;border-color:var(--border,rgba(255,255,255,.1))}
      #shopping-items .shopping-category-heading + .shopping-category-add-row + .shopping-item {border-top:0}
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

  function renderItemHtml(item) {
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
        activeSection = { id:entry.id, name:name, items:[] };
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
      if (!exists) sections.push({ id:null, name:name, items:[] });
    });


    var html = !items.length
      ? '<li class="empty">Inga artiklar ännu. Lägg till första här.</li>'
      : '';
    uncategorized.forEach(function (item) { html += renderItemHtml(item); });
    sections.forEach(function (section) {
      var id = String(section.id == null ? '' : section.id);
      var active = activeAddCategory !== null && activeAddCategory === section.name;
      html += '<li class="shopping-category-heading" aria-label="Kategori ' + escapeHtml(section.name) + '">' +
        '<span>' + escapeHtml(section.name) + '</span>' +
        '<button type="button" class="shopping-category-add" data-sh-add-category="' + escapeHtml(section.name) +
          '" aria-expanded="' + active + '" aria-label="Lägg till under ' + escapeHtml(section.name) +
          '" title="Lägg till artikel under ' + escapeHtml(section.name) + '">+</button></li>';
      if (active) {
        html += '<li class="shopping-category-add-row"><form class="shopping-category-add-form"' +
          ' data-sh-category-id="' + escapeHtml(id) + '" data-sh-category-name="' + escapeHtml(section.name) + '">' +
          '<input class="shopping-category-add-input" name="item" type="text" maxlength="240"' +
            ' placeholder="Ny artikel…" aria-label="Ny artikel under ' + escapeHtml(section.name) +
            '" required autocomplete="off" autocapitalize="sentences" enterkeyhint="done">' +
          '<button class="shopping-category-save" type="submit">Lägg till</button>' +
          '<button class="shopping-category-cancel" type="button" data-sh-close-add aria-label="Avbryt">×</button>' +
          '</form></li>';
      }
      section.items.forEach(function (item) { html += renderItemHtml(item); });
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

    var listRoot = document.getElementById('shopping-items');
    if (listRoot) {
      listRoot.addEventListener('click', function(event) {
        var addButton = event.target.closest('[data-sh-add-category]');
        if (addButton) {
          event.preventDefault();
          event.stopPropagation();
          var category = addButton.getAttribute('data-sh-add-category');
          activeAddCategory = activeAddCategory === category ? null : category;
          groupedRender();
          if (activeAddCategory) {
            var input = listRoot.querySelector('.shopping-category-add-input');
            if (input) input.focus({ preventScroll:true });
          }
          return;
        }
        if (event.target.closest('[data-sh-close-add]')) {
          event.preventDefault();
          event.stopPropagation();
          activeAddCategory = null;
          groupedRender();
        }
      });
      listRoot.addEventListener('submit', function(event) {
        var form = event.target.closest('.shopping-category-add-form');
        if (!form) return;
        event.preventDefault();
        event.stopPropagation();
        var input = form.querySelector('input[name="item"]');
        var value = input ? input.value : '';
        if (!value.trim() || typeof window.addShoppingItemToCategory !== 'function') return;
        // Save using the same Firebase-backed sh_lists list, but do not
        // replace the focused input when Enter is pressed. This keeps the
        // keyboard open for rapid consecutive entries on iPhone.
        var added = window.addShoppingItemToCategory(
          form.dataset.shCategoryId, value, form.dataset.shCategoryName,
          { render:false }
        );
        if (!added) return;
        var following = form.closest('.shopping-category-add-row').nextElementSibling;
        while (following && !following.classList.contains('shopping-category-heading')) {
          following = following.nextElementSibling;
        }
        var markup = renderItemHtml(added);
        if (following) following.insertAdjacentHTML('beforebegin', markup);
        else listRoot.insertAdjacentHTML('beforeend', markup);
        var counter = document.getElementById('shopping-count');
        if (counter && typeof window.getVisibleShoppingItems === 'function' &&
            typeof window.getCurrentShoppingList === 'function') {
          var total = window.getVisibleShoppingItems(window.getCurrentShoppingList()).length;
          counter.textContent = total + (total === 1 ? ' artikel' : ' artiklar');
        }
        input.value = '';
        // Reuse the same editable node: unlike a full rerender, iOS does
        // not lose keyboard focus between items.
        input.focus({ preventScroll:true });
      });
      listRoot.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && event.target.closest('.shopping-category-add-form')) {
          event.preventDefault();
          activeAddCategory = null;
          groupedRender();
        }
      });
    }

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
