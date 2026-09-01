(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (window.__exerciseSessionUxV20Installed) return;
  window.__exerciseSessionUxV20Installed = true;

  var audioContext = null;
  var lastPretimerValue = '';
  var pretimerWasVisible = false;
  var pretimerShownAt = 0;
  var restSequence = null;
  var restWasVisible = false;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function addStyles() {
    if (document.getElementById('exercise-session-ux-v20-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-session-ux-v20-style';
    style.textContent = `
      /* Rounded moving cap on the five-second start timer. */
      #session-pre-timer-ring::after {
        content:'';
        position:absolute;
        left:50%;
        top:50%;
        width:18px;
        height:18px;
        margin:-9px 0 0 -9px;
        border-radius:50%;
        background:#FB923C;
        box-shadow:0 0 10px rgba(251,146,60,.58);
        transform:rotate(var(--pre-progress,0deg)) translateY(-86px);
        transform-origin:9px 9px;
        pointer-events:none;
        z-index:3;
      }

      #session-between-overlay-v2 .bs-start-next-v20 {
        appearance:none;
        display:block;
        width:min(270px,78vw);
        min-height:46px;
        margin:14px auto 0;
        padding:11px 16px;
        border:1px solid rgba(34,211,238,.42);
        border-radius:999px;
        background:linear-gradient(135deg,rgba(34,211,238,.18),rgba(14,165,233,.14));
        color:#A5F3FC;
        font:850 12px/1.15 'Inter',sans-serif;
        letter-spacing:.15px;
        cursor:pointer;
        box-shadow:0 8px 26px rgba(14,165,233,.10),inset 0 1px 0 rgba(255,255,255,.05);
        -webkit-tap-highlight-color:transparent;
      }
      #session-between-overlay-v2 .bs-start-next-v20:active {
        transform:scale(.985);
      }

      #session-modal.session-overview-mode #session-set-log .set-log-item.current-set-v20 {
        border-color:rgba(34,211,238,.36) !important;
        background:linear-gradient(180deg,rgba(34,211,238,.10),rgba(10,18,28,.68)) !important;
        box-shadow:inset 0 0 0 1px rgba(34,211,238,.035),0 0 22px rgba(34,211,238,.04);
      }
      #session-modal.session-overview-mode #session-set-log .set-log-item.current-set-v20 .set-tag {
        color:#A5F3FC !important;
      }
      #session-modal.session-overview-mode #session-set-log .current-set-status-v20 {
        color:#67E8F9 !important;
        -webkit-text-fill-color:#67E8F9 !important;
      }

      @media(max-width:600px) {
        #session-pre-timer-ring::after {
          width:16px;
          height:16px;
          margin:-8px 0 0 -8px;
          transform:rotate(var(--pre-progress,0deg)) translateY(-79px);
          transform-origin:8px 8px;
        }
        #session-between-overlay-v2 .bs-start-next-v20 {
          min-height:48px;
          font-size:12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getAudioContext() {
    if (audioContext) return audioContext;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { audioContext = new Ctx(); }
    catch (_) { audioContext = null; }
    return audioContext;
  }

  function unlockAudio() {
    var ctx = getAudioContext();
    if (!ctx) return;
    try { if (ctx.state === 'suspended') ctx.resume(); } catch (_) {}
  }

  function beep(second) {
    var ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;
    try {
      var oscillator = ctx.createOscillator();
      var gain = ctx.createGain();
      var now = ctx.currentTime;
      var last = Number(second) === 1;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(last ? 1040 : 760, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(last ? 0.075 : 0.045, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (last ? 0.16 : 0.085));
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + (last ? 0.18 : 0.10));
    } catch (_) {}
  }

  function pretimerElement() {
    return document.getElementById('session-pre-timer');
  }

  function pretimerVisible() {
    var pre = pretimerElement();
    return !!(pre && pre.classList.contains('show'));
  }

  function blockAutomaticPretimerSkip(event) {
    /* exercise-flow-polish auto-clicks the pre-timer after an automatic
       between-set transition. During an actual rest we now let the full five
       seconds run; a real user tap may still skip it. */
    if (!restSequence || !event || event.isTrusted !== false) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function bindPretimerGuard() {
    var pre = pretimerElement();
    if (!pre || pre.dataset.restGuardV20 === 'true') return;
    pre.dataset.restGuardV20 = 'true';
    pre.addEventListener('click', blockAutomaticPretimerSkip, true);
  }

  function syncPretimerSound() {
    bindPretimerGuard();
    var pre = pretimerElement();
    var visible = !!(pre && pre.classList.contains('show'));
    if (visible && !pretimerWasVisible) {
      pretimerShownAt = Date.now();
      lastPretimerValue = '';
      unlockAudio();
      if (restSequence) restSequence.pretimerSeen = true;
    }

    if (visible) {
      var valueEl = document.getElementById('session-pre-timer-value');
      var value = valueEl ? String(valueEl.textContent || '').trim() : '';
      if (/^[1-5]$/.test(value) && value !== lastPretimerValue) {
        lastPretimerValue = value;
        beep(Number(value));
      }
    }

    if (!visible && pretimerWasVisible) {
      if (restSequence && restSequence.pretimerSeen) restSequence.pretimerEndedAt = Date.now();
      lastPretimerValue = '';
    }
    pretimerWasVisible = visible;
  }

  function expectedRestTransition(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    var exIndex = Number(state.exerciseIndex) || 0;
    var currentSet = Math.max(1, Number(state.currentSet) || 1);
    var ex = state.exercises[exIndex];
    if (!ex) return null;
    var planned = ex.kind === 'cardio' ? Math.max(1, Number(ex.plannedSets) || 1) : Math.max(1, Number(ex.plannedSets) || 1);
    if (currentSet < planned) {
      return {
        kind:'next',
        fromExercise:exIndex,
        fromSet:currentSet,
        targetExercise:exIndex,
        targetSet:currentSet + 1,
        passToken:String(state.passStartedAt || '')
      };
    }
    if (exIndex + 1 < state.exercises.length) {
      return {
        kind:'finish',
        fromExercise:exIndex,
        fromSet:currentSet,
        targetExercise:exIndex + 1,
        targetSet:1,
        passToken:String(state.passStartedAt || '')
      };
    }
    return null;
  }

  function ensureRestButton() {
    var overlay = document.getElementById('session-between-overlay-v2');
    var wrap = overlay && overlay.querySelector('.bs-overlay-wrap');
    if (!overlay || !wrap) return null;
    var button = wrap.querySelector('.bs-start-next-v20');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'bs-start-next-v20';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        try { overlay.click(); } catch (_) {}
      });
      var overview = wrap.querySelector('.bs-rest-overview');
      if (overview) overview.insertAdjacentElement('beforebegin', button);
      else wrap.appendChild(button);
    }
    var state = getState();
    var transition = (restSequence && restSequence.kind) || (expectedRestTransition(state) || {}).kind;
    button.textContent = transition === 'finish' ? 'Starta nästa övning direkt' : 'Starta nästa set direkt';
    return button;
  }

  function rawStartCurrentSet(state) {
    if (!state || state.setRunning || state.awaitingDecision || !Array.isArray(state.exercises) || Number(state.exerciseIndex) >= state.exercises.length) return false;
    state.setRunning = true;
    state.awaitingDecision = false;
    state.setStartedAt = Date.now();
    state.__hypePaused = false;
    state.__hypePausedAt = null;
    try { if (typeof window.renderSessionMode === 'function') window.renderSessionMode(); } catch (_) {}
    return true;
  }

  function startTransitionFallback(sequence) {
    if (!sequence || sequence.fallbackRequested) return;
    var state = getState();
    if (!state) return;
    sequence.fallbackRequested = true;
    try {
      if (sequence.kind === 'next' && typeof window.startNextSet === 'function') {
        window.startNextSet();
      } else if (sequence.kind === 'finish' && typeof window.finishCurrentExercise === 'function') {
        window.finishCurrentExercise();
      }
    } catch (_) {}
  }

  function syncRestFlow() {
    var overlay = document.getElementById('session-between-overlay-v2');
    var visible = !!(overlay && overlay.classList.contains('show'));
    var state = getState();

    if (visible) {
      ensureRestButton();
      if (!restWasVisible) {
        var expected = expectedRestTransition(state);
        if (expected) {
          restSequence = expected;
          restSequence.restStartedAt = Date.now();
          restSequence.restEndedAt = 0;
          restSequence.pretimerSeen = false;
          restSequence.pretimerEndedAt = 0;
          restSequence.fallbackRequested = false;
          restSequence.nextExerciseStartRequested = false;
          restSequence.stableRunningSince = 0;
        }
      }
    }

    if (!visible && restWasVisible && restSequence) {
      restSequence.restEndedAt = Date.now();
    }
    restWasVisible = visible;

    var seq = restSequence;
    if (!seq || !state || visible) return;
    if (seq.passToken && String(state.passStartedAt || '') !== seq.passToken) {
      restSequence = null;
      return;
    }

    var now = Date.now();
    var preVisible = pretimerVisible();

    if (seq.kind === 'next') {
      var advanced = Number(state.exerciseIndex) === seq.targetExercise && Number(state.currentSet) >= seq.targetSet;

      /* If the legacy overlay lost its original DOM button during re-render,
         continue the transition ourselves. */
      if (!advanced && !preVisible && seq.restEndedAt && now - seq.restEndedAt > 160) {
        startTransitionFallback(seq);
        return;
      }

      if (!advanced || preVisible) return;

      if (state.awaitingDecision) {
        restSequence = null;
        return;
      }

      /* Old flow-polish deliberately stopped the automatically started set.
         Restore the intended post-rest running state without showing a second
         five-second timer. */
      if (!state.setRunning) {
        rawStartCurrentSet(state);
        seq.stableRunningSince = 0;
        return;
      }

      if (!seq.stableRunningSince) seq.stableRunningSince = now;
      if (now - seq.stableRunningSince > 220) restSequence = null;
      return;
    }

    if (seq.kind === 'finish') {
      var moved = Number(state.exerciseIndex) >= seq.targetExercise;
      if (!moved && !preVisible && seq.restEndedAt && now - seq.restEndedAt > 160) {
        startTransitionFallback(seq);
        return;
      }
      if (!moved) return;
      if (state.awaitingDecision) {
        restSequence = null;
        return;
      }

      if (!state.setRunning && !preVisible && !seq.nextExerciseStartRequested) {
        seq.nextExerciseStartRequested = true;
        try {
          if (typeof window.startCurrentSet === 'function') window.startCurrentSet();
          else rawStartCurrentSet(state);
        } catch (_) { rawStartCurrentSet(state); }
        return;
      }

      if (state.setRunning) {
        if (!seq.stableRunningSince) seq.stableRunningSince = now;
        if (now - seq.stableRunningSince > 220) restSequence = null;
      }
    }
  }

  function currentSetElapsed(state) {
    if (!state || !state.setStartedAt) return 'Pågår';
    var elapsed = Math.max(0, Math.floor((Date.now() - state.setStartedAt) / 1000));
    var min = Math.floor(elapsed / 60);
    var sec = elapsed % 60;
    return String(min).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
  }

  function setLogHeading(text) {
    var setLog = document.getElementById('session-set-log');
    var section = setLog && setLog.parentElement;
    if (!section) return;
    var heading = Array.prototype.slice.call(section.children).find(function (child) {
      return child !== setLog;
    });
    if (!heading) return;
    if (!heading.dataset.originalSetLogHeadingV20) heading.dataset.originalSetLogHeadingV20 = heading.textContent || 'Loggade set';
    heading.textContent = text || heading.dataset.originalSetLogHeadingV20;
  }

  function currentEditorKey(state, ex) {
    return [state.passStartedAt || '',state.exerciseIndex,state.currentSet,ex && ex.kind || ''].join('|');
  }

  function bindCurrentTargetInput(input, ex, key) {
    function commit() {
      var value = Number(input.value);
      if (!Number.isFinite(value) || value < 0) return;
      ex[key] = value;
      try {
        if (typeof window.renderSessionMode === 'function' && document.activeElement !== input) window.renderSessionMode();
      } catch (_) {}
    }
    input.addEventListener('input', function () {
      var value = Number(input.value);
      if (Number.isFinite(value) && value >= 0) ex[key] = value;
    });
    input.addEventListener('change', commit);
  }

  function syncCurrentSetEditor() {
    var state = getState();
    var modal = document.getElementById('session-modal');
    var setLog = document.getElementById('session-set-log');
    if (!modal || !setLog || !state) return;

    var inOverview = modal.classList.contains('session-overview-mode');
    if (!inOverview || !state.setRunning || !Array.isArray(state.exercises) || state.exerciseIndex >= state.exercises.length) {
      if (setLog.dataset.currentEditorV20 === 'true') {
        setLog.dataset.currentEditorV20 = '';
        setLog.dataset.currentEditorKeyV20 = '';
        try { if (typeof window.renderSessionMode === 'function' && !state.setRunning) window.renderSessionMode(); } catch (_) {}
      }
      setLogHeading(null);
      return;
    }

    var ex = state.exercises[state.exerciseIndex];
    var key = currentEditorKey(state, ex);
    var active = document.activeElement;
    if (active && setLog.contains(active) && active.hasAttribute('data-current-target-v20')) return;

    if (setLog.dataset.currentEditorKeyV20 === key && setLog.querySelector('.current-set-v20')) {
      var status = setLog.querySelector('.current-set-status-v20');
      if (status) status.value = currentSetElapsed(state);
      return;
    }

    setLog.dataset.currentEditorV20 = 'true';
    setLog.dataset.currentEditorKeyV20 = key;
    setLogHeading('Pågående set');
    setLog.innerHTML = '';

    var row = document.createElement('div');
    row.className = 'set-log-item current-set-v20';
    var setNo = Math.max(1, Number(state.currentSet) || 1);

    if (ex.kind === 'cardio') {
      row.innerHTML =
        '<div class="set-tag">Runda ' + setNo + '</div>' +
        '<input type="number" min="0" step="0.1" inputmode="decimal" data-current-target-v20="distance" value="' + (Number(ex.distance) || 0) + '">' +
        '<input type="number" min="0" step="0.1" inputmode="decimal" data-current-target-v20="time" value="' + (Number(ex.time) || 0) + '">' +
        '<input class="current-set-status-v20" type="text" readonly value="' + currentSetElapsed(state) + '">';
    } else {
      row.innerHTML =
        '<div class="set-tag">Set ' + setNo + '</div>' +
        '<input type="number" min="0" step="1" inputmode="numeric" data-current-target-v20="reps" value="' + (Number(ex.reps) || 0) + '">' +
        '<input type="number" min="0" step="0.5" inputmode="decimal" data-current-target-v20="weight" value="' + (Number(ex.weight) || 0) + '">' +
        '<input class="current-set-status-v20" type="text" readonly value="' + currentSetElapsed(state) + '">';
    }

    row.querySelectorAll('[data-current-target-v20]').forEach(function (input) {
      bindCurrentTargetInput(input, ex, input.getAttribute('data-current-target-v20'));
    });
    setLog.appendChild(row);
  }

  function wrapAfter(name, after) {
    var fn = window[name];
    if (typeof fn !== 'function' || fn.__sessionUxV20Wrapped) return;
    var wrapped = function () {
      var result = fn.apply(this, arguments);
      try { after(); } catch (_) {}
      return result;
    };
    wrapped.__sessionUxV20Wrapped = true;
    window[name] = wrapped;
  }

  function install() {
    addStyles();
    unlockAudio();
    bindPretimerGuard();
    ensureRestButton();

    ['renderSessionMode','updateSessionTimers','startCurrentSet','startNextSet','completeCurrentSet','finishCurrentExercise']
      .forEach(function (name) { wrapAfter(name, syncCurrentSetEditor); });

    document.addEventListener('pointerdown', unlockAudio, true);
    document.addEventListener('touchstart', unlockAudio, true);
    document.addEventListener('keydown', unlockAudio, true);

    setInterval(function () {
      syncPretimerSound();
      syncRestFlow();
      syncCurrentSetEditor();
      ensureRestButton();
    }, 40);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
