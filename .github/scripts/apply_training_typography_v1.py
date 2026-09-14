from pathlib import Path

root = Path('.')
layout = root / 'budget/exercise-hype-timer-layout-v1.js'
s = layout.read_text(encoding='utf-8')

anchor = """      #session-modal.show .session-timers .timer-val {\n        font-variant-numeric:tabular-nums !important;\n        letter-spacing:-.6px !important;\n      }\n\n      #session-cardio-countdown {\n"""
block = """      #session-modal.show .session-timers .timer-val {\n        font-variant-numeric:tabular-nums !important;\n        letter-spacing:-.6px !important;\n      }\n\n      /* Match the typography profile used by the Reactor / Observatory training\n         modes. All pages already load Inter; the visible difference is their\n         lighter weight and tighter spacing hierarchy. Keep geometry untouched. */\n      #session-modal.show,\n      #session-modal.show button,\n      #session-modal.show input,\n      #session-modal.show select,\n      #session-modal.show textarea {\n        font-family:'Inter',sans-serif !important;\n      }\n      #session-modal.show .session-title {\n        font-weight:500 !important;\n        letter-spacing:.4px !important;\n      }\n      #session-modal.show #session-subtitle {\n        font-weight:400 !important;\n      }\n      #session-modal.show .session-timers .timer-lbl {\n        font-weight:500 !important;\n        letter-spacing:1.35px !important;\n      }\n      #session-modal.show .session-timers .timer-val {\n        font-weight:500 !important;\n        letter-spacing:.1px !important;\n      }\n      #session-modal.show #session-set-timer {\n        font-weight:300 !important;\n        letter-spacing:-1.2px !important;\n      }\n      #session-modal.show #session-current-ex {\n        font-weight:500 !important;\n        letter-spacing:-1px !important;\n      }\n      #session-modal.show #session-current-target,\n      #session-modal.show #session-next-ex-inline {\n        font-weight:400 !important;\n      }\n      #session-modal.show .stable-detail-label {\n        font-weight:500 !important;\n        letter-spacing:1.5px !important;\n      }\n      #session-modal.show .stable-detail-value {\n        font-weight:400 !important;\n      }\n      #session-modal.show #session-countdown-value {\n        font-weight:300 !important;\n        letter-spacing:-2px !important;\n      }\n      #session-modal.show .session-cta,\n      #session-modal.show .session-view-toggle,\n      #session-modal.show .session-pretimer-toggle-v2 {\n        font-family:'Inter',sans-serif !important;\n        font-weight:600 !important;\n      }\n\n      #session-cardio-countdown {\n"""
assert anchor in s, 'typography insertion anchor missing'
s = s.replace(anchor, block, 1)
layout.write_text(s, encoding='utf-8')

old = '20260914-timer-focus-final20-polish'
new = '20260914-session-typography-v1'
for rel in ['budget/auth-config.js','budget/auth-gate.js','budget/exercise.html']:
    p = root / rel
    data = p.read_text(encoding='utf-8')
    assert old in data, f'cache anchor missing: {rel}'
    p.write_text(data.replace(old,new), encoding='utf-8')

final = layout.read_text(encoding='utf-8')
assert "#session-modal.show #session-countdown-value" in final
assert "font-weight:300 !important" in final
assert "#session-modal.show #session-current-ex" in final
print('training typography profile applied')
