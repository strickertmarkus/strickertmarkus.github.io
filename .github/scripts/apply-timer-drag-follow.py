from pathlib import Path

p = Path('budget/exercise-timer-focus.js')
s = p.read_text()

# 1. Extra RAF state for the interactive snap animation.
s = s.replace(
"  var gesture = null;\n  var suppressTimerClickUntil = 0;\n",
"  var gesture = null;\n  var suppressTimerClickUntil = 0;\n  var dragAnimationFrame = 0;\n",
1)

# 2. Add interactive-drag styling and a tiny optical center correction for the compact time.
anchor = """      @media (hover:hover) and (pointer:fine) {.cardio-focus-close {display:none!important;}}\n      .cardio-inline-plus {\n"""
insert = """      @media (hover:hover) and (pointer:fine) {.cardio-focus-close {display:none!important;}}\n\n      /* Mobile drag preview: the real live timer is resized/repositioned frame-by-frame. */\n      html.cardio-focus-dragging { --cf-progress:0; }\n      html.cardio-focus-dragging #cardio-focus {\n        display:block!important;\n        opacity:var(--cf-progress)!important;\n      }\n      html.cardio-focus-dragging .cardio-focus-title,\n      html.cardio-focus-dragging .cardio-focus-close {\n        opacity:var(--cf-progress)!important;\n      }\n      html.cardio-focus-dragging .cardio-focus-title {\n        transform:translateX(-50%) translateY(var(--cf-title-shift,18px))!important;\n      }\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) {\n        z-index:2147483500!important;\n        pointer-events:none!important;\n        isolation:isolate!important;\n      }\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode)::after {\n        content:''!important;\n        display:block!important;\n        position:fixed!important;\n        inset:0!important;\n        z-index:2147483501!important;\n        pointer-events:none!important;\n        opacity:var(--cf-progress)!important;\n        background:\n          radial-gradient(circle at 50% 45%,rgba(239,68,68,.20),transparent 35%),\n          radial-gradient(circle at 50% 112%,rgba(127,29,29,.17),transparent 43%),\n          linear-gradient(180deg,#16090C 0%,#10070A 48%,#09070A 100%)!important;\n      }\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-top,\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-grid > .session-card:not(.session-main),\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-main > *:not(#session-cardio-countdown) {\n        opacity:var(--cf-content-opacity)!important;\n        pointer-events:none!important;\n      }\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown.show {\n        opacity:1!important;\n        visibility:visible!important;\n        position:fixed!important;\n        inset:0!important;\n        z-index:2147483550!important;\n        width:100vw!important;\n        height:100dvh!important;\n        min-height:100svh!important;\n        margin:0!important;\n        padding:0!important;\n        display:block!important;\n        overflow:visible!important;\n        pointer-events:none!important;\n        background:transparent!important;\n      }\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring {\n        opacity:1!important;\n        visibility:visible!important;\n        display:grid!important;\n        position:fixed!important;\n        left:var(--cf-left)!important;\n        top:var(--cf-top)!important;\n        right:auto!important;\n        bottom:auto!important;\n        width:var(--cf-size)!important;\n        height:var(--cf-size)!important;\n        min-width:0!important;\n        min-height:0!important;\n        flex:0 0 var(--cf-size)!important;\n        flex-basis:var(--cf-size)!important;\n        aspect-ratio:1!important;\n        margin:0!important;\n        transform:none!important;\n        z-index:2147483551!important;\n        overflow:visible!important;\n        pointer-events:auto!important;\n      }\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-core {\n        inset:var(--cf-core-inset)!important;\n      }\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {\n        font-size:var(--cf-font-size)!important;\n        line-height:1!important;\n        letter-spacing:var(--cf-letter-spacing)!important;\n        transform:translateX(var(--cf-time-x))!important;\n      }\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-copy {\n        width:var(--cf-copy-width)!important;\n      }\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .pf-ecg-v80 {\n        width:var(--cf-ecg-width)!important;\n        height:var(--cf-ecg-height)!important;\n      }\n\n      /* Optical centering of the compact numeric value only; ring geometry is untouched. */\n      html:not(.cardio-focus-active):not(.cardio-focus-dragging) body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {\n        transform:translateX(1px)!important;\n      }\n\n      .cardio-inline-plus {\n"""
if anchor not in s:
    raise SystemExit('CSS insertion anchor not found')
s = s.replace(anchor, insert, 1)

