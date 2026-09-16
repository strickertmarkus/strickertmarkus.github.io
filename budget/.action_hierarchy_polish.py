from pathlib import Path

ROOT = Path(__file__).resolve().parent


def replace(path, old, new, label):
    text = path.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'missing {label} in {path}')
    path.write_text(text.replace(old, new, 1), encoding='utf-8')

css = ROOT / 'pulse-observatory' / 'observatory.css'
js = ROOT / 'pulse-environment' / 'environment.js'
html = ROOT / 'exercise.html'
identity = ROOT / 'tests' / 'training-observatory-identity.test.cjs'
mobile = ROOT / 'tests' / 'training-observatory-mobile.test.cjs'

replace(css,
'''#pulse-home .observatory-next-actions{display:grid;grid-template-columns:minmax(0,1fr) 126px;align-items:center;gap:22px;width:100%;margin-top:18px}
#pulse-home .observatory-next-orb-wrap{position:relative;display:grid;place-items:center;width:126px;justify-self:end}
#pulse-home .observatory-next-orb{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:126px;height:126px;padding:0;border:1px solid #ff9fba52;border-radius:50%;color:#ffd2df;background:radial-gradient(circle at 50% 38%,#7ce8ed1b 0%,transparent 34%),radial-gradient(circle at 50% 66%,#ff8eab18 0%,#ff4e7d09 48%,transparent 75%),linear-gradient(145deg,#160f1bbf,#0b1118cf);box-shadow:inset 0 0 25px #ffc2d508,0 0 27px #ff4e7d12,0 0 19px #56d9e508;overflow:hidden;opacity:.82;font-family:inherit;cursor:pointer;transition:transform .28s cubic-bezier(.16,1,.3,1),opacity .28s,border-color .28s,box-shadow .28s,background .28s}
#pulse-home .observatory-next-orb::before{content:'';position:absolute;inset:8px;border:1px solid #9be4e92b;border-radius:50%;box-shadow:inset 0 0 18px #56d9e510;pointer-events:none}
#pulse-home .observatory-next-orb-label{position:relative;z-index:1;margin-bottom:5px;color:#e9b8c8;font-size:7.5px;font-weight:600;letter-spacing:1.55px;line-height:1;text-transform:uppercase}
#pulse-home .observatory-next-orb .observatory-star-glyph{position:relative;z-index:1;width:31px;height:31px;color:#9be4e9;filter:drop-shadow(0 0 7px #d8fdff8c) drop-shadow(0 0 15px #56d9e55c)}
#pulse-home .observatory-next-orb-meta{position:relative;z-index:1;display:-webkit-box;max-width:94px;margin-top:6px;overflow:hidden;color:#d6b7c5;font-size:8.5px;line-height:1.25;text-align:center;-webkit-box-orient:vertical;-webkit-line-clamp:2}
#pulse-home .observatory-next-orb-arrow{position:absolute;right:14px;bottom:13px;width:14px;height:14px;stroke:#f6b4c8;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round;opacity:.86}
#pulse-home .observatory-next-orb:hover,#pulse-home .observatory-next-orb:focus-visible{transform:translateY(-2px) scale(1.025);opacity:1;border-color:#ffbdcf82;background:radial-gradient(circle at 50% 38%,#8bf0f526 0%,transparent 35%),radial-gradient(circle at 50% 66%,#ff9bb422 0%,#ff4e7d10 48%,transparent 74%),linear-gradient(145deg,#190f1dd8,#0b1219df);box-shadow:inset 0 0 25px #ffd0dc0d,0 0 36px #ff4e7d28,0 0 25px #56d9e515}
''',
'''#pulse-home .observatory-next-actions{position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(0,1fr) 112px;align-items:center;gap:16px;width:100%;margin-top:18px}
#pulse-home .observatory-next-actions::before{content:'';position:absolute;inset:-25px -24px;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 54% 55%,#09070dcc 0%,#09070d9e 46%,#09070d3d 66%,transparent 80%);filter:blur(3px)}
#pulse-home .observatory-next-orb-wrap{position:relative;display:grid;place-items:center;width:112px;justify-self:end}
#pulse-home .observatory-next-orb{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:112px;height:112px;padding:0;border:1px solid #ff9fba42;border-radius:50%;color:#ffd2df;background:radial-gradient(circle at 50% 38%,#7ce8ed16 0%,transparent 34%),radial-gradient(circle at 50% 66%,#ff8eab13 0%,#ff4e7d07 48%,transparent 75%),linear-gradient(145deg,#160f1ba8,#0b1118b8);box-shadow:inset 0 0 22px #ffc2d506,0 0 19px #ff4e7d0e,0 0 15px #56d9e506;overflow:hidden;opacity:.72;font-family:inherit;cursor:pointer;transition:transform .28s cubic-bezier(.16,1,.3,1),opacity .28s,border-color .28s,box-shadow .28s,background .28s}
#pulse-home .observatory-next-orb::before{content:'';position:absolute;inset:7px;border:1px solid #9be4e924;border-radius:50%;box-shadow:inset 0 0 16px #56d9e50c;pointer-events:none}
#pulse-home .observatory-next-orb-label{position:relative;z-index:1;margin-bottom:4px;color:#e9b8c8;font-size:7.2px;font-weight:600;letter-spacing:1.35px;line-height:1;text-transform:uppercase}
#pulse-home .observatory-next-orb .observatory-star-glyph{position:relative;z-index:1;width:29px;height:29px;color:#9be4e9;filter:drop-shadow(0 0 6px #d8fdff78) drop-shadow(0 0 12px #56d9e548)}
#pulse-home .observatory-next-orb-meta{position:relative;z-index:1;display:-webkit-box;max-width:86px;margin-top:5px;overflow:hidden;color:#d6b7c5;font-size:8px;line-height:1.22;text-align:center;-webkit-box-orient:vertical;-webkit-line-clamp:2}
#pulse-home .observatory-next-orb-arrow{position:absolute;right:12px;bottom:11px;width:13px;height:13px;stroke:#f6b4c8;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round;opacity:.78}
#pulse-home .observatory-next[data-plan-state="empty"] .observatory-next-orb{opacity:.58;border-color:#c98ba52b;background:radial-gradient(circle at 50% 42%,#7ce8ed0b 0%,transparent 36%),linear-gradient(145deg,#130f17a0,#0b1016a8);box-shadow:inset 0 0 18px #ffc2d504,0 0 12px #ff4e7d08}
#pulse-home .observatory-next[data-plan-state="empty"] .observatory-next-orb .observatory-star-glyph{opacity:.68;filter:drop-shadow(0 0 5px #56d9e538)}
#pulse-home .observatory-next[data-plan-state="empty"] .observatory-next-orb-meta{display:none}
#pulse-home .observatory-next[data-plan-state="planned"] .observatory-next-orb{opacity:.98;border-color:#ffb6ca74;background:radial-gradient(circle at 50% 38%,#8bf0f526 0%,transparent 35%),radial-gradient(circle at 50% 66%,#ff9bb422 0%,#ff4e7d10 48%,transparent 74%),linear-gradient(145deg,#190f1dd8,#0b1219df);box-shadow:inset 0 0 24px #ffd0dc0c,0 0 31px #ff4e7d24,0 0 24px #56d9e512;animation:observatoryNextReadyPulse 3.8s ease-in-out infinite;animation-play-state:var(--pulse-scene-motion,running)}
#pulse-home .observatory-next-orb:hover,#pulse-home .observatory-next-orb:focus-visible{transform:translateY(-2px) scale(1.025);opacity:1;border-color:#ffbdcf82;box-shadow:inset 0 0 25px #ffd0dc0d,0 0 36px #ff4e7d28,0 0 25px #56d9e515}
''', 'base orb cluster')

