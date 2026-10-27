/* Body-to-scene preview for the exercise explorer, enabled with ?ui=gym.
   The explorer's own muscle map (pulse-muscle-map.js) is the body: tapping a
   muscle zooms into it and opens the exercise scene for that muscle, with the
   muscle's artwork as a wall above the live animated figure (PulseGymScene in
   pulse-stories-ui.js); its back gesture returns to the body. The muscle map's own exercise links open the same scene. The
   default UI is untouched without the flag. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  if ((params.get('ui') || '').split(',').indexOf('gym') < 0) return;
  document.documentElement.classList.add('ui-gym');

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
    function open(name, id) {
      // The page's own route opens the exercise view, which drives the figure.
      openExercise(name, id);
      scene.enter(name, id, ART[name] ? 'assets/atlas-art-v1/' + ART[name] + '.webp' : '');
      setTimeout(function () { figure.classList.remove('gm-zooming'); figure.style.transformOrigin = ''; }, 500);
    }
    var openExercise = ui.openMuscleExercise;
    ui.openMuscleExercise = function (name, id) { open(name, id == null ? null : id); };
    ui.browseMuscle = function (name) { open(name, null); };

    /* Tapping a muscle on the body zooms into it before the scene opens. */
    map.addEventListener('click', function (event) {
      var region = event.target.closest('[data-map-muscle]');
      if (!region || scene.isOpen()) return;
      var box = region.getBBox(), shift = region.transform.baseVal.consolidate(), dx = shift ? shift.matrix.e : 0;
      figure.style.transformOrigin = ((box.x + dx + box.width / 2) / 724 * 100) + '% ' + ((box.y + box.height / 2) / 1086 * 100) + '%';
      figure.classList.add('gm-zooming');
      var name = region.dataset.mapMuscle;
      if (ART[name]) new Image().src = 'assets/atlas-art-v1/' + ART[name] + '.webp';
      setTimeout(function () { ui.openMuscleExercise(name); }, 380);
    });
    scene.onLeave(function () { showBody(); });
    // Browser back from the exercise view returns to the body as well.
    new MutationObserver(function () { if ($('guide-page').hidden && scene.isOpen()) scene.leave(true); })
      .observe($('guide-page'), { attributes: true, attributeFilter: ['hidden'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
