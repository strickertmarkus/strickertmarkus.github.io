from pathlib import Path
import re

ui = Path('budget/finance-ui.js')
s = ui.read_text()
original = s

# Native cross-document Morph is now the only finance page transition.
s, n = re.subn(r"\n  var TRANSITION_KEY = 'finance-view-transition-clean-v1';", '', s, count=1)
if n != 1:
    raise SystemExit('TRANSITION_KEY not found')

s, n = re.subn(
    r"\n  function transitionDirection\(nextView\) \{.*?\n  \}\n\n  function markTransition\(nextView, nextUser\) \{.*?\n  \}\n",
    '\n',
    s,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('legacy transition helpers not found')

if "    markTransition(nextView, nextUser);\n" not in s:
    raise SystemExit('markTransition call not found')
s = s.replace("    markTransition(nextView, nextUser);\n", '', 1)

# Make the morph style identifier implementation-neutral rather than versioned.
s = s.replace("finance-morph-v13-style", "finance-morph-style")

# Remove the v12 destination-only transform fallback and its keyframes.
s, n = re.subn(
    r"\n      '\.container\.finance-arrival-clean-v1\{[^\n]*\}' \+\n      '@keyframes financeArrivalCleanV1\{[^\n]*\}' \+",
    '',
    s,
    count=1,
)
if n != 1:
    raise SystemExit('legacy arrival CSS not found')

old_reduced = "      '@media(prefers-reduced-motion:reduce){.container.finance-arrival-clean-v1{animation:none!important;transform:none!important}}';"
new_reduced = "      '@media(prefers-reduced-motion:reduce){::view-transition-group(finance-title),::view-transition-group(finance-person),::view-transition-group(finance-month),::view-transition-group(finance-profile),::view-transition-group(finance-views),::view-transition-group(finance-menu),::view-transition-group(finance-panel-0),::view-transition-group(finance-panel-1),::view-transition-group(finance-panel-2){animation-duration:.001s!important}}';"
if old_reduced not in s:
    raise SystemExit('old reduced-motion fallback not found')
s = s.replace(old_reduced, new_reduced, 1)

# The old shell cleanup is no longer needed: none of these legacy UI layers exist in the repo.
s, n = re.subn(
    r"\n  function cleanLegacy\(\) \{.*?\n  \}\n\n  function setHeaderIdentity\(\) \{",
    "\n  function setHeaderIdentity() {",
    s,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('cleanLegacy block not found')

# Remove the v12 sessionStorage arrival fallback. Native Morph handles matching geometry.
s, n = re.subn(
    r"\n  function animateArrival\(\) \{.*?\n  \}\n\n  function prefetch\(\) \{",
    "\n  function prefetch() {",
    s,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('animateArrival block not found')

for dead_call in ("    cleanLegacy();\n", "    animateArrival();\n"):
    if dead_call not in s:
        raise SystemExit(f'dead init call not found: {dead_call.strip()}')
    s = s.replace(dead_call, '', 1)

if s == original:
    raise SystemExit('finance-ui.js unchanged')
ui.write_text(s)

pages = [
    'budget/budget.html',
    'budget/budget_maja.html',
    'budget/analytics.html',
    'budget/analytics_maja.html',
    'budget/familjebudget.html',
]
for name in pages:
    p = Path(name)
    t = p.read_text()
    old = 'finance-ui.js?v=20260830-finance-clean-v13'
    new = 'finance-ui.js?v=20260830-finance-final-v1'
    if old not in t:
        raise SystemExit(f'{name}: v13 loader not found')
    p.write_text(t.replace(old, new, 1))
