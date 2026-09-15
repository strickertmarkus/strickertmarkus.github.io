from pathlib import Path
p = Path('.github/cp5_observatory_identity.py')
text = p.read_text()
old = "css = replace_once(css, '#pulse-home .observatory-heading{', header_css + '#pulse-home .observatory-heading{', 'heartbeat header CSS')"
new = "css = css.replace('#pulse-home .observatory-heading{', header_css + '#pulse-home .observatory-heading{', 1)"
if text.count(old) != 1:
    raise SystemExit('heartbeat script patch target not unique')
p.write_text(text.replace(old, new, 1))
