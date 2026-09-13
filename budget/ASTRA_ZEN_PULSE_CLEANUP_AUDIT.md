# Zen and Pulse cleanup audit

This commit implements the cleanup described in `ASTRA_ZEN_PULSE_CLEANUP_PLAN.md`. It keeps the regular training page runtime and data model intact. The cleanup targets `zen.html`, the isolated `zen-preview` shell, Pulse Observatory, and Pulse Reactor.

## Ownership after cleanup

| Surface | Owner | Notes |
|---|---|---|
| Zen routine selection, builder, timer, completion and persistence | `zen.js`, `zen-model.js`, `zen-store.js` | IDs, storage keys, Firebase paths and session semantics are unchanged. Cards open the existing builder directly. |
| Zen animation scheduling | `zen-scene-runtime.js` | One visibility/reduced-motion aware clock drives the Stretch forest, foreground effects and Meditation scene. Canvases remain separate compositing layers. |
| Stretch scene | `zen-scene-v3.js`, `zen-classic-tree-v22.js` | The hidden replacement tree renderer and its canvas are gone. |
| Meditation scene and waterfall | `zen-meditation-scene-v34.js`, `zen-waterfall-v47.js` | Cliff detail is drawn by the pond owner; the old monkey-patch installer and garden renderer are gone. |
| Zen home cascade | `zen.css` | Historical home/mode rules are in one ordered stylesheet. `zen-session-oasis-v54.css` remains separate because it owns the timed-session presentation. |
| Pulse page shell | `pulse-environment/dashboard.css`, `dashboard.js` | Identical Observatory/Reactor shell and dashboard runtime are loaded once per page. Their environment styles remain page-specific. |
| Pulse heart-rate chart | `pulse-environment/exercise-heart-rate-range.js` | The environment pages have a local owner; the regular training page's chart files were not changed. |
| Pulse PR and log | `dashboard.js` plus the existing log/records modules | PR rendering remains the dashboard function; the strength records module updates its own existing surface. Modal, edit, delete and sync paths stay intact. |
| Zen preview | `zen-preview/auth-gate.js` and intentionally differing local files | Identical leaf copies now resolve to root assets where safe. Preview-specific session/calm assets remain local. |

## Removed files

These files had no remaining HTML or dynamic runtime consumer after the active owners were checked:

### Zen scene/style history

- `budget/zen-classic-tree-v22.css`
- `budget/zen-cliff-detail-v39.js`
- `budget/zen-cliff-detail-v46.js`
- `budget/zen-depth-spacing-v17.css`
- `budget/zen-effects-v4.css`
- `budget/zen-interactions-v31.js`
- `budget/zen-interactive-rings-v31.css`
- `budget/zen-layout-polish-v13.css`
- `budget/zen-meditation-depth-ring-v32.css`
- `budget/zen-meditation-finish-v36.css`
- `budget/zen-meditation-polish-v28.css`
- `budget/zen-meditation-refine-v30.css`
- `budget/zen-meditation-rock-v24.css`
- `budget/zen-meditation-rockfall-v33.css`
- `budget/zen-meditation-scene-v30.js`
- `budget/zen-polish-v15.css`
- `budget/zen-polish-v26.css`
- `budget/zen-refine-v16.css`
- `budget/zen-scene-meditation-v8-clean.js`
- `budget/zen-scene-meditation-v8.css`
- `budget/zen-scene-v3.css`
- `budget/zen-scene-v4.js`
- `budget/zen-scene.js`
- `budget/zen-stretch-depth-v17.js`
- `budget/zen-stretch-depth-v18.js`
- `budget/zen-stretch-light-fade-v23.css`
- `budget/zen-stretch-polish-v18.css`
- `budget/zen-stretch-polish-v29.css`
- `budget/zen-sun-depth-v12.css`
- `budget/zen-symbol-balance-v14.css`
- `budget/zen-waterfall-depth-v32.js`
- `budget/zen-waterfall-mouth-v16.js`
- `budget/zen-waterfall-v12.js`
- `budget/zen-waterfall-v13.js`
- `budget/zen-waterfall-v24b.js`
- `budget/zen-waterfall-v25.css`
- `budget/zen-waterfall-v25.js`
- `budget/zen-waterfall-v26c.js`
- `budget/zen-waterfall-v28.js`
- `budget/zen-waterfall-v30.js`
- `budget/zen-waterfall-v33.js`
- `budget/zen-waterfall-v34.js`
- `budget/zen-waterfall-v46.js`
- `budget/zen-waterfall-v9.js`

