/* Performance overlay for measuring on the real phone (P01/P02).
   Turn on with ?perf=1 on any page that has the loader, off with ?perf=0.
   Shows frame rate, long frames, which files run animation loops and timers,
   Firebase reads and WebGL contexts. It only observes; it changes no behaviour. */
(function () {
  'use strict';
  if (window.__perfHud) return;
  var HUD = window.__perfHud = { raf: {}, iv: {}, ivMs: 0, gets: 0, getKeys: {}, listeners: 0, gl: 0, longTasks: 0, longestTask: 0, frames: [], started: performance.now() };
  var own = new WeakSet();
  var hudInterval = window.setInterval.bind(window); // the HUD's own timers stay out of the counts

  function sourceOf(skip) {
    var lines = String(new Error().stack || '').split('\n').slice(skip);
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/\/([\w.-]+\.(?:js|html))(?:\?[^:)\s]*)?:\d+/);
      if (m && m[1] !== 'perf-hud.js') return m[1];
    }
    return 'inline';
  }
  function bump(map, key) { map[key] = (map[key] || 0) + 1; }

  function instrument(win, tag) {
    if (!win || win.__perfHudPatched) return;
    win.__perfHudPatched = true;
    var nativeRaf = win.requestAnimationFrame.bind(win);
    win.requestAnimationFrame = function (cb) {
      if (own.has(cb)) return nativeRaf(cb);
      var src = tag + sourceOf(2);
      return nativeRaf(function (t) { bump(HUD.raf, src); cb(t); });
    };
    var nativeInterval = win.setInterval;
    win.setInterval = function (fn, ms) {
      var src = tag + sourceOf(2), rest = Array.prototype.slice.call(arguments, 2);
      return nativeInterval.call(win, function () {
        var t = performance.now();
        bump(HUD.iv, src);
        try { return typeof fn === 'function' ? fn.apply(this, rest) : (0, win.eval)(fn); }
        finally { HUD.ivMs += performance.now() - t; }
      }, ms);
    };
    var getContext = win.HTMLCanvasElement && win.HTMLCanvasElement.prototype.getContext;
    if (getContext) win.HTMLCanvasElement.prototype.getContext = function (type) {
      if (/webgl/i.test(type) && !this.__perfGl) { this.__perfGl = true; HUD.gl++; }
      return getContext.apply(this, arguments);
    };
  }
  instrument(window, '');

  // Same-origin iframes (the training tools) are measured too, tagged with ⌐ (iframe).
  function watchFrames() {
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function (frame) {
      if (frame.__perfHudSeen) return;
      frame.__perfHudSeen = true;
      var hook = function () { try { instrument(frame.contentWindow, 'iframe:'); } catch (_) {} };
      frame.addEventListener('load', hook);
      hook();
    });
  }

  // Firebase reads: count get() calls per key and active value listeners.
  function hookFirebase() {
    var Ref = window.firebase && firebase.database && firebase.database.Reference;
    if (!Ref || Ref.prototype.__perfHud) return !!Ref;
    Ref.prototype.__perfHud = true;
    var get = Ref.prototype.get, on = Ref.prototype.on;
    if (get) Ref.prototype.get = function () { HUD.gets++; bump(HUD.getKeys, this.key || '/'); return get.apply(this, arguments); };
    if (on) Ref.prototype.on = function (type) { if (type === 'value') HUD.listeners++; return on.apply(this, arguments); };
    return true;
  }
  var fbTries = 0, fbTimer = hudInterval(function () { if (hookFirebase() || ++fbTries > 40) clearInterval(fbTimer); }, 250);

  // Long tasks where supported (Chrome); Safari has none, so long frames below stand in.
  try {
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (e) { HUD.longTasks++; HUD.longestTask = Math.max(HUD.longestTask, e.duration); });
    }).observe({ type: 'longtask', buffered: true });
    HUD.longTaskSupport = true;
  } catch (_) { HUD.longTaskSupport = false; }

  // Frame clock: the HUD's own loop measures what the screen actually gets.
  var lastFrame = 0;
  function frame(t) {
    if (lastFrame && !document.hidden) HUD.frames.push(t - lastFrame);
    if (HUD.frames.length > 600) HUD.frames.splice(0, HUD.frames.length - 600);
    lastFrame = document.hidden ? 0 : t;
    window.requestAnimationFrame(frame);
  }
  own.add(frame);

  function reset() {
    HUD.raf = {}; HUD.iv = {}; HUD.ivMs = 0; HUD.gets = 0; HUD.getKeys = {};
    HUD.longTasks = 0; HUD.longestTask = 0; HUD.frames = []; HUD.started = performance.now();
  }
  function report() {
    var secs = Math.max(1, (performance.now() - HUD.started) / 1000), f = HUD.frames.slice(-120);
    var avg = f.length ? f.reduce(function (a, b) { return a + b; }, 0) / f.length : 0;
    var sorted = f.slice().sort(function (a, b) { return a - b; });
    var per = function (map) {
      return Object.keys(map).map(function (k) { return [k, Math.round(map[k] / secs * 10) / 10]; })
        .sort(function (a, b) { return b[1] - a[1]; });
    };
    var rafs = per(HUD.raf), ivs = per(HUD.iv);
    return {
      page: location.pathname.split('/').pop() + location.search,
      seconds: Math.round(secs),
      fps: avg ? Math.round(1000 / avg) : 0,
      frameP95ms: sorted.length ? Math.round(sorted[Math.floor(sorted.length * .95)]) : 0,
      longFrames: HUD.frames.filter(function (d) { return d > 50; }).length,
      longestFrameMs: Math.round(Math.max.apply(null, HUD.frames.concat(0))),
      longTasks: HUD.longTaskSupport ? HUD.longTasks : null,
      longestTaskMs: HUD.longTaskSupport ? Math.round(HUD.longestTask) : null,
      loopsPerSecond: rafs.reduce(function (n, r) { return n + r[1]; }, 0),
      loops: rafs.slice(0, 5),
      timersPerSecond: ivs.reduce(function (n, r) { return n + r[1]; }, 0),
      timerMsPerSecond: Math.round(HUD.ivMs / secs * 10) / 10,
      timers: ivs.slice(0, 5),
      firebaseReadsPerMinute: Math.round(HUD.gets / secs * 60),
      firebaseListeners: HUD.listeners,
      webglContexts: HUD.gl,
      heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null,
      hidden: document.hidden
    };
  }
  HUD.report = report;
  HUD.reset = reset;

  function build() {
    var box = document.createElement('div');
    box.id = 'perf-hud';
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText = 'position:fixed;z-index:2147483647;left:calc(8px + env(safe-area-inset-left));top:calc(8px + env(safe-area-inset-top));max-width:min(320px,calc(100vw - 16px));padding:8px 10px;border-radius:10px;background:rgba(8,8,12,.86);color:#e8f0ee;font:11px/1.45 ui-monospace,Menlo,monospace;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(0,0,0,.4);pointer-events:auto;white-space:pre-wrap;word-break:break-word';
    var text = document.createElement('div');
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:6px;margin-top:6px';
    var mk = function (label, fn) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.style.cssText = 'flex:1;min-height:28px;border:1px solid rgba(255,255,255,.2);border-radius:7px;background:none;color:inherit;font:inherit;cursor:pointer';
      b.addEventListener('click', function (e) { e.stopPropagation(); fn(b); });
      bar.appendChild(b);
      return b;
    };
    var collapsed = false;
    mk('Nollställ', reset);
    mk('Kopiera', function (b) {
      var json = JSON.stringify(report(), null, 1);
      var done = function () { b.textContent = 'Kopierat'; setTimeout(function () { b.textContent = 'Kopiera'; }, 1200); };
      if (navigator.clipboard) navigator.clipboard.writeText(json).then(done, function () { prompt('Kopiera', json); });
      else prompt('Kopiera', json);
    });
    var hide = mk('Dölj', function () { collapsed = !collapsed; bar.firstChild.hidden = bar.children[1].hidden = collapsed; hide.textContent = collapsed ? 'Visa' : 'Dölj'; paint(); });
    box.appendChild(text); box.appendChild(bar);
    document.body.appendChild(box);
    function line(list) { return list.length ? list.map(function (r) { return '  ' + r[0] + ' ' + r[1]; }).join('\n') : '  inga'; }
    function paint() {
      var r = report();
      text.textContent = collapsed
        ? r.fps + ' fps · ' + r.loopsPerSecond.toFixed(0) + ' loopar/s'
        : r.fps + ' fps  p95 ' + r.frameP95ms + ' ms  långa ' + r.longFrames + ' (max ' + r.longestFrameMs + ' ms)\n' +
          (r.longTasks === null ? '' : 'long tasks ' + r.longTasks + ' (max ' + r.longestTaskMs + ' ms)\n') +
          'animationsloopar ' + r.loopsPerSecond.toFixed(1) + '/s\n' + line(r.loops) + '\n' +
          'timers ' + r.timersPerSecond.toFixed(1) + '/s · ' + r.timerMsPerSecond + ' ms/s\n' + line(r.timers) + '\n' +
          'firebase ' + r.firebaseReadsPerMinute + ' läsningar/min · ' + r.firebaseListeners + ' lyssnare\n' +
          'webgl ' + r.webglContexts + (r.heapMB === null ? '' : ' · heap ' + r.heapMB + ' MB') + ' · ' + r.seconds + ' s';
    }
    paint();
    hudInterval(paint, 1000);
    hudInterval(watchFrames, 1000);
    watchFrames();
    window.requestAnimationFrame(frame);
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build, { once: true });
})();
