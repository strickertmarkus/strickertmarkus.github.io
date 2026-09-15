from pathlib import Path
import re

ROOT = Path('budget')
STAR = 'M12 1.8C13.3 7.15 16.85 10.7 22.2 12C16.85 13.3 13.3 16.85 12 22.2C10.7 16.85 7.15 13.3 1.8 12C7.15 10.7 10.7 7.15 12 1.8Z'
STAR_SVG = f'<svg class="observatory-star-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="{STAR}"/></svg>'


def read(rel):
    return (ROOT / rel).read_text()


def write(rel, text):
    (ROOT / rel).write_text(text)


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, got {count}')
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label, flags=0):
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'{label}: expected exactly 1 regex match, got {n}')
    return out


# Canonical production markup: one shared star geometry for header,
# Observatory kicker and the dedicated Next Workout cue.
html = read('exercise.html')
brand = '<div class="brand-text"><h1 style="cursor:pointer" onclick="location.href=\'home.html\'"><span class="compact-only">Träning</span><span class="observatory-only">PULSE<span class="pulse-brand-flow">FLOW</span></span></h1><p>Markus Strickert</p></div>'
html = replace_once(
    html,
    brand,
    brand + '\n      <span class="observatory-header-star observatory-only" aria-hidden="true">' + STAR_SVG + '</span>',
    'header star markup'
)
html = replace_once(
    html,
    '<span class="observatory-kicker"><span aria-hidden="true">✧</span> PULSE / OBSERVATORY</span>',
    '<span class="observatory-kicker">' + STAR_SVG + ' PULSE / OBSERVATORY</span>',
    'kicker star markup'
)
html = replace_once(
    html,
    '<span class="observatory-next-label">NÄSTA PASS <svg class="observatory-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"/></svg></span>',
    '<span class="observatory-next-label"><span>NÄSTA PASS</span></span>',
    'next workout label'
)
old_next = '''        <span id="reactor-date">DITT PASS</span>
        <strong id="reactor-title">Laddar pass</strong>
        <span id="reactor-summary"></span>
        <span class="observatory-action"><svg class="observatory-action-ecg" viewBox="0 0 72 30" fill="none" aria-hidden="true"><path d="M2 16H17L23 10L30 24L39 3L46 20L52 13H70"/></svg><span id="reactor-action">Starta pass</span><svg class="observatory-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"/></svg></span>'''
new_next = f'''        <span class="observatory-next-main">
          <span class="observatory-next-copy">
            <span id="reactor-date">DITT PASS</span>
            <strong id="reactor-title">Laddar pass</strong>
            <span id="reactor-summary"></span>
          </span>
          <span class="observatory-next-cue" aria-hidden="true">
            {STAR_SVG}
            <svg class="observatory-next-cue-arrow" viewBox="0 0 24 24" fill="none" focusable="false"><path d="M7 17 17 7M8 7h9v9"/></svg>
          </span>
        </span>
        <span class="observatory-action"><svg class="observatory-action-ecg" viewBox="0 0 72 30" fill="none" aria-hidden="true"><path d="M2 16H17L23 10L30 24L39 3L46 20L52 13H70"/></svg><span id="reactor-action">Starta pass</span></span>'''
html = replace_once(html, old_next, new_next, 'next workout action')

# Cache-bust changed production assets and the exercise loader itself so Safari
# cannot retain the retired header ECG runtime.
html = html.replace('auth-config.js?v=20260915-loader-v2', 'auth-config.js?v=20260915-cp5-identity')
html = html.replace('auth-gate.js?v=20260915-loader-v2', 'auth-gate.js?v=20260915-cp5-identity')
html = html.replace('pulse-observatory/observatory.css?v=20260915-main-cp4-glow-fade-1', 'pulse-observatory/observatory.css?v=20260915-main-cp5-identity-1')
html = html.replace('pulse-environment/environment.js?v=20260915-main-cp4-structural-1', 'pulse-environment/environment.js?v=20260915-main-cp5-identity-1')
write('exercise.html', html)

