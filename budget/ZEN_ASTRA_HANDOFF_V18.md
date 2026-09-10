# Zen handoff — v18

Current direction: keep Meditation v16 behavior/visuals intact and continue refining Stretch without changing Zen data/session logic.

## v18 changes
- `zen-stretch-depth-v18.js` replaces the v17 Stretch depth renderer in `zen.html`.
- Stretch now has stronger foreground/midground layering, more pronounced edge depth and a stylized natural tree-detail overlay.
- Tree detailing follows the same wind shear as the v3 tree so bark ridges/knots/root contours stay visually attached.
- Larger foreground fireflies were added with stronger but soft green glow; the older small v3 motes remain as a distant layer.
- `zen-stretch-polish-v18.css` increases Stretch scene separation and aligns the selected-routine/start area vertically between Stretch and Meditation on mobile.
- On mobile both modes use `margin-top:154px` for `.start-area`; this intentionally keeps scenery space while moving the controls slightly lower than v17.

## Guardrails
- Do not re-enable `zen-stretch-depth-v17.js` while v18 is active.
- Keep the Stretch foreground depth strongest near the edges and avoid putting opaque foliage over the hero copy.
- Preserve the current Meditation renderer/waterfall stack.
- Do not write demo data to Firebase/local storage.
- Prefer Safari-safe explicit ternaries and avoid compact syntax that can be parsed ambiguously on older iOS Safari.

## Checkpoint before v18
`adf064820e265daad3aee299e604a04ce470b1d7`

Checkpoint branch: `checkpoint/zen-before-stretch-depth-v18-20260910`
