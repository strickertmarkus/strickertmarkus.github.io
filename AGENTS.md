# Mandatory Repository Work Rules

**Scope:** Entire repository.

**Instruction:** Read this file before every prompt/task that involves this repository. Follow it before making any change.

## Core rules

1. **Never generate an image unless the user explicitly asks for a generated image.**
   - Do not invoke image generation for code, UI, GitHub, HTML/CSS/JS, screenshots, references, mockups, or visual debugging unless the user explicitly requests generated artwork.
   - Browser screenshots used to verify the real rendered site are **verification artifacts**, not generated images, and are allowed/required under the visual-verification rules below.
   - User-provided screenshots are implementation references, not requests to generate a new image.

2. **Fix the underlying code; never stack patches on broken logic.**
   - Inspect the active render/code path first.
   - Replace or remove obsolete logic instead of adding another override on top.
   - Keep one clear source of truth for each behavior/layout rule.
   - Remove dead, superseded, duplicate, debug, or temporary code created during the task.
   - Keep unrelated pages/features unchanged unless the task requires otherwise.

3. **Ask only when ambiguity materially changes the implementation.**
   - Ask one concise question if the target, intended result, or technical behavior is genuinely ambiguous.
   - Do not ask for confirmation when the request and desired result are already clear.

## Tests: only on request (overrides the verification rules below)

- Do **not** run test suites (node tests, WebKit/Playwright regression runs, CI polling) unless the user explicitly asks for tests. Just implement; the user tests himself.
- Exception: a really large task may run the relevant tests.
- A quick syntax check of changed JavaScript and one preview screenshot of the changed UI are still fine.

## Who owns which behaviour (change it there, do not patch over it)

