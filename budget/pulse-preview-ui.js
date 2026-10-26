/* Design previews for the exercise explorer, one flag per idea, combinable:
   ?ui=scen,remsa,omslag,puls,siffror,nav (and kropp in pulse-body-ui.js).
     scen     The stage fills the screen; gestures replace its buttons.
     remsa    A pass strip above the dock replaces the Mitt pass page.
     omslag   Programs as cover cards; a time ring replaces the length select.
     puls     The Pulse Flow ECG line as dividers, loader and markers.
     siffror  Doses and times as large numbers instead of small labels.
     nav      One navigation level: the dock, a back arrow and edge swipe.
   Every action calls the page's own controls or PulseGuideUI, so behaviour
   keeps one source of truth and the default UI is untouched without flags. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var flags = (params.get('ui') || '').split(',').filter(Boolean);
  var NAMES = ['scen', 'remsa', 'omslag', 'puls', 'siffror', 'nav'];
  var active = NAMES.filter(function (n) { return flags.indexOf(n) >= 0; });
  if (!active.length) return;
  active.forEach(function (n) { document.documentElement.classList.add('ui-' + n); });

  var POSES = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,21,22,23,25,26,30,34,35,43,44,45,52];
  var ECG = 'M0 5 H34 L38 3.2 L42 7.4 L47 .8 L52 9.2 L56 4.2 H100';
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function poseSrc(id, end) {
    return POSES.indexOf(Number(id)) >= 0 ? 'assets/exercise-poses-v1/' + String(id).padStart(2, '0') + (end ? '-end' : '-start') + '.webp' : '';
  }
  function ecg(cls) { return '<svg class="' + cls + '" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="' + ECG + '" pathLength="100"></path></svg>'; }
  /* "2 × 8–12 reps" -> {big:"2×8–12", unit:"reps"}; "1 × 20 min" -> {big:"20", unit:"min"} */
  function splitDose(label) {
    var m = String(label || '').match(/(\d+)\s*×\s*([\d–]+)\s*(.*)$/);
    if (!m) return { big: String(label || ''), unit: '' };
    return m[1] === '1' && /min/.test(m[3]) ? { big: m[2], unit: m[3] } : { big: m[1] + '×' + m[2], unit: m[3] };
  }
  function observe(node, fn, opts) { if (node) new MutationObserver(fn).observe(node, opts || { childList: true, subtree: true, characterData: true }); }

  /* ---- scen: stage first, gestures instead of buttons ---- */
  function scen(ui) {
    var stage = $('studio-stage');
    var overlay = el('div', 'sc-overlay'), dose = el('div', 'sc-dose');
    overlay.appendChild(document.querySelector('#detail .detail-head'));
    overlay.appendChild(dose);
    overlay.appendChild($('muscles'));
    stage.appendChild(overlay);
    var index = el('span', 'sc-index'); stage.appendChild(index);
    var poster = el('img', 'sc-poster'); poster.alt = ''; poster.setAttribute('aria-hidden', 'true'); stage.insertBefore(poster, stage.firstChild);
    var pauseMark = el('div', 'sc-pause', '<span></span><span></span>'); pauseMark.setAttribute('aria-hidden', 'true'); stage.appendChild(pauseMark);
    var burst = el('div', 'sc-burst'); burst.setAttribute('aria-hidden', 'true'); stage.appendChild(burst);
    var turn = el('button', 'sc-view', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66"></path><path d="M20 4v4h-4"></path></svg>');
    turn.type = 'button'; turn.setAttribute('aria-label', 'Byt kameravinkel');
    turn.addEventListener('click', function (event) { event.stopPropagation(); $('view-toggle').click(); });
    stage.appendChild(turn);
    function sync() {
      var id = ui.active(), d = splitDose(ui.prescription(id).label);
      dose.innerHTML = '<strong>' + d.big + '</strong><span>' + d.unit + '</span>';
      index.textContent = ($('studio-index').textContent || '').replace(/\s/g, '');
      var src = poseSrc(id, false);
      if (poster.dataset.src !== src) { poster.dataset.src = src; if (src) poster.src = src; else poster.removeAttribute('src'); }
      stage.classList.toggle('sc-has-poster', !!src);
      stage.classList.toggle('sc-chosen', ui.selection().indexOf(id) >= 0);
    }
    observe($('detail-name'), sync); observe($('studio-index'), sync); observe($('living-pass-count'), sync);
    new MutationObserver(function () { stage.classList.toggle('sc-paused', $('pause').getAttribute('aria-pressed') === 'true'); })
      .observe($('pause'), { attributes: true, attributeFilter: ['aria-pressed'] });

    var start = null, tapTimer = 0, lastTap = 0;
    stage.addEventListener('pointerdown', function (event) {
      start = event.target.closest('button,a,summary') ? null : { x: event.clientX, y: event.clientY, t: Date.now(), type: event.pointerType };
    });
    stage.addEventListener('pointerup', function (event) {
      if (!start) return;
      var dx = event.clientX - start.x, dy = event.clientY - start.y, s = start; start = null;
      if (dy < -60 && Math.abs(dy) > Math.abs(dx) * 1.3) { hideHint(); $('stage-technique').click(); return; }
      // Touch swipes are handled by the page; mouse drags get the same steps.
      if (s.type === 'mouse' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { hideHint(); (dx < 0 ? $('studio-next') : $('studio-prev')).click(); return; }
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12 || Date.now() - s.t > 450) return;
      var now = Date.now();
      if (now - lastTap < 300) {
        clearTimeout(tapTimer); lastTap = 0; hideHint();
        var id = ui.active(), had = ui.selection().indexOf(id) >= 0;
        ui.toggle(id);
        burst.className = 'sc-burst'; void burst.offsetWidth;
        burst.className = 'sc-burst ' + (had ? 'is-removed' : 'is-added');
        burst.textContent = had ? 'Borttagen' : '+ Mitt pass';
        return;
      }
      lastTap = now;
      tapTimer = setTimeout(function () { lastTap = 0; hideHint(); $('pause').click(); }, 300);
    });
    stage.addEventListener('pointercancel', function () { start = null; });
    stage.addEventListener('dblclick', function (event) { event.preventDefault(); });

    var hint = null, seen = false;
    try { seen = localStorage.getItem('pulse-scene-hint-v1') === '1'; } catch (_) {}
    if (!seen || params.get('hint') === '1') {
      hint = el('div', 'sc-hint', '<span><b>←  →</b>svep</span><span><b>Tryck</b>paus</span><span><b>Dubbeltryck</b>välj</span><span><b>↑</b>teknik</span>');
      hint.setAttribute('role', 'note'); stage.appendChild(hint);
      setTimeout(hideHint, 6000);
    }
    function hideHint() {
      if (!hint) return;
      var h = hint; hint = null; h.classList.add('is-gone');
      setTimeout(function () { h.remove(); }, 400);
      try { localStorage.setItem('pulse-scene-hint-v1', '1'); } catch (_) {}
    }
    sync();
  }

  /* ---- remsa: pass strip and Mitt pass sheet ---- */
  function remsa(ui) {
    function thumbSrc(id) { return poseSrc(id, true) || ui.muscleImage(id); }
    var strip = el('button', 're-pass'); strip.type = 'button'; strip.setAttribute('aria-haspopup', 'dialog');
    $('living-dock').parentNode.insertBefore(strip, $('living-dock'));
    var scrim = el('div', 're-scrim'); scrim.hidden = true;
    var sheet = el('div', 're-sheet'); sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Mitt pass'); sheet.hidden = true;
    var grip = el('div', 're-grip'); grip.setAttribute('aria-hidden', 'true'); sheet.appendChild(grip);
    var selection = $('selection'); sheet.appendChild(selection);
    document.body.appendChild(scrim); document.body.appendChild(sheet);
    var lastCount = ui.selection().length;
    function render() {
      var ids = ui.selection(), t = ids.reduce(function (sum, id) { var m = ui.minutes(id); return { min: sum.min + m.min, max: sum.max + m.max }; }, { min: 0, max: 0 });
      var thumbs = ids.slice(0, 5).map(function (id) { return '<span class="re-thumb"><img src="' + thumbSrc(id) + '" alt="" width="40" height="40"></span>'; }).join('') +
        (ids.length > 5 ? '<span class="re-thumb re-more">+' + (ids.length - 5) + '</span>' : '');
      strip.innerHTML = ids.length
        ? '<span class="re-thumbs">' + thumbs + '</span><span class="re-copy"><b>Mitt pass</b><small>' + ids.length + (ids.length === 1 ? ' övning' : ' övningar') + ' · ≈ ' + (t.max > t.min ? t.min + '–' + t.max : t.max) + ' min</small></span><span class="re-chev" aria-hidden="true">⌃</span>'
        : '<span class="re-thumbs"><span class="re-thumb re-empty"></span><span class="re-thumb re-empty"></span><span class="re-thumb re-empty"></span></span><span class="re-copy"><b>Mitt pass</b><small>' + (document.documentElement.classList.contains('ui-scen') ? 'Dubbeltryck en övning för att lägga till' : 'Välj övningar så samlas de här') + '</small></span>';
      strip.setAttribute('aria-label', 'Mitt pass, ' + ids.length + ' övningar. Öppna');
      strip.classList.toggle('is-empty', !ids.length);
      if (ids.length > lastCount) { strip.classList.remove('is-pulse'); void strip.offsetWidth; strip.classList.add('is-pulse'); }
      lastCount = ids.length;
    }
    observe($('living-pass-count'), render);
    function decorate() {
      [].forEach.call($('selection-items').children, function (li) {
        var remove = li.querySelector('[data-remove-choice]');
        if (!remove || li.dataset.id) return;
        var id = Number(remove.dataset.removeChoice);
        li.dataset.id = String(id);
        var handle = el('span', 're-handle', '<i></i><i></i><i></i>'); handle.setAttribute('aria-hidden', 'true');
        li.insertBefore(el('span', 're-item-thumb', '<img src="' + thumbSrc(id) + '" alt="" width="44" height="44">'), li.firstChild);
        li.insertBefore(handle, li.firstChild);
      });
    }
    observe($('selection-items'), decorate, { childList: true });
    var drag = null, list = $('selection-items');
    list.addEventListener('pointerdown', function (event) {
      var handle = event.target.closest('.re-handle'); if (!handle) return;
      drag = { li: handle.closest('li'), y: event.clientY, id: event.pointerId };
      drag.li.classList.add('is-dragging'); handle.setPointerCapture(event.pointerId); event.preventDefault();
    });
    list.addEventListener('pointermove', function (event) {
      if (!drag || event.pointerId !== drag.id) return;
      var li = drag.li, prev = li.previousElementSibling, next = li.nextElementSibling;
      if (prev && event.clientY < prev.getBoundingClientRect().top + prev.offsetHeight / 2) { list.insertBefore(li, prev); drag.y -= prev.offsetHeight; }
      else if (next && event.clientY > next.getBoundingClientRect().top + next.offsetHeight / 2) { list.insertBefore(next, li); drag.y += next.offsetHeight; }
      li.style.transform = 'translateY(' + (event.clientY - drag.y) + 'px)';
    });
    function endDrag() {
      if (!drag) return;
      var li = drag.li; drag = null; li.classList.remove('is-dragging'); li.style.transform = '';
      var order = [].map.call(list.children, function (n) { return Number(n.dataset.id); });
      if (order.join() !== ui.selection().join()) ui.setSelection(order);
    }
    list.addEventListener('pointerup', endDrag); list.addEventListener('pointercancel', endDrag);
    var returnFocus = null;
    function open() {
      returnFocus = document.activeElement; selection.hidden = false; scrim.hidden = false; sheet.hidden = false;
      requestAnimationFrame(function () { document.documentElement.classList.add('re-sheet-open'); });
      decorate(); sheet.tabIndex = -1; sheet.focus({ preventScroll: true });
    }
    function close() {
      document.documentElement.classList.remove('re-sheet-open');
      setTimeout(function () { scrim.hidden = true; sheet.hidden = true; selection.hidden = true; }, 260);
      if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
    }
    strip.addEventListener('click', open); scrim.addEventListener('click', close); grip.addEventListener('click', close);
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !sheet.hidden) close(); });
    var sheetStart = null;
    grip.addEventListener('pointerdown', function (event) { sheetStart = event.clientY; grip.setPointerCapture(event.pointerId); });
    grip.addEventListener('pointerup', function (event) { if (sheetStart != null && event.clientY - sheetStart > 50) close(); sheetStart = null; });
    if (location.hash === '#selection') { $('living-dock').querySelector('[data-page="guide"]').click(); open(); }
    render();
  }

  /* ---- omslag: time ring and cover cards ---- */
  function omslag(ui) {
    var host = document.querySelector('.kb-program-head');
    var side = el('div', 'om-side');
    var ring = el('button', 'om-ring'); ring.type = 'button';
    var count = el('p', 'om-count');
    side.appendChild(ring); side.appendChild(count);
    if (host) host.appendChild(side); else $('program-controls').parentNode.insertBefore(side, $('program-controls'));
    var TIMES = ['', '20', '30', '45', '60'];
    function sync() {
      var value = $('program-time').value, frac = value ? Number(value) / 60 : 1, len = 2 * Math.PI * 44;
      ring.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="om-ring-track" cx="50" cy="50" r="44"></circle>' +
        '<circle class="om-ring-fill" cx="50" cy="50" r="44" stroke-dasharray="' + (len * frac).toFixed(1) + ' ' + len.toFixed(1) + '"></circle>' +
        [20, 30, 45, 60].map(function (t) { var a = (t / 60) * 2 * Math.PI - Math.PI / 2; return '<circle class="om-tick' + (value && Number(value) >= t ? ' on' : '') + '" cx="' + (50 + 44 * Math.cos(a)).toFixed(1) + '" cy="' + (50 + 44 * Math.sin(a)).toFixed(1) + '" r="2.4"></circle>'; }).join('') +
        '</svg><span class="om-ring-copy"><small>Tid</small><strong>' + (value ? '≤' + value : 'Alla') + '</strong><small>' + (value ? 'min' : 'längder') + '</small></span>';
      ring.setAttribute('aria-label', 'Tid: ' + (value ? 'upp till ' + value + ' minuter' : 'alla längder') + '. Tryck för att ändra');
      var f = ui.programFilter(), n = ui.programCount(f);
      count.innerHTML = '<strong>' + n + '</strong> program' + (f !== 'Alla' ? '<br><span>för ' + f.toLowerCase() + '</span>' : '');
    }
    ring.addEventListener('click', function () {
      var select = $('program-time');
      select.value = TIMES[(TIMES.indexOf(select.value) + 1) % TIMES.length];
      select.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
    });
    function decorate() {
      [].forEach.call($('program-cards').querySelectorAll('.program-card'), function (card) {
        if (card.querySelector('.om-cover')) return;
        var button = card.querySelector('[data-program]'), program = button && ui.program(button.dataset.program);
        if (!program) return;
        var stills = program.ids.filter(function (id) { return POSES.indexOf(id) >= 0; }).slice(0, 3);
        var cover = el('div', 'om-cover om-cover-' + stills.length,
          stills.map(function (id, i) { return '<img src="' + poseSrc(id, true) + '" alt="" loading="lazy" data-i="' + i + '">'; }).join('') + ecg('om-cover-line'));
        cover.setAttribute('aria-hidden', 'true');
        card.insertBefore(cover, card.firstChild);
        card.addEventListener('click', function (event) { if (!event.target.closest('button')) button.click(); });
      });
    }
    observe($('program-cards'), function () { decorate(); sync(); }, { childList: true });
    decorate(); sync();
  }

  /* ---- puls: the ECG line as the shared motif ---- */
  function puls() {
    // Beside the status text, which the page rewrites while the model loads.
    $('studio-stage').insertAdjacentHTML('beforeend', ecg('pu-loader'));
    var action = document.querySelector('.studio-action');
    if (action) action.insertAdjacentHTML('beforebegin', ecg('pu-divider'));
    var head = document.querySelector('.catalog-head');
    if (head) head.insertAdjacentHTML('afterend', ecg('pu-divider'));
    [].forEach.call(document.querySelectorAll('#living-dock button'), function (b) { b.insertAdjacentHTML('afterbegin', ecg('pu-dock')); });
  }

  /* ---- siffror: numbers carry the dose and time ---- */
  function siffror(ui) {
    var guide = $('guide-prescription');
    function doseHtml(label) { var d = splitDose(label); return '<span class="si-num">' + d.big + '</span><span class="si-unit">' + d.unit + '</span>'; }
    function syncGuide() { var t = guide.textContent.replace(/^Förslag:\s*/, ''); if (guide.dataset.si === t) return; guide.dataset.si = t; guide.innerHTML = doseHtml(t); }
    observe(guide, syncGuide); syncGuide();
    var idx = $('studio-index'), big = el('div', 'si-index');
    $('studio-stage').appendChild(big);
    function syncIndex() { var m = (idx.textContent || '').match(/(\d+)\s*\/\s*(\d+)/); big.innerHTML = m ? '<b>' + String(m[1]).padStart(2, '0') + '</b><span>/' + m[2] + '</span>' : ''; }
    observe(idx, syncIndex); syncIndex();
    function rewrite(root, selector) {
      [].forEach.call(root.querySelectorAll(selector), function (n) {
        if (n.dataset.si) return;
        var t = n.textContent.replace(/^Förslag:\s*/, ''); n.dataset.si = t; n.innerHTML = doseHtml(t);
      });
    }
    function syncList() { rewrite($('exercise-list'), '.exercise-dose'); }
    observe($('exercise-list'), syncList, { childList: true }); syncList();
    function syncPrograms() {
      [].forEach.call($('program-cards').querySelectorAll('.program-meta'), function (meta) {
        if (meta.dataset.si) return;
        var m = meta.textContent.match(/(\d+)\s*övningar\s*·\s*([\d–]+)\s*min/);
        if (!m) return;
        meta.dataset.si = '1';
        meta.insertAdjacentHTML('afterbegin', '<span class="si-figures"><span><span class="si-num">' + m[2] + '</span><span class="si-unit">min</span></span><span><span class="si-num">' + m[1] + '</span><span class="si-unit">övningar</span></span></span>');
      });
    }
    observe($('program-cards'), syncPrograms, { childList: true }); syncPrograms();
    function syncTimeline() {
      [].forEach.call($('program-detail').querySelectorAll('.timeline-copy small:first-of-type'), function (n) {
        if (n.dataset.si) return; var t = n.textContent.replace(/^Förslag:\s*/, ''); n.dataset.si = t; n.innerHTML = doseHtml(t);
      });
    }
    observe($('program-detail'), syncTimeline, { childList: true }); syncTimeline();
  }

  /* ---- nav: one navigation level ---- */
  function nav() {
    var dock = $('living-dock'), exit = $('explore-back');
    var home = el('a', 'nv-exit', '<span class="living-dock-icon" aria-hidden="true">↩</span><span>Träning</span>');
    home.href = exit.getAttribute('href'); home.setAttribute('aria-label', 'Till träningen');
    dock.insertBefore(home, dock.firstChild);
    var back = el('button', 'nv-back', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>');
    back.type = 'button'; back.setAttribute('aria-label', 'Tillbaka');
    document.body.appendChild(back);
    function target() {
      if (document.body.classList.contains('exercise-list-open')) return $('studio-back');
      var close = $('close-program');
      if (close && !$('program-detail').hidden && !$('programs-page').hidden) return close;
      return null;
    }
    function sync() { back.hidden = !target(); }
    back.addEventListener('click', function () { var t = target(); if (t) t.click(); sync(); });
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observe($('program-detail'), sync, { attributes: true, attributeFilter: ['hidden'] });
    observe($('programs-page'), sync, { attributes: true, attributeFilter: ['hidden'] });
    var edge = null;
    document.addEventListener('touchstart', function (event) {
      var t = event.touches[0]; edge = event.touches.length === 1 && t.clientX < 24 ? { x: t.clientX, y: t.clientY } : null;
    }, { passive: true });
    document.addEventListener('touchend', function (event) {
      if (!edge) return; var t = event.changedTouches[0], dx = t.clientX - edge.x, dy = Math.abs(t.clientY - edge.y); edge = null;
      if (dx > 70 && dx > dy * 1.5) back.click();
    }, { passive: true });
    sync();
  }

  function init() {
    var ui = window.PulseGuideUI;
    if (!ui) return;
    var run = { scen: scen, remsa: remsa, omslag: omslag, puls: puls, siffror: siffror, nav: nav };
    active.forEach(function (name) { try { run[name](ui); } catch (error) { console.warn('Preview ' + name + ' failed', error); } });
  }
  // After pulse-body-ui.js, whose program head the time ring joins.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); }, { once: true });
  else setTimeout(init, 0);
})();
