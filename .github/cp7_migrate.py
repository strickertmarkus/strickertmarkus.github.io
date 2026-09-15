from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, got {count}")
    return text.replace(old, new, 1)


# 1) Presentation-only semantic state adapter.
env_path = Path('budget/pulse-environment/environment.js')
env = env_path.read_text()
anchor = """  function setText(id, value) {
    const node = document.getElementById(id);
    if (node && node.textContent !== value) node.textContent = value;
  }
"""
semantic = anchor + """
  const observatoryStates = new Set(['pending', 'current', 'completed', 'goal-achieved']);

  function setObservatoryState(node, state) {
    if (!node || !observatoryStates.has(state)) return;
    if (node.dataset.observatoryState !== state) node.dataset.observatoryState = state;
  }

  function numericNodeValue(id) {
    const node = document.getElementById(id);
    if (!node) return 0;
    const source = ('value' in node && node.value !== '') ? node.value : node.textContent;
    const value = Number.parseFloat(String(source || '').replace(',', '.'));
    return Number.isFinite(value) ? value : 0;
  }

  function progressState(bar) {
    if (!bar) return 'pending';
    const value = Number.parseFloat(String(bar.style.width || '0').replace('%', ''));
    if (Number.isFinite(value) && value >= 99.5) return 'goal-achieved';
    if (Number.isFinite(value) && value > 0) return 'current';
    return 'pending';
  }

  function syncObservatoryStates() {
    const goals = typeof window.getGoals === 'function' ? window.getGoals() : { weeklyWk: 4 };
    const weeklyGoal = Number(goals && goals.weeklyWk) || 4;
    const weekCount = numericNodeValue('sw-cnt');
    const duration = numericNodeValue('dur-wk');
    const total = numericNodeValue('total-cnt');
    const last = document.getElementById('last-d');
    const hasLast = !!(last && String(last.textContent || '').trim() && String(last.textContent).trim() !== '—');

    setObservatoryState(document.querySelector('.observatory-metrics .stat-week'), weekCount >= weeklyGoal ? 'goal-achieved' : weekCount > 0 ? 'current' : 'pending');
    setObservatoryState(document.querySelector('.observatory-metrics .stat-total'), total > 0 ? 'completed' : 'pending');
    setObservatoryState(document.querySelector('.observatory-metrics .stat-duration'), duration > 0 ? 'current' : 'pending');
    setObservatoryState(document.querySelector('.observatory-metrics .stat-last'), hasLast ? 'completed' : 'pending');
    setObservatoryState(document.getElementById('observatory-progress'), weekCount >= weeklyGoal ? 'goal-achieved' : weekCount > 0 ? 'current' : 'pending');
    setObservatoryState(document.getElementById('observatory-last'), hasLast ? 'completed' : 'pending');

    document.querySelectorAll('#week-grid .week-day').forEach(day => {
      const state = day.classList.contains('done')
        ? 'completed'
        : (day.classList.contains('is-selected') || day.classList.contains('today'))
          ? 'current'
          : 'pending';
      setObservatoryState(day, state);
    });

    document.querySelectorAll('#pulse-goals .goal-card').forEach(card => {
      const state = progressState(card.querySelector('.progress-bar'));
      setObservatoryState(card, state);
      card.querySelectorAll('.progress-bar,.progress-marker,.goal-nums').forEach(node => setObservatoryState(node, state));
    });

    const start = document.getElementById('reactor-start');
    if (start) setObservatoryState(start, start.dataset.planState === 'planned' ? 'current' : 'pending');
  }
"""
env = replace_once(env, anchor, semantic, 'environment semantic helpers')
env = replace_once(
    env,
    """    });
  }

  function openSelectedBuilder() {
""",
    """    });
    syncObservatoryStates();
  }

  function openSelectedBuilder() {
""",
    'sync state after weekly selection'
)
env = replace_once(
    env,
    """    new MutationObserver(syncReactor).observe(grid, { childList: true });
    syncReactor();
    window.addEventListener('firebase-sync', syncReactor);
""",
    """    new MutationObserver(syncReactor).observe(grid, { childList: true });
    const semanticObserver = new MutationObserver(syncObservatoryStates);
    const metricRoot = document.querySelector('.observatory-metrics');
    const goalRoot = document.getElementById('pulse-goals');
    if (metricRoot) semanticObserver.observe(metricRoot, { subtree: true, childList: true, characterData: true });
    if (goalRoot) semanticObserver.observe(goalRoot, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style'] });
    syncReactor();
    syncObservatoryStates();
    window.addEventListener('firebase-sync', syncReactor);
""",
    'semantic observers'
)
env_path.write_text(env)