replace(css,
'''#pulse-home .observatory-build{position:relative;isolation:isolate;display:inline-flex;align-items:center;justify-content:center;gap:16px;width:max-content;max-width:100%;min-height:48px;margin:0;padding:12px 23px;border:1px solid #ffa3c05e;border-radius:99px;background:linear-gradient(110deg,#f44a6f30,#fa85b112);box-shadow:0 0 40px #ff4e7926,inset 0 0 20px #ffb0c10c;color:#ffcada;font:500 13px Inter,sans-serif;cursor:pointer;transition:box-shadow .3s,background .3s,transform .28s}
''',
'''#pulse-home .observatory-build{position:relative;isolation:isolate;display:inline-flex;align-items:center;justify-content:center;gap:16px;width:min(220px,100%);min-height:48px;margin:0;padding:12px 23px;border:1px solid #ffa3c05e;border-radius:99px;background:linear-gradient(110deg,#f44a6f30,#fa85b112);box-shadow:0 0 40px #ff4e7926,inset 0 0 20px #ffb0c10c;color:#ffcada;font:500 13px Inter,sans-serif;cursor:pointer;transition:opacity .28s,box-shadow .3s,background .3s,border-color .3s,transform .28s}
#pulse-home .observatory-next[data-plan-state="empty"] .observatory-build{opacity:1;border-color:#ffb2c979;background:linear-gradient(110deg,#f44a6f42,#fa85b11a);box-shadow:0 0 42px #ff4e7930,inset 0 0 20px #ffb0c110}
#pulse-home .observatory-next[data-plan-state="planned"] .observatory-build{opacity:.72;border-color:#d78da845;background:linear-gradient(110deg,#c53f6322,#d8739a0d);box-shadow:0 0 22px #ff4e7912,inset 0 0 16px #ffb0c107}
#pulse-home .observatory-next[data-plan-state="planned"] .observatory-build::before{animation:none;opacity:.025}
''', 'build hierarchy')

