from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    return text.replace(old, new, 1)

# Cache keys
path = 'budget/exercise.html'
html = read(path)
html = replace_once(html,
    'pulse-observatory/observatory.css?v=20260916-main-next-pass-orb-2',
    'pulse-observatory/observatory.css?v=20260916-main-action-hierarchy-1',
    'Observatory CSS cache')
html = replace_once(html,
    'pulse-environment/environment.js?v=20260916-main-next-pass-orb-2',
    'pulse-environment/environment.js?v=20260916-main-action-hierarchy-1',
    'environment JS cache')
write(path, html)

# Observatory styling
path = 'budget/pulse-observatory/observatory.css'
css = read(path)
css = replace_once(css,
    '#pulse-home .observatory-next-actions{display:grid;grid-template-columns:minmax(0,1fr) 126px;align-items:center;gap:22px;width:100%;margin-top:18px}',
    '#pulse-home .observatory-next-actions{position:relative;isolation:isolate;display:flex;align-items:center;gap:14px;width:100%;margin-top:18px}',
    'action cluster layout')
css = replace_once(css,
    '#pulse-home .observatory-next-orb-wrap{position:relative;display:grid;place-items:center;width:126px;justify-self:end}',
    '#pulse-home .observatory-next-actions::before{content:\'\';position:absolute;inset:-22px -24px;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 55% 52%,#08060cb8 0%,#08060c70 38%,#08060c2b 58%,transparent 78%);filter:blur(5px)}\n#pulse-home .observatory-next-orb-wrap{position:relative;display:grid;place-items:center;width:116px;flex:0 0 116px}',
    'action mask and orb wrap')
css = replace_once(css,
    '#pulse-home .observatory-next-orb{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:126px;height:126px;padding:0;border:1px solid #ff9fba52;border-radius:50%;color:#ffd2df;background:radial-gradient(circle at 50% 38%,#7ce8ed1b 0%,transparent 34%),radial-gradient(circle at 50% 66%,#ff8eab18 0%,#ff4e7d09 48%,transparent 75%),linear-gradient(145deg,#160f1bbf,#0b1118cf);box-shadow:inset 0 0 25px #ffc2d508,0 0 27px #ff4e7d12,0 0 19px #56d9e508;overflow:hidden;opacity:.82;font-family:inherit;cursor:pointer;transition:transform .28s cubic-bezier(.16,1,.3,1),opacity .28s,border-color .28s,box-shadow .28s,background .28s}',
    '#pulse-home .observatory-next-orb{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:116px;height:116px;padding:0;border:1px solid #ff9fba40;border-radius:50%;color:#ffd2df;background:radial-gradient(circle at 50% 38%,#7ce8ed17 0%,transparent 35%),radial-gradient(circle at 50% 66%,#ff8eab14 0%,#ff4e7d07 48%,transparent 75%),linear-gradient(145deg,#160f1ba8,#0b1118bd);box-shadow:inset 0 0 22px #ffc2d507,0 0 23px #ff4e7d0e,0 0 16px #56d9e506;overflow:hidden;opacity:.62;font-family:inherit;cursor:pointer;transition:transform .28s cubic-bezier(.16,1,.3,1),opacity .28s,border-color .28s,box-shadow .28s,background .28s,filter .28s}',
    'orb base')
css = replace_once(css,
    '#pulse-home .observatory-next-orb-label{position:relative;z-index:1;margin-bottom:5px;color:#e9b8c8;font-size:7.5px;font-weight:600;letter-spacing:1.55px;line-height:1;text-transform:uppercase}',
    '#pulse-home .observatory-next-orb-label{position:relative;z-index:1;margin-bottom:5px;color:#e9b8c8;font-size:7px;font-weight:600;letter-spacing:1.35px;line-height:1.15;text-transform:uppercase}',
    'orb label')
