/*
 * Bottom navigation, docked edge to edge: Hem, Överföringar, Budget, Listor, Mer.
 * Replaces the hamburger menu and Home's section buttons on the main pages.
 * - Hem / Överföringar are Home's overview and economy sections; Listor (and Resor under Mer)
 *   open Home's full-screen views with the radial reveal from the tapped tab (HomeHub in
 *   home-morph-router.js). From other pages these links go to Home / shopping.html.
 * - Budget returns to the last finance page you used (finance-ui stores it), else budget.html.
 * - The orange dot stretches into a bar towards the tapped tab and shrinks back into a dot there.
 *   Across pages the stretch runs before leaving and the shrink on the new page
 *   (sessionStorage 'pbn-from'), with a cross-document view transition in between.
 * - Not shown inside iframes (embedded pages only get bottom padding) or on the training pages,
 *   which keep their own dock.
 * - While the keyboard is up (touch screens) the bar is hidden, so iOS never pulls it up.
 */
(function () {
  'use strict';
  var BOTTOM = 'calc(max(env(safe-area-inset-bottom,0px), 24px) + 62px)';
  // Home shows Listor/Resor in a full-screen frame under the bar: give that page room at the bottom.
  if (window.self !== window.top) {
    if (/[?&]hubFrame=1/.test(location.search)) {
      var pad = document.createElement('style');
      pad.textContent = 'body{padding-bottom:' + BOTTOM + '!important}';
      (document.head || document.documentElement).appendChild(pad);
      document.documentElement.classList.add('under-bottom-nav');
    }
    return;
  }
  if (window.__pulseBottomNav) return;
  if (/^exercise/i.test((location.pathname.split('/').pop() || ''))) return;
  window.__pulseBottomNav = true;

  var file = (location.pathname.split('/').pop() || 'home.html').toLowerCase();
  var isHome = file === 'home.html' || file === '' || file === 'index.html';
  var FINANCE = ['budget.html', 'budget_maja.html', 'analytics.html', 'analytics_maja.html', 'familjebudget.html', 'data.html'];
  var TABS = ['home', 'transfer', 'budget', 'lists', 'more'];
  function homeArea() {
    var hub = window.HomeHub && window.HomeHub.active && window.HomeHub.active();
    if (hub === 'lists') return 'lists';
    if (hub === 'travel') return 'more';
    return document.body && document.body.dataset.homeSection === 'economy' ? 'transfer' : 'home';
  }
  function pageArea() {
    if (isHome) return /[?&]view=economy/.test(location.search) ? 'transfer' : 'home';
    if (FINANCE.indexOf(file) !== -1) return 'budget';
    if (file === 'shopping.html') return 'lists';
    return 'more';
  }

  var ICONS = {
    home: '<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
    transfer: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    budget: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 9V6a3 3 0 0 1 3-3h11M16 13h5"/>',
    training: '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
    lists: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    travel: '<path d="M10 14 3 11l1.5-1.5 7 1 4-4.5a1.8 1.8 0 0 1 2.5 2.5l-4.5 4 1 7L13 21z"/>',
    kid: '<circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>'
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[name] + '</svg>'; }
  function budgetHref() {
    var last = '';
    try { last = localStorage.getItem('finance-last-page-v1') || ''; } catch (_) {}
    return FINANCE.indexOf(String(last).toLowerCase()) !== -1 && last !== 'data.html' ? last : 'budget.html';
  }

  var EASE = 'cubic-bezier(.22,1,.36,1)';
  var css = '' +
    '@view-transition{navigation:auto}' +
    '.pbn{view-transition-name:pbn}' +
    '::view-transition-old(pbn){display:none}' +
    '::view-transition-new(pbn){animation:none}' +
    '::view-transition-old(root){animation:pbn-out .2s ease both}' +
    '::view-transition-new(root){animation:pbn-in .28s ' + EASE + ' both}' +
    '@keyframes pbn-out{to{opacity:0}}' +
    '@keyframes pbn-in{from{opacity:0;transform:translateY(8px)}}' +
    'html.has-bottom-nav body{padding-bottom:' + BOTTOM + '!important}' +
    'html.has-bottom-nav .nav-dropdown-wrapper,html.has-bottom-nav .home-section-tabs{display:none!important}' +
    '.pbn{position:fixed;left:0;right:0;bottom:0;z-index:2147483200;display:flex;align-items:center;justify-content:space-around;padding:6px max(8px,calc((100vw - 520px)/2)) calc(max(env(safe-area-inset-bottom,0px), 24px) + 4px);' +
      'background:linear-gradient(180deg,rgba(9,13,20,.4),rgba(9,13,20,.6));border-top:1px solid rgba(255,255,255,.05);backdrop-filter:blur(24px) saturate(150%);-webkit-backdrop-filter:blur(24px) saturate(150%)}' +
    '.pbn a,.pbn button{appearance:none;border:0;background:transparent;flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:4px 0 7px;color:#7d8996;font:600 9.5px/1 Inter,system-ui,-apple-system,sans-serif;letter-spacing:.02em;text-decoration:none;position:relative;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .25s}' +
    '.pbn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;transition:filter .25s}' +
    '.pbn .on{color:#FDBA74}' +
    '.pbn .on svg{filter:drop-shadow(0 0 6px rgba(253,186,116,.5))}' +
    '.pbn .pop svg{animation:pbn-pop .42s ' + EASE + '}' +
    '@keyframes pbn-pop{0%{transform:scale(1)}35%{transform:scale(.84)}70%{transform:scale(1.1)}100%{transform:scale(1)}}' +
    '.pbn-ind{position:absolute;left:0;bottom:calc(max(env(safe-area-inset-bottom,0px), 24px) + 4px);width:4px;height:4px;border-radius:3px;background:#FDBA74;box-shadow:0 0 9px rgba(253,186,116,.9);pointer-events:none;will-change:transform,width}' +
    '.pbn a:focus-visible,.pbn button:focus-visible{outline:2px solid #FDBA74;outline-offset:-4px;border-radius:14px}' +
    '.pbn-dim{position:fixed;inset:0;z-index:2147483100;background:rgba(5,7,10,.5);opacity:0;pointer-events:none;transition:opacity .25s}' +
    '.pbn-sheet{position:fixed;left:0;right:0;bottom:0;z-index:2147483150;max-width:520px;margin:0 auto;padding:10px max(18px,env(safe-area-inset-left,0px)) calc(max(env(safe-area-inset-bottom,0px), 24px) + 74px);border-radius:24px 24px 0 0;background:#161B22;' +
      'box-shadow:0 -12px 40px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06);transform:translateY(105%);transition:transform .34s ' + EASE + '}' +
    'html.pbn-open .pbn-dim{opacity:1;pointer-events:auto}' +
    'html.pbn-open .pbn-sheet{transform:none}' +
    '.pbn-grab{display:block;width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.18);margin:0 auto 8px}' +
    '.pbn-sheet a,.pbn-sheet button{appearance:none;width:100%;border:0;background:transparent;display:flex;align-items:center;gap:14px;padding:14px 2px;border-bottom:1px solid rgba(255,255,255,.06);color:#f0f6fc;font:500 15px/1.2 Inter,system-ui,-apple-system,sans-serif;text-decoration:none;text-align:left;cursor:pointer}' +
    '.pbn-sheet a:last-child,.pbn-sheet button:last-child{border-bottom:0}' +
    '.pbn-sheet svg{width:19px;height:19px;fill:none;stroke:#FDBA74;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 5px rgba(253,186,116,.35))}' +
    '.pbn-sheet em{margin-left:auto;font-style:normal;font-size:12.5px;color:#7d8996}' +
    '.pbn-sheet .on{color:#FDBA74}' +
    // A page's own floating "+" button (Home: new event) sits just above the bar.
    'html.has-bottom-nav:not(#pbn) body .fab{bottom:calc(max(env(safe-area-inset-bottom,0px), 24px) + 66px)!important}' +
    'html.pbn-typing .pbn{visibility:hidden}' +
    '@media (prefers-reduced-motion:reduce){.pbn-sheet,.pbn-dim{transition:none}.pbn .pop svg{animation:none}::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}}';

  function install() {
    if (document.querySelector('.pbn')) return;
    var style = document.createElement('style');
    style.id = 'pulse-bottom-nav-v1-style';
    style.textContent = css;
    document.head.appendChild(style);
    document.documentElement.classList.add('has-bottom-nav');

    var nav = document.createElement('nav');
    nav.className = 'pbn';
    nav.setAttribute('aria-label', 'Huvudmeny');
    var tabs = [
      ['home', 'Hem', 'home.html'],
      ['transfer', 'Överföringar', 'home.html?view=economy'],
      ['budget', 'Budget', budgetHref()],
      ['lists', 'Listor', 'shopping.html'],
      ['more', 'Mer', null]
    ];
    nav.innerHTML = tabs.map(function (t) {
      return t[2]
        ? '<a href="' + t[2] + '" data-pbn="' + t[0] + '">' + svg(t[0]) + '<span>' + t[1] + '</span></a>'
        : '<button type="button" data-pbn="more" aria-haspopup="dialog" aria-expanded="false">' + svg('more') + '<span>' + t[1] + '</span></button>';
    }).join('') + '<i class="pbn-ind" aria-hidden="true"></i>';
    var ind = nav.querySelector('.pbn-ind');

    var dim = document.createElement('div');
    dim.className = 'pbn-dim';
    var sheet = document.createElement('div');
    sheet.className = 'pbn-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-label', 'Mer');
    var notif = isHome ? document.getElementById('home-notifications') : null;
    sheet.innerHTML = '<span class="pbn-grab" aria-hidden="true"></span>' +
      '<a href="exercise.html">' + svg('training') + 'Träning</a>' +
      '<a href="travel.html" data-pbn-sheet="travel"' + (file === 'travel.html' ? ' class="on"' : '') + '>' + svg('travel') + 'Resor</a>' +
      '<a href="mila.html"' + (file === 'mila.html' ? ' class="on"' : '') + '>' + svg('kid') + 'Mila</a>' +
      '<a href="melker.html"' + (file === 'melker.html' ? ' class="on"' : '') + '>' + svg('kid') + 'Melker</a>' +
      (notif ? '<button type="button" data-pbn-sheet="notif">' + svg('bell') + 'Notiser<em data-pbn-notif></em></button>' : '');

    document.body.appendChild(dim);
    document.body.appendChild(sheet);
    document.body.appendChild(nav);

    // ---- the travelling dot -------------------------------------------------------------
    var current = null;
    var reduced = function () { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; };
    function tabEl(name) { return nav.querySelector('[data-pbn="' + name + '"]'); }
    function centre(name) {
      var el = tabEl(name);
      if (!el) return 0;
      var r = el.getBoundingClientRect(), n = nav.getBoundingClientRect();
      return r.left - n.left + r.width / 2;
    }
    function place(x, w) { ind.style.width = w + 'px'; ind.style.transform = 'translateX(' + (x - w / 2) + 'px)'; }
    function frame(x, w) { return { width: w + 'px', transform: 'translateX(' + (x - w / 2) + 'px)' }; }
    var running = null;
    // part: 'both' (same page), 'stretch' (before leaving), 'shrink' (arriving)
    function travel(from, to, part) {
      var a = centre(from), b = centre(to);
      var lo = Math.min(a, b), hi = Math.max(a, b), mid = (lo + hi) / 2, span = hi - lo + 4;
      if (running) { running.cancel(); running = null; }
      if (!ind.animate || reduced() || from === to) { place(b, 4); return Promise.resolve(); }
      var frames = part === 'stretch' ? [frame(a, 4), frame(mid, span)]
        : part === 'shrink' ? [frame(mid, span), frame(b, 4)]
        : [frame(a, 4), frame(mid, span), frame(b, 4)];
      var ms = part === 'both' ? 440 : 230;
      place(part === 'stretch' ? mid : b, part === 'stretch' ? span : 4);
      running = ind.animate(frames, { duration: ms, easing: part === 'both' ? 'cubic-bezier(.65,0,.35,1)' : EASE });
      return running.finished.catch(function () {});
    }
    function mark(name, animate) {
      if (TABS.indexOf(name) === -1) name = 'more';
      var prev = current;
      current = name;
      nav.querySelectorAll('[data-pbn]').forEach(function (el) {
        var on = el.dataset.pbn === name;
        el.classList.toggle('on', on);
        if (on) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
      });
      if (animate && prev && prev !== name) {
        var el = tabEl(name);
        el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
        travel(prev, name, 'both');
      } else if (!running) place(centre(name), 4);
    }

    // Arriving from another page: shrink the bar that was stretched there.
    var start = isHome ? homeArea() : pageArea();
    var from = null;
    try { from = sessionStorage.getItem('pbn-from'); sessionStorage.removeItem('pbn-from'); } catch (_) {}
    current = start;
    nav.querySelectorAll('[data-pbn]').forEach(function (el) { el.classList.toggle('on', el.dataset.pbn === start); });
    requestAnimationFrame(function () {
      if (from && from !== start && TABS.indexOf(from) !== -1) {
        var el = tabEl(start);
        if (el) el.classList.add('pop');
        travel(from, start, 'shrink');
      } else place(centre(start), 4);
    });
    window.addEventListener('resize', function () { if (!running) place(centre(current), 4); });

    // ---- Mer sheet ------------------------------------------------------------------------
    var moreBtn = tabEl('more');
    var beforeMore = null;
    function setOpen(open) {
      document.documentElement.classList.toggle('pbn-open', open);
      moreBtn.setAttribute('aria-expanded', String(open));
      if (open) { syncNotif(); beforeMore = current; mark('more', true); }
      else if (beforeMore && current === 'more') { mark(isHome ? homeArea() : pageArea(), true); beforeMore = null; }
    }
    function syncNotif() {
      var label = sheet.querySelector('[data-pbn-notif]');
      if (label && notif) label.textContent = notif.getAttribute('aria-checked') === 'true' ? 'På' : 'Av';
    }
    moreBtn.addEventListener('click', function () { setOpen(!document.documentElement.classList.contains('pbn-open')); });
    dim.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    sheet.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pbn-sheet="notif"]');
      if (b && notif) { notif.click(); setTimeout(syncNotif, 50); return; }
      // On Home, Resor opens in Home's own full-screen view.
      var travelLink = e.target.closest('[data-pbn-sheet="travel"]');
      if (travelLink && isHome && window.HomeHub) {
        e.preventDefault();
        beforeMore = null;
        document.documentElement.classList.remove('pbn-open');
        moreBtn.setAttribute('aria-expanded', 'false');
        window.HomeHub.open('travel', moreBtn);
        return;
      }
      var link = e.target.closest('a[href]');
      if (link) { try { sessionStorage.setItem('pbn-from', 'more'); } catch (_) {} }
    });

    // ---- tab taps -----------------------------------------------------------------------
    nav.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-pbn]');
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      var name = a.dataset.pbn;
      if (document.documentElement.classList.contains('pbn-open')) {
        document.documentElement.classList.remove('pbn-open');
        moreBtn.setAttribute('aria-expanded', 'false');
        beforeMore = null;
      }
      // Home's own sections and full-screen views stay on the page.
      if (isHome && window.HomeHub && name !== 'budget') {
        e.preventDefault();
        if (name === current) { if (name === 'home' || name === 'transfer') window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        mark(name, true);
        if (name === 'lists') window.HomeHub.open('lists', a);
        else window.HomeHub.home(name === 'transfer' ? 'economy' : 'overview', a);
        return;
      }
      if (name === current && name !== 'budget') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      // Another page: stretch first, then leave; the new page shrinks the bar into its dot.
      e.preventDefault();
      var href = a.href;
      var fromName = current;
      try { sessionStorage.setItem('pbn-from', fromName); } catch (_) {}
      tabEl(name).classList.add('on');
      travel(fromName, name, 'stretch').then(function () { location.href = href; });
    });

    // Home: follow its sections and full-screen views (Back button, links inside the views).
    if (isHome) {
      window.addEventListener('hub:change', function () {
        var name = homeArea();
        if (name !== current && !document.documentElement.classList.contains('pbn-open')) mark(name, true);
      });
    }
    // Coming back with Back from another page restores this page's tab.
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) { running = null; mark(isHome ? homeArea() : pageArea(), false); }
    });

    // ---- keyboard: the bar stays down behind it -------------------------------------------
    function typing() {
      var el = document.activeElement;
      try { while (el && el.tagName === 'IFRAME' && el.contentDocument) el = el.contentDocument.activeElement; } catch (_) {}
      if (!el) return false;
      if (el.isContentEditable || el.tagName === 'TEXTAREA') return true;
      return el.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|reset|range|color|file|image|hidden)$/i.test(el.type || '');
    }
    var typingTimer = 0;
    function syncTyping() {
      clearTimeout(typingTimer);
      var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      typingTimer = setTimeout(function () { document.documentElement.classList.toggle('pbn-typing', touch && typing()); }, 30);
    }
    document.addEventListener('focusin', syncTyping);
    document.addEventListener('focusout', syncTyping);
    window.addEventListener('blur', syncTyping);
    window.addEventListener('focus', syncTyping);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', syncTyping);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
