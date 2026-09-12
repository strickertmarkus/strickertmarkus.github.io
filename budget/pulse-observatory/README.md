# Pulse Observatory

Preview: `/budget/pulse-observatory/exercise.html` (append `?user=maja` for Maja).

A separate training overview with a crimson horizon, fine orbital traces, glowing symbols, a next-workout action and a horizontal seven-day timeline. PR groups, sparklines, the expanded training log, charts, and overview editors share the same theme. No snapshot link is displayed.

## Implementation

- `observatory.css` owns this page's environment and responsive composition. All imagery is rendered with CSS/SVG.
- `../pulse-environment/environment.css` owns shared overview, record, log and editor materials; orbit positioning is scoped specifically to Reactor.
- `../pulse-environment/environment.js` reads the existing plan, selects a day, invokes original builder/session handlers and styles overview Chart.js instances without changing their values, labels or numeric bounds.
- `exercise.html` retains the original data/session runtime, control IDs and complete session markup. Its legacy ripple bootstrap excludes the Observatory hero, whose motion is owned by the scene CSS. The base URL resolves shared assets under `budget/`. The preview auth loader preserves its full route on sign-in.
- Both previews use the existing profile-specific training data. They are presentation previews, not separate data stores. Editing a workout updates that profile's real records.
- Original training, training mode, Stretch and Meditation files are unchanged.

## Checkpoints

- `checkpoint/pulse-reactor-core` — `bce6c71`: state before Observatory.
- `checkpoint/pulse-observatory-core` — `8f09660`: Observatory composition and shared data/editor theme.
- `checkpoint/pulse-observatory-v1`: completed, verified preview.

## Verification

- Chromium with local synthetic fixtures and stubbed Firebase; no real account data used.
- 320, 390, 768 and 1440 px: no page-level horizontal overflow. History tables retain their own horizontal scrolling.
- Chart datasets and explicit numeric scale settings compared with the original: identical.
- Planned-workout builder, individual log exercise editor, record expansion, keyboard day selection, empty-day builder and original session launch checked.
- Opening/editing views and leaving an unsaved session do not change stored workout data after the shared runtime's initial normalization.
- CSS and JavaScript syntax checked; original controls/inline scripts/session markup compared; new CSS does not target session descendants.
- Reduced motion disables decorative animation; decorative motion pauses offscreen, on hidden tabs and during sessions.

Known baseline issue: leaving a session in the local Chromium fixture reproduces a `chart-hr-combined` canvas-reuse error in shared `exercise-points-8-9.js`. It occurs on the original page as well as both previews. This change leaves that training runtime untouched. Physical iPhone/Safari validation is still recommended before promoting the design.

## Observatory motion (v2)

The horizon highlight and orbiting spark reuse their SVG geometry through `<use>`; star shimmer, atmosphere and action glow are CSS animations. The shared presentation adapter's existing visibility/session observers set one inherited animation state. There is no added JavaScript frame loop or duplicate scene renderer. The hero is excluded from the old inline ripple bootstrap so it does not install competing click effects or clip the glow.

Three hero arrows are native SVGs, avoiding iOS emoji substitution. The mobile composition keeps the scene visible while moving the next-workout action into the first screen and reducing unused vertical space. The metrics transition follows immediately after the action.

Verified in Chromium: moving dash offsets and glow opacity, pause offscreen, simulated hidden-document pause, workout pause/resume, static reduced-motion view, unchanged stored workouts, and no horizontal overflow at 320/390/768/1440 px. No new console errors beyond the known shared chart error. Before this change: `checkpoint/pulse-observatory-v1` (`3fa6447`). New checkpoint: `checkpoint/pulse-observatory-motion-v2` (`3fa6447` before this update).

### Legacy cleanup still outstanding

The shared auth loader still brings in earlier visual/runtime modules. For example, `exercise-pulse-flow-motion-v67.js` mixes header rendering and session timer rendering in a continuous `requestAnimationFrame` loop. This update does not claim to remove that chain. Before promoting Observatory, separate overview presentation, data operations and active-session lifecycle, then remove superseded modules at their load/ownership boundary with regression checks. Do not hide or continually undo their effects in another observer.
