from pathlib import Path
import re

ROOT = Path('.')
focus_path = ROOT / 'budget' / 'exercise-timer-focus.js'
text = focus_path.read_text(encoding='utf-8')

old_vars = """  var suppressTimerClickUntil = 0;\n  var dragAnimationFrame = 0;\n  var beeped = Object.create(null);"""
new_vars = """  var suppressTimerClickUntil = 0;\n  var dragAnimationFrame = 0;\n  var morphProxy = null;\n  var morphMarker = null;\n  var morphHome = null;\n  var beeped = Object.create(null);"""
if old_vars not in text:
    raise SystemExit('timer variable anchor not found')
text = text.replace(old_vars, new_vars, 1)

css_start = "      /* Mobile drag preview: compositor-only whole-ring morph."
css_end = "      /* Optical centering of the compact numeric value only; ring geometry is untouched. */"
start = text.find(css_start)
end = text.find(css_end, start)
if start < 0 or end < 0:
    raise SystemExit('drag CSS block anchors not found')

new_css = r'''      /* Mobile drag preview: move the one real live timer into a fixed proxy.
         Source and destination never render simultaneously, so there is no ghost ring,
         duplicate copy or competing Canvas/SVG geometry in intermediate states. */
      html.cardio-focus-dragging {
        --cf-progress:0;
        --cf-bg-progress:0;
        --cf-chrome-progress:0;
        --cf-content-opacity:1;
      }
      html.cardio-focus-dragging #cardio-focus {
        display:block!important;
        opacity:1!important;
      }
      html.cardio-focus-dragging .cardio-focus-title,
      html.cardio-focus-dragging .cardio-focus-close {
        opacity:var(--cf-chrome-progress)!important;
      }
      html.cardio-focus-dragging .cardio-focus-title {
        transform:translateX(-50%) translateY(var(--cf-title-shift,14px))!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) {
        z-index:2147483500!important;
        pointer-events:none!important;
        isolation:isolate!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode)::after {
        content:''!important;
        display:block!important;
        position:fixed!important;
        inset:0!important;
        z-index:2147483501!important;
        pointer-events:none!important;
        opacity:var(--cf-bg-progress)!important;
        background:
          radial-gradient(circle at 50% 45%,rgba(239,68,68,.20),transparent 35%),
          radial-gradient(circle at 50% 112%,rgba(127,29,29,.17),transparent 43%),
          linear-gradient(180deg,#16090C 0%,#10070A 48%,#09070A 100%)!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-top,
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-grid > .session-card:not(.session-main),
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) .session-main > * {
        opacity:var(--cf-content-opacity)!important;
        pointer-events:none!important;
      }
      html.cardio-focus-dragging body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-cardio-countdown.show {
        visibility:hidden!important;
        pointer-events:none!important;
      }

      #cardio-timer-morph-proxy {
        display:none;
        position:fixed;
        left:0;
        top:0;
        width:var(--cf-base-size,1px);
        height:var(--cf-base-size,1px);
        z-index:2147483590;
        pointer-events:none;
        overflow:visible;
        transform-origin:0 0;
        --pf:#EF4444;
        --pf-soft:#FCA5A5;
        --pf-rgb:239,68,68;
      }
      html.cardio-focus-dragging #cardio-timer-morph-proxy {
        display:block!important;
        transform:translate3d(var(--cf-left,0px),var(--cf-top,0px),0) scale(var(--cf-scale,1));
        will-change:transform;
        backface-visibility:hidden;
        -webkit-backface-visibility:hidden;
      }
      #cardio-timer-morph-proxy #session-countdown-ring {
        display:grid!important;
        position:absolute!important;
        inset:0!important;
        left:0!important;
        top:0!important;
        right:auto!important;
        bottom:auto!important;
        width:100%!important;
        height:100%!important;
        min-width:0!important;
        min-height:0!important;
        flex:none!important;
        flex-basis:auto!important;
        aspect-ratio:1!important;
        margin:0!important;
        transform:none!important;
        transform-origin:50% 50%!important;
        opacity:1!important;
        visibility:visible!important;
        overflow:visible!important;
        pointer-events:none!important;
        will-change:auto!important;
      }
      #cardio-timer-morph-proxy #session-countdown-ring .cardio-desktop-toggle {
        display:none!important;
      }

'''
text = text[:start] + new_css + text[end:]

func_start = text.find('  function clearDragVars() {')
func_end = text.find('  function setFocus(visible) {', func_start)
if func_start < 0 or func_end < 0:
    raise SystemExit('drag function block anchors not found')

