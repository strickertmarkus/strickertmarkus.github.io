from pathlib import Path

p = Path('budget/familjebudget.html')
s = p.read_text()

light_old = '''    --accent: #F97316;
    --accent-light: #FED7AA;
    --accent-bg: #FFF7ED;
'''
light_new = '''    --accent: #3B6DE0;
    --accent-light: #DBEAFE;
    --accent-bg: #EFF6FF;
'''

house_light_old = '''    --house: #F97316;
    --house-light: #FED7AA;
    --house-bg: #FFF7ED;
'''
house_light_new = '''    --house: #3B6DE0;
    --house-light: #DBEAFE;
    --house-bg: #EFF6FF;
'''

savings_light_old = '''    --savings: #F59E0B;
    --savings-light: #FDE68A;
    --savings-bg: #FFFBEB;
'''
savings_light_new = '''    --savings: #0EA5E9;
    --savings-light: #BAE6FD;
    --savings-bg: #F0F9FF;
'''

dark_old = '''    --accent: #FB923C;
    --accent-light: #7C2D12;
    --accent-bg: #1F1008;
'''
dark_new = '''    --accent: #60A5FA;
    --accent-light: #1E3A5F;
    --accent-bg: #0F1A2E;
'''

house_dark_old = '''    --house: #FB923C;
    --house-light: #7C2D12;
    --house-bg: #1F1008;
'''
house_dark_new = '''    --house: #60A5FA;
    --house-light: #1E3A5F;
    --house-bg: #0F1A2E;
'''

savings_dark_old = '''    --savings: #FBBF24;
    --savings-light: #78350F;
    --savings-bg: #1C1408;
'''
savings_dark_new = '''    --savings: #38BDF8;
    --savings-light: #155E75;
    --savings-bg: #0A1A20;
'''

for old, new, name in [
    (light_old, light_new, 'light accent'),
    (house_light_old, house_light_new, 'light house'),
    (savings_light_old, savings_light_new, 'light savings'),
    (dark_old, dark_new, 'dark accent'),
    (house_dark_old, house_dark_new, 'dark house'),
    (savings_dark_old, savings_dark_new, 'dark savings'),
]:
    if s.count(old) != 1:
        raise SystemExit(f'{name} guard failed: {s.count(old)}')
    s = s.replace(old, new, 1)

p.write_text(s)
