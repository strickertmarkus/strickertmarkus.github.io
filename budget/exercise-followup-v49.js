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

      /* Do not tween a CTA from the previous cyan state into orange. That
         background transition was visible as a brief blue Starta set button. */
      #session-modal.show #session-controls .session-cta {
        transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease !important;
      }

      /* Session View Transitions retain a screenshot of the previous DOM.
         For live set changes that old snapshot can flash behind the new state.
         Keep morphing elsewhere, but make the session snapshot hand-off atomic. */
      ::view-transition-group(exercise-session-surface-v1),
      ::view-transition-old(exercise-session-surface-v1),
      ::view-transition-new(exercise-session-surface-v1) {
        animation-duration:.001s !important;
        animation-delay:0s !important;
      }

      /* Individual live controls should not fade over stale controls. */
      #session-modal.show #session-controls > * {
        animation-duration:.001s !important;
      }

      /* The full-pass edit button is redundant: rows edit individual exercises,
         and + now adds an exercise to this exact logged workout. */
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

      /* Mobile detail header:
         row 1 = workout title | date | time
         row 2 = pulse | VO2 | pace, each with equal width. */
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
          display:grid !important;
          grid-template-columns:minmax(0,1fr) auto auto !important;
          grid-template-areas:
            "title date time"
            "meta meta meta" !important;
          column-gap:8px !important;
          row-gap:5px !important;
          align-items:center !important;
        }
        .log-detail-copy-v8 > strong {
          grid-area:title !important;
          display:block !important;
          min-width:0 !important;
          margin:0 !important;
          overflow:hidden !important;
          text-overflow:ellipsis !important;
          white-space:nowrap !important;
        }
        .log-detail-copy-v8::before {
          content:attr(data-log-date-v49);
          grid-area:date !important;
          color:#67E8F9 !important;
          font-size:9px !important;
          font-weight:850 !important;
          line-height:1 !important;
          white-space:nowrap !important;
        }
        .log-detail-copy-v8::after {
          content:attr(data-log-time-v49);
          grid-area:time !important;
          color:#FDBA74 !important;
          font-size:9px !important;
          font-weight:850 !important;
          line-height:1 !important;
          white-space:nowrap !important;
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
          grid-area:meta !important;
          display:grid !important;
          grid-template-columns:repeat(3,minmax(0,1fr)) !important;
          column-gap:9px !important;
          row-gap:0 !important;
          width:100% !important;
          max-width:none !important;
          min-width:0 !important;
          align-items:center !important;
          overflow:visible !important;
        }
        .log-detail-meta-v8 .log-meta-date-v8,
        .log-detail-meta-v8 .log-meta-time-v8 {
          display:none !important;
        }
        .log-detail-meta-v8 .log-pulse-interval-v9,
        .log-detail-meta-v8 .log-vo2-goal-v36,
        .log-detail-meta-v8 .log-pace-interval-v37 {
          display:flex !important;
          align-items:center !important;
          justify-content:stretch !important;
          width:100% !important;
          min-width:0 !important;
          max-width:none !important;
          height:44px !important;
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
          height:44px !important;
          overflow:visible !important;
        }
        .log-detail-meta-v8 .log-pulse-interval-v9 text,
        .log-detail-meta-v8 .log-vo2-goal-v36 text,
        .log-detail-meta-v8 .log-pace-interval-v37 text {
          font-size:7.5px !important;
        }
      }

      @media(max-width:380px) {
        .log-detail-box {
          padding-left:7px !important;
          padding-right:7px !important;
        }
        .log-detail-head-v7 { gap:3px !important; }
        .log-detail-copy-v8 {
          column-gap:6px !important;
          row-gap:4px !important;
        }
        .log-detail-copy-v8::before,
        .log-detail-copy-v8::after {
          font-size:8px !important;
        }
        .log-detail-meta-v8 {
          column-gap:7px !important;
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
          height:40px !important;
        }
        .log-detail-meta-v8 .log-pulse-interval-v9 text,
        .log-detail-meta-v8 .log-vo2-goal-v36 text,
        .log-detail-meta-v8 .log-pace-interval-v37 text {
          font-size:6.7px !important;
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

    /* flow-polish-v2 deliberately hid warn. Restore it only in the final
       exercise decision state so Extra set sits beside Övning klar again. */
    if (extra) {
      var completedDecision = !!success && !primary;
      extra.style.setProperty('display', completedDecision ? 'flex' : 'none', 'important');
      extra.setAttribute('aria-hidden', completedDecision ? 'false' : 'true');
    }

    /* Stabilize the colour before paint as well as through CSS. The state class
       can be one microtask behind a render during pretimer/custom transitions. */
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

  function syncLogHeaderMeta() {
    document.querySelectorAll('.log-detail-copy-v8').forEach(function (copy) {
      var meta = copy.querySelector('.log-detail-meta-v8');
      if (!meta) return;
      var date = meta.querySelector('.log-meta-date-v8');
      var time = meta.querySelector('.log-meta-time-v8');
      copy.setAttribute('data-log-date-v49',date ? String(date.textContent || '').trim() : '');
      copy.setAttribute('data-log-time-v49',time ? String(time.textContent || '').trim() : '');
    });
  }

  function ensureSvgText(svg,className,x,y,anchor,text) {
    if (!svg) return;
    var node = svg.querySelector('.' + className);
    if (!node) {
      node = document.createElementNS('http://www.w3.org/2000/svg','text');
      node.setAttribute('class',className);
      svg.appendChild(node);
    }
    node.setAttribute('x',String(x));
    node.setAttribute('y',String(y));
    node.setAttribute('text-anchor',anchor || 'middle');
    node.textContent = text;
  }

  function syncLogIntervalAnnotations() {
    document.querySelectorAll('.log-pulse-interval-v9 svg').forEach(function (svg) {
      if (svg.getAttribute('viewBox') === '0 0 84 25') svg.setAttribute('viewBox','0 0 84 31');
      ensureSvgText(svg,'pulse-unit-label-v49',42,29,'middle','bpm');
    });
    document.querySelectorAll('.log-pace-interval-v37 svg').forEach(function (svg) {
      if (svg.getAttribute('viewBox') === '0 0 84 25') svg.setAttribute('viewBox','0 0 84 31');
      ensureSvgText(svg,'pace-goal-label-v49',76,29,'end','4 mål');
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
    syncLogHeaderMeta();
    syncLogIntervalAnnotations();
    syncHeartRateChart();
    if (typeof queueMicrotask === 'function') queueMicrotask(function () {
      syncSessionControls();
      syncLogActions(document);
      syncLogHeaderMeta();
      syncLogIntervalAnnotations();
      syncHeartRateChart();
    });
    requestAnimationFrame(function () {
      syncSessionControls();
      syncLogActions(document);
      syncLogHeaderMeta();
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
