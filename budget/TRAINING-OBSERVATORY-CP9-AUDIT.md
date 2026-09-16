# Training / Pulse Observatory — Checkpoint 9 retirement audit

Baseline before CP9: `c65f36c1df9b100994c9aaf00ac8ff78bc498bab` on `main`.

## Decision

`budget/exercise.html` is the only production training application. The old Reactor and standalone Observatory documents are no longer independent apps.

The two historical URLs remain as tiny redirect entry points only so old bookmarks do not fail:

- `budget/pulse-environment/exercise.html` → `../exercise.html`
- `budget/pulse-observatory/exercise.html` → `../exercise.html`

The redirects preserve the existing query string and hash. They contain no auth, Firebase, dashboard, chart or session runtime.

## Canonical assets retained

The production route still intentionally imports these component assets, so they remain until the Release V1 owner consolidation:

- `budget/pulse-environment/environment.css`
- `budget/pulse-environment/environment.js`
- `budget/pulse-observatory/observatory.css`

These are presentation owners for the canonical page, not separate apps.

## Preview-only assets retired

The following files were only used by the old standalone preview shells and are removed in CP9:

- `budget/pulse-environment/auth-gate.js`
- `budget/pulse-environment/dashboard.css`
- `budget/pulse-environment/dashboard.js`
- `budget/pulse-environment/exercise-heart-rate-range.js`
- `budget/pulse-environment/exercise-points-8-9.js`
- `budget/pulse-environment/records.js`
- `budget/pulse-environment/recovery.js`
- `budget/pulse-environment/training.css`
- `budget/pulse-environment/training.js`
- `budget/pulse-observatory/training.css`

The old live-session comparison (`Original / Observatory / Reactor`) therefore has no remaining runtime or stylesheet in the production tree.

## Architecture after CP9

- One production route: `budget/exercise.html`.
- Observatory and Compact share the same dashboard DOM/data owners.
- One canonical live workout/session runtime remains in `exercise.html`.
- The migrated weekly orbit remains on the canonical weekly plan.
- Training ↔ Stretch ↔ Meditation remains the shared in-page wellness shell.
- Historical standalone designs are preserved by Git history/checkpoint refs rather than duplicated runtime files.

## Verification contract

`budget/tests/training-shared-session.test.cjs` verifies that production has one session owner and no preview session assets. A CP9-specific retirement test verifies redirect-only legacy routes and absence of copied preview assets.

A temporary GitHub Actions verification run (`35105235436`) checked the canonical JavaScript sources with `node --check` and ran every `budget/tests/training-*.test.cjs` test on Node 22. Final result: **53 passed, 0 failed**. The temporary workflow is removed after this successful verification and is not part of the production architecture.

This checkpoint deliberately does not fold `environment.css/js` or `observatory.css` into final V1 owners; that belongs to Checkpoint 10.
