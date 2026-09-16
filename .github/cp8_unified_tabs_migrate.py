from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def read(rel): return (ROOT/rel).read_text(encoding='utf-8')
def write(rel,text): (ROOT/rel).write_text(text,encoding='utf-8')

def replace_once(text,old,new,label):
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected 1 match, got {count}')
    return text.replace(old,new,1)

def reject_remaining(text,needles,label):
    found=[]
    for needle in needles:
        pos=text.find(needle)
        if pos>=0:
            context=text[max(0,pos-160):pos+len(needle)+220].replace('\n','\\n')
            found.append(f'{needle!r}: {context}')
    if found:
        raise SystemExit(label+'\n'+'\n'.join(found))

# Canonical training page: retire hamburger/nav menu and install one Compact symbol owner.
rel='budget/exercise.html'
s=read(rel)
s=s.replace('training-zen-nav.css?v=20260916-main-cp8-wellness-header-3','training-zen-nav.css?v=20260916-main-cp8-unified-tabs-1')
s=s.replace('training-zen-nav.js?v=20260916-main-cp8-wellness-header-3','training-zen-nav.js?v=20260916-main-cp8-unified-tabs-1')
s=s.replace('training-overview-mode.js?v=20260915-main-cp1','training-overview-mode.js?v=20260916-main-cp8-header-toggle-1')
s=s.replace('<script src="nav-menu-motion.js?v=20260831-nav-motion-v1"></script>\n','')
nav_css_start=s.find('    /* ── NAV ── */')
nav_css_end=s.find('    /* ── MAIN ── */',nav_css_start)
if nav_css_start<0 or nav_css_end<0: raise SystemExit('exercise nav CSS block not found')
s=s[:nav_css_start]+s[nav_css_end:]
header_start=s.find('  <header class="app-header" id="pulse-header">')
nav_start=s.find('    <div class="nav-dropdown-wrapper">',header_start)
header_end=s.find('  </header>',nav_start)
if min(header_start,nav_start,header_end)<0: raise SystemExit('exercise header/nav block not found')
compact='    <button id="training-overview-toggle" class="training-overview-toggle" type="button" aria-pressed="false" aria-label="Aktivera Compact vy" title="Compact vy" hidden><span class="training-overview-toggle-icon" aria-hidden="true">◆</span></button>\n'
s=s[:nav_start]+compact+s[header_end:]
# Remove the now-orphaned inline runtime that only owned the deleted hamburger/menu.
nav_js_start=s.find('// ══ NAV ═')
nav_js_end=s.find('// ══ TOAST ═',nav_js_start)
if nav_js_start<0 or nav_js_end<0: raise SystemExit('exercise inline NAV runtime block not found')
s=s[:nav_js_start]+s[nav_js_end:]
reject_remaining(s,['nav-dropdown-wrapper','id="nav-menu"','toggleNavMenu()'],'exercise still contains retired hamburger ownership')
write(rel,s)

# Zen: the existing Stretch/Meditation control becomes the single three-mode switch.
rel='budget/zen.html'
s=read(rel)
s=s.replace('training-zen-nav.css?v=20260916-main-cp8-wellness-header-3','training-zen-nav.css?v=20260916-main-cp8-unified-tabs-1')
s=s.replace('training-zen-nav.js?v=20260916-main-cp8-wellness-header-3','training-zen-nav.js?v=20260916-main-cp8-unified-tabs-1')
s=replace_once(s,'<div class="zen-header-end"><span id="profile-name">Din profil</span><button class="icon-button" id="settings-open" aria-label="Inställningar och sparad data">⋯</button></div>','<div class="zen-header-end"><button class="icon-button" id="settings-open" aria-label="Inställningar och sparad data">⋯</button></div>','zen profile text')
old='<nav class="kind-switch" aria-label="Välj kategori"><button data-kind="stretch" aria-pressed="true"><span aria-hidden="true">✧</span> Stretch</button><button data-kind="meditation" aria-pressed="false"><span aria-hidden="true">≈</span> Meditation</button></nav>'
new='<nav class="kind-switch" aria-label="Välj Träning, Stretch eller Meditation"><button type="button" data-wellness-destination="training" aria-pressed="false"><span aria-hidden="true">⌁</span> Träning</button><button type="button" data-kind="stretch" aria-pressed="true"><span aria-hidden="true">✧</span> Stretch</button><button type="button" data-kind="meditation" aria-pressed="false"><span aria-hidden="true">≈</span> Meditation</button></nav>'
s=replace_once(s,old,new,'Zen kind switch')
if 'id="profile-name"' in s: raise SystemExit('Zen profile placeholder still present')
write(rel,s)

# Record the refined CP8 navigation ownership before CP9 work begins.
rel='budget/TRAINING-OBSERVATORY-MIGRATION-CHECKLIST.md'
s=read(rel)
marker='\n# Checkpoint 9 —'
note='\n**CP8 navigation refinement (2026-09-16):** the temporary two-state `Träning / Zen` header pill has been retired. The user-facing mode control is now one three-state `Träning / Stretch / Meditation` switch in the content position formerly owned by Zen\'s `Stretch / Meditation` switch. Compact/Observatory is no longer a second content-row toggle; Compact is a single header symbol owned by `training-overview-mode.js`, highlighted only while Compact is active. The training hamburger and `Din profil` placeholder were removed from this shell.\n\n'
if marker in s and 'CP8 navigation refinement (2026-09-16)' not in s:
    s=s.replace(marker,note+marker,1)
write(rel,s)
