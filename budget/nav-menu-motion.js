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

    /* Retire the older Home pseudo-background entirely. */
    'html.home-finance-orange-v3 body::before{' +
      'content:none!important;' +
      'display:none!important;' +
      'background:none!important' +
    '}' +

    /* Same orange finance surface, with a little more vertical room for a
       bottom utility row. */
    'html.home-finance-orange-v3 body .app-header,' +
    'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header{' +
      'min-height:96px!important;' +
      'height:96px!important;' +
      'background:linear-gradient(180deg,rgba(13,17,23,.985),rgba(251,146,60,.06))!important;' +
      'border-bottom:1px solid rgba(251,146,60,.20)!important;' +
      'box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 24px rgba(251,146,60,.075)!important;' +
      'backdrop-filter:blur(20px)!important;' +
      '-webkit-backdrop-filter:blur(20px)!important' +
    '}' +
    'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand{' +
      'top:38%!important' +
    '}' +
    'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text h1{' +
      'font-size:21px!important;' +
      'line-height:26px!important;' +
      'letter-spacing:-.35px!important' +
    '}' +

    /* Notification toggle keeps exactly the same distance from the divider. */
    'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7{' +
      'bottom:7px!important' +
    '}' +

    /* Month navigation shares the bottom row with the notification toggle,
       aligned on the opposite side. */
    'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header>.month-nav.home-header-month-v10{' +
      'visibility:visible!important;' +
      'display:flex!important;' +
      'position:absolute!important;' +
      'left:auto!important;' +
      'right:22px!important;' +
      'top:auto!important;' +
      'bottom:7px!important;' +
      'transform:none!important;' +
      'height:22px!important;' +
      'margin:0!important;' +
      'padding:0!important;' +
      'gap:3px!important;' +
      'align-items:center!important;' +
      'z-index:4!important' +
    '}' +
    'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header>.month-nav.home-header-month-v10 button{' +
      'width:22px!important;' +
      'height:22px!important;' +
      'min-width:22px!important;' +
      'padding:0!important;' +
      'border-radius:7px!important;' +
      'font-size:13px!important;' +
      'line-height:1!important;' +
      'color:#FDBA74!important;' +
      'background:rgba(255,255,255,.04)!important;' +
      'border:1px solid rgba(251,146,60,.18)!important;' +
      'box-shadow:none!important' +
    '}' +
    'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header>.month-nav.home-header-month-v10 #month-label{' +
      'min-width:0!important;' +
      'width:auto!important;' +
      'padding:0 4px!important;' +
      'font-size:11px!important;' +
      'font-weight:800!important;' +
      'line-height:22px!important;' +
      'white-space:nowrap!important;' +
      'color:#FDBA74!important;' +
      'text-shadow:0 1px 7px rgba(251,146,60,.09)!important' +
    '}' +

    /* Once month navigation is in the header, the calendar toolbar only needs
       to carry the week label. */
    'html.home-finance-orange-v3 body.home-calendar-polish-v5 .calendar-toolbar-v2{' +
      'right:0!important' +
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
    '@media(max-width:768px){' +
      'html.home-finance-orange-v3 body .app-header,html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header{min-height:94px!important;height:94px!important}' +
      'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text h1{font-size:20px!important;line-height:25px!important}' +
      'html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header>.month-nav.home-header-month-v10{right:18px!important}' +
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

  function placeHomeMonthNav() {
    if (!isHome) return false;
    var header = document.querySelector('.app-header');
    var nav = document.querySelector('.month-nav');
    if (!header || !nav) return false;
    if (nav.parentElement !== header) header.appendChild(nav);
    nav.classList.add('home-header-month-v10');
    return true;
  }

  function setup() {
    requestAnimationFrame(indexMenus);
    if (!isHome) return;

    /* calendar-ui-v2 moves the existing month nav into the calendar toolbar
       once during startup. Re-home that same live control after startup; no
       clone is created, so the original prev/next handlers and month label are
       preserved. */
    [0, 60, 180, 450, 950, 1500].forEach(function (delay) {
      setTimeout(placeHomeMonthNav, delay);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
})();
