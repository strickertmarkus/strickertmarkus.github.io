# Pulse Reactor preview

Route: `/budget/pulse-environment/exercise.html` (append `?user=maja` for Maja).
Alternative composition: `/budget/pulse-observatory/exercise.html`.

The seven orbit nodes are the real weekly plan. The center opens the existing planned workout or its builder. All original metrics, goals, graphs, record groups and training log remain available, with matching overview editor styling.

`environment.css` contains shared overview/editor materials and the Reactor composition. Reactor-only orbit rules are scoped to `.reactor-core`. Observatory loads those shared materials and supplies its own scene and layout stylesheet. `environment.js` is the shared presentation adapter: original storage, data calculations and session handlers remain authoritative. Its Chart.js plugin changes only overview chart presentation.

The HTML uses `dashboard.js` and the shared session runtime. `<base href="../">` keeps the original asset/data namespace. `auth-gate.js` differs only in the login redirect's full-path handling. All previews use the same profile-specific training data; edits are real edits.

## Reactor training mode

Only this route loads `training.css` and `training.js`. Sessions open in Reactor design: concentric orbital rings around the existing clock, peach strength accents, rose cardio accents and lavender rest. The session header's Reactor / Original buttons switch presentation without restarting the session. The choice lasts for the current page visit.

The shared runtime still owns timers, progress, pause, set logging, transitions and saving. The adapter observes session classes to label the decorative core and pause its orbit; it never wraps workout handlers or writes training data. The stylesheet is scoped to the Reactor document and its active design attribute. Original uses the shared presentation; Observatory and the regular training route do not load these assets. Reduced-motion settings disable the decorative orbit.

## Checkpoints

- `checkpoint/training-before-pulse-environment` — `9c8ab9176b6c4b56aa53bd4c4fe630c665174cab`.
- `checkpoint/pulse-environment-v1` — `dfc54e3`, first environment version.
- `checkpoint/pulse-before-reactor` — `dfc54e3`.
- `checkpoint/pulse-reactor-core` — `bce6c71`, weekly orbit composition.
- `checkpoint/pulse-observatory-core` — `8f09660`, both compositions with shared records/log/chart/editor theme.

## Verification

The overview previews were rendered in Chromium at 320, 390, 768 and 1440 px with synthetic training fixtures and stubbed Firebase. No page-level horizontal overflow; graph values and explicit scale settings match the original. Builder, log editor and session launch work, and unsaved review actions preserve stored workouts.

The Reactor training design was checked at the same widths with local synthetic workouts and all remote data connections stubbed. No session-level horizontal overflow. Switching designs preserves the serialized session state; strength start and logging, cardio countdown and pause/resume, completion form visibility and reduced-motion behavior were checked. The native clock elements and controls are retained.

Overview switching was also checked. A configured rest interval was skipped by the shared runtime in both Reactor and Original modes in the fixture; that existing transition behavior is outside this presentation change. The rest skin was therefore inspected separately using the native rest-overlay markup. No claim of an end-to-end rest-transition fix is made here.

A shared `chart-hr-combined` canvas-reuse error on session exit was reproduced on the original page as well. It is documented in the Observatory README and is outside the presentation change. No physical Safari device test was performed.

Follow root `AGENTS.md` when updating either preview. Keep data/session runtime aligned with the original rather than adding another behavior layer.