# Observatory identity and primary action presentation.
css = read('pulse-observatory/observatory.css')
css = replace_once(
    css,
    '#pulse-home .observatory-kicker>span{font-size:28px;color:#ffd1dc;text-shadow:0 0 22px #ff628e}',
    '#pulse-home .observatory-star-glyph{display:block;overflow:visible;color:inherit;flex:0 0 auto}#pulse-home .observatory-star-glyph path,#pulse-header .observatory-star-glyph path{fill:none;stroke:currentColor;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}#pulse-home .observatory-kicker>.observatory-star-glyph{width:27px;height:27px;color:#ffd1dc;filter:drop-shadow(0 0 8px #ff628e66)}',
    'shared Observatory star CSS'
)
header_css = '''
#pulse-header .observatory-header-star{position:relative;display:grid;place-items:center;width:34px;height:34px;margin-left:7px;color:#ffd1dc;flex:0 0 34px;pointer-events:none}
#pulse-header .observatory-header-star .observatory-star-glyph{width:25px;height:25px;overflow:visible;transform-origin:50% 50%;animation:observatoryHeartbeat 2.55s linear infinite;animation-play-state:var(--observatory-identity-motion,paused)}
@keyframes observatoryHeartbeat{0%,16%,100%{transform:scale(1);opacity:.62;filter:drop-shadow(0 0 3px #ff70984a)}3%{transform:scale(1.18);opacity:1;filter:drop-shadow(0 0 5px #ffbad0) drop-shadow(0 0 15px #ff4d8199)}6%{transform:scale(.96);opacity:.74;filter:drop-shadow(0 0 4px #ff70985c)}9%{transform:scale(1.09);opacity:.94;filter:drop-shadow(0 0 4px #ffd0dc) drop-shadow(0 0 10px #ff5c897a)}13%{transform:scale(1);opacity:.64;filter:drop-shadow(0 0 3px #ff70984a)}}
'''
css = replace_once(css, '#pulse-home .observatory-heading{', header_css + '#pulse-home .observatory-heading{', 'heartbeat header CSS')
css = replace_once(
    css,
    '#pulse-home .observatory-next-label{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #ffb0c54d;padding-top:17px;color:#ba94a8;font-size:9px;letter-spacing:2px}',
    '#pulse-home .observatory-next-label{display:flex;align-items:center;border-top:1px solid #ffb0c54d;padding-top:17px;color:#ba94a8;font-size:9px;letter-spacing:2px}',
    'next label CSS'
)
css = replace_once(css, '#pulse-home .observatory-next-label>.observatory-arrow{color:#f2adc4}\n', '', 'retire weak next label arrow CSS')
css = replace_once(
    css,
    '#pulse-home .observatory-start{display:flex;flex-direction:column;align-items:flex-start;gap:12px;border:0;background:none;color:#fff0f4;padding:24px 0 12px;text-align:left;width:100%;font-family:inherit;cursor:pointer}',
    '#pulse-home .observatory-start{display:flex;flex-direction:column;align-items:flex-start;gap:12px;border:0;background:none;color:#fff0f4;padding:24px 0 12px;text-align:left;width:100%;font-family:inherit;cursor:pointer}#pulse-home .observatory-next-main{display:grid;grid-template-columns:minmax(0,1fr) 62px;align-items:center;gap:18px;width:100%}#pulse-home .observatory-next-copy{display:flex;flex-direction:column;align-items:flex-start;gap:12px;min-width:0}#pulse-home .observatory-next-cue{position:relative;display:grid;place-items:center;width:62px;height:62px;border:1px solid #ff9fba52;border-radius:50%;color:#ffd2df;background:radial-gradient(circle at 48% 45%,#ff8faa20 0%,#ff4e7d0e 44%,transparent 72%);box-shadow:inset 0 0 18px #ffc2d509,0 0 24px #ff4e7d12;transition:transform .28s cubic-bezier(.16,1,.3,1),border-color .28s,box-shadow .28s,background .28s}#pulse-home .observatory-next-cue .observatory-star-glyph{width:25px;height:25px;filter:drop-shadow(0 0 8px #ff699066)}#pulse-home .observatory-next-cue-arrow{position:absolute;right:7px;top:7px;width:14px;height:14px;stroke:#f6b4c8;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round;opacity:.82}#pulse-home .observatory-start:hover .observatory-next-cue,#pulse-home .observatory-start:focus-visible .observatory-next-cue{transform:translateY(-2px) scale(1.035);border-color:#ffb3c875;background:radial-gradient(circle at 48% 45%,#ff9bb42b 0%,#ff4e7d16 48%,transparent 74%);box-shadow:inset 0 0 20px #ffd0dc0c,0 0 34px #ff4e7d2d}#pulse-home .observatory-start:focus-visible{outline:none}#pulse-home .observatory-start:focus-visible .observatory-next-main{outline:1px solid #ffb6c94a;outline-offset:8px;border-radius:8px}',
    'next workout cue CSS'
)
css = replace_once(
    css,
    ' #pulse-home .observatory-next-label{padding-top:11px;border-top-color:#f8b6cd31}\n',
    ' #pulse-home .observatory-next-label{padding-top:11px;border-top-color:#f8b6cd31}\n #pulse-home .observatory-next-main{grid-template-columns:minmax(0,1fr) 52px;gap:12px}\n #pulse-home .observatory-next-copy{gap:7px}\n #pulse-home .observatory-next-cue{width:50px;height:50px}\n #pulse-home .observatory-next-cue .observatory-star-glyph{width:21px;height:21px}\n #pulse-home .observatory-next-cue-arrow{right:6px;top:6px;width:12px;height:12px}\n #pulse-header .observatory-header-star{width:30px;height:30px;flex-basis:30px;margin-left:3px}\n #pulse-header .observatory-header-star .observatory-star-glyph{width:22px;height:22px}\n',
    'mobile next cue and header star CSS'
)
css = replace_once(
    css,
    '@media(prefers-reduced-motion:reduce){\n #pulse-home .observatory-stage::before,#pulse-home .observatory-scene *,#pulse-home .observatory-action::before{animation:none!important}',
    '@media(prefers-reduced-motion:reduce){\n #pulse-header .observatory-header-star .observatory-star-glyph{animation:none!important;transform:none!important;opacity:.78!important;filter:drop-shadow(0 0 4px #ff709852)!important}\n #pulse-home .observatory-stage::before,#pulse-home .observatory-scene *,#pulse-home .observatory-action::before{animation:none!important}',
    'reduced motion star CSS'
)
write('pulse-observatory/observatory.css', css)

