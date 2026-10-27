/* The exercise scene of the explorer: opened from the body (pulse-gym.js) for
   one muscle, with the muscle's artwork as a wall above the live animated
   figure. Swipe sideways between the muscle's exercises, up for technique,
   down to return to the body; tap to pause, double tap to choose. Programmes
   open as a road of stops and can be played here or trained for real. The
   page's own stage, selection and transfer are reused through PulseGuideUI. */
(function () {
  'use strict';
  var POSES = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,21,22,23,25,26,30,34,35,43,44,45,52];
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function pose(id, end) { return POSES.indexOf(Number(id)) >= 0 ? 'assets/exercise-poses-v1/' + String(id).padStart(2, '0') + (end ? '-end' : '-start') + '.webp' : ''; }
  function splitDose(label) {
    var m = String(label || '').match(/(\d+)\s*×\s*([\d–]+)\s*(.*)$/);
    if (!m) return { big: String(label || ''), unit: '' };
    return m[1] === '1' && /min/.test(m[3]) ? { big: m[2], unit: m[3] } : { big: m[1] + '×' + m[2], unit: m[3] };
  }
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  var ICON = {
    add: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    added: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg>',
    turn: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4h-4"/></svg>',
    pass: '<svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h9"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    fwd: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* How the explorer's figure is presented in the scene (read by the page's
     draw loop through window.PulseGuideStage while the scene is open). */
  // Long machines whose frame would crop off-screen keep the whole machine in view.
  var WIDE = ['legPress'];
  // Fly movements read best straight on (the reverse fly from behind, where its muscles are).
  var SQUARE = { pecDeck: { yaw: -10, pitch: 16 }, cableFly: { yaw: -10, pitch: 16 }, reverseDeck: { yaw: 170, pitch: 18 } };
  // Cardio and slow core moves keep an even rhythm; everything else uses the training tempo.
  var LOOP = ['treadmill', 'bike', 'elliptical', 'stepper', 'farmerCarry', 'deadBug', 'birdDog'];
  function ease(x) { return x * x * (3 - 2 * x); }

  function init() {
    var ui = window.PulseGuideUI, explore = window.PulseExplore;
    if (!ui || !explore || !$('studio-stage')) return;
    var all = explore.exercises;

    var root = el('div', 'st-root'); root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Övningar för vald muskel');
    root.hidden = true;
    // The muscle's artwork as the wall above the figure: a background image so
    // every browser covers the full width the same way.
    var art = el('div', 'st-art'); art.setAttribute('aria-hidden', 'true');
    var heroCopy = el('div', 'st-hero');
    var stageHost = el('div', 'st-stage');
    var poster = el('img', 'st-poster'); poster.alt = ''; poster.setAttribute('aria-hidden', 'true');
    stageHost.appendChild(poster);
    stageHost.appendChild($('studio-stage'));
    var touch = el('div', 'st-touch'); touch.setAttribute('aria-hidden', 'true');
    var top = el('div', 'st-top');
    var close = el('button', 'st-close', ICON.back); close.type = 'button'; close.setAttribute('aria-label', 'Tillbaka till kroppen');
    close.addEventListener('click', function () { leave(); });
    var counter = el('div', 'st-title');
    top.appendChild(close); top.appendChild(counter);
    var info = el('div', 'st-info');
    var rail = el('div', 'st-rail');
    var pauseMark = el('div', 'st-pause', '<span></span><span></span>'); pauseMark.setAttribute('aria-hidden', 'true');
    var burst = el('div', 'st-burst'); burst.setAttribute('aria-hidden', 'true');
    var end = el('div', 'st-end'); end.hidden = true;
    var navPrev = el('button', 'st-nav is-prev', ICON.back), navNext = el('button', 'st-nav is-next', ICON.fwd);
    navPrev.type = navNext.type = 'button';
    navPrev.setAttribute('aria-label', 'Föregående övning'); navNext.setAttribute('aria-label', 'Nästa övning');
    navPrev.addEventListener('click', function (event) { event.stopPropagation(); prev(); });
    navNext.addEventListener('click', function (event) { event.stopPropagation(); next(); });
    [stageHost, art, touch, pauseMark, burst, top, info, rail, end, heroCopy, navPrev, navNext].forEach(function (n) { root.appendChild(n); });
    document.body.appendChild(root);

    function railButton(key, label, onClick) {
      var b = el('button', 'st-rail-btn', '<span class="st-ico">' + ICON[key] + '</span><small>' + label + '</small>');
      b.type = 'button'; b.setAttribute('aria-label', label); b.dataset.action = key;
      b.addEventListener('click', function (event) { event.stopPropagation(); onClick(); });
      rail.appendChild(b); return b;
    }
    railButton('info', 'Teknik', function () { openSheet('technique'); });
    railButton('turn', 'Vinkel', function () { ui.view(); });
    var addBtn = railButton('add', 'Välj', function () { choose(); });
    var passBtn = railButton('pass', 'Mitt pass', function () { openSheet('pass'); });
    railButton('play', 'Program', function () { openSheet('programs'); });

    /* ---- What plays: a muscle's exercises, or a programme ---- */
    var state = { group: 'Bröst', program: null, list: [], index: 0 };
    // Exercises that mainly train the muscle come before those that only assist.
    function listFor(group) {
      return all.filter(function (e) { return e.muscles.indexOf(group) >= 0; })
        .sort(function (a, b) { return a.muscles.indexOf(group) - b.muscles.indexOf(group); })
        .map(function (e) { return e.id; });
    }
    function renderTitle() {
      counter.innerHTML = '<small>' + String(state.index + 1).padStart(2, '0') + ' / ' + state.list.length + '</small>' +
        (state.program ? '<button type="button" class="st-program-exit" data-exit-program aria-label="Avsluta programmet">' + ICON.close + '</button>' : '');
      var count = listFor(state.group).length;
      heroCopy.innerHTML = state.program
        ? '<span class="st-eyebrow">Program · ' + state.group + '</span><h1>' + state.program.name + '</h1><p>' + state.program.ids.length + ' övningar · ' + explore.durationLabel(state.program) + '</p>'
        : '<span class="st-eyebrow">Muskelgrupp</span><h1>' + state.group + '</h1><p>' + count + (count === 1 ? ' övning' : ' övningar') + '</p>';
    }
    counter.addEventListener('click', function (event) { if (event.target.closest('[data-exit-program]')) playGroup(state.group); });
    function playGroup(group) { state.group = group; state.program = null; state.list = listFor(group); go(0); }
    function playProgram(program, at) { state.program = program; state.list = program.ids.slice(); go(at || 0); }

    function renderInfo() {
      var id = state.list[state.index], e = all[id];
      var dose = splitDose(explore.prescription(id, state.program || undefined).label);
      info.innerHTML = '<span class="st-eyebrow">' + e.equipment + ' · ' + e.muscles[0] + '</span><h2>' + e.name + '</h2>' +
        '<div class="st-dose"><strong>' + dose.big + '</strong><span>' + dose.unit + '</span></div>' +
        '<div class="st-muscles">' + e.muscles.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</div>';
      var src = pose(id, false);
      poster.hidden = !src; if (src) poster.src = src;
      syncChosen();
    }
    function syncChosen() {
      var id = state.list[state.index], on = ui.selection().indexOf(id) >= 0;
      addBtn.classList.toggle('is-on', on);
      addBtn.querySelector('small').textContent = on ? 'Vald' : 'Välj';
      passBtn.dataset.count = ui.selection().length || '';
    }
    /* Changing exercise: the figure and its text slide out a little, swap
       while hidden, then settle in from the other side. */
    var swapTimer = 0;
    function go(index) {
      var target = Math.max(0, Math.min(state.list.length - 1, index));
      if (!root.hidden && target !== state.index && !reduced()) {
        clearTimeout(swapTimer);
        root.classList.remove('is-swap-in', 'is-back');
        root.classList.toggle('is-back', target < state.index);
        root.classList.add('is-swap-out');
        state.index = target;
        swapTimer = setTimeout(function () {
          show(target);
          root.classList.remove('is-swap-out'); void root.offsetWidth; root.classList.add('is-swap-in');
        }, 170);
        return;
      }
      show(target);
    }
    function show(index) {
      end.hidden = true;
      state.index = index;
      ui.select(state.list[state.index]);
      renderInfo(); renderTitle();
      navPrev.hidden = state.index === 0;
      navNext.hidden = state.index === state.list.length - 1 && !state.program;
      if (!sheetOpen) ui.setPaused(false);
      syncPause();
    }
    function next() {
      if (state.index < state.list.length - 1) go(state.index + 1);
      else if (state.program) showEnd();
    }
    function prev() { go(state.index - 1); }
    function showEnd() {
      ui.setPaused(true); syncPause();
      var p = state.program;
      end.innerHTML = '<span class="st-eyebrow">Programmet är slut</span><h2>' + p.name + '</h2><p>' + p.ids.length + ' övningar · ' + explore.durationLabel(p) + '</p>' +
        '<button type="button" class="st-cta st-start" data-train>' + ICON.play + '<span>Träna programmet</span></button><button type="button" class="st-ghost" data-again>Spela igen</button>';
      end.hidden = false;
    }
    end.addEventListener('click', function (event) {
      if (event.target.closest('[data-train]')) train(state.program);
      if (event.target.closest('[data-again]')) go(0);
    });
    function syncPause() { root.classList.toggle('is-paused', ui.paused() && end.hidden); }
    new MutationObserver(syncPause).observe($('pause'), { attributes: true, attributeFilter: ['aria-pressed'] });
    new MutationObserver(function () { syncChosen(); renderPassSheet(); }).observe($('living-pass-count'), { childList: true, characterData: true, subtree: true });

    function choose() {
      var id = state.list[state.index], had = ui.selection().indexOf(id) >= 0;
      ui.toggle(id);
      burst.className = 'st-burst'; void burst.offsetWidth;
      burst.className = 'st-burst ' + (had ? 'is-removed' : 'is-added');
      burst.textContent = had ? 'Borttagen' : '+ Mitt pass';
    }

    /* ---- Gestures ---- */
    var start = null, tapTimer = 0, lastTap = 0;
    touch.addEventListener('pointerdown', function (event) { start = { x: event.clientX, y: event.clientY, t: Date.now() }; touch.setPointerCapture(event.pointerId); });
    touch.addEventListener('pointerup', function (event) {
      if (!start) return;
      var dx = event.clientX - start.x, dy = event.clientY - start.y, s = start; start = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) { hideHint(); (dx < 0 ? next : prev)(); return; }
      if (dy < -60 && Math.abs(dy) > Math.abs(dx) * 1.2) { hideHint(); openSheet('technique'); return; }
      if (dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.2) { hideHint(); leave(); return; }
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12 || Date.now() - s.t > 450) return;
      var now = Date.now();
      if (now - lastTap < 300) { clearTimeout(tapTimer); lastTap = 0; hideHint(); choose(); return; }
      lastTap = now;
      tapTimer = setTimeout(function () { lastTap = 0; hideHint(); ui.setPaused(!ui.paused()); }, 300);
    });
    touch.addEventListener('pointercancel', function () { start = null; });
    document.addEventListener('keydown', function (event) {
      if (root.hidden) return;
      if (zoomed) { if (event.key === 'Escape') closeZoom(); return; }
      if (sheetOpen) { if (event.key === 'Escape') closeSheet(); return; }
      if (event.key === 'ArrowRight') next(); else if (event.key === 'ArrowLeft') prev();
      else if (event.key === 'Escape') leave();
      else if (event.key === ' ') { event.preventDefault(); ui.setPaused(!ui.paused()); }
    });

    var HINT_KEY = 'pulse-gym-hint-v1', hint = null, seen = false;
    try { seen = localStorage.getItem(HINT_KEY) === '1'; } catch (_) {}
    function showHint() {
      if (seen) return;
      seen = true;
      hint = el('div', 'st-hint', '<span><b>← →</b>övning</span><span><b>↑</b>teknik</span><span><b>Tryck</b>paus</span><span><b>Dubbeltryck</b>välj</span>');
      hint.setAttribute('role', 'note'); root.appendChild(hint); setTimeout(hideHint, 6500);
    }
    function hideHint() {
      if (!hint) return; var h = hint; hint = null; h.classList.add('is-gone'); setTimeout(function () { h.remove(); }, 400);
      try { localStorage.setItem(HINT_KEY, '1'); } catch (_) {}
    }

    /* ---- Sheets: technique, Mitt pass, programmes ---- */
    var scrim = el('div', 'st-scrim'); scrim.hidden = true;
    var sheet = el('div', 'st-sheet'); sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
    root.appendChild(scrim); root.appendChild(sheet);
    var sheetOpen = false, sheetKind = '', viewing = null;
    function renderPassSheet() {
      if (sheetKind !== 'pass') return;
      var ids = ui.selection();
      sheet.innerHTML = '<div class="st-grip"></div><span class="st-eyebrow">Ditt urval</span><h3>Mitt pass <em>' + ids.length + '</em></h3>' +
        (ids.length ? '<ul class="st-pass">' + ids.map(function (id) {
          var d = splitDose(explore.prescription(id).label);
          return '<li><img src="' + (pose(id, true) || 'assets/atlas-art-v1/chest.webp') + '" alt=""><span><b>' + all[id].name + '</b><small>' + d.big + ' ' + d.unit + '</small></span><button type="button" data-remove="' + id + '" aria-label="Ta bort ' + all[id].name + '">×</button></li>';
        }).join('') + '</ul><button type="button" class="st-cta" data-copy-pass>Kopiera passförslag ↗</button>'
          : '<p class="st-muted">Dubbeltryck på en övning för att lägga till den.</p>');
    }
    function openSheet(kind) {
      sheetKind = kind; sheetOpen = true; viewing = null; sheet.classList.remove('is-program');
      if (kind === 'technique') {
        sheet.setAttribute('aria-label', 'Teknik');
        sheet.innerHTML = '<div class="st-grip"></div><span class="st-eyebrow">Teknik</span><h3>' + all[state.list[state.index]].name + '</h3><ol class="st-steps">' + $('steps').innerHTML + '</ol><div class="st-tip">' + $('tip').innerHTML + '</div>';
      } else if (kind === 'pass') {
        sheet.setAttribute('aria-label', 'Mitt pass'); renderPassSheet();
      } else {
        sheet.setAttribute('aria-label', 'Program');
        var programs = explore.programs.filter(function (p) { return p.ids.some(function (id) { return all[id].muscles.indexOf(state.group) >= 0; }); });
        sheet.innerHTML = '<div class="st-grip"></div><span class="st-eyebrow">Program</span><h3>Program för ' + state.group.toLowerCase() + '</h3><div class="st-programs">' + programs.map(function (p) {
          var still = p.ids.filter(function (id) { return POSES.indexOf(id) >= 0; })[0];
          return '<button type="button" class="st-program" data-program="' + p.id + '"><span class="st-program-art">' + (still != null ? '<img src="' + pose(still, true) + '" alt="">' : '') +
            '</span><span class="st-program-copy"><b>' + p.name + '</b><small>' + p.ids.length + ' övningar · ' + explore.durationLabel(p) + '</small></span><span class="st-program-play">' + ICON.fwd + '</span></button>';
        }).join('') + '</div>';
      }
      scrim.hidden = false; sheet.hidden = false;
      requestAnimationFrame(function () { root.classList.add('sheet-open'); });
      sheet.tabIndex = -1; sheet.focus({ preventScroll: true });
    }
    /* A programme before it plays: its exercises as stops on a glowing road.
       Tap a figure to see it live, a name to play from there, or train the
       whole programme. */
    function showProgram(p) {
      viewing = p;
      // The scene is fully covered: let the figure rest until it shows again.
      ui.setPaused(true);
      sheet.setAttribute('aria-label', p.name);
      sheet.classList.add('is-program');
      sheet.innerHTML = '<button type="button" class="st-sheet-back" data-programs>' + ICON.back + '<span>Program</span></button>' +
        '<span class="st-eyebrow">' + p.ids.length + ' övningar · ' + explore.durationLabel(p) + '</span><h3>' + p.name + '</h3>' +
        '<ol class="st-path">' + p.ids.map(function (id, i) {
          var d = splitDose(explore.prescription(id, p).label), a = pose(id, false), b = pose(id, true);
          return '<li class="st-stop' + (i % 2 ? ' is-right' : '') + '" style="--i:' + i + '">' +
            '<button type="button" class="st-stop-pad" data-zoom="' + i + '" aria-label="Visa ' + all[id].name + ' animerad"><span class="st-stop-tile"></span>' + (a ? '<img class="is-a" src="' + a + '" alt="" loading="lazy"><img class="is-b" src="' + b + '" alt="" loading="lazy">' : '') +
            '<span class="st-stop-num">' + (i + 1) + '</span></button>' +
            '<button type="button" class="st-stop-copy" data-start-at="' + i + '" aria-label="Spela upp från ' + all[id].name + '"><small class="st-eyebrow">' + all[id].muscles[0] + '</small><b>' + all[id].name + '</b><span>' + d.big + ' ' + d.unit + '</span></button></li>';
        }).join('') + '</ol>' +
        '<button type="button" class="st-cta st-start" data-train>' + ICON.play + '<span>Träna programmet</span></button>';
      sheet.scrollTop = 0;
      requestAnimationFrame(function () { drawRoad(sheet.querySelector('.st-path')); });
    }
    /* The glowing road through the stops: a smooth curve from pad to pad with
       a dark road bed, a soft glow, the drawn-in line and a travelling light. */
    function drawRoad(list) {
      if (!list) return;
      var box = list.getBoundingClientRect(), pts = [].map.call(list.querySelectorAll('.st-stop-tile'), function (t) {
        var r = t.getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
      });
      if (pts.length < 2) return;
      var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], h = (b[1] - a[1]) * 0.55;
        d += ' C' + a[0].toFixed(1) + ' ' + (a[1] + h).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + (b[1] - h).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
      }
      list.insertAdjacentHTML('afterbegin', '<svg class="st-road" width="' + box.width + '" height="' + box.height + '" viewBox="0 0 ' + box.width + ' ' + box.height + '" aria-hidden="true">' +
        '<defs><linearGradient id="st-road-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a48"/><stop offset="1" stop-color="#ff8a5a"/></linearGradient></defs>' +
        '<path class="st-road-bed" d="' + d + '"/><path class="st-road-edge" d="' + d + '"/><path class="st-road-glow" d="' + d + '"/>' +
        '<path class="st-road-line" pathLength="100" d="' + d + '"/></svg>' +
        // The travelling light lives in its own layer without filters, so the
        // blurred road never has to be redrawn while it moves.
        '<svg class="st-road" width="' + box.width + '" height="' + box.height + '" viewBox="0 0 ' + box.width + ' ' + box.height + '" aria-hidden="true">' +
        '<path class="st-road-spark is-halo" pathLength="100" d="' + d + '"/><path class="st-road-spark" pathLength="100" d="' + d + '"/></svg>');
    }
    /* A figure on the road lifted out as the live animated figure: the
       explorer's stage moves into a full-screen view and back on close. */
    var zoom = el('div', 'st-zoom'); zoom.hidden = true; zoom.setAttribute('role', 'dialog'); zoom.setAttribute('aria-modal', 'true');
    root.appendChild(zoom);
    var zoomed = null;
    function openZoom(p, i, from) {
      var id = p.ids[i], e = all[id], d = splitDose(explore.prescription(id, p).label);
      zoomed = { p: p, i: i };
      zoom.setAttribute('aria-label', e.name);
      zoom.innerHTML = '<div class="st-zoom-stage"></div>' +
        '<button type="button" class="st-zoom-close" data-zoom-close aria-label="Stäng">' + ICON.close + '</button>' +
        '<div class="st-zoom-copy"><span class="st-eyebrow">Steg ' + (i + 1) + ' av ' + p.ids.length + ' · ' + e.muscles[0] + '</span><h2>' + e.name + '</h2><div class="st-dose"><strong>' + d.big + '</strong><span>' + d.unit + '</span></div>' +
        '<button type="button" class="st-cta st-start" data-start-at="' + i + '">' + ICON.play + '<span>Spela upp härifrån</span></button></div>';
      zoom.querySelector('.st-zoom-stage').appendChild($('studio-stage'));
      ui.select(id); ui.setPaused(false);
      zoom.hidden = false;
      var r = from.getBoundingClientRect();
      if (zoom.animate && !reduced()) {
        var cx = r.left + r.width / 2 - innerWidth / 2, cy = r.top + r.height / 2 - innerHeight / 2;
        zoom.animate([{ transform: 'translate(' + cx + 'px,' + cy + 'px) scale(' + Math.max(r.width / innerWidth, .2) + ')', opacity: 0, borderRadius: '40px' }, { transform: 'none', opacity: 1, borderRadius: '0' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    }
    function closeZoom(keep) {
      if (!zoomed) return;
      stageHost.appendChild($('studio-stage'));
      zoom.hidden = true; zoom.innerHTML = '';
      // Back on the road the scene shows its own exercise again, resting under the road.
      if (!keep) { ui.select(state.list[state.index]); if (viewing) ui.setPaused(true); }
      zoomed = null;
    }
    zoom.addEventListener('click', function (event) {
      var t = event.target;
      if (t.closest('[data-zoom-close]')) { closeZoom(); return; }
      var startAt = t.closest('[data-start-at]');
      if (startAt) { var chosen = zoomed.p, at = Number(startAt.dataset.startAt); closeZoom(true); closeSheet(); playProgram(chosen, at); }
    });
    /* Training a programme: hand it to the training page, where the ordinary
       pass builder opens for today with these exercises (pulse-explore-handoff.js)
       and starts training mode from there. */
    function train(p) {
      try { sessionStorage.setItem(explore.transferKey, JSON.stringify({ version: 1, programId: p.id })); }
      catch (e) { ui.copyProgram(p.id); return; }
      var url = new URL($('explore-back').getAttribute('href'), location.href);
      url.searchParams.set('explore', '1');
      if (new URLSearchParams(location.search).get('user') === 'maja') url.searchParams.set('user', 'maja');
      location.href = url.href;
    }
    function closeSheet() {
      closeZoom();
      if (viewing && !root.hidden && end.hidden) ui.setPaused(false);
      viewing = null; sheet.classList.remove('is-program');
      sheetOpen = false; sheetKind = ''; root.classList.remove('sheet-open');
      setTimeout(function () { if (!sheetOpen) { scrim.hidden = true; sheet.hidden = true; } }, 280);
    }
    scrim.addEventListener('click', closeSheet);
    sheet.addEventListener('click', function (event) {
      var t = event.target;
      if (t.closest('.st-grip')) { closeSheet(); return; }
      var remove = t.closest('[data-remove]'); if (remove) { ui.toggle(Number(remove.dataset.remove)); return; }
      if (t.closest('[data-copy-pass]')) { ui.copySelection(); return; }
      if (t.closest('[data-programs]')) { openSheet('programs'); return; }
      if (t.closest('[data-train]') && viewing) { train(viewing); return; }
      var zoomAt = t.closest('[data-zoom]');
      if (zoomAt && viewing) { openZoom(viewing, Number(zoomAt.dataset.zoom), zoomAt); return; }
      var startAt = t.closest('[data-start-at]');
      if (startAt && viewing) { var chosen = viewing; closeSheet(); playProgram(chosen, Number(startAt.dataset.startAt)); return; }
      var program = t.closest('[data-program]');
      if (program) showProgram(explore.programs.find(function (x) { return x.id === program.dataset.program; }));
    });
    var sheetY = null;
    sheet.addEventListener('pointerdown', function (event) { if (event.target.closest('.st-grip')) sheetY = event.clientY; });
    sheet.addEventListener('pointerup', function (event) { if (sheetY != null && event.clientY - sheetY > 50) closeSheet(); sheetY = null; });

    /* ---- The figure inside the scene ---- */
    var lastPhase = 0;
    // Training tempo over the explorer's 4.4 s cycle: ~1 s lift, a short
    // squeeze, ~2 s controlled lowering, a breath at the bottom. Each lift
    // pulses the dose so the reps read as reps.
    function tempo(phase, kind) {
      if (LOOP.indexOf(kind) >= 0) return (1 - Math.cos(phase * Math.PI * 2)) / 2;
      if (lastPhase < 0.23 && phase >= 0.23) pulseRep();
      lastPhase = phase;
      if (phase < 0.23) return ease(phase / 0.23);
      if (phase < 0.32) return 1;
      if (phase < 0.77) return 1 - ease((phase - 0.32) / 0.45);
      return 0;
    }
    function pulseRep() {
      var dose = info.querySelector('.st-dose strong');
      if (!dose) return;
      dose.classList.remove('is-rep'); void dose.offsetWidth; dose.classList.add('is-rep');
    }
    var stage = {
      // Framed on the body alone and to the stage's real shape, so every
      // exercise shows the person at the same, large size.
      fill: 0.76,
      figureOnly: function (kind) { return WIDE.indexOf(kind) < 0; },
      pilotDistance: 1.25,
      tempo: tempo,
      // The working muscle glows with the effort: dim at rest, brightest at the squeeze.
      activation: function (t, kind) { return LOOP.indexOf(kind) >= 0 ? 1 : 0.3 + t; },
      view: function (kind, base, index) { return index === 0 && SQUARE[kind] ? SQUARE[kind] : base; }
    };

    /* ---- Opened for one muscle by the body, closed back to it ---- */
    var onLeave = null;
    function enter(group, id, wall) {
      window.PulseGuideStage = stage;
      state.group = group; state.program = null; state.list = listFor(group);
      root.hidden = false;
      root.classList.remove('is-entering', 'is-flip', 'is-preparing');
      // Growing from a muscle: stay see-through until the artwork is decoded, so
      // the body never gives way to an empty dark frame.
      if (wall && wall.from && !reduced()) root.classList.add('is-preparing');
      if (wall && wall.src) {
        var image = new Image();
        var play = function () {
          art.style.backgroundImage = 'url("' + wall.src + '")';
          art.style.backgroundPosition = wall.focus || '50% 50%';
          void root.offsetWidth;
          if (wall.from && art.animate && !reduced()) grow(wall.from);
          else root.classList.add('is-entering');
        };
        image.src = wall.src;
        if (image.decode) image.decode().then(play, play); else image.onload = play;
      }
      state.index = -1;
      show(Math.max(0, state.list.indexOf(id != null ? id : ui.active())));
      close.focus({ preventScroll: true });
      setTimeout(showHint, 900);
    }
    /* The artwork is born from the tapped muscle: it starts as a glowing tile
       where the muscle sat on the body and opens out into the wall; then the
       figure rises from below and the text follows. */
    function grow(from) {
      var box = art.getBoundingClientRect();
      var size = Math.max(from.width / box.width, from.height / box.height, 0.12);
      var dx = from.left + from.width / 2 - (box.left + box.width / 2), dy = from.top + from.height / 2 - (box.top + box.height / 2);
      var curve = 'cubic-bezier(.2,.8,.2,1)';
      root.classList.add('is-flip'); root.classList.remove('is-preparing');
      root.animate([{ backgroundColor: 'rgba(5,7,11,0)' }, { backgroundColor: 'rgb(5,7,11)' }], { duration: 380, easing: 'ease-out' });
      art.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + size + ')', borderRadius: '50%', filter: 'brightness(1.8) saturate(1.4) drop-shadow(0 0 30px #ff4a3a)', opacity: 0.6 },
        { borderRadius: '28px', filter: 'brightness(1.3) saturate(1.2) drop-shadow(0 0 18px #ff4a3a88)', opacity: 1, offset: 0.55 },
        { transform: 'none', borderRadius: '0', filter: 'none', opacity: 1 }
      ], { duration: 720, easing: curve, fill: 'backwards' });
      var rise = function (node, delay, y) {
        if (node) node.animate([{ opacity: 0, translate: '0 ' + y + 'px' }, { opacity: 1, translate: '0 0' }], { duration: 520, delay: delay, easing: curve, fill: 'backwards' });
      };
      stageHost.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: 120, easing: 'ease-out', fill: 'backwards' });
      rise($('studio-stage'), 260, 60); rise(poster, 260, 60);
      rise(heroCopy, 420, 10); rise(top, 480, -8); rise(info, 540, 12); rise(rail, 620, 16);
      rise(navPrev, 620, 0); rise(navNext, 620, 0);
      setTimeout(function () { root.classList.remove('is-flip'); }, 1200);
    }
    function leave(silent) {
      if (root.hidden) return;
      if (sheetOpen) closeSheet();
      ui.setPaused(true);
      root.hidden = true; root.classList.remove('is-entering');
      if (window.PulseGuideStage === stage) delete window.PulseGuideStage;
      if (!silent && onLeave) onLeave();
    }
    window.PulseGymScene = { enter: enter, leave: leave, isOpen: function () { return !root.hidden; }, onLeave: function (fn) { onLeave = fn; } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
