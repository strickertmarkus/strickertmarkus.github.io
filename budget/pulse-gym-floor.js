/* Isometric gym floor for the ?ui=gym preview: every machine and free-weight
   zone is a station on the floor, and a programme is drawn as a route through
   its stations with numbered stops. Used by the programme view in
   pulse-stories-ui.js; inert without the preview. */
(function () {
  'use strict';
  var POSES = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,21,22,23,25,26,30,34,35,43,44,45,52];
  var TW = 56, TH = 28, FLOOR = { w: 13, h: 13 };
  var MACHINE_SLOTS = [[1.5,1.5],[3.5,1.5],[5.5,1.5],[7.5,1.5],[1.5,3.5],[3.5,3.5],[5.5,3.5],[7.5,3.5],[1.5,5.5],[3.5,5.5],[5.5,5.5],[7.5,5.5],[1.5,7.5],[3.5,7.5],[5.5,7.5],[7.5,7.5]];
  var ZONES = {
    Kabel: { name: 'Kabeltornet', at: [10.8, 2.2] },
    'Skivstång': { name: 'Skivstångsracket', at: [10.8, 5.4] },
    Hantlar: { name: 'Hantelstället', at: [10.8, 8.6] },
    Kroppsvikt: { name: 'Mattan', at: [10.6, 11.4] }
  };
  var CARDIO_SLOTS = [[1.2,11.2],[3,11.2],[4.8,11.2],[6.6,11.2],[8.4,11.2]];
  var AREAS = [
    [[0.4,0.4],[8.6,0.4],[8.6,8.6],[0.4,8.6]],
    [[9.4,0.4],[12.6,0.4],[12.6,9.8],[9.4,9.8]],
    [[0.4,10.2],[9.4,10.2],[9.4,12.6],[0.4,12.6]],
    [[9.6,10.2],[12.6,10.2],[12.6,12.6],[9.6,12.6]]
  ];
  function iso(x, y) { return { x: (x - y) * TW / 2, y: (x + y) * TH / 2 }; }
  function pose(id) { return POSES.indexOf(Number(id)) >= 0 ? 'assets/exercise-poses-v1/' + String(id).padStart(2, '0') + '-end.webp' : ''; }

  var stations = null, byExercise = {};
  function build(all) {
    stations = [];
    all.filter(function (e) { return e.equipment === 'Maskin'; }).forEach(function (e, i) {
      stations.push({ name: e.name, ids: [e.id], at: MACHINE_SLOTS[i % MACHINE_SLOTS.length] });
    });
    all.filter(function (e) { return e.equipment === 'Konditionsmaskin'; }).forEach(function (e, i) {
      stations.push({ name: e.name, ids: [e.id], at: CARDIO_SLOTS[i % CARDIO_SLOTS.length] });
    });
    Object.keys(ZONES).forEach(function (equipment) {
      var ids = all.filter(function (e) { return e.equipment === equipment; }).map(function (e) { return e.id; });
      if (ids.length) stations.push({ name: ZONES[equipment].name, ids: ids, at: ZONES[equipment].at, zone: true });
    });
    stations.forEach(function (s) { s.ids.forEach(function (id) { byExercise[id] = s; }); s.pt = iso(s.at[0], s.at[1]); });
  }

  /* A floor showing the programme's route, framed on its stops. */
  function route(host, ids) {
    var all = window.PulseExplore.exercises;
    if (!stations) build(all);
    var minX = iso(0, FLOOR.h).x - 40, minY = -110, maxX = iso(FLOOR.w, 0).x + 40, maxY = iso(FLOOR.w, FLOOR.h).y + 40;
    var W = maxX - minX, H = maxY - minY;
    function P(x, y) { var p = iso(x, y); return (p.x - minX).toFixed(1) + ',' + (p.y - minY).toFixed(1); }
    var stops = ids.map(function (id) { return byExercise[id]; }).filter(Boolean);
    var grid = '';
    for (var g = 0; g <= FLOOR.w; g++) grid += '<polyline points="' + P(g, 0) + ' ' + P(g, FLOOR.h) + '"/><polyline points="' + P(0, g) + ' ' + P(FLOOR.w, g) + '"/>';
    var pts = stops.map(function (s) { return (s.pt.x - minX).toFixed(1) + ',' + (s.pt.y - minY).toFixed(1); });
    var svg = '<svg class="gf-floor" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<defs><radialGradient id="gf-glow" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#3a1714"/><stop offset=".6" stop-color="#140c10"/><stop offset="1" stop-color="#0a0d14"/></radialGradient></defs>' +
      '<polygon class="gf-slab" points="' + [P(0, 0), P(FLOOR.w, 0), P(FLOOR.w, FLOOR.h), P(0, FLOOR.h)].join(' ') + '"/>' +
      '<g class="gf-grid">' + grid + '</g>' +
      AREAS.map(function (a) { return '<polygon class="gf-area" points="' + a.map(function (q) { return P(q[0], q[1]); }).join(' ') + '"/>'; }).join('') +
      '<polyline class="gf-route-glow" points="' + pts.join(' ') + '"/><polyline class="gf-route-line" pathLength="100" points="' + pts.join(' ') + '"/></svg>';
    var world = document.createElement('div');
    world.className = 'gf-world'; world.style.width = W + 'px'; world.style.height = H + 'px';
    world.innerHTML = svg;
    stations.forEach(function (s) {
      var order = [];
      stops.forEach(function (x, i) { if (x === s) order.push(i + 1); });
      var on = order.length > 0, node = document.createElement('span');
      node.className = 'gf-st' + (on ? ' is-on' : '') + (s.zone ? ' is-zone' : '');
      node.style.left = (s.pt.x - minX) + 'px'; node.style.top = (s.pt.y - minY) + 'px';
      // A stop shows the exercise done there; other stations stay quiet pads.
      var still = on ? pose(ids[order[0] - 1]) : '';
      node.innerHTML = '<span class="gf-pad"></span>' + (still ? '<img src="' + still + '" alt="" loading="lazy">' : '') +
        (on ? '<span class="gf-num">' + order.join('·') + '</span>' : '');
      world.appendChild(node);
    });
    host.innerHTML = ''; host.appendChild(world);
    // Frame the stops: generous room above for the figures on their pads.
    var vw = host.clientWidth || 340, vh = host.clientHeight || 220;
    var xs = stops.map(function (s) { return s.pt.x - minX; }), ys = stops.map(function (s) { return s.pt.y - minY; });
    var bx = Math.min.apply(null, xs) - 50, by = Math.min.apply(null, ys) - 104, bw = Math.max.apply(null, xs) + 50 - bx, bh = Math.max.apply(null, ys) + 24 - by;
    var scale = Math.max(.42, Math.min(1.1, Math.min(vw / bw, vh / bh)));
    world.style.transform = 'translate(' + ((vw - bw * scale) / 2 - bx * scale).toFixed(1) + 'px,' + ((vh - bh * scale) / 2 - by * scale).toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
  }

  window.PulseGymFloor = { route: route };
})();