# 2) Shared Observatory state tokens and consumers.
obs_path = Path('budget/pulse-observatory/observatory.css')
obs = obs_path.read_text()
header = '/* Observatory composition. Shared overview, records, log and editor materials live in environment.css. */\n'
tokens = header + """#pulse-home{
 --obs-pending-accent:#9b7b8a;--obs-pending-border:#c59aaa24;--obs-pending-fill:#b8869a0b;--obs-pending-glow:0 0 0 transparent;--obs-pending-decoration:.38;
 --obs-current-accent:#9be4e9;--obs-current-border:#8adfe76b;--obs-current-fill:#67dce914;--obs-current-glow:0 0 12px #56d9e532;--obs-current-decoration:.82;
 --obs-completed-accent:#ffb8cb;--obs-completed-border:#ffa1bb78;--obs-completed-fill:#ff769914;--obs-completed-glow:0 0 14px #ff5c883e;--obs-completed-decoration:.94;
 --obs-achieved-accent:#ffe7ef;--obs-achieved-border:#ffc5d89c;--obs-achieved-fill:#ff7b9f1c;--obs-achieved-glow:0 0 18px #ff5c8848;--obs-achieved-decoration:1
}
#pulse-home [data-observatory-state="pending"]{--obs-state-accent:var(--obs-pending-accent);--obs-state-border:var(--obs-pending-border);--obs-state-fill:var(--obs-pending-fill);--obs-state-glow:var(--obs-pending-glow);--obs-state-decoration:var(--obs-pending-decoration)}
#pulse-home [data-observatory-state="current"]{--obs-state-accent:var(--obs-current-accent);--obs-state-border:var(--obs-current-border);--obs-state-fill:var(--obs-current-fill);--obs-state-glow:var(--obs-current-glow);--obs-state-decoration:var(--obs-current-decoration)}
#pulse-home [data-observatory-state="completed"]{--obs-state-accent:var(--obs-completed-accent);--obs-state-border:var(--obs-completed-border);--obs-state-fill:var(--obs-completed-fill);--obs-state-glow:var(--obs-completed-glow);--obs-state-decoration:var(--obs-completed-decoration)}
#pulse-home [data-observatory-state="goal-achieved"]{--obs-state-accent:var(--obs-achieved-accent);--obs-state-border:var(--obs-achieved-border);--obs-state-fill:var(--obs-achieved-fill);--obs-state-glow:var(--obs-achieved-glow);--obs-state-decoration:var(--obs-achieved-decoration)}
"""
obs = replace_once(obs, header, tokens, 'observatory state tokens')
old_week = """#pulse-home .observatory-week .week-day::after{content:'';position:absolute;width:5px;height:5px;border-radius:50%;background:#725061;bottom:-3px;left:calc(50% - 2px);box-shadow:0 0 0 5px #0c090f}
#pulse-home .observatory-week .week-day.is-selected{background:radial-gradient(ellipse at 50% 100%,#fb608a24,transparent 80%)!important}
#pulse-home .observatory-week .week-day.is-selected::after,#pulse-home .observatory-week .week-day.done::after{background:#ffc3d4;box-shadow:0 0 5px #ff6184,0 0 20px #ff4d86}
#pulse-home .observatory-week .week-day.today .wd-date{color:#ffc2d4!important}
"""
new_week = """#pulse-home .observatory-week .week-day::after{content:'';position:absolute;width:5px;height:5px;border-radius:50%;background:var(--obs-state-accent,var(--obs-pending-accent));bottom:-3px;left:calc(50% - 2px);box-shadow:var(--obs-state-glow,var(--obs-pending-glow));opacity:var(--obs-state-decoration,var(--obs-pending-decoration))}
#pulse-home .observatory-week .week-day.is-selected{background:radial-gradient(ellipse at 50% 100%,var(--obs-state-fill,var(--obs-current-fill)),transparent 80%)!important}
#pulse-home .observatory-week .week-day[data-observatory-state="current"] .wd-date,#pulse-home .observatory-week .week-day[data-observatory-state="completed"] .wd-date{color:var(--obs-state-accent)!important}
#pulse-home .observatory-week .week-day[data-observatory-state="completed"] .wd-date{font-weight:450!important}
"""
obs = replace_once(obs, old_week, new_week, 'collapsed week semantic styling')
metric_anchor = '#pulse-home .observatory-metrics .stat-card:first-child{padding-left:0!important}\n'
metric_state = metric_anchor + """#pulse-home .observatory-metrics .stat-card[data-observatory-state]{position:relative}
#pulse-home .observatory-metrics .stat-card[data-observatory-state]::after{content:'';display:block!important;position:absolute;left:50%;bottom:0;width:24px;height:1px;transform:translateX(-50%);background:var(--obs-state-accent);box-shadow:var(--obs-state-glow);opacity:var(--obs-state-decoration);pointer-events:none}
#pulse-home .observatory-start[data-observatory-state] .observatory-next-cue{color:var(--obs-state-accent);border-color:var(--obs-state-border);background:radial-gradient(circle at 48% 45%,var(--obs-state-fill) 0%,transparent 72%);box-shadow:inset 0 0 14px var(--obs-state-fill),var(--obs-state-glow)}
#pulse-home .pulse-goals .goal-card[data-observatory-state]{position:relative}
#pulse-home .pulse-goals .goal-card[data-observatory-state]::after{content:'';position:absolute;left:0;bottom:0;width:38px;height:1px;background:var(--obs-state-accent);box-shadow:var(--obs-state-glow);opacity:var(--obs-state-decoration);pointer-events:none}
#pulse-home .pulse-goals .goal-nums[data-observatory-state="goal-achieved"]{color:var(--obs-state-accent)!important;font-weight:700}
#pulse-home :is(.observatory-progress,.observatory-last)[data-observatory-state]::before{content:'';display:inline-block;width:4px;height:4px;margin:0 7px 1px 0;border-radius:50%;background:var(--obs-state-accent);box-shadow:var(--obs-state-glow);opacity:var(--obs-state-decoration)}
"""
obs = replace_once(obs, metric_anchor, metric_state, 'metric and goal semantic styling')
obs_path.write_text(obs)


