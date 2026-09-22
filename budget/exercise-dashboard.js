/* Training Release V1 / Observatory CP10
   Canonical dashboard presentation owner.
   Consolidates Compact/Observatory switching, Observatory presentation state,
   next-workout adapter and the click-expanded weekly orbit. Workout/session
   persistence remains owned by the existing canonical exercise runtime. */

/* ── Overview mode: Observatory ↔ Compact ───────────────────────── */
(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__trainingOverviewModeInstalled) return;
  window.__trainingOverviewModeInstalled = true;

  var MODES = { observatory:true, compact:true };
  var styleIds = ['training-observatory-environment','training-observatory-composition'];
  var CONTROL_STYLE_ID = 'training-overview-mode-style';
  var CONTROL_STYLE_URL = 'training-overview-mode.css?v=20260916-main-cp8-header-toggle-1';
  var activeAnimations = [];
  var switchToken = 0;

  function resolveMode(value) {
    value = String(value || '').toLowerCase();
    return MODES[value] ? value : 'observatory';
  }

  function currentMode() {
    return resolveMode(document.documentElement.dataset.trainingOverview);
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function ensureControlStyles() {
    var existing = document.getElementById(CONTROL_STYLE_ID);
    if (existing) return existing;
    var link = document.createElement('link');
    link.id = CONTROL_STYLE_ID;
    link.rel = 'stylesheet';
    link.href = CONTROL_STYLE_URL;
    link.addEventListener('load', function () { link.dataset.loaded = 'true'; }, {once:true});
    document.head.appendChild(link);
    return link;
  }

  var controlStyle = ensureControlStyles();
  var headerToggle = null;

  function createControl() {
    headerToggle = document.getElementById('training-overview-toggle');
    if (!headerToggle) return null;
    if (headerToggle.dataset.overviewBound === 'true') return headerToggle;
    headerToggle.dataset.overviewBound = 'true';
    headerToggle.addEventListener('click', function () {
      setModeWithTransition(currentMode() === 'compact' ? 'observatory' : 'compact');
    });
    function reveal() { headerToggle.hidden = false; }
    if (controlStyle.dataset.loaded === 'true' || controlStyle.sheet) reveal();
    else {
      controlStyle.addEventListener('load', reveal, {once:true});
      window.setTimeout(reveal, 1200);
    }
    return headerToggle;
  }

  function updateControl(mode) {
    var button = headerToggle || document.getElementById('training-overview-toggle');
    if (!button) return;
    var compact = mode === 'compact';
    button.setAttribute('aria-pressed', compact ? 'true' : 'false');
    button.setAttribute('aria-label', compact ? 'Compact vy aktiv. Byt till Pulse Observatory' : 'Aktivera Compact vy');
    button.title = compact ? 'Compact vy aktiv' : 'Compact vy';
  }

  var activityAnchor, metricsAnchor;
  function arrangeOverview(mode) {
    var activity=document.getElementById('activity-chart');
    var metrics=document.querySelector('.observatory-metrics');
    var destination=document.getElementById('pulse-activity');
    if (!activity || !metrics || !destination) return;
    if (!activityAnchor) {
      activityAnchor=document.createComment('Compact activity position');
      activity.before(activityAnchor);
      metricsAnchor=document.createComment('Compact metrics position');
      metrics.before(metricsAnchor);
    }
    if (mode==='observatory') {
      destination.append(activity,metrics);
    } else {
      activityAnchor.after(activity);
      metricsAnchor.after(metrics);
    }
  }

  function setAssetState(mode) {
    var enabled = mode === 'observatory';
    styleIds.forEach(function (id) {
      var link = document.getElementById(id);
      if (link) link.disabled = !enabled;
    });
  }

  function setVisibility(mode) {
    document.querySelectorAll('.observatory-only').forEach(function (node) {
      node.hidden = mode !== 'observatory';
    });
    document.querySelectorAll('.compact-only').forEach(function (node) {
      node.hidden = mode !== 'compact';
    });
  }

  function renderChartsSoon() {
    if (typeof window.renderCharts !== 'function') return;
    requestAnimationFrame(function () {
      try { window.renderCharts(); } catch (_) {}
    });
  }

  function applyMode(value, options) {
    options = options || {};
    var mode = resolveMode(value);
    var previous = currentMode();
    document.documentElement.dataset.trainingOverview = mode;
    if (document.body) document.body.classList.toggle('pulse-observatory', mode === 'observatory');
    arrangeOverview(mode);
    setAssetState(mode);
    setVisibility(mode);
    updateControl(mode);

    if (!options.silent) {
      window.dispatchEvent(new CustomEvent('training-overview-change', {
        detail:{ mode:mode, previous:previous }
      }));
      if (!options.deferCharts) renderChartsSoon();
    }
    return mode;
  }

  function cancelAnimations() {
    activeAnimations.forEach(function (animation) {
      try { animation.cancel(); } catch (_) {}
    });
    activeAnimations = [];
  }

  function visibleContent(root) {
    if (!root) return [];
    var viewportTop = -80;
    var viewportBottom = window.innerHeight + 120;
    return Array.prototype.slice.call(root.children).filter(function (node) {
      if (node.hidden || !node.getClientRects().length) return false;
      var rect = node.getBoundingClientRect();
      return rect.bottom > viewportTop && rect.top < viewportBottom;
    });
  }

  function animateNodes(nodes, keyframes, options) {
    if (!nodes.length || typeof nodes[0].animate !== 'function') return Promise.resolve();
    var animations = nodes.map(function (node) { return node.animate(keyframes, options); });
    activeAnimations = animations;
    return Promise.all(animations.map(function (animation) {
      return animation.finished.catch(function () {});
    }));
  }

  var scrollCommitFrame = 0;
  var scrollRestore = null;
  function commitAtSameScroll(mode, options) {
    cancelAnimationFrame(scrollCommitFrame);
    if (scrollRestore) scrollRestore();
    var x = window.scrollX;
    var y = window.scrollY;
    var html = document.documentElement;
    var previousBehavior = html.style.scrollBehavior;
    var previousAnchor = html.style.overflowAnchor;

    html.style.scrollBehavior = 'auto';
    html.style.overflowAnchor = 'none';
    applyMode(mode, options);
    window.scrollTo(x, y);

    scrollRestore = function () {
      html.style.scrollBehavior = previousBehavior;
      html.style.overflowAnchor = previousAnchor;
      scrollRestore = null;
    };
    scrollCommitFrame = requestAnimationFrame(function () {
      window.scrollTo(x, y);
      scrollCommitFrame = requestAnimationFrame(function () { if (scrollRestore) scrollRestore(); });
    });
  }

  function setModeWithTransition(value) {
    var mode = resolveMode(value);
    if (mode === currentMode()) {
      updateControl(mode);
      return mode;
    }

    var token = ++switchToken;
    var root = document.getElementById('pulse-home') || document.querySelector('.main-content');
    cancelAnimations();

    if (prefersReducedMotion() || !root || typeof Element.prototype.animate !== 'function') {
      commitAtSameScroll(mode);
      return mode;
    }

    // Commit the chosen mode immediately; stale animation completions do no work.
    commitAtSameScroll(mode, {deferCharts:true});
    requestAnimationFrame(function () {
      if (token !== switchToken) return;
      var incoming = visibleContent(root);
      animateNodes(incoming, [
        {opacity:.72, transform:'translate3d(0,3px,0)'},
        {opacity:1, transform:'translate3d(0,0,0)'}
      ], {duration:180, easing:'cubic-bezier(.22,1,.36,1)', fill:'both'}).then(function () {
        if (token !== switchToken) return;
        cancelAnimations();
        renderChartsSoon();
      });
    });

    return mode;
  }

  function initialMode() {
    var requested = new URLSearchParams(window.location.search).get('overview');
    return requested === 'compact' ? 'compact' : 'observatory';
  }

  window.getTrainingOverviewMode = currentMode;
  window.setTrainingOverviewMode = function (mode) { return setModeWithTransition(mode); };

  function install() {
    createControl();
    applyMode(initialMode(), {silent:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();

/* ── Observatory presentation adapter ───────────────────────────── */
(function () {
  'use strict';

  if (window.__exerciseDashboardObservatoryInstalled) return;
  window.__exerciseDashboardObservatoryInstalled = true;

  function overviewMode() {
    var explicit = document.documentElement.dataset.trainingOverview;
    if (explicit) return explicit;
    var theme = document.documentElement.dataset.trainingTheme;
    if (theme === 'observatory' || (document.body && document.body.classList.contains('pulse-observatory'))) return 'observatory';
    return 'reactor';
  }

  function pulseOverviewActive() { return overviewMode() !== 'compact'; }

  if (window.Chart && !window.__exerciseDashboardChartThemeInstalled) {
    window.__exerciseDashboardChartThemeInstalled = true;
    Chart.register({
      id: 'pulseOverviewTheme',
      beforeUpdate:function(chart) {
        if (chart.canvas.id === 'chart-sessions' && chart.config && chart.config.type === 'bar') return;
        if (!pulseOverviewActive() || !chart.canvas.closest('#pulse-home')) return;
        var palettes = { 'chart-bw':['#65d7a5'], 'chart-sessions':['#ff657a','#a8b0ba'], 'chart-run-pace':['#f87171'], 'chart-hr-combined':['#ef646f','#67d4e4','#a8b0ba'] };
        var colors = palettes[chart.canvas.id];
        chart.data.datasets.forEach(function(dataset,index) {
          var color = colors ? colors[index % colors.length] : dataset.borderColor;
          if (typeof color !== 'string') return;
          dataset.borderColor = color;
          dataset.pointBackgroundColor = color;
          dataset.pointBorderColor = '#090d12';
          dataset.pointHoverBackgroundColor = '#fff1ea';
          dataset.borderWidth = 2;
          if (dataset.pointRadius !== 0) {
            dataset.pointRadius = 2;
            dataset.pointHoverRadius = 4;
            dataset.pointHitRadius = 16;
          }
          var area=chart.chartArea;
          if (area) {
            var fill=chart.ctx.createLinearGradient(0,area.top,0,area.bottom);
            fill.addColorStop(0,color+'24'); fill.addColorStop(1,color+'02');
            dataset.backgroundColor=fill;
          } else dataset.backgroundColor=color+'14';
        });
        Object.values(chart.options.scales || {}).forEach(function(scale) {
          if (scale.ticks) {
            scale.ticks.color='#a8b0ba';
            scale.ticks.font = Object.assign({}, scale.ticks.font, { family:'Inter', size:12 });
            scale.ticks.maxRotation = 0;
            scale.ticks.autoSkip = true;
          }
          if (scale.grid) scale.grid.color='#ffffff09';
          if (scale.border) scale.border.color='#ffffff15';
          if (scale.title) scale.title.color='#a8b0ba';
        });
        chart.options.interaction = {mode:'index', intersect:false};
        chart.options.events = ['mousemove','mouseout','click','touchstart','touchmove'];
        var plugins=chart.options.plugins;
        if (plugins && plugins.legend && plugins.legend.labels) plugins.legend.labels.color='#dce0e5';
        if (plugins && plugins.tooltip) Object.assign(plugins.tooltip,{
          backgroundColor:'#121820',titleColor:'#f2f3f5',bodyColor:'#c5cbd3',
          borderColor:'#ff657a55',borderWidth:1,padding:12,cornerRadius:10,titleFont:{family:'Inter',size:13},bodyFont:{family:'Inter',size:13}
        });
        var units = {'chart-bw':'ml/kg/min','chart-sessions':'pass','chart-hr-combined':'bpm','chart-run-pace':'min/km'};
        var unit = units[chart.canvas.id] || '';
        if (plugins && plugins.tooltip && ['chart-bw','chart-sessions'].includes(chart.canvas.id)) {
          plugins.tooltip.callbacks = Object.assign({}, plugins.tooltip.callbacks, {
            label:function(context) {
              var value = context.parsed && context.parsed.y;
              return context.dataset.label + ': ' + (value == null ? '—' : new Intl.NumberFormat('sv-SE', {maximumFractionDigits:1}).format(value) + ' ' + unit);
            }
          });
        }
        var summary = chart.data.datasets.filter(function(dataset) { return !dataset.borderDash; }).map(function(dataset) {
          return dataset.label + ': ' + dataset.data.map(function(value,index) {
            return value == null ? '' : String(chart.data.labels[index] || '') + ' ' + value + ' ' + unit;
          }).filter(Boolean).join(', ');
        }).join('. ');
        chart.canvas.setAttribute('role','img');
        chart.canvas.setAttribute('aria-label', summary || 'Ingen träningsdata ännu');
      },
      afterDraw:function(chart) {
        if (chart.canvas.id === 'chart-sessions' && chart.config && chart.config.type === 'bar') return;
        if (!pulseOverviewActive() || !chart.canvas.closest('#pulse-home') || !chart.chartArea) return;
        var hasData = chart.data.datasets.some(function(dataset) {
          return dataset.data.some(function(value) { return value != null && Number.isFinite(Number(value)); });
        });
        if (chart.canvas.id === 'chart-sessions' && typeof window.getWorkouts === 'function') hasData = window.getWorkouts().length > 0;
        if (hasData) return;
        var area = chart.chartArea;
        chart.ctx.save();
        chart.ctx.fillStyle = '#a8b0ba';
        chart.ctx.font = '13px Inter, sans-serif';
        chart.ctx.textAlign = 'center';
        chart.ctx.fillText('Visas när du har loggat ett pass', (area.left + area.right) / 2, (area.top + area.bottom) / 2);
        chart.ctx.restore();
        chart.canvas.setAttribute('aria-label','Ingen träningsdata ännu. Visas när du har loggat ett pass.');
      }
    });
  }

  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var selectedDate = '';
  var shownWeek = '';
  var hasPlan = false;

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node && node.textContent !== value) node.textContent = value;
  }

  var observatoryStates = new Set(['pending', 'current', 'completed', 'goal-achieved']);

  function setObservatoryState(node, state) {
    if (!node || !observatoryStates.has(state)) return;
    if (node.dataset.observatoryState !== state) node.dataset.observatoryState = state;
  }

  function numericNodeValue(id) {
    var node = document.getElementById(id);
    if (!node) return 0;
    var source = ('value' in node && node.value !== '') ? node.value : node.textContent;
    var value = Number.parseFloat(String(source || '').replace(',', '.'));
    return Number.isFinite(value) ? value : 0;
  }

  function progressState(bar) {
    if (!bar) return 'pending';
    var value = Number.parseFloat(String(bar.style.width || '0').replace('%', ''));
    if (Number.isFinite(value) && value >= 99.5) return 'goal-achieved';
    return 'pending';
  }

  function syncObservatoryStates() {
    var goals = typeof window.getGoals === 'function' ? window.getGoals() : { weeklyWk: 4 };
    var weeklyGoal = Number(goals && goals.weeklyWk) || 4;
    var weekCount = numericNodeValue('sw-cnt');
    var duration = numericNodeValue('dur-wk');
    var total = numericNodeValue('total-cnt');
    var last = document.getElementById('last-d');
    var hasLast = !!(last && String(last.textContent || '').trim() && String(last.textContent).trim() !== '—');

    setObservatoryState(document.querySelector('.observatory-metrics .stat-week'), weekCount >= weeklyGoal ? 'goal-achieved' : 'pending');
    setObservatoryState(document.querySelector('.observatory-metrics .stat-total'), total > 0 ? 'completed' : 'pending');
    setObservatoryState(document.querySelector('.observatory-metrics .stat-duration'), duration > 0 ? 'completed' : 'pending');
    setObservatoryState(document.querySelector('.observatory-metrics .stat-last'), hasLast ? 'completed' : 'pending');

    document.querySelectorAll('#week-grid .week-day').forEach(function(day) {
      var state = (day.classList.contains('is-selected') || day.classList.contains('today'))
        ? 'current'
        : day.classList.contains('done')
          ? 'completed'
          : 'pending';
      setObservatoryState(day, state);
    });

    document.querySelectorAll('#pulse-goals .goal-card').forEach(function(card) {
      var state = progressState(card.querySelector('.progress-bar'));
      setObservatoryState(card, state);
      card.querySelectorAll('.progress-bar,.progress-marker,.goal-nums').forEach(function(node) { setObservatoryState(node, state); });
    });

    var start = document.getElementById('reactor-start');
    if (start) setObservatoryState(start, start.dataset.planState === 'planned' ? 'current' : 'pending');
  }

  function workoutList() {
    return typeof window.getWorkouts === 'function' ? window.getWorkouts() : [];
  }

  function workoutKind(plan, exercises) {
    var type = String(plan && plan.type || '').toLowerCase();
    if (exercises.length && exercises.every(function(exercise) { return exercise && exercise.kind === 'cardio'; })) return 'cardio';
    if (exercises.some(function(exercise) { return exercise && exercise.kind === 'cardio'; }) || /kond|cardio|löp|run|intervall/.test(type)) return 'cardio';
    return 'strength';
  }

  function syncReactor() {
    if (typeof window.getViewedMondayISO !== 'function') return;
    var monday = window.getViewedMondayISO();
    var today = window.todayISO();
    var plans = window.getPlannedSessions();
    var dates = Array.from({ length: 7 }, function(_, index) { return window.shiftISODate(monday, index); });
    if (shownWeek !== monday || !dates.includes(selectedDate)) {
      shownWeek = monday;
      selectedDate = dates.find(function(date) { return date >= today && plans[date] && plans[date].exercises && plans[date].exercises.length; })
        || (dates.includes(today) ? today : dates[0]);
    }
    var plan = plans[selectedDate];
    var exercises = plan && Array.isArray(plan.exercises) ? plan.exercises : [];
    hasPlan = exercises.length > 0;
    var dateLabel = new Intl.DateTimeFormat('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' }).format(window.parseISODate(selectedDate));
    var title = hasPlan ? (plan.type || 'Planerat pass') : 'Din nästa rörelse';
    var summary = 'Välj ett upplägg eller bygg ditt eget.';
    if (hasPlan) {
      summary = exercises.length + (exercises.length === 1 ? ' övning' : ' övningar');
      if (exercises.every(function(ex) { return ex.kind !== 'cardio'; })) {
        var sets = exercises.reduce(function(total, ex) { return total + (Number(ex.sets) || 1); }, 0);
        summary += ' · ' + sets + ' set';
      } else if (exercises.every(function(ex) { return ex.kind === 'cardio'; })) {
        var minutes = exercises.reduce(function(total, ex) { return total + (Number(ex.time) || 0); }, 0);
        if (minutes > 0) summary += ' · ' + minutes + ' min';
      }
    }
    setText('reactor-date', dateLabel);
    setText('reactor-title', title);
    setText('reactor-summary', summary);
    setText('observatory-day-detail', dateLabel + ' · ' + (hasPlan
      ? title + ' · ' + exercises.map(function(ex) { return ex.name || 'Övning'; }).join(', ')
      : 'Inget pass planerat. Välj dagen för att lägga till ett pass.'));
    var core = document.getElementById('reactor-core');
    if (!core) return;
    var kind = workoutKind(plan, exercises);
    core.dataset.workoutKind = kind;
    var stage = core.closest('.observatory-stage');
    if (stage) stage.dataset.workoutKind = kind;
    core.dataset.planState = hasPlan ? 'planned' : 'empty';
    var start = document.getElementById('reactor-start');
    if (start) {
      start.disabled = false;
      start.dataset.planState = hasPlan ? 'planned' : 'empty';
      start.querySelector('.observatory-next-orb-label').textContent = hasPlan ? 'Starta pass' : 'Välj pass';
      start.setAttribute('aria-label', hasPlan ? ('Starta nästa pass: ' + title + ', ' + dateLabel + ', ' + summary) : 'Välj eller bygg ett träningspass');
    }
    document.querySelectorAll('#week-grid .week-day').forEach(function(day, index) {
      if (!dates[index]) return;
      var angle = (-90 + index * 360 / 7) * Math.PI / 180;
      day.style.setProperty('--orbit-x', (50 + 43.2 * Math.cos(angle)) + '%');
      day.style.setProperty('--orbit-y', (50 + 43.2 * Math.sin(angle)) + '%');
      day.dataset.reactorDate = dates[index];
      day.classList.toggle('is-selected', dates[index] === selectedDate);
      day.setAttribute('role', 'button');
      day.setAttribute('tabindex', '0');
      var nameNode = day.querySelector('.wd-name');
      var dateNode = day.querySelector('.wd-date');
      var typeNode = day.querySelector('.wd-type');
      var label = (nameNode ? nameNode.textContent : '') + ' ' + (dateNode ? dateNode.textContent : '') + ', ' + (typeNode ? typeNode.textContent : '');
      day.setAttribute('aria-label', label + (day.classList.contains('done') ? ', genomfört' : '') + '. Öppna dag.');
      day.setAttribute('aria-pressed', String(dates[index] === selectedDate));
      if (dates[index] === today) day.setAttribute('aria-current', 'date');
      else day.removeAttribute('aria-current');
      day.title = label;
      var arc = document.querySelector('[data-day-arc="' + index + '"]');
      if (arc) {
        arc.classList.toggle('is-selected', dates[index] === selectedDate);
        arc.classList.toggle('is-done', day.classList.contains('done'));
      }
    });
    syncObservatoryStates();
    renderTemplateChoices();
  }

  function openSelectedBuilder(template) {
    if (!selectedDate) return;
    var day = new Intl.DateTimeFormat('sv-SE', { weekday: 'long' }).format(window.parseISODate(selectedDate));
    window.openDayWorkoutBuilder(day, selectedDate);
    // Fill a draft through the existing editor. Saving remains explicit.
    if (template && Array.isArray(template.exercises)) {
      document.getElementById('day-workout-type').value = template.type || template.name || 'Övrigt';
      document.getElementById('day-workout-ex-list').replaceChildren();
      template.exercises.forEach(function(exercise) { window.addDayWorkoutExRow(exercise); });
    }
  }

  var templateSignature = '';
  function renderTemplateChoices() {
    var root = document.getElementById('observatory-template-grid');
    if (!root || !selectedDate || typeof window.getTemplates !== 'function') return;
    var templates = window.getTemplates().filter(function(item) { return item && item.exercises && item.exercises.length; });
    var weeks = typeof window.getWeekTemplates === 'function' ? window.getWeekTemplates() : [];
    var signature = JSON.stringify([templates,weeks,selectedDate]);
    if (signature === templateSignature) return;
    templateSignature = signature;
    setText('observatory-template-hint', 'Välj ett sparat upplägg för ' + new Intl.DateTimeFormat('sv-SE', {weekday:'long',day:'numeric',month:'short'}).format(window.parseISODate(selectedDate)) + '.');
    var fragment = document.createDocumentFragment();
    function card(name, detail, glyph, action) {
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'observatory-template-card';
      var icon = document.createElement('span'); icon.className = 'observatory-template-glyph'; icon.textContent = glyph; icon.setAttribute('aria-hidden','true');
      var title = document.createElement('strong'); title.textContent = name;
      var meta = document.createElement('span'); meta.className = 'observatory-template-meta'; meta.textContent = detail;
      button.append(icon,title,meta); button.addEventListener('click',action); fragment.appendChild(button);
    }
    templates.forEach(function(template) {
      card(template.name || template.type || 'Mallpass', template.exercises.length + ' övningar · Förhandsgranska', '⌁', function() { openSelectedBuilder(template); });
    });
    weeks.forEach(function(template) {
      card(template.name || 'Veckomall', 'Veckoupplägg · Välj vecka', '◌', function() {
        window.openTemplateModal(); document.getElementById('template-pick').value = String(template.id);
      });
    });
    if (!templates.length && !weeks.length) {
      var empty=document.createElement('p');
      empty.className='observatory-template-empty';
      empty.textContent='Dina sparade pass visas här. Börja med att bygga ett pass.';
      fragment.appendChild(empty);
    }
    root.replaceChildren(fragment);
  }

  function install() {
    var profile = new URLSearchParams(location.search).get('user');
    var query = profile === 'maja' ? '?user=maja' : '';
    var current = document.querySelector('#pulse-header [data-destination="training"]');
    if (current) current.href = location.pathname + query;
    var profileToggle = document.getElementById('exercise-user-toggle');
    var menu = document.getElementById('nav-menu');
    if (profileToggle && menu) menu.prepend(profileToggle);

    document.querySelectorAll('[data-reactor-scroll]').forEach(function(button) {
      button.addEventListener('click', function() {
        var target = document.getElementById(button.dataset.reactorScroll);
        if (target) target.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
      });
    });
    var jumpButtons = Array.from(document.querySelectorAll('[data-reactor-scroll]'));
    var jumpTargets = jumpButtons.map(function(button) { return document.getElementById(button.dataset.reactorScroll); }).filter(Boolean);
    function markActiveJump(id) {
      jumpButtons.forEach(function(button) {
        var active = button.dataset.reactorScroll === id;
        if (active) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
    }
    markActiveJump(jumpTargets[0] && jumpTargets[0].id);
    if (jumpTargets.length && 'IntersectionObserver' in window) {
      var jumpObserver = new IntersectionObserver(function(entries) {
        var visible = entries.filter(function(entry) { return entry.isIntersecting; }).sort(function(a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
        if (visible) markActiveJump(visible.target.id);
      }, { rootMargin: '-18% 0px -58% 0px', threshold: [0, .25, .5] });
      jumpTargets.forEach(function(target) { jumpObserver.observe(target); });
    }

    var grid = document.getElementById('week-grid');
    if (!grid) return;
    grid.addEventListener('click', function (event) {
      var day = event.target.closest('.week-day');
      if (!day || !day.dataset.reactorDate) return;
      selectedDate = day.dataset.reactorDate;
      syncReactor();
    }, true);
    grid.addEventListener('keydown', function (event) {
      var day = event.target.closest('.week-day');
      if (day && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        day.click();
      }
    });

    var startButton = document.getElementById('reactor-start');
    if (startButton) startButton.addEventListener('click', function () {
      if (hasPlan) { window.startWorkoutSessionForDate(selectedDate); return; }
      var choices=document.getElementById('observatory-templates-title');
      choices.focus({preventScroll:true});
      choices.scrollIntoView({behavior:reduced.matches ? 'instant' : 'smooth',block:'start'});
    });
    var buildButton=document.getElementById('observatory-build');
    if (buildButton) buildButton.addEventListener('click',function(){openSelectedBuilder();});
    var templateManage = document.getElementById('observatory-manage-templates');
    if (templateManage) templateManage.addEventListener('click', function() { window.openTemplateModal(); });
    ['wk-template-select','template-pick'].forEach(function(id) {
      var select = document.getElementById(id);
      if (select) new MutationObserver(renderTemplateChoices).observe(select, {childList:true});
    });

    new MutationObserver(syncReactor).observe(grid, { childList: true });
    var semanticObserver = new MutationObserver(syncObservatoryStates);
    var metricRoot = document.querySelector('.observatory-metrics');
    var goalRoot = document.getElementById('pulse-goals');
    if (metricRoot) semanticObserver.observe(metricRoot, { subtree: true, childList: true, characterData: true });
    if (goalRoot) semanticObserver.observe(goalRoot, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style'] });
    syncReactor();
    syncObservatoryStates();
    window.addEventListener('firebase-sync', syncReactor);

    var log = document.getElementById('log-body');
    if (log) {
      function decorateLog() {
        var table = log.closest('table');
        if (table) table.setAttribute('role','table');
        log.setAttribute('role','rowgroup');
        log.querySelectorAll('tr').forEach(function(row) {
          row.setAttribute('role','row');
          row.querySelectorAll(':scope > td').forEach(function(cell) { cell.setAttribute('role','cell'); });
          if (row.classList.contains('log-main-row')) row.tabIndex=0;
        });
      }
      log.addEventListener('keydown', function(event) {
        if (event.target.matches('.log-main-row') && ['Enter',' '].includes(event.key)) {
          event.preventDefault();event.target.click();
        }
      });
      new MutationObserver(decorateLog).observe(log,{childList:true});
      decorateLog();
    }

    var core = document.getElementById('reactor-core');
    var session = document.getElementById('session-modal');
    if (core && session) {
      var onScreen = true;
      function syncMotion() {
        var paused = document.documentElement.dataset.wellnessMode === 'zen' || !pulseOverviewActive() || document.hidden || !onScreen || session.classList.contains('show');
        var motionState = paused ? 'paused' : 'running';
        var sceneRoot = core.closest('.observatory-stage') || core;
        sceneRoot.style.setProperty('--pulse-scene-motion', motionState);
        core.querySelectorAll('.reactor-orbiter,.reactor-atmosphere').forEach(function(el) { el.style.animationPlayState = paused ? 'paused' : 'running'; });
      }
      if ('IntersectionObserver' in window) new IntersectionObserver(function(entries) { onScreen = entries[0].isIntersecting; syncMotion(); }).observe(core);
      new MutationObserver(syncMotion).observe(session, { attributes: true, attributeFilter: ['class'] });
      document.addEventListener('visibilitychange', syncMotion);
      window.addEventListener('wellness-mode-change', syncMotion);
      window.addEventListener('training-overview-change', function () { syncReactor(); syncMotion(); });
      syncMotion();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();

/* ── Canonical weekly plan: linear ↔ Observatory orbit ─────────── */
(function () {
  'use strict';

  if (window.__exerciseDashboardWeekOrbitInstalled) return;
  window.__exerciseDashboardWeekOrbitInstalled = true;

  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var weekOrbitProgress = 0;
  var weekOrbitLayout = null;
  var weekOrbitRaf = 0;
  var weekOrbitAnimation = null;
  var weekOrbitShell = null;
  var weekOrbitToggle = null;

  function overviewMode() {
    var explicit = document.documentElement.dataset.trainingOverview;
    if (explicit) return explicit;
    return document.body && document.body.classList.contains('pulse-observatory') ? 'observatory' : 'compact';
  }

  function orbitAvailable() { return overviewMode() === 'observatory'; }
  function clamp01(value) { return Math.max(0, Math.min(1, value)); }
  function mix(from, to, progress) { return from + (to - from) * progress; }
  function easeOutCubic(value) { return 1 - Math.pow(1 - value, 3); }

  function clearOrbitInlineStyles(layout) {
    if (!layout) return;
    layout.days.forEach(function(day) {
      day.style.removeProperty('--week-orbit-x');
      day.style.removeProperty('--week-orbit-y');
      day.style.removeProperty('--week-orbit-width');
      day.style.removeProperty('--week-orbit-height');
      day.style.removeProperty('--week-orbit-radius');
      day.style.removeProperty('--week-orbit-node-progress');
    });
    layout.grid.style.removeProperty('height');
    layout.grid.style.removeProperty('--week-orbit-progress');
    layout.shell.style.removeProperty('--week-orbit-progress');
    layout.shell.style.removeProperty('--week-orbit-diameter');
    layout.shell.style.removeProperty('--week-orbit-center-y');
    layout.grid.classList.remove('week-orbit-layout');
  }

  function deactivateOrbitLayout() {
    clearOrbitInlineStyles(weekOrbitLayout);
    weekOrbitLayout = null;
  }

  function captureOrbitLayout() {
    var grid = document.getElementById('week-grid');
    if (!grid || !weekOrbitShell) return null;
    var days = Array.from(grid.querySelectorAll('.week-day'));
    if (days.length !== 7) return null;

    if (weekOrbitLayout && weekOrbitLayout.days.length === days.length && weekOrbitLayout.days.every(function(day, index) { return day === days[index]; })) {
      return weekOrbitLayout;
    }

    deactivateOrbitLayout();
    var gridRect = grid.getBoundingClientRect();
    var bases = days.map(function(day) {
      var rect = day.getBoundingClientRect();
      return {
        x: rect.left - gridRect.left + rect.width / 2,
        y: rect.top - gridRect.top + rect.height / 2,
        width: rect.width,
        height: rect.height
      };
    });
    var collapsedHeight = Math.max(gridRect.height, Math.max.apply(null, bases.map(function(base) { return base.y + base.height / 2; })));
    weekOrbitLayout = { grid:grid, shell:weekOrbitShell, days:days, bases:bases, collapsedHeight:collapsedHeight };
    grid.classList.add('week-orbit-layout');
    grid.style.height = collapsedHeight + 'px';
    return weekOrbitLayout;
  }

  function updateOrbitControl() {
    if (!weekOrbitToggle) return;
    var destination = weekOrbitAnimation ? weekOrbitAnimation.to : weekOrbitProgress;
    var expanded = destination >= .5;
    weekOrbitToggle.setAttribute('aria-expanded', String(expanded));
    weekOrbitToggle.setAttribute('aria-label', expanded ? 'Fäll ihop veckoplanens orbitvy' : 'Expandera veckoplanen till orbitvy');
  }

  function renderOrbitProgress() {
    if (!weekOrbitLayout && weekOrbitProgress > 0) captureOrbitLayout();
    var layout = weekOrbitLayout;
    if (!layout) {
      updateOrbitControl();
      return;
    }

    var progress = clamp01(weekOrbitProgress);
    var gridRect = layout.grid.getBoundingClientRect();
    var width = Math.max(1, gridRect.width || layout.shell.clientWidth || 1);
    var expandedHeight = Math.min(430, Math.max(286, width * .92));
    var nodeSize = width < 340 ? 48 : width < 430 ? 52 : 58;
    var radius = Math.min(width * .39, expandedHeight * .39);
    var centerX = width / 2;
    var centerY = expandedHeight / 2;

    layout.grid.style.height = mix(layout.collapsedHeight, expandedHeight, progress) + 'px';
    layout.grid.style.setProperty('--week-orbit-progress', progress.toFixed(4));
    layout.shell.style.setProperty('--week-orbit-progress', progress.toFixed(4));
    layout.shell.style.setProperty('--week-orbit-diameter', (radius * 2) + 'px');
    layout.shell.style.setProperty('--week-orbit-center-y', centerY + 'px');

    layout.days.forEach(function(day, index) {
      var angle = (-90 + index * 360 / 7) * Math.PI / 180;
      var targetX = centerX + radius * Math.cos(angle);
      var targetY = centerY + radius * Math.sin(angle);
      var base = layout.bases[index];
      day.style.setProperty('--week-orbit-x', mix(base.x, targetX, progress) + 'px');
      day.style.setProperty('--week-orbit-y', mix(base.y, targetY, progress) + 'px');
      day.style.setProperty('--week-orbit-width', mix(base.width, nodeSize, progress) + 'px');
      day.style.setProperty('--week-orbit-height', mix(base.height, nodeSize, progress) + 'px');
      day.style.setProperty('--week-orbit-radius', (progress * 50) + '%');
      day.style.setProperty('--week-orbit-node-progress', progress.toFixed(4));
    });

    var section = layout.grid.closest('.observatory-week');
    if (section) {
      section.dataset.weekOrbitState = weekOrbitAnimation ? 'settling' : progress >= .999 ? 'expanded' : progress <= .001 ? 'collapsed' : 'transitioning';
    }
    updateOrbitControl();
  }

  function requestOrbitFrame() {
    if (!weekOrbitRaf) weekOrbitRaf = requestAnimationFrame(orbitFrame);
  }

  function orbitFrame(now) {
    weekOrbitRaf = 0;
    if (!weekOrbitAnimation) {
      renderOrbitProgress();
      return;
    }
    if (!weekOrbitAnimation.startedAt) weekOrbitAnimation.startedAt = now;
    var elapsed = now - weekOrbitAnimation.startedAt;
    var raw = Math.min(1, elapsed / weekOrbitAnimation.duration);
    weekOrbitProgress = mix(weekOrbitAnimation.from, weekOrbitAnimation.to, easeOutCubic(raw));
    renderOrbitProgress();
    if (raw < 1) {
      requestOrbitFrame();
      return;
    }
    var target = weekOrbitAnimation.to;
    weekOrbitAnimation = null;
    weekOrbitProgress = target;
    renderOrbitProgress();
    if (target === 0) deactivateOrbitLayout();
  }

  function settleOrbit(target, immediate) {
    target = target ? 1 : 0;
    if (target && !orbitAvailable()) return;
    if (target && !captureOrbitLayout()) return;
    weekOrbitAnimation = null;
    if (immediate || reduced.matches) {
      weekOrbitProgress = target;
      renderOrbitProgress();
      if (!target) deactivateOrbitLayout();
      return;
    }
    weekOrbitAnimation = {
      from: weekOrbitProgress,
      to: target,
      duration: 320,
      startedAt: 0
    };
    requestOrbitFrame();
  }

  function recaptureOrbitAfterLayoutChange() {
    var progress = weekOrbitProgress;
    if (!weekOrbitLayout && progress <= 0) return;
    if (weekOrbitLayout) {
      clearOrbitInlineStyles(weekOrbitLayout);
      weekOrbitLayout = null;
    }
    if (progress > 0 && orbitAvailable()) {
      captureOrbitLayout();
      weekOrbitProgress = progress;
      renderOrbitProgress();
    }
  }

  function install() {
    var grid = document.getElementById('week-grid');
    weekOrbitShell = document.querySelector('[data-week-orbit-shell]');
    weekOrbitToggle = document.querySelector('[data-week-orbit-toggle]');
    if (!grid || !weekOrbitShell || !weekOrbitToggle) return;

    weekOrbitToggle.addEventListener('click', function () {
      settleOrbit(weekOrbitProgress < .5, false);
    });

    new MutationObserver(function () {
      if (weekOrbitProgress > 0) recaptureOrbitAfterLayoutChange();
    }).observe(grid, { childList: true });

    window.addEventListener('resize', function () {
      if (weekOrbitProgress > 0 && orbitAvailable()) recaptureOrbitAfterLayoutChange();
    }, { passive: true });

    window.addEventListener('training-overview-change', function () {
      if (!orbitAvailable() && weekOrbitProgress > 0) settleOrbit(0, true);
    });

    updateOrbitControl();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
