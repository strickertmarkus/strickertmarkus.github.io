from pathlib import Path
import runpy

p = Path(__file__).with_name('training_next_pass_orb_update.py')
s = p.read_text(encoding='utf-8')
old = "css = replace_once(css, ' #pulse-home .observatory-start{gap:7px;padding-top:12px;padding-bottom:7px}\\n #pulse-home .observatory-start #reactor-title{font-size:28px}', ' #pulse-home #reactor-title{font-size:28px}\\n #pulse-home .observatory-build{min-height:44px;padding:10px 17px;gap:12px;font-size:12px}', 'mobile wrapper removal')"
new = "css = replace_once(css, ' #pulse-home .observatory-start{gap:7px;padding-top:12px;padding-bottom:7px}\\n #pulse-home #reactor-title{font-size:28px}', ' #pulse-home #reactor-title{font-size:28px}\\n #pulse-home .observatory-build{min-height:44px;padding:10px 17px;gap:12px;font-size:12px}', 'mobile wrapper removal')"
if s.count(old) != 1:
    raise SystemExit(f'helper ordering fix: expected one match, found {s.count(old)}')
p.write_text(s.replace(old, new, 1), encoding='utf-8')
runpy.run_path(str(p), run_name='__main__')
