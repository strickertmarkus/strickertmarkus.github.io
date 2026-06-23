#!/usr/bin/env python3
"""
Complete redesign of baby milestone pages.
- Switches to Inter font (matches budget pages)
- Clean minimal design, ultra-thin transparent borders  
- Three.js ambient particle background
- Hamburger menu top-right (matches budget)
- Add-row capability per table
- Scroll fade-in animations
- Keeps ALL existing HTML data intact
"""

import re

# ─────────────────────────────────────────────────────────────────
# NEW CSS TEMPLATE (use {ACCENT}, {ACCENT_RGB}, {HEADER_BG}, etc.)
# ─────────────────────────────────────────────────────────────────

def make_css(accent, accent_dark, accent_mid_raw, accent_rgb, header_bg, footer_bg):
    return f"""
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    body {{
      font-family: 'Inter', sans-serif;
      background: #0F1219;
      color: #E2E8F0;
      line-height: 1.7;
      min-height: 100vh;
    }}

    /* ── PAGE HEADER ── */
    .page-header {{
      background: {header_bg};
      color: white;
      padding: 28px 24px 24px;
      text-align: center;
      position: relative;
      box-shadow: 0 4px 30px rgba(0,0,0,0.35);
    }}
    .page-header h1 {{
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.4px;
      color: #F8FAFC;
    }}
    .header-sub {{
      font-size: 12px;
      color: rgba(255,255,255,0.45);
      margin-top: 4px;
      font-weight: 400;
      letter-spacing: 0.5px;
    }}

    /* ── HAMBURGER / NAV — top-right, matches budget pages ── */
    .nav-dropdown-wrapper {{
      position: absolute;
      top: 16px;
      right: 16px;
      display: inline-block;
      z-index: 1000;
    }}
    .nav-btn {{
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.18);
      color: white;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.2s;
    }}
    .nav-btn:hover {{ background: rgba(255,255,255,0.2); transform: scale(1.05); }}
    .nav-dropdown-menu {{
      display: none;
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #1A1F2E;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      min-width: 230px;
      overflow: hidden;
      animation: dropIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }}
    .nav-dropdown-menu.show {{ display: block; }}
    @keyframes dropIn {{
      from {{ opacity: 0; transform: translateY(-8px) scale(0.97); }}
      to   {{ opacity: 1; transform: translateY(0) scale(1); }}
    }}
    .nav-dropdown-menu a {{
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      color: #C9D1DC;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;
      border-bottom: 1px solid rgba(255,255,255,0.035);
    }}
    .nav-dropdown-menu a:last-child {{ border-bottom: none; }}
    .nav-dropdown-menu a:hover {{
      background: rgba({accent_rgb}, 0.09);
      color: {accent};
    }}
    .nav-sep {{ border-top: 1px solid rgba(255,255,255,0.07); margin: 4px 0; }}
    .nav-icon {{ font-size: 15px; flex-shrink: 0; }}

    /* ── MAIN CONTENT ── */
    .page-content {{
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1.5rem 5rem;
    }}

    /* ── WELCOME CALLOUT ── */
    .welcome-callout {{
      margin: 2.5rem 0 0;
      padding: 14px 18px;
      background: rgba({accent_rgb}, 0.04);
      border-left: 2px solid rgba({accent_rgb}, 0.25);
      border-radius: 0 8px 8px 0;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 13px;
      color: #94A3B8;
      transition: border-left-color 0.3s;
    }}
    .welcome-callout:hover {{ border-left-color: rgba({accent_rgb}, 0.55); }}
    .welcome-callout .icon {{
      font-size: 18px;
      flex-shrink: 0;
      animation: gentleFloat 5s ease-in-out infinite;
    }}
    @keyframes gentleFloat {{
      0%, 100% {{ transform: translateY(0px); }}
      50%       {{ transform: translateY(-5px); }}
    }}

    /* ── SECTION TITLES ── */
    .section-title {{
      font-size: 11px;
      font-weight: 700;
      color: {accent};
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 3rem 0 1rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }}
    .section-title::before {{
      content: '';
      display: inline-block;
      width: 3px;
      height: 14px;
      background: {accent};
      border-radius: 2px;
      opacity: 0.65;
    }}

    /* ── HORIZONTAL RULE ── */
    hr {{
      border: none;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
      margin: 2.5rem 0;
    }}

    /* ── PROFILE ── */
    .profile-section {{
      display: flex;
      gap: 2rem;
      align-items: flex-start;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }}
    .profile-photo {{
      width: 160px;
      height: 200px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba({accent_rgb}, 0.2);
      flex-shrink: 0;
      background: rgba({accent_rgb}, 0.04);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s;
    }}
    .profile-photo:hover {{
      transform: scale(1.03) translateY(-4px);
      box-shadow: 0 16px 40px rgba({accent_rgb}, 0.18);
    }}
    .profile-photo img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
    }}
    .profile-fields {{ flex: 1; min-width: 240px; }}
    .profile-row {{
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 13px;
    }}
    .profile-row:last-child {{ border-bottom: none; }}
    .profile-row .emoji {{ font-size: 13px; flex-shrink: 0; }}
    .profile-row .label {{
      color: #6B7280;
      min-width: 160px;
      font-size: 12px;
      font-weight: 500;
    }}
    .profile-row .value {{
      font-weight: 600;
      color: #E2E8F0;
      font-size: 13px;
    }}

    /* ── CALLOUT / STORY ── */
    .callout {{
      background: rgba({accent_rgb}, 0.03);
      border-left: 2px solid rgba({accent_rgb}, 0.2);
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin: 16px 0;
      font-size: 13px;
      line-height: 1.85;
      color: #94A3B8;
      font-style: normal;
      transition: border-left-color 0.2s;
    }}
    .callout:hover {{ border-left-color: rgba({accent_rgb}, 0.45); }}
    .callout .callout-icon {{ font-size: 16px; margin-bottom: 8px; display: block; }}
    .callout p {{ margin-bottom: 10px; }}
    .callout p:last-child {{ margin-bottom: 0; }}

    /* ── TABLES ── */
    .table-wrap {{ overflow-x: auto; margin: 0.75rem 0 0.5rem; }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }}
    th {{
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      color: {accent};
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1px solid rgba({accent_rgb}, 0.18);
      background: transparent;
    }}
    td {{
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      vertical-align: top;
      color: #C9D1DC;
    }}
    td:first-child {{
      color: #5A6478;
      font-size: 12px;
      white-space: nowrap;
      width: 130px;
    }}
    tbody tr {{
      transition: background 0.15s;
    }}
    tbody tr:hover td {{
      background: rgba({accent_rgb}, 0.045);
    }}
    tbody tr:hover td:first-child {{ color: {accent}; }}
    tbody tr:last-child td {{ border-bottom: none; }}

    /* ── ADD ROW BUTTON ── */
    .add-row-btn {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: transparent;
      border: 1px dashed rgba({accent_rgb}, 0.25);
      border-radius: 7px;
      color: rgba({accent_rgb}, 0.6);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 10px;
      font-family: 'Inter', sans-serif;
    }}
    .add-row-btn:hover {{
      border-color: rgba({accent_rgb}, 0.55);
      color: {accent};
      background: rgba({accent_rgb}, 0.05);
    }}
    .row-input {{
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba({accent_rgb}, 0.3);
      color: #E2E8F0;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      width: 100%;
      padding: 2px 0;
      outline: none;
    }}
    .row-input:focus {{ border-bottom-color: {accent}; }}
    .row-save-btn {{
      background: rgba({accent_rgb}, 0.12);
      border: 1px solid rgba({accent_rgb}, 0.25);
      color: {accent};
      border-radius: 6px;
      padding: 3px 10px;
      font-size: 12px;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      white-space: nowrap;
      transition: background 0.15s;
    }}
    .row-save-btn:hover {{ background: rgba({accent_rgb}, 0.22); }}

    /* ── SECTION LABEL ── */
    .section-label {{
      font-size: 11px;
      font-weight: 500;
      color: #4A5568;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}

    /* ── DAY-BY-DAY ENTRIES ── */
    .day-entry {{
      margin: 1.5rem 0;
      padding-left: 18px;
      border-left: 1px solid rgba({accent_rgb}, 0.18);
      transition: border-color 0.2s;
    }}
    .day-entry:hover {{ border-left-color: rgba({accent_rgb}, 0.5); }}
    .day-entry .day-date {{
      font-size: 11px;
      font-weight: 700;
      color: {accent};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }}
    .day-entry .day-text {{
      font-size: 13px;
      line-height: 1.85;
      color: #8892A4;
      margin-bottom: 12px;
    }}
    .day-entry .day-photo {{
      width: 100%;
      max-width: 420px;
      border-radius: 10px;
      border: 1px solid rgba({accent_rgb}, 0.12);
      object-fit: cover;
      display: block;
      background: rgba({accent_rgb}, 0.03);
    }}
    .day-entry .day-photo-placeholder {{
      width: 100%;
      max-width: 420px;
      height: 160px;
      border-radius: 10px;
      border: 1px dashed rgba({accent_rgb}, 0.18);
      background: rgba({accent_rgb}, 0.025);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4A5568;
      font-size: 12px;
    }}

    /* ── MEMORABLE MOMENTS ── */
    .moments-callout {{
      background: rgba({accent_rgb}, 0.025);
      border: 1px solid rgba({accent_rgb}, 0.1);
      border-radius: 10px;
      padding: 16px 20px;
      margin: 12px 0;
    }}
    .moments-callout .moments-title {{
      font-size: 11px;
      font-weight: 700;
      color: {accent};
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .moment-item {{
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 0;
      font-size: 13px;
      color: #8892A4;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      transition: color 0.2s;
    }}
    .moment-item:last-child {{ border-bottom: none; }}
    .moment-item:hover {{ color: #C9D1DC; }}
    .moment-item .heart {{ color: {accent}; flex-shrink: 0; }}

    /* ── FOOTER ── */
    .page-footer {{
      text-align: center;
      padding: 2rem;
      font-size: 12px;
      color: rgba(255,255,255,0.3);
      border-top: 1px solid rgba(255,255,255,0.05);
      background: {footer_bg};
      letter-spacing: 0.5px;
    }}

    /* ── SCROLL FADE IN ── */
    .fade-in {{
      opacity: 0;
      transform: translateY(18px);
      transition: opacity 0.55s ease, transform 0.55s ease;
    }}
    .fade-in.visible {{
      opacity: 1;
      transform: translateY(0);
    }}

    /* ── RESPONSIVE ── */
    @media (max-width: 600px) {{
      .page-header h1 {{ font-size: 18px; }}
      .profile-photo {{ width: 120px; height: 150px; }}
      .profile-row .label {{ min-width: 120px; }}
      td:first-child {{ width: 90px; }}
    }}
"""


