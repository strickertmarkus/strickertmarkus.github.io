(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function addStyles() {
    if (document.getElementById('exercise-session-set-cards-v6-style')) return;

    var style = document.createElement('style');
    style.id = 'exercise-session-set-cards-v6-style';
    style.textContent = `
      /* Restore the current-set overview cards in both Träningsläge and Översikt.
         This is presentation only; the existing sessionState/render logic remains authoritative. */
      #session-modal.show #session-stable-details {
        display:grid !important;
        grid-template-columns:repeat(3,minmax(0,1fr)) !important;
        width:100% !important;
        max-width:620px !important;
        margin:8px auto 6px !important;
        gap:10px !important;
        visibility:visible;
      }

      #session-modal.show #session-stable-details > div {
        min-width:0;
        padding:12px 10px 11px;
        border-radius:13px;
        border:1px solid rgba(34,211,238,.24);
        background:rgba(34,211,238,.055);
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.018);
      }

      #session-modal.show.hype-mode:not(.session-overview-mode) #session-stable-details > div {
        border-color:rgba(255,151,69,.40);
        background:rgba(255,122,26,.10);
        box-shadow:inset 0 0 0 1px rgba(255,174,92,.035),0 7px 20px rgba(249,115,22,.045);
      }

      #session-modal.show:not(.hype-mode):not(.session-overview-mode) #session-stable-details > div,
      #session-modal.show.session-overview-mode #session-stable-details > div {
        border-color:rgba(34,211,238,.26);
        background:rgba(34,211,238,.065);
      }

      #session-modal.show #session-stable-details .stable-detail-label {
        font-size:9px !important;
        letter-spacing:.7px !important;
        color:#94A3B8 !important;
      }

      #session-modal.show #session-stable-details .stable-detail-value {
        margin-top:6px !important;
        font-size:clamp(22px,4vw,30px) !important;
        line-height:1 !important;
        color:#67E8F9 !important;
      }

      #session-modal.show.hype-mode:not(.session-overview-mode) #session-stable-details .stable-detail-value {
        color:#FDBA74 !important;
      }

      /* Keep the existing editable logged-set section visible in both views,
         including while the following set is running. Earlier focus CSS hid it. */
      #session-modal.show .session-log-section {
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        width:100% !important;
        margin-top:5px !important;
      }

      #session-modal.show .session-log-section > div:first-child:not(#session-set-log) {
        color:#94A3B8 !important;
      }

      #session-modal.show #session-set-log {
        display:flex !important;
        flex-direction:column !important;
        gap:7px !important;
        margin-top:7px !important;
      }

      #session-modal.show #session-set-log .set-log-item {
        display:grid !important;
        grid-template-columns:minmax(64px,.72fr) repeat(3,minmax(0,1fr)) !important;
        align-items:center !important;
        gap:7px !important;
        margin:0 !important;
        padding:8px !important;
        border:1px solid rgba(34,211,238,.13);
        border-radius:11px;
        background:rgba(10,18,28,.58);
      }

      #session-modal.show.hype-mode:not(.session-overview-mode) #session-set-log .set-log-item {
        border-color:rgba(255,151,69,.17);
        background:rgba(29,13,7,.56);
      }

      #session-modal.show #session-set-log .set-tag {
        font-size:10px !important;
        font-weight:800 !important;
        color:#67E8F9 !important;
        white-space:nowrap;
      }

      #session-modal.show.hype-mode:not(.session-overview-mode) #session-set-log .set-tag {
        color:#FDBA74 !important;
      }

      #session-modal.show #session-set-log input {
        width:100% !important;
        min-width:0 !important;
        height:38px !important;
        padding:7px 8px !important;
        border-radius:9px !important;
        border:1px solid rgba(148,163,184,.18) !important;
        background:#18222e !important;
        color:#F0F6FC !important;
        font:700 12px/1 'Inter',sans-serif !important;
        text-align:center !important;
        outline:none !important;
        box-shadow:none !important;
        -webkit-text-fill-color:#F0F6FC !important;
        opacity:1 !important;
      }

      #session-modal.show #session-set-log input:not([readonly]):focus {
        border-color:rgba(34,211,238,.58) !important;
        box-shadow:0 0 0 2px rgba(34,211,238,.10) !important;
      }

      #session-modal.show.hype-mode:not(.session-overview-mode) #session-set-log input:not([readonly]):focus {
        border-color:rgba(255,151,69,.60) !important;
        box-shadow:0 0 0 2px rgba(249,115,22,.10) !important;
      }

      #session-modal.show #session-set-log input[readonly] {
        color:#94A3B8 !important;
        -webkit-text-fill-color:#94A3B8 !important;
        background:#111a24 !important;
      }

      @media (max-width:600px) {
        #session-modal.show #session-stable-details {
          gap:6px !important;
          margin:6px 0 5px !important;
        }
        #session-modal.show #session-stable-details > div {
          padding:10px 5px 9px !important;
          border-radius:11px !important;
        }
        #session-modal.show #session-stable-details .stable-detail-label {
          font-size:8px !important;
          letter-spacing:.5px !important;
        }
        #session-modal.show #session-stable-details .stable-detail-value {
          font-size:clamp(20px,6.5vw,27px) !important;
        }
        #session-modal.show #session-set-log .set-log-item {
          grid-template-columns:54px repeat(3,minmax(0,1fr)) !important;
          gap:5px !important;
          padding:6px !important;
        }
        #session-modal.show #session-set-log input {
          height:35px !important;
          padding:6px 4px !important;
          font-size:11px !important;
        }
        #session-modal.show #session-set-log .set-tag {
          font-size:9px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    addStyles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once:true });
  } else {
    install();
  }
})();