# Existing Observatory scheduler owns heartbeat pause/resume; no second loop.
env = read('pulse-environment/environment.js')
env = replace_once(
    env,
    "      const paused = !pulseOverviewActive() || document.hidden || !onScreen || session.classList.contains('show');\n      core.style.setProperty('--pulse-scene-motion', paused ? 'paused' : 'running');",
    "      const paused = !pulseOverviewActive() || document.hidden || !onScreen || session.classList.contains('show');\n      const motionState = paused ? 'paused' : 'running';\n      core.style.setProperty('--pulse-scene-motion', motionState);\n      document.documentElement.style.setProperty('--observatory-identity-motion', motionState);",
    'shared motion scheduler'
)
env = replace_once(
    env,
    "    start.disabled = false;\n    start.setAttribute('aria-label', (hasPlan ? 'Starta ' : 'Bygg pass: ') + title + ', ' + dateLabel + ', ' + summary);",
    "    start.disabled = false;\n    start.dataset.planState = hasPlan ? 'planned' : 'empty';\n    start.setAttribute('aria-label', (hasPlan ? 'Starta ' : 'Bygg pass: ') + title + ', ' + dateLabel + ', ' + summary);",
    'next workout plan state'
)
write('pulse-environment/environment.js', env)

# Retire the old header ECG from the shared Pulse Flow rAF owner.
motion = read('exercise-pulse-flow-motion-v67.js')
motion = sub_once(
    motion,
    r"\s*\.pf-header-ecg-v80\{.*?@media\(max-width:355px\)\{\.pf-header-ecg-v80\{display:none\}\}\n",
    '\n',
    'header ECG CSS block',
    re.S
)
motion = sub_once(
    motion,
    r"  function ensureEcg\(copy,isHeader\)\{.*?return signal;\}\n",
    "  function ensureEcg(copy){if(!copy)return null;var signal=copy.querySelector(':scope > .pf-ecg-v80');if(signal)return signal;signal=document.createElement('span');signal.className='pf-ecg-v80';signal.setAttribute('aria-hidden','true');signal.innerHTML='<svg viewBox=\"0 0 42 9\" focusable=\"false\" aria-hidden=\"true\"><path class=\"pf-ecg-guide-v80\" d=\"'+ECG_D+'\" fill=\"none\" stroke=\"none\"></path><path class=\"pf-ecg-base-v80\" d=\"'+ECG_D+'\"></path><path class=\"pf-ecg-sweep-a-v80\"></path><path class=\"pf-ecg-sweep-b-v80\"></path><circle class=\"pf-ecg-marker-v80\" cx=\"0\" cy=\"5\" r=\".68\"></circle></svg>';var label=copy.querySelector('.session-countdown-label,.bs-label');if(label)copy.insertBefore(signal,label);else copy.appendChild(signal);return signal;}\n",
    'session-only ECG creator',
    re.S
)
motion = sub_once(
    motion,
    r"  function paintWrappedEcg\(signal,now,isHeader\)\{.*?marker\.setAttribute\('cy',p\.y\.toFixed\(3\)\);\}\n",
    "  function paintWrappedEcg(signal,now){var svg=signal&&signal.querySelector('svg');if(!svg)return;var guide=svg.querySelector('.pf-ecg-guide-v80'),a=svg.querySelector('.pf-ecg-sweep-a-v80'),b=svg.querySelector('.pf-ecg-sweep-b-v80'),marker=svg.querySelector('.pf-ecg-marker-v80');if(!guide||!a||!b||!marker||typeof guide.getTotalLength!=='function')return;var overlay=signal.closest('#session-between-overlay-v2'),rest=!!(overlay&&String(overlay.dataset.betweenType||'rest')!=='custom'),cycle=overlay?(rest?2000:1000):2600;var phase=reduced?.5:(now%cycle)/cycle,total=guide.getTotalLength(),head=total*phase,span=total*.23;if(head>=span){a.setAttribute('d',sampledPath(guide,head-span,head,16));b.setAttribute('d','');}else{var start=total-(span-head);a.setAttribute('d',sampledPath(guide,start,total,16));b.setAttribute('d',head>0?sampledPath(guide,0,head,12):'');}var p=guide.getPointAtLength(head);marker.setAttribute('cx',p.x.toFixed(3));marker.setAttribute('cy',p.y.toFixed(3));}\n",
    'session-only ECG painter',
    re.S
)
motion = sub_once(motion, r"\n  function syncHeader\(\)\{.*?\}\n", '\n', 'retire header ECG sync', re.S)
motion = motion.replace('function syncSurfaces(){installStyles();syncHeader();syncProgress();', 'function syncSurfaces(){installStyles();syncProgress();')
motion = motion.replace("ensureEcg(cardio.querySelector('.session-countdown-copy'),false)", "ensureEcg(cardio.querySelector('.session-countdown-copy'))")
motion = motion.replace("ensureEcg(ring.querySelector('.bs-copy'),false)", "ensureEcg(ring.querySelector('.bs-copy'))")
motion = motion.replace("paintWrappedEcg(signal,now,false)", "paintWrappedEcg(signal,now)")
motion = sub_once(motion, r"document\.querySelectorAll\('\.pf-header-ecg-v80'\)\.forEach\(function\(signal\)\{paintWrappedEcg\(signal,now,true\);\}\);", '', 'retire header ECG frame paint')
if 'pf-header-ecg-v80' in motion or 'syncHeader' in motion:
    raise SystemExit('motion file still owns retired header ECG')
