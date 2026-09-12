# Pulse Observatory

Preview: `/budget/pulse-observatory/exercise.html` (append `?user=maja` for Maja).

A separate training overview with a crimson horizon, fine orbital traces, glowing symbols, a next-workout action and a horizontal seven-day timeline. PR groups, sparklines, the expanded training log, charts, and overview editors share the same theme. No snapshot link is displayed.

## Implementation

- `observatory.css` owns this page's environment and responsive composition. All imagery is rendered with CSS/SVG.
- `../pulse-environment/environment.css` owns shared overview, record, log and editor materials; orbit positioning is scoped specifically to Reactor.
- `../pulse-environment/environment.js` reads the existing plan, selects a day, invokes original builder/session handlers and styles overview Chart.js instances without changing their values, labels or numeric bounds.
- `exercise.html` retains the original inline runtime, control IDs and complete session markup. The base URL resolves shared assets under `budget/`. The preview auth loader preserves its full route on sign-in.
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
