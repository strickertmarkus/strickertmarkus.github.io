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
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    return text.replace(old, new, 1)

def regex_once(text, pattern, replacement, label, flags=0):
    out, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    return out

# --- canonical Observatory markup ---
path = 'budget/exercise.html'
html = read(path)
old = '''      <button type="button" class="observatory-start" id="reactor-start" disabled>
        <span class="observatory-next-main">
          <span class="observatory-next-copy">
            <span id="reactor-date">DITT PASS</span>
            <strong id="reactor-title">Laddar pass</strong>
            <span id="reactor-summary"></span>
          </span>
          <span class="observatory-next-orb" aria-hidden="true">
            <span class="observatory-next-orb-label" id="reactor-orb-action">STARTA PASS</span>
            <svg class="observatory-star-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M12 1.8C13.3 7.15 16.85 10.7 22.2 12C16.85 13.3 13.3 16.85 12 22.2C10.7 16.85 7.15 13.3 1.8 12C7.15 10.7 10.7 7.15 12 1.8Z"/></svg>
            <span class="observatory-next-orb-meta" id="reactor-orb-meta">Laddar pass</span>
            <svg class="observatory-next-orb-arrow" viewBox="0 0 24 24" fill="none" focusable="false"><path d="M7 17 17 7M8 7h9v9"/></svg>
          </span>
        </span>
        <span class="observatory-action"><svg class="observatory-action-ecg" viewBox="0 0 72 30" fill="none" aria-hidden="true"><path d="M2 16H17L23 10L30 24L39 3L46 20L52 13H70"/></svg><span id="reactor-action">Starta pass</span></span>
        <span class="observatory-progress" id="observatory-progress" aria-live="polite"></span>
        <span class="observatory-last" id="observatory-last" aria-live="polite"></span>
      </button>
      <button class="observatory-configure" id="reactor-configure" type="button" hidden>Redigera upplägg <svg class="observatory-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"/></svg></button>'''
new = '''      <div class="observatory-next-main">
        <span class="observatory-next-copy">
          <span id="reactor-date">DITT PASS</span>
          <strong id="reactor-title">Laddar pass</strong>
          <span id="reactor-summary"></span>
        </span>
      </div>
      <div class="observatory-next-actions">
        <button type="button" class="observatory-build" id="reactor-build"><svg class="observatory-build-ecg" viewBox="0 0 72 30" fill="none" aria-hidden="true"><path d="M2 16H17L23 10L30 24L39 3L46 20L52 13H70"/></svg><span id="reactor-action">Bygg pass</span></button>
        <span class="observatory-next-orb-wrap">
          <button type="button" class="observatory-next-orb" id="reactor-start" aria-describedby="reactor-start-notice">
            <span class="observatory-next-orb-label">STARTA NÄSTA PASS</span>
            <svg class="observatory-star-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M12 1.8C13.3 7.15 16.85 10.7 22.2 12C16.85 13.3 13.3 16.85 12 22.2C10.7 16.85 7.15 13.3 1.8 12C7.15 10.7 10.7 7.15 12 1.8Z"/></svg>
            <span class="observatory-next-orb-meta" id="reactor-orb-meta">Laddar pass</span>
            <svg class="observatory-next-orb-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9"/></svg>
          </button>
          <span class="observatory-start-notice" id="reactor-start-notice" role="status" aria-live="polite" hidden>Bygg ett pass först.</span>
        </span>
      </div>
      <span class="observatory-progress" id="observatory-progress" aria-live="polite"></span>
      <span class="observatory-last" id="observatory-last" aria-live="polite"></span>'''
html = replace_once(html, old, new, 'next action markup')
html = replace_once(html, 'pulse-observatory/observatory.css?v=20260916-main-next-orb-1', 'pulse-observatory/observatory.css?v=20260916-main-next-pass-orb-2', 'Observatory CSS cache')
html = replace_once(html, 'pulse-environment/environment.js?v=20260916-main-next-orb-1', 'pulse-environment/environment.js?v=20260916-main-next-pass-orb-2', 'environment JS cache')
write(path, html)

