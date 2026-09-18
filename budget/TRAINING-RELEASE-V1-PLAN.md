# Training Release V1.0 — consolidation plan

Original audited production baseline: **41 local exercise feature scripts**.

V1.0 target: **12 production feature owners**.

The 41-script number is the pre-Observatory migration audit baseline. The Observatory/wellness migration later introduced four migration-specific behavior owners that were not represented in the original 41 → 12 table:

- `training-overview-mode.js`
- `pulse-environment/environment.js`
- `training-week-orbit.js`
- `training-zen-nav.js`

Checkpoint 10 updates the ownership map instead of allowing those files to become permanent extra owners. Compact/Observatory switching, Observatory dashboard presentation/state and weekly-orbit behavior now have one canonical JavaScript owner: **`exercise-dashboard.js`**. The first three historical paths above are temporary loader shims only until the final V1 loader cutover. `training-zen-nav.js` is mapped into the final `exercise-motion.js` responsibility together with shared wellness navigation/lifecycle; it is not a thirteenth V1 owner.

The final target therefore remains **12 owners**. Do not use the old “29 fewer requests” number as a current network measurement: during the migration, compatibility loader paths still create requests even though they no longer own behavior. Checkpoint 11 must perform a fresh request/load audit after the final loader cutover.

The repository history and checkpoint branches are the rollback/archive. Old versioned patch files should not remain in production merely because they once fixed a regression. For every consolidation batch: migrate surviving behavior, run the regression matrix, commit a checkpoint, then remove superseded production files or loader paths once their replacement is verified.

---

## Target V1.0 owners (12)

1. `exercise-dashboard.js`
2. `exercise-builder.js`
3. `exercise-training-log.js`
4. `exercise-session-core.js`
5. `exercise-session-transitions.js`
6. `exercise-session-presentation.js`
7. `exercise-session-ux.js`
8. `exercise-motion.js`
9. `exercise-pulse-flow.js`
10. `exercise-timer-focus.js`
11. `exercise-session-persistence.js`
12. `exercise-reload-recovery.js`

`auth-config.js`, `auth-gate.js`, generic Firebase/auth/storage code and Chart.js are boot/platform dependencies rather than feature owners.

---

## 1. Dashboard owner — current canonical owner established in Observatory CP10

Target and current migration owner: `exercise-dashboard.js`

### Original audit sources to consolidate

- `exercise-points-8-9.js` — dashboard sync plus scheduler/performance guard behavior.
- `exercise-heart-rate-range.js` — HR fields/range chart; recurring polling must become event-driven.
- `exercise-points-3-6-7.js` — dashboard labels/metrics; remove maintenance polling.
- `exercise-shell-v13.js` — dashboard DOM arrangement; stable markup ultimately belongs in `exercise.html`.
- `exercise-progress-consistency-v10.js` — dashboard/progress consistency.
- `exercise-hr-first-paint-v14.js` — old first-paint compatibility layer; remove after physical-device cold/warm-load verification.

### Observatory migration ownership folded into this owner in CP10

- `training-overview-mode.js` — Compact/Observatory selection, visibility and morph behavior.
- `pulse-environment/environment.js` — Observatory presentation adapter, semantic state mapping, Next Workout context and chart presentation.
- `training-week-orbit.js` — linear ↔ Observatory orbit geometry and its single temporary animation-frame owner.

The three migration paths above now contain only compatibility loading logic for `exercise-dashboard.js`; they must disappear from the production loader during the final V1 cutover. Their behavior must not be copied back into separate modules.

### Dashboard invariants

- one dashboard DOM/data source for Compact and Observatory;
- Observatory is presentation, not a second workout store/runtime;
- one weekly plan, with linear and orbit geometries over the same seven day nodes;
- no dashboard-owned `sessionState` or second workout-start implementation;
- Next Workout delegates to the canonical `startWorkoutSessionForDate(...)` entry point;
- semantic Observatory state remains presentation-only;
- polling introduced by historical dashboard fixes is removed where event-driven updates are available.

