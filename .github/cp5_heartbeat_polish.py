from pathlib import Path

ROOT = Path('budget')


def read(rel):
    return (ROOT / rel).read_text()


def write(rel, text):
    (ROOT / rel).write_text(text)


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, got {count}')
    return text.replace(old, new, 1)


html = read('exercise.html')
old_brand = '''      <div class="brand-text"><h1 style="cursor:pointer" onclick="location.href='home.html'"><span class="compact-only">Träning</span><span class="observatory-only">PULSE<span class="pulse-brand-flow">FLOW</span></span></h1><p>Markus Strickert</p></div>
      <span class="observatory-header-star observatory-only" aria-hidden="true"><svg class="observatory-star-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M12 1.8C13.3 7.15 16.85 10.7 22.2 12C16.85 13.3 13.3 16.85 12 22.2C10.7 16.85 7.15 13.3 1.8 12C7.15 10.7 10.7 7.15 12 1.8Z"/></svg></span>'''
new_brand = '''      <div class="brand-text"><h1 style="cursor:pointer" onclick="location.href='home.html'"><span class="compact-only">Träning</span><span class="observatory-only observatory-brand-lockup">PULSE<span class="pulse-brand-flow">FLOW</span><span class="observatory-header-star" aria-hidden="true"><svg class="observatory-star-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M12 1.8C13.3 7.15 16.85 10.7 22.2 12C16.85 13.3 13.3 16.85 12 22.2C10.7 16.85 7.15 13.3 1.8 12C7.15 10.7 10.7 7.15 12 1.8Z"/></svg></span></span></h1><p>Markus Strickert</p></div>'''
html = replace_once(html, old_brand, new_brand, 'Observatory header lockup')
html = replace_once(
    html,
    'pulse-observatory/observatory.css?v=20260915-main-cp5-identity-1',
    'pulse-observatory/observatory.css?v=20260915-main-cp5-heartbeat-polish-1',
    'Observatory CSS cache key'
)
write('exercise.html', html)

css = read('pulse-observatory/observatory.css')
css = replace_once(
    css,
    '#pulse-header .observatory-header-star{position:relative;display:grid;place-items:center;width:34px;height:34px;margin-left:7px;color:#ffd1dc;flex:0 0 34px;pointer-events:none}',
    '#pulse-header .observatory-brand-lockup{display:inline-flex;align-items:center;gap:10px;vertical-align:middle}#pulse-header .observatory-header-star{position:relative;display:grid;place-items:center;width:28px;height:28px;margin:0;color:#ffd1dc;flex:0 0 28px;pointer-events:none}',
    'header star positioning'
)
css = replace_once(
    css,
    '#pulse-header .observatory-header-star .observatory-star-glyph{width:25px;height:25px;overflow:visible;transform-origin:50% 50%;animation:observatoryHeartbeat 2.55s linear infinite;animation-play-state:var(--observatory-identity-motion,paused)}',
    '#pulse-header .observatory-header-star .observatory-star-glyph{width:22px;height:22px;overflow:visible;transform-origin:50% 50%;will-change:transform,filter,opacity;animation:observatoryHeartbeat 2.05s linear infinite;animation-play-state:var(--observatory-identity-motion,paused)}#pulse-header .observatory-header-star .observatory-star-glyph path{stroke-width:1.7}',
    'header star cadence and stroke'
)
css = replace_once(
    css,
    '@keyframes observatoryHeartbeat{0%,16%,100%{transform:scale(1);opacity:.62;filter:drop-shadow(0 0 3px #ff70984a)}3%{transform:scale(1.18);opacity:1;filter:drop-shadow(0 0 5px #ffbad0) drop-shadow(0 0 15px #ff4d8199)}6%{transform:scale(.96);opacity:.74;filter:drop-shadow(0 0 4px #ff70985c)}9%{transform:scale(1.09);opacity:.94;filter:drop-shadow(0 0 4px #ffd0dc) drop-shadow(0 0 10px #ff5c897a)}13%{transform:scale(1);opacity:.64;filter:drop-shadow(0 0 3px #ff70984a)}}',
    '@keyframes observatoryHeartbeat{0%,18%,100%{transform:translateY(0) scale(1) rotate(0deg);opacity:.72;filter:drop-shadow(0 0 4px #ff70985a)}3%{transform:translateY(-.2px) scale(1.16) rotate(-.6deg);opacity:1;filter:drop-shadow(0 0 5px #ffd0dd) drop-shadow(0 0 15px #ff4d8199)}6%{transform:translateY(.1px) scale(.98) rotate(.3deg);opacity:.82;filter:drop-shadow(0 0 4px #ff709866)}9%{transform:translateY(-.1px) scale(1.085) rotate(.4deg);opacity:.98;filter:drop-shadow(0 0 5px #ffd0dc) drop-shadow(0 0 11px #ff5c8985)}13%{transform:translateY(0) scale(1) rotate(0deg);opacity:.74;filter:drop-shadow(0 0 4px #ff70985a)}32%{transform:translateY(-.35px) scale(1.008) rotate(.25deg);opacity:.77;filter:drop-shadow(0 0 5px #ff7d9d61)}50%{transform:translateY(.2px) scale(.998) rotate(-.2deg);opacity:.70;filter:drop-shadow(0 0 3.5px #ff709850)}68%{transform:translateY(-.25px) scale(1.006) rotate(.18deg);opacity:.76;filter:drop-shadow(0 0 4.5px #ff78995c)}86%{transform:translateY(.1px) scale(1) rotate(-.12deg);opacity:.71;filter:drop-shadow(0 0 3.5px #ff709852)}}',
    'heartbeat motion'
)
css = replace_once(
    css,
    ' #pulse-header .observatory-header-star{width:30px;height:30px;flex-basis:30px;margin-left:3px}\n #pulse-header .observatory-header-star .observatory-star-glyph{width:22px;height:22px}\n',
    ' #pulse-header .observatory-brand-lockup{gap:8px}\n #pulse-header .observatory-header-star{width:27px;height:27px;flex-basis:27px;margin:0}\n #pulse-header .observatory-header-star .observatory-star-glyph{width:21px;height:21px}\n',
    'mobile header positioning'
)
write('pulse-observatory/observatory.css', css)

