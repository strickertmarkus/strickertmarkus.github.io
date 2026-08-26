(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function addStyles() {
    if (document.getElementById('exercise-mobile-repaint-fix-style')) return;

    var style = document.createElement('style');
    style.id = 'exercise-mobile-repaint-fix-style';
    style.textContent = `
      @media (max-width: 600px) {
        /* Safari/iOS: keep the tunnel pseudo-elements composited at all times.
           Destroying them with content:none can invalidate/repaint the session
           children one frame later when a set ends. */
        #session-modal.persistent-hype:not(.session-overview-mode) .session-shell {
          position: relative !important;
          overflow: hidden !important;
        }

        #session-modal.persistent-hype:not(.session-overview-mode) .session-shell::before,
        #session-modal.persistent-hype:not(.session-overview-mode) .session-shell::after {
          content: '' !important;
          position: absolute !important;
          inset: -40% !important;
          pointer-events: none !important;
          z-index: 0 !important;
          background:
            repeating-conic-gradient(
              from 0deg at 50% 52%,
              transparent 0deg 7deg,
              rgba(251,146,60,.18) 7.15deg 7.55deg,
              transparent 7.7deg 14deg
            ) !important;
          -webkit-mask-image: radial-gradient(circle at 50% 52%, transparent 0 17%, rgba(0,0,0,.2) 23%, #000 38%, rgba(0,0,0,.9) 58%, transparent 78%) !important;
          mask-image: radial-gradient(circle at 50% 52%, transparent 0 17%, rgba(0,0,0,.2) 23%, #000 38%, rgba(0,0,0,.9) 58%, transparent 78%) !important;
          transform-origin: 50% 52% !important;
          will-change: transform, opacity;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }

        /* Between sets: keep the layer alive, but invisible and paused. */
        #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-shell::before,
        #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-shell::after {
          opacity: 0 !important;
          animation: hypeTunnelRush 1.35s linear infinite !important;
          animation-play-state: paused !important;
        }
        #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-shell::after {
          animation-duration: 2.1s !important;
          animation-delay: -.8s !important;
        }

        /* Active set: same existing layers become visible and resume. */
        #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell::before {
          opacity: .17 !important;
          animation: hypeTunnelRush 1.35s linear infinite !important;
          animation-play-state: running !important;
        }
        #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell::after {
          opacity: .10 !important;
          animation: hypeTunnelRush 2.1s linear infinite !important;
          animation-delay: -.8s !important;
          animation-play-state: running !important;
          filter: blur(.4px);
        }

        #session-modal.persistent-hype:not(.session-overview-mode) .session-shell > * {
          position: relative;
          z-index: 1;
        }

        /* Keep the detail row on its own stable compositing layer so it is not
           repainted when the speed-line opacity changes. */
        #session-stable-details {
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          will-change: transform;
          opacity: 1 !important;
          transition: none !important;
        }
        #session-stable-details,
        #session-stable-details * {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addStyles, { once: true });
  } else {
    addStyles();
  }
})();
