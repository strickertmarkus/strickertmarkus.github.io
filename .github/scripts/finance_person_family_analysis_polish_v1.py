from pathlib import Path

FIN_OLD = '20260831-finance-theme-blue-v10-person-morph'
FIN_NEW = '20260831-finance-theme-blue-v11-person-first-paint'

# 1) Person morph: make the source/destination identity correct before first paint.
ui = Path('budget/finance-ui.js')
s = ui.read_text()
old = """      ':root{view-transition-name:none}' +
      'body .header>h1{view-transition-name:finance-title}' +
      '::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.46s!important;animation-timing-function:cubic-bezier(.22,1,.36,1)!important}' +"""
new = """      ':root{view-transition-name:none}' +
      'body .header>h1{view-transition-name:finance-title}' +
      'body .header>p{view-transition-name:finance-person;color:' + (user === 'maja' ? '#F472B6' : '#60A5FA') + '!important;font-weight:700!important;opacity:1!important}' +
      '::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.46s!important;animation-timing-function:cubic-bezier(.22,1,.36,1)!important}' +"""
if s.count(old) != 1:
    raise SystemExit(f'finance morph bootstrap guard: {s.count(old)}')
s = s.replace(old, new, 1)
old_targets = """  function setupFinanceMorphTargets() {
    var header = document.querySelector('.header');
    if (header) {
      var sub = header.querySelector('p');
      if (sub) sub.style.viewTransitionName = 'finance-person';
    }

    var container = document.querySelector('.container');"""
new_targets = """  function setupFinanceMorphTargets() {
    var container = document.querySelector('.container');"""
if s.count(old_targets) != 1:
    raise SystemExit(f'finance morph target guard: {s.count(old_targets)}')
s = s.replace(old_targets, new_targets, 1)
ui.write_text(s)

person_pages = {
    Path('budget/budget.html'): ('<p>Månatlig översikt &middot; Alla belopp i SEK</p>', '<p>Markus</p>'),
    Path('budget/budget_maja.html'): ('<p>Månatlig översikt &middot; Alla belopp i SEK</p>', '<p>Maja</p>'),
    Path('budget/analytics.html'): ('<p>Jämförelser, trender och sparmål</p>', '<p>Markus</p>'),
    Path('budget/analytics_maja.html'): ('<p>Jämförelser, trender och sparmål</p>', '<p>Maja</p>'),
}
for p, (before, after) in person_pages.items():
    text = p.read_text()
    if text.count(before) != 1:
        raise SystemExit(f'{p}: static person guard {text.count(before)}')
    p.write_text(text.replace(before, after, 1))