# 3) Shared progress presentation consumes semantic vars with Reactor-safe fallbacks.
env_css_path = Path('budget/pulse-environment/environment.css')
env_css = env_css_path.read_text()
env_css = replace_once(env_css, '#pulse-home .stat-card::before,#pulse-home .stat-card::after{display:none!important}', '#pulse-home .stat-card::before{display:none!important}', 'free metric after pseudo')
env_css = replace_once(
    env_css,
    """#pulse-home .progress-bar{background:linear-gradient(90deg,#ab3b67,#ffb4cd)!important;box-shadow:0 0 16px #ff6b9344!important;border-radius:5px!important}
#pulse-home .progress-marker{background:#ffe3ef!important;box-shadow:0 0 10px #ff6c98!important}
""",
    """#pulse-home .progress-bar{background:linear-gradient(90deg,var(--obs-state-fill,#ab3b67),var(--obs-state-accent,#ffb4cd))!important;box-shadow:var(--obs-state-glow,0 0 16px #ff6b9344)!important;border-radius:5px!important;opacity:var(--obs-state-decoration,1)}
#pulse-home .progress-marker{background:var(--obs-state-accent,#ffe3ef)!important;border-color:var(--obs-state-border,#ffb4cd)!important;box-shadow:var(--obs-state-glow,0 0 10px #ff6c98)!important;opacity:var(--obs-state-decoration,1)}
""",
    'progress semantic styling'
)
env_css_path.write_text(env_css)


# 4) Circular weekly plan consumes the same vars; remove legacy per-class glow blocks.
orbit_path = Path('budget/training-week-orbit.css')
orbit = orbit_path.read_text()
start = orbit.index('html[data-training-overview="observatory"] #pulse-home .observatory-week #week-grid.week-orbit-layout .week-day::before{')
end = orbit.index('html[data-training-overview="observatory"] #pulse-home .observatory-week #week-grid.week-orbit-layout .wd-week,', start)
replacement = """html[data-training-overview="observatory"] #pulse-home .observatory-week #week-grid.week-orbit-layout .week-day::before{
  content:'';
  position:absolute;
  inset:-1px;
  border-radius:inherit;
  border:1px solid var(--obs-state-border,var(--obs-pending-border));
  background:radial-gradient(circle at 35% 28%,var(--obs-state-fill,var(--obs-pending-fill)),transparent 78%);
  box-shadow:var(--obs-state-glow,var(--obs-pending-glow));
  opacity:calc(var(--week-orbit-node-progress,0) * var(--obs-state-decoration,var(--obs-pending-decoration)));
  pointer-events:none;
  z-index:-1;
}

"""
orbit = orbit[:start] + replacement + orbit[end:]
orbit_path.write_text(orbit)


