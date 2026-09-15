# Training / Pulse Observatory — Checkpoint 4 mobile composition audit

Baseline: `ee123a83210a0cf0380178a83bfce8ef431eec8f`
Rollback branch: `checkpoint/training-observatory-cp4-before-mobile-polish-2026-09-15`

## Goal

Checkpoint 4 keeps the approved Observatory mobile visual identity and changes only the information density/hierarchy required by the migration checklist.

No workout/session runtime, storage, chart ownership or desktop Observatory composition is changed here.

## Current structure entering Checkpoint 4

Checkpoint 1 had already moved the production weekly plan high in the real `budget/exercise.html` DOM. The production order is:

1. Observatory hero / next workout
2. summary metrics
3. weekly plan
4. goals and the remaining sections

The large `Lägg till pass` Observatory CTA is also already absent from the production weekly-plan markup. Contextual editing remains through the week/day interactions plus `Redigera` and `Mallpass`.

Because of that, Checkpoint 4 does not duplicate or reorder sections again. The remaining mobile problem was vertical density: the summary still became a 2 x 2 grid and the hero/next-workout field reserved more height than needed, pushing the already-correct weekly-plan section down the viewport.

## Changes

### One-row mobile summary

At `max-width:760px`, the four existing summary metrics now stay in one four-column row:

- Denna vecka
- Totalt pass
- Tid vecka
- Senaste pass

The row uses the existing Observatory open/transparent material rather than introducing new cards. Columns use `minmax(0,1fr)`, zero grid gap, bounded internal padding and clipped/no-wrap values so 320 / 375 / 390 px layouts do not create horizontal document overflow.

The two low-information helper captions (`alla tider` and `summerad träningstid`) are visually suppressed on mobile while the useful goal/latest-workout context remains.

### Weekly plan moves up without a second layout owner

The existing DOM order stays authoritative. Instead of adding CSS `order`, cloned markup or another mobile-only planner, the top composition is made materially shorter:

- Observatory heading spacing is tightened slightly.
- Next-workout field mobile minimum height changes from 300 px to 252 px.
- Next-workout top spacing is reduced.
- Summary changes from two rows to one.
- Summary vertical padding is reduced.
- Gap before weekly planning changes from 30 px to 16 px.
- Week toolbar/day cells are slightly denser while preserving the seven real interactive day nodes.

This brings the real weekly plan substantially higher while keeping the approved visual hierarchy and one source of truth.

### Add/edit behavior

Production `exercise.html` contains no `observatory-add` / `Lägg till pass` button in the weekly-plan section. The mobile composition also explicitly hides that legacy preview-only CTA so the old preview cannot visually reintroduce it at mobile widths.

Workout creation/editing remains available through:

- tapping/selecting real week-day nodes;
- `Redigera`;
- `Mallpass`;
- the existing shared week builder/plan handlers.

## Verification

`budget/tests/training-observatory-mobile.test.cjs` checks:

1. mobile summary is exactly a four-column Observatory row rather than 2 x 2;
2. 320 / 375 / 390 px have a safe four-column width budget under the existing 90% Observatory content width;
3. production hierarchy remains hero -> metrics -> week -> goals;
4. the weekly-plan section contains no large add CTA while contextual editing remains;
5. the preview-only large add CTA is hidden on mobile;
6. the Observatory CSS stays brace-balanced.

Checkpoint 3 shared-session tests are also rerun to ensure this presentation-only change does not alter live workout ownership.

## Exit condition

Satisfied when both the Checkpoint 4 mobile contract and Checkpoint 3 shared-session regression tests pass on the committed tree and GitHub Pages deploys the final commit successfully.
