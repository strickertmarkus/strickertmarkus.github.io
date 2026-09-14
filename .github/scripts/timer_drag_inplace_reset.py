from pathlib import Path

ROOT = Path('.')
timer_path = ROOT / 'budget/exercise-timer-focus.js'
text = timer_path.read_text(encoding='utf-8')

# Remove the failed proxy/reparenting state variables.
text = text.replace("  var morphProxy = null;\n  var morphMarker = null;\n  var morphHome = null;\n", "")

# Remove the entire failed proxy CSS and replace it with a minimal in-place drag rule.
start = text.index("      /* Mobile drag preview: move the one real live timer into a fixed proxy.")
end = text.index("      /* Optical centering of the compact numeric value only; ring geometry is untouched. */", start)
new_drag_css = '''      /* Mobile drag preview: transform the existing live timer in place.
         No proxy, no reparenting, no duplicate render tree. The timer keeps its
         current native internal layout while the whole ring follows the finger. */
      html.cardio-focus-dragging #session-countdown-ring,
      html.cardio-focus-dragging #session-countdown-ring * {
        transition:none!important;
      }
      html.cardio-focus-dragging #session-countdown-ring {
        will-change:transform!important;
        backface-visibility:hidden!important;
        -webkit-backface-visibility:hidden!important;
      }
      html.cardio-focus-dragging .cardio-desktop-toggle {
        display:none!important;
      }

'''
text = text[:start] + new_drag_css + text[end:]

# Replace the whole failed proxy JS section. Keep focusTargetRect/measureSmallRing,
# then animate only the real ring via inline !important geometry.
start = text.index("  function setDragVar(name,value) {")
end = text.index("  function getAudioContext() {", start)
new_drag_js = r'''  var DRAG_STYLE_PROPS = [
    'position','left','top','right','bottom','width','height','min-width','min-height',
    'margin','flex','flex-basis','transform','transform-origin','z-index','overflow',
    'pointer-events','will-change','backface-visibility','-webkit-backface-visibility'
  ];

  function captureDragInline(ring) {
    var saved = {};
    DRAG_STYLE_PROPS.forEach(function (name) {
      saved[name] = {
        value:ring.style.getPropertyValue(name),
        priority:ring.style.getPropertyPriority(name)
      };
    });
    return saved;
  }

  function restoreDragInline(ring,saved) {
    if (!ring || !saved) return;
    DRAG_STYLE_PROPS.forEach(function (name) {
      var item = saved[name];
      if (item && item.value) ring.style.setProperty(name,item.value,item.priority || '');
      else ring.style.removeProperty(name);
    });
  }

  function applyDragBase(ring,source) {
    if (!ring || !source) return;
    ring.style.setProperty('position','fixed','important');
    ring.style.setProperty('left',source.left.toFixed(2) + 'px','important');
    ring.style.setProperty('top',source.top.toFixed(2) + 'px','important');
    ring.style.setProperty('right','auto','important');
    ring.style.setProperty('bottom','auto','important');
    ring.style.setProperty('width',source.width.toFixed(2) + 'px','important');
    ring.style.setProperty('height',source.height.toFixed(2) + 'px','important');
    ring.style.setProperty('min-width','0','important');
    ring.style.setProperty('min-height','0','important');
    ring.style.setProperty('margin','0','important');
    ring.style.setProperty('flex','none','important');
    ring.style.setProperty('flex-basis','auto','important');
    ring.style.setProperty('transform-origin','0 0','important');
    ring.style.setProperty('z-index','2147483590','important');
    ring.style.setProperty('overflow','visible','important');
    ring.style.setProperty('pointer-events','auto','important');
    ring.style.setProperty('will-change','transform','important');
    ring.style.setProperty('backface-visibility','hidden','important');
    ring.style.setProperty('-webkit-backface-visibility','hidden','important');
  }

  function applyDragProgress(progress) {
    if (!gesture || !gesture.engaged || !gesture.ring) return;
    progress = clamp01(progress);
    gesture.progress = progress;

    var small = gesture.smallRect;
    var large = gesture.largeRect;
    var source = gesture.sourceRect;
    var targetLeft = mix(small.left,large.left,progress);
    var targetTop = mix(small.top,large.top,progress);
    var targetSize = mix(small.width,large.width,progress);
    var tx = targetLeft - source.left;
    var ty = targetTop - source.top;
    var scale = targetSize / Math.max(1,source.width);

    gesture.ring.style.setProperty(
      'transform',
      'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(' + scale.toFixed(5) + ')',
      'important'
    );
  }

  function beginInteractiveDrag(ring,startExpanded) {
    if (!gesture || gesture.engaged || !ring) return;

    /* Capture the visible source before measuring the opposite state. */
    var sourceRectRaw = ring.getBoundingClientRect();
    var sourceRect = {
      left:sourceRectRaw.left, top:sourceRectRaw.top,
      width:sourceRectRaw.width, height:sourceRectRaw.height
    };
    var smallRect = startExpanded ? measureSmallRing(ring) : sourceRect;
    var largeRect = startExpanded ? sourceRect : focusTargetRect();

    gesture.engaged = true;
    gesture.startExpanded = !!startExpanded;
    gesture.ring = ring;
    gesture.sourceRect = sourceRect;
    gesture.smallRect = smallRect;
    gesture.largeRect = largeRect;
    gesture.progress = startExpanded ? 1 : 0;
    gesture.startedAt = performance.now();
    gesture.inlineBackup = captureDragInline(ring);

    var parent = ring.parentElement;
    if (parent) {
      gesture.parent = parent;
      gesture.parentMinHeight = parent.style.getPropertyValue('min-height');
      gesture.parentMinHeightPriority = parent.style.getPropertyPriority('min-height');
      var parentRect = parent.getBoundingClientRect();
      if (!startExpanded && parentRect.height > 0) {
        parent.style.setProperty('min-height',parentRect.height.toFixed(2) + 'px','important');
      }
    }

    document.documentElement.classList.add('cardio-focus-dragging');
    applyDragBase(ring,sourceRect);
    applyDragProgress(gesture.progress);
  }

  function cleanupInteractiveDrag(targetExpanded) {
    if (!gesture) return;
    var ring = gesture.ring;
    restoreDragInline(ring,gesture.inlineBackup);
    if (gesture.parent) {
      if (gesture.parentMinHeight) gesture.parent.style.setProperty('min-height',gesture.parentMinHeight,gesture.parentMinHeightPriority || '');
      else gesture.parent.style.removeProperty('min-height');
    }
    document.documentElement.classList.remove('cardio-focus-dragging');
    setFocus(!!targetExpanded);
    gesture = null;
    requestAnimationFrame(function () {
      try { window.dispatchEvent(new Event('resize')); } catch (_) {}
    });
  }

  function finishInteractiveDrag(targetExpanded) {
    if (!gesture || !gesture.engaged) return;
    if (dragAnimationFrame) cancelAnimationFrame(dragAnimationFrame);
    var from = gesture.progress;
    var to = targetExpanded ? 1 : 0;
    var distance = Math.abs(to - from);
    var duration = Math.max(105,Math.min(190,95 + distance * 110));
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
      if (targetExpanded) collapsedCardioToken = '';
      else if (lastCardioToken) collapsedCardioToken = lastCardioToken;
      cleanupInteractiveDrag(targetExpanded);
    }
    dragAnimationFrame = requestAnimationFrame(step);
  }

  function setFocus(visible) {
    var overlay = ensureFocusChrome();
    document.documentElement.classList.toggle('cardio-focus-active',!!visible);
    if (overlay) {
      overlay.classList.toggle('show',!!visible);
      overlay.setAttribute('aria-hidden',visible ? 'false' : 'true');
    }
  }

  function collapseFocus() {
    if (lastCardioToken) collapsedCardioToken = lastCardioToken;
    setFocus(false);
  }

  function expandFocus() {
    var state = getState();
    var exercise = currentExercise(state);
    if (!isTimedCardio(state,exercise)) return;
    collapsedCardioToken = '';
    setFocus(true);
  }

  function toggleFocus() {
    var state = getState();
    var exercise = currentExercise(state);
    if (!isTimedCardio(state,exercise)) return;
    if (document.documentElement.classList.contains('cardio-focus-active')) collapseFocus();
    else expandFocus();
  }

'''
text = text[:start] + new_drag_js + text[end:]

