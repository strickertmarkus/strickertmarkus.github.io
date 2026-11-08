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

    /* The explorer's way around, like the training page: a bottom bar (Kropp, Övningar,
       Program, Planer, Mitt pass), one search panel per tab with a single Filter button,
       a filter sheet, and Mina gym as its own full-screen page. */
    var low = function (t) { return String(t || '').toLocaleLowerCase('sv-SE'); };
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var X = window.PulseExplore;
    var ICONS = {
      body: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7.5v9M17 7.5v9M4.2 10v4M19.8 10v4M7 12h10"/><rect x="5.2" y="6.5" width="3.6" height="11" rx="1.2"/><rect x="15.2" y="6.5" width="3.6" height="11" rx="1.2"/></svg>',
      gym: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5L12 4l8.5 6.5"/><path d="M5.5 9v10.5h13V9"/><path d="M9 15h6M9.8 13v4M14.2 13v4"/></svg>',
      ex: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2L20 20"/></svg>',
      prog: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4.5" width="16" height="15" rx="3"/><path d="M8 9.5h8M8 13h8M8 16.5h5"/></svg>',
      plan: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
      pass: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1"/><circle cx="4.8" cy="12" r="1"/><circle cx="4.8" cy="17.5" r="1"/></svg>',
      filter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
      back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>',
      check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
      chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>'
    };
    var TITLES = { ex: 'Övningar', prog: 'Program', plan: 'Planer', pass: 'Mitt pass' };
    var MUSCLES = ['Alla', 'Bröst', 'Axlar', 'Rygg', 'Biceps', 'Triceps', 'Mage', 'Framsida lår', 'Säte', 'Baksida lår', 'Vader', 'Kondition'];
    var TIMES = [['', 'Alla längder'], ['20', 'Upp till 20 min'], ['30', 'Upp till 30 min'], ['45', 'Upp till 45 min'], ['60', 'Upp till 60 min']];
    var EQUIP_LABEL = { Maskin: 'Maskiner', Kabel: 'Kabel', Hantlar: 'Hantlar', 'Skivstång': 'Skivstång', Konditionsmaskin: 'Konditionsmaskiner' };
    var browse = { mode: 'ex', muscle: 'Alla', group: 'Alla', planGroup: 'Alla', plan: null, time: '', forMuscle: '' };
    function gym() { return X.activeGym ? X.activeGym() : null; }
    // The chosen gym also limits exercises: body-weight exercises always fit.
    function exerciseFits(e, g) { return !g || e.equipment === 'Kroppsvikt' || g.equipment.indexOf(e.equipment) >= 0; }

    /* Search from the body, top left: opens Övningar with the keyboard ready. */
    var findBtn = document.createElement('button');
    findBtn.type = 'button'; findBtn.className = 'gm-find-btn'; findBtn.setAttribute('aria-label', 'Sök övningar');
    findBtn.innerHTML = ICONS.ex;
    map.appendChild(findBtn);
    findBtn.addEventListener('click', function () { openFind('ex', { origin: findBtn }); setTimeout(function () { field.focus(); }, 320); });

    /* ---- Bottom bar ---- */
    var dock = document.createElement('nav');
    dock.className = 'gm-dock'; dock.setAttribute('aria-label', 'Utforska');
    dock.innerHTML = [['body', 'Kropp'], ['ex', 'Övningar'], ['prog', 'Program'], ['gym', 'Gym'], ['pass', 'Mitt pass']].map(function (t) {
      return '<button type="button" data-dock="' + t[0] + '">' + ICONS[t[0]] + '<span>' + t[1] + '</span>' + (t[0] === 'pass' ? '<em class="gm-dock-badge" hidden></em>' : '') + '</button>';
    }).join('');
    document.body.appendChild(dock);
    function paintDock() {
      var on = find.hidden ? 'body' : browse.mode === 'plan' ? 'prog' : browse.mode;
      dock.querySelectorAll('[data-dock]').forEach(function (b) { var active = b.dataset.dock === on; b.classList.toggle('is-active', active); if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
      var n = ui.selection().length, badge = dock.querySelector('.gm-dock-badge');
      badge.hidden = !n; badge.textContent = n || '';
      dock.hidden = scene.isOpen();
    }

    /* ---- Search panel ---- */
    var find = document.createElement('div');
    find.className = 'gm-find'; find.hidden = true; find.setAttribute('role', 'region'); find.setAttribute('aria-label', 'Sök');
    find.innerHTML = '<div class="gm-find-head"><button type="button" class="gm-find-back" data-find-back hidden>' + ICONS.back + '<span>Tillbaka</span></button><h2 class="gm-find-title">Övningar</h2>' +
      '<div class="gm-seg" role="group" aria-label="Visa" hidden><button type="button" data-seg="prog" aria-pressed="true">Program</button><button type="button" data-seg="plan" aria-pressed="false">Planer</button></div>' +
      '<div class="gm-find-tools"><label class="gm-find-field">' + ICONS.ex + '<input type="search" autocomplete="off" enterkeyhint="search" aria-label="Sök"></label>' +
      '<button type="button" class="gm-filter-btn" data-filter-open aria-label="Filter">' + ICONS.filter + '<span>Filter</span><em hidden></em></button></div>' +
      '<p class="gm-find-count" aria-live="polite"></p></div><div class="gm-find-list" role="list"></div>';
    document.body.appendChild(find);
    var field = find.querySelector('input'), list = find.querySelector('.gm-find-list'), count = find.querySelector('.gm-find-count'), title = find.querySelector('.gm-find-title'), backBtn = find.querySelector('[data-find-back]'), filterBtn = find.querySelector('[data-filter-open]');
    function activeFilters() {
      var n = 0, g = gym();
      if (g && (browse.mode === 'ex' || browse.mode === 'prog')) n++;
      if (browse.mode === 'ex' && browse.muscle !== 'Alla') n++;
      if (browse.mode === 'prog') { if (browse.time) n++; if (browse.group !== 'Alla') n++; if (browse.forMuscle) n++; }
      if (browse.mode === 'plan' && browse.planGroup !== 'Alla') n++;
      return n;
    }
    function paintHead() {
      var detail = browse.mode === 'plan' && browse.plan;
      title.textContent = detail ? browse.plan.name : browse.mode === 'plan' ? 'Program' : TITLES[browse.mode];
      var seg = find.querySelector('.gm-seg');
      seg.hidden = !(browse.mode === 'prog' || browse.mode === 'plan') || !!detail;
      seg.querySelectorAll('[data-seg]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.seg === browse.mode)); });
      backBtn.hidden = !(detail || scene.isOpen());
      find.querySelector('.gm-find-tools').hidden = browse.mode === 'pass' || !!detail;
      filterBtn.hidden = browse.mode === 'pass';
      var n = activeFilters(), badge = filterBtn.querySelector('em');
      badge.hidden = !n; badge.textContent = n || ''; filterBtn.classList.toggle('is-on', !!n);
      field.placeholder = browse.mode === 'ex' ? 'Sök övning, muskel eller redskap' : browse.mode === 'plan' ? 'Sök plan eller övning' : 'Sök program eller övning';
    }
    /* What is filtered, in words, with one way to clear it. */
    function summary(n, noun) {
      var g = gym(), parts = [];
      if (g && (browse.mode === 'ex' || browse.mode === 'prog')) parts.push(g.name);
      if (browse.mode === 'ex' && browse.muscle !== 'Alla') parts.push(browse.muscle);
      if (browse.mode === 'prog') { if (browse.group !== 'Alla') parts.push(browse.group); if (browse.time) parts.push('upp till ' + browse.time + ' min'); if (browse.forMuscle) parts.push('tränar ' + browse.forMuscle.toLowerCase()); }
      if (browse.mode === 'plan' && browse.planGroup !== 'Alla') parts.push(browse.planGroup);
      count.innerHTML = esc(n + ' ' + noun) + (parts.length ? ' · ' + esc(parts.join(' · ')) + ' <button type="button" class="gm-find-clear" data-find-clear>Rensa</button>' : '');
    }
    function exerciseRows(q) {
      var m = browse.muscle, g = gym();
      var all = X.exercises.filter(function (e) { return (m === 'Alla' || (m === 'Kondition' ? e.group === 'Kondition' : e.muscles.indexOf(m) >= 0)) && exerciseFits(e, g); })
        .filter(function (e) { return matches(e, q); })
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
          '<span class="gm-find-copy"><b>' + name + '</b><small>' + esc(e.muscles.slice(0, 3).join(' · ')) + ' · ' + esc(e.equipment) + '</small></span>' + ICONS.chevron + '</button>';
      }).join('') || '<p class="gm-find-empty">Ingen övning matchar. <button type="button" class="gm-find-clear" data-find-clear>Visa alla övningar</button></p>';
    }
    function matches(e, q) {
      if (!q) return true;
      if (low(e.name).indexOf(q) >= 0) return true;
      return e.muscles.concat([e.equipment, e.group]).some(function (w) { return low(w).split(/[\s,·]+/).some(function (part) { return part.indexOf(q) === 0; }) || low(w).indexOf(q) === 0; });
    }
    function programHits(q, ignore) {
      var g = gym();
      return X.programs.filter(function (p) {
        return (ignore === 'group' || browse.group === 'Alla' || p.group === browse.group) && (ignore === 'gym' || !X.fitsGym || X.fitsGym(p, g)) &&
          (ignore === 'time' || !browse.time || p.durationMinutes[1] <= Number(browse.time)) &&
          (!browse.forMuscle || p.ids.some(function (id) { return X.exercises[id].muscles.indexOf(browse.forMuscle) >= 0; }));
      }).filter(function (p) {
        return !q || [p.name, p.group, p.equipment, p.tag].concat(p.ids.map(function (id) { return X.exercises[id].name; })).some(function (t) { return low(t).indexOf(q) >= 0; });
      });
    }
    function programRows(q) {
      var hits = programHits(q);
      summary(hits.length, 'program');
      var lastGroup = null;
      return hits.map(function (p) {
        var head = browse.group === 'Alla' && p.group !== lastGroup ? '<p class="gm-find-section">' + esc(p.group) + '</p>' : '';
        lastGroup = p.group;
        return head + '<button type="button" class="gm-find-row" role="listitem" data-find-program="' + esc(p.id) + '"><span class="pk-thumb is-pose"><img alt="" loading="lazy" src="assets/exercise-poses-v2/' + String(p.ids[0]).padStart(2, '0') + '-end.webp"></span>' +
          '<span class="gm-find-copy"><b>' + esc(p.name) + '</b><small>' + p.ids.length + (p.ids.length === 1 ? ' övning · ' : ' övningar · ') + esc(X.durationLabel(p)) + ' · ' + esc(X.programEquipment(p).join(', ') || 'Bara kroppsvikt') + '</small></span>' + ICONS.chevron + '</button>';
      }).join('') || '<p class="gm-find-empty">Inget program matchar dina val. <button type="button" class="gm-find-clear" data-find-clear>Visa alla program</button></p>';
    }
    /* Mitt pass: the chosen exercises, removable, and the way into today's pass. */
    function passRows() {
      var ids = ui.selection();
      count.textContent = ids.length ? ids.length + (ids.length === 1 ? ' övning vald' : ' övningar valda') : '';
      if (!ids.length) return '<p class="gm-find-empty">Inga övningar valda ännu. Öppna en övning och tryck Välj, så samlas de här.</p>';
      var ingemar = X.profile === 'ingemar';
      return ids.map(function (id) {
        var e = X.exercises[id];
        return '<div class="gm-find-row gm-pass-row" role="listitem"><span class="pk-thumb is-pose"><img alt="" loading="lazy" src="assets/exercise-poses-v2/' + String(id).padStart(2, '0') + '-end.webp"></span>' +
          '<span class="gm-find-copy"><b>' + esc(e.name) + '</b><small>' + esc(X.prescription(id).label) + ' · ' + esc(e.equipment) + '</small></span>' +
          '<button type="button" class="gm-pass-remove" data-find-remove="' + id + '" aria-label="Ta bort ' + esc(e.name) + '">×</button></div>';
      }).join('') + '<div class="gm-pass-actions">' + (ingemar ? '' : '<button type="button" class="gm-primary" data-find-today>Lägg till i dagens pass</button>') +
        '<button type="button" class="gm-secondary" data-find-copy>' + (ingemar ? 'Öppna i passbyggaren' : 'Kopiera passförslag') + '</button></div>' +
        (ingemar ? '' : '<p class="gm-pass-note">Dagens passbyggare öppnas med övningarna ifyllda, så du kan justera set, reps och vikter.</p>');
    }
    function planRows(q) {
      var P = window.PulsePlans, X = window.PulseExplore;
      if (!P) return '';
      var hits = P.plans.filter(function (p) { return browse.planGroup === 'Alla' || p.group === browse.planGroup; }).filter(function (p) {
        if (!q) return true;
        var names = []; Object.keys(p.sessions).forEach(function (k) { P.sessionIds(p, k).forEach(function (id) { names.push(X.exercises[id].name); }); });
        return [p.name, p.group, p.equipment, p.level].concat(names).some(function (t) { return low(t).indexOf(q) >= 0; });
      });
      summary(hits.length, hits.length === 1 ? 'plan · fyra veckor' : 'planer · fyra veckor');
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
      return '<div class="gm-plan">' +
        '<h3>' + esc(p.name) + '</h3><p class="gm-plan-meta">' + p.perWeek + ' pass i veckan · ' + esc(p.level) + ' · ' + esc(p.equipment) + '</p>' +
        '<p class="gm-plan-summary">' + esc(p.summary) + '</p>' + grid +
        '<p class="gm-plan-how">' + esc(p.how) + '</p>' + notes + sessions +
        (p.own ? '<p class="gm-plan-source">Egen plan, byggd av utforskarens övningar.</p>' : '<p class="gm-plan-source">Inspirerad av <a href="' + esc(p.source.url) + '" target="_blank" rel="noopener">' + esc(p.source.label) + '</a>. Upplägget är förenklat till våra övningar.</p>') +
        '<a class="gm-plan-apply" href="' + href + '">Lägg in i träningsplanen</a><p class="gm-plan-apply-note">Fyra veckor läggs in från veckan du väljer. Inget sparas förrän du trycker Spara plan.</p></div>';
    }
    function renderFind() {
      var q = low(field.value).trim();
      paintHead(); paintDock();
      if (browse.mode === 'plan' && browse.plan) { list.innerHTML = planDetail(browse.plan); return; }
      list.innerHTML = browse.mode === 'ex' ? exerciseRows(q) : browse.mode === 'plan' ? planRows(q) : browse.mode === 'pass' ? passRows() : programRows(q);
    }
    var motion = window.PulseMotion, findOrigin = null;
    function openFind(mode, options) {
      options = options || {};
      if (typeof mode === 'string' && TITLES[mode]) { browse.mode = mode; browse.plan = null; }
      browse.forMuscle = options.muscle || '';
      if (options.muscle) browse.group = 'Alla';
      var wasOpen = !find.hidden;
      findOrigin = options.origin || null;
      find.classList.toggle('is-over-scene', scene.isOpen());
      field.value = ''; renderFind(); find.hidden = false; find.classList.add('is-open'); list.scrollTop = 0;
      // From the bottom bar it simply switches; from the exercise view it grows out of the tapped button.
      if (!wasOpen && motion && findOrigin) motion.reveal(find, findOrigin); else find.style.opacity = 1;
      paintDock();
    }
    function reopenFind(scroll) {
      renderFind(); find.hidden = false; find.classList.add('is-open'); find.style.opacity = 1;
      list.scrollTop = scroll || 0; paintDock();
    }
    function closeFind(quiet) {
      if (find.hidden) return;
      var done = function () { find.hidden = true; find.classList.remove('is-open', 'is-over-scene'); find.style.clipPath = ''; find.style.opacity = ''; paintDock(); };
      if (motion && !quiet && findOrigin && findOrigin.getClientRects().length) motion.conceal(find, findOrigin).then(done); else done();
      findOrigin = null;
    }
    dock.addEventListener('click', function (event) {
      var b = event.target.closest('[data-dock]'); if (!b) return;
      if (b.dataset.dock === 'body') { closeFind(true); return; }
      if (b.dataset.dock === 'gym') { openGyms('Tillbaka'); return; }
      // Program remembers whether Planer was showing.
      if (b.dataset.dock === 'prog' && browse.mode === 'plan' && !find.hidden) return;
      openFind(b.dataset.dock);
    });
    field.addEventListener('input', renderFind);
    var passCount = $('living-pass-count');
    if (passCount) new MutationObserver(function () { if (!find.hidden && browse.mode === 'pass') renderFind(); else paintDock(); }).observe(passCount, { childList: true, characterData: true, subtree: true });

    /* ---- Filter sheet ---- */
    var sheet = document.createElement('div');
    sheet.className = 'gm-sheet'; sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Filter');
    document.body.appendChild(sheet);
    function option(kind, value, label, on, meta) {
      return '<button type="button" class="gm-option" data-opt="' + kind + '" data-value="' + esc(value) + '" aria-pressed="' + on + '"><span>' + esc(label) + (meta ? '<small>' + esc(meta) + '</small>' : '') + '</span>' + (on ? ICONS.check : '') + '</button>';
    }
    function renderSheet() {
      var d = X.readGyms(), html = '', g = gym();
      if (browse.mode === 'ex' || browse.mode === 'prog') {
        html += '<section><h4>Gym</h4>' + option('gym', '', 'Alla förslag', !d.active, 'All utrustning') +
          d.gyms.map(function (x) { return option('gym', x.id, x.name, d.active === x.id, x.equipment.map(function (e) { return EQUIP_LABEL[e] || e; }).join(', ') || 'Bara kroppsvikt'); }).join('') +
          '<button type="button" class="gm-option is-link" data-gyms-open><span>Mina gym</span>' + ICONS.chevron + '</button></section>';
      }
      if (browse.mode === 'prog') {
        html += '<section><h4>Tid</h4>' + TIMES.map(function (t) { return option('time', t[0], t[1], browse.time === t[0]); }).join('') + '</section>';
        var groups = ['Alla'].concat(X.programs.map(function (p) { return p.group; }).filter(function (x, i, a) { return a.indexOf(x) === i; }));
        html += '<section><h4>Inriktning</h4>' + groups.map(function (x) { return option('group', x, x === 'Alla' ? 'Alla inriktningar' : x, browse.group === x); }).join('') + '</section>';
        if (browse.forMuscle) html += '<section><h4>Muskel</h4>' + option('muscleoff', '', 'Tränar ' + browse.forMuscle.toLowerCase(), true, 'Tryck för att visa alla muskler') + '</section>';
      }
      if (browse.mode === 'ex') html += '<section><h4>Muskel</h4>' + MUSCLES.map(function (x) { return option('muscle', x, x === 'Alla' ? 'Alla muskler' : x, browse.muscle === x); }).join('') + '</section>';
      if (browse.mode === 'plan') {
        var pg = ['Alla'].concat((window.PulsePlans ? window.PulsePlans.plans : []).map(function (p) { return p.group; }).filter(function (x, i, a) { return a.indexOf(x) === i; }));
        html += '<section><h4>Inriktning</h4>' + pg.map(function (x) { return option('plangroup', x, x === 'Alla' ? 'Alla planer' : x, browse.planGroup === x); }).join('') + '</section>';
      }
      var n = browse.mode === 'prog' ? programHits(low(field.value).trim()).length : null;
      sheet.innerHTML = '<div class="gm-sheet-card"><div class="gm-sheet-head"><button type="button" class="gm-text-btn" data-sheet-clear>Rensa</button><h3>Filter</h3><button type="button" class="gm-text-btn is-strong" data-sheet-done>Klar</button></div>' +
        '<div class="gm-sheet-body">' + html + '</div>' +
        '<div class="gm-sheet-foot"><button type="button" class="gm-primary" data-sheet-done>' + (n === null ? 'Visa' : 'Visa ' + n + ' program') + '</button></div></div>';
      void g;
    }
    function openSheet() { renderSheet(); sheet.hidden = false; requestAnimationFrame(function () { sheet.classList.add('is-open'); }); var first = sheet.querySelector('[data-sheet-done]'); if (first) first.focus({ preventScroll: true }); }
    function closeSheet() { sheet.classList.remove('is-open'); setTimeout(function () { if (!sheet.classList.contains('is-open')) sheet.hidden = true; }, 220); renderFind(); filterBtn.focus({ preventScroll: true }); }
    function clearFilters() {
      var d = X.readGyms(); d.active = ''; X.saveGyms(d);
      browse.time = ''; browse.forMuscle = ''; browse.group = 'Alla'; browse.muscle = 'Alla'; browse.planGroup = 'Alla';
    }
    sheet.addEventListener('click', function (event) {
      if (event.target === sheet || event.target.closest('[data-sheet-done]')) { closeSheet(); return; }
      if (event.target.closest('[data-sheet-clear]')) { clearFilters(); renderSheet(); return; }
      if (event.target.closest('[data-gyms-open]')) { openGyms(); return; }
      var o = event.target.closest('[data-opt]'); if (!o) return;
      var v = o.dataset.value, kind = o.dataset.opt;
      if (kind === 'gym') { var d = X.readGyms(); d.active = v; X.saveGyms(d); }
      else if (kind === 'time') browse.time = v;
      else if (kind === 'group') browse.group = v;
      else if (kind === 'muscle') browse.muscle = v;
      else if (kind === 'plangroup') browse.planGroup = v;
      else if (kind === 'muscleoff') browse.forMuscle = '';
      var top = sheet.querySelector('.gm-sheet-body').scrollTop; renderSheet(); sheet.querySelector('.gm-sheet-body').scrollTop = top;
    });

    /* ---- Mina gym: its own full-screen page ---- */
    var gyms = document.createElement('div');
    gyms.className = 'gm-gyms'; gyms.hidden = true; gyms.setAttribute('role', 'dialog'); gyms.setAttribute('aria-modal', 'true'); gyms.setAttribute('aria-label', 'Mina gym');
    document.body.appendChild(gyms);
    var gymEdit = null, gymsBack = 'Filter'; // gymEdit: null = the list, '' = a new gym, id = editing that gym
    function renderGyms() {
      var d = X.readGyms();
      if (gymEdit === null) {
        gyms.innerHTML = '<div class="gm-page-head"><button type="button" class="gm-find-back" data-gyms-close>' + ICONS.back + '<span>' + gymsBack + '</span></button><h2>Mina gym</h2>' +
          '<p>Ställ in vilken utrustning som finns på varje ställe. Välj sedan gym under Filter i Övningar eller Program, så visas bara det du kan köra där.</p></div>' +
          '<div class="gm-page-body"><div class="gm-group">' + (d.gyms.length ? d.gyms.map(function (g) {
            return '<button type="button" class="gm-option" data-gym-edit="' + esc(g.id) + '"><span>' + esc(g.name) + '<small>' + esc(g.equipment.map(function (e) { return EQUIP_LABEL[e] || e; }).join(', ') || 'Bara kroppsvikt') + '</small></span>' + ICONS.chevron + '</button>';
          }).join('') : '<p class="gm-group-empty">Inga gym ännu.</p>') + '</div>' +
          (d.gyms.length < 8 ? '<button type="button" class="gm-primary" data-gym-edit="">Lägg till gym</button>' : '') + '</div>';
        return;
      }
      var g = gymEdit ? d.gyms.find(function (x) { return x.id === gymEdit; }) : null;
      gyms.innerHTML = '<form class="gm-gym-form" data-gym-form><div class="gm-page-head"><button type="button" class="gm-find-back" data-gym-list>' + ICONS.back + '<span>Mina gym</span></button><h2>' + (g ? esc(g.name) : 'Nytt gym') + '</h2></div>' +
        '<div class="gm-page-body"><h4>Namn</h4><div class="gm-group"><input class="gm-input" name="name" maxlength="30" autocomplete="off" placeholder="Till exempel Hemma eller Jobbet" value="' + esc(g ? g.name : '') + '" required></div>' +
        '<h4>Utrustning</h4><div class="gm-group">' + X.EQUIPMENT.map(function (e) {
          return '<label class="gm-switch-row"><span>' + esc(EQUIP_LABEL[e] || e) + '</span><input type="checkbox" role="switch" value="' + esc(e) + '"' + (!g || g.equipment.indexOf(e) >= 0 ? ' checked' : '') + '><i aria-hidden="true"></i></label>';
        }).join('') + '</div><p class="gm-group-note">Övningar med kroppsvikt räknas alltid med.</p><p class="gm-gym-error" role="alert"></p>' +
        '<button type="submit" class="gm-primary">Spara</button>' + (g ? '<button type="button" class="gm-danger" data-gym-delete>Ta bort gymmet</button>' : '') + '</div></form>';
      if (!g) gyms.querySelector('.gm-input').focus();
    }
    function openGyms(back) { gymsBack = typeof back === 'string' ? back : 'Filter'; gymEdit = null; renderGyms(); gyms.hidden = false; requestAnimationFrame(function () { gyms.classList.add('is-open'); }); }
    function closeGyms() { gyms.classList.remove('is-open'); setTimeout(function () { if (!gyms.classList.contains('is-open')) gyms.hidden = true; }, 240); if (!sheet.hidden) renderSheet(); }
    gyms.addEventListener('click', function (event) {
      if (event.target.closest('[data-gyms-close]')) { closeGyms(); return; }
      if (event.target.closest('[data-gym-list]')) { gymEdit = null; renderGyms(); return; }
      var edit = event.target.closest('[data-gym-edit]');
      if (edit) { gymEdit = edit.dataset.gymEdit; renderGyms(); gyms.scrollTop = 0; return; }
      if (event.target.closest('[data-gym-delete]')) {
        var d = X.readGyms(); d.gyms = d.gyms.filter(function (g) { return g.id !== gymEdit; }); if (d.active === gymEdit) d.active = ''; X.saveGyms(d);
        gymEdit = null; renderGyms(); return;
      }
    });
    gyms.addEventListener('submit', function (event) {
      event.preventDefault();
      var form = event.target, d = X.readGyms(), name = form.querySelector('[name=name]').value.trim(), error = form.querySelector('.gm-gym-error');
      var equipment = Array.prototype.map.call(form.querySelectorAll('.gm-switch-row input:checked'), function (i) { return i.value; });
      if (!name) { error.textContent = 'Ge gymmet ett namn.'; return; }
      if (d.gyms.some(function (g) { return g.id !== gymEdit && low(g.name) === low(name); })) { error.textContent = 'Det finns redan ett gym med det namnet.'; return; }
      var id = gymEdit || 'gym-' + Date.now().toString(36), g = { id: id, name: name, equipment: equipment };
      d.gyms = gymEdit ? d.gyms.map(function (x) { return x.id === id ? g : x; }) : d.gyms.concat(g);
      if (!gymEdit) d.active = id;
      if (!X.saveGyms(d)) { error.textContent = 'Gymmet kunde inte sparas. Tillåt webbplatslagring och försök igen.'; return; }
      gymEdit = null; renderGyms();
    });

    find.addEventListener('click', function (event) {
      if (event.target.closest('[data-find-back]')) {
        if (browse.mode === 'plan' && browse.plan) { browse.plan = null; renderFind(); list.scrollTop = 0; return; }
        closeFind(); return;
      }
      if (event.target.closest('[data-filter-open]')) { openSheet(); return; }
      var seg = event.target.closest('[data-seg]');
      if (seg) { browse.mode = seg.dataset.seg; browse.plan = null; field.value = ''; renderFind(); list.scrollTop = 0; return; }
      var planRow = event.target.closest('[data-find-plan]');
      if (planRow && window.PulsePlans) { browse.plan = window.PulsePlans.find(planRow.dataset.findPlan); renderFind(); list.scrollTop = 0; return; }
      if (event.target.closest('[data-find-clear]')) { clearFilters(); field.value = ''; renderFind(); list.scrollTop = 0; return; }
      var removeChoice = event.target.closest('[data-find-remove]');
      if (removeChoice) { ui.toggle(Number(removeChoice.dataset.findRemove)); return; }
      if (event.target.closest('[data-find-today]')) { ui.addSelectionToToday(); return; }
      if (event.target.closest('[data-find-copy]')) { ui.copySelection(); return; }
      var prog = event.target.closest('[data-find-program]');
      if (prog) {
        var p = X.programs.find(function (x) { return x.id === prog.dataset.findProgram; });
        if (!p) return;
        returnToFind = { scroll: list.scrollTop };
        closeFind(true); ui.openMuscleExercise(X.exercises[p.ids[0]].muscles[0], p.ids[0]);
        setTimeout(function () { if (scene.openProgram) scene.openProgram(p.id); }, 650);
        return;
      }
      var row = event.target.closest('[data-find-id]');
      if (row) {
        var e = X.exercises[Number(row.dataset.findId)], m = browse.muscle;
        returnToFind = { scroll: list.scrollTop };
        closeFind(true); ui.openMuscleExercise(m !== 'Alla' && m !== 'Kondition' && e.muscles.indexOf(m) >= 0 ? m : e.muscles[0], e.id);
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (!gyms.hidden) closeGyms(); else if (!sheet.hidden) closeSheet(); else if (!find.hidden) closeFind();
    });
    window.PulseExploreSearch = { open: openFind, close: closeFind };
    // The bar steps aside while the exercise view is open.
    new MutationObserver(paintDock).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    paintDock();
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
