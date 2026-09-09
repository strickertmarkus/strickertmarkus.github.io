(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exercisePulseFlowCanvasGlowV140Installed) return;
  window.__exercisePulseFlowCanvasGlowV140Installed = true;

  var STYLE_ID = 'exercise-pulse-flow-canvas-glow-v140-style';
  var mobileMq = window.matchMedia ? window.matchMedia('(max-width:600px)') : { matches:true };
  var rafId = 0;
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
        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80,
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
        html.exercise-concept-pulse-home-v1 body .pulse-flow-band-v58 > .pf-canvas-large-v130 {
          display:none !important;
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
      if (sampled) drawToggleStrengthHalo(ctx,sampled.points,rgb,true);
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
    drawToggleStrengthHalo(ctx,sampled.points,parseRgb(ring,varName,fallback),false);
  }

  function paintArcs() {
    paintArc(document.getElementById('session-countdown-ring'),'--pf-rgb',[239,68,68]);
    var overlay = document.getElementById('session-between-overlay-v2');
    paintArc(overlay && overlay.querySelector('.bs-ring'),'--pf-between-rgb',[34,211,238]);
  }

  function clearAll() {
    document.querySelectorAll('canvas.pf-canvas-glow-v130').forEach(clearCanvas);
  }

  function removeLegacyLargeCanvas() {
    document.querySelectorAll('canvas.pf-canvas-large-v130').forEach(function (canvas) {
      canvas.remove();
    });
  }

  function frame() {
    rafId = 0;
    if (!isSessionVisible()) {
      clearAll();
      return;
    }
    paintMiniEcgs();
    paintArcs();
    rafId = requestAnimationFrame(frame);
  }

  function syncLoop() {
    removeLegacyLargeCanvas();
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
    if (mobileMq.addEventListener) mobileMq.addEventListener('change',syncLoop);
    else if (mobileMq.addListener) mobileMq.addListener(syncLoop);
    window.addEventListener('resize',syncLoop,{passive:true});
    syncLoop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();