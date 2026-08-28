(function () {
  'use strict';

  var path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/budget/shopping.html') && !path.endsWith('/shopping.html')) return;

  if (!document.getElementById('shopping-recipe-header-polish-v6-style')) {
    var style = document.createElement('style');
    style.id = 'shopping-recipe-header-polish-v6-style';
    style.textContent = `
      /* Recipe section heading. */
      body .section-title {
        font-size:12px !important;
        line-height:1.2 !important;
        font-weight:800 !important;
        letter-spacing:1.15px !important;
        margin-top:16px !important;
        margin-bottom:7px !important;
      }

      /* One common vertical geometry for chevron, title, link controls and X. */
      body .recipe-header {
        display:flex !important;
        align-items:center !important;
        min-height:40px !important;
        height:40px !important;
        gap:7px !important;
        padding-top:0 !important;
        padding-bottom:0 !important;
      }
      body .recipe-title-wrap {
        display:flex !important;
        align-items:center !important;
        height:40px !important;
        min-height:40px !important;
        gap:6px !important;
      }
      body .recipe-name-v4,
      body .recipe-name-link-v4 {
        display:inline-flex !important;
        align-items:center !important;
        min-height:40px !important;
        height:40px !important;
        padding-top:0 !important;
        padding-bottom:0 !important;
        font-size:14.5px !important;
        line-height:1.15 !important;
        font-weight:600 !important;
      }

      /* Keep the chevron button stationary; rotate only the SVG itself. */
      body .recipe-toggle {
        align-self:center !important;
        display:grid !important;
        place-items:center !important;
        width:25px !important;
        min-width:25px !important;
        height:40px !important;
        margin:0 !important;
        padding:0 !important;
        transform:none !important;
        line-height:0 !important;
      }
      body .recipe-toggle::before {
        width:20px !important;
        height:20px !important;
        background-size:20px 20px !important;
        background-position:center !important;
        margin:0 !important;
        transform:rotate(0deg);
        transform-origin:50% 50%;
        transition:transform .16s ease;
      }
      body .recipe-item.open .recipe-toggle {
        transform:none !important;
      }
      body .recipe-item.open .recipe-toggle::before {
        transform:rotate(90deg) !important;
      }

      /* Replace the legacy ↗ text glyph beside linked recipe names with SVG. */
      body .recipe-link-mark {
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        flex:0 0 20px !important;
        width:20px !important;
        height:20px !important;
        margin:0 0 0 6px !important;
        padding:0 !important;
        font-size:0 !important;
        line-height:0 !important;
        color:transparent !important;
        opacity:.88 !important;
        vertical-align:middle !important;
      }
      body .recipe-link-mark::before {
        content:'';
        display:block;
        width:20px;
        height:20px;
        background-repeat:no-repeat;
        background-position:center;
        background-size:20px 20px;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FBBF24' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M7 17 17 7'/%3E%3Cpath d='M8 7h9v9'/%3E%3C/svg%3E");
        pointer-events:none;
      }

      /* Right-side link button and delete button share the same box/centre. */
      body .recipe-edit-meta-v4,
      body .recipe-delete-v4 {
        top:50% !important;
        width:38px !important;
        min-width:38px !important;
        height:40px !important;
        min-height:40px !important;
        padding:0 !important;
        margin:0 !important;
        display:grid !important;
        place-items:center !important;
        line-height:0 !important;
        transform:translateY(-50%) !important;
      }
      body .recipe-edit-meta-v4 {
        right:39px !important;
      }
      body .recipe-edit-meta-v4::before {
        width:22px !important;
        height:22px !important;
        background-size:22px 22px !important;
        background-position:center !important;
        margin:0 !important;
      }

      /* SVG X avoids the font-baseline offset of the old multiplication glyph. */
      body .recipe-delete-v4 {
        right:1px !important;
        font-size:0 !important;
        color:transparent !important;
      }
      body .recipe-delete-v4::before {
        content:'';
        display:block;
        width:19px;
        height:19px;
        background-repeat:no-repeat;
        background-position:center;
        background-size:19px 19px;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237F8DA0' stroke-width='1.9' stroke-linecap='round'%3E%3Cpath d='M6 6l12 12M18 6 6 18'/%3E%3C/svg%3E");
        pointer-events:none;
      }
      body .recipe-delete-v4:hover::before,
      body .recipe-delete-v4:active::before {
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23F87171' stroke-width='1.9' stroke-linecap='round'%3E%3Cpath d='M6 6l12 12M18 6 6 18'/%3E%3C/svg%3E");
      }
      body .recipe-edit-meta-v4:active,
      body .recipe-delete-v4:active {
        transform:translateY(-50%) scale(.92) !important;
      }

      @media(max-width:520px) {
        body .section-title { font-size:12.5px !important; margin-bottom:8px !important; }
        body .recipe-header,
        body .recipe-title-wrap,
        body .recipe-name-v4,
        body .recipe-name-link-v4 { min-height:42px !important; height:42px !important; }
        body .recipe-name-v4,
        body .recipe-name-link-v4 { font-size:15px !important; }
        body .recipe-toggle { width:27px !important; min-width:27px !important; height:42px !important; }
        body .recipe-toggle::before { width:21px !important; height:21px !important; background-size:21px 21px !important; }
        body .recipe-link-mark { flex-basis:21px !important; width:21px !important; height:21px !important; }
        body .recipe-link-mark::before { width:21px; height:21px; background-size:21px 21px; }
        body .recipe-edit-meta-v4,
        body .recipe-delete-v4 { width:40px !important; min-width:40px !important; height:42px !important; min-height:42px !important; }
        body .recipe-edit-meta-v4 { right:41px !important; }
        body .recipe-edit-meta-v4::before { width:23px !important; height:23px !important; background-size:23px 23px !important; }
        body .recipe-delete-v4::before { width:20px; height:20px; background-size:20px 20px; }
      }
    `;
    document.head.appendChild(style);
  }
})();
