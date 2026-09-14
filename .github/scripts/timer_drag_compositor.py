from pathlib import Path

focus_path = Path('budget/exercise-timer-focus.js')
s = focus_path.read_text()

css_start = s.index('      /* Mobile drag preview:')
css_end = s.index('      /* Optical centering of the compact numeric value only; ring geometry is untouched. */', css_start)
new_css = r'''      /* Mobile drag preview: compositor-only whole-ring morph.
         Do not resize/reflow the timer internals while the finger moves. The complete
         live timer (arc, glow, ECG and copy) is transformed as one visual object, so
         every layer stays perfectly registered. End states still render at native size. */
      html.cardio-focus-dragging {
        --cf-progress:0;
        --cf-chrome-progress:0;
        --cf-content-opacity:1;
      }
      html.cardio-focus-dragging #cardio-focus {
        display:block!important;
        opacity:var(--cf-chrome-progress)!important;
      }
      html.cardio-focus-dragging .cardio-focus-title,
      html.cardio-focus-dragging .cardio-focus-close {
        opacity:var(--cf-chrome-progress)!important;
      }
      html.cardio-focus-dragging .cardio-focus-title {
        transform:translateX(-50%) translateY(var(--cf-title-shift,18px))!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) {
        z-index:2147483500!important;
        pointer-events:none!important;
        isolation:isolate!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode)::after {
        content:''!important;
        display:block!important;
        position:fixed!important;
        inset:0!important;
        z-index:2147483501!important;
        pointer-events:none!important;
        opacity:var(--cf-chrome-progress)!important;
        background:
          radial-gradient(circle at 50% 45%,rgba(239,68,68,.20),transparent 35%),
          radial-gradient(circle at 50% 112%,rgba(127,29,29,.17),transparent 43%),
          linear-gradient(180deg,#16090C 0%,#10070A 48%,#09070A 100%)!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-top,
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-grid > .session-card:not(.session-main),
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-main > *:not(#session-cardio-countdown) {
        opacity:var(--cf-content-opacity)!important;
        pointer-events:none!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown.show {
        opacity:1!important;
        visibility:visible!important;
        position:fixed!important;
        inset:0!important;
        z-index:2147483550!important;
        width:100vw!important;
        height:100dvh!important;
        min-height:100svh!important;
        margin:0!important;
        padding:0!important;
        display:block!important;
        overflow:visible!important;
        pointer-events:none!important;
        background:transparent!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring {
        opacity:1!important;
        visibility:visible!important;
        display:grid!important;
        position:fixed!important;
        left:var(--cf-base-left)!important;
        top:var(--cf-base-top)!important;
        right:auto!important;
        bottom:auto!important;
        width:var(--cf-base-size)!important;
        height:var(--cf-base-size)!important;
        min-width:0!important;
        min-height:0!important;
        flex:0 0 var(--cf-base-size)!important;
        flex-basis:var(--cf-base-size)!important;
        aspect-ratio:1!important;
        margin:0!important;
        transform-origin:0 0!important;
        transform:translate3d(var(--cf-translate-x),var(--cf-translate-y),0) scale(var(--cf-scale))!important;
        z-index:2147483551!important;
        overflow:visible!important;
        pointer-events:auto!important;
        will-change:transform!important;
        backface-visibility:hidden!important;
        -webkit-backface-visibility:hidden!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-core {
        inset:18px!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-copy {
        width:calc(100% - 52px)!important;
        min-width:0!important;
        margin:0 auto!important;
        transform:none!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
        font-size:27px!important;
        line-height:1!important;
        letter-spacing:-.6px!important;
        transform:translateX(var(--cf-time-nudge,1px))!important;
        white-space:nowrap!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-label,
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-pause-hint,
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .pf-ecg-v80 {
        transform:none!important;
      }

'''
s = s[:css_start] + new_css + s[css_end:]

