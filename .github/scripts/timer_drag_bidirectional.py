from pathlib import Path

ROOT = Path('.')
p = ROOT / 'budget/exercise-timer-focus.js'
s = p.read_text(encoding='utf-8')

# Remember the real compact target so reverse drags do not depend on re-measuring
# while focus CSS is active.
old = "  var dragAnimationFrame = 0;\n  var beeped = Object.create(null);\n"
new = "  var dragAnimationFrame = 0;\n  var lastCompactRect = null;\n  var beeped = Object.create(null);\n"
assert old in s, 'state anchor missing'
s = s.replace(old,new,1)

# Add drag backdrop/chrome rules AFTER the active-focus rules so they win during
# an interactive reverse drag as well as during expansion.
anchor = '''      @media(max-height:700px) {
        .cardio-focus-title { top:calc(58dvh - min(150px,40vw) - 82px); }
        html.cardio-focus-active body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring { top:58dvh!important; }
      }
'''
addition = anchor + '''
      /* Interactive backdrop follows the same 0..1 progress as the ring. This
         rule intentionally comes after the settled focus rules so it also owns
         ::after while dragging from the expanded state back down. */
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode)::after {
        content:''!important;
        display:block!important;
        position:fixed!important;
        inset:0!important;
        z-index:2147483580!important;
        pointer-events:none!important;
        opacity:var(--cf-drag-bg,0)!important;
        background:
          radial-gradient(circle at 50% 45%,rgba(239,68,68,.20),transparent 35%),
          radial-gradient(circle at 50% 112%,rgba(127,29,29,.17),transparent 43%),
          linear-gradient(180deg,#16090C 0%,#10070A 48%,#09070A 100%)!important;
      }
      html.cardio-focus-dragging #cardio-focus {
        display:block!important;
      }
      html.cardio-focus-dragging .cardio-focus-title,
      html.cardio-focus-dragging .cardio-focus-close {
        opacity:var(--cf-drag-chrome,0)!important;
      }
'''
assert anchor in s, 'css end anchor missing'
s = s.replace(anchor,addition,1)

# Drive the backdrop from drag progress together with the ring.
old = '''    var scale = targetSize / Math.max(1,source.width);

    gesture.ring.style.setProperty(
'''
new = '''    var scale = targetSize / Math.max(1,source.width);
    var bgProgress = smoothstep(progress);
    var chromeProgress = smoothstep(clamp01((progress - 0.72) / 0.28));
    document.documentElement.style.setProperty('--cf-drag-bg',bgProgress.toFixed(4));
    document.documentElement.style.setProperty('--cf-drag-chrome',chromeProgress.toFixed(4));

    gesture.ring.style.setProperty(
'''
assert old in s, 'progress anchor missing'
s = s.replace(old,new,1)

# Use a compact rect captured from the real collapsed state for the reverse path.
old = '''    var smallRect = startExpanded ? measureSmallRing(ring) : sourceRect;
    var largeRect = startExpanded ? sourceRect : focusTargetRect();

    gesture.engaged = true;
'''
new = '''    if (!startExpanded) {
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
    var largeRect = startExpanded ? sourceRect : focusTargetRect();

    gesture.engaged = true;
'''
assert old in s, 'compact rect anchor missing'
s = s.replace(old,new,1)

# Ensure focus chrome exists during both directions, but its opacity is driven by progress.
old = '''    document.documentElement.classList.add('cardio-focus-dragging');
    applyDragBase(ring,sourceRect);
'''
new = '''    document.documentElement.classList.add('cardio-focus-dragging');
    var dragOverlay = ensureFocusChrome();
    if (dragOverlay) dragOverlay.classList.add('show');
    applyDragBase(ring,sourceRect);
'''
assert old in s, 'begin drag anchor missing'
s = s.replace(old,new,1)

# Clear interactive CSS variables at the end before applying the settled state.
old = '''    document.documentElement.classList.remove('cardio-focus-dragging');
    setFocus(!!targetExpanded);
'''
new = '''    document.documentElement.classList.remove('cardio-focus-dragging');
    document.documentElement.style.removeProperty('--cf-drag-bg');
    document.documentElement.style.removeProperty('--cf-drag-chrome');
    setFocus(!!targetExpanded);
'''
assert old in s, 'cleanup anchor missing'
s = s.replace(old,new,1)

# Keep the cached collapsed geometry fresh whenever the real compact timer is visible.
old = '''    if (desktopToggle) { desktopToggle.hidden = false; ensureDesktopToggle(); }

    var token = cardioToken(state,exercise);
'''
new = '''    if (desktopToggle) { desktopToggle.hidden = false; ensureDesktopToggle(); }

    if (!document.documentElement.classList.contains('cardio-focus-active') &&
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

    var token = cardioToken(state,exercise);
'''
assert old in s, 'sync compact anchor missing'
s = s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

old_ver = '20260914-timer-focus-final11-inplace'
new_ver = '20260914-timer-focus-final12-bidirectional'
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

print('patched bidirectional timer drag and progressive backdrop')
