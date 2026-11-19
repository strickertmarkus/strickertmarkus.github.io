/* Training session (archive/exercise.html, session mode) — three small additions:
 *
 * 1. window.__sessionUpcomingV1(state): what comes after the current set. A between-exercise
 *    such as "Hopprep" (custom betweenSets / betweenExercises) wins over the next exercise, so
 *    the "→ next" label next to the exercise name and the preview card agree. Used by
 *    exercise-hype-polish.js and exercise-session-theme-rest-v117.js.
 * 2. "Exercise Mode" title on the left of the top bar, with the plan or explorer programme the
 *    pass comes from under it, and the bar moved down a little so the buttons clear the status
 *    bar / Dynamic Island.
 * 3. A small card slides up at the bottom with what comes next and its animated 3D figure, before
 *    every set: the next set of the same exercise, a rest, or the next exercise. Between exercises
 *    such as Hopprep are skipped in the card (it names what follows them). In a set that counts down (a between exercise, cardio on Nedräkning) it
 *    comes 10 s before the end and stays until the set ends; otherwise about 20 s in, for 7 s.
 * 4. A small round button next to the exercise name shows the current exercise's figure, when
 *    the exercise is in the explorer (the guide answers whether it found the name).
 *    The figure is pulse-exercise-guide.html in figure-only mode (?figure=<name>) inside a small
 *    iframe that is created once and reused (the exercise is switched with postMessage).
 */
