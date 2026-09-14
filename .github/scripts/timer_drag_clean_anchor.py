from pathlib import Path

ROOT = Path('.')
p = ROOT / 'budget/exercise-timer-focus.js'
s = p.read_text(encoding='utf-8')

# Remove the old measureSmallRing toggle-based fallback entirely. It changes focus
# classes just to measure and was one source of stale/half-transition geometry.
start = s.index("  function measureSmallRing(ring) {")
end = s.index("  var DRAG_STYLE_PROPS = [", start)
s = s[:start] + s[end:]

# Add one strict compact-rect capture helper after focusTargetRect().
anchor = """  function focusTargetRect() {
    var vw = Math.max(1,window.innerWidth || document.documentElement.clientWidth || 1);
    var vh = Math.max(1,window.innerHeight || document.documentElement.clientHeight || 1);
    var compact = vw <= 390;
    var short = vh <= 700;
    var size = compact ? Math.min(300,vw * 0.80) : Math.min(324,vw * 0.82);
    var centerY = vh * (short ? 0.58 : 0.59);
    return {left:(vw - size) / 2,top:centerY - size / 2,width:size,height:size};
  }

"""
helper = anchor + """  function rememberCompactRect(ring) {
    if (!ring) return null;
    var root = document.documentElement;
    if (root.classList.contains('cardio-focus-active') || root.classList.contains('cardio-focus-dragging')) return null;
    var rect = ring.getBoundingClientRect();
    if (!rect || rect.width < 20 || rect.height < 20) return null;
    var large = focusTargetRect();
    /* Reject anything that already looks like the expanded timer. */
    if (rect.width > large.width * 0.72 || rect.height > large.height * 0.72) return null;
    lastCompactRect = {
      left:rect.left,
      top:rect.top,
      width:rect.width,
      height:rect.height,
      viewportWidth:window.innerWidth || document.documentElement.clientWidth || 0,
      viewportHeight:window.innerHeight || document.documentElement.clientHeight || 0
    };
    return lastCompactRect;
  }

  function savedCompactRect() {
    if (!lastCompactRect) return null;
    var vw = window.innerWidth || document.documentElement.clientWidth || 0;
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (Math.abs((lastCompactRect.viewportWidth || 0) - vw) >= 3 ||
        Math.abs((lastCompactRect.viewportHeight || 0) - vh) >= 3) return null;
    return {
      left:lastCompactRect.left,
      top:lastCompactRect.top,
      width:lastCompactRect.width,
      height:lastCompactRect.height
    };
  }

"""
assert anchor in s, 'focusTargetRect anchor missing'
s = s.replace(anchor, helper, 1)

# Replace reverse geometry block. No measuring while focus CSS is active and no
# fallback that toggles classes. Compact geometry must come from a real compact state.
old = """    /* The collapsed source is measured live. The expanded source is deterministic:
       Safari can report a transient rect for the fixed + translated large timer
       during pointer capture, which previously made reverse drag jump off-screen. */
    var measuredRaw = ring.getBoundingClientRect();
    var measuredRect = {
      left:measuredRaw.left, top:measuredRaw.top,
      width:measuredRaw.width, height:measuredRaw.height
    };
    var largeRect = focusTargetRect();
    var sourceRect = startExpanded
      ? {left:largeRect.left,top:largeRect.top,width:largeRect.width,height:largeRect.height}
      : measuredRect;
    if (!startExpanded) {
      lastCompactRect = {
        left:sourceRect.left, top:sourceRect.top,
        width:sourceRect.width, height:sourceRect.height,
        viewportWidth:window.innerWidth || document.documentElement.clientWidth || 0
      };
    }
    var cachedCompact = startExpanded && lastCompactRect &&
      Math.abs((lastCompactRect.viewportWidth || 0) - (window.innerWidth || document.documentElement.clientWidth || 0)) < 3
      ? {left:lastCompactRect.left,top:lastCompactRect.top,width:lastCompactRect.width,height:lastCompactRect.height}
      : null;
    var smallRect = startExpanded ? (cachedCompact || measureSmallRing(ring)) : sourceRect;
"""
new = """    /* Only real compact-state geometry is allowed as the collapse target.
       Never re-measure/toggle focus classes while the large timer is active. */
    var measuredRaw = ring.getBoundingClientRect();
    var measuredRect = {
      left:measuredRaw.left, top:measuredRaw.top,
      width:measuredRaw.width, height:measuredRaw.height
    };
    var largeRect = focusTargetRect();
    var sourceRect;
    var smallRect;
    if (startExpanded) {
      smallRect = savedCompactRect();
      if (!smallRect) {
        /* No trustworthy compact anchor: abort instead of animating to garbage. */
        gesture.engaged = false;
        return;
      }
      sourceRect = {left:largeRect.left,top:largeRect.top,width:largeRect.width,height:largeRect.height};
    } else {
      sourceRect = measuredRect;
      smallRect = {left:sourceRect.left,top:sourceRect.top,width:sourceRect.width,height:sourceRect.height};
      rememberCompactRect(ring);
    }
"""
assert old in s, 'reverse geometry block missing'
s = s.replace(old, new, 1)

