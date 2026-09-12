# Astra handoff: Zen and Pulse exercise-page cleanup

## Purpose

This is a cleanup plan, not an instruction to redesign the pages. The goal is to reduce dead code, duplicate rendering, and superseded patch layers while preserving the current behavior, data, visual smoothness, and mobile layout.

The plan covers the Zen page, the Zen preview shell, Pulse Observatory, and Pulse Reactor. It deliberately excludes the regular training page and its runtime. The only regular-page change that belongs to the navigation task is replacing its obsolete menu destinations with the two Pulse pages.

## Hard boundaries

- Do not change the regular training page (`budget/exercise.html`) runtime, session flow, training data model, charts, builder, or persistence as part of this cleanup.
- Do not change Zen routine/session semantics, storage keys, Firebase paths, profile scoping, or the meaning of completed sessions.
- Do not change Observatory/Reactor data mapping, PR calculations, training-log content, chart datasets, or interaction contracts.
- Preserve all existing IDs, `data-*` attributes, global callbacks, URL entry points, and accessibility labels until their consumers have been proven unused.
- Preserve reduced-motion behavior, visibility/pausing behavior, mobile Safari behavior, and first-paint/loading behavior.
- Do not delete a file because its filename contains a version number or because a later file looks newer. Prove ownership and references first.
- Keep one clear rendering owner for each visual surface. Do not add another override layer to hide an obsolete layer.

## Current entry points and ownership

| Entry point | Current visual/runtime assets | Responsibility that must remain |
| --- | --- | --- |
| `budget/zen.html` | `training-zen-nav.css/js`, the `zen*.css` scene layers, `zen-model.js`, `zen-store.js`, `zen.js`, scene/effect/interaction/session modules | Stretch/meditation switch, routine list/builder, timer, pause/resume, completion, persistence, settings/export/import, scene animation |
| `budget/zen-preview/exercise.html` | `exercise-calm-v1.css/js`, copied auth/runtime shell, `firebase-sync.js`, Chart.js, inline dashboard markup/runtime | Isolated preview shell only; compare it against the live Zen/Pulse entry points before removing copied assets |
| `budget/pulse-observatory/exercise.html` | Shared exercise shell, `pulse-environment/environment.css/js`, `pulse-observatory/observatory.css`, inline Observatory start screen, charts/log/PR handlers | Observatory start screen, week metrics, graphs, PR area, training log, modal/editor interactions, mobile layout |
| `budget/pulse-environment/exercise.html` | Shared exercise shell, `pulse-environment/environment.css/js`, inline Reactor dashboard, charts/log/PR handlers | Reactor page, graphs, PR area, training log, modal/editor interactions, mobile layout |

Shared infrastructure (`auth-config.js`, `auth-gate.js` copies, `firebase-sync.js`, `indexeddb-fallback.js`, `training-zen-nav.*`, `nav-menu-motion.js`) is only removable or deduplicable after checking every included entry point that loads it.

## Existing cleanup already completed in the navigation task

The obsolete `interval-track` and `uhd-athlete` destinations/loaders were removed. Their menu entries now point directly to:

- `budget/pulse-observatory/exercise.html` — Pulse Observatory
- `budget/pulse-environment/exercise.html` — Pulse Reactor

The old concept-loader files were deleted, and the old query-based boot path was removed from the exercise auth gates. Do not reintroduce query-based concept routing while doing the cleanup below.

## Audit procedure

### 1. Freeze and inventory

1. Create a checkpoint before each cleanup group: Zen, preview shell, shared Pulse shell, Reactor/Observatory inline runtime.
2. Record the commit SHA and run the source checks before editing.
3. Build an inventory from HTML `<script src>`, `<link href>`, dynamic `document.createElement('script')`, dynamic stylesheet injection, and imports/exports (if introduced later).
4. For every asset, record: who loads it, which selectors/functions it owns, what it mutates, and whether it is active in Stretch, Meditation, Observatory, Reactor, or only a preview.
5. Treat inline scripts/styles as first-class files during the audit; they are currently substantial and may duplicate external modules.

Useful searches (run from `budget/` and review results manually):

```sh
rg -n "<script|<link|createElement\(['\"]script|createElement\(['\"]style" zen.html zen-preview pulse-environment pulse-observatory
rg -n "getElementById|querySelector|querySelectorAll|classList|addEventListener|requestAnimationFrame|ResizeObserver|MutationObserver" zen*.js zen*.css zen-preview pulse-environment pulse-observatory
rg -n "firebase-sync|firebase\.database|localStorage|indexedDB|sessionStorage|Chart\(" zen.html zen-preview pulse-environment pulse-observatory
```

### 2. Establish a single owner per behavior