write('exercise-pulse-flow-motion-v67.js', motion)

# Remove superseded header-only glow/canvas selectors from session presentation.
glow = read('exercise-pulse-flow-ecg-glow-v104.js')
glow = sub_once(
    glow,
    r"\n        /\* Header mini ECG uses the same Safari-safe container filter\. \*/\n        html\.exercise-concept-pulse-home-v1 body \.pf-header-ecg-v80 svg \{.*?\n        \}\n",
    '\n',
    'retire header ECG Safari block',
    re.S
)
glow = glow.replace(",\n        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 svg {", " {")
if 'pf-header-ecg-v80' in glow:
    raise SystemExit('ECG glow file still references retired header ECG')
write('exercise-pulse-flow-ecg-glow-v104.js', glow)

canvas = read('exercise-pulse-flow-canvas-glow-v130.js')
canvas = canvas.replace('        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80,\n        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80,\n', '        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80,\n')
canvas = canvas.replace('        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 svg,\n        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 svg,\n', '        html.exercise-concept-pulse-home-v1 body #session-between-overlay-v2 .pf-ecg-v80 svg,\n')
canvas = canvas.replace('        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80,\n        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 {\n', '        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 {\n')
canvas = canvas.replace('        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > .pf-canvas-mini-v130,\n        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 > .pf-canvas-mini-v130 {\n', '        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > .pf-canvas-mini-v130 {\n')
canvas = canvas.replace('        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > svg,\n        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 > svg {\n', '        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > svg {\n')
canvas = canvas.replace("    ['.pf-ecg-sweep-a-v80','.pf-ecg-sweep-b-v80','.pf-header-ecg-sweep-a-v80','.pf-header-ecg-sweep-b-v80'].forEach(function (selector) {", "    ['.pf-ecg-sweep-a-v80','.pf-ecg-sweep-b-v80'].forEach(function (selector) {")
canvas = sub_once(canvas, r"\n    document\.querySelectorAll\('\.pf-header-ecg-v80'\)\.forEach\(function \(signal\) \{\n      paintMini\(signal,\[103,232,249\]\);\n    \}\);", '', 'retire header canvas paint')
if 'pf-header-ecg' in canvas:
    raise SystemExit('canvas v130 still references retired header ECG')
