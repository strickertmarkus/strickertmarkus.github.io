/*
 * Training mode: when a cardio exercise (Löpning utomhus, Löpband …) is finished, a small sheet asks
 * for the distance and the average pace per km before the set is logged.
 * - The clock is paused while the sheet is open, so the logged time is the real running time.
 * - Distance and pace fill each other from the elapsed time (type one, the other follows).
 * - "Spara" writes the distance into the set's log (actualDistance); the time stays the measured one,
 *   so the pace is kept as distance + time. "Hoppa över" logs the set as before.
 * Wraps window.completeCurrentSet (exercise-hype-timer-layout-v1.js, wrapped again by
 * exercise-custom-transition-atomic-v56.js); custom between exercises are left alone.
 */
(function () {
  'use strict';
  if (window.__exerciseCardioFinishV1) return;
  window.__exerciseCardioFinishV1 = true;

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; } catch (_) { return null; }
  }
  function currentExercise(state) {
    if (!state || !Array.isArray(state.exercises)) return null;
    return state.exercises[Number(state.exerciseIndex) || 0] || null;
  }
  function elapsedSeconds(state) {
    var end = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : Date.now();
    return Math.max(1, Math.round((end - Number(state.setStartedAt)) / 1000));
  }
  function clock(sec) {
    sec = Math.max(0, Math.round(sec));
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  }
  function parseKm(text) {
    var n = parseFloat(String(text || '').replace(',', '.'));
    return isFinite(n) && n > 0 ? n : 0;
  }
  // "5:30", "5.30" or "5,5" (minutes) → seconds per km.
  function parsePace(text) {
    var t = String(text || '').trim();
    if (!t) return 0;
    var m = t.match(/^(\d{1,2})[:.](\d{1,2})$/);
    if (m && t.indexOf(':') !== -1) return Number(m[1]) * 60 + Number(m[2]);
    if (m && m[2].length === 2) return Number(m[1]) * 60 + Number(m[2]);
    var n = parseFloat(t.replace(',', '.'));
    return isFinite(n) && n > 0 ? Math.round(n * 60) : 0;
  }
  function fmtKm(n) { return (Math.round(n * 100) / 100).toString().replace('.', ','); }

  var CSS = '' +
    '#cardio-finish-v1{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:flex-end;justify-content:center;background:rgba(4,6,9,.62);opacity:0;transition:opacity .22s ease}' +
    '#cardio-finish-v1.show{opacity:1}' +
    '#cardio-finish-v1 .cf-card{width:min(520px,100%);padding:20px 20px calc(max(env(safe-area-inset-bottom,0px),20px) + 8px);border-radius:26px 26px 0 0;background:#12161d;box-shadow:0 -14px 40px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06);transform:translateY(40px);transition:transform .34s cubic-bezier(.22,1,.36,1);font-family:Inter,system-ui,-apple-system,sans-serif;color:#eef2f6}' +
    '#cardio-finish-v1.show .cf-card{transform:none}' +
    '#cardio-finish-v1 .cf-kicker{font-size:11px;font-weight:800;letter-spacing:.12em;color:#34D399}' +
    '#cardio-finish-v1 h3{margin:4px 0 2px;font-size:22px;font-weight:800;letter-spacing:-.01em}' +
    '#cardio-finish-v1 .cf-time{font-size:13px;color:#8b95a3}#cardio-finish-v1 .cf-time b{color:#eef2f6;font-variant-numeric:tabular-nums}' +
    '#cardio-finish-v1 .cf-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0 18px}' +
    '#cardio-finish-v1 label{display:block;font-size:11px;font-weight:700;letter-spacing:.06em;color:#8b95a3;text-transform:uppercase}' +
    '#cardio-finish-v1 .cf-input{display:flex;align-items:baseline;gap:6px;margin-top:6px;border-bottom:1.5px dashed rgba(52,211,153,.45);padding-bottom:6px}' +
    '#cardio-finish-v1 input{width:100%;min-width:0;border:0;background:transparent;color:#fff;font:700 28px/1.1 Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums;outline:none;padding:0}' +
    '#cardio-finish-v1 input::placeholder{color:#3b4350}' +
    '#cardio-finish-v1 .cf-unit{font-size:13px;color:#8b95a3;font-weight:600;white-space:nowrap}' +
    '#cardio-finish-v1 .cf-actions{display:flex;gap:10px}' +
    '#cardio-finish-v1 button{appearance:none;border:0;border-radius:999px;padding:14px 18px;font:700 15px/1 Inter,system-ui,sans-serif;cursor:pointer}' +
    '#cardio-finish-v1 .cf-skip{background:rgba(255,255,255,.06);color:#c8d0da}' +
    '#cardio-finish-v1 .cf-save{flex:1;background:#34D399;color:#05261a;box-shadow:0 0 22px rgba(52,211,153,.35)}' +
    '@media (prefers-reduced-motion:reduce){#cardio-finish-v1,#cardio-finish-v1 .cf-card{transition:none}}';

  function ensureStyle() {
    if (document.getElementById('cardio-finish-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'cardio-finish-v1-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  var open = false;
  // Other scripts wrap completeCurrentSet after this one, so it can sit in the chain twice;
  // while a set is being logged every copy just passes the call on.
  var passing = false;
  function ask(state, exercise, done) {
    ensureStyle();
    // Freeze the clock while the sheet is open.
    var pausedHere = false;
    if (!state.__hypePaused) { state.__hypePaused = true; state.__hypePausedAt = Date.now(); pausedHere = true; }
    var seconds = elapsedSeconds(state);
    var planned = Number(exercise.distance) || 0;
    var wrap = document.createElement('div');
    wrap.id = 'cardio-finish-v1';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Distans och snittakt');
    wrap.innerHTML = '<div class="cf-card">' +
      '<div class="cf-kicker">KLAR</div>' +
      '<h3></h3>' +
      '<div class="cf-time">Tid <b>' + clock(seconds) + '</b></div>' +
      '<div class="cf-fields">' +
        '<div><label for="cf-km">Distans</label><div class="cf-input"><input id="cf-km" inputmode="decimal" autocomplete="off" placeholder="0,0"><span class="cf-unit">km</span></div></div>' +
        '<div><label for="cf-pace">Snittakt</label><div class="cf-input"><input id="cf-pace" inputmode="decimal" autocomplete="off" placeholder="0:00"><span class="cf-unit">/km</span></div></div>' +
      '</div>' +
      '<div class="cf-actions"><button type="button" class="cf-skip">Hoppa över</button><button type="button" class="cf-save">Spara</button></div>' +
      '</div>';
    wrap.querySelector('h3').textContent = exercise.name || 'Kondition';
    var km = wrap.querySelector('#cf-km'), pace = wrap.querySelector('#cf-pace');
    if (planned) { km.value = fmtKm(planned); pace.value = clock(seconds / planned); }
    km.addEventListener('input', function () { var d = parseKm(km.value); pace.value = d ? clock(seconds / d) : ''; });
    pace.addEventListener('input', function () { var p = parsePace(pace.value); km.value = p ? fmtKm(seconds / p) : ''; });
    function close(save) {
      if (!open) return;
      open = false;
      var distance = save ? parseKm(km.value) : 0;
      wrap.classList.remove('show');
      setTimeout(function () { wrap.remove(); }, 260);
      // Log with the frozen time; the controller reads __hypePausedAt as the end of the set.
      done(distance, pausedHere);
    }
    wrap.querySelector('.cf-save').addEventListener('click', function () { close(true); });
    wrap.querySelector('.cf-skip').addEventListener('click', function () { close(false); });
    wrap.addEventListener('keydown', function (e) { if (e.key === 'Enter') close(true); });
    document.body.appendChild(wrap);
    open = true;
    requestAnimationFrame(function () { wrap.classList.add('show'); });
    setTimeout(function () { try { km.focus({ preventScroll: true }); } catch (_) { km.focus(); } }, 320);
  }

  function bind() {
    var current = window.completeCurrentSet;
    if (!window.__exerciseSessionControllerV46Installed || typeof current !== 'function') return false;
    if (current.__cardioFinishV1) return true;
    var wrapped = function () {
      var state = getState();
      var exercise = currentExercise(state);
      var self = this, args = arguments;
      if (passing || !state || !exercise || exercise.kind !== 'cardio' || exercise.__betweenCustomV3 || !state.setRunning || !state.setStartedAt) {
        return current.apply(self, args);
      }
      if (open) return;
      var index = Number(state.exerciseIndex) || 0;
      ask(state, exercise, function (distance) {
        var logs = Array.isArray(state.logs) ? state.logs[index] : null;
        var before = Array.isArray(logs) ? logs.length : 0;
        passing = true;
        try { window.completeCurrentSet.apply(self, args); } finally { passing = false; }
        logs = Array.isArray(state.logs) ? state.logs[index] : null;
        if (distance && Array.isArray(logs) && logs.length > before) logs[logs.length - 1].actualDistance = distance;
      });
    };
    wrapped.__cardioFinishV1 = true;
    window.completeCurrentSet = wrapped;
    return true;
  }
  // Other session scripts install (and wrap) completeCurrentSet first; keep this wrapper outermost.
  var tries = 0;
  (function poll() {
    bind();
    if (++tries < 120) setTimeout(poll, tries < 20 ? 250 : 1000);
  })();
})();
