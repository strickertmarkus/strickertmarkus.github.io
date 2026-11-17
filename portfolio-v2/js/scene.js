/* The background and the 3D network of skills, projects and areas.
   One canvas, drawn in three layers: drifting light, stars, and the network with additive glow.
   app.js drives it through window.Scene. */
(function () {
  'use strict';
  var S = window.SITE, COLOR = S.COLOR;
  var cv = document.getElementById('scene'), ctx = cv.getContext('2d');
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mix(a, b, k) { return a + (b - a) * k; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgba(hex, a) { var c = rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WHITE = '#DCE3EC';

  /* ---------- graph ---------- */
  var rand = rng(7);
  function farPoint() { var u = rand() * 2 - 1, th = rand() * Math.PI * 2, r = 560 + rand() * 240, q = Math.sqrt(1 - u * u); return [r * q * Math.cos(th), r * u * .7, r * q * Math.sin(th)]; }
  var nodes = [], byId = {}, edges = [], adj = {};
  /* The project column is grouped by area, in the same order as the area column, so each colour's lines run straight across
     instead of crossing the others. The Work list keeps its own order. */
  var AREA_AT = {}; S.AREAS.forEach(function (d, i) { AREA_AT[d.cat] = i; });
  var NET = S.PROJECTS.map(function (p, i) { return [p, i]; }).sort(function (x, y) { return AREA_AT[x[0].cat] - AREA_AT[y[0].cat] || x[1] - y[1]; }).map(function (x) { return x[0]; });
  NET.forEach(function (p) { nodes.push({ type: 'p', id: p.id, cat: p.cat, label: p.short, far: farPoint(), net: [0, 0, 0], jz: rand() - .5, flare: 0 }); });
  S.SKILLS.forEach(function (s) { nodes.push({ type: 's', id: 's:' + s, label: s, far: farPoint(), net: [0, 0, 0], jz: rand() - .5, flare: 0 }); });
  S.AREAS.forEach(function (d) { nodes.push({ type: 'd', id: d.id, cat: d.cat, label: d.label, far: farPoint(), net: [0, 0, 0], jz: 0, flare: 0 }); });
  nodes.forEach(function (n) { byId[n.id] = n; adj[n.id] = {}; });
  function link(a, b) { edges.push({ a: byId[a], b: byId[b], ph: rand(), sp: .22 + rand() * .2, pu: 0 }); adj[a][b] = 1; adj[b][a] = 1; }
  S.PROJECTS.forEach(function (p) { p.skills.forEach(function (s) { link('s:' + s, p.id); }); link(p.id, 'd:' + p.cat); });
  var stars = []; for (var i = 0; i < 260; i++) { var u = rand() * 2 - 1, th = rand() * Math.PI * 2, r = 1100 + rand() * 700, q = Math.sqrt(1 - u * u); stars.push([r * q * Math.cos(th), r * u, r * q * Math.sin(th), .2 + rand() * .55, .5 + rand() * .9, rand() * 6.28, .4 + rand() * 1.4]); }

  /* ---------- glow sprites ---------- */
  var sprites = {};
  function sprite(hex) {
    if (sprites[hex]) return sprites[hex];
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), col = rgb(hex);
    var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64), k = col[0] + ',' + col[1] + ',' + col[2];
    gr.addColorStop(0, 'rgba(' + k + ',.95)'); gr.addColorStop(.12, 'rgba(' + k + ',.55)'); gr.addColorStop(.36, 'rgba(' + k + ',.16)'); gr.addColorStop(.7, 'rgba(' + k + ',.04)'); gr.addColorStop(1, 'rgba(' + k + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); sprites[hex] = c; return c;
  }
  function glow(hex, x, y, r, a) { if (a <= .004 || r <= .5) return; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(sprite(hex), x - r, y - r, r * 2, r * 2); }

  /* ---------- state ---------- */
  var W = 0, H = 0, dpr = 1, narrow = false, D = 900;
  var view = 'home', cat = 'all', sel = byId.cme, hover = null, onSelect = null, onHover = null;
  var t = 0, last = 0, t0 = -1, scrollY = 0, homeLeft = 0, homeTop = 0, homeBottom = 0, sheetTop = 0;
  var cam = { cx: 0, cy: 0, zoom: 1, bright: 1, labels: 0, hx: 1, hy: 1 }, tgt = { cx: 0, cy: 0, zoom: 1, bright: 1, labels: 0, hx: 1, hy: 1 }, projNames = true;
  var userYaw = 0, userPitch = 0, userZoom = 1, first = true, mx = .5, my = .5, pmx = .5, pmy = .5;
  /* drifting light: [colour, x, y, radius, alpha] per view, as fractions of the screen */
  var LIGHT = {
    home: [['#FDBA74', .78, .42, .62, .2], ['#38BDF8', .12, .9, .6, .13], ['#A78BFA', .95, 1.02, .5, .1]],
    work: [['#38BDF8', .86, .2, .6, .17], ['#FDBA74', .05, .95, .55, .12], ['#A78BFA', .5, 1.1, .5, .08]],
    project: [['#FDBA74', .5, -.05, .7, .15], ['#38BDF8', 1, .8, .55, .11], ['#A78BFA', 0, .7, .5, .08]],
    explore: [['#FDBA74', .34, .5, .6, .13], ['#38BDF8', .05, .1, .55, .1], ['#A78BFA', .7, 1.05, .55, .1]],
    about: [['#86EFAC', .9, .15, .55, .1], ['#FDBA74', .1, .75, .6, .14], ['#38BDF8', .8, 1.05, .5, .1]],
    cv: [['#38BDF8', .95, .05, .55, .1], ['#FDBA74', 0, 1, .55, .09], ['#A78BFA', .6, 1.1, .45, .06]]
  };
  var lights = LIGHT.home.map(function (l) { return { col: rgb(l[0]), x: l[1], y: l[2], r: l[3], a: l[4] }; });

  function layout() {
    var LX = narrow ? [-135, 0, 135] : [-300, 0, 290], sStep = narrow ? 32 : 40, pStep = narrow ? 40 : 50, dStep = narrow ? 110 : 132, zs = narrow ? 70 : 150;
    var si = 0, pi = 0, di = 0, ns = S.SKILLS.length, np = S.PROJECTS.length;
    nodes.forEach(function (n) {
      if (n.type === 's') { n.net = [LX[0], (si - (ns - 1) / 2) * sStep, n.jz * zs * .35]; si++; }
      else if (n.type === 'p') { n.net = [LX[1], (pi - (np - 1) / 2) * pStep, n.jz * zs * .8]; pi++; }
      else { n.net = [LX[2], (di - 1) * dStep, 0]; di++; }
    });
  }
  function aim() {
    var sw = narrow ? 380 : 860, sh = narrow ? 440 : 540;
    tgt.hx = 1; tgt.hy = 1; projNames = true;
    if (view === 'explore') {
      /* Phones: the network fills what is left between the selection (sheetTop is its bottom edge) and the bottom bar. */
      var top3 = (sheetTop || H * .4) + 14, ah = narrow ? window.innerHeight - 96 - top3 : H - 250, aw = narrow ? W : W - 372 - 64 - 40;
      tgt.zoom = clamp(Math.min(aw / sw, ah / sh), .3, 1.5);
      tgt.cx = narrow ? W / 2 : 32 + aw / 2 + 20; tgt.cy = narrow ? top3 + ah / 2 : H / 2 + 44; tgt.bright = 1; tgt.labels = 1;
      if (narrow) { /* height decides the size; the columns are squeezed sideways so skill and area names stay on screen */
        var half3 = (W - 98 - 104) / 2; tgt.zoom = clamp(ah / 380, .3, 1.3); tgt.hx = half3 / (135 * tgt.zoom); tgt.cx = 98 + half3;
      }
    } else if (view === 'home') {
      if (narrow) { /* between the hero text and the ticker, with skill names on the left and area names on the right */
        var top2 = homeTop || H * .46, room2 = (homeBottom || H * .8) - top2 - 40, padL = 98, padR = 104, half = (W - padL - padR) / 2;
        tgt.zoom = 1; tgt.hx = half / 135; tgt.hy = clamp(room2 / 380, .3, 1); projNames = false;
        tgt.cx = padL + half; tgt.cy = top2 + 26 + room2 / 2; tgt.labels = room2 >= 140 ? .85 : 0; tgt.bright = room2 >= 80 ? 1 : 0; return done();
      }
      else {
        /* The network gets the space to the right of the hero text, with its names. The columns are squeezed
           sideways (hx) before any names are dropped: every name from about 530 px of room, skills and areas
           from 430, and with less than that it sits behind the text, dimmed and unnamed. */
        var left = homeLeft || W * .5, room = W - left - 28, span = 590, namesW = 180;
        if (room < 430) { tgt.zoom = .8; tgt.cx = W * .8; tgt.cy = H * .5; tgt.labels = 0; tgt.bright = .22; return done(); }
        var z = clamp((H - 250) / sh, .45, 1.05), cols = Math.min(span * z, room - namesW);
        tgt.zoom = z; tgt.hx = cols / (span * z); projNames = cols * (290 / span) >= 170;
        tgt.cx = left + (room - cols - namesW) / 2 + 85 + cols * (300 / span); tgt.cy = (H + 46) / 2; tgt.labels = .8; tgt.bright = 1; return done();
      }
      tgt.bright = 1;
    } else {
      tgt.zoom = narrow ? .8 : 1.2; tgt.cx = narrow ? W * .5 : W * 1.02; tgt.cy = narrow ? H * .24 : H * .46; tgt.labels = 0; /* wide: mostly past the right edge, clear of the text */
      tgt.bright = narrow ? 0 : (view === 'cv' ? .06 : .14); /* phones: text takes the whole width, so no network behind it */
    }
    done();
  }
  function done() { if (first) { for (var k in tgt) cam[k] = tgt[k]; first = false; } }
  function resize() {
    /* The canvas is as tall as the largest viewport (100lvh), so Safari's toolbar showing and hiding while you scroll does not move the network. */
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = cv.clientHeight || window.innerHeight; narrow = W <= 760;
    var pw = Math.round(W * dpr), ph = Math.round(H * dpr); if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    layout(); aim();
  }

  var cyw = 1, syw = 0, cpt = 1, spt = 0, liftY = 0;
  function pr(p) {
    var x = p[0] * cyw - p[2] * syw, z = p[0] * syw + p[2] * cyw;
    var y = p[1] * cpt - z * spt, z2 = p[1] * spt + z * cpt;
    var dep = D + z2; if (dep < 160) return null;
    var s = cam.zoom * userZoom * D / dep;
    return [cam.cx + x * s * cam.hx, cam.cy - liftY + y * s * cam.hy, s, z2];
  }
  function bez(A, B, mxp, u) { var v = 1 - u; return [v * v * v * A[0] + 3 * v * v * u * mxp + 3 * v * u * u * mxp + u * u * u * B[0], v * v * v * A[1] + 3 * v * v * u * A[1] + 3 * v * u * u * B[1] + u * u * u * B[1]]; }

  /* ---------- frame ---------- */
  var hits = [];
  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (!reduced) t += dt;
    var k = reduced ? 1 : 1 - Math.exp(-dt * 4.2), kl = reduced ? 1 : 1 - Math.exp(-dt * 1.4);
    for (var key in cam) { cam[key] += (tgt[key] - cam[key]) * k; if (Math.abs(tgt[key] - cam[key]) < .0005) cam[key] = tgt[key]; }
    pmx += (mx - pmx) * k; pmy += (my - pmy) * k;
    var clock = performance.now(); if (t0 < 0) t0 = clock;
    var m = reduced ? 1 : clamp((clock - t0) / 1900, 0, 1), me = 1 - Math.pow(1 - m, 3);
    var explore = view === 'explore';
    var yaw = userYaw + Math.sin(t * .23) * .26 + (1 - me) * 1.2 + (explore ? 0 : (pmx - .5) * .22);
    var pitch = clamp(.1 + userPitch + (1 - me) * .4 + (explore ? 0 : (pmy - .5) * .12), -.5, 1.1);
    cyw = Math.cos(yaw); syw = Math.sin(yaw); cpt = Math.cos(pitch); spt = Math.sin(pitch);
    /* On Home the network belongs to the hero: it scrolls away with it and fades out. */
    var home = view === 'home', fade = home ? 1 - clamp(scrollY / (H * .5), 0, 1) : 1, lift = home ? scrollY * (narrow ? 1 : .9) : 0;
    var B = cam.bright * fade, i, p, n;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);

    /* drifting light */
    var L = LIGHT[view] || LIGHT.cv, base = Math.max(W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < lights.length; i++) {
      var l = lights[i], tc = rgb(L[i][0]);
      l.col[0] += (tc[0] - l.col[0]) * kl; l.col[1] += (tc[1] - l.col[1]) * kl; l.col[2] += (tc[2] - l.col[2]) * kl;
      l.x += (L[i][1] - l.x) * kl; l.y += (L[i][2] - l.y) * kl; l.r += (L[i][3] - l.r) * kl; l.a += (L[i][4] - l.a) * kl;
      var lx = (l.x + Math.sin(t * .11 + i * 2.1) * .05 + (pmx - .5) * .04) * W, ly = (l.y + Math.cos(t * .09 + i * 1.7) * .05 + (pmy - .5) * .04) * H, lr = l.r * base;
      var g = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr), kc = Math.round(l.col[0]) + ',' + Math.round(l.col[1]) + ',' + Math.round(l.col[2]);
      g.addColorStop(0, 'rgba(' + kc + ',' + l.a + ')'); g.addColorStop(.45, 'rgba(' + kc + ',' + l.a * .35 + ')'); g.addColorStop(1, 'rgba(' + kc + ',0)');
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    /* stars */
    ctx.fillStyle = '#FFFFFF'; liftY = 0;
    for (i = 0; i < stars.length; i++) { var st = stars[i]; p = pr(st); if (!p) continue; ctx.globalAlpha = st[3] * (.55 + .45 * Math.sin(t * st[6] + st[5])) * (.45 + .55 * B); ctx.beginPath(); ctx.arc(p[0], p[1], st[4] * Math.min(1.4, p[2] * 1.6), 0, 6.283); ctx.fill(); }

    /* A hidden network is not drawn at all. Safari paints wide additive strokes at near-zero opacity as solid white. */
    if (B < .01) { hits = []; ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; requestAnimationFrame(frame); return; }

    /* node positions */
    liftY = lift;
    var focus = explore && cam.labels > .5 ? (hover || sel) : null;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      n.pos = [mix(n.far[0], n.net[0], me), mix(n.far[1], n.net[1], me), mix(n.far[2], n.net[2], me)];
      n.scr = pr(n.pos);
      var emph = !focus || n === focus || adj[focus.id][n.id];
      var filt = cat === 'all' || !n.cat || n.cat === cat;
      n.vis = mix(.4, 1, me) * (emph ? 1 : .5) * (filt ? 1 : .22);
      n.rad = n.type === 'p' ? mix(1.5, 6.5, me) : n.type === 's' ? mix(1.3, 4, me) : mix(1.5, 7.5, me);
      n.flare *= Math.exp(-dt * 2.6);
    }

    /* edges: a soft wide stroke under a thin bright one, then pulses with a short tail */
    for (i = 0; i < edges.length; i++) {
      var e = edges[i], A = e.a.scr, Bp = e.b.scr; if (!A || !Bp) continue;
      var hl = focus && (e.a === focus || e.b === focus);
      var filt2 = cat === 'all' || e.a.cat === cat || e.b.cat === cat;
      var al = me * me * (focus ? (hl ? .85 : .11) : .2) * (filt2 ? 1 : .3) * B;
      var cb = e.b.cat ? COLOR[e.b.cat] : WHITE, ca = e.a.cat ? COLOR[e.a.cat] : WHITE;
      var gr = ctx.createLinearGradient(A[0], A[1], Bp[0], Bp[1]); gr.addColorStop(0, rgba(ca, 1)); gr.addColorStop(1, rgba(cb, 1));
      var mxp = (A[0] + Bp[0]) / 2;
      ctx.strokeStyle = gr; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.bezierCurveTo(mxp, A[1], mxp, Bp[1], Bp[0], Bp[1]);
      ctx.globalAlpha = al * (hl ? .22 : .14); ctx.lineWidth = hl ? 7 : 4.5; ctx.stroke();
      ctx.globalAlpha = al; ctx.lineWidth = hl ? 1.5 : 1; ctx.stroke();
      if (!reduced) {
        var u = (t * e.sp + e.ph) % 1; if (u < e.pu) e.b.flare = Math.max(e.b.flare, hl || !focus ? 1 : .35); e.pu = u;
        var pa = me * me * (focus ? (hl ? 1 : .18) : .6) * (filt2 ? 1 : .3) * B;
        for (var j = 0; j < 5; j++) { var uu = u - j * .022; if (uu < 0) break; var q = bez(A, Bp, mxp, uu); glow(cb, q[0], q[1], (hl ? 9 : 6.5) * (1 - j * .16), pa * (1 - j * .2)); }
      }
    }

    /* nodes, far to near */
    var order = nodes.filter(function (n) { return n.scr; });
    order.sort(function (a, b) { return b.scr[3] - a.scr[3]; });
    hits = [];
    var lab = clamp((me - .6) / .4, 0, 1);
    for (i = 0; i < order.length; i++) {
      n = order[i]; p = n.scr;
      var isSel = n === sel && explore && cam.labels > .5;
      var depth = clamp(1 - p[3] / 1500, .4, 1.15), r = n.rad * clamp(p[2], .5, 1.7) * Math.min(1, .35 + cam.hy * .9) * (isSel ? 1.35 : 1), c = n.cat ? COLOR[n.cat] : WHITE, a = n.vis * depth * B;
      ctx.globalCompositeOperation = 'lighter';
      glow(c, p[0], p[1], r * (5.5 + n.flare * 4) * (isSel ? 1.5 : 1), a * (.5 + n.flare * .45));
      ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 6.283); ctx.fill();
      ctx.globalAlpha = Math.min(1, a * (.55 + n.flare * .45)); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(p[0], p[1], r * .42, 0, 6.283); ctx.fill();
      if (isSel) {
        ctx.strokeStyle = c; ctx.globalAlpha = .9 * cam.labels; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p[0], p[1], r + 6, 0, 6.283); ctx.stroke();
        var pu = reduced ? 0 : (t * .6) % 1; ctx.globalAlpha = (1 - pu) * .45 * cam.labels; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p[0], p[1], r + 6 + pu * 20, 0, 6.283); ctx.stroke();
      }
      if (n === hover && n !== sel) { ctx.strokeStyle = c; ctx.globalAlpha = .6; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p[0], p[1], r + 5, 0, 6.283); ctx.stroke(); }
      if (me > .8) hits.push(n);
      var la = cam.labels * lab * fade * clamp(n.vis * 1.1, .3, 1);
      if (la < .03) continue;
      var strong = focus && (n === sel || n === hover || adj[focus.id][n.id]);
      ctx.globalCompositeOperation = 'source-over'; ctx.textBaseline = 'middle'; ctx.globalAlpha = la;
      if (n.type === 'p') {
        if (!projNames || (narrow && n !== sel && n !== hover)) continue;
        ctx.font = ((n === sel || n === hover) && focus ? '600 13px ' : '500 12px ') + 'Inter,system-ui,sans-serif';
        ctx.fillStyle = strong ? '#F0F6FC' : '#B6BEC9'; ctx.textAlign = 'left'; ctx.fillText(n.label, p[0] + r + (isSel ? 18 : 9), p[1]); /* clear of the selection ring */
      } else {
        if (n.type === 's' && narrow && cam.zoom < .5 && !strong) continue; /* small phones: only the skills of the selection are named */
        ctx.font = (n.type === 'd' ? '600 12px ' : '500 11.5px ') + 'Inter,system-ui,sans-serif';
        ctx.fillStyle = n.type === 'd' ? COLOR[n.cat] : (strong ? '#F0F6FC' : '#B6BEC9');
        if (n.type === 's') { ctx.textAlign = 'right'; ctx.fillText(n.label, p[0] - r - 8, p[1]); }
        else { ctx.textAlign = 'left'; ctx.fillText(n.label, p[0] + r + (isSel ? 18 : 9), p[1]); }
      }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  /* ---------- pointer ---------- */
  var ptrs = {}, dragged = false, downAt = null, pinch = 0;
  function pick(x, y) { var best = null, bd = 26 * 26; for (var i = 0; i < hits.length; i++) { var n = hits[i], dx = n.scr[0] - x, dy = n.scr[1] - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = n; } } return best; }
  function setHover(h) { if (h === hover) return; hover = h; cv.style.cursor = h ? 'pointer' : 'grab'; if (onHover) onHover(h ? h.id : null); }
  window.addEventListener('pointermove', function (e) { mx = e.clientX / Math.max(1, W); my = e.clientY / Math.max(1, H); }, { passive: true });
  cv.addEventListener('pointerdown', function (e) {
    if (view !== 'explore') return; ptrs[e.pointerId] = [e.clientX, e.clientY]; try { cv.setPointerCapture(e.pointerId); } catch (_) { }
    var ids = Object.keys(ptrs); if (ids.length === 1) { downAt = [e.clientX, e.clientY]; dragged = false; }
    else if (ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); dragged = true; }
  });
  cv.addEventListener('pointermove', function (e) {
    if (view !== 'explore') return; var ids = Object.keys(ptrs);
    if (!ptrs[e.pointerId]) { setHover(pick(e.clientX, e.clientY)); return; }
    var prev = ptrs[e.pointerId]; ptrs[e.pointerId] = [e.clientX, e.clientY];
    if (ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch > 0) userZoom = clamp(userZoom * d / pinch, .6, 2.4); pinch = d; return; }
    if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) dragged = true;
    if (dragged) { userYaw = clamp(userYaw + (e.clientX - prev[0]) * .006, -1.2, 1.2); userPitch = clamp(userPitch + (e.clientY - prev[1]) * .004, -.55, .6); cv.style.cursor = 'grabbing'; }
  });
  function up(e) {
    if (!ptrs[e.pointerId]) return; delete ptrs[e.pointerId]; pinch = 0; cv.style.cursor = view === 'explore' ? 'grab' : 'default';
    if (view === 'explore' && !dragged && e.type === 'pointerup') { var h = pick(e.clientX, e.clientY); if (h) api.select(h.id); }
  }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', function () { setHover(null); });
  cv.addEventListener('wheel', function (e) { if (view !== 'explore') return; e.preventDefault(); userZoom = clamp(userZoom * Math.exp(-e.deltaY * .0012), .6, 2.4); }, { passive: false });

  var api = {
    setView: function (v) { view = v; hover = null; aim(); cv.style.cursor = v === 'explore' ? 'grab' : 'default'; },
    setScroll: function (px) { scrollY = Math.max(0, px); },
    setHomeBox: function (left, top, bottom) { homeLeft = left; homeTop = top; homeBottom = bottom; if (view === 'home') aim(); },
    setSheetTop: function (px) { sheetTop = px; if (view === 'explore') aim(); },
    setFilter: function (c) { cat = c; },
    select: function (id) { var n = byId[id]; if (!n) return; sel = n; n.flare = 1; if (onSelect) onSelect(id); },
    selected: function () { return sel.id; },
    linked: function (id, other) { return !!adj[id][other]; },
    onSelect: function (f) { onSelect = f; }, onHover: function (f) { onHover = f; },
    snap: function () { first = true; aim(); }
  };
  window.Scene = api;
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