---

## 2. Builder owner — 3 current files -> 1 owner

Target: `exercise-builder.js`

Merge:
- `exercise-builder-row-tools-v3.js`
- `exercise-builder-style-v5.js`
- `exercise-builder-between-preview-v7.js`

Also migrate builder-specific pre-timer configuration currently living in `exercise-flow-polish-v2.js`.

The 250 ms unit-label poll in `builder-style-v5` should become event-driven and run only while the builder is open.

---

## 3. Training-log owner — 4 current files -> 1 owner

Target: `exercise-training-log.js`

Merge:
- `exercise-log-mobile-fix-v5.js`
- `exercise-log-layout-v50.js`
- `exercise-log-pr-v52.js`
- `exercise-log-pr-theme-v53.js`

Also migrate log-action accessibility/add-exercise code currently mixed into `exercise-session-stability-v55.js`.

These responsibilities are currently split between the main manifest and a nested loader in `exercise-reload-recovery.js`; V1 should have one log owner and no hidden nested log loader.

---

## 4. Session core — one explicit state/runtime owner

Target: `exercise-session-core.js`

Primary source:
- `exercise-session-runtime-core-v21.js`

Migrate only true state/runtime pieces from:
- `exercise-session-stability-v55.js`

Do not move presentation CSS into the core. The Observatory migration does not introduce a second live-session owner; Compact and Observatory both continue to enter this same canonical session runtime.

---

## 5. Session transitions — 6 mixed current sources -> 1 owner

Target: `exercise-session-transitions.js`

Merge:
- `exercise-between-routing-v7.js`
- `exercise-between-custom-exercise-v3.js`
- `exercise-between-sets.js`
- transition/pre-timer routing parts of `exercise-flow-polish-v2.js`
- `exercise-custom-transition-atomic-v56.js`
- `exercise-session-transition-stability-v142.js`

Preserve:
- ordinary configured rest starts automatically;
- custom between exercises stay manual;
- no duplicate transition owners;
- rest countdown has one clock owner;
- transition config comes from one normalizer/router;
- custom-between archive/save behavior remains intact.

Replace the archive-row polling in `exercise-between-routing-v7.js` with rendering driven by state/log changes.

---

## 6. Session presentation — 8 current files + fragments -> 1 owner

Target: `exercise-session-presentation.js`

Merge:
- `exercise-session-enhancements.js`
- `exercise-session-theme-stability.js`
- `exercise-session-stable-details.js`
- `exercise-hype-polish.js`
- `exercise-session-set-cards-v6.js`
- `exercise-session-shell-v19.js`
- `exercise-hype-timer-layout-v1.js`
- `exercise-session-typography.js`

Also migrate presentation-only CSS/DOM corrections from:
- `exercise-session-stability-v55.js`
- `exercise-flow-polish-v2.js`

The current session has several historical files overriding the same cards, CTA states, timer colours and layout. V1 must have one final session presentation owner rather than a compatibility cascade.

---

## 7. Session UX — one explicit UX/audio owner

Target: `exercise-session-ux.js`

Primary source:
- `exercise-session-ux-v20.js`

Keep audio unlock/beeps, pre-timer/rest UX and user-facing session interactions here. Dashboard styling belongs to `exercise-dashboard.js`; transition routing belongs to `exercise-session-transitions.js`; visual session state belongs to `exercise-session-presentation.js`.

---

## 8. Motion + shared wellness navigation — one owner

Target: `exercise-motion.js`

Current sources:
- `exercise-motion-v1.js` — general morph/fallback behavior for session, builder, log, nav and modal surfaces.
- `training-zen-nav.js` — shared in-page Training / Stretch / Meditation shell, lazy Zen mounting, active-session guards and browser-history policy.