fn_start = s.index('  function clearDragVars() {')
fn_end = s.index('  function setFocus(visible) {', fn_start)
new_functions = r'''  function clearDragVars() {
    [
      '--cf-progress','--cf-chrome-progress','--cf-content-opacity',
      '--cf-base-left','--cf-base-top','--cf-base-size',
      '--cf-translate-x','--cf-translate-y','--cf-scale',
      '--cf-time-nudge','--cf-title-shift'
    ].forEach(function (name) { document.documentElement.style.removeProperty(name); });
  }

  function smoothstep(value) {
    value = clamp01(value);
    return value * value * (3 - 2 * value);
  }

  function applyDragProgress(progress) {
    if (!gesture || !gesture.engaged) return;
    progress = clamp01(progress);
    gesture.progress = progress;

    var small = gesture.smallRect;
    var large = gesture.largeRect;
    var ratio = Math.max(1,large.width / Math.max(1,small.width));
    var scale = mix(1,ratio,progress);
    var tx = mix(0,large.left - small.left,progress);
    var ty = mix(0,large.top - small.top,progress);
    var chrome = smoothstep(clamp01((progress - 0.12) / 0.88));
    var contentFade = smoothstep(clamp01(progress / 0.72));

    setDragVar('--cf-progress',String(progress));
    setDragVar('--cf-chrome-progress',chrome.toFixed(4));
    setDragVar('--cf-content-opacity',(1 - contentFade).toFixed(4));
    setDragVar('--cf-base-left',small.left.toFixed(2) + 'px');
    setDragVar('--cf-base-top',small.top.toFixed(2) + 'px');
    setDragVar('--cf-base-size',small.width.toFixed(2) + 'px');
    setDragVar('--cf-translate-x',tx.toFixed(2) + 'px');
    setDragVar('--cf-translate-y',ty.toFixed(2) + 'px');
    setDragVar('--cf-scale',scale.toFixed(5));
    setDragVar('--cf-time-nudge',mix(1,0,progress).toFixed(2) + 'px');
    setDragVar('--cf-title-shift',mix(18,0,chrome).toFixed(2) + 'px');
  }

  function beginInteractiveDrag(ring,startExpanded) {
    if (!gesture || gesture.engaged) return;
    var smallRect = measureSmallRing(ring);
    var largeRect = focusTargetRect();
    gesture.engaged = true;
    gesture.startExpanded = !!startExpanded;
    gesture.smallRect = smallRect;
    gesture.largeRect = largeRect;
    gesture.progress = startExpanded ? 1 : 0;
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
    var duration = Math.max(110,Math.min(210,105 + distance * 135));
    var started = performance.now();

    function step(now) {
      if (!gesture || !gesture.engaged) return;
      var t = Math.min(1,(now - started) / duration);
      var eased = 1 - Math.pow(1 - t,4);
      applyDragProgress(from + (to - from) * eased);
      if (t < 1) {
        dragAnimationFrame = requestAnimationFrame(step);
        return;
      }

      dragAnimationFrame = 0;
      if (targetExpanded) {
        collapsedCardioToken = '';
        setFocus(true);
      } else {
        if (lastCardioToken) collapsedCardioToken = lastCardioToken;
        setFocus(false);
      }
      document.documentElement.classList.remove('cardio-focus-dragging');
      clearDragVars();
      gesture = null;
      requestAnimationFrame(function () {
        try { window.dispatchEvent(new Event('resize')); } catch (_) {}
      });
    }
    dragAnimationFrame = requestAnimationFrame(step);
  }

'''
s = s[:fn_start] + new_functions + s[fn_end:]
focus_path.write_text(s)

old = '20260914-timer-focus-final7-dragfix'
new = '20260914-timer-focus-final8-compositor'
for name in [
    'budget/exercise.html',
    'budget/auth-config.js',
    'budget/auth-gate.js',
    'budget/exercise-pulse-flow-canvas-glow-v131.js',
]:
    path = Path(name)
    text = path.read_text()
    if old in text:
        path.write_text(text.replace(old,new))

for name in [
    '.github/scripts/timer_drag_visual_sync.py',
    '.github/scripts/timer_drag_compositor.py',
    '.github/workflows/timer-drag-visual-sync.yml',
    '.github/workflows/timer-drag-visual-sync-v2.yml',
    '.github/workflows/timer-drag-compositor.yml',
]:
    Path(name).unlink(missing_ok=True)
