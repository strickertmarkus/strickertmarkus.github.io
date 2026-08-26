(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;

  function getState() {
    try {
      return typeof sessionState !== 'undefined' ? sessionState : null;
    } catch (e) {
      return null;
    }
  }

  function addStyles() {
    if (document.getElementById('exercise-session-progress-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-session-progress-style';
    style.textContent = `
      /* Hype set details: large text, no cards/boxes. */
      #session-modal .hype-set-details {
        gap: 26px !important;
        margin: 8px 0 4px !important;
      }
      #session-modal .hype-set-detail {
        min-width: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
      }
      #session-modal .hype-set-detail-label {
        font-size: 10px !important;
        color: #A8A29E !important;
      }
      #session-modal .hype-set-detail-value {
        margin-top: 4px !important;
        font-size: 29px !important;
        color: #FDBA74 !important;
      }

      .hype-workout-progress {
        display: none;
        width: min(820px, 92%);
        margin: 20px auto 8px;
      }
      #session-modal.hype-focus .hype-workout-progress {
        display: block;
      }
      .hype-progress-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 9px;
      }
      .hype-progress-title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .9px;
        text-transform: uppercase;
        color: #A8A29E;
      }
      .hype-progress-percent {
        font-size: 25px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: -1px;
        color: #FDBA74;
        font-variant-numeric: tabular-nums;
      }
      .hype-progress-track {
        display: flex;
        width: 100%;
        height: 24px;
        gap: 2px;
        padding: 3px;
        border-radius: 9px;
        background: rgba(255,255,255,.055);
        border: 1px solid rgba(255,255,255,.075);
        overflow: hidden;
      }
      .hype-progress-segment {
        flex: 1 1 0;
        min-width: 2px;
        border-radius: 4px;
        opacity: .22;
        transition: opacity .2s ease, box-shadow .2s ease, transform .2s ease;
      }
      .hype-progress-segment.strength {
        background: #FB923C;
      }
      .hype-progress-segment.cardio {
        background: #22D3EE;
      }
      .hype-progress-segment.done {
        opacity: 1;
      }
      .hype-progress-segment.strength.done {
        box-shadow: 0 0 8px rgba(251,146,60,.34);
      }
      .hype-progress-segment.cardio.done {
        box-shadow: 0 0 8px rgba(34,211,238,.32);
      }
      .hype-progress-segment.current {
        opacity: .55;
        transform: scaleY(1.08);
      }
      .hype-progress-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 8px;
        font-size: 10px;
        color: #78716C;
      }
      .hype-progress-legend {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
      }
      .hype-progress-key {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .hype-progress-dot {
        width: 8px;
        height: 8px;
        border-radius: 3px;
      }
      .hype-progress-dot.strength { background: #FB923C; }
      .hype-progress-dot.cardio { background: #22D3EE; }

      @media (max-width: 600px) {
        #session-modal .hype-set-details {
          gap: 10px !important;
          margin-top: 5px !important;
        }
        #session-modal .hype-set-detail-value {
          font-size: clamp(22px, 7vw, 29px) !important;
        }
        .hype-workout-progress {
          width: 100%;
          margin: 14px auto 5px;
        }
        .hype-progress-track {
          height: 27px;
          gap: 1.5px;
          padding: 3px;
        }
        .hype-progress-percent {
          font-size: 23px;
        }
        .hype-progress-meta {
          align-items: flex-start;
          flex-direction: column;
          gap: 5px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureProgress() {
    var existing = document.getElementById('hype-workout-progress');
    if (existing) return existing;

    var details = document.getElementById('hype-set-details');
    if (!details || !details.parentNode) return null;

    var wrap = document.createElement('div');
    wrap.id = 'hype-workout-progress';
    wrap.className = 'hype-workout-progress';
    wrap.innerHTML =
      '<div class="hype-progress-head">' +
        '<div class="hype-progress-title">Passprogress</div>' +
        '<div class="hype-progress-percent" id="hype-progress-percent">0%</div>' +
      '</div>' +
      '<div class="hype-progress-track" id="hype-progress-track"></div>' +
      '<div class="hype-progress-meta">' +
        '<div id="hype-progress-count">0 / 0 set klara</div>' +
        '<div class="hype-progress-legend">' +
          '<span class="hype-progress-key"><span class="hype-progress-dot strength"></span>Styrka</span>' +
          '<span class="hype-progress-key"><span class="hype-progress-dot cardio"></span>Kondition</span>' +
        '</div>' +
      '</div>';
    details.insertAdjacentElement('afterend', wrap);
    return wrap;
  }

  function buildSetPlan(state) {
    var plan = [];
    if (!state || !Array.isArray(state.exercises)) return plan;

    state.exercises.forEach(function (ex, exIndex) {
      var count = Math.max(1, Number(ex.plannedSets) || 1);
      for (var setIndex = 0; setIndex < count; setIndex++) {
        plan.push({
          exIndex: exIndex,
          setIndex: setIndex,
          kind: ex.kind === 'cardio' ? 'cardio' : 'strength'
        });
      }
    });
    return plan;
  }

  function renderProgress() {
    var wrap = ensureProgress();
    var state = getState();
    if (!wrap || !state) return;

    var plan = buildSetPlan(state);
    var total = plan.length;
    var completed = 0;
    if (Array.isArray(state.logs)) {
      completed = state.logs.reduce(function (sum, logs) {
        return sum + (Array.isArray(logs) ? logs.length : 0);
      }, 0);
    }
    completed = Math.min(total, completed);

    var percent = total ? Math.round((completed / total) * 100) : 0;
    var percentEl = document.getElementById('hype-progress-percent');
    var countEl = document.getElementById('hype-progress-count');
    var track = document.getElementById('hype-progress-track');
    if (percentEl) percentEl.textContent = percent + '%';
    if (countEl) countEl.textContent = completed + ' / ' + total + ' set klara';
    if (!track) return;

    track.innerHTML = '';
    var completedByExercise = (state.logs || []).map(function (logs) {
      return Array.isArray(logs) ? logs.length : 0;
    });

    plan.forEach(function (item) {
      var segment = document.createElement('span');
      segment.className = 'hype-progress-segment ' + item.kind;
      var done = item.setIndex < (completedByExercise[item.exIndex] || 0);
      var current = !!(state.setRunning && item.exIndex === state.exerciseIndex && item.setIndex === Math.max(0, (state.currentSet || 1) - 1));
      if (done) segment.classList.add('done');
      else if (current) segment.classList.add('current');
      track.appendChild(segment);
    });
  }

  function install() {
    addStyles();

    var attempts = 0;
    function bindWhenReady() {
      attempts++;
      ensureProgress();
      renderProgress();

      if (typeof window.renderSessionMode !== 'function') {
        if (attempts < 40) setTimeout(bindWhenReady, 100);
        return;
      }
      if (window.__exerciseSessionProgressInstalled) return;
      window.__exerciseSessionProgressInstalled = true;

      var previousRender = window.renderSessionMode;
      var previousTick = window.updateSessionTimers;
      var previousComplete = window.completeCurrentSet;
      var previousStart = window.startCurrentSet;
      var previousNext = window.startNextSet;
      var previousExtra = window.addExtraSet;
      var previousFinish = window.finishCurrentExercise;

      window.renderSessionMode = function () {
        var result = previousRender.apply(this, arguments);
        ensureProgress();
        renderProgress();
        return result;
      };

      if (typeof previousTick === 'function') {
        window.updateSessionTimers = function () {
          var result = previousTick.apply(this, arguments);
          renderProgress();
          return result;
        };
      }

      if (typeof previousStart === 'function') {
        window.startCurrentSet = function () {
          var result = previousStart.apply(this, arguments);
          renderProgress();
          return result;
        };
      }

      if (typeof previousComplete === 'function') {
        window.completeCurrentSet = function () {
          var result = previousComplete.apply(this, arguments);
          renderProgress();
          return result;
        };
      }

      if (typeof previousNext === 'function') {
        window.startNextSet = function () {
          var result = previousNext.apply(this, arguments);
          renderProgress();
          return result;
        };
      }

      if (typeof previousExtra === 'function') {
        window.addExtraSet = function () {
          var result = previousExtra.apply(this, arguments);
          renderProgress();
          return result;
        };
      }

      if (typeof previousFinish === 'function') {
        window.finishCurrentExercise = function () {
          var result = previousFinish.apply(this, arguments);
          renderProgress();
          return result;
        };
      }

      renderProgress();
    }

    bindWhenReady();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
