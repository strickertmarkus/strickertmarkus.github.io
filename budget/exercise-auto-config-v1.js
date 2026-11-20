/*
 * Automatic mode settings per pass, and the "Automatläge" block in the pass builder.
 * window.ExAutoConfig:
 *   get(date) -> { on, seconds, exerciseRest, betweenRest }
 *   set(date, cfg)
 * - seconds:      time per set (10–600 s, default 60)
 * - exerciseRest: rest between two exercises in automatic mode (0 = none, default 0)
 * - betweenRest:  rest after a between exercise that is not a rest (Hopprep …), default 20
 * A pass keeps its own settings: `autoMode` on the planned session (synced with the plan) and a
 * local copy per date (`ex_auto_cfg_v1_<user>_<date>`), since saving the builder rebuilds the plan.
 * A date without its own settings uses the last ones chosen (`ex_auto_mode_v1_<user>`).
 * The builder block sits with the pass settings (shown when the builder's settings are open), like
 * the 5 s start timer. The session (exercise-auto-mode-v1.js) reads and writes the same settings.
 */
(function () {
  'use strict';
  if (window.ExAutoConfig) return;

  var profile = (new URLSearchParams(location.search).get('user') || 'markus').toLowerCase();
  var GLOBAL_KEY = 'ex_auto_mode_v1_' + profile;
  var DATE_PREFIX = 'ex_auto_cfg_v1_' + profile + '_';

  function clampInt(v, lo, hi, fallback) {
    var n = Math.round(Number(v));
    return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
  }
  function normal(d) {
    d = d && typeof d === 'object' ? d : {};
    return {
      on: !!d.on,
      seconds: clampInt(d.seconds, 10, 600, 60),
      exerciseRest: clampInt(d.exerciseRest, 0, 600, 0),
      betweenRest: clampInt(d.betweenRest, 0, 600, 20)
    };
  }
  function readJson(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function plans() { try { return typeof window.getPlannedSessions === 'function' ? window.getPlannedSessions() || {} : {}; } catch (_) { return {}; } }

  function get(date) {
    if (date) {
      var plan = plans()[date];
      if (plan && plan.autoMode && typeof plan.autoMode === 'object') return normal(plan.autoMode);
      var local = readJson(DATE_PREFIX + date);
      if (local) return normal(local);
    }
    return normal(readJson(GLOBAL_KEY));
  }
  function set(date, cfg) {
    cfg = normal(cfg);
    try { localStorage.setItem(GLOBAL_KEY, JSON.stringify(cfg)); } catch (_) {}
    if (!date) return cfg;
    try { localStorage.setItem(DATE_PREFIX + date, JSON.stringify(cfg)); } catch (_) {}
    var all = plans();
    if (all[date] && typeof window.savePlannedSessions === 'function') {
      all[date].autoMode = cfg;
      try { window.savePlannedSessions(all); } catch (_) {}
    }
    window.dispatchEvent(new CustomEvent('ex-auto-config', { detail: { date: date, cfg: cfg } }));
    return cfg;
  }
  window.ExAutoConfig = { get: get, set: set };

  /* ── builder block ── */
  function fmt(s) { return !s ? 'Av' : s >= 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : s + ' s'; }
  function builderDate() {
    var modal = document.getElementById('day-workout-modal'), input = document.getElementById('day-workout-date');
    return (modal && modal.dataset.date) || (input && input.value) || '';
  }
  var ROWS = [
    { key: 'seconds', label: 'Tid per set', step: 5, min: 10 },
    { key: 'exerciseRest', label: 'Vila mellan övningar', step: 10, min: 0 },
    { key: 'betweenRest', label: 'Vila efter mellanövning', step: 5, min: 0 }
  ];
  function addStyle() {
    if (document.getElementById('exercise-auto-config-v1-style')) return;
    var st = document.createElement('style');
    st.id = 'exercise-auto-config-v1-style';
    st.textContent = '' +
      '#auto-builder-v1{margin:9px 0 0;padding:10px 12px;border:1px solid rgba(var(--flow-accent-rgb,253,186,116),.22);border-radius:10px;background:rgba(var(--flow-accent-rgb,253,186,116),.04)}' +
      '#auto-builder-v1 .ab-head{display:flex;align-items:center;justify-content:space-between;gap:12px}' +
      '#auto-builder-v1 .ab-head strong{display:block;color:var(--flow-accent-pale,#FED7AA);font-size:11px}' +
      '#auto-builder-v1 .ab-head span{display:block;margin-top:2px;color:#8B949E;font-size:9px}' +
      '#auto-builder-v1 .ab-switch{appearance:none;position:relative;flex:0 0 auto;width:46px;height:26px;padding:3px;border-radius:999px;cursor:pointer;border:1px solid rgba(var(--flow-accent-rgb,253,186,116),.25);background:rgba(var(--flow-accent-rgb,253,186,116),.07)}' +
      '#auto-builder-v1 .ab-switch::after{content:"";display:block;width:18px;height:18px;border-radius:50%;background:#64748B;transition:transform .18s ease,background .18s ease}' +
      '#auto-builder-v1 .ab-switch[aria-pressed="true"]{background:rgba(var(--flow-accent-rgb,253,186,116),.17);border-color:rgba(var(--flow-accent-rgb,253,186,116),.68);box-shadow:0 0 12px rgba(var(--flow-accent-rgb,253,186,116),.34)}' +
      '#auto-builder-v1 .ab-switch[aria-pressed="true"]::after{transform:translateX(20px);background:var(--flow-accent,#FDBA74)}' +
      '#auto-builder-v1 .ab-rows{margin-top:8px;border-top:1px solid rgba(255,255,255,.06)}' +
      '#auto-builder-v1 .ab-rows[hidden]{display:none}' +
      '#auto-builder-v1 .ab-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.045)}' +
      '#auto-builder-v1 .ab-row:last-child{border-bottom:0}' +
      '#auto-builder-v1 .ab-row>span{color:#c8d0da;font-size:11px}' +
      '#auto-builder-v1 .ab-step{display:flex;align-items:center;gap:6px}' +
      '#auto-builder-v1 .ab-step b{min-width:44px;text-align:center;color:var(--flow-accent-soft,#FDBA74);font:750 13px/1 Inter,sans-serif;font-variant-numeric:tabular-nums}' +
      '#auto-builder-v1 .ab-step button{appearance:none;width:28px;height:28px;border-radius:50%;cursor:pointer;padding:0;border:1px solid rgba(var(--flow-accent-rgb,253,186,116),.3);background:rgba(var(--flow-accent-rgb,253,186,116),.07);color:var(--flow-accent-pale,#FED7AA);font:500 16px/1 Inter,sans-serif}' +
      /* Field builder: with the other pass settings, folded until the settings are opened. */
      'html.pbu-v1[data-field-embedded] body #day-workout-modal.pbu-builder #auto-builder-v1{order:6}' +
      'html.pbu-v1[data-field-embedded] body #day-workout-modal.pbu-builder:not(.pbu-settings-open) #auto-builder-v1{display:none!important}' +
      'html.pbu-v1[data-field-embedded] body #day-workout-modal.pbu-builder.pbu-settings-open #auto-builder-v1{margin:0 0 14px!important}';
    document.head.appendChild(st);
  }
  function paint(panel) {
    var cfg = get(builderDate());
    panel.querySelector('.ab-switch').setAttribute('aria-pressed', String(cfg.on));
    panel.querySelector('.ab-rows').hidden = !cfg.on;
    ROWS.forEach(function (r) { panel.querySelector('[data-val="' + r.key + '"]').textContent = fmt(cfg[r.key]); });
    panel.dataset.date = builderDate();
  }
  function ensurePanel() {
    var modal = document.getElementById('day-workout-modal');
    var list = document.getElementById('day-workout-ex-list');
    if (!modal || !modal.classList.contains('show') || !list || !list.parentElement) return;
    var panel = document.getElementById('auto-builder-v1');
    if (!panel) {
      addStyle();
      panel = document.createElement('div');
      panel.id = 'auto-builder-v1';
      panel.innerHTML = '<div class="ab-head"><div><strong>Automatläge</strong><span>Varje set går vidare av sig självt</span></div>' +
        '<button type="button" class="ab-switch" aria-label="Automatläge"></button></div>' +
        '<div class="ab-rows">' + ROWS.map(function (r) {
          return '<div class="ab-row"><span>' + r.label + '</span><span class="ab-step"><button type="button" data-k="' + r.key + '" data-d="-1" aria-label="' + r.label + ' kortare">−</button>' +
            '<b data-val="' + r.key + '"></b><button type="button" data-k="' + r.key + '" data-d="1" aria-label="' + r.label + ' längre">+</button></span></div>';
        }).join('') + '</div>';
      panel.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        var date = builderDate(), cfg = get(date);
        if (b.classList.contains('ab-switch')) cfg.on = !cfg.on;
        else {
          var row = ROWS.filter(function (r) { return r.key === b.dataset.k; })[0];
          cfg[row.key] = Math.max(row.min, cfg[row.key] + Number(b.dataset.d) * row.step);
        }
        set(date, cfg);
        paint(panel);
      });
    }
    // Right after the 5 s start timer (or the between-exercise editor), wherever that sits.
    var anchor = document.getElementById('pretimer-builder-v2') || document.getElementById('between-exercise-global-editor-v7');
    if (anchor && anchor.parentNode && anchor.nextElementSibling !== panel) anchor.insertAdjacentElement('afterend', panel);
    else if (!panel.parentNode) list.parentElement.appendChild(panel);
    if (panel.dataset.date !== builderDate()) paint(panel);
  }
  function watch() {
    var modal = document.getElementById('day-workout-modal');
    if (!modal) return;
    new MutationObserver(ensurePanel).observe(modal, { attributes: true, attributeFilter: ['class', 'data-date'] });
    var date = document.getElementById('day-workout-date');
    if (date) date.addEventListener('change', ensurePanel);
    ensurePanel();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
