/* Full-screen exercise scene around the live animated figure, used by two
   previews of the exercise explorer:
   ?ui=stories  Auto-advancing stories with muscle tabs: swipe up/down for
                the next/previous exercise, sideways for the next muscle.
   ?ui=gym      Opened from the muscle map (pulse-map-ui.js) for one muscle,
                its artwork above the figure: swipe sideways between its
                exercises, up for technique, down to return to the body.
   Both: tap to pause, double tap to choose, programmes play as playlists.
   The page's own stage, selection and transfer are reused through
   PulseGuideUI, so the default UI is untouched without a flag. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var flags = (params.get('ui') || '').split(',');
  var GYM = flags.indexOf('gym') >= 0;
  if (!GYM && flags.indexOf('stories') < 0) return;
  document.documentElement.classList.add(GYM ? 'ui-gym' : 'ui-stories');

  var POSES = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,21,22,23,25,26,30,34,35,43,44,45,52];
  var GROUPS = ['Alla', 'Bröst', 'Axlar', 'Rygg', 'Biceps', 'Triceps', 'Mage', 'Framsida lår', 'Säte', 'Baksida lår', 'Vader'];
  var STORY_MS = 9000;
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function pose(id, end) { return POSES.indexOf(Number(id)) >= 0 ? 'assets/exercise-poses-v1/' + String(id).padStart(2, '0') + (end ? '-end' : '-start') + '.webp' : ''; }
  function splitDose(label) {
    var m = String(label || '').match(/(\d+)\s*×\s*([\d–]+)\s*(.*)$/);
    if (!m) return { big: String(label || ''), unit: '' };
    return m[1] === '1' && /min/.test(m[3]) ? { big: m[2], unit: m[3] } : { big: m[1] + '×' + m[2], unit: m[3] };
  }
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

  function init() {
    var ui = window.PulseGuideUI, explore = window.PulseExplore;
    if (!ui || !explore) return;
    var all = explore.exercises;
    // The figure animates only while the explorer's own exercise view is open;
    // in gym mode the muscle map opens it (PulseGuideUI.openMuscleExercise).
    if (!GYM && ($('guide-page').hidden || document.body.classList.contains('exercise-list-open'))) $('living-dock').querySelector('[data-page="guide"]').click();

    var root = el('div', 'st-root' + (GYM ? ' is-gym' : '')); root.setAttribute('role', 'region'); root.setAttribute('aria-label', GYM ? 'Övningar för vald muskel' : 'Övningar som stories');
    if (GYM) root.hidden = true;
    // Gym mode: the muscle's artwork as the wall above the figure. A background
    // image (not <img>) so every browser covers the full width the same way.
    var art = el('div', 'st-art'); art.setAttribute('aria-hidden', 'true');
    var heroCopy = el('div', 'st-hero');
    var stageHost = el('div', 'st-stage');
    var poster = el('img', 'st-poster'); poster.alt = ''; poster.setAttribute('aria-hidden', 'true');
    stageHost.appendChild(poster);
    stageHost.appendChild($('studio-stage'));
    var touch = el('div', 'st-touch'); touch.setAttribute('aria-hidden', 'true');
    var top = el('div', 'st-top');
    var bars = el('div', 'st-bars');
    var tabs = el('div', 'st-tabs');
    var close = GYM ? el('button', 'st-close', ICON.back) : el('a', 'st-close', ICON.close);
    if (GYM) { close.type = 'button'; close.setAttribute('aria-label', 'Tillbaka till kroppen'); close.addEventListener('click', function () { leave(); }); }
    else { close.href = $('explore-back').getAttribute('href'); close.setAttribute('aria-label', 'Till träningen'); }
    top.appendChild(bars); top.appendChild(el('div', 'st-toprow')); top.lastChild.appendChild(close); top.lastChild.appendChild(tabs);
    var info = el('div', 'st-info');
    var rail = el('div', 'st-rail');
    var pauseMark = el('div', 'st-pause', '<span></span><span></span>'); pauseMark.setAttribute('aria-hidden', 'true');
    var burst = el('div', 'st-burst'); burst.setAttribute('aria-hidden', 'true');
    var end = el('div', 'st-end'); end.hidden = true;
    // Gym mode: quiet chevrons on the stage edges replace the swipe hint.
    var navPrev = el('button', 'st-nav is-prev', ICON.back), navNext = el('button', 'st-nav is-next', ICON.fwd);
    navPrev.type = navNext.type = 'button';
    navPrev.setAttribute('aria-label', 'Föregående övning'); navNext.setAttribute('aria-label', 'Nästa övning');
    navPrev.addEventListener('click', function (event) { event.stopPropagation(); prev(); });
    navNext.addEventListener('click', function (event) { event.stopPropagation(); next(); });
    [stageHost, art, touch, pauseMark, burst, top, info, rail, end].concat(GYM ? [heroCopy, navPrev, navNext] : []).forEach(function (n) { root.appendChild(n); });
    document.body.appendChild(root);

    function railButton(key, label, onClick) {
      var b = el('button', 'st-rail-btn', '<span class="st-ico">' + ICON[key] + '</span><small>' + label + '</small>');
      b.type = 'button'; b.setAttribute('aria-label', label);
      b.addEventListener('click', function (event) { event.stopPropagation(); onClick(); });
      rail.appendChild(b); return b;
    }
    var addBtn = railButton('add', 'Välj', function () { choose(); });
    addBtn.classList.add('is-primary');
    railButton('info', 'Teknik', function () { openSheet('technique'); });
    railButton('turn', 'Vinkel', function () { ui.view(); });
    var passBtn = railButton('pass', 'Mitt pass', function () { openSheet('pass'); });
    railButton('play', 'Program', function () { openSheet('programs'); });

    /* ---- Playlists: a muscle group, or a programme ---- */
    var state = { group: 'Alla', program: null, list: [], index: 0, started: 0, elapsed: 0 };
    function listFor(group) {
      var list = all.filter(function (e) { return group === 'Alla' || e.muscles.indexOf(group) >= 0; });
      // Gym mode: exercises that mainly train the muscle come before those that only assist.
      if (GYM && group !== 'Alla') list = list.slice().sort(function (a, b) { return a.muscles.indexOf(group) - b.muscles.indexOf(group); });
      return list.map(function (e) { return e.id; });
    }
    function renderTabs() {
      if (GYM) {
        tabs.innerHTML = '<div class="st-title"><b>' + (state.program ? state.program.name : state.group) + '</b><small>' + String(state.index + 1).padStart(2, '0') + ' / ' + state.list.length + '</small></div>' +
          (state.program ? '<button type="button" class="st-tab st-program-tab is-on" data-exit-program aria-label="Avsluta programmet">' + ICON.close + '</button>' : '');
        var count = listFor(state.group).length;
        heroCopy.innerHTML = state.program
          ? '<span class="st-eyebrow">Program · ' + state.group + '</span><h1>' + state.program.name + '</h1><p>' + state.program.ids.length + ' övningar · ' + explore.durationLabel(state.program) + '</p>'
          : '<span class="st-eyebrow">Muskelgrupp</span><h1>' + state.group + '</h1><p>' + count + (count === 1 ? ' övning' : ' övningar') + '</p>';
        return;
      }
      tabs.innerHTML = (state.program
        ? '<button type="button" class="st-tab is-on st-program-tab" data-exit-program>▶ ' + state.program.name + ' <span aria-hidden="true">×</span></button>'
        : GROUPS.map(function (g) { return '<button type="button" class="st-tab' + (g === state.group ? ' is-on' : '') + '" data-group="' + g + '">' + (g === 'Alla' ? 'För dig' : g) + '</button>'; }).join(''));
      var on = tabs.querySelector('.is-on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
    tabs.addEventListener('click', function (event) {
      var b = event.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-exit-program')) { playGroup(state.group); return; }
      playGroup(b.dataset.group);
    });
    function playGroup(group) { state.group = group; state.program = null; state.list = listFor(group); go(0); renderTabs(); }
    function playProgram(program) { state.program = program; state.list = program.ids.slice(); go(0); renderTabs(); }

    function renderBars() {
      var n = state.list.length;
      bars.classList.toggle('is-static', GYM);
      if (n <= 16) bars.innerHTML = state.list.map(function (_, i) { return '<span class="' + (i < state.index ? 'is-done' : i === state.index ? 'is-now' : '') + '"><i></i></span>'; }).join('');
      else bars.innerHTML = '<span class="st-bar-long is-now"><i></i></span><em>' + String(state.index + 1).padStart(2, '0') + ' / ' + n + '</em>';
      bars.style.setProperty('--story-ms', STORY_MS + 'ms');
    }
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
      addBtn.querySelector('.st-ico').innerHTML = on ? ICON.added : ICON.add;
      addBtn.querySelector('small').textContent = on ? 'Vald' : 'Välj';
      var n = ui.selection().length;
      passBtn.querySelector('small').textContent = n ? 'Mitt pass · ' + n : 'Mitt pass';
      passBtn.dataset.count = n || '';
    }
    /* Gym mode: the figure and its text slide out a little toward where they
       came from, swap while hidden, then settle in from the other side. */
    var swapTimer = 0;
    function go(index) {
      var target = Math.max(0, Math.min(state.list.length - 1, index));
      if (GYM && !root.hidden && target !== state.index && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
      state.index = Math.max(0, Math.min(state.list.length - 1, index));
      state.elapsed = 0; state.started = performance.now();
      ui.select(state.list[state.index]);
      renderBars(); renderInfo();
      if (GYM) { renderTabs(); navPrev.hidden = state.index === 0; navNext.hidden = state.index === state.list.length - 1 && !state.program; }
      if (!GYM) { root.classList.remove('is-next'); void root.offsetWidth; root.classList.add('is-next'); }
      if (!sheetOpen) ui.setPaused(false);
      sync();
    }
    function next() {
      if (state.index < state.list.length - 1) go(state.index + 1);
      else if (state.program) showEnd();
      else if (!GYM) go(0);
    }
    function prev() { go(state.index - 1); }
    function stepGroup(dir) {
      if (GYM || state.program) return;
      var i = GROUPS.indexOf(state.group);
      playGroup(GROUPS[(i + dir + GROUPS.length) % GROUPS.length]);
    }
    function showEnd() {
      ui.setPaused(true); sync();
      var p = state.program;
      end.innerHTML = '<span class="st-eyebrow">Programmet är slut</span><h2>' + p.name + '</h2><p>' + p.ids.length + ' övningar · ' + explore.durationLabel(p) + '</p>' +
        '<button type="button" class="st-cta" data-copy>Kopiera till passbyggaren ↗</button><button type="button" class="st-ghost" data-again>Spela igen</button>';
      end.hidden = false;
    }
    end.addEventListener('click', function (event) {
      if (event.target.closest('[data-copy]')) ui.copyProgram(state.program.id);
      if (event.target.closest('[data-again]')) go(0);
    });

    /* Auto-advance follows the page's pause state, so a paused figure also
       stops its story timer. */
    var timer = 0;
    function sync() {
      // Gym scenes have no timer: the bars only show the position.
      var paused = GYM || ui.paused() || sheetOpen || !end.hidden;
      root.classList.toggle('is-paused', ui.paused() && end.hidden);
      if (GYM) return;
      clearTimeout(timer);
      var now = performance.now();
      if (paused) { if (state.started) { state.elapsed += now - state.started; state.started = 0; } }
      else {
        if (!state.started) state.started = now;
        timer = setTimeout(next, Math.max(0, STORY_MS - state.elapsed));
      }
      bars.style.setProperty('--story-delay', -state.elapsed + 'ms');
      bars.classList.toggle('is-paused', paused);
      // Restart the running bar from the elapsed time so it matches the timer.
      var fill = bars.querySelector('.is-now i'); if (fill) fill.replaceWith(fill.cloneNode());
    }
    new MutationObserver(sync).observe($('pause'), { attributes: true, attributeFilter: ['aria-pressed'] });
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
      if (GYM) {
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) { hideHint(); (dx < 0 ? next : prev)(); return; }
        if (dy < -60 && Math.abs(dy) > Math.abs(dx) * 1.2) { hideHint(); openSheet('technique'); return; }
        if (dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.2) { hideHint(); leave(); return; }
      } else {
        if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.2) { hideHint(); (dy < 0 ? next : prev)(); return; }
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) { hideHint(); stepGroup(dx < 0 ? 1 : -1); return; }
      }
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12 || Date.now() - s.t > 450) return;
      var now = Date.now();
      if (now - lastTap < 300) { clearTimeout(tapTimer); lastTap = 0; hideHint(); choose(); return; }
      lastTap = now;
      tapTimer = setTimeout(function () { lastTap = 0; hideHint(); ui.setPaused(!ui.paused()); }, 300);
    });
    touch.addEventListener('pointercancel', function () { start = null; });
    document.addEventListener('keydown', function (event) {
      if (root.hidden) return;
      if (sheetOpen) { if (event.key === 'Escape') closeSheet(); return; }
      if (GYM) {
        if (event.key === 'ArrowRight') next(); else if (event.key === 'ArrowLeft') prev();
        else if (event.key === 'Escape') leave();
        else if (event.key === ' ') { event.preventDefault(); ui.setPaused(!ui.paused()); }
        return;
      }
      if (event.key === 'ArrowDown') next(); else if (event.key === 'ArrowUp') prev();
      else if (event.key === 'ArrowRight') stepGroup(1); else if (event.key === 'ArrowLeft') stepGroup(-1);
      else if (event.key === ' ') { event.preventDefault(); ui.setPaused(!ui.paused()); }
    });

    var HINT_KEY = GYM ? 'pulse-gym-hint-v1' : 'pulse-stories-hint-v1', hint = null, seen = false;
    try { seen = localStorage.getItem(HINT_KEY) === '1'; } catch (_) {}
    function showHint() {
      if (seen && params.get('hint') !== '1') return;
      seen = true;
      hint = el('div', 'st-hint', GYM
        ? '<span><b>← →</b>övning</span><span><b>↑</b>teknik</span><span><b>Tryck</b>paus</span><span><b>Dubbeltryck</b>välj</span>'
        : '<span><b>↑ ↓</b>övning</span><span><b>← →</b>muskel</span><span><b>Tryck</b>paus</span><span><b>Dubbeltryck</b>välj</span>');
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
    var sheetOpen = false, sheetKind = '';
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
      sheetKind = kind; sheetOpen = true;
      if (kind === 'technique') {
        sheet.setAttribute('aria-label', 'Teknik');
        sheet.innerHTML = '<div class="st-grip"></div><span class="st-eyebrow">Teknik</span><h3>' + all[state.list[state.index]].name + '</h3><ol class="st-steps">' + $('steps').innerHTML + '</ol><div class="st-tip">' + $('tip').innerHTML + '</div>';
      } else if (kind === 'pass') {
        sheet.setAttribute('aria-label', 'Mitt pass'); renderPassSheet();
      } else {
        sheet.setAttribute('aria-label', 'Program');
        var programs = GYM ? explore.programs.filter(function (p) { return p.ids.some(function (id) { return all[id].muscles.indexOf(state.group) >= 0; }); }) : explore.programs;
        sheet.innerHTML = '<div class="st-grip"></div><span class="st-eyebrow">Spela ett program</span><h3>' + (GYM ? 'Program för ' + state.group.toLowerCase() : 'Program') + '</h3><div class="st-programs">' + programs.map(function (p) {
          var stills = p.ids.filter(function (id) { return POSES.indexOf(id) >= 0; }).slice(0, 3);
          return '<button type="button" class="st-program" data-program="' + p.id + '"><span class="st-program-art">' + stills.map(function (id, i) { return '<img src="' + pose(id, true) + '" alt="" data-i="' + i + '">'; }).join('') +
            '</span><span class="st-program-copy"><b>' + p.name + '</b><small>' + p.ids.length + ' övningar · ' + explore.durationLabel(p) + '</small></span><span class="st-program-play">' + ICON.play + '</span></button>';
        }).join('') + '</div>';
      }
      scrim.hidden = false; sheet.hidden = false;
      requestAnimationFrame(function () { root.classList.add('sheet-open'); });
      sheet.tabIndex = -1; sheet.focus({ preventScroll: true });
      sync();
    }
    function closeSheet() {
      sheetOpen = false; sheetKind = ''; root.classList.remove('sheet-open');
      setTimeout(function () { if (!sheetOpen) { scrim.hidden = true; sheet.hidden = true; } }, 280);
      sync();
    }
    scrim.addEventListener('click', closeSheet);
    sheet.addEventListener('click', function (event) {
      var t = event.target;
      if (t.closest('.st-grip')) { closeSheet(); return; }
      var remove = t.closest('[data-remove]'); if (remove) { ui.toggle(Number(remove.dataset.remove)); return; }
      if (t.closest('[data-copy-pass]')) { ui.copySelection(); return; }
      var program = t.closest('[data-program]');
      if (program) { var p = explore.programs.find(function (x) { return x.id === program.dataset.program; }); closeSheet(); playProgram(p); }
    });
    var sheetY = null;
    sheet.addEventListener('pointerdown', function (event) { if (event.target.closest('.st-grip')) sheetY = event.clientY; });
    sheet.addEventListener('pointerup', function (event) { if (sheetY != null && event.clientY - sheetY > 50) closeSheet(); sheetY = null; });

    /* Gym mode: opened for one muscle by the muscle map, closed back to it. */
    var onLeave = null;
    /* How the explorer's figure is presented inside the scene: framed on the
       body alone so every exercise shows the person at the same size. */
    var preview = { fill: 0.76, figureOnly: function (kind) { return WIDE.indexOf(kind) < 0; }, pilotDistance: 1.25, tempo: tempo, activation: activation, view: view };
    // Fly movements read best straight on: both arms sweep symmetrically
    // (the reverse fly from behind, where its muscles are).
    var SQUARE = { pecDeck: { yaw: -10, pitch: 16 }, cableFly: { yaw: -10, pitch: 16 }, reverseDeck: { yaw: 170, pitch: 18 } };
    function view(kind, base, index) { return index === 0 && SQUARE[kind] ? SQUARE[kind] : base; }
    /* Training tempo for strength moves over the explorer's 4.4 s cycle:
       ~1 s lift, a short squeeze, ~2 s controlled lowering, a breath at the
       bottom. Cardio and slow core moves keep their even rhythm. Each lift
       pulses the dose so the reps read as reps. */
    // Long machines whose frame would crop off-screen keep the whole machine in view.
    var WIDE = ['legPress'];
    var LOOP = ['treadmill', 'bike', 'elliptical', 'stepper', 'farmerCarry', 'deadBug', 'birdDog'];
    var lastPhase = 0;
    function ease(x) { return x * x * (3 - 2 * x); }
    function tempo(phase, kind) {
      if (LOOP.indexOf(kind) >= 0) return (1 - Math.cos(phase * Math.PI * 2)) / 2;
      if (lastPhase < 0.23 && phase >= 0.23) pulseRep();
      lastPhase = phase;
      if (phase < 0.23) return ease(phase / 0.23);
      if (phase < 0.32) return 1;
      if (phase < 0.77) return 1 - ease((phase - 0.32) / 0.45);
      return 0;
    }
    // The working muscle glows with the effort: dim at rest, brightest at the squeeze.
    function activation(t, kind) { return LOOP.indexOf(kind) >= 0 ? 1 : 0.3 + 1.0 * t; }
    function pulseRep() {
      var dose = info.querySelector('.st-dose strong');
      if (!dose) return;
      dose.classList.remove('is-rep'); void dose.offsetWidth; dose.classList.add('is-rep');
    }
    function enter(group, id, wall) {
      window.PulseGuidePreview = preview;
      state.group = group; state.program = null; state.list = listFor(group);
      root.hidden = false;
      root.classList.remove('is-entering', 'is-flip', 'is-preparing');
      // Growing from a muscle: stay see-through until the artwork is decoded, so
      // the body never gives way to an empty dark frame.
      if (wall && wall.from && !matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('is-preparing');
      if (wall && wall.src) {
        var image = new Image();
        var play = function () {
          art.style.backgroundImage = 'url("' + wall.src + '")';
          art.style.backgroundPosition = wall.focus || '50% 50%';
          void root.offsetWidth;
          if (wall.from && art.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) grow(wall.from);
          else root.classList.add('is-entering');
        };
        image.src = wall.src;
        if (image.decode) image.decode().then(play, play); else image.onload = play;
      }
      go(Math.max(0, state.list.indexOf(id != null ? id : ui.active())));
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
      rise(document.getElementById('studio-stage'), 260, 60);
      rise(heroCopy, 420, 10); rise(top, 480, -8); rise(info, 540, 12); rise(rail, 620, 16);
      rise(root.querySelector('.st-poster'), 260, 60); rise(navPrev, 620, 0); rise(navNext, 620, 0);
      setTimeout(function () { root.classList.remove('is-flip'); }, 1200);
    }
    function leave(silent) {
      if (root.hidden) return;
      if (sheetOpen) closeSheet();
      ui.setPaused(true);
      root.hidden = true; root.classList.remove('is-entering');
      if (window.PulseGuidePreview === preview) delete window.PulseGuidePreview;
      if (!silent && onLeave) onLeave();
    }
    if (GYM) {
      window.PulseGymScene = { enter: enter, leave: leave, isOpen: function () { return !root.hidden; }, onLeave: function (fn) { onLeave = fn; } };
      return;
    }
    var startGroup = GROUPS.indexOf(params.get('grupp')) >= 0 ? params.get('grupp') : 'Alla';
    state.group = startGroup; state.list = listFor(startGroup);
    var startIndex = Math.max(0, state.list.indexOf(ui.active()));
    renderTabs(); go(startIndex); showHint();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
