# Training / Pulse Observatory — Checkpoint 10 consolidation audit

Pre-CP10 rollback point: `bed2984a6794e45d8b48e2a73c27770511face17`.

Rollback branch created before implementation:

- `checkpoint/training-observatory-pre-cp10-2026-09-16`

## Scope

Checkpoint 10 integrates the completed Observatory migration with `TRAINING-RELEASE-V1-PLAN.md` instead of preserving the migration modules as permanent extra owners. This checkpoint also corrects the earlier navigation cleanup: the user wanted the duplicate Training hamburger removed, not every hamburger removed.

## Shared hamburger correction

There is now exactly **one shared hamburger menu** in the persistent `#pulse-header`.

Because Training, Stretch and Meditation use the same in-page wellness shell/header, this one control is present on all three surfaces rather than being recreated per surface.

Current owner during migration: `exercise-motion-v1.js`.

The menu:

- has one `#training-nav-toggle` / `#nav-menu` pair;
- closes on outside click, Escape or navigation;
- exposes accessible expanded/hidden state;
- adapts presentation to Training, Stretch and Meditation themes;
- keeps `?user=maja` on the canonical Training link;
- links to the single canonical `budget/exercise.html` training route;
- does **not** reintroduce standalone Pulse Reactor or Pulse Observatory preview links.

This supersedes the CP8 note that the Training hamburger should remain removed. The intended rule is now: **one persistent hamburger, never two**.

## Canonical dashboard ownership

Created:

- `budget/exercise-dashboard.js`

It is now the sole JavaScript behavior owner for:

1. Compact ↔ Observatory overview switching and morph state;
2. Observatory dashboard/context adaptation and semantic visual state;
3. Next Workout presentation/delegation;
4. the linear ↔ Observatory weekly orbit over the canonical seven day nodes.

The dashboard remains presentation-only with respect to live training state. It delegates workout start to the existing canonical `startWorkoutSessionForDate(...)` function and does not own `sessionState`, workout persistence or Firebase storage.

## Compatibility paths during the V1 loader transition

The existing HTML shell still references three historical migration paths. To avoid a risky large loader rewrite inside this checkpoint, those files remain as tiny non-owning compatibility loaders:

- `budget/training-overview-mode.js`
- `budget/pulse-environment/environment.js`
- `budget/training-week-orbit.js`

Each points to `exercise-dashboard.js?v=20260916-main-cp10-dashboard-1`; none retains its former feature implementation.

This is an interim loader state only. `TRAINING-RELEASE-V1-PLAN.md` now explicitly requires these compatibility paths to disappear during the final V1 loader cutover. They must not regain behavior.

Presentation CSS remains separate for now:

- `budget/pulse-environment/environment.css`
- `budget/pulse-observatory/observatory.css`
- `budget/training-week-orbit.css`

## Release V1 mapping update

`TRAINING-RELEASE-V1-PLAN.md` was re-opened and updated for the migration architecture.

The final target remains 12 feature owners. Migration-specific ownership maps as follows:

- Compact/Observatory + adapter + orbit → `exercise-dashboard.js`;
- shared wellness shell/navigation lifecycle (`training-zen-nav.js`) → final `exercise-motion.js` responsibility;
- one shared hamburger/motion owner → final `exercise-motion.js`;
- live workout/session behavior remains mapped to the existing session core/transitions/presentation/UX/Pulse/timer/persistence owners.

The old 41-script figure is retained only as the original pre-migration audit baseline. Checkpoint 11 must measure the actual release-candidate request graph after compatibility loaders are removed rather than treating 41 → 12 as a current request count.

## Regression verification

Temporary GitHub Actions run `35130284672` on Node 22 verified the CP10 code before documentation cleanup.

Result:

- CP10 JavaScript syntax checks: **passed**;
- `budget/tests/training-*.test.cjs`: **59 passed, 0 failed**;
- `budget/tests/zen*.test.cjs`: **20 passed, 0 failed**.

The Training suite includes dedicated coverage for:

- one shared hamburger in the persistent wellness header;
- no retired preview links in that menu;
- one canonical dashboard owner;
- non-owning compatibility loaders;
- one live workout/session runtime;
- Compact and Observatory using the same workout start path;
- one weekly-orbit state/RAF owner;
- existing Observatory state/mobile/identity behavior;
- existing Training ↔ Stretch ↔ Meditation shell behavior.

The temporary verification workflow is removed after the successful run and is not part of production architecture.

## Checkpoint 10 exit state

- One production Training application remains: `budget/exercise.html`.
- One shared live training/session runtime remains.
- One canonical dashboard JavaScript behavior owner now covers Observatory/Compact/orbit migration behavior.
- One persistent hamburger is shared by Training, Stretch and Meditation.
- Reactor/standalone Observatory remain retired as production applications.
- Release V1 ownership documentation reflects the migration.
- Git history/checkpoint branches remain the rollback archive.

Checkpoint 11 is the final release-candidate regression/device/load gate.