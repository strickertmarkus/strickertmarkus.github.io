(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (window.__exerciseSessionShellV19Installed) return;
  window.__exerciseSessionShellV19Installed = true;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    var index = Number(state.exerciseIndex || 0);
    return index >= 0 && index < state.exercises.length ? state.exercises[index] : null;
  }

  function timerEnabled(state) {
    if (!state || !state.date) return true;
    try {
      if (window.__exerciseFlowPolishV2 && typeof window.__exerciseFlowPolishV2.timerEnabledForDate === 'function') {
        return window.__exerciseFlowPolishV2.timerEnabledForDate(state.date) !== false;
      }
    } catch (_) {}
    try {
      if (typeof window.getPlannedSessions === 'function') {
        var planned = window.getPlannedSessions() || {};
        var plan = planned[state.date];
        if (plan && typeof plan.preTimerEnabled === 'boolean') return plan.preTimerEnabled;
      }
    } catch (_) {}
    return true;
  }

  function addStyles() {
    if (document.getElementById('exercise-session-shell-v19-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-session-shell-v19-style';
    style.textContent = `
      html.exercise-session-open-v19,
      html.exercise-session-open-v19 body {
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

      #session-pre-timer,
      #session-pre-timer.show {
        display:none !important;
        visibility:hidden !important;
        opacity:0 !important;
        pointer-events:none !important;
      }
      html.exercise-pretimer-active-v19 #session-pre-timer.show {
        display:grid !important;
        visibility:visible !important;
        opacity:1 !important;
        pointer-events:auto !important;
      }
      #session-between-overlay-v2:not(.show) {
        display:none !important;
        visibility:hidden !important;
        pointer-events:none !important;
      }
      #session-modal:not(.session-v19-cardio-running) #session-cardio-countdown,
      #session-modal:not(.session-v19-cardio-running) #session-cardio-countdown.show {
        display:none !important;
      }
      #session-modal.session-v19-cardio-running #session-cardio-countdown.show {
        display:flex !important;
      }

      #session-modal.persistent-hype:not(.session-overview-mode) .session-shell::before,
      #session-modal.persistent-hype:not(.session-overview-mode) .session-shell::after {
        content:'' !important;
        pointer-events:none !important;
        z-index:0 !important;
        will-change:transform,opacity;
        -webkit-backface-visibility:hidden;
        backface-visibility:hidden;
      }
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-shell::before,
      #session-modal.persistent-hype:not(.hype-mode):not(.session-overview-mode) .session-shell::after {
        opacity:0 !important;
        animation-play-state:paused !important;
      }
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell::before,
      #session-modal.persistent-hype.hype-mode:not(.session-overview-mode) .session-shell::after {
        animation-play-state:running !important;
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
      }
    `;
    document.head.appendChild(style);
  }

  function syncState() {
    var modal = document.getElementById('session-modal');
    var state = getState();
    var open = !!(modal && modal.classList.contains('show') && state);
    document.documentElement.classList.toggle('exercise-session-open-v19', open);
    if (document.body) document.body.classList.toggle('exercise-session-open-v19', open);
    if (!modal) return;

    var exercise = currentExercise(state);
    var running = !!(state && state.setRunning);
    var cardioRunning = !!(running && exercise && exercise.kind === 'cardio' && Number(exercise.time) > 0 && state.setStartedAt);
    modal.classList.toggle('session-v19-set-running', running);
    modal.classList.toggle('session-v19-cardio-running', cardioRunning);
    modal.classList.toggle('session-v19-between-sets', !!(state && !running));

    if (!state || running) document.documentElement.classList.remove('exercise-pretimer-active-v19');

    if (!cardioRunning) {
      var countdown = document.getElementById('session-cardio-countdown');
      if (countdown) countdown.classList.remove('show');
    }

    if (!document.documentElement.classList.contains('exercise-pretimer-active-v19')) {
      var pre = document.getElementById('session-pre-timer');
      if (pre) pre.classList.remove('show');
    }
  }

  function installFinalRenderHook() {
    var attempts = 0;
    function bind() {
      attempts += 1;
      if (typeof window.renderSessionMode !== 'function') {
        if (attempts < 80) setTimeout(bind,50);
        return;
      }
      if (window.renderSessionMode.__sessionShellV19Wrapped) {
        syncState();
        return;
      }
      var previous = window.renderSessionMode;
      var wrapped = function () {
        syncState();
        var result = previous.apply(this,arguments);
        syncState();
        return result;
      };
      wrapped.__sessionShellV19Wrapped = true;
      window.renderSessionMode = wrapped;
      syncState();
    }
    bind();
  }

  function installPretimerActionHooks() {
    var attempts = 0;
    function bind() {
      attempts += 1;
      if (typeof window.startCurrentSet !== 'function' || typeof window.startNextSet !== 'function') {
        if (attempts < 80) setTimeout(bind,50);
        return;
      }
      if (window.__exercisePretimerGateV19Installed) return;
      window.__exercisePretimerGateV19Installed = true;

      function finishHiddenPretimerNow() {
        var pre = document.getElementById('session-pre-timer');
        if (!pre || !pre.classList.contains('show')) return false;
        try { pre.click(); return true; }
        catch (_) { return false; }
      }

      var previousStart = window.startCurrentSet;
      window.startCurrentSet = function () {
        var state = getState();
        var enabled = timerEnabled(state);
        document.documentElement.classList.toggle('exercise-pretimer-active-v19',enabled);
        var result = previousStart.apply(this,arguments);
        if (!enabled) {
          finishHiddenPretimerNow();
          document.documentElement.classList.remove('exercise-pretimer-active-v19');
        }
        syncState();
        return result;
      };

      var previousNext = window.startNextSet;
      window.startNextSet = function () {
        document.documentElement.classList.remove('exercise-pretimer-active-v19');
        var result = previousNext.apply(this,arguments);
        finishHiddenPretimerNow();
        document.documentElement.classList.remove('exercise-pretimer-active-v19');
        syncState();
        return result;
      };
    }
    bind();
  }

  function install() {
    addStyles();
    syncState();
    installFinalRenderHook();
    installPretimerActionHooks();

    document.addEventListener('click',function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (target.closest('#session-modal') || target.closest('#session-between-overlay-v2') || target.closest('#session-pre-timer')) {
        setTimeout(syncState,0);
      }
    },true);
    window.addEventListener('resize',syncState,{passive:true});
    window.__exerciseSessionShellV19 = {sync:syncState};
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();