write('exercise-pulse-flow-canvas-glow-v130.js', canvas)

layer = read('exercise-pulse-flow-canvas-glow-v131.js')
layer = layer.replace('        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > .pf-canvas-mini-v130,\n        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 > .pf-canvas-mini-v130,\n', '        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > .pf-canvas-mini-v130,\n')
layer = layer.replace('        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > svg,\n        html.exercise-concept-pulse-home-v1 body .pf-header-ecg-v80 > svg,\n', '        html.exercise-concept-pulse-home-v1 body .pf-ecg-v80 > svg,\n')
if 'pf-header-ecg' in layer:
    raise SystemExit('canvas v131 still references retired header ECG')
write('exercise-pulse-flow-canvas-glow-v131.js', layer)

# Real cache ownership update for changed loader/session files.
cfg = read('auth-config.js')
cfg = replace_once(cfg, "var exerciseFastVersion = '20260915-loader-v2';", "var exerciseFastVersion = '20260915-cp5-identity';", 'auth-config exercise cache version')
write('auth-config.js', cfg)
gate = read('auth-gate.js')
gate = replace_once(gate, "var exerciseAssetsVersion = '20260915-loader-v2';", "var exerciseAssetsVersion = '20260915-cp5-identity';", 'auth-gate exercise cache version')
write('auth-gate.js', gate)

# Keep earlier mobile regression assertions aligned with intentional CP5 asset changes.
mobile_test = read('tests/training-observatory-mobile.test.cjs')
mobile_test = replace_once(mobile_test, 'pulse-observatory\\/observatory\\.css\\?v=20260915-main-cp4-glow-fade-1', 'pulse-observatory\\/observatory\\.css\\?v=20260915-main-cp5-identity-1', 'mobile test CSS cache key')
mobile_test = replace_once(mobile_test, 'pulse-environment\\/environment\\.js\\?v=20260915-main-cp4-structural-1', 'pulse-environment\\/environment\\.js\\?v=20260915-main-cp5-identity-1', 'mobile test environment cache key')
write('tests/training-observatory-mobile.test.cjs', mobile_test)

