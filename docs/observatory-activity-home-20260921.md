# Observatory activity and home alignment — 2026-09-21

## Scope and recovery

- Production entry: `budget/exercise.html?overview=observatory`.
- Main before this delivery: `c917ba94a4f3781fae72a4b074af9116439d591f`.
- Activity implementation before the home redesign: `ca71dd43d04d592a63c8e703931d5a206797ddc5`.
- Work branch: `work/activity-glow-20260921`.
- Ingemar's concurrent changes are preserved. Compact, active workout presentation and Zen sessions are outside this redesign.

## Changes

- One existing Chart.js canvas now presents daily activity or eight weeks of history, with minutes/session switching and period navigation. Charts remain unboxed.
- Canonical saved workouts are the only data source. Missing duration still counts as a session and is explained in the minutes view; future records are excluded. Calendar aggregation handles ISO week/year boundaries and daylight-saving dates.
- Observatory home follows Zen's left-aligned scene title, serif hierarchy, breathing space and 168px start circle. Pink atmosphere and cyan star retain the Observatory identity.
- The selected workout name and summary are inside the start circle; long names are clamped visually and remain complete in its accessible label.
- Only the outer ring breathes; the actual hit target and text remain steady. Reduced motion and the existing visibility scheduler are respected.
- The duplicate hero builder and its obsolete CSS/handlers were removed. The lower builder card is always available, including when saved templates exist.
- Quick-link selection is painted without changing link width. Narrow layouts omit decorative link icons.
- Existing canonical workout start, editor, template draft and persistence paths are reused. No extra workout store, renderer or session mode was added.

## Verification

- Local syntax checks and relevant Node regression tests pass.
- WebKit suite covers empty/populated overview at 320/390/1440px, long workout names, page overflow, unboxed graphs, lower builder access, template draft/cancel, actual workout start, chart navigation, touch, keyboard, Compact, Zen sessions and rapid mode changes.
- Screenshots are produced as the `observatory-visual-review` Actions artifact, including each activity view and Training/Stretch/Meditation home views.
- Tests use isolated fixture workouts and a Firebase stub; they do not write to a real account. WebKit emulation is not a physical iPhone test.

- Activity-only WebKit verification passed: Actions run `35620610746`.
- Home, steady start target and complete mode flows passed: Actions run `35636882578`.
- Final narrow-layout verification: Actions run `35636985957` (the associated artifact contains the final review images).