# 2) Family page: make generic UI accents orange/amber while preserving person/status semantics.
family = Path('budget/familjebudget.html')
s = family.read_text()
replacements = [
    ('--accent: #3B6DE0;\n    --accent-light: #DBEAFE;\n    --accent-bg: #EFF6FF;',
     '--accent: #F97316;\n    --accent-light: #FED7AA;\n    --accent-bg: #FFF7ED;'),
    ('--house: #3B6DE0;\n    --house-light: #DBEAFE;\n    --house-bg: #EFF6FF;',
     '--house: #F97316;\n    --house-light: #FED7AA;\n    --house-bg: #FFF7ED;'),
    ('--savings: #0EA5E9;\n    --savings-light: #BAE6FD;\n    --savings-bg: #F0F9FF;',
     '--savings: #F59E0B;\n    --savings-light: #FDE68A;\n    --savings-bg: #FFFBEB;'),
    ('--accent: #60A5FA;\n    --accent-light: #1E3A5F;\n    --accent-bg: #0F1A2E;',
     '--accent: #FB923C;\n    --accent-light: #7C2D12;\n    --accent-bg: #1F1008;'),
    ('--house: #60A5FA;\n    --house-light: #1E3A5F;\n    --house-bg: #0F1A2E;',
     '--house: #FB923C;\n    --house-light: #7C2D12;\n    --house-bg: #1F1008;'),
    ('--savings: #38BDF8;\n    --savings-light: #155E75;\n    --savings-bg: #0A1A20;',
     '--savings: #FBBF24;\n    --savings-light: #78350F;\n    --savings-bg: #1C1408;'),
    ('background: linear-gradient(135deg, #1e3a5f 0%, #3B6DE0 100%);',
     'background: linear-gradient(135deg, #2A1608 0%, #7C2D12 100%);'),
    ('.data-table .total-row { font-weight: 700; background: rgba(59,109,224,0.06); }',
     '.data-table .total-row { font-weight: 700; background: rgba(249,115,22,0.06); }'),
    ('html.dark-mode .data-table .total-row { background: rgba(96,165,250,0.08); }',
     'html.dark-mode .data-table .total-row { background: rgba(251,146,60,0.09); }'),
    ('html.dark-mode .editable-input:focus { background: rgba(96,165,250,0.1); }',
     'html.dark-mode .editable-input:focus { background: rgba(251,146,60,0.10); }'),
    ('.btn-edit { background: rgba(37,99,235,0.12); color: var(--accent); }\n.btn-edit:hover { background: rgba(37,99,235,0.25); }',
     '.btn-edit { background: rgba(251,146,60,0.12); color: var(--accent); }\n.btn-edit:hover { background: rgba(251,146,60,0.24); }'),
    ('.btn-extra { background: rgba(96,165,250,0.12); color: #60A5FA; }\n.btn-extra:hover { background: rgba(96,165,250,0.25); }',
     '.btn-extra { background: rgba(251,146,60,0.12); color: var(--accent); }\n.btn-extra:hover { background: rgba(251,146,60,0.24); }'),
    ('html.dark-mode .nav-dropdown-menu a:hover { background: rgba(96,165,250,0.1); }',
     'html.dark-mode .nav-dropdown-menu a:hover { background: rgba(251,146,60,0.11); }'),
    ('html.dark-mode .nav-dropdown-menu a.active { background: rgba(96,165,250,0.1); }',
     'html.dark-mode .nav-dropdown-menu a.active { background: rgba(251,146,60,0.11); }'),
    ('loan: dark ? "#60A5FA" : "#3B6DE0",',
     'loan: dark ? "#FB923C" : "#F97316",'),
    ('house: dark ? "#A78BFA" : "#7C3AED",',
     'house: dark ? "#FBBF24" : "#F59E0B",'),
    ('savings: dark ? "#38BDF8" : "#0EA5E9"',
     'savings: dark ? "#FDBA74" : "#FB923C"'),
]
for before, after in replacements:
    count = s.count(before)
    if count != 1:
        raise SystemExit(f'family guard failed ({count}): {before[:70]!r}')
    s = s.replace(before, after, 1)
family.write_text(s)

# 3) Analysis: move Sparmål below all graph rows on both personal analysis pages.
goals_block = '''    <!-- Savings Goals (First Row) -->
    <div class="savings-goals-section">
        <h3 id="heading-goals" class="editable-heading" ondblclick="editHeading(event,'goals')">Sparmål</h3>
        <p>Följ dina sparmål och framsteg. Belopp ackumuleras automatiskt från sparande-sektionen.</p>
        <div class="goals-grid" id="goals-container"></div>
        <button class="btn-add-goal" onclick="openGoalModal()">+ Nytt sparmål</button>
    </div>

'''
for p in [Path('budget/analytics.html'), Path('budget/analytics_maja.html')]:
    text = p.read_text()
    if text.count(goals_block) != 1:
        raise SystemExit(f'{p}: goals block guard {text.count(goals_block)}')
    text = text.replace(goals_block, '', 1)
    marker = '\n</div>\n\n<!-- Goal Modal -->'
    idx = text.find(marker)
    if idx == -1:
        raise SystemExit(f'{p}: container close marker missing')
    insert = '''

    <!-- Savings Goals -->
    <div class="savings-goals-section">
        <h3 id="heading-goals" class="editable-heading" ondblclick="editHeading(event,'goals')">Sparmål</h3>
        <p>Följ dina sparmål och framsteg. Belopp ackumuleras automatiskt från sparande-sektionen.</p>
        <div class="goals-grid" id="goals-container"></div>
        <button class="btn-add-goal" onclick="openGoalModal()">+ Nytt sparmål</button>
    </div>'''
    text = text[:idx] + insert + text[idx:]
    p.write_text(text)

# Bump finance UI on all finance pages to avoid stale first-paint code.
finance_pages = [
    Path('budget/budget.html'), Path('budget/budget_maja.html'),
    Path('budget/analytics.html'), Path('budget/analytics_maja.html'),
    Path('budget/familjebudget.html')
]
for p in finance_pages:
    text = p.read_text()
    old = f'finance-ui.js?v={FIN_OLD}'
    new = f'finance-ui.js?v={FIN_NEW}'
    if text.count(old) != 1:
        raise SystemExit(f'{p}: finance cache guard {text.count(old)}')
    p.write_text(text.replace(old, new, 1))
