# Training Release V1.0 — consolidation plan

Current audited production load: **41 local exercise feature scripts**.

V1.0 target: **12 production feature owners**.

Net target: **29 fewer script owners/requests** on a normal full load.

The repository history is the rollback/archive. Old versioned patch files should not remain in production just because they once fixed a regression. For every consolidation batch: migrate surviving behavior, run the regression matrix, commit a checkpoint, then remove the superseded files from `main`.

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

`auth-config.js`, `auth-gate.js`, generic Firebase/auth/storage code and Chart.js are boot/platform dependencies and are not counted in the 41 feature-script number.

---

## Exact mapping from the current 41 scripts

### 1. Dashboard owner — 6 current files -> 1 owner

Target: `exercise-dashboard.js`

Migrate/integrate:
- `exercise-points-8-9.js` — dashboard sync + current scheduler/performance guard behavior.
- `exercise-heart-rate-range.js` — HR fields/range chart; replace recurring 300/700 ms polling with event-driven updates in Checkpoint 3.
- `exercise-points-3-6-7.js` — dashboard labels/metrics; replace 1500 ms maintenance polling.
- `exercise-shell-v13.js` — current dashboard DOM arrangement; ultimately move stable markup into `exercise.html` in Checkpoint 4.
- `exercise-progress-consistency-v10.js` — dashboard/progress consistency.

Remove without carrying forward as a standalone feature:
- `exercise-hr-first-paint-v14.js` — old chart first-paint compatibility layer. The new first-paint gate supersedes its page-boot responsibility; remove after iPhone cold/warm-load verification.

Result: 6 -> 1, **5 fewer scripts**.

### 2. Builder owner — 3 current files -> 1 owner

Target: `exercise-builder.js`

Merge:
- `exercise-builder-row-tools-v3.js`
- `exercise-builder-style-v5.js`
- `exercise-builder-between-preview-v7.js`

Also migrate the builder-specific pre-timer configuration currently living in `exercise-flow-polish-v2.js`.

The 250 ms unit-label poll in `builder-style-v5` should become event-driven and run only while the builder is open.

Result: 3 -> 1, **2 fewer scripts**.

### 3. Training-log owner — 4 current files -> 1 owner

Target: `exercise-training-log.js`

Merge:
- `exercise-log-mobile-fix-v5.js`
- `exercise-log-layout-v50.js`
- `exercise-log-pr-v52.js`
- `exercise-log-pr-theme-v53.js`

Also migrate the log-action accessibility/add-exercise code currently mixed into `exercise-session-stability-v55.js`.

These files are currently split between the main manifest and the nested loader in `exercise-reload-recovery.js`; V1 should have one log owner and no hidden nested log loader.

Result: 4 -> 1, **3 fewer scripts**.

### 4. Session core — current runtime core remains the basis of 1 owner

Target: `exercise-session-core.js`

Primary source:
- `exercise-session-runtime-core-v21.js`

Migrate only true state/runtime pieces from:
- `exercise-session-stability-v55.js`

Do not move presentation CSS into the core.

Result: the current core plus scattered stability logic becomes one explicit state owner.

### 5. Session transitions — 6 current files / mixed responsibilities -> 1 owner

Target: `exercise-session-transitions.js`

Merge:
- `exercise-between-routing-v7.js`
- `exercise-between-custom-exercise-v3.js`
- `exercise-between-sets.js`
- transition/pre-timer routing parts of `exercise-flow-polish-v2.js`
- `exercise-custom-transition-atomic-v56.js`
- `exercise-session-transition-stability-v142.js`

Important V1 behavior to preserve:
- ordinary configured rest starts automatically;
- custom between exercises stay manual;
- no duplicate transition owners;
- rest countdown has one clock owner;
- transition config comes from one normalizer/router;
- custom-between archive/save behavior remains intact.

Current `exercise-between-routing-v7.js` polls archive rows every 220 ms; V1 should render them when state/log data changes instead.

Result: 6 -> 1, **5 fewer scripts** once `flow-polish-v2` is fully split/migrated.

### 6. Session presentation — 8 current files + presentation fragments -> 1 owner

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

This is one of the largest cleanup wins. Today several of these files override the same session cards, CTA states, timer colours and layout. V1 should have one final presentation stylesheet/owner instead of a cascade of compatibility overrides.

Result: 8 -> 1, **7 fewer scripts**.

### 7. Session UX — keep one explicit UX/audio owner

Target: `exercise-session-ux.js`

Primary source:
- `exercise-session-ux-v20.js`

Keep audio unlock/beeps, pre-timer/rest UX and user-facing session interactions here. Remove dashboard styling and transition ownership from this module when migrating; those belong to dashboard/presentation/transitions respectively.

Result: still 1 owner, but much narrower responsibility.

### 8. Motion — keep one motion owner

Target: `exercise-motion.js`

Primary source:
- `exercise-motion-v1.js` (internally already identifies itself as Motion V2)

Keep general view-transition/fallback motion for session, builder, log, nav and modal surfaces here. Pulse-specific animation stays in `exercise-pulse-flow.js`.

Result: still 1 owner, renamed without historical version suffix.

