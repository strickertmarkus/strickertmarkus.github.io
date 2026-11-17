/* Views, routing, the travelling dot, and everything rendered from data.js. */
(function () {
  'use strict';
  var S = window.SITE, Scene = window.Scene, COLOR = S.COLOR, CATNAME = S.CATNAME, PROJECTS = S.PROJECTS;
  var P = {}; PROJECTS.forEach(function (p) { P[p.id] = p; });
  var PALETTE = ['#FDBA74', '#38BDF8', '#86EFAC', '#F9A8B8', '#C4B5FD', '#5EEAD4'];
  var root = document.documentElement; root.classList.add('js');
  function reducedMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function $(id) { return document.getElementById(id); }
  function h(tag, cls, kids) {
    var e = document.createElement(tag); if (cls) e.className = cls;
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (k) { if (k == null) return; e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return e;
  }
  function arrow(dir) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    var a = document.createElementNS(s.namespaceURI, 'path'), b = document.createElementNS(s.namespaceURI, 'path');
    if (dir < 0) { a.setAttribute('d', 'M19 12H5'); b.setAttribute('d', 'M11 6l-6 6 6 6'); } else { a.setAttribute('d', 'M5 12h14'); b.setAttribute('d', 'M13 6l6 6-6 6'); }
    s.appendChild(a); s.appendChild(b); return s;
  }
  function linkTo(href, text, cls, dir) { var a = h('a', cls || 'link', dir < 0 ? [arrow(-1), text] : [text, arrow(1)]); a.href = href; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } return a; }
  function meta(p) { return [CATNAME[p.cat], p.where, p.period].filter(Boolean).join(' · '); }

  /* ---------- small generative pictures, one per project ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  if (!CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
  var cache = {};
  function pts(key, n, seed, fn) { if (!cache[key]) { var r = rng(seed), a = []; for (var i = 0; i < n; i++) a.push(fn(r, i)); cache[key] = a; } return cache[key]; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function dot(c, x, y, r, col, a) { c.globalAlpha = a * .18; c.fillStyle = col; c.beginPath(); c.arc(x, y, r * 3.2, 0, 6.283); c.fill(); c.globalAlpha = a; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); }
  var MOTIF = {
    loops: function (c, w, h, t, col) { /* magnetic loops on a stellar limb, one of them erupting */
      var R = h * 1.5, cx = w * .5, cy = h * 2.12, g = c.createRadialGradient(cx, cy, R * .86, cx, cy, R * 1.1);
      g.addColorStop(0, 'rgba(253,186,116,.1)'); g.addColorStop(.52, 'rgba(253,186,116,.34)'); g.addColorStop(.6, 'rgba(255,232,199,.95)'); g.addColorStop(.7, 'rgba(253,186,116,.3)'); g.addColorStop(1, 'rgba(253,186,116,0)');
      c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R * 1.1, 0, 6.283); c.fill();
      var L = pts('loops', 9, 3, function (r) { return [r() * 1.5 - .75, .18 + r() * .5, r()]; }), ph = (t * .13) % 1;
      c.strokeStyle = col; c.lineWidth = 1.2;
      L.forEach(function (l, i) {
        var a = -Math.PI / 2 + l[0] * .55, bx = cx + Math.cos(a) * R, by = cy + Math.sin(a) * R, s = h * l[1] * (i === 2 ? 1 + ph * 3.2 : 1 + Math.sin(t * .6 + l[2] * 6) * .05);
        c.globalAlpha = i === 2 ? (1 - ph) * .9 : .38; c.save(); c.translate(bx, by); c.rotate(a + Math.PI / 2); c.beginPath(); c.ellipse(0, 0, s * .42, s, 0, Math.PI, 0); c.stroke();
        if (i === 2) for (var k = 0; k < 9; k++) { var q = Math.PI + k / 8 * Math.PI; dot(c, Math.cos(q) * s * .42, Math.sin(q) * s, 1.4, '#FFE8C7', (1 - ph)); }
        c.restore();
      });
    },
    cluster: function (c, w, h, t, col) { /* a star cluster, slowly turning, with black holes near the core */
      var S2 = pts('cluster', 340, 5, function (r) { var u = Math.max(.02, r()), a = .16 / Math.sqrt(Math.pow(u, -2 / 3) - 1 + .08); return [Math.min(a, 1.4), r() * 6.283, .5 + r() * 1.2, r()]; });
      S2.forEach(function (s) { var a = s[1] + t * .12 / (s[0] + .25), x = w * .5 + Math.cos(a) * s[0] * h * 1.3, y = h * .5 + Math.sin(a) * s[0] * h * .8; dot(c, x, y, s[2], s[3] > .8 ? col : '#DCE3EC', .5 + s[3] * .4); });
      for (var i = 0; i < 3; i++) { var a2 = i * 2.1 + t * .5, x2 = w * .5 + Math.cos(a2) * h * .07 * (i + 1) * .7, y2 = h * .5 + Math.sin(a2) * h * .05 * (i + 1) * .7; c.globalAlpha = 1; c.fillStyle = '#05070B'; c.beginPath(); c.arc(x2, y2, 4.5, 0, 6.283); c.fill(); c.strokeStyle = col; c.lineWidth = 1.2; c.globalAlpha = .9; c.stroke(); }
    },
    spread: function (c, w, h, t, col) { /* stars being colonised outwards from one seed */
      var S2 = pts('spread', 150, 11, function (r) { return [r(), r(), .7 + r() * 1.1]; }), R = ((t * .07) % 1.25) * 1.15;
      S2.forEach(function (s, i) {
        var d = Math.hypot(s[0] - .3, (s[1] - .55) * .6), on = d < R;
        if (on && i % 2 === 0) { var b = S2[(i * 7 + 3) % S2.length], d2 = Math.hypot(b[0] - .3, (b[1] - .55) * .6); if (d2 < R && Math.hypot(b[0] - s[0], b[1] - s[1]) < .2) { c.globalAlpha = .22; c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.moveTo(s[0] * w, s[1] * h); c.lineTo(b[0] * w, b[1] * h); c.stroke(); } }
        dot(c, s[0] * w, s[1] * h, s[2] * (on ? 1.5 : 1), on ? col : '#DCE3EC', on ? .95 : .35);
      });
      c.globalAlpha = Math.max(0, .35 * (1 - R / 1.3)); c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.ellipse(.3 * w, .55 * h, R * w, R * w, 0, 0, 6.283); c.stroke();
    },
    collide: function (c, w, h, t, col) { /* two stars meeting and merging */
      var S2 = pts('collide', 240, 13, function (r, i) { var a = r() * 6.283, d = Math.sqrt(-2 * Math.log(Math.max(.001, r()))) * .5; return [Math.cos(a) * d, Math.sin(a) * d, i % 2, .6 + r()]; });
      var ph = (t * .1) % 1, e = ph < .5 ? 1 - Math.pow(1 - ph * 2, 3) : 1, sep = (1 - e) * w * .26, spin = Math.max(0, ph - .4) * 7, fade = ph > .9 ? (1 - ph) * 10 : Math.min(1, ph * 8);
      S2.forEach(function (s) { var sx = s[2] ? 1 : -1, r = h * .2 * (1 + (ph > .5 ? (ph - .5) * .9 : 0)), ca = Math.cos(spin * (1.2 - Math.hypot(s[0], s[1]) * .4)), sa = Math.sin(spin * (1.2 - Math.hypot(s[0], s[1]) * .4)), x = s[0] * ca - s[1] * sa, y = s[0] * sa + s[1] * ca; dot(c, w * .5 + sx * sep + x * r, h * .5 + y * r * .8 + sx * (1 - e) * h * .08, s[3], s[2] ? col : '#7DD3FC', .75 * fade); });
    },
    field: function (c, w, h, t) { /* flowing field lines */
      for (var i = 0; i < 16; i++) {
        var y0 = h * (.08 + i * .056), g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(56,189,248,0)'); g.addColorStop(.3, 'rgba(56,189,248,.8)'); g.addColorStop(.75, 'rgba(253,186,116,.9)'); g.addColorStop(1, 'rgba(253,186,116,0)');
        c.strokeStyle = g; c.lineWidth = 1.1; c.globalAlpha = .55; c.beginPath();
        for (var x = 0; x <= w; x += 8) { var u = x / w, y = y0 + Math.sin(u * 5 + t * .5 + i * .45) * h * .09 * Math.sin(u * Math.PI) + Math.sin(u * 11 - t * .3 + i) * h * .02; if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); }
        c.stroke();
        var u2 = (t * .08 + i * .137) % 1; dot(c, u2 * w, y0 + Math.sin(u2 * 5 + t * .5 + i * .45) * h * .09 * Math.sin(u2 * Math.PI) + Math.sin(u2 * 11 - t * .3 + i) * h * .02, 1.5, '#FFFFFF', Math.sin(u2 * Math.PI));
      }
    },
    vmodel: function (c, w, h, t, col) { /* the V-model: requirements down the left arm, each verified by a test on the right */
      var n = 4, mx = w * .5, top = h * .16, bot = h * .84, sp = Math.min(w * .34, h * 1.1), P2 = [], i, ph = (t * .08) % 1, prog = Math.min(1, ph / .78) * (2 * n - 1);
      for (i = 0; i < n; i++) P2.push([mx - sp * (1 - i / (n - 1) * .84), top + (bot - top) * i / (n - 1)]);
      for (i = n - 1; i >= 0; i--) P2.push([mx + sp * (1 - i / (n - 1) * .84), top + (bot - top) * i / (n - 1)]);
      c.lineWidth = 1.2; c.strokeStyle = '#DCE3EC'; c.globalAlpha = .26; c.beginPath(); P2.forEach(function (q, k) { if (k) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke();
      for (i = 0; i < n; i++) { /* a level is verified once the head has climbed back up to it */
        var a = P2[i], b = P2[2 * n - 1 - i], done = clamp01(prog - (2 * n - 1 - i) + 1);
        c.setLineDash([3, 6]); c.strokeStyle = col; c.globalAlpha = .12 + done * .5; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0] + (b[0] - a[0]) * (done || 1), a[1]); c.stroke(); c.setLineDash([]);
        if (done > .98) dot(c, (a[0] + b[0]) / 2, a[1], 2.6, '#86EFAC', 1);
      }
      P2.forEach(function (q, k) { var on = prog >= k; dot(c, q[0], q[1], on ? 3.6 : 2.6, on ? (k < n ? '#FDBA74' : col) : '#DCE3EC', on ? 1 : .4); });
      var k0 = Math.min(2 * n - 2, Math.floor(prog)), f = Math.min(1, prog - k0), A = P2[k0], Bq = P2[k0 + 1];
      if (ph < .8) dot(c, A[0] + (Bq[0] - A[0]) * f, A[1] + (Bq[1] - A[1]) * f, 3, '#FFFFFF', 1);
    },
    matrix: function (c, w, h, t, col) { /* a switch matrix closing one route at a time, beside a test sequence ticking off its steps */
      var rows = 5, cols = 8, x0 = w * .12, x1 = w * .58, y0 = h * .2, y1 = h * .76, dx = (x1 - x0) / (cols - 1), dy = (y1 - y0) / (rows - 1), i, j;
      var R2 = pts('matrix', 48, 23, function (r) { return [Math.floor(r() * rows), 1 + Math.floor(r() * (cols - 1))]; }), step = Math.floor(t * .55), ph = (t * .55) % 1, cur = R2[step % R2.length];
      c.lineWidth = 1; c.strokeStyle = '#DCE3EC'; c.globalAlpha = .1; c.beginPath();
      for (i = 0; i < rows; i++) { c.moveTo(x0 - 18, y0 + i * dy); c.lineTo(x1, y0 + i * dy); } for (j = 0; j < cols; j++) { c.moveTo(x0 + j * dx, y0); c.lineTo(x0 + j * dx, y1 + 18); } c.stroke();
      for (i = 0; i < rows; i++) for (j = 0; j < cols; j++) dot(c, x0 + j * dx, y0 + i * dy, 1.4, '#DCE3EC', .3);
      var ry = y0 + cur[0] * dy, cx2 = x0 + cur[1] * dx, la = cx2 - (x0 - 18), lb = y1 + 18 - ry, d = Math.min(1, ph * 1.5) * (la + lb);
      c.strokeStyle = col; c.lineWidth = 1.8; c.globalAlpha = .95; c.beginPath(); c.moveTo(x0 - 18, ry); c.lineTo(x0 - 18 + Math.min(d, la), ry); if (d > la) c.lineTo(cx2, ry + (d - la)); c.stroke();
      dot(c, x0 - 18, ry, 3, '#FDBA74', 1); if (d > la) dot(c, cx2, ry, 3.4, '#FFFFFF', 1); if (d >= la + lb - 1) dot(c, cx2, y1 + 18, 3, '#86EFAC', 1);
      var steps = 6, sx = w * .68, sw2 = w * .22, at = step % steps;
      for (i = 0; i < steps; i++) { var sy = h * (.2 + i * .112), passed = i < at, now = i === at; c.globalAlpha = passed ? .5 : now ? .95 : .16; c.fillStyle = now ? col : '#DCE3EC'; c.beginPath(); c.roundRect(sx, sy, sw2 * (now ? Math.min(1, ph * 1.5) : 1) * (.55 + ((i * 37) % 5) * .09), 5, 2.5); c.fill(); if (passed) dot(c, sx - 12, sy + 2.5, 2.4, '#86EFAC', 1); else if (now) dot(c, sx - 12, sy + 2.5, 2.4, '#FDBA74', .5 + .5 * Math.sin(t * 8)); }
    },
    pulse: function (c, w, h, t, col) { /* a heart-rate line running across, and a rest ring filling up */
      var y0 = h * .55, cx = w * .78, cy = h * .45, r = Math.min(w, h) * .2, ph = (t * .12) % 1;
      c.lineWidth = 1.6; c.strokeStyle = col; c.globalAlpha = .9; c.beginPath();
      for (var x = w * .06; x < w * .6; x += 2) {
        var u = ((x / w) * 3 - t * .6) % 1; u = u < 0 ? u + 1 : u;
        var beat = u > .42 && u < .5 ? Math.sin((u - .42) / .08 * Math.PI * 2) * (u < .46 ? -1 : .45) : 0;
        var y = y0 + beat * h * .28 + Math.sin(x * .05 + t) * 1.5; if (x === w * .06) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
      c.globalAlpha = .14; c.strokeStyle = '#DCE3EC'; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
      c.globalAlpha = .95; c.strokeStyle = '#FDBA74'; c.shadowColor = '#FDBA74'; c.shadowBlur = 14; c.lineCap = 'round';
      c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + ph * Math.PI * 2); c.stroke(); c.shadowBlur = 0; c.lineCap = 'butt';
    },
    grid: function (c, w, h, t, col) { /* a month of cells and a row of budget bars */
      var cols = 7, rowsN = 4, gw = w * .5, cell = gw / cols, x0 = w * .08, y0 = h * .16, hot = pts('grid', 28, 17, function (r) { return r(); });
      for (var i = 0; i < cols * rowsN; i++) { var x = x0 + (i % cols) * cell, y = y0 + Math.floor(i / cols) * cell * .82, on = hot[i] > .7, pu = .5 + .5 * Math.sin(t * 1.2 + i); c.globalAlpha = on ? .25 + pu * .5 : .1; c.fillStyle = on ? col : '#DCE3EC'; c.beginPath(); c.roundRect(x + 3, y + 3, cell - 6, cell * .82 - 6, 5); c.fill(); }
      var today = Math.floor((t * .6) % (cols * rowsN)); c.globalAlpha = 1; c.strokeStyle = '#FDBA74'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(x0 + (today % cols) * cell + 3, y0 + Math.floor(today / cols) * cell * .82 + 3, cell - 6, cell * .82 - 6, 5); c.stroke();
      for (var b = 0; b < 6; b++) { var bh = h * (.18 + .42 * (.5 + .5 * Math.sin(t * .5 + b * 1.3))), bx = w * .66 + b * w * .048; c.globalAlpha = .85; c.fillStyle = b % 2 ? '#38BDF8' : col; c.beginPath(); c.roundRect(bx, h * .84 - bh, w * .028, bh, 4); c.fill(); }
    },
    geometry: function (c, w, h, t, col) { /* Pythagoras: a right triangle and the squares on its sides */
      var u = h * .09, ox = w * .5 - 2 * u, oy = h * .5 + 1.6 * u, ph = (t * .09) % 1, k = Math.min(1, ph * 1.6);
      function poly(p, a, fill) { c.beginPath(); p.forEach(function (q, i) { var x = ox + q[0] * u, y = oy - q[1] * u; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath(); if (fill) { c.globalAlpha = a * .16; c.fillStyle = fill; c.fill(); } c.globalAlpha = a; c.stroke(); }
      c.lineWidth = 1.5; c.strokeStyle = '#DCE3EC'; poly([[0, 0], [4, 0], [0, 3]], 1);
      c.strokeStyle = col; poly([[0, 0], [4, 0], [4, -4], [0, -4]], k, col);
      c.strokeStyle = '#38BDF8'; poly([[0, 0], [0, 3], [-3, 3], [-3, 0]], Math.min(1, Math.max(0, ph * 1.6 - .25)), '#38BDF8');
      c.strokeStyle = '#FDBA74'; poly([[4, 0], [0, 3], [3, 7], [7, 4]], Math.min(1, Math.max(0, ph * 1.6 - .5)), '#FDBA74');
    }
  };
  var motifs = [];
  function motif(kind, hex, viewId) { var c = h('canvas', 'motif'); c.setAttribute('aria-hidden', 'true'); motifs.push({ el: c, kind: kind, hex: hex, view: viewId, drawn: false }); return c; }
  function motifWrap(p, viewId) { return h('span', 'motif-wrap', motif(p.motif, COLOR[p.cat], viewId)); }
  var mt = 0, mlast = 0;
  function drawMotifs(now) {
    var dt = Math.min(.05, (now - mlast) / 1000 || 0); mlast = now; if (!reducedMotion()) mt += dt;
    var vh = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (var i = motifs.length - 1; i >= 0; i--) {
      var m = motifs[i]; if (!m.el.isConnected) { motifs.splice(i, 1); continue; }
      if (m.view !== current.view && m.drawn) continue;
      var r = m.el.getBoundingClientRect(); if (r.width < 2 || (m.drawn && (r.bottom < 0 || r.top > vh))) continue;
      var w = Math.round(r.width * dpr), hh = Math.round(r.height * dpr); if (m.el.width !== w || m.el.height !== hh) { m.el.width = w; m.el.height = hh; }
      var c = m.el.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, r.width, r.height); c.globalCompositeOperation = 'lighter';
      MOTIF[m.kind](c, r.width, r.height, mt + i * 1.7, m.hex); m.drawn = true;
    }
    requestAnimationFrame(drawMotifs);
  }

  /* ---------- pieces shared by several views ---------- */
  function splitEl(split) {
    var bar = h('div', 'split-bar'), key = h('div', 'split-key');
    split.forEach(function (s, i) { var seg = h('i'); seg.style.flex = s[1] + ' 0 0'; seg.style.setProperty('--c', PALETTE[i % PALETTE.length]); seg.style.setProperty('--k', i); bar.appendChild(seg);
      var k = h('span', null, [h('i'), s[0] + ' ', h('b', null, s[1] + '%')]); k.firstChild.style.setProperty('--c', PALETTE[i % PALETTE.length]); key.appendChild(k); });
    var el = h('div', 'split', [bar, key]); el.setAttribute('role', 'img'); el.setAttribute('aria-label', split.map(function (s) { return s[0] + ' ' + s[1] + '%'; }).join(', ')); return el;
  }
  /* A .seg row is plain text with a glowing line that slides under the chosen item; other rows are pills. */
  function segPlace(el) { var bar = el.querySelector('.seg-bar'), b = el.querySelector('[aria-pressed="true"]'); if (!bar || !b || !b.offsetWidth) return; var i = b.querySelector('i'); bar.style.width = (b.offsetWidth - 24) + 'px'; bar.style.transform = 'translate(' + (b.offsetLeft + 12) + 'px,' + (b.offsetTop + b.offsetHeight - 6) + 'px)'; bar.style.setProperty('--c', i && i.style.color ? i.style.color : '#F0F6FC'); }
  function segAll() { document.querySelectorAll('.seg').forEach(segPlace); }
  window.addEventListener('resize', segAll); if (document.fonts && document.fonts.ready) document.fonts.ready.then(segAll);
  function chips(el, items, onPick) {
    items.forEach(function (it, i) { var b = h('button', null, it[2] ? [h('i'), it[1]] : it[1]); b.type = 'button'; b.setAttribute('data-v', it[0]); b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); if (it[2]) b.firstChild.style.color = it[2]; el.appendChild(b); });
    if (el.classList.contains('seg')) el.appendChild(h('span', 'seg-bar'));
    el.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; el.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); segPlace(el); onPick(b.getAttribute('data-v')); });
  }
  var CATCHIPS = [['all', 'All'], ['research', 'Research', COLOR.research], ['engineering', 'Engineering', COLOR.engineering], ['side', 'Side projects', COLOR.side]];

  /* ---------- home: the ticker, twice over so it loops without a seam ---------- */
  [0, 1].forEach(function () { S.TICKER.forEach(function (it) { var sp = h('span', null, it[0]); if (it[1]) sp.style.setProperty('--c', COLOR[it[1]]); $('ticker').appendChild(sp); }); });

  /* ---------- home: featured work ---------- */
  ['sv', 'cme', 'fam'].forEach(function (id, i) {
    var p = P[id], a = h('a', 'feat rv', [motifWrap(p, 'home'), h('span', 'feat-t', [h('span', 'eyebrow', meta(p)), h('h3', null, p.title), h('p', null, p.desc), h('span', 'link go', ['Open project', arrow(1)])])]);
    a.href = '#work/' + id; a.style.setProperty('--d', i); a.querySelector('.eyebrow').style.color = COLOR[p.cat]; a.querySelector('.eyebrow').style.display = 'block';
    $('home-work').appendChild(a);
  });

  /* ---------- work list ---------- */
  PROJECTS.forEach(function (p, i) {
    var n = h('span', 'n', (i < 9 ? '0' : '') + (i + 1)); n.style.color = COLOR[p.cat];
    var a = h('a', 'row rv', [n, motifWrap(p, 'work'), h('span', 't', [h('b', null, p.title), h('span', null, p.desc)]), h('span', 'm', [CATNAME[p.cat], p.period ? ' · ' + p.period : ''].join('')), arrow(1)]);
    a.href = '#work/' + p.id; a.setAttribute('data-cat', p.cat); a.style.setProperty('--d', Math.min(i, 5)); $('rows').appendChild(a);
  });
  chips($('work-chips'), CATCHIPS, function (v) { $('rows').querySelectorAll('.row').forEach(function (r) { r.classList.toggle('hide', v !== 'all' && r.getAttribute('data-cat') !== v); r.classList.add('in'); }); });

  /* ---------- project page ---------- */
  function block(b, p) {
    var el = h('section', 'block rv'), c = COLOR[p.cat];
    el.appendChild(h('h2', null, b.title));
    if (b.type === 'text') b.body.forEach(function (t) { el.appendChild(h('p', null, t)); });
    else if (b.type === 'list') { var ul = h('ul', 'lines'); ul.style.setProperty('--c', c); b.items.forEach(function (t) { ul.appendChild(h('li', null, t)); }); el.appendChild(ul); }
    else if (b.type === 'table') { var tb = h('div', 'tbl'); b.rows.forEach(function (r) { tb.appendChild(h('div', null, [h('span', null, r[0]), h('b', null, r[1])])); }); el.appendChild(tb); }
    else if (b.type === 'bars') { var bars = h('div', 'bars'); b.rows.forEach(function (r) { var bar = h('i'); bar.style.setProperty('--c', COLOR[r[2]]); bar.style.setProperty('--w', r[1] / b.max); bars.appendChild(h('div', 'bar-row', [h('span', null, r[0]), h('b', null, r[1] + ' ' + b.unit), bar])); }); el.appendChild(bars); if (b.note) el.appendChild(h('p', 'note', b.note)); }
    else if (b.type === 'dots') { var grid = h('div', 'dot-grid'), key = h('div', 'dot-key'), k = 0; b.groups.forEach(function (g) { for (var i = 0; i < g[0]; i++) { var d = h('i'); d.style.setProperty('--c', COLOR[g[2]]); d.style.setProperty('--k', k++); grid.appendChild(d); } var kk = h('span', null, [h('i'), g[0] + ' ' + g[1]]); kk.firstChild.style.setProperty('--c', COLOR[g[2]]); key.appendChild(kk); }); el.appendChild(h('div', 'dots', [grid, key])); }
    else if (b.type === 'quote') { el.className = 'block wide quote rv'; el.appendChild(h('p', null, b.body)); }
    return el;
  }
  /* The live demo: the real app in a phone, served by demo/sw.js with invented data and no Firebase.
     Wide screens get the phone inline; phones get a button that opens the demo full screen. */
  var demoReady = null;
  function demoWorker() {
    if (demoReady) return demoReady;
    demoReady = !('serviceWorker' in navigator) ? Promise.reject(new Error('no sw')) : navigator.serviceWorker.register('demo/sw.js', { scope: 'demo/' }).then(function (reg) {
      var w = reg.active || reg.waiting || reg.installing; if (reg.active) return reg;
      return new Promise(function (res, rej) { w.addEventListener('statechange', function () { if (w.state === 'activated') res(reg); else if (w.state === 'redundant') rej(new Error('sw failed')); }); });
    });
    return demoReady;
  }
  function demoBlock(demo, back) {
    var start = demo.src;
    var screen = h('div', 'demo-screen', h('p', 'demo-wait', 'Starting the demo…')), phoneEl = h('div', 'demo-phone', screen);
    var open = linkTo(start, 'Open the demo full screen'); open.removeAttribute('target'); open.removeAttribute('rel');
    var text = h('div', 'demo-text', [
      h('p', 'eyebrow', 'Try it'), h('h3', null, 'The real app, with invented data.'),
      h('p', null, demo.tip + ' Everything runs in your browser on made-up numbers and names. Nothing is saved, and nothing reaches the app my family uses.'),
      open, h('p', 'demo-note', 'Some parts need a login in the real app and are left out. Reload the page to start over.')
    ]);
    var el = h('section', 'block wide rv demo', [phoneEl, text]);
    open.addEventListener('click', function (e) { e.preventDefault(); try { sessionStorage.setItem('demoBack', back); } catch (_) {} demoWorker().then(function () { location.href = start; }, function () { open.textContent = 'The demo needs a newer browser.'; }); });
    if (!window.matchMedia('(max-width: 760px)').matches) {
      demoWorker().then(function () {
        if (!el.isConnected) return;
        var f = h('iframe'); f.src = start; f.title = 'Family app demo'; f.setAttribute('loading', 'lazy');
        f.addEventListener('load', function () { screen.classList.add('ready'); });
        screen.appendChild(f);
      }, function () { screen.firstChild.textContent = 'The demo needs a browser with service workers.'; });
    } else {
      var img = h('img'); img.src = 'img/family/' + demo.poster + '.jpg'; img.alt = ''; screen.textContent = ''; screen.appendChild(img); screen.classList.add('ready', 'poster');
      screen.addEventListener('click', function () { open.click(); });
    }
    return el;
  }

  /* Full-size view of one screen, with arrows and Esc. */
  var lb = null;
  function lightbox(list, at) {
    if (!lb) {
      lb = h('div', 'lb'); lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
      var img = h('img'), vid = h('video'), cap = h('p'), prev = h('button', 'lb-nav prev', arrow(-1)), next = h('button', 'lb-nav next', arrow(1)), close = h('button', 'lb-close', '×');
      prev.type = next.type = close.type = 'button'; prev.setAttribute('aria-label', 'Previous screen'); next.setAttribute('aria-label', 'Next screen'); close.setAttribute('aria-label', 'Close');
      vid.muted = true; vid.loop = true; vid.playsInline = true; vid.setAttribute('playsinline', '');
      lb.appendChild(h('figure', null, [img, vid, cap])); lb.appendChild(prev); lb.appendChild(next); lb.appendChild(close); document.body.appendChild(lb);
      lb.show = function (i) {
        lb.i = (i + lb.list.length) % lb.list.length; var sh = lb.list[lb.i], mov = sh[2] === 'video';
        img.hidden = mov; vid.hidden = !mov; cap.textContent = sh[1];
        if (mov) { vid.poster = 'img/family/' + sh[0] + '.jpg'; vid.src = 'img/family/' + sh[0] + '.mp4'; vid.play().catch(function () {}); } else { vid.pause(); vid.removeAttribute('src'); img.src = 'img/family/' + sh[0] + '.jpg'; img.alt = sh[1]; }
      };
      prev.addEventListener('click', function (e) { e.stopPropagation(); lb.show(lb.i - 1); });
      next.addEventListener('click', function (e) { e.stopPropagation(); lb.show(lb.i + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb || e.target === close) lb.close(); });
      lb.close = function () { lb.classList.remove('on'); vid.pause(); };
      document.addEventListener('keydown', function (e) { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') lb.close(); if (e.key === 'ArrowRight') lb.show(lb.i + 1); if (e.key === 'ArrowLeft') lb.show(lb.i - 1); });
    }
    lb.list = list; lb.show(at); lb.classList.add('on');
  }
  window.addEventListener('hashchange', function () { if (lb) lb.close(); });
  function renderProject(p) {
    var box = $('project'); box.textContent = ''; box.className = 'proj';
    var eb = h('p', 'eyebrow', [CATNAME[p.cat], p.kind, p.where, p.period].filter(function (x, i, all) { return x && all.indexOf(x) === i; }).join(' · ')); /* no repeated words when kind equals the category */ eb.style.color = COLOR[p.cat];
    box.appendChild(linkTo('#work', 'All work', 'link quiet back', -1)); box.appendChild(eb); box.appendChild(h('h1', null, p.title)); box.appendChild(h('p', 'lead', p.lead));
    if (!p.gallery) box.appendChild(h('div', 'proj-hero', motif(p.motif, COLOR[p.cat], 'project'))); /* real screens make the drawn picture unnecessary */
    if (p.stats.length) { var st = h('div', 'stats rv'); p.stats.forEach(function (s) { st.appendChild(h('div', null, [h('b', null, s[0]), h('span', null, s[1])])); }); box.appendChild(st); }
    var blocks = h('div', 'blocks');
    if (p.demo) blocks.appendChild(demoBlock(p.demo, '#work/' + p.id));
    if (p.gallery) { /* rows of phone screens; one tap opens the screen large */
      var gal = h('div', 'gal'), all = [];
      p.gallery.forEach(function (g) {
        var row = h('div', 'gal-row');
        g.shots.forEach(function (sh) {
          var img; /* a third field 'video' plays a short loop instead of a still */
          if (sh[2] === 'video') { img = h('video'); img.src = 'img/family/' + sh[0] + '.mp4'; img.poster = 'img/family/' + sh[0] + '.jpg'; img.muted = true; img.loop = true; img.autoplay = true; img.playsInline = true; img.setAttribute('playsinline', ''); img.setAttribute('aria-label', sh[1]); img.preload = 'metadata'; }
          else { img = h('img'); img.src = 'img/family/' + sh[0] + '.jpg'; img.alt = sh[1]; img.decoding = 'async'; } /* not lazy: Safari leaves lazy images unloaded in a sideways-scrolling row */
          img.width = 468; img.height = 1013;
          var btn = h('button', 'gal-shot', [img, h('span', null, sh[1])]); btn.type = 'button'; var at = all.length; all.push(sh);
          btn.addEventListener('click', function () { lightbox(all, at); }); row.appendChild(btn);
        });
        gal.appendChild(h('div', 'gal-group', [h('h3', null, g.title), row]));
      });
      blocks.appendChild(h('section', 'block wide rv', [h('h2', null, 'The app in use'), gal]));
    }
    if (p.split) blocks.appendChild(h('section', 'block wide rv', [h('h2', null, 'How the work was split'), splitEl(p.split)]));
    p.blocks.forEach(function (b) { blocks.appendChild(block(b, p)); });
    var facts = h('div', 'tbl'); p.facts.concat([['Built with', p.skills.join(', ')]]).forEach(function (r) { facts.appendChild(h('div', null, [h('span', null, r[0]), h('b', null, r[1])])); });
    blocks.appendChild(h('section', 'block rv', [h('h2', null, 'At a glance'), facts]));
    if (p.cite || p.links.length) { var pub = h('section', 'block wide rv', [h('h2', null, 'Publication')]); if (p.cite) pub.appendChild(h('p', 'cite', p.cite)); var ls = h('div', 'proj-links'); p.links.forEach(function (l) { ls.appendChild(linkTo(l[1], l[0])); }); pub.appendChild(ls); blocks.appendChild(pub); }
    box.appendChild(blocks);
    var nx = PROJECTS[(PROJECTS.indexOf(p) + 1) % PROJECTS.length], big = h('a', 'big', [h('small', null, 'Next project'), h('b', null, [nx.title, arrow(1)])]); big.href = '#work/' + nx.id;
    var see = h('button', 'link quiet', ['See it in the network']); see.type = 'button'; see.addEventListener('click', function () { Scene.select(p.id); location.hash = 'explore'; });
    box.appendChild(h('div', 'next', [see, big]));
  }

  /* ---------- explore panel ---------- */
  var panel = $('panel');
  function stepProject(d) { var id = Scene.selected(), i = P[id] ? PROJECTS.indexOf(P[id]) : -1; i = (i + d + PROJECTS.length) % PROJECTS.length; Scene.select(PROJECTS[i].id); }
  /* On phones the selection starts as a short summary so the network keeps the screen; the chevron or the title opens the rest. */
  var sheetEl = panel.parentNode, phone = window.matchMedia('(max-width: 760px)');
  function toggleSheet() {
    if (!phone.matches) return;
    var open = sheetEl.classList.toggle('open'), g = panel.querySelector('.grip'); if (g) g.setAttribute('aria-expanded', open ? 'true' : 'false');
    requestAnimationFrame(sheet);
  }
  function renderPanel(id) {
    panel.textContent = '';
    var p = P[id], grip = h('button', 'grip'), head = h('div', 'sheet-head', grip), more = h('div', 'more');
    grip.type = 'button'; grip.setAttribute('aria-label', 'Show or hide details'); grip.setAttribute('aria-expanded', sheetEl.classList.contains('open') ? 'true' : 'false');
    head.addEventListener('click', toggleSheet); panel.appendChild(head); panel.appendChild(more);
    if (p) {
      /* phones: the eyebrow keeps to one line, and where it happened moves into the details */
      var eb = h('p', 'eyebrow', phone.matches ? [CATNAME[p.cat], p.period].filter(Boolean).join(' · ') : meta(p)); eb.style.color = COLOR[p.cat]; head.appendChild(eb); head.appendChild(h('h3', null, p.title));
      more.appendChild(h('p', 'd', p.desc));
      var kv = h('div', 'kv'); (phone.matches ? [['Where', p.where]] : []).concat(p.facts).forEach(function (f) { kv.appendChild(h('div', null, [h('span', null, f[0]), h('b', null, f[1])])); }); more.appendChild(kv);
      more.appendChild(h('p', 'used', ['Built with ', h('b', null, p.skills.join(' · '))]));
      var b1 = h('button', null, arrow(-1)), b2 = h('button', null, arrow(1)); b1.type = b2.type = 'button'; b1.setAttribute('aria-label', 'Previous project'); b2.setAttribute('aria-label', 'Next project');
      b1.addEventListener('click', function () { stepProject(-1); }); b2.addEventListener('click', function () { stepProject(1); });
      panel.appendChild(h('div', 'acts', [linkTo('#work/' + p.id, 'Open project'), h('div', 'pager', [b1, h('span', null, (PROJECTS.indexOf(p) + 1) + ' / ' + PROJECTS.length), b2])]));
    } else {
      var isSkill = id.indexOf('s:') === 0, label = isSkill ? id.slice(2) : S.AREAS.filter(function (a) { return a.id === id; })[0].label;
      var list = PROJECTS.filter(function (q) { return Scene.linked(id, q.id); });
      head.appendChild(h('p', 'eyebrow', isSkill ? 'Skill' : 'Area')); head.appendChild(h('h3', null, label));
      head.appendChild(h('p', 'd', list.length === 1 ? 'Used in one project.' : 'Used in ' + list.length + ' projects.'));
      var pl = h('div', 'plist'); list.forEach(function (q) { var b = h('button', null, [q.short, h('span', null, CATNAME[q.cat])]); b.type = 'button'; b.addEventListener('click', function () { Scene.select(q.id); }); pl.appendChild(b); }); more.appendChild(pl);
    }
    panel.classList.remove('swap'); if (!document.body.classList.contains('boot')) { void panel.offsetWidth; panel.classList.add('swap'); }
    requestAnimationFrame(sheet);
  }
  /* Phones: the network is laid out below the short selection; opened details fold down over it on their own backdrop. */
  function sheet() { if (phone.matches && !sheetEl.classList.contains('open')) Scene.setSheetTop(sheetEl.getBoundingClientRect().bottom); }
  window.addEventListener('resize', sheet);
  /* Phones have no filter row: tapping an area in the network filters to it, tapping it again goes back to all. */
  var lastSel = null;
  Scene.onSelect(function (id) {
    var area = id.indexOf('d:') === 0;
    if (phone.matches) {
      if (area && id === lastSel) { lastSel = null; Scene.setFilter('all'); Scene.select(PROJECTS.filter(function (q) { return q.cat === id.slice(2); })[0].id); return; }
      Scene.setFilter(area ? id.slice(2) : 'all');
    }
    lastSel = id; renderPanel(id);
  });
  chips($('net-chips'), CATCHIPS, function (v) { Scene.setFilter(v); var p = P[Scene.selected()]; if (v !== 'all' && (!p || p.cat !== v)) Scene.select(PROJECTS.filter(function (q) { return q.cat === v; })[0].id); });
  document.addEventListener('keydown', function (e) { if (current.view !== 'explore' || /INPUT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'ArrowRight') { stepProject(1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { stepProject(-1); e.preventDefault(); } });

  /* ---------- about: competence ring and experience ---------- */
  (function () {
    var C = S.COMPETENCE, box = $('comp'), NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), R = 80, CIRC = 2 * Math.PI * R, GAP = 3, total = 0, start = 0;
    C.forEach(function (c) { total += c.weight; });
    svg.setAttribute('viewBox', '0 0 200 200'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Competence areas by share');
    var mid = h('div', 'ring-mid', [h('b'), h('span')]), tabs = h('div', 'comp-tabs'), items = h('ul', 'lines comp-items'), segs = [], btns = [];
    function pick(i, quiet) {
      segs.forEach(function (s, k) { s.classList.toggle('on', k === i); }); btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      mid.firstChild.textContent = Math.round(C[i].weight / total * 100) + '%'; mid.lastChild.textContent = C[i].name; mid.firstChild.style.color = C[i].color;
      items.textContent = ''; items.style.setProperty('--c', C[i].color); C[i].items.forEach(function (t) { items.appendChild(h('li', null, t)); });
      if (!quiet) { items.classList.remove('swap'); void items.offsetWidth; items.classList.add('swap'); }
    }
    C.forEach(function (c, i) {
      var len = c.weight / total * CIRC - GAP, s = document.createElementNS(NS, 'circle');
      s.setAttribute('cx', 100); s.setAttribute('cy', 100); s.setAttribute('r', R); s.setAttribute('stroke', c.color); s.style.color = c.color;
      s.setAttribute('stroke-dasharray', len + ' ' + (CIRC - len)); s.setAttribute('stroke-dashoffset', -start); start += c.weight / total * CIRC;
      s.addEventListener('click', function () { pick(i); }); s.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') pick(i); }); svg.appendChild(s); segs.push(s);
      var dotEl = h('i'); dotEl.style.setProperty('--c', c.color); var b = h('button', null, [dotEl, c.name]); b.type = 'button'; b.addEventListener('click', function () { pick(i); }); tabs.appendChild(b); btns.push(b);
    });
    box.appendChild(h('div', 'ring', [svg, mid])); box.appendChild(h('div', 'comp-list', [tabs, items])); pick(0, true);

    var exp = $('exp');
    S.GROUPS.forEach(function (g) {
      var head = h('h3', 'exp-g rv', g[1]); head.setAttribute('data-g', g[0]); exp.appendChild(head);
      S.EXPERIENCE.filter(function (x) { return x.g === g[0]; }).forEach(function (x) {
        var body = h('div', null, [h('h3', null, x.title), h('p', 'org', x.org)]);
        if (x.text) body.appendChild(h('p', 'tx', x.text));
        if (x.split) body.appendChild(splitEl(x.split));
        if (x.project) body.appendChild(linkTo('#work/' + x.project, 'See the project', 'link quiet'));
        var row = h('div', 'xp rv' + (/now/.test(x.y) ? ' now' : ''), [h('span', 'y', x.y), body]); row.setAttribute('data-g', g[0]); exp.appendChild(row);
      });
    });
    var SHORT = { current: 'Now', academic: 'Research', projects: 'Other work', lead: 'Leadership', edu: 'Education' }; /* short labels so the row fits on one line */
    chips($('exp-chips'), [['all', 'All']].concat(S.GROUPS.map(function (g) { return [g[0], SHORT[g[0]] || g[1]]; })), function (v) { exp.querySelectorAll('[data-g]').forEach(function (r) { r.classList.toggle('hide', v !== 'all' && r.getAttribute('data-g') !== v); r.classList.add('in'); }); });
  })();

  /* ---------- contact form ---------- */
  var form = $('contact-form'), note = $('form-note');
  form.addEventListener('submit', function (e) {
    if (!window.fetch || !window.FormData) return;
    e.preventDefault(); var btn = form.querySelector('.send'); btn.disabled = true; note.textContent = 'Sending…';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('send'); form.reset(); note.textContent = 'Thanks. I will get back to you soon.'; })
      .catch(function () { note.textContent = 'That did not go through. Please email me instead.'; })
      .then(function () { btn.disabled = false; });
  });
  /* ---------- CV: dark on screen, or the light sheet that also prints ---------- */
  /* "Open as paper" lays the CV out as a white sheet over the whole screen; print always uses that sheet. */
  var cvEl = document.querySelector('.cv'), paperBtn = $('paper'), printing = false, wasPaper = false;
  function setPaper(on) {
    cvEl.classList.toggle('paper', on); document.body.classList.toggle('paper-open', on); paperBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    paperBtn.firstChild.textContent = on ? 'Close paper ' : 'Open as paper '; viewEl('cv').scrollTop = 0;
  }
  paperBtn.addEventListener('click', function () { setPaper(!cvEl.classList.contains('paper')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('paper-open')) setPaper(false); });
  window.addEventListener('hashchange', function () { if (location.hash !== '#cv' && document.body.classList.contains('paper-open')) setPaper(false); });
  window.addEventListener('beforeprint', function () { if (printing) return; printing = true; wasPaper = cvEl.classList.contains('paper'); cvEl.classList.add('paper'); });
  window.addEventListener('afterprint', function () { printing = false; cvEl.classList.toggle('paper', wasPaper); });
  $('print').addEventListener('click', function () { window.print(); });
  /* Full history: the filter line and the reveals need the box open before they can be measured. */
  var hist = $('cv-history');
  hist.addEventListener('toggle', function () { if (hist.open) { segAll(); hist.querySelectorAll('.rv').forEach(function (r) { r.classList.add('in'); }); } });
  document.querySelector('.cv-more').addEventListener('click', function () { hist.open = true; });

  /* ---------- the travelling dot, ported from budget/pulse-bottom-nav-v1.js ---------- */
  var tabs = document.querySelector('.tabs'), ind = tabs.querySelector('.ind'), TABS = ['home', 'work', 'explore', 'about', 'cv'];
  var currentTab = null, running = null;
  function tabEl(name) { return tabs.querySelector('[data-go="' + name + '"]'); }
  function centre(name) { var a = tabEl(name); if (!a) return 0; var r = a.getBoundingClientRect(), n = tabs.getBoundingClientRect(); return r.left - n.left - tabs.clientLeft + r.width / 2; }
  function place(x, w) { ind.style.width = w + 'px'; ind.style.left = (x - w / 2) + 'px'; }
  function edgesOf(l, r) { return { width: (r - l) + 'px', left: l + 'px' }; }
  function travel(from, to, duration) {
    var a = centre(from), b = centre(to);
    if (running) { running.cancel(); running = null; }
    if (!ind.animate || reducedMotion() || from === to) { place(b, 4); return; }
    /* Like a worm: the front edge leads, the back edge starts a little later and catches up,
       so the bar is longest between the tabs and is a dot again exactly when it lands. */
    var front = function (t) { var x = Math.min(1, t / .78); return 1 - Math.pow(1 - x, 3); };
    var back = function (t) { var x = Math.max(0, Math.min(1, (t - .12) / .88)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    var at = function (t) { var f = a + (b - a) * front(t), k = a + (b - a) * back(t); return edgesOf(Math.min(f, k) - 2, Math.max(f, k) + 2); };
    var frames = [], steps = 16; for (var n = 0; n <= steps; n++) frames.push(at(n / steps));
    var lastF = frames[frames.length - 1]; ind.style.width = lastF.width; ind.style.left = lastF.left;
    var anim = ind.animate(frames, { duration: duration || 300, easing: 'linear' }); running = anim;
    anim.finished.then(function () { if (running === anim) running = null; }).catch(function () { });
  }
  function mark(name, animate) {
    var prev = currentTab; currentTab = name;
    tabs.querySelectorAll('[data-go]').forEach(function (a) { var on = a.getAttribute('data-go') === name; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (animate && prev && prev !== name) { var a = tabEl(name); a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop'); travel(prev, name, 300); }
    else if (!running) place(centre(name), 4);
  }
  window.addEventListener('resize', function () { if (!running && currentTab) place(centre(currentTab), 4); });

  /* ---------- routing and the slide between views ---------- */
  var ORDER = { home: 0, work: 1, project: 1.5, explore: 2, about: 3, cv: 4 };
  var current = { view: null, id: null }, token = 0;
  function viewEl(v) { return $('v-' + v); }
  function parse() {
    var x = location.hash.replace(/^#\/?/, '');
    if (!x) return { view: 'home' };
    if (x === 'contact') return { view: 'about', anchor: 'contact' };
    if (x.indexOf('work/') === 0 && P[x.slice(5)]) return { view: 'project', id: x.slice(5) };
    return ORDER[x] != null && x !== 'project' ? { view: x } : null;
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .08, rootMargin: '0px 0px -5% 0px' }) : null;
  /* What is already on screen is revealed straight away; the observer takes the rest as it scrolls in. */
  function reveal(el) {
    var fresh = [].slice.call(el.querySelectorAll('.rv:not(.in):not([data-o])'));
    fresh.forEach(function (r) { r.setAttribute('data-o', '1'); if (io) io.observe(r); else r.classList.add('in'); });
    requestAnimationFrame(function () { var vh = window.innerHeight; fresh.forEach(function (r) { var b = r.getBoundingClientRect(); if (b.top < vh * .96 && b.bottom > 0) r.classList.add('in'); }); });
  }
  function show(r, instant) {
    var same = current.view === r.view && current.id === (r.id || null);
    var oldEl = current.view ? viewEl(current.view) : null, newEl = viewEl(r.view), dir = current.view && ORDER[r.view] < ORDER[current.view] ? -1 : 1, my = ++token;
    function enter() {
      if (my !== token) return;
      if (r.view === 'project' && !same) { renderProject(P[r.id]); newEl.scrollTop = 0; }
      if (oldEl && oldEl !== newEl) oldEl.classList.remove('on', 'out-l', 'out-r');
      if (!instant && !same) { newEl.classList.remove('out-l', 'out-r'); newEl.classList.add('on', dir > 0 ? 'from-r' : 'from-l'); void newEl.offsetWidth; newEl.classList.remove('from-r', 'from-l'); } else newEl.classList.add('on');
      reveal(newEl); if (r.view === 'about') trace(); if (r.view === 'home') whatLines(); segAll();
      document.body.classList.toggle('scrolled', newEl.scrollTop > 10);
      if (r.anchor) { var t = $(r.anchor); if (t) setTimeout(function () { t.scrollIntoView({ behavior: instant || reducedMotion() ? 'auto' : 'smooth', block: 'start' }); }, instant ? 0 : 240); }
    }
    current = { view: r.view, id: r.id || null };
    mark(r.view === 'project' ? 'work' : r.view, !instant);
    Scene.setView(r.view); Scene.setScroll(r.view === 'home' ? newEl.scrollTop : 0);
    if (instant || same || !oldEl) { enter(); return; }
    if (oldEl === newEl) { oldEl.classList.add(dir > 0 ? 'out-l' : 'out-r'); oldEl.classList.remove('on'); setTimeout(enter, 100); return; }
    oldEl.classList.remove('on'); oldEl.classList.add(dir > 0 ? 'out-l' : 'out-r'); setTimeout(enter, 100);
  }
  window.addEventListener('hashchange', function () { var r = parse(); if (r) show(r); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href').slice(1), t = id && !/\//.test(id) && ORDER[id] == null && id !== 'contact' ? $(id) : null;
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }); }
    else if (id === 'contact' && current.view === 'about') { e.preventDefault(); $('contact').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }); }
  });

  /* ---------- scroll- and pointer-driven light ---------- */
  /* The line over each "What I do" item draws itself as the item scrolls up the screen. */
  var whatItems = [].slice.call(document.querySelectorAll('.what li'));
  function whatLines() { var vh = window.innerHeight; whatItems.forEach(function (li) { var r = li.getBoundingClientRect(); li.style.setProperty('--w', Math.max(0, Math.min(1, (vh * .92 - r.top) / (vh * .4))).toFixed(3)); }); }
  viewEl('home').addEventListener('scroll', function () { if (current.view === 'home') { Scene.setScroll(this.scrollTop); whatLines(); } }, { passive: true });
  window.addEventListener('resize', whatLines);
  var heroText = document.querySelector('.hero h1'), heroEl = document.querySelector('.hero'), tickerEl = document.querySelector('.ticker'), homeEl = viewEl('home');
  /* Where the network may sit on Home: right of the headline on wide screens, between the text and the ticker on phones. */
  function heroEdge() {
    var st = homeEl.scrollTop, bottom = 0; /* the lowest visible part of the hero: the links on wide screens, the caption on phones */
    [].forEach.call(heroEl.children, function (c) { if (c.offsetParent) bottom = Math.max(bottom, c.getBoundingClientRect().bottom); });
    Scene.setHomeBox(heroText.getBoundingClientRect().right + 28, bottom + st, tickerEl.getBoundingClientRect().top + st);
  }
  window.addEventListener('resize', heroEdge);
  var journey = $('journey');
  function trace() { var r = journey.getBoundingClientRect(); journey.style.setProperty('--p', Math.max(0, Math.min(1, (window.innerHeight * .62 - r.top) / Math.max(1, r.height))).toFixed(3)); }
  viewEl('about').addEventListener('scroll', trace, { passive: true });
  /* The top bar turns denser once the view in front has scrolled under it. */
  document.addEventListener('scroll', function (e) { var v = e.target; if (v && v.id === 'v-' + current.view) document.body.classList.toggle('scrolled', v.scrollTop > 10); }, true);
  var fx = document.querySelector('.fx');
  window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { fx.style.setProperty('--mx', e.clientX + 'px'); fx.style.setProperty('--my', e.clientY + 'px'); } }, { passive: true });

  /* ---------- start ---------- */
  document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('on'); });
  renderPanel(Scene.selected());
  heroEdge(); show(parse() || { view: 'home' }, true); Scene.snap();
  requestAnimationFrame(function () { place(centre(currentTab), 4); requestAnimationFrame(function () { document.body.classList.remove('boot'); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!running) place(centre(currentTab), 4); heroEdge(); });
  requestAnimationFrame(drawMotifs);
})();
