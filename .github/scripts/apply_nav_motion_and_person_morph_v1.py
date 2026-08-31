from pathlib import Path

NAV_VERSION = '20260831-nav-motion-v1'
FINANCE_VERSION_OLD = '20260831-finance-theme-blue-v9'
FINANCE_VERSION_NEW = '20260831-finance-theme-blue-v10-person-morph'

nav_module = r'''(function () {
  'use strict';

  if (window.__navMenuMotionInstalled) return;
  window.__navMenuMotionInstalled = true;

  var style = document.createElement('style');
  style.id = 'nav-menu-motion-v1-style';
  style.textContent =
    '.nav-dropdown-menu{' +
      'display:block!important;' +
      'opacity:0!important;' +
      'visibility:hidden!important;' +
      'pointer-events:none!important;' +
      'transform-origin:100% 0%!important;' +
      'transform:translate3d(7px,-7px,0) scale(.72)!important;' +
      'clip-path:inset(0 0 68% 56% round 12px)!important;' +
      'animation:none!important;' +
      'transition:transform .308s cubic-bezier(.22,1,.36,1),clip-path .308s cubic-bezier(.22,1,.36,1),opacity .158s ease,visibility 0s linear .308s!important;' +
      'will-change:transform,clip-path,opacity;' +
      'z-index:5000!important' +
    '}' +
    '.nav-dropdown-menu.show{' +
      'opacity:1!important;' +
      'visibility:visible!important;' +
      'pointer-events:auto!important;' +
      'transform:translate3d(0,0,0) scale(1)!important;' +
      'clip-path:inset(0 0 0 0 round 12px)!important;' +
      'transition:transform .328s cubic-bezier(.22,1,.36,1),clip-path .328s cubic-bezier(.22,1,.36,1),opacity .128s ease,visibility 0s!important' +
    '}' +
    '.nav-dropdown-menu>*{' +
      'opacity:0!important;' +
      'transform:translate3d(12px,-4px,0) scale(.97)!important;' +
      'transform-origin:100% 0%!important;' +
      'transition:transform .228s cubic-bezier(.22,1,.36,1),opacity .148s ease!important;' +
      'transition-delay:0s!important' +
    '}' +
    '.nav-dropdown-menu.show>*{' +
      'opacity:1!important;' +
      'transform:translate3d(0,0,0) scale(1)!important;' +
      'transition-delay:var(--nav-expand-delay,24ms)!important' +
    '}' +
    '@media(prefers-reduced-motion:reduce){' +
      '.nav-dropdown-menu,.nav-dropdown-menu>*{' +
        'transition-duration:.001s!important;' +
        'transition-delay:0s!important' +
      '}' +
    '}';
  document.head.appendChild(style);

  function indexMenus() {
    document.querySelectorAll('.nav-dropdown-menu').forEach(function (menu) {
      Array.prototype.forEach.call(menu.children, function (item, index) {
        item.style.setProperty('--nav-expand-delay', (24 + index * 18) + 'ms');
      });
    });
  }

  function setup() {
    requestAnimationFrame(indexMenus);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
})();
'''
Path('budget/nav-menu-motion.js').write_text(nav_module)

# Remove the Budget-only prototype. The shared module is now the sole motion owner.
budget = Path('budget/budget.html')
s = budget.read_text()
old_budget_nav = '''.nav-dropdown-wrapper { position: relative; display: inline-block; }
.nav-dropdown-menu {
    display: block;
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 6px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    min-width: 220px;
    z-index: 1000;
    overflow: hidden;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform-origin: 100% 0%;
    transform: translate3d(7px,-7px,0) scale(.72);
    clip-path: inset(0 0 68% 56% round 12px);
    transition:
        transform .30s cubic-bezier(.22,1,.36,1),
        clip-path .30s cubic-bezier(.22,1,.36,1),
        opacity .15s ease,
        visibility 0s linear .30s;
    will-change: transform, clip-path, opacity;
}
.nav-dropdown-menu.show {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translate3d(0,0,0) scale(1);
    clip-path: inset(0 0 0 0 round 12px);
    transition:
        transform .32s cubic-bezier(.22,1,.36,1),
        clip-path .32s cubic-bezier(.22,1,.36,1),
        opacity .12s ease,
        visibility 0s;
}
.nav-dropdown-menu > a,
.nav-dropdown-menu > div {
    opacity: 0;
    transform: translate3d(12px,-4px,0) scale(.97);
    transform-origin: 100% 0%;
    transition: transform .22s cubic-bezier(.22,1,.36,1), opacity .14s ease;
}
.nav-dropdown-menu.show > a,
.nav-dropdown-menu.show > div {
    opacity: 1;
    transform: translate3d(0,0,0) scale(1);
}
.nav-dropdown-menu.show > :nth-child(1) { transition-delay: .025s; }
.nav-dropdown-menu.show > :nth-child(2) { transition-delay: .045s; }
.nav-dropdown-menu.show > :nth-child(3) { transition-delay: .065s; }
.nav-dropdown-menu.show > :nth-child(4) { transition-delay: .085s; }
.nav-dropdown-menu.show > :nth-child(5) { transition-delay: .105s; }
.nav-dropdown-menu.show > :nth-child(6) { transition-delay: .125s; }
.nav-dropdown-menu.show > :nth-child(7) { transition-delay: .145s; }
.nav-dropdown-menu.show > :nth-child(8) { transition-delay: .165s; }
.nav-dropdown-menu.show > :nth-child(9) { transition-delay: .185s; }
.nav-dropdown-menu a { display: flex; align-items: center; gap: 10px; padding: 12px 16px; color: var(--text); text-decoration: none; font-size: 14px; font-weight: 500; transition-property: background, transform, opacity; }
@media (prefers-reduced-motion: reduce) {
    .nav-dropdown-menu,
    .nav-dropdown-menu > a,
    .nav-dropdown-menu > div { transition-duration: .001s !important; transition-delay: 0s !important; }
}'''
new_budget_nav = '''.nav-dropdown-wrapper { position: relative; display: inline-block; }
.nav-dropdown-menu { display: none; position: absolute; top: 100%; right: 0; margin-top: 6px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); min-width: 220px; z-index: 1000; overflow: hidden; }
.nav-dropdown-menu.show { display: block; }
.nav-dropdown-menu a { display: flex; align-items: center; gap: 10px; padding: 12px 16px; color: var(--text); text-decoration: none; font-size: 14px; font-weight: 500; transition: background 0.15s; }'''
if s.count(old_budget_nav) != 1:
    raise SystemExit(f'Budget prototype nav block count: {s.count(old_budget_nav)}')
