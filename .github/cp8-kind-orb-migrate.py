from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 occurrence, found {count}')
    return text.replace(old, new, 1)


def regex_once(text, pattern, repl, label, flags=0):
    out, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 regex match, found {count}')
    return out

# 1. Stretch <-> Meditation: atomically hide the outgoing home surface and animate only incoming.
zen_js = read('budget/zen.js')
pattern = r"(  function setKind\(next\)\{.*?\n  \})\n(  function renderHome\(\)\{)"
match = re.search(pattern, zen_js, re.S)
if not match:
    raise SystemExit('zen setKind owner not found')
core = match.group(1).replace('function setKind(next){', 'function applyKind(next){', 1)
wrapper = core + "\n  function setKind(next){\n    next=next==='meditation'?'meditation':'stretch';\n    const changed=next!==kind,home=$('home-view');\n    const animate=!!(changed&&view==='home'&&home);\n    if(animate){home.classList.remove('zen-kind-surface-enter');home.style.visibility='hidden';}\n    applyKind(next);\n    if(!animate)return;\n    home.style.visibility='';\n    const motionReduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);\n    if(motionReduced)return;\n    requestAnimationFrame(()=>{\n      home.classList.add('zen-kind-surface-enter');\n      setTimeout(()=>home.classList.remove('zen-kind-surface-enter'),200);\n    });\n  }\n"
zen_js = zen_js[:match.start()] + wrapper + match.group(2) + zen_js[match.end():]
write('budget/zen.js', zen_js)

zen_css = read('budget/zen.css')
zen_transition = ".zen-kind-surface-enter {\n  animation: zenKindSurfaceIn .18s cubic-bezier(.16,1,.3,1);\n}\n\n@keyframes zenKindSurfaceIn {\n  from { opacity: .82; transform: translateY(3px) scale(.998); }\n  to { opacity: 1; transform: none; }\n}\n\n"
zen_css = replace_once(zen_css, '.session-view,\n.complete-view {\n  animation: arrive .8s ease-out;\n}', zen_transition + '.session-view,\n.complete-view {\n  animation: arrive .8s ease-out;\n}', 'insert zen kind transition')
write('budget/zen.css', zen_css)

# 2. Turn the existing Observatory cue inside the sole reactor-start button into an informational orb.
exercise = read('budget/exercise.html')
orb_markup = '''<span class="observatory-next-orb" aria-hidden="true">
            <span class="observatory-next-orb-label" id="reactor-orb-action">STARTA PASS</span>
            <svg class="observatory-star-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M12 1.8C13.3 7.15 16.85 10.7 22.2 12C16.85 13.3 13.3 16.85 12 22.2C10.7 16.85 7.15 13.3 1.8 12C7.15 10.7 10.7 7.15 12 1.8Z"/></svg>
            <span class="observatory-next-orb-meta" id="reactor-orb-meta">Laddar pass</span>
            <svg class="observatory-next-orb-arrow" viewBox="0 0 24 24" fill="none" focusable="false"><path d="M7 17 17 7M8 7h9v9"/></svg>
          </span>'''
exercise = regex_once(exercise, r'<span class="observatory-next-cue" aria-hidden="true">.*?</span>', orb_markup, 'replace Observatory next cue markup', re.S)
exercise = replace_once(exercise, 'pulse-observatory/observatory.css?v=20260915-main-cp7-symbol-cyan-1', 'pulse-observatory/observatory.css?v=20260916-main-next-orb-1', 'Observatory CSS cache')
exercise = replace_once(exercise, 'pulse-environment/environment.js?v=20260915-main-cp7-state-2', 'pulse-environment/environment.js?v=20260916-main-next-orb-1', 'environment JS cache')
write('budget/exercise.html', exercise)

