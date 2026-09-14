from pathlib import Path

ROOT = Path('.')
p = ROOT / 'budget/exercise-timer-focus.js'
s = p.read_text(encoding='utf-8')

# 1) Make cleanup fully terminal and re-arm the compact anchor after a collapse.
old = """  function cleanupInteractiveDrag(targetExpanded) {\n    if (!gesture) return;\n    var ring = gesture.ring;\n    restoreDragInline(ring,gesture.inlineBackup);\n    if (gesture.parent) {\n      if (gesture.parentMinHeight) gesture.parent.style.setProperty('min-height',gesture.parentMinHeight,gesture.parentMinHeightPriority || '');\n      else gesture.parent.style.removeProperty('min-height');\n    }\n    document.documentElement.classList.remove('cardio-focus-dragging');\n    document.documentElement.style.removeProperty('--cf-drag-bg');\n    document.documentElement.style.removeProperty('--cf-drag-chrome');\n    document.documentElement.style.removeProperty('--cf-drag-content');\n    setFocus(!!targetExpanded);\n    gesture = null;\n    requestAnimationFrame(function () {\n      try { window.dispatchEvent(new Event('resize')); } catch (_) {}\n    });\n  }\n"""
new = """  function cleanupInteractiveDrag(targetExpanded) {\n    if (!gesture) return;\n    var ring = gesture.ring;\n    dragAnimationFrame = 0;\n    restoreDragInline(ring,gesture.inlineBackup);\n    if (gesture.parent) {\n      if (gesture.parentMinHeight) gesture.parent.style.setProperty('min-height',gesture.parentMinHeight,gesture.parentMinHeightPriority || '');\n      else gesture.parent.style.removeProperty('min-height');\n    }\n    document.documentElement.classList.remove('cardio-focus-dragging');\n    document.documentElement.style.removeProperty('--cf-drag-bg');\n    document.documentElement.style.removeProperty('--cf-drag-chrome');\n    document.documentElement.style.removeProperty('--cf-drag-content');\n    setFocus(!!targetExpanded);\n    var rearmCompact = !targetExpanded;\n    gesture = null;\n    requestAnimationFrame(function () {\n      if (rearmCompact && !document.documentElement.classList.contains('cardio-focus-active') &&\n          !document.documentElement.classList.contains('cardio-focus-dragging')) {\n        rememberCompactRect(ring);\n      }\n      try { window.dispatchEvent(new Event('resize')); } catch (_) {}\n    });\n  }\n"""
assert old in s, 'cleanupInteractiveDrag anchor missing'
s = s.replace(old, new, 1)

# 2) Replace explicit pointer capture with a clean re-arm guard. Document-level
# pointer listeners + touch-action:none are sufficient, and avoiding capture is
# more reliable on iOS while the ring changes fixed/transform state.
old = """    document.addEventListener('pointerdown',function (event) {\n      if (!isTouchLike() || event.isPrimary === false || dragAnimationFrame) return;\n      var ring = event.target && event.target.closest ? event.target.closest('#session-countdown-ring') : null;\n      if (!ring || (event.target && event.target.closest && event.target.closest('.cardio-desktop-toggle'))) return;\n      var startsExpanded = document.documentElement.classList.contains('cardio-focus-active');\n      if (!startsExpanded) rememberCompactRect(ring);\n      gesture = {\n        pointerId:event.pointerId,\n        ring:ring,\n        startX:event.clientX,\n        startY:event.clientY,\n        lastX:event.clientX,\n        lastY:event.clientY,\n        lastAt:performance.now(),\n        startExpanded:startsExpanded,\n        engaged:false,\n        finishing:false,\n        progress:startsExpanded ? 1 : 0\n      };\n      try { if (ring.setPointerCapture) ring.setPointerCapture(event.pointerId); } catch (_) {}\n    },true);\n"""
new = """    document.addEventListener('pointerdown',function (event) {\n      if (dragAnimationFrame && !gesture) dragAnimationFrame = 0;\n      if (gesture && !dragAnimationFrame) {\n        if (gesture.engaged) cleanupInteractiveDrag(gesture.startExpanded);\n        else gesture = null;\n      }\n      if (!isTouchLike() || event.isPrimary === false || dragAnimationFrame || gesture) return;\n      var ring = event.target && event.target.closest ? event.target.closest('#session-countdown-ring') : null;\n      if (!ring || (event.target && event.target.closest && event.target.closest('.cardio-desktop-toggle'))) return;\n      var startsExpanded = document.documentElement.classList.contains('cardio-focus-active');\n      if (!startsExpanded) rememberCompactRect(ring);\n      gesture = {\n        pointerId:event.pointerId,\n        ring:ring,\n        startX:event.clientX,\n        startY:event.clientY,\n        lastX:event.clientX,\n        lastY:event.clientY,\n        lastAt:performance.now(),\n        startExpanded:startsExpanded,\n        engaged:false,\n        finishing:false,\n        progress:startsExpanded ? 1 : 0\n      };\n    },true);\n"""
assert old in s, 'pointerdown capture anchor missing'
s = s.replace(old, new, 1)

# 3) Remove the lostpointercapture branch entirely; there is no capture anymore.
old = """    document.addEventListener('lostpointercapture',function (event) {\n      if (!gesture || gesture.finishing || event.pointerId !== gesture.pointerId) return;\n      if (!gesture.engaged) { gesture = null; return; }\n      suppressTimerClickUntil = Date.now() + 650;\n      finishInteractiveDrag(gesture.progress >= 0.5);\n    },true);\n\n"""
assert old in s, 'lostpointercapture anchor missing'
s = s.replace(old, '', 1)

p.write_text(s, encoding='utf-8')

old_ver = '20260914-timer-focus-final16-release-slot'
new_ver = '20260914-timer-focus-final17-rearm'
for rel in [
    'budget/exercise.html',
    'budget/auth-config.js',
    'budget/auth-gate.js',
    'budget/exercise-pulse-flow-canvas-glow-v131.js',
]:
    path = ROOT / rel
    data = path.read_text(encoding='utf-8')
    assert old_ver in data, f'cache version missing in {rel}'
    path.write_text(data.replace(old_ver,new_ver), encoding='utf-8')

print('timer gesture re-arm fix applied')