test = read('tests/training-observatory-identity.test.cjs')
test = replace_once(
    test,
    '  assert.match(html, /observatory-header-star observatory-only/);',
    '  assert.match(html, /observatory-only observatory-brand-lockup[^>]*>PULSE[\\s\\S]*observatory-header-star/);',
    'header structure test'
)
old_heartbeat_test = '''  assert.match(css, /@keyframes observatoryHeartbeat\\{0%,16%,100%/);
  assert.match(css, /3%\\{transform:scale\\(1\\.18\\)/);
  assert.match(css, /9%\\{transform:scale\\(1\\.09\\)/);
  assert.match(css, /animation-play-state:var\\(--observatory-identity-motion,paused\\)/);'''
new_heartbeat_test = '''  assert.match(css, /animation:observatoryHeartbeat 2\\.05s linear infinite/);
  assert.match(css, /@keyframes observatoryHeartbeat\\{0%,18%,100%/);
  assert.match(css, /3%\\{transform:translateY\\(-\\.2px\\) scale\\(1\\.16\\)/);
  assert.match(css, /9%\\{transform:translateY\\(-\\.1px\\) scale\\(1\\.085\\)/);
  assert.match(css, /50%\\{transform:translateY\\(\\.2px\\) scale\\(\\.998\\) rotate\\(-\\.2deg\\)/);
  assert.match(css, /observatory-header-star \\.observatory-star-glyph path\\{stroke-width:1\\.7\\}/);
  assert.match(css, /animation-play-state:var\\(--observatory-identity-motion,paused\\)/);'''
test = replace_once(test, old_heartbeat_test, new_heartbeat_test, 'heartbeat regression test')
test = replace_once(
    test,
    '  assert.match(html, /pulse-observatory\\/observatory\\.css\\?v=20260915-main-cp5-identity-1/);',
    '  assert.match(html, /pulse-observatory\\/observatory\\.css\\?v=20260915-main-cp5-heartbeat-polish-1/);',
    'CSS cache test'
)
write('tests/training-observatory-identity.test.cjs', test)