Checkpoint 10 also restores **one shared hamburger menu** through the persistent training/wellness header. The menu is owned by `exercise-motion-v1.js` during migration and is the same control in Training, Stretch and Meditation. It must not create one menu per surface, and retired Reactor/standalone Observatory routes must not return to normal navigation.

V1 action: consolidate the app-level navigation/motion lifecycle into `exercise-motion.js` without duplicating Zen's own domain/session runtime. Pulse-specific ECG/canvas animation remains in `exercise-pulse-flow.js`.

---

## 9. Pulse Flow visual/runtime owner — 7 current files -> 1 owner

Target: `exercise-pulse-flow.js`

Merge:
- `exercise-pulse-flow-v58.js`
- `exercise-pulse-flow-motion-v67.js`
- `exercise-pulse-flow-progress-marker-v92.js`
- `exercise-pulse-flow-completed-marker-v102.js`
- `exercise-pulse-flow-ecg-glow-v104.js`
- `exercise-pulse-flow-canvas-glow-v130.js`
- `exercise-pulse-flow-canvas-glow-v131.js`

`v131` must disappear as an owner: fold its surviving compact canvas layering into the final canvas/pulse owner and move the `v142` transition plus `v143` persistence loads to their real owners. Historical style-removal lists can then be deleted because obsolete style elements will no longer be loaded.

---

## 10. Cardio focus timer — keep standalone for V1

Keep:
- `exercise-timer-focus.js`

This interaction was stabilised through extensive iPhone/Safari work. Do not merge it solely to reduce one request before V1.0.

---

## 11. Persistence — standalone data-safety owner

Target: `exercise-session-persistence.js`

Primary source:
- `exercise-session-persistence-v143.js`

Protect planned-session snapshots/recovery and Firebase-related persistence. Replace temporary wrapper-retry polling with an explicit boot dependency/event where practical, but do not merge persistence into presentation/runtime merely for file-count reduction.

---

## 12. Reload recovery — standalone recovery owner

Keep/rename cleanly:
- `exercise-reload-recovery.js`

Remove its responsibility for dynamically loading training-log layers; `exercise-training-log.js` owns those. Keep stale-session/reload cleanup and emergency recovery only.

---

## Mixed historical files that must disappear

### `exercise-session-stability-v55.js`

It currently mixes suppression of older observers, pre-timer state, session corrections, training-log actions, HR chart correction and Pulse timer/presentation overrides.

V1 action: split surviving code into `session-core`, `session-presentation`, `training-log` and `dashboard`, then delete the file.

### `exercise-flow-polish-v2.js`

It currently mixes pre-timer preference persistence, builder controls, transition/session decision styling, old active/rest palette rules and compatibility behavior around between-set flow.

V1 action: move configuration to builder/core, routing to transitions and surviving CSS to session presentation, then delete the file.

---

## CP10 architecture state

Checkpoint 10 is an ownership consolidation checkpoint, not yet the final 12-request loader cutover.

Current intended topology after CP10:

- `exercise-dashboard.js` is the **single behavior owner** for Compact/Observatory mode, Observatory overview adaptation and weekly orbit.
- `training-overview-mode.js`, `pulse-environment/environment.js` and `training-week-orbit.js` are temporary compatibility loaders only because the existing page shell still references those historical paths.
- `pulse-environment/environment.css`, `pulse-observatory/observatory.css` and `training-week-orbit.css` remain presentation assets until CSS ownership is consolidated in the final V1 batches.
- `training-zen-nav.js` still owns the in-page wellness shell during migration, but its final V1 mapping is `exercise-motion.js`.
- `exercise-motion-v1.js` owns the single shared hamburger/menu during migration; no second Training menu and no per-Zen duplicate menu exist.
- one canonical live workout/session runtime remains shared by Compact and Observatory.
- Git checkpoint branches, not duplicate runtime files, are the rollback mechanism.

