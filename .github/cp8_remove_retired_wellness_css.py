from pathlib import Path

root=Path(__file__).resolve().parents[1]
css_path=root/'budget/zen.css'
html_path=root/'budget/zen.html'
css=css_path.read_text(encoding='utf-8')
old='''body[data-kind=meditation] .wellness-nav {\n  background: #b5cfc05c;\n  border-color: #627e6530;\n  box-shadow: 0 3px 24px #51674d0a;\n}\n\nbody[data-kind=meditation] .wellness-nav a {\n  color: #5c716b;\n}\n\nbody[data-kind=meditation] .wellness-nav a[data-destination=zen][aria-current=page] {\n  color: #244739;\n  background: linear-gradient(120deg,#accab84d,#d4e2cc4d);\n  border-color: #6b977c40;\n}\n\n.zen-header .wellness-nav {\n  flex-shrink: 0;\n}\n\n'''
if css.count(old)!=1:
    raise SystemExit(f'expected one retired wellness-nav block, found {css.count(old)}')
css=css.replace(old,'',1)
css_path.write_text(css,encoding='utf-8')
html=html_path.read_text(encoding='utf-8')
old_ref='zen.css?v=20260913-cleanup'
new_ref='zen.css?v=20260916-unified-tabs-1'
if html.count(old_ref)!=1:
    raise SystemExit(f'expected one Zen CSS cache ref, found {html.count(old_ref)}')
html=html.replace(old_ref,new_ref,1)
html_path.write_text(html,encoding='utf-8')
