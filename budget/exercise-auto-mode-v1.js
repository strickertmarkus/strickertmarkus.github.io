/*
 * Training session: automatic mode ("Auto").
 * A round toggle in the session's top bar, next to the 5 s start timer, styled like it (same
 * class, so it follows the session theme). A tap opens a small card: on/off and the time per set.
 *
 * While Auto is on and the pass is running:
 * - every strength set gets the chosen time (default 60 s); when it runs out the set is
 *   completed as if "Klar med set" was tapped, with soft ticks the last 4 s and a chime at 0;
 * - the next step is then started by itself: "Starta nästa set" between sets, "Övning klar" after
 *   the last set, and the following "Starta set"; rests and between exercises (Hopprep …) run
 *   through the existing flow, a between exercise ends after its own time;
 * - after a between exercise that is not a rest, a 20 s rest comes before the next set, in the
 *   session's own rest timer (exercise-session-transition-stability-v142.js beginRest with onDone);
 * - the toggle shows the seconds left of the set as a ring;
 * - nothing advances while the set is paused, while the cardio distance sheet or the end of the
 *   pass is open, or before the first set of the pass has been started by hand.
 * Timed cardio keeps its own time; "Ta tid" cardio is never ended automatically.
 * Settings per profile in localStorage `ex_auto_mode_v1_<user>` = { on, seconds }.
 * Drives the session through its own buttons in #session-controls, so every existing layer
 * (rest overlay, between exercises, 5 s start timer, logging) behaves exactly as for a tap.
 */
