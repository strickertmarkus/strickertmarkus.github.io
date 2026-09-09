/* Calm moments use the same session state, timer controller and saved workouts as Pulse Flow. */
(function () {
  'use strict';
  if (!/\/exercise\.html$/i.test(location.pathname)) return;
  var lastKey = '', focus = null, syncing = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function state() { return window.sessionState || null; }
  function current(s) { return s && s.exercises && s.exercises[s.exerciseIndex]; }
  function text(id, value) {
    var node = document.getElementById(id);
    if (node && node.textContent !== value) node.textContent = value;
  }
  function attr(node, key, value) {
    if (node && node.getAttribute(key) !== value) node.setAttribute(key, value);
  }
  function isCalm(ex) { return ex && (ex.kind === 'stretch' || ex.kind === 'meditation'); }
  function secondsLabel(seconds) {
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
  }
  function ensureScene() {
    var modal = document.getElementById('session-modal');
    var main = modal && modal.querySelector('.session-main');
    if (!main) return;
    if (!focus) {
      focus = document.createElement('section');
      focus.id = 'calm-focus';
      focus.setAttribute('aria-label', 'Lugnt moment');
      focus.innerHTML = '<div class="calm-focus-kicker" id="calm-focus-kind"></div>' +
        '<button type="button" class="calm-focus-timer" id="calm-focus-timer" aria-label="Starta moment">' +
          '<span class="calm-light" aria-hidden="true"></span><span class="calm-orbit" aria-hidden="true"></span>' +
          '<svg class="calm-progress" viewBox="0 0 240 240" aria-hidden="true"><circle class="calm-progress-track" cx="120" cy="120" r="108"/><circle id="calm-progress-value" cx="120" cy="120" r="108" pathLength="100"/></svg>' +
          '<span class="calm-focus-copy"><span id="calm-time">00:00</span><span id="calm-phase">Ta ett andetag</span></span>' +
        '</button>' +
        '<div class="calm-timer-hint" id="calm-timer-hint"></div>' +
        '<p id="calm-guidance"></p><div id="calm-breathing-note"></div>' +
        '<div class="calm-session-time">Hela passet <time id="calm-session-time">00:00</time></div>';
      var target = document.getElementById('session-current-target');
      target.insertAdjacentElement('afterend', focus);
      document.getElementById('calm-focus-timer').addEventListener('click', function () {
        var s = state();
        if (!s || !isCalm(current(s)) || document.querySelector('#session-pre-timer.show,#session-between-overlay-v2.show')) return;
        if (s.setRunning) {
          // Reuse the controller's pause accounting and keyboard behavior.
          var ring = document.getElementById('session-countdown-ring');
          if (ring) ring.click();
        } else if (!s.awaitingDecision) {
          window.startCurrentSet();
        }
        tick(Date.now());
      });
    }
    if (!modal.querySelector('.calm-atmosphere')) {
      var atmosphere = document.createElement('div');
      atmosphere.className = 'calm-atmosphere';
      atmosphere.setAttribute('aria-hidden', 'true');
      atmosphere.innerHTML = '<div class="calm-haze"></div><div class="calm-waves"><i></i><i></i><i></i></div>' +
        Array.from({length:12}, function (_, i) { return '<i class="calm-mote" style="--x:' + (8 + (i * 23) % 86) + '%;--y:' + (10 + (i * 17) % 78) + '%;--delay:-' + i * 1.4 + 's;--drift:' + (14 + i % 4 * 4) + 's"></i>'; }).join('');
      modal.querySelector('.session-shell').prepend(atmosphere);
    }
  }
  function sync() {
    if (syncing) return;
    syncing = true;
    try {
      var s = state(), ex = current(s), modal = document.getElementById('session-modal');
      if (!modal) return;
      var kind = isCalm(ex) && modal.classList.contains('show') ? ex.kind : '';
      attr(modal, 'data-calm-kind', kind);
      var rest = document.getElementById('session-between-overlay-v2');
      // The between-set surface may be mounted outside the session modal.
      attr(rest, 'data-calm-kind', rest && rest.dataset.betweenType === 'custom' ? '' : kind);
      attr(document.getElementById('session-pre-timer'), 'data-calm-kind', kind);
      if (!kind) { lastKey = ''; return; }
      ensureScene();
      if (!focus) return;
      var key = [s.passStartedAt, s.exerciseIndex, s.currentSet, kind, ex.guide, ex.breathing].join('|');
      if (lastKey !== key) {
        lastKey = key;
        text('calm-focus-kind', kind === 'stretch' ? 'STRETCH · RÖRLIGHET' : 'MEDITATION · STILLHET');
        text('calm-guidance', ex.guide || (kind === 'stretch' ? 'Hitta en bekväm position. Låt rörelsen ta sin tid.' : 'Låt tankarna komma och gå. Återvänd till andetaget.'));
        text('calm-breathing-note', kind === 'meditation' && ex.breathing !== 'off' ? 'Följ rytmen om den känns bekväm, eller andas i din egen takt.' : '');
        if (!reduced.matches && focus.animate) focus.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'});
      }
      modal.querySelectorAll('#session-controls button').forEach(function (button) {
        var action = button.getAttribute('onclick') || '';
        if (action.indexOf('completeCurrentSet') >= 0) textButton(button, 'Avsluta moment');
        // Keep the existing next/finish labels: the transition router uses them.
        if (action.indexOf('startCurrentSet') >= 0 && !modal.classList.contains('pulse-flow-intro-v116')) textButton(button, 'Starta moment');
      });
      tick(Date.now());
    } finally { syncing = false; }
  }
  function textButton(button, value) { if (button.textContent !== value) button.textContent = value; }
  function tick(now) {
    var s = state(), ex = current(s);
    if (!isCalm(ex) || !focus) return;
    var paused = !!s.__hypePaused;
    var end = paused && s.__hypePausedAt ? s.__hypePausedAt : now;
    var elapsed = s.setRunning && s.setStartedAt ? Math.max(0, (end - s.setStartedAt) / 1000) : 0;
    var total = Math.max(1, Number(ex.time) * 60 || 60);
    var remaining = s.awaitingDecision ? 0 : Math.max(0, total - elapsed);
    text('calm-time', secondsLabel(Math.ceil(remaining)));
    text('calm-session-time', secondsLabel(Math.max(0,(now-s.passStartedAt)/1000)));
    var breathing = ex.kind === 'meditation' && ex.breathing !== 'off';
    var phase = elapsed % 10;
    text('calm-phase', s.awaitingDecision ? 'Moment klart' : paused ? 'Pausad' : !s.setRunning ? 'Landa i stunden' : breathing ? (phase < 4 ? 'Andas in' : 'Andas ut') : ex.kind === 'stretch' ? 'Låt kroppen mjukna' : 'I din egen rytm');
    text('calm-timer-hint', s.awaitingDecision ? 'Fortsätt när du är redo' : s.setRunning ? (paused ? 'Tryck för att fortsätta' : 'Tryck för att pausa') : 'Tryck för att börja');
    var button = document.getElementById('calm-focus-timer');
    button.disabled = !!s.awaitingDecision;
    attr(button, 'aria-label', s.setRunning ? (paused ? 'Fortsätt moment' : 'Pausa moment') : 'Starta moment');
    attr(focus, 'data-paused', paused ? 'true' : 'false');
    var progress = document.getElementById('calm-progress-value');
    var ratio = Math.max(0,remaining / total);
    progress.style.strokeDasharray = (ratio * 100).toFixed(2) + ' 100';
    var expansion = breathing ? (phase < 4 ? (1-Math.cos(Math.PI*phase/4))/2 : (1+Math.cos(Math.PI*(phase-4)/6))/2) : (1-Math.cos(elapsed*Math.PI/6))/2;
    var scale = reduced.matches || !s.setRunning ? 1 : .86 + expansion * .18;
    focus.style.setProperty('--calm-breath-scale', scale.toFixed(4));
    if (s.setRunning && !paused && elapsed >= total && !s.__calmCompleting) {
      // Exactly one completion, including after the app returns from the background.
      s.__calmCompleting = true;
      s.__calmTimerEnd = s.setStartedAt + total * 1000;
      try { window.completeCurrentSet(); }
      finally { delete s.__calmTimerEnd; delete s.__calmCompleting; }
    }
  }
  function moveRow(button, direction) {
    var row = button.closest('.ex-row-item,.ex-row-wrap,.inline-ex-row');
    if (!row) return;
    var rows = Array.from(row.parentElement.children).filter(function (el) { return el.matches('.ex-row-item,.ex-row-wrap,.inline-ex-row'); });
    var other = rows[rows.indexOf(row) + direction];
    if (!other) return;
    if (direction < 0) other.before(row); else other.after(row);
    row.dispatchEvent(new Event('change', {bubbles:true}));
    button.focus({preventScroll:true});
    if (!reduced.matches && row.animate) row.animate([{opacity:.55,transform:'translateY('+(direction*8)+'px)'},{opacity:1,transform:'none'}],{duration:500,easing:'ease-out'});
  }
  function add(kind) {
    if (kind !== 'stretch' && kind !== 'meditation') return;
    var list = document.getElementById('day-workout-ex-list');
    if (!list) return;
    // Replace only untouched empty rows, keeping all existing exercises and their settings.
    list.querySelectorAll('.ex-row-item').forEach(function (row) {
      var name = row.querySelector('.dw-name');
      if (name && !name.value.trim() && !Array.from(row.querySelectorAll('input[type=number]')).some(function (input) { return input.value !== ''; })) row.remove();
    });
    window.addDayWorkoutExRow({kind:kind,name:kind==='stretch'?'Lugn stretch':'Stilla stund',time:kind==='stretch'?1:5});
    var row = list.lastElementChild;
    row.querySelector('.dw-name').focus({preventScroll:true});
    row.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest'});
    row.dispatchEvent(new Event('change',{bubbles:true}));
    var type = document.getElementById('day-workout-type');
    if (type && list.children.length === 1) type.value = kind==='stretch'?'Stretch':'Meditation';
  }
  function open(kind) {
    var date = window.todayISO();
    window.openDayWorkoutBuilder(window.dayLabelFromISO(date),date);
    add(kind);
  }
  function install() {
    var week = document.getElementById('week-grid');
    if (week && !document.getElementById('calm-home')) {
      var home = document.createElement('div');
      home.id = 'calm-home';
      home.innerHTML = '<button class="calm-home-stretch" type="button"><span class="calm-home-symbol" aria-hidden="true">✧</span><span><strong>Stretch</strong><small>Ge kroppen utrymme</small></span><span class="calm-home-add" aria-hidden="true">+</span></button>' +
        '<button class="calm-home-meditation" type="button"><span class="calm-home-symbol" aria-hidden="true">≈</span><span><strong>Meditation</strong><small>En stund för dig</small></span><span class="calm-home-add" aria-hidden="true">+</span></button>';
      week.insertAdjacentElement('afterend',home);
      home.children[0].addEventListener('click',function(){open('stretch');});
      home.children[1].addEventListener('click',function(){open('meditation');});
    }
    ensureScene();
    sync();
  }
  window.ExerciseCalm = {sync:sync,tick:tick,moveRow:moveRow,add:add};
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();
