(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__exerciseTimerFocusV145Installed) return;
  window.__exerciseTimerFocusV145Installed = true;

  var audioContext = null;
  var audioBus = null;
  var audioSessionRestoreTimer = null;
  var lastCardioToken = '';
  var collapsedCardioToken = '';
  var lastRestKey = '';
  var lastFrameAt = 0;
  var beeped = Object.create(null);

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; }
    catch (_) { return null; }
  }

  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    var index = Math.max(0, Number(state.exerciseIndex) || 0);
    return state.exercises[index] || null;
  }

  function isTimedCardio(state, exercise) {
    return !!(state && exercise && state.setRunning && state.setStartedAt && exercise.kind === 'cardio' && Number(exercise.time) > 0);
  }

  function cardioToken(state, exercise) {
    return [
      state && state.passStartedAt || '',
      state && Number(state.exerciseIndex) || 0,
      state && Math.max(1, Number(state.currentSet) || 1),
      exercise && exercise.name || '',
      state && state.setStartedAt || ''
    ].join('|');
  }

  function formatClock(seconds) {
    var whole = Math.max(0, Math.floor(Number(seconds) || 0));
    return String(Math.floor(whole / 60)).padStart(2,'0') + ':' + String(whole % 60).padStart(2,'0');
  }

  function formatRemaining(seconds) {
    var whole = Math.max(0, Math.ceil(Number(seconds) || 0));
    return String(Math.floor(whole / 60)).padStart(2,'0') + ':' + String(whole % 60).padStart(2,'0');
  }

  function addStyles() {
    if (document.getElementById('exercise-timer-focus-v145-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-timer-focus-v145-style';
    style.textContent = `
      /* Rest stays functionally unchanged; only its focal timer is enlarged. */
      #session-between-overlay-v2[data-between-type="rest"] .bs-ring,
      #session-between-overlay-v2[data-transition-stability-rest-v142="true"] .bs-ring {
        width:min(340px,76vw) !important;
        height:min(340px,76vw) !important;
      }
      #session-between-overlay-v2[data-between-type="rest"] .bs-core,
      #session-between-overlay-v2[data-transition-stability-rest-v142="true"] .bs-core {
        inset:34px !important;
      }
      #session-between-overlay-v2[data-between-type="rest"] .bs-copy,
      #session-between-overlay-v2[data-transition-stability-rest-v142="true"] .bs-copy {
        width:calc(100% - 76px) !important;
      }
      #session-between-overlay-v2[data-between-type="rest"] .bs-value,
      #session-between-overlay-v2[data-transition-stability-rest-v142="true"] .bs-value {
        font-size:clamp(52px,15vw,82px) !important;
        line-height:.95 !important;
        letter-spacing:-2.8px !important;
        font-variant-numeric:tabular-nums !important;
      }
      #session-between-overlay-v2[data-between-type="rest"] .bs-label,
      #session-between-overlay-v2[data-transition-stability-rest-v142="true"] .bs-label {
        margin-top:11px !important;
        font-size:11px !important;
        letter-spacing:1px !important;
      }
      #session-between-overlay-v2[data-between-type="rest"] .bs-heading,
      #session-between-overlay-v2[data-transition-stability-rest-v142="true"] .bs-heading {
        margin-bottom:18px !important;
        font-size:clamp(20px,5vw,28px) !important;
      }
      #session-between-overlay-v2[data-between-type="rest"] .bs-segment,
      #session-between-overlay-v2[data-transition-stability-rest-v142="true"] .bs-segment {
        width:4px !important;
        background:linear-gradient(to bottom,var(--between-segment-color) 0 18px,transparent 18px) !important;
      }

      #cardio-focus-v145 {
        position:fixed;
        inset:0;
        z-index:2147483450;
        display:none;
        width:100vw;
        height:100dvh;
        min-height:100svh;
        box-sizing:border-box;
        overflow:hidden;
        color:#F8FAFC;
        background:
          radial-gradient(circle at 50% 38%,rgba(239,68,68,.20),transparent 34%),
          radial-gradient(circle at 50% 110%,rgba(127,29,29,.18),transparent 42%),
          linear-gradient(180deg,#16090C 0%,#10070A 48%,#09070A 100%);
        isolation:isolate;
      }
      #cardio-focus-v145.show { display:grid;place-items:center; }
      #cardio-focus-v145::before {
        content:'';
        position:absolute;
        inset:-20%;
        pointer-events:none;
        background:radial-gradient(circle at center,rgba(239,68,68,.07),transparent 52%);
        animation:cardio-focus-breathe-v145 2.2s ease-in-out infinite;
      }
      @keyframes cardio-focus-breathe-v145 {
        0%,100% { opacity:.42;transform:scale(.96); }
        50% { opacity:1;transform:scale(1.035); }
      }
      .cardio-focus-close-v145,
      .cardio-focus-expand-v145 {
        appearance:none;
        border:1px solid rgba(248,113,113,.30);
        background:rgba(20,11,14,.72);
        color:#FCA5A5;
        font:800 11px/1 'Inter',system-ui,sans-serif;
        letter-spacing:.15px;
        cursor:pointer;
        -webkit-tap-highlight-color:transparent;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 8px 24px rgba(0,0,0,.20);
      }
      .cardio-focus-close-v145 {
        position:absolute;
        top:max(14px,env(safe-area-inset-top));
        right:max(14px,env(safe-area-inset-right));
        z-index:4;
        min-height:36px;
        padding:9px 13px;
        border-radius:999px;
      }
      .cardio-focus-close-v145:active,
      .cardio-focus-expand-v145:active { transform:scale(.97); }
      .cardio-focus-shell-v145 {
        position:relative;
        z-index:2;
        width:min(520px,100%);
        display:grid;
        justify-items:center;
        padding:max(72px,calc(env(safe-area-inset-top) + 54px)) 20px max(28px,env(safe-area-inset-bottom));
        box-sizing:border-box;
      }
      .cardio-focus-kicker-v145 {
        color:#F87171;
        font:900 10px/1 'Inter',system-ui,sans-serif;
        letter-spacing:1.55px;
        text-transform:uppercase;
      }
      .cardio-focus-name-v145 {
        width:min(420px,88vw);
        margin-top:8px;
        color:#FEE2E2;
        font:850 clamp(18px,5vw,26px)/1.18 'Inter',system-ui,sans-serif;
        text-align:center;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .cardio-focus-ring-v145 {
        position:relative;
        width:min(360px,78vw);
        height:min(360px,78vw);
        margin:28px auto 12px;
        display:grid;
        place-items:center;
        border-radius:50%;
      }
      .cardio-focus-ring-v145::before {
        content:'';
        position:absolute;
        inset:34px;
        border-radius:50%;
        background:radial-gradient(circle at 50% 42%,rgba(74,18,25,.98),rgba(24,10,14,.99) 70%);
        border:1px solid rgba(248,113,113,.16);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 0 70px rgba(239,68,68,.10);
      }
      .cardio-focus-segments-v145 {
        position:absolute;
        inset:0;
        border-radius:50%;
      }
      .cardio-focus-segment-v145 {
        --cardio-segment:rgba(248,113,113,.11);
        position:absolute;
        left:50%;
        top:50%;
        width:4px;
        height:calc(50% - 2px);
        background:linear-gradient(to bottom,var(--cardio-segment) 0 19px,transparent 19px);
        border-radius:999px;
        opacity:.58;
        transform:translate(-50%,-100%) rotate(var(--cardio-angle));
        transform-origin:50% 100%;
      }
      .cardio-focus-segment-v145.active {
        --cardio-segment:#EF4444;
        opacity:1;
        filter:drop-shadow(0 0 4px rgba(239,68,68,.68));
      }
      .cardio-focus-copy-v145 {
        position:relative;
        z-index:2;
        width:calc(100% - 84px);
        display:grid;
        justify-items:center;
        text-align:center;
      }
      .cardio-focus-value-v145 {
        color:#FCA5A5;
        font:900 clamp(62px,17vw,96px)/.92 'Inter',system-ui,sans-serif;
        letter-spacing:-4px;
        font-variant-numeric:tabular-nums;
        white-space:nowrap;
        text-shadow:0 0 28px rgba(239,68,68,.18);
      }
      .cardio-focus-label-v145 {
        margin-top:11px;
        color:#BFA3A7;
        font:800 10px/1 'Inter',system-ui,sans-serif;
        letter-spacing:1.25px;
        text-transform:uppercase;
      }
      .cardio-focus-plus-v145,
      .cardio-inline-plus-v145 {
        display:none;
        color:#FCA5A5;
        font-weight:850;
        font-variant-numeric:tabular-nums;
      }
      .cardio-focus-plus-v145.show,
      .cardio-inline-plus-v145.show { display:block; }
      .cardio-focus-plus-v145 {
        min-height:22px;
        margin-top:11px;
        font-size:13px;
        letter-spacing:.25px;
      }
      .cardio-focus-plus-v145 .plus-word-v145 {
        margin-left:5px;
        color:#A78B91;
        font-size:9px;
        font-weight:800;
        letter-spacing:1px;
        text-transform:uppercase;
      }
      .cardio-inline-plus-v145 {
        margin-top:5px;
        font-size:10px;
        text-align:center;
      }
      .cardio-inline-plus-v145 .plus-word-v145 {
        margin-left:4px;
        color:#A78B91;
        font-size:8px;
        text-transform:uppercase;
        letter-spacing:.7px;
      }
      .cardio-focus-expand-v145 {
        display:none;
        margin:7px auto 0;
        min-height:30px;
        padding:7px 11px;
        border-radius:999px;
        font-size:9px;
      }
      #session-cardio-countdown.show.cardio-focus-collapsed-v145 .cardio-focus-expand-v145 { display:block; }

      @media(max-width:600px) {
        #session-between-overlay-v2[data-between-type="rest"] .bs-ring,
        #session-between-overlay-v2[data-transition-stability-rest-v142="true"] .bs-ring {
          width:min(330px,80vw) !important;
          height:min(330px,80vw) !important;
        }
        #session-between-overlay-v2[data-between-type="rest"] .bs-core,
        #session-between-overlay-v2[data-transition-stability-rest-v142="true"] .bs-core { inset:31px !important; }
        #session-between-overlay-v2[data-between-type="rest"] .bs-copy,
        #session-between-overlay-v2[data-transition-stability-rest-v142="true"] .bs-copy { width:calc(100% - 70px) !important; }
        .cardio-focus-ring-v145 {
          width:min(350px,84vw);
          height:min(350px,84vw);
        }
        .cardio-focus-ring-v145::before { inset:31px; }
        .cardio-focus-copy-v145 { width:calc(100% - 76px); }
      }
      @media(max-width:360px) {
        #session-between-overlay-v2[data-between-type="rest"] .bs-ring,
        #session-between-overlay-v2[data-transition-stability-rest-v142="true"] .bs-ring {
          width:min(292px,78vw) !important;
          height:min(292px,78vw) !important;
        }
        .cardio-focus-ring-v145 {
          width:min(300px,82vw);
          height:min(300px,82vw);
        }
        .cardio-focus-value-v145 { font-size:clamp(56px,18vw,76px); }
      }
      @media(prefers-reduced-motion:reduce) {
        #cardio-focus-v145::before { animation:none; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureCardioFocus() {
    var overlay = document.getElementById('cardio-focus-v145');
    if (overlay) return overlay;

    var segments = '';
    for (var i=0;i<60;i++) {
      segments += '<span class="cardio-focus-segment-v145 active" data-i="'+i+'" style="--cardio-angle:'+(i*6)+'deg"></span>';
    }

    overlay = document.createElement('div');
    overlay.id = 'cardio-focus-v145';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML =
      '<button type="button" class="cardio-focus-close-v145" aria-label="Visa hela träningspasset">Visa passet</button>' +
      '<div class="cardio-focus-shell-v145">' +
        '<div class="cardio-focus-kicker-v145">Kondition</div>' +
        '<div class="cardio-focus-name-v145" id="cardio-focus-name-v145"></div>' +
        '<div class="cardio-focus-ring-v145">' +
          '<div class="cardio-focus-segments-v145">'+segments+'</div>' +
          '<div class="cardio-focus-copy-v145">' +
            '<div class="cardio-focus-value-v145" id="cardio-focus-value-v145">00:00</div>' +
            '<div class="cardio-focus-label-v145" id="cardio-focus-label-v145">Tid kvar</div>' +
            '<div class="cardio-focus-plus-v145" id="cardio-focus-plus-v145"><span class="plus-time-v145">+ 00:00</span><span class="plus-word-v145">plustid</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('.cardio-focus-close-v145').addEventListener('click',function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (lastCardioToken) collapsedCardioToken = lastCardioToken;
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden','true');
      syncInlineControls(true);
    });
    return overlay;
  }

  function ensureInlineExtras() {
    var wrap = document.getElementById('session-cardio-countdown');
    var copy = document.querySelector('#session-countdown-ring .session-countdown-copy');
    if (!wrap || !copy) return null;

    var plus = document.getElementById('cardio-inline-plus-v145');
    if (!plus) {
      plus = document.createElement('div');
      plus.id = 'cardio-inline-plus-v145';
      plus.className = 'cardio-inline-plus-v145';
      plus.innerHTML = '<span class="plus-time-v145">+ 00:00</span><span class="plus-word-v145">plustid</span>';
      copy.appendChild(plus);
    }

    var button = wrap.querySelector('.cardio-focus-expand-v145');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'cardio-focus-expand-v145';
      button.textContent = 'Fokusläge';
      button.setAttribute('aria-label','Visa konditionstimern i fokusläge');
      button.addEventListener('click',function (event) {
        event.preventDefault();
        event.stopPropagation();
        collapsedCardioToken = '';
        syncCardio(Date.now(),true);
      });
      wrap.appendChild(button);
    }
    return {wrap:wrap,plus:plus,button:button};
  }

  function getAudioContext() {
    if (audioContext) return audioContext;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      audioContext = new Ctx({latencyHint:'interactive'});
      var compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.002;
      compressor.release.value = 0.12;
      compressor.connect(audioContext.destination);
      audioBus = compressor;
    } catch (_) {
      audioContext = null;
      audioBus = null;
    }
    return audioContext;
  }

  function unlockAudio() {
    var ctx = getAudioContext();
    if (!ctx) return;
    try {
      var resumed = ctx.state === 'suspended' ? ctx.resume() : null;
      if (resumed && typeof resumed.catch === 'function') resumed.catch(function () {});
    } catch (_) {}
  }

  function prepareAudibleBeep() {
    try {
      if (navigator.audioSession && 'type' in navigator.audioSession) {
        navigator.audioSession.type = 'playback';
        if (audioSessionRestoreTimer) clearTimeout(audioSessionRestoreTimer);
        audioSessionRestoreTimer = setTimeout(function () {
          try { navigator.audioSession.type = 'ambient'; } catch (_) {}
          audioSessionRestoreTimer = null;
        },320);
      }
    } catch (_) {}
  }

  function beep(finalBeat) {
    var ctx = getAudioContext();
    if (!ctx) return;
    prepareAudibleBeep();
    try { if (ctx.state === 'suspended') ctx.resume(); } catch (_) {}
    if (ctx.state !== 'running') return;
    try {
      var now = ctx.currentTime;
      var duration = finalBeat ? 0.17 : 0.095;
      var master = ctx.createGain();
      master.gain.setValueAtTime(0.0001,now);
      master.gain.exponentialRampToValueAtTime(finalBeat ? 0.22 : 0.16,now + 0.007);
      master.gain.exponentialRampToValueAtTime(0.0001,now + duration);
      master.connect(audioBus || ctx.destination);

      [finalBeat ? 1080 : 820, finalBeat ? 1620 : 1230].forEach(function (frequency,index) {
        var oscillator = ctx.createOscillator();
        var voice = ctx.createGain();
        oscillator.type = index ? 'sine' : 'square';
        oscillator.frequency.setValueAtTime(frequency,now);
        voice.gain.value = index ? 0.42 : 0.78;
        oscillator.connect(voice);
        voice.connect(master);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.015);
      });
    } catch (_) {}
  }

  function beepOnce(key,second) {
    if (second < 1 || second > 5) return;
    var ledgerKey = key + '|' + second;
    if (beeped[ledgerKey]) return;
    beeped[ledgerKey] = true;
    unlockAudio();
    beep(second === 1);
  }

  function elapsedForState(state,now) {
    if (!state || !state.setStartedAt) return 0;
    var end = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : now;
    return Math.max(0,(end - Number(state.setStartedAt)) / 1000);
  }

  function updateRing(container,remaining,total) {
    if (!container) return;
    var ratio = total > 0 ? Math.max(0,Math.min(1,remaining / total)) : 0;
    var count = Math.ceil(ratio * 60);
    container.querySelectorAll('.cardio-focus-segment-v145').forEach(function (segment,index) {
      segment.classList.toggle('active',index < count);
    });
  }

  function syncInlineControls(collapsed) {
    var extras = ensureInlineExtras();
    if (!extras) return;
    extras.wrap.classList.toggle('cardio-focus-collapsed-v145',!!collapsed);
  }

  function syncCardio(now,force) {
    var state = getState();
    var exercise = currentExercise(state);
    var timed = isTimedCardio(state,exercise);
    var overlay = ensureCardioFocus();
    var extras = ensureInlineExtras();

    if (!timed) {
      lastCardioToken = '';
      collapsedCardioToken = '';
      if (overlay) {
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden','true');
      }
      if (extras) {
        extras.wrap.classList.remove('cardio-focus-collapsed-v145');
        extras.plus.classList.remove('show');
      }
      return;
    }

    var token = cardioToken(state,exercise);
    if (token !== lastCardioToken) {
      lastCardioToken = token;
      collapsedCardioToken = '';
    }

    var total = Math.max(1,Number(exercise.time) * 60);
    var elapsed = elapsedForState(state,now);
    var remainingRaw = total - elapsed;
    var remaining = Math.max(0,remainingRaw);
    var overtime = Math.max(0,elapsed - total);
    var second = Math.ceil(remainingRaw);
    if (second >= 1 && second <= 5) beepOnce('cardio|'+token,second);

    var value = document.getElementById('cardio-focus-value-v145');
    var label = document.getElementById('cardio-focus-label-v145');
    var name = document.getElementById('cardio-focus-name-v145');
    var plus = document.getElementById('cardio-focus-plus-v145');
    if (value) value.textContent = formatRemaining(remaining);
    if (label) label.textContent = overtime > 0 ? 'Måltid nådd' : 'Tid kvar';
    if (name) name.textContent = exercise.name || 'Kondition';
    if (plus) {
      plus.classList.toggle('show',overtime >= 0.05);
      var plusTime = plus.querySelector('.plus-time-v145');
      if (plusTime) plusTime.textContent = '+ ' + formatClock(overtime);
    }
    updateRing(overlay,remaining,total);

    if (extras) {
      extras.wrap.classList.toggle('cardio-focus-collapsed-v145',collapsedCardioToken === token);
      extras.plus.classList.toggle('show',overtime >= 0.05);
      var inlinePlusTime = extras.plus.querySelector('.plus-time-v145');
      if (inlinePlusTime) inlinePlusTime.textContent = '+ ' + formatClock(overtime);
    }

    var modal = document.getElementById('session-modal');
    var pre = document.getElementById('session-pre-timer');
    var blockedByOverview = !!(modal && modal.classList.contains('session-overview-mode'));
    var blockedByPretimer = !!(pre && pre.classList.contains('show'));
    var shouldShow = collapsedCardioToken !== token && !blockedByOverview && !blockedByPretimer;
    overlay.classList.toggle('show',shouldShow);
    overlay.setAttribute('aria-hidden',shouldShow ? 'false' : 'true');
  }

  function restSecondsFromDom() {
    var overlay = document.getElementById('session-between-overlay-v2');
    if (!overlay || !overlay.classList.contains('show')) return null;
    var isRest = overlay.dataset.betweenType === 'rest' || overlay.dataset.transitionStabilityRestV142 === 'true';
    if (!isRest) return null;
    var value = document.getElementById('bs-overlay-value');
    var text = value ? String(value.textContent || '').trim() : '';
    var match = text.match(/^(\d{1,3}):(\d{2})$/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function syncRestSound() {
    var overlay = document.getElementById('session-between-overlay-v2');
    var seconds = restSecondsFromDom();
    if (seconds == null) {
      lastRestKey = '';
      return;
    }
    var state = getState();
    var key = [
      'rest',
      state && state.passStartedAt || '',
      state && Number(state.exerciseIndex) || 0,
      state && Math.max(1,Number(state.currentSet) || 1),
      overlay && overlay.dataset.betweenType || 'rest'
    ].join('|');
    lastRestKey = key;
    if (seconds >= 1 && seconds <= 5) beepOnce(key,seconds);
  }

  function frame(now) {
    if (!lastFrameAt || now - lastFrameAt >= 80) {
      lastFrameAt = now;
      syncCardio(Date.now(),false);
      syncRestSound();
    }
    requestAnimationFrame(frame);
  }

  function installAudioUnlock() {
    ['pointerdown','touchstart','keydown'].forEach(function (type) {
      document.addEventListener(type,unlockAudio,{capture:true,passive:true});
    });
  }

  function install() {
    addStyles();
    ensureCardioFocus();
    ensureInlineExtras();
    installAudioUnlock();
    requestAnimationFrame(frame);
    window.__exerciseTimerFocusV145 = {
      unlockAudio:unlockAudio,
      beep:function () { unlockAudio(); beep(false); },
      expandCardio:function () { collapsedCardioToken='';syncCardio(Date.now(),true); }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
