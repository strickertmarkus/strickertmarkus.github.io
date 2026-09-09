(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowCanvasGlowV132Installed) return;
  window.__exercisePulseFlowCanvasGlowV132Installed = true;

  var STYLE_ID = 'exercise-pulse-flow-canvas-glow-v132-style';
  var mobileMq = window.matchMedia ? window.matchMedia('(max-width:600px)') : { matches:true };
  var rafId = 0;
  var modalObserver = null;
  var installObserver = null;
  var cachedLarge = new WeakMap();
  var DPR = Math.min(1.5, Math.max(1, Number(window.devicePixelRatio) || 1));

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var old = document.getElementById('exercise-pulse-flow-canvas-glow-v130-style');
    if (old) old.remove();

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
        /* The desktop-looking halo must be allowed to leave the narrow SVG
           boxes. The old Pulse Flow band explicitly used overflow:hidden,
           which clipped most of a 16-27px light falloff on phones. */
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58,
        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80,
        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80,
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .bs-ring {
          overflow:visible !important;
        }

        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-mobile-halo-v127,
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-smooth-halo-outer-v129,
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-smooth-halo-mid-v129 {
          display:none !important;
        }

        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-trace-v58,
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring .pf-arc-progress-v80,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-arc-progress-v80,
        html.exercise-concept-pulse-home-v1 body #session-countdown-ring .pf-ecg-v80 svg,
        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 svg,
        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 svg,
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

        /* Give the Canvas enough transparent margin for the same approximate
           7 / 16 / 27px halo radii used by the active 5s toggle knob. */
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 > .pf-canvas-large-v130 {
          inset:-32px !important;
          width:calc(100% + 64px) !important;
          height:calc(100% + 64px) !important;
          z-index:1 !important;
        }
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 > svg {
          position:relative !important;
          z-index:2 !important;
        }
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 .pulse-flow-status-v58 {
          z-index:4 !important;
        }

        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80,
        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 {
          isolation:isolate;
        }
        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > .pf-canvas-mini-v130,
        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 > .pf-canvas-mini-v130 {
          inset:-30px !important;
          width:calc(100% + 60px) !important;
          height:calc(100% + 60px) !important;
          z-index:1 !important;
        }
        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > svg,
        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 > svg {
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
    if (!canvas || !canvas.width || !canvas.height) return;
    var ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  function pointToCanvas(path,point,canvasRect,scale) {
    var ctm = null;
    try { ctm = path.getScreenCTM(); } catch (_) {}
    if (ctm && window.DOMPoint) {
      var p = new DOMPoint(point.x,point.y).matrixTransform(ctm);
      return { x:(p.x-canvasRect.left)*scale, y:(p.y-canvasRect.top)*scale };
    }

    var svg = path.ownerSVGElement;
    var svgRect = svg ? svg.getBoundingClientRect() : canvasRect;
    var vb = svg && svg.viewBox && svg.viewBox.baseVal;
    var vx = vb ? vb.x : 0, vy = vb ? vb.y : 0;
    var vw = vb && vb.width ? vb.width : svgRect.width;
    var vh = vb && vb.height ? vb.height : svgRect.height;
    return {
      x:((svgRect.left-canvasRect.left) + ((point.x-vx)/vw)*svgRect.width)*scale,
      y:((svgRect.top-canvasRect.top) + ((point.y-vy)/vh)*svgRect.height)*scale
    };
  }

  function samplePath(path,canvasRect,scale,steps) {
    if (!path || typeof path.getTotalLength !== 'function' || typeof path.getPointAtLength !== 'function') return null;
    var len = 0;
    try { len = path.getTotalLength(); } catch (_) { return null; }
    if (!(len > 0)) return null;
    steps = Math.max(4,steps || 24);
    var pts = [], totalPx = 0, prev = null;
    for (var i=0;i<=steps;i++) {
      var p = null;
      try { p = path.getPointAtLength(len * i / steps); } catch (_) { return null; }
      var q = pointToCanvas(path,p,canvasRect,scale);
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

  function neonPass(ctx,points,rgb,width,blur,shadowAlpha,dash,dashOffset) {
    if (!buildPolyline(ctx,points)) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width * DPR;

    /* Full source alpha is intentional. Canvas shadowBlur derives its alpha
       mask from the source stroke; the old 0.02-0.08 stroke alpha effectively
       killed the halo on iOS. The canvas sits directly below the crisp SVG
       core, so this source stroke is hidden by the real line while its light
       remains visible around it. */
    ctx.strokeStyle = rgba(rgb,1);
    ctx.shadowColor = rgba(rgb,shadowAlpha);
    ctx.shadowBlur = blur * DPR;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    if (dash && dash.length) {
      ctx.setLineDash(dash);
      ctx.lineDashOffset = dashOffset || 0;
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawToggleStrengthHalo(ctx,points,rgb,dash,dashOffset,compact) {
    if (compact) {
      neonPass(ctx,points,rgb,1.05,20,.22,dash,dashOffset);
      neonPass(ctx,points,rgb,1.25,12,.50,dash,dashOffset);
      neonPass(ctx,points,rgb,1.55,6,.96,dash,dashOffset);
      return;
    }

    /* Match the visual hierarchy of the active toggle knob:
       0 0 7px / .96, 0 0 16px / .50, 0 0 27px / .22. */
    neonPass(ctx,points,rgb,1.15,27,.22,dash,dashOffset);
    neonPass(ctx,points,rgb,1.4,16,.50,dash,dashOffset);
    neonPass(ctx,points,rgb,1.75,7,.96,dash,dashOffset);
  }

  function pointAtPhase(points,phase) {
    if (!points || !points.length) return null;
    var p = ((phase % 1) + 1) % 1;
    var scaled = p * (points.length - 1);
    var i = Math.floor(scaled);
    var t = scaled - i;
    var a = points[i];
    var b = points[Math.min(i + 1,points.length - 1)];
    return {
      x:a.x + (b.x-a.x)*t,
      y:a.y + (b.y-a.y)*t
    };
  }

  function centeredNeonPass(ctx,points,rgb,width,blur,shadowAlpha,dash,dashOffset,centerX,halfSpan) {
    if (!buildPolyline(ctx,points)) return;
    var gradient = ctx.createLinearGradient(centerX-halfSpan,0,centerX+halfSpan,0);
    gradient.addColorStop(0,rgba(rgb,0));
    gradient.addColorStop(.18,rgba(rgb,.12));
    gradient.addColorStop(.36,rgba(rgb,.52));
    gradient.addColorStop(.50,rgba(rgb,1));
    gradient.addColorStop(.64,rgba(rgb,.52));
    gradient.addColorStop(.82,rgba(rgb,.12));
    gradient.addColorStop(1,rgba(rgb,0));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width * DPR;
    ctx.strokeStyle = gradient;
    ctx.shadowColor = rgba(rgb,shadowAlpha);
    ctx.shadowBlur = blur * DPR;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.setLineDash(dash);
    ctx.lineDashOffset = dashOffset || 0;
    ctx.stroke();
    ctx.restore();
  }

  function eraseLargeGlowCore(ctx,points,dash,dashOffset) {
    if (!buildPolyline(ctx,points)) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.2 * DPR;
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.shadowBlur = 0;
    ctx.setLineDash(dash);
    ctx.lineDashOffset = dashOffset || 0;
    ctx.stroke();
    ctx.restore();
  }

  function drawCenteredLargeHalo(ctx,sampled,rgb,phase) {
    var points = sampled.points;
    if (!points || points.length < 2) return;

    var total = sampled.totalPx;
    var activeFraction = .175;
    var dash = [total*activeFraction,total*(1-activeFraction)];
    var dashOffset = -phase*total;
    var center = pointAtPhase(points,(phase + activeFraction*.5) % 1);
    if (!center) return;

    var xSpan = Math.max(1,Math.abs(points[points.length-1].x-points[0].x));
    var halfSpan = Math.max(24*DPR,xSpan*.105);

    /* Same toggle-strength radii as v132, but the Canvas source itself now
       fades symmetrically around the middle of the moving ECG dash. This keeps
       the glow attached to the pulse instead of reading as a bright tail on
       the left side of the animation. */
    centeredNeonPass(ctx,points,rgb,1.15,27,.22,dash,dashOffset,center.x,halfSpan);
    centeredNeonPass(ctx,points,rgb,1.4,16,.50,dash,dashOffset,center.x,halfSpan);
    centeredNeonPass(ctx,points,rgb,1.75,7,.96,dash,dashOffset,center.x,halfSpan);

    /* Remove only the Canvas source core after its shadows have been produced.
       The real SVG trace stays above it and remains the sole crisp ECG line. */
    eraseLargeGlowCore(ctx,points,dash,dashOffset);
  }

  function currentDashPhase(trace,now) {
    var offset = NaN;
    try { offset = parseFloat(getComputedStyle(trace).strokeDashoffset); } catch (_) {}
    if (Number.isFinite(offset)) return ((-offset % 1000) + 1000) % 1000 / 1000;

    var modal = trace.closest('#session-modal');
    var speed = 2.4;
    if (modal) {
      if (modal.classList.contains('pulse-flow-active-v58') && modal.classList.contains('pulse-flow-cardio-v58')) speed = .72;
      else if (modal.classList.contains('pulse-flow-active-v58')) speed = .92;
      else if (modal.classList.contains('pulse-flow-starting-v58')) speed = 1.18;
      else if (modal.classList.contains('pulse-flow-resting-v58')) speed = 2.8;
      else if (modal.classList.contains('pulse-flow-complete-v58')) speed = 3.2;
    }
    return (now % (speed*1000)) / (speed*1000);
  }

  function paintLarge(now) {
    document.querySelectorAll('#session-modal.show:not(.session-overview-mode) .pulse-flow-band-v58').forEach(function (band) {
      var svg = band.querySelector(':scope > svg');
      var trace = svg && svg.querySelector('.pulse-flow-trace-v58');
      if (!svg || !trace) return;

      var canvas = ensureCanvas(band,'pf-canvas-large-v130');
      var size = sizeCanvas(canvas);
      if (!size) return;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);

      var key = Math.round(size.rect.width*10) + 'x' + Math.round(size.rect.height*10);
      var cache = cachedLarge.get(trace);
      if (!cache || cache.key !== key) {
        cache = { key:key, sampled:samplePath(trace,size.rect,DPR,120) };
        cachedLarge.set(trace,cache);
      }
      if (!cache.sampled) return;

      var rgb = parseRgb(band.closest('#session-modal') || band,'--pf-rgb',[103,232,249]);
      drawCenteredLargeHalo(ctx,cache.sampled,rgb,currentDashPhase(trace,now));
    });
  }

  function paintMini(signal,rgb) {
    if (!signal) return;
    var svg = signal.querySelector(':scope > svg');
    if (!svg) return;

    var canvas = ensureCanvas(signal,'pf-canvas-mini-v130');
    var size = sizeCanvas(canvas);
    if (!size) return;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ['.pf-ecg-sweep-a-v80','.pf-ecg-sweep-b-v80','.pf-header-ecg-sweep-a-v80','.pf-header-ecg-sweep-b-v80'].forEach(function (selector) {
      var path = svg.querySelector(selector);
      if (!path || !path.getAttribute('d')) return;
      var sampled = samplePath(path,size.rect,DPR,28);
      if (sampled) drawToggleStrengthHalo(ctx,sampled.points,rgb,null,0,true);
    });
  }

  function paintMiniEcgs() {
    document.querySelectorAll('#session-countdown-ring .pf-ecg-v80').forEach(function (signal) {
      paintMini(signal,parseRgb(signal.closest('#session-modal') || signal,'--pf-rgb',[239,68,68]));
    });
    document.querySelectorAll('#session-between-overlay-v2 .pf-ecg-v80').forEach(function (signal) {
      paintMini(signal,parseRgb(signal.closest('#session-between-overlay-v2') || signal,'--pf-between-rgb',[34,211,238]));
    });
    document.querySelectorAll('.pf-header-ecg-v80').forEach(function (signal) {
      paintMini(signal,[103,232,249]);
    });
  }

  function paintArc(ring,varName,fallback) {
    if (!ring) return;
    var svg = ring.querySelector(':scope > .pf-arc-svg-v80');
    var path = svg && svg.querySelector('.pf-arc-progress-v80');
    if (!svg || !path || !path.getAttribute('d')) return;

    var canvas = ensureCanvas(ring,'pf-canvas-arc-v130');
    var size = sizeCanvas(canvas);
    if (!size) return;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    var sampled = samplePath(path,size.rect,DPR,88);
    if (!sampled) return;
    drawToggleStrengthHalo(ctx,sampled.points,parseRgb(ring,varName,fallback),null,0,false);
  }

  function paintArcs() {
    paintArc(document.getElementById('session-countdown-ring'),'--pf-rgb',[239,68,68]);
    var overlay = document.getElementById('session-between-overlay-v2');
    paintArc(overlay && overlay.querySelector('.bs-ring'),'--pf-between-rgb',[34,211,238]);
  }

  function clearAll() {
    document.querySelectorAll('canvas.pf-canvas-glow-v130').forEach(clearCanvas);
  }

  function frame(now) {
    rafId = 0;
    if (!isSessionVisible()) {
      clearAll();
      return;
    }
    paintLarge(now);
    paintMiniEcgs();
    paintArcs();
    rafId = requestAnimationFrame(frame);
  }

  function syncLoop() {
    if (isSessionVisible()) {
      if (!rafId) rafId = requestAnimationFrame(frame);
    } else {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      clearAll();
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
    if (mobileMq.addEventListener) mobileMq.addEventListener('change',syncLoop);
    else if (mobileMq.addListener) mobileMq.addListener(syncLoop);
    window.addEventListener('resize',function () { cachedLarge = new WeakMap(); syncLoop(); },{passive:true});
    syncLoop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();