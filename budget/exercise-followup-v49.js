(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseFollowupV49Installed) return;
  window.__exerciseFollowupV49Installed = true;

  function addStyles() {
    if (document.getElementById('exercise-followup-v49-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-followup-v49-style';
    style.textContent = `
      /* Keep the completed-exercise actions as the useful two-button row:
         Extra set + Övning klar. The primary next-set state stays single-column. */
      #session-controls.decision-row:has(.session-cta.success):not(:has(.session-cta.primary)) {
        grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      }
      #session-controls.decision-row:has(.session-cta.success):not(:has(.session-cta.primary)) .session-cta.warn,
      #session-controls.decision-row:has(.session-cta.success):not(:has(.session-cta.primary)) .session-cta.success {
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        grid-column:auto !important;
        min-width:0 !important;
        min-height:43px !important;
      }

      #session-modal.show #session-controls .session-cta {
        transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease !important;
      }

      ::view-transition-group(exercise-session-surface-v1),
      ::view-transition-old(exercise-session-surface-v1),
      ::view-transition-new(exercise-session-surface-v1) {
        animation-duration:.001s !important;
        animation-delay:0s !important;
      }

      #session-modal.show #session-controls > * {
        animation-duration:.001s !important;
      }

      .log-edit-pass-v7 { display:none !important; }
      .log-detail-actions-v8 { gap:0 !important; }
      .log-add-workout-v8 {
        width:34px !important;
        height:34px !important;
        flex:0 0 34px !important;
      }

      .log-pulse-interval-v9 .pulse-unit-label-v49 {
        fill:#FCA5A5 !important;
        font-weight:850 !important;
        letter-spacing:.1px !important;
      }
      .log-pace-interval-v37 .pace-goal-label-v49 {
        fill:#6EE7B7 !important;
        font-weight:850 !important;
        letter-spacing:.05px !important;
      }

      @media(max-width:600px) {
        .log-detail-head-v7 {
          display:grid !important;
          grid-template-columns:minmax(0,1fr) 32px !important;
          align-items:start !important;
          gap:4px !important;
        }
        .log-detail-copy-v8 {
          min-width:0 !important;
          width:100% !important;
          max-width:none !important;
          display:block !important;
        }
        .log-detail-copy-v8 > strong {
          display:block !important;
          margin-bottom:4px !important;
        }
        .log-detail-actions-v8 {
          width:32px !important;
          min-width:32px !important;
          display:flex !important;
          justify-content:flex-end !important;
          align-items:flex-start !important;
          align-self:start !important;
          justify-self:end !important;
          gap:0 !important;
        }
        .log-add-workout-v8 {
          width:32px !important;
          height:32px !important;
          flex:0 0 32px !important;
        }
        .log-detail-meta-v8 {
          display:grid !important;
          grid-template-columns:32px 36px repeat(3,minmax(0,1fr)) !important;
          grid-template-areas:"date time pulse vo2 pace" !important;
          column-gap:2px !important;
          row-gap:0 !important;
          width:100% !important;
          max-width:none !important;
          min-width:0 !important;
          align-items:center !important;
          overflow:visible !important;
        }
        .log-detail-meta-v8 .log-meta-date-v8 {
          grid-area:date !important;
          min-width:0 !important;
          white-space:nowrap !important;
          font-size:9px !important;
          font-weight:850 !important;
          line-height:1 !important;
          text-align:left !important;
        }
        .log-detail-meta-v8 .log-meta-time-v8 {
          grid-area:time !important;
          min-width:0 !important;
          white-space:nowrap !important;
          font-size:9px !important;
          font-weight:850 !important;
          line-height:1 !important;
          text-align:left !important;
        }
        .log-detail-meta-v8 .log-pulse-interval-v9 { grid-area:pulse !important; }
        .log-detail-meta-v8 .log-vo2-goal-v36 { grid-area:vo2 !important; }
        .log-detail-meta-v8 .log-pace-interval-v37 { grid-area:pace !important; }
        .log-detail-meta-v8 .log-pulse-interval-v9,
        .log-detail-meta-v8 .log-vo2-goal-v36,
        .log-detail-meta-v8 .log-pace-interval-v37 {
          display:flex !important;
          align-items:center !important;
          justify-content:stretch !important;
          width:100% !important;
          min-width:0 !important;
          max-width:none !important;
          height:36px !important;
          overflow:visible !important;
          margin:0 !important;
        }
        .log-detail-meta-v8 .log-pulse-interval-v9 svg,
        .log-detail-meta-v8 .log-vo2-goal-v36 svg,
        .log-detail-meta-v8 .log-pace-interval-v37 svg {
          display:block !important;
          width:100% !important;
          min-width:0 !important;
          max-width:none !important;
          height:36px !important;
          overflow:visible !important;
        }
        .log-detail-meta-v8 .log-pulse-interval-v9 text,
        .log-detail-meta-v8 .log-vo2-goal-v36 text,
        .log-detail-meta-v8 .log-pace-interval-v37 text {
          font-size:7.1px !important;
        }
      }

      @media(max-width:380px) {
        .log-detail-box {
          padding-left:7px !important;
          padding-right:7px !important;
        }
        .log-detail-head-v7 { gap:3px !important; }
        .log-detail-meta-v8 {
          grid-template-columns:30px 34px repeat(3,minmax(0,1fr)) !important;
          column-gap:1px !important;
        }
        .log-detail-meta-v8 .log-meta-date-v8,
        .log-detail-meta-v8 .log-meta-time-v8 {
          font-size:8px !important;
        }
        .log-add-workout-v8 {
          width:30px !important;
          height:30px !important;
          flex-basis:30px !important;
        }
        .log-detail-meta-v8 .log-pulse-interval-v9,
        .log-detail-meta-v8 .log-vo2-goal-v36,
        .log-detail-meta-v8 .log-pace-interval-v37,
        .log-detail-meta-v8 .log-pulse-interval-v9 svg,
        .log-detail-meta-v8 .log-vo2-goal-v36 svg,
        .log-detail-meta-v8 .log-pace-interval-v37 svg {
          height:33px !important;
        }
        .log-detail-meta-v8 .log-pulse-interval-v9 text,
        .log-detail-meta-v8 .log-vo2-goal-v36 text,
        .log-detail-meta-v8 .log-pace-interval-v37 text {
          font-size:6.3px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function sessionStateSafe() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function syncSessionControls() {
    var controls = document.getElementById('session-controls');
    if (!controls) return;

    var buttons = Array.prototype.slice.call(controls.querySelectorAll('button'));
    var success = buttons.find(function (button) {
      return /^övning klar/i.test(String(button.textContent || '').trim());
    });
    var extra = buttons.find(function (button) {
      return /^extra set/i.test(String(button.textContent || '').trim());
    });
    var primary = buttons.find(function (button) {
      return /^starta/i.test(String(button.textContent || '').trim());
    });

    if (extra) {
      var completedDecision = !!success && !primary;
      extra.style.setProperty('display', completedDecision ? 'flex' : 'none', 'important');
      extra.setAttribute('aria-hidden', completedDecision ? 'false' : 'true');
    }

    var modal = document.getElementById('session-modal');
    var pre = document.getElementById('session-pre-timer');
    var state = sessionStateSafe();
    var activeOrange = !!(
      modal && !modal.classList.contains('session-overview-mode') &&
      ((state && state.setRunning) ||
       (pre && pre.classList.contains('show')) ||
       (state && state.__betweenCustomRuntimeV3))
    );
    if (modal && activeOrange) modal.classList.add('hype-mode');
  }

  function syncLogActions(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var plusButtons = scope.querySelectorAll('.log-add-workout-v8');
    Array.prototype.forEach.call(plusButtons,function (button) {
      button.setAttribute('aria-label','Lägg till övning i passet');
      button.title = 'Lägg till övning i passet';
    });
  }

  function ensureSvgText(svg,className,x,y,anchor,text) {
    if (!svg || svg.querySelector('.' + className)) return;
    var node = document.createElementNS('http://www.w3.org/2000/svg','text');
    node.setAttribute('class',className);
    node.setAttribute('x',String(x));
    node.setAttribute('y',String(y));
    node.setAttribute('text-anchor',anchor || 'middle');
    node.textContent = text;
    svg.appendChild(node);
  }

  function syncLogIntervalAnnotations() {
    document.querySelectorAll('.log-pulse-interval-v9 svg').forEach(function (svg) {
      ensureSvgText(svg,'pulse-unit-label-v49',42,4.6,'middle','bpm');
    });
    document.querySelectorAll('.log-pace-interval-v37 svg').forEach(function (svg) {
      ensureSvgText(svg,'pace-goal-label-v49',76,4.6,'end','4 mål');
    });
  }

  function addExerciseToWorkout(id) {
    id = Number(id);
    if (!id || typeof window.editWorkout !== 'function') return;
    window.editWorkout(id);
    if (typeof window.addExRow === 'function') window.addExRow();

    var title = document.querySelector('#wk-modal .modal > h2');
    if (title) title.textContent = 'Lägg till övning';

    var list = document.getElementById('ex-list');
    if (list && list.lastElementChild) {
      try { list.lastElementChild.scrollIntoView({block:'nearest',behavior:'smooth'}); } catch (_) {}
      var input = list.lastElementChild.querySelector('.ex-name');
      if (input) {
        try { input.focus({preventScroll:true}); } catch (_) { try { input.focus(); } catch (_) {} }
      }
    }
  }
  window.addExerciseToWorkoutV49 = addExerciseToWorkout;

  function handleLogPlus(event) {
    var button = event.target && event.target.closest ? event.target.closest('.log-add-workout-v8') : null;
    if (!button) return;
    var detail = button.closest('.log-detail[data-workout-id]');
    if (!detail) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    addExerciseToWorkout(detail.dataset.workoutId);
  }

  function syncHeartRateChart() {
    try {
      if (!window.Chart || typeof window.Chart.getChart !== 'function') return;
      var canvas = document.getElementById('chart-hr-combined');
      if (!canvas) return;
      var chart = window.Chart.getChart(canvas);
      if (!chart || !chart.data || !Array.isArray(chart.data.datasets)) return;
      var cardio = chart.data.datasets.find(function (dataset) { return dataset && dataset.label === 'Kondition'; });
      if (!cardio || cardio.borderColor === '#EF4444') return;
      cardio.borderColor = '#EF4444';
      chart.update('none');
    } catch (_) {}
  }

  function scheduleSync() {
    syncSessionControls();
    syncLogActions(document);
    syncLogIntervalAnnotations();
    syncHeartRateChart();
    if (typeof queueMicrotask === 'function') queueMicrotask(function () {
      syncSessionControls();
      syncLogActions(document);
      syncLogIntervalAnnotations();
      syncHeartRateChart();
    });
    requestAnimationFrame(function () {
      syncSessionControls();
      syncLogActions(document);
      syncLogIntervalAnnotations();
      syncHeartRateChart();
    });
  }

  function wrapRefreshAll() {
    var original = window.refreshAll;
    if (typeof original !== 'function' || original.__exerciseFollowupV49Wrapped) return;
    var wrapped = function () {
      var result = original.apply(this,arguments);
      scheduleSync();
      return result;
    };
    wrapped.__exerciseFollowupV49Wrapped = true;
    wrapped.__exerciseFollowupV49Original = original;
    window.refreshAll = wrapped;
  }

  function install() {
    addStyles();
    wrapRefreshAll();
    document.addEventListener('click',handleLogPlus,true);

    var observer = new MutationObserver(function (mutations) {
      var relevant = mutations.some(function (mutation) {
        if (mutation.type === 'attributes') {
          var target = mutation.target;
          return target && (
            target.id === 'session-modal' ||
            target.id === 'session-pre-timer' ||
            target.id === 'session-controls'
          );
        }
        return mutation.addedNodes && mutation.addedNodes.length;
      });
      if (relevant) scheduleSync();
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

    scheduleSync();
    setTimeout(scheduleSync,80);
    setTimeout(scheduleSync,350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
