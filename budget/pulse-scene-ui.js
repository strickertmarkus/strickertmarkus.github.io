/* Scene UI preview for the exercise explorer, enabled with ?ui=scen.
   The stage fills the screen and the explorer's own controls are driven by
   gestures; a pass strip above the dock shows and edits Mitt pass. Every
   action calls the page's existing controls or PulseGuideUI, so behaviour has
   one source of truth and the default UI is untouched when the flag is off. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  if (params.get('ui') !== 'scen') return;
  document.documentElement.classList.add('ui-scen');

  var POSES = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,21,22,23,25,26,30,34,35,43,44,45,52];
  var HINT_KEY = 'pulse-scene-hint-v1';
  var $ = function (id) { return document.getElementById(id); };

  function poseSrc(id, end) {
    return POSES.indexOf(Number(id)) >= 0 ? 'assets/exercise-poses-v1/' + String(id).padStart(2, '0') + (end ? '-end' : '-start') + '.webp' : '';
  }
  function thumbSrc(id) { return poseSrc(id, true) || (window.PulseGuideUI ? window.PulseGuideUI.muscleImage(id) : ''); }

  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  function init() {
    var ui = window.PulseGuideUI, stage = $('studio-stage');
    if (!ui || !stage) return;

    /* ---- Stage overlay: name, dose and muscles on top of the model ---- */
    var overlay = el('div', 'scen-overlay');
    var head = document.querySelector('#detail .detail-head');
    var dose = el('div', 'scen-dose');
    overlay.appendChild(head);
    overlay.appendChild(dose);
    overlay.appendChild($('muscles'));
    stage.appendChild(overlay);

    var index = el('span', 'scen-index');
    stage.appendChild(index);
    var poster = el('img', 'scen-poster');
    poster.alt = ''; poster.setAttribute('aria-hidden', 'true');
    stage.insertBefore(poster, stage.firstChild);
    var pauseMark = el('div', 'scen-pause', '<span></span><span></span>');
    pauseMark.setAttribute('aria-hidden', 'true');
    stage.appendChild(pauseMark);
    var burst = el('div', 'scen-burst');
    burst.setAttribute('aria-hidden', 'true');
    stage.appendChild(burst);
    var view = el('button', 'scen-view', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66"></path><path d="M20 4v4h-4"></path></svg>');
    view.type = 'button';
    view.setAttribute('aria-label', 'Byt kameravinkel');
    view.addEventListener('click', function (event) { event.stopPropagation(); $('view-toggle').click(); });
    stage.appendChild(view);

    function syncStage() {
      var id = ui.active(), dosed = ui.prescription(id), ex = ui.exercise(id);
      if (!ex) return;
      var label = String(dosed.label || '');
      var m = label.match(/^(\d+)\s*×\s*([\d–]+)\s*(.*)$/);
      dose.innerHTML = m
        ? '<strong>' + m[1] + '×' + m[2] + '</strong><span>' + m[3] + '</span>'
        : '<strong>' + label + '</strong>';
      index.textContent = ($('studio-index').textContent || '').replace(/\s/g, '');
      var src = poseSrc(id, false);
      if (poster.dataset.src !== src) { poster.dataset.src = src; if (src) poster.src = src; else poster.removeAttribute('src'); }
      stage.classList.toggle('scen-has-poster', !!src);
      stage.classList.toggle('scen-chosen', ui.selection().indexOf(id) >= 0);
    }
    new MutationObserver(syncStage).observe($('detail-name'), { childList: true, characterData: true, subtree: true });
    new MutationObserver(syncStage).observe($('studio-index'), { childList: true, characterData: true, subtree: true });

    new MutationObserver(function () {
      stage.classList.toggle('scen-paused', $('pause').getAttribute('aria-pressed') === 'true');
    }).observe($('pause'), { attributes: true, attributeFilter: ['aria-pressed'] });

    /* ---- Gestures: tap pauses, double tap chooses, drag up opens technique.
       Horizontal swipes are already handled by the page on touch devices. ---- */
    var start = null, tapTimer = 0, lastTap = 0;
    function onDown(event) {
      if (event.target.closest('button,a,summary')) { start = null; return; }
      start = { x: event.clientX, y: event.clientY, t: Date.now(), type: event.pointerType };
    }
    function onUp(event) {
      if (!start) return;
      var dx = event.clientX - start.x, dy = event.clientY - start.y, s = start;
      start = null;
      if (dy < -60 && Math.abs(dy) > Math.abs(dx) * 1.3) { hideHint(); $('stage-technique').click(); return; }
      if (s.type === 'mouse' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { hideHint(); (dx < 0 ? $('studio-next') : $('studio-prev')).click(); return; }
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12 || Date.now() - s.t > 450) return;
      var now = Date.now();
      if (now - lastTap < 300) {
        clearTimeout(tapTimer); lastTap = 0; hideHint();
        var id = ui.active(), had = ui.selection().indexOf(id) >= 0;
        ui.toggle(id);
        burst.className = 'scen-burst';
        void burst.offsetWidth;
        burst.className = 'scen-burst ' + (had ? 'is-removed' : 'is-added');
        burst.textContent = had ? 'Borttagen' : '+ Mitt pass';
        return;
      }
      lastTap = now;
      tapTimer = setTimeout(function () { lastTap = 0; hideHint(); $('pause').click(); }, 300);
    }
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', function () { start = null; });
    stage.addEventListener('dblclick', function (event) { event.preventDefault(); });

    /* ---- First-run hint ---- */
    var hint = null, seen = false;
    try { seen = localStorage.getItem(HINT_KEY) === '1'; } catch (_) {}
    if (!seen || params.get('hint') === '1') {
      hint = el('div', 'scen-hint',
        '<span><b>←  →</b>svep</span><span><b>Tryck</b>paus</span><span><b>Dubbeltryck</b>välj</span><span><b>↑</b>teknik</span>');
      hint.setAttribute('role', 'note');
      stage.appendChild(hint);
      setTimeout(hideHint, 6000);
    }
    function hideHint() {
      if (!hint) return;
      hint.classList.add('is-gone');
      var h = hint; hint = null;
      setTimeout(function () { h.remove(); }, 400);
      try { localStorage.setItem(HINT_KEY, '1'); } catch (_) {}
    }

    /* ---- Pass strip and sheet ---- */
    var strip = el('button', 'scen-pass');
    strip.type = 'button';
    strip.setAttribute('aria-haspopup', 'dialog');
    var dock = $('living-dock');
    dock.parentNode.insertBefore(strip, dock);
    var scrim = el('div', 'scen-scrim');
    scrim.hidden = true;
    var sheet = el('div', 'scen-sheet');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Mitt pass');
    sheet.hidden = true;
    var grip = el('div', 'scen-grip');
    grip.setAttribute('aria-hidden', 'true');
    sheet.appendChild(grip);
    var selection = $('selection');
    sheet.appendChild(selection);
    document.body.appendChild(scrim);
    document.body.appendChild(sheet);

    function totalMinutes(ids) {
      return ids.reduce(function (sum, id) { var t = ui.minutes(id); return { min: sum.min + t.min, max: sum.max + t.max }; }, { min: 0, max: 0 });
    }
    var lastCount = ui.selection().length;
    function renderStrip() {
      var ids = ui.selection(), t = totalMinutes(ids);
      var thumbs = ids.slice(0, 5).map(function (id) {
        return '<span class="scen-thumb"><img src="' + thumbSrc(id) + '" alt="" width="40" height="40"></span>';
      }).join('') + (ids.length > 5 ? '<span class="scen-thumb scen-more">+' + (ids.length - 5) + '</span>' : '');
      strip.innerHTML = ids.length
        ? '<span class="scen-thumbs">' + thumbs + '</span><span class="scen-pass-copy"><b>Mitt pass</b><small>' + ids.length + (ids.length === 1 ? ' övning' : ' övningar') + ' · ≈ ' + (t.max > t.min ? t.min + '–' + t.max : t.max) + ' min</small></span><span class="scen-chev" aria-hidden="true">⌃</span>'
        : '<span class="scen-thumbs"><span class="scen-thumb scen-empty"></span><span class="scen-thumb scen-empty"></span><span class="scen-thumb scen-empty"></span></span><span class="scen-pass-copy"><b>Mitt pass</b><small>Dubbeltryck en övning för att lägga till</small></span>';
      strip.setAttribute('aria-label', 'Mitt pass, ' + ids.length + ' övningar. Öppna');
      strip.classList.toggle('is-empty', !ids.length);
      if (ids.length > lastCount) { strip.classList.remove('is-pulse'); void strip.offsetWidth; strip.classList.add('is-pulse'); }
      lastCount = ids.length;
      syncStage();
    }
    new MutationObserver(renderStrip).observe($('living-pass-count'), { childList: true, characterData: true, subtree: true });

    function decorateItems() {
      [].forEach.call($('selection-items').children, function (li) {
        var remove = li.querySelector('[data-remove-choice]');
        if (!remove || li.dataset.id) return;
        var id = Number(remove.dataset.removeChoice);
        li.dataset.id = String(id);
        var thumb = el('span', 'scen-item-thumb', '<img src="' + thumbSrc(id) + '" alt="" width="44" height="44">');
        var handle = el('span', 'scen-handle', '<i></i><i></i><i></i>');
        handle.setAttribute('aria-hidden', 'true');
        li.insertBefore(thumb, li.firstChild);
        li.insertBefore(handle, li.firstChild);
      });
    }
    new MutationObserver(decorateItems).observe($('selection-items'), { childList: true });

    var drag = null;
    $('selection-items').addEventListener('pointerdown', function (event) {
      var handle = event.target.closest('.scen-handle');
      if (!handle) return;
      var li = handle.closest('li');
      drag = { li: li, y: event.clientY, id: event.pointerId };
      li.classList.add('is-dragging');
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    $('selection-items').addEventListener('pointermove', function (event) {
      if (!drag || event.pointerId !== drag.id) return;
      var list = $('selection-items'), li = drag.li;
      li.style.transform = 'translateY(' + (event.clientY - drag.y) + 'px)';
      var prev = li.previousElementSibling, next = li.nextElementSibling;
      if (prev && event.clientY < prev.getBoundingClientRect().top + prev.offsetHeight / 2) { list.insertBefore(li, prev); drag.y -= prev.offsetHeight; li.style.transform = 'translateY(' + (event.clientY - drag.y) + 'px)'; }
      else if (next && event.clientY > next.getBoundingClientRect().top + next.offsetHeight / 2) { list.insertBefore(next, li); drag.y += next.offsetHeight; li.style.transform = 'translateY(' + (event.clientY - drag.y) + 'px)'; }
    });
    function endDrag() {
      if (!drag) return;
      var li = drag.li; drag = null;
      li.classList.remove('is-dragging'); li.style.transform = '';
      var order = [].map.call($('selection-items').children, function (n) { return Number(n.dataset.id); });
      if (order.join() !== ui.selection().join()) ui.setSelection(order);
    }
    $('selection-items').addEventListener('pointerup', endDrag);
    $('selection-items').addEventListener('pointercancel', endDrag);

    var returnFocus = null;
    function openSheet() {
      returnFocus = document.activeElement;
      selection.hidden = false;
      scrim.hidden = false; sheet.hidden = false;
      requestAnimationFrame(function () { document.documentElement.classList.add('scen-sheet-open'); });
      decorateItems();
      sheet.tabIndex = -1; sheet.focus({ preventScroll: true });
    }
    function closeSheet() {
      document.documentElement.classList.remove('scen-sheet-open');
      setTimeout(function () { scrim.hidden = true; sheet.hidden = true; selection.hidden = true; }, 260);
      if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
    }
    strip.addEventListener('click', openSheet);
    scrim.addEventListener('click', closeSheet);
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !sheet.hidden) closeSheet(); });
    var sheetStart = null;
    grip.addEventListener('pointerdown', function (event) { sheetStart = event.clientY; grip.setPointerCapture(event.pointerId); });
    grip.addEventListener('pointerup', function (event) { if (sheetStart != null && event.clientY - sheetStart > 50) closeSheet(); sheetStart = null; });
    grip.addEventListener('click', closeSheet);

    /* The dock no longer needs its own Mitt pass page in this mode. */
    if (location.hash === '#selection') { history.replaceState(history.state, '', '#guide'); $('living-dock').querySelector('[data-page="guide"]').click(); openSheet(); }

    renderStrip();
    syncStage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