obs_css = read('budget/pulse-observatory/observatory.css')
obs_css = obs_css.replace('observatory-next-cue-arrow', 'observatory-next-orb-arrow').replace('observatory-next-cue', 'observatory-next-orb')
old_block_pattern = r'#pulse-home \.observatory-start\{display:flex;.*?#pulse-home \.observatory-start:focus-visible \.observatory-next-main\{[^}]*\}'
new_block = '''#pulse-home .observatory-start{display:flex;flex-direction:column;align-items:flex-start;gap:12px;border:0;background:none;color:#fff0f4;padding:24px 0 12px;text-align:left;width:100%;font-family:inherit;cursor:pointer}
#pulse-home .observatory-next-main{display:grid;grid-template-columns:minmax(0,1fr) 126px;align-items:center;gap:22px;width:100%}
#pulse-home .observatory-next-copy{display:flex;flex-direction:column;align-items:flex-start;gap:12px;min-width:0}
#pulse-home .observatory-next-orb{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:126px;height:126px;border:1px solid #ff9fba5e;border-radius:50%;color:#ffd2df;background:radial-gradient(circle at 50% 38%,#7ce8ed24 0%,transparent 34%),radial-gradient(circle at 50% 66%,#ff8eab20 0%,#ff4e7d0d 48%,transparent 75%),linear-gradient(145deg,#160f1be8,#0b1118f0);box-shadow:inset 0 0 25px #ffc2d50b,0 0 32px #ff4e7d18,0 0 22px #56d9e50b;overflow:hidden;transition:transform .28s cubic-bezier(.16,1,.3,1),border-color .28s,box-shadow .28s,background .28s}
#pulse-home .observatory-next-orb::before{content:'';position:absolute;inset:8px;border:1px solid #9be4e92b;border-radius:50%;box-shadow:inset 0 0 18px #56d9e510;pointer-events:none}
#pulse-home .observatory-next-orb-label{position:relative;z-index:1;margin-bottom:5px;color:#e9b8c8;font-size:7.5px;font-weight:600;letter-spacing:1.55px;line-height:1;text-transform:uppercase}
#pulse-home .observatory-next-orb .observatory-star-glyph{position:relative;z-index:1;width:31px;height:31px;color:#9be4e9;filter:drop-shadow(0 0 7px #d8fdff8c) drop-shadow(0 0 15px #56d9e55c)}
#pulse-home .observatory-next-orb-meta{position:relative;z-index:1;display:-webkit-box;max-width:94px;margin-top:6px;overflow:hidden;color:#d6b7c5;font-size:8.5px;line-height:1.25;text-align:center;-webkit-box-orient:vertical;-webkit-line-clamp:2}
#pulse-home .observatory-next-orb-arrow{position:absolute;right:14px;bottom:13px;width:14px;height:14px;stroke:#f6b4c8;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round;opacity:.86}
#pulse-home .observatory-start:hover .observatory-next-orb,#pulse-home .observatory-start:focus-visible .observatory-next-orb{transform:translateY(-2px) scale(1.025);border-color:#ffbdcf82;background:radial-gradient(circle at 50% 38%,#8bf0f52e 0%,transparent 35%),radial-gradient(circle at 50% 66%,#ff9bb42b 0%,#ff4e7d16 48%,transparent 74%),linear-gradient(145deg,#190f1dec,#0b1219f2);box-shadow:inset 0 0 25px #ffd0dc10,0 0 40px #ff4e7d30,0 0 28px #56d9e51a}
#pulse-home .observatory-start:focus-visible{outline:none}
#pulse-home .observatory-start:focus-visible .observatory-next-main{outline:1px solid #ffb6c94a;outline-offset:8px;border-radius:8px}'''
obs_css = regex_once(obs_css, old_block_pattern, new_block, 'replace Observatory start/cue composition', re.S)
mobile_old = ''' #pulse-home .observatory-next-main{grid-template-columns:minmax(0,1fr) 52px;gap:12px}
 #pulse-home .observatory-next-copy{gap:7px}
 #pulse-home .observatory-next-orb{width:50px;height:50px}
 #pulse-home .observatory-next-orb .observatory-star-glyph{width:21px;height:21px}
 #pulse-home .observatory-next-orb-arrow{right:6px;top:6px;width:12px;height:12px}'''