# ─────────────────────────────────────────────────────────────────
# NEW JS TEMPLATE
# ─────────────────────────────────────────────────────────────────

def make_js(particle_color_hex):
    return f"""
<script>
// ── THREE.JS AMBIENT PARTICLES ─────────────────────────────────
(function() {{
  if (typeof THREE === 'undefined') return;
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 35;

  const renderer = new THREE.WebGLRenderer({{ alpha: true, antialias: true }});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
  document.body.appendChild(renderer.domElement);

  const COUNT = 90;
  const geo   = new THREE.BufferGeometry();
  const pos   = new Float32Array(COUNT * 3);
  const vel   = [];

  for (let i = 0; i < COUNT; i++) {{
    pos[i*3]   = (Math.random() - 0.5) * 100;
    pos[i*3+1] = (Math.random() - 0.5) * 70;
    pos[i*3+2] = (Math.random() - 0.5) * 30;
    vel.push((Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.004);
  }}
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const sizes = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) sizes[i] = 0.12 + Math.random() * 0.22;
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({{
    color: {particle_color_hex},
    size: 0.22,
    transparent: true,
    opacity: 0.38,
    sizeAttenuation: true,
  }});

  scene.add(new THREE.Points(geo, mat));

  function animate() {{
    requestAnimationFrame(animate);
    const p = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {{
      p[i*3]   += vel[i*2];
      p[i*3+1] += vel[i*2+1];
      if (p[i*3]   >  50) p[i*3]   = -50;
      if (p[i*3]   < -50) p[i*3]   =  50;
      if (p[i*3+1] >  35) p[i*3+1] = -35;
      if (p[i*3+1] < -35) p[i*3+1] =  35;
    }}
    geo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }}
  animate();

  window.addEventListener('resize', () => {{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }});
}})();

// ── NAV MENU ───────────────────────────────────────────────────
function toggleNavMenu() {{
  document.getElementById('nav-menu').classList.toggle('show');
}}
window.addEventListener('click', function(e) {{
  const w = document.querySelector('.nav-dropdown-wrapper');
  if (w && !w.contains(e.target)) {{
    const m = document.getElementById('nav-menu');
    if (m) m.classList.remove('show');
  }}
}});

// ── ADD ROW ────────────────────────────────────────────────────
function initAddRow() {{
  document.querySelectorAll('.table-wrap').forEach(wrap => {{
    const table = wrap.querySelector('table');
    if (!table) return;
    const headers = [...table.querySelectorAll('th')].map(th => th.textContent.trim());
    if (headers.length === 0) return;

    const btn = document.createElement('button');
    btn.className = 'add-row-btn';
    btn.innerHTML = '+ Lägg till rad';
    btn.addEventListener('click', function addRow() {{
      const tbody = table.querySelector('tbody');
      const tr = document.createElement('tr');
      headers.forEach((h, i) => {{
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = h;
        input.className = 'row-input';
        td.appendChild(input);
        if (i === headers.length - 1) {{
          td.insertAdjacentHTML('beforeend', ' ');
          const saveBtn = document.createElement('button');
          saveBtn.className = 'row-save-btn';
          saveBtn.textContent = '✓ Spara';
          saveBtn.addEventListener('click', () => {{
            tr.querySelectorAll('input').forEach(inp => {{
              inp.replaceWith(document.createTextNode(inp.value));
            }});
            saveBtn.remove();
            tr.classList.add('saved');
          }});
          td.appendChild(saveBtn);
        }}
        tr.appendChild(td);
      }});
      tbody.appendChild(tr);
      tr.querySelector('input')?.focus();
    }});
    wrap.insertAdjacentElement('afterend', btn);
  }});
}}

// ── SCROLL FADE IN ─────────────────────────────────────────────
function initFadeIn() {{
  const targets = document.querySelectorAll(
    '.section-title, .callout, .profile-section, .welcome-callout, ' +
    '.moments-callout, .day-entry, .table-wrap'
  );
  targets.forEach(el => el.classList.add('fade-in'));

  const obs = new IntersectionObserver(entries => {{
    entries.forEach(e => {{
      if (e.isIntersecting) {{
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }}
    }});
  }}, {{ threshold: 0.08, rootMargin: '0px 0px -20px 0px' }});

  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
}}

initAddRow();
initFadeIn();
</script>
"""


