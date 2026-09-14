from pathlib import Path

ROOT = Path('.')
focus = ROOT / 'budget/exercise-timer-focus.js'
s = focus.read_text(encoding='utf-8')

old_css = """      /* Optical centering of the compact numeric value only; ring geometry is untouched. */
      html:not(.cardio-focus-active):not(.cardio-focus-dragging) body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
        transform:translateX(1px)!important;
      }
"""
new_css = old_css + """
      /* Compact optical alignment. Keep the numeric value untouched; the ECG artwork
         is visually right-heavy, while the two captions only need a 1px nudge. */
      html:not(.cardio-focus-active):not(.cardio-focus-dragging) body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .pf-ecg-v80 {
        transform:translateX(-7px)!important;
      }
      html:not(.cardio-focus-active):not(.cardio-focus-dragging) body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .session-countdown-label,
      html:not(.cardio-focus-active):not(.cardio-focus-dragging) body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-pause-hint {
        transform:translateX(-1px)!important;
      }
"""
assert old_css in s, 'compact optical centering anchor missing'
s = s.replace(old_css, new_css, 1)

anchor = """  function frame(now) {
    if (!lastFrameAt || now - lastFrameAt >= 80) {
"""
insert = """  function installImmediateFocusSync() {
    if (!window.MutationObserver || !document.body) {
      syncCardio(Date.now());
      return;
    }
    var observer = new MutationObserver(function (mutations) {
      var relevant = false;
      for (var i = 0; i < mutations.length; i++) {
        var target = mutations[i] && mutations[i].target;
        if (target && (target.id === 'session-modal' || target.id === 'session-pre-timer')) {
          relevant = true;
          break;
        }
      }
      if (relevant) syncCardio(Date.now());
    });
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
    /* Do not wait for the 80 ms maintenance loop on initial/returning cardio state. */
    syncCardio(Date.now());
  }

""" + anchor
assert anchor in s, 'frame anchor missing'
s = s.replace(anchor, insert, 1)

old_install = """    installAudioUnlock();
    installTimerGestures();
    requestAnimationFrame(frame);
"""
new_install = """    installAudioUnlock();
    installTimerGestures();
    installImmediateFocusSync();
    requestAnimationFrame(frame);
"""
assert old_install in s, 'install anchor missing'
s = s.replace(old_install, new_install, 1)

focus.write_text(s, encoding='utf-8')

old_ver = '20260914-timer-focus-final19-touchowner'
new_ver = '20260914-timer-focus-final20-polish'
for rel in ['budget/exercise.html','budget/auth-config.js','budget/auth-gate.js']:
    p = ROOT / rel
    data = p.read_text(encoding='utf-8')
    assert old_ver in data, f'cache version missing in {rel}'
    p.write_text(data.replace(old_ver,new_ver), encoding='utf-8')

final = focus.read_text(encoding='utf-8')
assert 'translateX(-7px)' in final
assert 'installImmediateFocusSync' in final
assert "target.id === 'session-modal'" in final
assert "target.id === 'session-pre-timer'" in final
assert "document.addEventListener('touchstart'" in final
assert "document.addEventListener('touchmove'" in final
print('timer polish applied')