The temporary compatibility loader requests should be removed only when `exercise.html`/boot manifests can point directly at the clean V1 owners and the complete regression matrix has passed.

---

## Recommended consolidation order after Observatory CP10

1. **Pulse Flow visual merge**: 7 -> 1.
2. **Training log merge**: 4 -> 1 and remove the hidden nested loader.
3. **Builder merge**: 3 -> 1 and remove the 250 ms label poll.
4. **Session presentation merge**: 8 -> 1.
5. **Session transition merge**: mixed 6 -> 1; highest behavioral risk.
6. **Original dashboard cleanup**: fold the remaining six legacy dashboard sources into the already-established `exercise-dashboard.js`, then remove the three CP10 compatibility loader paths from the HTML/manifest.
7. **Motion/wellness cleanup**: fold `training-zen-nav.js` plus `exercise-motion-v1.js` into clean `exercise-motion.js` while retaining one persistent hamburger and the three-state wellness selector.
8. Narrow `session-ux`, `session-core`, recovery and persistence to their final responsibilities.
9. Run the full Checkpoint 11 device/regression/request matrix and mark the resulting commit as the Release V1.0 checkpoint.

---

## Release rule

Do not keep `v13`, `v19`, `v20`, `v21`, `v55`, `v58`, `v67`, `v92`, `v102`, `v104`, `v130`, `v131`, `v142`, `v143`, or migration compatibility filenames in the final production loader after their behavior has been consolidated. Git history/checkpoint branches are the archive. Production filenames should describe current ownership, not implementation history.

The final script/request reduction number must be measured from the actual release-candidate loader during Checkpoint 11 rather than inferred from the original 41-script audit.

---

## Observatory migration CP11 release-candidate baseline — 2026-09-18

The Observatory migration release-candidate gate is complete in automated WebKit. This is the **pre-V1-consolidation** baseline, not a claim that the 12-owner V1 loader cutover has already happened.

Current architecture at the CP11 gate:

- `budget/exercise.html` is the single production Training route.
- Compact and Observatory share one dashboard/session data model.
- `exercise-dashboard.js` is the canonical Observatory/Compact + weekly-orbit JavaScript owner; the three historical migration paths remain loader shims until the V1 loader cutover.
- Training / Stretch / Meditation share one in-page wellness shell and one header/navigation surface.
- one canonical live session runtime is used from both Compact and Observatory.
- `exercise-timer-focus.js` is event-driven while idle; its animation frame is used only for short-lived gesture settling.
- historical standalone Reactor/Observatory applications are Git/checkpoint history plus redirect aliases, not competing runtimes.

CP11 WebKit regression result:

- **91 passed, 0 failed** in the combined Training/Zen static suite.
- iPhone-like WebKit exercised cold/warm Observatory load, repeated Compact/Observatory switching, weekly orbit, builder save, planned-session fresh-load persistence, Strength and Cardio session entry, active-session navigation guard, cardio pause/resume, repeated timer swipe expand/collapse, 5-second pre-timer, automatic rest, workout save, wellness history, Markus/Maja query preservation, reduced motion and target widths.
- no page-level horizontal overflow at 320, 375/390, 768 or 1440 px, including mobile landscape session and Stretch/Meditation at 390 px.
- no new browser console/page errors in the passing gate.

Measured CI/WebKit loader-v2 baseline from the passing CP11 run:

- ordered manifest entries: **27**
- observed unique local JavaScript requests after exercising Training + Zen: **64**
- measured manifest preload → bundle-ready time in that run: **244 ms**

The 64-request figure intentionally includes compatibility files plus Zen assets loaded during the full route exercise. It is a measurement baseline, **not the V1 target**. Repeat this audit after the final 12-owner loader cutover and compare against these numbers rather than using the old estimated request reduction.

Remaining manual release gate: physical iPhone Safari/PWA validation. Automated WebKit is not recorded as a substitute for a real-device PWA run.