# --- canonical Observatory composition ---
path = 'budget/pulse-observatory/observatory.css'
css = read(path)
css = css.replace('observatory-action-ecg', 'observatory-build-ecg')
css = css.replace('observatory-action', 'observatory-build')

css = replace_once(css,
'#pulse-home .observatory-start{display:flex;flex-direction:column;align-items:flex-start;gap:12px;border:0;background:none;color:#fff0f4;padding:24px 0 12px;text-align:left;width:100%;font-family:inherit;cursor:pointer}\n#pulse-home .observatory-next-main{display:grid;grid-template-columns:minmax(0,1fr) 126px;align-items:center;gap:22px;width:100%}',
'#pulse-home .observatory-next-main{width:100%}',
'old wrapper and main grid')

css = replace_once(css,
'#pulse-home .observatory-next-copy{display:flex;flex-direction:column;align-items:flex-start;gap:12px;min-width:0}',
'''#pulse-home .observatory-next-copy{display:flex;flex-direction:column;align-items:flex-start;gap:12px;min-width:0}
#pulse-home .observatory-next-actions{display:grid;grid-template-columns:minmax(0,1fr) 126px;align-items:center;gap:22px;width:100%;margin-top:18px}
#pulse-home .observatory-next-orb-wrap{position:relative;display:grid;place-items:center;width:126px;justify-self:end}''',
'actions row insertion')

old_orb = '#pulse-home .observatory-next-orb{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:126px;height:126px;border:1px solid #ff9fba5e;border-radius:50%;color:#ffd2df;background:radial-gradient(circle at 50% 38%,#7ce8ed24 0%,transparent 34%),radial-gradient(circle at 50% 66%,#ff8eab20 0%,#ff4e7d0d 48%,transparent 75%),linear-gradient(145deg,#160f1be8,#0b1118f0);box-shadow:inset 0 0 25px #ffc2d50b,0 0 32px #ff4e7d18,0 0 22px #56d9e50b;overflow:hidden;transition:transform .28s cubic-bezier(.16,1,.3,1),border-color .28s,box-shadow .28s,background .28s}'
new_orb = '#pulse-home .observatory-next-orb{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;width:126px;height:126px;padding:0;border:1px solid #ff9fba52;border-radius:50%;color:#ffd2df;background:radial-gradient(circle at 50% 38%,#7ce8ed1b 0%,transparent 34%),radial-gradient(circle at 50% 66%,#ff8eab18 0%,#ff4e7d09 48%,transparent 75%),linear-gradient(145deg,#160f1bbf,#0b1118cf);box-shadow:inset 0 0 25px #ffc2d508,0 0 27px #ff4e7d12,0 0 19px #56d9e508;overflow:hidden;opacity:.82;font-family:inherit;cursor:pointer;transition:transform .28s cubic-bezier(.16,1,.3,1),opacity .28s,border-color .28s,box-shadow .28s,background .28s}'
css = replace_once(css, old_orb, new_orb, 'orb opacity styling')

css = replace_once(css,
'#pulse-home .observatory-start:hover .observatory-next-orb,#pulse-home .observatory-start:focus-visible .observatory-next-orb{transform:translateY(-2px) scale(1.025);border-color:#ffbdcf82;background:radial-gradient(circle at 50% 38%,#8bf0f52e 0%,transparent 35%),radial-gradient(circle at 50% 66%,#ff9bb42b 0%,#ff4e7d16 48%,transparent 74%),linear-gradient(145deg,#190f1dec,#0b1219f2);box-shadow:inset 0 0 25px #ffd0dc10,0 0 40px #ff4e7d30,0 0 28px #56d9e51a}\n#pulse-home .observatory-start:focus-visible{outline:none}\n#pulse-home .observatory-start:focus-visible .observatory-next-main{outline:1px solid #ffb6c94a;outline-offset:8px;border-radius:8px}\n#pulse-home .observatory-start:disabled{opacity:.5;cursor:wait}',
'''#pulse-home .observatory-next-orb:hover,#pulse-home .observatory-next-orb:focus-visible{transform:translateY(-2px) scale(1.025);opacity:1;border-color:#ffbdcf82;background:radial-gradient(circle at 50% 38%,#8bf0f526 0%,transparent 35%),radial-gradient(circle at 50% 66%,#ff9bb422 0%,#ff4e7d10 48%,transparent 74%),linear-gradient(145deg,#190f1dd8,#0b1219df);box-shadow:inset 0 0 25px #ffd0dc0d,0 0 36px #ff4e7d28,0 0 25px #56d9e515}
#pulse-home .observatory-next-orb:focus-visible{outline:1px solid #b9f5f86e;outline-offset:5px}''',
'orb interaction styling')