For each behavior, choose one owner and mark all other implementations as candidates for removal:

- Zen category switching and routine/session state: `zen.js` + `zen-model.js` + `zen-store.js`.
- Zen scene drawing: the active scene module for each mode; no second module should redraw the same SVG/canvas/DOM nodes.
- Zen visual effects: one base/effects layer plus mode-specific rules; later files must not merely override dead earlier files.
- Pulse page shell/navigation: shared shell and navigation modules.
- Pulse data synchronization: one Firebase/IndexedDB synchronization path per page.
- Pulse charts: one chart lifecycle per canvas; destroy/recreate only when the data source really changes.
- Pulse PR/log rendering: one formatter per metric and one DOM insertion path per row/card.

Use a small behavior matrix before deleting anything:

| Behavior | Stretch | Meditation | Observatory | Reactor | Owner after cleanup |
| --- | --- | --- | --- | --- | --- |
| Mode/category toggle | yes | yes | no | no | `zen.js` / `training-zen-nav.js` |
| Routine builder | yes | yes | no | no | `zen.js` + `zen-model.js` |
| Timed session | yes | yes | no | no | `zen.js` |
| Scene animation | tree/forest | bamboo/water | observatory field | reactor field | one scene owner per page |
| Weekly charts | Zen stats | Zen stats | yes | yes | page-local chart owner |
| PR and training log | no | no | yes | yes | page-local log/PR owner |

### 3. Consolidate Zen CSS safely

`zen.html` currently loads a long ordered chain of versioned stylesheets, including base scene/effects, layout/polish layers, Stretch tree/light layers, Meditation rock/waterfall layers, interactive rings, depth, finish, and session-oasis layers. First generate a cascade report showing which selectors are overridden later.

Candidates for consolidation/audit include:

- `zen.css`, `zen-scene-v3.css`, `zen-effects-v4.css`, `zen-scene-meditation-v8.css`.
- Layout/polish chain: `zen-sun-depth-v12.css`, `zen-layout-polish-v13.css`, `zen-symbol-balance-v14.css`, `zen-polish-v15.css`, `zen-refine-v16.css`, `zen-depth-spacing-v17.css`, `zen-polish-v26.css`, `zen-meditation-polish-v28.css`, `zen-stretch-polish-v29.css`, `zen-meditation-refine-v30.css`, `zen-meditation-finish-v36.css`.
- Mode/scene chain: `zen-stretch-polish-v18.css`, `zen-classic-tree-v22.css`, `zen-stretch-light-fade-v23.css`, `zen-meditation-rock-v24.css`, `zen-waterfall-v25.css`, `zen-interactive-rings-v31.css`, `zen-meditation-depth-ring-v32.css`, `zen-meditation-rockfall-v33.css`, `zen-session-oasis-v54.css`.

Do not assume the last file wins globally. For every selector:

1. Copy the effective rule set into a temporary report.
2. Identify whether it applies to Stretch, Meditation, the shared home, a session, or completion.
3. Move the effective rule to a stable base/mode/session stylesheet.
4. Remove the superseded rule/file only after a visual diff at narrow mobile and desktop widths.
5. Keep reduced-motion and focus/keyboard rules explicit; do not lose them during merging.

The desired end state is a small, readable cascade such as base → shared scene → Stretch → Meditation → session/completion, not a chain of historical patches.

### 4. Consolidate Zen JavaScript and scene rendering

Trace all functions that touch the same scene nodes. The active files currently include `zen-scene-v3.js`, `zen-stretch-depth-v18.js`, `zen-classic-tree-v22.js`, `zen-meditation-scene-v34.js`, `zen-effects-v4.js`, `zen-interactions-v31.js`, `zen-waterfall-v47.js`, `zen-cliff-detail-v46.js`, and `zen-session-oasis-v54.js`.

Audit older/similar files before proposing deletion, especially the `zen-waterfall-*`, `zen-cliff-detail-*`, `zen-meditation-scene-*`, and `zen-scene-*` families. A file is deletable only when:

- no HTML or dynamic loader references it;
- no other script calls a function it defines;
- it does not register an event listener, observer, animation loop, or style injector still needed by the active page;
- the current owner contains every needed behavior;
- the browser test passes with the file removed.

Merge duplicate `requestAnimationFrame` loops into one loop per scene. Gate loops on document visibility and `prefers-reduced-motion`; cancel them on mode/session teardown. Avoid two modules both creating/refilling the same waterfall, rock, tree, bamboo, ripple, ring, or glow nodes.

### 5. Audit the Zen preview shell

`budget/zen-preview/` contains copied exercise assets and a separate calm preview runtime. Compare every copied file with its root counterpart using hashes and semantic diffs. For each copy, decide one of:

