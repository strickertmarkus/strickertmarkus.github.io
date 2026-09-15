# Training / Pulse Observatory — working migration checklist

Status: **ACTIVE WORKING PLAN**

Created from `main` at baseline commit: `dca8b945e0cdf18e46e35c68fbd241d1f0318ccd`

Related long-term cleanup plan: `budget/TRAINING-RELEASE-V1-PLAN.md`

Purpose: promote Pulse Observatory to the main training overview, retain the current `exercise.html` overview as a compact mode, keep one canonical live training/session runtime, add smooth in-page mode transitions, and prepare the result for the later Release V1.0 consolidation.

This file is intentionally kept in the repository while the migration is in progress. Mark items `[x]` only after implementation **and** verification. When the migration is complete, fold the final architecture/decisions into the Release V1.0 documentation and remove this working file in a dedicated cleanup commit.

---

## Non-negotiable architecture decisions for this migration

- **One canonical production route:** `budget/exercise.html` remains the real training page.
- **Pulse Observatory becomes the default overview presentation** on that route.
- **Compact mode** is the current `exercise.html` overview presentation, available through an in-page toggle.
- Compact and Observatory are **not two independent copies of the dashboard/runtime**. They must share the same data, DOM/data owners and handlers wherever possible.
- The current, recently stabilised live training/session mode from `exercise.html` is the canonical training mode for **both** Compact and Observatory.
- Do **not** carry the separate Observatory/Reactor training-mode implementation into production as a second session runtime.
- Pulse Reactor remains a **temporary visual/reference source** until its useful circular-week interaction has been migrated. It is not intended to remain a third production training page for V1.0.
- Zen keeps its separate data model, but the user-facing Training ↔ Zen switch must eventually become an **in-page morph**, not a full document navigation.
- Reuse CSS/SVG/programmatic graphics already in the repository. Do not generate image assets.
- Do not solve migration problems by adding another override layer. Move ownership to the correct component and remove the superseded logic in the same checkpoint once verified.

### Target mode model

`exercise.html`

- Overview mode: `observatory` — **default**
- Overview mode: `compact` — current compact/main-page design
- Live workout/session: **one shared current exercise.html session implementation**
- Wellness mode: `training` / `zen` — later becomes an in-document shell transition

Suggested single source of truth during implementation:

- `document.documentElement.dataset.trainingOverview = 'observatory' | 'compact'`
- one controller owns overview mode changes
- one shared set of data elements / handlers
- no duplicate timers, charts, weekly-plan storage, workout storage or session state

The Observatory/Compact choice should default to Observatory. Persistence of a user's manual Compact choice across reloads is **not assumed yet**; decide explicitly before implementing that detail.

---

# Checkpoint 0 — Baseline, governance and rollback

- [x] Read root `AGENTS.md` before creating this plan.
- [x] Read the current Observatory README and Reactor README.
- [x] Confirm Observatory currently uses the same profile-specific training data and original builder/session handlers rather than a separate data store.
- [x] Confirm Reactor's seven orbit nodes represent the real weekly plan and can be used as an interaction reference.
- [x] Record migration baseline commit: `dca8b945e0cdf18e46e35c68fbd241d1f0318ccd`.
- [x] Keep `TRAINING-RELEASE-V1-PLAN.md` unchanged as the long-term consolidation plan.
- [x] Before the first implementation checkpoint, create/record a dedicated pre-migration checkpoint branch: `checkpoint/training-observatory-pre-migration-2026-09-15` -> `32d725f4fe201c3f53a080a980267a4ed8abe6d6`.
- [ ] At the start of every later checkpoint, re-read this file and root `AGENTS.md` and inspect current `main` before editing.

### Baseline references

- Observatory preview: `budget/pulse-observatory/exercise.html`
- Observatory theme: `budget/pulse-observatory/observatory.css`
- Shared Observatory/Reactor overview adapter: `budget/pulse-environment/environment.js`
- Shared overview material: `budget/pulse-environment/environment.css`
- Reactor reference: `budget/pulse-environment/exercise.html`
- Current production Compact/main route: `budget/exercise.html`
- Current Zen route: `budget/zen.html`
- Current Training/Zen nav: `budget/training-zen-nav.js` / `.css`