replace(css,
'''@keyframes observatoryActionGlow{0%,100%{opacity:.05}50%{opacity:.16}}
@keyframes observatoryLight''',
'''@keyframes observatoryActionGlow{0%,100%{opacity:.05}50%{opacity:.16}}
@keyframes observatoryNextReadyPulse{0%,100%{box-shadow:inset 0 0 24px #ffd0dc0c,0 0 25px #ff4e7d1d,0 0 18px #56d9e50d}50%{box-shadow:inset 0 0 25px #ffd0dc10,0 0 36px #ff4e7d30,0 0 29px #56d9e51c}}
@keyframes observatoryLight''', 'ready pulse keyframes')

replace(css,
''' #pulse-home .observatory-next-actions{grid-template-columns:minmax(0,1fr) 110px;gap:14px;margin-top:12px}
 #pulse-home .observatory-next-orb-wrap{width:108px}
''',
''' #pulse-home .observatory-next-actions{grid-template-columns:minmax(0,1fr) 104px;gap:14px;margin-top:12px}
 #pulse-home .observatory-next-actions::before{inset:-20px -14px}
 #pulse-home .observatory-next-orb-wrap{width:100px}
''', 'mobile action grid')
replace(css, ' #pulse-home .observatory-next-orb{width:108px;height:108px}\n', ' #pulse-home .observatory-next-orb{width:100px;height:100px}\n', 'mobile orb size')
replace(css, ' #pulse-home .observatory-next-orb-meta{max-width:80px;margin-top:5px;font-size:7.8px}\n', ' #pulse-home .observatory-next-orb-meta{max-width:74px;margin-top:4px;font-size:7.4px}\n', 'mobile orb meta')
replace(css, ' #pulse-home .observatory-build{min-height:44px;padding:10px 17px;gap:12px;font-size:12px}\n', ' #pulse-home .observatory-build{width:min(210px,100%);min-height:44px;padding:10px 17px;gap:12px;font-size:12px}\n', 'mobile build width')
replace(css,
''' #pulse-home .observatory-next-actions{grid-template-columns:minmax(0,1fr) 96px;gap:10px}
 #pulse-home .observatory-next-orb-wrap{width:96px}
 #pulse-home .observatory-next-orb{width:96px;height:96px}
 #pulse-home .observatory-next-orb-meta{max-width:72px;font-size:7.2px}
''',
''' #pulse-home .observatory-next-actions{grid-template-columns:minmax(0,1fr) 94px;gap:10px}
 #pulse-home .observatory-next-orb-wrap{width:92px}
 #pulse-home .observatory-next-orb{width:92px;height:92px}
 #pulse-home .observatory-next-orb-meta{max-width:68px;font-size:7px}
''', 'small mobile sizing')
replace(css,
''' #pulse-home .observatory-stage::before,#pulse-home .observatory-scene *,#pulse-home .observatory-build::before{animation:none!important}
''',
''' #pulse-home .observatory-stage::before,#pulse-home .observatory-scene *,#pulse-home .observatory-build::before,#pulse-home .observatory-next-orb{animation:none!important}
''', 'reduced motion orb')

