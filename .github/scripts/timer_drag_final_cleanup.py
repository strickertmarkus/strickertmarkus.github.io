from pathlib import Path

ROOT = Path('.')
timer_path = ROOT / 'budget/exercise-timer-focus.js'
text = timer_path.read_text(encoding='utf-8')

old_css = '''      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown.show {
        visibility:hidden!important;
        pointer-events:none!important;
      }
'''
new_css = '''      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown.show,
      html.cardio-focus-source-hidden body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown.show {
        visibility:hidden!important;
        opacity:0!important;
        pointer-events:none!important;
      }
'''
assert old_css in text, 'source-hide CSS anchor missing'
text = text.replace(old_css, new_css, 1)

anchor = '''      #cardio-timer-morph-proxy #session-countdown-ring .cardio-desktop-toggle {
        display:none!important;
      }
'''
addition = anchor + '''      html.cardio-focus-dragging #cardio-timer-morph-proxy,
      html.cardio-focus-dragging #cardio-timer-morph-proxy * {
        transition:none!important;
      }
      /* Canvas glow is screen-coordinate based. During a compositor transform it can
         redraw against the old geometry and appear as a second arc. Keep the SVG as
         the single drag renderer; native Canvas glow resumes immediately at rest. */
      html.cardio-focus-dragging #cardio-timer-morph-proxy .pf-canvas-glow-v130 {
        display:none!important;
        opacity:0!important;
      }
      html.cardio-focus-dragging #cardio-timer-morph-proxy .pf-arc-progress-v80 {
        filter:drop-shadow(0 0 2.5px rgba(var(--pf-rgb),.88)) drop-shadow(0 0 8px rgba(var(--pf-rgb),.42))!important;
        -webkit-filter:drop-shadow(0 0 2.5px rgba(var(--pf-rgb),.88)) drop-shadow(0 0 8px rgba(var(--pf-rgb),.42))!important;
      }
      html.cardio-focus-dragging #cardio-timer-morph-proxy .pf-ecg-v80 svg {
        filter:drop-shadow(0 0 2px rgba(var(--pf-rgb),.62))!important;
        -webkit-filter:drop-shadow(0 0 2px rgba(var(--pf-rgb),.62))!important;
      }
      html.cardio-focus-dragging #cardio-timer-morph-proxy #session-countdown-ring .session-countdown-copy,
      html.cardio-focus-dragging #cardio-timer-morph-proxy #session-countdown-ring .session-countdown-core,
      html.cardio-focus-dragging #cardio-timer-morph-proxy #session-countdown-ring .pf-ecg-v80,
      html.cardio-focus-dragging #cardio-timer-morph-proxy #session-countdown-value,
      html.cardio-focus-dragging #cardio-timer-morph-proxy .session-countdown-label,
      html.cardio-focus-dragging #cardio-timer-morph-proxy #session-countdown-pause-hint {
        transform:none!important;
      }
'''
assert anchor in text, 'proxy CSS anchor missing'
text = text.replace(anchor, addition, 1)

anchor_fn = '''  function mountMorphRing(ring) {
'''
helper = '''  function syncProxyThemeFromRing(ring) {
    var proxy = ensureMorphProxy();
    if (!proxy || !ring) return;
    var cs = null;
    try { cs = getComputedStyle(ring); } catch (_) {}
    ['--pf','--pf-soft','--pf-rgb'].forEach(function (name) {
      var value = cs ? String(cs.getPropertyValue(name) || '').trim() : '';
      if (value) proxy.style.setProperty(name,value);
    });
    /* Timed cardio is always the red Pulse Flow family. These fallbacks stop
       detached proxy inheritance from drifting to strength/rest colours. */
    if (!proxy.style.getPropertyValue('--pf')) proxy.style.setProperty('--pf','#EF4444');
    if (!proxy.style.getPropertyValue('--pf-soft')) proxy.style.setProperty('--pf-soft','#FCA5A5');
    if (!proxy.style.getPropertyValue('--pf-rgb')) proxy.style.setProperty('--pf-rgb','239,68,68');
  }

'''+anchor_fn
assert anchor_fn in text, 'mountMorphRing anchor missing'
text = text.replace(anchor_fn, helper, 1)

old_timing = '''    var background = smoothstep(clamp01((progress - 0.04) / 0.82));
    var contentFade = smoothstep(clamp01(progress / 0.70));
    var chrome = smoothstep(clamp01((progress - 0.78) / 0.22));
'''
new_timing = '''    var background = smoothstep(clamp01((progress - 0.06) / 0.78));
    var contentFade = smoothstep(clamp01(progress / 0.58));
    var chrome = smoothstep(clamp01((progress - 0.88) / 0.12));
'''
assert old_timing in text, 'drag timing anchor missing'
text = text.replace(old_timing, new_timing, 1)

old_begin = '''    var overlay = ensureFocusChrome();
    if (overlay) overlay.classList.add('show');

    if (!mountMorphRing(ring)) {
'''
new_begin = '''    var overlay = ensureFocusChrome();
    if (overlay) overlay.classList.add('show');

    syncProxyThemeFromRing(ring);
    if (!mountMorphRing(ring)) {
'''
assert old_begin in text, 'begin drag anchor missing'
text = text.replace(old_begin, new_begin, 1)

old_mount_done = '''      gesture.engaged = false;
      return;
    }
    applyDragProgress(gesture.progress);
'''
new_mount_done = '''      gesture.engaged = false;
      return;
    }
    root.classList.add('cardio-focus-source-hidden');
    applyDragProgress(gesture.progress);
'''
assert old_mount_done in text, 'post-mount anchor missing'
text = text.replace(old_mount_done, new_mount_done, 1)

old_finish = '''      restoreMorphRing();
      document.documentElement.classList.remove('cardio-focus-dragging');
      clearDragVars();
'''
new_finish = '''      restoreMorphRing();
      document.documentElement.classList.remove('cardio-focus-source-hidden');
      document.documentElement.classList.remove('cardio-focus-dragging');
      clearDragVars();
'''
assert old_finish in text, 'finish drag anchor missing'
text = text.replace(old_finish, new_finish, 1)

# Ensure a failed mount never leaves the source-hidden class behind.
old_fail = '''      root.classList.remove('cardio-focus-dragging');
      if (startExpanded) root.classList.add('cardio-focus-active');
'''
new_fail = '''      root.classList.remove('cardio-focus-source-hidden');
      root.classList.remove('cardio-focus-dragging');
      if (startExpanded) root.classList.add('cardio-focus-active');
'''
assert old_fail in text, 'failed mount cleanup anchor missing'
text = text.replace(old_fail, new_fail, 1)

timer_path.write_text(text, encoding='utf-8')

old_ver = '20260914-timer-focus-final9-proxy'
new_ver = '20260914-timer-focus-final10-cleanmorph'
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

print('patched final clean timer morph')
