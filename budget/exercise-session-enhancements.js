(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (window.__exerciseSessionEnhancementsV25Installed) return;
  window.__exerciseSessionEnhancementsV25Installed = true;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    var index = Number(state.exerciseIndex || 0);
    return index >= 0 && index < state.exercises.length ? state.exercises[index] : null;
  }

  function addStyles() {
    if (document.getElementById('exercise-session-enhancements-v25-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-session-enhancements-v25-style';
    style.textContent = `
      /* Presentation only. Runtime-core owns session state. */
      #session-controls:not(.decision-row) .session-cta.primary {
        flex:1 1 100%;
        width:100%;
        min-height:58px;
        padding:15px 22px;
        font-size:16px;
        font-weight:900;
        border-radius:12px;
      }

      /* A visible pre-timer is already the start of the next active set.
         Force the active orange palette in CSS as well as JS so there is no
         intermediate blue frame while other session modules settle. */
      #session-modal.show.persistent-hype:has(#session-pre-timer.show):not(.session-overview-mode) {
        --accent:#FF8A1F !important;
        --accent-dim:rgba(255,122,26,.20) !important;
        --accent-glow:rgba(255,122,26,.48) !important;
        --border-a:rgba(255,151,69,.68) !important;
        background:rgba(28,8,2,.98) !important;
      }
      #session-modal.show.persistent-hype:has(#session-pre-timer.show):not(.session-overview-mode) .session-shell {
        background:radial-gradient(circle at 50% 8%,rgba(255,122,26,.28),transparent 38%),linear-gradient(180deg,#1d0b04 0%,#160804 55%,#0d0908 100%) !important;
      }
      #session-modal.show.persistent-hype:has(#session-pre-timer.show):not(.session-overview-mode) .session-card {
        background:rgba(255,122,26,.10) !important;
        border-color:rgba(255,151,69,.42) !important;
        box-shadow:0 0 38px rgba(249,115,22,.08) !important;
      }
      #session-modal.show.persistent-hype:has(#session-pre-timer.show):not(.session-overview-mode) .timer-box {
        background:rgba(255,122,26,.16) !important;
        border-color:rgba(255,151,69,.58) !important;
      }
      #session-modal.show.persistent-hype:has(#session-pre-timer.show):not(.session-overview-mode) #session-current-ex,
      #session-modal.show.persistent-hype:has(#session-pre-timer.show):not(.session-overview-mode) .timer-val,
      #session-modal.show.persistent-hype:has(#session-pre-timer.show):not(.session-overview-mode) .session-table th {
        color:#FFB36B !important;
      }
      #session-modal.show.persistent-hype:has(#session-pre-timer.show):not(.session-overview-mode) #session-controls .session-cta.primary {
        background:linear-gradient(135deg,#FF9A3D,#F97316) !important;
        color:#1b0902 !important;
        box-shadow:0 10px 30px rgba(249,115,22,.34) !important;
      }

      .session-cardio-countdown {
        display:none;
        align-items:center;
        justify-content:center;
        padding:3px 0 5px;
      }
      .session-cardio-countdown.show { display:flex; }
      .session-countdown-ring {
        width:180px;
        height:180px;
        position:relative;
        display:grid;
        place-items:center;
      }
      .session-countdown-segments {
        position:absolute;
        inset:0;
        border-radius:50%;
      }
      .session-countdown-segment {
        position:absolute;
        left:50%;
        top:50%;
        width:3px;
        height:13px;
        margin-left:-1.5px;
        margin-top:-6.5px;
        border-radius:999px;
        background:rgba(251,146,60,.14);
        transform-origin:1.5px 6.5px;
        transition:background .12s linear,box-shadow .12s linear,opacity .12s linear;
      }
      .session-countdown-segment.active {
        background:#FB923C;
        box-shadow:0 0 7px rgba(251,146,60,.58);
        opacity:1;
      }
      .session-countdown-segment.inactive {
        background:rgba(251,146,60,.11);
        box-shadow:none;
        opacity:.65;
      }
      .session-countdown-core {
        position:absolute;
        inset:24px;
        border-radius:50%;
        background:rgba(21,16,13,.96);
        border:1px solid rgba(251,146,60,.13);
      }
      .session-countdown-copy {
        position:relative;
        z-index:2;
        text-align:center;
      }
      .session-countdown-value {
        color:#FDBA74;
        font-size:38px;
        line-height:1;
        font-weight:900;
        letter-spacing:-1.5px;
        font-variant-numeric:tabular-nums;
      }
      .session-countdown-label {
        margin-top:7px;
        color:#A8A29E;
        font-size:10px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:.9px;
      }

      @media(max-width:600px) {
        #session-controls:not(.decision-row) .session-cta.primary,
        #session-modal.hype-mode #session-controls .session-cta.primary {
          width:100% !important;
          min-height:66px !important;
          padding:16px 14px !important;
          font-size:17px !important;
          border-radius:13px !important;
        }
        .session-countdown-ring {
          width:min(164px,48vw);
          height:min(164px,48vw);
        }
        .session-countdown-segment {
          height:11px;
          margin-top:-5.5px;
          transform-origin:1.5px 5.5px;
        }
        .session-countdown-core { inset:21px; }
        .session-countdown-value { font-size:34px; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureCountdown() {
    var existing = document.getElementById('session-cardio-countdown');
    if (existing) return existing;
    var target = document.getElementById('session-current-target');
    if (!target || !target.parentNode) return null;

    var wrap = document.createElement('div');
    wrap.id = 'session-cardio-countdown';
    wrap.className = 'session-cardio-countdown';

    var segments = '';
    for (var i = 0; i < 60; i++) {
      segments += '<span class="session-countdown-segment active" data-segment="' + i + '" style="transform:rotate(' + (i * 6) + 'deg) translateY(-82px)"></span>';
    }

    wrap.innerHTML =
      '<div class="session-countdown-ring" id="session-countdown-ring">' +
        '<div class="session-countdown-segments" id="session-countdown-segments">' + segments + '</div>' +
        '<div class="session-countdown-core"></div>' +
        '<div class="session-countdown-copy">' +
          '<div class="session-countdown-value" id="session-countdown-value">00:00</div>' +
          '<div class="session-countdown-label">Tid kvar</div>' +
        '</div>' +
      '</div>';
    target.insertAdjacentElement('afterend',wrap);
    return wrap;
  }

  function formatRemaining(seconds) {
    var whole = Math.max(0,Math.ceil(seconds));
    return String(Math.floor(whole / 60)).padStart(2,'0') + ':' + String(whole % 60).padStart(2,'0');
  }

  function updateSegments(remaining,total) {
    var segments = document.querySelectorAll('#session-countdown-segments .session-countdown-segment');
    if (!segments.length) return;
    var activeCount = total > 0 ? Math.ceil((Math.max(0,Math.min(total,remaining)) / total) * 60) : 0;
    activeCount = Math.max(0,Math.min(60,activeCount));
    segments.forEach(function (segment,index) {
      var active = index < activeCount;
      segment.classList.toggle('active',active);
      segment.classList.toggle('inactive',!active);
    });
  }

  function syncCountdown() {
    var wrap = ensureCountdown();
    if (!wrap) return;
    var state = getState();
    var ex = currentExercise(state);
    var running = !!(state && state.setRunning && state.setStartedAt);
    var timed = !!(running && ex && ex.kind === 'cardio' && Number(ex.time) > 0);
    wrap.classList.toggle('show',timed);
    if (!timed) return;

    var total = Number(ex.time) * 60;
    var elapsed = Math.max(0,(Date.now() - state.setStartedAt) / 1000);
    var remaining = Math.max(0,total - elapsed);
    var value = document.getElementById('session-countdown-value');
    if (value) value.textContent = formatRemaining(remaining);
    updateSegments(remaining,total);
  }

  function bindPretimerTheme() {
    var pre = document.getElementById('session-pre-timer');
    if (!pre || pre.dataset.themeLockV25 === 'true') return !!pre;
    pre.dataset.themeLockV25 = 'true';

    function sync() {
      if (!pre.classList.contains('show')) return;
      var modal = document.getElementById('session-modal');
      if (modal && modal.classList.contains('persistent-hype') && !modal.classList.contains('session-overview-mode')) {
        modal.classList.add('hype-mode');
      }
    }

    new MutationObserver(sync).observe(pre,{attributes:true,attributeFilter:['class']});
    sync();
    return true;
  }

  function install() {
    addStyles();
    ensureCountdown();
    syncCountdown();
    bindPretimerTheme();
    setInterval(function () {
      syncCountdown();
      bindPretimerTheme();
    },100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
