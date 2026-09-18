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

- [x] Replace the small Observatory header ECG decoration with the Observatory star/diamond symbol.
- [x] Reuse the exact Observatory visual geometry/design language already present on the page.
- [x] Animate it as a clearly readable **heartbeat pulse**, not a generic constant breathing animation.
- [x] Heartbeat should have a strong but controlled glow peak and quiet recovery between beats.
- [x] Pause decorative animation when document is hidden/offscreen where applicable.
- [x] Respect reduced motion.
- [x] Do not introduce an additional JS animation loop if CSS animation or the existing presentation scheduler can own it.

## Next workout

- [x] Replace the current visually weak/small-arrow treatment for `Nästa pass` with a dedicated action/symbol area.
- [x] Keep next-workout content driven by the real weekly plan.
- [x] Make the action obvious on mobile without competing with the mode toggle or weekly planner.
- [x] Use native SVG/CSS rather than emoji/image assets.
- [x] Preserve empty-state behavior when no next workout is planned.

**Checkpoint exit condition:** Observatory's primary identity and next action are both immediately legible on the first screen.

Implementation checkpoint: the sticky header now uses the same native four-point Observatory star geometry as the hero kicker and Next Workout cue. Its double-beat CSS pulse is governed by the existing Observatory visibility/session scheduler. The former header ECG ownership was removed from the Pulse Flow rAF/glow/canvas layers. `reactor-start` remains the sole Next Workout action and still reads the canonical weekly plan / empty state.

---

# Checkpoint 6 — Expandable weekly plan: linear → Observatory orbit

Goal: the weekly plan expands from its normal linear layout into an Observatory orbit through one small explicit expand control, and collapses through the same control.

This interaction reuses the **real seven weekly-plan nodes**. There is no second interactive weekly plan and no drag/pointer-capture system.

- [x] Keep one owner/state: `weekOrbitProgress` from `0` (collapsed/linear) to `1` (expanded/orbit).
- [x] Put one small expand-icon control at the left of the weekly-plan header, aligned with `Redigera` and `Mallpass`.
- [x] Clicking the control animates the seven real day nodes between the linear layout and the orbit.
- [x] The same control collapses the expanded orbit and updates its accessible label/state.
- [x] Use Reactor's orbit geometry only as a mathematical/reference source, not Reactor's visual theme.
- [x] Use Observatory thin orbital traces and rose/cyan atmospheric hierarchy.
- [x] Replace decorative random dots/plus marks with the canonical Pulse Observatory star geometry in the orbit centre.
- [x] Planned/completed/current days remain semantically distinguishable in both states.
- [x] Avoid cloning live interactive nodes; the existing `#week-grid .week-day` nodes move in place.
- [x] Keep at most one request-animation-frame owner during the click transition; no permanent polling loop.
- [x] Remove drag, pointer capture, click-suppression and drag-affordance code completely.
- [x] Normal vertical page scrolling remains untouched because the orbit has no gesture capture.
- [x] Tapping a day still opens/selects the intended plan in both collapsed and orbit state.
- [x] Week navigation and builder editing still operate on the same source data.
- [ ] Test repeated expand/collapse cycles on a physical iPhone/Safari.
- [x] Respect reduced motion: state switching is immediate without the continuous morph.

Implementation checkpoint: `training-week-orbit.js` owns only click expansion state, layout interpolation and one temporary animation-frame loop. `exercise.html` owns the small header control and the single static orbit shell around the canonical `week-grid`; `training-week-orbit.css` owns the scoped presentation. Drag/pointer infrastructure from the first CP6 iteration has been deleted.

Verification: Node syntax + all `budget/tests/training-*.test.cjs`, one canonical `week-grid`, no `cloneNode`, no pointer-capture/drag listeners, one orbit `requestAnimationFrame` owner, reduced-motion instant path, day-state styling, week rerender recapture, overview-switch cleanup, current cache keys and `git diff --check`.

**Checkpoint exit condition:** one weekly plan, two geometries, one compact click control, no stale cloned or gesture state.

---
# Checkpoint 7 — Achievement / inactive visual hierarchy

Goal: adopt the successful Zen visual rule: attained/active states feel luminous; pending states recede.

- [x] Inventory Observatory symbols, metrics, week nodes, goal markers and progress indicators.
- [x] Define a shared Observatory semantic state vocabulary: `pending`, `current`, `completed`, `goal-achieved`.
- [x] Pending/unachieved symbols use more transparency and lower glow.
- [x] Current/active state gets focused glow without appearing completed.
- [x] Completed/achieved state gets stronger, crisp glow and slightly higher visual weight.
- [x] Avoid random per-component glow constants; use Observatory CSS variables/tokens.
- [x] Ensure contrast remains accessible and text does not become faint just because decoration is pending.
- [x] Apply the same language to collapsed and circular weekly-plan states.
- [x] Check dark OLED/mobile appearance for excessive bloom.

