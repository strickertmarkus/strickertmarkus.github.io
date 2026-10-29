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
    scene.onLeave(function () { document.documentElement.classList.remove('gm-scene-open'); showBody(); });

    /* Search every exercise: name, muscle, equipment or category ("bröst", "kabel", "pull"). */
    var findBtn = document.createElement('button');
    findBtn.type = 'button'; findBtn.className = 'gm-find-btn'; findBtn.setAttribute('aria-label', 'Sök bland alla övningar');
    findBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2L20 20"/><path class="gm-find-spark" d="M10.5 7.4c.25 1.9.9 2.6 2.8 2.8-1.9.25-2.6.9-2.8 2.8-.25-1.9-.9-2.6-2.8-2.8 1.9-.25 2.6-.9 2.8-2.8z"/></svg>';
    map.appendChild(findBtn);
    var find = document.createElement('div');
    find.className = 'gm-find'; find.hidden = true; find.setAttribute('role', 'dialog'); find.setAttribute('aria-modal', 'true'); find.setAttribute('aria-label', 'Sök övning');
    find.innerHTML = '<div class="gm-find-head"><button type="button" class="gm-find-close" aria-label="Stäng sök"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<span class="eyebrow">Alla övningar</span><h2>Sök övning</h2>' +
      '<label class="gm-find-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2L20 20"/></svg><input type="search" placeholder="Övning, muskel eller redskap" autocomplete="off" enterkeyhint="search" aria-label="Sök övning, muskel eller redskap"></label>' +
      '<p class="gm-find-count" aria-live="polite"></p></div><div class="gm-find-list" role="list"></div>';
    document.body.appendChild(find);
    var field = find.querySelector('input'), list = find.querySelector('.gm-find-list'), count = find.querySelector('.gm-find-count');
    var low = function (t) { return String(t || '').toLocaleLowerCase('sv-SE'); };
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    function matches(e, q) {
      if (!q) return true;
      if (low(e.name).indexOf(q) >= 0) return true;
      return e.muscles.concat([e.equipment, e.group]).some(function (w) { return low(w).split(/[\s,·]+/).some(function (part) { return part.indexOf(q) === 0; }) || low(w).indexOf(q) === 0; });
    }
    function renderFind() {
      var q = low(field.value).trim(), all = window.PulseExplore.exercises.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'sv'); });
      var hits = all.filter(function (e) { return matches(e, q); });
      count.textContent = q ? hits.length + (hits.length === 1 ? ' träff' : ' träffar') : all.length + ' övningar';
      list.innerHTML = hits.map(function (e) {
        var name = esc(e.name), at = q ? low(e.name).indexOf(q) : -1;
        if (at >= 0) name = esc(e.name.slice(0, at)) + '<mark>' + esc(e.name.slice(at, at + q.length)) + '</mark>' + esc(e.name.slice(at + q.length));
        var art = ART[e.muscles[0]];
        return '<button type="button" class="gm-find-row" role="listitem" data-find-id="' + e.id + '"><span class="pk-thumb' + (e.group === 'Kondition' ? ' is-cardio' : '') + '">' + (art ? '<img alt="" loading="lazy" src="assets/atlas-art-v1/' + art + '.webp">' : '') + '</span>' +
          '<span class="gm-find-copy"><b>' + name + '</b><small>' + esc(e.muscles.slice(0, 3).join(' · ')) + ' · ' + esc(e.equipment) + '</small></span></button>';
      }).join('') || '<p class="gm-find-empty">Ingen övning matchar. Prova en muskel, som <b>bröst</b>, eller ett redskap, som <b>kabel</b>.</p>';
    }
    function openFind() { field.value = ''; renderFind(); find.hidden = false; requestAnimationFrame(function () { find.classList.add('is-open'); field.focus({ preventScroll: true }); }); }
    function closeFind() { find.classList.remove('is-open'); setTimeout(function () { find.hidden = true; }, 200); }
    findBtn.addEventListener('click', openFind);
    field.addEventListener('input', renderFind);
    find.addEventListener('click', function (event) {
      if (event.target.closest('.gm-find-close')) { closeFind(); return; }
      var row = event.target.closest('[data-find-id]');
      if (row) { var e = window.PulseExplore.exercises[Number(row.dataset.findId)]; closeFind(); ui.openMuscleExercise(e.muscles[0], e.id); }
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !find.hidden) closeFind(); });
    window.PulseExploreSearch = { open: openFind, close: closeFind };
    // Browser back from the exercise view returns to the body as well.
    new MutationObserver(function () { if ($('guide-page').hidden && scene.isOpen()) { scene.leave(true); document.documentElement.classList.remove('gm-scene-open'); } })
      .observe($('guide-page'), { attributes: true, attributeFilter: ['hidden'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
