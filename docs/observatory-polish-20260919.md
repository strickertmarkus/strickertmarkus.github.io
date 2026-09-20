# Observatory prototype checkpoints

Baseline: `ea454a566697c22db462c5abde54b734da86b511`
Remote restore branch: `checkpoint/observatory-before-polish-20260919`.

Scope: Observatory dashboard and its editors. No session, timer, ECG, workout persistence or Zen changes. Full checks and visual review follow implementation, as requested.

- [x] 1–2: next workout hierarchy; readable start orb and contextual builder action.
- [x] 3–4: readable typography and mobile composition.
- [x] 5–6: coordinated motion and restrained light.
- [x] 7–8: alignment, spacing and typography.
- [x] 9–10: shared surfaces and colour roles.
- [x] 11–12: independent week states; record/log rhythm.
- [x] 13 + 15: chart interaction, empty/loading states and interaction polish.
- Excluded: point 14 and session-related parts of all other points.

Each pair is one commit. To compare, use the baseline branch; to undo after publication, revert the checkpoint commits in reverse order, preserving unrelated later changes.

## Validation

- 125 Node checks pass, including chart units, touch configuration, empty data and preserved heart-rate ranges/pace formatting.
- All three changed CSS owners parse; changed JavaScript and CI script parse.
- Canonical exercise inline runtime, base CSS and session markup were preserved. No workout/session persistence owner was changed.
- Existing isolated WebKit workflow now covers empty/planned states at 320/390/1440 px, builder, orbit, expanded log, chart touch, reduced motion and the existing Compact/Zen checks. Screenshots are retained as the `observatory-visual-review` workflow artifact. WebKit run `35497152675` passed. Reviewed empty/planned mobile and desktop screenshots, orbit, log, charts and settled builder dialogs. Visual review also corrected navigation alignment.

- The WebKit fixture uses isolated local workout data, mocked Firebase and real Chart.js 4.4.4. It uses system font fallbacks; production authentication, physical iPhone behavior and a full security audit are outside this prototype check.
- Transition checks wait for settled states; the final return-to-Training font audit includes the same transition settling as initial mode switches.