### Identical Zen-preview copies

- `budget/zen-preview/exercise-between-routing-v7.js`
- `budget/zen-preview/exercise-between-sets.js`
- `budget/zen-preview/exercise-builder-row-tools-v3.js`
- `budget/zen-preview/exercise-builder-style-v5.js`
- `budget/zen-preview/exercise-custom-transition-atomic-v56.js`
- `budget/zen-preview/exercise-flow-polish-v2.js`
- `budget/zen-preview/exercise-hr-first-paint-v14.js`
- `budget/zen-preview/exercise-hype-polish.js`
- `budget/zen-preview/exercise-log-mobile-fix-v5.js`
- `budget/zen-preview/exercise-motion-v1.js`
- `budget/zen-preview/exercise-points-3-6-7.js`
- `budget/zen-preview/exercise-pulse-flow-canvas-glow-v130.js`
- `budget/zen-preview/exercise-pulse-flow-completed-marker-v102.js`
- `budget/zen-preview/exercise-pulse-flow-smooth-glow-v129.js`
- `budget/zen-preview/exercise-reload-recovery.js`
- `budget/zen-preview/exercise-session-set-cards-v6.js`
- `budget/zen-preview/exercise-session-shell-v19.js`
- `budget/zen-preview/exercise-session-stability-v55.js`
- `budget/zen-preview/exercise-session-theme-stability.js`
- `budget/zen-preview/exercise-shell-v13.js`
- `budget/zen-preview/nav-menu-motion.js`

The preview's dependency loaders were rewritten to root-relative paths for these shared leaves. Root copies remain because the regular training page still uses them. Historical handoff markdown may mention deleted versioned filenames; those are documentation records and are not runtime references.

## Size and loader evidence

| Area | Before | After | Change |
|---|---:|---:|---:|
| Zen loaded home/style sheets | 96,007 bytes across 23 sheets | 69,423 bytes in `zen.css` | −26,584 bytes |
| Pulse Reactor HTML shell | 151,021 bytes | 27,181 bytes | −123,840 bytes |
| Pulse Observatory HTML shell | 152,167 bytes | 28,277 bytes | −123,890 bytes |
| Deleted identical preview copies | — | 227,035 bytes removed | — |
| Dynamic page script inventory | 55 before cleanup | 41 after cleanup | −14 scripts |

The Pulse HTML reduction is the result of moving the byte-identical inline dashboard style/runtime into the shared `pulse-environment` files; behavior remains page-local through existing DOM guards.

## Verification

- `node --test budget/tests/zen.test.cjs budget/tests/zen-session-oasis.test.cjs`: **20/20 passed**.
- `node --check` passed for all active Zen and Pulse modules, including the shared dashboard, records, recovery and local chart owner.
- Deterministic reduced-motion Zen smoke test passed at 320, 390, 768 and 1440 px. Stretch and Meditation computed styles matched the baseline; routine cards opened the existing builder; pause/resume/session completion paths remained available.
- Pulse smoke tests passed for Observatory and Reactor at 320, 375, 390, 768 and 1440 px. No page errors or missing assets; charts remained data-equivalent; builder, log editor, session start and storage-preservation checks passed.
- Pulse PR modal was retained in the dashboard markup and its original `openPRModal`, `openEditPR`, `savePR` and `deletePR` callbacks remain available.
- `git diff --check` passed.
- Regular `budget/exercise.html` and its runtime/data modules have no diff in this cleanup. The only shared auth change adds an explicit nested-shell boundary so Pulse/preview pages do not bootstrap the regular chart loader.

## Rollback checkpoints

- `checkpoint/zen-before-cleanup` → `58d6769ac265e110776c5323c4072ac5457d1a54`
- `checkpoint/zen-js-scenes-consolidated` → `6157b9b4a6229ce6955c534604eece220d539510`

The cleanup is ready for the final commit after the complete regression run; the published commit and its rollback branch are recorded in the delivery message.
