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
      '<div class="gm-find-tabs" role="tablist"><button type="button" role="tab" data-find-mode="ex" aria-selected="true">Övningar</button><button type="button" role="tab" data-find-mode="prog" aria-selected="false">Program</button><button type="button" role="tab" data-find-mode="plan" aria-selected="false">Planer</button><button type="button" role="tab" data-find-mode="pass" aria-selected="false">Mitt pass <em class="gm-pass-count"></em></button></div>' +
      '<label class="gm-find-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2L20 20"/></svg><input type="search" placeholder="Övning, muskel eller redskap" autocomplete="off" enterkeyhint="search" aria-label="Sök"></label>' +
      '<div class="gm-find-chips gm-find-gyms" role="group" aria-label="Ditt gym" hidden></div>' +
      '<div class="gm-find-chips gm-find-time" role="group" aria-label="Tid" hidden></div>' +
      '<div class="gm-find-chips" role="group" aria-label="Filtrera"></div>' +
      '<p class="gm-find-count" aria-live="polite"></p></div><div class="gm-find-list" role="list"></div>';
    document.body.appendChild(find);
    var field = find.querySelector('input'), list = find.querySelector('.gm-find-list'), count = find.querySelector('.gm-find-count'), chips = find.querySelector('.gm-find-chips:not(.gm-find-gyms):not(.gm-find-time)'), gymChips = find.querySelector('.gm-find-gyms'), timeChips = find.querySelector('.gm-find-time');
    var MUSCLES = ['Alla', 'Bröst', 'Axlar', 'Rygg', 'Biceps', 'Triceps', 'Mage', 'Framsida lår', 'Säte', 'Baksida lår', 'Vader', 'Kondition'];
    var browse = { mode: 'ex', muscle: 'Alla', group: 'Alla', planGroup: 'Alla', plan: null, gymEdit: null, time: '', forMuscle: '' };
    var TIMES = [['', 'Alla längder'], ['20', 'Upp till 20 min'], ['30', 'Upp till 30 min'], ['45', 'Upp till 45 min'], ['60', 'Upp till 60 min']];
    // The chosen gym also limits exercises: body-weight exercises always fit.
    function exerciseFits(e, gym) { return !gym || e.equipment === 'Kroppsvikt' || gym.equipment.indexOf(e.equipment) >= 0; }
    var EQUIP_LABEL = { Maskin: 'Maskiner', Kabel: 'Kabel', Hantlar: 'Hantlar', 'Skivstång': 'Skivstång', Konditionsmaskin: 'Konditionsmaskiner' };
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
      chips.hidden = browse.mode === 'pass' || (browse.mode === 'plan' && !!browse.plan);
      field.closest('.gm-find-field').hidden = browse.mode === 'pass' || (browse.mode === 'plan' && !!browse.plan);
      timeChips.hidden = browse.mode !== 'prog';
      timeChips.innerHTML = TIMES.map(function (t) { return '<button type="button" data-find-time="' + t[0] + '" aria-pressed="' + (browse.time === t[0]) + '">' + t[1] + '</button>'; }).join('');
      find.querySelector('.gm-pass-count').textContent = ui.selection().length || '';
      chips.innerHTML = values.map(function (v) { return '<button type="button" data-find-chip="' + esc(v) + '" aria-pressed="' + (v === current) + '">' + esc(v) + '</button>'; }).join('');
      find.querySelectorAll('[data-find-mode]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.findMode === browse.mode)); });
      // Gym profiles (PulseExplore.readGyms): "Alla förslag" or a gym whose equipment filters the programmes.
      var X = window.PulseExplore, gyms = X.readGyms ? X.readGyms() : { gyms: [], active: '' };
      gymChips.hidden = (browse.mode !== 'prog' && browse.mode !== 'ex') || !X.readGyms;
      gymChips.innerHTML = '<button type="button" data-find-gym="" aria-pressed="' + !gyms.active + '">Alla förslag</button>' +
        gyms.gyms.map(function (g) { return '<button type="button" data-find-gym="' + esc(g.id) + '" aria-pressed="' + (gyms.active === g.id) + '">' + esc(g.name) + '</button>'; }).join('') +
        (gyms.active ? '<button type="button" class="is-dashed" data-find-gym-edit="' + esc(gyms.active) + '">Ändra utrustning</button>' : '') +
        (gyms.gyms.length < 8 ? '<button type="button" class="is-dashed" data-find-gym-new="1">+ Nytt gym</button>' : '');
      field.placeholder = browse.mode === 'ex' ? 'Övning, muskel eller redskap' : browse.mode === 'plan' ? 'Plan, övning eller redskap' : 'Program eller övning';
    }
    /* One line that says what is filtered, with a way to clear it all. */
    function summary(n, noun) {
      var X = window.PulseExplore, gym = X.activeGym ? X.activeGym() : null, parts = [];
      if (gym) parts.push(gym.name);
      if (browse.mode === 'prog' && browse.time) parts.push('upp till ' + browse.time + ' min');
      if (browse.mode === 'prog' && browse.forMuscle) parts.push('tränar ' + browse.forMuscle.toLowerCase());
      count.innerHTML = esc(n + ' ' + noun) + (parts.length ? ' · ' + esc(parts.join(' · ')) + ' <button type="button" class="gm-find-clear" data-find-clear>Rensa</button>' : '');
    }
    function exerciseRows(q) {
      var X = window.PulseExplore, m = browse.muscle, gym = X.activeGym ? X.activeGym() : null;
      var all = X.exercises.filter(function (e) { return (m === 'Alla' || (m === 'Kondition' ? e.group === 'Kondition' : e.muscles.indexOf(m) >= 0)) && exerciseFits(e, gym); })
        .filter(function (e) { return matches(e, q); })
        // With a muscle chosen: exercises where it is the main muscle first.
        .sort(function (a, b) { return (m !== 'Alla' && m !== 'Kondition' ? a.muscles.indexOf(m) - b.muscles.indexOf(m) : 0) || a.name.localeCompare(b.name, 'sv'); });
      summary(all.length, all.length === 1 ? 'övning' : 'övningar');
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
      var gym = X.activeGym ? X.activeGym() : null;
      var hits = X.programs.filter(function (p) {
        return (browse.group === 'Alla' || p.group === browse.group) && (!X.fitsGym || X.fitsGym(p, gym)) &&
          (!browse.time || p.durationMinutes[1] <= Number(browse.time)) &&
          (!browse.forMuscle || p.ids.some(function (id) { return X.exercises[id].muscles.indexOf(browse.forMuscle) >= 0; }));
      }).filter(function (p) {
        return !q || [p.name, p.group, p.equipment, p.tag].concat(p.ids.map(function (id) { return X.exercises[id].name; })).some(function (t) { return low(t).indexOf(q) >= 0; });
      });
      summary(hits.length, 'program');
      var lastGroup = null;
      return hits.map(function (p) {
        var head = browse.group === 'Alla' && p.group !== lastGroup ? '<p class="gm-find-section">' + esc(p.group) + '</p>' : '';
        lastGroup = p.group;
        return head + '<button type="button" class="gm-find-row" role="listitem" data-find-program="' + esc(p.id) + '"><span class="pk-thumb is-pose"><img alt="" loading="lazy" src="assets/exercise-poses-v2/' + String(p.ids[0]).padStart(2, '0') + '-end.webp"></span>' +
          '<span class="gm-find-copy"><b>' + esc(p.name) + '</b><small>' + p.ids.length + ' övningar · ' + esc(X.durationLabel(p)) + ' · ' + esc(X.programEquipment ? (X.programEquipment(p).join(', ') || 'Bara kroppsvikt') : p.equipment) + '</small></span></button>';
      }).join('') || '<p class="gm-find-empty">' + 'Inget program matchar dina val. <button type="button" class="gm-find-clear" data-find-clear>Visa alla program</button></p>';
    }
    /* Mitt pass: the chosen exercises, removable, and the way into today's pass. */
    function passRows() {
      var X = window.PulseExplore, ids = ui.selection();
      count.textContent = ids.length ? ids.length + (ids.length === 1 ? ' övning vald' : ' övningar valda') : '';
      if (!ids.length) return '<p class="gm-find-empty">Inga övningar valda ännu. Tryck Välj på en övning, eller dubbeltryck på figuren, så samlas de här.</p>';
      var ingemar = X.profile === 'ingemar';
      return ids.map(function (id) {
        var e = X.exercises[id];
        return '<div class="gm-find-row gm-pass-row" role="listitem"><span class="pk-thumb is-pose"><img alt="" loading="lazy" src="assets/exercise-poses-v2/' + String(id).padStart(2, '0') + '-end.webp"></span>' +
          '<span class="gm-find-copy"><b>' + esc(e.name) + '</b><small>' + esc(X.prescription(id).label) + ' · ' + esc(e.equipment) + '</small></span>' +
          '<button type="button" class="gm-pass-remove" data-find-remove="' + id + '" aria-label="Ta bort ' + esc(e.name) + '">×</button></div>';
      }).join('') + '<div class="gm-pass-actions">' + (ingemar ? '' : '<button type="button" class="gm-pass-today" data-find-today>Lägg till i dagens pass ↗</button>') +
        '<button type="button" class="gm-pass-copy" data-find-copy>' + (ingemar ? 'Öppna i passbyggaren ↗' : 'Kopiera passförslag') + '</button></div>' +
        (ingemar ? '' : '<p class="gm-pass-note">Dagens passbyggare öppnas med övningarna ifyllda, så du kan justera set, reps och vikter.</p>');
    }
    function gymEditor() {
      var X = window.PulseExplore, gym = browse.gymEdit ? X.readGyms().gyms.find(function (g) { return g.id === browse.gymEdit; }) : null;
      return '<form class="gm-gym-editor" data-gym-form="1"><label>Namn på gymmet<input name="name" maxlength="30" autocomplete="off" placeholder="Till exempel Hemma eller Jobbet" value="' + esc(gym ? gym.name : '') + '" required></label>' +
        '<p class="gm-gym-legend">Utrustning som finns där</p><div class="gm-gym-equipment">' + X.EQUIPMENT.map(function (e) { return '<label><input type="checkbox" value="' + esc(e) + '"' + (!gym || gym.equipment.indexOf(e) >= 0 ? ' checked' : '') + '> ' + esc(EQUIP_LABEL[e] || e) + '</label>'; }).join('') + '</div>' +
        '<p class="gm-gym-note">Övningar med kroppsvikt räknas alltid med.</p><p class="gm-gym-error" role="alert"></p>' +
        '<div class="gm-gym-actions"><button type="submit" class="gm-gym-save">Spara gym</button><button type="button" data-gym-cancel="1">Avbryt</button>' + (gym ? '<button type="button" data-gym-delete="1">Ta bort gymmet</button>' : '') + '</div></form>';
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
      if ((browse.mode === 'prog' || browse.mode === 'ex') && browse.gymEdit !== null) { list.innerHTML = gymEditor(); var input = list.querySelector('input[name=name]'); if (input) input.focus(); return; }
      list.innerHTML = browse.mode === 'ex' ? exerciseRows(q) : browse.mode === 'plan' ? planRows(q) : browse.mode === 'pass' ? passRows() : programRows(q);
    }
    // Grows out of the magnifier and shrinks back into it (pulse-motion.js), like the training tools.
    var motion = window.PulseMotion;
    var findOrigin = findBtn;
    function openFind(mode, options) {
      options = options || {};
      if (typeof mode === 'string') { browse.mode = mode; browse.plan = null; browse.gymEdit = null; }
      browse.forMuscle = options.muscle || '';
      if (options.muscle) browse.group = 'Alla';
      findOrigin = options.origin || findBtn;
      find.classList.toggle('is-over-scene', scene.isOpen());
      field.value = ''; renderChips(); renderFind(); find.hidden = false; find.classList.add('is-open'); list.scrollTop = 0;
      if (motion) motion.reveal(find, findOrigin); else find.style.opacity = 1;
    }
    function reopenFind(scroll) {
      renderChips(); renderFind(); find.hidden = false; find.classList.add('is-open'); find.style.opacity = 1;
      list.scrollTop = scroll || 0;
    }
    function closeFind(quiet) {
      if (find.hidden) return;
      var done = function () { find.hidden = true; find.classList.remove('is-open'); find.style.clipPath = ''; find.style.opacity = ''; };
      if (motion && !quiet && findOrigin && findOrigin.getClientRects().length) motion.conceal(find, findOrigin).then(done); else done();
    }
    findBtn.addEventListener('click', function () { openFind('ex'); });
    /* Mitt pass straight from the body, with the number chosen. */
    var passBtn = document.createElement('button');
    passBtn.type = 'button'; passBtn.className = 'gm-pass-btn';
    map.appendChild(passBtn);
    function paintPassBtn() { var n = ui.selection().length; passBtn.dataset.empty = n ? '' : '1'; passBtn.hidden = !n || scene.isOpen(); passBtn.innerHTML = 'Mitt pass' + (n ? ' <em>' + n + '</em>' : ''); passBtn.setAttribute('aria-label', 'Mitt pass, ' + n + (n === 1 ? ' övning' : ' övningar')); }
    paintPassBtn();
    var passCount = $('living-pass-count');
    if (passCount) new MutationObserver(function () { paintPassBtn(); if (!find.hidden && browse.mode === 'pass') { renderChips(); renderFind(); } else if (!find.hidden) renderChips(); }).observe(passCount, { childList: true, characterData: true, subtree: true });
    passBtn.addEventListener('click', function () { openFind('pass', { origin: passBtn }); });
    field.addEventListener('input', renderFind);
    find.addEventListener('submit', function (event) {
      var form = event.target.closest('[data-gym-form]'); if (!form) return;
      event.preventDefault();
      var X = window.PulseExplore, d = X.readGyms(), name = form.querySelector('input[name=name]').value.trim(), error = form.querySelector('.gm-gym-error');
      var equipment = Array.prototype.map.call(form.querySelectorAll('.gm-gym-equipment input:checked'), function (i) { return i.value; });
      if (!name) { error.textContent = 'Ge gymmet ett namn.'; return; }
      if (d.gyms.some(function (g) { return g.id !== browse.gymEdit && low(g.name) === low(name); })) { error.textContent = 'Det finns redan ett gym med det namnet.'; return; }
      var id = browse.gymEdit || 'gym-' + Date.now().toString(36), gym = { id: id, name: name, equipment: equipment };
      d.gyms = browse.gymEdit ? d.gyms.map(function (g) { return g.id === id ? gym : g; }) : d.gyms.concat(gym); d.active = id;
      if (!X.saveGyms(d)) { error.textContent = 'Gymmet kunde inte sparas. Tillåt webbplatslagring och försök igen.'; return; }
      browse.gymEdit = null; renderChips(); renderFind(); list.scrollTop = 0;
    });
    find.addEventListener('click', function (event) {
      if (event.target.closest('.gm-find-close')) {
        // Inside a plan the cross steps back to the plan list instead of leaving the explorer.
        if (browse.mode === 'plan' && browse.plan) { browse.plan = null; renderChips(); renderFind(); list.scrollTop = 0; return; }
        closeFind(); return;
      }
      var mode = event.target.closest('[data-find-mode]');
      if (mode) { browse.mode = mode.dataset.findMode; browse.plan = null; browse.gymEdit = null; renderChips(); renderFind(); list.scrollTop = 0; return; }
      var planRow = event.target.closest('[data-find-plan]');
      if (planRow && window.PulsePlans) { browse.plan = window.PulsePlans.find(planRow.dataset.findPlan); renderChips(); renderFind(); list.scrollTop = 0; return; }
      if (event.target.closest('[data-plan-back]')) { browse.plan = null; renderChips(); renderFind(); list.scrollTop = 0; return; }
      var timePick = event.target.closest('[data-find-time]');
      if (timePick) { browse.time = timePick.dataset.findTime; renderChips(); renderFind(); list.scrollTop = 0; return; }
      if (event.target.closest('[data-find-clear]')) {
        var GC = window.PulseExplore, dc = GC.readGyms(); dc.active = ''; GC.saveGyms(dc);
        browse.time = ''; browse.forMuscle = ''; browse.group = 'Alla'; browse.muscle = 'Alla'; field.value = ''; renderChips(); renderFind(); list.scrollTop = 0; return;
      }
      var removeChoice = event.target.closest('[data-find-remove]');
      if (removeChoice) { ui.toggle(Number(removeChoice.dataset.findRemove)); return; }
      if (event.target.closest('[data-find-today]')) { ui.addSelectionToToday(); return; }
      if (event.target.closest('[data-find-copy]')) { ui.copySelection(); return; }
      var gymPick = event.target.closest('[data-find-gym]');
      if (gymPick) { var G = window.PulseExplore, d = G.readGyms(); d.active = gymPick.dataset.findGym; G.saveGyms(d); browse.gymEdit = null; renderChips(); renderFind(); list.scrollTop = 0; return; }
      var gymNew = event.target.closest('[data-find-gym-new],[data-find-gym-edit]');
      if (gymNew) { browse.gymEdit = gymNew.dataset.findGymEdit || ''; renderFind(); list.scrollTop = 0; return; }
      if (event.target.closest('[data-gym-cancel]')) { browse.gymEdit = null; renderFind(); return; }
      if (event.target.closest('[data-gym-delete]')) { var G2 = window.PulseExplore, d2 = G2.readGyms(); d2.gyms = d2.gyms.filter(function (g) { return g.id !== browse.gymEdit; }); if (d2.active === browse.gymEdit) d2.active = ''; G2.saveGyms(d2); browse.gymEdit = null; renderChips(); renderFind(); return; }
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
    // A programme or exercise opened from the search keeps the pass button out of the scene.
    new MutationObserver(function () { passBtn.hidden = scene.isOpen() || !ui.selection().length; }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
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
