/* Gym-map preview for the exercise explorer, enabled with ?ui=karta.
   The explorer is an isometric gym floor: every machine and free-weight zone
   is a station with its exercise figure on a pedestal. Tap a station to open
   the live animated figure in a sheet; programmes are routes drawn through
   the stations in order. The page's own stage, selection and transfer are
   reused through PulseGuideUI, so the default UI is untouched when the flag
   is off. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  if ((params.get('ui') || '').split(',').indexOf('karta') < 0) return;
  document.documentElement.classList.add('ui-karta');

  var POSES = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,21,22,23,25,26,30,34,35,43,44,45,52];
  var TW = 56, TH = 28, FLOOR = { w: 13, h: 13 };
  /* Floor plan in tile units: the machine park, free weights, cables, the
     mat and a cardio row. Machines are placed in catalogue order. */
  var MACHINE_SLOTS = [[1.5,1.5],[3.5,1.5],[5.5,1.5],[7.5,1.5],[1.5,3.5],[3.5,3.5],[5.5,3.5],[7.5,3.5],[1.5,5.5],[3.5,5.5],[5.5,5.5],[7.5,5.5],[1.5,7.5],[3.5,7.5],[5.5,7.5],[7.5,7.5]];
  var ZONES = {
    Kabel: { name: 'Kabeltornet', at: [10.8, 2.2], still: 4 },
    'Skivstång': { name: 'Skivstångsracket', at: [10.8, 5.4], still: 5 },
    Hantlar: { name: 'Hantelstället', at: [10.8, 8.6], still: 6 },
    Kroppsvikt: { name: 'Mattan', at: [10.6, 11.4], still: 43 }
  };
  var CARDIO_SLOTS = [[1.2,11.2],[3,11.2],[4.8,11.2],[6.6,11.2],[8.4,11.2]];
  var AREAS = [
    { name: 'Maskiner', poly: [[0.4,0.4],[8.6,0.4],[8.6,8.6],[0.4,8.6]] },
    { name: 'Fria vikter', poly: [[9.4,0.4],[12.6,0.4],[12.6,9.8],[9.4,9.8]] },
    { name: 'Kondition', poly: [[0.4,10.2],[9.4,10.2],[9.4,12.6],[0.4,12.6]] },
    { name: 'Golv', poly: [[9.6,10.2],[12.6,10.2],[12.6,12.6],[9.6,12.6]] }
  ];
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function iso(x, y) { return { x: (x - y) * TW / 2, y: (x + y) * TH / 2 }; }
  function pose(id, end) { return POSES.indexOf(Number(id)) >= 0 ? 'assets/exercise-poses-v1/' + String(id).padStart(2, '0') + (end ? '-end' : '-start') + '.webp' : ''; }
  function splitDose(label) {
    var m = String(label || '').match(/(\d+)\s*×\s*([\d–]+)\s*(.*)$/);
    if (!m) return { big: String(label || ''), unit: '' };
    return m[1] === '1' && /min/.test(m[3]) ? { big: m[2], unit: m[3] } : { big: m[1] + '×' + m[2], unit: m[3] };
  }
  var ECG = 'M0 5 H34 L38 3.2 L42 7.4 L47 .8 L52 9.2 L56 4.2 H100';

  function init() {
    var ui = window.PulseGuideUI, explore = window.PulseExplore;
    if (!ui || !explore) return;
    var all = explore.exercises;
    if ($('guide-page').hidden || document.body.classList.contains('exercise-list-open')) $('living-dock').querySelector('[data-page="guide"]').click();

    /* ---- Stations from the catalogue ---- */
    var stations = [], byExercise = {};
    var machines = all.filter(function (e) { return e.equipment === 'Maskin'; });
    machines.forEach(function (e, i) { var s = MACHINE_SLOTS[i % MACHINE_SLOTS.length]; stations.push({ key: 'm' + e.id, name: e.name, kind: 'Maskin', ids: [e.id], at: s, still: e.id }); });
    all.filter(function (e) { return e.equipment === 'Konditionsmaskin'; }).forEach(function (e, i) {
      stations.push({ key: 'c' + e.id, name: e.name, kind: 'Kondition', ids: [e.id], at: CARDIO_SLOTS[i % CARDIO_SLOTS.length], still: e.id });
    });
    Object.keys(ZONES).forEach(function (equipment) {
      var z = ZONES[equipment], ids = all.filter(function (e) { return e.equipment === equipment; }).map(function (e) { return e.id; });
      if (ids.length) stations.push({ key: 'z' + equipment, name: z.name, kind: equipment, ids: ids, at: z.at, still: z.still, zone: true });
    });
    stations.forEach(function (s) { s.ids.forEach(function (id) { byExercise[id] = s; }); s.pt = iso(s.at[0], s.at[1]); });

    /* ---- Floor ---- */
    var root = el('div', 'gm-root'); root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Gymkarta');
    var viewport = el('div', 'gm-viewport');
    var world = el('div', 'gm-world');
    var corners = [iso(0, 0), iso(FLOOR.w, 0), iso(FLOOR.w, FLOOR.h), iso(0, FLOOR.h)];
    var minX = iso(0, FLOOR.h).x - 40, maxX = iso(FLOOR.w, 0).x + 40, minY = -110, maxY = iso(FLOOR.w, FLOOR.h).y + 40;
    var W = maxX - minX, H = maxY - minY;
    world.style.width = W + 'px'; world.style.height = H + 'px';
    function P(x, y) { var p = iso(x, y); return (p.x - minX).toFixed(1) + ',' + (p.y - minY).toFixed(1); }
    var grid = '';
    for (var gx = 0; gx <= FLOOR.w; gx++) grid += '<line x1="' + P(gx, 0).split(',')[0] + '" y1="' + P(gx, 0).split(',')[1] + '" x2="' + P(gx, FLOOR.h).split(',')[0] + '" y2="' + P(gx, FLOOR.h).split(',')[1] + '"/>';
    for (var gy = 0; gy <= FLOOR.h; gy++) grid += '<line x1="' + P(0, gy).split(',')[0] + '" y1="' + P(0, gy).split(',')[1] + '" x2="' + P(FLOOR.w, gy).split(',')[0] + '" y2="' + P(FLOOR.w, gy).split(',')[1] + '"/>';
    var floor = '<svg class="gm-floor" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<defs><radialGradient id="gm-glow" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#3a1714"/><stop offset=".6" stop-color="#140c10"/><stop offset="1" stop-color="#0a0d14"/></radialGradient></defs>' +
      '<polygon class="gm-slab" points="' + corners.map(function (c) { return (c.x - minX) + ',' + (c.y - minY); }).join(' ') + '"/>' +
      '<polygon class="gm-slab-side" points="' + [P(0, FLOOR.h), P(FLOOR.w, FLOOR.h), P(FLOOR.w, 0)].join(' ') + ' ' + (iso(FLOOR.w, 0).x - minX) + ',' + (iso(FLOOR.w, 0).y - minY + 14) + ' ' + (iso(FLOOR.w, FLOOR.h).x - minX) + ',' + (iso(FLOOR.w, FLOOR.h).y - minY + 14) + ' ' + (iso(0, FLOOR.h).x - minX) + ',' + (iso(0, FLOOR.h).y - minY + 14) + '"/>' +
      '<g class="gm-grid">' + grid + '</g>' +
      AREAS.map(function (a) { return '<polygon class="gm-area" points="' + a.poly.map(function (q) { return P(q[0], q[1]); }).join(' ') + '"/>'; }).join('') +
      '<g class="gm-route"></g></svg>';
    world.innerHTML = floor;
    AREAS.forEach(function (a) {
      var p = iso(a.poly[0][0] + .2, a.poly[0][1] + .2), label = el('span', 'gm-area-label', a.name);
      label.style.left = (p.x - minX) + 'px'; label.style.top = (p.y - minY) + 'px'; world.appendChild(label);
    });
    stations.forEach(function (s) {
      var b = el('button', 'gm-st' + (s.zone ? ' is-zone' : ''));
      b.type = 'button'; b.dataset.key = s.key;
      b.style.left = (s.pt.x - minX) + 'px'; b.style.top = (s.pt.y - minY) + 'px';
      var src = pose(s.still, true);
      b.innerHTML = '<span class="gm-pad"></span>' + (src ? '<img src="' + src + '" alt="" loading="lazy">' : '<span class="gm-ghost"></span>') +
        '<span class="gm-num" aria-hidden="true"></span><span class="gm-name">' + s.name + (s.zone ? ' <em>' + s.ids.length + '</em>' : '') + '</span>';
      b.setAttribute('aria-label', s.name + (s.zone ? ', ' + s.ids.length + ' övningar' : ''));
      s.btn = b; world.appendChild(b);
    });
    viewport.appendChild(world);

    var head = el('div', 'gm-head', '<div><span class="gm-eyebrow">Pulse Flow</span><h1>Gymmet</h1><p class="gm-sub">' + all.length + ' övningar · ' + stations.length + ' stationer</p></div>');
    var close = el('a', 'gm-close', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'); close.href = $('explore-back').getAttribute('href'); close.setAttribute('aria-label', 'Till träningen');
    head.appendChild(close);
    var routes = el('div', 'gm-routes');
    routes.innerHTML = explore.programs.map(function (p) {
      return '<button type="button" class="gm-route-card" data-program="' + p.id + '"><b>' + p.name + '</b><small>' + p.ids.length + ' stopp · ' + explore.durationLabel(p) + '</small></button>';
    }).join('');
    var modes = el('div', 'gm-modes', '<button type="button" data-mode="stations" aria-pressed="true">Stationer</button><button type="button" data-mode="routes" aria-pressed="false">Rutter</button>');
    var pass = el('button', 'gm-pass'); pass.type = 'button';
    var sheet = el('div', 'gm-sheet'); sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'false'); sheet.setAttribute('aria-label', 'Station');
    sheet.innerHTML = '<div class="gm-grip" aria-hidden="true"></div><div class="gm-sheet-head"><span class="gm-eyebrow"></span><button type="button" class="gm-sheet-close" aria-label="Stäng">×</button></div><div class="gm-stage"></div><div class="gm-sheet-body"></div>';
    var poster = el('img', 'gm-poster'); poster.alt = ''; poster.setAttribute('aria-hidden', 'true');
    sheet.querySelector('.gm-stage').appendChild(poster);
    sheet.querySelector('.gm-stage').appendChild($('studio-stage'));
    [viewport, head, routes, modes, pass, sheet].forEach(function (n) { root.appendChild(n); });
    document.body.appendChild(root);

    /* ---- Pan and zoom ---- */
    var view = { x: 0, y: 0, s: 1 };
    function apply() { world.style.transform = 'translate(' + view.x.toFixed(1) + 'px,' + view.y.toFixed(1) + 'px) scale(' + view.s.toFixed(3) + ')'; }
    function fit(points, padTop, padBottom) {
      var vw = viewport.clientWidth, vh = viewport.clientHeight - padTop - padBottom;
      var xs = points.map(function (p) { return p.x - minX; }), ys = points.map(function (p) { return p.y - minY; });
      var bx = Math.min.apply(null, xs) - 60, by = Math.min.apply(null, ys) - 110, bw = Math.max.apply(null, xs) + 60 - bx, bh = Math.max.apply(null, ys) + 40 - by;
      view.s = Math.max(.45, Math.min(1.25, Math.min(vw / bw, vh / bh)));
      view.x = (vw - bw * view.s) / 2 - bx * view.s; view.y = padTop + (vh - bh * view.s) / 2 - by * view.s;
      world.classList.add('is-easing'); apply(); setTimeout(function () { world.classList.remove('is-easing'); }, 450);
    }
    function centerOn(s) {
      var vw = viewport.clientWidth, vh = viewport.clientHeight * .36;
      view.s = Math.max(view.s, .9);
      view.x = vw / 2 - (s.pt.x - minX) * view.s; view.y = vh - (s.pt.y - minY - 30) * view.s;
      world.classList.add('is-easing'); apply(); setTimeout(function () { world.classList.remove('is-easing'); }, 450);
    }
    var pointers = {}, drag = null, moved = false;
    viewport.addEventListener('pointerdown', function (event) {
      pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
      viewport.setPointerCapture(event.pointerId);
      var ids = Object.keys(pointers);
      if (ids.length === 1) { drag = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y }; moved = false; }
      else if (ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]]; drag = { pinch: Math.hypot(a.x - b.x, a.y - b.y), s: view.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, vx: view.x, vy: view.y }; moved = true; }
    });
    viewport.addEventListener('pointermove', function (event) {
      if (!pointers[event.pointerId] || !drag) return;
      pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
      var ids = Object.keys(pointers);
      if (drag.pinch && ids.length === 2) {
        var a = pointers[ids[0]], b = pointers[ids[1]], s = Math.max(.45, Math.min(1.8, drag.s * Math.hypot(a.x - b.x, a.y - b.y) / drag.pinch));
        view.x = drag.cx - (drag.cx - drag.vx) * s / drag.s; view.y = drag.cy - (drag.cy - drag.vy) * s / drag.s; view.s = s; apply();
      } else if (!drag.pinch) {
        var dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        view.x = drag.vx + dx; view.y = drag.vy + dy; apply();
      }
    });
    function lift(event) {
      delete pointers[event.pointerId];
      if (!Object.keys(pointers).length) {
        var wasDrag = moved; drag = null;
        if (!wasDrag && event.type === 'pointerup') {
          var hit = document.elementFromPoint(event.clientX, event.clientY), st = hit && hit.closest('.gm-st');
          if (st) openStation(stations.find(function (s) { return s.key === st.dataset.key; }));
        }
      }
    }
    viewport.addEventListener('pointerup', lift);
    viewport.addEventListener('pointercancel', lift);
    viewport.addEventListener('wheel', function (event) {
      event.preventDefault();
      var s = Math.max(.45, Math.min(1.8, view.s * (event.deltaY < 0 ? 1.1 : .9)));
      view.x = event.clientX - (event.clientX - view.x) * s / view.s; view.y = event.clientY - (event.clientY - view.y) * s / view.s; view.s = s; apply();
    }, { passive: false });
    world.addEventListener('click', function (event) {
      // Keyboard activation of a station (pointer taps are resolved in lift).
      var st = event.target.closest('.gm-st'); if (st && event.detail === 0) openStation(stations.find(function (s) { return s.key === st.dataset.key; }));
    });

    /* ---- Station sheet with the live figure ---- */
    var current = { station: null, id: null, route: null, step: 0 };
    function openStation(s, id) {
      if (!s) return;
      current.station = s; current.id = id != null ? id : (current.route ? current.route.ids[current.step] : s.ids[0]);
      stations.forEach(function (x) { x.btn.classList.toggle('is-open', x === s); });
      ui.select(current.id); ui.setPaused(false);
      renderSheet();
      root.classList.add('sheet-open');
      centerOn(s);
    }
    function closeSheet() {
      root.classList.remove('sheet-open'); ui.setPaused(true);
      stations.forEach(function (x) { x.btn.classList.remove('is-open'); });
      current.station = null;
    }
    function renderSheet() {
      var s = current.station, id = current.id, e = all[id], program = current.route;
      var dose = splitDose(explore.prescription(id, program || undefined).label), chosen = ui.selection().indexOf(id) >= 0;
      var still = pose(id, false); poster.hidden = !still; if (still) poster.src = still;
      sheet.querySelector('.gm-eyebrow').textContent = program ? 'Stopp ' + (current.step + 1) + ' av ' + program.ids.length + ' · ' + s.name : s.name + (s.zone ? ' · ' + s.ids.length + ' övningar' : '');
      sheet.querySelector('.gm-sheet-body').innerHTML =
        '<div class="gm-title"><div><h2>' + e.name + '</h2><div class="gm-dose"><strong>' + dose.big + '</strong><span>' + dose.unit + '</span></div></div>' +
        '<button type="button" class="gm-add' + (chosen ? ' is-on' : '') + '" data-add aria-pressed="' + chosen + '" aria-label="' + (chosen ? 'Ta bort från Mitt pass' : 'Lägg till i Mitt pass') + '">' + (chosen ? '✓' : '+') + '</button></div>' +
        (s.zone && !program ? '<div class="gm-picks">' + s.ids.map(function (x) { return '<button type="button" data-pick="' + x + '" aria-pressed="' + (x === id) + '">' + all[x].name + '</button>'; }).join('') + '</div>' : '') +
        (program ? '<div class="gm-steps"><button type="button" data-step="-1" aria-label="Föregående stopp"' + (current.step ? '' : ' disabled') + '>‹</button><span>' + ecgSvg() + '</span><button type="button" data-step="1" aria-label="Nästa stopp"' + (current.step < program.ids.length - 1 ? '' : ' disabled') + '>›</button></div>' +
          '<button type="button" class="gm-cta" data-copy-program>Kopiera passet till passbyggaren ↗</button>' : '');
    }
    function ecgSvg() { return '<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="' + ECG + '"/></svg>'; }
    sheet.addEventListener('click', function (event) {
      var t = event.target;
      if (t.closest('.gm-sheet-close') || t.closest('.gm-grip')) { closeSheet(); return; }
      if (t.closest('[data-add]')) { ui.toggle(current.id); renderSheet(); return; }
      var pick = t.closest('[data-pick]'); if (pick) { current.id = Number(pick.dataset.pick); ui.select(current.id); renderSheet(); return; }
      var step = t.closest('[data-step]');
      if (step && current.route) { current.step = Math.max(0, Math.min(current.route.ids.length - 1, current.step + Number(step.dataset.step))); var id = current.route.ids[current.step]; openStation(byExercise[id], id); return; }
      if (t.closest('[data-copy-program]') && current.route) ui.copyProgram(current.route.id);
    });
    var sheetY = null;
    sheet.addEventListener('pointerdown', function (event) { if (event.target.closest('.gm-grip')) sheetY = event.clientY; });
    sheet.addEventListener('pointerup', function (event) { if (sheetY != null && event.clientY - sheetY > 50) closeSheet(); sheetY = null; });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && current.station) closeSheet(); });

    /* ---- Routes ---- */
    function drawRoute(program) {
      var g = world.querySelector('.gm-route');
      stations.forEach(function (s) { s.btn.classList.remove('on-route', 'off-route'); s.btn.querySelector('.gm-num').textContent = ''; });
      if (!program) { g.innerHTML = ''; root.classList.remove('has-route'); return; }
      var stops = program.ids.map(function (id) { return byExercise[id]; });
      var pts = stops.map(function (s) { return (s.pt.x - minX) + ',' + (s.pt.y - minY); });
      g.innerHTML = '<polyline class="gm-route-glow" points="' + pts.join(' ') + '"/><polyline class="gm-route-line" pathLength="100" points="' + pts.join(' ') + '"/>' +
        pts.map(function (p) { var c = p.split(','); return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="5"/>'; }).join('');
      stations.forEach(function (s) { var i = stops.indexOf(s); s.btn.classList.add(i >= 0 ? 'on-route' : 'off-route'); });
      stops.forEach(function (s, i) { var n = s.btn.querySelector('.gm-num'); n.textContent = n.textContent ? n.textContent + '·' + (i + 1) : String(i + 1); });
      root.classList.add('has-route');
      fit(stops.map(function (s) { return s.pt; }), 110, sheet.offsetHeight + 8);
    }
    routes.addEventListener('click', function (event) {
      var b = event.target.closest('[data-program]'); if (!b) return;
      var program = explore.programs.find(function (p) { return p.id === b.dataset.program; });
      [].forEach.call(routes.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); });
      current.route = program; current.step = 0; closeSheet(); drawRoute(program);
      setTimeout(function () { openStation(byExercise[program.ids[0]], program.ids[0]); }, 500);
    });
    modes.addEventListener('click', function (event) {
      var b = event.target.closest('[data-mode]'); if (!b) return;
      var routesMode = b.dataset.mode === 'routes';
      [].forEach.call(modes.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); });
      root.classList.toggle('mode-routes', routesMode);
      if (!routesMode) { current.route = null; drawRoute(null); [].forEach.call(routes.children, function (c) { c.setAttribute('aria-pressed', 'false'); }); closeSheet(); fitAll(); }
    });

    /* ---- Mitt pass ---- */
    function renderPass() {
      var n = ui.selection().length;
      pass.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9"/></svg>' + (n ? '<em>' + n + '</em>' : '');
      pass.setAttribute('aria-label', 'Mitt pass, ' + n + ' övningar. Kopiera passförslag');
      pass.hidden = !n;
      stations.forEach(function (s) { s.btn.classList.toggle('is-chosen', s.ids.some(function (id) { return ui.selection().indexOf(id) >= 0; })); });
    }
    pass.addEventListener('click', function () { ui.copySelection(); });
    new MutationObserver(function () { renderPass(); if (current.station) renderSheet(); }).observe($('living-pass-count'), { childList: true, characterData: true, subtree: true });

    // Start on the machine park at a readable size; the rest is a drag away.
    function fitAll() { fit(stations.filter(function (s) { return s.kind === 'Maskin'; }).map(function (s) { return s.pt; }), 100, 90); }
    ui.setPaused(true);
    requestAnimationFrame(function () { fitAll(); });
    renderPass();
    window.addEventListener('resize', function () { if (!current.station) fitAll(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