# 3. Insert drag helpers before setFocus().
anchor = """  function setFocus(visible) {\n"""
helpers = r'''  function clamp01(value) {
    return Math.max(0,Math.min(1,Number(value) || 0));
  }

  function mix(a,b,t) {
    return Number(a) + (Number(b) - Number(a)) * t;
  }

  function focusTargetRect() {
    var vw = Math.max(1,window.innerWidth || document.documentElement.clientWidth || 1);
    var vh = Math.max(1,window.innerHeight || document.documentElement.clientHeight || 1);
    var compact = vw <= 390;
    var short = vh <= 700;
    var size = compact ? Math.min(300,vw * 0.80) : Math.min(324,vw * 0.82);
    var centerY = vh * (short ? 0.58 : 0.59);
    return {left:(vw - size) / 2,top:centerY - size / 2,width:size,height:size};
  }

  function measureSmallRing(ring) {
    var root = document.documentElement;
    var overlay = ensureFocusChrome();
    var wasExpanded = root.classList.contains('cardio-focus-active');
    var overlayWasShown = !!(overlay && overlay.classList.contains('show'));
    if (wasExpanded) {
      root.classList.remove('cardio-focus-active');
      if (overlay) overlay.classList.remove('show');
    }
    var rect = ring.getBoundingClientRect();
    var measured = {left:rect.left,top:rect.top,width:rect.width,height:rect.height};
    if (wasExpanded) {
      root.classList.add('cardio-focus-active');
      if (overlay && overlayWasShown) overlay.classList.add('show');
    }
    return measured;
  }

  function setDragVar(name,value) {
    document.documentElement.style.setProperty(name,value);
  }

  function clearDragVars() {
    [
      '--cf-progress','--cf-content-opacity','--cf-left','--cf-top','--cf-size',
      '--cf-core-inset','--cf-font-size','--cf-letter-spacing','--cf-copy-width',
      '--cf-ecg-width','--cf-ecg-height','--cf-time-x','--cf-title-shift'
    ].forEach(function (name) { document.documentElement.style.removeProperty(name); });
  }

  function applyDragProgress(progress) {
    if (!gesture || !gesture.engaged) return;
    progress = clamp01(progress);
    gesture.progress = progress;
    var small = gesture.smallRect;
    var large = gesture.largeRect;
    var size = mix(small.width,large.width,progress);
    setDragVar('--cf-progress',String(progress));
    setDragVar('--cf-content-opacity',String(1 - progress));
    setDragVar('--cf-left',mix(small.left,large.left,progress).toFixed(2) + 'px');
    setDragVar('--cf-top',mix(small.top,large.top,progress).toFixed(2) + 'px');
    setDragVar('--cf-size',size.toFixed(2) + 'px');
    setDragVar('--cf-core-inset',mix(18,gesture.largeCoreInset,progress).toFixed(2) + 'px');
    setDragVar('--cf-font-size',mix(27,gesture.largeFontSize,progress).toFixed(2) + 'px');
    setDragVar('--cf-letter-spacing',mix(-0.6,-2.4,progress).toFixed(2) + 'px');
    setDragVar('--cf-copy-width','calc(100% - ' + mix(52,128,progress).toFixed(2) + 'px)');
    setDragVar('--cf-ecg-width',mix(gesture.smallEcgWidth,104,progress).toFixed(2) + 'px');
    setDragVar('--cf-ecg-height',mix(gesture.smallEcgHeight,29,progress).toFixed(2) + 'px');
    setDragVar('--cf-time-x',mix(1,0,progress).toFixed(2) + 'px');
    setDragVar('--cf-title-shift',mix(18,0,progress).toFixed(2) + 'px');
  }

  function beginInteractiveDrag(ring,startExpanded) {
    if (!gesture || gesture.engaged) return;
    var smallRect = measureSmallRing(ring);
    var largeRect = focusTargetRect();
    var ecg = ring.querySelector('.pf-ecg-v80');
    var ecgRect = ecg ? ecg.getBoundingClientRect() : null;
    gesture.engaged = true;
    gesture.startExpanded = !!startExpanded;
    gesture.smallRect = smallRect;
    gesture.largeRect = largeRect;
    gesture.progress = startExpanded ? 1 : 0;
    gesture.largeCoreInset = window.innerWidth <= 390 ? 41 : 44;
    gesture.largeFontSize = window.innerWidth <= 390 ? 61 : 66;
    gesture.smallEcgWidth = ecgRect && ecgRect.width ? ecgRect.width : 58;
    gesture.smallEcgHeight = ecgRect && ecgRect.height ? ecgRect.height : 18;
    gesture.startedAt = performance.now();
    var root = document.documentElement;
    root.classList.add('cardio-focus-dragging');
    root.classList.remove('cardio-focus-active');
    var overlay = ensureFocusChrome();
    if (overlay) overlay.classList.add('show');
    applyDragProgress(gesture.progress);
  }

  function finishInteractiveDrag(targetExpanded) {
    if (!gesture || !gesture.engaged) return;
    if (dragAnimationFrame) cancelAnimationFrame(dragAnimationFrame);
    var from = gesture.progress;
    var to = targetExpanded ? 1 : 0;
    var distance = Math.abs(to - from);
    var duration = Math.max(120,Math.min(240,120 + distance * 120));
    var started = performance.now();
    function step(now) {
      if (!gesture || !gesture.engaged) return;
      var t = Math.min(1,(now - started) / duration);
      var eased = 1 - Math.pow(1 - t,3);
      applyDragProgress(from + (to - from) * eased);
      if (t < 1) {
        dragAnimationFrame = requestAnimationFrame(step);
        return;
      }
      dragAnimationFrame = 0;
      document.documentElement.classList.remove('cardio-focus-dragging');
      clearDragVars();
      if (targetExpanded) {
        collapsedCardioToken = '';
        setFocus(true);
      } else {
        if (lastCardioToken) collapsedCardioToken = lastCardioToken;
        setFocus(false);
      }
      gesture = null;
    }
    dragAnimationFrame = requestAnimationFrame(step);
  }

'''
if anchor not in s:
    raise SystemExit('setFocus anchor missing')