# ─────────────────────────────────────────────────────────────────
# PAGE CONFIGS
# ─────────────────────────────────────────────────────────────────

MILA_CFG = {
    'accent': '#F9A8B8',
    'accent_dark': '#3D0F1E',
    'accent_mid_raw': '#7B2D3E',
    'accent_rgb': '249, 168, 184',
    'header_bg': 'linear-gradient(135deg, #180810 0%, #2A1020 100%)',
    'footer_bg': 'linear-gradient(135deg, #180810 0%, #2A1020 100%)',
    'particle_color_hex': '0xF9A8B8',
    'h1_replacement': '👶🏻 Vår älskade dotter Mila',
    'subtitle': 'Milstolpar &amp; Minnen &middot; Familia Strickert',
}

MELKER_CFG = {
    'accent': '#93C5FD',
    'accent_dark': '#071525',
    'accent_mid_raw': '#1A3A5C',
    'accent_rgb': '147, 197, 253',
    'header_bg': 'linear-gradient(135deg, #07111E 0%, #112040 100%)',
    'footer_bg': 'linear-gradient(135deg, #07111E 0%, #112040 100%)',
    'particle_color_hex': '0x93C5FD',
    'h1_replacement': '👶🏻 Vår älskade son Melker',
    'subtitle': 'Milstolpar &amp; Minnen &middot; Familia Strickert',
}


