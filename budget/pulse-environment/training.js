/* Shared preview presentation only. The shared session runtime owns every clock and action. */
(function () {
  'use strict';
  const root = document.documentElement;
  const modal = document.getElementById('session-modal');
  if (!modal || !document.querySelector('.training-design-bar')) return;
  const theme = root.dataset.trainingTheme;
  if (theme !== 'reactor' && theme !== 'observatory') return;
  const buttons = Array.from(modal.querySelectorAll('button[data-training-design]'));
  const phaseLabel = document.querySelector('.training-core-phase');
  const caption = document.querySelector('.training-core-caption');
  let queued = false;

  function selectDesign(design) {
    root.dataset.trainingDesign = design;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.trainingDesign === design)));
  }
  buttons.forEach(button => button.addEventListener('click', () => selectDesign(button.dataset.trainingDesign)));
  selectDesign(theme);

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
    if (root.dataset.trainingPhase !== phase) root.dataset.trainingPhase = phase;
    const motion = active && !paused && !document.hidden ? 'running' : 'idle';
    if (root.dataset.trainingMotion !== motion) root.dataset.trainingMotion = motion;
    setText(phaseLabel, completed ? 'PASS GENOMFÖRT' : paused ? 'PAUSAT' : resting ? 'ÅTERHÄMTNING' : starting ? 'GÖR DIG REDO' : active ? (cardio ? 'KONDITION' : 'AKTIVT SET') : 'REDO FÖR START');
    setText(caption, completed ? 'STARKT JOBBAT' : resting ? 'HITTA TILLBAKA TILL ANDNINGEN' : 'ETT SET I TAGET');
  }
  const observer = new MutationObserver(records => {
    // Ignore the native clock's text and SVG updates. Only session/pause classes matter here.
    if (!records.some(record => record.target === modal || record.target.id === 'session-countdown-ring')) return;
    if (!queued) {
      queued = true;
      requestAnimationFrame(syncPresentation);
    }
  });
  observer.observe(modal, {attributes:true, attributeFilter:['class'], subtree:true});
  document.addEventListener('visibilitychange', syncPresentation);
  syncPresentation();
})();