css = css.replace('#pulse-home .observatory-start #reactor-date', '#pulse-home #reactor-date')
css = css.replace('#pulse-home .observatory-start #reactor-title', '#pulse-home #reactor-title')
css = css.replace('#pulse-home .observatory-start #reactor-summary', '#pulse-home #reactor-summary')

old_build = '#pulse-home .observatory-build{position:relative;isolation:isolate;display:flex;align-items:center;gap:16px;margin-top:10px;padding:13px 23px;border:1px solid #ffa3c05e;border-radius:99px;background:linear-gradient(110deg,#f44a6f30,#fa85b112);box-shadow:0 0 40px #ff4e7926,inset 0 0 20px #ffb0c10c;color:#ffcada;font-size:13px;transition:box-shadow .3s,background .3s}'
new_build = '#pulse-home .observatory-build{position:relative;isolation:isolate;display:inline-flex;align-items:center;justify-content:center;gap:16px;width:max-content;max-width:100%;min-height:48px;margin:0;padding:12px 23px;border:1px solid #ffa3c05e;border-radius:99px;background:linear-gradient(110deg,#f44a6f30,#fa85b112);box-shadow:0 0 40px #ff4e7926,inset 0 0 20px #ffb0c10c;color:#ffcada;font:500 13px Inter,sans-serif;cursor:pointer;transition:box-shadow .3s,background .3s,transform .28s}'
css = replace_once(css, old_build, new_build, 'build button base')
css = replace_once(css, '#pulse-home .observatory-start:hover .observatory-build{background:#ff60813b;box-shadow:0 0 48px #ff588f40}', '#pulse-home .observatory-build:hover,#pulse-home .observatory-build:focus-visible{background:#ff60813b;box-shadow:0 0 48px #ff588f40;transform:translateY(-1px);outline:none}', 'build hover')
css = replace_once(css, '#pulse-home .observatory-configure{display:flex;align-items:center;gap:8px;font:400 11px Inter,sans-serif;color:#b797ac;background:none;border:0;padding:10px 0;min-height:40px;cursor:pointer}\n#pulse-home .observatory-configure[hidden]{display:none}', '''#pulse-home .observatory-start-notice{position:absolute;z-index:7;right:0;top:calc(100% + 9px);width:max-content;max-width:220px;padding:8px 10px;border:1px solid #ffb3c83d;border-radius:9px;background:#170f19e8;box-shadow:0 10px 28px #0007,0 0 18px #ff5c8216;color:#e7c5d1;font:500 9px/1.35 Inter,sans-serif;letter-spacing:.2px;opacity:0;transform:translateY(-3px) scale(.98);transition:opacity .18s ease,transform .18s ease;pointer-events:none}
#pulse-home .observatory-start-notice.is-visible{opacity:1;transform:none}
#pulse-home .observatory-start-notice[hidden]{display:none}''', 'replace configure with notice')
css = replace_once(css, '#pulse-home .observatory-start[data-observatory-state] .observatory-next-orb{color:var(--obs-state-accent);border-color:var(--obs-state-border);background:radial-gradient(circle at 48% 45%,var(--obs-state-fill) 0%,transparent 72%);box-shadow:inset 0 0 14px var(--obs-state-fill),var(--obs-state-glow)}', '#pulse-home .observatory-next-orb[data-observatory-state]{border-color:var(--obs-state-border);box-shadow:inset 0 0 18px var(--obs-state-fill),var(--obs-state-glow),0 0 19px #56d9e508}', 'state owner on orb')

