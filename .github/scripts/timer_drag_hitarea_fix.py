from pathlib import Path

ROOT = Path('.')
p = ROOT / 'budget/exercise-timer-focus.js'
s = p.read_text(encoding='utf-8')

old = """      @media (hover:none),(pointer:coarse) {\n        #session-countdown-ring {touch-action:none;}\n        .cardio-desktop-toggle {display:none!important;}\n      }\n"""
new = """      @media (hover:none),(pointer:coarse) {\n        #session-cardio-countdown.show,\n        #session-cardio-countdown.show #session-countdown-ring,\n        #session-cardio-countdown.show #session-countdown-ring * {\n          touch-action:none!important;\n          -webkit-user-select:none!important;\n          user-select:none!important;\n        }\n        #session-countdown-ring > .pf-canvas-arc-v130,\n        #session-countdown-ring > .pf-arc-svg-v80 {\n          pointer-events:none!important;\n        }\n        .cardio-desktop-toggle {display:none!important;}\n      }\n"""
assert old in s, 'mobile touch-action block missing'
s = s.replace(old,new,1)

anchor = """  function clamp01(value) {\n    return Math.max(0,Math.min(1,Number(value) || 0));\n  }\n\n"""
insert = """  function clamp01(value) {\n    return Math.max(0,Math.min(1,Number(value) || 0));\n  }\n\n  function pointInsideRect(x,y,rect,pad) {\n    if (!rect) return false;\n    pad = Number(pad) || 0;\n    return x >= rect.left - pad && x <= rect.left + rect.width + pad &&\n           y >= rect.top - pad && y <= rect.top + rect.height + pad;\n  }\n\n  function resolveGestureRing(event) {\n    var direct = event.target && event.target.closest ? event.target.closest('#session-countdown-ring') : null;\n    if (direct) return direct;\n\n    var ring = document.getElementById('session-countdown-ring');\n    if (!ring) return null;\n    var x = Number(event.clientX), y = Number(event.clientY);\n    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;\n\n    var liveRect = null;\n    try { liveRect = ring.getBoundingClientRect(); } catch (_) {}\n    if (pointInsideRect(x,y,liveRect,18)) return ring;\n\n    if (!document.documentElement.classList.contains('cardio-focus-active')) {\n      var compact = savedCompactRect();\n      if (pointInsideRect(x,y,compact,24)) return ring;\n    }\n\n    var host = document.getElementById('session-cardio-countdown');\n    if (host && event.target && host.contains(event.target)) return ring;\n    return null;\n  }\n\n"""
assert anchor in s, 'clamp anchor missing'
s = s.replace(anchor,insert,1)

old = """      var ring = event.target && event.target.closest ? event.target.closest('#session-countdown-ring') : null;\n      if (!ring || (event.target && event.target.closest && event.target.closest('.cardio-desktop-toggle'))) return;\n"""
new = """      var ring = resolveGestureRing(event);\n      if (!ring || (event.target && event.target.closest && event.target.closest('.cardio-desktop-toggle'))) return;\n"""
assert old in s, 'pointerdown ring lookup missing'
s = s.replace(old,new,1)

anchor = """    document.addEventListener('pointermove',function (event) {\n      if (!gesture || gesture.finishing || event.pointerId !== gesture.pointerId) return;\n"""
insert = """    document.addEventListener('touchmove',function (event) {\n      if (!gesture || gesture.finishing) return;\n      if (event.cancelable) event.preventDefault();\n    },{capture:true,passive:false});\n\n    document.addEventListener('pointermove',function (event) {\n      if (!gesture || gesture.finishing || event.pointerId !== gesture.pointerId) return;\n"""
assert anchor in s, 'pointermove anchor missing'
s = s.replace(anchor,insert,1)

p.write_text(s,encoding='utf-8')

old_ver = '20260914-timer-focus-final17-rearm'
new_ver = '20260914-timer-focus-final18-hitarea'
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

print('timer hit-area fix applied')
