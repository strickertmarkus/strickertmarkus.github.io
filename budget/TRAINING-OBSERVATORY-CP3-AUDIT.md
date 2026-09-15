# Training / Pulse Observatory — Checkpoint 3 shared-session audit

Baseline: `c51bdd8b418575c4f9d8ee2179b8a32f9efa9a86`
Rollback branch: `checkpoint/training-observatory-cp3-before-shared-session-2026-09-15`

## Goal

Checkpoint 3 locks the production architecture to one live workout/session runtime regardless of whether the overview is shown as Compact or Pulse Observatory.

No live-session redesign is performed here. The current production runtime has accumulated working timer, transition, persistence and Safari/iPhone fixes; replacing or re-skinning it during this migration would add risk without architectural benefit.

## Inventory

### Production session owner

`budget/exercise.html` owns the canonical live workout state and entry point:

- one `#session-modal`
- one `sessionState`
- one `startWorkoutSessionForDate(iso)` implementation
- the existing save/finish/cancel paths

The Compact/day-plan path invokes this same `startWorkoutSessionForDate(iso)` function.

### Observatory overview adapter

`budget/pulse-environment/environment.js` is presentation/overview glue on the production route. Its `#reactor-start` / Observatory next-workout action delegates directly to `window.startWorkoutSessionForDate(selectedDate)` when a planned workout exists. It does not construct a second session state, timer or modal.

`budget/training-overview-mode.js` only owns overview presentation state (`observatory` / `compact`). It does not reference `sessionState`, `#session-modal` or the session start implementation. Because the selected overview remains mounted beneath the modal, closing or saving a session returns to the same overview mode without a separate restore path.

### Preview-only session skins

The legacy comparison presentation remains isolated in preview/reference pages:

- `budget/pulse-environment/training.js`
- `budget/pulse-environment/training.css`
- `budget/pulse-observatory/training.css`

`pulse-environment/training.js` explicitly identifies itself as shared preview presentation and requires `.training-design-bar`. The production `budget/exercise.html` does not load those assets and contains no `training-design-bar` / `data-training-design` controls.

These preview assets are intentionally not deleted in Checkpoint 3 because later migration checkpoints still use the preview pages as visual/reference sources. Their eventual retirement belongs to Checkpoint 9.

## Preserved production behavior

Checkpoint 3 deliberately keeps the existing session dependency chain unchanged. In particular:

- `exercise-timer-focus.js` remains the approved compact/focus cardio timer owner.
- `exercise-session-runtime-core-v21.js` remains the current session core.
- `exercise-between-routing-v7.js`, `exercise-between-custom-exercise-v3.js` and `exercise-between-sets.js` remain the current between-exercise/rest flow.
- `exercise-session-ux-v20.js` remains in the session UX/audio chain.
- `exercise-hype-timer-layout-v1.js`, `exercise-session-stability-v55.js` and `exercise-custom-transition-atomic-v56.js` remain loaded.
- `exercise-pulse-flow-v58.js`, `exercise-pulse-flow-motion-v67.js` and `exercise-session-typography.js` remain the current Pulse Flow presentation/typography owners.
- `exercise-session-transition-stability-v142.js` and `exercise-session-persistence-v143.js` remain nested behind `exercise-pulse-flow-canvas-glow-v131.js`.

Therefore rest timing, cardio timing/focus, pre-session/session transitions, custom-between-exercise behavior, sounds, typography and persistence keep the same production owners in this checkpoint.

## Verification contract

`budget/tests/training-shared-session.test.cjs` prevents the migration from silently reintroducing a second production session implementation. It checks:

1. production has exactly one session modal, one `sessionState`, and one canonical start implementation;
2. Compact and Observatory both delegate to that start implementation;
3. the overview-mode controller has no live-session ownership;
4. the current timer/transition/persistence/typography dependency chain remains present;
5. preview comparison controls/assets are absent from the production route;
6. the touched JavaScript/inline production runtime parses cleanly.

Run with:

```bash
node --test budget/tests/training-shared-session.test.cjs
```

## Checkpoint 3 result

The architecture already established during Checkpoints 1–2 satisfies the single-runtime requirement. Checkpoint 3 therefore formalizes and tests that invariant instead of adding another session adapter or visual override.

Exit condition: **satisfied once the contract test passes on the committed production tree.**