replace(js,
'''    setText('reactor-action', 'Bygg pass');
    setText('reactor-orb-meta', hasPlan ? summary : 'Inget planerat');
    const start = document.getElementById('reactor-start');
    start.disabled = false;
    start.dataset.planState = hasPlan ? 'planned' : 'empty';
''',
'''    setText('reactor-action', 'Bygg pass');
    setText('reactor-orb-meta', hasPlan ? (title + ' · ' + summary) : '');
    const start = document.getElementById('reactor-start');
    const next = start.closest('.observatory-next');
    const planState = hasPlan ? 'planned' : 'empty';
    start.disabled = false;
    start.dataset.planState = planState;
    if (next) next.dataset.planState = planState;
''', 'plan hierarchy state')

replace(html, 'pulse-observatory/observatory.css?v=20260916-main-next-pass-orb-2', 'pulse-observatory/observatory.css?v=20260916-main-action-hierarchy-3', 'observatory cache')
replace(html, 'pulse-environment/environment.js?v=20260916-main-next-pass-orb-2', 'pulse-environment/environment.js?v=20260916-main-action-hierarchy-3', 'environment cache')

replace(identity,
'''  assert.match(environment, /setText\\('reactor-orb-meta', hasPlan \\? summary : 'Inget planerat'\\)/);
''',
'''  assert.match(environment, /setText\\('reactor-orb-meta', hasPlan \\? \\(title \\+ ' · ' \\+ summary\\) : ''\\)/);
  assert.match(environment, /if \\(next\\) next\\.dataset\\.planState = planState/);
''', 'identity meta assertion')
replace(identity,
'''  assert.match(css, /observatory-next-actions\\{[^}]*grid-template-columns:minmax\\(0,1fr\\) 126px;[^}]*align-items:center/);
  assert.match(css, /observatory-next-orb\\{[^}]*opacity:\\.82/);
''',
'''  assert.match(css, /observatory-next-actions\\{[^}]*grid-template-columns:minmax\\(0,1fr\\) 112px;[^}]*gap:16px;[^}]*align-items:center/);
  assert.match(css, /observatory-next-actions::before\\{[^}]*radial-gradient/);
  assert.match(css, /observatory-next\\[data-plan-state="empty"\\] \\.observatory-next-orb\\{opacity:\\.58/);
  assert.match(css, /observatory-next\\[data-plan-state="planned"\\] \\.observatory-next-orb\\{[^}]*opacity:\\.98[^}]*animation:observatoryNextReadyPulse 3\\.8s/);
  assert.match(css, /observatory-build\\{[^}]*width:min\\(220px,100%\\)/);
  assert.match(css, /observatory-next\\[data-plan-state="planned"\\] \\.observatory-build\\{opacity:\\.72/);
  assert.match(css, /observatory-next\\[data-plan-state="empty"\\] \\.observatory-next-orb-meta\\{display:none\\}/);
''', 'identity hierarchy assertions')
replace(identity, '20260916-main-next-pass-orb-2', '20260916-main-action-hierarchy-3', 'identity css cache')
replace(identity, '20260916-main-next-pass-orb-2', '20260916-main-action-hierarchy-3', 'identity js cache')

replace(mobile,
'''  assert.match(mobile, /observatory-next-actions\\{grid-template-columns:minmax\\(0,1fr\\) 110px;gap:14px/);
  assert.match(mobile, /observatory-next-orb-wrap\\{width:108px\\}/);
''',
'''  assert.match(mobile, /observatory-next-actions\\{grid-template-columns:minmax\\(0,1fr\\) 104px;gap:14px/);
  assert.match(mobile, /observatory-next-orb-wrap\\{width:100px\\}/);
  assert.match(mobile, /observatory-next-orb\\{width:100px;height:100px\\}/);
  assert.match(mobile, /observatory-build\\{width:min\\(210px,100%\\)/);
''', 'mobile hierarchy assertions')
replace(mobile, '20260916-main-next-pass-orb-2', '20260916-main-action-hierarchy-3', 'mobile css cache')
replace(mobile, '20260916-main-next-pass-orb-2', '20260916-main-action-hierarchy-3', 'mobile js cache')

print('Observatory action hierarchy polish applied')