identity_test = f'''const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('exercise.html');
const css = read('pulse-observatory/observatory.css');
const environment = read('pulse-environment/environment.js');
const motion = read('exercise-pulse-flow-motion-v67.js');
const ecgGlow = read('exercise-pulse-flow-ecg-glow-v104.js');
const canvas130 = read('exercise-pulse-flow-canvas-glow-v130.js');
const canvas131 = read('exercise-pulse-flow-canvas-glow-v131.js');
const authConfig = read('auth-config.js');
const authGate = read('auth-gate.js');
const starPath = '{STAR}';

test('one native Observatory star geometry owns kicker, sticky header identity and next cue', () => {{
  assert.equal((html.match(new RegExp(starPath, 'g')) || []).length, 3);
  assert.match(html, /observatory-header-star observatory-only/);
  assert.match(html, /observatory-kicker[^>]*><svg class="observatory-star-glyph"/);
  assert.match(html, /observatory-next-cue/);
  assert.doesNotMatch(html, /observatory-kicker"><span aria-hidden="true">✧/);
}});

test('header star uses heartbeat cadence and existing Observatory scheduler', () => {{
  assert.match(css, /@keyframes observatoryHeartbeat\{{0%,16%,100%/);
  assert.match(css, /3%\{{transform:scale\(1\.18\)/);
  assert.match(css, /9%\{{transform:scale\(1\.09\)/);
  assert.match(css, /animation-play-state:var\(--observatory-identity-motion,paused\)/);
  assert.match(css, /prefers-reduced-motion:reduce[\s\S]*observatory-header-star \.observatory-star-glyph\{{animation:none!important/);
  assert.match(environment, /const motionState = paused \? 'paused' : 'running'/);
  assert.match(environment, /document\.documentElement\.style\.setProperty\('--observatory-identity-motion', motionState\)/);
  assert.match(environment, /document\.hidden \|\| !onScreen \|\| session\.classList\.contains\('show'\)/);
}});

test('retired header ECG has no remaining runtime or glow owner', () => {{
  [motion, ecgGlow, canvas130, canvas131].forEach(source => assert.doesNotMatch(source, /pf-header-ecg/));
  assert.doesNotMatch(motion, /syncHeader/);
  assert.match(motion, /document\.querySelectorAll\('\.pf-ecg-v80'\)/);
}});

test('Next Workout remains one real weekly-plan action with explicit cue and empty state', () => {{
  const nextBlock = html.slice(html.indexOf('<div class="observatory-next">'), html.indexOf('<section class="observatory-metrics"'));
  assert.match(nextBlock, /class="observatory-next-label"><span>NÄSTA PASS<\/span><\/span>/);
  assert.doesNotMatch(nextBlock.split('<button')[0], /observatory-arrow/);
  assert.equal((html.match(/id="reactor-start"/g) || []).length, 1);
  assert.match(environment, /window\.getPlannedSessions\(\)/);
  assert.match(environment, /hasPlan \? \(plan\.type \|\| 'Planerat pass'\) : 'Planera ditt pass'/);
  assert.match(environment, /setText\('reactor-action', hasPlan \? 'Starta pass' : 'Bygg pass'\)/);
  assert.match(environment, /start\.dataset\.planState = hasPlan \? 'planned' : 'empty'/);
  assert.match(environment, /if \(hasPlan\) window\.startWorkoutSessionForDate\(selectedDate\);/);
}});

test('CP5 cache keys force Safari to receive the retired-header ownership change', () => {{
  assert.match(html, /auth-config\.js\?v=20260915-cp5-identity/);
  assert.match(html, /auth-gate\.js\?v=20260915-cp5-identity/);
  assert.match(html, /pulse-observatory\/observatory\.css\?v=20260915-main-cp5-identity-1/);
  assert.match(html, /pulse-environment\/environment\.js\?v=20260915-main-cp5-identity-1/);
  assert.match(authConfig, /exerciseFastVersion = '20260915-cp5-identity'/);
  assert.match(authGate, /exerciseAssetsVersion = '20260915-cp5-identity'/);
}});
'''
write('tests/training-observatory-identity.test.cjs', identity_test)

# Mark CP5 only after the working tree represents the implementation that the
# subsequent workflow test gate must validate before it is committed.
plan = read('TRAINING-OBSERVATORY-MIGRATION-CHECKLIST.md')
cp5_start = plan.index('# Checkpoint 5 —')
cp6_start = plan.index('# Checkpoint 6 —')
cp5 = plan[cp5_start:cp6_start].replace('- [ ]', '- [x]')
exit_line = "**Checkpoint exit condition:** Observatory's primary identity and next action are both immediately legible on the first screen.\n"
note = "\nImplementation checkpoint: the sticky header now uses the same native four-point Observatory star geometry as the hero kicker and Next Workout cue. Its double-beat CSS pulse is governed by the existing Observatory visibility/session scheduler. The former header ECG ownership was removed from the Pulse Flow rAF/glow/canvas layers. `reactor-start` remains the sole Next Workout action and still reads the canonical weekly plan / empty state.\n"
if note.strip() not in cp5:
    cp5 = cp5.replace(exit_line, exit_line + note)
plan = plan[:cp5_start] + cp5 + plan[cp6_start:]
write('TRAINING-OBSERVATORY-MIGRATION-CHECKLIST.md', plan)