---

# Checkpoint 1 — Canonical page architecture: Observatory + Compact in one page

Goal: establish the structure before visual polishing. No duplicated dashboard/runtime.

- [x] Audit which Observatory elements are genuinely unique presentation and which are duplicates of existing `exercise.html` stats/week/graphs/logs.
- [x] Define one canonical set of IDs/data nodes for stats, weekly plan, charts, goals, records and log.
- [x] Promote Observatory's overview composition into `budget/exercise.html` as the default presentation.
- [x] Keep the existing Compact overview available in the **same document**.
- [x] Avoid two complete dashboard DOM trees where the same data is rendered twice.
- [x] Prefer one set of shared sections whose placement/material changes by `data-training-overview`.
- [x] If Observatory-only hero/decorative nodes are needed, keep them presentation-only and never give them data ownership.
- [x] Remove/retire duplicated preview-specific runtime code as soon as equivalent ownership is established on the main route.
- [x] Verify Markus/Maja profile selection still addresses the same stored data.
- [x] Verify no extra Firebase/storage namespace is introduced.
- [x] Verify no new periodic polling/render owner is introduced.

**Checkpoint exit condition:** `exercise.html` can render Observatory as default and Compact as an alternate state without loading two independent copies of the training dashboard logic.

Implementation checkpoint: Observatory is default via `data-training-overview="observatory"`; `?overview=compact` and `window.setTrainingOverviewMode('compact')` exercise the same DOM in Compact mode. The visible mode toggle/morph intentionally belongs to Checkpoint 2. No Observatory/Reactor `training.js` or training stylesheet is loaded on the production route.

**Checkpoint 1 implementation commit:** `6c5fb2ef98f1f37b13b3175b9d70fde94e0da70a`

Verification: JavaScript syntax, literal duplicate-ID scan, one canonical `week-grid` / `log-body` / `session-modal`, one existing workout/planned-session data owner, absence of Observatory/Reactor session-training assets, default Observatory state, no new `setInterval` in the overview controller/adapter, and `git diff --check`.

---

# Checkpoint 2 — Compact / Observatory top toggle + smooth morph

Goal: switch overview design without navigation/reload.

- [ ] Add one compact two-state mode control near the top of the page in a position that works on mobile and desktop.
- [ ] Compact symbol: filled diamond `◆` or an equivalent repository-native SVG rendition.
- [ ] Observatory symbol: reuse the **actual existing Observatory star/diamond visual language**, preferably its existing SVG geometry rather than a Unicode/emoji substitute.
- [ ] Labels/states clearly identify `Compact` and `Pulse Observatory`.
- [ ] Observatory is selected by default.
- [ ] Mode switch does not recreate charts/data/session runtime unnecessarily.
- [ ] Use a structural morph: `document.startViewTransition()` where supported plus a CSS fallback.
- [ ] Match the smoothness/continuity of the approved Zen Stretch ↔ Meditation interaction language.
- [ ] Preserve scroll intelligently when switching; do not jump unexpectedly to the top unless required by the composition.
- [ ] Respect `prefers-reduced-motion`.
- [ ] Test repeated Observatory → Compact → Observatory switching for stale classes/styles/listeners.
- [ ] Decide explicitly whether manual Compact selection persists across reloads; default remains Observatory regardless until that decision is made.

**Checkpoint exit condition:** overview switching is instantaneous/in-page, visually smooth, reversible and does not change workout data.

---

# Checkpoint 3 — One shared live training mode for both overview modes

Goal: starting a workout from either overview enters the **current production exercise.html training mode**, not the older Observatory/Reactor session skins.

