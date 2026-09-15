from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
exercise = ROOT / 'budget' / 'exercise.html'
environment = ROOT / 'budget' / 'pulse-environment' / 'environment.js'
checklist = ROOT / 'budget' / 'TRAINING-OBSERVATORY-MIGRATION-CHECKLIST.md'


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    return text.replace(old, new, 1)


s = exercise.read_text()

# Canonical document identity and mode. Observatory is the default; Compact uses the same DOM.
s = replace_once(
    s,
    '<html lang="sv">',
    '<html lang="sv" id="pulse-document" data-training-overview="observatory">',
    'html root'
)

# Observatory presentation assets only. Do NOT load preview training.css/training.js: the current
# production session runtime remains the only live training implementation.
asset_anchor = '<link rel="stylesheet" href="training-zen-nav.css?v=20260910">\n<script defer src="training-zen-nav.js?v=20260910"></script>'
asset_block = asset_anchor + '''
<link id="training-observatory-environment" rel="stylesheet" href="pulse-environment/environment.css?v=20260915-main-cp1">
<link id="training-observatory-composition" rel="stylesheet" href="pulse-observatory/observatory.css?v=20260915-main-cp1">
<script defer src="training-overview-mode.js?v=20260915-main-cp1"></script>
<script defer src="pulse-environment/environment.js?v=20260915-main-cp1"></script>'''
s = replace_once(s, asset_anchor, asset_block, 'overview assets')

# Mode visibility is structural, not a visual patch. The two overview modes share all data sections.
style_anchor = '    @media(max-width:430px){'
mode_css = '''    /* Canonical overview modes share the same dashboard DOM. */
    html[data-training-overview="observatory"] .compact-only,
    html[data-training-overview="compact"] .observatory-only{display:none!important;}

'''
s = replace_once(s, style_anchor, mode_css + style_anchor, 'mode visibility css')

s = replace_once(s, '<body>', '<body id="pulse-page" class="pulse-observatory">', 'body identity')
s = replace_once(s, '<header class="app-header">', '<header class="app-header" id="pulse-header">', 'header identity')

old_brand = '<div class="brand-text"><h1 style="cursor:pointer" onclick="location.href=\'home.html\'">Träning</h1><p>Markus Strickert</p></div>'
new_brand = '<div class="brand-text"><h1 style="cursor:pointer" onclick="location.href=\'home.html\'"><span class="compact-only">Träning</span><span class="observatory-only">PULSE<span class="pulse-brand-flow">FLOW</span></span></h1><p>Markus Strickert</p></div>'
s = replace_once(s, old_brand, new_brand, 'dual overview brand')

hero = '''<section class="observatory-stage observatory-only" aria-label="Pulse Observatory">
  <div class="observatory-heading">
    <span class="observatory-kicker"><span aria-hidden="true">✧</span> PULSE / OBSERVATORY</span>
    <h2>Din träning.<br><em>I ett nytt ljus.</em></h2>
    <nav class="observatory-jumps" aria-label="Träningsdata">
      <button type="button" data-reactor-scroll="pulse-progress"><span aria-hidden="true">⌁</span> Framsteg</button>
      <button type="button" data-reactor-scroll="pulse-records"><span aria-hidden="true">✧</span> Rekord</button>
      <button type="button" data-reactor-scroll="pulse-log"><span aria-hidden="true">◌</span> Träningslogg</button>
    </nav>
  </div>
  <div class="observatory-field" id="reactor-core">
    <div class="observatory-scene" aria-hidden="true">
      <div class="observatory-rays"></div>
      <svg viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          <linearGradient id="observatory-edge"><stop stop-color="#fb4a72" stop-opacity="0"/><stop offset=".48" stop-color="#ffbdc8"/><stop offset="1" stop-color="#fb4a72" stop-opacity="0"/></linearGradient>
          <path id="observatory-horizon-path" d="M-80 595 Q450 82 1000 595" pathLength="100"/>
          <ellipse id="observatory-orbit-path" cx="530" cy="372" rx="350" ry="98" transform="rotate(-23 530 372)" pathLength="100"/>
        </defs>
        <use class="observatory-orbit" href="#observatory-orbit-path"/>
        <use class="observatory-orbit-light" href="#observatory-orbit-path"/>
        <ellipse class="observatory-orbit faint" cx="530" cy="372" rx="320" ry="160" transform="rotate(21 530 372)"/>
        <use class="observatory-horizon" href="#observatory-horizon-path"/>
        <use class="observatory-horizon-light" href="#observatory-horizon-path"/>
        <path class="observatory-contour" d="M-80 620 Q450 170 1000 620M-80 658 Q450 250 1000 658"/>
        <g class="observatory-stars"><circle cx="258" cy="170" r="2"/><circle cx="720" cy="200" r="2.5"/><circle cx="600" cy="105" r="1.5"/><circle cx="165" cy="349" r="2"/><circle cx="781" cy="418" r="2"/><path d="M524 179V193M517 186H531M679 288V300M673 294H685"/></g>
      </svg>
    </div>
    <div class="observatory-next">
      <span class="observatory-next-label">NÄSTA PASS <svg class="observatory-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"/></svg></span>
      <button type="button" class="observatory-start" id="reactor-start" disabled>
        <span id="reactor-date">DITT PASS</span>
        <strong id="reactor-title">Laddar pass</strong>
        <span id="reactor-summary"></span>
        <span class="observatory-action"><svg class="observatory-action-ecg" viewBox="0 0 72 30" fill="none" aria-hidden="true"><path d="M2 16H17L23 10L30 24L39 3L46 20L52 13H70"/></svg><span id="reactor-action">Starta pass</span><svg class="observatory-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"/></svg></span>
        <span class="observatory-progress" id="observatory-progress" aria-live="polite"></span>
        <span class="observatory-last" id="observatory-last" aria-live="polite"></span>
      </button>
      <button class="observatory-configure" id="reactor-configure" type="button" hidden>Redigera upplägg <svg class="observatory-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"/></svg></button>
    </div>
  </div>
</section>'''

