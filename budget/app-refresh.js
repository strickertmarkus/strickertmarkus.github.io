/* Home-screen web apps on iPhone have no reload button and can keep serving the
   page they had. This (1) checks for a newer published version whenever the app is
   opened or brought back, and reloads into it, and (2) adds pull-to-refresh at the top of Home's start view.
   Another page opts in with window.AppRefreshPage = { canReload() }: false while an edit is open, so neither the
   automatic reload nor a pull loses it. window.AppRefresh.reload() reloads into the latest version on demand. */
(function () {
  'use strict';
  var standalone = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

  // A newer deploy = a versioned script or stylesheet in the published page that this
  // page does not have (scripts injected later at runtime are ignored this way).
  function assetsOf(doc) {
    return Array.prototype.map.call(doc.querySelectorAll('script[src*="?v="],link[href*="?v="]'), function (el) {
      return el.getAttribute('src') || el.getAttribute('href');
    });
  }
  function isNewer(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var mine = {};
    assetsOf(document).forEach(function (u) { mine[u] = true; });
    var latest = assetsOf(doc);
    return latest.length > 0 && latest.some(function (u) { return !mine[u]; }) ? latest.sort().join('|') : '';
  }

  function freshURL() {
    var url = new URL(location.href);
    url.searchParams.set('r', Date.now().toString(36));
    return url.href;
  }
  function reloadFresh() { location.replace(freshURL()); }
  function pageAllowsReload() { var page = window.AppRefreshPage; return !page || !page.canReload || page.canReload(); }
  window.AppRefresh = { reload: reloadFresh };

  var checking = false, lastCheck = 0;
  function check() {
    if (checking || Date.now() - lastCheck < 20000 || document.hidden) return;
    checking = true; lastCheck = Date.now();
    var probe = new URL(location.pathname, location.href);
    probe.searchParams.set('check', Date.now().toString(36));
    fetch(probe.href, { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (html) {
        if (!html) return;
        var latest = isNewer(html);
        if (!latest) return;
        // Avoid a loop if the server still hands out the old page.
        var key = 'appRefreshTried:' + location.pathname;
        try { if (sessionStorage.getItem(key) === latest) return; sessionStorage.setItem(key, latest); } catch (_) {}
        if (window.TrainingOverlay && window.TrainingOverlay.isLocked && window.TrainingOverlay.isLocked()) return;
        if (!pageAllowsReload()) return;
        reloadFresh();
      })
      .catch(function () {})
      .then(function () { checking = false; });
  }
  window.addEventListener('load', function () { setTimeout(check, 1500); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) check(); });

  if (!standalone) return;

  // Pull to refresh: drag down from the very top, only on Home's start view with nothing open,
  // so a drag inside a menu, sheet or dialog (or on another page) never reloads and loses an edit.
  var OPEN = 'dialog[open],[aria-modal="true"],.show,.is-open,.flatpickr-calendar.open,[aria-expanded="true"]';
  function shown(el) {
    if (el.hidden || !el.getClientRects().length) return false;
    var cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0;
  }
  function onStartView() {
    if (window.AppRefreshPage) return pageAllowsReload(); /* a page that opted in decides itself */
    if (!window.HomeHub || window.HomeHub.active()) return false; /* Home only, and not inside Budget/Listor/Resor */
    var section = document.body.dataset.homeSection;
    return !section || section === 'overview';
  }
  function somethingOpen() {
    if (document.documentElement.classList.contains('pbn-modal')) return true;
    return Array.prototype.some.call(document.querySelectorAll(OPEN), shown);
  }
  function insideOverlayOrScrolled(node) { /* a fixed panel, or a scroll box that is not at its top */
    for (var el = node; el && el !== document.body && el.nodeType === 1; el = el.parentElement) {
      var cs = getComputedStyle(el);
      if (cs.position === 'fixed') return true;
      if (el.scrollTop > 0 && /(auto|scroll)/.test(cs.overflowY)) return true;
    }
    return false;
  }
  function canPull(e) {
    return window.scrollY <= 0 && e.touches.length === 1 && onStartView() && !somethingOpen() && !insideOverlayOrScrolled(e.target);
  }
  var startY = null, pulled = 0, hint = null;
  function ensureHint() {
    if (hint) return hint;
    hint = document.createElement('div');
    hint.setAttribute('aria-hidden', 'true');
    hint.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 6px);z-index:9999;width:34px;height:34px;margin-left:-17px;border-radius:50%;display:grid;place-items:center;background:#11161ee6;box-shadow:0 0 0 1px #ff9a9140,0 0 18px #ff657a44;color:#ffd8c8;font:600 16px system-ui;opacity:0;transform:translateY(-40px) rotate(0deg);transition:opacity .15s;pointer-events:none';
    hint.textContent = '↻';
    document.body.appendChild(hint);
    return hint;
  }
  document.addEventListener('touchstart', function (e) {
    if (!canPull(e)) { startY = null; return; }
    startY = e.touches[0].clientY; pulled = 0;
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (startY === null) return;
    pulled = Math.max(0, e.touches[0].clientY - startY);
    if (window.scrollY > 0) { pulled = 0; }
    var h = ensureHint(), p = Math.min(1, pulled / 110);
    h.style.opacity = String(p);
    h.style.transform = 'translateY(' + (-40 + p * 70) + 'px) rotate(' + (p * 300) + 'deg)';
  }, { passive: true });
  document.addEventListener('touchend', function () {
    if (startY === null) return;
    var go = pulled >= 110;
    startY = null;
    if (!hint) return;
    if (go) { hint.style.opacity = '1'; reloadFresh(); }
    else { hint.style.opacity = '0'; hint.style.transform = 'translateY(-40px)'; }
  }, { passive: true });
})();
