# Pulse Flow environment preview

Separate route: `/budget/pulse-environment/exercise.html`.
Maja's profile: append `?user=maja`.
The production overview remains at `/budget/exercise.html`.

## Checkpoints

- `checkpoint/training-before-pulse-environment` — `9c8ab9176b6c4b56aa53bd4c4fe630c665174cab`, the original training page and mode before this work.
- `checkpoint/pulse-environment-overview` — `9b21c1249d8e73ecc3e6eda984c5992f2ffe5da2`, the first separate overview layout.
- `checkpoint/pulse-environment-v1` — the complete first version, including editors.

## Ownership and data

`exercise.html` preserves the original inline runtime, data-control IDs, charts and session markup. Its new section wrappers and `environment.css` own the overview presentation. The stylesheet also covers the seven overview dialogs, the dynamic exercise editor, plan preview, drag clone and navigation menu. Editor styling is disabled when the session is open.

The `<base href="../">` resolves the shared Firebase, chart, navigation and training scripts to the existing files under `budget/`. Keeping the filename `exercise.html` preserves the runtime's exercise-page detection and profile-specific storage keys. Both pages read and save the **same real training data**; this is a design preview, not a separate data sandbox.

`auth-gate.js` is the baseline loader with only the login redirect adjusted to preserve the complete preview path and explicitly resolve the login URL against the base. Authentication and access checks are unchanged. Keep this loader aligned with the original when its script list changes.

`environment.js` draws the abstract light field and adjusts overview navigation. It never writes training data or replaces a session handler. Rendering is capped at 25 fps and approximately 1.5 million pixels, and pauses when hidden, offscreen or inside a workout. Reduced motion uses a still frame.

## Verification

- Original controls, inline runtime and session markup compared with the baseline.
- All local asset paths and both profile links checked.
- JavaScript syntax and all new CSS selectors/declarations parsed.
- New CSS verified not to select the session or its children.
- Actual Canvas renderer exercised at 320, 390 and 1440 px, including its pause and reduced-motion behaviour.
- Shared training, stretch and meditation source files remain unchanged.

These are source and renderer checks; a complete authenticated browser interaction test has not been performed. Review the published route on a phone before promoting its design to the original page.

When updating this preview, follow the root `AGENTS.md`. Keep presentation in these files, and compare any refreshed HTML/runtime copy with the current original instead of adding another script layer.
