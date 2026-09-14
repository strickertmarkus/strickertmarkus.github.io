from pathlib import Path

root = Path('.')
layout = root / 'budget/exercise-hype-timer-layout-v1.js'
auth_gate = root / 'budget/auth-gate.js'
auth_config = root / 'budget/auth-config.js'
exercise = root / 'budget/exercise.html'

# Remove the earlier partial typography block. There should be one authority only.
s = layout.read_text(encoding='utf-8')
start_marker = "      /* Match the typography profile used by the Reactor / Observatory training\n"
end_marker = "      #session-cardio-countdown {\n"
start = s.find(start_marker)
end = s.find(end_marker, start if start >= 0 else 0)
assert start >= 0, 'old partial typography block start missing'
assert end > start, 'old partial typography block end missing'
s = s[:start] + s[end:]
layout.write_text(s, encoding='utf-8')

# Load the consolidated typography authority last, after all Pulse presentation layers.
g = auth_gate.read_text(encoding='utf-8')
old_tail = "      ['exercise-pulse-flow-v58.js', 'data-exercise-pulse-flow-v58'],\n      ['exercise-pulse-flow-motion-v67.js', 'data-exercise-pulse-flow-motion-v67']\n"
new_tail = "      ['exercise-pulse-flow-v58.js', 'data-exercise-pulse-flow-v58'],\n      ['exercise-pulse-flow-motion-v67.js', 'data-exercise-pulse-flow-motion-v67'],\n      ['exercise-session-typography.js', 'data-exercise-session-typography']\n"
assert old_tail in g, 'exercise bundle tail anchor missing'
g = g.replace(old_tail, new_tail, 1)
auth_gate.write_text(g, encoding='utf-8')

old_ver = '20260914-session-typography-v1'
new_ver = '20260914-session-typography-v2-all'
for path in (auth_gate, auth_config, exercise):
    data = path.read_text(encoding='utf-8')
    assert old_ver in data, f'cache version missing in {path}'
    path.write_text(data.replace(old_ver, new_ver), encoding='utf-8')

# Sanity checks.
assert start_marker not in layout.read_text(encoding='utf-8')
g = auth_gate.read_text(encoding='utf-8')
assert "['exercise-session-typography.js', 'data-exercise-session-typography']" in g
assert g.index("exercise-session-typography.js") > g.index("exercise-pulse-flow-motion-v67.js")
print('training typography v2 patch applied')
