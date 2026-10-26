/* Body-menu preview for the exercise explorer, enabled with ?ui=kropp.
   A turntable figure replaces the muscle carousel (Utforska) and the filter
   chips and time select (Program): drag to turn it, tap a glowing muscle to
   choose it. Programs become cover cards. Every choice goes through the
   page's own controls or PulseGuideUI, so behaviour keeps one source of truth
   and the default UI is untouched when the flag is off. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  if (params.get('ui') !== 'kropp') return;
  document.documentElement.classList.add('ui-kropp');

  var ATLAS = 'assets/atlas-stills-v1/';
  var POSES = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,21,22,23,25,26,30,34,35,43,44,45,52];
  var STANCE = { front: 0, back: 6 };
  /* Hotspots on the frontal (view-0) and dorsal (view-6) stills, in % of the
     720×900 frame; `turn` is the angle and still that shows the muscle lit,
     and `at` where its label sits on that still. */
  var MUSCLES = [
    { name: 'Axlar', side: 'front', x: 39.5, y: 26, turn: 2, img: 'shoulders-front', at: [57.5, 26.7] },
    { name: 'Bröst', side: 'front', x: 44.5, y: 29, turn: 1, img: 'chest-front', at: [44.9, 29.1] },
    { name: 'Biceps', side: 'front', x: 36, y: 35.5, turn: 1, img: 'biceps-front', at: [38.6, 35.6] },
    { name: 'Mage', side: 'front', x: 50, y: 41, turn: 0, img: 'abs-front', at: [49.7, 42.1] },
    { name: 'Framsida lår', side: 'front', x: 44, y: 61, turn: 1, img: 'quads-front', at: [43.6, 64.1] },
    { name: 'Rygg', side: 'back', x: 54, y: 32, turn: 6, img: 'back-back', at: [49.8, 33.1] },
    { name: 'Triceps', side: 'back', x: 63.5, y: 35, turn: 8, img: 'triceps-back', at: [49.6, 34.9] },
    { name: 'Säte', side: 'back', x: 45, y: 51, turn: 7, img: 'glutes-back', at: [49.9, 52.1] },
    { name: 'Baksida lår', side: 'back', x: 56, y: 64, turn: 7, img: 'hamstrings-back', at: [48.8, 65.5] },
    { name: 'Vader', side: 'back', x: 44, y: 79, turn: 7, img: 'calves-back', at: [47.9, 80.6] }
  ];
  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var views = [];
  function view(i) { i = ((i % 12) + 12) % 12; if (!views[i]) { views[i] = new Image(); views[i].src = ATLAS + 'view-' + i + '.webp'; } return views[i]; }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function byName(name) { for (var i = 0; i < MUSCLES.length; i++) if (MUSCLES[i].name === name) return MUSCLES[i]; return null; }

  /* ---- Turntable body ---- */
  function Body(options) {
    var root = el('section', 'kb-body');
    root.setAttribute('aria-label', options.label);
    var stage = el('div', 'kb-figure');
    var base = el('img', 'kb-base'); base.alt = ''; base.draggable = false;
    var lit = el('img', 'kb-lit'); lit.alt = ''; lit.draggable = false;
    var tag = el('div', 'kb-tag');
    stage.appendChild(base); stage.appendChild(lit); stage.appendChild(tag);
    var dots = MUSCLES.map(function (m) {
      var b = el('button', 'kb-dot', '<span></span>');
      b.type = 'button'; b.dataset.side = m.side; b.style.left = m.x + '%'; b.style.top = m.y + '%';
      b.setAttribute('aria-label', m.name);
      b.addEventListener('click', function (event) { event.stopPropagation(); choose(m.name === selected ? 'Alla' : m.name); });
      stage.appendChild(b);
      return { m: m, b: b };
    });
    var flip = el('button', 'kb-flip', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.66-5.66"></path><path d="M18 3v4h-4"></path><path d="M20 12a8 8 0 0 1-13.66 5.66"></path><path d="M6 21v-4h4"></path></svg>');
    flip.type = 'button';
    root.appendChild(stage);
    root.appendChild(flip);

    var frame = 0, side = 'front', selected = 'Alla', timer = 0, onDone = null;
    function show(i) { frame = ((i % 12) + 12) % 12; base.src = view(frame).src; }
    function turnTo(target, done) {
      clearInterval(timer); onDone = done || null;
      root.classList.add('is-turning');
      if (reduced || frame === target) { show(target); settle(); return; }
      var step = ((target - frame + 18) % 12) - 6 < 0 ? -1 : 1;
      timer = setInterval(function () {
        show(frame + step);
        if (frame === target) settle();
      }, 55);
    }
    function settle() {
      clearInterval(timer); timer = 0;
      root.classList.remove('is-turning');
      var cb = onDone; onDone = null;
      if (cb) cb();
      sync();
    }
    function sync() {
      var atStance = frame === STANCE.front || frame === STANCE.back;
      side = frame >= 3 && frame <= 9 ? 'back' : 'front';
      root.dataset.side = side;
      root.classList.toggle('is-stance', atStance);
      var m = byName(selected), litNow = !!(m && frame === m.turn && !root.classList.contains('is-dragging'));
      root.classList.toggle('is-lit', litNow);
      if (m) { tag.style.left = m.at[0] + '%'; tag.style.top = m.at[1] + '%'; }
      tag.textContent = m ? m.name : '';
      dots.forEach(function (d) {
        var on = d.m.name === selected, count = options.count(d.m.name);
        d.b.setAttribute('aria-pressed', String(on));
        d.b.disabled = count === 0;
        d.b.setAttribute('aria-label', d.m.name + ', ' + options.unit(count));
        d.b.tabIndex = d.m.side === side ? 0 : -1;
      });
      flip.setAttribute('aria-label', side === 'front' ? 'Visa baksidan' : 'Visa framsidan');
      if (options.onSync) options.onSync(selected, root);
    }
    function lightUp() {
      var m = byName(selected);
      if (!m) { turnTo(STANCE[side]); return; }
      lit.src = ATLAS + m.img + '.webp';
      turnTo(m.turn);
    }
    function choose(name, silent) {
      selected = name;
      if (!silent) options.onChoose(name);
      lightUp();
    }

    flip.addEventListener('click', function () { turnTo(side === 'front' ? STANCE.back : STANCE.front); });
    /* Tap the lit figure to see every muscle again; drag to turn it. */
    var drag = null;
    stage.addEventListener('pointerdown', function (event) {
      if (event.target.closest('.kb-dot')) return;
      drag = { x: event.clientX, y: event.clientY, f: frame, moved: false };
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointermove', function (event) {
      if (!drag) return;
      var dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(event.clientY - drag.y)) { drag.moved = true; root.classList.add('is-dragging'); clearInterval(timer); }
      if (drag.moved) { show(drag.f - Math.round(dx / 24)); sync(); }
    });
    function release() {
      if (!drag) return;
      var d = drag; drag = null;
      root.classList.remove('is-dragging');
      if (!d.moved) { if (root.classList.contains('is-lit')) turnTo(STANCE[side]); else if (options.onTap) options.onTap(); return; }
      var toBack = frame >= 3 && frame <= 9, m = byName(selected);
      if (m && m.side === (toBack ? 'back' : 'front')) lightUp();
      else turnTo(toBack ? STANCE.back : STANCE.front);
    }
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);

    show(0); view(6);
    setTimeout(function () { for (var i = 0; i < 12; i++) view(i); }, 1200);
    return { root: root, choose: choose, sync: sync, selected: function () { return selected; } };
  }

  function init() {
    var ui = window.PulseGuideUI;
    if (!ui) return;

    /* ---- Utforska: the body replaces the muscle carousel ---- */
    var carousel = document.querySelector('.studio-muscles');
    var explore = Body({
      label: 'Välj muskelgrupp',
      count: function (name) { return ui.countFor(name); },
      unit: function (n) { return n + (n === 1 ? ' övning' : ' övningar'); },
      onChoose: function (name) {
        ui.openMuscle(name);
        if (name !== 'Alla') setTimeout(function () { explore.root.classList.add('is-compact'); }, reduced ? 0 : 650);
      },
      onTap: function () { if (explore.root.classList.contains('is-compact')) expand(); },
      onSync: function (name, root) {
        var count = ui.countFor(name);
        caption.innerHTML = '<span>' + (name === 'Alla' ? 'Tryck på en muskel' : 'Muskelgrupp') + '</span><strong>' + (name === 'Alla' ? 'Hela kroppen' : name) + '</strong><small>' + count + (count === 1 ? ' övning' : ' övningar') + '</small>';
        root.classList.toggle('has-choice', name !== 'Alla');
      }
    });
    var caption = el('div', 'kb-caption');
    explore.root.insertBefore(caption, explore.root.firstChild);
    var change = el('button', 'kb-change', 'Byt');
    change.type = 'button';
    change.addEventListener('click', function () { expand(); });
    explore.root.appendChild(change);
    function expand() { explore.root.classList.remove('is-compact'); }
    explore.root.classList.add('kb-explore');
    carousel.parentNode.insertBefore(explore.root, carousel);
    explore.choose(ui.muscle(), true);

    /* ---- Program: body filter, time ring and cover cards ---- */
    var controls = $('program-controls');
    var deck = el('div', 'kb-program-head');
    var programs = Body({
      label: 'Filtrera program på muskelgrupp',
      count: function (name) { return ui.programCount(name); },
      unit: function (n) { return n + ' program'; },
      onChoose: function (name) {
        var button = document.querySelector('[data-program-filter="' + name + '"]');
        if (button) button.click();
        syncRing();
      }
    });
    programs.root.classList.add('kb-programs');
    var side = el('div', 'kb-side');
    var ring = el('button', 'kb-ring');
    ring.type = 'button';
    var count = el('p', 'kb-count');
    side.appendChild(ring); side.appendChild(count);
    deck.appendChild(programs.root); deck.appendChild(side);
    controls.parentNode.insertBefore(deck, controls);
    var TIMES = ['', '20', '30', '45', '60'];
    function syncRing() {
      var value = $('program-time').value, max = 60, frac = value ? Number(value) / max : 1, len = 2 * Math.PI * 44;
      ring.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="kb-ring-track" cx="50" cy="50" r="44"></circle>' +
        '<circle class="kb-ring-fill" cx="50" cy="50" r="44" stroke-dasharray="' + (len * frac).toFixed(1) + ' ' + len.toFixed(1) + '"></circle>' +
        [20, 30, 45, 60].map(function (t) { var a = (t / max) * 2 * Math.PI - Math.PI / 2; return '<circle class="kb-tick' + (value && Number(value) >= t ? ' on' : '') + '" cx="' + (50 + 44 * Math.cos(a)).toFixed(1) + '" cy="' + (50 + 44 * Math.sin(a)).toFixed(1) + '" r="2.4"></circle>'; }).join('') +
        '</svg><span class="kb-ring-copy"><small>Tid</small><strong>' + (value ? '≤' + value : 'Alla') + '</strong><small>' + (value ? 'min' : 'längder') + '</small></span>';
      ring.setAttribute('aria-label', 'Tid: ' + (value ? 'upp till ' + value + ' minuter' : 'alla längder') + '. Tryck för att ändra');
      var n = ui.programCount(ui.programFilter());
      count.innerHTML = '<strong>' + n + '</strong> program' + (ui.programFilter() !== 'Alla' ? '<br><span>för ' + ui.programFilter().toLowerCase() + '</span>' : '');
      programs.sync();
    }
    ring.addEventListener('click', function () {
      var select = $('program-time'), next = TIMES[(TIMES.indexOf(select.value) + 1) % TIMES.length];
      select.value = next;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncRing();
    });
    programs.choose(ui.programFilter(), true);
    syncRing();

    function decorateCards() {
      [].forEach.call($('program-cards').querySelectorAll('.program-card'), function (card) {
        if (card.querySelector('.kb-cover')) return;
        var button = card.querySelector('[data-program]'), program = button && ui.program(button.dataset.program);
        if (!program) return;
        var stills = program.ids.filter(function (id) { return POSES.indexOf(id) >= 0; }).slice(0, 3);
        var cover = el('div', 'kb-cover kb-cover-' + stills.length,
          stills.map(function (id, i) { return '<img src="assets/exercise-poses-v1/' + String(id).padStart(2, '0') + '-end.webp" alt="" loading="lazy" style="--i:' + i + '">'; }).join('') +
          '<svg class="kb-cover-line" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 5 H34 L38 3.2 L42 7.4 L47 .8 L52 9.2 L56 4.2 H100"></path></svg>');
        cover.setAttribute('aria-hidden', 'true');
        card.insertBefore(cover, card.firstChild);
        card.tabIndex = -1;
        card.addEventListener('click', function (event) { if (!event.target.closest('button')) button.click(); });
      });
    }
    new MutationObserver(function () { decorateCards(); syncRing(); }).observe($('program-cards'), { childList: true });
    decorateCards();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
