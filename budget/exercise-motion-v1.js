(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseMotionV1Installed) return;
  window.__exerciseMotionV1Installed = true;

  var activeTransition = null;

  function reducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (_) { return false; }
  }

  function stageFor(scope) {
    if (scope === 'session') return document.querySelector('#session-modal .session-shell');
    if (scope === 'log') return document.querySelector('.log-wrap');
    if (scope === 'builder') return document.querySelector('#day-workout-modal .modal');
    if (scope === 'nav') return document.getElementById('nav-menu');
    if (scope === 'modal') return document.querySelector('.modal-overlay.show > .modal, #session-modal.show > .session-shell');
    return document.querySelector('main');
  }

  function clearScope(scope) {
    if (document.documentElement.dataset.exerciseMorph === scope) delete document.documentElement.dataset.exerciseMorph;
  }

  function runExerciseMorph(scope, commit) {
    if (typeof commit !== 'function') return;
    scope = scope || 'page';

    if (reducedMotion() || typeof document.startViewTransition !== 'function' || activeTransition) {
      var stage = stageFor(scope);
      if (stage && !reducedMotion()) stage.classList.add('exercise-morph-fallback-v1');
      var fallbackResult = commit();
      if (stage) setTimeout(function () { stage.classList.remove('exercise-morph-fallback-v1'); },430);
      return fallbackResult;
    }

    document.documentElement.dataset.exerciseMorph = scope;
    try {
      var result;
      activeTransition = document.startViewTransition(function () {
        result = commit();
        return result;
      });
      Promise.resolve(activeTransition.finished).catch(function () {}).then(function () {
        activeTransition = null;
        clearScope(scope);
      });
      return result;
    } catch (_) {
      activeTransition = null;
      clearScope(scope);
      return commit();
    }
  }
  window.runExerciseMorph = runExerciseMorph;

  function wrap(name,scope) {
    var original = window[name];
    if (typeof original !== 'function' || original.__exerciseMotionV1Wrapped) return;
    var wrapped = function () {
      var self = this;
      var args = arguments;
      return runExerciseMorph(typeof scope === 'function' ? scope.apply(self,args) : scope,function () {
        return original.apply(self,args);
      });
    };
    wrapped.__exerciseMotionV1Wrapped = true;
    wrapped.__exerciseMotionV1Original = original;
    window[name] = wrapped;
  }

  function addStyles() {
    if (document.getElementById('exercise-motion-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-motion-v1-style';
    style.textContent = `
      :root[data-exercise-morph="log"] .log-wrap { view-transition-name:exercise-log-surface-v1; }
      :root[data-exercise-morph="session"] #session-modal .session-shell { view-transition-name:exercise-session-surface-v1; }
      :root[data-exercise-morph="builder"] #day-workout-modal .modal { view-transition-name:exercise-builder-surface-v1; }
      :root[data-exercise-morph="modal"] .modal-overlay > .modal,
      :root[data-exercise-morph="modal"] #session-modal > .session-shell { view-transition-name:exercise-modal-surface-v1; }
      :root[data-exercise-morph="nav"] #nav-menu { view-transition-name:exercise-nav-surface-v1; }

      ::view-transition-group(exercise-log-surface-v1),
      ::view-transition-group(exercise-session-surface-v1),
      ::view-transition-group(exercise-builder-surface-v1),
      ::view-transition-group(exercise-modal-surface-v1),
      ::view-transition-group(exercise-nav-surface-v1) {
        animation-duration:.42s;
        animation-timing-function:cubic-bezier(.22,1,.36,1);
      }
      ::view-transition-old(exercise-log-surface-v1),
      ::view-transition-old(exercise-session-surface-v1),
      ::view-transition-old(exercise-builder-surface-v1),
      ::view-transition-old(exercise-modal-surface-v1),
      ::view-transition-old(exercise-nav-surface-v1) {
        animation:exercise-morph-out-v1 .30s cubic-bezier(.4,0,.2,1) both;
        mix-blend-mode:normal;
      }
      ::view-transition-new(exercise-log-surface-v1),
      ::view-transition-new(exercise-session-surface-v1),
      ::view-transition-new(exercise-builder-surface-v1),
      ::view-transition-new(exercise-modal-surface-v1),
      ::view-transition-new(exercise-nav-surface-v1) {
        animation:exercise-morph-in-v1 .42s cubic-bezier(.22,1,.36,1) both;
        mix-blend-mode:normal;
      }
      @keyframes exercise-morph-out-v1 {
        to { opacity:0;transform:scale(.975) translateY(-5px);filter:blur(2px); }
      }
      @keyframes exercise-morph-in-v1 {
        from { opacity:0;transform:scale(.965) translateY(7px);filter:blur(2px); }
        to { opacity:1;transform:none;filter:none; }
      }
      .exercise-morph-fallback-v1 {
        transform-origin:50% 0;
        animation:exercise-morph-fallback-v1 .36s cubic-bezier(.22,1,.36,1) both !important;
      }
      @keyframes exercise-morph-fallback-v1 {
        0% { opacity:.24;transform:scale(.975) translateY(4px);filter:blur(1.5px); }
        100% { opacity:1;transform:none;filter:none; }
      }

      .modal-overlay.show > .modal,
      #session-modal.show > .session-shell,
      #exercise-plan-preview-v7.show .plan-preview-card-v7,
      #session-between-overlay-v2.show .bs-overlay-wrap,
      #session-pre-timer.show,
      #nav-menu.show {
        transform-origin:50% 18%;
        animation:exercise-surface-open-v1 .42s cubic-bezier(.22,1,.36,1) both;
      }
      @keyframes exercise-surface-open-v1 {
        from { opacity:0;transform:scale(.965) translateY(8px);filter:blur(2px); }
        to { opacity:1;transform:none;filter:none; }
      }

      body button,
      body [role="button"],
      .exercise-user-option {
        -webkit-tap-highlight-color:transparent;
        transition:transform .16s cubic-bezier(.22,1,.36,1),background-color .20s ease,border-color .20s ease,color .20s ease,box-shadow .22s ease,opacity .18s ease;
      }
      body button:active,
      body [role="button"]:active,
      .exercise-user-option:active {
        transform:scale(.965);
      }

      #session-current-ex {
        display:flex;
        align-items:center;
        min-height:29px;
      }
      #session-current-target { min-height:19px; }
      #session-controls {
        min-height:50px;
        align-content:start;
      }
      #session-set-log {
        min-height:62px;
        contain:layout paint;
      }
      #session-pass-timer,
      #session-set-timer,
      #session-pre-timer-value {
        min-width:5ch;
        font-variant-numeric:tabular-nums;
      }
      #session-controls > *,
      #session-set-log > *,
      #session-complete-box.show,
      #session-between-overlay-v2.show .bs-start-next-v20 {
        animation:exercise-control-in-v1 .30s cubic-bezier(.22,1,.36,1) both;
      }
      @keyframes exercise-control-in-v1 {
        from { opacity:0;transform:translateY(5px) scale(.985); }
        to { opacity:1;transform:none; }
      }
      #session-modal .session-main {
        overflow-anchor:none;
      }

      @media(prefers-reduced-motion:reduce) {
        ::view-transition-group(exercise-log-surface-v1),
        ::view-transition-group(exercise-session-surface-v1),
        ::view-transition-group(exercise-builder-surface-v1),
        ::view-transition-group(exercise-modal-surface-v1),
        ::view-transition-group(exercise-nav-surface-v1),
        ::view-transition-old(exercise-log-surface-v1),
        ::view-transition-old(exercise-session-surface-v1),
        ::view-transition-old(exercise-builder-surface-v1),
        ::view-transition-old(exercise-modal-surface-v1),
        ::view-transition-old(exercise-nav-surface-v1),
        ::view-transition-new(exercise-log-surface-v1),
        ::view-transition-new(exercise-session-surface-v1),
        ::view-transition-new(exercise-builder-surface-v1),
        ::view-transition-new(exercise-modal-surface-v1),
        ::view-transition-new(exercise-nav-surface-v1),
        .exercise-morph-fallback-v1,
        .modal-overlay.show > .modal,
        #session-modal.show > .session-shell,
        #exercise-plan-preview-v7.show .plan-preview-card-v7,
        #session-between-overlay-v2.show .bs-overlay-wrap,
        #session-pre-timer.show,
        #nav-menu.show,
        #session-controls > *,
        #session-set-log > * {
          animation-duration:.001s !important;
          transition-duration:.001s !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function loadPulseFlowTimelineExperiment() {
    var concept = String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase();
    if (concept !== 'pulse-home' || document.querySelector('script[data-exercise-pulse-flow-timeline-v61]')) return;
    var script = document.createElement('script');
    script.src = 'exercise-pulse-flow-timeline-v61.js?v=20260905-1947-pulse-flow-timeline-v61';
    script.async = false;
    script.setAttribute('data-exercise-pulse-flow-timeline-v61','true');
    document.head.appendChild(script);
  }

  function install() {
    addStyles();

    ['startCurrentSet','completeCurrentSet','startNextSet','addExtraSet','finishCurrentExercise']
      .forEach(function (name) { wrap(name,'session'); });

    ['shiftDayWorkoutWeek','onDayWorkoutDateChange','setExerciseKind','shiftViewedWeek']
      .forEach(function (name) { wrap(name,'builder'); });

    /* Modal openings are animated by their final surface itself. Keeping these
       functions synchronous is important because editWorkout fills fields
       immediately after openWorkoutModal returns. */
    wrap('toggleNavMenu','nav');

    window.__exerciseMotionV1 = {run:runExerciseMorph};
    loadPulseFlowTimelineExperiment();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
