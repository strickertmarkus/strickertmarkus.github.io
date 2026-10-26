/* Body-to-gym preview for the exercise explorer, enabled with ?ui=gym.
   1. Body: tap a muscle on the full-body figure (front/back).
   2. Room: the muscle's artwork becomes the wall of a small isometric gym
      that holds only the stations training that muscle; its programmes are
      routes drawn between stations.
   3. Station: a sheet with the live animated exercise figure.
   The body is the generated muscle-map artwork (PulseMuscleMap, from
   pulse-muscle-map.js), or with &figur=egen the mannequin render in
   assets/silver-body-art-v1. The page's stage, selection and transfer are
   reused through PulseGuideUI, so the default UI is untouched without the
   flag. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  if ((params.get('ui') || '').split(',').indexOf('gym') < 0) return;
  document.documentElement.classList.add('ui-gym');
  var OWN = params.get('figur') === 'egen';

  var POSES = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,21,22,23,25,26,30,34,35,43,44,45,52];
  var ART = { 'Bröst': 'chest', 'Axlar': 'shoulders', 'Rygg': 'back', 'Biceps': 'biceps', 'Triceps': 'triceps', 'Mage': 'abs', 'Framsida lår': 'quads', 'Säte': 'glutes', 'Baksida lår': 'hamstrings', 'Vader': 'calves' };
  var ZONES = { Kabel: 'Kabeltornet', 'Skivstång': 'Skivstångsracket', Hantlar: 'Hantelstället', Kroppsvikt: 'Mattan' };
  var ZONE_STILL = { Kabel: 4, 'Skivstång': 5, Hantlar: 6, Kroppsvikt: 43 };
  var ECG = 'M0 5 H34 L38 3.2 L42 7.4 L47 .8 L52 9.2 L56 4.2 H100';
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function pose(id, end) { return POSES.indexOf(Number(id)) >= 0 ? 'assets/exercise-poses-v1/' + String(id).padStart(2, '0') + (end ? '-end' : '-start') + '.webp' : ''; }
  function splitDose(label) {
    var m = String(label || '').match(/(\d+)\s*×\s*([\d–]+)\s*(.*)$/);
    if (!m) return { big: String(label || ''), unit: '' };
    return m[1] === '1' && /min/.test(m[3]) ? { big: m[2], unit: m[3] } : { big: m[1] + '×' + m[2], unit: m[3] };
  }
  function ecg() { return '<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="' + ECG + '"/></svg>'; }

  function start(map) {
    var ui = window.PulseGuideUI, explore = window.PulseExplore;
    if (!ui || !explore || !map) return;
    var all = explore.exercises;
    if ($('guide-page').hidden || document.body.classList.contains('exercise-list-open')) $('living-dock').querySelector('[data-page="guide"]').click();
    ui.setPaused(true);

    var root = el('div', 'gy-root' + (OWN ? ' is-own' : '')); root.dataset.view = 'body';
    root.setAttribute('role', 'region'); root.setAttribute('aria-label', 'Välj muskel och gym');
    var exitHref = $('explore-back').getAttribute('href');
    var closeIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    /* ---- 1. Body ---- */
    var body = el('section', 'gy-body');
    body.innerHTML = '<div class="gy-head"><div><span class="gy-eyebrow">Pulse Flow</span><h1>Var vill du träna?</h1><p>Tryck på en muskel.</p></div><a class="gy-icon" href="' + exitHref + '" aria-label="Till träningen">' + closeIcon + '</a></div>' +
      '<div class="gy-figure" data-side="front"><img alt="" src="' + map.image + '" decoding="async"><svg class="gy-regions" viewBox="0 0 ' + map.size[0] + ' ' + map.size[1] + '"></svg></div>' +
      '<button type="button" class="gy-flip" aria-label="Visa baksidan"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.66-5.66"/><path d="M18 3v4h-4"/><path d="M20 12a8 8 0 0 1-13.66 5.66"/><path d="M6 21v-4h4"/></svg><span>Baksida</span></button>';
    var figure = body.querySelector('.gy-figure'), regions = body.querySelector('.gy-regions'), flip = body.querySelector('.gy-flip');
    var side = 'front';
    function renderBody() {
      figure.dataset.side = side;
      var half = side === 'front' ? 0 : map.size[0], shift = half - map.sheetX[side];
      figure.querySelector('img').style.left = (-map.sheetX[side] / map.size[0] * 100) + '%';
      figure.querySelector('img').alt = 'Helkroppsfigur ' + (side === 'front' ? 'framifrån' : 'bakifrån');
      regions.innerHTML = map.regions[side].filter(function (r) { return r[1].length; }).map(function (r) {
        var count = ui.countFor(r[0]);
        return '<g class="gy-region" transform="translate(' + shift + ' 0)" data-muscle="' + r[0] + '" role="button" tabindex="0" aria-label="' + r[0] + ', ' + count + ' övningar">' + r[1].map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</g>';
      }).join('');
      flip.setAttribute('aria-label', side === 'front' ? 'Visa baksidan' : 'Visa framsidan');
      flip.querySelector('span').textContent = side === 'front' ? 'Baksida' : 'Framsida';
    }
    flip.addEventListener('click', function () { side = side === 'front' ? 'back' : 'front'; figure.classList.add('is-turning'); setTimeout(function () { renderBody(); figure.classList.remove('is-turning'); }, 160); });
    function pickRegion(g) {
      if (!g) return;
      g.classList.add('is-on');
      var box = g.getBBox(), m = g.transform.baseVal.consolidate(), dx = m ? m.matrix.e : 0;
      figure.style.transformOrigin = ((box.x + dx + box.width / 2) / map.size[0] * 100) + '% ' + ((box.y + box.height / 2) / map.size[1] * 100) + '%';
      openRoom(g.dataset.muscle);
    }
    regions.addEventListener('click', function (event) { pickRegion(event.target.closest('.gy-region')); });
    regions.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pickRegion(event.target.closest('.gy-region')); } });

    /* ---- 2. Room ---- */
    var room = el('section', 'gy-room'); room.hidden = true;
    room.innerHTML = '<div class="gy-hero"><img alt="" decoding="async"><div class="gy-hero-top"><button type="button" class="gy-icon gy-back" aria-label="Tillbaka till kroppen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><a class="gy-icon" href="' + exitHref + '" aria-label="Till träningen">' + closeIcon + '</a></div>' +
      '<div class="gy-hero-copy"><span class="gy-eyebrow">Muskelgrupp</span><h1></h1><p></p></div></div>' +
      '<div class="gy-diorama"><div class="gy-world"><svg class="gy-floor" aria-hidden="true"></svg></div></div>' +
      '<div class="gy-routes"><span class="gy-eyebrow">Rutter</span><div class="gy-route-row"></div></div>';
    var hero = room.querySelector('.gy-hero img'), diorama = room.querySelector('.gy-diorama'), world = room.querySelector('.gy-world'), floorSvg = room.querySelector('.gy-floor'), routeRow = room.querySelector('.gy-route-row');
    var current = { muscle: null, stations: [], route: null, step: 0, station: null, id: null };

    function stationFor(e) {
      if (e.equipment === 'Maskin' || e.equipment === 'Konditionsmaskin') return { key: 'm' + e.id, name: e.name, ids: [e.id], still: e.id };
      return { key: 'z' + e.equipment, name: ZONES[e.equipment] || e.equipment, ids: [e.id], still: ZONE_STILL[e.equipment], zone: true };
    }
    function buildStations(ids) {
      var list = [], byKey = {};
      ids.forEach(function (id) {
        var s = stationFor(all[id]);
        if (byKey[s.key]) { if (byKey[s.key].ids.indexOf(id) < 0) byKey[s.key].ids.push(id); }
        else { byKey[s.key] = s; list.push(s); }
      });
      list.sort(function (a, b) { return (a.zone ? 1 : 0) - (b.zone ? 1 : 0); });
      return list;
    }
    /* Stations stand in up to two staggered rows on a rhombus platform, so
       every figure and name stays readable at phone width. */
    var GAP = 92, ROW = 82;
    function layout(stations) {
      var n = stations.length, back = n > 4 ? Math.floor(n / 2) : 0, front = n - back, width = Math.max(front, back + 0.5) * GAP;
      stations.forEach(function (s, i) {
        var inBack = i < back, k = inBack ? i : i - back, count = inBack ? back : front;
        s.pt = { x: (k - (count - 1) / 2) * GAP, y: inBack ? 0 : ROW };
      });
      var half = width / 2 + 46, cy = back ? ROW / 2 : ROW;
      return { half: half, cy: cy };
    }
    function renderRoom() {
      var ids = current.route ? current.route.ids : all.filter(function (e) { return e.muscles.indexOf(current.muscle) >= 0; }).map(function (e) { return e.id; });
      var stations = buildStations(ids);
      current.stations = stations;
      var size = layout(stations);
      // Rhombus platform centred under the rows, in the floor's 2:1 slope.
      var hx = size.half, hy = hx / 2, c = { x: 0, y: size.cy + 10 };
      var corners = [{ x: c.x, y: c.y - hy }, { x: c.x + hx, y: c.y }, { x: c.x, y: c.y + hy }, { x: c.x - hx, y: c.y }];
      var minX = -hx - 10, maxX = hx + 10, minY = Math.min(c.y - hy, -128) - 10, maxY = c.y + hy + 40;
      var W = maxX - minX, H = maxY - minY;
      function P(p) { return (p.x - minX).toFixed(1) + ',' + (p.y - minY).toFixed(1); }
      world.style.width = W + 'px'; world.style.height = H + 'px';
      floorSvg.setAttribute('width', W); floorSvg.setAttribute('height', H); floorSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var drop = function (p) { return { x: p.x, y: p.y + 16 }; };
      var grid = '', steps = 6;
      for (var i = 1; i < steps; i++) {
        var t = i / steps;
        grid += '<line x1="' + P({ x: corners[0].x + (corners[1].x - corners[0].x) * t, y: corners[0].y + (corners[1].y - corners[0].y) * t }).replace(',', '" y1="') + '" x2="' + P({ x: corners[3].x + (corners[2].x - corners[3].x) * t, y: corners[3].y + (corners[2].y - corners[3].y) * t }).replace(',', '" y2="') + '"/>';
        grid += '<line x1="' + P({ x: corners[0].x + (corners[3].x - corners[0].x) * t, y: corners[0].y + (corners[3].y - corners[0].y) * t }).replace(',', '" y1="') + '" x2="' + P({ x: corners[1].x + (corners[2].x - corners[1].x) * t, y: corners[1].y + (corners[2].y - corners[1].y) * t }).replace(',', '" y2="') + '"/>';
      }
      floorSvg.innerHTML = '<defs><radialGradient id="gy-glow" cx="50%" cy="50%" r="65%"><stop offset="0" stop-color="#3d1814"/><stop offset=".65" stop-color="#160d11"/><stop offset="1" stop-color="#0c0e14"/></radialGradient></defs>' +
        '<polygon class="gy-slab-side" points="' + [corners[3], corners[2], corners[1], drop(corners[1]), drop(corners[2]), drop(corners[3])].map(P).join(' ') + '"/>' +
        '<polygon class="gy-slab" points="' + corners.map(P).join(' ') + '"/><g class="gy-grid">' + grid + '</g><g class="gy-route"></g>';
      [].forEach.call(world.querySelectorAll('.gy-st'), function (n) { n.remove(); });
      stations.forEach(function (s) {
        var src = pose(s.still, true), b = el('button', 'gy-st' + (s.zone ? ' is-zone' : ''));
        b.type = 'button'; b.dataset.key = s.key;
        b.style.left = (s.pt.x - minX) + 'px'; b.style.top = (s.pt.y - minY) + 'px';
        b.innerHTML = '<span class="gy-pad"></span>' + (src ? '<img src="' + src + '" alt="" loading="lazy">' : '<span class="gy-ghost"></span>') +
          '<span class="gy-num" aria-hidden="true"></span><span class="gy-name">' + s.name + (s.zone && s.ids.length > 1 ? ' <em>' + s.ids.length + '</em>' : '') + '</span>';
        b.setAttribute('aria-label', s.name + (s.ids.length > 1 ? ', ' + s.ids.length + ' övningar' : ''));
        s.btn = b; world.appendChild(b);
      });
      if (current.route) {
        var stops = current.route.ids.map(function (id) { return stations.find(function (s) { return s.ids.indexOf(id) >= 0; }); });
        var pts = stops.map(function (s) { return P(s.pt); });
        world.querySelector('.gy-route').innerHTML = '<polyline class="gy-route-glow" points="' + pts.join(' ') + '"/><polyline class="gy-route-line" pathLength="100" points="' + pts.join(' ') + '"/>' +
          pts.map(function (p) { var c = p.split(','); return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="6"/>'; }).join('');
        stops.forEach(function (s, i) { var n = s.btn.querySelector('.gy-num'); n.textContent = n.textContent ? n.textContent + '·' + (i + 1) : String(i + 1); });
        // Stops that do not train the chosen muscle stay on the route but recede.
        stations.forEach(function (s) { s.btn.classList.toggle('is-other', !s.ids.some(function (id) { return all[id].muscles.indexOf(current.muscle) >= 0; })); });
      }
      root.classList.toggle('has-route', !!current.route);
      fitRoom(W, H);
      markChosen();
    }
    function fitRoom(W, H) {
      var vw = diorama.clientWidth, vh = diorama.clientHeight, s = Math.min(1.1, vw / W, vh / H);
      world.style.transform = 'translate(' + ((vw - W * s) / 2).toFixed(1) + 'px,' + ((vh - H * s) / 2).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
    }
    function renderRoutes() {
      var programs = explore.programs.filter(function (p) { return p.ids.some(function (id) { return all[id].muscles.indexOf(current.muscle) >= 0; }); });
      routeRow.innerHTML = programs.length ? programs.map(function (p) {
        return '<button type="button" class="gy-route-card" data-program="' + p.id + '" aria-pressed="' + (current.route === p) + '"><b>' + p.name + '</b><small>' + p.ids.length + ' stopp · ' + explore.durationLabel(p) + '</small></button>';
      }).join('') : '<p class="gy-muted">Inga färdiga rutter för ' + current.muscle.toLowerCase() + ' ännu.</p>';
    }
    routeRow.addEventListener('click', function (event) {
      var b = event.target.closest('[data-program]'); if (!b) return;
      var p = explore.programs.find(function (x) { return x.id === b.dataset.program; });
      closeSheet();
      current.route = current.route === p ? null : p; current.step = 0;
      renderRoutes(); renderRoom();
      if (current.route) setTimeout(function () { var id = p.ids[0]; openStation(current.stations.find(function (s) { return s.ids.indexOf(id) >= 0; }), id); }, 650);
    });
    function openRoom(muscle) {
      current.muscle = muscle; current.route = null;
      var count = ui.countFor(muscle);
      hero.src = 'assets/atlas-art-v1/' + ART[muscle] + '.webp';
      room.querySelector('.gy-hero-copy h1').textContent = muscle;
      root.classList.add('is-zooming');
      setTimeout(function () {
        room.hidden = false; root.dataset.view = 'room';
        renderRoutes(); renderRoom();
        var n = current.stations.length;
        room.querySelector('.gy-hero-copy p').textContent = count + (count === 1 ? ' övning' : ' övningar') + ' · ' + n + (n === 1 ? ' station' : ' stationer');
        requestAnimationFrame(function () { root.classList.remove('is-zooming'); });
        room.querySelector('.gy-back').focus({ preventScroll: true });
      }, 420);
    }
    function closeRoom() {
      closeSheet(); root.dataset.view = 'body';
      setTimeout(function () { room.hidden = true; }, 380);
      figure.style.transformOrigin = '';
      [].forEach.call(regions.querySelectorAll('.is-on'), function (g) { g.classList.remove('is-on'); });
      var g = regions.querySelector('[data-muscle="' + current.muscle + '"]'); if (g) g.focus({ preventScroll: true });
    }
    room.querySelector('.gy-back').addEventListener('click', closeRoom);
    world.addEventListener('click', function (event) {
      var b = event.target.closest('.gy-st'); if (!b) return;
      var s = current.stations.find(function (x) { return x.key === b.dataset.key; });
      var id = current.route ? current.route.ids.find(function (x) { return s.ids.indexOf(x) >= 0; }) : s.ids.find(function (x) { return all[x].muscles.indexOf(current.muscle) >= 0; });
      if (current.route) current.step = current.route.ids.indexOf(id);
      openStation(s, id);
    });

    /* ---- 3. Station sheet with the live figure ---- */
    var sheet = el('div', 'gy-sheet'); sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Station');
    sheet.innerHTML = '<div class="gy-grip" aria-hidden="true"></div><div class="gy-sheet-head"><span class="gy-eyebrow"></span><button type="button" class="gy-icon gy-sheet-close" aria-label="Stäng">' + closeIcon + '</button></div><div class="gy-stage"><img class="gy-poster" alt="" aria-hidden="true"></div><div class="gy-sheet-body"></div>';
    var poster = sheet.querySelector('.gy-poster');
    sheet.querySelector('.gy-stage').appendChild($('studio-stage'));
    function openStation(s, id) {
      if (!s) return;
      current.station = s; current.id = id;
      current.stations.forEach(function (x) { x.btn.classList.toggle('is-open', x === s); });
      ui.select(id); ui.setPaused(false);
      renderSheet(); root.classList.add('sheet-open');
    }
    function closeSheet() {
      if (!current.station) return;
      root.classList.remove('sheet-open'); ui.setPaused(true);
      current.stations.forEach(function (x) { x.btn.classList.remove('is-open'); });
      current.station = null;
    }
    function renderSheet() {
      var s = current.station, id = current.id, e = all[id], program = current.route;
      var dose = splitDose(explore.prescription(id, program || undefined).label), chosen = ui.selection().indexOf(id) >= 0;
      var still = pose(id, false); poster.hidden = !still; if (still) poster.src = still;
      var picks = s.ids.filter(function (x) { return program ? program.ids.indexOf(x) >= 0 : all[x].muscles.indexOf(current.muscle) >= 0; });
      sheet.querySelector('.gy-eyebrow').textContent = program ? 'Stopp ' + (current.step + 1) + ' av ' + program.ids.length + ' · ' + s.name : s.name;
      sheet.querySelector('.gy-sheet-body').innerHTML =
        '<div class="gy-title"><div><h2>' + e.name + '</h2><div class="gy-dose"><strong>' + dose.big + '</strong><span>' + dose.unit + '</span></div></div>' +
        '<button type="button" class="gy-add' + (chosen ? ' is-on' : '') + '" data-add aria-pressed="' + chosen + '" aria-label="' + (chosen ? 'Ta bort från Mitt pass' : 'Lägg till i Mitt pass') + '">' + (chosen ? '✓' : '+') + '</button></div>' +
        (picks.length > 1 && !program ? '<div class="gy-picks">' + picks.map(function (x) { return '<button type="button" data-pick="' + x + '" aria-pressed="' + (x === id) + '">' + all[x].name + '</button>'; }).join('') + '</div>' : '') +
        (program ? '<div class="gy-steps"><button type="button" data-step="-1" aria-label="Föregående stopp"' + (current.step ? '' : ' disabled') + '>‹</button><span>' + ecg() + '</span><button type="button" data-step="1" aria-label="Nästa stopp"' + (current.step < program.ids.length - 1 ? '' : ' disabled') + '>›</button></div>' +
          '<button type="button" class="gy-cta" data-copy-program>Kopiera passet till passbyggaren ↗</button>' : '');
    }
    sheet.addEventListener('click', function (event) {
      var t = event.target;
      if (t.closest('.gy-sheet-close') || t.closest('.gy-grip')) { closeSheet(); return; }
      if (t.closest('[data-add]')) { ui.toggle(current.id); renderSheet(); return; }
      var pick = t.closest('[data-pick]'); if (pick) { current.id = Number(pick.dataset.pick); ui.select(current.id); renderSheet(); return; }
      var step = t.closest('[data-step]');
      if (step && current.route) {
        current.step = Math.max(0, Math.min(current.route.ids.length - 1, current.step + Number(step.dataset.step)));
        var id = current.route.ids[current.step];
        openStation(current.stations.find(function (s) { return s.ids.indexOf(id) >= 0; }), id); return;
      }
      if (t.closest('[data-copy-program]') && current.route) ui.copyProgram(current.route.id);
    });
    var sheetY = null;
    sheet.addEventListener('pointerdown', function (event) { if (event.target.closest('.gy-grip')) sheetY = event.clientY; });
    sheet.addEventListener('pointerup', function (event) { if (sheetY != null && event.clientY - sheetY > 50) closeSheet(); sheetY = null; });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (current.station) closeSheet(); else if (root.dataset.view === 'room') closeRoom();
    });

    /* ---- Mitt pass ---- */
    var pass = el('button', 'gy-pass'); pass.type = 'button';
    function markChosen() {
      current.stations.forEach(function (s) { if (s.btn) s.btn.classList.toggle('is-chosen', s.ids.some(function (id) { return ui.selection().indexOf(id) >= 0; })); });
      var n = ui.selection().length;
      pass.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9"/></svg>' + (n ? '<em>' + n + '</em>' : '');
      pass.setAttribute('aria-label', 'Mitt pass, ' + n + ' övningar. Kopiera passförslag'); pass.hidden = !n;
    }
    pass.addEventListener('click', function () { ui.copySelection(); });
    new MutationObserver(function () { markChosen(); if (current.station) renderSheet(); }).observe($('living-pass-count'), { childList: true, characterData: true, subtree: true });

    [body, room, sheet, pass].forEach(function (n) { root.appendChild(n); });
    document.body.appendChild(root);
    renderBody(); markChosen();
    window.addEventListener('resize', function () { if (root.dataset.view === 'room') renderRoom(); });
  }

  function init() {
    if (!OWN) { start(window.PulseMuscleMap); return; }
    fetch('assets/silver-body-art-v1/map.json').then(function (r) { return r.json(); }).then(start).catch(function (error) { console.warn('Own body map unavailable', error); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
