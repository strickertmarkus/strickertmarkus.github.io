(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowCanvasGlowV140Installed) return;
  window.__exercisePulseFlowCanvasGlowV140Installed = true;

  var STYLE_ID = 'exercise-pulse-flow-canvas-glow-v140-style';
  var mobileMq = window.matchMedia ? window.matchMedia('(max-width:600px)') : { matches:true };
  var rafId = 0;
  var slowTimer = 0;
  var modalObserver = null;
  var installObserver = null;
  var DPR = Math.min(1.5, Math.max(1, Number(window.devicePixelRatio) || 1));

  function installStyle() {
    [
      'exercise-pulse-flow-canvas-glow-v130-style',
      'exercise-pulse-flow-canvas-glow-v132-style'
    ].forEach(function (id) {
      var old = document.getElementById(id);
      if (old) old.remove();
    });
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .pf-canvas-glow-v130 {
        display:none;
        position:absolute !important;
        pointer-events:none !important;
        user-select:none !important;
      }

      @media (max-width:600px) {
        /* v140: keep the successful v132 Canvas glow only on the compact ECGs
           and timer arcs. The large ECG is returned to its original v58 SVG
           rendering, including its native gradient/filter and clipped band. */
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 {
          overflow:hidden !important;
        }
        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80,
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-ring {
          overflow:visible !important;
        }

        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-mobile-halo-v127,
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-smooth-halo-outer-v129,
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-smooth-halo-mid-v129,
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 > .pf-canvas-large-v130 {
          display:none !important;
        }

        html.exercise-concept-pulse-home-v1 body #session-countdown-ring .pf-arc-progress-v80,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-arc-progress-v80,
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring .pf-ecg-v80 svg,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 svg,
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring .pf-ecg-v80 .pf-ecg-sweep-a-v80,
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring .pf-ecg-v80 .pf-ecg-sweep-b-v80,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-a-v80,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 .pf-ecg-sweep-b-v80 {
          filter:none !important;
          -webkit-filter:none !important;
        }

        html.exercise-concept-pulse-home-v1 body .pf-canvas-glow-v130 {
          display:block;
          opacity:1 !important;
          filter:none !important;
          -webkit-filter:none !important;
          mix-blend-mode:screen !important;
        }
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 > .pf-canvas-large-v130 {
          display:none !important;
        }

        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 {
          isolation:isolate;
        }
        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > .pf-canvas-mini-v130 {
          inset:-30px !important;
          width:calc(100% + 60px) !important;
          height:calc(100% + 60px) !important;
          z-index:1 !important;
        }
        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > svg {
          position:relative !important;
          z-index:2 !important;
        }

        html.exercise-concept-pulse-home-v1 body #session-countdown-ring > .pf-canvas-arc-v130,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-ring > .pf-canvas-arc-v130 {
          inset:-38px !important;
          width:calc(100% + 76px) !important;
          height:calc(100% + 76px) !important;
          z-index:1 !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring > .pf-arc-svg-v80,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-ring > .pf-arc-svg-v80 {
          position:relative !important;
          z-index:2 !important;
        }
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring .session-countdown-copy,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-copy {
          z-index:4 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isSessionVisible() {
    var modal = document.getElementById('session-modal');
    return !!(mobileMq.matches && document.visibilityState !== 'hidden' && modal && modal.classList.contains('show') && !modal.classList.contains('session-overview-mode'));
  }

  function parseRgb(el,varName,fallback) {
    var raw = '';
    try { raw = getComputedStyle(el).getPropertyValue(varName) || ''; } catch (_) {}
    var nums = raw.split(',').map(function (v) { return Number(String(v).trim()); }).filter(function (n) { return Number.isFinite(n); });
    if (nums.length >= 3) return nums.slice(0,3);
    return fallback || [103,232,249];
  }

  function rgba(rgb,a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }

  function ensureCanvas(host,className) {
    if (!host) return null;
    var canvas = host.querySelector(':scope > canvas.' + className);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'pf-canvas-glow-v130 ' + className;
      canvas.setAttribute('aria-hidden','true');
      canvas.setAttribute('role','presentation');
      host.insertBefore(canvas,host.firstChild || null);
    }
    return canvas;
  }

  function sizeCanvas(canvas) {
    if (!canvas) return null;
    var rect = canvas.getBoundingClientRect();
    var cssW = Math.max(1,rect.width);
    var cssH = Math.max(1,rect.height);
    var w = Math.max(1,Math.round(cssW * DPR));
    var h = Math.max(1,Math.round(cssH * DPR));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return { rect:rect, cssW:cssW, cssH:cssH, scale:DPR };
  }

  function clearCanvas(canvas) {
    if (!canvas) return;
    canvas.__glowKey = '';
    if (!canvas.width || !canvas.height) return;
    var ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  /* Evenly spaced points along the path in its own SVG units. The sweep and
     arc paths written by the Pulse Flow motion layer are always a polyline
     (M/L) or a single circular arc (M/A), so both are resolved analytically;
     anything else falls back to the browser's path measurement. The result
     matches getPointAtLength() without its per-call cost on every frame. */
  var NUM = '(-?\\d*\\.?\\d+(?:e[-+]?\\d+)?)';
  var ARC_RE = new RegExp('^\\s*M\\s*'+NUM+'[\\s,]+'+NUM+'\\s*A\\s*'+NUM+'[\\s,]+'+NUM+'[\\s,]+'+NUM+'[\\s,]+([01])[\\s,]*([01])[\\s,]+'+NUM+'[\\s,]+'+NUM+'\\s*$','i');

  function polylinePoints(d,steps) {
    if (/[^MLml\d\s,.eE+-]/.test(d) || !/^\s*M/.test(d)) return null;
    var nums = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
    if (!nums || nums.length < 4 || nums.length % 2) return null;
    var src = [], cum = [0];
    for (var i=0;i<nums.length;i+=2) src.push({x:+nums[i],y:+nums[i+1]});
    for (var j=1;j<src.length;j++) cum.push(cum[j-1]+Math.hypot(src[j].x-src[j-1].x,src[j].y-src[j-1].y));
    var len = cum[cum.length-1];
    if (!(len > 0)) return null;
    var out = [], seg = 1;
    for (var k=0;k<=steps;k++) {
      var at = len*k/steps;
      while (seg < src.length-1 && cum[seg] < at) seg++;
      var a = src[seg-1], b = src[seg], span = cum[seg]-cum[seg-1], t = span > 0 ? (at-cum[seg-1])/span : 0;
      out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
    }
    return out;
  }

  function arcPoints(d,steps) {
    var m = ARC_RE.exec(d);
    if (!m) return null;
    var x1=+m[1],y1=+m[2],r=+m[3],rot=+m[5],large=m[6]==='1',sweep=m[7]==='1',x2=+m[8],y2=+m[9];
    if (r !== +m[4] || rot !== 0 || !(r > 0)) return null;
    var mx=(x1-x2)/2,my=(y1-y2)/2,q=mx*mx+my*my;
    if (!(q > 0)) return null;
    if (q > r*r) r = Math.sqrt(q);
    var f = Math.sqrt(Math.max(0,(r*r-q)/q))*(large===sweep?-1:1);
    var cx=f*my+(x1+x2)/2,cy=-f*mx+(y1+y2)/2;
    var a1=Math.atan2(y1-cy,x1-cx),a2=Math.atan2(y2-cy,x2-cx),delta=a2-a1;
    if (sweep && delta < 0) delta += Math.PI*2;
    if (!sweep && delta > 0) delta -= Math.PI*2;
    var out = [];
    for (var k=0;k<=steps;k++) {
      var a = a1+delta*k/steps;
      out.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
    }
    return out;
  }

  function measuredPoints(path,steps) {
    if (typeof path.getTotalLength !== 'function' || typeof path.getPointAtLength !== 'function') return null;
    var len = 0, out = [];
    try { len = path.getTotalLength(); } catch (_) { return null; }
    if (!(len > 0)) return null;
    for (var k=0;k<=steps;k++) {
      try { out.push(path.getPointAtLength(len*k/steps)); } catch (_) { return null; }
    }
    return out;
  }

  function samplePath(path,canvasRect,scale,steps) {
    if (!path) return null;
    steps = Math.max(4,steps || 24);
    var d = path.getAttribute('d') || '';
    var local = polylinePoints(d,steps) || arcPoints(d,steps) || measuredPoints(path,steps);
    if (!local) return null;
    var matrix = path.getScreenCTM();
    if (!matrix) return null;
    var pts = [], totalPx = 0, prev = null;
    for (var i=0;i<local.length;i++) {
      var p = local[i];
      var q = {x:(matrix.a*p.x+matrix.c*p.y+matrix.e-canvasRect.left)*scale,
               y:(matrix.b*p.x+matrix.d*p.y+matrix.f-canvasRect.top)*scale};
      if (prev) totalPx += Math.hypot(q.x-prev.x,q.y-prev.y);
      pts.push(q);
      prev = q;
    }
    return { points:pts, totalPx:Math.max(1,totalPx) };
  }

  function buildPolyline(ctx,points) {
    if (!points || points.length < 2) return false;
    ctx.beginPath();
    ctx.moveTo(points[0].x,points[0].y);
    for (var i=1;i<points.length;i++) ctx.lineTo(points[i].x,points[i].y);
    return true;
  }

  function neonPass(ctx,points,rgb,width,blur,shadowAlpha) {
    if (!buildPolyline(ctx,points)) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width * DPR;
    ctx.strokeStyle = rgba(rgb,1);
    ctx.shadowColor = rgba(rgb,shadowAlpha);
    ctx.shadowBlur = blur * DPR;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.restore();
  }

  function drawToggleStrengthHalo(ctx,points,rgb,compact) {
    if (compact) {
      neonPass(ctx,points,rgb,1.05,20,.22);
      neonPass(ctx,points,rgb,1.25,12,.50);
      neonPass(ctx,points,rgb,1.55,6,.96);
      return;
    }
    neonPass(ctx,points,rgb,1.15,27,.22);
    neonPass(ctx,points,rgb,1.4,16,.50);
    neonPass(ctx,points,rgb,1.75,7,.96);
  }

  /* A canvas keeps its pixels, so it is only repainted when something that
     shapes the glow changed: the path data, where the path sits relative to
     the canvas, the canvas size or the colour. */
  function glowKey(paths,rect,rgb) {
    var key = rect.left.toFixed(2)+','+rect.top.toFixed(2)+','+rect.width.toFixed(2)+','+rect.height.toFixed(2)+'|'+rgb.join(',');
    paths.forEach(function (path) {
      var m = path.getScreenCTM();
      key += '|'+(path.getAttribute('d') || '')+(m ? '@'+[m.a,m.b,m.c,m.d,m.e,m.f].map(function (n) { return n.toFixed(3); }).join(',') : '');
    });
    return key;
  }

  function paintMini(signal,rgb) {
    if (!signal) return false;
    var svg = signal.querySelector(':scope > svg');
    if (!svg) return false;

    var canvas = ensureCanvas(signal,'pf-canvas-mini-v130');
    if (!canvas.getClientRects().length) return false;
    var size = sizeCanvas(canvas);
    if (!size) return false;
    var paths = ['.pf-ecg-sweep-a-v80','.pf-ecg-sweep-b-v80'].map(function (selector) {
      return svg.querySelector(selector);
    }).filter(function (path) { return path && path.getAttribute('d'); });
    var key = glowKey(paths,size.rect,rgb);
    if (canvas.__glowKey === key) return true;
    canvas.__glowKey = key;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    paths.forEach(function (path) {
      var sampled = samplePath(path,size.rect,DPR,28);
      if (sampled) drawToggleStrengthHalo(ctx,sampled.points,rgb,true);
    });
    return true;
  }

  function paintMiniEcgs() {
    var active = false;
    document.querySelectorAll('#session-countdown-ring .pf-ecg-v80').forEach(function (signal) {
      if (paintMini(signal,parseRgb(signal.closest('#session-countdown-ring') || signal,'--pf-rgb',[239,68,68]))) active = true;
    });
    document.querySelectorAll('#session-between-overlay-v2 .pf-ecg-v80').forEach(function (signal) {
      if (paintMini(signal,parseRgb(signal.closest('#session-between-overlay-v2') || signal,'--pf-between-rgb',[34,211,238]))) active = true;
    });
    return active;
  }

  function paintArc(ring,varName,fallback) {
    if (!ring || !ring.getClientRects().length) return false;
    var svg = ring.querySelector(':scope > .pf-arc-svg-v80');
    var path = svg && svg.querySelector('.pf-arc-progress-v80');
    if (!svg || !path || !path.getAttribute('d')) return false;

    var canvas = ensureCanvas(ring,'pf-canvas-arc-v130');
    if (!canvas.getClientRects().length) return false;
    var size = sizeCanvas(canvas);
    if (!size) return false;
    var rgb = parseRgb(ring,varName,fallback);
    var key = glowKey([path],size.rect,rgb);
    if (canvas.__glowKey === key) return true;
    canvas.__glowKey = key;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    var sampled = samplePath(path,size.rect,DPR,88);
    if (sampled) drawToggleStrengthHalo(ctx,sampled.points,rgb,false);
    return true;
  }

  function paintArcs() {
    var active = paintArc(document.getElementById('session-countdown-ring'),'--pf-rgb',[239,68,68]);
    var overlay = document.getElementById('session-between-overlay-v2');
    if (paintArc(overlay && overlay.querySelector('.bs-ring'),'--pf-between-rgb',[34,211,238])) active = true;
    return active;
  }

  function clearAll() {
    document.querySelectorAll('canvas.pf-canvas-glow-v130').forEach(clearCanvas);
  }

  function removeLegacyLargeCanvas() {
    document.querySelectorAll('canvas.pf-canvas-large-v130').forEach(function (canvas) {
      canvas.remove();
    });
  }

  /* The glow follows its SVG source at up to 30 fps (every second frame at
     60 Hz, every fourth at 120 Hz). While no glow target is on screen the
     loop only checks back every IDLE_MS instead of waking on every frame. */
  var FRAME_MS = 31;
  var IDLE_MS = 100;
  var lastPaint = -Infinity;

  function scheduleIdle() {
    slowTimer = setTimeout(function(){slowTimer=0;frame(performance.now());},IDLE_MS);
  }

  function frame(now) {
    rafId = 0;
    now = typeof now === 'number' ? now : performance.now();
    if (document.documentElement.classList.contains('cardio-focus-dragging')) {
      clearAll();
      rafId = requestAnimationFrame(frame);
      return;
    }
    if (!isSessionVisible()) {
      clearAll();
      return;
    }
    if (!window.__exerciseEnergySaving && now - lastPaint < FRAME_MS) {
      rafId = requestAnimationFrame(frame);
      return;
    }
    lastPaint = now;
    var active = paintMiniEcgs();
    if (paintArcs()) active = true;
    if (window.__exerciseEnergySaving) slowTimer = setTimeout(function(){slowTimer=0;frame(performance.now());},1000);
    else if (!active) scheduleIdle();
    else rafId = requestAnimationFrame(frame);
  }

  function syncLoop() {
    removeLegacyLargeCanvas();
    if (isSessionVisible()) {
      // Class mutations must not bypass the energy-saving cadence.
      if (!rafId && !slowTimer) rafId = requestAnimationFrame(frame);
    } else {
      var wasRunning = rafId || slowTimer;
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(slowTimer);slowTimer=0;
      rafId = 0;
      if (wasRunning) clearAll();
    }
  }

  function bindModal() {
    var modal = document.getElementById('session-modal');
    if (!modal) return false;
    if (modalObserver) modalObserver.disconnect();
    modalObserver = new MutationObserver(syncLoop);
    modalObserver.observe(modal,{attributes:true,attributeFilter:['class']});
    return true;
  }

  function install() {
    installStyle();
    removeLegacyLargeCanvas();
    if (!bindModal()) {
      installObserver = new MutationObserver(function () {
        if (bindModal()) {
          installObserver.disconnect();
          installObserver = null;
          syncLoop();
        }
      });
      installObserver.observe(document.documentElement,{childList:true,subtree:true});
    }
    document.addEventListener('visibilitychange',syncLoop,{passive:true});
    // Repaint discrete timer state changes immediately, without waking on
    // unrelated class writes or resuming continuous animation in energy mode.
    var timerRing=document.getElementById('session-countdown-ring'),timerState='';
    var timerObserver=new MutationObserver(function () {
      var next=String(document.documentElement.classList.contains('cardio-focus-active'))+'|'+String(timerRing&&timerRing.classList.contains('is-overtime'));
      if(next===timerState)return;
      timerState=next;
      clearTimeout(slowTimer);slowTimer=0;
      syncLoop();
    });
    timerObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    if(timerRing)timerObserver.observe(timerRing,{attributes:true,attributeFilter:['class']});
    document.addEventListener('exercise:energy-change',function () {
      clearTimeout(slowTimer);slowTimer=0;
      syncLoop();
    });
    if (mobileMq.addEventListener) mobileMq.addEventListener('change',syncLoop);
    else if (mobileMq.addListener) mobileMq.addListener(syncLoop);
    window.addEventListener('resize',syncLoop,{passive:true});
    syncLoop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