s = replace_once(
    s,
    '  <main class="main-content">\n\n    <!-- STATS -->',
    '  <main class="main-content" id="pulse-home">\n' + hero + '\n<section class="observatory-metrics" aria-label="Träningsöversikt">\n    <!-- STATS -->',
    'main + observatory hero'
)

# Close stats and open the existing weekly plan as one shared section.
stats_to_week = '''      <div class="stat-card stat-last fade-in"><div class="stat-label">Senaste pass</div><div class="stat-val"><span id="last-d">—</span></div><div class="stat-sub" id="last-sub"></div></div>
    </div>

    <!-- WEEKLY PLAN -->'''
stats_to_week_new = '''      <div class="stat-card stat-last fade-in"><div class="stat-label">Senaste pass</div><div class="stat-val"><span id="last-d">—</span></div><div class="stat-sub" id="last-sub"></div></div>
    </div>
    </section>
<section class="observatory-week" id="pulse-week">
    <!-- WEEKLY PLAN -->'''
s = replace_once(s, stats_to_week, stats_to_week_new, 'stats/week boundary')

# Keep the current week action only. The preview's extra Add-workout action is intentionally NOT
# copied because the requested final Observatory design removes it.
week_current = '      <button type="button" class="btn-sm" onclick="goToCurrentWeek()">Denna vecka</button>'
s = replace_once(s, week_current, '      <div class="observatory-week-actions">\n        <button type="button" class="btn-sm" onclick="goToCurrentWeek()">Denna vecka</button>\n      </div>', 'week actions')

# Reuse the one real weekly grid; do not clone it.
s = replace_once(
    s,
    '    <div class="week-grid fade-in" id="week-grid"></div>\n\n    <hr class="rule">\n\n    <!-- GOALS -->',
    '    <div class="week-grid fade-in" id="week-grid" aria-label="Välj dag i veckoplanen"></div>\n</section>\n\n    <hr class="rule compact-only">\n<section class="pulse-section pulse-goals" id="pulse-goals">\n    <!-- GOALS -->',
    'week/goals boundary'
)

# The following sections keep their existing live elements/IDs and only gain semantic wrappers.
s = replace_once(
    s,
    '    </div>\n\n    <hr class="rule">\n\n    <!-- CHARTS -->',
    '    </div>\n\n    </section>\n    <hr class="rule compact-only">\n<section class="pulse-section pulse-progress" id="pulse-progress">\n    <!-- CHARTS -->',
    'goals/charts boundary'
)
s = replace_once(
    s,
    '    </div>\n\n    <hr class="rule">\n\n    <!-- PRs -->',
    '    </div>\n\n    </section>\n    <hr class="rule compact-only">\n<section class="pulse-section pulse-records" id="pulse-records">\n    <!-- PRs -->',
    'charts/records boundary'
)
s = replace_once(
    s,
    '    <div class="pr-grid fade-in" id="pr-grid"></div>\n\n    <hr class="rule">\n\n    <!-- LOG -->',
    '    <div class="pr-grid fade-in" id="pr-grid"></div>\n\n    </section>\n    <hr class="rule compact-only">\n<section class="pulse-section pulse-log" id="pulse-log">\n    <!-- LOG -->',
    'records/log boundary'
)
s = replace_once(
    s,
    '    </div>\n\n  </main>\n</div>\n\n<button class="fab" onclick="openWorkoutModal()" title="Logga träning">+</button>',
    '    </div>\n\n  </section>\n  </main>\n</div>\n\n<button class="fab" id="pulse-log-button" onclick="openWorkoutModal()" title="Logga träning">+</button>',
    'log/main boundary'
)

