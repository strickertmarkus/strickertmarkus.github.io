(function () {
  'use strict';

  if (window.__navMenuMotionInstalled) return;
  window.__navMenuMotionInstalled = true;

  var lowerPath = window.location.pathname.toLowerCase();
  var isHome = lowerPath.endsWith('/budget/home.html') || lowerPath.endsWith('/home.html');

  /* Home uses the exact same dark/orange top palette as the orange finance
     (family budget) view. This runs synchronously in <head> so the old blue
     Home base never gets a chance to become the visible first-paint layer. */
  if (isHome) {
    var homeTopColor = '#0D1117';
    document.documentElement.classList.add('home-finance-orange-v3');
    document.documentElement.style.setProperty('background-color', homeTopColor, 'important');

    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', homeTopColor);

    /* The installed iOS app can retain an older manifest theme. Point the
       existing manifest link at a fresh version so #181F2E is not reused. */
    var manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) manifestLink.setAttribute('href', 'manifest.webmanifest?v=20260901-home-orange-v3');
  }

  var style = document.createElement('style');
  style.id = 'nav-menu-motion-v1-style';
  style.textContent =
    '.nav-dropdown-menu{' +
      'display:block!important;' +
      'opacity:0!important;' +
      'visibility:hidden!important;' +
      'pointer-events:none!important;' +
      'transform-origin:100% 0%!important;' +
      'transform:translate3d(7px,-7px,0) scale(.72)!important;' +
      'clip-path:inset(0 0 68% 56% round 12px)!important;' +
      'animation:none!important;' +
      'transition:transform .308s cubic-bezier(.22,1,.36,1),clip-path .308s cubic-bezier(.22,1,.36,1),opacity .158s ease,visibility 0s linear .308s!important;' +
      'will-change:transform,clip-path,opacity;' +
      'z-index:5000!important' +
    '}' +
    '.nav-dropdown-menu.show{' +
      'opacity:1!important;' +
      'visibility:visible!important;' +
      'pointer-events:auto!important;' +
      'transform:translate3d(0,0,0) scale(1)!important;' +
      'clip-path:inset(0 0 0 0 round 12px)!important;' +
      'transition:transform .328s cubic-bezier(.22,1,.36,1),clip-path .328s cubic-bezier(.22,1,.36,1),opacity .128s ease,visibility 0s!important' +
    '}' +
    '.nav-dropdown-menu>*{' +
      'opacity:0!important;' +
      'transform:translate3d(12px,-4px,0) scale(.97)!important;' +
      'transform-origin:100% 0%!important;' +
      'transition:transform .228s cubic-bezier(.22,1,.36,1),opacity .148s ease!important;' +
      'transition-delay:0s!important' +
    '}' +
    '.nav-dropdown-menu.show>*{' +
      'opacity:1!important;' +
      'transform:translate3d(0,0,0) scale(1)!important;' +
      'transition-delay:var(--nav-expand-delay,24ms)!important' +
    '}' +

    /* Exact family-finance background: orange radial glow over #0F1219. */
    'html.home-finance-orange-v3,' +
    'html.home-finance-orange-v3 body{' +
      'background:radial-gradient(900px 380px at 50% -110px,rgba(251,146,60,.085),transparent 67%),#0F1219!important;' +
      'background-color:#0F1219!important' +
    '}' +

    /* Retire the older Home pseudo-background entirely. It contained the
       remaining cyan/blue radial layer that could show through around header. */
    'html.home-finance-orange-v3 body::before{' +
      'content:none!important;' +
      'display:none!important;' +
      'background:none!important' +
    '}' +

    /* Exact orange family-finance header surface. Higher specificity keeps
       later Home polish layers from replacing it with the older warm/blue mix. */
    'html.home-finance-orange-v3 body .app-header,' +
    'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header{' +
      'background:linear-gradient(180deg,rgba(13,17,23,.985),rgba(251,146,60,.06))!important;' +
      'border-bottom:1px solid rgba(251,146,60,.20)!important;' +
      'box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 24px rgba(251,146,60,.075)!important;' +
      'backdrop-filter:blur(20px)!important;' +
      '-webkit-backdrop-filter:blur(20px)!important' +
    '}' +

    /* Brighter notification bell while enabled. */
    'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on .home-notif-knob-v7{' +
      'color:#FFF0AE!important;' +
      'filter:drop-shadow(0 0 2px rgba(255,250,220,.95)) drop-shadow(0 0 7px rgba(251,191,36,.72))!important' +
    '}' +
    'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on .home-notif-bell-v8{' +
      'stroke-width:2.35!important;' +
      'opacity:1!important' +
    '}' +
    '@media(prefers-reduced-motion:reduce){' +
      '.nav-dropdown-menu,.nav-dropdown-menu>*{' +
        'transition-duration:.001s!important;' +
        'transition-delay:0s!important' +
      '}' +
    '}';
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
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
})();