new_funcs = r'''  function clearDragVars() {
    [
      '--cf-progress','--cf-bg-progress','--cf-chrome-progress','--cf-content-opacity',
      '--cf-base-size','--cf-left','--cf-top','--cf-scale','--cf-title-shift'
    ].forEach(function (name) { document.documentElement.style.removeProperty(name); });
  }

  function smoothstep(value) {
    value = clamp01(value);
    return value * value * (3 - 2 * value);
  }

  function ensureMorphProxy() {
    var proxy = document.getElementById('cardio-timer-morph-proxy');
    if (!proxy) {
      proxy = document.createElement('div');
      proxy.id = 'cardio-timer-morph-proxy';
      proxy.setAttribute('aria-hidden','true');
      document.body.appendChild(proxy);
    }
    morphProxy = proxy;
    return proxy;
  }

  function mountMorphRing(ring) {
    if (!ring || !ring.parentNode) return false;
    var proxy = ensureMorphProxy();
    if (morphMarker && morphMarker.parentNode) morphMarker.remove();
    morphHome = ring.parentNode;
    morphMarker = document.createComment('cardio-timer-morph-home');
    morphHome.insertBefore(morphMarker,ring);
    proxy.appendChild(ring);
    return true;
  }

  function restoreMorphRing() {
    var ring = document.getElementById('session-countdown-ring');
    if (ring) {
      if (morphMarker && morphMarker.parentNode) {
        morphMarker.parentNode.insertBefore(ring,morphMarker);
      } else {
        var fallback = morphHome && morphHome.isConnected ? morphHome : document.getElementById('session-cardio-countdown');
        if (fallback) fallback.appendChild(ring);
      }
    }
    if (morphMarker && morphMarker.parentNode) morphMarker.remove();
    morphMarker = null;
    morphHome = null;
    if (morphProxy) morphProxy.removeAttribute('style');
  }

  function applyDragProgress(progress) {
    if (!gesture || !gesture.engaged) return;
    progress = clamp01(progress);
    gesture.progress = progress;

    var small = gesture.smallRect;
    var large = gesture.largeRect;
    var ratio = Math.max(1,large.width / Math.max(1,small.width));
    var scale = mix(1,ratio,progress);
    var left = mix(small.left,large.left,progress);
    var top = mix(small.top,large.top,progress);

    /* Background can begin early, but pass content is fully gone before the
       focus title appears. That prevents the duplicate Hopp-rep/title state
       visible in the previous intermediate frames. */
    var background = smoothstep(clamp01((progress - 0.04) / 0.82));
    var contentFade = smoothstep(clamp01(progress / 0.70));
    var chrome = smoothstep(clamp01((progress - 0.78) / 0.22));

    setDragVar('--cf-progress',String(progress));
    setDragVar('--cf-bg-progress',background.toFixed(4));
    setDragVar('--cf-chrome-progress',chrome.toFixed(4));
    setDragVar('--cf-content-opacity',(1 - contentFade).toFixed(4));
    setDragVar('--cf-base-size',small.width.toFixed(2) + 'px');
    setDragVar('--cf-left',left.toFixed(2) + 'px');
    setDragVar('--cf-top',top.toFixed(2) + 'px');
    setDragVar('--cf-scale',scale.toFixed(5));
    setDragVar('--cf-title-shift',mix(14,0,chrome).toFixed(2) + 'px');
  }

  function beginInteractiveDrag(ring,startExpanded) {
    if (!gesture || gesture.engaged) return;
    var smallRect = measureSmallRing(ring);
    var largeRect = focusTargetRect();

    gesture.engaged = true;
    gesture.startExpanded = !!startExpanded;
    gesture.smallRect = smallRect;
    gesture.largeRect = largeRect;
    gesture.progress = startExpanded ? 1 : 0;
    gesture.startedAt = performance.now();

    var root = document.documentElement;
    root.classList.add('cardio-focus-dragging');
    root.classList.remove('cardio-focus-active');
    var overlay = ensureFocusChrome();
    if (overlay) overlay.classList.add('show');

    if (!mountMorphRing(ring)) {
      root.classList.remove('cardio-focus-dragging');
      if (startExpanded) root.classList.add('cardio-focus-active');
      gesture.engaged = false;
      return;
    }
    applyDragProgress(gesture.progress);
  }

  function finishInteractiveDrag(targetExpanded) {
    if (!gesture || !gesture.engaged) return;
    if (dragAnimationFrame) cancelAnimationFrame(dragAnimationFrame);
    var from = gesture.progress;
    var to = targetExpanded ? 1 : 0;
    var distance = Math.abs(to - from);
    var duration = Math.max(120,Math.min(230,115 + distance * 145));
    var started = performance.now();

    function step(now) {
      if (!gesture || !gesture.engaged) return;
      var t = Math.min(1,(now - started) / duration);
      var eased = 1 - Math.pow(1 - t,4);
      applyDragProgress(from + (to - from) * eased);
      if (t < 1) {
        dragAnimationFrame = requestAnimationFrame(step);
        return;
      }

      dragAnimationFrame = 0;
      if (targetExpanded) collapsedCardioToken = '';
      else if (lastCardioToken) collapsedCardioToken = lastCardioToken;

      /* Restore the one real timer before swapping CSS end states. All of this
         happens synchronously in one frame, so source/proxy/target never overlap. */
      restoreMorphRing();
      document.documentElement.classList.remove('cardio-focus-dragging');
      clearDragVars();
      setFocus(targetExpanded);
      gesture = null;

      requestAnimationFrame(function () {
        try { window.dispatchEvent(new Event('resize')); } catch (_) {}
      });
    }
    dragAnimationFrame = requestAnimationFrame(step);
  }

'''
text = text[:func_start] + new_funcs + text[func_end:]

focus_path.write_text(text, encoding='utf-8')

old_version = '20260914-timer-focus-final8-compositor'
new_version = '20260914-timer-focus-final9-proxy'
for rel in [
    'budget/exercise.html',
    'budget/auth-config.js',
    'budget/auth-gate.js',
    'budget/exercise-pulse-flow-canvas-glow-v131.js',
]:
    path = ROOT / rel
    data = path.read_text(encoding='utf-8')
    if old_version not in data:
        raise SystemExit(f'cache version anchor missing in {rel}')
    path.write_text(data.replace(old_version,new_version),encoding='utf-8')

print('Patched one-live-timer proxy morph and bumped cache to final9-proxy')
