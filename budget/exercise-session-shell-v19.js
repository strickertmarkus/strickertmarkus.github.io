(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (window.__exerciseSessionShellV19Installed) return;
  window.__exerciseSessionShellV19Installed = true;

  function addStyles() {
    if (document.getElementById('exercise-session-shell-v19-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-session-shell-v19-style';
    style.textContent = `
      /* Clean full-screen session shell. This module is presentation-only:
         it no longer gates, skips or mutates the five-second pre-timer. */
      html:has(#session-modal.show),
      html:has(#session-modal.show) body {
        overflow:hidden !important;
        overscroll-behavior:none !important;
      }

      #session-modal.show {
        position:fixed !important;
        inset:0 !important;
        width:100vw !important;
        height:100dvh !important;
        min-height:100svh !important;
        padding:0 !important;
        align-items:stretch !important;
        justify-content:stretch !important;
        overflow:hidden !important;
        background:rgba(8,12,20,.98) !important;
      }
      #session-modal.show .session-shell {
        width:100% !important;
        max-width:none !important;
        height:100dvh !important;
        min-height:100svh !important;
        display:flex !important;
        flex-direction:column !important;
        overflow:hidden !important;
        isolation:isolate !important;
      }
      #session-modal.show .session-top {
        flex:0 0 auto !important;
        min-width:0 !important;
        position:relative !important;
        z-index:20 !important;
      }
      #session-modal.show .session-top > div:first-child {
        min-width:0 !important;
        flex:1 1 auto !important;
      }
      #session-modal.show .session-grid {
        flex:1 1 auto !important;
        min-height:0 !important;
        height:auto !important;
        max-height:none !important;
        overflow-x:hidden !important;
        overflow-y:auto !important;
        overscroll-behavior:contain !important;
        -webkit-overflow-scrolling:touch;
        scrollbar-gutter:stable;
        position:relative !important;
        z-index:5 !important;
      }
      #session-modal.show .session-grid > .session-card,
      #session-modal.show .session-main {
        min-width:0 !important;
        max-height:none !important;
        position:relative !important;
      }

      #session-modal.show #session-controls {
        position:relative !important;
        z-index:80 !important;
        pointer-events:auto !important;
        isolation:isolate !important;
      }
      #session-modal.show #session-controls .session-cta {
        position:relative !important;
        z-index:81 !important;
        pointer-events:auto !important;
        touch-action:manipulation;
      }

      /* Pre-timer visibility is controlled by its own .show class only.
         The old v19 html gate was the reason direct-rest starts could count
         five seconds invisibly. */
      #session-pre-timer {
        display:none !important;
        visibility:hidden !important;
        opacity:0 !important;
        pointer-events:none !important;
      }
      #session-pre-timer.show {
        display:grid !important;
        visibility:visible !important;
        opacity:1 !important;
        pointer-events:auto !important;
      }

      /* The legacy timer still updates --pre-progress every 50 ms for its
         internal clock. The visible ring deliberately ignores that stepped
         value and uses the requestAnimationFrame-driven variable below. */
      #session-pre-timer-ring {
        background:conic-gradient(#FB923C var(--pre-smooth-progress,0deg),rgba(251,146,60,.13) 0deg) !important;
        will-change:background;
        contain:paint;
      }
      #session-pre-timer-ring::after {
        transform:rotate(var(--pre-smooth-progress,0deg)) translateY(-81px) !important;
        will-change:transform;
        -webkit-backface-visibility:hidden;
        backface-visibility:hidden;
      }

      #session-between-overlay-v2:not(.show) {
        display:none !important;
        visibility:hidden !important;
        pointer-events:none !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) .session-shell::before,
      #session-modal.persistent-hype:not(.session-overview-mode) .session-shell::after {
        pointer-events:none !important;
        z-index:0 !important;
        will-change:transform,opacity;
        -webkit-backface-visibility:hidden;
        backface-visibility:hidden;
      }
      #session-modal.show .session-shell > * {
        position:relative;
        z-index:1;
      }

      @media (min-width:601px) {
        #session-modal.show .session-grid,
        #session-modal.show.persistent-hype .session-grid,
        #session-modal.show.session-overview-mode .session-grid {
          display:flex !important;
          flex-direction:column !important;
          align-items:stretch !important;
          gap:12px !important;
          padding:12px !important;
          grid-template-columns:none !important;
        }
        #session-modal.show .session-grid > .session-card,
        #session-modal.show.persistent-hype .session-grid > .session-card,
        #session-modal.show.session-overview-mode .session-grid > .session-card {
          display:block !important;
          width:100% !important;
          max-width:none !important;
          flex:0 0 auto !important;
          margin:0 !important;
          order:initial !important;
          grid-column:auto !important;
          overflow:visible !important;
        }
        #session-modal.show .session-main,
        #session-modal.show.persistent-hype:not(.session-overview-mode) .session-main,
        #session-modal.show.session-overview-mode .session-main {
          width:100% !important;
          height:auto !important;
          min-height:0 !important;
          max-height:none !important;
          overflow:visible !important;
        }
        #session-modal.show .session-main { order:1 !important; }
        #session-modal.show.persistent-hype:not(.session-overview-mode) .session-grid > .session-card:nth-child(2),
        #session-modal.show.session-overview-mode .session-grid > .session-card:nth-child(2) {
          display:block !important;
          width:100% !important;
          margin:0 !important;
          order:2 !important;
          grid-column:auto !important;
        }
        #session-modal.show .session-timers {
          grid-template-columns:repeat(2,minmax(0,1fr)) !important;
        }
        #session-modal.show #session-stable-details {
          width:min(720px,100%) !important;
          max-width:720px !important;
          margin-left:auto !important;
          margin-right:auto !important;
        }
        #session-modal.show .hype-workout-progress {
          width:min(920px,100%) !important;
          max-width:920px !important;
        }
        #session-modal.show #session-controls:not(.decision-row) .session-cta.primary {
          width:100% !important;
          min-height:62px !important;
        }
      }

      @media (max-width:600px) {
        #session-modal.show .session-grid {
          min-height:0 !important;
          overflow-y:auto !important;
          overflow-x:hidden !important;
        }
        #session-modal.show .session-top {
          padding-top:max(10px,env(safe-area-inset-top)) !important;
        }
        #session-modal.show #session-set-log input,
        #session-modal.show input,
        #session-modal.show select,
        #session-modal.show textarea {
          font-size:16px !important;
        }
        #session-pre-timer-ring::after {
          transform:rotate(var(--pre-smooth-progress,0deg)) translateY(-74px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  var smoothFrame = 0;
  var smoothStartedAt = 0;
  var smoothObserved = false;

  function timerVisible() {
    var pre = document.getElementById('session-pre-timer');
    return !!(pre && pre.classList.contains('show'));
  }

  function paintSmoothProgress(now) {
    if (!timerVisible()) {
      smoothFrame = 0;
      smoothStartedAt = 0;
      return;
    }
    if (!smoothStartedAt) smoothStartedAt = now;
    var elapsed = Math.max(0,Math.min(5000,now - smoothStartedAt));
    var degrees = (elapsed / 5000) * 360;
    var ring = document.getElementById('session-pre-timer-ring');
    if (ring) ring.style.setProperty('--pre-smooth-progress',degrees.toFixed(3) + 'deg');
    if (elapsed < 5000 && timerVisible()) smoothFrame = requestAnimationFrame(paintSmoothProgress);
    else smoothFrame = 0;
  }

  function startSmoothProgress() {
    if (!timerVisible()) return;
    if (smoothFrame) cancelAnimationFrame(smoothFrame);
    smoothStartedAt = performance.now();
    var ring = document.getElementById('session-pre-timer-ring');
    if (ring) ring.style.setProperty('--pre-smooth-progress','0deg');
    smoothFrame = requestAnimationFrame(paintSmoothProgress);
  }

  function stopSmoothProgress() {
    if (smoothFrame) cancelAnimationFrame(smoothFrame);
    smoothFrame = 0;
    smoothStartedAt = 0;
  }

  function observePretimer() {
    var pre = document.getElementById('session-pre-timer');
    if (!pre) return false;
    if (pre.dataset.smoothPretimerV23 === 'true') return true;
    pre.dataset.smoothPretimerV23 = 'true';
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName !== 'class') continue;
        if (timerVisible()) startSmoothProgress();
        else stopSmoothProgress();
        break;
      }
    });
    observer.observe(pre,{attributes:true,attributeFilter:['class']});
    if (timerVisible()) startSmoothProgress();
    smoothObserved = true;
    return true;
  }

  function install() {
    addStyles();

    /* Clear classes belonging to the retired pre-timer gate. */
    document.documentElement.classList.remove('exercise-pretimer-active-v19','exercise-session-open-v19');
    if (document.body) document.body.classList.remove('exercise-session-open-v19');

    if (!observePretimer()) {
      var attempts = 0;
      var retry = setInterval(function () {
        attempts += 1;
        if (observePretimer() || attempts >= 80) clearInterval(retry);
      },50);
    }

    window.__exerciseSessionShellV19 = {
      sync:function () {
        if (!smoothObserved) observePretimer();
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();