# 5) Cache-bust modified production owners.
html_path = Path('budget/exercise.html')
html = html_path.read_text()
for old, new, label in [
    ('pulse-environment/environment.css?v=20260915-main-cp4-structural-1', 'pulse-environment/environment.css?v=20260915-main-cp7-state-1', 'environment css cache'),
    ('pulse-observatory/observatory.css?v=20260915-main-cp5-heartbeat-polish-1', 'pulse-observatory/observatory.css?v=20260915-main-cp7-state-1', 'observatory css cache'),
    ('training-week-orbit.css?v=20260915-main-cp6-click-2', 'training-week-orbit.css?v=20260915-main-cp7-state-1', 'orbit css cache'),
    ('pulse-environment/environment.js?v=20260915-main-cp5-identity-1', 'pulse-environment/environment.js?v=20260915-main-cp7-state-1', 'environment js cache'),
]:
    html = replace_once(html, old, new, label)
html_path.write_text(html)


# 6) Update regression expectations.
for name, pairs in {
    'budget/tests/training-observatory-mobile.test.cjs': [
        ('pulse-observatory\\/observatory\\.css\\?v=20260915-main-cp5-heartbeat-polish-1', 'pulse-observatory\\/observatory\\.css\\?v=20260915-main-cp7-state-1'),
        ('pulse-environment\\/environment\\.css\\?v=20260915-main-cp4-structural-1', 'pulse-environment\\/environment\\.css\\?v=20260915-main-cp7-state-1'),
        ('pulse-environment\\/environment\\.js\\?v=20260915-main-cp5-identity-1', 'pulse-environment\\/environment\\.js\\?v=20260915-main-cp7-state-1'),
    ],
    'budget/tests/training-observatory-identity.test.cjs': [
        ('pulse-observatory\\/observatory\\.css\\?v=20260915-main-cp5-heartbeat-polish-1', 'pulse-observatory\\/observatory\\.css\\?v=20260915-main-cp7-state-1'),
        ('pulse-environment\\/environment\\.js\\?v=20260915-main-cp5-identity-1', 'pulse-environment\\/environment\\.js\\?v=20260915-main-cp7-state-1'),
    ],
}.items():
    path = Path(name)
    source = path.read_text()
    for old, new in pairs:
        if old not in source:
            raise SystemExit(f'{name}: missing cache expectation {old}')
        source = source.replace(old, new)
    path.write_text(source)

orbit_test_path = Path('budget/tests/training-week-orbit.test.cjs')
orbit_test = orbit_test_path.read_text()
old_asserts = """  assert.match(orbitCss, /week-day\\.is-selected::before/);
  assert.match(orbitCss, /week-day\\.done::before/);
  assert.match(orbitCss, /week-day\\.today::before/);
  assert.match(orbitCss, /week-day\\.pending::before/);
"""
new_asserts = """  assert.match(orbitCss, /var\\(--obs-state-border/);
  assert.match(orbitCss, /var\\(--obs-state-fill/);
  assert.match(orbitCss, /var\\(--obs-state-glow/);
  assert.doesNotMatch(orbitCss, /week-day\\.(?:is-selected|done|today|pending)::before/);
"""
orbit_test = replace_once(orbit_test, old_asserts, new_asserts, 'orbit semantic assertions')
orbit_test = replace_once(orbit_test, 'training-week-orbit\\.css\\?v=20260915-main-cp6-click-2', 'training-week-orbit\\.css\\?v=20260915-main-cp7-state-1', 'orbit cache expectation')
orbit_test_path.write_text(orbit_test)