- [ ] Inventory the current Observatory/Reactor `training.css` / `training.js` adapter and identify which parts are preview-only.
- [ ] Route both Compact and Observatory start actions to the same current `exercise.html` session functions/state.
- [ ] Preserve the current compact/focus cardio timer behavior exactly.
- [ ] Preserve current rest timer, 5-second pre-timer, beeps, custom-between-exercise flow and persistence.
- [ ] Preserve the current session typography and all recent iPhone/Safari timer fixes.
- [ ] Remove Observatory/Reactor `Original / Observatory / Reactor` session-design comparison controls from the future production path.
- [ ] Do not keep a second session markup/runtime hidden underneath the canonical one.
- [ ] Verify starting the same planned workout from Compact and Observatory produces equivalent serialized `sessionState`.
- [ ] Verify returning from a finished/cancelled session returns to the previously selected overview mode.

**Checkpoint exit condition:** overview design is independent of live workout runtime; there is one session implementation only.

---

# Checkpoint 4 — Observatory mobile composition polish

Goal: preserve what already works on mobile, change only the requested information hierarchy.

- [ ] Keep the existing Observatory mobile visual identity as the baseline rather than redesigning it wholesale.
- [ ] Put the summary metrics (`Denna vecka`, `Totalt pass`, and the remaining current summary metrics) on **one row**, using Reactor's compact density as layout reference.
- [ ] Ensure the row fits cleanly at 320 / 375 / 390 px without horizontal document overflow.
- [ ] Remove the large `Lägg till pass` button from the weekly-planning area.
- [ ] Move `Veckoplanering` significantly higher in the page hierarchy so it is available earlier without scrolling deep into the page.
- [ ] Keep adding/editing a workout available through contextual day/plan interaction; removal of the big button must not remove functionality.
- [ ] Verify the moved weekly plan does not duplicate the same controls elsewhere.
- [ ] Verify the rest of Observatory sections retain current order unless intentionally changed.

**Checkpoint exit condition:** first mobile screen exposes useful summary + next workout + easier weekly-plan access without increasing clutter.

---

# Checkpoint 5 — Observatory identity: heartbeat star + proper Next Workout action

Goal: strengthen Observatory-specific interaction cues without new assets.

## Header symbol

- [ ] Replace the small Observatory header ECG decoration with the Observatory star/diamond symbol.
- [ ] Reuse the exact Observatory visual geometry/design language already present on the page.
- [ ] Animate it as a clearly readable **heartbeat pulse**, not a generic constant breathing animation.
- [ ] Heartbeat should have a strong but controlled glow peak and quiet recovery between beats.
- [ ] Pause decorative animation when document is hidden/offscreen where applicable.
- [ ] Respect reduced motion.
- [ ] Do not introduce an additional JS animation loop if CSS animation or the existing presentation scheduler can own it.

## Next workout

- [ ] Replace the current visually weak/small-arrow treatment for `Nästa pass` with a dedicated action/symbol area.
- [ ] Keep next-workout content driven by the real weekly plan.
- [ ] Make the action obvious on mobile without competing with the mode toggle or weekly planner.
- [ ] Use native SVG/CSS rather than emoji/image assets.
- [ ] Preserve empty-state behavior when no next workout is planned.

**Checkpoint exit condition:** Observatory's primary identity and next action are both immediately legible on the first screen.

---

# Checkpoint 6 — Expandable weekly plan: linear → Observatory orbit

Goal: the weekly plan can be dragged upward into a circular/orbital layout and collapsed again.

This interaction should reuse the **real seven weekly-plan nodes**. Do not create a second interactive weekly plan that can drift out of sync.

