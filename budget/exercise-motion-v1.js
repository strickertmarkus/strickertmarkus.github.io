(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseMotionV2Installed) return;
  window.__exerciseMotionV2Installed = true;

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
      if (stage && !reducedMotion()) stage.classList.add('exercise-morph-fallback-v2');
      var fallbackResult = commit();
      if (stage) setTimeout(function () { stage.classList.remove('exercise-morph-fallback-v2'); }, 430);
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

  function wrap(name, scope) {
    var original = window[name];
    if (typeof original !== 'function' || original.__exerciseMotionV2Wrapped) return;
    var wrapped = function () {
      var self = this;
      var args = arguments;
      return runExerciseMorph(typeof scope === 'function' ? scope.apply(self, args) : scope, function () {
        return original.apply(self, args);
      });
    };
    wrapped.__exerciseMotionV2Wrapped = true;
    wrapped.__exerciseMotionV2Original = original;
    window[name] = wrapped;
  }

  function navLink(href, icon, label) {
    return '<a href="' + href + '" data-training-nav-link><span class="nav-icon" aria-hidden="true">' + icon + '</span><span>' + label + '</span></a>';
  }

  function ensureSharedNavMenu() {
    var header = document.getElementById('pulse-header') || document.querySelector('.app-header');
    if (!header) return null;
    var existing = document.getElementById('nav-menu');
    if (existing) return existing;

    var profile = new URLSearchParams(window.location.search).get('user') === 'maja' ? '?user=maja' : '';
    var wrapper = document.createElement('div');
    wrapper.className = 'nav-dropdown-wrapper shared-training-nav';
    wrapper.dataset.sharedTrainingNav = 'true';
    wrapper.innerHTML =
      '<button class="nav-btn" id="training-nav-toggle" type="button" aria-label="Öppna navigation" aria-controls="nav-menu" aria-expanded="false" title="Navigation">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 7.5h14M5 12h14M5 16.5h14"/></svg>' +
      '</button>' +
      '<nav class="nav-dropdown-menu" id="nav-menu" aria-label="Huvudnavigation" aria-hidden="true">' +
        navLink('home.html','⌂','Startsida') +
        '<div class="nav-sep" aria-hidden="true"></div>' +
        navLink('budget.html','¤','Markus Budget') +
        navLink('analytics.html','⌁','Markus Analys') +
        navLink('budget_maja.html','¤','Majas Budget') +
        navLink('analytics_maja.html','⌁','Majas Analys') +
        navLink('familjebudget.html','◇','Familjebudget') +
        navLink('data.html','⚙','Data &amp; Formler') +
        '<div class="nav-sep" aria-hidden="true"></div>' +
        navLink('calendar.html','□','Familjekalender') +
        navLink('exercise.html' + profile,'◆','Träning') +
        navLink('shopping.html','＋','Inköpslista') +
        '<div class="nav-sep" aria-hidden="true"></div>' +
        navLink('mila.html','○','Milas Milstolpar') +
        navLink('melker.html','○','Melkers Milstolpar') +
      '</nav>';
    header.appendChild(wrapper);

    var button = wrapper.querySelector('#training-nav-toggle');
    var menu = wrapper.querySelector('#nav-menu');

    function commitMenu(open) {
      open = !!open;
      menu.classList.toggle('show', open);
      menu.setAttribute('aria-hidden', String(!open));
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Stäng navigation' : 'Öppna navigation');
      return open;
    }

    window.toggleNavMenu = function (force) {
      var open = typeof force === 'boolean' ? force : !menu.classList.contains('show');
      return commitMenu(open);
    };

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      window.toggleNavMenu();
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('[data-training-nav-link]')) commitMenu(false);
    });
    document.addEventListener('click', function (event) {
      if (!wrapper.contains(event.target) && menu.classList.contains('show')) commitMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !menu.classList.contains('show')) return;
      commitMenu(false);
      button.focus();
    });

    return menu;
  }

  function addStyles() {
    if (document.getElementById('exercise-motion-v2-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-motion-v2-style';
    style.textContent = `
      :root[data-exercise-morph="log"] .log-wrap { view-transition-name:exercise-log-surface-v2; }
      :root[data-exercise-morph="session"] #session-modal .session-shell { view-transition-name:exercise-session-surface-v2; }
      :root[data-exercise-morph="builder"] #day-workout-modal .modal { view-transition-name:exercise-builder-surface-v2; }
      :root[data-exercise-morph="modal"] .modal-overlay > .modal,
      :root[data-exercise-morph="modal"] #session-modal > .session-shell { view-transition-name:exercise-modal-surface-v2; }
      :root[data-exercise-morph="nav"] #nav-menu { view-transition-name:exercise-nav-surface-v2; }

      ::view-transition-group(exercise-log-surface-v2),
      ::view-transition-group(exercise-session-surface-v2),
      ::view-transition-group(exercise-builder-surface-v2),
      ::view-transition-group(exercise-modal-surface-v2),
      ::view-transition-group(exercise-nav-surface-v2) {
        animation-duration:.42s;animation-timing-function:cubic-bezier(.22,1,.36,1);
      }
      ::view-transition-old(exercise-log-surface-v2),
      ::view-transition-old(exercise-session-surface-v2),
      ::view-transition-old(exercise-builder-surface-v2),
      ::view-transition-old(exercise-modal-surface-v2),
      ::view-transition-old(exercise-nav-surface-v2) {
        animation:exercise-morph-out-v2 .30s cubic-bezier(.4,0,.2,1) both;mix-blend-mode:normal;
      }
      ::view-transition-new(exercise-log-surface-v2),
      ::view-transition-new(exercise-session-surface-v2),
      ::view-transition-new(exercise-builder-surface-v2),
      ::view-transition-new(exercise-modal-surface-v2),
      ::view-transition-new(exercise-nav-surface-v2) {
        animation:exercise-morph-in-v2 .42s cubic-bezier(.22,1,.36,1) both;mix-blend-mode:normal;
      }
      @keyframes exercise-morph-out-v2 { to { opacity:0;transform:scale(.975) translateY(-5px);filter:blur(2px); } }
      @keyframes exercise-morph-in-v2 { from { opacity:0;transform:scale(.965) translateY(7px);filter:blur(2px); } to { opacity:1;transform:none;filter:none; } }
      .exercise-morph-fallback-v2 { transform-origin:50% 0;animation:exercise-morph-fallback-v2 .36s cubic-bezier(.22,1,.36,1) both !important; }
      @keyframes exercise-morph-fallback-v2 { 0% { opacity:.24;transform:scale(.975) translateY(4px);filter:blur(1.5px); } 100% { opacity:1;transform:none;filter:none; } }

      .modal-overlay.show > .modal,
      #session-modal.show > .session-shell,
      #exercise-plan-preview-v7.show .plan-preview-card-v7,
      #session-between-overlay-v2.show .bs-overlay-wrap,
      #session-pre-timer.show,
      #nav-menu.show {
        transform-origin:50% 18%;animation:exercise-surface-open-v2 .42s cubic-bezier(.22,1,.36,1) both;
      }
      @keyframes exercise-surface-open-v2 { from { opacity:0;transform:scale(.965) translateY(8px);filter:blur(2px); } to { opacity:1;transform:none;filter:none; } }

      .shared-training-nav{
        --nav-bg:rgba(22,27,34,.97);--nav-border:rgba(255,255,255,.10);--nav-text:#c9d1d9;--nav-muted:#8b949e;--nav-accent:#22d3ee;--nav-hover:rgba(34,211,238,.10);
        position:relative;display:inline-flex;align-items:center;flex:0 0 auto;z-index:1400;
      }
      .shared-training-nav .nav-btn{width:38px;height:38px;display:grid;place-items:center;padding:0;border:1px solid var(--nav-border);border-radius:10px;background:rgba(255,255,255,.035);color:var(--nav-text);cursor:pointer;box-shadow:none;}
      .shared-training-nav .nav-btn:hover,.shared-training-nav .nav-btn[aria-expanded="true"]{color:var(--nav-accent);border-color:color-mix(in srgb,var(--nav-accent) 42%,transparent);background:var(--nav-hover);box-shadow:0 0 18px color-mix(in srgb,var(--nav-accent) 18%,transparent);}
      .shared-training-nav .nav-btn svg{width:20px;height:20px;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;}
      .shared-training-nav .nav-dropdown-menu{position:absolute;top:calc(100% + 10px);right:0;width:min(260px,calc(100vw - 24px));max-height:min(72vh,540px);overflow:auto;padding:7px;background:var(--nav-bg);border:1px solid var(--nav-border);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.45);opacity:0;visibility:hidden;pointer-events:none;transform:translate3d(4px,-5px,0) scale(.98);transform-origin:100% 0;transition:opacity .16s ease,transform .24s cubic-bezier(.22,1,.36,1),visibility 0s linear .24s;z-index:5000;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);}
      .shared-training-nav .nav-dropdown-menu.show{opacity:1;visibility:visible;pointer-events:auto;transform:none;transition:opacity .14s ease,transform .26s cubic-bezier(.22,1,.36,1),visibility 0s;}
      .shared-training-nav .nav-dropdown-menu a{display:flex;align-items:center;gap:10px;min-height:40px;padding:9px 11px;border-radius:9px;color:var(--nav-text);text-decoration:none;font:500 12px/1.25 Inter,system-ui,sans-serif;transition:background-color .16s,color .16s;}
      .shared-training-nav .nav-dropdown-menu a:hover,.shared-training-nav .nav-dropdown-menu a:focus-visible{background:var(--nav-hover);color:var(--nav-accent);outline:none;}
      .shared-training-nav .nav-icon{display:grid;place-items:center;width:18px;flex:0 0 18px;color:var(--nav-muted);font-size:15px;line-height:1;}
      .shared-training-nav .nav-dropdown-menu a:hover .nav-icon,.shared-training-nav .nav-dropdown-menu a:focus-visible .nav-icon{color:var(--nav-accent);}
      .shared-training-nav .nav-sep{height:1px;margin:6px 5px;background:var(--nav-border);}
      html[data-wellness-mode="zen"] body[data-kind="stretch"] .shared-training-nav{--nav-bg:rgba(11,35,28,.96);--nav-border:rgba(212,238,167,.23);--nav-text:#edf4dc;--nav-muted:#9fb29b;--nav-accent:#d4eea7;--nav-hover:rgba(212,238,167,.10);}
      html[data-wellness-mode="zen"] body[data-kind="meditation"] .shared-training-nav{--nav-bg:rgba(205,224,216,.96);--nav-border:rgba(43,100,82,.24);--nav-text:#244739;--nav-muted:#5c716b;--nav-accent:#2b6452;--nav-hover:rgba(43,100,82,.10);}
      html[data-wellness-mode="zen"] #pulse-header .shared-training-nav{margin-left:0;}
      html[data-wellness-mode="zen"] #pulse-header .shared-training-nav .nav-btn{width:44px;height:44px;border-radius:50%;background:transparent;}

      body button,body [role="button"],.exercise-user-option {
        -webkit-tap-highlight-color:transparent;
        transition:transform .16s cubic-bezier(.22,1,.36,1),background-color .20s ease,border-color .20s ease,color .20s ease,box-shadow .22s ease,opacity .18s ease;
      }
      body button:active,body [role="button"]:active,.exercise-user-option:active { transform:scale(.965); }

      #session-current-ex { display:flex;align-items:center;min-height:29px; }
      #session-current-target { min-height:19px; }
      #session-controls { min-height:50px;align-content:start; }
      #session-set-log { min-height:62px;contain:layout paint; }
      #session-pass-timer,#session-set-timer,#session-pre-timer-value { min-width:5ch;font-variant-numeric:tabular-nums; }
      #session-controls > *,#session-set-log > *,#session-complete-box.show,#session-between-overlay-v2.show .bs-start-next-v20 {
        animation:exercise-control-in-v2 .30s cubic-bezier(.22,1,.36,1) both;
      }
      @keyframes exercise-control-in-v2 { from { opacity:0;transform:translateY(5px) scale(.985); } to { opacity:1;transform:none; } }
      #session-modal .session-main { overflow-anchor:none; }

      @media(max-width:760px){
        html[data-wellness-mode="zen"] #pulse-header .shared-training-nav .nav-btn{width:36px;height:36px;border:0;}
        .shared-training-nav .nav-dropdown-menu{right:-2px;top:calc(100% + 8px);}
      }
      @media(prefers-reduced-motion:reduce) {
        .exercise-morph-fallback-v2,.modal-overlay.show > .modal,#session-modal.show > .session-shell,
        #exercise-plan-preview-v7.show .plan-preview-card-v7,#session-between-overlay-v2.show .bs-overlay-wrap,
        #session-pre-timer.show,#nav-menu.show,#session-controls > *,#session-set-log > *,
        .shared-training-nav .nav-dropdown-menu {
          animation-duration:.001s !important;transition-duration:.001s !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    addStyles();
    ensureSharedNavMenu();
    ['startCurrentSet','completeCurrentSet','startNextSet','addExtraSet','finishCurrentExercise']
      .forEach(function (name) { wrap(name,'session'); });
    ['shiftDayWorkoutWeek','onDayWorkoutDateChange','setExerciseKind','shiftViewedWeek']
      .forEach(function (name) { wrap(name,'builder'); });
    wrap('toggleNavMenu','nav');
    window.__exerciseMotionV2 = {run:runExerciseMorph};
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();