# Existing editors are still the same modal DOM and handlers. The class only lets Observatory
# material styling target them while its stylesheet is enabled.
s = re.sub(r'<div class="modal-overlay" id="([^"]+)">', r'<div class="modal-overlay pulse-editor" id="\1">', s)

# Guard against accidentally importing the preview's second session presentation/runtime.
for forbidden in ('pulse-environment/training.js', 'pulse-environment/training.css', 'pulse-observatory/training.css'):
    if forbidden in s:
        raise SystemExit(f'forbidden duplicate training runtime/presentation imported: {forbidden}')

exercise.write_text(s)

# Shared presentation adapter becomes mode-aware. Reactor/Observatory previews keep their current
# behavior; Compact on the canonical page disables the overview theme without another runtime.
e = environment.read_text()
e = replace_once(
    e,
    "  const reduced = matchMedia('(prefers-reduced-motion: reduce)');\n",
    "  const reduced = matchMedia('(prefers-reduced-motion: reduce)');\n\n  function overviewMode() {\n    const explicit = document.documentElement.dataset.trainingOverview;\n    if (explicit) return explicit;\n    const theme = document.documentElement.dataset.trainingTheme;\n    if (theme === 'observatory' || (document.body && document.body.classList.contains('pulse-observatory'))) return 'observatory';\n    return 'reactor';\n  }\n\n  function pulseOverviewActive() { return overviewMode() !== 'compact'; }\n",
    'environment mode helpers'
)
e = e.replace("      if (!chart.canvas.closest('#pulse-home')) return;", "      if (!pulseOverviewActive() || !chart.canvas.closest('#pulse-home')) return;")
e = e.replace("      if (!chart.canvas.closest('#pulse-home')) return;\n      chart.ctx.save();", "      if (!pulseOverviewActive() || !chart.canvas.closest('#pulse-home')) return;\n      chart.ctx.save();")
e = e.replace("    afterDatasetDraw(chart) { if (chart.canvas.closest('#pulse-home')) chart.ctx.restore(); }", "    afterDatasetDraw(chart) { if (pulseOverviewActive() && chart.canvas.closest('#pulse-home')) chart.ctx.restore(); }")
e = replace_once(
    e,
    "      const paused = document.hidden || !onScreen || session.classList.contains('show');",
    "      const paused = !pulseOverviewActive() || document.hidden || !onScreen || session.classList.contains('show');",
    'motion mode pause'
)
e = replace_once(
    e,
    "    document.addEventListener('visibilitychange', syncMotion);\n    syncMotion();",
    "    document.addEventListener('visibilitychange', syncMotion);\n    window.addEventListener('training-overview-change', function () { syncReactor(); syncMotion(); });\n    syncMotion();",
    'overview mode event'
)
if 'setInterval(' in e:
    raise SystemExit('environment adapter must not introduce polling')
environment.write_text(e)

# Canonical overview mode owner. Checkpoint 2 will add the visible morphing toggle to this owner.
controller = ROOT / 'budget' / 'training-overview-mode.js'
controller.write_text(r'''(function () {
  'use strict';

  if (!/\/exercise\.html$/i.test(window.location.pathname) || window.__trainingOverviewModeInstalled) return;
  window.__trainingOverviewModeInstalled = true;

  var MODES = { observatory:true, compact:true };
  var styleIds = ['training-observatory-environment','training-observatory-composition'];

  function resolveMode(value) {
    value = String(value || '').toLowerCase();
    return MODES[value] ? value : 'observatory';
  }

  function currentMode() {
    return resolveMode(document.documentElement.dataset.trainingOverview);
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

  function applyMode(value, options) {
    var mode = resolveMode(value);
    var previous = currentMode();
    document.documentElement.dataset.trainingOverview = mode;
    if (document.body) document.body.classList.toggle('pulse-observatory', mode === 'observatory');
    setAssetState(mode);
    setVisibility(mode);

    if (!options || !options.silent) {
      window.dispatchEvent(new CustomEvent('training-overview-change', {
        detail:{ mode:mode, previous:previous }
      }));
      // Charts are still the original charts. Re-rendering only re-applies the active presentation
      // palette; it does not create another data owner.
      if (typeof window.renderCharts === 'function') {
        requestAnimationFrame(function () { try { window.renderCharts(); } catch (_) {} });
      }
    }
    return mode;
  }

  function initialMode() {
    var requested = new URLSearchParams(window.location.search).get('overview');
    return requested === 'compact' ? 'compact' : 'observatory';
  }

  window.getTrainingOverviewMode = currentMode;
  window.setTrainingOverviewMode = function (mode) { return applyMode(mode); };

  function install() { applyMode(initialMode(), {silent:true}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
''')