# Mobile layout: action row stays side-by-side and shares the same vertical centre.
css = replace_once(css, ' #pulse-home .observatory-next-main{grid-template-columns:minmax(0,1fr) 110px;gap:14px}', ' #pulse-home .observatory-next-main{width:100%}\n #pulse-home .observatory-next-actions{grid-template-columns:minmax(0,1fr) 110px;gap:14px;margin-top:12px}\n #pulse-home .observatory-next-orb-wrap{width:108px}', 'mobile action row')
css = replace_once(css, ' #pulse-home .observatory-start{gap:7px;padding-top:12px;padding-bottom:7px}\n #pulse-home .observatory-start #reactor-title{font-size:28px}', ' #pulse-home #reactor-title{font-size:28px}\n #pulse-home .observatory-build{min-height:44px;padding:10px 17px;gap:12px;font-size:12px}', 'mobile wrapper removal')
css = replace_once(css, ' #pulse-home .observatory-build{padding:10px 17px;margin-top:6px;gap:12px;font-size:12px}\n', '', 'remove duplicate mobile build rule')
css = replace_once(css, '@media(max-width:360px){\n #pulse-home .observatory-next-main{grid-template-columns:minmax(0,1fr) 98px;gap:10px}\n #pulse-home .observatory-next-orb{width:96px;height:96px}', '@media(max-width:360px){\n #pulse-home .observatory-next-actions{grid-template-columns:minmax(0,1fr) 96px;gap:10px}\n #pulse-home .observatory-next-orb-wrap{width:96px}\n #pulse-home .observatory-next-orb{width:96px;height:96px}', 'small mobile action row')
css = replace_once(css, ' #pulse-home .observatory-build::before{opacity:.08}\n}', ' #pulse-home .observatory-build::before{opacity:.08}\n #pulse-home .observatory-start-notice{transition:none!important}\n}', 'reduced motion notice')
write(path, css)

# --- Observatory runtime ---
path = 'budget/pulse-environment/environment.js'
env = read(path)
env = replace_once(env, "    setText('reactor-action', hasPlan ? 'Starta pass' : 'Bygg pass');\n    setText('reactor-orb-action', hasPlan ? 'STARTA PASS' : 'BYGG PASS');\n    setText('reactor-orb-meta', hasPlan ? summary : 'Skapa upplägg');", "    setText('reactor-action', 'Bygg pass');\n    setText('reactor-orb-meta', hasPlan ? summary : 'Inget planerat');", 'action labels')
env = replace_once(env, "    start.setAttribute('aria-label', (hasPlan ? 'Starta ' : 'Bygg pass: ') + title + ', ' + dateLabel + ', ' + summary);\n    document.getElementById('reactor-configure').hidden = !hasPlan;", "    start.setAttribute('aria-label', hasPlan ? ('Starta nästa pass: ' + title + ', ' + dateLabel + ', ' + summary) : 'Starta nästa pass. Inget pass är byggt ännu.');", 'start aria and configure removal')
env = replace_once(env, "    document.getElementById('reactor-start').addEventListener('click', function () {\n      if (hasPlan) window.startWorkoutSessionForDate(selectedDate);\n      else openSelectedBuilder();\n    });\n    document.getElementById('reactor-configure').addEventListener('click', openSelectedBuilder);", "    const startNotice = document.getElementById('reactor-start-notice');\n    let startNoticeTimer = 0;\n    function showMissingPlanNotice() {\n      if (!startNotice) return;\n      window.clearTimeout(startNoticeTimer);\n      startNotice.hidden = false;\n      startNotice.classList.remove('is-visible');\n      requestAnimationFrame(() => startNotice.classList.add('is-visible'));\n      startNoticeTimer = window.setTimeout(() => {\n        startNotice.classList.remove('is-visible');\n        window.setTimeout(() => { startNotice.hidden = true; }, reduced.matches ? 0 : 180);\n      }, 2200);\n    }\n    document.getElementById('reactor-start').addEventListener('click', function () {\n      if (hasPlan) { window.startWorkoutSessionForDate(selectedDate); return; }\n      showMissingPlanNotice();\n    });\n    document.getElementById('reactor-build').addEventListener('click', openSelectedBuilder);", 'split start/build interactions')
write(path, env)