- [ ] Define one owner/state: `weekOrbitProgress` from `0` (collapsed/linear) to `1` (expanded/orbit).
- [ ] Add an obvious but unobtrusive drag affordance to the weekly-plan surface.
- [ ] On mobile, upward drag should follow the finger continuously rather than only playing an animation after release.
- [ ] As drag progress increases, the weekly-plan container expands and the seven real day nodes interpolate from the existing linear layout into a circle.
- [ ] Use Reactor's orbit geometry as a mathematical/reference source, but **not** Reactor's visual theme.
- [ ] Apply Observatory's thin orbital traces, glowing nodes/star points, crimson/rose/cyan atmospheric language and transparency hierarchy.
- [ ] Planned/completed/current days must remain semantically distinguishable in both states.
- [ ] Release past threshold → settle expanded; below threshold → settle collapsed.
- [ ] Expanded state gets an explicit collapse affordance in addition to downward drag.
- [ ] Desktop gets an equivalent click/expand control; dragging may be optional there if it harms usability.
- [ ] Avoid cloning live interactive nodes. Prefer transforms/CSS custom properties/FLIP/View Transition on the same nodes.
- [ ] Use at most one animation-frame owner while the gesture is active; no permanent polling loop.
- [ ] Ensure pointer/touch handling does not cause page scroll while the orbit gesture is actively captured.
- [ ] Verify normal vertical page scrolling remains unaffected when the gesture is not active.
- [ ] Verify tapping a day still opens/selects the intended plan in both collapsed and orbit state.
- [ ] Verify week navigation and builder editing still operate on the same source data.
- [ ] Test repeated expand/collapse cycles on iPhone/Safari, including interrupted/cancelled gestures.
- [ ] Respect reduced motion: allow state switching without the continuous orbital morph.

**Checkpoint exit condition:** one weekly plan, two geometries, reversible gesture, no stale cloned state.

---

# Checkpoint 7 — Achievement / inactive visual hierarchy

Goal: adopt the successful Zen visual rule: attained/active states feel luminous; pending states recede.

- [ ] Inventory Observatory symbols, metrics, week nodes, goal markers and progress indicators.
- [ ] Define a shared Observatory semantic state vocabulary: `pending`, `current`, `completed`, `goal-achieved`.
- [ ] Pending/unachieved symbols use more transparency and lower glow.
- [ ] Current/active state gets focused glow without appearing completed.
- [ ] Completed/achieved state gets stronger, crisp glow and slightly higher visual weight.
- [ ] Avoid random per-component glow constants; use Observatory CSS variables/tokens.
- [ ] Ensure contrast remains accessible and text does not become faint just because decoration is pending.
- [ ] Apply the same language to collapsed and circular weekly-plan states.
- [ ] Check dark OLED/mobile appearance for excessive bloom.

**Checkpoint exit condition:** state can be understood visually without adding labels everywhere, and glow/transparency is consistent across Observatory.

---

# Checkpoint 8 — Training ↔ Zen becomes an in-page morph

Goal: eliminate the current full-page navigation between `exercise.html` and `zen.html`.

Current `training-zen-nav.js` is ordinary `<a href>` navigation. V1 target is a single wellness shell transition.

- [ ] Do not implement this by iframe or by maintaining two hidden full documents.
- [ ] Design a shared `wellness` shell/controller with explicit `training` and `zen` surfaces.
- [ ] Keep Zen's data/storage model isolated from exercise data as it is today.
- [ ] Extract/make Zen's main surface mountable without requiring a full page reload.
- [ ] Lazy-load Zen-only heavy assets on first switch if this materially improves training startup.
- [ ] Training overview remains mounted or can be restored without recomputing/reloading all training assets.
- [ ] Use `document.startViewTransition()` where supported, with a CSS morph fallback matching Stretch ↔ Meditation language.
- [ ] Preserve `?user=maja` / profile state through in-page switching.
- [ ] Define behavior if a live workout or live Zen session is active; do not silently destroy active state.
- [ ] Avoid duplicate headers/navigation after mounting Zen inside the shared shell.
- [ ] Browser history/back behavior should be intentional even though there is no full document reload.
- [ ] Reduced-motion fallback must remain immediate and usable.
- [ ] Verify Zen's existing tests after extraction/mounting.

**Checkpoint exit condition:** Training ↔ Zen feels like changing mode inside one application, not opening another page, while each domain retains one data/runtime owner.

---

# Checkpoint 9 — Retire preview/page duplication

Goal: once the main route has the approved Observatory/Compact architecture, remove the obsolete third-page architecture instead of keeping it forever.

