import re

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
      box-shadow: 0 8px 16px rgba(0,0,0,0.3);
      z-index: 10;
      position: relative;
    }
    td {
      padding: 0.85rem 1rem;
      border-top: 1px solid transparent;
      border-bottom: 1px solid transparent;
      vertical-align: top;
    }
    td:first-child {
      border-radius: 12px 0 0 12px;
      border-left: 2px solid transparent;
      white-space: nowrap; 
      color: var(--text-muted); 
      font-size: 0.85rem;
    }
    tbody tr:hover td:first-child {
      border-left: 2px solid var(--accent);
    }
    td:last-child {
      border-radius: 0 12px 12px 0;
      border-right: 1px solid transparent;
    }
"""

new_hr_css = """    /* ── HORIZONTAL RULE ── */
    hr {
      border: none;
      height: 4px;
      background-image: radial-gradient(circle, var(--accent) 1px, transparent 1.5px);
      background-size: 10px 4px;
      background-position: bottom;
      margin: 2.5rem 0;
    }"""

def update_file(filepath):
    print(f"Fixing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace Tables CSS
    table_pattern = re.compile(r'/\* ── TABLES ── \*/.*?td:first-child \{[^}]+\}', re.DOTALL)
    if table_pattern.search(content):
        content = table_pattern.sub(new_table_css.strip(), content)
    
    # Replace HR CSS
    hr_pattern = re.compile(r'/\* ── HORIZONTAL RULE ── \*/.*?hr \{[^}]+\}', re.DOTALL)
    if hr_pattern.search(content):
        content = hr_pattern.sub(new_hr_css.strip(), content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_file("budget/mila.html")
update_file("budget/melker.html")