### 9. Pulse Flow visual/runtime owner — 7 current files -> 1 owner

Target: `exercise-pulse-flow.js`

Merge:
- `exercise-pulse-flow-v58.js`
- `exercise-pulse-flow-motion-v67.js` (internally contains later v80/v85-era behavior and the current Pulse dashboard/session/timer presentation)
- `exercise-pulse-flow-progress-marker-v92.js` (internally final v98+ marker authority)
- `exercise-pulse-flow-completed-marker-v102.js` (small completed-marker override; fold directly into progress marker rules)
- `exercise-pulse-flow-ecg-glow-v104.js` (internally contains later v128 behavior; merge final surviving ECG rules only)
- `exercise-pulse-flow-canvas-glow-v130.js` (internally current v140 canvas renderer)
- `exercise-pulse-flow-canvas-glow-v131.js`

`v131` should disappear completely as an owner: it only adds the final compact canvas layering CSS and dynamically loads `v142`/`v143`. Move its small layering rules into the canvas renderer and load transitions/persistence from their real owners.

During merge, delete the long lists that remove obsolete v104-v127/v130-v132 style IDs. Those historical style elements cannot exist once V1 loads only one Pulse owner.

Result: 7 -> 1, **6 fewer scripts**.

### 10. Cardio focus timer — keep standalone for V1

Keep:
- `exercise-timer-focus.js`

Reason: this interaction was recently stabilised through extensive iPhone/Safari testing. Do not merge it just to reduce one request before V1.0. It can be revisited after release.

Result: 1 -> 1.

### 11. Persistence — keep standalone, rename cleanly

Target: `exercise-session-persistence.js`

Primary source:
- `exercise-session-persistence-v143.js`

This protects planned-session snapshots/recovery and Firebase-related persistence. Data safety is a good reason for a separate owner. During cleanup, replace its temporary wrapper-retry polling with an explicit boot dependency/event if possible, but do not merge persistence into presentation/runtime purely for file-count reduction.

Result: 1 -> 1.

### 12. Reload recovery — keep standalone for V1

Keep:
- `exercise-reload-recovery.js`

Remove its responsibility for dynamically loading the log layers; `exercise-training-log.js` should own that. Keep only stale-session/reload cleanup and emergency recovery.

Result: 1 -> 1.

---

## What happens to `exercise-session-stability-v55.js` and `exercise-flow-polish-v2.js`?

These two are the clearest examples of files that should **not** survive as V1 owners.

### `exercise-session-stability-v55.js`

It currently mixes:
- suppression of an older MutationObserver layer;
- pre-timer toggle state;
- session control corrections;
- training-log actions;
- heart-rate chart colour correction;
- Pulse timer/presentation overrides.

V1 action: split its surviving code into `session-core`, `session-presentation`, `training-log` and `dashboard`, then delete the file.

### `exercise-flow-polish-v2.js`

It currently mixes:
- pre-timer preference persistence;
- builder controls;
- transition/session decision styling;
- old active/rest palette rules;
- compatibility behavior around between-set flow.

V1 action: move configuration to builder/core, routing to transitions and surviving CSS to session presentation, then delete the file.

---

## Counts

Current local exercise feature scripts: **41**.

V1.0 target owners: **12**.

Net reduction: **29 fewer runtime feature scripts**.

Current files that can disappear from the production runtime after their surviving code has been migrated: **38**. They are replaced by **9 consolidated clean owner files**, while these three current files can remain conceptually standalone for V1:

- `exercise-timer-focus.js`
- `exercise-reload-recovery.js`
- `exercise-session-persistence-v143.js` (renamed cleanly)

Of the 38 retiring versioned/patch files, only a small subset should be deleted without preserving behavior. Most are integration/migration candidates. The clearest near-direct removal is `exercise-hr-first-paint-v14.js` after device verification; `exercise-pulse-flow-canvas-glow-v131.js` also disappears once its tiny final layering CSS is folded into the canvas owner and its two nested loaders are moved to the manifest.

## Recommended consolidation order before Release V1.0

1. **Pulse Flow visual merge**: 7 -> 1. Mostly presentation code and easiest to verify visually.
2. **Training log merge**: 4 -> 1. Removes the hidden nested loader from reload recovery.
3. **Builder merge**: 3 -> 1 and remove the 250 ms label poll.
4. **Session presentation merge**: 8 -> 1. Highest CSS/override cleanup value.
5. **Session transition merge**: 6 -> 1. Highest behavioral risk; do only after the presentation cleanup is stable.
6. **Dashboard merge**: 6 -> 1, including removal of old HR first-paint compatibility.
7. Narrow `session-ux`, `session-core`, recovery and persistence to their final responsibilities.
8. Run the complete regression matrix and mark the resulting commit as the Release V1.0 checkpoint.

## Release rule

Do not keep `v13`, `v19`, `v20`, `v21`, `v55`, `v58`, `v67`, `v92`, `v102`, `v104`, `v130`, `v131`, `v142`, `v143`, etc. in production filenames after their behavior has been consolidated. The commit history is the archive. Production should describe current ownership, not implementation history.
