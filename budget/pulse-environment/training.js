/* Reactor presentation only. The shared session runtime owns every clock and action. */
(function () {
  'use strict';
  const root = document.documentElement;
  const modal = document.getElementById('session-modal');
  if (!modal || !document.querySelector('.reactor-design-bar')) return;
  const buttons = Array.from(document.querySelectorAll('[data-training-design]'));
  const phaseLabel = document.querySelector('.reactor-core-phase');
  const caption = document.querySelector('.reactor-core-caption');
  let queued = false;

  function selectDesign(design) {
    root.dataset.trainingDesign = design;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.trainingDesign === design)));
  }
  buttons.forEach(button => button.addEventListener('click', () => selectDesign(button.dataset.trainingDesign)));
  selectDesign('reactor');

  function setText(node, text) {
    if (node.textContent !== text) node.textContent = text;
  }
  function syncPresentation() {
    queued = false;
    if (!modal.classList.contains('show')) return;
    const classes = modal.classList;
    const completed = classes.contains('pulse-flow-complete-v58');
    const resting = classes.contains('pulse-flow-resting-v58');
    const cardio = classes.contains('pulse-flow-cardio-v58');
    const active = classes.contains('pulse-flow-active-v58');
    const starting = classes.contains('pulse-flow-starting-v58');
    const paused = !!document.querySelector('#session-countdown-ring.is-paused');
    const phase = completed ? 'complete' : resting ? 'rest' : cardio ? 'cardio' : 'strength';
    if (root.dataset.reactorPhase !== phase) root.dataset.reactorPhase = phase;
    const motion = active && !paused ? 'running' : 'idle';
    if (root.dataset.reactorMotion !== motion) root.dataset.reactorMotion = motion;
    setText(phaseLabel, completed ? 'PASS GENOMFÖRT' : paused ? 'PAUSAT' : resting ? 'ÅTERHÄMTNING' : starting ? 'GÖR DIG REDO' : active ? (cardio ? 'KONDITION' : 'AKTIVT SET') : 'REDO FÖR START');
    setText(caption, completed ? 'STARKT JOBBAT' : resting ? 'HITTA TILLBAKA TILL ANDNINGEN' : 'ETT SET I TAGET');
    const log = document.getElementById('session-set-log');
    if (log && !log.parentElement.classList.contains('reactor-session-log')) log.parentElement.classList.add('reactor-session-log');
  }
  const observer = new MutationObserver(() => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(syncPresentation);
    }
  });
  observer.observe(modal, {attributes:true, attributeFilter:['class'], childList:true, subtree:true});
  syncPresentation();
})();