css = replace_once(css,
    '#pulse-home .observatory-next-orb .observatory-star-glyph{position:relative;z-index:1;width:31px;height:31px;color:#9be4e9;filter:drop-shadow(0 0 7px #d8fdff8c) drop-shadow(0 0 15px #56d9e55c)}',
    '#pulse-home .observatory-next-orb .observatory-star-glyph{position:relative;z-index:1;width:29px;height:29px;color:#9be4e9;filter:drop-shadow(0 0 6px #d8fdff78) drop-shadow(0 0 12px #56d9e548)}',
    'orb star')
css = replace_once(css,
    '#pulse-home .observatory-next-orb-meta{position:relative;z-index:1;display:-webkit-box;max-width:94px;margin-top:6px;overflow:hidden;color:#d6b7c5;font-size:8.5px;line-height:1.25;text-align:center;-webkit-box-orient:vertical;-webkit-line-clamp:2}',
    '#pulse-home .observatory-next-orb-meta{position:relative;z-index:1;display:-webkit-box;max-width:88px;margin-top:5px;overflow:hidden;color:#d6b7c5;font-size:7.8px;line-height:1.25;text-align:center;-webkit-box-orient:vertical;-webkit-line-clamp:2}',
    'orb meta')
css = replace_once(css,
    '#pulse-home .observatory-next-orb:hover,#pulse-home .observatory-next-orb:focus-visible{transform:translateY(-2px) scale(1.025);opacity:1;border-color:#ffbdcf82;background:radial-gradient(circle at 50% 38%,#8bf0f526 0%,transparent 35%),radial-gradient(circle at 50% 66%,#ff9bb422 0%,#ff4e7d10 48%,transparent 74%),linear-gradient(145deg,#190f1dd8,#0b1219df);box-shadow:inset 0 0 25px #ffd0dc0d,0 0 36px #ff4e7d28,0 0 25px #56d9e515}',
    '#pulse-home .observatory-next-orb:hover,#pulse-home .observatory-next-orb:focus-visible{transform:translateY(-2px) scale(1.025);opacity:1;border-color:#ffbdcf82;background:radial-gradient(circle at 50% 38%,#8bf0f526 0%,transparent 35%),radial-gradient(circle at 50% 66%,#ff9bb422 0%,#ff4e7d10 48%,transparent 74%),linear-gradient(145deg,#190f1dd8,#0b1219df);box-shadow:inset 0 0 25px #ffd0dc0d,0 0 36px #ff4e7d28,0 0 25px #56d9e515}\n#pulse-home #reactor-core[data-plan-state="empty"] .observatory-next-orb{opacity:.56;filter:saturate(.72);border-color:#caa6b52c;box-shadow:inset 0 0 18px #bda2ad08,0 0 13px #6fdbe508}\n#pulse-home #reactor-core[data-plan-state="empty"] .observatory-next-orb .observatory-star-glyph{opacity:.72;filter:drop-shadow(0 0 5px #56d9e538)}\n#pulse-home #reactor-core[data-plan-state="empty"] .observatory-next-orb-meta{display:none}\n#pulse-home #reactor-core[data-plan-state="planned"] .observatory-next-orb{opacity:.96;border-color:#ffb6ca72;filter:none;box-shadow:inset 0 0 24px #ffc7d50c,0 0 30px #ff4f7d20,0 0 25px #56d9e516;animation:observatoryNextReady 3.8s ease-in-out infinite}\n#pulse-home #reactor-core[data-plan-state="planned"] .observatory-next-orb .observatory-star-glyph{filter:drop-shadow(0 0 7px #d8fdff9c) drop-shadow(0 0 16px #56d9e56c)}',
    'dynamic orb hierarchy')
css = replace_once(css,
    '#pulse-home .observatory-build{position:relative;isolation:isolate;display:inline-flex;align-items:center;justify-content:center;gap:16px;width:max-content;max-width:100%;min-height:48px;margin:0;padding:12px 23px;border:1px solid #ffa3c05e;border-radius:99px;background:linear-gradient(110deg,#f44a6f30,#fa85b112);box-shadow:0 0 40px #ff4e7926,inset 0 0 20px #ffb0c10c;color:#ffcada;font:500 13px Inter,sans-serif;cursor:pointer;transition:box-shadow .3s,background .3s,transform .28s}',
    '#pulse-home .observatory-build{position:relative;isolation:isolate;display:inline-flex;align-items:center;justify-content:center;gap:16px;width:205px;max-width:100%;min-height:48px;margin:0;padding:12px 20px;border:1px solid #ffa3c05e;border-radius:99px;background:linear-gradient(110deg,#f44a6f30,#fa85b112);box-shadow:0 0 40px #ff4e7926,inset 0 0 20px #ffb0c10c;color:#ffcada;font:500 13px Inter,sans-serif;cursor:pointer;transition:box-shadow .3s,background .3s,transform .28s,opacity .28s}',
    'build width')
