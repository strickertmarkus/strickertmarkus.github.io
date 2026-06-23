import re

navigation_css = """
    /* ── NAVIGATION ── */
    .page-header { position: relative; }
    .nav-dropdown-wrapper { position: absolute; right: 2rem; top: 50%; transform: translateY(-50%); display: inline-block; z-index: 1000; }
    .nav-dropdown-menu { display: none; position: absolute; top: 100%; right: 0; margin-top: 12px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.4); min-width: 240px; overflow: hidden; animation: navDropIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .nav-dropdown-menu.show { display: block; }
    @keyframes navDropIn { from { opacity: 0; transform: translateY(-12px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .nav-dropdown-menu a { display: flex; align-items: center; gap: 12px; padding: 14px 18px; color: var(--text); text-decoration: none; font-size: 14px; font-weight: 500; transition: all 0.2s; border-bottom: 1px dashed var(--accent-mid); }
    .nav-dropdown-menu a:last-child { border-bottom: none; }
    .nav-dropdown-menu a:hover { background: var(--accent-light); padding-left: 24px; color: var(--accent); }
    .nav-dropdown-menu a .nav-icon { font-size: 20px; transition: transform 0.3s; }
    .nav-dropdown-menu a:hover .nav-icon { transform: scale(1.2) rotate(10deg); }
    .nav-dropdown-wrapper button {
      background: var(--accent-light); border: 1px dashed var(--accent); color: var(--accent); padding: 8px; border-radius: 12px; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .nav-dropdown-wrapper button:hover { transform: scale(1.1) rotate(5deg); background: var(--accent); color: var(--card-bg); }
"""

navigation_html = """  <div class="nav-dropdown-wrapper">
    <button onclick="toggleNavMenu()" title="Navigation">☰</button>
    <div class="nav-dropdown-menu" id="nav-menu">
        <a href="budget.html"><span class="nav-icon">💰</span> Markus Budget</a>
        <a href="analytics.html"><span class="nav-icon">📈</span> Markus Analys</a>
        <a href="budget_maja.html"><span class="nav-icon">💰</span> Majas Budget</a>
        <a href="analytics_maja.html"><span class="nav-icon">📈</span> Majas Analys</a>
        <a href="familjebudget.html"><span class="nav-icon">🏠</span> Familjebudget</a>
        <a href="data.html"><span class="nav-icon">⚙️</span> Data & Formler</a>
        <div style="border-top: 2px dotted var(--accent-mid); margin: 4px 0;"></div>
        <a href="mila.html"><span class="nav-icon">👧🏻</span> Milas Milstolpar</a>
        <a href="melker.html"><span class="nav-icon">👦🏼</span> Melkers Milstolpar</a>
    </div>
  </div>
"""

navigation_js = """
<script>
function toggleNavMenu() {
    document.getElementById('nav-menu').classList.toggle('show');
}
window.addEventListener('click', function(e) {
    const w = document.querySelector('.nav-dropdown-wrapper');
    if (w && !w.contains(e.target)) document.getElementById('nav-menu').classList.remove('show');
});
</script>
"""

new_table_css = """    /* ── TABLES ── */
    .table-wrap { overflow-x: auto; margin: 1rem 0; padding-bottom: 20px; }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 8px;
      font-size: 0.9rem;
    }
    thead tr { }
    th {
      padding: 0.5rem 1rem;
      font-family: var(--font-heading);
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--accent);
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px dotted var(--accent-mid);
    }
    tr {
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s;
      background: var(--card-bg);
      border-radius: 12px;
    }
    tbody tr:hover {
      transform: scale(1.015) translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.25);
      z-index: 10;
      position: relative;
    }
    td {
      padding: 0.85rem 1rem;
      border-top: 1px solid transparent;
      border-bottom: 1px solid transparent;
    }
    td:first-child {
      border-radius: 12px 0 0 12px;
      border-left: 2px solid transparent;
    }
    tbody tr:hover td:first-child {
      border-left: 2px solid var(--accent);
    }
    td:last-child {
      border-radius: 0 12px 12px 0;
      border-right: 1px solid transparent;
    }
    /* Squiggly line instead of rigid hr */
    hr {
      border: none;
      height: 4px;
      background-image: radial-gradient(circle, var(--accent-mid) 1.5px, transparent 2px);
      background-size: 8px 4px;
      background-position: bottom;
      margin: 2rem 0;
    }"""

new_section_h2 = """    /* ── SECTION HEADINGS ── */
    .section-title {
      font-family: var(--font-heading);
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--heading-color);
      margin: 2.5rem 0 1.5rem;
      padding-bottom: 0.4rem;
      text-decoration: underline wavy var(--accent) 2px;
      text-underline-offset: 8px;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: transform 0.3s;
    }
    .section-title:hover {
      transform: translateY(-2px) scale(1.02);
    }"""

def update_file(filepath):
    print(f"Updating {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add navigation_css before </style>
    if '/* ── NAVIGATION ── */' not in content:
        content = content.replace("  </style>", navigation_css + "\n  </style>")

    # Replace Tables CSS
    table_pattern = re.compile(r'/\* ── TABLES ── \*/.*?hr \{[^}]+\}', re.DOTALL)
    if table_pattern.search(content):
        content = table_pattern.sub(new_table_css, content)
    
    # Replace Section Headings CSS
    section_pattern = re.compile(r'/\* ── SECTION HEADINGS ── \*/.*?\.section-title \{[^}]+\}', re.DOTALL)
    if section_pattern.search(content):
        content = section_pattern.sub(new_section_h2, content)

    # Add bouncy icon to callout
    callout_icon_css = ".welcome-callout .icon { font-size: 1.4rem; flex-shrink: 0; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }\n    .welcome-callout:hover .icon { transform: scale(1.3) rotate(15deg) translateY(-3px); }"
    if ".welcome-callout:hover .icon" not in content:
        content = content.replace(".welcome-callout .icon { font-size: 1.4rem; flex-shrink: 0; }", callout_icon_css)
        content = content.replace("border-left: 4px solid var(--callout-border);", "border-left: 4px dashed var(--accent);")

    # Add profile photo hover CSS
    profile_css = ".profile-photo { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); border: 2px dashed var(--accent); }\n    .profile-photo:hover { transform: scale(1.05) rotate(-3deg); box-shadow: 0 10px 25px rgba(255,159,173,0.3); }\n    .profile-photo"
    if ".profile-photo:hover" not in content:
        content = content.replace(".profile-photo {", profile_css)

    # Add html nav
    if 'class="nav-dropdown-wrapper"' not in content:
        content = content.replace('  </header>', f'{navigation_html}  </header>')
        
    # Add JS script
    if 'function toggleNavMenu' not in content:
        content = content.replace('</body>', f'{navigation_js}\n</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_file("budget/mila.html")
update_file("budget/melker.html")