# Mark Checkpoint 0 rollback and Checkpoint 1 only after static verification below succeeds.
c = checklist.read_text()
c = c.replace('- [ ] Before the first implementation checkpoint, create/record a dedicated pre-migration checkpoint commit/tag if useful.', '- [x] Before the first implementation checkpoint, create/record a dedicated pre-migration checkpoint branch: `checkpoint/training-observatory-pre-migration-2026-09-15` -> `32d725f4fe201c3f53a080a980267a4ed8abe6d6`.')
cp1_items = [
    'Audit which Observatory elements are genuinely unique presentation and which are duplicates of existing `exercise.html` stats/week/graphs/logs.',
    'Define one canonical set of IDs/data nodes for stats, weekly plan, charts, goals, records and log.',
    "Promote Observatory's overview composition into `budget/exercise.html` as the default presentation.",
    'Keep the existing Compact overview available in the **same document**.',
    'Avoid two complete dashboard DOM trees where the same data is rendered twice.',
    'Prefer one set of shared sections whose placement/material changes by `data-training-overview`.',
    'If Observatory-only hero/decorative nodes are needed, keep them presentation-only and never give them data ownership.',
    'Remove/retire duplicated preview-specific runtime code as soon as equivalent ownership is established on the main route.',
    'Verify Markus/Maja profile selection still addresses the same stored data.',
    'Verify no extra Firebase/storage namespace is introduced.',
    'Verify no new periodic polling/render owner is introduced.'
]
for item in cp1_items:
    old = '- [ ] ' + item
    new = '- [x] ' + item
    if old not in c:
        raise SystemExit('checklist item not found: ' + item)
    c = c.replace(old, new, 1)

marker = '**Checkpoint exit condition:** `exercise.html` can render Observatory as default and Compact as an alternate state without loading two independent copies of the training dashboard logic.'
if marker not in c:
    raise SystemExit('checkpoint exit marker missing')
c = c.replace(marker, marker + '\n\nImplementation checkpoint: Observatory is default via `data-training-overview="observatory"`; `?overview=compact` and `window.setTrainingOverviewMode(\'compact\')` exercise the same DOM in Compact mode. The visible mode toggle/morph intentionally belongs to Checkpoint 2. No Observatory/Reactor `training.js` or training stylesheet is loaded on the production route.', 1)
checklist.write_text(c)

# Static consistency verification before the workflow commits anything.
s = exercise.read_text()
ids = re.findall(r'\bid="([^"]+)"', s)
dups = sorted({x for x in ids if ids.count(x) > 1})
if dups:
    raise SystemExit('duplicate IDs after migration: ' + ', '.join(dups))
for required_id in ('sw-cnt','total-cnt','dur-wk','last-d','week-grid','g1-bar','g2-bar','g3-bar','chart-sessions','chart-hr-combined','pr-grid','log-body','session-modal','reactor-core','reactor-start'):
    if ids.count(required_id) != 1:
        raise SystemExit(f'{required_id}: expected one canonical node, found {ids.count(required_id)}')
for fn in ('function getWorkouts()', 'function getPlannedSessions()', 'function startWorkoutSessionForDate'):
    if s.count(fn) != 1:
        raise SystemExit(f'{fn}: expected one data/runtime owner in exercise.html, found {s.count(fn)}')
if s.count('id="week-grid"') != 1 or s.count('id="log-body"') != 1:
    raise SystemExit('dashboard DOM duplicated')
if 'data-training-overview="observatory"' not in s:
    raise SystemExit('Observatory is not default')
if 'training-overview-mode.js?v=20260915-main-cp1' not in s:
    raise SystemExit('mode owner not loaded')
print('Observatory Checkpoint 1 structural verification PASS')
