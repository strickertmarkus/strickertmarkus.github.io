from pathlib import Path

p = Path('budget/exercise-timer-focus.js')
s = p.read_text()

old = '''      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-core {
        inset:var(--cf-core-inset)!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
        font-size:var(--cf-font-size)!important;
        line-height:1!important;
        letter-spacing:var(--cf-letter-spacing)!important;
        transform:translateX(var(--cf-time-x))!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-copy {
        width:var(--cf-copy-width)!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .pf-ecg-v80 {
        width:var(--cf-ecg-width)!important;
        height:var(--cf-ecg-height)!important;
      }
'''
new = '''      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-segments,
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring > .pf-canvas-arc-v130,
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring > .pf-arc-svg-v80 {
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        max-width:none!important;
        max-height:none!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-core {
        inset:var(--cf-core-inset)!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-copy {
        width:var(--cf-copy-width)!important;
        display:grid!important;
        place-content:center!important;
        justify-items:center!important;
        gap:var(--cf-copy-gap)!important;
        min-width:0!important;
        margin:0 auto!important;
        text-align:center!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
        font-size:var(--cf-font-size)!important;
        line-height:1!important;
        letter-spacing:var(--cf-letter-spacing)!important;
        transform:translateX(var(--cf-time-x))!important;
        white-space:nowrap!important;
        width:100%!important;
        min-width:0!important;
        text-align:center!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-label {
        margin:0!important;
        font-size:var(--cf-label-size)!important;
        line-height:1!important;
        letter-spacing:var(--cf-label-letter)!important;
        white-space:nowrap!important;
        width:100%!important;
        text-align:center!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-pause-hint {
        margin:0 auto!important;
        width:var(--cf-hint-width)!important;
        max-width:var(--cf-hint-width)!important;
        min-width:0!important;
        font-size:var(--cf-hint-size)!important;
        line-height:1.05!important;
        letter-spacing:var(--cf-hint-letter)!important;
        white-space:normal!important;
        text-align:center!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .pf-ecg-v80 {
        width:var(--cf-ecg-width)!important;
        height:var(--cf-ecg-height)!important;
        margin-top:0!important;
      }
'''
if old not in s:
    raise SystemExit('drag css block not found')
s = s.replace(old, new, 1)

old = '''      '--cf-core-inset','--cf-font-size','--cf-letter-spacing','--cf-copy-width',
      '--cf-ecg-width','--cf-ecg-height','--cf-time-x','--cf-title-shift'
'''
new = '''      '--cf-core-inset','--cf-font-size','--cf-letter-spacing','--cf-copy-width','--cf-copy-gap',
      '--cf-ecg-width','--cf-ecg-height','--cf-time-x','--cf-title-shift',
      '--cf-label-size','--cf-label-letter','--cf-hint-size','--cf-hint-letter','--cf-hint-width'
'''
if old not in s:
    raise SystemExit('clear drag vars block not found')
s = s.replace(old, new, 1)

old = '''    setDragVar('--cf-copy-width','calc(100% - ' + mix(52,128,progress).toFixed(2) + 'px)');
    setDragVar('--cf-ecg-width',mix(gesture.smallEcgWidth,104,progress).toFixed(2) + 'px');
    setDragVar('--cf-ecg-height',mix(gesture.smallEcgHeight,29,progress).toFixed(2) + 'px');
    setDragVar('--cf-time-x',mix(1,0,progress).toFixed(2) + 'px');
    setDragVar('--cf-title-shift',mix(18,0,progress).toFixed(2) + 'px');
'''
new = '''    setDragVar('--cf-copy-width','calc(100% - ' + mix(52,128,progress).toFixed(2) + 'px)');
    setDragVar('--cf-copy-gap',mix(3,8,progress).toFixed(2) + 'px');
    setDragVar('--cf-ecg-width',mix(gesture.smallEcgWidth,104,progress).toFixed(2) + 'px');
    setDragVar('--cf-ecg-height',mix(gesture.smallEcgHeight,29,progress).toFixed(2) + 'px');
    setDragVar('--cf-time-x',mix(1,0,progress).toFixed(2) + 'px');
    setDragVar('--cf-title-shift',mix(18,0,progress).toFixed(2) + 'px');
    setDragVar('--cf-label-size',mix(8.5,12,progress).toFixed(2) + 'px');
    setDragVar('--cf-label-letter',mix(0.8,1.15,progress).toFixed(2) + 'px');
    setDragVar('--cf-hint-size',mix(6.5,10,progress).toFixed(2) + 'px');
    setDragVar('--cf-hint-letter',mix(0.65,1.0,progress).toFixed(2) + 'px');
    setDragVar('--cf-hint-width',mix(64,126,progress).toFixed(2) + 'px');
'''
if old not in s:
    raise SystemExit('drag variable interpolation block not found')
s = s.replace(old, new, 1)

old = '''      if (targetExpanded) {
        collapsedCardioToken = '';
        setFocus(true);
      } else {
        if (lastCardioToken) collapsedCardioToken = lastCardioToken;
        setFocus(false);
      }
      gesture = null;
'''
new = '''      if (targetExpanded) {
        collapsedCardioToken = '';
        setFocus(true);
      } else {
        if (lastCardioToken) collapsedCardioToken = lastCardioToken;
        setFocus(false);
      }
      try { window.dispatchEvent(new Event('resize')); } catch (_) {}
      gesture = null;
'''
if old not in s:
    raise SystemExit('finish drag block not found')
s = s.replace(old, new, 1)
p.write_text(s)

old_version = '20260914-timer-focus-final6-drag'
new_version = '20260914-timer-focus-final7-dragfix'
for name in [
    'budget/exercise.html',
    'budget/auth-config.js',
    'budget/auth-gate.js',
    'budget/exercise-pulse-flow-canvas-glow-v131.js'
]:
    path = Path(name)
    text = path.read_text()
    if old_version in text:
        path.write_text(text.replace(old_version, new_version))
