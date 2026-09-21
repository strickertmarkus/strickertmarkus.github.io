# Wellness cohesion checkpoints

Baseline: `a420bed1333c3c3d96d1b355393e3ddf3d304e8b`.
Restore branch: `checkpoint/wellness-before-cohesion-20260920`.
Scope: Observatory overview, shared navigation and Zen home start controls. Existing sessions/data remain canonical; new Zen compact modes are excluded.

- [x] 1–2: today glow with independent selected/completed states; soft shared card materials.
- [x] 3–4: coherent cards, template selection and overview order.
- [x] 5–6: stable shared navigation and typography roles.
- [x] 7–8: selective action lighting and atmosphere below the hero.
- [x] 9–10: consistent motion and mobile readability.
- [x] Stretch: consolidate home start orb and iPhone placement.
- [x] Validate: Node checks, WebKit interactions and actual screenshots in all three themes.

- [x] Follow-up: goal/progress graphs sit directly on the background without panel borders, fills or shadows.
- [x] Refresh changed asset URLs, including the lazily fetched Zen document.
- [x] All repository Node tests: 131/131 passing, including the latest independent Ingemar changes.

Validation scope:
- WebKit runs the canonical exercise page with real Chart.js and Inter/Cormorant Garamond/Manrope font assets; Firebase is stubbed in the isolated fixture.
- Empty and populated Observatory layouts at 320/390/1440 px; open graph surfaces, today/completed states, templates prepared as unsaved drafts, week orbit, chart touch and expandable history.
- Zen home layouts at 320/390/430/1440 px; round start controls, consistent gutters, no horizontal overflow, start/pause/resume/discard, input zoom floor and document canvas.
- Rapid and interrupted mode changes must settle without leftover motion classes or scroll anchoring overrides.
- Long chart screenshot sequences and Zen interaction checks use separate page instances to avoid retaining the large screenshot document in WebKit.
- No live account writes, physical iPhone session or full security audit is claimed by this fixture.

- Overview dialogs use the shared short opacity/translation animation; live workout session animations retain their existing owner.

Passing WebKit run: https://github.com/strickertmarkus/strickertmarkus.github.io/actions/runs/35602124551.

Deferred by request: new glowing weekly activity bars (minutes/pass count with a history view) are a proposal only; Stretch/Meditation compact modes remain a later task.
