/* Pulse Reactor presentation. Existing storage, graph data and session handlers remain authoritative. */
(function () {
  'use strict';

  if (window.Chart) Chart.register({
    id: 'pulseOverviewTheme',
    beforeUpdate(chart) {
      if (!chart.canvas.closest('#pulse-home')) return;
      const palettes = { 'chart-bw':['#9ae0cb','#fbbd9f','#ff749b'], 'chart-sessions':['#ff648b','#c1acf0'] };
      const colors = palettes[chart.canvas.id] || ['#ff88aa','#c5aff2','#a6e0d4'];
      chart.data.datasets.forEach((dataset,index) => {
        const color = colors[index % colors.length];
        dataset.borderColor = color;
        dataset.pointBackgroundColor = color;
        dataset.pointBorderColor = '#20121d';
        dataset.pointHoverBackgroundColor = '#ffe2ec';
        dataset.borderWidth = 2;
        const area=chart.chartArea;
        if (area) {
          const fill=chart.ctx.createLinearGradient(0,area.top,0,area.bottom);
          fill.addColorStop(0,color+'70'); fill.addColorStop(1,color+'04');
          dataset.backgroundColor=fill;
        } else dataset.backgroundColor=color+'25';
      });
      Object.values(chart.options.scales || {}).forEach(scale => {
        if (scale.ticks) scale.ticks.color='#b9a6ba';
        if (scale.grid) scale.grid.color='#deb5ce12';
        if (scale.border) scale.border.color='#deb5ce20';
        if (scale.title) scale.title.color='#b9a6ba';
      });
      const plugins=chart.options.plugins;
      if (plugins && plugins.legend && plugins.legend.labels) plugins.legend.labels.color='#dcc7d8';
      if (plugins && plugins.tooltip) Object.assign(plugins.tooltip,{
        backgroundColor:'#241422',titleColor:'#ffe7f0',bodyColor:'#dec5d9',
        borderColor:'#ff8eaf55',borderWidth:1,padding:12,cornerRadius:12
      });
    },
    beforeDatasetDraw(chart) {
      if (!chart.canvas.closest('#pulse-home')) return;
      chart.ctx.save(); chart.ctx.shadowColor='#fa5f8d55'; chart.ctx.shadowBlur=9;
    },
    afterDatasetDraw(chart) { if (chart.canvas.closest('#pulse-home')) chart.ctx.restore(); }
  });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selectedDate = '';
  let shownWeek = '';
  let hasPlan = false;

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node && node.textContent !== value) node.textContent = value;
  }

  function syncReactor() {
    if (typeof window.getViewedMondayISO !== 'function') return;
    const monday = window.getViewedMondayISO();
    const today = window.todayISO();
    const plans = window.getPlannedSessions();
    const dates = Array.from({ length: 7 }, (_, index) => window.shiftISODate(monday, index));
    if (shownWeek !== monday || !dates.includes(selectedDate)) {
      shownWeek = monday;
      selectedDate = dates.find(date => date >= today && plans[date] && plans[date].exercises && plans[date].exercises.length)
        || (dates.includes(today) ? today : dates[0]);
    }
    const plan = plans[selectedDate];
    const exercises = plan && Array.isArray(plan.exercises) ? plan.exercises : [];
    hasPlan = exercises.length > 0;
    const dateLabel = new Intl.DateTimeFormat('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' }).format(window.parseISODate(selectedDate));
    const title = hasPlan ? (plan.type || 'Planerat pass') : 'Planera ditt pass';
    let summary = 'Välj övningar och upplägg';
    if (hasPlan) {
      summary = exercises.length + (exercises.length === 1 ? ' övning' : ' övningar');
      if (exercises.every(ex => ex.kind !== 'cardio')) {
        const sets = exercises.reduce((total, ex) => total + (Number(ex.sets) || 1), 0);
        summary += ' · ' + sets + ' set';
      } else if (exercises.every(ex => ex.kind === 'cardio')) {
        const minutes = exercises.reduce((total, ex) => total + (Number(ex.time) || 0), 0);
        if (minutes > 0) summary += ' · ' + minutes + ' min';
      }
    }
    setText('reactor-date', dateLabel);
    setText('reactor-title', title);
    setText('reactor-summary', summary);
    setText('reactor-action', hasPlan ? 'Starta pass' : 'Bygg pass');
    const start = document.getElementById('reactor-start');
    start.disabled = false;
    start.setAttribute('aria-label', (hasPlan ? 'Starta ' : 'Bygg pass: ') + title + ', ' + dateLabel + ', ' + summary);
    document.getElementById('reactor-configure').hidden = !hasPlan;
    document.querySelectorAll('#week-grid .week-day').forEach(function (day, index) {
      if (!dates[index]) return;
      const angle = (-90 + index * 360 / 7) * Math.PI / 180;
      day.style.setProperty('--orbit-x', (50 + 43.2 * Math.cos(angle)) + '%');
      day.style.setProperty('--orbit-y', (50 + 43.2 * Math.sin(angle)) + '%');
      day.dataset.reactorDate = dates[index];
      day.classList.toggle('is-selected', dates[index] === selectedDate);
      day.setAttribute('role', 'button');
      day.setAttribute('tabindex', '0');
      const label = day.querySelector('.wd-name').textContent + ' ' + day.querySelector('.wd-date').textContent + ', ' + day.querySelector('.wd-type').textContent;
      day.setAttribute('aria-label', label + (day.classList.contains('done') ? ', genomfört' : '') + '. Öppna dag.');
      day.setAttribute('aria-pressed', String(dates[index] === selectedDate));
      day.title = label;
      const arc = document.querySelector('[data-day-arc="' + index + '"]');
      if (arc) {
        arc.classList.toggle('is-selected', dates[index] === selectedDate);
        arc.classList.toggle('is-done', day.classList.contains('done'));
      }
    });
  }

  function openSelectedBuilder() {
    if (!selectedDate) return;
    const day = new Intl.DateTimeFormat('sv-SE', { weekday: 'long' }).format(window.parseISODate(selectedDate));
    window.openDayWorkoutBuilder(day, selectedDate);
  }

  function install() {
    const profile = new URLSearchParams(location.search).get('user');
    const query = profile === 'maja' ? '?user=maja' : '';
    const current = document.querySelector('#pulse-header [data-destination="training"]');
    if (current) current.href = location.pathname + query;
    const profileToggle = document.getElementById('exercise-user-toggle');
    const menu = document.getElementById('nav-menu');
    if (profileToggle && menu) menu.prepend(profileToggle);
    document.querySelectorAll('[data-reactor-scroll]').forEach(button => {
      button.addEventListener('click', () => document.getElementById(button.dataset.reactorScroll).scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' }));
    });
    const grid = document.getElementById('week-grid');
    grid.addEventListener('click', function (event) {
      const day = event.target.closest('.week-day');
      if (!day || !day.dataset.reactorDate) return;
      selectedDate = day.dataset.reactorDate;
      syncReactor();
      // The original day click continues to its existing configuration dialog.
    }, true);
    grid.addEventListener('keydown', function (event) {
      const day = event.target.closest('.week-day');
      if (day && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        day.click();
      }
    });
    document.getElementById('reactor-start').addEventListener('click', function () {
      if (hasPlan) window.startWorkoutSessionForDate(selectedDate);
      else openSelectedBuilder();
    });
    document.getElementById('reactor-configure').addEventListener('click', openSelectedBuilder);
    new MutationObserver(syncReactor).observe(grid, { childList: true });
    syncReactor();
    const log = document.getElementById('log-body');
    function decorateLog() {
      log.closest('table').setAttribute('role','table');
      log.setAttribute('role','rowgroup');
      log.querySelectorAll('tr').forEach(row => {
        row.setAttribute('role','row');
        row.querySelectorAll(':scope > td').forEach(cell => cell.setAttribute('role','cell'));
        if (row.classList.contains('log-main-row')) row.tabIndex=0;
      });
    }
    log.addEventListener('keydown', event => {
      if (event.target.matches('.log-main-row') && ['Enter',' '].includes(event.key)) {
        event.preventDefault();event.target.click();
      }
    });
    new MutationObserver(decorateLog).observe(log,{childList:true});
    decorateLog();
    // Pause decoration whenever it cannot be seen; this never changes a workout timer.
    const core = document.getElementById('reactor-core');
    let onScreen = true;
    const session = document.getElementById('session-modal');
    function syncMotion() {
      const paused = document.hidden || !onScreen || session.classList.contains('show');
      core.querySelectorAll('.reactor-orbiter,.reactor-atmosphere,.observatory-rays').forEach(el => { el.style.animationPlayState = paused ? 'paused' : 'running'; });
    }
    new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; syncMotion(); }).observe(core);
    new MutationObserver(syncMotion).observe(session, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', syncMotion);
  }
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
