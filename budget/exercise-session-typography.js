(function () {
  'use strict';

  if (!(window.__exerciseSharedSessionHost || /\/exercise\.html$/i.test(window.location.pathname))) return;
  if (window.__exerciseSessionTypographyInstalled) return;
  window.__exerciseSessionTypographyInstalled = true;

  function installStyle() {
    var old = document.getElementById('exercise-session-typography-style');
    if (old) old.remove();

    var style = document.createElement('style');
    style.id = 'exercise-session-typography-style';
    style.textContent = `
      /* Final typography authority for the regular training session.
         Reactor / Observatory already use Inter; the visual identity comes from
         the lighter 300/400/500 hierarchy rather than the legacy 800/850/880 weights. */
      html body #session-modal#session-modal#session-modal.show,
      html body #session-modal#session-modal#session-modal.show *,
      html body #session-pre-timer#session-pre-timer,
      html body #session-pre-timer#session-pre-timer *,
      html body #session-between-overlay-v2#session-between-overlay-v2,
      html body #session-between-overlay-v2#session-between-overlay-v2 *,
      html body #cardio-focus#cardio-focus,
      html body #cardio-focus#cardio-focus * {
        font-family:'Inter',sans-serif !important;
      }

      html body #session-modal#session-modal#session-modal.show *,
      html body #session-pre-timer#session-pre-timer *,
      html body #session-between-overlay-v2#session-between-overlay-v2 *,
      html body #cardio-focus#cardio-focus * {
        font-weight:400 !important;
      }

      /* Primary titles / exercise names. */
      html body #session-modal#session-modal#session-modal.show .session-title,
      html body #session-modal#session-modal#session-modal.show #session-current-ex,
      html body #session-modal#session-modal#session-modal.show [class*='title'],
      html body #session-modal#session-modal#session-modal.show [class*='heading'],
      html body #session-between-overlay-v2#session-between-overlay-v2 .bs-heading,
      html body #cardio-focus#cardio-focus .cardio-focus-name,
      html body #cardio-focus#cardio-focus .cardio-focus-kicker {
        font-weight:500 !important;
      }
      html body #session-modal#session-modal#session-modal.show #session-current-ex {
        letter-spacing:-1px !important;
      }
      html body #session-modal#session-modal#session-modal.show .session-title {
        letter-spacing:.4px !important;
      }

      /* Small labels, status text and table headings. */
      html body #session-modal#session-modal#session-modal.show .timer-lbl,
      html body #session-modal#session-modal#session-modal.show .stable-detail-label,
      html body #session-modal#session-modal#session-modal.show .session-countdown-label,
      html body #session-modal#session-modal#session-modal.show .pulse-flow-status-v58,
      html body #session-modal#session-modal#session-modal.show [class*='label'],
      html body #session-modal#session-modal#session-modal.show [class*='caption'],
      html body #session-modal#session-modal#session-modal.show [class*='kicker'],
      html body #session-modal#session-modal#session-modal.show th,
      html body #session-pre-timer#session-pre-timer [class*='label'],
      html body #session-between-overlay-v2#session-between-overlay-v2 .bs-label {
        font-weight:500 !important;
      }

      /* Buttons and actions keep a little more emphasis, but no legacy extra-bold. */
      html body #session-modal#session-modal#session-modal.show button,
      html body #session-modal#session-modal#session-modal.show button *,
      html body #session-modal#session-modal#session-modal.show .session-cta,
      html body #session-modal#session-modal#session-modal.show .session-cta *,
      html body #session-modal#session-modal#session-modal.show .session-view-toggle,
      html body #session-modal#session-modal#session-modal.show .session-pretimer-toggle-v2,
      html body #session-between-overlay-v2#session-between-overlay-v2 [role='button'],
      html body #cardio-focus#cardio-focus button,
      html body #cardio-focus#cardio-focus button * {
        font-weight:600 !important;
      }

      /* Timers: match the thin Pulse / Observatory readout. */
      html body #session-modal#session-modal#session-modal.show #session-set-timer,
      html body #session-modal#session-modal#session-modal.show #session-countdown-value,
      html body #session-pre-timer#session-pre-timer #session-pre-timer-value,
      html body #session-between-overlay-v2#session-between-overlay-v2 #bs-overlay-value {
        font-weight:300 !important;
        letter-spacing:-1.6px !important;
        font-variant-numeric:tabular-nums !important;
      }
      html body #session-modal#session-modal#session-modal.show #session-countdown-value {
        letter-spacing:-2px !important;
      }
      html body #session-modal#session-modal#session-modal.show .session-timers .timer-val:not(#session-set-timer) {
        font-weight:500 !important;
        letter-spacing:.1px !important;
      }

      /* Compact cardio timer optical centering. The settled small ring is visually
         left-weighted by its arc endpoint, so keep the ring geometry untouched and
         nudge only the time/ECG artwork. Focus and interactive drag remain unchanged. */
      html:not(.cardio-focus-active):not(.cardio-focus-dragging) body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-value {
        transform:translateX(-3px) !important;
      }
      html:not(.cardio-focus-active):not(.cardio-focus-dragging) body #session-modal.pulse-flow-v58.show.cardio-countdown-active:not(.session-overview-mode) #session-countdown-ring .pf-ecg-v80 {
        transform:translateX(-10px) !important;
      }

      /* Secondary copy and metrics. */
      html body #session-modal#session-modal#session-modal.show #session-subtitle,
      html body #session-modal#session-modal#session-modal.show #session-current-target,
      html body #session-modal#session-modal#session-modal.show #session-next-ex-inline,
      html body #session-modal#session-modal#session-modal.show .stable-detail-value,
      html body #session-modal#session-modal#session-modal.show td,
      html body #session-modal#session-modal#session-modal.show input,
      html body #session-modal#session-modal#session-modal.show select,
      html body #session-modal#session-modal#session-modal.show textarea,
      html body #session-between-overlay-v2#session-between-overlay-v2 .bs-skip,
      html body #cardio-focus#cardio-focus .cardio-focus-copy {
        font-weight:400 !important;
      }

      /* Bold/strong tags inside session UI should follow the restrained Pulse hierarchy. */
      html body #session-modal#session-modal#session-modal.show strong,
      html body #session-modal#session-modal#session-modal.show b,
      html body #session-pre-timer#session-pre-timer strong,
      html body #session-between-overlay-v2#session-between-overlay-v2 strong,
      html body #cardio-focus#cardio-focus strong {
        font-weight:500 !important;
      }
    `;
    document.head.appendChild(style);

    /* Some legacy session layers still inject style tags after DOM ready. Keep this
       authority last in the cascade while those layers settle, then disconnect. */
    if (window.MutationObserver && document.head) {
      var moving = false;
      var observer = new MutationObserver(function (mutations) {
        if (moving) return;
        var addedStyle = mutations.some(function (mutation) {
          return Array.prototype.some.call(mutation.addedNodes || [], function (node) {
            return node && node.nodeType === 1 && (node.tagName === 'STYLE' || node.tagName === 'LINK');
          });
        });
        if (!addedStyle || style.parentNode !== document.head || document.head.lastElementChild === style) return;
        moving = true;
        document.head.appendChild(style);
        moving = false;
      });
      observer.observe(document.head,{childList:true});
      setTimeout(function () { observer.disconnect(); },7000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',installStyle,{once:true});
  } else {
    installStyle();
  }
})();