# ─────────────────────────────────────────────────────────────────
# APPLY REDESIGN
# ─────────────────────────────────────────────────────────────────

def redesign(filepath, cfg):
    print(f"Redesigning {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Switch font to Inter
    content = re.sub(
        r'<link href="https://fonts\.googleapis\.com/css2[^"]*"[^>]*>',
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">',
        content
    )

    # 2. Add Three.js CDN if not present
    if 'three.min.js' not in content:
        content = content.replace(
            '</head>',
            '  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n</head>'
        )

    # 3. Replace entire <style> block
    new_css = make_css(
        cfg['accent'], cfg['accent_dark'], cfg['accent_mid_raw'],
        cfg['accent_rgb'], cfg['header_bg'], cfg['footer_bg']
    )
    content = re.sub(r'<style>.*?</style>', f'<style>{new_css}  </style>', content, flags=re.DOTALL)

    # 4. Fix header — inject subtitle, fix button class, remove old inline styles
    # Replace the old nav button (no class) with classed one
    content = re.sub(
        r'<button onclick="toggleNavMenu\(\)" title="Navigation">☰</button>',
        '<button class="nav-btn" onclick="toggleNavMenu()" title="Navigation">☰</button>',
        content
    )
    # Add subtitle below h1 if not already there
    if 'header-sub' not in content:
        content = content.replace(
            f'<h1>{cfg["h1_replacement"]}</h1>\n  <div class="nav-dropdown-wrapper">',
            f'<h1>{cfg["h1_replacement"]}</h1>\n  <p class="header-sub">{cfg["subtitle"]}</p>\n  <div class="nav-dropdown-wrapper">'
        )

    # 5. Fix nav separator — remove old inline-style divider, use class
    content = content.replace(
        '<div style="border-top: 2px dotted var(--accent-mid); margin: 4px 0;"></div>',
        '<div class="nav-sep"></div>'
    )

    # 6. Remove old <script> block
    content = re.sub(r'\n<script>\s*function toggleNavMenu.*?</script>\s*\n', '\n', content, flags=re.DOTALL)

    # 7. Inject new JS before </body>
    new_js = make_js(cfg['particle_color_hex'])
    content = content.replace('</body>', f'{new_js}\n</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  ✓ Done ({filepath})")


redesign('budget/mila.html', MILA_CFG)
redesign('budget/melker.html', MELKER_CFG)
print("\nAll done!")
