from pathlib import Path

ROOT = Path('.')
p = ROOT / 'budget/exercise-timer-focus.js'
s = p.read_text(encoding='utf-8')

# 1) During interactive drag, let the progress-driven overlay own the background
# and content opacity even when cardio-focus-active is still set on reverse drags.
anchor = """      html.cardio-focus-dragging #cardio-focus {\n        display:block!important;\n      }\n      html.cardio-focus-dragging .cardio-focus-title,\n      html.cardio-focus-dragging .cardio-focus-close {\n        opacity:var(--cf-drag-chrome,0)!important;\n      }\n"""
addition = anchor + """      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) {\n        background:transparent!important;\n      }\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-top,\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-grid > .session-card:not(.session-main),\n      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-main > *:not(#session-cardio-countdown) {\n        opacity:var(--cf-drag-content,1)!important;\n        pointer-events:none!important;\n      }\n"""
assert anchor in s, 'drag overlay anchor missing'
s = s.replace(anchor, addition, 1)

# 2) Drive content fade too.
old = """    var bgProgress = smoothstep(progress);\n    var chromeProgress = smoothstep(clamp01((progress - 0.72) / 0.28));\n    document.documentElement.style.setProperty('--cf-drag-bg',bgProgress.toFixed(4));\n    document.documentElement.style.setProperty('--cf-drag-chrome',chromeProgress.toFixed(4));\n"""
new = """    var bgProgress = smoothstep(progress);\n    var chromeProgress = smoothstep(clamp01((progress - 0.72) / 0.28));\n    var contentProgress = 1 - smoothstep(clamp01(progress / 0.72));\n    document.documentElement.style.setProperty('--cf-drag-bg',bgProgress.toFixed(4));\n    document.documentElement.style.setProperty('--cf-drag-chrome',chromeProgress.toFixed(4));\n    document.documentElement.style.setProperty('--cf-drag-content',contentProgress.toFixed(4));\n"""
assert old in s, 'drag vars anchor missing'
s = s.replace(old, new, 1)

# 3) Reverse drag: do not trust Safari getBoundingClientRect() from the settled
# transformed focus state. Use the same deterministic geometry as the focus CSS.
old = """    /* Capture the visible source before measuring the opposite state. */\n    var sourceRectRaw = ring.getBoundingClientRect();\n    var sourceRect = {\n      left:sourceRectRaw.left, top:sourceRectRaw.top,\n      width:sourceRectRaw.width, height:sourceRectRaw.height\n    };\n    if (!startExpanded) {\n      lastCompactRect = {\n        left:sourceRect.left, top:sourceRect.top,\n        width:sourceRect.width, height:sourceRect.height,\n        viewportWidth:window.innerWidth || document.documentElement.clientWidth || 0\n      };\n    }\n    var cachedCompact = startExpanded && lastCompactRect &&\n      Math.abs((lastCompactRect.viewportWidth || 0) - (window.innerWidth || document.documentElement.clientWidth || 0)) < 3\n      ? {left:lastCompactRect.left,top:lastCompactRect.top,width:lastCompactRect.width,height:lastCompactRect.height}\n      : null;\n    var smallRect = startExpanded ? (cachedCompact || measureSmallRing(ring)) : sourceRect;\n    var largeRect = startExpanded ? sourceRect : focusTargetRect();\n"""
new = """    /* The collapsed source is measured live. The expanded source is deterministic:\n       Safari can report a transient rect for the fixed + translated large timer\n       during pointer capture, which previously made reverse drag jump off-screen. */\n    var measuredRaw = ring.getBoundingClientRect();\n    var measuredRect = {\n      left:measuredRaw.left, top:measuredRaw.top,\n      width:measuredRaw.width, height:measuredRaw.height\n    };\n    var largeRect = focusTargetRect();\n    var sourceRect = startExpanded\n      ? {left:largeRect.left,top:largeRect.top,width:largeRect.width,height:largeRect.height}\n      : measuredRect;\n    if (!startExpanded) {\n      lastCompactRect = {\n        left:sourceRect.left, top:sourceRect.top,\n        width:sourceRect.width, height:sourceRect.height,\n        viewportWidth:window.innerWidth || document.documentElement.clientWidth || 0\n      };\n    }\n    var cachedCompact = startExpanded && lastCompactRect &&\n      Math.abs((lastCompactRect.viewportWidth || 0) - (window.innerWidth || document.documentElement.clientWidth || 0)) < 3\n      ? {left:lastCompactRect.left,top:lastCompactRect.top,width:lastCompactRect.width,height:lastCompactRect.height}\n      : null;\n    var smallRect = startExpanded ? (cachedCompact || measureSmallRing(ring)) : sourceRect;\n"""
assert old in s, 'reverse geometry anchor missing'
s = s.replace(old, new, 1)

# 4) Clear all interactive vars.
old = """    document.documentElement.style.removeProperty('--cf-drag-bg');\n    document.documentElement.style.removeProperty('--cf-drag-chrome');\n    setFocus(!!targetExpanded);\n"""
new = """    document.documentElement.style.removeProperty('--cf-drag-bg');\n    document.documentElement.style.removeProperty('--cf-drag-chrome');\n    document.documentElement.style.removeProperty('--cf-drag-content');\n    setFocus(!!targetExpanded);\n"""
assert old in s, 'cleanup vars anchor missing'
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')

old_ver = '20260914-timer-focus-final12-bidirectional'
new_ver = '20260914-timer-focus-final13-reversefix'
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

print('patched reverse timer drag geometry + progressive focus backdrop')
