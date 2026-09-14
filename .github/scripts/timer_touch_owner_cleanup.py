from pathlib import Path

ROOT = Path('.')
focus = ROOT / 'budget/exercise-timer-focus.js'
s = focus.read_text(encoding='utf-8')

# The consolidated drag renderer already calls smoothstep(), but the helper was
# accidentally removed in an earlier cleanup. Add it next to clamp01 so drag
# progress can never abort with a ReferenceError and leave stale gesture state.
if 'function smoothstep(value)' not in s:
    anchor = """  function clamp01(value) {\n    return Math.max(0,Math.min(1,Number(value) || 0));\n  }\n"""
    assert anchor in s, 'clamp01 anchor missing'
    s = s.replace(anchor, anchor + """\n  function smoothstep(value) {\n    var t = clamp01(value);\n    return t * t * (3 - 2 * t);\n  }\n""", 1)

# Remove stale runtime cleanup for deleted v145-v151 timer experiments.
old = """    /* Remove stale styles if an old cached bundle happened to execute first. */\n    [145,146,147,148,149,150,151].forEach(function (version) {\n      var old = document.getElementById('exercise-timer-focus-v' + version + '-style');\n      if (old) old.remove();\n    });\n\n"""
assert old in s, 'stale style cleanup block missing'
s = s.replace(old, '', 1)

old = """    var legacy = document.getElementById('cardio-focus-v145');\n    if (legacy) legacy.remove();\n\n"""
assert old in s, 'legacy focus cleanup missing'
s = s.replace(old, '', 1)

old = """    /* Remove the old explicit focus button and legacy plus element. */\n    document.querySelectorAll('.cardio-focus-expand-v145').forEach(function (button) { button.remove(); });\n    var legacy = document.getElementById('cardio-inline-plus-v145');\n    if (legacy) legacy.remove();\n\n"""
assert old in s, 'legacy plus cleanup missing'
s = s.replace(old, '', 1)

# Reuse the exact compact geometry captured at touchstart. Do not re-measure in beginDrag.
old = "var smallRect = startExpanded ? savedCompactRect() : rememberCompactRect(ring);"
new = "var smallRect = gesture.compactRect || (startExpanded ? savedCompactRect() : rememberCompactRect(ring));"
assert old in s, 'smallRect beginDrag anchor missing'
s = s.replace(old, new, 1)