(function () {
  'use strict';
  if (window.__exerciseAutoModeV1) return;
  window.__exerciseAutoModeV1 = true;

  var profile = (new URLSearchParams(location.search).get('user') || 'markus').toLowerCase();
  var KEY = 'ex_auto_mode_v1_' + profile;
  var BETWEEN_REST = 20;
  var PRESETS = [30, 45, 60, 90, 120];

  function read() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) {}
    d = d && typeof d === 'object' ? d : {};
    return { on: !!d.on, seconds: Math.min(600, Math.max(10, Math.round(Number(d.seconds) || 60))) };
  }
  function write(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (_) {} }
  var settings = read();

  function getState() { try { return typeof sessionState !== 'undefined' ? sessionState : null; } catch (_) { return null; } }
  function current(state) { return state && Array.isArray(state.exercises) ? state.exercises[Number(state.exerciseIndex) || 0] || null : null; }
  function elapsed(state) {
    var end = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : Date.now();
    return Math.max(0, (end - Number(state.setStartedAt)) / 1000);
  }
  function visible(id) { var el = document.getElementById(id); return !!(el && (el.classList.contains('show') || el.classList.contains('active'))); }
  function controlButton(re) {
    var controls = document.getElementById('session-controls');
    if (!controls) return null;
    return Array.prototype.slice.call(controls.querySelectorAll('button')).find(function (b) { return re.test(String(b.textContent || '').trim()); }) || null;
  }
  function blocked() {
    var modal = document.getElementById('session-modal');
    if (!modal || !modal.classList.contains('show') || modal.classList.contains('session-overview-mode')) return true;
    if (visible('session-pre-timer') || visible('session-between-overlay-v2') || visible('session-complete-box')) return true;
    if (document.getElementById('cardio-finish-v1') || document.getElementById('session-end-choice') && document.getElementById('session-end-choice').classList.contains('show')) return true;
    return false;
  }

  /* ── styles (theme vars from the session, like the 5 s toggle) ── */
  function installStyle() {
    if (document.getElementById('exercise-auto-mode-v1-style')) return;
    var st = document.createElement('style');
    st.id = 'exercise-auto-mode-v1-style';
    st.textContent = '' +
      '#session-auto-toggle-v1{position:relative}' +
      '#session-auto-toggle-v1[aria-pressed="true"] .am-ico{color:var(--pf-soft,#FED7AA)}' +
      '#session-modal.show .session-top > #session-energy-toggle{justify-self:end}' +
      // The label sits centred over the whole circle (not inside the button padding) at a size that fits a 34–40 px circle; the session typography sets larger text on buttons, so this wins on specificity.
      'html body #session-modal #session-auto-toggle-v1{padding:0!important;overflow:hidden}' +
      'html body #session-modal #session-auto-toggle-v1 .am-ico{position:absolute;inset:0;display:grid;place-items:center;font:800 9.5px/1 Inter,system-ui,sans-serif!important;letter-spacing:.04em!important;white-space:nowrap}' +
      '#session-auto-toggle-v1 .am-ring{position:absolute;inset:-1px;border-radius:50%;pointer-events:none;opacity:0;transition:opacity .2s;' +
        'background:conic-gradient(rgb(var(--pf-rgb,251,146,60)) calc(var(--am-p,0)*1turn),transparent 0);' +
        '-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2.5px),#000 calc(100% - 2px));mask:radial-gradient(farthest-side,transparent calc(100% - 2.5px),#000 calc(100% - 2px))}' +
      '#session-auto-toggle-v1.is-counting .am-ring{opacity:1}' +
      'html body #session-modal #session-auto-toggle-v1.is-counting .am-ico{font-size:13px!important;letter-spacing:0!important;font-variant-numeric:tabular-nums}' +
      '#session-auto-pop-v1{position:fixed;z-index:2147482000;width:min(300px,calc(100vw - 24px));padding:14px 14px 12px;border-radius:18px;' +
        'background:#141820;border:1px solid rgba(var(--pf-rgb,251,146,60),.28);box-shadow:0 18px 44px rgba(0,0,0,.55),0 0 24px rgba(var(--pf-rgb,251,146,60),.10);' +
        'font-family:Inter,system-ui,sans-serif;color:#eef2f6;opacity:0;transform:translateY(-6px) scale(.98);transform-origin:top right;transition:opacity .18s ease,transform .22s cubic-bezier(.22,1,.36,1)}' +
      '#session-auto-pop-v1.show{opacity:1;transform:none}' +
      '#session-auto-pop-v1[hidden]{display:none}' +
      '#session-auto-pop-v1 .am-row{display:flex;align-items:center;justify-content:space-between;gap:12px}' +
      '#session-auto-pop-v1 .am-title{font-size:15px;font-weight:800}' +
      '#session-auto-pop-v1 .am-sub{font-size:11.5px;color:#8b95a3;margin:4px 0 12px;line-height:1.4}' +
      '#session-auto-pop-v1 .am-switch{appearance:none;width:46px;height:26px;padding:3px;border-radius:999px;cursor:pointer;flex:0 0 auto;' +
        'border:1px solid rgba(var(--pf-rgb,251,146,60),.25);background:rgba(var(--pf-rgb,251,146,60),.07)}' +
      '#session-auto-pop-v1 .am-switch::after{content:"";display:block;width:18px;height:18px;border-radius:50%;background:#64748B;transition:transform .18s ease,background .18s ease}' +
      '#session-auto-pop-v1 .am-switch[aria-checked="true"]{background:rgba(var(--pf-rgb,251,146,60),.17);border-color:rgba(var(--pf-rgb,251,146,60),.68);box-shadow:0 0 12px rgba(var(--pf-rgb,251,146,60),.34)}' +
      '#session-auto-pop-v1 .am-switch[aria-checked="true"]::after{transform:translateX(20px);background:var(--pf-accent,#FB923C)}' +
      '#session-auto-pop-v1 .am-label{font-size:10px;font-weight:800;letter-spacing:.1em;color:#8b95a3;text-transform:uppercase;margin-bottom:8px}' +
      '#session-auto-pop-v1 .am-time{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}' +
      '#session-auto-pop-v1 .am-time b{font-size:28px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--pf-soft,#FED7AA)}' +
      '#session-auto-pop-v1 .am-step{appearance:none;width:40px;height:40px;border-radius:50%;cursor:pointer;font:500 20px/1 Inter,sans-serif;' +
        'border:1px solid rgba(var(--pf-rgb,251,146,60),.3);background:rgba(var(--pf-rgb,251,146,60),.07);color:var(--pf-soft,#FED7AA)}' +
      '#session-auto-pop-v1 .am-chips{display:flex;gap:6px}' +
      '#session-auto-pop-v1 .am-chip{flex:1;appearance:none;cursor:pointer;padding:8px 0;border-radius:999px;font:600 12px/1 Inter,sans-serif;' +
        'border:1px solid rgba(255,255,255,.1);background:transparent;color:#c8d0da}' +
      '#session-auto-pop-v1 .am-chip[aria-pressed="true"]{border-color:rgba(var(--pf-rgb,251,146,60),.6);background:rgba(var(--pf-rgb,251,146,60),.12);color:var(--pf-soft,#FED7AA)}' +
      '@media (prefers-reduced-motion:reduce){#session-auto-pop-v1{transition:none}}';
    document.head.appendChild(st);
  }

  /* ── toggle + settings card ── */
  var toggle = null, pop = null;
  function ensureToggle() {
    var top = document.querySelector('#session-modal .session-top');
    if (!top) return null;
    if (toggle && top.contains(toggle)) {
      // Keep it right before the 5 s toggle, which may be created after this one.
      var p = document.getElementById('session-pretimer-toggle-v2');
      if (p && toggle.nextElementSibling !== p) p.insertAdjacentElement('beforebegin', toggle);
      return toggle;
    }
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'session-auto-toggle-v1';
    toggle.className = 'session-pretimer-toggle-v2';
    toggle.innerHTML = '<span class="am-ring" aria-hidden="true"></span><span class="am-ico">AUTO</span>';
    toggle.addEventListener('click', function (e) { e.stopPropagation(); pop && !pop.hidden ? closePop() : openPop(); });
    var pre = document.getElementById('session-pretimer-toggle-v2');
    if (pre) pre.insertAdjacentElement('beforebegin', toggle);
    else top.appendChild(toggle);
    paintToggle(null);
    return toggle;
  }
  function paintToggle(left) {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(settings.on));
    toggle.setAttribute('aria-label', 'Automatläge ' + (settings.on ? 'på, ' + settings.seconds + ' s per set' : 'av'));
    var ico = toggle.querySelector('.am-ico');
    var counting = settings.on && left != null;
    toggle.classList.toggle('is-counting', counting);
    var text = counting ? String(Math.max(0, Math.ceil(left))) : 'AUTO';
    if (ico.textContent !== text) ico.textContent = text;
    toggle.style.setProperty('--am-p', counting ? String(Math.max(0, Math.min(1, left / settings.seconds))) : '0');
  }
  function fmt(s) { return s >= 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : s + ' s'; }
  function renderPop() {
    pop.querySelector('.am-switch').setAttribute('aria-checked', String(settings.on));
    pop.querySelector('.am-time b').textContent = fmt(settings.seconds);
    pop.querySelectorAll('.am-chip').forEach(function (c) { c.setAttribute('aria-pressed', String(Number(c.dataset.s) === settings.seconds)); });
  }
  function save() { write(settings); renderPop(); paintToggle(null); }
  function openPop() {
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'session-auto-pop-v1';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', 'Automatläge');
      pop.hidden = true;
      pop.innerHTML = '<div class="am-row"><span class="am-title">Automatläge</span><button type="button" class="am-switch" role="switch" aria-checked="false" aria-label="Automatläge"></button></div>' +
        '<p class="am-sub">Varje set får en egen tid och går vidare av sig självt. Efter en mellanövning blir det ' + BETWEEN_REST + ' s vila.</p>' +
        '<div class="am-label">Tid per set</div>' +
        '<div class="am-time"><button type="button" class="am-step" data-d="-5" aria-label="5 sekunder kortare">−</button><b></b><button type="button" class="am-step" data-d="5" aria-label="5 sekunder längre">+</button></div>' +
        '<div class="am-chips">' + PRESETS.map(function (s) { return '<button type="button" class="am-chip" data-s="' + s + '">' + fmt(s) + '</button>'; }).join('') + '</div>';
      (document.getElementById('session-modal') || document.body).appendChild(pop);
      pop.addEventListener('click', function (e) {
        e.stopPropagation();
        var b = e.target.closest('button');
        if (!b) return;
        if (b.classList.contains('am-switch')) { settings.on = !settings.on; if (settings.on) armed = true; }
        else if (b.dataset.d) settings.seconds = Math.min(600, Math.max(10, settings.seconds + Number(b.dataset.d)));
        else if (b.dataset.s) settings.seconds = Number(b.dataset.s);
        save();
      });
      document.addEventListener('click', function (e) { if (pop && !pop.hidden && !pop.contains(e.target) && e.target !== toggle) closePop(); });
    }
    var r = toggle.getBoundingClientRect();
    pop.style.top = Math.round(r.bottom + 8) + 'px';
    pop.style.right = Math.max(12, Math.round(window.innerWidth - r.right)) + 'px';
    renderPop();
    pop.hidden = false;
    requestAnimationFrame(function () { pop.classList.add('show'); });
  }
  function closePop() {
    if (!pop) return;
    pop.classList.remove('show');
    setTimeout(function () { if (!pop.classList.contains('show')) pop.hidden = true; }, 200);
  }

  /* ── 20 s rest after a between exercise: the session's own rest timer, with the usual ticks ── */
  var resting = null;   // { ticked: {} } while the rest runs
  function startRest(state, then) {
    var owner = window.__exerciseSessionTransitionStabilityV142;
    if (!owner || typeof owner.beginRest !== 'function') { then(); return; }
    resting = { ticked: {} };
    var ok = owner.beginRest(state, 'auto-rest', { type: 'rest', seconds: BETWEEN_REST, label: 'Efter mellanövningen', onDone: function (timedOut) {
      resting = null;
      if (timedOut && window.SessionSound) window.SessionSound.go();
      then();
    } });
    if (!ok) { resting = null; then(); }
  }
  function restTick() {
    var overlay = document.getElementById('session-between-overlay-v2');
    var deadline = overlay && overlay.classList.contains('show') ? Number(overlay.dataset.restDeadline) : 0;
    if (!deadline) { resting = null; return; }   // skipped or cancelled elsewhere
    var sec = Math.ceil((deadline - Date.now()) / 1000);
    if (sec >= 1 && sec <= 4 && !resting.ticked[sec]) { resting.ticked[sec] = 1; if (window.SessionSound) window.SessionSound.tick(); }
  }

  /* ── engine ── */
  var armed = false;          // the pass is under way (a set has run with Auto on)
  var sawBetween = false;     // a between exercise has been running
  var needRest = false;       // next start waits for the 20 s rest
  var doneToken = '', ticked = {}, waitSince = 0, waitKey = '';
  function setToken(state) { return [state.passStartedAt, state.exerciseIndex, state.currentSet, state.setStartedAt].join('|'); }
  function after(key, ms) {
    if (waitKey !== key) { waitKey = key; waitSince = Date.now(); return false; }
    return Date.now() - waitSince >= ms;
  }
  function tick() {
    var state = getState();
    ensureToggle();
    if (!state) { armed = false; sawBetween = false; needRest = false; paintToggle(null); return; }
    var ex = current(state);
    var running = !!(state.setRunning && state.setStartedAt);
    if (running && ex && ex.__betweenCustomV3) sawBetween = true;
    if (!running && sawBetween && !(ex && ex.__betweenCustomV3) && !state.__betweenCustomRuntimeV3) { sawBetween = false; if (settings.on) needRest = true; }
    if (!settings.on) { paintToggle(null); return; }
    if (running) armed = true;

    // Seconds left in this set (strength by the chosen time, a between exercise by its own).
    var limit = null;
    if (running && ex) {
      if (ex.__betweenCustomV3) limit = Math.max(1, Number(ex.time) * 60);
      else if (ex.kind !== 'cardio') limit = settings.seconds;
    }
    var left = limit != null ? limit - elapsed(state) : null;
    paintToggle(left != null && !ex.__betweenCustomV3 ? left : null);
    if (resting) { restTick(); return; }
    if (blocked() || state.__hypePaused) { waitKey = ''; return; }

    if (running && left != null) {
      var token = setToken(state);
      var sec = Math.ceil(left);
      if (!ex.__betweenCustomV3 && sec >= 1 && sec <= 4 && !ticked[token + sec]) { ticked[token + sec] = 1; if (window.SessionSound) window.SessionSound.tick(); }
      if (left <= 0 && doneToken !== token) {
        doneToken = token;
        if (!ex.__betweenCustomV3 && window.SessionSound) window.SessionSound.go();
        var done = controlButton(/^klar med set$/i);
        if (done) done.click();
      }
      return;
    }
    if (!armed || running) return;

    if (state.awaitingDecision) {
      var key = 'decide|' + setToken(state);
      if (!after(key, 700)) return;
      waitKey = '';
      var nextSet = controlButton(/^starta nästa set$/i);
      var finish = controlButton(/^övning klar$/i);
      (nextSet || finish || { click: function () {} }).click();
      return;
    }
    var start = controlButton(/^starta (set|nästa set|nästa övning)$/i);
    if (!start) { waitKey = ''; return; }
    if (needRest) {
      needRest = false;
      waitKey = '';
      startRest(state, function () { var b = controlButton(/^starta (set|nästa set|nästa övning)$/i); if (b && settings.on) b.click(); });
      return;
    }
    if (!after('start|' + setToken(state), 700)) return;
    waitKey = '';
    start.click();
  }

  installStyle();
  setInterval(tick, 200);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
})();