# Capture compact rect before focus is ever applied. This makes auto-open, swipe-open
# and desktop-open all share the same reliable collapse target.
old = """  function setFocus(visible) {
    var overlay = ensureFocusChrome();
    document.documentElement.classList.toggle('cardio-focus-active',!!visible);
"""
new = """  function setFocus(visible) {
    var overlay = ensureFocusChrome();
    var root = document.documentElement;
    if (visible && !root.classList.contains('cardio-focus-active') && !root.classList.contains('cardio-focus-dragging')) {
      rememberCompactRect(document.getElementById('session-countdown-ring'));
    }
    root.classList.toggle('cardio-focus-active',!!visible);
"""
assert old in s, 'setFocus anchor missing'
s = s.replace(old, new, 1)

# Also capture on pointerdown while actually compact, before any drag state begins.
old = """      gesture = {
        pointerId:event.pointerId,
        ring:ring,
"""
new = """      var startsExpanded = document.documentElement.classList.contains('cardio-focus-active');
      if (!startsExpanded) rememberCompactRect(ring);
      gesture = {
        pointerId:event.pointerId,
        ring:ring,
"""
assert old in s, 'pointerdown gesture anchor missing'
s = s.replace(old, new, 1)
s = s.replace("        startExpanded:document.documentElement.classList.contains('cardio-focus-active'),\n        engaged:false,\n        progress:document.documentElement.classList.contains('cardio-focus-active') ? 1 : 0\n", "        startExpanded:startsExpanded,\n        engaged:false,\n        progress:startsExpanded ? 1 : 0\n", 1)

# Remove the old continuous cache refresh from syncCardio. It could capture a stale
# intermediate rect shortly after transitions and overwrite the correct anchor.
old = """    if (!document.documentElement.classList.contains('cardio-focus-active') &&
        !document.documentElement.classList.contains('cardio-focus-dragging')) {
      var compactRing = document.getElementById('session-countdown-ring');
      if (compactRing) {
        var compactRect = compactRing.getBoundingClientRect();
        if (compactRect.width > 20 && compactRect.height > 20) {
          lastCompactRect = {
            left:compactRect.left, top:compactRect.top,
            width:compactRect.width, height:compactRect.height,
            viewportWidth:window.innerWidth || document.documentElement.clientWidth || 0
          };
        }
      }
    }

"""
assert old in s, 'continuous compact cache block missing'
s = s.replace(old, '', 1)

# Simplify install cleanup: no stale proxy architecture remains.
s = s.replace("    document.documentElement.classList.remove('cardio-focus-source-hidden','cardio-focus-dragging');\n    var staleProxy = document.getElementById('cardio-timer-morph-proxy');\n    if (staleProxy) staleProxy.remove();\n", "    document.documentElement.classList.remove('cardio-focus-dragging');\n", 1)

p.write_text(s,encoding='utf-8')

old_ver = '20260914-timer-focus-final13-reversefix'
new_ver = '20260914-timer-focus-final14-cleananchor'
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

print('removed stale compact measurement/cache paths and installed strict compact anchor')
