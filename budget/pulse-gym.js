/* The exercise explorer's body: the muscle map (pulse-muscle-map.js) is the
   way in. Tapping a muscle zooms into it and opens the exercise scene for that
   muscle (PulseGymScene in pulse-gym-scene.js), its artwork growing out of the
   tapped muscle; the scene's back gesture returns to the body. The muscle
   map's own exercise links open the same scene. */
(function () {
  'use strict';

  var ART = { 'Bröst': 'chest', 'Axlar': 'shoulders', 'Rygg': 'back', 'Biceps': 'biceps', 'Triceps': 'triceps', 'Mage': 'abs', 'Framsida lår': 'quads', 'Säte': 'glutes', 'Baksida lår': 'hamstrings', 'Vader': 'calves' };
  var $ = function (id) { return document.getElementById(id); };

  function init() {
    var ui = window.PulseGuideUI, scene = window.PulseGymScene, map = $('muscle-map-page');
    if (!ui || !scene || !map) return;
    var dock = $('living-dock');
    function showBody() { dock.querySelector('[data-page="muscle-map"]').click(); }
    if (map.hidden) showBody();

    var exit = document.createElement('a');
    exit.className = 'gm-exit'; exit.href = $('explore-back').getAttribute('href'); exit.setAttribute('aria-label', 'Till träningen');
    exit.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    map.appendChild(exit);

    var figure = map.querySelector('.muscle-map-figure');
    // Where each artwork centres its muscle (the same origins the explorer uses).
    var focus = {};
    fetch('assets/atlas-art-v1/manifest.json').then(function (r) { return r.json(); }).then(function (m) {
      Object.keys(m.groups || {}).forEach(function (k) { focus[k] = m.groups[k].origin; });
    }).catch(function () {});
    var from = null;
    function open(name, id, withList) {
      // The page's own route opens the exercise view, which drives the figure.
      openExercise(name, id);
      document.documentElement.classList.add('gm-scene-open');
      scene.enter(name, id, ART[name] ? { src: 'assets/atlas-art-v1/' + ART[name] + '.webp', focus: focus[name], from: from } : null, withList);
      from = null;
      setTimeout(function () { figure.classList.remove('gm-zooming'); figure.style.transformOrigin = ''; }, 500);
    }
    var openExercise = ui.openMuscleExercise;
    ui.openMuscleExercise = function (name, id) { open(name, id == null ? null : id); };
    ui.browseMuscle = function (name) { open(name, null, true); };

    /* Tapping a muscle on the body zooms into it before the scene opens. */
    map.addEventListener('click', function (event) {
      var region = event.target.closest('[data-map-muscle]');
      if (!region || scene.isOpen()) return;
      var box = region.getBBox(), shift = region.transform.baseVal.consolidate(), dx = shift ? shift.matrix.e : 0;
      figure.style.transformOrigin = ((box.x + dx + box.width / 2) / 724 * 100) + '% ' + ((box.y + box.height / 2) / 1086 * 100) + '%';
      figure.classList.add('gm-zooming');
      var name = region.dataset.mapMuscle;
      // Where the muscle will be on screen at the hand-off, partway into the zoom.
      var r = region.getBoundingClientRect(), grow = 2.2;
      from = { left: r.left + r.width / 2 - r.width * grow / 2, top: r.top + r.height / 2 - r.height * grow / 2, width: r.width * grow, height: r.height * grow };
      if (ART[name]) new Image().src = 'assets/atlas-art-v1/' + ART[name] + '.webp';
      // Hand off once the body has faded out, so the page switch behind it never shows.
      var done = false, handoff = function (event) {
        if (done || (event && event.propertyName !== 'opacity')) return;
        done = true; figure.removeEventListener('transitionend', handoff); ui.openMuscleExercise(name);
      };
      figure.addEventListener('transitionend', handoff);
      setTimeout(handoff, 600);
    });
    // Exercises and programmes opened from the browse list return to it (same tab, plan and scroll).
    var returnToFind = null;
    scene.onLeave(function () {
      document.documentElement.classList.remove('gm-scene-open'); showBody();
      if (returnToFind) { var back = returnToFind; returnToFind = null; reopenFind(back.scroll); }
    });

    /* Search every exercise: name, muscle, equipment or category ("bröst", "kabel", "pull"). */
    var findBtn = document.createElement('button');
    findBtn.type = 'button'; findBtn.className = 'gm-find-btn'; findBtn.setAttribute('aria-label', 'Bläddra bland alla övningar och program');
    findBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2L20 20"/><path class="gm-find-spark" d="M10.5 7.4c.25 1.9.9 2.6 2.8 2.8-1.9.25-2.6.9-2.8 2.8-.25-1.9-.9-2.6-2.8-2.8 1.9-.25 2.6-.9 2.8-2.8z"/></svg>';
    map.appendChild(findBtn);
    var find = document.createElement('div');
    find.className = 'gm-find'; find.hidden = true; find.setAttribute('role', 'dialog'); find.setAttribute('aria-modal', 'true'); find.setAttribute('aria-label', 'Bläddra bland övningar och program');
    find.innerHTML = '<div class="gm-find-head"><button type="button" class="gm-find-close" aria-label="Stäng"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<span class="eyebrow">Utforska</span><h2>Alla övningar</h2>' +
      '<div class="gm-find-tabs" role="tablist"><button type="button" role="tab" data-find-mode="ex" aria-selected="true">Övningar</button><button type="button" role="tab" data-find-mode="prog" aria-selected="false">Program</button><button type="button" role="tab" data-find-mode="plan" aria-selected="false">Planer</button></div>' +
      '<label class="gm-find-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2L20 20"/></svg><input type="search" placeholder="Övning, muskel eller redskap" autocomplete="off" enterkeyhint="search" aria-label="Sök"></label>' +
      '<div class="gm-find-chips" role="group" aria-label="Filtrera"></div>' +
      '<p class="gm-find-count" aria-live="polite"></p></div><div class="gm-find-list" role="list"></div>';
    document.body.appendChild(find);
    var field = find.querySelector('input'), list = find.querySelector('.gm-find-list'), count = find.querySelector('.gm-find-count'), chips = find.querySelector('.gm-find-chips');
    var MUSCLES = ['Alla', 'Bröst', 'Axlar', 'Rygg', 'Biceps', 'Triceps', 'Mage', 'Framsida lår', 'Säte', 'Baksida lår', 'Vader', 'Kondition'];
    var browse = { mode: 'ex', muscle: 'Alla', group: 'Alla', planGroup: 'Alla', plan: null };
    var low = function (t) { return String(t || '').toLocaleLowerCase('sv-SE'); };
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    function matches(e, q) {
      if (!q) return true;
      if (low(e.name).indexOf(q) >= 0) return true;
      return e.muscles.concat([e.equipment, e.group]).some(function (w) { return low(w).split(/[\s,·]+/).some(function (part) { return part.indexOf(q) === 0; }) || low(w).indexOf(q) === 0; });
    }
    function renderChips() {
      var source = browse.mode === 'plan' ? (window.PulsePlans ? window.PulsePlans.plans : []) : window.PulseExplore.programs;
      var values = browse.mode === 'ex' ? MUSCLES : ['Alla'].concat(source.map(function (p) { return p.group; }).filter(function (g, i, a) { return a.indexOf(g) === i; }));
      var current = browse.mode === 'ex' ? browse.muscle : browse.mode === 'plan' ? browse.planGroup : browse.group;
      chips.hidden = browse.mode === 'plan' && !!browse.plan;
      field.closest('.gm-find-field').hidden = browse.mode === 'plan' && !!browse.plan;
      chips.innerHTML = values.map(function (v) { return '<button type="button" data-find-chip="' + esc(v) + '" aria-pressed="' + (v === current) + '">' + esc(v) + '</button>'; }).join('');
      find.querySelectorAll('[data-find-mode]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.findMode === browse.mode)); });
      field.placeholder = browse.mode === 'ex' ? 'Övning, muskel eller redskap' : browse.mode === 'plan' ? 'Plan, övning eller redskap' : 'Program eller övning';
    }
    function exerciseRows(q) {
      var X = window.PulseExplore, m = browse.muscle;
      var all = X.exercises.filter(function (e) { return m === 'Alla' || (m === 'Kondition' ? e.group === 'Kondition' : e.muscles.indexOf(m) >= 0); })
        .filter(function (e) { return matches(e, q); })
        // With a muscle chosen: exercises where it is the main muscle first.
        .sort(function (a, b) { return (m !== 'Alla' && m !== 'Kondition' ? a.muscles.indexOf(m) - b.muscles.indexOf(m) : 0) || a.name.localeCompare(b.name, 'sv'); });
      count.textContent = all.length + (all.length === 1 ? ' övning' : ' övningar');
      var lastLead = null;
      return all.map(function (e) {
        var name = esc(e.name), at = q ? low(e.name).indexOf(q) : -1;
        if (at >= 0) name = esc(e.name.slice(0, at)) + '<mark>' + esc(e.name.slice(at, at + q.length)) + '</mark>' + esc(e.name.slice(at + q.length));
        var head = '';
        if (m !== 'Alla' && m !== 'Kondition') {
          var lead = e.muscles[0] === m;
          if (lead !== lastLead) head = '<p class="gm-find-section">' + (lead ? 'Tränar främst ' + esc(m.toLowerCase()) : 'Tränar även ' + esc(m.toLowerCase())) + '</p>';
          lastLead = lead;
        }
        var art = ART[e.muscles[0]];
        return head + '<button type="button" class="gm-find-row" role="listitem" data-find-id="' + e.id + '"><span class="pk-thumb' + (e.group === 'Kondition' ? ' is-cardio' : '') + '">' + (art ? '<img alt="" loading="lazy" src="assets/atlas-art-v1/' + art + '.webp">' : '') + '</span>' +
          '<span class="gm-find-copy"><b>' + name + '</b><small>' + esc(e.muscles.slice(0, 3).join(' · ')) + ' · ' + esc(e.equipment) + '</small></span></button>';
      }).join('') || '<p class="gm-find-empty">Ingen övning matchar. Prova en annan muskel eller ett redskap, som <b>skivstång</b>.</p>';
    }
    function programRows(q) {
      var X = window.PulseExplore;
      var hits = X.programs.filter(function (p) { return browse.group === 'Alla' || p.group === browse.group; }).filter(function (p) {
        return !q || [p.name, p.group, p.equipment, p.tag].concat(p.ids.map(function (id) { return X.exercises[id].name; })).some(function (t) { return low(t).indexOf(q) >= 0; });
      });
      count.textContent = hits.length + (hits.length === 1 ? ' program' : ' program');
      var lastGroup = null;
      return hits.map(function (p) {
        var head = browse.group === 'Alla' && p.group !== lastGroup ? '<p class="gm-find-section">' + esc(p.group) + '</p>' : '';
        lastGroup = p.group;
        return head + '<button type="button" class="gm-find-row" role="listitem" data-find-program="' + esc(p.id) + '"><span class="pk-thumb is-pose"><img alt="" loading="lazy" src="assets/exercise-poses-v2/' + String(p.ids[0]).padStart(2, '0') + '-end.webp"></span>' +
          '<span class="gm-find-copy"><b>' + esc(p.name) + '</b><small>' + p.ids.length + ' övningar · ' + esc(X.durationLabel(p)) + ' · ' + esc(p.equipment) + '</small></span></button>';
      }).join('') || '<p class="gm-find-empty">Inget program matchar.</p>';
    }
    function planRows(q) {
      var P = window.PulsePlans, X = window.PulseExplore;
      if (!P) return '';
      var hits = P.plans.filter(function (p) { return browse.planGroup === 'Alla' || p.group === browse.planGroup; }).filter(function (p) {
        if (!q) return true;
        var names = []; Object.keys(p.sessions).forEach(function (k) { P.sessionIds(p, k).forEach(function (id) { names.push(X.exercises[id].name); }); });
        return [p.name, p.group, p.equipment, p.level].concat(names).some(function (t) { return low(t).indexOf(q) >= 0; });
      });
      count.textContent = hits.length + (hits.length === 1 ? ' plan' : ' planer') + ' · fyra veckor';
      return hits.map(function (p) {
        var lead = P.sessionIds(p, Object.keys(p.sessions)[0])[0];
        return '<button type="button" class="gm-find-row" role="listitem" data-find-plan="' + esc(p.id) + '"><span class="pk-thumb is-pose">' + (lead != null ? '<img alt="" loading="lazy" src="assets/exercise-poses-v2/' + String(lead).padStart(2, '0') + '-end.webp">' : '') + '</span>' +
          '<span class="gm-find-copy"><b>' + esc(p.name) + '</b><small>' + p.perWeek + ' pass i veckan · ' + esc(p.level) + ' · ' + (p.own ? 'Egen plan' : esc(p.source.label)) + '</small></span></button>';
      }).join('') || '<p class="gm-find-empty">Ingen plan matchar.</p>';
    }
    function planDetail(p) {
      var P = window.PulsePlans, X = window.PulseExplore;
      count.textContent = '';
      var keys = Object.keys(p.sessions);
      var grid = '<div class="gm-plan-grid" role="table" aria-label="Fyra veckor"><span></span>' + P.DAY_NAMES.map(function (d) { return '<b>' + d + '</b>'; }).join('') +
        p.pattern.map(function (week, w) {
          return '<span class="gm-plan-week">V' + (w + 1) + '</span>' + week.map(function (key, d) {
            return key ? '<i class="is-on" data-k="' + keys.indexOf(key) % 6 + '" title="' + esc(p.sessions[key].name) + '">' + esc(key.length > 2 ? key.slice(0, 2) : key) + '</i>' : '<i></i>';
          }).join('');
        }).join('') + '</div>';
      var notes = p.weekNotes ? '<ol class="gm-plan-notes">' + p.weekNotes.map(function (n, i) { return '<li><b>Vecka ' + (i + 1) + '</b> ' + esc(n) + '</li>'; }).join('') + '</ol>' : '';
      var sessions = keys.map(function (k, i) {
        var s = p.sessions[k], first = P.session(p, k, 0);
        return '<section class="gm-plan-session" data-k="' + i % 6 + '"><h4><span>' + esc(k) + '</span>' + esc(s.name) + '</h4><ul>' +
          P.items(s).map(function (it, j) {
            var ex = first.exercises[j];
            if (!Array.isArray(it)) return '<li><span>' + esc(it.name) + '</span><em>' + ex.distance + ' km · ' + ex.time + ' min</em></li>';
            var e = X.exercises[it[0]];
            return '<li><button type="button" data-find-id="' + e.id + '">' + esc(e.name) + '</button><em>' + ex.sets + '×' + ex.reps + (e.id === 32 ? ' s' : '') + '</em></li>';
          }).join('') + '</ul></section>';
      }).join('');
      var user = new URLSearchParams(location.search).get('user');
      var href = 'exercise.html?tool=week&plan=' + encodeURIComponent(p.id) + (user ? '&user=' + encodeURIComponent(user) : '');
      return '<div class="gm-plan"><button type="button" class="gm-plan-back" data-plan-back>‹ Alla planer</button>' +
        '<h3>' + esc(p.name) + '</h3><p class="gm-plan-meta">' + p.perWeek + ' pass i veckan · ' + esc(p.level) + ' · ' + esc(p.equipment) + '</p>' +
        '<p class="gm-plan-summary">' + esc(p.summary) + '</p>' + grid +
        '<p class="gm-plan-how">' + esc(p.how) + '</p>' + notes + sessions +
        (p.own ? '<p class="gm-plan-source">Egen plan, byggd av utforskarens övningar.</p>' : '<p class="gm-plan-source">Inspirerad av <a href="' + esc(p.source.url) + '" target="_blank" rel="noopener">' + esc(p.source.label) + '</a>. Upplägget är förenklat till våra övningar.</p>') +
        '<a class="gm-plan-apply" href="' + href + '">Lägg in i träningsplanen</a><p class="gm-plan-apply-note">Fyra veckor läggs in från veckan du väljer. Inget sparas förrän du trycker Spara plan.</p></div>';
    }
    function renderFind() {
      var q = low(field.value).trim();
      if (browse.mode === 'plan' && browse.plan) { list.innerHTML = planDetail(browse.plan); return; }
      list.innerHTML = browse.mode === 'ex' ? exerciseRows(q) : browse.mode === 'plan' ? planRows(q) : programRows(q);
    }
    // Grows out of the magnifier and shrinks back into it (pulse-motion.js), like the training tools.
    var motion = window.PulseMotion;
    function openFind() {
      field.value = ''; renderChips(); renderFind(); find.hidden = false; find.classList.add('is-open');
      if (motion) motion.reveal(find, findBtn); else find.style.opacity = 1;
    }
    function reopenFind(scroll) {
      renderChips(); renderFind(); find.hidden = false; find.classList.add('is-open'); find.style.opacity = 1;
      list.scrollTop = scroll || 0;
    }
    function closeFind(quiet) {
      if (find.hidden) return;
      var done = function () { find.hidden = true; find.classList.remove('is-open'); find.style.clipPath = ''; find.style.opacity = ''; };
      if (motion && !quiet) motion.conceal(find, findBtn).then(done); else done();
    }
    findBtn.addEventListener('click', openFind);
    field.addEventListener('input', renderFind);
    find.addEventListener('click', function (event) {
      if (event.target.closest('.gm-find-close')) {
        // Inside a plan the cross steps back to the plan list instead of leaving the explorer.
        if (browse.mode === 'plan' && browse.plan) { browse.plan = null; renderChips(); renderFind(); list.scrollTop = 0; return; }
        closeFind(); return;
      }
      var mode = event.target.closest('[data-find-mode]');
      if (mode) { browse.mode = mode.dataset.findMode; browse.plan = null; renderChips(); renderFind(); list.scrollTop = 0; return; }
      var planRow = event.target.closest('[data-find-plan]');
      if (planRow && window.PulsePlans) { browse.plan = window.PulsePlans.find(planRow.dataset.findPlan); renderChips(); renderFind(); list.scrollTop = 0; return; }
      if (event.target.closest('[data-plan-back]')) { browse.plan = null; renderChips(); renderFind(); list.scrollTop = 0; return; }
      var chip = event.target.closest('[data-find-chip]');
      if (chip) { if (browse.mode === 'ex') browse.muscle = chip.dataset.findChip; else if (browse.mode === 'plan') browse.planGroup = chip.dataset.findChip; else browse.group = chip.dataset.findChip; renderChips(); renderFind(); list.scrollTop = 0; return; }
      var prog = event.target.closest('[data-find-program]');
      if (prog) {
        var X = window.PulseExplore, p = X.programs.find(function (x) { return x.id === prog.dataset.findProgram; });
        if (!p) return;
        returnToFind = { scroll: list.scrollTop };
        closeFind(true); ui.openMuscleExercise(X.exercises[p.ids[0]].muscles[0], p.ids[0]);
        setTimeout(function () { if (scene.openProgram) scene.openProgram(p.id); }, 650);
        return;
      }
      var row = event.target.closest('[data-find-id]');
      if (row) {
        var e = window.PulseExplore.exercises[Number(row.dataset.findId)], m = browse.muscle;
        returnToFind = { scroll: list.scrollTop };
        closeFind(true); ui.openMuscleExercise(m !== 'Alla' && m !== 'Kondition' && e.muscles.indexOf(m) >= 0 ? m : e.muscles[0], e.id);
      }
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !find.hidden) closeFind(); });
    window.PulseExploreSearch = { open: openFind, close: closeFind };
    // Opened again from the training page: start on the body, without reloading anything.
    window.PulseGymReset = function () {
      returnToFind = null; closeFind(true);
      if (scene.isOpen()) { scene.leave(true); document.documentElement.classList.remove('gm-scene-open'); }
      figure.classList.remove('gm-zooming'); figure.style.transformOrigin = '';
      showBody(); window.scrollTo(0, 0);
    };
    // Browser back from the exercise view returns to the body as well.
    new MutationObserver(function () { if ($('guide-page').hidden && scene.isOpen()) { scene.leave(true); document.documentElement.classList.remove('gm-scene-open'); } })
      .observe($('guide-page'), { attributes: true, attributeFilter: ['hidden'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
