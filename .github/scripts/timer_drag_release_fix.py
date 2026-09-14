from pathlib import Path

ROOT = Path('.')
p = ROOT / 'budget/exercise-timer-focus.js'
s = p.read_text(encoding='utf-8')

# Store the compact countdown wrapper height together with the compact ring rect.
old = """    lastCompactRect = {\n      left:rect.left,\n      top:rect.top,\n      width:rect.width,\n      height:rect.height,\n      viewportWidth:window.innerWidth || document.documentElement.clientWidth || 0,\n      viewportHeight:window.innerHeight || document.documentElement.clientHeight || 0\n    };\n"""
new = """    var compactParent = ring.parentElement;\n    var compactParentRect = compactParent ? compactParent.getBoundingClientRect() : null;\n    lastCompactRect = {\n      left:rect.left,\n      top:rect.top,\n      width:rect.width,\n      height:rect.height,\n      parentHeight:compactParentRect && compactParentRect.height > 0 ? compactParentRect.height : rect.height + 8,\n      viewportWidth:window.innerWidth || document.documentElement.clientWidth || 0\n    };\n"""
assert old in s, 'compact rect object anchor missing'
s = s.replace(old, new, 1)

old = """    return {\n      left:lastCompactRect.left,\n      top:lastCompactRect.top,\n      width:lastCompactRect.width,\n      height:lastCompactRect.height\n    };\n"""
new = """    return {\n      left:lastCompactRect.left,\n      top:lastCompactRect.top,\n      width:lastCompactRect.width,\n      height:lastCompactRect.height,\n      parentHeight:lastCompactRect.parentHeight\n    };\n"""
assert old in s, 'saved compact rect anchor missing'
s = s.replace(old, new, 1)

# Keep the compact timer's normal flow slot reserved during BOTH directions.
# Previously this happened only when expanding. On collapse the fixed ring left
# the wrapper with no in-flow child, so the CTA moved upward under the timer.
old = """    var parent = ring.parentElement;\n    if (parent) {\n      gesture.parent = parent;\n      gesture.parentMinHeight = parent.style.getPropertyValue('min-height');\n      gesture.parentMinHeightPriority = parent.style.getPropertyPriority('min-height');\n      var parentRect = parent.getBoundingClientRect();\n      if (!startExpanded && parentRect.height > 0) {\n        parent.style.setProperty('min-height',parentRect.height.toFixed(2) + 'px','important');\n      }\n    }\n"""
new = """    var parent = ring.parentElement;\n    if (parent) {\n      gesture.parent = parent;\n      gesture.parentMinHeight = parent.style.getPropertyValue('min-height');\n      gesture.parentMinHeightPriority = parent.style.getPropertyPriority('min-height');\n      var reservedHeight = Math.max(Number(smallRect.parentHeight) || 0, Number(smallRect.height) + 8);\n      if (reservedHeight > 0) {\n        parent.style.setProperty('min-height',reservedHeight.toFixed(2) + 'px','important');\n        gesture.reservedParentHeight = reservedHeight;\n      }\n    }\n"""
assert old in s, 'one-way parent min-height anchor missing'
s = s.replace(old, new, 1)

# Prevent duplicate finish paths when pointerup/lostcapture happen close together.
old = """  function finishInteractiveDrag(targetExpanded) {\n    if (!gesture || !gesture.engaged) return;\n    if (dragAnimationFrame) cancelAnimationFrame(dragAnimationFrame);\n"""
new = """  function finishInteractiveDrag(targetExpanded) {\n    if (!gesture || !gesture.engaged || gesture.finishing) return;\n    gesture.finishing = true;\n    if (dragAnimationFrame) cancelAnimationFrame(dragAnimationFrame);\n"""
assert old in s, 'finishInteractiveDrag anchor missing'
s = s.replace(old, new, 1)

# Ignore additional pointer moves once the settle animation has started.
old = """    document.addEventListener('pointermove',function (event) {\n      if (!gesture || event.pointerId !== gesture.pointerId) return;\n"""
new = """    document.addEventListener('pointermove',function (event) {\n      if (!gesture || gesture.finishing || event.pointerId !== gesture.pointerId) return;\n"""
assert old in s, 'pointermove anchor missing'
s = s.replace(old, new, 1)

# Capture the pointer on the moving ring. This is especially important on iOS
# Safari, where moving the target under the finger can otherwise lose pointerup.
old = """      gesture = {\n        pointerId:event.pointerId,\n        ring:ring,\n        startX:event.clientX,\n        startY:event.clientY,\n        lastX:event.clientX,\n        lastY:event.clientY,\n        lastAt:performance.now(),\n        startExpanded:startsExpanded,\n        engaged:false,\n        progress:startsExpanded ? 1 : 0\n      };\n"""
new = """      gesture = {\n        pointerId:event.pointerId,\n        ring:ring,\n        startX:event.clientX,\n        startY:event.clientY,\n        lastX:event.clientX,\n        lastY:event.clientY,\n        lastAt:performance.now(),\n        startExpanded:startsExpanded,\n        engaged:false,\n        finishing:false,\n        progress:startsExpanded ? 1 : 0\n      };\n      try { if (ring.setPointerCapture) ring.setPointerCapture(event.pointerId); } catch (_) {}\n"""
assert old in s, 'pointerdown gesture anchor missing'
s = s.replace(old, new, 1)

# Add a lostpointercapture fallback. Normal pointerup starts finishing first, so
# this becomes a no-op in the normal path and only recovers genuinely lost ups.
old = """    document.addEventListener('pointercancel',function (event) {\n      if (!gesture || event.pointerId !== gesture.pointerId) return;\n      if (gesture.engaged) finishInteractiveDrag(gesture.startExpanded);\n      else gesture = null;\n    },true);\n\n    document.addEventListener('click',function (event) {\n"""
new = """    document.addEventListener('pointercancel',function (event) {\n      if (!gesture || event.pointerId !== gesture.pointerId) return;\n      if (gesture.engaged) finishInteractiveDrag(gesture.startExpanded);\n      else gesture = null;\n    },true);\n\n    document.addEventListener('lostpointercapture',function (event) {\n      if (!gesture || gesture.finishing || event.pointerId !== gesture.pointerId) return;\n      if (!gesture.engaged) { gesture = null; return; }\n      suppressTimerClickUntil = Date.now() + 650;\n      finishInteractiveDrag(gesture.progress >= 0.5);\n    },true);\n\n    document.addEventListener('click',function (event) {\n"""
assert old in s, 'pointercancel anchor missing'
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')

old_ver = '20260914-timer-focus-final15-canonical'
new_ver = '20260914-timer-focus-final16-release-slot'
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

print('timer drag release + compact layout slot fix applied')