Implementation checkpoint: `pulse-environment/environment.js` derives presentation-only semantic state from the canonical workout/goal DOM and existing truth (`done`, today/selected, progress width and metric values). `pulse-observatory/observatory.css` owns the four state token families. The collapsed week, metrics, Next Workout cue and goal accents consume those tokens, while `training-week-orbit.css` consumes the same variables instead of maintaining per-class glow constants. Pending changes decoration only; readable text opacity is not reduced.

Visual refinement: semantic `current` remains reserved for active context, but cyan is no longer a data/status hue. Pending/current/completed/achieved data stay within the Observatory pink hierarchy; cyan is reserved for Observatory identity glyphs such as the header/kicker star, the Next Workout star and the Observatory mode symbol. Goal progress bars keep their pink Observatory color independently of semantic state so partial progress does not read as disabled/grey.

Verification: Node syntax, all `budget/tests/training-*.test.cjs`, semantic state vocabulary and ownership, no new storage/data namespace, no legacy per-state orbit glow blocks, shared progress/marker tokens, bounded 12/14/18 px current/completed/achieved glow radii for dark mobile/OLED, current cache keys and `git diff --check`.

**Checkpoint exit condition:** state is visually consistent across Observatory without labels or a second data/state owner.

---

# Checkpoint 8 — Training ↔ Zen becomes an in-page morph

Goal: eliminate the current full-page navigation between `exercise.html` and `zen.html`.

Current `training-zen-nav.js` is ordinary `<a href>` navigation. V1 target is a single wellness shell transition.

- [x] Do not implement this by iframe or by maintaining two hidden full documents.
- [x] Design a shared `wellness` shell/controller with explicit `training` and `zen` surfaces.
- [x] Keep Zen's data/storage model isolated from exercise data as it is today.
- [x] Extract/make Zen's main surface mountable without requiring a full page reload.
- [x] Lazy-load Zen-only heavy assets on first switch if this materially improves training startup.
- [x] Training overview remains mounted or can be restored without recomputing/reloading all training assets.
- [x] Use `document.startViewTransition()` where supported, with a CSS morph fallback matching Stretch ↔ Meditation language.
- [x] Preserve `?user=maja` / profile state through in-page switching.
- [x] Define behavior if a live workout or live Zen session is active; do not silently destroy active state.
- [x] Avoid duplicate headers/navigation after mounting Zen inside the shared shell.
- [x] Browser history/back behavior should be intentional even though there is no full document reload.
- [x] Reduced-motion fallback must remain immediate and usable.
- [x] Verify Zen's existing tests after extraction/mounting.

Implementation checkpoint: `training-zen-nav.js` is now the shared wellness-shell controller on the canonical `exercise.html` route. Training remains mounted; Zen is fetched from the existing `zen.html` source only on first use, its main/landscape/dialog surface is imported without the standalone Zen header, and only Zen-local CSS/JS assets are lazy-loaded. The shared training header owns the Training/Zen navigation plus Zen profile/settings tools, so the mounted surface does not create a second header. Live Training or live Zen sessions block a mode change with a non-destructive status message.

History policy: `?wellness=zen` represents the Zen surface; Training is the canonical URL without that parameter. `history.pushState` is used for user switches and `popstate` restores the corresponding mounted surface. Existing query parameters, including `?user=maja` and overview selection, are preserved. The controller uses `document.startViewTransition()` where available and a CSS entrance morph otherwise; reduced-motion switches immediately.

Verification: controller syntax, all `budget/tests/training-*.test.cjs` plus existing `budget/tests/zen*.test.cjs`, lazy Zen-only asset filtering, no iframe/second full-document mount, one shared header, active-session guards, profile/history preservation, current cache keys and `git diff --check`.

Performance refinement (2026-09-16): the wellness morph is capped at 180–240 ms, full-surface blur was removed for mobile Safari, and Zen-local CSS/JS URLs are network-preloaded after initial idle or explicit Zen intent without executing the Zen runtime until the mode is actually opened.

Mobile Zen header refinement (2026-09-16): the in-page Zen mode now follows the native Zen header hierarchy. The Training hamburger is not rendered in Zen mode; mobile uses one compact identity/profile row plus the Training↔Zen selector directly underneath, avoiding duplicate menu affordances and excess header height.


**Checkpoint exit condition:** Training ↔ Zen feels like changing mode inside one application, not opening another page, while each domain retains one data/runtime owner.

---

**CP8 navigation refinement (2026-09-16):** the temporary two-state `Träning / Zen` header pill has been retired. The user-facing mode control is one persistent three-state `Träning / Stretch / Meditation` switch shared by all three surfaces. The Compact/Observatory symbol remains owned by `training-overview-mode.js` but now sits in a reserved right-side slot on that same switch row; the slot remains present in Zen so the three mode buttons do not shift between Training, Stretch and Meditation. Rapid destination requests advance the shared switch token before same-mode handling so a stale pending Zen load cannot override a newer Training request. The training hamburger and `Din profil` placeholder remain removed.


