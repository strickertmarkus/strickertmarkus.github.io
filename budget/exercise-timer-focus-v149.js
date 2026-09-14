(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseTimerFocusV149Installed) return;
  window.__exerciseTimerFocusV149Installed = true;

  var promoted = false;
  var placeholder = null;
  var ring = null;
  var overlay = null;
  var slot = null;
  var originalParent = null;
  var originalNext = null;
  var originalInlineTransform = '';
  var originalInlineTransformOrigin = '';
  var originalInlineZIndex = '';
  var bypassClose = false;
  var closing = false;
  var observer = null;
  var lastVisible = false;

  function addStyle() {
    if (document.getElementById('exercise-timer-focus-v149-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-timer-focus-v149-style';
    style.textContent = `
      /* v149: focus mode does not redraw the timer. It promotes the exact live
         compact Pulse Flow timer and scales that complete rendered surface. */
      #cardio-focus-v145.cardio-focus-live-v149 .cardio-focus-ring-v145 {
        display:none !important;
      }
      #cardio-focus-v145.cardio-focus-live-v149 .cardio-focus-shell-v145 {
        width:min(560px,100%) !important;
      }
      #cardio-focus-v145.cardio-focus-live-v149 .cardio-focus-live-slot-v149 {
        position:relative !important;
        width:min(340px,84vw) !important;
        height:min(340px,84vw) !important;
        margin:20px auto 8px !important;
        display:grid !important;
        place-items:center !important;
        overflow:visible !important;
        isolation:isolate !important;
      }
      #cardio-focus-v145.cardio-focus-live-v149 .cardio-focus-live-slot-v149 > #session-countdown-ring {
        margin:0 !important;
        flex:none !important;
        transform-origin:50% 50% !important;
        will-change:transform !important;
        z-index:3 !important;
        overflow:visible !important;
      }
      #cardio-focus-v145.cardio-focus-live-v149 .cardio-focus-live-slot-v149 > #session-countdown-ring .cardio-focus-expand-v145 {
        display:none !important;
      }
      #cardio-focus-v145.cardio-focus-live-v149 .cardio-focus-live-slot-v149 > #session-countdown-ring #cardio-inline-plus-v145 {
        transform:none !important;
      }
      .cardio-focus-live-placeholder-v149 {
        visibility:hidden !important;
        pointer-events:none !important;
        flex:none !important;
      }
      @media(max-width:600px) {
        #cardio-focus-v145.cardio-focus-live-v149 .cardio-focus-live-slot-v149 {
          width:min(326px,82vw) !important;
          height:min(326px,82vw) !important;
          margin-top:18px !important;
        }
      }
      @media(max-width:360px) {
        #cardio-focus-v145.cardio-focus-live-v149 .cardio-focus-live-slot-v149 {
          width:min(292px,80vw) !important;
          height:min(292px,80vw) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function reducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (_) { return false; }
  }

  function ensureStructure() {
    overlay = document.getElementById('cardio-focus-v145');
    var modal = document.getElementById('session-modal');
    if (!overlay || !modal) return false;

    /* Keep the live timer under #session-modal so every existing Pulse Flow
       selector, CSS variable and animation continues to apply unchanged. */
    if (overlay.parentNode !== modal) {
      try { modal.appendChild(overlay); } catch (_) {}
    }
    overlay.classList.add('cardio-focus-live-v149');

    if (!slot || !slot.isConnected) {
      slot = overlay.querySelector('.cardio-focus-live-slot-v149');
      if (!slot) {
        slot = document.createElement('div');
        slot.className = 'cardio-focus-live-slot-v149';
        slot.setAttribute('aria-hidden','false');
        var customRing = overlay.querySelector('.cardio-focus-ring-v145');
        var shell = overlay.querySelector('.cardio-focus-shell-v145');
        if (customRing && customRing.parentNode) customRing.parentNode.insertBefore(slot,customRing);
        else if (shell) shell.appendChild(slot);
      }
    }
    return true;
  }

  function targetScale(baseRect) {
    if (!slot || !baseRect || !baseRect.width) return 1;
    var slotRect = slot.getBoundingClientRect();
    var target = Math.max(1,Math.min(slotRect.width,slotRect.height));
    return Math.max(1,target / baseRect.width);
  }

  function rememberOrigin(node,rect) {
    originalParent = node.parentNode;
    originalNext = node.nextSibling;
    originalInlineTransform = node.style.transform || '';
    originalInlineTransformOrigin = node.style.transformOrigin || '';
    originalInlineZIndex = node.style.zIndex || '';

    placeholder = document.createElement('div');
    placeholder.className = 'cardio-focus-live-placeholder-v149';
    placeholder.style.width = rect.width + 'px';
    placeholder.style.height = rect.height + 'px';
    placeholder.style.flexBasis = rect.width + 'px';
    placeholder.style.minWidth = rect.width + 'px';
    placeholder.style.minHeight = rect.height + 'px';
    originalParent.insertBefore(placeholder,node);
  }

  function promote() {
    if (promoted || closing || !ensureStructure()) return;
    var node = document.getElementById('session-countdown-ring');
    if (!node || node.parentNode === slot) {
      promoted = !!node;
      ring = node;
      return;
    }

    var source = node.getBoundingClientRect();
    if (!source.width || !source.height) return;
    ring = node;
    rememberOrigin(node,source);
    slot.appendChild(node);

    /* Measure the exact compact timer at its native size, then scale the whole
       rendered object uniformly. This is intentionally not a restyle. */
    node.style.transform = 'none';
    node.style.transformOrigin = '50% 50%';
    node.style.zIndex = '3';
    var base = node.getBoundingClientRect();
    var scale = targetScale(base);
    var slotRect = slot.getBoundingClientRect();
    var targetCx = slotRect.left + slotRect.width / 2;
    var targetCy = slotRect.top + slotRect.height / 2;
    var baseCx = base.left + base.width / 2;
    var baseCy = base.top + base.height / 2;
    var dx = source.left + source.width / 2 - baseCx;
    var dy = source.top + source.height / 2 - baseCy;

    node.style.transform = 'scale(' + scale + ')';
    promoted = true;

    if (!reducedMotion() && typeof node.animate === 'function') {
      try {
        var anim = node.animate([
          {transform:'translate(' + dx + 'px,' + dy + 'px) scale(1)',opacity:.72},
          {transform:'translate(0px,0px) scale(' + scale + ')',opacity:1}
        ],{
          duration:520,
          easing:'cubic-bezier(.16,1,.3,1)',
          fill:'none'
        });
        anim.addEventListener('finish',function () {
          node.style.transform = 'scale(' + scale + ')';
        },{once:true});
      } catch (_) {}
    }
  }

  function originTargetRect() {
    if (placeholder && placeholder.isConnected) {
      var r = placeholder.getBoundingClientRect();
      if (r.width && r.height) return r;
    }
    return null;
  }

  function restoreNow() {
    if (!ring) return;
    try {
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.replaceChild(ring,placeholder);
      } else if (originalParent) {
        if (originalNext && originalNext.parentNode === originalParent) originalParent.insertBefore(ring,originalNext);
        else originalParent.appendChild(ring);
      }
    } catch (_) {}
    ring.style.transform = originalInlineTransform;
    ring.style.transformOrigin = originalInlineTransformOrigin;
    ring.style.zIndex = originalInlineZIndex;
    placeholder = null;
    ring = null;
    originalParent = null;
    originalNext = null;
    promoted = false;
    closing = false;
  }

  function restoreAnimated(done) {
    if (!promoted || !ring) {
      restoreNow();
      if (done) done();
      return;
    }
    closing = true;
    var node = ring;
    var current = node.getBoundingClientRect();
    var target = originTargetRect();
    if (!target || reducedMotion() || typeof node.animate !== 'function') {
      restoreNow();
      if (done) done();
      return;
    }

    var inlineTransform = node.style.transform || '';
    var match = inlineTransform.match(/scale\(([^)]+)\)/);
    var scale = match ? Math.max(1,Number(match[1]) || 1) : Math.max(1,current.width / Math.max(1,target.width));
    var dx = target.left + target.width/2 - (current.left + current.width/2);
    var dy = target.top + target.height/2 - (current.top + current.height/2);

    try {
      var anim = node.animate([
        {transform:'translate(0px,0px) scale(' + scale + ')',opacity:1},
        {transform:'translate(' + dx + 'px,' + dy + 'px) scale(1)',opacity:.72}
      ],{
        duration:390,
        easing:'cubic-bezier(.16,1,.3,1)',
        fill:'forwards'
      });
      anim.addEventListener('finish',function () {
        try { anim.cancel(); } catch (_) {}
        restoreNow();
        if (done) done();
      },{once:true});
    } catch (_) {
      restoreNow();
      if (done) done();
    }
  }

  function isVisible() {
    return !!(overlay && overlay.classList.contains('show'));
  }

  function sync() {
    if (!ensureStructure()) return;
    var visible = isVisible();
    if (visible && !promoted && !closing) {
      requestAnimationFrame(function () { requestAnimationFrame(promote); });
    } else if (!visible && promoted && !closing) {
      /* Covers overview/pre-timer/session-end hides that do not use the close button. */
      restoreNow();
    }
    lastVisible = visible;
  }

  function installObserver() {
    if (!overlay) return;
    if (observer) observer.disconnect();
    observer = new MutationObserver(sync);
    observer.observe(overlay,{attributes:true,attributeFilter:['class']});
  }

  function interceptClose(event) {
    if (bypassClose || !promoted || closing) return;
    var button = event.target && event.target.closest ? event.target.closest('#cardio-focus-v145 .cardio-focus-close-v145') : null;
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    restoreAnimated(function () {
      bypassClose = true;
      try { button.click(); }
      finally { bypassClose = false; }
    });
  }

  function install() {
    addStyle();
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      if (ensureStructure()) {
        installObserver();
        sync();
        clearInterval(timer);
      } else if (attempts > 80) {
        clearInterval(timer);
      }
    },75);
    ensureStructure();
    if (overlay) {
      installObserver();
      sync();
    }
    document.addEventListener('click',interceptClose,true);
    window.addEventListener('resize',function () {
      if (!promoted || !ring || !slot) return;
      ring.style.transform = 'none';
      var base = ring.getBoundingClientRect();
      ring.style.transform = 'scale(' + targetScale(base) + ')';
    },{passive:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