s = s.replace(old_budget_nav, new_budget_nav, 1)
budget.write_text(s)

# Give every current, non-backup page with a hamburger menu the same shared module.
nav_pages = []
for p in sorted(Path('budget').glob('*.html')):
    if 'backup' in p.name.lower():
        continue
    s = p.read_text()
    if 'nav-dropdown-menu' not in s:
        continue
    nav_pages.append(p.as_posix())
    tag = f'<script src="nav-menu-motion.js?v={NAV_VERSION}"></script>'
    if 'nav-menu-motion.js' not in s:
        if '</head>' not in s:
            raise SystemExit(f'{p}: missing </head>')
        s = s.replace('</head>', tag + '\n</head>', 1)
        p.write_text(s)

# Person switching: keep the source identity intact until navigation so finance-person
# actually has an old and a new value to morph between.
ui = Path('budget/finance-ui.js')
s = ui.read_text()
old_profile = '''      flushBudget();
      remember(nextUser);
      updateActiveStates();
      setHeaderIdentity();
      if (!page.family) navigate(view, nextUser);'''
new_profile = '''      if (page.family) {
        remember(nextUser);
        updateActiveStates();
        setHeaderIdentity();
        return;
      }
      remember(nextUser);
      navigate(view, nextUser);'''
if s.count(old_profile) != 1:
    raise SystemExit(f'finance profile navigation guard count: {s.count(old_profile)}')
s = s.replace(old_profile, new_profile, 1)

old_prefetch = '''  function prefetch() {
    ['budget','analysis','family'].forEach(function (nextView) {
      var href = route(nextView, user);
      if (location.pathname.toLowerCase().endsWith('/' + href.toLowerCase())) return;
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    });
  }'''
new_prefetch = '''  function prefetch() {
    var hrefs = ['budget','analysis','family'].map(function (nextView) {
      return route(nextView, user);
    });
    if (!page.family) {
      hrefs.push(route(view, user === 'maja' ? 'markus' : 'maja'));
    }
    Array.from(new Set(hrefs)).forEach(function (href) {
      if (location.pathname.toLowerCase().endsWith('/' + href.toLowerCase())) return;
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    });
  }'''
if s.count(old_prefetch) != 1:
    raise SystemExit(f'finance prefetch guard count: {s.count(old_prefetch)}')
s = s.replace(old_prefetch, new_prefetch, 1)
ui.write_text(s)

finance_pages = [
    Path('budget/budget.html'),
    Path('budget/budget_maja.html'),
    Path('budget/analytics.html'),
    Path('budget/analytics_maja.html'),
    Path('budget/familjebudget.html'),
]
for p in finance_pages:
    s = p.read_text()
    old = f'finance-ui.js?v={FINANCE_VERSION_OLD}'
    new = f'finance-ui.js?v={FINANCE_VERSION_NEW}'
    if s.count(old) != 1:
        raise SystemExit(f'{p}: finance loader guard count {s.count(old)}')
    p.write_text(s.replace(old, new, 1))

Path('/tmp/nav-motion-pages.txt').write_text('\n'.join(nav_pages) + '\n')
print('Shared hamburger motion pages:')
print('\n'.join(nav_pages))