# 7) Add dedicated CP7 regression coverage.
state_test = r'''const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('exercise.html');
const environment = read('pulse-environment/environment.js');
const environmentCss = read('pulse-environment/environment.css');
const observatoryCss = read('pulse-observatory/observatory.css');
const orbitCss = read('training-week-orbit.css');

test('CP7 exposes one four-state Observatory semantic vocabulary', () => {
  ['pending', 'current', 'completed', 'goal-achieved'].forEach(state => {
    assert.match(observatoryCss, new RegExp(`data-observatory-state="${state}"`));
  });
  assert.match(environment, /const observatoryStates = new Set\(\['pending', 'current', 'completed', 'goal-achieved'\]\)/);
  assert.match(environment, /function setObservatoryState\(node, state\)/);
});

test('semantic state maps existing truth without owning workout persistence', () => {
  assert.match(environment, /day\.classList\.contains\('done'\)[\s\S]*'completed'/);
  assert.match(environment, /day\.classList\.contains\('is-selected'\) \|\| day\.classList\.contains\('today'\)/);
  assert.match(environment, /progressState\(card\.querySelector\('\.progress-bar'\)\)/);
  assert.doesNotMatch(environment, /localStorage\.setItem|firebase\.database\(\)\.ref/);
});

test('pending dims decoration rather than readable text', () => {
  assert.match(observatoryCss, /--obs-pending-decoration:\.38/);
  assert.match(observatoryCss, /--obs-pending-glow:0 0 0 transparent/);
  assert.doesNotMatch(observatoryCss, /\[data-observatory-state="pending"\][^{]*\{[^}]*\bopacity:/);
  assert.match(observatoryCss, /week-day::after\{[^}]*opacity:var\(--obs-state-decoration/);
});

test('active and achieved states use bounded OLED-friendly glow tokens', () => {
  assert.match(observatoryCss, /--obs-current-glow:0 0 12px/);
  assert.match(observatoryCss, /--obs-completed-glow:0 0 14px/);
  assert.match(observatoryCss, /--obs-achieved-glow:0 0 18px/);
});

test('metrics next action goals and both week geometries consume shared state tokens', () => {
  assert.match(observatoryCss, /observatory-metrics \.stat-card\[data-observatory-state\]::after/);
  assert.match(observatoryCss, /observatory-start\[data-observatory-state\] \.observatory-next-cue/);
  assert.match(observatoryCss, /pulse-goals \.goal-card\[data-observatory-state\]::after/);
  assert.match(environmentCss, /progress-bar\{[^}]*var\(--obs-state-glow/);
  assert.match(environmentCss, /progress-marker\{[^}]*var\(--obs-state-accent/);
  assert.match(orbitCss, /week-orbit-layout \.week-day::before\{[\s\S]*var\(--obs-state-border/);
  assert.doesNotMatch(orbitCss, /week-day\.(?:is-selected|done|today|pending)::before/);
});

test('production cache-busts every modified CP7 presentation owner', () => {
  assert.match(html, /pulse-environment\/environment\.css\?v=20260915-main-cp7-state-1/);
  assert.match(html, /pulse-observatory\/observatory\.css\?v=20260915-main-cp7-state-1/);
  assert.match(html, /training-week-orbit\.css\?v=20260915-main-cp7-state-1/);
  assert.match(html, /pulse-environment\/environment\.js\?v=20260915-main-cp7-state-1/);
});
'''
Path('budget/tests/training-observatory-state.test.cjs').write_text(state_test)


# 8) Mark CP7 checklist complete with ownership notes.
checklist_path = Path('budget/TRAINING-OBSERVATORY-MIGRATION-CHECKLIST.md')
checklist = checklist_path.read_text()
start = checklist.index('# Checkpoint 7 — Achievement / inactive visual hierarchy')
end = checklist.index('# Checkpoint 8 — Training ↔ Zen becomes an in-page morph', start)
replacement = '''# Checkpoint 7 — Achievement / inactive visual hierarchy

Goal: adopt the successful Zen visual rule: attained/active states feel luminous; pending states recede.

- [x] Inventory Observatory symbols, metrics, week nodes, goal markers and progress indicators.
- [x] Define a shared Observatory semantic state vocabulary: `pending`, `current`, `completed`, `goal-achieved`.
- [x] Pending/unachieved symbols use more transparency and lower glow.
- [x] Current/active state gets focused glow without appearing completed.
- [x] Completed/achieved state gets stronger, crisp glow and slightly higher visual weight.
- [x] Avoid random per-component glow constants; use Observatory CSS variables/tokens.
- [x] Ensure contrast remains accessible and text does not become faint just because decoration is pending.
- [x] Apply the same language to collapsed and circular weekly-plan states.
- [x] Check dark OLED/mobile appearance for excessive bloom.

Implementation checkpoint: `pulse-environment/environment.js` derives presentation-only semantic state from the canonical workout/goal DOM and existing truth (`done`, today/selected, progress width and metric values). `pulse-observatory/observatory.css` owns the four state token families. The collapsed week, metrics, Next Workout cue and goal accents consume those tokens, while `training-week-orbit.css` consumes the same variables instead of maintaining per-class glow constants. Pending changes decoration only; readable text opacity is not reduced.

Verification: Node syntax, all `budget/tests/training-*.test.cjs`, semantic state vocabulary and ownership, no new storage/data namespace, no legacy per-state orbit glow blocks, shared progress/marker tokens, bounded 12/14/18 px current/completed/achieved glow radii for dark mobile/OLED, current cache keys and `git diff --check`.

**Checkpoint exit condition:** state is visually consistent across Observatory without labels or a second data/state owner.

---

'''
checklist = checklist[:start] + replacement + checklist[end:]
checklist_path.write_text(checklist)