s = s.replace(anchor, helpers + anchor, 1)

# 4. Do not let the background sync fight the interactive drag preview.
s = s.replace(
"    setFocus(shouldShow);\n",
"    if (!document.documentElement.classList.contains('cardio-focus-dragging')) setFocus(shouldShow);\n",
1)

# 5. Replace binary swipe handlers with finger-following drag interaction.
start = s.find("  function installTimerGestures() {")
end = s.find("\n  function frame(now) {", start)
if start < 0 or end < 0:
    raise SystemExit('gesture function block not found')
new_gesture = r'''  function installTimerGestures() {
    document.addEventListener('pointerdown',function (event) {
      if (!isTouchLike() || event.isPrimary === false || dragAnimationFrame) return;
      var ring = event.target && event.target.closest ? event.target.closest('#session-countdown-ring') : null;
      if (!ring || (event.target && event.target.closest && event.target.closest('.cardio-desktop-toggle'))) return;
      gesture = {
        pointerId:event.pointerId,
        ring:ring,
        startX:event.clientX,
        startY:event.clientY,
        lastX:event.clientX,
        lastY:event.clientY,
        lastAt:performance.now(),
        startExpanded:document.documentElement.classList.contains('cardio-focus-active'),
        engaged:false,
        progress:document.documentElement.classList.contains('cardio-focus-active') ? 1 : 0
      };
    },true);

    document.addEventListener('pointermove',function (event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      var dx = event.clientX - gesture.startX;
      var dy = event.clientY - gesture.startY;
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      gesture.lastAt = performance.now();
      var verticalIntent = Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.12;
      var intendedDirection = gesture.startExpanded ? dy > 0 : dy < 0;
      if (!gesture.engaged && verticalIntent && intendedDirection) beginInteractiveDrag(gesture.ring,gesture.startExpanded);
      if (!gesture || !gesture.engaged) return;
      if (event.cancelable) event.preventDefault();
      var travel = Math.max(150,Math.min(220,window.innerHeight * 0.24));
      var progress = gesture.startExpanded ? 1 - Math.max(0,dy) / travel : Math.max(0,-dy) / travel;
      applyDragProgress(progress);
    },{capture:true,passive:false});

    document.addEventListener('pointerup',function (event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      if (!gesture.engaged) {
        gesture = null;
        return;
      }
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
      suppressTimerClickUntil = Date.now() + 650;
      var targetExpanded = gesture.progress >= 0.5;
      finishInteractiveDrag(targetExpanded);
    },true);

    document.addEventListener('pointercancel',function (event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      if (gesture.engaged) finishInteractiveDrag(gesture.startExpanded);
      else gesture = null;
    },true);

    document.addEventListener('click',function (event) {
      if (Date.now() > suppressTimerClickUntil) return;
      var ring = event.target && event.target.closest ? event.target.closest('#session-countdown-ring') : null;
      if (!ring) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressTimerClickUntil = 0;
    },true);
  }
'''
s = s[:start] + new_gesture + s[end:]

p.write_text(s)

# Cache-bust the consolidated timer only; no new versioned timer files.
for filename in ['budget/exercise.html','budget/auth-config.js','budget/auth-gate.js','budget/exercise-pulse-flow-canvas-glow-v131.js']:
    q = Path(filename)
    if not q.exists():
        continue
    text = q.read_text()
    text = text.replace('20260914-timer-focus-final5-swipe','20260914-timer-focus-final6-drag')
    q.write_text(text)
