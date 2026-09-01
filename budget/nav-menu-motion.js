(function () {
  'use strict';

  if (window.__navMenuMotionInstalled) return;
  window.__navMenuMotionInstalled = true;

  var lowerPath = window.location.pathname.toLowerCase();
  var isHome = lowerPath.endsWith('/budget/home.html') || lowerPath.endsWith('/home.html');

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

    var manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) manifestLink.setAttribute('href', 'manifest.webmanifest?v=20260901-home-orange-v3');
  }

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

    html.home-finance-orange-v3,
    html.home-finance-orange-v3 body {
      background:radial-gradient(900px 380px at 50% -110px,rgba(251,146,60,.085),transparent 67%),#0F1219 !important;
      background-color:#0F1219 !important;
    }
    html.home-finance-orange-v3 body::before {
      content:none !important;
      display:none !important;
      background:none !important;
    }

    html.home-finance-orange-v3 body .app-header,
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header {
      height:160px !important;
      min-height:160px !important;
      max-height:160px !important;
      position:sticky !important;
      top:0 !important;
      padding:0 !important;
      overflow:visible !important;
      text-align:center !important;
      background:linear-gradient(180deg,rgba(13,17,23,.985),rgba(251,146,60,.06)) !important;
      border-bottom:1px solid rgba(251,146,60,.20) !important;
      box-shadow:0 7px 26px rgba(0,0,0,.44),0 1px 24px rgba(251,146,60,.075) !important;
      backdrop-filter:blur(20px) !important;
      -webkit-backdrop-filter:blur(20px) !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand {
      position:absolute !important;
      left:50% !important;
      top:14px !important;
      transform:translateX(-50%) !important;
      width:max-content !important;
      max-width:calc(100% - 112px) !important;
      margin:0 !important;
      z-index:2 !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text {
      min-height:0 !important;
      text-align:center !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text h1 {
      font-size:21px !important;
      line-height:1.1 !important;
      font-weight:800 !important;
      letter-spacing:-.45px !important;
      white-space:nowrap !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text p {
      margin-top:5px !important;
      font-size:11px !important;
      line-height:1.2 !important;
      white-space:nowrap !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .nav-dropdown-wrapper {
      position:absolute !important;
      top:10px !important;
      right:10px !important;
      left:auto !important;
      transform:none !important;
      margin:0 !important;
      z-index:8 !important;
    }

    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header > .month-nav.home-header-month-v10 {
      visibility:visible !important;
      display:flex !important;
      position:absolute !important;
      left:50% !important;
      right:auto !important;
      top:54px !important;
      bottom:auto !important;
      transform:translateX(-50%) !important;
      height:40px !important;
      width:max-content !important;
      margin:0 !important;
      padding:0 !important;
      gap:8px !important;
      align-items:center !important;
      justify-content:center !important;
      z-index:7 !important;
      background:transparent !important;
      border:0 !important;
      box-shadow:none !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header > .month-nav.home-header-month-v10 button {
      width:32px !important;
      min-width:32px !important;
      height:32px !important;
      min-height:32px !important;
      padding:0 !important;
      border-radius:9px !important;
      font-size:15px !important;
      line-height:1 !important;
      color:#FDBA74 !important;
      background:rgba(255,255,255,.035) !important;
      border:1px solid rgba(251,146,60,.18) !important;
      box-shadow:0 0 12px rgba(251,146,60,.025) !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header > .month-nav.home-header-month-v10 #month-label {
      min-width:150px !important;
      width:150px !important;
      padding:0 5px !important;
      font-size:15px !important;
      font-weight:700 !important;
      line-height:40px !important;
      white-space:nowrap !important;
      text-align:center !important;
      color:#FDBA74 !important;
      text-shadow:0 2px 10px rgba(251,146,60,.14) !important;
    }

    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 {
      position:absolute !important;
      left:16px !important;
      right:auto !important;
      top:auto !important;
      bottom:9px !important;
      width:50px !important;
      min-width:50px !important;
      max-width:50px !important;
      height:35px !important;
      min-height:35px !important;
      padding:3px !important;
      border:1px solid rgba(255,255,255,.22) !important;
      border-radius:18px !important;
      background:rgba(255,255,255,.075) !important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 4px 16px rgba(0,0,0,.12) !important;
      backdrop-filter:blur(9px) !important;
      -webkit-backdrop-filter:blur(9px) !important;
      z-index:6 !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 .home-notif-knob-v7 {
      left:3px !important;
      top:3px !important;
      width:27px !important;
      height:27px !important;
      border-radius:14px !important;
      color:#94A3B8 !important;
      transition:transform .22s cubic-bezier(.22,1,.36,1),color .18s ease,filter .18s ease,background .18s ease !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7 .home-notif-bell-v8 {
      width:15px !important;
      height:15px !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on {
      border-color:rgba(251,146,60,.42) !important;
      background:rgba(251,146,60,.11) !important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 0 12px rgba(251,146,60,.15) !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on .home-notif-knob-v7 {
      transform:translateX(17px) !important;
      color:#FFF0AE !important;
      background:rgba(251,146,60,.16) !important;
      filter:drop-shadow(0 0 2px rgba(255,250,220,.95)) drop-shadow(0 0 7px rgba(251,191,36,.72)) !important;
    }
    html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .btn-notif.home-notif-switch-v7.is-on .home-notif-bell-v8 {
      stroke-width:2.35 !important;
      opacity:1 !important;
    }

    html.home-finance-orange-v3 body.home-calendar-polish-v5 .calendar-toolbar-v2 {
      right:0 !important;
    }

    @media(max-width:600px) {
      html.home-finance-orange-v3 body .app-header,
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header {
        height:156px !important;
        min-height:156px !important;
        max-height:156px !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand {
        top:13px !important;
      }
      html.home-finance-orange-v3 body.home-calendar-polish-v5 .app-header .brand-text h1 {
        font-size:20px !important;
      }
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

  function placeHomeMonthNav() {
    if (!isHome) return false;
    var header = document.querySelector('.app-header');
    var nav = document.querySelector('.month-nav');
    if (!header || !nav) return false;
    if (nav.parentElement !== header) header.appendChild(nav);
    nav.classList.add('home-header-month-v10');
    return true;
  }

  function loadHomeCalendarViews() {
    if (!isHome || document.querySelector('script[data-home-calendar-views-v11]')) return;
    var script = document.createElement('script');
    script.src = 'home-calendar-views-v11.js?v=20260901-home-calendar-views-v11';
    script.async = false;
    script.setAttribute('data-home-calendar-views-v11', 'true');
    document.head.appendChild(script);
  }

  function setup() {
    requestAnimationFrame(indexMenus);
    if (!isHome) return;
    loadHomeCalendarViews();
    [0, 60, 180, 450, 950, 1500].forEach(function (delay) {
      setTimeout(placeHomeMonthNav, delay);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once:true });
  } else {
    setup();
  }
})();