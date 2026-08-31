from pathlib import Path

p = Path('budget/budget.html')
s = p.read_text()

old = '''.nav-dropdown-wrapper { position: relative; display: inline-block; }
.nav-dropdown-menu { display: none; position: absolute; top: 100%; right: 0; margin-top: 6px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); min-width: 220px; z-index: 1000; overflow: hidden; animation: navDropIn 0.2s ease; }
.nav-dropdown-menu.show { display: block; }
@keyframes navDropIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
.nav-dropdown-menu a { display: flex; align-items: center; gap: 10px; padding: 12px 16px; color: var(--text); text-decoration: none; font-size: 14px; font-weight: 500; transition: background 0.15s; }'''

new = '''.nav-dropdown-wrapper { position: relative; display: inline-block; }
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

if s.count(old) != 1:
    raise SystemExit(f'Budget nav CSS guard failed: {s.count(old)}')
s = s.replace(old, new, 1)
p.write_text(s)
