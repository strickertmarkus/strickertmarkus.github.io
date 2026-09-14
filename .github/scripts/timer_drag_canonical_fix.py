from pathlib import Path

ROOT = Path('.')
p = ROOT / 'budget/exercise-timer-focus.js'
s = p.read_text(encoding='utf-8')

# 1) Hide stale Canvas glow layers during an interactive drag. The SVG remains
# visible; this prevents a frozen canvas halo from appearing elsewhere on screen.
old = """      html.cardio-focus-dragging .cardio-desktop-toggle {\n        display:none!important;\n      }\n"""
new = old + """      html.cardio-focus-dragging canvas.pf-canvas-glow-v130 {\n        display:none!important;\n        opacity:0!important;\n      }\n      html.cardio-focus-dragging #session-countdown-ring .pf-arc-progress-v80 {\n        filter:drop-shadow(0 0 3.5px rgba(239,68,68,.78)) drop-shadow(0 0 10px rgba(239,68,68,.30))!important;\n        -webkit-filter:drop-shadow(0 0 3.5px rgba(239,68,68,.78)) drop-shadow(0 0 10px rgba(239,68,68,.30))!important;\n      }\n"""
assert old in s, 'drag css anchor missing'
s = s.replace(old, new, 1)

# 2) Compact geometry is accepted only when it really looks like the centered
# compact timer. This prevents any half-morphed/off-screen rect from poisoning
# the next reverse drag.
old = """    var rect = ring.getBoundingClientRect();\n    if (!rect || rect.width < 20 || rect.height < 20) return null;\n    var large = focusTargetRect();\n    /* Reject anything that already looks like the expanded timer. */\n    if (rect.width > large.width * 0.72 || rect.height > large.height * 0.72) return null;\n    lastCompactRect = {\n"""
new = """    var rect = ring.getBoundingClientRect();\n    if (!rect || rect.width < 20 || rect.height < 20) return null;\n    var vw = window.innerWidth || document.documentElement.clientWidth || 0;\n    var vh = window.innerHeight || document.documentElement.clientHeight || 0;\n    var large = focusTargetRect();\n    var centerX = rect.left + rect.width / 2;\n    /* Reject expanded, off-screen or non-centered geometry. The compact Pulse\n       Flow timer is always centered in its normal row. */\n    if (rect.width > large.width * 0.72 || rect.height > large.height * 0.72) return null;\n    if (Math.abs(centerX - vw / 2) > Math.max(26, vw * 0.18)) return null;\n    if (rect.bottom <= 0 || rect.top >= vh) return null;\n    lastCompactRect = {\n"""
assert old in s, 'compact validation anchor missing'
s = s.replace(old, new, 1)

# 3) Only viewport width matters for the horizontal anchor. Mobile Safari may
# change visual viewport height as its browser chrome expands/collapses.
old = """    var vw = window.innerWidth || document.documentElement.clientWidth || 0;\n    var vh = window.innerHeight || document.documentElement.clientHeight || 0;\n    if (Math.abs((lastCompactRect.viewportWidth || 0) - vw) >= 3 ||\n        Math.abs((lastCompactRect.viewportHeight || 0) - vh) >= 3) return null;\n"""
new = """    var vw = window.innerWidth || document.documentElement.clientWidth || 0;\n    if (Math.abs((lastCompactRect.viewportWidth || 0) - vw) >= 3) return null;\n"""
assert old in s, 'saved compact viewport anchor missing'
s = s.replace(old, new, 1)

# 4) Canonical drag: the compact rect is always the base coordinate system.
# Forward and reverse are therefore exact inverses of the same transform.
old = """    var small = gesture.smallRect;\n    var large = gesture.largeRect;\n    var source = gesture.sourceRect;\n    var targetLeft = mix(small.left,large.left,progress);\n    var targetTop = mix(small.top,large.top,progress);\n    var targetSize = mix(small.width,large.width,progress);\n    var tx = targetLeft - source.left;\n    var ty = targetTop - source.top;\n    var scale = targetSize / Math.max(1,source.width);\n"""
new = """    var small = gesture.smallRect;\n    var large = gesture.largeRect;\n    var targetLeft = mix(small.left,large.left,progress);\n    var targetTop = mix(small.top,large.top,progress);\n    var targetSize = mix(small.width,large.width,progress);\n    var tx = targetLeft - small.left;\n    var ty = targetTop - small.top;\n    var scale = targetSize / Math.max(1,small.width);\n"""
assert old in s, 'drag progress source anchor missing'
s = s.replace(old, new, 1)

# 5) Replace the old asymmetric begin-drag geometry completely. During drag the
# settled focus class is removed, so it cannot fight the inline transform on
# Safari. The compact timer remains the sole canonical render tree.
start = s.index("  function beginInteractiveDrag(ring,startExpanded) {")
end = s.index("\n  function cleanupInteractiveDrag(targetExpanded) {", start)
new_func = r'''  function beginInteractiveDrag(ring,startExpanded) {
    if (!gesture || gesture.engaged || !ring) return;

    var smallRect = startExpanded ? savedCompactRect() : rememberCompactRect(ring);
    if (!smallRect) {
      gesture.engaged = false;
      return;
    }
    var largeRect = focusTargetRect();

    gesture.engaged = true;
    gesture.startExpanded = !!startExpanded;
    gesture.ring = ring;
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

    var root = document.documentElement;
    root.classList.add('cardio-focus-dragging');
    /* The settled focus rules include fixed positioning and translate(-50%).
       Remove them for both directions; drag now has one geometry authority. */
    root.classList.remove('cardio-focus-active');

    var dragOverlay = ensureFocusChrome();
    if (dragOverlay) dragOverlay.classList.add('show');

    applyDragBase(ring,smallRect);
    applyDragProgress(gesture.progress);
  }
'''
s = s[:start] + new_func + s[end:]

# 6) Auto-focus must first have a verified compact anchor. If the timer has not
# laid out yet, syncCardio simply retries on its next frame instead of saving bad
# geometry.
old = """    if (visible && !root.classList.contains('cardio-focus-active') && !root.classList.contains('cardio-focus-dragging')) {\n      rememberCompactRect(document.getElementById('session-countdown-ring'));\n    }\n    root.classList.toggle('cardio-focus-active',!!visible);\n"""
new = """    if (visible && !root.classList.contains('cardio-focus-active') && !root.classList.contains('cardio-focus-dragging')) {\n      if (!rememberCompactRect(document.getElementById('session-countdown-ring'))) return false;\n    }\n    root.classList.toggle('cardio-focus-active',!!visible);\n"""
assert old in s, 'setFocus anchor missing'
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')

# Canvas renderer: clear stale glows instead of freezing them while drag is in
# progress. This removes stray orange/red blobs left at pre-drag coordinates.
cp = ROOT / 'budget/exercise-pulse-flow-canvas-glow-v130.js'
c = cp.read_text(encoding='utf-8')
old = """    if (document.documentElement.classList.contains('cardio-focus-dragging')) {\n      rafId = requestAnimationFrame(frame);\n      return;\n    }\n"""
new = """    if (document.documentElement.classList.contains('cardio-focus-dragging')) {\n      clearAll();\n      rafId = requestAnimationFrame(frame);\n      return;\n    }\n"""
assert old in c, 'canvas drag frame anchor missing'
c = c.replace(old, new, 1)
cp.write_text(c, encoding='utf-8')

old_ver = '20260914-timer-focus-final14-cleananchor'
new_ver = '20260914-timer-focus-final15-canonical'
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

print('canonical bidirectional drag + stale canvas cleanup applied')
