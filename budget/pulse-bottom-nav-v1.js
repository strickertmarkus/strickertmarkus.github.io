/*
 * Bottom navigation (floating capsule): Hem, Ekonomi, Träning, Listor, Mer.
 * Replaces the hamburger menu on the main pages. "Mer" opens a sheet with Resor, Mila, Melker
 * and (on Home) the notification switch.
 * - Not shown inside iframes (Home's embedded Listor/Resor, the training session frame).
 * - Ekonomi returns to the last finance page you used (finance-ui stores it), else budget.html.
 * - On Home, Hem/Listor/Resor drive Home's own tabs so the embedded views keep working.
 * - Modal dialogs (the training workspace) sit in the top layer, above the bar.
 */
(function () {
  'use strict';
  // Home shows Listor/Resor in a full-screen frame under the bar: give that page room at the bottom.
  if (window.self !== window.top) {
    if (/[?&]hubFrame=1/.test(location.search)) {
      var pad = document.createElement('style');
      pad.textContent = 'body{padding-bottom:calc(max(env(safe-area-inset-bottom,0px), 18px) + 84px)!important}';
      (document.head || document.documentElement).appendChild(pad);
    }
    return;
  }
  if (window.__pulseBottomNav) return;
  // The training pages keep their own bottom dock; Träning is reached from Mer.
  if (/^exercise/i.test((location.pathname.split('/').pop() || ''))) return;
  window.__pulseBottomNav = true;

  var file = (location.pathname.split('/').pop() || 'home.html').toLowerCase();
  var isHome = file === 'home.html' || file === '' || file === 'index.html';
  var FINANCE = ['budget.html', 'budget_maja.html', 'analytics.html', 'analytics_maja.html', 'familjebudget.html', 'data.html'];
  var area = isHome ? 'home'
    : FINANCE.indexOf(file) !== -1 ? 'economy'
    : file === 'shopping.html' ? 'lists'
    : 'more';

  var ICONS = {
    home: '<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
    economy: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 9V6a3 3 0 0 1 3-3h11M16 13h5"/>',
    training: '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
    lists: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    travel: '<path d="M10 14 3 11l1.5-1.5 7 1 4-4.5a1.8 1.8 0 0 1 2.5 2.5l-4.5 4 1 7L13 21z"/>',
    kid: '<circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[name] + '</svg>'; }
  function economyHref() {
    var last = '';
    try { last = localStorage.getItem('finance-last-page-v1') || ''; } catch (_) {}
    return FINANCE.indexOf(String(last).toLowerCase()) !== -1 && last !== 'data.html' ? last : 'budget.html';
  }

  var css = '' +
    'html.has-bottom-nav body{padding-bottom:calc(max(env(safe-area-inset-bottom,0px), 18px) + 84px)!important}' +
    'html.has-bottom-nav .nav-dropdown-wrapper{display:none!important}' +
    '.pbn{position:fixed;left:max(12px,env(safe-area-inset-left,0px));right:max(12px,env(safe-area-inset-right,0px));bottom:calc(max(env(safe-area-inset-bottom,0px), 18px) + 10px);z-index:2147483200;max-width:460px;margin:0 auto;height:58px;display:flex;align-items:center;justify-content:space-around;border-radius:29px;' +
      'background:rgba(22,27,34,.72);backdrop-filter:blur(18px) saturate(1.3);-webkit-backdrop-filter:blur(18px) saturate(1.3);box-shadow:0 12px 34px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.07),inset 0 1px 0 rgba(255,255,255,.06);transition:transform .3s cubic-bezier(.22,1,.36,1),opacity .3s}' +
    '.pbn a,.pbn button{appearance:none;border:0;background:transparent;flex:1;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:#7d8996;font:500 10.5px/1 Inter,system-ui,-apple-system,sans-serif;text-decoration:none;position:relative;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .2s}' +
    '.pbn svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s,filter .2s}' +
    '.pbn .on{color:#FDBA74}' +
    '.pbn .on svg{filter:drop-shadow(0 0 6px rgba(253,186,116,.5))}' +
    '.pbn .on::after{content:"";position:absolute;bottom:5px;width:4px;height:4px;border-radius:50%;background:#FDBA74;box-shadow:0 0 8px #FDBA74}' +
    '.pbn a:active svg,.pbn button:active svg{transform:scale(.9)}' +
    '.pbn a:focus-visible,.pbn button:focus-visible{outline:2px solid #FDBA74;outline-offset:-6px;border-radius:22px}' +
    '.pbn-dim{position:fixed;inset:0;z-index:2147483100;background:rgba(5,7,10,.5);opacity:0;pointer-events:none;transition:opacity .25s}' +
    '.pbn-sheet{position:fixed;left:0;right:0;bottom:0;z-index:2147483150;max-width:520px;margin:0 auto;padding:10px max(18px,env(safe-area-inset-left,0px)) calc(max(env(safe-area-inset-bottom,0px), 18px) + 92px);border-radius:24px 24px 0 0;background:#161B22;' +
      'box-shadow:0 -12px 40px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06);transform:translateY(105%);transition:transform .34s cubic-bezier(.22,1,.36,1)}' +
    'html.pbn-open .pbn-dim{opacity:1;pointer-events:auto}' +
    'html.pbn-open .pbn-sheet{transform:none}' +
    '.pbn-grab{display:block;width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.18);margin:0 auto 8px}' +
    '.pbn-sheet a,.pbn-sheet button{appearance:none;width:100%;border:0;background:transparent;display:flex;align-items:center;gap:14px;padding:14px 2px;border-bottom:1px solid rgba(255,255,255,.06);color:#f0f6fc;font:500 15px/1.2 Inter,system-ui,-apple-system,sans-serif;text-decoration:none;text-align:left;cursor:pointer}' +
    '.pbn-sheet a:last-child,.pbn-sheet button:last-child{border-bottom:0}' +
    '.pbn-sheet svg{width:19px;height:19px;fill:none;stroke:#FDBA74;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 5px rgba(253,186,116,.35))}' +
    '.pbn-sheet em{margin-left:auto;font-style:normal;font-size:12.5px;color:#7d8996}' +
    '.pbn-sheet .on{color:#FDBA74}' +
    // Docked variant: edge to edge at the bottom, active tab marked by a glowing line above it.
    // Same height and look as the training page's own dock (training-pulse-field.css .field-dock).
    '.pbn.docked{left:0;right:0;bottom:0;max-width:none;height:auto;padding:6px max(12px,calc((100vw - 520px)/2)) calc(7px + env(safe-area-inset-bottom,0px));border-radius:0;align-items:center;' +
      'background:linear-gradient(180deg,rgba(9,13,20,.4),rgba(9,13,20,.6));border-top:1px solid rgba(255,255,255,.05);box-shadow:none;backdrop-filter:blur(24px) saturate(150%);-webkit-backdrop-filter:blur(24px) saturate(150%)}' +
    '.pbn.docked a,.pbn.docked button{height:auto;padding:4px 0 6px;font-size:9.5px;font-weight:600;letter-spacing:.02em}' +
    '.pbn.docked svg{width:20px;height:20px}' +
    '.pbn.docked .on::after{bottom:0;width:4px;height:4px}' +
    'html.pbn-docked body{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))!important}' +
    'html.pbn-docked .pbn-sheet{padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))}' +
    '@media (prefers-reduced-motion:reduce){.pbn,.pbn-sheet,.pbn-dim{transition:none}}';

  function install() {
    if (document.querySelector('.pbn')) return;
    var style = document.createElement('style');
    style.id = 'pulse-bottom-nav-v1-style';
    style.textContent = css;
    document.head.appendChild(style);
    document.documentElement.classList.add('has-bottom-nav');

    var STYLE_KEY = 'pbn-style-v1';
    var docked = true;
    try { docked = localStorage.getItem(STYLE_KEY) !== 'float'; } catch (_) {}
    var nav = document.createElement('nav');
    nav.className = 'pbn' + (docked ? ' docked' : '');
    document.documentElement.classList.toggle('pbn-docked', docked);
    nav.setAttribute('aria-label', 'Huvudmeny');
    var tabs = [
      ['home', 'Hem', 'home.html'],
      ['economy', 'Ekonomi', economyHref()],
      ['lists', 'Listor', 'shopping.html'],
      ['more', 'Mer', null]
    ];
    nav.innerHTML = tabs.map(function (t) {
      var on = t[0] === area ? ' class="on" aria-current="page"' : '';
      return t[2]
        ? '<a href="' + t[2] + '" data-pbn="' + t[0] + '"' + on + '>' + svg(t[0]) + '<span>' + t[1] + '</span></a>'
        : '<button type="button" data-pbn="more" aria-haspopup="dialog" aria-expanded="false"' + on + '>' + svg('more') + '<span>' + t[1] + '</span></button>';
    }).join('');

    var dim = document.createElement('div');
    dim.className = 'pbn-dim';
    var sheet = document.createElement('div');
    sheet.className = 'pbn-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-label', 'Mer');
    var notif = isHome ? document.getElementById('home-notifications') : null;
    sheet.innerHTML = '<span class="pbn-grab" aria-hidden="true"></span>' +
      '<a href="exercise.html">' + svg('training') + 'Träning</a>' +
      '<a href="travel.html" data-pbn="travel"' + (file === 'travel.html' ? ' class="on"' : '') + '>' + svg('travel') + 'Resor</a>' +
      '<a href="mila.html"' + (file === 'mila.html' ? ' class="on"' : '') + '>' + svg('kid') + 'Mila</a>' +
      '<a href="melker.html"' + (file === 'melker.html' ? ' class="on"' : '') + '>' + svg('kid') + 'Melker</a>' +
      (notif ? '<button type="button" data-pbn="notif">' + svg('bell') + 'Notiser<em data-pbn-notif></em></button>' : '') +
      '<button type="button" data-pbn="style">' + svg('more') + 'Bottenbar<em data-pbn-style></em></button>';

    document.body.appendChild(dim);
    document.body.appendChild(sheet);
    document.body.appendChild(nav);

    var moreBtn = nav.querySelector('[data-pbn="more"]');
    function setOpen(open) {
      document.documentElement.classList.toggle('pbn-open', open);
      moreBtn.setAttribute('aria-expanded', String(open));
      if (open) syncNotif();
    }
    function syncStyle() {
      var label = sheet.querySelector('[data-pbn-style]');
      if (label) label.textContent = docked ? 'Fast' : 'Flytande';
    }
    function syncNotif() {
      syncStyle();
      var label = sheet.querySelector('[data-pbn-notif]');
      if (label && notif) label.textContent = notif.getAttribute('aria-checked') === 'true' ? 'På' : 'Av';
    }
    moreBtn.addEventListener('click', function () { setOpen(!document.documentElement.classList.contains('pbn-open')); });
    dim.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    sheet.addEventListener('click', function (e) {
      // Switch between the docked bar and the floating capsule (remembered on this device).
      if (e.target.closest('[data-pbn="style"]')) {
        docked = !docked;
        try { localStorage.setItem(STYLE_KEY, docked ? 'docked' : 'float'); } catch (_) {}
        nav.classList.toggle('docked', docked);
        document.documentElement.classList.toggle('pbn-docked', docked);
        syncStyle();
        return;
      }
      var b = e.target.closest('[data-pbn="notif"]');
      if (b && notif) { notif.click(); setTimeout(syncNotif, 50); return; }
      // On Home, Resor opens in Home's own embedded view.
      var travel = e.target.closest('[data-pbn="travel"]');
      var homeTravel = isHome && document.getElementById('home-tab-travel');
      if (travel && homeTravel) { e.preventDefault(); setOpen(false); homeTravel.click(); mark('more'); }
    });

    function mark(name) {
      nav.querySelectorAll('[data-pbn]').forEach(function (el) {
        var on = el.dataset.pbn === name;
        el.classList.toggle('on', on);
        if (on) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
      });
    }

    // Home: drive Home's own tabs instead of leaving the page.
    if (isHome) {
      nav.addEventListener('click', function (e) {
        var a = e.target.closest('a[data-pbn]');
        if (!a) return;
        if (a.dataset.pbn === 'home') {
          var overview = document.getElementById('home-tab-overview');
          if (overview) { e.preventDefault(); overview.click(); mark('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        } else if (a.dataset.pbn === 'lists') {
          var lists = document.getElementById('home-tab-lists');
          if (lists) { e.preventDefault(); lists.click(); mark('lists'); }
        }
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