start = s.index("  function installTimerGestures() {")
end = s.index("\n  function frame(now) {", start)
new_block = r'''  function touchByIdentifier(list,id) {
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      if (Number(list[i].identifier) === Number(id)) return list[i];
    }
    return null;
  }

  function rawCompactRect(ring) {
    if (!ring) return null;
    var rect = null;
    try { rect = ring.getBoundingClientRect(); } catch (_) {}
    if (!rect || rect.width < 20 || rect.height < 20) return null;
    var parent = ring.parentElement;
    var parentRect = null;
    try { parentRect = parent ? parent.getBoundingClientRect() : null; } catch (_) {}
    return {
      left:rect.left,
      top:rect.top,
      width:rect.width,
      height:rect.height,
      parentHeight:parentRect && parentRect.height > 0 ? parentRect.height : rect.height + 8,
      viewportWidth:window.innerWidth || document.documentElement.clientWidth || 0
    };
  }

  function installTimerGestures() {
    if (!isTouchLike()) return;

    document.addEventListener('touchstart',function (event) {
      if (!event.touches || event.touches.length !== 1) return;
      if (dragAnimationFrame && !gesture) dragAnimationFrame = 0;
      if (gesture && !dragAnimationFrame) {
        if (gesture.engaged) cleanupInteractiveDrag(gesture.startExpanded);
        else gesture = null;
      }
      if (dragAnimationFrame || gesture) return;

      var touch = event.changedTouches && event.changedTouches[0] ? event.changedTouches[0] : event.touches[0];
      var probe = {target:event.target,clientX:touch.clientX,clientY:touch.clientY};
      var ring = resolveGestureRing(probe);
      if (!ring || (event.target && event.target.closest && event.target.closest('.cardio-desktop-toggle'))) return;

      var startsExpanded = document.documentElement.classList.contains('cardio-focus-active');
      var compactRect = null;
      if (!startsExpanded) compactRect = rememberCompactRect(ring) || savedCompactRect() || rawCompactRect(ring);
      else compactRect = savedCompactRect();
      if (!compactRect) return;

      gesture = {
        touchId:touch.identifier,
        ring:ring,
        compactRect:compactRect,
        startX:touch.clientX,
        startY:touch.clientY,
        lastX:touch.clientX,
        lastY:touch.clientY,
        lastAt:performance.now(),
        startExpanded:startsExpanded,
        engaged:false,
        finishing:false,
        progress:startsExpanded ? 1 : 0
      };
    },{capture:true,passive:true});

    document.addEventListener('touchmove',function (event) {
      if (!gesture || gesture.finishing) return;
      var touch = touchByIdentifier(event.touches,gesture.touchId);
      if (!touch) return;

      var dx = touch.clientX - gesture.startX;
      var dy = touch.clientY - gesture.startY;
      gesture.lastX = touch.clientX;
      gesture.lastY = touch.clientY;
      gesture.lastAt = performance.now();

      var mostlyVertical = Math.abs(dy) > Math.abs(dx) * 0.9;
      if (mostlyVertical && Math.abs(dy) > 3 && event.cancelable) event.preventDefault();

      var verticalIntent = Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.08;
      var intendedDirection = gesture.startExpanded ? dy > 0 : dy < 0;
      if (!gesture.engaged && verticalIntent && intendedDirection) beginInteractiveDrag(gesture.ring,gesture.startExpanded);
      if (!gesture || !gesture.engaged) return;

      if (event.cancelable) event.preventDefault();
      var travel = Math.max(150,Math.min(220,window.innerHeight * 0.24));
      var progress = gesture.startExpanded ? 1 - Math.max(0,dy) / travel : Math.max(0,-dy) / travel;
      applyDragProgress(progress);
    },{capture:true,passive:false});

    document.addEventListener('touchend',function (event) {
      if (!gesture) return;
      var touch = touchByIdentifier(event.changedTouches,gesture.touchId);
      if (!touch) return;
      if (!gesture.engaged) {
        gesture = null;
        return;
      }
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      suppressTimerClickUntil = Date.now() + 650;
      finishInteractiveDrag(gesture.progress >= 0.5);
    },{capture:true,passive:false});

    document.addEventListener('touchcancel',function (event) {
      if (!gesture) return;
      var touch = touchByIdentifier(event.changedTouches,gesture.touchId);
      if (!touch) return;
      if (gesture.engaged) finishInteractiveDrag(gesture.startExpanded);
      else gesture = null;
    },{capture:true,passive:false});

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
s = s[:start] + new_block + s[end:]
focus.write_text(s, encoding='utf-8')

# Remove the second/dynamic owner for exercise-timer-focus.js from the canvas layer.
layer = ROOT / 'budget/exercise-pulse-flow-canvas-glow-v131.js'
l = layer.read_text(encoding='utf-8')
loader_start = l.index("  function loadTimerFocus() {")
loader_end = l.index("\n  function install() {", loader_start)
l = l[:loader_start] + l[loader_end:]
l = l.replace("    loadSessionPersistence();\n    loadTimerFocus();\n", "    loadSessionPersistence();\n", 1)
layer.write_text(l, encoding='utf-8')

old_ver = '20260914-timer-focus-final18-hitarea'
new_ver = '20260914-timer-focus-final19-touchowner'
for rel in ['budget/exercise.html','budget/auth-config.js','budget/auth-gate.js']:
    p = ROOT / rel
    data = p.read_text(encoding='utf-8')
    assert old_ver in data, f'cache version missing in {rel}'
    p.write_text(data.replace(old_ver,new_ver), encoding='utf-8')

# Static cleanup assertions.
final = focus.read_text(encoding='utf-8')
assert "document.addEventListener('pointerdown'" not in final
assert "document.addEventListener('pointermove'" not in final
assert "document.addEventListener('pointerup'" not in final
assert "cardio-focus-v145" not in final
assert "cardio-focus-expand-v145" not in final
assert "cardio-inline-plus-v145" not in final
assert "exercise-timer-focus-v145" not in final
assert "function smoothstep(value)" in final
assert "document.addEventListener('touchstart'" in final
assert "document.addEventListener('touchmove'" in final
assert "document.addEventListener('touchend'" in final
assert "loadTimerFocus" not in layer.read_text(encoding='utf-8')
print('touch-owner cleanup applied')
