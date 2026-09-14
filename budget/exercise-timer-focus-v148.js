(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseTimerFocusV148Installed) return;
  window.__exerciseTimerFocusV148Installed = true;

  var DPR = Math.min(2, Math.max(1, Number(window.devicePixelRatio) || 1));
  var raf = 0;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(s) {
    if (!s || !Array.isArray(s.exercises)) return null;
    return s.exercises[Math.max(0, Number(s.exerciseIndex) || 0)] || null;
  }

  function progressRatio() {
    var s = getState(), ex = currentExercise(s);
    if (!s || !ex || ex.kind !== 'cardio' || !s.setStartedAt || !(Number(ex.time) > 0)) return null;
    var now = s.__hypePaused && s.__hypePausedAt ? Number(s.__hypePausedAt) : Date.now();
    var elapsed = Math.max(0, (now - Number(s.setStartedAt)) / 1000);
    var total = Math.max(1, Number(ex.time) * 60);
    return Math.max(0, Math.min(1, (total - elapsed) / total));
  }

  function addStyle() {
    if (document.getElementById('exercise-timer-focus-v148-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-timer-focus-v148-style';
    style.textContent = `
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ring-v145 {
        overflow:visible!important;
        isolation:isolate!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-arc-v146 {
        opacity:0!important;
        pointer-events:none!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-canvas-v148 {
        position:absolute!important;
        inset:-46px!important;
        width:calc(100% + 92px)!important;
        height:calc(100% + 92px)!important;
        z-index:1!important;
        display:block!important;
        pointer-events:none!important;
        overflow:visible!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-copy-v145 {
        z-index:3!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ring-v145::after {
        content:''!important;
        position:absolute!important;
        inset:7%!important;
        z-index:0!important;
        border-radius:50%!important;
        pointer-events:none!important;
        background:
          radial-gradient(circle,
            rgba(239,68,68,.16) 0%,
            rgba(239,68,68,.085) 31%,
            rgba(239,68,68,.035) 53%,
            rgba(239,68,68,.008) 69%,
            transparent 78%)!important;
        filter:blur(13px)!important;
        -webkit-filter:blur(13px)!important;
        animation:pfFocusHaloPulseV148 2.05s cubic-bezier(.4,0,.2,1) infinite!important;
      }
      @keyframes pfFocusHaloPulseV148 {
        0%,100% { opacity:.72;transform:scale(.975); }
        48% { opacity:1;transform:scale(1.035); }
      }

      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-v146 {
        width:118px!important;
        height:30px!important;
        margin:8px auto 0!important;
        opacity:1!important;
        filter:none!important;
        -webkit-filter:none!important;
        position:relative!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-v146 > svg {
        display:none!important;
      }
      #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ecg-canvas-v148 {
        display:block!important;
        width:100%!important;
        height:100%!important;
        overflow:visible!important;
        pointer-events:none!important;
      }

      @media(max-width:600px) {
        #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-canvas-v148 {
          inset:-42px!important;
          width:calc(100% + 84px)!important;
          height:calc(100% + 84px)!important;
        }
      }
      @media(prefers-reduced-motion:reduce) {
        #cardio-focus-v145.cardio-focus-compact-v146 .cardio-focus-ring-v145::after {
          animation:none!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureCanvas(host, className) {
    if (!host) return null;
    var canvas = host.querySelector(':scope > canvas.' + className);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = className;
      canvas.setAttribute('aria-hidden','true');
      canvas.setAttribute('role','presentation');
      host.insertBefore(canvas, host.firstChild || null);
    }
    return canvas;
  }

  function sizeCanvas(canvas) {
    var rect = canvas.getBoundingClientRect();
    var cssW = Math.max(1, rect.width);
    var cssH = Math.max(1, rect.height);
    var w = Math.max(1, Math.round(cssW * DPR));
    var h = Math.max(1, Math.round(cssH * DPR));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return { rect:rect, cssW:cssW, cssH:cssH, w:w, h:h };
  }

  function drawArcPass(ctx, cx, cy, radius, start, end, width, color, blur, shadowColor) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, end, false);
    ctx.lineCap = 'round';
    ctx.lineWidth = width * DPR;
    ctx.strokeStyle = color;
    ctx.shadowColor = shadowColor || color;
    ctx.shadowBlur = blur * DPR;
    ctx.stroke();
    ctx.restore();
  }

  function drawFocusRing(overlay, now) {
    var ring = overlay.querySelector('.cardio-focus-ring-v145');
    if (!ring) return;
    var canvas = ensureCanvas(ring, 'cardio-focus-canvas-v148');
    var size = sizeCanvas(canvas);
    var cRect = size.rect;
    var rRect = ring.getBoundingClientRect();
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    var cx = (rRect.left + rRect.width / 2 - cRect.left) * DPR;
    var cy = (rRect.top + rRect.height / 2 - cRect.top) * DPR;
    var radius = Math.max(8, rRect.width * .46) * DPR;
    var start = -Math.PI / 2;
    var ratio = progressRatio();
    if (ratio === null) ratio = 0;
    var end = start + Math.PI * 2 * ratio;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx,cy,radius,0,Math.PI*2);
    ctx.lineWidth = 2.25 * DPR;
    ctx.strokeStyle = 'rgba(239,68,68,.105)';
    ctx.stroke();
    ctx.restore();

    if (ratio > 0.0005) {
      drawArcPass(ctx,cx,cy,radius,start,end,13,'rgba(239,68,68,.055)',18,'rgba(239,68,68,.30)');
      drawArcPass(ctx,cx,cy,radius,start,end,7,'rgba(239,68,68,.105)',12,'rgba(239,68,68,.44)');
      drawArcPass(ctx,cx,cy,radius,start,end,3.8,'rgba(239,68,68,.32)',8,'rgba(239,68,68,.72)');
      drawArcPass(ctx,cx,cy,radius,start,end,2.65,'rgba(248,84,96,.98)',5,'rgba(239,68,68,.95)');

      var x = cx + Math.cos(end) * radius;
      var y = cy + Math.sin(end) * radius;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = 'rgba(239,68,68,1)';
      ctx.shadowBlur = 17 * DPR;
      ctx.fillStyle = 'rgba(255,150,165,.34)';
      ctx.beginPath(); ctx.arc(x,y,8.5*DPR,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur = 9 * DPR;
      ctx.fillStyle = '#FFD0D8';
      ctx.beginPath(); ctx.arc(x,y,4.15*DPR,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  var ECG_POINTS = [
    [1,15],[19,15],[25,10],[31,21],[39,3],[47,23],[54,11],[62,15],[117,15]
  ];

  function polyMetrics(points) {
    var segs = [], total = 0;
    for (var i=1;i<points.length;i++) {
      var a=points[i-1], b=points[i];
      var len=Math.hypot(b[0]-a[0],b[1]-a[1]);
      segs.push({a:a,b:b,len:len,start:total});
      total += len;
    }
    return {segs:segs,total:Math.max(1,total)};
  }
  var ECG_METRIC = polyMetrics(ECG_POINTS);

  function pointOnPolyline(t) {
    t = ((t % 1) + 1) % 1;
    var dist = t * ECG_METRIC.total;
    for (var i=0;i<ECG_METRIC.segs.length;i++) {
      var s=ECG_METRIC.segs[i];
      if (dist <= s.start+s.len || i===ECG_METRIC.segs.length-1) {
        var u = s.len ? (dist-s.start)/s.len : 0;
        u = Math.max(0,Math.min(1,u));
        return [s.a[0]+(s.b[0]-s.a[0])*u,s.a[1]+(s.b[1]-s.a[1])*u];
      }
    }
    return ECG_POINTS[ECG_POINTS.length-1];
  }

  function drawPolylineSegment(ctx, fromT, toT, sx, sy) {
    var samples = 34;
    ctx.beginPath();
    for (var i=0;i<=samples;i++) {
      var t = fromT + (toT-fromT)*(i/samples);
      var p = pointOnPolyline(t);
      var x = p[0]*sx*DPR, y=p[1]*sy*DPR;
      if (!i) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
  }

  function drawEcg(overlay, now) {
    var ecg = overlay.querySelector('.cardio-focus-ecg-v146');
    if (!ecg) return;
    var canvas = ensureCanvas(ecg, 'cardio-focus-ecg-canvas-v148');
    var size = sizeCanvas(canvas), ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    var sx=size.cssW/118, sy=size.cssH/30;

    ctx.save();
    ctx.beginPath();
    ECG_POINTS.forEach(function(p,i){
      var x=p[0]*sx*DPR,y=p[1]*sy*DPR;
      if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    });
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.lineWidth=.9*DPR;ctx.strokeStyle='rgba(239,68,68,.20)';
    ctx.stroke();ctx.restore();

    var phase = (now % 1080) / 1080;
    [0,.5].forEach(function(offset,index){
      var head=(phase+offset)%1;
      var tail=head-.23;
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      drawPolylineSegment(ctx,tail,head,sx,sy);
      ctx.lineCap='round';ctx.lineJoin='round';
      ctx.lineWidth=(index?1.65:1.95)*DPR;
      ctx.strokeStyle=index?'rgba(239,68,68,.48)':'rgba(248,84,96,.98)';
      ctx.shadowColor='rgba(239,68,68,.95)';
      ctx.shadowBlur=(index?6:10)*DPR;
      ctx.stroke();
      ctx.restore();
    });

    var headPoint=pointOnPolyline(phase);
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle='#FFD0D8';
    ctx.shadowColor='rgba(239,68,68,1)';
    ctx.shadowBlur=9*DPR;
    ctx.beginPath();
    ctx.arc(headPoint[0]*sx*DPR,headPoint[1]*sy*DPR,1.55*DPR,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function ensure() {
    var overlay = document.getElementById('cardio-focus-v145');
    if (!overlay) return null;
    overlay.classList.add('cardio-focus-canvas-v148-active');
    var ring=overlay.querySelector('.cardio-focus-ring-v145');
    if(ring)ensureCanvas(ring,'cardio-focus-canvas-v148');
    var ecg=overlay.querySelector('.cardio-focus-ecg-v146');
    if(ecg)ensureCanvas(ecg,'cardio-focus-ecg-canvas-v148');
    return overlay;
  }

  function frame(now) {
    var overlay=ensure();
    if (overlay && overlay.classList.contains('show')) {
      drawFocusRing(overlay,now);
      drawEcg(overlay,now);
    }
    raf=requestAnimationFrame(frame);
  }

  function install() {
    addStyle();
    ensure();
    if(!raf)raf=requestAnimationFrame(frame);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();