(function () {
  'use strict';
  if (window.__sessionNextPreviewV1 || /ingemar/i.test(location.pathname)) return;
  window.__sessionNextPreviewV1 = true;

  var SHOW_AFTER_MS = 20000;   // sets without a countdown
  var VISIBLE_MS = 7000;
  var PRELOAD_AFTER_MS = 6000;
  var COUNTDOWN_SHOW_S = 10;    // sets that count down: this many seconds before the end
  var COUNTDOWN_PRELOAD_S = 25;
  var MANUAL_MS = 12000;        // the figure button keeps the card up this long

  function getState() {
    try { return typeof sessionState !== 'undefined' ? sessionState : null; } catch (_) { return null; }
  }

  function between(raw) {
    raw = raw || {};
    if (raw.enabled === false) return { type: 'none', seconds: 0, name: '' };
    var type = raw.type === 'custom' ? 'custom' : (raw.type === 'rest' ? 'rest' : 'none');
    return { type: type, seconds: Math.max(1, Math.round(Number(raw.seconds) || (type === 'rest' ? 60 : 30))), name: type === 'custom' ? String(raw.name || '').trim() : '' };
  }

  function planFor(state) {
    try {
      var plans = typeof window.getPlannedSessions === 'function' ? (window.getPlannedSessions() || {}) : {};
      return plans[state.date] || null;
    } catch (_) { return null; }
  }

  /* { name, kind: 'between' | 'rest' | 'exercise', seconds, exercise } or null when the pass ends. */
  window.__sessionUpcomingV1 = function (state) {
    state = state || getState();
    if (!state || !Array.isArray(state.exercises) || !state.exercises.length) return null;
    var index = Math.max(0, Number(state.exerciseIndex) || 0);
    var current = state.exercises[index];
    // A between exercise such as Hopprep is running in the exercise's place
    // (exercise-between-custom-exercise-v3.js): after it comes the next set, or the next exercise.
    var runtime = state.__betweenCustomRuntimeV3;
    if (current && current.__betweenCustomV3 && runtime && runtime.originalExercise) {
      var original = runtime.originalExercise;
      if (runtime.transition === 'finish') {
        var after = state.exercises[runtime.index + 1];
        return after ? { name: String(after.name || '').trim(), kind: 'exercise', seconds: 0, exercise: after.name } : null;
      }
      return { name: String(original.name || '').trim(), kind: 'exercise', seconds: 0, exercise: original.name, afterSets: true,
        setNo: (Number(runtime.originalCurrentSet) || 1) + 1, sets: Math.max(Number(original.plannedSets) || 1, (Number(runtime.originalCurrentSet) || 1) + 1) };
    }
    var nextExercise = state.exercises[index + 1] || null;
    var setsLeft = !!current && (Number(state.currentSet) || 1) < (Number(current.plannedSets) || 1);
    var plan = planFor(state);
    var config = between(null);
    if (plan) {
      if (setsLeft) {
        var planned = Array.isArray(plan.exercises) ? plan.exercises[index] : null;
        config = between((planned && planned.betweenSets) || plan.betweenSets);
      } else if (nextExercise) {
        config = between(plan.betweenExercises || plan.betweenSets);
      }
    }
    if (config.type === 'custom' && config.name) return { name: config.name, kind: 'between', seconds: config.seconds, exercise: false };
    if (!nextExercise) return null;
    if (!setsLeft && config.type === 'rest') return { name: 'Vila', kind: 'rest', seconds: config.seconds, exercise: nextExercise.name };
    return { name: String(nextExercise.name || '').trim(), kind: 'exercise', seconds: 0, exercise: nextExercise.name, afterSets: setsLeft };
  };

  /* ── styles ─────────────────────────────────────────────── */
  function installStyle() {
    if (document.getElementById('session-next-preview-v1-style')) return;
    var style = document.createElement('style');
    style.id = 'session-next-preview-v1-style';
    style.textContent = [
      'html body #session-modal.show .session-top{padding-top:calc(max(10px,env(safe-area-inset-top)) + 14px)!important;align-items:center!important}',
      '#session-modal .session-mode-title-v1{display:none}',
      'html body #session-modal.show .session-top > div:has(> .session-title){display:none!important}',
      'html body #session-modal.show .session-mode-title-v1{display:block;grid-column:1;justify-self:start;margin-right:auto;padding-left:2px;color:#F1F5F9;font:650 17px/1.2 Inter,system-ui,sans-serif;letter-spacing:-.3px;white-space:nowrap}',
      'html body #session-modal.show .session-mode-title-v1 span{color:rgb(var(--pf-rgb,52,211,153));text-shadow:0 0 14px rgba(var(--pf-rgb,52,211,153),.45)}',
      'html body #session-modal.show .session-mode-title-v1{min-width:0;width:auto;max-width:100%;justify-self:stretch!important;margin-right:0!important;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box}',
      'html body #session-modal.show .session-mode-title-v1 small{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8a96a6;font:600 10.5px/1.25 Inter,system-ui,sans-serif;letter-spacing:0}',
      'html body #session-modal.show .session-mode-title-v1 small b{color:rgb(var(--pf-rgb,52,211,153));font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:9.5px;margin-right:5px}',
      'html body #session-modal.show .session-mode-title-v1 small[hidden]{display:none}',
      'html body #session-modal.show.session-overview-mode .session-mode-title-v1{display:none}',
      '#session-next-card-v1{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:60;width:min(380px,calc(100vw - 28px));',
      ' display:flex;align-items:center;gap:12px;padding:8px 14px 8px 8px;border-radius:20px;border:1px solid rgba(var(--pf-rgb,52,211,153),.28);',
      ' background:rgba(8,13,20,.94);box-shadow:0 16px 40px rgba(0,0,0,.45),0 0 26px rgba(var(--pf-rgb,52,211,153),.10);',
      ' transform:translate(-50%,calc(100% + 40px));opacity:0;visibility:hidden;pointer-events:none;',
      ' transition:transform .5s cubic-bezier(.16,1,.3,1),opacity .35s ease,visibility 0s linear .5s}',
      '#session-next-card-v1.show{transform:translate(-50%,0);opacity:1;visibility:visible;transition:transform .5s cubic-bezier(.16,1,.3,1),opacity .35s ease,visibility 0s}',
      '#session-next-card-v1 .snp-figure{position:relative;flex:0 0 70px;width:70px;height:96px;border-radius:14px;overflow:hidden;background:#111418}',
      '#session-next-card-v1 .snp-figure iframe{position:absolute;left:0;top:0;width:390px;height:844px;border:0;transform-origin:0 0;transform:translate(-9px,-62px) scale(.27);pointer-events:none;background:transparent}',
      '#session-next-card-v1 .snp-figure .snp-icon{position:absolute;inset:0;display:none;place-items:center;color:rgb(var(--pf-rgb,52,211,153))}',
      '#session-next-card-v1.no-figure .snp-figure iframe{visibility:hidden}',
      '#session-next-card-v1.no-figure .snp-figure .snp-icon{display:grid}',
      '#session-next-card-v1 .snp-copy{min-width:0;flex:1}',
      '#session-next-card-v1 .snp-kicker{color:rgb(var(--pf-rgb,52,211,153));font:700 10px/1.3 Inter,system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase}',
      '#session-next-card-v1 .snp-name{margin-top:4px;color:#F1F5F9;font:650 17px/1.2 Inter,system-ui,sans-serif;letter-spacing:-.3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '#session-next-card-v1 .snp-sub{margin-top:3px;color:#8a96a6;font:500 12px/1.3 Inter,system-ui,sans-serif}',
      '#session-next-card-v1.is-manual{pointer-events:auto;cursor:pointer}',
      'html body #session-modal.show .session-main{position:relative}',
      'html body #session-modal.show.snp-has-figure #session-current-ex{padding-right:48px}',
      '#session-figure-btn-v1{position:absolute;right:2px;z-index:3;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;',
      ' color:rgb(var(--pf-rgb,52,211,153));background:rgba(var(--pf-rgb,52,211,153),.08);border:1px solid rgba(var(--pf-rgb,52,211,153),.32);transition:background .2s,transform .2s}',
      '#session-figure-btn-v1[hidden]{display:none}',
      '#session-figure-btn-v1[aria-pressed="true"]{background:rgba(var(--pf-rgb,52,211,153),.2)}',
      '#session-figure-btn-v1:active{transform:scale(.94)}',
      'html body #session-modal.show.session-overview-mode #session-figure-btn-v1{display:none}',
      '@media (prefers-reduced-motion:reduce){#session-next-card-v1,#session-next-card-v1.show{transition:opacity .2s ease,visibility 0s}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── title ──────────────────────────────────────────────── */
  function ensureTitle() {
    var top = document.querySelector('#session-modal .session-top');
    if (!top || top.querySelector('.session-mode-title-v1')) return;
    // A span, so exercise-hype-timer-layout-v1.js's "div:first-child" rule (which hides the old
    // Passläge heading) keeps matching nothing new; the old heading is hidden below instead.
    var title = document.createElement('span');
    title.className = 'session-mode-title-v1';
    title.innerHTML = 'Exercise <span>Mode</span><small hidden></small>';
    top.insertBefore(title, top.firstChild);
  }
  /* Under the title: the plan (week n of N) or explorer programme the pass comes from. */
  function syncPlanLine(state) {
    var line = document.querySelector('#session-modal .session-mode-title-v1 small');
    if (!line) return;
    var text = '', kind = '';
    if (state && state.date) {
      var day = null;
      try { day = (window.getPlannedSessions() || {})[state.date] || null; } catch (_) {}
      var pass = day && state.sourceExtraId ? (day.additionalSessions || []).find(function (e) { return e && String(e.id) === String(state.sourceExtraId); }) : day;
      if (pass && pass.planId) { kind = 'Plan'; text = (pass.planName || String(pass.planId).replace(/-/g, ' ')) + (pass.planWeek ? ' · v. ' + pass.planWeek + '/' + (pass.planWeeks || 4) : ''); }
      else if (pass && pass.programName) { kind = 'Program'; text = pass.programName; }
    }
    var key = kind + '|' + text;
    if (line.dataset.key === key) return;
    line.dataset.key = key;
    line.hidden = !text;
    line.innerHTML = '';
    if (!text) return;
    var b = document.createElement('b'); b.textContent = kind;
    line.appendChild(b); line.appendChild(document.createTextNode(text));
  }

  /* ── preview card ───────────────────────────────────────── */
  var card = null, frame = null, frameName = '', frameReady = false;

  function ensureCard() {
    if (card && document.body.contains(card)) return card;
    card = document.createElement('div');
    card.id = 'session-next-card-v1';
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');
    card.innerHTML =
      '<div class="snp-figure"><span class="snp-icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h3l2.5-6 4 12 2.5-6H21"/></svg>' +
      '</span></div>' +
      '<div class="snp-copy"><div class="snp-kicker">Nästa</div><div class="snp-name"></div><div class="snp-sub"></div></div>';
    card.addEventListener('click', function () { if (manualUntil) closeManual(); });
    var modal = document.getElementById('session-modal');
    (modal || document.body).appendChild(card);
    return card;
  }

  function guideUrl(name) {
    var user = '';
    try { user = new URLSearchParams(location.search).get('user') || ''; } catch (_) {}
    // Absolute path: archive/exercise.html has a <base>, so relative links resolve unpredictably.
    var base = location.pathname.replace(/\/archive\/[^\/]*$/, '/').replace(/[^\/]*$/, '') + 'pulse-exercise-guide.html';
    return base + '?figure=' + encodeURIComponent(name) + (user ? '&user=' + encodeURIComponent(user) : '');
  }

  function showFigure(name) {
    ensureCard();
    if (!name) { card.classList.add('no-figure'); return; }
    if (frame && frameName === name) return;
    frameName = name;
    if (!frame) {
      frame = document.createElement('iframe');
      frame.title = '';
      frame.setAttribute('aria-hidden', 'true');
      frame.setAttribute('tabindex', '-1');
      frame.setAttribute('allowtransparency', 'true');
      frame.src = guideUrl(name);
      card.querySelector('.snp-figure').appendChild(frame);
      card.classList.add('no-figure');   // until the guide says it found the exercise
    } else if (frameReady) {
      try { frame.contentWindow.postMessage({ type: 'pulse-figure-show', name: name }, location.origin); } catch (_) {}
    } else {
      frame.src = guideUrl(name);
    }
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== location.origin || !event.data || event.data.type !== 'pulse-figure') return;
    if (!frame || event.source !== frame.contentWindow) return;
    frameReady = true;
    known[key(event.data.name)] = !!event.data.found;
    if (card && String(event.data.name) === frameName) card.classList.toggle('no-figure', !event.data.found);
  });
  var known = {};   // exercise name (lower case) -> found in the explorer
  function key(name) { return String(name || '').trim().toLocaleLowerCase('sv'); }

  function subtitle(up) {
    if (up.kind === 'between') return 'Mellanövning · ' + up.seconds + ' s';
    if (up.kind === 'rest') return up.seconds + ' s vila, sedan ' + up.exercise;
    if (up.kind === 'set') return 'Set ' + up.setNo + ' av ' + up.sets;
    return 'Efter detta set';
  }

  /* What the card shows next: the upcoming between exercise / rest / exercise, or, while
     sets remain, the next set of the same exercise. Null when the pass ends. */
  function nextUp(state) {
    var up = window.__sessionUpcomingV1(state);
    if (up && up.kind === 'exercise' && up.afterSets && up.setNo) return { kind: 'set', name: up.name, setNo: up.setNo, sets: up.sets };
    var ex = state.exercises[Math.max(0, Number(state.exerciseIndex) || 0)];
    var setNo = Number(state.currentSet) || 1, sets = Number(ex && ex.plannedSets) || 1;
    // Between exercises (Hopprep …) are left out of the card: it names what comes after them,
    // the next set of this exercise or the next exercise.
    if (up && up.kind === 'between') {
      if (ex && !ex.__betweenCustomV3 && setNo < sets) return { kind: 'set', name: String(ex.name || '').trim(), setNo: setNo + 1, sets: sets };
      var after = state.exercises[Math.max(0, Number(state.exerciseIndex) || 0) + 1];
      return after ? { kind: 'exercise', name: String(after.name || '').trim(), seconds: 0, exercise: after.name } : null;
    }
    if (up && up.kind !== 'exercise') return up;
    if (ex && !ex.__betweenCustomV3 && setNo < sets) return { kind: 'set', name: String(ex.name || '').trim(), setNo: setNo + 1, sets: sets };
    return up;
  }

  /* Seconds the running set counts down from, or null when it counts up. */
  function countdownSeconds(ex) {
    if (!ex) return null;
    if (ex.__betweenCustomV3) return Math.max(1, Number(ex.time) * 60);
    if (ex.kind === 'cardio' && ex.timerMode !== 'up' && Number(ex.time) > 0) return Number(ex.time) * 60;
    return null;
  }
  function elapsedSeconds(state) {
    var end = state.__hypePaused && state.__hypePausedAt ? Number(state.__hypePausedAt) : Date.now();
    return Math.max(0, (end - Number(state.setStartedAt)) / 1000);
  }

  /* ── the current exercise's figure, by hand ─────────────── */
  var button = null, manualUntil = 0, manualName = '';
  function ensureButton(modal) {
    var main = modal.querySelector('.session-main');
    if (!main) return null;
    if (button && main.contains(button)) return button;
    button = document.createElement('button');
    button.type = 'button';
    button.id = 'session-figure-btn-v1';
    button.hidden = true;
    button.setAttribute('aria-label', 'Visa övningen');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="4.6" r="2"/><path d="M12 7.5v6.5M12 14l-3 6.5M12 14l3 6.5M7 10.5l5-2 5 2"/></svg>';
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      if (manualUntil) { closeManual(); return; }
      openManual();
    });
    main.appendChild(button);
    return button;
  }
  function currentName(state) {
    var ex = state && Array.isArray(state.exercises) ? state.exercises[Math.max(0, Number(state.exerciseIndex) || 0)] : null;
    return ex ? String(ex.name || '').trim() : '';
  }
  function openManual() {
    var name = currentName(getState());
    if (!name) return;
    manualName = name; manualUntil = Date.now() + MANUAL_MS;
    ensureCard();
    showFigure(name);
    card.classList.toggle('no-figure', known[key(name)] !== true);
    card.querySelector('.snp-kicker').textContent = 'Övningen';
    card.querySelector('.snp-name').textContent = name;
    card.querySelector('.snp-sub').textContent = 'Tryck för att stänga';
    lastKey = '';
    card.classList.add('show', 'is-manual');
    if (button) button.setAttribute('aria-pressed', 'true');
  }
  function closeManual() {
    manualUntil = 0; manualName = '';
    if (card) card.classList.remove('show', 'is-manual');
    if (button) button.setAttribute('aria-pressed', 'false');
  }
  function placeButton(modal, state) {
    if (!ensureButton(modal)) return;
    var name = currentName(state), nameEl = document.getElementById('session-current-ex');
    var show = !!(name && known[key(name)] === true && nameEl && nameEl.offsetParent);
    button.hidden = !show;
    modal.classList.toggle('snp-has-figure', show);
    if (show) button.style.top = (nameEl.offsetTop + Math.max(0, (Math.min(nameEl.offsetHeight, 44) - 38) / 2)) + 'px';
    // Ask the guide once whether it knows this exercise (only while the card is not showing).
    if (name && known[key(name)] === undefined && !(card && card.classList.contains('show'))) showFigure(name);
  }

  function blocked(modal) {
    if (!modal || !modal.classList.contains('show') || modal.classList.contains('session-overview-mode')) return true;
    var pre = document.getElementById('session-pre-timer');
    if (pre && pre.classList.contains('show')) return true;
    var rest = document.getElementById('session-between-overlay-v2');
    if (rest && (rest.classList.contains('show') || rest.classList.contains('active'))) return true;
    var done = document.getElementById('session-complete-box');
    return !!(done && done.classList.contains('show'));
  }

  var lastKey = '';
  function tick() {
    var modal = document.getElementById('session-modal');
    if (!modal) return;
    installStyle();
    ensureTitle();
    var state = getState();
    syncPlanLine(state);
    var open = !!(state && Array.isArray(state.exercises) && state.exercises.length) && !blocked(modal);
    if (open) placeButton(modal, state); else if (button) button.hidden = true;

    if (manualUntil) {
      if (open && Date.now() < manualUntil && currentName(state) === manualName) return;
      closeManual();
    }

    var running = !!(open && state.setRunning && state.setStartedAt);
    var up = running ? nextUp(state) : null;
    if (!up) { if (card) card.classList.remove('show'); return; }

    var ex = state.exercises[Math.max(0, Number(state.exerciseIndex) || 0)];
    var limit = countdownSeconds(ex), elapsed = elapsedSeconds(state), preload, visible;
    if (limit != null) {
      var left = limit - elapsed;
      preload = left <= COUNTDOWN_PRELOAD_S;
      visible = left > 0 && left <= COUNTDOWN_SHOW_S;
    } else {
      preload = elapsed * 1000 >= PRELOAD_AFTER_MS;
      visible = elapsed * 1000 >= SHOW_AFTER_MS && elapsed * 1000 <= SHOW_AFTER_MS + VISIBLE_MS;
    }
    if (preload) showFigure(up.kind === 'rest' ? up.exercise : up.name);
    if (!visible) { if (card) card.classList.remove('show'); return; }

    ensureCard();
    var cardKey = up.kind + '|' + up.name + '|' + (up.setNo || up.seconds);
    if (cardKey !== lastKey) {
      lastKey = cardKey;
      card.querySelector('.snp-name').textContent = up.kind === 'rest' ? up.exercise : up.name;
      card.querySelector('.snp-sub').textContent = subtitle(up);
      card.querySelector('.snp-kicker').textContent = up.kind === 'between' ? 'Nästa · mellanövning' : up.kind === 'set' ? 'Nästa set' : 'Nästa';
    }
    card.classList.add('show');
  }

  setInterval(tick, 500);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
})();