- [ ] Confirm all Observatory features required by the user now exist on `budget/exercise.html`.
- [ ] Confirm Reactor's useful orbit interaction has been migrated.
- [ ] Remove Reactor from normal navigation/production entry points.
- [ ] Decide whether Observatory/Reactor preview directories are deleted from `main` or retained only until Release V1 verification; do not leave them active as competing production apps.
- [ ] Remove preview-specific training-mode comparison assets once no production route uses them.
- [ ] Remove duplicated auth/loaders copied only for preview shells.
- [ ] Update README/docs so there is one canonical training route.
- [ ] Git history/checkpoint refs remain the archive for the old standalone designs.

**Checkpoint exit condition:** users see one training application, not three independently maintained training pages.

---

# Checkpoint 10 — Integrate with Release V1.0 consolidation

Goal: do not finish the visual migration and then preserve all historical patch modules.

- [ ] Re-open `TRAINING-RELEASE-V1-PLAN.md` after Observatory becomes canonical.
- [ ] Update its 41 → 12 mapping if the migration changes final ownership boundaries.
- [ ] Fold Observatory overview ownership into the planned clean `exercise-dashboard.js` / relevant final owner rather than adding a thirteenth permanent patch module.
- [ ] Fold the Observatory orbit interaction into the canonical dashboard/week-plan owner.
- [ ] Ensure the shared live session still follows the V1 target owners (`session-core`, `session-transitions`, `session-presentation`, `session-ux`, `pulse-flow`, timer focus, persistence).
- [ ] Delete superseded preview/versioned files only after behavior has been migrated and verified.
- [ ] Keep Git history/checkpoints as rollback instead of compatibility code.

---

# Checkpoint 11 — Final regression / Release candidate gate

## Overview / navigation

- [ ] Cold mobile load opens Observatory directly with no legacy flash.
- [ ] Warm mobile load opens Observatory directly.
- [ ] Compact toggle works repeatedly without reload.
- [ ] Observatory toggle works repeatedly without reload.
- [ ] Training ↔ Zen morph works repeatedly without full document reload.
- [ ] Browser back/forward behavior is intentional.
- [ ] Markus/Maja state is preserved.

## Weekly plan / data

- [ ] Weekly plan shows correct dates/workouts in collapsed state.
- [ ] Weekly plan shows the same data in expanded orbit state.
- [ ] Drag follows finger smoothly and can reverse mid-gesture.
- [ ] Repeated expand/collapse leaves no stuck state.
- [ ] Day selection, builder open/edit/save and week navigation work.
- [ ] No duplicate workout writes.

## Live training

- [ ] Strength session from Observatory.
- [ ] Strength session from Compact.
- [ ] Cardio session from Observatory.
- [ ] Compact cardio timer pause/resume.
- [ ] Compact timer swipe expand/collapse repeatedly.
- [ ] Automatic rest timer.
- [ ] 5-second pre-timer and sounds.
- [ ] Custom between exercise remains manual.
- [ ] Finish/save workout and return to correct overview.
- [ ] Planned-session persistence survives reload/Firebase sync.

## Layout / performance

- [ ] 320 px mobile.
- [ ] 375/390 px mobile.
- [ ] iPhone Safari/PWA physical validation.
- [ ] 768 px tablet.
- [ ] 1440 px desktop.
- [ ] Landscape mobile session.
- [ ] No page-level horizontal overflow.
- [ ] No duplicate render owners/listeners introduced by overview switching.
- [ ] No permanent gesture RAF/poller when interaction is idle.
- [ ] Compare script/request count and load timing against current loader-v2 baseline.
- [ ] No new console errors.
- [ ] Reduced-motion mode works.

## Release documentation

- [ ] Update `TRAINING-RELEASE-V1-PLAN.md` with final architecture.
- [ ] Record final pre-V1 checkpoint.
- [ ] Remove this working checklist only after its completed decisions are captured in permanent V1 documentation.

---

# Implementation order

Do **not** attempt the entire list in one task. Recommended working batches:

