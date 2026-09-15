# Training page cleanup checklist

Baseline before cleanup: `50292b3ce6d886c018c9c61cacea1933b854a4ee`

Goal: keep the current Pulse/Observatory-derived training experience and all working session behavior, while removing the legacy-first render, redundant loaders, duplicate render ownership and unnecessary runtime work.

## Checkpoint 1 — First paint / no legacy flash

- [x] Hide the legacy `exercise.html` dashboard before its first visible paint.
- [x] Show a lightweight Pulse-style boot surface instead of the old dashboard while exercise assets settle.
- [x] Reveal only after both DOM setup and the normal exercise bundle are ready.
- [x] Keep a failsafe reveal so a failed optional asset can never leave the page permanently hidden.
- [x] Keep the existing dashboard/session behavior unchanged; this checkpoint changes boot visibility only.
- [ ] Verify cold load on iPhone Safari/PWA: no old training layout flashes.
- [ ] Verify normal reload on iPhone Safari/PWA.
- [ ] Verify desktop reload.
- [ ] Verify starting a planned workout after load.
- [ ] Verify returning from a completed workout to the dashboard.

## Checkpoint 2 — Loader inventory and ownership

- [ ] Record every exercise-specific script loaded by `exercise.html`, `auth-config.js`, `auth-gate.js`, and nested loaders.
- [ ] Mark each asset as `required`, `superseded`, `duplicate responsibility`, or `load only on demand`.
- [ ] Identify scripts loaded directly and indirectly through another script.
- [ ] Identify preloads that duplicate a subsequent sequential load without improving first paint.
- [ ] Identify session-only assets that can be deferred until a workout starts.
- [ ] Replace the current long sequential loader with explicit dependency groups where safe.
- [ ] Measure request count before/after.

## Checkpoint 3 — Re-render / observer / timer cleanup

- [ ] Inventory all `setInterval` and recurring `setTimeout` loops on the exercise page.
- [ ] Inventory `MutationObserver`, `ResizeObserver`, `scroll`, `resize`, `pageshow`, and `visibilitychange` listeners.
- [ ] Find multiple owners that render or restyle the same dashboard/session surface.
- [ ] Remove obsolete pollers that are currently only being suppressed by the performance guard.
- [ ] Consolidate duplicate DOM rearrangement routines.
- [ ] Ensure charts are rendered once per actual data/layout change rather than by overlapping refresh paths.
- [ ] Verify no background dashboard work continues while the full-screen session is open unless required.

## Checkpoint 4 — Make the current Pulse dashboard the base

- [ ] Identify which legacy HTML/CSS in `exercise.html` is immediately replaced or hidden after boot.
- [ ] Move stable current layout decisions into the base markup/CSS instead of post-load DOM surgery.
- [ ] Remove legacy cards/controls that are created only to be hidden or moved later.
- [ ] Move the final Pulse dashboard theme out of late runtime style injection where practical.
- [ ] Keep responsive mobile and desktop layouts identical to the approved current appearance.
- [ ] Remove old first-paint compatibility code once the base markup already matches the final layout.

## Checkpoint 5 — Session/training-mode consolidation

- [ ] Keep the current working cardio compact/focus timer behavior as the reference implementation.
- [ ] Keep rest timer, pre-timer, sounds, custom between-exercise flow and persistence behavior unchanged.
- [ ] Consolidate overlapping session presentation layers after proving which rules are still active.
- [ ] Remove superseded versioned presentation files only after their surviving rules have been migrated.
- [ ] Ensure one owner for typography, timer presentation, transition routing and persistence respectively.

## Checkpoint 6 — Regression validation

- [ ] Strength workout: start, pre-timer, sets, automatic rest, extra set, finish exercise, finish workout.
- [ ] Cardio workout: compact timer, pause/resume, swipe expand/collapse repeatedly, overtime, finish.
- [ ] Mixed workout: strength → cardio → strength.
- [ ] Custom between exercises remain manual; ordinary rest remains automatic.
- [ ] Planned-session metadata survives completion/reload/Firebase sync.
- [ ] Workout builder and editing still work on mobile and desktop.
- [ ] Weekly plan, goals, charts and training log still render correctly.
- [ ] No old dashboard flash on cold cache or warm cache.
- [ ] No console errors during load or session.
- [ ] Compare load time, script count and long tasks against the pre-cleanup baseline.

## Cleanup rule

For every checkpoint: remove superseded code in the same checkpoint once the replacement has been verified. Do not leave temporary patch/workflow files, duplicate loaders or fallback implementations behind unless they are explicitly documented as still required.