mobile_new = ''' #pulse-home .observatory-next-main{grid-template-columns:minmax(0,1fr) 110px;gap:14px}
 #pulse-home .observatory-next-copy{gap:7px}
 #pulse-home .observatory-next-orb{width:108px;height:108px}
 #pulse-home .observatory-next-orb::before{inset:7px}
 #pulse-home .observatory-next-orb-label{font-size:7px;letter-spacing:1.25px;margin-bottom:4px}
 #pulse-home .observatory-next-orb .observatory-star-glyph{width:27px;height:27px}
 #pulse-home .observatory-next-orb-meta{max-width:80px;margin-top:5px;font-size:7.8px}
 #pulse-home .observatory-next-orb-arrow{right:12px;bottom:11px;width:12px;height:12px}'''
obs_css = replace_once(obs_css, mobile_old, mobile_new, 'replace mobile Observatory orb sizing')
obs_css = replace_once(obs_css, '@media(max-width:360px){\n #pulse-home .observatory-metrics', '@media(max-width:360px){\n #pulse-home .observatory-next-main{grid-template-columns:minmax(0,1fr) 98px;gap:10px}\n #pulse-home .observatory-next-orb{width:96px;height:96px}\n #pulse-home .observatory-next-orb-meta{max-width:72px;font-size:7.2px}\n #pulse-home .observatory-metrics', 'add 360px Observatory orb sizing')
write('budget/pulse-observatory/observatory.css', obs_css)

env = read('budget/pulse-environment/environment.js')
env = replace_once(env, "    setText('reactor-action', hasPlan ? 'Starta pass' : 'Bygg pass');", "    setText('reactor-action', hasPlan ? 'Starta pass' : 'Bygg pass');\n    setText('reactor-orb-action', hasPlan ? 'STARTA PASS' : 'BYGG PASS');\n    setText('reactor-orb-meta', hasPlan ? summary : 'Skapa upplägg');", 'feed Observatory orb copy')
write('budget/pulse-environment/environment.js', env)

# 3. Cache-bust Zen runtime/CSS so the kind transition is visible in Safari and in the lazy loader.
zen_html = read('budget/zen.html')
zen_html = replace_once(zen_html, 'zen.css?v=20260916-unified-tabs-1', 'zen.css?v=20260916-kind-enter-1', 'Zen CSS cache')
zen_html = replace_once(zen_html, 'zen.js?v=20260913-cleanup', 'zen.js?v=20260916-kind-enter-1', 'Zen JS cache')
write('budget/zen.html', zen_html)

# 4. Permanent regression tests.
wellness_test = read('budget/tests/training-wellness-shell.test.cjs')
wellness_test = replace_once(wellness_test, "const zen=read('zen.html');", "const zen=read('zen.html');\nconst zenRuntime=read('zen.js');\nconst zenCss=read('zen.css');", 'wellness test Zen runtime owners')
insert_after = "test('wellness morph animates only the incoming surface and remains short',()=>{\n  assert.match(shellCss,/wellnessSurfaceIn \\.18s/);\n  assert.doesNotMatch(shellCss,/wellnessSurfaceOld|wellnessSurfaceNew/);\n  const morphCss=shellCss.slice(shellCss.indexOf('.wellness-surface-enter'),shellCss.indexOf('@media(max-width:760px)'));\n  assert.doesNotMatch(morphCss,/filter:blur/);\n  assert.match(shell,/target\\.classList\\.add\\('wellness-surface-enter'\\)/);\n  assert.match(shell,/\\},200\\);/);\n});\n"
new_test = "\ntest('Stretch and Meditation reuse the same incoming-only atomic transition model',()=>{\n  assert.match(zenRuntime,/function applyKind\\(next\\)/);\n  assert.match(zenRuntime,/home\\.style\\.visibility='hidden'/);\n  assert.match(zenRuntime,/home\\.classList\\.add\\('zen-kind-surface-enter'\\)/);\n  assert.match(zenRuntime,/prefers-reduced-motion: reduce/);\n  assert.match(zenCss,/\\.zen-kind-surface-enter \\{[\\s\\S]*zenKindSurfaceIn \\.18s/);\n  assert.match(zenCss,/@keyframes zenKindSurfaceIn/);\n  assert.doesNotMatch(zenCss,/::view-transition-/);\n});\n"
wellness_test = replace_once(wellness_test, insert_after, insert_after + new_test, 'add Zen kind transition regression')
wellness_test = replace_once(wellness_test, "  assert.match(exercise,/training-overview-mode\\.js\\?v=20260916-main-cp8-header-toggle-1/);\n});", "  assert.match(exercise,/training-overview-mode\\.js\\?v=20260916-main-cp8-header-toggle-1/);\n  assert.match(zen,/zen\\.css\\?v=20260916-kind-enter-1/);\n  assert.match(zen,/zen\\.js\\?v=20260916-kind-enter-1/);\n});", 'Zen kind cache regression')
write('budget/tests/training-wellness-shell.test.cjs', wellness_test)

