# Meditation v34: repair cut-out rocks and restore a small waterfall

Base: `223eedb9034a9612453676efed5e63c9b4d2bd90`.
Checkpoint: `checkpoint/zen-before-rock-waterfall-v34`.

The v33 `maskBamboo` function erased fixed 20px-wide vertical rectangles through the entire rock formation and waterfall. Those rectangles did not follow actual leaning, moving stems, producing the broken shapes in the user's screenshot.

## Repair

- `zen-waterfall-v34.js` registers `window.ZenPondRocks.draw` instead of allocating a separate overlay canvas or animation loop.
- `zen-meditation-scene-v34.js` calls it after the background bamboo/water and before the actual foreground bamboo. The renderer uses the same Canvas context, transform and animation time. No destination-out channels remain.
- A late-registration event redraws even when reduced motion is active. Scene lifecycle still controls visibility, background suspension, reduced motion and canvas resolution.
- The upper shelf is lowered and supported by two smaller interlocking stones at the shore; no tall backing monolith.
- The source is offset from the foreground stem. A short, brighter waterfall runs between the lip stones to WATER=575. All strands end at the actual waterline, with splash and ripples there.
- A radial pond wash replaces the rectangular wash, avoiding a visible horizontal panel edge.
- Startring symbol insertion is retained after v31 interactions, using existing v33 CSS. Ring, graph, interaction logic, Stretch and training remain unchanged.

## Checks

JavaScript syntax and all 12 Zen tests passed. Actual scene modules rendered with native Canvas at 320, 390 and 1200px; images inspected. Assertions verify a single scene canvas, source above the pond and shared waterline y=575. Narrow-phone source was adjusted after inspection to clear the bamboo. This is scene-render verification, not a full mobile Safari layout test.