css = replace_once(css,
    '#pulse-home .observatory-build:hover,#pulse-home .observatory-build:focus-visible{background:#ff60813b;box-shadow:0 0 48px #ff588f40;transform:translateY(-1px);outline:none}',
    '#pulse-home .observatory-build:hover,#pulse-home .observatory-build:focus-visible{background:#ff60813b;box-shadow:0 0 48px #ff588f40;transform:translateY(-1px);outline:none}\n#pulse-home #reactor-core[data-plan-state="empty"] .observatory-build{opacity:1;border-color:#ffadc571;background:linear-gradient(110deg,#f44a6f3d,#fa85b11b);box-shadow:0 0 44px #ff4e7930,inset 0 0 20px #ffb0c110}\n#pulse-home #reactor-core[data-plan-state="planned"] .observatory-build{opacity:.68;box-shadow:0 0 24px #ff4e7915,inset 0 0 16px #ffb0c108}',
    'dynamic build hierarchy')
css = replace_once(css,
    '@keyframes observatoryActionGlow{0%,100%{opacity:.05}50%{opacity:.16}}',
    '@keyframes observatoryActionGlow{0%,100%{opacity:.05}50%{opacity:.16}}\n@keyframes observatoryNextReady{0%,100%{box-shadow:inset 0 0 24px #ffc7d50c,0 0 26px #ff4f7d1c,0 0 20px #56d9e512}50%{box-shadow:inset 0 0 28px #ffc7d512,0 0 36px #ff4f7d2b,0 0 30px #56d9e51d}}',
    'ready pulse keyframes')
css = replace_once(css,
    ' #pulse-home .observatory-next-actions{grid-template-columns:minmax(0,1fr) 110px;gap:14px;margin-top:12px}\n #pulse-home .observatory-next-orb-wrap{width:108px}',
    ' #pulse-home .observatory-next-actions{gap:10px;margin-top:12px}\n #pulse-home .observatory-next-orb-wrap{width:102px;flex-basis:102px}',
    'mobile action cluster')
css = replace_once(css,
    ' #pulse-home .observatory-next-orb{width:108px;height:108px}',
    ' #pulse-home .observatory-next-orb{width:102px;height:102px}',
    'mobile orb size')
css = replace_once(css,
    ' #pulse-home .observatory-build{min-height:44px;padding:10px 17px;gap:12px;font-size:12px}',
    ' #pulse-home .observatory-build{width:190px;min-height:44px;padding:10px 15px;gap:12px;font-size:12px}',
    'mobile build width')
css = replace_once(css,
    ' #pulse-home .observatory-next-actions{grid-template-columns:minmax(0,1fr) 96px;gap:10px}\n #pulse-home .observatory-next-orb-wrap{width:96px}\n #pulse-home .observatory-next-orb{width:96px;height:96px}',
    ' #pulse-home .observatory-next-actions{gap:8px}\n #pulse-home .observatory-next-orb-wrap{width:92px;flex-basis:92px}\n #pulse-home .observatory-next-orb{width:92px;height:92px}\n #pulse-home .observatory-build{width:176px}',
    'small mobile sizes')
css = replace_once(css,
    ' #pulse-home .observatory-start-notice{transition:none!important}',
    ' #pulse-home .observatory-start-notice{transition:none!important}\n #pulse-home #reactor-core[data-plan-state="planned"] .observatory-next-orb{animation:none!important}',
    'reduced motion ready pulse')
write(path, css)

