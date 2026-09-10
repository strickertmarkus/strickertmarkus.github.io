# Zen v31 — interactive pass surfaces + Meditation start ring

Starting state: `cdfe67b3be3a835b588bef484410e7db17d84513` (Meditation v30 eight-refinement state).
Checkpoint: `checkpoint/zen-before-interactive-rings-v31-20260910`.

## User direction

1. Remove the detached `Anpassa` button. Configuration should come from the surfaces themselves: tapping a pass under `Välj pass` should configure it.
2. Restore the Meditation weekly bar chart to the softer pre-v30 look. The v30 contrast increase was too strong; retain only useful separation between background and objects.
3. Try a circular Meditation `Starta pass` control inspired by the rings used during an active session. Put selected-pass content inside the ring to remove UI/rock collisions.

## Implementation

### `zen-interactions-v31.js`

- Runs after canonical `zen.js`.
- Captures the existing `#selected-edit.onclick` builder hook and then removes the visible `Anpassa` button from the DOM.
- Tapping any `.ritual-choice[data-select]` first lets canonical `zen.js` select/rerender that pass, then opens the existing builder for the newly selected pass.
- The card listener runs in capture phase and defers the builder call with `setTimeout(..., 0)` because canonical `renderHome()` replaces the card DOM during bubbling.
- Built-in templates therefore open as configurable copies using the existing `openBuilder()` behavior; custom templates continue to edit in place.
- Stretch selected-routine summary itself is keyboard/click-configurable.
- Selected pass name/meta are mirrored into the Meditation start ring and kept synchronized with MutationObserver.

### `zen-interactive-rings-v31.css`

- Hides `#selected-edit` immediately to prevent flash before JS removes it.
- Hides redundant custom-card `Redigera`; `Ta bort` remains available.
- Restores Meditation `day-fill`, empty track, day labels and supporting labels to the softer pre-v30 formula from `zen-effects-v4.css`.
- Does not remove the useful v30 page/background separation.
- Meditation hides the old `.selected-routine` row and turns `#start-button` into a breathing-ring-inspired circular CTA.
- Ring contains `Starta pass`, selected pass name, duration/guidance metadata and a small arrow.
- Warm morning-sun border/glow and a slow 6.2 s breathing outer ring. `prefers-reduced-motion` disables animation.
- Stretch keeps its rectangular CTA and v29 scenery styling.

## Active load order

`zen.html` loads:

- canonical v30 scene/waterfall/`zen.js`
- `zen-effects-v4.js`
- `zen-interactions-v31.js`
- v30 CSS
- `zen-interactive-rings-v31.css` last

This is intentional: v31 is a narrow behavioral/style layer over v30 rather than a rewrite of storage, session or builder logic.

## Validation

- `main` Pages deployment for v31 completed successfully.
- JavaScript syntax check passed before finalizing.
- Diff from v30 is limited to `zen.html`, `zen-interactions-v31.js`, `zen-interactive-rings-v31.css`, plus this handoff.
- Full live-browser visual inspection could not be performed from the assistant container because the environment blocks the GitHub Pages domain. Mobile visual verification must therefore be done on the user's iPhone before further spacing/ring-size polish.