# Remove stale proxy/source-hidden classes or DOM left by an older cached run.
install_anchor = "  function install() {\n    ensureStyle();\n"
install_repl = "  function install() {\n    document.documentElement.classList.remove('cardio-focus-source-hidden','cardio-focus-dragging');\n    var staleProxy = document.getElementById('cardio-timer-morph-proxy');\n    if (staleProxy) staleProxy.remove();\n    ensureStyle();\n"
assert install_anchor in text, 'install anchor missing'
text = text.replace(install_anchor,install_repl,1)

timer_path.write_text(text,encoding='utf-8')

# Freeze the existing Canvas frames during drag instead of resizing them from transformed
# screen coordinates. The already-painted canvas then simply follows the parent transform.
canvas_path = ROOT / 'budget/exercise-pulse-flow-canvas-glow-v130.js'
canvas = canvas_path.read_text(encoding='utf-8')
frame_anchor = "  function frame() {\n    rafId = 0;\n    if (!isSessionVisible()) {"
frame_repl = "  function frame() {\n    rafId = 0;\n    if (document.documentElement.classList.contains('cardio-focus-dragging')) {\n      rafId = requestAnimationFrame(frame);\n      return;\n    }\n    if (!isSessionVisible()) {"
assert frame_anchor in canvas, 'canvas frame anchor missing'
canvas = canvas.replace(frame_anchor,frame_repl,1)
canvas_path.write_text(canvas,encoding='utf-8')

old_ver = '20260914-timer-focus-final10-cleanmorph'
new_ver = '20260914-timer-focus-final11-inplace'
for rel in [
    'budget/exercise.html',
    'budget/auth-config.js',
    'budget/auth-gate.js',
    'budget/exercise-pulse-flow-canvas-glow-v131.js',
]:
    path = ROOT / rel
    data = path.read_text(encoding='utf-8')
    assert old_ver in data, f'cache version missing in {rel}'
    path.write_text(data.replace(old_ver,new_ver),encoding='utf-8')

print('replaced failed proxy drag with in-place live timer drag')