| Behaviour | Owner |
| --- | --- |
| Firebase sync, polling, which keys a page listens to | `budget/firebase-sync.js` (`LIVE_KEYS`, `scheduleRemotePoll`, `onPageHidden`/`onPageShown`) |
| Zen data (sessions, own routines, cloud) | `budget/zen-store.js` — other pages read `ZenStore`, never their own Firebase listener |
| Zen session clock and step time | `budget/zen-model.js` |
| Zen session view and its 200 ms tick | `budget/zen.js` (`tick`) |
| Training overview (hero, week, log, charts) | `budget/training-pulse-field.js` |
| Pass builder layout and main button | `budget/pulse-builder-ui.js` + `.css` |
| Running pass, summary and save | `budget/archive/exercise.html` (`sessionDoneWork`, `saveSessionWorkout`) |
| Explorer figure draw loop | `budget/pulse-exercise-guide.html` (`animate`) |
| Performance measuring | `budget/perf-hud.js` (`?perf=1` / `?perf=0`) |
| Dialog scroll lock and focus return | `budget/ui-motion.js` (`SurfaceMotion.showDialog`, uses `TrainingOverlay` when present) |
| Zen saved-session fields (feelings, breathing snapshot, plan, manual log) and "Gör samma pass igen" | `budget/zen-model.js` (`entryValid`, `redoRoutine`) |
| Zen time to switch position between movements | `budget/zen-model.js` (`switchSeconds`, `stepStarts`) |
| Gym profiles and programme filter by equipment | `budget/pulse-explore.js` (`readGyms`, `fitsGym`, `matchingPrograms`; stored in `ex_gyms`) |
| Explorer navigation: bottom bar, search panel per tab, Filter sheet, Mina gym page | `budget/pulse-gym.js` (`gm-dock`, `openFind`, `renderSheet`, `renderGyms`, `PulseExploreSearch.open(mode,{muscle,origin})`). The bar stays over the exercise scene and steps aside only for its sheets (`PulseGymScene.overlayOpen`). Every window expands from the tapped button with `PulseMotion.reveal`/`conceal` |
| Shopping list sorted in the shop's order (departments, keywords, shop orders, learned places, sort button) | `budget/shopping-store-sort-v1.js` (`DEPARTMENTS`, `SHOPS`, `sh_store_places` learned from `shopping:item-moved`); undo goes through the core `saveState`/`undo` |
| Notes in the Listor "Lista" tab (page header hidden; name row with a fading saved tick, new note and saved-notes sheet with pin; round "Aa" button bottom right opens one swipeable row: H1, H2, body, to-do, bullets, bold, italic, underline, text colour (swaps the row to swatches; stored as `<font color>` limited to `COLORS`, "standard" removes it), link (opens a small dialog at the top of the visible area with Text and Länk fields, "Klistra in" from the clipboard, "Ta bort länk" on an existing link; where the link goes is noted at the tap as character offsets (`snapSelection` on the row's touchstart, last marking `wideSel` if the caret sits at its start or end, else the word before the caret) and on Spara exactly those characters are wrapped (`wrapRangeInLinks`) or replaced by the new text; `openLinkDialog`/`saveLink`; no field in the floating row), indent/outdent, divider, undo/redo; H1 22 px orange (bold inside headings takes the heading colour), H2 16 px lighter orange; the format button is pinned above the keyboard while typing (`visibleBox`: the top-most window's visualViewport mapped through the frames, so it works inside Home's Listor iframe; placed every frame while a note field has focus, faded out while the page scrolls (`kb-moving`) and put back when it settles; the caret is scrolled above it, `keepCaretAboveBar`); the row opens by itself when text is selected or the caret is in a line with text (closes again on blur unless opened by hand); several selected lines get H1/H2/text/list per line (`formatLines`, a full list of the same kind goes back to text); headings show done/total and fold on a tap at their right edge; ticked to-dos sink; @Maja/@Markus lines take their colour; swipe the name row to switch note; paste keeps formatting from iPhone Notes and web pages (`pasteToNote`: heading tags or larger text → H1/H2, bold/italic/underline from tags or inline styles, bullet lists, checklists with ticks, plain-text ☐/•/- markers); each note is a `sh_lists` entry with mode `general`, a sanitised `note` HTML field and optional `pinned`) | `budget/shopping-notes-v1.js`, styles at the end of `budget/shopping-shell-v1.css`, mode title in `budget/shopping-core-v1.js` |
| Links in Listor: http(s)/www addresses in shopping/packing items (`linkify` in `shopping-list-engine-v7.js`, a tap opens and does not edit), to-dos (own link line under the title in `family-todos-ui-v1.js`) and notes (`<a href>` kept by `sanitize`, `linkifyEditor` on paste, blur and load; a tap opens the link) are tappable, styled blue (`.sh-link`) | those files, styles at the end of `budget/shopping-shell-v1.css` and `budget/home-listor-v1.css` |
| Listor header on every tab (no page title row: the list's own name is a 26 px heading; list tools as 36 px round orange icons like the notes (no header plus: items are added per heading; undo is a counter-clockwise circular arrow, also in Att göra; the tools menu opens from a folder icon with the number of lists in this tab, set in `renderListsMenu`, kept by nav-menu-motion via `data-keep-icon`); mode switch 2 px lower) | block at the end of `budget/shopping-shell-v1.css` |
| Listor look on the finance pages and Data & Formler (orange accent, open sections instead of cards, red/green only for money in/out) | `budget/listor-theme-v1.css` (loaded last; selectors use `html[data-finance-view]:not(#lt)` / `html.listor-theme:not(#lt)` to beat `finance-ui.js`); single orange theme in `finance-ui.js` `financeTheme`; budget sections (sketch B: tinted card, total right, "⋯" menu with rename/delete via `closeSectionMenus`, rows as name + "Budget" line + underlined amount + status chip) are styled in the `.section-card[data-section-key]` block; `--sc` is set per card in `budget*.html` `renderSections` |
| Apple Pay inbox (Shortcuts automation → `pay_inbox`). Two modes: on `budget.html`/`budget_maja.html` the person's own purchases go into a budget post (learned shops in `pay_merchant_rules[who]`); purchases with a card whose name contains "ICA" are left out there and sorted on `familjebudget.html` instead (ICA mode: all ICA-card purchases from both phones go into the shared ICA categories via `window.FamilyIca`, learned shops in `pay_merchant_rules.ica`; Familjebudget's fixed costs (`familjebudget_data.expenses`) are offered once a month as "Fast", suggested to "Fasta kostnader", handled ones in synced `pay_recurring_done.ica` (older ones under `markus` still count)) | `budget/budget-pay-inbox-v1.js`, styles at the end of `budget/listor-theme-v1.css` (plus `.fb-sect .pay-inbox` in `familjebudget.html`), setup and database rules in `budget/PAY_INBOX_SETUP.md` (the secret token is never committed) |
| Budget months created automatically (missing months up to now, next month from the 25th, budgets copied with actual 0, opens on the current month; saves only after the first Firebase read via `firebase-initial-load`) | `budget/budget-auto-months-v1.js`, event in `budget/firebase-sync.js` |
| "Räknas mot kvar" per budget post: switches in each section's ⋯ menu set `item.offBudget`; such posts stay visible with a small blue "räknas ej" tag and muted amount but are left out of the KPI totals (`computeTotals` in `budget*.html`) and Analys (`itemsSum`) | `budget/budget.html`, `budget/budget_maja.html`, `budget/analys-v1.js`, styles at the end of `budget/listor-theme-v1.css` |
| Budget value under each item is one big tap target ("Budget 1 000"), edited inline with a dashed field | `budget/budget-tap-edit-v1.js`, styles at the end of `budget/listor-theme-v1.css` |
| Bottom navigation, the main menu on every main page: Hem, Överföringar, Budget, Listor, Mer (sheet: Träning, Resor, Mila, Melker, Home's notiser); always docked edge to edge; the orange dot moves like a worm (front and back edge on their own curves: the front leads, the back catches up while it is between the tabs, a dot again when it lands) (across pages: stretch before leaving, shrink on arrival via sessionStorage `pbn-from`, cross-document view transition in between, the bar itself excluded); on Home every change (Hem, Överföringar, Budget, Listor, Resor) is the same slide, 100 ms out then 220 ms in (`leave`/`enter`; the user preferred this over an overlapping slide; direction by tab order, `dirOf`), the dot timed to it, the month pill fading; Budget/Listor/Resor are full-screen views in Home (Budget and Listor preloaded in the background; Budget opens the last finance page and the finance pages switch among themselves inside the view; `hub-fullscreen-child.js` on those pages routes links to Home and the other views) (views load with `?hubFrame=1&b=<router ?v>` so a deploy never shows a cached page inside Home: bump `home-morph-router.js?v=` in `home.html` when a view page changes) (`window.HomeHub` in `home-morph-router.js`, `leave`/`enter`, fires `hub:change`); Home's old section buttons and the "Översikt" buttons on Listor/Resor are removed; lifts a page's own floating "+" (`.fab`) above the bar; on touch screens hidden while a text field has focus (`pbn-typing`); hides the hamburger menu; inside iframes only bottom padding; not on the training pages (own `field-dock`) | `budget/pulse-bottom-nav-v1.js` (loaded after nav-menu-motion.js on every main page), `budget/home-morph-router.js` |
| Home header, centred (large "Frick Strickert", orange time and blue date under it, the budget header's warm bottom-up fade and orange edge); the month "‹ NOV 2026 ›" (no frame, sized like the week label) sits at the right of the calendar row after Vecka (`.month-nav.home-month-row`; arrows step, a tap on the month opens the month list; no longer moved into the header); Swedish holidays are always shown (no toggle, `swedish-holidays-v1.js`), a tap lists six months back and ahead plus "Idag" (`home-month-btn`/`home-month-menu`), swiping the calendar also changes month; fixed over the page and slims to one row while scrolling via `html.home-hdr-compact`) | header block at the end of `budget/home-listor-v1.css`, scroll toggle and short month label in `budget/home.html` |
| Familjebudget as a monthly view (KPIs, month transfer split + history, ICA-kortet, Huskonto list, house card with loan curve and amortisation plan, savings goals; goals and the ICA card are edited here, everything else in Data & Formler; the move checklist is removed from the UI, its data is kept). ICA-kortet and Huskonto are the budget pages' section card (`.section-card[data-section-key]` from listor-theme-v1.css, header via `cardHead`, "⋯" menu; the page's old collapsed `.section-card`/`.section-body` styles are removed). ICA-kortet: budget = the month's ICA transfer (`rowFor(key).ica`), spent / kvar bar, category rows like budget posts ("Budget …" tap-to-edit stored in `budgets`, the amount field adds the difference as a "Justering" purchase, % chip), default Mat, Hushåll, Barn, Fasta kostnader, Övrigt; "+ Kategori", × on a category removes it; the name opens its purchases (× removes); Huskonto rows the same way: "Budget" = the fixed amount (tap edits `familjebudget_data.huskonto`, so Husutgifter follows), the field = paid this month, the fixed amount until changed (`ica_card_v1.hus["YYYY-MM"][name]`), "+ Lägg till köp" for manual purchases (Maja's) with Maja/Markus pills, the fixed costs folded under "Fasta kostnader (n)", the Apple Pay inbox "Att sortera" inside the section; stored in synced `ica_card_v1` `{cats, budgets: {cat: kr}, months: {"YYYY-MM": [{id, cat, amount, merchant, who, time, fixed}]}}`, `window.FamilyIca {cats, add, remove}` | `budget/familjebudget.html` (styles `fb-*` in its head, `renderIca`), key in `budget/firebase-sync.js` `SYNC_KEYS` |
| Analys for Markus and Maja (period 3/6/12/all, KPIs from whole months only, month chart with dashed budget and lavender income line, where the money goes, posts that most often go over, savings; old analytics goals copied once to Familjebudget by name) | `budget/analys-v1.js` (shared), shells `budget/analytics.html` and `budget/analytics_maja.html` (styles `an-*` in their heads) |
| Transfers with the Huskalkyl.xlsx formulas (house cost per month incl. amortisation steps, Husutgifter = Totalt hus + Huskonto-utgifter, shares = netto / total, INT per person; months from 2027-01 marked auto, added automatically on Data & Formler after the first Firebase read and projected read-only elsewhere) | `budget/transfer-income.js` (`houseMonth`, `houseCosts`, `projectRow`, `ensureRows`, `refreshAuto`, `rowFor`), table in `budget/data.html` |
| Data & Formler in the budget style (renders the saved data on DOMContentLoaded and again after `firebase-initial-load`; no dark-mode toggle; finance header with Markus/Maja and the four view icons from `finance-ui.js` (`page.data`, shared like Familjebudget, no month control); income fallback, unused loan params and goals removed from the UI; transfers as one block per month with inputs only for Husutgifter, ICA-kort and both net salaries, computed shares as small text, latest 6 months shown; open sections with glowing dots, dashed-underline fields, formulas folded in `<details>`, export/import/reset as small links at the bottom, loan results from the Huskalkyl model for the current month) | `budget/data-listor-v1.css`, `budget/data.html` |
| Training session: "Exercise Mode" title, what comes next (`window.__sessionUpcomingV1`, between exercises like Hopprep first) and the next-exercise card with the 3D figure after ~20 s | `budget/exercise-session-next-preview-v1.js` (loaded by `exercise-pulse-flow-ecg-glow-v104.js`); label writers in `exercise-hype-polish.js` and `exercise-session-theme-rest-v117.js` call the helper; figure = `pulse-exercise-guide.html?figure=<name>` (figure-only mode, postMessage `pulse-figure-show`) |
| Listor look on home (glow, open widgets, open month calendar: today circle, two events per day with colour bar, multi-day bar via `range-start/mid/end`, `is-past`, `is-single` set in `home.html` `populateMonthGrid`) | `budget/home-listor-v1.css`; travel primary buttons are outlined in `budget/travel.css` `.primary`. `calendar.html` is only a redirect to home (the calendar page was removed; don't link it) |
| Cardio "Ta tid" (count-up) timer: a cardio exercise's `timerMode` is `'up'` or `'down'` (normalizeExercise, hidden `-timer` input per row, parseExerciseRow, sessionState, plan recovery); the builder shows Nedräkning / Ta tid on cardio rows (Löpning utomhus starts as Ta tid, which hides the Tid field); in the session the red ring counts up with "Tid · varv n" and fills once every five minutes; the logged time is the real elapsed time; the large focus view stays open and never turns to overtime colour (`exercise-timer-focus.js` `syncCardio`) | `budget/pulse-builder-ui.js` (`timerInput`, `setTimerMode`), `budget/archive/exercise.html`, painting in `budget/exercise-hype-timer-layout-v1.js` (`paintCardioTimer`) and `budget/exercise-pulse-flow-motion-v67.js` (`paintCardio`), timed-cardio checks in `exercise-session-runtime-core-v21.js` and `exercise-timer-focus.js` |
| Finishing a cardio exercise in training mode: a sheet asks for distance and average pace per km (each fills the other from the elapsed time, the clock is paused while it is open), "Spara" writes `actualDistance` into the set log, "Hoppa över" logs as before; custom between exercises are skipped | `budget/exercise-cardio-finish-v1.js` (outermost wrapper of `completeCurrentSet`, `passing` flag because later wrappers wrap it again), listed last in the session manifest in `budget/auth-config.js` |
| Löpning utomhus in the explorer (last catalogue entry, id 79, scene `run` with forward lean and arm swing, loops in the gym scene; poses `assets/exercise-poses-v2/79-*.webp` rendered from that scene) | `budget/pulse-explore.js`, `budget/pulse-exercise-guide.html` (`guideScenes`, `run` branch), `budget/pulse-gym-scene.js` (`LOOP`) |
| Explorer selection into today's pass | `budget/pulse-explore-handoff.js` (request `{version:1,ids}`) |

## Design iteration mode

When the user is still choosing or refining the visual style, prioritize short design iterations. This mode takes precedence over the full verification requirements below until the user says the style is settled or requests full verification.

- Make the requested visual changes, review the diff, and run syntax checks for changed JavaScript.
- Do one focused browser preview of the affected state, normally at 390 px for mobile UI. Inspect a screenshot; for animation inspect two phases or a short recording.
- Do not run broad regression suites, exhaustive viewport matrices, or repeated CI polling during style exploration. Automatically triggered CI may continue in the background and does not block delivery of the design iteration.
- Check deployment once; only call the update published when deployment success is confirmed. Otherwise provide its actual status without waiting in a polling loop.
- Fix obvious breakage discovered in the focused preview. Defer unrelated legacy issues and broad verification until the visual style is approved, and state any relevant unverified limitations briefly.
- Once the user approves the style, perform the full verification and final-response gate below.

## Fast execution strategy

4. **Plan first, then make one coherent change.**
   Before editing:
   - Read this file.
   - Read the latest relevant files from the current branch.
   - Check the latest commits/state.
   - Write a short internal checklist covering every requested item.
   - Identify obsolete/duplicate code that should be removed as part of the fix.

5. **Batch related file changes into one final commit whenever practical.**
   - Do **not** normally commit HTML, CSS, tests, cache keys, and workflow changes one file at a time.
   - When a task touches multiple files, prepare the complete change first and prefer an atomic Git tree/commit so all related files land together.
   - Include tests, cache/version bumps, and workflow updates in that same final commit.
   - Avoid intermediate commits on the deployment branch unless:
     - the user explicitly asks for checkpoints,
     - a risky migration genuinely needs a rollback point, or
     - a failed final verification requires a corrective retry.
   - Do not wait for Pages/CI on intermediate work that is known not to be the final intended state.
   - If a verification run fails, inspect the failure, fix the underlying cause, and make one corrective commit rather than layering test workarounds.

6. **Use cheap checks before expensive checks.**
   Before the final push when tooling permits:
   - Re-read all modified sections.
   - Run syntax/static/unit checks first.
   - Verify selectors, IDs, cache references, and data flow.
   - Check the diff against the state before the task.
   - Only after those pass should the final commit trigger the slower browser/deployment verification.

## Mandatory visual verification

7. **Every change that can affect rendered UI must receive a real visual check.**
   This includes changes to HTML, CSS, responsive layout, visible JS behavior, dialogs, controls, charts, animations, spacing, typography, or anything the user can see.

   For UI-affecting work:
   - Render the **final implementation** in a real browser after the complete change is applied.
   - Capture at least one screenshot of the affected state and **inspect the screenshot visually** before declaring the task complete.
   - A DOM assertion, CSS selector check, syntax test, or “element exists” test is **not a substitute** for the screenshot review.
   - The screenshot must show the actual state relevant to the request: open the dialog/menu/session, enter realistic content, scroll to the affected area, etc.
   - Compare against any screenshot/reference supplied by the user when one exists.
   - Check specifically for clipping, overlap, wrong stacking, overflow, unexpected whitespace, broken alignment, stale elements, and mobile safe-area issues.

   Viewport requirements:
   - For mobile/iPhone-related work: verify in **WebKit** at the target mobile width; default to **390×844** when no more specific size is known.
   - For narrow/responsive layout fixes: also check a smaller width such as **320 px** when the change could break there.
   - For responsive changes affecting both mobile and desktop: inspect at least one mobile screenshot and one desktop screenshot.
   - For desktop-only changes: inspect an appropriate desktop viewport.
   - When animation/state transitions matter, capture/check the relevant state rather than only the initial frame.

   If browser screenshot verification is genuinely unavailable:
   - State that limitation explicitly.
   - Do not claim the visual result was verified.

8. **Automated browser tests should verify geometry, not just existence.**
   When relevant, add targeted WebKit/Playwright assertions for:
   - no unintended horizontal overflow,
   - no overlapping controls/cards,
   - elements staying inside their intended container/viewport,
   - mobile inputs at least 16 px when iOS focus zoom is a risk,
   - expected viewport scale after focusing/editing,
   - visibility and usable placement of interactive controls.
   Keep regression tests focused on the bug/request; do not expand the full suite unnecessarily.

## Publishing and final verification

9. **The final intended commit is the one that must pass full verification.**
   After implementation:
   - Confirm all requested checklist items individually.
   - Confirm obsolete/replaced code is gone.
   - Confirm temporary/debug files are gone.
   - Confirm cache/version references point to the intended files.
   - Run/confirm relevant syntax, unit, and browser checks.
   - For UI work, inspect the final screenshot artifact(s).
   - Confirm the expected final commit is on the intended branch.
   - Wait for the relevant GitHub Pages/deployment workflow for that **final commit** to finish successfully.
   - Do not describe a change as live/published while deployment is queued or in progress.
   - If deployment or final browser verification fails, investigate and fix it before claiming completion.

10. **Do not repeat expensive verification without a reason.**
    - One complete WebKit/browser run on the final intended commit is the normal path.
    - Do not trigger/re-run the full visual suite for every individual file edit.
    - Re-run only when code affecting the result changed or a previous verification failed.
    - Prefer focused regression checks plus the existing broader suite rather than duplicating equivalent tests.

## Final-response gate

For final verification after the style is settled (not design iterations), confirm:

- [ ] This file was read before making changes.
- [ ] Latest relevant files and repository state were inspected.
- [ ] The request was handled as one coherent checklist.
- [ ] No unnecessary patch-on-patch or obsolete logic remains.
- [ ] Related edits were batched into as few commits as practical.
- [ ] Relevant syntax/static/unit checks passed.
- [ ] Final diff was reviewed.
- [ ] If UI was affected: a real final browser screenshot was captured **and visually inspected**.
- [ ] If UI was affected: target viewport/browser geometry checks passed where relevant.
- [ ] The final intended commit is on the intended branch.
- [ ] GitHub Pages/deployment for that final commit completed successfully.
- [ ] Only then is the final completion answer sent.