1. Checkpoint 1 only — canonical one-page Observatory/Compact architecture.
2. Checkpoints 2–3 — mode toggle + one shared current live training mode.
3. Checkpoint 4 — mobile Observatory information hierarchy.
4. Checkpoint 5 — header heartbeat star + dedicated Next Workout action.
5. Checkpoint 6 — weekly-plan drag/orbit interaction (own checkpoint because gesture work is high-risk on iOS).
6. Checkpoint 7 — glow/transparency semantic polish.
7. Checkpoint 8 — Training ↔ Zen shared-shell morph (own checkpoint because it changes app-level navigation/lifecycle).
8. Checkpoint 9 — retire standalone preview/page duplication.
9. Checkpoints 10–11 — merge with V1 cleanup plan and full release-candidate regression.

Every batch gets its own checkpoint commit and must remove obsolete logic introduced/superseded by that batch before moving on.

---

# Embedded repository rules — copy of root `AGENTS.md`

Source at creation: `AGENTS.md`, blob `d9d8a25046d0ee123ad92923b5f6d3e07953c7b5`.

If root `AGENTS.md` changes later, **root `AGENTS.md` is authoritative** and this embedded copy must be refreshed before continuing the migration.

## Mandatory Repository Work Rules

**Scope:** Entire repository.

**Instruction:** Read this file before every prompt/task that involves this repository, and follow it carefully before making any change.

### Non-negotiable rules

1. **Never generate an image unless the user explicitly asks for an image.**
   - Do not invoke image generation for code, UI, GitHub, HTML/CSS/JS, screenshots, references, mockups, or visual-debugging requests unless the user explicitly asks for a generated image.
   - User-provided screenshots/images are references for implementation and analysis; they are not a request to generate a new image.

2. **Fix the code properly; do not stack patches on top of patches.**
   - Never solve a problem by adding another override/hack on top of old broken logic when the underlying structure can be corrected.
   - Inspect the active render/code path, remove or replace obsolete logic, and keep one clear source of truth.
   - Clean up dead, superseded, duplicate, or temporary code/files created during the task.
   - Use Git commits/checkpoints to return to earlier states when needed instead of preserving bad code through accumulating overrides.

3. **Ask direct questions when something is unclear.**
   - If the requirement, target element, intended visual result, or technical approach is ambiguous, ask a concise direct question before implementing.
   - Do not guess when the ambiguity could materially change the result.

4. **Use a checklist and verify every change.**
   Before editing:
   - Read this file.
   - Read the latest relevant files from the current branch.
   - Check the latest commits/state so work is based on the actual current code.
   - Break the request into explicit checklist items.

   During implementation:
   - Address every checklist item.
   - Prefer structural fixes over overrides.
   - Check for duplicate/obsolete code before adding new code.
   - Keep unrelated pages/features unchanged unless the task requires otherwise.

   After implementation:
   - Re-read every modified file/section.
   - Verify each checklist item individually.
   - Check the final diff against the state before the task.
   - Run all available relevant syntax/tests/checks.
   - Confirm that temporary/debug files and obsolete code are removed.
   - Confirm cache/version references point to the intended files when applicable.
   - Verify that the implementation is internally consistent and likely to work on the target platform, especially mobile Safari when relevant.

5. **Do not send the final answer before the GitHub change is pushed and published.**
   - For repository-changing tasks, push/commit the completed change first.
   - Confirm the expected commit is on the intended branch.
   - Wait for the relevant GitHub Pages/deployment workflow for that commit to finish successfully before sending the final completion message.
   - Do not describe a change as live/published while its deployment is still queued, waiting, or in progress.
   - If deployment fails, investigate/report the failure instead of claiming completion.

### Final-response gate

Before replying that a repository task is complete, confirm all of the following:

- [ ] This file was read first.
- [ ] No image generation was used unless explicitly requested.
- [ ] The underlying code was fixed cleanly; no unnecessary patch-on-patch workaround remains.
- [ ] Ambiguities were clarified with the user when needed.
- [ ] Every requested item was checked off.
- [ ] Relevant tests/syntax checks passed.
- [ ] Final diff was reviewed.
- [ ] Commit is pushed to the intended branch.
- [ ] GitHub Pages/deployment for the final commit completed successfully.
- [ ] Only then is the final answer sent.