# --- Regression tests ---
path = 'budget/tests/training-observatory-identity.test.cjs'
test = read(path)
test = regex_once(test, r"test\('Next Workout remains one real weekly-plan action with explicit cue and empty state', \(\) => \{.*?\n\}\);", '''test('Next Workout has separate build and start actions without duplicating session ownership', () => {
  const nextBlock = html.slice(html.indexOf('<div class="observatory-next">'), html.indexOf('<section class="observatory-metrics"'));
  assert.match(nextBlock, /class="observatory-next-label"><span>NÄSTA PASS<\\/span><\\/span>/);
  assert.equal((html.match(/id="reactor-start"/g) || []).length, 1);
  assert.equal((html.match(/id="reactor-build"/g) || []).length, 1);
  assert.match(nextBlock, /observatory-next-orb-label">STARTA NÄSTA PASS/);
  assert.match(nextBlock, /id="reactor-start-notice"[^>]*>Bygg ett pass först\./);
  assert.doesNotMatch(nextBlock, /id="reactor-configure"/);
  assert.match(environment, /window\\.getPlannedSessions\\(\\)/);
  assert.match(environment, /setText\\('reactor-action', 'Bygg pass'\\)/);
  assert.match(environment, /setText\\('reactor-orb-meta', hasPlan \\? summary : 'Inget planerat'\\)/);
  assert.match(environment, /if \\(hasPlan\\) \\{ window\\.startWorkoutSessionForDate\\(selectedDate\\); return; \\}/);
  assert.match(environment, /showMissingPlanNotice\\(\\)/);
  assert.match(environment, /getElementById\\('reactor-build'\\)\\.addEventListener\\('click', openSelectedBuilder\\)/);
  assert.doesNotMatch(environment, /else openSelectedBuilder\\(\\)/);
  assert.match(css, /observatory-next-actions\\{[^}]*grid-template-columns:minmax\\(0,1fr\\) 126px;[^}]*align-items:center/);
  assert.match(css, /observatory-next-orb\\{[^}]*opacity:\\.82/);
  assert.match(css, /observatory-start-notice\\{[^}]*position:absolute/);
});''', 'identity next action test', flags=re.S)
test = test.replace('20260916-main-next-orb-1', '20260916-main-next-pass-orb-2')
write(path, test)

path = 'budget/tests/training-observatory-state.test.cjs'
test = read(path)
test = replace_once(test, "assert.match(observatoryCss, /observatory-start\\[data-observatory-state\\] \\.observatory-next-orb/);", "assert.match(observatoryCss, /observatory-next-orb\\[data-observatory-state\\]/);", 'state selector assertion')
test = test.replace('20260916-main-next-orb-1', '20260916-main-next-pass-orb-2')
write(path, test)

path = 'budget/tests/training-observatory-mobile.test.cjs'
test = read(path).replace('20260916-main-next-orb-1', '20260916-main-next-pass-orb-2')
test = replace_once(test, "  assert.match(mobile, /observatory-week\\{margin:16px 0 40px\\}/);", "  assert.match(mobile, /observatory-week\\{margin:16px 0 40px\\}/);\n  assert.match(mobile, /observatory-next-actions\\{grid-template-columns:minmax\\(0,1fr\\) 110px;gap:14px/);\n  assert.match(mobile, /observatory-next-orb-wrap\\{width:108px\\}/);", 'mobile orb alignment assertions')
write(path, test)

print('Observatory next-pass orb migration applied')
