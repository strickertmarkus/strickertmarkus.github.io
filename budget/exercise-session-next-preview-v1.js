/* Training session (archive/exercise.html, session mode) — three small additions:
 *
 * 1. window.__sessionUpcomingV1(state): what comes after the current set. A between-exercise
 *    such as "Hopprep" (custom betweenSets / betweenExercises) wins over the next exercise, so
 *    the "→ next" label next to the exercise name and the preview card agree. Used by
 *    exercise-hype-polish.js and exercise-session-theme-rest-v117.js.
 * 2. "Exercise Mode" title on the left of the top bar, and the bar moved down a little so the
 *    buttons clear the status bar / Dynamic Island.
 * 3. Like the stretch session: about 20 s into a set a small card slides up at the bottom with
 *    the next exercise and its animated 3D figure. The figure is pulse-exercise-guide.html in
 *    figure-only mode (?figure=<name>) inside a small iframe that is created on first use and
 *    then reused (the exercise is switched with postMessage).
 */
(function () {
  'use strict';
  if (window.__sessionNextPreviewV1 || /ingemar/i.test(location.pathname)) return;
  window.__sessionNextPreviewV1 = true;

  var SHOW_AFTER_MS = 20000;
  var PRELOAD_AFTER_MS = 6000;

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
    title.innerHTML = 'Exercise <span>Mode</span>';
    top.insertBefore(title, top.firstChild);
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
    if (card && String(event.data.name) === frameName) card.classList.toggle('no-figure', !event.data.found);
  });

  function subtitle(up) {
    if (up.kind === 'between') return 'Mellanövning · ' + up.seconds + ' s';
    if (up.kind === 'rest') return up.seconds + ' s vila, sedan ' + up.exercise;
    return up.afterSets ? 'Efter sista setet' : 'Efter detta set';
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
    var running = !!(state && state.setRunning && state.setStartedAt);
    var elapsed = running ? Date.now() - Number(state.setStartedAt) : 0;
    var up = running ? window.__sessionUpcomingV1(state) : null;

    if (!up || blocked(modal)) {
      if (card) card.classList.remove('show');
      return;
    }
    if (elapsed >= PRELOAD_AFTER_MS) showFigure(up.kind === 'rest' ? up.exercise : up.name);
    if (elapsed < SHOW_AFTER_MS) { if (card) card.classList.remove('show'); return; }

    ensureCard();
    var key = up.kind + '|' + up.name + '|' + up.seconds;
    if (key !== lastKey) {
      lastKey = key;
      card.querySelector('.snp-name').textContent = up.kind === 'rest' ? up.exercise : up.name;
      card.querySelector('.snp-sub').textContent = subtitle(up);
      card.querySelector('.snp-kicker').textContent = up.kind === 'between' ? 'Nästa · mellanövning' : 'Nästa';
    }
    card.classList.add('show');
  }

  setInterval(tick, 500);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
})();