identity = read('budget/tests/training-observatory-identity.test.cjs')
identity = identity.replace('observatory-next-cue', 'observatory-next-orb')
identity = replace_once(identity, "  assert.match(environment, /setText\\('reactor-action', hasPlan \\? 'Starta pass' : 'Bygg pass'\\)/);", "  assert.match(environment, /setText\\('reactor-action', hasPlan \\? 'Starta pass' : 'Bygg pass'\\)/);\n  assert.match(nextBlock, /id=\"reactor-orb-action\"/);\n  assert.match(nextBlock, /id=\"reactor-orb-meta\"/);\n  assert.match(environment, /setText\\('reactor-orb-action', hasPlan \\? 'STARTA PASS' : 'BYGG PASS'\\)/);\n  assert.match(environment, /setText\\('reactor-orb-meta', hasPlan \\? summary : 'Skapa upplägg'\\)/);", 'Observatory orb identity regression')
identity = identity.replace('pulse-observatory\\/observatory\\.css\\?v=20260915-main-cp7-symbol-cyan-1', 'pulse-observatory\\/observatory\\.css\\?v=20260916-main-next-orb-1')
identity = identity.replace('pulse-environment\\/environment\\.js\\?v=20260915-main-cp7-state-2', 'pulse-environment\\/environment\\.js\\?v=20260916-main-next-orb-1')
write('budget/tests/training-observatory-identity.test.cjs', identity)

state = read('budget/tests/training-observatory-state.test.cjs')
state = state.replace('observatory-next-cue', 'observatory-next-orb')
state = state.replace('pulse-observatory\\/observatory\\.css\\?v=20260915-main-cp7-symbol-cyan-1', 'pulse-observatory\\/observatory\\.css\\?v=20260916-main-next-orb-1')
state = state.replace('pulse-environment\\/environment\\.js\\?v=20260915-main-cp7-state-2', 'pulse-environment\\/environment\\.js\\?v=20260916-main-next-orb-1')
write('budget/tests/training-observatory-state.test.cjs', state)

mobile = read('budget/tests/training-observatory-mobile.test.cjs')
mobile = mobile.replace('pulse-observatory\\/observatory\\.css\\?v=20260915-main-cp7-symbol-cyan-1', 'pulse-observatory\\/observatory\\.css\\?v=20260916-main-next-orb-1')
mobile = mobile.replace('pulse-environment\\/environment\\.js\\?v=20260915-main-cp7-state-2', 'pulse-environment\\/environment\\.js\\?v=20260916-main-next-orb-1')
write('budget/tests/training-observatory-mobile.test.cjs', mobile)

# Sanity checks before tests.
for forbidden in ('observatory-next-cue', 'observatory-next-cue-arrow'):
    if forbidden in read('budget/exercise.html') or forbidden in read('budget/pulse-observatory/observatory.css'):
        raise SystemExit(f'dead Observatory cue class remains: {forbidden}')
if 'document.startViewTransition' in read('budget/zen.js'):
    raise SystemExit('Zen kind transition must not introduce outgoing snapshots')
print('Migration applied cleanly')