**CP8 transition refinement (2026-09-16):** cross-mode Training ↔ Zen switching no longer uses browser View Transition snapshots. The outgoing surface is hidden atomically before Zen-only styles are detached, and only the newly active surface receives the short CSS enter animation. This removes the visible re-render/flash of the previous Stretch or Meditation page on mobile Safari while retaining reduced-motion and stale-request cancellation.

# Checkpoint 9 — Retire preview/page duplication

Goal: once the main route has the approved Observatory/Compact architecture, remove the obsolete third-page architecture instead of keeping it forever.

- [x] Confirm all Observatory features required by the user now exist on `budget/exercise.html`.
- [x] Confirm Reactor's useful orbit interaction has been migrated.
- [x] Remove Reactor from normal navigation/production entry points.
- [x] Retain historical Observatory/Reactor URLs only as redirect aliases; they are not competing production apps.
- [x] Remove preview-specific training-mode comparison assets once no production route uses them.
- [x] Remove duplicated auth/loaders copied only for preview shells.
- [x] Update README/docs so there is one canonical training route.
- [x] Git history/checkpoint refs remain the archive for the old standalone designs.

Verification and exact retirement inventory: `TRAINING-OBSERVATORY-CP9-AUDIT.md`.

**Checkpoint exit condition:** users see one training application, not three independently maintained training pages.

---

# Checkpoint 10 — Integrate with Release V1.0 consolidation

Goal: do not finish the visual migration and then preserve all historical patch modules.

- [x] Re-open `TRAINING-RELEASE-V1-PLAN.md` after Observatory becomes canonical.
- [x] Update its 41 → 12 mapping for the Observatory/wellness ownership changes.
- [x] Fold Observatory overview ownership into `exercise-dashboard.js` rather than adding a thirteenth permanent owner.
- [x] Fold the Observatory orbit interaction into the canonical dashboard/week-plan owner.
- [x] Ensure the shared live session still follows the V1 target owner boundaries.
- [x] Delete superseded preview/versioned files only after behavior has been migrated and verified.
- [x] Keep Git history/checkpoints as rollback instead of compatibility code.

Verification and ownership map: `TRAINING-OBSERVATORY-CP10-AUDIT.md`.

---

# Checkpoint 11 — Final regression / Release candidate gate

## Overview / navigation

- [x] Cold mobile load opens Observatory directly with no legacy flash.
- [x] Warm mobile load opens Observatory directly.
- [x] Compact toggle works repeatedly without reload.
- [x] Observatory toggle works repeatedly without reload.
- [x] Training ↔ Zen morph works repeatedly without full document reload.
- [x] Browser back/forward behavior is intentional.
- [x] Markus/Maja state is preserved.

## Weekly plan / data

- [x] Weekly plan shows correct dates/workouts in collapsed state.
- [x] Weekly plan shows the same data in expanded orbit state.
- [x] CP6 decision retained: orbit interaction is click-based; the earlier drag/pointer experiment was deliberately removed, so no drag gesture remains to regress.
- [x] Repeated expand/collapse leaves no stuck state.
- [x] Day selection, builder open/edit/save and week navigation work.
- [x] No duplicate workout writes.

## Live training

- [x] Strength session from Observatory.
- [x] Strength session from Compact.
- [x] Cardio session from Observatory.
- [x] Compact cardio timer pause/resume.
- [x] Compact timer expand/collapse morph works repeatedly in the iPhone-like WebKit gate.
- [ ] Physical iPhone finger-swipe expand/collapse repeatedly — CI WebKit cannot generate a trusted touch gesture.
- [x] Automatic rest timer.
- [x] 5-second pre-timer and sound path.
- [x] Custom between exercise remains manual.
- [x] Finish/save workout and return to correct overview.
- [x] Planned-session persistence survives a fresh load and the `firebase-sync` repair event path.

## Layout / performance

- [x] 320 px mobile.
- [x] 375/390 px mobile.
- [ ] iPhone Safari/PWA physical validation, including the real finger-swipe timer gesture — intentionally left manual; automated WebKit is green but cannot make a trusted physical-touch claim.
- [x] 768 px tablet.
- [x] 1440 px desktop.
- [x] Landscape mobile session.
- [x] No page-level horizontal overflow.
- [x] No duplicate render owners/listeners introduced by overview switching.
- [x] No permanent timer/gesture RAF or poller when interaction is idle; timer focus is now event-driven and gesture RAF is temporary.
- [x] Script/request count and load timing recorded against the current loader-v2 baseline.
- [x] No new console errors in the automated WebKit gate.
- [x] Reduced-motion mode works.

## Release documentation

- [x] Update `TRAINING-RELEASE-V1-PLAN.md` with the CP11 release-candidate architecture and measured loader baseline.
- [x] Record final pre-V1 checkpoint branch as `checkpoint/training-observatory-cp11-2026-09-18`.
- [ ] Remove this working checklist only after physical iPhone/PWA validation and after its remaining manual decision is captured in permanent V1 documentation.

Automated verification details, measured loader numbers and the remaining manual gate are recorded in `TRAINING-OBSERVATORY-CP11-AUDIT.md`.

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
