/* Body-menu preview for the exercise explorer, enabled with ?ui=kropp; add
   omslag (?ui=kropp,omslag) for program covers and a time ring.
   A turntable of the exercise mannequin replaces the muscle carousel on
   Utforska and the muscle chips on Program: drag to turn it, tap a glowing
   muscle to choose it. Every choice goes through the page's own controls or
   PulseGuideUI, so behaviour keeps one source of truth and the default UI is
   untouched when the flag is off. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var flags = (params.get('ui') || '').split(',');
  if (flags.indexOf('kropp') < 0) return;
  var withCovers = flags.indexOf('omslag') >= 0;
  document.documentElement.classList.add('ui-kropp');
  if (withCovers) document.documentElement.classList.add('ui-omslag');

  var ATLAS = 'assets/silver-body-v1/';
  var STANCE = { front: 0, back: 6 };
  var POSES = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,21,22,23,25,26,30,34,35,43,44,45,52];
  var ECG = 'M0 5 H34 L38 3.2 L42 7.4 L47 .8 L52 9.2 L56 4.2 H100';
  /* The exercise mannequin rendered standing, in 12 angles plus one lit still
     per group at its stance (see assets/silver-body-v1). Points are in % of the
     720×900 frame, at the centre of each lit muscle. */
  var MUSCLES = [
    { name: 'Axlar', side: 'front', x: 62.8, y: 28.5, img: 'shoulders' },
    { name: 'Bröst', side: 'front', x: 43.2, y: 30.6, img: 'chest' },
    { name: 'Biceps', side: 'front', x: 33.2, y: 35.7, img: 'biceps' },
    { name: 'Mage', side: 'front', x: 49.9, y: 40.3, img: 'abs' },
    { name: 'Framsida lår', side: 'front', x: 43, y: 60.9, img: 'quads' },
    { name: 'Rygg', side: 'back', x: 49.8, y: 34, img: 'back' },
    { name: 'Triceps', side: 'back', x: 33.2, y: 35.6, img: 'triceps' },
    { name: 'Säte', side: 'back', x: 51.2, y: 49.7, img: 'glutes' },
    { name: 'Baksida lår', side: 'back', x: 56.9, y: 60.7, img: 'hamstrings' },
    { name: 'Vader', side: 'back', x: 42.8, y: 74.9, img: 'calves' }
  ].map(function (m) { m.turn = STANCE[m.side]; m.at = [m.x, m.y]; return m; });
  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var views = [];
  function view(i) { i = ((i % 12) + 12) % 12; if (!views[i]) { views[i] = new Image(); views[i].src = ATLAS + 'view-' + i + '.webp'; } return views[i]; }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function poseSrc(id) { return 'assets/exercise-poses-v1/' + String(id).padStart(2, '0') + '-end.webp'; }
  function observe(node, fn, opts) { if (node) new MutationObserver(fn).observe(node, opts || { childList: true }); }
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

    /* ---- Program: the body filters programs by muscle group ---- */
    var head = el('div', 'kb-program-head');
    var programs = Body({
      label: 'Filtrera program på muskelgrupp',
      count: function (name) { return ui.programCount(name); },
      unit: function (n) { return n + ' program'; },
      onChoose: function (name) {
        var button = document.querySelector('[data-program-filter="' + name + '"]');
        if (button) button.click();
      }
    });
    programs.root.classList.add('kb-programs');
    head.appendChild(programs.root);
    $('program-controls').parentNode.insertBefore(head, $('program-controls'));
    programs.choose(ui.programFilter(), true);
    // Counts per muscle follow the time filter, which re-renders the cards.
    observe($('program-cards'), function () { programs.sync(); });
    if (withCovers) omslag(ui);
  }

  /* ---- omslag: time ring beside the program figure, and cover cards ---- */
  function omslag(ui) {
    var host = document.querySelector('.kb-program-head');
    var side = el('div', 'om-side');
    var ring = el('button', 'om-ring'); ring.type = 'button';
    var count = el('p', 'om-count');
    side.appendChild(ring); side.appendChild(count);
    host.appendChild(side);
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
          stills.map(function (id, i) { return '<img src="' + poseSrc(id) + '" alt="" loading="lazy" data-i="' + i + '">'; }).join('') +
          '<svg class="om-cover-line" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="' + ECG + '"></path></svg>');
        cover.setAttribute('aria-hidden', 'true');
        card.insertBefore(cover, card.firstChild);
        card.addEventListener('click', function (event) { if (!event.target.closest('button')) button.click(); });
      });
    }
    observe($('program-cards'), function () { decorate(); sync(); });
    decorate(); sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