# Observatory state/data behavior
path = 'budget/pulse-environment/environment.js'
env = read(path)
env = replace_once(env,
    "    setText('reactor-action', 'Bygg pass');\n    setText('reactor-orb-meta', hasPlan ? summary : 'Inget planerat');\n    const start = document.getElementById('reactor-start');\n    start.disabled = false;\n    start.dataset.planState = hasPlan ? 'planned' : 'empty';",
    "    setText('reactor-action', 'Bygg pass');\n    const orbSummary = hasPlan ? (title + ' · ' + summary.split(' · ')[0]) : '';\n    setText('reactor-orb-meta', orbSummary);\n    core.dataset.planState = hasPlan ? 'planned' : 'empty';\n    const start = document.getElementById('reactor-start');\n    start.disabled = false;\n    start.dataset.planState = hasPlan ? 'planned' : 'empty';",
    'dynamic action state')
write(path, env)

# Permanent regression test
path = ROOT / 'budget/tests/training-observatory-action-hierarchy.test.cjs'
path.write_text(r'''const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('exercise.html');
const css = read('pulse-observatory/observatory.css');
const env = read('pulse-environment/environment.js');

test('next-pass action hierarchy is plan-aware and keeps canonical action owners', () => {
  assert.match(html, /id="reactor-build"/);
  assert.match(html, /id="reactor-start"/);
  assert.equal((html.match(/id="reactor-start"/g) || []).length, 1);
  assert.match(env, /core\.dataset\.planState = hasPlan \? 'planned' : 'empty'/);
  assert.match(env, /if \(hasPlan\) \{ window\.startWorkoutSessionForDate\(selectedDate\); return; \}/);
  assert.match(env, /document\.getElementById\('reactor-build'\)\.addEventListener\('click', openSelectedBuilder\)/);
  assert.match(env, /const orbSummary = hasPlan \? \(title \+ ' · ' \+ summary\.split\(' · '\)\[0\]\) : ''/);
  assert.doesNotMatch(env, /setText\('reactor-orb-meta', hasPlan \? summary : 'Inget planerat'\)/);
});

test('action cluster is compact, locally masked and visually prioritizes the available action', () => {
  assert.match(css, /observatory-next-actions\{position:relative;isolation:isolate;display:flex;align-items:center;gap:14px/);
  assert.match(css, /observatory-next-actions::before\{[^}]*radial-gradient/);
  assert.match(css, /observatory-next-orb-wrap\{[^}]*width:116px;flex:0 0 116px/);
  assert.match(css, /observatory-next-orb\{[^}]*width:116px;height:116px/);
  assert.match(css, /data-plan-state="empty"\] \.observatory-next-orb\{opacity:\.56/);
  assert.match(css, /data-plan-state="empty"\] \.observatory-next-orb-meta\{display:none\}/);
  assert.match(css, /data-plan-state="planned"\] \.observatory-next-orb\{opacity:\.96/);
  assert.match(css, /animation:observatoryNextReady 3\.8s/);
  assert.match(css, /data-plan-state="empty"\] \.observatory-build\{opacity:1/);
  assert.match(css, /data-plan-state="planned"\] \.observatory-build\{opacity:\.68/);
  assert.match(css, /observatory-build\{[^}]*width:205px/);
});

test('mobile action proportions keep the orb subordinate without breaking small screens', () => {
  assert.match(css, /observatory-next-orb-wrap\{width:102px;flex-basis:102px\}/);
  assert.match(css, /observatory-next-orb\{width:102px;height:102px\}/);
  assert.match(css, /observatory-build\{width:190px;min-height:44px/);
  assert.match(css, /observatory-next-orb-wrap\{width:92px;flex-basis:92px\}/);
  assert.match(css, /observatory-next-orb\{width:92px;height:92px\}/);
  assert.match(css, /observatory-build\{width:176px\}/);
});

test('cache keys point at the action hierarchy release', () => {
  assert.match(html, /observatory\.css\?v=20260916-main-action-hierarchy-1/);
  assert.match(html, /environment\.js\?v=20260916-main-action-hierarchy-1/);
});
''', encoding='utf-8')

print('Applied Observatory action hierarchy polish')
