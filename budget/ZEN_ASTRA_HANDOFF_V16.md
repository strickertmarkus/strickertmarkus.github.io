# Zen handoff v16

Current direction: keep the bright Meditation scene, but treat Stretch as the reference for glow placement/amount. Meditation uses warm morning-sun yellow instead of green.

## v16 changes
- `◌` is optically balanced everywhere it appears in Meditation: the second preset in Välj pass, the first statistics glyph and the first milestone glyph. Its halo is intentionally slightly weaker than v14 so it does not dominate on iPhone.
- The translucent/opaque backing behind `andning & närvaro.` is removed. Readability now comes from the gold text color + compact text glow only.
- Waterfall keeps the v13 rock bank, with a new `zen-waterfall-mouth-v16.js` overlay that makes the water originate inside a recessed dark cavity, travel briefly inside the opening, fold over the lower lip and then connect to the vertical v13 cascade. A front stone rim is rendered after the inner water to create real occlusion.
- `zen-waterfall-v16.js` was an abandoned draft and has been deleted; do not restore it.

## Active v16 assets
- `zen-refine-v16.css`
- `zen-waterfall-mouth-v16.js`
- `zen.html` loads both with `20260910-refine-v16` cache keys.

## Guardrails
- Do not add a background pill behind the Meditation subtitle.
- Do not increase the `◌` halo globally; balance it locally because its dotted glyph has much less filled area than `✧`, `⌁` and `≈`.
- Do not replace the v13 waterfall with separate floating rock shapes. Preserve one coherent bank and use occlusion to make the water source physically believable.
