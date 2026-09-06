(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname)) return;
  if (String(new URLSearchParams(window.location.search).get('concept') || '').toLowerCase() !== 'pulse-home') return;
  if (window.__exercisePulseFlowSmoothV65Installed) return;
  window.__exercisePulseFlowSmoothV65Installed = true;

  var rafId = 0;
  var lastPreValue = '';
  var lastRestValue = '';
  var reduced = false;
  var preWasVisible = false;
  var preStepIndex = -1;
  var preDisplayProgress = 0;
  var preStepFrom = 0;
  var preStepTo = 0;
  var preStepStartedAt = 0;
  var PRE_STEP_DURATION_MS = 360;
  try { reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_) {}

  function installStyles() {
    if (document.getElementById('exercise-pulse-flow-smooth-v65-style')) return;
    var style = document.createElement('style');
    style.id = 'exercise-pulse-flow-smooth-v65-style';
    style.textContent = `
      /* 5 s progress: one smooth step per second, with a seamless radial marker. */
      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-line-fill-v62 {
        height:1.5px !important;
        background:linear-gradient(90deg,rgba(var(--concept-timer-rgb),.22),var(--concept-timer-accent)) !important;
        box-shadow:0 0 5px rgba(var(--concept-timer-rgb),.65),0 0 15px rgba(var(--concept-timer-rgb),.30) !important;
        will-change:width;
      }
      html.exercise-concept-pulse-home-v1 #session-pre-timer .pf-pre-line-dot-v62 {
        width:20px !important;
        height:20px !important;
        top:-2px !important;
        border:0 !important;
        background:radial-gradient(circle,
          var(--concept-timer-soft) 0 17%,
          var(--concept-timer-accent) 28%,
          rgba(var(--concept-timer-rgb),.90) 39%,
          rgba(var(--concept-timer-rgb),.52) 54%,
          rgba(var(--concept-timer-rgb),.20) 69%,
          rgba(var(--concept-timer-rgb),.06) 80%,
          transparent 100%) !important;
        box-shadow:none !important;
        filter:drop-shadow(0 0 7px rgba(var(--concept-timer-rgb),.48)) !important;
        will-change:left,transform;
      }

      /* Double heartbeat lives on the glyphs themselves, never on their box. */
      html.exercise-concept-pulse-home-v1 #session-pre-timer-value.pf-heartbeat-v65 {
        transform-origin:50% 62%;
        animation:pfHeartBeatV65 .54s cubic-bezier(.18,.82,.25,1) both !important;
        will-change:transform,text-shadow,color;
      }
      @keyframes pfHeartBeatV65 {
        0% { transform:scale(1); text-shadow:0 0 0 rgba(var(--concept-timer-rgb),0); }
        9% { transform:scale(1.105); text-shadow:0 0 5px rgba(var(--concept-timer-rgb),.78),0 0 14px rgba(var(--concept-timer-rgb),.42),0 0 28px rgba(var(--concept-timer-rgb),.16); }
        19% { transform:scale(.982); text-shadow:0 0 3px rgba(var(--concept-timer-rgb),.30); }
        31% { transform:scale(1.062); text-shadow:0 0 4px rgba(var(--concept-timer-rgb),.62),0 0 11px rgba(var(--concept-timer-rgb),.30),0 0 22px rgba(var(--concept-timer-rgb),.11); }
        45% { transform:scale(.995); text-shadow:0 0 2px rgba(var(--concept-timer-rgb),.18); }
        62%,100% { transform:scale(1); text-shadow:0 0 0 rgba(var(--concept-timer-rgb),0); }
      }

      /* Pass flow: no white rings. Each dot is colour -> light -> transparent halo. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment::after {
        border:0 !important;
        box-shadow:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.strength::after {
        width:15px !important;height:15px !important;
        background:radial-gradient(circle,rgba(255,196,143,.98) 0 18%,#FB923C 30%,rgba(251,146,60,.82) 43%,rgba(251,146,60,.42) 59%,rgba(251,146,60,.13) 75%,transparent 100%) !important;
        filter:drop-shadow(0 0 5px rgba(251,146,60,.30)) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.cardio::after {
        width:15px !important;height:15px !important;
        background:radial-gradient(circle,rgba(254,202,202,.98) 0 18%,#EF4444 30%,rgba(239,68,68,.83) 43%,rgba(239,68,68,.43) 59%,rgba(239,68,68,.13) 75%,transparent 100%) !important;
        filter:drop-shadow(0 0 5px rgba(239,68,68,.31)) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.strength::after {
        width:17px !important;height:17px !important;
        background:radial-gradient(circle,#FFF1E6 0 14%,#FDBA74 24%,#FB923C 36%,rgba(251,146,60,.86) 48%,rgba(251,146,60,.46) 63%,rgba(251,146,60,.15) 78%,transparent 100%) !important;
        filter:drop-shadow(0 0 7px rgba(251,146,60,.48)) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.done.cardio::after {
        width:17px !important;height:17px !important;
        background:radial-gradient(circle,#FEE2E2 0 14%,#FCA5A5 24%,#EF4444 36%,rgba(239,68,68,.87) 48%,rgba(239,68,68,.47) 63%,rgba(239,68,68,.15) 78%,transparent 100%) !important;
        filter:drop-shadow(0 0 7px rgba(239,68,68,.49)) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after {
        width:26px !important;height:26px !important;
        border:0 !important;
        background:radial-gradient(circle,
          var(--pf-soft) 0 12%,
          var(--pf-accent) 24%,
          rgba(var(--pf-rgb),.92) 36%,
          rgba(var(--pf-rgb),.60) 51%,
          rgba(var(--pf-rgb),.28) 66%,
          rgba(var(--pf-rgb),.08) 80%,
          transparent 100%) !important;
        box-shadow:none !important;
        filter:drop-shadow(0 0 8px rgba(var(--pf-rgb),.57)) !important;
        animation:pfTimelineBreathV65 1.08s ease-in-out infinite !important;
      }
      @keyframes pfTimelineBreathV65 {
        50% { transform:scale(1.13);filter:drop-shadow(0 0 11px rgba(var(--pf-rgb),.74)); }
      }

      /* Cardio/rest halo playheads use the same edge-free radial language. */
      html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 #session-countdown-ring::after,
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring::after {
        width:16px !important;height:16px !important;
        border:0 !important;
        background:radial-gradient(circle,currentColor 0 15%,currentColor 27%,rgba(var(--pf-rgb,34,211,238),.78) 42%,rgba(var(--pf-rgb,34,211,238),.35) 60%,rgba(var(--pf-rgb,34,211,238),.10) 77%,transparent 100%) !important;
        box-shadow:none !important;
      }

      /* REST: make the new Pulse Halo the first and only timer visual. These
         selectors do not wait for pulse-flow-rest-v58, preventing legacy flash. */
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-segments,
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-core {
        display:none !important;visibility:hidden !important;opacity:0 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring {
        --pf-rest-angle:270deg;
        position:relative !important;display:grid !important;place-items:center !important;
        width:150px !important;height:150px !important;aspect-ratio:1 !important;
        margin:0 auto !important;border:0 !important;border-radius:50% !important;
        background:radial-gradient(circle,rgba(34,211,238,.035) 0 48%,transparent 69%) !important;
        box-shadow:none !important;overflow:visible !important;color:#22D3EE !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring::before {
        content:'' !important;display:block !important;position:absolute !important;inset:5px !important;border-radius:50% !important;
        background:conic-gradient(from 225deg,#22D3EE 0 var(--pf-rest-angle),rgba(34,211,238,.105) var(--pf-rest-angle) 270deg,transparent 270deg 360deg) !important;
        -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2.6px),#000 calc(100% - 2.2px)) !important;
        mask:radial-gradient(farthest-side,transparent calc(100% - 2.6px),#000 calc(100% - 2.2px)) !important;
        filter:drop-shadow(0 0 6px rgba(34,211,238,.26)) !important;pointer-events:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring::after {
        content:'' !important;display:block !important;position:absolute !important;z-index:3 !important;left:50% !important;top:50% !important;
        color:#A5F3FC !important;
        transform:translate(-50%,-50%) rotate(calc(225deg + var(--pf-rest-angle))) translateY(-70px) !important;
        transform-origin:center !important;pointer-events:none !important;
        background:radial-gradient(circle,#ECFEFF 0 12%,#A5F3FC 25%,#22D3EE 38%,rgba(34,211,238,.67) 53%,rgba(34,211,238,.25) 69%,rgba(34,211,238,.06) 82%,transparent 100%) !important;
        filter:drop-shadow(0 0 7px rgba(34,211,238,.48)) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-copy {
        position:absolute !important;inset:0 !important;z-index:2 !important;display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;text-align:center !important;color:#CFFAFE !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-value {
        color:#CFFAFE !important;font-size:31px !important;font-weight:600 !important;line-height:1 !important;letter-spacing:-.7px !important;text-shadow:0 0 13px rgba(34,211,238,.14) !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-label {
        margin-top:3px !important;color:#718095 !important;font-size:8px !important;font-weight:650 !important;letter-spacing:1.2px !important;text-transform:uppercase !important;
      }

      /* The rest ECG has a quiet base path plus a bright one-second sweep. */
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-timer-signal-v62 {
        width:48px !important;height:10px !important;opacity:1 !important;filter:none !important;transform:none !important;animation:none !important;color:#22D3EE !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-timer-signal-v62.pf-timer-signal-tick-v62 {
        animation:none !important;filter:none !important;transform:none !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-base-v65 {
        stroke:rgba(34,211,238,.22) !important;stroke-width:1.2 !important;opacity:.9 !important;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-sweep-v65 {
        stroke:#ECFEFF !important;stroke-width:1.7 !important;stroke-linecap:round !important;
        stroke-dasharray:17 83 !important;stroke-dashoffset:100;
        opacity:0;filter:none;
      }
      html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-sweep-v65.pf-rest-sweep-run-v65 {
        animation:pfRestSweepV65 .90s cubic-bezier(.20,.72,.22,1) both !important;
      }
      @keyframes pfRestSweepV65 {
        0% { stroke-dashoffset:100;opacity:.05;filter:drop-shadow(0 0 1px rgba(34,211,238,.12)); }
        24% { opacity:.42; }
        49% { stroke-dashoffset:50;opacity:1;filter:drop-shadow(0 0 2px #ECFEFF) drop-shadow(0 0 7px rgba(34,211,238,.95)) drop-shadow(0 0 15px rgba(34,211,238,.50)); }
        58% { opacity:.84; }
        100% { stroke-dashoffset:0;opacity:.03;filter:drop-shadow(0 0 1px rgba(34,211,238,.08)); }
      }

      @media(max-width:600px) {
        html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring { width:142px !important;height:142px !important; }
        html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .bs-ring::after { transform:translate(-50%,-50%) rotate(calc(225deg + var(--pf-rest-angle))) translateY(-66px) !important; }
      }

      @media(prefers-reduced-motion:reduce) {
        html.exercise-concept-pulse-home-v1 #session-pre-timer-value.pf-heartbeat-v65,
        html.exercise-concept-pulse-home-v1 #session-modal.pulse-flow-v58 .hype-progress-segment.current::after,
        html.exercise-concept-pulse-home-v1 #session-between-overlay-v2 .pf-rest-sweep-v65.pf-rest-sweep-run-v65 {
          animation:none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function restartHeartbeat(valueNode) {
    if (!valueNode || reduced) return;
    valueNode.classList.remove('pf-heartbeat-v65');
    void valueNode.offsetWidth;
    valueNode.classList.add('pf-heartbeat-v65');
    setTimeout(function () { valueNode.classList.remove('pf-heartbeat-v65'); },570);
  }

  function ensureRestSweep() {
    var signal = document.querySelector('#session-between-overlay-v2 .pf-timer-signal-v62');
    if (!signal) return null;
    var svg = signal.querySelector('svg');
    var base = svg && svg.querySelector('path');
    if (!svg || !base) return null;
    base.classList.add('pf-rest-base-v65');
    var sweep = svg.querySelector('.pf-rest-sweep-v65');
    if (!sweep) {
      sweep = base.cloneNode(false);
      sweep.className.baseVal = 'pf-rest-sweep-v65';
      sweep.setAttribute('pathLength','100');
      svg.appendChild(sweep);
    }
    return sweep;
  }

  function restartRestSweep(sweep) {
    if (!sweep || reduced) return;
    sweep.classList.remove('pf-rest-sweep-run-v65');
    void sweep.getBoundingClientRect();
    sweep.classList.add('pf-rest-sweep-run-v65');
    setTimeout(function () { sweep.classList.remove('pf-rest-sweep-run-v65'); },940);
  }

  function easeStep(t) {
    t = Math.max(0,Math.min(1,t));
    return 1 - Math.pow(1 - t,3);
  }

  function resetPretimerStep() {
    preWasVisible = false;
    preStepIndex = -1;
    preDisplayProgress = 0;
    preStepFrom = 0;
    preStepTo = 0;
    preStepStartedAt = 0;
  }

  function syncPretimer(now) {
    var overlay = document.getElementById('session-pre-timer');
    var ring = document.getElementById('session-pre-timer-ring');
    var visible = !!(overlay && ring && overlay.classList.contains('show'));
    if (!visible) {
      lastPreValue = '';
      resetPretimerStep();
      return;
    }

    var rawDeg = parseFloat(String(ring.style.getPropertyValue('--pre-smooth-progress') || '0').replace('deg','')) || 0;
    var rawProgress = Math.max(0,Math.min(1,rawDeg / 360));
    var stepIndex = Math.max(0,Math.min(5,Math.floor(rawProgress * 5 + 0.0001)));

    if (!preWasVisible) {
      preWasVisible = true;
      preStepIndex = stepIndex;
      preDisplayProgress = stepIndex / 5;
      preStepFrom = preDisplayProgress;
      preStepTo = preDisplayProgress;
      preStepStartedAt = now;
    } else if (stepIndex !== preStepIndex) {
      preStepIndex = stepIndex;
      preStepFrom = preDisplayProgress;
      preStepTo = stepIndex / 5;
      preStepStartedAt = now;
    }

    if (reduced || preStepFrom === preStepTo) {
      preDisplayProgress = preStepTo;
    } else {
      var t = Math.max(0,Math.min(1,(now - preStepStartedAt) / PRE_STEP_DURATION_MS));
      preDisplayProgress = preStepFrom + (preStepTo - preStepFrom) * easeStep(t);
    }
    ring.style.setProperty('--pf-pre-progress',Math.max(0,Math.min(1,preDisplayProgress)).toFixed(6));

    var valueNode = document.getElementById('session-pre-timer-value');
    var currentValue = valueNode ? String(valueNode.textContent || '').trim() : '';
    if (currentValue && currentValue !== lastPreValue) {
      lastPreValue = currentValue;
      restartHeartbeat(valueNode);
    }
  }

  function syncRestPulse() {
    var overlay = document.getElementById('session-between-overlay-v2');
    if (!overlay || !overlay.classList.contains('show')) {
      lastRestValue = '';
      return;
    }
    var sweep = ensureRestSweep();
    var valueNode = overlay.querySelector('.bs-value');
    var value = valueNode ? String(valueNode.textContent || '').trim() : '';
    if (value && value !== lastRestValue) {
      lastRestValue = value;
      restartRestSweep(sweep);
    }
  }

  function frame(now) {
    syncPretimer(now);
    syncRestPulse();
    rafId = requestAnimationFrame(frame);
  }

  function waitForFinalPulseStyles() {
    var attempts = 0;
    (function wait() {
      attempts += 1;
      var ready = document.documentElement.classList.contains('exercise-concept-ready-v1');
      var base = document.getElementById('exercise-pulse-flow-timers-v62-style');
      if (ready && base) {
        installStyles();
        var own = document.getElementById('exercise-pulse-flow-smooth-v65-style');
        if (own) document.head.appendChild(own);
        if (!rafId) rafId = requestAnimationFrame(frame);
        return;
      }
      if (attempts < 300) setTimeout(wait,20);
    })();
  }

  window.addEventListener('pagehide',function () {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  },{once:true});

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',waitForFinalPulseStyles,{once:true});
  else waitForFinalPulseStyles();
})();