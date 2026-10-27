#!/usr/bin/env python3
"""Visual check for the exercise explorer and its ?ui=gym preview.

Renders the live 3D figure with software WebGL (Chromium + SwiftShader) and a
local three.js r165 checkout, because CI-style sandboxes often cannot reach the
CDN. Writes screenshots and a JSON report; exit code 1 on page errors or
failed assertions.

  python3 scripts/check-gym-preview.py --three /path/to/three.js-r165 --out /tmp/gym-check

Get three.js once with:
  git clone --depth 1 --branch r165 --filter=blob:none --sparse https://github.com/mrdoob/three.js DIR
  git -C DIR sparse-checkout set build examples/jsm/environments examples/jsm/utils
Serve the repository root on --base (default http://127.0.0.1:4173) first.
"""
import argparse, json, os, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--three', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--base', default='http://127.0.0.1:4173')
ap.add_argument('--no-gl', action='store_true', help='skip the 3D figure (faster)')
args = ap.parse_args()
os.makedirs(args.out, exist_ok=True)
URL = args.base + '/budget/pulse-exercise-guide.html'
report = {'shots': [], 'errors': [], 'checks': {}}

def page(browser):
    p = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    p.on('pageerror', lambda e: report['errors'].append(str(e)[:240]))
    if not args.no_gl:
        p.route('https://cdn.jsdelivr.net/npm/three@0.165.0/**', lambda r: r.fulfill(
            path=os.path.join(args.three, r.request.url.split('three@0.165.0/')[1]), content_type='application/javascript'))
    p.route('https://fonts.**', lambda r: r.fulfill(body=''))
    return p

def shot(p, name):
    path = os.path.join(args.out, name + '.png'); p.screenshot(path=path); report['shots'].append(path)

def figure_ready(p):
    if args.no_gl: p.wait_for_timeout(800); return
    p.wait_for_function("()=>document.getElementById('studio-stage').classList.contains('silver-press-ready')", timeout=60000)
    p.wait_for_timeout(1200)

def check(name, ok, detail=''):
    report['checks'][name] = {'ok': bool(ok), 'detail': detail}

with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])

    # Default explorer: no preview hook, unchanged presentation.
    p = page(b); p.goto(URL); figure_ready(p); shot(p, '00-default')
    check('default has no preview hook', p.evaluate("()=>!window.PulseGuidePreview"))
    p.close()

    # Gym preview: body, transition, scene, swipes, programmes, back.
    p = page(b); p.goto(URL + '?ui=gym&hint=0')
    p.evaluate("()=>{try{localStorage.setItem('pulse-gym-hint-v1','1')}catch(e){}}"); p.wait_for_timeout(1500)
    shot(p, '01-body')
    p.locator('[data-map-muscle="Bröst"] path').first.click()
    for ms, name in [(150, '02-tap'), (250, '03-zoom'), (250, '04-handoff'), (500, '05-settle')]:
        p.wait_for_timeout(ms); shot(p, name)
    figure_ready(p); shot(p, '06-scene')
    hero = p.evaluate("()=>{const h=document.querySelector('.st-root.is-gym .st-art');if(!h)return null;const r=h.getBoundingClientRect();return {w:r.width,vw:innerWidth}}")
    check('hero spans the viewport', hero and abs(hero['w'] - hero['vw']) < 2, json.dumps(hero))
    names = []
    box = p.locator('.st-touch').bounding_box(); cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    for i in range(2):
        p.mouse.move(cx + 90, cy); p.mouse.down(); p.mouse.move(cx - 90, cy, steps=5); p.mouse.up()
        figure_ready(p); shot(p, '07-swipe-%d' % (i + 1))
        names.append(p.evaluate("()=>PulseExplore.exercises[PulseGuideUI.active()].name"))
    check('swipes change exercise', len(set(names)) == 2, ', '.join(names))
    p.locator('.st-rail-btn[aria-label="Program"], .st-rail-btn:has-text("Program")').first.click(); p.wait_for_timeout(600); shot(p, '08-programs')
    p.locator('.st-program').first.click(); p.wait_for_timeout(1800); shot(p, '08b-program-view')
    check('programme view shows route and timeline', p.evaluate("()=>document.querySelectorAll('.st-route .gf-st.is-on').length>0&&document.querySelectorAll('.st-timeline li').length>0"))
    p.locator('.st-start').click(); p.wait_for_timeout(900); shot(p, '09-program-playing')
    p.locator('.st-close').click(); p.wait_for_timeout(900); shot(p, '10-back-to-body')
    check('back returns to the body', p.evaluate("()=>!document.getElementById('muscle-map-page').hidden&&document.querySelector('.st-root').hidden"))
    p.close(); b.close()

report['ok'] = not report['errors'] and all(c['ok'] for c in report['checks'].values())
json.dump(report, open(os.path.join(args.out, 'report.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: report[k] for k in ('ok', 'checks', 'errors')}, ensure_ascii=False, indent=1))
sys.exit(0 if report['ok'] else 1)