1. Keep it because the preview intentionally differs and document the difference.
2. Replace it with a shared relative asset and a page-specific configuration.
3. Delete it after all references and dynamic loaders are removed.

Do not accidentally make the preview load the regular training runtime or modify the regular training page while deduplicating.

### 6. Consolidate Pulse Observatory/Reactor

The two Pulse pages share a large exercise shell, Chart.js, Firebase/IndexedDB sync, navigation, environment CSS/JS, inline data transforms, chart setup, log/PR rendering, and modal/editor handlers. Compare them side by side and extract only genuinely identical code.

Specific checks:

- Load Firebase and Chart.js once per page; do not add a second copy through a dynamic loader.
- Confirm there is one `firebase-sync` listener and one local/remote merge path.
- Confirm each chart canvas has one owner and old Chart.js instances are destroyed before replacement.
- Confirm PR values, training-log rows, and modal form values are not rendered once by inline code and once by an external script.
- Keep the Observatory and Reactor visual themes separate where they are intentionally different, while sharing neutral data helpers.
- Preserve the current start-screen animation, graph styling, training log, PR section, and mobile breakpoints.
- Verify the navigation links resolve correctly from both root and nested pages (`<base href="../">` is present on nested pages).

Prefer small shared helpers (data normalization, date labels, chart lifecycle) over a large “universal” renderer with mode conditionals everywhere.

### 7. Deletion gate

Before deleting a file, attach evidence in the cleanup commit message or a short audit table:

- all static references removed (`rg` result);
- all dynamic references removed;
- no exported/global function is consumed;
- no DOM selector/event/observer ownership remains;
- no page-specific behavior is lost;
- syntax checks pass;
- visual/mobile smoke tests pass;
- rollback checkpoint exists.

Delete obsolete files only in a final deletion pass, after the consolidated replacement has been tested. Never leave an empty compatibility shim unless an external URL or data migration requires it.

## Regression checklist

Run this checklist after every cleanup group and again before the final commit:

### Zen

- [ ] Page loads without a flash or hidden shell on mobile Safari.
- [ ] Stretch and Meditation toggles update labels, scene, routines, stats, and active state.
- [ ] Routine cards open the intended routine; builder can create and edit both modes.
- [ ] Session timer advances, pauses, resumes, finishes, and can be left safely.
- [ ] Completion feelings/note/save/cancel still work.
- [ ] Persistence survives reload and profile switching; export/import still round-trips.
- [ ] Reduced-motion mode removes nonessential animation without breaking state updates.
- [ ] No scene has duplicate trees, bamboo, rocks, waterfall, rings, ripples, or glow layers.

### Pulse Observatory and Reactor

- [ ] Start screen renders once with the intended environment animation.
- [ ] Next-workout/start/configure actions open the correct flow.
- [ ] Weekly totals, charts, PR section, and training log use the same source data as before.
- [ ] Add/edit/delete workout modal behavior remains intact.
- [ ] Firebase sync and offline/IndexedDB fallback still converge without duplicate rows.
- [ ] Charts resize correctly and do not overflow at 320px, 375px, 390px, and 768px widths.
- [ ] Training log and PR cards remain readable and touchable on mobile.
- [ ] Observatory and Reactor links work from the root training page and from each nested page.

### Technical checks

```sh
git diff --check
node --check budget/zen.js
node --check budget/zen-model.js
node --check budget/zen-store.js
node --check budget/zen-scene-v3.js
node --check budget/zen-meditation-scene-v34.js
node --check budget/zen-waterfall-v47.js
node --check budget/zen-cliff-detail-v46.js
python3 pulse-checks/check-source.py
node pulse-checks/motion-check.cjs
```

Also run a final reference scan. It should report no old concept destinations and no references to files selected for deletion:

```sh
rg -n -i "interval-track|uhd-athlete|exercise-concept-lab|data-exercise-concept-link" budget
```

## Suggested checkpoint sequence

1. `checkpoint/zen-before-cleanup`
2. `checkpoint/zen-css-consolidated`
3. `checkpoint/zen-js-scenes-consolidated`
4. `checkpoint/pulse-pages-before-dedupe`
5. `checkpoint/pulse-pages-deduped`
6. Final cleanup commit after the full regression checklist

If a visual or behavior regression appears, revert to the immediately preceding checkpoint instead of adding another override layer.

## Astra deliverables

At the end of the future cleanup task, Astra should provide:

1. A dependency/audit table listing every deleted, merged, retained, or intentionally duplicated file.
2. A short explanation of the new CSS and JavaScript ownership boundaries.
3. The regression checklist results at mobile and desktop sizes.
4. Before/after byte counts and the list of removed duplicate renderers/animation loops.
5. The final commit SHA and checkpoint SHAs.

