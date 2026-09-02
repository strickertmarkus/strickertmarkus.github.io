(function () {
  'use strict';

  if (window.__navMenuMotionInstalled) return;
  window.__navMenuMotionInstalled = true;

  var style = document.createElement('style');
  style.id = 'nav-menu-motion-v1-style';
  style.textContent = `
    .nav-dropdown-menu {
      display:block !important;
      opacity:0 !important;
      visibility:hidden !important;
      pointer-events:none !important;
      transform-origin:100% 0% !important;
      transform:translate3d(7px,-7px,0) scale(.72) !important;
      clip-path:inset(0 0 68% 56% round 12px) !important;
      animation:none !important;
      transition:transform .308s cubic-bezier(.22,1,.36,1),clip-path .308s cubic-bezier(.22,1,.36,1),opacity .158s ease,visibility 0s linear .308s !important;
      will-change:transform,clip-path,opacity;
      z-index:5000 !important;
    }
    .nav-dropdown-menu.show {
      opacity:1 !important;
      visibility:visible !important;
      pointer-events:auto !important;
      transform:translate3d(0,0,0) scale(1) !important;
      clip-path:inset(0 0 0 0 round 12px) !important;
      transition:transform .328s cubic-bezier(.22,1,.36,1),clip-path .328s cubic-bezier(.22,1,.36,1),opacity .128s ease,visibility 0s !important;
    }
    .nav-dropdown-menu > * {
      opacity:0 !important;
      transform:translate3d(12px,-4px,0) scale(.97) !important;
      transform-origin:100% 0% !important;
      transition:transform .228s cubic-bezier(.22,1,.36,1),opacity .148s ease !important;
      transition-delay:0s !important;
    }
    .nav-dropdown-menu.show > * {
      opacity:1 !important;
      transform:translate3d(0,0,0) scale(1) !important;
      transition-delay:var(--nav-expand-delay,24ms) !important;
    }
    @media(prefers-reduced-motion:reduce) {
      .nav-dropdown-menu,.nav-dropdown-menu > * {
        transition-duration:.001s !important;
        transition-delay:0s !important;
      }
    }
  `;
  document.head.appendChild(style);

  function indexMenus() {
    document.querySelectorAll('.nav-dropdown-menu').forEach(function (menu) {
      Array.prototype.forEach.call(menu.children, function (item, index) {
        item.style.setProperty('--nav-expand-delay', (24 + index * 18) + 'ms');
      });
    });
  }

  function setup() {
    requestAnimationFrame(indexMenus);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once:true });
  } else {
    setup();
  }
})();